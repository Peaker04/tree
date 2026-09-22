import { AsyncLocalStorage } from 'node:async_hooks';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  IOperationalUnitOfWork,
  IOperationalTransactionContext,
} from '../../../modules/work-management/application/ports/operational-unit-of-work.port';
import { DrizzleTaskRepository } from './drizzle-task-repository';
import { DrizzleEvidenceRepository } from './drizzle-evidence-repository';
import { DrizzleCareHistoryRepository } from './drizzle-care-history-repository';
import { DrizzleTreeRepository } from './drizzle-tree-repository';
import { DrizzleTaskTypeRepository } from './drizzle-task-type-repository';
import { DrizzlePolicyRepository } from './drizzle-policy-repository';
import { DrizzleIdempotencyRepository } from './drizzle-idempotency-repository';
import { DrizzleAuditWriter } from './drizzle-audit-writer';
import { AuditService } from '../../../modules/audit-compliance/application/services/audit.service';
import * as schema from '../schema';

export class DrizzleOperationalUnitOfWork implements IOperationalUnitOfWork {
  private static readonly activeTxStorage = new AsyncLocalStorage<IOperationalTransactionContext>();
  private beforeCommitHook?: (() => Promise<void> | void) | undefined;

  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  setBeforeCommitHook(hook?: (() => Promise<void> | void) | undefined): void {
    this.beforeCommitHook = hook;
  }

  async execute<T>(work: (tx: IOperationalTransactionContext) => Promise<T>): Promise<T> {
    const existing = DrizzleOperationalUnitOfWork.activeTxStorage.getStore();
    if (existing) {
      return await work(existing);
    }

    return await this.db.transaction(async (tx) => {
      const txDb = tx as unknown as NodePgDatabase<typeof schema>;
      const taskRepo = new DrizzleTaskRepository(txDb);
      const evidenceRepo = new DrizzleEvidenceRepository(txDb);
      const careHistoryRepo = new DrizzleCareHistoryRepository(txDb);
      const treeRepo = new DrizzleTreeRepository(txDb);
      const taskTypeRepo = new DrizzleTaskTypeRepository(txDb);
      const policyRepo = new DrizzlePolicyRepository(txDb);
      const auditWriter = new DrizzleAuditWriter(txDb);
      const auditService = new AuditService(auditWriter);
      const idempotencyRepo = new DrizzleIdempotencyRepository(txDb);

      const context: IOperationalTransactionContext = {
        taskRepo,
        evidenceRepo,
        careHistoryRepo,
        treeRepo,
        taskTypeRepo,
        policyRepo,
        auditService,
        idempotencyRepo,
      };

      return await DrizzleOperationalUnitOfWork.activeTxStorage.run(context, async () => {
        const result = await work(context);
        if (this.beforeCommitHook) {
          await this.beforeCommitHook();
        }
        return result;
      });
    });
  }
}
