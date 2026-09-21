import type { ITreeRepository } from '../ports/tree-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError } from '../../../../core/errors';
import type { UpdateCanonicalCoordinatesRequest } from '@novyx/contracts';
import type { Tree } from '../../domain/tree.entity';

export class UpdateCanonicalCoordinatesUseCase {
  constructor(
    private readonly treeRepo: ITreeRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: UpdateCanonicalCoordinatesRequest,
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

    const oldLat = tree.lat;
    const oldLng = tree.lng;
    tree.updateCanonicalCoordinates(request.lat, request.lng);

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
  }
}
