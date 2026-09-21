import { z } from 'zod';

export const LocationExceptionSchema = z.object({
  reason: z.string().min(5),
  distanceMeters: z.number().positive(),
  explanationPhotoUri: z.string().min(1),
  recordedLat: z.number(),
  recordedLng: z.number(),
  timestamp: z.string().min(1),
});

export type LocationExceptionDto = z.infer<typeof LocationExceptionSchema>;

export const IdentityExceptionSchema = z.object({
  reason: z.string().min(5),
  damagedQrPhotoUri: z.string().min(1),
  embossedCode: z.string().min(1),
  timestamp: z.string().min(1),
});

export type IdentityExceptionDto = z.infer<typeof IdentityExceptionSchema>;
