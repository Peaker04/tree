import type { ITreeRepository } from '../ports/tree-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError } from '../../../../core/errors';
import type { UpdateTreeMasterDataRequest } from '@novyx/contracts';
import type { Tree } from '../../domain/tree.entity';

export class UpdateTreeMasterDataUseCase {
  constructor(
    private readonly treeRepo: ITreeRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: UpdateTreeMasterDataRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<Tree> {
    const tree = await this.treeRepo.findById(request.treeId);
    if (!tree) {
      throw new NotFoundError(`Tree with ID ${request.treeId} not found`);
    }

    if (tree.version !== request.expectedVersion) {
      throw new ConflictError('Tree version conflict', {
        subtype: 'STALE_VERSION',
        currentVersion: tree.version,
        expectedVersion: request.expectedVersion,
      });
    }

    tree.updateMasterData({
      name: request.name,
      species: request.species,
      address: request.address,
      healthStatus: request.healthStatus,
      ageYears: request.ageYears,
      riskStatus: request.riskStatus,
    });

    const updated = await this.treeRepo.update(tree, request.expectedVersion);
    if (!updated) {
      const current = await this.treeRepo.findById(request.treeId);
      throw new ConflictError('Tree version conflict', {
        subtype: 'STALE_VERSION',
        currentVersion: current ? current.version : tree.version,
        expectedVersion: request.expectedVersion,
      });
    }

    await this.auditService.logEvent({
      actorId: context.actorId,
      actorRole: context.actorRole,
      action: 'UpdateTreeMasterData',
      targetResourceType: 'Tree',
      targetResourceId: tree.id,
      outcome: 'SUCCESS',
      reason: request.reason,
      details: {
        updatedVersion: tree.version,
      },
    });

    return tree;
  }
}
