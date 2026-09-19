# NOVYX GreenOps — Product Baseline & Business Capabilities

Tài liệu này là hợp đồng thẩm quyền cao nhất giải thích **TẠI SAO** sản phẩm tồn tại, giải quyết bài toán gì, mang lại giá trị vận hành nào và ranh giới phạm vi của phiên bản **Minimum Viable Product (MVP)**.

---

## 1. Tuyên ngôn sản phẩm & Tầm nhìn (Product Vision)

> **Tầm nhìn:** Thiết lập hệ thống chuẩn mực vận hành số tin cậy cho công tác quản lý và chăm sóc cây xanh đô thị, biến mọi tác nghiệp hiện trường thành chuỗi bằng chứng có kiểm chứng và lưu vết đáng tin cậy (Evidence-backed Field Verification Trail) thông qua định vị thực địa, định danh số và cổng kiểm duyệt chất lượng nghiêm ngặt.<br>
> _(Lưu ý thẩm quyền: LEGAL STATUS: NOT ESTABLISHED / OUTSIDE CURRENT MVP CLAIMS. Dự án tập trung vào tính trung thực vận hành nội bộ và mô hình bảo toàn phiên bản bằng chứng)._

### 1.1. Bài toán thực tiễn (Problem Statement)

Các đơn vị quản lý công viên, cây xanh đô thị và nhà thầu dịch vụ cảnh quan hiện gặp 4 thách thức cốt tử:

1. **Gian lận và thiếu tin cậy hiện trường:** Khó xác minh nhân viên có thực sự đến đúng vị trí cây hay chỉ chụp ảnh từ xa, chụp ảnh cũ hoặc báo cáo khống.
2. **Sai lệch định danh tài sản:** Trong các tuyến đường hàng trăm cây cùng chủng loại, nhân viên rất dễ nhầm lẫn cây cần chăm sóc với cây lân cận nếu chỉ dựa vào số nhà hoặc mô tả cảm tính.
3. **Thiếu tính toàn vẹn thời gian của bằng chứng:** Ảnh chụp thường bị dồn về cuối ngày, không phản ánh trạng thái trước (Before) và sau (After) khi can thiệp kỹ thuật (cắt tỉa, bón phân, xử lý sâu bệnh).
4. **Quy trình duyệt lỏng lẻo, thiếu đường hồi phục:** Quản lý không có công cụ đối soát nhanh giữa tọa độ thực tế, mã quét cây và checklist; khi từ chối nghiệm thu, thông tin phản hồi tới nhân viên bị đứt gãy dẫn đến chậm trễ tiến độ.

### 1.2. Giá trị vận hành cốt lõi (Core Value Proposition)

NOVYX GreenOps giải quyết triệt để các bài toán vận hành thực địa bằng mô hình **Xác thực tác nghiệp thích ứng & 3 Hồ sơ Bằng chứng Ngữ nghĩa**:

1. **Xác thực hiện trường hai tín hiệu độc lập (Site Verification):**
   - **Định danh thực thể (Tree Identity):** Quét mã QR cố định trên thân cây để đối soát với cây được giao. Trường hợp mã mờ/rách/mất, cung cấp cơ chế ngoại lệ có kiểm soát (`IDENTITY_EXCEPTION`) qua ảnh tem chụp thực tế và mã số thủ công đối chiếu. Cây mục tiêu là **bất biến, tuyệt đối không được đổi sang cây khác**.
   - **Vị trí thực địa (Location):** GPS đo đạc mục tiêu sai lệch $\le 10$m. Nếu tín hiệu trôi do tán lá rậm hoặc nhà cao tầng sau khi thử lại, cung cấp cơ chế ngoại lệ có kiểm soát (`LOCATION_EXCEPTION`) kèm lý do giải trình để Quản lý hậu kiểm.
   - **Thứ tự linh hoạt:** QR và GPS có thể thu thập theo bất kỳ thứ tự nào; việc thu thập này chỉ phục vụ xác thực hiện trường chứ không làm đổi trạng thái vòng đời công việc.

2. **Chính sách bằng chứng theo 3 Hồ sơ Ngữ nghĩa (Semantic Proof Profiles):**
   - **`CHANGE_PROOF` (Công việc tạo biến đổi vật lý trực quan):** Cắt tỉa, đốn hạ cành sâu mục, trồng mới, can thiệp khẩn cấp. Yêu cầu: Xác thực hiện trường + Ảnh trước (Before) + Checklist thao tác + Ảnh sau (After).
   - **`SERVICE_PROOF` (Bảo dưỡng định kỳ không tạo khác biệt trước/sau):** Tưới nước, bón phân, làm cỏ bồn cây, xử lý đất. Yêu cầu: Xác thực hiện trường + Checklist thao tác + Ảnh kết quả hoàn thành (Completion Photo).
   - **`INSPECTION_PROOF` (Khảo sát, kiểm tra, đánh giá chuyên môn):** Đánh giá sức khỏe, phát hiện sâu bệnh, đo độ nghiêng rủi ro. Yêu cầu: Xác thực hiện trường + Tiêu chí phát hiện có cấu trúc (Structured Findings) + Ảnh hiện trạng (Condition Photos).

3. **Cổng kiểm soát chất lượng & Hồi phục tất định:**
   - Quản lý thẩm định 100% hồ sơ nộp với 4 kết luận rõ ràng (`APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, `CANCEL`).
   - Cơ chế làm lại có mục tiêu (`Targeted Rework`): Chỉ yêu cầu làm lại khâu bằng chứng sai sót; bảo lưu bằng chứng hợp lệ cũ; lưu vết lịch sử nộp nhiều phiên bản (Versioned Evidence).
   - Cơ chế dừng tạm thời khi gặp trở ngại ngoài ý muốn (`ReportFieldIssue` $\to$ `BLOCKED`) với 3 lối thoát tất định (`Resume`, `Reassign`, `Cancel`).
   - Biên giới Lịch sử chăm sóc (`Care History`): Chỉ công việc đã được nghiệm thu (`COMPLETED`) mới được ghi nhận vào hồ sơ chính thức của cây.

---

## 2. Đối tượng sử dụng & Chân dung người dùng (Target Actors)

| Tác nhân (Actor)                  | Bối cảnh vận hành                                                                                               | Mục tiêu chính                                                                                                                     | Rào cản môi trường                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Nhân viên hiện trường (Staff)** | Làm việc ngoài trời, di chuyển liên tục, thiết bị Android tầm trung/giá rẻ, sử dụng 1 tay, đeo găng tay bảo hộ. | Nhận việc rõ ràng, bấm bắt đầu, xác thực hiện trường, thu thập bằng chứng đúng loại việc, báo cáo sự cố khi bị cản trở, nộp duyệt. | Ánh sáng chói chang, mạng 3G/4G chập chờn, bụi bẩn, pin yếu, ứng dụng dễ bị OS tắt ngầm. |
| **Quản lý vận hành (Manager)**    | Điều hành tại văn phòng hoặc kiểm tra đột xuất ngoài tuyến đường; sử dụng smartphone hoặc tablet.               | Giao việc đúng loại & đúng cây, xử lý sự cố tạm dừng, thẩm định bằng chứng minh bạch, phê duyệt (kể cả có ngoại lệ) hoặc trả lại.  | Quá tải báo cáo tồn đọng, thiếu dữ liệu đối chiếu khách quan nếu bằng chứng bị cắt xén.  |
| **Quản trị hệ thống (Admin)**     | Vận hành cấp cao, quản lý danh mục đô thị, tài khoản và phân quyền.                                             | Đảm bảo tính toàn vẹn dữ liệu, phân quyền bảo mật, tích hợp hệ sinh thái đô thị thông minh.                                        | _(Dự kiến cho tương lai — [OUT_OF_MVP], [RESERVED])_.                                    |

---

## 3. Bản đồ năng lực kinh doanh (Business Capability Map)

Hệ thống năng lực của NOVYX GreenOps được phân tách rành mạch giữa **Năng lực nghiệp vụ (Business Capabilities)** và **Năng lực kỹ thuật nền tảng (Platform Capabilities)**:

```text
+-----------------------------------------------------------------------------------+
|                            NOVYX BUSINESS CAPABILITIES                            |
+-----------------------------------------------------------------------------------+
| [CORE DOMAIN - Xác thực tác nghiệp hiện trường]                                    |
| 1. Field Work Verification                                                        |
|    - Site Verification (QR định danh cây + GPS vị trí mục tiêu <=10m)             |
|    - Verification Exception Handling (Xử lý ngoại lệ QR hỏng & GPS trôi có kiểm soát)|
|    - Semantic Proof Acquisition (Thu thập bằng chứng theo CHANGE/SERVICE/INSPECTION) |
|    - Technical Checklist / Structured Findings Execution                          |
|    - Field Issue Reporting (Báo cáo sự cố hiện trường chuyển sang BLOCKED)         |
|    - Targeted Evidence Submission & Outbox Packaging                              |
+-----------------------------------------------------------------------------------+
| [SUPPORTING DOMAINS - Nghiệp vụ điều phối & Kiểm soát]                             |
| 2. Work Management                                                                |
|    - Task Dispatching & Assignment (Tạo việc, gắn TaskType -> ProofProfile)        |
|    - Deterministic Task Lifecycle (PENDING, IN_PROGRESS, BLOCKED, WAITING, REWORK) |
|    - Reassignment Governance (Đổi người ở PENDING & BLOCKED; cấm đổi trực tiếp)    |
|    - Task Cancellation (Hủy việc có lý do từ mọi trạng thái chưa đóng)             |
| 3. Tree Asset Registry                                                            |
|    - Tree Catalog & Risk Profiling (Hồ sơ cây, tọa độ và mã QR bất biến)          |
|    - Fast Field QR Lookup (Tra cứu nhanh thông tin cây tại hiện trường)            |
|    - Official Care History Projection (Chỉ chiếu từ các nhiệm vụ COMPLETED)       |
| 4. Review & Quality Control                                                       |
|    - Multi-Outcome Manager Review Gate (APPROVE, REWORK, APPROVE_EXCEPTION, CANCEL)|
|    - Targeted Rework Feedback Loop (Chỉ thị sửa đúng mục, bảo lưu bằng chứng cũ)  |
|    - Versioned Evidence Audit Trail (Lưu vết lịch sử các lần nộp và thẩm định)    |
| 5. Operational Notifications                                                      |
|    - Task Lifecycle Alerts (Việc mới, yêu cầu làm lại, phê duyệt, sự cố tạm dừng)  |
+-----------------------------------------------------------------------------------+
| [GENERIC / PLATFORM CAPABILITIES - Kỹ thuật nền tảng]                              |
| - Session & Role-Based Access Control (Đăng nhập, phiên làm việc, phân quyền)     |
| - Contextual Device Permissions (Cấp quyền Camera & Location đúng thời điểm)       |
| - Resilient Offline Store & Outbox (Bảo toàn dữ liệu nhập dở, đồng bộ khi có mạng)|
| - API Transport & Structured Envelopes (REST v1, chuẩn hóa lỗi, upload ảnh)       |
| - Seed/Linear Outdoor Design System (Giao diện tối ưu ngoài trời nắng)            |
+-----------------------------------------------------------------------------------+
```

### 3.1. Bảng chi tiết năng lực nghiệp vụ (Business Capabilities Matrix)

| Mã         | Tên năng lực                   | Vai trò    | Tác nhân chính         | Đối tượng xử lý (Work Object)                            | Trạng thái MVP      | Chủ sở hữu mã nguồn tương lai                               |
| ---------- | ------------------------------ | ---------- | ---------------------- | -------------------------------------------------------- | ------------------- | ----------------------------------------------------------- |
| **CAP-01** | **Field Work Verification**    | **CORE**   | Staff                  | `Task`, `SiteVerification`, `TaskEvidence`, `FieldIssue` | **MUST HAVE**       | `StaffProofFlow.tsx`, `mobileWorkflow.ts`                   |
| **CAP-02** | **Work Management**            | SUPPORTING | Manager, Staff         | `Task`, `TaskAssignment`, `TaskType`                     | **MUST HAVE**       | `ManagerCreateTask.tsx`, `StaffWork.tsx`, `greenOpsService` |
| **CAP-03** | **Tree Asset Registry**        | SUPPORTING | Manager, Staff         | `Tree`, `CareHistory` (Chỉ tạo khi `COMPLETED`)          | **MUST HAVE**       | `StaffTrees.tsx`, `ManagerTrees.tsx`, `ManagerQrLookup.tsx` |
| **CAP-04** | **Review & Quality Control**   | SUPPORTING | Manager                | `Task`, `ReviewDecision`, `ReworkRequest`                | **MUST HAVE**       | `ManagerReview.tsx`, `greenOpsService.ts`                   |
| **CAP-05** | **Operational Notifications**  | SUPPORTING | System, Staff, Manager | `Notification`                                           | **MUST HAVE**       | `StaffArea.tsx`, `greenOpsService.ts`                       |
| **CAP-06** | **Session & Access Control**   | GENERIC    | Staff, Manager         | `AuthSession`, `User`                                    | **MUST HAVE**       | `MobileApp.tsx`, `authSessionStore.ts`                      |
| **CAP-07** | **Contextual Permissions**     | GENERIC    | System, Staff, Manager | `DevicePermission`                                       | **MUST HAVE**       | `devicePermissions.ts`, `useDevicePermissions.ts`           |
| **CAP-08** | **Offline Resilience & Cache** | GENERIC    | System                 | `LocalSubmissionStatus`, `DurableStore`, `Outbox`        | **MUST HAVE (GAP)** | `greenOpsService.ts` _(Cần nâng cấp bền vững)_              |

---

## 4. Phạm vi MVP — Chu trình vận hành chuẩn tắc (The Canonical Operating Loop)

Định nghĩa MVP của NOVYX GreenOps được đo bằng **Chu trình vận hành khép kín tất định (Deterministic End-to-End Operating Loop)**:

```text
[1. Manager Tạo việc & Phân công] (Trạng thái: PENDING)
  |-- Manager chọn Cây mục tiêu, Người thực hiện, Hạn chót, Loại việc (TaskType).
  |-- Hệ thống tự động ánh xạ TaskType -> ProofProfile (CHANGE, SERVICE, hoặc INSPECTION).
  |-- TaskType gắn kèm Checklist mẫu hoặc Mẫu khảo sát cấu trúc mặc định.
  |-- Manager KHÔNG được tùy tiện hạ cấp ProofProfile của từng task riêng lẻ.
  |-- (Tại PENDING: Manager có quyền Reassign sang Staff khác hoặc Cancel -> CANCELLED).
  v
[2. Staff Tiếp nhận & Bấm Bắt đầu]
  |-- Thấy việc trong hàng đợi Công việc.
  |-- Staff chủ động bấm "Bắt đầu làm việc" (StartTask).
  |-- DUY NHẤT hành động này chuyển Task từ PENDING -> IN_PROGRESS.
  v
[3. Staff Xác thực hiện trường (Site Verification)]
  |-- Quét mã QR trên thân cây (Tree Identity) và đo khoảng cách GPS (Location target <=10m).
  |-- Thu thập theo thứ tự tùy chọn; không làm đổi trạng thái Task.
  |-- Nếu gặp khó khăn: Kích hoạt ngoại lệ có kiểm soát (LOCATION_EXCEPTION hoặc IDENTITY_EXCEPTION).
  |-- Cây mục tiêu là bất biến; tuyệt đối không cho phép đổi sang cây khác.
  v
[4. Tác nghiệp thực địa & Thu thập bằng chứng theo Hồ sơ ngữ nghĩa]
  |-- Nếu phát sinh sự cố không thể tiếp tục: Staff bấm ReportFieldIssue -> Chuyển sang BLOCKED.
  |     +--> Manager xử lý: (a) Bỏ cản trở: RESUME -> IN_PROGRESS; (b) Đổi người: REASSIGN -> PENDING; (c) Hủy việc: CANCEL -> CANCELLED.
  |-- Thu thập bằng chứng đúng hợp đồng bắt buộc của ProofProfile:
  |     * CHANGE_PROOF: Ảnh trước -> Tích checklist kỹ thuật -> Ảnh sau.
  |     * SERVICE_PROOF: Tích checklist kỹ thuật -> Ảnh hoàn thành.
  |     * INSPECTION_PROOF: Đánh giá tiêu chí có cấu trúc -> Ảnh hiện trạng.
  v
[5. Staff Nộp hồ sơ nghiệm thu (Evidence Submission)]
  |-- Rà soát hợp đồng bằng chứng theo hồ sơ nhiệm vụ.
  |-- Bấm "Gửi duyệt kết quả".
  |-- Nếu ngoại tuyến: LocalSubmissionStatus = PENDING_SYNC, trên server Task vẫn là IN_PROGRESS.
  |-- Khi đồng bộ thành công: Task chuyển sang WAITING_REVIEW, LocalSubmissionStatus = SYNCED.
  v
[6. Manager Thẩm định Hồ sơ (Manager Review Gate)]
  |-- Manager đối soát hiện trường (QR/GPS/Ngoại lệ) và nội dung bằng chứng chuyên môn.
  |-- Ra 1 trong 4 quyết định dứt điểm:
        +---> [APPROVE]: Nghiệm thu đạt chuẩn -> Chuyển sang COMPLETED -> Sinh CareHistory chính thức.
        +---> [APPROVE_WITH_EXCEPTION]: Chấp nhận ngoại lệ (công việc đã làm, lỗi không thể tạo lại,
        |     Quản lý chịu trách nhiệm phê duyệt kèm lý do bắt buộc) -> Chuyển sang COMPLETED (có cờ ngoại lệ).
        +---> [REQUEST_REWORK]: Chỉ rõ khâu sai sót -> Chuyển sang REWORK_REQUIRED -> Staff sửa đúng mục
        |     bị từ chối (bảo lưu bằng chứng hợp lệ cũ) -> Nộp lại về WAITING_REVIEW.
        +---> [CANCEL]: Hủy bỏ nhiệm vụ kèm lý do -> Chuyển sang CANCELLED (không sinh CareHistory).
```

> **Tham chiếu chi tiết:** Toàn bộ bảng chuyển dịch trạng thái, điều kiện tiên quyết (Guards) và ma trận sự kiện được quy định thẩm quyền tại [`docs/WORKFLOWS.md`](WORKFLOWS.md).

---

### 4.1. Ranh giới phạm vi MVP (Scope Boundary)

#### MUST HAVE (Bắt buộc trong MVP):

- Đăng nhập phân quyền theo 2 vai trò vận hành thực tế: `Staff` và `Manager`.
- Cơ chế xin quyền thiết bị theo ngữ cảnh sử dụng (Contextual Permissions) cho Camera và GPS.
- Quản trị Loại việc (`TaskType`) gắn liền với 3 Hồ sơ Bằng chứng Ngữ nghĩa (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`).
- Xác thực hiện trường hai tín hiệu độc lập (QR + GPS mục tiêu $\le 10$m) có xử lý ngoại lệ có kiểm soát.
- Vòng đời nhiệm vụ 7 trạng thái tất định: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`.
- Báo cáo sự cố hiện trường (`ReportFieldIssue` $\to$ `BLOCKED`) và 3 lối thoát xử lý của Quản lý.
- Cổng thẩm định 4 kết luận của Quản lý (`APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, `CANCEL`).
- Làm lại có mục tiêu (`Targeted Rework`), bảo lưu bằng chứng hợp lệ cũ, lưu vết lịch sử nhiều phiên bản.
- Quyền Hủy việc (`CancelTask`) có lý do bắt buộc từ mọi trạng thái chưa đóng.
- Quy tắc đổi người làm việc (`Reassign`): Cho phép ở `PENDING` và `BLOCKED`; cấm đổi trực tiếp ở `IN_PROGRESS` và `WAITING_REVIEW`.
- Chiếu Lịch sử chăm sóc (`Care History`): Chỉ nhiệm vụ `COMPLETED` mới sinh Care History; bảo toàn cờ ngoại lệ nếu có.
- Cơ chế ngoại tuyến: Phân tách rõ ràng giữa `TaskStatus` và `LocalSubmissionStatus`.

#### SHOULD HAVE (Giai đoạn tiếp theo sau MVP):

- Tải ảnh nền đồng bộ (Background photo upload queue) khi kết nối chập chờn.
- Phân trang Cursor cho danh mục cây và danh sách nhiệm vụ trên giao diện mobile.
- Lọc cây theo bản đồ thực địa tương tác (Interactive Map clustering).

#### EXPLICIT NON-GOALS (Dứt khoát loại trừ khỏi MVP):

- Tối ưu hóa lộ trình di chuyển tự động (Route optimization / TSP).
- Quản lý chấm công, tính lương công nhật (Workforce payroll).
- Quản trị kho vật tư, phân bón, thuốc bảo vệ thực vật chi tiết (Parts & inventory).
- Quản lý hợp đồng nhà thầu và thanh quyết toán dịch vụ (Contractor billing, SLAs).
- Ký nhận điện tử của người dân/chủ đầu tư (Customer digital signatures).
- Hệ thống GIS chuyên sâu biên tập đa giác bản đồ (Advanced GIS polygon editing).
- Cảm biến IoT gắn đất hoặc thân cây (IoT soil/tree tilt sensors).
- Dự báo bảo trì bằng trí tuệ nhân tạo (Predictive maintenance AI).
- Phê duyệt đa cấp bậc tổ chức (Multi-level corporate approvals).
- Vai trò Quản trị viên hệ thống (Admin) — _Dành cho tương lai, [OUT_OF_MVP], [RESERVED]_.

---

## 5. Giả định và Ràng buộc vận hành (Assumptions & Constraints)

1. **Ràng buộc phần cứng:** Thiết bị Staff là Android 10+ với camera có tự động lấy nét và GPS phần cứng hoạt động được ngoài trời.
2. **Ràng buộc khoảng cách GPS:** Tiêu chuẩn mục tiêu là $\le 10$ mét (`DISTANCE_TARGET = 10`). Không áp dụng ngưỡng phụ 25m. Nếu GPS không đạt sau khi thử lại do tán lá rậm/nhà cao tầng, kích hoạt `LOCATION_EXCEPTION` kèm giải trình để Quản lý hậu kiểm.
3. **Ràng buộc định danh QR:** Mỗi cây xanh có một mã QR vật lý chịu thời tiết gắn trên thân. Cây mục tiêu của Task là **bất biến trong suốt quá trình thực thi**. Nếu tem hỏng, kích hoạt `IDENTITY_EXCEPTION` đối soát mã chụp với chính cây được giao, không được đổi sang cây khác.
4. **Ràng buộc bảo toàn dữ liệu bằng chứng:** Không bao giờ xóa đè hoặc viết lại tác giả của các bằng chứng đã thu thập; lịch sử các lần nộp và thẩm định phải được bảo toàn nguyên vẹn. Bằng chứng lịch sử không thể tái tạo trung thực thì không bao giờ được làm giả (`EVIDENCE_INTEGRITY_EXCEPTION`).
5. **Ràng buộc ngôn ngữ & Định dạng:** Giao diện người dùng sử dụng tiếng Việt chuẩn tắc; múi giờ vận hành `Asia/Ho_Chi_Minh` (GMT+7); khoảng cách tính theo mét (m).
6. **Ràng buộc kiến trúc monorepo:** Mọi cấu trúc dữ liệu trao đổi giữa ứng dụng di động và backend tương lai phải đi qua package `@novyx/contracts`. Cấm tuyệt đối việc sao chép thủ công kiểu dữ liệu vào `apps/mobile/src/`.
