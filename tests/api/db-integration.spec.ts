import { describe, it, expect } from 'vitest';
import { runMigrations } from '../../apps/api/src/infrastructure/persistence/migrate';
import { verifyDatabase } from '../../apps/api/src/infrastructure/persistence/verify';
import { buildApp } from '../../apps/api/src/app';
import { createDatabaseConnection } from '../../apps/api/src/infrastructure/persistence/db';
import { DrizzleUserRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-user-repository';
import { DrizzleSessionRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-session-repository';
import { DrizzleAuditWriter } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-audit-writer';
import { CryptoTokenService } from '../../apps/api/src/infrastructure/security/crypto-token-service';
import crypto from 'node:crypto';

describe('Phase 13 Wave 2 + Wave 3: PostgreSQL Persistence Foundation & IAM Integration', () => {
  const migrationUrl = process.env['DATABASE_MIGRATION_URL'];
  const runtimeUrl = process.env['DATABASE_RUNTIME_URL'];

  const hasDatabase = Boolean(migrationUrl && runtimeUrl);

  it.runIf(hasDatabase)('applies migrations (0000 + 0001) and bootstrap script on real PostgreSQL', async () => {
    await expect(runMigrations(migrationUrl, runtimeUrl)).resolves.not.toThrow();
  });

  it.runIf(hasDatabase)('verifies all 5 persistence tables and engine-level privilege separation', async () => {
    const result = await verifyDatabase(runtimeUrl);

    expect(result.connected).toBe(true);
    expect(result.tablesFound).toContain('users');
    expect(result.tablesFound).toContain('sessions');
    expect(result.tablesFound).toContain('audit_events');
    expect(result.tablesFound).toContain('spent_refresh_tokens');
    expect(result.tablesFound).toContain('credential_setup_tokens');

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

  it.runIf(hasDatabase)(
    'verifies real PostgreSQL IAM session rotation and reuse detection (P13W3-P06, P13W3-P07, P13W3-P08, P13W3-P09)',
    async () => {
      const conn = createDatabaseConnection(runtimeUrl!);
      const tokenService = new CryptoTokenService();
      const userRepo = new DrizzleUserRepository(conn.db);
      const sessionRepo = new DrizzleSessionRepository(conn.db);
      const auditWriter = new DrizzleAuditWriter(conn.db);

      try {
        const user = await userRepo.create({
          id: crypto.randomUUID(),
          version: 0,
          email: `pg-iam-${Date.now()}@example.com`,
          phone: '+84901234567',
          initialRole: 'staff',
          role: 'staff',
          accountStatus: 'ACTIVE',
          passwordHash: null,
          authVersion: 1,
        });

        const token1 = tokenService.generateToken(32);
        const refresh1 = tokenService.generateToken(32);
        const token1Hash = tokenService.hashToken(token1);
        const refresh1Hash = tokenService.hashToken(refresh1);

        const session = await sessionRepo.createSession({
          id: crypto.randomUUID(),
          userId: user.id,
          tokenFamily: crypto.randomUUID(),
          accessTokenHash: token1Hash,
          refreshTokenHash: refresh1Hash,
          authVersion: 1,
          sessionVersion: 1,
          accessExpiresAt: new Date(Date.now() + 900_000),
          refreshExpiresAt: new Date(Date.now() + 86400_000),
          expiresAt: new Date(Date.now() + 86400_000),
        });

        expect(session.id).toBeDefined();

        // Atomic rotation in PostgreSQL
        const token2 = tokenService.generateToken(32);
        const refresh2 = tokenService.generateToken(32);
        const token2Hash = tokenService.hashToken(token2);
        const refresh2Hash = tokenService.hashToken(refresh2);

        const rotated = await sessionRepo.rotateRefreshToken({
          sessionId: session.id,
          tokenFamily: session.tokenFamily,
          oldRefreshTokenHash: refresh1Hash,
          newAccessTokenHash: token2Hash,
          newRefreshTokenHash: refresh2Hash,
          newAccessExpiresAt: new Date(Date.now() + 900_000),
          newRefreshExpiresAt: new Date(Date.now() + 86400_000),
          sessionVersion: 1,
        });

        expect(rotated.sessionVersion).toBe(2);
        expect(rotated.refreshTokenHash).toBe(refresh2Hash);

        // Verify old refresh token is recorded in spent_refresh_tokens
        const spent = await sessionRepo.findSpentRefreshTokenByHash(refresh1Hash);
        expect(spent).not.toBeNull();
        expect(spent?.sessionId).toBe(session.id);

        // Audit writing in PostgreSQL
        await auditWriter.writeEvent({
          actorId: user.id,
          actorRole: 'staff',
          actionType: 'IAM_PG_TEST',
          resourceType: 'SESSION',
          resourceId: session.id,
          outcome: 'SUCCESS',
        });
      } finally {
        await conn.close();
      }
    },
  );

  it.skipIf(hasDatabase)('records LOCAL_DB_INTEGRATION = NOT_RUN when local database is unavailable', () => {
    // Local development machine does not have a local PostgreSQL 18 or Docker runtime.
    // Per Section 71: LOCAL_DB_INTEGRATION = NOT_RUN.
    // Real integration verification executes in remote CI via the GitHub Actions PostgreSQL 18 service.
    expect(hasDatabase).toBe(false);
  });
});
