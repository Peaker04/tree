# NOVYX GreenOps — Phase 6 Canonical Document Reconciliation Report

## 1. Scope & Objectives

Tài liệu này ghi nhận toàn bộ quá trình đối soát và đồng bộ hóa chuẩn tắc (Canonical Document Reconciliation) của **Phase 6**, thực hiện chuyển giao toàn bộ các quyết định nghiệp vụ đã được phê duyệt và đóng băng (Approved & Frozen Decisions) từ **Phase 1 đến Phase 5** vào 5 tài liệu chuẩn tắc nền tảng của NOVYX GreenOps:

1. `docs/PRODUCT.md`
2. `docs/DOMAIN.md`
3. `docs/ACCESS-CONTROL.md`
4. `docs/WORKFLOWS.md`
5. `docs/REQUIREMENTS-TRACEABILITY.md`

### Nguyên tắc chỉ đạo tối cao (Governing Principle):
> **DECISION SYNCHRONIZATION, NOT DECISION CREATION.**<br>
> Phase 6 tuyệt đối không tái cấu trúc mô hình nghiệp vụ, không bịa đặt thêm quyền hạn/vai trò, không sửa đổi vòng đời 7 trạng thái của Task, không chỉnh sửa mã nguồn ứng dụng (`apps/**`, `packages/**`), không sửa đổi sơ đồ (`docs/diagrams/**`) và không mở lại các Phase 1–5 đã đóng băng. Nếu phát hiện mâu thuẫn giữa tài liệu chuẩn tắc cũ và tài liệu quyết định Phase 1–5, **các tài liệu quyết định Phase 1–5 đã đóng băng luôn là chân lý tối thượng**.

---

## 2. Frozen Input Baseline

Các căn cứ đối soát thẩm quyền đã được đóng băng nghiêm ngặt:
- `docs/business-reconciliation/02-ACTOR-MODEL-DECISION.md` (Phase 1 Frozen Baseline)
- `docs/business-reconciliation/03-ROLE-NAMING-TAXONOMY.md` (Phase 1 Naming Taxonomy)
- `docs/business-reconciliation/04-ADMIN-BUSINESS-SCOPE-DECISION.md` (Phase 2 Frozen Baseline)
- `docs/business-reconciliation/05-DOMAIN-OWNERSHIP-MATRIX.md` (Phase 3 Domain Ownership Matrix)
- `docs/business-reconciliation/06-BOUNDED-CONTEXT-DECISIONS.md` (Phase 3 Bounded Context Decisions)
- `docs/business-reconciliation/07-AUTHORIZATION-ACTION-ELIGIBILITY.md` (Phase 4 Authorization & Action Eligibility)
- `docs/business-reconciliation/08-WORKFLOW-OPTIMIZATION.md` (Phase 5 Workflow Optimization & Semantic Closure)
- `docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md` (Master Plan Baseline)

---

## 3. Pre-Sync Drift Register (Sổ đăng ký sai lệch tiền đồng bộ)

Bảng tổng hợp toàn diện các điểm sai lệch, mâu thuẫn hoặc thiếu sót giữa 5 tài liệu chuẩn tắc ban đầu và các quyết định nghiệp vụ Phase 1–5 đã đóng băng:

| Drift ID | Canonical File | Hiện trạng trong Tài liệu cũ (Current Statement) | Quyết định đã Đóng băng (Frozen Decision) | Hành động Bắt buộc (Required Action) |
|:---:|---|---|---|:---:|
| **DFT-01** | `PRODUCT.md` | Admin bị ghi là `[OUT_OF_MVP]`, `[RESERVED]`, "dự kiến cho tương lai" (dòng 49, 197). | Platform Administrator là tác nhân quản trị sản phẩm hoạt động thực tế (**ACTIVE PRODUCT GOVERNANCE ROLE**) trong MVP. | **REPLACE** |
| **DFT-02** | `PRODUCT.md` | Đăng nhập phân quyền chỉ ghi nhận 2 vai trò vận hành `Staff` và `Manager` (dòng 167). | Hệ thống hỗ trợ 3 vai trò con người chuẩn tắc: `Field Staff`, `Operations Manager`, `Platform Administrator` và tác nhân kỹ thuật `System`. | **REPLACE** |
| **DFT-03** | `PRODUCT.md` | Bản đồ năng lực thiếu hoàn toàn các năng lực Quản trị nền tảng của Admin. | Bổ sung 9 năng lực Admin MVP (`CAP-ADM-01..09`), ghi nhận 3 năng lực NEXT (`CAP-ADM-10..12`) và 1 năng lực REJECTED (`CAP-ADM-13`). | **ADD** |
| **DFT-04** | `PRODUCT.md` | Chưa có ranh giới cấm can thiệp vận hành của Admin. | Khẳng định rõ ranh giới: Admin **hoàn toàn không có thẩm quyền vận hành nhiệm vụ thông thường** (Zero normal task operations). | **ADD** |
| **DFT-05** | `DOMAIN.md` | Phân chia 8 Bounded Contexts rời rạc, coi Verification và Review & QC là các ngữ cảnh tách rời; Identity & Session là Generic. | Rút gọn thành 4 Contexts nghiệp vụ chuẩn: Core (`Work Management` tích hợp Verification và Review), Supporting (`Tree Asset Registry`, `Policy & Template Governance`, `Audit & Compliance`, `Operational Notifications`), Generic (`Identity & Access Management`). Bỏ việc coi Offline/Hardware là Bounded Context miền. | **REPLACE** |
| **DFT-06** | `DOMAIN.md` | Ghi `qrCode` và `location` của `Tree` là bất biến tuyệt đối (`Immutable`) (dòng 83–84). | `treeId` là bất biến duy nhất; `qrCode` là duy nhất nhưng có thể cấp đổi (`ReplaceTreeQrCode`); tọa độ chuẩn có thể hiệu chỉnh (`UpdateCanonicalCoordinates`) và **không phải là khóa duy nhất**. | **REPLACE** |
| **DFT-07** | `DOMAIN.md` | Thiếu định nghĩa phân định tài nguyên sở hữu: `TaskTypeCatalog` (Audit-only) vs `ProofPolicyMapping` (Versioned policy); `AuditEvent` là Domain Event bất biến. | Xác lập rõ ràng đơn vị sở hữu đơn nhất (Single Authoritative Ownership) cho từng tài nguyên theo Phase 3. | **ADD** |
| **DFT-08** | `ACCESS-CONTROL.md`| Admin ghi là `OUT OF MVP / RESERVED`, cấm tạo màn hình hoặc tính năng Admin trong MVP (dòng 15). | Platform Administrator là vai trò Quản trị nền tảng `ACTIVE` trong MVP với phạm vi `PLATFORM_GOVERNANCE_SCOPE`. | **REPLACE** |
| **DFT-09** | `ACCESS-CONTROL.md`| Ma trận điều kiện kích hoạt hành động thiếu toàn bộ 19 lệnh quản trị của Admin và không có ranh giới cấm Admin thao tác Task. | Bổ sung 19 lệnh quản trị của Admin tương ứng 9 năng lực MVP, cấm 100% các thao tác vận hành Task thông thường đối với Admin; Break-glass là `NEXT`. | **ADD / REPLACE** |
| **DFT-10** | `ACCESS-CONTROL.md`| Chưa có quy tắc phân quyền chi tiết cho tác nhân kỹ thuật `System` (phân biệt tự động hóa tất định vs phán quyết con người). | Bổ sung phạm vi quyền hạn và các điều cấm của `System` (Cấm tự phân công, cấm tự duyệt `Auto-approval`). | **ADD** |
| **DFT-11** | `WORKFLOWS.md` | Toàn bộ tài liệu chỉ có 9 luồng vận hành thực địa của Staff và Manager, thiếu hoàn toàn các quy trình quản trị nền tảng. | Bổ sung đầy đủ 8 quy trình quản trị nền tảng (`WF-10` đến `WF-17`) và quy trình kỹ thuật ngoại tuyến (`WF-18`), đánh số nhất quán `WF-01..18` và `WF-NEXT-01..03`. | **ADD** |
| **DFT-12** | `WORKFLOWS.md` | Thiếu ma trận xử lý khối lượng công việc khi nhân viên bị khóa tài khoản IAM (`WF-12`). | Tích hợp **Ma trận xử lý công việc của nhân sự bị khóa**; cấm tự chuyển `IN_PROGRESS -> BLOCKED`; Quản lý dùng `CancelTask` có lý do và tạo task thay thế (`P5-SC-01`). | **ADD / CLARIFY** |
| **DFT-13** | `WORKFLOWS.md` | Thiếu bước đối soát trách nhiệm tác nghiệp khi đổi vai trò người dùng (`WF-11`). | Tích hợp **Role Change Impact Check**, điều kiện `ROLE_CHANGE_PENDING_OPERATIONAL_HANDOFF`, cấm người thăng chức tự duyệt bài của mình (`P5-SC-02`). | **ADD / CLARIFY** |
| **DFT-14** | `WORKFLOWS.md` | Chưa chuẩn hóa việc hoãn các cơ chế xác thực kỹ thuật (Token, JWT, FCM, HTTP status codes) sang kiến trúc. | Khái quát hóa sang ngữ nghĩa nghiệp vụ: cơ chế thiết lập xác thực an toàn, thu hồi thẩm quyền phiên làm việc cũ, chấp thuận nghiệp vụ máy chủ (`P5-SC-03`). | **CLARIFY** |
| **DFT-15** | `WORKFLOWS.md` | Handoff matrix chỉ có 7 điểm bàn giao nội bộ thực địa. | Mở rộng ma trận bàn giao chuẩn tắc gồm 12 điểm bàn giao (`HO-01` đến `HO-12`) xuyên ngữ cảnh. | **ADD** |
| **DFT-16** | `REQUIREMENTS-TRACEABILITY.md` | Ma trận truy vết RTM chỉ có 13 yêu cầu vận hành `BR-01..13`, thiếu 100% các yêu cầu về Quản trị Admin, Bounded Contexts, và Semantic Closures. | Bổ sung toàn bộ các yêu cầu quản trị `BR-ADM-01..13`, yêu cầu bất biến miền, yêu cầu phân quyền và quy trình đã khóa từ Phase 1–5 (`P6-10`). | **ADD** |

---

## 4. PRODUCT Reconciliation (Đồng bộ hóa PRODUCT.md)

Tài liệu [`docs/PRODUCT.md`](file:///d:/ki7/EXE/tree/docs/PRODUCT.md) đã được hiệu chỉnh hoàn tất ở bước đầu tiên:
- **Tác nhân & Mô hình phân loại:** Thiết lập cây phân loại tác nhân chính thức gồm 3 vai trò con người (`Field Staff`, `Operations Manager`, `Platform Administrator`) và tác nhân kỹ thuật `System`.
- **Trạng thái Admin:** Xóa bỏ hoàn toàn định kiến `[OUT_OF_MVP]` / `[RESERVED]`. Platform Administrator được xác định là **ACTIVE IN MVP** cho phân hệ Quản trị nền tảng.
- **Bản đồ năng lực:** Tích hợp 9 năng lực quản trị nền tảng MVP (`CAP-ADM-01..09`), ghi nhận 3 năng lực `NEXT` (`CAP-ADM-10..12`) và bác bỏ năng lực cấu hình hạ tầng tùy tiện (`CAP-ADM-13 - REJECTED`).
- **Ranh giới cấm:** Khẳng định Admin **hoàn toàn không có thẩm quyền vận hành nhiệm vụ thông thường** (Zero normal task operations).
- **Kết quả Checkpoint:** `PASS` (0 từ khóa `OUT_OF_MVP`, 0 `RESERVED` ở cấp vai trò, thuật ngữ tác nhân nhất quán 100%).

---

## 5. DOMAIN Reconciliation (Đồng bộ hóa DOMAIN.md)

Tài liệu [`docs/DOMAIN.md`](file:///d:/ki7/EXE/tree/docs/DOMAIN.md) đã được đồng bộ hóa hoàn tất:
- **Bounded Contexts:** Chuẩn hóa theo kiến trúc Phase 3:
  - Core: `Work Management` (hợp nhất tác nghiệp hiện trường, xác thực và thẩm định).
  - Supporting: `Tree Asset Registry`, `Policy & Template Governance`, `Audit & Compliance`, `Operational Notifications`.
  - Generic: `Identity & Access Management`.
  - Tách biệt hoàn toàn tầng kỹ thuật Mobile Offline & Hardware ra khỏi Bounded Contexts miền.
- **Quyền sở hữu tài nguyên độc quyền (Single Authoritative Ownership):** Mỗi Aggregate/Entity thuộc đúng 1 context sở hữu (ví dụ: `EvidenceAttempt` là Entity trong Work Management; `TaskTypeCatalog` là Audit-only resource trong Policy Governance; `AuditEvent` là Domain Event trong Audit & Compliance).
- **Ngữ nghĩa định danh Cây xanh:** `treeId` là bất biến duy nhất; `qrCode` là duy nhất có thể cấp đổi (`ReplaceTreeQrCode`); tọa độ chuẩn có thể cập nhật (`UpdateCanonicalCoordinates`) và **không phải là khóa duy nhất danh tính**.
- **Vòng đời 7 trạng thái:** `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`. Bác bỏ hoàn toàn `OFFLINE_SUBMITTED` và `COMPLETED_WITH_EXCEPTION`.
- **Kết quả Checkpoint:** `PASS` (Đúng 7 trạng thái, đúng 3 ProofProfiles, sở hữu miền nhất quán 100%).

---

## 6. ACCESS-CONTROL Reconciliation (Đồng bộ hóa ACCESS-CONTROL.md)

Tài liệu [`docs/ACCESS-CONTROL.md`](file:///d:/ki7/EXE/tree/docs/ACCESS-CONTROL.md) đã được cập nhật toàn diện:
- **Công thức phân quyền 4 yếu tố:** $\text{Action Eligibility} = \text{Role} \land \text{Scope} \land \text{State} \land \text{Preconditions}$.
- **Phân định phạm vi tài nguyên (Scope):**
  - Field Staff: `task.assignedStaffId == actor.userId`.
  - Operations Manager: `AUTHORIZED_OPERATIONAL_SCOPE`.
  - Platform Administrator: `PLATFORM_GOVERNANCE_SCOPE`.
- **Ma trận 17 lệnh vận hành + 19 lệnh quản trị:** Khớp chính xác 9 năng lực Admin MVP.
- **Ranh giới cấm nghiêm ngặt:** Admin cấm 100% các lệnh thao tác Task thông thường (`P4-09`). Nhân viên cấm tự duyệt bài (`DR-HARD-02`). Quản lý cấm can thiệp tài khoản IAM và cấm sửa task đã đóng (`DR-HARD-05`).
- **Kết quả Checkpoint:** `PASS` (Xác lập rõ 3 vai trò con người + System, cấm thừa hưởng đặc quyền, bảo vệ trạng thái đóng bất biến).

---

## 7. WORKFLOWS Reconciliation (Đồng bộ hóa WORKFLOWS.md)

Tài liệu [`docs/WORKFLOWS.md`](file:///d:/ki7/EXE/tree/docs/WORKFLOWS.md) đã được đồng bộ hóa đầy đủ:
- **18 quy trình chuẩn mực:**
  - Vận hành thực địa: `WF-01` đến `WF-09` (Admin không có làn bơi).
  - Quản trị nền tảng: `WF-10` đến `WF-17` (Admin thực thi, Quản lý tiếp nhận bàn giao).
  - Kỹ thuật hỗ trợ: `WF-18` (Nộp ngoại tuyến tách biệt với `TaskStatus`).
  - Giai đoạn tương lai: `WF-NEXT-01..03`.
- **Khắc phục 4 khiếm khuyết ngữ nghĩa:**
  - `P5-SC-01`: Xóa bỏ ngõ cụt khóa tài khoản; Quản lý hủy task có lý do và tạo task thay thế (`WF-12`).
  - `P5-SC-02`: Bổ sung `Role Change Impact Check`, điều kiện `ROLE_CHANGE_PENDING_OPERATIONAL_HANDOFF`, cấm người thăng chức tự duyệt bài của mình (`WF-11`).
  - `P5-SC-03`: Khái quát hóa cơ chế xác thực kỹ thuật sang ngữ nghĩa nghiệp vụ, hoãn triển khai sang Phase 11.
  - `P5-SC-04`: Đính chính tọa độ GPS chuẩn không phải là khóa duy nhất danh tính (`WF-13`).
- **Ma trận bàn giao:** 12 điểm bàn giao chuẩn tắc (`HO-01` đến `HO-12`).
- **Kết quả Checkpoint:** `PASS` (Khép kín toàn bộ luồng ngoại lệ, không có trạng thái vô chủ).

---

## 8. RTM Reconciliation (Đồng bộ hóa REQUIREMENTS-TRACEABILITY.md)

Tài liệu [`docs/REQUIREMENTS-TRACEABILITY.md`](file:///d:/ki7/EXE/tree/docs/REQUIREMENTS-TRACEABILITY.md) đã được đồng bộ hóa toàn diện:
- **Bảo toàn ID lịch sử:** Giữ nguyên 100% các mã yêu cầu vận hành `BR-01` đến `BR-13` (và các nhánh con `BR-01b`, `BR-02b`, `BR-04b/c`, `BR-05b`, `BR-07b`, `BR-08b`).
- **Bổ sung yêu cầu mới:** Bổ sung đầy đủ các yêu cầu quản trị và kiến trúc:
  - `BR-ACT-01`: Mô hình tác nhân 3 vai trò chuẩn tắc + System.
  - `BR-ADM-01..09`: 9 năng lực quản trị MVP của Admin (Cấp phát, Đổi vai trò, Khóa tài khoản, Mở khóa, Xem kiểm toán, Dữ liệu gốc cây xanh, Danh mục loại việc, Ánh xạ chính sách, Mẫu checklist).
  - `BR-ADM-10..12`: 3 năng lực giai đoạn `NEXT` (Dynamic Findings, Break-glass, Security Notifications).
  - `BR-ADM-13`: Năng lực bị bác bỏ `REJECTED` (Platform System Configuration).
  - `BR-DOM-01..04`: Sở hữu miền đơn nhất, Vòng đời 7 trạng thái, Tách biệt ngoại tuyến, Cấm Admin thao tác Task thực địa.
- **Tiêu chuẩn nghiệm thu:** Toàn bộ yêu cầu mới đều có Actor, Capability, Resource, Preconditions, và đánh dấu rõ `TO_BE_HARDENED_IN_PHASE_7` cho khâu tôi luyện bài test chi tiết tại Phase 7.
- **Kết quả Checkpoint:** `PASS` (Bao phủ 100% delta nghiệp vụ Phase 6).

---

## 9. Cross-Document Consistency Matrix (Ma trận Nhất quán Xuyên Tài liệu)

Bảng đối soát chứng minh tính đồng nhất tuyệt đối trên toàn bộ 5 tài liệu chuẩn tắc:

| Khái niệm Nghiệp vụ | `PRODUCT.md` | `DOMAIN.md` | `ACCESS-CONTROL.md` | `WORKFLOWS.md` | `TRACEABILITY.md` | Đánh giá Nhất quán |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Tác nhân con người** | Field Staff, Operations Manager, Platform Administrator | Field Staff, Operations Manager, Platform Administrator | Field Staff, Operations Manager, Platform Administrator | Field Staff, Operations Manager, Platform Administrator | Field Staff, Operations Manager, Platform Administrator | **PASS (Identical)** |
| **Tác nhân kỹ thuật** | System (Không phải UserRole) | System (Technical Actor) | System (Technical Automation) | System (Deterministic Execution) | System (Technical Actor) | **PASS (Identical)** |
| **Trạng thái Admin** | ACTIVE IN MVP | Actor trong Governance Plane | ACTIVE IN MVP (`PLATFORM_GOVERNANCE_SCOPE`) | Tác nhân quản trị (`WF-10..17`) | ACTIVE IN MVP (`BR-ADM-01..09`) | **PASS (Identical)** |
| **Năng lực Admin** | 9 MVP, 3 NEXT, 1 REJECTED | 9 MVP, 3 NEXT, 1 REJECTED | 9 MVP, 3 NEXT, 1 REJECTED | 9 MVP, 3 NEXT, 1 REJECTED | 9 MVP, 3 NEXT, 1 REJECTED | **PASS (Identical)** |
| **Số trạng thái Task** | Đúng 7 trạng thái | Đúng 7 trạng thái | Đúng 7 trạng thái | Đúng 7 trạng thái | Đúng 7 trạng thái | **PASS (Identical)** |
| **Hồ sơ bằng chứng** | 3 ProofProfiles | 3 ProofProfiles | 3 ProofProfiles | 3 ProofProfiles | 3 ProofProfiles | **PASS (Identical)** |
| **Kết luận Review** | Đúng 4 kết luận | Đúng 4 kết luận | Đúng 4 kết luận | Đúng 4 kết luận | Đúng 4 kết luận | **PASS (Identical)** |
| **Sở hữu tài nguyên** | Phân định rạch ròi | 1 Chủ sở hữu duy nhất | Theo Scope thẩm quyền | Bàn giao Handoff chuẩn | Ánh xạ Context rõ ràng | **PASS (Identical)** |
| **Quy tắc đổi người** | Cho phép ở PENDING/BLOCKED | Cấm đổi ở IN_PROGRESS/REWORK | Cấm đổi ở IN_PROGRESS/REWORK | Reassign Case A & Case B | BR-10 quy định rõ | **PASS (Identical)** |
| **Lịch sử chăm sóc** | CHỈ task COMPLETED | CHỈ task COMPLETED | CHỈ task COMPLETED | CHỈ task COMPLETED | BR-11 chiếu từ COMPLETED | **PASS (Identical)** |
| **Ngữ nghĩa ngoại tuyến**| Tách biệt độc lập | Tách biệt độc lập | Tách biệt độc lập | WF-18 tách biệt độc lập | BR-DOM-03 tách biệt | **PASS (Identical)** |
| **Định danh Cây xanh** | treeId bất biến, QR cấp đổi | treeId bất biến, QR cấp đổi | treeId bất biến, QR cấp đổi | treeId bất biến, QR cấp đổi | BR-ADM-06/06b/06c | **PASS (Identical)** |
| **Tọa độ chuẩn trắc địa**| Không phải khóa duy nhất | Không phải khóa duy nhất | Không phải khóa duy nhất | Kiểm tra dải đo/format | Tọa độ trắc địa hợp lệ | **PASS (Identical)** |
| **Đổi vai trò bàn giao**| Rà soát xung đột SoD | Trách nhiệm giải tỏa | Chặn tự duyệt bài | WF-11 Role Impact Check | BR-ADM-02/02b | **PASS (Identical)** |
| **Khóa tài khoản** | Không ngắt TaskStatus | Phát USER_UNAVAILABLE | Quản lý điều phối việc | WF-12 Disposition Matrix | BR-ADM-03/03b | **PASS (Identical)** |
| **Tính năng tương lai** | 3 NEXT khóa tại MVP | 3 NEXT khóa tại MVP | 3 NEXT khóa tại MVP | 3 NEXT khóa tại MVP | BR-ADM-10..12 NEXT | **PASS (Identical)** |

---

## 10. Requirement Delta $\to$ RTM Coverage (Bao phủ Delta vào RTM)

Toàn bộ các yêu cầu nghiệp vụ mới xuất hiện trong quá trình chuẩn hóa Phase 1–5 đều đã được ánh xạ 100% vào RTM:
- **`BR-ACT-01`**: Mô hình tác nhân 3 vai trò chuẩn tắc + System $\to$ Nguồn: Phase 1 `02-ACTOR-MODEL-DECISION.md`.
- **`BR-ADM-01..09`**: 9 năng lực quản trị MVP của Platform Administrator $\to$ Nguồn: Phase 2 `04-ADMIN-BUSINESS-SCOPE-DECISION.md`.
- **`BR-ADM-10..12`**: 3 năng lực bảo lưu giai đoạn `NEXT` $\to$ Nguồn: Phase 2 `04-ADMIN-BUSINESS-SCOPE-DECISION.md`.
- **`BR-ADM-13`**: Năng lực bị bác bỏ `REJECTED` $\to$ Nguồn: Phase 2 `04-ADMIN-BUSINESS-SCOPE-DECISION.md`.
- **`BR-DOM-01`**: Đơn vị sở hữu Bounded Context thẩm quyền đơn nhất $\to$ Nguồn: Phase 3 `05-DOMAIN-OWNERSHIP-MATRIX.md`.
- **`BR-DOM-02`**: Vòng đời 7 trạng thái và tính bất biến của trạng thái đóng $\to$ Nguồn: Phase 4 `07-AUTHORIZATION-ACTION-ELIGIBILITY.md`.
- **`BR-DOM-03`**: Ngữ nghĩa nộp ngoại tuyến tách biệt hoàn toàn với TaskStatus $\to$ Nguồn: Phase 5 `08-WORKFLOW-OPTIMIZATION.md`.
- **`BR-DOM-04`**: Ranh giới cấm Admin thao tác tác nghiệp thực địa $\to$ Nguồn: Phase 4 & Phase 5.
- **`BR-ADM-02b`**: Chống tự duyệt bài khi thăng chức từ Staff lên Manager $\to$ Nguồn: Phase 5 `P5-SC-02`.
- **`BR-ADM-03b`**: Ma trận xử lý khối lượng công việc khi nhân sự bị khóa $\to$ Nguồn: Phase 5 `P5-SC-01`.

---

## 11. Negative Consistency Tests (Thử nghiệm Phủ định Tính Nhất quán P6-NT-01..16)

| Mã Kiểm Thử | Kịch bản Sai lệch Ngữ nghĩa Giả định | Kết quả Mong đợi | Đánh giá Thực tế sau Đồng bộ Phase 6 | Kết luận |
|:---:|---|:---:|---|:---:|
| **P6-NT-01** | `PRODUCT.md` tuyên bố vai trò Admin là `RESERVED` hoặc `OUT_OF_MVP`. | **`FAIL` (Bị chặn)** | Bác bỏ: Admin được xác định là `ACTIVE IN MVP` tại Mục 2, 3 và 5. | **PASS** |
| **P6-NT-02** | `DOMAIN.md` chỉ thừa nhận sự tồn tại của Staff và Manager, bỏ quên Admin. | **`FAIL` (Bị chặn)** | Bác bỏ: `DOMAIN.md` định nghĩa đầy đủ Platform Administrator tại Mục 4. | **PASS** |
| **P6-NT-03** | `ACCESS-CONTROL.md` cho phép Admin thừa hưởng quyền hạn vận hành của Manager. | **`FAIL` (Bị chặn)** | Bác bỏ: Mục 1 & 2 khẳng định cấm quan hệ kế thừa cấp bậc; Admin zero task ops. | **PASS** |
| **P6-NT-04** | `WORKFLOWS.md` chèn thêm một làn bơi Admin vào quy trình thẩm định nhiệm vụ. | **`FAIL` (Bị chặn)** | Bác bỏ: Mục 3 (`WF-06`) khẳng định Admin hoàn toàn không có làn bơi thực địa. | **PASS** |
| **P6-NT-05** | `WORKFLOWS.md` tạo ra bước chuyển trạng thái `REWORK_REQUIRED -> BLOCKED`. | **`FAIL` (Bị chặn)** | Bác bỏ: `WF-07` nghiêm cấm gọi `ReportFieldIssue` tại `REWORK_REQUIRED`. | **PASS** |
| **P6-NT-06** | `WORKFLOWS.md` cho phép Quản lý Reassign trực tiếp task `IN_PROGRESS` khi Staff bị khóa. | **`FAIL` (Bị chặn)** | Bác bỏ: `WF-12` cấm Reassign trực tiếp; bắt buộc qua Cancel có lý do + tạo task mới. | **PASS** |
| **P6-NT-07** | `RTM` xuất hiện yêu cầu quản trị Admin mới mà thiếu Actor hoặc MVP Status. | **`FAIL` (Bị chặn)** | Bác bỏ: 100% yêu cầu `BR-ADM` đều có đầy đủ Actor, Context, Status, và Oracle ref. | **PASS** |
| **P6-NT-08** | Can thiệp vượt quyền Break-glass được miêu tả như một tính năng hoạt động trong MVP. | **`FAIL` (Bị chặn)** | Bác bỏ: Cả 5 tài liệu đều phân loại Break-glass thuộc nhóm `NEXT`, khóa tại MVP. | **PASS** |
| **P6-NT-09** | Bảng khám bệnh lâm sinh `StructuredFindings` bị coi là tùy chọn vì mẫu động là NEXT. | **`FAIL` (Bị chặn)** | Bác bỏ: `INSPECTION_PROOF` bắt buộc 100% Structured Findings (Fixed Schema). | **PASS** |
| **P6-NT-10** | Bản ghi Lịch sử chăm sóc `CareHistory` được tạo ra khi nhiệm vụ bị Hủy (`CANCELLED`). | **`FAIL` (Bị chặn)** | Bác bỏ: Bất biến `DR-HARD-07` khẳng định CHỈ task `COMPLETED` mới sinh CareHistory. | **PASS** |
| **P6-NT-11** | Xuất hiện trạng thái lai ghép `OFFLINE_SUBMITTED` trong enum `TaskStatus`. | **`FAIL` (Bị chặn)** | Bác bỏ: Cả 5 tài liệu khẳng định cấm `OFFLINE_SUBMITTED`; chỉ dùng `LocalSubmissionStatus`. | **PASS** |
| **P6-NT-12** | Admin có nút bấm hoặc API cho phép chỉnh sửa hoặc xóa dòng nhật ký kiểm toán. | **`FAIL` (Bị chặn)** | Bác bỏ: Bất biến `ADM-SOD-03` khẳng định kho kiểm toán là Append-Only, cấm sửa/xóa. | **PASS** |
| **P6-NT-13** | Operations Manager được tự ý chọn hạ cấp `ProofProfile` cho từng task riêng lẻ. | **`FAIL` (Bị chặn)** | Bác bỏ: Bất biến `DR-MVP-02` khóa cứng ánh xạ tất định từ `TaskType`. | **PASS** |
| **P6-NT-14** | Mã tem `qrCode` được miêu tả là bất biến vĩnh viễn không thể cấp đổi. | **`FAIL` (Bị chặn)** | Bác bỏ: `qrCode` có thể cấp đổi qua `ReplaceTreeQrCode` khi tem vật lý bị rách/hỏng. | **PASS** |
| **P6-NT-15** | Tọa độ GPS chuẩn của cây xanh bắt buộc phải là khóa duy nhất toàn cục. | **`FAIL` (Bị chặn)** | Bác bỏ: Tọa độ chỉ kiểm tra tính hợp lệ về định dạng/dải đo, không kiểm tra duy nhất. | **PASS** |
| **P6-NT-16** | Đổi vai trò cho phép người từng thi công được thẩm định và duyệt lại task của chính mình. | **`FAIL` (Bị chặn)** | Bác bỏ: Bất biến `DR-HARD-02` cấm 100% tự duyệt bài; bắt buộc Quản lý khác thẩm định. | **PASS** |

---

## 12. P6 Evidence Table (Bảng Bằng Chứng Nghiệm Thu Cổng Phase 6)

| Gate ID | Tiêu chí Nghiệm thu Cổng | Phương pháp Xác minh | Căn cứ Bằng chứng Cụ thể (Concrete Evidence) | Tính Chặn (Blocking) | Kết quả (Result) |
|:---:|---|---|---|:---:|:---:|
| **P6-01** | Actor names identical | Đối soát văn bản trên cả 5 tài liệu | `Field Staff`, `Operations Manager`, `Platform Administrator`, `System` xuất hiện đồng nhất 100% trên 5 tài liệu. | **YES** | **PASS** |
| **P6-02** | Role taxonomy identical | Phân loại phân tầng vai trò | Operational (`staff`, `manager`), Governance (`admin`), Technical (`System`). Không kế thừa cấp bậc. | **YES** | **PASS** |
| **P6-03** | Capability IDs identical | Đối soát mã định danh năng lực | `CAP-01..05` (Operational) và `CAP-ADM-01..13` (Governance) giữ nguyên định danh và ngữ nghĩa trên cả 5 tài liệu. | **YES** | **PASS** |
| **P6-04** | Command names identical | Đối soát từ vựng thao tác | `CreateTask`, `StartTask`, `SubmitEvidence`, `ReviewApprove`, `ProvisionUser`, `AssignRole`... đồng nhất. | **YES** | **PASS** |
| **P6-05** | Resource ownership identical | Kiểm tra ma trận sở hữu | Bounded Context sở hữu độc quyền: IAM sở hữu User/Account; Tree Registry sở hữu Tree; Work Management sở hữu Task. | **YES** | **PASS** |
| **P6-06** | MVP status identical | Rà soát trạng thái triển khai | Admin là `ACTIVE IN MVP`. `CAP-ADM-01..09` là `MVP`; `CAP-ADM-10..12` là `NEXT`; `CAP-ADM-13` là `REJECTED`. | **YES** | **PASS** |
| **P6-07** | No contradictory Admin scope | Rà soát ranh giới cấm của Admin | Cả 5 tài liệu đều xác định rõ Admin có zero operational task authority (`P4-09`), cấm duyệt hoặc can thiệp task. | **YES** | **PASS** |
| **P6-08** | No Admin RESERVED contradiction | Quét toàn văn từ khóa | Xóa bỏ hoàn toàn tuyên bố Admin là `RESERVED` / `OUT_OF_MVP` ở cấp vai trò trên cả 5 tài liệu. | **YES** | **PASS** |
| **P6-09** | No silent promotion proposed $\to$ canonical | Đối soát nguồn gốc quyết định | 100% nội dung đồng bộ đều truy xuất được nguồn gốc từ các Phase 1, 2, 3, 4 hoặc 5 đã đóng băng. | **YES** | **PASS** |
| **P6-10** | Every new business requirement in RTM | Đối soát delta yêu cầu sang RTM | Toàn bộ 16 yêu cầu nghiệp vụ mới (`BR-ACT-01`, `BR-ADM-01..13`, `BR-DOM-01..04`) đều đã được tích hợp vào RTM. | **YES** | **PASS** |

---

## 13. Residual Phase-7 Work (Công việc Còn lại Ấn định cho Phase 7)

Phase 6 đã hoàn thành xuất sắc mục tiêu **Đồng bộ hóa Ngữ nghĩa Quyết định (Decision Synchronization)** và thỏa mãn đầy đủ tiêu chí `P6-10` (toàn bộ yêu cầu có mặt trong RTM và có thể truy vết).

Phần công việc kiểm chứng chi tiết được bàn giao cho **Phase 7 (RTM Expansion & Acceptance Oracle Hardening)** bao gồm:
1. **Tôi luyện Tiêu chuẩn Nghiệm thu Nhị phân (Binary Acceptance Oracles):** Chuyển đổi các định nghĩa `TO_BE_HARDENED_IN_PHASE_7` của `BR-ADM-01..13` và `BR-DOM-01..04` thành các biểu thức logic nhị phân kiểm thử được độc lập.
2. **Xác lập Hợp đồng Kỹ thuật Mục tiêu (Target Contract Mappings):** Quy định chi tiết các Request/Response DTO cho các lệnh quản trị của Admin trong `@novyx/contracts`.
3. **Thiết kế Kịch bản Kiểm thử Kiểm toán (Audit Verification Test Scenarios):** Đặc tả chi tiết các ca kiểm thử tự động cho cơ chế meta-audit và tính bất biến append-only của kho lưu trữ.

---

## 14. Source Boundary Verification (Kiểm soát Ranh giới Mã nguồn)

Thực hiện kiểm tra ranh giới nghiêm ngặt trước khi kết thúc Phase 6:
- `git diff --name-only 550f9cdba681b1de0f717573afbb28c79d0217e7 HEAD -- apps packages`: **0 diff** (Tuyệt đối không sửa mã nguồn).
- `git diff --name-only 550f9cdba681b1de0f717573afbb28c79d0217e7 HEAD -- docs/diagrams`: **0 diff** (Tuyệt đối không sửa sơ đồ).
- `git diff --name-only 550f9cdba681b1de0f717573afbb28c79d0217e7 HEAD -- docs/ARCHITECTURE.md docs/NFR.md docs/TESTING.md DESIGN.md`: **0 diff** (Không can thiệp kiến trúc hay NFR).
- Danh sách tập tin thay đổi được kiểm soát:
  1. `docs/PRODUCT.md`
  2. `docs/DOMAIN.md`
  3. `docs/ACCESS-CONTROL.md`
  4. `docs/WORKFLOWS.md`
  5. `docs/REQUIREMENTS-TRACEABILITY.md`
  6. `docs/business-reconciliation/09-CANONICAL-DOCUMENT-RECONCILIATION-REPORT.md`
  7. `docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md` (Cập nhật trạng thái Phase 6)
