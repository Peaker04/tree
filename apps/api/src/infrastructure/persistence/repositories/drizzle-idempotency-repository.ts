import { eq, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  IIdempotencyRepository,
  IdempotencyRecord,
} from '../../../modules/work-management/application/ports/idempotency-repository.port';
import * as schema from '../schema';

export class DrizzleIdempotencyRepository implements IIdempotencyRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findByKey(actorId: string, idempotencyKey: string): Promise<IdempotencyRecord | null> {
    const rows = await this.db
      .select()
      .from(schema.idempotencyRecords)
      .where(
        and(
          eq(schema.idempotencyRecords.actorId, actorId),
          eq(schema.idempotencyRecords.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    if (!rows || rows.length === 0 || !rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      idempotencyKey: r.idempotencyKey,
      actorId: r.actorId,
      requestRoute: r.requestRoute,
      requestHash: r.requestHash,
      responseStatus: r.responseStatus,
      responseBody: r.responseBody,
      createdAt: r.createdAt,
    };
  }

  async save(record: IdempotencyRecord): Promise<void> {
    await this.db.insert(schema.idempotencyRecords).values({
      id: record.id,
      idempotencyKey: record.idempotencyKey,
      actorId: record.actorId,
      requestRoute: record.requestRoute,
      requestHash: record.requestHash,
      responseStatus: record.responseStatus,
      responseBody: record.responseBody,
      createdAt: record.createdAt ?? new Date(),
    });
  }
}
