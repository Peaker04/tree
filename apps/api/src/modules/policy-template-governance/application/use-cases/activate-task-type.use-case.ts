import type { ITaskTypeRepository } from '../ports/task-type-repository.port';
import type { IOperationalUnitOfWork } from '../../../work-management/application/ports/operational-unit-of-work.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError } from '../../../../core/errors';
import type { ActivateTaskTypeRequest } from '@novyx/contracts';
import type { TaskType } from '../../domain/task-type.entity';

export class ActivateTaskTypeUseCase {
  constructor(
    private readonly taskTypeRepo: ITaskTypeRepository,
    private readonly auditService: AuditService,
    private readonly uow?: IOperationalUnitOfWork,
  ) {}

  async execute(
    request: ActivateTaskTypeRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<TaskType> {
    const run = async (repos: { taskTypeRepo: ITaskTypeRepository; auditService: AuditService }): Promise<TaskType> => {
      const taskType = await repos.taskTypeRepo.findById(request.taskTypeId);
      if (!taskType) {
        throw new NotFoundError(`TaskType with ID ${request.taskTypeId} not found`);
      }

      if (taskType.version !== request.expectedVersion) {
        throw new ConflictError('TaskType version conflict', {
          subtype: 'STALE_VERSION',
          currentVersion: taskType.version,
          expectedVersion: request.expectedVersion,
        });
      }

      taskType.activate();

      const updated = await repos.taskTypeRepo.update(taskType, request.expectedVersion);
      if (!updated) {
        const current = await repos.taskTypeRepo.findById(request.taskTypeId);
        throw new ConflictError('TaskType version conflict', {
          subtype: 'STALE_VERSION',
          currentVersion: current ? current.version : taskType.version,
          expectedVersion: request.expectedVersion,
        });
      }

      await repos.auditService.logEvent({
        actorId: context.actorId,
        actorRole: context.actorRole,
        action: 'ActivateTaskType',
        targetResourceType: 'TaskType',
        targetResourceId: taskType.id,
        outcome: 'SUCCESS',
        details: {
          updatedVersion: taskType.version,
        },
      });

      return taskType;
    };

    if (this.uow) {
      return await this.uow.execute(async (tx) => {
        return run({ taskTypeRepo: tx.taskTypeRepo, auditService: tx.auditService });
      });
    }

    return run({ taskTypeRepo: this.taskTypeRepo, auditService: this.auditService });
  }
}
