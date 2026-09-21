import { eq, desc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CareHistoryRecord } from '../../../modules/tree-asset-registry/domain/care-history.entity';
import type { ICareHistoryRepository } from '../../../modules/tree-asset-registry/application/ports/care-history-repository.port';
import * as schema from '../schema';

export class DrizzleCareHistoryRepository implements ICareHistoryRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  private mapRowToEntity(row: schema.CareHistoryRow): CareHistoryRecord {
    return new CareHistoryRecord({
      id: row.id,
      treeId: row.treeId,
      taskId: row.taskId,
      taskTitle: row.taskTitle,
      staffId: row.staffId,
      staffName: row.staffName,
      completedAt: row.completedAt,
      status: row.status,
      hasException: row.hasException,
      exceptionReason: row.exceptionReason ?? undefined,
      gpsCheck: (row.gpsCheck as Record<string, unknown>) ?? undefined,
      qrCheck: (row.qrCheck as Record<string, unknown>) ?? undefined,
      beforePhoto: row.beforePhoto ?? undefined,
      afterPhoto: row.afterPhoto ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
    });
  }

  async findByTreeId(treeId: string): Promise<CareHistoryRecord[]> {
    const rows = await this.db
      .select()
      .from(schema.careHistories)
      .where(eq(schema.careHistories.treeId, treeId))
      .orderBy(desc(schema.careHistories.completedAt));

    return rows.map((r) => this.mapRowToEntity(r));
  }

  async save(record: CareHistoryRecord): Promise<void> {
    await this.db.insert(schema.careHistories).values({
      id: record.id,
      treeId: record.treeId,
      taskId: record.taskId,
      taskTitle: record.taskTitle,
      staffId: record.staffId,
      staffName: record.staffName,
      completedAt: record.completedAt,
      status: record.status,
      hasException: record.hasException,
      exceptionReason: record.exceptionReason ?? null,
      gpsCheck: record.gpsCheck ?? null,
      qrCheck: record.qrCheck ?? null,
      beforePhoto: record.beforePhoto ?? null,
      afterPhoto: record.afterPhoto ?? null,
      notes: record.notes ?? null,
      createdAt: record.createdAt,
    });
  }
}
