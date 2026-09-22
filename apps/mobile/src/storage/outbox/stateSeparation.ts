import { CANONICAL_TASK_STATUSES, type CanonicalTaskStatus } from '@novyx/contracts';
import type { LocalSubmissionStatus, SyncStatus } from './types';

export const LOCAL_SUBMISSION_STATUSES: readonly LocalSubmissionStatus[] = [
  'IDLE',
  'SAVED_DRAFT',
  'PENDING_SYNC',
] as const;

export const SYNC_STATUSES: readonly SyncStatus[] = ['IDLE', 'SYNCING', 'SYNCED', 'SYNC_FAILED'] as const;

/**
 * Asserts that a value is a valid server CanonicalTaskStatus.
 * Rejects any client-local or transport status (e.g. PENDING_SYNC, SYNCING, SYNC_FAILED).
 */
export function isCanonicalTaskStatus(value: unknown): value is CanonicalTaskStatus {
  return typeof value === 'string' && (CANONICAL_TASK_STATUSES as readonly string[]).includes(value);
}

/**
 * Asserts that a value is a valid LocalSubmissionStatus.
 */
export function isLocalSubmissionStatus(value: unknown): value is LocalSubmissionStatus {
  return typeof value === 'string' && (LOCAL_SUBMISSION_STATUSES as readonly string[]).includes(value);
}

/**
 * Asserts that a value is a valid SyncStatus.
 */
export function isSyncStatus(value: unknown): value is SyncStatus {
  return typeof value === 'string' && (SYNC_STATUSES as readonly string[]).includes(value);
}

/**
 * Verifies that the given status string does NOT violate the strict
 * three-dimension separation invariant.
 */
export function validateStatusDimensions(params: {
  taskStatus: string;
  localSubmissionStatus: string;
  syncStatus: string;
}): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  // P13W5A-N02: TaskStatus must never contain PENDING_SYNC
  if (params.taskStatus === 'PENDING_SYNC') {
    violations.push('P13W5A-N02 Violation: TaskStatus cannot be PENDING_SYNC');
  }

  // P13W5A-N03: TaskStatus must never contain SYNCING or SYNC_FAILED
  if (params.taskStatus === 'SYNCING' || params.taskStatus === 'SYNC_FAILED') {
    violations.push(`P13W5A-N03 Violation: TaskStatus cannot be ${params.taskStatus}`);
  }

  if (!isCanonicalTaskStatus(params.taskStatus)) {
    violations.push(`TaskStatus "${params.taskStatus}" is not a canonical server status`);
  }

  if (!isLocalSubmissionStatus(params.localSubmissionStatus)) {
    violations.push(`LocalSubmissionStatus "${params.localSubmissionStatus}" is invalid`);
  }

  if (!isSyncStatus(params.syncStatus)) {
    violations.push(`SyncStatus "${params.syncStatus}" is invalid`);
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Verifies that an idempotency key is NOT present inside the payload body.
 */
export function assertNoIdempotencyKeyInBody(payload: unknown): void {
  if (payload && typeof payload === 'object') {
    if ('idempotencyKey' in payload || 'Idempotency-Key' in payload || 'idempotency_key' in payload) {
      throw new Error('P13W5A-N04 Violation: Idempotency-Key must NOT be inside SubmitEvidenceRequest body');
    }
  }
}
