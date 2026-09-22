import { describe, it, expect, beforeEach } from 'vitest';
import {
  CANONICAL_TASK_STATUSES,
  TaskStatusSchema,
  SubmitEvidenceRequestSchema,
  type SubmitEvidenceRequest,
} from '@novyx/contracts';
import { createInMemoryTestDatabase } from '../../apps/mobile/src/storage/database/sqliteDatabase';
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
import {
  InMemoryEvidenceFileStore,
  canSafelyDeleteEvidence,
} from '../../apps/mobile/src/storage/evidence/evidenceFileStore';
import { isValidSha256, NodeEvidenceHasher } from '../../apps/mobile/src/storage/evidence/evidenceHasher';

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
    // 1. Contracts enum verification
    expect(CANONICAL_TASK_STATUSES).not.toContain('PENDING_SYNC');

    // 2. Zod runtime schema check fails for PENDING_SYNC
    const parseResult = TaskStatusSchema.safeParse('PENDING_SYNC');
    expect(parseResult.success).toBe(false);

    // 3. Validation helper marks it as violation
    const validation = validateStatusDimensions({
      taskStatus: 'PENDING_SYNC',
      localSubmissionStatus: 'IDLE',
      syncStatus: 'IDLE',
    });
    expect(validation.valid).toBe(false);
    expect(validation.violations.some((v) => v.includes('P13W5A-N02'))).toBe(true);

    // 4. isCanonicalTaskStatus rejects it
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
    // UUIDv4 format check
    expect(item.idempotencyKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    // Verify persisted in DB
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

    // Simulate failure transition
    await outboxRepo.updateItemSyncStatus(item.id, 'SYNC_FAILED', 'Network timeout', 'NETWORK');

    const retriedItem = await outboxRepo.getItemById(item.id);
    expect(retriedItem?.attemptCount).toBe(1);
    expect(retriedItem?.idempotencyKey).toBe(originalKey);

    // Simulate second retry
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
    // 1. Zod schema validation
    const parsed = SubmitEvidenceRequestSchema.safeParse(validSampleRequest);
    expect(parsed.success).toBe(true);
    expect(Object.keys(validSampleRequest)).not.toContain('idempotencyKey');
    expect(Object.keys(validSampleRequest)).not.toContain('Idempotency-Key');

    // 2. assertNoIdempotencyKeyInBody throws if idempotencyKey is in body
    const poisonedPayload = {
      ...validSampleRequest,
      idempotencyKey: 'some-key',
    };
    expect(() => assertNoIdempotencyKeyInBody(poisonedPayload)).toThrow(
      'P13W5A-N04 Violation: Idempotency-Key must NOT be inside SubmitEvidenceRequest body',
    );

    // 3. outboxRepo rejects enqueue if poisoned payload is provided
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
    // Enqueue item 1 with slightly earlier timestamp
    const item1 = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    // Small delay to ensure timestamp difference
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

    // Oldest item should be picked first
    const firstPicked = await outboxRepo.getNextEligibleItem();
    expect(firstPicked?.id).toBe(item1.id);

    // Mark item 1 SYNCED
    await outboxRepo.markCompleted(item1.id);

    // Second oldest should be picked next
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

    // Mock dispatcher that simulates a retryable 503 failure
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

    // Verify item is still in DB and marked SYNC_FAILED
    const durableItem = await outboxRepo.getItemById(item.id);
    expect(durableItem).toBeDefined();
    expect(durableItem?.syncStatus).toBe('SYNC_FAILED');
    expect(durableItem?.lastError).toBe('Service Unavailable');
    expect(durableItem?.errorClassification).toBe('SERVER_5XX');
    expect(durableItem?.attemptCount).toBe(1);

    // Verify it is still eligible for next pickup
    const nextEligible = await outboxRepo.getNextEligibleItem();
    expect(nextEligible?.id).toBe(item.id);
  });

  it('Section 15: Error classification accurately identifies retryable vs non-retryable errors', () => {
    // Retryable transport errors
    expect(classifyError(new TypeError('Failed to fetch'))).toBe('NETWORK');
    expect(classifyError(new Error('Network request failed: timeout'))).toBe('NETWORK');
    expect(classifyError({ status: 500, error: 'Internal Server Error' })).toBe('SERVER_5XX');
    expect(classifyError({ status: 503, error: 'Service Unavailable' })).toBe('SERVER_5XX');
    expect(isRetryableError('NETWORK')).toBe(true);
    expect(isRetryableError('SERVER_5XX')).toBe(true);

    // Non-retryable client / business errors
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
    // 1. Save local evidence
    const persisted = await fileStore.persistEvidence({
      taskId: 'task-test-01',
      stage: 'BEFORE',
      sourceUri: 'file:///cache/camera/temp_before.jpg',
      fileName: 'before.jpg',
    });
    await taskRepo.saveEvidenceMetadata(persisted);

    // 2. Enqueue submission
    await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    // 3. Simulate HTTP 409 CONFLICT from server
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

    // 4. Verify local evidence metadata in SQLite is intact
    const evidenceList = await taskRepo.listEvidenceByTask('task-test-01');
    expect(evidenceList.length).toBe(1);
    expect(evidenceList[0].sha256).toBe(persisted.sha256);
    expect(evidenceList[0].sandboxFileUri).toBe(persisted.sandboxFileUri);

    // 5. Verify local file in sandbox is NOT deleted
    const fileExists = await fileStore.fileExists(persisted.sandboxFileUri);
    expect(fileExists).toBe(true);

    // 6. Verify retention invariant prevents deletion
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
    // Before enqueue: TaskStatus is IN_PROGRESS
    const initialTask = await taskRepo.getCachedTask('task-test-01');
    expect(initialTask?.status).toBe('IN_PROGRESS');

    // Enqueue offline submission
    await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    // After enqueue: Local submission status is PENDING_SYNC
    const draft = await taskRepo.getDraft('task-test-01');
    expect(draft?.submissionStatus).toBe('PENDING_SYNC');

    // Server TaskStatus MUST REMAIN strictly IN_PROGRESS!
    const taskAfterEnqueue = await taskRepo.getCachedTask('task-test-01');
    expect(taskAfterEnqueue?.status).toBe('IN_PROGRESS');
    expect(taskAfterEnqueue?.status).not.toBe('WAITING_REVIEW');
  });

  // =========================================================================
  // Assertion K: Migration runner is deterministic and version-aware
  // =========================================================================
  it('Requirement K: Migration runner is deterministic and version-aware (PRAGMA user_version) (P13W5A-P02)', async () => {
    // Current in-memory DB has version 1
    const v1 = await getCurrentSchemaVersion(db);
    expect(v1).toBe(LATEST_SCHEMA_VERSION);

    // Re-running migrations is idempotent
    const rerun = await runMigrations(db);
    expect(rerun.appliedCount).toBe(0);
    expect(rerun.currentVersion).toBe(1);

    // Verify migration tracking table has record
    const migrationsRows = await db.getAllAsync<{ version: number; name: string }>(
      'SELECT version, name FROM schema_migrations;',
    );
    expect(migrationsRows.length).toBe(1);
    expect(migrationsRows[0].version).toBe(1);
    expect(migrationsRows[0].name).toBe('initial_offline_schema');
  });

  // =========================================================================
  // Assertion L: Auth credentials are NOT persisted in SQLite/outbox schema
  // =========================================================================
  it('Requirement L: Auth credentials are NOT persisted in SQLite/outbox schema (P13W5A-N08, P13W5A-P10)', async () => {
    // 1. Inspect table columns in cached_tasks, local_drafts, local_evidence, outbox_items
    const outboxCols = await db.getAllAsync<{ name: string }>("PRAGMA table_info('outbox_items');");
    const colNames = outboxCols.map((c) => c.name.toLowerCase());
    expect(colNames).not.toContain('accesstoken');
    expect(colNames).not.toContain('token');
    expect(colNames).not.toContain('password');
    expect(colNames).not.toContain('refreshtoken');

    // 2. Enqueue and inspect stored payload JSON
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
    // Verify evidence record stores only file URI, NOT image bytes or Base64 data
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
    // Must be URI
    expect(rows[0].local_file_uri).toMatch(/^file:\/\//);
    expect(rows[0].local_file_uri).not.toMatch(/^data:image/);
    // Must be 64-char lowercase hex SHA-256
    expect(isValidSha256(rows[0].sha256)).toBe(true);

    // Inspect table info for local_evidence - no BLOB columns
    const evidenceCols = await db.getAllAsync<{ name: string; type: string }>("PRAGMA table_info('local_evidence');");
    for (const col of evidenceCols) {
      expect(col.type.toUpperCase()).not.toBe('BLOB');
    }
  });

  // =========================================================================
  // Recovery after process kill simulation
  // =========================================================================
  it('Simulates process restart: draft state, outbox, and evidence metadata survive', async () => {
    // 1. Save draft with GPS and QR
    await taskRepo.saveDraft({
      taskId: 'task-test-01',
      submissionStatus: 'SAVED_DRAFT',
      gpsLat: 10.7769,
      gpsLng: 106.7009,
      gpsDistanceMeters: 3.2,
      gpsVerified: true,
      qrScannedCode: 'QR-TREE-001',
      qrVerified: true,
      notes: 'Khảo sát hiện trường trước khi cắt tỉa',
    });

    // 2. Persist evidence photo
    const evidence = await fileStore.persistEvidence({
      taskId: 'task-test-01',
      stage: 'BEFORE',
      sourceUri: 'file:///cache/camera/temp.jpg',
      fileName: 'before.jpg',
    });
    await taskRepo.saveEvidenceMetadata(evidence);

    // 3. Enqueue outbox item
    const outboxItem = await outboxRepo.enqueueTransactional({
      taskId: 'task-test-01',
      request: validSampleRequest,
    });

    // 4. Simulate app process kill & relaunch: query through new repository instance
    const newRepo = new SqliteMobileTaskRepository(db);
    const newOutbox = new SqliteOutboxRepository(db);

    const recovered = await newRepo.recoverTaskSession('task-test-01');
    expect(recovered.task).toBeDefined();
    expect(recovered.draft?.submissionStatus).toBe('PENDING_SYNC');
    expect(recovered.draft?.gpsVerified).toBe(true);
    expect(recovered.draft?.qrVerified).toBe(true);
    expect(recovered.evidence.length).toBe(1);
    expect(recovered.evidence[0].sha256).toBe(evidence.sha256);

    const pending = await newOutbox.getNextEligibleItem();
    expect(pending?.id).toBe(outboxItem.id);
    expect(pending?.idempotencyKey).toBe(outboxItem.idempotencyKey);
  });
});
