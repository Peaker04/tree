import { z } from 'zod';

export const FieldIssueDtoSchema = z.object({
  taskId: z.string().min(1),
  issueDescription: z.string().min(5),
  issuePhotoUri: z.string().min(1),
  reportedAt: z.string().min(1),
  reportedByUserId: z.string().min(1),
});

export type FieldIssueDto = z.infer<typeof FieldIssueDtoSchema>;

export const ReportFieldIssueRequestSchema = z.object({
  taskId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  issueDescription: z.string().min(5),
  issuePhotoUri: z.string().min(1),
});

export type ReportFieldIssueRequest = z.infer<typeof ReportFieldIssueRequestSchema>;

export const ResumeBlockedTaskRequestSchema = z.object({
  taskId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  resolutionNotes: z.string().min(5),
});

export type ResumeBlockedTaskRequest = z.infer<typeof ResumeBlockedTaskRequestSchema>;
