import crypto from 'node:crypto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  IAuditWriter,
  AuditRecordInput,
} from '../../../modules/audit-compliance/application/ports/audit-writer.port';
import * as schema from '../schema';

export class DrizzleAuditWriter implements IAuditWriter {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

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
