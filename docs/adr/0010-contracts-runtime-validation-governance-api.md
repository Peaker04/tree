# ADR 0010: Contract Evolution, Runtime Schema Validation & Governance API Extension

## Status
PROPOSED

## Context
In `ADR 0003`, the project established a **Contract-first REST API** under `/v1` using shared TypeScript envelopes and error codes in `packages/contracts`. `ADR 0003` explicitly noted the tradeoff: *"Runtime schema validation still needs to be added before real backend endpoints ship."*

Following the completion of the Business Baseline Reconciliation (Phase 0–10), the contract package currently exhibits significant drift from the frozen business requirements:
1. **Incomplete Lifecycle:** `TaskStatus` in `packages/contracts/src/index.ts` contains only 5 states (`Pending`, `In_Progress`, `Waiting_Review`, `Completed`, `Rework_Required`), completely missing `BLOCKED` and `CANCELLED`. Furthermore, the enum values use Pascal-Snake-Case strings rather than the canonical uppercase constants.
2. **Missing Proof Profiles:** The 3 canonical profiles (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`) are not modeled in contracts; only an ad-hoc `EvidenceStage = 'before' | 'after'` exists.
3. **Missing Review Decisions:** `ReviewDecision` contains only `'approve' | 'request_rework'`, missing `'approve_with_exception'` and `'cancel'`.
4. **Missing Exception Payloads:** No DTOs exist for `LocationExceptionDto`, `IdentityExceptionDto`, or `FieldIssueDto`.
5. **Zero Governance Contracts:** No DTOs, schemas, or endpoint definitions exist for the 9 Platform Governance capabilities (`CAP-ADM-01..09` / `GV-01..19`) or audit event queries (`AuditEventDto`).
6. **No Runtime Validation:** All types in `packages/contracts` are compile-time TypeScript interfaces. Incoming network payloads (from network or third-party input) cannot be validated at runtime without writing redundant manual validation checks.

## Frozen Business Drivers
- **Exact 7-State Lifecycle (`DOMAIN.md §3`, `Report 08 §2`):** `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`.
- **Exact 3 Proof Profiles (`DOMAIN.md §4`, `WORKFLOWS.md §3`):** `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`.
- **Exact 4 Review Outcomes (`DOMAIN.md §5`, `WORKFLOWS.md §4`):** `APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL`.
- **Exact 4 Account Lifecycle States (`DR-HARD-05`, `CAP-ADM-03`):** `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`.
- **48 Canonical Unique Commands (`Report 12 §4`, `Report 13 §14`):** Every operational command (`OP-01..22`) and governance command (`GV-01..22`, with `GV-07` projected to `ResetCredentialSetup`) must have a corresponding request/response contract.

## NFR / Quality Drivers
- **Contract Safety & Robustness (`QAS-FAULT-01`):** Incomplete or malformed JSON payloads must be rejected at the boundary with `400 VALIDATION_FAILED` before touching application or domain logic.
- **Single Source of Truth:** Contracts must be shared seamlessly across `apps/mobile`, future `apps/admin-web`, and backend services without duplicating schema definitions.
- **Developer Ergonomics & Type Inference:** TypeScript types should be automatically inferred from validation schemas to guarantee zero drift between runtime validation and compile-time types.

## Decision Question
How should `@novyx/contracts` be restructured and extended to support the full frozen business model, provide runtime schema validation, and cleanly organize operational vs governance API surfaces?

## Options Considered

### Option A: Manual Validation in Route Controllers + Plain TypeScript Interfaces
- **Description:** Keep plain TypeScript interfaces in `packages/contracts`; write manual `if (!body.taskId || typeof body.taskId !== 'string')` checks in backend handlers and client services.
- **Advantages:** Zero additional library dependencies.
- **Disadvantages:**
  - Extremely error-prone and tedious: Developers must write hundreds of lines of boilerplate validation.
  - High risk of validation drift between client and server.
  - Inconsistent error reporting: Manual checks produce varied error message formats.
- **Risks:** Frequent runtime bugs due to unvalidated nested fields.
- **Migration Impact:** Low upfront, high ongoing maintenance cost.
- **Operational Impact:** Poor API reliability.

### Option B: Zod Schema-First Contracts with Automatic Type Inference [RECOMMENDED]
- **Description:**
  - Introduce `zod` into `packages/contracts`.
  - Define schemas using Zod (e.g., `TaskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'BLOCKED', 'WAITING_REVIEW', 'REWORK_REQUIRED', 'COMPLETED', 'CANCELLED'])`).
  - Automatically infer TypeScript types from schemas (`export type TaskStatus = z.infer<typeof TaskStatusSchema>;`).
  - Structure `packages/contracts` into clear modular namespaces:
    - `contracts/common`: Envelopes, pagination, error codes, base value objects.
    - `contracts/operational`: Tasks, trees, proof profiles, site verification, exceptions, reviews.
    - `contracts/governance`: User management, role assignments, tree master data, policy/catalog, audit logs.
  - Provide standard validation helper: `validateRequest<T>(schema: z.ZodType<T>, data: unknown): T`.
- **Advantages:**
  - **Zero Drift:** The runtime validator and the compile-time TypeScript type are mathematically guaranteed to be 100% identical.
  - **Standardized Error Details:** Zod's `error.flatten()` automatically maps to `ApiError.details` under `ERROR_CODES.VALIDATION_FAILED`.
  - **Lightweight & Universal:** Zod works flawlessly in Node.js, modern browsers, and React Native / Hermes (`external/hermes-agent` compatibility).
  - **Clean Modular Layout:** Distinguishes operational contracts (used by Mobile + Backend) from governance contracts (used by Admin Web + Backend).
- **Disadvantages:** Adds `zod` as a dependency in `packages/contracts` (~14kb minified/gzipped).
- **Risks:** Negligible; Zod is the industry standard for TypeScript contract-first systems.
- **Migration Impact:** Smooth; existing interface names remain identical via `z.infer`.
- **Operational Impact:** Consistent 400 validation error logging.

### Option C: OpenAPI / JSON Schema Code Generation (OpenAPI Generator / TypeBox)
- **Description:** Write OpenAPI 3.1 YAML specifications and generate TypeScript interfaces using code generation scripts.
- **Advantages:** Multi-language client generation; automated Swagger documentation.
- **Disadvantages:**
  - Heavy build tooling overhead: Developers must run code generators after every schema tweak.
  - YAML authoring is slower and less type-safe than native TypeScript.
  - Excessive complexity for a single monorepo with 100% TypeScript frontends and backend.
- **Risks:** Build pipeline fragility and desynchronization if developers forget to run code-gen.
- **Migration Impact:** High refactoring of existing package structure.
- **Operational Impact:** Complex CI build steps.

## Proposed Decision
**Adopt Option B: Zod Schema-First Contracts with Automatic Type Inference.**

1. **Package Architecture for `@novyx/contracts`:**
   ```text
   packages/contracts/src/
   ├── common/             # ApiResult, ApiSuccess, ApiFailure, ErrorCode, Pagination
   ├── auth/               # LoginRequest, AuthSession, RefreshToken, UserRole, AccountStatus
   ├── operational/        # TaskStatus, ProofProfile, TaskDto, Exceptions, Outbox payloads
   ├── governance/         # UserProvisioning, RoleAssignment, TreeMasterData, Policy, Catalog
   ├── audit/              # AuditEventDto, AuditQuery
   └── index.ts            # Public barrel export
   ```
2. **Canonical Enum Updates:**
   - `TaskStatus`: `'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'WAITING_REVIEW' | 'REWORK_REQUIRED' | 'COMPLETED' | 'CANCELLED'`
   - `ProofProfile`: `'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF'`
   - `ReviewDecision`: `'APPROVE' | 'APPROVE_WITH_EXCEPTION' | 'REQUEST_REWORK' | 'CANCEL'`
   - `AccountStatus`: `'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED'`
3. **Endpoint Schema Additions:**
   - Operational: `StartTaskRequestSchema`, `ReportFieldIssueRequestSchema`, `ResolveBlockedRequestSchema`, `CancelTaskRequestSchema`, `ReassignTaskRequestSchema`, `SubmitTaskEvidenceRequestSchema` (supporting `idempotencyKey` and `expectedVersion`).
   - Governance: `ProvisionUserRequestSchema`, `AssignRoleRequestSchema`, `AccountActionRequestSchema`, `CreateTreeRequestSchema`, `UpdateTreeMasterDataRequestSchema`, `ReplaceTreeQrCodeRequestSchema`, `UpdateCanonicalCoordinatesRequestSchema`, `RetireTreeRequestSchema`, `TaskTypeCatalogRequestSchema`, `ProofPolicyVersionRequestSchema`, `ChecklistTemplateVersionRequestSchema`.
   - Audit: `ListAuditLogsQuerySchema`, `AuditEventDtoSchema`.

## Rationale
Option B provides bulletproof runtime schema validation without imposing heavy code generation pipelines. It directly fulfills the commitment made in `ADR 0003` while closing all schema gaps documented in `POST-SYNC-IMPLEMENTATION-GAP-MAP.md`.

## Consequences
- **Positive:** Complete type safety at both compile time and runtime. Eliminates invalid payload crashes. Standardized `VALIDATION_FAILED` errors.
- **Negative:** `packages/contracts` requires `zod` dependency.
- **Neutral:** `apps/mobile` and `apps/admin-web` can use the same Zod schemas for client-side form validation before submitting network requests.

## Security Impact
- Prevents injection attacks, malformed JSON crashes, and parameter tampering at the HTTP boundary.

## Offline / Reliability Impact
- Client outbox worker can validate payloads before enqueuing, preventing poisoned queue entries.

## Contract Impact
- Modernizes and expands `@novyx/contracts` into the authoritative technical representation of the frozen business baseline.

## Migration / Compatibility
- Step 1: Install `zod` in `packages/contracts`.
- Step 2: Rewrite `packages/contracts/src/index.ts` using Zod schemas while exporting identical TypeScript type names via `z.infer`.
- Step 3: Update `apps/mobile` references to match uppercase enum values (`TaskStatus.PENDING`).

## Rejected Alternatives
- **Option A (Manual Validation):** Rejected due to high bug rate and lack of standardized validation.
- **Option C (OpenAPI Code-Gen):** Rejected due to build friction and unnecessary overhead for a TypeScript-only monorepo.

## Open Questions
- None. Follows established `ADR 0003` baseline.

## Owner Decision Required
- [ ] **APPROVE** Option B (Zod Schema-First Contracts).
- [ ] **REJECT** and mandate alternative option.
- [ ] **REQUEST_REVISION** with specific modifications.
