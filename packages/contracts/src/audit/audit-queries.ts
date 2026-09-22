import { z } from 'zod';
import { AuditEventDtoSchema } from './audit-event';
import { PaginationQuerySchema } from '../common/pagination';
import { createApiListSchema } from '../common/envelopes';

export const ListAuditLogsQuerySchema = z.object({
  actorId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  fromTimestamp: z.string().optional(),
  toTimestamp: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type ListAuditLogsQuery = z.infer<typeof ListAuditLogsQuerySchema>;

export const ListAuditEventsQuerySchema = PaginationQuerySchema;
export type ListAuditEventsQuery = z.infer<typeof ListAuditEventsQuerySchema>;

export const ListAuditEventsResponseSchema = createApiListSchema(AuditEventDtoSchema); // We can align this with AuditEventSchema later
export type ListAuditEventsResponse = z.infer<typeof ListAuditEventsResponseSchema>;
