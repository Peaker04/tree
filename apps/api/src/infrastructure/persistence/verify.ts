import pg from 'pg';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

export interface DbVerificationResult {
  connected: boolean;
  tablesFound: string[];
  runtimeOwnsAuditEvents: boolean;
  auditSelectAllowed: boolean;
  auditInsertAllowed: boolean;
  auditUpdateDenied: boolean;
  auditDeleteDenied: boolean;
  auditTruncateDenied: boolean;
}

export async function verifyDatabase(runtimeUrl?: string): Promise<DbVerificationResult> {
  const url = runtimeUrl ?? process.env['DATABASE_RUNTIME_URL'];
  if (!url) {
    throw new Error('DATABASE_RUNTIME_URL is required to verify database');
  }

  const pool = new Pool({ connectionString: url });
  const result: DbVerificationResult = {
    connected: false,
    tablesFound: [],
    runtimeOwnsAuditEvents: false,
    auditSelectAllowed: false,
    auditInsertAllowed: false,
    auditUpdateDenied: false,
    auditDeleteDenied: false,
    auditTruncateDenied: false,
  };

  try {
    const client = await pool.connect();
    try {
      // 1. Connection check
      await client.query('SELECT 1');
      result.connected = true;

      // 2. Check table existence (all 5 persistence tables)
      const tablesRes = await client.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'sessions', 'audit_events', 'spent_refresh_tokens', 'credential_setup_tokens')`,
      );
      result.tablesFound = tablesRes.rows.map((r) => r.table_name);

      // 3. Verify audit_events table ownership (runtime role must NOT own audit_events)
      const ownerRes = await client.query<{ tableowner: string }>(
        `SELECT tableowner FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_events'`,
      );
      const currentUserRes = await client.query<{ current_user: string }>(`SELECT current_user`);
      const tableOwner = ownerRes.rows[0]?.tableowner;
      const currentUser = currentUserRes.rows[0]?.current_user;
      result.runtimeOwnsAuditEvents = Boolean(tableOwner && currentUser && tableOwner === currentUser);

      // 4. Verify audit_events SELECT
      await client.query('SELECT count(*) FROM audit_events');
      result.auditSelectAllowed = true;

      // 4. Verify audit_events INSERT
      const testId = `audit-verify-${Date.now()}`;
      await client.query(
        `INSERT INTO audit_events (id, timestamp, actor_id, actor_role, action_type, resource_type, resource_id, outcome)
         VALUES ($1, now(), 'verifier', 'system', 'VERIFY_PRIVILEGES', 'system', 'verify-01', 'SUCCESS')`,
        [testId],
      );
      result.auditInsertAllowed = true;

      // 5. Verify audit_events UPDATE is DENIED by PostgreSQL engine
      try {
        await client.query(`UPDATE audit_events SET outcome = 'TAMPERED' WHERE id = $1`, [testId]);
        result.auditUpdateDenied = false; // Failed if it succeeded!
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        // PostgreSQL error code 42501 = insufficient_privilege
        if (pgErr.code === '42501') {
          result.auditUpdateDenied = true;
        } else {
          throw err;
        }
      }

      // 6. Verify audit_events DELETE is DENIED by PostgreSQL engine
      try {
        await client.query(`DELETE FROM audit_events WHERE id = $1`, [testId]);
        result.auditDeleteDenied = false; // Failed if it succeeded!
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr.code === '42501') {
          result.auditDeleteDenied = true;
        } else {
          throw err;
        }
      }

      // 7. Verify audit_events TRUNCATE is DENIED by PostgreSQL engine
      try {
        await client.query(`TRUNCATE TABLE audit_events`);
        result.auditTruncateDenied = false; // Failed if it succeeded!
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr.code === '42501') {
          result.auditTruncateDenied = true;
        } else {
          throw err;
        }
      }
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }

  return result;
}

// Self-execution if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifyDatabase()
    .then((res) => {
      console.log('[verify] Result:', JSON.stringify(res, null, 2));
      const allPassed =
        res.connected &&
        res.tablesFound.length === 5 &&
        !res.runtimeOwnsAuditEvents &&
        res.auditSelectAllowed &&
        res.auditInsertAllowed &&
        res.auditUpdateDenied &&
        res.auditDeleteDenied &&
        res.auditTruncateDenied;
      if (allPassed) {
        console.log('[verify] All database & privilege checks passed successfully.');
        process.exit(0);
      } else {
        console.error('[verify] Some verification checks failed.');
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('[verify] Verification failed:', err);
      process.exit(1);
    });
}
