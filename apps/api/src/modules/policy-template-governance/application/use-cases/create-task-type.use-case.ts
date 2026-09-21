import { TaskType } from '../../domain/task-type.entity';
import type { ITaskTypeRepository } from '../ports/task-type-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { ConflictError } from '../../../../core/errors';
import type { CreateTaskTypeRequest } from '@novyx/contracts';
import { randomUUID } from 'node:crypto';

export class CreateTaskTypeUseCase {
  constructor(
    private readonly taskTypeRepo: ITaskTypeRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: CreateTaskTypeRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<TaskType> {
    const existing = await this.taskTypeRepo.findByName(request.name);
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

    await this.taskTypeRepo.save(taskType);

    await this.auditService.logEvent({
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
  }
}
