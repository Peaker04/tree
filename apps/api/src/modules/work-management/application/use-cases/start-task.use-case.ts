import type { ITaskRepository } from '../ports/task-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../../../core/errors';
import type { StartTaskRequest } from '@novyx/contracts';
import type { Task } from '../../domain/task.entity';

export class StartTaskUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: StartTaskRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<Task> {
    if (context.actorRole !== 'staff') {
      throw new ForbiddenError('Only Field Staff may start tasks');
    }

    const task = await this.taskRepo.findById(request.taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${request.taskId} not found`);
    }

    if (task.assignedStaffId !== context.actorId) {
      throw new ForbiddenError(`Cannot start task assigned to another staff member (${task.assignedStaffId})`);
    }

    if (task.version !== request.expectedVersion) {
      throw new ConflictError('Task version conflict', {
        subtype: 'STALE_VERSION',
        currentVersion: task.version,
        expectedVersion: request.expectedVersion,
      });
    }

    if (task.status !== 'PENDING') {
      throw new ValidationError(`Cannot start task in status ${task.status}. Only PENDING tasks can be started.`);
    }

    task.start(context.actorId);

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
      action: 'StartTask',
      targetResourceType: 'Task',
      targetResourceId: task.id,
      outcome: 'SUCCESS',
      details: {
        newStatus: task.status,
        updatedVersion: task.version,
      },
    });

    return task;
  }
}
