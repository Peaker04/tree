# NOVYX GreenOps — Workflow Optimization & Operational Sequences (Phase 5)

> **Tài liệu chuẩn mực tối ưu hóa quy trình nghiệp vụ đầu-cuối và ma trận bàn giao**
> Thuộc chu trình: **Business Baseline Reconciliation — Phase 5**.
> Căn cứ chuẩn tắc:
> - [`docs/business-reconciliation/02-ACTOR-MODEL-DECISION.md`](02-ACTOR-MODEL-DECISION.md) (Khóa ranh giới 4 tác nhân)
> - [`docs/business-reconciliation/03-ROLE-NAMING-TAXONOMY.md`](03-ROLE-NAMING-TAXONOMY.md) (Khóa danh xưng 3 tầng)
> - [`docs/business-reconciliation/04-ADMIN-BUSINESS-SCOPE-DECISION.md`](04-ADMIN-BUSINESS-SCOPE-DECISION.md) (Khóa phạm vi nghiệp vụ Quản trị hệ thống)
> - [`docs/business-reconciliation/05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) (Khóa ma trận sở hữu tài nguyên miền)
> - [`docs/business-reconciliation/06-BOUNDED-CONTEXT-DECISIONS.md`](06-BOUNDED-CONTEXT-DECISIONS.md) (Khóa ranh giới ngữ cảnh giới hạn & từ vựng)
> - [`docs/business-reconciliation/07-AUTHORIZATION-ACTION-ELIGIBILITY.md`](07-AUTHORIZATION-ACTION-ELIGIBILITY.md) (Khóa mô hình phân quyền và điều kiện kích hoạt hành động)
> - [`docs/WORKFLOWS.md`](../WORKFLOWS.md) (Quy trình tác nghiệp chuẩn tắc)
> - [`docs/DOMAIN.md`](../DOMAIN.md) (Kiến trúc miền chuẩn tắc)
> - [`docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md`](../NOVYX_Business_Baseline_Reconciliation_Master_Plan.md)
>
> **Ranh giới thực thi (Hard Scope Rule)**:
> - Khảo sát, rà soát và tối ưu hóa toàn bộ các luồng nghiệp vụ đầu-cuối sau khi đã khóa Actor, Domain Ownership và Authorization.
> - **KHÔNG** sửa mã nguồn ứng dụng (`apps/**`) hay thư viện chia sẻ (`packages/**`).
> - **KHÔNG** sửa đổi tài liệu canonical (`PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `REQUIREMENTS-TRACEABILITY.md`, `NFR.md`).
> - **KHÔNG** sửa đổi sơ đồ trực quan (`docs/diagrams/**`) tại phase này.
> - **KHÔNG** thiết kế API, không vẽ wireframe UI, không tạo database schema.

---

## 1. Định Nghĩa "Tối Ưu Hóa Quy Trình" (Defining Workflow Optimization)

Trong khuôn khổ NOVYX GreenOps, khái niệm **Tối ưu hóa quy trình (Workflow Optimization)** được định vị rõ ràng:

- **KHÔNG PHẢI là thêm tính năng mới (Adding Features)**.
- **KHÔNG PHẢI là thiết kế lại giao diện người dùng (UI Redesign)**.
- **KHÔNG PHẢI là thiết kế kiến trúc kỹ thuật (Architecture Design)**.

### Bản chất của Tối ưu hóa quy trình:
1. **Loại bỏ các bước thừa thãi**: Triệt tiêu các thao tác phê duyệt hoặc can thiệp trung gian không mang lại giá trị gia tăng nghiệp vụ.
2. **Minh định quyền sở hữu hành vi**: Xác định chính xác tác nhân nào làm bước nào, không còn bước công việc "vô chủ".
3. **Minh định các điểm bàn giao (Handoffs)**: Làm rõ dữ liệu bàn giao giữa các tác nhân và giữa các Bounded Context.
4. **Tách bạch Phán quyết Nghiệp vụ và Tự động hóa Tất định**: Con người nắm quyền quyết định có trách nhiệm giải trình; hệ thống máy móc đảm nhận kiểm tra và tính toán tất định.
5. **Giữ vững các chốt kiểm soát bắt buộc (Mandatory Controls)**: Tối ưu hóa không đồng nghĩa với việc nới lỏng an toàn. Các yêu cầu về xác thực hiện trường (GPS/QR), hồ sơ chứng cứ theo `ProofProfile`, thẩm định của Quản lý và lưu vết kiểm toán là **bất biến**.
6. **Định hình đường xử lý thất bại và phục hồi (Failure & Recovery Paths)**: Mọi rẽ nhánh lỗi/ngoại lệ đều phải có lối thoát về một trạng thái xác định, tuyệt đối không có ngõ cụt (Dead Ends).

> **Nguyên lý dẫn đạo cốt lõi**:
> $$\text{MINIMUM NECESSARY STEPS WITHOUT REMOVING BUSINESS CONTROL}$$
> *(Tối thiểu hóa số bước cần thiết mà không loại bỏ bất kỳ chốt kiểm soát nghiệp vụ nào)*

---

## 2. Danh Mục Quy Trình Nghiệp Vụ Chuẩn Tắc (Workflow Inventory)

Toàn bộ nghiệp vụ hệ thống được cấu trúc thành 18 quy trình chuẩn tắc phục vụ bản MVP và 3 quy trình giai đoạn mở rộng tiếp theo (`NEXT`):

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NOVYX GREENOPS WORKFLOW INVENTORY                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  NHÓM A: QUY TRÌNH VẬN HÀNH THỰC ĐỊA (OPERATIONAL FIELD FLOWS - MVP)        │
│  - WF-01: Task Creation & Assignment (Khởi tạo & Phân công công việc)       │
│  - WF-02: Task Execution Initiation (Kích hoạt bắt đầu thực địa)            │
│  - WF-03: Site Verification (Xác thực hiện trường: GPS & QR)                │
│  - WF-04: Proof Acquisition (Thu thập minh chứng theo ProofProfile)         │
│  - WF-05: Evidence Submission (Nộp hồ sơ nghiệm thu kỹ thuật)               │
│  - WF-06: Review & Quality Approval (Thẩm định & Phê duyệt chất lượng)      │
│  - WF-07: Targeted Rework Loop (Vòng lặp sửa chữa có trọng tâm)             │
│  - WF-08: Blocked Resolution (Xử lý sự cố ách tắc hiện trường)              │
│  - WF-09: Task Cancellation (Hủy bỏ nhiệm vụ vận hành)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  NHÓM B: QUY TRÌNH QUẢN TRỊ NỀN TẢNG (GOVERNANCE WORKFLOWS - MVP)           │
│  - WF-10: User Provisioning (Khởi tạo tài khoản người dùng mới)             │
│  - WF-11: Role Change & Assignment (Điều chỉnh phân quyền vai trò)          │
│  - WF-12: Account Suspension & Lifecycle (Khóa, Mở khóa, Vô hiệu hóa)       │
│  - WF-13: Tree Master Data Governance (Quản trị dữ liệu gốc cây xanh)       │
│  - WF-14: TaskType Catalog Governance (Quản trị danh mục loại việc)         │
│  - WF-15: Proof Policy Mapping Governance (Quản trị chính sách bằng chứng)  │
│  - WF-16: Checklist Template Versioning (Quản trị phiên bản mẫu checklist)  │
│  - WF-17: Audit Log Inspection (Thanh tra & tra cứu sổ nhật ký kiểm toán)   │
├─────────────────────────────────────────────────────────────────────────────┤
│  NHÓM C: QUY TRÌNH HỖ TRỢ KỸ THUẬT NGOẠI TUYẾN (TECHNICAL FLOW - MVP)       │
│  - WF-18: Offline Submission & Background Sync (Nộp offline & Đồng bộ ngầm) │
├─────────────────────────────────────────────────────────────────────────────┤
│  NHÓM D: QUY TRÌNH KIỂM SOÁT TƯƠNG LAI (FUTURE CONTROLLED FLOWS - NEXT)     │
│  - WF-NEXT-01: Dynamic Findings Template Governance (Form khám bệnh động)   │
│  - WF-NEXT-02: Break-Glass Emergency Execution (Can thiệp vượt quyền khẩn)  │
│  - WF-NEXT-03: Security Governance Notifications (Cảnh báo an ninh quản trị)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Đặc Tả Chi Tiết Từng Quy Trình Vận Hành Thực Địa (Operational Field Flows WF-01..09)

### WF-01: Task Creation & Assignment (Khởi tạo & Phân công nhiệm vụ)
- **Mã quy trình**: `WF-01`
- **Mục đích**: Thiết lập một nhiệm vụ tác nghiệp hiện trường có đầy đủ cây mục tiêu, loại việc, chính sách bằng chứng và nhân viên phụ trách.
- **Kích hoạt (Trigger)**: Kế hoạch vận hành định kỳ hoặc phát sinh đột xuất từ Quản lý vận hành (Operations Manager).
- **Tác nhân chính**: Operations Manager (`manager`).
- **Tác nhân phối hợp**: System (Hệ thống tự động hóa).
- **Ngữ cảnh sở hữu**: `Work Management`.
- **Điều kiện vào (Entry Conditions)**:
  - Tác nhân đăng nhập có vai trò `manager` và trạng thái `ACTIVE`.
  - Cây mục tiêu tồn tại trong `Tree Asset Registry` và chưa bị `RETIRED`.
  - Loại việc `TaskType` đang ở trạng thái `ACTIVE`.
  - Tồn tại ánh xạ chính sách bằng chứng hợp lệ `TaskType -> ProofProfile`.
  - Nhân viên được phân công có vai trò `staff` và trạng thái `ACTIVE`.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Quản lý vận hành truy cập chức năng tạo nhiệm vụ.
  2. Quản lý chọn cây xanh mục tiêu trong danh mục tài nguyên được ủy quyền (`AUTHORIZED_OPERATIONAL_SCOPE`).
  3. Quản lý chọn loại công việc (`TaskType`) từ danh mục đang hoạt động (`ACTIVE`).
  4. *[Hệ thống]* Tự động phân giải và cố định hồ sơ bằng chứng `ProofProfile` và phiên bản chính sách `policyVersionId` tương ứng (tất định, Manager không cần và không được tự chọn tùy tiện).
  5. Quản lý chọn nhân viên hiện trường (`staff`) tiếp nhận việc và thiết lập thời hạn hoàn thành (Deadline tương lai).
  6. Quản lý bấm xác nhận `CreateTask`.
  7. *[Hệ thống]* Kiểm tra tính hợp lệ toàn vẹn, tạo thực thể `Task` ở trạng thái `PENDING`, chốt bản chụp bất biến `treeIdSnapshot`, `policyVersionId`, và `assignedStaffId`.
  8. *[Hệ thống]* Ghi sự kiện kiểm toán khởi tạo (`AUDIT_REQUIRED`), gửi thông báo việc mới tới ứng dụng di động của nhân viên được phân công.
  9. *[END]* Nhiệm vụ xuất hiện trong danh sách việc cần làm của nhân viên với trạng thái `PENDING`.
- **Điểm ra quyết định (Decision Points)**:
  - Chọn nhân sự phân công: Dựa trên năng lực chuyên môn và tải công việc hiện trường của nhân viên.
- **Hành vi tự động hóa của Hệ thống**: Tự động tra cứu và gắn `ProofProfile` theo `TaskType`, không tạo thêm bước phê duyệt trung gian cho cấu hình bằng chứng.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Cây đã bị đốn hạ (`RETIRED`): Báo lỗi `TREE_RETIRED`, từ chối tạo task.
  - Loại việc `INACTIVE`: Báo lỗi `TASK_TYPE_DISABLED`, yêu cầu chọn loại việc khác.
  - Nhân viên đang bị khóa (`SUSPENDED` / `DISABLED`): Báo lỗi `ASSIGNEE_NOT_ACTIVE`, chặn phân công.
- **Bàn giao (Handoff)**: Từ Operations Manager $\to$ Field Staff thông qua việc xuất hiện task ở trạng thái `PENDING`.
- **Điều kiện kết thúc**: Thực thể `Task` được ghi bền vững vào cơ sở dữ liệu ở trạng thái `PENDING`.
- **Trạng thái miền kết quả**: `TaskStatus = PENDING`.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Kết hợp việc Khởi tạo và Phân công ban đầu thành **một luồng duy nhất (Single Unified Creation Flow)**; loại bỏ bước duyệt phân công rườm rà. Tự động hóa ánh xạ `ProofProfile` loại trừ 100% nguy cơ Quản lý hạ cấp tiêu chuẩn thu thập chứng cứ.
- **Bất biến được bảo vệ (Locked Invariants)**: `treeIdSnapshot` bất biến; Admin bị cấm tham gia tạo việc (`ADM-SOD-04`); task không tự ý chuyển sang `IN_PROGRESS`.

---

### WF-02: Task Execution Initiation (Kích hoạt bắt đầu thực địa)
- **Mã quy trình**: `WF-02`
- **Mục đích**: Xác định chính thức thời điểm nhân viên hiện trường tiếp quản và bắt đầu triển khai công việc ngoài thực địa.
- **Kích hoạt (Trigger)**: Nhân viên hiện trường di chuyển đến vị trí cây và sẵn sàng làm việc.
- **Tác nhân chính**: Field Staff (`staff`).
- **Tác nhân phối hợp**: System.
- **Ngữ cảnh sở hữu**: `Work Management`.
- **Điều kiện vào (Entry Conditions)**:
  - `TaskStatus = PENDING`.
  - Tài khoản đăng nhập khớp chính xác với `task.assignedStaffId`.
  - Tài khoản nhân viên đang `ACTIVE`.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Nhân viên mở ứng dụng di động, xem danh sách việc được giao (thao tác mở xem chi tiết không làm đổi trạng thái).
  2. Nhân viên có mặt tại hiện trường, bấm nút **"Bắt đầu công việc"** (`StartTask`).
  3. *[Hệ thống]* Kiểm tra quyền sở hữu tài nguyên (`assignedStaffId == actor.userId`) và trạng thái `PENDING`.
  4. *[Hệ thống]* Chụp bản chụp biểu mẫu checklist (`ChecklistSnapshot`) từ phiên bản mẫu đang hoạt động (`ChecklistTemplateVersion`).
  5. *[Hệ thống]* Cập nhật `TaskStatus = IN_PROGRESS`, ghi nhận thời điểm bắt đầu thực tế (`startedAt`).
  6. *[END]* Giao diện chuyển sang màn hình thu thập chứng cứ và xác thực hiện trường của task đang thi công.
- **Điểm ra quyết định (Decision Points)**: Không có quyết định phê duyệt; nhân viên tự kích hoạt khi có mặt tại hiện trường.
- **Hành vi tự động hóa của Hệ thống**: Tự động chụp bản sao checklist mẫu vào task để bảo đảm tính ổn định nội dung trong suốt quá trình làm việc.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Nhân viên khác cố bấm bắt đầu: Báo lỗi `RESOURCE_SCOPE_MISMATCH`, từ chối kích hoạt.
  - Task đã bị Quản lý hủy trước đó (`CANCELLED`): Báo lỗi `INVALID_TASK_STATE`, thông báo công việc đã chấm dứt.
- **Bàn giao (Handoff)**: Từ trạng thái chờ (`PENDING`) $\to$ Trạng thái thi công chủ động của chính nhân viên đó (`IN_PROGRESS`).
- **Điều kiện kết thúc**: Trạng thái nhiệm vụ chuyển sang `IN_PROGRESS`.
- **Trạng thái miền kết quả**: `TaskStatus = IN_PROGRESS`.
- **Yêu cầu kiểm toán**: `NO_BUSINESS_AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Khóa cứng bất biến `DR-MVP-04`: Thao tác mở xem chi tiết công việc, bật camera, quét QR hay lấy tọa độ GPS tuyệt đối không được kích hoạt ngầm `StartTask`. Chỉ duy nhất hành động bấm nút chủ động của nhân viên mới chuyển dịch trạng thái.
- **Bất biến được bảo vệ (Locked Invariants)**: Duy nhất `StartTask` mới chuyển `PENDING -> IN_PROGRESS`; Admin và Manager bị cấm bấm hộ (`ADM-SOD-04`).

---

### WF-03: Site Verification (Xác thực hiện trường: GPS & QR)
- **Mã quy trình**: `WF-03`
- **Mục đích**: Xác minh độc lập hai dữ kiện vật lý: Nhân viên có mặt đúng tại tọa độ cây ($\le 10$m) và quét đúng mã tem QR gắn trên thân cây được giao.
- **Kích hoạt (Trigger)**: Nhân viên thực hiện xác thực vị trí và danh tính cây tại hiện trường.
- **Tác nhân chính**: Field Staff (`staff`).
- **Tác nhân phối hợp**: System (tính toán khoảng cách Haversine và khớp mã QR).
- **Ngữ cảnh sở hữu**: `Work Management` (phối hợp `Tree Asset Registry`).
- **Điều kiện vào (Entry Conditions)**:
  - `TaskStatus = IN_PROGRESS` (hoặc `REWORK_REQUIRED` nếu khâu xác thực bị yêu cầu làm lại).
  - Tác nhân là nhân viên được giao việc.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Nhân viên kích hoạt chức năng quét QR hoặc lấy tọa độ GPS (thứ tự hoàn toàn linh hoạt, không gò ép bước nào trước).
  2. **Nhánh Định vị GPS**:
     - Thiết bị ghi nhận tọa độ GPS thực tế (Latitude, Longitude, Accuracy, Timestamp).
     - *[Hệ thống]* Tính toán khoảng cách Haversine giữa tọa độ đo được và tọa độ chuẩn của cây trong Master Data.
     - Nếu khoảng cách $\le 10$m: Hệ thống ghi nhận `distanceMeters`, gắn nhãn xác thực thành công `LOCATION_VERIFIED`.
  3. **Nhánh Danh tính QR**:
     - Nhân viên hướng camera quét tem QR gắn trên thân cây.
     - *[Hệ thống]* Giải mã chuỗi QR và đối chiếu với `treeId` của nhiệm vụ.
     - Nếu khớp mã: Hệ thống ghi nhận `scannedQrCode`, thời điểm quét, gắn nhãn thành công `TREE_IDENTITY_VERIFIED`.
  4. *[END]* Cả hai tín hiệu định vị và danh tính đều hoàn tất chuẩn mực; nhiệm vụ sẵn sàng để chụp bằng chứng chuyên môn.
- **Điểm ra quyết định (Decision Points)**:
  - Khi gặp lỗi trôi GPS hoặc tem QR rách: Nhân viên quyết định bấm đo/quét lại (Retry) hoặc kích hoạt quy trình báo cáo ngoại lệ kỹ thuật.
- **Hành vi tự động hóa của Hệ thống**: Tính toán khoảng cách trắc địa và so khớp chuỗi mã QR hoàn toàn tự động, tức thời.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - **Ngoại lệ GPS (`LOCATION_EXCEPTION`)**: Tán lá rậm hoặc hẻm sâu khiến sai số $> 10$m sau nhiều lần thử lại. Nhân viên kích hoạt cờ ngoại lệ, nhập văn bản giải trình lý do thực địa. Hệ thống lưu nguyên vẹn tọa độ đo được, khoảng cách thực tế và gắn cờ cảnh báo cho Quản lý thẩm định sau này.
  - **Ngoại lệ QR (`IDENTITY_EXCEPTION`)**: Tem QR bị mất, cạo rách hoặc mờ mã. Nhân viên kích hoạt cờ ngoại lệ, bắt buộc chụp ảnh hiện trạng gốc cây thiếu tem, nhập lý do và có thể nhập mã số sơn dập nổi trên thân cây (nếu có). Hệ thống đối chiếu mã nhập tay với duy nhất cây được giao, cấm đổi sang cây khác.
- **Bàn giao (Handoff)**: Lưu kết quả vào thực thể thành phần `SiteVerification` của Task. Không bàn giao sang Quản lý tại bước này (Quản lý chỉ xem xét lúc thẩm định tổng thể).
- **Điều kiện kết thúc**: Cả hai hạng mục GPS và QR đều có kết quả (hoặc `VERIFIED`, hoặc `EXCEPTION` có giải trình).
- **Trạng thái miền kết quả**: `TaskStatus` giữ nguyên không đổi (`IN_PROGRESS` hoặc `REWORK_REQUIRED`).
- **Yêu cầu kiểm toán**: `NO_BUSINESS_AUDIT_REQUIRED` (bản thân việc đo/quét là thao tác kỹ thuật; cờ ngoại lệ được thẩm định và kiểm toán tại khâu Review).
- **Phát hiện tối ưu hóa (Optimization Finding)**: Cho phép thực hiện GPS và QR theo **thứ tự tự do (Order-Independent)**. Loại bỏ hoàn toàn bước Quản lý phải ngồi trực tuyến duyệt từng lần quét QR ngoài thực địa (chuyển sang hậu kiểm tập trung tại bước Review).
- **Bất biến được bảo vệ (Locked Invariants)**: Ngưỡng GPS chuẩn duy nhất là $\le 10$m; quét QR/GPS không làm đổi `TaskStatus`; không cho phép thế chấp cây khác.

---

### WF-04: Proof Acquisition (Thu thập minh chứng theo ProofProfile)
- **Mã quy trình**: `WF-04`
- **Mục đích**: Thu thập đầy đủ các thành phần bằng chứng hiện trường theo đúng hợp đồng nghiệp vụ của hồ sơ `ProofProfile` được giao.
- **Kích hoạt (Trigger)**: Sau khi bắt đầu công việc, nhân viên tiến hành thi công và chụp ảnh/ghi nhận kết quả.
- **Tác nhân chính**: Field Staff (`staff`).
- **Tác nhân phối hợp**: System (kiểm tra hợp đồng bằng chứng).
- **Ngữ cảnh sở hữu**: `Work Management`.
- **Điều kiện vào (Entry Conditions)**:
  - `TaskStatus = IN_PROGRESS` (hoặc `REWORK_REQUIRED` đối với các khâu bị từ chối).
- **Luồng thành công chuẩn tắc theo 3 Hồ sơ (Happy Path by Profile)**:
  1. *[START]* Giao diện ứng dụng tự động hiển thị chính xác các mục bằng chứng cần thu thập theo `ProofProfile` của task:
     - **Trường hợp A: `CHANGE_PROOF` (Công việc có biến đổi vật lý trực quan)**:
       - Bước A1: Chụp ảnh hiện trạng Trước khi thi công (`Before Photo`) từ góc chụp bao quát.
       - Bước A2: Thực hiện công việc kỹ thuật (cắt tỉa, bón phân gốc, trồng mới) và tích chọn 100% tiêu chuẩn trong `ChecklistSnapshot`.
       - Bước A3: Chụp ảnh kết quả Sau khi thi công (`After Photo`) từ góc chụp tương đồng với ảnh Trước.
     - **Trường hợp B: `SERVICE_PROOF` (Công việc bảo dưỡng định kỳ)**:
       - Bước B1: Thực hiện dịch vụ (tưới nước, làm cỏ bồn) và tích chọn 100% tiêu chuẩn trong `ChecklistSnapshot`.
       - Bước B2: Chụp ảnh nghiệm thu hoàn thành dịch vụ (`Completion Photo`). Không bắt ép chụp ảnh Trước vô nghĩa.
     - **Trường hợp C: `INSPECTION_PROOF` (Khảo sát & Khám bệnh cây chuyên sâu)**:
       - Bước C1: Khám và nhập số liệu chuyên môn có cấu trúc vào `StructuredFindings` (độ nghiêng thân, tỷ lệ mục rỗng gốc, mức độ sâu bệnh tán lá, đánh giá rủi ro cành khô).
       - Bước C2: Chụp ít nhất 01 ảnh hiện trạng chi tiết vị trí bệnh/khuyết tật (`Condition Photos`). Không áp dụng checklist thao tác chung chung.
  2. *[Hệ thống]* Lưu ảnh và số liệu vào phiên nộp hiện hành (`EvidenceAttempt`), tự động gắn metadata (tọa độ GPS thiết bị tại thời điểm chụp, timestamp, mã nhân viên).
  3. *[END]* Tiến độ thu thập bằng chứng đạt 100% hợp đồng quy định.
- **Điểm ra quyết định (Decision Points)**:
  - Nhân viên đánh giá các chỉ số lâm sinh khi điền `StructuredFindings` hoặc tích checklist.
- **Hành vi tự động hóa của Hệ thống**: Tự động ẩn các trường bằng chứng không liên quan (ví dụ: không hiển thị ô chụp ảnh Trước cho việc tưới nước `SERVICE_PROOF`), giảm thiểu thao tác thừa cho nhân viên.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - **Ngoại lệ toàn vẹn bằng chứng (`EVIDENCE_INTEGRITY_EXCEPTION`)**: Nhân viên quên chụp ảnh Trước nhưng đã lỡ cắt tỉa xong cành cây. Hệ thống cấm tuyệt đối việc chụp ảnh giả mạo để thế chỗ. Nhân viên phải báo cáo ngoại lệ toàn vẹn để Quản lý thẩm định và xử lý trách nhiệm tại khâu Review.
- **Bàn giao (Handoff)**: Dữ liệu được gom vào gói hồ sơ nghiệm thu nội bộ của Task.
- **Điều kiện kết thúc**: 100% các thành phần bằng chứng bắt buộc theo Profile đã được lưu đầy đủ trên máy khách.
- **Trạng thái miền kết quả**: `TaskStatus` giữ nguyên `IN_PROGRESS` (hoặc `REWORK_REQUIRED`).
- **Yêu cầu kiểm toán**: `NO_BUSINESS_AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Áp dụng **Giao diện ngữ nghĩa theo Profile (Profile-Adaptive UI)**. Nhân viên làm dịch vụ bảo dưỡng không còn bị ép chụp ảnh "Trước" hình thức; nhân viên kiểm định tập trung 100% vào bảng khám bệnh lâm nghiệp `StructuredFindings`.
- **Bất biến được bảo vệ (Locked Invariants)**: Cấm ngụy tạo ảnh chụp màn hình hay lấy ảnh thư viện cũ (`DR-HARD-04`); `StructuredFindings` được bảo lưu nguyên vẹn trong MVP.

---

### WF-05: Evidence Submission (Nộp hồ sơ nghiệm thu kỹ thuật)
- **Mã quy trình**: `WF-05`
- **Mục đích**: Gửi toàn bộ hồ sơ nghiệm thu hoàn chỉnh từ hiện trường lên máy chủ để chuyển giao quyền kiểm soát sang Quản lý thẩm định.
- **Kích hoạt (Trigger)**: Nhân viên bấm nút "Nộp hồ sơ nghiệm thu" (`SubmitEvidence`).
- **Tác nhân chính**: Field Staff (`staff`).
- **Tác nhân phối hợp**: System (kiểm tra điều kiện tiên quyết và tiếp nhận gói tin).
- **Ngữ cảnh sở hữu**: `Work Management`.
- **Điều kiện vào (Entry Conditions)**:
  - `TaskStatus = IN_PROGRESS`.
  - Tác nhân đăng nhập là nhân viên được giao việc.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Nhân viên kiểm tra lại toàn bộ ảnh, checklist, số liệu khám bệnh và bấm **"Nộp hồ sơ"** (`SubmitEvidence`).
  2. *[Hệ thống]* Kiểm tra tính đầy đủ tất định:
     - Đã có dữ liệu `SiteVerification` (hoặc cờ ngoại lệ giải trình hợp lệ).
     - Đã đủ 100% số lượng ảnh chụp thực địa theo `ProofProfile`.
     - Checklist đã trả lời đủ 100% (nếu profile yêu cầu).
     - Bảng `StructuredFindings` đã điền đủ các trường bắt buộc (nếu là `INSPECTION_PROOF`).
  3. Khi toàn bộ điều kiện tiên quyết thỏa mãn và thiết bị có kết nối Internet trực tuyến:
     - Gói tin được gửi thành công lên Authoritative Server.
     - *[Hệ thống]* Chuyển trạng thái `TaskStatus = WAITING_REVIEW`.
     - *[Hệ thống]* Gửi thông báo có hồ sơ mới cần duyệt tới Quản lý vận hành phụ trách.
  4. *[END]* Nhiệm vụ rời khỏi danh sách thực hiện của nhân viên, chuyển sang danh mục "Đang chờ duyệt".
- **Điểm ra quyết định (Decision Points)**: Không có quyết định của con người tại bước nộp; hệ thống kiểm tra logic tự động.
- **Hành vi tự động hóa của Hệ thống**: Tự động xác thực tính đầy đủ và toàn vẹn của gói hồ sơ trước khi cho phép chuyển trạng thái.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - **Hồ sơ chưa đủ chỉ tiêu**: Hệ thống từ chối chuyển trạng thái, hiển thị danh sách các mục còn thiếu (ví dụ: "Chưa chụp ảnh sau", "Còn 2 câu checklist chưa điền"). Nhiệm vụ giữ nguyên `IN_PROGRESS`.
  - **Mất kết nối mạng (Offline)**: Nếu bấm nộp khi không có mạng, hệ thống chuyển sang quy trình kỹ thuật `WF-18` (Lưu cục bộ `PENDING_SYNC`, máy chủ vẫn giữ nguyên `IN_PROGRESS`).
- **Bàn giao (Handoff)**: Từ Field Staff $\to$ Operations Manager thông qua việc task xuất hiện trong Hàng đợi thẩm định (`ReviewQueue`).
- **Điều kiện kết thúc**: Máy chủ chuẩn tắc ghi nhận thành công gói hồ sơ và chuyển task sang `WAITING_REVIEW`.
- **Trạng thái miền kết quả**: `TaskStatus = WAITING_REVIEW`.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Hệ thống đóng vai trò **Người gác cổng kỹ thuật số (Automated Quality Gatekeeper)**. Hồ sơ thiếu sót bị chặn ngay lập tức trên máy khách, ngăn ngừa 100% tình trạng gửi hồ sơ "rác" lên làm tắc nghẽn hàng đợi thẩm định của Quản lý.
- **Bất biến được bảo vệ (Locked Invariants)**: Bấm nộp offline không làm đổi `TaskStatus` trên server (`DR-TECH-01`); hồ sơ thiếu bằng chứng cấm được vào `WAITING_REVIEW`.

---

### WF-06: Review & Quality Approval (Thẩm định & Phê duyệt chất lượng)
- **Mã quy trình**: `WF-06`
- **Mục đích**: Quản lý vận hành đánh giá chất lượng thi công thực địa và ban hành một trong 4 phán quyết nghiệp vụ dứt điểm.
- **Kích hoạt (Trigger)**: Nhiệm vụ chuyển sang `WAITING_REVIEW` và xuất hiện trong hàng đợi thẩm định của Quản lý.
- **Tác nhân chính**: Operations Manager (`manager`).
- **Tác nhân phối hợp**: System.
- **Ngữ cảnh sở hữu**: `Work Management` (phối hợp chiếu sang `Tree Asset Registry`).
- **Điều kiện vào (Entry Conditions)**:
  - `TaskStatus = WAITING_REVIEW`.
  - Task thuộc phạm vi quản lý vận hành được ủy quyền (`AUTHORIZED_OPERATIONAL_SCOPE`).
  - Quản lý đăng nhập đang ở trạng thái `ACTIVE`.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Quản lý mở Hàng đợi thẩm định (`ViewReviewQueue`), chọn nhiệm vụ cần duyệt.
  2. Quản lý mở xem chi tiết hồ sơ (`ReviewTask`): Kiểm tra ảnh Trước/Sau, câu trả lời checklist, kết quả khám bệnh, tọa độ GPS và ảnh tem QR.
  3. Quản lý thực hiện **chính xác 1 trong 4 quyết định nghiệp vụ dứt điểm**:
     - **Quyết định 1: `APPROVE` (Phê duyệt đạt chuẩn 100%)**:
       - Bấm duyệt đạt yêu cầu.
       - *[Hệ thống]* Cập nhật `TaskStatus = COMPLETED`.
       - *[Hệ thống]* Kích hoạt tạo bản ghi Lịch sử chăm sóc chính thức (`CareHistory`) chiếu sang thực thể cây trong `Tree Asset Registry`.
       - *[Hệ thống]* Ghi sự kiện kiểm toán duyệt hoàn tất (`AUDIT_REQUIRED`).
     - **Quyết định 2: `APPROVE_WITH_EXCEPTION` (Duyệt ngoại lệ có bảo lãnh trách nhiệm)**:
       - Áp dụng khi công việc thực tế đạt chất lượng nhưng có cờ ngoại lệ định vị (GPS trôi), tem QR hỏng hoặc thiếu ảnh Trước bất khả kháng.
       - Bắt buộc nhập văn bản giải trình lý do chấp thuận ngoại lệ của Quản lý.
       - *[Hệ thống]* Cập nhật `TaskStatus = COMPLETED` (trạng thái vẫn là `COMPLETED`, không tạo trạng thái phụ).
       - *[Hệ thống]* Kích hoạt tạo bản ghi `CareHistory` mang cờ `HAS_EXCEPTION` kèm mã tham chiếu giải trình.
       - *[Hệ thống]* Ghi sự kiện kiểm toán có ngoại lệ (`AUDIT_REQUIRED`).
     - **Quyết định 3: `REQUEST_REWORK` (Yêu cầu làm lại có mục tiêu)**:
       - Áp dụng khi phát hiện sai sót kỹ thuật hoặc bằng chứng mờ/thiếu. Chuyển sang quy trình `WF-07`.
     - **Quyết định 4: `CANCEL` (Hủy bỏ nhiệm vụ khi đang duyệt)**:
       - Áp dụng khi phát hiện gian lận nghiêm trọng hoặc kế hoạch bị hủy bỏ. Chuyển sang quy trình `WF-09`.
  4. *[END]* Nhiệm vụ rời khỏi hàng đợi thẩm định, hoàn tất vòng đời nghiệp vụ thành công (Terminal Success).
- **Điểm ra quyết định (Decision Points)**: Đánh giá chất lượng thực địa của Quản lý — quyết định phán quyết đạt chuẩn, duyệt ngoại lệ hay bắt làm lại.
- **Hành vi tự động hóa của Hệ thống**: Tự động tạo bản ghi chiếu `CareHistory` ngay khi task chuyển sang `COMPLETED`.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Duyệt ngoại lệ mà để trống lý do giải trình: Hệ thống báo lỗi `PRECONDITION_NOT_MET`, chặn duyệt cho đến khi có văn bản giải trình trách nhiệm.
  - Staff hoặc Admin cố tình gọi lệnh Approve: Báo lỗi `ROLE_NOT_ALLOWED`, chặn đứng 100%.
- **Bàn giao (Handoff)**: Từ Operations Manager $\to$ Hồ sơ Cây xanh (`Tree Asset Registry` / `CareHistory`) đối với kết quả nghiệm thu thành công.
- **Điều kiện kết thúc**: Nhiệm vụ chuyển trạng thái sang `COMPLETED` (đóng vĩnh viễn).
- **Trạng thái miền kết quả**: `TaskStatus = COMPLETED`.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Chuẩn hóa dứt điểm **Đúng 4 phán quyết (Strict Four Decisions)**. Khóa cứng quy tắc không tự ý sinh trạng thái `COMPLETED_WITH_EXCEPTION` trong máy trạng thái (đưa ngoại lệ thành thuộc tính trong `CareHistory`).
- **Bất biến được bảo vệ (Locked Invariants)**: Staff cấm tự duyệt (`DR-HARD-02`); Admin cấm duyệt việc vận hành; cấm duyệt tự động `Auto-approval` (`DR-POL-01`); DUY NHẤT task `COMPLETED` mới được sinh CareHistory (`DR-HARD-07`).

---

### WF-07: Targeted Rework Loop (Vòng lặp sửa chữa có trọng tâm)
- **Mã quy trình**: `WF-07`
- **Mục đích**: Khắc phục các sai sót kỹ thuật hoặc bổ sung bằng chứng chưa đạt chuẩn mà **không bắt nhân viên phải làm lại toàn bộ từ đầu**.
- **Kích hoạt (Trigger)**: Quản lý vận hành ban hành quyết định `REQUEST_REWORK` tại bước thẩm định.
- **Tác nhân chính**: Operations Manager (phát lệnh) $\to$ Field Staff (thi công sửa đổi).
- **Tác nhân phối hợp**: System (bảo tồn chứng cứ cũ và mở phiên nộp mới).
- **Ngữ cảnh sở hữu**: `Work Management`.
- **Điều kiện vào (Entry Conditions)**:
  - `TaskStatus = WAITING_REVIEW`.
  - Quản lý chỉ rõ mục sai sót cụ thể (`targetedArea` / `targetedKhau`) và nhập lý do yêu cầu sửa.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Quản lý chọn các khâu sai sót cần sửa (ví dụ: chỉ chụp lại ảnh sau `AFTER_PHOTO`, hoặc làm lại mục bón phân trong `CHECKLIST`), nhập hướng dẫn khắc phục và bấm xác nhận `RequestRework`.
  2. *[Hệ thống]* Khóa bảo lưu toàn bộ các bằng chứng hợp lệ cũ của phiên trước (`Attempt 1`).
  3. *[Hệ thống]* Chuyển trạng thái `TaskStatus = REWORK_REQUIRED`, tạo phiên nộp mới (`Attempt 2`), gắn cờ các mục cụ thể cần sửa đổi.
  4. *[Hệ thống]* Ghi sự kiện kiểm toán (`AUDIT_REQUIRED`), gửi thông báo khẩn yêu cầu sửa chữa đến nhân viên hiện trường.
  5. Nhân viên mở nhiệm vụ: Giao diện hiển thị rõ ràng lý do từ chối và **chỉ mở quyền sửa/chụp bổ sung đối với đúng các mục bị Quản lý chỉ định**.
  6. Nhân viên thực hiện khắc phục ngoài hiện trường và chụp lại/điền lại các mục yêu cầu.
  7. Nhân viên bấm **"Nộp lại hồ sơ khắc phục"** (`ResubmitRework`).
  8. *[Hệ thống]* Kiểm tra các mục chỉ định đã được bổ sung đầy đủ, chuyển trạng thái `TaskStatus = WAITING_REVIEW`.
  9. *[END]* Nhiệm vụ quay trở lại Hàng đợi thẩm định của Quản lý để đánh giá phiên mới (`Attempt 2`).
- **Điểm ra quyết định (Decision Points)**:
  - Quản lý xác định phạm vi sai lệch: Chỉ thị đúng khâu hỏng hóc để tránh lãng phí công sức thực địa.
- **Hành vi tự động hóa của Hệ thống**: Tự động ghép nối các bằng chứng hợp lệ của lần 1 với bằng chứng mới sửa của lần 2 thành một gói hồ sơ tích hợp hoàn chỉnh cho phiên thẩm định kế tiếp.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Nhân viên bấm nộp lại nhưng chưa chụp bổ sung khâu bị từ chối: Báo lỗi `PRECONDITION_NOT_MET`, chặn nộp.
  - Báo sự cố hiện trường tại đây: Lệnh `ReportFieldIssue` bị `DENY 100%` (không tồn tại đường `REWORK_REQUIRED -> BLOCKED`).
- **Bàn giao (Handoff)**: Từ Manager $\to$ Staff (yêu cầu làm lại) và ngược lại từ Staff $\to$ Manager (nộp lại hồ sơ sửa).
- **Điều kiện kết thúc**: Nhiệm vụ quay trở lại trạng thái `WAITING_REVIEW`.
- **Trạng thái miền kết quả**: `TaskStatus = WAITING_REVIEW`.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Triệt để áp dụng nguyên tắc **Bảo tồn bằng chứng cũ & Sửa đổi có mục tiêu (Targeted Rework & Evidence Preservation)**. Nhân viên không phải quét lại QR, không phải đo lại GPS nếu các khâu đó đã đạt chuẩn; tiết kiệm tối đa thời gian và chi phí vận hành.
- **Bất biến được bảo vệ (Locked Invariants)**: Cấm xóa lịch sử bằng chứng cũ (`DR-HARD-03`, `DR-POL-03`); cấm chuyển việc tự ý khi đang làm lại; cấm rẽ nhánh sang `BLOCKED`.

---

### WF-08: Blocked Resolution (Xử lý sự cố ách tắc hiện trường)
- **Mã quy trình**: `WF-08`
- **Mục đích**: Tiếp nhận báo cáo sự cố khách quan từ hiện trường và cung cấp cơ chế xử lý dứt điểm từ cấp quản lý.
- **Kích hoạt (Trigger)**: Nhân viên gặp chướng ngại vật bất khả kháng ngoài thực địa và gọi lệnh `ReportFieldIssue`.
- **Tác nhân chính**: Field Staff (báo cáo) $\to$ Operations Manager (ra quyết định tháo gỡ).
- **Tác nhân phối hợp**: System.
- **Ngữ cảnh sở hữu**: `Work Management`.
- **Điều kiện vào (Entry Conditions)**:
  - `TaskStatus = IN_PROGRESS` (duy nhất trạng thái này mới được báo sự cố).
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Nhân viên gặp trở ngại hiện trường (tổ ong vò vẽ, rào chắn thi công đường, ngập lụt, cành gãy đe dọa an toàn).
  2. Nhân viên chụp ảnh hiện trường trở ngại, nhập mô tả lý do chi tiết và bấm **"Báo cáo sự cố"** (`ReportFieldIssue`).
  3. *[Hệ thống]* Cập nhật `TaskStatus = BLOCKED`, ghi nhận thực thể `FieldIssue`, gửi cảnh báo sự cố màu vàng/đỏ tới bảng điều hành của Quản lý.
  4. Quản lý vận hành tiếp nhận sự cố, đánh giá tình hình thực địa và chọn **chính xác 1 trong 3 lối thoát chuẩn tắc**:
     - **Lối thoát 1: `RESUME` (Tiếp tục thi công)**:
       - Áp dụng khi trở ngại đã được giải tỏa (rào chắn đã dỡ bỏ, tổ ong đã được xử lý).
       - Quản lý bấm xác nhận mở lại (`ResumeBlockedTask`).
       - *[Hệ thống]* Chuyển trạng thái `TaskStatus = IN_PROGRESS` cho nhân viên cũ tiếp tục thi công.
     - **Lối thoát 2: `REASSIGN` (Điều chuyển nhân sự khác tiếp quản)**:
       - Áp dụng khi nhân viên cũ gặp tai nạn, kiệt sức hoặc phải đổi ca khẩn cấp.
       - Quản lý chọn nhân viên mới đang `ACTIVE` và bấm điều chuyển (`ReassignTask Case B`).
       - *[Hệ thống]* Đưa task về trạng thái `PENDING`, cập nhật `assignedStaffId` mới, **bảo lưu nguyên vẹn tác giả và các bằng chứng đã thu thập của nhân viên trước**.
     - **Lối thoát 3: `CANCEL` (Hủy bỏ nhiệm vụ do bất khả kháng)**:
       - Áp dụng khi cây đã bị bật gốc gãy đổ hoàn toàn hoặc công trình giải tỏa mặt bằng vĩnh viễn.
       - Quản lý bấm hủy nhiệm vụ (`CancelTask`) kèm lý do bất khả kháng.
       - *[Hệ thống]* Chuyển trạng thái `TaskStatus = CANCELLED`.
  5. *[END]* Tình trạng ách tắc được giải tỏa dứt điểm.
- **Điểm ra quyết định (Decision Points)**: Quản lý đánh giá khả năng thi công tiếp tục ngoài hiện trường để chọn Resume, Reassign hay Cancel.
- **Hành vi tự động hóa của Hệ thống**: Tự động thông báo tới đúng nhân sự liên quan ngay khi Quản lý ra quyết định.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Nhân viên tự ý bấm Resume: Bị từ chối `ROLE_NOT_ALLOWED` (duy nhất Manager mới có quyền gỡ BLOCKED).
  - Báo sự cố không có ảnh chụp hoặc lý do rỗng: Báo lỗi `PRECONDITION_NOT_MET`, yêu cầu cung cấp minh chứng sự cố.
- **Bàn giao (Handoff)**: Từ Staff $\to$ Manager (khi báo sự cố) và từ Manager $\to$ Staff cũ/mới (khi gỡ sự cố).
- **Điều kiện kết thúc**: Nhiệm vụ rời khỏi trạng thái `BLOCKED` chuyển sang `IN_PROGRESS`, `PENDING` hoặc `CANCELLED`.
- **Trạng thái miền kết quả**: `IN_PROGRESS` (nếu Resume), `PENDING` (nếu Reassign), `CANCELLED` (nếu Cancel).
- **Yêu cầu kiểm toán**: `AUDIT_RECOMMENDED` cho báo cáo sự cố; `AUDIT_REQUIRED` cho quyết định gỡ ách tắc của Quản lý.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Khóa cứng mô hình **Ba lối thoát dứt điểm (Strict Three Exit Paths)**. Tuyệt đối không cho phép tạo thêm lối thoát thứ tư mơ hồ; bảo đảm toàn vẹn trách nhiệm giải trình giữa Quản lý và Nhân viên.
- **Bất biến được bảo vệ (Locked Invariants)**: Chỉ Quản lý mới được gỡ BLOCKED; Reassign từ BLOCKED phải bảo lưu tác giả bằng chứng cũ; cấm nhảy vọt từ BLOCKED sang COMPLETED hay WAITING_REVIEW.

---

### WF-09: Task Cancellation (Hủy bỏ nhiệm vụ vận hành)
- **Mã quy trình**: `WF-09`
- **Mục đích**: Chấm dứt vĩnh viễn một nhiệm vụ vận hành khi xuất hiện lý do chính đáng hoặc thay đổi kế hoạch từ cấp có thẩm quyền.
- **Kích hoạt (Trigger)**: Quản lý vận hành ra quyết định hủy bỏ công việc.
- **Tác nhân chính**: Operations Manager (`manager`).
- **Tác nhân phối hợp**: System.
- **Ngữ cảnh sở hữu**: `Work Management`.
- **Điều kiện vào (Entry Conditions)**:
  - Nhiệm vụ đang ở bất kỳ trạng thái phi kết thúc nào (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`).
  - Tác nhân đăng nhập có vai trò `manager` và trạng thái `ACTIVE`.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Quản lý chọn chức năng hủy nhiệm vụ trên màn hình chi tiết hoặc danh sách việc.
  2. Quản lý nhập lý do hủy việc bắt buộc bằng văn bản (`cancelReason`).
  3. Quản lý bấm xác nhận `CancelTask`.
  4. *[Hệ thống]* Kiểm tra trạng thái hiện tại: Đảm bảo không phải là `COMPLETED` hoặc `CANCELLED`.
  5. *[Hệ thống]* Cập nhật `TaskStatus = CANCELLED`, ghi nhận định danh người hủy (`cancelledByUserId`), thời điểm hủy (`cancelledAt`) và lý do văn bản vào thực thể `Cancellation`.
  6. *[Hệ thống]* Đóng nhiệm vụ vĩnh viễn (Terminal Void); bảo toàn toàn bộ dữ liệu lịch sử và các ảnh chụp nháp đã có phục vụ kiểm toán; **TUYỆT ĐỐI KHÔNG sinh bản ghi Lịch sử chăm sóc (`CareHistory`)**.
  7. *[Hệ thống]* Ghi sự kiện kiểm toán (`AUDIT_REQUIRED`), gửi thông báo hủy việc tới nhân viên liên quan.
  8. *[END]* Nhiệm vụ đóng vĩnh viễn, không thể thao tác thêm bất kỳ lệnh nào.
- **Điểm ra quyết định (Decision Points)**: Quản lý quyết định hủy việc dựa trên yêu cầu đột xuất hoặc sự cố thực địa bất khả kháng.
- **Hành vi tự động hóa của Hệ thống**: Tự động ngắt toàn bộ quyền chỉnh sửa của nhân viên trên nhiệm vụ bị hủy.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Cố tình hủy nhiệm vụ đã hoàn thành (`COMPLETED`): Bị chặn đứng `TERMINAL_RESOURCE` (`DR-HARD-05`).
  - Hủy việc mà để trống lý do: Báo lỗi `PRECONDITION_NOT_MET`, bắt buộc nhập lý do có nghĩa.
  - Staff hoặc Admin gọi lệnh hủy: Báo lỗi `ROLE_NOT_ALLOWED` (chỉ duy nhất Manager mới có thẩm quyền).
- **Bàn giao (Handoff)**: Từ Operations Manager $\to$ Sổ nhật ký kiểm toán (`Audit & Compliance`).
- **Điều kiện kết thúc**: Nhiệm vụ chuyển trạng thái sang `CANCELLED`.
- **Trạng thái miền kết quả**: `TaskStatus = CANCELLED`.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Minh định rõ **Trạng thái Đóng Bất biến (Terminal Immutability)**: Nhiệm vụ hủy là đóng vĩnh viễn, cấm xóa cứng vật lý khỏi cơ sở dữ liệu để phục vụ hậu kiểm tra soát.
- **Bất biến được bảo vệ (Locked Invariants)**: Hủy task không bao giờ sinh CareHistory (`DR-HARD-07`); task COMPLETED cấm bị hủy; dữ liệu lịch sử được bảo toàn nguyên vẹn.

---

## 4. Đặc Tả Chi Tiết Từng Quy Trình Quản Trị Nền Tảng (Governance Workflows WF-10..17)

### WF-10: User Provisioning (Khởi tạo tài khoản người dùng mới)
- **Mã quy trình**: `WF-10`
- **Mục đích**: Cấp phát danh tính và tài khoản truy cập an toàn cho nhân sự mới tham gia hệ thống.
- **Kích hoạt (Trigger)**: Yêu cầu tiếp nhận nhân sự mới từ bộ phận nhân sự/vận hành đô thị.
- **Tác nhân chính**: Platform Administrator (`admin`).
- **Tác nhân phối hợp**: System (tạo liên kết bảo mật/mã mời một lần).
- **Ngữ cảnh sở hữu**: `Identity & Access Management`.
- **Điều kiện vào (Entry Conditions)**:
  - Tác nhân có vai trò Platform Administrator đang `ACTIVE`.
  - Thông tin định danh (Email/Số điện thoại) chưa tồn tại trong hệ thống.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Admin truy cập giao diện Quản trị Người dùng, chọn chức năng tạo mới tài khoản (`ProvisionUser`).
  2. Admin nhập họ tên, thông tin liên lạc chính thức (Email/Phone) và chọn vai trò ban đầu (`staff`, `manager`, hoặc `admin`).
  3. Admin xác nhận tạo người dùng.
  4. *[Hệ thống]* Kiểm tra tính duy nhất của định danh; khởi tạo bản ghi `User` và `Account` ở trạng thái `INVITED` (hoặc `ACTIVE` kèm mật khẩu tạm thời bảo mật).
  5. *[Hệ thống]* Gắn bản ghi phân quyền vai trò ban đầu vào sổ theo dõi `RoleAssignment`.
  6. *[Hệ thống]* Ghi nhận sự kiện kiểm toán cấp phát người dùng mới (`AUDIT_REQUIRED`).
  7. *[Hệ thống]* Tự động phát liên kết thiết lập mật khẩu một lần an toàn qua kênh liên lạc chính thức của người dùng. Admin không được nhìn thấy mật khẩu dạng rõ.
  8. *[END]* Người dùng nhận liên kết, thiết lập mật khẩu cá nhân và kích hoạt tài khoản thành công.
- **Điểm ra quyết định (Decision Points)**: Admin lựa chọn vai trò ban đầu phù hợp với quyết định tuyển dụng.
- **Hành vi tự động hóa của Hệ thống**: Tạo mã thông báo thiết lập mật khẩu một lần (One-Time Token) có thời hạn ngắn, tự động mã hóa mật khẩu an toàn.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Trùng lặp Email/Phone: Báo lỗi `IDENTITY_ALREADY_EXISTS`, chặn tạo mới.
  - Tự đăng ký tự do ngoài màn hình đăng nhập: Bị từ chối `ACTION_REJECTED_BY_PRODUCT_MODEL` (NOVYX cấm hoàn toàn cơ chế tự do đăng ký tài khoản).
- **Bàn giao (Handoff)**: Từ Platform Administrator $\to$ Người dùng đầu cuối qua kênh thư/tin nhắn bảo mật.
- **Điều kiện kết thúc**: Bản ghi người dùng được tạo bền vững; sự kiện kiểm toán được ghi nối tiếp.
- **Trạng thái miền kết quả**: `AccountStatus = INVITED` hoặc `ACTIVE`.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Loại bỏ hoàn toàn sự tham gia của Quản lý vận hành trong luồng cấp phát danh tính kỹ thuật (chuyển 100% về IAM của Admin); Admin không cần duyệt thủ công mật khẩu của nhân viên.
- **Bất biến được bảo vệ (Locked Invariants)**: Cấm tự đăng ký tự do; Admin không được xem mật khẩu dạng rõ; Manager không có quyền tạo tài khoản người dùng.

---

### WF-11: Role Change & Assignment (Điều chỉnh phân quyền vai trò)
- **Mã quy trình**: `WF-11`
- **Mục đích**: Điều chỉnh vai trò người dùng phù hợp với quyết định điều chuyển nhân sự trong tổ chức.
- **Kích hoạt (Trigger)**: Quyết định bổ nhiệm, điều chuyển công tác hoặc thu hồi quyền hạn.
- **Tác nhân chính**: Platform Administrator (`admin`).
- **Tác nhân phối hợp**: System.
- **Ngữ cảnh sở hữu**: `Identity & Access Management`.
- **Điều kiện vào (Entry Conditions)**:
  - Tác nhân là Platform Administrator đang `ACTIVE`.
  - Tài khoản mục tiêu đang ở trạng thái `ACTIVE`.
  - Vai trò mới thuộc tập hợp hợp lệ `{'staff', 'manager', 'admin'}` và khác vai trò hiện tại.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Admin tra cứu người dùng cần điều chỉnh quyền, chọn chức năng phân quyền (`AssignRole`).
  2. Admin chọn vai trò mới và bắt buộc nhập lý do điều chỉnh quyền hạn bằng văn bản.
  3. *[Hệ thống]* Kiểm tra ràng buộc phân tách nhiệm vụ: Đảm bảo Admin không tự sửa đổi vai trò của chính mình (`ADM-SOD-01`).
  4. Admin bấm xác nhận điều chỉnh vai trò.
  5. *[Hệ thống]* Cập nhật vai trò mới cho tài khoản, thu hồi các phiên đăng nhập (Access Token) cũ để ép buộc xác thực lại quyền mới.
  6. *[Hệ thống]* Ghi lưu vết lịch sử vai trò cũ/mới, định danh người thực hiện, thời điểm và lý do vào `RoleAssignment` và phát sự kiện kiểm toán (`AUDIT_REQUIRED`).
  7. *[END]* Người dùng đăng nhập lại với quyền hạn mới; toàn bộ chữ ký tác giả trong các công việc quá khứ giữ nguyên vẹn.
- **Điểm ra quyết định (Decision Points)**: Admin xác minh tính hợp thức của văn bản yêu cầu điều chỉnh quyền trước khi thực hiện.
- **Hành vi tự động hóa của Hệ thống**: Tự động thu hồi phiên làm việc tức thời của người dùng bị đổi quyền.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Admin tự đổi quyền cho chính mình: Bị chặn đứng `ADM-SOD-01` (`SELF_ROLE_MUTATION_FORBIDDEN`).
  - Gán vai trò không tồn tại (ví dụ: `SuperAdmin`, `Guest`): Báo lỗi `ROLE_NOT_ALLOWED`.
- **Bàn giao (Handoff)**: Từ Platform Administrator $\to$ Kho lưu trữ kiểm toán `Audit & Compliance`.
- **Điều kiện kết thúc**: Vai trò mới được cập nhật; phiên làm việc cũ bị thu hồi; bản ghi kiểm toán được tạo.
- **Trạng thái miền kết quả**: `User.role` được cập nhật.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Phân tách rạch ròi: Đổi vai trò chỉ cập nhật thẩm quyền cho các hành động trong tương lai, **tuyệt đối không hồi tố hay viết lại quyền tác giả của các nhiệm vụ trong quá khứ**.
- **Bất biến được bảo vệ (Locked Invariants)**: Admin cấm tự sửa vai trò của mình; Manager cấm phân quyền; lịch sử vai trò được lưu trữ bất biến.

---

### WF-12: Account Suspension & Lifecycle (Khóa, Mở khóa, Vô hiệu hóa)
- **Mã quy trình**: `WF-12`
- **Mục đích**: Tạm dừng, mở lại hoặc chấm dứt vĩnh viễn quyền truy cập của tài khoản người dùng theo vòng đời nhân sự hoặc rủi ro an ninh.
- **Kích hoạt (Trigger)**: Nhân viên vi phạm kỷ luật, nghỉ phép dài ngày, nhập sai mật khẩu quá số lần quy định, hoặc chấm dứt hợp đồng lao động.
- **Tác nhân chính**: Platform Administrator (`admin`).
- **Tác nhân phối hợp**: System (thu hồi token) $\to$ Operations Manager (điều phối lại công việc tồn đọng).
- **Ngữ cảnh sở hữu**: `Identity & Access Management` (bàn giao sang `Work Management`).
- **Điều kiện vào (Entry Conditions)**:
  - Tác nhân là Platform Administrator đang `ACTIVE`.
  - Tài khoản mục tiêu tồn tại trong hệ thống.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Admin chọn tài khoản cần xử lý và chọn lệnh thao tác phù hợp:
     - **Lệnh A: `SuspendAccount` (Khóa tạm thời)**: Nhập lý do bằng văn bản $\to$ Chuyển trạng thái sang `SUSPENDED` $\to$ Lập tức thu hồi Access Token.
     - **Lệnh B: `ActivateAccount` / `UnlockAccount` (Mở khóa / Kích hoạt lại)**: Xác minh danh tính thành công $\to$ Chuyển trạng thái sang `ACTIVE` $\to$ Cấp phép đăng nhập lại.
     - **Lệnh C: `DisableAccount` (Vô hiệu hóa vĩnh viễn)**: Nhân sự nghỉ việc $\to$ Chuyển sang `DISABLED` $\to$ Thu hồi toàn bộ quyền vĩnh viễn, không xóa vật lý bản ghi.
  2. *[Hệ thống]* Ghi nhận dòng kiểm toán biến động tài khoản tương ứng (`AUDIT_REQUIRED`).
  3. **Handoff Xuyên Ngữ cảnh sang Work Management**:
     - *[Hệ thống]* Quét danh sách các nhiệm vụ đang gán cho nhân sự bị khóa:
       - **TUYỆT ĐỐI KHÔNG tự động hủy task (`TaskStatus` không bị đổi sang `CANCELLED`)**.
       - Đưa danh sách nhiệm vụ bị ảnh hưởng vào khu vực cảnh báo vận hành của Quản lý.
  4. Quản lý vận hành truy cập `Work Management` và xử lý:
     - Nếu task đang `PENDING`: Quản lý thực hiện đổi nhân viên khác (`ReassignTask Case A`).
     - Nếu task đang `IN_PROGRESS`: Yêu cầu phối hợp thực địa chuyển task sang `BLOCKED` rồi mới Reassign sang người mới.
  5. *[END]* Vòng đời tài khoản được kiểm soát chặt chẽ; công việc hiện trường không bị gián đoạn hay mất mát.
- **Điểm ra quyết định (Decision Points)**: Admin quyết định thời điểm khóa tài khoản; Quản lý quyết định phương án điều phối công việc dở dang.
- **Hành vi tự động hóa của Hệ thống**: Tự động thu hồi phiên làm việc nhưng cách ly không cho đột biến trực tiếp sang trạng thái công việc.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Kích hoạt lại tài khoản đã bị `DISABLED`: Báo lỗi `CANNOT_ACTIVATE_DISABLED_ACCOUNT` (tài khoản đã vô hiệu hóa nghỉ việc cấm mở lại).
- **Bàn giao (Handoff)**: Từ IAM (Admin) $\to$ Work Management (Manager) qua tín hiệu cảnh báo khả dụng nhân sự.
- **Điều kiện kết thúc**: Trạng thái tài khoản cập nhật bền vững; Quản lý tiếp nhận thông tin điều phối.
- **Trạng thái miền kết quả**: `AccountStatus = SUSPENDED`, `ACTIVE`, hoặc `DISABLED`.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Khóa cứng bất biến **Phân tách thẩm quyền xuyên ngữ cảnh (Cross-Context Isolation)**: Khóa tài khoản trong IAM tuyệt đối không tự động hủy task của Work Management, bảo vệ trọn vẹn quyền điều hành của Quản lý vận hành.
- **Bất biến được bảo vệ (Locked Invariants)**: IAM không tự hủy task; Admin không tự ý điều chuyển task thay Quản lý; dữ liệu người dùng cấm xóa vật lý.

---

### WF-13: Tree Master Data Governance (Quản trị dữ liệu gốc cây xanh)
- **Mã quy trình**: `WF-13`
- **Mục đích**: Quản lý vòng đời tài sản cây xanh đô thị, cập nhật thông tin thực vật học, cấp đổi mã tem QR hỏng và điều chỉnh tọa độ chuẩn trắc địa.
- **Kích hoạt (Trigger)**: Tiếp nhận cây mới trồng, kiểm kê định kỳ, tem QR bị rách ngoài hiện trường, hoặc có số liệu trắc địa đo đạc lại chính xác.
- **Tác nhân chính**: Platform Administrator (`admin`).
- **Tác nhân phối hợp**: System.
- **Ngữ cảnh sở hữu**: `Tree Asset Registry`.
- **Điều kiện vào (Entry Conditions)**:
  - Tác nhân là Platform Administrator đang `ACTIVE`.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Admin truy cập giao diện Sổ bộ Cây xanh (`Tree Asset Registry`), thực hiện một trong các lệnh quản trị:
     - **Tạo cây mới (`CreateTree`)**: Nhập mã định danh `treeId` duy nhất, mã tem `qrCode` ban đầu, chủng loại cây, và tọa độ GPS chuẩn $\to$ Cây được tạo ở trạng thái đang sinh trưởng.
     - **Sửa thông tin gốc (`UpdateTreeMasterData`)**: Cập nhật chiều cao, đường kính thân, tình trạng tán lá $\to$ Bắt buộc nhập lý do điều chỉnh $\to$ Lưu vết cập nhật.
     - **Cấp đổi mã QR (`ReplaceTreeQrCode`)**: Nhận báo cáo tem hỏng từ hiện trường $\to$ Cấp chuỗi `qrCode` mới $\to$ Giữ nguyên bất biến `treeId` $\to$ Cập nhật vào Master Data.
     - **Đo đạc lại GPS chuẩn (`UpdateCanonicalCoordinates`)**: Có biên bản trắc địa mới $\to$ Cập nhật kinh độ, vĩ độ chuẩn của gốc cây $\to$ Giữ nguyên `treeId`.
     - **Thanh lý cây (`RetireTree`)**: Cây đã chết hoặc đốn hạ $\to$ Chuyển trạng thái cây sang `RETIRED` $\to$ Ngăn chặn tạo task mới cho cây này về sau.
  2. *[Hệ thống]* Kiểm tra tính hợp lệ, tính duy nhất của mã QR/tọa độ, ghi cập nhật bền vững vào Master Data.
  3. *[Hệ thống]* Ghi dòng sự kiện kiểm toán tài sản (`AUDIT_REQUIRED`).
  4. *[END]* Dữ liệu cây xanh được cập nhật; toàn bộ các nhiệm vụ lịch sử trong quá khứ giữ nguyên vẹn bản chụp tọa độ và QR đã đo.
- **Điểm ra quyết định (Decision Points)**: Admin đối soát căn cứ thực địa trước khi cấp đổi mã tem QR hoặc thanh lý cây.
- **Hành vi tự động hóa của Hệ thống**: Tự động chặn khởi tạo nhiệm vụ mới đối với các cây mang trạng thái `RETIRED`.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Cấp đổi mã QR trùng với cây khác: Báo lỗi `QR_CODE_ALREADY_EXISTS`, chặn trùng lặp.
  - Sửa đổi `treeId`: Bị từ chối `IMMUTABLE_IDENTIFIER` (`treeId` là bất biến vĩnh viễn).
- **Bàn giao (Handoff)**: Dữ liệu Master Data sẵn sàng cho các lệnh đọc tra cứu của Manager và Staff.
- **Điều kiện kết thúc**: Bản ghi cây trong sổ bộ Master Data được cập nhật thành công.
- **Trạng thái miền kết quả**: Cập nhật thuộc tính của thực thể `Tree`.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Tách bạch rõ rệt: Cấp đổi tem `qrCode` trong Master Data **tuyệt đối không sửa đổi hay làm sai lệch kết quả quét QR trong các bản ghi `SiteVerification` của các task đã hoàn thành trong quá khứ**.
- **Bất biến được bảo vệ (Locked Invariants)**: `treeId` bất biến vĩnh viễn; cấm xóa vật lý hồ sơ cây; Staff và Manager không có quyền sửa Master Data.

---

### WF-14: TaskType Catalog Governance (Quản trị danh mục loại việc)
- **Mã quy trình**: `WF-14`
- **Mục đích**: Thiết lập, kích hoạt hoặc ngưng áp dụng các loại hình công việc bảo dưỡng, can thiệp cây xanh trong toàn đô thị.
- **Kích hoạt (Trigger)**: Ban hành quy trình kỹ thuật lâm sinh đô thị mới hoặc ngưng áp dụng một loại hình tác nghiệp lỗi thời.
- **Tác nhân chính**: Platform Administrator (`admin`).
- **Tác nhân phối hợp**: System.
- **Ngữ cảnh sở hữu**: `Policy & Template Governance`.
- **Điều kiện vào (Entry Conditions)**:
  - Tác nhân là Platform Administrator đang `ACTIVE`.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Admin truy cập Danh mục công việc (`TaskTypeCatalog`).
  2. Thực hiện hành động quản trị:
     - **Tạo mới (`CreateTaskType`)**: Nhập mã định danh bền vững `taskTypeId`, tên hiển thị, mô tả kỹ thuật, và gắn kèm chính sách bằng chứng bắt buộc (`ProofProfile`). Tạo ở trạng thái `ACTIVE`.
     - **Tạm ngưng (`DeactivateTaskType`)**: Chọn loại việc không còn nhu cầu $\to$ Chuyển trạng thái sang `INACTIVE` $\to$ Loại việc bị ẩn khỏi màn hình tạo task của Quản lý.
     - **Kích hoạt lại (`ActivateTaskType`)**: Chuyển trạng thái loại việc từ `INACTIVE` sang `ACTIVE`.
  3. *[Hệ thống]* Ghi nhận thay đổi vào Catalog, ghi sự kiện kiểm toán (`AUDIT_REQUIRED`).
  4. *[END]* Danh mục loại việc sẵn sàng cho Quản lý chọn lựa khi giao việc mới.
- **Điểm ra quyết định (Decision Points)**: Admin xác định chính sách áp dụng loại công việc.
- **Hành vi tự động hóa của Hệ thống**: Tự động lọc chỉ hiển thị loại việc `ACTIVE` khi Manager tạo task.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Yêu cầu xóa cứng một `TaskType` đã từng có task thực hiện: Bị chặn đứng `HARD_DELETE_FORBIDDEN` (chỉ được phép chuyển sang `INACTIVE` để bảo toàn toàn vẹn tham chiếu lịch sử).
- **Bàn giao (Handoff)**: Từ Policy Governance $\to$ Work Management (dưới dạng danh mục đọc khả dụng).
- **Điều kiện kết thúc**: Trạng thái `TaskType` trong Catalog được cập nhật.
- **Trạng thái miền kết quả**: `TaskType.status = ACTIVE` hoặc `INACTIVE`.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Quản lý vận hành bị tước bỏ quyền tự gõ loại việc tùy tiện ngoài hiện trường; 100% nhiệm vụ phải tuân thủ danh mục chuẩn hóa của đô thị.
- **Bất biến được bảo vệ (Locked Invariants)**: Cấm xóa cứng TaskType đã có dữ liệu tham chiếu; thay đổi nghiệp vụ lớn phải tạo TaskType mới thay vì sửa đè ngữ nghĩa.

---

### WF-15: Proof Policy Mapping Governance (Quản trị chính sách bằng chứng)
- **Mã quy trình**: `WF-15`
- **Mục đích**: Thiết lập và ban hành phiên bản quy tắc ánh xạ bắt buộc từ loại việc sang hồ sơ bằng chứng (`TaskType -> ProofProfile`).
- **Kích hoạt (Trigger)**: Cập nhật tiêu chuẩn nghiệm thu kỹ thuật cây xanh đô thị.
- **Tác nhân chính**: Platform Administrator (`admin`).
- **Tác nhân phối hợp**: System.
- **Ngữ cảnh sở hữu**: `Policy & Template Governance`.
- **Điều kiện vào (Entry Conditions)**:
  - Tác nhân là Platform Administrator đang `ACTIVE`.
  - Mỗi `TaskType` bắt buộc ánh xạ tới chính xác một trong 3 hồ sơ chuẩn: `CHANGE_PROOF`, `SERVICE_PROOF`, hoặc `INSPECTION_PROOF`.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Admin mở cấu hình chính sách bằng chứng (`ProofPolicyMapping`).
  2. Admin thiết lập ánh xạ loại việc sang ProofProfile phù hợp, đánh số phiên bản mới (`policyVersionId`), nhập lý do ban hành.
  3. Admin bấm ban hành chính sách mới (`PublishProofPolicyVersion`).
  4. *[Hệ thống]* Đóng dấu thời gian, kích hoạt phiên bản chính sách mới cho toàn bộ các nhiệm vụ được tạo trong tương lai.
  5. *[Hệ thống]* Ghi sự kiện kiểm toán chính sách (`AUDIT_REQUIRED`).
  6. *[END]* Các task tạo mới sau thời điểm này sẽ tự động gắn `policyVersionId` mới; toàn bộ các task đang chạy hoặc đã đóng giữ nguyên bản hợp đồng cũ.
- **Điểm ra quyết định (Decision Points)**: Phân loại tính chất công việc để gán đúng ProofProfile tương ứng.
- **Hành vi tự động hóa của Hệ thống**: Cố định phiên bản chính sách theo từng task tại thời điểm tạo, áp dụng tất định khi nhân viên nộp việc.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Quản lý cố tình chọn hạ cấp profile cho 1 task: Bị chặn đứng `DR-MVP-02` (ánh xạ là bất biến và quản trị tập trung).
- **Bàn giao (Handoff)**: Từ Policy Governance $\to$ Work Management qua tham chiếu `policyVersionId`.
- **Điều kiện kết thúc**: Phiên bản chính sách mới được kích hoạt bền vững.
- **Trạng thái miền kết quả**: Ban hành bản ghi `ProofPolicyVersion` mới.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: **Không áp dụng hồi tố (No Retroactive Application)**: Chính sách mới chỉ áp dụng cho nhiệm vụ tương lai, loại bỏ hoàn toàn tình trạng task đang chạy dở bị bắt bẻ nộp thêm ảnh ngoài hợp đồng ban đầu.
- **Bất biến được bảo vệ (Locked Invariants)**: Mỗi TaskType ánh xạ đúng 1 ProofProfile; cấm Quản lý hạ cấp profile từng việc; task cũ giữ nguyên hợp đồng ban đầu.

---

### WF-16: Checklist Template Versioning (Quản trị phiên bản mẫu checklist)
- **Mã quy trình**: `WF-16`
- **Mục đích**: Xây dựng, cập nhật và ban hành các phiên bản biểu mẫu checklist kiểm tra kỹ thuật chuẩn hóa.
- **Kích hoạt (Trigger)**: Thay đổi quy chuẩn kiểm tra an toàn hoặc bổ sung tiêu chí nghiệm thu cây xanh.
- **Tác nhân chính**: Platform Administrator (`admin`).
- **Tác nhân phối hợp**: System.
- **Ngữ cảnh sở hữu**: `Policy & Template Governance`.
- **Điều kiện vào (Entry Conditions)**:
  - Tác nhân là Platform Administrator đang `ACTIVE`.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Admin truy cập công cụ quản trị biểu mẫu checklist (`ChecklistTemplate`).
  2. Admin soạn thảo danh sách các câu hỏi tiêu chí kỹ thuật, đánh số thứ tự, xác định câu hỏi bắt buộc.
  3. Admin đánh số phiên bản mới (`templateVersionId`), nhập lý do sửa đổi và bấm ban hành (`PublishChecklistTemplateVersion`).
  4. *[Hệ thống]* Lưu trữ phiên bản mẫu mới ở trạng thái hoạt động; các task được bấm `StartTask` trong tương lai sẽ chụp bản mẫu này vào `ChecklistSnapshot`.
  5. *[Hệ thống]* Ghi nhận sự kiện kiểm toán mẫu biểu (`AUDIT_REQUIRED`).
  6. *[END]* Biểu mẫu checklist mới sẵn sàng cho các ca thi công tiếp theo.
- **Điểm ra quyết định (Decision Points)**: Phê duyệt nội dung các tiêu chí kỹ thuật chuẩn mực.
- **Hành vi tự động hóa của Hệ thống**: Tự động snapshot nguyên vẹn biểu mẫu vào task khi bấm `StartTask`.
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Soạn thảo checklist rỗng hoặc không có câu hỏi: Báo lỗi `PRECONDITION_NOT_MET`, từ chối ban hành.
- **Bàn giao (Handoff)**: Từ Policy Governance $\to$ Work Management (`ChecklistSnapshot` của từng Task).
- **Điều kiện kết thúc**: Phiên bản biểu mẫu mới được ban hành chính thức.
- **Trạng thái miền kết quả**: Ban hành bản ghi `ChecklistTemplateVersion` mới.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED`.
- **Phát hiện tối ưu hóa (Optimization Finding)**: Sử dụng kỹ thuật **Bản chụp độc lập (Decoupled Snapshotting)**: Ban hành mẫu mới tuyệt đối không làm thay đổi câu hỏi hay câu trả lời trong các task đang chạy hoặc đang chờ duyệt.
- **Bất biến được bảo vệ (Locked Invariants)**: Nhân viên cấm sửa mẫu gốc; Quản lý cấm sửa câu trả lời của nhân viên; snapshot của task là bất biến.

---

### WF-17: Audit Log Inspection (Thanh tra & tra cứu sổ nhật ký kiểm toán)
- **Mã quy trình**: `WF-17`
- **Mục đích**: Cung cấp khả năng thanh tra, giám sát độc lập toàn bộ các biến động dữ liệu và quyết định nghiệp vụ trọng yếu trong hệ thống.
- **Kích hoạt (Trigger)**: Hoạt động thanh tra định kỳ, hậu kiểm an ninh hoặc điều tra sự cố vận hành đô thị.
- **Tác nhân chính**: Platform Administrator (`admin`).
- **Tác nhân phối hợp**: System (truy vấn kho lưu trữ append-only).
- **Ngữ cảnh sở hữu**: `Audit & Compliance`.
- **Điều kiện vào (Entry Conditions)**:
  - Tác nhân có vai trò Platform Administrator đang `ACTIVE`.
- **Luồng thành công chuẩn tắc (Happy Path)**:
  1. *[START]* Admin mở phân hệ Nhật ký Kiểm toán (`ViewAuditLog`).
  2. Admin thiết lập bộ lọc tra cứu (`FilterAuditLog`): Khoảng thời gian, danh tính tác nhân thực hiện (`actorId`), loại hành vi (`actionType`), hoặc thực thể đích (`resourceId`).
  3. *[Hệ thống]* Kiểm tra quyền hạn, thực hiện truy vấn kho nhật ký kiểm toán chỉ-đọc (`Append-Only Store`).
  4. *[Hệ thống]* Hiển thị danh sách các bản ghi sự kiện kiểm toán toàn vẹn kèm đầy đủ thuộc tính: Thời điểm (`timestamp`), Tác nhân (`actorId`), Hành vi (`action`), Tài nguyên (`resource`), Trạng thái trước/sau và Lý do nghiệp vụ.
  5. *[Hệ thống]* Ghi nhận chính hành động truy cập tra cứu sổ kiểm toán của Admin vào nhật ký giám sát an ninh.
  6. *[END]* Admin hoàn thành việc tra cứu chứng cứ thanh tra.
- **Điểm ra quyết định (Decision Points)**: Lựa chọn tiêu chí thanh tra phù hợp với yêu cầu điều tra.
- **Hành vi tự động hóa của Hệ thống**: Tự động ghi nhận log đối với chính hành vi xem log của Admin (Meta-Audit).
- **Nhánh thất bại / Ngoại lệ (Failure Path)**:
  - Admin cố tình bấm nút sửa hoặc xóa dòng kiểm toán: Hệ thống cấm 100% (`ADM-SOD-03` - `AUDIT_MUTATION_FORBIDDEN`), không tồn tại bất kỳ API hay nút bấm nào cho phép sửa/xóa log.
  - Manager hoặc Staff cố tình truy cập: Bị chặn đứng `ROLE_NOT_ALLOWED`.
- **Bàn giao (Handoff)**: Dữ liệu trình bày trực tiếp cho Admin; không có bàn giao đột biến dữ liệu.
- **Điều kiện kết thúc**: Kết quả tra cứu được hiển thị an toàn.
- **Trạng thái miền kết quả**: Không làm biến đổi trạng thái của bất kỳ thực thể nghiệp vụ nào.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED` (ghi nhận việc truy cập kiểm toán).
- **Phát hiện tối ưu hóa (Optimization Finding)**: Tách bạch tuyệt đối giữa **Quyền xem kiểm toán và Quyền can thiệp dữ liệu**: Đọc nhật ký kiểm toán không cấp thêm bất kỳ quyền nào để Admin can thiệp vào tiến trình nhiệm vụ của Quản lý hay Nhân viên.
- **Bất biến được bảo vệ (Locked Invariants)**: Sổ kiểm toán là Append-Only vĩnh viễn; cấm sửa xóa log; Manager và Staff không có quyền đọc log kiểm toán hệ thống.

---

## 5. Đặc Tả Chi Tiết Quy Trình Kỹ Thuật Ngoại Tuyến (Technical Supporting Flow WF-18)

### WF-18: Offline Submission & Background Outbox Sync (Nộp offline & Đồng bộ ngầm)
- **Mã quy trình**: `WF-18`
- **Mục đích**: Đảm bảo nhân viên hiện trường làm việc liên tục trong điều kiện mất sóng di động hoặc mạng chập chờn mà không làm sai lệch máy trạng thái nghiệp vụ chuẩn tắc trên máy chủ.
- **Kích hoạt (Trigger)**: Nhân viên bấm nộp việc (`SubmitEvidence`) khi thiết bị đang ở trạng thái mất kết nối mạng (Offline).
- **Tác nhân chính**: Field Staff (thao tác nộp) $\to$ System (vận chuyển gói tin ngầm).
- **Ngữ cảnh sở hữu**: `Work Management` (tầng kỹ thuật Mobile Client & Integration).
- **Điều kiện vào (Entry Conditions)**:
  - `TaskStatus = IN_PROGRESS` trên thiết bị và trên Authoritative Server.
  - Hồ sơ bằng chứng đã đạt 100% chỉ tiêu theo `ProofProfile`.
- **Luồng hoạt động chuẩn tắc (Technical Sequence)**:
  1. *[START]* Nhân viên bấm "Nộp hồ sơ nghiệm thu" ngoài hiện trường khi không có sóng 4G/Wifi.
  2. *[Thiết bị di động]*:
     - Ghi nhận trạng thái đồng bộ máy khách: `LocalSubmissionStatus = PENDING_SYNC`.
     - Lưu trữ bền vững toàn bộ dữ liệu gói tin và file ảnh vào Bộ nhớ an toàn cục bộ (Durable Outbox Store).
     - Giao diện hiển thị nhãn trạng thái trực quan: *"Đã lưu trên máy — Chờ kết nối mạng để gửi duyệt"*.
  3. *[Máy chủ chuẩn tắc - Authoritative Server]*:
     - Trạng thái nhiệm vụ **VẪN LÀ `TaskStatus = IN_PROGRESS`**.
     - Tuyệt đối **KHÔNG TỒN TẠI** trạng thái nghiệp vụ `"OFFLINE_SUBMITTED"`.
  4. *[Khi thiết bị khôi phục kết nối Internet]*:
     - Dịch vụ đồng bộ nền (Background Outbox Worker) tự động đánh thức và gửi gói tin lên máy chủ.
     - **Trường hợp A: Đồng bộ Thành công (Sync Success)**:
       - Máy chủ tiếp nhận trọn vẹn dữ liệu, kiểm tra hợp lệ và chuyển trạng thái nhiệm vụ: `TaskStatus = WAITING_REVIEW`.
       - Máy chủ phản hồi mã thành công; thiết bị cập nhật: `LocalSubmissionStatus = SYNCED`.
       - Nhiệm vụ chính thức xuất hiện trên hàng đợi thẩm định của Quản lý.
     - **Trường hợp B: Đồng bộ Thất bại (Sync Failure - Rớt mạng giữa chừng / Lỗi kết nối)**:
       - Máy chủ giữ nguyên trạng thái: `TaskStatus = IN_PROGRESS`.
       - Thiết bị cập nhật trạng thái đồng bộ: `LocalSubmissionStatus = SYNC_FAILED`.
       - Hiển thị nút bấm "Thử gửi lại" (Manual Retry) cho nhân viên chủ động bấm khi mạng ổn định.
  5. *[END]* Quá trình đồng bộ hoàn tất, dữ liệu trên máy chủ phản ánh đúng trạng thái thực tế.
- **Điểm ra quyết định**: Không có quyết định con người; hệ thống máy móc xử lý vận chuyển gói tin.
- **Hành vi tự động hóa**: Cơ chế tự động thử lại có giãn cách lũy thừa (Exponential Backoff Retry) khi có mạng trở lại.
- **Nhánh thất bại / Ngoại lệ**: Mất mạng kéo dài $\to$ Dữ liệu vẫn được bảo vệ nguyên vẹn trong Outbox, không bao giờ bị mất ảnh hay checklist đã làm.
- **Bàn giao (Handoff)**: Từ Mobile Client Local Outbox $\to$ Authoritative Server API.
- **Điều kiện kết thúc**: Gói tin được máy chủ tiếp nhận hoặc được lưu bền vững chờ thử lại.
- **Trạng thái miền kết quả**: Chỉ khi máy chủ tiếp nhận thành công thì `TaskStatus` mới lên `WAITING_REVIEW`; nếu chưa đồng bộ thành công, task mãi mãi giữ nguyên `IN_PROGRESS`.
- **Yêu cầu kiểm toán**: `AUDIT_REQUIRED` (được ghi nhận khi máy chủ chính thức tiếp nhận và đổi state).
- **Phát hiện tối ưu hóa (Optimization Finding)**: **Tách biệt tuyệt đối giữa Trạng thái Đồng bộ kỹ thuật (`SyncStatus`) và Vòng đời Nghiệp vụ (`TaskStatus`)**. Ngăn chặn 100% lỗi sai kiến trúc phổ biến là đưa trạng thái nộp offline vào máy trạng thái máy chủ.
- **Bất biến được bảo vệ (Locked Invariants)**: Bấm nộp offline không tự chuyển state server (`DR-TECH-01`); không có trạng thái OFFLINE_SUBMITTED; kết nối mạng trở lại không đồng nghĩa với việc task tự động được duyệt.

---

## 6. Định Vị Các Quy Trình Kiểm Soát Giai Đoạn Tương Lai (Future Controlled Flows NEXT)

Tuân thủ nghiêm ngặt nguyên tắc **Khóa Phạm Vi MVP**, ba quy trình sau được bảo lưu ở trạng thái **`NEXT`**, tuyệt đối không kích hoạt hay cho phép tác nhân con người gọi lệnh trong phiên bản hiện hành:

### WF-NEXT-01: Dynamic Findings Template Governance (Biểu mẫu Khám bệnh Động)
- **Trạng thái**: **`NEXT` (Không kích hoạt trong MVP)**.
- **Bản chất**: Cho phép Platform Administrator tự thiết kế kéo-thả các trường thông số bệnh học cây linh hoạt.
- **Ranh giới khóa MVP**: Trong bản MVP, hệ thống áp dụng **Fixed Schema** cố định cho `StructuredFindings` (Độ nghiêng, Tỷ lệ mục rỗng, Sâu bệnh, Rủi ro cành khô). Tính năng bộ tạo form động được hoãn lại ở giai đoạn sau; nhân viên hiện trường vẫn thực hiện khám bệnh đầy đủ theo schema cố định mà không bị ảnh hưởng.

### WF-NEXT-02: Break-Glass Emergency Execution (Can thiệp Vượt quyền Khẩn cấp)
- **Trạng thái**: **`NEXT` (Không kích hoạt trong MVP)**.
- **Ranh giới kiểm soát tương lai (Future Controlled Boundary)**:
  1. *Kích hoạt khẩn cấp*: Chỉ xảy ra khi có thiên tai khẩn cấp (bão lũ cấp tập, cây đổ đè đường huyết mạch) hoặc sự cố kỹ thuật nghiêm trọng.
  2. *Ràng buộc bắt buộc*: Bắt buộc nhập lý do khẩn cấp bằng văn bản giải trình trách nhiệm cá nhân; chỉ cấp quyền can thiệp đặc biệt trong một phiên làm việc có giới hạn thời gian nghiêm ngặt (Time-boxed Session, tối đa 2 giờ).
  3. *Kiểm toán độc lập*: Tự động phát bản ghi kiểm toán cấp độ cao (`CRITICAL_AUDIT`) bất biến; tự động gửi cảnh báo khẩn cấp tới toàn bộ ban giám sát an ninh.
  4. *Hậu kiểm bắt buộc*: Sau phiên can thiệp, quyền tự động thu hồi và bắt buộc trải qua quy trình thanh tra độc lập (Post-Event Review).
  5. *Ranh giới MVP*: **HOÀN TOÀN BỊ KHÓA**. Không tác nhân nào (kể cả Admin) được sử dụng Break-Glass trong phạm vi bàn giao hiện tại.

### WF-NEXT-03: Security Governance Notifications (Cảnh báo An ninh Quản trị)
- **Trạng thái**: **`NEXT` (Không kích hoạt trong MVP)**.
- **Bản chất**: Hệ thống cảnh báo tự động qua SMS/Email bảo mật cho Ban Giám đốc khi phát hiện: Admin gán quyền cho Admin khác, khóa tài khoản hàng loạt hoặc kích hoạt phiên Break-Glass. Được bảo lưu phát triển đồng bộ khi phân hệ Break-Glass sẵn sàng.

---

## 7. Ma Trận Bàn Giao Xuyên Ngữ Cảnh Chuẩn Tắc (Canonical Cross-Context Handoff Matrix)

Bảng đối soát đảm bảo mọi điểm tiếp giáp bàn giao công việc giữa các tác nhân và giữa các Bounded Context đều được minh định rõ ràng, không có khoảng trống trách nhiệm:

| Mã Bàn Giao | Ngữ cảnh Giao | Tác nhân Giao | Ngữ cảnh Nhận | Tác nhân Nhận | Sự kiện Kích hoạt | Thực thể / Dữ liệu Bàn giao | Trạng thái Trước | Trạng thái Sau |
|:---:|---|---|---|---|---|---|:---:|:---:|
| **HO-01** | `Work Management` | Operations Manager | `Work Management` | Field Staff | Quản lý bấm `CreateTask` | Thực thể `Task` kèm `treeId`, loại việc, deadline | *(Khởi tạo)* | `PENDING` |
| **HO-02** | `Work Management` | Field Staff | `Work Management` | Hiện trường / Tự làm | Nhân viên bấm `StartTask` ngoài thực địa | Bắt đầu phiên thi công, snapshot checklist | `PENDING` | `IN_PROGRESS` |
| **HO-03** | `Work Management` | Field Staff | `Work Management` | Operations Manager | Nhân viên gặp trở ngại bấm `ReportFieldIssue` | Thực thể `FieldIssue` kèm ảnh hiện trường & lý do | `IN_PROGRESS` | `BLOCKED` |
| **HO-04** | `Work Management` | Operations Manager | `Work Management` | Field Staff (cũ/mới) | Quản lý giải quyết sự cố (`Resume` / `Reassign`) | Lệnh mở lại hoặc điều chuyển kèm bảo toàn bằng chứng | `BLOCKED` | `IN_PROGRESS` hoặc `PENDING` |
| **HO-05** | `Work Management` | Field Staff | `Work Management` | Operations Manager | Nhân viên hoàn tất thu thập bấm `SubmitEvidence` | Gói hồ sơ nghiệm thu (`SiteVerification` + Bằng chứng) | `IN_PROGRESS` | `WAITING_REVIEW` |
| **HO-06** | `Work Management` | Operations Manager | `Work Management` | Field Staff | Quản lý phát hiện sai sót bấm `RequestRework` | Thực thể `ReworkRequest` kèm chỉ định khâu hỏng | `WAITING_REVIEW` | `REWORK_REQUIRED` |
| **HO-07** | `Work Management` | Field Staff | `Work Management` | Operations Manager | Nhân viên sửa xong bấm `ResubmitRework` | Gói hồ sơ bổ sung phiên mới (`Attempt 2`) | `REWORK_REQUIRED` | `WAITING_REVIEW` |
| **HO-08** | `Work Management` | Operations Manager | `Tree Asset Registry` | Cây xanh mục tiêu | Quản lý bấm `Approve` hoặc `ApproveWithException` | Bản ghi kỹ thuật chính thức chiếu sang `CareHistory` | `WAITING_REVIEW` | `COMPLETED` |
| **HO-09** | `Work Management` | Operations Manager | `Audit & Compliance` | Sổ nhật ký kiểm toán | Quản lý bấm `CancelTask` | Thực thể `Cancellation` kèm lý do hủy văn bản | Phi kết thúc | `CANCELLED` |
| **HO-10** | `Identity & Access` | Platform Administrator | `Work Management` | Operations Manager | Admin khóa tài khoản nhân sự (`SuspendAccount`) | Tín hiệu cảnh báo khả dụng nhân sự có việc dở dang | `ACTIVE` | `SUSPENDED` |
| **HO-11** | Mọi Ngữ cảnh | Mọi Tác nhân | `Audit & Compliance` | Sổ nhật ký kiểm toán | Thực thi bất kỳ lệnh quản trị hoặc quyết định duyệt | Dữ liệu `AuditEvent` bất biến (`Append-Only`) | *N/A* | *N/A* |

---

## 8. Ma Trận Phân Tách Phán Quyết Con Người vs Tự Động Hóa Kỹ Thuật (Decision vs Automation Matrix)

Bảng phân định ranh giới tuyệt đối: Con người chịu trách nhiệm về ý chí và nghiệp vụ; Hệ thống chịu trách nhiệm tính toán và thực thi tất định:

| Hạng mục Công việc / Bước quy trình | Phán quyết Con người (Human Decision) | Tự động hóa Tất định (System Automation) | Tác nhân Chịu Trách nhiệm | Ranh giới Cấm Tự Quyết (Forbidden Discretion) |
|---|:---:|:---:|:---:|---|
| **Lựa chọn nhân viên làm việc** | **CÓ** | KHÔNG | Operations Manager | CẤM System tự ý phân công nhân sự thay Quản lý. |
| **Xác định ProofProfile từ TaskType** | KHÔNG | **CÓ** | System | CẤM Quản lý tự ý chọn hoặc hạ cấp Profile từng task. |
| **Kích hoạt bắt đầu làm việc** | **CÓ** | KHÔNG | Field Staff | Mở xem task hoặc mở camera CẤM tự động StartTask. |
| **Tính khoảng cách GPS ($\le 10$m)** | KHÔNG | **CÓ** | System | CẤM sửa tọa độ đo được; CẤM tự xóa cờ sai lệch. |
| **Quyết định giải trình ngoại lệ GPS/QR** | **CÓ** | KHÔNG | Field Staff | Nhân viên tự chịu trách nhiệm về văn bản giải trình. |
| **Đối soát tính đầy đủ của bằng chứng** | KHÔNG | **CÓ** | System | CẤM System cho nộp bài khi thiếu ảnh/checklist. |
| **Đồng bộ gói tin Outbox ngoại tuyến** | KHÔNG | **CÓ** | System | CẤM System tự nâng state server khi đồng bộ hỏng. |
| **Phê duyệt nghiệm thu công việc** | **CÓ** | KHÔNG | Operations Manager | CẤM TUYỆT ĐỐI cơ chế tự động duyệt `Auto-approval`. |
| **Chỉ định khâu cần làm lại (Rework)** | **CÓ** | KHÔNG | Operations Manager | Quản lý chịu trách nhiệm về đánh giá kỹ thuật lâm sinh. |
| **Gán vai trò người dùng (Assign Role)** | **CÓ** | KHÔNG | Platform Administrator | CẤM System tự phong quyền Admin cho bất kỳ ai. |
| **Ghi lưu vết kiểm toán (`AuditEvent`)** | KHÔNG | **CÓ** | System | CẤM sửa đổi, xóa bỏ hoặc chặn ghi nhật ký kiểm toán. |

---

## 9. Sổ Đăng Ký Tối Ưu Hóa Quy Trình (Optimization Register)

Rà soát toàn bộ các điểm ma sát nghiệp vụ để thực thi tối ưu hóa mà **không làm thay đổi ngữ nghĩa nghiệp vụ đã khóa**:

| Mã ID | Điểm Ma sát / Mơ hồ Trước đây | Giải pháp Tối ưu hóa Chuẩn mực Phase 5 | Có Đổi Ngữ nghĩa Nghiệp vụ? | Trạng thái Chấp thuận |
|:---:|---|---|:---:|:---:|
| **OPT-01** | Bắt Quản lý phải ngồi canh mạng duyệt từng lần quét QR/GPS tại thực địa | Chuyển việc kiểm tra GPS/QR thành thao tác tất định của thiết bị; Quản lý chỉ hậu kiểm tập trung tại cổng Review. | **KHÔNG** | **ACCEPTED (Đã tối ưu)** |
| **OPT-02** | Bắt buộc thứ tự cứng nhắc phải quét QR trước rồi mới được lấy GPS | Cho phép nhân viên thực hiện GPS và QR theo thứ tự tự do tùy điều kiện địa hình thực tế. | **KHÔNG** | **ACCEPTED (Đã tối ưu)** |
| **OPT-03** | Giao việc tưới nước bảo dưỡng định kỳ nhưng vẫn ép nhân viên chụp ảnh "Trước" | Tối ưu hóa UI theo `ProofProfile`: Công việc dịch vụ bảo dưỡng (`SERVICE_PROOF`) không bắt chụp ảnh Trước hình thức. | **KHÔNG** | **ACCEPTED (Đã tối ưu)** |
| **OPT-04** | Sai sót 1 khâu nhỏ nhưng hệ thống cũ bắt nhân viên làm lại toàn bộ từ đầu | Áp dụng vòng lặp làm lại có mục tiêu (`Targeted Rework`): Bảo lưu bằng chứng hợp lệ cũ, chỉ bắt chụp/sửa đúng khâu hỏng. | **KHÔNG** | **ACCEPTED (Đã tối ưu)** |
| **OPT-05** | Khóa tài khoản nhân sự trong IAM tự động làm đứt gãy và hủy hàng loạt nhiệm vụ | Phân tách ngữ cảnh: Khóa tài khoản chỉ cảnh báo nhân sự vắng mặt; Quản lý vận hành toàn quyền chủ động điều phối lại task. | **KHÔNG** | **ACCEPTED (Đã tối ưu)** |
| **OPT-06** | Đưa thêm một làn Admin vào sơ đồ vận hành thực địa khiến luồng bị rối | Loại bỏ 100% sự hiện diện của Admin trong quy trình hiện trường; Admin chỉ xuất hiện trong quản trị nền tảng và thanh tra. | **KHÔNG** | **ACCEPTED (Đã tối ưu)** |
| **OPT-REJ-01** | Đề xuất cho phép Hệ thống tự động duyệt nghiệm thu các task đủ ảnh (`Auto-approval`) | **BÁC BỎ HOÀN TOÀN**: Vi phạm bất biến an toàn `DR-POL-01`. 100% công việc cây xanh đô thị bắt buộc phải do Quản lý chịu trách nhiệm thẩm định. | **CÓ (Vi phạm an toàn)** | **REJECTED (Bác bỏ)** |
| **OPT-REJ-02** | Đề xuất cho phép Admin được duyệt task thay Quản lý khi Quản lý vắng mặt | **BÁC BỎ HOÀN TOÀN**: Vi phạm nguyên tắc phân tách nhiệm vụ `ADM-SOD-04`. Admin không có thẩm quyền vận hành thực địa. | **CÓ (Phá vỡ vai trò)** | **REJECTED (Bác bỏ)** |
| **OPT-REJ-03** | Đề xuất gộp chung trạng thái `BLOCKED` và `REWORK_REQUIRED` thành một trạng thái lỗi | **BÁC BỎ HOÀN TOÀN**: Trộn lẫn giữa trở ngại khách quan khi thi công (`BLOCKED`) và lỗi chất lượng chuyên môn do nhân viên làm ẩu (`REWORK`). | **CÓ (Phá máy trạng thái)** | **REJECTED (Bác bỏ)** |

---

## 10. Đánh Giá Tính Cần Thiết Từng Bước Quy Trình (Workflow Step Necessity Review)

Phân loại mức độ thiết yếu của từng bước nghiệp vụ nhằm chứng minh không có bước thừa thãi:

- **`REQUIRED_CONTROL`**: Chốt kiểm soát an toàn/nghiệp vụ bắt buộc (không thể bỏ).
- **`REQUIRED_BUSINESS_ACTION`**: Hành vi nghiệp vụ chủ động tất yếu của con người.
- **`DETERMINISTIC_AUTOMATION`**: Bước xử lý tự động của hệ thống, không làm phiền người dùng.
- **`OPTIONAL_GUIDANCE`**: Hướng dẫn thao tác giao diện tùy chọn.
- **`REDUNDANT — REMOVE`**: Bước thừa thãi, đã loại bỏ hoàn toàn khỏi mô hình chuẩn.

| Quy trình | Bước công việc cụ thể | Phân loại Tính cần thiết | Căn cứ Nghiệp vụ & Đánh giá Tối ưu |
|---|---|:---:|---|
| **WF-01** | Quản lý chọn cây và nhân viên phân công | `REQUIRED_BUSINESS_ACTION` | Quyết định điều phối nhân lực hiện trường của Quản lý. |
| **WF-01** | Quản lý duyệt cấu hình bằng chứng từng task | `REDUNDANT — REMOVE` | **Đã loại bỏ**: Hệ thống tự gán tất định theo `TaskType -> ProofProfile`. |
| **WF-02** | Bấm nút chủ động "Bắt đầu làm việc" (`StartTask`) | `REQUIRED_CONTROL` | Chốt ghi nhận mốc bắt đầu thực tế; ngăn ngừa tự động StartTask ngầm. |
| **WF-03** | Đo GPS kiểm tra khoảng cách $\le 10$m | `REQUIRED_CONTROL` | Đảm bảo nhân viên có mặt thực tế tại gốc cây, chống gian lận vị trí. |
| **WF-03** | Quét mã QR gắn trên thân cây | `REQUIRED_CONTROL` | Đảm bảo can thiệp đúng cây mục tiêu, chống làm nhầm cây khác. |
| **WF-03** | Quản lý ngồi duyệt từng lần quét QR/GPS | `REDUNDANT — REMOVE` | **Đã loại bỏ**: Thiết bị tự đối soát, Quản lý thẩm định tập trung tại Review. |
| **WF-04** | Điền biểu mẫu lâm sinh `StructuredFindings` | `REQUIRED_CONTROL` | Cốt lõi của công tác khảo sát sức khỏe cây xanh (`INSPECTION_PROOF`). |
| **WF-05** | Kiểm tra đủ 100% bằng chứng trước khi cho nộp | `DETERMINISTIC_AUTOMATION` | Chặn đứng hồ sơ rác, giảm tải công sức thẩm định cho Quản lý. |
| **WF-06** | Quản lý thẩm định toàn bộ hồ sơ nghiệm thu | `REQUIRED_CONTROL` | Điểm chịu trách nhiệm pháp lý và kỹ thuật cuối cùng của tổ chức. |
| **WF-07** | Bảo lưu chứng cứ cũ và chỉ định khâu sửa | `REQUIRED_CONTROL` | Tránh lãng phí công sức nhân viên, bảo toàn trách nhiệm giải trình. |
| **WF-08** | Quản lý gỡ ách tắc qua 3 lối thoát dứt điểm | `REQUIRED_BUSINESS_ACTION` | Phán quyết giải quyết trở ngại vận hành hiện trường. |
| **WF-09** | Bắt buộc nhập lý do bằng văn bản khi hủy việc | `REQUIRED_CONTROL` | Ngăn chặn việc hủy nhiệm vụ tùy tiện, phục vụ hậu kiểm tra soát. |
| **WF-12** | IAM khóa tài khoản tự hủy task công việc | `REDUNDANT — REMOVE` | **Đã loại bỏ**: Tránh xung đột thẩm quyền, nhường quyền điều phối cho Quản lý. |

---

## 11. Kiểm Soát Sự Hiện Diện Của Admin Trong Các Luồng Nghiệp Vụ (Field Flow Integrity Audit)

Thực hiện kiểm tra nghiêm ngặt nguyên tắc **Admin không tự động có làn (Lane) trong sơ đồ vận hành hiện trường**:

| Luồng Vận hành Thực địa | Field Staff có mặt? | Operations Manager có mặt? | System có mặt? | Admin có mặt? | Đánh giá Tuân thủ Quy tắc |
|---|:---:|:---:|:---:|:---:|:---:|
| **WF-01: Task Creation & Assignment** | CÓ (Nhận việc) | **CÓ (Khởi tạo)** | CÓ (Gán profile) | **CẤM (100% DENY)** | **PASS (Đúng ranh giới)** |
| **WF-02: Task Execution Initiation** | **CÓ (Bắt đầu việc)** | KHÔNG | CÓ (Snapshot mẫu) | **CẤM (100% DENY)** | **PASS (Đúng ranh giới)** |
| **WF-03: Site Verification** | **CÓ (Đo đạc/quét)** | KHÔNG | CÓ (So khớp tọa độ) | **CẤM (100% DENY)** | **PASS (Đúng ranh giới)** |
| **WF-04: Proof Acquisition** | **CÓ (Thu thập ảnh)** | KHÔNG | CÓ (Lưu trữ attempt) | **CẤM (100% DENY)** | **PASS (Đúng ranh giới)** |
| **WF-05: Evidence Submission** | **CÓ (Bấm nộp)** | KHÔNG | CÓ (Gác cổng hợp đồng) | **CẤM (100% DENY)** | **PASS (Đúng ranh giới)** |
| **WF-06: Review & Quality Approval** | KHÔNG | **CÓ (Phê duyệt)** | CÓ (Chiếu CareHistory) | **CẤM (100% DENY)** | **PASS (Đúng ranh giới)** |
| **WF-07: Targeted Rework Loop** | **CÓ (Sửa lỗi)** | **CÓ (Chỉ định lỗi)** | CÓ (Bảo tồn chứng cứ) | **CẤM (100% DENY)** | **PASS (Đúng ranh giới)** |
| **WF-08: Blocked Resolution** | **CÓ (Báo sự cố)** | **CÓ (Gỡ ách tắc)** | CÓ (Phát cảnh báo) | **CẤM (100% DENY)** | **PASS (Đúng ranh giới)** |
| **WF-09: Task Cancellation** | KHÔNG | **CÓ (Ra lệnh hủy)** | CÓ (Lưu vết đóng việc) | **CẤM (Chế độ thường)** | **PASS (Đúng ranh giới)** |

> **Kết luận**: Trên toàn bộ 9 quy trình tác nghiệp thực địa, Platform Administrator **hoàn toàn không có bất kỳ làn bơi (Swimlane) hay nút hành động nào**. Admin chỉ xuất hiện tại các quy trình Quản trị nền tảng (`WF-10..17`) và phiên khẩn cấp tương lai (`WF-NEXT-02`).

---

## 12. Danh Mục Các Đường Xử Lý Thất Bại & Phục Hồi (Failure & Exception Recovery Paths)

Đảm bảo 100% các tình huống rủi ro/lỗi đều có đường phục hồi tất định, không có điểm nghẽn vô chủ:

| Tình huống Lỗi / Ngoại lệ Phát sinh | Quy trình Bị ảnh hưởng | Cơ chế Phục hồi Chuẩn mực (Recovery Path) | Trạng thái Kết thúc |
|---|---|---|:---:|
| **Cây mục tiêu đã bị đốn hạ (`RETIRED`)** | WF-01 | Báo lỗi ngay trên màn hình tạo task; Quản lý chọn cây khác đang hoạt động. | Không sinh Task |
| **Nhân sự được gán đang bị khóa tài khoản** | WF-01 | Chặn phân công; Quản lý chọn nhân viên khác đang `ACTIVE`. | Không sinh Task |
| **Nhân viên cố bấm bắt đầu task của người khác** | WF-02 | Chặn quyền truy cập `RESOURCE_SCOPE_MISMATCH`; hiển thị cảnh báo vi phạm. | `PENDING` |
| **GPS trôi dạt $> 10$m sau nhiều lần đo lại** | WF-03 | Cho phép kích hoạt `LOCATION_EXCEPTION` kèm ảnh và văn bản giải trình để Quản lý hậu kiểm. | `IN_PROGRESS` (mang cờ ngoại lệ) |
| **Tem QR bị rách/mờ/mất tem vật lý** | WF-03 | Kích hoạt `IDENTITY_EXCEPTION`, chụp ảnh gốc cây thiếu tem, nhập mã số dập nổi đối chiếu. | `IN_PROGRESS` (mang cờ ngoại lệ) |
| **Quên chụp ảnh Trước nhưng đã cắt tỉa xong** | WF-04 | Cấm chụp ảnh giả mạo; báo cáo `EVIDENCE_INTEGRITY_EXCEPTION` để Quản lý xử lý trách nhiệm. | `IN_PROGRESS` (chờ xử lý) |
| **Hồ sơ nghiệm thu nộp lên bị thiếu chỉ tiêu** | WF-05 | Chặn chuyển trạng thái; hiển thị rõ danh sách các mục thiếu để nhân viên bổ sung ngay. | `IN_PROGRESS` |
| **Mất kết nối mạng Internet khi bấm nộp bài** | WF-05, WF-18 | Lưu bền vững vào Mobile Outbox (`PENDING_SYNC`); chờ khôi phục mạng tự động gửi lại. | `IN_PROGRESS` (Local: `PENDING_SYNC`) |
| **Đồng bộ ngầm bị đứt đoạn mạng giữa chừng** | WF-18 | Cập nhật `LocalSubmissionStatus = SYNC_FAILED`; cung cấp nút "Thử gửi lại" thủ công. | `IN_PROGRESS` (Local: `SYNC_FAILED`) |
| **Hồ sơ bị Quản lý phát hiện sai sót kỹ thuật** | WF-06, WF-07 | Chuyển sang `REWORK_REQUIRED`, chỉ định khâu sai sót; nhân viên bổ sung đúng khâu hỏng. | `REWORK_REQUIRED` |
| **Hiện trường gặp chướng ngại vật cản trở thi công** | WF-08 | Nhân viên bấm `ReportFieldIssue` $\to$ Chuyển sang `BLOCKED` $\to$ Quản lý quyết định tháo gỡ. | `BLOCKED` |
| **Nhân viên đang thi công thì gặp tai nạn/ốm đau** | WF-08 | Chuyển task sang `BLOCKED` $\to$ Quản lý thực hiện Reassign Case B về `PENDING` cho người mới. | `PENDING` (gán người mới) |
| **Nhân sự thi công bị Admin khóa tài khoản IAM** | WF-12 | Cảnh báo sang bảng điều hành của Quản lý $\to$ Quản lý chủ động Reassign hoặc hủy task. | `PENDING` hoặc `BLOCKED` |

---

## 13. Ghi Nhận Khoảng Trống Hiện Thực Hóa Hiện Tại (Current Implementation Gap Register)

> **Lưu ý kiểm soát phạm vi**: Bảng ghi nhận khiếm khuyết kỹ thuật làm căn cứ đối soát; **TUYỆT ĐỐI KHÔNG SỬA CODE TẠI PHASE 5**. Việc khắc phục mã nguồn được ấn định thực hiện tại **Giai đoạn Hiện thực hóa sau khi chấp thuận Kiến trúc ADR (Post-ADR Implementation)**.

| STT | Tập tin Nguồn (File) | Ký hiệu / Dòng mã (Symbol / Line) | Khiếm khuyết Quy trình trong Mã nguồn Hiện tại (Current Defect) | Quy trình Chuẩn tắc Cần Đạt (Target Workflow Rule) | Giai đoạn Khắc phục Ấn định |
|:---:|---|---|---|---|:---:|
| 1 | `apps/mobile/src/services/greenOpsService.ts` | Luồng nộp bài và duyệt việc | Chưa hiện thực hóa đầy đủ quy trình 4 kết luận duyệt (`ApproveWithException` chưa có form nhập lý do giải trình). | Bổ sung đầy đủ giao diện và payload cho 4 kết luận duyệt của Quản lý (`WF-06`). | Post-ADR Implementation / Review Hub |
| 2 | `apps/mobile/src/screens/TaskDetailScreen.tsx` | Màn hình chi tiết công việc | Thiếu luồng báo cáo ngoại lệ toàn vẹn bằng chứng (`EVIDENCE_INTEGRITY_EXCEPTION`) khi lỡ cắt tỉa cây trước khi chụp ảnh. | Hiện thực hóa quy trình báo cáo ngoại lệ toàn vẹn không cho phép ngụy tạo ảnh chụp (`WF-04`). | Post-ADR Implementation / Evidence Integrity |
| 3 | `apps/mobile/src/services/greenOpsService.ts` | Xử lý sự cố hiện trường | Thiếu đầy đủ 3 lối thoát cho `BLOCKED` (chưa có chức năng điều chuyển Reassign trực tiếp từ màn hình sự cố). | Hiện thực hóa trọn vẹn 3 lối thoát: Resume, Reassign (về PENDING), Cancel (`WF-08`). | Post-ADR Implementation / Blocked Resolution |
| 4 | `apps/mobile/src/screens/MobileApp.tsx` | Điều hướng giao diện | Luồng giao diện Admin đang bị lẫn lộn vào giao diện Quản lý vận hành (Admin nhìn thấy danh sách việc của Manager). | Tách biệt hoàn toàn luồng giao diện và điều hướng của Admin sang phân hệ Quản trị nền tảng (`WF-10..17`). | Post-ADR Implementation / UI Separation |

---

## 14. Thử Nghiệm Phủ Định Quy Trình Nghiệp Vụ (Negative Workflow Tests WF-NT-01..18)

Đánh giá 18 kịch bản sai lệch quy trình nhằm chứng minh tính chặt chẽ tuyệt đối của mô hình Phase 5:

| Mã Ca Kiểm Thử | Kịch bản Sai lệch Quy trình Giả định | Kết quả Mong đợi | Đánh giá Thực tế trong Mô hình Phase 5 | Kết luận |
|---|---|:---:|---|:---:|
| **WF-NT-01** | Admin xuất hiện xen ngang giữa Staff và Manager trong quy trình thẩm định nhiệm vụ. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi Mục 11 và `ADM-SOD-04`. Admin không có làn nào trong quy trình Review (`WF-06`). | **PASS** |
| **WF-NT-02** | Manager tự ý chọn hạ cấp hồ sơ bằng chứng `ProofProfile` khi tạo từng nhiệm vụ đơn lẻ. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-01` và `DR-MVP-02`. Hệ thống tự động phân giải Profile tất định theo `TaskType`. | **PASS** |
| **WF-NT-03** | Thao tác mở xem chi tiết công việc tự động kích hoạt chuyển `PENDING` $\to$ `IN_PROGRESS`. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-02` và `DR-MVP-04`. DUY NHẤT hành động bấm nút StartTask mới được chuyển trạng thái. | **PASS** |
| **WF-NT-04** | Thao tác đo GPS đạt chuẩn $\le 10$m tự động kích hoạt chuyển trạng thái nhiệm vụ. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-03`. Xác thực GPS chỉ đổi cờ nội bộ `SiteVerification`, không đổi `TaskStatus`. | **PASS** |
| **WF-NT-05** | Staff bắt buộc phải chờ Quản lý ngồi duyệt trực tuyến từng lần quét QR/GPS tại thực địa. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-03` và `OPT-01`. Thiết bị tự động xác thực tất định; Quản lý chỉ hậu kiểm tại Review. | **PASS** |
| **WF-NT-06** | Hồ sơ bằng chứng chưa đủ chỉ tiêu quy định vẫn chuyển được sang `WAITING_REVIEW`. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-05`. Hệ thống đóng vai trò gác cổng tự động, chặn đứng hồ sơ thiếu chỉ tiêu. | **PASS** |
| **WF-NT-07** | Bấm nộp hồ sơ offline tự động chuyển `TaskStatus` trên server sang `WAITING_REVIEW`. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-05` và `WF-18`. Nộp offline chỉ đổi cờ máy khách; máy chủ giữ nguyên `IN_PROGRESS`. | **PASS** |
| **WF-NT-08** | Hệ thống tự động phê duyệt hoàn tất công việc (`Auto-approval`) khi thấy ảnh đầy đủ. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-06` và `DR-POL-01`. 100% nhiệm vụ phải do Quản lý con người thẩm định và chịu trách nhiệm. | **PASS** |
| **WF-NT-09** | Yêu cầu làm lại (`RequestRework`) tự động xóa sạch toàn bộ bằng chứng hợp lệ của lần nộp 1. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-07` và `DR-HARD-03`. Toàn bộ bằng chứng cũ được bảo tồn nguyên vẹn đa phiên bản. | **PASS** |
| **WF-NT-10** | Nhiệm vụ ở trạng thái `BLOCKED` được mở thêm lối thoát thứ tư tự do ngoài 3 lối chuẩn. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-08`. Chỉ có đúng 3 lối thoát tất định: Resume, Reassign (về PENDING), hoặc Cancel. | **PASS** |
| **WF-NT-11** | Admin khóa tài khoản nhân sự thì ngữ cảnh IAM tự động hủy hàng loạt các task đang giao. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-12`. Khóa IAM không tự đổi TaskStatus; Quản lý vận hành toàn quyền xử lý task. | **PASS** |
| **WF-NT-12** | Admin thực hiện điều chuyển nhân viên tiếp quản (`ReassignTask`) cho nhiệm vụ hiện trường. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-12` và `P4-09`. Admin không có thẩm quyền can thiệp điều chuyển task vận hành. | **PASS** |
| **WF-NT-13** | Admin cấp đổi mã tem `qrCode` mới làm biến đổi kết quả quét QR của các task trong quá khứ. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-13`. Master Data đổi mã tem mới nhưng dữ liệu `SiteVerification` task cũ giữ nguyên. | **PASS** |
| **WF-NT-14** | Ban hành phiên bản chính sách bằng chứng mới làm thay đổi yêu cầu của các task đang chạy. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-15`. Chính sách mới không áp dụng hồi tố; task đang chạy giữ nguyên `policyVersionId`. | **PASS** |
| **WF-NT-15** | Kích hoạt phiên can thiệp khẩn cấp (`Break-Glass`) như một tính năng hoạt động trong bản MVP. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-NEXT-02`. Break-Glass được bảo lưu ở giai đoạn `NEXT`, hoàn toàn bị khóa tại MVP. | **PASS** |
| **WF-NT-16** | Nhiệm vụ bị hủy (`CANCELLED`) tự động sinh bản ghi chiếu Lịch sử chăm sóc `CareHistory`. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-09` và `DR-HARD-07`. DUY NHẤT task `COMPLETED` mới được phép sinh CareHistory. | **PASS** |
| **WF-NT-17** | Quản lý gọi lệnh điều chuyển nhân sự (`ReassignTask`) trực tiếp khi task đang `REWORK_REQUIRED`. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-07` và Ma trận trạng thái. `REWORK_REQUIRED` cấm Reassign trực tiếp. | **PASS** |
| **WF-NT-18** | Nhiệm vụ tại `REWORK_REQUIRED` gọi lệnh `ReportFieldIssue` để nhảy sang `BLOCKED`. | **`FAIL` (Bị chặn đứng)** | Bác bỏ bởi `WF-07`, `P4-SC-01`. Không tồn tại bước chuyển `REWORK_REQUIRED -> BLOCKED`. | **PASS** |

---

## 15. Ma Trận Nhất Quán Toàn Cục Các Quy Trình (Workflow Consistency Matrix)

Bảng đối soát tổng hợp đảm bảo 100% các quy trình nghiệp vụ đã được định nghĩa hoàn chỉnh, không có điểm TBD:

| Mã Quy trình | Tên Quy trình Nghiệp vụ | Tác nhân Tham gia | Trạng thái / Điều kiện Vào | Trạng thái / Điều kiện Ra | Điểm Bàn giao Chính | Yêu cầu Kiểm toán | Trạng thái Sản phẩm | Đánh giá Nhất quán |
|:---:|---|---|---|---|---|:---:|:---:|:---:|
| **WF-01** | Task Creation & Assignment | Manager, System | Cây tồn tại, TaskType ACTIVE | `PENDING` | Manager $\to$ Staff | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-02** | Task Execution Initiation | Staff, System | `PENDING` | `IN_PROGRESS` | Staff $\to$ Bản thân | `NO_BUSINESS_AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-03** | Site Verification | Staff, System | `IN_PROGRESS` | `IN_PROGRESS` | Lưu `SiteVerification` | `NO_BUSINESS_AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-04** | Proof Acquisition | Staff, System | `IN_PROGRESS` | `IN_PROGRESS` | Lưu `TaskEvidence` | `NO_BUSINESS_AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-05** | Evidence Submission | Staff, System | `IN_PROGRESS` | `WAITING_REVIEW` | Staff $\to$ Manager Queue | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-06** | Review & Quality Approval | Manager, System | `WAITING_REVIEW` | `COMPLETED` | Manager $\to$ Tree Registry | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-07** | Targeted Rework Loop | Manager, Staff, System | `WAITING_REVIEW` | `WAITING_REVIEW` | Manager $\leftrightarrow$ Staff | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-08** | Blocked Resolution | Staff, Manager, System | `IN_PROGRESS` | `IN_PROGRESS` / `PENDING` | Staff $\to$ Manager $\to$ Staff | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-09** | Task Cancellation | Manager, System | Phi kết thúc | `CANCELLED` | Manager $\to$ Audit Store | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-10** | User Provisioning | Admin, System | Tác nhân Admin ACTIVE | `INVITED` / `ACTIVE` | Admin $\to$ Người dùng | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-11** | Role Change | Admin, System | User mục tiêu ACTIVE | User cập nhật role | Admin $\to$ Audit Store | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-12** | Account Suspension | Admin, Manager, System | User mục tiêu ACTIVE | User `SUSPENDED` | IAM $\to$ Work Management | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-13** | Tree Master Data Governance | Admin, System | Tác nhân Admin ACTIVE | Cây cập nhật Master Data | Admin $\to$ Master Data Store | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-14** | TaskType Catalog Governance | Admin, System | Tác nhân Admin ACTIVE | Catalog cập nhật TaskType | Policy $\to$ Work Management | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-15** | Proof Policy Governance | Admin, System | Tác nhân Admin ACTIVE | Ban hành PolicyVersion | Policy $\to$ Work Management | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-16** | Checklist Template Versioning | Admin, System | Tác nhân Admin ACTIVE | Ban hành TemplateVersion | Policy $\to$ Work Management | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-17** | Audit Log Inspection | Admin, System | Tác nhân Admin ACTIVE | Hiển thị log kiểm toán | Admin $\to$ Màn hình xem | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-18** | Offline Submission & Sync | Staff, System | Không có mạng kết nối | `SYNCED` / `WAITING_REVIEW` | Client Outbox $\to$ Server API | `AUDIT_REQUIRED` | **MVP** | **CONSISTENT (100%)** |
| **WF-NEXT-01**| Dynamic Findings Governance | Admin, System | Khóa tại MVP | Khóa tại MVP | N/A | `AUDIT_REQUIRED` | **NEXT** | **CONSISTENT (Khóa đúng)** |
| **WF-NEXT-02**| Break-Glass Execution | Admin, System | Khóa tại MVP | Khóa tại MVP | N/A | `AUDIT_REQUIRED` | **NEXT** | **CONSISTENT (Khóa đúng)** |
| **WF-NEXT-03**| Security Notifications | System | Khóa tại MVP | Khóa tại MVP | N/A | `AUDIT_REQUIRED` | **NEXT** | **CONSISTENT (Khóa đúng)** |

---

## 16. Bảng Bằng Chứng Nghiệm Thu Cổng Phase 5 (Phase 5 Evidence Table)

Nghiệm thu toàn bộ 11 tiêu chí cổng kiểm soát chất lượng khắt khe của Phase 5 theo Master Plan:

| Gate ID | Tiêu chí Nghiệm thu (Requirement) | Phương pháp Xác minh (Verification Method) | Căn cứ Bằng chứng Cụ thể (Concrete Evidence) | Tính Chặn (Blocking) | Kết quả Nghiệm thu (Result) |
|---|---|---|---|:---:|:---:|
| **P5-01** | Không thêm Admin lane vào field flow nếu không có action | Swimlane & Role Integrity Audit | Mục 11 & WF-NT-01: Admin bị cấm 100% trong toàn bộ 9 luồng vận hành thực địa `WF-01..09`. | **YES** | **PASS** |
| **P5-02** | Quy trình cấp phát người dùng (User Provisioning) xác định rõ | IAM Flow Verification | Mục 4 (`WF-10`): Định nghĩa đầy đủ START $\to$ STEPS $\to$ END, mật khẩu mã hóa một lần, phân quyền ban đầu. | **YES** | **PASS** |
| **P5-03** | Quy trình thay đổi vai trò (Role-change) xác định rõ | Role Governance Audit | Mục 4 (`WF-11`): Admin đổi quyền có lý do, cấm tự đổi quyền (`ADM-SOD-01`), thu hồi phiên làm việc tức thời. | **YES** | **PASS** |
| **P5-04** | Quy trình khóa tài khoản (Suspension) xác định rõ | Suspension Isolation Audit | Mục 4 (`WF-12`): Khóa IAM thu hồi token nhưng cấm tự động hủy task; nhường quyền điều phối cho Quản lý. | **YES** | **PASS** |
| **P5-05** | Sự kiện kiểm toán (`AuditEvent`) được tạo đúng lúc | Audit Generation Verification | Bảng Mục 7 & Mục 15: 100% các quyết định quản trị, duyệt việc, hủy việc đều gắn mác `AUDIT_REQUIRED`. | **YES** | **PASS** |
| **P5-06** | Quy trình can thiệp khẩn cấp (Break-glass) xử lý đúng chuẩn | Emergency Boundary Audit | Mục 6 (`WF-NEXT-02`) & WF-NT-15: Định vị rõ ranh giới kiểm soát tương lai, khóa 100% không kích hoạt trong MVP. | **YES** | **PASS** |
| **P5-07** | Vòng đời 7 trạng thái của Task không bị phá vỡ | Lifecycle State Machine Audit | Mục 3 (`WF-01..09`): Bảo toàn nguyên vẹn 7 trạng thái chuẩn tắc, không thêm bất kỳ trạng thái trung gian nào. | **YES** | **PASS** |
| **P5-08** | Ngữ nghĩa 3 hồ sơ `ProofProfile` không bị phá vỡ | Evidence Contract Verification | Mục 3 (`WF-04`): Bảo toàn trọn vẹn hợp đồng `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF` và Structured Findings. | **YES** | **PASS** |
| **P5-09** | Lịch sử chăm sóc (`CareHistory`) chỉ sinh từ `COMPLETED` | Projection Invariant Audit | Mục 3 (`WF-06`, `WF-09`) & WF-NT-16: Duy nhất task `COMPLETED` mới sinh CareHistory; task hủy cấm sinh lịch sử. | **YES** | **PASS** |
| **P5-10** | Ngữ nghĩa ngoại tuyến không bị trộn lẫn với `TaskStatus` | Offline Decoupling Audit | Mục 5 (`WF-18`) & WF-NT-07: Tách biệt `LocalSubmissionStatus` (PENDING_SYNC) với `TaskStatus` server (IN_PROGRESS). | **YES** | **PASS** |
| **P5-11** | Quy tắc phân công lại (Reassignment) giữ nguyên vẹn | Reassignment Governance Audit | Mục 3 (`WF-01`, `WF-08`) & WF-NT-17: Chỉ Reassign tại PENDING hoặc BLOCKED $\to$ PENDING; cấm Reassign tại IN_PROGRESS/REWORK. | **YES** | **PASS** |

---

## 17. Kết Luận Cổng Nghiệm Thu Phase 5 (Phase 5 Exit Gate)

```text
================================================================================
PHASE 5 PASS
— END-TO-END WORKFLOWS RECONCILED
— OPERATIONAL AND GOVERNANCE FLOWS SEPARATED
— HANDOFFS AND FAILURE PATHS DEFINED
— TASK LIFECYCLE AND PROOF SEMANTICS PRESERVED
— READY FOR PHASE 6 CANONICAL DOCUMENT RECONCILIATION
================================================================================
```
