import { z } from 'zod';
import { ProofProfileSchema } from '../operational/proof-profile';

/**
 * GV-15: CreateTaskTypeRequest — TaskType creation.
 * expectedVersion is NOT required for creation commands.
 */
export const CreateTaskTypeRequestSchema = z.object({
  name: z.string().min(1),
  defaultProofProfile: ProofProfileSchema,
  description: z.string().optional(),
});

export type CreateTaskTypeRequest = z.infer<typeof CreateTaskTypeRequestSchema>;

/**
 * GV-16: ActivateTaskTypeRequest — Mutation against existing task type. Requires expectedVersion.
 */
export const ActivateTaskTypeRequestSchema = z.object({
  taskTypeId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
});

export type ActivateTaskTypeRequest = z.infer<typeof ActivateTaskTypeRequestSchema>;

/**
 * GV-17: DeactivateTaskTypeRequest — Mutation against existing task type. Requires expectedVersion.
 */
export const DeactivateTaskTypeRequestSchema = z.object({
  taskTypeId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
});

export type DeactivateTaskTypeRequest = z.infer<typeof DeactivateTaskTypeRequestSchema>;
