import { pgTable, varchar, integer, timestamp, text, jsonb } from 'drizzle-orm/pg-core';
import { taskTypes } from './task-types';

/**
 * Proof Policy Versions persistence table (Phase 13 Wave 4 - Policy & Template Governance)
 * Immutable historical proof profile mapping per task type.
 */
export const proofPolicyVersions = pgTable('proof_policy_versions', {
  id: varchar('id', { length: 128 }).primaryKey(),
  taskTypeId: varchar('task_type_id', { length: 128 })
    .notNull()
    .references(() => taskTypes.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  proofProfile: varchar('proof_profile', { length: 64 }).notNull(),
  policyDescription: text('policy_description'),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ProofPolicyVersionRow = typeof proofPolicyVersions.$inferSelect;
export type NewProofPolicyVersionRow = typeof proofPolicyVersions.$inferInsert;

/**
 * Checklist Template Versions persistence table (Phase 13 Wave 4 - Policy & Template Governance)
 * Immutable historical checklist template definitions per task type.
 */
export const checklistTemplateVersions = pgTable('checklist_template_versions', {
  id: varchar('id', { length: 128 }).primaryKey(),
  taskTypeId: varchar('task_type_id', { length: 128 })
    .notNull()
    .references(() => taskTypes.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  templateItems: jsonb('template_items').notNull(),
  templateDescription: text('template_description'),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ChecklistTemplateVersionRow = typeof checklistTemplateVersions.$inferSelect;
export type NewChecklistTemplateVersionRow = typeof checklistTemplateVersions.$inferInsert;
