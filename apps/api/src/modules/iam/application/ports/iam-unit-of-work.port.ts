import type { IUserRepository } from './user-repository.port';
import type { ISessionRepository } from './session-repository.port';
import type { IAuditWriter } from '../../../audit-compliance/application/ports/audit-writer.port';

export interface IIamTransactionContext {
  userRepository: IUserRepository;
  sessionRepository: ISessionRepository;
  auditWriter: IAuditWriter;
}

export interface IIamUnitOfWork {
  execute<T>(work: (tx: IIamTransactionContext) => Promise<T>): Promise<T>;
}
