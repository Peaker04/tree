import type { ICareHistoryRepository } from '../ports/care-history-repository.port';
import type { CareHistoryRecord } from '../../domain/care-history.entity';

export class GetCareHistoryUseCase {
  constructor(private readonly careHistoryRepo: ICareHistoryRepository) {}

  async execute(treeId: string): Promise<CareHistoryRecord[]> {
    return this.careHistoryRepo.findByTreeId(treeId);
  }
}
