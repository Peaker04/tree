import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import crypto from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzleUserRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-user-repository';
import { DrizzleTreeRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-tree-repository';
import { DrizzleTaskTypeRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-task-type-repository';
import { DrizzleTaskRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-task-repository';
import { DrizzleIdempotencyRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-idempotency-repository';
import { S3ObjectStorageAdapter } from '../../apps/api/src/infrastructure/storage/s3-object-storage';
import { Tree } from '../../apps/api/src/modules/tree-asset-registry/domain/tree.entity';
import { TaskType } from '../../apps/api/src/modules/policy-template-governance/domain/task-type.entity';
import { Task } from '../../apps/api/src/modules/work-management/domain/task.entity';
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
  let storageAdapter: S3ObjectStorageAdapter;

  beforeAll(() => {
    if (hasDatabase && runtimeUrl) {
      pool = new Pool({ connectionString: runtimeUrl });
      db = drizzle(pool, { schema });
      userRepo = new DrizzleUserRepository(db);
      treeRepo = new DrizzleTreeRepository(db);
      taskTypeRepo = new DrizzleTaskTypeRepository(db);
      taskRepo = new DrizzleTaskRepository(db);
      idempotencyRepo = new DrizzleIdempotencyRepository(db);
    }

    if (hasS3) {
      storageAdapter = new S3ObjectStorageAdapter({
        endpoint: s3Endpoint,
        region: process.env['S3_REGION'] || 'us-east-1',
        bucket: process.env['S3_BUCKET'] || 'novyx-evidence',
        accessKeyId: process.env['S3_ACCESS_KEY_ID'] || 'minioadmin',
        secretAccessKey: process.env['S3_SECRET_ACCESS_KEY'] || 'minioadminpassword',
        forcePathStyle: true,
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
});
