/**
 * Identity & Access Management Bounded Context (Generic Subdomain)
 *
 * Owns user accounts, credentials, sessions, roles, and authentication/authorization.
 * Implementation of authentication workflows and credential management is scheduled for Wave 3.
 */
export const IAM_MODULE = {
  name: 'Identity & Access Management',
  slug: 'iam',
  type: 'GENERIC_SUBDOMAIN',
} as const;

export interface IIamPort {
  readonly moduleName: string;
}
