import { pgTable, varchar, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';

/**
 * TaskTypes catalog persistence table (Phase 13 Wave 4 - Policy & Template Governance)
 * Owns task type catalog definitions, default proof profiles, and active status.
 */
export const taskTypes = pgTable('task_types', {
  id: varchar('id', { length: 128 }).primaryKey(),
  version: integer('version').notNull().default(0),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  defaultProofProfile: varchar('default_proof_profile', { length: 64 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TaskTypeRow = typeof taskTypes.$inferSelect;
export type NewTaskTypeRow = typeof taskTypes.$inferInsert;
