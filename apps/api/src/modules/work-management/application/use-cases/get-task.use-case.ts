import type { ITaskRepository } from '../ports/task-repository.port';
import { NotFoundError, ForbiddenError } from '../../../../core/errors';
import type { Task } from '../../domain/task.entity';
import type { HumanRole } from '@novyx/contracts';

export class GetTaskUseCase {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(taskId: string, context: { actorId: string; actorRole: HumanRole }): Promise<Task> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }

    // Read authorization: Staff may only view their assigned task (Section 50)
    if (context.actorRole === 'staff' && task.assignedStaffId !== context.actorId) {
      throw new ForbiddenError('Staff members may only access tasks assigned to them');
    }

    return task;
  }
}
