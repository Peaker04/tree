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
6. **No Runtime Validation:** All types in `packages/contracts` are compile-time TypeScript interfaces. Incoming network payloads cannot be validated at runtime without writing redundant manual validation checks.

## Critical Authority Rule
`@novyx/contracts` is a **DERIVED TECHNICAL CONTRACT REPRESENTATION**. It is **NOT** the business source of truth. Canonical business documents (`PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `REQUIREMENTS-TRACEABILITY.md`) remain the sole authoritative source of truth. Contract schemas must reflect, but never redefine, frozen business semantics.

## Frozen Business Drivers
- **Exact 7-State Lifecycle (`DOMAIN.md §3`, `Report 08 §2`):** `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`.
- **Exact 3 Proof Profiles (`DOMAIN.md §4`, `WORKFLOWS.md §3`):** `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`.
- **Exact 4 Review Outcomes (`DOMAIN.md §5`, `WORKFLOWS.md §4`):** `APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL`.
- **Exact 4 Account Lifecycle States (`DR-HARD-05`, `CAP-ADM-03`):** `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`.
- **48 Canonical Business Commands:** Unified inventory of 22 operational commands (`OP-01..22`) and 22 governance commands (`GV-01..22`, with `GV-07` normalized as `ResetCredentialSetup`), and 4 RTM supplementary commands.

## Command vs Network API Exposure Classification
The 48 canonical commands represent the **business action inventory**, which does NOT automatically translate into 48 distinct network endpoints. Technical contracts are exposed based on clear network boundary classification:

| Phân loại ranh giới (Classification) | Định nghĩa kỹ thuật | Các lệnh / hành vi thuộc nhóm | Ràng buộc Hợp đồng (`@novyx/contracts`) |
| :--- | :--- | :--- | :--- |
| **`EXTERNAL_OPERATIONAL_API`** | Các mutation lệnh từ Mobile App gửi lên Backend qua REST `/v1/tasks/*`. | `OP-01` CheckInGps, `OP-02` ScanTreeQr, `OP-03` StartTask, `OP-04` CaptureConditionPhotos, `OP-05` CompleteChecklist, `OP-06` ReportLocationException, `OP-07` ReportIdentityException, `OP-08` SubmitTaskEvidence, `OP-09` ReportFieldIssue, `OP-10` ResolveBlocked, `OP-11` ReassignTask, `OP-12` CancelTask, `OP-13` ReviewDecision, `OP-14` RequestRework, `OP-15` CreateTask. | Bắt buộc Zod Request/Response Schemas, `expectedVersion`, và `idempotencyKey`. |
| **`EXTERNAL_GOVERNANCE_API`** | Các mutation lệnh từ Admin Web gửi lên Backend qua REST `/v1/governance/*`. | `GV-01..06` User & Role Actions, `GV-07` ResetCredentialSetup, `GV-08..12` Tree Master Data Actions, `GV-13..14` TaskType Actions, `GV-15..17` ProofPolicy Actions, `GV-18..20` ChecklistTemplate Actions. | Bắt buộc Zod Request/Response Schemas. |
| **`EXTERNAL_READ_API`** | Các truy vấn dữ liệu (Queries) từ Mobile và Web qua HTTP GET. | `OP-16` ListAssignedTasks, `OP-17` ListOperationalTasks, `OP-18` LookupTreeByQr, `OP-19` GetTreeDetail, `OP-20` GetTaskDetail, `OP-21` GetCareHistory, `OP-22` ListNotifications, `GV-21..22` View & Filter AuditLog. | Bắt buộc Query Parameter Schemas và Response DTO Schemas. |
| **`SYSTEM_INTERNAL`** | Tác vụ xử lý nội bộ tất định do System thực thi trên máy chủ; **KHÔNG PHẢI ENDPOINT MẠNG**. | `ProjectCareHistory` (chiếu lịch sử khi task `COMPLETED`), tự động sinh `AuditEvent`. | Không tạo public network endpoint schema; quản lý qua internal Domain Event / Projector types. |
| **`CLIENT_LOCAL / ADVISORY`** | Logic tính toán và lưu nháp cục bộ trên thiết bị di động; không gửi trực tiếp qua mạng. | Đánh giá Action Eligibility tức thời, tính toán khoảng cách GPS, lưu cache ảnh tạm. | Export pure domain helper types; không phải REST endpoints. |

## NFR / Quality Drivers
- **Contract Safety & Robustness (`QAS-FAULT-01`):** Untrusted incoming payloads must be validated at the boundary, returning `400 VALIDATION_FAILED` before reaching application or domain logic.
- **Single Source of Truth:** Shared TypeScript types derived directly from Zod schemas across mobile, web, and backend.
- **Developer Ergonomics:** Schema-first inference eliminates code drift between validation logic and TypeScript interface declarations.

## Decision Question
How should `@novyx/contracts` be restructured and extended to support the full frozen business model, provide runtime schema validation, and cleanly organize operational vs governance API surfaces?

## Options Considered

### Option A: Manual Validation in Route Controllers + Plain TypeScript Interfaces
- **Description:** Keep plain TypeScript interfaces in `packages/contracts`; write manual `if (!body.taskId...)` checks in backend handlers and client services.
- **Advantages:** Zero additional library dependencies.
- **Disadvantages:**
  - Extremely error-prone and tedious: Developers must write hundreds of lines of boilerplate validation.
  - High risk of validation drift between client and server.
  - Inconsistent error reporting: Manual checks produce varied error formats.
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
    - `contracts/auth`: Login, refresh, role, account status schemas.
    - `contracts/operational`: External operational API command schemas and DTOs.
    - `contracts/governance`: External governance API command schemas and DTOs.
    - `contracts/audit`: Audit query schemas and `AuditEventDto`.
- **Advantages:**
  - **Eliminates Type Drift:** Schema-first inference ensures compile-time types and runtime validation rules remain strictly synchronized.
  - **Untrusted Payload Boundary Validation:** Rejects malformed JSON, missing fields, or invalid enum tokens immediately at the network boundary.
  - **Standardized Error Details:** Zod's `error.flatten()` automatically maps to `ApiError.details` under `ERROR_CODES.VALIDATION_FAILED`.
  - **Universal Compatibility:** Zod works reliably in Node.js, modern web browsers, and React Native / Hermes (`external/hermes-agent` compatibility).
  - *Note on Security Scope:* Schema validation verifies payload structure and types; backend application code must still enforce database constraints, parameterization, and output encoding to prevent injection attacks.
- **Disadvantages:** Adds `zod` as a dependency in `packages/contracts` (~14kb minified/gzipped).
- **Risks:** Negligible; industry standard for TypeScript contract-first systems.
- **Migration Impact:** Smooth; existing interface names remain identical via `z.infer`.
- **Operational Impact:** Consistent 400 validation error logging.

### Option C: OpenAPI / JSON Schema Code Generation
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
*Recommendation Confidence: HIGH (standard practice for TypeScript contract-first monorepos).*

1. **Package Architecture for `@novyx/contracts`:**
   ```text
   packages/contracts/src/
   ├── common/             # ApiResult, ApiSuccess, ApiFailure, ErrorCode, Pagination
   ├── auth/               # LoginRequest, AuthSession, RefreshToken, UserRole, AccountStatus
   ├── operational/        # External Operational Command & Query Schemas (OP-01..15, OP-16..22)
   ├── governance/         # External Governance Command & Query Schemas (GV-01..20, GV-21..22)
   ├── audit/              # AuditEventDto, ListAuditLogsQuerySchema
   └── index.ts            # Public barrel export
   ```
2. **Canonical Enum Updates:**
   - `TaskStatus`: `'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'WAITING_REVIEW' | 'REWORK_REQUIRED' | 'COMPLETED' | 'CANCELLED'`
   - `ProofProfile`: `'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF'`
   - `ReviewDecision`: `'APPROVE' | 'APPROVE_WITH_EXCEPTION' | 'REQUEST_REWORK' | 'CANCEL'`
   - `AccountStatus`: `'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED'`
3. **Command Payload Metadata:**
   - All state-mutating command schemas enforce `expectedVersion: number` and optional `idempotencyKey?: string`.

## Rationale
Option B provides robust runtime schema validation without imposing heavy code generation pipelines. It directly fulfills the commitment made in `ADR 0003` while closing all schema gaps documented in `POST-SYNC-IMPLEMENTATION-GAP-MAP.md`.

## Consequences
- **Positive:** Complete synchronization between runtime validation and compile-time types. Standardized `VALIDATION_FAILED` errors.
- **Negative:** `packages/contracts` requires `zod` dependency.
- **Neutral:** Frontends (`apps/mobile` and `apps/admin-web`) use the same schemas for pre-flight form validation.

## Security Impact
- Validates untrusted payload structure and data types at the API boundary before passing to domain logic.
- Safe query practices and database parameterization remain mandatory in application/infrastructure layers.

## Offline / Reliability Impact
- Client outbox worker validates payloads against schemas before enqueuing, preventing corrupted entries in offline storage.

## Contract Impact
- Modernizes and expands `@novyx/contracts` into a complete derived technical representation of the frozen business baseline.

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
