import type { IDatabaseConnection, MigrationStep } from './types';

export const LATEST_SCHEMA_VERSION = 1;

export const migrations: MigrationStep[] = [
  {
    version: 1,
    name: 'initial_offline_schema',
    up: async (db: IDatabaseConnection) => {
      // 1. Migration tracking table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TEXT NOT NULL
        );
      `);

      // 2. Cached server tasks projection
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cached_tasks (
          id TEXT PRIMARY KEY,
          tree_id TEXT,
          task_type_id TEXT,
          task_type_name TEXT,
          status TEXT NOT NULL,
          assigned_staff_id TEXT,
          assigned_staff_name TEXT,
          deadline TEXT,
          version INTEGER NOT NULL DEFAULT 0,
          proof_profile TEXT,
          title TEXT,
          description TEXT,
          priority TEXT,
          raw_json TEXT,
          updated_at TEXT NOT NULL
        );
      `);

      // 3. Local draft state for tasks
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS local_drafts (
          task_id TEXT PRIMARY KEY,
          submission_status TEXT NOT NULL DEFAULT 'IDLE',
          gps_lat REAL,
          gps_lng REAL,
          gps_distance_meters REAL,
          gps_verified INTEGER NOT NULL DEFAULT 0,
          gps_timestamp TEXT,
          qr_scanned_code TEXT,
          qr_verified INTEGER NOT NULL DEFAULT 0,
          qr_timestamp TEXT,
          location_exception_json TEXT,
          identity_exception_json TEXT,
          checklist_json TEXT,
          findings_json TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (task_id) REFERENCES cached_tasks(id) ON DELETE CASCADE
        );
      `);

      // 4. Local evidence file metadata
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS local_evidence (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          stage TEXT NOT NULL,
          local_file_uri TEXT NOT NULL,
          file_name TEXT NOT NULL,
          content_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          sha256 TEXT NOT NULL,
          captured_at TEXT NOT NULL,
          is_persisted_in_sandbox INTEGER NOT NULL DEFAULT 1,
          sync_status TEXT NOT NULL DEFAULT 'IDLE',
          created_at TEXT NOT NULL,
          FOREIGN KEY (task_id) REFERENCES cached_tasks(id) ON DELETE CASCADE
        );
      `);

      // 5. Durable FIFO outbox queue
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS outbox_items (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          command_type TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          idempotency_key TEXT NOT NULL,
          attempt_count INTEGER NOT NULL DEFAULT 0,
          sync_status TEXT NOT NULL DEFAULT 'IDLE',
          last_error TEXT,
          error_classification TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (task_id) REFERENCES cached_tasks(id) ON DELETE CASCADE
        );
      `);

      // 6. Indexes for FIFO ordering, sync status, and evidence lookups
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_outbox_fifo ON outbox_items (created_at ASC);
        CREATE INDEX IF NOT EXISTS idx_outbox_sync ON outbox_items (sync_status);
        CREATE INDEX IF NOT EXISTS idx_local_evidence_task ON local_evidence (task_id);
      `);
    },
  },
];

export async function getCurrentSchemaVersion(db: IDatabaseConnection): Promise<number> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  return result ? Number(result.user_version) : 0;
}

export async function runMigrations(
  db: IDatabaseConnection,
  targetVersion = LATEST_SCHEMA_VERSION,
): Promise<{ startingVersion: number; currentVersion: number; appliedCount: number }> {
  // Enforce foreign key constraints
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const startingVersion = await getCurrentSchemaVersion(db);

  if (startingVersion >= targetVersion) {
    return {
      startingVersion,
      currentVersion: startingVersion,
      appliedCount: 0,
    };
  }

  let currentVersion = startingVersion;
  let appliedCount = 0;

  for (const migration of migrations) {
    if (migration.version > startingVersion && migration.version <= targetVersion) {
      await db.withTransactionAsync(async () => {
        await migration.up(db);
        await db.execAsync(`PRAGMA user_version = ${migration.version};`);
        await db.runAsync('INSERT OR REPLACE INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);', [
          migration.version,
          migration.name,
          new Date().toISOString(),
        ]);
      });
      currentVersion = migration.version;
      appliedCount += 1;
    }
  }

  return {
    startingVersion,
    currentVersion,
    appliedCount,
  };
}
