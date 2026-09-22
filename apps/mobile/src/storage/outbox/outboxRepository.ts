import type { IDatabaseConnection } from '../database/types';
import type { EnqueueSubmitEvidenceParams, ErrorClassification, OutboxItem, SyncStatus } from './types';
import { assertNoIdempotencyKeyInBody } from './stateSeparation';
import { generateSecureUuid, assertValidUuidV4 } from '../utils/uuid';

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
  updatePayload(id: string, payloadJson: string): Promise<void>;
  markCompleted(id: string): Promise<void>;
  listItems(): Promise<OutboxItem[]>;
  listPendingItems(): Promise<OutboxItem[]>;
  recoverInterruptedSyncs(): Promise<number>;
}

export class SqliteOutboxRepository implements IDurableOutboxRepository {
  private db: IDatabaseConnection;

  constructor(db: IDatabaseConnection) {
    this.db = db;
  }

  async enqueueTransactional(params: EnqueueSubmitEvidenceParams): Promise<OutboxItem> {
    // P13W5A-N04: Ensure Idempotency-Key is NEVER in payload body
    assertNoIdempotencyKeyInBody(params.request);

    // 5A-R03: Validate caller-supplied idempotencyKey as strict RFC 4122 UUIDv4
    if (params.idempotencyKey !== undefined) {
      assertValidUuidV4(params.idempotencyKey, 'idempotencyKey');
    }

    const outboxId = generateSecureUuid();
    // P13W5A-P06: Stable UUIDv4 idempotency key generated once
    const idempotencyKey = params.idempotencyKey ?? generateSecureUuid();
    const now = new Date().toISOString();
    const payloadJson = JSON.stringify(params.request);

    // Section 13 & Correction D: One SQLite transaction covers:
    // 1. Local draft transition (LocalSubmissionStatus = PENDING_SYNC)
    // 2. Local evidence metadata rows
    // 3. Outbox intent row
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

      // 2. Atomically persist local evidence metadata rows if provided
      if (params.evidenceFiles && params.evidenceFiles.length > 0) {
        for (const ev of params.evidenceFiles) {
          await this.db.runAsync(
            `INSERT INTO local_evidence (
              id,
              task_id,
              stage,
              local_file_uri,
              file_name,
              content_type,
              size_bytes,
              sha256,
              captured_at,
              is_persisted_in_sandbox,
              sync_status,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'IDLE', ?)
            ON CONFLICT(id) DO UPDATE SET
              local_file_uri = excluded.local_file_uri,
              size_bytes = excluded.size_bytes,
              sha256 = excluded.sha256,
              is_persisted_in_sandbox = excluded.is_persisted_in_sandbox;`,
            [
              ev.id,
              params.taskId,
              ev.stage,
              ev.sandboxFileUri,
              ev.fileName,
              ev.contentType,
              ev.sizeBytes,
              ev.sha256,
              ev.capturedAt,
              now,
            ],
          );
        }
      }

      // 3. Insert outbox row
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
    // Section 14 & Correction C:
    // Only pick items that are IDLE, or retryable failures (NETWORK, SERVER_5XX).
    // Non-retryable failures (VALIDATION, CONFLICT, FORBIDDEN, AUTH) or null classifications
    // are NEVER auto-picked.
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
       WHERE sync_status = 'IDLE'
          OR (sync_status = 'SYNC_FAILED' AND error_classification IN ('NETWORK', 'SERVER_5XX'))
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

  async updatePayload(id: string, payloadJson: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      `UPDATE outbox_items SET
        payload_json = ?,
        updated_at = ?
       WHERE id = ?;`,
      [payloadJson, now, id],
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

  /**
   * Correction B: Interrupted Sync Recovery.
   * On application restart, any item that was mid-flight ('SYNCING') when the process died
   * is atomically reset to 'SYNC_FAILED' with error_classification = 'NETWORK'
   * and last_error = 'INTERRUPTED_SYNC_RECOVERY'.
   * Preserves outbox ID, Idempotency-Key, and payload.
   */
  async recoverInterruptedSyncs(): Promise<number> {
    const now = new Date().toISOString();
    const result = await this.db.runAsync(
      `UPDATE outbox_items SET
        sync_status = 'SYNC_FAILED',
        error_classification = 'NETWORK',
        last_error = 'INTERRUPTED_SYNC_RECOVERY',
        updated_at = ?
       WHERE sync_status = 'SYNCING';`,
      [now],
    );
    return result.rowsAffected;
  }
}
