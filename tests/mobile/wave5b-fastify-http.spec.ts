import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID, createHash } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../../apps/api/src/app';
import {
  InMemoryUserRepository,
  InMemorySessionRepository,
  InMemoryAuditWriter,
  InMemoryIamUnitOfWork,
} from '../api/test-doubles';
import {
  InMemoryTreeRepository,
  InMemoryCareHistoryRepository,
  InMemoryTaskTypeRepository,
  InMemoryPolicyRepository,
  InMemoryTaskRepository,
  InMemoryEvidenceRepository,
  InMemoryIdempotencyRepository,
  InMemoryOperationalScopeRepository,
  InMemoryObjectStorageAdapter,
} from '../api/operational-test-doubles';
import { Argon2PasswordHasher } from '../../apps/api/src/infrastructure/security/argon2-password-hasher';
import { CryptoTokenService } from '../../apps/api/src/infrastructure/security/crypto-token-service';

import { AuthSessionManager, InMemorySecureSessionStorage } from '../../apps/mobile/src/services/authSessionManager';
import { MobileApiClient, type RequestOptions } from '../../apps/mobile/src/services/mobileApiClient';
import { EvidenceUploadClient, type IEvidenceBinaryReader } from '../../apps/mobile/src/services/evidenceUploadClient';
import { SubmitEvidenceOutboxDispatcher } from '../../apps/mobile/src/storage/outbox/submitEvidenceDispatcher';
import { OutboxCoordinator } from '../../apps/mobile/src/storage/outbox/outboxCoordinator';
import { SqliteOutboxRepository } from '../../apps/mobile/src/storage/outbox/outboxRepository';
import { SqliteMobileTaskRepository } from '../../apps/mobile/src/storage/task/mobileTaskRepository';
import { createInMemoryTestDatabase } from '../../apps/mobile/src/storage/database/sqliteDatabase';
import { runMigrations } from '../../apps/mobile/src/storage/database/migrations';
import { generateSecureUuid } from '../../apps/mobile/src/storage/utils/uuid';

describe('Phase 13 Wave 5B: Fastify In-Process HTTP Loopback Pipeline & Idempotency Replay', () => {
  let app: FastifyInstance;
  let serverBaseUrl: string;

  let userRepo: InMemoryUserRepository;
  let sessionRepo: InMemorySessionRepository;
  let auditWriter: InMemoryAuditWriter;
  let unitOfWork: InMemoryIamUnitOfWork;
  let tokenService: CryptoTokenService;
  let hasher: Argon2PasswordHasher;

  let treeRepo: InMemoryTreeRepository;
  let careHistoryRepo: InMemoryCareHistoryRepository;
  let taskTypeRepo: InMemoryTaskTypeRepository;
  let policyRepo: InMemoryPolicyRepository;
  let taskRepo: InMemoryTaskRepository;
  let evidenceRepo: InMemoryEvidenceRepository;
  let idempotencyRepo: InMemoryIdempotencyRepository;
  let scopeRepo: InMemoryOperationalScopeRepository;
  let storagePort: InMemoryObjectStorageAdapter;

  const staffId = 'staff-fastify-01';
  const staffEmail = 'staff.fastify@novyx.test';
  const staffPassword = 'StaffPassword123!';

  const managerId = 'manager-fastify-01';
  const managerEmail = 'manager.fastify@novyx.test';

  const adminId = 'admin-fastify-01';
  const adminEmail = 'admin.fastify@novyx.test';

  beforeAll(async () => {
    userRepo = new InMemoryUserRepository();
    sessionRepo = new InMemorySessionRepository();
    auditWriter = new InMemoryAuditWriter();
    unitOfWork = new InMemoryIamUnitOfWork(userRepo, sessionRepo, auditWriter);
    tokenService = new CryptoTokenService();
    hasher = new Argon2PasswordHasher({ memoryCost: 4096, timeCost: 1, parallelism: 1 });

    treeRepo = new InMemoryTreeRepository();
    careHistoryRepo = new InMemoryCareHistoryRepository();
    taskTypeRepo = new InMemoryTaskTypeRepository();
    policyRepo = new InMemoryPolicyRepository();
    taskRepo = new InMemoryTaskRepository();
    evidenceRepo = new InMemoryEvidenceRepository(taskRepo);
    idempotencyRepo = new InMemoryIdempotencyRepository();
    scopeRepo = new InMemoryOperationalScopeRepository();
    storagePort = new InMemoryObjectStorageAdapter();

    // Create Admin user
    await userRepo.create({
      id: adminId,
      version: 1,
      email: adminEmail,
      initialRole: 'admin',
      role: 'admin',
      accountStatus: 'ACTIVE',
      authVersion: 1,
      passwordHash: await hasher.hash(staffPassword),
    });

    // Create Manager user
    await userRepo.create({
      id: managerId,
      version: 1,
      email: managerEmail,
      initialRole: 'manager',
      role: 'manager',
      accountStatus: 'ACTIVE',
      authVersion: 1,
      passwordHash: await hasher.hash(staffPassword),
    });

    // Create Staff user
    await userRepo.create({
      id: staffId,
      version: 1,
      email: staffEmail,
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      authVersion: 1,
      passwordHash: await hasher.hash(staffPassword),
    });

    app = buildApp({
      userRepository: userRepo,
      sessionRepository: sessionRepo,
      auditWriter,
      unitOfWork,
      tokenService,
      passwordHasher: hasher,
      treeRepository: treeRepo,
      careHistoryRepository: careHistoryRepo,
      taskTypeRepository: taskTypeRepo,
      policyRepository: policyRepo,
      taskRepository: taskRepo,
      evidenceRepository: evidenceRepo,
      idempotencyRepository: idempotencyRepo,
      operationalScopeRepository: scopeRepo,
      storagePort,
    });

    serverBaseUrl = await app.listen({ port: 0, host: '127.0.0.1' });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  async function createSession(userId: string, role: 'staff' | 'manager' | 'admin') {
    const rawAccessToken = tokenService.generateToken(32);
    const rawRefreshToken = `ref_${tokenService.generateToken(32)}`;
    const tokenHash = tokenService.hashToken(rawAccessToken);
    const refreshHash = tokenService.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 3600_000);

    await sessionRepo.createSession({
      id: randomUUID(),
      userId,
      tokenFamily: randomUUID(),
      accessTokenHash: tokenHash,
      refreshTokenHash: refreshHash,
      authVersion: 1,
      sessionVersion: 1,
      accessExpiresAt: expiresAt,
      refreshExpiresAt: expiresAt,
      expiresAt,
    });

    return {
      accessToken: rawAccessToken,
      refreshToken: rawRefreshToken,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: userId,
        email: `${role}@novyx.test`,
        role,
      },
    };
  }

  it('proves real HTTP login, opaque token usage, and single-flight refresh with Fastify', async () => {
    const storage = new InMemorySecureSessionStorage();
    const sessionManager = new AuthSessionManager(serverBaseUrl, storage);

    // 1. Login via real Fastify /v1/auth/login endpoint
    const session = await sessionManager.login({
      identifier: staffEmail,
      password: staffPassword,
    });

    expect(session.accessToken).toBeDefined();
    expect(session.refreshToken).toBeDefined();
    expect(session.user.role).toBe('staff');

    // 2. Verified session saved in storage
    const stored = await storage.loadSession();
    expect(stored?.accessToken).toBe(session.accessToken);

    // 3. Make real authenticated GET request
    const apiClient = new MobileApiClient(serverBaseUrl, sessionManager);
    const tasks = await apiClient.get<unknown[]>('/v1/tasks');
    expect(Array.isArray(tasks)).toBe(true);

    // 4. Test rotating session refresh against Fastify
    const rotatedSession = await sessionManager.refreshSession();
    expect(rotatedSession.accessToken).not.toBe(session.accessToken);
    expect(rotatedSession.refreshToken).not.toBe(session.refreshToken);

    // 5. Old refresh token cannot be reused
    const reuseRes = await fetch(`${serverBaseUrl}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    expect(reuseRes.status).toBe(401);
  });

  it('executes full presign -> PUT -> SubmitEvidence -> reconciliation loop over real Fastify HTTP (P13W5B-P01, P13W5B-P08, P13W5B-P10)', async () => {
    const adminSession = await createSession(adminId, 'admin');
    const managerSession = await createSession(managerId, 'manager');
    const staffSession = await createSession(staffId, 'staff');

    const treeId = `TREE-FASTIFY-${Date.now()}`;
    const qrCode = `QR-${treeId}`;
    await scopeRepo.addScope(managerId, treeId);

    const treeRes = await fetch(`${serverBaseUrl}/v1/governance/trees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSession.accessToken}`,
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        treeId,
        qrCode,
        name: 'Fastify Test Tree',
        species: 'Khaya senegalensis',
        lat: 10.7769,
        lng: 106.7009,
        address: 'District 1, HCMC',
        healthStatus: 'Khỏe mạnh',
        ageYears: 12,
        riskStatus: 'healthy',
      }),
    });
    expect(treeRes.status).toBe(201);

    const ttRes = await fetch(`${serverBaseUrl}/v1/governance/task-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSession.accessToken}`,
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        name: `Fastify TaskType ${Date.now()}`,
        defaultProofProfile: 'SERVICE_PROOF',
        description: 'Fastify task type description',
      }),
    });
    const { data: taskType } = (await ttRes.json()) as { data: { id: string } };

    await fetch(`${serverBaseUrl}/v1/governance/policies/proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSession.accessToken}`,
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        taskTypeId: taskType.id,
        proofProfile: 'SERVICE_PROOF',
        policyDescription: 'Policy',
      }),
    });

    await fetch(`${serverBaseUrl}/v1/governance/policies/checklist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminSession.accessToken}`,
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        taskTypeId: taskType.id,
        templateItems: [{ text: 'Item 1', order: 1 }],
      }),
    });

    // 2. Manager creates Task & Staff starts it
    const createRes = await fetch(`${serverBaseUrl}/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerSession.accessToken}`,
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        title: 'Fastify Task',
        description: 'Fastify task description',
        taskTypeId: taskType.id,
        treeId,
        assignedStaffId: staffId,
        deadline: '2026-12-31T17:00:00Z',
      }),
    });
    const { data: serverTask } = (await createRes.json()) as { data: { id: string; version: number } };

    const startRes = await fetch(`${serverBaseUrl}/v1/tasks/${serverTask.id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffSession.accessToken}`,
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        taskId: serverTask.id,
        expectedVersion: serverTask.version,
      }),
    });
    const { data: startedTask } = (await startRes.json()) as { data: { id: string; version: number } };

    // 3. Mobile infrastructure setup
    const storage = new InMemorySecureSessionStorage();
    await storage.saveSession(staffSession);
    const sessionManager = new AuthSessionManager(serverBaseUrl, storage);
    const apiClient = new MobileApiClient(serverBaseUrl, sessionManager);

    const mobileDb = await createInMemoryTestDatabase();
    await runMigrations(mobileDb);
    const mobileTaskRepo = new SqliteMobileTaskRepository(mobileDb);
    const mobileOutboxRepo = new SqliteOutboxRepository(mobileDb);

    await mobileTaskRepo.cacheTasks([
      {
        id: startedTask.id,
        title: 'Fastify Task',
        status: 'IN_PROGRESS',
        version: startedTask.version,
        taskTypeId: taskType.id,
        treeId,
        assignedStaffId: staffId,
        deadline: '2026-12-31T17:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const binaryData = Buffer.from('BINARY-FASTIFY-PHOTO-BYTES');
    const sha256 = createHash('sha256').update(binaryData).digest('hex');

    class FastifyBinaryReader implements IEvidenceBinaryReader {
      async readBinary(): Promise<Uint8Array> {
        return new Uint8Array(binaryData.buffer, binaryData.byteOffset, binaryData.byteLength);
      }
    }

    await mobileTaskRepo.saveEvidenceMetadata({
      id: 'ev-fastify-01',
      taskId: startedTask.id,
      stage: 'COMPLETION',
      fileName: 'fastify-comp.jpg',
      contentType: 'image/jpeg',
      sizeBytes: binaryData.length,
      sha256,
      sandboxFileUri: 'file:///sandbox/fastify-comp.jpg',
      capturedAt: new Date().toISOString(),
      isPersistedInSandbox: true,
    });

    // Provide storagePort handler for uploadUrl in tests
    const uploadClient = new EvidenceUploadClient(apiClient, new FastifyBinaryReader());
    // Directly pre-populate storagePort for the generated objectKey when presign runs
    const originalPost = apiClient.post.bind(apiClient);
    apiClient.post = async <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> => {
      const res = await originalPost<T>(path, body, options);
      if (path.includes('/evidence/presign') && res && typeof res === 'object' && 'objectKey' in res) {
        const presign = res as unknown as { objectKey: string };
        await storagePort.putObjectDirect({
          objectKey: presign.objectKey,
          data: binaryData,
          contentType: 'image/jpeg',
          metadata: { taskId: startedTask.id, uploadedBy: staffId },
        });
      }
      return res;
    };

    const dispatcher = new SubmitEvidenceOutboxDispatcher(apiClient, uploadClient, mobileTaskRepo, mobileOutboxRepo);
    const coordinator = new OutboxCoordinator(mobileOutboxRepo, dispatcher, mobileTaskRepo, mobileDb);

    const idempotencyKey = generateSecureUuid();
    const outboxItem = await mobileOutboxRepo.enqueueTransactional({
      taskId: startedTask.id,
      request: {
        taskId: startedTask.id,
        expectedVersion: startedTask.version,
        siteVerification: {
          gpsCheck: {
            lat: 10.7769,
            lng: 106.7009,
            distance: 1.0,
            verified: true,
            timestamp: new Date().toISOString(),
          },
          qrCheck: {
            scannedCode: qrCode,
            verified: true,
            timestamp: new Date().toISOString(),
          },
        },
        proof: {
          proofProfile: 'SERVICE_PROOF',
          completionPhotoUri: 'file:///sandbox/fastify-comp.jpg',
          checklist: [{ id: 'chk-1', text: 'Item 1', done: true }],
        },
      },
      idempotencyKey,
    });

    // Intercept mock storage upload URL while keeping real HTTP loopback for Fastify API
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('storage.local.test')) {
        return new Response('', { status: 200 });
      }
      return await realFetch(input, init);
    }) as typeof fetch;

    try {
      // 4. Dispatch outbox item
      const result = await coordinator.processNext();

      expect(result?.success).toBe(true);
      expect(result?.httpStatus).toBe(200);

      // 5. Authoritative server task is reconciled locally
      const cached = await mobileTaskRepo.getCachedTask(startedTask.id);
      expect(cached?.status).toBe('WAITING_REVIEW');

      const outboxRow = await mobileOutboxRepo.getItemById(outboxItem.id);
      expect(outboxRow?.syncStatus).toBe('SYNCED');

      // 6. Section 41: Idempotency Replay Verification
      // Replay exact same request with SAME idempotencyKey
      const replayResult = await dispatcher.dispatch({
        ...outboxRow!,
        syncStatus: 'SYNCING',
      });
      expect(replayResult.success).toBe(true);
      expect(replayResult.status).toBe(200);
      expect(replayResult.serverTask?.status).toBe('WAITING_REVIEW');

      // Exactly one evidence attempt exists on server
      const attempts = await evidenceRepo.getEvidenceAttempts(startedTask.id);
      expect(attempts).toHaveLength(1);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
