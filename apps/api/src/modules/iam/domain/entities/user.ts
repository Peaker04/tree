import type { HumanRole, AccountStatus } from '@novyx/contracts';

export interface UserAccount {
  id: string;
  version: number;
  email: string;
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
