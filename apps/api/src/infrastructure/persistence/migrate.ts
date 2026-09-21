import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(migrationUrl?: string): Promise<void> {
  const url = migrationUrl ?? process.env['DATABASE_MIGRATION_URL'];
  if (!url) {
    throw new Error('DATABASE_MIGRATION_URL is required to run migrations');
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  try {
    const migrationsFolder = path.resolve(__dirname, 'migrations');
    console.log(`[migrate] Running migrations from ${migrationsFolder}...`);
    await migrate(db, { migrationsFolder });
    console.log('[migrate] Migrations completed successfully.');

    // Apply role privilege separation script
    const rolesScriptPath = path.resolve(__dirname, 'scripts', 'bootstrap-roles.sql');
    if (fs.existsSync(rolesScriptPath)) {
      console.log(`[migrate] Applying role bootstrap script: ${rolesScriptPath}...`);
      const sql = fs.readFileSync(rolesScriptPath, 'utf8');
      const client = await pool.connect();
      try {
        await client.query(sql);
        console.log('[migrate] Role bootstrap & privilege separation applied successfully.');
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

// Self-execution if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('[migrate] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[migrate] Failed:', err);
      process.exit(1);
    });
}
