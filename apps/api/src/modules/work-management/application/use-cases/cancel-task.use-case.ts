import type { ITaskRepository } from '../ports/task-repository.port';
import type { IOperationalScopeRepository } from '../ports/operational-scope-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../../../core/errors';
import type { CancelTaskRequest } from '@novyx/contracts';
import type { Task } from '../../domain/task.entity';

export class CancelTaskUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly scopeRepo: IOperationalScopeRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: CancelTaskRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<Task> {
    if (context.actorRole !== 'manager') {
      throw new ForbiddenError('Only Operations Managers may cancel tasks');
    }

    const task = await this.taskRepo.findById(request.taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${request.taskId} not found`);
    }

    const hasScope = await this.scopeRepo.hasScope(context.actorId, task.treeId);
    if (!hasScope) {
      throw new ForbiddenError(`Manager ${context.actorId} does not have authorized operational scope for this task`);
    }

    if (task.version !== request.expectedVersion) {
      throw new ConflictError('Task version conflict', {
        subtype: 'STALE_VERSION',
        currentVersion: task.version,
        expectedVersion: request.expectedVersion,
      });
    }

    if (task.isTerminal()) {
      throw new ValidationError(`Cannot cancel terminal task in status ${task.status} (DR-HARD-05)`);
    }

    task.cancel(context.actorId, request.cancelReason);

    const updated = await this.taskRepo.update(task, request.expectedVersion);
    if (!updated) {
      const current = await this.taskRepo.findById(request.taskId);
      throw new ConflictError('Task version conflict', {
        subtype: 'STALE_VERSION',
        currentVersion: current ? current.version : task.version,
        expectedVersion: request.expectedVersion,
      });
    }

    await this.auditService.logEvent({
      actorId: context.actorId,
      actorRole: context.actorRole,
      action: 'CancelTask',
      targetResourceType: 'Task',
      targetResourceId: task.id,
      outcome: 'SUCCESS',
      reason: request.cancelReason,
      details: {
        newStatus: task.status,
        updatedVersion: task.version,
      },
    });

    return task;
  }
}
