export interface Session {
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
  revokedAt: Date | null;
  lastRotatedAt: Date | null;
  createdAt: Date;
}

export interface SpentRefreshToken {
  id: string;
  sessionId: string;
  tokenFamily: string;
  refreshTokenHash: string;
  spentAt: Date;
  expiresAt: Date;
}

export interface CredentialSetupToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}
