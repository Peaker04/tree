import Fastify, { type FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import type pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { healthRoutes } from './infrastructure/http/routes/health';
import { authRoutes } from './infrastructure/http/routes/auth';
import { governanceUserRoutes } from './infrastructure/http/routes/governance-users';
import { treeRoutes } from './infrastructure/http/routes/trees';
import { governanceOperationalRoutes } from './infrastructure/http/routes/governance-operational';
import { taskRoutes } from './infrastructure/http/routes/tasks';
import { createAuthGate, requireRoles } from './infrastructure/http/middleware/auth-gate';
import { DrizzleUserRepository } from './infrastructure/persistence/repositories/drizzle-user-repository';
import { DrizzleSessionRepository } from './infrastructure/persistence/repositories/drizzle-session-repository';
import { DrizzleAuditWriter } from './infrastructure/persistence/repositories/drizzle-audit-writer';
import { DrizzleIamUnitOfWork } from './infrastructure/persistence/repositories/drizzle-iam-unit-of-work';
import { DrizzleTreeRepository } from './infrastructure/persistence/repositories/drizzle-tree-repository';
import { DrizzleCareHistoryRepository } from './infrastructure/persistence/repositories/drizzle-care-history-repository';
import { DrizzleTaskTypeRepository } from './infrastructure/persistence/repositories/drizzle-task-type-repository';
import { DrizzlePolicyRepository } from './infrastructure/persistence/repositories/drizzle-policy-repository';
import { DrizzleManagerScopeRepository } from './infrastructure/persistence/repositories/drizzle-manager-scope-repository';
import { DrizzleTaskRepository } from './infrastructure/persistence/repositories/drizzle-task-repository';
import { DrizzleEvidenceRepository } from './infrastructure/persistence/repositories/drizzle-evidence-repository';
import { DrizzleIdempotencyRepository } from './infrastructure/persistence/repositories/drizzle-idempotency-repository';
import { DrizzleOperationalUnitOfWork } from './infrastructure/persistence/repositories/drizzle-operational-unit-of-work';
import { S3ObjectStorageAdapter } from './infrastructure/storage/s3-object-storage';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher';
import { CryptoTokenService } from './infrastructure/security/crypto-token-service';
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

// Tree Asset Registry use cases
import { CreateTreeUseCase } from './modules/tree-asset-registry/application/use-cases/create-tree.use-case';
import { UpdateTreeMasterDataUseCase } from './modules/tree-asset-registry/application/use-cases/update-tree-master-data.use-case';
import { ReplaceTreeQrCodeUseCase } from './modules/tree-asset-registry/application/use-cases/replace-tree-qr-code.use-case';
import { UpdateCanonicalCoordinatesUseCase } from './modules/tree-asset-registry/application/use-cases/update-canonical-coordinates.use-case';
import { RetireTreeUseCase } from './modules/tree-asset-registry/application/use-cases/retire-tree.use-case';
import { GetTreeUseCase } from './modules/tree-asset-registry/application/use-cases/get-tree.use-case';
import { ListTreesUseCase } from './modules/tree-asset-registry/application/use-cases/list-trees.use-case';
import { GetCareHistoryUseCase } from './modules/tree-asset-registry/application/use-cases/get-care-history.use-case';

// Policy & Template Governance use cases
import { CreateTaskTypeUseCase } from './modules/policy-template-governance/application/use-cases/create-task-type.use-case';
import { ActivateTaskTypeUseCase } from './modules/policy-template-governance/application/use-cases/activate-task-type.use-case';
import { DeactivateTaskTypeUseCase } from './modules/policy-template-governance/application/use-cases/deactivate-task-type.use-case';
import { PublishProofPolicyVersionUseCase } from './modules/policy-template-governance/application/use-cases/publish-proof-policy.use-case';
import { PublishChecklistTemplateVersionUseCase } from './modules/policy-template-governance/application/use-cases/publish-checklist-template.use-case';
import { ResolveTaskTypePolicyUseCase } from './modules/policy-template-governance/application/use-cases/resolve-task-type-policy.use-case';

// Work Management use cases
import { CreateTaskUseCase } from './modules/work-management/application/use-cases/create-task.use-case';
import { StartTaskUseCase } from './modules/work-management/application/use-cases/start-task.use-case';
import { ReportFieldIssueUseCase } from './modules/work-management/application/use-cases/report-field-issue.use-case';
import { ResumeBlockedTaskUseCase } from './modules/work-management/application/use-cases/resume-blocked-task.use-case';
import { ReassignTaskUseCase } from './modules/work-management/application/use-cases/reassign-task.use-case';
import { CancelTaskUseCase } from './modules/work-management/application/use-cases/cancel-task.use-case';
import { PresignEvidenceUploadUseCase } from './modules/work-management/application/use-cases/presign-evidence-upload.use-case';
import { SubmitEvidenceUseCase } from './modules/work-management/application/use-cases/submit-evidence.use-case';
import { ResubmitReworkUseCase } from './modules/work-management/application/use-cases/resubmit-rework.use-case';
import { ReviewTaskUseCase } from './modules/work-management/application/use-cases/review-task.use-case';
import { GetTaskUseCase } from './modules/work-management/application/use-cases/get-task.use-case';
import { ListTasksUseCase } from './modules/work-management/application/use-cases/list-tasks.use-case';

import type { IUserRepository } from './modules/iam/application/ports/user-repository.port';
import type { ISessionRepository } from './modules/iam/application/ports/session-repository.port';
import type { IIamUnitOfWork } from './modules/iam/application/ports/iam-unit-of-work.port';
import type { IPasswordHasher } from './modules/iam/application/ports/password-hasher.port';
import type { ITokenService } from './modules/iam/application/ports/token-service.port';
import type { ICredentialSetupDeliveryPort } from './modules/iam/application/ports/credential-setup-delivery.port';
import type { IAuditWriter } from './modules/audit-compliance/application/ports/audit-writer.port';
import type { ITreeRepository } from './modules/tree-asset-registry/application/ports/tree-repository.port';
import type { ICareHistoryRepository } from './modules/tree-asset-registry/application/ports/care-history-repository.port';
import type { ITaskTypeRepository } from './modules/policy-template-governance/application/ports/task-type-repository.port';
import type { IPolicyRepository } from './modules/policy-template-governance/application/ports/policy-repository.port';
import type { ITaskRepository } from './modules/work-management/application/ports/task-repository.port';
import type { IEvidenceRepository } from './modules/work-management/application/ports/evidence-repository.port';
import type { IIdempotencyRepository } from './modules/work-management/application/ports/idempotency-repository.port';
import type { IOperationalScopeRepository } from './modules/work-management/application/ports/operational-scope-repository.port';
import type { IOperationalUnitOfWork } from './modules/work-management/application/ports/operational-unit-of-work.port';
import type { IObjectStoragePort } from './modules/work-management/application/ports/object-storage.port';
import { AppError } from './core/errors';
import { type SecurityConfig, type StorageConfig, getSecurityConfig, getStorageConfig, loadEnv } from './config/env';
import * as schema from './infrastructure/persistence/schema';

export interface AppOptions {
  logger?: boolean | undefined;
  pool?: pg.Pool | undefined;
  userRepository?: IUserRepository | undefined;
  sessionRepository?: ISessionRepository | undefined;
  auditWriter?: IAuditWriter | undefined;
  unitOfWork?: IIamUnitOfWork | undefined;
  passwordHasher?: IPasswordHasher | undefined;
  tokenService?: ITokenService | undefined;
  deliveryPort?: ICredentialSetupDeliveryPort | undefined;
  securityConfig?: SecurityConfig | undefined;
  storageConfig?: StorageConfig | undefined;
  storagePort?: IObjectStoragePort | undefined;
  treeRepository?: ITreeRepository | undefined;
  careHistoryRepository?: ICareHistoryRepository | undefined;
  taskTypeRepository?: ITaskTypeRepository | undefined;
  policyRepository?: IPolicyRepository | undefined;
  taskRepository?: ITaskRepository | undefined;
  evidenceRepository?: IEvidenceRepository | undefined;
  idempotencyRepository?: IIdempotencyRepository | undefined;
  operationalScopeRepository?: IOperationalScopeRepository | undefined;
  operationalUnitOfWork?: IOperationalUnitOfWork | undefined;
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

  // If pool or repositories are supplied, wire IAM, Governance, and Operational routes
  if (options.pool || options.userRepository) {
    const env = loadEnv();
    const securityConfig = options.securityConfig ?? getSecurityConfig(env);
    const storageConfig = options.storageConfig ?? getStorageConfig(env);
    const db = options.pool ? drizzle(options.pool, { schema }) : null;

    const userRepo: IUserRepository =
      options.userRepository ?? (db ? new DrizzleUserRepository(db) : (null as unknown as IUserRepository));
    const sessionRepo: ISessionRepository =
      options.sessionRepository ?? (db ? new DrizzleSessionRepository(db) : (null as unknown as ISessionRepository));
    const auditWriter: IAuditWriter =
      options.auditWriter ?? (db ? new DrizzleAuditWriter(db) : (null as unknown as IAuditWriter));
    const unitOfWork: IIamUnitOfWork =
      options.unitOfWork ?? (db ? new DrizzleIamUnitOfWork(db) : (null as unknown as IIamUnitOfWork));

    const passwordHasher = options.passwordHasher ?? new Argon2PasswordHasher(securityConfig.argon2);
    const tokenService = options.tokenService ?? new CryptoTokenService();
    const deliveryPort = options.deliveryPort;
    const auditService = new AuditService(auditWriter);

    const authenticate = createAuthGate(userRepo, sessionRepo, tokenService);
    const requireAdmin = requireRoles('admin');

    // Operational Domain Repositories
    const treeRepo: ITreeRepository =
      options.treeRepository ?? (db ? new DrizzleTreeRepository(db) : (null as unknown as ITreeRepository));
    const careHistoryRepo: ICareHistoryRepository =
      options.careHistoryRepository ??
      (db ? new DrizzleCareHistoryRepository(db) : (null as unknown as ICareHistoryRepository));
    const taskTypeRepo: ITaskTypeRepository =
      options.taskTypeRepository ?? (db ? new DrizzleTaskTypeRepository(db) : (null as unknown as ITaskTypeRepository));
    const policyRepo: IPolicyRepository =
      options.policyRepository ?? (db ? new DrizzlePolicyRepository(db) : (null as unknown as IPolicyRepository));
    const taskRepo: ITaskRepository =
      options.taskRepository ?? (db ? new DrizzleTaskRepository(db) : (null as unknown as ITaskRepository));
    const evidenceRepo: IEvidenceRepository =
      options.evidenceRepository ?? (db ? new DrizzleEvidenceRepository(db) : (null as unknown as IEvidenceRepository));
    const idempotencyRepo: IIdempotencyRepository =
      options.idempotencyRepository ??
      (db ? new DrizzleIdempotencyRepository(db) : (null as unknown as IIdempotencyRepository));
    const scopeRepo: IOperationalScopeRepository =
      options.operationalScopeRepository ??
      (db ? new DrizzleManagerScopeRepository(db) : (null as unknown as IOperationalScopeRepository));
    const _operationalUow: IOperationalUnitOfWork =
      options.operationalUnitOfWork ??
      (db ? new DrizzleOperationalUnitOfWork(db) : (null as unknown as IOperationalUnitOfWork));

    const storagePort: IObjectStoragePort = options.storagePort ?? new S3ObjectStorageAdapter(storageConfig);

    // IAM Use Cases
    const loginUseCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService, {
      accessTokenTtlSeconds: securityConfig.accessTokenTtlSeconds,
      refreshTokenTtlSeconds: securityConfig.refreshTokenTtlSeconds,
      lockThreshold: securityConfig.failedLoginLockThreshold,
      lockDurationMs: securityConfig.lockDurationSeconds * 1000,
    });
    const refreshTokenUseCase = new RefreshTokenUseCase(userRepo, sessionRepo, tokenService, {
      accessTokenTtlSeconds: securityConfig.accessTokenTtlSeconds,
      refreshTokenTtlSeconds: securityConfig.refreshTokenTtlSeconds,
    });
    const logoutUseCase = new LogoutUseCase(sessionRepo, tokenService);

    const provisionUserUseCase = new ProvisionUserUseCase(userRepo, unitOfWork, auditService);
    const assignRoleUseCase = new AssignRoleUseCase(userRepo, unitOfWork, auditService);
    const activateAccountUseCase = new ActivateAccountUseCase(userRepo, unitOfWork, auditService);
    const suspendAccountUseCase = new SuspendAccountUseCase(userRepo, unitOfWork, auditService);
    const disableAccountUseCase = new DisableAccountUseCase(userRepo, unitOfWork, auditService);
    const unlockAccountUseCase = new UnlockAccountUseCase(userRepo, unitOfWork, auditService);
    const resetCredentialSetupUseCase = new ResetCredentialSetupUseCase(
      userRepo,
      unitOfWork,
      tokenService,
      auditService,
      deliveryPort,
      { setupTokenTtlSeconds: securityConfig.setupTokenTtlSeconds },
    );

    // Tree Asset Registry Use Cases
    const createTreeUseCase = new CreateTreeUseCase(treeRepo, auditService);
    const updateTreeMasterDataUseCase = new UpdateTreeMasterDataUseCase(treeRepo, auditService);
    const replaceTreeQrCodeUseCase = new ReplaceTreeQrCodeUseCase(treeRepo, auditService);
    const updateCanonicalCoordinatesUseCase = new UpdateCanonicalCoordinatesUseCase(treeRepo, auditService);
    const retireTreeUseCase = new RetireTreeUseCase(treeRepo, auditService);
    const getTreeUseCase = new GetTreeUseCase(treeRepo);
    const listTreesUseCase = new ListTreesUseCase(treeRepo);
    const getCareHistoryUseCase = new GetCareHistoryUseCase(careHistoryRepo);

    // Policy & Template Governance Use Cases
    const createTaskTypeUseCase = new CreateTaskTypeUseCase(taskTypeRepo, auditService);
    const activateTaskTypeUseCase = new ActivateTaskTypeUseCase(taskTypeRepo, auditService);
    const deactivateTaskTypeUseCase = new DeactivateTaskTypeUseCase(taskTypeRepo, auditService);
    const publishProofPolicyVersionUseCase = new PublishProofPolicyVersionUseCase(
      taskTypeRepo,
      policyRepo,
      auditService,
    );
    const publishChecklistTemplateVersionUseCase = new PublishChecklistTemplateVersionUseCase(
      taskTypeRepo,
      policyRepo,
      auditService,
    );
    const resolveTaskTypePolicyUseCase = new ResolveTaskTypePolicyUseCase(taskTypeRepo, policyRepo);

    // Work Management Use Cases
    const createTaskUseCase = new CreateTaskUseCase(
      taskRepo,
      treeRepo,
      userRepo,
      scopeRepo,
      resolveTaskTypePolicyUseCase,
      auditService,
    );
    const startTaskUseCase = new StartTaskUseCase(taskRepo, auditService);
    const reportFieldIssueUseCase = new ReportFieldIssueUseCase(taskRepo, evidenceRepo, auditService);
    const resumeBlockedTaskUseCase = new ResumeBlockedTaskUseCase(taskRepo, scopeRepo, auditService);
    const reassignTaskUseCase = new ReassignTaskUseCase(taskRepo, userRepo, scopeRepo, auditService);
    const cancelTaskUseCase = new CancelTaskUseCase(taskRepo, scopeRepo, auditService);
    const presignEvidenceUploadUseCase = new PresignEvidenceUploadUseCase(taskRepo, storagePort);
    const submitEvidenceUseCase = new SubmitEvidenceUseCase(
      taskRepo,
      evidenceRepo,
      storagePort,
      treeRepo,
      auditService,
    );
    const resubmitReworkUseCase = new ResubmitReworkUseCase(taskRepo, evidenceRepo, auditService);
    const reviewTaskUseCase = new ReviewTaskUseCase(taskRepo, evidenceRepo, careHistoryRepo, scopeRepo, auditService);
    const getTaskUseCase = new GetTaskUseCase(taskRepo);
    const listTasksUseCase = new ListTasksUseCase(taskRepo);

    // Register auth routes
    server.register(authRoutes, {
      loginUseCase,
      refreshTokenUseCase,
      logoutUseCase,
      authenticate,
    });

    // Register governance IAM routes
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

    // Register tree routes
    server.register(treeRoutes, {
      getTreeUseCase,
      listTreesUseCase,
      getCareHistoryUseCase,
      authenticate,
    });

    // Register governance operational routes
    server.register(governanceOperationalRoutes, {
      createTreeUseCase,
      updateTreeMasterDataUseCase,
      replaceTreeQrCodeUseCase,
      updateCanonicalCoordinatesUseCase,
      retireTreeUseCase,
      createTaskTypeUseCase,
      activateTaskTypeUseCase,
      deactivateTaskTypeUseCase,
      publishProofPolicyVersionUseCase,
      publishChecklistTemplateVersionUseCase,
      taskTypeRepo,
      authenticate,
      requireAdmin,
    });

    // Register operational task routes
    server.register(taskRoutes, {
      createTaskUseCase,
      startTaskUseCase,
      reportFieldIssueUseCase,
      resumeBlockedTaskUseCase,
      reassignTaskUseCase,
      cancelTaskUseCase,
      presignEvidenceUploadUseCase,
      submitEvidenceUseCase,
      resubmitReworkUseCase,
      reviewTaskUseCase,
      getTaskUseCase,
      listTasksUseCase,
      idempotencyRepo,
      authenticate,
      requireRoles,
    });
  }

  // Standardized error handler with mandatory requestId per ApiErrorSchema
  server.setErrorHandler((error: unknown, request, reply) => {
    const requestId = (request?.id as string) || 'req-unknown';

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          requestId,
          ...(error.details ? { details: error.details } : {}),
        },
      });
    }

    const fastifyErr = error as { validation?: unknown; message?: string };
    if (fastifyErr.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_FAILED',
          message: fastifyErr.message ?? 'Validation failed',
          requestId,
          details: fastifyErr.validation,
        },
      });
    }

    server.log.error(error);
    return reply.status(500).send({
      error: {
        code: 'INTERNAL',
        message: 'Internal server error',
        requestId,
      },
    });
  });

  return server;
}
