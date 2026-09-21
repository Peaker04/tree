import type { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import {
  ListTreesQuerySchema,
  TreeResponseSchema,
  TreeListResponseSchema,
  CareHistoryListResponseSchema,
  type ListTreesQuery,
  type CanonicalTreeDto,
  type CanonicalCareHistoryDto,
} from '@novyx/contracts';
import type { GetTreeUseCase } from '../../../modules/tree-asset-registry/application/use-cases/get-tree.use-case';
import type { ListTreesUseCase } from '../../../modules/tree-asset-registry/application/use-cases/list-trees.use-case';
import type { GetCareHistoryUseCase } from '../../../modules/tree-asset-registry/application/use-cases/get-care-history.use-case';
import type { Tree } from '../../../modules/tree-asset-registry/domain/tree.entity';
import type { CareHistoryRecord } from '../../../modules/tree-asset-registry/domain/care-history.entity';

export interface TreeRouteOptions {
  getTreeUseCase: GetTreeUseCase;
  listTreesUseCase: ListTreesUseCase;
  getCareHistoryUseCase: GetCareHistoryUseCase;
  authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
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

function toCareHistoryDto(rec: CareHistoryRecord): CanonicalCareHistoryDto {
  const dto: CanonicalCareHistoryDto = {
    id: rec.id,
    treeId: rec.treeId,
    taskId: rec.taskId,
    taskTitle: rec.taskTitle,
    staffId: rec.staffId,
    staffName: rec.staffName,
    completedAt: rec.completedAt.toISOString(),
    status: 'COMPLETED',
    hasException: rec.hasException,
  };
  if (rec.exceptionReason !== undefined) dto.exceptionReason = rec.exceptionReason;
  if (rec.gpsCheck !== undefined) dto.gpsCheck = rec.gpsCheck as CanonicalCareHistoryDto['gpsCheck'];
  if (rec.qrCheck !== undefined) dto.qrCheck = rec.qrCheck as CanonicalCareHistoryDto['qrCheck'];
  if (rec.beforePhoto !== undefined) dto.beforePhoto = rec.beforePhoto;
  if (rec.afterPhoto !== undefined) dto.afterPhoto = rec.afterPhoto;
  if (rec.notes !== undefined) dto.notes = rec.notes;
  return dto;
}

export const treeRoutes: FastifyPluginAsync<TreeRouteOptions> = async (
  fastify: FastifyInstance,
  options: TreeRouteOptions,
) => {
  const authPreHandlers = [options.authenticate];

  // List trees (supports query filter, riskStatus, cursor, limit)
  fastify.get<{ Querystring: ListTreesQuery }>(
    '/v1/trees',
    {
      schema: {
        querystring: ListTreesQuerySchema,
        response: {
          200: TreeListResponseSchema,
        },
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      const result = await options.listTreesUseCase.execute(request.query);
      return reply.status(200).send({
        data: result.trees.map(toTreeDto),
        meta: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    },
  );

  // Get tree by ID
  fastify.get<{ Params: { id: string } }>(
    '/v1/trees/:id',
    {
      schema: {
        response: {
          200: TreeResponseSchema,
        },
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      const tree = await options.getTreeUseCase.execute(request.params.id);
      return reply.status(200).send({ data: toTreeDto(tree) });
    },
  );

  // Get tree care history (read-only historical projection)
  fastify.get<{ Params: { id: string } }>(
    '/v1/trees/:id/care-history',
    {
      schema: {
        response: {
          200: CareHistoryListResponseSchema,
        },
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      const records = await options.getCareHistoryUseCase.execute(request.params.id);
      return reply.status(200).send({
        data: records.map(toCareHistoryDto),
        meta: {
          nextCursor: null,
          hasMore: false,
        },
      });
    },
  );
};
