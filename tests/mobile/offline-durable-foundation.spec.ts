import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import {
  CANONICAL_TASK_STATUSES,
  TaskStatusSchema,
  SubmitEvidenceRequestSchema,
  type SubmitEvidenceRequest,
} from '@novyx/contracts';
import {
  createInMemoryTestDatabase,
  createDiskTestDatabase,
} from '../../apps/mobile/src/storage/database/sqliteDatabase';
import {
  runMigrations,
  getCurrentSchemaVersion,
  LATEST_SCHEMA_VERSION,
} from '../../apps/mobile/src/storage/database/migrations';
import type { IDatabaseConnection } from '../../apps/mobile/src/storage/database/types';
import { SqliteOutboxRepository } from '../../apps/mobile/src/storage/outbox/outboxRepository';
import {
  OutboxCoordinator,
  classifyError,
  isRetryableError,
  type IOutboxDispatcher,
} from '../../apps/mobile/src/storage/outbox/outboxCoordinator';
import {
  validateStatusDimensions,
  isCanonicalTaskStatus,
  assertNoIdempotencyKeyInBody,
} from '../../apps/mobile/src/storage/outbox/stateSeparation';
import { SqliteMobileTaskRepository } from '../../apps/mobile/src/storage/task/mobileTaskRepository';
import { SqliteAuthenticatedSnapshotCache } from '../../apps/mobile/src/storage/cache/authenticatedSnapshotCache';
import {
  InMemoryEvidenceFileStore,
  canSafelyDeleteEvidence,
  sanitizeEvidenceFileName,
} from '../../apps/mobile/src/storage/evidence/evidenceFileStore';
import {
  isValidSha256,
  NodeEvidenceHasher,
  base64ToUint8Array,
  bytesToHex,
} from '../../apps/mobile/src/storage/evidence/evidenceHasher';
import {
  generateSecureUuid,
  setUuidGenerator,
  isValidUuidV4,
  assertValidUuidV4,
} from '../../apps/mobile/src/storage/utils/uuid';
import { executeOfflineSubmission } from '../../apps/mobile/src/storage/outbox/submissionService';

describe('Phase 13 Wave 5A: Mobile Durable Persistence & Outbox Foundation', () => {
  let db: IDatabaseConnection;
  let outboxRepo: SqliteOutboxRepository;
  let taskRepo: SqliteMobileTaskRepository;
  let fileStore: InMemoryEvidenceFileStore;
  let hasher: NodeEvidenceHasher;

  const validSampleRequest: SubmitEvidenceRequest = {
    taskId: 'task-test-01',
    expectedVersion: 1,
    siteVerification: {
      gpsCheck: {
        distance: 4.5,
        lat: 10.7769,
        lng: 106.7009,
        verified: true,
        timestamp: '2026-09-22T08:00:00.000Z',
      },
      qrCheck: {
        scannedCode: 'QR-TREE-001',
        verified: true,
        timestamp: '2026-09-22T08:00:01.000Z',
      },
    },
    proof: {
      proofProfile: 'CHANGE_PROOF',
      beforePhotoUri: 'file:///sandbox/evidence/task-test-01/before.jpg',
      afterPhotoUri: 'file:///sandbox/evidence/task-test-01/after.jpg',
      checklist: [
        { id: 'item-1', text: 'Tỉa cành khô', done: true },
        { id: 'item-2', text: 'Quét vôi gốc cây', done: true },
      ],
    },
    notes: 'Hoàn thành tỉa cành định kỳ',
  };

  beforeEach(async () => {
    setUuidGenerator(null);
    db = await createInMemoryTestDatabase();
    outboxRepo = new SqliteOutboxRepository(db);
    taskRepo = new SqliteMobileTaskRepository(db);
    hasher = new NodeEvidenceHasher();
    fileStore = new InMemoryEvidenceFileStore(hasher);

    // Seed task in cached_tasks via taskRepo
    await taskRepo.cacheTasks([
      {
        id: 'task-test-01',
        title: 'Tỉa cành công viên',
        taskType: 'PRUNING',
        treeId: 'tree-01',
        treeName: 'Cây Dầu Rái',
        treeAddress: 'Công viên Gia Định',
        assignedStaffId: 'staff-01',
        assignedStaffName: 'Nguyễn Văn A',
        deadline: '2026-09-25T17:00:00.000Z',
        status: 'IN_PROGRESS',
        version: 1,
        checklist: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  });

  // =========================================================================
  // Assertion A: PENDING_SYNC never appears in TaskStatus
  // =========================================================================
  it('Requirement A: PENDING_SYNC never appears in TaskStatus (P13W5A-N02)', () => {
    expect(CANONICAL_TASK_STATUSES).not.toContain('PENDING_SYNC');

    const parseResult = TaskStatusSchema.safeParse('PENDING_SYNC');
    expect(parseResult.success).toBe(false);

    const validation = validateStatusDimensions({
      taskStatus: 'PENDING_SYNC',
      localSubmissionStatus: 'IDLE',
      syncStatus: 'IDLE',
    });
    expect(validation.valid).toBe(false);
    expect(validation.violations.some((v) => v.includes('P13W5A-N02'))).toBe(true);

    expect(isCanonicalTaskStatus('PENDING_SYNC')).toBe(false);
  });

  // =========================================================================
  // Assertion B: SYNCING / SYNC_FAILED never appear in TaskStatus
  // =========================================================================
  it('Requirement B: SYNCING / SYNC_FAILED never appear in TaskStatus (P13W5A-N03)', () => {
    expect(CANONICAL_TASK_STATUSES).not.toContain('SYNCING');
    expect(CANONICAL_TASK_STATUSES).not.toContain('SYNC_FAILED');

    expect(TaskStatusSchema.safeParse('SYNCING').success).toBe(false);
    expect(TaskStatusSchema.safeParse('SYNC_FAILED').success).toBe(false);

    const validationSyncing = validateStatusDimensions({
      taskStatus: 'SYNCING',
      localSubmissionStatus: 'PENDING_SYNC',
      syncStatus: 'SYNCING',
    });
    expect(validationSyncing.valid).toBe(false);
    expect(validationSyncing.violations.some((v) => v.includes('P13W5A-N03'))).toBe(true);

    const validationFailed = validateStatusDimensions({
      taskStatus: 'SYNC_FAILED',
      localSubmissionStatus: 'PENDING_SYNC',
      syncStatus: 'SYNC_FAILED',
    });
    expect(validationFailed.valid).toBe(false);
    expect(validationFailed.violations.some((v) => v.includes('P13W5A-N03'))).toBe(true);
  });

  // =========================================================================
  // Assertion C: Enqueue creates exactly one stable UUIDv4 idempotency key
  // =========================================================================
  it('Requirement C: Enqueue creates exactly one stable UUIDv4 idempotency key (P13W5A-P06)', async () => {
    const item = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    expect(item).toBeDefined();
    expect(item.idempotencyKey).toBeDefined();
    expect(item.idempotencyKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    const fetched = await outboxRepo.getItemById(item.id);
    expect(fetched?.idempotencyKey).toBe(item.idempotencyKey);
  });

  // =========================================================================
  // Assertion D: Retry of the same outbox item retains the same key
  // =========================================================================
  it('Requirement D: Retry of the same outbox item retains the exact same idempotency key (P13W5A-N05)', async () => {
    const item = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });
    const originalKey = item.idempotencyKey;

    await outboxRepo.updateItemSyncStatus(item.id, 'SYNC_FAILED', 'Network timeout', 'NETWORK');

    const retriedItem = await outboxRepo.getItemById(item.id);
    expect(retriedItem?.attemptCount).toBe(1);
    expect(retriedItem?.idempotencyKey).toBe(originalKey);

    await outboxRepo.updateItemSyncStatus(item.id, 'SYNCING');
    await outboxRepo.updateItemSyncStatus(item.id, 'SYNC_FAILED', 'HTTP 503 Service Unavailable', 'SERVER_5XX');

    const secondRetried = await outboxRepo.getItemById(item.id);
    expect(secondRetried?.attemptCount).toBe(2);
    expect(secondRetried?.idempotencyKey).toBe(originalKey);
  });

  // =========================================================================
  // Assertion E: Two separate logical submissions receive different keys
  // =========================================================================
  it('Requirement E: Two separate logical submissions receive different idempotency keys', async () => {
    const item1 = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    const item2 = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    expect(item1.idempotencyKey).not.toBe(item2.idempotencyKey);
    expect(item1.id).not.toBe(item2.id);
  });

  // =========================================================================
  // Assertion F: Idempotency-Key is absent from SubmitEvidenceRequest body
  // =========================================================================
  it('Requirement F: Idempotency-Key is absent from SubmitEvidenceRequest body (P13W5A-N04)', async () => {
    const parsed = SubmitEvidenceRequestSchema.safeParse(validSampleRequest);
    expect(parsed.success).toBe(true);
    expect(Object.keys(validSampleRequest)).not.toContain('idempotencyKey');
    expect(Object.keys(validSampleRequest)).not.toContain('Idempotency-Key');

    const poisonedPayload = {
      ...validSampleRequest,
      idempotencyKey: 'some-key',
    };
    expect(() => assertNoIdempotencyKeyInBody(poisonedPayload)).toThrow(
      'P13W5A-N04 Violation: Idempotency-Key must NOT be inside SubmitEvidenceRequest body',
    );

    await expect(
      outboxRepo.enqueueTransactional({
        taskId: 'task-test-01',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request: poisonedPayload as any,
      }),
    ).rejects.toThrow('P13W5A-N04');
  });

  // =========================================================================
  // Assertion G: FIFO ordering is deterministic
  // =========================================================================
  it('Requirement G: FIFO ordering is deterministic (oldest eligible item first) (P13W5A-P05)', async () => {
    const item1 = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    await new Promise((resolve) => setTimeout(resolve, 15));

    const item2 = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    await new Promise((resolve) => setTimeout(resolve, 15));

    const item3 = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    const firstPicked = await outboxRepo.getNextEligibleItem();
    expect(firstPicked?.id).toBe(item1.id);

    await outboxRepo.markCompleted(item1.id);

    const secondPicked = await outboxRepo.getNextEligibleItem();
    expect(secondPicked?.id).toBe(item2.id);

    await outboxRepo.markCompleted(item2.id);

    const thirdPicked = await outboxRepo.getNextEligibleItem();
    expect(thirdPicked?.id).toBe(item3.id);
  });

  // =========================================================================
  // Assertion H: Failed/retryable item remains durable
  // =========================================================================
  it('Requirement H: Failed/retryable item remains durable with classified error', async () => {
    const item = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    const dispatcher: IOutboxDispatcher = {
      dispatch: async () => ({
        success: false,
        status: 503,
        error: 'Service Unavailable',
      }),
    };

    const coordinator = new OutboxCoordinator(outboxRepo, dispatcher);
    const result = await coordinator.processNext();

    expect(result).toBeDefined();
    expect(result?.success).toBe(false);
    expect(result?.classification).toBe('SERVER_5XX');
    expect(isRetryableError(result?.classification ?? 'NETWORK')).toBe(true);

    const durableItem = await outboxRepo.getItemById(item.id);
    expect(durableItem).toBeDefined();
    expect(durableItem?.syncStatus).toBe('SYNC_FAILED');
    expect(durableItem?.lastError).toBe('Service Unavailable');
    expect(durableItem?.errorClassification).toBe('SERVER_5XX');
    expect(durableItem?.attemptCount).toBe(1);

    const nextEligible = await outboxRepo.getNextEligibleItem();
    expect(nextEligible?.id).toBe(item.id);
  });

  it('Section 15: Error classification accurately identifies retryable vs non-retryable errors', () => {
    expect(classifyError(new TypeError('Failed to fetch'))).toBe('NETWORK');
    expect(classifyError(new Error('Network request failed: timeout'))).toBe('NETWORK');
    expect(classifyError({ status: 500, error: 'Internal Server Error' })).toBe('SERVER_5XX');
    expect(classifyError({ status: 503, error: 'Service Unavailable' })).toBe('SERVER_5XX');
    expect(isRetryableError('NETWORK')).toBe(true);
    expect(isRetryableError('SERVER_5XX')).toBe(true);

    expect(classifyError({ status: 400, error: 'Bad Request' })).toBe('VALIDATION');
    expect(classifyError({ status: 401, error: 'Unauthorized' })).toBe('AUTH');
    expect(classifyError({ status: 403, error: 'Forbidden' })).toBe('FORBIDDEN');
    expect(classifyError({ status: 409, error: 'Conflict' })).toBe('CONFLICT');
    expect(isRetryableError('VALIDATION')).toBe(false);
    expect(isRetryableError('AUTH')).toBe(false);
    expect(isRetryableError('FORBIDDEN')).toBe(false);
    expect(isRetryableError('CONFLICT')).toBe(false);
  });

  // =========================================================================
  // Assertion I: Conflict/failure does not delete local evidence metadata
  // =========================================================================
  it('Requirement I: Conflict/failure does NOT delete local evidence metadata or files (P13W5A-N09)', async () => {
    const persisted = await fileStore.persistEvidence({
      taskId: 'task-test-01',
      stage: 'BEFORE',
      sourceUri: 'file:///cache/camera/temp_before.jpg',
      fileName: 'before.jpg',
    });
    await taskRepo.saveEvidenceMetadata(persisted);

    await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    const conflictDispatcher: IOutboxDispatcher = {
      dispatch: async () => ({
        success: false,
        status: 409,
        error: 'OCC Version Conflict: expected version 1 but current version is 2',
      }),
    };

    const coordinator = new OutboxCoordinator(outboxRepo, conflictDispatcher);
    const result = await coordinator.processNext();
    expect(result?.success).toBe(false);
    expect(result?.classification).toBe('CONFLICT');

    const evidenceList = await taskRepo.listEvidenceByTask('task-test-01');
    expect(evidenceList.length).toBe(1);
    expect(evidenceList[0].sha256).toBe(persisted.sha256);
    expect(evidenceList[0].sandboxFileUri).toBe(persisted.sandboxFileUri);

    const fileExists = await fileStore.fileExists(persisted.sandboxFileUri);
    expect(fileExists).toBe(true);

    const canDelete = canSafelyDeleteEvidence({
      syncStatus: 'SYNC_FAILED',
      localSubmissionStatus: 'PENDING_SYNC',
      hasConflict: true,
    });
    expect(canDelete).toBe(false);
  });

  // =========================================================================
  // Assertion J: Outbox completion is not interpreted as server TaskStatus mutation
  // =========================================================================
  it('Requirement J: Offline enqueue produces PENDING_SYNC without changing server TaskStatus (P13W5A-N10, P13W5A-P08)', async () => {
    const initialTask = await taskRepo.getCachedTask('task-test-01');
    expect(initialTask?.status).toBe('IN_PROGRESS');

    await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    const draft = await taskRepo.getDraft('task-test-01');
    expect(draft?.submissionStatus).toBe('PENDING_SYNC');

    const taskAfterEnqueue = await taskRepo.getCachedTask('task-test-01');
    expect(taskAfterEnqueue?.status).toBe('IN_PROGRESS');
    expect(taskAfterEnqueue?.status).not.toBe('WAITING_REVIEW');
  });

  // =========================================================================
  // Assertion K: Migration runner is deterministic and version-aware
  // =========================================================================
  it('Requirement K: Migration runner is deterministic and version-aware (PRAGMA user_version) (P13W5A-P02)', async () => {
    const currentVer = await getCurrentSchemaVersion(db);
    expect(currentVer).toBe(LATEST_SCHEMA_VERSION);

    const rerun = await runMigrations(db);
    expect(rerun.appliedCount).toBe(0);
    expect(rerun.currentVersion).toBe(LATEST_SCHEMA_VERSION);

    const migrationsRows = await db.getAllAsync<{ version: number; name: string }>(
      'SELECT version, name FROM schema_migrations ORDER BY version ASC;',
    );
    expect(migrationsRows.length).toBe(3);
    expect(migrationsRows[0].name).toBe('initial_offline_schema');
    expect(migrationsRows[1].name).toBe('remove_destructive_cascade_fk');
    expect(migrationsRows[2].name).toBe('authenticated_snapshot_cache');
  });

  it('B2: authenticated snapshot cache is user-scoped and excludes ephemeral notifications', async () => {
    const cache = new SqliteAuthenticatedSnapshotCache(db);
    await cache.save('user-a', {
      trees: [],
      staff: [],
      tasks: [],
      notifications: [
        {
          id: 'local-only',
          title: 'Local',
          body: 'Ephemeral',
          timestamp: '2026-09-20T10:00:00.000Z',
          read: false,
          type: 'info',
        },
      ],
    });

    expect((await cache.load('user-a'))?.data.notifications).toEqual([]);
    expect(await cache.load('user-b')).toBeNull();
  });

  // =========================================================================
  // Assertion L: Auth credentials are NOT persisted in SQLite/outbox schema
  // =========================================================================
  it('Requirement L: Auth credentials are NOT persisted in SQLite/outbox schema (P13W5A-N08, P13W5A-P10)', async () => {
    const outboxCols = await db.getAllAsync<{ name: string }>("PRAGMA table_info('outbox_items');");
    const colNames = outboxCols.map((c) => c.name.toLowerCase());
    expect(colNames).not.toContain('accesstoken');
    expect(colNames).not.toContain('token');
    expect(colNames).not.toContain('password');
    expect(colNames).not.toContain('refreshtoken');

    const item = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });
    const parsedPayload = JSON.parse(item.payloadJson);
    expect(parsedPayload.accessToken).toBeUndefined();
    expect(parsedPayload.refreshToken).toBeUndefined();
    expect(parsedPayload.token).toBeUndefined();
    expect(parsedPayload.password).toBeUndefined();
  });

  // =========================================================================
  // Assertion M: Binary image data / Base64 is NOT persisted in SQLite payload fields
  // =========================================================================
  it('Requirement M: Binary image data/Base64 is NOT persisted in SQLite payload fields (P13W5A-N06)', async () => {
    const persisted = await fileStore.persistEvidence({
      taskId: 'task-test-01',
      stage: 'AFTER',
      sourceUri: 'file:///cache/camera/temp_after.jpg',
      fileName: 'after.jpg',
    });
    await taskRepo.saveEvidenceMetadata(persisted);

    const rows = await db.getAllAsync<{ local_file_uri: string; sha256: string }>(
      'SELECT local_file_uri, sha256 FROM local_evidence WHERE id = ?;',
      [persisted.id],
    );

    expect(rows.length).toBe(1);
    expect(rows[0].local_file_uri).toMatch(/^file:\/\//);
    expect(rows[0].local_file_uri).not.toMatch(/^data:image/);
    expect(isValidSha256(rows[0].sha256)).toBe(true);

    const evidenceCols = await db.getAllAsync<{ name: string; type: string }>("PRAGMA table_info('local_evidence');");
    for (const col of evidenceCols) {
      expect(col.type.toUpperCase()).not.toBe('BLOB');
    }
  });

  // =========================================================================
  // W5A-F01 & W5A-F02: Exact-Byte SHA-256 with bytes >= 0x80
  // =========================================================================
  it('W5A-F01 & W5A-F02: exact-byte SHA-256 test vector includes bytes >= 0x80 and matches reference Node digest', async () => {
    // Vector with bytes 0x00, 0x01, 0x7f, 0x80, 0xff, 0x10, 0xc3, 0xa9
    const testBytes = new Uint8Array([0x00, 0x01, 0x7f, 0x80, 0xff, 0x10, 0xc3, 0xa9]);
    expect(bytesToHex(testBytes)).toBe('00017f80ff10c3a9');

    // Independent Node crypto reference calculation
    const expectedReferenceHash = crypto.createHash('sha256').update(testBytes).digest('hex').toLowerCase();
    expect(expectedReferenceHash).toBe('7e34c09ae4313a57257abb2ebe1276c47d9ad0f2e34f0d52d0fb199ed161817f');

    // Test through NodeEvidenceHasher
    const computedHash = await hasher.hashBytes(testBytes);
    expect(computedHash).toBe(expectedReferenceHash);

    // Test Base64 byte decoding path
    // Buffer.from(testBytes).toString('base64') -> "AAF/gP8Qw6k="
    const base64Str = Buffer.from(testBytes).toString('base64');
    const decodedBytes = base64ToUint8Array(base64Str);
    expect(Array.from(decodedBytes)).toEqual(Array.from(testBytes));

    const hashFromDecoded = await hasher.hashBytes(decodedBytes);
    expect(hashFromDecoded).toBe(expectedReferenceHash);
  });

  // =========================================================================
  // W5A-F03: Static verification that digestStringAsync is NOT used for binary hashing
  // =========================================================================
  it('W5A-F03: no digestStringAsync binary-string hashing remains in evidenceHasher', () => {
    const hasherSourcePath = path.resolve(__dirname, '../../apps/mobile/src/storage/evidence/evidenceHasher.ts');
    const sourceCode = fs.readFileSync(hasherSourcePath, 'utf8');

    expect(sourceCode).not.toContain('digestStringAsync');
    expect(sourceCode).not.toContain('atob(');
    expect(sourceCode).toContain('Crypto.digest');
  });

  // =========================================================================
  // W5A-F04 & W5A-F05: Interrupted SYNCING recovery on DB disk close/reopen
  // =========================================================================
  it('W5A-F04 & W5A-F05: persisted SYNCING item is recovered after real DB disk close/reopen and preserves Idempotency-Key', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novyx-test-durability-'));
    const tempDbPath = path.join(tempDir, 'durability.db');

    try {
      // 1. Open disk DB 1, seed and enqueue an item
      const db1 = await createDiskTestDatabase(tempDbPath);
      const outbox1 = new SqliteOutboxRepository(db1);
      const taskRepo1 = new SqliteMobileTaskRepository(db1);

      await taskRepo1.cacheTasks([
        {
          id: 'task-restart-01',
          title: 'Task Restart Test',
          taskType: 'PRUNING',
          treeId: 'tree-01',
          treeName: 'Cây Dầu',
          treeAddress: 'Gia Định',
          assignedStaffId: 'staff-01',
          assignedStaffName: 'Staff 1',
          deadline: '2026-09-25T17:00:00.000Z',
          status: 'IN_PROGRESS',
          version: 1,
          checklist: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const item = await outbox1.enqueueTransactional({
        taskId: 'task-restart-01',
        request: validSampleRequest,
      });

      // Simulate mid-dispatch: mark row as SYNCING before worker process dies
      await outbox1.updateItemSyncStatus(item.id, 'SYNCING');
      const itemBeforeCrash = await outbox1.getItemById(item.id);
      expect(itemBeforeCrash?.syncStatus).toBe('SYNCING');

      // Close DB connection (simulating process kill)
      await db1.closeAsync?.();

      // 2. Open brand new DB connection 2 to the exact same disk file
      const db2 = await createDiskTestDatabase(tempDbPath);
      const outbox2 = new SqliteOutboxRepository(db2);

      // Perform crash recovery
      const recoveredCount = await outbox2.recoverInterruptedSyncs();
      expect(recoveredCount).toBe(1);

      // Verify item state
      const recoveredItem = await outbox2.getItemById(item.id);
      expect(recoveredItem).toBeDefined();
      expect(recoveredItem?.id).toBe(item.id);
      // Preserved exact Idempotency-Key
      expect(recoveredItem?.idempotencyKey).toBe(item.idempotencyKey);
      // Transitioned to retryable SYNC_FAILED
      expect(recoveredItem?.syncStatus).toBe('SYNC_FAILED');
      expect(recoveredItem?.errorClassification).toBe('NETWORK');
      expect(recoveredItem?.lastError).toBe('INTERRUPTED_SYNC_RECOVERY');

      // Verify it is immediately eligible for FIFO dispatch again
      const nextEligible = await outbox2.getNextEligibleItem();
      expect(nextEligible?.id).toBe(item.id);

      await db2.closeAsync?.();
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // =========================================================================
  // W5A-F06 to W5A-F11: Automatic eligibility based on retry classification
  // =========================================================================
  it('W5A-F06 & W5A-F07: NETWORK and SERVER_5XX failures are auto-eligible for retry', async () => {
    // 1. NETWORK failed item
    const netItem = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });
    await outboxRepo.updateItemSyncStatus(netItem.id, 'SYNC_FAILED', 'Connection refused', 'NETWORK');

    const eligibleNet = await outboxRepo.getNextEligibleItem();
    expect(eligibleNet?.id).toBe(netItem.id);
    await outboxRepo.markCompleted(netItem.id);

    // 2. SERVER_5XX failed item
    const serverItem = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });
    await outboxRepo.updateItemSyncStatus(serverItem.id, 'SYNC_FAILED', '503 Service Unavailable', 'SERVER_5XX');

    const eligibleServer = await outboxRepo.getNextEligibleItem();
    expect(eligibleServer?.id).toBe(serverItem.id);
  });

  it('W5A-F08 to W5A-F11: VALIDATION, CONFLICT, FORBIDDEN, and AUTH failures are NOT auto-eligible', async () => {
    // 1. VALIDATION failure
    const valItem = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });
    await outboxRepo.updateItemSyncStatus(valItem.id, 'SYNC_FAILED', 'Invalid GPS format', 'VALIDATION');

    // 2. CONFLICT failure
    const conflictItem = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });
    await outboxRepo.updateItemSyncStatus(conflictItem.id, 'SYNC_FAILED', 'OCC conflict', 'CONFLICT');

    // 3. FORBIDDEN failure
    const forbiddenItem = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });
    await outboxRepo.updateItemSyncStatus(forbiddenItem.id, 'SYNC_FAILED', 'Permission denied', 'FORBIDDEN');

    // 4. AUTH failure
    const authItem = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });
    await outboxRepo.updateItemSyncStatus(authItem.id, 'SYNC_FAILED', 'Session expired', 'AUTH');

    // None of these should be returned by getNextEligibleItem()!
    const eligible = await outboxRepo.getNextEligibleItem();
    expect(eligible).toBeNull();

    // But they remain durably in the outbox for inspection/diagnostics
    const pendingList = await outboxRepo.listPendingItems();
    expect(pendingList.length).toBe(4);
  });

  // =========================================================================
  // 5A-R01 / W5A-F12: Atomic submission rollback under actual SQLite failure
  // =========================================================================
  it('5A-R01 / W5A-F12: offline submission transaction rolls back draft + evidence metadata after internal write failure before commit', async () => {
    // 1. Persist sandbox file before transaction
    const evidenceInputs = [
      {
        taskId: 'task-test-01',
        stage: 'BEFORE' as const,
        sourceUri: 'file:///cache/test_before.jpg',
        fileName: 'before.jpg',
      },
    ];

    const persisted = await fileStore.persistEvidence(evidenceInputs[0]);
    expect(await fileStore.fileExists(persisted.sandboxFileUri)).toBe(true);

    // 2. Inject a clean SQLite trigger that fails specifically on outbox_items INSERT
    // This allows step 1 (local_drafts INSERT) and step 2 (local_evidence INSERT)
    // to execute their writes inside the transaction before SQLite aborts on step 3.
    await db.execAsync(
      `CREATE TRIGGER test_fail_outbox_insert
       BEFORE INSERT ON outbox_items
       BEGIN
         SELECT RAISE(ABORT, 'INJECTED_SQLITE_OUTBOX_INSERT_FAILURE');
       END;`,
    );

    try {
      // 3. Execute real SqliteOutboxRepository.enqueueTransactional against real BetterSqliteAdapter
      await expect(
        outboxRepo.enqueueTransactional({
          taskId: 'task-test-01',
          request: validSampleRequest,
          evidenceFiles: [persisted],
        }),
      ).rejects.toThrow(/INJECTED_SQLITE_OUTBOX_INSERT_FAILURE/);

      // 4. Verify full SQLite rollback after internal failure:
      // A. local_drafts: no new PENDING_SYNC state committed
      const draft = await taskRepo.getDraft('task-test-01');
      expect(draft?.submissionStatus).toBeUndefined();

      // B. local_evidence: no metadata row committed
      const evidence = await taskRepo.listEvidenceByTask('task-test-01');
      expect(evidence.length).toBe(0);

      // C. outbox_items: no row committed
      const outboxItems = await outboxRepo.listItems();
      expect(outboxItems.length).toBe(0);

      // D. sandbox file: still preserved in filesystem
      expect(await fileStore.fileExists(persisted.sandboxFileUri)).toBe(true);
    } finally {
      // Clean up trigger
      await db.execAsync('DROP TRIGGER IF EXISTS test_fail_outbox_insert;');
    }

    // 5. Successful retry with same evidence file
    const successItem = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
      evidenceFiles: [persisted],
    });

    expect(successItem).toBeDefined();
    expect(successItem.syncStatus).toBe('IDLE');

    const updatedDraft = await taskRepo.getDraft('task-test-01');
    expect(updatedDraft?.submissionStatus).toBe('PENDING_SYNC');

    const updatedEvidence = await taskRepo.listEvidenceByTask('task-test-01');
    expect(updatedEvidence.length).toBe(1);
    expect(updatedEvidence[0].id).toBe(persisted.id);

    const updatedOutbox = await outboxRepo.listItems();
    expect(updatedOutbox.length).toBe(1);
    expect(updatedOutbox[0].id).toBe(successItem.id);

    // Sandbox file remains intact
    expect(await fileStore.fileExists(persisted.sandboxFileUri)).toBe(true);

    // 6. Verify executeOfflineSubmission application service completes cleanly
    await taskRepo.cacheTasks([
      {
        id: 'task-test-02',
        title: 'Task 02',
        taskType: 'PRUNING',
        treeId: 'tree-02',
        treeName: 'Cây Me',
        treeAddress: 'Quận 1',
        assignedStaffId: 'staff-01',
        assignedStaffName: 'Nguyễn Văn A',
        deadline: '2026-09-25T17:00:00.000Z',
        status: 'IN_PROGRESS',
        version: 1,
        checklist: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    const subResult = await executeOfflineSubmission(fileStore, outboxRepo, {
      taskId: 'task-test-02',
      request: { ...validSampleRequest, taskId: 'task-test-02' },
      evidenceInputs,
    });
    expect(subResult.outboxItem.syncStatus).toBe('IDLE');
    expect(subResult.persistedEvidenceFiles.length).toBe(1);
  });

  // =========================================================================
  // 5A-R02: Collision-safe durable evidence identity & same-filename regression
  // =========================================================================
  it('5A-R02: same-filename capture preserves distinct identities, sandbox paths, and SHA-256 hashes without overwrite', async () => {
    // Capture Evidence A: task = task-test-01, original fileName = photo.jpg
    const evidenceA = await fileStore.persistEvidence({
      taskId: 'task-test-01',
      stage: 'BEFORE',
      sourceUri: 'file:///camera/dcim/1001.jpg',
      fileName: 'photo.jpg',
      content: new Uint8Array([1, 2, 3, 4, 5]),
    });

    // Capture Evidence B: task = task-test-01, original fileName = photo.jpg (identical camera filename hint)
    const evidenceB = await fileStore.persistEvidence({
      taskId: 'task-test-01',
      stage: 'BEFORE',
      sourceUri: 'file:///camera/dcim/1002.jpg',
      fileName: 'photo.jpg',
      content: new Uint8Array([6, 7, 8, 9, 10]),
    });

    // Invariants:
    // 1. Unique IDs
    expect(evidenceA.id).not.toBe(evidenceB.id);

    // 2. Distinct sandbox URIs incorporating evidence ID
    expect(evidenceA.sandboxFileUri).not.toBe(evidenceB.sandboxFileUri);
    expect(evidenceA.sandboxFileUri).toContain(evidenceA.id);
    expect(evidenceB.sandboxFileUri).toContain(evidenceB.id);

    // 3. Evidence A still exists after Evidence B is persisted (no overwrite)
    expect(await fileStore.fileExists(evidenceA.sandboxFileUri)).toBe(true);
    expect(await fileStore.fileExists(evidenceB.sandboxFileUri)).toBe(true);

    // 4. SHA-256 values remain independently tied to their own exact bytes
    expect(evidenceA.sha256).not.toBe(evidenceB.sha256);
    expect(isValidSha256(evidenceA.sha256)).toBe(true);
    expect(isValidSha256(evidenceB.sha256)).toBe(true);

    // 5. Display/original filename hint is preserved safely
    expect(evidenceA.fileName).toBe('photo.jpg');
    expect(evidenceB.fileName).toBe('photo.jpg');

    // 6. Filename safety / directory traversal prevention
    expect(sanitizeEvidenceFileName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeEvidenceFileName('..\\..\\secret.png')).toBe('secret.png');
    expect(sanitizeEvidenceFileName('..', 'fallback.jpg')).toBe('fallback.jpg');

    const traversedEvidence = await fileStore.persistEvidence({
      taskId: 'task-test-01',
      stage: 'AFTER',
      sourceUri: 'file:///camera/dcim/1003.jpg',
      fileName: '../../etc/passwd',
    });
    expect(traversedEvidence.sandboxFileUri).not.toContain('..');
    expect(traversedEvidence.fileName).toBe('passwd');

    const backslashEvidence = await fileStore.persistEvidence({
      taskId: 'task-test-01',
      stage: 'AFTER',
      sourceUri: 'file:///camera/dcim/1004.jpg',
      fileName: '..\\..\\secret.png',
    });
    expect(backslashEvidence.sandboxFileUri).not.toContain('..');
    expect(backslashEvidence.fileName).toBe('secret.png');
  });

  // =========================================================================
  // 5A-R03: Strict UUIDv4 idempotency key validation
  // =========================================================================
  it('5A-R03: validates idempotencyKey strictly against RFC 4122 UUIDv4', async () => {
    // 1. Generated key: valid UUIDv4
    const generatedItem = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });
    expect(isValidUuidV4(generatedItem.idempotencyKey)).toBe(true);

    // 2. Supplied valid UUIDv4: accepted unchanged
    const validUuidV4 = 'c24d4554-4a46-46b5-9f5b-6fcebc4d0f7a';
    expect(assertValidUuidV4(validUuidV4)).toBe(validUuidV4);
    expect(() => assertValidUuidV4('invalid-uuid')).toThrow(/RFC 4122 UUIDv4/);

    const suppliedItem = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
      idempotencyKey: validUuidV4,
    });
    expect(suppliedItem.idempotencyKey).toBe(validUuidV4);

    // 3. Supplied malformed string: rejected before DB mutation
    const countBefore = (await outboxRepo.listItems()).length;
    await expect(
      outboxRepo.enqueueTransactional({
        taskId: 'task-test-01',
        request: validSampleRequest,
        idempotencyKey: 'not-a-valid-uuid',
      }),
    ).rejects.toThrow(/RFC 4122 UUIDv4/);
    const countAfterMalformed = (await outboxRepo.listItems()).length;
    expect(countAfterMalformed).toBe(countBefore);

    // 4. Supplied UUIDv1: rejected
    const uuidV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    await expect(
      outboxRepo.enqueueTransactional({
        taskId: 'task-test-01',
        request: validSampleRequest,
        idempotencyKey: uuidV1,
      }),
    ).rejects.toThrow(/RFC 4122 UUIDv4/);

    // 5. Supplied UUIDv5: rejected
    const uuidV5 = '886313e1-3b8a-5372-9b90-0c9aee199e5d';
    await expect(
      outboxRepo.enqueueTransactional({
        taskId: 'task-test-01',
        request: validSampleRequest,
        idempotencyKey: uuidV5,
      }),
    ).rejects.toThrow(/RFC 4122 UUIDv4/);

    // 6. Retry of existing outbox row: same persisted UUIDv4
    await outboxRepo.updateItemSyncStatus(suppliedItem.id, 'SYNC_FAILED', 'Network timeout', 'NETWORK');
    const retryItem = await outboxRepo.getItemById(suppliedItem.id);
    expect(retryItem?.idempotencyKey).toBe(validUuidV4);

    // 7. Idempotency-Key remains absent from SubmitEvidenceRequest payload body
    const payload = JSON.parse(suppliedItem.payloadJson);
    expect(payload.idempotencyKey).toBeUndefined();
    expect(payload.idempotency_key).toBeUndefined();
    expect(payload['Idempotency-Key']).toBeUndefined();
  });

  // =========================================================================
  // W5A-F13: Cached task deletion cannot cascade-delete pending evidence/outbox
  // =========================================================================
  it('W5A-F13: cached task deletion cannot cascade-delete pending evidence/outbox (ON DELETE RESTRICT)', async () => {
    // Enqueue an outbox item and evidence referencing task-test-01
    const persisted = await fileStore.persistEvidence({
      taskId: 'task-test-01',
      stage: 'BEFORE',
      sourceUri: 'file:///cache/camera/temp.jpg',
      fileName: 'before.jpg',
    });
    await taskRepo.saveEvidenceMetadata(persisted);

    await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    // Attempt to delete cached task
    // Because of FOREIGN KEY ... ON DELETE RESTRICT and PRAGMA foreign_keys = ON, SQLite must throw
    await expect(db.runAsync('DELETE FROM cached_tasks WHERE id = ?;', ['task-test-01'])).rejects.toThrow(
      /FOREIGN KEY constraint failed/i,
    );

    // Verify outbox and evidence metadata are still intact
    const outboxList = await outboxRepo.listItems();
    expect(outboxList.length).toBe(1);

    const evidenceList = await taskRepo.listEvidenceByTask('task-test-01');
    expect(evidenceList.length).toBe(1);
  });

  // =========================================================================
  // W5A-F14: Static check that no Android-specific sandbox fallback exists
  // =========================================================================
  it('W5A-F14: source contains no hardcoded Android /data/user/0 sandbox fallback', () => {
    const fileStorePath = path.resolve(__dirname, '../../apps/mobile/src/storage/evidence/evidenceFileStore.ts');
    const fileStoreContent = fs.readFileSync(fileStorePath, 'utf8');

    expect(fileStoreContent).not.toContain('/data/user/0/');
    expect(fileStoreContent).not.toContain('com.novyx.greenops');

    // Also check all storage directory files
    const storageDir = path.resolve(__dirname, '../../apps/mobile/src/storage');
    const checkDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(content).not.toContain('/data/user/0/');
        }
      }
    };
    checkDir(storageDir);
  });

  // =========================================================================
  // W5A-F15: UUID generation uses CSPRNG and remains stable on retry
  // =========================================================================
  it('W5A-F15: UUID generation uses CSPRNG-compatible provider and remains stable on retry', async () => {
    const uuid1 = generateSecureUuid();
    const uuid2 = generateSecureUuid();

    expect(uuid1).not.toBe(uuid2);
    expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(uuid2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    // Verify source code has no Math.random() UUID generation
    const uuidSourcePath = path.resolve(__dirname, '../../apps/mobile/src/storage/utils/uuid.ts');
    const uuidSource = fs.readFileSync(uuidSourcePath, 'utf8');
    expect(uuidSource).not.toContain('Math.random');

    // Verify retry stability
    const item = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });
    const key = item.idempotencyKey;

    await outboxRepo.updateItemSyncStatus(item.id, 'SYNC_FAILED', 'Network error', 'NETWORK');
    const retry1 = await outboxRepo.getItemById(item.id);
    expect(retry1?.idempotencyKey).toBe(key);

    await outboxRepo.updateItemSyncStatus(item.id, 'SYNC_FAILED', 'Timeout error', 'NETWORK');
    const retry2 = await outboxRepo.getItemById(item.id);
    expect(retry2?.idempotencyKey).toBe(key);
  });
});
