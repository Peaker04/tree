# Đặc tả Thiết kế Kiến trúc & Nghiệp vụ: Bổ sung Vai trò Giám sát Hiện trường (`supervisor`) và Luồng Xác thực Kép (`Staff` GPS + `Supervisor` Bằng chứng Ảnh → `Manager` Duyệt)

- **Tài liệu**: `docs/superpowers/specs/2026-10-24-supervisor-role-workflow-design.md`
- **Ngày tạo**: 2026-10-24
- **Phương pháp**: Superpowers Brainstorming & Architectural Design Spec
- **Phạm vi**:
  - Shared Contracts (`packages/contracts`)
  - Backend API & Persistence (`apps/api`)
  - Mobile Application & Offline Outbox (`apps/mobile`)
  - Admin Web (`apps/admin-web`)
  - Tài liệu Nghiệp vụ & Kiểm thử (`docs/`, `tests/`)

---

## 1. Mục đích & Lý do Nghiệp vụ (Intent & The Why)

Trong vận hành thực tế của NOVYX GreenOps, việc để một mình Nhân viên hiện trường (`staff`) vừa trực tiếp lao động chăm sóc cây xanh vừa tự chụp ảnh Trước/Sau dẫn đến 2 vấn đề thực tiễn:
1. **Gánh nặng thao tác cho nhân viên thi công:** Nhân viên phải dừng tay giữa lúc làm việc ngoài trời để mở camera chụp ảnh Trước và Sau.
2. **Thiếu tính khách quan độc lập của bằng chứng hình ảnh:** Người trực tiếp làm việc tự chụp ảnh nghiệm thu công việc của chính mình.

Do đó, nghiệp vụ mới bổ sung vai trò **Giám sát hiện trường (`supervisor`)** để thiết lập cơ chế **Đối soát Hiện trường Kép (Dual-Actor Field Verification)**:
- **Nhân viên hiện trường (`staff`):** Tập trung thi công tại chỗ, chứng minh sự hiện diện vật lý thực tế thông qua **Định vị GPS** (kiểm tra đứng trong bán kính hợp lệ $\le 10\text{m}$ tại khu vực cây), **Quét mã QR cây**, và **Tích hoàn thành Checklist công việc**, hoàn toàn **không còn bước chụp ảnh Trước/Sau**.
- **Giám sát hiện trường (`supervisor`):** Đến hiện trường sau khi nhân viên hoàn thành phần việc, thực hiện **chụp ảnh bằng chứng Trước & Sau** (theo `ProofProfile` hiện hành) kèm **lưu dấu vị trí GPS & thời gian lúc Giám sát chụp**.
- **Quản lý vận hành (`manager`):** Là người thẩm định cuối cùng, duyệt bộ hồ sơ công việc **kết hợp từ cả Nhân viên hiện trường (GPS + QR + Checklist) và Giám sát hiện trường (Ảnh Trước/Sau + GPS Giám sát)**.

---

## 2. Mục tiêu, Phi mục tiêu & Chống mục tiêu (Goals, Non-Goals & Anti-Goals)

### 2.1. Mục tiêu (Goals)
1. **Bổ sung chính thức vai trò `supervisor` (Giám sát hiện trường)** vào hệ thống định danh IAM, RBAC Middleware, Contracts, Admin Web và ứng dụng di động (`apps/mobile`).
2. **Loại bỏ hoàn toàn bước chụp ảnh Trước/Sau khỏi luồng của `staff`:** Luồng của `staff` trên ứng dụng di động chỉ còn 3 bước thực địa: `GPS` ($\le 10\text{m}$) $\to$ `QR` $\to$ `CHECKLIST` $\to$ Gửi xác nhận hoàn thành phần việc của Nhân viên.
3. **Xây dựng luồng tác nghiệp cho `supervisor` trên Mobile App:**
   - Mọi `supervisor` trong khu vực đều thấy danh sách các công việc cần giám sát chụp ảnh (đặc biệt là các việc `staff` đã gửi xác nhận GPS/QR/Checklist).
   - `Manager` vẫn có thể tùy chọn chỉ định một `supervisor` cụ thể khi tạo việc (`assignedSupervisorId` optional).
   - `supervisor` thực hiện chụp ảnh Trước & Sau (theo `ProofProfile`) kèm ghi nhận tọa độ GPS và thời điểm chụp của Giám sát, sau đó gửi lên hệ thống để đẩy nhiệm vụ sang `WAITING_REVIEW`.
4. **Cập nhật màn hình Duyệt của `Manager` (`ManagerReview`):** Hiển thị minh bạch 2 khối thông tin kết hợp:
   - Khối 1: **Thông tin thực hiện từ Nhân viên hiện trường (`staff`)** — Tọa độ GPS nhân viên, khoảng cách tới cây ($\le 10\text{m}$), độ chính xác vệ tinh, thời gian định vị, mã QR cây và Checklist.
   - Khối 2: **Bằng chứng hình ảnh từ Giám sát hiện trường (`supervisor`)** — Người giám sát chụp, tọa độ GPS/thời gian giám sát chụp, và cặp ảnh Trước/Sau.
5. **Hỗ trợ Làm lại có mục tiêu (`REWORK_REQUIRED`) cho mô hình 2 vai trò:**
   - Nếu `Manager` yêu cầu làm lại khâu `GPS`, `QR`, hoặc `CHECKLIST` $\to$ `Staff` thực hiện cập nhật lại.
   - Nếu `Manager` yêu cầu làm lại khâu `BEFORE`, `AFTER`, hoặc `EVIDENCE` (ảnh mờ/sai góc) $\to$ `Supervisor` thực hiện chụp lại mà không bắt `Staff` phải đi đo lại GPS/Checklist đã đạt chuẩn.

### 2.2. Phi mục tiêu (Non-Goals)
- Không thêm trạng thái thứ 8 vào enum `CANONICAL_TASK_STATUSES` để tránh phá vỡ bất biến vòng đời 7 trạng thái (`DR-MVP-03`) và hàng loạt kiểm thử quản trị. Trạng thái bàn giao giữa `staff` và `supervisor` được biểu diễn qua chiều tiến độ bằng chứng (`ProofProgress` / `staffCompletedAt` trong khi `TaskStatus` vẫn là `IN_PROGRESS`), tuân thủ đúng Mục 7 của `docs/DOMAIN.md` (*Separate State Dimensions*).
- Không thay đổi thẩm quyền của `Platform Administrator (admin)` trong vận hành thực địa (Admin chỉ cấp phát tài khoản/gán quyền `supervisor` trên Admin Web, không can thiệp Task).

### 2.3. Chống mục tiêu (Anti-Goals — Những điều làm hỏng thiết kế nếu xảy ra)
- **Không cho phép cùng 1 người vừa làm `staff` vừa làm `supervisor` hoặc `manager` trên cùng 1 task:** Vi phạm nguyên tắc Phân tách trách nhiệm (`DR-HARD-02` / `SoD-01`).
- **Không bắt `staff` phải tải ảnh giả/placeholder lên S3:** Khi `staff` gửi xác nhận GPS + QR + Checklist, gói tin không chứa ảnh Trước/Sau.
- **Không làm mất dữ liệu GPS của `staff` khi `supervisor` gửi ảnh bằng chứng:** Dữ liệu của hai vai trò phải được hợp nhất nguyên vẹn kèm danh tính tác giả của từng phần (`staffId` cho GPS/QR/Checklist, `supervisorId` cho Ảnh + GPS giám sát).

---

## 3. Các Quyết định Nghiệp vụ Đã Chốt của Người dùng (User-Decided Requirements)

| Hạng mục | Quyết định của Người dùng |
|---|---|
| **1. Các bước của Nhân viên hiện trường (`staff`)** | Thực hiện **Định vị GPS** (kiểm tra trong khu vực $\le 10\text{m}$) + **Quét mã QR cây** + **Tích Checklist công việc**. **Bỏ hoàn toàn bước chụp ảnh Trước & Sau**. |
| **2. Bằng chứng của Giám sát hiện trường (`supervisor`)** | Chụp **ảnh Trước & Sau** (theo `ProofProfile` hiện có) kèm **lưu dấu GPS và thời gian lúc Giám sát chụp**. |
| **3. Trình tự phối hợp (`staff` $\to$ `supervisor` $\to$ `manager`)** | **Nối tiếp (Sequential):** Nhân viên (`staff`) gửi xác nhận GPS/QR/Checklist hoàn thành trước $\to$ Giám sát (`supervisor`) vào chụp ảnh bằng chứng $\to$ Chuyển sang `WAITING_REVIEW` để Quản lý (`manager`) duyệt. |
| **4. Cơ chế phân công `supervisor`** | **Mở theo khu vực kèm tùy chọn chỉ định:** Mọi `supervisor` trong khu vực đều thấy công việc để vào chụp bằng chứng; đồng thời `Manager` có thể tùy chọn chỉ định `supervisor` cụ thể khi tạo việc nếu muốn. |

---

## 4. Thiết kế Kỹ thuật Chi tiết theo Từng Tầng (Architecture & Component Design)

### 4.1. Tầng Hợp đồng Dùng chung (`packages/contracts`)

1. **Mở rộng Vai trò (`packages/contracts/src/auth/roles.ts` & `transitional.ts`):**
   - `HUMAN_ROLES = ['staff', 'supervisor', 'manager', 'admin'] as const`.
   - `export type Role = 'Staff' | 'Supervisor' | 'Manager'` trong `packages/contracts/src/legacy/transitional.ts`.
2. **Mở rộng Danh mục Nhân sự (`packages/contracts/src/operational/operational-catalogs.ts`):**
   - Giữ `AssignableStaffCatalogItemSchema` và thêm trường tùy chọn `role?: 'staff' | 'supervisor'` hoặc danh mục `AssignableSupervisorCatalogItemSchema` để `ManagerCreateTask` có thể lọc danh sách `staff` và `supervisor` (không bắt buộc chọn `supervisor` khi tạo việc).
3. **Mở rộng Hợp đồng Nhiệm vụ (`packages/contracts/src/operational/operational-tasks.ts`):**
   - Trong `CreateTaskRequestSchema`: thêm `assignedSupervisorId: z.string().min(1).optional()`.
   - Trong `TaskDtoSchema` và `TaskDto` (`transitional.ts`): thêm các trường tùy chọn để phản ánh đầy đủ thông tin kết hợp từ `staff` và `supervisor`:
     - `assignedSupervisorId?: string`
     - `assignedSupervisorName?: string`
     - `staffCompletedAt?: string` (Thời điểm nhân viên hiện trường hoàn tất gửi GPS + QR + Checklist)
     - `supervisorId?: string` (Giám sát hiện trường thực tế đã chụp bằng chứng)
     - `supervisorName?: string`
     - `supervisorGpsCheck?: GpsCheckDto` (Vị trí GPS & thời gian lúc Giám sát chụp bằng chứng)
     - `supervisorCompletedAt?: string`
     - `supervisorNotes?: string`
4. **Hợp đồng Gửi dữ liệu Hiện trường (`packages/contracts/src/operational/evidence.ts`):**
   - **Cho Nhân viên hiện trường (`StaffCheckinRequestSchema` / `StaffExecutionSubmission`):**
     - Bao gồm: `taskId`, `expectedVersion`, `siteVerification` (`gpsCheck` $\le 10\text{m}$ và `qrCheck`), `locationException?`, `identityException?`, `checklist: SubmittedChecklistItemSchema[]`, `notes?`.
     - **Không yêu cầu** `beforePhotoUri` / `afterPhotoUri`.
   - **Cho Giám sát hiện trường (`SupervisorEvidenceRequestSchema` / `SubmitEvidenceRequestSchema`):**
     - Bao gồm: `taskId`, `expectedVersion`, `proof: ProofPayloadSchema` (`beforePhotoUri`, `afterPhotoUri`, `checklist`), `supervisorGpsCheck?: GpsCheckSchema`, `notes?`.
   - **Tương thích ngược cho `SubmitEvidenceRequestSchema`:**
     - Giữ nguyên cấu trúc `SubmitEvidenceRequestSchema` hiện tại để toàn bộ các unit test hợp đồng hiện có (`tests/contracts/contracts.spec.ts`) không bị gãy, đồng thời bổ sung `StaffExecutionSubmitRequestSchema` và `SupervisorEvidenceSubmitRequestSchema` cho luồng 2 bước.

---

### 4.2. Tầng Backend API & Cơ sở Dữ liệu (`apps/api`)

1. **Lược đồ Cơ sở dữ liệu & Thực thể `Task` (`apps/api/src/modules/work-management/domain/task.entity.ts`):**
   - Trên `Task` entity và `toTaskDto`:
     - Khi `staff` gửi xác nhận thực địa (`submitStaffExecution`), hệ thống lưu một bản ghi `EvidenceAttempt` mang dấu `proofData.submissionStage = 'STAFF_EXECUTION'` chứa `siteVerification` (`gpsCheck`, `qrCheck`), `checklist`, `staffCompletedAt` và `submittedByUserId = staff.id`. Trạng thái `TaskStatus` giữ ở `IN_PROGRESS` (tăng `version` OCC lên +1), nhưng `toTaskDto` chiếu `staffCompletedAt`, `gpsCheck`, `qrCheck`, `checklist` ra DTO để `Supervisor` và `Manager` thấy ngay.
     - Khi `supervisor` gửi bằng chứng hình ảnh (`submitSupervisorEvidence` hoặc qua `/v1/tasks/:id/evidence`), hệ thống kiểm tra:
       1. `staff` đã hoàn tất phần định vị GPS + QR + Checklist trước đó (tồn tại `gpsCheck`/`locationException` và `qrCheck`/`identityException` đã xác thực từ `staff`).
       2. `actorRole === 'supervisor'` và `actorId !== task.assignedStaffId` (đảm bảo Phân tách trách nhiệm `DR-HARD-02`: người giám sát không thể là nhân viên làm task đó). Nếu task có chỉ định cứng `assignedSupervisorId`, kiểm tra `assignedSupervisorId === actorId`.
       3. Các đối tượng ảnh trên S3 (`beforePhotoUri`, `afterPhotoUri`) có reservation hợp lệ thuộc về `supervisor` (`reservation.actorId === context.actorId`) và khớp mã băm SHA-256.
       4. Hợp nhất dữ liệu của `staff` (`siteVerification`, `checklist`, `staffCompletedAt`) với dữ liệu của `supervisor` (`beforePhotoUri`, `afterPhotoUri`, `supervisorGpsCheck`, `supervisorId`, `supervisorName`, `supervisorCompletedAt`) vào `EvidenceAttempt` hoàn chỉnh và chuyển trạng thái `TaskStatus`: `IN_PROGRESS` $\to$ `WAITING_REVIEW`!
2. **Ủy quyền Tải ảnh S3 (`PresignEvidenceUploadUseCase`):**
   - Cho phép cả `supervisor` (chụp ảnh bằng chứng Trước/Sau) và `staff` (chỉ khi chụp ảnh báo cáo sự cố `FieldIssue` hoặc ảnh giải trình ngoại lệ GPS/QR) gọi `/v1/tasks/:id/evidence/presign`.
3. **Thẩm định của Quản lý (`ReviewTaskUseCase`):**
   - Kiểm tra Phân tách trách nhiệm (`DR-HARD-02`): `Manager` duyệt bài (`context.actorId`) không được trùng với `task.assignedStaffId` và không được trùng với bất kỳ `submittedByUserId` nào trong lịch sử `evidence_attempts` (bao gồm cả `staff` và `supervisor`).
   - Khi `APPROVE` hoặc `APPROVE_WITH_EXCEPTION`: tạo bản ghi `CareHistoryRecord` lưu đầy đủ kết quả GPS của `staff` và ảnh Trước/Sau của `supervisor`.
   - Khi `REQUEST_REWORK`: chuyển task sang `REWORK_REQUIRED` kèm `targetedArea` (`GPS`, `QR`, `CHECKLIST` dành cho `Staff`; hoặc `BEFORE`, `AFTER`, `EVIDENCE` dành cho `Supervisor`).
4. **Nộp lại sau khi sửa (`ResubmitReworkUseCase`):**
   - Cho phép `staff` nộp lại nếu `targetedArea` thuộc phần của `staff` (`GPS`, `QR`, `CHECKLIST`) và cho phép `supervisor` nộp lại nếu `targetedArea` thuộc phần ảnh bằng chứng (`BEFORE`, `AFTER`, `EVIDENCE`), bảo toàn phần dữ liệu hợp lệ của vai trò kia và chuyển task về `WAITING_REVIEW`.
5. **Tài khoản Seed mẫu (`seed-dev.ts` & Mock Snapshot trong `greenOpsService.ts`):**
   - Bổ sung tài khoản mẫu cho Giám sát hiện trường: `supervisor1@novyx.vn` (mật khẩu dev chuẩn cùng hệ thống) với `role: 'supervisor'` để dễ dàng đăng nhập kiểm thử E2E cả 3 vai trò `Staff` $\to$ `Supervisor` $\to$ `Manager`.

---

### 4.3. Tầng Ứng dụng Di động (`apps/mobile`)

1. **Điều hướng 3 Vai trò (`MobileApp.tsx`):**
   - Hỗ trợ đăng nhập cho 3 vai trò tác nghiệp:
     - `staff` $\to$ `StaffArea` (Nhân viên hiện trường)
     - `supervisor` $\to$ `SupervisorArea` (Giám sát hiện trường)
     - `manager` $\to$ `ManagerArea` (Quản lý vận hành)
   - Màn hình đăng nhập (`AuthScreens.tsx`) hỗ trợ đăng nhập tài khoản Giám sát hiện trường (`supervisor`).
2. **Luồng của Nhân viên Hiện trường (`StaffProofFlow.tsx` & `mobileWorkflow.ts`):**
   - Trong `getTaskProofWorkflowState(task, 'Staff')`:
     - Chỉ gồm **3 bước bắt buộc**:
       1. `GPS`: Định vị GPS tại khu vực cây ($\le 10\text{m}$).
       2. `QR`: Quét mã QR thân cây.
       3. `CHECKLIST`: Thực hiện & tích 100% checklist công việc.
     - **Loại bỏ hoàn toàn** bước chụp ảnh `BEFORE` và `AFTER` khỏi giao diện và thanh tiến trình của Nhân viên hiện trường (`totalRequired = 3`).
     - Sau khi hoàn thành 3 bước trên, nút hành động chính là **"Gửi định vị GPS & Xác nhận hoàn thành"**.
     - Khi Nhân viên bấm gửi: ứng dụng gửi dữ liệu `gpsCheck`, `qrCheck`, `checklist`, `notes` lên máy chủ (hoặc lưu Outbox nếu offline). Sau khi gửi xong, nhiệm vụ hiển thị trạng thái **"Đã gửi định vị — Chờ giám sát chụp ảnh"**.
3. **Luồng của Giám sát Hiện trường (`SupervisorArea` / `SupervisorProofFlow`):**
   - Giữ thanh điều hướng đáy 5 nút chuẩn mực (`Trang chủ`, `Cây xanh`, nút `QR` trung tâm, `Giám sát`, `Tài khoản`).
   - Danh sách công việc của Giám sát ưu tiên hiển thị các nhiệm vụ đang **Chờ giám sát chụp ảnh** (`status === 'IN_PROGRESS'` và Nhân viên đã gửi xác nhận `GPS` + `QR` + `CHECKLIST`), hoặc nhiệm vụ cần chụp lại ảnh (`status === 'REWORK_REQUIRED'` với mục tiêu làm lại là ảnh).
   - Trong chi tiết nhiệm vụ của Giám sát:
     - Hiển thị tóm tắt đã xác thực của Nhân viên hiện trường: Tên nhân viên, khoảng cách GPS nhân viên đã chốt ($\le 10\text{m}$), thời gian định vị, trạng thái QR & Checklist.
     - Tiến trình của Giám sát gồm:
       1. **Định vị GPS Giám sát** (xác nhận Giám sát đang ở hiện trường hoặc tự động lấy tọa độ GPS lúc chụp).
       2. **Chụp Ảnh Trước (`BEFORE`)** và **Chụp Ảnh Sau (`AFTER`)** theo `ProofProfile`.
       3. **Gửi bằng chứng giám sát** (tải ảnh qua pipeline `ExpoEvidenceFileStore` $\to$ Presign S3 $\to$ Submit) để chuyển nhiệm vụ sang `WAITING_REVIEW` cho `Manager`.
4. **Màn hình Duyệt của Quản lý (`ManagerReview.tsx`):**
   - Trong màn hình chi tiết duyệt (`ManagerReviewDetail`), hiển thị rõ ràng **Hồ sơ Kết hợp từ 2 Vai trò**:
     - **Thẻ 1 — Xác nhận Thực địa từ Nhân viên (`staff`):** Tên nhân viên (`assignedStaffName`), Tọa độ & Khoảng cách GPS ($\le 10\text{m}$), độ chính xác vệ tinh, thời gian gửi, kết quả quét QR cây, và danh sách Checklist.
     - **Thẻ 2 — Bằng chứng Hình ảnh từ Giám sát (`supervisor`):** Tên giám sát hiện trường (`supervisorName`), vị trí GPS/thời gian giám sát chụp, và cặp ảnh Trước / Sau (`PhotoPair`).
   - Khi `Manager` chọn **Yêu cầu làm lại (`REQUEST_REWORK`)**:
     - Các lýzy do về GPS / QR / Checklist sẽ định tuyến về cho `Staff`.
     - Các lý do về Ảnh trước/sau sẽ định tuyến về cho `Supervisor`.
5. **Màn hình Giao việc của Quản lý (`ManagerCreateTask.tsx`):**
   - Giữ nguyên việc chọn **Nhân viên thực hiện (`staff`)** là bắt buộc.
   - Bổ sung trường tùy chọn **Giám sát hiện trường (`supervisor`)** (mặc định: *"Mọi giám sát trong khu vực"* hoặc chọn 1 `supervisor` cụ thể từ danh sách).

---

### 4.4. Tầng Admin Web (`apps/admin-web`)
- Trong `apps/admin-web/src/pages/UsersPage.tsx`: bổ sung tùy chọn vai trò `Supervisor` (`supervisor` - Giám sát hiện trường) khi cấp phát tài khoản mới và hiển thị nhãn vai trò chuẩn xác trên bảng quản trị người dùng.

---

## 5. Những Quyết định Kỹ thuật do Builder Chủ động Xử lý (Builder's Calls)

Các chi tiết kỹ thuật dưới đây đã được quyết định theo chuẩn kiến trúc hiện có của repo:
1. **Bảo toàn 7 trạng thái `TaskStatus` chuẩn tắc:** Không thêm giá trị thứ 8 vào `CANONICAL_TASK_STATUSES`. Trạng thái bàn giao *"Chờ giám sát chụp ảnh"* được suy diễn tất định từ `status === 'IN_PROGRESS'` kết hợp với việc `staffCompletedAt` (hoặc bộ 3 `gpsCheck` + `qrCheck` + `checklist` của `staff`) đã hoàn tất nhưng chưa có ảnh bằng chứng của `supervisor`.
2. **Tương thích ngược cho các Unit Test hiện hữu:**
   - Hàm `getNextProofStep(task, role)` và `getTaskProofWorkflowState(task, role)`:
     - Khi gọi từ luồng `Staff` (`role = 'Staff'`): trả về 3 bước `['GPS', 'QR', 'CHECKLIST']`.
     - Khi gọi từ luồng `Supervisor` (`role = 'Supervisor'`): trả về các bước chụp ảnh `['BEFORE', 'AFTER']` (kèm định vị GPS giám sát).
     - Khi gọi không truyền `role` (ví dụ trong các bài test tổng hợp hoặc `ManagerReview` kiểm tra toàn bộ hồ sơ): vẫn kiểm tra đầy đủ cả 5 tiêu chí kết hợp (`GPS` + `QR` + `CHECKLIST` từ `staff` và `BEFORE` + `AFTER` từ `supervisor`) để `Manager` chỉ có thể bấm `APPROVE` khi cả `staff` và `supervisor` đều đã nộp đủ!
3. **Cơ chế lưu trữ trong PostgreSQL (`tasks` & `evidence_attempts`):**
   - Lưu đầy đủ thông tin của cả phiên nộp `STAFF_EXECUTION` và `SUPERVISOR_EVIDENCE` trong JSONB của `evidence_attempts` (`site_verification` và `proof_data`), do đó không bắt buộc phải chạy migration phá hủy cấu trúc bảng cũ mà vẫn truy xuất đầy đủ `staffCompletedAt`, `supervisorId`, `supervisorName`, `supervisorGpsCheck`, `beforePhoto`, `afterPhoto` trong `toTaskDto`.
