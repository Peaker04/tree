import type { CanonicalTaskStatus, SubmitEvidenceRequest } from '@novyx/contracts';

export type { CanonicalTaskStatus };

export type LocalSubmissionStatus = 'IDLE' | 'SAVED_DRAFT' | 'PENDING_SYNC';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED';

export type ErrorClassification = 'NETWORK' | 'SERVER_5XX' | 'VALIDATION' | 'CONFLICT' | 'FORBIDDEN' | 'AUTH';

export interface OutboxItem {
  id: string;
  taskId: string;
  commandType: 'SubmitEvidence';
  payloadJson: string;
  idempotencyKey: string;
  attemptCount: number;
  syncStatus: SyncStatus;
  lastError: string | null;
  errorClassification: ErrorClassification | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnqueueSubmitEvidenceParams {
  taskId: string;
  request: SubmitEvidenceRequest;
  idempotencyKey?: string; // Auto-generated UUIDv4 if omitted
  notes?: string;
}

export interface OutboxDispatchResult {
  outboxId: string;
  idempotencyKey: string;
  success: boolean;
  httpStatus?: number;
  error?: string;
  classification?: ErrorClassification;
  serverTask?: unknown;
}
