import type { ProofPolicyVersion, ChecklistTemplateVersion } from '../../domain/policy-version.entity';

export interface IPolicyRepository {
  findLatestProofPolicy(taskTypeId: string): Promise<ProofPolicyVersion | null>;
  saveProofPolicyVersion(policy: ProofPolicyVersion): Promise<void>;
  findLatestChecklistTemplate(taskTypeId: string): Promise<ChecklistTemplateVersion | null>;
  saveChecklistTemplateVersion(template: ChecklistTemplateVersion): Promise<void>;
}
