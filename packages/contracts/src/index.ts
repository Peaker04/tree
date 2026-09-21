/**
 * @novyx/contracts
 *
 * Shared technical contract representation for NOVYX GreenOps.
 * Zod schema-first runtime validation with inferred TypeScript types.
 */

// Common contracts (envelopes, errors, transport, pagination)
export * from './common';

// Auth and IAM contracts
export * from './auth';

// Operational contracts (tasks, proof profiles, review decisions, site verification)
export * from './operational';

// Platform Governance contracts (users, trees, task types, policies)
export * from './governance';

// Audit & Compliance contracts
export * from './audit';

// Transitional legacy compatibility layer (apps/mobile backward compatibility)
export * from './legacy';
