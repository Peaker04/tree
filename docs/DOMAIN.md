# NOVYX GreenOps — Domain Architecture & Canonical Model

Tài liệu này là chuẩn mực duy nhất định nghĩa **Ý NGHĨA NGHIỆP VỤ (Domain Semantics)**, cấu trúc phân rã miền (Domain Decomposition), ranh giới ngữ cảnh (Bounded Contexts), từ vựng chuẩn tắc (Ubiquitous Language), các thực thể miền (Domain Objects) và các bất biến nghiệp vụ (Business Invariants).

---

## 1. Phân rã miền nghiệp vụ (Domain Decomposition)

Dựa trên phân tích giá trị nghiệp vụ và các quyết định phân ranh giới đã đóng băng tại Phase 3 (`05-DOMAIN-OWNERSHIP-MATRIX.md`, `06-BOUNDED-CONTEXT-DECISIONS.md`), hệ thống được phân chia thành 3 phân vùng miền nghiệp vụ chuẩn mực:

```text
+-----------------------------------------------------------------------------------+
|                           NOVYX DOMAIN LANDSCAPE                                  |
+-----------------------------------------------------------------------------------+
| [CORE DOMAIN - Vận hành & Quản lý Nhiệm vụ (Work Management)]                     |
| * Work Management Context: Sở hữu toàn bộ vòng đời tác nghiệp hiện trường, bao gồm|
|   khởi tạo, phân công, bắt đầu việc, xác thực hiện trường (Site Verification),    |
|   thu thập bằng chứng theo 3 Proof Profiles, báo cáo sự cố (BLOCKED), thẩm định   |
|   chất lượng 4 kết luận duyệt, và vòng lặp làm lại có mục tiêu (Targeted Rework). |
+-----------------------------------------------------------------------------------+
| [SUPPORTING SUBDOMAINS - Miền hỗ trợ chuyên biệt]                                 |
| * Tree Asset Registry: Quản lý hồ sơ cây xanh, dữ liệu gốc, CareHistory chiếu     |
| * Policy & Template Governance: Danh mục TaskType, ánh xạ ProofProfile, Checklist |
| * Audit & Compliance: Sổ nhật ký kiểm toán bất biến append-only, sự kiện kiểm toán|
+-----------------------------------------------------------------------------------+
| [GENERIC SUBDOMAIN - Miền dùng chung]                                             |
| * Identity & Access Management (IAM): Tài khoản, danh tính, vai trò người dùng     |
+-----------------------------------------------------------------------------------+
| [DERIVED READ MODELS & TECHNICAL CONCERNS - Mô hình dẫn xuất & Kỹ thuật]          |
| - Operational Notifications: Mô hình đọc dẫn xuất (Derived Read Model / Projection)|
|   (Authoritative Owning Context: N/A; kỹ thuật phát tin bảo lưu cho Kiến trúc)    |
| - Mobile Offline Resilience, Durable Outbox & Client Sync Transport               |
| - Contextual Device Hardware Adapters (GPS, Camera)                               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Các ngữ cảnh giới hạn chuẩn tắc (Canonical Bounded Contexts)

Mỗi Bounded Context sở hữu một tập hợp thực thể độc quyền với **quyền sở hữu thẩm quyền duy nhất (Single Authoritative Ownership)**:

| Bounded Context | Phân loại | Trách nhiệm nghiệp vụ chính | Thực thể & Tài nguyên sở hữu độc quyền (Owned Resources) | Ranh giới & Phụ thuộc |
|---|:---:|---|---|---|
| **`Work Management`** | **CORE** | Quản lý toàn vẹn chu trình tác nghiệp từ tạo việc đến đóng việc; điều phối phân công; thu thập Site Verification và Proof; xử lý sự cố `BLOCKED`; thẩm định nghiệm thu 4 kết luận; điều phối làm lại có mục tiêu. | `Task` (Root Aggregate), `TaskAssignment`, `TaskLifecycle`, `SiteVerification`, `VerificationException`, `FieldIssue`, `TaskEvidence`, `EvidenceAttempt` *(Entity)*, `StructuredFindings`, `ChecklistSnapshot`, `ReviewDecision`, `ReworkRequest`, `Cancellation`. | Nhận `treeId` từ Tree Registry; nhận `policyVersionId` từ Policy Governance; phát sinh sự kiện kiểm toán sang Audit & Compliance; chiếu kết quả `COMPLETED` sang `CareHistory`. |
| **`Tree Asset Registry`** | SUPPORTING | Sổ bộ quản trị tài sản cây xanh đô thị, mã định danh `treeId`, mã tem `qrCode`, tọa độ chuẩn trắc địa, thuộc tính thực vật học và bản chiếu Lịch sử chăm sóc chính thức. | `Tree` (Root Aggregate), `TreeMasterData`, `TreeIdentity`, `CareHistory` *(Projection Read-Model)*. | Độc lập về mặt dữ liệu gốc; cung cấp dữ liệu tra cứu cho Work Management. Không sở hữu tiến trình thi công. |
| **`Policy & Template Governance`** | SUPPORTING | Quản trị các quy chuẩn lâm sinh, danh mục loại việc, quy tắc ánh xạ bắt buộc sang hồ sơ bằng chứng, và phiên bản các biểu mẫu kiểm tra kỹ thuật. | `TaskTypeCatalog` *(Audit-only Resource)*, `ProofPolicyMapping` *(Versioned Policy Resource)*, `ChecklistTemplate` *(Versioned Resource)*, `FindingsSchema` *(Policy)*. | Cung cấp hợp đồng và biểu mẫu snapshot cho Work Management khi tạo/bắt đầu task. Không tham gia vận hành tác nghiệp. |
| **`Audit & Compliance`** | SUPPORTING | Lưu trữ và bảo vệ chuỗi sự kiện kiểm toán độc lập, bất biến (Append-only), phục vụ thanh tra, giám sát an ninh và điều tra sự cố. | `AuditEvent` *(Domain Event / Append-only audit record)*. | Ghi nhận sự kiện từ toàn bộ các context; chỉ cung cấp giao diện đọc/lọc cho Platform Administrator. Cấm sửa/xóa log. Cơ chế toàn vẹn kỹ thuật / tamper-evidence được bảo lưu cho Kiến trúc kỹ thuật / NFR / ADR. |
| **`Identity & Access Management`** | GENERIC | Quản trị vòng đời tài khoản người dùng, cấp phát định danh, gán vai trò và quản lý trạng thái tài khoản. | `User` (Aggregate Root), `Account`, `RoleAssignment`, `AccountStatus`. | Cung cấp thông tin xác thực danh tính cho toàn hệ thống. Khi khóa tài khoản, chỉ phát thông tin `USER_NOT_OPERATIONALLY_AVAILABLE` chứ không tự ý can thiệp Task. |

### 2.1. Mô hình đọc dẫn xuất & Quan ngại kỹ thuật (Derived Read Models & Technical Concerns)

- **Operational Notifications (Mô hình đọc dẫn xuất / Phóng chiếu phi thẩm quyền):**
  - **Bản chất nghiệp vụ:** `Notification` là một mô hình đọc dẫn xuất (Derived Read Model / Projection), **tuyệt đối KHÔNG PHẢI là một Bounded Context độc lập** và không sở hữu bất kỳ Aggregate độc lập hay thực thể thẩm quyền gốc nào (`Authoritative Owning Context: N/A — non-authoritative projection`).
  - **Nguồn sự kiện:** Lắng nghe và tiếp nhận sự kiện từ Work Management, IAM, và các sự kiện kiểm toán/quản trị được phê duyệt để phát cảnh báo hiển thị cho người dùng.
  - **Bảo lưu kỹ thuật:** Cơ chế kỹ thuật phân phối thông báo (Push notifications, WebSocket, in-app messaging) được **BẢO LƯU CHO KIẾN TRÚC KỸ THUẬT (DEFERRED TO ARCHITECTURE)**.
- **Offline / Synchronization (Hạ tầng kỹ thuật):**
  - Lưu trữ đệm ngoại tuyến (`Durable Outbox`) và cơ chế vận chuyển gói tin đồng bộ là mối quan tâm thuần túy về hạ tầng kỹ thuật (`Technical Client Concern`), không phải Bounded Context nghiệp vụ.

---

## 3. Phân định Tài nguyên & Ranh giới Sở hữu Tuyệt đối (Authoritative Ownership Matrix)

Bảo đảm **nguyên tắc một tài nguyên chỉ có đúng một chủ sở hữu thẩm quyền**:

```text
Identity & Access Management
 ├── User (Root Aggregate)
 ├── Account (Entity)
 ├── RoleAssignment (Entity)
 └── AccountStatus (Enum: INVITED, ACTIVE, SUSPENDED, DISABLED)

Tree Asset Registry
 ├── Tree (Root Aggregate)
 ├── TreeMasterData (Entity)
 ├── TreeIdentity (Value Object: treeId immutable, qrCode unique/mutable)
 └── CareHistory (Derived Read-Model Projection from COMPLETED tasks)

Work Management (Core Domain)
 ├── Task (Root Aggregate - 7 states)
 ├── TaskAssignment (Value Object)
 ├── SiteVerification (Value Object)
 ├── VerificationException (Value Object: LOCATION_EXCEPTION, IDENTITY_EXCEPTION)
 ├── FieldIssue (Entity)
 ├── TaskEvidence (Value Object)
 ├── EvidenceAttempt (Entity - Multi-version submission attempts)
 ├── StructuredFindings (Value Object)
 ├── ChecklistSnapshot (Value Object - Decoupled template snapshot)
 ├── ReviewDecision (Value Object - 4 outcomes)
 ├── ReworkRequest (Value Object)
 └── Cancellation (Value Object)

Policy & Template Governance
 ├── TaskTypeCatalog (Audit-only Resource)
 ├── ProofPolicyMapping (Versioned Policy Resource)
 ├── ChecklistTemplate (Versioned Resource)
 └── FindingsSchema (Policy Resource - Fixed in MVP)

Audit & Compliance
 └── AuditEvent (Domain Event - Append-only Record / Immutable business audit intent)
```

---

## 4. Từ vựng chuẩn tắc (Ubiquitous Language)

| Thuật ngữ chuẩn (Canonical Term) | Định nghĩa chuẩn mực trong NOVYX GreenOps | Phân loại Mô hình | Ngữ cảnh Sở hữu | Ghi chú chuẩn hóa |
|---|---|:---:|:---:|---|
| **Field Staff** | Nhân viên hiện trường (`staff`): Thực thi công việc ngoài trời, xác thực hiện trường, thu thập bằng chứng theo ProofProfile. | Human Actor | Operational Plane | Chuẩn hóa từ "Staff", "Công nhân", "Kỹ thuật viên". |
| **Operations Manager** | Quản lý vận hành (`manager`): Điều phối, giao việc, xử lý sự cố hiện trường `BLOCKED`, thẩm định 100% hồ sơ với 4 kết luận duyệt. | Human Actor | Operational Plane | Chuẩn hóa từ "Manager", "Giám sát", "Điều hành". |
| **Platform Administrator** | Quản trị hệ thống (`admin`): Quản trị nền tảng, danh mục cây xanh, tài khoản IAM, chính sách bằng chứng, thanh tra kiểm toán. Không thao tác Task thực địa. | Human Actor | Governance Plane | Hoạt động thực tế trong MVP (`ACTIVE IN MVP`). |
| **System** | Hệ thống tự động: Thực thi các tác vụ tính toán và xử lý tất định (tính khoảng cách GPS, snapshot biểu mẫu, lưu trữ outbox, ghi log). | Technical Actor | Technical Automation | Không phải là UserRole con người. |
| **Tree** | Thực thể cây xanh đô thị được quản lý, có mã định danh `treeId` bất biến và mã tem `qrCode` duy nhất toàn hệ thống. | Root Aggregate | Tree Asset Registry | Đối tượng tài sản cốt lõi. |
| **Task** | Một nhiệm vụ chăm sóc cây cụ thể gắn cố định với đúng 1 cây và 1 loại việc (`TaskType`), trải qua vòng đời 7 trạng thái. | Root Aggregate | Work Management | Cây mục tiêu bất biến trong suốt vòng đời. |
| **TaskStatus** | Vòng đời 7 trạng thái tất định của nhiệm vụ: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`. | State Machine | Work Management | Hoàn toàn độc lập với `SyncStatus`. |
| **ProofProfile** | Hồ sơ ngữ nghĩa quy định hợp đồng bằng chứng bắt buộc: `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`. | Domain Policy | Policy Governance | Gán tất định từ TaskType, cấm Quản lý hạ cấp per-task. |
| **SiteVerification** | Xác thực hiện trường gồm hai tín hiệu độc lập: Định danh cây qua QR và Vị trí qua GPS ($\le 10$m). Thứ tự linh hoạt, không đổi TaskStatus. | Value Object | Work Management | Phục vụ đối soát trung thực hiện trường. |
| **VerificationException** | Cờ ngoại lệ có kiểm soát khi gặp sự cố khách quan: `LOCATION_EXCEPTION`, `IDENTITY_EXCEPTION`, `EVIDENCE_INTEGRITY_EXCEPTION`. | Value Object | Work Management | Cho phép tiếp tục nhưng bắt buộc giải trình để hậu kiểm. |
| **FieldIssue** | Báo cáo sự cố hiện trường do nhân viên gửi khi bị cản trở $\to$ chuyển task sang `BLOCKED`. | Entity | Work Management | Bắt buộc có ảnh hiện trường và lý do cản trở. |
| **ReviewDecision** | Quyết định thẩm định của Quản lý tại `WAITING_REVIEW`: `APPROVE` (qua lệnh `ApproveTask`), `REQUEST_REWORK` (qua lệnh `RequestRework`), `APPROVE_WITH_EXCEPTION` (qua lệnh `ApproveWithException`), `CANCEL` (qua lệnh `CancelTask`). | Value Object | Work Management | Chuẩn tắc đúng 4 kết luận dứt điểm. |
| **Targeted Rework** | Làm lại có mục tiêu: Quản lý chỉ định rõ khâu sai sót; bảo lưu bằng chứng hợp lệ cũ; nộp theo phiên bản đa nỗ lực (`EvidenceAttempt`). | Workflow Rule | Work Management | Cấm xóa sạch bằng chứng cũ của nhân viên. |
| **CareHistory** | Bản chiếu lịch sử chăm sóc chính thức của cây. **DUY NHẤT sinh ra khi Task đạt `COMPLETED`**. Bảo lưu cờ ngoại lệ nếu có. | Read-Model Projection | Tree Asset Registry | Task Hủy hoặc chưa hoàn thành cấm vào CareHistory. |
| **EvidenceAttempt** | Phiên nộp bằng chứng độc lập (`Attempt 1`, `Attempt 2`), lưu giữ đầy đủ bằng chứng, timestamp và tác giả. | Entity | Work Management | Bảo toàn lịch sử phục vụ kiểm toán và làm lại có mục tiêu. |
| **AuditEvent** | Bản ghi sự kiện kiểm toán bất biến, lưu vết tác nhân, hành động, đối tượng, thời điểm và lý do. | Domain Event | Audit & Compliance | Lưu trong kho Append-Only, cấm sửa/xóa. Cơ chế toàn vẹn kỹ thuật bảo lưu cho NFR/ADR. |
| **LocalSubmissionStatus** | Trạng thái đồng bộ máy khách: `PENDING_SYNC`, `SYNCED`, `SYNC_FAILED`. | Technical State | Client Outbox | Tách biệt 100% với `TaskStatus`. |

---

## 5. Ngữ nghĩa Định danh Cây xanh & Dữ liệu gốc (Tree Identity Semantics)

Hệ thống phân định rạch ròi giữa mã định danh logic, tem vật lý và tọa độ trắc địa:

1. **`treeId` (Mã định danh cây):**
   - Là khóa chính logic duy nhất toàn cục, bất biến vĩnh viễn (ví dụ: `TREE-01`, `TREE-VN-HN-001`).
   - `Task.treeId` gắn cố định khi tạo việc và **bất biến tuyệt đối trong suốt vòng đời nhiệm vụ** (`DR-HARD-01`). Cấm chuyển việc sang cây khác.
2. **`qrCode` (Mã tem QR vật lý):**
   - Là mã định danh vật lý duy nhất toàn hệ thống tại một thời điểm, gắn trên thân cây.
   - Thuộc quyền sở hữu của Tree Asset Registry, **có thể cấp đổi có kiểm soát** (`ReplaceTreeQrCode`) bởi Platform Administrator khi tem ngoài thực địa bị rách/mờ/mất.
   - Khi cấp đổi tem mới, mã mới phải đảm bảo tính duy nhất; việc cấp đổi tem mới **tuyệt đối không viết lại dữ liệu quét QR lịch sử** của các task cũ trong quá khứ.
3. **Tọa độ chuẩn trắc địa (Canonical Coordinates - Latitude, Longitude):**
   - Là thông số vị trí gốc cây được kiểm tra **tính hợp lệ về định dạng và phạm vi trắc địa**, **KHÔNG PHẢI LÀ KHÓA DUY NHẤT DANH TÍNH**.
   - Hai cây xanh có thể trồng sát nhau hoặc có tọa độ làm tròn trùng nhau tùy theo độ chính xác của phép đo GPS.
   - Tọa độ chuẩn có thể được cập nhật (`UpdateCanonicalCoordinates`) bởi Platform Administrator khi có số liệu trắc địa đo đạc lại chính xác hơn (kèm lý do bắt buộc). Thao tác này không viết lại tọa độ GPS thực tế mà nhân viên đã đo trong các nhiệm vụ lịch sử.

---

## 6. Vòng đời Nhiệm vụ 7 Trạng thái (The Seven Task States)

Vòng đời của thực thể `Task` bao gồm đúng 7 trạng thái tất định. Tuyệt đối không đưa thêm bất kỳ trạng thái trung gian kỹ thuật nào:

```text
[Khởi tạo Task]
      │
      ▼
   PENDING ──────────────(CancelTask)───────────────┐
      │                                             │
 (StartTask)                                        │
      │                                             │
      ▼                                             │
 IN_PROGRESS ────────────(CancelTask)───────────────┤
   │       ▲                                        │
   │       │ (ResumeBlockedTask)                    │
(Report)   │                                        │
   │   (ReassignTask Case B)                        │
   ▼       │                                        │
BLOCKED ───┴─────────────(CancelTask)───────────────┤
   │                                                │
   │ (SubmitEvidence)                               │
   ▼                                                │
WAITING_REVIEW ──────────(CancelTask)───────────────┤
   │        │                                       │
(ApproveTask/│ (RequestRework)                       │
ApproveWithExc)                                     │
   │        ▼                                       │
   │  REWORK_REQUIRED ───(CancelTask)───────────────┤
   │        │                                       │
   │        │ (ResubmitRework)                      │
   │        └──────────────┐                        │
   ▼                       ▼                        ▼
COMPLETED ◄───────── WAITING_REVIEW             CANCELLED
(Terminal Success)                              (Terminal Void)
```

### Các trạng thái không tồn tại trong miền (Prohibited Domain States):
- CẤM `OFFLINE_SUBMITTED`: Nộp khi mất mạng chỉ đổi cờ máy khách `LocalSubmissionStatus = PENDING_SYNC`, trên server Task vẫn là `IN_PROGRESS`.
- CẤM `COMPLETED_WITH_EXCEPTION`: Nghiệm thu có ngoại lệ thì trạng thái Task vẫn là `COMPLETED`, cờ `HAS_EXCEPTION` được ghi vào bản ghi chiếu `CareHistory`.
- CẤM `ADMIN_CANCELLED`, `STAFF_UNAVAILABLE`, `ACCOUNT_SUSPENDED`: Không sinh trạng thái phụ khi nhân sự bị khóa hoặc đổi quyền.

---

## 7. Phân tách rạch ròi các chiều trạng thái (Separate State Dimensions)

Tuyệt đối không gộp chung các chiều trạng thái độc lập vào nhau:

1. **`TaskStatus` (Vòng đời nghiệp vụ):** 7 trạng thái chuẩn tắc (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`).
2. **`ProofProgress` (Tiến độ bằng chứng):** Trạng thái đáp ứng hợp đồng bằng chứng của nhiệm vụ (`NOT_STARTED`, `IN_PROGRESS`, `READY_FOR_SUBMISSION`).
3. **`VerificationState` / `VerificationException` (Xác thực hiện trường):** Trạng thái xác minh hai tín hiệu (`UNVERIFIED`, `VERIFIED`, `HAS_LOCATION_EXCEPTION`, `HAS_IDENTITY_EXCEPTION`).
4. **`SyncStatus` / `LocalSubmissionStatus` (Đồng bộ máy khách):** Trạng thái truyền tải dữ liệu kỹ thuật (`SYNCED`, `PENDING_SYNC`, `SYNC_FAILED`).
5. **`NavigationState` (Điều hướng giao diện):** Trạng thái luồng màn hình trên ứng dụng di động.

---

## 8. Mô hình Bằng chứng Ngữ nghĩa (Proof Domain Model)

Hệ thống áp dụng 3 hồ sơ bằng chứng chuẩn tắc:

1. **`CHANGE_PROOF` (Biến đổi vật lý trực quan):**
   - Áp dụng: Cắt tỉa, đốn hạ cành mục, trồng mới, giải tỏa khẩn cấp.
   - Hợp đồng bắt buộc: Site Verification + Ảnh Trước (`beforePhoto`) + 100% Checklist thao tác kỹ thuật + Ảnh Sau (`afterPhoto`).
2. **`SERVICE_PROOF` (Bảo dưỡng định kỳ):**
   - Áp dụng: Tưới nước, bón phân gốc, làm cỏ bồn cây, xử lý đất.
   - Hợp đồng bắt buộc: Site Verification + 100% Checklist thao tác kỹ thuật + Ảnh Hoàn thành (`completionPhoto`). Không bắt ảnh Trước.
3. **`INSPECTION_PROOF` (Khảo sát & Kiểm tra chuyên sâu):**
   - Áp dụng: Khảo sát lâm sinh, đánh giá sâu bệnh, đo độ nghiêng rủi ro.
   - Hợp đồng bắt buộc: Site Verification + Bảng phát hiện có cấu trúc (`StructuredFindings`) + Ảnh hiện trạng chi tiết vị trí bệnh/khuyết tật (`conditionPhotos[]`). Không áp dụng checklist thao tác chung chung.

> **Quy tắc bất biến:** `TaskType` quyết định tất định `ProofProfile` thông qua phiên bản chính sách `ProofPolicyMapping`. Operations Manager không được tùy tiện chọn hoặc hạ cấp ProofProfile của từng task riêng lẻ (`DR-MVP-02`). Biểu mẫu `StructuredFindings` áp dụng Fixed Schema trong MVP; việc tùy biến động (`FindingsSchema`) được bảo lưu tại giai đoạn `NEXT`.

---

## 9. Bất biến miền nghiệp vụ chuẩn tắc (Canonical Domain Invariants)

| Mã quy tắc | Tên quy tắc | Nội dung bất biến chuẩn mực |
|---|---|---|
| **DR-HARD-01** | **Bất biến cây mục tiêu (Task Tree Immutability)** | Cây mục tiêu gắn với Task là cố định tuyệt đối trong suốt vòng đời. Nhân viên không được phép đổi sang cây khác. |
| **DR-HARD-02** | **Phân tách thực thi và thẩm định (Separation of Execution and Review)** | Người thi công không bao giờ được tự duyệt công việc của mình. Kể cả khi Staff được thăng chức lên Manager, người đó vẫn bị cấm duyệt các task do chính mình làm trong quá khứ. |
| **DR-HARD-03** | **Bảo toàn quyền tác giả bằng chứng lịch sử (Evidence Authorship Preservation)** | Khi phân công lại task (`Reassign`), toàn bộ bằng chứng do nhân viên cũ tạo ra phải giữ nguyên tác giả ban đầu (`capturedByUserId`). |
| **DR-HARD-04** | **Cấm ngụy tạo bằng chứng lịch sử (No Evidence Fabrication)** | Bằng chứng lịch sử không thể tái tạo trung thực tuyệt đối không được làm giả. Bắt buộc ghi nhận `EVIDENCE_INTEGRITY_EXCEPTION` để Quản lý xem xét. |
| **DR-HARD-05** | **Bất biến của trạng thái đóng (Terminal State Immutability)** | Nhiệm vụ đã ở trạng thái `COMPLETED` hoặc `CANCELLED` là đóng vĩnh viễn, không thể mở lại hoặc sửa đổi dữ liệu. |
| **DR-HARD-06** | **Cấm phân công lại trực tiếp khi đang làm hoặc chờ duyệt** | Không được đổi người khi task đang `IN_PROGRESS`, `WAITING_REVIEW` hoặc `REWORK_REQUIRED`. Tại `IN_PROGRESS`, bắt buộc qua `ReportFieldIssue` $\to$ `BLOCKED` $\to$ `Reassign`. |
| **DR-HARD-07** | **Biên giới Lịch sử chăm sóc (Care History Boundary)** | CHỈ nhiệm vụ có trạng thái `COMPLETED` mới được sinh bản ghi Lịch sử chăm sóc chính thức cho cây. Các trạng thái khác cấm sinh CareHistory. |
| **DR-MVP-01** | **Một việc gắn đúng một cây (One Task = One Tree)** | Mỗi nhiệm vụ chỉ thao tác trên duy nhất 1 thực thể cây xanh đô thị. |
| **DR-MVP-02** | **Quản trị TaskType $\to$ ProofProfile tập trung** | `TaskType` xác định tất định `ProofProfile`. Quản lý không được tùy tiện hạ cấp profile từng việc. |
| **DR-MVP-03** | **Vòng đời 7 trạng thái tất định** | Vòng đời Task gồm đúng 7 trạng thái: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`. |
| **DR-MVP-04** | **Khởi đầu thực địa tất định** | DUY NHẤT hành động Nhân viên bấm `StartTask` mới chuyển `PENDING` $\to$ `IN_PROGRESS`. Mở xem chi tiết không đổi trạng thái. |
| **DR-MVP-05** | **Đình chỉ phi kết thúc (Non-terminal BLOCKED)** | `BLOCKED` là trạng thái tạm dừng, chỉ vào từ `IN_PROGRESS` qua `ReportFieldIssue`, chỉ ra qua 3 lối thoát (`RESUME`, `REASSIGN`, `CANCEL`). |
| **DR-MVP-06** | **Bốn kết luận duyệt tại WAITING_REVIEW** | Quản lý chỉ có đúng 4 kết luận: `APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, `CANCEL`. Không có kết luận thứ năm. |
| **DR-POL-01** | **Thẩm định 100% hồ sơ do con người thực hiện** | Quản lý thẩm định 100% nhiệm vụ được nộp trước khi đóng việc; cấm hoàn toàn tự động duyệt (Auto-approval). |
| **DR-POL-02** | **Tiêu chuẩn khoảng cách GPS $\le 10$m** | Tiêu chuẩn xác thực vị trí là sai lệch không quá 10 mét. Không tồn tại ngưỡng phụ 25m. |
| **DR-POL-03** | **Làm lại có mục tiêu (Targeted Rework)** | Yêu cầu làm lại bắt buộc chỉ rõ khâu sai sót (`targetedArea`); bảo lưu toàn bộ bằng chứng hợp lệ cũ. |
| **DR-POL-04** | **Hủy việc có lý do bắt buộc** | Quản lý có thể hủy việc từ bất kỳ trạng thái chưa đóng nào, bắt buộc nhập lý do văn bản; lưu vết kiểm toán đầy đủ. |
| **DR-POL-05** | **Nghiệm thu có ngoại lệ (Approve with Exception)** | Sinh bản ghi CareHistory mang cờ `HAS_EXCEPTION` kèm tham chiếu lý do chịu trách nhiệm của Quản lý; trạng thái task vẫn là `COMPLETED`. |
| **DR-TECH-01**| **Phân tách độc lập giữa TaskStatus và SyncStatus** | Nộp offline chỉ đổi cờ máy khách; máy chủ giữ nguyên `IN_PROGRESS` cho đến khi máy chủ chấp thuận gói tin sang `WAITING_REVIEW`. |
