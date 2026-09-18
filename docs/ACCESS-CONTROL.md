# NOVYX GreenOps — Access Control, Actor Model & Action Eligibility

Tài liệu này là chuẩn mực duy nhất định nghĩa **MÔ HÌNH TÁC NHÂN (Actor Model)**, **QUYỀN HẠN & TRÁCH NHIỆM (Role & Responsibility)** và **MA TRẬN ĐIỀU KIỆN KÍCH HOẠT HÀNH ĐỘNG (Action Eligibility Matrix)**.

---

## 1. Sổ đăng ký tác nhân (Actor Registry)

Trong NOVYX GreenOps, quyền hạn không được gán ghép tùy tiện. Hệ thống phân loại chính thức các tác nhân:

| Tác nhân (Actor)                  | Trạng thái MVP      | Định danh trong Hợp đồng `[VERIFIED]`              | Phạm vi dữ liệu đọc (Readable Scope)                                                                                                         | Phạm vi dữ liệu ghi (Writable Scope)                                                                                      | Mục đích vận hành                                                                     |
| --------------------------------- | ------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Nhân viên hiện trường (Staff)** | **CURRENT MVP**     | `Role = 'Staff'`, `UserRole = 'staff'`, `StaffDto` | Chỉ các cây được giao, chỉ các nhiệm vụ được phân công (`assignedStaffId === user.id`), thông báo cá nhân, lịch sử chăm sóc cây liên quan.   | Cập nhật tọa độ GPS, quét mã QR, tải ảnh Before/After, tích checklist, nộp bằng chứng (`submitTaskEvidence`).             | Thực thi công việc chăm sóc cây ngoài thực địa và thu thập chuỗi bằng chứng 5 chốt.   |
| **Quản lý vận hành (Manager)**    | **CURRENT MVP**     | `Role = 'Manager'`, `UserRole = 'manager'`         | Toàn bộ danh mục cây đô thị, toàn bộ danh sách nhiệm vụ toàn tuyến, danh sách nhân viên & tải công việc, hàng đợi duyệt, thông báo vận hành. | Tạo nhiệm vụ mới, phân công nhân viên, phê duyệt (`approve`), yêu cầu làm lại (`request_rework`), tạo thông báo vận hành. | Điều phối nguồn lực, giám sát tiến độ và thẩm định chất lượng bằng chứng hiện trường. |
| **Quản trị hệ thống (Admin)**     | **RESERVED FUTURE** | `UserRole = 'admin'`                               | Toàn bộ hệ thống, cấu hình tham số, nhật ký kiểm toán (Audit Logs), người dùng và phân quyền.                                                | Khởi tạo tài khoản, phân quyền, cấu hình danh mục cây, mở khóa nghiệp vụ đặc biệt (Break-glass).                          | Quản trị nền tảng đô thị thông minh. _(Không có giao diện trên Mobile MVP)_.          |
| **Hệ thống tự động (System)**     | **TECHNICAL ACTOR** | `System`                                           | Trạng thái cảm biến thiết bị, bộ đệm ngoại tuyến, token phiên.                                                                               | Tự động đồng bộ cache, kiểm soát quyền camera/vị trí, làm mới token.                                                      | Điều phối kỹ thuật nền tảng và bảo toàn dữ liệu.                                      |

> **Làm rõ điểm vênh hợp đồng (Contract Discrepancy):**
> Trong `@novyx/contracts`, tồn tại cả `UserRole = 'staff' | 'manager' | 'admin'` (chữ thường) và `Role = 'Staff' | 'Manager'` (chữ hoa đầu từ). Tại tầng Mobile, chỉ có 2 vai trò `Staff` và `Manager`. Nếu token trả về role `'admin'`, hàm `mapSessionRole` trong `greenOpsService.ts` hiện ép về `'Manager'`. Trong tương lai khi có Web Admin, `UserRole` sẽ là tập cha. Không được tạo màn hình Admin trên mobile trong giai đoạn MVP.

---

## 2. Mô hình Vai trò — Trách nhiệm — Bàn giao (Role-Responsibility-Handoff)

### 2.1. Nhân viên hiện trường (Staff)

- **Trách nhiệm chính:**
  - Tiếp nhận nhiệm vụ trong hàng đợi cá nhân.
  - Di chuyển đến thực địa, định vị đúng gốc cây.
  - Thu thập đầy đủ 5 chốt bằng chứng trung thực, rõ nét.
  - Nộp báo cáo nghiệm thu đúng hạn.
  - Khắc phục nhanh các nhiệm vụ bị Quản lý yêu cầu làm lại.
- **Hành động bị cấm tuyệt đối (Forbidden):**
  - Không được tự tạo nhiệm vụ cho chính mình hoặc người khác.
  - Không được tự phê duyệt nhiệm vụ của mình.
  - Không được xem hoặc sửa nhiệm vụ của nhân viên khác.
  - Không được nộp báo cáo khi chưa đủ 5/5 bằng chứng (DR-05).

### 2.2. Quản lý vận hành (Manager)

- **Trách nhiệm chính:**
  - Lập kế hoạch và tạo nhiệm vụ kèm checklist phù hợp với từng loài cây.
  - Phân công đúng người, cân bằng tải công việc giữa các nhân viên.
  - Tra cứu nhanh thông tin cây qua mã QR khi đi tuần tra.
  - Thẩm định chuỗi bằng chứng của nhân viên một cách khách quan.
  - Phê duyệt đóng việc hoặc yêu cầu làm lại kèm lý do rõ ràng.
- **Hành động bị cấm tuyệt đối (Forbidden):**
  - Không được phê duyệt một nhiệm vụ còn thiếu bằng chứng (DR-06).
  - Không được từ chối/yêu cầu làm lại mà không cung cấp lý do (DR-07).
  - Không được thay mặt nhân viên chụp ảnh hoặc nộp thay bằng chứng từ văn phòng.

---

## 3. Mô hình điều kiện kích hoạt hành động (Action Eligibility Model)

Nguyên tắc vàng của kiến trúc NOVYX: **Quyền hạn không chỉ phụ thuộc vào Vai trò (Role)**.
Một hành động nghiệp vụ chỉ hợp lệ khi thỏa mãn công thức 4 yếu tố:

$$\text{Eligibility} = \text{Role} \land \text{Resource Scope} \land \text{Object State} \land \text{Preconditions}$$

### 3.1. Các trạng thái hiển thị của nút thao tác trên UI

1. **Khả dụng (Visible & Enabled):** Người dùng có quyền, đối tượng ở đúng trạng thái, đầy đủ điều kiện tiên quyết.
2. **Bị khóa kèm lý do (Visible & Disabled with Rationale):** Người dùng có quyền, nhưng đối tượng chưa đủ điều kiện (ví dụ: Nút "Phê duyệt" bị mờ và đổi nhãn thành "Thiếu bằng chứng" khi chưa đủ 5/5 chốt).
3. **Ẩn hoàn toàn (Hidden / Not Rendered):** Người dùng không có vai trò hoặc không thuộc phạm vi sở hữu (ví dụ: Staff không nhìn thấy nút "Giao việc" hay nút "Duyệt").

---

## 4. Ma trận điều kiện kích hoạt hành động (Action Eligibility Matrix)

| Hành động (Action)       | Tác nhân (Actor) | Tài nguyên (Resource) | Trạng thái hợp lệ (Valid States) | Điều kiện tiên quyết (Preconditions)                                    | Chuyển dịch trạng thái (Transition)      | Lý do bị chặn nếu không hợp lệ (Block Reason)        | Cơ chế kiểm soát hiện tại `[VERIFIED]`               | Cơ chế kiểm soát mục tiêu (Target)        | MVP?         |
| ------------------------ | ---------------- | --------------------- | -------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------- | ------------ |
| **Tạo nhiệm vụ mới**     | Manager          | `Task`                | _(Mới)_                          | Chọn đúng cây, chọn nhân viên hợp lệ, hạn chót tương lai, có checklist. | $\to$ `PENDING`                          | Chưa chọn cây hoặc thiếu tiêu đề / hạn chót quá khứ. | `ManagerCreateTask.tsx` (Form validation)            | Application Use Case & API Contract       | **YES**      |
| **Bắt đầu làm việc**     | Staff            | `Task`                | `PENDING`, `REWORK_REQUIRED`     | Task thuộc sở hữu của Staff (`assignedStaffId`).                        | $\to$ `IN_PROGRESS`                      | Không phải task của mình.                            | `StaffWork.tsx`                                      | Route Guard & API Guard                   | **YES**      |
| **Xác thực GPS**         | Staff            | `GpsCheck`            | `IN_PROGRESS`                    | Đã cấp quyền Location; khoảng cách tới cây $\le 10$m.                   | Ghi nhận `gpsCheck.verified = true`      | Khoảng cách $> 10$m hoặc chưa bật định vị thiết bị.  | `StaffProofFlow.tsx` (`distance <= 10`)              | Domain Service & API Gate                 | **YES**      |
| **Quét mã QR cây**       | Staff            | `QrCheck`             | `IN_PROGRESS`                    | Đã cấp quyền Camera; mã quét khớp 100% mã cây trong task.               | Ghi nhận `qrCheck.verified = true`       | Quét sai mã cây hoặc mã hỏng không đọc được.         | `StaffProofFlow.tsx` (`scannedCode === tree.qrCode`) | Domain Service & API Gate                 | **YES**      |
| **Chụp ảnh Trước**       | Staff            | `TaskEvidence`        | `IN_PROGRESS`                    | Đã cấp quyền Camera; GPS hoặc QR đã bắt đầu.                            | Ghi nhận `beforePhoto` URI               | Camera bị chiếm dụng hoặc từ chối cấp quyền.         | `StaffProofFlow.tsx`                                 | Domain Service & File Storage             | **YES**      |
| **Tích Checklist**       | Staff            | `Checklist`           | `IN_PROGRESS`                    | Phải hoàn thành thao tác thực tế tại cây.                               | Từng mục chuyển `done = true`            | Không có.                                            | `StaffProofFlow.tsx`                                 | Domain State Machine                      | **YES**      |
| **Chụp ảnh Sau**         | Staff            | `TaskEvidence`        | `IN_PROGRESS`                    | 100% mục checklist đã hoàn thành (`checklistDone === true`).            | Ghi nhận `afterPhoto` URI                | Chưa hoàn thành hết các mục checklist bắt buộc.      | `StaffProofFlow.tsx`                                 | Domain State Machine & File Storage       | **YES**      |
| **Nộp chuỗi bằng chứng** | Staff            | `Task`                | `IN_PROGRESS`                    | **Đủ 5/5 bằng chứng hợp lệ (GPS, QR, Before, Checklist, After)**.       | `IN_PROGRESS` $\to$ `WAITING_REVIEW`     | Còn ít nhất 1 chốt bằng chứng chưa đạt yêu cầu.      | `StaffProofFlow.tsx` (`getTaskProofGaps`)            | Application Use Case & API Gate           | **YES**      |
| **Tra cứu QR cây**       | Staff, Manager   | `Tree`                | Bất kỳ                           | Đã cấp quyền Camera; mã quét thuộc danh mục cây.                        | Mở chi tiết cây & lịch sử chăm sóc       | Mã không tồn tại trong hệ thống.                     | `StaffTrees.tsx`, `ManagerQrLookup.tsx`              | Application Use Case & Query API          | **YES**      |
| **Phê duyệt đóng việc**  | Manager          | `Task`                | `WAITING_REVIEW`                 | **Chuỗi bằng chứng không còn lỗ hổng (`reviewProofGaps === 0`)**.       | `WAITING_REVIEW` $\to$ `COMPLETED`       | Báo cáo còn thiếu GPS, QR hoặc ảnh Before/After.     | `ManagerReview.tsx` (`disabled`)                     | Application Use Case & API Mutation Guard | **YES**      |
| **Yêu cầu làm lại**      | Manager          | `Task`                | `WAITING_REVIEW`                 | **Bắt buộc có lý do từ chối cụ thể (`cleanRejectReason.length > 0`)**.  | `WAITING_REVIEW` $\to$ `REWORK_REQUIRED` | Chưa nhập hoặc chưa chọn lý do từ chối.              | `ManagerReview.tsx` (`rejectTouched`)                | Application Use Case & API Mutation Guard | **YES**      |
| **Mở lại task làm lại**  | Staff            | `Task`                | `REWORK_REQUIRED`                | Task thuộc sở hữu của Staff.                                            | `REWORK_REQUIRED` $\to$ `IN_PROGRESS`    | Không phải task được giao cho mình.                  | `StaffWork.tsx`                                      | Domain State Machine                      | **YES**      |
| **Sửa việc đã đóng**     | Bất kỳ           | `Task`                | `COMPLETED`                      | **KHÔNG BAO GIỜ (BỊ CẤM)**                                              | Không đổi                                | Task đã đóng vĩnh viễn (Terminal State).             | UI không render nút chỉnh sửa                        | Backend Entity Immutable Rule             | **NO (CẤM)** |
