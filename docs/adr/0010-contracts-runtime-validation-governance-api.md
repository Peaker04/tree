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
`@novyx/contracts` is a **DERIVED TECHNICAL CONTRACT REPRESENTATION**. It is **NOT** the business source of truth. Canonical business documents (`PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `REQUIREMENTS-TRACEABILITY.md`, and reconciliation reports `12-BUSINESS-CONSISTENCY-AUDIT.md`) remain the sole authoritative source of truth. Contract schemas must reflect, but never redefine or alter, frozen business semantics.

## Business Command Identity vs Network Route Identity vs DTO Name vs Transport Header
A foundational architectural principle must be strictly maintained:
$$\text{Business Command Identity} \neq \text{HTTP Route Identity} \neq \text{DTO Type Name} \neq \text{Transport Header}$$
- **Business Command:** The immutable canonical action defined in the business inventory (e.g., `OP-15 SubmitEvidence`, `OP-05 StartTask`).
- **HTTP Route Identity:** The REST URL convention exposing the action over the network (e.g., `POST /v1/tasks/:id/evidence`, `POST /v1/tasks/:id/start`).
- **DTO Type Name:** The TypeScript / Zod type representing the payload schema (e.g., `SubmitEvidenceRequest`, `StartTaskRequest`).
- **Transport Header:** HTTP-level transport metadata (e.g., `Idempotency-Key: <UUIDv4>`), which is validated at the transport boundary and is strictly separated from the business command payload schema.

Technical naming must NEVER mutate or overwrite the canonical business vocabulary, and transport metadata must NEVER be conflated with domain payloads.

## Frozen Business Drivers & Canonical Inventory
- **Exact 7-State Lifecycle (`DOMAIN.md §3`, `Report 08 §2`):** `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`.
- **Exact 3 Proof Profiles (`DOMAIN.md §4`, `WORKFLOWS.md §3`):** `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`.
- **Exact 4 Review Outcomes (`DOMAIN.md §5`, `WORKFLOWS.md §4`):** `APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL`.
- **Exact 4 Account Lifecycle States (`DR-HARD-05`, `CAP-ADM-03`):** `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`.
- **Exact 48 Business Inventory Commands:** Comprising 22 Operational Commands (`OP-01..22`), 22 Governance Commands (`GV-01..22`), and 4 RTM Supplementary Commands.

## Comprehensive Command / API Exposure Classification Table

The 48 business commands represent the business action inventory. Only actions crossing an external network boundary receive request/response DTO schemas in `@novyx/contracts`. Internal system actions and client-local advisory validations are separated:

| Business Command | Canonical ID if any | Product Status | Network Exposure | Reason & Technical Mapping |
| :--- | :---: | :---: | :--- | :--- |
| **ViewAssignedTask** | `OP-01` | ACTIVE (MVP) | `EXTERNAL_READ_API` | Truy vấn danh sách nhiệm vụ được giao cho Staff qua `GET /v1/tasks/assigned`. |
| **ViewOperationalTask** | `OP-02` | ACTIVE (MVP) | `EXTERNAL_READ_API` | Truy vấn danh sách & chi tiết nhiệm vụ trong phạm vi của Manager qua `GET /v1/tasks/operational`. |
| **CreateTask** | `OP-03` | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Lệnh tạo nhiệm vụ mới của Manager qua `POST /v1/tasks`. DTO: `CreateTaskRequest`. |
| **AssignTask** | `OP-04` | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Lệnh phân công nhân sự qua `POST /v1/tasks/:id/assign`. DTO: `AssignTaskRequest`. |
| **StartTask** | `OP-05` | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Lệnh chuyển trạng thái sang IN_PROGRESS qua `POST /v1/tasks/:id/start`. DTO: `StartTaskRequest`. |
| **VerifyGps** | `OP-06` | ACTIVE (MVP) | `CLIENT_LOCAL_ADVISORY` | Tiền kiểm tra GPS 10m cục bộ trên mobile trước khi nộp; không phải endpoint mạng độc lập. |
| **VerifyQr** | `OP-07` | ACTIVE (MVP) | `CLIENT_LOCAL_ADVISORY` | Quét và đối soát tem QR cục bộ trên mobile trước khi nộp; không phải endpoint mạng độc lập. |
| **ReportFieldIssue** | `OP-08` | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Lệnh báo sự cố hiện trường chuyển task sang BLOCKED qua `POST /v1/tasks/:id/issue`. DTO: `ReportFieldIssueRequest`. |
| **ResumeBlockedTask** | `OP-09` | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Lệnh giải tỏa sự cố đưa task trở lại IN_PROGRESS qua `POST /v1/tasks/:id/resume`. DTO: `ResumeBlockedTaskRequest`. |
| **ReassignTask** | `OP-10` | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Lệnh đổi nhân sự thực hiện qua `POST /v1/tasks/:id/reassign`. DTO: `ReassignTaskRequest`. |
| **CancelTask** | `OP-11` | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Lệnh hủy nhiệm vụ kèm lý do qua `POST /v1/tasks/:id/cancel`. DTO: `CancelTaskRequest`. |
| **CaptureProofEvidence** | `OP-12` | ACTIVE (MVP) | `CLIENT_LOCAL_ADVISORY` | Thao tác chụp ảnh hiện trường và lưu file nhị phân trong sandbox; đính kèm khi SubmitEvidence. |
| **CompleteChecklist** | `OP-13` | ACTIVE (MVP) | `CLIENT_LOCAL_ADVISORY` | Thao tác tích checklist và lưu nháp SQLite; gửi kèm trong payload SubmitEvidence. |
| **RecordStructuredFindings** | `OP-14` | ACTIVE (MVP) | `CLIENT_LOCAL_ADVISORY` | Ghi nhận chỉ số lâm sinh vào bản nháp SQLite; gửi kèm trong payload SubmitEvidence. |
| **SubmitEvidence** | `OP-15` | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Lệnh nộp hồ sơ bằng chứng chuyển task sang WAITING_REVIEW qua `POST /v1/tasks/:id/evidence`. DTO: `SubmitEvidenceRequest`. |
| **ViewReviewQueue** | `OP-16` | ACTIVE (MVP) | `EXTERNAL_READ_API` | Truy vấn danh sách nhiệm vụ chờ duyệt của Manager qua `GET /v1/tasks/review-queue`. |
| **ReviewTask** | `OP-17` | ACTIVE (MVP) | `EXTERNAL_READ_API` | Truy vấn hồ sơ bằng chứng chi tiết để thẩm định qua `GET /v1/tasks/:id/review`. |
| **ApproveTask** | `OP-18` | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Lệnh duyệt hoàn thành COMPLETED qua `POST /v1/tasks/:id/approve`. DTO: `ApproveTaskRequest`. |
| **ApproveWithException** | `OP-19` | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Lệnh duyệt có ngoại lệ qua `POST /v1/tasks/:id/approve-with-exception`. DTO: `ApproveWithExceptionRequest`. |
| **RequestRework** | `OP-20` | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Lệnh yêu cầu làm lại REWORK_REQUIRED qua `POST /v1/tasks/:id/request-rework`. DTO: `RequestReworkRequest`. |
| **ResubmitRework** | `OP-21` | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Lệnh nộp lại bằng chứng khắc phục qua `POST /v1/tasks/:id/resubmit`. DTO: `ResubmitReworkRequest`. |
| **ViewCareHistory** | `OP-22` | ACTIVE (MVP) | `EXTERNAL_READ_API` | Truy vấn lịch sử chăm sóc cây xanh qua `GET /v1/trees/:id/care-history`. |
| **ProvisionUser** | `GV-01` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Khởi tạo tài khoản người dùng mới qua `POST /v1/governance/users`. DTO: `ProvisionUserRequest`. |
| **AssignRole** | `GV-02` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Gán vai trò người dùng qua `POST /v1/governance/users/:id/role`. DTO: `AssignRoleRequest`. |
| **ActivateAccount** | `GV-03` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Kích hoạt tài khoản qua `POST /v1/governance/users/:id/activate`. DTO: `ActivateAccountRequest`. |
| **SuspendAccount** | `GV-04` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Đình chỉ tài khoản qua `POST /v1/governance/users/:id/suspend`. DTO: `SuspendAccountRequest`. |
| **DisableAccount** | `GV-05` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Vô hiệu hóa tài khoản qua `POST /v1/governance/users/:id/disable`. DTO: `DisableAccountRequest`. |
| **UnlockAccount** | `GV-06` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Xóa khóa xác thực tạm thời qua `POST /v1/governance/users/:id/unlock`. DTO: `UnlockAccountRequest`. |
| **ResetCredentialSetup** | `GV-07` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Cấp lại liên kết thiết lập mật khẩu qua `POST /v1/governance/users/:id/reset-credential`. DTO: `ResetCredentialSetupRequest`. |
| **ViewAuditLog** | `GV-08` | ACTIVE (MVP) | `EXTERNAL_READ_API` | Truy vấn danh sách nhật ký kiểm toán qua `GET /v1/audit/logs`. |
| **FilterAuditLog** | `GV-09` | ACTIVE (MVP) | `EXTERNAL_READ_API` | Truy vấn lọc nhật ký kiểm toán đa tiêu chí qua `GET /v1/audit/logs/filter`. |
| **CreateTree** | `GV-10` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Tạo hồ sơ cây xanh mới qua `POST /v1/governance/trees`. DTO: `CreateTreeRequest`. |
| **UpdateTreeMasterData** | `GV-11` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Cập nhật thông tin lâm sinh cây xanh qua `PATCH /v1/governance/trees/:id`. DTO: `UpdateTreeMasterDataRequest`. |
| **ReplaceTreeQrCode** | `GV-12` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Cấp đổi tem QR cây qua `POST /v1/governance/trees/:id/replace-qr`. DTO: `ReplaceTreeQrCodeRequest`. |
| **UpdateCanonicalCoordinates** | `GV-13` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Hiệu chỉnh tọa độ trắc địa qua `POST /v1/governance/trees/:id/coordinates`. DTO: `UpdateCanonicalCoordinatesRequest`. |
| **RetireTree** | `GV-14` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Thanh lý / giải tỏa cây xanh qua `POST /v1/governance/trees/:id/retire`. DTO: `RetireTreeRequest`. |
| **CreateTaskType** | `GV-15` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Định nghĩa loại nhiệm vụ mới qua `POST /v1/governance/task-types`. DTO: `CreateTaskTypeRequest`. |
| **ActivateTaskType** | `GV-16` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Kích hoạt loại nhiệm vụ qua `POST /v1/governance/task-types/:id/activate`. DTO: `ActivateTaskTypeRequest`. |
| **DeactivateTaskType** | `GV-17` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Ngừng áp dụng loại nhiệm vụ qua `POST /v1/governance/task-types/:id/deactivate`. DTO: `DeactivateTaskTypeRequest`. |
| **PublishProofPolicyVersion** | `GV-18` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Ban hành phiên bản chính sách bằng chứng qua `POST /v1/governance/proof-policies`. DTO: `PublishProofPolicyVersionRequest`. |
| **PublishChecklistTemplateVersion** | `GV-19` | ACTIVE (MVP) | `EXTERNAL_GOVERNANCE_API` | Ban hành phiên bản mẫu kiểm tra qua `POST /v1/governance/checklist-templates`. DTO: `PublishChecklistTemplateVersionRequest`. |
| **ManageDynamicFindingsTemplate** | `GV-20` | FUTURE (NEXT) | `FUTURE_NOT_ACTIVE` | Quản lý mẫu biểu động thuộc giai đoạn sau; **KHÔNG CÓ ENDPOINT MVP**. |
| **UseBreakGlass** | `GV-21` | FUTURE (NEXT) | `FUTURE_NOT_ACTIVE` | Cơ chế xử lý khẩn cấp bypass thuộc giai đoạn sau; **KHÔNG CÓ ENDPOINT MVP**. |
| **ManagePlatformSystemConfig** | `GV-22` | REJECTED | `NOT_NETWORK_EXPOSED` | Đã bị loại trừ trong chuẩn tắc nghiệp vụ; **CẤM TRIỂN KHAI ENDPOINT**. |
| **ReportLocationException** | - | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Báo cáo giải trình GPS > 10m (DTO: `LocationExceptionDto`, gửi kèm SubmitEvidence hoặc issue). |
| **ReportIdentityException** | - | ACTIVE (MVP) | `EXTERNAL_OPERATIONAL_API` | Báo cáo đối soát tem QR hỏng (DTO: `IdentityExceptionDto`, gửi kèm SubmitEvidence). |
| **LookupTreeByQr** | - | ACTIVE (MVP) | `EXTERNAL_READ_API` | Truy vấn thông tin cây xanh qua mã QR quét được qua `GET /v1/trees/qr/:code`. |
| **ProjectCareHistory** | - | ACTIVE (MVP) | `SYSTEM_INTERNAL` | Tác vụ máy chủ tự động chiếu CareHistory khi task đạt trạng thái `COMPLETED`; **KHÔNG CÓ ENDPOINT MẠNG**. |

## NFR / Quality Drivers
- **Contract Safety & Robustness (`QAS-FAULT-01`):** Untrusted incoming payloads must be validated at the boundary, returning `400 VALIDATION_FAILED` before reaching application or domain logic.
- **Single Source of Truth:** Shared TypeScript types derived directly from Zod schemas across mobile, web, and backend.
- **Developer Ergonomics:** Schema-first inference eliminates code drift between validation logic and TypeScript interface declarations.

## Decision Question
How should `@novyx/contracts` be restructured and extended to support the full frozen business model, provide runtime schema validation, and cleanly organize operational vs governance API surfaces?

## Options Considered

### Option A: Manual Validation in Route Controllers + Plain TypeScript Interfaces
- **Description:** Keep plain TypeScript interfaces in `packages/contracts`; write manual checks in backend handlers and client services.
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
   ├── operational/        # External Operational Command & Query Schemas (OP-03..05, OP-08..11, OP-15, OP-18..21, Exceptions)
   ├── governance/         # External Governance Command & Query Schemas (GV-01..07, GV-10..19)
   ├── audit/              # AuditEventDto, ListAuditLogsQuerySchema (GV-08, GV-09)
   └── index.ts            # Public barrel export
   ```
2. **Canonical Enum Updates:**
   - `TaskStatus`: `'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'WAITING_REVIEW' | 'REWORK_REQUIRED' | 'COMPLETED' | 'CANCELLED'`
   - `ProofProfile`: `'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF'`
   - `ReviewDecision`: `'APPROVE' | 'APPROVE_WITH_EXCEPTION' | 'REQUEST_REWORK' | 'CANCEL'`
   - `AccountStatus`: `'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED'`
3. **Command Payload vs Transport Metadata Separation:**
   - **Business Command Payload Schemas:** All state-mutating command payload schemas enforce `expectedVersion: number` alongside command-specific domain fields. They do **NOT** contain `idempotencyKey`.
   - **HTTP Transport Metadata Schemas:** Transport headers (such as `Idempotency-Key: <UUIDv4>`) are validated via distinct technical request header schemas (e.g., `MutationRequestHeadersSchema`). Technical Zod schemas distinctly model `body`, `query`, `params`, and `headers` at the API boundary without merging transport concerns into domain payload objects.

## Rationale
Option B provides robust runtime schema validation without imposing heavy code generation pipelines. It directly fulfills the commitment made in `ADR 0003` while closing all schema gaps documented in `POST-SYNC-IMPLEMENTATION-GAP-MAP.md`.

## Consequences
- **Positive:** Complete synchronization between runtime validation and compile-time types. Standardized `VALIDATION_FAILED` errors. Clean separation between domain command data and HTTP transport headers.
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
- [x] **REQUEST_REVISION** (Batch 1: Revised candidate strictly separating HTTP transport headers like Idempotency-Key from business command payload schemas).
