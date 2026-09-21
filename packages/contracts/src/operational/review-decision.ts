import { z } from 'zod';

export const CANONICAL_REVIEW_DECISIONS = ['APPROVE', 'APPROVE_WITH_EXCEPTION', 'REQUEST_REWORK', 'CANCEL'] as const;

export const ReviewDecisionSchema = z.enum(CANONICAL_REVIEW_DECISIONS);
export type CanonicalReviewDecision = z.infer<typeof ReviewDecisionSchema>;
