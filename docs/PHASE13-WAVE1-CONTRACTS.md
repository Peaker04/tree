# Báo Cáo Nghiệm Thu Phase 13 Wave 1: Hợp Đồng Kỹ Thuật Dùng Chung & Runtime Validation (Phase 13 Wave 1 Contracts Evidence)

**Dự án:** NOVYX GreenOps  
**Giai đoạn:** Phase 13 — Implementation Wave 1: Contract-First + Zod Runtime Validation  
**Thời điểm lập:** 21/09/2026  
**Nhánh Git:** `base-setup`  
**Entry Head Commit:** `70eb7a1a215ffbaed4c1512b378e6a115acb9cd5`  
**Trạng thái Thực thi:** WAVE 1 COMPLETED (Local Exit Gates PASS)

---

## 1. Input Baseline

- **Frozen Baseline Entry Commit:** `70eb7a1a215ffbaed4c1512b378e6a115acb9cd5` (`docs(test): record remote CI pass evidence for wave 0`)
- **Working Tree Trước Khi Thay Đổi:** Hoàn toàn sạch (`clean`), không có tệp untracked hay uncommitted changes.
- **Môi trường Kỹ thuật:**
  - Node.js: `v24.13.0` (đáp ứng `node >=22.13.0`)
  - npm: `11.6.2`
- **Chất lượng Trước Thay Đổi (Pre-change Quality Baseline):**
  - `npm run format:check` $\to$ `PASS` (exit code: `0`)
  - `npm run lint` $\to$ `PASS` (exit code: `0`)
  - `npm run typecheck` $\to$ `PASS` (exit code: `0`)
  - `npm test` $\to$ `PASS` (13/13 tests, exit code: `0`)

---

## 2. Authorized Scope

- **Phạm vi Duy Nhất Được Phép:**
  Triển khai Đợt 1 (Wave 1) theo [`docs/PHASE12-IMPLEMENTATION-MASTER-PLAN.md`](PHASE12-IMPLEMENTATION-MASTER-PLAN.md) và [`docs/adr/0010-contracts-runtime-validation-governance-api.md`](adr/0010-contracts-runtime-validation-governance-api.md):
  - Cài đặt thư viện `zod` vào workspace `@novyx/contracts`.
  - Tái cấu trúc mô-đun `@novyx/contracts` theo nguyên lý Schema-first (Zod Schema $\to$ `z.infer`).
  - Chuẩn hóa 4 enum cốt lõi: `TaskStatus` (7 trạng thái), `ReviewDecision` (4 kết luận), `ProofProfile` (3 hồ sơ), `AccountStatus` (4 trạng thái).
  - Chuẩn hóa vai trò con người: `staff`, `manager`, `admin` (loại trừ `System`).
  - Thiết lập cơ chế kiểm soát đồng thời lạc quan (OCC) với `version: number` trên các aggregate có phiên bản và `expectedVersion: number` bắt buộc trên các lệnh đột biến tài nguyên hiện hữu.
  - Phân định rạch ròi: Header chuyển vận `Idempotency-Key: <UUIDv4>` tách biệt 100% khỏi payload nghiệp vụ (business command body).
  - Thiết lập hợp đồng lỗi xung đột OCC: `409 CONFLICT` / `STALE_VERSION`.
  - Thiết lập hợp đồng quản trị (Platform Governance) và truy vấn nhật ký kiểm toán (Audit Log) theo bảng phân loại phơi bày mạng tại ADR 0010.
  - Thiết lập lớp tương thích chuyển tiếp (`legacy/transitional.ts`) bảo toàn 100% tính tương thích mã nguồn và dữ liệu giả lập của `apps/mobile` mà **TUYỆT ĐỐI KHÔNG CHỈNH SỬA BẤT KỲ DÒNG MÃ NÀO DƯỚI `apps/**`**.
- **Phạm vi CẤM Tuyệt Đối trong Wave 1:**
  - CẤM tạo `apps/api` hoặc cài đặt Fastify, PostgreSQL driver, Drizzle ORM (thuộc Wave 2).
  - CẤM tạo `apps/admin-web` (thuộc Wave 6).
  - CẤM chạy build native Android/iOS (Gradle, Xcode, EAS build).
  - CẤM sửa đổi tài liệu nghiệp vụ đóng băng (`PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `REQUIREMENTS-TRACEABILITY.md`, `NFR.md`, `ARCHITECTURE.md`, `docs/adr/**`, `docs/business-reconciliation/**`, `docs/PHASE12-*`, `docs/PHASE12B-*`, `docs/PHASE13-WAVE0-QUALITY-FOUNDATION.md`).

---

## 3. Existing Contract Gaps

Trước Wave 1, tệp `packages/contracts/src/index.ts` tồn tại các khoảng cách lớn so với chuẩn tắc nghiệp vụ đóng băng:
1. **Thiếu Trạng Thái Vòng Đời:** `TaskStatus` chỉ có 5 trạng thái (`Pending`, `In_Progress`, `Waiting_Review`, `Completed`, `Rework_Required`), thiếu hoàn toàn `BLOCKED` và `CANCELLED`. Giá trị dùng chuỗi PascalCase thay vì chuẩn SCREAMING_SNAKE_CASE.
2. **Thiếu Kết Luận Thẩm Định:** `ReviewDecision` chỉ có `'approve' | 'request_rework'`, thiếu `'APPROVE_WITH_EXCEPTION'` và `'CANCEL'`.
3. **Thiếu Hồ Sơ Bằng Chứng Ngữ Nghĩa:** Không có enum `ProofProfile` (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`); chỉ có `EvidenceStage = 'before' | 'after'`.
4. **Thiếu DTO Báo Cáo Sự Cố & Ngoại Lệ:** Thiếu `LocationExceptionDto`, `IdentityExceptionDto`, `FieldIssueDto`.
5. **Không Có Runtime Validation:** Toàn bộ hợp đồng là TypeScript interface thuần túy thời điểm biên dịch, không có bộ xác thực payload tại ranh giới mạng.
6. **Thiếu Cơ Chế OCC & Idempotency:** Không có trường `version` trong `TaskDto`, `TreeDto`; không có `expectedVersion` trong các request đột biến; không có schema header `Idempotency-Key`.
7. **Không Có Hợp Đồng Quản Trị & Kiểm Toán:** Không có schema cho 15 lệnh quản trị MVP (`GV-01..19`) và truy vấn nhật ký kiểm toán.

---

## 4. Consumer Compatibility Inventory

Bảng kiểm kê người tiêu thụ `@novyx/contracts` trước khi triển khai:

| Export Hiện Tại | Nơi Sử Dụng (Consumers) | Runtime hay Type-only | Có Thể Đổi Trực Tiếp? | Giải Pháp Chuyển Tiếp Bắt Buộc |
| :--- | :--- | :---: | :---: | :--- |
| `TaskStatus` (object & type) | `apps/mobile/src/types.ts`<br>`apps/mobile/src/services/greenOpsService.ts`<br>`apps/mobile/src/screens/staff/**`<br>`apps/mobile/src/screens/manager/**`<br>`apps/mobile/src/data.ts` | **CẢ HAI** (Runtime: `TaskStatus.PENDING`, Type: `TaskStatus`) | **KHÔNG** (Trực tiếp đổi sẽ làm gãy `activeTask.status === 'Waiting_Review'`, `task.status !== 'Completed'`, và mock data) | Xuất `LegacyTaskStatus` với giá trị PascalCase gán cho `TaskStatus` object, đồng thời `type TaskStatus = CanonicalTaskStatus \| LegacyTaskStatus` trong `legacy/transitional.ts`. Canonical schema `TaskStatusSchema` chỉ chấp nhận đúng 7 chuỗi chữ hoa chuẩn. |
| `Role` ('Staff' \| 'Manager') | `apps/mobile/src/types.ts`<br>`apps/mobile/src/services/greenOpsService.ts`<br>`apps/mobile/src/screens/MobileApp.tsx` | Type-only | **KHÔNG** | Bảo lưu `type Role = 'Staff' \| 'Manager'` trong `legacy/transitional.ts`. Xuất chuẩn tắc `HumanRoleSchema = z.enum(['staff', 'manager', 'admin'])`. |
| `ReviewDecision` ('approve' \| 'request_rework') | `apps/mobile/src/screens/manager/ManagerReview.tsx`<br>`apps/mobile/src/services/greenOpsService.ts` | **CẢ HAI** (Chuỗi runtime `'approve'`, `'request_rework'` trong form) | **KHÔNG** | Xuất `type ReviewDecision = CanonicalReviewDecision \| LegacyReviewDecision` cho transitional. Canonical schema `ReviewDecisionSchema` chỉ chấp nhận đúng 4 kết luận chữ hoa chuẩn. |
| `TaskDto` | `apps/mobile/src/types.ts`<br>`apps/mobile/src/services/greenOpsService.ts`<br>`apps/mobile/src/data.ts` | Type-only | **KHÔNG** (trực tiếp bắt buộc `version: number` sẽ làm gãy `data.ts` thiếu version) | Xuất transitional `TaskDto` với `version?: number` và `status: TaskStatus`. Xuất canonical `TaskDtoSchema` và `CanonicalTaskDto` với `version: number` bắt buộc. |
| `TreeDto` | `apps/mobile/src/types.ts`<br>`apps/mobile/src/services/greenOpsService.ts`<br>`apps/mobile/src/data.ts` | Type-only | **KHÔNG** (tương tự TaskDto) | Xuất transitional `TreeDto` với `version?: number`. Xuất canonical `TreeDtoSchema` và `CanonicalTreeDto` với `version: number` bắt buộc. |
| `CareHistoryDto` | `apps/mobile/src/types.ts`<br>`apps/mobile/src/services/greenOpsService.ts`<br>`apps/mobile/src/components/presentation/TreeSurfaces.tsx` | Type-only | **KHÔNG** (trực tiếp ép `status: 'COMPLETED'` làm gãy `TreeSurfaces.tsx` so sánh với `TaskStatus.COMPLETED`) | Xuất transitional `CareHistoryDto` với `status: TaskStatus`. Xuất canonical `CareHistoryDtoSchema` cho phép `COMPLETED`. |
| `SubmitTaskEvidenceRequest` | `apps/mobile/src/services/greenOpsService.ts` | Type-only | **KHÔNG** | Xuất transitional `SubmitTaskEvidenceRequest` (giữ nguyên cấu trúc cũ, thêm `expectedVersion?: number`). Xuất canonical `SubmitEvidenceRequestSchema`. |
| `ReviewDecisionRequest` | `apps/mobile/src/services/greenOpsService.ts`<br>`apps/mobile/src/screens/manager/ManagerReview.tsx` | Type-only | **KHÔNG** | Xuất transitional `ReviewDecisionRequest` (cho phép `'approve' \| 'request_rework'`). Xuất canonical `ApproveTaskRequestSchema`, `RequestReworkRequestSchema`. |
| `ApiSuccess`, `ApiFailure`, `ApiList`, `ApiError`, `ApiResult` | `apps/mobile/src/services/greenOpsService.ts` | Type-only | **CÓ** | Giữ nguyên tên và định dạng envelope, bổ sung Zod schemas tương ứng. |
| `scripts/greenops-dev-api.cjs` | Scripts độc lập CommonJS | Không import contracts trực tiếp | N/A | Không bị ảnh hưởng. |

---

## 5. Zod Runtime Foundation

- Thư viện `zod` phiên bản `^3.25.76` đã được cài đặt thành công vào workspace `@novyx/contracts` thông qua lệnh:
  `npm install zod --workspace=@novyx/contracts`
- Cập nhật đúng 2 tệp quản lý gói:
  - `packages/contracts/package.json`
  - `package-lock.json`
- Mọi hợp đồng mới tuân thủ triệt để nguyên tắc **Schema-first**:
  - Schema được định nghĩa trước qua Zod: `export const XxxSchema = z.object({ ... });`
  - Kiểu TypeScript được suy luận trực tiếp: `export type Xxx = z.infer<typeof XxxSchema>;`
  - Tuyệt đối không duy trì song song một TypeScript union hoặc interface độc lập để tránh nguy cơ trôi lệch kiểu (type drift).

---

## 6. Canonical Enums

1. **`TaskStatus` (7 trạng thái tất định):**
   - Định nghĩa: `TaskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'BLOCKED', 'WAITING_REVIEW', 'REWORK_REQUIRED', 'COMPLETED', 'CANCELLED'])`
   - Kiểm thử xác nhận: Từ chối nghiêm ngặt các bí danh `DRAFT`, `ASSIGNED`, `SUBMITTED` và các giá trị PascalCase cũ (`Pending`, `In_Progress`, `Waiting_Review`).
2. **`ReviewDecision` (4 kết luận tất định):**
   - Định nghĩa: `ReviewDecisionSchema = z.enum(['APPROVE', 'APPROVE_WITH_EXCEPTION', 'REQUEST_REWORK', 'CANCEL'])`
   - Kiểm thử xác nhận: Từ chối các giá trị không chuẩn (`approve`, `request_rework`, `reject`, `REJECT`).
3. **`ProofProfile` (3 hồ sơ bằng chứng ngữ nghĩa):**
   - Định nghĩa: `ProofProfileSchema = z.enum(['CHANGE_PROOF', 'SERVICE_PROOF', 'INSPECTION_PROOF'])`
   - Kiểm thử xác nhận: Không chấp nhận hồ sơ thứ tư hoặc hồ sơ tự cấu hình tùy tiện trong MVP.
4. **`AccountStatus` (4 trạng thái vòng đời tài khoản):**
   - Định nghĩa: `AccountStatusSchema = z.enum(['INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED'])`
   - Kiểm thử xác nhận: Khóa xác thực tạm thời không phải là AccountStatus; kiểm thử xác nhận từ chối `LOCKED`.
5. **`HumanRole` (3 vai trò con người):**
   - Định nghĩa: `HumanRoleSchema = z.enum(['staff', 'manager', 'admin'])`
   - Kiểm thử xác nhận: `System` là tác nhân kỹ thuật, không phải vai trò con người; kiểm thử từ chối `System` và không gộp `admin` vào `manager`.

---

## 7. Proof Contracts

Hợp đồng bằng chứng phản ánh chính xác cấu trúc hồ sơ theo `DOMAIN.md §4` và `WORKFLOWS.md §3`:
1. **`CHANGE_PROOF` (`ChangeProofPayloadSchema`):**
   - Bắt buộc có ảnh Trước (`beforePhotoUri: string`).
   - Bắt buộc có ảnh Sau (`afterPhotoUri: string`).
   - Bắt buộc có bảng tiêu chuẩn (`checklist: ChecklistItemDto[]`, tối thiểu 1 mục).
2. **`SERVICE_PROOF` (`ServiceProofPayloadSchema`):**
   - Bắt buộc có ảnh Hoàn thành (`completionPhotoUri: string`).
   - Bắt buộc có bảng tiêu chuẩn (`checklist: ChecklistItemDto[]`, tối thiểu 1 mục).
   - Không bắt buộc chụp ảnh Trước.
3. **`INSPECTION_PROOF` (`InspectionProofPayloadSchema`):**
   - Bắt buộc có kết quả khám bệnh có cấu trúc theo Fixed Schema chuẩn tắc (`findings: StructuredFindingsSchema` gồm: `trunkLeanAngle`, `cavityRotPercentage`, `pestSeverity`, `deadwoodRisk`).
   - Bắt buộc có danh sách ảnh hiện trạng khuyết tật/sâu bệnh (`conditionPhotos: string[]`, tối thiểu 1 ảnh).
   - Không áp dụng checklist thao tác chung chung.
4. **`ProofPayloadSchema`:** Hợp đồng hợp nhất phân biệt (discriminated union) dựa trên trường `proofProfile`.

---

## 8. Exception Contracts

Thiết lập các hợp đồng ngoại lệ theo ADR 0010:
1. **`LocationExceptionSchema` / `LocationExceptionDto`:** Báo cáo ngoại lệ GPS trôi $> 10$m gồm: `reason`, `distanceMeters`, `explanationPhotoUri`, `recordedLat`, `recordedLng`, `timestamp`.
2. **`IdentityExceptionSchema` / `IdentityExceptionDto`:** Báo cáo ngoại lệ tem QR hư hỏng gồm: `reason`, `damagedQrPhotoUri`, `embossedCode`, `timestamp`.
3. **`FieldIssueDtoSchema` / `ReportFieldIssueRequestSchema`:** Báo cáo sự cố ách tắc thi công (đưa task sang `BLOCKED`) gồm: `taskId`, `expectedVersion`, `issueDescription`, `issuePhotoUri`.
4. **`ResumeBlockedTaskRequestSchema`:** Lệnh giải tỏa ách tắc đưa task trở lại `IN_PROGRESS` gồm: `taskId`, `expectedVersion`, `resolutionNotes`.

---

## 9. OCC Versioning

- Bổ sung trường số nguyên không âm `version: number` vào các DTO aggregate có phiên bản:
  - `TaskDtoSchema`
  - `TreeDtoSchema`
- Bổ sung `expectedVersion: number` vào các lệnh đột biến tài nguyên hiện hữu:
  - `AssignTaskRequestSchema`
  - `StartTaskRequestSchema`
  - `ReassignTaskRequestSchema`
  - `CancelTaskRequestSchema`
  - `SubmitEvidenceRequestSchema`
  - `ApproveTaskRequestSchema`
  - `ApproveWithExceptionRequestSchema`
  - `RequestReworkRequestSchema`
  - `ResubmitReworkRequestSchema`
  - `ReportFieldIssueRequestSchema`
  - `ResumeBlockedTaskRequestSchema`
  - `AssignRoleRequestSchema`
  - `ActivateAccountRequestSchema`
  - `SuspendAccountRequestSchema`
  - `DisableAccountRequestSchema`
  - `UnlockAccountRequestSchema`
  - `ResetCredentialSetupRequestSchema`
  - `UpdateTreeMasterDataRequestSchema`
  - `ReplaceTreeQrCodeRequestSchema`
  - `UpdateCanonicalCoordinatesRequestSchema`
  - `RetireTreeRequestSchema`
  - `ActivateTaskTypeRequestSchema`
  - `DeactivateTaskTypeRequestSchema`
- Độ chính xác `expectedVersion`: Các lệnh khởi tạo aggregate mới (`CreateTask`, `ProvisionUser`, `CreateTree`, `CreateTaskType`) **TUYỆT ĐỐI KHÔNG YÊU CẦU `expectedVersion`**.

---

## 10. Idempotency Header

- Định nghĩa schema chuyển vận:
  - `StrictUuidv4Schema = z.string().uuid()`
  - `IdempotencyKeyHeaderSchema`: Hỗ trợ header `idempotency-key` hoặc `Idempotency-Key` với định dạng UUIDv4 nghiêm ngặt.
  - `StrictMutationHeadersSchema = z.object({ 'idempotency-key': StrictUuidv4Schema })`
- **Tách Biệt Tuyệt Đối:** Toàn bộ các schema payload nghiệp vụ (`CreateTaskRequestSchema`, `SubmitEvidenceRequestSchema`, v.v.) **KHÔNG CHỨA TRƯỜNG `idempotencyKey`**.
- Hợp đồng lỗi OCC xung đột:
  - HTTP status: `409 CONFLICT`
  - Top-level code: `CONFLICT`
  - Error details: `ConflictErrorDetailsSchema = z.object({ subtype: z.literal('STALE_VERSION'), currentVersion: z.number().int().nonnegative(), expectedVersion: z.number().int().nonnegative() })`

---

## 11. API Envelope Compatibility

Bảo lưu đầy đủ các định dạng envelope đã được thiết lập tại ADR 0003, mở rộng thêm các Zod schema tương ứng:
- `API_VERSION = 'v1'` (`ApiVersionSchema`)
- `ERROR_CODES`: `VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL` (`ErrorCodeSchema`)
- `ApiError` (`ApiErrorSchema`)
- `ApiSuccess<TData>` (`createApiSuccessSchema`)
- `ApiList<TData>` (`createApiListSchema`, `ApiListMetaSchema`)
- `ApiFailure` (`ApiFailureSchema`)
- `ApiResult<TData>`

---

## 12. Governance Contract Exposure

Theo đúng bảng phân loại tại ADR 0010:
- **Các hành động Quản trị Active MVP được thiết lập schema:**
  - `ProvisionUser` (`GV-01`)
  - `AssignRole` (`GV-02`)
  - `ActivateAccount` (`GV-03`)
  - `SuspendAccount` (`GV-04`)
  - `DisableAccount` (`GV-05`)
  - `UnlockAccount` (`GV-06`)
  - `ResetCredentialSetup` (`GV-07`)
  - `ViewAuditLog` (`GV-08`), `FilterAuditLog` (`GV-09`) $\to$ `ListAuditLogsQuerySchema`, `AuditEventDtoSchema`
  - `CreateTree` (`GV-10`), `UpdateTreeMasterData` (`GV-11`), `ReplaceTreeQrCode` (`GV-12`), `UpdateCanonicalCoordinates` (`GV-13`), `RetireTree` (`GV-14`)
  - `CreateTaskType` (`GV-15`), `ActivateTaskType` (`GV-16`), `DeactivateTaskType` (`GV-17`)
  - `PublishProofPolicyVersion` (`GV-18`), `PublishChecklistTemplateVersion` (`GV-19`)
- **Các hành động BỊ CẤM / HOÃN KHÔNG CÓ SCHEMA NGOÀI:**
  - `ManageDynamicFindingsTemplate` (`GV-20`) $\to$ `FUTURE_NOT_ACTIVE` (KHÔNG TẠO ENDPOINT/SCHEMA).
  - `UseBreakGlass` (`GV-21`) $\to$ `FUTURE_NOT_ACTIVE` (KHÔNG TẠO ENDPOINT/SCHEMA).
  - `ManagePlatformSystemConfig` (`GV-22`) $\to$ `NOT_NETWORK_EXPOSED` (BÁC BỎ, KHÔNG TẠO ENDPOINT/SCHEMA).
  - `ProjectCareHistory` $\to$ `SYSTEM_INTERNAL` (TÁC VỤ MÁY CHỦ NỘI BỘ, KHÔNG TẠO ENDPOINT/SCHEMA).

---

## 13. Legacy Compatibility Boundary

- Toàn bộ các định nghĩa hỗ trợ tương thích ngược cho `apps/mobile` được cô lập riêng tại:
  `packages/contracts/src/legacy/transitional.ts`
- Mọi xuất khẩu chuyển tiếp đều được gắn chú thích:
  `@deprecated TRANSITIONAL_COMPAT`
- Đảm bảo:
  - Không làm ô nhiễm các schema chuẩn tắc mới (`TaskStatusSchema`, `ReviewDecisionSchema`, v.v.).
  - Các giá trị legacy (PascalCase, chuỗi thường) bị từ chối 100% tại canonical schemas.
  - Không yêu cầu bất kỳ chỉnh sửa nào trong `apps/**`.

---

## 14. Files Changed

1. `packages/contracts/package.json` (thêm dependency `zod`)
2. `package-lock.json` (ghi nhận dependency `zod`)
3. `packages/contracts/src/common/api-version.ts` (NEW)
4. `packages/contracts/src/common/error-codes.ts` (NEW)
5. `packages/contracts/src/common/envelopes.ts` (NEW)
6. `packages/contracts/src/common/pagination.ts` (NEW)
7. `packages/contracts/src/common/transport.ts` (NEW)
8. `packages/contracts/src/common/index.ts` (NEW)
9. `packages/contracts/src/auth/roles.ts` (NEW)
10. `packages/contracts/src/auth/account-status.ts` (NEW)
11. `packages/contracts/src/auth/auth-session.ts` (NEW)
12. `packages/contracts/src/auth/credentials.ts` (NEW)
13. `packages/contracts/src/auth/index.ts` (NEW)
14. `packages/contracts/src/operational/task-status.ts` (NEW)
15. `packages/contracts/src/operational/review-decision.ts` (NEW)
16. `packages/contracts/src/operational/proof-profile.ts` (NEW)
17. `packages/contracts/src/operational/verification.ts` (NEW)
18. `packages/contracts/src/operational/exceptions.ts` (NEW)
19. `packages/contracts/src/operational/field-issue.ts` (NEW)
20. `packages/contracts/src/operational/evidence.ts` (NEW)
21. `packages/contracts/src/operational/operational-tasks.ts` (NEW)
22. `packages/contracts/src/operational/care-history.ts` (NEW)
23. `packages/contracts/src/operational/index.ts` (NEW)
24. `packages/contracts/src/governance/users.ts` (NEW)
25. `packages/contracts/src/governance/trees.ts` (NEW)
26. `packages/contracts/src/governance/task-types.ts` (NEW)
27. `packages/contracts/src/governance/policies.ts` (NEW)
28. `packages/contracts/src/governance/index.ts` (NEW)
29. `packages/contracts/src/audit/audit-event.ts` (NEW)
30. `packages/contracts/src/audit/audit-queries.ts` (NEW)
31. `packages/contracts/src/audit/index.ts` (NEW)
32. `packages/contracts/src/legacy/transitional.ts` (NEW)
33. `packages/contracts/src/legacy/index.ts` (NEW)
34. `packages/contracts/src/index.ts` (REFACTORED master barrel)
35. `tests/contracts/contracts.spec.ts` (NEW - 55 tests)
36. `docs/PHASE13-WAVE1-CONTRACTS.md` (NEW)

---

## 15. Tests Added

Tệp kiểm thử mới: `tests/contracts/contracts.spec.ts` (55 tests chi tiết):
- 1. Canonical TaskStatus: Exact 7 States (2 tests)
- 2. Reject Non-Canonical TaskStatus (3 tests)
- 3. Canonical ReviewDecision: Exact 4 Outcomes (3 tests)
- 4. Canonical ProofProfile: Exact 3 Profiles (3 tests)
- 5. Canonical AccountStatus: Exact 4 States (No LOCKED) (3 tests)
- 6. Canonical Human Roles: staff, manager, admin (3 tests)
- 7. Structural Evidence Differentiation by ProofProfile (11 tests: CHANGE_PROOF, SERVICE_PROOF, INSPECTION_PROOF)
- 8. Runtime DTO Parsing & Validation (6 tests: CreateTask, TaskDto, TreeDto, Envelopes, SiteVerification, Findings)
- 9. Version Field Validation in Versioned Entities (2 tests)
- 10. expectedVersion Required on Existing-Resource Mutations (3 tests)
- 11. expectedVersion NOT Required on Creation Contracts (4 tests)
- 12. Strict UUIDv4 Idempotency-Key Header Schema (4 tests)
- 13. Separation: Idempotency-Key Absent from Business Request Bodies (1 test)
- 14. OCC Error Contract: 409 CONFLICT / STALE_VERSION (2 tests)
- 15. Clean Separation of Transport Surfaces (1 test)
- 16. Governance Exposure Boundaries (2 tests)
- 17. Legacy Compatibility Layer Isolation (2 tests)

Tổng số test chạy trong repo: **68 tests** (10 Wave-0 governance + 3 Wave-0 architecture + 55 Wave-1 contracts), toàn bộ **PASS 100%**.

---

## 16. Commands Executed

```powershell
# Pre-change quality baseline
node --version
npm --version
npm run format:check
npm run lint
npm run typecheck
npm test

# Zod installation
npm install zod --workspace=@novyx/contracts

# Verification gates
npx prettier --write packages/contracts/src/operational/review-decision.ts tests/contracts/contracts.spec.ts
npm run format:check
npm run lint
npm run typecheck
npm run typecheck --workspace @novyx/contracts
npm test
git diff --check

# Source boundary verification
git diff --name-only 70eb7a1a215ffbaed4c1512b378e6a115acb9cd5 HEAD -- apps scripts external packages/ui packages/config
git diff --name-only 70eb7a1a215ffbaed4c1512b378e6a115acb9cd5 HEAD -- docs/PRODUCT.md docs/DOMAIN.md docs/ACCESS-CONTROL.md docs/WORKFLOWS.md docs/REQUIREMENTS-TRACEABILITY.md docs/NFR.md docs/ARCHITECTURE.md docs/adr docs/business-reconciliation docs/diagrams docs/PHASE12-CURRENT-SOURCE-EVIDENCE.md docs/PHASE12-IMPLEMENTATION-DECISION-REGISTER.md docs/PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md docs/PHASE12-IMPLEMENTATION-MASTER-PLAN.md docs/PHASE12-IMPLEMENTATION-TRACEABILITY.md docs/PHASE12B-EXECUTION-READINESS.md docs/PHASE13-WAVE0-QUALITY-FOUNDATION.md
```

---

## 17. Exit Results

| Lệnh / Kiểm Tra | Mã Thoát (Exit Code) | Kết Quả | Ghi Chú |
| :--- | :---: | :---: | :--- |
| `npm run format:check` | `0` | **PASS** | Tất cả các tệp tuân thủ Prettier code style |
| `npm run lint` | `0` | **PASS** | ESLint 0 errors, 0 warnings |
| `npm run typecheck` | `0` | **PASS** | Toàn bộ 4 workspaces (`mobile`, `config`, `contracts`, `ui`) biên dịch sạch |
| `npm run typecheck --workspace @novyx/contracts` | `0` | **PASS** | `@novyx/contracts` typecheck sạch 100% |
| `npm test` | `0` | **PASS** | 68/68 tests passed (3 test files) |
| `git diff --check` | `0` | **PASS** | Không có lỗi khoảng trắng / whitespace |

---

## 18. Source Boundary Verification

1. **Ranh giới Mã Ứng dụng:**
   - Lệnh: `git diff --name-only 70eb7a1a215ffbaed4c1512b378e6a115acb9cd5 HEAD -- apps scripts external packages/ui packages/config`
   - Kết quả: **KHÔNG CÓ ĐẦU RA** (Zero changes).
2. **Ranh giới Tài liệu Đóng băng:**
   - Lệnh: `git diff --name-only 70eb7a1a215ffbaed4c1512b378e6a115acb9cd5 HEAD -- docs/PRODUCT.md docs/DOMAIN.md docs/ACCESS-CONTROL.md docs/WORKFLOWS.md docs/REQUIREMENTS-TRACEABILITY.md docs/NFR.md docs/ARCHITECTURE.md docs/adr docs/business-reconciliation docs/diagrams docs/PHASE12-CURRENT-SOURCE-EVIDENCE.md docs/PHASE12-IMPLEMENTATION-DECISION-REGISTER.md docs/PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md docs/PHASE12-IMPLEMENTATION-MASTER-PLAN.md docs/PHASE12-IMPLEMENTATION-TRACEABILITY.md docs/PHASE12B-EXECUTION-READINESS.md docs/PHASE13-WAVE0-QUALITY-FOUNDATION.md`
   - Kết quả: **KHÔNG CÓ ĐẦU RA** (Zero changes).
3. **Danh mục Thay đổi Hợp lệ:**
   Chỉ bao gồm:
   - `packages/contracts/**`
   - `package-lock.json`
   - `tests/contracts/**`
   - `docs/PHASE13-WAVE1-CONTRACTS.md`

---

## 19. Negative Assertions

Tất cả 20 mệnh đề phủ định đều đạt kỳ vọng: **FALSE**:

| Mã Mệnh Đề Phủ Định | Nội Dung Mệnh Đề | Kết Quả Thực Tế | Đánh Giá |
| :--- | :--- | :---: | :---: |
| **P13W1-N01** | Wave 2 backend was started. | **FALSE** | **PASS** |
| **P13W1-N02** | `apps/api` exists because of Wave 1. | **FALSE** | **PASS** |
| **P13W1-N03** | `apps/mobile` source was changed. | **FALSE** | **PASS** |
| **P13W1-N04** | Legacy values are accepted by canonical `TaskStatusSchema`. | **FALSE** | **PASS** |
| **P13W1-N05** | `ReviewDecision` remains only approve/request_rework. | **FALSE** | **PASS** |
| **P13W1-N06** | `ProofProfile` is missing. | **FALSE** | **PASS** |
| **P13W1-N07** | `LOCKED` was added to `AccountStatus`. | **FALSE** | **PASS** |
| **P13W1-N08** | Admin was collapsed into Manager. | **FALSE** | **PASS** |
| **P13W1-N09** | `Idempotency-Key` exists in canonical business body schemas. | **FALSE** | **PASS** |
| **P13W1-N10** | `expectedVersion` is blindly required on `CreateTask`. | **FALSE** | **PASS** |
| **P13W1-N11** | `expectedVersion` is blindly required on `ProvisionUser`. | **FALSE** | **PASS** |
| **P13W1-N12** | 48 business commands became 48 endpoints. | **FALSE** | **PASS** |
| **P13W1-N13** | `CLIENT_LOCAL_ADVISORY` actions became network endpoints. | **FALSE** | **PASS** |
| **P13W1-N14** | `FUTURE_NOT_ACTIVE` commands were activated. | **FALSE** | **PASS** |
| **P13W1-N15** | OCC conflict creates a new TaskStatus. | **FALSE** | **PASS** |
| **P13W1-N16** | Zod schemas and manual TypeScript unions drift independently. | **FALSE** | **PASS** |
| **P13W1-N17** | Wave-0 canonical fixtures were edited to hide disagreement. | **FALSE** | **PASS** |
| **P13W1-N18** | Android/iOS build is required for Wave-1 acceptance. | **FALSE** | **PASS** |
| **P13W1-N19** | Fastify/Drizzle/database implementation was introduced. | **FALSE** | **PASS** |
| **P13W1-N20** | Wave 2 started automatically. | **FALSE** | **PASS** |

---

## 20. Exit Gates

| Cổng Kiểm Tra (Exit Gate) | Lệnh Thực Nghiệm | Trạng Thái | Kết Luận |
| :--- | :--- | :---: | :---: |
| **Gate 1: Format** | `npm run format:check` | `0` | **PASS** |
| **Gate 2: Lint** | `npm run lint` | `0` | **PASS** |
| **Gate 3: All Workspaces Typecheck** | `npm run typecheck` | `0` | **PASS** |
| **Gate 4: Contracts Workspace Typecheck** | `npm run typecheck --workspace @novyx/contracts` | `0` | **PASS** |
| **Gate 5: All Tests (Wave 0 + Wave 1)** | `npm test` | `0` | **PASS** |
| **Gate 6: Whitespace Cleanliness** | `git diff --check` | `0` | **PASS** |
| **Gate 7: App Source Unchanged** | `git diff --name-only <ENTRY> HEAD -- apps scripts external packages/ui packages/config` | Trống (0 diff) | **PASS** |
| **Gate 8: Frozen Baseline Unchanged** | `git diff --name-only <ENTRY> HEAD -- docs/PRODUCT.md ...` | Trống (0 diff) | **PASS** |

---

## 21. Remote CI Status

- **Trạng thái tại thời điểm cam kết (commit time):** `REMOTE_CI = NOT_RUN`
- Tuyệt đối không tạo cam kết nguồn giả mạo để ghi đè kết quả CI. Sau khi push lên remote `origin/base-setup`, tiến trình GitHub Actions sẽ được theo dõi độc lập.

---

## 22. Final Status

```text
PHASE 13 / WAVE 1 IMPLEMENTED — LOCAL CONTRACT GATES PASS
— ZOD RUNTIME VALIDATION ESTABLISHED
— TASKSTATUS 7/7 CANONICAL
— REVIEWDECISION 4/4 CANONICAL
— PROOFPROFILE 3/3 CANONICAL
— ACCOUNTSTATUS 4/4 CANONICAL
— OCC VERSION CONTRACTS ESTABLISHED
— IDEMPOTENCY-KEY TRANSPORT SCHEMA ESTABLISHED
— BUSINESS BODY / TRANSPORT HEADER SEPARATION PRESERVED
— NETWORK EXPOSURE CLASSIFICATION PRESERVED
— LEGACY COMPATIBILITY BOUNDED
— CURRENT MOBILE SOURCE UNCHANGED
— WAVE-0 TESTS REMAIN GREEN
— NO BACKEND IMPLEMENTATION
— NO ADMIN WEB IMPLEMENTATION
— NO ANDROID BUILD REQUIRED
— NO IOS BUILD REQUIRED
— WAVE 2 REMAINS LOCKED
— READY FOR INDEPENDENT WAVE-1 ACCEPTANCE
```
