import type { ITaskTypeRepository } from '../ports/task-type-repository.port';
import type { IPolicyRepository } from '../ports/policy-repository.port';
import { NotFoundError, ValidationError } from '../../../../core/errors';
import type { TaskType } from '../../domain/task-type.entity';
import type { ProofPolicyVersion, ChecklistTemplateVersion } from '../../domain/policy-version.entity';

export interface ResolvedPolicy {
  taskType: TaskType;
  proofProfile: 'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF';
  policyVersionId?: string | undefined;
  checklistTemplateVersionId?: string | undefined;
  checklistSnapshot?: Array<{ id: string; text: string; done: boolean }> | undefined;
}

export class ResolveTaskTypePolicyUseCase {
  constructor(
    private readonly taskTypeRepo: ITaskTypeRepository,
    private readonly policyRepo: IPolicyRepository,
  ) {}

  async execute(taskTypeId: string): Promise<ResolvedPolicy> {
    const taskType = await this.taskTypeRepo.findById(taskTypeId);
    if (!taskType) {
      throw new NotFoundError(`TaskType with ID ${taskTypeId} not found`);
    }

    if (!taskType.isActive) {
      throw new ValidationError(`TaskType "${taskType.name}" is currently inactive`);
    }

    // 1. Resolve proof policy
    const latestPolicy: ProofPolicyVersion | null = await this.policyRepo.findLatestProofPolicy(taskTypeId);
    const proofProfile = latestPolicy ? latestPolicy.proofProfile : taskType.defaultProofProfile;
    const policyVersionId = latestPolicy?.id;

    // 2. Resolve checklist template if proof profile requires checklist (CHANGE_PROOF or SERVICE_PROOF)
    let checklistTemplateVersionId: string | undefined;
    let checklistSnapshot: Array<{ id: string; text: string; done: boolean }> | undefined;

    if (proofProfile === 'CHANGE_PROOF' || proofProfile === 'SERVICE_PROOF') {
      const latestTemplate: ChecklistTemplateVersion | null =
        await this.policyRepo.findLatestChecklistTemplate(taskTypeId);
      if (latestTemplate) {
        checklistTemplateVersionId = latestTemplate.id;
        checklistSnapshot = latestTemplate.templateItems
          .sort((a, b) => a.order - b.order)
          .map((item, idx) => ({
            id: `chk-${idx + 1}`,
            text: item.text,
            done: false,
          }));
      } else {
        // Default standard checklist if no custom template has been published
        checklistSnapshot = [
          { id: 'chk-1', text: 'Kiểm tra an toàn khu vực thao tác', done: false },
          { id: 'chk-2', text: 'Thực hiện quy trình kỹ thuật lâm sinh', done: false },
          { id: 'chk-3', text: 'Dọn dẹp vệ sinh hiện trường xung quanh gốc cây', done: false },
        ];
      }
    }

    return {
      taskType,
      proofProfile,
      policyVersionId,
      checklistTemplateVersionId,
      checklistSnapshot,
    };
  }
}
