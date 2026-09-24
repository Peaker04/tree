import { eq, desc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  ProofPolicyVersion,
  ChecklistTemplateVersion,
  type ChecklistTemplateItem,
} from '../../../modules/policy-template-governance/domain/policy-version.entity';
import type { IPolicyRepository } from '../../../modules/policy-template-governance/application/ports/policy-repository.port';
import * as schema from '../schema';

type StoredChecklistTemplateItem = ChecklistTemplateItem | { id?: string; label?: string; required?: boolean };

export function normalizeChecklistTemplateItems(items: unknown): ChecklistTemplateItem[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item, index) => {
    const stored = item as StoredChecklistTemplateItem;
    const text = 'text' in stored ? stored.text : stored.label;
    if (typeof text !== 'string' || text.trim().length === 0) return [];
    const order = 'order' in stored && typeof stored.order === 'number' ? stored.order : index + 1;
    return [{ text: text.trim(), order }];
  });
}

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
      templateItems: normalizeChecklistTemplateItems(r.templateItems),
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
