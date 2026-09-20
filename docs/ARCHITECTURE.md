# NOVYX GreenOps — System Architecture & Technical Decomposition

> **Trạng thái Thẩm quyền:** TARGET TECHNICAL ARCHITECTURE — ACCEPTED ADR BASELINE — DOCUMENTED DERIVATION OF ADR 0001..0013
> **Quy tắc Thẩm quyền:** Tài liệu này là văn bản chuẩn mực kỹ thuật hợp nhất (`Canonical Consolidated Technical Architecture Document`). Các quyết định kiến trúc đã được Chủ quản phê duyệt chính thức tại [`docs/adr/`](adr/) (`ADR 0001`..`0013`) là nguồn lịch sử quyết định tối cao. Nếu có sự khác biệt giữa tài liệu này và ADR đã được chấp thuận, quyết định tại ADR luôn luôn chiến thắng (`ADR wins`) cho đến khi tài liệu kiến trúc được đối soát và hiệu chỉnh. Mọi biểu đồ tại [`docs/diagrams/`](diagrams/) là góc nhìn dẫn xuất (`derived view`), không có thẩm quyền tạo ra quyết định kỹ thuật hay định nghĩa nghiệp vụ mới.

---

## 1. Ma trận Trạng thái Quyết định Kiến trúc (Architecture Status Matrix)

Bảng dưới đây tổng hợp trạng thái của toàn bộ 13 Quyết định Kiến trúc Kỹ thuật (`ADR 0001`..`0013`) đã được chấp thuận chính thức, phân định rõ giữa **Quyết định đã duyệt (Accepted Decision)** và **Hiện trạng triển khai mã nguồn thực tế (Implementation Status)**.

*Lưu ý cốt tử: Việc chấp thuận kiến trúc kỹ thuật (Architecture Acceptance) hoàn toàn không đồng nghĩa với việc mã nguồn đã được triển khai xong.*

| Lĩnh vực Kiến trúc | Quyết định Kiến trúc Được Chấp thuận (Accepted Decision) | ADR Thẩm quyền | Trạng thái Triển khai Mã nguồn |
| :--- | :--- | :---: | :---: |
| **Monorepo Foundation** | Cấu trúc npm workspaces đa gói (`apps/*`, `packages/*`, `external/*`). | [`ADR 0001`](adr/0001-monorepo-foundation.md) | `PARTIALLY_PRESENT` |
| **Upstream Submodule** | Pinned git submodule cho `external/hermes-agent`; cấm deep import nội bộ. | [`ADR 0002`](adr/0002-hermes-agent-submodule.md) | `PARTIALLY_PRESENT` |
| **REST API Baseline** | Chuẩn hóa Contract-first REST API dưới tiền tố `/v1`. | [`ADR 0003`](adr/0003-contract-first-rest-api.md) | `PARTIALLY_PRESENT` |
| **Shared UI Tokens** | `packages/ui` là nguồn chân lý duy nhất cho design tokens của toàn hệ thống. | [`ADR 0004`](adr/0004-shared-ui-tokens.md) | `PARTIALLY_PRESENT` |
| **Admin Client Topology** | Cổng Quản trị Web độc lập (`apps/admin-web`); chặn Admin đăng nhập trên mobile. | [`ADR 0005`](adr/0005-admin-client-topology.md) | `NOT_IMPLEMENTED` |
| **IAM & Session Lifecycle** | Server-authoritative session, short-lived access, rotating refresh, active freshness. | [`ADR 0006`](adr/0006-iam-session-lifecycle.md) | `AS_IS_GAP` |
| **Authorization Enforcement** | Phòng thủ đa tầng (Client Advisory, Server HTTP Gate, Domain Core Eligibility). | [`ADR 0007`](adr/0007-authorization-enforcement-architecture.md) | `AS_IS_GAP` |
| **Mobile Storage & Outbox** | `expo-sqlite` (dữ liệu/outbox) + sandbox filesystem (ảnh) + `expo-secure-store`. | [`ADR 0008`](adr/0008-offline-durable-storage-outbox.md) | `AS_IS_GAP` |
| **Concurrency & Idempotency**| Command Payload OCC (`expectedVersion`) + HTTP Header `Idempotency-Key`. | [`ADR 0009`](adr/0009-concurrency-idempotency-strategy.md) | `NOT_IMPLEMENTED` |
| **Contracts & Validation** | Zod schema-first contracts với `z.infer`; phân tách transport headers. | [`ADR 0010`](adr/0010-contracts-runtime-validation-governance-api.md) | `AS_IS_GAP` |
| **Audit Persistence** | Lưu trữ `AuditEvent` máy chủ append-only; phân quyền CSDL (`REVOKE UPDATE/DELETE`).| [`ADR 0011`](adr/0011-audit-trail-persistence-integrity.md) | `NOT_IMPLEMENTED` |
| **Clean Architecture** | Phân tầng Clean Architecture (Ports & Adapters) cho cả Server và Mobile. | [`ADR 0012`](adr/0012-clean-architecture-transitional-facade-decomposition.md) | `AS_IS_GAP` |
| **Backend Topology** | Modular Monolith (`apps/api`) Node.js/TS + Relational DB Family (5 module logic).| [`ADR 0013`](adr/0013-backend-runtime-persistence-topology.md) | `NOT_IMPLEMENTED` |

---

## 2. Hiện trạng Kiến trúc Thực tế & Khoảng trống Mã nguồn (AS-IS Architecture & Gaps)

Hiện trạng mã nguồn (ghi nhận tại commit baseline `2f9a26b` và bảo toàn qua các giai đoạn đồng bộ) là một ứng dụng Expo SDK 57 React Native dạng nguyên khối phía client (**Fat Client Monolith**) với cơ chế hoạt động lai (Hybrid: vừa gọi REST API vừa có cơ chế fallback in-memory):

```text
+-----------------------------------------------------------------------------------+
|                        AS-IS ARCHITECTURE (COMMIT 2f9a26b)                        |
+-----------------------------------------------------------------------------------+
| [PRESENTATION & ORCHESTRATION]                                                    |
| MobileApp.tsx (2,054 dòng)                                                        |
|   - Quản lý toàn bộ State (tasks, trees, notifications, activeTask, reviewTask)   |
|   - Điều phối điều hướng (Login, Forgot, StaffArea, ManagerArea)                  |
|   - Chứa mã JSX inline cho màn Login và Quên mật khẩu                             |
|   - Prop Drilling hơn 30 props xuống StaffArea và ManagerArea                     |
|                                                                                   |
| StaffArea.tsx & ManagerArea.tsx                                                   |
|   - Nhận props từ MobileApp, tiếp tục khoan props xuống các màn hình con          |
|                                                                                   |
| Màn hình độc khối (Monolithic Screens):                                           |
|   - StaffProofFlow.tsx (1,476 dòng): Gộp cả GPS, Camera QR, Chụp ảnh, Checklist   |
|   - ManagerReview.tsx (483 dòng): Tự tính toán fallbackTask trong JSX            |
|   - LoginScreen.tsx (300 dòng): Dead code (bị bỏ quên, không được dùng)          |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| [DOMAIN & BUSINESS HELPERS]                                                       |
| mobileWorkflow.ts (295 dòng)                                                      |
|   - Gộp chung màn hình giao diện (HOME, WORK, MAP) và bước bằng chứng (GPS, QR)   |
|   - Cung cấp hàm thuần tính toán gaps và chuyển bước                              |
|   - Chưa có lớp thực thể (Entity class) bảo vệ tính toàn vẹn trạng thái           |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| [SERVICE FACADE / HYBRID CATCH-ALL]                                               |
| greenOpsService.ts (856 dòng)                                                     |
|   - Quá tải trách nhiệm: REST Client, In-Memory DB, Session Manager, Mock Data    |
|   - Snapshot lưu trong biến RAM (let snapshot: AppData) -> Mất sạch khi kill app  |
|   - Ép vai trò admin thành Manager (dòng 349)                                     |
|   - Cơ chế Fallback nhận "fallbackTask" được tính toán sẵn từ UI component        |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| [SHARED CONTRACTS & PACKAGES]                                                     |
| @novyx/contracts                                                                  |
|   - DTOs thiếu trạng thái (chỉ 5/7 state), thiếu 3 ProofProfiles và 4 kết luận     |
|   - Thiếu Idempotency-Key và Concurrency Token (expectedVersion) trong hợp đồng   |
+-----------------------------------------------------------------------------------+
```

### 2.1. Các khiếm khuyết mã nguồn cốt tử của hiện trạng (AS-IS Defects & Gaps)

1. **Rò rỉ nghiệp vụ vào giao diện (Domain Leakage into UI):**
   Tại `ManagerReview.tsx` (dòng 132-136 và 163-167), mã JSX tự tay tạo ra object `fallbackTask` với trạng thái `COMPLETED` hoặc `REWORK_REQUIRED` rồi truyền vào `greenOpsService.reviewTask(request, fallbackTask)`. Giao diện đang tự ý làm thay chức năng của Domain Model!
2. **Quá tải thành phần gốc (`MobileApp.tsx` & `greenOpsService.ts`):**
   Hai file này chiếm tới hơn 2.900 dòng code, tập trung quá mức các trách nhiệm điều phối điều hướng, lưu trữ tạm và chuyển dịch trạng thái.
3. **Mất dữ liệu ngoại tuyến khi ứng dụng bị tắt ngầm (Data Loss Risk):**
   Toàn bộ dữ liệu của `greenOpsService.ts` nằm trên biến RAM (`let snapshot: AppData`). Khi nhân viên thu thập bằng chứng hiện trường mà bị Android kill app (do thiếu RAM lúc bật camera) hoặc mất mạng đột ngột, dữ liệu nháp và ảnh chụp biến mất hoàn toàn.
4. **Khuyết tật ép quyền Quản trị viên (Admin Coercion Defect):**
   Tại `greenOpsService.ts` (dòng 349) và script dev server `greenops-dev-api.cjs` (dòng 361), tài khoản mang vai trò `admin` bị tự động ép thành `Manager`. Điều này vi phạm nghiêm trọng ranh giới nghiệp vụ: Admin bị kéo vào quy trình tác nghiệp hiện trường mà không có không gian quản trị.
5. **Hợp đồng kỹ thuật bị tụt hậu (`@novyx/contracts` Gap):**
   Hợp đồng chỉ có 5 trạng thái (thiếu `BLOCKED`, `CANCELLED`), thiếu 3 Hồ sơ bằng chứng (`ProofProfile`), thiếu 4 kết luận thẩm định (`ReviewDecision`), thiếu toàn bộ DTO cho 9 năng lực Governance, và hoàn toàn chưa có kiểm thực runtime (`zod`).
6. **Thiếu hạ tầng máy chủ sản xuất (Production Server Gap):**
   Dự án hiện chỉ có một script mock Node.js đơn giản (`scripts/greenops-dev-api.cjs`, 537 dòng) phục vụ chạy thử cục bộ. Hoàn toàn chưa có backend có thẩm quyền để thi hành nghiệp vụ, xác thực phiên, kiểm tra OCC và ghi audit log.
7. **Thiếu lưu vết kiểm toán bất biến (Audit Trail Gap):**
   Hệ thống chưa có bảng lưu trữ `AuditEvent`; các thao tác tác nghiệp chỉ phát sinh log console tạm bợ.

---

## 3. Kiến trúc Mục tiêu Hợp nhất (Accepted Target Architecture Baseline)

Kiến trúc mục tiêu TO-BE là sự kết tinh toàn diện từ 13 quyết định kiến trúc đã được phê duyệt chính thức, giải quyết triệt để các khiếm khuyết hiện trạng và hiện thực hóa đầy đủ đường cơ sở nghiệp vụ đã đóng băng.

### 3.1. Topology Nền tảng Mục tiêu (Platform Topology)

Hệ thống NOVYX GreenOps được cấu trúc thành ba thành phần triển khai chính:

```text
+---------------------------------------------------------------------------------------+
|                                  CLIENT SURFACES                                      |
+---------------------------------------------------+-----------------------------------+
| Field Operations Mobile (apps/mobile)             | Platform Admin Web (apps/admin-web)|
| - Vai trò: Field Staff & Operations Manager       | - Vai trò: Platform Administrator |
| - Nền tảng: Expo SDK 57 React Native (Android/iOS)| - Nền tảng: Dedicated Desktop Web|
| - Điều hướng: 5 tab cố định (HOME..ACCOUNT)       | - Phạm vi: Governance Plane       |
| - Trạng thái: CỤC BỘ / ADVISORY UX                | - Trạng thái: CỤC BỘ / ADVISORY UX|
| - Lưu trữ: expo-sqlite + Sandbox Disk + SecureStore| - Phiên: HttpOnly Cookies + Memory|
+---------------------------------------------------+-----------------------------------+
                                         │
                 HTTPS REST /v1          │         HTTPS REST /v1
             (Zod Schema Validated)      │     (Zod Schema Validated)
                                         ▼
+---------------------------------------------------------------------------------------+
|                    AUTHORITATIVE SERVER BOUNDARY (apps/api)                           |
|                      Modular Monolith (Node.js / TypeScript)                          |
+---------------------------------------------------------------------------------------+
| [MODULE 1: WORK MANAGEMENT]           | [MODULE 2: TREE ASSET REGISTRY]               |
| - Core Bounded Context                | - Supporting Bounded Context                  |
| - Lifecycle, Proofs, Reviews, OCC     | - Master Data, Geodesic Coords, QR Identity   |
+---------------------------------------+-----------------------------------------------+
| [MODULE 3: POLICY & TEMPLATES]        | [MODULE 4: AUDIT & COMPLIANCE]                |
| - Supporting Bounded Context          | - Supporting Bounded Context                  |
| - Proof Policies, Checklist Templates | - Append-Only AuditEvent, Query & Filter      |
+---------------------------------------+-----------------------------------------------+
| [MODULE 5: IDENTITY & ACCESS MANAGEMENT (IAM)]                                        |
| - Generic Bounded Context                                                             |
| - Canonical Roles, 4 Account States, Session Freshness (WF-12), Refresh Rotation      |
+---------------------------------------------------------------------------------------+
                                         │
                             Scoped ACID Transactions
                                         ▼
+---------------------------------------------------------------------------------------+
|                                PERSISTENCE TOPOLOGY                                   |
+---------------------------------------------------------------------------------------+
| Relational Database Family (e.g. PostgreSQL-Compatible Engine)                        |
| - Operational Tables: tasks, trees, proof_policies, users, outbox_sync_log            |
| - Append-Only Audit Table: audit_events (DB Privilege Separation: REVOKE UPDATE/DELETE)|
+---------------------------------------------------------------------------------------+
```

1. **Ứng dụng Di động Hiện trường (`apps/mobile` — ADR 0001, ADR 0008, ADR 0012):**
   - Phục vụ tác nghiệp của **Field Staff** và **Operations Manager**.
   - Xây dựng trên nền tảng **Expo SDK 57 React Native**, tối ưu cho thiết bị cầm tay ngoài trời, thao tác một tay, độ tương phản cao, vùng chạm $\ge 44\text{px} \times 44\text{px}$ (nút chính $48\text{--}52\text{px}$).
   - Duy trì thanh điều hướng 5 tab cố định (`HOME`, `MY_TREES`, `WORK`, `NOTIFICATIONS`, `ACCOUNT`).
   - Khóa chặn hoàn toàn đăng nhập đối với vai trò `admin` (hiển thị thông báo yêu cầu truy cập Cổng Quản trị Web).
2. **Cổng Quản trị Web Nền tảng (`apps/admin-web` — ADR 0005):**
   - Ứng dụng Web dành riêng cho **Platform Administrator** để thực thi 9 nhóm năng lực Quản trị Nền tảng (`CAP-ADM-01..09` / `GV-01..19`) và quyền đọc duy nhất đã duyệt là **`OP-22 ViewCareHistory`**.
   - CẤM mọi thẩm quyền tạo, phân công, thực hiện hoặc duyệt task hiện trường.
   - Tách biệt bề mặt phát hành: mã nguồn quản trị desktop không bị đóng gói vào file APK của thiết bị hiện trường.
   - *Lưu ý:* `apps/admin-web` là thành phần mục tiêu đã được duyệt kiến trúc nhưng **CHƯA ĐƯỢC TRIỂN KHAI TRONG MÃ NGUỒN** (`NOT_IMPLEMENTED`).
3. **Máy chủ Sản xuất Có Thẩm quyền (`apps/api` — ADR 0013):**
   - Ứng dụng **Modular Monolith** viết bằng Node.js / TypeScript trong cùng monorepo.
   - Là **RANH GIỚI THẨM QUYỀN DUY NHẤT (SOLE AUTHORITATIVE GATE)** của toàn bộ hệ thống, chịu trách nhiệm bảo vệ invariants, thẩm định quyền truy cập, kiểm tra tính lũy lượng và ghi nhật ký kiểm toán bất biến.
   - *Lưu ý:* `apps/api` là thành phần mục tiêu đã được duyệt kiến trúc nhưng **CHƯA ĐƯỢC TRIỂN KHAI TRONG MÃ NGUỒN** (`NOT_IMPLEMENTED`).
4. **Cơ sở dữ liệu Quan hệ (Relational Database Family — ADR 0013):**
   - Một thể hiện cơ sở dữ liệu quan hệ duy nhất hỗ trợ giao dịch ACID trong phạm vi workflow kỹ thuật. Không khóa cứng nhà cung cấp (PostgreSQL là khuyến nghị và minh họa).

---

### 3.2. 5 Module Logic Máy chủ & Ranh giới Thẩm quyền Xuyên Ngữ cảnh (ADR 0013)

Máy chủ `apps/api` được tổ chức bên trong thành đúng **5 module logic** tương ứng với 5 Bounded Contexts đã đóng băng tại `DOMAIN.md §2`:

| Module Logic Máy chủ | Phân loại Bounded Context | Trách nhiệm Nghiệp vụ Cốt tử |
| :--- | :---: | :--- |
| **1. Work Management** | `CORE` | Vòng đời nhiệm vụ 7 trạng thái, tiếp nhận bằng chứng 3 ProofProfiles, thẩm định 4 kết luận, kiểm soát tranh chấp OCC (`expectedVersion`), xử lý sự cố hiện trường (`BLOCKED`). |
| **2. Tree Asset Registry** | `SUPPORTING` | Hồ sơ lâm sinh cây xanh, tọa độ trắc địa chuẩn tắc, cấp đổi mã QR vật lý, theo dõi giải tỏa cây. Chiếu dữ liệu `CareHistory` (chỉ ghi nhận từ các nhiệm vụ đã đạt `COMPLETED`). |
| **3. Policy & Template Governance**| `SUPPORTING` | Ban hành và quản lý phiên bản chính sách bằng chứng (`ProofPolicyVersion`), mẫu kiểm tra kỹ thuật (`ChecklistTemplateVersion`), danh mục loại nhiệm vụ (`TaskTypeCatalog`). |
| **4. Audit & Compliance** | `SUPPORTING` | Ghi nhận tập trung và bất biến mọi `AuditEvent`, cung cấp API truy vấn lọc đa tiêu chí (`ViewAuditLog`, `FilterAuditLog`) cho Quản trị viên. |
| **5. Identity & Access Management** | `GENERIC` | Quản trị người dùng, 3 vai trò chuẩn tắc (`staff`, `manager`, `admin`), 4 trạng thái tài khoản (`INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`), quản lý phiên và thu hồi tức thì (`WF-12`). |

#### Nguyên tắc Thẩm quyền Dữ liệu Xuyên Ngữ cảnh (Cross-Module Invariants)
- **Độc lập Ý niệm:** Một Module Logic / Bounded Context $\neq$ Microservice $\neq$ npm Package $\neq$ Cơ sở dữ liệu riêng biệt. Cả 5 module cùng chia sẻ một tiến trình backend duy nhất.
- **Cấm Đột biến CSDL Chéo (No Cross-Module SQL Mutation):** Mặc dù các module có thể dùng chung một physical database, Module A **TUYỆT ĐỐI KHÔNG ĐƯỢC** trực tiếp chạy câu lệnh SQL (`INSERT`, `UPDATE`, `DELETE`) làm biến đổi bảng dữ liệu thuộc quyền sở hữu của Module B.
- **Giao tiếp qua Module Interface:** Mọi tương tác xuyên ngữ cảnh phải được thực hiện thông qua Application Use Case hoặc Domain Service do module chủ quản xuất bản.
- **Ràng buộc Khóa ngoại (Foreign Keys):** Khóa ngoại là cơ chế kỹ thuật bảo đảm toàn vẹn tham chiếu (Referential Integrity), **KHÔNG PHẢI** là giấy phép cấp quyền đột biến dữ liệu tùy tiện qua lại giữa các ngữ cảnh.

---

### 3.3. Phân tầng Clean Architecture & Hai Môi trường Thực thi (ADR 0012)

Kiến trúc phân tầng Clean Architecture (Ports & Adapters) được áp dụng nhất quán trên cả client và server, nhưng mang thẩm quyền nghiệp vụ hoàn toàn khác biệt:

```text
       PRESENTATION LAYER (Giao diện người dùng: Controllers / Screens / ViewModels)
                                        │
                                        ▼
       APPLICATION LAYER (Ca sử dụng ứng dụng: Use Cases / Workflows / Orchestration)
                                        │
                                        ▼
       DOMAIN LAYER (Thực thể & Quy tắc nghiệp vụ: Aggregates / Value Objects / Invariants)
                                        │
                                        ▼
       PORTS (Giao diện ranh giới cổng: Repositories / Hardware Ports / Notification Ports)
                                        ▲
                                        │ (Implements)
       INFRASTRUCTURE LAYER (Adapters: Database / HTTP Client / OS Hardware / Storage)
```

#### Phân định Hai Môi trường Thực thi (Dual-Environment Model):
1. **Môi trường Máy chủ (Server Environment — Authoritative):**
   - Chứa **Domain Core và Application Layer CÓ THẨM QUYỀN TỐI HẬU**.
   - Là nơi duy nhất quyết định chấp thuận chuyển trạng thái Task, thẩm định điều kiện tiên quyết, thực thi Phân tách Trách nhiệm (SoD), tăng phiên bản OCC, và ghi nhận audit log.
2. **Môi trường Di động (Mobile Environment — Local / Advisory):**
   - Chứa mô hình ứng dụng cục bộ, hàng đợi Outbox, và các bộ quy tắc kiểm tra công thái học (Advisory Helpers).
   - **Ứng dụng di động KHÔNG PHẢI là ranh giới thẩm quyền tối hậu.** Client hiển thị trạng thái hỗ trợ người dùng, ngăn ngừa thao tác sai từ sớm, nhưng không thể tự quyết định việc thay đổi trạng thái nhiệm vụ nếu máy chủ từ chối.

#### Phân rã Facade `greenOpsService.ts`:
Dịch vụ `greenOpsService.ts` hiện tại được phân rã từng bước thành các Use Cases độc lập và hạ tầng bền vững:
- `HttpTransportClient` (giao tiếp mạng REST `/v1/` và bắt lỗi envelope).
- `SqliteTaskRepository` & `SqliteOutboxQueue` (lưu trữ SQLite bền vững thay thế biến RAM `snapshot`).
- `ExpoHardwareAdapter` (bao bọc phần cứng Camera, GPS, SecureStore).
- Các Use Cases chuyên biệt: `StartTaskUseCase`, `SubmitEvidenceUseCase`, `ReviewTaskUseCase`, `ReportFieldIssueUseCase`, `ResumeBlockedTaskUseCase`, `ReassignTaskUseCase`, `CancelTaskUseCase`.

---

### 3.4. Kiến trúc Phân quyền Đa tầng Phòng thủ (ADR 0007)

Hệ thống thiết lập mô hình an ninh 3 tầng (**Defense-in-Depth**) để bảo vệ 48 lệnh nghiệp vụ:

```text
[TIER 1: CLIENT PRESENTATION] ---> [TIER 2: SERVER REQUEST BOUNDARY] ---> [TIER 3: DOMAIN CORE GATE]
(Giao diện người dùng Mobile/Web)    (HTTP Middleware / Gateway)           (Application Use Case / Entity)
- Ẩn/hiện nút bấm công thái học     - Xác thực danh tính caller           - Thẩm định điều kiện toàn diện:
- Thông báo lý do không hợp lệ      - Kiểm tra AccountStatus === ACTIVE     ROLE ∧ SCOPE ∧ STATE ∧ PRECOND
- Tránh người dùng gửi lệnh sai     - Kiểm tra authVersion tươi (WF-12)   - Bảo vệ SoD Tác quyền Lịch sử
- HOÀN TOÀN KHÔNG CÓ THẨM QUYỀN BẢO MẬT - Phân luồng vai trò thô theo Route   - BẢO MẬT TUYỆT ĐỐI CÓ THẨM QUYỀN
```

1. **Tầng 1: Client Presentation Layer (Advisory UX Only):**
   Kiểm tra sơ bộ trên mobile hoặc web để ẩn/làm mờ các nút bấm không đủ điều kiện, hướng dẫn nhân viên hoàn thành hiện trường. Tầng này hoàn toàn mang tính công thái học; kẻ tấn công bypass tầng này sẽ lập tức bị chặn đứng tại máy chủ.
2. **Tầng 2: Server Request Boundary (HTTP Coarse Gate):**
   - Middleware máy chủ xác thực danh tính từ access credential.
   - **Kiểm tra độ tươi bắt buộc (`WF-12`):** Xác minh tức thì `accountStatus === 'ACTIVE'` và `authVersion` khớp với CSDL máy chủ.
   - Nếu tài khoản `SUSPENDED` hoặc `DISABLED`: Máy chủ lập tức từ chối với mã lỗi `403 FORBIDDEN: ACCOUNT_SUSPENDED` hoặc `403 FORBIDDEN: ACCOUNT_DISABLED`. Quy tắc này áp dụng bình đẳng cho **MỌI HÀNH ĐỘNG ĐƯỢC BẢO VỆ** (cả truy vấn ĐỌC như `ViewAssignedTask`, `ViewCareHistory`, `ViewAuditLog` lẫn thao tác GHI như `SubmitEvidence`, `ReviewTask`).
   - Phân luồng vai trò thô theo route (ví dụ: route `/v1/governance/*` từ chối `staff` và `manager`).
3. **Tầng 3: Domain Core Gate (Authoritative Action Eligibility):**
   Tại Application Use Case và Domain Entity, hệ thống tính toán tất định biểu thức điều kiện:
   $$\text{ActionEligibility} = \text{ACTOR ROLE} \land \text{RESOURCE SCOPE} \land \text{DOMAIN STATE} \land \text{BUSINESS PRECONDITIONS}$$
   - **Bảo vệ Phân tách Trách nhiệm Tác quyền Lịch sử (`SoD-02`):** Quản lý duyệt việc bắt buộc phải khác với Nhân viên đã nộp bằng chứng (`reviewerId !== evidenceSubmittedByStaffId`). Thẩm định dựa trên tác quyền lịch sử được lưu vĩnh viễn trong hồ sơ bằng chứng, ngăn chặn triệt để hành vi tự duyệt việc ngay cả khi người dùng được đổi vai trò từ Staff lên Manager.

---

### 3.5. Ranh giới IAM & Vòng đời Phiên làm việc (ADR 0006)

Hệ thống áp dụng **Kiến trúc Phiên làm việc có Thẩm quyền Máy chủ (Server-Authoritative Session Architecture)**:

1. **4 Trạng thái Vòng đời Tài khoản Chuẩn tắc:** `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`.
   - *Quy tắc bất biến:* `LOCKED` (khóa tạm do sai mật khẩu) là trạng thái kỹ thuật bảo mật do IAM quản lý (`CAP-ADM-04`), **KHÔNG PHẢI** là một `AccountStatus`. Tài khoản bị khóa tạm vẫn giữ `AccountStatus = ACTIVE`. Lệnh `UnlockAccount` xóa bộ đếm thất bại; `ResetCredentialSetup` phát hành liên kết cấp lại thông tin đăng nhập.
2. **Cơ chế Chứng thực & Thu hồi Tức thì (`WF-12`):**
   - **Access Credential:** Có thời hạn ngắn (ngắn hạn, ví dụ tham số đề xuất: 15 phút).
   - **Refresh Credential:** Có thời hạn dài hơn (dài hạn, ví dụ tham số đề xuất: 30 ngày) kết hợp bắt buộc **Xoay vòng Refresh Token (Refresh Token Rotation - RTR)**. Mỗi lần làm mới sẽ hủy refresh token cũ và cấp token mới. Nếu phát hiện token cũ bị tái sử dụng, hệ thống lập tức hủy toàn bộ phiên của người dùng.
   - Khi Quản trị viên thực thi `SuspendAccount`, `DisableAccount`, hoặc thay đổi vai trò: máy chủ lập tức tăng `user.authVersion = user.authVersion + 1` và xóa toàn bộ bản ghi refresh token. Ngay ở request tiếp theo, mọi access credential cũ đều bị từ chối truy cập.
3. **Lưu trữ Thông tin Xác thực An toàn:**
   - Trên Mobile: Lưu trữ an toàn trong iOS Keychain / Android Keystore thông qua `expo-secure-store`.
   - Trên Admin Web: Refresh credential lưu trong `HttpOnly; Secure; SameSite=Strict` Cookie; Access credential lưu trong bộ nhớ ứng dụng (Memory).
4. **Bảo toàn Bản nháp Ngoại tuyến:**
   - Việc soạn nháp và chụp ảnh ngoại tuyến được duy trì cục bộ trong SQLite di động.
   - Lưu trữ ngoại tuyến **KHÔNG MANG LẠI THẨM QUYỀN MÁY CHỦ**. Khi thiết bị có mạng trở lại, mọi yêu cầu đồng bộ đều phải trải qua cổng kiểm soát thẩm quyền của máy chủ.

---

### 3.6. Kiến trúc Hợp đồng, Kiểm thực Runtime & Phân tách Transport (ADR 0010)

Gói `@novyx/contracts` đóng vai trò là **Biểu diễn Kỹ thuật Dẫn xuất (Derived Technical Contract Representation)** của đường cơ sở nghiệp vụ đã đóng băng:

1. **Kiểm thực Runtime bằng Zod (Zod Schema-First):**
   - Sử dụng thư viện `zod` để định nghĩa toàn bộ schemas tại ranh giới mạng.
   - Tự động suy luận các kiểu dữ liệu TypeScript tĩnh thông qua `z.infer<typeof Schema>`, loại bỏ hoàn toàn tình trạng sai lệch giữa kiểu biên dịch và kiểm thực lúc chạy.
   - Bắt và từ chối các payload không hợp lệ ngay tại ranh giới mạng với mã lỗi chuẩn `400 VALIDATION_FAILED`.
2. **Nguyên tắc Phân định Ranh giới Cốt tử:**
   $$\text{Business Command Identity} \neq \text{HTTP Route Identity} \neq \text{DTO Type Name} \neq \text{Transport Header}$$
   - **Business Command:** Hành động nghiệp vụ chuẩn tắc bất biến (ví dụ: `OP-15 SubmitEvidence`, `OP-05 StartTask`).
   - **HTTP Route Identity:** Đường dẫn mạng RESTful (ví dụ: `POST /v1/tasks/:id/evidence`, `POST /v1/tasks/:id/start`).
   - **DTO Type Name:** Kiểu dữ liệu payload Zod/TypeScript (ví dụ: `SubmitEvidenceRequest`, `StartTaskRequest`).
   - **Transport Header:** Metadata kỹ thuật cấp giao vận (ví dụ: `Idempotency-Key: <UUIDv4>`).
3. **Tách biệt Hoàn toàn Transport Headers khỏi Business Payloads:**
   - Header `Idempotency-Key` được kiểm thực ở tầng giao vận bằng header schema chuyên biệt (`MutationRequestHeadersSchema`).
   - **TUYỆT ĐỐI KHÔNG** đưa trường `idempotencyKey` vào trong body payload của DTO nghiệp vụ.
4. **Kiểm soát Tranh chấp Lạc quan Chính xác (`expectedVersion`):**
   - Trường `expectedVersion: number` là bắt buộc đối với các lệnh thay đổi trạng thái tác động lên **THỰC THỂ ĐÃ TỒN TẠI VÀ ĐƯỢC ĐÁNH PHIÊN BẢN** (ví dụ: `SubmitEvidence`, `ReassignTask`, `CancelTask`, `ApproveTask`, `ApproveWithException`, `RequestRework`, `ResubmitRework`, `UpdateTreeMasterData`).
   - **KHÔNG MÁY MÓC ÉP BUỘC** `expectedVersion` lên các lệnh tạo mới thực thể khi chưa có aggregate version trước đó (`CreateTask`, `ProvisionUser`, `CreateTree`, `CreateTaskType`).
5. **48 Business Commands $\neq$ 48 Public Endpoints:**
   48 lệnh nghiệp vụ đại diện cho danh mục hành vi sản phẩm. Chỉ các lệnh vượt qua ranh giới mạng bên ngoài mới có endpoint REST và DTO. Các lệnh kiểm tra cục bộ (`CLIENT_LOCAL_ADVISORY`: `VerifyGps`, `VerifyQr`), tác vụ nội bộ tự động (`SYSTEM_INTERNAL`: `ProjectCareHistory`), tính năng thuộc giai đoạn sau (`FUTURE_NOT_ACTIVE`: `ManageDynamicFindingsTemplate`, `UseBreakGlass`), hoặc tính năng đã loại trừ (`NOT_NETWORK_EXPOSED`: `ManagePlatformSystemConfig`) không có public API endpoint trong MVP (tham chiếu chi tiết tại bảng phân loại ở `ADR 0010 §3`).

---

### 3.7. Kiến trúc Lưu trữ Ngoại tuyến, Hàng đợi Outbox & Đối soát Xung đột (ADR 0008)

Ứng dụng di động `apps/mobile` triển khai mô hình lưu trữ bền vững để đáp ứng các yêu cầu chất lượng `QAS-OFFLINE-01` ($< 100\text{ms}$ local commit) và `QAS-OFFLINE-02` ($\le 2\text{s}$ state recovery after OS kill):

1. **Bộ ba Lưu trữ Cục bộ (Mobile Storage Topology):**
   - `expo-sqlite`: Lưu trữ dữ liệu quan hệ có cấu trúc (`tasks`, `trees`, `task_evidence`, `checklist_items`, `outbox_queue`).
   - Sandbox Filesystem (`file://${FileSystem.documentDirectory}/evidence/...`): Lưu trữ vĩnh viễn các file ảnh nhị phân được sao chép từ cache camera.
   - `expo-secure-store`: Lưu trữ an toàn các token xác thực, cô lập hoàn toàn khỏi SQLite.
2. **Ba Chiều Trạng thái Trực giao (Orthogonal State Dimensions):**
   - `TaskStatus`: Trạng thái vòng đời do máy chủ quản lý (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`).
   - `LocalSubmissionStatus`: Từ vựng trạng thái kỹ thuật phía client (`IDLE`, `SAVED_DRAFT`, `PENDING_SYNC`).
   - `SyncStatus`: Trạng thái truyền tải mạng cục bộ (`IDLE`, `SYNCING`, `SYNCED`, `SYNC_FAILED`).
   - *Quy tắc:* Trạng thái `PENDING_SYNC` là ý niệm cục bộ của thiết bị, không bao giờ được gửi lên hoặc lưu thành `TaskStatus` trên máy chủ.
3. **Nguyên tắc Đối soát Xung đột Máy chủ (Authoritative Server Reconciliation):**
   - Khi tiến trình đồng bộ (Outbox Worker) thất bại do lỗi mạng hoặc timeout: `TaskStatus` cục bộ tiếp tục duy trì `IN_PROGRESS`, `SyncStatus` ghi nhận `SYNC_FAILED` kèm lý do lỗi, và toàn bộ bằng chứng ảnh chụp, checklist trong SQLite **TUYỆT ĐỐI KHÔNG BỊ XÓA BỎ**.
   - Nếu máy chủ phản hồi lỗi xung đột (`409 CONFLICT: STALE_VERSION`) hoặc trả về trạng thái tài nguyên cho thấy trạng thái nhiệm vụ đã thay đổi do hành động nghiệp vụ hợp lệ khác (ví dụ: Quản lý đã Hủy việc hoặc Phân công người khác trong lúc Nhân viên mất mạng):
     - Client **BẮT BUỘC PHẢI ĐỐI SOÁT VÀ HIỂN THỊ TRẠNG THÁI MÁY CHỦ CÓ THẨM QUYỀN**.
     - Toàn bộ bằng chứng cục bộ của nhân viên vẫn được lưu giữ an toàn để phục vụ tra cứu và giải trình.
     - **BẢO TOÀN BẰNG CHỨNG CỤC BỘ $\neq$ CƯỠNG ÉP TRẠNG THÁI TASK CỤC BỘ ĐÈ LÊN THẨM QUYỀN MÁY CHỦ.** Máy chủ luôn là thẩm quyền tối cao.
4. **Nghiệm thu qua Kiểm chứng Thực nghiệm (Empirical Verification):**
   Kiến trúc cung cấp các nguyên thủy bền vững (ACID transactions trong SQLite); việc nghiệm thu chính thức đòi hỏi phải vượt qua các bài kiểm tra lỗi vật lý thực tế: ngắt tiến trình giữa lúc chụp ảnh (Process Kill), ngắt nguồn giữa giao dịch (Power Loss), và bật tắt chế độ máy bay khi đang gửi hàng đợi (Network Dropout).

---

### 3.8. Kiểm soát Tranh chấp (OCC) & Chiến lược Lũy lượng (ADR 0009)

1. **Kiểm soát Tranh chấp Lạc quan (Optimistic Concurrency Control):**
   - Thực thể `Task` trên máy chủ mang trường `version: number` tăng đơn điệu.
   - Khi client gửi các lệnh thay đổi trạng thái (`SubmitEvidence`, `ReviewTask`, `ReassignTask`, `CancelTask`), client gửi kèm `expectedVersion`.
   - Máy chủ thực hiện kiểm tra nguyên tử trong transaction:
     ```sql
     UPDATE tasks SET status = :newStatus, version = version + 1
     WHERE id = :taskId AND version = :expectedVersion;
     ```
   - Nếu số hàng bị ảnh hưởng bằng 0, máy chủ từ chối và trả về mã lỗi `409 CONFLICT: STALE_VERSION`.
2. **Chiến lược Lũy lượng qua Header (Command Idempotency):**
   - Mọi lệnh thay đổi trạng thái gửi qua mạng bắt buộc phải mang HTTP header `Idempotency-Key: <UUIDv4>`.
   - Client Outbox Worker lưu giữ `idempotency_key` trong bản ghi hàng đợi. Khi thử lại cùng một thao tác nộp bằng chứng do rớt mạng, client **BẮT BUỘC TÁI SỬ DỤNG CÙNG MỘT IDEMPOTENCY KEY**.
   - Máy chủ duy trì bảng lưu vết idempotency: Nếu nhận được request trùng key đã xử lý thành công, máy chủ trả về ngay kết quả đã lưu trữ trước đó mà không thực thi lại logic và không ghi nhận thêm audit event trùng lặp.
   - **Bất biến Lưu vết:** Thời gian lưu vết (TTL) của bản ghi idempotency trên máy chủ phải lớn hơn hoặc bằng chân trời ngoại tuyến tối đa của thiết bị hiện trường ($\text{TTL} \ge \text{Max Offline Retry Horizon}$).

---

### 3.9. Lưu vết Kiểm toán & Toàn vẹn Chống Sửa (ADR 0011)

Bối cảnh **Audit & Compliance** được thiết kế để thỏa mãn 100% các yêu cầu bất biến append-only (`DR-HARD-06`, `DR-POL-04`):

1. **Lưu trữ Tập trung có Thẩm quyền:**
   Mọi hành động làm thay đổi trạng thái trên cả mặt phẳng Vận hành và Quản trị đều bắt buộc phải phát sinh bản ghi `AuditEvent` tập trung trên máy chủ sản xuất.
2. **Phân quyền Cấp Cơ sở Dữ liệu (Database Privilege Separation — Tuyến phòng thủ chính cho MVP):**
   - Ứng dụng backend kết nối vào CSDL bằng một database user chuyên biệt cho runtime ứng dụng (`novyx_app_user`).
   - CSDL thực thi phân quyền nghiêm ngặt:
     ```sql
     -- Ví dụ minh họa cú pháp SQL quan hệ
     GRANT SELECT, INSERT ON audit_events TO novyx_app_user;
     REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM novyx_app_user;
     ```
   - Cơ chế này đảm bảo rằng không một lỗi logic ứng dụng, tài khoản quản trị viên bị lộ, hay lỗ hổng SQL Injection nào từ tầng ứng dụng có thể sửa đổi hoặc xóa bỏ các bản ghi lịch sử kiểm toán đã lưu.
3. **Độ chính xác về Ranh giới Bảo mật (Security Claim Precision):**
   - Tính toàn vẹn append-only này vận hành và có hiệu lực **TRONG RANH GIỚI ỨNG DỤNG VÀ NGƯỜI DÙNG CSDL THÔNG THƯỜNG**.
   - Cơ chế này **KHÔNG PHẢI LÀ BẰNG CHỨNG MẬT MÃ PHI CHỐI BỎ (Cryptographic Non-Repudiation)** chống lại người quản trị root CSDL (root DBA), chủ sở hữu hạ tầng đám mây, hoặc kẻ tấn công có quyền can thiệp trực tiếp vào storage vật lý.
4. **Chuỗi băm Phân vùng (Stream-Partitioned Hash-Chain):**
   Được phân loại là **NĂNG LỰC GIA CỐ TƯƠNG LAI TÙY CHỌN (OPTIONAL FUTURE HARDENING)**, không bắt buộc triển khai trong phạm vi MVP nhằm tránh gia tăng độ phức tạp thuật toán và rủi ro nghẽn ghi đồng thời khi chưa có quy định bắt buộc từ cơ quan kiểm toán độc lập.

---

## 4. Các Quyết định Mở ở Cấp độ Triển khai (Implementation-Level Open Decisions)

Để bảo đảm tính linh hoạt trong quá trình lập kế hoạch kỹ thuật chi tiết (Phase 12), các tham số và lựa chọn kỹ thuật sau đây được giữ mở và **KHÔNG BỊ KHÓA CỨNG** bởi các quyết định kiến trúc:

| Hạng mục Kỹ thuật | Trạng thái Kiến trúc | Các phương án mở để đánh giá trong Phase 12 |
| :--- | :---: | :--- |
| **Hệ Quản trị CSDL Quan hệ** | `OPEN` | PostgreSQL (khuyến nghị), MySQL, MariaDB hoặc dịch vụ CSDL đám mây tương đương. |
| **Framework HTTP Backend** | `OPEN` | Fastify (khuyến nghị hiệu năng cao) hoặc Express.js. |
| **ORM / Query Builder** | `OPEN` | Drizzle ORM, Prisma, hoặc Kysely. |
| **Định dạng Access Credential** | `OPEN` | Opaque Token (kèm bảng session tra cứu nhanh) vs Signed JWT (kèm kiểm tra session freshness). |
| **Thời hạn Token (TTL)** | `OPEN` | Access Token (khuyến nghị 15m), Refresh Token (khuyến nghị 30d). |
| **Thuật toán Băm Mật khẩu** | `OPEN` | Argon2id (khuyến nghị OWASP) hoặc bcrypt. |
| **Thời gian Lưu vết Idempotency** | `OPEN` | Thời gian TTL cụ thể ($\ge$ chân trời ngoại tuyến tối đa của thiết bị). |
| **Ngưỡng Dọn rác Ảnh Cục bộ (GC)** | `OPEN` | Chính sách dọn dẹp dung lượng ảnh sau khi task đã hoàn tất và được xác nhận trên máy chủ. |
| **Framework Frontend Admin Web** | `OPEN` | Vite + React SPA (khuyến nghị cho dashboard nội bộ) hoặc Next.js. |
| **Hạ tầng Triển khai / Hosting** | `OPEN` | Containerization (Docker), VM, hoặc nền tảng PaaS/Cloud phù hợp quy mô dự án. |
| **Dịch vụ Lưu trữ Tệp Nhị phân** | `OPEN` | Local Sandbox trên máy chủ hoặc Cloud Object Storage (S3-compatible). |

---

## 5. Phân định Phạm vi MVP và Gia cố Tương lai (MVP Scope vs Future Hardening)

Ranh giới kỹ thuật được phân định rạch ròi giữa mục tiêu bàn giao MVP và các năng lực nâng cao cho các giai đoạn tiếp theo:

```text
+---------------------------------------------------------------------------------------+
|                              ACCEPTED MVP ARCHITECTURE                                |
+---------------------------------------------------------------------------------------+
| - Ứng dụng Di động Hiện trường (apps/mobile) cho Staff & Manager                      |
| - Cổng Quản trị Web Độc lập (apps/admin-web) cho Platform Admin                       |
| - Máy chủ Modular Monolith (apps/api) Node.js/TS với 5 Module Logic                   |
| - Cơ sở dữ liệu Quan hệ với phân quyền Append-Only cho bảng audit_events              |
| - Lưu trữ SQLite + Sandbox Filesystem + Hàng đợi Outbox bền vững trên Mobile          |
| - Kiểm soát Tranh chấp Lạc quan (OCC expectedVersion) và Lũy lượng (Idempotency-Key)  |
| - Hợp đồng Zod Schema-First với tự động suy luận kiểu TypeScript                      |
| - Phòng thủ Phân quyền Đa tầng và Kiểm tra độ tươi phiên tức thì (WF-12)              |
+---------------------------------------------------------------------------------------+
                                         │
                                         ▼ (Chỉ kích hoạt khi có yêu cầu nghiệp vụ mới)
+---------------------------------------------------------------------------------------+
|                          OPTIONAL FUTURE HARDENING (HẬU MVP)                          |
+---------------------------------------------------------------------------------------+
| - Chuỗi băm phân vùng theo luồng thực thể cho Audit Log (Stream Hash-Chaining)        |
| - Mỏ neo niềm tin bên ngoài / WORM Storage / Merkle Root Checkpointing                |
| - Cơ chế xử lý khẩn cấp Bypass (UseBreakGlass - GV-21)                                |
| - Quản lý biểu mẫu lâm sinh động (ManageDynamicFindingsTemplate - GV-20)              |
| - Hệ thống Webhook và thông báo bảo mật đa kênh qua hạ tầng hàng đợi phân tán         |
+---------------------------------------------------------------------------------------+
```

---

## 6. Ma trận Truy vết từ Tài liệu Kiến trúc sang ADR (Cross-Document Traceability Matrix)

Mọi nguyên lý và thành phần trong tài liệu này đều bắt nguồn trực tiếp từ các quyết định kiến trúc đã được phê duyệt:

| Phần Mục trong ARCHITECTURE.md | Quyết định Kiến trúc Tương ứng | Tóm tắt Quyết định Được Chấp thuận |
| :--- | :---: | :--- |
| **§1. Ma trận Trạng thái** | Toàn bộ `ADR 0001`..`0013` | Cập nhật hiện trạng toàn diện của hệ thống quyết định kỹ thuật. |
| **§2. Hiện trạng & Khoảng trống** | `ADR 0005`, `0008`, `0010`, `0013` | Đối chiếu mã nguồn thực tế và bảo toàn danh mục các khiếm khuyết kỹ thuật. |
| **§3.1. Topology Nền tảng** | `ADR 0001`, `0005`, `0008`, `0013` | Xác lập mô hình 2 client surfaces (`mobile`, `admin-web`) và 1 máy chủ (`api`). |
| **§3.2. 5 Module Máy chủ** | `ADR 0013` | Xác lập Modular Monolith với 5 module logic và cấm đột biến CSDL chéo. |
| **§3.3. Clean Architecture** | `ADR 0012` | Xác lập mô hình phân tầng Ports & Adapters và phân rã facade `greenOpsService`. |
| **§3.4. Phân quyền Đa tầng** | `ADR 0007` | Xác lập mô hình 3 tầng bảo mật và bảo vệ SoD tác quyền lịch sử (`SoD-02`). |
| **§3.5. Ranh giới IAM & Phiên** | `ADR 0006` | Xác lập phiên thẩm quyền máy chủ, kiểm tra độ tươi tức thì (`WF-12`), xoay token. |
| **§3.6. Hợp đồng & Validation** | `ADR 0003`, `ADR 0010` | Xác lập Zod Schema-First, phân tách transport headers, phân loại ranh giới API. |
| **§3.7. Lưu trữ Offline & Outbox**| `ADR 0008` | Xác lập SQLite, Outbox FIFO, 3 chiều trạng thái và đối soát xung đột máy chủ. |
| **§3.8. Concurrency & Idempotency**| `ADR 0009` | Xác lập OCC `expectedVersion`, lỗi 409, và header `Idempotency-Key: <UUIDv4>`. |
| **§3.9. Vết Kiểm toán & Toàn vẹn** | `ADR 0011` | Xác lập lưu trữ tập trung, phân quyền append-only, hoãn hash-chain cho hậu MVP. |
| **§4. Quyết định Mở** | `ADR 0005`, `0006`, `0008`, `0009`, `0011`, `0013` | Giữ mở các tham số kỹ thuật không mang tính ràng buộc kiến trúc. |
| **§5. Phạm vi MVP vs Gia cố** | `ADR 0010`, `ADR 0011` | Phân định ranh giới giữa bàn giao MVP và năng lực gia cố tương lai. |
