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

/**
 * Canonical TaskType DTO Schema
 */
export const TaskTypeDtoSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().nonnegative(),
  name: z.string().min(1),
  description: z.string().optional(),
  defaultProofProfile: ProofProfileSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TaskTypeDto = z.infer<typeof TaskTypeDtoSchema>;

export const TaskTypeResponseSchema = z.object({
  data: TaskTypeDtoSchema,
});
export type TaskTypeResponse = z.infer<typeof TaskTypeResponseSchema>;

export const TaskTypeListResponseSchema = z.object({
  data: z.array(TaskTypeDtoSchema),
  meta: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type TaskTypeListResponse = z.infer<typeof TaskTypeListResponseSchema>;
