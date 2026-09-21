import { eq, and, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'node:crypto';
import type { IOperationalScopeRepository } from '../../../modules/work-management/application/ports/operational-scope-repository.port';
import * as schema from '../schema';

export class DrizzleManagerScopeRepository implements IOperationalScopeRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async hasScope(managerId: string, scopeKey: string): Promise<boolean> {
    const rows = await this.db
      .select()
      .from(schema.managerOperationalScopes)
      .where(
        and(
          eq(schema.managerOperationalScopes.managerId, managerId),
          or(
            eq(schema.managerOperationalScopes.scopeKey, scopeKey),
            eq(schema.managerOperationalScopes.scopeKey, 'GLOBAL'),
          ),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  async addScope(managerId: string, scopeKey: string): Promise<void> {
    await this.db.insert(schema.managerOperationalScopes).values({
      id: randomUUID(),
      managerId,
      scopeKey,
      createdAt: new Date(),
    });
  }

  async getScopes(managerId: string): Promise<string[]> {
    const rows = await this.db
      .select()
      .from(schema.managerOperationalScopes)
      .where(eq(schema.managerOperationalScopes.managerId, managerId));

    return rows.map((r) => r.scopeKey);
  }
}
