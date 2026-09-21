import type { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateTaskRequestSchema,
  StartTaskRequestSchema,
  ReportFieldIssueRequestSchema,
  ResumeBlockedTaskRequestSchema,
  ReassignTaskRequestSchema,
  CancelTaskRequestSchema,
  SubmitEvidenceRequestSchema,
  ResubmitReworkRequestSchema,
  PresignedUploadRequestSchema,
  TaskResponseSchema,
  TaskListResponseSchema,
  ListTasksQuerySchema,
  PresignedUploadResponseSchema,
  ReviewDecisionSchema,
  type CanonicalCreateTaskRequest,
  type StartTaskRequest,
  type ReportFieldIssueRequest,
  type ResumeBlockedTaskRequest,
  type ReassignTaskRequest,
  type CancelTaskRequest,
  type SubmitEvidenceRequest,
  type ResubmitReworkRequest,
  type PresignedUploadRequest,
  type ListTasksQuery,
  type CanonicalTaskDto,
} from '@novyx/contracts';
import { z } from 'zod';
import type { CreateTaskUseCase } from '../../../modules/work-management/application/use-cases/create-task.use-case';
import type { StartTaskUseCase } from '../../../modules/work-management/application/use-cases/start-task.use-case';
import type { ReportFieldIssueUseCase } from '../../../modules/work-management/application/use-cases/report-field-issue.use-case';
import type { ResumeBlockedTaskUseCase } from '../../../modules/work-management/application/use-cases/resume-blocked-task.use-case';
import type { ReassignTaskUseCase } from '../../../modules/work-management/application/use-cases/reassign-task.use-case';
import type { CancelTaskUseCase } from '../../../modules/work-management/application/use-cases/cancel-task.use-case';
import type { PresignEvidenceUploadUseCase } from '../../../modules/work-management/application/use-cases/presign-evidence-upload.use-case';
import type { SubmitEvidenceUseCase } from '../../../modules/work-management/application/use-cases/submit-evidence.use-case';
import type { ResubmitReworkUseCase } from '../../../modules/work-management/application/use-cases/resubmit-rework.use-case';
import type { ReviewTaskUseCase } from '../../../modules/work-management/application/use-cases/review-task.use-case';
import type { GetTaskUseCase } from '../../../modules/work-management/application/use-cases/get-task.use-case';
import type { ListTasksUseCase } from '../../../modules/work-management/application/use-cases/list-tasks.use-case';
import type { IIdempotencyRepository } from '../../../modules/work-management/application/ports/idempotency-repository.port';
import { executeWithIdempotency } from '../middleware/idempotency';
import type { Task } from '../../../modules/work-management/domain/task.entity';

export interface TaskRouteOptions {
  createTaskUseCase: CreateTaskUseCase;
  startTaskUseCase: StartTaskUseCase;
  reportFieldIssueUseCase: ReportFieldIssueUseCase;
  resumeBlockedTaskUseCase: ResumeBlockedTaskUseCase;
  reassignTaskUseCase: ReassignTaskUseCase;
  cancelTaskUseCase: CancelTaskUseCase;
  presignEvidenceUploadUseCase: PresignEvidenceUploadUseCase;
  submitEvidenceUseCase: SubmitEvidenceUseCase;
  resubmitReworkUseCase: ResubmitReworkUseCase;
  reviewTaskUseCase: ReviewTaskUseCase;
  getTaskUseCase: GetTaskUseCase;
  listTasksUseCase: ListTasksUseCase;
  idempotencyRepo: IIdempotencyRepository;
  authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  requireRoles: (
    ...roles: ('staff' | 'manager' | 'admin')[]
  ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function toTaskDto(task: Task): CanonicalTaskDto {
  return {
    id: task.id,
    version: task.version,
    title: task.title,
    taskTypeId: task.taskTypeId,
    taskTypeName: task.taskTypeName,
    proofProfile: task.proofProfile,
    policyVersionId: task.policyVersionId,
    description: task.description,
    treeId: task.treeId,
    treeName: task.treeName,
    treeAddress: task.treeAddress,
    assignedStaffId: task.assignedStaffId,
    assignedStaffName: task.assignedStaffName,
    deadline: task.deadline,
    status: task.status,
    checklist: task.checklistSnapshot,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

const ReviewTaskBodySchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  decision: ReviewDecisionSchema,
  notes: z.string().optional(),
  exceptionReason: z.string().optional(),
  targetedArea: z.string().optional(),
  reworkReason: z.string().optional(),
});

type ReviewTaskBody = z.infer<typeof ReviewTaskBodySchema>;

export const taskRoutes: FastifyPluginAsync<TaskRouteOptions> = async (
  fastify: FastifyInstance,
  options: TaskRouteOptions,
) => {
  const authHandler = options.authenticate;
  const managerOnly = options.requireRoles('manager');
  const staffOnly = options.requireRoles('staff');

  // OP-03: CreateTask (Manager only)
  fastify.post<{ Body: CanonicalCreateTaskRequest }>(
    '/v1/tasks',
    {
      schema: {
        body: CreateTaskRequestSchema,
        response: { 201: TaskResponseSchema },
      },
      preHandler: [authHandler, managerOnly],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(request, reply, options.idempotencyRepo, async () => {
        const task = await options.createTaskUseCase.execute(request.body, actor);
        return {
          status: 201,
          data: { data: toTaskDto(task) },
        };
      });
    },
  );

  // ListTasks
  fastify.get<{ Querystring: ListTasksQuery }>(
    '/v1/tasks',
    {
      schema: {
        querystring: ListTasksQuerySchema,
        response: { 200: TaskListResponseSchema },
      },
      preHandler: [authHandler],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const result = await options.listTasksUseCase.execute(request.query, actor);
      return reply.status(200).send({
        data: result.tasks.map(toTaskDto),
        meta: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    },
  );

  // GetTask
  fastify.get<{ Params: { id: string } }>(
    '/v1/tasks/:id',
    {
      schema: {
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const task = await options.getTaskUseCase.execute(request.params.id, actor);
      return reply.status(200).send({ data: toTaskDto(task) });
    },
  );

  // OP-05: StartTask (Staff only)
  fastify.post<{ Params: { id: string }; Body: StartTaskRequest }>(
    '/v1/tasks/:id/start',
    {
      schema: {
        body: StartTaskRequestSchema,
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, staffOnly],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(request, reply, options.idempotencyRepo, async () => {
        const task = await options.startTaskUseCase.execute({ ...request.body, taskId: request.params.id }, actor);
        return {
          status: 200,
          data: { data: toTaskDto(task) },
        };
      });
    },
  );

  // OP-06: ReportFieldIssue (Staff only)
  fastify.post<{ Params: { id: string }; Body: ReportFieldIssueRequest }>(
    '/v1/tasks/:id/field-issue',
    {
      schema: {
        body: ReportFieldIssueRequestSchema,
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, staffOnly],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(request, reply, options.idempotencyRepo, async () => {
        const task = await options.reportFieldIssueUseCase.execute(
          { ...request.body, taskId: request.params.id },
          actor,
        );
        return {
          status: 200,
          data: { data: toTaskDto(task) },
        };
      });
    },
  );

  // ResumeBlockedTask (Manager only)
  fastify.post<{ Params: { id: string }; Body: ResumeBlockedTaskRequest }>(
    '/v1/tasks/:id/resume',
    {
      schema: {
        body: ResumeBlockedTaskRequestSchema,
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, managerOnly],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(request, reply, options.idempotencyRepo, async () => {
        const task = await options.resumeBlockedTaskUseCase.execute(
          { ...request.body, taskId: request.params.id },
          actor,
        );
        return {
          status: 200,
          data: { data: toTaskDto(task) },
        };
      });
    },
  );

  // OP-10: ReassignTask (Manager only)
  fastify.post<{ Params: { id: string }; Body: ReassignTaskRequest }>(
    '/v1/tasks/:id/reassign',
    {
      schema: {
        body: ReassignTaskRequestSchema,
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, managerOnly],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(request, reply, options.idempotencyRepo, async () => {
        const task = await options.reassignTaskUseCase.execute({ ...request.body, taskId: request.params.id }, actor);
        return {
          status: 200,
          data: { data: toTaskDto(task) },
        };
      });
    },
  );

  // OP-11: CancelTask (Manager only)
  fastify.post<{ Params: { id: string }; Body: CancelTaskRequest }>(
    '/v1/tasks/:id/cancel',
    {
      schema: {
        body: CancelTaskRequestSchema,
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, managerOnly],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(request, reply, options.idempotencyRepo, async () => {
        const task = await options.cancelTaskUseCase.execute({ ...request.body, taskId: request.params.id }, actor);
        return {
          status: 200,
          data: { data: toTaskDto(task) },
        };
      });
    },
  );

  // Evidence Presign URL (Staff only)
  fastify.post<{ Params: { id: string }; Body: PresignedUploadRequest }>(
    '/v1/tasks/:id/evidence/presign',
    {
      schema: {
        body: PresignedUploadRequestSchema,
        response: { 200: PresignedUploadResponseSchema },
      },
      preHandler: [authHandler, staffOnly],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const result = await options.presignEvidenceUploadUseCase.execute(request.params.id, request.body, actor);
      return reply.status(200).send({
        data: {
          objectKey: result.objectKey,
          storageRef: result.storageRef,
          uploadUrl: result.uploadUrl,
          expiresAt: result.expiresAt.toISOString(),
        },
      });
    },
  );

  // OP-14: SubmitEvidence (Staff only)
  fastify.post<{ Params: { id: string }; Body: SubmitEvidenceRequest }>(
    '/v1/tasks/:id/evidence',
    {
      schema: {
        body: SubmitEvidenceRequestSchema,
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, staffOnly],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(request, reply, options.idempotencyRepo, async () => {
        const task = await options.submitEvidenceUseCase.execute({ ...request.body, taskId: request.params.id }, actor);
        return {
          status: 200,
          data: { data: toTaskDto(task) },
        };
      });
    },
  );

  // OP-21: ResubmitRework (Staff only)
  fastify.post<{ Params: { id: string }; Body: ResubmitReworkRequest }>(
    '/v1/tasks/:id/rework/resubmit',
    {
      schema: {
        body: ResubmitReworkRequestSchema,
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, staffOnly],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(request, reply, options.idempotencyRepo, async () => {
        const task = await options.resubmitReworkUseCase.execute({ ...request.body, taskId: request.params.id }, actor);
        return {
          status: 200,
          data: { data: toTaskDto(task) },
        };
      });
    },
  );

  // ReviewTask (Manager only)
  fastify.post<{ Params: { id: string }; Body: ReviewTaskBody }>(
    '/v1/tasks/:id/review',
    {
      schema: {
        body: ReviewTaskBodySchema,
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, managerOnly],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(request, reply, options.idempotencyRepo, async () => {
        const task = await options.reviewTaskUseCase.execute({ ...request.body, taskId: request.params.id }, actor);
        return {
          status: 200,
          data: { data: toTaskDto(task) },
        };
      });
    },
  );
};
