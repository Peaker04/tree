import crypto from 'node:crypto';
import type { IUserRepository } from '../ports/user-repository.port';
import type { ISessionRepository } from '../ports/session-repository.port';
import type { IPasswordHasher } from '../ports/password-hasher.port';
import type { ITokenService } from '../ports/token-service.port';
import { UnauthorizedError, ForbiddenError } from '../../../../core/errors';
import type { LoginResponse } from '@novyx/contracts';

export interface LoginUseCaseOptions {
  accessTokenTtlSeconds?: number;
  refreshTokenTtlSeconds?: number;
  lockThreshold?: number;
  lockDurationMs?: number;
}

export class LoginUseCase {
  private readonly accessTokenTtlMs: number;
  private readonly refreshTokenTtlMs: number;
  private readonly lockThreshold: number;
  private readonly lockDurationMs: number;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    options: LoginUseCaseOptions = {},
  ) {
    this.accessTokenTtlMs = (options.accessTokenTtlSeconds ?? 900) * 1000;
    this.refreshTokenTtlMs = (options.refreshTokenTtlSeconds ?? 2592000) * 1000;
    this.lockThreshold = options.lockThreshold ?? 5;
    this.lockDurationMs = options.lockDurationMs ?? 900_000;
  }

  async execute(identifier: string, plainPassword: string): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(identifier);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check credential-lock state
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedError('Account is temporarily locked due to failed login attempts');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const passwordValid = await this.passwordHasher.verify(user.passwordHash, plainPassword);
    if (!passwordValid) {
      await this.userRepository.incrementFailedLogin(user.id, this.lockThreshold, this.lockDurationMs);
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check AccountStatus
    if (user.accountStatus !== 'ACTIVE') {
      throw new ForbiddenError(`Account status is ${user.accountStatus}`);
    }

    // Reset failed login count if needed
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.userRepository.resetFailedLogin(user.id);
    }

    // Rehash-on-successful-login if obsolete hash parameters detected
    if (this.passwordHasher.needsRehash(user.passwordHash)) {
      const newHash = await this.passwordHasher.hash(plainPassword);
      await this.userRepository.updatePasswordHash(user.id, newHash);
    }

    // Issue opaque bearer access credential & rotating refresh credential
    const accessToken = this.tokenService.generateToken(32);
    const refreshToken = this.tokenService.generateToken(32);

    const accessTokenHash = this.tokenService.hashToken(accessToken);
    const refreshTokenHash = this.tokenService.hashToken(refreshToken);

    const sessionId = crypto.randomUUID();
    const tokenFamily = crypto.randomUUID();
    const now = Date.now();
    const accessExpiresAt = new Date(now + this.accessTokenTtlMs);
    const refreshExpiresAt = new Date(now + this.refreshTokenTtlMs);

    await this.sessionRepository.createSession({
      id: sessionId,
      userId: user.id,
      tokenFamily,
      accessTokenHash,
      refreshTokenHash,
      authVersion: user.authVersion,
      sessionVersion: 1,
      accessExpiresAt,
      refreshExpiresAt,
      expiresAt: refreshExpiresAt,
    });

    return {
      session: {
        accessToken,
        refreshToken,
        expiresAt: accessExpiresAt.toISOString(),
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    };
  }
}
