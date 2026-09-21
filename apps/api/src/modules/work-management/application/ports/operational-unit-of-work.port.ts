import type { ITaskRepository } from './task-repository.port';
import type { IEvidenceRepository } from './evidence-repository.port';
import type { ICareHistoryRepository } from '../../../tree-asset-registry/application/ports/care-history-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';

export interface IOperationalTransactionContext {
  readonly taskRepo: ITaskRepository;
  readonly evidenceRepo: IEvidenceRepository;
  readonly careHistoryRepo: ICareHistoryRepository;
  readonly auditService: AuditService;
}

export interface IOperationalUnitOfWork {
  execute<T>(work: (tx: IOperationalTransactionContext) => Promise<T>): Promise<T>;
}
