import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
