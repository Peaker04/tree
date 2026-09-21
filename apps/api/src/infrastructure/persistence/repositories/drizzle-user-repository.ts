import { eq, and, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { UserAccount } from '../../../modules/iam/domain/entities/user';
import type { IUserRepository } from '../../../modules/iam/application/ports/user-repository.port';
import { ConflictError, NotFoundError } from '../../../core/errors';
import * as schema from '../schema';
import type { HumanRole, AccountStatus } from '@novyx/contracts';

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  private mapRowToEntity(row: schema.UserRow): UserAccount {
    return {
      id: row.id,
      version: row.version,
      email: row.email,
      phone: row.phone,
      initialRole: row.initialRole as HumanRole,
      role: row.role as HumanRole,
      accountStatus: row.accountStatus as AccountStatus,
      passwordHash: row.passwordHash,
      authVersion: row.authVersion,
      failedLoginAttempts: row.failedLoginAttempts,
      lockedUntil: row.lockedUntil,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findById(id: string): Promise<UserAccount | null> {
    const rows = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    if (!row) return null;
    return this.mapRowToEntity(row);
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    const rows = await this.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    if (!row) return null;
    return this.mapRowToEntity(row);
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
    const [row] = await this.db
      .insert(schema.users)
      .values({
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
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create user record');
    }
    return this.mapRowToEntity(row);
  }

  async updateWithOcc(
    id: string,
    expectedVersion: number,
    patch: Partial<Omit<UserAccount, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
  ): Promise<UserAccount> {
    const valuesToSet: Record<string, unknown> = {
      version: sql`${schema.users.version} + 1`,
      updatedAt: new Date(),
    };

    if (patch.role !== undefined) valuesToSet['role'] = patch.role;
    if (patch.accountStatus !== undefined) valuesToSet['accountStatus'] = patch.accountStatus;
    if (patch.passwordHash !== undefined) valuesToSet['passwordHash'] = patch.passwordHash;
    if (patch.authVersion !== undefined) valuesToSet['authVersion'] = patch.authVersion;
    if (patch.phone !== undefined) valuesToSet['phone'] = patch.phone;
    if (patch.failedLoginAttempts !== undefined) valuesToSet['failedLoginAttempts'] = patch.failedLoginAttempts;
    if (patch.lockedUntil !== undefined) valuesToSet['lockedUntil'] = patch.lockedUntil;

    const rows = await this.db
      .update(schema.users)
      .set(valuesToSet)
      .where(and(eq(schema.users.id, id), eq(schema.users.version, expectedVersion)))
      .returning();

    if (rows && rows.length > 0 && rows[0]) {
      return this.mapRowToEntity(rows[0]);
    }

    // Conflict or Not Found check
    const current = await this.findById(id);
    if (!current) {
      throw new NotFoundError(`User ${id} not found`);
    }

    throw new ConflictError(`OCC conflict for user ${id}`, {
      subtype: 'STALE_VERSION',
      currentVersion: current.version,
      expectedVersion,
    });
  }

  async incrementFailedLogin(
    id: string,
    lockThreshold: number,
    lockDurationMs: number,
  ): Promise<{ failedAttempts: number; lockedUntil: Date | null }> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError(`User ${id} not found`);
    }

    const nextAttempts = user.failedLoginAttempts + 1;
    let nextLockedUntil: Date | null = user.lockedUntil;

    if (nextAttempts >= lockThreshold) {
      nextLockedUntil = new Date(Date.now() + lockDurationMs);
    }

    await this.db
      .update(schema.users)
      .set({
        failedLoginAttempts: nextAttempts,
        lockedUntil: nextLockedUntil,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id));

    return {
      failedAttempts: nextAttempts,
      lockedUntil: nextLockedUntil,
    };
  }

  async resetFailedLogin(id: string): Promise<void> {
    await this.db
      .update(schema.users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id));
  }

  async updatePasswordHash(id: string, newHash: string): Promise<void> {
    await this.db
      .update(schema.users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id));
  }

  async advanceAuthVersion(id: string, expectedVersion?: number): Promise<UserAccount> {
    if (expectedVersion !== undefined) {
      return this.updateWithOcc(id, expectedVersion, {
        authVersion: sql`${schema.users.authVersion} + 1` as unknown as number,
      });
    }

    const rows = await this.db
      .update(schema.users)
      .set({
        authVersion: sql`${schema.users.authVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();

    if (!rows || rows.length === 0 || !rows[0]) {
      throw new NotFoundError(`User ${id} not found`);
    }

    return this.mapRowToEntity(rows[0]);
  }
}
