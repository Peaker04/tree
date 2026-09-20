# BÁO CÁO ĐÓNG BĂNG ĐƯỜNG CƠ SỞ NGHIỆP VỤ (BUSINESS BASELINE FREEZE REPORT)
## NOVYX GREENOPS — BASELINE RECONCILIATION PHASE 10 (FINAL RECONCILIATION FREEZE)

> **Mã tài liệu:** `docs/business-reconciliation/13-BUSINESS-BASELINE-FREEZE.md`
> **Trạng thái:** `FROZEN & RATIFIED (CHÍNH THỨC ĐÓNG BĂNG)`
> **Giai đoạn:** Phase 10 — Business Baseline Freeze
> **Đường cơ sở đầu vào (Freeze Input Baseline):** Commit `154d76d6049180a604d672122ab2bba7273bcdbe`
> **Căn cứ tối cao:** [PRODUCT.md](file:///d:/ki7/EXE/tree/docs/PRODUCT.md), [DOMAIN.md](file:///d:/ki7/EXE/tree/docs/DOMAIN.md), [ACCESS-CONTROL.md](file:///d:/ki7/EXE/tree/docs/ACCESS-CONTROL.md), [WORKFLOWS.md](file:///d:/ki7/EXE/tree/docs/WORKFLOWS.md), [REQUIREMENTS-TRACEABILITY.md](file:///d:/ki7/EXE/tree/docs/REQUIREMENTS-TRACEABILITY.md), [README.md](file:///d:/ki7/EXE/tree/docs/diagrams/README.md), và toàn bộ các quyết định chuẩn tắc `00` đến `12`.

---

## 1. Mục Đích Đóng Băng (Purpose)

Tài liệu này là cột mốc chính thức khép lại toàn bộ tiến trình **Điều Chỉnh Đường Cơ Sở Nghiệp Vụ (Business Baseline Reconciliation)** kéo dài qua 11 giai đoạn (Phase 0 đến Phase 10).

Mục tiêu tối thượng của Phase 10:
1. **Nghiệm thu toàn diện:** Xác nhận chuỗi quyết định từ Phase 0 đến Phase 9 đã hoàn tất 100%, không còn bất kỳ lỗ hổng ngữ nghĩa hay sự trôi dạt từ vựng nào.
2. **Khóa cứng các bất biến:** Đóng băng toàn bộ các mô hình tác nhân, ranh giới quyền lực quản trị, sở hữu ngữ cảnh miền, vòng đời 7 trạng thái, và ma trận phân quyền.
3. **Thiết lập danh mục bàn giao (Manifest):** Xác lập bảng băm toàn vẹn (File Integrity Hash) cho toàn bộ tài liệu chuẩn tắc và báo cáo nghiệm thu.
4. **Chuyển trạng thái dự án:** Chính thức chuyển trạng thái từ **`BUSINESS RECONCILIATION`** sang **`READY FOR TECHNICAL ARCHITECTURE / ADR` (Sẵn sàng cho Kiến trúc Kỹ thuật & Quyết định Kiến trúc Phase 11)**.

---

## 2. Đường Cơ Sở Đầu Vào (Freeze Input Baseline)

Tiến trình đóng băng được thực hiện trên nền tảng commit kiểm toán đã hoàn tất kiểm chứng độc lập của Phase 9:
- **Parent / Freeze Input Baseline Commit:** `154d76d6049180a604d672122ab2bba7273bcdbe`
- **Thông điệp commit:** `docs(business): correct phase 9 audit evidence`
- **Nhánh:** `base-setup` (Đồng bộ sạch 100% với `origin/base-setup`).
- **Tình trạng working tree:** Hoàn toàn sạch (`CLEAN`), không có tệp thừa, không có sửa đổi chưa lưu.

---

## 3. Hệ Cấp Thẩm Quyền Tài Liệu (Authority Hierarchy)

Đường cơ sở được đóng băng duy trì trật tự thẩm quyền bất biến:

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. CANONICAL BUSINESS DOCUMENTS (Thẩm quyền tối cao)        │
│    PRODUCT.md, DOMAIN.md, ACCESS-CONTROL.md, WORKFLOWS.md,  │
│    REQUIREMENTS-TRACEABILITY.md                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ (định nghĩa & ràng buộc)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. FROZEN RECONCILIATION DECISIONS (Bằng chứng lịch sử)     │
│    Báo cáo quyết định Phase 0–9 (Decisions 00–12)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ (chiếu trực quan)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CURRENT DERIVED DIAGRAMS (Góc nhìn dẫn xuất hiện hành)   │
│    01, 02, 07, 08, proposed-01..04                          │
└──────────────────────────────┬──────────────────────────────┘
                               │ (phân lập rõ ràng)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. HISTORICAL / AS-IS EVIDENCE (Chứng tích tham chiếu)      │
│    03, 04, 05, 06, 11 (Historical) | 09 (AS-IS Defect)      │
│    10, 12 (Deferred to Phase 11 ADR)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Sổ Cái Hoàn Thành Toàn Bộ Các Phase (Phase Completion Ledger)

Bảng đối soát chứng thực toàn bộ các mốc quyết định từ Phase 0 đến Phase 9 trong lịch sử Git:

| Giai đoạn (Phase) | Mục đích nghiệp vụ cốt lõi | Commit chuẩn tắc | Tạo tác nghiệm thu (Artifact) | Trạng thái cuối | Bằng chứng tồn tại? |
| :--- | :--- | :---: | :--- | :---: | :---: |
| **Phase 0** | Khóa hiện trạng, phân tích khoảng trống & lập Master Plan | `36b0369` | `00-BASELINE-SNAPSHOT.md`<br>`01-BUSINESS-GAP-REGISTER.md` | **PASS** | **CÓ** |
| **Phase 1** | Xác lập mô hình 3 vai trò con người + 1 tác nhân kỹ thuật | `42a5459` | `02-ACTOR-MODEL-DECISION.md` | **PASS** | **CÓ** |
| *(Role Naming)* | Chuẩn hóa danh xưng chuẩn tắc 3 tầng tiếng Anh - tiếng Việt | `95d84d9` | `03-ROLE-NAMING-TAXONOMY.md` | **PASS** | **CÓ** |
| **Phase 2** | Định nghĩa phạm vi Admin MVP (9 năng lực) & loại bỏ Superuser | `16c6172` | `04-ADMIN-BUSINESS-SCOPE-DECISION.md` | **PASS** | **CÓ** |
| **Phase 3** | Phân định ranh giới đơn chủ (Single-Context Ownership) cho 5 context | `15c1529` | `05-DOMAIN-OWNERSHIP-MATRIX.md`<br>`06-BOUNDED-CONTEXT-DECISIONS.md` | **PASS** | **CÓ** |
| **Phase 4** | Ma trận đủ điều kiện hành vi (Action Eligibility) & 8 quy tắc SoD | `6911e33` | `07-AUTHORIZATION-ACTION-ELIGIBILITY.md` | **PASS** | **CÓ** |
| **Phase 5** | Tối ưu hóa 18 luồng tác nghiệp, 7 trạng thái, và giải tỏa bế tắc | `550f9cd` | `08-WORKFLOW-OPTIMIZATION.md` | **PASS** | **CÓ** |
| **Phase 6** | Đồng bộ hóa toàn diện 5 tài liệu nghiệp vụ chuẩn tắc | `86e0df7` | `09-CANONICAL-DOCUMENT-RECONCILIATION-REPORT.md` | **PASS** | **CÓ** |
| **Phase 7** | Mở rộng RTM & thiết lập 43 tiêu chí nghiệm thu nhị phân | `11ac66f` | `10-RTM-ACCEPTANCE-ORACLE-REPORT.md` | **PASS** | **CÓ** |
| **Phase 8** | Đồng bộ hóa bộ biểu đồ trực quan dẫn xuất (16 biểu đồ) | `86b0bed` | `11-DIAGRAM-SUITE-RECONCILIATION-REPORT.md` | **PASS** | **CÓ** |
| **Phase 9** | Kiểm toán tính nhất quán độc lập & hiệu chỉnh chứng cứ | `154d76d` | `12-BUSINESS-CONSISTENCY-AUDIT.md` | **PASS** | **CÓ** |

> **Ghi chú lịch sử:** Toàn bộ các mốc trên đã áp dụng các commit đóng ngữ nghĩa (`Semantic Closure Commits`) để thay thế và hoàn thiện các commit sơ khởi, bảo toàn lịch sử kiểm toán minh bạch 100%.

---

## 5. Bảng Chỉ Số Nghiệm Thu Cuối Cùng (Final Gate Metrics Table)

Đối soát 10 chỉ số nghiệm thu tối cao theo yêu cầu của Kế hoạch Tổng thể ([Master Plan](file:///d:/ki7/EXE/tree/docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md)):

| Chỉ số nghiệm thu (Metric) | Ngưỡng bắt buộc | Chứng cứ Báo cáo 12 (Phase 9) | Kiểm chứng Phase 10 | Kết quả |
| :--- | :---: | :---: | :---: | :---: |
| **1. Cổng kiểm soát thất bại (Blocking FAIL)** | 0 | 0 | 0 | **PASS** |
| **2. Cổng chưa chạy (NOT_RUN)** | 0 | 0 | 0 | **PASS** |
| **3. Cổng không kết luận được (INCONCLUSIVE)** | 0 | 0 | 0 | **PASS** |
| **4. Thiếu chứng cứ kiểm toán (Missing Evidence)** | 0 | 0 | 0 | **PASS** |
| **5. Mâu thuẫn chéo tài liệu (Cross-doc Contradiction)** | 0 | 0 | 0 | **PASS** |
| **6. Yêu cầu chưa ánh xạ (Unmapped Requirement)** | 0 | 0 | 0 | **PASS** |
| **7. Lệnh vô chủ (Unowned Command)** | 0 | 0 | 0 | **PASS** |
| **8. Tác nhân chưa định nghĩa (Undefined Actor)** | 0 | 0 | 0 | **PASS** |
| **9. Sai lệch ngữ nghĩa biểu đồ (Diagram Semantic Mismatch)**| 0 | 0 | 0 | **PASS** |
| **10. Thay đổi mã nguồn ứng dụng (Application Source Change)**| 0 | 0 | 0 | **PASS** |

---

## 6. Khóa Cứng Mô Hình Tác Nhân & Vai Trò (Actor & Role Freeze)

1. **3 Vai trò Người dùng Con người Duy nhất (Human Product Roles):**
   - **`Field Staff`** (Technical ID: `'staff'` | Nhãn tiếng Việt: *Nhân viên hiện trường*): Tác nghiệp thực địa, gắn chặt với `task.assignedStaffId == actor.userId`. Bị cấm quản trị nền tảng.
   - **`Operations Manager`** (Technical ID: `'manager'` | Nhãn tiếng Việt: *Quản lý vận hành*): Điều phối vận hành trong phạm vi `AUTHORIZED_OPERATIONAL_SCOPE`. Bị cấm quản trị nền tảng.
   - **`Platform Administrator`** (Technical ID: `'admin'` | Nhãn tiếng Việt: *Quản trị hệ thống*): Quản trị nền tảng trong phạm vi `PLATFORM_GOVERNANCE_SCOPE`. Bị **DENY 100%** trên toàn bộ các lệnh tác nghiệp Task (`OP-03..15`, `OP-17..21`).
2. **1 Tác nhân Tự động hóa Kỹ thuật (Technical Automation Actor):**
   - **`System`**: Thực thi các kiểm tra bất biến tất định, chiếu dữ liệu `CareHistory`, lưu vết `AuditEvent`. Hoàn toàn **KHÔNG PHẢI VAI TRÒ NGƯỜI DÙNG (`UserRole`)**, không có tài khoản đăng nhập, không đưa ra quyết định thẩm định chủ quan.
3. **Cấm Tuyệt Đối Thừa Kế Phân Cấp:**
   - Quan hệ $\text{Admin} > \text{Manager} > \text{Staff}$ **HOÀN TOÀN KHÔNG TỒN TẠI**. Nhánh Vận hành (Operations) và Nhánh Quản trị (Governance) là hai mặt phẳng trực giao, độc lập.

---

## 7. Khóa Cứng Quyền Lực Quản Trị Nền Tảng (Admin Governance Freeze)

1. **Platform Administrator là Vai trò Quản trị MVP Hoạt động (Active MVP Role):**
   - Không còn khái niệm `OUT_OF_MVP` hay `Admin RESERVED`.
2. **13 Năng lực Quản trị Nền tảng (`CAP-ADM-01..13`):**
   - **9 Năng lực MVP (`CAP-ADM-01..09`):** User Provisioning, Role Assignment, Account Lifecycle, Account Recovery/Unlock, Audit Log Inspection, Tree Master Data Governance, TaskType Catalog Governance, Proof Policy Governance, Checklist Template Governance.
   - **3 Năng lực NEXT (`CAP-ADM-10..12`):** Dynamic Findings Template Governance, Break-Glass Access, Security & Governance Notifications.
   - **1 Năng lực BỊ LOẠI TRỪ (`CAP-ADM-13`):** Platform System Configuration (Bị bác bỏ vì rủi ro an ninh).
3. **Cấm Can Thiệp Tác Nghiệp:**
   - Admin **BỊ CẤM 100%** tham gia vào các hành vi tạo việc, giao việc, thẩm định, làm lại hay hủy nhiệm vụ thông thường.
   - Năng lực `Break-Glass` (`CAP-ADM-11`) bị khóa hoàn toàn tại MVP, không thể trở thành ngõ sau vượt quyền (superuser backdoor).

---

## 8. Khóa Cứng Ranh Giới Sở Hữu Miền (Domain Ownership Freeze)

1. **5 Ngữ Cảnh Giới Hạn Chuẩn Tắc (Canonical Bounded Contexts):**
   - **`Work Management`** $\to$ **`CORE DOMAIN`** (Hợp nhất toàn bộ chu trình Hiện trường, Bằng chứng, Nghiệm thu và Làm lại).
   - **`Tree Asset Registry`** $\to$ **`SUPPORTING SUBDOMAIN`** (Quản trị tài sản cây xanh, Master Data và bản chiếu `CareHistory`).
   - **`Policy & Template Governance`** $\to$ **`SUPPORTING SUBDOMAIN`** (Quản trị danh mục loại việc, quy tắc chính sách bằng chứng và mẫu checklist).
   - **`Audit & Compliance`** $\to$ **`SUPPORTING SUBDOMAIN`** (Sổ nhật ký sự kiện kiểm toán bất biến append-only).
   - **`Identity & Access Management (IAM)`** $\to$ **`GENERIC SUBDOMAIN`** (Quản trị người dùng, tài khoản, vai trò và trạng thái tài khoản).
2. **Mô Hình Dẫn Xuất & Quan Ngại Kỹ Thuật (Non-Context Concerns):**
   - **`Operational Notifications`**: Là mô hình đọc dẫn xuất phi thẩm quyền (`Derived Read Model / Projection`), không phải Bounded Context (`Authoritative Owning Context: N/A`).
   - **`Offline / Synchronization`**: Là giải pháp hạ tầng lưu trữ đệm ngoại tuyến (`Durable Outbox`) và vận chuyển client, không phải Bounded Context.

---

## 9. Khóa Cứng Vòng Đời 7 Trạng Thái Nhiệm Vụ (Task Lifecycle Freeze)

$$\text{TaskStatus} \in \{\text{PENDING}, \text{IN\_PROGRESS}, \text{BLOCKED}, \text{WAITING\_REVIEW}, \text{REWORK\_REQUIRED}, \text{COMPLETED}, \text{CANCELLED}\}$$

- **Trạng thái kết thúc bất biến (Terminal States):** `COMPLETED` và `CANCELLED`. Đóng vĩnh viễn, cấm mở lại dưới mọi hình thức (`DR-HARD-05`).
- **Cấm Tuyệt Đối Trạng Thái Thứ 8:** Nghiêm cấm các trạng thái giả tạo như `OFFLINE_SUBMITTED`, `COMPLETED_WITH_EXCEPTION`, `ADMIN_CANCELLED`, `STAFF_UNAVAILABLE`, `ACCOUNT_SUSPENDED`.

---

## 10. Khóa Cứng Ma Trận Chuyển Dịch Trạng Thái (Task Transitions Freeze)

1. **Tại `PENDING`:**
   - `StartTask` $\to$ `IN_PROGRESS` (Duy nhất Staff được phân công).
   - `ReassignTask` $\to$ `PENDING` (Manager phân công sang nhân sự mới).
   - `CancelTask` $\to$ `CANCELLED` (Manager hủy việc có lý do văn bản).
2. **Tại `IN_PROGRESS`:**
   - `ReportFieldIssue` $\to$ `BLOCKED` (Staff báo sự cố trở ngại bất khả kháng).
   - `SubmitEvidence` (được chấp nhận) $\to$ `WAITING_REVIEW` (Nộp đủ 100% bằng chứng).
   - `CancelTask` $\to$ `CANCELLED` (Manager hủy việc có lý do).
3. **Tại `BLOCKED` (Đúng 3 lối thoát tất định):**
   - `ResumeBlockedTask` $\to$ `IN_PROGRESS` (Tiếp tục công việc khi giải tỏa sự cố).
   - `ReassignTask` $\to$ `PENDING` (Đổi nhân sự mới khi nhân sự cũ không thể tiếp tục).
   - `CancelTask` $\to$ `CANCELLED` (Hủy việc khi trở ngại không thể khắc phục).
4. **Tại `WAITING_REVIEW` (Đúng 4 kết luận duyệt của Quản lý):**
   - `ApproveTask` $\to$ `COMPLETED` (Nghiệm thu đạt chuẩn 100%).
   - `ApproveWithException` $\to$ `COMPLETED` (Nghiệm thu có ngoại lệ được bảo lãnh trách nhiệm).
   - `RequestRework` $\to$ `REWORK_REQUIRED` (Yêu cầu làm lại có mục tiêu khâu lỗi).
   - `CancelTask` $\to$ `CANCELLED` (Hủy việc tại khâu thẩm định).
5. **Tại `REWORK_REQUIRED`:**
   - `ResubmitRework` $\to$ `WAITING_REVIEW` (Nộp lại đúng khâu sửa lỗi, ghép Attempt mới).
   - `CancelTask` $\to$ `CANCELLED` (Hủy việc).
   - *Cấm:* Không được chuyển trực tiếp `REWORK_REQUIRED → BLOCKED`, không được đổi người trực tiếp (`no direct Reassign`).

---

## 11. Khóa Cứng Bằng Chứng, Nghiệm Thu & Làm Lại (Proof & Review Freeze)

1. **Đúng 3 Hồ Sơ Bằng Chứng (ProofProfiles):**
   - **`CHANGE_PROOF`**: Ảnh Hiện trạng Trước $\to$ Hoàn thành 100% Checklist $\to$ Ảnh Hoàn thành Sau.
   - **`SERVICE_PROOF`**: Hoàn thành 100% Checklist $\to$ 01 Ảnh Nghiệm thu Hoàn thành.
   - **`INSPECTION_PROOF`**: Xác thực Hiện trường $\to$ Bảng Khám bệnh có cấu trúc (`StructuredFindings`) $\to$ Ảnh Hiện trạng Cây.
2. **Tính Bắt Buộc Của Structured Findings Trong MVP:**
   - `StructuredFindings` là **BẮT BUỘC** cho mọi nhiệm vụ kiểm định trong MVP thông qua bảng biểu chuẩn tắc cố định (**Fixed Canonical Schema**).
   - Hoãn `CAP-ADM-10` chỉ áp dụng cho tính năng cấu hình biểu mẫu động của Admin.
3. **Đúng 4 Kết Luận Thẩm Định:**
   - `APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL`. Tuyệt đối không sinh trạng thái `COMPLETED_WITH_EXCEPTION`.

---

## 12. Khóa Cứng Điều Chuyển, Xác Thực & Ngoại Tuyến (Reassignment & Offline Freeze)

1. **Quy Tắc Điều Chuyển Nhân Sự (`ReassignTask`):**
   - Cho phép tại: `PENDING` (Case A) và `BLOCKED` (Case B).
   - **CẤM TUYỆT ĐỐI** tại: `IN_PROGRESS` (phải báo sự cố sang `BLOCKED`), `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`.
2. **Quy Tắc Xác Thực Hiện Trường (Site Verification):**
   - Đo GPS ($\le 10\text{m}$) và Quét QR thân cây là hai thao tác độc lập, thực hiện theo thứ tự bất kỳ, **không làm thay đổi `TaskStatus`**.
   - Báo cáo ngoại lệ vị trí (`LOCATION_EXCEPTION`) và danh tính (`IDENTITY_EXCEPTION`) chỉ ghi nhận cờ thẩm định để Quản lý hậu kiểm.
3. **Phân Tách Trạng Thái Ngoại Tuyến (Offline State Separation):**
   $$\text{Authoritative TaskStatus} \neq \text{LocalSubmissionStatus} \neq \text{SyncStatus}$$
   - Nộp khi mất mạng: `LocalSubmissionStatus = PENDING_SYNC`, máy chủ chuẩn tắc vẫn giữ `TaskStatus = IN_PROGRESS`.
   - Đồng bộ thành công: `TaskStatus = WAITING_REVIEW`, `SyncStatus = SYNCED`.
   - Đồng bộ thất bại: `TaskStatus = IN_PROGRESS`, `SyncStatus = SYNC_FAILED`.
4. **Chiếu Lịch Sử Chăm Sóc (CareHistory Projection):**
   - CHỈ sinh ra từ task **`COMPLETED`**. Tuyệt đối không sinh ra từ task đang chạy hay task bị `CANCELLED`.

---

## 13. Khóa Cứng Định Danh Cây & Chính Sách (Tree Identity & Policy Freeze)

1. **Định Danh Cây Xanh:**
   - Mã `treeId`: Duy nhất toàn cục và bất biến vĩnh viễn (`immutable`). `Task.treeId` bất biến sau khi tạo việc.
   - Mã `qrCode`: Duy nhất toàn cục, có thể cấp đổi có kiểm soát (`ReplaceTreeQrCode`) khi tem hỏng mà không làm đổi `treeId` và không làm đổi lịch sử quét mã task cũ.
   - Tọa độ chuẩn trắc địa: Hợp lệ định dạng/dải đo, có thể cập nhật có kiểm soát (`UpdateCanonicalCoordinates`), không phải khóa duy nhất toàn cục.
2. **Chính Sách Lâm Sinh:**
   - `TaskTypeCatalog`: Danh mục kiểm toán (`Audit-only`). Bắt buộc gắn với `ProofProfile` được duyệt trước khi cho phép Quản lý chọn tạo việc.
   - `ProofPolicyMapping` & `ChecklistTemplate`: Quản lý theo phiên bản (`Versioned Policy Resource`). Ban hành phiên bản mới không áp dụng hồi tố lên các task đang chạy.

---

## 14. Khóa Cứng Danh Mục Phân Quyền & Lệnh Hợp Nhất (Authorization & Command Freeze)

$$\text{ACTION ELIGIBILITY} = \text{ACTOR ROLE} \land \text{RESOURCE SCOPE} \land \text{DOMAIN STATE} \land \text{BUSINESS PRECONDITIONS}$$

- **Phạm vi thẩm quyền:**
  - Field Staff: Ràng buộc theo tài nguyên được giao (`task.assignedStaffId == actor.userId`).
  - Operations Manager: Phạm vi vận hành ủy quyền (`AUTHORIZED_OPERATIONAL_SCOPE`).
  - Platform Administrator: Phạm vi quản trị nền tảng (`PLATFORM_GOVERNANCE_SCOPE`).
  - System: Tự động hóa tất định, không suy xét chủ quan.
- **Danh mục phân quyền đóng băng (Authorization Provenance):**
  - **22 Lệnh Vận hành Chuẩn tắc (`OP-01..OP-22`):** Độ bao phủ đạt 22/22 (Khớp 100% Quyết định 07, `ViewAssignedTask` Quản lý ALLOW, `ViewCareHistory` phục hồi).
  - **22 Hành vi Quản trị Chuẩn tắc (`GV-01..GV-22`):** Độ bao phủ đạt 22/22 (19 MVP, 2 NEXT, 1 REJECTED).
  - **5 Lệnh RTM Bổ sung:** `ReportLocationException`, `ReportIdentityException`, `LookupTreeByQr`, `ProjectCareHistory`, `ResetCredentialSetup`.
  - **Tổng hợp danh mục lệnh độc nhất toàn hệ thống:** **Đúng 49 lệnh độc nhất**.

---

## 15. Khóa Cứng Ma Trận Truy Vết RTM & Tiêu Chí Nghiệm Thu (RTM Freeze)

- **43 Yêu Cầu Nghiệp Vụ Chuẩn Tắc:** Định danh duy nhất 100% (`BR-01..13`, `BR-ACT-01`, `BR-ADM-01..13`, `BR-DOM-01..04`).
- **43 Tiêu Chí Nghiệm Thu Nhị Phân (Binary Acceptance Oracles):** Cài đặt tất định tại Báo cáo Phase 7 (`Report 10 §6..§9`), độc lập với công nghệ triển khai.
- Không còn bất kỳ trường giữ chỗ `TO_BE_HARDENED_IN_PHASE_7` nào.

---

## 16. Khóa Cứng Bộ Biểu Đồ Trực Quan Dẫn Xuất (Diagram Suite Freeze)

- **Quy tắc thẩm quyền:** Biểu đồ là **Góc nhìn dẫn xuất (`DERIVED VIEW`)**. Văn bản chuẩn tắc luôn luôn thắng (`Canonical text wins`).
- **Toàn bộ 16 biểu đồ được phân loại và bảo tồn nguyên trạng:**
  - 8 Biểu đồ Active / Proposed: Phản ánh đúng 100% đường cơ sở chuẩn tắc.
  - 5 Biểu đồ Lịch sử (`03, 04, 05, 06, 11`): Bảo tồn nguyên trạng với banner `HISTORICAL / SUPERSEDED — REFERENCE ONLY`.
  - 1 Biểu đồ Hiện trạng As-Is (`09`): Bảo tồn nguyên trạng khuyết tật mã nguồn với banner `AS-IS DEFECT EVIDENCE`.
  - 2 Biểu đồ Kiến trúc hoãn lại (`10, 12`): Mang banner xác nhận quyết định hoãn lại cho Phase 11 ADR.

---

## 17. Danh Mục Các Quyết Định Kỹ Thuật Được Bảo Lưu (Deferred Technical Decisions)

Các khía cạnh sau đây **TUYỆT ĐỐI CHƯA ĐƯỢC QUYẾT ĐỊNH** trong đường cơ sở nghiệp vụ và được **BẢO LƯU NGUYÊN TRẠNG CHO KIẾN TRÚC KỸ THUẬT & ADR TẠI PHASE 11**:
1. Kênh phân phối giao diện cho Admin (Admin Web độc lập hay tích hợp trong Mobile App).
2. Thiết kế kiến trúc kỹ thuật IAM, quản lý Session/Token (JWT, Cookie, Refresh Token rotation).
3. Cơ chế kỹ thuật chống giả mạo nhật ký kiểm toán (Tamper-evidence, mã băm cryptographic, WORM store).
4. Tô-pô tích hợp giữa các Bounded Contexts (REST API, gRPC, Message Broker, Event Bus).
5. Cơ chế lưu trữ vật lý cơ sở dữ liệu (Database dùng chung hay tách biệt, ORM, Table schemas).
6. Hình dạng hợp đồng DTO cụ thể trong thư viện `@novyx/contracts`.
7. Kiến trúc mô-đun mã nguồn và ranh giới package trong monorepo.

---

## 18. Ghi Nhận Khoảng Trống Triển Khai Mã Nguồn Hiện Tại (Known Post-ADR Implementation Gaps)

Kiểm toán xác nhận đường cơ sở nghiệp vụ đạt chuẩn `PASS` trong khi mã nguồn hiện tại (`apps/` và `packages/`) vẫn tồn tại các khoảng trống kỹ thuật As-Is. Đây là đối tượng xử lý của **Giai đoạn Triển khai Sau ADR (Post-ADR Implementation)**, hoàn toàn không phải lỗi chặn của Phase 10:
- Mã nguồn mobile hiện tại ép tài khoản `admin` nhận persona `manager` do thiếu kênh quản trị Admin.
- Tầng hợp đồng DTO chưa phân tách đầy đủ các trường trạng thái của 7 bước vòng đời.
- Thiếu các middleware gác cổng phân quyền tại API backend.
- Mã nguồn client chưa tách bạch triệt để `LocalSubmissionStatus = PENDING_SYNC` và `SyncStatus`.

---

## 19. Bảng Kê Khai Tài Liệu Đường Cơ Sở Đóng Băng (Baseline Manifest)

| Nhóm Tài Liệu | Tệp Tài Liệu | Vai trò & Thẩm quyền | Trạng thái Đóng băng |
| :--- | :--- | :--- | :---: |
| **Canonical Business Documents** | `docs/PRODUCT.md` | Bản đặc tả sản phẩm, vai trò, năng lực & phạm vi | **FROZEN** |
| | `docs/DOMAIN.md` | Kiến trúc miền, Bounded Contexts, Bất biến nghiệp vụ | **FROZEN** |
| | `docs/ACCESS-CONTROL.md` | Ma trận phân quyền, điều kiện bảo vệ & SoD | **FROZEN** |
| | `docs/WORKFLOWS.md` | 18 Quy trình nghiệp vụ, vòng đời 7 trạng thái & phục hồi lỗi | **FROZEN** |
| | `docs/REQUIREMENTS-TRACEABILITY.md` | Ma trận truy vết 43 yêu cầu, DoR/DoD & Oracles | **FROZEN** |
| **Derived Visual Diagrams** | `docs/diagrams/README.md` | Danh mục chỉ mục 16 biểu đồ & kỷ luật derived view | **FROZEN** |
| | `docs/diagrams/*.html` (16 tệp) | 16 Biểu đồ trực quan (Active, Proposed, As-Is, Historical) | **FROZEN** |
| **Reconciliation Evidence** | `00-BASELINE-SNAPSHOT.md` đến `12-BUSINESS-CONSISTENCY-AUDIT.md` | 13 Hồ sơ bằng chứng quyết định & kiểm toán độc lập | **FROZEN** |
| **Project Governance** | `docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md` | Kế hoạch tổng thể điều chỉnh đường cơ sở | **FROZEN** |

---

## 20. Bảng Băm Toàn Vẹn Tệp Tin Đóng Băng (File Integrity Hash Manifest)

Bảng giá trị băm mật mã học SHA-256 xác lập bằng chứng đóng băng vĩnh viễn của toàn bộ các tài liệu cốt lõi tại commit `154d76d6049180a604d672122ab2bba7273bcdbe`:

| Đường dẫn tệp tài liệu | Giá trị băm mật mã học (SHA-256 Checksum) |
| :--- | :--- |
| `docs/PRODUCT.md` | `103a58e46fc56bd118db681896c4955bfe485ca9ab0eb95906955005cc191d9f` |
| `docs/DOMAIN.md` | `9846073ad2ac1da07298b68ef36264205d3b1cc8b939c530537f623b1ff8c9af` |
| `docs/ACCESS-CONTROL.md` | `eee6afa070cba609bf4a8ab7bdf8d6d22a7c15b166bbb30a3a0e031d6c435427` |
| `docs/WORKFLOWS.md` | `983f6171d06b42b34bb66b730972b789760c12ec469fee54d2fa43df957c25f3` |
| `docs/REQUIREMENTS-TRACEABILITY.md` | `c6056d3fcbbdaaf8087dae3ebb36ced6948b943c436e742ddd345da9440e0cc7` |
| `docs/diagrams/README.md` | `d715536bcbeae1af6e0b48e28eac05883e064e35907ff370789de6a3c772286a` |
| `docs/business-reconciliation/00-BASELINE-SNAPSHOT.md` | `334b8323556e8fcf48794e6c2cf91b0b42b88c6135eaa34962755d35fff8863b` |
| `docs/business-reconciliation/01-BUSINESS-GAP-REGISTER.md` | `e301dc5eea6050772d62a5f5332b6a994f5e2219673a74f1acda2e77bcfaa54e` |
| `docs/business-reconciliation/02-ACTOR-MODEL-DECISION.md` | `676efeeab22fbff7a6872480cb2759c7934d2602798a0b9b72da6b22930156a8` |
| `docs/business-reconciliation/03-ROLE-NAMING-TAXONOMY.md` | `82b6045cc58f2505cc03b0bb3c3e18699e64f3a8cf76c3fb97744b01275cf62a` |
| `docs/business-reconciliation/04-ADMIN-BUSINESS-SCOPE-DECISION.md` | `779e216fe62308fc45187c2c822d894c53cb85547d632f3dc520ae0f2911ec0a` |
| `docs/business-reconciliation/05-DOMAIN-OWNERSHIP-MATRIX.md` | `9c6e06d081275e6ff3d175bd03a21798ee57ae919a915818f7b1570d4741fde3` |
| `docs/business-reconciliation/06-BOUNDED-CONTEXT-DECISIONS.md` | `98616698d6a77c64447ca143cad48217c9774a2c5171c90d297d2ceeeb457683` |
| `docs/business-reconciliation/07-AUTHORIZATION-ACTION-ELIGIBILITY.md` | `8e54e1dabbb09e1905d968e5cf55d33bebe9589197d9df282879422961aa8eb1` |
| `docs/business-reconciliation/08-WORKFLOW-OPTIMIZATION.md` | `8c557858f84f764de0e8a736f64a369041221e8499e6804b3c08d79431b96875` |
| `docs/business-reconciliation/09-CANONICAL-DOCUMENT-RECONCILIATION-REPORT.md` | `680a3e10967cda33d023bb3e7ba2beab80a6d04aab09f801394d325194c7d629` |
| `docs/business-reconciliation/10-RTM-ACCEPTANCE-ORACLE-REPORT.md` | `7efb5310b78ccb162929f25c32bb00082f7e724664c360f3377afca8d8409a36` |
| `docs/business-reconciliation/11-DIAGRAM-SUITE-RECONCILIATION-REPORT.md` | `3e69688e04496dc5dcd2669974e48a4d26569c4e9396b329e2d945a8855111f5` |
| `docs/business-reconciliation/12-BUSINESS-CONSISTENCY-AUDIT.md` | `ea205719c1e7d8b4312042664cdf9aa5d823831ee369b76dc753a8b9308b50ca` |

---

## 21. Báo Cáo Ranh Giới Mã Nguồn (Source Boundary Verification)

Kiểm tra nghiêm ngặt tính bất biến của hệ thống trước khi đóng mốc:
- `git diff --name-only 154d76d6049180a604d672122ab2bba7273bcdbe HEAD -- apps packages` $\to$ **0 diff** (Mã nguồn ứng dụng bất biến).
- `git diff --name-only 154d76d6049180a604d672122ab2bba7273bcdbe HEAD -- docs/PRODUCT.md docs/DOMAIN.md docs/ACCESS-CONTROL.md docs/WORKFLOWS.md docs/REQUIREMENTS-TRACEABILITY.md` $\to$ **0 diff** (Tài liệu nghiệp vụ chuẩn tắc bất biến).
- `git diff --name-only 154d76d6049180a604d672122ab2bba7273bcdbe HEAD -- docs/diagrams` $\to$ **0 diff** (Bộ biểu đồ dẫn xuất bất biến).
- `git diff --name-only 154d76d6049180a604d672122ab2bba7273bcdbe HEAD -- docs/ARCHITECTURE.md docs/NFR.md docs/TESTING.md DESIGN.md` $\to$ **0 diff** (Tài liệu kỹ thuật bất biến).
- `git diff --check` $\to$ **Clean (0 whitespace errors)**.
- `npm run typecheck --workspace @novyx/mobile` $\to$ **PASS**.

---

## 22. Bàn Giao Cho Phase 11 — Technical Architecture / ADR (Phase-11 Handoff)

1. **Ý Nghĩa Pháp Lý Của Việc Đóng Băng:**
   - Kể từ thời điểm này, toàn bộ đường cơ sở nghiệp vụ Phase 0–10 được coi là **ĐÓNG BĂNG VĨNH VIỄN (FROZEN)**.
   - Mọi thay đổi nghiệp vụ trong tương lai bắt buộc phải thông qua quy trình **Yêu Cầu Thay Đổi Nghiệp Vụ Chính Thức (Formal Business Change Request)** kèm theo phân tích tác động và đồng bộ lại tài liệu chuẩn tắc / RTM / biểu đồ.
   - Tuyệt đối không được tự ý sửa đổi ngữ nghĩa nghiệp vụ trong quá trình thiết kế kiến trúc hay lập trình ứng dụng.
2. **Nội Dung Chuyển Giao Cho Phase 11:**
   - **Phase 11 bắt đầu khi có sự phê duyệt độc lập của Owner.**
   - Nhiệm vụ của Phase 11 là giải quyết dứt điểm các quyết định kiến trúc kỹ thuật (**ADRs**) được liệt kê tại Mục 17 (Kênh triển khai Admin, IAM technical design, Audit persistence, DTO contract shape, Database & Network topology).
   - Giai đoạn lập trình mã nguồn (**Post-ADR Implementation**) chỉ được phép bắt đầu sau khi các văn bản ADR được phê duyệt chính thức.

---

## KẾT LUẬN & TRẠNG THÁI CUỐI CÙNG (FINAL STATUS)

```text
BUSINESS BASELINE RECONCILIATION PASS
— 3-ROLE ACTOR MODEL ESTABLISHED
— ADMIN GOVERNANCE SCOPE LOCKED
— DIAGRAMS RECONCILED
— READY FOR TECHNICAL ARCHITECTURE
```
