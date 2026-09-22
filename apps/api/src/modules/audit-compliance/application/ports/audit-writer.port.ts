import type { AuditOutcome, HumanRole } from '@novyx/contracts';

export interface AuditRecordInput {
  id?: string | undefined;
  actorId: string;
  actorRole: HumanRole;
  actionType: string;
  resourceType: string;
  resourceId: string;
  outcome: AuditOutcome;
  clientIp?: string | null | undefined;
  userAgent?: string | null | undefined;
  correlationId?: string | null | undefined;
  beforeState?: Record<string, unknown> | null | undefined;
  afterState?: Record<string, unknown> | null | undefined;
}

export interface IAuditWriter {
  writeEvent(event: AuditRecordInput): Promise<void>;
  listEvents(
    limit?: number,
    cursor?: string,
  ): Promise<{ data: unknown[]; meta: { hasMore: boolean; nextCursor: string | null } }>;
}
