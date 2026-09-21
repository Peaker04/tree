import { z } from 'zod';
import { SiteVerificationSchema } from './verification';
import { LocationExceptionSchema, IdentityExceptionSchema } from './exceptions';

export const ChecklistItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  done: z.boolean(),
});

export type ChecklistItemDto = z.infer<typeof ChecklistItemSchema>;

/**
 * Submission-specific checklist item requiring 100% completion (done === true).
 */
export const SubmittedChecklistItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  done: z.literal(true, {
    errorMap: () => ({ message: 'All submitted checklist items must be completed (done: true)' }),
  }),
});

export type SubmittedChecklistItemDto = z.infer<typeof SubmittedChecklistItemSchema>;

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
  checklist: z.array(SubmittedChecklistItemSchema).min(1),
});

export type ChangeProofPayload = z.infer<typeof ChangeProofPayloadSchema>;

export const ServiceProofPayloadSchema = z.object({
  proofProfile: z.literal('SERVICE_PROOF'),
  completionPhotoUri: z.string().min(1),
  checklist: z.array(SubmittedChecklistItemSchema).min(1),
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

export const SubmitEvidenceRequestSchema = z
  .object({
    taskId: z.string().min(1),
    expectedVersion: z.number().int().nonnegative(),
    siteVerification: SiteVerificationSchema.optional(),
    locationException: LocationExceptionSchema.optional(),
    identityException: IdentityExceptionSchema.optional(),
    proof: ProofPayloadSchema,
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const gpsVerified = data.siteVerification?.gpsCheck?.verified === true;
    const hasLocationException = Boolean(data.locationException);

    if (gpsVerified && hasLocationException) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Payload ambiguous: cannot provide both verified GPS and LocationException',
        path: ['locationException'],
      });
    } else if (!gpsVerified && !hasLocationException) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Location verification required: must provide verified GPS (<= 10m) or a valid LocationException',
        path: ['siteVerification', 'gpsCheck'],
      });
    }

    const qrVerified = data.siteVerification?.qrCheck?.verified === true;
    const hasIdentityException = Boolean(data.identityException);

    if (qrVerified && hasIdentityException) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Payload ambiguous: cannot provide both verified QR and IdentityException',
        path: ['identityException'],
      });
    } else if (!qrVerified && !hasIdentityException) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Identity verification required: must provide verified QR code or a valid IdentityException',
        path: ['siteVerification', 'qrCheck'],
      });
    }
  });

export type SubmitEvidenceRequest = z.infer<typeof SubmitEvidenceRequestSchema>;
