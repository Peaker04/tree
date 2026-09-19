# NOVYX GreenOps — Access Control, Actor Model & Action Eligibility

Tài liệu này là chuẩn mực duy nhất định nghĩa **MÔ HÌNH TÁC NHÂN (Actor Model)**, **QUYỀN HẠN & TRÁCH NHIỆM (Role & Responsibility)** và **MA TRẬN ĐIỀU KIỆN KÍCH HOẠT HÀNH ĐỘNG (Action Eligibility Matrix)**.

---

## 1. Sổ đăng ký tác nhân (Actor Registry)

Trong NOVYX GreenOps, quyền hạn không được gán ghép tùy tiện. Hệ thống phân loại chính thức các tác nhân:

| Tác nhân (Actor)                  | Trạng thái MVP            | Định danh trong Hợp đồng `[VERIFIED]`              | Phạm vi dữ liệu đọc (Readable Scope)                                                                                                                           | Phạm vi dữ liệu ghi (Writable Scope)                                                                                                                                                                                                          | Mục đích vận hành                                                                                               |
| :-------------------------------- | :------------------------ | :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Nhân viên hiện trường (Staff)** | **CURRENT MVP**           | `Role = 'Staff'`, `UserRole = 'staff'`, `StaffDto` | Chỉ các cây được giao, chỉ các nhiệm vụ được phân công (`assignedStaffId === user.id`), thông báo cá nhân, lịch sử chăm sóc cây liên quan.                     | Bấm bắt đầu (`StartTask`), quét QR, đo GPS, báo ngoại lệ, chụp ảnh bằng chứng, tích checklist, báo sự cố (`ReportFieldIssue`), nộp duyệt (`SubmitTaskEvidence`), bổ sung làm lại.                                                             | Thực thi công tác chăm sóc cây ngoài thực địa và thu thập chuỗi bằng chứng xác thực theo ProofProfile.          |
| **Quản lý vận hành (Manager)**    | **CURRENT MVP**           | `Role = 'Manager'`, `UserRole = 'manager'`         | Toàn bộ danh mục cây đô thị, toàn bộ danh sách nhiệm vụ toàn tuyến, danh sách nhân viên, sự cố `BLOCKED`, hàng đợi duyệt `WAITING_REVIEW`, thông báo vận hành. | Tạo nhiệm vụ mới, phân công nhân viên, đổi người (`Reassign`), hủy việc (`CancelTask`), giải tỏa sự cố `BLOCKED` (Resume/Reassign/Cancel), phê duyệt (`Approve`), duyệt ngoại lệ (`ApproveWithException`), yêu cầu làm lại (`RequestRework`). | Điều phối nguồn lực, giám sát tiến độ toàn tuyến, xử lý ách tắc hiện trường và thẩm định chất lượng bằng chứng. |
| **Quản trị hệ thống (Admin)**     | **OUT OF MVP / RESERVED** | `UserRole = 'admin'`                               | Toàn bộ hệ thống, cấu hình tham số, nhật ký kiểm toán (Audit Logs), người dùng và phân quyền.                                                                  | Khởi tạo tài khoản, phân quyền, cấu hình danh mục cây, mở khóa nghiệp vụ đặc biệt (Break-glass).                                                                                                                                              | Quản trị nền tảng đô thị thông minh. **Tuyệt đối không tạo màn hình hoặc tính năng Admin trong phạm vi MVP**.   |
| **Hệ thống tự động (System)**     | **TECHNICAL ACTOR**       | `System`                                           | Trạng thái cảm biến thiết bị, bộ đệm ngoại tuyến, token phiên.                                                                                                 | Tự động đồng bộ cache, kiểm soát quyền camera/vị trí, làm mới token, đẩy hàng đợi Outbox.                                                                                                                                                     | Điều phối kỹ thuật nền tảng và bảo toàn dữ liệu.                                                                |

---

## 2. Mô hình Vai trò — Trách nhiệm — Ranh giới cấm (Role & Responsibility)

### 2.1. Nhân viên hiện trường (Staff)

- **Trách nhiệm chính:**
  - Tiếp nhận nhiệm vụ trong hàng đợi cá nhân và chủ động bấm `StartTask`.
  - Đến đúng vị trí thực địa, thực hiện Site Verification (quét QR và đo GPS $\le 10$m).
  - Thu thập đầy đủ bằng chứng theo đúng hợp đồng của `ProofProfile` được giao.
  - Báo cáo trung thực sự cố hiện trường (`ReportFieldIssue`) khi gặp trở ngại bất khả kháng.
  - Nộp báo cáo nghiệm thu đúng hạn; khắc phục đúng khâu bị Quản lý yêu cầu làm lại.
- **Hành động bị cấm tuyệt đối (Forbidden):**
  - **CẤM tự phê duyệt nhiệm vụ của chính mình (DR-HARD-02).**
  - CẤM tự tạo nhiệm vụ mới hoặc tự ý phân công lại task cho người khác.
  - CẤM chuyển đổi nhiệm vụ sang cây khác (DR-HARD-01: Cây mục tiêu là bất biến).
  - CẤM ngụy tạo bằng chứng lịch sử không thể tái tạo (DR-HARD-04).
  - CẤM nộp hồ sơ khi chưa đủ hợp đồng bằng chứng theo ProofProfile.

### 2.2. Quản lý vận hành (Manager)

- **Trách nhiệm chính:**
  - Tạo nhiệm vụ gắn đúng cây và chọn `TaskType` phù hợp để hệ thống xác định `ProofProfile`.
  - Phân công đúng người, cân bằng tải công việc giữa các nhân viên.
  - Xử lý các sự cố hiện trường `BLOCKED` một cách nhanh chóng (tiếp tục, đổi người, hoặc hủy).
  - Thẩm định 100% hồ sơ nộp dựa trên bằng chứng khách quan.
  - Ra quyết định chuẩn xác: Phê duyệt đạt chuẩn, Phê duyệt có ngoại lệ (kèm lý do), hoặc Yêu cầu làm lại có mục tiêu.
- **Hành động bị cấm tuyệt đối (Forbidden):**
  - CẤM tùy tiện hạ cấp `ProofProfile` của một nhiệm vụ riêng lẻ (DR-MVP-02).
  - CẤM phân công lại trực tiếp khi task đang `IN_PROGRESS` hoặc `WAITING_REVIEW` (DR-HARD-06).
  - CẤM phê duyệt nhiệm vụ còn thiếu bằng chứng bắt buộc mà không qua luồng ngoại lệ có lý do.
  - CẤM yêu cầu làm lại mà không chỉ rõ khâu sai sót và không có lý do cụ thể (DR-POL-03).
  - CẤM hủy nhiệm vụ mà không nhập lý do bắt buộc (DR-POL-04).
  - CẤM sửa đổi dữ liệu của nhiệm vụ đã ở trạng thái `COMPLETED` hoặc `CANCELLED` (DR-HARD-05).

---

## 3. Mô hình điều kiện kích hoạt hành động (Action Eligibility Model)

Một hành động nghiệp vụ chỉ hợp lệ khi thỏa mãn công thức 4 yếu tố:

$$\text{Action Eligibility} = \text{Role} \land \text{Resource Scope} \land \text{Task State} \land \text{Preconditions}$$

### 3.1. Các trạng thái hiển thị của nút thao tác trên UI

1. **Khả dụng (Visible & Enabled):** Người dùng có vai trò hợp lệ, đối tượng thuộc phạm vi sở hữu, ở đúng trạng thái nghiệp vụ và thỏa mãn 100% điều kiện tiên quyết.
2. **Bị khóa kèm lý do (Visible & Disabled with Rationale):** Người dùng có quyền, nhưng điều kiện tiên quyết chưa đạt (ví dụ: Nút "Gửi duyệt" bị mờ và hiển thị "Thiếu ảnh sau" khi chưa chụp đủ bằng chứng theo hồ sơ).
3. **Ẩn hoàn toàn (Hidden / Not Rendered):** Người dùng không có vai trò hoặc hành động bị cấm ở trạng thái hiện tại (ví dụ: Staff không nhìn thấy nút "Phê duyệt" hay "Hủy việc").

---

## 4. Ma trận điều kiện kích hoạt hành động chuẩn tắc (Canonical Action Eligibility Matrix)

| Hành động (Action)               | Tác nhân (Actor) | Tài nguyên (Resource) | Trạng thái hợp lệ (Valid States)                                         | Điều kiện tiên quyết (Preconditions)                                                 | Chuyển dịch trạng thái (Transition)    | Lý do bị chặn nếu không hợp lệ (Block Reason)                            | Cơ chế kiểm soát mục tiêu (Target Gate)  | MVP?         |
| :------------------------------- | :--------------- | :-------------------- | :----------------------------------------------------------------------- | :----------------------------------------------------------------------------------- | :------------------------------------- | :----------------------------------------------------------------------- | :--------------------------------------- | :----------- |
| **Tạo nhiệm vụ mới**             | Manager          | `Task`                | _(Khởi tạo)_                                                             | Chọn đúng cây, chọn nhân viên hợp lệ, chọn `TaskType`, hạn chót tương lai.           | $\to$ `PENDING`                        | Thiếu thông tin bắt buộc hoặc hạn chót trong quá khứ.                    | Application Use Case & Form Guard        | **YES**      |
| **Phân công lại ở PENDING**      | Manager          | `Task`                | `PENDING`                                                                | Chọn nhân viên mới khác nhân viên cũ.                                                | Giữ `PENDING`                          | Chưa chọn nhân viên mới hoặc chọn trùng nhân viên hiện tại.              | Application Use Case & State Guard       | **YES**      |
| **Hủy nhiệm vụ (Cancel)**        | Manager          | `Task`                | `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED` | Bắt buộc nhập lý do hủy (`cancelReason`).                                            | $\to$ `CANCELLED`                      | Lý do hủy rỗng hoặc task đã ở trạng thái đóng (`COMPLETED`/`CANCELLED`). | Domain Mutation Guard & Audit Service    | **YES**      |
| **Bắt đầu làm việc (StartTask)** | Staff            | `Task`                | `PENDING`                                                                | Task thuộc sở hữu của Staff (`assignedStaffId === user.id`).                         | $\to$ `IN_PROGRESS`                    | Không phải task của mình hoặc task chưa ở trạng thái PENDING.            | Route Guard & Domain Transition Guard    | **YES**      |
| **Xác thực GPS**                 | Staff            | `SiteVerification`    | `IN_PROGRESS`                                                            | Quyền Location granted; khoảng cách tới gốc cây $\le 10$m.                           | Ghi nhận `gpsVerified = true`          | Khoảng cách $> 10$m hoặc chưa cấp quyền định vị.                         | Device Hardware Adapter & Location Guard | **YES**      |
| **Báo ngoại lệ GPS**             | Staff            | `SiteVerification`    | `IN_PROGRESS`                                                            | Đã thử lại GPS bất thành; khoảng cách $> 10$m; có lý do giải trình.                  | Ghi nhận `LOCATION_EXCEPTION`          | Chưa thử lại đo GPS hoặc lý do rỗng.                                     | Site Verification Domain Service         | **YES**      |
| **Quét mã QR cây**               | Staff            | `SiteVerification`    | `IN_PROGRESS`                                                            | Quyền Camera granted; mã quét khớp 100% với cây của task.                            | Ghi nhận `qrVerified = true`           | Quét sai mã cây hoặc mã hỏng không đọc được.                             | Site Verification Domain Service         | **YES**      |
| **Báo ngoại lệ tem QR**          | Staff            | `SiteVerification`    | `IN_PROGRESS`                                                            | Tem QR bị mờ/rách/mất; chụp ảnh tem hỏng + nhập lý do đối chiếu.                     | Ghi nhận `IDENTITY_EXCEPTION`          | Thiếu ảnh chụp tem hỏng hoặc cố tình đổi sang cây khác.                  | Site Verification Domain Service         | **YES**      |
| **Thu thập bằng chứng (Proof)**  | Staff            | `TaskEvidence`        | `IN_PROGRESS`                                                            | Thu thập theo đúng `ProofProfile` (Ảnh Trước/Sau, Checklist, hoặc Findings).         | Thêm bản ghi `TaskEvidence`            | Chụp mờ, thiếu ảnh hoặc checklist chưa tích đủ.                          | Proof Acquisition Domain Service         | **YES**      |
| **Báo sự cố hiện trường**        | Staff            | `FieldIssue`          | `IN_PROGRESS`                                                            | Gặp chướng ngại vật ngoài ý muốn; có ảnh chụp sự cố + lý do mô tả.                   | $\to$ `BLOCKED`                        | Chưa chụp ảnh sự cố hoặc mô tả lý do rỗng.                               | Application Use Case & Transition Guard  | **YES**      |
| **Giải tỏa sự cố — Tiếp tục**    | Manager          | `Task`                | `BLOCKED`                                                                | Sự cố đã được xử lý ngoài thực địa; cho phép Staff tiếp tục.                         | $\to$ `IN_PROGRESS`                    | Task không ở trạng thái BLOCKED.                                         | Manager Resolution Use Case              | **YES**      |
| **Giải tỏa sự cố — Đổi người**   | Manager          | `Task`                | `BLOCKED`                                                                | Đổi nhân viên thực hiện mới; bảo toàn tác giả bằng chứng cũ.                         | $\to$ `PENDING`                        | Chưa chọn nhân viên mới.                                                 | Manager Resolution Use Case              | **YES**      |
| **Giải tỏa sự cố — Hủy việc**    | Manager          | `Task`                | `BLOCKED`                                                                | Sự cố bất khả kháng; bắt buộc có lý do hủy.                                          | $\to$ `CANCELLED`                      | Lý do hủy rỗng.                                                          | Manager Resolution Use Case              | **YES**      |
| **Nộp chuỗi bằng chứng**         | Staff            | `Task`                | `IN_PROGRESS`                                                            | **Đủ 100% bằng chứng theo ProofProfile** (hoặc ngoại lệ được ghi nhận).              | $\to$ `WAITING_REVIEW`                 | Còn thiếu bằng chứng bắt buộc chưa hoàn thành.                           | Proof Gate & Application Use Case        | **YES**      |
| **Phê duyệt chuẩn (Approve)**    | Manager          | `Task`                | `WAITING_REVIEW`                                                         | **100% bằng chứng và xác thực đạt chuẩn, không có lỗi**.                             | $\to$ `COMPLETED`                      | Hồ sơ còn lỗ hổng chưa được xử lý.                                       | Manager Review Audit Gate                | **YES**      |
| **Duyệt có ngoại lệ**            | Manager          | `Task`                | `WAITING_REVIEW`                                                         | Việc đã làm thật, có ngoại lệ không thể tái tạo; Quản lý chịu trách nhiệm kèm lý do. | $\to$ `COMPLETED` _(Cờ HAS_EXCEPTION)_ | Lý do ngoại lệ rỗng hoặc phát hiện gian lận.                             | Manager Review Audit Gate                | **YES**      |
| **Yêu cầu làm lại (Rework)**     | Manager          | `Task`                | `WAITING_REVIEW`                                                         | Phát hiện sai sót; **chỉ rõ khâu sai sót (`targetedArea`) + nhập lý do**.            | $\to$ `REWORK_REQUIRED`                | Chưa chỉ rõ khâu cần sửa hoặc lý do từ chối rỗng.                        | Manager Review Audit Gate                | **YES**      |
| **Nộp lại khâu làm lại**         | Staff            | `Task`                | `REWORK_REQUIRED`                                                        | Task thuộc sở hữu Staff; đã sửa đúng khâu bị từ chối.                                | $\to$ `WAITING_REVIEW`                 | Khâu bị từ chối vẫn chưa được bổ sung hợp lệ.                            | Targeted Rework Use Case                 | **YES**      |
| **Tra cứu nhanh QR cây**         | Staff, Manager   | `Tree`                | Bất kỳ                                                                   | Đã cấp quyền Camera; mã quét thuộc danh mục quản lý.                                 | Xem thông tin cây & Care History       | Mã không tồn tại trong hệ thống.                                         | Query Use Case                           | **YES**      |
| **Phân công lại khi đang làm**   | Manager          | `Task`                | `IN_PROGRESS`                                                            | **BỊ CẤM TUYỆT ĐỐI (DR-HARD-06)**                                                    | Không đổi                              | Phải qua `ReportFieldIssue` $\to$ `BLOCKED` $\to$ `Reassign`.            | State Machine Transition Guard           | **NO (CẤM)** |
| **Nhân viên tự duyệt việc**      | Staff            | `Task`                | `WAITING_REVIEW`                                                         | **BỊ CẤM TUYỆT ĐỐI (DR-HARD-02)**                                                    | Không đổi                              | Nhân viên không có quyền thẩm định việc của mình.                        | Authorization Guard                      | **NO (CẤM)** |
| **Sửa đổi việc đã đóng**         | Bất kỳ           | `Task`                | `COMPLETED`, `CANCELLED`                                                 | **BỊ CẤM TUYỆT ĐỐI (DR-HARD-05)**                                                    | Không đổi                              | Nhiệm vụ đã đóng vĩnh viễn (Terminal State).                             | Domain Aggregate Immutability Guard      | **NO (CẤM)** |
