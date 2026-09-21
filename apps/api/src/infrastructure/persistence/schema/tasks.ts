import { pgTable, varchar, integer, timestamp, text, jsonb } from 'drizzle-orm/pg-core';
import { taskTypes } from './task-types';
import { trees } from './trees';
import { users } from './users';

/**
 * Tasks persistence table (Phase 13 Wave 4 - Work Management Core Domain)
 * Implements 7-state task aggregate root, OCC versioning, immutable treeId,
 * policy snapshotting, and cancellation audit metadata.
 */
export const tasks = pgTable('tasks', {
  id: varchar('id', { length: 128 }).primaryKey(),
  version: integer('version').notNull().default(0),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  taskTypeId: varchar('task_type_id', { length: 128 })
    .notNull()
    .references(() => taskTypes.id),
  taskTypeName: varchar('task_type_name', { length: 255 }).notNull(),
  proofProfile: varchar('proof_profile', { length: 64 }).notNull(),
  policyVersionId: varchar('policy_version_id', { length: 128 }),
  checklistTemplateVersionId: varchar('checklist_template_version_id', { length: 128 }),
  treeId: varchar('tree_id', { length: 128 })
    .notNull()
    .references(() => trees.id),
  treeName: varchar('tree_name', { length: 255 }).notNull(),
  treeAddress: text('tree_address').notNull(),
  assignedStaffId: varchar('assigned_staff_id', { length: 128 })
    .notNull()
    .references(() => users.id),
  assignedStaffName: varchar('assigned_staff_name', { length: 255 }).notNull(),
  deadline: varchar('deadline', { length: 64 }).notNull(),
  status: varchar('status', { length: 64 }).notNull().default('PENDING'),
  checklistSnapshot: jsonb('checklist_snapshot'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: varchar('cancelled_by', { length: 128 }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
