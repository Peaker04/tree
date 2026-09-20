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

## 2. Đối tượng sử dụng & Phân loại Tác nhân (Actor Taxonomy)

Hệ thống phân định rạch ròi giữa **Tác nhân con người (Human Actors)** và **Tác nhân kỹ thuật (Technical Actor)**. Tuyệt đối không có quan hệ kế thừa cấp bậc phân cấp kiểu `Admin > Manager > Staff`.

```text
NOVYX ACTORS
├── Human Actors
│   ├── Operational Plane (Mặt bằng Tác nghiệp Thực địa)
│   │   ├── Field Staff (Nhân viên hiện trường - 'staff')
│   │   └── Operations Manager (Quản lý vận hành - 'manager')
│   └── Governance Plane (Mặt bằng Quản trị Nền tảng)
│       └── Platform Administrator (Quản trị hệ thống - 'admin')
└── Technical Actor
    └── System (Hệ thống tự động hóa tất định)
```

### 2.1. Bảng chi tiết chân dung tác nhân

| Tác nhân (Canonical English) | Tên tiếng Việt chuẩn | Mã vai trò kỹ thuật | Mặt bằng hoạt động | Trạng thái MVP | Bối cảnh vận hành & Mục tiêu chính | Ranh giới cấm cốt tử |
|---|---|:---:|---|:---:|---|---|
| **Field Staff** | Nhân viên hiện trường | `staff` | Operational Plane | **CURRENT MVP** | Làm việc ngoài trời, thiết bị Android tầm trung, di chuyển liên tục. Nhận việc, bấm bắt đầu, xác thực hiện trường, thu thập bằng chứng đúng ProofProfile, báo sự cố, nộp duyệt. | **CẤM tự duyệt việc của mình (`DR-HARD-02`)**; CẤM tự tạo việc, đổi việc sang cây khác hoặc tự phân công lại. |
| **Operations Manager** | Quản lý vận hành | `manager` | Operational Plane | **CURRENT MVP** | Điều phối tại văn phòng hoặc lưu động trên tuyến. Giao việc đúng loại & đúng cây, xử lý sự cố tạm dừng (`BLOCKED`), thẩm định 100% hồ sơ nộp với 4 kết luận dứt điểm. | **CẤM can thiệp IAM/tài khoản người dùng**; CẤM tự ý hạ cấp ProofProfile; CẤM sửa đổi dữ liệu task đã đóng (`COMPLETED`/`CANCELLED`). |
| **Platform Administrator** | Quản trị hệ thống | `admin` | Governance Plane | **ACTIVE IN MVP** | Quản trị nền tảng, danh mục cây xanh, tài khoản, vai trò và mẫu biểu chính sách. Bảo vệ tính toàn vẹn dữ liệu, kiểm toán và tuân thủ an toàn. | **CẤM can thiệp tác nghiệp thực địa (Zero normal task operations)**; CẤM tự duyệt, tạo việc hay phân công task vận hành thường nhật. |
| **System** | Hệ thống tự động | `System` | Technical Automation | **CURRENT MVP** | Thực thi tự động hóa tất định: kiểm tra điều kiện tiên quyết, đo khoảng cách GPS, snapshot biểu mẫu, lưu trữ outbox, ghi log kiểm toán bất biến. | **System không phải là UserRole con người**; CẤM tự động phân công thay Quản lý; CẤM tự động duyệt việc (`DR-POL-01`). |

---

## 3. Bản đồ năng lực kinh doanh (Business Capability Map)

Hệ thống năng lực của NOVYX GreenOps được phân tách rành mạch giữa **Năng lực vận hành thực địa (Operational Capabilities)**, **Năng lực quản trị nền tảng (Platform Governance Capabilities)** và **Năng lực kỹ thuật hỗ trợ (Supporting Technical Capabilities)**:

```text
+-----------------------------------------------------------------------------------+
|                            NOVYX BUSINESS CAPABILITIES                            |
+-----------------------------------------------------------------------------------+
| [CORE DOMAIN - Vận hành & Xác thực tác nghiệp hiện trường (Work Management)]      |
| 1. Field Work Verification & Execution                                            |
|    - Site Verification (QR định danh cây + GPS vị trí mục tiêu <=10m)             |
|    - Verification Exception Handling (Xử lý ngoại lệ QR hỏng & GPS trôi có kiểm soát)|
|    - Semantic Proof Acquisition (Thu thập bằng chứng theo CHANGE/SERVICE/INSPECTION) |
|    - Technical Checklist / Structured Findings Execution                          |
|    - Field Issue Reporting (Báo cáo sự cố hiện trường chuyển sang BLOCKED)         |
|    - Targeted Evidence Submission & Outbox Packaging                              |
| 2. Operational Coordination & Quality Gate                                        |
|    - Task Dispatching & Assignment (Tạo việc, gắn TaskType -> ProofProfile)        |
|    - Deterministic Task Lifecycle (PENDING, IN_PROGRESS, BLOCKED, WAITING, REWORK) |
|    - Reassignment Governance (Đổi người ở PENDING & BLOCKED; cấm đổi trực tiếp)    |
|    - Task Cancellation (Hủy việc có lý do từ mọi trạng thái chưa đóng)             |
|    - Multi-Outcome Manager Review Gate (APPROVE, REWORK, APPROVE_EXCEPTION, CANCEL)|
|    - Targeted Rework Feedback Loop (Chỉ thị sửa đúng mục, bảo lưu bằng chứng cũ)  |
|    - Versioned Evidence Audit Trail (Lưu vết lịch sử các lần nộp và thẩm định)    |
+-----------------------------------------------------------------------------------+
| [SUPPORTING DOMAINS - Tài sản, Chính sách & Kiểm toán]                            |
| 3. Tree Asset Registry                                                            |
|    - Tree Catalog & Master Data (Hồ sơ cây, treeId bất biến, QR có thể cấp đổi)   |
|    - Fast Field QR Lookup (Tra cứu nhanh thông tin cây tại hiện trường)            |
|    - Official Care History Projection (Chỉ chiếu từ các nhiệm vụ COMPLETED)       |
| 4. Policy & Template Governance                                                   |
|    - TaskType Catalog Governance (Danh mục loại việc lâm sinh)                    |
|    - ProofProfile Policy Mapping (Ánh xạ bắt buộc TaskType -> ProofProfile)       |
|    - Checklist Template Versioning (Quản trị phiên bản biểu mẫu kiểm tra)         |
| 5. Audit & Compliance                                                             |
|    - Tamper-evident Audit Trail (Sổ nhật ký kiểm toán bất biến append-only)        |
|    - Audit Log Inspection & Filter (Thanh tra, tra cứu và xuất dữ liệu kiểm toán)  |
| 6. Operational Notifications (Derived Read Model)                                 |
|    - Task Lifecycle Alerts (Việc mới, yêu cầu làm lại, phê duyệt, sự cố tạm dừng)  |
+-----------------------------------------------------------------------------------+
| [GENERIC DOMAIN - Quản trị Danh tính & Phân quyền (IAM)]                          |
| 7. Identity & Access Management                                                   |
|    - User Provisioning & Account Lifecycle (Khởi tạo, kích hoạt, khóa, mở khóa)   |
|    - Role Assignment & Operational Responsibility Reconciliation                  |
|    - Session Authority & Contextual Device Permissions                            |
+-----------------------------------------------------------------------------------+
```

### 3.1. Bảng chi tiết năng lực vận hành tác nghiệp (Operational Capabilities)

| Mã | Tên năng lực | Miền sở hữu | Tác nhân chính | Đối tượng xử lý | Trạng thái MVP |
|---|---|---|---|---|:---:|
| **CAP-01** | **Field Work Verification** | Work Management (Core) | Field Staff | `Task`, `SiteVerification`, `TaskEvidence`, `FieldIssue` | **MUST HAVE** |
| **CAP-02** | **Work Management** | Work Management (Core) | Operations Manager, Field Staff | `Task`, `TaskAssignment`, `TaskType` | **MUST HAVE** |
| **CAP-03** | **Tree Asset Registry** | Tree Asset Registry | Operations Manager, Field Staff | `Tree`, `CareHistory` (Chỉ tạo khi `COMPLETED`) | **MUST HAVE** |
| **CAP-04** | **Review & Quality Control** | Work Management (Core) | Operations Manager | `Task`, `ReviewDecision`, `ReworkRequest` | **MUST HAVE** |
| **CAP-05** | **Operational Notifications** | Notifications (Read Model) | System, Field Staff, Operations Manager | `Notification` | **MUST HAVE** |

### 3.2. Bảng chi tiết năng lực quản trị nền tảng (Platform Administrator Capabilities)

| Mã năng lực | Tên năng lực quản trị | Miền sở hữu | Tác nhân chính | Đối tượng xử lý | Trạng thái Sản phẩm |
|---|---|---|---|---|:---:|
| **CAP-ADM-01** | **User Provisioning** | Identity & Access | Platform Administrator | `User`, `Account` | **MVP (Hoạt động)** |
| **CAP-ADM-02** | **Role Assignment** | Identity & Access | Platform Administrator | `RoleAssignment` | **MVP (Hoạt động)** |
| **CAP-ADM-03** | **Account Lifecycle** | Identity & Access | Platform Administrator | `AccountStatus` (Suspend/Activate/Disable) | **MVP (Hoạt động)** |
| **CAP-ADM-04** | **Account Recovery / Unlock** | Identity & Access | Platform Administrator | `Account` (Unlock/Reset credential setup) | **MVP (Hoạt động)** |
| **CAP-ADM-05** | **Audit Log Inspection** | Audit & Compliance | Platform Administrator | `AuditEvent` (Tra cứu/lọc log kiểm toán chỉ-đọc) | **MVP (Hoạt động)** |
| **CAP-ADM-06** | **Tree Master Data Governance** | Tree Asset Registry | Platform Administrator | `TreeMasterData` (Tạo cây, cấp đổi QR, sửa tọa độ) | **MVP (Hoạt động)** |
| **CAP-ADM-07** | **TaskType Catalog Governance** | Policy & Template | Platform Administrator | `TaskTypeCatalog` (Tạo/kích hoạt/ngưng loại việc) | **MVP (Hoạt động)** |
| **CAP-ADM-08** | **ProofProfile Policy Mapping** | Policy & Template | Platform Administrator | `ProofPolicyMapping` (Ban hành phiên bản ánh xạ) | **MVP (Hoạt động)** |
| **CAP-ADM-09** | **Checklist Template Governance** | Policy & Template | Platform Administrator | `ChecklistTemplate` (Ban hành phiên bản mẫu checklist) | **MVP (Hoạt động)** |
| **CAP-ADM-10** | **Dynamic Findings Template** | Policy & Template | Platform Administrator | `FindingsSchema` (Biểu mẫu khám bệnh động) | **NEXT (Khóa tại MVP)** |
| **CAP-ADM-11** | **Break-Glass Emergency Execution** | Platform Governance | Platform Administrator | Phiên can thiệp vượt quyền khẩn cấp | **NEXT (Khóa tại MVP)** |
| **CAP-ADM-12** | **Security Governance Notifications** | Audit & Compliance | System | Cảnh báo an ninh cấp cao tới ban kiểm soát | **NEXT (Khóa tại MVP)** |
| **CAP-ADM-13** | **Platform System Configuration** | N/A | N/A | Cấu hình hạ tầng tùy tiện không gắn nghiệp vụ | **REJECTED (Bác bỏ)** |

---

## 4. Phạm vi MVP — Chu trình vận hành chuẩn tắc (The Canonical Operating Loops)

### 4.1. Chu trình tác nghiệp thực địa (Field Operational Loop)

Chu trình vận hành khép kín tất định của nhiệm vụ hiện trường:

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
  |     * INSPECTION_PROOF: Đánh giá tiêu chí có cấu trúc (Structured Findings) -> Ảnh hiện trạng.
  v
[5. Staff Nộp hồ sơ nghiệm thu (Evidence Submission)]
  |-- Rà soát hợp đồng bằng chứng theo hồ sơ nhiệm vụ.
  |-- Bấm "Gửi duyệt kết quả".
  |-- Nếu ngoại tuyến: LocalSubmissionStatus = PENDING_SYNC, trên server Task vẫn là IN_PROGRESS.
  |-- Khi chấp thuận nghiệp vụ máy chủ: Task chuyển sang WAITING_REVIEW, LocalSubmissionStatus = SYNCED.
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

### 4.2. Chu trình quản trị nền tảng chuẩn tắc (Platform Governance Loops)

1. **Khởi tạo người dùng (`WF-10`):** Admin khởi tạo tài khoản $\to$ Hệ thống kích hoạt cơ chế thiết lập xác thực an toàn $\to$ Người dùng nhận tài khoản. Admin không bao giờ thấy mật khẩu dạng rõ.
2. **Điều chỉnh phân quyền & Bàn giao (`WF-11`):** Admin đổi quyền $\to$ Hệ thống rà soát xung đột trách nhiệm (`Role Change Impact Check`) $\to$ Nếu còn vướng task dở dang hoặc hàng đợi duyệt: chuyển trạng thái điều kiện `ROLE_CHANGE_PENDING_OPERATIONAL_HANDOFF` $\to$ Quản lý vận hành giải tỏa công việc dở dang $\to$ Vai trò mới có hiệu lực. Người thăng chức cấm tự duyệt bài mình đã làm trước đây.
3. **Khóa tài khoản & Điều phối khối lượng công việc (`WF-12`):** Admin đình chỉ tài khoản IAM $\to$ Phát thông báo `USER_NOT_OPERATIONALLY_AVAILABLE` $\to$ Quản lý vận hành áp dụng ma trận xử lý: Reassign ở `PENDING`, Cancel và tạo task thay thế cho `IN_PROGRESS` / `REWORK_REQUIRED`, không làm ngắt quãng vòng đời chuẩn.
4. **Quản trị Sổ bộ Cây xanh (`WF-13`):** Admin thêm cây mới (`treeId` bất biến duy nhất, `qrCode` duy nhất, tọa độ chuẩn hợp lệ định dạng/dải trắc địa); cấp đổi mã tem QR hỏng (`ReplaceTreeQrCode`) bảo toàn lịch sử; hiệu chỉnh tọa độ đo đạc lại (`UpdateCanonicalCoordinates`).
5. **Quản trị Chính sách & Biểu mẫu (`WF-14..16`):** Admin quản trị danh mục `TaskTypeCatalog` (tài nguyên kiểm toán); ban hành phiên bản chính sách ánh xạ `ProofPolicyMapping` (tài nguyên phiên bản); ban hành phiên bản mẫu biểu `ChecklistTemplate`. Mọi thay đổi áp dụng cho các nhiệm vụ trong tương lai, không áp dụng hồi tố.
6. **Thanh tra Kiểm toán (`WF-17`):** Admin tra cứu, lọc và xuất nhật ký kiểm toán từ kho lưu trữ bất biến (Append-only Audit Store). Quyền xem kiểm toán độc lập hoàn toàn với quyền can thiệp dữ liệu.

---

## 5. Ranh giới phạm vi MVP (Scope Boundary)

### 5.1. MUST HAVE (Bắt buộc trong MVP):

- Đăng nhập phân quyền theo **3 vai trò con người chuẩn tắc**: `Field Staff`, `Operations Manager`, `Platform Administrator` và tác nhân kỹ thuật `System`.
- Toàn bộ **9 năng lực quản trị nền tảng của Platform Administrator** (`CAP-ADM-01..09`).
- Cơ chế xin quyền thiết bị theo ngữ cảnh sử dụng (Contextual Permissions) cho Camera và GPS.
- Quản trị Loại việc (`TaskType`) gắn liền với 3 Hồ sơ Bằng chứng Ngữ nghĩa (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`).
- Bảng khám bệnh lâm sinh có cấu trúc (`StructuredFindings`) cho `INSPECTION_PROOF`.
- Xác thực hiện trường hai tín hiệu độc lập (QR + GPS mục tiêu $\le 10$m) có xử lý ngoại lệ có kiểm soát (`LOCATION_EXCEPTION`, `IDENTITY_EXCEPTION`).
- Vòng đời nhiệm vụ 7 trạng thái tất định: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`.
- Báo cáo sự cố hiện trường (`ReportFieldIssue` $\to$ `BLOCKED`) và 3 lối thoát xử lý của Quản lý (`Resume`, `Reassign`, `Cancel`).
- Cổng thẩm định 4 kết luận của Quản lý (`APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, `CANCEL`).
- Làm lại có mục tiêu (`Targeted Rework`), bảo lưu bằng chứng hợp lệ cũ, lưu vết lịch sử nhiều phiên bản.
- Quyền Hủy việc (`CancelTask`) có lý do bắt buộc từ mọi trạng thái chưa đóng.
- Quy tắc đổi người làm việc (`Reassign`): Cho phép ở `PENDING` và `BLOCKED`; cấm đổi trực tiếp ở `IN_PROGRESS`, `WAITING_REVIEW`, `REWORK_REQUIRED`.
- Chiếu Lịch sử chăm sóc (`Care History`): Chỉ nhiệm vụ `COMPLETED` mới sinh Care History; bảo toàn cờ ngoại lệ nếu có.
- Cơ chế ngoại tuyến: Phân tách độc lập giữa `TaskStatus` (nghiệp vụ server) và `LocalSubmissionStatus` (kỹ thuật client).

### 5.2. SHOULD HAVE / NEXT (Kiểm soát giai đoạn sau MVP):

- **`CAP-ADM-10` / `WF-NEXT-01`**: Biểu mẫu Khám bệnh Động (Dynamic Findings Template Governance). Trong MVP áp dụng Fixed Schema.
- **`CAP-ADM-11` / `WF-NEXT-02`**: Can thiệp Vượt quyền Khẩn cấp (Break-Glass Emergency Execution). Bị khóa hoàn toàn tại MVP.
- **`CAP-ADM-12` / `WF-NEXT-03`**: Cảnh báo An ninh Quản trị (Security Governance Notifications).
- Tải ảnh nền đồng bộ (Background photo upload queue) khi kết nối chập chờn.
- Phân trang Cursor cho danh mục cây và danh sách nhiệm vụ trên giao diện mobile.
- Lọc cây theo bản đồ thực địa tương tác (Interactive Map clustering).

### 5.3. EXPLICIT NON-GOALS / REJECTED (Dứt khoát loại trừ khỏi sản phẩm):

- **`CAP-ADM-13`**: Quản trị cấu hình hạ tầng tùy tiện (`Platform System Configuration`) — Bị bác bỏ hoàn toàn.
- **Admin can thiệp vận hành thực địa:** Admin không có thẩm quyền tạo task, giao việc, phân công lại, báo sự cố, thẩm định hay phê duyệt nghiệm thu thay Quản lý.
- Tự động phê duyệt (`Auto-approval`) không qua thẩm định của con người.
- Tối ưu hóa lộ trình di chuyển tự động (Route optimization / TSP).
- Quản lý chấm công, tính lương công nhật (Workforce payroll).
- Quản trị kho vật tư, phân bón, thuốc bảo vệ thực vật chi tiết (Parts & inventory).
- Quản lý hợp đồng nhà thầu và thanh quyết toán dịch vụ (Contractor billing, SLAs).
- Ký nhận điện tử của người dân/chủ đầu tư (Customer digital signatures).
- Hệ thống GIS chuyên sâu biên tập đa giác bản đồ (Advanced GIS polygon editing).
- Cảm biến IoT gắn đất hoặc thân cây (IoT soil/tree tilt sensors).
- Dự báo bảo trì bằng trí tuệ nhân tạo (Predictive maintenance AI).
- Phê duyệt đa cấp bậc tổ chức (Multi-level corporate approvals).

---

## 6. Giả định và Ràng buộc vận hành (Assumptions & Constraints)

1. **Ràng buộc phần cứng:** Thiết bị Staff là Android 10+ với camera có tự động lấy nét và GPS phần cứng hoạt động được ngoài trời.
2. **Ràng buộc khoảng cách GPS:** Tiêu chuẩn mục tiêu là $\le 10$ mét (`DISTANCE_TARGET = 10`). Không áp dụng ngưỡng phụ 25m. Nếu GPS không đạt sau khi thử lại do tán lá rậm/nhà cao tầng, kích hoạt `LOCATION_EXCEPTION` kèm giải trình để Quản lý hậu kiểm.
3. **Ràng buộc định danh QR & Tọa độ:** Mỗi cây xanh có mã `treeId` bất biến duy nhất và một mã tem `qrCode` duy nhất toàn hệ thống. Tem QR có thể được cấp đổi khi hỏng. Tọa độ chuẩn của cây được kiểm tra tính hợp lệ về định dạng/dải đo trắc địa nhưng **không phải là khóa duy nhất danh tính** (hai cây có thể có tọa độ làm tròn rất gần nhau).
4. **Ràng buộc bảo toàn dữ liệu bằng chứng:** Không bao giờ xóa đè hoặc viết lại tác giả của các bằng chứng đã thu thập; lịch sử các lần nộp và thẩm định phải được bảo toàn nguyên vẹn. Bằng chứng lịch sử không thể tái tạo trung thực thì không bao giờ được làm giả (`EVIDENCE_INTEGRITY_EXCEPTION`).
5. **Ràng buộc ngôn ngữ & Định dạng:** Giao diện người dùng sử dụng tiếng Việt chuẩn tắc; múi giờ vận hành `Asia/Ho_Chi_Minh` (GMT+7); khoảng cách tính theo mét (m).
6. **Ràng buộc kiến trúc monorepo:** Mọi cấu trúc dữ liệu trao đổi giữa ứng dụng di động và backend tương lai phải đi qua package `@novyx/contracts`. Cấm tuyệt đối việc sao chép thủ công kiểu dữ liệu vào `apps/mobile/src/`.
