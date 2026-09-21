/**
 * Policy & Template Governance Bounded Context (Supporting Subdomain)
 *
 * Owns central checklist templates, proof policies, and task type catalog governance.
 * Implementation of domain behavior is scheduled for Wave 4.
 */
export const POLICY_TEMPLATE_GOVERNANCE_MODULE = {
  name: 'Policy & Template Governance',
  slug: 'policy-template-governance',
  type: 'SUPPORTING_SUBDOMAIN',
} as const;

export interface IPolicyTemplateGovernancePort {
  readonly moduleName: string;
}
