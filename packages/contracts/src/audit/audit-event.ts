import { z } from 'zod';
import { HumanRoleSchema } from '../auth/roles';

export const AuditOutcomeSchema = z.enum(['SUCCESS', 'FAILURE']);
export type AuditOutcome = z.infer<typeof AuditOutcomeSchema>;

export const AuditEventDtoSchema = z.object({
  id: z.string().min(1),
  actorId: z.string().min(1),
  actorRole: HumanRoleSchema,
  action: z.string().min(1),
  targetResourceType: z.string().min(1),
  targetResourceId: z.string().min(1),
  timestamp: z.string().min(1),
  outcome: AuditOutcomeSchema,
  details: z.record(z.unknown()).optional(),
  reason: z.string().optional(),
});

export type AuditEventDto = z.infer<typeof AuditEventDtoSchema>;
