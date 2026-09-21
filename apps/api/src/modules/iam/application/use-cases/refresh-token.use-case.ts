import type { IUserRepository } from '../ports/user-repository.port';
import type { ISessionRepository } from '../ports/session-repository.port';
import type { ITokenService } from '../ports/token-service.port';
import { UnauthorizedError, ForbiddenError } from '../../../../core/errors';
import type { LoginResponse } from '@novyx/contracts';

export interface RefreshTokenUseCaseOptions {
  accessTokenTtlSeconds?: number;
  refreshTokenTtlSeconds?: number;
}

export class RefreshTokenUseCase {
  private readonly accessTokenTtlMs: number;
  private readonly refreshTokenTtlMs: number;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly tokenService: ITokenService,
    options: RefreshTokenUseCaseOptions = {},
  ) {
    this.accessTokenTtlMs = (options.accessTokenTtlSeconds ?? 900) * 1000;
    this.refreshTokenTtlMs = (options.refreshTokenTtlSeconds ?? 2592000) * 1000;
  }

  async execute(refreshToken: string): Promise<LoginResponse> {
    const refreshTokenHash = this.tokenService.hashToken(refreshToken);

    // 1. Detect reuse of already-rotated refresh credential
    const spentToken = await this.sessionRepository.findSpentRefreshTokenByHash(refreshTokenHash);
    if (spentToken) {
      // Confirmed reuse! Invalidate the affected token family/session immediately
      await this.sessionRepository.revokeTokenFamily(spentToken.tokenFamily);
      throw new UnauthorizedError('Revoked token reuse detected. Session invalidated.');
    }

    // 2. Resolve active session by refresh token hash
    const session = await this.sessionRepository.findSessionByRefreshTokenHash(refreshTokenHash);
    if (!session || session.revokedAt !== null) {
      throw new UnauthorizedError('Invalid or revoked refresh token');
    }

    // 3. Verify refresh expiry
    if (session.refreshExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    // 4. Authoritative user & freshness verification
    const user = await this.userRepository.findById(session.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.accountStatus !== 'ACTIVE') {
      await this.sessionRepository.revokeSession(session.id);
      throw new ForbiddenError(`Account status is ${user.accountStatus}`);
    }

    if (session.authVersion !== user.authVersion) {
      await this.sessionRepository.revokeSession(session.id);
      throw new UnauthorizedError('Authorization version mismatch');
    }

    // 5. Generate replacement credentials
    const newAccessToken = this.tokenService.generateToken(32);
    const newRefreshToken = this.tokenService.generateToken(32);

    const newAccessTokenHash = this.tokenService.hashToken(newAccessToken);
    const newRefreshTokenHash = this.tokenService.hashToken(newRefreshToken);

    const now = Date.now();
    const newAccessExpiresAt = new Date(now + this.accessTokenTtlMs);
    const newRefreshExpiresAt = new Date(now + this.refreshTokenTtlMs);

    // 6. Atomic rotation in PostgreSQL
    await this.sessionRepository.rotateRefreshToken({
      sessionId: session.id,
      tokenFamily: session.tokenFamily,
      oldRefreshTokenHash: refreshTokenHash,
      newAccessTokenHash,
      newRefreshTokenHash,
      newAccessExpiresAt,
      newRefreshExpiresAt,
      sessionVersion: session.sessionVersion,
    });

    return {
      session: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newAccessExpiresAt.toISOString(),
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    };
  }
}
