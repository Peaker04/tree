import { eq, desc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  ProofPolicyVersion,
  ChecklistTemplateVersion,
  type ChecklistTemplateItem,
} from '../../../modules/policy-template-governance/domain/policy-version.entity';
import type { IPolicyRepository } from '../../../modules/policy-template-governance/application/ports/policy-repository.port';
import * as schema from '../schema';

export class DrizzlePolicyRepository implements IPolicyRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async findLatestProofPolicy(taskTypeId: string): Promise<ProofPolicyVersion | null> {
    const rows = await this.db
      .select()
      .from(schema.proofPolicyVersions)
      .where(eq(schema.proofPolicyVersions.taskTypeId, taskTypeId))
      .orderBy(desc(schema.proofPolicyVersions.versionNumber))
      .limit(1);

    if (!rows || rows.length === 0 || !rows[0]) return null;
    const r = rows[0];
    return new ProofPolicyVersion({
      id: r.id,
      taskTypeId: r.taskTypeId,
      versionNumber: r.versionNumber,
      proofProfile: r.proofProfile as 'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF',
      policyDescription: r.policyDescription ?? undefined,
      publishedAt: r.publishedAt,
    });
  }

  async saveProofPolicyVersion(policy: ProofPolicyVersion): Promise<void> {
    await this.db.insert(schema.proofPolicyVersions).values({
      id: policy.id,
      taskTypeId: policy.taskTypeId,
      versionNumber: policy.versionNumber,
      proofProfile: policy.proofProfile,
      policyDescription: policy.policyDescription ?? null,
      publishedAt: policy.publishedAt,
    });
  }

  async findLatestChecklistTemplate(taskTypeId: string): Promise<ChecklistTemplateVersion | null> {
    const rows = await this.db
      .select()
      .from(schema.checklistTemplateVersions)
      .where(eq(schema.checklistTemplateVersions.taskTypeId, taskTypeId))
      .orderBy(desc(schema.checklistTemplateVersions.versionNumber))
      .limit(1);

    if (!rows || rows.length === 0 || !rows[0]) return null;
    const r = rows[0];
    return new ChecklistTemplateVersion({
      id: r.id,
      taskTypeId: r.taskTypeId,
      versionNumber: r.versionNumber,
      templateItems: r.templateItems as ChecklistTemplateItem[],
      templateDescription: r.templateDescription ?? undefined,
      publishedAt: r.publishedAt,
    });
  }

  async saveChecklistTemplateVersion(template: ChecklistTemplateVersion): Promise<void> {
    await this.db.insert(schema.checklistTemplateVersions).values({
      id: template.id,
      taskTypeId: template.taskTypeId,
      versionNumber: template.versionNumber,
      templateItems: template.templateItems,
      templateDescription: template.templateDescription ?? null,
      publishedAt: template.publishedAt,
    });
  }
}
