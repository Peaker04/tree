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

/**
 * Proof Policy Version DTO
 */
export const ProofPolicyVersionDtoSchema = z.object({
  id: z.string().min(1),
  taskTypeId: z.string().min(1),
  versionNumber: z.number().int().positive(),
  proofProfile: ProofProfileSchema,
  policyDescription: z.string().optional(),
  publishedAt: z.string(),
});
export type ProofPolicyVersionDto = z.infer<typeof ProofPolicyVersionDtoSchema>;

export const ProofPolicyVersionResponseSchema = z.object({
  data: ProofPolicyVersionDtoSchema,
});
export type ProofPolicyVersionResponse = z.infer<typeof ProofPolicyVersionResponseSchema>;

/**
 * Checklist Template Version DTO
 */
export const ChecklistTemplateItemSchema = z.object({
  text: z.string().min(1),
  order: z.number().int().nonnegative(),
});
export type ChecklistTemplateItem = z.infer<typeof ChecklistTemplateItemSchema>;

export const ChecklistTemplateVersionDtoSchema = z.object({
  id: z.string().min(1),
  taskTypeId: z.string().min(1),
  versionNumber: z.number().int().positive(),
  templateItems: z.array(ChecklistTemplateItemSchema).min(1),
  templateDescription: z.string().optional(),
  publishedAt: z.string(),
});
export type ChecklistTemplateVersionDto = z.infer<typeof ChecklistTemplateVersionDtoSchema>;

export const ChecklistTemplateVersionResponseSchema = z.object({
  data: ChecklistTemplateVersionDtoSchema,
});
export type ChecklistTemplateVersionResponse = z.infer<typeof ChecklistTemplateVersionResponseSchema>;
