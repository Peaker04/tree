import { z } from 'zod';

export const LatitudeSchema = z
  .number()
  .min(-90, { message: 'Latitude must be between -90 and 90 degrees' })
  .max(90, { message: 'Latitude must be between -90 and 90 degrees' });

export type Latitude = z.infer<typeof LatitudeSchema>;

export const LongitudeSchema = z
  .number()
  .min(-180, { message: 'Longitude must be between -180 and 180 degrees' })
  .max(180, { message: 'Longitude must be between -180 and 180 degrees' });

export type Longitude = z.infer<typeof LongitudeSchema>;
