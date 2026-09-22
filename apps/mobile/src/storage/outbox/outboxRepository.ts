import type { IDatabaseConnection } from '../database/types';
import type { EnqueueSubmitEvidenceParams, ErrorClassification, OutboxItem, SyncStatus } from './types';
import { assertNoIdempotencyKeyInBody } from './stateSeparation';

export interface IDurableOutboxRepository {
  enqueueTransactional(params: EnqueueSubmitEvidenceParams): Promise<OutboxItem>;
  getNextEligibleItem(): Promise<OutboxItem | null>;
  getItemById(id: string): Promise<OutboxItem | null>;
  updateItemSyncStatus(
    id: string,
    syncStatus: SyncStatus,
    lastError?: string | null,
    errorClassification?: ErrorClassification | null,
  ): Promise<void>;
  markCompleted(id: string): Promise<void>;
  listItems(): Promise<OutboxItem[]>;
  listPendingItems(): Promise<OutboxItem[]>;
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class SqliteOutboxRepository implements IDurableOutboxRepository {
  private db: IDatabaseConnection;

  constructor(db: IDatabaseConnection) {
    this.db = db;
  }

  async enqueueTransactional(params: EnqueueSubmitEvidenceParams): Promise<OutboxItem> {
    // P13W5A-N04: Ensure Idempotency-Key is NEVER in payload body
    assertNoIdempotencyKeyInBody(params.request);

    const outboxId = generateUuid();
    // P13W5A-P06: Stable UUIDv4 idempotency key generated once
    const idempotencyKey = params.idempotencyKey ?? generateUuid();
    const now = new Date().toISOString();
    const payloadJson = JSON.stringify(params.request);

    // Section 13: Transactional Enqueue
    return await this.db.withTransactionAsync(async () => {
      // 1. Update local draft submission status to PENDING_SYNC
      // Note: Authoritative cached_tasks.status remains unchanged (IN_PROGRESS)
      await this.db.runAsync(
        `INSERT INTO local_drafts (
          task_id,
          submission_status,
          notes,
          created_at,
          updated_at
        ) VALUES (?, 'PENDING_SYNC', ?, ?, ?)
        ON CONFLICT(task_id) DO UPDATE SET
          submission_status = 'PENDING_SYNC',
          notes = COALESCE(excluded.notes, local_drafts.notes),
          updated_at = excluded.updated_at;`,
        [params.taskId, params.notes ?? null, now, now],
      );

      // 2. Insert outbox row
      await this.db.runAsync(
        `INSERT INTO outbox_items (
          id,
          task_id,
          command_type,
          payload_json,
          idempotency_key,
          attempt_count,
          sync_status,
          last_error,
          error_classification,
          created_at,
          updated_at
        ) VALUES (?, ?, 'SubmitEvidence', ?, ?, 0, 'IDLE', NULL, NULL, ?, ?);`,
        [outboxId, params.taskId, payloadJson, idempotencyKey, now, now],
      );

      return {
        id: outboxId,
        taskId: params.taskId,
        commandType: 'SubmitEvidence',
        payloadJson,
        idempotencyKey,
        attemptCount: 0,
        syncStatus: 'IDLE',
        lastError: null,
        errorClassification: null,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  async getNextEligibleItem(): Promise<OutboxItem | null> {
    // Section 14: FIFO Ordering (created_at ASC)
    const row = await this.db.getFirstAsync<{
      id: string;
      task_id: string;
      command_type: 'SubmitEvidence';
      payload_json: string;
      idempotency_key: string;
      attempt_count: number;
      sync_status: SyncStatus;
      last_error: string | null;
      error_classification: ErrorClassification | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM outbox_items
       WHERE sync_status IN ('IDLE', 'SYNC_FAILED')
       ORDER BY created_at ASC
       LIMIT 1;`,
    );

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      taskId: row.task_id,
      commandType: row.command_type,
      payloadJson: row.payload_json,
      idempotencyKey: row.idempotency_key,
      attemptCount: row.attempt_count,
      syncStatus: row.sync_status,
      lastError: row.last_error,
      errorClassification: row.error_classification,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getItemById(id: string): Promise<OutboxItem | null> {
    const row = await this.db.getFirstAsync<{
      id: string;
      task_id: string;
      command_type: 'SubmitEvidence';
      payload_json: string;
      idempotency_key: string;
      attempt_count: number;
      sync_status: SyncStatus;
      last_error: string | null;
      error_classification: ErrorClassification | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM outbox_items WHERE id = ?;', [id]);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      taskId: row.task_id,
      commandType: row.command_type,
      payloadJson: row.payload_json,
      idempotencyKey: row.idempotency_key,
      attemptCount: row.attempt_count,
      syncStatus: row.sync_status,
      lastError: row.last_error,
      errorClassification: row.error_classification,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateItemSyncStatus(
    id: string,
    syncStatus: SyncStatus,
    lastError?: string | null,
    errorClassification?: ErrorClassification | null,
  ): Promise<void> {
    const now = new Date().toISOString();
    const isFailure = syncStatus === 'SYNC_FAILED';
    const attemptIncrement = isFailure ? 1 : 0;

    await this.db.runAsync(
      `UPDATE outbox_items SET
        sync_status = ?,
        attempt_count = attempt_count + ?,
        last_error = ?,
        error_classification = ?,
        updated_at = ?
       WHERE id = ?;`,
      [syncStatus, attemptIncrement, lastError ?? null, errorClassification ?? null, now, id],
    );
  }

  async markCompleted(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      `UPDATE outbox_items SET
        sync_status = 'SYNCED',
        updated_at = ?
       WHERE id = ?;`,
      [now, id],
    );
  }

  async listItems(): Promise<OutboxItem[]> {
    const rows = await this.db.getAllAsync<{
      id: string;
      task_id: string;
      command_type: 'SubmitEvidence';
      payload_json: string;
      idempotency_key: string;
      attempt_count: number;
      sync_status: SyncStatus;
      last_error: string | null;
      error_classification: ErrorClassification | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM outbox_items ORDER BY created_at ASC;');

    return rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      commandType: row.command_type,
      payloadJson: row.payload_json,
      idempotencyKey: row.idempotency_key,
      attemptCount: row.attempt_count,
      syncStatus: row.sync_status,
      lastError: row.last_error,
      errorClassification: row.error_classification,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async listPendingItems(): Promise<OutboxItem[]> {
    const rows = await this.db.getAllAsync<{
      id: string;
      task_id: string;
      command_type: 'SubmitEvidence';
      payload_json: string;
      idempotency_key: string;
      attempt_count: number;
      sync_status: SyncStatus;
      last_error: string | null;
      error_classification: ErrorClassification | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM outbox_items
       WHERE sync_status IN ('IDLE', 'SYNCING', 'SYNC_FAILED')
       ORDER BY created_at ASC;`,
    );

    return rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      commandType: row.command_type,
      payloadJson: row.payload_json,
      idempotencyKey: row.idempotency_key,
      attemptCount: row.attempt_count,
      syncStatus: row.sync_status,
      lastError: row.last_error,
      errorClassification: row.error_classification,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}
