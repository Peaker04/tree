import { z } from 'zod';

export const CANONICAL_PROOF_PROFILES = ['CHANGE_PROOF', 'SERVICE_PROOF', 'INSPECTION_PROOF'] as const;

export const ProofProfileSchema = z.enum(CANONICAL_PROOF_PROFILES);
export type ProofProfile = z.infer<typeof ProofProfileSchema>;
