import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  IOperationalUnitOfWork,
  IOperationalTransactionContext,
} from '../../../modules/work-management/application/ports/operational-unit-of-work.port';
import { DrizzleTaskRepository } from './drizzle-task-repository';
import { DrizzleEvidenceRepository } from './drizzle-evidence-repository';
import { DrizzleCareHistoryRepository } from './drizzle-care-history-repository';
import { DrizzleAuditWriter } from './drizzle-audit-writer';
import { AuditService } from '../../../modules/audit-compliance/application/services/audit.service';
import * as schema from '../schema';

export class DrizzleOperationalUnitOfWork implements IOperationalUnitOfWork {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async execute<T>(work: (tx: IOperationalTransactionContext) => Promise<T>): Promise<T> {
    return await this.db.transaction(async (tx) => {
      const txDb = tx as unknown as NodePgDatabase<typeof schema>;
      const taskRepo = new DrizzleTaskRepository(txDb);
      const evidenceRepo = new DrizzleEvidenceRepository(txDb);
      const careHistoryRepo = new DrizzleCareHistoryRepository(txDb);
      const auditWriter = new DrizzleAuditWriter(txDb);
      const auditService = new AuditService(auditWriter);

      return await work({
        taskRepo,
        evidenceRepo,
        careHistoryRepo,
        auditService,
      });
    });
  }
}
