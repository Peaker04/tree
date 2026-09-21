import crypto from 'node:crypto';
import type { ResetCredentialSetupRequest } from '@novyx/contracts';
import type { IUserRepository } from '../ports/user-repository.port';
import type { ISessionRepository } from '../ports/session-repository.port';
import type { ITokenService } from '../ports/token-service.port';
import type { ICredentialSetupDeliveryPort } from '../ports/credential-setup-delivery.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import type { UserAccount } from '../../domain/entities/user';
import type { ActorContext } from './provision-user.use-case';
import { NotFoundError } from '../../../../core/errors';

export class ResetCredentialSetupUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly tokenService: ITokenService,
    private readonly deliveryPort: ICredentialSetupDeliveryPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(request: ResetCredentialSetupRequest, actor: ActorContext): Promise<UserAccount> {
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

    try {
      // 1. Advance OCC version and clear failed attempts
      const updatedUser = await this.userRepository.updateWithOcc(user.id, request.expectedVersion, {
        failedLoginAttempts: 0,
        lockedUntil: null,
        authVersion: user.authVersion + 1,
      });

      // 2. Generate CSPRNG setup token
      const rawSetupToken = this.tokenService.generateToken(32);
      const tokenHash = this.tokenService.hashToken(rawSetupToken);

      // 3. Persist hash only (expiry: 24h)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.sessionRepository.createSetupToken({
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      // 4. Invalidate prior sessions
      await this.sessionRepository.revokeAllUserSessions(user.id);

      // 5. Deliver plaintext token via delivery port (never logged or persisted)
      await this.deliveryPort.deliverSetupToken({ email: user.email, phone: user.phone }, rawSetupToken);

      // 6. Record audit (sanitized: no token, no hash)
      await this.auditService.record({
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
          version: updatedUser.version,
          authVersion: updatedUser.authVersion,
          expiresAt: expiresAt.toISOString(),
        },
      });

      return updatedUser;
    } catch (err) {
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
