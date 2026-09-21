import type { SuspendAccountRequest } from '@novyx/contracts';
import type { IUserRepository } from '../ports/user-repository.port';
import type { ISessionRepository } from '../ports/session-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import type { UserAccount } from '../../domain/entities/user';
import type { ActorContext } from './provision-user.use-case';
import { NotFoundError, ConflictError } from '../../../../core/errors';

export class SuspendAccountUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(request: SuspendAccountRequest, actor: ActorContext): Promise<UserAccount> {
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-04:SuspendAccount',
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

    if (user.accountStatus === 'DISABLED') {
      throw new ConflictError('Cannot suspend a disabled account');
    }
    if (user.accountStatus === 'SUSPENDED') {
      throw new ConflictError('Account is already suspended');
    }

    try {
      const updatedUser = await this.userRepository.updateWithOcc(user.id, request.expectedVersion, {
        accountStatus: 'SUSPENDED',
        authVersion: user.authVersion + 1,
      });

      // Immediately invalidate all active sessions
      await this.sessionRepository.revokeAllUserSessions(user.id);

      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-04:SuspendAccount',
        resourceType: 'USER',
        resourceId: user.id,
        outcome: 'SUCCESS',
        clientIp: actor.clientIp,
        userAgent: actor.userAgent,
        correlationId: actor.correlationId,
        beforeState: {
          accountStatus: user.accountStatus,
          version: user.version,
        },
        afterState: {
          accountStatus: updatedUser.accountStatus,
          version: updatedUser.version,
          reason: request.reason,
        },
      });

      return updatedUser;
    } catch (err) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-04:SuspendAccount',
        resourceType: 'USER',
        resourceId: user.id,
        outcome: 'FAILURE',
        clientIp: actor.clientIp,
        userAgent: actor.userAgent,
        correlationId: actor.correlationId,
        beforeState: { accountStatus: user.accountStatus, version: user.version },
        afterState: { error: (err as Error).message },
      });
      throw err;
    }
  }
}
