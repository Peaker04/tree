import type { ITaskRepository } from '../ports/task-repository.port';
import type { IOperationalScopeRepository } from '../ports/operational-scope-repository.port';
import type { IOperationalUnitOfWork } from '../ports/operational-unit-of-work.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../../../core/errors';
import type { ResumeBlockedTaskRequest } from '@novyx/contracts';
import type { Task } from '../../domain/task.entity';

export class ResumeBlockedTaskUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly scopeRepo: IOperationalScopeRepository,
    private readonly auditService: AuditService,
    private readonly uow?: IOperationalUnitOfWork,
  ) {}

  async execute(
    request: ResumeBlockedTaskRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<Task> {
    if (context.actorRole !== 'manager') {
      throw new ForbiddenError('Only Operations Managers may resume blocked tasks');
    }

    const run = async (repos: { taskRepo: ITaskRepository; auditService: AuditService }): Promise<Task> => {
      const task = await repos.taskRepo.findById(request.taskId);
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

      if (task.status !== 'BLOCKED') {
        throw new ValidationError(`Cannot resume task in status ${task.status}. Only BLOCKED tasks can be resumed.`);
      }

      task.resumeBlocked();

      const updated = await repos.taskRepo.update(task, request.expectedVersion);
      if (!updated) {
        const current = await repos.taskRepo.findById(request.taskId);
        throw new ConflictError('Task version conflict', {
          subtype: 'STALE_VERSION',
          currentVersion: current ? current.version : task.version,
          expectedVersion: request.expectedVersion,
        });
      }

      await repos.auditService.logEvent({
        actorId: context.actorId,
        actorRole: context.actorRole,
        action: 'ResumeBlockedTask',
        targetResourceType: 'Task',
        targetResourceId: task.id,
        outcome: 'SUCCESS',
        reason: request.resolutionNotes,
        details: {
          newStatus: task.status,
          updatedVersion: task.version,
        },
      });

      return task;
    };

    if (this.uow) {
      return await this.uow.execute(async (tx) => {
        return run({ taskRepo: tx.taskRepo, auditService: tx.auditService });
      });
    }

    return run({ taskRepo: this.taskRepo, auditService: this.auditService });
  }
}
