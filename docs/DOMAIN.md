# NOVYX GreenOps — Domain Architecture & Canonical Model

Tài liệu này là chuẩn mực duy nhất định nghĩa **Ý NGHĨA NGHIỆP VỤ (Domain Semantics)**, cấu trúc phân rã miền (Domain Decomposition), ranh giới ngữ cảnh (Bounded Contexts), từ vựng chuẩn tắc (Ubiquitous Language), các thực thể miền (Domain Objects) và các bất biến kinh doanh (Business Invariants).

---

## 1. Phân rã miền nghiệp vụ (Domain Decomposition)

Dựa trên phân tích giá trị cạnh tranh cốt lõi của NOVYX, hệ thống được chia thành 3 phân vùng miền:

```text
+-----------------------------------------------------------------------------------+
|                           NOVYX DOMAIN LANDSCAPE                                  |
+-----------------------------------------------------------------------------------+
| [CORE DOMAIN - Lõi cạnh tranh]                                                    |
| * Field Work Verification (Xác thực tác nghiệp hiện trường)                       |
|   Mục tiêu: Đảm bảo tính xác thực 100% về vị trí, đối tượng và kết quả can thiệp. |
+-----------------------------------------------------------------------------------+
| [SUPPORTING SUBDOMAINS - Miền hỗ trợ chuyên biệt]                                 |
| * Work Management: Điều phối, giao việc, quản lý vòng đời nhiệm vụ.               |
| * Tree Asset Registry: Danh mục tài sản cây xanh đô thị, rủi ro, hồ sơ lịch sử.   |
| * Review & Quality Control: Thẩm định bằng chứng, phê duyệt hoặc yêu cầu làm lại. |
| * Operational Notifications: Truyền tải tín hiệu biến động nghiệp vụ.            |
+-----------------------------------------------------------------------------------+
| [GENERIC SUBDOMAINS - Miền chung / Hạ tầng]                                       |
| * Identity & Access Control: Danh tính, phiên làm việc, phân quyền.               |
| * Device Context & Hardware Services: Giao tiếp GPS, Camera, quyền thiết bị.     |
| * Offline Sync & Local Cache: Đảm bảo ứng dụng chạy khi mất mạng.                 |
+-----------------------------------------------------------------------------------+
```

---

## 2. Các ngữ cảnh giới hạn (Bounded Contexts)

Mỗi Bounded Context sở hữu một mô hình dữ liệu riêng, ranh giới trách nhiệm rõ ràng và giao tiếp với các ngữ cảnh khác qua các hợp đồng hoặc sự kiện xác định.

| Bounded Context               | Vai trò    | Trách nhiệm chính                                                                                       | Mô hình sở hữu (Owned Models)                                        | Quan hệ phụ thuộc                                                                      |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Field Work Verification**   | **CORE**   | Thu thập, đóng gói và xác thực chuỗi bằng chứng 5 chốt (GPS, QR, Before Photo, Checklist, After Photo). | `ProofWorkflow`, `TaskEvidence`, `GpsVerification`, `QrVerification` | Lắng nghe `Work Management` (`Task`), dùng `Tree Asset Registry` (`TreeId`, `QrCode`). |
| **Work Management**           | SUPPORTING | Quản lý vòng đời công việc từ lúc tạo, giao việc, chuyển trạng thái đến khi đóng việc.                  | `Task`, `TaskAssignment`, `TaskChecklistTemplate`                    | Cung cấp nhiệm vụ cho `Field Work Verification`, nhận kết quả từ `Review & QC`.        |
| **Tree Asset Registry**       | SUPPORTING | Quản lý thông tin tài sản cây xanh, vị trí tọa độ, mã QR định danh, trạng thái sinh trưởng và rủi ro.   | `Tree`, `TreeCareHistory` _(Projection)_                             | Độc lập; được tra cứu bởi `Work Management` và `Verification`.                         |
| **Review & Quality Control**  | SUPPORTING | Cổng thẩm định chất lượng bằng chứng do Quản lý (Manager) vận hành; ra quyết định duyệt hoặc trả lại.   | `ReviewAudit`, `ReviewDecision`, `ReworkOrder`                       | Đọc chuỗi bằng chứng từ `Verification`, cập nhật trạng thái sang `Work Management`.    |
| **Operational Notifications** | SUPPORTING | Phát và lưu trữ thông báo vận hành khi trạng thái công việc thay đổi hoặc phát sinh bất thường.         | `Notification`, `NotificationPreference`                             | Nhận sự kiện từ `Work Management` và `Review & QC`.                                    |
| **Identity & Session**        | GENERIC    | Xác thực tài khoản, lưu trữ phiên đăng nhập và cung cấp vai trò (Role).                                 | `User`, `AuthSession`, `Role`                                        | Cung cấp danh tính cho toàn bộ hệ thống.                                               |
| **Device Hardware Adapter**   | GENERIC    | Quản lý quyền hệ điều hành (Camera, Location) và điều phối phần cứng tránh xung đột tài nguyên.         | `DevicePermissionState`, `CameraResourceLock`                        | Cung cấp luồng dữ liệu phần cứng cho `Verification` và `Tree Registry`.                |

---

## 3. Từ vựng chuẩn tắc (Ubiquitous Language)

Mọi thành viên nhóm phát triển, tài liệu và mã nguồn phải sử dụng nhất quán các thuật ngữ dưới đây. Bảng cũng chỉ rõ sự bất nhất hiện thời trong mã nguồn cần chuẩn hóa.

| Thuật ngữ chuẩn (Canonical Term) | Định nghĩa chuẩn trong NOVYX                                                                                 | Thuật ngữ trong code hiện tại `[VERIFIED]`          | Thuật ngữ trên UI `[VERIFIED]`                                      | Điểm vênh / Ghi chú chuẩn hóa                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Tree**                         | Thực thể cây xanh đô thị được quản lý, có tọa độ cố định và mã QR vật lý gắn trên thân.                      | `TreeDto`, `Tree`                                   | `Cây`, `Cây của tôi`                                                | Nhất quán.                                                  |
| **Task**                         | Một nhiệm vụ chăm sóc cây cụ thể được giao cho nhân viên, có hạn chót và danh mục checklist.                 | `TaskDto`, `Task`                                   | `Công việc`, `Nhiệm vụ`                                             | UI dùng lẫn lộn "Công việc" và "Nhiệm vụ".                  |
| **TaskStatus**                   | Vòng đời nghiệp vụ của nhiệm vụ: `Pending`, `In_Progress`, `Waiting_Review`, `Completed`, `Rework_Required`. | `TaskStatus` enum trong `@novyx/contracts`          | `Chờ bắt đầu`, `Đang làm`, `Chờ duyệt`, `Hoàn thành`, `Cần làm lại` | Đã có mapping chuẩn trong `mobileWorkflow.ts`.              |
| **Staff**                        | Nhân viên hiện trường trực tiếp thực hiện công việc chăm sóc và thu thập bằng chứng.                         | `StaffDto`, `Role = 'Staff'`, `UserRole = 'staff'`  | `Nhân viên`                                                         | Vênh hoa/thường: `'Staff'` vs `'staff'`.                    |
| **Manager**                      | Quản lý vận hành giám sát, tạo việc, tra cứu và duyệt bằng chứng hiện trường.                                | `Role = 'Manager'`, `UserRole = 'manager'`          | `Quản lý`                                                           | Vênh hoa/thường: `'Manager'` vs `'manager'`.                |
| **Admin**                        | Quản trị viên hệ thống quản lý danh mục và người dùng _(Vai trò dự trữ tương lai)_.                          | `UserRole = 'admin'`                                | _(Không có trên UI)_                                                | `[RESERVED]` — Chưa triển khai UI.                          |
| **Proof Step**                   | Một bước chốt trong quy trình 5 bước thu thập bằng chứng: GPS, QR, Before, Checklist, After.                 | `ProofStepKey`, `StaffStep`                         | `GPS`, `Mã QR`, `Ảnh trước`, `Nhiệm vụ`, `Ảnh sau`                  | Code đang gộp chung màn hình và bước proof vào `StaffStep`. |
| **Proof Gate**                   | Điều kiện tiên quyết: Phải đủ 5/5 bằng chứng hợp lệ thì mới được phép nộp báo cáo hoặc phê duyệt.            | `reviewProofGaps.length === 0`, `isComplete`        | `Bằng chứng đủ điều kiện`, `Thiếu bằng chứng`                       | Đã có logic trong `mobileWorkflow.ts`.                      |
| **GPS Check**                    | Kết quả đối soát tọa độ thiết bị với tọa độ gốc của cây; hợp lệ khi khoảng cách $\le 10$m.                   | `GpsCheckDto` (`verified`, `distance`, `timestamp`) | `Xác thực GPS`, `Vị trí gốc cây`                                    | `DISTANCE_THRESHOLD = 10` mét.                              |
| **QR Verification**              | Kết quả đối soát mã quét thực tế với mã định danh cây gắn trên nhiệm vụ; bắt buộc khớp 100%.                 | `QrCheckDto` (`verified`, `scannedCode`)            | `Quét mã QR`, `Khớp mã cây`                                         | Bắt buộc khớp tuyệt đối.                                    |
| **Before Evidence**              | Ảnh chụp hiện trạng cây trước khi nhân viên thực hiện bất kỳ can thiệp kỹ thuật nào.                         | `beforePhoto`, `TaskEvidenceDto` (`stage='before'`) | `Ảnh trước`, `Ảnh trước tác nghiệp`                                 | Cần lưu cả URI và metadata chụp.                            |
| **Checklist**                    | Danh sách các tiêu chí kỹ thuật chuyên môn bắt buộc phải hoàn thành cho loại việc đó.                        | `ChecklistItemDto[]`                                | `Nhiệm vụ`, `Checklist nhân viên`                                   | UI đôi khi gọi checklist là "Nhiệm vụ".                     |
| **After Evidence**               | Ảnh chụp nghiệm thu hiện trạng cây sau khi hoàn tất toàn bộ các mục trong checklist.                         | `afterPhoto`, `TaskEvidenceDto` (`stage='after'`)   | `Ảnh sau`, `Ảnh nghiệm thu sau làm`                                 | Bắt buộc chụp sau khi xong checklist.                       |
| **Evidence Submission**          | Hành động đóng gói toàn bộ chuỗi bằng chứng 5 chốt và gửi lên hệ thống để chuyển sang chờ duyệt.             | `submitTaskEvidence`, `SubmitTaskEvidenceRequest`   | `Gửi duyệt kết quả`, `Nộp bằng chứng`                               | Chuyển trạng thái `In_Progress -> Waiting_Review`.          |
| **Review Decision**              | Quyết định thẩm định của Quản lý: Phê duyệt (`approve`) hoặc Trả lại làm lại (`request_rework`).             | `ReviewDecisionRequest` (`decision`)                | `Phê duyệt`, `Từ chối`                                              | UI nút ghi "Từ chối", bản chất là "Yêu cầu làm lại".        |
| **Rework Reason**                | Lý do cụ thể bắt buộc phải có khi yêu cầu làm lại để nhân viên biết cần sửa chữa bước nào.                   | `rejectReason`, `rejectChips`, `reason`             | `Lý do từ chối`, `Yêu cầu làm lại`                                  | Code dùng cả `reason` lẫn `rejectReason`.                   |
| **Care History**                 | Bản chiếu thời gian (Projection) thể hiện các lần chăm sóc đã hoàn tất trong quá khứ của một cây.            | `CareHistoryDto`                                    | `Lịch sử chăm sóc`                                                  | Là Read Projection sinh ra từ các task đã duyệt.            |
| **Offline Snapshot**             | Bản sao lưu trữ dữ liệu tại bộ nhớ máy khách để tiếp tục làm việc khi mất kết nối mạng.                      | `AppDataDto`, `snapshot`                            | `Ngoại tuyến`, `Dữ liệu cục bộ`                                     | Hiện lưu in-memory, cần lưu bền vững (Durable).             |

---

## 4. Mô hình thực thể miền (Domain Object Model)

Phải phân định rạch ròi: **Mô hình miền (Domain Model) $\ne$ Dữ liệu truyền tải (DTO)**.

```text
+---------------------+           1..*          +---------------------+
|        Tree         | <---------------------- |        Task         |
| (Root Aggregate)    |                         | (Root Aggregate)    |
+---------------------+                         +---------------------+
  - id: TreeId                                    - id: TaskId
  - qrCode: QrCodeString                          - treeId: TreeId
  - location: Coordinates                         - assignedStaffId: StaffId
  - healthStatus: HealthStatus                    - status: TaskStatus
  - riskStatus: RiskStatus                        - deadline: IsoDateTime
  - careHistory: CareHistory[] (Proj)             - checklist: ChecklistItem[]
                                                  - proofWorkflow: ProofWorkflow
                                                  - reviewAudit: ReviewAudit?
                                                            |
                                                            | 1
                                                            v 1
                                                +---------------------+
                                                |    ProofWorkflow    |
                                                |   (Child Entity)    |
                                                +---------------------+
                                                  - gpsCheck: GpsCheck?
                                                  - qrCheck: QrCheck?
                                                  - beforePhoto: PhotoRef?
                                                  - afterPhoto: PhotoRef?
                                                  - isComplete: boolean
```

### 4.1. Chi tiết thực thể và Vòng đời

#### A. Thực thể Cây xanh (Tree Aggregate)

- **Định danh:** `TreeId` (duy nhất trong toàn hệ thống, ví dụ `TREE-01`).
- **Trường bất biến:** `id`, `qrCode`, `lat`, `lng`. Tọa độ và mã QR không được tự ý thay đổi trong các thao tác vận hành hàng ngày.
- **Trường khả biến:** `healthStatus` (`Khỏe mạnh`, `Cần chăm sóc`, `Sâu bệnh`), `riskStatus` (`healthy`, `abnormal`, `overdue`, `pest_risk`, `leaning`).
- **Tính toán dẫn xuất:** `careHistory` là bản chiếu (Read-only Projection) tập hợp từ các `Task` có trạng thái `Completed` gắn với cây này.

#### B. Thực thể Nhiệm vụ (Task Aggregate)

- **Định danh:** `TaskId` (ví dụ `TSK-01`).
- **Trường thông tin:** `title`, `taskType`, `description`, `treeId`, `assignedStaffId`, `deadline`, `status`, `checklist`.
- **Trường bằng chứng:** `gpsCheck`, `qrCheck`, `beforePhoto`, `afterPhoto`, `evidence[]`, `notes`.
- **Trường thẩm định:** `rejectReason`, `rejectChips`, `reviewerId`, `reviewedAt`.
- **Bất biến:**
  - Không thể nộp bằng chứng nếu chưa đủ 5 chốt.
  - Không thể chuyển sang `Completed` nếu chưa qua bước duyệt của Quản lý.
  - Khi ở trạng thái `Completed`, nhiệm vụ trở thành bất biến (Read-only, đóng hoàn toàn).

#### C. Đối tượng giá trị Bằng chứng (TaskEvidence Value Object)

- **Đặc điểm:** Bất biến (Immutable). Một khi đã chụp và ghi nhận thành công, bằng chứng gắn liền với một thời điểm (`capturedAt`), người chụp (`capturedByUserId`) và tọa độ thực tế lúc chụp.
- **Phân loại giai đoạn (`stage`):** Chỉ nhận giá trị `'before'` hoặc `'after'`.

---

## 5. Bất biến miền cốt lõi (Domain Invariants)

Các quy tắc nghiệp vụ sau đây là **BẮT BUỘC TUÂN THỦ (Hard Invariants)**. Bất kỳ vi phạm nào đều bị hệ thống chặn lại và ghi nhận lỗi.

| Mã quy tắc | Tên quy tắc / Quy chuẩn nghiệp vụ                                                                                                                   | Vị trí kiểm soát hiện tại `[VERIFIED]`                          | Vị trí kiểm soát mục tiêu (Target)                               | Hành vi khi vi phạm (Violation Behavior)                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **DR-01**  | **Bán kính GPS hợp lệ $\le 10$m:** Thiết bị phải cách tọa độ gốc cây không quá 10 mét mới được xác nhận GPS.                                        | `StaffProofFlow.tsx` (`distance <= 10`)                         | Domain Service / Mobile Validation Hook & Backend Validation     | Chặn bước xác thực GPS; hiển thị khoảng cách thực tế và hướng dẫn tiến lại gần cây.                           |
| **DR-02**  | **Trùng khớp mã QR cây:** Mã QR quét được từ camera vật lý phải khớp 100% với `qrCode` của cây trong nhiệm vụ.                                      | `StaffProofFlow.tsx` (`scannedCode === activeTree.qrCode`)      | Domain Service & Backend Validation                              | Báo lỗi không đúng cây; không ghi nhận bằng chứng; cho phép quét lại hoặc báo cáo sự cố mã hỏng.              |
| **DR-03**  | **Trật tự thu thập bằng chứng tuần tự:** Thứ tự logic bắt buộc: GPS $\to$ QR $\to$ Ảnh trước $\to$ Checklist $\to$ Ảnh sau $\to$ Rà soát $\to$ Nộp. | `mobileWorkflow.ts` (`getNextProofStep`)                        | Domain State Machine (`ProofWorkflowState`)                      | Người dùng không thể nhảy cóc đến bước sau nếu bước trước chưa hoàn thành hợp lệ.                             |
| **DR-04**  | **Hoàn thành 100% Checklist:** Tất cả các mục checklist bắt buộc phải được đánh dấu hoàn thành trước khi cho phép chụp ảnh sau.                     | `mobileWorkflow.ts` (`task.checklist.every(item => item.done)`) | Domain State Machine & Backend Validation                        | Báo "Checklist chưa hoàn thành đủ"; nút chuyển sang bước Ảnh sau bị khóa.                                     |
| **DR-05**  | **Cổng nộp bằng chứng đủ 5/5:** Nút nộp báo cáo chỉ kích hoạt khi cả 5 điều kiện (GPS, QR, Before, Checklist, After) đều hợp lệ.                    | `mobileWorkflow.ts` (`getTaskProofGaps.length === 0`)           | Application Use Case (`SubmitEvidenceUseCase`)                   | Nút chuyển thành `Hoàn thiện bằng chứng` và điều hướng trực tiếp về bước đầu tiên còn thiếu.                  |
| **DR-06**  | **Cổng phê duyệt của Quản lý:** Quản lý không thể phê duyệt một nhiệm vụ nếu chuỗi bằng chứng còn bất kỳ lỗ hổng nào (`gaps > 0`).                  | `ManagerReview.tsx` (`disabled={reviewProofGaps.length > 0}`)   | Application Use Case (`ApproveTaskUseCase`) & Backend API Gate   | Nút Phê duyệt bị vô hiệu hóa; hiển thị nhãn "Thiếu bằng chứng" kèm danh sách chi tiết các điểm thiếu.         |
| **DR-07**  | **Bắt buộc có lý do khi trả việc làm lại:** Quản lý không thể gửi yêu cầu làm lại nếu chưa nhập hoặc chưa chọn lý do cụ thể.                        | `ManagerReview.tsx` (`cleanRejectReason.length > 0`)            | Application Use Case (`RequestReworkUseCase`) & Backend API Gate | Nút Từ chối không thực thi; hiển thị cảnh báo đỏ "Cần nhập lý do trước khi yêu cầu làm lại".                  |
| **DR-08**  | **Bảo toàn bằng chứng khi làm lại:** Khi nhiệm vụ bị trả về `Rework_Required`, các bằng chứng đã thu thập hợp lệ không bị xóa bỏ.                   | `greenOpsService.ts` / In-memory state                          | Local Cache & Backend Persistence                                | Nhân viên mở nhiệm vụ làm lại sẽ thấy lý do của Quản lý và chỉ cần thực hiện lại đúng các khâu còn thiếu sót. |
| **DR-09**  | **Bất biến của nhiệm vụ đã đóng:** Nhiệm vụ đã ở trạng thái `Completed` thì không thể sửa đổi nội dung hoặc mở lại luồng nộp bằng chứng.            | `StaffWork.tsx`, `ManagerReview.tsx`                            | Backend Entity Guard / State Transition Guard                    | Toàn bộ giao diện chuyển sang chế độ xem (Read-only); không hiển thị các nút thao tác tiến trình.             |
| **DR-10**  | **Độc quyền tài nguyên Camera:** Tại một thời điểm, chỉ duy nhất một thành phần giao diện được quyền sở hữu và kích hoạt `CameraView`.              | `useDevicePermissions.ts` (`activeCameraPurpose`)               | Presentation Hardware Coordinator                                | Ngăn chặn hiện tượng xung đột tài nguyên camera dẫn đến đen màn hình hoặc sập ứng dụng (Crash).               |
