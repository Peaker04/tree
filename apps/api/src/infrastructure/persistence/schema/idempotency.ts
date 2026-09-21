import { pgTable, varchar, integer, timestamp, text, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Idempotency Records persistence table (Phase 13 Wave 4 - ADR 0009)
 * Stores committed HTTP mutation response caches mapped to (actorId, idempotencyKey).
 */
export const idempotencyRecords = pgTable(
  'idempotency_records',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull(),
    actorId: varchar('actor_id', { length: 128 }).notNull(),
    requestRoute: varchar('request_route', { length: 255 }).notNull(),
    requestHash: varchar('request_hash', { length: 128 }).notNull(),
    responseStatus: integer('response_status').notNull(),
    responseBody: text('response_body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actorKeyIdx: uniqueIndex('idx_idempotency_actor_key').on(table.actorId, table.idempotencyKey),
  }),
);

export type IdempotencyRecordRow = typeof idempotencyRecords.$inferSelect;
export type NewIdempotencyRecordRow = typeof idempotencyRecords.$inferInsert;
