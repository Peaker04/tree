import { pgTable, varchar, timestamp, text, jsonb, index } from 'drizzle-orm/pg-core';

/**
 * Audit Events persistence table (ADR 0011).
 * Append-only historical table. Protected at PostgreSQL engine level via privilege separation.
 */
export const auditEvents = pgTable(
  'audit_events',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    actorId: varchar('actor_id', { length: 128 }).notNull(),
    actorRole: varchar('actor_role', { length: 64 }).notNull(),
    actionType: varchar('action_type', { length: 128 }).notNull(),
    resourceType: varchar('resource_type', { length: 128 }).notNull(),
    resourceId: varchar('resource_id', { length: 128 }).notNull(),
    outcome: varchar('outcome', { length: 32 }).notNull(),
    clientIp: varchar('client_ip', { length: 64 }),
    userAgent: text('user_agent'),
    correlationId: varchar('correlation_id', { length: 128 }),
    beforeState: jsonb('before_state'),
    afterState: jsonb('after_state'),
  },
  (table) => [
    index('idx_audit_events_actor_timestamp').on(table.actorId, table.timestamp),
    index('idx_audit_events_resource').on(table.resourceType, table.resourceId),
    index('idx_audit_events_action_timestamp').on(table.actionType, table.timestamp),
  ],
);

export type AuditEventRow = typeof auditEvents.$inferSelect;
export type NewAuditEventRow = typeof auditEvents.$inferInsert;
