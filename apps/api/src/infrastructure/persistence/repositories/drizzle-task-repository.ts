import { eq, and, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Task, type ChecklistItem, type TaskStatus } from '../../../modules/work-management/domain/task.entity';
import type {
  ITaskRepository,
  ListTasksParams,
  ListTasksResult,
} from '../../../modules/work-management/application/ports/task-repository.port';
import * as schema from '../schema';

type StoredChecklistItem = Partial<ChecklistItem> & { label?: unknown; required?: unknown };

const normalizeChecklistSnapshot = (value: unknown): ChecklistItem[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const stored = item as StoredChecklistItem;
    const text = typeof stored.text === 'string' ? stored.text : typeof stored.label === 'string' ? stored.label : '';
    if (!text) return [];
    return [{ id: typeof stored.id === 'string' ? stored.id : `chk-${index + 1}`, text, done: stored.done === true }];
  });
};

export class DrizzleTaskRepository implements ITaskRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  private mapRowToEntity(row: schema.TaskRow): Task {
    return new Task({
      id: row.id,
      version: row.version,
      title: row.title,
      description: row.description,
      taskTypeId: row.taskTypeId,
      taskTypeName: row.taskTypeName,
      proofProfile: row.proofProfile as 'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF',
      policyVersionId: row.policyVersionId ?? undefined,
      checklistTemplateVersionId: row.checklistTemplateVersionId ?? undefined,
      treeId: row.treeId,
      treeName: row.treeName,
      treeAddress: row.treeAddress,
      assignedStaffId: row.assignedStaffId,
      assignedStaffName: row.assignedStaffName,
      deadline: row.deadline,
      status: row.status as TaskStatus,
      checklistSnapshot: normalizeChecklistSnapshot(row.checklistSnapshot),
      cancellationReason: row.cancellationReason ?? undefined,
      cancelledBy: row.cancelledBy ?? undefined,
      cancelledAt: row.cancelledAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Task | null> {
    const rows = await this.db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).limit(1);
    if (!rows || rows.length === 0 || !rows[0]) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async save(task: Task): Promise<void> {
    await this.db.insert(schema.tasks).values({
      id: task.id,
      version: task.version,
      title: task.title,
      description: task.description,
      taskTypeId: task.taskTypeId,
      taskTypeName: task.taskTypeName,
      proofProfile: task.proofProfile,
      policyVersionId: task.policyVersionId ?? null,
      checklistTemplateVersionId: task.checklistTemplateVersionId ?? null,
      treeId: task.treeId,
      treeName: task.treeName,
      treeAddress: task.treeAddress,
      assignedStaffId: task.assignedStaffId,
      assignedStaffName: task.assignedStaffName,
      deadline: task.deadline,
      status: task.status,
      checklistSnapshot: task.checklistSnapshot ?? null,
      cancellationReason: task.cancellationReason ?? null,
      cancelledBy: task.cancelledBy ?? null,
      cancelledAt: task.cancelledAt ?? null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  }

  async update(task: Task, expectedVersion: number): Promise<boolean> {
    const result = await this.db
      .update(schema.tasks)
      .set({
        version: task.version,
        title: task.title,
        description: task.description,
        assignedStaffId: task.assignedStaffId,
        assignedStaffName: task.assignedStaffName,
        deadline: task.deadline,
        status: task.status,
        checklistSnapshot: task.checklistSnapshot ?? null,
        cancellationReason: task.cancellationReason ?? null,
        cancelledBy: task.cancelledBy ?? null,
        cancelledAt: task.cancelledAt ?? null,
        updatedAt: task.updatedAt,
      })
      .where(and(eq(schema.tasks.id, task.id), eq(schema.tasks.version, expectedVersion)));

    return (result.rowCount ?? 0) > 0;
  }

  async list(params: ListTasksParams): Promise<ListTasksResult> {
    const limit = Math.min(params.limit ?? 50, 100);
    const conditions = [];

    if (params.staffId) {
      conditions.push(eq(schema.tasks.assignedStaffId, params.staffId));
    }
    if (params.status) {
      conditions.push(eq(schema.tasks.status, params.status));
    }
    if (params.treeId) {
      conditions.push(eq(schema.tasks.treeId, params.treeId));
    }
    if (params.cursor) {
      conditions.push(sql`${schema.tasks.id} > ${params.cursor}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(schema.tasks)
      .where(whereClause)
      .orderBy(schema.tasks.id)
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const itemRows = hasMore ? rows.slice(0, limit) : rows;
    const tasksList = itemRows.map((r) => this.mapRowToEntity(r));
    const nextCursor = hasMore && tasksList.length > 0 ? (tasksList[tasksList.length - 1]?.id ?? null) : null;

    return {
      tasks: tasksList,
      nextCursor,
      hasMore,
    };
  }

  async getHistoricalSubmissionAuthorIds(taskId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ submittedByUserId: schema.evidenceAttempts.submittedByUserId })
      .from(schema.evidenceAttempts)
      .where(eq(schema.evidenceAttempts.taskId, taskId));

    return rows.map((r) => r.submittedByUserId);
  }
}
