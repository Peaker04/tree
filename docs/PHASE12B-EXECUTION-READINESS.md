# Báo Cáo Sẵn Sàng Thực Thi & Đóng Băng Giai Đoạn 12B (Phase 12B Execution Readiness & Final Freeze)

**Dự án:** NOVYX GreenOps
**Giai đoạn:** Phase 12B — Final Freeze & Execution Readiness (Canonical Correction)
**Ngày lập:** 21/09/2026
**Commit Baseline:** `58111dd764f45c9dbccc81a57316782b124e9aa2`
**Nhánh:** `base-setup`
**Tài liệu Nguồn Thẩm Quyền:**
- [`docs/PRODUCT.md`](PRODUCT.md), [`docs/DOMAIN.md`](DOMAIN.md), [`docs/ACCESS-CONTROL.md`](ACCESS-CONTROL.md)
- [`docs/WORKFLOWS.md`](WORKFLOWS.md), [`docs/REQUIREMENTS-TRACEABILITY.md`](REQUIREMENTS-TRACEABILITY.md), [`docs/NFR.md`](NFR.md)
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/adr/`](adr/)
- [`docs/PHASE12-CURRENT-SOURCE-EVIDENCE.md`](PHASE12-CURRENT-SOURCE-EVIDENCE.md)
- [`docs/PHASE12-IMPLEMENTATION-DECISION-REGISTER.md`](PHASE12-IMPLEMENTATION-DECISION-REGISTER.md)
- [`docs/PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md`](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md)
- [`docs/PHASE12-IMPLEMENTATION-MASTER-PLAN.md`](PHASE12-IMPLEMENTATION-MASTER-PLAN.md)
- [`docs/PHASE12-IMPLEMENTATION-TRACEABILITY.md`](PHASE12-IMPLEMENTATION-TRACEABILITY.md)

---

## 1. Mục Đích (Purpose)

Báo cáo này xác lập mốc đóng băng chính thức cuối cùng của **Phase 12B (Final Planning Freeze)** và công bố trạng thái **Sẵn Sàng Thực Thi (Execution Readiness)** của Dự án NOVYX GreenOps sau khi đã hiệu chỉnh triệt để mọi sai lệch ngữ nghĩa chuẩn tắc (canonical drift).

Sau khi hoàn tất 3 đợt phê duyệt của Chủ quản (Batches 1–3):
1. **8 quyết định cấp triển khai cốt lõi** đã được Chủ quản phê duyệt chính thức (`OWNER_APPROVED`). Toàn bộ các quyết định chặn việc khởi động kỹ thuật cho các Đợt triển khai Waves 0–6 đã được giải tỏa triệt để.
2. **3 quyết định cấp triển khai còn lại** (`IDB-08`, `IDB-09`, `IDB-10`) được chính thức hoãn có chủ đích và có ranh giới bảo vệ nghiêm ngặt (`DEFERRED_WITH_BOUNDARY`). Ba quyết định này không cản trở kiến trúc mã nguồn hay việc lập trình Waves 0–6.
3. Ràng buộc bàn giao chi phí bằng không / dùng thử miễn phí (`COST-01`) được ghi nhận như một nguyên tắc điều hành nhưng tuyệt đối bảo toàn tính trung lập nhà cung cấp và bảo toàn toàn vẹn kiến trúc.
4. Xác lập quyền thực thi có kiểm soát: Việc đóng băng Phase 12B **KHÔNG** cho phép thực thi đồng loạt mọi wave. Việc thực thi được phân chia nghiêm ngặt theo cổng (wave-gated), và **DUY NHẤT Wave 0 (Nền tảng Kiểm thử, Chất lượng & Quản trị Thực thi)** được phép kích hoạt trong Phase 13 tiếp theo.
5. **TUYỆT ĐỐI KHÔNG CÓ THỰC THI MÃ NGUỒN** trong giai đoạn này.

---

## 2. Đường Cơ Sở Git Đóng Băng (Frozen Git Baseline)

- **Nhánh thực hiện:** `base-setup`
- **Commit Baseline Đầu Vào Phase 12B Final Freeze:** `58111dd764f45c9dbccc81a57316782b124e9aa2`
- **Trạng thái Working Tree:** Sạch (`clean`), không có thay đổi chưa commit trong mã nguồn hoặc tệp chưa theo dõi.
- **Dòng Lịch Sử Commit Chuẩn Tắc (Trích xuất từ Git Log Thực Tế):**
  - `8735332` — `docs(architecture): close phase 11C derived-view drift`
  - `6b0ba31` — `docs(implementation): prepare post-ADR implementation master plan`
  - `ff4e11f` — `docs(implementation): close phase 12A planning gaps`
  - `9df1b29` — `docs(implementation): finalize phase 12A owner review plan`
  - `0fcc5e1` — `docs(implementation): record owner decisions batch 1`
  - `7cb1b76` — `docs(implementation): record owner decisions batch 2`
  - `c0390e0` — `docs(implementation): record owner decisions batch 3`
  - `58111dd` — `docs(implementation): freeze phase 12B execution readiness`

---

## 3. Đường Cơ Sở Nghiệp Vụ Đóng Băng (Frozen Business Baseline)

Toàn bộ các tài liệu đặc tả nghiệp vụ từ Phase 1 đến Phase 7 được giữ nguyên vẹn 100%, không bị sửa đổi hay tha hóa:
- **Tài liệu thẩm quyền nghiệp vụ:** [`docs/PRODUCT.md`](PRODUCT.md), [`docs/DOMAIN.md`](DOMAIN.md), [`docs/ACCESS-CONTROL.md`](ACCESS-CONTROL.md), [`docs/WORKFLOWS.md`](WORKFLOWS.md), [`docs/REQUIREMENTS-TRACEABILITY.md`](REQUIREMENTS-TRACEABILITY.md), [`docs/NFR.md`](NFR.md), và toàn bộ thư mục [`docs/business-reconciliation/`](business-reconciliation/).
- **7 Trạng Thái Vòng Đời Tác Vụ Chuẩn Tắc (`TaskStatus`):**
  Đúng 7 trạng thái tất định theo [`docs/ARCHITECTURE.md`](ARCHITECTURE.md#L310), [`docs/adr/0008-offline-durable-storage-outbox.md`](adr/0008-offline-durable-storage-outbox.md#L48), và [`docs/business-reconciliation/05-DOMAIN-OWNERSHIP-MATRIX.md`](business-reconciliation/05-DOMAIN-OWNERSHIP-MATRIX.md#L71):
  $$\mathbf{PENDING,\ IN\_PROGRESS,\ BLOCKED,\ WAITING\_REVIEW,\ REWORK\_REQUIRED,\ COMPLETED,\ CANCELLED}$$
  *(Lưu ý chuẩn tắc: Các từ khóa `DRAFT`, `ASSIGNED`, `SUBMITTED` tuyệt đối KHÔNG PHẢI là trạng thái thuộc `TaskStatus` chuẩn tắc; không sử dụng bí danh tự tạo).*
- **4 Kết Luận Duyệt Tác Vụ Chuẩn Tắc (`ReviewDecision`):**
  Đúng 4 kết luận thẩm định theo [`docs/ACCESS-CONTROL.md`](ACCESS-CONTROL.md), [`docs/BUSINESS-PROCESS-REVIEW.md`](BUSINESS-PROCESS-REVIEW.md#L256), và [`docs/adr/0010-contracts-runtime-validation-governance-api.md`](adr/0010-contracts-runtime-validation-governance-api.md):
  $$\mathbf{APPROVE,\ APPROVE\_WITH\_EXCEPTION,\ REQUEST\_REWORK,\ CANCEL}$$
  *(Cấm rút gọn thành nhị phân Approve/Reject thô sơ).*
- **3 Hồ Sơ Bằng Chứng Ngữ Nghĩa (`ProofProfile`):**
  Đúng 3 hồ sơ chuẩn tắc theo [`docs/DOMAIN.md`](DOMAIN.md) và [`docs/adr/0010-contracts-runtime-validation-governance-api.md`](adr/0010-contracts-runtime-validation-governance-api.md):
  $$\mathbf{CHANGE\_PROOF,\ SERVICE\_PROOF,\ INSPECTION\_PROOF}$$
- **Danh Mục Lệnh Nghiệp Vụ Chuẩn Tắc (Canonical Business Commands):**
  Các lệnh vận hành hiện trường (`CMD-OP-*`) và lệnh quản trị nền tảng (`CMD-ADM-*` / `GV-*`) đã được phê chuẩn trong các tài liệu thẩm quyền nghiệp vụ, ánh xạ chuẩn xác sang các In-Process Module Interfaces của kiến trúc Modular Monolith theo nguyên tắc ADR 0010:
  $$\text{Business Command} \neq \text{HTTP Route} \neq \text{DTO} \neq \text{Transport Header}$$
  *(Loại bỏ hoàn toàn các con số suy diễn không có thẩm quyền như "49 truy vấn" hay "14 thực thể").*
- **Nguyên Tắc Phân Quyền & Tách Biệt Nhiệm Vụ (SoD):**
  - Quản trị viên (`Admin`) tuyệt đối không can thiệp, không bắt đầu, không nộp, không duyệt các tác vụ vận hành hiện trường (`PLAN-SOD-ADMIN`, `BR-ACT-01`, `P4-09`).
  - Người thẩm định không bao giờ được tự duyệt bằng chứng do chính mình nộp trong lịch sử (`DR-HARD-02`, `SoD-02`: $\text{reviewerId} \notin \text{task.getHistoricalSubmissionAuthorIds()}$).
  - Kiểm tra độ tươi tài khoản và thu hồi quyền tức thì ở Cổng An ninh Tier 2 (`PLAN-AUTH-FRESHNESS`, `accountStatus === 'ACTIVE'`).
  - Nhật ký kiểm toán bất biến, chỉ ghi thêm (append-only), phân tách quyền hạn ở tầng cơ sở dữ liệu (`PLAN-AUDIT-IMMUTABILITY`).

---

## 4. Đường Cơ Sở Kiến Trúc Đóng Băng (Frozen Architecture Baseline)

### 4.1. Thẩm Quyền Kiến Trúc Cốt Lõi
- **Mô hình Máy chủ Modular Monolith & Tô-pô Lưu trữ Quan hệ:** Thẩm quyền bắt nguồn trực tiếp từ **ADR 0013** ([`docs/adr/0013-backend-runtime-persistence-topology.md`](adr/0013-backend-runtime-persistence-topology.md)) kết hợp cùng **[`docs/ARCHITECTURE.md`](ARCHITECTURE.md)** (triển khai mã nguồn máy chủ tại `apps/api`, duy nhất một deployable boundary, cấm phân tách microservices sớm).
- **Chiến lược REST API Định hướng Hợp đồng (Contract-first REST API):** Thẩm quyền bắt nguồn trực tiếp từ **ADR 0003** ([`docs/adr/0003-contract-first-rest-api.md`](adr/0003-contract-first-rest-api.md)).
- **Kiến trúc Phân tầng Clean Architecture & Phân Rã Facade Chuyển Tiếp:** Thẩm quyền bắt nguồn trực tiếp từ **ADR 0012** ([`docs/adr/0012-clean-architecture-transitional-facade-decomposition.md`](adr/0012-clean-architecture-transitional-facade-decomposition.md)).

### 4.2. Danh Mục 5 Module Logic Chuẩn Tắc (Exact Five Canonical Modules)
Theo [`docs/DOMAIN.md`](DOMAIN.md) và [`docs/ARCHITECTURE.md`](ARCHITECTURE.md#L130-L140), hệ thống gồm đúng 5 Bounded Contexts / Modules logic sau:
1. **`Work Management`** (Core Bounded Context)
2. **`Tree Asset Registry`** (Supporting Bounded Context)
3. **`Policy & Template Governance`** (Supporting Bounded Context)
4. **`Audit & Compliance`** (Supporting Bounded Context)
5. **`Identity & Access Management (IAM)`** (Generic Bounded Context)

### 4.3. Kiểm Kê Danh Mục 13 Quyết Định Kiến Trúc Đã Chấp Thuận (ADR 0001..0013 Inventory)
Được trích xuất chuẩn xác từ các tệp tin thẩm quyền dưới thư mục [`docs/adr/`](adr/):
- **`ADR 0001` ([`docs/adr/0001-monorepo-foundation.md`](adr/0001-monorepo-foundation.md)):** *Monorepo Foundation* — Cấu trúc monorepo quản lý `apps/*`, `packages/*`, `external/*`; hiện trạng công cụ điều phối kho mã nguồn là npm workspaces và npm scripts.
- **`ADR 0002` ([`docs/adr/0002-hermes-agent-submodule.md`](adr/0002-hermes-agent-submodule.md)):** *Hermes Agent As External Submodule* — Quản lý `external/hermes-agent` dưới dạng git submodule độc lập; cấm chỉnh sửa trực tiếp phục vụ sản phẩm.
- **`ADR 0003` ([`docs/adr/0003-contract-first-rest-api.md`](adr/0003-contract-first-rest-api.md)):** *Contract-first REST API* — REST API theo tiếp cận contract-first với hợp đồng TypeScript dùng chung qua `@novyx/contracts` trước khi cài đặt backend.
- **`ADR 0004` ([`docs/adr/0004-shared-ui-tokens.md`](adr/0004-shared-ui-tokens.md)):** *Shared UI Tokens* — Một nguồn chân lý duy nhất cho design tokens (`colors`, `spacing`, `typography`, `radius`) tại `@novyx/ui`.
- **`ADR 0005` ([`docs/adr/0005-admin-client-topology.md`](adr/0005-admin-client-topology.md)):** *Platform Administrator Client Delivery Topology* — Ứng dụng Web quản trị độc lập (`apps/admin-web`), phạm vi giới hạn nghiêm ngặt ở Platform Governance (`CAP-ADM-01..09`, `GV-01..19`) và `OP-22 ViewCareHistory` chỉ đọc; cấm can thiệp tác vụ vận hành hiện trường.
- **`ADR 0006` ([`docs/adr/0006-iam-session-lifecycle.md`](adr/0006-iam-session-lifecycle.md)):** *Identity & Access Management, Session Lifecycle & Role Administration* — Quản lý danh tính, 4 trạng thái tài khoản (`INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`), quản lý phiên máy chủ tự chủ, thu hồi phiên và xoay vòng refresh credentials.
- **`ADR 0007` ([`docs/adr/0007-authorization-enforcement-architecture.md`](adr/0007-authorization-enforcement-architecture.md)):** *Multi-Tier Authorization & Action Eligibility Enforcement Architecture* — Kiến trúc phòng vệ 3 tầng (Tier 1 Client Advisory $\to$ Tier 2 Server Request Gate $\to$ Tier 3 Domain Core Authoritative); công thức Action Eligibility; phân tách trách nhiệm `SoD-02`.
- **`ADR 0008` ([`docs/adr/0008-offline-durable-storage-outbox.md`](adr/0008-offline-durable-storage-outbox.md)):** *Mobile Offline Durable Storage Engine & Outbox Synchronization Architecture* — Lưu trữ ngoại tuyến cục bộ bằng `expo-sqlite`, vùng lưu ảnh sandbox trên đĩa, hàng đợi Outbox bền vững, metadata vận chuyển `Idempotency-Key`; trạng thái cục bộ chỉ mang tính chất đệm ngoại tuyến/advisory.
- **`ADR 0009` ([`docs/adr/0009-concurrency-idempotency-strategy.md`](adr/0009-concurrency-idempotency-strategy.md)):** *Optimistic Concurrency Control & Command Idempotency Strategy* — Kiểm soát đồng thời lạc quan (OCC) qua `expectedVersion: number`, ánh xạ xung đột `409 CONFLICT` (`CONFLICT: STALE_VERSION`), idempotency qua header `Idempotency-Key: <UUIDv4>`; bảo toàn 100% dữ liệu nháp khi có xung đột.
- **`ADR 0010` ([`docs/adr/0010-contracts-runtime-validation-governance-api.md`](adr/0010-contracts-runtime-validation-governance-api.md)):** *Contract Evolution, Runtime Schema Validation & Governance API Extension* — `@novyx/contracts` là biểu diễn kỹ thuật dẫn xuất; Zod kiểm thực runtime payload; phân định Business Command $\neq$ HTTP Route $\neq$ DTO $\neq$ Transport Header.
- **`ADR 0011` ([`docs/adr/0011-audit-trail-persistence-integrity.md`](adr/0011-audit-trail-persistence-integrity.md)):** *Audit Trail Persistence & Tamper-Evident Integrity Architecture* — `AuditEvent` lưu tập trung trên máy chủ, append-only ở cấp database engine; runtime database user chỉ có quyền `INSERT` và `SELECT`, cấm `UPDATE`, `DELETE`, `TRUNCATE`.
- **`ADR 0012` ([`docs/adr/0012-clean-architecture-transitional-facade-decomposition.md`](adr/0012-clean-architecture-transitional-facade-decomposition.md)):** *Clean Architecture Layering & Transitional Facade (`greenOpsService`) Decomposition* — Phân tầng Clean Architecture (Ports & Adapters); phân rã facade `greenOpsService.ts` và `MobileApp.tsx` thành các adapters đơn trách nhiệm; máy chủ giữ thẩm quyền tối cao.
- **`ADR 0013` ([`docs/adr/0013-backend-runtime-persistence-topology.md`](adr/0013-backend-runtime-persistence-topology.md)):** *Backend Runtime & Relational Persistence Topology* — Máy chủ sản xuất có thẩm quyền tại `apps/api`, kiến trúc Modular Monolith gồm 5 Bounded Contexts, cơ sở dữ liệu quan hệ, giao dịch ACID, cấm đột biến SQL chéo context.

---

## 5. Trạng Thái Giai Đoạn 12A (Phase-12A Status)

- **Trạng thái:** `COMPLETE / FROZEN`.
- **Hồ sơ hiện trạng mã nguồn:** [`docs/PHASE12-CURRENT-SOURCE-EVIDENCE.md`](PHASE12-CURRENT-SOURCE-EVIDENCE.md) đã ghi nhận đầy đủ 15 khoảng cách kỹ thuật hiện hữu (`IMP-GAP-001` đến `IMP-GAP-015`).
- **Kế hoạch tổng thể:** [`docs/PHASE12-IMPLEMENTATION-MASTER-PLAN.md`](PHASE12-IMPLEMENTATION-MASTER-PLAN.md) đã cấu trúc chi tiết 9 Đợt triển khai (Wave 0 đến Wave 8).
- **Ma trận truy vết:** [`docs/PHASE12-IMPLEMENTATION-TRACEABILITY.md`](PHASE12-IMPLEMENTATION-TRACEABILITY.md) đã hoàn tất ánh xạ 100% yêu cầu nghiệp vụ, khoảng cách kỹ thuật và kịch bản NFR sang các wave thực thi.

---

## 6. Quyết Định Của Chủ Quản — Đợt 1 (Owner Decision Batch 1)

Ghi nhận chính thức tại [`docs/PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md`](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md):
- **IDB-01 — CSDL Quan hệ Máy chủ:** `PostgreSQL` (Baseline phát triển: 18.x; Sản xuất: Bản phát hành chính thức ổn định được nhà cung cấp hỗ trợ). Trạng thái: `OWNER_APPROVED`.
- **IDB-02 — Web Framework Máy chủ:** `Fastify 5.x` (Đóng vai trò hạ tầng runtime HTTP/routing; Zod và `@novyx/contracts` giữ vai trò thẩm quyền hợp đồng duy nhất). Trạng thái: `OWNER_APPROVED`.
- **IDB-03 — Công cụ Truy cập Dữ liệu / ORM:** `Drizzle ORM + drizzle-kit` (Type-safe SQL schema; kèm cơ chế Raw SQL escape hatch phục vụ phân tách đặc quyền DB và quản lý chỉ mục nâng cao). Trạng thái: `OWNER_APPROVED`.

---

## 7. Quyết Định Của Chủ Quản — Đợt 2 (Owner Decision Batch 2)

Ghi nhận chính thức tại [`docs/PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md`](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md):
- **IDB-04 — Cấu trúc & Định dạng Token Xác thực:** `Opaque Bearer Access Credential + Rotating Opaque Refresh Credential` (Khắc phục triệt để nguy cơ trễ thu hồi token của Stateless JWT; máy chủ xác thực qua bảng phiên). Trạng thái: `OWNER_APPROVED`.
- **IDB-05 — Thuật toán Băm Mật khẩu:** `Argon2id` (Thuật toán an toàn bộ nhớ theo chuẩn OWASP/IETF; benchmark cấu hình trên phần cứng máy chủ đích, hỗ trợ cờ rehash). Trạng thái: `OWNER_APPROVED`.
- **IDB-11 — Hạ tầng Quản lý Phiên:** `PostgreSQL-backed Session Repository` cho MVP (Thiết kế qua Clean Architecture Port `SessionRepository`, cho phép chuyển đổi sang Redis trong tương lai nếu có bằng chứng nghẽn I/O mà không làm sửa đổi logic IAM). Trạng thái: `OWNER_APPROVED`.

---

## 8. Quyết Định Của Chủ Quản — Đợt 3 (Owner Decision Batch 3)

Ghi nhận chính thức tại [`docs/PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md`](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md):
- **IDB-07 — Lưu trữ File Bằng chứng:** `S3-Compatible Object Storage Port` (Giao diện trừu tượng hóa `ObjectStoragePort` tương thích AWS S3 API; hỗ trợ phát triển cục bộ bằng MinIO và triển khai demo/production bằng Cloudflare R2 hoặc các dịch vụ S3 tương thích). Trạng thái: `OWNER_APPROVED`.
- **IDB-06 — Web Quản trị Admin:** `React 19 SPA + Vite` (Xây dựng workspace mới `apps/admin-web`, phục vụ riêng biệt cho Quản trị viên hệ thống Platform Admin, truy cập API máy chủ qua HTTPS, cấm logic tác nghiệp hiện trường). Trạng thái: `OWNER_APPROVED`.
- **Ràng buộc COST-01:** Bổ sung chính sách phân phối với ngân sách $0 / dùng thử miễn phí, ưu tiên tối đa việc tiết kiệm chi phí mà vẫn giữ vững nguyên tắc thay thế nhà cung cấp (`keep providers replaceable`).

---

## 9. Ma Trận Quyết Định Cuối Cùng (Final Decision Matrix)

Toàn bộ 11 quyết định cấp triển khai của Phase 12B đạt trạng thái đóng băng chính thức như sau:

| Mã IDB | Hạng Mục Quyết Định | Phương Án Xác Lập / Trạng Thái | Mức Độ Tin Cậy | Trạng Thái Cuối Cùng | Đợt Phê Duyệt / Biên Bản |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **IDB-01** | CSDL Quan hệ Máy chủ | **PostgreSQL** (Baseline: 18.x, Prod: Supported Stable) | `HIGH` | `OWNER_APPROVED` | Batch 1 |
| **IDB-02** | Web Framework Máy chủ | **Fastify 5.x** (Runtime Infrastructure, Zod Contract Authority) | `HIGH` | `OWNER_APPROVED` | Batch 1 |
| **IDB-03** | Công cụ Truy cập Dữ liệu / ORM | **Drizzle ORM + drizzle-kit** (Kèm Raw SQL escape hatch) | `HIGH` | `OWNER_APPROVED` | Batch 1 |
| **IDB-04** | Cấu trúc Token Xác thực | **Opaque Bearer Access Credential + Rotating Opaque Refresh** | `HIGH` | `OWNER_APPROVED` | Batch 2 |
| **IDB-05** | Thuật toán Băm Mật khẩu | **Argon2id** (Benchmark target hardware, rehash support) | `HIGH` | `OWNER_APPROVED` | Batch 2 |
| **IDB-06** | Web Quản trị Admin | **React 19 SPA + Vite** (apps/admin-web, Platform Admin scope) | `HIGH` | `OWNER_APPROVED` | Batch 3 |
| **IDB-07** | Lưu trữ File Bằng chứng | **S3-Compatible Object Storage Port** (Provider-neutral abstraction) | `HIGH` | `OWNER_APPROVED` | Batch 3 |
| **IDB-08** | Đóng gói & Triển khai Hạ tầng | **Ranh giới hoãn kiểm soát** (Ứng viên: Linux VM / Docker Compose / PaaS) | `HIGH` | `DEFERRED_WITH_BOUNDARY` | Final Freeze |
| **IDB-09** | Cấu hình TTL Idempotency | **Ranh giới hoãn kiểm soát** (Cơ sở ứng viên: 72h; cấu hình qua env) | `HIGH` | `DEFERRED_WITH_BOUNDARY` | Final Freeze |
| **IDB-10** | Dọn dẹp Ảnh Bằng chứng Mobile | **Ranh giới hoãn kiểm soát** (Cơ sở ứng viên: 14d/300MB; Safety floor) | `MEDIUM` | `DEFERRED_WITH_BOUNDARY` | Final Freeze |
| **IDB-11** | Quản lý Phiên Máy chủ | **PostgreSQL-backed Session Repository cho MVP** | `HIGH` | `OWNER_APPROVED` | Batch 2 |

### Thống Kê Tổng Hợp Quyết Định:
- **`OWNER_APPROVED`:** **8** (IDB-01, IDB-02, IDB-03, IDB-04, IDB-05, IDB-06, IDB-07, IDB-11)
- **`DEFERRED_WITH_BOUNDARY`:** **3** (IDB-08, IDB-09, IDB-10)
- **`OPEN`:** **0** (Không còn bất kỳ quyết định mở không kiểm soát nào)
- **`REJECTED`:** **0**

---

## 10. Ranh Giới Các Quyết Định Hoãn (Deferred Decision Boundaries)

Ba quyết định `IDB-08`, `IDB-09`, `IDB-10` được hoãn một cách có chủ đích và không gây cản trở các Đợt triển khai Waves 0–6 nhờ các ranh giới kiểm soát đóng băng sau:

### 10.1. IDB-08: Đóng Gói & Triển Khai Hạ Tầng (Deployment / Hosting)
- **Lý do hoãn:** Quyết định nền tảng hạ tầng cụ thể không cản trở thiết kế kiến trúc mã nguồn, hợp đồng API hay việc cài đặt mã nguồn các Wave 0–6.
- **Cổng phê duyệt muộn nhất:** Phải được giải quyết dứt điểm trước khi đóng gói sản xuất / phát hành Wave 8 (Production Release).
- **Ranh giới bất biến trong thời gian hoãn:**
  - Áp dụng nguyên tắc `COST-01`: Ưu tiên gói miễn phí / dùng thử / chi phí $0 khi đáp ứng yêu cầu kỹ thuật.
  - **Duy trì tính trung lập nhà cung cấp (Vendor-Neutral):** Không khóa chặt vào Render, Railway, AWS, Docker Compose hay Linux VM. Mọi cấu hình phải dễ dàng thay thế (`keep providers replaceable`).
  - Hạ tầng bắt buộc hỗ trợ đầy đủ tô-pô 4 thành phần đã chấp thuận: `apps/api` (Node.js), `PostgreSQL`, `apps/admin-web` (Static Web), và Lưu trữ đối tượng tương thích S3.
  - Bắt buộc mã hóa toàn trình qua HTTPS/TLS.
  - Toàn bộ thông tin cấu hình môi trường và bí mật (secrets) phải được tách biệt bên ngoài mã nguồn (`externalized config`).
  - Backend máy chủ duy nhất giữ thẩm quyền nghiệp vụ tối cao; cấm tạo nguồn chân lý kép.
  - Bắt buộc có quy trình sao lưu/xuất dữ liệu trước khi sử dụng hạ tầng dùng thử có thời hạn; việc hết hạn dùng thử tuyệt đối không được gây mất mát dữ liệu nghiệp vụ, nhật ký kiểm toán hay thông tin người dùng.

### 10.2. IDB-09: Thời Gian Lưu Vết Chống Trùng Lặp (Idempotency Retention)
- **Lý do hoãn:** Giá trị số học chính xác về thời gian lưu vết (TTL) cần được căn cứ trên số liệu đo đạc thực tế về hành vi thử lại ngoại tuyến (offline retry) của công nhân hiện trường.
- **Cổng phê duyệt muộn nhất:** Phải được giải quyết trước khi nghiệm thu sản xuất cơ chế ngoại tuyến / idempotency.
- **Bất biến đóng băng trong thời gian hoãn:**
  $$\text{Server Idempotency Retention} \ge \text{Maximum Legitimate Offline Retry Horizon Supported by Product}$$
- **Ranh giới lập trình mã nguồn:**
  - Cơ chế lưu trữ idempotency trên máy chủ phải được thiết kế: **cấu hình được qua biến môi trường (configurable)**, **quan sát được qua log/metric (observable)**, và **kiểm thử tự động được (testable)**.
  - Giá trị **72 giờ** chỉ đóng vai trò là **Cơ Sở Ứng Viên (`CANDIDATE_BASELINE`)**, tuyệt đối không được mã hóa cứng (hard-code) như một hằng số bất biến của nghiệp vụ.
  - Các bài kiểm thử mã nguồn phải xác nhận: các yêu cầu gửi cùng một `Idempotency-Key` trong cửa sổ lưu vết không bị nhân bản đột biến; quy trình dọn dẹp bản ghi cũ không vi phạm khung thời gian thử lại tối đa được cấu hình.

### 10.3. IDB-10: Dọn Dẹp File Bằng Chứng Cục Bộ Trên Thiết Bị Di Động (Mobile Evidence GC)
- **Lý do hoãn:** Ngưỡng dung lượng và thời gian dọn dẹp tối ưu phụ thuộc vào dung lượng bộ nhớ thực tế của các dòng điện thoại Android hiện trường và kích thước ảnh chụp thực tế.
- **Cổng phê duyệt muộn nhất:** Phải được giải quyết trước đợt rollout thực địa sản xuất / nghiệm thu cuối Wave 5.
- **Sàn An Toàn Tuyệt Đối (Non-Negotiable Safety Floor):**
  Một tệp bằng chứng cục bộ trên thiết bị di động **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP XÓA** khi:
  1. Đang được tham chiếu bởi một phần tử Outbox đang chờ gửi (`pending Outbox item`).
  2. Vẫn đang cần thiết cho các chu trình gửi lại (`offline retry`).
  3. Quá trình tải lên hoặc nghiệm thu nghiệp vụ chưa nhận được xác nhận bền vững từ máy chủ (`durable server acknowledgement`).
  4. Quá trình đối soát xung đột hoặc xử lý lỗi đồng bộ vẫn đang đòi hỏi tệp bằng chứng cục bộ để đối chiếu.
  5. Hành động xóa có thể dẫn đến vi phạm kịch bản chất lượng `QAS-OFFLINE-01` hoặc `QAS-OFFLINE-02`.
- **Ranh giới chính sách:** Các giá trị **14 ngày**, **300 MB**, hay **100 tác vụ Outbox** chỉ đóng vai trò **Cơ Sở Ứng Viên Cần Đo Đạc Thực Địa (`CANDIDATE_BASELINE / NEEDS_FIELD_MEASUREMENT`)**, không phải bất biến nghiệp vụ. Trạng thái `COMPLETED` của tác vụ là điều kiện cần nhưng không phải là chính sách số học cố định. Nguyên tắc tối thượng là: **KHÔNG ĐƯỢC MẤT BẰNG CHỨNG CẦN CHO VIỆC NỘP, THỬ LẠI VÀ ĐỐI SOÁT BỀN VỮNG**.

---

## 11. Ràng Buộc Chi Phí Bằng Không (COST-01 Constraint)

1. **Ưu Tiên Chi Phí Bằng Không / Gói Dùng Thử:**
   Dự án cam kết ưu tiên tối đa các giải pháp miễn phí hoặc dùng thử (free tier / free trial ~1 tháng / free credits) trong các giai đoạn phát triển và chạy thử nghiệm ban đầu. Tuyệt đối không yêu cầu hạ tầng trả phí khi đã có phương án thay thế miễn phí khả thi về mặt kỹ thuật.
2. **Nguyên Tắc Trung Lập Nhà Cung Cấp:**
   Mọi nhà cung cấp (Render, Railway, Cloudflare R2, MinIO, Docker Compose trên VM) chỉ là ứng viên triển khai (`deployment candidates`), tuyệt đối không trở thành thẩm quyền kiến trúc. Mã nguồn ứng dụng chỉ phụ thuộc vào các Clean Architecture Ports (ví dụ: `ObjectStoragePort`, `SessionRepository`), không phụ thuộc trực tiếp vào vendor SDK nội bộ.
3. **Giới Hạn Của Gói Miễn Phí Không Được Tha Hóa Kiến Trúc:**
   - Cấm lưu trực tiếp file ảnh nhị phân vào cơ sở dữ liệu PostgreSQL chỉ để lách hạn ngạch object storage.
   - Cấm gỡ bỏ máy chủ có thẩm quyền tối cao chỉ vì backend miễn phí tự động rơi vào trạng thái "ngủ" (cold start).
   - Cấm tạo nguồn chân lý kép ngoài luồng chỉ vì một dịch vụ dùng thử hết hạn.
4. **Cảnh Báo Thông Tin Nhà Cung Cấp Có Tính Thời Điểm (Time-Sensitive Provider Information):**
   Các thông số hạn ngạch nhà cung cấp (như "10 GB", "miễn phí băng thông tải về", "$5 trial") là thông tin vận hành có tính thời điểm, có thể thay đổi bất cứ lúc nào theo chính sách của bên thứ ba. Chúng được gắn nhãn minh thị `[TIME-SENSITIVE PROVIDER INFORMATION — CHECK AGAIN BEFORE DEPLOYMENT]` và không trở thành bất biến kiến trúc đóng băng.
5. **An Toàn Khi Hết Hạn Dùng Thử:**
   Trước khi đưa dữ liệu vào bất kỳ dịch vụ dùng thử nào, bắt buộc phải có quy trình trích xuất, sao lưu và di chuyển dữ liệu độc lập để đảm bảo không xảy ra mất mát dữ liệu do hết hạn dùng thử.

---

## 12. Thứ Tự Phụ Thuộc Thực Thi (Implementation Dependency Order)

Tiến trình thực thi được cấu trúc theo đồ thị có hướng nghiêm ngặt (Strict Directed Acyclic Graph — DAG). Không có đợt triển khai nào được phép thực hiện song song nếu vi phạm các phụ thuộc tiên quyết:

```
Wave 0: Nền Tảng Kiểm Thử, Chất Lượng & Quản Trị Thực Thi
   │
   ▼
Wave 1: Hợp Đồng Chuẩn Tắc (@novyx/contracts)
   │
   ▼
Wave 2: Nền Tảng Backend & Lưu Trữ Quan Hệ (apps/api Foundation & Drizzle Migrations)
   │
   ▼
Wave 3: IAM, Cổng Xác Thực Tier 2 & Nhật Ký Kiểm Toán Bất Biến (apps/api IAM & Audit)
   │
   ▼
Wave 4: Các Module Nghiệp Vụ Tác Nghiệp & APIs (apps/api Work, Tree, Policy, S3 Port)
   │
   ▼
Wave 5: Tích Hợp Di Động, Ngoại Tuyến & Durable Outbox (apps/mobile)
   │
   ▼
Wave 6: Cổng Quản Trị Hệ Thống Web (apps/admin-web)
   │
   ▼
Wave 7: Thu Hồi & Dọn Dẹp Mã Nguồn Cũ (Legacy Retirement)
   │
   ▼
Wave 8: Làm Cứng NFR & Đóng Gói Sản Xuất (Hardening & Release)
```

---

## 13. Ranh Giới Ủy Quyền Wave 0 (Wave 0 Authorization Boundary)

Sau khi Phase 12B đóng băng thành công, **DUY NHẤT** giai đoạn tiếp theo được phép kích hoạt là:
$$\mathbf{PHASE\ 13\ /\ IMPLEMENTATION\ WAVE\ 0}$$

### Mục Tiêu Cốt Tử Của Wave 0:
Thiết lập **Nền Tảng Kiểm Thử, Chất Lượng & Quản Trị Thực Thi (Test / Quality / Execution Governance Foundation)** để làm lưới an toàn đo lường trước khi bất kỳ hợp đồng nghiệp vụ hay dòng code backend nào được thay đổi.

### Các Hạng Mục Dự Kiến Trong Wave 0:
- Thiết lập công cụ chạy kiểm thử tự động toàn dự án (`vitest`).
- Cấu hình lệnh kiểm thử gốc tại root (`npm test`).
- Thiết lập kiểm tra ranh giới nhập khẩu kiến trúc (`architecture/import boundary tests`) nhằm ngăn chặn việc vi phạm phụ thuộc giữa các package/module.
- Thiết lập đường cơ sở hồi quy (`regression baseline`) cho mã nguồn hiện hữu.
- Xây dựng các bài kiểm thử ngữ nghĩa đóng băng dựa trên các fixtures chuẩn tắc (7 task states, 4 review decisions, 3 proof profiles).
- Chuẩn hóa các quy ước thu thập bằng chứng chất lượng thực nghiệm (`quality evidence conventions`).

**Lưu ý cốt tử:** Toàn bộ việc triển khai cụ thể của Wave 0 sẽ được hướng dẫn và kích hoạt độc lập trong yêu cầu Phase 13 riêng biệt. **TUYỆT ĐỐI KHÔNG TRIỂN KHAI WAVE 0 TRONG GIAI ĐOẠN 12B NÀY.**

---

## 14. Các Wave Chưa Được Phép Thực Thi (Waves Not Yet Authorized)

- **Các đợt triển khai từ Wave 1 đến Wave 8:** Tuyệt đối **CHƯA ĐƯỢC PHÉP KHỞI ĐỘNG**.
- **Quy tắc cổng độc lập:** Wave 1 chỉ được xem xét kích hoạt khi và chỉ khi Wave 0 đã hoàn tất 100%, vượt qua toàn bộ các cổng kiểm soát nghiệm thu đầu ra của Wave 0, và được kiểm chứng độc lập.
- Tương tự, mỗi wave tiếp theo đều đòi hỏi một chu trình phê duyệt và nghiệm thu cổng độc lập trước khi chuyển giao.

---

## 15. Rủi Ro Đường Cơ Sở Mã Nguồn Hiện Hữu (Source Baseline Risks)

Báo cáo sẵn sàng thực thi tái khẳng định việc nhận diện đầy đủ 15 khoảng cách kỹ thuật cốt tử trong mã nguồn hiện trạng (`AS-IS`) đã được xác minh thực nghiệm tại [`docs/PHASE12-CURRENT-SOURCE-EVIDENCE.md`](PHASE12-CURRENT-SOURCE-EVIDENCE.md):

1. **`IMP-GAP-001` (Ép vai trò Quản trị viên sai lệch trên mobile):** `apps/mobile/src/screens/MobileApp.tsx:398`, `LoginScreen.tsx:41, 117` ép chuỗi `admin` thành `'Manager'`; type `Role` chỉ có `'Staff' | 'Manager'`, vi phạm nguyên tắc SoD `PLAN-SOD-ADMIN`.
2. **`IMP-GAP-002` (Điều hướng nhị phân hai nhánh):** `apps/mobile/src/screens/MobileApp.tsx:274, 276` phân nhánh dựa trên cờ nhị phân `isStaff = role === 'Staff'`, tài khoản khác mặc định bị đưa vào không gian Manager.
3. **`IMP-GAP-003` (Hợp đồng TaskStatus thiếu trạng thái chuẩn tắc):** `packages/contracts/src/index.ts:54-62` hiện chỉ định nghĩa 5 trạng thái PascalCase (`Pending`, `In_Progress`, `Waiting_Review`, `Completed`, `Rework_Required`); thiếu hoàn toàn 2 trạng thái chuẩn tắc đã đóng băng: `BLOCKED` và `CANCELLED`.
4. **`IMP-GAP-004` (Thiếu vắng / sai lệch hợp đồng ProofProfile và ReviewDecision):** `packages/contracts/src/index.ts:71` hoàn toàn không có `ProofProfile` (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`); `ReviewDecision` chỉ có 2 giá trị `'approve' | 'request_rework'`, thiếu `APPROVE_WITH_EXCEPTION` và `CANCEL`, chưa chuẩn hóa sang SCREAMING_SNAKE_CASE.
5. **`IMP-GAP-005` (Tạo task thiếu rào chắn thẩm quyền vai trò/tài nguyên):** `scripts/greenops-dev-api.cjs:407-430`, `greenOpsService.ts:418, 806` không kiểm tra vai trò Manager, tự động fallback tree/staff.
6. **`IMP-GAP-006` (Bảo vệ danh sách task chỉ tồn tại ở client UI):** `scripts/greenops-dev-api.cjs:397-404` endpoint `GET /v1/tasks` công khai, không kiểm tra actor token.
7. **`IMP-GAP-007` (Rủi ro mất dữ liệu do lưu snapshot trong RAM tiến trình):** `apps/mobile/src/services/greenOpsService.ts:354`, `greenops-dev-api.cjs:234` lưu dữ liệu trong biến RAM tiến trình (`let snapshot`, `let tasks`), mất trắng khi OS kill app hoặc khởi động lại.
8. **`IMP-GAP-008` (Hoàn toàn chưa có hàng đợi Outbox bền vững trên mobile):** Toàn bộ mã nguồn `apps/mobile/src/` chưa có bảng lưu trữ outbox trên SQLite; không có hàng đợi thử lại nền an toàn (`QAS-OFFLINE-01`, `QAS-OFFLINE-02`).
9. **`IMP-GAP-009` (Chưa có máy chủ mục tiêu apps/api sản xuất có thẩm quyền):** Cấu trúc thư mục root hiện chỉ có `apps/mobile`; chưa có thư mục mã nguồn backend Modular Monolith chuẩn Node.js / TypeScript theo ADR 0013.
10. **`IMP-GAP-010` (Chưa có Cổng Quản trị Web độc lập apps/admin-web):** Cấu trúc thư mục root chưa có workspace Web quản trị độc lập cho Platform Administrator theo ADR 0005.
11. **`IMP-GAP-011` (Chưa có kho lưu trữ kiểm toán bất biến phân tách quyền):** Toàn bộ repo chưa có bảng lưu trữ `AuditEvent`, chưa có phân tách đặc quyền DB runtime (`INSERT`/`SELECT` only) theo ADR 0011.
12. **`IMP-GAP-012` (Thiếu khóa kiểm soát đồng thời lạc quan OCC):** `packages/contracts/src/index.ts:128-151`, `greenops-dev-api.cjs` DTOs và mutations không có trường `version` / `expectedVersion`; không có mã lỗi `409 STALE_VERSION` theo ADR 0009.
13. **`IMP-GAP-013` (Thiếu hỗ trợ Header Idempotency-Key vận chuyển):** `packages/contracts`, `apps/mobile/src/services/greenOpsService.ts` chưa hỗ trợ Header `Idempotency-Key` trên client và chưa có bảng lưu vết idempotency ở server theo ADR 0009.
14. **`IMP-GAP-014` (greenOpsService ôm đồm quá nhiều trách nhiệm / Khoảng cách Clean Architecture):** `apps/mobile/src/services/greenOpsService.ts:1-856` 856 dòng đảm nhận 10 trách nhiệm khác nhau, cần phân rã theo ADR 0012.
15. **`IMP-GAP-015` (Rò rỉ logic chuyển đổi trạng thái / quy trình nghiệp vụ vào UI):** `mobileWorkflow.ts:146-153`, `MobileApp.tsx`, `StaffProofFlow.tsx` mã hóa cứng quy trình 5 bước cũ trong UI, tự tính toán bước kế tiếp thay vì dùng Domain Engine.

*Ghi chú định hướng:* Những khoảng cách trên là **lý do căn bản để tiến hành thực thi kế hoạch theo từng đợt**, tuyệt đối **không phải lý do để mở lại hay tranh cãi về mặt kiến trúc**.

---

## 16. Chiến Lược Kiểm Chứng (Verification Strategy)

Quá trình thực thi các Wave sẽ được bảo vệ bởi chiến lược kiểm chứng đa tầng, bảo đảm tính xác thực thực nghiệm:
1. **Kiểm tra kiểu tĩnh & Linting:**
   - `npm run typecheck` trên toàn bộ các workspace trong monorepo.
   - `npm run lint` và `npm run format:check` đảm bảo không có vi phạm định dạng mã nguồn.
   - Tuyệt đối cấm hạ thấp độ nghiêm ngặt của TypeScript (`strict: true`) hoặc tắt cảnh báo linter để làm biến mất lỗi.
2. **Kiểm thử hợp đồng & lược đồ (Contract / Schema Tests):**
   - Sử dụng Zod schema trong `@novyx/contracts` để xác thực toàn bộ payload vào/ra, header idempotency, và cấu trúc DTOs.
3. **Kiểm thử vòng đời tác vụ chuẩn tắc (Canonical Lifecycle Tests):**
   - Kiểm thử tự động chuyển trạng thái máy trạng thái hữu hạn qua 7 trạng thái chuẩn tắc và 4 kết luận thẩm định.
4. **Kiểm thử phân quyền & điều kiện hành động (Authorization Tests):**
   - Kiểm tra rào chắn phân quyền 3 tầng, quy tắc SoD-02, và chặn vai trò Admin can thiệp tác vụ hiện trường.
5. **Kiểm thử ranh giới kiến trúc (Architecture-Boundary Tests):**
   - Tự động phát hiện và chặn các vi phạm import trái phép giữa các module và workspace (ví dụ: cấm module đột biến SQL chéo Bounded Context).
6. **Kiểm thử ngoại tuyến & hàng đợi bền vững (Offline / Outbox Tests):**
   - Kiểm thử hành vi Outbox của ứng dụng di động dưới điều kiện mất mạng hoàn toàn, OS kill tiến trình ngầm, và khôi phục khi có mạng trở lại.
7. **Bằng chứng thực nghiệm NFR (NFR Empirical Evidence):**
   - Thu thập bằng chứng đo lường thực tế (benchmark phần cứng cho Argon2id, FPS hiển thị danh sách, thời gian khôi phục state) có log chạy thực tế và exit code 0.

---

## 17. Các Khẳng Định Phủ Định & Khẳng Định Khẳng Định (Negative & Positive Assertions)

### 17.1. Các Khẳng Định Phủ Định Nhắm Mục Tiêu (Targeted Negative Assertions — All Must Be FALSE)
Toàn bộ 15 khẳng định dưới đây đã được đối soát và đánh giá chính thức là **FALSE**:
- **P12BFC-N01:** `DRAFT` là một trạng thái thuộc `TaskStatus` chuẩn tắc. $\rightarrow$ **FALSE** (Chỉ là khái niệm lưu nháp cục bộ, không thuộc enum TaskStatus).
- **P12BFC-N02:** `ASSIGNED` là một trạng thái thuộc `TaskStatus` chuẩn tắc. $\rightarrow$ **FALSE** (Task khởi tạo ở trạng thái `PENDING`).
- **P12BFC-N03:** `SUBMITTED` là một trạng thái thuộc `TaskStatus` chuẩn tắc. $\rightarrow$ **FALSE** (Task nộp bằng chứng chuyển sang `WAITING_REVIEW`).
- **P12BFC-N04:** `WAITING_REVIEW` vắng mặt trong `TaskStatus` chuẩn tắc. $\rightarrow$ **FALSE** (`WAITING_REVIEW` là trạng thái chuẩn tắc cốt lõi).
- **P12BFC-N05:** ADR 0003 là quyết định về Modular Monolith. $\rightarrow$ **FALSE** (ADR 0003 là `Contract-first REST API`; Modular Monolith thuộc ADR 0013).
- **P12BFC-N06:** ADR 0012 là quyết định về Task State Machine. $\rightarrow$ **FALSE** (ADR 0012 là `Clean Architecture Transitional Facade Decomposition`).
- **P12BFC-N07:** ADR 0013 đơn thuần chỉ là quyết định về chuyển đổi Strangler Fig. $\rightarrow$ **FALSE** (ADR 0013 là `Backend Runtime & Relational Persistence Topology` xác lập Modular Monolith và CSDL quan hệ).
- **P12BFC-N08:** Commit `8735332` là commit đóng băng đường cơ sở triển khai Phase 12A. $\rightarrow$ **FALSE** (`8735332` là `docs(architecture): close phase 11C derived-view drift`).
- **P12BFC-N09:** Commit `9df1b29` là commit đóng băng kiến trúc Phase 11. $\rightarrow$ **FALSE** (`9df1b29` là `docs(implementation): finalize phase 12A owner review plan`).
- **P12BFC-N10:** 49 truy vấn chuẩn tắc được đóng băng bởi văn bản thẩm quyền. $\rightarrow$ **FALSE** (Không có tài liệu thẩm quyền nào đóng băng số lượng 49 truy vấn).
- **P12BFC-N11:** 14 thực thể miền nghiệp vụ được đóng băng bởi văn bản thẩm quyền. $\rightarrow$ **FALSE** (Không có tài liệu thẩm quyền nào áp đặt số lượng 14 thực thể).
- **P12BFC-N12:** `IMP-GAP-009` là khoảng cách về kiểm soát đồng thời OCC. $\rightarrow$ **FALSE** (`IMP-GAP-009` là khoảng cách thiếu vắng backend `apps/api`; OCC là `IMP-GAP-012`).
- **P12BFC-N13:** `IMP-GAP-014` là khoảng cách về cơ chế Idempotency. $\rightarrow$ **FALSE** (`IMP-GAP-014` là khoảng cách ôm đồm trách nhiệm của `greenOpsService`; Idempotency là `IMP-GAP-013`).
- **P12BFC-N14:** Hợp đồng mã nguồn hiện trạng được xác nhận là thiếu `REWORK_REQUIRED`. $\rightarrow$ **FALSE** (`REWORK_REQUIRED` đã có trong contracts; 2 trạng thái thiếu là `BLOCKED` và `CANCELLED`).
- **P12BFC-N15:** Wave 0 đã được triển khai mã nguồn trong giai đoạn này. $\rightarrow$ **FALSE** (Tuyệt đối chưa triển khai mã nguồn nào; Wave 0 chỉ được kích hoạt trong Phase 13).

### 17.2. Các Khẳng Định Khẳng Định (Targeted Positive Assertions — All Must Be TRUE)
Toàn bộ 10 khẳng định dưới đây đã được xác nhận là **TRUE**:
- **P12BFC-P01:** `TaskStatus` chính xác là 7 trạng thái: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`. $\rightarrow$ **TRUE**.
- **P12BFC-P02:** `ReviewDecision` chính xác là 4 kết luận: `APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL`. $\rightarrow$ **TRUE**.
- **P12BFC-P03:** `ProofProfile` chính xác là 3 hồ sơ: `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`. $\rightarrow$ **TRUE**.
- **P12BFC-P04:** ADR 0003 là `Contract-first REST API`. $\rightarrow$ **TRUE**.
- **P12BFC-P05:** ADR 0012 là `Clean Architecture Layering & Transitional Facade (greenOpsService) Decomposition`. $\rightarrow$ **TRUE**.
- **P12BFC-P06:** ADR 0013 là `Backend Runtime & Relational Persistence Topology` định hướng Modular Monolith. $\rightarrow$ **TRUE**.
- **P12BFC-P07:** `IMP-GAP-012` là khoảng cách thiếu OCC / version / expectedVersion. $\rightarrow$ **TRUE**.
- **P12BFC-P08:** `IMP-GAP-013` là khoảng cách thiếu Header Idempotency-Key. $\rightarrow$ **TRUE**.
- **P12BFC-P09:** Trạng thái các quyết định Chủ quản giữ nguyên vẹn đúng 8/3/0/0. $\rightarrow$ **TRUE**.
- **P12BFC-P10:** Duy nhất Wave 0 đủ điều kiện kích hoạt tiếp theo. $\rightarrow$ **TRUE**.

### 17.3. Các Khẳng Định Phủ Định Giai Đoạn 12B (Phase 12B Final Freeze Negative Assertions — All Must Be FALSE)
- **P12BF-N01:** IDB-08 đã được Chủ quản phê duyệt chính thức (`OWNER_APPROVED`). $\rightarrow$ **FALSE** (`DEFERRED_WITH_BOUNDARY`).
- **P12BF-N02:** IDB-09 đã được Chủ quản phê duyệt chính thức (`OWNER_APPROVED`). $\rightarrow$ **FALSE** (`DEFERRED_WITH_BOUNDARY`).
- **P12BF-N03:** IDB-10 đã được Chủ quản phê duyệt chính thức (`OWNER_APPROVED`). $\rightarrow$ **FALSE** (`DEFERRED_WITH_BOUNDARY`).
- **P12BF-N04:** IDB-08 vẫn đang ở trạng thái mở không kiểm soát (`OPEN`). $\rightarrow$ **FALSE** (`DEFERRED_WITH_BOUNDARY`).
- **P12BF-N05:** Giá trị 72 giờ là hằng số bất biến đóng băng của nghiệp vụ đối với thời gian lưu vết idempotency. $\rightarrow$ **FALSE** (`CANDIDATE_BASELINE`).
- **P12BF-N06:** Giá trị 14 ngày hoặc 300 MB là chính sách dọn dẹp file di động đóng băng vĩnh viễn. $\rightarrow$ **FALSE** (`CANDIDATE_BASELINE`).
- **P12BF-N07:** Render là thẩm quyền kiến trúc bắt buộc của hệ thống. $\rightarrow$ **FALSE** (Ứng viên triển khai phi ràng buộc).
- **P12BF-N08:** Cloudflare R2 là thẩm quyền kiến trúc bắt buộc của hệ thống. $\rightarrow$ **FALSE** (Chỉ phụ thuộc vào chuẩn S3 Port).
- **P12BF-N09:** Railway là thẩm quyền kiến trúc bắt buộc của hệ thống. $\rightarrow$ **FALSE** (Ứng viên triển khai phi ràng buộc).
- **P12BF-N10:** Các con số hạn ngạch miễn phí của nhà cung cấp là bất biến vĩnh viễn của kiến trúc. $\rightarrow$ **FALSE** (Thông tin có tính thời điểm).
- **P12BF-N11:** Việc đóng băng Phase 12B đồng nghĩa với việc toàn bộ các Wave 0 đến 8 đều được phép bắt đầu đồng loạt. $\rightarrow$ **FALSE** (Wave-gated execution).
- **P12BF-N12:** Wave 1 có thể bắt đầu trước khi Wave 0 hoàn tất và được nghiệm thu độc lập. $\rightarrow$ **FALSE** (Wave 1 phụ thuộc nghiệm thu Wave 0).
- **P12BF-N13:** Các quyết định hoãn được phép vi phạm các ranh giới đã được đóng băng trong ADR và NFR. $\rightarrow$ **FALSE** (Bảo toàn ranh giới ADR/NFR).
- **P12BF-N14:** Bằng chứng cục bộ trên di động có thể bị xóa trong khi vẫn đang chờ trong Outbox hoặc cần để gửi lại. $\rightarrow$ **FALSE** (Sàn an toàn cấm xóa).
- **P12BF-N15:** Có bất kỳ sửa đổi mã nguồn ứng dụng nào đã diễn ra trong Phase 12B. $\rightarrow$ **FALSE** (0 tệp mã nguồn thay đổi).

---

## 18. Đánh Giá Cổng Sẵn Sàng Cuối Cùng (Final Readiness Gates — P12BF-G01..12)

Toàn bộ 12 Cổng Kiểm soát Sẵn sàng Thực thi Phase 12B đều đạt trạng thái **PASS**:

| Mã Cổng | Tiêu Chí Kiểm Soát Sẵn Sàng Thực Thi | Kết Quả Đánh Giá | Trạng Thái |
| :---: | :--- | :--- | :---: |
| **P12BF-G01** | Có đúng 8 quyết định cấp triển khai được Chủ quản phê duyệt chính thức (`OWNER_APPROVED`). | IDB-01, IDB-02, IDB-03, IDB-04, IDB-05, IDB-06, IDB-07, IDB-11 đều có biên bản phê duyệt chính thức. | **PASS** |
| **P12BF-G02** | Có đúng 3 quyết định cấp triển khai được hoãn chính thức có ranh giới kiểm soát (`DEFERRED_WITH_BOUNDARY`). | IDB-08, IDB-09, IDB-10 được xác lập ranh giới bảo vệ chi tiết và tiêu chí nghiệm thu rõ ràng. | **PASS** |
| **P12BF-G03** | Không còn bất kỳ quyết định mở (`OPEN`) nào chưa được xử lý trong sổ đăng ký. | Số lượng quyết định trạng thái `OPEN` = 0. | **PASS** |
| **P12BF-G04** | Không có quyết định nào bị bác bỏ (`REJECTED`). | Số lượng quyết định trạng thái `REJECTED` = 0. | **PASS** |
| **P12BF-G05** | Toàn bộ các quyết định chặn việc khởi động kỹ thuật các Waves 1–6 đã được giải tỏa triệt để. | CSDL, framework, ORM, Auth tokens, Hash, Session, Web framework, Object storage đều đã chốt. | **PASS** |
| **P12BF-G06** | Các quyết định hoãn có cổng phê duyệt muộn nhất được xác định rõ ràng. | IDB-08 (trước Wave 8 release), IDB-09 (trước offline acceptance), IDB-10 (trước Wave 5 final). | **PASS** |
| **P12BF-G07** | Ràng buộc COST-01 bảo toàn tuyệt đối tính trung lập nhà cung cấp. | Không có vendor độc quyền nào trở thành thẩm quyền kiến trúc; Clean Architecture Port được duy trì. | **PASS** |
| **P12BF-G08** | Không có hạn ngạch nhà cung cấp có tính thời điểm nào trở thành bất biến kiến trúc. | Toàn bộ hạn ngạch được dán nhãn `[TIME-SENSITIVE PROVIDER INFORMATION]` hoặc loại bỏ khỏi sổ đăng ký. | **PASS** |
| **P12BF-G09** | Tuyệt đối không có thay đổi mã nguồn trong giai đoạn này. | `git diff` trên `apps/**`, `packages/**`, `scripts/**`, `external/**` trả về đúng 0 dòng thay đổi. | **PASS** |
| **P12BF-G10** | Không có thay đổi nào xâm phạm vào các tài liệu nghiệp vụ hoặc kiến trúc đã đóng băng. | `PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `ARCHITECTURE.md`, `adr/**` giữ nguyên. | **PASS** |
| **P12BF-G11** | Tiến trình thực thi được phân chia nghiêm ngặt theo cổng (wave-gated). | DAG thứ tự phụ thuộc từ Wave 0 đến Wave 8 được xác lập và khóa chặt; cấm thực thi đồng loạt. | **PASS** |
| **P12BF-G12** | Duy nhất Wave 0 được phép kích hoạt trong giai đoạn tiếp theo. | Wave 0 là bước kế tiếp duy nhất; Wave 1 và các wave sau tiếp tục bị khóa cho đến khi có nghiệm thu riêng. | **PASS** |

---

## 19. Trạng Thái Cuối Cùng (Final Status)

```text
PHASE 12B COMPLETE — EXECUTION READY & FROZEN
— CANONICAL BUSINESS BASELINE RECONCILED
— ADR INVENTORY RECONCILED
— GIT HISTORY RECONCILED
— FIVE MODULE NAMES RECONCILED
— SOURCE GAP IDS RECONCILED
— UNSUPPORTED COUNTS REMOVED
— 8 OWNER_APPROVED
— 3 DEFERRED_WITH_BOUNDARY
— 0 OPEN
— 0 REJECTED
— NO SOURCE IMPLEMENTATION
— ONLY WAVE 0 IS ELIGIBLE NEXT
— READY FOR INDEPENDENT VERIFICATION
```
