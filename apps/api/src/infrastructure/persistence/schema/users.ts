import { pgTable, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users persistence table.
 * Supports Human Roles ('staff', 'manager', 'admin') and AccountStatus ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED').
 * OCC version field for concurrency safety.
 */
export const users = pgTable('users', {
  id: varchar('id', { length: 128 }).primaryKey(),
  version: integer('version').notNull().default(0),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 30 }),
  initialRole: varchar('initial_role', { length: 20 }).notNull(),
  accountStatus: varchar('account_status', { length: 20 }).notNull().default('INVITED'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
