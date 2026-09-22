import crypto from 'node:crypto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  IAuditWriter,
  AuditRecordInput,
} from '../../../modules/audit-compliance/application/ports/audit-writer.port';
import { desc, lte } from 'drizzle-orm';
import * as schema from '../schema';

export class DrizzleAuditWriter implements IAuditWriter {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async listEvents(limit: number = 20, cursor?: string) {
    let whereClause = undefined;
    if (cursor) {
      whereClause = lte(schema.auditEvents.id, cursor);
    }
    const rows = await this.db.query.auditEvents.findMany({
      where: whereClause,
      orderBy: [desc(schema.auditEvents.id)],
      limit: limit + 1,
    });
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;
    return {
      data: data.map(r => ({
        id: r.id,
        actorId: r.actorId,
        actorRole: r.actorRole,
        action: r.actionType,
        targetResourceType: r.resourceType,
        targetResourceId: r.resourceId,
        timestamp: r.timestamp.toISOString(),
        outcome: r.outcome,
        details: r.afterState ?? undefined,
      })),
      meta: { hasMore, nextCursor },
    };
  }

  async writeEvent(event: AuditRecordInput): Promise<void> {
    await this.db.insert(schema.auditEvents).values({
      id: event.id ?? crypto.randomUUID(),
      timestamp: new Date(),
      actorId: event.actorId,
      actorRole: event.actorRole,
      actionType: event.actionType,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      outcome: event.outcome,
      clientIp: event.clientIp ?? null,
      userAgent: event.userAgent ?? null,
      correlationId: event.correlationId ?? null,
      beforeState: event.beforeState ?? null,
      afterState: event.afterState ?? null,
    });
  }
}
