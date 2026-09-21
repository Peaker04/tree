import { z } from 'zod';

export const StrictUuidv4Schema = z.string().uuid({ message: 'Must be a valid UUIDv4' });

export const IdempotencyKeyHeaderSchema = z
  .object({
    'idempotency-key': StrictUuidv4Schema.optional(),
    'Idempotency-Key': StrictUuidv4Schema.optional(),
  })
  .refine((headers) => Boolean(headers['idempotency-key'] || headers['Idempotency-Key']), {
    message: 'Idempotency-Key header is required and must be a valid UUIDv4',
  });

export type IdempotencyKeyHeaders = z.infer<typeof IdempotencyKeyHeaderSchema>;

export const StrictMutationHeadersSchema = z.object({
  'idempotency-key': StrictUuidv4Schema,
});

export type StrictMutationHeaders = z.infer<typeof StrictMutationHeadersSchema>;
