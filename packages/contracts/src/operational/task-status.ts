import { z } from 'zod';

export const CANONICAL_TASK_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'BLOCKED',
  'WAITING_REVIEW',
  'REWORK_REQUIRED',
  'COMPLETED',
  'CANCELLED',
] as const;

export const TaskStatusSchema = z.enum(CANONICAL_TASK_STATUSES);
export type CanonicalTaskStatus = z.infer<typeof TaskStatusSchema>;
