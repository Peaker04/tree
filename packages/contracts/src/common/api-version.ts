import { z } from 'zod';

export const API_VERSION = 'v1' as const;

export const ApiVersionSchema = z.literal(API_VERSION);
export type ApiVersion = z.infer<typeof ApiVersionSchema>;
