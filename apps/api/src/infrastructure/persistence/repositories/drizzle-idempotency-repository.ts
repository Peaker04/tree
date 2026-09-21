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
      status: (r.status as 'PROCESSING' | 'COMPLETED') ?? 'COMPLETED',
      responseStatus: r.responseStatus,
      responseBody: r.responseBody,
      createdAt: r.createdAt,
    };
  }

  async claim(record: {
    id: string;
    idempotencyKey: string;
    actorId: string;
    requestRoute: string;
    requestHash: string;
  }): Promise<boolean> {
    try {
      await this.db.insert(schema.idempotencyRecords).values({
        id: record.id,
        idempotencyKey: record.idempotencyKey,
        actorId: record.actorId,
        requestRoute: record.requestRoute,
        requestHash: record.requestHash,
        status: 'PROCESSING',
        responseStatus: null,
        responseBody: null,
        createdAt: new Date(),
      });
      return true;
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        return false;
      }
      throw err;
    }
  }

  async complete(params: {
    actorId: string;
    idempotencyKey: string;
    responseStatus: number;
    responseBody: string;
  }): Promise<void> {
    await this.db
      .update(schema.idempotencyRecords)
      .set({
        status: 'COMPLETED',
        responseStatus: params.responseStatus,
        responseBody: params.responseBody,
      })
      .where(
        and(
          eq(schema.idempotencyRecords.actorId, params.actorId),
          eq(schema.idempotencyRecords.idempotencyKey, params.idempotencyKey),
        ),
      );
  }

  async delete(actorId: string, idempotencyKey: string): Promise<void> {
    await this.db
      .delete(schema.idempotencyRecords)
      .where(
        and(
          eq(schema.idempotencyRecords.actorId, actorId),
          eq(schema.idempotencyRecords.idempotencyKey, idempotencyKey),
        ),
      );
  }

  async save(record: IdempotencyRecord): Promise<void> {
    await this.db
      .insert(schema.idempotencyRecords)
      .values({
        id: record.id,
        idempotencyKey: record.idempotencyKey,
        actorId: record.actorId,
        requestRoute: record.requestRoute,
        requestHash: record.requestHash,
        status: record.status ?? 'COMPLETED',
        responseStatus: record.responseStatus ?? null,
        responseBody: record.responseBody ?? null,
        createdAt: record.createdAt ?? new Date(),
      })
      .onConflictDoUpdate({
        target: [schema.idempotencyRecords.actorId, schema.idempotencyRecords.idempotencyKey],
        set: {
          status: record.status ?? 'COMPLETED',
          responseStatus: record.responseStatus ?? null,
          responseBody: record.responseBody ?? null,
        },
      });
  }
}
