import type { Session, SpentRefreshToken, CredentialSetupToken } from '../../domain/entities/session';

export interface ISessionRepository {
  createSession(data: {
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
  }): Promise<Session>;

  findSessionByAccessTokenHash(hash: string): Promise<Session | null>;
  findSessionByRefreshTokenHash(hash: string): Promise<Session | null>;
  findSpentRefreshTokenByHash(hash: string): Promise<SpentRefreshToken | null>;

  rotateRefreshToken(params: {
    sessionId: string;
    tokenFamily: string;
    oldRefreshTokenHash: string;
    newAccessTokenHash: string;
    newRefreshTokenHash: string;
    newAccessExpiresAt: Date;
    newRefreshExpiresAt: Date;
    sessionVersion: number;
  }): Promise<Session>;

  revokeSession(sessionId: string): Promise<void>;
  revokeTokenFamily(tokenFamily: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;

  createSetupToken(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<CredentialSetupToken>;

  findSetupTokenByHash(hash: string): Promise<CredentialSetupToken | null>;
  markSetupTokenUsed(id: string): Promise<void>;
}
