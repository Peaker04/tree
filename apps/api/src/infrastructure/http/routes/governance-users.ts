import type { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import {
  ProvisionUserRequestSchema,
  AssignRoleRequestSchema,
  ActivateAccountRequestSchema,
  SuspendAccountRequestSchema,
  DisableAccountRequestSchema,
  UnlockAccountRequestSchema,
  ResetCredentialSetupRequestSchema,
  type ProvisionUserRequest,
  type AssignRoleRequest,
  type ActivateAccountRequest,
  type SuspendAccountRequest,
  type DisableAccountRequest,
  type UnlockAccountRequest,
  type ResetCredentialSetupRequest,
} from '@novyx/contracts';
import type { ProvisionUserUseCase } from '../../../modules/iam/application/use-cases/provision-user.use-case';
import type { AssignRoleUseCase } from '../../../modules/iam/application/use-cases/assign-role.use-case';
import type { ActivateAccountUseCase } from '../../../modules/iam/application/use-cases/activate-account.use-case';
import type { SuspendAccountUseCase } from '../../../modules/iam/application/use-cases/suspend-account.use-case';
import type { DisableAccountUseCase } from '../../../modules/iam/application/use-cases/disable-account.use-case';
import type { UnlockAccountUseCase } from '../../../modules/iam/application/use-cases/unlock-account.use-case';
import type { ResetCredentialSetupUseCase } from '../../../modules/iam/application/use-cases/reset-credential-setup.use-case';
import type { UserAccount } from '../../../modules/iam/domain/entities/user';

export interface GovernanceUserRouteOptions {
  provisionUserUseCase: ProvisionUserUseCase;
  assignRoleUseCase: AssignRoleUseCase;
  activateAccountUseCase: ActivateAccountUseCase;
  suspendAccountUseCase: SuspendAccountUseCase;
  disableAccountUseCase: DisableAccountUseCase;
  unlockAccountUseCase: UnlockAccountUseCase;
  resetCredentialSetupUseCase: ResetCredentialSetupUseCase;
  authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

function sanitizeUserResponse(user: UserAccount) {
  const { passwordHash: _hash, ...safeUser } = user;
  return safeUser;
}

export const governanceUserRoutes: FastifyPluginAsync<GovernanceUserRouteOptions> = async (
  fastify: FastifyInstance,
  options: GovernanceUserRouteOptions,
) => {
  // All governance routes are Tier-2 guarded: authenticated + admin role required
  const authPreHandlers = [options.authenticate, options.requireAdmin];

  // GV-01: ProvisionUser
  fastify.post<{ Body: ProvisionUserRequest }>(
    '/v1/governance/users',
    {
      schema: {
        body: ProvisionUserRequestSchema,
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const user = await options.provisionUserUseCase.execute(request.body, actor);
      return reply.status(201).send({ data: sanitizeUserResponse(user) });
    },
  );

  // GV-02: AssignRole
  fastify.post<{ Params: { id?: string; userId?: string }; Body: AssignRoleRequest }>(
    '/v1/governance/users/:id/role',
    {
      schema: {
        body: AssignRoleRequestSchema,
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const targetUserId = request.params.id || request.body.userId;
      const user = await options.assignRoleUseCase.execute({ ...request.body, userId: targetUserId }, actor);
      return reply.status(200).send({ data: sanitizeUserResponse(user) });
    },
  );

  // GV-03: ActivateAccount
  fastify.post<{ Params: { id?: string; userId?: string }; Body: ActivateAccountRequest }>(
    '/v1/governance/users/:id/activate',
    {
      schema: {
        body: ActivateAccountRequestSchema,
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const targetUserId = request.params.id || request.body.userId;
      const user = await options.activateAccountUseCase.execute({ ...request.body, userId: targetUserId }, actor);
      return reply.status(200).send({ data: sanitizeUserResponse(user) });
    },
  );

  // GV-04: SuspendAccount
  fastify.post<{ Params: { id?: string; userId?: string }; Body: SuspendAccountRequest }>(
    '/v1/governance/users/:id/suspend',
    {
      schema: {
        body: SuspendAccountRequestSchema,
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const targetUserId = request.params.id || request.body.userId;
      const user = await options.suspendAccountUseCase.execute({ ...request.body, userId: targetUserId }, actor);
      return reply.status(200).send({ data: sanitizeUserResponse(user) });
    },
  );

  // GV-05: DisableAccount
  fastify.post<{ Params: { id?: string; userId?: string }; Body: DisableAccountRequest }>(
    '/v1/governance/users/:id/disable',
    {
      schema: {
        body: DisableAccountRequestSchema,
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const targetUserId = request.params.id || request.body.userId;
      const user = await options.disableAccountUseCase.execute({ ...request.body, userId: targetUserId }, actor);
      return reply.status(200).send({ data: sanitizeUserResponse(user) });
    },
  );

  // GV-06: UnlockAccount
  fastify.post<{ Params: { id?: string; userId?: string }; Body: UnlockAccountRequest }>(
    '/v1/governance/users/:id/unlock',
    {
      schema: {
        body: UnlockAccountRequestSchema,
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const targetUserId = request.params.id || request.body.userId;
      const user = await options.unlockAccountUseCase.execute({ ...request.body, userId: targetUserId }, actor);
      return reply.status(200).send({ data: sanitizeUserResponse(user) });
    },
  );

  // GV-07: ResetCredentialSetup
  fastify.post<{ Params: { id?: string; userId?: string }; Body: ResetCredentialSetupRequest }>(
    '/v1/governance/users/:id/reset-credential',
    {
      schema: {
        body: ResetCredentialSetupRequestSchema,
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const targetUserId = request.params.id || request.body.userId;
      const user = await options.resetCredentialSetupUseCase.execute({ ...request.body, userId: targetUserId }, actor);
      return reply.status(200).send({ data: sanitizeUserResponse(user) });
    },
  );
};
