import { z } from 'zod';
import { SiteVerificationSchema } from './verification';
import { LocationExceptionSchema, IdentityExceptionSchema } from './exceptions';

export const ChecklistItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  done: z.boolean(),
});

export type ChecklistItemDto = z.infer<typeof ChecklistItemSchema>;

export const StructuredFindingsSchema = z.object({
  trunkLeanAngle: z.number(),
  cavityRotPercentage: z.number().min(0).max(100),
  pestSeverity: z.enum(['none', 'mild', 'moderate', 'severe']),
  deadwoodRisk: z.enum(['low', 'medium', 'high']),
  notes: z.string().optional(),
});

export type StructuredFindingsDto = z.infer<typeof StructuredFindingsSchema>;

export const ChangeProofPayloadSchema = z.object({
  proofProfile: z.literal('CHANGE_PROOF'),
  beforePhotoUri: z.string().min(1),
  afterPhotoUri: z.string().min(1),
  checklist: z.array(ChecklistItemSchema).min(1),
});

export type ChangeProofPayload = z.infer<typeof ChangeProofPayloadSchema>;

export const ServiceProofPayloadSchema = z.object({
  proofProfile: z.literal('SERVICE_PROOF'),
  completionPhotoUri: z.string().min(1),
  checklist: z.array(ChecklistItemSchema).min(1),
});

export type ServiceProofPayload = z.infer<typeof ServiceProofPayloadSchema>;

export const InspectionProofPayloadSchema = z.object({
  proofProfile: z.literal('INSPECTION_PROOF'),
  findings: StructuredFindingsSchema,
  conditionPhotos: z.array(z.string().min(1)).min(1),
});

export type InspectionProofPayload = z.infer<typeof InspectionProofPayloadSchema>;

export const ProofPayloadSchema = z.discriminatedUnion('proofProfile', [
  ChangeProofPayloadSchema,
  ServiceProofPayloadSchema,
  InspectionProofPayloadSchema,
]);

export type ProofPayload = z.infer<typeof ProofPayloadSchema>;

export const SubmitEvidenceRequestSchema = z.object({
  taskId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  siteVerification: SiteVerificationSchema.optional(),
  locationException: LocationExceptionSchema.optional(),
  identityException: IdentityExceptionSchema.optional(),
  proof: ProofPayloadSchema,
  notes: z.string().optional(),
});

export type SubmitEvidenceRequest = z.infer<typeof SubmitEvidenceRequestSchema>;
