import type { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateTreeRequestSchema,
  UpdateTreeMasterDataRequestSchema,
  ReplaceTreeQrCodeRequestSchema,
  UpdateCanonicalCoordinatesRequestSchema,
  RetireTreeRequestSchema,
  TreeResponseSchema,
  CreateTaskTypeRequestSchema,
  ActivateTaskTypeRequestSchema,
  DeactivateTaskTypeRequestSchema,
  TaskTypeResponseSchema,
  TaskTypeListResponseSchema,
  PublishProofPolicyVersionRequestSchema,
  ProofPolicyVersionResponseSchema,
  PublishChecklistTemplateVersionRequestSchema,
  ChecklistTemplateVersionResponseSchema,
  type CreateTreeRequest,
  type UpdateTreeMasterDataRequest,
  type ReplaceTreeQrCodeRequest,
  type UpdateCanonicalCoordinatesRequest,
  type RetireTreeRequest,
  type CanonicalTreeDto,
  type CreateTaskTypeRequest,
  type ActivateTaskTypeRequest,
  type DeactivateTaskTypeRequest,
  type TaskTypeDto,
  type PublishProofPolicyVersionRequest,
  type ProofPolicyVersionDto,
  type PublishChecklistTemplateVersionRequest,
  type ChecklistTemplateVersionDto,
} from '@novyx/contracts';
import type { CreateTreeUseCase } from '../../../modules/tree-asset-registry/application/use-cases/create-tree.use-case';
import type { UpdateTreeMasterDataUseCase } from '../../../modules/tree-asset-registry/application/use-cases/update-tree-master-data.use-case';
import type { ReplaceTreeQrCodeUseCase } from '../../../modules/tree-asset-registry/application/use-cases/replace-tree-qr-code.use-case';
import type { UpdateCanonicalCoordinatesUseCase } from '../../../modules/tree-asset-registry/application/use-cases/update-canonical-coordinates.use-case';
import type { RetireTreeUseCase } from '../../../modules/tree-asset-registry/application/use-cases/retire-tree.use-case';
import type { CreateTaskTypeUseCase } from '../../../modules/policy-template-governance/application/use-cases/create-task-type.use-case';
import type { ActivateTaskTypeUseCase } from '../../../modules/policy-template-governance/application/use-cases/activate-task-type.use-case';
import type { DeactivateTaskTypeUseCase } from '../../../modules/policy-template-governance/application/use-cases/deactivate-task-type.use-case';
import type { PublishProofPolicyVersionUseCase } from '../../../modules/policy-template-governance/application/use-cases/publish-proof-policy.use-case';
import type { PublishChecklistTemplateVersionUseCase } from '../../../modules/policy-template-governance/application/use-cases/publish-checklist-template.use-case';
import type { ITaskTypeRepository } from '../../../modules/policy-template-governance/application/ports/task-type-repository.port';
import type { Tree } from '../../../modules/tree-asset-registry/domain/tree.entity';
import type { TaskType } from '../../../modules/policy-template-governance/domain/task-type.entity';
import type {
  ProofPolicyVersion,
  ChecklistTemplateVersion,
} from '../../../modules/policy-template-governance/domain/policy-version.entity';
import { ValidationError } from '../../../core/errors';

export interface GovernanceOperationalRouteOptions {
  createTreeUseCase: CreateTreeUseCase;
  updateTreeMasterDataUseCase: UpdateTreeMasterDataUseCase;
  replaceTreeQrCodeUseCase: ReplaceTreeQrCodeUseCase;
  updateCanonicalCoordinatesUseCase: UpdateCanonicalCoordinatesUseCase;
  retireTreeUseCase: RetireTreeUseCase;
  createTaskTypeUseCase: CreateTaskTypeUseCase;
  activateTaskTypeUseCase: ActivateTaskTypeUseCase;
  deactivateTaskTypeUseCase: DeactivateTaskTypeUseCase;
  publishProofPolicyVersionUseCase: PublishProofPolicyVersionUseCase;
  publishChecklistTemplateVersionUseCase: PublishChecklistTemplateVersionUseCase;
  taskTypeRepo: ITaskTypeRepository;
  authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  requireRoles: (
    ...roles: ('staff' | 'manager' | 'admin')[]
  ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function toTreeDto(tree: Tree): CanonicalTreeDto {
  const dto: CanonicalTreeDto = {
    id: tree.id,
    version: tree.version,
    name: tree.name,
    species: tree.species,
    lat: tree.lat,
    lng: tree.lng,
    address: tree.address,
    qrCode: tree.qrCode,
    healthStatus: tree.healthStatus as CanonicalTreeDto['healthStatus'],
    ageYears: tree.ageYears,
    isRetired: tree.isRetired,
  };
  if (tree.riskStatus !== undefined) dto.riskStatus = tree.riskStatus as CanonicalTreeDto['riskStatus'];
  if (tree.retiredAt !== undefined) dto.retiredAt = tree.retiredAt.toISOString();
  return dto;
}

function toTaskTypeDto(tt: TaskType): TaskTypeDto {
  return {
    id: tt.id,
    version: tt.version,
    name: tt.name,
    description: tt.description,
    defaultProofProfile: tt.defaultProofProfile,
    isActive: tt.isActive,
    createdAt: tt.createdAt.toISOString(),
    updatedAt: tt.updatedAt.toISOString(),
  };
}

function toPolicyDto(p: ProofPolicyVersion): ProofPolicyVersionDto {
  return {
    id: p.id,
    taskTypeId: p.taskTypeId,
    versionNumber: p.versionNumber,
    proofProfile: p.proofProfile,
    policyDescription: p.policyDescription,
    publishedAt: p.publishedAt.toISOString(),
  };
}

function toTemplateDto(t: ChecklistTemplateVersion): ChecklistTemplateVersionDto {
  return {
    id: t.id,
    taskTypeId: t.taskTypeId,
    versionNumber: t.versionNumber,
    templateItems: t.templateItems,
    templateDescription: t.templateDescription,
    publishedAt: t.publishedAt.toISOString(),
  };
}

export const governanceOperationalRoutes: FastifyPluginAsync<GovernanceOperationalRouteOptions> = async (
  fastify: FastifyInstance,
  options: GovernanceOperationalRouteOptions,
) => {
  const adminPreHandlers = [options.authenticate, options.requireAdmin];
  const treeCreatePreHandlers = [options.authenticate, options.requireRoles('manager', 'admin')];

  // Tree Governance
  fastify.post<{ Body: CreateTreeRequest }>(
    '/v1/governance/trees',
    {
      schema: {
        body: CreateTreeRequestSchema,
        response: { 201: TreeResponseSchema },
      },
      preHandler: treeCreatePreHandlers,
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const tree = await options.createTreeUseCase.execute(request.body, actor);
      return reply.status(201).send({ data: toTreeDto(tree) });
    },
  );

  fastify.put<{ Params: { id: string }; Body: UpdateTreeMasterDataRequest }>(
    '/v1/governance/trees/:id',
    {
      schema: {
        body: UpdateTreeMasterDataRequestSchema,
        response: { 200: TreeResponseSchema },
      },
      preHandler: adminPreHandlers,
    },
    async (request, reply) => {
      if (request.body.treeId && request.body.treeId !== request.params.id) {
        throw new ValidationError(
          `Path treeId (${request.params.id}) does not match body treeId (${request.body.treeId})`,
        );
      }
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const tree = await options.updateTreeMasterDataUseCase.execute(
        { ...request.body, treeId: request.params.id },
        actor,
      );
      return reply.status(200).send({ data: toTreeDto(tree) });
    },
  );

  fastify.post<{ Params: { id: string }; Body: ReplaceTreeQrCodeRequest }>(
    '/v1/governance/trees/:id/replace-qr',
    {
      schema: {
        body: ReplaceTreeQrCodeRequestSchema,
        response: { 200: TreeResponseSchema },
      },
      preHandler: adminPreHandlers,
    },
    async (request, reply) => {
      if (request.body.treeId && request.body.treeId !== request.params.id) {
        throw new ValidationError(
          `Path treeId (${request.params.id}) does not match body treeId (${request.body.treeId})`,
        );
      }
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const tree = await options.replaceTreeQrCodeUseCase.execute(
        { ...request.body, treeId: request.params.id },
        actor,
      );
      return reply.status(200).send({ data: toTreeDto(tree) });
    },
  );

  fastify.put<{ Params: { id: string }; Body: UpdateCanonicalCoordinatesRequest }>(
    '/v1/governance/trees/:id/coordinates',
    {
      schema: {
        body: UpdateCanonicalCoordinatesRequestSchema,
        response: { 200: TreeResponseSchema },
      },
      preHandler: adminPreHandlers,
    },
    async (request, reply) => {
      if (request.body.treeId && request.body.treeId !== request.params.id) {
        throw new ValidationError(
          `Path treeId (${request.params.id}) does not match body treeId (${request.body.treeId})`,
        );
      }
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const tree = await options.updateCanonicalCoordinatesUseCase.execute(
        { ...request.body, treeId: request.params.id },
        actor,
      );
      return reply.status(200).send({ data: toTreeDto(tree) });
    },
  );

  fastify.post<{ Params: { id: string }; Body: RetireTreeRequest }>(
    '/v1/governance/trees/:id/retire',
    {
      schema: {
        body: RetireTreeRequestSchema,
        response: { 200: TreeResponseSchema },
      },
      preHandler: adminPreHandlers,
    },
    async (request, reply) => {
      if (request.body.treeId && request.body.treeId !== request.params.id) {
        throw new ValidationError(
          `Path treeId (${request.params.id}) does not match body treeId (${request.body.treeId})`,
        );
      }
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const tree = await options.retireTreeUseCase.execute({ ...request.body, treeId: request.params.id }, actor);
      return reply.status(200).send({ data: toTreeDto(tree) });
    },
  );

  // TaskType Governance
  fastify.post<{ Body: CreateTaskTypeRequest }>(
    '/v1/governance/task-types',
    {
      schema: {
        body: CreateTaskTypeRequestSchema,
        response: { 201: TaskTypeResponseSchema },
      },
      preHandler: adminPreHandlers,
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const taskType = await options.createTaskTypeUseCase.execute(request.body, actor);
      return reply.status(201).send({ data: toTaskTypeDto(taskType) });
    },
  );

  fastify.post<{ Params: { id: string }; Body: ActivateTaskTypeRequest }>(
    '/v1/governance/task-types/:id/activate',
    {
      schema: {
        body: ActivateTaskTypeRequestSchema,
        response: { 200: TaskTypeResponseSchema },
      },
      preHandler: adminPreHandlers,
    },
    async (request, reply) => {
      if (request.body.taskTypeId && request.body.taskTypeId !== request.params.id) {
        throw new ValidationError(
          `Path taskTypeId (${request.params.id}) does not match body taskTypeId (${request.body.taskTypeId})`,
        );
      }
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const taskType = await options.activateTaskTypeUseCase.execute(
        { ...request.body, taskTypeId: request.params.id },
        actor,
      );
      return reply.status(200).send({ data: toTaskTypeDto(taskType) });
    },
  );

  fastify.post<{ Params: { id: string }; Body: DeactivateTaskTypeRequest }>(
    '/v1/governance/task-types/:id/deactivate',
    {
      schema: {
        body: DeactivateTaskTypeRequestSchema,
        response: { 200: TaskTypeResponseSchema },
      },
      preHandler: adminPreHandlers,
    },
    async (request, reply) => {
      if (request.body.taskTypeId && request.body.taskTypeId !== request.params.id) {
        throw new ValidationError(
          `Path taskTypeId (${request.params.id}) does not match body taskTypeId (${request.body.taskTypeId})`,
        );
      }
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const taskType = await options.deactivateTaskTypeUseCase.execute(
        { ...request.body, taskTypeId: request.params.id },
        actor,
      );
      return reply.status(200).send({ data: toTaskTypeDto(taskType) });
    },
  );

  fastify.get(
    '/v1/governance/task-types',
    {
      schema: {
        response: { 200: TaskTypeListResponseSchema },
      },
      preHandler: [options.authenticate],
    },
    async (_request, reply) => {
      const items = await options.taskTypeRepo.listAll();
      return reply.status(200).send({
        data: items.map(toTaskTypeDto),
        meta: { nextCursor: null, hasMore: false },
      });
    },
  );

  // Policy & Checklist Governance
  fastify.post<{ Body: PublishProofPolicyVersionRequest }>(
    '/v1/governance/policies/proof',
    {
      schema: {
        body: PublishProofPolicyVersionRequestSchema,
        response: { 201: ProofPolicyVersionResponseSchema },
      },
      preHandler: adminPreHandlers,
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const policy = await options.publishProofPolicyVersionUseCase.execute(request.body, actor);
      return reply.status(201).send({ data: toPolicyDto(policy) });
    },
  );

  fastify.post<{ Body: PublishChecklistTemplateVersionRequest }>(
    '/v1/governance/policies/checklist',
    {
      schema: {
        body: PublishChecklistTemplateVersionRequestSchema,
        response: { 201: ChecklistTemplateVersionResponseSchema },
      },
      preHandler: adminPreHandlers,
    },
    async (request, reply) => {
      const actor = { actorId: request.actor!.id, actorRole: request.actor!.role };
      const template = await options.publishChecklistTemplateVersionUseCase.execute(request.body, actor);
      return reply.status(201).send({ data: toTemplateDto(template) });
    },
  );
};
