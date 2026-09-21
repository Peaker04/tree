import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { buildApp } from '../../apps/api/src/app';
import { DrizzleUserRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-user-repository';
import { DrizzleSessionRepository } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-session-repository';
import { DrizzleAuditWriter } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-audit-writer';
import { DrizzleIamUnitOfWork } from '../../apps/api/src/infrastructure/persistence/repositories/drizzle-iam-unit-of-work';
import { CryptoTokenService } from '../../apps/api/src/infrastructure/security/crypto-token-service';
import { Argon2PasswordHasher } from '../../apps/api/src/infrastructure/security/argon2-password-hasher';
import { AuditService } from '../../apps/api/src/modules/audit-compliance/application/services/audit.service';
import * as schema from '../../apps/api/src/infrastructure/persistence/schema';

const { Pool } = pg;

describe('Phase 13 Wave 3: Real PostgreSQL IAM Security Integration Evidence (W3-C01, W3-C05, W3-C06)', () => {
  const migrationUrl = process.env['DATABASE_MIGRATION_URL'];
  const runtimeUrl = process.env['DATABASE_RUNTIME_URL'];
  const hasDatabase = Boolean(migrationUrl && runtimeUrl);

  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let userRepo: DrizzleUserRepository;
  let sessionRepo: DrizzleSessionRepository;
  let auditWriter: DrizzleAuditWriter;
  let unitOfWork: DrizzleIamUnitOfWork;
  let tokenService: CryptoTokenService;
  let passwordHasher: Argon2PasswordHasher;

  beforeAll(() => {
    if (hasDatabase && runtimeUrl) {
      pool = new Pool({ connectionString: runtimeUrl });
      db = drizzle(pool, { schema });
      userRepo = new DrizzleUserRepository(db);
      sessionRepo = new DrizzleSessionRepository(db);
      auditWriter = new DrizzleAuditWriter(db);
      unitOfWork = new DrizzleIamUnitOfWork(db);
      tokenService = new CryptoTokenService();
      passwordHasher = new Argon2PasswordHasher({ memoryCost: 4096, timeCost: 1, parallelism: 1 });
    }
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  // =========================================================================
  // 1. W3-C01 & Section 6: Real PostgreSQL Transaction Rollback Test
  // =========================================================================
  it.runIf(hasDatabase)(
    'proves atomic rollback on deliberate failure in real PostgreSQL transaction (W3-C01, Section 6)',
    async () => {
      const auditService = new AuditService(auditWriter);
      const testUserId = crypto.randomUUID();

      // Seed initial user
      await userRepo.create({
        id: testUserId,
        version: 0,
        email: `rollback-${Date.now()}@example.com`,
        phone: '+84901112233',
        initialRole: 'staff',
        role: 'staff',
        accountStatus: 'ACTIVE',
        passwordHash: null,
        authVersion: 1,
      });

      // Seed an active session for the user
      const sessionId = crypto.randomUUID();
      const token = tokenService.generateToken(32);
      const tokenHash = tokenService.hashToken(token);
      await sessionRepo.createSession({
        id: sessionId,
        userId: testUserId,
        tokenFamily: crypto.randomUUID(),
        accessTokenHash: tokenHash,
        refreshTokenHash: tokenService.hashToken(tokenService.generateToken(32)),
        authVersion: 1,
        sessionVersion: 1,
        accessExpiresAt: new Date(Date.now() + 3600_000),
        refreshExpiresAt: new Date(Date.now() + 86400_000),
        expiresAt: new Date(Date.now() + 86400_000),
      });

      const uniqueAuditAction = `TEST_ROLLBACK_${Date.now()}`;

      // Execute transaction that mutates user, revokes session, writes SUCCESS audit,
      // then deliberately throws BEFORE transaction completion
      let errorThrown = false;
      try {
        await unitOfWork.execute(async (tx) => {
          const txAuditService = new AuditService(tx.auditWriter);

          // 1. Mutate user
          await tx.userRepository.updateWithOcc(testUserId, 0, {
            role: 'admin',
            authVersion: 2,
          });

          // 2. Revoke session
          await tx.sessionRepository.revokeAllUserSessions(testUserId);

          // 3. Write SUCCESS audit within transaction
          await txAuditService.record({
            actorId: 'test-admin',
            actorRole: 'admin',
            actionType: uniqueAuditAction,
            resourceType: 'USER',
            resourceId: testUserId,
            outcome: 'SUCCESS',
            beforeState: { role: 'staff' },
            afterState: { role: 'admin' },
          });

          // 4. Deliberately fail before commit!
          throw new Error('DELIBERATE_TEST_ROLLBACK_FAILURE');
        });
      } catch (err: unknown) {
        errorThrown = true;
        expect((err as Error).message).toBe('DELIBERATE_TEST_ROLLBACK_FAILURE');

        // Record FAILURE audit outside the rolled-back transaction
        await auditService.record({
          actorId: 'test-admin',
          actorRole: 'admin',
          actionType: uniqueAuditAction,
          resourceType: 'USER',
          resourceId: testUserId,
          outcome: 'FAILURE',
          beforeState: { role: 'staff' },
          afterState: { error: 'Transaction rolled back deliberately' },
        });
      }

      expect(errorThrown).toBe(true);

      // Verify state in PostgreSQL after rollback:
      // 1. User state unchanged
      const checkUser = await userRepo.findById(testUserId);
      expect(checkUser).not.toBeNull();
      expect(checkUser!.version).toBe(0);
      expect(checkUser!.role).toBe('staff');
      expect(checkUser!.authVersion).toBe(1);

      // 2. Session unchanged (still active, not revoked)
      const checkSession = await sessionRepo.findSessionByAccessTokenHash(tokenHash);
      expect(checkSession).not.toBeNull();
      expect(checkSession!.revokedAt).toBeNull();

      // 3. SUCCESS audit row does NOT exist; only outer FAILURE audit row was persisted
      const client = await pool.connect();
      try {
        const auditRes = await client.query<{ outcome: string }>(
          `SELECT outcome FROM audit_events WHERE action_type = $1`,
          [uniqueAuditAction],
        );
        expect(auditRes.rows).toHaveLength(1);
        expect(auditRes.rows[0]?.outcome).toBe('FAILURE');
      } finally {
        client.release();
      }
    },
  );

  // =========================================================================
  // 2. W3-C05 & Section 19: Real PostgreSQL Auth / Freshness Verification
  // =========================================================================
  it.runIf(hasDatabase)(
    'proves server-authoritative freshness on every protected request in real PostgreSQL (W3-C05, Section 19)',
    async () => {
      const app = buildApp({
        pool,
        passwordHasher,
        tokenService,
      });
      await app.ready();

      try {
        // Setup admin user & session
        const adminPass = 'AdminSecret123!';
        const adminHash = await passwordHasher.hash(adminPass);
        const admin = await userRepo.create({
          id: crypto.randomUUID(),
          version: 0,
          email: `admin-pg-${Date.now()}@example.com`,
          initialRole: 'admin',
          role: 'admin',
          accountStatus: 'ACTIVE',
          passwordHash: adminHash,
          authVersion: 1,
        });

        const adminLoginRes = await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { identifier: admin.email, password: adminPass },
        });
        const adminToken = adminLoginRes.json().session.accessToken;

        // Setup test staff user & login
        const staffPass = 'StaffSecret123!';
        const staffHash = await passwordHasher.hash(staffPass);
        const staff = await userRepo.create({
          id: crypto.randomUUID(),
          version: 0,
          email: `staff-pg-${Date.now()}@example.com`,
          initialRole: 'staff',
          role: 'staff',
          accountStatus: 'ACTIVE',
          passwordHash: staffHash,
          authVersion: 1,
        });

        const staffLoginRes = await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { identifier: staff.email, password: staffPass },
        });
        const staffToken = staffLoginRes.json().session.accessToken;

        // Test 1: ACTIVE + fresh opaque access -> allowed on protected route (204 No Content)
        const activeAccessRes = await app.inject({
          method: 'POST',
          url: '/v1/auth/logout',
          headers: { authorization: `Bearer ${staffToken}` },
        });
        expect(activeAccessRes.statusCode).toBe(204);

        // Create a separate test session for the suspend test
        const testSessionRes = await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { identifier: staff.email, password: staffPass },
        });
        const testToken = testSessionRes.json().session.accessToken;

        // 2. SuspendAccount -> immediate deny on protected request (HTTP 403)
        const suspendRes = await app.inject({
          method: 'POST',
          url: `/v1/governance/users/${staff.id}/suspend`,
          headers: { authorization: `Bearer ${adminToken}` },
          payload: {
            userId: staff.id,
            expectedVersion: 0,
            reason: 'Security review',
          },
        });
        expect(suspendRes.statusCode).toBe(200);

        const deniedAfterSuspend = await app.inject({
          method: 'POST',
          url: '/v1/auth/logout',
          headers: { authorization: `Bearer ${testToken}` },
        });
        expect(deniedAfterSuspend.statusCode).toBe(403);
        expect(deniedAfterSuspend.json().error.code).toBe('FORBIDDEN');

        // Re-activate and create fresh session
        const activateRes = await app.inject({
          method: 'POST',
          url: `/v1/governance/users/${staff.id}/activate`,
          headers: { authorization: `Bearer ${adminToken}` },
          payload: {
            userId: staff.id,
            expectedVersion: 1,
            reason: 'Review passed',
          },
        });
        expect(activateRes.statusCode).toBe(200);

        const staffLogin2 = await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { identifier: staff.email, password: staffPass },
        });
        const staffToken2 = staffLogin2.json().session.accessToken;

        // 3. DisableAccount -> immediate deny on protected request (HTTP 403)
        const disableRes = await app.inject({
          method: 'POST',
          url: `/v1/governance/users/${staff.id}/disable`,
          headers: { authorization: `Bearer ${adminToken}` },
          payload: {
            userId: staff.id,
            expectedVersion: 2,
            reason: 'Account offboarded',
          },
        });
        expect(disableRes.statusCode).toBe(200);

        const deniedAfterDisable = await app.inject({
          method: 'POST',
          url: '/v1/auth/logout',
          headers: { authorization: `Bearer ${staffToken2}` },
        });
        expect(deniedAfterDisable.statusCode).toBe(403);
        expect(deniedAfterDisable.json().error.code).toBe('FORBIDDEN');

        // 4. AssignRole -> stale authorization denied (HTTP 401)
        // Setup another user for role test
        const roleUser = await userRepo.create({
          id: crypto.randomUUID(),
          version: 0,
          email: `role-user-${Date.now()}@example.com`,
          initialRole: 'staff',
          role: 'staff',
          accountStatus: 'ACTIVE',
          passwordHash: staffHash,
          authVersion: 1,
        });
        const roleLogin = await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { identifier: roleUser.email, password: staffPass },
        });
        const roleUserToken = roleLogin.json().session.accessToken;

        // Change role -> authVersion advances in DB and sessions are revoked
        const assignRoleRes = await app.inject({
          method: 'POST',
          url: `/v1/governance/users/${roleUser.id}/role`,
          headers: { authorization: `Bearer ${adminToken}` },
          payload: {
            userId: roleUser.id,
            newRole: 'manager',
            expectedVersion: 0,
            reason: 'Promoted to manager',
          },
        });
        expect(assignRoleRes.statusCode).toBe(200);

        // Prior token must now be rejected immediately as stale
        const staleAttempt = await app.inject({
          method: 'POST',
          url: '/v1/auth/logout',
          headers: { authorization: `Bearer ${roleUserToken}` },
        });
        expect(staleAttempt.statusCode).toBe(401);
        expect(staleAttempt.json().error.code).toBe('UNAUTHENTICATED');

        // 5. Revoked session -> denied (HTTP 401)
        const freshUser = await userRepo.create({
          id: crypto.randomUUID(),
          version: 0,
          email: `revoked-${Date.now()}@example.com`,
          initialRole: 'staff',
          role: 'staff',
          accountStatus: 'ACTIVE',
          passwordHash: staffHash,
          authVersion: 1,
        });
        const freshLogin = await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { identifier: freshUser.email, password: staffPass },
        });
        const freshToken = freshLogin.json().session.accessToken;

        // Directly revoke session in PostgreSQL
        const sessionInDb = await sessionRepo.findSessionByAccessTokenHash(tokenService.hashToken(freshToken));
        await sessionRepo.revokeSession(sessionInDb!.id);

        const deniedRevoked = await app.inject({
          method: 'POST',
          url: '/v1/auth/logout',
          headers: { authorization: `Bearer ${freshToken}` },
        });
        expect(deniedRevoked.statusCode).toBe(401);

        // 6. Expired access token -> denied (HTTP 401)
        const expireUser = await userRepo.create({
          id: crypto.randomUUID(),
          version: 0,
          email: `expired-${Date.now()}@example.com`,
          initialRole: 'staff',
          role: 'staff',
          accountStatus: 'ACTIVE',
          passwordHash: staffHash,
          authVersion: 1,
        });
        const expireLogin = await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { identifier: expireUser.email, password: staffPass },
        });
        const expireToken = expireLogin.json().session.accessToken;

        // Mutate accessExpiresAt in PostgreSQL to the past
        const client = await pool.connect();
        try {
          await client.query(
            `UPDATE sessions SET access_expires_at = now() - interval '10 seconds' WHERE access_token_hash = $1`,
            [tokenService.hashToken(expireToken)],
          );
        } finally {
          client.release();
        }

        const deniedExpired = await app.inject({
          method: 'POST',
          url: '/v1/auth/logout',
          headers: { authorization: `Bearer ${expireToken}` },
        });
        expect(deniedExpired.statusCode).toBe(401);
      } finally {
        await app.close();
      }
    },
  );

  // =========================================================================
  // 3. W3-C05 & Section 20: Real PostgreSQL Refresh Rotation & Reuse Detection
  // =========================================================================
  it.runIf(hasDatabase)(
    'proves refresh rotation, spent token detection, and token family isolation in real PostgreSQL (W3-C05, Section 20)',
    async () => {
      const app = buildApp({
        pool,
        passwordHasher,
        tokenService,
      });
      await app.ready();

      try {
        const password = 'TestPassword123!';
        const passwordHash = await passwordHasher.hash(password);
        const user = await userRepo.create({
          id: crypto.randomUUID(),
          version: 0,
          email: `refresh-pg-${Date.now()}@example.com`,
          initialRole: 'staff',
          role: 'staff',
          accountStatus: 'ACTIVE',
          passwordHash,
          authVersion: 1,
        });

        // 1. Session 1 (e.g. mobile device)
        const login1 = await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { identifier: user.email, password },
        });
        const s1RefreshToken1 = login1.json().session.refreshToken;

        // 2. Session 2 (e.g. laptop - unrelated token family)
        const login2 = await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { identifier: user.email, password },
        });
        const s2AccessToken = login2.json().session.accessToken;

        // 3. Valid refresh rotates credentials
        const refresh1 = await app.inject({
          method: 'POST',
          url: '/v1/auth/refresh',
          payload: { refreshToken: s1RefreshToken1 },
        });
        expect(refresh1.statusCode).toBe(200);
        const s1RefreshToken2 = refresh1.json().session.refreshToken;
        expect(s1RefreshToken2).not.toBe(s1RefreshToken1);

        // Old refresh token is recorded in spent_refresh_tokens in PostgreSQL
        const oldHash = tokenService.hashToken(s1RefreshToken1);
        const spentRecord = await sessionRepo.findSpentRefreshTokenByHash(oldHash);
        expect(spentRecord).not.toBeNull();

        // 4. Replay attack: attempt to use the spent refresh token again
        const reuseAttempt = await app.inject({
          method: 'POST',
          url: '/v1/auth/refresh',
          payload: { refreshToken: s1RefreshToken1 },
        });
        expect(reuseAttempt.statusCode).toBe(401);
        expect(reuseAttempt.json().error.message).toContain('reuse detected');

        // Affected token family / session is revoked in PostgreSQL
        const s1RotatedSession = await sessionRepo.findSessionByAccessTokenHash(
          tokenService.hashToken(refresh1.json().session.accessToken),
        );
        expect(s1RotatedSession?.revokedAt).not.toBeNull();

        // 5. Unrelated Session 2 for the same user remains completely valid in PostgreSQL
        const s2Session = await sessionRepo.findSessionByAccessTokenHash(tokenService.hashToken(s2AccessToken));
        expect(s2Session?.revokedAt).toBeNull();
      } finally {
        await app.close();
      }
    },
  );

  // =========================================================================
  // 4. W3-C05 & Section 21: Real PostgreSQL OCC & Audit Immutability
  // =========================================================================
  it.runIf(hasDatabase)(
    'proves OCC conflict handling, transactional consistency, and audit immutability in real PostgreSQL (W3-C05, Section 21)',
    async () => {
      const app = buildApp({
        pool,
        passwordHasher,
        tokenService,
      });
      await app.ready();

      try {
        // Create admin
        const adminPass = 'AdminSecret123!';
        const adminHash = await passwordHasher.hash(adminPass);
        const admin = await userRepo.create({
          id: crypto.randomUUID(),
          version: 0,
          email: `occ-admin-${Date.now()}@example.com`,
          initialRole: 'admin',
          role: 'admin',
          accountStatus: 'ACTIVE',
          passwordHash: adminHash,
          authVersion: 1,
        });

        const adminLogin = await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { identifier: admin.email, password: adminPass },
        });
        const adminToken = adminLogin.json().session.accessToken;

        // Create target user
        const target = await userRepo.create({
          id: crypto.randomUUID(),
          version: 0,
          email: `occ-target-${Date.now()}@example.com`,
          initialRole: 'staff',
          role: 'staff',
          accountStatus: 'ACTIVE',
          passwordHash: null,
          authVersion: 1,
        });

        // Stale expectedVersion returns 409 CONFLICT with STALE_VERSION details
        const staleRes = await app.inject({
          method: 'POST',
          url: `/v1/governance/users/${target.id}/role`,
          headers: { authorization: `Bearer ${adminToken}` },
          payload: {
            userId: target.id,
            newRole: 'manager',
            expectedVersion: 999, // Stale!
            reason: 'Should fail',
          },
        });
        expect(staleRes.statusCode).toBe(409);
        const staleBody = staleRes.json();
        expect(staleBody.error.code).toBe('CONFLICT');
        expect(staleBody.error.requestId).toBeTypeOf('string');

        // Verify target user state in PostgreSQL was NOT partially changed
        const unchangedUser = await userRepo.findById(target.id);
        expect(unchangedUser?.version).toBe(0);
        expect(unchangedUser?.role).toBe('staff');

        // Verify FAILURE audit row was written and did NOT claim SUCCESS
        const client = await pool.connect();
        try {
          const auditRes = await client.query<{ outcome: string }>(
            `SELECT outcome FROM audit_events WHERE resource_id = $1 AND action_type = 'GV-02:AssignRole'`,
            [target.id],
          );
          expect(auditRes.rows).toHaveLength(1);
          expect(auditRes.rows[0]?.outcome).toBe('FAILURE');

          // Immutability: runtime cannot UPDATE, DELETE, or TRUNCATE audit_events
          await expect(
            client.query(`UPDATE audit_events SET outcome = 'TAMPERED' WHERE resource_id = $1`, [target.id]),
          ).rejects.toThrow();

          await expect(client.query(`DELETE FROM audit_events WHERE resource_id = $1`, [target.id])).rejects.toThrow();

          await expect(client.query(`TRUNCATE TABLE audit_events`)).rejects.toThrow();
        } finally {
          client.release();
        }
      } finally {
        await app.close();
      }
    },
  );

  // =========================================================================
  // 5. W3-C06 & Section 25: Wave 2 -> Wave 3 Migration Upgrade Safety Test
  // =========================================================================
  it.runIf(hasDatabase)(
    'proves safe upgrade from Wave 2 schema with seeded legacy users and sessions (W3-C06, Section 25)',
    async () => {
      // Connect using migration URL (admin privileges to manage schema)
      const adminPool = new Pool({ connectionString: migrationUrl });
      const client = await adminPool.connect();

      const testSchema = `test_upgrade_${Date.now()}`;
      try {
        // 1. Create temporary schema and isolate search path
        await client.query(`CREATE SCHEMA "${testSchema}"`);
        await client.query(`SET search_path TO "${testSchema}", public`);

        // 2. Apply Wave 2 schema (0000_simple_epoch.sql)
        const migrationDir = path.resolve(__dirname, '../../apps/api/src/infrastructure/persistence/migrations');
        const wave2Sql = fs.readFileSync(path.join(migrationDir, '0000_simple_epoch.sql'), 'utf-8');
        const wave2Statements = wave2Sql.split('--> statement-breakpoint');
        for (const stmt of wave2Statements) {
          const trimmed = stmt.trim();
          if (trimmed) {
            await client.query(trimmed);
          }
        }

        // 3. Seed Wave 2 users (staff, manager, admin) and legacy session
        await client.query(`
          INSERT INTO users (id, version, email, initial_role, account_status)
          VALUES
            ('u-staff', 0, 'staff@upgrade.test', 'staff', 'ACTIVE'),
            ('u-manager', 0, 'manager@upgrade.test', 'manager', 'ACTIVE'),
            ('u-admin', 0, 'admin@upgrade.test', 'admin', 'ACTIVE');
        `);

        await client.query(`
          INSERT INTO sessions (id, user_id, expires_at)
          VALUES ('s-legacy-1', 'u-staff', now() + interval '1 day');
        `);

        // 4. Apply corrected Wave 3 migration (0001_iam_security_foundation.sql)
        const wave3Sql = fs.readFileSync(path.join(migrationDir, '0001_iam_security_foundation.sql'), 'utf-8');
        const wave3Statements = wave3Sql.split('--> statement-breakpoint');
        for (const stmt of wave3Statements) {
          const trimmed = stmt.trim();
          if (trimmed) {
            await client.query(trimmed);
          }
        }

        // 5. Verify users preserve initial_role (Section 23)
        const userRoles = await client.query<{ id: string; initial_role: string; role: string }>(
          `SELECT id, initial_role, role FROM users ORDER BY id`,
        );
        expect(userRoles.rows).toEqual([
          { id: 'u-admin', initial_role: 'admin', role: 'admin' },
          { id: 'u-manager', initial_role: 'manager', role: 'manager' },
          { id: 'u-staff', initial_role: 'staff', role: 'staff' },
        ]);

        // 6. Verify legacy sessions are safely migrated and marked revoked (Section 24)
        const sessionRows = await client.query<{
          id: string;
          revoked_at: Date | null;
          token_family: string;
          access_token_hash: string;
        }>(`SELECT id, revoked_at, token_family, access_token_hash FROM sessions WHERE id = 's-legacy-1'`);
        expect(sessionRows.rows).toHaveLength(1);
        const legacySession = sessionRows.rows[0]!;
        expect(legacySession.revoked_at).not.toBeNull();
        expect(legacySession.token_family).toBe('legacy_revoked_s-legacy-1');
        expect(legacySession.access_token_hash).toBe('legacy_revoked_hash_s-legacy-1');

        // 7. Verify new constraints hold (e.g. inserting into spent_refresh_tokens)
        await client.query(`
          INSERT INTO spent_refresh_tokens (id, session_id, token_family, refresh_token_hash, expires_at)
          VALUES ('spent-1', 's-legacy-1', 'legacy_revoked_s-legacy-1', 'hash-1', now() + interval '1 day');
        `);
      } finally {
        await client.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE`);
        client.release();
        await adminPool.end();
      }
    },
  );
});
