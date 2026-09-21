import type { ITaskRepository } from './task-repository.port';
import type { IEvidenceRepository } from './evidence-repository.port';
import type { ICareHistoryRepository } from '../../../tree-asset-registry/application/ports/care-history-repository.port';
import type { ITreeRepository } from '../../../tree-asset-registry/application/ports/tree-repository.port';
import type { ITaskTypeRepository } from '../../../policy-template-governance/application/ports/task-type-repository.port';
import type { IPolicyRepository } from '../../../policy-template-governance/application/ports/policy-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import type { IIdempotencyRepository } from './idempotency-repository.port';

export interface IOperationalTransactionContext {
  readonly taskRepo: ITaskRepository;
  readonly evidenceRepo: IEvidenceRepository;
  readonly careHistoryRepo: ICareHistoryRepository;
  readonly treeRepo: ITreeRepository;
  readonly taskTypeRepo: ITaskTypeRepository;
  readonly policyRepo: IPolicyRepository;
  readonly auditService: AuditService;
  readonly idempotencyRepo: IIdempotencyRepository;
}

export interface IOperationalUnitOfWork {
  execute<T>(work: (tx: IOperationalTransactionContext) => Promise<T>): Promise<T>;
}
