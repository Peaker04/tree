import type { IAuditWriter, AuditRecordInput } from '../ports/audit-writer.port';

const FORBIDDEN_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'setuptoken',
  'setup_token',
  'tokenhash',
  'token_hash',
  'access_token_hash',
  'refresh_token_hash',
  'secret',
  'authorization',
  'database_url',
  'databaseurl',
]);

export function sanitizeAuditState(state: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!state) return null;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(state)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_KEYS.has(lowerKey)) {
      continue; // redact completely
    }

    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      sanitized[key] = sanitizeAuditState(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export class AuditService {
  constructor(private readonly writer: IAuditWriter) {}

  async record(event: AuditRecordInput): Promise<void> {
    const safeBefore = sanitizeAuditState(event.beforeState);
    const safeAfter = sanitizeAuditState(event.afterState);

    await this.writer.writeEvent({
      ...event,
      beforeState: safeBefore,
      afterState: safeAfter,
    });
  }
}
