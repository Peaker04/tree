import type { ITreeRepository } from '../ports/tree-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError } from '../../../../core/errors';
import type { RetireTreeRequest } from '@novyx/contracts';
import type { Tree } from '../../domain/tree.entity';

export class RetireTreeUseCase {
  constructor(
    private readonly treeRepo: ITreeRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: RetireTreeRequest,
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

    tree.retire(request.reason);

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
      action: 'RetireTree',
      targetResourceType: 'Tree',
      targetResourceId: tree.id,
      outcome: 'SUCCESS',
      reason: request.reason,
      details: {
        isRetired: true,
        retiredAt: tree.retiredAt?.toISOString(),
        updatedVersion: tree.version,
      },
    });

    return tree;
  }
}
