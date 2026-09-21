import crypto from 'node:crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../../apps/api/src/app';
import { Argon2PasswordHasher } from '../../apps/api/src/infrastructure/security/argon2-password-hasher';
import { CryptoTokenService } from '../../apps/api/src/infrastructure/security/crypto-token-service';
import { createAuthGate, requireRoles } from '../../apps/api/src/infrastructure/http/middleware/auth-gate';
import { InMemoryUserRepository, InMemorySessionRepository, InMemoryAuditWriter } from './test-doubles';

describe('Phase 13 Wave 3: Tier-2 Security Gate & Freshness Verification', () => {
  let userRepo: InMemoryUserRepository;
  let sessionRepo: InMemorySessionRepository;
  let tokenService: CryptoTokenService;
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    sessionRepo = new InMemorySessionRepository();
    tokenService = new CryptoTokenService();
    const auditWriter = new InMemoryAuditWriter();
    const hasher = new Argon2PasswordHasher({ memoryCost: 4096, timeCost: 1, parallelism: 1 });

    app = buildApp({
      userRepository: userRepo,
      sessionRepository: sessionRepo,
      auditWriter,
      passwordHasher: hasher,
      tokenService,
    });

    // Register test endpoints using the real Tier-2 gate
    const authenticate = createAuthGate(userRepo, sessionRepo, tokenService);

    app.get('/test/protected', { preHandler: [authenticate] }, async (req, reply) => {
      return reply.send({ ok: true, actor: req.actor });
    });

    app.get('/test/admin-only', { preHandler: [authenticate, requireRoles('admin')] }, async (req, reply) => {
      return reply.send({ ok: true, actor: req.actor });
    });

    app.get(
      '/test/staff-or-manager',
      { preHandler: [authenticate, requireRoles('staff', 'manager')] },
      async (req, reply) => {
        return reply.send({ ok: true, actor: req.actor });
      },
    );

    await app.ready();
  });

  async function createActiveUserAndSession(role: 'staff' | 'manager' | 'admin' = 'staff', authVersion = 1) {
    const user = await userRepo.create({
      id: crypto.randomUUID(),
      version: 0,
      email: `${role}-${crypto.randomUUID().slice(0, 6)}@example.com`,
      initialRole: role,
      role,
      accountStatus: 'ACTIVE',
      passwordHash: 'hash',
      authVersion,
    });

    const accessToken = tokenService.generateToken(32);
    const refreshToken = tokenService.generateToken(32);

    const session = await sessionRepo.createSession({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenFamily: crypto.randomUUID(),
      accessTokenHash: tokenService.hashToken(accessToken),
      refreshTokenHash: tokenService.hashToken(refreshToken),
      authVersion,
      sessionVersion: 1,
      accessExpiresAt: new Date(Date.now() + 900_000), // +15 min
      refreshExpiresAt: new Date(Date.now() + 86_400_000),
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    return { user, session, accessToken, refreshToken };
  }

  it('proves missing or malformed Authorization header is rejected (401)', async () => {
    const resNoHeader = await app.inject({ method: 'GET', url: '/test/protected' });
    expect(resNoHeader.statusCode).toBe(401);

    const resMalformed = await app.inject({
      method: 'GET',
      url: '/test/protected',
      headers: { authorization: 'Basic 12345' },
    });
    expect(resMalformed.statusCode).toBe(401);
  });

  it('proves unknown or expired bearer token is rejected (401)', async () => {
    const resUnknown = await app.inject({
      method: 'GET',
      url: '/test/protected',
      headers: { authorization: 'Bearer unknown-opaque-token-123456' },
    });
    expect(resUnknown.statusCode).toBe(401);

    // Expired token
    const { user } = await createActiveUserAndSession('staff');
    const expiredToken = tokenService.generateToken(32);
    await sessionRepo.createSession({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenFamily: crypto.randomUUID(),
      accessTokenHash: tokenService.hashToken(expiredToken),
      refreshTokenHash: tokenService.hashToken(tokenService.generateToken(32)),
      authVersion: 1,
      sessionVersion: 1,
      accessExpiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      refreshExpiresAt: new Date(Date.now() + 86_400_000),
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    const resExpired = await app.inject({
      method: 'GET',
      url: '/test/protected',
      headers: { authorization: `Bearer ${expiredToken}` },
    });
    expect(resExpired.statusCode).toBe(401);
    expect(resExpired.json().error.message).toContain('expired');
  });

  it('proves revoked session is rejected (401)', async () => {
    const { session, accessToken } = await createActiveUserAndSession('staff');
    await sessionRepo.revokeSession(session.id);

    const res = await app.inject({
      method: 'GET',
      url: '/test/protected',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.message).toContain('revoked');
  });

  it('proves SUSPENDED account cannot authorize protected request (P13W3-N05, P13W3-P11, P13W3-P13)', async () => {
    const { user, accessToken } = await createActiveUserAndSession('staff');

    // Verify authorized initially
    const res1 = await app.inject({
      method: 'GET',
      url: '/test/protected',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res1.statusCode).toBe(200);

    // Suspend account
    await userRepo.updateWithOcc(user.id, user.version, { accountStatus: 'SUSPENDED' });

    // Same previously issued access token MUST fail immediately
    const res2 = await app.inject({
      method: 'GET',
      url: '/test/protected',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res2.statusCode).toBe(403);
    expect(res2.json().error.message).toContain('suspended');
  });

  it('proves DISABLED account cannot authorize protected request (P13W3-N06, P13W3-P11, P13W3-P14)', async () => {
    const { user, accessToken } = await createActiveUserAndSession('staff');

    // Disable account
    await userRepo.updateWithOcc(user.id, user.version, { accountStatus: 'DISABLED' });

    const res = await app.inject({
      method: 'GET',
      url: '/test/protected',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.message).toContain('disabled');
  });

  it('proves effective role change leaves stale prior authorization denied (P13W3-N07, P13W3-P12, P13W3-P15)', async () => {
    const { user, accessToken } = await createActiveUserAndSession('staff', 1);

    // Initial request works
    const resBefore = await app.inject({
      method: 'GET',
      url: '/test/protected',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(resBefore.statusCode).toBe(200);

    // Admin promotes user to manager, advancing authVersion from 1 to 2
    await userRepo.updateWithOcc(user.id, user.version, {
      role: 'manager',
      authVersion: 2,
    });

    // Old token with session.authVersion = 1 is now STALE and MUST be rejected
    const resAfter = await app.inject({
      method: 'GET',
      url: '/test/protected',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(resAfter.statusCode).toBe(401);
    expect(resAfter.json().error.message).toContain('Authorization version mismatch');
  });

  it('proves Tier-2 role guard: admin allowed, staff/manager denied from admin routes', async () => {
    const admin = await createActiveUserAndSession('admin');
    const staff = await createActiveUserAndSession('staff');
    const manager = await createActiveUserAndSession('manager');

    // Admin allowed on admin-only route
    const resAdmin = await app.inject({
      method: 'GET',
      url: '/test/admin-only',
      headers: { authorization: `Bearer ${admin.accessToken}` },
    });
    expect(resAdmin.statusCode).toBe(200);

    // Staff denied on admin-only route (403)
    const resStaff = await app.inject({
      method: 'GET',
      url: '/test/admin-only',
      headers: { authorization: `Bearer ${staff.accessToken}` },
    });
    expect(resStaff.statusCode).toBe(403);

    // Manager denied on admin-only route (403)
    const resManager = await app.inject({
      method: 'GET',
      url: '/test/admin-only',
      headers: { authorization: `Bearer ${manager.accessToken}` },
    });
    expect(resManager.statusCode).toBe(403);
  });
});
