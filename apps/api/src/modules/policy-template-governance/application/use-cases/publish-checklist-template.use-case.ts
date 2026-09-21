import { ChecklistTemplateVersion } from '../../domain/policy-version.entity';
import type { ITaskTypeRepository } from '../ports/task-type-repository.port';
import type { IPolicyRepository } from '../ports/policy-repository.port';
import type { IOperationalUnitOfWork } from '../../../work-management/application/ports/operational-unit-of-work.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError } from '../../../../core/errors';
import type { PublishChecklistTemplateVersionRequest } from '@novyx/contracts';
import { randomUUID } from 'node:crypto';

export class PublishChecklistTemplateVersionUseCase {
  constructor(
    private readonly taskTypeRepo: ITaskTypeRepository,
    private readonly policyRepo: IPolicyRepository,
    private readonly auditService: AuditService,
    private readonly uow?: IOperationalUnitOfWork,
  ) {}

  async execute(
    request: PublishChecklistTemplateVersionRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<ChecklistTemplateVersion> {
    const run = async (repos: {
      taskTypeRepo: ITaskTypeRepository;
      policyRepo: IPolicyRepository;
      auditService: AuditService;
    }): Promise<ChecklistTemplateVersion> => {
      const taskType = await repos.taskTypeRepo.findById(request.taskTypeId);
      if (!taskType) {
        throw new NotFoundError(`TaskType with ID ${request.taskTypeId} not found`);
      }

      const latest = await repos.policyRepo.findLatestChecklistTemplate(request.taskTypeId);
      const versionNumber = latest ? latest.versionNumber + 1 : 1;
      const templateId = `CHK-${randomUUID().slice(0, 8)}`;

      const templateVersion = new ChecklistTemplateVersion({
        id: templateId,
        taskTypeId: request.taskTypeId,
        versionNumber,
        templateItems: request.templateItems,
        templateDescription: request.templateDescription,
      });

      await repos.policyRepo.saveChecklistTemplateVersion(templateVersion);

      await repos.auditService.logEvent({
        actorId: context.actorId,
        actorRole: context.actorRole,
        action: 'PublishChecklistTemplateVersion',
        targetResourceType: 'ChecklistTemplate',
        targetResourceId: templateVersion.id,
        outcome: 'SUCCESS',
        details: {
          taskTypeId: request.taskTypeId,
          versionNumber,
          itemCount: request.templateItems.length,
        },
      });

      return templateVersion;
    };

    if (this.uow) {
      return await this.uow.execute(async (tx) => {
        return run({ taskTypeRepo: tx.taskTypeRepo, policyRepo: tx.policyRepo, auditService: tx.auditService });
      });
    }

    return run({ taskTypeRepo: this.taskTypeRepo, policyRepo: this.policyRepo, auditService: this.auditService });
  }
}
