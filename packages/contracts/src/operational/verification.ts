import { z } from 'zod';
import { LatitudeSchema, LongitudeSchema } from '../common/coordinates';

export const GpsCheckSchema = z
  .object({
    verified: z.boolean(),
    distance: z.number().nonnegative(),
    timestamp: z.string().min(1),
    lat: LatitudeSchema,
    lng: LongitudeSchema,
    accuracyMeters: z.number().nonnegative().optional(),
  })
  .refine((data) => !data.verified || data.distance <= 10, {
    message: 'GPS distance must be <= 10 meters when verified is true',
    path: ['distance'],
  });

export type GpsCheckDto = z.infer<typeof GpsCheckSchema>;

export const QrCheckSchema = z.object({
  verified: z.boolean(),
  scannedCode: z.string().min(1),
  timestamp: z.string().min(1),
});

export type QrCheckDto = z.infer<typeof QrCheckSchema>;

export const SiteVerificationSchema = z.object({
  gpsCheck: GpsCheckSchema.optional(),
  qrCheck: QrCheckSchema.optional(),
});

export type SiteVerificationDto = z.infer<typeof SiteVerificationSchema>;
