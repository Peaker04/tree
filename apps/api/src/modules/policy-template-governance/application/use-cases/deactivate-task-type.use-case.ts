import type { ITaskTypeRepository } from '../ports/task-type-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError } from '../../../../core/errors';
import type { DeactivateTaskTypeRequest } from '@novyx/contracts';
import type { TaskType } from '../../domain/task-type.entity';

export class DeactivateTaskTypeUseCase {
  constructor(
    private readonly taskTypeRepo: ITaskTypeRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: DeactivateTaskTypeRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<TaskType> {
    const taskType = await this.taskTypeRepo.findById(request.taskTypeId);
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

    taskType.deactivate();

    const updated = await this.taskTypeRepo.update(taskType, request.expectedVersion);
    if (!updated) {
      const current = await this.taskTypeRepo.findById(request.taskTypeId);
      throw new ConflictError('TaskType version conflict', {
        subtype: 'STALE_VERSION',
        currentVersion: current ? current.version : taskType.version,
        expectedVersion: request.expectedVersion,
      });
    }

    await this.auditService.logEvent({
      actorId: context.actorId,
      actorRole: context.actorRole,
      action: 'DeactivateTaskType',
      targetResourceType: 'TaskType',
      targetResourceId: taskType.id,
      outcome: 'SUCCESS',
      details: {
        updatedVersion: taskType.version,
      },
    });

    return taskType;
  }
}
