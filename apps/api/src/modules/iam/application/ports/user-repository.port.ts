import type { UserAccount } from '../../domain/entities/user';

export interface IUserRepository {
  findById(id: string): Promise<UserAccount | null>;
  findByEmail(email: string): Promise<UserAccount | null>;
  create(data: {
    id: string;
    version: number;
    email: string;
    phone?: string | null;
    initialRole: UserAccount['initialRole'];
    role: UserAccount['role'];
    accountStatus: UserAccount['accountStatus'];
    passwordHash?: string | null;
    authVersion: number;
  }): Promise<UserAccount>;
  updateWithOcc(
    id: string,
    expectedVersion: number,
    patch: Partial<Omit<UserAccount, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
  ): Promise<UserAccount>;
  incrementFailedLogin(
    id: string,
    lockThreshold: number,
    lockDurationMs: number,
  ): Promise<{ failedAttempts: number; lockedUntil: Date | null }>;
  resetFailedLogin(id: string): Promise<void>;
  updatePasswordHash(id: string, newHash: string): Promise<void>;
  advanceAuthVersion(id: string, expectedVersion?: number): Promise<UserAccount>;
}
