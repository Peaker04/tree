import { pgTable, varchar, integer, timestamp, text, jsonb, bigint } from 'drizzle-orm/pg-core';
import { tasks } from './tasks';
import { users } from './users';

/**
 * Evidence Objects metadata table (Phase 13 Wave 4 - Object Storage Durable Reference)
 * Links binary objects stored in S3-compatible storage with task and uploader identity.
 */
export const evidenceObjects = pgTable('evidence_objects', {
  id: varchar('id', { length: 128 }).primaryKey(),
  taskId: varchar('task_id', { length: 128 })
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  objectKey: varchar('object_key', { length: 512 }).notNull().unique(),
  storageRef: varchar('storage_ref', { length: 512 }).notNull(),
  contentHash: varchar('content_hash', { length: 128 }).notNull(),
  contentType: varchar('content_type', { length: 128 }).notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  uploadedByUserId: varchar('uploaded_by_user_id', { length: 128 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type EvidenceObjectRow = typeof evidenceObjects.$inferSelect;
export type NewEvidenceObjectRow = typeof evidenceObjects.$inferInsert;

/**
 * Evidence Attempts table (Phase 13 Wave 4 - Multi-Version Submission History)
 * Immutable submission history preserving historical authorship across reassignments and rework loops.
 */
export const evidenceAttempts = pgTable('evidence_attempts', {
  id: varchar('id', { length: 128 }).primaryKey(),
  taskId: varchar('task_id', { length: 128 })
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  attemptNumber: integer('attempt_number').notNull(),
  submittedByUserId: varchar('submitted_by_user_id', { length: 128 })
    .notNull()
    .references(() => users.id),
  proofProfile: varchar('proof_profile', { length: 64 }).notNull(),
  proofData: jsonb('proof_data').notNull(),
  siteVerification: jsonb('site_verification'),
  locationException: jsonb('location_exception'),
  identityException: jsonb('identity_exception'),
  notes: text('notes'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
});

export type EvidenceAttemptRow = typeof evidenceAttempts.$inferSelect;
export type NewEvidenceAttemptRow = typeof evidenceAttempts.$inferInsert;

/**
 * Field Issues table (Phase 13 Wave 4 - BLOCKED state origin)
 */
export const fieldIssues = pgTable('field_issues', {
  id: varchar('id', { length: 128 }).primaryKey(),
  taskId: varchar('task_id', { length: 128 })
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  reportedByUserId: varchar('reported_by_user_id', { length: 128 })
    .notNull()
    .references(() => users.id),
  issueDescription: text('issue_description').notNull(),
  issuePhotoStorageRef: text('issue_photo_storage_ref').notNull(),
  reportedAt: timestamp('reported_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedByUserId: varchar('resolved_by_user_id', { length: 128 }).references(() => users.id),
  resolutionNotes: text('resolution_notes'),
});

export type FieldIssueRow = typeof fieldIssues.$inferSelect;
export type NewFieldIssueRow = typeof fieldIssues.$inferInsert;

/**
 * Task Reviews table (Phase 13 Wave 4 - Review Decisions & Targeted Rework)
 */
export const taskReviews = pgTable('task_reviews', {
  id: varchar('id', { length: 128 }).primaryKey(),
  taskId: varchar('task_id', { length: 128 })
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  evidenceAttemptId: varchar('evidence_attempt_id', { length: 128 }).references(() => evidenceAttempts.id),
  reviewerId: varchar('reviewer_id', { length: 128 })
    .notNull()
    .references(() => users.id),
  decision: varchar('decision', { length: 64 }).notNull(),
  notes: text('notes'),
  exceptionReason: text('exception_reason'),
  targetedArea: text('targeted_area'),
  reworkReason: text('rework_reason'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TaskReviewRow = typeof taskReviews.$inferSelect;
export type NewTaskReviewRow = typeof taskReviews.$inferInsert;
