# BÁO CÁO KHÁM PHÁ KIẾN TRÚC KỸ THUẬT & TẬP HỢP ĐỀ XUẤT ADR
## NOVYX GREENOPS — PHASE 11A: TECHNICAL ARCHITECTURE DISCOVERY

> **Mã tài liệu:** `docs/PHASE11-TECHNICAL-ARCHITECTURE-DISCOVERY.md`
> **Trạng thái:** `COMPLETED & RATIFIED AS PROPOSAL (ĐỀ XUẤT KIẾN TRÚC CHỜ OWNER DUYỆT)`
> **Giai đoạn:** Phase 11A — Technical Architecture Discovery & ADR Candidate Set
> **Cam kết đầu vào:** Commit [`c235ebbf41dfd1390c759e719da7614b9544d031`](https://github.com/Peaker04/tree/commit/c235ebbf41dfd1390c759e719da7614b9544d031) / Tree `2827283630177ca83b6125149429dcde28ce3adb`
> **Tài liệu tham chiếu tối cao:** [PRODUCT.md](file:///d:/ki7/EXE/tree/docs/PRODUCT.md), [DOMAIN.md](file:///d:/ki7/EXE/tree/docs/DOMAIN.md), [ACCESS-CONTROL.md](file:///d:/ki7/EXE/tree/docs/ACCESS-CONTROL.md), [WORKFLOWS.md](file:///d:/ki7/EXE/tree/docs/WORKFLOWS.md), [REQUIREMENTS-TRACEABILITY.md](file:///d:/ki7/EXE/tree/docs/REQUIREMENTS-TRACEABILITY.md), [NFR.md](file:///d:/ki7/EXE/tree/docs/NFR.md), [13-BUSINESS-BASELINE-FREEZE.md](file:///d:/ki7/EXE/tree/docs/business-reconciliation/13-BUSINESS-BASELINE-FREEZE.md), [POST-SYNC-IMPLEMENTATION-GAP-MAP.md](file:///d:/ki7/EXE/tree/docs/POST-SYNC-IMPLEMENTATION-GAP-MAP.md).

---

## 1. Phạm Vi Thực Thi Của Phase 11A (Scope)

Phase 11A là bước chuyển tiếp kỹ thuật đầu tiên ngay sau khi toàn bộ **Đường cơ sở Nghiệp vụ (Business Baseline)** chính thức được đóng băng tại Phase 10.

### Nguyên tắc quản trị cốt tử:
1. **Phân định rạch ròi giữa Khám phá Kiến trúc và Triển khai Mã nguồn:**
   - Phase 11A **TUYỆT ĐỐI KHÔNG SỬA MÃ NGUỒN** (`apps/**`, `packages/**`).
   - Không chạy migration cơ sở dữ liệu, không viết API routes, không dựng UI màn hình, không sửa các hợp đồng hiện hành trong mã nguồn.
   - Toàn bộ công việc ở Phase 11A chỉ bao gồm: **Nghiên cứu (Research), Phân tích hiện trạng (Analyze), Mô hình hóa kỹ thuật (Model), So sánh đánh đổi (Trade-off Analysis), và Lập bộ ứng viên ADR đề xuất (Propose ADRs)**.
2. **Không tự ý chấp thuận ADR (No Auto-Acceptance):**
   - Mọi ADR mới khởi tạo (`ADR 0005` đến `ADR 0013`) đều mang trạng thái `Status: PROPOSED`.
   - Quyền chấp thuận (`ACCEPTED`), bác bỏ (`REJECTED`) hoặc yêu cầu chỉnh sửa (`REQUEST_REVISION`) thuộc về **Chủ sở hữu hệ thống (Owner)**.
3. **Bảo vệ tính bất biến của Đường cơ sở nghiệp vụ đã đóng băng:**
   - Không sáng tác vai trò mới, không thêm trạng thái vòng đời thứ 8, không thêm command thứ 49, không tự ý nới lỏng các quy tắc phân tách trách nhiệm (SoD).
   - Nếu kiến trúc kỹ thuật gặp trở ngại không thể đáp ứng nghiệp vụ, phải ghi nhận là `ARCHITECTURE BLOCKER` và dừng lại tại quyết định đó, tuyệt đối không được sửa đổi tài liệu nghiệp vụ chuẩn tắc.

---

## 2. Tóm Tắt Đường Cơ Sở Nghiệp Vụ Chuẩn Tắc (Frozen Baseline Summary)

Toàn bộ phân tích kỹ thuật trong báo cáo này được neo chặt vào các định đề đã được nghiệm thu và đóng băng tại Phase 10:

- **Mô hình Tác nhân (Actor Model):** Gồm chính xác 3 vai trò con người trong sản phẩm:
  - `staff` — Field Staff (Tác nghiệp hiện trường trên task được giao).
  - `manager` — Operations Manager (Quản lý tác nghiệp trong `AUTHORIZED_OPERATIONAL_SCOPE`).
  - `admin` — Platform Administrator (Quản trị nền tảng trong `PLATFORM_GOVERNANCE_SCOPE`, 9 năng lực MVP `CAP-ADM-01..09`).
  - `System` — Tác nhân kỹ thuật thực thi các kiểm tra tất định, không phải `UserRole`, không có quyền duyệt tùy nghi.
  - *Bất biến:* Không có quyền kế thừa cấp bậc (`Admin > Manager > Staff` là **HOÀN TOÀN SAI**). Admin bị **DENY 100%** trên toàn bộ các lệnh tác nghiệp nhiệm vụ hiện trường.
- **5 Ngữ cảnh Giới hạn (Bounded Contexts):**
  - `Work Management` (Core Domain — Hợp nhất cả Verification và Review).
  - `Tree Asset Registry` (Supporting Subdomain).
  - `Policy & Template Governance` (Supporting Subdomain).
  - `Audit & Compliance` (Supporting Subdomain).
  - `Identity & Access Management` (Generic Subdomain).
- **Vòng đời Nhiệm vụ 7 trạng thái tất định:**
  `PENDING` $\to$ `IN_PROGRESS` $\to$ `BLOCKED` $\to$ `WAITING_REVIEW` $\to$ `REWORK_REQUIRED` $\to$ `COMPLETED` (kết thúc), và `CANCELLED` (kết thúc).
- **3 Hồ sơ Bằng chứng Ngữ nghĩa:** `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`.
- **4 Kết luận Phê duyệt của Quản lý:** `APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL`.
- **Nguyên tắc Phân quyền (Action Eligibility):**
  $$\text{ACTION ELIGIBILITY} = \text{ACTOR ROLE} \land \text{RESOURCE SCOPE} \land \text{DOMAIN STATE} \land \text{BUSINESS PRECONDITIONS}$$
- **48 Lệnh Chuẩn Tắc Hợp Nhất Toàn Hệ Thống:** Bao gồm 22 lệnh vận hành `OP-01..22`, 22 hành vi quản trị `GV-01..22` (với `GV-07` chuẩn hóa là `ResetCredentialSetup`), và 4 lệnh RTM bổ sung (`ReportLocationException`, `ReportIdentityException`, `LookupTreeByQr`, `ProjectCareHistory`).

---

## 3. Kiểm Toán Bằng Chứng Hiện Trạng Kỹ Thuật Mã Nguồn (AS-IS Repository Evidence)

Khảo sát trực tiếp mã nguồn thực tế tại commit `7817e65` và cấu trúc repo hiện hành mang lại các phát hiện cụ thể:

### 3.1. Phân tích gốc điều phối `apps/mobile/src/screens/MobileApp.tsx` (2.054 dòng)
- Quá tải nghiêm trọng: Nắm giữ toàn bộ state cục bộ (`tasks`, `trees`, `careHistoryByTree`, `activeTask`, `reviewTask`, `authSource`, `dataSource`).
- Chứa mã JSX inline cho màn hình Đăng nhập (Login) và Quên mật khẩu (Forgot Password), trong khi file `LoginScreen.tsx` (300 dòng) bị bỏ quên thành dead code.
- Khoan props (Prop-drilling) hơn 30 biến và hàm callback xuống `StaffArea` và `ManagerArea`.
- Chỉ có 2 không gian màn hình: `StaffArea` và `ManagerArea`. Hoàn toàn không có không gian cho `AdminArea`.

### 3.2. Phân tích dịch vụ chuyển tiếp `apps/mobile/src/services/greenOpsService.ts` (856 dòng)
- **Rủi ro mất dữ liệu trên RAM (`AR-11-02`):** Toàn bộ dữ liệu tác vụ và cây xanh trong mock/fallback mode nằm trên biến bộ nhớ `let snapshot: AppData` (dòng 394). Khi hệ điều hành Android giải phóng bộ nhớ (kill process) trong lúc chụp ảnh hoặc khi rớt mạng, toàn bộ dữ liệu này bị xóa sạch. Không hề có local database.
- **Ép vai trò trái quy tắc (`AR-11-01`):** Dòng 349:
  ```typescript
  const mapSessionRole = (session: AuthSession): Role => (session.user.role === 'staff' ? 'Staff' : 'Manager');
  ```
  Tài khoản mang vai trò `admin` khi đăng nhập tự động bị ép thành `Manager`, vi phạm trực tiếp nguyên tắc bất biến cấm Admin thao tác việc hiện trường.
- **Rò rỉ logic nghiệp vụ vào UI (`AR-11-03`):** Các hàm `createTask` và `reviewTask` yêu cầu tầng UI phải tự tạo object `fallbackTask` với trạng thái mới được gán sẵn (`COMPLETED` hoặc `REWORK_REQUIRED`) rồi truyền vào service facade.

### 3.3. Phân tích gói hợp đồng `packages/contracts/src/index.ts`
- `TaskStatus` chỉ có 5 trạng thái (`Pending`, `In_Progress`, `Waiting_Review`, `Completed`, `Rework_Required`), viết theo chuẩn Pascal_Snake_Case, thiếu `BLOCKED` và `CANCELLED`.
- `ProofProfile` hoàn toàn chưa được định nghĩa; chỉ có `EvidenceStage = 'before' | 'after'`.
- `ReviewDecision` chỉ có 2 lựa chọn (`'approve' | 'request_rework'`), thiếu `approve_with_exception` và `cancel`.
- Chưa có DTO cho 3 ngoại lệ: `LocationExceptionDto`, `IdentityExceptionDto`, `FieldIssueDto`.
- Chưa có DTO cho 9 năng lực Platform Governance (`CAP-ADM-01..09`).
- Chưa có `version: number` (Optimistic Concurrency Control) trên `TaskDto` và chưa có `idempotencyKey` trên các mutation request.
- Toàn bộ là compile-time TypeScript interfaces, thiếu runtime schema validation.

### 3.4. Phân tích máy chủ API thử nghiệm `scripts/greenops-dev-api.cjs` (537 dòng)
- Là một HTTP server Node.js thuần phục vụ kiểm thử cục bộ (`npm run api:dev`).
- Dòng 361: Ép vai trò `admin` thành `'manager'`:
  ```javascript
  const role = identifier.includes('manager') || identifier.includes('admin') ? 'manager' : 'staff';
  ```
- Chưa có bảo vệ phân quyền, chưa có endpoint quản trị governance, chưa có lưu vết kiểm toán, chưa có ranh giới backend production.

---

## 4. Sổ Đăng Ký Động Lực Kiến Trúc Kỹ Thuật (Architecture Drivers Register)

> **Nguyên tắc cốt tử (C11-01):** Động lực kiến trúc mô tả **VẤN ĐỀ, RÀNG BUỘC, NHU CẦU CHẤT LƯỢNG VÀ QUYẾT ĐỊNH CẦN THIẾT**, tuyệt đối không được lựa chọn sẵn công nghệ giải pháp ở cột hệ quả kiến trúc.

| Mã Động Lực | Nhóm phân loại | Nguồn gốc nghiệp vụ / NFR | Nhu cầu kỹ thuật & Quyết định cần đưa ra (Technical Need & Decision Needed) | Mức ưu tiên | Cần quyết định kiến trúc? | Ứng viên ADR liên quan |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: |
| **DRV-01** | `CLIENT` | `BR-ACT-01`, `CAP-ADM-01..09` (Admin là vai trò độc lập, không thao tác hiện trường) | Cần xác lập hình thái triển khai bề mặt cho Quản trị viên đáp ứng mật độ thông tin desktop, tách biệt bề mặt phát hành và không gây ô nhiễm ứng dụng hiện trường. | **P0** | **CÓ** | `ADR 0005` |
| **DRV-02** | `IAM` | `DR-HARD-05`, `CAP-ADM-03..04` (3 vai trò, 4 trạng thái tài khoản, credential lock) | Cần một thiết kế xác thực và quản lý phiên hỗ trợ: tiếp tục soạn thảo ngoại tuyến trên mobile, thu hồi quyền tức thì khi tài khoản bị đình chỉ, vô hiệu hóa quyền cũ khi đổi vai trò, và lưu trữ thông tin xác thực an toàn trên thiết bị. | **P0** | **CÓ** | `ADR 0006` |
| **DRV-03** | `AUTHZ` | `Report 07`, `Report 12 §4` (Action Eligibility, SoD-01..07) | Cần cơ chế thực thi phân quyền đa tầng đảm bảo $Role \land Scope \land State \land Preconditions$ và SoD dựa trên tác quyền lịch sử được cưỡng chế có thẩm quyền tại ranh giới máy chủ, trong khi client chỉ đóng vai trò hướng dẫn công thái học. | **P0** | **CÓ** | `ADR 0007` |
| **DRV-04** | `OFFLINE` | `DR-HARD-04`, `QAS-OFFLINE-01`, `QAS-OFFLINE-02` (Zero data loss, khôi phục sau OS kill) | Cần giải pháp lưu trữ cấu trúc bền vững cục bộ với ngữ nghĩa transactional outbox, tách biệt lưu trữ tệp ảnh nhị phân và có khả năng phục hồi sau khi hệ điều hành tắt ngầm ứng dụng. | **P0** | **CÓ** | `ADR 0008` |
| **DRV-05** | `SYNC` | `DOMAIN.md §3`, `QAS-OFFLINE-01` (Tách TaskStatus server và PENDING_SYNC client) | Cần cơ chế đồng bộ bất đồng bộ tách bạch trạng thái gửi cục bộ (`PENDING_SYNC`) khỏi trạng thái có thẩm quyền của server (`IN_PROGRESS`), hỗ trợ thử lại có backoff và bảo toàn bằng chứng khi lỗi. | **P0** | **CÓ** | `ADR 0008`, `ADR 0009` |
| **DRV-06** | `CONCURRENCY` | `DOMAIN.md §3` (Phòng ngừa xung đột khi Quản lý đổi người/hủy việc lúc Nhân viên mất mạng) | Cần ngữ nghĩa kiểm soát tranh chấp đồng thời và tính lũy lượng tại ranh giới mạng/domain để phát hiện xung đột dữ liệu cũ (409) và cho phép thử lại mạng an toàn không sinh trùng lặp. | **P0** | **CÓ** | `ADR 0009` |
| **DRV-07** | `CONTRACT` | `DOMAIN.md §3..5`, `ADR 0003` (Đầy đủ 7 states, 3 profiles, 4 review outcomes, Zod validation) | Cần cơ chế kiểm thực lược đồ runtime để chặn payload sai lệch ngay tại ranh giới mạng và đồng bộ chặt chẽ với compile-time types, bao phủ toàn bộ vòng đời nghiệp vụ đã đóng băng. | **P0** | **CÓ** | `ADR 0010` |
| **DRV-08** | `AUDIT` | `CAP-ADM-05`, `DR-POL-04` (Lưu vết kiểm toán append-only, chống giả mạo, tra cứu nhanh) | Cần giải pháp lưu trữ kiểm toán append-only, chống sửa/xóa bởi các tác nhân sản phẩm, hỗ trợ truy vấn lọc đa tiêu chí hiệu năng cao và loại trừ điểm nghẽn ghi đồng thời. | **P1** | **CÓ** | `ADR 0011` |
| **DRV-09** | `MODULE` | `ARCHITECTURE.md §2`, `POST-SYNC Gap 13` (Phân rã monolith 2.900 dòng) | Cần phân định ranh giới kiến trúc rõ ràng (presentation, use cases, domain core, infrastructure adapters) để cô lập logic nghiệp vụ, triệt tiêu rò rỉ trạng thái vào UI và hỗ trợ kiểm thử độc lập mà không cần microservice phân tán. | **P1** | **CÓ** | `ADR 0012` |
| **DRV-10** | `PERF` | `QAS-PERF-01` (Cuộn danh sách 200–1.000 cây mượt mà trên Android 3GB RAM) | Cần áp dụng ảo hóa danh sách và tối ưu hóa bộ nhớ trên thiết bị di động cấu hình khiêm tốn. | **P1** | KHÔNG (Quy chuẩn mã nguồn) | `NFR.md` |
| **DRV-11** | `SECURITY` | `QAS-SEC-01` (Làm mới token ngầm $\le 1$s; bảo toàn form khi hết hạn) | Cần cơ chế tự động gia hạn phiên ngầm và bảo vệ bản nháp form để ngăn ngừa gián đoạn quy trình thu nộp ngoài thực địa. | **P1** | **CÓ** | `ADR 0006` |
| **DRV-12** | `A11Y` | `QAS-A11Y-01` (Tương tác ngoài trời nắng chói, tiếng Việt có dấu, touch target $\ge 48\text{px}$) | Cần tuân thủ chặt chẽ design tokens của `@novyx/ui` và thiết kế màn hình dễ thao tác một tay ngoài trời. | **P1** | KHÔNG (Tuân thủ UI tokens) | `ADR 0004` |
| **DRV-13** | `TOPOLOGY` | `DOMAIN.md §2..3`, `NFR.md` (Ranh giới máy chủ có thẩm quyền thực thi 5 Bounded Contexts) | Cần xác lập topology máy chủ sản xuất (production server runtime) và engine lưu trữ bền vững để thực thi use cases, quản lý giao dịch ACID, và cung cấp ranh giới API có thẩm quyền cho nền tảng. | **P0** | **CÓ** | `ADR 0013` |

---

## 5. Phân Tích Các Yêu Cầu Phi Chức Năng (NFR / Quality Attributes Traceability)

Mỗi kịch bản thuộc tính chất lượng (QAS) trong `NFR.md` được kết nối trực tiếp với giải pháp kiến trúc:

- **`QAS-OFFLINE-01` (Zero data loss khi mất mạng giữa chừng):**
  - *Giải pháp kiến trúc:* `ADR 0008` thiết lập bảng CSDL cục bộ `tasks`, `task_evidence`, `checklist_items` trên nền `expo-sqlite`. Khi mất mạng, mọi thao tác ghi nhận bằng chứng đều được commit vào SQLite trong $< 50\text{ms}$. Thao tác "Gửi duyệt" tạo bản ghi `outbox_queue` với `LocalSubmissionStatus = PENDING_SYNC`.
  - *Chỉ tiêu:* Đạt $0\%$ mất dữ liệu; được kiểm chứng qua bộ kiểm thử ngắt tiến trình (process kill) và ngắt giao dịch.
- **`QAS-OFFLINE-02` (Khôi phục trạng thái sau khi hệ điều hành tắt ngầm Camera):**
  - *Giải pháp kiến trúc:* `ADR 0008` sao chép ảnh chụp từ cache tạm vào thư mục bền vững của app (`documentDirectory`) ngay khi chụp xong và ghi URI vào SQLite. Khi mở lại app, Use Case khôi phục phiên và bản nháp từ SQLite trong $< 2\text{s}$.
  - *Chỉ tiêu:* Thời gian phục hồi $\le 2\text{s}$, không phải thực hiện lại các bước trước.
- **`QAS-PERF-01` (Hiệu năng cuộn danh sách lớn ngoài trời):**
  - *Giải pháp kiến trúc:* Áp dụng `FlatList` với cơ chế ảo hóa dòng (windowing), cấu hình `maxToRenderPerBatch = 10`, `windowSize = 5`, sử dụng `keyExtractor` ổn định (`tree.id` / `task.id`).
  - *Chỉ tiêu:* Tỷ lệ khung hình rơi $< 5\%$, hướng tới 60 FPS trên thiết bị Android RAM 3GB.
- **`QAS-SEC-01` (Làm mới token ngầm không làm mất dữ liệu form):**
  - *Giải pháp kiến trúc:* `ADR 0006` thiết kế chu trình Refresh Token Rotation (RTR). Interceptor phía client bắt mã lỗi 401, tạm hoãn các request đang chờ, gửi lệnh `/v1/auth/refresh` lấy access token mới trong $< 1\text{s}$, và tự động gửi lại request ban đầu.
- **`QAS-FAULT-01` (Xử lý lỗi hệ thống 503 / Timeout):**
  - *Giải pháp kiến trúc:* `ADR 0009` và `ADR 0010` quy định Outbox Worker chỉ tự động thử lại khi gặp lỗi mạng hoặc lỗi server 5xx (kèm exponential backoff). Gặp lỗi 4xx (vi phạm nghiệp vụ / SoD / Preconditions), worker dừng thử lại và đánh dấu `SyncStatus = SYNC_FAILED` kèm lý do rõ ràng mà không xóa bỏ bằng chứng thực địa.

---

## 6. Đánh Giá Tính Tương Thích Của Các Quyết Định Kiến Trúc Hiện Hữu (ADR 0001..0004)

- **`ADR 0001` (Monorepo Foundation):** `ACCEPTED` $\to$ **GIỮ NGUYÊN (`KEEP`)**. Cấu trúc monorepo là nền tảng hoàn hảo để chứa `apps/mobile`, `apps/admin-web` tương lai, `apps/api`, và các gói `packages/*`.
- **`ADR 0002` (Hermes Agent Submodule):** `ACCEPTED` $\to$ **GIỮ NGUYÊN (`KEEP`)**. Pinned commit ở `external/hermes-agent` tiếp tục được bảo toàn, không bị sửa đổi.
- **`ADR 0003` (Contract-first REST API):** `ACCEPTED` $\to$ **CẦN ADR TIẾP NỐI (`NEEDS_FOLLOWUP_ADR`)**. Định hướng REST và shared contracts được giữ vững, nhưng cần `ADR 0010` để bổ sung runtime schema validation (Zod) và mở rộng DTO theo cam kết còn nợ trong mục Tradeoffs của ADR 0003.
- **`ADR 0004` (Shared UI Tokens):** `ACCEPTED` $\to$ **GIỮ NGUYÊN (`KEEP`)**. Token trong `packages/ui` đóng vai trò nguồn chân lý thiết kế cho toàn bộ các màn hình hiện trường và giao diện quản trị sau này.

---

## 7. Phân Tích Chuyên Sâu: Hình Thái Triển Khai Giao Diện Quản Trị Viên (Admin Client Topology)

### Bối cảnh & Xung đột hiện tại:
Văn bản nghiệp vụ chuẩn tắc xác lập vai trò **Platform Administrator (`admin`)** là vai trò quản trị MVP độc lập với 9 nhóm năng lực (`CAP-ADM-01..09`). Tuy nhiên, mã nguồn di động hiện tại (`apps/mobile`) chỉ thiết kế giao diện cho Staff và Manager; khi Admin đăng nhập thì bị ép quyền thành Manager.

### Phân định Rạch ròi Động lực Nghiệp vụ và Giả định Kỹ thuật:
- **Động lực Nghiệp vụ Chuẩn tắc (Frozen):** Admin có quyền quản trị (`CAP-ADM-01..09`) nhưng **CẤM 100% thao tác nhiệm vụ hiện trường**. Năng lực `CAP-ADM-05` chỉ bao gồm `ViewAuditLog` và `FilterAuditLog` (không có yêu cầu xuất file báo cáo).
- **Giả định Kỹ thuật & Công thái học (Technical / UX Assumptions):** Quản trị nền tảng (duyệt log, quản lý danh mục cây, cập nhật tọa độ trắc địa) yêu cầu màn hình rộng, bàn phím/chuột và mật độ dữ liệu cao.
- **Làm rõ Ranh giới An ninh (Security Boundary Clarification):**
  - Tách ứng dụng Web giúp phân tách bề mặt phát hành và giảm nguy cơ vô tình để lộ UI quản trị cho công nhân hiện trường.
  - **Tách bundle client TUYỆT ĐỐI KHÔNG PHẢI RÀO CHẮN PHÂN QUYỀN:** Ranh giới bảo mật thực sự nằm ở cơ chế xác thực và phân quyền máy chủ (`ADR 0006`, `ADR 0007`).
  - Các biện pháp như VPN, IP allowlist, WAF là tùy chọn làm cứng triển khai (deployment hardening), không phải yêu cầu nghiệp vụ bắt buộc.

### Đánh giá 3 phương án:
1. **Phương án A (Nhúng vào Mobile App hiện tại):** Bị bác bỏ do xung đột công thái học và tăng kích thước file APK di động.
2. **Phương án B (Xây dựng Cổng Quản trị Web độc lập `apps/admin-web`) [ĐỀ XUẤT - `ADR 0005`, Confidence: MEDIUM]:** Tối ưu hóa trải nghiệm desktop; tách biệt bề mặt phát hành; tuân thủ chuẩn monorepo.
3. **Phương án C (Universal React Native Web):** Bị bác bỏ vì độ phức tạp phát triển cao và trải nghiệm web vụng về.

---

## 8. Phân Tích Chuyên Sâu: IAM, Phiên Làm Việc & Độ Tươi Ủy Quyền (Authorization Freshness)

- **Cơ chế xác thực & Độ tươi ủy quyền (`ADR 0006`):**
  - Access Token ngắn hạn (thông số đề xuất: 15 phút, chờ security review).
  - Refresh Token dài hạn (thông số đề xuất: 30 ngày, chờ security review) lưu an toàn trong `expo-secure-store` trên mobile và cookie `HttpOnly; SameSite=Strict` trên web.
  - **Khắc phục triệt để mâu thuẫn thu hồi quyền (C11-03):** Kiến trúc không phải "stateless hoàn toàn" đối với các lệnh thay đổi trạng thái. Khi Admin thực hiện `SuspendAccount`, `DisableAccount`, hoặc đổi vai trò, máy chủ tăng trường `authVersion = authVersion + 1` trong CSDL và thu hồi refresh token. Mọi lệnh mutation có thẩm quyền tiếp theo mang token cũ hoặc phát xuất từ tài khoản không ở trạng thái `ACTIVE` đều bị máy chủ từ chối ngay lập tức với mã lỗi `403 FORBIDDEN: ACCOUNT_SUSPENDED`.
  - **Bảo toàn bản nháp ngoại tuyến:** Nếu tài khoản bị đình chỉ trong lúc đang offline ngoài thực địa, bản nháp trong SQLite cục bộ vẫn được giữ nguyên trên máy, nhưng lệnh nộp mạng có thẩm quyền sau đó sẽ bị máy chủ từ chối dứt khoát.
- **Lưu trữ an toàn trên thiết bị:**
  - Căn cứ tài liệu chính thức của Expo SecureStore: Android lưu trong `SharedPreferences` được mã hóa bằng khóa quản lý bởi Android Keystore; iOS lưu trong Keychain. Không khẳng định chung chung là "phần cứng" trừ khi thiết bị cụ thể hỗ trợ hardware-backed keystore.

---

## 9. Phân Tích Chuyên Sâu: Kiến Trúc Thực Thi Phân Quyền (Authorization Enforcement)

Nguyên tắc **Action Eligibility** được thực thi qua mô hình **Phòng thủ Đa chiều (Multi-Tier Defense-in-Depth - `ADR 0007`)**:

1. **Tầng 1 — Trợ giúp Công thái học phía Client (Presentation Guard — Advisory Only):**
   - Các hàm thuần túy (Pure Functions) trong `@novyx/domain` đánh giá nhanh để ẩn/hiện nút bấm, vô hiệu hóa form và hiển thị tooltip hướng dẫn.
   - **Ranh giới cốt tử:** Client eligibility **CHỈ MANG TÍNH TƯ VẤN CÔNG THÁI HỌC VÀ HỖ TRỢ OFFLINE**, tuyệt đối không phải rào chắn bảo mật!
2. **Tầng 2 — Rào chắn Tuyến Yêu cầu Máy chủ (Server Request Boundary Middleware — Authoritative Coarse Gate):**
   - Middleware máy chủ trung lập (neutral server middleware, không phụ thuộc vào việc có API Gateway riêng hay không) kiểm tra JWT, kiểm tra `accountStatus === 'ACTIVE'`, chặn Admin vào route `/v1/tasks/*` và chặn Staff/Manager vào route `/v1/governance/*`.
3. **Tầng 3 — Rào chắn Cốt lõi Miền Nghiệp vụ Máy chủ (Authoritative Fine-Grained Gate):**
   - Use Case và Aggregate Root trên máy chủ kiểm tra toàn diện trạng thái tiên quyết, phạm vi tài nguyên và:
   - **Quy tắc Chống Tự duyệt Dựa trên Tác quyền Lịch sử (`SoD-02` - Khắc phục C11-04):**
     Kiểm tra `reviewerId NOT IN task.getHistoricalSubmissionAuthorIds()`. Tuyệt đối không chỉ so sánh với `assignedStaffId` hiện tại, bởi vì nhiệm vụ có thể đã được phân công lại hoặc nhân sự đã được thăng chức vai trò.

---

## 10. Phân Tích Chuyên Sâu: Kiến Trúc Vết Kiểm Toán & Mô Hình Đe Dọa (Threat Model)

- **Yêu cầu bất biến:** Không một tác nhân sản phẩm nào có quyền xóa, sửa lịch sử kiểm toán (`DR-POL-04`).
- **Phân định rõ ràng trường dữ liệu:**
  - *Trường nghiệp vụ tối thiểu chuẩn tắc:* `actorId`, `actorRole`, `actionType`, `resourceType`, `resourceId`, `timestamp`, `outcome`.
  - *Metadata kỹ thuật đề xuất:* `clientIp`, `userAgent`, `correlationId`, `beforeState`, `afterState`.
- **Mô hình Đe dọa & Đánh giá Trung thực (`ADR 0011`):**
  - *Tác nhân 1 (Ứng dụng/Tác nhân sản phẩm/Khai thác SQL injection qua app):* Được chặn 100% bằng phân quyền động cơ CSDL (`REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM app_user;`).
  - *Tác nhân 2 (DBA có quyền root CSDL):* Chuỗi băm hàng trong CSDL **KHÔNG THỂ chống chối bỏ hoàn toàn trước một DBA có quyền sửa toàn bộ dữ liệu và tính toán lại hash**, trừ khi có điểm neo tin cậy bên ngoài (external trust anchor). Chuỗi băm đóng vai trò phát hiện can thiệp cục bộ và lỗi toàn vẹn dữ liệu.
- **Giải quyết Điểm nghẽn Ghi đồng thời (C11-08):**
  Thay vì một chuỗi băm đơn lẻ trên toàn hệ thống (buộc mọi thao tác trên toàn quốc phải xếp hàng nối tiếp), áp dụng **Chuỗi băm phân vùng theo luồng thực thể (Stream-Partitioned Hash Chaining)**, cho phép các tác vụ ghi kiểm toán trên các luồng tài nguyên khác nhau diễn ra đồng thời mà không bị lock contention.

---

## 11. Phân Tích Chuyên Sâu: Engine Lưu Trữ Bền Vững Ngoại Tuyến & Hàng Đợi Outbox

### Phân định Rạch ròi 3 Chiều Trạng thái (Khắc phục C11-05):
- `TaskStatus`: Vòng đời nghiệp vụ có thẩm quyền trên máy chủ (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`).
- `LocalSubmissionStatus`: Tiến độ nộp bài cục bộ (`IDLE`, `SAVED_DRAFT`, `PENDING_SYNC`).
- `SyncStatus`: Kết quả truyền vận đồng bộ (`IDLE`, `SYNCING`, `SYNCED`, `SYNC_FAILED`).
- **Quy tắc chuyển bước:**
  - Nộp offline: `LocalSubmissionStatus = PENDING_SYNC`, `TaskStatus = IN_PROGRESS`.
  - Đồng bộ thành công: `TaskStatus = WAITING_REVIEW`, `LocalSubmissionStatus = IDLE`, `SyncStatus = SYNCED`.
  - Đồng bộ thất bại: `TaskStatus = IN_PROGRESS`, `SyncStatus = SYNC_FAILED` (với `syncFailureReason`).
  - Tuyệt đối không gán `LocalSubmissionStatus = SYNC_FAILED`.
- **Chính sách Bảo toàn Bằng chứng Thực địa (Failure Retention):**
  Khi gặp lỗi kiểm thực (4xx), xung đột (409), hoặc mất mạng (5xx), toàn bộ ảnh chụp, checklist, và payload outbox **ĐƯỢC BẢO TOÀN NGUYÊN VẸN** trong SQLite và filesystem sandbox; tuyệt đối không tự ý xóa bỏ bằng chứng của người lao động.
- **Engine lưu trữ & Căn cứ kỹ thuật:**
  Sử dụng `expo-sqlite` và `expo-file-system`. Kiến trúc được thiết kế nhằm thỏa mãn `QAS-OFFLINE-01` và `QAS-OFFLINE-02`, và phải được kiểm chứng qua bộ kiểm thử ngắt tiến trình thực tế.

---

## 12. Phân Tích Chuyên Sâu: Kiểm Soát Tranh Chấp (Concurrency) & Lũy Lượng (Idempotency)

- **Chuẩn hóa Hợp đồng Tranh chấp (Khắc phục C11-06):**
  - Lựa chọn phương án đưa `expectedVersion: number` trực tiếp vào payload lệnh thay đổi trạng thái (Command Payload OCC).
  - Phù hợp hoàn hảo với kiến trúc REST hướng lệnh (`ADR 0003`) thay vì full PUT replacement, trả về mã lỗi chuẩn dự án `409 CONFLICT` (`STALE_VERSION`), tránh nhầm lẫn với ngữ nghĩa header HTTP 412 Precondition Failed của RFC 9110.
- **Vị thế Tiêu chuẩn của Idempotency-Key:**
  - Xác nhận chính xác: Tài liệu IETF `draft-ietf-httpapi-idempotency-key-header` hiện đã hết hạn (expired draft). Việc sử dụng header `Idempotency-Key: <UUIDv4>` được định vị là **quy chuẩn thiết kế API phổ biến rộng rãi trong công nghiệp** (industry convention).
- **Quy tắc Chân trời Lưu trữ (Retention Horizon Rule):**
  Thời gian lưu vết bản ghi idempotency trên máy chủ phải **lớn hơn hoặc bằng chân trời thử lại ngoại tuyến tối đa của outbox** (thông số đề xuất: 72 giờ, cần đo lường thực tế). Tuyệt đối không để bản ghi chống trùng lặp hết hạn trong khi thiết bị ngoại tuyến vẫn có thể gửi lại lệnh hợp lệ.

---

## 13. Phân Tích Chuyên Sâu: Tiến Hóa Hợp Đồng Dữ Liệu & Phân Loại Ranh Giới API

- **Bản chất Hợp đồng (`@novyx/contracts`):**
  Gói `@novyx/contracts` là **ĐẠI DIỆN HỢP ĐỒNG KỸ THUẬT PHÁI SINH**, không phải nguồn chân lý nghiệp vụ. Nguồn chân lý tối cao là tài liệu nghiệp vụ chuẩn tắc.
- **48 Lệnh Chuẩn Tắc $\ne$ 48 REST Endpoints (Khắc phục C11-07):**
  Thiết lập Bảng Phân loại Ranh giới Network API:
  1. `EXTERNAL_OPERATIONAL_API`: Các mutation gửi từ Mobile App lên `/v1/tasks/*` (`OP-01..15`). Cần Zod Request/Response Schemas, `expectedVersion`, `idempotencyKey`.
  2. `EXTERNAL_GOVERNANCE_API`: Các mutation gửi từ Admin Web lên `/v1/governance/*` (`GV-01..20`). Cần Zod Schemas.
  3. `EXTERNAL_READ_API`: Các truy vấn dữ liệu (`OP-16..22`, `GV-21..22`). Cần Query Schemas và DTO Schemas.
  4. `SYSTEM_INTERNAL`: `ProjectCareHistory` (chiếu lịch sử khi task `COMPLETED`), tự động phát sinh `AuditEvent`. Đây là xử lý nội bộ server, **KHÔNG CÓ PUBLIC NETWORK ENDPOINT**.
  5. `CLIENT_LOCAL / ADVISORY`: Pre-flight checks trên client, lưu nháp SQLite.
- **Đánh giá Chính xác về Zod:**
  Schema Zod giúp loại bỏ độ lệch giữa compile-time types và runtime validation, xác thực cấu trúc payload đầu vào từ nguồn chưa tin cậy; việc phòng chống tấn công chèn ép (injection) vẫn đòi hỏi thực hành an toàn dữ liệu và tham số hóa truy vấn ở tầng lưu trữ.

---

## 14. Phân Tích Chuyên Sâu: Ranh Giới Module & Phân Tầng Clean Architecture

- **Phân định Thẩm quyền Server vs Mobile (Khắc phục C11-10):**
  - *Domain Core trên Server (AUTHORITATIVE):* Nguồn thẩm quyền duy nhất phê duyệt chuyển trạng thái, cưỡng chế SoD và phát sinh vết kiểm toán.
  - *Domain Model trên Mobile (ADVISORY & OFFLINE BUFFER):* Quản lý tính hợp lệ của bản nháp cục bộ, hỗ trợ công thái học và hàng đợi Outbox. Tuyệt đối không coi `TaskAggregate` trên mobile là rào chắn bảo mật tối hậu.
- **Loại bỏ Chỉ tiêu Vi mô Triển khai:**
  Các mục tiêu như `MobileApp <= 150 dòng` hay cấu trúc React Context cụ thể được chuyển thành định hướng triển khai phi ràng buộc. ADR 0012 tập trung khóa: chiều phụ thuộc, trách nhiệm các tầng (Presentation, Application, Domain, Infrastructure), và ranh giới Ports & Adapters.

---

## 15. Phân Tích Chuyên Sâu: Topology Máy Chủ Sản Xuất & CSDL Quan Hệ (ADR 0013)

### Bối cảnh & Khoảng trống kỹ thuật:
Kho lưu trữ hiện tại chỉ có script thử nghiệm `scripts/greenops-dev-api.cjs`. Hàng loạt quyết định kiến trúc (`ADR 0006`, `0007`, `0009`, `0010`, `0011`) đòi hỏi một runtime máy chủ thật sự để thực thi logic nghiệp vụ có thẩm quyền.

### Đánh giá 3 phương án:
1. **Phương án A: Modular Monolith Backend Application + Relational Database Family [ĐỀ XUẤT - `ADR 0013`, Confidence: MEDIUM]:**
   - Xây dựng một ứng dụng backend duy nhất (`apps/api`) bằng Node.js / TypeScript trong monorepo.
   - Tổ chức nội bộ thành 5 module tương ứng 5 Bounded Contexts, cùng chia sẻ một cơ sở dữ liệu quan hệ.
   - Bảo đảm giao dịch ACID toàn vẹn xuyên suốt các thực thể, tận dụng 100% types từ `@novyx/contracts`, triển khai và kiểm thử siêu tinh gọn.
2. **Phương án B: Serverless / Function-Oriented Backend (FaaS):**
   - Bị bác bỏ do độ trễ khởi động lạnh (Cold Starts) làm chậm quá trình làm mới token ngầm (`QAS-SEC-01` $\le 1$s) và nguy cơ cạn kiệt connection pool CSDL quan hệ khi outbox đồng bộ hàng loạt.
3. **Phương án C: Distributed Microservices Architecture:**
   - Bị bác bỏ do over-engineering nghiêm trọng, phá vỡ giao dịch ACID và tạo ra gánh nặng vận hành khổng lồ không cần thiết.

---

## 16. Phụ Lục Bằng Chứng Kỹ Thuật Ngoài (External Technical Evidence Appendix)

| Nguồn tài liệu chính thức (Source) | Dữ kiện kỹ thuật sử dụng (Fact Used) | ADR bị ảnh hưởng |
| :--- | :--- | :---: |
| **Expo SecureStore Docs** (`docs.expo.dev/versions/v57.0.0/sdk/securestore/`) | Dữ liệu lưu trong `SharedPreferences` mã hóa bằng khóa Android Keystore trên Android; lưu trong Keychain trên iOS. | `ADR 0006` |
| **Expo SQLite Docs** (`docs.expo.dev/versions/v57.0.0/sdk/sqlite/`) | Hỗ trợ CSDL SQLite cục bộ trong sandbox ứng dụng, lưu bền vững qua các lần khởi động lại app, hỗ trợ giao dịch ACID qua `withTransactionSync`. | `ADR 0008` |
| **OWASP Access Control & Session Management Cheat Sheets** | Kiểm soát truy cập phải được thực thi máy chủ; cấm dựa vào client state; thu hồi quyền cần cơ chế versioning hoặc revocation list cho JWT. | `ADR 0006`, `ADR 0007` |
| **RFC 9110 (HTTP Semantics) §13.1.2** | Tiêu chuẩn HTTP quy định header điều kiện (`If-Match`) thất bại trả về `412 Precondition Failed`; xung đột trạng thái nghiệp vụ trả về `409 Conflict`. | `ADR 0009` |
| **IETF Draft-ietf-httpapi-idempotency-key-header** | Tiêu chuẩn dự thảo header Idempotency-Key (hiện đã expired status, nhưng là quy chuẩn API công nghiệp rộng rãi). | `ADR 0009` |

---

## 17. Bảng Kiểm Tra Phủ Định Mục Tiêu (Targeted Negative Checks Verification)

Xác minh dứt khoát rằng toàn bộ 11 giả định kỹ thuật sai lầm đã bị **BÁC BỎ HOÀN TOÀN** trong tài liệu kiến trúc:

- **`N11-01` (Tài khoản bị SUSPENDED vẫn dùng access token cũ để mutate dữ liệu đến khi hết hạn):** $\to$ **BÁC BỎ**. Cơ chế `authVersion` kiểm tra bắt buộc trên mọi lệnh mutation có thẩm quyền, lập tức từ chối `403 FORBIDDEN` ngay khi bị đình chỉ (`ADR 0006`).
- **`N11-02` (Kiểm tra chống tự duyệt SoD chỉ so sánh với `assignedStaffId` hiện tại):** $\to$ **BÁC BỎ**. Bắt buộc kiểm tra `reviewerId NOT IN historical submission author set` để bảo toàn tác quyền lịch sử (`ADR 0007`).
- **`N11-03` (Bắt buộc phải có API Gateway riêng mặc dù chưa có topology backend):** $\to$ **BÁC BỎ**. Thay thế bằng khái niệm trung lập "server request boundary middleware" (`ADR 0007`).
- **`N11-04` (Gộp `LocalSubmissionStatus` và `SyncStatus` thành một máy trạng thái):** $\to$ **BÁC BỎ**. Tách bạch nghiêm ngặt 3 chiều trạng thái độc lập (`ADR 0008`).
- **`N11-05` (Toàn bộ 48 lệnh nghiệp vụ đều phải là public REST endpoint):** $\to$ **BÁC BỎ**. Thiết lập bảng phân loại ranh giới mạng rõ ràng (`ADR 0010`).
- **`N11-06` (Lệnh `ProjectCareHistory` bắt buộc phải có endpoint mạng public):** $\to$ **BÁC BỎ**. Đây là xử lý nội bộ server khi task `COMPLETED` (`ADR 0010`).
- **`N11-07` (Chuỗi băm hàng đơn thuần chứng minh được tính chống chối bỏ trước DBA có quyền root):** $\to$ **BÁC BỎ**. Làm rõ ranh giới mô hình đe dọa; DBA root có thể sửa hash nếu không có external trust anchor (`ADR 0011`).
- **`N11-08` (Coi PostgreSQL đã là quyết định kiến trúc được chấp thuận):** $\to$ **BÁC BỎ**. Chỉ đề xuất họ CSDL quan hệ (Relational Family), PostgreSQL là candidate (`ADR 0011`, `ADR 0013`).
- **`N11-09` (Bản ghi Idempotency có thể hết hạn trong khi Outbox ngoại tuyến vẫn đang retry):** $\to$ **BÁC BỎ**. Bắt buộc retention horizon của idempotency $\ge$ chân trời retry ngoại tuyến tối đa (`ADR 0009`).
- **`N11-10` (Giấu route trong client bundle được coi là rào chắn an ninh):** $\to$ **BÁC BỎ**. Khẳng định bảo mật chỉ nằm ở ranh giới xác thực/phân quyền máy chủ (`ADR 0005`, `ADR 0007`).
- **`N11-11` (Coi `TaskAggregate` trên mobile là rào chắn an ninh có thẩm quyền cuối cùng):** $\to$ **BÁC BỎ**. Client chỉ là tư vấn công thái học và bộ đệm offline; Domain Core server là thẩm quyền tối cao (`ADR 0012`).

---

## 18. Sổ Đăng Ký Rủi Ro Kiến Trúc Kỹ Thuật (Architecture Risk Register)

| Mã rủi ro | Bằng chứng mã nguồn thực tế | Tác động kỹ thuật & nghiệp vụ | ADR giải quyết | Định hướng xử lý ở pha Triển khai (Post-ADR) |
| :---: | :--- | :--- | :---: | :--- |
| **AR-11-01** | `greenOpsService.ts:349` ép `admin` thành `Manager`. | Vi phạm ranh giới quyền lực; Admin kẹt vào luồng mobile. | `ADR 0005`, `ADR 0006` | Tạo Cổng Web Admin riêng; chặn tài khoản Admin trên mobile. |
| **AR-11-02** | Toàn bộ dữ liệu nằm trên biến RAM `let snapshot: AppData`. | Mất sạch bằng chứng và ảnh khi app bị tắt ngầm hoặc rớt mạng. | `ADR 0008` | Cài đặt `expo-sqlite` và hàng đợi Outbox bền vững. |
| **AR-11-03** | `ManagerReview.tsx:132-167` tự tạo `fallbackTask` để đổi status. | Rò rỉ logic trạng thái vào JSX; không unit test được. | `ADR 0007`, `ADR 0012` | Chuyển logic vào Domain Entity `TaskAggregate` và Use Case. |
| **AR-11-04** | `@novyx/contracts` thiếu 2 trạng thái, thiếu ProofProfile, thiếu DTO ngoại lệ/governance. | Hợp đồng kỹ thuật không tương thích với nghiệp vụ chuẩn tắc. | `ADR 0010` | Nâng cấp contracts bằng Zod schema, phủ đủ 48 lệnh chuẩn tắc. |
| **AR-11-05** | `TaskDto` thiếu `version`; các mutation thiếu `Idempotency-Key`. | Nguy cơ ghi đè dữ liệu (Lost Updates) và duplicate requests. | `ADR 0009` | Bổ sung trường `version` (OCC) và header `Idempotency-Key`. |

---

## 19. Sổ Đăng Ký Ứng Viên Quyết Định Kiến Trúc (Candidate ADR Register)

| Mã ADR | Tiêu đề quyết định | Trạng thái | Câu hỏi quyết định cốt lõi | Khuyến nghị kỹ thuật | Độ tin cậy (Confidence) |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **[ADR 0005](file:///d:/ki7/EXE/tree/docs/adr/0005-admin-client-topology.md)** | Platform Administrator Client Delivery Topology | `PROPOSED` | Triển khai giao diện Admin qua kênh nào? | Tách thành Cổng Web Quản trị độc lập (`apps/admin-web`). | **MEDIUM** |
| **[ADR 0006](file:///d:/ki7/EXE/tree/docs/adr/0006-iam-session-lifecycle.md)** | IAM, Session Lifecycle & Role Administration | `PROPOSED` | Cơ chế xác thực, phiên và thu hồi tài khoản? | Signed Short-Lived Access Token + Refresh Token Rotation + Server Account Version Check. | **MEDIUM** |
| **[ADR 0007](file:///d:/ki7/EXE/tree/docs/adr/0007-authorization-enforcement-architecture.md)** | Multi-Tier Authorization Enforcement | `PROPOSED` | Thực thi Action Eligibility và SoD tác quyền lịch sử ở đâu? | Phòng thủ đa chiều: Client Advisory Helper + Server Boundary Middleware + Domain Aggregate Authoritative Gate. | **HIGH** |
| **[ADR 0008](file:///d:/ki7/EXE/tree/docs/adr/0008-offline-durable-storage-outbox.md)** | Offline Durable Storage & Outbox Synchronization | `PROPOSED` | Engine lưu trữ nào đảm bảo không mất dữ liệu ngoại tuyến? | SQLite (`expo-sqlite`) cho dữ liệu quan hệ/outbox + Sandbox Filesystem cho ảnh. | **HIGH** |
| **[ADR 0009](file:///d:/ki7/EXE/tree/docs/adr/0009-concurrency-idempotency-strategy.md)** | Optimistic Concurrency Control & Idempotency | `PROPOSED` | Ngăn chặn xung đột đồng thời và gửi trùng lệnh ra sao? | Command Payload OCC (`expectedVersion`) + Header `Idempotency-Key: <UUIDv4>`. | **HIGH** |
| **[ADR 0010](file:///d:/ki7/EXE/tree/docs/adr/0010-contracts-runtime-validation-governance-api.md)** | Contract Evolution & Runtime Validation | `PROPOSED` | Tái cấu trúc `@novyx/contracts` thế nào để kiểm thực runtime? | Zod Schema-First Contracts với tự động suy luận TypeScript types; phân loại ranh giới Network API. | **HIGH** |
| **[ADR 0011](file:///d:/ki7/EXE/tree/docs/adr/0011-audit-trail-persistence-integrity.md)** | Audit Trail Persistence & Tamper-Evident Integrity | `PROPOSED` | Lưu trữ vết kiểm toán chống sửa đổi bằng cách nào? | Bảng SQL append-only có phân quyền CSDL (`REVOKE UPDATE/DELETE`) + Stream-Partitioned Hash-Chain. | **MEDIUM** |
| **[ADR 0012](file:///d:/ki7/EXE/tree/docs/adr/0012-clean-architecture-transitional-facade-decomposition.md)** | Clean Architecture & Facade Decomposition | `PROPOSED` | Phân tầng kiến trúc và bóc tách `greenOpsService` thế nào? | Pragmatic Clean Architecture (Ports & Adapters) trong monorepo; phân tách rõ thẩm quyền Server vs Mobile. | **HIGH** |
| **[ADR 0013](file:///d:/ki7/EXE/tree/docs/adr/0013-backend-runtime-persistence-topology.md)** | Backend Runtime & Relational Persistence Topology | `PROPOSED` | Topology máy chủ sản xuất và lưu trữ bền vững nào cung cấp ranh giới API có thẩm quyền? | Modular Monolith Backend Application (Node.js/TypeScript `apps/api`) + Relational Database Family. | **MEDIUM** |

---

## 20. Bảng Đệ Trình Quyết Định Cho Chủ Quản (Decisions Required From Owner)

| Mã ADR | Tiêu đề quyết định | Phương án đề xuất | Đánh đổi kỹ thuật cốt lõi | Hành động của Owner |
| :---: | :--- | :--- | :--- | :---: |
| **ADR 0005** | Admin Delivery Channel | Xây dựng Admin Web độc lập (`apps/admin-web`). *(Confidence: MEDIUM)* | Tăng 1 web app trong monorepo, đổi lại tính công thái học và tách biệt bề mặt phát hành. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0006** | IAM & Session Lifecycle | Signed Short-Lived Access Token + Refresh Token Rotation + Server Account Version Check. *(Confidence: MEDIUM)* | Kiểm tra version trên mutating commands tại server, đổi lại thu hồi quyền tức thì khi đình chỉ. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0007** | Authorization Enforcement | Phòng thủ đa tầng (UI Advisory + Route Middleware + Domain Gate). *(Confidence: HIGH)* | Viết kiểm tra quyền ở 2 lớp, đổi lại SoD chống tự duyệt bảo vệ trên tác quyền lịch sử. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0008** | Offline Durable Storage | SQLite (`expo-sqlite`) + Sandbox Filesystem. *(Confidence: HIGH)* | Cần quản lý SQL migrations, đổi lại tính toàn vẹn ACID chống mất dữ liệu khi tắt app/rớt mạng. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0009** | Concurrency & Idempotency | Command Payload OCC (`expectedVersion`) + Idempotency-Key UUID. *(Confidence: HIGH)* | Client phải xử lý mã lỗi 409, đổi lại khả năng retry mạng an toàn tuyệt đối với retention horizon chuẩn. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0010** | Contracts & Runtime Zod | Zod Schemas trong `@novyx/contracts`, phân loại ranh giới Network API. *(Confidence: HIGH)* | Thêm thư viện `zod` (~14kb), đổi lại kiểm soát runtime, triệt tiêu lỗi sập app do payload sai. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0011** | Audit Trail Persistence | DB Privilege Separation + Stream-Partitioned Hash-Chain. *(Confidence: MEDIUM)* | Thêm micro-giây tính hash, đổi lại loại bỏ nghẽn ghi đồng thời và ngăn chặn sửa đổi qua app. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0012** | Clean Architecture Layering| Ports & Adapters trong Monorepo; phân định thẩm quyền Server vs Mobile. *(Confidence: HIGH)* | Cần tái cấu trúc lại screens, đổi lại khả năng unit test và cô lập máy trạng thái. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0013** | Backend Runtime & Topology | Modular Monolith Backend (`apps/api`) + Relational Database Family. *(Confidence: MEDIUM)* | Triển khai nguyên khối có cấu trúc, đổi lại giao dịch ACID toàn vẹn xuyên suốt 5 context. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |

---

## 21. Các Quyết Định Tạm Thời Chưa Đưa Ra (Explicit Non-Decisions)

Để duy trì tính tinh gọn và tránh over-engineering, các hạng mục kỹ thuật sau đây **CỐ Ý CHƯA QUYẾT ĐỊNH (EXPLICITLY DEFERRED)** trong Phase 11A:
1. **Lựa chọn Framework Web cụ thể cho Admin Web:** Tạm thời xác định hình thái là Web Application (`apps/admin-web`); việc chọn giữa Vite React SPA hay Next.js sẽ được chốt sau khi Owner phê duyệt `ADR 0005`.
2. **Lựa chọn Vendor CSDL Cụ thể cho Backend:** Tạm thời xác định họ cơ sở dữ liệu quan hệ (Relational Database Family per `ADR 0013`); việc chốt giữa PostgreSQL, MySQL, hay MariaDB sẽ được quyết định tại pha lập kế hoạch triển khai.
3. **Hạ tầng Dịch vụ Lưu trữ File (Cloud Object Storage Provider):** Tạm thời chuẩn hóa cơ chế nộp file là Multipart HTTP upload; việc chọn giữa AWS S3, Cloudflare R2, hay MinIO cục bộ sẽ được quyết định ở pha thiết kế hạ tầng backend.
4. **Mô hình Phân vùng Địa lý Chi tiết cho Quản lý:** Khái niệm `AUTHORIZED_OPERATIONAL_SCOPE` tiếp tục được giữ ở mức trừu tượng miền, chưa gán cứng vào bảng `regions` hay `teams` nào trong CSDL.
5. **Cơ chế Triển khai Hạ tầng Máy chủ Chi tiết:** Chưa quyết định giữa Docker Compose, Kubernetes, hay Serverless Container, vì hệ thống hiện đang tập trung vào tầng kiến trúc logic và hợp đồng.

---

## 22. Xác Minh Ranh Giới Mã Nguồn Tuyệt Đối (Source Boundary Verification)

Kiểm tra nghiêm ngặt tính bất biến của hệ thống trước khi nộp báo cáo:
- `git diff --name-only c235ebbf41dfd1390c759e719da7614b9544d031 HEAD -- apps packages` $\to$ **0 diff** (Mã nguồn ứng dụng và gói contracts giữ nguyên 100%).
- `git diff --name-only c235ebbf41dfd1390c759e719da7614b9544d031 HEAD -- docs/PRODUCT.md docs/DOMAIN.md docs/ACCESS-CONTROL.md docs/WORKFLOWS.md docs/REQUIREMENTS-TRACEABILITY.md docs/business-reconciliation` $\to$ **0 diff** (Tài liệu nghiệp vụ chuẩn tắc và bằng chứng đóng băng giữ nguyên 100%).
- `git diff --name-only c235ebbf41dfd1390c759e719da7614b9544d031 HEAD -- docs/diagrams` $\to$ **0 diff** (Bộ biểu đồ giữ nguyên 100%).
- `git diff --name-only c235ebbf41dfd1390c759e719da7614b9544d031 HEAD -- docs/ARCHITECTURE.md` $\to$ **0 diff** (Tài liệu kiến trúc chuẩn tắc giữ nguyên, chỉ cập nhật sau khi Owner duyệt ADR).
- `git diff --name-only c235ebbf41dfd1390c759e719da7614b9544d031 HEAD -- docs/adr/0001* docs/adr/0002* docs/adr/0003* docs/adr/0004*` $\to$ **0 diff** (ADR hiện hữu giữ nguyên 100%).

---

## KẾT LUẬN GIAI ĐOẠN PHASE 11A (FINAL CONCLUSION)

Toàn bộ công tác khám phá kiến trúc kỹ thuật và hoàn thiện bộ ứng viên ADR của Phase 11A đã hoàn tất với tính kỷ luật và độ chính xác kỹ thuật tối đa:
- Đã khảo sát và lập bản đồ hiện trạng mã nguồn thực tế, nhận diện chính xác 5 rủi ro kỹ thuật cốt tử (`AR-11-01..05`).
- Đã trích xuất và truy vết 13 động lực kiến trúc giải pháp trung lập (solution-neutral drivers), liên kết trực tiếp với các kịch bản chất lượng NFR và bằng chứng thực tế.
- Đã khởi tạo đầy đủ 9 ứng viên quyết định kiến trúc (`ADR 0005` đến `ADR 0013`) bao phủ toàn diện từ Admin Topology, IAM, Phân quyền, Lưu trữ Ngoại tuyến, Tranh chấp & Lũy lượng, Hợp đồng & Zod, Vết kiểm toán, Clean Architecture, đến Topology Backend Sản xuất.
- Đã bác bỏ dứt khoát 11 giả định kỹ thuật sai lầm (`N11-01..11`) qua kiểm tra phủ định mục tiêu.
- Tuyệt đối không tự ý phê duyệt ADR (`Status: PROPOSED`), không sửa mã nguồn, không làm biến dạng nghiệp vụ.

Hệ thống đã sẵn sàng 100% để **Chủ quản (Owner) tiến hành thẩm tra và đưa ra quyết định phê duyệt chính thức**.
