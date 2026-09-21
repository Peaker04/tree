import type { ITreeRepository, ListTreesParams, ListTreesResult } from '../ports/tree-repository.port';

export class ListTreesUseCase {
  constructor(private readonly treeRepo: ITreeRepository) {}

  async execute(params: ListTreesParams): Promise<ListTreesResult> {
    return this.treeRepo.list(params);
  }
}
