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
   - Mọi ADR mới khởi tạo (`ADR 0005` đến `ADR 0012`) đều mang trạng thái `Status: PROPOSED`.
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

Khảo sát trực tiếp mã nguồn thực tế tại commit `2f9a26b` và cấu trúc repo hiện hành mang lại các phát hiện cụ thể:

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
- Chưa có bảo vệ phân quyền, chưa có endpoint quản trị governance, chưa có lưu vết kiểm toán.

---

## 4. Sổ Đăng Ký Động Lực Kiến Trúc Kỹ Thuật (Architecture Drivers Register)

| Mã Động Lực | Nhóm phân loại | Nguồn gốc nghiệp vụ / NFR | Hệ quả kiến trúc kỹ thuật (Technical Consequence) | Mức ưu tiên | Cần quyết định kiến trúc? | Ứng viên ADR liên quan |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: |
| **DRV-01** | `CLIENT` | `BR-ACT-01`, `CAP-ADM-01..09` (Admin là vai trò độc lập, không thao tác hiện trường) | Phải xác lập hình thái triển khai của giao diện Quản trị viên (tách web độc lập hay nhúng mobile). | **P0** | **CÓ** | `ADR 0005` |
| **DRV-02** | `IAM` | `DR-HARD-05`, `CAP-ADM-03..04` (3 vai trò, 4 trạng thái tài khoản, credential lock) | Thiết lập ranh giới xác thực, chuẩn token JWT bất đối xứng, cơ chế thu hồi phiên và lưu trữ an toàn. | **P0** | **CÓ** | `ADR 0006` |
| **DRV-03** | `AUTHZ` | `Report 07`, `Report 12 §4` (Action Eligibility, SoD-01..07) | Xây dựng phòng thủ đa tầng: Client trợ giúp, API Gateway chặn quyền, Domain Aggregate khóa điều kiện. | **P0** | **CÓ** | `ADR 0007` |
| **DRV-04** | `OFFLINE` | `DR-HARD-04`, `QAS-OFFLINE-01`, `QAS-OFFLINE-02` (Zero data loss, khôi phục sau OS kill) | Thay thế biến RAM bằng engine CSDL bền vững (`expo-sqlite`) có tính toàn vẹn giao dịch ACID và Outbox. | **P0** | **CÓ** | `ADR 0008` |
| **DRV-05** | `SYNC` | `DOMAIN.md §3`, `QAS-OFFLINE-01` (Tách TaskStatus server và PENDING_SYNC client) | Xây dựng hàng đợi Outbox tuần tự với cơ chế exponential backoff và idempotency key chống gửi trùng. | **P0** | **CÓ** | `ADR 0008`, `ADR 0009` |
| **DRV-06** | `CONCURRENCY` | `DOMAIN.md §3` (Phòng ngừa xung đột khi Quản lý đổi người/hủy việc lúc Nhân viên mất mạng) | Bổ sung Optimistic Concurrency Control (`version` token) và xử lý lỗi xung đột `409 CONFLICT`. | **P0** | **CÓ** | `ADR 0009` |
| **DRV-07** | `CONTRACT` | `DOMAIN.md §3..5`, `ADR 0003` (Đầy đủ 7 states, 3 profiles, 4 review outcomes, Zod validation) | Nâng cấp `@novyx/contracts` bằng Zod Schemas để có runtime validation và tự suy luận kiểu dữ liệu. | **P0** | **CÓ** | `ADR 0010` |
| **DRV-08** | `AUDIT` | `CAP-ADM-05`, `DR-POL-04` (Lưu vết kiểm toán append-only, chống giả mạo, tra cứu nhanh) | Thiết kế bảng `audit_events` với phân quyền CSDL cấm UPDATE/DELETE kết hợp chuỗi băm hàng (Row Hash-Chain). | **P1** | **CÓ** | `ADR 0011` |
| **DRV-09** | `MODULE` | `ARCHITECTURE.md §2`, `POST-SYNC Gap 13` (Phân rã monolith 2.900 dòng) | Phân tầng Clean Architecture (Ports & Adapters) trong monorepo; không chia nhỏ thành microservice. | **P1** | **CÓ** | `ADR 0012` |
| **DRV-10** | `PERF` | `QAS-PERF-01` (Cuộn danh sách 200–1.000 cây mượt mà trên Android 3GB RAM) | Bắt buộc ảo hóa danh sách bằng `FlatList` với `windowSize` tối ưu và `keyExtractor` ổn định. | **P1** | KHÔNG (Tuân thủ guideline) | `NFR.md` |
| **DRV-11** | `SECURITY` | `QAS-SEC-01` (Làm mới token ngầm $\le 1$s; bảo toàn form khi hết hạn) | Cài đặt interceptor xử lý 401, tự động gọi refresh token và retry request mà không làm gián đoạn người dùng. | **P1** | **CÓ** | `ADR 0006` |
| **DRV-12** | `A11Y` | `QAS-A11Y-01` (Tương tác ngoài trời nắng chói, tiếng Việt có dấu, touch target $\ge 48\text{px}$) | Tuân thủ tokens `@novyx/ui`, độ tương phản WCAG AA $\ge 4.5:1$, không cắt cụt chữ tiếng Việt. | **P1** | KHÔNG (Tuân thủ UI tokens) | `ADR 0004` |

---

## 5. Phân Tích Các Yêu Cầu Phi Chức Năng (NFR / Quality Attributes Traceability)

Mỗi kịch bản thuộc tính chất lượng (QAS) trong `NFR.md` được kết nối trực tiếp với giải pháp kiến trúc:

- **`QAS-OFFLINE-01` (Zero data loss khi mất mạng giữa chừng):**
  - *Giải pháp kiến trúc:* `ADR 0008` thiết lập bảng CSDL cục bộ `tasks`, `task_evidence`, `checklist_items` trên nền `expo-sqlite`. Khi mất mạng, mọi thao tác ghi nhận bằng chứng đều được commit vào SQLite trong $< 50\text{ms}$. Thao tác "Gửi duyệt" tạo bản ghi `outbox_queue` với `LocalSubmissionStatus = PENDING_SYNC`.
  - *Chỉ tiêu:* Đạt $0\%$ mất dữ liệu.
- **`QAS-OFFLINE-02` (Khôi phục trạng thái sau khi hệ điều hành tắt ngầm Camera):**
  - *Giải pháp kiến trúc:* `ADR 0008` sao chép ảnh chụp từ cache tạm vào thư mục bền vững của app (`documentDirectory`) ngay khi chụp xong và ghi URI vào SQLite. Khi mở lại app, Use Case khôi phục phiên và bản nháp từ SQLite trong $< 2\text{s}$.
  - *Chỉ tiêu:* Thời gian phục hồi $\le 2\text{s}$, không phải thực hiện lại các bước trước.
- **`QAS-PERF-01` (Hiệu năng cuộn danh sách lớn ngoài trời):**
  - *Giải pháp kiến trúc:* Áp dụng `FlatList` với cơ chế ảo hóa dòng (windowing), cấu hình `maxToRenderPerBatch = 10`, `windowSize = 5`, sử dụng `keyExtractor` ổn định (`tree.id` / `task.id`).
  - *Chỉ tiêu:* Tỷ lệ khung hình rơi $< 5\%$, hướng tới 60 FPS trên thiết bị Android RAM 3GB.
- **`QAS-SEC-01` (Làm mới token ngầm không làm mất dữ liệu form):**
  - *Giải pháp kiến trúc:* `ADR 0006` thiết kế chu trình Refresh Token Rotation (RTR). Interceptor phía client bắt mã lỗi 401, tạm hoãn các request đang chờ, gửi lệnh `/v1/auth/refresh` lấy access token mới trong $< 1\text{s}$, và tự động gửi lại request ban đầu.
- **`QAS-FAULT-01` (Xử lý lỗi hệ thống 503 / Timeout):**
  - *Giải pháp kiến trúc:* `ADR 0009` và `ADR 0010` quy định Outbox Worker chỉ tự động thử lại khi gặp lỗi mạng hoặc lỗi server 5xx (kèm exponential backoff). Gặp lỗi 4xx (vi phạm nghiệp vụ / SoD), worker dừng thử lại và đánh dấu `SYNC_FAILED` kèm lý do rõ ràng.

---

## 6. Đánh Giá Tính Tương Thích Của Các Quyết Định Kiến Trúc Hiện Hữu (ADR 0001..0004)

- **`ADR 0001` (Monorepo Foundation):** `ACCEPTED` $\to$ **GIỮ NGUYÊN (`KEEP`)**. Cấu trúc monorepo là nền tảng hoàn hảo để chứa `apps/mobile`, `apps/admin-web` tương lai, và các gói `packages/*`.
- **`ADR 0002` (Hermes Agent Submodule):** `ACCEPTED` $\to$ **GIỮ NGUYÊN (`KEEP`)**. Pinned commit ở `external/hermes-agent` tiếp tục được bảo toàn, không bị sửa đổi.
- **`ADR 0003` (Contract-first REST API):** `ACCEPTED` $\to$ **CẦN ADR TIẾP NỐI (`NEEDS_FOLLOWUP_ADR`)**. Định hướng REST và shared contracts được giữ vững, nhưng cần `ADR 0010` để bổ sung runtime schema validation (Zod) và mở rộng DTO theo cam kết còn nợ trong mục Tradeoffs của ADR 0003.
- **`ADR 0004` (Shared UI Tokens):** `ACCEPTED` $\to$ **GIỮ NGUYÊN (`KEEP`)**. Token trong `packages/ui` đóng vai trò nguồn chân lý thiết kế cho toàn bộ các màn hình hiện trường và giao diện quản trị sau này.

---

## 7. Phân Tích Chuyên Sâu: Hình Thái Triển Khai Giao Diện Quản Trị Viên (Admin Client Topology)

### Bối cảnh & Xung đột hiện tại:
Văn bản nghiệp vụ chuẩn tắc xác lập vai trò **Platform Administrator (`admin`)** là vai trò quản trị MVP độc lập với 9 nhóm năng lực (`CAP-ADM-01..09`). Tuy nhiên, mã nguồn di động hiện tại (`apps/mobile`) chỉ thiết kế giao diện cho Staff và Manager; khi Admin đăng nhập thì bị ép quyền thành Manager.

### Đánh giá 3 phương án:
1. **Phương án A (Nhúng vào Mobile App hiện tại):**
   - Bị bác bỏ vì gây suy giảm công thái học nghiêm trọng: Các tác vụ quản trị như rà soát hàng nghìn dòng audit log, đối soát danh mục lâm sinh, cập nhật bản đồ tọa độ trắc địa không thể thao tác hiệu quả trên màn hình điện thoại 5 inch.
   - Làm tăng kích thước file APK di động và làm lộ các route API quản trị nhạy cảm vào thiết bị hiện trường của công nhân.
2. **Phương án B (Xây dựng Cổng Quản trị Web độc lập `apps/admin-web`) [ĐỀ XUẤT - `ADR 0005`]:**
   - Tối ưu hóa tuyệt đối: Trải nghiệm desktop với bảng dữ liệu lớn, bộ lọc đa tiêu chí, biểu đồ quản trị và thao tác bàn phím/chuột.
   - Cô lập an ninh: Ứng dụng web quản trị có thể đặt sau mạng nội bộ công ty (VPC), yêu cầu VPN, hoặc bảo vệ bằng WAF riêng biệt.
   - Không gây phình to mã nguồn mobile; tuân thủ đúng nguyên lý monorepo (`ADR 0001`).
3. **Phương án C (Universal React Native Web):**
   - Bị bác bỏ vì độ phức tạp phát triển cao, layout responsive giữa mobile và desktop web dễ phát sinh lỗi hiển thị, và phụ thuộc vào tính tương thích của React Native for Web.

---

## 8. Phân Tích Chuyên Sâu: IAM, Phiên Làm Việc & Ranh Giới Định Danh

- **Cơ chế xác thực:** Áp dụng mô hình **Asymmetric JWT (RS256) + Refresh Token Rotation (`ADR 0006`)**.
  - Access Token có thời hạn ngắn (15 phút), chứa thông tin: `userId`, `role` (`staff` | `manager` | `admin`), `accountStatus` (`ACTIVE`), `tokenVersion`.
  - Refresh Token có thời hạn dài (30 ngày), dùng 1 lần duy nhất (xoay vòng token khi cấp access token mới).
- **Lưu trữ an toàn trên thiết bị:**
  - Mobile: Lưu trong `expo-secure-store` (được bảo vệ bởi phần cứng Keychain trên iOS và Keystore trên Android).
  - Admin Web: Lưu trong cookie an toàn `HttpOnly; Secure; SameSite=Strict`.
- **Thu hồi phiên làm việc tức thì (Revocation):**
  - Khi Admin thực hiện lệnh `SuspendAccount` hoặc `DisableAccount`, hệ thống cập nhật `tokenVersion = tokenVersion + 1` trên bản ghi người dùng và vô hiệu hóa toàn bộ refresh token liên quan.
  - Khi access token hiện tại hết hạn (tối đa trong 15 phút), lệnh làm mới token tiếp theo sẽ bị từ chối ngay lập tức với mã lỗi `403 FORBIDDEN: ACCOUNT_SUSPENDED`.
- **Xử lý khóa xác thực tạm thời (`CAP-ADM-04`):**
  - Người dùng nhập sai mật khẩu quá số lần quy định bị khóa xác thực tạm thời (Credential Lock Condition), nhưng trường `accountStatus` trong CSDL vẫn giữ nguyên là `ACTIVE`. Lệnh `UnlockAccount` xóa cờ khóa này mà không làm biến dạng vòng đời tài khoản.

---

## 9. Phân Tích Chuyên Sâu: Kiến Trúc Thực Thi Phân Quyền (Authorization Enforcement)

Nguyên tắc **Action Eligibility** được thực thi qua mô hình **Phòng thủ Đa chiều (Multi-Tier Defense-in-Depth - `ADR 0007`)**:

1. **Tầng 1 — Trợ giúp Công thái học phía Client (Presentation Guard):**
   - Các hàm thuần túy (Pure Functions) trong `@novyx/domain` đánh giá nhanh tính đủ điều kiện để ẩn/hiện nút bấm, vô hiệu hóa form và hiển thị tooltip hướng dẫn (ví dụ: nút "Nghiệm thu" bị mờ kèm dòng chữ: *"Chỉ Quản lý được ủy quyền mới có quyền thẩm định nhiệm vụ"*).
   - Tuyệt đối không coi tầng này là ranh giới bảo mật!
2. **Tầng 2 — Rào chắn Tuyến API (API Gateway / Route Guard):**
   - Middleware kiểm tra tính hợp lệ của chữ ký JWT, kiểm tra tài khoản có đang ở trạng thái `ACTIVE` hay không.
   - Chặn đứng mọi request của Admin vào các route tác nghiệp `/v1/tasks/*` (`403 FORBIDDEN: ADMIN_TASK_MUTATION_DENIED`).
   - Chặn đứng mọi request của Staff/Manager vào các route quản trị `/v1/governance/*`.
3. **Tầng 3 — Rào chắn Cốt lõi Miền Nghiệp vụ (Application & Domain Core Guard - Authoritative):**
   - Thực thể `Task` (Aggregate Root) và Use Case kiểm tra toàn diện:
     - Đúng tác nhân được phân công (`task.assignedStaffId == actor.userId`).
     - Đúng trạng thái nhiệm vụ tiên quyết (ví dụ: `StartTask` bắt buộc `status == PENDING`).
     - Đạt nguyên tắc Phân tách Trách nhiệm (SoD-02: `reviewerId != assignedStaffId`).
   - Vi phạm sẽ ném ra Domain Exception, API trả về `403 FORBIDDEN` hoặc `409 CONFLICT` và ghi nhật ký cảnh báo an ninh vào `AuditEvent`.

---

## 10. Phân Tích Chuyên Sâu: Kiến Trúc Vết Kiểm Toán & Tính Toàn Vẹn Bất Biến

- **Yêu cầu bất biến:** Không một tác nhân sản phẩm nào (kể cả Platform Admin) có quyền xóa, sửa, hoặc cắt ngắn lịch sử kiểm toán (`DR-POL-04`).
- **Giải pháp kỹ thuật (`ADR 0011`):**
  1. **Ràng buộc cấp động cơ CSDL:** Sử dụng tài khoản kết nối CSDL riêng biệt cho ứng dụng (`novyx_app_user`), thực thi lệnh SQL:
     ```sql
     REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM novyx_app_user;
     GRANT SELECT, INSERT ON audit_events TO novyx_app_user;
     ```
     Ngay cả khi ứng dụng bị chiếm quyền điều khiển hoặc lỗi logic, CSDL cũng từ chối tuyệt đối mọi lệnh sửa/xóa bảng audit.
  2. **Chuỗi băm hàng mật mã học (Row Hash-Chain):**
     Mỗi bản ghi audit chứa trường `prev_hash` và `current_hash = SHA256(prev_hash + data)`. Bất kỳ can thiệp trực tiếp nào vào CSDL từ bên ngoài đều làm gãy chuỗi băm và bị phát hiện ngay lập tức trong báo cáo kiểm toán.
  3. **Truy vấn hiệu năng cao:** Bảng `audit_events` được đánh chỉ mục tổ hợp `(actor_id, timestamp)`, `(resource_type, resource_id)` phục vụ API lọc của Cổng Admin Web (`CAP-ADM-05`).

---

## 11. Phân Tích Chuyên Sâu: Engine Lưu Trữ Bền Vững Ngoại Tuyến & Hàng Đợi Outbox

### Khắc phục triệt để rủi ro mất dữ liệu trên RAM (`AR-11-02`):
- **Engine lưu trữ (`ADR 0008`):** Tích hợp `expo-sqlite` (thư viện chuẩn gốc của Expo SDK 57) để quản lý CSDL quan hệ cục bộ:
  - Bảng `tasks`, `task_evidence`, `checklist_items`, `outbox_queue`.
  - Hỗ trợ giao dịch toàn vẹn ACID (`db.withTransactionSync`). Khi chụp ảnh hoặc tích checklist, dữ liệu được ghi tức thì vào CSDL cục bộ trong $< 50\text{ms}$.
- **Quản lý file ảnh nhị phân:** Ảnh chụp được lưu vào thư mục bền vững của ứng dụng (`FileSystem.documentDirectory`), chỉ lưu đường dẫn file (`file://...`) vào SQLite. Tuyệt đối không lưu chuỗi Base64 trong database.
- **Hàng đợi Outbox tuần tự (FIFO Outbox Worker):**
  - Khi nhân viên bấm "Gửi duyệt" trong trạng thái mất mạng, toàn bộ dữ liệu báo cáo được đóng gói thành một bản ghi trong `outbox_queue` với `LocalSubmissionStatus = PENDING_SYNC`.
  - Trên giao diện hiển thị huy hiệu màu hổ phách: `Chờ đồng bộ`.
  - Khi có mạng trở lại, Outbox Worker tự động đọc hàng đợi, gửi request multipart lên server kèm `Idempotency-Key` header.
  - Sau khi server phản hồi thành công (HTTP 200/201), Worker cập nhật `LocalSubmissionStatus = SYNCED` và xóa bản ghi outbox.

---

## 12. Phân Tích Chuyên Sâu: Kiểm Soát Tranh Chấp (Concurrency) & Lũy Lượng (Idempotency)

- **Kiểm soát tranh chấp lạc quan (Optimistic Concurrency Control - `ADR 0009`):**
  - Bổ sung trường `version: number` vào `TaskDto`, `TreeDto`.
  - Mọi lệnh thay đổi trạng thái đều gửi kèm `expectedVersion: number`.
  - Câu lệnh cập nhật trên server: `UPDATE tasks SET ..., version = version + 1 WHERE id = :id AND version = :expectedVersion`.
  - Nếu số dòng bị ảnh hưởng bằng 0, server trả về `409 CONFLICT` (`STALE_VERSION`), thông báo cho client rằng nhiệm vụ đã bị sửa đổi trên máy chủ (ví dụ: Quản lý đã phân công lại hoặc đã hủy). Bản nháp bằng chứng của nhân viên trên máy vẫn được bảo toàn nguyên vẹn.
- **Tính lũy lượng của lệnh (Command Idempotency):**
  - Mọi lệnh tạo mới hoặc chuyển trạng thái đều yêu cầu header `Idempotency-Key: <UUIDv4>`.
  - Outbox Worker sinh UUID này ngay khi đóng gói bản nháp và giữ nguyên qua mọi lần thử lại mạng.
  - Server lưu kết quả của `Idempotency-Key` trong 24 giờ; nếu nhận lại cùng một key với cùng payload, server trả về kết quả đã lưu trước đó mà không thực thi lại logic nghiệp vụ, loại trừ hoàn toàn nguy cơ sinh task hoặc duyệt trùng lặp.

---

## 13. Phân Tích Chuyên Sâu: Tiến Hóa Hợp Đồng Dữ Liệu & Kiểm Thực Runtime

- **Nâng cấp gói `@novyx/contracts` (`ADR 0010`):**
  - Tích hợp thư viện `zod` để định nghĩa schema kiểm thực runtime.
  - Tự động suy luận kiểu dữ liệu TypeScript bằng `z.infer`, đảm bảo $100\%$ đồng bộ giữa runtime và compile-time types.
  - Mở rộng đầy đủ 7 trạng thái vòng đời (`TaskStatus` viết hoa: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`).
  - Định nghĩa 3 hồ sơ bằng chứng (`ProofProfile`: `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`).
  - Định nghĩa 4 kết luận duyệt (`ReviewDecision`: `APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL`).
  - Bổ sung DTO cho các báo cáo ngoại lệ thực địa và 9 năng lực Governance.

---

## 14. Phân Tích Chuyên Sâu: Ranh Giới Module & Phân Tầng Clean Architecture

- **Quy tắc phân ranh giới:** Ngữ cảnh giới hạn nghiệp vụ (Bounded Context) không đồng nghĩa với việc phải chia thành microservice hay npm package riêng lẻ.
- **Mô hình kiến trúc đề xuất (`ADR 0012`):**
  Áp dụng Clean Architecture (Ports & Adapters) bên trong monorepo hiện có:
  1. **Tầng Presentation (`src/presentation/`):** Các màn hình React Native, ViewModels, Hooks, AppPrimitives. Không chứa logic nghiệp vụ và không gọi trực tiếp CSDL/HTTP.
  2. **Tầng Application (`src/application/`):** Các ca sử dụng điều phối nghiệp vụ (`StartTaskUseCase`, `SubmitEvidenceUseCase`, `ReviewTaskUseCase`...).
  3. **Tầng Domain Core (`src/domain/`):** Thực thể `Task` (quản lý máy trạng thái 7 bước), `Tree`, các Value Objects, và các hàm kiểm tra bất biến nghiệp vụ. Hoàn toàn độc lập với React, Expo hay mạng.
  4. **Tầng Infrastructure (`src/infrastructure/`):** Triển khai các cổng giao tiếp: `SqliteTaskRepository`, `RestApiAdapter`, `ExpoHardwareAdapter`, `SecureStoreAuthRepository`.
- **Phân rã facade `greenOpsService` (856 dòng) và `MobileApp.tsx` (2.054 dòng):**
  - Bóc tách màn hình Login ra file riêng `LoginScreen.tsx`.
  - Thay thế việc khoan 30 props bằng các React Context gọn nhẹ (`AuthProvider`, `TaskProvider`, `NetworkProvider`).
  - Thu gọn `MobileApp.tsx` thành một root navigator ngắn gọn ($\le 150$ dòng).

---

## 15. Sổ Đăng Ký Rủi Ro Kiến Trúc Kỹ Thuật (Architecture Risk Register)

| Mã rủi ro | Bằng chứng mã nguồn thực tế | Tác động kỹ thuật & nghiệp vụ | ADR giải quyết | Định hướng xử lý ở pha Triển khai (Post-ADR) |
| :---: | :--- | :--- | :---: | :--- |
| **AR-11-01** | `greenOpsService.ts:349` ép `admin` thành `Manager`. | Vi phạm ranh giới quyền lực; Admin kẹt vào luồng mobile. | `ADR 0005`, `ADR 0006` | Tạo Cổng Web Admin riêng; chặn tài khoản Admin trên mobile. |
| **AR-11-02** | Toàn bộ dữ liệu nằm trên biến RAM `let snapshot: AppData`. | Mất sạch bằng chứng và ảnh khi app bị tắt ngầm hoặc rớt mạng. | `ADR 0008` | Cài đặt `expo-sqlite` và hàng đợi Outbox bền vững. |
| **AR-11-03** | `ManagerReview.tsx:132-167` tự tạo `fallbackTask` để đổi status. | Rò rỉ logic trạng thái vào JSX; không unit test được. | `ADR 0007`, `ADR 0012` | Chuyển logic vào Domain Entity `TaskAggregate` và Use Case. |
| **AR-11-04** | `@novyx/contracts` thiếu 2 trạng thái, thiếu ProofProfile, thiếu DTO ngoại lệ/governance. | Hợp đồng kỹ thuật không tương thích với nghiệp vụ chuẩn tắc. | `ADR 0010` | Nâng cấp contracts bằng Zod schema, phủ đủ 48 lệnh chuẩn tắc. |
| **AR-11-05** | `TaskDto` thiếu `version`; các mutation thiếu `Idempotency-Key`. | Nguy cơ ghi đè dữ liệu (Lost Updates) và duplicate requests. | `ADR 0009` | Bổ sung trường `version` (OCC) và header `Idempotency-Key`. |

---

## 16. Sổ Đăng Ký Ứng Viên Quyết Định Kiến Trúc (Candidate ADR Register)

| Mã ADR | Tiêu đề quyết định | Trạng thái | Câu hỏi quyết định cốt lõi | Khuyến nghị kỹ thuật |
| :---: | :--- | :---: | :--- | :--- |
| **ADR 0005** | Platform Administrator Client Delivery Topology | `PROPOSED` | Triển khai giao diện Admin qua kênh nào? | Tách thành Cổng Web Quản trị độc lập (`apps/admin-web`). |
| **ADR 0006** | IAM, Session Lifecycle & Role Administration | `PROPOSED` | Cơ chế xác thực, phiên và thu hồi tài khoản? | Asymmetric JWT + Refresh Token Rotation + Session Versioning. |
| **ADR 0007** | Multi-Tier Authorization Enforcement | `PROPOSED` | Thực thi Action Eligibility ($Role \land Scope \land State$) ở đâu? | Phòng thủ đa chiều: Client Helper + API Route Guard + Domain Aggregate. |
| **ADR 0008** | Offline Durable Storage & Outbox Synchronization | `PROPOSED` | Engine lưu trữ nào đảm bảo không mất dữ liệu ngoại tuyến? | SQLite (`expo-sqlite`) cho dữ liệu quan hệ/outbox + Sandbox Filesystem cho ảnh. |
| **ADR 0009** | Optimistic Concurrency Control & Idempotency | `PROPOSED` | Ngăn chặn xung đột đồng thời và gửi trùng lệnh ra sao? | OCC qua trường `version: number` + Header `Idempotency-Key: <UUIDv4>`. |
| **ADR 0010** | Contract Evolution & Runtime Validation | `PROPOSED` | Tái cấu trúc `@novyx/contracts` thế nào để kiểm thực runtime? | Zod Schema-First Contracts với tự động suy luận TypeScript types. |
| **ADR 0011** | Audit Trail Persistence & Tamper-Evident Integrity | `PROPOSED` | Lưu trữ vết kiểm toán chống sửa đổi bằng cách nào? | Bảng SQL append-only có phân quyền CSDL (`REVOKE UPDATE/DELETE`) + Row Hash-Chain. |
| **ADR 0012** | Clean Architecture & Facade Decomposition | `PROPOSED` | Phân tầng kiến trúc và bóc tách `greenOpsService` thế nào? | Pragmatic Clean Architecture (Ports & Adapters) trong monorepo. |

---

## 17. Bảng Đệ Trình Quyết Định Cho Chủ Quản (Decisions Required From Owner)

| Mã ADR | Tiêu đề quyết định | Phương án đề xuất | Đánh đổi kỹ thuật cốt lõi | Hành động của Owner |
| :---: | :--- | :--- | :--- | :---: |
| **ADR 0005** | Admin Delivery Channel | Xây dựng Admin Web độc lập (`apps/admin-web`). | Tăng 1 web app trong monorepo, đổi lại tính công thái học và an toàn tuyệt đối. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0006** | IAM & Session Lifecycle | Asymmetric JWT + Refresh Token Rotation. | Cài đặt interceptor phía client, đổi lại tính độc lập ngoại tuyến ngoài thực địa. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0007** | Authorization Enforcement | Phòng thủ đa tầng (UI + Route + Domain). | Viết kiểm tra quyền ở 2 lớp, đổi lại tính bảo mật tuyệt đối không thể bypass. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0008** | Offline Durable Storage | SQLite (`expo-sqlite`) + Sandbox Filesystem. | Cần quản lý SQL migrations, đổi lại tính toàn vẹn giao dịch ACID chống mất dữ liệu. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0009** | Concurrency & Idempotency | OCC qua `version` + Idempotency-Key UUID. | Client phải xử lý mã lỗi 409, đổi lại khả năng retry mạng an toàn tuyệt đối. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0010** | Contracts & Runtime Zod | Zod Schemas trong `@novyx/contracts`. | Thêm thư viện `zod` (~14kb), đổi lại kiểm soát runtime 100%, chống crash app. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0011** | Audit Trail Persistence | DB Role Separation + Row Hash-Chain. | Thêm vài micro-giây tính hash, đổi lại tính chống chối bỏ không cần blockchain. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |
| **ADR 0012** | Clean Architecture Layering| Ports & Adapters trong Monorepo. | Cần tái cấu trúc lại screens, đổi lại khả năng unit test 100% logic nghiệp vụ. | `[ ] APPROVE`<br>`[ ] REJECT`<br>`[ ] REQUEST_REVISION` |

---

## 18. Các Quyết Định Tạm Thời Chưa Đưa Ra (Explicit Non-Decisions)

Để duy trì tính tinh gọn và tránh over-engineering, các hạng mục kỹ thuật sau đây **CỐ Ý CHƯA QUYẾT ĐỊNH (EXPLICITLY DEFERRED)** trong Phase 11A:
1. **Lựa chọn Framework cụ thể cho Admin Web:** Tạm thời xác định hình thái là Web Application (`apps/admin-web`); việc chọn giữa Vite React SPA hay Next.js sẽ được chốt sau khi Owner phê duyệt `ADR 0005`.
2. **Hạ tầng Dịch vụ Lưu trữ File (Cloud Object Storage Provider):** Tạm thời chuẩn hóa cơ chế nộp file là Multipart HTTP upload; việc chọn giữa AWS S3, Cloudflare R2, hay MinIO cục bộ sẽ được quyết định ở pha thiết kế hạ tầng backend.
3. **Mô hình Phân vùng Địa lý Chi tiết cho Quản lý:** Khái niệm `AUTHORIZED_OPERATIONAL_SCOPE` tiếp tục được giữ ở mức trừu tượng miền, chưa gán cứng vào bảng `regions` hay `teams` nào trong CSDL.
4. **Cơ chế Triển khai Hạ tầng Máy chủ (Deployment Topology):** Chưa quyết định giữa Docker Compose, Kubernetes, hay Serverless Container, vì hệ thống hiện đang tập trung vào tầng hợp đồng và kiến trúc client/server logic.

---

## 19. Xác Minh Ranh Giới Mã Nguồn Tuyệt Đối (Source Boundary Verification)

Kiểm tra nghiêm ngặt tính bất biến của hệ thống trước khi nộp báo cáo:
- `git diff --name-only c235ebbf41dfd1390c759e719da7614b9544d031 HEAD -- apps packages` $\to$ **0 diff** (Mã nguồn ứng dụng và gói contracts giữ nguyên 100%).
- `git diff --name-only c235ebbf41dfd1390c759e719da7614b9544d031 HEAD -- docs/PRODUCT.md docs/DOMAIN.md docs/ACCESS-CONTROL.md docs/WORKFLOWS.md docs/REQUIREMENTS-TRACEABILITY.md docs/business-reconciliation` $\to$ **0 diff** (Tài liệu nghiệp vụ chuẩn tắc và bằng chứng đóng băng giữ nguyên 100%).
- `git diff --name-only c235ebbf41dfd1390c759e719da7614b9544d031 HEAD -- docs/diagrams` $\to$ **0 diff** (Bộ biểu đồ giữ nguyên 100%).
- `git diff --name-only c235ebbf41dfd1390c759e719da7614b9544d031 HEAD -- docs/ARCHITECTURE.md` $\to$ **0 diff** (Tài liệu kiến trúc chuẩn tắc giữ nguyên, chỉ cập nhật sau khi Owner duyệt ADR).
- `git diff --check` $\to$ **0 lỗi định dạng khoảng trắng**.
- `npm run typecheck --workspace @novyx/mobile` $\to$ **PASS (0 lỗi biên dịch)**.

---

## KẾT LUẬN GIAI ĐOẠN PHASE 11A (FINAL CONCLUSION)

Toàn bộ công tác khám phá kiến trúc kỹ thuật của Phase 11A đã hoàn tất xuất sắc với tính kỷ luật tuyệt đối:
- Đã khảo sát và lập bản đồ hiện trạng mã nguồn thực tế, nhận diện chính xác 5 rủi ro kỹ thuật cốt tử (`AR-11-01..05`).
- Đã trích xuất và truy vết $100\%$ động lực kiến trúc từ các tài liệu nghiệp vụ đã đóng băng và 5 kịch bản chất lượng NFR.
- Đã khởi tạo đầy đủ 8 ứng viên quyết định kiến trúc (`ADR 0005` đến `ADR 0012`) kèm ma trận đánh giá phương án chi tiết, bảng đăng ký quyết định và bảng đệ trình cho Owner.
- Tuyệt đối không tự ý phê duyệt ADR, không sửa mã nguồn, không làm biến dạng nghiệp vụ.

Hệ thống đã sẵn sàng 100% để **Chủ quản (Owner) tiến hành thẩm tra và đưa ra quyết định phê duyệt chính thức**.
