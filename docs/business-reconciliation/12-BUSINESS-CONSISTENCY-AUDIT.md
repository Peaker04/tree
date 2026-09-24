# BÁO CÁO KIỂM TOÁN TÍNH NHẤT QUÁN NGHIỆP VỤ (BUSINESS CONSISTENCY AUDIT REPORT)
## NOVYX GREENOPS — BASELINE RECONCILIATION PHASE 9 (AUDIT EVIDENCE RE-VERIFIED)

> **Mã tài liệu:** `docs/business-reconciliation/12-BUSINESS-CONSISTENCY-AUDIT.md`
> **Trạng thái:** `APPROVED & COMPLETED (EVIDENCE CORRECTED & RE-AUDITED)`
> **Giai đoạn:** Phase 9 — Final Business Consistency Audit
> **Đường cơ sở đầu vào:** Commit `86b0bed715f0c1b9160fb18e6db58a7396d22f2e` (Phase 8 Semantic Closure)
> **Căn cứ đối soát tối cao:** [PRODUCT.md](file:///d:/ki7/EXE/tree/docs/PRODUCT.md), [DOMAIN.md](file:///d:/ki7/EXE/tree/docs/DOMAIN.md), [ACCESS-CONTROL.md](file:///d:/ki7/EXE/tree/docs/ACCESS-CONTROL.md), [WORKFLOWS.md](file:///d:/ki7/EXE/tree/docs/WORKFLOWS.md), [REQUIREMENTS-TRACEABILITY.md](file:///d:/ki7/EXE/tree/docs/REQUIREMENTS-TRACEABILITY.md), và Quyết định phân quyền chuẩn tắc [07-AUTHORIZATION-ACTION-ELIGIBILITY.md](file:///d:/ki7/EXE/tree/docs/business-reconciliation/07-AUTHORIZATION-ACTION-ELIGIBILITY.md).

---

## 1. Phạm Vi Kiểm Toán (Scope)

Phase 9 là bước kiểm toán độc lập cuối cùng của chuỗi điều chỉnh đường cơ sở nghiệp vụ (**Business Baseline Reconciliation**), chịu trách nhiệm rà soát toàn diện tính nhất quán ngữ nghĩa xuyên suốt giữa:
1. **Bộ tài liệu nghiệp vụ chuẩn tắc (Canonical Business Documents):**
   - [PRODUCT.md](file:///d:/ki7/EXE/tree/docs/PRODUCT.md)
   - [DOMAIN.md](file:///d:/ki7/EXE/tree/docs/DOMAIN.md)
   - [ACCESS-CONTROL.md](file:///d:/ki7/EXE/tree/docs/ACCESS-CONTROL.md)
   - [WORKFLOWS.md](file:///d:/ki7/EXE/tree/docs/WORKFLOWS.md)
   - [REQUIREMENTS-TRACEABILITY.md](file:///d:/ki7/EXE/tree/docs/REQUIREMENTS-TRACEABILITY.md)
2. **Bộ quyết định chuẩn tắc đã đóng băng (Frozen Reconciliation Decisions 02–11):**
   - Đặc biệt là ma trận phân quyền đông cứng tại [07-AUTHORIZATION-ACTION-ELIGIBILITY.md](file:///d:/ki7/EXE/tree/docs/business-reconciliation/07-AUTHORIZATION-ACTION-ELIGIBILITY.md) và báo cáo nghiệm thu [10-RTM-ACCEPTANCE-ORACLE-REPORT.md](file:///d:/ki7/EXE/tree/docs/business-reconciliation/10-RTM-ACCEPTANCE-ORACLE-REPORT.md).
3. **Bộ biểu đồ trực quan dẫn xuất (Derived Diagram Suite):**
   - 16 biểu đồ trực quan tại thư mục `docs/diagrams/` và tệp chỉ mục [README.md](file:///d:/ki7/EXE/tree/docs/diagrams/README.md).

### Các ranh giới cấm trong Phase 9:
- **Không tái thiết kế (No Redesign):** Không đề xuất mô hình vai trò mới, không mở rộng luồng nghiệp vụ ngoài phạm vi đã đóng băng.
- **Không tự ý sửa văn bản chuẩn tắc:** Nếu phát hiện mâu thuẫn chặn (`BLOCKING`), phải dừng lại báo cáo (`STOP`), không tự sửa.
- **Không lập trình ứng dụng:** Toàn bộ thư mục `apps/` và `packages/` được bảo vệ bất biến.
- **Không can thiệp kiến trúc triển khai:** Các quyết định kỹ thuật của Phase 11 ADR được giữ nguyên trạng hoãn lại (`DEFERRED_UNTIL_ADR`).

---

## 2. Đường Cơ Sở Đóng Băng Đầu Vào (Frozen Phase-8 Baseline)

Kiểm toán được thực thi trên nền tảng commit đóng băng của Phase 8 Semantic Closure:
- **HEAD Commit Hash:** `86b0bed715f0c1b9160fb18e6db58a7396d22f2e`
- **Tree Hash:** `7a0602391edee29714438d48ac27ae4b37038610`
- **Tình trạng nhánh `base-setup`:** Đồng bộ sạch hoàn toàn (`CLEAN`, không có tệp dư thừa, không có uncommitted changes).
- **Lịch sử đóng băng trước đó:**
  - Phase 1–5: Frozen at commit `550f9cdba681b1de0f717573afbb28c79d0217e7`
  - Phase 6: Frozen at commit `86e0df7e2d9820518da67d92d42ab6bbf60d0057`
  - Phase 7: Frozen at commit `11ac66f7517cb28cbefec2b5b66078c06d483927`
  - Phase 8 Closure: Frozen at commit `86b0bed715f0c1b9160fb18e6db58a7396d22f2e`

---

## 3. Hệ Cấp Thẩm Quyền Tài Liệu (Authority Hierarchy)

Hệ thống tuân thủ trật tự ưu tiên thẩm quyền chuẩn tắc:

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
│    Báo cáo quyết định Phase 1–8 (Decisions 02–11)           │
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

> **Quy tắc phán xử mâu thuẫn:**
> - Văn bản chuẩn tắc thắng (`Canonical text wins`).
> - Biểu đồ chỉ là góc nhìn dẫn xuất (`Derived View`), không bao giờ là nguồn tạo chân lý nghiệp vụ.
> - Biểu đồ lịch sử hoặc hiện trạng As-Is không bị coi là lỗi mâu thuẫn nếu đã mang đầy đủ banner cảnh báo phân loại chuẩn xác.

---

## 4. Kết Quả Kiểm Tra Tự Động & Thống Kê Danh Mục Lệnh (Machine Check & Inventories)

Kiểm toán tự động thông qua các script phân tích tĩnh tất định trên toàn bộ kho tài liệu chuẩn tắc và biểu đồ dẫn xuất:

### 4.1. Bảng Kết Quả Quét Tĩnh Ngữ Nghĩa (Static Scan Results)

| Danh mục kiểm tra | Tiêu chí tìm kiếm | Tổng phát hiện | Phân loại hợp lệ (Valid) | Phân loại lịch sử (Historical) | Mâu thuẫn chặn (Blocking Defect) | Kết quả |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Vai trò lỗi thời / Tha hóa** | `Super Admin`, `Owner`, `Security Approver`, `Employee`, `Worker`, `Supervisor`, `future-only Admin`, `Admin = Manager`, `non-staff = Manager` | 30 | 30 (`Single-Context Ownership`, SVG `data-owner-id`, "Owner: Manager") | 0 | 0 | **PASS** |
| **Từ khóa Admin Reserved** | `admin reserved`, `Admin RESERVED`, `OUT_OF_MVP`, `OUT OF MVP` | 0 | 0 | 0 | 0 | **PASS** |
| **Bí danh lệnh không chuẩn tắc** | `ReviewApprove`, `ReviewApproveWithException`, `ReviewRequestRework`, `InspectAuditTrail`, `ExportAuditReport` | 0 | 0 | 0 | 0 | **PASS** |
| **Trạng thái TaskStatus ngoài luồng** | `OFFLINE_SUBMITTED`, `COMPLETED_WITH_EXCEPTION`, `ADMIN_CANCELLED`, `STAFF_UNAVAILABLE` | 5 | 5 (100% là điều khoản cấm rõ ràng trong [DOMAIN.md](file:///d:/ki7/EXE/tree/docs/DOMAIN.md) và [WORKFLOWS.md](file:///d:/ki7/EXE/tree/docs/WORKFLOWS.md)) | 0 | 0 | **PASS** |
| **Bí danh token viết tắt REWORK** | `REWORK` độc lập làm giá trị TaskStatus trong ma trận | 0 | 0 | 0 | 0 | **PASS** |
| **Định danh năng lực Quản trị** | `CAP-ADM-01` đến `CAP-ADM-14` | 71 | 71 (Khớp 9 MVP, 3 NEXT, 1 REJECTED, 0 RESERVED, 0 CAP-ADM-14) | 0 | 0 | **PASS** |
| **Tính toàn vẹn liên kết nội bộ** | 347 liên kết markdown và URL `file:///` trong `docs/` | 347 | 347 tồn tại hợp lệ trên đĩa | 0 | 0 | **PASS** |
| **Kiểm kê Biểu đồ (Inventory)** | So khớp danh mục tệp `*.html` và [README.md](file:///d:/ki7/EXE/tree/docs/diagrams/README.md) | 16 | 16 tệp đĩa khớp 100% 16 mục catalog | 0 | 0 | **PASS** |

---

### 4.2. Danh Mục Lệnh Phân Quyền Vận Hành Chuẩn Tắc (Frozen Operational Action Inventory OP-01..OP-22)

Nguồn xác thực: [07-AUTHORIZATION-ACTION-ELIGIBILITY.md](file:///d:/ki7/EXE/tree/docs/business-reconciliation/07-AUTHORIZATION-ACTION-ELIGIBILITY.md) (Mục 4 & 7).
Đảm bảo độ bao phủ chính xác **22 / 22 hành vi vận hành chuẩn tắc**:

| Mã OP | Tên Hành vi Vận hành (Canonical Action) | Field Staff | Operations Manager | Platform Admin | System | Có trong P9? | Khớp 100%? |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **OP-01** | `ViewAssignedTask` | **ALLOW** (Giao cho mình) | **ALLOW** (`AUTHORIZED_OPERATIONAL_SCOPE`) | **DENY** | **N/A** | **CÓ** | **PASS** |
| **OP-02** | `ViewOperationalTask` | **DENY** | **ALLOW** (`AUTHORIZED_OPERATIONAL_SCOPE`) | **DENY** | **N/A** | **CÓ** | **PASS** |
| **OP-03** | `CreateTask` | **DENY** | **ALLOW** | **DENY** | **DENY** | **CÓ** | **PASS** |
| **OP-04** | `AssignTask` | **DENY** | **ALLOW** | **DENY** | **DENY** | **CÓ** | **PASS** |
| **OP-05** | `StartTask` | **ALLOW** (Đúng người nhận) | **DENY** | **DENY** | **DENY** | **CÓ** | **PASS** |
| **OP-06** | `VerifyGps` | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ đọc) | **DENY** | **ALLOW** (Tính toán) | **CÓ** | **PASS** |
| **OP-07** | `VerifyQr` | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ đọc) | **DENY** | **ALLOW** (Khớp mã) | **CÓ** | **PASS** |
| **OP-08** | `ReportFieldIssue` | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ duyệt xử lý) | **DENY** | **N/A** | **CÓ** | **PASS** |
| **OP-09** | `ResumeBlockedTask` | **DENY** | **ALLOW** | **DENY** | **DENY** | **CÓ** | **PASS** |
| **OP-10** | `ReassignTask` | **DENY** | **ALLOW** | **DENY** | **DENY** | **CÓ** | **PASS** |
| **OP-11** | `CancelTask` | **DENY** | **ALLOW** | **DENY** | **DENY** | **CÓ** | **PASS** |
| **OP-12** | `CaptureProofEvidence` | **ALLOW** (Đúng người nhận) | **DENY** | **DENY** | **N/A** | **CÓ** | **PASS** |
| **OP-13** | `CompleteChecklist` | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ đọc) | **DENY** | **N/A** | **CÓ** | **PASS** |
| **OP-14** | `RecordStructuredFindings` | **ALLOW** (Đúng người nhận) | **DENY** (Chỉ đọc) | **DENY** | **N/A** | **CÓ** | **PASS** |
| **OP-15** | `SubmitEvidence` | **ALLOW** (Đúng người nhận) | **DENY** | **DENY** | **ALLOW** (Xác nhận mạng) | **CÓ** | **PASS** |
| **OP-16** | `ViewReviewQueue` | **DENY** | **ALLOW** | **DENY** | **N/A** | **CÓ** | **PASS** |
| **OP-17** | `ReviewTask` | **DENY** | **ALLOW** | **DENY** | **N/A** | **CÓ** | **PASS** |
| **OP-18** | `ApproveTask` | **DENY** | **ALLOW** | **DENY** | **DENY** | **CÓ** | **PASS** |
| **OP-19** | `ApproveWithException` | **DENY** | **ALLOW** | **DENY** | **DENY** | **CÓ** | **PASS** |
| **OP-20** | `RequestRework` | **DENY** | **ALLOW** | **DENY** | **DENY** | **CÓ** | **PASS** |
| **OP-21** | `ResubmitRework` | **ALLOW** (Đúng người nhận) | **DENY** | **DENY** | **ALLOW** (Xác nhận mạng) | **CÓ** | **PASS** |
| **OP-22** | `ViewCareHistory` | **ALLOW** (Cây được giao) | **ALLOW** (`AUTHORIZED_OPERATIONAL_SCOPE`) | **ALLOW** (`PLATFORM_GOVERNANCE_SCOPE`) | **N/A** | **CÓ** | **PASS** |

> **Ghi chú quan trọng:** Quyền xem `ViewAssignedTask` đối với Quản lý được thiết lập là `ALLOW` trong phạm vi `AUTHORIZED_OPERATIONAL_SCOPE` nhằm đảm bảo Quản lý giám sát được tiến độ của nhân viên cấp dưới. Quyền đọc `ViewCareHistory` của Admin là quyền chỉ đọc phục vụ giám sát, hoàn toàn không trao quyền đột biến nhiệm vụ hay cây xanh.

---

### 4.3. Danh Mục Hành Vi Quản Trị Nền Tảng Chuẩn Tắc (Frozen Governance Action Inventory GV-01..GV-22)

Nguồn xác thực: [07-AUTHORIZATION-ACTION-ELIGIBILITY.md](file:///d:/ki7/EXE/tree/docs/business-reconciliation/07-AUTHORIZATION-ACTION-ELIGIBILITY.md) (Mục 7.2 & 7.3).
Đảm bảo bao phủ **22 / 22 hành vi quản trị nền tảng** phân định rõ ranh giới MVP, NEXT, và REJECTED:

> **Phân định rõ ràng giữa Token Lịch Sử Phase 4 và Chiếu Chuẩn Tắc Hiện Tại:**
> - Trong quyết định lịch sử Phase 4 ([07-AUTHORIZATION-ACTION-ELIGIBILITY.md](file:///d:/ki7/EXE/tree/docs/business-reconciliation/07-AUTHORIZATION-ACTION-ELIGIBILITY.md)), khe `GV-07` mang token `RecoverAccount`.
> - Trong văn bản chuẩn tắc hiện tại ([ACCESS-CONTROL.md](file:///d:/ki7/EXE/tree/docs/ACCESS-CONTROL.md) Bảng 4.1 và [REQUIREMENTS-TRACEABILITY.md](file:///d:/ki7/EXE/tree/docs/REQUIREMENTS-TRACEABILITY.md) `BR-ADM-04`), hành vi này đã được chuẩn hóa đồng bộ thành **`ResetCredentialSetup`** (Cấp lại liên kết thiết lập thông tin xác thực an toàn). Token lịch sử `RecoverAccount` được bảo lưu nguyên vẹn trong Quyết định 07 như chứng tích lịch sử và được chiếu chuẩn tắc thành `ResetCredentialSetup` trong đường cơ sở hiện tại.

| Mã GV | Tên Hành vi Quản trị (Canonical Action) | Field Staff | Operations Manager | Platform Admin | Phân loại & Ranh giới | Ngữ cảnh sở hữu |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **GV-01** | `ProvisionUser` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-01`) | Identity & Access Management |
| **GV-02** | `AssignRole` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-02`) | Identity & Access Management |
| **GV-03** | `ActivateAccount` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-03`) | Identity & Access Management |
| **GV-04** | `SuspendAccount` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-03`) | Identity & Access Management |
| **GV-05** | `DisableAccount` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-03`) | Identity & Access Management |
| **GV-06** | `UnlockAccount` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-04`) | Identity & Access Management |
| **GV-07** | `ResetCredentialSetup` *(Token lịch sử: `RecoverAccount`)* | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-04`) | Identity & Access Management |
| **GV-08** | `ViewAuditLog` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-05`) | Audit & Compliance |
| **GV-09** | `FilterAuditLog` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-05`) | Audit & Compliance |
| **GV-10** | `CreateTree` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-06`) | Tree Asset Registry |
| **GV-11** | `UpdateTreeMasterData` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-06`) | Tree Asset Registry |
| **GV-12** | `ReplaceTreeQrCode` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-06`) | Tree Asset Registry |
| **GV-13** | `UpdateCanonicalCoordinates` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-06`) | Tree Asset Registry |
| **GV-14** | `RetireTree` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-06`) | Tree Asset Registry |
| **GV-15** | `CreateTaskType` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-07`) | Policy & Template Governance |
| **GV-16** | `ActivateTaskType` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-07`) | Policy & Template Governance |
| **GV-17** | `DeactivateTaskType` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-07`) | Policy & Template Governance |
| **GV-18** | `PublishProofPolicyVersion` | DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-08`) | Policy & Template Governance |
| **GV-19** | `PublishChecklistTemplateVersion`| DENY | DENY | **ALLOW** | **MVP** (`CAP-ADM-09`) | Policy & Template Governance |
| **GV-20** | `ManageDynamicFindingsTemplate` | DENY | DENY | **DENY (MVP) / NEXT** | **NEXT** (`CAP-ADM-10`) | Policy & Template Governance |
| **GV-21** | `UseBreakGlass` | DENY | DENY | **DENY (MVP) / NEXT** | **NEXT** (`CAP-ADM-11`) | Governance Plane |
| **GV-22** | `ManagePlatformSystemConfig` | DENY | DENY | **DENY** | **REJECTED** (`CAP-ADM-13`) | N/A (Bị loại bỏ) |

---

### 4.4. Danh Mục Lệnh Xuất Hiện Tường Minh Trong RTM (Explicit RTM Command Inventory)

Nguồn xác thực: [REQUIREMENTS-TRACEABILITY.md](file:///d:/ki7/EXE/tree/docs/REQUIREMENTS-TRACEABILITY.md).
RTM định nghĩa 43 yêu cầu với **37 tên token lệnh tường minh**:
- 33 lệnh trùng khớp hoàn toàn với các định danh trong `OP-xx` và `GV-xx` (bao gồm `ResetCredentialSetup` ứng với khe `GV-07`).
- **4 lệnh xuất hiện tường minh trong RTM mang tính bổ sung (không mang mã OP/GV độc lập):**
  1. `ReportLocationException` (`BR-01b` — Báo cáo ngoại lệ vị trí thực địa khi GPS $> 10$m)
  2. `ReportIdentityException` (`BR-02b` — Báo cáo ngoại lệ danh tính tem QR bị hỏng/mất)
  3. `LookupTreeByQr` (`BR-13` — Tra cứu nhanh hồ sơ cây xanh qua quét mã QR)
  4. `ProjectCareHistory` (`BR-11` — Tự động chiếu dữ liệu lịch sử chăm sóc từ task `COMPLETED`)

---

### 4.5. Phép Hợp Nhất & Khử Trùng Lặp Danh Mục Lệnh (Union Deduplicated Command Registry)

Bằng phương pháp hợp nhất và đối soát khử trùng lặp định danh giữa hai tập hợp:
$$\text{Union Unique Commands} = \{\text{Frozen Canonical Authorization Actions (44)}\} \cup \{\text{Canonical RTM Commands (37)}\}$$

Thống kê chính xác từ script phân tích tự động:
- **Số lượng hành vi phân quyền đóng băng (Authorization Actions):** **44** (22 Vận hành `OP-01..22` + 22 Quản trị `GV-01..22`, với `GV-07` được chiếu chuẩn tắc là `ResetCredentialSetup`)
- **Số lượng token lệnh tường minh trong RTM (RTM Explicit Commands):** **37**
- **Số lượng lệnh độc nhất trong toàn hệ thống (Union Unique Commands):** **48**

```text
TỔNG SỐ LỆNH VẬN HÀNH OP-01..22:       22
TỔNG SỐ HÀNH VI QUẢN TRỊ GV-01..22:    22 (19 MVP, 2 NEXT, 1 REJECTED — GV-07: ResetCredentialSetup)
TỔNG SỐ LỆNH RTM BỔ SUNG:              4 (ReportLocationException, ReportIdentityException, LookupTreeByQr, ProjectCareHistory)
--------------------------------------------------
TỔNG SỐ LỆNH HỢP NHẤT ĐỘC NHẤT (UNION): 48
```

> **Ghi chú đối soát F10-01 (Legacy Token Reconciliation):**
> Trong Quyết định 07 (Phase 4), mã `GV-07` sử dụng tên token `RecoverAccount`. Khi đồng bộ tài liệu chuẩn tắc tại Phase 6, hành vi này được định danh thống nhất là `ResetCredentialSetup` (khớp [ACCESS-CONTROL.md](file:///d:/ki7/EXE/tree/docs/ACCESS-CONTROL.md) `CMD-ADM-07` và [REQUIREMENTS-TRACEABILITY.md](file:///d:/ki7/EXE/tree/docs/REQUIREMENTS-TRACEABILITY.md) `BR-ADM-04`). `RecoverAccount` được lưu giữ như một chứng tích kế thừa (legacy token), không phải là lệnh độc lập thứ hai bên cạnh `ResetCredentialSetup`. Do đó, tập hợp lệnh hợp nhất độc nhất toàn hệ thống chuẩn xác là **48 lệnh**.

---

## 5. Kiểm Toán Đăng Ký Tác Nhân (Actor Registry Audit)

Hệ thống xác lập chính xác mô hình **3 vai trò con người** và **1 tác nhân kỹ thuật**:

| Tác nhân (Actor) | Bản chất (Type) | Mặt phẳng nghiệp vụ | Định danh chuẩn tắc (`UserRole`) | Đã định nghĩa? | Nhất quán xuyên suốt? | Ghi chú thẩm quyền |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **Field Staff** | Con người (`Human`) | Tác nghiệp Hiện trường | `staff` | **CÓ** | **CÓ** | Chỉ thao tác trên nhiệm vụ được phân công (`task.assignedStaffId == actor.userId`). Bị cấm toàn bộ thao tác quản trị nền tảng. |
| **Operations Manager** | Con người (`Human`) | Quản lý Tác nghiệp | `manager` | **CÓ** | **CÓ** | Thao tác trong phạm vi vận hành được ủy quyền (`AUTHORIZED_OPERATIONAL_SCOPE`). Tạo việc, giao việc, giải tỏa sự cố, nghiệm thu. Bị cấm thao tác quản trị nền tảng. |
| **Platform Administrator**| Con người (`Human`) | Quản trị Nền tảng | `admin` | **CÓ** | **CÓ** | Thao tác trên 9 năng lực quản trị MVP (`PLATFORM_GOVERNANCE_SCOPE`). Bị **DENY 100%** trên toàn bộ các lệnh tác nghiệp nhiệm vụ hiện trường. |
| **System** | Tự động hóa (`Technical`) | Tự động hóa Kỹ thuật | `N/A` (Không phải `UserRole`) | **CÓ** | **CÓ** | Thực thi các kiểm tra bất biến tất định (`deterministic invariants`), chiếu dữ liệu `CareHistory`, lưu vết `AuditEvent`. Không bao giờ đưa ra quyết định duyệt mang tính chủ quan. |

> **Kết luận:** Tuyệt đối không tồn tại vai trò thứ 4 trong sản phẩm (không có Super Admin, Owner, Employee, Security Approver). Mô hình tác nhân đạt chuẩn 100%.

---

## 6. Ma Trận Quyền Lệnh Hợp Nhất Đầy Đủ (Full Consolidated Role / Action Matrix: 48 Lệnh)

Bảng đối soát ma trận phân quyền thực tế trên toàn bộ **48 lệnh chuẩn tắc** của hệ thống:

| STT | Mã Lệnh / Tên Lệnh | Field Staff | Operations Manager | Platform Admin | System | Ngữ cảnh sở hữu | Tài nguyên miền | Trạng thái phạm vi | Kết quả |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- | :--- | :---: | :---: |
| 1 | `OP-01: ViewAssignedTask` | **ALLOW** | **ALLOW** | DENY | N/A | Work Management | `Task` | MVP | **PASS** |
| 2 | `OP-02: ViewOperationalTask` | DENY | **ALLOW** | DENY | N/A | Work Management | `Task` | MVP | **PASS** |
| 3 | `OP-03: CreateTask` | DENY | **ALLOW** | **DENY** | DENY | Work Management | `Task` | MVP | **PASS** |
| 4 | `OP-04: AssignTask` | DENY | **ALLOW** | **DENY** | DENY | Work Management | `Task` | MVP | **PASS** |
| 5 | `OP-05: StartTask` | **ALLOW** | DENY | **DENY** | DENY | Work Management | `Task` | MVP | **PASS** |
| 6 | `OP-06: VerifyGps` | **ALLOW** | DENY | **DENY** | DETERMINISTIC | Work Management | `SiteVerification` | MVP | **PASS** |
| 7 | `OP-07: VerifyQr` | **ALLOW** | DENY | **DENY** | DETERMINISTIC | Work Management | `SiteVerification` | MVP | **PASS** |
| 8 | `OP-08: ReportFieldIssue` | **ALLOW** | DENY | **DENY** | N/A | Work Management | `FieldIssue` | MVP | **PASS** |
| 9 | `OP-09: ResumeBlockedTask` | DENY | **ALLOW** | **DENY** | DENY | Work Management | `Task` | MVP | **PASS** |
| 10 | `OP-10: ReassignTask` | DENY | **ALLOW** | **DENY** | DENY | Work Management | `Task` | MVP | **PASS** |
| 11 | `OP-11: CancelTask` | DENY | **ALLOW** | **DENY** | DENY | Work Management | `Cancellation` | MVP | **PASS** |
| 12 | `OP-12: CaptureProofEvidence` | **ALLOW** | DENY | **DENY** | N/A | Work Management | `TaskEvidence` | MVP | **PASS** |
| 13 | `OP-13: CompleteChecklist` | **ALLOW** | DENY | **DENY** | N/A | Work Management | `ChecklistSnapshot` | MVP | **PASS** |
| 14 | `OP-14: RecordStructuredFindings` | **ALLOW** | DENY | **DENY** | N/A | Work Management | `StructuredFindings` | MVP | **PASS** |
| 15 | `OP-15: SubmitEvidence` | **ALLOW** | DENY | **DENY** | DETERMINISTIC | Work Management | `Task` | MVP | **PASS** |
| 16 | `OP-16: ViewReviewQueue` | DENY | **ALLOW** | DENY | N/A | Work Management | Hàng đợi thẩm định | MVP | **PASS** |
| 17 | `OP-17: ReviewTask` | DENY | **ALLOW** | **DENY** | N/A | Work Management | `Task` & Bằng chứng | MVP | **PASS** |
| 18 | `OP-18: ApproveTask` | DENY | **ALLOW** | **DENY** | DENY | Work Management | `ReviewDecision` | MVP | **PASS** |
| 19 | `OP-19: ApproveWithException` | DENY | **ALLOW** | **DENY** | DENY | Work Management | `ReviewDecision` | MVP | **PASS** |
| 20 | `OP-20: RequestRework` | DENY | **ALLOW** | **DENY** | DENY | Work Management | `ReworkRequest` | MVP | **PASS** |
| 21 | `OP-21: ResubmitRework` | **ALLOW** | DENY | **DENY** | DETERMINISTIC | Work Management | `Task` | MVP | **PASS** |
| 22 | `OP-22: ViewCareHistory` | **ALLOW** | **ALLOW** | **ALLOW** | N/A | Tree Asset Registry | `CareHistory projection` | MVP | **PASS** |
| 23 | `GV-01: ProvisionUser` | DENY | DENY | **ALLOW** | DENY | Identity & Access | `User` | MVP (CAP-ADM-01) | **PASS** |
| 24 | `GV-02: AssignRole` | DENY | DENY | **ALLOW** | DENY | Identity & Access | `RoleAssignment` | MVP (CAP-ADM-02) | **PASS** |
| 25 | `GV-03: ActivateAccount` | DENY | DENY | **ALLOW** | DENY | Identity & Access | `AccountStatus` | MVP (CAP-ADM-03) | **PASS** |
| 26 | `GV-04: SuspendAccount` | DENY | DENY | **ALLOW** | DENY | Identity & Access | `AccountStatus` | MVP (CAP-ADM-03) | **PASS** |
| 27 | `GV-05: DisableAccount` | DENY | DENY | **ALLOW** | DENY | Identity & Access | `AccountStatus` | MVP (CAP-ADM-03) | **PASS** |
| 28 | `GV-06: UnlockAccount` | DENY | DENY | **ALLOW** | DENY | Identity & Access | `Account` | MVP (CAP-ADM-04) | **PASS** |
| 29 | `GV-07: ResetCredentialSetup` *(Token lịch sử: `RecoverAccount`)* | DENY | DENY | **ALLOW** | DENY | Identity & Access | `Account` | MVP (CAP-ADM-04) | **PASS** |
| 30 | `GV-08: ViewAuditLog` | DENY | DENY | **ALLOW** | DENY | Audit & Compliance | `AuditEvent` | MVP (CAP-ADM-05) | **PASS** |
| 31 | `GV-09: FilterAuditLog` | DENY | DENY | **ALLOW** | DENY | Audit & Compliance | `AuditEvent` | MVP (CAP-ADM-05) | **PASS** |
| 32 | `GV-10: CreateTree` | DENY | DENY | **ALLOW** | DENY | Tree Asset Registry | `Tree` | MVP (CAP-ADM-06) | **PASS** |
| 33 | `GV-11: UpdateTreeMasterData` | DENY | DENY | **ALLOW** | DENY | Tree Asset Registry | `TreeMasterData` | MVP (CAP-ADM-06) | **PASS** |
| 34 | `GV-12: ReplaceTreeQrCode` | DENY | DENY | **ALLOW** | DENY | Tree Asset Registry | `TreeIdentity` | MVP (CAP-ADM-06) | **PASS** |
| 35 | `GV-13: UpdateCanonicalCoordinates`| DENY | DENY | **ALLOW** | DENY | Tree Asset Registry | `TreeMasterData` | MVP (CAP-ADM-06) | **PASS** |
| 36 | `GV-14: RetireTree` | DENY | DENY | **ALLOW** | DENY | Tree Asset Registry | `Tree` | MVP (CAP-ADM-06) | **PASS** |
| 37 | `GV-15: CreateTaskType` | DENY | DENY | **ALLOW** | DENY | Policy & Template | `TaskTypeCatalog` | MVP (CAP-ADM-07) | **PASS** |
| 38 | `GV-16: ActivateTaskType` | DENY | DENY | **ALLOW** | DENY | Policy & Template | `TaskTypeCatalog` | MVP (CAP-ADM-07) | **PASS** |
| 39 | `GV-17: DeactivateTaskType` | DENY | DENY | **ALLOW** | DENY | Policy & Template | `TaskTypeCatalog` | MVP (CAP-ADM-07) | **PASS** |
| 40 | `GV-18: PublishProofPolicyVersion`| DENY | DENY | **ALLOW** | DENY | Policy & Template | `ProofPolicyMapping` | MVP (CAP-ADM-08) | **PASS** |
| 41 | `GV-19: PublishChecklistTemplateVersion` | DENY | DENY | **ALLOW** | DENY | Policy & Template | `ChecklistTemplate` | MVP (CAP-ADM-09) | **PASS** |
| 42 | `GV-20: ManageDynamicFindingsTemplate` | DENY | DENY | **DENY (MVP)** | DENY | Policy & Template | `FindingsSchema` | NEXT (CAP-ADM-10) | **PASS** |
| 43 | `GV-21: UseBreakGlass` | DENY | DENY | **DENY (MVP)** | DENY | Governance Plane | `N/A — Inactive` | NEXT (CAP-ADM-11) | **PASS** |
| 44 | `GV-22: ManagePlatformSystemConfig` | DENY | DENY | **DENY** | DENY | N/A | N/A | REJECTED (CAP-ADM-13) | **PASS** |
| 45 | `RTM-01: ReportLocationException` | **ALLOW** | DENY | **DENY** | DENY | Work Management | `VerificationException` | MVP (BR-01b) | **PASS** |
| 46 | `RTM-02: ReportIdentityException` | **ALLOW** | DENY | **DENY** | DENY | Work Management | `VerificationException` | MVP (BR-02b) | **PASS** |
| 47 | `RTM-03: LookupTreeByQr` | **ALLOW** | **ALLOW** | DENY | DENY | Tree Asset Registry | `Tree, CareHistory` | MVP (BR-13) | **PASS** |
| 48 | `RTM-04: ProjectCareHistory` | DENY | DENY | DENY | **DETERMINISTIC** | Tree Asset Registry | `CareHistory projection` | MVP (BR-11) | **PASS** |

---

## 7. Kiểm Toán Ma Trận Năng Lực Quản Trị (Capability Matrix Audit)

Phân định rạch ròi giữa **Số lượng Năng lực (13 Capabilities)** và **Số lượng Lệnh (Commands)**:
- **9 Năng lực MVP:** `CAP-ADM-01` đến `CAP-ADM-09` (Bao gồm 19 lệnh quản trị MVP `GV-01..19`, trong đó `GV-07` chuẩn hóa là `ResetCredentialSetup`).
- **3 Năng lực NEXT:** `CAP-ADM-10` (Dynamic Findings), `CAP-ADM-11` (Break-Glass), `CAP-ADM-12` (Security Notifications).
- **1 Năng lực BỊ BÁC BỎ (REJECTED):** `CAP-ADM-13` (Platform System Configuration).

| Mã năng lực | Tên năng lực chuẩn tắc | Tác nhân | Ngữ cảnh sở hữu | Tài nguyên quản trị | Trạng thái phạm vi | Danh mục lệnh chuẩn tắc | Kết quả kiểm toán |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| **CAP-ADM-01** | User Provisioning | Platform Admin | Identity & Access Management | `User`, `Account` | **MVP** | `ProvisionUser` | **PASS** |
| **CAP-ADM-02** | Role Assignment | Platform Admin | Identity & Access Management | `RoleAssignment` | **MVP** | `AssignRole` | **PASS** |
| **CAP-ADM-03** | Account Lifecycle | Platform Admin | Identity & Access Management | `AccountStatus` | **MVP** | `SuspendAccount`, `ActivateAccount`, `DisableAccount` | **PASS** |
| **CAP-ADM-04** | Account Recovery / Unlock | Platform Admin | Identity & Access Management | `Account` | **MVP** | `UnlockAccount`, `ResetCredentialSetup` *(Token lịch sử: `RecoverAccount`)* | **PASS** |
| **CAP-ADM-05** | Audit Log Inspection | Platform Admin | Audit & Compliance | `AuditEvent` | **MVP** | `ViewAuditLog`, `FilterAuditLog` | **PASS** |
| **CAP-ADM-06** | Tree Master Data Governance | Platform Admin | Tree Asset Registry | `Tree`, `TreeMasterData`, `TreeIdentity` | **MVP** | `CreateTree`, `UpdateTreeMasterData`, `ReplaceTreeQrCode`, `UpdateCanonicalCoordinates`, `RetireTree` | **PASS** |
| **CAP-ADM-07** | TaskType Catalog Governance | Platform Admin | Policy & Template Governance | `TaskTypeCatalog` | **MVP** | `CreateTaskType`, `ActivateTaskType`, `DeactivateTaskType` | **PASS** |
| **CAP-ADM-08** | Proof Policy Governance | Platform Admin | Policy & Template Governance | `ProofPolicyMapping` | **MVP** | `PublishProofPolicyVersion` | **PASS** |
| **CAP-ADM-09** | Checklist Template Governance | Platform Admin | Policy & Template Governance | `ChecklistTemplate` | **MVP** | `PublishChecklistTemplateVersion` | **PASS** |
| **CAP-ADM-10** | Findings Template Governance | Platform Admin | Policy & Template Governance | `FindingsSchema` | **NEXT** | `ManageDynamicFindingsTemplate` | **PASS** |
| **CAP-ADM-11** | Break-Glass Access | Platform Admin | Governance Plane | `N/A — Inactive` | **NEXT** | `UseBreakGlass` | **PASS** |
| **CAP-ADM-12** | Security & Governance Notifications | System | Audit & Compliance | `AuditEvent` | **NEXT** | `N/A — Event Projection` | **PASS** |
| **CAP-ADM-13** | Platform System Configuration | N/A | N/A | N/A | **REJECTED** | `ManagePlatformSystemConfig` (Bác bỏ) | **PASS** |

---

## 8. Kiểm Toán Ranh Giới Sở Hữu Miền (Domain Ownership Audit)

Đối soát sao chép nguyên trạng phân loại và tài nguyên chuẩn tắc từ [DOMAIN.md](file:///d:/ki7/EXE/tree/docs/DOMAIN.md):

### 8.1. Phân Loại Chuẩn Tắc 5 Ngữ Cảnh Giới Hạn (Canonical Context Classifications)
1. **`Work Management`** $\to$ **`CORE DOMAIN`**
2. **`Tree Asset Registry`** $\to$ **`SUPPORTING SUBDOMAIN`** *(Tuyệt đối không dùng tên sai lệch "Core Asset Context")*
3. **`Policy & Template Governance`** $\to$ **`SUPPORTING SUBDOMAIN`** *(Tuyệt đối không đổi tên thành "Policy & Checklist Templates")*
4. **`Audit & Compliance`** $\to$ **`SUPPORTING SUBDOMAIN`**
5. **`Identity & Access Management (IAM)`** $\to$ **`GENERIC SUBDOMAIN`**

---

### 8.2. Tài Nguyên Sở Hữu Thẩm Quyền Độc Quyền (Canonical Owned Resources)

```text
Identity & Access Management (GENERIC SUBDOMAIN)
 ├── User (Root Aggregate)
 ├── Account (Entity)
 ├── RoleAssignment (Entity)
 └── AccountStatus (Enum: INVITED, ACTIVE, SUSPENDED, DISABLED)
 [Lưu ý: "Session" KHÔNG PHẢI là tài nguyên nghiệp vụ được sở hữu thẩm quyền trong DOMAIN.md]

Tree Asset Registry (SUPPORTING SUBDOMAIN)
 ├── Tree (Root Aggregate)
 ├── TreeMasterData (Entity)
 ├── TreeIdentity (Value Object: treeId immutable, qrCode unique/mutable)
 └── CareHistory projection (Derived Read-Model Projection từ các task COMPLETED)

Work Management (CORE DOMAIN)
 ├── Task (Root Aggregate - 7 states)
 ├── TaskAssignment (Value Object)
 ├── TaskLifecycle (Value Object)
 ├── SiteVerification (Value Object)
 ├── VerificationException (Value Object: LOCATION_EXCEPTION, IDENTITY_EXCEPTION)
 ├── FieldIssue (Entity)
 ├── TaskEvidence (Value Object)
 ├── EvidenceAttempt (Entity - Multi-version submission attempts)
 ├── StructuredFindings (Value Object - Khám bệnh cây có cấu trúc)
 ├── ChecklistSnapshot (Value Object - Bản chụp snapshot biểu mẫu kiểm tra)
 ├── ReviewDecision (Value Object - 4 kết luận thẩm định)
 ├── ReworkRequest (Value Object)
 └── Cancellation (Value Object)
 [Lưu ý: "ProofProgress" là chiều trạng thái độc lập (State Dimension), KHÔNG PHẢI Entity miền độc lập]

Policy & Template Governance (SUPPORTING SUBDOMAIN)
 ├── TaskTypeCatalog (Audit-only Resource)
 ├── ProofPolicyMapping (Versioned Policy Resource)
 ├── ChecklistTemplate (Versioned Resource)
 └── FindingsSchema (Policy Resource - Cố định trong MVP, Dynamic là NEXT)

Audit & Compliance (SUPPORTING SUBDOMAIN)
 └── AuditEvent (Domain Event - Append-only Record / Bất biến ngữ nghĩa)
```

---

### 8.3. Mô Hình Dẫn Xuất & Quan Ngại Kỹ Thuật (Derived & Technical Concerns)
- **`Operational Notifications`:** Là mô hình đọc dẫn xuất phi thẩm quyền (`Derived Read Model / Projection`), **tuyệt đối KHÔNG PHẢI là Bounded Context độc lập** (`Authoritative Owning Context: N/A`).
- **`Offline / Synchronization`:** Là giải pháp hạ tầng kỹ thuật lưu trữ ngoại tuyến (`Durable Outbox`, `Client Sync Transport`), **không phải Bounded Context nghiệp vụ**.

---

### 8.4. Tuyên Bố Bảo Lưu Kiến Trúc Tích Hợp Kỹ Thuật (Architecture Deferral)

> **CƠ CHẾ TÍCH HỢP KỸ THUẬT: ĐƯỢC BẢO LƯU CHO KIẾN TRÚC KỸ THUẬT & ADR TẠI PHASE 11**
> *(TECHNICAL INTEGRATION MECHANISM: DEFERRED TO PHASE 11 TECHNICAL ARCHITECTURE / ADR)*
>
> - **Ranh giới nghiệp vụ chuẩn tắc:** Một ngữ cảnh tuyệt đối **không thể trực tiếp làm đột biến** trạng thái nghiệp vụ thẩm quyền do ngữ cảnh khác sở hữu.
> - **Bảo tồn quyền sở hữu:** Mọi trao đổi thông tin hoặc chuyển giao (handoff) giữa các ngữ cảnh bắt buộc phải tôn trọng nguyên tắc sở hữu thẩm quyền độc quyền (`Single Authoritative Ownership`).
> - **Không áp đặt tô-pô kỹ thuật:** Kiểm toán Phase 9 chỉ xác nhận ranh giới sở hữu và luồng thẩm quyền nghiệp vụ; **tuyệt đối KHÔNG áp đặt** các giải pháp kỹ thuật cụ thể như khóa ngoại (`Foreign Keys`), bus sự kiện (`Event Bus`), hệ thống chuyển tin nhắn (`Message Broker`), chia tách hay dùng chung cơ sở dữ liệu (`Shared DB vs Separate DB`). Toàn bộ các quyết định này được bảo lưu nguyên trạng cho Phase 11 ADR.

---

## 9. Kiểm Toán Vòng Đời Nhiệm Vụ & Quy Trình (Workflow & Lifecycle Audit)

### 9.1 Máy Trạng Thái 7 Bước Chuẩn Tắc (Deterministic 7-State Lifecycle)

Hệ thống chỉ chấp nhận đúng **7 trạng thái** hợp lệ:
$$\text{TaskStatus} \in \{\text{PENDING}, \text{IN\_PROGRESS}, \text{BLOCKED}, \text{WAITING\_REVIEW}, \text{REWORK\_REQUIRED}, \text{COMPLETED}, \text{CANCELLED}\}$$

Các bước chuyển dịch trạng thái được chứng minh tính đóng và tất định:
1. **Tại `PENDING`:**
   - `StartTask` $\to$ `IN_PROGRESS` (Duy nhất Staff được phân công, chụp snapshot checklist).
   - `ReassignTask` $\to$ `PENDING` (Gán sang Staff mới).
   - `CancelTask` $\to$ `CANCELLED` (Hủy nhiệm vụ kèm lý do).
2. **Tại `IN_PROGRESS`:**
   - `ReportFieldIssue` $\to$ `BLOCKED` (Báo cáo sự cố trở ngại bất khả kháng).
   - `SubmitEvidence` $\to$ `WAITING_REVIEW` (Nộp đủ 100% bằng chứng hợp lệ).
   - `CancelTask` $\to$ `CANCELLED` (Hủy nhiệm vụ kèm lý do).
3. **Tại `BLOCKED` (Đúng 3 lối thoát tất định):**
   - `ResumeBlockedTask` $\to$ `IN_PROGRESS` (Tiếp tục thi công sau khi khắc phục trở ngại).
   - `ReassignTask` $\to$ `PENDING` (Đổi người thi công khác khi Staff cũ không thể tiếp tục).
   - `CancelTask` $\to$ `CANCELLED` (Hủy nhiệm vụ nếu trở ngại không thể khắc phục).
4. **Tại `WAITING_REVIEW` (Đúng 4 kết luận thẩm định của Quản lý):**
   - `ApproveTask` $\to$ `COMPLETED` (Nghiệm thu chuẩn 100%, chuyển CareHistory).
   - `ApproveWithException` $\to$ `COMPLETED` (Nghiệm thu có ngoại lệ được bảo lãnh, chuyển CareHistory kèm cờ `HAS_EXCEPTION`).
   - `RequestRework` $\to$ `REWORK_REQUIRED` (Từ chối, bắt buộc nhập `targetedArea` và lý do).
   - `CancelTask` $\to$ `CANCELLED` (Hủy nhiệm vụ tại bước kiểm tra).
5. **Tại `REWORK_REQUIRED`:**
   - `ResubmitRework` $\to$ `WAITING_REVIEW` (Nộp lại đúng khâu bị từ chối; ghép bằng chứng hợp lệ cũ thành `Attempt 2`).
   - `CancelTask` $\to$ `CANCELLED` (Hủy nhiệm vụ).
   - **CẤM:** Không được chuyển trực tiếp `REWORK_REQUIRED → BLOCKED`, không được đổi người trực tiếp (`no direct Reassign`).
6. **Tại `COMPLETED` & `CANCELLED`:**
   - Trạng thái đóng vĩnh viễn (**Terminal States**). Cấm mở lại dưới mọi hình thức (`DR-HARD-05`).

### 9.2 Các Bất Biến Xác Thực Thực Địa (Site Verification Invariants)
- **GPS Verification:** Độc lập với QR Code. Khoảng cách $\le 10\text{m}$. Nếu vượt ngưỡng, bắt buộc báo cáo `LOCATION_EXCEPTION` kèm khoảng cách đo và lý do.
- **QR Code Verification:** Độc lập với GPS. Phải khớp 100% mã cây được giao. Nếu tem hỏng/mất, bắt buộc báo cáo `IDENTITY_EXCEPTION` kèm ảnh chụp hiện trạng.
- **Không đổi trạng thái:** Cả xác thực GPS và QR đều chỉ ghi nhận cờ thẩm định, **không làm thay đổi `TaskStatus`**.

### 9.3 Tính Bắt Buộc Của Structured Findings Trong MVP
- Khẳng định bất biến:
  $$\text{INSPECTION\_PROOF} = \text{Site Verification} + \text{Structured Findings} + \text{Condition Photo(s)}$$
- `Structured Findings` là **BẮT BUỘC** trong MVP thông qua bảng biểu chuẩn tắc cố định (**Fixed Canonical Findings Schema**). Việc hoãn `CAP-ADM-10` chỉ áp dụng cho tính năng cấu hình biểu mẫu động của Admin.

### 9.4 Phân Tách Trạng Thái Ngoại Tuyến (Offline State Separation)
- Phân tách tuyệt đối 3 biến số:
  $$\text{Authoritative TaskStatus} \neq \text{LocalSubmissionStatus} \neq \text{SyncStatus}$$
- Khi nhân viên nộp bằng chứng khi mất mạng:
  - Máy chủ chuẩn tắc: `TaskStatus` **VẪN LÀ `IN_PROGRESS`**.
  - Ứng dụng di động: `LocalSubmissionStatus = PENDING_SYNC`.
  - Tuyệt đối không sinh trạng thái giả tạo `OFFLINE_SUBMITTED`.

---

## 10. Kiểm Toán Phân Tách Trách Nhiệm (Separation-of-Duties Audit)

Toàn bộ 8 quy tắc phân tách trách nhiệm cốt lõi đã được kiểm chứng không có kẽ hở:

| Mã quy tắc | Tên quy tắc SoD | Nội dung ràng buộc chuẩn tắc | Cơ chế bảo vệ | Kết quả |
| :--- | :--- | :--- | :--- | :---: |
| **SoD-01** | Cấm Tự Phê Duyệt | Người thi công nhiệm vụ (`executedBy`) tuyệt đối không được phê duyệt hoặc yêu cầu làm lại cho chính mình. | Gác cổng thẩm định tại `ReviewTask` từ chối nếu `task.assignedStaffId == actor.userId`. | **PASS** |
| **ADM-SOD-01**| Cấm Tự Nâng Quyền | Platform Admin không được tự thay đổi vai trò hoặc cấp thêm quyền cho chính tài khoản của mình. | Lệnh `AssignRole` kiểm tra `targetUserId != actor.userId`. | **PASS** |
| **ADM-SOD-02**| Bảo Toàn Tác Giả Lịch Sử| Việc thay đổi vai trò hoặc khóa tài khoản không được phép viết lại quyền tác giả của các bằng chứng/biên bản cũ. | Các bản ghi lịch sử gắn chặt với `actorId` tại thời điểm tạo; không cập nhật hồi tố. | **PASS** |
| **ADM-SOD-03**| Tính Bất Biến Nhật Ký | Không một tác nhân con người nào (kể cả Admin) được sửa hoặc xóa nhật ký kiểm toán `AuditEvent`. | Bảng `AuditEvent` là Append-Only; không phơi bày API Update/Delete. | **PASS** |
| **ADM-SOD-04**| Phân Lập Quản Trị & Vận Hành| Năng lực quản trị nền tảng không đồng nghĩa với quyền can thiệp vào tác vụ vận hành thực địa. | Admin bị DENY 100% trên toàn bộ các lệnh tác nghiệp Task (`OP-03..15`, `OP-17..21`). | **PASS** |
| **ADM-SOD-05**| Phân Lập Vận Hành & Quản Trị| Quyền Quản lý vận hành không đồng nghĩa với quyền thay đổi cấu hình nền tảng hoặc dữ liệu gốc. | Manager bị DENY 100% trên các lệnh quản trị nền tảng (`GV-01..19`). | **PASS** |
| **ADM-SOD-06**| Cấm Hệ Thống Tự Cấp Quyền | Tác nhân kỹ thuật System không thể tự động thăng cấp hoặc gán quyền Admin cho bất kỳ tài khoản nào. | `System` không sở hữu endpoint cấp quyền; chỉ con người Admin mới gọi `AssignRole`. | **PASS** |
| **ADM-SOD-07**| Khóa Chặt Cứu Hộ Khẩn Cấp | Quyền cứu hộ khẩn cấp (`Break-Glass`) không phải là quyền mặc định hay thường trực trong MVP. | `CAP-ADM-11` / `GV-21` bị khóa hoàn toàn tại MVP; không có cơ chế bypass quyền ngầm. | **PASS** |

### Kiểm tra đặc thù: Thăng chức nhân viên thành Quản lý
- **Tình huống:** Nhân viên A thực hiện nhiệm vụ $T$. Sau đó A được thăng chức thành Operations Manager.
- **Ràng buộc:** Khi nhiệm vụ $T$ vào hàng đợi `WAITING_REVIEW`, Quản lý A **BỊ CẤM 100%** thực hiện `ApproveTask`, `ApproveWithException`, hay `RequestRework` trên $T$ vì quyền tác giả lịch sử `executedBy == A`.
- **Cơ chế:** Nhiệm vụ $T$ bắt buộc phải do một Operations Manager khác thẩm định. Không có tài liệu nào vi phạm quy tắc này.

---

## 11. Kiểm Toán Tính Bất Biến Của Lịch Sử (Historical Integrity Audit)

Hệ thống bảo vệ tính toàn vẹn lịch sử trước các thao tác cập nhật quản trị nền tảng:
1. **Dữ liệu Cây gốc (Tree Master Data):**
   - Thay đổi tem QR (`ReplaceTreeQrCode` / `GV-12`): Cấp mã QR mới cho cây, nhưng **không viết lại** lịch sử quét mã QR cũ trong các nhiệm vụ đã hoàn thành.
   - Cập nhật tọa độ chuẩn trắc địa (`UpdateCanonicalCoordinates` / `GV-13`): Cập nhật tọa độ tham chiếu mới, nhưng **không thay đổi** các tọa độ GPS thực địa mà nhân viên đã đo trong quá khứ.
   - Định danh `treeId`: Bất biến vĩnh viễn từ lúc gieo trồng đến khi thanh lý (`RETIRED`).
2. **Lịch sử Chăm sóc (CareHistory):**
   - Chỉ được sinh ra khi nhiệm vụ đạt trạng thái đóng thành công `COMPLETED`.
   - Lưu trữ bản chụp bất biến về bằng chứng, kết quả kiểm tra, và người phê duyệt.
3. **Nhật ký Kiểm toán (AuditEvent):**
   - Bản ghi mang tính ghi tiếp một chiều (**Append-Only**).
   - Đáp ứng trọn vẹn yêu cầu nghiệp vụ về kiểm toán độc lập mà không áp đặt sớm các giải pháp kiến trúc kỹ thuật (như blockchain, WORM hay chữ ký số).

---

## 12. Ma Trận Truy Vết Yêu Cầu Chuẩn Tắc (RTM Traceability Audit)

Bảng đối soát thống kê từ tài liệu [REQUIREMENTS-TRACEABILITY.md](file:///d:/ki7/EXE/tree/docs/REQUIREMENTS-TRACEABILITY.md):

| Chỉ số kiểm toán RTM | Số lượng thực tế | Yêu cầu chuẩn | Đánh giá |
| :--- | :---: | :---: | :---: |
| **Tổng số yêu cầu nghiệp vụ (Business Requirements)** | **43** | 43 | **KHỚP 100%** |
| **Số lượng định danh duy nhất (Unique IDs)** | **43** | 43 (0 trùng lặp) | **KHỚP 100%** |
| - Yêu cầu Vận hành Hiện trường (`BR-01` đến `BR-13`) | 20 | 20 | **KHỚP 100%** |
| - Yêu cầu Tác nhân Chuẩn tắc (`BR-ACT-01`) | 1 | 1 | **KHỚP 100%** |
| - Yêu cầu Quản trị Nền tảng (`BR-ADM-01` đến `BR-ADM-13`) | 18 | 18 | **KHỚP 100%** |
| - Yêu cầu Bất biến Miền dữ liệu (`BR-DOM-01` đến `BR-DOM-04`) | 4 | 4 | **KHỚP 100%** |
| **Tác nhân được ánh xạ đầy đủ** | 43 / 43 | 100% | **KHỚP 100%** |
| **Lệnh / Bất biến được chuẩn hóa danh pháp** | 43 / 43 | 100% | **KHỚP 100%** |
| **Tài nguyên miền được phân định sở hữu** | 43 / 43 | 100% | **KHỚP 100%** |
| **Nguồn quyết định chuẩn tắc (Phase 1–5 Source Decisions)** | 43 / 43 | 100% | **KHỚP 100%** |
| **Tiêu chí nghiệm thu nhị phân (Acceptance Oracles)** | 43 / 43 | 100% (Report 10 §6..§9) | **KHỚP 100%** |
| **Yêu cầu chưa ánh xạ (Unmapped Requirements)** | **0** | 0 | **HOÀN HẢO** |
| **Mâu thuẫn ngữ nghĩa (Cross-doc Contradictions)** | **0** | 0 | **HOÀN HẢO** |

---

## 13. Đánh Giá Ngữ Nghĩa Bộ Biểu Đồ (Diagram Semantic Review)

Toàn bộ 16 biểu đồ trong thư mục `docs/diagrams/` và tệp hướng dẫn [README.md](file:///d:/ki7/EXE/tree/docs/diagrams/README.md) được kiểm toán phân loại và đối soát ngữ nghĩa:

| Biểu đồ (Diagram) | Phân loại chuẩn tắc (Classification) | Nguồn chuẩn tắc tương ứng | Khớp ngữ nghĩa? | Thẩm quyền chính xác? | Kết quả kiểm toán |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `01-product-capability-map.html` | `CURRENT_DERIVED_VIEW` | PRODUCT.md, 04-ADMIN | **CÓ** | **CÓ** (Derived View) | **PASS** |
| `02-domain-context-map.html` | `CURRENT_DERIVED_VIEW` | DOMAIN.md, 05, 06 | **CÓ** | **CÓ** (Derived View) | **PASS** |
| `03-mvp-operational-swimlane.html` | `HISTORICAL_SUPERSEDED` | Thay thế bởi `proposed-02` | N/A | **CÓ** (Historical Banner) | **PASS — Correctly Classified** |
| `04-task-lifecycle.html` | `HISTORICAL_SUPERSEDED` | Thay thế bởi `proposed-03` | N/A | **CÓ** (Historical Banner) | **PASS — Correctly Classified** |
| `05-proof-workflow.html` | `HISTORICAL_SUPERSEDED` | Thay thế bởi `proposed-04` | N/A | **CÓ** (Historical Banner) | **PASS — Correctly Classified** |
| `06-review-rework-lifecycle.html` | `HISTORICAL_SUPERSEDED` | Thay thế bởi `proposed-04` | N/A | **CÓ** (Historical Banner) | **PASS — Correctly Classified** |
| `07-action-eligibility-security-matrix.html` | `CURRENT_DERIVED_VIEW` | ACCESS-CONTROL.md, 07 | **CÓ** | **CÓ** (Derived View) | **PASS** |
| `08-role-information-architecture.html` | `CURRENT_DERIVED_VIEW` | PRODUCT.md, 03-TAXONOMY | **CÓ** | **CÓ** (Derived View) | **PASS** |
| `09-system-current-state.html` | `AS_IS_DEFECT_EVIDENCE` | Baseline codebase 2f9a26b | N/A | **CÓ** (AS-IS Defect Banner) | **PASS — Correctly Classified** |
| `10-system-target-architecture.html`| `DEFERRED_TARGET_VIEW` | ARCHITECTURE.md, Phase 11 | N/A | **CÓ** (Deferred ADR Banner) | **PASS — Correctly Deferred** |
| `11-evidence-submission-sequence.html` | `HISTORICAL_SUPERSEDED` | Thay thế bởi `proposed-01` | N/A | **CÓ** (Historical Banner) | **PASS — Correctly Classified** |
| `12-architecture-dependency-map.html` | `DEFERRED_TARGET_VIEW` | AGENTS.md, Phase 11 | N/A | **CÓ** (Deferred ADR Banner) | **PASS — Correctly Deferred** |
| `proposed-01-current-vs-recommended-workflow.html` | `PROPOSED_TARGET_VIEW` | WORKFLOWS.md, 08-WORKFLOW | **CÓ** | **CÓ** (Derived View) | **PASS** |
| `03-operational-workflow.html` | `PROPOSED_TARGET_VIEW` | WORKFLOWS.md, 08-WORKFLOW | **CÓ** | **CÓ** (Derived View) | **PASS** |
| `04-task-lifecycle.html` | `PROPOSED_TARGET_VIEW` | WORKFLOWS.md, DOMAIN.md | **CÓ** | **CÓ** (Derived View) | **PASS** |
| `05-proof-policy-and-rework.html` | `PROPOSED_TARGET_VIEW` | WORKFLOWS.md, DOMAIN.md | **CÓ** | **CÓ** (Derived View) | **PASS** |
| `README.md` | `CATALOG & NAVIGATION INDEX` | Toàn bộ 16 biểu đồ | **CÓ** | **CÓ** (Discipline Index) | **PASS** |

---

## 14. Báo Cáo Ranh Giới Mã Nguồn (Source Boundary Report)

Kiểm toán xác nhận Phase 9 hoạt động ở chế độ kiểm toán độc lập thuần túy (**Read-Only Audit**):

1. **Ranh giới Mã nguồn Ứng dụng & Thư viện Gói:**
   ```powershell
   git diff --name-only 86b0bed715f0c1b9160fb18e6db58a7396d22f2e HEAD -- apps packages
   ```
   **Kết quả:** 0 tệp bị thay đổi. Hoàn toàn không sửa đổi mã nguồn phần mềm.
2. **Ranh giới Tài liệu Nghiệp vụ Chuẩn tắc:**
   ```powershell
   git diff --name-only 86b0bed715f0c1b9160fb18e6db58a7396d22f2e HEAD -- docs/PRODUCT.md docs/DOMAIN.md docs/ACCESS-CONTROL.md docs/WORKFLOWS.md docs/REQUIREMENTS-TRACEABILITY.md
   ```
   **Kết quả:** 0 tệp bị thay đổi. Đường cơ sở nghiệp vụ Phase 6 & 7 được bảo vệ bất biến.
3. **Ranh giới Bộ Biểu Đồ Trực Quan:**
   ```powershell
   git diff --name-only 86b0bed715f0c1b9160fb18e6db58a7396d22f2e HEAD -- docs/diagrams
   ```
   **Kết quả:** 0 tệp bị thay đổi. Bộ biểu đồ Phase 8 được bảo vệ bất biến.
4. **Ranh giới Tài liệu Kỹ thuật & Công cụ Kiểm Thử:**
   ```powershell
   git diff --name-only 86b0bed715f0c1b9160fb18e6db58a7396d22f2e HEAD -- docs/ARCHITECTURE.md docs/NFR.md docs/TESTING.md DESIGN.md docs/quality-gates scripts
   ```
   **Kết quả:** 0 tệp bị thay đổi.

---

## 15. Bảng Bằng Chứng Các Cổng Kiểm Soát Phase 9 (P9-01..P9-08 Re-Evaluation)

| Cổng kiểm soát | Câu hỏi kiểm toán chuẩn tắc | Phương pháp xác minh | Bằng chứng kiểm toán cụ thể | Mâu thuẫn chặn | Kết quả |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **P9-01** | Có hành động nào không có tác nhân sở hữu rõ ràng? | Rà soát danh mục phân quyền đầy đủ: 22 lệnh `OP-01..22`, 22 hành vi `GV-01..22` (với `GV-07` chiếu chuẩn tắc là `ResetCredentialSetup`) và 4 lệnh RTM bổ sung (Tổng hợp 48 lệnh chuẩn tắc độc nhất) | 100% 48 lệnh đều có tác nhân sở hữu thẩm quyền đơn nhất (Staff, Manager, Admin, System), ngữ cảnh sở hữu và trạng thái phạm vi xác định. 0 lệnh vô chủ, 0 lệnh TBD, 0 lệnh tranh chấp thẩm quyền. Token lịch sử `RecoverAccount` từ Phase 4 được bảo lưu như chứng tích kế thừa, không tính là lệnh riêng biệt thứ 49. | 0 | **PASS** |
| **P9-02** | Admin có vô tình trở thành superuser nghiệp vụ không? | Đối soát ranh giới phân quyền tại `ACCESS-CONTROL.md`, Quyết định 07 và Biểu đồ 07 | Platform Admin bị **DENY 100%** trên toàn bộ các lệnh tác nghiệp Task (`OP-03..15`, `OP-17..21`). Khả năng vượt quyền khẩn cấp (`Break-Glass` / `GV-21` / `CAP-ADM-11`) bị khóa chặt ở nhóm NEXT. | 0 | **PASS** |
| **P9-03** | Operations Manager có bị tước mất quyền vận hành cần thiết không? | Kiểm tra quyền hạn tại 7 trạng thái của Task và toàn bộ các lệnh quản lý | Manager bảo lưu trọn vẹn quyền: `ViewAssignedTask` (ALLOW), `ViewOperationalTask`, `CreateTask`, `AssignTask`, `ReassignTask` (`PENDING`/`BLOCKED`), `ResumeBlockedTask`, `CancelTask` (mọi trạng thái nonterminal), `ViewReviewQueue`, `ReviewTask`, 4 kết luận duyệt tại `WAITING_REVIEW`, và `ViewCareHistory` (ALLOW). `AUTHORIZED_OPERATIONAL_SCOPE` duy trì tính trừu tượng. | 0 | **PASS** |
| **P9-04** | Luồng làm việc của Field Staff có bị phức tạp hóa bởi Admin không? | Kiểm tra sơ đồ swimlane `proposed-02` và luồng `WF-01..09` | Luồng hiện trường chuẩn tắc chỉ tương tác giữa Manager, Staff và System. Hoàn toàn không có bước duyệt hay phụ thuộc đồng bộ nào từ Admin trong quy trình tác nghiệp. | 0 | **PASS** |
| **P9-05** | Có điều khoản nào vi phạm nguyên tắc phân tách trách nhiệm (SoD) không? | Rà soát 8 quy tắc SoD và trường hợp thăng chức nhân viên | SoD-01 đến SoD-07 được thực thi nghiêm ngặt; nhân viên A thi công task sau khi thăng chức lên Manager bị cấm 100% duyệt task do chính mình thi công (`DR-HARD-02`, `BR-ADM-02b`). | 0 | **PASS** |
| **P9-06** | Lịch sử kiểm toán và quyền tác giả có nguy cơ bị ghi đè không? | Rà soát bất biến dữ liệu tại `DOMAIN.md` và `WORKFLOWS.md` | Dữ liệu quét QR, tọa độ GPS, biên bản nghiệm thu, CareHistory và AuditEvent là Append-Only; Admin đổi tem QR (`ReplaceTreeQrCode`) hay đổi tọa độ chuẩn không làm biến đổi lịch sử cũ. | 0 | **PASS** |
| **P9-07** | Ngữ nghĩa vòng đời Task chuẩn tắc có được bảo tồn nguyên vẹn không? | Đối soát máy trạng thái 7 trạng thái, 3 ProofProfiles, Offline | Đúng 7 trạng thái chuẩn tắc; đúng 3 Hồ sơ Bằng chứng; Structured Findings bắt buộc trong MVP; nộp offline giữ `TaskStatus = IN_PROGRESS`; không sinh trạng thái rác. | 0 | **PASS** |
| **P9-08** | Biểu đồ có phản ánh đúng tài liệu chuẩn tắc hay tự sáng tác nghiệp vụ? | Đối soát chéo 16 biểu đồ với 5 tài liệu chuẩn tắc | Toàn bộ biểu đồ active đều là góc nhìn dẫn xuất bám sát 100% văn bản chuẩn tắc; biểu đồ lịch sử và As-Is mang banner phân loại rõ ràng; không tự sinh nghiệp vụ mới. | 0 | **PASS** |

---

## 16. Danh Mục Các Phát Hiện Chặn (Blocking Findings)

```text
TỔNG SỐ PHÁT HIỆN CHẶN (BLOCKING FINDINGS): 0
TỔNG SỐ MÂU THUẪN NGỮ NGHĨA LIÊN TÀI LIỆU: 0
TỔNG SỐ TÁC NHÂN CHƯA ĐỊNH NGHĨA: 0
TỔNG SỐ HÀNH ĐỘNG VÔ CHỦ: 0
TỔNG SỐ SAI LỆCH BIỂU ĐỒ SO VỚI VĂN BẢN CHUẨN TẮC: 0
```

> **Kết luận:** Không ghi nhận bất kỳ khuyết tật chặn nào. Đường cơ sở nghiệp vụ đạt độ kín khít và nhất quán tuyệt đối.

---

## 17. Đánh Giá Mức Độ Sẵn Sàng Cho Phase 10 (Phase-10 Readiness Assessment)

Bảng đối soát 10 chỉ số sẵn sàng được tính toán lại trực tiếp từ bằng chứng đã hiệu chỉnh:

| Chỉ số sẵn sàng (Readiness Metric) | Ngưỡng yêu cầu | Kết quả thực tế đạt được | Đánh giá trạng thái |
| :--- | :---: | :---: | :---: |
| **1. Cổng kiểm soát thất bại (Blocking FAIL)** | 0 | **0** | **ĐẠT (PASS)** |
| **2. Cổng chưa chạy (NOT_RUN)** | 0 | **0** | **ĐẠT (PASS)** |
| **3. Cổng không kết luận được (INCONCLUSIVE)** | 0 | **0** | **ĐẠT (PASS)** |
| **4. Thiếu chứng cứ kiểm toán (Missing Evidence)** | 0 | **0** | **ĐẠT (PASS)** |
| **5. Mâu thuẫn chéo tài liệu (Cross-doc Contradiction)** | 0 | **0** | **ĐẠT (PASS)** |
| **6. Yêu cầu chưa ánh xạ (Unmapped Requirement)** | 0 | **0** | **ĐẠT (PASS)** |
| **7. Lệnh vô chủ (Unowned Command)** | 0 | **0** | **ĐẠT (PASS)** |
| **8. Tác nhân chưa định nghĩa (Undefined Actor)** | 0 | **0** | **ĐẠT (PASS)** |
| **9. Sai lệch ngữ nghĩa biểu đồ (Diagram Mismatch)** | 0 | **0** | **ĐẠT (PASS)** |
| **10. Thay đổi mã nguồn trong Phase 9 (Source Change)** | 0 | **0** | **ĐẠT (PASS)** |

> **ĐÁNH GIÁ TỔNG THỂ: SẴN SÀNG 100% CHO PHASE 10 (READY FOR PHASE 10 BUSINESS BASELINE FREEZE)**

---

## 18. Khoảng Trống Triển Khai Kỹ Thuật Còn Lại (Residual Technical Gaps — Informational Only)

Các khoảng trống kỹ thuật trong mã nguồn ứng dụng hiện tại (`apps/` và `packages/`) được ghi nhận nhằm phục vụ chuyển giao thông tin cho **Phase 11 ADR & Post-ADR Implementation**, tuyệt đối không bị coi là lỗi mâu thuẫn nghiệp vụ của Phase 9:
1. **Ép vai trò Admin về Manager trong mã nguồn di động (`apps/mobile`):**
   - *Hiện trạng As-Is:* Mã nguồn mobile hiện tại ép `admin` thành `manager` do thiếu không gian quản trị độc lập (đã phản ánh trung thực tại Biểu đồ 09).
   - *Định hướng:* Sẽ được giải quyết dứt điểm tại Phase 11 ADR (quyết định kênh triển khai Web hay phân nhánh giao diện cho Admin).
2. **Thiếu cơ chế bảo vệ phân quyền tầng API (`@novyx/contracts` & Backend):**
   - *Hiện trạng As-Is:* Hợp đồng DTO chưa có các gác cổng chặn Admin gọi lệnh Task hoặc chặn Manager gọi lệnh Master Data.
   - *Định hướng:* Cài đặt bảo vệ phân quyền theo ma trận [ACCESS-CONTROL.md](file:///d:/ki7/EXE/tree/docs/ACCESS-CONTROL.md) sau khi có ADR.
3. **Các trường dữ liệu ngoại tuyến và trạng thái cục bộ:**
   - *Hiện trạng As-Is:* Mã nguồn client chưa tách bạch triệt để `LocalSubmissionStatus = PENDING_SYNC` và `SyncStatus`.
   - *Định hướng:* Tái cấu trúc Outbox Store theo chuẩn [DOMAIN.md](file:///d:/ki7/EXE/tree/docs/DOMAIN.md) tại Phase 11.

---

## KẾT LUẬN & TRẠNG THÁI CUỐI CÙNG (FINAL STATUS)

```text
PHASE 9 PASS — AUDIT EVIDENCE VERIFIED
— ZERO UNOWNED BUSINESS ACTIONS
— AUTHORIZATION INVENTORY MATCHES FROZEN PHASE 4
— DOMAIN OWNERSHIP MATCHES CANONICAL DOMAIN
— ADMIN GOVERNANCE BOUNDARY CONSISTENT
— OPERATIONAL AUTHORITY PRESERVED
— SEPARATION OF DUTIES CONSISTENT
— HISTORICAL INTEGRITY PRESERVED
— CANONICAL TASK SEMANTICS CONSISTENT
— DIAGRAMS MATCH CANONICAL BUSINESS DOCS
— TECHNICAL INTEGRATION REMAINS DEFERRED
— READY FOR PHASE 10 BUSINESS BASELINE FREEZE
```
