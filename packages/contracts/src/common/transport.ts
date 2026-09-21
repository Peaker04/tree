import { z } from 'zod';

export const UUIDV4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const StrictUuidv4Schema = z.string().regex(UUIDV4_REGEX, {
  message: 'Must be a valid RFC 4122 UUIDv4',
});

export const IdempotencyKeyHeaderSchema = z
  .object({
    'idempotency-key': StrictUuidv4Schema.optional(),
    'Idempotency-Key': StrictUuidv4Schema.optional(),
  })
  .refine((headers) => Boolean(headers['idempotency-key'] || headers['Idempotency-Key']), {
    message: 'Idempotency-Key header is required and must be a valid RFC 4122 UUIDv4',
  });

export type IdempotencyKeyHeaders = z.infer<typeof IdempotencyKeyHeaderSchema>;

export const StrictMutationHeadersSchema = z.object({
  'idempotency-key': StrictUuidv4Schema,
});

export type StrictMutationHeaders = z.infer<typeof StrictMutationHeadersSchema>;
