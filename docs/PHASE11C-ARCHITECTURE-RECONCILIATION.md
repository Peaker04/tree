# Báo Cáo Đối Soát Kiến Trúc Kỹ Thuật Mục Tiêu & Biểu Đồ Dẫn Xuất (Phase 11C)

**Dự án:** NOVYX GreenOps
**Giai đoạn:** Phase 11C — Technical Architecture Document & Target Diagram Reconciliation
**Trạng thái:** HOÀN TẤT (COMPLETE)
**Ngày thực hiện:** 21/09/2026
**Commit Baseline (Phase 11B Frozen):** `72667843eb1a7b749c523ae70f5e857ca7376982`

---

## 1. Mục Đích Đối Soát (Purpose)

Phase 11C thực hiện chuyển hóa toàn bộ các quyết định kiến trúc kỹ thuật bất biến đã được Chủ sở hữu (Owner) chấp thuận chính thức tại bộ ADR 0005..0013 thành:

1. **Tài liệu Kiến trúc Kỹ thuật Hợp nhất Chuẩn tắc:** Cập nhật [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) từ trạng thái *"Đề xuất chờ ADR phê duyệt"* thành *"Kiến trúc Kỹ thuật Mục tiêu — Đường cơ sở ADR đã Chấp thuận"*.
2. **Sơ đồ Kiến trúc Mục tiêu Dẫn xuất:** Đồng bộ [`docs/diagrams/10-system-target-architecture.html`](diagrams/10-system-target-architecture.html) và [`docs/diagrams/12-architecture-dependency-map.html`](diagrams/12-architecture-dependency-map.html) phản ánh đúng topology Client/Server, Modular Monolith (5 Bounded Contexts logic), hợp đồng REST v1 và hạ tầng bền vững.
3. **Khắc phục Phát biểu Lạc hậu có Điều kiện tại Biểu đồ 08:** Cập nhật nhận định về kênh phân phối Platform Admin trong [`docs/diagrams/08-role-information-architecture.html`](diagrams/08-role-information-architecture.html) theo ADR 0005 (`apps/admin-web`).
4. **Đồng bộ Danh mục Biểu đồ Hệ thống:** Cập nhật [`docs/diagrams/README.md`](diagrams/README.md) công nhận thẩm quyền kiến trúc kỹ thuật của bộ ADR chấp thuận và tái phân loại Biểu đồ 10, 12 thành `CURRENT_DERIVED_VIEW`.

> ⚠️ **NGUYÊN TẮC BẤT DI BẤT DỊCH (NON-NEGOTIABLE):**
> **PHASE 11C TUYỆT ĐỐI KHÔNG TRIỂN KHAI MÃ NGUỒN (NO SOURCE IMPLEMENTATION).**
> Không tạo thư mục `apps/api`, `apps/admin-web`; không cài đặt thư viện (`zod`, `expo-sqlite`); không tạo migration DB; không sửa đổi mã nguồn mobile hay shared packages.

---

## 2. Điểm Tựa Đầu Vào (Input Baseline)

- **Trạng thái Git tại Entry Gate:** Sạch hoàn toàn (`working tree clean`).
- **Commit HEAD:** `72667843eb1a7b749c523ae70f5e857ca7376982` (Phase 11B Final Review Packet Cleanup).
- **Bộ Quyết định Kiến trúc:** 13/13 ADR đã ở trạng thái `ACCEPTED` và đóng băng:
  - Nền tảng Monorepo: ADR 0001, 0002, 0003, 0004
  - Quyết định Kiến trúc Mục tiêu: ADR 0005, 0006, 0007, 0008, 0009, 0010, 0011, 0012, 0013

---

## 3. Hệ Thống Phân Cấp Thẩm Quyền (Authority Hierarchy)

Sau Phase 11B & 11C, trật tự thẩm quyền được xác lập nghiêm ngặt:

1. **Thẩm quyền Ngữ nghĩa Nghiệp vụ (Business Semantics Authority):**
   - Bắt nguồn từ 5 văn bản nghiệp vụ đã đóng băng: [`PRODUCT.md`](PRODUCT.md), [`DOMAIN.md`](DOMAIN.md), [`ACCESS-CONTROL.md`](ACCESS-CONTROL.md), [`WORKFLOWS.md`](WORKFLOWS.md), [`REQUIREMENTS-TRACEABILITY.md`](REQUIREMENTS-TRACEABILITY.md) kết hợp các chứng cứ đối soát nghiệp vụ (`docs/business-reconciliation/**`).
   - Bất biến: Không có bất kỳ thay đổi nào về vai trò, trạng thái, lệnh nghiệp vụ, ma trận quyền hay quy trình vận hành.
2. **Thẩm quyền Kiến trúc Kỹ thuật (Technical Architecture Authority):**
   - Bắt nguồn từ bộ ADR đã chấp thuận: [`docs/adr/0001-monorepo-foundation.md`](adr/0001-monorepo-foundation.md) đến [`docs/adr/0013-backend-runtime-persistence-topology.md`](adr/0013-backend-runtime-persistence-topology.md).
   - [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) là tài liệu hợp nhất chuẩn tắc phản ánh các quyết định đã được duyệt.
   - *Nguyên tắc trọng tài:* Nếu có mâu thuẫn giữa `ARCHITECTURE.md` và một ADR đã chấp thuận, **ADR luôn luôn chiến thắng** cho đến khi tài liệu kiến trúc được hiệu chỉnh.
3. **Biểu đồ Kiến trúc (Diagrammatic Views):**
   - **CHỈ LÀ GÓC NHÌN DẪN XUẤT (`DERIVED VIEWS ONLY`).**
   - Biểu đồ không có thẩm quyền ban hành quyết định kiến trúc hay nghiệp vụ. Nếu biểu đồ xung đột với ADR hoặc văn bản chuẩn tắc, văn bản chuẩn tắc luôn luôn chiến thắng.

---

## 4. Danh Mục Quyết Định Kiến Trúc Đã Chấp Thuận (Accepted ADR Inventory)

| Mã ADR | Tiêu đề Kiến trúc | Trạng thái | Phân loại | Tóm tắt Quyết định Đã Chấp thuận |
| :--- | :--- | :--- | :--- | :--- |
| **ADR 0001** | Monorepo Foundation | `ACCEPTED` | Nền tảng | Monorepo npm workspaces chuẩn hóa, quản lý chung `apps/*` và `packages/*`. |
| **ADR 0002** | Hermes Agent Submodule | `ACCEPTED` | Nền tảng | Submodule git độc lập `external/hermes-agent`, ghim commit, cấm chỉnh sửa trực tiếp. |
| **ADR 0003** | Contract-First REST API | `ACCEPTED` | Nền tảng | REST v1 contract-first qua `packages/contracts`, envelopes chuẩn hóa (`ApiSuccess`, `ApiFailure`). |
| **ADR 0004** | Shared UI Design Tokens | `ACCEPTED` | Nền tảng | Token thiết kế dùng chung tại `packages/ui` theo quy chuẩn `DESIGN.md`. |
| **ADR 0005** | Dedicated Admin Web Client Topology | `ACCEPTED` | Cấu trúc Client | Cổng Quản trị Web độc lập (`apps/admin-web`) cho Platform Admin; Server API là ranh giới ủy quyền. |
| **ADR 0006** | IAM Session Lifecycle & Freshness | `ACCEPTED` | Định danh & Phiên | Access token ngắn hạn + rotating refresh token (RTR) + kiểm tra tươi tài khoản tức thì (`WF-12`). |
| **ADR 0007** | 3-Tier Defense-in-Depth Authorization | `ACCEPTED` | Phân quyền | 3 tầng phòng thủ: Presentation Advisory -> Server HTTP Gate -> Domain Core Eligibility (`SoD-02`). |
| **ADR 0008** | Offline Durable Storage & Outbox | `ACCEPTED` | Ngoại tuyến Mobile | `expo-sqlite` (dữ liệu cấu trúc + Outbox), Sandbox Disk (ảnh bằng chứng), SecureStore (khóa). |
| **ADR 0009** | Concurrency (OCC) & Idempotency Strategy | `ACCEPTED` | Toàn vẹn Giao dịch | OCC qua `expectedVersion` (409 Conflict) + Header `Idempotency-Key` bảo vệ retry ngoại tuyến. |
| **ADR 0010** | Contracts Runtime Validation & API Governance | `ACCEPTED` | Giao diện API | Schema-first với Zod, suy diễn kiểu `z.infer<T>`, phân loại 7 nhóm API exposure (48 lệnh != 48 endpoints). |
| **ADR 0011** | Audit Trail Persistence & Integrity | `ACCEPTED` | Kiểm toán | Bảng AuditEvent trung tâm, append-only, phân tách đặc quyền DB (`INSERT/SELECT` cấp, `UPDATE/DELETE` tước). |
| **ADR 0012** | Clean Architecture Transitional Facade | `ACCEPTED` | Kiến trúc Nội bộ | Phân tầng Presentation -> Application -> Domain, Infrastructure cài đặt Ports; Server là ranh giới tối cao. |
| **ADR 0013** | Backend Runtime & Persistence Topology | `ACCEPTED` | Topology Máy chủ | Modular Monolith (`apps/api`), 5 Bounded Contexts logic chung 1 backend, Relational DB Family (vendor mở). |

---

## 5. Đối Soát & Hiệu Chỉnh ARCHITECTURE.md

Tài liệu [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) đã được tái cấu trúc toàn diện với các điều chỉnh chuẩn tắc:

1. **Hiệu chỉnh Tiêu đề & Thẩm quyền Văn bản:**
   - Thay thế *"Proposed Target Architecture — Subject to ADR Approval"* bằng:
     `TARGET TECHNICAL ARCHITECTURE — ACCEPTED ADR BASELINE — DOCUMENTED DERIVATION OF ADR 0001..0013`.
   - Xác lập rõ ràng vị thế của `ARCHITECTURE.md` là văn bản kỹ thuật chuẩn tắc hợp nhất, lấy bộ ADR 0001..0013 làm nguồn gốc quyết định bất biến.
2. **Bảo tồn Tuyệt đối Phân tích Hiện trạng (AS-IS Architecture):**
   - Giữ nguyên toàn bộ phân tích về cấu trúc Fat Client Monolith tại commit `2f9a26b` trong Mục 2.
   - Ghi nhận đầy đủ 7 khuyết tật kỹ thuật hiện trạng: Ép vai trò Admin thành Manager, Phân quyền nhị phân `isStaff`, Lưu trữ RAM tạm thời mất dữ liệu khi kill app, Thiếu backend máy chủ, Hợp đồng thiếu các trạng thái đóng băng, Nguy cơ xung đột đồng thời, và Nhật ký kiểm toán chưa bền vững.
3. **Bổ sung Ma trận Trạng thái Kiến trúc (Architecture Status Matrix):**
   - Trình bày bảng ma trận 11 chiều tại Mục 1, ánh xạ từng quyết định kiến trúc với mã ADR và phân định rõ trạng thái triển khai: `NOT_IMPLEMENTED`, `PARTIALLY_PRESENT`, `AS_IS_GAP`. Không tuyên bố khống rằng kiến trúc mục tiêu đã được triển khai.
4. **Loại bỏ Hoàn toàn Thuật ngữ Lạc hậu:**
   - Đã làm sạch các cụm từ: *"Subject to ADR Approval"*, *"PROPOSED"*, *"NEEDS_DECISION"*, *"Admin delivery channel TBD"*, *"MMKV"* (khỏi mục tiêu), *"SubmitTaskEvidence"* (thay bằng `SubmitEvidence`), *"JWT/JWKS mandatory"*, *"Audit hash-chain MVP"*.
5. **Bổ sung Bảng Quyết định Mở Cấp Cài đặt (Open Decisions):**
   - Định vị rõ các tham số mở không chặn kiến trúc tại Mục 4 (RDBMS vendor, HTTP framework, ORM, cấu trúc token, TTL số học, thuật toán băm mật khẩu, hạn mức dọn ảnh, web framework, cloud provider).
6. **Bổ sung Bảng Phân định MVP vs Làm cứng Tương lai (Future Hardening):**
   - Phân tách rõ các tính năng MVP với các năng lực mở rộng tương lai (Hash-chaining, External trust anchor, Break-glass, Dynamic policy findings, Push notifications) tại Mục 5.
7. **Bổ sung Ma trận Truy vết Ngang (Cross-Document Traceability Matrix):**
   - Lập bảng truy vết đầy đủ giữa từng chương mục của `ARCHITECTURE.md` với các ADR nền tảng và ADR mục tiêu tương ứng tại Mục 6.

---

## 6. Đối Soát Topology Client (Client Topology Reconciliation)

1. **Field Operations Mobile (`apps/mobile`):**
   - Nền tảng: React Native / Expo SDK 57.
   - Phục vụ: Field Staff & Operations Manager.
   - Vai trò: Không gian thao tác hiện trường và điều phối tác nghiệp cục bộ.
   - **Thẩm quyền: CLIENT ADVISORY ONLY.** Mọi tính toán điều kiện hay kiểm tra trạng thái trên mobile chỉ mang tính tư vấn hỗ trợ trải nghiệm người dùng (UX), không có giá trị quyết định chuyển dịch trạng thái nghiệp vụ cuối cùng.
2. **Platform Admin Web Console (`apps/admin-web`):**
   - Nền tảng: Dedicated Web Workspace (React / Web).
   - Phục vụ: Platform Administrator (ADR 0005).
   - Phân loại: **ACCEPTED TARGET COMPONENT — NOT YET IMPLEMENTED**.
   - **Ranh giới Bảo mật:** Giao diện Web Console KHÔNG PHẢI là ranh giới bảo mật. Server API là nơi thực thi kiểm tra phân quyền tối cao trên mọi request.
   - **Phạm vi Năng lực Chuẩn tắc:** Quản trị tài khoản (Invite, Suspend, Disable), Quản lý mẫu chính sách (Proof Profiles, Checklists), Tra cứu nhật ký kiểm toán (View/Filter Audit Log), và tra cứu lịch sử cây chỉ đọc `OP-22 ViewCareHistory`.
   - **Ranh giới Cấm:** Admin tuyệt đối không có năng lực thực thi tác vụ hiện trường, chuyển trạng thái Task, phân công công việc hay duyệt bằng chứng (không vi phạm Separation of Duties).

---

## 7. Đối Soát Topology Backend (Backend Topology Reconciliation)

1. **Authoritative Server (`apps/api`):**
   - Định hướng công nghệ: Node.js / TypeScript.
   - Hình thái kiến trúc: **Modular Monolith (Đơn khối Mô-đun hóa)** theo ADR 0013.
   - Phân loại: **ACCEPTED TARGET COMPONENT — NOT YET IMPLEMENTED**.
   - Cấu trúc triển khai: Một tiến trình backend duy nhất, một ranh giới triển khai thống nhất, phục vụ toàn bộ API REST v1.
2. **5 Module Logic Nội Bộ (5 Bounded Contexts):**
   - Đúng 5 ngữ cảnh chuẩn tắc theo `DOMAIN.md`:
     1. `Work Management` (Phân loại: CORE)
     2. `Tree Asset Registry` (Phân loại: SUPPORTING)
     3. `Policy & Template Governance` (Phân loại: SUPPORTING)
     4. `Audit & Compliance` (Phân loại: SUPPORTING)
     5. `Identity & Access Management` (Phân loại: GENERIC)
   - **Định đề Kiến trúc Bắt buộc:** Bounded Context $\neq$ Microservice $\neq$ npm package $\neq$ Cơ sở dữ liệu riêng biệt.
3. **Kỷ luật Thẩm quyền Đột biến Dữ liệu Liên Module (Cross-Module Invariant):**
   - Dù chia sẻ chung một cơ sở dữ liệu quan hệ vật lý, **Module A tuyệt đối không được phép trực tiếp đột biến bảng do Module B sở hữu bằng SQL tùy tiện**.
   - Mọi thao tác nghiệp vụ xuyên ngữ cảnh bắt buộc phải đi qua In-Process Module Interfaces do module sở hữu công bố.
   - Khóa ngoại (Foreign Keys) giữa các bảng là cơ chế bảo toàn toàn vẹn tham chiếu ở tầng vật lý, **KHÔNG trao quyền đột biến dữ liệu chéo**.

---

## 8. Đối Soát IAM & Kiến Trúc Phân Quyền (IAM / Authorization)

1. **Mô hình Phòng thủ Theo chiều sâu 3 Tầng (3-Tier Defense-in-Depth):**
   - **Tier 1 (Client Presentation):** Tư vấn UX, hiển thị/ẩn nút, cảnh báo sớm. Không có thẩm quyền nghiệp vụ.
   - **Tier 2 (Server Request Gate):** Middleware máy chủ xác thực tính hợp lệ của token, kiểm tra độ tươi tài khoản `AccountStatus == ACTIVE` tức thì (tuân thủ quy chuẩn đình chỉ `WF-12`), kiểm tra phiên `authVersion`, và phân quyền thô theo Route/Role.
   - **Tier 3 (Application / Domain Core):** Đánh giá tính hợp lệ nghiệp vụ chuẩn tắc tối cao:
     $$\text{Eligibility} = \text{Role} \wedge \text{Scope} \wedge \text{State} \wedge \text{Preconditions}$$
     kèm cơ chế kiểm soát tách biệt trách nhiệm `SoD-02` (người nộp bằng chứng không được tự duyệt bằng chứng của chính mình).
2. **Vòng đời Phiên & Độc lập Triển khai:**
   - Access credential ngắn hạn + Rotating Refresh Credential (RTR).
   - Thu hồi phiên tức thì qua việc tăng `authVersion` trên hồ sơ tài khoản tại Server.
   - Tài khoản bị `SUSPENDED` hoặc `DISABLED` bị chặn truy cập trên toàn bộ các yêu cầu bảo vệ (kể cả đọc, ghi, duyệt, quản trị).
   - Form nháp và bằng chứng cục bộ trên mobile của tài khoản bị khóa được bảo tồn an toàn trong SQLite và Disk sandbox, sẵn sàng phục hồi khi tài khoản được kích hoạt lại.
   - Các chi tiết như định dạng token (JWT vs Opaque), thuật toán ký, thời gian sống TTL được ghi nhận là quyết định mở cấp cài đặt.

---

## 9. Đối Soát Hợp Đồng & API (Contracts & API Architecture)

1. **Chuẩn Hóa Hợp Đồng REST v1:**
   - Tiếp cận Contract-First với thư viện Zod tại `packages/contracts`, tự động suy diễn kiểu TypeScript qua `z.infer<T>`.
   - Phong bì phản hồi chuẩn hóa: `ApiSuccess<T>`, `ApiFailure` với mã lỗi chuẩn tắc (`DOMAIN_RULE_VIOLATION`, `UNAUTHORIZED`, `FORBIDDEN`, `STALE_VERSION`, v.v.).
2. **Phân Định Rõ Khái Niệm:**
   - $\text{Business Command} \neq \text{HTTP Route} \neq \text{DTO Payload} \neq \text{HTTP Header}$.
   - Khóa phi trùng lặp (`Idempotency-Key`) được vận chuyển hoàn toàn qua HTTP Header, không đưa vào Body của lệnh nghiệp vụ.
   - Khóa kiểm soát đồng thời (`expectedVersion`) được đặt trong Body của các lệnh đột biến trạng thái trên Aggregate đã có phiên bản (không áp dụng bắt buộc trên toàn bộ các lệnh tạo mới).
3. **Phân Loại Phơi Bày API (API Exposure Categories):**
   - 48 lệnh nghiệp vụ không đồng nghĩa với 48 endpoint HTTP công khai.
   - Phân loại rõ ràng 7 nhóm theo ADR 0010: `EXTERNAL_OPERATIONAL_API`, `EXTERNAL_GOVERNANCE_API`, `EXTERNAL_READ_API`, `CLIENT_LOCAL_ADVISORY`, `SYSTEM_INTERNAL`, `FUTURE_NOT_ACTIVE`, `NOT_NETWORK_EXPOSED`.

---

## 10. Đối Soát Lưu Trữ Ngoại Tuyến & Outbox (Offline / Outbox)

1. **Kiến Trúc Lưu Trữ Mobile:**
   - `expo-sqlite`: Lưu trữ bảng dữ liệu cấu trúc cục bộ (Tasks, Trees, Form Drafts) và Hàng đợi Outbox bền vững.
   - `Application Sandbox Filesystem`: Lưu trữ tệp nhị phân ảnh chụp bằng chứng gốc.
   - `expo-secure-store`: Lưu trữ an toàn khóa phiên, token làm mới và thông tin xác thực.
2. **Cơ Chế Outbox Bền Vững:**
   - Lưu trữ lệnh nộp bằng chứng kèm `Idempotency-Key` cố định duy nhất cho mỗi lượt thực hiện tác vụ.
   - Tự động thử lại khi có mạng mà không sinh ra trùng lặp nghiệp vụ.
3. **Phân Định Ba Chiều Trạng Thái Độc Lập:**
   - `TaskStatus` (Trạng thái vòng đời tác vụ do Server làm chủ).
   - `LocalSubmissionStatus` (Trạng thái nộp bằng chứng cục bộ trên máy).
   - `SyncStatus` (Trạng thái đồng bộ mạng của bản ghi Outbox).
4. **Nguyên Tắc Hòa Giải Xung Đột (Conflict Reconciliation):**
   - Bằng chứng và tệp ảnh chụp tại hiện trường được bảo toàn nguyên vẹn trên bộ nhớ máy trước mọi lỗi (lỗi mạng, lỗi xác thực, lỗi phiên, lỗi xung đột phiên bản).
   - Khi Server từ chối cập nhật do xung đột trạng thái hợp lệ, Mobile phải hòa giải và cập nhật `TaskStatus` theo Server. **Bảo tồn bằng chứng không có nghĩa là Mobile được quyền ép Server chấp nhận trạng thái cục bộ.**

---

## 11. Đối Soát Concurrency (OCC) & Idempotency

1. **Kiểm Soát Đồng Thời Lạc Quan (OCC):**
   - Thuộc tính `expectedVersion` bắt buộc trên các mutation request tác động lên Aggregate đã có phiên bản.
   - Trả về mã lỗi chuẩn `409 CONFLICT` / `STALE_VERSION` khi phiên bản tại máy chủ đã bị thay đổi bởi thao tác khác.
2. **Khóa Phi Trùng Lặp (Idempotency-Key):**
   - Header `Idempotency-Key: <UUID>` được sinh ra tại Client và gắn chặt với một chu kỳ thao tác logic.
   - Cùng một thao tác retry gửi lại chính xác cùng một khóa; Server nhận diện khóa đã xử lý thành công sẽ trả về kết quả đã lưu trữ mà không thực thi lại logic nghiệp vụ.
   - Bất biến thời gian sống: `Thời gian lưu trữ bản ghi idempotency tại Server >= Chân trời thử lại ngoại tuyến tối đa của Client`.

---

## 12. Đối Soát Kiến Trúc Kiểm Toán (Audit Architecture)

1. **Ghi Nhận Nhật Ký Kiểm Toán Trung Tâm:**
   - Bảng `AuditEvent` được lưu trữ tập trung tại Server, cấu trúc Append-Only.
   - Ghi nhận ngay lập tức trong cùng giao dịch hoặc sau khi hoàn tất các biến cố nghiệp vụ quan trọng.
   - Hỗ trợ lập chỉ mục tối ưu phục vụ hai năng lực tra cứu: `ViewAuditLog` và `FilterAuditLog`.
2. **Phân Tách Đặc Quyền Cơ Sở Dữ Liệu (Database Privilege Separation):**
   - Tài khoản kết nối DB của ứng dụng API chỉ được cấp quyền: `INSERT, SELECT`.
   - Thu hồi triệt để các quyền: `UPDATE, DELETE, TRUNCATE` trên bảng `AuditEvent`.
3. **Xác Định Đúng Ranh Giới An Toàn:**
   - Cơ chế này bảo vệ nhật ký kiểm toán trước các lỗ hổng ứng dụng, truy cập bất hợp pháp của người dùng thông thường và sai sót phần mềm.
   - **Không tuyên bố khống về khả năng chống chối bỏ cấp độ mật mã (cryptographic non-repudiation).** Cơ chế không ngăn chặn được Quản trị viên cơ sở dữ liệu tối cao (Root DBA) hoặc quản trị hạ tầng lưu trữ.
   - Chuỗi băm mật mã (Hash chaining) được phân loại chính xác là tùy chọn làm cứng trong tương lai (`FUTURE_HARDENING`), không thuộc phạm vi MVP.

---

## 13. Quyết Định Xử Lý Biểu Đồ 08 (Diagram 08 Reconciliation)

- **Tệp:** [`docs/diagrams/08-role-information-architecture.html`](diagrams/08-role-information-architecture.html).
- **Hiện trạng trước đối soát:** Chứa 3 vị trí ghi nhận kênh phân phối của Admin là *"TBD — Hoãn lại cho Phase 11 ADR"* và banner nguồn gốc chưa dẫn chiếu quyết định ADR 0005.
- **Xử lý đối soát:** Hiệu chỉnh phẫu thuật đúng các phát biểu kỹ thuật này:
  - Dòng 107: Cập nhật banner nguồn gốc hiển thị: `SOURCE: docs/PRODUCT.md, docs/ACCESS-CONTROL.md, docs/WORKFLOWS.md + ADR 0005 | STATUS: DERIVED VIEW — NOT SOURCE OF TRUTH`.
  - Dòng 111: `...Platform Administrator Workspace — Dedicated Admin Web đã được chấp thuận tại ADR 0005.`
  - Dòng 314-317: Đổi nhãn sang màu xanh dương, cập nhật nội dung: `KÊNH PHÂN PHỐI: DEDICATED ADMIN WEB (ADR 0005)`.
  - Dòng 394: `• Kênh phân phối cho Platform Admin đã được chấp thuận chính thức tại ADR 0005 là Cổng Quản trị Web độc lập (apps/admin-web). Server API vẫn là ranh giới ủy quyền tối cao.`
- **Bảo toàn:** Toàn bộ cấu trúc thông tin nghiệp vụ, các vùng chức năng, và phân quyền 3 vai trò con người được giữ nguyên 100%.

---

## 14. Đối Soát Biểu Đồ 10 (Diagram 10 Reconciliation)

- **Tệp:** [`docs/diagrams/10-system-target-architecture.html`](diagrams/10-system-target-architecture.html).
- **Huy hiệu & Thẩm quyền:**
  - Banner: `STATUS: ACCEPTED TARGET ARCHITECTURE — DERIVED VIEW`.
  - Source: `SOURCE: docs/ARCHITECTURE.md + ADR 0005..0013 | DERIVED VIEW — NOT SOURCE OF TRUTH`.
- **Nội dung Trực quan Hóa:**
  1. *Tầng Client Surfaces (Advisory Only):*
     - `apps/mobile`: Field Operations Mobile (Staff & Manager), hiển thị 4 khối lưu trữ ngoại tuyến (`expo-sqlite`, App Sandbox Disk, `expo-secure-store`, Durable Outbox Queue).
     - `apps/admin-web`: Dedicated Web Console (Platform Administrator), gán nhãn nổi bật `ACCEPTED TARGET COMPONENT — NOT YET IMPLEMENTED`.
  2. *Ranh giới Hợp đồng REST v1:*
     - Khung kết nối `@novyx/contracts`, hiển thị Header `Authorization: Bearer`, Header `Idempotency-Key`, thuộc tính OCC `expectedVersion`, và schema-first validation qua Zod.
  3. *Ranh giới Server Tối cao (Server Authoritative):*
     - `apps/api`: Modular Monolith backend, gán nhãn `ACCEPTED TARGET COMPONENT — NOT YET IMPLEMENTED`.
     - Tầng Tier 2 Request Security Gate (`AccountStatus == ACTIVE`, `authVersion` freshness, route security).
     - 5 Module Bounded Context logic: Work Management (Core), Tree Asset (Supporting), Policy Governance (Supporting), Audit & Compliance (Supporting), IAM (Generic).
     - Biển cảnh báo quy tắc cấm đột biến SQL chéo module.
  4. *Tầng Hạ tầng Lưu trữ:*
     - Relational Database Family (Vendor neutral, ghi rõ PostgreSQL chỉ là minh họa).
     - Khối Audit Trail với Database Privilege Separation (`INSERT/SELECT` cấp, `UPDATE/DELETE/TRUNCATE` tước).
     - Khối Binary Object Store tách biệt.
  5. *Loại trừ Tuyệt đối:* Không mô tả microservices, Kafka, Redis, Kubernetes, blockchain hay audit hash-chain như yêu cầu bắt buộc của MVP.

---

## 15. Đối Soát Biểu Đồ 12 (Diagram 12 Reconciliation)

- **Tệp:** [`docs/diagrams/12-architecture-dependency-map.html`](diagrams/12-architecture-dependency-map.html).
- **Huy hiệu & Thẩm quyền:**
  - Banner: `STATUS: ACCEPTED ARCHITECTURE DEPENDENCY MAP — DERIVED VIEW`.
  - Source: `SOURCE: docs/ARCHITECTURE.md, AGENTS.md & ADR 0001..0013 | DERIVED VIEW — NOT SOURCE OF TRUTH`.
- **Cấu trúc Nút:**
  1. *Ứng dụng (`apps/*`):*
     - `apps/mobile`: Hiện hữu, phụ thuộc vào `contracts`, `ui`, `config`.
     - `apps/admin-web`: Mục tiêu chưa triển khai (`NOT YET IMPLEMENTED`), phụ thuộc vào `contracts`, `config`, `ui` (phần tương thích web).
     - `apps/api`: Mục tiêu chưa triển khai (`NOT YET IMPLEMENTED`), phụ thuộc vào `contracts`, `config`. **Tuyệt đối cấm phụ thuộc vào `packages/ui`**.
  2. *Gói Dùng Chung (`packages/*`):*
     - `packages/contracts`: Envelopes, DTOs, Zod validation schemas. Không phụ thuộc vào apps hay DB.
     - `packages/config`: Trình xác thực biến môi trường.
     - `packages/ui`: Shared design tokens.
  3. *Submodule Ngoài:*
     - `external/hermes-agent`: Pinned commit theo ADR 0002. Cấm deep import, cấm sửa trực tiếp trong product work.
  4. *Chi tiết Nội bộ `apps/api`:*
     - Phân tầng Clean: Presentation -> Application -> Domain Core; Infrastructure cài đặt Ports.
     - Gọi tên rõ ràng 5 Bounded Contexts logic bên trong `apps/api`.
     - Nhấn mạnh: **Bounded Context $\neq$ npm package $\neq$ microservice**.
  5. *Quy tắc Cấm:*
     - Cấm chiều phụ thuộc ngược: Packages $\to$ Apps.
     - Cấm API import UI tokens.
     - Cấm đột biến SQL chéo module trong backend.

---

## 16. Đối Soát Danh Mục Biểu Đồ (Diagram Inventory Reconciliation)

Tài liệu [`docs/diagrams/README.md`](diagrams/README.md) đã được cập nhật đồng bộ:

1. **Phân định Hai Miền Thẩm Quyền:**
   - Miền Nghiệp vụ Sản phẩm: Bắt nguồn từ 5 tài liệu nghiệp vụ đóng băng.
   - Miền Kiến trúc Kỹ thuật: Bắt nguồn từ `docs/ARCHITECTURE.md` và bộ ADR 0001..0013 đã chấp thuận.
2. **Tái Phân Loại Chuẩn Tắc:**
   - Biểu đồ 10: Chuyển từ `TARGET_DIRECTION_NOT_ARCHITECTURE` sang `CURRENT_DERIVED_VIEW`.
   - Biểu đồ 12: Chuyển từ `DEFERRED_UNTIL_ADR` sang `CURRENT_DERIVED_VIEW`.
   - Cập nhật mô tả nhóm `CURRENT_DERIVED_VIEW` để bao gồm cả các góc nhìn kiến trúc kỹ thuật đã có ADR phê duyệt.
3. **Cập Nhật Bảng Danh Mục Tổng Thể:**
   - Cập nhật dòng Biểu đồ 08, 10, 12 với cột Lần đối soát gần nhất là `Phase 11C Reconciled` và ghi chú rõ ràng về các quyết định kiến trúc tương ứng.

---

## 17. Bảo Tồn Biểu Đồ Hiện Trạng & Lịch Sử (Preserved Historical / AS-IS Views)

Tuân thủ nghiêm ngặt nguyên tắc bảo toàn tính chân thực lịch sử:

- **Biểu đồ Lịch sử (`HISTORICAL_SUPERSEDED`):**
  - Biểu đồ 03, 04, 05, 06, 11 được giữ nguyên 100% không chỉnh sửa, bảo lưu đầy đủ bằng chứng tiến hóa từ mô hình cũ.
- **Biểu đồ Hiện trạng Mã nguồn Thực tế (`AS_IS_IMPLEMENTATION_VIEW`):**
  - Biểu đồ 09 giữ nguyên 100%, phản ánh trung thực kiến trúc Fat Client Monolith tại commit `2f9a26b` kèm nhãn khuyết tật `[AS-IS DEFECT]`.
  - Không xóa bỏ khuyết tật hiện trạng để làm đẹp báo cáo.

---

## 18. Danh Mục Quyết Định Mở Cấp Triển Khai (Open Implementation Decisions)

Bảng tổng hợp các quyết định mở đã được ghi nhận rõ ràng tại Mục 4 của `docs/ARCHITECTURE.md`. Các quyết định này không gây tắc nghẽn kiến trúc và sẽ được lựa chọn trong quá trình lập kế hoạch triển khai (Implementation Planning):

| Hạng mục Quyết định | Tùy chọn Ứng viên Khả thi | Tiêu chí Định hướng | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Relational DB Vendor** | PostgreSQL, MySQL, SQL Server | Tính phổ biến, hỗ trợ JSONB, ACID vững chắc, chi phí vận hành | Bounded Choice (PostgreSQL khuyến nghị nhưng không khóa cứng) |
| **HTTP Web Framework** | Fastify, Express | Hiệu năng, hệ sinh thái schema validation, hỗ trợ TypeScript | Bounded Choice |
| **ORM / Data Mapper** | Drizzle, Kysely, Prisma | Type-safety, hiệu năng truy vấn, khả năng kiểm soát SQL | Bounded Choice |
| **Định dạng Access Token** | Signed JWT (HS256/RS256/ES256) hoặc Opaque Token | Stateless verification vs Thu hồi tức thời, độ phức tạp hạ tầng | Bounded Choice |
| **Thời gian sống Token (TTL)** | Access Token: 5–15 phút; Refresh Token: 7–30 ngày | Cân bằng giữa an ninh và trải nghiệm người dùng hiện trường | Bounded Choice |
| **Thuật toán Băm Mật khẩu** | Argon2id, bcrypt, scrypt | Chuẩn bảo mật OWASP, khả năng chống tấn công phần cứng GPU | Bounded Choice |
| **Thời gian Lưu Idempotency** | 24 giờ – 7 ngày | Đảm bảo $\ge$ chân trời retry ngoại tuyến tối đa của thiết bị | Bounded Choice |
| **Ngưỡng Dọn Ảnh Rác (GC)** | 7–30 ngày sau khi Task kết thúc | Tối ưu hóa dung lượng lưu trữ của thiết bị di động | Bounded Choice |
| **Admin Web Framework** | Vite + React, Next.js SPA | Tính đơn giản, tốc độ build, không cần server-side rendering phức tạp | Bounded Choice |
| **Hạ tầng Triển khai (Hosting)** | Docker container trên Cloud VM, PaaS (Render, Fly.io, AWS) | Tối giản chi phí giai đoạn MVP, dễ dàng mở rộng | Bounded Choice |
| **Lưu trữ Đối tượng (Object Store)**| S3-compatible, Cloudflare R2, MinIO, Local Disk sandbox | Tách biệt lưu trữ tệp nhị phân khỏi database quan hệ | Bounded Choice |

---

## 19. Kiểm Tra & Bác Bỏ Khẳng Định Tiêu Cực (Negative Assertions C11C-01..14)

Toàn bộ 14 khẳng định tiêu cực được rà soát và xác nhận đã bị **BÁC BỎ HOÀN TOÀN (TẤT CẢ LÀ FALSE)**:

| Mã Kiểm tra | Nội dung Khẳng định Tiêu cực | Kết quả Đánh giá | Bằng chứng Kiểm chứng Thực tế |
| :---: | :--- | :---: | :--- |
| **C11C-01** | `ARCHITECTURE.md` target still says "Subject to ADR Approval". | **BÁC BỎ (FALSE)** | Header tài liệu đã đổi thành `TARGET TECHNICAL ARCHITECTURE — ACCEPTED ADR BASELINE — DOCUMENTED DERIVATION OF ADR 0001..0013`. Không còn cụm từ "Subject to ADR Approval". |
| **C11C-02** | Admin delivery channel remains TBD. | **BÁC BỎ (FALSE)** | Cả trong `ARCHITECTURE.md` (§3.1), Diagram 08, Diagram 10 và Diagram 12 đều xác định rõ ràng kênh phân phối là Dedicated Admin Web (`apps/admin-web`) theo ADR 0005. |
| **C11C-03** | Diagram 10 says architecture not final. | **BÁC BỎ (FALSE)** | Banner Diagram 10 hiển thị: `STATUS: ACCEPTED TARGET ARCHITECTURE — DERIVED VIEW`. |
| **C11C-04** | Diagram 12 says deferred to Phase 11 ADR. | **BÁC BỎ (FALSE)** | Banner Diagram 12 hiển thị: `STATUS: ACCEPTED ARCHITECTURE DEPENDENCY MAP — DERIVED VIEW`. |
| **C11C-05** | Backend shown as microservices. | **BÁC BỎ (FALSE)** | Backend được mô tả và trực quan hóa nhất quán là Modular Monolith (`apps/api`) triển khai đơn khối; 5 Bounded Contexts là module logic nội bộ. |
| **C11C-06** | PostgreSQL shown as mandatory accepted vendor. | **BÁC BỎ (FALSE)** | `ARCHITECTURE.md` (§3.1, §4) và Diagram 10 ghi nhận rõ: "Relational Database Family = ACCEPTED"; PostgreSQL chỉ là ví dụ minh họa, vendor là quyết định mở. |
| **C11C-07** | JWT/JWKS shown as mandatory. | **BÁC BỎ (FALSE)** | `ARCHITECTURE.md` (§3.5, §4) phân loại định dạng token (JWT vs Opaque, JWKS) là quyết định mở cấp cài đặt; không áp đặt bắt buộc. |
| **C11C-08** | Audit hash chain shown as MVP. | **BÁC BỎ (FALSE)** | `ARCHITECTURE.md` (§3.9, §5) và Diagram 10 ghi nhận MVP chỉ sử dụng Phân tách Đặc quyền DB (Privilege Separation); Hash-chaining được phân loại rõ là `OPTIONAL FUTURE HARDENING`. |
| **C11C-09** | Mobile shown as authoritative authorization boundary. | **BÁC BỎ (FALSE)** | `ARCHITECTURE.md` (§3.3, §3.4) và Diagram 10 phân định rõ Mobile chỉ là Client Advisory; Server API là ranh giới ủy quyền tối cao. |
| **C11C-10** | Idempotency-Key placed inside business payload. | **BÁC BỎ (FALSE)** | `ARCHITECTURE.md` (§3.6, §3.8) và Diagram 10 ghi rõ `Idempotency-Key` là metadata vận chuyển nằm tại HTTP Header, không thuộc Payload nghiệp vụ. |
| **C11C-11** | All creation commands require expectedVersion. | **BÁC BỎ (FALSE)** | `ARCHITECTURE.md` (§3.6, §3.8) xác định rõ `expectedVersion` chỉ áp dụng trên các lệnh đột biến tác động lên Aggregate đã có phiên bản; không áp dụng trên toàn bộ lệnh tạo mới. |
| **C11C-12** | 48 commands portrayed as 48 public endpoints. | **BÁC BỎ (FALSE)** | `ARCHITECTURE.md` (§3.6) trích dẫn ADR 0010 khẳng định 48 lệnh nghiệp vụ $\neq$ 48 public endpoints, phân chia thành 7 nhóm API exposure. |
| **C11C-13** | AS-IS diagram rewritten to look like target. | **BÁC BỎ (FALSE)** | Biểu đồ 09 giữ nguyên 100% cấu trúc hiện trạng Fat Client Monolith baseline `2f9a26b` kèm nhãn `[AS-IS DEFECT]`. |
| **C11C-14** | Historical diagrams silently modernized. | **BÁC BỎ (FALSE)** | Toàn bộ các biểu đồ lịch sử 03, 04, 05, 06, 11 được bảo tồn nguyên vẹn không chỉnh sửa. |

---

## 20. Xác Minh Ranh Giới Mã Nguồn (Source Boundary Verification)

Thực hiện kiểm tra tính bất biến của mã nguồn và các tài liệu chuẩn tắc khác:

```powershell
# Kiểm tra không có thay đổi trong thư mục mã nguồn và script
git diff --name-only 72667843eb1a7b749c523ae70f5e857ca7376982 HEAD -- apps packages scripts external
# Kết quả mong đợi: 0 (rỗng)

# Kiểm tra không có thay đổi trong các tài liệu nghiệp vụ đóng băng và thư mục ADR
git diff --name-only 72667843eb1a7b749c523ae70f5e857ca7376982 HEAD -- docs/adr docs/business-reconciliation docs/PRODUCT.md docs/DOMAIN.md docs/ACCESS-CONTROL.md docs/WORKFLOWS.md docs/REQUIREMENTS-TRACEABILITY.md
# Kết quả mong đợi: 0 (rỗng)
```

**Danh sách tệp duy nhất được phép và đã điều chỉnh:**
1. `docs/ARCHITECTURE.md` (Hiệu chỉnh tiêu đề thẩm quyền, cập nhật kiến trúc mục tiêu chuẩn tắc theo ADR 0005..0013, bảo tồn AS-IS).
2. `docs/diagrams/08-role-information-architecture.html` (Sửa 3 phát biểu về kênh phân phối Admin Web theo ADR 0005).
3. `docs/diagrams/10-system-target-architecture.html` (Đồng bộ sơ đồ kiến trúc mục tiêu, Modular Monolith, 5 Bounded Contexts, Client Advisory vs Server Authoritative).
4. `docs/diagrams/12-architecture-dependency-map.html` (Đồng bộ bản đồ phụ thuộc monorepo, 5 Bounded Contexts nội bộ apps/api, quy tắc cấm).
5. `docs/diagrams/README.md` (Đồng bộ phân loại thẩm quyền kỹ thuật và danh mục biểu đồ hệ thống).
6. `docs/PHASE11C-ARCHITECTURE-RECONCILIATION.md` (Báo cáo đối soát hoàn chỉnh này).

---

## 21. Kết Luận & Trạng Thái Cuối Cùng (Final Status)

Toàn bộ 12 Cổng Đối soát (`G11C-01` đến `G11C-12`) đều đạt trạng thái **PASS**:
- [x] **G11C-01:** Toàn bộ 13 ADR đã chấp thuận giữ nguyên bất biến.
- [x] **G11C-02:** Đường cơ sở nghiệp vụ (5 tài liệu business) giữ nguyên bất biến.
- [x] **G11C-03:** Toàn bộ mã nguồn (`apps/**`, `packages/**`, `scripts/**`, `external/**`) giữ nguyên bất biến.
- [x] **G11C-04:** `ARCHITECTURE.md` không còn mô tả kiến trúc mục tiêu là chờ duyệt hay đề xuất.
- [x] **G11C-05:** Kiến trúc mục tiêu hoàn toàn khớp với bộ ADR 0005..0013.
- [x] **G11C-06:** Không có tham số cấp cài đặt nào bị nâng cấp thành luật bất biến kiến trúc.
- [x] **G11C-07:** Biểu đồ 10 phản ánh chính xác mục tiêu đã phê duyệt.
- [x] **G11C-08:** Biểu đồ 12 phản ánh chính xác các quan hệ phụ thuộc monorepo.
- [x] **G11C-09:** Phân loại trong `docs/diagrams/README.md` đã cập nhật chính xác.
- [x] **G11C-10:** Biểu đồ hiện trạng và lịch sử được bảo tồn nguyên vẹn.
- [x] **G11C-11:** Các thành phần mục tiêu (`apps/api`, `apps/admin-web`) được gắn nhãn rõ ràng `NOT YET IMPLEMENTED`.
- [x] **G11C-12:** Toàn bộ 14 khẳng định tiêu cực C11C-01..14 đều bị bác bỏ.

**KẾT LUẬN CHÍNH THỨC:**
```text
PHASE 11C COMPLETE
— ACCEPTED ADR SET RECONCILED INTO ARCHITECTURE.md
— TARGET CLIENT / SERVER TOPOLOGY DOCUMENTED
— ADMIN WEB TARGET RECONCILED
— MODULAR MONOLITH TARGET RECONCILED
— IAM / AUTHORIZATION BOUNDARIES RECONCILED
— OFFLINE / OCC / CONTRACT / AUDIT ARCHITECTURE RECONCILED
— TARGET DIAGRAMS RECONCILED
— HISTORICAL / AS-IS VIEWS PRESERVED
— NO SOURCE IMPLEMENTATION
— READY FOR POST-ADR IMPLEMENTATION PLANNING
```

---

## 22. Đóng Đối Soát Góc Nhìn Dẫn Xuất Cuối Cùng (Final Derived-View Closure)

Khắc phục triệt để 2 độ lệch góc nhìn dẫn xuất (derived-view drift) cuối cùng của Phase 11C:

1. **C11C-FINAL-01: PASS**
   - Đã loại bỏ hoàn toàn hành động tự sáng tác *"Revoke Session"* khỏi vùng hiển thị năng lực của Platform Administrator trên Biểu đồ 10 ([`docs/diagrams/10-system-target-architecture.html`](diagrams/10-system-target-architecture.html)).
   - Thay thế bằng danh mục lệnh chuẩn tắc theo `docs/ACCESS-CONTROL.md`: `ProvisionUser · AssignRole · Account Lifecycle · Unlock / ResetCredentialSetup`.
   - Tái khẳng định: Vô hiệu hóa phiên làm việc / xóa bản ghi refresh token là **hệ quả kỹ thuật phía máy chủ** (server-side consequence) của các lệnh `SuspendAccount`, `DisableAccount` hoặc thay đổi vai trò (ADR 0006), **tuyệt đối không phải là một lệnh nghiệp vụ độc lập của con người**.

2. **C11C-FINAL-02: PASS**
   - Đã bổ sung mã quyết định `ADR 0005` vào biểu ngữ nguồn gốc hiển thị trên Biểu đồ 08 ([`docs/diagrams/08-role-information-architecture.html`](diagrams/08-role-information-architecture.html)):
     `SOURCE: docs/PRODUCT.md, docs/ACCESS-CONTROL.md, docs/WORKFLOWS.md + ADR 0005 | STATUS: DERIVED VIEW — NOT SOURCE OF TRUTH`.
   - Xác nhận nguồn gốc kỹ thuật chuẩn tắc cho tuyên bố Dedicated Admin Web (`apps/admin-web`), giữ nguyên 100% cấu trúc thông tin và phân quyền vai trò.

**Tái Khẳng Định Các Cổng Trọng Tâm Sau Hiệu Chỉnh:**
- **G11C-05: PASS** — Kiến trúc mục tiêu hoàn toàn khớp với bộ ADR 0005..0013.
- **G11C-07: PASS** — Biểu đồ 10 phản ánh chính xác mục tiêu đã phê duyệt, không có lệnh tự chế.
- **G11C-09: PASS** — Nguồn gốc và phân loại biểu đồ đồng bộ, nhất quán với `docs/diagrams/README.md`.
