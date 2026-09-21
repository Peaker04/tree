import { Tree } from '../../domain/tree.entity';
import type { ITreeRepository } from '../ports/tree-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { ConflictError } from '../../../../core/errors';
import type { CreateTreeRequest } from '@novyx/contracts';

export class CreateTreeUseCase {
  constructor(
    private readonly treeRepo: ITreeRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: CreateTreeRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<Tree> {
    const existingById = await this.treeRepo.findById(request.treeId);
    if (existingById) {
      throw new ConflictError(`Tree with ID ${request.treeId} already exists`);
    }

    const existingByQr = await this.treeRepo.findByQrCode(request.qrCode);
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

    await this.treeRepo.save(tree);

    await this.auditService.logEvent({
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
  }
}
