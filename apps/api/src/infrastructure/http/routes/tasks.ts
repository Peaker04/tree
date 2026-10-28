import type { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateTaskRequestSchema,
  StartTaskRequestSchema,
  ReportFieldIssueRequestSchema,
  ResumeBlockedTaskRequestSchema,
  ReassignTaskRequestSchema,
  CancelTaskRequestSchema,
  SubmitEvidenceHttpBodySchema,
  StaffExecutionSubmitRequestSchema,
  SupervisorEvidenceSubmitRequestSchema,
  ResubmitReworkRequestSchema,
  PresignedUploadRequestSchema,
  TaskResponseSchema,
  TaskListResponseSchema,
  ListTasksQuerySchema,
  PresignedUploadResponseSchema,
  ReviewTaskBodySchema,
  type CanonicalCreateTaskRequest,
  type StartTaskRequest,
  type ReportFieldIssueRequest,
  type ResumeBlockedTaskRequest,
  type ReassignTaskRequest,
  type CancelTaskRequest,
  type SubmitEvidenceRequest,
  type StaffExecutionSubmitRequest,
  type SupervisorEvidenceSubmitRequest,
  type ResubmitReworkRequest,
  type PresignedUploadRequest,
  type ListTasksQuery,
  type CanonicalTaskDto,
  type ReviewTaskBody,
  type HumanRole,
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
import type {
  IEvidenceRepository,
  EvidenceAttemptRecord,
  TaskReviewRecord,
} from '../../../modules/work-management/application/ports/evidence-repository.port';
import type { IIdempotencyRepository } from '../../../modules/work-management/application/ports/idempotency-repository.port';
import type { IOperationalUnitOfWork } from '../../../modules/work-management/application/ports/operational-unit-of-work.port';
import type { IObjectStoragePort } from '../../../modules/work-management/application/ports/object-storage.port';
import { executeWithIdempotency } from '../middleware/idempotency';
import type { Task } from '../../../modules/work-management/domain/task.entity';
import { ValidationError } from '../../../core/errors';

type PathTaskBody<T extends { taskId: string }> = Omit<T, 'taskId'> & { taskId?: string };

function assertPathTaskId(pathTaskId: string, bodyTaskId?: string) {
  if (bodyTaskId && bodyTaskId !== pathTaskId) {
    throw new ValidationError(`Path taskId (${pathTaskId}) does not match body taskId (${bodyTaskId})`);
  }
}

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
  evidenceRepo: IEvidenceRepository;
  storagePort: IObjectStoragePort;
  idempotencyRepo: IIdempotencyRepository;
  uow?: IOperationalUnitOfWork | undefined;
  authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  requireRoles: (...roles: HumanRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function getObjectKey(storageRef?: string): string | null {
  if (!storageRef?.startsWith('s3://')) return null;
  const path = storageRef.slice('s3://'.length);
  const slashIndex = path.indexOf('/');
  return slashIndex >= 0 ? path.slice(slashIndex + 1) : null;
}

async function addEvidenceDisplayUrls(
  task: CanonicalTaskDto,
  storagePort: IObjectStoragePort,
): Promise<CanonicalTaskDto> {
  const [beforePhotoDisplayUrl, afterPhotoDisplayUrl] = await Promise.all(
    [task.beforePhoto, task.afterPhoto].map(async (storageRef) => {
      const objectKey = getObjectKey(storageRef);
      return objectKey ? storagePort.generatePresignedDownloadUrl(objectKey) : undefined;
    }),
  );
  return {
    ...task,
    ...(beforePhotoDisplayUrl ? { beforePhotoDisplayUrl } : {}),
    ...(afterPhotoDisplayUrl ? { afterPhotoDisplayUrl } : {}),
  };
}

function toTaskDto(
  task: Task,
  evidenceAttempts: EvidenceAttemptRecord[] = [],
  review?: TaskReviewRecord,
): CanonicalTaskDto {
  const latestAttempt = evidenceAttempts.at(-1);
  const staffAttempt = [...evidenceAttempts]
    .reverse()
    .find(
      (a) => a.proofData?.['submissionStage'] === 'STAFF_EXECUTION' || a.submittedByUserId === task.assignedStaffId,
    );
  const supervisorAttempt = [...evidenceAttempts]
    .reverse()
    .find(
      (a) =>
        a.proofData?.['submissionStage'] === 'SUPERVISOR_EVIDENCE' ||
        (a.submittedByUserId !== task.assignedStaffId && Boolean(a.proofData?.['beforePhotoUri'])),
    );
  const mergedProof = evidenceAttempts.reduce<Record<string, unknown>>(
    (current, attempt) => ({ ...current, ...attempt.proofData }),
    {},
  ) as {
    beforePhotoUri?: string;
    afterPhotoUri?: string;
    checklist?: CanonicalTaskDto['checklist'];
    supervisorGpsCheck?: CanonicalTaskDto['supervisorGpsCheck'];
  };
  const mergedSiteVerification = evidenceAttempts.reduce<Record<string, unknown>>(
    (current, attempt) => ({ ...current, ...(attempt.siteVerification ?? {}) }),
    {},
  ) as { gpsCheck?: CanonicalTaskDto['gpsCheck']; qrCheck?: CanonicalTaskDto['qrCheck'] };
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
    assignedSupervisorId: task.assignedSupervisorId,
    assignedSupervisorName: task.assignedSupervisorName,
    deadline: task.deadline,
    status: task.status,
    checklist: mergedProof.checklist ?? task.checklistSnapshot,
    gpsCheck: mergedSiteVerification.gpsCheck,
    qrCheck: mergedSiteVerification.qrCheck,
    staffCompletedAt: task.staffCompletedAt ?? staffAttempt?.submittedAt?.toISOString(),
    supervisorId: task.supervisorId ?? supervisorAttempt?.submittedByUserId,
    supervisorName: task.supervisorName,
    supervisorGpsCheck:
      (task.supervisorGpsCheck as CanonicalTaskDto['supervisorGpsCheck']) ?? mergedProof.supervisorGpsCheck,
    supervisorCompletedAt: task.supervisorCompletedAt ?? supervisorAttempt?.submittedAt?.toISOString(),
    supervisorNotes: task.supervisorNotes ?? supervisorAttempt?.notes,
    beforePhoto: mergedProof.beforePhotoUri,
    afterPhoto: mergedProof.afterPhotoUri,
    notes: latestAttempt?.notes,
    rejectReason: review?.reworkReason,
    reworkTarget: review?.targetedArea,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export const taskRoutes: FastifyPluginAsync<TaskRouteOptions> = async (
  fastify: FastifyInstance,
  options: TaskRouteOptions,
) => {
  const authHandler = options.authenticate;
  const managerOnly = options.requireRoles('manager');
  const staffOnly = options.requireRoles('staff');
  const staffOrSupervisor = options.requireRoles('staff', 'supervisor');

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
      await executeWithIdempotency(
        request,
        reply,
        options.idempotencyRepo,
        async () => {
          const task = await options.createTaskUseCase.execute(request.body, actor);
          return {
            status: 201,
            data: { data: toTaskDto(task) },
          };
        },
        options.uow,
      );
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
      const [attempts, reviews] = await Promise.all([
        Promise.all(result.tasks.map((task) => options.evidenceRepo.getEvidenceAttempts(task.id))),
        Promise.all(result.tasks.map((task) => options.evidenceRepo.getTaskReviews(task.id))),
      ]);
      return reply.status(200).send({
        data: await Promise.all(
          result.tasks.map((task, index) =>
            addEvidenceDisplayUrls(toTaskDto(task, attempts[index], reviews[index]?.at(-1)), options.storagePort),
          ),
        ),
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
      const [attempts, reviews] = await Promise.all([
        options.evidenceRepo.getEvidenceAttempts(task.id),
        options.evidenceRepo.getTaskReviews(task.id),
      ]);
      return reply
        .status(200)
        .send({ data: await addEvidenceDisplayUrls(toTaskDto(task, attempts, reviews.at(-1)), options.storagePort) });
    },
  );

  // OP-05: StartTask (Staff only)
  fastify.post<{ Params: { id: string }; Body: PathTaskBody<StartTaskRequest> }>(
    '/v1/tasks/:id/start',
    {
      schema: {
        body: StartTaskRequestSchema.partial({ taskId: true }),
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, staffOnly],
    },
    async (request, reply) => {
      assertPathTaskId(request.params.id, request.body.taskId);
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(
        request,
        reply,
        options.idempotencyRepo,
        async () => {
          const task = await options.startTaskUseCase.execute(
            { ...request.body, taskId: request.params.id } as StartTaskRequest,
            actor,
          );
          return {
            status: 200,
            data: { data: toTaskDto(task) },
          };
        },
        options.uow,
      );
    },
  );

  // OP-06: ReportFieldIssue (Staff only)
  fastify.post<{ Params: { id: string }; Body: PathTaskBody<ReportFieldIssueRequest> }>(
    '/v1/tasks/:id/field-issue',
    {
      schema: {
        body: ReportFieldIssueRequestSchema.partial({ taskId: true }),
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, staffOnly],
    },
    async (request, reply) => {
      assertPathTaskId(request.params.id, request.body.taskId);
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(
        request,
        reply,
        options.idempotencyRepo,
        async () => {
          const task = await options.reportFieldIssueUseCase.execute(
            { ...request.body, taskId: request.params.id } as ReportFieldIssueRequest,
            actor,
          );
          return {
            status: 200,
            data: { data: toTaskDto(task) },
          };
        },
        options.uow,
      );
    },
  );

  // ResumeBlockedTask (Manager only)
  fastify.post<{ Params: { id: string }; Body: PathTaskBody<ResumeBlockedTaskRequest> }>(
    '/v1/tasks/:id/resume',
    {
      schema: {
        body: ResumeBlockedTaskRequestSchema.partial({ taskId: true }),
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, managerOnly],
    },
    async (request, reply) => {
      assertPathTaskId(request.params.id, request.body.taskId);
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(
        request,
        reply,
        options.idempotencyRepo,
        async () => {
          const task = await options.resumeBlockedTaskUseCase.execute(
            { ...request.body, taskId: request.params.id } as ResumeBlockedTaskRequest,
            actor,
          );
          return {
            status: 200,
            data: { data: toTaskDto(task) },
          };
        },
        options.uow,
      );
    },
  );

  // OP-10: ReassignTask (Manager only)
  fastify.post<{ Params: { id: string }; Body: PathTaskBody<ReassignTaskRequest> }>(
    '/v1/tasks/:id/reassign',
    {
      schema: {
        body: ReassignTaskRequestSchema.partial({ taskId: true }),
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, managerOnly],
    },
    async (request, reply) => {
      assertPathTaskId(request.params.id, request.body.taskId);
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(
        request,
        reply,
        options.idempotencyRepo,
        async () => {
          const task = await options.reassignTaskUseCase.execute(
            { ...request.body, taskId: request.params.id } as ReassignTaskRequest,
            actor,
          );
          return {
            status: 200,
            data: { data: toTaskDto(task) },
          };
        },
        options.uow,
      );
    },
  );

  // OP-11: CancelTask (Manager only)
  fastify.post<{ Params: { id: string }; Body: PathTaskBody<CancelTaskRequest> }>(
    '/v1/tasks/:id/cancel',
    {
      schema: {
        body: CancelTaskRequestSchema.partial({ taskId: true }),
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, managerOnly],
    },
    async (request, reply) => {
      assertPathTaskId(request.params.id, request.body.taskId);
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(
        request,
        reply,
        options.idempotencyRepo,
        async () => {
          const task = await options.cancelTaskUseCase.execute(
            { ...request.body, taskId: request.params.id } as CancelTaskRequest,
            actor,
          );
          return {
            status: 200,
            data: { data: toTaskDto(task) },
          };
        },
        options.uow,
      );
    },
  );

  // Staff Field Check-in: GPS + QR + Checklist (Staff only)
  fastify.post<{ Params: { id: string }; Body: StaffExecutionSubmitRequest }>(
    '/v1/tasks/:id/staff-checkin',
    {
      schema: {
        body: StaffExecutionSubmitRequestSchema,
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, staffOnly],
    },
    async (request, reply) => {
      if (request.body.taskId && request.body.taskId !== request.params.id) {
        throw new ValidationError(
          `Path taskId (${request.params.id}) does not match body taskId (${request.body.taskId})`,
        );
      }
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(
        request,
        reply,
        options.idempotencyRepo,
        async () => {
          const task = await options.submitEvidenceUseCase.submitStaffCheckin(
            { ...request.body, taskId: request.params.id },
            actor,
          );
          const attempts = await options.evidenceRepo.getEvidenceAttempts(task.id);
          return {
            status: 200,
            data: { data: toTaskDto(task, attempts) },
          };
        },
        options.uow,
      );
    },
  );

  // Evidence Presign URL (Staff or Supervisor)
  fastify.post<{ Params: { id: string }; Body: PresignedUploadRequest }>(
    '/v1/tasks/:id/evidence/presign',
    {
      schema: {
        body: PresignedUploadRequestSchema,
        response: { 200: PresignedUploadResponseSchema },
      },
      preHandler: [authHandler, staffOrSupervisor],
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

  // OP-14: SubmitEvidence (Staff or Supervisor)
  fastify.post<{
    Params: { id: string };
    Body: SubmitEvidenceRequest | SupervisorEvidenceSubmitRequest;
  }>(
    '/v1/tasks/:id/evidence',
    {
      schema: {
        body: z.union([SubmitEvidenceHttpBodySchema, SupervisorEvidenceSubmitRequestSchema]),
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, staffOrSupervisor],
    },
    async (request, reply) => {
      if (request.body.taskId && request.body.taskId !== request.params.id) {
        throw new ValidationError(
          `Path taskId (${request.params.id}) does not match body taskId (${request.body.taskId})`,
        );
      }
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(
        request,
        reply,
        options.idempotencyRepo,
        async () => {
          const bodyRecord = request.body as Record<string, unknown>;
          const expectedVersion =
            typeof bodyRecord['expectedVersion'] === 'number'
              ? (bodyRecord['expectedVersion'] as number)
              : typeof bodyRecord['version'] === 'number'
                ? (bodyRecord['version'] as number)
                : 0;
          const rawSupGps = bodyRecord['supervisorGpsCheck'] as
            (SubmitEvidenceRequest['supervisorGpsCheck'] & Record<string, unknown>) | undefined;
          const normalizedSupGps: SubmitEvidenceRequest['supervisorGpsCheck'] = rawSupGps
            ? {
                ...rawSupGps,
                distance:
                  typeof rawSupGps['distance'] === 'number'
                    ? rawSupGps['distance']
                    : typeof rawSupGps['distanceMeters'] === 'number'
                      ? rawSupGps['distanceMeters']
                      : 0,
              }
            : undefined;

          const task = await options.submitEvidenceUseCase.execute(
            {
              ...(request.body as SubmitEvidenceRequest),
              expectedVersion,
              ...(normalizedSupGps ? { supervisorGpsCheck: normalizedSupGps } : {}),
              taskId: request.params.id,
            },
            actor,
          );
          const attempts = await options.evidenceRepo.getEvidenceAttempts(task.id);
          return {
            status: 200,
            data: { data: toTaskDto(task, attempts) },
          };
        },
        options.uow,
      );
    },
  );

  // OP-21: ResubmitRework (Staff or Supervisor)
  fastify.post<{ Params: { id: string }; Body: Omit<ResubmitReworkRequest, 'taskId'> }>(
    '/v1/tasks/:id/rework/resubmit',
    {
      schema: {
        body: ResubmitReworkRequestSchema.omit({ taskId: true }),
        response: { 200: TaskResponseSchema },
      },
      preHandler: [authHandler, staffOrSupervisor],
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(
        request,
        reply,
        options.idempotencyRepo,
        async () => {
          const task = await options.resubmitReworkUseCase.execute(
            { ...request.body, taskId: request.params.id },
            actor,
          );
          const attempts = await options.evidenceRepo.getEvidenceAttempts(task.id);
          return {
            status: 200,
            data: { data: toTaskDto(task, attempts) },
          };
        },
        options.uow,
      );
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
      if (
        (request.body as { taskId?: string }).taskId &&
        (request.body as { taskId?: string }).taskId !== request.params.id
      ) {
        throw new ValidationError(
          `Path taskId (${request.params.id}) does not match body taskId (${(request.body as { taskId?: string }).taskId})`,
        );
      }
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      await executeWithIdempotency(
        request,
        reply,
        options.idempotencyRepo,
        async () => {
          const task = await options.reviewTaskUseCase.execute({ ...request.body, taskId: request.params.id }, actor);
          const [attempts, reviews] = await Promise.all([
            options.evidenceRepo.getEvidenceAttempts(task.id),
            options.evidenceRepo.getTaskReviews(task.id),
          ]);
          return {
            status: 200,
            data: { data: toTaskDto(task, attempts, reviews.at(-1)) },
          };
        },
        options.uow,
      );
    },
  );
};
