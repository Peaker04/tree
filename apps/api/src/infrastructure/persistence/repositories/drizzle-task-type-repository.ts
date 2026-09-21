import { eq, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { TaskType } from '../../../modules/policy-template-governance/domain/task-type.entity';
import type { ITaskTypeRepository } from '../../../modules/policy-template-governance/application/ports/task-type-repository.port';
import * as schema from '../schema';

export class DrizzleTaskTypeRepository implements ITaskTypeRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  private mapRowToEntity(row: schema.TaskTypeRow): TaskType {
    return new TaskType({
      id: row.id,
      version: row.version,
      name: row.name,
      description: row.description ?? undefined,
      defaultProofProfile: row.defaultProofProfile as 'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF',
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<TaskType | null> {
    const rows = await this.db.select().from(schema.taskTypes).where(eq(schema.taskTypes.id, id)).limit(1);
    if (!rows || rows.length === 0 || !rows[0]) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findByName(name: string): Promise<TaskType | null> {
    const rows = await this.db.select().from(schema.taskTypes).where(eq(schema.taskTypes.name, name)).limit(1);
    if (!rows || rows.length === 0 || !rows[0]) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async save(taskType: TaskType): Promise<void> {
    await this.db.insert(schema.taskTypes).values({
      id: taskType.id,
      version: taskType.version,
      name: taskType.name,
      description: taskType.description ?? null,
      defaultProofProfile: taskType.defaultProofProfile,
      isActive: taskType.isActive,
      createdAt: taskType.createdAt,
      updatedAt: taskType.updatedAt,
    });
  }

  async update(taskType: TaskType, expectedVersion: number): Promise<boolean> {
    const result = await this.db
      .update(schema.taskTypes)
      .set({
        version: taskType.version,
        name: taskType.name,
        description: taskType.description ?? null,
        defaultProofProfile: taskType.defaultProofProfile,
        isActive: taskType.isActive,
        updatedAt: taskType.updatedAt,
      })
      .where(and(eq(schema.taskTypes.id, taskType.id), eq(schema.taskTypes.version, expectedVersion)));

    return (result.rowCount ?? 0) > 0;
  }

  async listAll(): Promise<TaskType[]> {
    const rows = await this.db.select().from(schema.taskTypes).orderBy(schema.taskTypes.name);
    return rows.map((r) => this.mapRowToEntity(r));
  }
}
