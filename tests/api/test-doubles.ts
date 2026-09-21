import crypto from 'node:crypto';
import type { IUserRepository } from '../../apps/api/src/modules/iam/application/ports/user-repository.port';
import type { ISessionRepository } from '../../apps/api/src/modules/iam/application/ports/session-repository.port';
import type {
  IAuditWriter,
  AuditRecordInput,
} from '../../apps/api/src/modules/audit-compliance/application/ports/audit-writer.port';
import type { UserAccount } from '../../apps/api/src/modules/iam/domain/entities/user';
import type {
  Session,
  SpentRefreshToken,
  CredentialSetupToken,
} from '../../apps/api/src/modules/iam/domain/entities/session';
import { NotFoundError, ConflictError } from '../../apps/api/src/core/errors';

export class InMemoryUserRepository implements IUserRepository {
  public users = new Map<string, UserAccount>();

  async findById(id: string): Promise<UserAccount | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  async create(data: {
    id: string;
    version: number;
    email: string;
    phone?: string | null;
    initialRole: UserAccount['initialRole'];
    role: UserAccount['role'];
    accountStatus: UserAccount['accountStatus'];
    passwordHash?: string | null;
    authVersion: number;
  }): Promise<UserAccount> {
    const user: UserAccount = {
      id: data.id,
      version: data.version,
      email: data.email,
      phone: data.phone ?? null,
      initialRole: data.initialRole,
      role: data.role,
      accountStatus: data.accountStatus,
      passwordHash: data.passwordHash ?? null,
      authVersion: data.authVersion,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateWithOcc(
    id: string,
    expectedVersion: number,
    patch: Partial<Omit<UserAccount, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
  ): Promise<UserAccount> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundError(`User ${id} not found`);
    }

    if (user.version !== expectedVersion) {
      throw new ConflictError(`OCC conflict for user ${id}`, {
        subtype: 'STALE_VERSION',
        currentVersion: user.version,
        expectedVersion,
      });
    }

    const updated: UserAccount = {
      ...user,
      ...patch,
      version: user.version + 1,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async incrementFailedLogin(
    id: string,
    lockThreshold: number,
    lockDurationMs: number,
  ): Promise<{ failedAttempts: number; lockedUntil: Date | null }> {
    const user = this.users.get(id);
    if (!user) throw new NotFoundError(`User ${id} not found`);

    const nextAttempts = user.failedLoginAttempts + 1;
    let nextLockedUntil: Date | null = user.lockedUntil;
    if (nextAttempts >= lockThreshold) {
      nextLockedUntil = new Date(Date.now() + lockDurationMs);
    }

    const updated: UserAccount = {
      ...user,
      failedLoginAttempts: nextAttempts,
      lockedUntil: nextLockedUntil,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return { failedAttempts: nextAttempts, lockedUntil: nextLockedUntil };
  }

  async resetFailedLogin(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, {
        ...user,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      });
    }
  }

  async updatePasswordHash(id: string, newHash: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, {
        ...user,
        passwordHash: newHash,
        updatedAt: new Date(),
      });
    }
  }

  async advanceAuthVersion(id: string, expectedVersion?: number): Promise<UserAccount> {
    const user = this.users.get(id);
    if (!user) throw new NotFoundError(`User ${id} not found`);

    if (expectedVersion !== undefined && user.version !== expectedVersion) {
      throw new ConflictError(`OCC conflict for user ${id}`, {
        subtype: 'STALE_VERSION',
        currentVersion: user.version,
        expectedVersion,
      });
    }

    const updated: UserAccount = {
      ...user,
      authVersion: user.authVersion + 1,
      version: expectedVersion !== undefined ? user.version + 1 : user.version,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }
}

export class InMemorySessionRepository implements ISessionRepository {
  public sessions = new Map<string, Session>();
  public spentRefreshTokens = new Map<string, SpentRefreshToken>();
  public setupTokens = new Map<string, CredentialSetupToken>();

  async createSession(data: {
    id: string;
    userId: string;
    tokenFamily: string;
    accessTokenHash: string;
    refreshTokenHash: string;
    authVersion: number;
    sessionVersion: number;
    accessExpiresAt: Date;
    refreshExpiresAt: Date;
    expiresAt: Date;
  }): Promise<Session> {
    const session: Session = {
      id: data.id,
      userId: data.userId,
      tokenFamily: data.tokenFamily,
      accessTokenHash: data.accessTokenHash,
      refreshTokenHash: data.refreshTokenHash,
      authVersion: data.authVersion,
      sessionVersion: data.sessionVersion,
      accessExpiresAt: data.accessExpiresAt,
      refreshExpiresAt: data.refreshExpiresAt,
      expiresAt: data.expiresAt,
      revokedAt: null,
      lastRotatedAt: null,
      createdAt: new Date(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async findSessionByAccessTokenHash(hash: string): Promise<Session | null> {
    for (const s of this.sessions.values()) {
      if (s.accessTokenHash === hash) return s;
    }
    return null;
  }

  async findSessionByRefreshTokenHash(hash: string): Promise<Session | null> {
    for (const s of this.sessions.values()) {
      if (s.refreshTokenHash === hash) return s;
    }
    return null;
  }

  async findSpentRefreshTokenByHash(hash: string): Promise<SpentRefreshToken | null> {
    return this.spentRefreshTokens.get(hash) ?? null;
  }

  async rotateRefreshToken(params: {
    sessionId: string;
    tokenFamily: string;
    oldRefreshTokenHash: string;
    newAccessTokenHash: string;
    newRefreshTokenHash: string;
    newAccessExpiresAt: Date;
    newRefreshExpiresAt: Date;
    sessionVersion: number;
  }): Promise<Session> {
    const session = this.sessions.get(params.sessionId);
    if (!session || session.refreshTokenHash !== params.oldRefreshTokenHash) {
      throw new Error('Concurrent modification or invalid session during rotation');
    }

    // Record spent
    this.spentRefreshTokens.set(params.oldRefreshTokenHash, {
      id: crypto.randomUUID(),
      sessionId: params.sessionId,
      tokenFamily: params.tokenFamily,
      refreshTokenHash: params.oldRefreshTokenHash,
      spentAt: new Date(),
      expiresAt: params.newRefreshExpiresAt,
    });

    const updated: Session = {
      ...session,
      accessTokenHash: params.newAccessTokenHash,
      refreshTokenHash: params.newRefreshTokenHash,
      accessExpiresAt: params.newAccessExpiresAt,
      refreshExpiresAt: params.newRefreshExpiresAt,
      expiresAt: params.newRefreshExpiresAt,
      sessionVersion: params.sessionVersion + 1,
      lastRotatedAt: new Date(),
    };
    this.sessions.set(session.id, updated);
    return updated;
  }

  async revokeSession(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId);
    if (s) {
      this.sessions.set(sessionId, { ...s, revokedAt: new Date() });
    }
  }

  async revokeTokenFamily(tokenFamily: string): Promise<void> {
    for (const [id, s] of this.sessions.entries()) {
      if (s.tokenFamily === tokenFamily) {
        this.sessions.set(id, { ...s, revokedAt: new Date() });
      }
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    for (const [id, s] of this.sessions.entries()) {
      if (s.userId === userId) {
        this.sessions.set(id, { ...s, revokedAt: new Date() });
      }
    }
  }

  async createSetupToken(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<CredentialSetupToken> {
    const token: CredentialSetupToken = {
      id: data.id,
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      usedAt: null,
      createdAt: new Date(),
    };
    this.setupTokens.set(token.tokenHash, token);
    return token;
  }

  async findSetupTokenByHash(hash: string): Promise<CredentialSetupToken | null> {
    return this.setupTokens.get(hash) ?? null;
  }

  async markSetupTokenUsed(id: string): Promise<void> {
    for (const [hash, token] of this.setupTokens.entries()) {
      if (token.id === id) {
        this.setupTokens.set(hash, { ...token, usedAt: new Date() });
      }
    }
  }
}

export class InMemoryAuditWriter implements IAuditWriter {
  public readonly events: AuditRecordInput[] = [];

  async writeEvent(event: AuditRecordInput): Promise<void> {
    this.events.push(event);
  }

  clear(): void {
    this.events.length = 0;
  }
}
