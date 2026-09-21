import { ChecklistTemplateVersion } from '../../domain/policy-version.entity';
import type { ITaskTypeRepository } from '../ports/task-type-repository.port';
import type { IPolicyRepository } from '../ports/policy-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError } from '../../../../core/errors';
import type { PublishChecklistTemplateVersionRequest } from '@novyx/contracts';
import { randomUUID } from 'node:crypto';

export class PublishChecklistTemplateVersionUseCase {
  constructor(
    private readonly taskTypeRepo: ITaskTypeRepository,
    private readonly policyRepo: IPolicyRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: PublishChecklistTemplateVersionRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<ChecklistTemplateVersion> {
    const taskType = await this.taskTypeRepo.findById(request.taskTypeId);
    if (!taskType) {
      throw new NotFoundError(`TaskType with ID ${request.taskTypeId} not found`);
    }

    const latest = await this.policyRepo.findLatestChecklistTemplate(request.taskTypeId);
    const versionNumber = latest ? latest.versionNumber + 1 : 1;
    const templateId = `CHK-${randomUUID().slice(0, 8)}`;

    const templateVersion = new ChecklistTemplateVersion({
      id: templateId,
      taskTypeId: request.taskTypeId,
      versionNumber,
      templateItems: request.templateItems,
      templateDescription: request.templateDescription,
    });

    await this.policyRepo.saveChecklistTemplateVersion(templateVersion);

    await this.auditService.logEvent({
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
  }
}
