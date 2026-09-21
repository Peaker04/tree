import type { Tree } from '../../domain/tree.entity';

export interface ListTreesParams {
  q?: string | undefined;
  riskStatus?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface ListTreesResult {
  trees: Tree[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ITreeRepository {
  findById(id: string): Promise<Tree | null>;
  findByQrCode(qrCode: string): Promise<Tree | null>;
  save(tree: Tree): Promise<void>;
  update(tree: Tree, expectedVersion: number): Promise<boolean>;
  list(params: ListTreesParams): Promise<ListTreesResult>;
}
