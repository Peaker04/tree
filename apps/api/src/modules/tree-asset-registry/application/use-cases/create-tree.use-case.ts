import { Tree } from '../../domain/tree.entity';
import type { ITreeRepository } from '../ports/tree-repository.port';
import type { IOperationalUnitOfWork } from '../../../work-management/application/ports/operational-unit-of-work.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { ConflictError } from '../../../../core/errors';
import type { CreateTreeRequest } from '@novyx/contracts';

export class CreateTreeUseCase {
  constructor(
    private readonly treeRepo: ITreeRepository,
    private readonly auditService: AuditService,
    private readonly uow?: IOperationalUnitOfWork,
  ) {}

  async execute(
    request: CreateTreeRequest,
    context: { actorId: string; actorRole: 'staff' | 'supervisor' | 'manager' | 'admin' },
  ): Promise<Tree> {
    const run = async (repos: { treeRepo: ITreeRepository; auditService: AuditService }): Promise<Tree> => {
      const existingById = await repos.treeRepo.findById(request.treeId);
      if (existingById) {
        throw new ConflictError(`Tree with ID ${request.treeId} already exists`);
      }

      const existingByQr = await repos.treeRepo.findByQrCode(request.qrCode);
      if (existingByQr) {
        throw new ConflictError(`Tree with QR code ${request.qrCode} already exists`);
      }

      const tree = new Tree({
        id: request.treeId,
        version: 0,
        name: request.name,
        species: request.species,
        lat: request.lat,
        lng: request.lng,
        address: request.address,
        qrCode: request.qrCode,
        healthStatus: request.healthStatus,
        ageYears: request.ageYears,
        riskStatus: request.riskStatus,
        isRetired: false,
      });

      await repos.treeRepo.save(tree);

      await repos.auditService.logEvent({
        actorId: context.actorId,
        actorRole: context.actorRole,
        action: 'CreateTree',
        targetResourceType: 'Tree',
        targetResourceId: tree.id,
        outcome: 'SUCCESS',
        details: {
          qrCode: tree.qrCode,
          name: tree.name,
          species: tree.species,
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
