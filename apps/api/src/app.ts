import Fastify, { type FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import type pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { healthRoutes } from './infrastructure/http/routes/health';
import { authRoutes } from './infrastructure/http/routes/auth';
import { governanceUserRoutes } from './infrastructure/http/routes/governance-users';
import { createAuthGate, requireRoles } from './infrastructure/http/middleware/auth-gate';
import { DrizzleUserRepository } from './infrastructure/persistence/repositories/drizzle-user-repository';
import { DrizzleSessionRepository } from './infrastructure/persistence/repositories/drizzle-session-repository';
import { DrizzleAuditWriter } from './infrastructure/persistence/repositories/drizzle-audit-writer';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher';
import { CryptoTokenService } from './infrastructure/security/crypto-token-service';
import { InMemoryCredentialSetupDelivery } from './infrastructure/security/in-memory-credential-setup-delivery';
import { AuditService } from './modules/audit-compliance/application/services/audit.service';
import { LoginUseCase } from './modules/iam/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './modules/iam/application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './modules/iam/application/use-cases/logout.use-case';
import { ProvisionUserUseCase } from './modules/iam/application/use-cases/provision-user.use-case';
import { AssignRoleUseCase } from './modules/iam/application/use-cases/assign-role.use-case';
import { ActivateAccountUseCase } from './modules/iam/application/use-cases/activate-account.use-case';
import { SuspendAccountUseCase } from './modules/iam/application/use-cases/suspend-account.use-case';
import { DisableAccountUseCase } from './modules/iam/application/use-cases/disable-account.use-case';
import { UnlockAccountUseCase } from './modules/iam/application/use-cases/unlock-account.use-case';
import { ResetCredentialSetupUseCase } from './modules/iam/application/use-cases/reset-credential-setup.use-case';
import type { IUserRepository } from './modules/iam/application/ports/user-repository.port';
import type { ISessionRepository } from './modules/iam/application/ports/session-repository.port';
import type { IPasswordHasher } from './modules/iam/application/ports/password-hasher.port';
import type { ITokenService } from './modules/iam/application/ports/token-service.port';
import type { ICredentialSetupDeliveryPort } from './modules/iam/application/ports/credential-setup-delivery.port';
import type { IAuditWriter } from './modules/audit-compliance/application/ports/audit-writer.port';
import { AppError } from './core/errors';
import * as schema from './infrastructure/persistence/schema';

export interface AppOptions {
  logger?: boolean | undefined;
  pool?: pg.Pool | undefined;
  userRepository?: IUserRepository | undefined;
  sessionRepository?: ISessionRepository | undefined;
  auditWriter?: IAuditWriter | undefined;
  passwordHasher?: IPasswordHasher | undefined;
  tokenService?: ITokenService | undefined;
  deliveryPort?: ICredentialSetupDeliveryPort | undefined;
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

  // If pool or repositories are supplied, wire IAM and Governance routes
  if (options.pool || options.userRepository) {
    const db = options.pool ? drizzle(options.pool, { schema }) : null;

    const userRepo: IUserRepository =
      options.userRepository ?? (db ? new DrizzleUserRepository(db) : (null as unknown as IUserRepository));
    const sessionRepo: ISessionRepository =
      options.sessionRepository ?? (db ? new DrizzleSessionRepository(db) : (null as unknown as ISessionRepository));
    const auditWriter: IAuditWriter =
      options.auditWriter ?? (db ? new DrizzleAuditWriter(db) : (null as unknown as IAuditWriter));

    const passwordHasher = options.passwordHasher ?? new Argon2PasswordHasher();
    const tokenService = options.tokenService ?? new CryptoTokenService();
    const deliveryPort = options.deliveryPort ?? new InMemoryCredentialSetupDelivery();
    const auditService = new AuditService(auditWriter);

    const authenticate = createAuthGate(userRepo, sessionRepo, tokenService);
    const requireAdmin = requireRoles('admin');

    const loginUseCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService);
    const refreshTokenUseCase = new RefreshTokenUseCase(userRepo, sessionRepo, tokenService);
    const logoutUseCase = new LogoutUseCase(sessionRepo, tokenService);

    const provisionUserUseCase = new ProvisionUserUseCase(userRepo, auditService);
    const assignRoleUseCase = new AssignRoleUseCase(userRepo, sessionRepo, auditService);
    const activateAccountUseCase = new ActivateAccountUseCase(userRepo, auditService);
    const suspendAccountUseCase = new SuspendAccountUseCase(userRepo, sessionRepo, auditService);
    const disableAccountUseCase = new DisableAccountUseCase(userRepo, sessionRepo, auditService);
    const unlockAccountUseCase = new UnlockAccountUseCase(userRepo, auditService);
    const resetCredentialSetupUseCase = new ResetCredentialSetupUseCase(
      userRepo,
      sessionRepo,
      tokenService,
      deliveryPort,
      auditService,
    );

    // Register auth routes
    server.register(authRoutes, {
      loginUseCase,
      refreshTokenUseCase,
      logoutUseCase,
      authenticate,
    });

    // Register governance routes
    server.register(governanceUserRoutes, {
      provisionUserUseCase,
      assignRoleUseCase,
      activateAccountUseCase,
      suspendAccountUseCase,
      disableAccountUseCase,
      unlockAccountUseCase,
      resetCredentialSetupUseCase,
      authenticate,
      requireAdmin,
    });
  }

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
