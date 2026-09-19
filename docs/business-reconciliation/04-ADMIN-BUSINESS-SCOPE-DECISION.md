# NOVYX GreenOps — Platform Administrator Business Scope & Governance (Phase 2)

> **Tài liệu chuẩn mực phạm vi nghiệp vụ và quản trị của Quản trị hệ thống**
> Thuộc chu trình: **Business Baseline Reconciliation — Phase 2**.
> Căn cứ chuẩn tắc:
> - [`docs/business-reconciliation/02-ACTOR-MODEL-DECISION.md`](02-ACTOR-MODEL-DECISION.md) (Khóa ranh giới tác nhân)
> - [`docs/business-reconciliation/03-ROLE-NAMING-TAXONOMY.md`](03-ROLE-NAMING-TAXONOMY.md) (Khóa danh xưng 3 tầng)
> - [`docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md`](../NOVYX_Business_Baseline_Reconciliation_Master_Plan.md)
>
> **Ranh giới thực thi (Hard Scope Rule)**:
> - Phase 2 là **DECISION & SCOPE FREEZE PHASE**. Mọi năng lực nghiệp vụ của Quản trị hệ thống (Platform Administrator) phải được phân loại nhị phân dứt điểm.
> - **KHÔNG** triển khai mã nguồn, không sửa hợp đồng API, không tạo màn hình UI Admin.
> - **KHÔNG** sửa đổi tài liệu canonical (`PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `REQUIREMENTS-TRACEABILITY.md`) hay sơ đồ trực quan (`docs/diagrams/`) tại phase này (đồng bộ chính thức tại Phase 6/8).
>
> **Định danh Baseline khởi đầu**:
> - Branch: `base-setup`
> - Starting Commit HEAD: [`95d84d921b32b4c09cad1be5f64f618f21dc1cf6`](https://github.com/Peaker04/tree/commit/95d84d921b32b4c09cad1be5f64f618f21dc1cf6)
> - Starting Tree Hash: `ac608d879ac4f79b2d5680a79e8a913127f8c1f6`
> - Trạng thái: **PHASE 2 PASS — SEMANTICALLY CLOSED** (100% tiêu chuẩn P2-01..P2-13 và SC-01..SC-04 có bằng chứng nghiệm thu nhị phân, 0 TBD/MAYBE).

---

## 1. Đường Cơ Sở Của Quản Trị Hệ Thống (Platform Administrator Baseline)

Tuân thủ nghiêm ngặt các quyết định đã đóng băng tại Phase 1 và Mini-Phase Taxonomy:

- **Technical Role ID**: `admin` (Bất biến trong contracts/database/tokens).
- **Canonical Business Name**: `Platform Administrator` (Tên nghiệp vụ chuẩn tắc trong tài liệu kiến trúc DDD).
- **Vietnamese Display Label**: `Quản trị hệ thống` (Nhãn giao diện tiếng Việt chuẩn; rút gọn UI: *`Quản trị`*).
- **Actor Classification**: `Governance Human Actor` (Tác nhân con người thuộc Nhánh Quản trị).
- **Nguyên tắc bất biến (Core Invariant)**:
  $$\mathbf{Admin \neq Manager}$$
- **Ranh giới bất khả xâm phạm**:
  - Quản trị hệ thống **TUYỆT ĐỐI KHÔNG** tham gia vào chu trình nhiệm vụ vận hành hiện trường thông thường (Normal Task Operations).
  - Quản trị hệ thống **KHÔNG PHẢI** là cấp trên hay vai trò cha kế thừa quyền lực của Quản lý vận hành (Operations Manager).
  - Quản lý vận hành **KHÔNG PHẢI** là Admin cấp thấp và không sở hữu các quyền quản trị tài khoản, phân quyền hay can thiệp hệ thống.

---

## 2. Mô Hình Phân Loại Năng Lực Nghiệp Vụ (Capability Classification Model)

Mọi năng lực ứng viên của Quản trị hệ thống bắt buộc phải được xếp vào **chính xác 1 trong 4 trạng thái duy nhất**, nghiêm cấm trạng thái lơ lửng (`TBD`, `MAYBE`, `UNDECIDED`):

1. **`MVP` (Minimum Viable Product)**:
   - Năng lực bắt buộc phải có để hệ thống vận hành có quản trị ngay trong đợt phát hành nền tảng đầu tiên.
   - Thiếu năng lực này hệ thống sẽ rơi vào tình trạng lỗ hổng bảo mật, không có người cấp phát tài khoản hoặc vô chủ dữ liệu.
2. **`NEXT` (Next Major Release)**:
   - Năng lực đã được phê duyệt về mặt định hướng kiến trúc nghiệp vụ, nhưng chưa bắt buộc cho đợt triển khai ban đầu; sẽ được xem xét và hiện thực hóa ở phiên bản tiếp theo.
3. **`RESERVED` (Intentionally Held for Future Consideration)**:
   - Năng lực được chủ động bảo lưu cho tương lai xa; hiện tại không kích hoạt bất kỳ hành vi nghiệp vụ hay hợp đồng nào.
4. **`REJECTED` (Explicitly Excluded)**:
   - Năng lực bị bác bỏ dứt điểm vì vi phạm mô hình nghiệp vụ của NOVYX, vi phạm phân tách trách nhiệm (SoD) hoặc thuộc thẩm quyền của bộ phận kỹ thuật bên ngoài (DevOps/Hạ tầng).

---

## 3. Đánh Giá Chi Tiết 13 Năng Lực Quản Trị (Capability Evaluation CAP-ADM-01..13)

### 3.1. CAP-ADM-01: Cấp Phát & Khởi Tạo Người Dùng (User Provisioning)
- **Tên năng lực**: User Provisioning (Khởi tạo tài khoản người dùng).
- **Mục đích nghiệp vụ**: Cho phép Quản trị hệ thống tạo lập hoặc mời nhân sự mới tham gia hệ thống (Nhân viên hiện trường, Quản lý vận hành hoặc Quản trị hệ thống mới), đảm bảo danh tính được xác thực và gán vai trò ban đầu có kiểm soát.
- **Tài nguyên làm chủ**: Thực thể Người dùng (`UserEntity` / `UserProfile`).
- **Phạm vi đọc (Read Scope)**: Danh bạ người dùng toàn hệ thống, trạng thái hồ sơ, thông tin liên hệ công vụ.
- **Phạm vi ghi (Write Scope)**: Tạo bản ghi người dùng mới, gán định danh duy nhất (`userId`, email, phone, fullName).
- **Điều kiện tiên quyết (Preconditions)**: Email/Phone không được trùng lặp với tài khoản đã tồn tại trong hệ thống; Người thực hiện bắt buộc phải có vai trò `Platform Administrator`.
- **Ranh giới cấm (Forbidden Actions)**: CẤM tạo tài khoản ẩn danh; CẤM tự động kích hoạt tài khoản mà không có danh tính thực tế; Quản lý vận hành (Manager) CẤM gọi chức năng này.
- **Yêu cầu lưu vết kiểm toán (Audit Requirement)**: Bắt buộc ghi nhận Audit Event: `actorId` (Admin thực hiện), `targetUserId`, `initialRole`, `timestamp`, `ipAddress`.
- **Yêu cầu quản lý phiên bản (Versioning)**: `AUDIT-ONLY` (Lưu vết lịch sử tạo lập trong Audit Trail).
- **Ràng buộc Phân tách Trách nhiệm (SoD)**: Admin tạo tài khoản Staff không được kiêm quyền phân công task cho Staff đó ngoài hiện trường.
- **Trạng thái vòng đời**: `INVITED` $\rightarrow$ `ACTIVE` $\rightarrow$ `SUSPENDED` $\rightarrow$ `DISABLED`.
- **Phân loại trạng thái**: **`MVP`** (Bắt buộc).
- **Lý do (Rationale)**: Không thể vận hành ứng dụng nếu không có cơ chế cấp phát tài khoản có kiểm soát danh tính ban đầu.
- **Phương án bị từ chối**: Tự đăng ký tự do (Self-registration) bị từ chối vì NOVYX là nền tảng quản trị nội bộ đô thị khép kín.
- **Tác động hạ tầng/Hợp đồng**: Đòi hỏi API provisioning tại backend và bảo vệ bằng role guard `admin`.

---

### 3.2. CAP-ADM-02: Phân Quyền & Gán Vai Trò (Role Assignment)
- **Tên năng lực**: Role Assignment (Gán vai trò người dùng).
- **Mục đích nghiệp vụ**: Cấp phát, thay đổi vai trò công tác của người dùng giữa 3 vai trò hợp lệ: `staff`, `manager`, `admin`.
- **Tài nguyên làm chủ**: Thực thể Phân quyền người dùng (`UserRoleAssignment`).
- **Phạm vi đọc (Read Scope)**: Bảng phân quyền vai trò hiện tại và lịch sử thay đổi vai trò của toàn bộ người dùng.
- **Phạm vi ghi (Write Scope)**: Cập nhật trường `role` của người dùng.
- **Quy tắc Khởi tạo Nền tảng (Bootstrap Rule)**:
  1. *Thiết lập Admin đầu tiên*: Platform Administrator đầu tiên được xác lập thông qua quy trình khởi tạo có kiểm soát (controlled bootstrap) trong giai đoạn thiết lập môi trường/hệ thống ban đầu.
  2. *Bản chất của Bootstrap*: Bootstrap TUYỆT ĐỐI KHÔNG PHẢI là tự đăng ký (self-registration), không phải do Manager nâng lên, không phải do Staff tự phong, và không phải luồng sử dụng thông thường trong ứng dụng.
  3. *Lưu vết khởi tạo*: Quy trình bootstrap bắt buộc phải tạo bản ghi khởi tạo kiểm toán bất biến (auditable initialization record).
- **Quy tắc Gán vai trò Chuẩn tắc trong MVP (Normal MVP Role Assignment)**:
  1. Sau khi bootstrap, một Platform Administrator hiện hữu có toàn quyền gán một người dùng đang ở trạng thái `ACTIVE` vào bất kỳ vai trò nào: `staff`, `manager`, hoặc `admin`.
  2. Việc gán thêm Admin mới được thực hiện trực tiếp bởi Admin hiện hữu và bắt buộc lưu vết kiểm toán đầy đủ.
  3. Cơ chế phê duyệt kép (Dual-Admin / Four-Eyes Approval) KHÔNG phải là điều kiện bắt buộc chưa chốt của MVP, mà được phân loại rõ ràng là biện pháp tăng cường bảo mật tại giai đoạn **`NEXT SECURITY HARDENING`**.
  4. Tuyệt đối không tạo ra các vai trò con người mới chưa được duyệt như: `Owner`, `Super Admin`, hay `Security Approver`.
- **Điều kiện tiên quyết (Preconditions)**: Tài khoản mục tiêu phải tồn tại và đang ở trạng thái `ACTIVE`; Vai trò yêu cầu phải thuộc tập `{'staff', 'manager', 'admin'}`; Phải có lý do điều chuyển công tác bằng văn bản.
- **Ranh giới cấm (Forbidden Actions)**:
  - **CẤM TỰ THAY ĐỔI VAI TRÒ (ADM-SOD-01)**: Admin không được tự ý nâng hoặc thay đổi vai trò của chính mình thông qua lệnh `AssignRole` thông thường.
  - CẤM Quản lý vận hành (Manager) gán hoặc thay đổi vai trò của bất kỳ ai.
  - CẤM Tác nhân tự động hóa (System) tự ý gán hoặc nâng quyền vai trò cho người dùng.
  - CẤM ghi đè làm mất vết lịch sử vai trò cũ.
- **Yêu cầu lưu vết kiểm toán (Audit Requirement)**: Audit Event bắt buộc: `actorId`, `targetUserId`, `oldRole`, `newRole`, `timestamp`, `reason`.
- **Yêu cầu quản lý phiên bản (Versioning)**: `AUDIT-ONLY` (Mọi thay đổi vai trò đều tạo ra bản ghi lịch sử bất biến; tuyệt đối không cập nhật đè).
- **Ràng buộc Phân tách Trách nhiệm (SoD)**: Thay đổi vai trò của một người từ `staff` lên `manager` không làm thay đổi quyền tác giả của họ trong các báo cáo chăm sóc cây cũ khi họ còn là Staff.
- **Phân loại trạng thái**: **`MVP`** (Bắt buộc).
- **Lý do (Rationale)**: Cốt lõi của mô hình kiểm soát truy cập (Access Control); giải quyết dứt điểm khoảng trống vô chủ phân quyền với quy tắc khởi tạo tất định.

---

### 3.3. CAP-ADM-03: Kích Hoạt & Khóa Tài Khoản (Account Activation / Suspension)
- **Tên năng lực**: Account Lifecycle Governance (Quản trị vòng đời tài khoản).
- **Mục đích nghiệp vụ**: Kích hoạt, tạm khóa (khi phát hiện rủi ro bảo mật hoặc nhân viên nghỉ phép/vi phạm) hoặc vô hiệu hóa vĩnh viễn tài khoản người dùng khi thôi việc.
- **Tài nguyên làm chủ**: Trạng thái tài khoản người dùng (`AccountStatus`).
- **Phạm vi đọc (Read Scope)**: Trạng thái tài khoản toàn hệ thống.
- **Phạm vi ghi (Write Scope)**: Chuyển đổi trạng thái tài khoản: `ACTIVE` $\leftrightarrow$ `SUSPENDED` $\rightarrow$ `DISABLED`.
- **Điều kiện tiên quyết (Preconditions)**: Phải có lý do đình chỉ cụ thể; Tài khoản bị khóa lập tức bị thu hồi accessToken và refreshToken.
- **Ranh giới cấm (Forbidden Actions)**:
  - CẤM tài khoản đang bị `SUSPENDED` hoặc `DISABLED` đăng nhập hoặc gọi bất kỳ API nào.
  - CẤM tự động xóa bỏ hoặc hủy hoại các nhiệm vụ đang giao cho người bị khóa (việc điều chuyển task thuộc thẩm quyền Manager thông qua quy trình `Reassign`).
  - Manager CẤM tự ý khóa tài khoản người dùng (chỉ có quyền báo cáo sự vụ lên Admin).
- **Yêu cầu lưu vết kiểm toán (Audit Requirement)**: Bắt buộc lưu vết `actorId`, `targetUserId`, `previousStatus`, `newStatus`, `reason`, `timestamp`.
- **Yêu cầu quản lý phiên bản (Versioning)**: `AUDIT-ONLY`.
- **Ràng buộc Phân tách Trách nhiệm (SoD)**: Việc khóa tài khoản không làm xóa bỏ dữ liệu lịch sử tác vụ hay bằng chứng hiện trường do tài khoản đó từng thực hiện.
- **Phân loại trạng thái**: **`MVP`** (Bắt buộc).
- **Lý do (Rationale)**: Bảo vệ an ninh tức thời cho hệ thống khi có biến động nhân sự hoặc rò rỉ thiết bị di động.

---

### 3.4. CAP-ADM-04: Khôi Phục & Mở Khóa Tài Khoản (Account Recovery / Unlock)
- **Tên năng lực**: Account Recovery & Credential Management (Khôi phục quyền truy cập).
- **Mục đích nghiệp vụ**: Hỗ trợ mở khóa tài khoản bị khóa do nhập sai mật khẩu nhiều lần, kích hoạt luồng đặt lại mật khẩu an toàn theo yêu cầu chính chủ.
- **Tài nguyên làm chủ**: Trạng thái khóa tạm thời (`LoginLockout`) và token đặt lại mật khẩu.
- **Phạm vi đọc (Read Scope)**: Trạng thái khóa đăng nhập, lịch sử thử đăng nhập thất bại.
- **Phạm vi ghi (Write Scope)**: Xóa cờ khóa tạm thời, gửi liên kết/mã đặt lại mật khẩu một lần (One-Time Reset Link/OTP) đến kênh liên lạc chính chủ của người dùng.
- **Điều kiện tiên quyết (Preconditions)**: Đã xác minh danh tính người yêu cầu qua kênh ngoại tuyến hợp lệ.
- **Ranh giới cấm (Forbidden Actions)**:
  - **CẤM TUYỆT ĐỐI**: Admin KHÔNG BAO GIỜ được nhìn thấy mật khẩu dạng rõ (Plaintext Password) của người dùng.
  - CẤM Admin tự ý đặt mật khẩu cố định thay cho người dùng (phải để người dùng tự thiết lập qua luồng bảo mật).
- **Yêu cầu lưu vết kiểm toán (Audit Requirement)**: Lưu vết `actorId`, `targetUserId`, `action = 'UNLOCK_ACCOUNT' | 'TRIGGER_PASSWORD_RESET'`, `reason`, `timestamp`.
- **Yêu cầu quản lý phiên bản (Versioning)**: `AUDIT-ONLY`.
- **Ràng buộc Phân tách Trách nhiệm (SoD)**: Admin không thể đăng nhập trực tiếp vào tài khoản người dùng bằng chức năng khôi phục.
- **Phân loại trạng thái**: **`MVP`** (Bắt buộc).
- **Lý do (Rationale)**: Đảm bảo tính liên tục vận hành (Business Continuity) khi nhân sự hiện trường gặp sự cố đăng nhập ngoài thực địa.

---

### 3.5. CAP-ADM-05: Tra Cứu Nhật Ký Kiểm Toán (Audit Log Inspection)
- **Tên năng lực**: Audit Log Inspection (Tra cứu nhật ký kiểm toán hệ thống).
- **Mục đích nghiệp vụ**: Cung cấp khả năng đọc, lọc và tra cứu toàn diện các sự kiện nghiệp vụ và bảo mật (ai làm gì, vào thời điểm nào, trên tài nguyên nào, với lý do gì), phục vụ công tác thanh tra tuân thủ và điều tra sai phạm.
- **Tài nguyên làm chủ**: Sổ nhật ký kiểm toán (`AuditTrail` / `AuditLogEntries`).
- **Phạm vi đọc (Read Scope)**: Toàn bộ các bản ghi kiểm toán hệ thống. Hỗ trợ lọc theo: `actorId`, `role`, `resourceType`, `resourceId`, `actionType`, khoảng thời gian `fromTimestamp` $\rightarrow$ `toTimestamp`, mức độ nghiêm trọng `severity`.
- **Phạm vi ghi (Write Scope)**: **HOÀN TOÀN KHÔNG CÓ QUYỀN GHI / STRICTLY READ-ONLY**.
- **Điều kiện tiên quyết (Preconditions)**: Chỉ tài khoản có vai trò `Platform Administrator` mới được truy cập toàn diện sổ kiểm toán.
- **Ranh giới cấm (Forbidden Actions)**:
  - **CẤM TUYỆT ĐỐI (ADM-SOD-03)**: Admin CẤM chỉnh sửa, sửa đổi (modify), xóa bỏ (delete) hoặc chèn giả mạo bất kỳ bản ghi kiểm toán nào.
  - CẤM xóa sạch nhật ký log (No Log Purge). Sổ kiểm toán là bất biến (Append-Only / Immutable).
- **Yêu cầu lưu vết kiểm toán (Audit Requirement)**: Bản thân hành vi tra cứu hoặc xuất file kiểm toán của Admin cũng phải tự động sinh ra một bản ghi Audit Event: `action = 'AUDIT_LOG_VIEWED' | 'AUDIT_LOG_EXPORTED'`.
- **Yêu cầu quản lý phiên bản (Versioning)**: `AUDIT-ONLY` (Bản thân là kho lưu vết).
- **Ràng buộc Phân tách Trách nhiệm (SoD)**: Phân tách giữa người tạo ra sự kiện nghiệp vụ (Staff/Manager) và người kiểm tra sự kiện (Admin).
- **Phân loại trạng thái**:
  - Tra cứu, lọc, xem nhật ký kiểm toán: **`MVP`** (Bắt buộc).
  - Xuất báo cáo kiểm toán nâng cao (Export CSV/PDF có chữ ký số): **`NEXT`**.
- **Lý do (Rationale)**: Là điều kiện tiên quyết để đảm bảo tính minh bạch và độ tin cậy của toàn bộ dữ liệu GreenOps.

---

### 3.6. CAP-ADM-06: Quản Trị Danh Mục Cây Đô Thị (Tree Master Data Governance)
- **Tên năng lực**: Tree Master Data Governance (Quản trị danh mục cây chính).
- **Mục đích nghiệp vụ**: Tạo mới cây đô thị vào sổ bộ quản lý, cập nhật thông tin định danh (mã cây, loài cây, địa chỉ, vị trí tọa độ chuẩn, mã QR định danh), và ngưng theo dõi/thanh lý cây (Retire tree).
- **Tài nguyên làm chủ**: Hồ sơ cây đô thị chuẩn tắc (`TreeMasterRecord` / `TreeDto`).
- **Phạm vi đọc (Read Scope)**: Toàn bộ dữ liệu thuộc tính cây trong hệ thống.
- **Phạm vi ghi (Write Scope)**: Thêm mới cây, cập nhật thuộc tính định danh, cập nhật mã QR, cập nhật tọa độ gốc, chuyển trạng thái theo dõi cây (`ACTIVE` $\rightarrow$ `RETIRED`).
- **Điều kiện tiên quyết (Preconditions)**: Mã cây (`treeId`) và mã QR (`qrCode`) phải là duy nhất trên toàn hệ thống; Thay đổi tọa độ hoặc mã QR bắt buộc phải có lý do kỹ thuật bằng văn bản và phê duyệt từ phòng ban chuyên trách đô thị.
- **Ranh giới cấm (Forbidden Actions)**:
  - CẤM Nhân viên hiện trường (Staff) tự ý sửa đổi tọa độ gốc, tên loài hoặc mã QR của cây.
  - CẤM Quản trị viên thay đổi mã định danh cây đang có nhiệm vụ dở dang (`IN_PROGRESS` / `WAITING_REVIEW`) làm đứt gãy tính toàn vẹn của chuỗi bằng chứng.
  - CẤM xóa vật lý (Hard Delete) cây đã từng có lịch sử chăm sóc (`CareHistory`). Cây không còn quản lý chỉ được chuyển sang trạng thái `RETIRED`.
- **Yêu cầu lưu vết kiểm toán (Audit Requirement)**: Bắt buộc lưu vết: `actorId`, `treeId`, `changedField`, `oldValue`, `newValue`, `reason`, `timestamp`.
- **Yêu cầu quản lý phiên bản (Versioning)**: `AUDIT-ONLY` cho thuộc tính cây; Các nhiệm vụ đã đóng bảo toàn tọa độ và ảnh hiện trạng tại thời điểm thực thi.
- **Ràng buộc Phân tách Trách nhiệm (SoD)**:
  - Phân định rõ: **Thay đổi Master Data** (Admin sở hữu) $\neq$ **Chăm sóc & Đánh giá sức khỏe cây ngoài thực địa** (Staff/Manager sở hữu).
  - Admin cập nhật danh mục cây không tự ý can thiệp vào các báo cáo sức khỏe định kỳ do Staff khảo sát.
- **Phân loại trạng thái**:
  - Tạo mới cây, sửa thông tin định danh, chuyển trạng thái `RETIRED` có kiểm toán: **`MVP`**.
  - Hợp nhất cây trùng lặp (Merge Duplicates) và đối soát bản đồ GIS tự động: **`NEXT`**.
- **Lý do (Rationale)**: Dữ liệu cây xanh là tài sản cốt lõi; nếu không có sự quản trị chặt chẽ từ Admin, danh mục cây sẽ bị trùng lặp hoặc sai lệch tọa độ.

---

### 3.7. CAP-ADM-07: Quản Trị Danh Mục Loại Công Việc (TaskType Catalog Governance)
- **Tên năng lực**: TaskType Catalog Governance (Quản trị danh mục loại công việc).
- **Mục đích nghiệp vụ**: Chuẩn hóa danh mục các loại hình công tác chăm sóc cây trong đô thị (hiện hành gồm 6 loại: *Tưới nước, Cắt tỉa cành, Bón phân, Phun thuốc, Kiểm tra sâu bệnh, Trồng mới*), kích hoạt hoặc ngưng áp dụng loại việc.
- **Tài nguyên làm chủ**: Danh mục Loại công việc (`TaskTypeCatalog`).
- **Phạm vi đọc (Read Scope)**: Toàn bộ danh mục TaskType.
- **Phạm vi ghi (Write Scope)**: Thêm mới loại công việc, kích hoạt/ngưng kích hoạt (`ACTIVE` / `INACTIVE`) loại công việc.
- **Điều kiện tiên quyết (Preconditions)**: Mỗi loại công việc mới bắt buộc phải được định danh bằng mã ổn định (`TaskTypeId`) và được gắn kèm một hồ sơ bằng chứng chuẩn (`ProofProfile`) trước khi kích hoạt.
- **Ranh giới cấm (Forbidden Actions)**:
  - CẤM Quản lý vận hành (Manager) tự ý gõ tay hoặc tạo ra các TaskType tùy tiện ngoài danh mục đã duyệt.
  - CẤM xóa bỏ vật lý (Hard Delete) một TaskType nếu đã có nhiệm vụ trong quá khứ tham chiếu đến nó (chỉ được chuyển sang trạng thái `INACTIVE` để không cho chọn mới).
  - CẤM sửa đổi trực tiếp ý nghĩa nghiệp vụ của một TaskType đã dùng trong lịch sử (khi cần thay thế ngữ nghĩa, bắt buộc phải tạo một TaskType mới thay vì sửa đè lên TaskType cũ).
- **Yêu cầu lưu vết kiểm toán (Audit Requirement)**: Lưu vết `actorId`, `taskTypeId`, `action`, `proofProfileMapping`, `timestamp`, `reason`.
- **Yêu cầu quản lý phiên bản (Versioning)**: **`AUDIT-ONLY`** (Toàn bộ thao tác thêm mới và bật/tắt trạng thái `ACTIVE`/`INACTIVE` đều được lưu vết kiểm toán bất biến; các tham chiếu nhiệm vụ lịch sử luôn được giải quyết toàn vẹn thông qua mã định danh ổn định).
  - *Lưu ý phân tách rạch ròi*: Quy tắc ánh xạ `TaskType → ProofProfile Mapping` là tài nguyên độc lập thuộc CAP-ADM-08 và được quản lý theo cơ chế **`VERSIONED`**.
- **Ràng buộc Phân tách Trách nhiệm (SoD)**: Admin thiết lập danh mục loại việc; Manager chỉ được quyền lựa chọn trong danh mục đang `ACTIVE` để giao việc.
- **Phân loại trạng thái**: **`MVP`** (Bắt buộc).
- **Lý do (Rationale)**: Bảo đảm tính đồng nhất của hệ thống quản lý chất lượng; ngăn chặn tình trạng tạo công việc tùy tiện làm sai lệch báo cáo tổng hợp.

---

### 3.8. CAP-ADM-08: Quản Trị Chính Sách Bằng Chứng (ProofProfile Policy Governance)
- **Tên năng lực**: ProofProfile Policy Governance (Quản trị chính sách bằng chứng bắt buộc).
- **Mục đích nghiệp vụ**: Xác lập và bảo vệ quy tắc ánh xạ chuẩn tắc giữa loại công việc và hồ sơ bằng chứng:
  $$\text{TaskType} \longrightarrow \text{ProofProfile} \in \{\text{CHANGE\_PROOF}, \text{SERVICE\_PROOF}, \text{INSPECTION\_PROOF}\}$$
- **Tài nguyên làm chủ**: Bảng quy tắc chính sách bằng chứng (`ProofProfilePolicyMapping`).
- **Phạm vi đọc (Read Scope)**: Bảng quy tắc chính sách toàn hệ thống.
- **Phạm vi ghi (Write Scope)**: Cập nhật quy tắc ánh xạ cho các nhiệm vụ tạo mới trong tương lai.
- **Điều kiện tiên quyết (Preconditions)**: Phải có phiên bản chính sách rõ ràng (`PolicyVersion`); Platform Administrator sở hữu thẩm quyền ban hành phiên bản chính sách mới; Mọi thay đổi chính sách bắt buộc phải có lý do kỹ thuật rõ ràng (`reason`) và lưu vết kiểm toán đầy đủ. (Nếu tổ chức có quy trình thẩm định nội bộ bên ngoài, đó là tiền đề quản trị tổ chức nằm ngoài mô hình tác nhân phần mềm, không tạo thêm tác nhân mới trong hệ thống).
- **Ranh giới cấm (Forbidden Actions)**:
  - **CẤM TUYỆT ĐỐI (DR-MVP-02)**: Quản lý vận hành (Manager) CẤM tùy tiện hạ cấp `ProofProfile` của một nhiệm vụ đơn lẻ để châm chước cho nhân viên.
  - CẤM áp dụng hồi tố (No Retroactive Mutation): Thay đổi chính sách bằng chứng không được làm thay đổi yêu cầu bằng chứng của các nhiệm vụ đã tạo hoặc đã hoàn thành trong quá khứ.
- **Yêu cầu lưu vết kiểm toán (Audit Requirement)**: Lưu vết `actorId`, `policyVersion`, `taskType`, `assignedProofProfile`, `reason`, `timestamp`.
- **Yêu cầu quản lý phiên bản (Versioning)**: **`VERSIONED`** (Bắt buộc đánh số phiên bản chính sách; mỗi Task khi khởi tạo sẽ lưu giữ cố định `policyVersionId` tại thời điểm tạo).
- **Ràng buộc Phân tách Trách nhiệm (SoD)**: Admin thiết lập chính sách bảo mật bằng chứng; Manager và Staff bắt buộc phải tuân thủ 100%, không có quyền thỏa hiệp.
- **Phân loại trạng thái**: **`MVP`** (Bắt buộc).
- **Lý do (Rationale)**: Là xương sống bảo vệ giá trị pháp lý và tính toàn vẹn của dữ liệu nghiệm thu ngoài thực địa.

---

### 3.9. CAP-ADM-09: Quản Trị Mẫu Danh Mục Kiểm Tra (Checklist Template Governance)
- **Tên năng lực**: Checklist Template Governance (Quản trị mẫu kiểm tra hiện trường).
- **Mục đích nghiệp vụ**: Quản lý nội dung các câu hỏi/hạng mục kiểm tra tiêu chuẩn gắn liền với từng loại công việc chăm sóc cây (ví dụ: kiểm tra độ ẩm đất, kiểm tra vết cắt tỉa, kiểm tra độ nghiêng thân cây).
- **Tài nguyên làm chủ**: Mẫu danh mục kiểm tra (`ChecklistTemplate`).
- **Phạm vi đọc (Read Scope)**: Danh mục các mẫu checklist và các phiên bản lịch sử.
- **Phạm vi ghi (Write Scope)**: Tạo mẫu mới, chỉnh sửa nội dung tiêu chí, kích hoạt/ngưng kích hoạt mẫu.
- **Điều kiện tiên quyết (Preconditions)**: Mọi chỉnh sửa nội dung checklist bắt buộc phải sinh ra một phiên bản mới (`TemplateVersion`); Không được sửa đè trực tiếp lên phiên bản đang được tham chiếu bởi các task đang chạy.
- **Ranh giới cấm (Forbidden Actions)**: CẤM làm thay đổi nội dung checklist của các nhiệm vụ đang ở trạng thái `IN_PROGRESS` hoặc `WAITING_REVIEW`.
- **Yêu cầu lưu vết kiểm toán (Audit Requirement)**: Lưu vết `actorId`, `templateId`, `templateVersion`, `itemsCount`, `timestamp`.
- **Yêu cầu quản lý phiên bản (Versioning)**: **`VERSIONED`** (Mỗi Task khi chuyển sang `IN_PROGRESS` sẽ chốt cứng bản snapshot của checklist template tương ứng).
- **Ràng buộc Phân tách Trách nhiệm (SoD)**: Admin ban hành tiêu chuẩn kiểm tra chất lượng; Staff thực thi tích chọn trung thực ngoài hiện trường.
- **Phân loại trạng thái**: **`MVP`** (Bắt buộc).
- **Lý do (Rationale)**: Đảm bảo tính nhất quán của quy trình chăm sóc kỹ thuật trên toàn bộ các tuyến đường đô thị.

---

### 3.10. CAP-ADM-10: Quản Trị Mẫu Ghi Nhận Bệnh Trạng (Findings Template Governance)
- **Tên năng lực**: Findings Template Governance (Quản trị mẫu ghi nhận sâu bệnh & rủi ro động).
- **Mục đích nghiệp vụ**: Cung cấp công cụ cho Quản trị hệ thống (Platform Administrator) tự tạo lập, chỉnh sửa, phân bản phiên bản (`versioning`) và bật/tắt các biểu mẫu thu thập dữ liệu rủi ro/sâu bệnh tùy biến động (Dynamic Findings Template Builder) cho hồ sơ kiểm định (`INSPECTION_PROOF`).
- **Tài nguyên làm chủ**: Biểu mẫu ghi nhận chuyên sâu tùy biến (`DynamicFindingsTemplateSchema`).
- **Phân loại trạng thái**: **`NEXT`** (Dành cho phiên bản tiếp theo).
- **Lý do & Bảo toàn Ngữ nghĩa Bắt buộc (Mandatory Semantic Distinction - SC-01)**:
  1. *Ngữ nghĩa bất biến của INSPECTION_PROOF*: Theo tài liệu chuẩn tắc [`docs/DOMAIN.md`](../DOMAIN.md) và [`docs/WORKFLOWS.md`](../WORKFLOWS.md), hồ sơ kiểm định bắt buộc gồm 3 thành phần không thể tách rời:
     $$\text{INSPECTION\_PROOF} = \text{Site Verification} + \text{Structured Findings} + \text{Condition Photo(s)}$$
  2. *Phân biệt giữa Thu thập dữ liệu và Quản trị mẫu động*:
     - **Thành phần A: Structured Findings (Ghi nhận bệnh trạng có cấu trúc)**: Là yêu cầu **BẮT BUỘC trong MVP** đối với mọi nhiệm vụ áp dụng `INSPECTION_PROOF`. Trong MVP, hệ thống áp dụng một lược đồ bệnh trạng chuẩn tắc cố định (Fixed Canonical Structured Findings Schema).
     - **Thành phần B: Findings Template Governance (Quản trị mẫu động)**: Là khả năng cho phép Admin tự ý kéo thả, tạo mới hoặc cấu hình biểu mẫu bệnh trạng tùy biến. Chỉ có Thành phần B này được xếp vào **`NEXT`**.
  3. *Nguyên tắc cấm thay thế suy diễn (Non-Substitution Invariants)*:
     - `ReportFieldIssue` (Báo cáo sự cố ách tắc) **KHÔNG PHẢI** là sự thay thế cho Structured Findings.
     - `TreeRiskStatus` (Trạng thái rủi ro tổng quan) **KHÔNG PHẢI** là sự thay thế cho Structured Findings.
     - `Condition Photos` (Ảnh chụp hiện trạng) **KHÔNG PHẢI** là sự thay thế cho Structured Findings.
     - Việc `Findings Template Governance` ở trạng thái `NEXT` tuyệt đối **KHÔNG ĐƯỢC SUY DIỄN** rằng Structured Findings là tùy chọn trong MVP.
  4. Lược đồ cố định của MVP không cho phép Admin chỉnh sửa động qua giao diện; tính năng quản trị biểu mẫu tùy biến sẽ được phát triển tại giai đoạn `NEXT`.

---

### 3.11. CAP-ADM-11: Quyền Can Thiệp Ngoại Lệ Khẩn Cấp (Break-Glass Access)
- **Tên năng lực**: Break-Glass Authorization (Mở khóa ngoại lệ có kiểm toán).
- **Mục đích nghiệp vụ**: Cơ chế kiểm soát cho phép Quản trị hệ thống can thiệp xử lý các tình huống ách tắc hệ thống bất khả kháng (ví dụ: toàn bộ quản lý khu vực bị mất thiết bị, thiên tai bão lũ đòi hỏi đóng hàng loạt task khẩn cấp mà không thể duyệt tuần tự).
- **Tài nguyên làm chủ**: Phiên can thiệp khẩn cấp (`BreakGlassSession`).
- **Phân loại trạng thái**: **`NEXT`** (Dành cho phiên bản tiếp theo).
- **Lý do (Rationale)**:
  1. *Rủi ro an ninh cực cao*: Break-glass nếu triển khai sơ sài sẽ biến Admin thành "Superuser" vi phạm toàn bộ các nguyên tắc phân tách trách nhiệm.
  2. *Đòi hỏi cơ chế phê duyệt phức tạp*: Một luồng Break-glass đạt chuẩn bắt buộc phải có xác thực đa yếu tố (MFA), chữ ký kép (Dual Authorization), giới hạn thời gian tự hủy (Time-boxed Session $\le 30$ phút) và tự động kích hoạt cảnh báo an ninh cấp cao.
  3. *MVP chưa cần thiết*: Trong phạm vi MVP, mọi trường hợp ách tắc hiện trường đều đã có 3 lối thoát hợp lệ của Manager xử lý (`Resume`, `Reassign`, `CancelTask` với lý do bắt buộc). Do đó, bảo lưu Break-glass sang giai đoạn Technical Architecture (Phase 11) và phát triển tại `NEXT`.

---

### 3.12. CAP-ADM-12: Thông Báo Quản Trị & An Ninh (Security & Governance Notifications)
- **Tên năng lực**: Security & Governance Event Notifications (Thông báo biến động quản trị).
- **Mục đích nghiệp vụ**: Gửi cảnh báo tức thời cho Quản trị viên khi có các sự kiện an ninh nhạy cảm (ví dụ: tài khoản bị khóa do đăng nhập sai, có quyền Admin mới được tạo, có thay đổi chính sách bằng chứng).
- **Phân loại trạng thái**: **`NEXT`** (Dành cho phiên bản tiếp theo).
- **Lý do (Rationale)**: Trong MVP, mọi sự kiện trên đều đã được ghi nhận 100% vào sổ nhật ký kiểm toán bất biến (Audit Trail). Việc xây dựng hệ thống push notification đa kênh dành riêng cho Admin có thể thực hiện sau khi giao diện Web Console của Admin được phê duyệt thiết kế.

---

### 3.13. CAP-ADM-13: Cấu Hình Tham Số Nền Tảng (System Configuration)
- **Tên năng lực**: Platform System Configuration (Cấu hình hệ thống).
- **Đánh giá bản chất**: Thuật ngữ "Cấu hình hệ thống" chung chung thường bị lạm dụng để nhồi nhét các cài đặt hạ tầng mạng, chuỗi kết nối cơ sở dữ liệu (Database Connection Strings), cấu hình máy chủ Redis, Secret keys, API keys của bên thứ ba.
- **Phân loại trạng thái**: **`REJECTED`** (Bác bỏ hoàn toàn khỏi mô hình nghiệp vụ sản phẩm).
- **Lý do (Rationale)**:
  - Toàn bộ các tham số nghiệp vụ thực sự (loại cây, loại việc, chính sách bằng chứng, mẫu checklist) đã được quản trị minh bạch qua các capability chuyên biệt từ `CAP-ADM-06` đến `CAP-ADM-09`.
  - Các cấu hình hạ tầng, máy chủ và biến môi trường thuộc quyền sở hữu độc quyền của đội ngũ Kỹ sư Hạ tầng / DevOps thông qua repository quản lý hạ tầng riêng và quy trình CI/CD bảo mật; **tuyệt đối không đưa vào màn hình ứng dụng của Quản trị viên nghiệp vụ**.

---

## 4. Ma Trận Sở Hữu Tài Nguyên Chuẩn Tắc (Authoritative Resource Ownership Matrix)

Bảng phân định quyền sở hữu và thẩm quyền thao tác đối với từng nhóm tài nguyên dữ liệu của hệ thống:

| Nhóm Tài nguyên (Resource Family) | Staff | Operations Manager | Platform Administrator | System | Chủ sở hữu tối hậu (Ultimate Owner) | Thẩm quyền Ghi (Write) | Yêu cầu Lưu vết Kiểm toán (Audit)? |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1. Tài khoản Người dùng (User)** | READ (Self) | READ (Team) | **OWNER** | TECHNICAL | **Platform Administrator** | Admin | **BẮT BUỘC** |
| **2. Phân quyền Vai trò (Role Assignment)** | FORBIDDEN | FORBIDDEN | **OWNER** | FORBIDDEN | **Platform Administrator** | Admin | **BẮT BUỘC** |
| **3. Trạng thái Tài khoản (Account Status)** | READ (Self) | READ (Team) | **OWNER** | TECHNICAL | **Platform Administrator** | Admin | **BẮT BUỘC** |
| **4. Danh mục Cây Đô thị (Tree Master Data)** | READ | READ | **OWNER** | TECHNICAL | **Platform Administrator** | Admin | **BẮT BUỘC** |
| **5. Nhiệm vụ Vận hành (Task Entity)** | READ (Own) | **OWNER** | FORBIDDEN | TECHNICAL | **Operations Manager** | Manager / Staff | **BẮT BUỘC** |
| **6. Phân công Công việc (Task Assignment)** | READ (Own) | **OWNER** | FORBIDDEN | TECHNICAL | **Operations Manager** | Manager | **BẮT BUỘC** |
| **7. Phán quyết Thẩm định (Review Decision)** | FORBIDDEN | **OWNER** | FORBIDDEN | FORBIDDEN | **Operations Manager** | Manager | **BẮT BUỘC** |
| **8. Bằng chứng Thực địa (Field Evidence)** | **OWNER** | READ | FORBIDDEN | TECHNICAL | **Field Staff** | Staff | **BẮT BUỘC** |
| **9. Chính sách Bằng chứng (Proof Policy)** | READ | READ | **OWNER** | TECHNICAL | **Platform Administrator** | Admin | **BẮT BUỘC** |
| **10. Danh mục Loại việc (TaskType Catalog)** | READ | READ | **OWNER** | N/A | **Platform Administrator** | Admin | **BẮT BUỘC** |
| **11. Mẫu Checklist (Checklist Template)** | READ | READ | **OWNER** | N/A | **Platform Administrator** | Admin | **BẮT BUỘC** |
| **12. Nhật ký Kiểm toán (Audit Event Log)** | FORBIDDEN | READ (Limited) | **OWNER** | **WRITE (Append)** | **Platform Administrator** | System (Append-only) | **TỰ THÂN LÀ LOG** |
| **13. Hàng đợi Đồng bộ (Sync & Outbox Queue)** | N/A | N/A | N/A | **OWNER** | **System** | System | Kỹ thuật |

---

## 5. Ma Trận Từ Chối Tác Vụ Thường Nhật Đối Với Admin (Admin Normal-Task Deny Matrix)

Tái khẳng định bằng chứng nhị phân: Quản trị hệ thống (Platform Administrator) bị **DENY 100%** trên toàn bộ các hành động thuộc chu trình vận hành nhiệm vụ thông thường:

| Hành động vận hành thường nhật | Thẩm quyền của Platform Administrator | Cơ chế kiểm soát an ninh & Lý do từ chối |
|---|:---:|---|
| `CreateTask` (Khởi tạo nhiệm vụ) | **DENY** | Thuộc thẩm quyền độc quyền của Quản lý vận hành (Manager) theo kế hoạch chăm sóc cây. |
| `AssignTask` (Phân công nhiệm vụ) | **DENY** | Manager trực tiếp quản lý khối lượng công việc và phân bổ nhân sự thực tế. |
| `Reassign` (Tái phân công) | **DENY** | Quyết định điều phối linh hoạt của Manager khi xử lý ách tắc hiện trường. |
| `StartTask` (Bắt đầu nhiệm vụ) | **DENY** | Chỉ có Nhân viên hiện trường (Staff) nhận việc mới có quyền bấm kích hoạt. |
| `VerifySite` (Quét QR & Đo GPS) | **DENY** | Đòi hỏi sự hiện diện vật lý tại tọa độ cây ngoài thực địa của Staff. |
| `CollectEvidence` (Chụp ảnh & Checklist) | **DENY** | Nhân viên hiện trường trực tiếp thực hiện công tác chăm sóc và ghi nhận chứng cứ. |
| `ReportFieldIssue` (Báo sự cố BLOCKED) | **DENY** | Xuất phát từ trở ngại khách quan ngoài hiện trường của Staff. |
| `SubmitEvidence` (Nộp hồ sơ nghiệm thu) | **DENY** | Trách nhiệm cam kết hồ sơ hoàn thành của chính Staff thực hiện. |
| `Review` (Thẩm định hồ sơ) | **DENY** | Chuyên môn kỹ thuật lâm nghiệp đô thị do Manager đảm trách. |
| `Approve` (Phê duyệt đạt chuẩn) | **DENY** | Nghiệm thu chất lượng vận hành do Manager chịu trách nhiệm trước tổ chức. |
| `ApproveWithException` (Duyệt ngoại lệ) | **DENY** | Đòi hỏi Manager đánh giá rủi ro và chịu trách nhiệm về lý do ngoại lệ. |
| `RequestRework` (Yêu cầu làm lại) | **DENY** | Chỉ đạo kỹ thuật khắc phục sai sót do Manager ban hành cho Staff. |
| `CancelTask` (Hủy nhiệm vụ vận hành) | **DENY** | Quyết định đóng việc của Manager kèm lý do vận hành bắt buộc (DR-POL-04). |

---

## 6. Mở Rộng Các Quy Tắc Phân Tách Trách Nhiệm (Admin SoD Rules ADM-SOD-01..07)

Dự án thiết lập 7 quy tắc Phân tách Trách nhiệm (Separation of Duties) cụ thể cho vai trò Quản trị hệ thống:

- **ADM-SOD-01 (Cấm tự thay đổi vai trò - No Self-Role Mutation)**: Admin tuyệt đối không được tự ý nâng hoặc thay đổi vai trò của chính mình thông qua lệnh `AssignRole` thông thường. Việc phân quyền cho Admin khác được thực hiện trực tiếp bởi một Platform Administrator hiện hữu (với kiểm toán lưu vết bắt buộc); cơ chế phê duyệt kép (Dual-Admin Approval) được định vị là biện pháp tăng cường bảo mật tại giai đoạn **`NEXT SECURITY HARDENING`**.
- **ADM-SOD-02 (Cấm ghi đè tác giả lịch sử - No Authorship Rewriting)**: Thao tác thay đổi vai trò hoặc khóa tài khoản của Admin tuyệt đối không được làm thay đổi hoặc xóa bỏ tên người thực hiện ban đầu trong các bản ghi lịch sử chăm sóc cây (`CareHistory`) và hồ sơ bằng chứng đã nộp.
- **ADM-SOD-03 (Bảo toàn bất biến nhật ký kiểm toán - Immutable Audit Log)**: Admin hoàn toàn không có quyền sửa đổi (edit), xóa bỏ (delete) hoặc chèn dữ liệu giả mạo vào sổ nhật ký kiểm toán (`AuditTrail`). Mọi hành vi xâm phạm tính toàn vẹn của log đều bị hệ thống chặn đứng.
- **ADM-SOD-04 (Quyền quản trị không suy diễn quyền tác vụ - Governance Does Not Imply Operations)**: Thẩm quyền quản trị nền tảng của Admin tuyệt đối không bao hàm quyền can thiệp, sửa đổi hay duyệt các nhiệm vụ vận hành thực địa của Manager.
- **ADM-SOD-05 (Quyền vận hành không suy diễn quyền quản trị - Operations Does Not Imply Governance)**: Quyền chỉ đạo hiện trường của Manager tuyệt đối không bao hàm quyền tạo tài khoản, đổi role, can thiệp danh mục cây hay thay đổi chính sách bằng chứng của Admin.
- **ADM-SOD-06 (Hệ thống tự động không tự phong quyền - No Automated Privilege Self-Granting)**: Tác nhân tự động hóa (`System`) tuyệt đối không được tự động cấp quyền Admin cho bất kỳ người dùng nào hoặc tự ý nới lỏng các quy tắc an ninh.
- **ADM-SOD-07 (Can thiệp ngoại lệ không thành quyền thường nhật - Break-Glass Never Permanent)**: Mọi quyền can thiệp đặc biệt trong tình huống khẩn cấp (Break-glass) chỉ có hiệu lực tức thời theo phiên giới hạn, bắt buộc phải có lý do giải trình và không bao giờ trở thành quyền hạn mặc định lâu dài.

---

## 7. Bảng Quyết Định Quản Lý Phiên Bản Nghiệp Vụ (Versioning Decision Table)

| Tài nguyên nghiệp vụ | Chế độ quản trị phiên bản | Cơ chế thực thi kỹ thuật | Lý do nghiệp vụ bắt buộc |
|---|:---:|---|---|
| **TaskType Catalog** | **`AUDIT-ONLY`** | Thêm mới có ngày hiệu lực; Ngưng áp dụng bằng cờ `is_active = false`. Cấm xóa vật lý. | Đảm bảo các nhiệm vụ cũ trong lịch sử vẫn hiển thị đúng tên loại việc ban đầu. |
| **ProofProfile Policy Mapping** | **`VERSIONED`** | Đánh số phiên bản chính sách (`PolicyVersion: v1, v2...`). Task lưu cố định `policyVersionId` khi tạo. | Ngăn chặn việc thay đổi chính sách làm thay đổi hồi tố yêu cầu bằng chứng của các task đã tạo trước đó. |
| **Checklist Template** | **`VERSIONED`** | Đánh số phiên bản mẫu (`TemplateVersion: 1, 2...`). Task lưu bản snapshot của checklist khi kích hoạt. | Nhân viên làm theo đúng biểu mẫu tại thời điểm nhận việc; không bị đổi câu hỏi khi đang làm dở ngoài hiện trường. |
| **Findings Template** | **`VERSIONED`** | Quản lý đa phiên bản cấu trúc thu thập bệnh trạng (`SchemaVersion`). | Bảo toàn tính tương thích của dữ liệu bệnh trạng cây qua nhiều năm theo dõi. |
| **Role Assignments** | **`AUDIT-ONLY`** | Tạo dòng lịch sử mới mỗi lần đổi vai trò (gồm `actor`, `target`, `oldRole`, `newRole`, `timestamp`, `reason`). | Tra cứu chính xác tại một thời điểm trong quá khứ người đó giữ chức danh gì. |
| **Tree Master Data** | **`AUDIT-ONLY`** | Lưu vết thay đổi thuộc tính (`changedField`, `oldVal`, `newVal`, `actor`, `timestamp`, `reason`). | Không sửa đè lịch sử; các nhiệm vụ đã hoàn thành bảo lưu tọa độ GPS đo thực tế tại thời điểm thi công. |

---

## 8. Nguyên Tắc Bảo Toàn Dữ Liệu Lịch Sử (Historical Preservation Principles)

Thiết lập nguyên tắc bất biến bảo vệ dữ liệu lịch sử trước mọi thao tác quản trị của Admin:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HISTORICAL PRESERVATION INVARIANTS                      │
└─────────────────────────────────────────────────────────────────────────────┘
  1. Cập nhật Master Data KHÔNG ghi đè tọa độ thực địa đã đo trong quá khứ.
  2. Khóa hoặc xóa nhân sự KHÔNG làm mất danh tính tác giả trong CareHistory.
  3. Cập nhật chính sách ProofProfile KHÔNG hồi tố lên nhiệm vụ đã tạo/đóng.
  4. Sửa Checklist Template KHÔNG thay đổi danh mục kiểm tra của task đang chạy.
  5. Đóng nhiệm vụ (COMPLETED / CANCELLED) là BẤT BIẾN, cấm mọi sửa đổi sau đó.
```

1. **Bảo toàn Hồ sơ Lịch sử Chăm sóc Cây (`CareHistory`)**:
   - `CareHistory` là hồ sơ pháp lý chứng minh cây xanh đã được chăm sóc đạt chuẩn.
   - Khi một Nhân viên hiện trường nghỉ việc hoặc chuyển sang làm Quản lý, toàn bộ các bản ghi `CareHistory` do người đó ký duyệt trong quá khứ **PHẢI GIỮ NGUYÊN VẸN** tên và định danh của họ.
2. **Bảo toàn Tọa độ & Bằng chứng Cũ**:
   - Khi Admin cập nhật lại tọa độ chuẩn của cây trên bản đồ Master Data (ví dụ do đo đạc lại bằng máy chuyên dụng), tọa độ thực tế do Staff đo được ngoài hiện trường tại thời điểm thực hiện nhiệm vụ cũ **KHÔNG ĐƯỢC PHÉP THAY ĐỔI**.
3. **Bảo toàn Trạng thái Đóng (Closed Tasks Immutability - DR-HARD-05)**:
   - Các nhiệm vụ ở trạng thái `COMPLETED` hoặc `CANCELLED` là đóng vĩnh viễn. Quản trị viên hay bất kỳ ai đều không được phép mở lại hoặc thay đổi nội dung bên trong.

---

## 9. Bảng Tổng Hợp Phân Loại Năng Lực Nghiệp Vụ MVP (MVP Classification Table)

Tổng hợp phân loại chính thức toàn bộ 13 năng lực nghiệp vụ của Quản trị hệ thống:

| Mã Năng lực | Tên năng lực quản trị | Trạng thái Chốt | Lý do phân loại cụ thể | Tính chặn đối với MVP (Blocking)? |
|---|---|:---:|---|:---:|
| **CAP-ADM-01** | User Provisioning | **`MVP`** | Cốt lõi khởi tạo người dùng; không thể vận hành nếu không có nhân sự được cấp tài khoản. | **YES** |
| **CAP-ADM-02** | Role Assignment | **`MVP`** | Cốt lõi phân quyền; phân định ai là Staff đi hiện trường, ai là Manager điều phối. | **YES** |
| **CAP-ADM-03** | Account Activation / Suspension | **`MVP`** | An ninh tức thời; khóa quyền truy cập khi có rủi ro hoặc nhân viên nghỉ việc. | **YES** |
| **CAP-ADM-04** | Account Recovery / Unlock | **`MVP`** | Liên tục vận hành; hỗ trợ mở khóa cho nhân sự gặp sự cố đăng nhập ngoài hiện trường. | **YES** |
| **CAP-ADM-05** | Audit Log Inspection (Read/Filter) | **`MVP`** | Minh bạch và kiểm soát tuân thủ; giám sát toàn diện ai đã làm gì trên hệ thống. | **YES** |
| **CAP-ADM-06** | Tree Master Data Governance | **`MVP`** | Dữ liệu tài sản cốt lõi; tạo mới cây và cập nhật mã định danh/tọa độ chuẩn có kiểm toán. | **YES** |
| **CAP-ADM-07** | TaskType Catalog Governance | **`MVP`** | Chuẩn hóa danh mục loại công việc; ngăn chặn việc tạo loại task tùy tiện. | **YES** |
| **CAP-ADM-08** | ProofProfile Policy Governance | **`MVP`** | Xương sống kiểm soát chất lượng; khóa cứng quy tắc bằng chứng, cấm hạ cấp tùy tiện. | **YES** |
| **CAP-ADM-09** | Checklist Template Governance | **`MVP`** | Tiêu chuẩn kỹ thuật; ban hành biểu mẫu kiểm tra hiện trường có quản lý phiên bản. | **YES** |
| **CAP-ADM-10** | Findings Template Governance | **`NEXT`** | Quản trị mẫu động dành cho NEXT; MVP bắt buộc áp dụng lược đồ Structured Findings chuẩn tắc cố định (không suy diễn tùy chọn). | NO |
| **CAP-ADM-11** | Break-Glass Access | **`NEXT`** | Cơ chế khẩn cấp rủi ro cao; MVP đã có 3 lối thoát an toàn của Manager để giải tỏa ách tắc. | NO |
| **CAP-ADM-12** | Security Notifications | **`NEXT`** | Hệ thống cảnh báo tức thời; MVP đã ghi nhận đầy đủ 100% vào sổ kiểm toán Audit Trail. | NO |
| **CAP-ADM-13** | Platform System Configuration | **`REJECTED`** | Mơ hồ và sai lệch ranh giới; cấu hình hạ tầng/server/secrets thuộc DevOps bên ngoài. | NO |

### Thống kê Định lượng Phân loại:
- **`MVP`**: **9** năng lực (CAP-ADM-01, 02, 03, 04, 05, 06, 07, 08, 09)
- **`NEXT`**: **3** năng lực (CAP-ADM-10, 11, 12)
- **`RESERVED`**: **0** năng lực
- **`REJECTED`**: **1** năng lực (CAP-ADM-13)
- **Tổng số năng lực đánh giá**: **13 / 13** năng lực (Khớp 100%, không bỏ sót, 0 TBD).

---

## 10. Thử Nghiệm Phủ Định Ngữ Nghĩa Quyền Hạn (Semantic Negative Tests)

Kiểm thử chủ động trên 10 kịch bản sai phạm phổ biến nhằm chứng minh tính chặt chẽ của mô hình:

| Mã Kịch bản | Giả định thao tác sai phạm | Kết quả mong đợi | Đánh giá thực tế trong Mô hình Phase 2 | Kết luận |
|---|---|:---:|---|:---:|
| **CASE A: Admin phê duyệt nhiệm vụ vận hành hiện trường** | Admin đăng nhập và bấm nút `Approve` trên task của Staff. | **FAIL** (Bị cấm) | Bị chặn đứng tại Mục 5 và Mục 6 (ADM-SOD-04). Admin bị DENY 100% trên `Approve`. | **PASS (Đã chặn đứng)** |
| **CASE B: Manager tự gán quyền Admin cho chính mình** | Manager gọi API phân quyền để nâng role lên `admin`. | **FAIL** (Bị cấm) | Bị chặn đứng tại Mục 3.2 và Mục 6 (ADM-SOD-05). Manager không có quyền `Role Assignment`. | **PASS (Đã chặn đứng)** |
| **CASE C: Thay đổi vai trò làm ghi đè tác giả trong CareHistory** | Khi Staff đổi role, tên tác giả trong các báo cáo cũ bị đổi theo. | **FAIL** (Bị cấm) | Bị chặn đứng tại Mục 3.2, Mục 6 (ADM-SOD-02) và Mục 8. Lịch sử tác giả là bất biến. | **PASS (Đã chặn đứng)** |
| **CASE D: Admin chỉnh sửa hoặc xóa bỏ bản ghi nhật ký kiểm toán** | Admin gửi yêu cầu `DELETE /api/audit-logs/{id}`. | **FAIL** (Bị cấm) | Bị chặn đứng tại Mục 3.5 và Mục 6 (ADM-SOD-03). Sổ kiểm toán là Append-Only. | **PASS (Đã chặn đứng)** |
| **CASE E: Thay đổi chính sách bằng chứng hồi tố lên task cũ** | Đổi TaskType sang ProofProfile ngặt hơn làm task cũ bị thiếu bằng chứng. | **FAIL** (Bị cấm) | Bị chặn đứng tại Mục 3.8 và Mục 7. Task lưu cố định `policyVersionId` lúc tạo. | **PASS (Đã chặn đứng)** |
| **CASE F: Sửa Checklist Template âm thầm đổi checklist task đang chạy** | Admin sửa câu hỏi checklist, task ngoài hiện trường tự động đổi theo. | **FAIL** (Bị cấm) | Bị chặn đứng tại Mục 3.9 và Mục 7. Task lưu snapshot `templateVersion` tại lúc kích hoạt. | **PASS (Đã chặn đứng)** |
| **CASE G: Admin chỉnh sửa trực tiếp nhiệm vụ đã COMPLETED** | Admin mở lại task đã đóng để sửa nội dung bên trong. | **FAIL** (Bị cấm) | Bị chặn đứng tại Mục 8 (DR-HARD-05). Nhiệm vụ đã đóng là bất biến vĩnh viễn. | **PASS (Đã chặn đứng)** |
| **CASE H: Quyền can thiệp khẩn cấp (Break-Glass) trở thành quyền vĩnh viễn** | Kích hoạt Break-glass một lần và giữ quyền truy cập vĩnh viễn. | **FAIL** (Bị cấm) | Bị chặn đứng tại Mục 3.11 và Mục 6 (ADM-SOD-07). Break-glass bị hoãn sang NEXT, có thời hạn. | **PASS (Đã chặn đứng)** |
| **CASE I: Admin quản trị cấu hình server, database, secret keys** | Màn hình Admin có mục đổi connection string database. | **FAIL** (Bị cấm) | Bị bác bỏ tại Mục 3.13 (CAP-ADM-13 `REJECTED`). Cấu hình hạ tầng thuộc DevOps bên ngoài. | **PASS (Đã chặn đứng)** |
| **CASE J: Đổi Master Data cây xanh làm mất bối cảnh bằng chứng cũ** | Đổi tọa độ cây làm sai lệch kết quả đối soát GPS của task đã nghiệm thu. | **FAIL** (Bị cấm) | Bị chặn đứng tại Mục 3.6 và Mục 8. Tọa độ thực tế của task cũ được bảo lưu bất biến. | **PASS (Đã chặn đứng)** |

### 10.1. Thử Nghiệm Phủ Định Đóng Khép Ngữ Nghĩa (Semantic Closure Negative Tests SC-NT-01..07)

Bổ sung 7 kịch bản kiểm thử độc lập giải quyết dứt điểm các khiếm khuyết ngữ nghĩa (Semantic Defects SC-01..SC-04):

| Mã Kiểm Thử | Phát biểu giả định sai phạm | Kết quả mong đợi | Đánh giá thực tế trong Quy tắc Chốt | Kết luận |
|---|---|:---:|---|:---:|
| **SC-NT-01** | Findings Template Governance là NEXT đồng nghĩa Structured Findings là tùy chọn trong MVP. | **FAIL** (Sai lệch ngữ nghĩa) | Bác bỏ bởi Mục 3.10 (SC-01). `INSPECTION_PROOF` trong MVP bắt buộc phải có `Structured Findings` theo lược đồ chuẩn tắc cố định. Biểu mẫu động là NEXT không làm suy yếu yêu cầu thu thập dữ liệu MVP. | **PASS (Đã chặn đứng)** |
| **SC-NT-02** | TaskType có thể vừa là VERSIONED vừa là AUDIT-ONLY mà không có sự phân biệt rạch ròi. | **FAIL** (Vi phạm tính đơn quyết định) | Bác bỏ bởi Mục 3.7 và Mục 7 (SC-02). Danh mục `TaskType Catalog` là `AUDIT-ONLY`; riêng ánh xạ `TaskType → ProofProfile Mapping` là `VERSIONED`. Không có tài nguyên nào mang nhãn kép mâu thuẫn. | **PASS (Đã chặn đứng)** |
| **SC-NT-03** | Manager có thể tạo tài khoản Admin đầu tiên. | **FAIL** (Bị cấm tuyệt đối) | Bác bỏ bởi Mục 3.2 (SC-03 Bootstrap Rule) và ADM-SOD-05. Manager hoàn toàn không có quyền phân quyền hay can thiệp khởi tạo hệ thống. | **PASS (Đã chặn đứng)** |
| **SC-NT-04** | Người dùng Staff có thể tự phong quyền (self-promote) lên Admin. | **FAIL** (Bị cấm tuyệt đối) | Bác bỏ bởi Mục 3.2 (SC-03 Bootstrap Rule) và ADM-SOD-01. Staff không có quyền gán vai trò; Admin không được tự sửa vai trò của chính mình. | **PASS (Đã chặn đứng)** |
| **SC-NT-05** | Tác nhân tự động hóa (System) tự động cấp quyền Admin. | **FAIL** (Bị cấm tuyệt đối) | Bác bỏ bởi Mục 3.2 và ADM-SOD-06. Mọi quyền Admin phải do Admin hiện hữu gán hoặc qua controlled bootstrap, không có quyền tự phong tự động. | **PASS (Đã chặn đứng)** |
| **SC-NT-06** | Bổ sung tác nhân "Hội đồng kỹ thuật đô thị" vào quy trình phê duyệt ProofProfile mà không qua phê duyệt Actor Model. | **FAIL** (Sai lệch ranh giới tác nhân) | Bác bỏ tại Mục 3.8 (SC-04). Platform Administrator sở hữu thẩm quyền ban hành chính sách; quy trình thẩm định bên ngoài (nếu có) là tiền đề tổ chức ngoài hệ thống, không sinh thêm tác nhân trong mô hình. | **PASS (Đã chặn đứng)** |
| **SC-NT-07** | Ý nghĩa nghiệp vụ của một TaskType đã được tham chiếu lịch sử có thể bị sửa đổi trực tiếp (in-place mutation). | **FAIL** (Vi phạm tính toàn vẹn lịch sử) | Bác bỏ bởi Mục 3.7 và Mục 8 (SC-02 Historical Preservation). Thay đổi ngữ nghĩa bắt buộc phải tạo TaskType mới, giữ nguyên vẹn tham chiếu lịch sử. | **PASS (Đã chặn đứng)** |

---

## 11. Bảng Bằng Chứng Nghiệm Thu Cổng Phase 2 (Phase 2 Evidence Table)

| Gate ID | Tiêu chí nghiệm thu (Requirement) | Phương pháp xác minh (Verification Method) | Bằng chứng cụ thể (Evidence) | Tính chặn cổng (Blocking) | Kết quả nghiệm thu (Result) |
|---|---|---|---|:---:|:---:|
| **P2-01** | Mọi Admin capability có mục đích nghiệp vụ rõ ràng | Semantic Purpose Audit | Mục 3: Toàn bộ 13 capabilities đều có phần *Mục đích nghiệp vụ* tường minh. | **YES** | **PASS** |
| **P2-02** | Không có capability chỉ vì "Admin thường có" | Business Necessity Justification | Mục 3.13: CAP-ADM-13 bị `REJECTED` thẳng thừng vì là cấu hình hạ tầng chung chung. | **YES** | **PASS** |
| **P2-03** | Mọi thay đổi quản trị xác định rõ chủ sở hữu tài nguyên | Resource Ownership Inspection | Bảng Mục 4: Phân định rõ từng dòng tài nguyên và chủ sở hữu độc quyền (`Ultimate Owner`). | **YES** | **PASS** |
| **P2-04** | Phân quyền vai trò bắt buộc có lưu vết kiểm toán | Audit Trail Requirement Audit | Mục 3.2: CAP-ADM-02 bắt buộc lưu vết `actor`, `target`, `oldRole`, `newRole`, `reason`, `timestamp`. | **YES** | **PASS** |
| **P2-05** | Khóa tài khoản bảo toàn toàn vẹn lịch sử dữ liệu | Lifecycle History Preservation Check | Mục 3.3: Khóa tài khoản không xóa dữ liệu hay nhiệm vụ quá khứ; bảo toàn bất biến. | **YES** | **PASS** |
| **P2-06** | Đổi vai trò không xóa bỏ quyền tác giả lịch sử | Authorship Immutability Check | Mục 3.2, Mục 6 (ADM-SOD-02) và Mục 8: Quyền tác giả trong `CareHistory` được bảo toàn. | **YES** | **PASS** |
| **P2-07** | Thay đổi Master Data cây đô thị có lưu vết kiểm toán | Mutation Audit Specification Check | Mục 3.6: CAP-ADM-06 bắt buộc lưu vết `changedField`, `oldVal`, `newVal`, `reason`, `timestamp`. | **YES** | **PASS** |
| **P2-08** | ProofProfile không bị Manager hạ cấp tùy tiện per-task | Anti-Downgrade Invariant Check | Mục 3.8: CAP-ADM-08 cấm tuyệt đối Manager hạ cấp hồ sơ bằng chứng (DR-MVP-02). | **YES** | **PASS** |
| **P2-09** | Thay đổi biểu mẫu/chính sách xác định rõ quy tắc phiên bản | Versioning Policy Verification | Bảng Mục 7: Phân định rõ các tài nguyên `VERSIONED` (ProofPolicy, Checklist, Findings). | **YES** | **PASS** |
| **P2-10** | Break-Glass đòi hỏi actor + reason + timestamp + audit | Break-Glass Constraints Check | Mục 3.11: Định nghĩa khắt khe điều kiện MFA, Dual Auth, Time-boxed và Audit bắt buộc. | **YES** | **PASS** |
| **P2-11** | Break-Glass không âm thầm vượt qua kiểm soát an ninh | Security Bypass Prevention Check | Mục 3.11, Mục 6 (ADM-SOD-07) và Mục 10 (Case H): Break-glass là ngoại lệ có lưu vết, không thường trực. | **YES** | **PASS** |
| **P2-12** | Admin không tự duyệt công việc hoặc thẩm định việc ngoài hiện trường | Normal Task Prohibition Audit | Mục 5 (Deny Matrix), Mục 6 (ADM-SOD-04) và Mục 10 (Case A): Admin bị DENY 100% trên `Approve`/`Review`. | **YES** | **PASS** |
| **P2-13** | Mọi capability được phân loại chính xác 1 trạng thái MVP/NEXT/RESERVED/REJECTED | Unambiguous Classification Audit | Bảng Mục 9: Đúng 13/13 capabilities có trạng thái duy nhất (9 MVP, 3 NEXT, 0 RESERVED, 1 REJECTED). | **YES** | **PASS** |

---

## 12. Báo Cáo Đóng Khép Ngữ Nghĩa Phase 2 (Phase 2 Semantic Closure Review)

Báo cáo nghiệm thu khắc phục 4 khiếm khuyết ngữ nghĩa được chỉ ra bởi kiểm toán độc lập:

| Defect ID | Tiêu chí đóng khép ngữ nghĩa (Semantic Closure Requirement) | Phương pháp xác minh (Verification Method) | Bằng chứng cụ thể (Evidence) | Kết quả nghiệm thu (Result) |
|---|---|---|---|:---:|
| **SC-01** | Bảo toàn Structured Findings độc lập với quản trị mẫu động | Semantic Invariant & Distinction Audit | Mục 3.10: Tách bạch rõ Thành phần A (Structured Findings bắt buộc trong MVP với fixed canonical schema) và Thành phần B (Dynamic Findings Template Governance là `NEXT`). Khẳng định `ReportFieldIssue`, `TreeRiskStatus`, và ảnh chụp KHÔNG thay thế cho Structured Findings. SC-NT-01 PASS. | **PASS** |
| **SC-02** | Quyết định quản lý phiên bản TaskType rõ ràng, đơn nhất | Unambiguous Single-Decision Audit | Mục 3.7 & Mục 7: Danh mục `TaskType Catalog` là **`AUDIT-ONLY`** (mã định danh ổn định, cấm hard delete khi đã tham chiếu, thay đổi ngữ nghĩa phải tạo mới). Tách độc lập `TaskType → ProofProfile Mapping` là **`VERSIONED`**. 0 xuất hiện của `VERSIONED / AUDIT-ONLY`. SC-NT-02 & SC-NT-07 PASS. | **PASS** |
| **SC-03** | Khởi tạo Admin đầu tiên và phân quyền Admin chuẩn tắc tất định | Deterministic Bootstrap & Role Grant Audit | Mục 3.2: Xác lập rõ Quy tắc Khởi tạo (Controlled Bootstrap tạo bản ghi kiểm toán khởi tạo; không phải tự đăng ký hay Staff/Manager phong). Quy tắc gán vai trò bình thường cho phép Admin hiện hữu gán `staff`, `manager`, `admin` có lưu vết. Dual-Admin approval chốt là `NEXT SECURITY HARDENING`. SC-NT-03, SC-NT-04, SC-NT-05 PASS. | **PASS** |
| **SC-04** | Loại bỏ tác nhân quản trị chưa được duyệt ("Hội đồng kỹ thuật đô thị") | Actor Model Boundary Conformance Audit | Mục 3.8: Loại bỏ hoàn toàn cụm "hội đồng kỹ thuật đô thị". Thẩm quyền ban hành thuộc về Platform Administrator với `reason` và audit log bắt buộc; thẩm định ngoài (nếu có) là tiền đề tổ chức ngoài mô hình tác nhân. Không tạo thêm vai trò mới. SC-NT-06 PASS. | **PASS** |

---

## 13. Kết Luận Cổng Nghiệm Thu Phase 2 (Phase 2 Exit Gate)

```text
================================================================================
PHASE 2 PASS — SEMANTICALLY CLOSED
— STRUCTURED FINDINGS MVP SEMANTICS PRESERVED
— TASKTYPE VERSIONING DECISION UNAMBIGUOUS
— ADMIN BOOTSTRAP GOVERNANCE DEFINED
— UNSUPPORTED GOVERNANCE ACTOR REMOVED
— READY FOR PHASE 3 DOMAIN OWNERSHIP
================================================================================
```
