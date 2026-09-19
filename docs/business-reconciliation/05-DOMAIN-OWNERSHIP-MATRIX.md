# NOVYX GreenOps — Domain Ownership Matrix (Phase 3)

> **Tài liệu chuẩn mực phân định quyền sở hữu tài nguyên miền và ranh giới trách nhiệm**
> Thuộc chu trình: **Business Baseline Reconciliation — Phase 3**.
> Căn cứ chuẩn tắc:
> - [`docs/business-reconciliation/02-ACTOR-MODEL-DECISION.md`](02-ACTOR-MODEL-DECISION.md) (Ranh giới 4 tác nhân)
> - [`docs/business-reconciliation/03-ROLE-NAMING-TAXONOMY.md`](03-ROLE-NAMING-TAXONOMY.md) (Danh xưng 3 tầng)
> - [`docs/business-reconciliation/04-ADMIN-BUSINESS-SCOPE-DECISION.md`](04-ADMIN-BUSINESS-SCOPE-DECISION.md) (Phạm vi nghiệp vụ Quản trị hệ thống)
> - [`docs/DOMAIN.md`](../DOMAIN.md) (Kiến trúc miền chuẩn tắc)
> - [`docs/WORKFLOWS.md`](../WORKFLOWS.md) (Quy trình tác nghiệp chuẩn tắc)
> - [`docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md`](../NOVYX_Business_Baseline_Reconciliation_Master_Plan.md)
>
> **Ranh giới thực thi (Hard Scope Rule)**:
> - Phase 3 chỉ xác lập **RANH GIỚI SỞ HỮU MIỀN NGHIỆP VỤ (Business Domain Ownership Boundaries)**.
> - **KHÔNG** sửa mã nguồn ứng dụng (`apps/**`), không sửa thư viện chia sẻ (`packages/**`).
> - **KHÔNG** sửa đổi tài liệu canonical (`PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `REQUIREMENTS-TRACEABILITY.md`, `NFR.md`).
> - **KHÔNG** tái cấu trúc package, không thiết kế schema cơ sở dữ liệu, không chọn thư viện kỹ thuật (Zustand, SQLite, WatermelonDB, v.v.).

---

## 1. Nền Tảng Khái Niệm: Phân Tách 4 Khái Niệm Độc Lập

Để ngăn chặn triệt để tình trạng nhầm lẫn kiến trúc (ví dụ: đánh đồng *"Admin sở hữu chức năng phân quyền"* với *"Admin là một Bounded Context"*), dự án thiết lập quy tắc bất biến phân tách rạch ròi 4 tầng khái niệm:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FOUR INDEPENDENT LAYERS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. ACTOR (Tác nhân)                                                        │
│     = Thực thể con người hoặc kỹ thuật thực hiện hành vi.                   │
│     Ví dụ: Field Staff, Operations Manager, Platform Administrator, System. │
├─────────────────────────────────────────────────────────────────────────────┤
│  2. CAPABILITY (Năng lực nghiệp vụ)                                         │
│     = Khả năng hành động nghiệp vụ do hệ thống cung cấp cho tác nhân.       │
│     Ví dụ: User Provisioning, Role Assignment, Start Task, Review.          │
├─────────────────────────────────────────────────────────────────────────────┤
│  3. AGGREGATE / DOMAIN RESOURCE (Cụm thực thể / Tài nguyên miền)            │
│     = Biên giới nhất quán dữ liệu nghiệp vụ có trạng thái.                  │
│     Ví dụ: User, Tree, Task, ProofPolicyMapping, AuditEvent.                │
├─────────────────────────────────────────────────────────────────────────────┤
│  4. BOUNDED CONTEXT (Ngữ cảnh giới hạn)                                     │
│     = Ranh giới sở hữu ngữ nghĩa mang mô hình và ngôn ngữ chung nhất quán.  │
│     Ví dụ: Identity & Access, Work Management, Tree Registry, Governance.   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Bất biến cốt lõi (Core Invariant):
$$\mathbf{Actor \ne Capability \ne Aggregate \ne Bounded\ Context}$$

- **Tác nhân không phải là Ngữ cảnh**: `Platform Administrator` là một tác nhân con người nắm giữ quyền lực quản trị, nhưng toàn bộ thực thể người dùng và phân quyền do tác nhân này thao tác thuộc quyền sở hữu của ngữ cảnh **`Identity & Access Management`**, chứ không tồn tại một "Admin Bounded Context".
- **Thẩm quyền thao tác không phải là Quyền sở hữu miền**: `Platform Administrator` có thẩm quyền đọc/lọc sổ kiểm toán, `System` có thẩm quyền ghi nối tiếp sự kiện kiểm toán, nhưng thực thể `AuditEvent` thuộc quyền sở hữu của ngữ cảnh **`Audit & Compliance`**.
- **Tác nhân vận hành không sở hữu ngữ cảnh**: `Operations Manager` ra lệnh phân công và phê duyệt nhiệm vụ, nhưng thực thể `Task` thuộc quyền sở hữu của ngữ cảnh **`Work Management`**.

---

## 2. Kiểm Kê Toàn Diện Tài Nguyên Miền (Domain Resource Inventory)

Dưới đây là danh mục kiểm kê toàn bộ các tài nguyên, thực thể và trạng thái nghiệp vụ xuất hiện trong hệ thống NOVYX GreenOps, được phân loại chính xác theo mẫu hình Domain-Driven Design (DDD) mà không suy diễn quá mức:

| STT | Tài nguyên miền (Domain Resource) | Định danh kỹ thuật | Phân loại DDD (Classification) | Mô tả vai trò & Biên giới nhất quán |
|:---:|---|---|:---:|---|
| 1 | **Người dùng** | `User` | **`AGGREGATE`** | Thực thể gốc đại diện cho nhân sự, định danh duy nhất bằng `userId`, sở hữu thông tin liên hệ, trạng thái tài khoản và vai trò. |
| 2 | **Hồ sơ đăng nhập & Xác thực** | `Account` | **`ENTITY`** | Thực thể con gắn liền với `User`, quản lý thông tin xác thực, mật khẩu/mã hóa, phiên đăng nhập và trạng thái khóa tạm thời. |
| 3 | **Bản ghi Phân quyền Vai trò** | `RoleAssignment` | **`ENTITY`** | Thực thể lưu vết lịch sử gán vai trò (`actorId`, `targetUserId`, `oldRole`, `newRole`, `timestamp`, `reason`). |
| 4 | **Trạng thái Tài khoản** | `AccountStatus` | **`VALUE OBJECT`** | Trạng thái vòng đời tài khoản bất biến: `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`. |
| 5 | **Cây xanh Đô thị** | `Tree` | **`AGGREGATE`** | Thực thể gốc đại diện cho tài sản cây xanh, định danh bằng `treeId`, gắn mã QR vật lý và tọa độ chuẩn tắc. |
| 6 | **Định danh Cây** | `TreeIdentity` | **`VALUE OBJECT`** | Cặp định danh bất biến `(treeId, qrCode)` dùng để đối chiếu khi quét mã ngoài thực địa. |
| 7 | **Dữ liệu Gốc Cây xanh** | `TreeMasterData` | **`ENTITY`** | Thuộc tính tài sản gốc: chủng loại cây, ngày trồng, chiều cao, đường kính thân, tọa độ chuẩn `(lat, lng)`, trạng thái sinh trưởng. |
| 8 | **Nhiệm vụ Chăm sóc Cây** | `Task` | **`AGGREGATE`** | Thực thể gốc trung tâm điều phối toàn bộ chu trình chăm sóc 1 cây, sở hữu vòng đời 7 trạng thái, phân công, xác thực và bằng chứng. |
| 9 | **Phân công Nhiệm vụ** | `TaskAssignment` | **`VALUE OBJECT`** | Dữ liệu gán việc cho nhân sự: `assignedStaffId`, `assignedByManagerId`, `assignedAt`. |
| 10 | **Vòng đời Nhiệm vụ** | `TaskLifecycle` | **`VALUE OBJECT`** | Bộ máy trạng thái hữu hạn gồm đúng 7 trạng thái tất định: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`. |
| 11 | **Giải pháp Tháo gỡ Sự cố** | `BlockedResolution` | **`VALUE OBJECT`** | Quyết định xử lý của Manager khi task bị `BLOCKED`: gồm 3 lối thoát duy nhất `RESUME`, `REASSIGN`, `CANCEL`. |
| 12 | **Hồ sơ Xác thực Hiện trường** | `SiteVerification` | **`VALUE OBJECT`** | Kết quả đối soát hai tín hiệu độc lập: `GpsVerification` ($\le 10$m) và `TreeIdentityVerification` (quét QR), kèm cờ giải trình nếu có. |
| 13 | **Xác thực Tọa độ GPS** | `GpsVerification` | **`VALUE OBJECT`** | Dữ liệu đo đạc GPS thực tế: tọa độ thiết bị, độ chính xác (bán kính mét), khoảng cách tới gốc cây, trạng thái đạt/vượt ngưỡng $\le 10$m. |
| 14 | **Xác thực Mã QR Cây** | `TreeIdentityVerification` | **`VALUE OBJECT`** | Dữ liệu quét mã QR: chuỗi mã quét được, thời điểm quét, kết quả đối khớp với `treeId` của nhiệm vụ. |
| 15 | **Ngoại lệ Xác thực Hiện trường** | `VerificationException` | **`VALUE OBJECT`** | Cờ ngoại lệ có kiểm soát: `LOCATION_EXCEPTION`, `IDENTITY_EXCEPTION`, `EVIDENCE_INTEGRITY_EXCEPTION` kèm lý do bắt buộc. |
| 16 | **Hồ sơ Bằng chứng Chuẩn** | `ProofProfile` | **`VALUE OBJECT`** | Định danh chính sách bằng chứng bắt buộc: `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`. |
| 17 | **Quy tắc Ánh xạ Bằng chứng** | `ProofPolicyMapping` | **`AGGREGATE`** | Bảng chính sách toàn hệ thống quy định ánh xạ $\text{TaskType} \to \text{ProofProfile}$, được quản lý đa phiên bản (`PolicyVersion`). |
| 18 | **Mẫu Tiêu chí Kiểm tra** | `ChecklistTemplate` | **`AGGREGATE`** | Biểu mẫu danh mục kiểm tra kỹ thuật, định danh bằng `templateId`, quản lý đa phiên bản (`TemplateVersion`). |
| 19 | **Lược đồ Ghi nhận Bệnh trạng** | `FindingsSchema` | **`POLICY / SPEC`** | Lược đồ chuẩn tắc cố định trong MVP (Fixed Canonical Schema); công cụ tạo biểu mẫu động là `NEXT`. |
| 20 | **Hồ sơ Bằng chứng Công việc** | `TaskEvidence` | **`ENTITY`** | Tập hợp các phiên nộp chứng cứ gắn liền với một `Task`, theo dõi tiến độ thu thập (`ProofProgress`). |
| 21 | **Lần Nộp Bằng chứng Thực địa** | `EvidenceAttempt` | **`ENTITY / VO`** | Bản ghi nộp chứng cứ bất biến theo phiên (`attemptNumber`), chứa ảnh hiện trường, checklist snapshot, structured findings, tọa độ và thời gian. |
| 22 | **Ghi nhận Bệnh trạng Có cấu trúc** | `StructuredFindings` | **`VALUE OBJECT`** | Dữ liệu khám bệnh chuyên sâu (độ nghiêng, mục rỗng, sâu bệnh, cành khô) bắt buộc của `INSPECTION_PROOF`. |
| 23 | **Bản chụp Danh mục Tiêu chí** | `ChecklistSnapshot` | **`VALUE OBJECT`** | Bản chụp cố định nội dung checklist tại thời điểm giao/nhận việc, không bị ảnh hưởng khi mẫu gốc thay đổi. |
| 24 | **Phán quyết Thẩm định** | `ReviewDecision` | **`VALUE OBJECT`** | Quyết định đóng cổng chất lượng của Manager gồm đúng 4 kết luận: `APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, `CANCEL`. |
| 25 | **Yêu cầu Làm lại Có mục tiêu** | `ReworkRequest` | **`VALUE OBJECT`** | Chỉ định khâu bằng chứng sai sót kèm mô tả lỗi, bảo lưu chứng cứ hợp lệ cũ của các khâu đạt chuẩn. |
| 26 | **Biên bản Hủy việc** | `Cancellation` | **`VALUE OBJECT`** | Bản ghi đóng việc bất khả kháng: `actorId`, `reason`, `timestamp`, trạng thái trước khi hủy. |
| 27 | **Lịch sử Chăm sóc Chính thức** | `CareHistory` | **`READ MODEL`** | Bản chiếu lịch sử pháp lý của cây xanh, **CHỈ SINH RA KHI TASK ĐẠT `COMPLETED`**, bất biến vĩnh viễn. |
| 28 | **Sự kiện Nhật ký Kiểm toán** | `AuditEvent` | **`AGGREGATE / EVENT`** | Bản ghi kiểm toán bất biến ghi nhận mọi biến động bảo mật và dữ liệu: `actor`, `action`, `resource`, `payload`, `timestamp`. |
| 29 | **Thông báo Vận hành** | `Notification` | **`READ MODEL`** | Bản ghi tin nhắn/thông báo gửi tới tác nhân khi có biến động task hoặc sự kiện an ninh. |
| 30 | **Trạng thái Đồng bộ Ngoại tuyến** | `SyncStatus` / `LocalSubmissionStatus` | **`TECHNICAL STATE`** | Trạng thái hạ tầng truyền tải mạng (`SYNCED`, `PENDING_SYNC`, `SYNC_FAILED`), hoàn toàn tách rời khỏi nghiệp vụ. |

---

## 3. Ma Trận Phân Định Quyền Sở Hữu Miền (Domain Ownership Matrix)

Nguyên tắc bất biến: **Một tài nguyên có trạng thái chỉ thuộc quyền sở hữu ghi (Write Authority) của DUY NHẤT một Bounded Context**. Mọi truy cập từ ngữ cảnh khác đều là đọc gián tiếp (Read / Reference / Projection) hoặc gửi yêu cầu/sự kiện.

| Tài nguyên / Cụm thực thể | Phân loại | Ngữ cảnh Sở hữu (Owning Context) | Tác nhân Ghi (Business Writers) | Tác nhân Đọc (Readers) | Bất biến Nghiệp vụ Bắt buộc (Invariants) | Quy tắc Bảo toàn Lịch sử (Historical Preservation) | Căn cứ Bằng chứng (Evidence) |
|---|:---:|---|---|---|---|---|:---:|
| **User & Account** | `AGGREGATE` | **Identity & Access Management** | Platform Administrator (tạo, kích hoạt, khóa, mở khóa) | Toàn hệ thống (xác thực danh tính) | Email/Phone là duy nhất; Tự đăng ký bị CẤM (khép kín); Manager không có quyền tạo/khóa User. | Khóa tài khoản (`SUSPENDED`/`DISABLED`) KHÔNG xóa dữ liệu người dùng hay lịch sử công việc. | CAP-ADM-01, CAP-ADM-03, ADM-SOD-01 |
| **RoleAssignment** | `ENTITY` | **Identity & Access Management** | Platform Administrator (chỉ định vai trò) | Toàn hệ thống (kiểm soát phân quyền) | Vai trò chỉ thuộc tập `{'staff', 'manager', 'admin'}`; Admin CẤM tự sửa role của chính mình (ADM-SOD-01); Manager CẤM phân quyền. | Mọi lần đổi vai trò sinh dòng kiểm toán bất biến; KHÔNG ghi đè lịch sử vai trò cũ. | CAP-ADM-02, P2-04, SC-03 |
| **Tree & TreeMasterData** | `AGGREGATE` | **Tree Asset Registry** | Platform Administrator (tạo mới, sửa thuộc tính gốc, gắn mã QR, cho nghỉ hưu) | Manager, Staff (tra cứu hiện trường) | `treeId` và mã `qrCode` là duy nhất toàn hệ thống; Thay đổi thuộc tính gốc bắt buộc có lý do và lưu vết kiểm toán. | Cập nhật Master Data KHÔNG ghi đè tọa độ thực tế do nhân viên đo đạc trong các task cũ. | CAP-ADM-06, P2-07, Mục 8 |
| **Task & TaskLifecycle** | `AGGREGATE` | **Work Management** | Operations Manager (tạo, phân công, duyệt, hủy); Staff (bắt đầu, nộp việc) | Staff, Manager, Tree Registry (chiếu CareHistory) | Gắn cố định 1 cây (`DR-HARD-01`); Vòng đời đúng 7 trạng thái (`DR-MVP-03`); Admin DENY 100% trên mutation task thông thường. | Nhiệm vụ đã ở trạng thái `COMPLETED` hoặc `CANCELLED` là BẤT BIẾN VĨNH VIỄN (`DR-HARD-05`). | DR-HARD-01..07, CAP-ADM-07, Ma trận Mục 5 |
| **SiteVerification** | `VALUE OBJECT` | **Work Management** | Field Staff (quét QR, lấy mẫu GPS) | Manager (thẩm định tại `WAITING_REVIEW`) | GPS và QR độc lập (`DR-GUIDE-01`); Ngưỡng chuẩn $\le 10$m (`DR-POL-02`); Đo GPS/quét QR KHÔNG làm đổi `TaskStatus`. | Tọa độ và mã QR đo đạc thực tế tại thời điểm thi công được lưu giữ bất biến cùng Attempt. | DR-POL-02, DR-SOFT-01..02, DOMAIN Mục 4.1 |
| **VerificationException** | `VALUE OBJECT` | **Work Management** | Field Staff (kích hoạt ngoại lệ kèm giải trình) | Operations Manager (xem xét khi nghiệm thu) | Ngoại lệ vị trí $\ne$ Xác thực vị trí đạt chuẩn; Bắt buộc có lý do giải trình để Manager hậu kiểm. | Lưu vết vĩnh viễn trong hồ sơ nghiệm thu; chiếu cờ `HAS_EXCEPTION` sang CareHistory nếu được duyệt. | DR-SOFT-01, DR-SOFT-02, DR-POL-05 |
| **TaskEvidence & Attempt** | `ENTITY / VO` | **Work Management** | Field Staff (thu thập ảnh, checklist, findings) | Operations Manager (thẩm định chất lượng) | `ProofProgress \ne TaskStatus`; Bằng chứng nộp theo phiên (`attemptNumber`); Cấm ngụy tạo ảnh (`DR-HARD-04`). | Làm lại có mục tiêu (`Targeted Rework`) sinh Attempt mới, BẢO LƯU 100% bằng chứng hợp lệ cũ (`DR-HARD-03`). | DR-HARD-03..04, DR-POL-03, P2-06 |
| **StructuredFindings** | `VALUE OBJECT` | **Work Management** | Field Staff (ghi nhận chỉ số bệnh trạng) | Operations Manager (thẩm định hồ sơ kiểm định) | Thành phần bắt buộc của `INSPECTION_PROOF`; Không bị thay thế bởi `TreeRiskStatus`, `ReportFieldIssue` hay ảnh chụp. | Dữ liệu khám bệnh lưu vĩnh viễn theo phiên nộp của nhiệm vụ kiểm định. | SC-01, CAP-ADM-10, SC-NT-01 |
| **ChecklistSnapshot** | `VALUE OBJECT` | **Work Management** | System / Field Staff (tạo bản chụp khi kích hoạt task, tích chọn kết quả) | Operations Manager (kiểm tra tuân thủ) | Chốt cứng phiên bản checklist lúc task chuyển sang `IN_PROGRESS`; Admin sửa template không làm đổi task đang chạy. | Bản chụp nội dung checklist tồn tại vĩnh viễn cùng hồ sơ nhiệm vụ. | CAP-ADM-09, P2-09, CASE F |
| **ReviewDecision** | `VALUE OBJECT` | **Work Management** | Operations Manager (ban hành phán quyết thẩm định) | Field Staff (nhận kết quả), Tree Registry (nhận tín hiệu đóng việc) | Đúng 4 kết luận (`APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, `CANCEL`); Nhân viên không được tự duyệt việc của mình. | Mọi quyết định duyệt kèm lý do và định danh người duyệt được lưu vết bất biến. | DR-HARD-02, DR-MVP-06, DR-POL-01..05 |
| **CareHistory** | `READ MODEL` | **Tree Asset Registry** | Work Management (phát tín hiệu khi Task `COMPLETED` để TAR lập chiếu) | Manager, Staff, Admin (tra cứu lịch sử cây) | CHỈ sinh ra từ task `COMPLETED` (`DR-HARD-07`); Không tạo CareHistory từ task bị Hủy hay đang chạy; Bảo lưu cờ ngoại lệ. | Bản ghi lịch sử chăm sóc là BẤT BIẾN VĨNH VIỄN, giữ nguyên vẹn tên nhân sự đã thực hiện. | DR-HARD-07, ADM-SOD-02, P2-06, Mục 8 |
| **TaskTypeCatalog** | `AGGREGATE` | **Policy & Template Governance** | Platform Administrator (thêm loại việc, kích hoạt/ngưng kích hoạt) | Operations Manager (chọn loại việc khi tạo task), Staff | `AUDIT-ONLY`; Mã định danh ổn định; CẤM xóa vật lý nếu đã có task tham chiếu; Đổi ngữ nghĩa bắt buộc tạo mới. | Các nhiệm vụ lịch sử luôn giải quyết được tên và ngữ nghĩa của loại việc ban đầu. | CAP-ADM-07, SC-02, SC-NT-02, SC-NT-07 |
| **ProofPolicyMapping** | `AGGREGATE` | **Policy & Template Governance** | Platform Administrator (ban hành phiên bản quy tắc chính sách) | Work Management (suy ra ProofProfile khi tạo task) | `VERSIONED`; Mỗi Task khi tạo lưu cố định `policyVersionId`; CẤM hồi tố lên task cũ; Manager CẤM hạ cấp profile. | Nhiệm vụ lịch sử bảo lưu chính sách bằng chứng có hiệu lực tại thời điểm tạo nhiệm vụ. | CAP-ADM-08, DR-MVP-02, P2-08, P2-09 |
| **ChecklistTemplate** | `AGGREGATE` | **Policy & Template Governance** | Platform Administrator (soạn thảo, ban hành phiên bản mẫu checklist) | Work Management (lấy bản snapshot khi giao việc) | `VERSIONED`; Đánh số `templateVersion`; Chỉnh sửa tiêu chí bắt buộc sinh phiên bản mới; Không sửa đè bản đang dùng. | Phiên bản cũ của checklist được lưu trữ vĩnh viễn trong kho chính sách. | CAP-ADM-09, P2-09, Bảng Mục 7 |
| **FindingsSchema (MVP)** | `POLICY / SPEC` | **Policy & Template Governance** | Platform Administrator (quản trị chuẩn mực lâm nghiệp) | Work Management (áp dụng cho `INSPECTION_PROOF`) | Lược đồ cố định trong MVP; Không cho phép Admin kéo thả động ngoài UI; Quản trị biểu mẫu động là `NEXT`. | Lược đồ chuẩn tắc bảo đảm tương thích dữ liệu bệnh trạng cây qua nhiều năm. | CAP-ADM-10, SC-01, Bảng Mục 7 |
| **AuditEvent** | `AGGREGATE` | **Audit & Compliance** | System (ghi nối tiếp tự động theo sự kiện nghiệp vụ) | Platform Administrator (đọc, lọc, tra cứu tuân thủ) | `APPEND-ONLY`; CẤM SỬA, CẤM XÓA (kể cả Admin); Không có quyền ghi đè; Tự thân là bằng chứng pháp lý. | Bản ghi nhật ký lưu trữ vĩnh viễn, không thể bị xóa bỏ hoặc chỉnh sửa nội dung. | CAP-ADM-05, ADM-SOD-03, P2-04..11, CASE D |
| **Notification** | `READ MODEL` | **Work Management & IAM** *(Read-Side)* | System (sinh thông báo khi có sự kiện task/role) | Người dùng đích (Staff, Manager, Admin) | Là bản chiếu hiển thị thông tin; Không chứa logic nghiệp vụ cốt lõi; Không thay thế cho Audit Log. | Thông báo có thể dọn dẹp theo chính sách lưu trữ mà không ảnh hưởng đến dữ liệu gốc. | CAP-ADM-12, DOMAIN Mục 2 |
| **SyncStatus / LocalQueue** | `TECHNICAL STATE` | **Technical Architecture** *(Ngoại vi)* | Thiết bị di động / Network Layer | Giao diện hiển thị trạng thái kết nối | Hoàn toàn tách biệt khỏi `TaskStatus`; Không tạo trạng thái lai `OFFLINE_SUBMITTED`; Chống mất dữ liệu ngoại tuyến. | Dữ liệu hàng đợi cục bộ được xóa an toàn sau khi máy chủ xác nhận đồng bộ thành công. | DR-TECH-01, DOMAIN Mục 2 |

---

## 4. Kiểm Thử Tính Nhất Quán Biên Giới Cụm Thực Thể (Aggregate Boundary Consistency Tests)

Áp dụng nguyên tắc DDD nghiêm ngặt: *Một đối tượng chỉ được coi là Aggregate nếu bên trong nó chứa đựng các quy tắc bất biến đòi hỏi tính nhất quán giao dịch (Transactional Consistency Boundary)*.

### 4.1. Thực thể Nhiệm vụ (`Task` Aggregate)
- **Căn cứ xác lập Aggregate**:
  - `Task` sở hữu toàn bộ vòng đời 7 trạng thái (`TaskLifecycle`), việc chuyển trạng thái (`PENDING` $\to$ `IN_PROGRESS` $\to$ `WAITING_REVIEW` $\to$ `COMPLETED`) phụ thuộc chặt chẽ vào dữ liệu xác thực hiện trường (`SiteVerification`) và sự đầy đủ của bằng chứng (`TaskEvidence`).
  - Khi Manager ra lệnh `REQUEST_REWORK`, trạng thái chuyển sang `REWORK_REQUIRED`, đồng thời một phiên nộp mới (`EvidenceAttempt`) được chuẩn bị, bảo lưu các bằng chứng hợp lệ cũ. Mối quan hệ này đòi hỏi tính toàn vẹn tức thời.
- **Ranh giới bao đóng**: `Task` là Root Entity, bao gồm: `TaskAssignment`, `SiteVerification`, `TaskEvidence` (gồm danh sách `EvidenceAttempt`), `FieldIssue`, `ReviewDecision`.

### 4.2. Thực thể Cây xanh (`Tree` Aggregate)
- **Căn cứ xác lập Aggregate**:
  - `Tree` đại diện cho tài sản vật lý đô thị có định danh duy nhất toàn cầu (`treeId`).
  - Các thuộc tính định danh (`qrCode`, tọa độ chuẩn ban đầu) phải luôn được bảo vệ tính toàn vẹn và không thể bị sửa đổi tùy tiện bởi nhân viên vận hành.
- **Ranh giới bao đóng**: `Tree` là Root Entity, bao gồm: `TreeMasterData`, `TreeIdentity`. Riêng `CareHistory` là **Read Model Projection** (không nằm trong giao dịch ghi của Tree).

### 4.3. Thực thể Người dùng (`User` Aggregate)
- **Căn cứ xác lập Aggregate**:
  - `User` đại diện cho một danh tính nhân sự hoạt động trong hệ thống.
  - Việc cấp phát, đổi trạng thái (`AccountStatus`), gán vai trò (`RoleAssignment`) và quản lý khóa tài khoản đòi hỏi kiểm tra tính duy nhất (Email/Phone) và lưu vết kiểm toán bắt buộc.
- **Ranh giới bao đóng**: `User` là Root Entity, bao gồm: `Account`, `AccountStatus`, danh sách `RoleAssignment`.

### 4.4. Thực thể Chính sách Bằng chứng (`ProofPolicyMapping` Aggregate)
- **Căn cứ xác lập Aggregate**:
  - Bảo vệ tính toàn vẹn của hợp đồng bằng chứng: mỗi `TaskType` phải ánh xạ tất định sang đúng 1 `ProofProfile`.
  - Được quản lý theo phiên bản chính sách (`PolicyVersion`) để ngăn ngừa triệt để lỗi sửa đổi hồi tố.
- **Ranh giới bao đóng**: `ProofPolicyMapping` là Root Entity quản lý bảng ánh xạ toàn hệ thống.

### 4.5. Thực thể Sổ Nhật ký Kiểm toán (`AuditEvent` Aggregate)
- **Căn cứ xác lập Aggregate**:
  - Mỗi bản ghi kiểm toán là một tài liệu pháp lý bất biến (`Append-Only`), có chữ ký hoặc mã băm bảo toàn toàn vẹn dữ liệu.
  - Cấm mọi hành vi can thiệp sửa đổi hoặc xóa bỏ từ bất kỳ tác nhân nào (kể cả Platform Administrator).
- **Ranh giới bao đóng**: `AuditEvent` là thực thể gốc của dòng sự kiện kiểm toán bất biến.

---

## 5. Bất Biến Bảo Toàn Lịch Sử (Historical Preservation Invariants)

Bảo vệ tính toàn vẹn dữ liệu trước mọi thao tác quản trị hoặc tái phân công công việc:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HISTORICAL DATA PRESERVATION RULES                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Cập nhật Tree Master Data KHÔNG ghi đè tọa độ thực địa đo trong quá khứ. │
│ 2. Đổi vai trò hoặc khóa User KHÔNG làm mất tên tác giả trong CareHistory.  │
│ 3. Cập nhật ProofPolicy KHÔNG áp dụng hồi tố lên task đã tạo/đã hoàn thành. │
│ 4. Sửa ChecklistTemplate KHÔNG làm thay đổi checklist của task đang chạy.   │
│ 5. Sửa TaskType Catalog bằng cách tạo mới, KHÔNG sửa đè ngữ nghĩa lịch sử.  │
│ 6. Task COMPLETED / CANCELLED là BẤT BIẾN, cấm mọi hành vi mở lại/sửa đổi.  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Ghi Nhận Khoảng Trống Hiện Thực Hóa (Current Implementation Gap Notes)

> **Lưu ý**: Đây là phần ghi nhận hiện trạng kỹ thuật làm căn cứ cho giai đoạn sau; **TUYỆT ĐỐI KHÔNG TIẾN HÀNH REFACTOR CODE TẠI PHASE 3**.

1. **Khoảng trống Gộp chung Đối tượng DTO (Shared Types Mixing Contexts)**:
   - Trong `packages/contracts`, các định nghĩa DTO hiện đang gom chung nhiều thuộc tính thuộc các ngữ cảnh khác nhau vào cùng một interface lớn (ví dụ: `TaskDto` chứa cả dữ liệu đồng bộ mạng và dữ liệu thẩm định).
2. **Khoảng trống Lưu trữ Trạng thái Tập trung (Single AppData State Object)**:
   - Trong `apps/mobile/src/services/greenOpsService.ts`, toàn bộ dữ liệu mẫu (`initialTrees`, `initialTasks`, `initialUsers`) đang được lưu chung trong một đối tượng trạng thái toàn cục, chưa phản ánh ranh giới sở hữu của từng Bounded Context.
3. **Khoảng trống Trộn lẫn Tầng Dịch vụ (Service Layer Combining Responsibilities)**:
   - Một file service duy nhất đang xử lý đồng thời việc xác thực người dùng, tạo task, nộp bằng chứng và thẩm định, vi phạm tính độc lập của các ngữ cảnh miền.
4. **Khoảng trống Thiếu vắng Thực thể Kiểm toán Độc lập (Missing Dedicated Audit Event Store)**:
   - Hiện tại hệ thống chưa có bảng/kho lưu trữ chuyên biệt cho `AuditEvent`; các hành động của Admin mới chỉ được mô phỏng qua log ứng dụng thông thường.

---

## 7. Kết Luận Bàn Giao

Ma trận sở hữu miền đã xác lập quyền sở hữu duy nhất, đơn nhất cho 100% các tài nguyên nghiệp vụ của NOVYX GreenOps. Mọi quan hệ tương tác, phân định vai trò và quyết định về các Bounded Context được cụ thể hóa chi tiết tại tài liệu kế tiếp: [`06-BOUNDED-CONTEXT-DECISIONS.md`](06-BOUNDED-CONTEXT-DECISIONS.md).
