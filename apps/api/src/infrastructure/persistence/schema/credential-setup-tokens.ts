import { pgTable, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Credential setup/reset tokens table (Phase 13 Wave 3).
 * Supports ResetCredentialSetup (GV-07) and first-time account credential setup.
 * Plaintext token is never persisted — only high-entropy SHA-256 hash.
 */
export const credentialSetupTokens = pgTable(
  'credential_setup_tokens',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_credential_setup_tokens_hash').on(table.tokenHash),
    index('idx_credential_setup_tokens_user').on(table.userId),
  ],
);

export type CredentialSetupTokenRow = typeof credentialSetupTokens.$inferSelect;
export type NewCredentialSetupTokenRow = typeof credentialSetupTokens.$inferInsert;
