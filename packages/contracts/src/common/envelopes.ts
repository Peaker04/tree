import { z } from 'zod';
import { ErrorCodeSchema } from './error-codes';

export const ConflictErrorDetailsSchema = z.object({
  subtype: z.literal('STALE_VERSION'),
  currentVersion: z.number().int().nonnegative(),
  expectedVersion: z.number().int().nonnegative(),
});

export type ConflictErrorDetails = z.infer<typeof ConflictErrorDetailsSchema>;

export const ApiErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  requestId: z.string(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export function createApiSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
  });
}

export interface ApiSuccess<TData> {
  data: TData;
}

export const ApiListMetaSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type ApiListMeta = z.infer<typeof ApiListMetaSchema>;

export function createApiListSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: ApiListMetaSchema,
  });
}

export interface ApiList<TData> {
  data: TData[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export const ApiFailureSchema = z.object({
  error: ApiErrorSchema,
});

export type ApiFailure = z.infer<typeof ApiFailureSchema>;

export type ApiResult<TData> = ApiSuccess<TData> | ApiFailure;
