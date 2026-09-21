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

export const CareHistoryResponseSchema = z.object({
  data: CareHistoryDtoSchema,
});
export type CareHistoryResponse = z.infer<typeof CareHistoryResponseSchema>;

export const CareHistoryListResponseSchema = z.object({
  data: z.array(CareHistoryDtoSchema),
  meta: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type CareHistoryListResponse = z.infer<typeof CareHistoryListResponseSchema>;
