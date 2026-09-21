/**
 * Wave 0 Test-Only Canonical Fixtures
 *
 * NOTE: These fixtures are TEST-ONLY mirrors of the frozen business baseline
 * established across Phase 1-12 reconciliation, ADR 0008, ADR 0010, ADR 0013, and ARCHITECTURE.md.
 *
 * CRITICAL BOUNDARY RULE:
 * They MUST NOT be imported into production application code (apps/** or packages/**)
 * and they DO NOT replace or modify @novyx/contracts production contracts.
 */

export const CANONICAL_TASK_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'BLOCKED',
  'WAITING_REVIEW',
  'REWORK_REQUIRED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type CanonicalTaskStatus = (typeof CANONICAL_TASK_STATUSES)[number];

export const CANONICAL_REVIEW_DECISIONS = ['APPROVE', 'APPROVE_WITH_EXCEPTION', 'REQUEST_REWORK', 'CANCEL'] as const;

export type CanonicalReviewDecision = (typeof CANONICAL_REVIEW_DECISIONS)[number];

export const CANONICAL_PROOF_PROFILES = ['CHANGE_PROOF', 'SERVICE_PROOF', 'INSPECTION_PROOF'] as const;

export type CanonicalProofProfile = (typeof CANONICAL_PROOF_PROFILES)[number];
