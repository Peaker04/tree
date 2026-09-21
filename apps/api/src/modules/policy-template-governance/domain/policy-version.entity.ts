export interface ProofPolicyVersionProps {
  id: string;
  taskTypeId: string;
  versionNumber: number;
  proofProfile: 'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF';
  policyDescription?: string | undefined;
  publishedAt?: Date | undefined;
}

export class ProofPolicyVersion {
  readonly id: string;
  readonly taskTypeId: string;
  readonly versionNumber: number;
  readonly proofProfile: 'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF';
  readonly policyDescription?: string | undefined;
  readonly publishedAt: Date;

  constructor(props: ProofPolicyVersionProps) {
    if (!props.id || !props.taskTypeId) {
      throw new Error('Policy version ID and taskTypeId are required');
    }
    this.id = props.id;
    this.taskTypeId = props.taskTypeId;
    this.versionNumber = props.versionNumber;
    this.proofProfile = props.proofProfile;
    this.policyDescription = props.policyDescription;
    this.publishedAt = props.publishedAt ?? new Date();
  }
}

export interface ChecklistTemplateItem {
  text: string;
  order: number;
}

export interface ChecklistTemplateVersionProps {
  id: string;
  taskTypeId: string;
  versionNumber: number;
  templateItems: ChecklistTemplateItem[];
  templateDescription?: string | undefined;
  publishedAt?: Date | undefined;
}

export class ChecklistTemplateVersion {
  readonly id: string;
  readonly taskTypeId: string;
  readonly versionNumber: number;
  readonly templateItems: ChecklistTemplateItem[];
  readonly templateDescription?: string | undefined;
  readonly publishedAt: Date;

  constructor(props: ChecklistTemplateVersionProps) {
    if (!props.id || !props.taskTypeId) {
      throw new Error('Template version ID and taskTypeId are required');
    }
    if (!props.templateItems || props.templateItems.length === 0) {
      throw new Error('Template must contain at least one item');
    }
    this.id = props.id;
    this.taskTypeId = props.taskTypeId;
    this.versionNumber = props.versionNumber;
    this.templateItems = props.templateItems;
    this.templateDescription = props.templateDescription;
    this.publishedAt = props.publishedAt ?? new Date();
  }
}
