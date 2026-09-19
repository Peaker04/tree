# NOVYX GreenOps — Domain Architecture & Canonical Model

Tài liệu này là chuẩn mực duy nhất định nghĩa **Ý NGHĨA NGHIỆP VỤ (Domain Semantics)**, cấu trúc phân rã miền (Domain Decomposition), ranh giới ngữ cảnh (Bounded Contexts), từ vựng chuẩn tắc (Ubiquitous Language), các thực thể miền (Domain Objects) và các bất biến nghiệp vụ (Business Invariants).

---

## 1. Phân rã miền nghiệp vụ (Domain Decomposition)

Dựa trên phân tích giá trị cạnh tranh cốt lõi của NOVYX, hệ thống được phân chia thành 3 phân vùng miền:

```text
+-----------------------------------------------------------------------------------+
|                           NOVYX DOMAIN LANDSCAPE                                  |
+-----------------------------------------------------------------------------------+
| [CORE DOMAIN - Lõi cạnh tranh cốt lõi]                                            |
| * Field Work Verification (Xác thực tác nghiệp hiện trường)                       |
|   Mục tiêu: Đảm bảo tính xác thực 100% về vị trí, đối tượng và kết quả can thiệp |
|   thông qua Xác thực hiện trường hai tín hiệu và 3 Hồ sơ Bằng chứng Ngữ nghĩa.   |
+-----------------------------------------------------------------------------------+
| [SUPPORTING SUBDOMAINS - Miền hỗ trợ chuyên biệt]                                 |
| * Work Management: Điều phối, giao việc, phân loại TaskType, vòng đời 7 trạng thái|
| * Tree Asset Registry: Quản lý hồ sơ cây xanh đô thị, rủi ro, Care History.     |
| * Review & Quality Control: Thẩm định 4 kết luận duyệt, xử lý làm lại có mục tiêu.|
| * Operational Notifications: Truyền tải tín hiệu biến động nghiệp vụ thời gian thực|
+-----------------------------------------------------------------------------------+
| [GENERIC SUBDOMAINS - Miền chung / Hạ tầng kỹ thuật]                              |
| * Identity & Access Control: Danh tính, phiên làm việc, phân quyền Staff/Manager. |
| * Device Hardware Services: Giao tiếp GPS, Camera, quyền thiết bị theo ngữ cảnh.  |
| * Offline Sync & Local Persistence: Bảo toàn dữ liệu ngoại tuyến, phân tách sync. |
+-----------------------------------------------------------------------------------+
```

---

## 2. Các ngữ cảnh giới hạn (Bounded Contexts)

Mỗi Bounded Context sở hữu một mô hình dữ liệu riêng, ranh giới trách nhiệm rõ ràng và giao tiếp với các ngữ cảnh khác qua các hợp đồng hoặc sự kiện xác định:

| Bounded Context               | Vai trò    | Trách nhiệm chính                                                                                                              | Mô hình sở hữu (Owned Models)                                             | Quan hệ phụ thuộc                                                                      |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Field Work Verification**   | **CORE**   | Thu thập Site Verification (QR & GPS), xử lý ngoại lệ có kiểm soát, thu thập bằng chứng theo 3 Proof Profiles, báo sự cố.      | `SiteVerification`, `TaskEvidence`, `VerificationException`, `FieldIssue` | Lắng nghe `Work Management` (`Task`), dùng `Tree Asset Registry` (`TreeId`, `QrCode`). |
| **Work Management**           | SUPPORTING | Quản lý vòng đời 7 trạng thái của nhiệm vụ; quản trị ánh xạ TaskType $\to$ ProofProfile; phân công lại và hủy việc.            | `Task`, `TaskAssignment`, `TaskType`, `ProofProfile`                      | Cung cấp nhiệm vụ cho `Field Work Verification`, nhận kết quả từ `Review & QC`.        |
| **Tree Asset Registry**       | SUPPORTING | Quản lý thông tin tài sản cây xanh, vị trí tọa độ, mã QR định danh, trạng thái sinh trưởng và Lịch sử chăm sóc chính thức.     | `Tree`, `CareHistory` _(Chỉ chiếu từ các Task `COMPLETED`)_               | Độc lập; được tra cứu bởi `Work Management` và `Verification`.                         |
| **Review & Quality Control**  | SUPPORTING | Cổng thẩm định chất lượng do Quản lý vận hành; ra 4 kết luận dứt điểm (`APPROVE`, `REQUEST_REWORK`, `EXCEPTION`, `CANCEL`).    | `ReviewAudit`, `ReviewDecision`, `ReworkRequest`                          | Đọc chuỗi bằng chứng từ `Verification`, cập nhật trạng thái sang `Work Management`.    |
| **Operational Notifications** | SUPPORTING | Phát và lưu trữ thông báo vận hành khi trạng thái công việc thay đổi hoặc phát sinh sự cố hiện trường.                         | `Notification`, `NotificationPreference`                                  | Nhận sự kiện từ `Work Management` và `Review & QC`.                                    |
| **Identity & Session**        | GENERIC    | Xác thực tài khoản, lưu trữ phiên đăng nhập và cung cấp vai trò (`Staff` hoặc `Manager`).                                      | `User`, `AuthSession`, `Role`                                             | Cung cấp danh tính cho toàn bộ hệ thống.                                               |
| **Device Hardware Adapter**   | GENERIC    | Quản lý quyền hệ điều hành (Camera, Location) và điều phối phần cứng tránh xung đột tài nguyên.                                | `DevicePermissionState`, `CameraResourceLock`                             | Cung cấp luồng dữ liệu phần cứng cho `Verification` và `Tree Registry`.                |
| **Local Persistence & Sync**  | GENERIC    | Lưu trữ bền vững ngoại tuyến, phân tách độc lập giữa trạng thái công việc (`TaskStatus`) và trạng thái đồng bộ (`SyncStatus`). | `LocalSubmissionStatus`, `DurableStore`, `OutboxQueue`                    | Đảm bảo chống mất dữ liệu khi mất mạng hoặc tắt ứng dụng.                              |

---

## 3. Từ vựng chuẩn tắc (Ubiquitous Language)

Mọi thành viên nhóm phát triển, tài liệu và mã nguồn phải sử dụng nhất quán các thuật ngữ dưới đây:

| Thuật ngữ chuẩn (Canonical Term) | Định nghĩa chuẩn trong NOVYX                                                                                                                     | Thuật ngữ trong code hiện tại `[VERIFIED]`            | Thuật ngữ trên UI `[VERIFIED]`                                       | Phân loại & Ghi chú chuẩn hóa                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Tree**                         | Thực thể cây xanh đô thị được quản lý, có tọa độ cố định và mã QR vật lý gắn cố định trên thân cây.                                              | `TreeDto`, `Tree`                                     | `Cây`, `Cây của tôi`                                                 | Thực thể tài sản trung tâm.                                           |
| **Task**                         | Một nhiệm vụ chăm sóc cây cụ thể được giao cho nhân viên, gắn với đúng một cây và một loại việc (`TaskType`).                                    | `TaskDto`, `Task`                                     | `Công việc`, `Nhiệm vụ`                                              | Chuẩn hóa thành "Công việc" trên giao diện.                           |
| **TaskType**                     | Phân loại chuyên môn của nhiệm vụ (Cắt tỉa, Bón phân, Khảo sát bệnh...). Ánh xạ tất định sang `ProofProfile` và Checklist/Findings template mẫu. | `taskType` string                                     | `Loại việc`, `Hạng mục`                                              | Quản lý chọn khi tạo việc; hệ thống suy ra ProofProfile tương ứng.    |
| **ProofProfile**                 | Hồ sơ ngữ nghĩa quy định hợp đồng bằng chứng bắt buộc: `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`.                                      | _(Chưa có - Cần thêm)_                                | _(Chưa hiển thị)_                                                    | Thay thế hoàn toàn giả thuyết 5 chốt cứng nhắc cũ.                    |
| **TaskStatus**                   | Vòng đời 7 trạng thái của nhiệm vụ: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`.          | `TaskStatus` (Thiếu BLOCKED & CANCELLED)              | `Chờ bắt đầu`, `Đang làm`, `Tạm dừng`, `Chờ duyệt`, `Cần làm lại...` | Độc lập hoàn toàn với `SyncStatus` và `ProofProgress`.                |
| **SiteVerification**             | Xác thực hiện trường gồm hai tín hiệu độc lập: Định danh cây qua QR và Vị trí qua GPS ($\le 10$m). Thu thập thứ tự tùy chọn.                     | `GpsCheckDto`, `QrCheckDto`                           | `Xác thực hiện trường`, `GPS & Mã QR`                                | Không làm thay đổi `TaskStatus`.                                      |
| **VerificationException**        | Cờ ngoại lệ có kiểm soát khi gặp sự cố khách quan: `LOCATION_EXCEPTION`, `IDENTITY_EXCEPTION`, `EVIDENCE_INTEGRITY_EXCEPTION`.                   | _(Chưa có - Cần thêm)_                                | `Ngoại lệ vị trí`, `Ngoại lệ danh tính`                              | Cho phép tiếp tục luồng nhưng bắt buộc giải trình để Quản lý hậu kiểm |
| **FieldIssue**                   | Báo cáo sự cố hiện trường do nhân viên gửi khi bị cản trở không thể thi công $\to$ đưa task sang `BLOCKED`.                                      | _(Chưa có - Cần thêm)_                                | `Báo cáo sự cố`, `Tạm dừng việc`                                     | Sự cố có ảnh chụp, mô tả và lý do cản trở thực địa.                   |
| **ReviewDecision**               | Quyết định thẩm định của Quản lý tại `WAITING_REVIEW`: `APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, `CANCEL`.                          | `ReviewDecisionRequest` (`approve`, `request_rework`) | `Phê duyệt`, `Yêu cầu làm lại`, `Nghiệm thu ngoại lệ`, `Hủy việc`    | Bổ sung `APPROVE_WITH_EXCEPTION` và `CANCEL`.                         |
| **Targeted Rework**              | Làm lại có mục tiêu: Quản lý chỉ định rõ khâu bằng chứng sai sót; hệ thống bảo lưu bằng chứng hợp lệ cũ và lưu vết lịch sử nhiều phiên bản.      | `rejectReason`, `rejectChips`                         | `Yêu cầu làm lại`, `Sửa bằng chứng`                                  | Không bao giờ xóa sạch toàn bộ bằng chứng cũ.                         |
| **CareHistory**                  | Bản chiếu lịch sử chăm sóc chính thức của cây. **CHỈ SINH RA KHI TASK ĐẠT `COMPLETED`**. Bảo lưu cờ ngoại lệ nếu có.                             | `CareHistoryDto`                                      | `Lịch sử chăm sóc`                                                   | Task bị Hủy hoặc chưa hoàn thành tuyệt đối không vào Care History.    |
| **SyncStatus**                   | Trạng thái đồng bộ mạng: `SYNCED`, `PENDING_SYNC`, `SYNC_FAILED`.                                                                                | _(Chưa phân tách độc lập)_                            | `Đã đồng bộ`, `Chờ gửi`, `Lỗi gửi`                                   | Tách biệt hoàn toàn với `TaskStatus`.                                 |

---

## 4. Mô hình thực thể miền (Domain Object Model)

Phân định rạch ròi: **Mô hình miền (Domain Model) $\ne$ Dữ liệu truyền tải (DTO)**.

```text
+---------------------+           1..*          +-----------------------------------+
|        Tree         | <---------------------- |               Task                |
| (Root Aggregate)    |                         |         (Root Aggregate)          |
+---------------------+                         +-----------------------------------+
  - id: TreeId                                    - id: TaskId
  - qrCode: QrCodeString (Immutable)              - treeId: TreeId (Immutable)
  - location: Coordinates (Immutable)             - taskType: TaskType
  - healthStatus: HealthStatus                    - proofProfile: ProofProfile
  - riskStatus: RiskStatus                        - assignedStaffId: StaffId
  - careHistory: CareHistory[] (Proj)             - status: TaskStatus (7 states)
                                                  - deadline: IsoDateTime
                                                  - siteVerification: SiteVerification
                                                  - proofProgress: ProofProgress
                                                  - evidenceHistory: TaskEvidenceAttempt[]
                                                  - fieldIssue: FieldIssue?
                                                  - reviewAudit: ReviewAudit?
                                                            |
                                                            | 1
                                                            v 1
                                                +-----------------------------------+
                                                |         SiteVerification          |
                                                |           (Value Object)          |
                                                +-----------------------------------+
                                                  - qrVerification: QrVerification
                                                  - locationVerification: LocationVerification
                                                  - identityException: IdentityException?
                                                  - locationException: LocationException?
```

### 4.1. Chi tiết thực thể và Ranh giới sở hữu

#### A. Thực thể Cây xanh (Tree Aggregate)

- **Định danh:** `TreeId` (duy nhất toàn hệ thống, ví dụ `TREE-01`).
- **Trường bất biến:** `id`, `qrCode`, `lat`, `lng`. Tọa độ và mã QR không được tự ý sửa đổi trong các thao tác bảo dưỡng thường nhật.
- **Trường khả biến:** `healthStatus`, `riskStatus`.
- **Tính toán dẫn xuất:** `careHistory` là bản chiếu (Read-only Projection) tập hợp từ các `Task` có trạng thái `COMPLETED` gắn với cây này.

#### B. Thực thể Nhiệm vụ (Task Aggregate)

- **Định danh:** `TaskId` (ví dụ `TSK-01`).
- **Tính chất liên kết:** Gắn cố định với đúng một `TreeId` và một `TaskType`. Cây mục tiêu **bất biến trong suốt quá trình thực thi**.
- **Quản trị ProofProfile:** `taskType` xác định tất định `proofProfile` (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`). Quản lý không được tùy tiện hạ cấp hồ sơ bằng chứng.
- **Lịch sử bằng chứng đa phiên bản (Versioned Evidence):** `evidenceHistory` lưu vết từng lần nộp (`Attempt 1`, `Attempt 2`), không ghi đè dữ liệu cũ.

#### C. Đối tượng Bằng chứng (TaskEvidence Value Object)

- **Đặc điểm:** Bất biến (Immutable). Một khi đã chụp và nộp, bằng chứng gắn liền với thời điểm (`capturedAt`), người chụp (`capturedByUserId`), tọa độ lúc chụp, và phiên bản nộp (`attemptNumber`).
- **Phân loại theo Profile:**
  - `CHANGE_PROOF`: Cần `beforePhoto`, `checklist`, `afterPhoto`.
  - `SERVICE_PROOF`: Cần `checklist`, `completionPhoto`.
  - `INSPECTION_PROOF`: Cần `structuredFindings`, `conditionPhotos[]`.

---

## 5. Phân loại quy tắc nghiệp vụ chuẩn tắc (Business Rule Classification)

Mọi quy tắc nghiệp vụ trong NOVYX GreenOps được phân loại nghiêm ngặt theo 6 tầng giá trị:

```text
+-----------------------------------------------------------------------------------+
|                        BUSINESS RULE CLASSIFICATION                               |
+-----------------------------------------------------------------------------------+
| 1. HARD DOMAIN INVARIANT   | Bất biến miền cứng, cấm vi phạm trong mọi hoàn cảnh  |
| 2. MVP DOMAIN INVARIANT    | Bất biến miền cốt lõi của phạm vi MVP hiện tại       |
| 3. MVP POLICY              | Chính sách vận hành đã chốt cho MVP (có thể mở rộng) |
| 4. SOFT CONTROL            | Cơ chế kiểm soát mềm / Đường phục hồi có hướng dẫn   |
| 5. OPERATIONAL GUIDANCE    | Hướng dẫn thao tác tối ưu ngoài hiện trường          |
| 6. TECHNICAL CONSTRAINT    | Ràng buộc kiến trúc kỹ thuật & nền tảng phần cứng    |
+-----------------------------------------------------------------------------------+
```

### 5.1. Bất biến miền cứng (HARD DOMAIN INVARIANT)

| Mã quy tắc     | Tên quy tắc / Nội dung bất biến                                                                                                                                                                 | Hành vi khi vi phạm (Violation Behavior)                                                                                                               |
| :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DR-HARD-01** | **Bất biến cây mục tiêu (Task Tree Immutability):** Cây mục tiêu gắn với Task là cố định tuyệt đối trong suốt vòng đời. Nhân viên không được phép chuyển việc sang cây khác.                    | Chặn mọi thao tác đổi `treeId`. Nếu quét sai cây, báo lỗi sai đối tượng và yêu cầu quét lại đúng cây được giao.                                        |
| **DR-HARD-02** | **Phân tách thực thi và thẩm định (Separation of Execution and Approval):** Nhân viên thực hiện không bao giờ được tự duyệt công việc của chính mình.                                           | Giao diện Staff không có nút Duyệt; API từ chối nếu `reviewerId === assignedStaffId`.                                                                  |
| **DR-HARD-03** | **Bảo toàn quyền tác giả bằng chứng lịch sử (Evidence Authorship Preservation):** Khi phân công lại task (Reassign), toàn bộ bằng chứng do nhân viên cũ tạo ra phải giữ nguyên tác giả ban đầu. | Hệ thống cấm ghi đè trường `capturedByUserId` của các bản ghi bằng chứng cũ.                                                                           |
| **DR-HARD-04** | **Cấm ngụy tạo bằng chứng lịch sử (No Evidence Fabrication):** Bằng chứng lịch sử không thể tái tạo trung thực (ví dụ quên chụp ảnh Trước mà cây đã cắt tỉa xong) tuyệt đối không được làm giả. | Bắt buộc ghi nhận `EVIDENCE_INTEGRITY_EXCEPTION` để Quản lý xem xét chấp thuận ngoại lệ hoặc xử lý kỷ luật.                                            |
| **DR-HARD-05** | **Bất biến của trạng thái đóng (Terminal State Immutability):** Nhiệm vụ đã ở trạng thái `COMPLETED` hoặc `CANCELLED` là đóng vĩnh viễn, không thể mở lại hoặc sửa đổi dữ liệu.                 | Chặn mọi lệnh sửa đổi (Mutation Commands); toàn bộ giao diện chuyển sang chế độ xem (Read-only).                                                       |
| **DR-HARD-06** | **Cấm phân công lại trực tiếp khi đang làm hoặc chờ duyệt:** Không được đổi người khi task đang `IN_PROGRESS` hoặc `WAITING_REVIEW`.                                                            | Nút Phân công lại bị ẩn/khóa. Muốn đổi người ở `IN_PROGRESS`, bắt buộc phải qua `ReportFieldIssue` $\to$ `BLOCKED` $\to$ `Reassign`.                   |
| **DR-HARD-07** | **Biên giới Lịch sử chăm sóc (Care History Boundary):** CHỈ nhiệm vụ có trạng thái `COMPLETED` mới được sinh bản ghi Lịch sử chăm sóc chính thức cho cây.                                       | Các trạng thái khác (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `CANCELLED`) không bao giờ được chiếu vào Care History. |

### 5.2. Bất biến miền MVP (MVP DOMAIN INVARIANT)

| Mã quy tắc    | Tên quy tắc / Nội dung bất biến                                                                                                                                                                             | Hành vi khi vi phạm                                                                                                 |
| :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **DR-MVP-01** | **Một việc gắn đúng một cây (One Task = One Tree):** Mỗi nhiệm vụ chỉ thao tác trên duy nhất 1 thực thể cây xanh đô thị.                                                                                    | Không hỗ trợ gộp nhiều cây vào một task trong phiên bản MVP.                                                        |
| **DR-MVP-02** | **Quản trị TaskType $\to$ ProofProfile:** `TaskType` xác định tất định `ProofProfile` và hợp đồng bằng chứng bắt buộc. Quản lý không được tùy tiện hạ cấp ProofProfile của từng task.                       | Hệ thống tự động gán ProofProfile khi tạo task; trường ProofProfile bị khóa đối với chỉnh sửa thủ công của Quản lý. |
| **DR-MVP-03** | **Vòng đời 7 trạng thái tất định:** Vòng đời Task gồm đúng 7 trạng thái: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`.                                | Không đưa thêm bất kỳ trạng thái lai ghép nào (`OFFLINE_SUBMITTED`, `COMPLETED_WITH_EXCEPTION`...) vào TaskStatus.  |
| **DR-MVP-04** | **Khởi đầu thực địa tất định:** DUY NHẤT hành động Nhân viên bấm `StartTask` mới chuyển `PENDING` $\to$ `IN_PROGRESS`.                                                                                      | Mở xem chi tiết, quét QR, đo GPS hay thao tác thử nghiệm không làm thay đổi trạng thái nhiệm vụ.                    |
| **DR-MVP-05** | **Đình chỉ phi kết thúc (Non-terminal BLOCKED):** `BLOCKED` là trạng thái tạm dừng khi gặp sự cố, chỉ vào từ `IN_PROGRESS` qua `ReportFieldIssue`, chỉ ra qua 3 lối thoát (`RESUME`, `REASSIGN`, `CANCEL`). | Nhân viên không thể tự hủy việc khi bị chặn; Quản lý là người thẩm quyền quyết định 1 trong 3 lối thoát.            |
| **DR-MVP-06** | **Bốn kết luận duyệt tại WAITING_REVIEW:** Quản lý chỉ có đúng 4 kết luận: `APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, `CANCEL`.                                                                 | Cung cấp đúng 4 hành động nghiệp vụ tại màn hình thẩm định của Quản lý.                                             |

### 5.3. Chính sách vận hành MVP (MVP POLICY)

| Mã quy tắc    | Tên chính sách / Nội dung                                                                                                                                                                                          | Cơ chế thực thi                                                                                   |
| :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| **DR-POL-01** | **Thẩm định 100% hồ sơ:** Quản lý thẩm định 100% nhiệm vụ được nộp trước khi đóng việc; không áp dụng tự động duyệt (Auto-approval) trong MVP.                                                                     | Toàn bộ nhiệm vụ nộp đều chuyển vào hàng đợi `WAITING_REVIEW` của Quản lý.                        |
| **DR-POL-02** | **Tiêu chuẩn mục tiêu khoảng cách GPS $\le 10$m:** Tiêu chuẩn xác thực vị trí là sai lệch không quá 10 mét. Không tồn tại ngưỡng phụ 25m.                                                                          | Hiển thị thước đo khoảng cách; nếu vượt quá 10m yêu cầu nhân viên di chuyển lại gần hoặc thử lại. |
| **DR-POL-03** | **Làm lại có mục tiêu (Targeted Rework):** Yêu cầu làm lại bắt buộc chỉ rõ khâu sai sót (`rejectReason` & `targetedField`); bảo lưu toàn bộ bằng chứng hợp lệ cũ.                                                  | Giao diện làm lại của Staff chỉ mở đúng khâu bị từ chối; không bắt thu thập lại toàn bộ từ đầu.   |
| **DR-POL-04** | **Hủy việc có lý do bắt buộc (Mandatory Cancellation Reason):** Quản lý có thể hủy việc từ bất kỳ trạng thái chưa đóng nào, nhưng bắt buộc nhập lý do, lưu vết người hủy và thời điểm.                             | Nút Hủy việc mở hộp thoại bắt buộc nhập lý do; không hỗ trợ xóa cứng (Hard Delete).               |
| **DR-POL-05** | **Nghiệm thu có ngoại lệ (Approve with Exception):** Chỉ áp dụng khi công việc thực tế đã làm đạt chuẩn nhưng có lỗi định vị/danh tính/bằng chứng không thể tái tạo; Quản lý chịu trách nhiệm phê duyệt kèm lý do. | Sinh bản ghi Care History mang cờ `HAS_EXCEPTION` kèm tham chiếu lý do của Quản lý.               |

### 5.4. Cơ chế kiểm soát mềm (SOFT CONTROL)

| Mã quy tắc     | Tên cơ chế / Nội dung                                                                                                                                                      | Cơ chế thực thi                                                                                           |
| :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **DR-SOFT-01** | **Ngoại lệ vị trí có kiểm soát (`LOCATION_EXCEPTION`):** Sau khi Staff bấm thử lại GPS bất thành do tán lá rậm/nhà cao tầng, cho phép gửi giải trình để Quản lý hậu kiểm.  | Gắn cờ ngoại lệ vị trí vào Task; không coi ngoại lệ là xác thực GPS thành công thông thường.              |
| **DR-SOFT-02** | **Ngoại lệ danh tính có kiểm soát (`IDENTITY_EXCEPTION`):** Khi tem QR bị rách/mờ/mất, cho phép chụp ảnh tem hỏng và nhập mã số thủ công đối chiếu với đúng cây được giao. | Gắn cờ ngoại lệ danh tính; mã nhập tay chỉ được đối chiếu với cây của task, không được đổi sang cây khác. |

### 5.5. Hướng dẫn thao tác vận hành (OPERATIONAL GUIDANCE)

| Mã quy tắc      | Tên hướng dẫn / Nội dung                                                                                                                          | Khuyến nghị vận hành                                                                |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------- |
| **DR-GUIDE-01** | **Thứ tự thu thập Site Verification linh hoạt:** Quét QR và lấy tọa độ GPS có thể thực hiện theo bất kỳ thứ tự nào.                               | Công nhân có thể quét mã QR ngay khi đến gốc cây mà không cần chờ chip GPS ổn định. |
| **DR-GUIDE-02** | **Xử lý GPS yếu ngoài thực địa:** Nhân viên nên di chuyển ra khỏi vùng tán cây rậm rạp hoặc giơ cao thiết bị trước khi kích hoạt ngoại lệ vị trí. | Giúp giảm thiểu số lượng giải trình ngoại lệ không cần thiết cho Quản lý.           |

### 5.6. Ràng buộc kỹ thuật nền tảng (TECHNICAL CONSTRAINT)

| Mã quy tắc     | Tên ràng buộc / Nội dung                                                                                                                                                                                                      | Ràng buộc kiến trúc                                                                       |
| :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **DR-TECH-01** | **Phân tách độc lập giữa TaskStatus và SyncStatus:** Nộp khi mất mạng đặt `LocalSubmissionStatus = PENDING_SYNC`; trên server `TaskStatus` vẫn giữ nguyên `IN_PROGRESS` cho đến khi đồng bộ thành công sang `WAITING_REVIEW`. | Không đưa các trạng thái trung gian mạng (`OFFLINE_SUBMITTED`) vào enum `TaskStatus`.     |
| **DR-TECH-02** | **Độc quyền tài nguyên phần cứng Camera:** Tại một thời điểm, chỉ một thành phần giao diện được quyền sở hữu `CameraView` (`activeCameraPurpose`).                                                                            | Tránh hiện tượng tranh chấp luồng camera dẫn đến sập ứng dụng (Crash).                    |
| **DR-TECH-03** | **Ảo hóa danh sách hiển thị:** Mọi danh sách dữ liệu có khả năng tăng trưởng (Danh sách Task, Danh mục Cây) bắt buộc dùng `FlatList` với key ổn định.                                                                         | Nghiêm cấm dùng `ScrollView` kết hợp hàm `map()` gây tràn bộ nhớ trên máy Android giá rẻ. |
