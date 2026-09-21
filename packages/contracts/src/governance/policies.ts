import { z } from 'zod';
import { ProofProfileSchema } from '../operational/proof-profile';

/**
 * GV-18: PublishProofPolicyVersionRequest — Policy publication.
 */
export const PublishProofPolicyVersionRequestSchema = z.object({
  taskTypeId: z.string().min(1),
  proofProfile: ProofProfileSchema,
  policyDescription: z.string().optional(),
});

export type PublishProofPolicyVersionRequest = z.infer<typeof PublishProofPolicyVersionRequestSchema>;

/**
 * GV-19: PublishChecklistTemplateVersionRequest — Template publication.
 */
export const PublishChecklistTemplateVersionRequestSchema = z.object({
  taskTypeId: z.string().min(1),
  templateItems: z
    .array(
      z.object({
        text: z.string().min(1),
        order: z.number().int().nonnegative(),
      }),
    )
    .min(1),
  templateDescription: z.string().optional(),
});

export type PublishChecklistTemplateVersionRequest = z.infer<typeof PublishChecklistTemplateVersionRequestSchema>;
