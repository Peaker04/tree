import type { ITreeRepository } from '../ports/tree-repository.port';
import { NotFoundError } from '../../../../core/errors';
import type { Tree } from '../../domain/tree.entity';

export class GetTreeUseCase {
  constructor(private readonly treeRepo: ITreeRepository) {}

  async execute(id: string): Promise<Tree> {
    const tree = await this.treeRepo.findById(id);
    if (!tree) {
      throw new NotFoundError(`Tree with ID ${id} not found`);
    }
    return tree;
  }

  async executeByQrCode(qrCode: string): Promise<Tree> {
    const tree = await this.treeRepo.findByQrCode(qrCode);
    if (!tree) {
      throw new NotFoundError(`Tree with QR code ${qrCode} not found`);
    }
    return tree;
  }
}
