import { pgTable, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users persistence table (Phase 13 Wave 2 + Wave 3).
 * Supports Human Roles ('staff', 'manager', 'admin') and AccountStatus ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED').
 * OCC version field for concurrency safety.
 * Wave 3 adds effective role, password hash, authVersion, and credential-lock fields.
 */
export const users = pgTable('users', {
  id: varchar('id', { length: 128 }).primaryKey(),
  version: integer('version').notNull().default(0),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  initialRole: varchar('initial_role', { length: 20 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('staff'),
  accountStatus: varchar('account_status', { length: 20 }).notNull().default('INVITED'),
  passwordHash: varchar('password_hash', { length: 255 }),
  authVersion: integer('auth_version').notNull().default(1),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
