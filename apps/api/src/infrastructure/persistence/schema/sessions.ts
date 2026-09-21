import { pgTable, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Sessions persistence table for opaque session management (Phase 13 Wave 2 + Wave 3).
 * Supports token families, hashed credentials, server-authoritative freshness, and revocation.
 */
export const sessions = pgTable(
  'sessions',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenFamily: varchar('token_family', { length: 128 }).notNull(),
    accessTokenHash: varchar('access_token_hash', { length: 128 }).notNull(),
    refreshTokenHash: varchar('refresh_token_hash', { length: 128 }).notNull(),
    authVersion: integer('auth_version').notNull().default(1),
    sessionVersion: integer('session_version').notNull().default(1),
    accessExpiresAt: timestamp('access_expires_at', { withTimezone: true }).notNull(),
    refreshExpiresAt: timestamp('refresh_expires_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastRotatedAt: timestamp('last_rotated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_sessions_access_token_hash').on(table.accessTokenHash),
    index('idx_sessions_refresh_token_hash').on(table.refreshTokenHash),
    index('idx_sessions_token_family').on(table.tokenFamily),
  ],
);

export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;
