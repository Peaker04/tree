import { pgTable, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { sessions } from './sessions';

/**
 * Spent refresh tokens table for refresh reuse detection (Phase 13 Wave 3).
 * When a refresh credential is rotated, its hash is recorded here.
 * If an incoming request presents a spent hash, token reuse is detected,
 * triggering immediate invalidation of the affected session/token family.
 */
export const spentRefreshTokens = pgTable(
  'spent_refresh_tokens',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    sessionId: varchar('session_id', { length: 128 })
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    tokenFamily: varchar('token_family', { length: 128 }).notNull(),
    refreshTokenHash: varchar('refresh_token_hash', { length: 128 }).notNull(),
    spentAt: timestamp('spent_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_spent_refresh_tokens_hash').on(table.refreshTokenHash),
    index('idx_spent_refresh_tokens_family').on(table.tokenFamily),
  ],
);

export type SpentRefreshTokenRow = typeof spentRefreshTokens.$inferSelect;
export type NewSpentRefreshTokenRow = typeof spentRefreshTokens.$inferInsert;
