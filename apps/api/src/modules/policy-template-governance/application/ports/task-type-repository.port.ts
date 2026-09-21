import type { TaskType } from '../../domain/task-type.entity';

export interface ITaskTypeRepository {
  findById(id: string): Promise<TaskType | null>;
  findByName(name: string): Promise<TaskType | null>;
  save(taskType: TaskType): Promise<void>;
  update(taskType: TaskType, expectedVersion: number): Promise<boolean>;
  listAll(): Promise<TaskType[]>;
}
