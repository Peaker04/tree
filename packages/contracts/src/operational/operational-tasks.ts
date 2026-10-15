import { z } from 'zod';
import { TaskStatusSchema } from './task-status';
import { ProofProfileSchema } from './proof-profile';
import { ChecklistItemSchema, ProofPayloadSchema } from './evidence';
import { GpsCheckSchema, QrCheckSchema } from './verification';
import { ReviewDecisionSchema } from './review-decision';

/**
 * Stable catalog identifier for TaskType in operational commands.
 * Canonical operational contracts reference TaskType catalog resources
 * rather than hardcoding a finite enum of display names.
 */
export const TaskTypeIdSchema = z.string().min(1);
export type TaskTypeId = z.infer<typeof TaskTypeIdSchema>;

/**
 * Date range schema for periodic / daily care routine dispatching.
 * Formatted as YYYY-MM-DD strings.
 */
export const DateRangeSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
    shift: z.enum(['morning', 'afternoon', 'full_day']).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });

export type DateRange = z.infer<typeof DateRangeSchema>;

/**
 * Tree scope schema supporting zone dispatching or multi-tree groupings.
 */
export const TreeScopeSchema = z.object({
  mode: z.enum(['zone', 'multi_trees', 'single_tree']),
  zoneId: z.string().optional(),
  treeIds: z.array(z.string()).min(1),
});

export type TreeScope = z.infer<typeof TreeScopeSchema>;

/**
 * OP-03: CreateTaskRequest — Aggregate creation.
 * Manager selects tree, taskTypeId, assignedStaffId, deadline, title, description.
 * System deterministically resolves TaskType -> ProofProfile and policyVersion.
 * Checklist policy is governed centrally; manager does not provide arbitrary checklist.
 * expectedVersion is NOT required for creation commands.
 * Optional dateRange and scope support periodic care routine workflows.
 */
export const CreateTaskRequestSchema = z.object({
  title: z.string().min(3),
  taskTypeId: TaskTypeIdSchema,
  description: z.string(),
  treeId: z.string().min(1),
  assignedStaffId: z.string().min(1),
  deadline: z.string().min(1),
  dateRange: DateRangeSchema.optional(),
  scope: TreeScopeSchema.optional(),
});

export type CanonicalCreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

/**
 * Care Order Request — Dispatching routine care over a date range and tree scope.
 */
export const CreateCareOrderRequestSchema = z.object({
  title: z.string().min(3),
  taskTypeId: TaskTypeIdSchema,
  description: z.string().default(''),
  assignedStaffId: z.string().min(1),
  dateRange: DateRangeSchema,
  scope: TreeScopeSchema,
  deadline: z.string().optional(),
});

export type CreateCareOrderRequest = z.infer<typeof CreateCareOrderRequestSchema>;

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
 * Unified Review Task HTTP Payload Schema (Phase 13 Wave 4 - W4-C06)
 */
export const ReviewTaskBodySchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  decision: ReviewDecisionSchema,
  notes: z.string().optional(),
  exceptionReason: z.string().optional(),
  targetedArea: z.string().optional(),
  reworkReason: z.string().optional(),
});

export type ReviewTaskBody = z.infer<typeof ReviewTaskBodySchema>;

export const ReviewTaskRequestSchema = ReviewTaskBodySchema.extend({
  taskId: z.string().min(1).optional(),
});

export type ReviewTaskRequest = z.infer<typeof ReviewTaskRequestSchema>;

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
  dateRange: DateRangeSchema.optional(),
  scope: TreeScopeSchema.optional(),
  status: TaskStatusSchema,
  gpsCheck: GpsCheckSchema.optional(),
  qrCheck: QrCheckSchema.optional(),
  beforePhoto: z.string().optional(),
  afterPhoto: z.string().optional(),
  beforePhotoDisplayUrl: z.string().url().optional(),
  afterPhotoDisplayUrl: z.string().url().optional(),
  checklist: z.array(ChecklistItemSchema).optional(),
  notes: z.string().optional(),
  rejectReason: z.string().optional(),
  reworkTarget: z.string().optional(),
  rejectChips: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CanonicalTaskDto = z.infer<typeof TaskDtoSchema>;

export const TaskResponseSchema = z.object({
  data: TaskDtoSchema,
});
export type TaskResponse = z.infer<typeof TaskResponseSchema>;

export const TaskListResponseSchema = z.object({
  data: z.array(TaskDtoSchema),
  meta: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type TaskListResponse = z.infer<typeof TaskListResponseSchema>;

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
