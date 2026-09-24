import type { OperationalTaskTypeCatalogItem } from '@novyx/contracts';
import type { ITaskTypeRepository } from '../../../policy-template-governance/application/ports/task-type-repository.port';
import type { IPolicyRepository } from '../../../policy-template-governance/application/ports/policy-repository.port';
import type { IOperationalScopeRepository } from '../ports/operational-scope-repository.port';
import { ForbiddenError } from '../../../../core/errors';

export class ListOperationalTaskTypesUseCase {
  constructor(
    private readonly taskTypeRepo: ITaskTypeRepository,
    private readonly policyRepo: IPolicyRepository,
    private readonly scopeRepo: IOperationalScopeRepository,
  ) {}

  async execute(managerId: string): Promise<OperationalTaskTypeCatalogItem[]> {
    const scopes = await this.scopeRepo.getScopes(managerId);
    if (scopes.length === 0) {
      throw new ForbiddenError('Manager has no operational scope');
    }

    const taskTypes = await this.taskTypeRepo.listAll();
    const items = await Promise.all(
      taskTypes
        .filter((taskType) => taskType.isActive)
        .map(async (taskType): Promise<OperationalTaskTypeCatalogItem | null> => {
          const [policy, checklist] = await Promise.all([
            this.policyRepo.findLatestProofPolicy(taskType.id),
            this.policyRepo.findLatestChecklistTemplate(taskType.id),
          ]);
          if (!policy || policy.proofProfile !== 'CHANGE_PROOF' || !checklist) return null;

          return {
            id: taskType.id,
            name: taskType.name,
            ...(taskType.description ? { description: taskType.description } : {}),
            proofProfile: policy.proofProfile,
          };
        }),
    );

    return items
      .filter((item): item is OperationalTaskTypeCatalogItem => item !== null)
      .sort((first, second) => first.name.localeCompare(second.name, 'vi'));
  }
}
