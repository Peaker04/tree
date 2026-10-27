import type { HumanRole, AccountStatus } from '@novyx/contracts';

export interface UserAccount {
  id: string;
  version: number;
  email: string;
  fullName?: string | null;
  phone: string | null;
  initialRole: HumanRole;
  role: HumanRole;
  accountStatus: AccountStatus;
  passwordHash: string | null;
  authVersion: number;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
