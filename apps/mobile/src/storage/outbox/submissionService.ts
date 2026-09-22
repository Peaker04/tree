import type { SubmitEvidenceRequest } from '@novyx/contracts';
import type { IEvidenceFileStore, PersistedEvidenceFile, SaveEvidenceInput } from '../evidence/evidenceFileStore';
import type { IDurableOutboxRepository } from './outboxRepository';
import type { OutboxItem } from './types';

export interface SubmitOfflineEvidenceParams {
  taskId: string;
  request: SubmitEvidenceRequest;
  evidenceInputs: SaveEvidenceInput[];
  idempotencyKey?: string;
  notes?: string;
}

export interface SubmitOfflineEvidenceResult {
  outboxItem: OutboxItem;
  persistedEvidenceFiles: PersistedEvidenceFile[];
}

/**
 * Orchestrates offline SubmitEvidence intent:
 * 1. Copies/moves binary files to sandbox storage and computes exact-byte SHA-256.
 * 2. In ONE atomic SQLite transaction:
 *    - persists local evidence metadata rows
 *    - updates local draft status to PENDING_SYNC
 *    - creates outbox record with stable Idempotency-Key
 *
 * If the SQLite transaction fails, the sandbox binary files remain preserved as orphans
 * and are NEVER deleted.
 */
export async function executeOfflineSubmission(
  fileStore: IEvidenceFileStore,
  outboxRepo: IDurableOutboxRepository,
  params: SubmitOfflineEvidenceParams,
): Promise<SubmitOfflineEvidenceResult> {
  // Phase 1: Persist binary evidence files to sandbox and compute exact-byte SHA-256
  const persistedFiles: PersistedEvidenceFile[] = [];
  for (const input of params.evidenceInputs) {
    const file = await fileStore.persistEvidence(input);
    persistedFiles.push(file);
  }

  // Phase 2: In ONE atomic SQLite transaction, persist metadata, draft state, and outbox intent
  const outboxItem = await outboxRepo.enqueueTransactional({
    taskId: params.taskId,
    request: params.request,
    evidenceFiles: persistedFiles,
    idempotencyKey: params.idempotencyKey,
    notes: params.notes,
  });

  return {
    outboxItem,
    persistedEvidenceFiles: persistedFiles,
  };
}
