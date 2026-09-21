import crypto from 'node:crypto';
import type { ResetCredentialSetupRequest } from '@novyx/contracts';
import type { IUserRepository } from '../ports/user-repository.port';
import type { IIamUnitOfWork } from '../ports/iam-unit-of-work.port';
import type { ITokenService } from '../ports/token-service.port';
import type { ICredentialSetupDeliveryPort } from '../ports/credential-setup-delivery.port';
import { AuditService } from '../../../audit-compliance/application/services/audit.service';
import type { UserAccount } from '../../domain/entities/user';
import type { ActorContext } from './provision-user.use-case';
import { NotFoundError, ServiceUnavailableError } from '../../../../core/errors';

export interface ResetCredentialSetupOptions {
  setupTokenTtlSeconds?: number;
}

export class ResetCredentialSetupUseCase {
  private readonly setupTokenTtlSeconds: number;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly unitOfWork: IIamUnitOfWork,
    private readonly tokenService: ITokenService,
    private readonly auditService: AuditService,
    private readonly deliveryPort?: ICredentialSetupDeliveryPort,
    options: ResetCredentialSetupOptions = {},
  ) {
    this.setupTokenTtlSeconds = options.setupTokenTtlSeconds ?? 86400;
  }

  async execute(request: ResetCredentialSetupRequest, actor: ActorContext): Promise<UserAccount> {
    // 1. Fail closed if credential delivery provider is not configured (W3-C03)
    if (!this.deliveryPort) {
      throw new ServiceUnavailableError('Credential setup delivery service is unavailable');
    }

    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-07:ResetCredentialSetup',
        resourceType: 'USER',
        resourceId: request.userId,
        outcome: 'FAILURE',
        clientIp: actor.clientIp,
        userAgent: actor.userAgent,
        correlationId: actor.correlationId,
        beforeState: null,
        afterState: { reason: 'User not found' },
      });
      throw new NotFoundError(`User ${request.userId} not found`);
    }

    // 2. Generate CSPRNG setup token and hash
    const rawSetupToken = this.tokenService.generateToken(32);
    const tokenHash = this.tokenService.hashToken(rawSetupToken);
    const expiresAt = new Date(Date.now() + this.setupTokenTtlSeconds * 1000);

    try {
      // 3. Atomically commit DB state in a single transaction (W3-C01)
      const updatedUser = await this.unitOfWork.execute(async (tx) => {
        const txAuditService = new AuditService(tx.auditWriter);

        // Advance OCC version and clear failed attempts
        const updated = await tx.userRepository.updateWithOcc(user.id, request.expectedVersion, {
          failedLoginAttempts: 0,
          lockedUntil: null,
          authVersion: user.authVersion + 1,
        });

        // Persist token hash only
        await tx.sessionRepository.createSetupToken({
          id: crypto.randomUUID(),
          userId: user.id,
          tokenHash,
          expiresAt,
        });

        // Invalidate prior sessions
        await tx.sessionRepository.revokeAllUserSessions(user.id);

        // Record SUCCESS audit within transaction
        await txAuditService.record({
          actorId: actor.id,
          actorRole: actor.role,
          actionType: 'GV-07:ResetCredentialSetup',
          resourceType: 'USER',
          resourceId: user.id,
          outcome: 'SUCCESS',
          clientIp: actor.clientIp,
          userAgent: actor.userAgent,
          correlationId: actor.correlationId,
          beforeState: {
            version: user.version,
            authVersion: user.authVersion,
          },
          afterState: {
            version: updated.version,
            authVersion: updated.authVersion,
            expiresAt: expiresAt.toISOString(),
          },
        });

        return updated;
      });

      // 4. External delivery occurs AFTER DB transaction commits (W3-C01)
      await this.deliveryPort.deliverSetupToken({ email: user.email, phone: user.phone }, rawSetupToken);

      return updatedUser;
    } catch (err) {
      // Record FAILURE audit outside rolled-back transaction (W3-C01)
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-07:ResetCredentialSetup',
        resourceType: 'USER',
        resourceId: user.id,
        outcome: 'FAILURE',
        clientIp: actor.clientIp,
        userAgent: actor.userAgent,
        correlationId: actor.correlationId,
        beforeState: { version: user.version },
        afterState: { error: (err as Error).message },
      });
      throw err;
    }
  }
}
