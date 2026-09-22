import type { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import {
  ListGovernanceUsersResponseSchema,
  ListGovernanceUsersQuerySchema,
  ProvisionUserRequestSchema,
  AssignRoleRequestSchema,
  ActivateAccountRequestSchema,
  SuspendAccountRequestSchema,
  DisableAccountRequestSchema,
  UnlockAccountRequestSchema,
  ResetCredentialSetupRequestSchema,
  GovernanceUserResponseSchema,
  type ProvisionUserRequest,
  type AssignRoleRequest,
  type ActivateAccountRequest,
  type SuspendAccountRequest,
  type DisableAccountRequest,
  type UnlockAccountRequest,
  type ResetCredentialSetupRequest,
  type GovernanceUserDto,
  type ListGovernanceUsersQuery,
} from '@novyx/contracts';
import type { ProvisionUserUseCase } from '../../../modules/iam/application/use-cases/provision-user.use-case';
import type { AssignRoleUseCase } from '../../../modules/iam/application/use-cases/assign-role.use-case';
import type { ActivateAccountUseCase } from '../../../modules/iam/application/use-cases/activate-account.use-case';
import type { SuspendAccountUseCase } from '../../../modules/iam/application/use-cases/suspend-account.use-case';
import type { DisableAccountUseCase } from '../../../modules/iam/application/use-cases/disable-account.use-case';
import type { UnlockAccountUseCase } from '../../../modules/iam/application/use-cases/unlock-account.use-case';
import type { ResetCredentialSetupUseCase } from '../../../modules/iam/application/use-cases/reset-credential-setup.use-case';
import type { UserAccount } from '../../../modules/iam/domain/entities/user';
import { ValidationError } from '../../../core/errors';

export interface GovernanceUserRouteOptions {
  userRepository: any; // Quick type patch, will replace with proper IUserRepository later
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

function toGovernanceUserDto(user: UserAccount): GovernanceUserDto {
  return {
    id: user.id,
    version: user.version,
    email: user.email,
    phone: user.phone,
    role: user.role,
    accountStatus: user.accountStatus,
  };
}

function assertPathBodyMatch(pathId: string | undefined, bodyUserId: string | undefined): void {
  if (pathId && bodyUserId && pathId !== bodyUserId) {
    throw new ValidationError(
      `Path parameter ':id' (${pathId}) does not match body parameter 'userId' (${bodyUserId})`,
    );
  }
}

export const governanceUserRoutes: FastifyPluginAsync<GovernanceUserRouteOptions> = async (
  fastify: FastifyInstance,
  options: GovernanceUserRouteOptions,
) => {
  // All governance routes are Tier-2 guarded: authenticated + admin role required
  const authPreHandlers = [options.authenticate, options.requireAdmin];

  // GV-01: ProvisionUser
    fastify.get<{ Querystring: ListGovernanceUsersQuery }>(
    '/v1/governance/users',
    {
      schema: {
        querystring: ListGovernanceUsersQuerySchema,
        response: {
          200: ListGovernanceUsersResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { limit, cursor } = request.query;
      const result = await options.userRepository.listUsers(limit, cursor);
      const data: GovernanceUserDto[] = result.data.map((u: any) => ({
        id: u.id,
        version: u.version,
        email: u.email,
        phone: u.phone,
        role: u.role,
        accountStatus: u.accountStatus,
      }));
      return reply.code(200).send({ data, meta: result.meta });
    }
  );

  fastify.post<{ Body: ProvisionUserRequest }>(
    '/v1/governance/users',
    {
      schema: {
        body: ProvisionUserRequestSchema,
        response: {
          201: GovernanceUserResponseSchema,
        },
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
      return reply.status(201).send({ data: toGovernanceUserDto(user) });
    },
  );

  // GV-02: AssignRole
  fastify.post<{ Params: { id?: string }; Body: AssignRoleRequest }>(
    '/v1/governance/users/:id/role',
    {
      schema: {
        body: AssignRoleRequestSchema,
        response: {
          200: GovernanceUserResponseSchema,
        },
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      assertPathBodyMatch(request.params.id, request.body.userId);
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const user = await options.assignRoleUseCase.execute(request.body, actor);
      return reply.status(200).send({ data: toGovernanceUserDto(user) });
    },
  );

  // GV-03: ActivateAccount
  fastify.post<{ Params: { id?: string }; Body: ActivateAccountRequest }>(
    '/v1/governance/users/:id/activate',
    {
      schema: {
        body: ActivateAccountRequestSchema,
        response: {
          200: GovernanceUserResponseSchema,
        },
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      assertPathBodyMatch(request.params.id, request.body.userId);
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const user = await options.activateAccountUseCase.execute(request.body, actor);
      return reply.status(200).send({ data: toGovernanceUserDto(user) });
    },
  );

  // GV-04: SuspendAccount
  fastify.post<{ Params: { id?: string }; Body: SuspendAccountRequest }>(
    '/v1/governance/users/:id/suspend',
    {
      schema: {
        body: SuspendAccountRequestSchema,
        response: {
          200: GovernanceUserResponseSchema,
        },
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      assertPathBodyMatch(request.params.id, request.body.userId);
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const user = await options.suspendAccountUseCase.execute(request.body, actor);
      return reply.status(200).send({ data: toGovernanceUserDto(user) });
    },
  );

  // GV-05: DisableAccount
  fastify.post<{ Params: { id?: string }; Body: DisableAccountRequest }>(
    '/v1/governance/users/:id/disable',
    {
      schema: {
        body: DisableAccountRequestSchema,
        response: {
          200: GovernanceUserResponseSchema,
        },
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      assertPathBodyMatch(request.params.id, request.body.userId);
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const user = await options.disableAccountUseCase.execute(request.body, actor);
      return reply.status(200).send({ data: toGovernanceUserDto(user) });
    },
  );

  // GV-06: UnlockAccount
  fastify.post<{ Params: { id?: string }; Body: UnlockAccountRequest }>(
    '/v1/governance/users/:id/unlock',
    {
      schema: {
        body: UnlockAccountRequestSchema,
        response: {
          200: GovernanceUserResponseSchema,
        },
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      assertPathBodyMatch(request.params.id, request.body.userId);
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const user = await options.unlockAccountUseCase.execute(request.body, actor);
      return reply.status(200).send({ data: toGovernanceUserDto(user) });
    },
  );

  // GV-07: ResetCredentialSetup
  fastify.post<{ Params: { id?: string }; Body: ResetCredentialSetupRequest }>(
    '/v1/governance/users/:id/reset-credential',
    {
      schema: {
        body: ResetCredentialSetupRequestSchema,
        response: {
          200: GovernanceUserResponseSchema,
        },
      },
      preHandler: authPreHandlers,
    },
    async (request, reply) => {
      assertPathBodyMatch(request.params.id, request.body.userId);
      const actor = {
        id: request.actor!.id,
        role: request.actor!.role,
        clientIp: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      };
      const user = await options.resetCredentialSetupUseCase.execute(request.body, actor);
      return reply.status(200).send({ data: toGovernanceUserDto(user) });
    },
  );
};
