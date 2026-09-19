# NOVYX GreenOps — Bounded Context Decisions & Ubiquitous Language (Phase 3)

> **Tài liệu quyết định ranh giới ngữ cảnh giới hạn và chuẩn hóa từ vựng chuẩn mực**
> Thuộc chu trình: **Business Baseline Reconciliation — Phase 3 (Semantic Closure)**.
> Căn cứ chuẩn tắc:
> - [`docs/business-reconciliation/02-ACTOR-MODEL-DECISION.md`](02-ACTOR-MODEL-DECISION.md) (Ranh giới 4 tác nhân)
> - [`docs/business-reconciliation/03-ROLE-NAMING-TAXONOMY.md`](03-ROLE-NAMING-TAXONOMY.md) (Danh xưng 3 tầng)
> - [`docs/business-reconciliation/04-ADMIN-BUSINESS-SCOPE-DECISION.md`](04-ADMIN-BUSINESS-SCOPE-DECISION.md) (Phạm vi nghiệp vụ Quản trị hệ thống)
> - [`docs/business-reconciliation/05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) (Ma trận sở hữu tài nguyên miền)
> - [`docs/DOMAIN.md`](../DOMAIN.md) (Kiến trúc miền chuẩn tắc)
> - [`docs/WORKFLOWS.md`](../WORKFLOWS.md) (Quy trình tác nghiệp chuẩn tắc)
> - [`docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md`](../NOVYX_Business_Baseline_Reconciliation_Master_Plan.md)
>
> **Ranh giới thực thi (Hard Scope Rule)**:
> - Khóa chặt ranh giới ngữ cảnh giới hạn (Bounded Contexts) và chuẩn hóa ngôn ngữ chung (Ubiquitous Language).
> - **KHÔNG** sửa mã nguồn ứng dụng (`apps/**`) hay gói thư viện (`packages/**`).
> - **KHÔNG** sửa đổi tài liệu canonical (`PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `REQUIREMENTS-TRACEABILITY.md`, `NFR.md`) và sơ đồ trực quan (`docs/diagrams/**`) tại phase này.
> - **KHÔNG** thiết kế giải pháp kỹ thuật (Microservices, REST topology, Database schema, Event bus, State management).

---

## 1. Bản Đồ Chiến Lược Phân Rã Ngữ Cảnh (Strategic Context Landscape)

Tuân thủ chặt chẽ lý thuyết Domain-Driven Design (DDD) chiến lược: Phân loại giá trị cạnh tranh của từng ngữ cảnh giới hạn để tập trung tối đa nguồn lực vào phần cốt lõi tạo nên sự khác biệt của NOVYX GreenOps:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NOVYX STRATEGIC CONTEXT MAP                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  [CORE DOMAIN - Lõi khác biệt cạnh tranh]                                   │
│  ★ Work Management (Quản lý & Tác nghiệp Hiện trường)                       │
│    Sở hữu: Nhiệm vụ chăm sóc cây 7 trạng thái, Xác thực hiện trường hai     │
│    tín hiệu (GPS & QR), Thu thập bằng chứng 3 Profile, và Cổng thẩm định.   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [SUPPORTING SUBDOMAINS - Miền hỗ trợ chuyên biệt]                          │
│  ● Tree Asset Registry (Sổ bộ Tài sản Cây xanh Đô thị & CareHistory)        │
│  ● Policy & Template Governance (Quản trị Tiêu chuẩn, Mẫu & Chính sách)     │
│  ● Audit & Compliance (Nhật ký Kiểm toán Bất biến & Tuân thủ Pháp lý)       │
├─────────────────────────────────────────────────────────────────────────────┤
│  [GENERIC SUBDOMAINS - Miền nghiệp vụ chung]                                │
│  ◆ Identity & Access Management (Quản lý Danh tính, Tài khoản & Phân quyền) │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Bảng Quyết Định 9 Ngữ Cảnh Ứng Viên (Bounded Context Decision Table)

Đánh giá toàn diện 9 ứng viên ngữ cảnh (từ Candidate A đến Candidate I) theo nguyên tắc tối ưu hóa độ phức tạp, ngăn chặn tình trạng chia nhỏ vi ngữ cảnh nhân tạo (Anti Over-Splitting):

| Ứng viên Ngữ cảnh (Candidate) | Quyết định (Decision) | Phân loại Chiến lược | Tài nguyên Sở hữu (Owns) | Tài nguyên KHÔNG Sở hữu (Does Not Own) | Tác nhân Chính (Primary Actors) | Lý do Quyết định & Căn cứ Nghiệp vụ (Rationale) |
|---|:---:|:---:|---|---|---|---|
| **A. Identity & Access Management** | **`ACCEPTED`** | **`GENERIC`** | `User`, `Account`, `RoleAssignment`, `AccountStatus`, Phiên làm việc xác thực. | Nhiệm vụ vận hành (`Task`), Cây xanh (`Tree`), Sự kiện kiểm toán (`AuditEvent`). | Platform Administrator (quản trị), Toàn bộ nhân sự (đăng nhập). | Là miền chung tiêu chuẩn quản lý danh tính, cung cấp cơ chế phân quyền bảo mật cho toàn hệ thống. Cần thiết nhưng không tạo ra lợi thế cạnh tranh riêng biệt. |
| **B. Tree Asset Registry** | **`ACCEPTED`** | **`SUPPORTING`** | `Tree` (Root Aggregate), `TreeMasterData`, `TreeIdentity` (treeId bất biến, qrCode Master Data), `CareHistory` (chiếu). | Nhiệm vụ chăm sóc (`Task`), Bằng chứng thi công (`TaskEvidence`), Tài khoản người dùng. | Platform Administrator (quản trị Master Data & cấp đổi QR), Manager, Staff (tra cứu). | Quản lý vòng đời tài sản cây xanh đô thị và hồ sơ pháp lý chăm sóc trọn đời của từng cây. Là tài sản dữ liệu nền tảng phục vụ công tác vận hành. |
| **C. Work Management / Operations** | **`ACCEPTED`** | **`CORE`** | `Task` (Root Aggregate), `TaskLifecycle` (7 trạng thái), `TaskAssignment`, `BlockedResolution`, `SiteVerification`, `VerificationException`, `FieldIssue`, `TaskEvidence`, `EvidenceAttempt`, `ChecklistSnapshot`, `StructuredFindings`, `ReviewDecision`, `ReworkRequest`, `Cancellation`. | Thuộc tính gốc của Cây xanh, Tài khoản người dùng, Bảng chính sách bằng chứng toàn hệ thống, Sổ sự kiện kiểm toán. | Operations Manager (điều phối, thẩm định), Field Staff (thực thi ngoài hiện trường). | **Trọng tâm cạnh tranh số 1 của NOVYX**: Đảm bảo quy trình chăm sóc cây đô thị minh bạch 100%, tích hợp khép kín từ giao việc, xác thực hiện trường hai tín hiệu, thu thập bằng chứng đa phiên bản đến thẩm định chất lượng 4 kết luận. |
| **D. Field Verification & Evidence** | **`MERGED`** *(Hợp nhất vào Work Management)* | N/A *(Nằm trong CORE)* | Được quản lý như các Value Object và Entity thành phần bên trong Aggregate `Task`. | Không hình thành ngữ cảnh độc lập. | Field Staff. | Xác thực hiện trường (`SiteVerification`) và nộp bằng chứng (`TaskEvidence`, `EvidenceAttempt`) cùng tham gia vào các bất biến của `Task`. Việc hợp nhất tránh phân tán dữ liệu và bảo đảm tính tự chủ của chu trình công việc. |
| **E. Review & Quality Control** | **`MERGED`** *(Hợp nhất vào Work Management)* | N/A *(Nằm trong CORE)* | Được quản lý như logic kết thúc và phán quyết thẩm định bên trong Aggregate `Task`. | Không hình thành ngữ cảnh độc lập. | Operations Manager. | Kết luận thẩm định gồm đúng 4 kết luận (`APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, `CANCEL`) trực tiếp biến đổi `TaskStatus` và yêu cầu làm lại từng phần trên bằng chứng của Task (P3-SC-02). Hợp nhất giúp duy nhất một cỗ máy trạng thái kiểm soát chu trình sống. |
| **F. Policy & Template Governance** | **`ACCEPTED`** | **`SUPPORTING`** | `ProofPolicyMapping` (VERSIONED), `TaskTypeCatalog` (AUDIT-ONLY), `ChecklistTemplate` (VERSIONED), `FindingsSchema` (MVP Canonical Spec). | Thực thể nhiệm vụ đang chạy (`Task`), Bản chụp bằng chứng, Tài khoản nhân sự. | Platform Administrator (ban hành phiên bản), Operations Manager (đọc/chọn danh mục). | Độc lập hóa các quy tắc tiêu chuẩn, danh mục công việc và biểu mẫu khỏi các phiên thực thi cụ thể. Ngăn ngừa triệt để lỗi sửa đổi tiêu chuẩn làm hồi tố sai lệch các nhiệm vụ lịch sử. |
| **G. Audit & Compliance** | **`ACCEPTED`** | **`SUPPORTING`** | Chuỗi sự kiện kiểm toán (`AuditEvent Domain Event Stream`), Các mô hình đọc tra cứu tuân thủ. | Nghiệp vụ tác vụ, Tài khoản người dùng, Cấu hình chính sách. | System (ghi nối tiếp tự động khi có biến động), Platform Administrator (đọc, lọc, kiểm tra). | Độc lập tuyệt đối khỏi các tác nhân con người; cấm sửa xóa kể cả Admin. Cơ chế toàn vẹn kỹ thuật được bảo lưu cho Kiến trúc kỹ thuật / NFR / ADR (P3-SC-05). Đóng vai trò là bằng chứng pháp lý độc lập bảo vệ tính minh bạch. |
| **H. Notifications** | **`SUPPORTING ONLY`** *(Từ chối ngữ cảnh riêng)* | N/A *(Read Model ngoại vi)* | `Notification` = Bản chiếu dẫn xuất tạm thời (`DERIVED READ MODEL / PROJECTION`), không sở hữu tài nguyên thẩm quyền (P3-SC-04). | Không sở hữu bất kỳ Aggregate độc lập hay nghiệp vụ có trạng thái nào. | Tác nhân nhận thông báo. | Thông báo chỉ là bản chiếu hiển thị tạm thời sinh ra từ các sự kiện nghiệp vụ của Work Management và IAM. Cơ chế gửi tin (Push Notification) là giải pháp kỹ thuật hạ tầng, không phải Bounded Context. |
| **I. Offline / Synchronization** | **`TECHNICAL CONCERN`** *(Từ chối ngữ cảnh riêng)* | N/A *(Hạ tầng kỹ thuật)* | `SyncStatus`, `LocalSubmissionStatus`, Hàng đợi gửi tin cục bộ (Outbox Queue). Bàn giao cho Kiến trúc kỹ thuật (P3-SC-04). | Tuyệt đối không sở hữu `TaskStatus` hay dữ liệu nghiệp vụ. | Tầng kết nối mạng thiết bị di động. | Lưu trữ đệm ngoại tuyến và đồng bộ hóa mạng là mối quan tâm thuần túy về kiến trúc kỹ thuật (Technical Concern). Nghiệp vụ không được phép sinh ra trạng thái lai ghép như `OFFLINE_SUBMITTED`. |

---

## 3. Rationale Chi Tiết Về Quyết Định Hợp Nhất & Loại Bỏ (Detailed Merging Rationale)

### 3.1. Tại sao hợp nhất "Field Verification & Evidence" và "Review & QC" vào `Work Management`?
Tuân thủ kỷ luật **P3-SC-05B**, dự án loại bỏ mọi giả định ép buộc kỹ thuật sớm (như tuyên bố bắt buộc phải có Saga hay Distributed Transactions). Thay vào đó, quyết định hợp nhất dựa trên các căn cứ nghiệp vụ thuần túy:

1. **Cùng Tham Gia Vào Các Bất Biến Của Thực Thể Gốc `Task` (Participating in the Same Task Invariants)**:
   - Các hành động bắt đầu (`StartTask`), đối soát hiện trường (`SiteVerification`), gửi chứng cứ (`SubmitEvidence`), thẩm định (`ReviewDecision`) đều trực tiếp đọc và biến đổi trạng thái nội tại của `Task` (`status`, `proofProgress`, `evidenceHistory`, `reviewDecision`).
2. **`Task` Là Chủ Sở Hữu Thẩm Quyền Điều Phối Chu Trình Sống (Authoritative Lifecycle Owner)**:
   - Việc chuyển dịch giữa 7 trạng thái (`PENDING` $\to$ `IN_PROGRESS` $\to$ `BLOCKED` $\leftrightarrow$ `WAITING_REVIEW` $\to$ `REWORK_REQUIRED` $\to$ `COMPLETED` / `CANCELLED`) đòi hỏi một thẩm quyền quyết định thống nhất, không bị phân tán.
3. **Tránh Xung Đột Tác Nhân Ghi (Eliminating Conflicting Writers - BC-03)**:
   - Nếu tách riêng Review thành ngữ cảnh độc lập, cả hai ngữ cảnh sẽ cùng tranh chấp quyền ghi lên trường `TaskStatus`. Hợp nhất bảo đảm duy nhất một cỗ máy trạng thái điều phối chu trình sống.
4. **Độ Phức Tạp Nghiệp Vụ Thực Tế Không Đòi Hỏi Tách Vi Ngữ Cảnh (Domain Boundary Realism)**:
   - Việc chia tách nhỏ hơn không mang lại tính tự chủ nghiệp vụ có ý nghĩa cho phạm vi hiện tại của NOVYX, mà chỉ làm phức tạp hóa ranh giới định nghĩa.

### 3.2. Tại sao "Offline / Sync" không phải là Bounded Context?
- Đồng bộ hóa là cơ chế truyền tải (Transport Mechanism). Khi nhân viên bấm nộp bài lúc mất mạng, trạng thái kỹ thuật là `LocalSubmissionStatus = PENDING_SYNC`, nhưng về mặt nghiệp vụ hệ thống ghi nhận `TaskStatus` vẫn giữ nguyên là `IN_PROGRESS` (chưa lên `WAITING_REVIEW` trên máy chủ).
- Việc biến Offline Sync thành một Bounded Context nghiệp vụ sẽ làm ô nhiễm ngôn ngữ chung và tạo ra các trạng thái sai lệch như `OFFLINE_SUBMITTED` (vi phạm trực tiếp quy tắc `DR-MVP-03` và `DR-TECH-01`).

---

## 4. Ma Trận Tương Tác Giữa Các Ngữ Cảnh (Context Interaction Matrix)

Nguyên tắc bất biến: **Một ngữ cảnh tuyệt đối KHÔNG được trực tiếp ghi hoặc sửa đổi dữ liệu thuộc quyền sở hữu của ngữ cảnh khác**. Mọi giao tiếp diễn ra thông qua Lời gọi Yêu cầu/Lệnh (Command/Request), Sự kiện Miền (Domain Event) hoặc Bản chiếu Đọc (Read Projection).

| Ngữ cảnh Nguồn (Source Context) | Ngữ cảnh Đích (Target Context) | Thông tin Trao đổi (Information Shared) | Chiều tương tác (Direction) | Thẩm quyền Ghi trực tiếp? (Mutation Allowed) | Phương thức Giao tiếp Ngữ nghĩa (Semantic Mechanism) |
|---|---|---|:---:|:---:|---|
| **Identity & Access Management** | **Work Management** | Danh sách nhân sự hoạt động (`userId`, `fullName`, `role = staff \| manager`). | $\text{IAM} \longrightarrow \text{WM}$ | **CẤM** | Tra cứu danh tính nhân sự (Read-Only Reference) phục vụ giao việc. |
| **Tree Asset Registry** | **Work Management** | Định danh cây (`treeId`), mã QR (`qrCode`), tọa độ chuẩn (`lat, lng`). | $\text{TAR} \longrightarrow \text{WM}$ | **CẤM** | Bản chụp tham chiếu tài sản cây xanh khi khởi tạo nhiệm vụ. |
| **Policy & Template Governance** | **Work Management** | Quy tắc ánh xạ `TaskType` $\to$ `ProofProfile`, mẫu tiêu chí `ChecklistTemplate`. | $\text{Policy} \longrightarrow \text{WM}$ | **CẤM** | Work Management đọc chính sách để gán `proofProfile` và lưu snapshot checklist. |
| **Work Management** | **Tree Asset Registry** | Tín hiệu nhiệm vụ đạt `COMPLETED` kèm dữ liệu nghiệm thu và cờ ngoại lệ. | $\text{WM} \longrightarrow \text{TAR}$ | **CẤM** | Sự kiện miền `TaskCompletedEvent` kích hoạt TAR lập bản chiếu `CareHistory`. |
| **Mọi Ngữ cảnh (IAM, TAR, WM, Policy)** | **Audit & Compliance** | Dữ liệu biến động bảo mật và dữ liệu quan trọng (`AuditEventPayload`). | $\text{Contexts} \longrightarrow \text{Audit}$ | **CẤM** *(Chỉ ghi Append)* | Phát sự kiện kiểm toán (`AuditEventEmitted`); Audit Context ghi nối tiếp vào sổ. |
| **Work Management** | **Identity & Access Management** | Yêu cầu kiểm tra quyền thực thi của tác nhân trước khi kích hoạt lệnh. | $\text{WM} \longleftrightarrow \text{IAM}$ | **CẤM** | Xác thực phân quyền thời gian thực (Authorization Guard). |

---

## 5. Quy Tắc Định Danh & Tham Chiếu Xuyên Ngữ Cảnh (Cross-Context Identity Rules)

Để tránh tình trạng nhân bản hoặc làm méo mó mô hình giữa các Bounded Context, hệ thống áp dụng các quy tắc tham chiếu bất biến:

1. **Sử dụng Định danh Bền vững (Stable Identifier References)**:
   - Các ngữ cảnh chỉ lưu trữ mã định danh duy nhất của thực thể thuộc ngữ cảnh khác, không sao chép nguyên thực thể khả biến.
   - Các khóa tham chiếu chuẩn tắc: `userId` (IAM), `treeId` (TAR), `taskId` (WM), `taskTypeId` (Policy), `policyVersionId` (Policy), `templateVersionId` (Policy), `eventId` (Audit).
2. **Nguyên tắc Bản chụp Lịch sử Bất biến (Historical Snapshot Principle)**:
   - Khi một `Task` được khởi tạo, nó được phép lưu giữ một bản chụp tĩnh (Snapshot) của thông tin cần thiết tại thời điểm đó:
     - `treeCoordinatesSnapshot`: Tọa độ chuẩn của cây tại lúc giao việc (để đối chiếu GPS $\le 10$m).
     - `checklistTemplateSnapshot`: Nội dung các câu hỏi kiểm tra tại lúc kích hoạt `IN_PROGRESS`.
     - `policyVersionId`: Phiên bản quy tắc bằng chứng áp dụng.
     - `qrCodeSnapshot`: Mã QR định danh của cây tại thời điểm giao việc.
   - Nếu Tree Asset Registry sau này đo lại tọa độ cây hoặc cấp đổi mã `qrCode` mới (do tem hỏng), bản chụp trong Task lịch sử **KHÔNG BAO GIỜ BỊ THAY ĐỔI** (P3-SC-03).

---

## 6. Chuẩn Hóa Từ Vựng Chuẩn Mực (Ubiquitous Language Delta)

Bảng phân định nghĩa chuẩn tắc 100% không nhập nhằng giữa các khái niệm nghiệp vụ cốt lõi:

| Thuật ngữ Chuẩn tắc (Canonical Term) | Ngữ cảnh Sở hữu | Định nghĩa Nghiệp vụ Duy nhất trong NOVYX | Khái niệm DỄ NHẦM LẪN CẦN PHÂN BIỆT RẠCH RÒI |
|---|:---:|---|---|
| **Platform Administrator** | Actor | Tác nhân con người nắm giữ quyền quản trị người dùng, phân quyền, danh mục Master Data và chính sách hệ thống. | $\mathbf{\ne Operations\ Manager}$ (Admin cấm tham gia duyệt việc/làm việc hiện trường). |
| **Operations Manager** | Actor | Tác nhân con người điều phối công tác hiện trường, giao việc, phân công lại, hủy việc và thẩm định chất lượng. | $\mathbf{\ne Platform\ Administrator}$ (Manager cấm phân quyền, cấm sửa Master Data). |
| **Field Staff** | Actor | Tác nhân con người trực tiếp thi công ngoài thực địa, quét QR, đo GPS, chụp ảnh bằng chứng và báo sự cố. | Không có quyền tự duyệt công việc của mình (`DR-HARD-02`). |
| **System** | Actor | Tác nhân kỹ thuật tự động hóa thực hiện các tác vụ nền, ghi log kiểm toán và gửi thông báo. | Không phải là một user role; cấm tự động cấp quyền Admin (`ADM-SOD-06`). |
| **Task** | Work Management | Thực thể gốc đại diện cho một công việc chăm sóc cụ thể gắn cố định với 1 cây và 1 loại việc. | $\mathbf{\ne Tree}$ (Một cây có thể có nhiều task qua các thời kỳ; 1 task chỉ gắn đúng 1 cây). |
| **TaskStatus** | Work Management | Vòng đời nghiệp vụ gồm đúng 7 trạng thái: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`. | $\mathbf{\ne SyncStatus}$ và $\mathbf{\ne ProofProgress}$. |
| **ProofProgress** | Work Management | Chỉ số đo lường tiến độ thu thập chứng cứ ngoài hiện trường (ví dụ: đã chụp ảnh Trước, đã tích checklist). | $\mathbf{\ne TaskStatus}$ (Thu thập đủ ảnh không tự động chuyển trạng thái task lên WAITING_REVIEW). |
| **SyncStatus** | Technical State | Trạng thái đồng bộ mạng trên thiết bị: `SYNCED`, `PENDING_SYNC`, `SYNC_FAILED`. | $\mathbf{\ne TaskStatus}$ (Nộp offline thì TaskStatus vẫn là `IN_PROGRESS`). |
| **LocalSubmissionStatus** | Technical State | Cờ ghi nhận hồ sơ đang chờ hàng đợi đẩy lên server: `IDLE`, `PENDING_SYNC`. | Thuần túy là trạng thái đệm của mobile app; không gửi vào csdl nghiệp vụ. |
| **SiteVerification** | Work Management | Hồ sơ xác thực hiện trường gồm hai tín hiệu độc lập: Định danh cây (QR) và Vị trí (GPS $\le 10$m). | Đo GPS hay quét QR độc lập không làm thay đổi trạng thái của Task. |
| **VerificationException** | Work Management | Cơ chế ghi nhận trở ngại khách quan kèm giải trình: `LOCATION_EXCEPTION`, `IDENTITY_EXCEPTION`. | $\mathbf{\ne SiteVerification\ Passed}$ (Ngoại lệ bắt buộc phải có giải trình để Manager hậu kiểm). |
| **FieldIssue** | Work Management | Bản ghi sự cố ách tắc thi công (ong vò vẽ, tường rào khóa) $\to$ chuyển task sang `BLOCKED`. | $\mathbf{\ne StructuredFindings}$ (Sự cố là ách tắc vận hành; Findings là kết quả khám bệnh cây). |
| **StructuredFindings** | Work Management | Dữ liệu khám bệnh chuyên sâu (độ nghiêng, mục rỗng, sâu hại) bắt buộc của hồ sơ kiểm định `INSPECTION_PROOF`. | Không bị thay thế bởi `ReportFieldIssue`, `TreeRiskStatus` hay ảnh chụp. |
| **ReviewDecision** | Work Management | Quyết định thẩm định của Manager tại `WAITING_REVIEW`, gồm đúng 4 kết luận: `APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, `CANCEL` (P3-SC-02). | Là phán quyết kích hoạt chuyển trạng thái; không tồn tại trạng thái task mang tên ReviewDecision. |
| **Targeted Rework** | Work Management | Cơ chế yêu cầu làm lại có mục tiêu: chỉ định rõ khâu sai sót, bảo lưu 100% chứng cứ đạt chuẩn cũ. | Không bao giờ bắt công nhân làm lại từ đầu nếu các khâu trước đã đạt chuẩn. |
| **TreeIdentity** | Tree Asset Registry | Bộ định danh gồm `treeId` (bất biến) và `qrCode` (nhãn Master Data có thể cấp đổi bởi Admin có kiểm toán) (P3-SC-03). | Đổi `qrCode` không làm đổi `treeId` và không làm đổi kết quả quét QR của các task cũ. |
| **CareHistory** | Tree Asset Registry | Bản chiếu lịch sử chăm sóc pháp lý của cây xanh đô thị. | **CHỈ sinh ra khi task đạt `COMPLETED`**; Task bị Hủy hay đang làm cấm ghi vào CareHistory. |
| **AuditEvent** | Audit & Compliance | `DOMAIN EVENT` bất biến nối tiếp (`Append-Only`) ghi nhận ai đã làm gì, vào thời điểm nào, trên tài nguyên nào. | Không thuộc quyền sở hữu riêng của Admin; Admin cấm sửa/xóa audit log. |

---

## 7. Cấm Tuyệt Đối Các Điểm Xung Đột Thuật Ngữ (Forbidden Terminology Collisions)

Nghiêm cấm mọi tài liệu thiết kế, sơ đồ và mã nguồn sử dụng các phép đồng nhất sai trái dưới đây:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FORBIDDEN TERMINOLOGY COLLISIONS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Admin == Manager                                         --> BÁC BỎ 100%│
│  2. TaskStatus == SyncStatus                                 --> BÁC BỎ 100%│
│  3. ProofProgress == TaskStatus                              --> BÁC BỎ 100%│
│  4. Tree Master Data == Historical Task Snapshot             --> BÁC BỎ 100%│
│  5. ReviewDecision == TaskStatus                             --> BÁC BỎ 100%│
│  6. Audit Owner == Admin User                                --> BÁC BỎ 100%│
│  7. Notification == Audit Event                              --> BÁC BỎ 100%│
│  8. ReportFieldIssue == Structured Findings                  --> BÁC BỎ 100%│
│  9. Dynamic Findings NEXT == Structured Findings Optional     --> BÁC BỎ 100%│
│ 10. OFFLINE_SUBMITTED == TaskStatus                          --> BÁC BỎ 100%│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Thử Nghiệm Phủ Định Ngữ Nghĩa Ranh Giới (Semantic Boundary Negative Tests)

Đánh giá 12 kịch bản vi phạm ranh giới miền (CASE A đến CASE L) để kiểm chứng tính chặt chẽ tuyệt đối của mô hình Phase 3:

| Mã Ca Kiểm Thử | Giả định thao tác sai phạm | Kết quả mong đợi | Đánh giá thực tế trong Mô hình Phase 3 | Kết luận |
|---|---|:---:|---|:---:|
| **CASE A: Admin Context sở hữu Task vì Admin có vai trò cao nhất** | Đặt thực thể `Task` vào ngữ cảnh Governance của Admin. | **FAIL** (Bị cấm) | Bác bỏ tại Mục 2 (Candidate C) và Mục 4. `Task` thuộc độc quyền `Work Management`. Admin bị DENY 100% trên vận hành task. | **PASS (Đã chặn đứng)** |
| **CASE B: Work Management trực tiếp sửa đổi User.role** | Màn hình giao việc của Manager gọi API đổi vai trò nhân viên từ Staff lên Manager. | **FAIL** (Bị cấm) | Bác bỏ tại Mục 4 (Interaction Matrix). Quyền sở hữu vai trò thuộc độc quyền `Identity & Access Management`. Manager CẤM phân quyền. | **PASS (Đã chặn đứng)** |
| **CASE C: Identity Context trực tiếp thay đổi TaskStatus** | Khi khóa tài khoản User, IAM tự động đổi trạng thái các task đang giao sang `CANCELLED`. | **FAIL** (Bị cấm) | Bác bỏ tại Mục 4. IAM không sở hữu Task. Việc điều chuyển task thuộc quyền Manager trong `Work Management` qua cơ chế `Reassign`. | **PASS (Đã chặn đứng)** |
| **CASE D: Cập nhật Tree Asset Registry ghi đè GPS/bằng chứng cũ** | Admin đổi tọa độ chuẩn của cây làm thay đổi tọa độ GPS thực tế lưu trong task cũ. | **FAIL** (Bị cấm) | Bác bỏ tại Mục 5 (Bản chụp lịch sử). Task cũ bảo lưu bất biến bản chụp tọa độ lúc thi công; TAR chỉ cập nhật dữ liệu gốc hiện hành. | **PASS (Đã chặn đứng)** |
| **CASE E: Hai ngữ cảnh cùng tuyên bố sở hữu thực thể Task** | Cả Work Management và Review Context đều coi mình là chủ sở hữu ghi của Task. | **FAIL** (Bị cấm) | Bác bỏ tại Mục 2 và Mục 3.1. `Review & QC` đã được hợp nhất hoàn toàn vào `Work Management`; chỉ duy nhất 1 ngữ cảnh sở hữu Task. | **PASS (Đã chặn đứng)** |
| **CASE F: Review Context và Work Context cùng biến đổi vòng đời Task không có quy tắc** | Hai micro-service riêng biệt cùng bắn lệnh cập nhật trạng thái Task độc lập. | **FAIL** (Bị cấm) | Bác bỏ tại Mục 3.1. Hợp nhất vào `Work Management` bảo đảm duy nhất 1 cỗ máy trạng thái điều phối vòng đời 7 trạng thái tất định. | **PASS (Đã chặn đứng)** |
| **CASE G: Sổ kiểm toán Audit Log có thể bị sửa đổi bởi Admin** | Admin gọi lệnh cập nhật hoặc xóa một dòng sự kiện trong `AuditEvent`. | **FAIL** (Bị cấm) | Bác bỏ tại Mục 2 (Candidate G) và ADM-SOD-03. `AuditEvent` là Append-Only; Admin chỉ có quyền đọc/lọc, cấm sửa xóa 100%. | **PASS (Đã chặn đứng)** |
| **CASE H: Offline Sync trở thành ngữ cảnh nghiệp vụ và thêm trạng thái OFFLINE_SUBMITTED** | Thêm enum `OFFLINE_SUBMITTED` vào trường `TaskStatus` của nhiệm vụ. | **FAIL** (Bị cấm) | Bác bỏ tại Mục 2 (Candidate I), Mục 3.2 và DR-MVP-03. Đồng bộ là hạ tầng kỹ thuật; `TaskStatus` gồm đúng 7 trạng thái chuẩn tắc. | **PASS (Đã chặn đứng)** |
| **CASE I: Findings Template là NEXT làm biến mất Structured Findings trong MVP** | Bỏ qua việc thu thập dữ liệu bệnh trạng cây vì công cụ tạo biểu mẫu động chưa làm. | **FAIL** (Bị cấm) | Bác bỏ tại Mục 6 và SC-01. Trong MVP bắt buộc thu thập `Structured Findings` theo lược đồ chuẩn tắc cố định; chỉ có công cụ động là NEXT. | **PASS (Đã chặn đứng)** |
| **CASE J: Thay đổi chính sách ProofPolicy làm hồi tố yêu cầu bằng chứng task cũ** | Admin đổi loại việc sang profile ngặt hơn làm task đã nộp trong quá khứ bị báo thiếu ảnh. | **FAIL** (Bị cấm) | Bác bỏ tại Mục 5. `ProofPolicyMapping` là `VERSIONED`. Task khi tạo chốt cứng `policyVersionId` tại thời điểm đó, cấm mọi hồi tố. | **PASS (Đã chặn đứng)** |
| **CASE K: Sinh CareHistory từ nhiệm vụ ở trạng thái WAITING_REVIEW** | Hệ thống chiếu dữ liệu chăm sóc vào hồ sơ cây ngay khi nhân viên vừa nộp bài chờ duyệt. | **FAIL** (Bị cấm) | Bác bỏ tại Mục 6 và DR-HARD-07. **DUY NHẤT** nhiệm vụ đạt trạng thái `COMPLETED` mới được phép ghi vào `CareHistory`. | **PASS (Đã chặn đứng)** |
| **CASE L: Đồng nhất ReportFieldIssue và StructuredFindings làm một** | Dùng chung form báo cáo sự cố để lưu thông số khám bệnh cây. | **FAIL** (Bị cấm) | Bác bỏ tại Mục 6. `ReportFieldIssue` là sự cố ách tắc thi công (đưa task về `BLOCKED`); `StructuredFindings` là dữ liệu khám bệnh chuyên sâu. | **PASS (Đã chặn đứng)** |

---

## 9. Các Chuẩn Đoán Nhất Quán Bổ Sung (Consistency Oracles BC-01..BC-08)

Xác minh 8 chuẩn đoán nhất quán nhằm đảm bảo mô hình không bị thoái hóa kiến trúc:

- **BC-01 (Không tạo context chỉ vì có màn hình UI)**: Ngữ cảnh không sinh ra chỉ vì ứng dụng có thêm tab màn hình (ví dụ: màn hình thông báo không tạo nên Notifications Bounded Context). $\to$ **PASS**.
- **BC-02 (Không tạo context chỉ vì có bảng cơ sở dữ liệu)**: Bảng dữ liệu phụ thuộc không tự động biến thành ngữ cảnh độc lập nếu không có logic nghiệp vụ tự chủ. $\to$ **PASS**.
- **BC-03 (Không tài nguyên nào có 2 chủ sở hữu ghi xuyên ngữ cảnh)**: 100% tài nguyên trong Ma trận Mục 3 của tài liệu `05-DOMAIN-OWNERSHIP-MATRIX.md` có đúng 1 Owning Context duy nhất. $\to$ **PASS**.
- **BC-04 (Tác nhân và Ngữ cảnh không bao giờ đồng nhất làm một)**: Tuyệt đối không tồn tại "Admin Context" hay "Manager Context". Tác nhân tương tác xuyên qua ranh giới ngữ cảnh. $\to$ **PASS**.
- **BC-05 (Xử lý kỹ thuật của System không biến thành thẩm quyền nghiệp vụ)**: System chỉ thực thi ghi log hoặc kích hoạt đồng bộ nền kỹ thuật; không có thẩm quyền tự phong quyền quản trị. $\to$ **PASS**.
- **BC-06 (Bảo toàn nguyên vẹn vòng đời 7 trạng thái của Task)**: Không thêm, không bớt bất kỳ trạng thái nào trong tập: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`. $\to$ **PASS**.
- **BC-07 (Bảo toàn nguyên vẹn ngữ nghĩa 3 Proof Profiles)**: `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF` giữ nguyên hợp đồng chứng cứ chuẩn tắc. $\to$ **PASS**.
- **BC-08 (Bảo toàn phân loại 13 năng lực của Quản trị hệ thống)**: Giữ nguyên vẹn tỷ lệ đã chốt tại Phase 2: **9 MVP**, **3 NEXT**, **0 RESERVED**, **1 REJECTED**. $\to$ **PASS**.

---

## 10. Bảng Bằng Chứng Nghiệm Thu Cổng Phase 3 (Phase 3 Evidence Table)

Nghiệm thu toàn bộ 10 tiêu chí cổng chất lượng khắt khe của Phase 3 theo đúng Master Plan:

| Gate ID | Tiêu chí Nghiệm thu (Requirement) | Phương pháp Xác minh (Verification Method) | Bằng chứng Cụ thể (Concrete Evidence) | Tính Chặn (Blocking) | Kết quả Nghiệm thu (Result) |
|---|---|---|---|:---:|:---:|
| **P3-01** | Mọi Cụm thực thể / Tài nguyên có chủ sở hữu duy nhất | Single Owner Audit | [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 3: 100% tài nguyên nghiệp vụ có thẩm quyền có đúng 1 Owning Context độc quyền; bản chiếu dẫn xuất và trạng thái kỹ thuật được phân định phi thẩm quyền (P3-SC-04). | **YES** | **PASS** |
| **P3-02** | Quyền sở hữu Người dùng & Vai trò rõ ràng | IAM Ownership Inspection | [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 3 & Tài liệu này Mục 2: `User`, `Account`, `RoleAssignment` thuộc độc quyền `Identity & Access Management`. | **YES** | **PASS** |
| **P3-03** | Quyền sở hữu Dữ liệu gốc Cây xanh rõ ràng | Tree Master Data Ownership Audit | [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 3 & Tài liệu này Mục 2: `Tree` và `TreeMasterData` thuộc độc quyền `Tree Asset Registry`. | **YES** | **PASS** |
| **P3-04** | Quyền sở hữu Vận hành Nhiệm vụ giữ vững rõ ràng | Task Operational Ownership Verification | [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 3 & Tài liệu này Mục 2: `Task` và chu trình 7 trạng thái thuộc độc quyền `Work Management`. | **YES** | **PASS** |
| **P3-05** | Quyền sở hữu Chính sách Bằng chứng rõ ràng | Proof Policy Governance Audit | [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 3 & Tài liệu này Mục 2: `ProofPolicyMapping`, `ChecklistTemplate`, `TaskTypeCatalog` thuộc `Policy & Template Governance`. | **YES** | **PASS** |
| **P3-06** | Quyền sở hữu Sự kiện Kiểm toán rõ ràng | Audit Event Ownership Check | [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 3 & Tài liệu này Mục 2: `AuditEvent` (`DOMAIN EVENT`) thuộc độc quyền `Audit & Compliance`, cấm Admin sửa xóa. | **YES** | **PASS** |
| **P3-07** | Không có ngữ cảnh chồng chéo trách nhiệm vô lý | Overlapping Boundary Elimination Audit | Tài liệu này Mục 2 & Mục 3.1: Hợp nhất `Field Verification` và `Review` vào `Work Management`; loại bỏ 100% xung đột ghi. | **YES** | **PASS** |
| **P3-08** | Quản trị Admin không xâm nhập quy trình thực địa | Non-Invasion Verification | [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 3 & Tài liệu này Mục 8 (Case A): Admin bị DENY 100% trên vận hành tác vụ thực địa. | **YES** | **PASS** |
| **P3-09** | Quyền tác giả và dữ liệu lịch sử được bảo toàn | Historical Preservation Verification | [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 5 & Tài liệu này Mục 5: 6 nguyên tắc bảo toàn lịch sử ngăn chặn mọi hồi tố dữ liệu. | **YES** | **PASS** |
| **P3-10** | Ngôn ngữ chuẩn tắc được chuẩn hóa toàn diện | Ubiquitous Language Delta Audit | Tài liệu này Mục 6 & Mục 7: Định nghĩa chuẩn 18 thuật ngữ cốt lõi và cấm tuyệt đối 10 phép đồng nhất sai lệch. | **YES** | **PASS** |

---

## 11. Báo Cáo Đóng Khép Ngữ Nghĩa Phase 3 (Phase 3 Semantic Closure Review)

Báo cáo nghiệm thu khắc phục triệt để 5 khiếm khuyết ngữ nghĩa được chỉ ra bởi kiểm toán độc lập:

| Mã Khiếm Khuyết (Defect ID) | Tiêu chí Đóng khép Ngữ nghĩa (Semantic Closure Requirement) | Phương pháp Xác minh (Verification Method) | Bằng chứng Cụ thể (Concrete Evidence) | Kết quả Nghiệm thu (Result) |
|---|---|---|---|:---:|
| **P3-SC-01** | Phân loại DDD đơn trị, loại bỏ nhãn kép | Single Classification Discipline Audit | [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 2 & 3: `EvidenceAttempt` $\to$ **`ENTITY`**; `FindingsSchema` $\to$ **`POLICY`**; `AuditEvent` $\to$ **`DOMAIN EVENT`**. 0 xuất hiện nhãn kép. P3-SC-NT-01..02 PASS. | **PASS** |
| **P3-SC-02** | Bảo toàn đầy đủ 4 kết luận thẩm định | Review Outcomes Cardinality Audit | Tài liệu này Mục 2 (Candidate E) & Mục 6: Mọi vị trí liệt kê ReviewDecision đều nêu đủ 4 kết luận: `APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, `CANCEL`. P3-SC-NT-03 PASS. | **PASS** |
| **P3-SC-03** | Giải quyết mâu thuẫn tính khả biến mã QR | Tree Identity Mutability Audit | [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 2, 3, 5 & Tài liệu này Mục 5, 6: `treeId` bất biến vĩnh viễn; `qrCode` khả biến có kiểm soát bởi Admin; đổi mã QR KHÔNG làm đổi kết quả quét QR cũ hay CareHistory. P3-SC-NT-04..05 PASS. | **PASS** |
| **P3-SC-04** | Làm rõ Notification là bản chiếu dẫn xuất | Derived Read Model Specification Audit | [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 3 & Tài liệu này Mục 2 (Candidate H), Mục 10 (P3-01): `Notification` là **`N/A — BẢN CHIẾU DẪN XUẤT`**, phi thẩm quyền, không có 2 owning contexts. P3-SC-NT-06 PASS. | **PASS** |
| **P3-SC-05** | Loại bỏ can thiệp kỹ thuật quá sớm | Technical Overreach Elimination Audit | [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 4.6 & Tài liệu này Mục 3.1: Loại bỏ áp đặt chữ ký/băm tại AuditEvent; loại bỏ giả định ép buộc Saga/Distributed Transactions tại hợp nhất context. P3-SC-NT-07..08 PASS. | **PASS** |

---

## 12. Thử Nghiệm Phủ Định Đóng Khép Ngữ Nghĩa (Phase 3 Semantic Closure Negative Tests)

Bổ sung 8 kịch bản kiểm thử độc lập kiểm chứng tính chặt chẽ của việc đóng khép ngữ nghĩa Phase 3:

| Mã Ca Kiểm Thử | Phát biểu giả định sai phạm | Kết quả mong đợi | Đánh giá thực tế trong Quy tắc Chốt | Kết luận |
|---|---|:---:|---|:---:|
| **P3-SC-NT-01** | EvidenceAttempt đồng thời vừa là Entity vừa là Value Object. | **FAIL** (Vi phạm kỷ luật đơn trị) | Bác bỏ tại [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 2. `EvidenceAttempt` có định danh theo phiên (`attemptNumber`) và được phân loại chuẩn tắc duy nhất là **`ENTITY`**. | **PASS (Đã chặn đứng)** |
| **P3-SC-NT-02** | AuditEvent bắt buộc phải là Aggregate chỉ vì nó được lưu trữ trong cơ sở dữ liệu. | **FAIL** (Sai lệch khái niệm DDD) | Bác bỏ tại [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 4.6. Mỗi `AuditEvent` là một bản ghi sự kiện bất biến độc lập (**`DOMAIN EVENT`**), không có giao dịch đột biến bên trong. | **PASS (Đã chặn đứng)** |
| **P3-SC-NT-03** | Quy trình thẩm định của Manager chỉ có 3 kết luận (APPROVE / REQUEST_REWORK / CANCEL). | **FAIL** (Thiếu kết luận chuẩn tắc) | Bác bỏ tại Mục 2 (Candidate E) và Mục 6. ReviewDecision có đúng 4 kết luận dứt điểm, bắt buộc bao gồm `APPROVE_WITH_EXCEPTION`. | **PASS (Đã chặn đứng)** |
| **P3-SC-NT-04** | Mã `qrCode` gắn trên thân cây là bất biến vĩnh viễn trong mọi hoàn cảnh, không thể cấp đổi. | **FAIL** (Trái thực tế vận hành) | Bác bỏ tại Mục 6 và P3-SC-03. `treeId` là bất biến; `qrCode` là nhãn Master Data có thể cập nhật có kiểm soát khi tem bị hỏng/mất ngoài thực địa. | **PASS (Đã chặn đứng)** |
| **P3-SC-NT-05** | Khi Admin cấp đổi mã QR của cây, dữ liệu quét mã của các task cũ trong quá khứ bị sửa đổi theo mã mới. | **FAIL** (Vi phạm bảo toàn lịch sử) | Bác bỏ tại Mục 5 (Bản chụp lịch sử) và P3-SC-03. Task cũ lưu giữ bất biến `qrCodeSnapshot` và `TreeIdentityVerification` tại thời điểm quét, cấm hồi tố. | **PASS (Đã chặn đứng)** |
| **P3-SC-NT-06** | Notification có hai ngữ cảnh cùng tuyên bố sở hữu thẩm quyền (Dual Authoritative Ownership). | **FAIL** (Trái nguyên tắc đơn chủ) | Bác bỏ tại Mục 2 (Candidate H) và P3-SC-04. Notification là bản chiếu dẫn xuất (`DERIVED READ MODEL`), không phải aggregate có thẩm quyền. | **PASS (Đã chặn đứng)** |
| **P3-SC-NT-07** | Phase 3 bắt buộc mô hình hóa chữ ký số hoặc mã băm mật mã học cho từng AuditEvent. | **FAIL** (Can thiệp kỹ thuật quá sớm) | Bác bỏ tại [`05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) Mục 4.6 và P3-SC-05A. Cơ chế bảo toàn toàn vẹn kỹ thuật được bàn giao cho Kiến trúc kỹ thuật / NFR / ADR. | **PASS (Đã chặn đứng)** |
| **P3-SC-NT-08** | Việc chia tách context bắt buộc phải triển khai mô hình Saga hoặc giao dịch phân tán. | **FAIL** (Ép buộc giải pháp kỹ thuật) | Bác bỏ tại Mục 3.1 và P3-SC-05B. Hợp nhất context dựa trên các bất biến nghiệp vụ của `Task`; giải pháp tích hợp kỹ thuật được xem xét tại Phase 11. | **PASS (Đã chặn đứng)** |

---

## 13. Kết Luận Cổng Nghiệm Thu Phase 3 (Phase 3 Exit Gate)

```text
================================================================================
PHASE 3 PASS — SEMANTICALLY CLOSED
— DOMAIN RESOURCE CLASSIFICATIONS SINGLE-VALUED
— FOUR REVIEW OUTCOMES PRESERVED
— TREE IDENTITY MUTABILITY RECONCILED
— DERIVED READ MODEL OWNERSHIP CLARIFIED
— TECHNICAL OVERREACH REMOVED
— READY FOR PHASE 4 AUTHORIZATION & ACTION ELIGIBILITY
================================================================================
```
