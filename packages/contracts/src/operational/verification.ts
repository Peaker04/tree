import { z } from 'zod';

export const GpsCheckSchema = z.object({
  verified: z.boolean(),
  distance: z.number().nonnegative(),
  timestamp: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  accuracyMeters: z.number().nonnegative().optional(),
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
