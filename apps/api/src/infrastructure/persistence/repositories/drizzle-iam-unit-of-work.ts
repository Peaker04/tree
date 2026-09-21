import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  IIamUnitOfWork,
  IIamTransactionContext,
} from '../../../modules/iam/application/ports/iam-unit-of-work.port';
import { DrizzleUserRepository } from './drizzle-user-repository';
import { DrizzleSessionRepository } from './drizzle-session-repository';
import { DrizzleAuditWriter } from './drizzle-audit-writer';
import * as schema from '../schema';

export class DrizzleIamUnitOfWork implements IIamUnitOfWork {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async execute<T>(work: (tx: IIamTransactionContext) => Promise<T>): Promise<T> {
    return await this.db.transaction(async (tx) => {
      const userRepository = new DrizzleUserRepository(tx as unknown as NodePgDatabase<typeof schema>);
      const sessionRepository = new DrizzleSessionRepository(tx as unknown as NodePgDatabase<typeof schema>);
      const auditWriter = new DrizzleAuditWriter(tx as unknown as NodePgDatabase<typeof schema>);

      return await work({
        userRepository,
        sessionRepository,
        auditWriter,
      });
    });
  }
}
