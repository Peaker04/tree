import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { randomUUID, createHash } from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { AuthSession } from '@novyx/contracts';

import { buildApp } from '../../apps/api/src/app';
import { DrizzleUserRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-user-repository';
import { DrizzleSessionRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-session-repository';
import { DrizzleManagerScopeRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-manager-scope-repository';
import { CryptoTokenService } from '../../apps/api/src/infrastructure/security/crypto-token-service';
import { S3ObjectStorageAdapter } from '../../apps/api/src/infrastructure/storage/s3-object-storage';
import * as schema from '../../apps/api/src/infrastructure/persistence/schema';

import { AuthSessionManager, InMemorySecureSessionStorage } from '../../apps/mobile/src/services/authSessionManager';
import { MobileApiClient, MobileApiError, type RequestOptions } from '../../apps/mobile/src/services/mobileApiClient';
import { EvidenceUploadClient, type IEvidenceBinaryReader } from '../../apps/mobile/src/services/evidenceUploadClient';
import { SubmitEvidenceOutboxDispatcher } from '../../apps/mobile/src/storage/outbox/submitEvidenceDispatcher';
import { OutboxCoordinator } from '../../apps/mobile/src/storage/outbox/outboxCoordinator';
import { SqliteOutboxRepository } from '../../apps/mobile/src/storage/outbox/outboxRepository';
import { SqliteMobileTaskRepository } from '../../apps/mobile/src/storage/task/mobileTaskRepository';
import { createInMemoryTestDatabase } from '../../apps/mobile/src/storage/database/sqliteDatabase';
import { runMigrations } from '../../apps/mobile/src/storage/database/migrations';
import { generateSecureUuid } from '../../apps/mobile/src/storage/utils/uuid';

const { Pool } = pg;

describe('Phase 13 Wave 5B: Real Infrastructure Integration (PostgreSQL + MinIO + Fastify + Mobile REST)', () => {
  const migrationUrl = process.env['DATABASE_MIGRATION_URL'];
  const runtimeUrl = process.env['DATABASE_RUNTIME_URL'];
  const hasDatabase = Boolean(migrationUrl && runtimeUrl);

  const s3Endpoint = process.env['S3_ENDPOINT'];
  const hasS3 = Boolean(s3Endpoint);

  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let userRepo: DrizzleUserRepository;
  let sessionRepo: DrizzleSessionRepository;
  let scopeRepo: DrizzleManagerScopeRepository;
  let tokenService: CryptoTokenService;
  let storageAdapter: S3ObjectStorageAdapter;
  let app: FastifyInstance;
  let serverBaseUrl: string;

  async function createAuthenticatedUser(role: 'admin' | 'manager' | 'staff') {
    const userId = randomUUID();
    const email = `${role}-${Date.now()}-${randomUUID().slice(0, 6)}@novyx.test`;
    await userRepo.create({
      id: userId,
      version: 0,
      email,
      initialRole: role,
      role,
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });

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
      userId,
      email,
      role,
      accessToken: rawAccessToken,
      refreshToken: rawRefreshToken,
      expiresAt: expiresAt.toISOString(),
    };
  }

  beforeAll(async () => {
    if (hasDatabase && runtimeUrl && hasS3) {
      pool = new Pool({ connectionString: runtimeUrl });
      db = drizzle(pool, { schema });
      userRepo = new DrizzleUserRepository(db);
      sessionRepo = new DrizzleSessionRepository(db);
      scopeRepo = new DrizzleManagerScopeRepository(db);
      tokenService = new CryptoTokenService();

      storageAdapter = new S3ObjectStorageAdapter({
        endpoint: s3Endpoint,
        region: process.env['S3_REGION'] || 'us-east-1',
        bucket: process.env['S3_BUCKET'] || 'novyx-evidence',
        accessKeyId: process.env['S3_ACCESS_KEY_ID'] || 'minioadmin',
        secretAccessKey: process.env['S3_SECRET_ACCESS_KEY'] || 'minioadminpassword',
        forcePathStyle: true,
      });

      app = buildApp({
        pool,
        storagePort: storageAdapter,
      });

      // Bind Fastify to an ephemeral local port for real HTTP loopback transport
      serverBaseUrl = await app.listen({ port: 0, host: '127.0.0.1' });
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (pool) {
      await pool.end();
    }
  });

  // =========================================================================
  // SECTION 42: REAL INTEGRATION TEST
  // =========================================================================
  it.runIf(hasDatabase && hasS3)(
    'executes real Postgres + MinIO + Fastify + Mobile REST Outbox Dispatch pipeline (P13W5B-P13)',
    async () => {
      // 1. Create real users in PostgreSQL
      const admin = await createAuthenticatedUser('admin');
      const manager = await createAuthenticatedUser('manager');
      const staff = await createAuthenticatedUser('staff');

      const treeId = `TREE-W5B-${Date.now()}`;
      const qrCode = `QR-${treeId}`;
      await scopeRepo.addScope(manager.userId, treeId);

      // 2. Admin creates Tree via HTTP
      const treeRes = await fetch(`${serverBaseUrl}/v1/governance/trees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admin.accessToken}`,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          treeId,
          qrCode,
          name: 'Real Infra Tree Wave 5B',
          species: 'Dipterocarpus alatus',
          lat: 10.7769,
          lng: 106.7009,
          address: 'Gia Dinh Park, Ward 3, Go Vap, HCMC',
          healthStatus: 'Khỏe mạnh',
          ageYears: 15,
          riskStatus: 'healthy',
        }),
      });
      expect(treeRes.status).toBe(201);

      // 3. Admin creates TaskType & Policy
      const taskTypeRes = await fetch(`${serverBaseUrl}/v1/governance/task-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admin.accessToken}`,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          name: `Pruning Wave 5B ${Date.now()}`,
          defaultProofProfile: 'SERVICE_PROOF',
          description: 'Wave 5B service proof task',
        }),
      });
      expect(taskTypeRes.status).toBe(201);
      const { data: taskType } = (await taskTypeRes.json()) as { data: { id: string } };

      const policyRes = await fetch(`${serverBaseUrl}/v1/governance/policies/proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admin.accessToken}`,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          taskTypeId: taskType.id,
          proofProfile: 'SERVICE_PROOF',
          policyDescription: 'Requires completion photo and checklist',
        }),
      });
      expect(policyRes.status).toBe(201);

      const templateRes = await fetch(`${serverBaseUrl}/v1/governance/policies/checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admin.accessToken}`,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          taskTypeId: taskType.id,
          templateItems: [{ text: 'Clean surrounding canopy debris', order: 1 }],
        }),
      });
      expect(templateRes.status).toBe(201);

      // 4. Manager creates Task & Staff starts it
      const taskCreateRes = await fetch(`${serverBaseUrl}/v1/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${manager.accessToken}`,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          title: 'Pruning Task Wave 5B',
          description: 'Real infra validation',
          taskTypeId: taskType.id,
          treeId,
          assignedStaffId: staff.userId,
          deadline: '2026-12-31T17:00:00Z',
        }),
      });
      expect(taskCreateRes.status).toBe(201);
      const { data: serverTask } = (await taskCreateRes.json()) as { data: { id: string; version: number } };

      const startRes = await fetch(`${serverBaseUrl}/v1/tasks/${serverTask.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staff.accessToken}`,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          taskId: serverTask.id,
          expectedVersion: serverTask.version,
        }),
      });
      expect(startRes.status).toBe(200);
      const { data: startedTask } = (await startRes.json()) as {
        data: { id: string; status: string; version: number };
      };
      expect(startedTask.status).toBe('IN_PROGRESS');

      // 5. Initialize Mobile Client with Staff Session
      const staffSession: AuthSession = {
        accessToken: staff.accessToken,
        refreshToken: staff.refreshToken,
        expiresAt: staff.expiresAt,
        user: {
          id: staff.userId,
          email: staff.email,
          role: 'staff',
        },
      };

      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession(staffSession);
      const sessionManager = new AuthSessionManager(serverBaseUrl, storage);
      const apiClient = new MobileApiClient(serverBaseUrl, sessionManager);

      // 6. Setup Mobile SQLite Storage
      const mobileDb = await createInMemoryTestDatabase();
      await runMigrations(mobileDb);
      const mobileTaskRepo = new SqliteMobileTaskRepository(mobileDb);
      const mobileOutboxRepo = new SqliteOutboxRepository(mobileDb);

      await mobileTaskRepo.cacheTasks([
        {
          id: startedTask.id,
          title: 'Pruning Task Wave 5B',
          status: 'IN_PROGRESS',
          version: startedTask.version,
          taskTypeId: taskType.id,
          treeId,
          assignedStaffId: staff.userId,
          deadline: '2026-12-31T17:00:00Z',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      // 7. Seed Real Binary Evidence in Mobile sandbox
      const binaryContent = Buffer.from('REAL-BINARY-EVIDENCE-JPEG-DATA-WAVE5B');
      const realSha256 = createHash('sha256').update(binaryContent).digest('hex');

      class RealBufferBinaryReader implements IEvidenceBinaryReader {
        async readBinary(): Promise<Uint8Array> {
          return new Uint8Array(binaryContent.buffer, binaryContent.byteOffset, binaryContent.byteLength);
        }
      }

      await mobileTaskRepo.saveEvidenceMetadata({
        id: 'ev-real-01',
        taskId: startedTask.id,
        stage: 'COMPLETION',
        fileName: 'completion.jpg',
        contentType: 'image/jpeg',
        sizeBytes: binaryContent.length,
        sha256: realSha256,
        sandboxFileUri: 'file:///sandbox/completion.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      const uploadClient = new EvidenceUploadClient(apiClient, new RealBufferBinaryReader());
      const dispatcher = new SubmitEvidenceOutboxDispatcher(apiClient, uploadClient, mobileTaskRepo, mobileOutboxRepo);
      const coordinator = new OutboxCoordinator(mobileOutboxRepo, dispatcher, mobileTaskRepo, mobileDb);

      // 8. Enqueue SubmitEvidence in local Outbox
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
              distance: 1.5,
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
            completionPhotoUri: 'file:///sandbox/completion.jpg',
            checklist: [{ id: 'chk-1', text: 'Clean surrounding canopy debris', done: true }],
          },
          notes: 'Completed in real test integration',
        },
        idempotencyKey,
      });

      // 9. Execute Outbox Dispatcher
      const dispatchResult = await coordinator.processNext();
      expect(dispatchResult?.success).toBe(true);
      expect(dispatchResult?.httpStatus).toBe(200);

      // 10. Verify Authoritative Server State in PostgreSQL
      const [pgTask] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, startedTask.id));
      expect(pgTask.status).toBe('WAITING_REVIEW');

      // 11. Verify Local Client State Reconciliation
      const cachedTask = await mobileTaskRepo.getCachedTask(startedTask.id);
      expect(cachedTask?.status).toBe('WAITING_REVIEW');

      const completedOutbox = await mobileOutboxRepo.getItemById(outboxItem.id);
      expect(completedOutbox?.syncStatus).toBe('SYNCED');

      // Local evidence remains preserved
      const localEv = await mobileTaskRepo.listEvidenceByTask(startedTask.id);
      expect(localEv).toHaveLength(1);
      expect(localEv[0].sha256).toBe(realSha256);
    },
  );

  // =========================================================================
  // SECTION 41: CRITICAL AMBIGUOUS SUCCESS / IDEMPOTENCY REPLAY TEST
  // =========================================================================
  it.runIf(hasDatabase && hasS3)(
    'replays identical committed response safely when client crashes before local commit (P13W5B-P09, P13W5B-P12)',
    async () => {
      const manager = await createAuthenticatedUser('manager');
      const staff = await createAuthenticatedUser('staff');

      const treeId = `TREE-REPLAY-${Date.now()}`;
      const qrCode = `QR-${treeId}`;
      await scopeRepo.addScope(manager.userId, treeId);

      // Create tree
      const admin = await createAuthenticatedUser('admin');
      await fetch(`${serverBaseUrl}/v1/governance/trees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admin.accessToken}`,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          treeId,
          qrCode,
          name: 'Replay Tree',
          species: 'Dipterocarpus alatus',
          lat: 10.7769,
          lng: 106.7009,
          address: 'Gia Dinh Park',
          healthStatus: 'Khỏe mạnh',
          ageYears: 10,
          riskStatus: 'healthy',
        }),
      });

      const taskTypeRes = await fetch(`${serverBaseUrl}/v1/governance/task-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admin.accessToken}`,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          name: `Replay TaskType ${Date.now()}`,
          defaultProofProfile: 'SERVICE_PROOF',
          description: 'Replay task type description',
        }),
      });
      expect(taskTypeRes.status).toBe(201);
      const { data: taskType } = (await taskTypeRes.json()) as { data: { id: string } };

      const policyRes = await fetch(`${serverBaseUrl}/v1/governance/policies/proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admin.accessToken}`,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          taskTypeId: taskType.id,
          proofProfile: 'SERVICE_PROOF',
          policyDescription: 'Replay test policy',
        }),
      });
      expect(policyRes.status).toBe(201);

      const templateRes = await fetch(`${serverBaseUrl}/v1/governance/policies/checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admin.accessToken}`,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          taskTypeId: taskType.id,
          templateItems: [{ text: 'Item 1', order: 1 }],
        }),
      });
      expect(templateRes.status).toBe(201);

      // Manager creates Task & Staff starts it
      const taskCreateRes = await fetch(`${serverBaseUrl}/v1/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${manager.accessToken}`,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          title: 'Replay Test Task',
          description: 'Replay test task description',
          taskTypeId: taskType.id,
          treeId,
          assignedStaffId: staff.userId,
          deadline: '2026-12-31T17:00:00Z',
        }),
      });
      expect(taskCreateRes.status).toBe(201);
      const { data: serverTask } = (await taskCreateRes.json()) as { data: { id: string; version: number } };

      const startRes = await fetch(`${serverBaseUrl}/v1/tasks/${serverTask.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staff.accessToken}`,
          'Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({
          taskId: serverTask.id,
          expectedVersion: serverTask.version,
        }),
      });
      const { data: startedTask } = (await startRes.json()) as { data: { id: string; version: number } };

      // Staff Auth Session
      const staffSession: AuthSession = {
        accessToken: staff.accessToken,
        refreshToken: staff.refreshToken,
        expiresAt: staff.expiresAt,
        user: { id: staff.userId, email: staff.email, role: 'staff' },
      };
      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession(staffSession);
      const sessionManager = new AuthSessionManager(serverBaseUrl, storage);
      const apiClient = new MobileApiClient(serverBaseUrl, sessionManager);

      // Mobile SQLite
      const mobileDb = await createInMemoryTestDatabase();
      await runMigrations(mobileDb);
      const mobileTaskRepo = new SqliteMobileTaskRepository(mobileDb);
      const mobileOutboxRepo = new SqliteOutboxRepository(mobileDb);

      await mobileTaskRepo.cacheTasks([
        {
          id: startedTask.id,
          title: 'Replay Test Task',
          status: 'IN_PROGRESS',
          version: startedTask.version,
          taskTypeId: taskType.id,
          treeId,
          assignedStaffId: staff.userId,
          deadline: '2026-12-31T17:00:00Z',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const binaryContent = Buffer.from('BINARY-REPLAY-PHOTO-DATA');
      const sha256 = createHash('sha256').update(binaryContent).digest('hex');

      let presignCalls = 0;
      let binaryPutCalls = 0;
      let submitEvidenceCalls = 0;
      const capturedPostBodies: unknown[] = [];
      const capturedIdempotencyKeys: string[] = [];

      class BufferReader implements IEvidenceBinaryReader {
        async readBinary(): Promise<Uint8Array> {
          binaryPutCalls++;
          return new Uint8Array(binaryContent.buffer, binaryContent.byteOffset, binaryContent.byteLength);
        }
      }

      await mobileTaskRepo.saveEvidenceMetadata({
        id: 'ev-replay-01',
        taskId: startedTask.id,
        stage: 'COMPLETION',
        fileName: 'comp.jpg',
        contentType: 'image/jpeg',
        sizeBytes: binaryContent.length,
        sha256,
        sandboxFileUri: 'file:///sandbox/comp.jpg',
        capturedAt: new Date().toISOString(),
        isPersistedInSandbox: true,
      });

      // Intercept apiClient.post to count presigns, count submits, capture bodies/keys, and simulate response drop
      const origPost = apiClient.post.bind(apiClient);
      let dropResponseOnce = true;
      apiClient.post = async <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> => {
        if (path.includes('/evidence/presign')) {
          presignCalls++;
        } else if (path.includes('/evidence')) {
          submitEvidenceCalls++;
          capturedPostBodies.push(JSON.parse(JSON.stringify(body)));
          capturedIdempotencyKeys.push(options?.idempotencyKey ?? '');
          const response = await origPost<T>(path, body, options);
          if (dropResponseOnce) {
            dropResponseOnce = false;
            throw new MobileApiError('Simulated network drop after server commit', 0, 'NETWORK_ERROR');
          }
          return response;
        }
        return await origPost<T>(path, body, options);
      };

      const uploadClient = new EvidenceUploadClient(apiClient, new BufferReader());
      const dispatcher = new SubmitEvidenceOutboxDispatcher(apiClient, uploadClient, mobileTaskRepo, mobileOutboxRepo);

      // Stable idempotency key K
      const stableKeyK = generateSecureUuid();

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
            completionPhotoUri: 'file:///sandbox/comp.jpg',
            checklist: [{ id: 'chk-1', text: 'Item 1', done: true }],
          },
        },
        idempotencyKey: stableKeyK,
      });

      // Step 1: Outbox sends SubmitEvidence with key K -> Server commits acceptance, but network drop thrown
      const coordinator = new OutboxCoordinator(mobileOutboxRepo, dispatcher, mobileTaskRepo, mobileDb);
      const firstResult = await coordinator.processNext();
      expect(firstResult?.success).toBe(false);

      // Step 2: VERIFY CLIENT STATE after network drop:
      // (The outbox item is SYNC_FAILED with durable canonical payload, not SYNCED)
      const uncommittedItem = await mobileOutboxRepo.getItemById(outboxItem.id);
      expect(uncommittedItem?.syncStatus).not.toBe('SYNCED');
      expect(uncommittedItem?.idempotencyKey).toBe(stableKeyK);
      expect(uncommittedItem?.payloadJson).not.toContain('file://');

      // Step 3: Client restarts / replays same row with same key K
      const secondResult = await coordinator.processNext();
      expect(secondResult?.success).toBe(true);
      expect(secondResult?.idempotencyKey).toBe(stableKeyK);

      // Section 30 Invariants:
      // - 1 presign call across first attempt + replay
      expect(presignCalls).toBe(1);
      // - 1 binary PUT call
      expect(binaryPutCalls).toBe(1);
      // - 2 final SubmitEvidence POST calls
      expect(submitEvidenceCalls).toBe(2);
      // - both final POST request bodies deeply equal canonical DTO
      expect(capturedPostBodies[0]).toEqual(capturedPostBodies[1]);
      // - both Idempotency-Key headers: same K
      expect(capturedIdempotencyKeys[0]).toBe(stableKeyK);
      expect(capturedIdempotencyKeys[1]).toBe(stableKeyK);

      // - Exactly ONE server EvidenceAttempt was recorded in PostgreSQL database
      const attempts = await db
        .select()
        .from(schema.evidenceAttempts)
        .where(eq(schema.evidenceAttempts.taskId, startedTask.id));
      expect(attempts).toHaveLength(1);

      // - Server task: WAITING_REVIEW
      const [finalDbTask] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, startedTask.id));
      expect(finalDbTask.status).toBe('WAITING_REVIEW');

      // - Reconciled local task state: WAITING_REVIEW
      const finalCached = await mobileTaskRepo.getCachedTask(startedTask.id);
      expect(finalCached?.status).toBe('WAITING_REVIEW');

      // - Local outbox row: SYNCED
      const finalOutbox = await mobileOutboxRepo.getItemById(outboxItem.id);
      expect(finalOutbox?.syncStatus).toBe('SYNCED');

      // - Local evidence still present
      const localEvidenceList = await mobileTaskRepo.listEvidenceByTask(startedTask.id);
      const localEvidence = localEvidenceList.find((e) => e.id === 'ev-replay-01');
      expect(localEvidence).toBeDefined();
      expect(localEvidence?.taskId).toBe(startedTask.id);
      expect(localEvidence?.sha256).toBe(sha256);
    },
  );

  // =========================================================================
  // SECTION 43: REAL REFRESH INTEGRATION
  // =========================================================================
  it.runIf(hasDatabase)(
    'proves rotating refresh against real Fastify API and PostgreSQL (P13W5B-P03, P13W5B-P05)',
    async () => {
      const staff = await createAuthenticatedUser('staff');

      const initialSession: AuthSession = {
        accessToken: staff.accessToken,
        refreshToken: staff.refreshToken,
        expiresAt: staff.expiresAt,
        user: { id: staff.userId, email: staff.email, role: 'staff' },
      };

      const storage = new InMemorySecureSessionStorage();
      await storage.saveSession(initialSession);
      const sessionManager = new AuthSessionManager(serverBaseUrl, storage);

      // 1. Refresh session
      const newSession = await sessionManager.refreshSession();
      expect(newSession.accessToken).toBeDefined();
      expect(newSession.accessToken).not.toBe(staff.accessToken);
      expect(newSession.refreshToken).not.toBe(staff.refreshToken);

      // 2. New session is stored in SecureStore boundary
      const stored = await storage.loadSession();
      expect(stored?.accessToken).toBe(newSession.accessToken);
      expect(stored?.refreshToken).toBe(newSession.refreshToken);

      // 3. Old refresh token cannot be reused (reuse detection triggers revocation)
      const reuseAttempt = await fetch(`${serverBaseUrl}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: staff.refreshToken }),
      });
      // Fastify IAM returns 401 on reused refresh token
      expect(reuseAttempt.status).toBe(401);
    },
  );
});
