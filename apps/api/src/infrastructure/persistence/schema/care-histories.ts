import { pgTable, varchar, timestamp, text, jsonb, boolean } from 'drizzle-orm/pg-core';
import { trees } from './trees';
import { tasks } from './tasks';

/**
 * Care Histories persistence table (Phase 13 Wave 4 - Tree Asset Registry Projection)
 * Derived read model projection created exclusively from COMPLETED tasks (DR-HARD-07 / BR-11).
 */
export const careHistories = pgTable('care_histories', {
  id: varchar('id', { length: 128 }).primaryKey(),
  treeId: varchar('tree_id', { length: 128 })
    .notNull()
    .references(() => trees.id),
  taskId: varchar('task_id', { length: 128 })
    .notNull()
    .unique()
    .references(() => tasks.id),
  taskTitle: varchar('task_title', { length: 255 }).notNull(),
  staffId: varchar('staff_id', { length: 128 }).notNull(),
  staffName: varchar('staff_name', { length: 255 }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  status: varchar('status', { length: 64 }).notNull().default('COMPLETED'),
  hasException: boolean('has_exception').notNull().default(false),
  exceptionReason: text('exception_reason'),
  gpsCheck: jsonb('gps_check'),
  qrCheck: jsonb('qr_check'),
  beforePhoto: text('before_photo'),
  afterPhoto: text('after_photo'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CareHistoryRow = typeof careHistories.$inferSelect;
export type NewCareHistoryRow = typeof careHistories.$inferInsert;
