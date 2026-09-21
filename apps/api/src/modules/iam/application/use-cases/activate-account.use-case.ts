import type { ActivateAccountRequest } from '@novyx/contracts';
import type { IUserRepository } from '../ports/user-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import type { UserAccount } from '../../domain/entities/user';
import type { ActorContext } from './provision-user.use-case';
import { NotFoundError, ConflictError } from '../../../../core/errors';

export class ActivateAccountUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(request: ActivateAccountRequest, actor: ActorContext): Promise<UserAccount> {
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-03:ActivateAccount',
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
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-03:ActivateAccount',
        resourceType: 'USER',
        resourceId: user.id,
        outcome: 'FAILURE',
        clientIp: actor.clientIp,
        userAgent: actor.userAgent,
        correlationId: actor.correlationId,
        beforeState: { accountStatus: user.accountStatus },
        afterState: { reason: 'Cannot activate permanently disabled account' },
      });
      throw new ConflictError('Cannot activate a disabled account');
    }

    if (user.accountStatus === 'ACTIVE') {
      throw new ConflictError('Account is already active');
    }

    try {
      const updatedUser = await this.userRepository.updateWithOcc(user.id, request.expectedVersion, {
        accountStatus: 'ACTIVE',
        authVersion: user.authVersion + 1,
      });

      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-03:ActivateAccount',
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
          reason: request.reason ?? null,
        },
      });

      return updatedUser;
    } catch (err) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-03:ActivateAccount',
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
