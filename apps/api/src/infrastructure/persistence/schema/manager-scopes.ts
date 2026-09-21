import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Manager Operational Scopes persistence table (Phase 13 Wave 4 - Authorization & Scope)
 * Enforces AUTHORIZED_OPERATIONAL_SCOPE for Operations Managers.
 * Minimal PostgreSQL-backed representation without inventing unapproved public human business commands.
 */
export const managerOperationalScopes = pgTable('manager_operational_scopes', {
  id: varchar('id', { length: 128 }).primaryKey(),
  managerId: varchar('manager_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  scopeKey: varchar('scope_key', { length: 128 }).notNull(), // e.g. "GLOBAL", district ID, or tree prefix
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ManagerOperationalScopeRow = typeof managerOperationalScopes.$inferSelect;
export type NewManagerOperationalScopeRow = typeof managerOperationalScopes.$inferInsert;
