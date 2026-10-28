import { TaskType } from '../../domain/task-type.entity';
import type { ITaskTypeRepository } from '../ports/task-type-repository.port';
import type { IOperationalUnitOfWork } from '../../../work-management/application/ports/operational-unit-of-work.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { ConflictError } from '../../../../core/errors';
import type { CreateTaskTypeRequest } from '@novyx/contracts';
import { randomUUID } from 'node:crypto';

export class CreateTaskTypeUseCase {
  constructor(
    private readonly taskTypeRepo: ITaskTypeRepository,
    private readonly auditService: AuditService,
    private readonly uow?: IOperationalUnitOfWork,
  ) {}

  async execute(
    request: CreateTaskTypeRequest,
    context: { actorId: string; actorRole: 'staff' | 'supervisor' | 'manager' | 'admin' },
  ): Promise<TaskType> {
    const run = async (repos: { taskTypeRepo: ITaskTypeRepository; auditService: AuditService }): Promise<TaskType> => {
      const existing = await repos.taskTypeRepo.findByName(request.name);
      if (existing) {
        throw new ConflictError(`TaskType with name "${request.name}" already exists`);
      }

      const taskTypeId = `TT-${randomUUID().slice(0, 8)}`;
      const taskType = new TaskType({
        id: taskTypeId,
        version: 0,
        name: request.name,
        description: request.description,
        defaultProofProfile: request.defaultProofProfile,
        isActive: true,
      });

      await repos.taskTypeRepo.save(taskType);

      await repos.auditService.logEvent({
        actorId: context.actorId,
        actorRole: context.actorRole,
        action: 'CreateTaskType',
        targetResourceType: 'TaskType',
        targetResourceId: taskType.id,
        outcome: 'SUCCESS',
        details: {
          name: taskType.name,
          defaultProofProfile: taskType.defaultProofProfile,
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
