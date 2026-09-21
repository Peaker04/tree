import type { AssignRoleRequest } from '@novyx/contracts';
import type { IUserRepository } from '../ports/user-repository.port';
import type { ISessionRepository } from '../ports/session-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import type { UserAccount } from '../../domain/entities/user';
import type { ActorContext } from './provision-user.use-case';
import { NotFoundError } from '../../../../core/errors';

export class AssignRoleUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(request: AssignRoleRequest, actor: ActorContext): Promise<UserAccount> {
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-02:AssignRole',
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
      // Advance authVersion to invalidate prior authorization and revoke active sessions
      const updatedUser = await this.userRepository.updateWithOcc(user.id, request.expectedVersion, {
        role: request.newRole,
        authVersion: user.authVersion + 1,
      });

      // Revoke all active sessions for this user
      await this.sessionRepository.revokeAllUserSessions(user.id);

      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-02:AssignRole',
        resourceType: 'USER',
        resourceId: user.id,
        outcome: 'SUCCESS',
        clientIp: actor.clientIp,
        userAgent: actor.userAgent,
        correlationId: actor.correlationId,
        beforeState: {
          role: user.role,
          version: user.version,
          authVersion: user.authVersion,
        },
        afterState: {
          role: updatedUser.role,
          version: updatedUser.version,
          authVersion: updatedUser.authVersion,
          reason: request.reason,
        },
      });

      return updatedUser;
    } catch (err) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-02:AssignRole',
        resourceType: 'USER',
        resourceId: user.id,
        outcome: 'FAILURE',
        clientIp: actor.clientIp,
        userAgent: actor.userAgent,
        correlationId: actor.correlationId,
        beforeState: {
          role: user.role,
          version: user.version,
        },
        afterState: {
          attemptedRole: request.newRole,
          error: (err as Error).message,
        },
      });
      throw err;
    }
  }
}
