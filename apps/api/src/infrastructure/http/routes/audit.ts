import type { FastifyPluginAsync } from 'fastify';
import { ListAuditEventsQuerySchema, ListAuditEventsResponseSchema, type ListAuditEventsQuery } from '@novyx/contracts';

export interface AuditRouteOptions {
  auditWriter: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  authenticate: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  requireAdmin: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const auditRoutes: FastifyPluginAsync<AuditRouteOptions> = async (fastify, options) => {
  fastify.get<{ Querystring: ListAuditEventsQuery }>(
    '/v1/audit/events',
    {
      schema: {
        querystring: ListAuditEventsQuerySchema,
        response: {
          200: ListAuditEventsResponseSchema,
        },
      },
      preHandler: [options.authenticate, options.requireAdmin],
    },
    async (request, reply) => {
      const { limit, cursor } = request.query;
      const result = await options.auditWriter.listEvents(limit, cursor);
      return reply.code(200).send({ data: result.data, meta: result.meta });
    },
  );
};
