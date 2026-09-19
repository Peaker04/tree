# NOVYX GreenOps — Authorization & Action Eligibility Model (Phase 4)

> **Tài liệu chuẩn mực phân quyền nghiệp vụ và điều kiện kích hoạt hành động**
> Thuộc chu trình: **Business Baseline Reconciliation — Phase 4**.
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

### Định nghĩa 4 thành tố:
1. **ACTOR ROLE (Vai trò tác nhân)**:
   - Lớp tác nhân thực hiện lệnh, thuộc tập hợp 3 vai trò người dùng chuẩn tắc: `staff` (Field Staff - Nhân viên hiện trường), `manager` (Operations Manager - Quản lý vận hành), `admin` (Platform Administrator - Quản trị hệ thống), hoặc tác nhân tự động hóa kỹ thuật `System`.
   - *Nguyên tắc bất biến*: Vai trò đơn thuần **KHÔNG PHẢI** là điều kiện đủ để hành động (`Role Alone != Sufficient Authorization`).
2. **RESOURCE SCOPE (Phạm vi tài nguyên)**:
   - Thẩm quyền trên thực thể dữ liệu cụ thể mà tác nhân được phép thao tác.
   - Ví dụ: Field Staff chỉ được thao tác trên nhiệm vụ có `task.assignedStaffId == actor.userId`; Operations Manager chỉ thao tác trên nhiệm vụ thuộc phạm vi quản lý vận hành được ủy quyền (`AUTHORIZED_OPERATIONAL_SCOPE`).
3. **DOMAIN STATE (Trạng thái miền dữ liệu)**:
   - Trạng thái vòng đời hiện hành của thực thể mục tiêu cho phép lệnh được kích hoạt.
   - Ví dụ: Lệnh `StartTask` chỉ hợp lệ duy nhất khi trạng thái là `PENDING`; Lệnh `Approve` chỉ hợp lệ duy nhất khi trạng thái là `WAITING_REVIEW`.
4. **BUSINESS PRECONDITIONS (Điều kiện tiên quyết nghiệp vụ)**:
   - Các dữ kiện nghiệp vụ bắt buộc phải thỏa mãn trước khi chấp thuận thực thi lệnh (ví dụ: khoảng cách GPS $\le 10$m hoặc có lý do ngoại lệ, checklist đã tích đủ, ảnh chụp đã tải lên đủ theo ProofProfile).

### Các nguyên tắc phân định cốt lõi:
- **Phân quyền $\mathbf{\ne}$ Ẩn hiện nút giao diện (Authorization $\mathbf{\ne}$ UI Visibility)**: Ẩn nút trên màn hình chỉ là trải nghiệm người dùng (UX), không thay thế được luật kiểm soát an ninh tại tầng nghiệp vụ.
- **Quyền Đọc $\mathbf{\ne}$ Quyền Ghi (READ $\mathbf{\ne}$ MUTATE)**: Thẩm quyền đọc dữ liệu (ví dụ: Admin đọc CareHistory, Manager đọc danh mục cây) tuyệt đối không suy diễn thành quyền can thiệp hay duyệt việc ngoài hiện trường.
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
- **`AUDIT_REQUIRED`**: Bắt buộc sinh bản ghi sự kiện kiểm toán (`AuditEvent`) bất biến lưu vào kho nhật ký (áp dụng cho toàn bộ lệnh quản trị của Admin, quyết định thẩm định, thay đổi vai trò, hủy việc, cấp đổi mã QR).
- **`AUDIT_RECOMMENDED`**: Khuyến nghị lưu vết phục vụ phân tích vận hành (ví dụ: báo cáo sự cố hiện trường, kích hoạt ngoại lệ).
- **`NO_BUSINESS_AUDIT_REQUIRED`**: Không yêu cầu kiểm toán nghiệp vụ (các thao tác đọc dữ liệu thông thường, tra cứu danh mục).

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

### Ma trận Thẩm quyền Tác nhân Tự động hóa Kỹ thuật (System Authority Matrix):

| Hành vi Tự động hóa (System Activity) | Thẩm quyền của System | Ranh giới Kỹ thuật & Bất biến Nghiệp vụ |
|---|:---:|---|
| Tính toán khoảng cách GPS ($\le 10$m) | **ALLOW** | Thuật toán đối chiếu khoảng cách đo được với tọa độ chuẩn của cây. |
| Kiểm tra tính đầy đủ của hồ sơ bằng chứng | **ALLOW** | Đối chiếu số lượng ảnh và checklist theo hợp đồng `ProofProfile`. |
| Ghi nối tiếp sự kiện kiểm toán (`AuditEvent`) | **ALLOW** | Tự động bắt sự kiện miền và ghi lưu vết bất biến (`Append-Only`). |
| Xử lý hàng đợi gửi tin ngoại tuyến (Outbox Sync) | **ALLOW** | Đẩy gói tin lên máy chủ và cập nhật `SyncStatus = SYNCED`. |
| Chuyển trạng thái Task theo kết quả lệnh hợp lệ | **ALLOW** | Thực thi chuyển dịch trạng thái tất định sau khi lệnh của con người hợp lệ. |
| Tự ý khởi tạo nhiệm vụ theo ý chí chủ quan | **DENY** | Khởi tạo task là quyền độc quyền của Operations Manager. |
| Tự ý chọn hoặc phân công nhân viên | **DENY** | Điều phối nhân sự là quyết định vận hành của Manager. |
| Tự động phê duyệt hồ sơ (`Auto-approval`) | **DENY** | Bị cấm tuyệt đối tại MVP (`DR-POL-01`); 100% task phải do Manager duyệt. |
| Tự ý phán quyết yêu cầu làm lại (`RequestRework`) | **DENY** | Đánh giá sai lệch kỹ thuật lâm nghiệp do Manager đảm trách. |
| Tự động cấp hoặc nâng quyền Admin | **DENY** | Cấm tuyệt đối theo quy tắc `ADM-SOD-06`. |
| Tự ý nới lỏng hoặc bỏ qua quy tắc bảo mật | **DENY** | System không được phép bỏ qua các chốt kiểm soát an ninh. |

---

## 4. Ma Trận Phân Quyền Vận Hành Thực Địa (Operational Authorization Matrix)

Bảng phân quyền cho 22 hành vi tác nghiệp hiện trường (`OP-01` đến `OP-22`) thuộc ngữ cảnh `Work Management`:

| Mã Lệnh | Tên Hành vi Vận hành (Operational Command) | Field Staff | Operations Manager | Platform Administrator | System |
|:---:|---|:---:|:---:|:---:|:---:|
| **OP-01** | `ViewAssignedTask` (Xem task được giao) | **ALLOW** (Giao cho mình) | **ALLOW** (Toàn vùng phụ trách) | **DENY** | **N/A** |
| **OP-02** | `ViewOperationalTask` (Xem toàn bộ task vận hành) | **DENY** | **ALLOW** (`AUTHORIZED_SCOPE`) | **DENY** | **N/A** |
| **OP-03** | `CreateTask` (Khởi tạo nhiệm vụ mới) | **DENY** | **ALLOW** | **DENY** | **DENY** |
| **OP-04** | `AssignTask` (Phân công nhiệm vụ tại PENDING) | **DENY** | **ALLOW** | **DENY** | **DENY** |
| **OP-05** | `StartTask` (Bấm bắt đầu thực địa) | **ALLOW** (Đúng người nhận) | **DENY** | **DENY** | **DENY** |
| **OP-06** | `VerifyGps` (Đo tọa độ thực địa $\le 10$m) | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ đọc) | **DENY** | **ALLOW** (Tính toán) |
| **OP-07** | `VerifyQr` (Quét mã QR thân cây) | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ đọc) | **DENY** | **ALLOW** (Khớp mã) |
| **OP-08** | `ReportFieldIssue` (Báo sự cố thi công $\to$ BLOCKED) | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ duyệt xử lý) | **DENY** | **N/A** |
| **OP-09** | `ResumeBlockedTask` (Mở lại task từ BLOCKED) | **DENY** | **ALLOW** | **DENY** | **DENY** |
| **OP-10** | `ReassignTask` (Điều chuyển người từ BLOCKED) | **DENY** | **ALLOW** | **DENY** | **DENY** |
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
| **OP-22** | `ViewCareHistory` (Tra cứu lịch sử chăm sóc cây) | **ALLOW** (Đọc cây được giao) | **ALLOW** (Đọc toàn vùng) | **ALLOW** (Đọc tra cứu) | **N/A** |

---

## 5. Ma Trận Tương Thích Trạng Thái Nhiệm Vụ (Task Action × Task Status Matrix)

Ma trận xác định điều kiện hợp lệ về mặt trạng thái vòng đời của thực thể `Task` đối với từng hành vi tác nghiệp:

| Hành vi Tác nghiệp (Task Action) | `PENDING` | `IN_PROGRESS` | `BLOCKED` | `WAITING_REVIEW` | `REWORK_REQUIRED` | `COMPLETED` | `CANCELLED` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `AssignTask` (Phân công ban đầu) | **`ALLOW`** | `DENY` | `DENY` | `DENY` | `DENY` | `DENY` | `DENY` |
| `StartTask` (Kích hoạt bắt đầu việc) | **`ALLOW`** | `DENY` | `DENY` | `DENY` | `DENY` | `DENY` | `DENY` |
| `VerifyGps` (Đo tọa độ hiện trường) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | **`ALLOW*`** (Nếu cần đo lại) | `DENY` | `DENY` |
| `VerifyQr` (Quét tem QR trên thân cây) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | **`ALLOW*`** (Nếu cần quét lại) | `DENY` | `DENY` |
| `ReportFieldIssue` (Báo cáo sự cố ách tắc) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` |
| `CaptureProofEvidence` (Thu thập ảnh chứng cứ) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | **`ALLOW*`** (Khâu bị từ chối) | `DENY` | `DENY` |
| `CompleteChecklist` (Tích chọn checklist) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | **`ALLOW*`** (Khâu bị từ chối) | `DENY` | `DENY` |
| `RecordStructuredFindings` (Khám bệnh cây) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | **`ALLOW*`** (Khâu bị từ chối) | `DENY` | `DENY` |
| `SubmitEvidence` (Nộp hồ sơ lần đầu) | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` | `DENY` | `DENY` |
| `ResumeBlockedTask` (Tiếp tục thi công) | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` | `DENY` |
| `ReassignTask` (Điều chuyển nhân sự) | **`ALLOW`** | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` | `DENY` |
| `CancelTask` (Hủy nhiệm vụ vận hành) | **`ALLOW`** | **`ALLOW`** | **`ALLOW`** | **`ALLOW`** | **`ALLOW`** | `DENY` | `DENY` |
| `ReviewTask` (Mở hồ sơ thẩm định) | `DENY` | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` |
| `ApproveTask` (Duyệt chuẩn đạt yêu cầu) | `DENY` | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` |
| `ApproveWithException` (Duyệt ngoại lệ) | `DENY` | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` |
| `RequestRework` (Yêu cầu làm lại) | `DENY` | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` | `DENY` |
| `ResubmitRework` (Nộp lại bằng chứng sửa) | `DENY` | `DENY` | `DENY` | `DENY` | **`ALLOW`** | `DENY` | `DENY` |

> **Ghi chú điều kiện `ALLOW*`**: Chỉ cho phép thao tác sửa đổi hoặc thu thập bổ sung đối với các mục/khâu bằng chứng cụ thể bị Quản lý chỉ định sai sót (`targetedKhau`) trong lệnh `RequestRework`; toàn bộ các bằng chứng hợp lệ cũ được khóa bảo lưu bất biến (`DR-HARD-03`, `DR-POL-03`).

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

---

## 7. Ma Trận Phân Quyền Quản Trị Nền Tảng (Governance Authorization Matrix)

Bảng phân quyền cho 22 hành vi quản trị nền tảng (`GV-01` đến `GV-22`):

| Mã Lệnh | Tên Hành vi Quản trị (Governance Command) | Field Staff | Operations Manager | Platform Administrator | Trạng thái Sản phẩm (Product Status) |
|:---:|---|:---:|:---:|:---:|:---:|
| **GV-01** | `ProvisionUser` (Tạo/Mời người dùng mới) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-01) |
| **GV-02** | `AssignRole` (Gán vai trò staff, manager, admin) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-02) |
| **GV-03** | `ActivateAccount` (Kích hoạt tài khoản) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-03) |
| **GV-04** | `SuspendAccount` (Khóa tài khoản tạm thời) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-03) |
| **GV-05** | `DisableAccount` (Vô hiệu hóa tài khoản nghỉ việc) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-03) |
| **GV-06** | `UnlockAccount` (Mở khóa đăng nhập sai) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-04) |
| **GV-07** | `RecoverAccount` (Khôi phục quyền/cấp lại mật khẩu) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-04) |
| **GV-08** | `ViewAuditLog` (Xem sổ nhật ký kiểm toán) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-05) |
| **GV-09** | `FilterAuditLog` (Lọc & tra cứu nhật ký kiểm toán) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-05) |
| **GV-10** | `CreateTree` (Thêm cây mới vào Master Data) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-06) |
| **GV-11** | `UpdateTreeMasterData` (Sửa thông tin gốc của cây) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-06) |
| **GV-12** | `ReplaceTreeQrCode` (Cấp đổi mã QR do tem hỏng) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-06) |
| **GV-13** | `UpdateCanonicalCoordinates` (Đo đạc lại GPS chuẩn) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-06) |
| **GV-14** | `RetireTree` (Chuyển cây sang trạng thái RETIRED) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-06) |
| **GV-15** | `CreateTaskType` (Tạo loại việc mới trong Catalog) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-07) |
| **GV-16** | `ActivateTaskType` (Kích hoạt loại việc ACTIVE) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-07) |
| **GV-17** | `DeactivateTaskType` (Ngưng áp dụng loại việc INACTIVE) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-07) |
| **GV-18** | `PublishProofPolicyVersion` (Ban hành phiên bản chính sách) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-08) |
| **GV-19** | `PublishChecklistTemplateVersion` (Ban hành phiên bản mẫu) | `DENY` | `DENY` | **`ALLOW`** | **MVP** (CAP-ADM-09) |
| **GV-20** | `ManageDynamicFindingsTemplate` (Tạo form khám bệnh động) | `DENY` | `DENY` | `DENY` | **NEXT** (CAP-ADM-10) |
| **GV-21** | `UseBreakGlass` (Mở phiên can thiệp khẩn cấp) | `DENY` | `DENY` | `DENY` | **NEXT** (CAP-ADM-11) |
| **GV-22** | `ManagePlatformSystemConfig` (Cấu hình server/DB/secrets) | `DENY` | `DENY` | `DENY` | **REJECTED** (CAP-ADM-13) |

---

## 8. Bảng Đặc Tả Thẩm Quyền Chuẩn Tắc Cho Từng Lệnh Hợp Lệ (Authoritative Action Specifications)

Đặc tả chi tiết toàn bộ các hành vi được phép (`ALLOW`) trong hệ thống theo chuẩn mực kiểm soát chặt chẽ:

| Mã Lệnh | Tên Lệnh Chuẩn tắc | Tác nhân | Ngữ cảnh Sở hữu | Tài nguyên Mục tiêu | Phạm vi Tài nguyên (Resource Scope) | Trạng thái Cho phép | Điều kiện Tiên quyết (Preconditions) | Kết quả Nghiệp vụ (Outcome) | Yêu cầu Kiểm toán | Điều kiện Bị cấm Tuyệt đối (Forbidden Conditions) |
|---|---|---|---|---|---|---|---|---|:---:|---|
| **OP-03** | `CreateTask` | Manager | Work Management | Thực thể `Task` mới | `AUTHORIZED_SCOPE` | N/A (Khởi tạo) | Cây tồn tại và chưa bị RETIRED; TaskType đang `ACTIVE`; Ánh xạ ProofProfile tồn tại; Nhân viên gán đang `ACTIVE`. | Tạo task ở trạng thái `PENDING`, chốt `treeIdSnapshot` và `policyVersionId`. | **AUDIT_REQUIRED** | CẤM Admin gọi lệnh; CẤM chọn TaskType đang `INACTIVE`; CẤM gán cho người bị khóa. |
| **OP-04** | `AssignTask` | Manager | Work Management | `Task` | `AUTHORIZED_SCOPE` | `PENDING` | Nhân sự được gán có vai trò `staff` và trạng thái `ACTIVE`. | Cập nhật `assignedStaffId`, lưu vết phân công. | **AUDIT_REQUIRED** | CẤM gán khi task đang `IN_PROGRESS` hoặc `WAITING_REVIEW`; CẤM gán cho chính mình. |
| **OP-05** | `StartTask` | Staff | Work Management | `Task` | `assignedStaffId == actor.userId` | `PENDING` | Tác nhân đăng nhập đúng tài khoản được phân công; Tài khoản đang `ACTIVE`. | Chuyển trạng thái sang `IN_PROGRESS`, chụp `ChecklistSnapshot`. | **NO_BUSINESS_AUDIT** | CẤM Manager hoặc Admin bấm hộ; Mở xem chi tiết KHÔNG làm đổi trạng thái task. |
| **OP-06** | `VerifyGps` | Staff | Work Management | `SiteVerification` | `assignedStaffId == actor.userId` | `IN_PROGRESS`, `REWORK_REQUIRED` | Tọa độ GPS đo thực tế có khoảng cách tới cây $\le 10$m (hoặc có giải trình ngoại lệ). | Cập nhật `gpsVerification`, gắn nhãn `LOCATION_VERIFIED` hoặc cờ ngoại lệ. | **NO_BUSINESS_AUDIT** | Đo GPS thành công KHÔNG làm đổi `TaskStatus`; CẤM dùng tọa độ giả lập. |
| **OP-07** | `VerifyQr` | Staff | Work Management | `SiteVerification` | `assignedStaffId == actor.userId` | `IN_PROGRESS`, `REWORK_REQUIRED` | Mã QR quét được khớp với `treeId` của task (hoặc có cờ ngoại lệ danh tính tem hỏng). | Cập nhật `qrVerification`, gắn nhãn `TREE_IDENTITY_VERIFIED` hoặc cờ ngoại lệ. | **NO_BUSINESS_AUDIT** | Quét QR KHÔNG làm đổi `TaskStatus`; CẤM quét QR cây khác để thế chấp. |
| **OP-08** | `ReportFieldIssue` | Staff | Work Management | `FieldIssue` | `assignedStaffId == actor.userId` | `IN_PROGRESS`, `REWORK_REQUIRED` | Có sự cố cản trở thi công khách quan; Bắt buộc có mô tả lý do và ảnh chụp hiện trường. | Chuyển trạng thái task sang `BLOCKED`, thông báo cho Manager. | **AUDIT_RECOMMENDED** | CẤM dùng để báo sâu bệnh của cây (`StructuredFindings`); CẤM tự ý hủy task. |
| **OP-09** | `ResumeBlockedTask` | Manager | Work Management | `Task` | `AUTHORIZED_SCOPE` | `BLOCKED` | Sự cố cản trở đã được giải tỏa ngoài thực địa; Có xác nhận của Manager. | Đưa task quay lại trạng thái `IN_PROGRESS` cho nhân viên cũ tiếp tục. | **AUDIT_REQUIRED** | Staff không có quyền tự gỡ BLOCKED; CẤM mở lại nếu chưa giải quyết xong sự cố. |
| **OP-10** | `ReassignTask` | Manager | Work Management | `Task` | `AUTHORIZED_SCOPE` | `BLOCKED` | Nhân viên cũ không thể tiếp tục (tai nạn, sự cố); Nhân viên mới đang `ACTIVE`. | Đưa task về `PENDING`, cập nhật nhân sự mới, bảo lưu toàn bộ chứng cứ hợp lệ cũ. | **AUDIT_REQUIRED** | CẤM Reassign trực tiếp từ `IN_PROGRESS` (bắt buộc qua `BLOCKED`); CẤM xóa bằng chứng cũ. |
| **OP-11** | `CancelTask` | Manager | Work Management | `Cancellation` | `AUTHORIZED_SCOPE` | `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED` | Bắt buộc nhập lý do hủy việc bằng văn bản; Lưu vết người hủy và thời điểm. | Chuyển task sang `CANCELLED` (đóng vĩnh viễn), KHÔNG sinh bản ghi CareHistory. | **AUDIT_REQUIRED** | CẤM hủy task đã `COMPLETED`; CẤM Admin gọi lệnh trong chế độ thường; CẤM xóa vật lý. |
| **OP-12** | `CaptureProofEvidence` | Staff | Work Management | `TaskEvidence` | `assignedStaffId == actor.userId` | `IN_PROGRESS`, `REWORK_REQUIRED` | Chụp ảnh thực tế tại hiện trường; Khớp loại ảnh quy định theo `ProofProfile`. | Lưu ảnh vào `EvidenceAttempt` hiện hành kèm metadata (tọa độ, thời gian). | **NO_BUSINESS_AUDIT** | CẤM ngụy tạo ảnh (`DR-HARD-04`); CẤM dùng ảnh chụp màn hình hoặc ảnh từ thư viện cũ. |
| **OP-13** | `CompleteChecklist` | Staff | Work Management | `ChecklistSnapshot` | `assignedStaffId == actor.userId` | `IN_PROGRESS`, `REWORK_REQUIRED` | Tích chọn trung thực 100% các câu hỏi kiểm tra kỹ thuật ngoài hiện trường. | Cập nhật câu trả lời vào bản chụp checklist của task. | **NO_BUSINESS_AUDIT** | CẤM bỏ trống câu hỏi bắt buộc; Nhân viên KHÔNG có quyền sửa mẫu checklist gốc. |
| **OP-14** | `RecordStructuredFindings` | Staff | Work Management | `StructuredFindings` | `assignedStaffId == actor.userId` | `IN_PROGRESS`, `REWORK_REQUIRED` | Áp dụng cho task mang `INSPECTION_PROOF`; Nhập đầy đủ chỉ số độ nghiêng, mục rỗng, sâu bệnh. | Lưu dữ liệu khám bệnh có cấu trúc vào hồ sơ nghiệm thu. | **NO_BUSINESS_AUDIT** | CẤM bỏ qua khi task là kiểm định; CẤM coi `TreeRiskStatus` là sự thay thế. |
| **OP-15** | `SubmitEvidence` | Staff | Work Management | `Task` | `assignedStaffId == actor.userId` | `IN_PROGRESS` | Hồ sơ bằng chứng đầy đủ 100% theo `ProofProfile`; Site Verification hoàn tất hoặc có giải trình. | Gửi hồ sơ; Khi server xác nhận thành công chuyển sang `WAITING_REVIEW`. | **AUDIT_REQUIRED** | Bấm nộp offline chỉ đổi `LocalSubmissionStatus = PENDING_SYNC`, server giữ `IN_PROGRESS`. |
| **OP-18** | `ApproveTask` | Manager | Work Management | `ReviewDecision` | `AUTHORIZED_SCOPE` | `WAITING_REVIEW` | Manager thẩm định đầy đủ chứng cứ và kết luận đạt tiêu chuẩn chất lượng. | Chuyển task sang `COMPLETED`, kích hoạt lập bản chiếu `CareHistory`. | **AUDIT_REQUIRED** | Staff CẤM tự duyệt (`DR-HARD-02`); Admin CẤM duyệt; CẤM duyệt tự động (`DR-POL-01`). |
| **OP-19** | `ApproveWithException` | Manager | Work Management | `ReviewDecision` | `AUTHORIZED_SCOPE` | `WAITING_REVIEW` | Công việc đạt chuẩn nhưng có lỗi định vị/danh tính bất khả kháng; Có lý do giải trình. | Chuyển task sang `COMPLETED`, chiếu cờ `HAS_EXCEPTION` sang `CareHistory`. | **AUDIT_REQUIRED** | CẤM duyệt ngoại lệ mà không nhập văn bản giải trình trách nhiệm của Manager. |
| **OP-20** | `RequestRework` | Manager | Work Management | `ReworkRequest` | `AUTHORIZED_SCOPE` | `WAITING_REVIEW` | Phát hiện sai sót; Bắt buộc chỉ rõ khâu sai sót (`targetedKhau`) và hướng dẫn sửa. | Chuyển task sang `REWORK_REQUIRED`, mở phiên Attempt mới, bảo lưu chứng cứ cũ. | **AUDIT_REQUIRED** | CẤM xóa bằng chứng cũ; CẤM bắt làm lại toàn bộ nếu chỉ sai sót 1 khâu nhỏ. |
| **OP-21** | `ResubmitRework` | Staff | Work Management | `Task` | `assignedStaffId == actor.userId` | `REWORK_REQUIRED` | Đã chụp lại đầy đủ các khâu bằng chứng bị yêu cầu làm lại. | Chuyển task quay lại `WAITING_REVIEW` để Manager thẩm định lại phiên mới. | **AUDIT_REQUIRED** | CẤM nộp lại nếu chưa bổ sung ảnh/checklist tại khâu bị từ chối. |
| **GV-01** | `ProvisionUser` | Admin | Identity & Access | `User` | Toàn hệ thống | N/A (Khởi tạo) | Email/Phone chưa tồn tại; Tác nhân là Platform Administrator. | Tạo bản ghi người dùng mới ở trạng thái `INVITED` hoặc `ACTIVE`. | **AUDIT_REQUIRED** | CẤM tự đăng ký tự do; CẤM tạo tài khoản ẩn danh; Manager CẤM gọi lệnh. |
| **GV-02** | `AssignRole` | Admin | Identity & Access | `RoleAssignment` | Toàn hệ thống | `ACTIVE` | Tài khoản đích đang `ACTIVE`; Vai trò yêu cầu thuộc `{'staff', 'manager', 'admin'}`. | Cập nhật vai trò, ghi dòng kiểm toán vai trò bất biến. | **AUDIT_REQUIRED** | Admin CẤM tự sửa vai trò của mình (`ADM-SOD-01`); Manager CẤM phân quyền. |
| **GV-03** | `ActivateAccount` | Admin | Identity & Access | `AccountStatus` | Toàn hệ thống | `INVITED`, `SUSPENDED` | Có quyết định phê duyệt nhân sự tiếp tục công tác. | Chuyển trạng thái sang `ACTIVE`, cấp phép đăng nhập. | **AUDIT_REQUIRED** | CẤM kích hoạt tài khoản đã bị xóa vĩnh viễn (`DISABLED`). |
| **GV-04** | `SuspendAccount` | Admin | Identity & Access | `AccountStatus` | Toàn hệ thống | `ACTIVE` | Phát hiện vi phạm an ninh hoặc nhân sự nghỉ phép dài ngày; Có lý do bằng văn bản. | Chuyển sang `SUSPENDED`, lập tức thu hồi phiên làm việc (Access Token). | **AUDIT_REQUIRED** | Khóa tài khoản KHÔNG tự động hủy task đang làm (Manager phải điều phối lại). |
| **GV-06** | `UnlockAccount` | Admin | Identity & Access | `Account` | Toàn hệ thống | Bị khóa tạm | Xác minh chính chủ gặp sự cố đăng nhập sai mật khẩu nhiều lần. | Xóa cờ khóa tạm thời, gửi mã/liên kết đặt lại mật khẩu một lần an toàn. | **AUDIT_REQUIRED** | CẤM mở khóa khi chưa xác minh đúng danh tính người yêu cầu. |
| **GV-08** | `ViewAuditLog` | Admin | Audit & Compliance | `AuditEvent` | Toàn hệ thống | N/A (Chỉ đọc) | Tác nhân có vai trò Platform Administrator đang `ACTIVE`. | Hiển thị danh sách các bản ghi sự kiện kiểm toán bất biến. | **AUDIT_REQUIRED** (Đọc) | Admin CẤM chỉnh sửa hoặc xóa bất kỳ dòng kiểm toán nào (`ADM-SOD-03`). |
| **GV-10** | `CreateTree` | Admin | Tree Asset Registry | `Tree` | Toàn đô thị | N/A (Khởi tạo) | `treeId` và `qrCode` chưa tồn tại trong hệ thống; Tọa độ GPS chuẩn hợp lệ. | Tạo bản ghi tài sản cây xanh mới trong sổ bộ Master Data. | **AUDIT_REQUIRED** | Manager hoặc Staff CẤM tự ý tạo mới cây xanh vào Master Data. |
| **GV-11** | `UpdateTreeMasterData` | Admin | Tree Asset Registry | `TreeMasterData` | Toàn đô thị | Đang sinh trưởng | Bắt buộc nhập lý do điều chỉnh thuộc tính cây; Lưu vết người sửa và thời điểm. | Cập nhật chiều cao, đường kính, chủng loại cây trong Master Data. | **AUDIT_REQUIRED** | Cập nhật Master Data KHÔNG được ghi đè tọa độ thực tế của các task cũ. |
| **GV-12** | `ReplaceTreeQrCode` | Admin | Tree Asset Registry | `TreeIdentity` | Toàn đô thị | Đang sinh trưởng | Tem QR vật lý cũ bị rách/mờ/mất; Mã QR mới là duy nhất; Bắt buộc có lý do. | Cập nhật `qrCode` trong Master Data; Lưu vết kiểm toán cấp đổi tem. | **AUDIT_REQUIRED** | CẤM đổi `treeId`; KHÔNG làm thay đổi kết quả quét QR trong các task cũ (`P3-SC-03`). |
| **GV-15** | `CreateTaskType` | Admin | Policy Governance | `TaskTypeCatalog` | Toàn hệ thống | N/A (Khởi tạo) | `TaskTypeId` chưa tồn tại; Gắn kèm hồ sơ bằng chứng chuẩn `ProofProfile`. | Thêm loại việc mới vào danh mục với trạng thái ban đầu là `ACTIVE`. | **AUDIT_REQUIRED** | CẤM Manager tự gõ loại việc ngoài danh mục; CẤM tạo loại việc thiếu ProofProfile. |
| **GV-16** | `ActivateTaskType` | Admin | Policy Governance | `TaskTypeCatalog` | Toàn hệ thống | `INACTIVE` | Có quyết định khôi phục áp dụng loại công việc. | Chuyển trạng thái sang `ACTIVE` cho phép Manager chọn khi giao việc. | **AUDIT_REQUIRED** | CẤM kích hoạt nếu chưa cấu hình xong mẫu checklist hoặc chính sách bằng chứng. |
| **GV-17** | `DeactivateTaskType` | Admin | Policy Governance | `TaskTypeCatalog` | Toàn hệ thống | `ACTIVE` | Không còn nhu cầu áp dụng loại việc; Có quyết định ngưng công tác. | Chuyển sang `INACTIVE`, ẩn khỏi menu chọn của Manager, CẤM xóa vật lý. | **AUDIT_REQUIRED** | CẤM xóa cứng TaskType nếu đã có nhiệm vụ trong quá khứ tham chiếu đến. |
| **GV-18** | `PublishProofPolicyVersion` | Admin | Policy Governance | `ProofPolicyMapping` | Toàn hệ thống | N/A (Ban hành) | Đánh số phiên bản mới (`PolicyVersion`); Có lý do giải trình thay đổi chính sách. | Ban hành quy tắc ánh xạ mới cho các task tương lai, lưu cố định `policyVersionId`. | **AUDIT_REQUIRED** | CẤM áp dụng hồi tố lên task cũ; Manager CẤM hạ cấp profile của từng task. |
| **GV-19** | `PublishChecklistTemplateVersion` | Admin | Policy Governance | `ChecklistTemplate` | Toàn hệ thống | N/A (Ban hành) | Đánh số phiên bản mẫu mới (`TemplateVersion`); Có nội dung tiêu chí hoàn chỉnh. | Ban hành phiên bản checklist mới cho các task chuyển sang `IN_PROGRESS` tương lai. | **AUDIT_REQUIRED** | CẤM làm thay đổi nội dung checklist của các task đang chạy hoặc chờ duyệt. |

---

## 9. Phân Tách Quyền Hạn Xuyên Ngữ Cảnh (Cross-Context Authorization Rules)

Ngăn chặn triệt để tình trạng một ngữ cảnh tự ý xâm lấn và làm đột biến dữ liệu của ngữ cảnh khác:

1. **Khóa Tài Khoản Nhân Sự Không Tự Ý Hủy Nhiệm Vụ (IAM $\to$ Work Management)**:
   - Khi Admin thực hiện `SuspendAccount` hoặc `DisableAccount` đối với một Nhân viên hiện trường, ngữ cảnh IAM **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** tự động đổi trạng thái các task đang giao cho người đó sang `CANCELLED`.
   - Vụ việc được phản ánh thành dữ liệu cảnh báo khả dụng; Quản lý vận hành (Manager) trong `Work Management` là người duy nhất nắm thẩm quyền ra quyết định điều phối lại (`ReassignTask`) hoặc hủy việc (`CancelTask`) có kiểm toán.
2. **Cập Nhật Master Data Không Ghi Đè Dữ Liệu Thực Địa Lịch Sử (TAR $\to$ Work Management)**:
   - Khi Admin cấp đổi mã `qrCode` hoặc đo đạc lại tọa độ chuẩn trong `Tree Asset Registry`, hành động này **TUYỆT ĐỐI KHÔNG ĐƯỢC** cập nhật đè lên trường tọa độ GPS thực tế hoặc mã QR đã quét trong các bản ghi `SiteVerification` của các task đã hoàn thành trong quá khứ.
3. **Ban Hành Chính Sách Không Hồi Tố Lên Hợp Đồng Bằng Chứng Cũ (Policy $\to$ Work Management)**:
   - Khi Admin ban hành `PolicyVersion` mới với yêu cầu bằng chứng ngặt nghèo hơn, các task đang chạy hoặc đã đóng bảo lưu nguyên vẹn `policyVersionId` lúc khởi tạo, cấm mọi hành vi bắt nộp thêm bằng chứng hồi tố.

---

## 10. Ghi Nhận Khoảng Trống Hiện Thực Hóa Hiện Tại (Current Implementation Gap Register)

> **Lưu ý**: Đây là danh mục ghi nhận khiếm khuyết kỹ thuật làm căn cứ cho giai đoạn sau; **TUYỆT ĐỐI KHÔNG SỬA CODE TẠI PHASE 4**.

| STT | Tập tin Nguồn (File) | Ký hiệu / Dòng mã (Symbol / Line) | Hành vi Hiện tại trong Mã nguồn (Current Defect) | Quy tắc Chuẩn tắc Cần Đạt (Target Rule) | Giai đoạn Khắc phục Dự kiến |
|:---:|---|---|---|---|:---:|
| 1 | `apps/mobile/src/services/greenOpsService.ts` | Dòng 349: `mapSessionRole` | Co ép mọi tài khoản không phải `staff` thành `Manager` (`session.user.role === 'staff' ? 'Staff' : 'Manager'`), làm Admin biến thành Manager. | Tách bạch 3 role độc lập: `staff`, `manager`, `admin`. Admin bị từ chối truy cập luồng Manager. | Phase 11 / Refactor Auth |
| 2 | `apps/mobile/src/screens/MobileApp.tsx` | Dòng 274: `const isStaff = role === 'Staff';` | Co ép nhị phân: coi `!isStaff` đồng nghĩa là Manager, dẫn đến Admin đăng nhập sẽ nhìn thấy giao diện duyệt việc của Manager. | Thiết lập giao diện và bộ điều hướng riêng biệt cho 3 role; Admin không dùng chung màn hình Manager. | Phase 11 / UI Routing |
| 3 | `packages/contracts/src/index.ts` | Dòng 54-60: `TaskStatus` enum | Thiếu vắng 2 trạng thái cốt lõi: `BLOCKED` và `CANCELLED` (chỉ có 5 trạng thái). | Bổ sung đầy đủ 7 trạng thái vòng đời tất định của Task theo chuẩn `DR-MVP-03`. | Phase 6 / Contract Sync |
| 4 | `apps/mobile/src/services/greenOpsService.ts` | Dòng 418: `createTask` | Hàm nhận `fallbackTask` và thêm vào danh sách mà không kiểm tra quyền của người gọi (Role Guard) hay kiểm tra phạm vi tài nguyên. | Bắt buộc kiểm tra quyền Manager, trạng thái cây và tính hợp lệ của loại việc trước khi tạo task. | Phase 11 / Service Layer |
| 5 | `apps/mobile/src/screens/TaskListScreen.tsx` | Giao diện danh sách việc | Chỉ dựa vào việc ẩn/hiện nút bấm ngoài giao diện để phân quyền, thiếu cơ chế guard kiểm soát tại tầng dịch vụ. | Bổ sung lớp kiểm soát phân quyền 4 thành tố độc lập với tầng trình diễn UI. | Phase 11 / Action Eligibility Guard |

---

## 11. Thử Nghiệm Phủ Định Phân Quyền Nghiệp Vụ (Negative Authorization Tests AUTH-NT-01..18)

Đánh giá 18 kịch bản sai phạm phân quyền phổ biến nhằm chứng minh tính chặt chẽ tuyệt đối của mô hình Phase 4:

| Mã Ca Kiểm Thử | Kịch bản Sai phạm Giả định | Kết quả Mong đợi | Đánh giá Thực tế trong Mô hình Phase 4 | Kết luận |
|---|---|:---:|---|:---:|
| **AUTH-NT-01** | Staff tự bấm phê duyệt (`ApproveTask`) nhiệm vụ do chính mình thực hiện. | **`DENY`** (Bị cấm) | Bác bỏ bởi `DR-HARD-02` và Mục 4 (`OP-18`). Staff bị DENY 100% trên lệnh Approve. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-02** | Manager gọi API phân quyền để gán role `admin` cho một người dùng khác. | **`DENY`** (Bị cấm) | Bác bỏ bởi Mục 7 (`GV-02`) và `ADM-SOD-05`. Manager hoàn toàn không có quyền `AssignRole`. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-03** | Platform Administrator bấm duyệt (`ApproveTask`) nhiệm vụ vận hành hiện trường. | **`DENY`** (Bị cấm) | Bác bỏ bởi Mục 4 (`OP-18`) và `ADM-SOD-04`. Admin bị DENY 100% trên mọi tác vụ vận hành thường nhật. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-04** | Platform Administrator gọi lệnh tạo việc mới (`CreateTask`) ngoài hiện trường. | **`DENY`** (Bị cấm) | Bác bỏ bởi Mục 4 (`OP-03`) và Mục 8. Quyền khởi tạo việc thuộc độc quyền của Operations Manager. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-05** | Tác nhân tự động (`System`) tự động nâng quyền một Staff lên làm Admin. | **`DENY`** (Bị cấm) | Bác bỏ bởi `ADM-SOD-06` và Ma trận System Mục 3. System cấm tự phong quyền cho con người. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-06** | Field Staff gửi lệnh chỉnh sửa tọa độ chuẩn của cây trên bản đồ Master Data. | **`DENY`** (Bị cấm) | Bác bỏ bởi Mục 7 (`GV-13`). Staff chỉ được đo GPS tại task, không có quyền sửa Master Data. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-07** | Operations Manager tự ý hạ cấp `ProofProfile` của một nhiệm vụ đơn lẻ. | **`DENY`** (Bị cấm) | Bác bỏ bởi `DR-MVP-02` và Mục 8 (`OP-03`). Ánh xạ ProofProfile do Admin quản trị tập trung. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-08** | Staff A bấm bắt đầu (`StartTask`) trên nhiệm vụ được giao cho Staff B. | **`DENY`** (Bị cấm) | Bác bỏ bởi Mục 8 (`OP-05`). Vi phạm kiểm tra phạm vi tài nguyên (`assignedStaffId != actor.userId`). | **PASS (Đã chặn đứng)** |
| **AUTH-NT-09** | Thao tác mở màn hình chi tiết công việc tự động chuyển `PENDING` $\to$ `IN_PROGRESS`. | **`DENY`** (Bị cấm) | Bác bỏ bởi `DR-MVP-04` và Mục 8 (`OP-05`). DUY NHẤT hành động bấm nút StartTask mới được chuyển trạng thái. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-10** | Thao tác đo GPS thành công tự động làm thay đổi `TaskStatus`. | **`DENY`** (Bị cấm) | Bác bỏ bởi `SiteVerification` invariant và Mục 8 (`OP-06`). Xác thực GPS độc lập với vòng đời task. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-11** | Platform Administrator thực hiện sửa đổi nội dung một dòng nhật ký kiểm toán. | **`DENY`** (Bị cấm) | Bác bỏ bởi `ADM-SOD-03` và Mục 7 (`GV-08`). Audit Log là Append-Only, Admin bị DENY 100% trên edit/delete. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-12** | Quản lý thực hiện chuyển việc (`ReassignTask`) khi task đang ở `WAITING_REVIEW`. | **`DENY`** (Bị cấm) | Bác bỏ bởi `DR-HARD-06` và Mục 5 (Ma trận trạng thái). Task chờ duyệt cấm đổi nhân sự. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-13** | Quản lý hoặc Admin gọi lệnh mở lại nhiệm vụ đã ở trạng thái `COMPLETED`. | **`DENY`** (Bị cấm) | Bác bỏ bởi `DR-HARD-05` và Mục 5. Nhiệm vụ đóng là bất biến vĩnh viễn, cấm mở lại. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-14** | Nhiệm vụ bị hủy (`CANCELLED`) tự động sinh bản ghi lịch sử trong `CareHistory`. | **`DENY`** (Bị cấm) | Bác bỏ bởi `DR-HARD-07` và Mục 8 (`OP-11`). DUY NHẤT task `COMPLETED` mới được sinh CareHistory. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-15** | Giả định Findings Template là NEXT đồng nghĩa Staff không được ghi Structured Findings. | **`DENY`** (Giả định sai) | Bác bỏ bởi `SC-01` và Mục 6, Mục 8 (`OP-14`). Staff bắt buộc thu thập Structured Findings theo Fixed Schema. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-16** | Tác nhân sử dụng quyền mở khóa ngoại lệ (`UseBreakGlass`) trong phạm vi bản MVP. | **`DENY`** (Bị cấm) | Bác bỏ bởi Mục 7 (`GV-21`). Break-Glass là tính năng `NEXT`, hoàn toàn bị khóa tại MVP. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-17** | Màn hình quản trị hiển thị mục cấu hình hạ tầng/server/secrets (`GV-22`). | **`DENY`** (Bị cấm) | Bác bỏ bởi Mục 7 (`GV-22`). Tính năng thuộc `REJECTED`, bị loại bỏ hoàn toàn khỏi mô hình sản phẩm. | **PASS (Đã chặn đứng)** |
| **AUTH-NT-18** | Thao tác bấm nộp bằng chứng offline tự động chuyển `TaskStatus` trên server sang `WAITING_REVIEW`. | **`DENY`** (Bị cấm) | Bác bỏ bởi `DR-TECH-01` và Mục 8 (`OP-15`). Nộp offline chỉ đổi cờ cục bộ; server giữ nguyên `IN_PROGRESS`. | **PASS (Đã chặn đứng)** |

---

## 12. Bảng Bằng Chứng Nghiệm Thu Cổng Phase 4 (Phase 4 Evidence Table)

Nghiệm thu toàn bộ 12 tiêu chí cổng kiểm soát chất lượng khắt khe của Phase 4 theo Master Plan:

| Gate ID | Tiêu chí Nghiệm thu (Requirement) | Phương pháp Xác minh (Verification Method) | Căn cứ Bằng chứng Cụ thể (Concrete Evidence) | Tính Chặn (Blocking) | Kết quả Nghiệm thu (Result) |
|---|---|---|---|:---:|:---:|
| **P4-01** | Mọi lệnh nghiệp vụ đều xác định rõ tác nhân thực hiện | Actor Identification Audit | Mục 4 & Mục 7: 100% các lệnh `OP-01..22` và `GV-01..22` đều gắn với tác nhân cụ thể. | **YES** | **PASS** |
| **P4-02** | Mọi lệnh nghiệp vụ đều xác định rõ tài nguyên mục tiêu | Resource Target Verification | Bảng Mục 8: Từng lệnh quy định rõ tài nguyên (`Task`, `SiteVerification`, `User`, `Tree`, `Catalog`). | **YES** | **PASS** |
| **P4-03** | Mọi lệnh phụ thuộc trạng thái đều xác định trạng thái hợp lệ | State Dependency Audit | Ma trận Mục 5: 100% các hành vi tác nghiệp đều đối soát chi tiết trên 7 trạng thái của Task. | **YES** | **PASS** |
| **P4-04** | Mọi lệnh đều có điều kiện tiên quyết nghiệp vụ rõ ràng | Business Preconditions Check | Bảng Mục 8: Cột *Điều kiện Tiên quyết* quy định cụ thể các ràng buộc nghiệp vụ cho từng lệnh. | **YES** | **PASS** |
| **P4-05** | Mọi ranh giới cấm đều được tuyên ngôn minh bạch | Forbidden Conditions Audit | Bảng Mục 8: Cột *Điều kiện Bị cấm Tuyệt đối* chỉ rõ các hành vi bị chặn đứng kèm mã luật DR. | **YES** | **PASS** |
| **P4-06** | Ma trận phân quyền Field Staff hoàn chỉnh | Staff Permission Inspection | Mục 4: Phân định chi tiết toàn bộ các quyền xem, bắt đầu, đo đạc, chụp ảnh và nộp việc của Staff. | **YES** | **PASS** |
| **P4-07** | Ma trận phân quyền Operations Manager hoàn chỉnh | Manager Permission Inspection | Mục 4: Phân định rõ quyền tạo việc, giao việc, xử lý sự cố, hủy việc và 4 kết luận duyệt của Manager. | **YES** | **PASS** |
| **P4-08** | Ma trận phân quyền Platform Administrator hoàn chỉnh | Admin Governance Audit | Mục 7: Phân định rõ 19 lệnh quản trị MVP (`GV-01..19`), khóa cứng 2 lệnh NEXT và 1 lệnh REJECTED. | **YES** | **PASS** |
| **P4-09** | Admin không có quyền can thiệp vận hành thực địa mặc định | Anti-Superuser Inheritance Check | Mục 4 & Mục 11 (AUTH-NT-03..04): Admin bị DENY 100% trên `CreateTask`, `AssignTask`, `ApproveTask`. | **YES** | **PASS** |
| **P4-10** | Manager không có quyền quản trị người dùng và vai trò mặc định | Anti-Governance Spillover Check | Mục 7 & Mục 11 (AUTH-NT-02): Manager bị DENY 100% trên `ProvisionUser`, `AssignRole`, `SuspendAccount`. | **YES** | **PASS** |
| **P4-11** | Quyền can thiệp khẩn cấp (Break-Glass) nằm ngoài MVP | Emergency Exception Isolation Audit | Mục 7 (`GV-21`) & Mục 11 (AUTH-NT-16): Break-Glass được phân loại `NEXT`, cấm kích hoạt tại MVP. | **YES** | **PASS** |
| **P4-12** | Phân tách rạch ròi giữa thẩm quyền Đọc và thẩm quyền Ghi | Read vs Mutate Separation Audit | Mục 1 & Bảng Mục 8: Phân biệt rõ thẩm quyền xem (Read-Only) không suy diễn thành quyền can thiệp (Mutate). | **YES** | **PASS** |

---

## 13. Kết Luận Cổng Nghiệm Thu Phase 4 (Phase 4 Exit Gate)

```text
================================================================================
PHASE 4 PASS
— OPERATIONAL AUTHORIZATION LOCKED
— GOVERNANCE AUTHORIZATION LOCKED
— RESOURCE SCOPE AND STATE ELIGIBILITY DEFINED
— ADMIN SUPERUSER INHERITANCE PREVENTED
— READY FOR PHASE 5 WORKFLOW OPTIMIZATION
================================================================================
```
