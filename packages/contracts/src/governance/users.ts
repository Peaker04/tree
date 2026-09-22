import { z } from 'zod';
import { HumanRoleSchema } from '../auth/roles';
import { AccountStatusSchema } from '../auth/account-status';
import { createApiSuccessSchema, createApiListSchema } from '../common/envelopes';
import { PaginationQuerySchema } from '../common/pagination';

/**
 * Canonical governance user network representation.
 * Excludes internal security/session state (passwordHash, authVersion, failedLoginAttempts, lockedUntil).
 */
export const GovernanceUserDtoSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().nonnegative(),
  email: z.string().email(),
  phone: z.string().nullable(),
  role: HumanRoleSchema,
  accountStatus: AccountStatusSchema,
});

export type GovernanceUserDto = z.infer<typeof GovernanceUserDtoSchema>;

export const GovernanceUserResponseSchema = createApiSuccessSchema(GovernanceUserDtoSchema);
export type GovernanceUserResponse = z.infer<typeof GovernanceUserResponseSchema>;

/**
 * GV-01: ProvisionUserRequest — User aggregate creation.
 * expectedVersion is NOT required for creation commands.
 */
export const ProvisionUserRequestSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8),
  initialRole: HumanRoleSchema,
});

export type ProvisionUserRequest = z.infer<typeof ProvisionUserRequestSchema>;

/**
 * GV-02: AssignRoleRequest — Mutation against existing user. Requires expectedVersion.
 */
export const AssignRoleRequestSchema = z.object({
  userId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  newRole: HumanRoleSchema,
  reason: z.string().min(5),
});

export type AssignRoleRequest = z.infer<typeof AssignRoleRequestSchema>;

/**
 * GV-03: ActivateAccountRequest — Mutation against existing account. Requires expectedVersion.
 */
export const ActivateAccountRequestSchema = z.object({
  userId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  reason: z.string().optional(),
});

export type ActivateAccountRequest = z.infer<typeof ActivateAccountRequestSchema>;

/**
 * GV-04: SuspendAccountRequest — Mutation against existing account. Requires expectedVersion.
 */
export const SuspendAccountRequestSchema = z.object({
  userId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  reason: z.string().min(5),
});

export type SuspendAccountRequest = z.infer<typeof SuspendAccountRequestSchema>;

/**
 * GV-05: DisableAccountRequest — Mutation against existing account. Requires expectedVersion.
 */
export const DisableAccountRequestSchema = z.object({
  userId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  reason: z.string().min(5),
});

export type DisableAccountRequest = z.infer<typeof DisableAccountRequestSchema>;

/**
 * GV-06: UnlockAccountRequest — Mutation against existing account. Requires expectedVersion.
 */
export const UnlockAccountRequestSchema = z.object({
  userId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  reason: z.string().optional(),
});

export type UnlockAccountRequest = z.infer<typeof UnlockAccountRequestSchema>;

/**
 * GV-07: ResetCredentialSetupRequest — Mutation against existing account. Requires expectedVersion.
 */
export const ResetCredentialSetupRequestSchema = z.object({
  userId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
});

export type ResetCredentialSetupRequest = z.infer<typeof ResetCredentialSetupRequestSchema>;

export const ListGovernanceUsersQuerySchema = PaginationQuerySchema;
export type ListGovernanceUsersQuery = z.infer<typeof ListGovernanceUsersQuerySchema>;

export const ListGovernanceUsersResponseSchema = createApiListSchema(GovernanceUserDtoSchema);
export type ListGovernanceUsersResponse = z.infer<typeof ListGovernanceUsersResponseSchema>;
