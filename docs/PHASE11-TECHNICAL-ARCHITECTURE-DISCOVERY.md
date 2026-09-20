# BÁO CÁO KHÁM PHÁ KIẾN TRÚC KỸ THUẬT & TẬP HỢP ĐỀ XUẤT ADR
## NOVYX GREENOPS — PHASE 11A: TECHNICAL ARCHITECTURE DISCOVERY

> **Mã tài liệu:** `docs/PHASE11-TECHNICAL-ARCHITECTURE-DISCOVERY.md`
> **Trạng thái:** `COMPLETED & RATIFIED AS PROPOSAL (ĐỀ XUẤT KIẾN TRÚC CHỜ OWNER DUYỆT)`
> **Giai đoạn:** Phase 11A — Technical Architecture Discovery & ADR Candidate Set
> **Cam kết đầu vào:** Commit [`c235ebbf41dfd1390c759e719da7614b9544d031`](https://github.com/Peaker04/tree/commit/c235ebbf41dfd1390c759e719da7614b9544d031) / Tree `2827283630177ca83b6125149429dcde28ce3adb`
> **Tài liệu tham chiếu tối cao:** [PRODUCT.md](file:///d:/ki7/EXE/tree/docs/PRODUCT.md), [DOMAIN.md](file:///d:/ki7/EXE/tree/docs/DOMAIN.md), [ACCESS-CONTROL.md](file:///d:/ki7/EXE/tree/docs/ACCESS-CONTROL.md), [WORKFLOWS.md](file:///d:/ki7/EXE/tree/docs/WORKFLOWS.md), [REQUIREMENTS-TRACEABILITY.md](file:///d:/ki7/EXE/tree/docs/REQUIREMENTS-TRACEABILITY.md), [NFR.md](file:///d:/ki7/EXE/tree/docs/NFR.md), [13-BUSINESS-BASELINE-FREEZE.md](file:///d:/ki7/EXE/tree/docs/business-reconciliation/13-BUSINESS-BASELINE-FREEZE.md), [POST-SYNC-IMPLEMENTATION-GAP-MAP.md](file:///d:/ki7/EXE/tree/docs/POST-SYNC-IMPLEMENTATION-GAP-MAP.md), [12-BUSINESS-CONSISTENCY-AUDIT.md](file:///d:/ki7/EXE/tree/docs/business-reconciliation/12-BUSINESS-CONSISTENCY-AUDIT.md).

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
  - *Ranh giới thẩm quyền Admin:* Admin có **ZERO normal Task mutation / execution / review / operational decision authority** (DENY trên `OP-01`, `OP-02`, `OP-03`, `OP-04`, `OP-05..15`, `OP-16`, `OP-17..21`). Admin bảo lưu quyền đọc duy nhất đối với **`OP-22 ViewCareHistory`** trong `PLATFORM_GOVERNANCE_SCOPE`.
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

| Mã Động Lực | Nhóm phân loại | Nguồn gốc nghiệp vụ / NFR | Nhu cầu kỹ thuật & Quyết định cần đưa ra (Technical Need & Decision Needed) | Mức ưu tiên | Cần quyết định kiến trúc? | Ứng viên ADR liên quan |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: |
| **DRV-01** | `CLIENT` | `BR-ACT-01`, `CAP-ADM-01..09` (Admin cấm thao tác task hiện trường, bảo lưu OP-22) | Cần xác lập hình thái triển khai bề mặt cho Quản trị viên đáp ứng mật độ thông tin desktop, tách biệt bề mặt phát hành và hỗ trợ quyền đọc `OP-22 ViewCareHistory`. | **P0** | **CÓ** | `ADR 0005` |
| **DRV-02** | `IAM` | `DR-HARD-05`, `CAP-ADM-03..04`, `WF-12` (Đình chỉ chặn 100% authenticated actions) | Cần một thiết kế xác thực và quản lý phiên hỗ trợ: tiếp tục soạn thảo ngoại tuyến trên mobile, thu hồi quyền tức thì đối với TOÀN BỘ hành động được bảo vệ (cả đọc và ghi) khi đình chỉ, và lưu trữ token an toàn trên thiết bị. | **P0** | **CÓ** | `ADR 0006` |
| **DRV-03** | `AUTHZ` | `Report 07`, `Report 12 §4` (Action Eligibility, SoD-01..07) | Cần cơ chế thực thi phân quyền đa tầng đảm bảo $Role \land Scope \land State \land Preconditions$ và SoD dựa trên tác quyền lịch sử được cưỡng chế có thẩm quyền tại ranh giới máy chủ, trong khi client chỉ đóng vai trò hướng dẫn công thái học. | **P0** | **CÓ** | `ADR 0007` |
| **DRV-04** | `OFFLINE` | `DR-HARD-04`, `QAS-OFFLINE-01`, `QAS-OFFLINE-02` (Độ bền vững dữ liệu ngoại tuyến) | Cần giải pháp lưu trữ cấu trúc bền vững cục bộ với ngữ nghĩa transactional outbox, tách biệt lưu trữ tệp ảnh nhị phân và cung cấp các nguyên thủy bền vững vượt qua kiểm thử ngắt tiến trình. | **P0** | **CÓ** | `ADR 0008` |
| **DRV-05** | `SYNC` | `DOMAIN.md §3`, `QAS-OFFLINE-01` (Tách TaskStatus server và PENDING_SYNC client) | Cần cơ chế đồng bộ bất đồng bộ tách bạch trạng thái gửi cục bộ (`PENDING_SYNC`) khỏi trạng thái có thẩm quyền của server (`IN_PROGRESS`), hỗ trợ thử lại có backoff và bảo toàn bằng chứng khi lỗi. | **P0** | **CÓ** | `ADR 0008`, `ADR 0009` |
| **DRV-06** | `CONCURRENCY` | `DOMAIN.md §3` (Phòng ngừa xung đột khi Quản lý đổi người/hủy việc lúc Nhân viên mất mạng) | Cần ngữ nghĩa kiểm soát tranh chấp đồng thời và tính lũy lượng tại ranh giới mạng/domain để phát hiện xung đột dữ liệu cũ (409) và cho phép thử lại mạng an toàn không sinh trùng lặp với retention horizon chuẩn. | **P0** | **CÓ** | `ADR 0009` |
| **DRV-07** | `CONTRACT` | `DOMAIN.md §3..5`, `ADR 0003` (Bảo tồn định danh 48 commands, phân loại ranh giới API) | Cần cơ chế kiểm thực lược đồ runtime để chặn payload sai lệch ngay tại ranh giới mạng, đồng bộ với compile-time types, bảo tồn chính xác OP-01..22 và GV-01..22, phân biệt rõ Command $\ne$ Route $\ne$ DTO. | **P0** | **CÓ** | `ADR 0010` |
| **DRV-08** | `AUDIT` | `CAP-ADM-05`, `DR-POL-04` (Lưu vết kiểm toán append-only, chống giả mạo, tra cứu nhanh) | Cần giải pháp lưu trữ kiểm toán append-only, chống sửa/xóa bởi các tác nhân sản phẩm, hỗ trợ truy vấn lọc đa tiêu chí hiệu năng cao và loại trừ điểm nghẽn ghi đồng thời qua phân vùng chuỗi băm. | **P1** | **CÓ** | `ADR 0011` |
| **DRV-09** | `MODULE` | `ARCHITECTURE.md §2`, `POST-SYNC Gap 13` (Phân rã monolith 2.900 dòng) | Cần phân định ranh giới kiến trúc rõ ràng (presentation, use cases, domain core, infrastructure adapters) để cô lập logic nghiệp vụ, phân tách thẩm quyền Server vs Mobile và hỗ trợ kiểm thử độc lập. | **P1** | **CÓ** | `ADR 0012` |
| **DRV-10** | `PERF` | `QAS-PERF-01` (Cuộn danh sách 200–1.000 cây mượt mà trên Android 3GB RAM) | Cần áp dụng ảo hóa danh sách và tối ưu hóa bộ nhớ trên thiết bị di động cấu hình khiêm tốn. | **P1** | KHÔNG (Quy chuẩn mã nguồn) | `NFR.md` |
| **DRV-11** | `SECURITY` | `QAS-SEC-01` (Làm mới token ngầm $\le 1$s; bảo toàn form khi hết hạn) | Cần cơ chế tự động gia hạn phiên ngầm và bảo vệ bản nháp form để ngăn ngừa gián đoạn quy trình thu nộp ngoài thực địa. | **P1** | **CÓ** | `ADR 0006` |
| **DRV-12** | `A11Y` | `QAS-A11Y-01` (Tương tác ngoài trời nắng chói, tiếng Việt có dấu, touch target $\ge 48\text{px}$) | Cần tuân thủ chặt chẽ design tokens của `@novyx/ui` và thiết kế màn hình dễ thao tác một tay ngoài trời. | **P1** | KHÔNG (Tuân thủ UI tokens) | `ADR 0004` |
| **DRV-13** | `TOPOLOGY` | `DOMAIN.md §2..3`, `NFR.md` (Ranh giới máy chủ có thẩm quyền thực thi 5 Bounded Contexts) | Cần xác lập topology máy chủ sản xuất (production server runtime) và engine lưu trữ bền vững để thực thi use cases, quản lý giao dịch scoped ACID, và cung cấp ranh giới API có thẩm quyền mà không làm mờ quyền sở hữu ngữ cảnh. | **P0** | **CÓ** | `ADR 0013` |

---

## 5. Phân Tích Các Yêu Cầu Phi Chức Năng (NFR / Quality Attributes Traceability)

Mỗi kịch bản thuộc tính chất lượng (QAS) trong `NFR.md` được kết nối trực tiếp với giải pháp kiến trúc:

- **`QAS-OFFLINE-01` (Bảo toàn bằng chứng khi mất mạng giữa chừng):**
  - *Giải pháp kiến trúc:* `ADR 0008` thiết lập bảng CSDL cục bộ `tasks`, `task_evidence`, `checklist_items` trên nền `expo-sqlite`. Khi mất mạng, mọi thao tác ghi nhận bằng chứng đều được commit vào SQLite trong $< 50\text{ms}$. Thao tác "Gửi duyệt" tạo bản ghi `outbox_queue` với `LocalSubmissionStatus = PENDING_SYNC`.
  - *Nghiệm thu:* Được kiểm chứng thông qua bộ kiểm thử ngắt tiến trình (process kill) và ngắt giao dịch thực nghiệm.
- **`QAS-OFFLINE-02` (Khôi phục trạng thái sau khi hệ điều hành tắt ngầm Camera):**
  - *Giải pháp kiến trúc:* `ADR 0008` sao chép ảnh chụp từ cache tạm vào thư mục bền vững của app (`documentDirectory`) ngay khi chụp xong và ghi URI vào SQLite. Khi mở lại app, Use Case khôi phục phiên và bản nháp từ SQLite trong $\le 2\text{s}$.
  - *Nghiệm thu:* Thời gian phục hồi $\le 2\text{s}$, không phải thực hiện lại các bước trước.
- **`QAS-PERF-01` (Hiệu năng cuộn danh sách lớn ngoài trời):**
  - *Giải pháp kiến trúc:* Áp dụng `FlatList` với cơ chế ảo hóa dòng (windowing), cấu hình `maxToRenderPerBatch = 10`, `windowSize = 5`, sử dụng `keyExtractor` ổn định (`tree.id` / `task.id`).
  - *Nghiệm thu:* Tỷ lệ khung hình rơi $< 5\%$, hướng tới 60 FPS trên thiết bị Android RAM 3GB.
- **`QAS-SEC-01` (Làm mới token ngầm không làm mất dữ liệu form):**
  - *Giải pháp kiến trúc:* `ADR 0006` thiết kế chu trình Refresh Token Rotation (RTR). Interceptor phía client bắt mã lỗi 401, tạm hoãn các request đang chờ, gửi lệnh `/v1/auth/refresh` lấy access token mới trong $< 1\text{s}$, và tự động gửi lại request ban đầu.
- **`QAS-FAULT-01` (Xử lý lỗi hệ thống 503 / Timeout):**
  - *Giải pháp kiến trúc:* `ADR 0009` và `ADR 0010` quy định Outbox Worker chỉ tự động thử lại khi gặp lỗi mạng hoặc lỗi server 5xx (kèm exponential backoff). Gặp lỗi 4xx (vi phạm nghiệp vụ / SoD / Preconditions), worker dừng thử lại và đánh dấu `SyncStatus = SYNC_FAILED` kèm lý do rõ ràng mà không xóa bỏ bằng chứng thực địa.

---

## 6. Đánh Giá Tính Tương Thích Của Các Quyết Định Kiến Trúc Hiện Hữu (ADR 0001..0004)

- **`ADR 0001` (Monorepo Foundation):** `ACCEPTED` $\to$ **GIỮ NGUYÊN (`KEEP`)**. Cấu trúc monorepo là nền tảng hoàn hảo để chứa `apps/mobile`, `apps/admin-web`, `apps/api`, và các gói `packages/*`.
- **`ADR 0002` (Hermes Agent Submodule):** `ACCEPTED` $\to$ **GIỮ NGUYÊN (`KEEP`)**. Pinned commit ở `external/hermes-agent` tiếp tục được bảo toàn, không bị sửa đổi.
- **`ADR 0003` (Contract-first REST API):** `ACCEPTED` $\to$ **CẦN ADR TIẾP NỐI (`NEEDS_FOLLOWUP_ADR`)**. Định hướng REST và shared contracts được giữ vững, nhưng cần `ADR 0010` để bổ sung runtime schema validation (Zod) và mở rộng DTO theo cam kết còn nợ trong mục Tradeoffs của ADR 0003.
- **`ADR 0004` (Shared UI Tokens):** `ACCEPTED` $\to$ **GIỮ NGUYÊN (`KEEP`)**. Token trong `packages/ui` đóng vai trò nguồn chân lý thiết kế cho toàn bộ các màn hình hiện trường và giao diện quản trị sau này.

---

## 7. Phân Tích Chuyên Sâu: Hình Thái Triển Khai Giao Diện Quản Trị Viên (Admin Client Topology)

### Bối cảnh & Ranh giới Quyền hạn Chuẩn tắc (Khắc phục R11-05):
- **Quyền hạn Quản trị:** Admin là vai trò quản trị MVP độc lập với 9 nhóm năng lực (`CAP-ADM-01..09`, `GV-01..19`).
- **Ranh giới Cấm Tác nghiệp:** Platform Administrator có **ZERO normal Task mutation / execution / review / operational decision authority** (DENY trên `OP-01`, `OP-02`, `OP-03`, `OP-04`, `OP-05..15`, `OP-16`, `OP-17..21`).
- **Bảo lưu Quyền Đọc `OP-22 ViewCareHistory`:** Văn bản phân quyền chuẩn tắc cấp quyền ALLOW cho Admin tra cứu lịch sử chăm sóc cây xanh phục vụ giám sát lâm sinh và tuân thủ.
- **Làm rõ Ranh giới An ninh:**
  - Tách ứng dụng Web giúp phân tách bề mặt phát hành và giảm nguy cơ vô tình để lộ UI quản trị cho công nhân hiện trường.
  - **Tách bundle client TUYỆT ĐỐI KHÔNG PHẢI RÀO CHẮN PHÂN QUYỀN:** Ranh giới bảo mật thực sự nằm ở cơ chế xác thực và phân quyền máy chủ (`ADR 0006`, `ADR 0007`).
  - Quyền đọc `OP-22 ViewCareHistory` có thể được tích hợp trực tiếp vào Cổng Web Quản trị mà không biến Admin thành Operations Manager.

### Đánh giá 3 phương án:
1. **Phương án A (Nhúng vào Mobile App hiện tại):** Bị bác bỏ do xung ঢুক công thái học và tăng kích thước file APK di động.
2. **Phương án B (Xây dựng Cổng Quản trị Web độc lập `apps/admin-web`) [ĐỀ XUẤT - `ADR 0005`, Confidence: MEDIUM]:** Tối ưu hóa trải nghiệm desktop; tách biệt bề mặt phát hành; tích hợp tra cứu `OP-22`; tuân thủ chuẩn monorepo.
3. **Phương án C (Universal React Native Web):** Bị bác bỏ vì độ phức tạp phát triển cao và trải nghiệm web vụng về.

---

## 8. Phân Tích Chuyên Sâu: IAM, Phiên Làm Việc & Độ Tươi Ủy Quyền (Authorization Freshness)

- **Cơ chế xác thực & Độ tươi ủy quyền (`ADR 0006` - Khắc phục R11-02):**
  - Access Token ngắn hạn (thông số đề xuất: 15 phút, chờ security review).
  - Refresh Token dài hạn (thông số đề xuất: 30 ngày, chờ security review) lưu an toàn trong `expo-secure-store` trên mobile và cookie `HttpOnly; SameSite=Strict` trên web.
  - **Chặn đứng Toàn bộ Hành động khi Đình chỉ (`WF-12`):**
    Chữ ký mã hóa JWT hợp lệ **KHÔNG ĐỦ** để cấp quyền sau khi bị đình chỉ. Đối với **MỌI YÊU CẦU MÁY CHỦ ĐƯỢC BẢO VỆ (CẢ ĐỌC VÀ GHI)** — bao gồm `ViewAssignedTask`, `ViewOperationalTask`, `ViewCareHistory`, `ViewAuditLog`, cũng như `SubmitEvidence` và các lệnh Governance — máy chủ bắt buộc đối soát `accountStatus === 'ACTIVE'` và `token.authVersion === user.authVersion`.
  - Khi Admin thực hiện `SuspendAccount` hoặc `DisableAccount`, `authVersion` được tăng ngay lập tức. Mọi request tiếp theo (kể cả đọc audit hay đọc task) đều bị từ chối `403 FORBIDDEN: ACCOUNT_SUSPENDED`.
  - **Bảo toàn bản nháp ngoại tuyến:** Bản nháp trên máy di động vẫn được bảo toàn trong SQLite; tuy nhiên, khi kết nối mạng trở lại, mọi tương tác máy chủ đều bị từ chối dứt khoát nếu tài khoản đã bị đình chỉ.
- **Lưu trữ an toàn trên thiết bị:**
  - Android: `SharedPreferences` mã hóa bằng khóa Android Keystore.
  - iOS: Keychain.

---

## 9. Phân Tích Chuyên Sâu: Kiến Trúc Thực Thi Phân Quyền (Authorization Enforcement)

Nguyên tắc **Action Eligibility** được thực thi qua mô hình **Phòng thủ Đa chiều (Multi-Tier Defense-in-Depth - `ADR 0007`)**:

1. **Tầng 1 — Trợ giúp Công thái học phía Client (Presentation Guard — Advisory Only):**
   - Các hàm thuần túy (Pure Functions) trong `@novyx/domain` đánh giá nhanh để ẩn/hiện nút bấm, vô hiệu hóa form và hiển thị tooltip hướng dẫn.
   - **Ranh giới cốt tử:** Client eligibility **CHỈ MANG TÍNH TƯ VẤN CÔNG THÁI HỌC VÀ HỖ TRỢ OFFLINE**, tuyệt đối không phải rào chắn bảo mật!
2. **Tầng 2 — Rào chắn Tuyến Yêu cầu Máy chủ (Server Request Boundary Middleware — Authoritative Coarse Gate):**
   - Middleware máy chủ trung lập kiểm tra JWT, kiểm tra `accountStatus === 'ACTIVE'`, chặn Admin vào route mutation `/v1/tasks/*` và chặn Staff/Manager vào route `/v1/governance/*`.
3. **Tầng 3 — Rào chắn Cốt lõi Miền Nghiệp vụ Máy chủ (Authoritative Fine-Grained Gate):**
   - Use Case và Aggregate Root trên máy chủ kiểm tra toàn diện trạng thái tiên quyết, phạm vi tài nguyên và:
   - **Quy tắc Chống Tự duyệt Dựa trên Tác quyền Lịch sử (`SoD-02`):**
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
- **Giải quyết Điểm nghẽn Ghi đồng thời:**
  Áp dụng **Chuỗi băm phân vùng theo luồng thực thể (Stream-Partitioned Hash Chaining)**, cho phép các tác vụ ghi kiểm toán trên các luồng tài nguyên khác nhau diễn ra đồng thời mà không bị lock contention.

---

## 11. Phân Tích Chuyên Sâu: Engine Lưu Trữ Bền Vững Ngoại Tuyến & Hàng Đợi Outbox

### Phân định Rạch ròi 3 Chiều Trạng thái:
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
- **Độ Bền vững Được Định Giới Hạn Thực Nghiệm (Khắc phục R11-04):**
  `expo-sqlite` và `expo-file-system` cung cấp các nguyên thủy bền vững cần thiết. Việc đáp ứng `QAS-OFFLINE-01` và `QAS-OFFLINE-02` được định nghĩa là mục tiêu thiết kế và phải được nghiệm thu thông qua bộ kiểm thử ngắt tiến trình và lỗi mạng thực tế.

---

## 12. Phân Tích Chuyên Sâu: Kiểm Soát Tranh Chấp (Concurrency) & Lũy Lượng (Idempotency)

- **Chuẩn hóa Hợp đồng Tranh chấp:**
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
- **Bảo tồn Tuyệt đối Định danh Lệnh Nghiệp vụ (Khắc phục R11-01):**
  $$\text{Business Command Identity} \neq \text{HTTP Route Identity} \neq \text{DTO Type Name}$$
  Bảo tồn nguyên vẹn danh mục chuẩn tắc gồm 22 lệnh vận hành (`OP-01..22`), 22 lệnh quản trị (`GV-01..22`), và 4 lệnh RTM bổ sung. Tuyệt đối không dùng tên route hay DTO để đổi tên command chuẩn tắc.
- **Phân loại Ranh giới Network API:**
  - `EXTERNAL_OPERATIONAL_API`: Lệnh tác nghiệp gửi lên máy chủ (`OP-03..05`, `OP-08..11`, `OP-15`, `OP-18..21`, ngoại lệ RTM).
  - `EXTERNAL_GOVERNANCE_API`: Lệnh quản trị gửi lên máy chủ (`GV-01..07`, `GV-10..19`).
  - `EXTERNAL_READ_API`: Truy vấn dữ liệu (`OP-01..02`, `OP-16..17`, `OP-22`, `GV-08..09`, `LookupTreeByQr`).
  - `SYSTEM_INTERNAL`: `ProjectCareHistory` (chiếu lịch sử khi task `COMPLETED`), tự động phát sinh `AuditEvent`. Đây là xử lý nội bộ server, **KHÔNG CÓ ENDPOINT MẠNG**.
  - `CLIENT_LOCAL_ADVISORY`: `VerifyGps` (OP-06), `VerifyQr` (OP-07), `CaptureProofEvidence` (OP-12), `CompleteChecklist` (OP-13), `RecordStructuredFindings` (OP-14).
  - `FUTURE_NOT_ACTIVE`: `GV-20 ManageDynamicFindingsTemplate` (NEXT), `GV-21 UseBreakGlass` (NEXT).
  - `NOT_NETWORK_EXPOSED`: `GV-22 ManagePlatformSystemConfig` (REJECTED).

---

## 14. Phân Tích Chuyên Sâu: Ranh Giới Module & Phân Tầng Clean Architecture

- **Phân định Thẩm quyền Server vs Mobile:**
  - *Domain Core trên Server (AUTHORITATIVE):* Nguồn thẩm quyền duy nhất phê duyệt chuyển trạng thái, cưỡng chế SoD và phát sinh vết kiểm toán.
  - *Domain Model trên Mobile (ADVISORY & OFFLINE BUFFER):* Quản lý tính hợp lệ của bản nháp cục bộ, hỗ trợ công thái học và hàng đợi Outbox. Tuyệt đối không coi `TaskAggregate` trên mobile là rào chắn bảo mật tối hậu.
- **Loại bỏ Chỉ tiêu Vi mô Triển khai:**
  Các mục tiêu như `MobileApp <= 150 dòng` hay cấu trúc React Context cụ thể được chuyển thành định hướng triển khai phi ràng buộc. ADR 0012 tập trung khóa: chiều phụ thuộc, trách nhiệm các tầng (Presentation, Application, Domain, Infrastructure), và ranh giới Ports & Adapters.

---

## 15. Phân Tích Chuyên Sâu: Topology Máy Chủ Sản Xuất & CSDL Quan Hệ (ADR 0013)

### Phân định Rạch ròi Động lực Nghiệp vụ và Giải pháp Kỹ thuật (Khắc phục R11-03):
- **Yêu cầu Nghiệp vụ Chuẩn tắc (Frozen):**
  - Quyền sở hữu ngữ cảnh có thẩm quyền (Authoritative Context Ownership).
  - Ý nghĩa tham chiếu xuyên suốt (Referential Meaning).
  - Tính toàn vẹn lịch sử (Historical Integrity).
  - *Nghiệp vụ tuyệt đối KHÔNG yêu cầu: Foreign Key, CSDL dùng chung, CSDL riêng, hay Message Broker.*
- **Giải pháp Kỹ thuật Đề xuất (Technical Choice):**
  - Lựa chọn CSDL Quan hệ (Relational Database Family) và khóa ngoại (Foreign Keys) là **hệ quả quyết định kỹ thuật đề xuất**, không phải luật nghiệp vụ bắt buộc.
- **Nguyên tắc An toàn Miền Dữ liệu Xuyên Ngữ cảnh (Cross-Context Safety):**
  - Việc dùng chung một CSDL quan hệ vật lý **KHÔNG CHO PHÉP** module này trực tiếp mutate bảng dữ liệu thuộc quyền sở hữu của module khác.
  - Mọi thao tác xuyên context phải đi qua Application Service / Use Case interface được định nghĩa rõ ràng.
  - Khóa ngoại (Foreign Key), nếu dùng, chỉ để bảo đảm tính toàn vẹn tham chiếu kỹ thuật, không trao quyền mutation trực tiếp.
- **Kỷ luật Phạm vi Giao dịch (Scoped Transactions):**
  - Giao dịch ACID được áp dụng trong phạm vi quy trình kỹ thuật cụ thể (ví dụ: cập nhật task, ghi bằng chứng, sinh outbox); tránh biến toàn bộ thao tác liên context thành một transaction khổng lồ.

### Đánh giá 3 phương án:
1. **Phương án A: Modular Monolith Backend Application + Relational Database Family [ĐỀ XUẤT - `ADR 0013`, Confidence: MEDIUM]:**
   - Xây dựng một ứng dụng backend duy nhất (`apps/api`) bằng Node.js / TypeScript trong monorepo.
   - Tổ chức nội bộ thành 5 module tương ứng 5 Bounded Contexts, cùng chia sẻ một cơ sở dữ liệu quan hệ.
   - Bảo đảm giao dịch ACID toàn vẹn trong workflow, tận dụng 100% types từ `@novyx/contracts`, triển khai và kiểm thử siêu tinh gọn.
2. **Phương án B: Serverless / Function-Oriented Backend (FaaS):** Bị bác bỏ do cold start làm chậm mobile và nguy cơ cạn kiệt connection pool.
3. **Phương án C: Distributed Microservices Architecture:** Bị bác bỏ do over-engineering nghiêm trọng, phá vỡ giao dịch và tạo ra gánh nặng vận hành khổng lồ.

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

Xác minh dứt khoát rằng toàn bộ 9 giả định kỹ thuật sai lầm trong đợt kiểm tra cuối cùng đã bị **BÁC BỎ HOÀN TOÀN**:

- **`N11-FINAL-01` (Gán nhầm `OP-01` thành `CheckInGps`):** $\to$ **BÁC BỎ (FAILED ASSUMPTION)**. `OP-01` là `ViewAssignedTask`. Kiểm tra GPS là `OP-06 VerifyGps` (`ADR 0010`).
- **`N11-FINAL-02` (Thay thế lệnh chuẩn tắc `SubmitEvidence` bằng token kỹ thuật `SubmitTaskEvidence`):** $\to$ **BÁC BỎ (FAILED ASSUMPTION)**. Lệnh nghiệp vụ bất biến là `OP-15 SubmitEvidence`; `SubmitTaskEvidence` nếu có chỉ là tên DTO hoặc HTTP route (`ADR 0010`).
- **`N11-FINAL-03` (Triển khai `GV-20 ManageDynamicFindingsTemplate` như một endpoint MVP):** $\to$ **BÁC BỎ (FAILED ASSUMPTION)**. `GV-20` được phân loại là `FUTURE_NOT_ACTIVE` (giai đoạn NEXT), không có endpoint trong MVP (`ADR 0010`).
- **`N11-FINAL-04` (Người dùng bị `SUSPENDED` vẫn gọi được `ViewAssignedTask` bằng token cũ chưa hết hạn):** $\to$ **BÁC BỎ (FAILED ASSUMPTION)**. Kiểm tra độ tươi `authVersion` trên server chặn đứng mọi protected read ngay lập tức (`ADR 0006`).
- **`N11-FINAL-05` (Admin bị `SUSPENDED` vẫn gọi được `ViewAuditLog` đến khi hết hạn token):** $\to$ **BÁC BỎ (FAILED ASSUMPTION)**. Toàn bộ protected authenticated endpoints đều từ chối tài khoản bị đình chỉ (`ADR 0006`).
- **`N11-FINAL-06` (Tuyên bố khóa ngoại Foreign Key là yêu cầu nghiệp vụ đã đóng băng):** $\to$ **BÁC BỎ (FAILED ASSUMPTION)**. Ràng buộc quan hệ là lựa chọn kiến trúc kỹ thuật đề xuất, không phải yêu cầu nghiệp vụ bắt buộc (`ADR 0013`).
- **`N11-FINAL-07` (CSDL dùng chung cho phép module A mutate trực tiếp dữ liệu thuộc sở hữu của module B):** $\to$ **BÁC BỎ (FAILED ASSUMPTION)**. Thiết lập nguyên tắc an toàn dữ liệu: cấm mutate trực tiếp CSDL xuyên module (`ADR 0013`).
- **`N11-FINAL-08` (Chỉ cần chọn SQLite là tự động coi như đã chứng minh không mất dữ liệu):** $\to$ **BÁC BỎ (FAILED ASSUMPTION)**. Khẳng định SQLite cung cấp nguyên thủy bền vững; việc nghiệm thu bắt buộc phải qua kiểm thử ngắt tiến trình thực nghiệm (`ADR 0008`).
- **`N11-FINAL-09` (Admin bị từ chối `ViewCareHistory` chỉ vì cấm Admin tác nghiệp hiện trường):** $\to$ **BÁC BỎ (FAILED ASSUMPTION)**. Phân định rõ Admin cấm mutation/review/assign task, nhưng bảo lưu quyền đọc `OP-22 ViewCareHistory` trong phạm vi governance (`ADR 0005`).

---

## 18. Sổ Đăng Ký Rủi Ro Kiến Trúc Kỹ Thuật (Architecture Risk Register)

| Mã rủi ro | Bằng chứng mã nguồn thực tế | Tác động kỹ thuật & nghiệp vụ | ADR giải quyết | Định hướng xử lý ở pha Triển khai (Post-ADR) |
| :---: | :--- | :--- | :---: | :--- |
| **AR-11-01** | `greenOpsService.ts:349` ép `admin` thành `Manager`. | Vi phạm ranh giới quyền lực; Admin kẹt vào luồng mobile. | `ADR 0005`, `ADR 0006` | Tạo Cổng Web Admin riêng; chặn tài khoản Admin trên mobile. |
| **AR-11-02** | Toàn bộ dữ liệu nằm trên biến RAM `let snapshot: AppData`. | Mất sạch bằng chứng và ảnh khi app bị tắt ngầm hoặc rớt mạng. | `ADR 0008` | Cài đặt `expo-sqlite` và hàng đợi Outbox bền vững. |
| **AR-11-03** | `ManagerReview.tsx:132-167` tự tạo `fallbackTask` để đổi status. | Rò rỉ logic trạng thái vào JSX; không unit test được. | `ADR 0007`, `ADR 0012` | Chuyển logic vào Domain Entity `TaskAggregate` và Use Case. |
| **AR-11-04** | `@novyx/contracts` thiếu 2 trạng thái, thiếu ProofProfile, thiếu DTO ngoại lệ/governance. | Hợp đồng kỹ thuật không tương thích với nghiệp vụ chuẩn tắc. | `ADR 0010` | Nâng cấp contracts bằng Zod schema, bảo tồn đúng định danh OP-01..22 và GV-01..22. |
| **AR-11-05** | `TaskDto` thiếu `version`; các mutation thiếu `Idempotency-Key`. | Nguy cơ ghi đè dữ liệu (Lost Updates) và duplicate requests. | `ADR 0009` | Bổ sung trường `version` (OCC) và header `Idempotency-Key`. |

---

## 19. Sổ Đăng Ký Ứng Viên Quyết Định Kiến Trúc (Candidate ADR Register)

| Mã ADR | Tiêu đề quyết định | Trạng thái | Câu hỏi quyết định cốt lõi | Khuyến nghị kỹ thuật | Độ tin cậy (Confidence) |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **[ADR 0005](file:///d:/ki7/EXE/tree/docs/adr/0005-admin-client-topology.md)** | Platform Administrator Client Delivery Topology | `PROPOSED` | Triển khai giao diện Admin qua kênh nào? | Tách thành Cổng Web Quản trị độc lập (`apps/admin-web`); bảo lưu quyền đọc `OP-22 ViewCareHistory`. | **MEDIUM** |
| **[ADR 0006](file:///d:/ki7/EXE/tree/docs/adr/0006-iam-session-lifecycle.md)** | IAM, Session Lifecycle & Role Administration | `PROPOSED` | Cơ chế xác thực, phiên và thu hồi tài khoản? | Signed Short-Lived Access Token + Refresh Token Rotation + Server Account Version Check (Bao phủ cả đọc và ghi). | **MEDIUM** |
| **[ADR 0007](file:///d:/ki7/EXE/tree/docs/adr/0007-authorization-enforcement-architecture.md)** | Multi-Tier Authorization Enforcement | `PROPOSED` | Thực thi Action Eligibility và SoD tác quyền lịch sử ở đâu? | Phòng thủ đa chiều: Client Advisory Helper + Server Boundary Middleware + Domain Aggregate Authoritative Gate. | **HIGH** |
| **[ADR 0008](file:///d:/ki7/EXE/tree/docs/adr/0008-offline-durable-storage-outbox.md)** | Offline Durable Storage & Outbox Synchronization | `PROPOSED` | Engine lưu trữ nào đảm bảo không mất dữ liệu ngoại tuyến? | SQLite (`expo-sqlite`) cho dữ liệu quan hệ/outbox + Sandbox Filesystem cho ảnh; nghiệm thu qua test thực nghiệm. | **HIGH** |
| **[ADR 0009](file:///d:/ki7/EXE/tree/docs/adr/0009-concurrency-idempotency-strategy.md)** | Optimistic Concurrency Control & Idempotency | `PROPOSED` | Ngăn chặn xung đột đồng thời và gửi trùng lệnh ra sao? | Command Payload OCC (`expectedVersion`) + Header `Idempotency-Key: <UUIDv4>`. | **HIGH** |
| **[ADR 0010](file:///d:/ki7/EXE/tree/docs/adr/0010-contracts-runtime-validation-governance-api.md)** | Contract Evolution & Runtime Validation | `PROPOSED` | Tái cấu trúc `@novyx/contracts` thế nào để kiểm thực runtime? | Zod Schema-First Contracts với tự động suy luận TypeScript types; bảo tồn OP-01..22 và GV-01..22; phân loại ranh giới Network API. | **HIGH** |
| **[ADR 0011](file:///d:/ki7/EXE/tree/docs/adr/0011-audit-trail-persistence-integrity.md)** | Audit Trail Persistence & Tamper-Evident Integrity | `PROPOSED` | Lưu trữ vết kiểm toán chống sửa đổi bằng cách nào? | Bảng SQL append-only có phân quyền CSDL (`REVOKE UPDATE/DELETE`) + Stream-Partitioned Hash-Chain. | **MEDIUM** |
| **[ADR 0012](file:///d:/ki7/EXE/tree/docs/adr/0012-clean-architecture-transitional-facade-decomposition.md)** | Clean Architecture & Facade Decomposition | `PROPOSED` | Phân tầng kiến trúc và bóc tách `greenOpsService` thế nào? | Pragmatic Clean Architecture (Ports & Adapters) trong monorepo; phân tách rõ thẩm quyền Server vs Mobile. | **HIGH** |
| **[ADR 0013](file:///d:/ki7/EXE/tree/docs/adr/0013-backend-runtime-persistence-topology.md)** | Backend Runtime & Relational Persistence Topology | `PROPOSED` | Topology máy chủ sản xuất và lưu trữ bền vững nào cung cấp ranh giới API có thẩm quyền? | Modular Monolith Backend Application (Node.js/TypeScript `apps/api`) + Relational Database Family; cấm mutate CSDL xuyên module. | **MEDIUM** |

---

## 20. Bảng Đệ Trình Quyết Định Cho Chủ Quản (Decisions Required From Owner)

| Mã ADR | Tiêu đề quyết định | Phương án đề xuất | Đánh đổi kỹ thuật cốt lõi | Hành động của Owner |
| :---: | :--- | :--- | :--- | :---: |
| **ADR 0005** | Admin Delivery Channel | Xây dựng Admin Web độc lập (`apps/admin-web`); bảo lưu `OP-22 ViewCareHistory`. *(Confidence: MEDIUM)* | Tăng 1 web app trong monorepo, đổi lại tính công thái học và tách biệt bề mặt phát hành. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0006** | IAM & Session Lifecycle | Signed Short-Lived Access Token + Refresh Token Rotation + Server Account Version Check. *(Confidence: MEDIUM)* | Kiểm tra version trên protected commands tại server, đổi lại thu hồi quyền tức thì cả đọc và ghi khi đình chỉ. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0007** | Authorization Enforcement | Phòng thủ đa tầng (UI Advisory + Route Middleware + Domain Gate). *(Confidence: HIGH)* | Viết kiểm tra quyền ở 2 lớp, đổi lại SoD chống tự duyệt bảo vệ trên tác quyền lịch sử. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0008** | Offline Durable Storage | SQLite (`expo-sqlite`) + Sandbox Filesystem. *(Confidence: HIGH)* | Cần quản lý SQL migrations, đổi lại tính toàn vẹn ACID chống mất dữ liệu khi tắt app/rớt mạng. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0009** | Concurrency & Idempotency | Command Payload OCC (`expectedVersion`) + Idempotency-Key UUID. *(Confidence: HIGH)* | Client phải xử lý mã lỗi 409, đổi lại khả năng retry mạng an toàn tuyệt đối với retention horizon chuẩn. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0010** | Contracts & Runtime Zod | Zod Schemas trong `@novyx/contracts`, bảo tồn OP-01..22 và GV-01..22, phân loại Network API. *(Confidence: HIGH)* | Thêm thư viện `zod` (~14kb), đổi lại kiểm soát runtime, triệt tiêu lỗi sập app do payload sai. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0011** | Audit Trail Persistence | DB Privilege Separation + Stream-Partitioned Hash-Chain. *(Confidence: MEDIUM)* | Thêm micro-giây tính hash, đổi lại loại bỏ nghẽn ghi đồng thời và ngăn chặn sửa đổi qua app. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0012** | Clean Architecture Layering| Ports & Adapters trong Monorepo; phân định thẩm quyền Server vs Mobile. *(Confidence: HIGH)* | Cần tái cấu trúc lại screens, đổi lại khả năng unit test và cô lập máy trạng thái. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0013** | Backend Runtime & Topology | Modular Monolith Backend (`apps/api`) + Relational Database Family; cấm mutate CSDL xuyên module. *(Confidence: MEDIUM)* | Triển khai nguyên khối có cấu trúc, đổi lại giao dịch ACID toàn vẹn trong workflow. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |

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

Toàn bộ 5 vấn đề kỹ thuật còn tồn tại (`R11-01` đến `R11-05`) đã được giải quyết triệt để và đồng bộ:
- Đã khôi phục và bảo tồn 100% định danh lệnh chuẩn tắc (`OP-01..22`, `GV-01..22`, và 4 RTM supplementary commands); xây dựng bảng phân loại ranh giới Network API rõ ràng; khẳng định ranh giới $\text{Command} \neq \text{Route} \neq \text{DTO}$.
- Đã mở rộng cơ chế kiểm soát độ tươi ủy quyền (Authorization Freshness) bao phủ toàn bộ các hành động được bảo vệ (cả đọc và ghi), thực thi triệt để quy tắc đình chỉ `WF-12`.
- Đã tách bạch rạch ròi giữa yêu cầu nghiệp vụ chuẩn tắc và các giải pháp kỹ thuật đề xuất trong `ADR 0013`, thiết lập nguyên tắc an toàn dữ liệu cấm mutate CSDL xuyên context.
- Đã định giới hạn thực nghiệm cho các tuyên bố về độ bền vững ngoại tuyến của `ADR 0008`.
- Đã hiệu chỉnh chính xác ranh giới thẩm quyền của Admin trong `ADR 0005`, khẳng định quyền đọc `OP-22 ViewCareHistory`.
- Bác bỏ dứt khoát 9 giả định sai lầm qua bảng kiểm tra phủ định mục tiêu `N11-FINAL-01..09`.

Hệ thống đã đạt trạng thái **HOÀN TOÀN SẴN SÀNG CHO CHỦ QUẢN (OWNER) THẨM TRA VÀ PHÊ DUYỆT ADR**.
