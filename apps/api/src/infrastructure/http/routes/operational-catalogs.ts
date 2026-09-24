import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { AssignableStaffCatalogResponseSchema, OperationalTaskTypeCatalogResponseSchema } from '@novyx/contracts';
import type { ListAssignableStaffUseCase } from '../../../modules/work-management/application/use-cases/list-assignable-staff.use-case';
import type { ListOperationalTaskTypesUseCase } from '../../../modules/work-management/application/use-cases/list-operational-task-types.use-case';

export interface OperationalCatalogRouteOptions {
  listAssignableStaffUseCase: ListAssignableStaffUseCase;
  listOperationalTaskTypesUseCase: ListOperationalTaskTypesUseCase;
  authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  requireRoles: (
    ...roles: ('staff' | 'manager' | 'admin')[]
  ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

export const operationalCatalogRoutes: FastifyPluginAsync<OperationalCatalogRouteOptions> = async (
  fastify: FastifyInstance,
  options: OperationalCatalogRouteOptions,
) => {
  const managerOnly = options.requireRoles('manager');

  fastify.get(
    '/v1/operational/task-types',
    {
      schema: { response: { 200: OperationalTaskTypeCatalogResponseSchema } },
      preHandler: [options.authenticate, managerOnly],
    },
    async (request, reply) => {
      const data = await options.listOperationalTaskTypesUseCase.execute(request.actor!.id);
      return reply.status(200).send({ data });
    },
  );

  fastify.get(
    '/v1/operational/assignable-staff',
    {
      schema: { response: { 200: AssignableStaffCatalogResponseSchema } },
      preHandler: [options.authenticate, managerOnly],
    },
    async (request, reply) => {
      const data = await options.listAssignableStaffUseCase.execute(request.actor!.id);
      return reply.status(200).send({ data });
    },
  );
};
