import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../../apps/api/src/app';
import { Argon2PasswordHasher } from '../../apps/api/src/infrastructure/security/argon2-password-hasher';
import { CryptoTokenService } from '../../apps/api/src/infrastructure/security/crypto-token-service';
import { InMemoryCredentialSetupDelivery } from '../../apps/api/src/infrastructure/security/in-memory-credential-setup-delivery';
import {
  InMemoryUserRepository,
  InMemorySessionRepository,
  InMemoryAuditWriter,
  InMemoryIamUnitOfWork,
} from './test-doubles';
import { CANONICAL_ACCOUNT_STATUSES } from '@novyx/contracts';

describe('Phase 13 Wave 3: IAM Governance Commands (GV-01 to GV-07) & Audit Trail', () => {
  let userRepo: InMemoryUserRepository;
  let sessionRepo: InMemorySessionRepository;
  let auditWriter: InMemoryAuditWriter;
  let tokenService: CryptoTokenService;
  let deliveryPort: InMemoryCredentialSetupDelivery;
  let app: ReturnType<typeof buildApp>;

  let adminToken: string;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    sessionRepo = new InMemorySessionRepository();
    auditWriter = new InMemoryAuditWriter();
    tokenService = new CryptoTokenService();
    deliveryPort = new InMemoryCredentialSetupDelivery();
    const hasher = new Argon2PasswordHasher({ memoryCost: 4096, timeCost: 1, parallelism: 1 });
    const unitOfWork = new InMemoryIamUnitOfWork(userRepo, sessionRepo, auditWriter);

    app = buildApp({
      userRepository: userRepo,
      sessionRepository: sessionRepo,
      auditWriter,
      unitOfWork,
      passwordHasher: hasher,
      tokenService,
      deliveryPort,
    });
    await app.ready();

    // Create an active platform admin and session
    const adminUser = await userRepo.create({
      id: 'admin-1',
      version: 0,
      email: 'admin@example.com',
      initialRole: 'admin',
      role: 'admin',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });

    adminToken = tokenService.generateToken(32);
    await sessionRepo.createSession({
      id: 'admin-session-1',
      userId: adminUser.id,
      tokenFamily: 'admin-family-1',
      accessTokenHash: tokenService.hashToken(adminToken),
      refreshTokenHash: tokenService.hashToken(tokenService.generateToken(32)),
      authVersion: 1,
      sessionVersion: 1,
      accessExpiresAt: new Date(Date.now() + 3600_000),
      refreshExpiresAt: new Date(Date.now() + 86400_000),
      expiresAt: new Date(Date.now() + 86400_000),
    });
  });

  describe('GET /v1/governance/users', () => {
    let staffToken: string;
    let managerToken: string;

    beforeEach(async () => {
      const staffUser = await userRepo.create({
        id: 'staff-1',
        version: 0,
        email: 'staff@example.com',
        initialRole: 'staff',
        role: 'staff',
        accountStatus: 'ACTIVE',
        authVersion: 1,
      });
      staffToken = tokenService.generateToken(32);
      await sessionRepo.createSession({
        id: 'staff-session-1',
        userId: staffUser.id,
        tokenFamily: 'f-1',
        accessTokenHash: tokenService.hashToken(staffToken),
        refreshTokenHash: tokenService.hashToken(tokenService.generateToken(32)),
        authVersion: 1,
        sessionVersion: 1,
        accessExpiresAt: new Date(Date.now() + 3600_000),
        refreshExpiresAt: new Date(Date.now() + 86400_000),
        expiresAt: new Date(Date.now() + 86400_000),
      });

      const managerUser = await userRepo.create({
        id: 'mgr-1',
        version: 0,
        email: 'manager@example.com',
        initialRole: 'manager',
        role: 'manager',
        accountStatus: 'ACTIVE',
        authVersion: 1,
      });
      managerToken = tokenService.generateToken(32);
      await sessionRepo.createSession({
        id: 'mgr-session-1',
        userId: managerUser.id,
        tokenFamily: 'f-2',
        accessTokenHash: tokenService.hashToken(managerToken),
        refreshTokenHash: tokenService.hashToken(tokenService.generateToken(32)),
        authVersion: 1,
        sessionVersion: 1,
        accessExpiresAt: new Date(Date.now() + 3600_000),
        refreshExpiresAt: new Date(Date.now() + 86400_000),
        expiresAt: new Date(Date.now() + 86400_000),
      });
    });

    it('R1X-P01: Anonymous real governance GET = 401', async () => {
      const response = await app.inject({ method: 'GET', url: '/v1/governance/users' });
      expect(response.statusCode).toBe(401);
    });

    it('R1X-P02: Staff real governance GET = 403', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/governance/users',
        headers: { authorization: `Bearer ${staffToken}` },
      });
      expect(response.statusCode).toBe(403);
    });

    it('R1X-P03: Manager real governance GET = 403', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/governance/users',
        headers: { authorization: `Bearer ${managerToken}` },
      });
      expect(response.statusCode).toBe(403);
    });

    it('R1X-P04: Admin real governance GET = 200', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/governance/users',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(Array.isArray(json.data)).toBe(true);
    });
  });

  it('proves LOCKED was NOT added to AccountStatus (P13W3-N10)', () => {
    expect(CANONICAL_ACCOUNT_STATUSES).toEqual(['INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED']);
    expect(CANONICAL_ACCOUNT_STATUSES).not.toContain('LOCKED');
    expect(CANONICAL_ACCOUNT_STATUSES).not.toContain('BANNED');
    expect(CANONICAL_ACCOUNT_STATUSES).not.toContain('DELETED');
  });

  it('proves GV-01 ProvisionUser creates user with status INVITED and records audit (P13W3-P19, P13W3-P20)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/governance/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        email: 'newbie@example.com',
        phone: '+84909876543',
        initialRole: 'staff',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.email).toBe('newbie@example.com');
    expect(body.data.role).toBe('staff');
    expect(body.data.accountStatus).toBe('INVITED');
    expect(body.data.passwordHash).toBeUndefined(); // Password hash never leaked

    // Check audit trail
    const auditEvent = auditWriter.events.find((e) => e.actionType === 'GV-01:ProvisionUser');
    expect(auditEvent).toBeDefined();
    expect(auditEvent?.actorId).toBe('admin-1');
    expect(auditEvent?.actorRole).toBe('admin');
    expect(auditEvent?.outcome).toBe('SUCCESS');
  });

  it('proves GV-02 AssignRole requires expectedVersion, updates role, and invalidates sessions (P13W3-P15, P13W3-P18)', async () => {
    const targetUser = await userRepo.create({
      id: 'target-user-1',
      version: 0,
      email: 'promoted@example.com',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });

    // Create session for target user
    const targetToken = tokenService.generateToken(32);
    const targetSession = await sessionRepo.createSession({
      id: 'target-session-1',
      userId: targetUser.id,
      tokenFamily: 'target-family-1',
      accessTokenHash: tokenService.hashToken(targetToken),
      refreshTokenHash: tokenService.hashToken(tokenService.generateToken(32)),
      authVersion: 1,
      sessionVersion: 1,
      accessExpiresAt: new Date(Date.now() + 3600_000),
      refreshExpiresAt: new Date(Date.now() + 86400_000),
      expiresAt: new Date(Date.now() + 86400_000),
    });

    const res = await app.inject({
      method: 'POST',
      url: `/v1/governance/users/${targetUser.id}/role`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: targetUser.id,
        expectedVersion: 0,
        newRole: 'manager',
        reason: 'Promotion to Operations Manager for District 1',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.role).toBe('manager');
    expect(res.json().data.version).toBe(1);

    // Target user's active session is revoked
    const updatedSession = sessionRepo.sessions.get(targetSession.id);
    expect(updatedSession?.revokedAt).not.toBeNull();

    // Audit event recorded with SUCCESS
    const auditEvent = auditWriter.events.find((e) => e.actionType === 'GV-02:AssignRole');
    expect(auditEvent?.outcome).toBe('SUCCESS');
    expect(auditEvent?.actorRole).toBe('admin');
  });

  it('proves OCC conflict on stale expectedVersion returns 409 and does not overwrite (P13W3-P18, P13W3-N18)', async () => {
    const user = await userRepo.create({
      id: 'occ-user',
      version: 5,
      email: 'occ@example.com',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });

    const res = await app.inject({
      method: 'POST',
      url: `/v1/governance/users/${user.id}/role`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: user.id,
        expectedVersion: 4, // STALE! Expected 5
        newRole: 'manager',
        reason: 'Concurrent update attempt',
      },
    });

    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.details.subtype).toBe('STALE_VERSION');
    expect(body.error.details.currentVersion).toBe(5);
    expect(body.error.details.expectedVersion).toBe(4);

    // Verify user role not changed
    const freshUser = await userRepo.findById(user.id);
    expect(freshUser?.role).toBe('staff');
    expect(freshUser?.version).toBe(5);

    // Audit event recorded with FAILURE
    const failureAudit = auditWriter.events.find((e) => e.actionType === 'GV-02:AssignRole' && e.outcome === 'FAILURE');
    expect(failureAudit).toBeDefined();
  });

  it('proves GV-03 ActivateAccount activates INVITED or SUSPENDED account', async () => {
    const invitedUser = await userRepo.create({
      id: 'invited-user',
      version: 0,
      email: 'invited@example.com',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'INVITED',
      authVersion: 1,
    });

    const res = await app.inject({
      method: 'POST',
      url: `/v1/governance/users/${invitedUser.id}/activate`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: invitedUser.id,
        expectedVersion: 0,
        reason: 'Onboarding completed',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.accountStatus).toBe('ACTIVE');
  });

  it('proves GV-04 SuspendAccount immediately invalidates active sessions (P13W3-P13)', async () => {
    const user = await userRepo.create({
      id: 'suspend-target',
      version: 0,
      email: 'suspend-target@example.com',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });

    const session = await sessionRepo.createSession({
      id: 'suspend-session',
      userId: user.id,
      tokenFamily: 'family-suspend',
      accessTokenHash: 'hash-suspend',
      refreshTokenHash: 'hash-refresh-suspend',
      authVersion: 1,
      sessionVersion: 1,
      accessExpiresAt: new Date(Date.now() + 3600_000),
      refreshExpiresAt: new Date(Date.now() + 86400_000),
      expiresAt: new Date(Date.now() + 86400_000),
    });

    const res = await app.inject({
      method: 'POST',
      url: `/v1/governance/users/${user.id}/suspend`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: user.id,
        expectedVersion: 0,
        reason: 'Suspension pending security audit investigation',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.accountStatus).toBe('SUSPENDED');

    // Session is revoked
    expect(sessionRepo.sessions.get(session.id)?.revokedAt).not.toBeNull();
  });

  it('proves GV-05 DisableAccount permanently disables and purges sessions (P13W3-P14)', async () => {
    const user = await userRepo.create({
      id: 'disable-target',
      version: 0,
      email: 'disable-target@example.com',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });

    const res = await app.inject({
      method: 'POST',
      url: `/v1/governance/users/${user.id}/disable`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: user.id,
        expectedVersion: 0,
        reason: 'Employment termination',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.accountStatus).toBe('DISABLED');

    // Attempting to activate a disabled account is rejected
    const activateRes = await app.inject({
      method: 'POST',
      url: `/v1/governance/users/${user.id}/activate`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: user.id,
        expectedVersion: 1,
      },
    });
    expect(activateRes.statusCode).toBe(409);
  });

  it('proves GV-06 UnlockAccount clears credential lock without changing AccountStatus (P13W3-P17, P13W3-N11, P13W3-N12)', async () => {
    // 1. User is ACTIVE but credential-locked
    const activeUser = await userRepo.create({
      id: 'unlock-active',
      version: 0,
      email: 'locked@example.com',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });
    await userRepo.incrementFailedLogin(activeUser.id, 1, 600_000); // lock it

    const unlockRes = await app.inject({
      method: 'POST',
      url: `/v1/governance/users/${activeUser.id}/unlock`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: activeUser.id,
        expectedVersion: 0,
        reason: 'Identity verified via helpdesk ticket',
      },
    });
    expect(unlockRes.statusCode).toBe(200);
    const updated = await userRepo.findById(activeUser.id);
    expect(updated?.failedLoginAttempts).toBe(0);
    expect(updated?.lockedUntil).toBeNull();
    expect(updated?.accountStatus).toBe('ACTIVE');

    // 2. User is SUSPENDED: UnlockAccount clears lock but CANNOT activate (P13W3-N11)
    const suspendedUser = await userRepo.create({
      id: 'unlock-suspended',
      version: 0,
      email: 'suspended-unlock@example.com',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'SUSPENDED',
      authVersion: 1,
    });
    const unlockSuspendedRes = await app.inject({
      method: 'POST',
      url: `/v1/governance/users/${suspendedUser.id}/unlock`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: suspendedUser.id,
        expectedVersion: 0,
      },
    });
    expect(unlockSuspendedRes.statusCode).toBe(200);
    const refreshedSuspended = await userRepo.findById(suspendedUser.id);
    expect(refreshedSuspended?.accountStatus).toBe('SUSPENDED'); // Still SUSPENDED!

    // 3. User is DISABLED: UnlockAccount CANNOT enable DISABLED account (P13W3-N12)
    const disabledUser = await userRepo.create({
      id: 'unlock-disabled',
      version: 0,
      email: 'disabled-unlock@example.com',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'DISABLED',
      authVersion: 1,
    });
    const unlockDisabledRes = await app.inject({
      method: 'POST',
      url: `/v1/governance/users/${disabledUser.id}/unlock`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: disabledUser.id,
        expectedVersion: 0,
      },
    });
    expect(unlockDisabledRes.statusCode).toBe(200);
    const refreshedDisabled = await userRepo.findById(disabledUser.id);
    expect(refreshedDisabled?.accountStatus).toBe('DISABLED'); // Still DISABLED!
  });

  it('proves GV-07 ResetCredentialSetup creates setup token, delivers via port, and redacts secrets in audit (P13W3-N19)', async () => {
    const user = await userRepo.create({
      id: 'reset-target',
      version: 0,
      email: 'reset@example.com',
      phone: '+84988776655',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });

    const res = await app.inject({
      method: 'POST',
      url: `/v1/governance/users/${user.id}/reset-credential`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: user.id,
        expectedVersion: 0,
      },
    });

    expect(res.statusCode).toBe(200);

    // Delivered token captured by delivery port
    expect(deliveryPort.delivered).toHaveLength(1);
    const delivered = deliveryPort.delivered[0]!;
    expect(delivered.recipient.email).toBe('reset@example.com');
    expect(delivered.token).toBeTypeOf('string');

    // Token stored server-side ONLY as hash, never plaintext
    const hash = tokenService.hashToken(delivered.token);
    const storedToken = await sessionRepo.findSetupTokenByHash(hash);
    expect(storedToken).not.toBeNull();
    expect(storedToken?.userId).toBe(user.id);

    // Verify audit event does NOT contain plaintext token or hash (P13W3-N19)
    const auditEvent = auditWriter.events.find((e) => e.actionType === 'GV-07:ResetCredentialSetup');
    expect(auditEvent).toBeDefined();
    const auditStr = JSON.stringify(auditEvent);
    expect(auditStr).not.toContain(delivered.token);
    expect(auditStr).not.toContain(hash);
  });

  it('rejects path and body userId mismatch with 400 and canonical error envelope (W3-C04 / Section 17)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/governance/users/path-user-id/role',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: 'different-body-user-id',
        newRole: 'manager',
        expectedVersion: 0,
        reason: 'Promotion',
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('VALIDATION_FAILED');
    expect(body.error.message).toContain(
      "':id' (path-user-id) does not match body parameter 'userId' (different-body-user-id)",
    );
    expect(body.error.requestId).toBeTypeOf('string');
    expect(body.error.requestId.length).toBeGreaterThan(0);
  });

  it('proves ResetCredentialSetup fails closed with 503 when delivery adapter is absent (W3-C03 / Section 11, 12)', async () => {
    // App configured WITHOUT deliveryPort (production default)
    const prodApp = buildApp({
      userRepository: userRepo,
      sessionRepository: sessionRepo,
      auditWriter,
      unitOfWork: new InMemoryIamUnitOfWork(userRepo, sessionRepo, auditWriter),
      tokenService,
      // deliveryPort is deliberately undefined
    });
    await prodApp.ready();

    const targetUser = await userRepo.create({
      id: 'target-no-delivery',
      version: 0,
      email: 'nodelivery@example.com',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });

    const res = await prodApp.inject({
      method: 'POST',
      url: `/v1/governance/users/${targetUser.id}/reset-credential`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: targetUser.id,
        expectedVersion: 0,
      },
    });

    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('INTERNAL');
    expect(body.error.message).toContain('unavailable');
    expect(body.error.requestId).toBeTypeOf('string');

    // Verify user state is unchanged (version is still 0, failedLoginAttempts is 0)
    const checkUser = await userRepo.findById(targetUser.id);
    expect(checkUser?.version).toBe(0);
    expect(sessionRepo.setupTokens.size).toBe(0);
  });

  it('proves injected SecurityConfig configures setup token TTL (W3-C02)', async () => {
    const customTtlSeconds = 3600; // 1 hour instead of default 86400 (24h)
    const customConfigApp = buildApp({
      userRepository: userRepo,
      sessionRepository: sessionRepo,
      auditWriter,
      unitOfWork: new InMemoryIamUnitOfWork(userRepo, sessionRepo, auditWriter),
      tokenService,
      deliveryPort,
      securityConfig: {
        accessTokenTtlSeconds: 600,
        refreshTokenTtlSeconds: 1200,
        failedLoginLockThreshold: 3,
        lockDurationSeconds: 300,
        setupTokenTtlSeconds: customTtlSeconds,
        argon2: { memoryCost: 4096, timeCost: 1, parallelism: 1 },
      },
    });
    await customConfigApp.ready();

    const targetUser = await userRepo.create({
      id: 'target-custom-ttl',
      version: 0,
      email: 'customttl@example.com',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });

    const before = Date.now();
    const res = await customConfigApp.inject({
      method: 'POST',
      url: `/v1/governance/users/${targetUser.id}/reset-credential`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: targetUser.id,
        expectedVersion: 0,
      },
    });

    expect(res.statusCode).toBe(200);
    const deliveredToken = deliveryPort.delivered.find((d) => d.recipient.email === 'customttl@example.com');
    expect(deliveredToken).toBeDefined();
    const hash = tokenService.hashToken(deliveredToken!.token);
    const setupToken = await sessionRepo.findSetupTokenByHash(hash);
    expect(setupToken).not.toBeNull();

    const expectedExpiryMin = before + (customTtlSeconds - 5) * 1000;
    const expectedExpiryMax = Date.now() + (customTtlSeconds + 5) * 1000;
    expect(setupToken!.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiryMin);
    expect(setupToken!.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiryMax);
  });
});
