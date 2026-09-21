import { pgTable, varchar, integer, timestamp, numeric, boolean, text } from 'drizzle-orm/pg-core';

/**
 * Trees persistence table (Phase 13 Wave 4 - Tree Asset Registry)
 * Owns canonical tree master data, immutable treeId, unique qrCode,
 * canonical coordinates, health/risk status, and retirement state.
 */
export const trees = pgTable('trees', {
  id: varchar('id', { length: 128 }).primaryKey(),
  version: integer('version').notNull().default(0),
  name: varchar('name', { length: 255 }).notNull(),
  species: varchar('species', { length: 255 }).notNull(),
  lat: numeric('lat', { precision: 10, scale: 7 }).notNull(),
  lng: numeric('lng', { precision: 10, scale: 7 }).notNull(),
  address: text('address').notNull(),
  qrCode: varchar('qr_code', { length: 255 }).notNull().unique(),
  healthStatus: varchar('health_status', { length: 64 }).notNull(),
  ageYears: integer('age_years').notNull(),
  riskStatus: varchar('risk_status', { length: 64 }),
  isRetired: boolean('is_retired').notNull().default(false),
  retiredAt: timestamp('retired_at', { withTimezone: true }),
  retiredReason: text('retired_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TreeRow = typeof trees.$inferSelect;
export type NewTreeRow = typeof trees.$inferInsert;
