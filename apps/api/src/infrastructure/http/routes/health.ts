import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type pg from 'pg';
import { checkDbConnection } from '../../persistence/db';

export interface HealthRouteOptions {
  pool?: pg.Pool | undefined;
}

export const healthRoutes: FastifyPluginAsync<HealthRouteOptions> = async (
  fastify: FastifyInstance,
  options: HealthRouteOptions,
) => {
  // Operational Liveness check (GET /health)
  fastify.get('/health', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok' });
  });

  // Operational Readiness check (GET /ready)
  fastify.get('/ready', async (_request, reply) => {
    if (!options.pool) {
      return reply.status(200).send({
        status: 'ok',
        database: 'not_configured',
      });
    }

    const isConnected = await checkDbConnection(options.pool);
    if (!isConnected) {
      return reply.status(503).send({
        status: 'unavailable',
        database: 'disconnected',
      });
    }

    return reply.status(200).send({
      status: 'ok',
      database: 'connected',
    });
  });
};
