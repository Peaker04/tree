# NOVYX GreenOps — Authorization & Action Eligibility Model (Phase 4)

> **Tài liệu chuẩn mực phân quyền nghiệp vụ và điều kiện kích hoạt hành động**
> Thuộc chu trình: **Business Baseline Reconciliation — Phase 4 (Semantic Closure)**.
> Căn cứ chuẩn tắc:
> - [`docs/business-reconciliation/02-ACTOR-MODEL-DECISION.md`](02-ACTOR-MODEL-DECISION.md) (Khóa ranh giới 4 tác nhân)
> - [`docs/business-reconciliation/03-ROLE-NAMING-TAXONOMY.md`](03-ROLE-NAMING-TAXONOMY.md) (Khóa danh xưng 3 tầng)
> - [`docs/business-reconciliation/04-ADMIN-BUSINESS-SCOPE-DECISION.md`](04-ADMIN-BUSINESS-SCOPE-DECISION.md) (Khóa phạm vi nghiệp vụ Quản trị hệ thống)
> - [`docs/business-reconciliation/05-DOMAIN-OWNERSHIP-MATRIX.md`](05-DOMAIN-OWNERSHIP-MATRIX.md) (Khóa ma trận sở hữu tài nguyên miền)
> - [`docs/business-reconciliation/06-BOUNDED-CONTEXT-DECISIONS.md`](06-BOUNDED-CONTEXT-DECISIONS.md) (Khóa ranh giới ngữ cảnh giới hạn & từ vựng)
> - [`docs/DOMAIN.md`](../DOMAIN.md) (Kiến trúc miền chuẩn tắc)
> - [`docs/WORKFLOWS.md`](../WORKFLOWS.md) (Quy trình tác nghiệp chuẩn tắc)
> - [`docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md`](../NOVYX_Business_Baseline_Reconciliation_Master_Plan.md)
>
> **Ranh giới thực thi (Hard Scope Rule)**:
> - Xây dựng mô hình phân quyền và điều kiện hợp lệ hành vi (Action Eligibility) trên 2 bình diện: Vận hành (Operations) và Quản trị (Governance).
> - **KHÔNG** sửa mã nguồn ứng dụng (`apps/**`) hay thư viện chia sẻ (`packages/**`).
> - **KHÔNG** sửa đổi tài liệu canonical (`PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `REQUIREMENTS-TRACEABILITY.md`, `NFR.md`).
> - **KHÔNG** sửa đổi sơ đồ trực quan (`docs/diagrams/**`) tại phase này.
> - **KHÔNG** thiết kế API HTTP status code, không code role guard hay giao diện UI.

---

## 1. Nền Tảng Khái Niệm Phân Quyền Nghiệp Vụ (Foundational Concepts)

Phân quyền trong NOVYX GreenOps **tuyệt đối không phải là một ma trận nhị phân giản đơn** (như `Staff = Có`, `Manager = Có`, `Admin = Không`). Mỗi hành vi nghiệp vụ chỉ được phép thực thi khi thỏa mãn đồng thời cả 4 thành tố cấu thành theo công thức chuẩn mực:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FOUR-FACTOR ACTION ELIGIBILITY FORMULA                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ACTION ELIGIBILITY                                                        │
│   = ACTOR ROLE                                                              │
│     ∧ RESOURCE SCOPE                                                        │
│     ∧ DOMAIN STATE                                                          │
│     ∧ BUSINESS PRECONDITIONS                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.1. Định nghĩa 4 thành tố:
1. **ACTOR ROLE (Vai trò tác nhân)**:
   - Lớp tác nhân thực hiện lệnh, thuộc tập hợp 3 vai trò người dùng con người chuẩn tắc: `staff` (Field Staff - Nhân viên hiện trường), `manager` (Operations Manager - Quản lý vận hành), `admin` (Platform Administrator - Quản trị hệ thống), hoặc tác nhân tự động hóa kỹ thuật `System`.
   - *Nguyên tắc bất biến*: Vai trò đơn thuần **KHÔNG PHẢI** là điều kiện đủ để hành động (`Role Alone != Sufficient Authorization`).
2. **RESOURCE SCOPE (Phạm vi tài nguyên)**:
   - Thẩm quyền trên thực thể dữ liệu cụ thể mà tác nhân được phép thao tác.
   - Đối với Field Staff: `task.assignedStaffId == actor.userId` (đối với tác vụ/minh chứng/checklist); đối với tra cứu CareHistory là cây thuộc nhiệm vụ được phân công.
   - Đối với Operations Manager: `AUTHORIZED_OPERATIONAL_SCOPE` — tập hợp tài nguyên vận hành mà Manager được ủy quyền quản lý hợp lệ; cơ chế phân vùng cụ thể được hoãn lại (deferred), tuyệt đối không tự bịa đặt hay giả định các trường phân cấp địa lý, vùng miền hay phòng ban (`regionId`, `districtId`, `departmentId`, `teamId`).
   - Đối với Platform Administrator: `PLATFORM_GOVERNANCE_SCOPE` — phạm vi tài nguyên quản trị toàn nền tảng thuộc thẩm quyền Admin theo đúng các capability được phê duyệt.
3. **DOMAIN STATE (Trạng thái miền dữ liệu)**:
   - Trạng thái vòng đời hiện hành của thực thể mục tiêu cho phép lệnh được kích hoạt.
   - Ví dụ: Lệnh `StartTask` chỉ hợp lệ duy nhất khi trạng thái là `PENDING`; Lệnh `Approve` chỉ hợp lệ duy nhất khi trạng thái là `WAITING_REVIEW`.
4. **BUSINESS PRECONDITIONS (Điều kiện tiên quyết nghiệp vụ)**:
   - Các dữ kiện nghiệp vụ bắt buộc phải thỏa mãn trước khi chấp thuận thực thi lệnh (ví dụ: khoảng cách GPS $\le 10$m hoặc có lý do ngoại lệ, checklist đã tích đủ 100%, ảnh chụp đã tải lên đủ theo ProofProfile).

### 1.2. Các nguyên tắc phân định cốt lõi:
- **Phân quyền $\mathbf{\ne}$ Ẩn hiện nút giao diện (Authorization $\mathbf{\ne}$ UI Visibility)**: Ẩn nút trên màn hình chỉ là trải nghiệm người dùng (UX), không thay thế được luật kiểm soát an ninh tại tầng nghiệp vụ.
- **Quyền Đọc $\mathbf{\ne}$ Quyền Ghi $\mathbf{\ne}$ Quyền Phán Quyết $\mathbf{\ne}$ Quyền Quản Trị (READ $\mathbf{\ne}$ MUTATE $\mathbf{\ne}$ DECIDE $\mathbf{\ne}$ ADMINISTER)**: Thẩm quyền đọc dữ liệu (ví dụ: Admin đọc CareHistory, Manager đọc danh mục cây, Manager xem ReviewQueue) tuyệt đối không suy diễn thành quyền can thiệp hay duyệt việc ngoài hiện trường.
- **Ủy quyền Thao tác $\mathbf{\ne}$ Tự động Thành công (Authorized to Attempt $\mathbf{\ne}$ Guaranteed Workflow Transition)**: Có quyền bấm nộp bài không đồng nghĩa với việc nhiệm vụ được chuyển trạng thái sang `WAITING_REVIEW` nếu dữ liệu bằng chứng chưa hợp lệ hoặc thiếu chứng cứ.

---

## 2. Mô Hình Quyết Định & Danh Mục Từ Chối (Decision Model & Denial Categories)

### 2.1. Tập giá trị phán quyết chuẩn tắc:
Hệ thống sử dụng đúng 3 giá trị phán quyết nhị phân dứt điểm, cấm sử dụng các trạng thái mơ hồ (`PARTIAL`, `MOSTLY`, `IF_NEEDED`, `ADMIN_ONLY`):
- **`ALLOW`**: Cho phép thực thi hành vi khi thỏa mãn toàn bộ 4 thành tố (Role, Scope, State, Preconditions).
- **`DENY`**: Từ chối thực thi do vi phạm vai trò, phạm vi, trạng thái hoặc bất biến nghiệp vụ.
- **`NOT_APPLICABLE`**: Hành động không áp dụng cho tác nhân hoặc loại hình tài nguyên mục tiêu.

### 2.2. Danh mục lý do từ chối ngữ nghĩa (Semantic Denial Categories):
Mọi trường hợp bị `DENY` bắt buộc phải được quy chiếu về chính xác một trong các lý do ngữ nghĩa sau:
1. `ROLE_NOT_ALLOWED`: Tác nhân không sở hữu vai trò được phép kích hoạt lệnh.
2. `RESOURCE_SCOPE_MISMATCH`: Tác nhân sở hữu vai trò phù hợp nhưng tài nguyên nằm ngoài phạm vi được ủy quyền (ví dụ: Staff thao tác trên task của người khác).
3. `INVALID_TASK_STATE`: Trạng thái thực thể không cho phép kích hoạt lệnh (ví dụ: bắt đầu task đã hoàn thành, duyệt task đang làm dở).
4. `PRECONDITION_NOT_MET`: Điều kiện tiên quyết chưa được thỏa mãn (ví dụ: nộp việc khi chưa quét QR, duyệt ngoại lệ nhưng thiếu văn bản giải trình).
5. `TERMINAL_RESOURCE`: Thực thể đã đóng vĩnh viễn (`COMPLETED` hoặc `CANCELLED`), cấm mọi đột biến dữ liệu (`DR-HARD-05`).
6. `CAPABILITY_NOT_IN_MVP`: Tính năng thuộc giai đoạn mở rộng tiếp theo (`NEXT`), chưa kích hoạt trong phạm vi MVP (ví dụ: Dynamic Findings Builder, Break-Glass).
7. `ACTION_REJECTED_BY_PRODUCT_MODEL`: Hành vi bị mô hình sản phẩm bác bỏ vĩnh viễn (ví dụ: Admin cấu hình server hạ tầng, tự đăng ký tự do).

### 2.3. Phân loại yêu cầu lưu vết kiểm toán (Audit Requirement Levels):
Hệ thống sử dụng thống nhất 3 token chuẩn tắc sau:
- **`AUDIT_REQUIRED`**: Bắt buộc sinh bản ghi sự kiện kiểm toán (`AuditEvent`) bất biến lưu vào kho nhật ký (áp dụng cho toàn bộ lệnh quản trị của Admin, quyết định thẩm định, phân công/điều chuyển, hủy việc, cấp đổi mã QR).
- **`AUDIT_RECOMMENDED`**: Khuyến nghị lưu vết phục vụ phân tích vận hành (ví dụ: báo cáo sự cố hiện trường `ReportFieldIssue`).
- **`NO_BUSINESS_AUDIT_REQUIRED`**: Không yêu cầu kiểm toán nghiệp vụ (các thao tác đọc dữ liệu thông thường, thao tác kỹ thuật nội bộ).

---

## 3. Hai Bình Diện Phân Quyền & Thẩm Quyền Hệ Thống (Two Authorization Planes & System Authority)

Hệ thống phân tách rạch ròi 2 bình diện phân quyền của con người và 1 bình diện tự động hóa kỹ thuật:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NOVYX AUTHORIZATION ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  PLANE A: OPERATIONAL AUTHORIZATION (Bình diện Tác nghiệp Thực địa)         │
│  - Tác nhân: Field Staff (staff), Operations Manager (manager)              │
│  - Miền quản lý: Work Management, Tra cứu Cây xanh, Đọc Chính sách          │
│  - Nguyên tắc: Admin DENY 100% trên toàn bộ chu trình vận hành thường nhật  │
├─────────────────────────────────────────────────────────────────────────────┤
│  PLANE B: GOVERNANCE AUTHORIZATION (Bình diện Quản trị Nền tảng)            │
│  - Tác nhân: Platform Administrator (admin)                                 │
│  - Miền quản lý: Identity & Access, Tree Master Data, Policy, Audit Read    │
│  - Nguyên tắc: Manager và Staff DENY 100% trên toàn bộ các quyền quản trị   │
├─────────────────────────────────────────────────────────────────────────────┤
│  PLANE C: TECHNICAL AUTOMATION AUTHORITY (Thẩm quyền Tự động hóa Kỹ thuật)  │
│  - Tác nhân: System (Hệ thống phần mềm nền)                                 │
│  - Bản chất: Thực thi quy tắc tất định, không có ý chí con người            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.1. Ma trận Thẩm quyền Tác nhân Tự động hóa Kỹ thuật (System Authority Matrix):

| Hành vi Tự động hóa (System Activity) | Thẩm quyền của System | Ranh giới Kỹ thuật & Bất biến Nghiệp vụ |
|---|:---:|---|
| Tính toán khoảng cách GPS ($\le 10$m) | **ALLOW** | Thuật toán đối chiếu khoảng cách đo được với tọa độ chuẩn của cây. |
| Kiểm tra tính đầy đủ của hồ sơ bằng chứng | **ALLOW** | Đối chiếu số lượng ảnh, checklist, structured findings theo `ProofProfile`. |
| Ghi nối tiếp sự kiện kiểm toán (`AuditEvent`) | **ALLOW** | Tự động bắt sự kiện miền và ghi lưu vết bất biến (`Append-Only`). |
| Xử lý hàng đợi gửi tin ngoại tuyến (Outbox Sync) | **ALLOW** | Đẩy gói tin lên máy chủ và cập nhật `SyncStatus = SYNCED`. |
| Phát thông báo vận hành (Deliver Notification) | **ALLOW** | Đẩy thông báo theo sự kiện miền tới đúng đối tượng nhận quy định. |
| Chuyển trạng thái Task theo kết quả lệnh hợp lệ | **ALLOW** | Thực thi chuyển dịch trạng thái tất định sau khi lệnh con người hợp lệ. |
| Tự ý khởi tạo nhiệm vụ theo ý chí chủ quan | **DENY** | Khởi tạo task là quyền độc quyền của Operations Manager. |
| Tự ý chọn hoặc phân công nhân viên | **DENY** | Điều phối nhân sự là quyết định vận hành của Manager. |
| Tự động phê duyệt hồ sơ (`Auto-approval`) | **DENY** | Bị cấm tuyệt đối tại MVP (`DR-POL-01`); 100% task phải do Manager duyệt. |
| Tự ý phán quyết yêu cầu làm lại (`RequestRework`) | **DENY** | Đánh giá sai lệch kỹ thuật lâm nghiệp do Manager đảm trách. |
| Tự động cấp hoặc nâng quyền Admin | **DENY** | Cấm tuyệt đối theo quy tắc `ADM-SOD-06`. |
| Tự ý nới lỏng hoặc bỏ qua quy tắc bảo mật | **DENY** | System không được phép bỏ qua các chốt kiểm soát an ninh. |

### 3.2. Đặc tả Chuẩn mực Hành vi Tự động hóa Kỹ thuật (Normalized System Activity Specifications):

| Mã Hành vi | Tên Hành vi Hệ thống | Ngữ cảnh Sở hữu | Tài nguyên Mục tiêu | Kích hoạt (Trigger) | Điều kiện Tiên quyết | Kết quả Tất định (Deterministic Outcome) | Ranh giới Cấm Tự Quyết (Forbidden Discretion) |
|---|---|---|---|---|---|---|---|
| **SYS-01** | `ComputeGpsDistance` | Work Management | Tọa độ GPS & Tọa độ Cây | Staff thực hiện `VerifyGps` | Tọa độ GPS thiết bị hợp lệ; Tọa độ chuẩn của cây hiện diện. | Tính toán khoảng cách Haversine; gán cờ `$\le 10$m` hoặc cờ ngoại lệ. | CẤM System tự sửa tọa độ đo được; CẤM tự xóa cờ ngoại lệ nếu khoảng cách $> 10$m. |
| **SYS-02** | `ValidateProofCompleteness` | Work Management | Hồ sơ `TaskEvidence` | Staff gọi lệnh `SubmitEvidence` | Hợp đồng `ProofProfile` của task đã nạp; Dữ liệu đính kèm đầy đủ. | Đánh giá đối soát tính đầy đủ 100% của ảnh, checklist và findings. | CẤM System tự ý giảm bớt tiêu chí hợp đồng; CẤM cho qua nếu thiếu chứng cứ bắt buộc. |
| **SYS-03** | `AppendAuditEvent` | Audit & Compliance | Luồng `AuditEvent` | Lệnh nghiệp vụ có yêu cầu kiểm toán hoàn tất | Dữ liệu sự kiện chứa đủ: actor, action, resource, timestamp, outcome. | Ghi nối tiếp bản ghi kiểm toán bất biến (`Append-Only`) vào kho lưu trữ. | CẤM System sửa đổi, xóa bỏ hoặc bỏ qua ghi log kiểm toán. |
| **SYS-04** | `ProcessOutboxSync` | Work Management | Hàng đợi Outbox & Task | Thiết bị di động khôi phục kết nối mạng | Tồn tại các gói tin ở trạng thái `PENDING_SYNC` trên thiết bị. | Đẩy payload lên server; khi nhận HTTP thành công chuyển `SYNCED` và kích hoạt state máy chủ. | Nếu đồng bộ thất bại, giữ task tại `IN_PROGRESS`, gán `SYNC_FAILED`, CẤM tự nâng lên `WAITING_REVIEW`. |
| **SYS-05** | `DeliverNotification` | Operational Notifications | Hàng đợi thông báo | Sự kiện vận hành phát sinh (`FieldIssue`, `Submit`, `Rework`) | Định danh người nhận hợp lệ theo phân công/quyền hạn nghiệp vụ. | Gửi thông báo đẩy (Push/In-app) tới thiết bị của Manager hoặc Staff. | CẤM System tự ý thay đổi trạng thái nhiệm vụ chỉ dựa vào việc phát thông báo. |
| **SYS-06** | `ApplyAuthorizedStateTransition` | Work Management | `Task.status` | Lệnh hợp lệ từ con người được máy chủ chấp nhận | Tác nhân con người có thẩm quyền; Tiên quyết thỏa mãn; Payload hợp lệ. | Cập nhật `TaskStatus` chính xác sang trạng thái đích của máy trạng thái. | CẤM System tự ý kích hoạt chuyển dịch trạng thái mà không có lệnh hợp lệ từ con người. |

---

## 4. Ma Trận Phân Quyền Vận Hành Thực Địa (Operational Authorization Matrix)

Bảng phân quyền cho 22 hành vi tác nghiệp hiện trường (`OP-01` đến `OP-22`) thuộc ngữ cảnh `Work Management`:

| Mã Lệnh | Tên Hành vi Vận hành (Operational Command) | Field Staff | Operations Manager | Platform Administrator | System |
|:---:|---|:---:|:---:|:---:|:---:|
| **OP-01** | `ViewAssignedTask` (Xem task được giao) | **ALLOW** (Giao cho mình) | **ALLOW** (`AUTHORIZED_OPERATIONAL_SCOPE`) | **DENY** | **N/A** |
| **OP-02** | `ViewOperationalTask` (Xem toàn bộ task vận hành) | **DENY** | **ALLOW** (`AUTHORIZED_OPERATIONAL_SCOPE`) | **DENY** | **N/A** |
| **OP-03** | `CreateTask` (Khởi tạo nhiệm vụ mới) | **DENY** | **ALLOW** | **DENY** | **DENY** |
| **OP-04** | `AssignTask` (Phân công nhiệm vụ tại PENDING) | **DENY** | **ALLOW** | **DENY** | **DENY** |
| **OP-05** | `StartTask` (Bấm bắt đầu thực địa) | **ALLOW** (Đúng người nhận) | **DENY** | **DENY** | **DENY** |
| **OP-06** | `VerifyGps` (Đo tọa độ thực địa $\le 10$m) | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ đọc) | **DENY** | **ALLOW** (Tính toán) |
| **OP-07** | `VerifyQr` (Quét mã QR thân cây) | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ đọc) | **DENY** | **ALLOW** (Khớp mã) |
| **OP-08** | `ReportFieldIssue` (Báo sự cố thi công $\to$ BLOCKED) | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ duyệt xử lý) | **DENY** | **N/A** |
| **OP-09** | `ResumeBlockedTask` (Mở lại task từ BLOCKED) | **DENY** | **ALLOW** | **DENY** | **DENY** |
| **OP-10** | `ReassignTask` (Điều chuyển nhân sự PENDING/BLOCKED) | **DENY** | **ALLOW** | **DENY** | **DENY** |
| **OP-11** | `CancelTask` (Hủy việc có lý do bắt buộc) | **DENY** | **ALLOW** | **DENY** | **DENY** |
| **OP-12** | `CaptureProofEvidence` (Chụp ảnh minh chứng) | **ALLOW** (Đúng người nhận) | **DENY** | **DENY** | **N/A** |
| **OP-13** | `CompleteChecklist` (Tích chọn checklist trên task) | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ đọc) | **DENY** | **N/A** |
| **OP-14** | `RecordStructuredFindings` (Khám bệnh cây) | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ đọc) | **DENY** | **N/A** |
| **OP-15** | `SubmitEvidence` (Nộp hồ sơ nghiệm thu) | **ALLOW** (Đúng người nhận) | **DENY** | **DENY** | **ALLOW** (Xác nhận mạng) |
| **OP-16** | `ViewReviewQueue` (Xem hàng đợi chờ duyệt) | **DENY** | **ALLOW** | **DENY** | **N/A** |
| **OP-17** | `ReviewTask` (Mở hồ sơ thẩm định chi tiết) | **DENY** | **ALLOW** | **DENY** | **N/A** |
| **OP-18** | `ApproveTask` (Phê duyệt đạt chuẩn $\to$ COMPLETED) | **DENY** | **ALLOW** | **DENY** | **DENY** |
| **OP-19** | `ApproveWithException` (Duyệt ngoại lệ có giải trình) | **DENY** | **ALLOW** | **DENY** | **DENY** |
| **OP-20** | `RequestRework` (Yêu cầu làm lại có mục tiêu) | **DENY** | **ALLOW** | **DENY** | **DENY** |
| **OP-21** | `ResubmitRework` (Nộp lại khâu bằng chứng sửa) | **ALLOW** (Đúng người nhận) | **DENY** | **DENY** | **ALLOW** (Xác nhận mạng) |
| **OP-22** | `ViewCareHistory` (Tra cứu lịch sử chăm sóc cây) | **ALLOW** (Cây được giao) | **ALLOW** (`AUTHORIZED_OPERATIONAL_SCOPE`) | **ALLOW** (`PLATFORM_GOVERNANCE_SCOPE`) | **N/A** |

---

## 5. Ma Trận Tương Thích Trạng Thái Nhiệm Vụ (Task Action × Task Status Matrix)

Ma trận xác định điều kiện hợp lệ về mặt trạng thái vòng đời của thực thể `Task` đối với từng hành vi tác nghiệp (đảm bảo phù hợp tuyệt đối với quy trình chuẩn tắc `docs/WORKFLOWS.md`):

| Hành vi Tác nghiệp (Task Action) | `PENDING` | `IN_PROGRESS` | `BLOCKED` | `WAITING_REVIEW` | `REWORK_REQUIRED` | `COMPLETED` | `CANCELLED` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `AssignTask` (Phân công ban đầu) | **`ALLOW`** | `DENY` | `DENY` | `DENY` | `DENY` | `DENY` | `DENY` |
| `StartTask` (Kích hoạt bắt đầu việc) | **`ALLOW`** | `DENY` | `DENY` | `DENY` | `DENY` | `DENY` | `DENY` |
| `VerifyGps` (Đo tọa độ hiện trường) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | **`ALLOW*`** (Khâu cần đo lại) | `DENY` | `DENY` |
| `VerifyQr` (Quét tem QR trên thân cây) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | **`ALLOW*`** (Khâu cần quét lại) | `DENY` | `DENY` |
| `ReportFieldIssue` (Báo cáo sự cố thi công) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` | `DENY` | `DENY` |
| `CaptureProofEvidence` (Thu thập ảnh chứng cứ) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | **`ALLOW*`** (Khâu bị từ chối) | `DENY` | `DENY` |
| `CompleteChecklist` (Tích chọn checklist) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | **`ALLOW*`** (Khâu bị từ chối) | `DENY` | `DENY` |
| `RecordStructuredFindings` (Khám bệnh cây) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | **`ALLOW*`** (Khâu bị từ chối) | `DENY` | `DENY` |
| `SubmitEvidence` (Nộp hồ sơ lần đầu) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` | `DENY` | `DENY` |
| `ResumeBlockedTask` (Tiếp tục thi công) | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` | `DENY` |
| `ReassignTask` (Điều chuyển nhân sự) | **`ALLOW`** (Case A) | `DENY` | **`ALLOW`** (Case B) | `DENY` | `DENY` | `DENY` | `DENY` |
| `CancelTask` (Hủy nhiệm vụ vận hành) | **`ALLOW`** | **`ALLOW`** | **`ALLOW`** | **`ALLOW`** | **`ALLOW`** | `DENY` | `DENY` |
| `ViewReviewQueue` (Xem danh sách chờ duyệt) | `DENY` | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` |
| `ReviewTask` (Mở hồ sơ thẩm định) | `DENY` | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` |
| `ApproveTask` (Duyệt chuẩn đạt yêu cầu) | `DENY` | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` |
| `ApproveWithException` (Duyệt ngoại lệ) | `DENY` | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` |
| `RequestRework` (Yêu cầu làm lại) | `DENY` | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` |
| `ResubmitRework` (Nộp lại bằng chứng sửa) | `DENY` | `DENY` | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` |

> **Quy tắc sửa đổi tại `REWORK_REQUIRED` và Ghi chú điều kiện `ALLOW*`**:
> 1. Trạng thái `REWORK_REQUIRED` **KHÔNG** mở lại toàn bộ nhiệm vụ một cách tự do. Chỉ duy nhất các mục/khâu bằng chứng cụ thể bị Quản lý chỉ định sai sót (`targetedKhau`) trong lệnh `RequestRework` (hoặc việc đo lại GPS/QR phục vụ sửa khâu đó) mới được phép ghi nhận dữ liệu mới.
> 2. Toàn bộ các bằng chứng hợp lệ cũ được khóa bảo lưu bất biến (`DR-HARD-03`, `DR-POL-03`).
> 3. Bản thân thao tác đo đạc hoặc chụp ảnh minh chứng tại `REWORK_REQUIRED` **TUYỆT ĐỐI KHÔNG** làm thay đổi trạng thái vòng đời của `Task`. Chỉ lệnh `ResubmitRework` (được máy chủ chấp thuận) mới chuyển trạng thái task từ `REWORK_REQUIRED` về `WAITING_REVIEW`.
> 4. **P4-SC-01 Fix**: Lệnh `ReportFieldIssue` tại `REWORK_REQUIRED` bị **`DENY`**. Quy trình chuẩn tắc hiện hành không tồn tại bước chuyển dịch `REWORK_REQUIRED -> BLOCKED`. Tại `REWORK_REQUIRED`, chỉ cho phép Nhân viên nộp lại (`ResubmitRework`) hoặc Quản lý hủy việc (`CancelTask`).

### Nguyên tắc bất biến về Trạng thái Đóng (Terminal State Immutability - DR-HARD-05):
Các nhiệm vụ ở trạng thái `COMPLETED` và `CANCELLED` là **ĐÓNG VĨNH VIỄN**. Toàn bộ các hành vi can thiệp, mở lại, giao lại hay sửa đổi nội dung đều bị hệ thống `DENY 100%`. Không tồn tại các lệnh như `ReopenTask` hay `RestoreTask`.

---

## 6. Ma Trận Hợp Đồng Bằng Chứng Theo ProofProfile (Proof Requirement Matrix)

Hệ thống không áp dụng một lệnh nộp chứng cứ chung chung, mà phân định điều kiện hợp lệ thu thập chứng cứ dựa trên hợp đồng bắt buộc của 3 hồ sơ `ProofProfile`:

| Thành phần Bằng chứng (Proof Component) | `CHANGE_PROOF` (Cắt tỉa, Trồng mới) | `SERVICE_PROOF` (Tưới nước, Bón phân) | `INSPECTION_PROOF` (Khảo sát rủi ro/bệnh) | Tác nhân Thu thập | Bắt buộc cho Nghiệm thu? |
|---|:---:|:---:|:---:|:---:|:---:|
| **Site Verification (GPS $\le 10$m & QR)** | **BẮT BUỘC** | **BẮT BUỘC** | **BẮT BUỘC** | Field Staff | **YES** (Hoặc có cờ ngoại lệ giải trình) |
| **Before Photo (Ảnh hiện trạng Trước)** | **BẮT BUỘC** | `NOT_APPLICABLE` | `NOT_APPLICABLE` | Field Staff | **YES** |
| **Checklist (Tiêu chí kỹ thuật)** | **BẮT BUỘC** | **BẮT BUỘC** | `NOT_APPLICABLE` | Field Staff | **YES** (Tích đủ 100% câu hỏi) |
| **After Photo (Ảnh kết quả Sau)** | **BẮT BUỘC** | **BẮT BUỘC** | `NOT_APPLICABLE` | Field Staff | **YES** |
| **Structured Findings (Khám bệnh chuyên sâu)** | `NOT_APPLICABLE` | `NOT_APPLICABLE` | **BẮT BUỘC** | Field Staff | **YES** (Theo Fixed Schema MVP) |
| **Condition Photos (Ảnh sâu bệnh/tán/gốc)** | `NOT_APPLICABLE` | `NOT_APPLICABLE` | **BẮT BUỘC** ($\ge 1$ ảnh) | Field Staff | **YES** |

> **Phân định Checklist vs Findings**:
> - Field Staff chỉ được phép ghi dữ liệu trên bản chụp `ChecklistSnapshot` và `StructuredFindings` của nhiệm vụ cụ thể, tuyệt đối không có quyền sửa đổi biểu mẫu gốc `ChecklistTemplate`.
> - Platform Administrator quản trị các phiên bản biểu mẫu gốc (`ChecklistTemplateVersion`), nhưng tuyệt đối không có quyền can thiệp vào câu trả lời checklist hay kết quả khám bệnh của từng nhiệm vụ cụ thể.

---

## 7. Ma Trận Phân Quyền Quản Trị Nền Tảng (Governance Authorization Matrix)

Bảng phân quyền cho 22 hành vi quản trị nền tảng (`GV-01` đến `GV-22`), phân định rõ ràng giữa **19 lệnh quản trị MVP được ánh xạ từ 9 Admin capabilities MVP**, 2 lệnh giai đoạn tiếp theo (`NEXT`), và 1 lệnh bị bác bỏ (`REJECTED`):

| Mã Lệnh | Tên Hành vi Quản trị (Governance Command) | Field Staff | Operations Manager | Platform Administrator | Trạng thái Sản phẩm & Quyết định Phân quyền |
|:---:|---|:---:|:---:|:---:|:---:|
| **GV-01** | `ProvisionUser` (Tạo/Mời người dùng mới) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-01) |
| **GV-02** | `AssignRole` (Gán vai trò staff, manager, admin) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-02) |
| **GV-03** | `ActivateAccount` (Kích hoạt tài khoản) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-03) |
| **GV-04** | `SuspendAccount` (Khóa tài khoản tạm thời) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-03) |
| **GV-05** | `DisableAccount` (Vô hiệu hóa tài khoản nghỉ việc) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-03) |
| **GV-06** | `UnlockAccount` (Mở khóa đăng nhập sai) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-04) |
| **GV-07** | `RecoverAccount` (Khôi phục quyền/cấp lại liên kết an toàn) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-04) |
| **GV-08** | `ViewAuditLog` (Xem sổ nhật ký kiểm toán) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-05) |
| **GV-09** | `FilterAuditLog` (Lọc & tra cứu nhật ký kiểm toán) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-05) |
| **GV-10** | `CreateTree` (Thêm cây mới vào Master Data) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-06) |
| **GV-11** | `UpdateTreeMasterData` (Sửa thông tin gốc của cây) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-06) |
| **GV-12** | `ReplaceTreeQrCode` (Cấp đổi mã QR do tem hỏng) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-06) |
| **GV-13** | `UpdateCanonicalCoordinates` (Đo đạc lại GPS chuẩn) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-06) |
| **GV-14** | `RetireTree` (Chuyển cây sang trạng thái RETIRED) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-06) |
| **GV-15** | `CreateTaskType` (Tạo loại việc mới trong Catalog) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-07) |
| **GV-16** | `ActivateTaskType` (Kích hoạt loại việc ACTIVE) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-07) |
| **GV-17** | `DeactivateTaskType` (Ngưng áp dụng loại việc INACTIVE) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-07) |
| **GV-18** | `PublishProofPolicyVersion` (Ban hành phiên bản chính sách) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-08) |
| **GV-19** | `PublishChecklistTemplateVersion` (Ban hành phiên bản mẫu) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (Thuộc CAP-ADM-09) |
| **GV-20** | `ManageDynamicFindingsTemplate` (Tạo form khám bệnh động) | `DENY` | `DENY` | `DENY` | **NEXT** (`CAPABILITY_NOT_IN_MVP`) |
| **GV-21** | `UseBreakGlass` (Mở phiên can thiệp khẩn cấp) | `DENY` | `DENY` | `DENY` | **NEXT** (`CAPABILITY_NOT_IN_MVP`) |
| **GV-22** | `ManagePlatformSystemConfig` (Cấu hình server/DB/secrets) | `DENY` | `DENY` | `DENY` | **REJECTED** (`ACTION_REJECTED_BY_PRODUCT_MODEL`) |

---

## 8. Bảng Đặc Tả Thẩm Quyền Chuẩn Tắc Cho Từng Lệnh Hợp Lệ (Authoritative Action Specifications)

Đặc tả chuẩn hóa 100% các hành vi được phép (`ALLOW`) trong hệ thống (gồm toàn bộ lệnh vận hành tác nghiệp `OP-01..OP-22` và 19 lệnh quản trị nền tảng `GV-01..GV-19`):

### 8.1. Đặc tả Lệnh Vận Hành Tác Nghiệp (Operational Commands OP-01..OP-22):

| Mã Lệnh | Tên Lệnh Chuẩn tắc | Tác nhân | Ngữ cảnh Sở hữu | Tài nguyên Mục tiêu | Phạm vi Tài nguyên (Resource Scope) | Trạng thái Cho phép | Điều kiện Tiên quyết (Preconditions) | Kết quả Nghiệp vụ (Outcome) | Yêu cầu Kiểm toán | Điều kiện Bị cấm Tuyệt đối (Forbidden Conditions) |
|---|---|---|---|---|---|---|---|---|:---:|---|
| **OP-01** | `ViewAssignedTask` | Staff, Manager | Work Management | `Task` | Staff: `assignedStaffId == actor.userId`; Manager: `AUTHORIZED_OPERATIONAL_SCOPE` | Mọi trạng thái | Tác nhân đã xác thực; Task nằm trong phạm vi ủy quyền hợp lệ. | Trả về thông tin chi tiết nhiệm vụ để đọc/tra cứu; Không đổi trạng thái task. | **NO_BUSINESS_AUDIT_REQUIRED** | Staff CẤM xem task của người khác; Thao tác xem KHÔNG làm thay đổi `TaskStatus`. |
| **OP-02** | `ViewOperationalTask` | Manager | Work Management | Danh sách `Task` | `AUTHORIZED_OPERATIONAL_SCOPE` | Mọi trạng thái | Tác nhân có vai trò `manager` và trạng thái `ACTIVE`. | Trả về danh sách/tổng hợp các nhiệm vụ trong phạm vi quản lý vận hành; Không đổi trạng thái task. | **NO_BUSINESS_AUDIT_REQUIRED** | Staff CẤM gọi lệnh; Admin CẤM gọi lệnh; Thao tác xem KHÔNG làm thay đổi dữ liệu. |
| **OP-03** | `CreateTask` | Manager | Work Management | Thực thể `Task` mới | `AUTHORIZED_OPERATIONAL_SCOPE` | N/A (Khởi tạo) | Cây tồn tại và chưa bị RETIRED; TaskType đang `ACTIVE`; Ánh xạ ProofProfile tồn tại; Nhân viên gán đang `ACTIVE`. | Tạo task ở trạng thái `PENDING`, chốt `treeIdSnapshot` và `policyVersionId`. | **AUDIT_REQUIRED** | CẤM Admin gọi lệnh; CẤM chọn TaskType đang `INACTIVE`; CẤM gán cho người bị khóa. |
| **OP-04** | `AssignTask` | Manager | Work Management | `Task` | `AUTHORIZED_OPERATIONAL_SCOPE` | `PENDING` | Nhân sự được gán có vai trò `staff` và trạng thái `ACTIVE`; Task thuộc phạm vi quản lý. | Cập nhật `assignedStaffId`, lưu vết phân công ban đầu. | **AUDIT_REQUIRED** | CẤM gán khi task đang `IN_PROGRESS`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`; Manager CẤM gán cho chính mình. |
| **OP-05** | `StartTask` | Staff | Work Management | `Task` | `assignedStaffId == actor.userId` | `PENDING` | Tác nhân đăng nhập đúng tài khoản được phân công; Tài khoản đang `ACTIVE`. | Chuyển trạng thái sang `IN_PROGRESS`, chụp `ChecklistSnapshot` nếu có biểu mẫu. | **NO_BUSINESS_AUDIT_REQUIRED** | CẤM Manager hoặc Admin bấm hộ; Mở xem chi tiết hoặc mở camera KHÔNG làm đổi trạng thái task (`DR-MVP-04`). |
| **OP-06** | `VerifyGps` | Staff | Work Management | `SiteVerification` | `assignedStaffId == actor.userId` | `IN_PROGRESS`, `REWORK_REQUIRED`* | Tọa độ GPS đo thực tế có khoảng cách tới cây $\le 10$m (hoặc có giải trình ngoại lệ). | Cập nhật `gpsVerification`, gắn nhãn `LOCATION_VERIFIED` hoặc cờ ngoại lệ. | **NO_BUSINESS_AUDIT_REQUIRED** | Đo GPS thành công KHÔNG làm đổi `TaskStatus`; CẤM dùng tọa độ giả lập; Manager/Admin CẤM đo thay. |
| **OP-07** | `VerifyQr` | Staff | Work Management | `SiteVerification` | `assignedStaffId == actor.userId` | `IN_PROGRESS`, `REWORK_REQUIRED`* | Mã QR quét được khớp với `treeId` của task (hoặc có cờ ngoại lệ danh tính tem hỏng). | Cập nhật `qrVerification`, gắn nhãn `TREE_IDENTITY_VERIFIED` hoặc cờ ngoại lệ. | **NO_BUSINESS_AUDIT_REQUIRED** | Quét QR KHÔNG làm đổi `TaskStatus`; CẤM quét QR cây khác để thế chấp; Manager/Admin CẤM quét thay. |
| **OP-08** | `ReportFieldIssue` | Staff | Work Management | `FieldIssue` | `assignedStaffId == actor.userId` | `IN_PROGRESS` (Duy nhất) | Có sự cố cản trở thi công khách quan; Bắt buộc có mô tả lý do và ảnh chụp hiện trường. | Chuyển trạng thái task sang `BLOCKED`, thông báo cho Manager xử lý. | **AUDIT_RECOMMENDED** | CẤM dùng để báo sâu bệnh của cây (`StructuredFindings`); CẤM tự ý hủy task; CẤM gọi tại `REWORK_REQUIRED` (`P4-SC-01`). |
| **OP-09** | `ResumeBlockedTask` | Manager | Work Management | `Task` | `AUTHORIZED_OPERATIONAL_SCOPE` | `BLOCKED` | Sự cố cản trở đã được giải tỏa ngoài thực địa; Có xác nhận của Manager. | Đưa task quay lại trạng thái `IN_PROGRESS` cho nhân viên cũ tiếp tục. | **AUDIT_REQUIRED** | Staff không có quyền tự gỡ BLOCKED; Admin CẤM can thiệp; CẤM mở lại nếu chưa giải quyết xong sự cố. |
| **OP-10** | `ReassignTask` | Manager | Work Management | `Task` | `AUTHORIZED_OPERATIONAL_SCOPE` | `PENDING` (Case A), `BLOCKED` (Case B) | **Case A**: Task đang `PENDING`, nhân viên mới `ACTIVE` khác người cũ. **Case B**: Task đang `BLOCKED`, nhân viên cũ không thể tiếp tục, nhân viên mới `ACTIVE`. | Cập nhật `assignedStaffId`, chuyển task về `PENDING`, bảo lưu lịch sử phân công, bằng chứng cũ và lịch sử sự cố. | **AUDIT_REQUIRED** | CẤM điều chuyển trực tiếp từ `IN_PROGRESS` (phải qua `BLOCKED`); CẤM điều chuyển khi đang `WAITING_REVIEW` (`DR-HARD-06`), `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`; CẤM xóa bằng chứng cũ. |
| **OP-11** | `CancelTask` | Manager | Work Management | `Cancellation` | `AUTHORIZED_OPERATIONAL_SCOPE` | `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED` | Bắt buộc nhập lý do hủy việc bằng văn bản; Lưu vết người hủy và thời điểm. | Chuyển task sang `CANCELLED` (đóng vĩnh viễn), bảo lưu hồ sơ cũ, KHÔNG sinh `CareHistory` (`DR-HARD-07`). | **AUDIT_REQUIRED** | CẤM hủy task đã `COMPLETED`; CẤM Admin gọi lệnh trong chế độ thường; CẤM xóa vật lý khỏi cơ sở dữ liệu. |
| **OP-12** | `CaptureProofEvidence` | Staff | Work Management | `TaskEvidence` | `assignedStaffId == actor.userId` | `IN_PROGRESS`, `REWORK_REQUIRED`* | Chụp ảnh thực tế tại hiện trường; Khớp loại ảnh quy định theo `ProofProfile`. | Lưu ảnh vào `EvidenceAttempt` hiện hành kèm metadata (tọa độ, thời gian). | **NO_BUSINESS_AUDIT_REQUIRED** | CẤM ngụy tạo ảnh (`DR-HARD-04`); CẤM dùng ảnh chụp màn hình hoặc ảnh từ thư viện cũ; Manager CẤM chụp hộ. |
| **OP-13** | `CompleteChecklist` | Staff | Work Management | `ChecklistSnapshot` | `assignedStaffId == actor.userId` | `IN_PROGRESS`, `REWORK_REQUIRED`* | Tích chọn trung thực 100% các câu hỏi kiểm tra kỹ thuật ngoài hiện trường. | Cập nhật câu trả lời vào bản chụp checklist của task. | **NO_BUSINESS_AUDIT_REQUIRED** | CẤM bỏ trống câu hỏi bắt buộc; Nhân viên KHÔNG có quyền sửa mẫu checklist gốc; Manager CẤM sửa hộ. |
| **OP-14** | `RecordStructuredFindings` | Staff | Work Management | `StructuredFindings` | `assignedStaffId == actor.userId` | `IN_PROGRESS`, `REWORK_REQUIRED`* | Áp dụng cho task mang `INSPECTION_PROOF`; Nhập đầy đủ chỉ số độ nghiêng, mục rỗng, sâu bệnh. | Lưu dữ liệu khám bệnh có cấu trúc vào hồ sơ nghiệm thu. | **NO_BUSINESS_AUDIT_REQUIRED** | CẤM bỏ qua khi task là kiểm định; CẤM coi `TreeRiskStatus` là sự thay thế; Manager/Admin CẤM sửa hộ. |
| **OP-15** | `SubmitEvidence` | Staff | Work Management | `Task` | `assignedStaffId == actor.userId` | `IN_PROGRESS` | Hồ sơ bằng chứng đầy đủ 100% theo `ProofProfile`; Site Verification hoàn tất hoặc có giải trình. | Gửi hồ sơ; Khi server xác nhận thành công chuyển sang `WAITING_REVIEW`. | **AUDIT_REQUIRED** | Bấm nộp offline chỉ đổi `LocalSubmissionStatus = PENDING_SYNC`, server giữ `IN_PROGRESS` (`DR-TECH-01`). |
| **OP-16** | `ViewReviewQueue` | Manager | Work Management | Hàng đợi thẩm định | `AUTHORIZED_OPERATIONAL_SCOPE` | `WAITING_REVIEW` | Tác nhân có vai trò `manager` và trạng thái `ACTIVE`. | Trả về danh sách các nhiệm vụ đang chờ duyệt trong phạm vi quản lý; Không đổi trạng thái task. | **NO_BUSINESS_AUDIT_REQUIRED** | Staff CẤM truy cập; Admin CẤM truy cập; Thao tác xem hàng đợi KHÔNG làm thay đổi `TaskStatus`. |
| **OP-17** | `ReviewTask` | Manager | Work Management | `Task` & Bằng chứng | `AUTHORIZED_OPERATIONAL_SCOPE` | `WAITING_REVIEW` | Tồn tại hồ sơ nghiệm thu chờ duyệt; Tác nhân là Manager. | Mở xem chi tiết hồ sơ bằng chứng, định vị, checklist để chuẩn bị ra quyết định; Không đổi trạng thái task. | **NO_BUSINESS_AUDIT_REQUIRED** | Mở xem chi tiết thẩm định KHÔNG tự động chuyển trạng thái task; Staff CẤM tự xem xét duyệt việc. |
| **OP-18** | `ApproveTask` | Manager | Work Management | `ReviewDecision` | `AUTHORIZED_OPERATIONAL_SCOPE` | `WAITING_REVIEW` | Manager thẩm định đầy đủ chứng cứ và kết luận đạt tiêu chuẩn chất lượng. | Chuyển task sang `COMPLETED`, kích hoạt lập bản chiếu `CareHistory`. | **AUDIT_REQUIRED** | Staff CẤM tự duyệt (`DR-HARD-02`); Admin CẤM duyệt; CẤM duyệt tự động (`DR-POL-01`). |
| **OP-19** | `ApproveWithException` | Manager | Work Management | `ReviewDecision` | `AUTHORIZED_OPERATIONAL_SCOPE` | `WAITING_REVIEW` | Công việc đạt chuẩn nhưng có lỗi định vị/danh tính bất khả kháng; Bắt buộc có lý do giải trình. | Chuyển task sang `COMPLETED` (không tạo trạng thái mới), chiếu cờ ngoại lệ sang `CareHistory`. | **AUDIT_REQUIRED** | CẤM duyệt ngoại lệ mà không nhập văn bản giải trình trách nhiệm của Manager; Staff/Admin CẤM gọi lệnh. |
| **OP-20** | `RequestRework` | Manager | Work Management | `ReworkRequest` | `AUTHORIZED_OPERATIONAL_SCOPE` | `WAITING_REVIEW` | Phát hiện sai sót; Bắt buộc chỉ rõ khâu sai sót (`targetedKhau`) và hướng dẫn sửa. | Chuyển task sang `REWORK_REQUIRED`, mở phiên Attempt mới, bảo lưu chứng cứ cũ (`DR-HARD-03`). | **AUDIT_REQUIRED** | CẤM xóa bằng chứng cũ; CẤM bắt làm lại toàn bộ nếu chỉ sai sót 1 khâu nhỏ; Staff/Admin CẤM gọi lệnh. |
| **OP-21** | `ResubmitRework` | Staff | Work Management | `Task` | `assignedStaffId == actor.userId` | `REWORK_REQUIRED` | Đã chụp lại đầy đủ các khâu bằng chứng bị yêu cầu làm lại. | Chuyển task quay lại `WAITING_REVIEW` để Manager thẩm định lại phiên mới. | **AUDIT_REQUIRED** | CẤM nộp lại nếu chưa bổ sung ảnh/checklist tại khâu bị từ chối; Manager/Admin CẤM nộp thay. |
| **OP-22** | `ViewCareHistory` | Staff, Manager, Admin | Tree Asset Registry | Bản chiếu `CareHistory` | Staff: Cây được phân công; Manager: `AUTHORIZED_OPERATIONAL_SCOPE`; Admin: `PLATFORM_GOVERNANCE_SCOPE` | Mọi trạng thái (Dữ liệu lịch sử) | Cây tồn tại; Tác nhân đã xác thực trong phạm vi thẩm quyền. | Trả về dòng thời gian lịch sử chăm sóc/kiểm định của cây (chỉ sinh từ task `COMPLETED`). | **NO_BUSINESS_AUDIT_REQUIRED** | Quyền đọc CareHistory KHÔNG cấp quyền sửa đổi cây hay sửa đổi nhiệm vụ; Task `CANCELLED` không sinh lịch sử. |

### 8.2. Đặc tả Lệnh Quản Trị Nền Tảng (Governance Commands GV-01..GV-19 MVP):

*(19 lệnh quản trị MVP được ánh xạ từ 9 Admin capabilities đã chốt tại Phase 2)*

| Mã Lệnh | Tên Lệnh Chuẩn tắc | Tác nhân | Ngữ cảnh Sở hữu | Tài nguyên Mục tiêu | Phạm vi Tài nguyên (Resource Scope) | Trạng thái Cho phép | Điều kiện Tiên quyết (Preconditions) | Kết quả Nghiệp vụ (Outcome) | Yêu cầu Kiểm toán | Điều kiện Bị cấm Tuyệt đối (Forbidden Conditions) |
|---|---|---|---|---|---|---|---|---|:---:|---|
| **GV-01** | `ProvisionUser` | Admin | Identity & Access | `User` | `PLATFORM_GOVERNANCE_SCOPE` | N/A (Khởi tạo) | Email/Phone chưa tồn tại; Tác nhân là Platform Administrator. | Tạo bản ghi người dùng mới ở trạng thái `INVITED` hoặc `ACTIVE`. | **AUDIT_REQUIRED** | CẤM tự đăng ký tự do; CẤM tạo tài khoản ẩn danh; Manager/Staff CẤM gọi lệnh. |
| **GV-02** | `AssignRole` | Admin | Identity & Access | `RoleAssignment` | `PLATFORM_GOVERNANCE_SCOPE` | `ACTIVE` | Tài khoản đích đang `ACTIVE`; Vai trò yêu cầu thuộc `{'staff', 'manager', 'admin'}`. | Cập nhật vai trò, ghi dòng kiểm toán vai trò bất biến. | **AUDIT_REQUIRED** | Admin CẤM tự sửa vai trò của mình (`ADM-SOD-01`); Manager CẤM phân quyền; CẤM gán vai trò không hợp lệ. |
| **GV-03** | `ActivateAccount` | Admin | Identity & Access | `AccountStatus` | `PLATFORM_GOVERNANCE_SCOPE` | `INVITED`, `SUSPENDED` | Có quyết định phê duyệt nhân sự tiếp tục công tác. | Chuyển trạng thái sang `ACTIVE`, cấp phép đăng nhập và cấp token. | **AUDIT_REQUIRED** | CẤM kích hoạt tài khoản đã bị vô hiệu hóa vĩnh viễn (`DISABLED`). |
| **GV-04** | `SuspendAccount` | Admin | Identity & Access | `AccountStatus` | `PLATFORM_GOVERNANCE_SCOPE` | `ACTIVE` | Phát hiện vi phạm an ninh hoặc nhân sự nghỉ phép dài ngày; Có lý do văn bản. | Chuyển sang `SUSPENDED`, lập tức thu hồi phiên làm việc (Access Token). | **AUDIT_REQUIRED** | Khóa tài khoản KHÔNG tự động hủy task đang làm (Manager phải tự điều phối lại); CẤM xóa dữ liệu người dùng. |
| **GV-05** | `DisableAccount` | Admin | Identity & Access | `AccountStatus` | `PLATFORM_GOVERNANCE_SCOPE` | `ACTIVE`, `SUSPENDED` | Nhân sự chính thức chấm dứt hợp đồng lao động; Có quyết định thôi việc. | Chuyển trạng thái tài khoản sang `DISABLED` vĩnh viễn; Thu hồi toàn bộ quyền truy cập. | **AUDIT_REQUIRED** | CẤM xóa vật lý bản ghi người dùng; Lịch sử tác nghiệp và chữ ký tác giả trong quá khứ được giữ nguyên vẹn. |
| **GV-06** | `UnlockAccount` | Admin | Identity & Access | `Account` | `PLATFORM_GOVERNANCE_SCOPE` | Bị khóa tạm thời | Xác minh chính chủ gặp sự cố đăng nhập sai mật khẩu vượt ngưỡng cho phép. | Xóa cờ khóa tạm thời, gửi mã/liên kết đặt lại mật khẩu một lần an toàn. | **AUDIT_REQUIRED** | CẤM mở khóa khi chưa xác minh đúng danh tính người yêu cầu; Manager CẤM gọi lệnh. |
| **GV-07** | `RecoverAccount` | Admin | Identity & Access | `Account` | `PLATFORM_GOVERNANCE_SCOPE` | `ACTIVE`, `SUSPENDED` | Nhận yêu cầu khôi phục quyền truy cập hợp lệ từ nhân sự bị mất thiết bị/quên mật khẩu. | Tạo liên kết khôi phục tài khoản bảo mật có thời hạn gửi trực tiếp đến kênh liên lạc chính thức. | **AUDIT_REQUIRED** | CẤM gửi thông tin khôi phục qua kênh không định danh; CẤM khôi phục tài khoản `DISABLED`. |
| **GV-08** | `ViewAuditLog` | Admin | Audit & Compliance | `AuditEvent` | `PLATFORM_GOVERNANCE_SCOPE` | N/A (Chỉ đọc) | Tác nhân có vai trò Platform Administrator đang `ACTIVE`. | Hiển thị danh sách các bản ghi sự kiện kiểm toán bất biến. | **AUDIT_REQUIRED** | Admin CẤM chỉnh sửa hoặc xóa bất kỳ dòng kiểm toán nào (`ADM-SOD-03`); Manager/Staff CẤM đọc nhật ký kiểm toán. |
| **GV-09** | `FilterAuditLog` | Admin | Audit & Compliance | `AuditEvent` | `PLATFORM_GOVERNANCE_SCOPE` | N/A (Chỉ đọc) | Tác nhân có vai trò Platform Administrator đang `ACTIVE`; Bộ lọc hợp lệ (theo thời gian, tác nhân, tài nguyên). | Trả về danh sách sự kiện kiểm toán theo tiêu chí lọc chính xác. | **AUDIT_REQUIRED** | CẤM bộ lọc vượt quá phạm vi thẩm quyền; Thao tác lọc kiểm toán được ghi nhật ký giám sát. |
| **GV-10** | `CreateTree` | Admin | Tree Asset Registry | `Tree` | `PLATFORM_GOVERNANCE_SCOPE` | N/A (Khởi tạo) | `treeId` và `qrCode` chưa tồn tại trong hệ thống; Tọa độ GPS chuẩn hợp lệ. | Tạo bản ghi tài sản cây xanh mới trong sổ bộ Master Data. | **AUDIT_REQUIRED** | Manager hoặc Staff CẤM tự ý tạo mới cây xanh vào Master Data. |
| **GV-11** | `UpdateTreeMasterData` | Admin | Tree Asset Registry | `TreeMasterData` | `PLATFORM_GOVERNANCE_SCOPE` | Đang sinh trưởng | Bắt buộc nhập lý do điều chỉnh thuộc tính cây; Lưu vết người sửa và thời điểm. | Cập nhật chiều cao, đường kính, chủng loại cây trong Master Data; `treeId` giữ bất biến. | **AUDIT_REQUIRED** | Cập nhật Master Data KHÔNG được ghi đè tọa độ thực tế của các task cũ. |
| **GV-12** | `ReplaceTreeQrCode` | Admin | Tree Asset Registry | `TreeIdentity` | `PLATFORM_GOVERNANCE_SCOPE` | Đang sinh trưởng | Tem QR vật lý cũ bị rách/mờ/mất; Mã QR mới là duy nhất; Bắt buộc có lý do. | Cập nhật `qrCode` trong Master Data; Lưu vết kiểm toán cấp đổi tem. | **AUDIT_REQUIRED** | CẤM đổi `treeId`; KHÔNG làm thay đổi kết quả quét QR trong các task cũ (`P3-SC-03`). |
| **GV-13** | `UpdateCanonicalCoordinates` | Admin | Tree Asset Registry | `TreeMasterData` | `PLATFORM_GOVERNANCE_SCOPE` | Đang sinh trưởng | Có kết quả đo đạc trắc địa chuẩn xác mới; Có biên bản nghiệm thu tọa độ chuẩn. | Cập nhật tọa độ chuẩn (kinh độ, vĩ độ) của cây trong Master Data; Giữ nguyên `treeId`. | **AUDIT_REQUIRED** | CẤM sửa đổi tọa độ thực tế đã đo tại hiện trường trong các task đã đóng (`SiteVerification`). |
| **GV-14** | `RetireTree` | Admin | Tree Asset Registry | `Tree` | `PLATFORM_GOVERNANCE_SCOPE` | Đang sinh trưởng | Cây đã bị đốn hạ, chết hoặc di dời vĩnh viễn; Có biên bản thanh lý tài sản. | Chuyển trạng thái cây sang `RETIRED`, ngăn chặn khởi tạo task mới cho cây này. | **AUDIT_REQUIRED** | CẤM xóa vật lý dữ liệu cây; Toàn bộ lịch sử chăm sóc (`CareHistory`) được lưu trữ vĩnh viễn. |
| **GV-15** | `CreateTaskType` | Admin | Policy Governance | `TaskTypeCatalog` | `PLATFORM_GOVERNANCE_SCOPE` | N/A (Khởi tạo) | `TaskTypeId` chưa tồn tại; Gắn kèm hồ sơ bằng chứng chuẩn `ProofProfile`. | Thêm loại việc mới vào danh mục với trạng thái ban đầu là `ACTIVE`. | **AUDIT_REQUIRED** | CẤM Manager tự gõ loại việc ngoài danh mục; CẤM tạo loại việc thiếu ProofProfile. |
| **GV-16** | `ActivateTaskType` | Admin | Policy Governance | `TaskTypeCatalog` | `PLATFORM_GOVERNANCE_SCOPE` | `INACTIVE` | Có quyết định khôi phục áp dụng loại công việc. | Chuyển trạng thái sang `ACTIVE` cho phép Manager chọn khi giao việc. | **AUDIT_REQUIRED** | CẤM kích hoạt nếu chưa cấu hình xong mẫu checklist hoặc chính sách bằng chứng. |
| **GV-17** | `DeactivateTaskType` | Admin | Policy Governance | `TaskTypeCatalog` | `PLATFORM_GOVERNANCE_SCOPE` | `ACTIVE` | Không còn nhu cầu áp dụng loại việc; Có quyết định ngưng công tác. | Chuyển sang `INACTIVE`, ẩn khỏi menu chọn của Manager, CẤM xóa vật lý. | **AUDIT_REQUIRED** | CẤM xóa cứng TaskType nếu đã có nhiệm vụ trong quá khứ tham chiếu đến. |
| **GV-18** | `PublishProofPolicyVersion` | Admin | Policy Governance | `ProofPolicyMapping` | `PLATFORM_GOVERNANCE_SCOPE` | N/A (Ban hành) | Đánh số phiên bản mới (`PolicyVersion`); Có lý do giải trình thay đổi chính sách. | Ban hành quy tắc ánh xạ mới cho các task tương lai, lưu cố định `policyVersionId`. | **AUDIT_REQUIRED** | CẤM áp dụng hồi tố lên task cũ; Manager CẤM hạ cấp profile của từng task. |
| **GV-19** | `PublishChecklistTemplateVersion` | Admin | Policy Governance | `ChecklistTemplate` | `PLATFORM_GOVERNANCE_SCOPE` | N/A (Ban hành) | Đánh số phiên bản mẫu mới (`TemplateVersion`); Có nội dung tiêu chí hoàn chỉnh. | Ban hành phiên bản checklist mới cho các task chuyển sang `IN_PROGRESS` tương lai. | **AUDIT_REQUIRED** | CẤM làm thay đổi nội dung checklist của các task đang chạy hoặc chờ duyệt. |

### 8.3. Danh sách Hành vi Bị Khóa trong MVP (`NEXT` & `REJECTED`):
- **GV-20 `ManageDynamicFindingsTemplate`**: Trạng thái **`NEXT`** (CAP-ADM-10). Tác nhân: Mọi tác nhân đều bị **`DENY`**. Lý do từ chối: `CAPABILITY_NOT_IN_MVP`.
- **GV-21 `UseBreakGlass`**: Trạng thái **`NEXT`** (CAP-ADM-11). Tác nhân: Mọi tác nhân đều bị **`DENY`**. Lý do từ chối: `CAPABILITY_NOT_IN_MVP`.
- **GV-22 `ManagePlatformSystemConfig`**: Trạng thái **`REJECTED`** (CAP-ADM-13). Tác nhân: Mọi tác nhân đều bị **`DENY`**. Lý do từ chối: `ACTION_REJECTED_BY_PRODUCT_MODEL`.

---

## 9. Ma Trận Đối Soát Độ Bao Phủ Thẩm Quyền (Coverage Oracle Table)

Bảng đối soát đảm bảo **100% các hành vi có giá trị `ALLOW`** (Operational, Governance, và System) đều sở hữu bản đặc tả đầy đủ 11 thành tố cấu thành:

| Nhóm Lệnh / Hành vi | Mã Hành vi | Tác nhân `ALLOW` | Đã có Bản Đặc tả? | Phạm vi Xác định? | Trạng thái Xác định? | Tiên quyết Đầy đủ? | Đánh giá Bao phủ |
|---|:---:|---|:---:|:---:|:---:|:---:|:---:|
| **Operational** | OP-01 | Field Staff, Operations Manager | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-02 | Operations Manager | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-03 | Operations Manager | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-04 | Operations Manager | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-05 | Field Staff | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-06 | Field Staff, System | **CÓ** (Mục 8.1, 3.2) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-07 | Field Staff, System | **CÓ** (Mục 8.1, 3.2) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-08 | Field Staff | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-09 | Operations Manager | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-10 | Operations Manager | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-11 | Operations Manager | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-12 | Field Staff | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-13 | Field Staff | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-14 | Field Staff | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-15 | Field Staff, System | **CÓ** (Mục 8.1, 3.2) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-16 | Operations Manager | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-17 | Operations Manager | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-18 | Operations Manager | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-19 | Operations Manager | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-20 | Operations Manager | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-21 | Field Staff, System | **CÓ** (Mục 8.1, 3.2) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Operational** | OP-22 | Staff, Manager, Admin | **CÓ** (Mục 8.1) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Governance** | GV-01..19 | Platform Administrator | **CÓ** (Mục 8.2) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |
| **Governance** | GV-20..22 | *Không có tác nhân ALLOW* | N/A (Khóa MVP) | N/A | N/A | N/A | **PASS (Khóa đúng)** |
| **System Auto** | SYS-01..06 | System | **CÓ** (Mục 3.2) | **CÓ** | **CÓ** | **CÓ** | **PASS (100%)** |

---

## 10. Phân Tách Quyền Hạn Xuyên Ngữ Cảnh (Cross-Context Authorization Rules)

Ngăn chặn triệt để tình trạng một ngữ cảnh tự ý xâm lấn và làm đột biến dữ liệu của ngữ cảnh khác:

1. **Khóa Tài Khoản Nhân Sự Không Tự Ý Hủy Nhiệm Vụ (IAM $\to$ Work Management)**:
   - Khi Admin thực hiện `SuspendAccount` hoặc `DisableAccount` đối với một Nhân viên hiện trường, ngữ cảnh IAM **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** tự động đổi trạng thái các task đang giao cho người đó sang `CANCELLED`.
   - Vụ việc được phản ánh thành dữ liệu cảnh báo khả dụng; Quản lý vận hành (Manager) trong `Work Management` là người duy nhất nắm thẩm quyền ra quyết định điều phối lại (`ReassignTask`) hoặc hủy việc (`CancelTask`) có kiểm toán.
2. **Cập Nhật Master Data Không Ghi Đè Dữ Liệu Thực Địa Lịch Sử (TAR $\to$ Work Management)**:
   - Khi Admin cấp đổi mã `qrCode` hoặc đo đạc lại tọa độ chuẩn trong `Tree Asset Registry`, hành động này **TUYỆT ĐỐI KHÔNG ĐƯỢC** cập nhật đè lên trường tọa độ GPS thực tế hoặc mã QR đã quét trong các bản ghi `SiteVerification` của các task đã hoàn thành trong quá khứ.
3. **Ban Hành Chính Sách Không Hồi Tố Lên Hợp Đồng Bằng Chứng Cũ (Policy $\to$ Work Management)**:
   - Khi Admin ban hành `PolicyVersion` mới với yêu cầu bằng chứng ngặt nghèo hơn, các task đang chạy hoặc đã đóng bảo lưu nguyên vẹn `policyVersionId` lúc khởi tạo, cấm mọi hành vi bắt nộp thêm bằng chứng hồi tố.

---

## 11. Ghi Nhận Khoảng Trống Hiện Thực Hóa Hiện Tại (Current Implementation Gap Register)

> **Lưu ý kiểm soát phạm vi**: Bảng này phục vụ ghi nhận các khiếm khuyết trong mã nguồn hiện hành để đối soát kỹ thuật. **TUYỆT ĐỐI KHÔNG SỬA CODE TẠI PHASE 4**. Toàn bộ việc sửa đổi mã nguồn và hợp đồng kỹ thuật được ấn định thực hiện tại **Giai đoạn Hiện thực hóa sau khi chấp thuận Kiến trúc ADR (Post-ADR Implementation)**.

| STT | Tập tin Nguồn (File) | Ký hiệu / Dòng mã (Symbol / Line) | Hành vi Hiện tại trong Mã nguồn (Current Defect) | Quy tắc Chuẩn tắc Cần Đạt (Target Rule) | Giai đoạn Khắc phục Ấn định |
|:---:|---|---|---|---|:---:|
| 1 | `apps/mobile/src/services/greenOpsService.ts` | Dòng 349: `mapSessionRole` | Co ép mọi tài khoản không phải `staff` thành `Manager` (`session.user.role === 'staff' ? 'Staff' : 'Manager'`), làm Admin biến thành Manager. | Tách bạch 3 role độc lập: `staff`, `manager`, `admin`. Admin bị từ chối truy cập luồng Manager. | Post-ADR Implementation / Auth Refactor |
| 2 | `apps/mobile/src/screens/MobileApp.tsx` | Dòng 274: `const isStaff = role === 'Staff';` | Co ép nhị phân: coi `!isStaff` đồng nghĩa là Manager, dẫn đến Admin đăng nhập sẽ nhìn thấy giao diện duyệt việc của Manager. | Thiết lập giao diện và bộ điều hướng riêng biệt cho 3 role; Admin không dùng chung màn hình Manager. | Post-ADR Implementation / Mobile UI Routing |
| 3 | `packages/contracts/src/index.ts` | Dòng 54-60: `TaskStatus` enum | Thiếu vắng 2 trạng thái cốt lõi: `BLOCKED` và `CANCELLED` (chỉ có 5 trạng thái). | Bổ sung đầy đủ 7 trạng thái vòng đời tất định của Task theo chuẩn `DR-MVP-03`. | Post-ADR Implementation / Contract Alignment |
| 4 | `apps/mobile/src/services/greenOpsService.ts` | Dòng 418: `createTask` | Hàm nhận `fallbackTask` và thêm vào danh sách mà không kiểm tra quyền của người gọi (Role Guard) hay kiểm tra phạm vi tài nguyên. | Bắt buộc kiểm tra quyền Manager, trạng thái cây và tính hợp lệ của loại việc trước khi tạo task. | Post-ADR Implementation / Service Layer |
| 5 | `apps/mobile/src/screens/TaskListScreen.tsx` | Giao diện danh sách việc | Chỉ dựa vào việc ẩn/hiện nút bấm ngoài giao diện để phân quyền, thiếu cơ chế guard kiểm soát tại tầng dịch vụ. | Bổ sung lớp kiểm soát phân quyền 4 thành tố độc lập với tầng trình diễn UI. | Post-ADR Implementation / Action Eligibility Guard |

---

## 12. Thử Nghiệm Phủ Định Phân Quyền Nghiệp Vụ (Negative Authorization Tests)

### 12.1. Bộ thử nghiệm phủ định ban đầu (AUTH-NT-01..18):

| Mã Ca Kiểm Thử | Kịch bản Sai phạm Giả định | Kết quả Mong đợi | Đánh giá Thực tế trong Mô hình Phase 4 | Kết luận |
|---|---|:---:|---|:---:|
| **AUTH-NT-01** | Staff tự bấm phê duyệt (`ApproveTask`) nhiệm vụ do chính mình thực hiện. | **`DENY`** | Bác bỏ bởi `DR-HARD-02` và Mục 4 (`OP-18`). Staff bị DENY 100% trên lệnh Approve. | **PASS** |
| **AUTH-NT-02** | Manager gọi API phân quyền để gán role `admin` cho một người dùng khác. | **`DENY`** | Bác bỏ bởi Mục 7 (`GV-02`) và `ADM-SOD-05`. Manager hoàn toàn không có quyền `AssignRole`. | **PASS** |
| **AUTH-NT-03** | Platform Administrator bấm duyệt (`ApproveTask`) nhiệm vụ vận hành hiện trường. | **`DENY`** | Bác bỏ bởi Mục 4 (`OP-18`) và `ADM-SOD-04`. Admin bị DENY 100% trên mọi tác vụ vận hành thường nhật. | **PASS** |
| **AUTH-NT-04** | Platform Administrator gọi lệnh tạo việc mới (`CreateTask`) ngoài hiện trường. | **`DENY`** | Bác bỏ bởi Mục 4 (`OP-03`) và Mục 8. Quyền khởi tạo việc thuộc độc quyền của Operations Manager. | **PASS** |
| **AUTH-NT-05** | Tác nhân tự động (`System`) tự động nâng quyền một Staff lên làm Admin. | **`DENY`** | Bác bỏ bởi `ADM-SOD-06` và Ma trận System Mục 3. System cấm tự phong quyền cho con người. | **PASS** |
| **AUTH-NT-06** | Field Staff gửi lệnh chỉnh sửa tọa độ chuẩn của cây trên bản đồ Master Data. | **`DENY`** | Bác bỏ bởi Mục 7 (`GV-13`). Staff chỉ được đo GPS tại task, không có quyền sửa Master Data. | **PASS** |
| **AUTH-NT-07** | Operations Manager tự ý hạ cấp `ProofProfile` của một nhiệm vụ đơn lẻ. | **`DENY`** | Bác bỏ bởi `DR-MVP-02` và Mục 8 (`OP-03`). Ánh xạ ProofProfile do Admin quản trị tập trung. | **PASS** |
| **AUTH-NT-08** | Staff A bấm bắt đầu (`StartTask`) trên nhiệm vụ được giao cho Staff B. | **`DENY`** | Bác bỏ bởi Mục 8 (`OP-05`). Vi phạm kiểm tra phạm vi tài nguyên (`assignedStaffId != actor.userId`). | **PASS** |
| **AUTH-NT-09** | Thao tác mở màn hình chi tiết công việc tự động chuyển `PENDING` $\to$ `IN_PROGRESS`. | **`DENY`** | Bác bỏ bởi `DR-MVP-04` và Mục 8 (`OP-05`). DUY NHẤT hành động bấm nút StartTask mới được chuyển trạng thái. | **PASS** |
| **AUTH-NT-10** | Thao tác đo GPS thành công tự động làm thay đổi `TaskStatus`. | **`DENY`** | Bác bỏ bởi `SiteVerification` invariant và Mục 8 (`OP-06`). Xác thực GPS độc lập với vòng đời task. | **PASS** |
| **AUTH-NT-11** | Platform Administrator thực hiện sửa đổi nội dung một dòng nhật ký kiểm toán. | **`DENY`** | Bác bỏ bởi `ADM-SOD-03` và Mục 7 (`GV-08`). Audit Log là Append-Only, Admin bị DENY 100% trên edit/delete. | **PASS** |
| **AUTH-NT-12** | Quản lý thực hiện chuyển việc (`ReassignTask`) khi task đang ở `WAITING_REVIEW`. | **`DENY`** | Bác bỏ bởi `DR-HARD-06` và Mục 5 (Ma trận trạng thái). Task chờ duyệt cấm đổi nhân sự. | **PASS** |
| **AUTH-NT-13** | Quản lý hoặc Admin gọi lệnh mở lại nhiệm vụ đã ở trạng thái `COMPLETED`. | **`DENY`** | Bác bỏ bởi `DR-HARD-05` và Mục 5. Nhiệm vụ đóng là bất biến vĩnh viễn, cấm mở lại. | **PASS** |
| **AUTH-NT-14** | Nhiệm vụ bị hủy (`CANCELLED`) tự động sinh bản ghi lịch sử trong `CareHistory`. | **`DENY`** | Bác bỏ bởi `DR-HARD-07` và Mục 8 (`OP-11`). DUY NHẤT task `COMPLETED` mới được sinh CareHistory. | **PASS** |
| **AUTH-NT-15** | Giả định Findings Template là NEXT đồng nghĩa Staff không được ghi Structured Findings. | **`DENY`** | Bác bỏ bởi `SC-01` và Mục 6, Mục 8 (`OP-14`). Staff bắt buộc thu thập Structured Findings theo Fixed Schema. | **PASS** |
| **AUTH-NT-16** | Tác nhân sử dụng quyền mở khóa ngoại lệ (`UseBreakGlass`) trong phạm vi bản MVP. | **`DENY`** | Bác bỏ bởi Mục 7 (`GV-21`). Break-Glass là tính năng `NEXT`, hoàn toàn bị khóa tại MVP. | **PASS** |
| **AUTH-NT-17** | Màn hình quản trị hiển thị mục cấu hình hạ tầng/server/secrets (`GV-22`). | **`DENY`** | Bác bỏ bởi Mục 7 (`GV-22`). Tính năng thuộc `REJECTED`, bị loại bỏ hoàn toàn khỏi mô hình sản phẩm. | **PASS** |
| **AUTH-NT-18** | Thao tác bấm nộp bằng chứng offline tự động chuyển `TaskStatus` trên server sang `WAITING_REVIEW`. | **`DENY`** | Bác bỏ bởi `DR-TECH-01` và Mục 8 (`OP-15`). Nộp offline chỉ đổi cờ cục bộ; server giữ nguyên `IN_PROGRESS`. | **PASS** |

### 12.2. Bộ thử nghiệm phủ định bổ sung — Semantic Closure Tests (P4-SC-NT-01..09):

| Mã Ca Kiểm Thử | Kịch bản Sai phạm Ngữ nghĩa Giả định | Kết quả Mong đợi | Đánh giá Thực tế trong Mô hình Phase 4 Closure | Kết luận |
|---|---|:---:|---|:---:|
| **P4-SC-NT-01** | Nhân viên tại `REWORK_REQUIRED` gọi lệnh `ReportFieldIssue` và task tự động chuyển sang `BLOCKED`. | **`DENY`** | Khóa dứt điểm bởi Ma trận Mục 5 và Mục 8 (`OP-08`). `REWORK_REQUIRED -> BLOCKED` không tồn tại trong vòng đời chuẩn. | **PASS** |
| **P4-SC-NT-02** | Nhiệm vụ ở trạng thái `PENDING` bị cấm điều chuyển phân công nhân sự (`ReassignTask`). | **`FAIL` (Giả định sai)** | Bác bỏ bởi Mục 5 và Mục 8 (`OP-10 Case A`). Phân công lại tại `PENDING` là hành vi hợp lệ chuẩn tắc của Manager. | **PASS** |
| **P4-SC-NT-03** | Tồn tại một lệnh được đánh nhãn `ALLOW` nhưng thiếu định nghĩa Resource Scope hoặc Preconditions. | **`FAIL` (Giả định sai)** | Bác bỏ bởi Ma trận đối soát Mục 9. 100% các lệnh ALLOW (OP, GV, System) đều có đặc tả đầy đủ. | **PASS** |
| **P4-SC-NT-04** | Các lệnh quản trị `GV-05`, `GV-07`, `GV-09`, `GV-13`, `GV-14` là `ALLOW` nhưng không có bảng đặc tả. | **`FAIL` (Giả định sai)** | Bác bỏ bởi Mục 8.2. Toàn bộ 19 lệnh quản trị MVP `GV-01..19` đều đã được chuẩn hóa đặc tả chi tiết. | **PASS** |
| **P4-SC-NT-05** | 19 lệnh quản trị nền tảng MVP bị đánh đồng và gọi sai thành "19 Admin capabilities". | **`FAIL` (Giả định sai)** | Khóa chính xác tại Mục 7 & 8: "19 lệnh quản trị MVP được ánh xạ từ 9 Admin capabilities MVP". | **PASS** |
| **P4-SC-NT-06** | Hợp đồng `TaskStatus` trong mã nguồn được chỉnh sửa trực tiếp ngay trong Phase 6. | **`FAIL` (Giả định sai)** | Khóa chuẩn mực tại Mục 11: Phase 6 chỉ đồng bộ canonical docs; sửa mã nguồn thuộc Post-ADR Implementation. | **PASS** |
| **P4-SC-NT-07** | Mã nguồn phân quyền và UI được tái cấu trúc ngay trong Phase 11 (Kiến trúc ADR). | **`FAIL` (Giả định sai)** | Khóa chuẩn mực tại Mục 11: Phase 11 là kiến trúc/ADR; sửa code diễn ra tại Post-ADR Implementation. | **PASS** |
| **P4-SC-NT-08** | Phân quyền của Operations Manager phụ thuộc vào một trường địa lý bịa đặt (`regionId`, `districtId`). | **`FAIL` (Giả định sai)** | Khóa chuẩn mực tại Mục 1.1: Sử dụng phạm vi trừu tượng `AUTHORIZED_OPERATIONAL_SCOPE`, hoãn cơ chế phân vùng. | **PASS** |
| **P4-SC-NT-09** | Thao tác mở xem hồ sơ thẩm định (`ReviewTask`) tự động làm biến đổi `TaskStatus`. | **`DENY`** | Khóa tại Mục 8.1 (`OP-17`): `ReviewTask` là thao tác đọc chuẩn bị; chỉ các lệnh quyết định mới làm đổi trạng thái. | **PASS** |

---

## 13. Bảng Bằng Chứng Nghiệm Thu Cổng Phase 4 (Phase 4 Evidence & Closure Tables)

### 13.1. Bảng nghiệm thu 12 tiêu chí chất lượng cốt lõi (P4-01..P4-12):

| Gate ID | Tiêu chí Nghiệm thu (Requirement) | Phương pháp Xác minh (Verification Method) | Căn cứ Bằng chứng Cụ thể (Concrete Evidence) | Tính Chặn (Blocking) | Kết quả Nghiệm thu (Result) |
|---|---|---|---|:---:|:---:|
| **P4-01** | Mọi lệnh nghiệp vụ đều xác định rõ tác nhân thực hiện | Actor Identification Audit | Mục 4 & Mục 7: 100% các lệnh `OP-01..22` và `GV-01..22` đều gắn với tác nhân cụ thể. | **YES** | **PASS** |
| **P4-02** | Mọi lệnh nghiệp vụ đều xác định rõ tài nguyên mục tiêu | Resource Target Verification | Bảng Mục 8: Từng lệnh quy định rõ tài nguyên (`Task`, `SiteVerification`, `User`, `Tree`, `Catalog`). | **YES** | **PASS** |
| **P4-03** | Mọi lệnh phụ thuộc trạng thái đều xác định trạng thái hợp lệ | State Dependency Audit | Ma trận Mục 5: 100% các hành vi tác nghiệp đều đối soát chi tiết trên 7 trạng thái của Task. | **YES** | **PASS** |
| **P4-04** | Mọi lệnh đều có điều kiện tiên quyết nghiệp vụ rõ ràng | Business Preconditions Check | Bảng Mục 8 & Mục 9: Cột *Điều kiện Tiên quyết* quy định cụ thể các ràng buộc nghiệp vụ cho từng lệnh. | **YES** | **PASS** |
| **P4-05** | Mọi ranh giới cấm đều được tuyên ngôn minh bạch | Forbidden Conditions Audit | Bảng Mục 8: Cột *Điều kiện Bị cấm Tuyệt đối* chỉ rõ các hành vi bị chặn đứng kèm mã luật DR. | **YES** | **PASS** |
| **P4-06** | Ma trận phân quyền Field Staff hoàn chỉnh | Staff Permission Inspection | Mục 4 & Mục 8.1: Phân định chi tiết toàn bộ các quyền xem, bắt đầu, đo đạc, chụp ảnh và nộp việc của Staff. | **YES** | **PASS** |
| **P4-07** | Ma trận phân quyền Operations Manager hoàn chỉnh | Manager Permission Inspection | Mục 4 & Mục 8.1: Phân định rõ quyền tạo việc, giao việc, xử lý sự cố, hủy việc và 4 kết luận duyệt của Manager. | **YES** | **PASS** |
| **P4-08** | Ma trận phân quyền Platform Administrator hoàn chỉnh | Admin Governance Audit | Mục 7 & Mục 8.2: Phân định rõ 19 lệnh quản trị MVP (`GV-01..19`), khóa cứng 2 lệnh NEXT và 1 lệnh REJECTED. | **YES** | **PASS** |
| **P4-09** | Admin không có quyền can thiệp vận hành thực địa mặc định | Anti-Superuser Inheritance Check | Mục 4 & Mục 12 (AUTH-NT-03..04): Admin bị DENY 100% trên `CreateTask`, `AssignTask`, `ApproveTask`. | **YES** | **PASS** |
| **P4-10** | Manager không có quyền quản trị người dùng và vai trò mặc định | Anti-Governance Spillover Check | Mục 7 & Mục 12 (AUTH-NT-02): Manager bị DENY 100% trên `ProvisionUser`, `AssignRole`, `SuspendAccount`. | **YES** | **PASS** |
| **P4-11** | Quyền can thiệp khẩn cấp (Break-Glass) nằm ngoài MVP | Emergency Exception Isolation Audit | Mục 7 (`GV-21`) & Mục 12 (AUTH-NT-16): Break-Glass được phân loại `NEXT`, cấm kích hoạt tại MVP. | **YES** | **PASS** |
| **P4-12** | Phân tách rạch ròi giữa thẩm quyền Đọc và thẩm quyền Ghi | Read vs Mutate Separation Audit | Mục 1.2 & Bảng Mục 8: Phân biệt rõ thẩm quyền xem (Read-Only) không suy diễn thành quyền can thiệp (Mutate). | **YES** | **PASS** |

### 13.2. Bảng nghiệm thu 5 hạng mục khiếm khuyết ngữ nghĩa Phase 4 (P4-SC-01..P4-SC-05):

| Mã Khiếm khuyết | Tên Khiếm khuyết Ngữ nghĩa (Defect) | Căn cứ Khắc phục Cụ thể (Concrete Resolution Evidence) | Kết quả Đối soát (Result) |
|:---:|---|---|:---:|
| **P4-SC-01** | `ReportFieldIssue` xung đột vòng đời (`REWORK_REQUIRED -> BLOCKED`) | Đã sửa Ma trận Mục 5 (`REWORK_REQUIRED = DENY`) và Mục 8.1 (`OP-08` chỉ hợp lệ tại `IN_PROGRESS`). Bảo lưu tuyệt đối quy trình chuẩn tắc `docs/WORKFLOWS.md`. | **PASS** |
| **P4-SC-02** | `ReassignTask` bất nhất giữa Ma trận trạng thái và Bảng đặc tả | Đã chuẩn hóa Mục 8.1 (`OP-10`) hỗ trợ đầy đủ cả 2 trường hợp chuẩn tắc: Case A (`PENDING`) và Case B (`BLOCKED`), cấm điều chuyển tại các trạng thái khác. | **PASS** |
| **P4-SC-03** | Thiếu hụt bảng đặc tả cho các lệnh `ALLOW` (Read, Governance, System) | Đã bổ sung đặc tả đầy đủ 11 cột cho toàn bộ `OP-01..22`, `GV-01..19` và bảng hoạt động `SYS-01..06`. Bảng Mục 9 xác nhận độ bao phủ đạt 100%. | **PASS** |
| **P4-SC-04** | Ghi sai mốc phase khắc phục mã nguồn trong Gap Register | Đã điều chỉnh toàn bộ 5 dòng tại Mục 11 sang mốc `Post-ADR Implementation`, làm rõ Phase 6 chỉ đồng bộ tài liệu canonical và Phase 11 là kiến trúc ADR. | **PASS** |
| **P4-SC-05** | Tự ý đưa vào các từ vựng phân cấp địa lý chưa được mô hình hóa | Đã chuẩn hóa toàn bộ về `AUTHORIZED_OPERATIONAL_SCOPE` và `PLATFORM_GOVERNANCE_SCOPE`, loại bỏ hoàn toàn các từ "toàn vùng", "toàn đô thị", hoãn cơ chế phân vùng. | **PASS** |

---

## 14. Kết Luận Khóa Đóng Cổng Phase 4 (Phase 4 Semantic Closure Exit Gate)

```text
================================================================================
PHASE 4 PASS — SEMANTICALLY CLOSED
— CANONICAL TASK TRANSITIONS PRESERVED
— REASSIGNMENT ELIGIBILITY RECONCILED
— ALL ALLOW ACTIONS HAVE COMPLETE SPECIFICATIONS
— IMPLEMENTATION PHASE BOUNDARIES CORRECTED
— RESOURCE SCOPE TERMINOLOGY NORMALIZED
— READY FOR PHASE 5 WORKFLOW OPTIMIZATION
================================================================================
```
