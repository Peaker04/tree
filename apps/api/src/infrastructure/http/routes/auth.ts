import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RefreshTokenRequestSchema,
  type LoginRequest,
  type RefreshTokenRequest,
} from '@novyx/contracts';
import type { LoginUseCase } from '../../../modules/iam/application/use-cases/login.use-case';
import type { RefreshTokenUseCase } from '../../../modules/iam/application/use-cases/refresh-token.use-case';
import type { LogoutUseCase } from '../../../modules/iam/application/use-cases/logout.use-case';
import type { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthRouteOptions {
  loginUseCase: LoginUseCase;
  refreshTokenUseCase: RefreshTokenUseCase;
  logoutUseCase: LogoutUseCase;
  authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

export const authRoutes: FastifyPluginAsync<AuthRouteOptions> = async (
  fastify: FastifyInstance,
  options: AuthRouteOptions,
) => {
  // Public Login route
  fastify.post<{ Body: LoginRequest }>(
    '/v1/auth/login',
    {
      schema: {
        body: LoginRequestSchema,
        response: {
          200: LoginResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await options.loginUseCase.execute(request.body.identifier, request.body.password);
      return reply.status(200).send(result);
    },
  );

  // Public Refresh route (rotating credentials, reuse detection)
  fastify.post<{ Body: RefreshTokenRequest }>(
    '/v1/auth/refresh',
    {
      schema: {
        body: RefreshTokenRequestSchema,
        response: {
          200: LoginResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await options.refreshTokenUseCase.execute(request.body.refreshToken);
      return reply.status(200).send(result);
    },
  );

  // Protected Logout route (revokes session/token family)
  fastify.post(
    '/v1/auth/logout',
    {
      preHandler: [options.authenticate],
    },
    async (request, reply) => {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        await options.logoutUseCase.execute(token);
      }
      return reply.status(204).send();
    },
  );
};
