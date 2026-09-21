import { ProofPolicyVersion } from '../../domain/policy-version.entity';
import type { ITaskTypeRepository } from '../ports/task-type-repository.port';
import type { IPolicyRepository } from '../ports/policy-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError } from '../../../../core/errors';
import type { PublishProofPolicyVersionRequest } from '@novyx/contracts';
import { randomUUID } from 'node:crypto';

export class PublishProofPolicyVersionUseCase {
  constructor(
    private readonly taskTypeRepo: ITaskTypeRepository,
    private readonly policyRepo: IPolicyRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: PublishProofPolicyVersionRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<ProofPolicyVersion> {
    const taskType = await this.taskTypeRepo.findById(request.taskTypeId);
    if (!taskType) {
      throw new NotFoundError(`TaskType with ID ${request.taskTypeId} not found`);
    }

    const latest = await this.policyRepo.findLatestProofPolicy(request.taskTypeId);
    const versionNumber = latest ? latest.versionNumber + 1 : 1;
    const policyId = `POL-${randomUUID().slice(0, 8)}`;

    const policyVersion = new ProofPolicyVersion({
      id: policyId,
      taskTypeId: request.taskTypeId,
      versionNumber,
      proofProfile: request.proofProfile,
      policyDescription: request.policyDescription,
    });

    await this.policyRepo.saveProofPolicyVersion(policyVersion);

    await this.auditService.logEvent({
      actorId: context.actorId,
      actorRole: context.actorRole,
      action: 'PublishProofPolicyVersion',
      targetResourceType: 'ProofPolicy',
      targetResourceId: policyVersion.id,
      outcome: 'SUCCESS',
      details: {
        taskTypeId: request.taskTypeId,
        versionNumber,
        proofProfile: request.proofProfile,
      },
    });

    return policyVersion;
  }
}
