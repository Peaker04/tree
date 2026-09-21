import { z } from 'zod';
import { GpsCheckSchema, QrCheckSchema } from './verification';
import { TaskStatusSchema } from './task-status';

export const CareHistoryDtoSchema = z.object({
  id: z.string().min(1),
  treeId: z.string().min(1),
  taskId: z.string().min(1),
  taskTitle: z.string(),
  staffId: z.string(),
  staffName: z.string(),
  completedAt: z.string(),
  status: z.literal('COMPLETED').or(TaskStatusSchema),
  hasException: z.boolean().optional(),
  exceptionReason: z.string().optional(),
  gpsCheck: GpsCheckSchema.optional(),
  qrCheck: QrCheckSchema.optional(),
  beforePhoto: z.string().optional(),
  afterPhoto: z.string().optional(),
  notes: z.string().optional(),
});

export type CanonicalCareHistoryDto = z.infer<typeof CareHistoryDtoSchema>;
