import { z } from 'zod';

export const HUMAN_ROLES = ['staff', 'supervisor', 'manager', 'admin'] as const;

export const HumanRoleSchema = z.enum(HUMAN_ROLES);
export type HumanRole = z.infer<typeof HumanRoleSchema>;

/**
 * UserRole alias matching canonical HumanRole
 */
export type UserRole = HumanRole;
