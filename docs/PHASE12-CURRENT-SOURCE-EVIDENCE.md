# Báo Cáo Chứng Cứ Hiện Trạng Mã Nguồn Thực Tế (Phase 12A)

**Dự án:** NOVYX GreenOps
**Giai đoạn:** Phase 12A — Forensic Current-State Source Inventory & Gap Evidence
**Ngày lập:** 21/09/2026
**Commit Baseline:** `873533248ca62d7eb08b84f2245ce1f4dec74150`

---

## 1. Mục Đích & Phạm Vi (Purpose & Scope)

Tài liệu này cung cấp bản kiểm kê chứng cứ pháp y kỹ thuật (`Forensic Technical Inventory`) toàn diện về mã nguồn hiện trạng của kho mã nguồn NOVYX GreenOps tại commit `8735332`. Toàn bộ dữ liệu trong tài liệu này dựa trên việc kiểm tra trực tiếp các tệp tin, cú pháp AST, cấu hình dự án và mã lệnh đang chạy, loại bỏ hoàn toàn các giả định hay suy diễn chủ quan.

Tài liệu là nền tảng bằng chứng thực nghiệm cho Kế hoạch Triển khai Tổng thể (Phase 12 Master Plan) và Ma trận Khoảng cách Kỹ thuật (Implementation Gap Register).

---

## 2. Cấu Trúc Monorepo & Cấu Hình Môi Trường (Workspace Topology)

### 2.1 Cấu hình Monorepo Gốc (`package.json`)
- **Tệp tin:** [`package.json`](../../package.json)
- **Cấu trúc Workspaces:**
  ```json
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
  ```
- **Engine yêu cầu:** Node.js `>= 22.13.0`.
- **Scripts quản lý monorepo hiện có:**
  - `mobile:start`, `mobile:android`, `mobile:prebuild:android`, `mobile:export:android`, `mobile:smoke:check`.
  - `api:dev`: Chạy máy chủ dev giả lập cục bộ (`node scripts/greenops-dev-api.cjs`).
  - `typecheck`: Chạy `npm run typecheck --workspaces --if-present`.
  - `lint`: Chạy `eslint .` (ESLint 9.x flat config).
  - `format` / `format:check`: Prettier 3.x.
  - `check`: Chạy chuỗi kiểm tra nền tảng (`format:check && lint && typecheck && mobile:export:android`).
- **Khoảng cách hiện trạng:** Chưa có script `test` tập trung; chưa cấu hình runner kiểm thử tự động (Jest, Vitest).

### 2.2 Danh mục Workspaces Hiện Có
1. **`apps/mobile` ([`apps/mobile/package.json`](../../apps/mobile/package.json)):**
   - Tên gói: `@novyx/mobile` (v1.0.0).
   - Nền tảng: React Native 0.86.0 / React 19.2.3 / Expo SDK 57.0.4.
   - Thư viện thành phần gốc: `expo-camera` (~57.0.1), `expo-location` (~57.0.2), `expo-secure-store` (~57.0.0), `react-native-maps` (1.27.2), `react-native-svg` (15.15.4), `react-native-curved-bottom-bar` (^3.5.1).
   - Phụ thuộc nội bộ: `file:../../packages/config`, `file:../../packages/contracts`, `file:../../packages/ui`.
2. **`packages/contracts` ([`packages/contracts/package.json`](../../packages/contracts/package.json)):**
   - Tên gói: `@novyx/contracts` (v0.1.0).
   - Loại gói: `"type": "module"`. Không có phụ thuộc runtime (`dependencies: {}`).
   - Điểm vào: `src/index.ts`.
3. **`packages/config` ([`packages/config/package.json`](../../packages/config/package.json)):**
   - Tên gói: `@novyx/config` (v0.1.0).
   - Phụ thuộc: `zod` (^3.24.1).
   - Chức năng: Xác thực biến môi trường runtime (`readPublicRuntimeConfig`).
4. **`packages/ui` ([`packages/ui/package.json`](../../packages/ui/package.json)):**
   - Tên gói: `@novyx/ui` (v0.1.0).
   - Chức năng: Export token thiết kế (`colors`, `spacing`, `typography`, `radius`).
5. **`external/hermes-agent`:** Submodule git độc lập (ADR 0002).

### 2.3 Thành phần Mục tiêu Chưa Tồn tại trong Mã Nguồn
- **`apps/api`:** CHƯA TỒN TẠI (Thành phần mục tiêu được chấp thuận tại ADR 0013).
- **`apps/admin-web`:** CHƯA TỒN TẠI (Thành phần mục tiêu được chấp thuận tại ADR 0005).

---

## 3. Khảo Sát Chi Tiết Gói Hợp Đồng (`packages/contracts`)

- **Tệp tin:** [`packages/contracts/src/index.ts`](../../packages/contracts/src/index.ts) (258 dòng, 5.343 bytes).

### 3.1 Thực trạng Enums và Types
1. **`TaskStatus` (Dòng 54–62):**
   ```typescript
   export const TaskStatus = {
     PENDING: 'Pending',
     IN_PROGRESS: 'In_Progress',
     WAITING_REVIEW: 'Waiting_Review',
     COMPLETED: 'Completed',
     REWORK_REQUIRED: 'Rework_Required',
   } as const;
   ```
   - **Khiếm khuyết xác nhận:** Chỉ có 5 trạng thái; thiếu hoàn toàn 2 trạng thái chuẩn tắc đã đóng băng: `BLOCKED` và `CANCELLED`.
   - **Lệch chuẩn định dạng:** Giá trị chuỗi dùng PascalCase kết hợp gạch dưới (`'Pending'`, `'In_Progress'`), trong khi chuẩn nghiệp vụ quy định SCREAMING_SNAKE_CASE (`'PENDING'`, `'IN_PROGRESS'`).
2. **`ReviewDecision` (Dòng 71):**
   ```typescript
   export type ReviewDecision = 'approve' | 'request_rework';
   ```
   - **Khoảng cách xác nhận (PRESENT_BUT_INSUFFICIENT):** Hiện chỉ định nghĩa 2 giá trị sơ khởi dạng chuỗi `'approve' | 'request_rework'`. Thiếu 2 kết luận chuẩn tắc: `APPROVE_WITH_EXCEPTION` và `CANCEL`, đồng thời chưa chuẩn hóa sang biểu diễn SCREAMING_SNAKE_CASE chuẩn tắc đã được đóng băng (`APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL`).
3. **`ProofProfile`:**
   - **Khiếm khuyết xác nhận:** Hoàn toàn KHÔNG TỒN TẠI trong contracts (chưa có `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`).
4. **`AccountStatus`:**
   - **Khiếm khuyết xác nhận:** Hoàn toàn KHÔNG TỒN TẠI (chưa có `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`).
5. **`Role` / `UserRole` (Dòng 41, 64):**
   ```typescript
   export type UserRole = 'staff' | 'manager' | 'admin';
   export type Role = 'Staff' | 'Manager';
   ```
   - **Khiếm khuyết xác nhận:** Tồn tại hai kiểu vai trò không đồng nhất. Kiểu `Role` dùng cho mobile chỉ có `'Staff' | 'Manager'`, loại trừ `'admin'`, dẫn tới khuyết tật ép role trên giao diện.

### 3.2 Thực trạng DTOs và Yêu cầu Đột biến
1. **Thiếu Khóa Kiểm soát Đồng thời (OCC):**
   - Các interface `TaskDto` (dòng 128), `TreeDto` (dòng 73) hoàn toàn KHÔNG CÓ trường `version: number`.
   - Các mutation requests: `CreateTaskRequest` (dòng 209), `UpdateTaskProgressRequest` (dòng 219), `SubmitTaskEvidenceRequest` (dòng 232), `ReviewDecisionRequest` (dòng 250) hoàn toàn KHÔNG CÓ trường `expectedVersion: number`.
2. **Thiếu Khóa Vận chuyển Phi trùng lặp (Idempotency-Key):**
   - Không có schema định nghĩa Header `Idempotency-Key` hoặc metadata vận chuyển Outbox.
3. **Thiếu Schema Runtime Validation (Zod):**
   - `@novyx/contracts` chỉ xuất các TypeScript `interface` và `type`.
   - Hoàn toàn KHÔNG CÓ Zod schema nào được định nghĩa hay xuất bản (chưa có `z.infer<T>`).
4. **Sai lệch Danh pháp Lệnh Chuẩn:**
   - Gói contracts định nghĩa `SubmitTaskEvidenceRequest` (dòng 232) thay vì danh pháp chuẩn tắc `SubmitEvidence`.

---

## 4. Khảo Sát Chi Tiết Tầng Dịch Vụ Mobile (`greenOpsService.ts`)

- **Tệp tin:** [`apps/mobile/src/services/greenOpsService.ts`](../../apps/mobile/src/services/greenOpsService.ts) (856 dòng, 27.731 bytes).

### 4.1 Khuyết tật Ôm đồm Trách nhiệm (Catch-All Monolith)
`greenOpsService` hiện là một service đơn khối đảm nhiệm đồng thời 10 trách nhiệm khác nhau:
1. **Lưu trữ dữ liệu trong RAM:** Khai báo biến module `let snapshot: AppDataDto = createInitialData()` (dòng 354) để lưu toàn bộ cây, tác vụ, nhân viên và thông báo. Mọi đột biến chỉ cập nhật vào RAM, biến mất hoàn toàn khi ứng dụng bị OS kill hoặc khởi động lại.
2. **Bộ điều hợp Giả lập (Mock Adapter):** Tự sinh dữ liệu và mô phỏng độ trễ mạng trong bộ nhớ (dòng 356–467).
3. **Bộ điều hợp REST (REST Adapter):** Thực hiện cuộc gọi HTTP qua `fetch` tới `EXPO_PUBLIC_API_BASE_URL` (dòng 768–855).
4. **Cơ chế Chuyển đổi Nguồn (Fallback Switcher):** Logic tự động nuốt lỗi mạng và rơi về dữ liệu RAM cục bộ (dòng 520–640), che giấu lỗi thực tế.
5. **Quản lý Phiên & Phục hồi Đăng nhập:** Đảm nhận login, restoreSession, logout (dòng 470–518).
6. **Điều phối Đột biến Tác vụ Hiện trường:** Nhận `CreateTaskRequest`, `UpdateTaskProgressRequest`, `SubmitTaskEvidenceRequest`, `ReviewDecisionRequest` (dòng 586–639).
7. **Chiếu Lịch sử Chăm sóc (CareHistory Projection):** Tự gom và lọc dữ liệu lịch sử chăm sóc cây (dòng 544–565).
8. **Tra cứu Cây qua QR:** Tìm kiếm cây trong snapshot RAM hoặc qua REST (dòng 567–584).
9. **Quản lý Thông báo:** Tạo thông báo, đánh dấu đã đọc (dòng 641–662).
10. **Tải Bằng chứng Lưỡng hình:** Phân nhánh giữa multipart file upload và metadata-only request nếu URI là file cục bộ (dòng 815–829).

### 4.2 Thiếu Hàng Đợi Bền Vững (Zero Outbox Queue)
- Không có bất kỳ cơ chế lưu trữ hàng đợi nộp bằng chứng trên đĩa (`expo-sqlite`).
- Khi mất mạng, nếu cuộc gọi REST thất bại, hàm `submitTaskEvidence` rơi về cập nhật snapshot trong RAM. Nếu thiết bị tắt nguồn hoặc kill app trước khi có mạng lại, toàn bộ bằng chứng và ghi chú bị mất trắng.

---

## 5. Khảo Sát Chi Tiết Ứng Dụng Giao Diện Mobile (`MobileApp.tsx`)

- **Tệp tin:** [`apps/mobile/src/screens/MobileApp.tsx`](../../apps/mobile/src/screens/MobileApp.tsx) (2.054 dòng, 49.532 bytes).

### 5.1 Khuyết tật Ép Vai trò & Điều hướng Nhị phân
- **Dòng 396–401:**
  ```typescript
  const normalized = email.trim().toLowerCase();
  void onLogin(
    normalized.includes('manager') || normalized.includes('admin') ? 'Manager' : 'Staff',
    normalized,
    password,
  );
  ```
  - **Bằng chứng xác nhận:** Tài khoản chứa từ khóa `admin` bị ép cứng thành vai trò `'Manager'`.
- **Dòng 274:**
  ```typescript
  const isStaff = role === 'Staff';
  ```
  - **Bằng chứng xác nhận:** Hệ thống điều hướng hoàn toàn dựa trên cờ nhị phân `isStaff`. Nếu không phải `'Staff'`, người dùng được chuyển thẳng vào không gian điều phối tác nghiệp của Manager, dẫn tới nguy cơ lộ quyền quản lý tác vụ cho tài khoản quản trị viên.

### 5.2 Rò rỉ Logic Quy trình Nghiệp vụ vào Giao diện
- `MobileApp.tsx` trực tiếp chứa state điều hướng, phân quyền hiển thị màn hình, xử lý modal lỗi, và tự tính toán luồng nộp bằng chứng thay vì thông qua Use Cases hoặc State Machine độc lập.
- Tương tự, [`apps/mobile/src/domain/mobileWorkflow.ts`](../../apps/mobile/src/domain/mobileWorkflow.ts) (dòng 146–153) mã hóa cứng quy trình 5 bước tuần tự cũ:
  `GPS -> QR -> BEFORE -> CHECKLIST -> AFTER`, vi phạm kiến trúc 3 Hồ sơ Bằng chứng ngữ nghĩa linh hoạt (`ProofProfile`).

---

## 6. Khảo Sát Máy Chủ Giả Lập Phát Triển (`greenops-dev-api.cjs`)

- **Tệp tin:** [`scripts/greenops-dev-api.cjs`](../../scripts/greenops-dev-api.cjs) (537 dòng, 17.613 bytes).

### 6.1 Bằng chứng Thiếu Ranh giới Bảo vệ & Ủy quyền
1. **Lưu trữ Tạm trong RAM Node.js (Dòng 234):**
   ```javascript
   let tasks = createInitialTasks();
   ```
   Khởi tạo mảng trong RAM tiến trình, mất dữ liệu khi restart script.
2. **Không Xác thực Danh tính & Phân quyền (Dòng 397–404):**
   ```javascript
   if (request.method === 'GET' && path === '/v1/tasks') {
     const staffId = query.get('staffId');
     const status = query.get('status');
     ok(
       response,
       tasks.filter((task) => (!staffId || task.assignedStaffId === staffId) && (!status || task.status === status)),
     );
     return;
   }
   ```
   Endpoint `/v1/tasks` công khai hoàn toàn, không yêu cầu Header `Authorization`. Bất kỳ ai cũng có thể đọc danh sách toàn bộ tác vụ của tất cả nhân viên khác nếu không truyền query `staffId`.
3. **Tạo Tác vụ Không có Rào chắn Thẩm quyền (Dòng 407–430):**
   Endpoint `POST /v1/tasks` chấp nhận payload tạo task từ bất kỳ caller nào mà không kiểm tra xem caller có vai trò Manager hay không, và tự động fallback về `trees[0]` / `staff[0]` nếu dữ liệu sai lệch.
4. **Không Hỗ trợ OCC (`expectedVersion`):**
   Mọi endpoint update (`/progress`, `/evidence`, `/review`) ghi đè trực tiếp thuộc tính mà không kiểm tra phiên bản.
5. **Không Hỗ trợ Ghi nhận Kiểm toán (`AuditEvent`):**
   Không có bảng lưu vết kiểm toán, không có phân tách quyền DB.

---

## 7. Bảng Đối Soát 15 Ứng Viên Khoảng Cách Kỹ Thuật (Gap Candidates Verification)

Dưới đây là kết quả xác minh thực nghiệm đối với 15 ứng viên khoảng cách kỹ thuật được yêu cầu đối soát:

| STT | Ứng viên Khoảng cách Kỹ thuật | Trạng thái Xác minh | Tệp tin & Dòng Chứng cứ | Bản chất Khuyết tật Kỹ thuật |
| :---: | :--- | :---: | :--- | :--- |
| 1 | Admin role coerced to Manager | **CONFIRMED** | `apps/mobile/src/screens/MobileApp.tsx:398`, `LoginScreen.tsx:41, 117` | Chuỗi `admin` bị ép thành `'Manager'`; type `Role` chỉ có `'Staff' \| 'Manager'`. |
| 2 | Binary `isStaff` routing causes Admin misrouting | **CONFIRMED** | `apps/mobile/src/screens/MobileApp.tsx:274, 276` | Phân quyền nhị phân `isStaff = role === 'Staff'`, tài khoản khác mặc định vào không gian Manager. |
| 3 | TaskStatus contract missing BLOCKED / CANCELLED | **CONFIRMED** | `packages/contracts/src/index.ts:54-62` | Chỉ có 5 trạng thái PascalCase, thiếu hoàn toàn `BLOCKED` và `CANCELLED`. |
| 4 | Missing ProofProfile / ReviewDecision contracts | **CONFIRMED** | `packages/contracts/src/index.ts:71` | Không có `ProofProfile` (MISSING); `ReviewDecision` chỉ có `'approve' \| 'request_rework'`, thiếu `APPROVE_WITH_EXCEPTION` và `CANCEL` (PRESENT_BUT_INSUFFICIENT). |
| 5 | `createTask` lacks authoritative role/resource guard | **CONFIRMED** | `scripts/greenops-dev-api.cjs:407-430`, `greenOpsService.ts:418, 806` | Không kiểm tra vai trò Manager; tự động fallback tree/staff nếu không tìm thấy. |
| 6 | Task list protection exists only in UI | **CONFIRMED** | `scripts/greenops-dev-api.cjs:397-404` | Endpoint `GET /v1/tasks` không lọc theo actor token; chỉ dựa vào query param tùy chọn của client. |
| 7 | RAM snapshot persistence | **CONFIRMED** | `apps/mobile/src/services/greenOpsService.ts:354`, `greenops-dev-api.cjs:234` | Dữ liệu lưu trong biến RAM tiến trình (`let snapshot`, `let tasks`), mất trắng khi kill app/process. |
| 8 | No durable Outbox | **CONFIRMED** | Toàn bộ `apps/mobile/src/` (0 kết quả tìm kiếm cho outbox) | Không có bảng lưu trữ outbox trên SQLite; không có hàng đợi thử lại nền an toàn. |
| 9 | No production `apps/api` | **CONFIRMED** | Cấu trúc thư mục root (chỉ có `apps/mobile`) | Chưa có thư mục, mã nguồn backend Modular Monolith chuẩn Node.js / TypeScript. |
| 10 | No `apps/admin-web` | **CONFIRMED** | Cấu trúc thư mục root (chỉ có `apps/mobile`) | Chưa có Cổng Quản trị Web độc lập cho Platform Administrator theo ADR 0005. |
| 11 | No append-only audit persistence | **CONFIRMED** | Toàn bộ repo (0 kết quả tìm kiếm cho `AuditEvent`) | Chưa có bảng kiểm toán trung tâm, chưa có phân tách quyền DB runtime theo ADR 0011. |
| 12 | No OCC version | **CONFIRMED** | `packages/contracts/src/index.ts:128-151`, `greenops-dev-api.cjs` | DTOs và mutations không có `version` / `expectedVersion`; không có mã lỗi `409 STALE_VERSION`. |
| 13 | No Idempotency-Key transport support | **CONFIRMED** | `packages/contracts`, `apps/mobile/src/services/greenOpsService.ts` | Không có Header `Idempotency-Key` trên REST client; không có bảng lưu vết idempotency ở server. |
| 14 | `greenOpsService` catch-all responsibility | **CONFIRMED** | `apps/mobile/src/services/greenOpsService.ts:1-856` | 856 dòng đảm nhận 10 trách nhiệm khác nhau (RAM cache, HTTP, login, projection, multipart, v.v.). |
| 15 | Business transition logic leaked into UI | **CONFIRMED** | `mobileWorkflow.ts:146-153`, `MobileApp.tsx`, `StaffProofFlow.tsx` | Mã hóa cứng quy trình 5 bước cũ trong UI; tự tính toán bước kế tiếp thay vì dùng Domain Engine. |

---

## 8. Kết Luận Bằng Chứng (Forensic Conclusion)

Kết quả điều tra thực nghiệm xác nhận: Toàn bộ 15 khiếm khuyết kỹ thuật được ghi nhận tại Phase 11C đều **tồn tại thực tế trong mã nguồn hiện tại** (15/15 CONFIRMED).

Tuy nhiên, cần phân biệt chính xác mức độ hiện diện: Kho mã nguồn hiện hữu không hoàn toàn là "con số không" mà đã có sẵn một số thành phần sơ khai (`primitives` cục bộ):
- Nền tảng monorepo npm workspaces chuẩn hóa (`@novyx/contracts`, `@novyx/config`, `@novyx/ui`, `@novyx/mobile`).
- Thư viện `zod` đã có mặt trong `packages/config`.
- Thư viện bảo mật `expo-secure-store` đã được cài đặt trong `apps/mobile`.
- REST client thô và script máy chủ dev giả lập `greenops-dev-api.cjs` đã có giao thức phong bì cơ bản.

Dù vậy, các thành phần sơ khai này **mới chỉ ở mức PRESENT_BUT_INSUFFICIENT hoặc CONFLICTING_AS_IS**, hoàn toàn chưa đáp ứng được các yêu cầu bất biến của bộ ADR 0005..0013. Kiến trúc mục tiêu **CHƯA ĐƯỢC TRIỂN KHAI HOÀN CHỈNH ĐẦU-CUỐI (NOT IMPLEMENTED END-TO-END)**.

Điều này chứng minh tính cấp thiết của một Kế hoạch Triển khai Phân tầng (Wave Model) nghiêm ngặt, chuyển đổi dần dần (Strangler Pattern) thay vì một đợt đập đi xây lại toàn bộ (Big-Bang Rewrite).
