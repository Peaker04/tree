import Fastify, { type FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import type pg from 'pg';
import { healthRoutes } from './infrastructure/http/routes/health';
import { AppError } from './core/errors';

export interface AppOptions {
  logger?: boolean | undefined;
  pool?: pg.Pool | undefined;
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const server = Fastify({
    logger: options.logger ?? false,
  }).withTypeProvider<ZodTypeProvider>();

  // Register Zod compiler for validation and serialization
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  // Register Infrastructure health routes
  server.register(healthRoutes, { pool: options.pool });

  // Standardized error handler
  server.setErrorHandler((error: unknown, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    const fastifyErr = error as { validation?: unknown; message?: string };
    if (fastifyErr.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_FAILED',
          message: fastifyErr.message ?? 'Validation failed',
          details: fastifyErr.validation,
        },
      });
    }

    server.log.error(error);
    return reply.status(500).send({
      error: {
        code: 'INTERNAL',
        message: 'Internal server error',
      },
    });
  });

  return server;
}
