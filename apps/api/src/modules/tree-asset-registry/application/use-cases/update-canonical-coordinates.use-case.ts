import type { ITreeRepository } from '../ports/tree-repository.port';
import type { IOperationalUnitOfWork } from '../../../work-management/application/ports/operational-unit-of-work.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError } from '../../../../core/errors';
import type { UpdateCanonicalCoordinatesRequest } from '@novyx/contracts';
import type { Tree } from '../../domain/tree.entity';

export class UpdateCanonicalCoordinatesUseCase {
  constructor(
    private readonly treeRepo: ITreeRepository,
    private readonly auditService: AuditService,
    private readonly uow?: IOperationalUnitOfWork,
  ) {}

  async execute(
    request: UpdateCanonicalCoordinatesRequest,
    context: { actorId: string; actorRole: 'staff' | 'supervisor' | 'manager' | 'admin' },
  ): Promise<Tree> {
    const run = async (repos: { treeRepo: ITreeRepository; auditService: AuditService }): Promise<Tree> => {
      const tree = await repos.treeRepo.findById(request.treeId);
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

      const oldLat = tree.lat;
      const oldLng = tree.lng;
      tree.updateCanonicalCoordinates(request.lat, request.lng);

      const updated = await repos.treeRepo.update(tree, request.expectedVersion);
      if (!updated) {
        const current = await repos.treeRepo.findById(request.treeId);
        throw new ConflictError('Tree version conflict', {
          subtype: 'STALE_VERSION',
          currentVersion: current ? current.version : tree.version,
          expectedVersion: request.expectedVersion,
        });
      }

      await repos.auditService.logEvent({
        actorId: context.actorId,
        actorRole: context.actorRole,
        action: 'UpdateCanonicalCoordinates',
        targetResourceType: 'Tree',
        targetResourceId: tree.id,
        outcome: 'SUCCESS',
        reason: request.reason,
        details: {
          oldCoordinates: { lat: oldLat, lng: oldLng },
          newCoordinates: { lat: tree.lat, lng: tree.lng },
          updatedVersion: tree.version,
        },
      });

      return tree;
    };

    if (this.uow) {
      return await this.uow.execute(async (tx) => {
        return run({ treeRepo: tx.treeRepo, auditService: tx.auditService });
      });
    }

    return run({ treeRepo: this.treeRepo, auditService: this.auditService });
  }
}
