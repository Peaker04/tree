/**
 * Audit & Compliance Bounded Context (Supporting Subdomain)
 *
 * Owns append-only audit event persistence, queries, and tamper-evident compliance controls.
 * Implementation of domain use cases is scheduled for Wave 4.
 */
export const AUDIT_COMPLIANCE_MODULE = {
  name: 'Audit & Compliance',
  slug: 'audit-compliance',
  type: 'SUPPORTING_SUBDOMAIN',
} as const;

export interface IAuditCompliancePort {
  readonly moduleName: string;
}
