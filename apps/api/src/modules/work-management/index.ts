/**
 * Work Management Bounded Context (Core Domain)
 *
 * Owns task lifecycle state machine, assignments, evidence workflows, and review decisions.
 * Implementation of domain behavior is scheduled for Wave 4.
 */
export const WORK_MANAGEMENT_MODULE = {
  name: 'Work Management',
  slug: 'work-management',
  type: 'CORE_DOMAIN',
} as const;

export interface IWorkManagementPort {
  readonly moduleName: string;
}
