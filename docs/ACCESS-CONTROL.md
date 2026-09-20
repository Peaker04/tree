# NOVYX GreenOps — Access Control, Actor Model & Action Eligibility

Tài liệu này là chuẩn mực duy nhất định nghĩa **MÔ HÌNH TÁC NHÂN (Actor Model)**, **QUYỀN HẠN & TRÁCH NHIỆM (Role & Responsibility)**, **QUY TẮC RÀNG BUỘC PHẠM VI (Resource Scope)** và **MA TRẬN ĐIỀU KIỆN KÍCH HOẠT HÀNH ĐỘNG (Action Eligibility Matrix)**.

---

## 1. Nguyên lý phân quyền cốt lõi (Core Authorization Principles)

Hệ thống tuân thủ nghiêm ngặt công thức 4 yếu tố xác định tính hợp lệ của mọi hành động nghiệp vụ:

$$\text{ACTION ELIGIBILITY} = \text{ACTOR ROLE} \land \text{RESOURCE SCOPE} \land \text{DOMAIN STATE} \land \text{BUSINESS PRECONDITIONS}$$

### Các nguyên tắc quản trị quyền hạn bắt buộc:
1. **Vai trò đơn thuần không đủ để cấp quyền (Role alone $\ne$ Authorization):** Có vai trò `manager` nhưng task không thuộc phạm vi phụ trách hoặc task đang ở trạng thái đóng thì vẫn bị từ chối 100%.
2. **Phân quyền không đồng nhất với hiển thị giao diện (Authorization $\ne$ UI Visibility):** Ẩn nút trên UI chỉ là hỗ trợ trải nghiệm người dùng (UX); toàn bộ logic phân quyền bắt buộc phải được bảo vệ độc lập tại tầng nghiệp vụ máy chủ.
3. **Phân định rõ rệt các mức độ thẩm quyền:**
   $$\text{READ} \ne \text{MUTATE} \ne \text{DECIDE} \ne \text{ADMINISTER}$$
   - Xem dữ liệu không đồng nghĩa có quyền sửa.
   - Quản trị nền tảng (Administer) không đồng nghĩa có quyền can thiệp vận hành (Operate/Decide).
4. **Không có quan hệ kế thừa cấp bậc (No Role Inheritance):** Tuyệt đối **KHÔNG CÓ** mô hình phân cấp `Admin > Manager > Staff`. Admin không được tự động thừa hưởng quyền của Manager; Manager không thể làm thay việc của Staff.

---

## 2. Sổ đăng ký tác nhân & Ranh giới phạm vi (Actor Registry & Scope Model)

Hệ thống phân định rạch ròi giữa **Mặt bằng Tác nghiệp (Operational Plane)**, **Mặt bằng Quản trị Nền tảng (Governance Plane)** và **Tác nhân Kỹ thuật (Technical Automation)**:

```text
NOVYX ACTOR MODEL
├── Operational Plane
│   ├── Field Staff (staff) ───────────── Scope: task.assignedStaffId == actor.userId
│   └── Operations Manager (manager) ──── Scope: AUTHORIZED_OPERATIONAL_SCOPE
├── Governance Plane
│   └── Platform Administrator (admin) ── Scope: PLATFORM_GOVERNANCE_SCOPE
└── Technical Automation
    └── System (technical actor) ──────── Scope: Deterministic system functions
```

### 2.1. Bảng phân định thẩm quyền và phạm vi dữ liệu

| Tác nhân (Canonical Term) | Tên tiếng Việt | Mã vai trò | Mặt bằng | Phạm vi tài nguyên được phép (Resource Scope) | Thẩm quyền cốt lõi được cấp | Hành vi bị CẤM tuyệt đối (Forbidden) |
|---|---|:---:|:---:|---|---|---|
| **Field Staff** | Nhân viên hiện trường | `staff` | Operational | `task.assignedStaffId == actor.userId` (Chỉ nhiệm vụ được giao). | Xem việc được giao, `StartTask`, đo GPS, quét QR, báo ngoại lệ, chụp bằng chứng, tích checklist, điền findings, `ReportFieldIssue`, nộp việc, sửa làm lại. | **CẤM tự duyệt việc của mình (`DR-HARD-02`)**; CẤM tạo việc, phân công lại, hủy việc, hoặc sửa dữ liệu của nhân viên khác. |
| **Operations Manager** | Quản lý vận hành | `manager` | Operational | `AUTHORIZED_OPERATIONAL_SCOPE` (Phạm vi địa bàn/tuyến quản lý được ủy quyền). | Tạo task, giao việc, Reassign ở `PENDING`, gỡ sự cố `BLOCKED` (Resume/Reassign/Cancel), `CancelTask`, thẩm định 4 kết luận duyệt (`Approve`, `ApproveWithException`, `RequestRework`, `Cancel`). | **CẤM can thiệp IAM/tài khoản người dùng**; CẤM tự ý hạ cấp ProofProfile; CẤM tạo/sửa Tree Master Data; CẤM sửa việc đã đóng (`COMPLETED`/`CANCELLED`). |
| **Platform Administrator** | Quản trị hệ thống | `admin` | Governance | `PLATFORM_GOVERNANCE_SCOPE` (Toàn bộ tài nguyên quản trị nền tảng). | Quản trị người dùng & vai trò (IAM), quản trị tài khoản, tra cứu nhật ký kiểm toán, quản trị dữ liệu gốc cây xanh, quản trị danh mục loại việc, ban hành chính sách bằng chứng & mẫu checklist. | **CẤM 100% các hành vi tác nghiệp nhiệm vụ thông thường (Zero normal task operations)**: CẤM tạo việc, giao việc, đổi người, bấm bắt đầu, nộp duyệt, hoặc phê duyệt task thực địa. |
| **System** | Hệ thống tự động | `System` | Technical | Toàn bộ các dịch vụ kỹ thuật nền tảng và hàng đợi máy tính. | Tự động hóa tất định: kiểm tra điều kiện tiên quyết, đo khoảng cách GPS, snapshot checklist, ánh xạ profile, chuyển gói tin Outbox, ghi nhật ký kiểm toán bất biến. | **System không phải là UserRole**. CẤM tự động phân công thay Quản lý; CẤM tự động duyệt việc (`DR-POL-01`); CẤM tự ý xóa cờ ngoại lệ. |

---

## 3. Trạng thái Vòng đời & Tính Khả dụng của Hành động (Task State vs Action Eligibility)

Quyền thao tác trên thực thể `Task` phụ thuộc chặt chẽ vào trạng thái vòng đời 7 bước:

| Trạng thái Task (`TaskStatus`) | Lệnh được phép kích hoạt | Tác nhân hợp lệ | Điều kiện tiên quyết cốt lõi | Hành vi bị CẤM TUYỆT ĐỐI tại trạng thái này |
|---|---|:---:|---|---|
| **`PENDING`** | `StartTask`<br>`ReassignTask (Case A)`<br>`CancelTask` | Staff<br>Manager<br>Manager | `assignedStaffId == actor.userId`<br>Chọn nhân sự mới `ACTIVE`<br>Nhập lý do hủy bắt buộc | CẤM Staff phân công lại hoặc hủy việc.<br>CẤM đo GPS hay nộp hồ sơ khi chưa bắt đầu. |
| **`IN_PROGRESS`** | `ReportFieldIssue`<br>`SubmitEvidence`<br>`CancelTask` | Staff<br>Staff<br>Manager | Có ảnh hiện trường + mô tả sự cố<br>100% bằng chứng đạt chuẩn ProofProfile<br>Nhập lý do hủy bắt buộc | **CẤM Quản lý phân công lại trực tiếp (`DR-HARD-06`)**.<br>CẤM chuyển sang `WAITING_REVIEW` khi chưa đủ ảnh/checklist. |
| **`BLOCKED`** | `ResumeBlockedTask`<br>`ReassignTask (Case B)`<br>`CancelTask` | Manager<br>Manager<br>Manager | Trở ngại đã giải tỏa, cùng nhân viên cũ tiếp tục<br>Chọn nhân sự mới `ACTIVE`, bảo toàn bằng chứng cũ<br>Lý do hủy bất khả kháng | **CẤM Staff tự ý mở lại hoặc tự hủy việc**.<br>CẤM chuyển trực tiếp từ `BLOCKED` sang `COMPLETED`. |
| **`WAITING_REVIEW`** | `ApproveTask`<br>`ApproveWithException`<br>`RequestRework`<br>`CancelTask` | Manager<br>Manager<br>Manager<br>Manager | Hồ sơ đạt 100% tiêu chuẩn chất lượng<br>Có lý do ngoại lệ hợp lệ, Quản lý chịu trách nhiệm<br>Chỉ rõ khâu sai sót (`targetedArea`) + lý do<br>Lý do hủy bắt buộc | **CẤM người thi công tự duyệt việc của mình (`DR-HARD-02`)**.<br>CẤM Admin phê duyệt thay Quản lý.<br>CẤM phân công lại khi đang chờ duyệt. |
| **`REWORK_REQUIRED`** | `ResubmitRework`<br>`CancelTask` | Staff<br>Manager | Sửa đúng khâu bị từ chối, tạo phiên nộp mới<br>Nhập lý do hủy khi không thể khắc phục | **CẤM phân công lại trực tiếp**.<br>**CẤM gọi lệnh `ReportFieldIssue` để sang `BLOCKED`**.<br>CẤM Quản lý sửa hộ bài của nhân viên. |
| **`COMPLETED`** | _(Không có lệnh ghi)_ | Không ai | **TRẠNG THÁI ĐÓNG BẤT BIẾN (Terminal Success)** | **CẤM 100% mọi hành vi sửa đổi dữ liệu hoặc mở lại (`DR-HARD-05`)**. |
| **`CANCELLED`** | _(Không có lệnh ghi)_ | Không ai | **TRẠNG THÁI ĐÓNG BẤT BIẾN (Terminal Void)** | **CẤM 100% mọi hành vi sửa đổi dữ liệu hoặc phục hồi (`DR-HARD-05`)**. |

---

## 4. Ma trận Phân quyền Tác nghiệp Thực địa (Operational Action Matrix)

| Mã Lệnh | Tên Hành động Nghiệp vụ | Tác nhân Hợp lệ | Tài nguyên Thao tác | Trạng thái Hợp lệ | Ràng buộc Thẩm quyền & Tiên quyết | Chuyển dịch Trạng thái |
|:---:|---|:---:|---|:---:|---|:---:|
| **CMD-OP-01** | `CreateTask` | Operations Manager | `Task` | *(Khởi tạo)* | Thuộc `AUTHORIZED_OPERATIONAL_SCOPE`; cây tồn tại; `TaskType` đang `ACTIVE`; hạn chót tương lai. | $\to$ `PENDING` |
| **CMD-OP-02** | `StartTask` | Field Staff | `Task` | `PENDING` | `task.assignedStaffId == actor.userId`. DUY NHẤT lệnh này được mở đầu việc. | $\to$ `IN_PROGRESS` |
| **CMD-OP-03** | `VerifyGps` | Field Staff | `SiteVerification` | `IN_PROGRESS` | `assignedStaffId == actor.userId`; khoảng cách $\le 10$m. Không đổi TaskStatus. | Giữ `IN_PROGRESS` |
| **CMD-OP-04** | `ReportLocationException` | Field Staff | `VerificationException`| `IN_PROGRESS` | Đã thử lại GPS; khoảng cách $> 10$m; có văn bản giải trình. | Giữ `IN_PROGRESS` |
| **CMD-OP-05** | `VerifyQr` | Field Staff | `SiteVerification` | `IN_PROGRESS` | Mã quét khớp 100% với cây được giao của Task. Không đổi TaskStatus. | Giữ `IN_PROGRESS` |
| **CMD-OP-06** | `ReportIdentityException` | Field Staff | `VerificationException`| `IN_PROGRESS` | Tem QR hỏng/mất; chụp ảnh tem tại gốc + đối chiếu cây được giao. | Giữ `IN_PROGRESS` |
| **CMD-OP-07** | `CaptureProofEvidence` | Field Staff | `TaskEvidence` | `IN_PROGRESS` | Thu thập ảnh/checklist theo đúng hợp đồng của `ProofProfile`. | Giữ `IN_PROGRESS` |
| **CMD-OP-08** | `ReportFieldIssue` | Field Staff | `FieldIssue` | `IN_PROGRESS` | Phát sinh chướng ngại vật thực địa; bắt buộc ảnh chụp + lý do cản trở. | $\to$ `BLOCKED` |
| **CMD-OP-09** | `SubmitEvidence` | Field Staff | `Task` | `IN_PROGRESS` | Đạt 100% bằng chứng theo Profile; máy chủ tiếp nhận thành công. | $\to$ `WAITING_REVIEW` |
| **CMD-OP-10** | `ReviewApprove` | Operations Manager | `Task` | `WAITING_REVIEW` | Thuộc scope; 100% đạt chuẩn; `actor.userId != task.assignedStaffId`. | $\to$ `COMPLETED` |
| **CMD-OP-11** | `ReviewApproveWithException` | Operations Manager | `Task` | `WAITING_REVIEW` | Thuộc scope; việc đã làm thật; bắt buộc có lý do bảo lãnh của Quản lý. | $\to$ `COMPLETED` *(HAS_EXCEPTION)* |
| **CMD-OP-12** | `ReviewRequestRework` | Operations Manager | `Task` | `WAITING_REVIEW` | Thuộc scope; bắt buộc chỉ rõ `targetedArea` và lý do từ chối. | $\to$ `REWORK_REQUIRED` |
| **CMD-OP-13** | `ResubmitRework` | Field Staff | `Task` | `REWORK_REQUIRED` | `assignedStaffId == actor.userId`; đã khắc phục đúng khâu chỉ định. | $\to$ `WAITING_REVIEW` |
| **CMD-OP-14** | `ResumeBlockedTask` | Operations Manager | `Task` | `BLOCKED` | Thuộc scope; trở ngại thực địa đã được tháo gỡ; cho nhân viên cũ tiếp tục. | $\to$ `IN_PROGRESS` |
| **CMD-OP-15** | `ReassignTask (Case A)` | Operations Manager | `Task` | `PENDING` | Thuộc scope; chọn nhân sự mới `ACTIVE` khác nhân sự hiện tại. | Giữ `PENDING` |
| **CMD-OP-16** | `ReassignTask (Case B)` | Operations Manager | `Task` | `BLOCKED` | Thuộc scope; chọn nhân sự mới `ACTIVE`; bảo toàn quyền tác giả cũ. | $\to$ `PENDING` |
| **CMD-OP-17** | `CancelTask` | Operations Manager | `Task` | Phi kết thúc | Thuộc scope; bắt buộc nhập lý do văn bản; cấm hủy task đã đóng. | $\to$ `CANCELLED` |

---

## 5. Ma trận Phân quyền Quản trị Nền tảng (Platform Governance Action Matrix)

19 lệnh quản trị nền tảng của Platform Administrator tương ứng với **9 năng lực quản trị MVP** (`CAP-ADM-01..09`):

| Mã Lệnh | Tên Lệnh Quản trị | Năng lực Tương ứng | Tài nguyên Thao tác | Điều kiện Tiên quyết & Quy tắc Quản trị | Yêu cầu Kiểm toán | Trạng thái MVP |
|:---:|---|:---:|---|---|:---:|:---:|
| **CMD-ADM-01** | `ProvisionUser` | `CAP-ADM-01` | `User`, `Account` | Admin `ACTIVE`; email/phone duy nhất; khởi tạo kích hoạt an toàn. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-02** | `AssignRole` | `CAP-ADM-02` | `RoleAssignment` | Admin `ACTIVE`; cấm tự đổi quyền (`ADM-SOD-01`); đối soát trách nhiệm dở dang. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-03** | `SuspendAccount` | `CAP-ADM-03` | `Account` | Admin `ACTIVE`; nhập lý do; tài khoản không còn khả năng xác thực. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-04** | `ActivateAccount` | `CAP-ADM-03` | `Account` | Admin `ACTIVE`; chỉ mở tài khoản đang `SUSPENDED` hoặc `INVITED`. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-05** | `DisableAccount` | `CAP-ADM-03` | `Account` | Admin `ACTIVE`; nhân viên nghỉ việc; thu hồi quyền vĩnh viễn, không xóa vật lý. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-06** | `UnlockAccount` | `CAP-ADM-04` | `Account` | Admin `ACTIVE`; mở khóa khi tài khoản bị khóa do nhập sai mật khẩu. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-07** | `ResetCredentialSetup` | `CAP-ADM-04` | `Account` | Admin `ACTIVE`; gửi cơ chế thiết lập lại mật khẩu an toàn cho người dùng. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-08** | `ViewAuditLog` | `CAP-ADM-05` | `AuditEvent` | Admin `ACTIVE`; truy vấn sổ nhật ký kiểm toán append-only chỉ-đọc. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-09** | `FilterAuditLog` | `CAP-ADM-05` | `AuditEvent` | Admin `ACTIVE`; lọc theo thời gian, actor, hành động hoặc resource. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-10** | `CreateTree` | `CAP-ADM-06` | `Tree` | `treeId` duy nhất; `qrCode` duy nhất; tọa độ GPS hợp lệ định dạng/dải đo. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-11** | `UpdateTreeMasterData` | `CAP-ADM-06` | `TreeMasterData` | Cập nhật chiều cao, tán lá, rủi ro; bắt buộc nhập lý do điều chỉnh. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-12** | `ReplaceTreeQrCode` | `CAP-ADM-06` | `Tree` | Nhận báo cáo tem hỏng; cấp chuỗi QR mới duy nhất; giữ nguyên `treeId`. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-13** | `UpdateCanonicalCoordinates` | `CAP-ADM-06` | `Tree` | Tọa độ mới hợp lệ dải trắc địa; bắt buộc có biên bản/lý do đo đạc lại. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-14** | `RetireTree` | `CAP-ADM-06` | `Tree` | Cây đã chết/đốn hạ $\to$ `RETIRED`; chặn tạo task mới về sau; không xóa vật lý. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-15** | `CreateTaskType` | `CAP-ADM-07` | `TaskTypeCatalog` | Nhập mã `taskTypeId`, tên, mô tả. Cần có ánh xạ ProofProfile trước khi giao việc. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-16** | `DeactivateTaskType` | `CAP-ADM-07` | `TaskTypeCatalog` | Chuyển sang `INACTIVE` để ẩn khỏi danh mục giao việc; cấm xóa cứng. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-17** | `ActivateTaskType` | `CAP-ADM-07` | `TaskTypeCatalog` | Mở lại loại việc phục vụ tạo task vận hành. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-18** | `PublishProofPolicyVersion` | `CAP-ADM-08` | `ProofPolicyMapping` | Ban hành phiên bản ánh xạ `TaskType -> ProofProfile`; không áp dụng hồi tố. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-19** | `PublishChecklistTemplateVersion` | `CAP-ADM-09` | `ChecklistTemplate` | Ban hành phiên bản mẫu checklist kỹ thuật; áp dụng cho các task tương lai. | `AUDIT_REQUIRED` | **MVP** |
| **CMD-ADM-20** | `ManageDynamicFindingsTemplate` | `CAP-ADM-10` | `FindingsSchema` | Thiết kế biểu mẫu khám bệnh động. | `AUDIT_REQUIRED` | **NEXT (Khóa tại MVP)** |
| **CMD-ADM-21** | `UseBreakGlass` | `CAP-ADM-11` | Khẩn cấp | Can thiệp vượt quyền trong phiên giới hạn thời gian khi có thiên tai. | `CRITICAL_AUDIT` | **NEXT (Khóa tại MVP)** |
| **CMD-ADM-22** | `ManagePlatformSystemConfig` | `CAP-ADM-13` | Hệ thống | Cấu hình tham số hạ tầng tùy tiện. | N/A | **REJECTED (Bác bỏ)** |

---

## 6. Các Hành Động Bị Cấm Tuyệt Đối (Strict Forbidden Boundaries)

Bảng tổng hợp các ranh giới cấm nghiêm ngặt bảo vệ tính liêm chính của toàn bộ hệ thống:

| Tác nhân | Hành vi Cấm Tuyệt Đối | Căn cứ Bất biến / Quy tắc | Cơ chế Chặn (Enforcement Mechanism) |
|---|---|---|---|
| **Field Staff** | Tự phê duyệt nghiệm thu nhiệm vụ của chính mình | `DR-HARD-02` | API từ chối nếu `reviewerId == assignedStaffId`; giao diện không có nút duyệt. |
| **Field Staff** | Tự ý chuyển việc sang cây xanh khác | `DR-HARD-01` | Cây mục tiêu bất biến; API chặn mọi lệnh cập nhật `treeId`. |
| **Field Staff** | Tự tạo việc hoặc tự phân công lại task | Phân tách vai trò | Chặn quyền tại tầng Use Case; chỉ Quản lý mới có quyền tạo/giao việc. |
| **Field Staff** | Báo sự cố khi đang ở `REWORK_REQUIRED` | `P4-SC-01` | Cấm gọi lệnh `ReportFieldIssue` tại trạng thái làm lại. |
| **Operations Manager** | Can thiệp vào tài khoản, mật khẩu hoặc gán vai trò IAM | Phân tách mặt bằng | Manager không có quyền trên các thực thể của `Identity & Access Management`. |
| **Operations Manager** | Tự ý hạ cấp `ProofProfile` của một nhiệm vụ đơn lẻ | `DR-MVP-02` | Profile được suy ra tất định từ `TaskType`; UI và API khóa trường này. |
| **Operations Manager** | Phân công lại trực tiếp khi task đang `IN_PROGRESS` | `DR-HARD-06` | Phải qua quy trình báo sự cố `ReportFieldIssue` $\to$ `BLOCKED` $\to$ `Reassign`. |
| **Operations Manager** | Sửa đổi nhiệm vụ đã ở trạng thái `COMPLETED` hoặc `CANCELLED` | `DR-HARD-05` | Trạng thái đóng là bất biến vĩnh viễn; chặn mọi lệnh Mutation. |
| **Platform Administrator** | Thực hiện bất kỳ thao tác vận hành Task thực địa thông thường | `P4-09` | **CẤM 100%**: Admin không có quyền tạo task, giao việc, duyệt việc hay hủy task vận hành. |
| **Platform Administrator** | Tự điều chỉnh vai trò của chính mình | `ADM-SOD-01` | API từ chối nếu `targetUserId == currentAdminId`; chống tự leo thang đặc quyền. |
| **Platform Administrator** | Chỉnh sửa hoặc xóa các bản ghi sự kiện kiểm toán | `ADM-SOD-03` | Kho kiểm toán là Append-Only; không tồn tại API Update/Delete log. |
| **Platform Administrator** | Sửa đổi mã định danh `treeId` | Quản trị dữ liệu gốc | `treeId` là bất biến duy nhất; cấm sửa đổi trong mọi hoàn cảnh. |
| **System** | Tự động phân công công việc thay Quản lý | Quyền hạn con người | Chỉ con người Quản lý mới được quyết định điều phối nhân lực. |
| **System** | Tự động phê duyệt nghiệm thu (`Auto-approval`) | `DR-POL-01` | 100% công việc phải do Quản lý con người thẩm định và chịu trách nhiệm. |
