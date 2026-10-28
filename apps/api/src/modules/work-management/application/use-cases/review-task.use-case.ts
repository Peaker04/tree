import type { ITaskRepository } from '../ports/task-repository.port';
import type { IEvidenceRepository } from '../ports/evidence-repository.port';
import type { ICareHistoryRepository } from '../../../tree-asset-registry/application/ports/care-history-repository.port';
import type { IOperationalScopeRepository } from '../ports/operational-scope-repository.port';
import type { IOperationalUnitOfWork } from '../ports/operational-unit-of-work.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../../../core/errors';
import { CareHistoryRecord } from '../../../tree-asset-registry/domain/care-history.entity';
import type { Task } from '../../domain/task.entity';
import type { HumanRole } from '@novyx/contracts';
import { randomUUID } from 'node:crypto';

export interface ReviewTaskCommand {
  taskId: string;
  expectedVersion: number;
  decision: 'APPROVE' | 'APPROVE_WITH_EXCEPTION' | 'REQUEST_REWORK' | 'CANCEL';
  notes?: string | undefined;
  exceptionReason?: string | undefined;
  targetedArea?: string | undefined;
  reworkReason?: string | undefined;
}

export class ReviewTaskUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly evidenceRepo: IEvidenceRepository,
    private readonly careHistoryRepo: ICareHistoryRepository,
    private readonly scopeRepo: IOperationalScopeRepository,
    private readonly auditService: AuditService,
    private readonly uow?: IOperationalUnitOfWork,
  ) {}

  async execute(command: ReviewTaskCommand, context: { actorId: string; actorRole: HumanRole }): Promise<Task> {
    if (context.actorRole !== 'manager') {
      throw new ForbiddenError('Only Operations Managers may review tasks');
    }

    const task = await this.taskRepo.findById(command.taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${command.taskId} not found`);
    }

    const hasScope = await this.scopeRepo.hasScope(context.actorId, task.treeId);
    if (!hasScope) {
      throw new ForbiddenError(`Manager ${context.actorId} does not have authorized operational scope for this task`);
    }

    if (task.version !== command.expectedVersion) {
      throw new ConflictError('Task version conflict', {
        subtype: 'STALE_VERSION',
        currentVersion: task.version,
        expectedVersion: command.expectedVersion,
      });
    }

    if (task.status !== 'WAITING_REVIEW') {
      throw new ValidationError(
        `Cannot review task in status ${task.status}. Reviews are only valid when task is WAITING_REVIEW.`,
      );
    }

    // Separation of Duties (DR-HARD-02 / SoD-02 / Section 10):
    // Reviewer cannot be a historical evidence/submission author
    const historicalAuthors = await this.taskRepo.getHistoricalSubmissionAuthorIds(task.id);
    if (historicalAuthors.includes(context.actorId)) {
      throw new ForbiddenError(
        'Separation of Duties violation (DR-HARD-02): Reviewer cannot approve or review evidence they historically submitted',
      );
    }

    // Validation of decision-specific parameters
    if (command.decision === 'APPROVE_WITH_EXCEPTION') {
      if (!command.exceptionReason || command.exceptionReason.trim().length < 5) {
        throw new ValidationError('Exception reason must be at least 5 characters');
      }
    } else if (command.decision === 'REQUEST_REWORK') {
      if (!command.targetedArea || command.targetedArea.trim().length === 0) {
        throw new ValidationError('Targeted area is required for rework request');
      }
      if (!command.reworkReason || command.reworkReason.trim().length < 5) {
        throw new ValidationError('Rework reason must be at least 5 characters');
      }
    } else if (command.decision !== 'APPROVE' && command.decision !== 'CANCEL') {
      throw new ValidationError(`Unknown review decision: ${command.decision}`);
    }

    const existingAttempts = await this.evidenceRepo.getEvidenceAttempts(task.id);
    const latestAttempt = existingAttempts.length > 0 ? existingAttempts[existingAttempts.length - 1] : undefined;

    const reviewId = `REV-${randomUUID().slice(0, 8)}`;

    const performReviewTransaction = async (
      taskRepo: ITaskRepository,
      evidenceRepo: IEvidenceRepository,
      careHistoryRepo: ICareHistoryRepository,
      auditService: AuditService,
    ): Promise<Task> => {
      // Re-fetch under transaction to ensure atomic authoritative state & OCC lock
      const authoritativeTask = await taskRepo.findById(command.taskId);
      if (!authoritativeTask || authoritativeTask.version !== command.expectedVersion) {
        throw new ConflictError('Task version conflict', {
          subtype: 'STALE_VERSION',
          currentVersion: authoritativeTask ? authoritativeTask.version : task.version,
          expectedVersion: command.expectedVersion,
        });
      }

      if (authoritativeTask.status !== 'WAITING_REVIEW') {
        throw new ValidationError(
          `Cannot review task in status ${authoritativeTask.status}. Reviews are only valid when task is WAITING_REVIEW.`,
        );
      }

      let careHistory: CareHistoryRecord | undefined;

      if (command.decision === 'APPROVE') {
        authoritativeTask.approve();

        careHistory = new CareHistoryRecord({
          id: `CH-${randomUUID().slice(0, 8)}`,
          treeId: authoritativeTask.treeId,
          taskId: authoritativeTask.id,
          taskTitle: authoritativeTask.title,
          staffId: authoritativeTask.assignedStaffId,
          staffName: authoritativeTask.assignedStaffName,
          completedAt: new Date(),
          status: 'COMPLETED',
          hasException: false,
          gpsCheck: latestAttempt?.siteVerification?.['gpsCheck'] as Record<string, unknown> | undefined,
          qrCheck: latestAttempt?.siteVerification?.['qrCheck'] as Record<string, unknown> | undefined,
          beforePhoto: (latestAttempt?.proofData?.['beforePhotoUri'] as string) || undefined,
          afterPhoto:
            (latestAttempt?.proofData?.['afterPhotoUri'] as string) ||
            (latestAttempt?.proofData?.['completionPhotoUri'] as string) ||
            undefined,
          notes: command.notes,
        });
      } else if (command.decision === 'APPROVE_WITH_EXCEPTION') {
        authoritativeTask.approveWithException(command.exceptionReason!);

        careHistory = new CareHistoryRecord({
          id: `CH-${randomUUID().slice(0, 8)}`,
          treeId: authoritativeTask.treeId,
          taskId: authoritativeTask.id,
          taskTitle: authoritativeTask.title,
          staffId: authoritativeTask.assignedStaffId,
          staffName: authoritativeTask.assignedStaffName,
          completedAt: new Date(),
          status: 'COMPLETED',
          hasException: true,
          exceptionReason: command.exceptionReason,
          gpsCheck: latestAttempt?.siteVerification?.['gpsCheck'] as Record<string, unknown> | undefined,
          qrCheck: latestAttempt?.siteVerification?.['qrCheck'] as Record<string, unknown> | undefined,
          beforePhoto: (latestAttempt?.proofData?.['beforePhotoUri'] as string) || undefined,
          afterPhoto:
            (latestAttempt?.proofData?.['afterPhotoUri'] as string) ||
            (latestAttempt?.proofData?.['completionPhotoUri'] as string) ||
            undefined,
          notes: command.notes,
        });
      } else if (command.decision === 'REQUEST_REWORK') {
        authoritativeTask.requestRework(command.targetedArea!, command.reworkReason!);
        // Notice: NO CareHistory projection created for rework!
      } else if (command.decision === 'CANCEL') {
        const cancelReason = command.reworkReason || command.notes || 'Cancelled during review';
        authoritativeTask.cancel(context.actorId, cancelReason);
        // Notice: NO CareHistory projection created for cancellation!
      }

      // 1. OCC transition Task first or in same transaction
      const updated = await taskRepo.update(authoritativeTask, command.expectedVersion);
      if (!updated) {
        throw new ConflictError('Task version conflict', {
          subtype: 'STALE_VERSION',
          currentVersion: authoritativeTask.version,
          expectedVersion: command.expectedVersion,
        });
      }

      // 2. Persist CareHistory if approved
      if (careHistory) {
        await careHistoryRepo.save(careHistory);
      }

      // 3. Save review record
      await evidenceRepo.saveTaskReview({
        id: reviewId,
        taskId: authoritativeTask.id,
        evidenceAttemptId: latestAttempt?.id,
        reviewerId: context.actorId,
        decision: command.decision,
        notes: command.notes,
        exceptionReason: command.exceptionReason,
        targetedArea: command.targetedArea,
        reworkReason: command.reworkReason,
        reviewedAt: new Date(),
      });

      // 4. Record SUCCESS audit
      await auditService.logEvent({
        actorId: context.actorId,
        actorRole: context.actorRole,
        action:
          command.decision === 'REQUEST_REWORK'
            ? 'RequestRework'
            : command.decision === 'CANCEL'
              ? 'CancelTask'
              : 'ApproveTask',
        targetResourceType: 'Task',
        targetResourceId: authoritativeTask.id,
        outcome: 'SUCCESS',
        reason: command.reworkReason || command.exceptionReason || command.notes,
        details: {
          decision: command.decision,
          newStatus: authoritativeTask.status,
          updatedVersion: authoritativeTask.version,
        },
      });

      return authoritativeTask;
    };

    if (this.uow) {
      return await this.uow.execute(async (tx) => {
        return await performReviewTransaction(tx.taskRepo, tx.evidenceRepo, tx.careHistoryRepo, tx.auditService);
      });
    } else {
      return await performReviewTransaction(this.taskRepo, this.evidenceRepo, this.careHistoryRepo, this.auditService);
    }
  }
}
