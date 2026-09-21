import type { DisableAccountRequest } from '@novyx/contracts';
import type { IUserRepository } from '../ports/user-repository.port';
import type { IIamUnitOfWork } from '../ports/iam-unit-of-work.port';
import { AuditService } from '../../../audit-compliance/application/services/audit.service';
import type { UserAccount } from '../../domain/entities/user';
import type { ActorContext } from './provision-user.use-case';
import { NotFoundError, ConflictError } from '../../../../core/errors';

export class DisableAccountUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly unitOfWork: IIamUnitOfWork,
    private readonly auditService: AuditService,
  ) {}

  async execute(request: DisableAccountRequest, actor: ActorContext): Promise<UserAccount> {
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-05:DisableAccount',
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
      throw new ConflictError('Account is already disabled');
    }

    try {
      return await this.unitOfWork.execute(async (tx) => {
        const txAuditService = new AuditService(tx.auditWriter);

        const updatedUser = await tx.userRepository.updateWithOcc(user.id, request.expectedVersion, {
          accountStatus: 'DISABLED',
          authVersion: user.authVersion + 1,
        });

        // Revoke all active sessions within transaction
        await tx.sessionRepository.revokeAllUserSessions(user.id);

        await txAuditService.record({
          actorId: actor.id,
          actorRole: actor.role,
          actionType: 'GV-05:DisableAccount',
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
      });
    } catch (err) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-05:DisableAccount',
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
