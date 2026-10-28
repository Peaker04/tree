import type { ITaskRepository, ListTasksParams, ListTasksResult } from '../ports/task-repository.port';
import type { HumanRole } from '@novyx/contracts';

export class ListTasksUseCase {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(params: ListTasksParams, context: { actorId: string; actorRole: HumanRole }): Promise<ListTasksResult> {
    // If staff member, force staffId filter to their own ID so they cannot view arbitrary tasks
    const effectiveParams: ListTasksParams =
      context.actorRole === 'staff' ? { ...params, staffId: context.actorId } : params;

    return this.taskRepo.list(effectiveParams);
  }
}
