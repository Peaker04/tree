import { z } from 'zod';

export const CANONICAL_ACCOUNT_STATUSES = ['INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED'] as const;

export const AccountStatusSchema = z.enum(CANONICAL_ACCOUNT_STATUSES);
export type AccountStatus = z.infer<typeof AccountStatusSchema>;
