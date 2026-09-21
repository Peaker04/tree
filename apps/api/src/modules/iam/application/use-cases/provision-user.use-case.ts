import crypto from 'node:crypto';
import type { ProvisionUserRequest, HumanRole } from '@novyx/contracts';
import type { IUserRepository } from '../ports/user-repository.port';
import type { IIamUnitOfWork } from '../ports/iam-unit-of-work.port';
import { AuditService } from '../../../audit-compliance/application/services/audit.service';
import type { UserAccount } from '../../domain/entities/user';
import { ConflictError } from '../../../../core/errors';

export interface ActorContext {
  id: string;
  role: HumanRole;
  clientIp?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

export class ProvisionUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly unitOfWork: IIamUnitOfWork,
    private readonly auditService: AuditService,
  ) {}

  async execute(request: ProvisionUserRequest, actor: ActorContext): Promise<UserAccount> {
    const existing = await this.userRepository.findByEmail(request.email);
    if (existing) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-01:ProvisionUser',
        resourceType: 'USER',
        resourceId: request.email,
        outcome: 'FAILURE',
        clientIp: actor.clientIp,
        userAgent: actor.userAgent,
        correlationId: actor.correlationId,
        beforeState: null,
        afterState: { email: request.email, reason: 'Duplicate email' },
      });
      throw new ConflictError(`User with email ${request.email} already exists`);
    }

    const userId = crypto.randomUUID();
    try {
      return await this.unitOfWork.execute(async (tx) => {
        const txAuditService = new AuditService(tx.auditWriter);
        const createdUser = await tx.userRepository.create({
          id: userId,
          version: 0,
          email: request.email,
          phone: request.phone,
          initialRole: request.initialRole,
          role: request.initialRole,
          accountStatus: 'INVITED',
          passwordHash: null,
          authVersion: 1,
        });

        await txAuditService.record({
          actorId: actor.id,
          actorRole: actor.role,
          actionType: 'GV-01:ProvisionUser',
          resourceType: 'USER',
          resourceId: userId,
          outcome: 'SUCCESS',
          clientIp: actor.clientIp,
          userAgent: actor.userAgent,
          correlationId: actor.correlationId,
          beforeState: null,
          afterState: {
            id: userId,
            email: createdUser.email,
            initialRole: createdUser.initialRole,
            role: createdUser.role,
            accountStatus: createdUser.accountStatus,
          },
        });

        return createdUser;
      });
    } catch (err) {
      await this.auditService.record({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'GV-01:ProvisionUser',
        resourceType: 'USER',
        resourceId: userId,
        outcome: 'FAILURE',
        clientIp: actor.clientIp,
        userAgent: actor.userAgent,
        correlationId: actor.correlationId,
        beforeState: null,
        afterState: { error: (err as Error).message },
      });
      throw err;
    }
  }
}
