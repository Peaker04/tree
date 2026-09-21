import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(migrationUrl?: string, runtimeUrl?: string): Promise<void> {
  const mUrl = migrationUrl ?? process.env['DATABASE_MIGRATION_URL'];
  if (!mUrl) {
    throw new Error('DATABASE_MIGRATION_URL is required to run migrations');
  }

  const rUrl = runtimeUrl ?? process.env['DATABASE_RUNTIME_URL'];

  const pool = new Pool({ connectionString: mUrl });
  const db = drizzle(pool);

  try {
    const migrationsFolder = path.resolve(__dirname, 'migrations');
    console.log(`[migrate] Running migrations from ${migrationsFolder}...`);
    await migrate(db, { migrationsFolder });
    console.log('[migrate] Migrations completed successfully.');

    // Dynamic role provisioning and privilege separation
    if (rUrl) {
      const parsedRuntime = new URL(rUrl);
      const runtimeUser = decodeURIComponent(parsedRuntime.username);
      const runtimePass = decodeURIComponent(parsedRuntime.password);

      if (!/^[a-zA-Z0-9_]{1,63}$/.test(runtimeUser)) {
        throw new Error(`Invalid PostgreSQL role name in DATABASE_RUNTIME_URL: ${runtimeUser}`);
      }

      console.log(`[migrate] Provisioning runtime role: ${runtimeUser}...`);
      const client = await pool.connect();
      try {
        const roleRes = await client.query('SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = $1', [runtimeUser]);
        const escapedPassword = runtimePass.replace(/'/g, "''");
        const safeRole = `"${runtimeUser}"`;

        if (roleRes.rows.length === 0) {
          await client.query(`CREATE ROLE ${safeRole} WITH LOGIN PASSWORD '${escapedPassword}'`);
          console.log(`[migrate] Role ${runtimeUser} created.`);
        } else if (runtimePass) {
          await client.query(`ALTER ROLE ${safeRole} WITH PASSWORD '${escapedPassword}'`);
        }

        // Apply privileges
        await client.query(`GRANT USAGE ON SCHEMA public TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sessions TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE spent_refresh_tokens TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE credential_setup_tokens TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE trees TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE task_types TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE proof_policy_versions TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE checklist_template_versions TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE manager_operational_scopes TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tasks TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE evidence_objects TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE evidence_attempts TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE field_issues TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE task_reviews TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE care_histories TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE idempotency_records TO ${safeRole}`);
        await client.query(`GRANT SELECT, INSERT ON TABLE audit_events TO ${safeRole}`);
        await client.query(`REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit_events FROM ${safeRole}`);
        console.log(`[migrate] Role privileges applied successfully for ${runtimeUser}.`);
      } finally {
        client.release();
      }
    } else {
      // If DATABASE_RUNTIME_URL is not provided, apply credential-free bootstrap-roles.sql if app_runtime exists
      const rolesScriptPath = path.resolve(__dirname, 'scripts', 'bootstrap-roles.sql');
      if (fs.existsSync(rolesScriptPath)) {
        const client = await pool.connect();
        try {
          const roleRes = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'app_runtime'");
          if (roleRes.rows.length > 0) {
            console.log(`[migrate] Applying credential-free role privileges from ${rolesScriptPath}...`);
            const sql = fs.readFileSync(rolesScriptPath, 'utf8');
            await client.query(sql);
            console.log('[migrate] Role privileges applied successfully.');
          }
        } finally {
          client.release();
        }
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
