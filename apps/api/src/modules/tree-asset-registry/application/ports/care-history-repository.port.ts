import type { CareHistoryRecord } from '../../domain/care-history.entity';

export interface ICareHistoryRepository {
  findByTreeId(treeId: string): Promise<CareHistoryRecord[]>;
  save(record: CareHistoryRecord): Promise<void>;
}
