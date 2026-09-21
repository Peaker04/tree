import { z } from 'zod';
import { TaskStatusSchema } from './task-status';
import { ProofProfileSchema } from './proof-profile';
import { ChecklistItemSchema, ProofPayloadSchema } from './evidence';
import { GpsCheckSchema, QrCheckSchema } from './verification';

/**
 * Stable catalog identifier for TaskType in operational commands.
 * Canonical operational contracts reference TaskType catalog resources
 * rather than hardcoding a finite enum of display names.
 */
export const TaskTypeIdSchema = z.string().min(1);
export type TaskTypeId = z.infer<typeof TaskTypeIdSchema>;

/**
 * OP-03: CreateTaskRequest — Aggregate creation.
 * Manager selects tree, taskTypeId, assignedStaffId, deadline, title, description.
 * System deterministically resolves TaskType -> ProofProfile and policyVersion.
 * Checklist policy is governed centrally; manager does not provide arbitrary checklist.
 * expectedVersion is NOT required for creation commands.
 */
export const CreateTaskRequestSchema = z.object({
  title: z.string().min(3),
  taskTypeId: TaskTypeIdSchema,
  description: z.string(),
  treeId: z.string().min(1),
  assignedStaffId: z.string().min(1),
  deadline: z.string().min(1),
});

export type CanonicalCreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

/**
 * OP-04: AssignTaskRequest — Mutation against existing task. Requires expectedVersion.
 */
export const AssignTaskRequestSchema = z.object({
  taskId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  assignedStaffId: z.string().min(1),
});

export type AssignTaskRequest = z.infer<typeof AssignTaskRequestSchema>;

/**
 * OP-05: StartTaskRequest — Mutation against existing task. Requires expectedVersion.
 */
export const StartTaskRequestSchema = z.object({
  taskId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
});

export type StartTaskRequest = z.infer<typeof StartTaskRequestSchema>;

/**
 * OP-10: ReassignTaskRequest — Mutation against existing task. Requires expectedVersion.
 */
export const ReassignTaskRequestSchema = z.object({
  taskId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  newStaffId: z.string().min(1),
  reason: z.string().min(3),
});

export type ReassignTaskRequest = z.infer<typeof ReassignTaskRequestSchema>;

/**
 * OP-11: CancelTaskRequest — Mutation against existing task. Requires expectedVersion.
 */
export const CancelTaskRequestSchema = z.object({
  taskId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  cancelReason: z.string().min(3),
});

export type CancelTaskRequest = z.infer<typeof CancelTaskRequestSchema>;

/**
 * OP-18: ApproveTaskRequest — Mutation against existing task. Requires expectedVersion.
 */
export const ApproveTaskRequestSchema = z.object({
  taskId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  reviewerId: z.string().min(1),
  notes: z.string().optional(),
});

export type ApproveTaskRequest = z.infer<typeof ApproveTaskRequestSchema>;

/**
 * OP-19: ApproveWithExceptionRequest — Mutation against existing task. Requires expectedVersion.
 */
export const ApproveWithExceptionRequestSchema = z.object({
  taskId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  reviewerId: z.string().min(1),
  exceptionReason: z.string().min(5),
  notes: z.string().optional(),
});

export type ApproveWithExceptionRequest = z.infer<typeof ApproveWithExceptionRequestSchema>;

/**
 * OP-20: RequestReworkRequest — Mutation against existing task. Requires expectedVersion.
 */
export const RequestReworkRequestSchema = z.object({
  taskId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  reviewerId: z.string().min(1),
  targetedArea: z.string().min(1),
  reworkReason: z.string().min(5),
  guidanceNotes: z.string().optional(),
});

export type RequestReworkRequest = z.infer<typeof RequestReworkRequestSchema>;

/**
 * OP-21: ResubmitReworkRequest — Mutation against existing task. Requires expectedVersion.
 */
export const ResubmitReworkRequestSchema = z.object({
  taskId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  reworkedProof: ProofPayloadSchema,
  reworkNotes: z.string().optional(),
});

export type ResubmitReworkRequest = z.infer<typeof ResubmitReworkRequestSchema>;

/**
 * Canonical Task DTO Schema — includes version: number for OCC,
 * catalog-based taskTypeId, resolved proofProfile, and policyVersionId.
 */
export const TaskDtoSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().nonnegative(),
  title: z.string(),
  taskTypeId: TaskTypeIdSchema,
  taskTypeName: z.string().optional(),
  proofProfile: ProofProfileSchema,
  policyVersionId: z.string().optional(),
  description: z.string(),
  treeId: z.string(),
  treeName: z.string(),
  treeAddress: z.string(),
  assignedStaffId: z.string(),
  assignedStaffName: z.string(),
  deadline: z.string(),
  status: TaskStatusSchema,
  gpsCheck: GpsCheckSchema.optional(),
  qrCheck: QrCheckSchema.optional(),
  beforePhoto: z.string().optional(),
  afterPhoto: z.string().optional(),
  checklist: z.array(ChecklistItemSchema).optional(),
  notes: z.string().optional(),
  rejectReason: z.string().optional(),
  rejectChips: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CanonicalTaskDto = z.infer<typeof TaskDtoSchema>;

/**
 * Query schema for listing tasks
 */
export const ListTasksQuerySchema = z.object({
  staffId: z.string().optional(),
  status: TaskStatusSchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>;
