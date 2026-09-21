import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../apps/api/src/app';
import { DrizzleUserRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-user-repository';
import { DrizzleSessionRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-session-repository';
import { DrizzleManagerScopeRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-manager-scope-repository';
import { CryptoTokenService } from '../../apps/api/src/infrastructure/security/crypto-token-service';
import { S3ObjectStorageAdapter } from '../../apps/api/src/infrastructure/storage/s3-object-storage';
import * as schema from '../../apps/api/src/infrastructure/persistence/schema';

const { Pool } = pg;

describe('Phase 13 Wave 4: Real Infrastructure End-to-End Tests (Sections 63, 64, 65)', () => {
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

    const rawToken = tokenService.generateToken(32);
    const tokenHash = tokenService.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 3600_000);

    await sessionRepo.createSession({
      id: randomUUID(),
      userId,
      tokenFamily: randomUUID(),
      accessTokenHash: tokenHash,
      refreshTokenHash: tokenService.hashToken(`ref_${randomUUID()}`),
      authVersion: 1,
      sessionVersion: 1,
      accessExpiresAt: expiresAt,
      refreshExpiresAt: expiresAt,
      expiresAt,
    });

    return { userId, token: rawToken };
  }

  beforeAll(() => {
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
    }
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  // =========================================================================
  // 1. Full E2E Happy Path Server Flow (Section 63)
  // =========================================================================
  it.runIf(hasDatabase && hasS3)(
    'executes full create -> execute -> submit -> review -> CareHistory E2E lifecycle on real infrastructure',
    async () => {
      const admin = await createAuthenticatedUser('admin');
      const manager = await createAuthenticatedUser('manager');
      const staff = await createAuthenticatedUser('staff');

      // 1. Establish Manager Operational Scope
      const treeId = `TREE-E2E-${Date.now()}`;
      const qrCode = `QR-${treeId}`;
      await scopeRepo.addScope(manager.userId, treeId);

      // 2. Admin creates Tree
      const treeRes = await app.inject({
        method: 'POST',
        url: '/v1/governance/trees',
        headers: {
          authorization: `Bearer ${admin.token}`,
          'idempotency-key': randomUUID(),
        },
        payload: {
          treeId,
          qrCode,
          name: 'Central Park Mahogany Real Infra',
          species: 'Swietenia macrophylla',
          lat: 10.7769,
          lng: 106.7009,
          address: 'Central Park, District 1, HCMC',
          healthStatus: 'Cần chăm sóc',
          ageYears: 25,
          riskStatus: 'healthy',
        },
      });
      expect(treeRes.statusCode).toBe(201);

      // 3. Admin creates & activates TaskType
      const taskTypeRes = await app.inject({
        method: 'POST',
        url: '/v1/governance/task-types',
        headers: {
          authorization: `Bearer ${admin.token}`,
          'idempotency-key': randomUUID(),
        },
        payload: {
          name: `Pruning & Watering ${Date.now()}`,
          defaultProofProfile: 'CHANGE_PROOF',
          description: 'Seasonal canopy maintenance',
        },
      });
      expect(taskTypeRes.statusCode).toBe(201);
      const taskType = taskTypeRes.json().data;

      // 4. Admin publishes Proof Policy Version
      const policyRes = await app.inject({
        method: 'POST',
        url: '/v1/governance/policies/proof',
        headers: {
          authorization: `Bearer ${admin.token}`,
          'idempotency-key': randomUUID(),
        },
        payload: {
          taskTypeId: taskType.id,
          proofProfile: 'CHANGE_PROOF',
          policyDescription: 'Requires before + after photo and safety checklist',
        },
      });
      expect(policyRes.statusCode).toBe(201);

      // 5. Admin publishes Checklist Template Version
      const templateRes = await app.inject({
        method: 'POST',
        url: '/v1/governance/policies/checklist',
        headers: {
          authorization: `Bearer ${admin.token}`,
          'idempotency-key': randomUUID(),
        },
        payload: {
          taskTypeId: taskType.id,
          templateItems: [
            { text: 'Verify tree identity via QR code', order: 1 },
            { text: 'Inspect soil moisture and root collar', order: 2 },
          ],
        },
      });
      expect(templateRes.statusCode).toBe(201);

      // 6. Manager creates Task
      const taskCreateRes = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: {
          authorization: `Bearer ${manager.token}`,
          'idempotency-key': randomUUID(),
        },
        payload: {
          title: 'Quarterly Maintenance Real Infra',
          description: 'Perform pruning on Mahogany #1',
          taskTypeId: taskType.id,
          treeId,
          assignedStaffId: staff.userId,
          deadline: '2026-11-30T17:00:00Z',
        },
      });
      expect(taskCreateRes.statusCode).toBe(201);
      const task = taskCreateRes.json().data;
      expect(task.status).toBe('PENDING');

      // 7. Staff starts Task
      const startRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/start`,
        headers: {
          authorization: `Bearer ${staff.token}`,
          'idempotency-key': randomUUID(),
        },
        payload: {
          taskId: task.id,
          expectedVersion: task.version,
        },
      });
      expect(startRes.statusCode).toBe(200);
      const startedTask = startRes.json().data;
      expect(startedTask.status).toBe('IN_PROGRESS');

      // 8. Staff presigns evidence upload
      const presignBeforeRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/evidence/presign`,
        headers: {
          authorization: `Bearer ${staff.token}`,
          'idempotency-key': randomUUID(),
        },
        payload: {
          fileName: 'before.jpg',
          contentType: 'image/jpeg',
        },
      });
      expect(presignBeforeRes.statusCode).toBe(200);
      const beforeEvidence = presignBeforeRes.json().data;

      const presignAfterRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/evidence/presign`,
        headers: {
          authorization: `Bearer ${staff.token}`,
          'idempotency-key': randomUUID(),
        },
        payload: {
          fileName: 'after.jpg',
          contentType: 'image/jpeg',
        },
      });
      expect(presignAfterRes.statusCode).toBe(200);
      const afterEvidence = presignAfterRes.json().data;

      // 9. Upload real binary data to MinIO S3
      await storageAdapter.putObjectDirect({
        objectKey: beforeEvidence.objectKey,
        data: Buffer.from('REAL-E2E-BEFORE-PHOTO-DATA'),
        contentType: 'image/jpeg',
        metadata: {
          taskId: task.id,
          uploadedBy: staff.userId,
        },
      });

      await storageAdapter.putObjectDirect({
        objectKey: afterEvidence.objectKey,
        data: Buffer.from('REAL-E2E-AFTER-PHOTO-DATA'),
        contentType: 'image/jpeg',
        metadata: {
          taskId: task.id,
          uploadedBy: staff.userId,
        },
      });

      // 10. Staff submits evidence
      const submitRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/evidence`,
        headers: {
          authorization: `Bearer ${staff.token}`,
          'idempotency-key': randomUUID(),
        },
        payload: {
          taskId: task.id,
          expectedVersion: startedTask.version,
          siteVerification: {
            gpsCheck: {
              lat: 10.7769,
              lng: 106.7009,
              distance: 1.2,
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
            proofProfile: 'CHANGE_PROOF',
            beforePhotoUri: beforeEvidence.objectKey,
            afterPhotoUri: afterEvidence.objectKey,
            checklist: [
              { id: 'chk-1', text: 'Verify tree identity via QR code', done: true },
              { id: 'chk-2', text: 'Inspect soil moisture and root collar', done: true },
            ],
          },
          notes: 'Pruning completed according to standard protocol',
        },
      });
      expect(submitRes.statusCode).toBe(200);
      const submittedTask = submitRes.json().data;
      expect(submittedTask.status).toBe('WAITING_REVIEW');

      // 11. Manager reviews and approves task
      const reviewRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/review`,
        headers: {
          authorization: `Bearer ${manager.token}`,
          'idempotency-key': randomUUID(),
        },
        payload: {
          taskId: task.id,
          expectedVersion: submittedTask.version,
          decision: 'APPROVE',
          reviewNotes: 'Work verified and approved on real infrastructure.',
        },
      });
      expect(reviewRes.statusCode).toBe(200);
      const approvedTask = reviewRes.json().data;
      expect(approvedTask.status).toBe('COMPLETED');

      // 12. Verify CareHistory persisted in real PostgreSQL
      const careHistoryRows = await db
        .select()
        .from(schema.careHistories)
        .where(eq(schema.careHistories.taskId, task.id));
      expect(careHistoryRows.length).toBe(1);
      expect(careHistoryRows[0]?.treeId).toBe(treeId);
      expect(careHistoryRows[0]?.performedByUserId).toBe(staff.userId);
    },
  );

  // =========================================================================
  // 2. Second E2E: Targeted Rework Path (Section 64)
  // =========================================================================
  it.runIf(hasDatabase && hasS3)(
    'executes Create -> Start -> Submit -> RequestRework -> ResubmitRework -> Approve on real infrastructure',
    async () => {
      const admin = await createAuthenticatedUser('admin');
      const manager = await createAuthenticatedUser('manager');
      const staff = await createAuthenticatedUser('staff');

      const treeId = `TREE-REWORK-${Date.now()}`;
      const qrCode = `QR-${treeId}`;
      await scopeRepo.addScope(manager.userId, treeId);

      // Create Tree, TaskType, Policy, Template
      await app.inject({
        method: 'POST',
        url: '/v1/governance/trees',
        headers: { authorization: `Bearer ${admin.token}`, 'idempotency-key': randomUUID() },
        payload: {
          treeId,
          qrCode,
          name: 'Rework Tree',
          species: 'Dipterocarpus alatus',
          lat: 10.776,
          lng: 106.701,
          address: 'District 1',
          healthStatus: 'Khỏe mạnh',
          ageYears: 10,
        },
      });

      const ttRes = await app.inject({
        method: 'POST',
        url: '/v1/governance/task-types',
        headers: { authorization: `Bearer ${admin.token}`, 'idempotency-key': randomUUID() },
        payload: { name: `Soil Care ${Date.now()}`, defaultProofProfile: 'SERVICE_PROOF' },
      });
      const taskType = ttRes.json().data;

      await app.inject({
        method: 'POST',
        url: '/v1/governance/policies/proof',
        headers: { authorization: `Bearer ${admin.token}`, 'idempotency-key': randomUUID() },
        payload: { taskTypeId: taskType.id, proofProfile: 'SERVICE_PROOF' },
      });

      await app.inject({
        method: 'POST',
        url: '/v1/governance/policies/checklist',
        headers: { authorization: `Bearer ${admin.token}`, 'idempotency-key': randomUUID() },
        payload: {
          taskTypeId: taskType.id,
          templateItems: [{ text: 'Apply fertilizer', order: 1 }],
        },
      });

      // Manager creates task
      const taskRes = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: { authorization: `Bearer ${manager.token}`, 'idempotency-key': randomUUID() },
        payload: {
          title: 'Soil Treatment',
          description: 'Quarterly soil treatment and fertilization',
          taskTypeId: taskType.id,
          treeId,
          assignedStaffId: staff.userId,
          deadline: '2026-11-30T17:00:00Z',
        },
      });
      expect(taskRes.statusCode).toBe(201);
      const task = taskRes.json().data;

      // Staff starts task
      const startRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/start`,
        headers: { authorization: `Bearer ${staff.token}`, 'idempotency-key': randomUUID() },
        payload: { taskId: task.id, expectedVersion: task.version },
      });
      expect(startRes.statusCode).toBe(200);
      const startedTask = startRes.json().data;

      // Staff presigns and uploads photo
      const presignRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/evidence/presign`,
        headers: { authorization: `Bearer ${staff.token}`, 'idempotency-key': randomUUID() },
        payload: { fileName: 'soil.jpg', contentType: 'image/jpeg' },
      });
      expect(presignRes.statusCode).toBe(200);
      const photo1 = presignRes.json().data;

      await storageAdapter.putObjectDirect({
        objectKey: photo1.objectKey,
        data: Buffer.from('PHOTO-1-DATA'),
        contentType: 'image/jpeg',
        metadata: { taskId: task.id, uploadedBy: staff.userId },
      });

      // Staff submits evidence
      const submitRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/evidence`,
        headers: { authorization: `Bearer ${staff.token}`, 'idempotency-key': randomUUID() },
        payload: {
          taskId: task.id,
          expectedVersion: startedTask.version,
          siteVerification: {
            gpsCheck: { lat: 10.776, lng: 106.701, distance: 1.0, verified: true, timestamp: new Date().toISOString() },
            qrCheck: { scannedCode: qrCode, verified: true, timestamp: new Date().toISOString() },
          },
          proof: {
            proofProfile: 'SERVICE_PROOF',
            completionPhotoUri: photo1.objectKey,
            checklist: [{ id: 'chk-1', text: 'Apply fertilizer', done: true }],
          },
        },
      });
      const submittedTask = submitRes.json().data;
      expect(submittedTask.status).toBe('WAITING_REVIEW');

      // Manager requests rework
      const reworkReqRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/review`,
        headers: { authorization: `Bearer ${manager.token}`, 'idempotency-key': randomUUID() },
        payload: {
          taskId: task.id,
          expectedVersion: submittedTask.version,
          decision: 'REQUEST_REWORK',
          reviewNotes: 'Fertilizer distribution uneven',
          reworkItems: [{ itemId: 'chk-1', comment: 'Re-spread fertilizer around drip line' }],
        },
      });
      expect(reworkReqRes.statusCode).toBe(200);
      const reworkTask = reworkReqRes.json().data;
      expect(reworkTask.status).toBe('REWORK_REQUIRED');

      // Staff presigns and uploads rework photo
      const presign2Res = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/evidence/presign`,
        headers: { authorization: `Bearer ${staff.token}`, 'idempotency-key': randomUUID() },
        payload: { fileName: 'soil-rework.jpg', contentType: 'image/jpeg' },
      });
      expect(presign2Res.statusCode).toBe(200);
      const photo2 = presign2Res.json().data;

      await storageAdapter.putObjectDirect({
        objectKey: photo2.objectKey,
        data: Buffer.from('PHOTO-2-DATA'),
        contentType: 'image/jpeg',
        metadata: { taskId: task.id, uploadedBy: staff.userId },
      });

      // Staff resubmits rework
      const resubmitRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/rework/resubmit`,
        headers: { authorization: `Bearer ${staff.token}`, 'idempotency-key': randomUUID() },
        payload: {
          taskId: task.id,
          expectedVersion: reworkTask.version,
          siteVerification: {
            gpsCheck: { lat: 10.776, lng: 106.701, distance: 1.0, verified: true, timestamp: new Date().toISOString() },
            qrCheck: { scannedCode: qrCode, verified: true, timestamp: new Date().toISOString() },
          },
          proof: {
            proofProfile: 'SERVICE_PROOF',
            completionPhotoUri: photo2.objectKey,
            checklist: [{ id: 'chk-1', text: 'Apply fertilizer', done: true }],
          },
          notes: 'Respread fertilizer evenly',
        },
      });
      expect(resubmitRes.statusCode).toBe(200);
      const resubmittedTask = resubmitRes.json().data;
      expect(resubmittedTask.status).toBe('WAITING_REVIEW');

      // Manager approves
      const finalReviewRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/review`,
        headers: { authorization: `Bearer ${manager.token}`, 'idempotency-key': randomUUID() },
        payload: {
          taskId: task.id,
          expectedVersion: resubmittedTask.version,
          decision: 'APPROVE',
          reviewNotes: 'Rework accepted.',
        },
      });
      expect(finalReviewRes.statusCode).toBe(200);
      expect(finalReviewRes.json().data.status).toBe('COMPLETED');
    },
  );

  // =========================================================================
  // 3. Third E2E: Blocked & Reassignment Path (Section 65)
  // =========================================================================
  it.runIf(hasDatabase && hasS3)(
    'executes Create -> Start -> ReportFieldIssue -> Reassign -> New Staff Starts on real infrastructure',
    async () => {
      const admin = await createAuthenticatedUser('admin');
      const manager = await createAuthenticatedUser('manager');
      const staff1 = await createAuthenticatedUser('staff');
      const staff2 = await createAuthenticatedUser('staff');

      const treeId = `TREE-BLOCKED-${Date.now()}`;
      const qrCode = `QR-${treeId}`;
      await scopeRepo.addScope(manager.userId, treeId);

      await app.inject({
        method: 'POST',
        url: '/v1/governance/trees',
        headers: { authorization: `Bearer ${admin.token}`, 'idempotency-key': randomUUID() },
        payload: {
          treeId,
          qrCode,
          name: 'Blocked Tree',
          species: 'Hopea odorata',
          lat: 10.77,
          lng: 106.7,
          address: 'District 1',
          healthStatus: 'Khỏe mạnh',
          ageYears: 8,
        },
      });

      const ttRes = await app.inject({
        method: 'POST',
        url: '/v1/governance/task-types',
        headers: { authorization: `Bearer ${admin.token}`, 'idempotency-key': randomUUID() },
        payload: { name: `Branch Trimming ${Date.now()}`, defaultProofProfile: 'SERVICE_PROOF' },
      });
      const taskType = ttRes.json().data;

      await app.inject({
        method: 'POST',
        url: '/v1/governance/policies/proof',
        headers: { authorization: `Bearer ${admin.token}`, 'idempotency-key': randomUUID() },
        payload: { taskTypeId: taskType.id, proofProfile: 'SERVICE_PROOF' },
      });

      await app.inject({
        method: 'POST',
        url: '/v1/governance/policies/checklist',
        headers: { authorization: `Bearer ${admin.token}`, 'idempotency-key': randomUUID() },
        payload: {
          taskTypeId: taskType.id,
          templateItems: [{ text: 'Trim dead branches', order: 1 }],
        },
      });

      // Manager creates task assigned to Staff 1
      const taskRes = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: { authorization: `Bearer ${manager.token}`, 'idempotency-key': randomUUID() },
        payload: {
          title: 'Trim High Branches',
          description: 'Specialized high branch trimming near electrical infrastructure',
          taskTypeId: taskType.id,
          treeId,
          assignedStaffId: staff1.userId,
          deadline: '2026-11-30T17:00:00Z',
        },
      });
      expect(taskRes.statusCode).toBe(201);
      const task = taskRes.json().data;

      // Staff 1 starts task
      const startRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/start`,
        headers: { authorization: `Bearer ${staff1.token}`, 'idempotency-key': randomUUID() },
        payload: { taskId: task.id, expectedVersion: task.version },
      });
      const startedTask = startRes.json().data;
      expect(startedTask.status).toBe('IN_PROGRESS');

      // Staff 1 reports field issue -> BLOCKED
      const issueRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/issues`,
        headers: { authorization: `Bearer ${staff1.token}`, 'idempotency-key': randomUUID() },
        payload: {
          taskId: task.id,
          expectedVersion: startedTask.version,
          reason: 'ACCESS_BLOCKED',
          description: 'High voltage electrical wires tangled in upper canopy',
        },
      });
      expect(issueRes.statusCode).toBe(200);
      const blockedTask = issueRes.json().data;
      expect(blockedTask.status).toBe('BLOCKED');

      // Manager reassigns task to Staff 2 -> PENDING
      const reassignRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/reassign`,
        headers: { authorization: `Bearer ${manager.token}`, 'idempotency-key': randomUUID() },
        payload: {
          taskId: task.id,
          expectedVersion: blockedTask.version,
          newStaffId: staff2.userId,
          reason: 'Specialized power-certified arborist assigned',
        },
      });
      expect(reassignRes.statusCode).toBe(200);
      const reassignedTask = reassignRes.json().data;
      expect(reassignedTask.status).toBe('PENDING');
      expect(reassignedTask.assignedStaffId).toBe(staff2.userId);

      // Staff 2 starts task -> IN_PROGRESS
      const start2Res = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/start`,
        headers: { authorization: `Bearer ${staff2.token}`, 'idempotency-key': randomUUID() },
        payload: { taskId: task.id, expectedVersion: reassignedTask.version },
      });
      expect(start2Res.statusCode).toBe(200);
      const startedTask2 = start2Res.json().data;
      expect(startedTask2.status).toBe('IN_PROGRESS');
      expect(startedTask2.assignedStaffId).toBe(staff2.userId);
    },
  );
});
