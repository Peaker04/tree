# Ma Trận Truy Vết Triển Khai Kỹ Thuật (Phase 12 Implementation Traceability)

**Dự án:** NOVYX GreenOps
**Giai đoạn:** Phase 12A — Technical Traceability Matrix
**Ngày lập:** 21/09/2026
**Commit Baseline:** `873533248ca62d7eb08b84f2245ce1f4dec74150`
**Tài liệu Nguồn:** [`docs/REQUIREMENTS-TRACEABILITY.md`](REQUIREMENTS-TRACEABILITY.md), [`docs/NFR.md`](NFR.md), [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/adr/`](adr/)

---

## 1. Nguyên Tắc Quản Trị Truy Vết (Traceability Governance)

1. **Khóa Chặt Độ Lệch Nghiệp Vụ (Zero Semantic Drift):**
   Mọi hạng mục công việc trong toàn bộ 9 đợt triển khai (Wave 0..8) bắt buộc phải có nguồn gốc truy vết trực tiếp từ:
   - Một Năng lực Nghiệp vụ Chuẩn tắc (`CAP-01..05`, `CAP-ADM-01..09`), hoặc
   - Một Quy tắc Bất biến Miền Nghiệp vụ (`DR-01..10`), hoặc
   - Một Quy chuẩn Phân quyền / Vòng đời (`AC-*`, `WF-*`, `OP-*`, `GV-*`), hoặc
   - Một Kịch bản Thuộc tính Chất lượng (`QAS-*`).
2. **Khóa Chặt Quyết Định Kiến Trúc Đã Chấp Thuận:**
   Mọi giải pháp kỹ thuật bắt buộc phải trỏ chính xác về một ADR đã được Chủ quản phê duyệt (`ADR 0001..0013`) và chương mục tương ứng trong [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).
3. **Tiêu Chí Chấp Nhận Thực Nghiệm (Executable Evidence):**
   Không chấp nhận các tuyên bố trừu tượng (như "đã được kiến trúc bảo vệ"). Mọi yêu cầu truy vết phải kết thúc bằng phương thức kiểm thử tự động khả thi và bằng chứng đầu ra đo đạc được.

---

## 2. Ma Trận Truy Vết Năng Lực Nghiệp Vụ & Khoảng Cách Triển Khai (Capability to Implementation Traceability)

| Yêu Cầu Nghiệp Vụ Đóng Băng | ADR Chấp Thuận | Mục Kiến Trúc (`ARCHITECTURE.md`) | Khoảng Cách Kỹ Thuật Hiện Trạng | Đợt Triển Khai (`Wave`) | Thành Phần Đích (`Component`) | Phương Thức Kiểm Chứng (`Verification Method`) | Bằng Chứng Nghiệm Thu Đầu Ra (`Acceptance Evidence`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **CAP-02** / `WF-01..09`, `DR-01..10` (Task Lifecycle 7 Trạng Thái) | ADR 0003, ADR 0010, ADR 0012 | §3.2, §3.6 | `IMP-GAP-003`, `IMP-GAP-015` | **Wave 1** (Contracts), **Wave 4** (Domain) | `packages/contracts`, `apps/api/work-management` | Unit test máy trạng thái 7 bước, Zod schema validation test | `test-task-lifecycle.spec.ts` pass 100%, từ chối trạng thái lạ |
| **CAP-01** / `WF-03`, `DR-04..05` (Xác Thực Hiện Trường GPS/QR) | ADR 0010, ADR 0012 | §3.2, §3.6 | `IMP-GAP-004`, `IMP-GAP-014` | **Wave 1** (Contracts), **Wave 4** (Domain), **Wave 5** (Mobile) | `packages/contracts`, `apps/api`, `apps/mobile` | Integration test xác thực tọa độ GPS $\le 10\text{m}$ và quét QR gốc cây | Log xác thực GPS/QR thành công, chặn nộp nếu khoảng cách $> 10\text{m}$ |
| **CAP-01** / `WF-04`, `DR-06..07` (3 Hồ Sơ Bằng Chứng Ngữ Nghĩa) | ADR 0003, ADR 0010, ADR 0012 | §3.2, §3.6 | `IMP-GAP-004`, `IMP-GAP-015` | **Wave 1** (Contracts), **Wave 4** (Domain), **Wave 5** (Mobile) | `packages/contracts`, `apps/api`, `apps/mobile` | Contract tests cho `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF` | Zod schema reject nếu thiếu ảnh/checklist theo từng profile |
| **CAP-04** / `WF-06..07`, `DR-08` (Thẩm Định & Rework Mục Tiêu) | ADR 0003, ADR 0010, ADR 0012 | §3.2, §3.6 | `IMP-GAP-004`, `IMP-GAP-015` | **Wave 1** (Contracts), **Wave 4** (Domain) | `packages/contracts`, `apps/api/work-management` | Unit test 4 kết luận duyệt chuẩn tắc: `APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL` | Bảo tồn bằng chứng hợp lệ khi rework; chuyển trạng thái đúng 100% |
| **CAP-01, CAP-02** / `WF-08`, `DR-03` (Báo Cáo Sự Cố & 3 Lối Thoát Blocked) | ADR 0003, ADR 0010, ADR 0012 | §3.2, §3.6 | `IMP-GAP-003`, `IMP-GAP-015` | **Wave 1** (Contracts), **Wave 4** (Domain) | `packages/contracts`, `apps/api/work-management` | Unit test chuyển `IN_PROGRESS -> BLOCKED` và 3 lệnh giải cứu (`ResumeBlockedTask`, `ReassignTask`, `CancelTask`) | Cấm chuyển `REWORK_REQUIRED -> BLOCKED`, test case assert rejection |
| **CAP-03** / `BR-11`, `WF-06`, `DR-09` (Hồ Sơ Cây & CareHistory Chiếu) | ADR 0003, ADR 0010, ADR 0013 | §3.2, §3.6 | `IMP-GAP-009` | **Wave 4** (Domain & API) | `apps/api/tree-asset` | Integration test CareHistory projection: chỉ chiếu task `COMPLETED` | Bảng chiếu lịch sử không chứa task `PENDING` hay `REWORK` |
| **CAP-01, CAP-02** / `WF-02..05` (Quản Lý Việc Hiện Trường & Offline) | ADR 0008, ADR 0009 | §3.7, §3.8 | `IMP-GAP-006`, `IMP-GAP-008` | **Wave 5** (Mobile Offline) | `apps/mobile` (SQLite, Outbox) | E2E offline test: Bật Airplane mode, nộp báo cáo, tắt app, mở lại sync | Hàng đợi Outbox đồng bộ thành công sau khi bật mạng; 0% mất dữ liệu |
| **CAP-02, CAP-04** / `WF-01`, `AC-02` (Bàn Làm Việc Operations Manager) | ADR 0003, ADR 0007, ADR 0012 | §3.1, §3.4 | `IMP-GAP-001`, `IMP-GAP-006` | **Wave 4** (Domain), **Wave 5** (Mobile Manager) | `apps/api`, `apps/mobile/manager` | RBAC test: Manager chỉ xem và phân công task trong khu vực phụ trách | API chặn truy cập task ngoài phạm vi; Staff bị cấm truy cập review |
| **CAP-ADM-01** / `GV-01` (Cấp Phát Người Dùng - ProvisionUser) | ADR 0005, ADR 0006, ADR 0010 | §3.1, §3.5 | `IMP-GAP-010` | **Wave 3** (IAM API), **Wave 6** (Admin Web) | `apps/api/iam`, `apps/admin-web` | Integration test tạo tài khoản trạng thái `INVITED/ACTIVE`, gửi link kích hoạt | Tài khoản được tạo trong CSDL, mật khẩu mã hóa an toàn theo quyết định IDB-05 |
| **CAP-ADM-02** / `GV-02` (Phân Quyền Hệ Thống - AssignRole) | ADR 0005, ADR 0006, ADR 0007 | §3.1, §3.4, §3.5 | `IMP-GAP-001`, `IMP-GAP-010` | **Wave 3** (IAM API), **Wave 6** (Admin Web) | `apps/api/iam`, `apps/admin-web` | Test gán vai trò Staff/Manager/Admin, tăng `authVersion` để thu hồi phiên cũ | Token cũ bị từ chối ngay lập tức ở Tier 2 Gate sau khi đổi role |
| **CAP-ADM-03** / `GV-03..05` (Vòng Đời Tài Khoản - Suspend/Disable) | ADR 0006, ADR 0007 | §3.4, §3.5 | `IMP-GAP-010` | **Wave 3** (IAM API), **Wave 6** (Admin Web) | `apps/api/iam`, `apps/admin-web` | Security test: Tài khoản bị `SUSPENDED` bị chặn 100% request có xác thực | Trả về mã lỗi `403 FORBIDDEN (ACCOUNT_SUSPENDED)` tức thời |
| **CAP-ADM-04** / `GV-06..07` (Khôi Phục & Mở Khóa Tài Khoản - Unlock/Reset) | ADR 0005, ADR 0006 | §3.1, §3.5 | `IMP-GAP-010` | **Wave 3** (IAM API), **Wave 6** (Admin Web) | `apps/api/iam`, `apps/admin-web` | Test mở khóa tài khoản `UnlockAccount` và cấp token đặt lại thông tin xác thực | Tài khoản bị khóa được mở khóa, sinh token thiết lập an toàn |
| **CAP-ADM-05** / `GV-08..09` (Tra Cứu Nhật Ký Kiểm Toán - ViewAuditLog) | ADR 0005, ADR 0011 | §3.1, §3.9 | `IMP-GAP-010`, `IMP-GAP-011` | **Wave 3** (Audit API), **Wave 6** (Admin Web) | `apps/api/audit`, `apps/admin-web` | Query test lọc audit log theo actor, action, timestamp, resource | Danh sách nhật ký hiển thị chuẩn xác, không bị chỉnh sửa |
| **CAP-ADM-06..09** / `GV-10..19` (Quản Trị Cây, TaskType, Policy, Mẫu) | ADR 0005, ADR 0010, ADR 0013 | §3.1, §3.2 | `IMP-GAP-010` | **Wave 4** (Domain API), **Wave 6** (Admin Web) | `apps/api/policy-governance`, `apps/admin-web` | CRUD test cấu hình ProofProfile và ChecklistTemplate | Dữ liệu mẫu lưu bền vững trong DB, áp dụng cho task tạo mới |
| **OP-22** / `ADR 0005, ADR 0007` (Tra Cứu Lịch Sử Cây Toàn Hệ Thống - ViewCareHistory) | ADR 0005, ADR 0007 | §3.1, §3.4 | `IMP-GAP-010` | **Wave 4** (API), **Wave 6** (Admin Web) | `apps/api/tree-asset`, `apps/admin-web` | Read-only audit test: Admin xem lịch sử chăm sóc cây mà không có nút sửa | Admin xem dữ liệu CareHistory chỉ đọc; cấm chuyển trạng thái hay gán task |

---

## 3. Ma Trận Truy Vết Quy Tắc An Ninh & Tách Biệt Trách Nhiệm (Security & SoD Traceability)

| Quy Tắc An Ninh & SoD | ADR Chấp Thuận | Mục Kiến Trúc | Khoảng Cách Hiện Trạng | Đợt Triển Khai | Thành Phần Đích | Phương Thức Kiểm Chứng | Tiêu Chí Nghiệm Thu |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- | :--- |
| **SoD-01** (Admin Cấm Can Thiệp Tác Vụ Vận Hành) | ADR 0005, ADR 0007 | §3.1, §3.4 | `IMP-GAP-001`, `IMP-GAP-002` | **Wave 3** (Auth Gate), **Wave 4** (Domain) | `apps/api/work-management` | API Authorization test: Gửi token Admin tới các mutation task endpoints | Trả về `403 FORBIDDEN` cho mọi thao tác Start, Submit, Review, Reassign |
| **SoD-02** (Cấm Tự Nghiệm Thu Bằng Chứng Của Chính Mình) | ADR 0007, ADR 0012 | §3.4 | `IMP-GAP-005` | **Wave 4** (Domain Core) | `apps/api/work-management` | Domain invariant test: Reviewer có `userId == task.evidence[].capturedByUserId` | Trả về `403 FORBIDDEN (CANNOT_REVIEW_OWN_EVIDENCE)` |
| **AC-Freshness** (Kiểm Tra Độ Tươi Tài Khoản & Thu Hồi Tức Thì) | ADR 0006, ADR 0007 | §3.4, §3.5 | `IMP-GAP-005` | **Wave 3** (Security Gate) | `apps/api` (Tier 2 Middleware) | Freshness test: Khóa tài khoản trong DB, gửi request với credential còn hạn | Middleware chặn ngay lập tức, không để lọt request vào Application layer |
| **Audit-Immutable** (Phân Tách Quyền Cơ Sở Dữ Liệu Kiểm Toán) | ADR 0011 | §3.9 | `IMP-GAP-011` | **Wave 2** (Migrations), **Wave 3** (Audit) | `apps/api` (PostgreSQL DDL) | SQL permission test: Chạy lệnh `UPDATE audit_events` và `DELETE` bằng runtime user | PostgreSQL ném lỗi `permission denied for table audit_events` |
| **Cross-Module-Guard** (Cấm Đột Biến Dữ Liệu SQL Chéo Module) | ADR 0013 | §3.2 | `IMP-GAP-009` | **Wave 2** (Architecture), **Wave 4** (Domain) | `apps/api` (All 5 Modules) | Static analysis & code review: Kiểm tra Module A không import model của Module B | Mọi thao tác liên module đều gọi qua In-Process Module Interfaces |

---

## 4. Ma Trận Truy Vết Kịch Bản Thuộc Tính Chất Lượng (NFR / QAS Traceability)

| Mã Kịch Bản NFR | Thuộc Tính Chất Lượng | ADR Chấp Thuận | Khoảng Cách Hiện Trạng | Đợt Triển Khai | Cơ Chế Kỹ Thuật Thực Thi | Phương Thức Kiểm Chứng | Bằng Chứng Thực Nghiệm Đo Đạc |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- |
| **QAS-PERF-01** | Hiệu năng hiển thị danh sách lớn | ADR 0001, ADR 0004 | Hiện trạng dùng ScrollView không tối ưu | **Wave 5** (Mobile) | Áo hóa danh sách bằng `FlatList` / `SectionList`, `windowSize={5}`, `keyExtractor` ổn định | Fling scroll 500 tasks trên Android Emulator / Thiết bị thật | Tỷ lệ dropped frames $< 5\%$, duy trì $\ge 55$ FPS, không tràn RAM |
| **QAS-OFFLINE-01**| Mất kết nối mạng giữa chu trình nộp | ADR 0008, ADR 0009 | `IMP-GAP-007`, `IMP-GAP-008` | **Wave 5** (Mobile) | Lưu draft vào SQLite & Disk sandbox; đóng gói Outbox với `Idempotency-Key` cố định | Kiểm thử ngắt mạng (Airplane mode test) giữa lúc chụp ảnh và nộp | $0\%$ dữ liệu mất; Outbox tự động retry thành công khi có sóng |
| **QAS-OFFLINE-02**| Ứng dụng bị OS kill ngầm khi mở Camera | ADR 0008 | `IMP-GAP-007` | **Wave 5** (Mobile) | Tự động persist state vào SQLite sau mỗi bước chụp ảnh hoặc tích checklist | Kích hoạt "Don't keep activities" trên Android Developer Options | Khôi phục đúng màn hình và đầy đủ ảnh đã chụp trong $\le 2$ giây |
| **QAS-FAULT-01** | Máy chủ API trả về lỗi 503 hoặc Timeout | ADR 0003, ADR 0008 | `IMP-GAP-014` | **Wave 5** (Mobile) | Tách biệt Network Error vs Auth Error; cung cấp nút Thử lại, không logout bậy | Mock server trả về 503 / Timeout $> 10\text{s}$ trên toàn bộ endpoints | Hiển thị màn hình lỗi có thể thử lại trong $\le 15\text{s}$, không crash |
| **QAS-A11Y-01** | Tương tác ngoài trời nắng & Tiếng Việt | ADR 0004 | Hiện trạng một số nút $< 44\text{px}$ | **Wave 5** (Mobile), **Wave 6** (Admin) | Token màu `DESIGN.md` đạt WCAG AA $\ge 4.5:1$, Touch target $48\times 48\text{px}$, font scaling | Kiểm toán giao diện bằng WCAG Contrast Analyzer và đo bounding box | $100\%$ nút đạt $\ge 48\times 48\text{px}$, không cắt cụt chữ tiếng Việt |
| **QAS-SEC-01** | Hết hạn token không làm mất form đang nhập | ADR 0006, ADR 0008 | `IMP-GAP-007` | **Wave 5** (Mobile) | Silent Token Refresh qua Refresh Token; lưu draft cục bộ nếu phiên hết hạn | Giả lập token hết hạn trong network interceptor khi đang gõ ghi chú | Form draft tồn lưu nguyên vẹn sau khi đăng nhập lại |

---

## 5. Ma Trận Phân Bổ Thành Phần và Ranh Giới Gói (Component Allocation Matrix)

| Đợt Triển Khai (`Wave`) | Workspace / Thư Mục Mục Tiêu | Trách Nhiệm Kỹ Thuật Đóng Gói | Ranh Giới Nhập Khẩu Cho Phép | Ranh Giới Nhập Khẩu BỊ CẤM |
| :---: | :--- | :--- | :--- | :--- |
| **Wave 0** | Root, `.github/`, `scripts/` | Cấu hình test runner (Vitest), CI scripts, linters | devDependencies gốc | Cấm sửa mã nguồn ứng dụng |
| **Wave 1** | `packages/contracts` | Zod schemas, 7 TaskStatus, 3 ProofProfiles, 4 ReviewDecisions, DTOs, Envelopes | `@novyx/contracts` (zero runtime dependencies ngoại trừ `zod`) | Cấm import từ bất kỳ `apps/*` nào |
| **Wave 2** | `apps/api` (Foundation & Persistence) | Thiết lập HTTP framework được chọn (IDB-02), kết nối CSDL (IDB-01), persistence schemas (IDB-03), DB migrations | `packages/contracts`, `packages/config` | Cấm import `packages/ui`; cấm logic domain nghiệp vụ cụ thể |
| **Wave 3** | `apps/api` (IAM, Auth Gate & Audit) | Xác thực thông tin đăng nhập (IDB-04/05/11), Tier 2 gate, `AuditEvent` persistence với phân tách quyền | `packages/contracts`, `packages/config` | Cấm import `packages/ui`; cấm đột biến trực tiếp bảng task |
| **Wave 4** | `apps/api` (Domain Modules) | 5 Modules logic: Work Management, Tree Asset, Policy Governance; Adapter lưu trữ tệp (IDB-07) | `packages/contracts`, `packages/config` | Cấm đột biến SQL chéo module; cấm import UI; cấm vi phạm SoD |
| **Wave 5** | `apps/mobile` (Refactoring & Offline) | SQLite, Durable Outbox, REST client adapter, gỡ bỏ ép vai trò Admin | `packages/contracts`, `packages/ui`, `packages/config` | Cấm tự quyết định thẩm quyền duyệt task cuối cùng (Advisory only) |
| **Wave 6** | `apps/admin-web` (New Workspace) | Nền tảng Admin Web được chọn (IDB-06), giao diện quản trị người dùng, chính sách, tra cứu kiểm toán | `packages/contracts`, `packages/ui` (web), `packages/config` | Cấm đưa các chức năng tác vụ hiện trường vào điều hướng Admin |
| **Wave 7** | `apps/mobile`, `scripts/` | Loại bỏ mã giả lập RAM, xóa `greenops-dev-api.cjs`, làm sạch facade chuyển tiếp | Tuân thủ các ranh giới chuẩn tắc | Cấm xóa mã nguồn cũ khi chưa vượt qua cổng kiểm thử thay thế |
| **Wave 8** | Toàn bộ monorepo | Làm cứng NFR, profiling hiệu năng, kiểm thử tải, audit an ninh toàn diện | Tuân thủ toàn bộ quy tắc kiến trúc | Cấm hạ thấp tiêu chuẩn strictness TypeScript hoặc tắt linter |
