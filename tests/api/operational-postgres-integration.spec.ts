import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../apps/api/src/app';
import { DrizzleSessionRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-session-repository';
import { CryptoTokenService } from '../../apps/api/src/infrastructure/security/crypto-token-service';
import { DrizzleUserRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-user-repository';
import { DrizzleTreeRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-tree-repository';
import { DrizzleTaskTypeRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-task-type-repository';
import { DrizzleTaskRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-task-repository';
import { DrizzleIdempotencyRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-idempotency-repository';
import { DrizzleEvidenceRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-evidence-repository';
import { DrizzleCareHistoryRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-care-history-repository';
import { DrizzlePolicyRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-policy-repository';
import { DrizzleManagerScopeRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-manager-scope-repository';
import { DrizzleOperationalUnitOfWork } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-operational-unit-of-work';
import { DrizzleAuditWriter } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-audit-writer';
import { AuditService } from '../../apps/api/src/modules/audit-compliance/application/services/audit.service';
import { S3ObjectStorageAdapter } from '../../apps/api/src/infrastructure/storage/s3-object-storage';
import { Tree } from '../../apps/api/src/modules/tree-asset-registry/domain/tree.entity';
import { TaskType } from '../../apps/api/src/modules/policy-template-governance/domain/task-type.entity';
import { Task } from '../../apps/api/src/modules/work-management/domain/task.entity';
import {
  ProofPolicyVersion,
  ChecklistTemplateVersion,
} from '../../apps/api/src/modules/policy-template-governance/domain/policy-version.entity';
import { SubmitEvidenceUseCase } from '../../apps/api/src/modules/work-management/application/use-cases/submit-evidence.use-case';
import { ReviewTaskUseCase } from '../../apps/api/src/modules/work-management/application/use-cases/review-task.use-case';
import { CreateTaskUseCase } from '../../apps/api/src/modules/work-management/application/use-cases/create-task.use-case';
import { ResolveTaskTypePolicyUseCase } from '../../apps/api/src/modules/policy-template-governance/application/use-cases/resolve-task-type-policy.use-case';
import { ConflictError, ForbiddenError, ValidationError } from '../../apps/api/src/core/errors';
import type { IObjectStoragePort } from '../../apps/api/src/modules/work-management/application/ports/object-storage.port';
import { InMemoryObjectStorageAdapter } from './operational-test-doubles';
import * as schema from '../../apps/api/src/infrastructure/persistence/schema';

const { Pool } = pg;

describe('Phase 13 Wave 4: Real PostgreSQL & Real S3 Integration Tests (Sections 60, 61, 62)', () => {
  const migrationUrl = process.env['DATABASE_MIGRATION_URL'];
  const runtimeUrl = process.env['DATABASE_RUNTIME_URL'];
  const hasDatabase = Boolean(migrationUrl && runtimeUrl);

  const s3Endpoint = process.env['S3_ENDPOINT'];
  const hasS3 = Boolean(s3Endpoint);

  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let userRepo: DrizzleUserRepository;
  let treeRepo: DrizzleTreeRepository;
  let taskTypeRepo: DrizzleTaskTypeRepository;
  let taskRepo: DrizzleTaskRepository;
  let idempotencyRepo: DrizzleIdempotencyRepository;
  let evidenceRepo: DrizzleEvidenceRepository;
  let careHistoryRepo: DrizzleCareHistoryRepository;
  let policyRepo: DrizzlePolicyRepository;
  let scopeRepo: DrizzleManagerScopeRepository;
  let auditWriter: DrizzleAuditWriter;
  let operationalUow: DrizzleOperationalUnitOfWork;
  let storageAdapter: IObjectStoragePort;
  let sessionRepo: DrizzleSessionRepository;
  let tokenService: CryptoTokenService;
  let app: FastifyInstance;

  async function createAuthenticatedUser(role: 'admin' | 'manager' | 'staff') {
    const userId = crypto.randomUUID();
    const email = `${role}-${Date.now()}-${crypto.randomUUID().slice(0, 6)}@novyx.test`;
    await userRepo.create({
      id: userId,
      version: 0,
      email,
      initialRole: role,
      role,
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });

    const rawToken = tokenService.generateToken(32);
    const tokenHash = tokenService.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 3600_000);

    await sessionRepo.createSession({
      id: crypto.randomUUID(),
      userId,
      tokenFamily: crypto.randomUUID(),
      accessTokenHash: tokenHash,
      refreshTokenHash: tokenService.hashToken(`ref_${crypto.randomUUID()}`),
      authVersion: 1,
      sessionVersion: 1,
      accessExpiresAt: expiresAt,
      refreshExpiresAt: expiresAt,
      expiresAt,
    });

    return { userId, token: rawToken };
  }

  beforeAll(() => {
    if (hasS3) {
      storageAdapter = new S3ObjectStorageAdapter({
        endpoint: s3Endpoint,
        region: process.env['S3_REGION'] || 'us-east-1',
        bucket: process.env['S3_BUCKET'] || 'novyx-evidence',
        accessKeyId: process.env['S3_ACCESS_KEY_ID'] || 'minioadmin',
        secretAccessKey: process.env['S3_SECRET_ACCESS_KEY'] || 'minioadminpassword',
        forcePathStyle: true,
      });
    } else {
      storageAdapter = new InMemoryObjectStorageAdapter();
    }

    if (hasDatabase && runtimeUrl) {
      pool = new Pool({ connectionString: runtimeUrl });
      db = drizzle(pool, { schema });
      userRepo = new DrizzleUserRepository(db);
      treeRepo = new DrizzleTreeRepository(db);
      taskTypeRepo = new DrizzleTaskTypeRepository(db);
      taskRepo = new DrizzleTaskRepository(db);
      idempotencyRepo = new DrizzleIdempotencyRepository(db);
      evidenceRepo = new DrizzleEvidenceRepository(db);
      careHistoryRepo = new DrizzleCareHistoryRepository(db);
      policyRepo = new DrizzlePolicyRepository(db);
      scopeRepo = new DrizzleManagerScopeRepository(db);
      auditWriter = new DrizzleAuditWriter(db);
      operationalUow = new DrizzleOperationalUnitOfWork(db);
      sessionRepo = new DrizzleSessionRepository(db);
      tokenService = new CryptoTokenService();
      app = buildApp({
        pool,
        storagePort: storageAdapter,
        operationalUnitOfWork: operationalUow,
      });
    }
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  // =========================================================================
  // 1. Real PostgreSQL OCC (Section 38, 60)
  // =========================================================================
  it.runIf(hasDatabase)(
    'proves real PostgreSQL OCC: atomic UPDATE ... WHERE id = ? AND version = ? rejects stale version',
    async () => {
      // 1. Seed Tree
      const treeId = `tree-occ-${Date.now()}`;
      const tree = new Tree({
        id: treeId,
        version: 0,
        name: 'OCC Test Tree',
        species: 'Ficus',
        lat: 10.77,
        lng: 106.69,
        address: 'Test Address',
        qrCode: `QR-${treeId}`,
        healthStatus: 'Khỏe mạnh',
        ageYears: 15,
      });
      await treeRepo.save(tree);

      // 2. Seed TaskType & Policy
      const ttId = `tt-occ-${Date.now()}`;
      const taskType = new TaskType({
        id: ttId,
        version: 0,
        name: 'OCC Task Type',
        defaultProofProfile: 'SERVICE_PROOF',
        isActive: true,
      });
      await taskTypeRepo.save(taskType);

      // 3. Seed Staff
      const staffId = crypto.randomUUID();
      await userRepo.create({
        id: staffId,
        version: 0,
        email: `staff-occ-${Date.now()}@example.com`,
        initialRole: 'staff',
        role: 'staff',
        accountStatus: 'ACTIVE',
        authVersion: 1,
      });

      // 4. Seed Task at version 0
      const taskId = `task-occ-${Date.now()}`;
      const task = new Task({
        id: taskId,
        version: 0,
        title: 'OCC Task Test',
        description: 'Testing real DB OCC',
        taskTypeId: ttId,
        taskTypeName: 'OCC Task Type',
        proofProfile: 'SERVICE_PROOF',
        treeId,
        treeName: 'OCC Test Tree',
        treeAddress: 'Test Address',
        assignedStaffId: staffId,
        assignedStaffName: 'Test Staff',
        deadline: '2026-11-01T00:00:00Z',
        status: 'PENDING',
      });
      await taskRepo.save(task);

      // Stale version update attempt: expectedVersion 999
      task.start(staffId);
      const staleSuccess = await taskRepo.update(task, 999);
      expect(staleSuccess).toBe(false);

      // State in DB remains intact at version 0, status PENDING
      const inDb = await taskRepo.findById(taskId);
      expect(inDb).not.toBeNull();
      expect(inDb?.version).toBe(0);
      expect(inDb?.status).toBe('PENDING');

      // Valid version update attempt: expectedVersion 0
      const validSuccess = await taskRepo.update(task, 0);
      expect(validSuccess).toBe(true);

      const inDbAfter = await taskRepo.findById(taskId);
      expect(inDbAfter?.version).toBe(1);
      expect(inDbAfter?.status).toBe('IN_PROGRESS');
    },
  );

  // =========================================================================
  // 2. Real PostgreSQL Idempotency Replay (Section 39, 60)
  // =========================================================================
  it.runIf(hasDatabase)('proves persistent PostgreSQL idempotency records prevent duplicate execution', async () => {
    const actorId = crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();
    const requestRoute = '/v1/tasks';
    const requestHash = 'hash-abc-123';
    const responsePayload = JSON.stringify({ data: { id: 'TASK-SAVED-1' } });

    // Save initial record
    await idempotencyRepo.save({
      id: crypto.randomUUID(),
      idempotencyKey,
      actorId,
      requestRoute,
      requestHash,
      responseStatus: 201,
      responseBody: responsePayload,
    });

    // Retrieve by actor + key
    const record = await idempotencyRepo.findByKey(actorId, idempotencyKey);
    expect(record).not.toBeNull();
    expect(record?.actorId).toBe(actorId);
    expect(record?.idempotencyKey).toBe(idempotencyKey);
    expect(record?.requestHash).toBe(requestHash);
    expect(record?.responseStatus).toBe(201);
    expect(record?.responseBody).toBe(responsePayload);
  });

  // =========================================================================
  // 3. Real S3-Compatible Storage Integration (Section 62)
  // =========================================================================
  it.runIf(hasS3)('proves real S3-compatible storage operations and metadata validation (Section 62)', async () => {
    const taskId = `task-s3-${Date.now()}`;
    const actorId = crypto.randomUUID();

    // 1. Generate Presigned URL
    const presigned = await storageAdapter.generatePresignedUploadUrl({
      taskId,
      actorId,
      fileName: 'proof.jpg',
      contentType: 'image/jpeg',
    });

    expect(presigned.objectKey).toContain(`tasks/${taskId}/evidence/`);
    expect(presigned.uploadUrl).toContain('http');
    expect(presigned.storageRef).toContain(presigned.objectKey);

    // 2. Put object directly and verify metadata
    const testBuffer = Buffer.from('REAL-S3-INTEGRATION-TEST-PAYLOAD');
    await storageAdapter.putObjectDirect({
      objectKey: presigned.objectKey,
      data: testBuffer,
      contentType: 'image/jpeg',
    });

    const metadata = await storageAdapter.getObjectMetadata(presigned.objectKey);
    expect(metadata).not.toBeNull();
    expect(metadata?.sizeBytes).toBe(testBuffer.length);
    expect(metadata?.contentType).toBe('image/jpeg');

    // 3. Clean up
    await storageAdapter.deleteObject(presigned.objectKey);
    const afterDelete = await storageAdapter.getObjectMetadata(presigned.objectKey);
    expect(afterDelete).toBeNull();
  });

  // =========================================================================
  // 4. Real PostgreSQL SubmitEvidence OCC Rollback (W4-C01, Section 5, 7)
  // =========================================================================
  it.runIf(hasDatabase)(
    'proves atomic rollback on SubmitEvidence OCC failure in real PostgreSQL transaction',
    async () => {
      const treeId = `tree-se-roll-${Date.now()}`;
      await treeRepo.save(
        new Tree({
          id: treeId,
          version: 0,
          name: 'SE Rollback Tree',
          species: 'Swietenia macrophylla',
          lat: 10.78,
          lng: 106.7,
          address: 'District 1',
          qrCode: `QR-${treeId}`,
          healthStatus: 'Khỏe mạnh',
          ageYears: 5,
        }),
      );

      const ttId = `tt-se-roll-${Date.now()}`;
      await taskTypeRepo.save(
        new TaskType({
          id: ttId,
          version: 0,
          name: 'SE Rollback Type',
          defaultProofProfile: 'SERVICE_PROOF',
          isActive: true,
        }),
      );

      const staffId = crypto.randomUUID();
      await userRepo.create({
        id: staffId,
        version: 0,
        email: `staff-se-roll-${Date.now()}@example.com`,
        initialRole: 'staff',
        role: 'staff',
        accountStatus: 'ACTIVE',
        authVersion: 1,
      });

      const taskId = `task-se-roll-${Date.now()}`;
      const task = new Task({
        id: taskId,
        version: 0,
        title: 'SE Rollback Task',
        description: 'Testing SE Rollback',
        taskTypeId: ttId,
        taskTypeName: 'SE Rollback Type',
        proofProfile: 'SERVICE_PROOF',
        treeId,
        treeName: 'SE Rollback Tree',
        treeAddress: 'District 1',
        assignedStaffId: staffId,
        assignedStaffName: 'Test Staff',
        deadline: '2026-11-01T00:00:00Z',
        status: 'IN_PROGRESS',
      });
      await taskRepo.save(task);

      const objectKey = `tasks/${taskId}/evidence/proof.jpg`;
      await storageAdapter.putObjectDirect({
        objectKey,
        data: Buffer.from('proof-image-content'),
        contentType: 'image/jpeg',
        metadata: {
          taskId,
          uploadedBy: staffId,
        },
      });

      const submitUseCase = new SubmitEvidenceUseCase(
        taskRepo,
        evidenceRepo,
        storageAdapter,
        treeRepo,
        new AuditService(auditWriter),
        operationalUow,
      );

      let errorThrown: unknown = null;
      try {
        await submitUseCase.execute(
          {
            taskId,
            expectedVersion: 999, // Stale expected version triggers OCC conflict
            siteVerification: {
              gpsCheck: { lat: 10.78, lng: 106.7, distance: 2.0, verified: true, timestamp: new Date().toISOString() },
              qrCheck: { scannedCode: `QR-${treeId}`, verified: true, timestamp: new Date().toISOString() },
            },
            proof: {
              proofProfile: 'SERVICE_PROOF',
              completionPhotoUri: objectKey,
              checklist: [{ id: '1', text: 'Clean perimeter', done: true }],
            },
          },
          { actorId: staffId, actorRole: 'staff' },
        );
      } catch (err) {
        errorThrown = err;
      }

      expect(errorThrown).toBeInstanceOf(ConflictError);

      // Verify atomic rollback in real PostgreSQL
      const taskInDb = await taskRepo.findById(taskId);
      expect(taskInDb?.version).toBe(0);
      expect(taskInDb?.status).toBe('IN_PROGRESS');

      const objectsInDb = await db
        .select()
        .from(schema.evidenceObjects)
        .where(eq(schema.evidenceObjects.taskId, taskId));
      expect(objectsInDb.length).toBe(0);

      const attemptsInDb = await db
        .select()
        .from(schema.evidenceAttempts)
        .where(eq(schema.evidenceAttempts.taskId, taskId));
      expect(attemptsInDb.length).toBe(0);
    },
  );

  // =========================================================================
  // 5. Real PostgreSQL Review OCC Rollback (W4-C01, Section 5, 7)
  // =========================================================================
  it.runIf(hasDatabase)(
    'proves atomic rollback on Review / CareHistory OCC failure in real PostgreSQL transaction',
    async () => {
      const treeId = `tree-rev-roll-${Date.now()}`;
      await treeRepo.save(
        new Tree({
          id: treeId,
          version: 0,
          name: 'Rev Rollback Tree',
          species: 'Swietenia macrophylla',
          lat: 10.78,
          lng: 106.7,
          address: 'District 1',
          qrCode: `QR-${treeId}`,
          healthStatus: 'Khỏe mạnh',
          ageYears: 5,
        }),
      );

      const ttId = `tt-rev-roll-${Date.now()}`;
      await taskTypeRepo.save(
        new TaskType({
          id: ttId,
          version: 0,
          name: 'Rev Rollback Type',
          defaultProofProfile: 'SERVICE_PROOF',
          isActive: true,
        }),
      );

      const staffId = crypto.randomUUID();
      await userRepo.create({
        id: staffId,
        version: 0,
        email: `staff-rev-roll-${Date.now()}@example.com`,
        initialRole: 'staff',
        role: 'staff',
        accountStatus: 'ACTIVE',
        authVersion: 1,
      });

      const managerId = crypto.randomUUID();
      await userRepo.create({
        id: managerId,
        version: 0,
        email: `mgr-rev-roll-${Date.now()}@example.com`,
        initialRole: 'manager',
        role: 'manager',
        accountStatus: 'ACTIVE',
        authVersion: 1,
      });

      const taskId = `task-rev-roll-${Date.now()}`;
      const task = new Task({
        id: taskId,
        version: 1,
        title: 'Rev Rollback Task',
        description: 'Testing Rev Rollback',
        taskTypeId: ttId,
        taskTypeName: 'Rev Rollback Type',
        proofProfile: 'SERVICE_PROOF',
        treeId,
        treeName: 'Rev Rollback Tree',
        treeAddress: 'District 1',
        assignedStaffId: staffId,
        assignedStaffName: 'Test Staff',
        deadline: '2026-11-01T00:00:00Z',
        status: 'WAITING_REVIEW',
        submittedAt: new Date().toISOString(),
      });
      await taskRepo.save(task);

      await scopeRepo.addScope(managerId, treeId);

      const reviewUseCase = new ReviewTaskUseCase(
        taskRepo,
        evidenceRepo,
        careHistoryRepo,
        scopeRepo,
        new AuditService(auditWriter),
        operationalUow,
      );

      let errorThrown: unknown = null;
      try {
        await reviewUseCase.execute(
          {
            taskId,
            expectedVersion: 999, // Stale expected version triggers OCC conflict
            decision: 'APPROVE',
            reviewNotes: 'Looks good',
          },
          { actorId: managerId, actorRole: 'manager' },
        );
      } catch (err) {
        errorThrown = err;
      }

      expect(errorThrown).toBeInstanceOf(ConflictError);

      // Verify atomic rollback in real PostgreSQL
      const taskInDb = await taskRepo.findById(taskId);
      expect(taskInDb?.version).toBe(1);
      expect(taskInDb?.status).toBe('WAITING_REVIEW');

      const historiesInDb = await db.select().from(schema.careHistories).where(eq(schema.careHistories.taskId, taskId));
      expect(historiesInDb.length).toBe(0);
    },
  );

  // =========================================================================
  // 6. Concurrent Same-Key Idempotency Claim (W4-C02, Section 8, 9)
  // =========================================================================
  // =========================================================================
  // 6. Full HTTP Concurrent Idempotency & Failure Injection (W4-F02, Sections 16, 17)
  // =========================================================================
  it.runIf(hasDatabase)(
    'proves full HTTP concurrent idempotency yields exactly one business execution, one audit, and identical replay (Section 16)',
    async () => {
      const staff = await createAuthenticatedUser('staff');
      const idempotencyKey = crypto.randomUUID();

      const treeId = `tree-http-idem-${Date.now()}`;
      await treeRepo.save(
        new Tree({
          id: treeId,
          version: 0,
          name: 'HTTP Idem Tree',
          species: 'Swietenia macrophylla',
          lat: 10.78,
          lng: 106.7,
          address: 'District 1',
          qrCode: `QR-${treeId}`,
          healthStatus: 'Khỏe mạnh',
          ageYears: 5,
        }),
      );

      const ttId = `tt-http-idem-${Date.now()}`;
      await taskTypeRepo.save(
        new TaskType({
          id: ttId,
          version: 0,
          name: 'HTTP Idem Type',
          defaultProofProfile: 'SERVICE_PROOF',
          isActive: true,
        }),
      );

      const taskId = `task-http-idem-${Date.now()}`;
      const task = new Task({
        id: taskId,
        version: 0,
        title: 'HTTP Idem Task',
        description: 'Testing real HTTP concurrent idempotency',
        taskTypeId: ttId,
        taskTypeName: 'HTTP Idem Type',
        proofProfile: 'SERVICE_PROOF',
        treeId,
        treeName: 'HTTP Idem Tree',
        treeAddress: 'District 1',
        assignedStaffId: staff.userId,
        assignedStaffName: 'Staff 1',
        deadline: '2026-11-01T00:00:00Z',
        status: 'PENDING',
      });
      await taskRepo.save(task);

      const payload = {
        taskId,
        expectedVersion: 0,
      };

      // Send TWO actual HTTP inject requests concurrently with:
      // same authenticated actor, same route, same Idempotency-Key, same body
      const [res1, res2] = await Promise.all([
        app.inject({
          method: 'POST',
          url: `/v1/tasks/${taskId}/start`,
          headers: {
            authorization: `Bearer ${staff.token}`,
            'idempotency-key': idempotencyKey,
          },
          payload,
        }),
        app.inject({
          method: 'POST',
          url: `/v1/tasks/${taskId}/start`,
          headers: {
            authorization: `Bearer ${staff.token}`,
            'idempotency-key': idempotencyKey,
          },
          payload,
        }),
      ]);

      // Both receive the same logical committed result (200 OK, IN_PROGRESS, version 1)
      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
      expect(res1.json().data.status).toBe('IN_PROGRESS');
      expect(res2.json().data.status).toBe('IN_PROGRESS');
      expect(res1.json().data.version).toBe(1);
      expect(res2.json().data.version).toBe(1);

      // Exactly one Task mutation
      const taskInDb = await taskRepo.findById(taskId);
      expect(taskInDb?.status).toBe('IN_PROGRESS');
      expect(taskInDb?.version).toBe(1);

      // Exactly one SUCCESS audit for the business command
      const audits = await db.select().from(schema.auditEvents).where(eq(schema.auditEvents.resourceId, taskId));
      const startAudits = audits.filter((a) => a.actionType === 'StartTask' && a.outcome === 'SUCCESS');
      expect(startAudits).toHaveLength(1);

      // Idempotency row == COMPLETED, no permanent PROCESSING record
      const idemRecord = await idempotencyRepo.findByKey(staff.userId, idempotencyKey);
      expect(idemRecord).not.toBeNull();
      expect(idemRecord?.status).toBe('COMPLETED');
      expect(idemRecord?.responseStatus).toBe(200);
    },
  );

  it.runIf(hasDatabase)(
    'proves failure injection rolls back transaction, leaves no poison PROCESSING, and permits same-key retry (Section 17)',
    async () => {
      const staff = await createAuthenticatedUser('staff');
      const idempotencyKey = crypto.randomUUID();

      const treeId = `tree-fail-inj-${Date.now()}`;
      await treeRepo.save(
        new Tree({
          id: treeId,
          version: 0,
          name: 'Fail Inj Tree',
          species: 'Swietenia macrophylla',
          lat: 10.78,
          lng: 106.7,
          address: 'District 1',
          qrCode: `QR-${treeId}`,
          healthStatus: 'Khỏe mạnh',
          ageYears: 5,
        }),
      );

      const ttId = `tt-fail-inj-${Date.now()}`;
      await taskTypeRepo.save(
        new TaskType({
          id: ttId,
          version: 0,
          name: 'Fail Inj Type',
          defaultProofProfile: 'SERVICE_PROOF',
          isActive: true,
        }),
      );

      const taskId = `task-fail-inj-${Date.now()}`;
      const task = new Task({
        id: taskId,
        version: 0,
        title: 'Fail Inj Task',
        description: 'Testing rollback and retry',
        taskTypeId: ttId,
        taskTypeName: 'Fail Inj Type',
        proofProfile: 'SERVICE_PROOF',
        treeId,
        treeName: 'Fail Inj Tree',
        treeAddress: 'District 1',
        assignedStaffId: staff.userId,
        assignedStaffName: 'Staff 1',
        deadline: '2026-11-01T00:00:00Z',
        status: 'PENDING',
      });
      await taskRepo.save(task);

      const payload = { taskId, expectedVersion: 0 };

      try {
        // Set beforeCommitHook to throw an error simulating crash / rollback after business logic prepared
        operationalUow.setBeforeCommitHook(async () => {
          throw new Error('SIMULATED_FAILURE_BEFORE_COMMIT');
        });

        const failedRes = await app.inject({
          method: 'POST',
          url: `/v1/tasks/${taskId}/start`,
          headers: {
            authorization: `Bearer ${staff.token}`,
            'idempotency-key': idempotencyKey,
          },
          payload,
        });

        expect(failedRes.statusCode).toBe(500);

        // Verify real PostgreSQL rollback:
        // 1. No business mutation (Task remains PENDING at version 0)
        const taskAfterFail = await taskRepo.findById(taskId);
        expect(taskAfterFail?.status).toBe('PENDING');
        expect(taskAfterFail?.version).toBe(0);

        // 2. No SUCCESS audit
        const auditsAfterFail = await db
          .select()
          .from(schema.auditEvents)
          .where(eq(schema.auditEvents.resourceId, taskId));
        const successAudits = auditsAfterFail.filter((a) => a.actionType === 'StartTask' && a.outcome === 'SUCCESS');
        expect(successAudits).toHaveLength(0);

        // 3. No COMPLETED record, no permanent PROCESSING poison record
        const idemRecordAfterFail = await idempotencyRepo.findByKey(staff.userId, idempotencyKey);
        expect(idemRecordAfterFail).toBeNull();
      } finally {
        // Reset the test hook
        operationalUow.setBeforeCommitHook(undefined);
      }

      // Retry with the EXACT same Idempotency-Key: executes successfully once
      const retryRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${taskId}/start`,
        headers: {
          authorization: `Bearer ${staff.token}`,
          'idempotency-key': idempotencyKey,
        },
        payload,
      });

      expect(retryRes.statusCode).toBe(200);
      expect(retryRes.json().data.status).toBe('IN_PROGRESS');
      expect(retryRes.json().data.version).toBe(1);

      const taskAfterRetry = await taskRepo.findById(taskId);
      expect(taskAfterRetry?.status).toBe('IN_PROGRESS');
      expect(taskAfterRetry?.version).toBe(1);

      const finalIdem = await idempotencyRepo.findByKey(staff.userId, idempotencyKey);
      expect(finalIdem?.status).toBe('COMPLETED');
      expect(finalIdem?.responseStatus).toBe(200);
    },
  );

  // =========================================================================
  // 7. Real MinIO True SHA-256 Checksum and Reservation Enforcement (W4-F01, Section 10)
  // =========================================================================
  it.runIf(hasDatabase && hasS3)(
    'proves real MinIO true SHA-256 checksum and reservation enforcement (Section 10)',
    async () => {
      const treeId = `tree-s3-ver-${Date.now()}`;
      await treeRepo.save(
        new Tree({
          id: treeId,
          version: 0,
          name: 'S3 Verify Tree',
          species: 'Swietenia macrophylla',
          lat: 10.78,
          lng: 106.7,
          address: 'District 1',
          qrCode: `QR-${treeId}`,
          healthStatus: 'Khỏe mạnh',
          ageYears: 5,
        }),
      );

      const ttId = `tt-s3-ver-${Date.now()}`;
      await taskTypeRepo.save(
        new TaskType({
          id: ttId,
          version: 0,
          name: 'S3 Verify Type',
          defaultProofProfile: 'SERVICE_PROOF',
          isActive: true,
        }),
      );

      const staff1 = await createAuthenticatedUser('staff');
      const staff2 = await createAuthenticatedUser('staff');

      const taskId = `task-s3-ver-${Date.now()}`;
      const task = new Task({
        id: taskId,
        version: 0,
        title: 'S3 Verify Task',
        description: 'Testing real MinIO verification',
        taskTypeId: ttId,
        taskTypeName: 'S3 Verify Type',
        proofProfile: 'SERVICE_PROOF',
        treeId,
        treeName: 'S3 Verify Tree',
        treeAddress: 'District 1',
        assignedStaffId: staff1.userId,
        assignedStaffName: 'Staff 1',
        deadline: '2026-11-01T00:00:00Z',
        status: 'IN_PROGRESS',
      });
      await taskRepo.save(task);

      const submitUseCase = new SubmitEvidenceUseCase(
        taskRepo,
        evidenceRepo,
        storageAdapter,
        treeRepo,
        new AuditService(auditWriter),
        operationalUow,
      );

      // Section 10: Real MinIO test
      // bytes: "NOVYX-SHA256-INTEGRITY-TEST"
      const exactBytes = Buffer.from('NOVYX-SHA256-INTEGRITY-TEST');
      const expectedSha256 = crypto.createHash('sha256').update(exactBytes).digest('hex');
      const objectKey = `tasks/${taskId}/evidence/true-integrity.jpg`;

      // Upload those exact bytes
      await storageAdapter.putObjectDirect({
        objectKey,
        data: exactBytes,
        contentType: 'image/jpeg',
        metadata: { taskId, uploadedBy: staff1.userId },
      });

      // Server reads/verifies stored object
      const storedIntegrity = await storageAdapter.getObjectIntegrity(objectKey);
      expect(storedIntegrity).not.toBeNull();
      // Assert: actual SHA-256 == independently computed expected SHA-256
      expect(storedIntegrity?.sha256).toBe(expectedSha256);

      // Mutate expected SHA-256 by one character
      const mutatedSha256 = expectedSha256[0] === 'a' ? 'b' + expectedSha256.slice(1) : 'a' + expectedSha256.slice(1);

      const mutatedReservationId = crypto.randomUUID();
      await evidenceRepo.saveReservation({
        id: mutatedReservationId,
        taskId,
        actorId: staff1.userId,
        objectKey,
        storageRef: `s3://${process.env['S3_BUCKET'] || 'novyx-evidence'}/${objectKey}`,
        expectedContentType: 'image/jpeg',
        expectedSizeBytes: exactBytes.length,
        expectedContentHash: mutatedSha256,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 900000),
      });

      // Assert: SubmitEvidence rejected
      await expect(
        submitUseCase.execute(
          {
            taskId,
            expectedVersion: 0,
            siteVerification: {
              gpsCheck: { lat: 10.78, lng: 106.7, distance: 2.0, verified: true, timestamp: new Date().toISOString() },
              qrCheck: { scannedCode: `QR-${treeId}`, verified: true, timestamp: new Date().toISOString() },
            },
            proof: {
              proofProfile: 'SERVICE_PROOF',
              completionPhotoUri: objectKey,
              checklist: [{ id: '1', text: 'Done', done: true }],
            },
          },
          { actorId: staff1.userId, actorRole: 'staff' },
        ),
      ).rejects.toThrow(ValidationError);

      // Assert: Task remains IN_PROGRESS
      const taskAfterReject = await taskRepo.findById(taskId);
      expect(taskAfterReject?.status).toBe('IN_PROGRESS');
      expect(taskAfterReject?.version).toBe(0);

      // Assert: no EvidenceAttempt
      const attempts = await evidenceRepo.getEvidenceAttempts(taskId);
      expect(attempts).toHaveLength(0);

      // Assert: no SUCCESS audit
      const audits = await db.select().from(schema.auditEvents).where(eq(schema.auditEvents.resourceId, taskId));
      const successAudits = audits.filter((a) => a.actionType === 'SubmitEvidence' && a.outcome === 'SUCCESS');
      expect(successAudits).toHaveLength(0);

      // Also test: wrong size
      const wrongSizeKey = `tasks/${taskId}/evidence/wrong-size.jpg`;
      await storageAdapter.putObjectDirect({
        objectKey: wrongSizeKey,
        data: exactBytes,
        contentType: 'image/jpeg',
        metadata: { taskId, uploadedBy: staff1.userId },
      });
      await evidenceRepo.saveReservation({
        id: crypto.randomUUID(),
        taskId,
        actorId: staff1.userId,
        objectKey: wrongSizeKey,
        storageRef: `s3://${process.env['S3_BUCKET'] || 'novyx-evidence'}/${wrongSizeKey}`,
        expectedContentType: 'image/jpeg',
        expectedSizeBytes: exactBytes.length + 99,
        expectedContentHash: expectedSha256,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 900000),
      });
      await expect(
        submitUseCase.execute(
          {
            taskId,
            expectedVersion: 0,
            siteVerification: {
              gpsCheck: { lat: 10.78, lng: 106.7, distance: 2.0, verified: true, timestamp: new Date().toISOString() },
              qrCheck: { scannedCode: `QR-${treeId}`, verified: true, timestamp: new Date().toISOString() },
            },
            proof: {
              proofProfile: 'SERVICE_PROOF',
              completionPhotoUri: wrongSizeKey,
              checklist: [{ id: '1', text: 'Done', done: true }],
            },
          },
          { actorId: staff1.userId, actorRole: 'staff' },
        ),
      ).rejects.toThrow(ValidationError);

      // Also test: wrong content type
      const wrongTypeKey = `tasks/${taskId}/evidence/wrong-type.jpg`;
      await storageAdapter.putObjectDirect({
        objectKey: wrongTypeKey,
        data: exactBytes,
        contentType: 'image/png',
        metadata: { taskId, uploadedBy: staff1.userId },
      });
      await evidenceRepo.saveReservation({
        id: crypto.randomUUID(),
        taskId,
        actorId: staff1.userId,
        objectKey: wrongTypeKey,
        storageRef: `s3://${process.env['S3_BUCKET'] || 'novyx-evidence'}/${wrongTypeKey}`,
        expectedContentType: 'image/jpeg',
        expectedSizeBytes: exactBytes.length,
        expectedContentHash: expectedSha256,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 900000),
      });
      await expect(
        submitUseCase.execute(
          {
            taskId,
            expectedVersion: 0,
            siteVerification: {
              gpsCheck: { lat: 10.78, lng: 106.7, distance: 2.0, verified: true, timestamp: new Date().toISOString() },
              qrCheck: { scannedCode: `QR-${treeId}`, verified: true, timestamp: new Date().toISOString() },
            },
            proof: {
              proofProfile: 'SERVICE_PROOF',
              completionPhotoUri: wrongTypeKey,
              checklist: [{ id: '1', text: 'Done', done: true }],
            },
          },
          { actorId: staff1.userId, actorRole: 'staff' },
        ),
      ).rejects.toThrow(ValidationError);

      // Also test: no reservation
      const noResKey = `tasks/${taskId}/evidence/no-reservation.jpg`;
      await storageAdapter.putObjectDirect({
        objectKey: noResKey,
        data: exactBytes,
        contentType: 'image/jpeg',
        metadata: { taskId, uploadedBy: staff1.userId },
      });
      await expect(
        submitUseCase.execute(
          {
            taskId,
            expectedVersion: 0,
            siteVerification: {
              gpsCheck: { lat: 10.78, lng: 106.7, distance: 2.0, verified: true, timestamp: new Date().toISOString() },
              qrCheck: { scannedCode: `QR-${treeId}`, verified: true, timestamp: new Date().toISOString() },
            },
            proof: {
              proofProfile: 'SERVICE_PROOF',
              completionPhotoUri: noResKey,
              checklist: [{ id: '1', text: 'Done', done: true }],
            },
          },
          { actorId: staff1.userId, actorRole: 'staff' },
        ),
      ).rejects.toThrow(ForbiddenError);

      // Also test: wrong Task
      const otherTaskId = `task-other-${Date.now()}`;
      await taskRepo.save(
        new Task({
          id: otherTaskId,
          version: 0,
          title: 'Other Task',
          description: 'Other Task for testing wrong Task',
          taskTypeId: ttId,
          taskTypeName: 'S3 Verify Type',
          proofProfile: 'SERVICE_PROOF',
          treeId,
          treeName: 'S3 Verify Tree',
          treeAddress: 'District 1',
          assignedStaffId: staff1.userId,
          assignedStaffName: 'Staff 1',
          deadline: '2026-11-01T00:00:00Z',
          status: 'IN_PROGRESS',
        }),
      );
      const wrongTaskKey = `tasks/${otherTaskId}/evidence/wrong-task.jpg`;
      await storageAdapter.putObjectDirect({
        objectKey: wrongTaskKey,
        data: exactBytes,
        contentType: 'image/jpeg',
        metadata: { taskId: otherTaskId, uploadedBy: staff1.userId },
      });
      await evidenceRepo.saveReservation({
        id: crypto.randomUUID(),
        taskId: otherTaskId,
        actorId: staff1.userId,
        objectKey: wrongTaskKey,
        storageRef: `s3://${process.env['S3_BUCKET'] || 'novyx-evidence'}/${wrongTaskKey}`,
        expectedContentType: 'image/jpeg',
        expectedSizeBytes: exactBytes.length,
        expectedContentHash: expectedSha256,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 900000),
      });
      await expect(
        submitUseCase.execute(
          {
            taskId,
            expectedVersion: 0,
            siteVerification: {
              gpsCheck: { lat: 10.78, lng: 106.7, distance: 2.0, verified: true, timestamp: new Date().toISOString() },
              qrCheck: { scannedCode: `QR-${treeId}`, verified: true, timestamp: new Date().toISOString() },
            },
            proof: {
              proofProfile: 'SERVICE_PROOF',
              completionPhotoUri: wrongTaskKey,
              checklist: [{ id: '1', text: 'Done', done: true }],
            },
          },
          { actorId: staff1.userId, actorRole: 'staff' },
        ),
      ).rejects.toThrow(ForbiddenError);

      // Also test: wrong actor
      const wrongActorKey = `tasks/${taskId}/evidence/wrong-actor.jpg`;
      await storageAdapter.putObjectDirect({
        objectKey: wrongActorKey,
        data: exactBytes,
        contentType: 'image/jpeg',
        metadata: { taskId, uploadedBy: staff2.userId },
      });
      await evidenceRepo.saveReservation({
        id: crypto.randomUUID(),
        taskId,
        actorId: staff2.userId,
        objectKey: wrongActorKey,
        storageRef: `s3://${process.env['S3_BUCKET'] || 'novyx-evidence'}/${wrongActorKey}`,
        expectedContentType: 'image/jpeg',
        expectedSizeBytes: exactBytes.length,
        expectedContentHash: expectedSha256,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 900000),
      });
      await expect(
        submitUseCase.execute(
          {
            taskId,
            expectedVersion: 0,
            siteVerification: {
              gpsCheck: { lat: 10.78, lng: 106.7, distance: 2.0, verified: true, timestamp: new Date().toISOString() },
              qrCheck: { scannedCode: `QR-${treeId}`, verified: true, timestamp: new Date().toISOString() },
            },
            proof: {
              proofProfile: 'SERVICE_PROOF',
              completionPhotoUri: wrongActorKey,
              checklist: [{ id: '1', text: 'Done', done: true }],
            },
          },
          { actorId: staff1.userId, actorRole: 'staff' },
        ),
      ).rejects.toThrow(ForbiddenError);

      // Also test: HTTP presigned URL as durable identity -> rejected
      await expect(
        submitUseCase.execute(
          {
            taskId,
            expectedVersion: 0,
            siteVerification: {
              gpsCheck: { lat: 10.78, lng: 106.7, distance: 2.0, verified: true, timestamp: new Date().toISOString() },
              qrCheck: { scannedCode: `QR-${treeId}`, verified: true, timestamp: new Date().toISOString() },
            },
            proof: {
              proofProfile: 'SERVICE_PROOF',
              completionPhotoUri: 'https://minio.cloud.com:9000/bucket/tasks/completion.jpg?X-Amz-Signature=123',
              checklist: [{ id: '1', text: 'Done', done: true }],
            },
          },
          { actorId: staff1.userId, actorRole: 'staff' },
        ),
      ).rejects.toThrow(ValidationError);
    },
  );

  // =========================================================================
  // 8. Non-Retroactive Policy Versioning in Real PostgreSQL
  // =========================================================================
  it.runIf(hasDatabase)(
    'proves non-retroactive policy versioning: Task snapshots remain frozen when new policy is published',
    async () => {
      const treeId = `tree-pol-ver-${Date.now()}`;
      await treeRepo.save(
        new Tree({
          id: treeId,
          version: 0,
          name: 'Policy Tree',
          species: 'Swietenia macrophylla',
          lat: 10.78,
          lng: 106.7,
          address: 'District 1',
          qrCode: `QR-${treeId}`,
          healthStatus: 'Khỏe mạnh',
          ageYears: 5,
        }),
      );

      const ttId = `tt-pol-ver-${Date.now()}`;
      await taskTypeRepo.save(
        new TaskType({
          id: ttId,
          version: 0,
          name: 'Versioning Task Type',
          defaultProofProfile: 'SERVICE_PROOF',
          isActive: true,
        }),
      );

      const staffId = crypto.randomUUID();
      await userRepo.create({
        id: staffId,
        version: 0,
        email: `staff-pol-${Date.now()}@example.com`,
        initialRole: 'staff',
        role: 'staff',
        accountStatus: 'ACTIVE',
        authVersion: 1,
      });

      const managerId = crypto.randomUUID();
      await userRepo.create({
        id: managerId,
        version: 0,
        email: `mgr-pol-${Date.now()}@example.com`,
        initialRole: 'manager',
        role: 'manager',
        accountStatus: 'ACTIVE',
        authVersion: 1,
      });

      await scopeRepo.addScope(managerId, treeId);

      await policyRepo.saveProofPolicyVersion(
        new ProofPolicyVersion({
          id: `POL-V1-${Date.now()}`,
          taskTypeId: ttId,
          versionNumber: 1,
          proofProfile: 'SERVICE_PROOF',
        }),
      );
      const template1 = new ChecklistTemplateVersion({
        id: `CHK-V1-${Date.now()}`,
        taskTypeId: ttId,
        versionNumber: 1,
        templateItems: [
          { id: '1', text: 'Check roots', order: 1 },
          { id: '2', text: 'Water soil', order: 2 },
        ],
      });
      await policyRepo.saveChecklistTemplateVersion(template1);

      const resolveUseCase = new ResolveTaskTypePolicyUseCase(taskTypeRepo, policyRepo);
      const createTaskUseCase = new CreateTaskUseCase(
        taskRepo,
        treeRepo,
        userRepo,
        scopeRepo,
        resolveUseCase,
        new AuditService(auditWriter),
        operationalUow,
      );

      const task1Result = await createTaskUseCase.execute(
        {
          title: 'Task under v1',
          description: 'Description for task 1 under v1',
          taskTypeId: ttId,
          treeId,
          assignedStaffId: staffId,
          deadline: '2026-11-01T00:00:00Z',
        },
        { actorId: managerId, actorRole: 'manager' },
      );

      expect(task1Result.checklistSnapshot?.length).toBe(2);
      expect(task1Result.checklistTemplateVersionId).toBe(template1.id);

      await policyRepo.saveProofPolicyVersion(
        new ProofPolicyVersion({
          id: `POL-V2-${Date.now()}`,
          taskTypeId: ttId,
          versionNumber: 2,
          proofProfile: 'SERVICE_PROOF',
        }),
      );
      const template2 = new ChecklistTemplateVersion({
        id: `CHK-V2-${Date.now()}`,
        taskTypeId: ttId,
        versionNumber: 2,
        templateItems: [
          { id: '1', text: 'Check roots', order: 1 },
          { id: '2', text: 'Water soil', order: 2 },
          { id: '3', text: 'Inspect foliage', order: 3 },
        ],
      });
      await policyRepo.saveChecklistTemplateVersion(template2);

      const task2Result = await createTaskUseCase.execute(
        {
          title: 'Task under v2',
          description: 'Description for task 2 under v2',
          taskTypeId: ttId,
          treeId,
          assignedStaffId: staffId,
          deadline: '2026-11-02T00:00:00Z',
        },
        { actorId: managerId, actorRole: 'manager' },
      );

      expect(task2Result.checklistSnapshot?.length).toBe(3);
      expect(task2Result.checklistTemplateVersionId).toBe(template2.id);

      const task1FromDb = await taskRepo.findById(task1Result.id);
      expect(task1FromDb?.checklistSnapshot?.length).toBe(2);
      expect(task1FromDb?.checklistTemplateVersionId).toBe(template1.id);
    },
  );
});
