import { Task } from '../../domain/task.entity';
import type { ITaskRepository } from '../ports/task-repository.port';
import type { ITreeRepository } from '../../../tree-asset-registry/application/ports/tree-repository.port';
import type { IUserRepository } from '../../../iam/application/ports/user-repository.port';
import type { IOperationalScopeRepository } from '../ports/operational-scope-repository.port';
import type { IOperationalUnitOfWork } from '../ports/operational-unit-of-work.port';
import type { ResolveTaskTypePolicyUseCase } from '../../../policy-template-governance/application/use-cases/resolve-task-type-policy.use-case';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../../core/errors';
import type { CanonicalCreateTaskRequest } from '@novyx/contracts';
import { randomUUID } from 'node:crypto';

export class CreateTaskUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly treeRepo: ITreeRepository,
    private readonly userRepo: IUserRepository,
    private readonly scopeRepo: IOperationalScopeRepository,
    private readonly resolvePolicy: ResolveTaskTypePolicyUseCase,
    private readonly auditService: AuditService,
    private readonly uow?: IOperationalUnitOfWork,
  ) {}

  async execute(
    request: CanonicalCreateTaskRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<Task> {
    // 1. Role enforcement
    if (context.actorRole !== 'manager') {
      throw new ForbiddenError('Only Operations Managers may create operational tasks');
    }

    // 2. Future deadline validation (W4-C05)
    const deadlineDate = new Date(request.deadline);
    if (isNaN(deadlineDate.getTime())) {
      throw new ValidationError('Task deadline must be a valid ISO-8601 timestamp');
    }
    if (deadlineDate.getTime() <= Date.now()) {
      throw new ValidationError('Task deadline must be in the future at creation time');
    }

    // 3. Operational scope enforcement
    const hasScope = await this.scopeRepo.hasScope(context.actorId, request.treeId);
    if (!hasScope) {
      throw new ForbiddenError(
        `Manager ${context.actorId} does not have authorized operational scope for tree ${request.treeId}`,
      );
    }

    // 4. Tree validation
    const tree = await this.treeRepo.findById(request.treeId);
    if (!tree) {
      throw new NotFoundError(`Tree with ID ${request.treeId} not found`);
    }
    if (tree.isRetired) {
      throw new ValidationError(`Cannot create task on retired tree ${tree.id}`);
    }

    // 5. Assigned staff validation
    const staffUser = await this.userRepo.findById(request.assignedStaffId);
    if (!staffUser) {
      throw new NotFoundError(`Assigned user with ID ${request.assignedStaffId} not found`);
    }
    if (staffUser.role !== 'staff') {
      throw new ValidationError(`User ${request.assignedStaffId} does not have role 'staff'`);
    }
    if (staffUser.accountStatus !== 'ACTIVE') {
      throw new ValidationError(`User ${request.assignedStaffId} is not ACTIVE (status: ${staffUser.accountStatus})`);
    }

    // 6. TaskType & Policy deterministic resolution (DR-MVP-02 / Section 16 / W4-C04)
    const policy = await this.resolvePolicy.execute(request.taskTypeId);

    const taskId = `TSK-${randomUUID().slice(0, 8)}`;
    const task = new Task({
      id: taskId,
      version: 0,
      title: request.title,
      description: request.description,
      taskTypeId: policy.taskType.id,
      taskTypeName: policy.taskType.name,
      proofProfile: policy.proofProfile,
      policyVersionId: policy.policyVersionId,
      checklistTemplateVersionId: policy.checklistTemplateVersionId,
      treeId: tree.id,
      treeName: tree.name,
      treeAddress: tree.address,
      assignedStaffId: staffUser.id,
      assignedStaffName: staffUser.email.split('@')[0] || staffUser.id,
      deadline: request.deadline,
      status: 'PENDING',
      checklistSnapshot: policy.checklistSnapshot,
    });

    const persistTask = async (taskRepo: ITaskRepository, auditService: AuditService) => {
      await taskRepo.save(task);

      await auditService.logEvent({
        actorId: context.actorId,
        actorRole: context.actorRole,
        action: 'CreateTask',
        targetResourceType: 'Task',
        targetResourceId: task.id,
        outcome: 'SUCCESS',
        details: {
          treeId: task.treeId,
          taskTypeId: task.taskTypeId,
          proofProfile: task.proofProfile,
          assignedStaffId: task.assignedStaffId,
        },
      });
    };

    if (this.uow) {
      await this.uow.execute(async (tx) => {
        await persistTask(tx.taskRepo, tx.auditService);
      });
    } else {
      await persistTask(this.taskRepo, this.auditService);
    }

    return task;
  }
}
