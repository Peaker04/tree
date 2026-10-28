import type { ITaskRepository } from '../ports/task-repository.port';
import type { IEvidenceRepository } from '../ports/evidence-repository.port';
import type { IOperationalUnitOfWork } from '../ports/operational-unit-of-work.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../../../core/errors';
import type { ResubmitReworkRequest, HumanRole } from '@novyx/contracts';
import type { Task } from '../../domain/task.entity';
import { randomUUID } from 'node:crypto';

export class ResubmitReworkUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly evidenceRepo: IEvidenceRepository,
    private readonly auditService: AuditService,
    private readonly uow?: IOperationalUnitOfWork,
  ) {}

  async execute(request: ResubmitReworkRequest, context: { actorId: string; actorRole: HumanRole }): Promise<Task> {
    if (context.actorRole !== 'staff' && context.actorRole !== 'supervisor') {
      throw new ForbiddenError('Only Field Staff or Field Supervisors may resubmit rework');
    }

    const run = async (repos: {
      taskRepo: ITaskRepository;
      evidenceRepo: IEvidenceRepository;
      auditService: AuditService;
    }): Promise<Task> => {
      const task = await repos.taskRepo.findById(request.taskId);
      if (!task) {
        throw new NotFoundError(`Task with ID ${request.taskId} not found`);
      }

      if (context.actorRole === 'staff' && task.assignedStaffId !== context.actorId) {
        throw new ForbiddenError('Cannot resubmit rework on a task assigned to another staff member');
      }

      if (context.actorRole === 'supervisor') {
        if (task.assignedStaffId === context.actorId) {
          throw new ForbiddenError(
            'Separation of Duties violation (DR-HARD-02): Assigned staff member cannot resubmit supervisor rework',
          );
        }
        if (task.assignedSupervisorId && task.assignedSupervisorId !== context.actorId) {
          throw new ForbiddenError('Cannot resubmit rework on a task assigned to another supervisor');
        }
      }

      if (task.version !== request.expectedVersion) {
        throw new ConflictError('Task version conflict', {
          subtype: 'STALE_VERSION',
          currentVersion: task.version,
          expectedVersion: request.expectedVersion,
        });
      }

      if (task.status !== 'REWORK_REQUIRED') {
        throw new ValidationError(
          `Cannot resubmit rework in status ${task.status}. Resubmissions are only valid from REWORK_REQUIRED.`,
        );
      }

      if (request.reworkedProof.proofProfile !== task.proofProfile) {
        throw new ValidationError(
          `Proof profile mismatch: Task requires ${task.proofProfile}, but resubmission provided ${request.reworkedProof.proofProfile}`,
        );
      }

      // 1. Save new EvidenceAttempt preserving historical attempts (Section 22, 49)
      const existingAttempts = await repos.evidenceRepo.getEvidenceAttempts(task.id);
      const attemptNumber = existingAttempts.length + 1;
      const attemptId = `ATT-${randomUUID().slice(0, 8)}`;

      await repos.evidenceRepo.saveEvidenceAttempt({
        id: attemptId,
        taskId: task.id,
        attemptNumber,
        submittedByUserId: context.actorId, // Historical authorship preserved!
        proofProfile: request.reworkedProof.proofProfile,
        proofData: request.reworkedProof as unknown as Record<string, unknown>,
        notes: request.reworkNotes,
        submittedAt: new Date(),
      });

      // 2. Transition REWORK_REQUIRED -> WAITING_REVIEW
      task.resubmitRework(context.actorId, context.actorRole as 'staff' | 'supervisor');

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
        action: 'ResubmitRework',
        targetResourceType: 'Task',
        targetResourceId: task.id,
        outcome: 'SUCCESS',
        reason: request.reworkNotes,
        details: {
          attemptNumber,
          newStatus: task.status,
          updatedVersion: task.version,
        },
      });

      return task;
    };

    if (this.uow) {
      return await this.uow.execute(async (tx) => {
        return run({ taskRepo: tx.taskRepo, evidenceRepo: tx.evidenceRepo, auditService: tx.auditService });
      });
    }

    return run({ taskRepo: this.taskRepo, evidenceRepo: this.evidenceRepo, auditService: this.auditService });
  }
}
