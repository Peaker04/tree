import crypto from 'node:crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../../apps/api/src/app';
import { Argon2PasswordHasher } from '../../apps/api/src/infrastructure/security/argon2-password-hasher';
import { CryptoTokenService } from '../../apps/api/src/infrastructure/security/crypto-token-service';
import { InMemoryUserRepository, InMemorySessionRepository, InMemoryAuditWriter } from './test-doubles';

describe('Phase 13 Wave 3: Auth Routes (Login, Refresh Rotation, Reuse Detection, Logout)', () => {
  let userRepo: InMemoryUserRepository;
  let sessionRepo: InMemorySessionRepository;
  let auditWriter: InMemoryAuditWriter;
  let hasher: Argon2PasswordHasher;
  let tokenService: CryptoTokenService;
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    sessionRepo = new InMemorySessionRepository();
    auditWriter = new InMemoryAuditWriter();
    hasher = new Argon2PasswordHasher({ memoryCost: 4096, timeCost: 1, parallelism: 1 });
    tokenService = new CryptoTokenService();

    app = buildApp({
      userRepository: userRepo,
      sessionRepository: sessionRepo,
      auditWriter,
      passwordHasher: hasher,
      tokenService,
    });
    await app.ready();
  });

  it('proves successful login returns session and opaque credentials (P13W3-P01, P13W3-P03, P13W3-P04)', async () => {
    const passwordHash = await hasher.hash('Secret123!');
    await userRepo.create({
      id: crypto.randomUUID(),
      version: 0,
      email: 'staff@example.com',
      phone: '+84901234567',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      passwordHash,
      authVersion: 1,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: {
        identifier: 'staff@example.com',
        password: 'Secret123!',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.session).toBeDefined();
    expect(body.session.accessToken).toBeTypeOf('string');
    expect(body.session.refreshToken).toBeTypeOf('string');
    expect(body.session.user.email).toBe('staff@example.com');
    expect(body.session.user.role).toBe('staff');

    // Verify session stored in repository with hashes, not plaintext (P13W3-P05)
    const storedSession = await sessionRepo.findSessionByAccessTokenHash(
      tokenService.hashToken(body.session.accessToken),
    );
    expect(storedSession).not.toBeNull();
    expect(storedSession?.accessTokenHash).toBe(tokenService.hashToken(body.session.accessToken));
    expect(storedSession?.refreshTokenHash).toBe(tokenService.hashToken(body.session.refreshToken));
  });

  it('proves login fails on invalid password and locks account after threshold (P13W3-P16)', async () => {
    const passwordHash = await hasher.hash('RealPassword123!');
    const user = await userRepo.create({
      id: crypto.randomUUID(),
      version: 0,
      email: 'lock-test@example.com',
      phone: '+84901234567',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      passwordHash,
      authVersion: 1,
    });

    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { identifier: 'lock-test@example.com', password: 'WrongPassword!' },
      });
      expect(res.statusCode).toBe(401);
    }

    const midUser = await userRepo.findById(user.id);
    expect(midUser?.failedLoginAttempts).toBe(4);
    expect(midUser?.lockedUntil).toBeNull();
    expect(midUser?.accountStatus).toBe('ACTIVE'); // Account status remains ACTIVE (P13W3-P16)

    // 5th failed attempt -> reaches threshold (default: 5)
    const fifthRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: 'lock-test@example.com', password: 'WrongPassword!' },
    });
    expect(fifthRes.statusCode).toBe(401);

    const lockedUser = await userRepo.findById(user.id);
    expect(lockedUser?.failedLoginAttempts).toBe(5);
    expect(lockedUser?.lockedUntil).not.toBeNull();
    expect(lockedUser?.accountStatus).toBe('ACTIVE'); // Still ACTIVE, NOT changed to SUSPENDED

    // Attempt with correct password while locked is rejected
    const lockedRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: 'lock-test@example.com', password: 'RealPassword123!' },
    });
    expect(lockedRes.statusCode).toBe(401);
  });

  it('proves login rejects non-ACTIVE accounts (INVITED, SUSPENDED, DISABLED)', async () => {
    const passwordHash = await hasher.hash('Password123!');
    for (const status of ['INVITED', 'SUSPENDED', 'DISABLED'] as const) {
      await userRepo.create({
        id: crypto.randomUUID(),
        version: 0,
        email: `${status.toLowerCase()}@example.com`,
        phone: '+84901234567',
        initialRole: 'staff',
        role: 'staff',
        accountStatus: status,
        passwordHash,
        authVersion: 1,
      });

      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { identifier: `${status.toLowerCase()}@example.com`, password: 'Password123!' },
      });
      expect(res.statusCode).toBe(403);
    }
  });

  it('proves rehash-on-successful-login upgrades obsolete hash parameters (P13W3-P02)', async () => {
    // Hash with very low cost (memory 2048)
    const weakHasher = new Argon2PasswordHasher({ memoryCost: 2048, timeCost: 1, parallelism: 1 });
    const weakHash = await weakHasher.hash('UpgradablePassword123!');

    const user = await userRepo.create({
      id: crypto.randomUUID(),
      version: 0,
      email: 'rehash@example.com',
      phone: '+84901234567',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      passwordHash: weakHash,
      authVersion: 1,
    });

    // App hasher uses 4096 memoryCost, so weakHash needs rehash
    expect(hasher.needsRehash(weakHash)).toBe(true);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: 'rehash@example.com', password: 'UpgradablePassword123!' },
    });
    expect(res.statusCode).toBe(200);

    const updatedUser = await userRepo.findById(user.id);
    expect(updatedUser?.passwordHash).not.toBe(weakHash);
    expect(hasher.needsRehash(updatedUser!.passwordHash!)).toBe(false);
  });

  it('proves refresh credential rotation works and returns new credentials (P13W3-P08, P13W3-N08)', async () => {
    const passwordHash = await hasher.hash('Pass123!');
    await userRepo.create({
      id: 'u-100',
      version: 0,
      email: 'refresh-test@example.com',
      phone: '+84901234567',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      passwordHash,
      authVersion: 1,
    });

    // 1. Initial login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: 'refresh-test@example.com', password: 'Pass123!' },
    });
    const loginBody = loginRes.json();
    const oldRefreshToken = loginBody.session.refreshToken;
    const oldAccessToken = loginBody.session.accessToken;

    // 2. Perform refresh
    const refreshRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken: oldRefreshToken },
    });
    expect(refreshRes.statusCode).toBe(200);
    const refreshBody = refreshRes.json();
    const newRefreshToken = refreshBody.session.refreshToken;
    const newAccessToken = refreshBody.session.accessToken;

    expect(newRefreshToken).not.toBe(oldRefreshToken);
    expect(newAccessToken).not.toBe(oldAccessToken);

    // Old refresh credential is no longer valid as current credential (P13W3-N08)
    const oldHash = tokenService.hashToken(oldRefreshToken);
    const session = await sessionRepo.findSessionByRefreshTokenHash(oldHash);
    expect(session).toBeNull(); // Replaced by new hash
  });

  it('proves refresh reuse detection revokes affected token family without revoking unrelated sessions (P13W3-P09, P13W3-P10, P13W3-N09)', async () => {
    const passwordHash = await hasher.hash('Pass123!');
    await userRepo.create({
      id: 'u-reuse',
      version: 0,
      email: 'reuse@example.com',
      phone: '+84901234567',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      passwordHash,
      authVersion: 1,
    });

    // Session 1 (e.g. mobile device)
    const login1 = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: 'reuse@example.com', password: 'Pass123!' },
    });
    const s1RefreshToken1 = login1.json().session.refreshToken;

    // Session 2 (unrelated session, e.g. laptop)
    const login2 = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: 'reuse@example.com', password: 'Pass123!' },
    });
    const s2AccessToken = login2.json().session.accessToken;

    // Rotate Session 1 legitimately
    const refresh1 = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken: s1RefreshToken1 },
    });
    expect(refresh1.statusCode).toBe(200);

    // Attacker tries to reuse the already-spent s1RefreshToken1
    const reuseAttempt = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken: s1RefreshToken1 },
    });
    expect(reuseAttempt.statusCode).toBe(401);
    expect(reuseAttempt.json().error.message).toContain('reuse detected');

    // Affected token family / session is revoked (P13W3-P10)
    const s1RotatedSession = await sessionRepo.findSessionByAccessTokenHash(
      tokenService.hashToken(refresh1.json().session.accessToken),
    );
    expect(s1RotatedSession?.revokedAt).not.toBeNull();

    // UNRELATED active session for same user is NOT automatically revoked (P13W3-N09)
    const s2Session = await sessionRepo.findSessionByAccessTokenHash(tokenService.hashToken(s2AccessToken));
    expect(s2Session?.revokedAt).toBeNull();
  });

  it('proves logout revokes session (P13W3-P10)', async () => {
    const passwordHash = await hasher.hash('Pass123!');
    await userRepo.create({
      id: 'u-logout',
      version: 0,
      email: 'logout@example.com',
      phone: '+84901234567',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      passwordHash,
      authVersion: 1,
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: 'logout@example.com', password: 'Pass123!' },
    });
    const { accessToken } = loginRes.json().session;

    const logoutRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/logout',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(logoutRes.statusCode).toBe(200);

    const session = await sessionRepo.findSessionByAccessTokenHash(tokenService.hashToken(accessToken));
    expect(session?.revokedAt).not.toBeNull();
  });
});
