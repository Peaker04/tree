import type { UnlockAccountRequest } from '@novyx/contracts';
import type { IUserRepository } from '../ports/user-repository.port';
import type { IIamUnitOfWork } from '../ports/iam-unit-of-work.port';
import { AuditService } from '../../../audit-compliance/application/services/audit.service';
import type { UserAccount } from '../../domain/entities/user';
import type { ActorContext } from './provision-user.use-case';
import { NotFoundError } from '../../../../core/errors';

export class UnlockAccountUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly unitOfWork: IIamUnitOfWork,
    private readonly auditService: AuditService,
  ) {}

  async execute(request: UnlockAccountRequest, actor: ActorContext): Promise<UserAccount> {
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-06:UnlockAccount',
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
      return await this.unitOfWork.execute(async (tx) => {
        const txAuditService = new AuditService(tx.auditWriter);

        // Clear credential lock state ONLY — do NOT change accountStatus or human role
        const updatedUser = await tx.userRepository.updateWithOcc(user.id, request.expectedVersion, {
          failedLoginAttempts: 0,
          lockedUntil: null,
        });

        await txAuditService.record({
          actorId: actor.id,
          actorRole: actor.role,
          actionType: 'GV-06:UnlockAccount',
          resourceType: 'USER',
          resourceId: user.id,
          outcome: 'SUCCESS',
          clientIp: actor.clientIp,
          userAgent: actor.userAgent,
          correlationId: actor.correlationId,
          beforeState: {
            accountStatus: user.accountStatus,
            failedLoginAttempts: user.failedLoginAttempts,
            lockedUntil: user.lockedUntil,
            version: user.version,
          },
          afterState: {
            accountStatus: updatedUser.accountStatus, // MUST remain identical
            failedLoginAttempts: 0,
            lockedUntil: null,
            version: updatedUser.version,
            reason: request.reason ?? null,
          },
        });

        return updatedUser;
      });
    } catch (err) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-06:UnlockAccount',
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
