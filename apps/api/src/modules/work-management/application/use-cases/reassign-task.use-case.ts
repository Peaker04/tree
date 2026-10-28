import type { ITaskRepository } from '../ports/task-repository.port';
import type { IUserRepository } from '../../../iam/application/ports/user-repository.port';
import type { IOperationalScopeRepository } from '../ports/operational-scope-repository.port';
import type { IOperationalUnitOfWork } from '../ports/operational-unit-of-work.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../../../core/errors';
import type { ReassignTaskRequest } from '@novyx/contracts';
import type { Task } from '../../domain/task.entity';

export class ReassignTaskUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly userRepo: IUserRepository,
    private readonly scopeRepo: IOperationalScopeRepository,
    private readonly auditService: AuditService,
    private readonly uow?: IOperationalUnitOfWork,
  ) {}

  async execute(
    request: ReassignTaskRequest,
    context: { actorId: string; actorRole: 'staff' | 'supervisor' | 'manager' | 'admin' },
  ): Promise<Task> {
    if (context.actorRole !== 'manager') {
      throw new ForbiddenError('Only Operations Managers may reassign tasks');
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

      // Direct reassignment checks (DR-HARD-06 / Section 7)
      if (task.status === 'IN_PROGRESS') {
        throw new ValidationError(
          'Direct reassignment of an IN_PROGRESS task is forbidden (DR-HARD-06). Must go through ReportFieldIssue -> BLOCKED -> ReassignTask.',
        );
      }
      if (task.status === 'WAITING_REVIEW' || task.status === 'REWORK_REQUIRED') {
        throw new ValidationError(`Direct reassignment is forbidden when task is in ${task.status}`);
      }
      if (task.isTerminal()) {
        throw new ValidationError(`Cannot reassign terminal task in status ${task.status}`);
      }

      // Verify new staff
      const newStaff = await this.userRepo.findById(request.newStaffId);
      if (!newStaff) {
        throw new NotFoundError(`User with ID ${request.newStaffId} not found`);
      }
      if (newStaff.role !== 'staff') {
        throw new ValidationError(`User ${request.newStaffId} does not have role 'staff'`);
      }
      if (newStaff.accountStatus !== 'ACTIVE') {
        throw new ValidationError(`User ${request.newStaffId} is not ACTIVE (status: ${newStaff.accountStatus})`);
      }

      const previousStaffId = task.assignedStaffId;
      const newStaffName = newStaff.email.split('@')[0] || newStaff.id;
      task.reassign(newStaff.id, newStaffName, request.reason);

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
        action: 'ReassignTask',
        targetResourceType: 'Task',
        targetResourceId: task.id,
        outcome: 'SUCCESS',
        reason: request.reason,
        details: {
          previousStaffId,
          newStaffId: task.assignedStaffId,
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
