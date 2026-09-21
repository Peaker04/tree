import { describe, it, expect } from 'vitest';
import { runMigrations } from '../../apps/api/src/infrastructure/persistence/migrate';
import { verifyDatabase } from '../../apps/api/src/infrastructure/persistence/verify';
import { buildApp } from '../../apps/api/src/app';
import { createDatabaseConnection } from '../../apps/api/src/infrastructure/persistence/db';

describe('Phase 13 Wave 2: PostgreSQL Persistence Foundation & Privilege Separation', () => {
  const migrationUrl = process.env['DATABASE_MIGRATION_URL'];
  const runtimeUrl = process.env['DATABASE_RUNTIME_URL'];

  const hasDatabase = Boolean(migrationUrl && runtimeUrl);

  it.runIf(hasDatabase)('applies migrations and bootstrap script on real PostgreSQL', async () => {
    await expect(runMigrations(migrationUrl, runtimeUrl)).resolves.not.toThrow();
  });

  it.runIf(hasDatabase)('verifies table existence and engine-level privilege separation', async () => {
    const result = await verifyDatabase(runtimeUrl);

    expect(result.connected).toBe(true);
    expect(result.tablesFound).toContain('users');
    expect(result.tablesFound).toContain('sessions');
    expect(result.tablesFound).toContain('audit_events');

    // Runtime application role must NOT own audit_events
    expect(result.runtimeOwnsAuditEvents).toBe(false);

    // Runtime application role privileges on audit_events
    expect(result.auditSelectAllowed).toBe(true);
    expect(result.auditInsertAllowed).toBe(true);

    // DENIED by PostgreSQL engine (insufficient_privilege 42501)
    expect(result.auditUpdateDenied).toBe(true);
    expect(result.auditDeleteDenied).toBe(true);
    expect(result.auditTruncateDenied).toBe(true);
  });

  it.runIf(hasDatabase)('verifies GET /ready returns HTTP 200 with real database pool', async () => {
    const conn = createDatabaseConnection(runtimeUrl!);
    const app = buildApp({ logger: false, pool: conn.pool });
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/ready',
      });
      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.body);
      expect(payload).toEqual({
        status: 'ok',
        database: 'connected',
      });
    } finally {
      await app.close();
      await conn.close();
    }
  });

  it.skipIf(hasDatabase)('records LOCAL_DB_INTEGRATION = NOT_RUN when local database is unavailable', () => {
    // Local development machine does not have a local PostgreSQL 18 or Docker runtime.
    // Per Section 35: LOCAL_DB_INTEGRATION = NOT_RUN.
    // Real integration verification executes in remote CI via the GitHub Actions PostgreSQL 18 service.
    expect(hasDatabase).toBe(false);
  });
});
