import { pgTable, varchar, bigint, timestamp, index } from 'drizzle-orm/pg-core';
import { tasks } from './tasks';
import { users } from './users';

/**
 * Evidence Upload Reservations table (Phase 13 Wave 4 - W4-C03 Provenance & Ownership)
 * Tracks server-issued presigned upload authorizations to prevent adoption of arbitrary or other-tenant objects.
 */
export const evidenceUploadReservations = pgTable(
  'evidence_upload_reservations',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    taskId: varchar('task_id', { length: 128 })
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    actorId: varchar('actor_id', { length: 128 })
      .notNull()
      .references(() => users.id),
    objectKey: varchar('object_key', { length: 512 }).notNull().unique(),
    storageRef: varchar('storage_ref', { length: 512 }).notNull(),
    expectedContentType: varchar('expected_content_type', { length: 128 }).notNull(),
    expectedSizeBytes: bigint('expected_size_bytes', { mode: 'number' }),
    expectedContentHash: varchar('expected_content_hash', { length: 128 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    taskIdx: index('idx_evidence_reservations_task').on(table.taskId),
    actorIdx: index('idx_evidence_reservations_actor').on(table.actorId),
  }),
);

export type EvidenceUploadReservationRow = typeof evidenceUploadReservations.$inferSelect;
export type NewEvidenceUploadReservationRow = typeof evidenceUploadReservations.$inferInsert;
