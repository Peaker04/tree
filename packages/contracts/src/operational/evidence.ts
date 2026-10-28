import { z } from 'zod';
import { GpsCheckSchema, SiteVerificationSchema } from './verification';
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

export const SubmitEvidenceBodySchema = z.object({
  taskId: z.string().min(1).optional(),
  expectedVersion: z.number().int().nonnegative(),
  siteVerification: SiteVerificationSchema.optional(),
  locationException: LocationExceptionSchema.optional(),
  identityException: IdentityExceptionSchema.optional(),
  supervisorGpsCheck: GpsCheckSchema.optional(),
  proof: ProofPayloadSchema,
  notes: z.string().optional(),
});

type SubmitEvidenceBody = z.infer<typeof SubmitEvidenceBodySchema>;

function validateEvidenceVerification(data: SubmitEvidenceBody, ctx: z.RefinementCtx) {
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
}

export const SubmitEvidenceRequestSchema = SubmitEvidenceBodySchema.extend({
  taskId: z.string().min(1),
}).superRefine(validateEvidenceVerification);

export const SubmitEvidenceHttpBodySchema = SubmitEvidenceBodySchema.superRefine(validateEvidenceVerification);

export type SubmitEvidenceRequest = z.infer<typeof SubmitEvidenceRequestSchema>;

const FlexibleSubmittedChecklistItemSchema = z.union([
  SubmittedChecklistItemSchema,
  z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    completed: z.literal(true, {
      errorMap: () => ({ message: 'All submitted checklist items must be completed (completed: true)' }),
    }),
  }),
]);

const FlexibleGpsCheckSchema = z.union([
  GpsCheckSchema,
  z
    .object({
      verified: z.boolean(),
      distanceMeters: z.number().nonnegative(),
      timestamp: z.string().min(1),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracyMeters: z.number().nonnegative().optional(),
    })
    .refine((data) => !data.verified || data.distanceMeters <= 10, {
      message: 'GPS distance must be <= 10 meters when verified is true',
      path: ['distanceMeters'],
    }),
]);

const FlexibleQrCheckSchema = z.union([
  z.object({
    verified: z.boolean(),
    scannedCode: z.string().min(1),
    timestamp: z.string().min(1),
  }),
  z.object({
    matched: z.boolean(),
    scannedCode: z.string().min(1),
    expectedCode: z.string().optional(),
    timestamp: z.string().min(1),
  }),
]);

export const StaffExecutionSubmitRequestSchema = z
  .object({
    taskId: z.string().min(1).optional(),
    expectedVersion: z.number().int().nonnegative().optional(),
    version: z.number().int().nonnegative().optional(),
    siteVerification: z
      .object({
        gpsCheck: FlexibleGpsCheckSchema.optional(),
        qrCheck: FlexibleQrCheckSchema.optional(),
      })
      .optional(),
    locationException: LocationExceptionSchema.optional(),
    identityException: IdentityExceptionSchema.optional(),
    checklist: z.array(FlexibleSubmittedChecklistItemSchema).min(1),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const gps = data.siteVerification?.gpsCheck;
    const gpsVerified = gps?.verified === true;
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

    const qr = data.siteVerification?.qrCheck;
    const qrVerified =
      (qr && 'verified' in qr && qr.verified === true) || (qr && 'matched' in qr && qr.matched === true);
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

export type StaffExecutionSubmitRequest = z.infer<typeof StaffExecutionSubmitRequestSchema>;

export const SupervisorEvidenceSubmitRequestSchema = z.object({
  taskId: z.string().min(1).optional(),
  expectedVersion: z.number().int().nonnegative().optional(),
  version: z.number().int().nonnegative().optional(),
  proof: z.union([
    ProofPayloadSchema,
    z.object({
      proofProfile: z.literal('CHANGE_PROOF').optional(),
      beforePhotoUri: z.string().min(1),
      afterPhotoUri: z.string().min(1),
      checklist: z.array(FlexibleSubmittedChecklistItemSchema).optional(),
    }),
  ]),
  supervisorGpsCheck: FlexibleGpsCheckSchema.optional(),
  notes: z.string().optional(),
});

export type SupervisorEvidenceSubmitRequest = z.infer<typeof SupervisorEvidenceSubmitRequestSchema>;

/**
 * Presigned Upload Request & Response Schemas
 */
export const PresignedUploadRequestSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive().optional(),
  contentHash: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'Expected 64-character hex SHA-256')
    .transform((h) => h.toLowerCase())
    .optional(),
});
export type PresignedUploadRequest = z.infer<typeof PresignedUploadRequestSchema>;

export const PresignedUploadDtoSchema = z.object({
  objectKey: z.string().min(1),
  storageRef: z.string().min(1),
  uploadUrl: z.string().min(1),
  expiresAt: z.string(),
});
export type PresignedUploadDto = z.infer<typeof PresignedUploadDtoSchema>;

export const PresignedUploadResponseSchema = z.object({
  data: PresignedUploadDtoSchema,
});
export type PresignedUploadResponse = z.infer<typeof PresignedUploadResponseSchema>;

/**
 * Durable Evidence Object Metadata DTO Schema
 */
export const EvidenceObjectDtoSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  objectKey: z.string().min(1),
  storageRef: z.string().min(1),
  contentHash: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  uploadedByUserId: z.string().min(1),
  createdAt: z.string(),
});
export type EvidenceObjectDto = z.infer<typeof EvidenceObjectDtoSchema>;
