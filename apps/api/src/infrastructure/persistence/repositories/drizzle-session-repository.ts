import crypto from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Session, SpentRefreshToken, CredentialSetupToken } from '../../../modules/iam/domain/entities/session';
import type { ISessionRepository } from '../../../modules/iam/application/ports/session-repository.port';
import * as schema from '../schema';

export class DrizzleSessionRepository implements ISessionRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  private mapSessionRow(row: schema.SessionRow): Session {
    return {
      id: row.id,
      userId: row.userId,
      tokenFamily: row.tokenFamily,
      accessTokenHash: row.accessTokenHash,
      refreshTokenHash: row.refreshTokenHash,
      authVersion: row.authVersion,
      sessionVersion: row.sessionVersion,
      accessExpiresAt: row.accessExpiresAt,
      refreshExpiresAt: row.refreshExpiresAt,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      lastRotatedAt: row.lastRotatedAt,
      createdAt: row.createdAt,
    };
  }

  private mapSpentRow(row: schema.SpentRefreshTokenRow): SpentRefreshToken {
    return {
      id: row.id,
      sessionId: row.sessionId,
      tokenFamily: row.tokenFamily,
      refreshTokenHash: row.refreshTokenHash,
      spentAt: row.spentAt,
      expiresAt: row.expiresAt,
    };
  }

  private mapSetupTokenRow(row: schema.CredentialSetupTokenRow): CredentialSetupToken {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    };
  }

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
    const [row] = await this.db
      .insert(schema.sessions)
      .values({
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
      })
      .returning();

    if (!row) {
      throw new Error('Failed to insert session record');
    }

    return this.mapSessionRow(row);
  }

  async findSessionByAccessTokenHash(hash: string): Promise<Session | null> {
    const rows = await this.db.select().from(schema.sessions).where(eq(schema.sessions.accessTokenHash, hash)).limit(1);
    if (!rows || rows.length === 0 || !rows[0]) return null;
    return this.mapSessionRow(rows[0]);
  }

  async findSessionByRefreshTokenHash(hash: string): Promise<Session | null> {
    const rows = await this.db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.refreshTokenHash, hash))
      .limit(1);
    if (!rows || rows.length === 0 || !rows[0]) return null;
    return this.mapSessionRow(rows[0]);
  }

  async findSpentRefreshTokenByHash(hash: string): Promise<SpentRefreshToken | null> {
    const rows = await this.db
      .select()
      .from(schema.spentRefreshTokens)
      .where(eq(schema.spentRefreshTokens.refreshTokenHash, hash))
      .limit(1);
    if (!rows || rows.length === 0 || !rows[0]) return null;
    return this.mapSpentRow(rows[0]);
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
    return await this.db.transaction(async (tx) => {
      // 1. Record spent refresh token
      await tx.insert(schema.spentRefreshTokens).values({
        id: crypto.randomUUID(),
        sessionId: params.sessionId,
        tokenFamily: params.tokenFamily,
        refreshTokenHash: params.oldRefreshTokenHash,
        spentAt: new Date(),
        expiresAt: params.newRefreshExpiresAt,
      });

      // 2. Atomically update session credentials and advance session version
      const rows = await tx
        .update(schema.sessions)
        .set({
          accessTokenHash: params.newAccessTokenHash,
          refreshTokenHash: params.newRefreshTokenHash,
          accessExpiresAt: params.newAccessExpiresAt,
          refreshExpiresAt: params.newRefreshExpiresAt,
          expiresAt: params.newRefreshExpiresAt,
          sessionVersion: params.sessionVersion + 1,
          lastRotatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.sessions.id, params.sessionId),
            eq(schema.sessions.refreshTokenHash, params.oldRefreshTokenHash),
          ),
        )
        .returning();

      if (!rows || rows.length === 0 || !rows[0]) {
        throw new Error('Concurrent modification or invalid session during rotation');
      }

      return this.mapSessionRow(rows[0]);
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.db.update(schema.sessions).set({ revokedAt: new Date() }).where(eq(schema.sessions.id, sessionId));
  }

  async revokeTokenFamily(tokenFamily: string): Promise<void> {
    await this.db
      .update(schema.sessions)
      .set({ revokedAt: new Date() })
      .where(eq(schema.sessions.tokenFamily, tokenFamily));
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.db.update(schema.sessions).set({ revokedAt: new Date() }).where(eq(schema.sessions.userId, userId));
  }

  async createSetupToken(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<CredentialSetupToken> {
    const [row] = await this.db
      .insert(schema.credentialSetupTokens)
      .values({
        id: data.id,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        usedAt: null,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to insert credential setup token');
    }

    return this.mapSetupTokenRow(row);
  }

  async findSetupTokenByHash(hash: string): Promise<CredentialSetupToken | null> {
    const rows = await this.db
      .select()
      .from(schema.credentialSetupTokens)
      .where(eq(schema.credentialSetupTokens.tokenHash, hash))
      .limit(1);

    if (!rows || rows.length === 0 || !rows[0]) return null;
    return this.mapSetupTokenRow(rows[0]);
  }

  async markSetupTokenUsed(id: string): Promise<void> {
    await this.db
      .update(schema.credentialSetupTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.credentialSetupTokens.id, id));
  }
}
