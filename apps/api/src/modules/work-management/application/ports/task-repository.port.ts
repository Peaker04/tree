import type { Task, TaskStatus } from '../../domain/task.entity';

export interface ListTasksParams {
  staffId?: string | undefined;
  status?: TaskStatus | undefined;
  treeId?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface ListTasksResult {
  tasks: Task[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  save(task: Task): Promise<void>;
  update(task: Task, expectedVersion: number): Promise<boolean>;
  list(params: ListTasksParams): Promise<ListTasksResult>;
  getHistoricalSubmissionAuthorIds(taskId: string): Promise<string[]>;
}
