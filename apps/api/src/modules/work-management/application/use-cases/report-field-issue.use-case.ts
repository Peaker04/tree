import type { ITaskRepository } from '../ports/task-repository.port';
import type { IEvidenceRepository } from '../ports/evidence-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../../../core/errors';
import type { ReportFieldIssueRequest } from '@novyx/contracts';
import type { Task } from '../../domain/task.entity';
import { randomUUID } from 'node:crypto';

export class ReportFieldIssueUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly evidenceRepo: IEvidenceRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: ReportFieldIssueRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<Task> {
    if (context.actorRole !== 'staff') {
      throw new ForbiddenError('Only Field Staff may report field issues');
    }

    const task = await this.taskRepo.findById(request.taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${request.taskId} not found`);
    }

    if (task.assignedStaffId !== context.actorId) {
      throw new ForbiddenError('Cannot report field issue on a task assigned to another staff member');
    }

    if (task.version !== request.expectedVersion) {
      throw new ConflictError('Task version conflict', {
        subtype: 'STALE_VERSION',
        currentVersion: task.version,
        expectedVersion: request.expectedVersion,
      });
    }

    if (task.status !== 'IN_PROGRESS') {
      throw new ValidationError(
        `Cannot report field issue in status ${task.status}. Field issues can only be reported from IN_PROGRESS.`,
      );
    }

    task.reportFieldIssue(context.actorId);

    const updated = await this.taskRepo.update(task, request.expectedVersion);
    if (!updated) {
      const current = await this.taskRepo.findById(request.taskId);
      throw new ConflictError('Task version conflict', {
        subtype: 'STALE_VERSION',
        currentVersion: current ? current.version : task.version,
        expectedVersion: request.expectedVersion,
      });
    }

    // Save field issue record
    await this.evidenceRepo.saveFieldIssue({
      id: `ISS-${randomUUID().slice(0, 8)}`,
      taskId: task.id,
      reportedByUserId: context.actorId,
      issueDescription: request.issueDescription,
      issuePhotoStorageRef: request.issuePhotoUri,
      reportedAt: new Date(),
    });

    await this.auditService.logEvent({
      actorId: context.actorId,
      actorRole: context.actorRole,
      action: 'ReportFieldIssue',
      targetResourceType: 'Task',
      targetResourceId: task.id,
      outcome: 'SUCCESS',
      details: {
        newStatus: task.status,
        issueDescription: request.issueDescription,
        updatedVersion: task.version,
      },
    });

    return task;
  }
}
