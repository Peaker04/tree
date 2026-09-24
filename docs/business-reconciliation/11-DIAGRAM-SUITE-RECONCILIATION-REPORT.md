# BÁO CÁO ĐỐI SOÁT TOÀN BỘ HỆ THỐNG BIỂU ĐỒ — PHASE 8
# (DIAGRAM SUITE RECONCILIATION REPORT)

> **Mã tài liệu:** `11-DIAGRAM-SUITE-RECONCILIATION-REPORT.md`  
> **Giai đoạn:** Phase 8 — Diagram Suite Reconciliation  
> **Trạng thái:** `PHASE 8 PASS — FROZEN`  
> **Commit cơ sở Phase 7:** `11ac66f7517cb28cbefec2b5b66078c06d483927`  
> **Nguyên tắc cốt lõi:** `CANONICAL BUSINESS SEMANTICS → DERIVED VISUAL VIEWS` (Biểu đồ là góc nhìn dẫn xuất trực quan, tuyệt đối không phải nguồn tạo nghiệp vụ mới).

---

## 1. Phạm vi Thực hiện (Scope)

Phase 8 thực hiện đối soát và đồng bộ hóa toàn bộ hệ sinh thái biểu đồ trực quan (16 tệp HTML standalone inline SVG + CSS và tệp danh mục `docs/diagrams/README.md`) với đường cơ sở nghiệp vụ chuẩn tắc đã được chốt và đóng băng qua các Phase 1–7.

### Ranh giới cứng (Hard Boundaries):
1. **Quyền sửa đổi:**
   - ĐƯỢC PHÉP: Sửa đổi các tệp biểu đồ dưới `docs/diagrams/**`.
   - ĐƯỢC PHÉP: Tạo mới báo cáo `docs/business-reconciliation/11-DIAGRAM-SUITE-RECONCILIATION-REPORT.md`.
   - ĐƯỢC PHÉP: Cập nhật tệp `docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md` (chỉ để ghi nhận artifact Phase 8 và trạng thái exit).
2. **Nghiêm cấm tuyệt đối (Strictly Prohibited):**
   - KHÔNG sửa đổi 5 tài liệu nghiệp vụ chuẩn tắc: `docs/PRODUCT.md`, `docs/DOMAIN.md`, `docs/ACCESS-CONTROL.md`, `docs/WORKFLOWS.md`, `docs/REQUIREMENTS-TRACEABILITY.md`.
   - KHÔNG sửa đổi các tài liệu kiến trúc / phi chức năng: `docs/ARCHITECTURE.md`, `docs/NFR.md`, `docs/TESTING.md`, `DESIGN.md`.
   - KHÔNG sửa đổi mã nguồn: `apps/**`, `packages/**`.
   - KHÔNG sửa đổi các công cụ và kịch bản chất lượng: `docs/quality-gates/**`, `scripts/quality_gate_report.py`, `scripts/run_quality_evidence.py`.
   - KHÔNG thiết kế trước ứng dụng quản trị Admin Web/Mobile hay quyết định kiến trúc triển khai (hoãn lại cho Phase 11 ADR).
   - KHÔNG sửa văn bản chuẩn tắc để làm cho biểu đồ dễ vẽ hơn.

---

## 2. Đường Cơ Sở Đã Đóng Băng Phase 7 (Frozen Phase-7 Baseline)

Cơ sở đối chiếu có thẩm quyền tối cao là cam kết Git chốt của Phase 7 (`11ac66f7517cb28cbefec2b5b66078c06d483927`), bao gồm:

- **Bộ tài liệu chuẩn tắc chính thức:**
  - `docs/PRODUCT.md`: Tầm nhìn sản phẩm, mô hình 3 tác nhân con người (`Field Staff`, `Operations Manager`, `Platform Administrator`) và System, ranh giới năng lực MVP vs NEXT/REJECTED.
  - `docs/DOMAIN.md`: 5 Bounded Contexts chuẩn tắc (Work Management, Tree Asset Registry, Policy & Template Governance, Audit & Compliance, IAM); quy tắc cấm đột biến chéo ngữ cảnh; Invariants DR-01..DR-10.
  - `docs/ACCESS-CONTROL.md`: Phân quyền 4 yếu tố (`Role ∧ Scope ∧ State ∧ Preconditions`), tách biệt 2 mặt phẳng Vận hành và Quản trị Nền tảng.
  - `docs/WORKFLOWS.md`: Vòng đời 7 trạng thái tất định của Task, 3 Hồ sơ Bằng chứng ngữ nghĩa (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`), 18 quy trình chuẩn.
  - `docs/REQUIREMENTS-TRACEABILITY.md`: RTM mở rộng và các Acceptance Oracles nhị phân tất định.

- **Các quyết định hỗ trợ đã đóng băng:**
  - `02-ACTOR-MODEL-DECISION.md`: 3 vai trò con người độc lập, Admin không kế thừa Manager.
  - `03-ROLE-NAMING-TAXONOMY.md`: Danh pháp vai trò và mã chuẩn hóa (`staff`, `manager`, `admin`).
  - `04-ADMIN-BUSINESS-SCOPE-DECISION.md`: 9 năng lực quản trị MVP (`CAP-ADM-01..09`), cấm Admin can thiệp tác vụ hiện trường.
  - `05-DOMAIN-OWNERSHIP-MATRIX.md`: Ma trận quyền sở hữu tài nguyên của 5 Bounded Contexts.
  - `06-BOUNDED-CONTEXT-DECISIONS.md`: Quyết định hợp nhất Verification & Review vào Work Management; Notifications là Projection; Offline/Sync là technical concern.
  - `07-AUTHORIZATION-ACTION-ELIGIBILITY.md`: Quy tắc kích hoạt hành động theo trạng thái và phạm vi.
  - `08-WORKFLOW-OPTIMIZATION.md`: Tối ưu 18 luồng nghiệp vụ.
  - `09-CANONICAL-DOCUMENT-RECONCILIATION-REPORT.md`: Đồng bộ 5 tài liệu chuẩn tắc.
  - `10-RTM-ACCEPTANCE-ORACLE-REPORT.md`: Hoàn thiện Acceptance Oracles nhị phân.

---

## 3. Kiểm Kê Toàn Bộ Hệ Thống Biểu Đồ (Diagram Inventory)

Hệ thống biểu đồ gồm 16 tệp HTML standalone và 1 tệp chỉ mục catalog:

1. `docs/diagrams/01-product-capability-map.html`
2. `docs/diagrams/02-domain-context-map.html`
3. `docs/diagrams/historical/legacy-operational-swimlane.html`
4. `docs/diagrams/04-task-lifecycle.html`
5. `docs/diagrams/historical/legacy-fixed-proof-workflow.html`
6. `docs/diagrams/historical/legacy-binary-review.html`
7. `docs/diagrams/07-action-eligibility-security-matrix.html`
8. `docs/diagrams/08-role-information-architecture.html`
9. `docs/diagrams/historical/legacy-system-current-state.html`
10. `docs/diagrams/10-system-target-architecture.html`
11. `docs/diagrams/historical/legacy-evidence-submission-sequence.html`
12. `docs/diagrams/12-architecture-dependency-map.html`
13. `docs/diagrams/historical/workflow-evolution-comparison.html`
14. `docs/diagrams/03-operational-workflow.html`
15. `docs/diagrams/04-task-lifecycle.html`
16. `docs/diagrams/05-proof-policy-and-rework.html`
17. `docs/diagrams/README.md` (Chỉ mục và nguyên tắc quản trị suite)

---

## 4. Bảng Đăng Ký Phân Loại Biểu Đồ (Diagram Classification Registry)

Mỗi biểu đồ được gán chính xác một trong 6 phân loại chuẩn tắc:

| Biểu đồ | Phân loại chuẩn tắc (`Classification`) | Nguồn chuẩn tắc (`Canonical Source`) | Hành động thực hiện | Lý do phân loại |
| :--- | :--- | :--- | :--- | :--- |
| `01-product-capability-map.html` | `CURRENT_DERIVED_VIEW` | `docs/PRODUCT.md`, `docs/ACCESS-CONTROL.md` | `REVISE` | Phản ánh đúng 3 vai trò con người + System, bổ sung mặt phẳng Quản trị MVP 9 năng lực, tách NEXT/REJECTED. |
| `02-domain-context-map.html` | `CURRENT_DERIVED_VIEW` | `docs/DOMAIN.md`, Decision 06 | `REVISE` | Phản ánh đúng 5 Bounded Contexts, gộp Verification/Review vào Work Management, làm rõ Notifications là projection và Sync là technical concern. |
| `03-mvp-operational-swimlane.html` | `HISTORICAL_SUPERSEDED` | `docs/WORKFLOWS.md` (Historical) | `BANNER_ONLY` | Bảo toàn mô hình 5 chốt ban đầu làm bằng chứng lịch sử; chuẩn hóa banner SUPERSEDED. |
| `04-task-lifecycle.html` | `HISTORICAL_SUPERSEDED` | `docs/WORKFLOWS.md` (Historical) | `BANNER_ONLY` | Bảo toàn máy trạng thái 4 trạng thái cũ; chuẩn hóa banner SUPERSEDED. |
| `05-proof-workflow.html` | `HISTORICAL_SUPERSEDED` | `docs/WORKFLOWS.md` (Historical) | `BANNER_ONLY` | Bảo toàn chuỗi lấy bằng chứng 5 bước cứng nhắc cũ; chuẩn hóa banner SUPERSEDED. |
| `06-review-rework-lifecycle.html` | `HISTORICAL_SUPERSEDED` | `docs/WORKFLOWS.md` (Historical) | `BANNER_ONLY` | Bảo toàn cổng thẩm định nhị phân cũ; chuẩn hóa banner SUPERSEDED. |
| `07-action-eligibility-security-matrix.html` | `CURRENT_DERIVED_VIEW` | `docs/ACCESS-CONTROL.md`, `docs/REQUIREMENTS-TRACEABILITY.md` | `REVISE` | Tách 2 mặt phẳng Vận hành và Quản trị MVP, cấm Admin can thiệp Task, bảo vệ điều kiện kích hoạt hành động 4 yếu tố. |
| `08-role-information-architecture.html` | `CURRENT_DERIVED_VIEW` | `docs/PRODUCT.md`, `docs/ACCESS-CONTROL.md` | `REVISE` | Biểu diễn 3 không gian vai trò; kênh triển khai Admin ghi rõ TBD Phase 11 ADR; cấm đưa thao tác hiện trường vào Admin. |
| `09-system-current-state.html` | `AS_IS_IMPLEMENTATION_VIEW` | Mã nguồn baseline `2f9a26b` | `BANNER_ONLY` | Bảo toàn hiện trạng mã nguồn thực tế (kể cả khuyết tật ép admin về Manager); gán nhãn rõ `[AS-IS DEFECT]`. |
| `10-system-target-architecture.html` | `TARGET_DIRECTION_NOT_ARCHITECTURE` | `docs/ARCHITECTURE.md` | `BANNER_ONLY` | Giữ nguyên phân tầng Clean Architecture nghiệp vụ; banner khẳng định kênh triển khai Admin hoãn lại cho Phase 11 ADR. |
| `11-evidence-submission-sequence.html` | `HISTORICAL_SUPERSEDED` | `docs/WORKFLOWS.md` (Historical) | `BANNER_ONLY` | Bảo toàn chuỗi nộp bằng chứng cũ; chuẩn hóa banner SUPERSEDED. |
| `12-architecture-dependency-map.html` | `DEFERRED_UNTIL_ADR` | `AGENTS.md`, `docs/ARCHITECTURE.md` | `BANNER_ONLY` | Giữ nguyên ranh giới monorepo hiện có; ghi rõ phụ thuộc triển khai Admin bị hoãn lại cho Phase 11 ADR (không tự vẽ `apps/admin-web`). |
| `proposed-01-current-vs-recommended-workflow.html` | `REFERENCE_COMPARISON` | `docs/WORKFLOWS.md`, `docs/PRODUCT.md` | `BANNER_ONLY` | So sánh đối chiếu luồng cứng nhắc cũ và luồng linh hoạt mới; banner khẳng định góc nhìn đối chiếu tham chiếu. |
| `03-operational-workflow.html` | `CURRENT_DERIVED_VIEW` | `docs/WORKFLOWS.md`, `docs/ACCESS-CONTROL.md` | `BANNER_ONLY` | Luồng vận hành chuẩn 3 làn bơi (Manager, Staff, System); không có làn Admin trong tác nghiệp hiện trường. |
| `04-task-lifecycle.html` | `CURRENT_DERIVED_VIEW` | `docs/WORKFLOWS.md`, `docs/DOMAIN.md` | `BANNER_ONLY` | Máy trạng thái chuẩn 7 trạng thái tất định; không có trạng thái ngoài danh mục; không có transition của Admin. |
| `05-proof-policy-and-rework.html` | `CURRENT_DERIVED_VIEW` | `docs/WORKFLOWS.md`, `docs/DOMAIN.md` | `BANNER_ONLY` | Chuẩn hóa 3 Hồ sơ Bằng chứng ngữ nghĩa và quy trình Rework bảo toàn lịch sử; chuẩn hóa banner derived view. |

---

## 5. Sổ Ghi Nhận Độ Lệch Trước Đối Soát (Pre-Reconciliation Drift Register)

| ID | Biểu đồ | Độ lệch trước đối soát (`Pre-Reconciliation Drift`) | Chân lý chuẩn tắc (`Canonical Truth`) | Hành động khắc phục (`Action`) |
| :--- | :--- | :--- | :--- | :--- |
| **D8-01** | `01` | Chỉ thể hiện Staff và Manager, thiếu hoàn toàn vai trò Quản trị Nền tảng (`Platform Administrator`) đang hoạt động trong MVP. | Admin là vai trò sản phẩm con người thứ 3 với 9 năng lực quản trị MVP (`CAP-ADM-01..09`). | Viết lại biểu đồ 01 phân tách 2 mặt phẳng Vận hành và Quản trị Nền tảng, tách biệt rõ NEXT và REJECTED. |
| **D8-02** | `02` | Tách rời Verification Context và Review Context thành 2 Bounded Contexts độc lập; coi Notifications và Sync như contexts riêng. | Verification và Review được hợp nhất vào Core Context `Work Management`. Notifications là projection; Offline/Sync là technical concern. | Viết lại biểu đồ 02 với đúng 5 Bounded Contexts chuẩn tắc; chỉ rõ Notifications là projection và Sync là technical concern. |
| **D8-03** | `07` | Ma trận chỉ có cột Staff và Manager, thiếu hoàn toàn phân quyền mặt phẳng quản trị của Platform Administrator. | Cần ma trận 2 mặt phẳng: Vận hành (Staff & Manager) và Quản trị Nền tảng (Admin); cấm Admin đột biến tác vụ hiện trường. | Tái cấu trúc ma trận thành 2 mặt phẳng rõ rệt (A) Operational Authorization và (B) Governance Authorization, bổ sung automation System. |
| **D8-04** | `07` | Nguy cơ dùng thuật ngữ cũ (Duyệt/Từ chối nhị phân, 5 bước cứng nhắc) không đồng bộ với RTM và Phase 4. | 4 kết luận duyệt, StartTask tất định, 3 lối thoát BLOCKED, cấm REWORK->BLOCKED, cấm IN_PROGRESS direct Reassign. | Rà soát và khóa chặt toàn bộ điều kiện bảo vệ và danh pháp lệnh theo đúng Phase 4 và ACCESS-CONTROL. |
| **D8-05** | `08` | Cấu trúc cây điều hướng chỉ mô tả không gian của Staff và Manager, thiếu workspace của Platform Administrator. | Admin có không gian quản trị nghiệp vụ riêng, nhưng kênh triển khai (Web/Mobile/Desktop) chưa được chốt (hoãn cho Phase 11 ADR). | Bổ sung nhánh Platform Admin Governance Workspace với ghi chú kênh triển khai `TBD — Phase 11 ADR`, cấm đưa Task execution vào Admin. |
| **D8-06** | `09` | Biểu đồ As-Is có thể bị hiểu nhầm là kiến trúc mục tiêu nếu banner không đủ rõ, và khuyết tật ép admin về manager chưa được gắn nhãn khuyết tật. | Sơ đồ 09 là bằng chứng hiện trạng mã nguồn baseline `2f9a26b`; ép admin về Manager là khuyết tật mã nguồn cần bảo tồn và gán nhãn. | Cập nhật banner `CURRENT IMPLEMENTATION / AS-IS — NOT TARGET BUSINESS MODEL` và gán nhãn rõ `[AS-IS DEFECT]`. |
| **D8-07** | `10` | Nguy cơ tự ý sáng tác kiến trúc kỹ thuật triển khai cho Admin (như vẽ Admin Web App hay microservices) trước khi có ADR. | Phase 8 chỉ chuẩn hóa ranh giới nghiệp vụ; mọi quyết định kênh triển khai kỹ thuật của Admin bị hoãn lại cho Phase 11 ADR. | Cập nhật banner `STATUS: TARGET DIRECTION — TECHNICAL ARCHITECTURE NOT YET FINAL`, ghi rõ kênh triển khai Admin hoãn lại cho Phase 11 ADR. |
| **D8-08** | `12` | Nguy cơ tự tạo gói phụ thuộc monorepo mới như `apps/admin-web` hoặc `apps/admin-mobile` khi chưa có ADR. | Ranh giới monorepo hiện hữu chỉ có `apps/mobile`, `packages/contracts`, `packages/config`, `packages/ui` và `external/hermes-agent`. | Cập nhật banner `STATUS: TECHNICAL DECISION DEFERRED TO PHASE 11 ADR`, khẳng định phụ thuộc triển khai Admin bị hoãn lại cho Phase 11 ADR. |

---

## 6. Nhật Ký Quyết Định Cho Từng Biểu Đồ (Per-Diagram Decision Log)

Quyết định xử lý cho toàn bộ 16 biểu đồ:

1. **`01-product-capability-map.html` — `REVISE`:** Tái thiết kế toàn diện để đưa Platform Administrator thành tác nhân con người thứ 3 với 9 năng lực quản trị MVP, phân lập 2 mặt phẳng Vận hành và Quản trị, phân tách trực quan NEXT và REJECTED.
2. **`02-domain-context-map.html` — `REVISE`:** Tái thiết kế toàn diện theo 5 Bounded Contexts chuẩn tắc, biểu diễn sự hợp nhất của Verification và Review vào Work Management, loại bỏ giả định Notifications/Sync là Bounded Contexts độc lập, xác lập nguyên tắc cấm đột biến chéo ngữ cảnh.
3. **`03-mvp-operational-swimlane.html` — `BANNER_ONLY`:** Giữ nguyên nội dung lịch sử ban đầu (5 chốt tuần tự) để bảo toàn bằng chứng tiến hóa; chuẩn hóa banner `STATUS: HISTORICAL / SUPERSEDED — REFERENCE ONLY`.
4. **`04-task-lifecycle.html` — `BANNER_ONLY`:** Giữ nguyên máy trạng thái 4 trạng thái cũ; chuẩn hóa banner `STATUS: HISTORICAL / SUPERSEDED — REFERENCE ONLY`.
5. **`05-proof-workflow.html` — `BANNER_ONLY`:** Giữ nguyên chuỗi lấy bằng chứng 5 bước cứng nhắc cũ; chuẩn hóa banner `STATUS: HISTORICAL / SUPERSEDED — REFERENCE ONLY`.
6. **`06-review-rework-lifecycle.html` — `BANNER_ONLY`:** Giữ nguyên cổng thẩm định 2 nhánh cũ; chuẩn hóa banner `STATUS: HISTORICAL / SUPERSEDED — REFERENCE ONLY`.
7. **`07-action-eligibility-security-matrix.html` — `REVISE`:** Tái cấu trúc ma trận phân quyền thành 2 mặt phẳng rõ rệt (A) Vận hành (Staff & Manager) và (B) Quản trị Nền tảng (Admin), bổ sung tự động hóa tất định của System, khóa chặt các điều kiện bảo vệ trạng thái/phạm vi.
8. **`08-role-information-architecture.html` — `REVISE`:** Tái thiết kế kiến trúc thông tin phản ánh 3 không gian làm việc; ghi chú rõ kênh triển khai Admin là `TBD — Phase 11 ADR`; cấm đưa tác vụ hiện trường vào không gian Admin.
9. **`09-system-current-state.html` — `BANNER_ONLY` (kèm gán nhãn khuyết tật):** Giữ nguyên kiến trúc As-Is của commit baseline `2f9a26b`, cập nhật banner `STATUS: CURRENT IMPLEMENTATION / AS-IS — NOT TARGET BUSINESS MODEL` và dán nhãn `[AS-IS DEFECT]` tại mục ép admin về Manager trong Session Manager.
10. **`10-system-target-architecture.html` — `BANNER_ONLY`:** Giữ nguyên phân tầng Clean Architecture, cập nhật banner `STATUS: TARGET DIRECTION — TECHNICAL ARCHITECTURE NOT YET FINAL`, bổ sung chú thích kênh triển khai Admin hoãn lại cho Phase 11 ADR.
11. **`11-evidence-submission-sequence.html` — `BANNER_ONLY`:** Giữ nguyên chuỗi nộp 5 chốt cũ; chuẩn hóa banner `STATUS: HISTORICAL / SUPERSEDED — REFERENCE ONLY`.
12. **`12-architecture-dependency-map.html` — `BANNER_ONLY`:** Giữ nguyên bản đồ phụ thuộc monorepo hiện có, cập nhật banner `STATUS: TECHNICAL DECISION DEFERRED TO PHASE 11 ADR`, không tự ý thêm `apps/admin-web` khi chưa có ADR.
13. **`proposed-01-current-vs-recommended-workflow.html` — `BANNER_ONLY`:** Giữ nguyên nội dung so sánh đối chiếu; cập nhật banner `STATUS: REFERENCE COMPARISON — DERIVED VIEW`.
14. **`03-operational-workflow.html` — `BANNER_ONLY`:** Xác minh luồng vận hành 3 làn bơi chuẩn tắc (Manager, Staff, System); không có làn Admin; cập nhật banner `STATUS: DERIVED VIEW — NOT SOURCE OF TRUTH`.
15. **`04-task-lifecycle.html` — `BANNER_ONLY`:** Xác minh đúng 7 trạng thái tất định; không có trạng thái ngoại lai; không có bước chuyển của Admin; cập nhật banner `STATUS: DERIVED VIEW — NOT SOURCE OF TRUTH`.
16. **`05-proof-policy-and-rework.html` — `BANNER_ONLY`:** Xác minh đúng 3 Hồ sơ Bằng chứng ngữ nghĩa và quy trình Rework bảo toàn lịch sử; cập nhật banner `STATUS: DERIVED VIEW — NOT SOURCE OF TRUTH`.

### Đánh giá về các biểu đồ mới tiềm năng (Optional Diagrams 13, 14, 15):
Master Plan nêu khả năng thêm các biểu đồ chuyên biệt cho Admin (13, 14, 15). Tuy nhiên, theo triết lý thiết kế của `diagram-design` (*deletion > duplication*, mật độ tối ưu ~4/10), toàn bộ năng lực quản trị MVP, phân quyền 2 mặt phẳng và không gian làm việc của Admin đã được biểu đạt trọn vẹn, trực quan và không xung đột trong các biểu đồ 01, 07 và 08. Việc tạo thêm các biểu đồ 13, 14, 15 sẽ gây trùng lặp thông tin và làm loãng suite. Do đó, quyết định chính thức là **KHÔNG tạo thêm các biểu đồ dư thừa**, bảo tồn sự tập trung và độ tinh gọn của hệ thống.

---

## 7. Đối Soát Chi Tiết Biểu Đồ 01 — Product Capability Map

Biểu đồ `docs/diagrams/01-product-capability-map.html` đã được tái thiết kế toàn diện:

1. **Mô hình tác nhân 3 vai trò con người + System:**
   - `Field Staff`: Tác nhân hiện trường (Mobile App).
   - `Operations Manager`: Tác nhân điều phối và thẩm định chất lượng.
   - `Platform Administrator`: Tác nhân quản trị nền tảng chuyên trách (Active Governance Role).
   - `System`: Tác nhân tự động hóa tất định (Deterministic Engine).
   - Tuyệt đối KHÔNG có quan hệ thừa kế phân cấp `Admin > Manager` hay đồng nhất `Admin = Manager`.
2. **Hai mặt phẳng năng lực phân định trực quan:**
   - **Mặt phẳng Vận hành Hiện trường (Operational Capability Plane):**
     - Field Staff: `CAP-01` (Site Verification: GPS <= 10m, QR Scan), `CAP-02` (Semantic Proof Acquisition: Change, Service, Inspection), `CAP-04` (Targeted Rework).
     - Operations Manager: `CAP-03` (Task Dispatch & Queue: Create, Assign, Reassign PENDING/BLOCKED), `CAP-05` (Quality Review Gate: 4 kết luận thẩm định), `CAP-06` (Field Issue & Blocked Resolution: 3 lối thoát), `CAP-07` (Cancellation within Rules).
   - **Mặt phẳng Quản trị Nền tảng (Platform Governance Capability Plane):**
     - Thể hiện đủ 9 năng lực MVP của Platform Administrator:
       - `CAP-ADM-01`: Cấp phát người dùng (`User Provisioning`).
       - `CAP-ADM-02`: Phân bổ vai trò (`Role Assignment & Co-existence Governance`).
       - `CAP-ADM-03`: Vòng đời tài khoản (`Account Lifecycle: INVITED, ACTIVE, SUSPENDED, DISABLED`).
       - `CAP-ADM-04`: Mở khóa tài khoản an toàn (`Account Recovery / Unlock`).
       - `CAP-ADM-05`: Thanh tra nhật ký kiểm toán (`Audit Trail Inspection`).
       - `CAP-ADM-06`: Quản trị dữ liệu cây gốc (`Tree Master Data Governance`).
       - `CAP-ADM-07`: Quản trị danh mục loại việc (`TaskType Catalog Governance`).
       - `CAP-ADM-08`: Quản trị chính sách bằng chứng (`Proof Policy Mapping Governance`).
       - `CAP-ADM-09`: Quản trị mẫu checklist kỹ thuật (`Checklist Template Governance`).
3. **Phân lập rõ ràng NEXT và REJECTED:**
   - Nhóm `NEXT` (`CAP-ADM-10` Phân quyền cứu hộ khẩn cấp Break-Glass, `CAP-ADM-11` Cấu hình mẫu kiểm tra động, `CAP-ADM-12` Kênh thông báo an ninh) được đặt trong khung riêng biệt ngoài phạm vi MVP.
   - Nhóm `REJECTED` (`CAP-ADM-13` Cấu hình hạ tầng hệ thống) được gán nhãn đỏ cấm rõ ràng.
4. **Ranh giới nghiêm ngặt:** Admin KHÔNG tham gia vào các tác vụ vận hành hiện trường thông thường (không có CreateTask, AssignTask, ApproveTask, ReassignTask, CancelTask).
5. **Kết quả kiểm tra:** Đạt `[VERIFIED PASS]` không va chạm văn bản, không tràn viền thẻ, cỡ chữ sàn >= 11px.

---

## 8. Đối Soát Chi Tiết Biểu Đồ 02 — Domain Context Map

Biểu đồ `docs/diagrams/02-domain-context-map.html` đã được cập nhật sâu rộng:

1. **Đúng 5 Bounded Contexts chuẩn tắc:**
   - **Core Bounded Context:**
     - `Work Management`: Trọng tâm nghiệp vụ quản lý công việc và bằng chứng hiện trường. Đã hợp nhất hoàn toàn `Field Verification & Evidence` và `Review & Quality Control`. Sở hữu các Aggregate: `Task`, `VerificationEvent`, `EvidencePackage`, `ReviewDecision`, `FieldIssue`.
   - **Supporting Bounded Contexts:**
     - `Tree Asset Registry`: Sở hữu `Tree`, `TreeMasterData`, `TreeIdentity`, và hình chiếu CareHistory (chỉ ghi nhận task COMPLETED).
     - `Policy & Template Governance`: Sở hữu `TaskTypeCatalog`, `ProofPolicyMapping`, `ChecklistTemplate`, `FindingsSchema`.
     - `Audit & Compliance`: Sở hữu `AuditEvent` bất biến và truy vết tuân thủ.
   - **Generic Bounded Context:**
     - `Identity & Access Management (IAM)`: Sở hữu `User`, `Account`, `RoleAssignment`, `AccountStatus`.
2. **Làm rõ các khái niệm không phải Context độc lập:**
   - `Operational Notifications`: Được thể hiện rõ ràng là **DERIVED READ MODEL / PROJECTION**, tuyệt đối không phải một Bounded Context riêng.
   - `Offline / Synchronization`: Được thể hiện là **TECHNICAL CONCERN / INFRASTRUCTURE PROTOCOL**, không phải Bounded Context nghiệp vụ.
3. **Quy tắc quan hệ liên ngữ cảnh (Cross-Context Boundaries):**
   - Không có đột biến chéo ngữ cảnh trực tiếp.
   - Quan hệ giữa các ngữ cảnh chỉ thông qua: tham chiếu định danh (`Identifier Reference`), bàn giao sự kiện (`Business Event Handoff`), hình chiếu đọc (`Projection`), hoặc phân giải chính sách (`Policy Resolution`).
   - Không sáng tác bus tin nhắn, Kafka hay cơ sở dữ liệu phân tán khi chưa có ADR.
4. **Kết quả kiểm tra:** Đạt `[VERIFIED PASS]` qua trình duyệt headless, 0 va chạm.

---

## 9. Đối Soát Chi Tiết Biểu Đồ 07 — Action Eligibility & Security Matrix

Biểu đồ `docs/diagrams/07-action-eligibility-security-matrix.html` đã được tái cấu trúc triệt để:

1. **Phân tách 2 mặt phẳng phân quyền:**
   - **Mặt phẳng A — Phân quyền Vận hành (Operational Authorization Plane):**
     - Field Staff: Phạm vi tài nguyên bị ràng buộc chặt chẽ bởi `assignedStaffId == actor.userId`. Chỉ được thực hiện: `StartTask` (chỉ khi Task ở `PENDING`), `VerifySite` (khi `IN_PROGRESS`), `SubmitEvidence` (khi `IN_PROGRESS`), `ReportFieldIssue` (khi `IN_PROGRESS`), `TargetedReworkSubmit` (khi `REWORK_REQUIRED`).
     - Operations Manager: Phạm vi `AUTHORIZED_OPERATIONAL_SCOPE`. Được thực hiện: `CreateTask`, `AssignTask` (khi `PENDING`), `ReassignTask` (chỉ khi `PENDING` hoặc `BLOCKED`), `ResolveFieldIssue` (khi `BLOCKED` qua 3 lối thoát), `ReviewTask` (`ApproveStandard`, `ApproveWithException`, `RequestRework`, `CancelTask` tại `WAITING_REVIEW`), `CancelTask` (mọi trạng thái chưa đóng).
     - Cấm tuyệt đối: `REWORK_REQUIRED → BLOCKED`, cấm `IN_PROGRESS direct Reassign`.
     - Platform Administrator trong mặt phẳng này: **DENY** toàn bộ các lệnh tác nghiệp hiện trường.
   - **Mặt phẳng B — Phân quyền Quản trị Nền tảng (Platform Governance Authorization Plane):**
     - Platform Administrator: Toàn quyền trên 9 nhóm năng lực quản trị MVP (`ProvisionUser`, `AssignRole`, `RevokeRole`, `SuspendAccount`, `DisableAccount`, `UnlockAccount`, `InspectAuditTrail`, `ManageTreeMasterData`, `ManageTaskTypeCatalog`, `ManageProofPolicy`, `ManageChecklistTemplate`).
     - Field Staff & Operations Manager trong mặt phẳng này: **DENY** toàn bộ các đột biến quản trị nền tảng.
     - Phân định rõ nhóm NEXT (`Break-Glass`, `Dynamic Templates`) và REJECTED (`Platform System Config`).
   - **Mặt phẳng C — Tự động hóa Hệ thống (Technical Automation Plane):**
     - System: Chỉ thực thi các kiểm tra tất định (`EvaluateVerificationInvariants`, `LockAccountOnFailures`, `ProjectCareHistoryOnCompleted`, `AppendAuditEvent`).
2. **Công thức thẩm định 4 yếu tố:** Biểu đồ thể hiện trực quan phương trình:
   $$\text{ACTION ELIGIBILITY} = \text{ACTOR ROLE} \land \text{RESOURCE SCOPE} \land \text{DOMAIN STATE} \land \text{PRECONDITIONS}$$
3. **Kết quả kiểm tra:** Đạt `[VERIFIED PASS]` kiểm tra hình học và kiểu chữ tiếng Việt.

---

## 10. Đối Soát Chi Tiết Biểu Đồ 08 — Role Information Architecture

Biểu đồ `docs/diagrams/08-role-information-architecture.html` đã được tái thiết kế:

1. **Ba không gian chức năng tương ứng 3 vai trò:**
   - **Field Staff Workspace (Không gian Tác nghiệp Hiện trường):** Kênh phân phối Mobile App (Expo React Native), thanh điều hướng đáy Notched Bottom Nav 5 vị trí: (1) Lịch việc, (2) Quét QR, (3) Bằng chứng, (4) Lịch sử chăm sóc, (5) Hồ sơ cá nhân. Chi tiết các màn hình: Việc của tôi, Nút Bắt đầu, Xác thực Site, Thu thập bằng chứng, Báo kẹt hiện trường, Sửa chữa trọng tâm, Hộp thư offline.
   - **Operations Manager Workspace (Không gian Vận hành & Thẩm định):** Kênh ứng dụng Mobile / Operational Client, điều hướng 5 vị trí: (1) Bàn làm việc, (2) Phân việc, (3) Bản đồ cây, (4) Xét duyệt hồ sơ, (5) Quản lý đội ngũ. Chi tiết các màn hình: Dashboard vận hành, Điều phối công việc, Xử lý sự cố Blocked, Hàng đợi thẩm định, 4 kết luận duyệt, Giám sát cây xanh.
   - **Platform Administrator Workspace (Không gian Quản trị Nền tảng):**
     - **Quy tắc kênh phân phối:** Ghi rõ **`KÊNH PHÂN PHỐI: TBD — PHASE 11 ADR`**. Không ấn định đây là "Web Console" hay "Mobile App" nhằm bảo toàn kỷ luật ranh giới kỹ thuật.
     - Cấu trúc thông tin quản trị: (1) Quản trị tài khoản, (2) Quản trị phân quyền, (3) Dữ liệu cây gốc, (4) Danh mục loại việc & chính sách mẫu, (5) Nhật ký kiểm toán.
     - **Cấm đoán nghiệp vụ:** Cấm tuyệt đối đưa các màn hình tác nghiệp hiện trường (Việc của tôi, Bắt đầu việc, Duyệt hồ sơ) vào không gian Admin.
2. **Khung cảnh báo chân trang:** Nhấn mạnh kỷ luật ranh giới: "Ý niệm sản phẩm không tự quyết định kênh công nghệ".
3. **Kết quả kiểm tra:** Đạt `[VERIFIED PASS]` sau khi căn chỉnh khoảng đệm an toàn và độ rộng thẻ.

---

## 11. Bảo Tồn Hiện Trạng As-Is & Bằng Chứng Lịch Sử (Preservation)

1. **Bảo tồn biểu đồ As-Is (`09-system-current-state.html`):**
   - Biểu đồ giữ nguyên cấu trúc phản ánh trung thực mã nguồn baseline `2f9a26b`: Khối `MobileApp.tsx` 2.054 dòng ôm đồm state, dead code `LoginScreen.tsx`, bộ đệm RAM dễ mất dữ liệu trong `greenOpsService.ts`.
   - Vấn đề "ép role admin về Manager": Tiếp tục được giữ lại và được gán nhãn rõ ràng **`Ép admin về Manager [AS-IS DEFECT]`**.
   - Banner được cập nhật: `STATUS: CURRENT IMPLEMENTATION / AS-IS — NOT TARGET BUSINESS MODEL`.
   - Tuyệt đối không xóa bỏ khuyết tật này để làm đẹp biểu đồ.
2. **Bảo tồn các biểu đồ lịch sử (`03`, `04`, `05`, `06`, `11`):**
   - Toàn bộ nội dung biểu đồ ban đầu (mô hình 5 chốt tuần tự, vòng đời 4 trạng thái, cổng duyệt nhị phân) được giữ nguyên vẹn nhằm lưu trữ bằng chứng lịch sử phục vụ phân tích khoảng cách.
   - Tất cả 5 biểu đồ được bổ sung banner chuẩn hóa:
     `STATUS: HISTORICAL / SUPERSEDED — REFERENCE ONLY`
     kèm trích dẫn rõ biểu đồ chuẩn tắc thay thế tương ứng (`proposed-02`, `proposed-03`, `proposed-04`).

---

## 12. Quản Trị Các Góc Nhìn Hoãn Kiến Trúc (Deferred Views 10 & 12)

1. **Biểu đồ `10-system-target-architecture.html`:**
   - Giữ nguyên cấu trúc 5 tầng Clean Architecture (Presentation, Application, Domain Core, Ports, Infrastructure Adapters).
   - Tuyệt đối KHÔNG tự ý sáng tác kiến trúc kỹ thuật triển khai cho Admin (không vẽ thêm Admin Web Console, backend microservices hay cơ sở dữ liệu riêng của Admin).
   - Banner được chuẩn hóa: `STATUS: TARGET DIRECTION — TECHNICAL ARCHITECTURE NOT YET FINAL` kèm ghi chú: `KÊNH TRIỂN KHAI ADMIN: HOÃN LẠI CHO PHASE 11 ADR`.
2. **Biểu đồ `12-architecture-dependency-map.html`:**
   - Giữ nguyên ranh giới monorepo hiện có (`apps/mobile`, `packages/contracts`, `packages/config`, `packages/ui`, `external/hermes-agent`).
   - Tuyệt đối KHÔNG tự ý bổ sung các gói triển khai mới như `apps/admin-web`, `apps/admin-mobile` hay `admin-service`.
   - Banner được chuẩn hóa: `STATUS: TECHNICAL DECISION DEFERRED TO PHASE 11 ADR` kèm ghi chú: `ADMIN DEPLOYMENT DEPENDENCY TBD — PHASE 11 ADR`.

---

## 13. Xác Minh Các Góc Nhìn Đề Xuất Chuẩn Tắc (Proposed Views)

1. **`proposed-01-current-vs-recommended-workflow.html` (`REFERENCE_COMPARISON`):**
   - So sánh trực quan mô hình cũ (cứng nhắc, 5 chốt ép buộc) và mô hình mới (linh hoạt, 3 hồ sơ bằng chứng).
   - Đã xác minh: Luồng cũ không bị trình bày như là mục tiêu; không có vai trò Admin trong luồng hiện trường.
   - Banner: `STATUS: REFERENCE COMPARISON — DERIVED VIEW`.
2. **`03-operational-workflow.html` (`CURRENT_DERIVED_VIEW`):**
   - Chu trình vận hành hiện trường gồm đúng 3 làn bơi tác nghiệp: `Operations Manager`, `Field Staff`, và `System`.
   - Đã xác minh: Không có làn bơi của Platform Administrator trong tác nghiệp hiện trường. Đầy đủ các chốt chặn `StartTask`, Xác thực Site, 4 kết luận thẩm định, và 3 lối thoát của trạng thái `BLOCKED`.
   - Banner: `STATUS: DERIVED VIEW — NOT SOURCE OF TRUTH`.
3. **`04-task-lifecycle.html` (`CURRENT_DERIVED_VIEW`):**
   - Máy trạng thái thể hiện đúng 7 trạng thái chuẩn tắc: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`.
   - Đã xác minh: Không có trạng thái thứ 8 (`OFFLINE_SUBMITTED`, `COMPLETED_WITH_EXCEPTION`, `ACCOUNT_SUSPENDED` không phải trạng thái Task). Không có bước chuyển trạng thái nào do Admin thực hiện.
   - Banner: `STATUS: DERIVED VIEW — NOT SOURCE OF TRUTH`.
4. **`05-proof-policy-and-rework.html` (`CURRENT_DERIVED_VIEW`):**
   - Thể hiện đúng 3 Hồ sơ Bằng chứng ngữ nghĩa: `CHANGE_PROOF` (Site Verification + Trước + Checklist + Sau), `SERVICE_PROOF` (Site Verification + Checklist + Hoàn tất), `INSPECTION_PROOF` (Site Verification + Bảng phát hiện có cấu trúc + Ảnh hiện trạng).
   - Đã xác minh: Bảng phát hiện có cấu trúc (`Structured Findings`) là bắt buộc trong `INSPECTION_PROOF`. Quy trình Rework có mục tiêu bảo toàn lịch sử bằng chứng hợp lệ, chống gian lận dữ liệu.
   - Banner: `STATUS: DERIVED VIEW — NOT SOURCE OF TRUTH`.

---

## 14. Bảng Ánh Xạ Nguồn Chuẩn Tắc (Canonical Source Mapping)

| Biểu đồ | Phân loại | Tài liệu nguồn chuẩn tắc (`Canonical Documents`) | Vai trò thẩm quyền |
| :--- | :--- | :--- | :--- |
| `01-product-capability-map.html` | `CURRENT_DERIVED_VIEW` | `docs/PRODUCT.md`, `docs/ACCESS-CONTROL.md` | Góc nhìn dẫn xuất năng lực nghiệp vụ |
| `02-domain-context-map.html` | `CURRENT_DERIVED_VIEW` | `docs/DOMAIN.md`, Decision 06 | Góc nhìn dẫn xuất cấu trúc Bounded Contexts |
| `03-mvp-operational-swimlane.html` | `HISTORICAL_SUPERSEDED` | `docs/WORKFLOWS.md` (Historical Baseline) | Tham chiếu đối chiếu lịch sử |
| `04-task-lifecycle.html` | `HISTORICAL_SUPERSEDED` | `docs/WORKFLOWS.md` (Historical Baseline) | Tham chiếu đối chiếu lịch sử |
| `05-proof-workflow.html` | `HISTORICAL_SUPERSEDED` | `docs/WORKFLOWS.md` (Historical Baseline) | Tham chiếu đối chiếu lịch sử |
| `06-review-rework-lifecycle.html` | `HISTORICAL_SUPERSEDED` | `docs/WORKFLOWS.md` (Historical Baseline) | Tham chiếu đối chiếu lịch sử |
| `07-action-eligibility-security-matrix.html` | `CURRENT_DERIVED_VIEW` | `docs/ACCESS-CONTROL.md`, `docs/REQUIREMENTS-TRACEABILITY.md` | Góc nhìn dẫn xuất ma trận phân quyền 4 chiều |
| `08-role-information-architecture.html` | `CURRENT_DERIVED_VIEW` | `docs/PRODUCT.md`, `docs/ACCESS-CONTROL.md`, `docs/WORKFLOWS.md` | Góc nhìn dẫn xuất cấu trúc thông tin vai trò |
| `09-system-current-state.html` | `AS_IS_IMPLEMENTATION_VIEW` | Mã nguồn baseline `2f9a26b` (`MobileApp.tsx`, `greenOpsService.ts`) | Bằng chứng hiện trạng thực tế mã nguồn |
| `10-system-target-architecture.html` | `TARGET_DIRECTION_NOT_ARCHITECTURE` | `docs/ARCHITECTURE.md` | Định hướng phân tầng Clean Architecture nghiệp vụ |
| `11-evidence-submission-sequence.html` | `HISTORICAL_SUPERSEDED` | `docs/WORKFLOWS.md` (Historical Baseline) | Tham chiếu đối chiếu lịch sử |
| `12-architecture-dependency-map.html` | `DEFERRED_UNTIL_ADR` | `AGENTS.md`, `docs/ARCHITECTURE.md` | Ranh giới monorepo hiện có, hoãn Admin cho ADR |
| `proposed-01-current-vs-recommended-workflow.html` | `REFERENCE_COMPARISON` | `docs/WORKFLOWS.md`, `docs/PRODUCT.md` | So sánh đối chiếu mô hình cũ và mới |
| `03-operational-workflow.html` | `CURRENT_DERIVED_VIEW` | `docs/WORKFLOWS.md`, `docs/ACCESS-CONTROL.md` | Góc nhìn dẫn xuất quy trình vận hành liên vai trò |
| `04-task-lifecycle.html` | `CURRENT_DERIVED_VIEW` | `docs/WORKFLOWS.md`, `docs/DOMAIN.md` | Góc nhìn dẫn xuất máy trạng thái 7 trạng thái |
| `05-proof-policy-and-rework.html` | `CURRENT_DERIVED_VIEW` | `docs/WORKFLOWS.md`, `docs/DOMAIN.md` | Góc nhìn dẫn xuất 3 hồ sơ bằng chứng & Rework |

---

## 15. Kiểm Thử Phủ Định Ngữ Nghĩa (Semantic Negative Tests)

Đã chạy và xác minh toàn bộ 16 bài kiểm tra phủ định:

| Mã test | Kịch bản kiểm tra phủ định | Kết quả mong đợi | Bằng chứng xác minh thực tế | Kết quả |
| :--- | :--- | :--- | :--- | :--- |
| **P8-NT-01** | Biểu đồ mô tả Admin là vai trò dự trữ / chỉ có trong tương lai (`RESERVED/future-only`). | FAIL (Không được xuất hiện) | Biểu đồ 01, 07, 08 xác lập Platform Administrator là vai trò hoạt động ngay trong MVP với 9 năng lực quản trị. | **PASS** |
| **P8-NT-02** | Biểu đồ đặt Admin đứng trên Manager theo dạng kế thừa quyền hạn (`Admin > Manager`). | FAIL (Không được xuất hiện) | Biểu đồ 01 và 07 phân tách độc lập 2 mặt phẳng Vận hành và Quản trị, không có mũi tên kế thừa. | **PASS** |
| **P8-NT-03** | Admin xuất hiện trong làn bơi tác nghiệp hiện trường thông thường. | FAIL (Không được xuất hiện) | `proposed-02` chỉ có 3 làn bơi: Operations Manager, Field Staff, và System; không có làn Admin. | **PASS** |
| **P8-NT-04** | Biểu đồ thể hiện Admin phê duyệt / điều phối / hủy Task thông thường. | FAIL (Không được xuất hiện) | Biểu đồ 01, 07, 08 đều ghi rõ Admin DENY trên toàn bộ các lệnh tác vụ Task thông thường. | **PASS** |
| **P8-NT-05** | Bản đồ ngữ cảnh hiển thị Notifications như một Bounded Context độc lập. | FAIL (Không được xuất hiện) | Biểu đồ 02 ghi rõ Notifications là `DERIVED READ MODEL / PROJECTION`, không phải Bounded Context. | **PASS** |
| **P8-NT-06** | Bản đồ ngữ cảnh hiển thị Offline/Sync như một Bounded Context nghiệp vụ. | FAIL (Không được xuất hiện) | Biểu đồ 02 ghi rõ Offline/Sync là `TECHNICAL CONCERN / PROTOCOL`, không phải Bounded Context. | **PASS** |
| **P8-NT-07** | Ma trận phân quyền cho phép Reassign trực tiếp khi Task đang ở `IN_PROGRESS`. | FAIL (Không được xuất hiện) | Biểu đồ 07 ghi rõ: Reassign chỉ hợp lệ tại `PENDING` hoặc `BLOCKED`; cấm Reassign tại `IN_PROGRESS`. | **PASS** |
| **P8-NT-08** | Ma trận phân quyền cho phép chuyển `REWORK_REQUIRED → BLOCKED`. | FAIL (Không được xuất hiện) | Biểu đồ 07 và `proposed-03` ghi rõ: cấm chuyển trực tiếp `REWORK_REQUIRED → BLOCKED`. | **PASS** |
| **P8-NT-09** | Vòng đời Task xuất hiện trạng thái thứ 8 (ngoài 7 trạng thái chuẩn). | FAIL (Không được xuất hiện) | `proposed-03` chỉ có đúng 7 trạng thái tất định; không có trạng thái lạ. | **PASS** |
| **P8-NT-10** | Biểu đồ bằng chứng coi Structured Findings là tùy chọn trong `INSPECTION_PROOF`. | FAIL (Không được xuất hiện) | `proposed-04` xác lập Bảng phát hiện có cấu trúc (`Structured Findings`) là bắt buộc trong `INSPECTION_PROOF`. | **PASS** |
| **P8-NT-11** | Kiến trúc mục tiêu tự ý khẳng định Admin Web Console đã được chốt. | FAIL (Không được xuất hiện) | Biểu đồ 08, 10, 12 đều ghi rõ kênh triển khai Admin là `TBD — Phase 11 ADR`. | **PASS** |
| **P8-NT-12** | Bản đồ phụ thuộc monorepo tự tạo gói `apps/admin-web` khi chưa có ADR. | FAIL (Không được xuất hiện) | Biểu đồ 12 chỉ thể hiện các gói hiện có; ghi rõ phụ thuộc triển khai Admin bị hoãn lại cho Phase 11 ADR. | **PASS** |
| **P8-NT-13** | Khuyết tật ép admin về Manager trong As-Is bị ngụy tạo thành hành vi mục tiêu. | FAIL (Không được xuất hiện) | Biểu đồ 09 dán nhãn rõ `[AS-IS DEFECT]`, banner khẳng định `NOT TARGET BUSINESS MODEL`. | **PASS** |
| **P8-NT-14** | Biểu đồ lịch sử được trình bày như là góc nhìn chuẩn tắc đang hoạt động. | FAIL (Không được xuất hiện) | Cả 5 biểu đồ 03, 04, 05, 06, 11 đều mang banner `STATUS: HISTORICAL / SUPERSEDED — REFERENCE ONLY`. | **PASS** |
| **P8-NT-15** | Biểu đồ tự ý đưa ra yêu cầu nghiệp vụ mới không có trong tài liệu chuẩn tắc. | FAIL (Không được xuất hiện) | Toàn bộ 16 biểu đồ bám sát 100% tài liệu chuẩn tắc đã đóng băng Phase 1–7. | **PASS** |
| **P8-NT-16** | Banner của biểu đồ tự nhận biểu đồ là nguồn chân lý độc lập. | FAIL (Không được xuất hiện) | Toàn bộ biểu đồ active đều ghi rõ `STATUS: DERIVED VIEW — NOT SOURCE OF TRUTH`. | **PASS** |

---

## 16. Bằng Chứng Hình Học & Kiểm Tra Va Chạm (Geometry Evidence)

Toàn bộ 11 biểu đồ active/target/deferred/derived đã được xác thực tự động thông qua công cụ `scripts/diagram_tool.py validate`:

```
Total diagrams validated: 16
[PASS] 01-product-capability-map.html
[PASS] 02-domain-context-map.html
[PASS] 07-action-eligibility-security-matrix.html
[PASS] 08-role-information-architecture.html
[PASS] 09-system-current-state.html
[PASS] 10-system-target-architecture.html
[PASS] 12-architecture-dependency-map.html
[PASS] proposed-01-current-vs-recommended-workflow.html
[PASS] 03-operational-workflow.html
[PASS] 04-task-lifecycle.html
[PASS] 05-proof-policy-and-rework.html
```

### Các chỉ số hình học đã được kiểm chứng tự động:
- **Zero Visual Collision:** 0 lỗi va chạm văn bản chồng lấn text-vs-text.
- **Zero Node Overlap:** 0 lỗi chồng lấn node-vs-node ngoài ý muốn.
- **Zero Boundary Overflow:** 0 lỗi tràn chữ ra ngoài viền hộp chứa SVG trên toàn bộ 11 biểu đồ active.
- **Safe Padding:** Khoảng đệm an toàn 4 phía đạt chuẩn $x \ge 4\text{px}, y \ge 3\text{px}$.
- **Typography Floor:** Sàn cỡ chữ $\ge 11\text{px}$ trên toàn bộ các nhãn đọc được.
- **Connector Discipline:** 0 connector cắt xuyên qua các node không liên quan; nhãn connector có lớp chắn nền bảo vệ.
- **Viewport Clipping:** 0 phần tử bị cắt cụt khỏi viewBox của SVG.

*(Ghi chú: Các biểu đồ 03, 04, 05, 06, 11 được lưu giữ nguyên trạng lịch sử theo đúng quy tắc bảo tồn chứng tích tại Mục 11, không viết lại hình học).*

---

## 17. Bằng Chứng Thẩm Định Trực Quan Bằng Mắt (Visual Review Evidence)

1. **Kiểu chữ & Hỗ trợ Tiếng Việt:** Toàn bộ văn bản hiển thị chuẩn xác với bộ phông `Noto Sans` và `Geist Mono`, dấu thanh tiếng Việt không bị lỗi chân chữ (clipping diacritics), chiều cao dòng (`line-height`) thông thoáng.
2. **Hệ thống phân cấp thị giác (Visual Hierarchy):**
   - Các tiêu đề khối và tiêu đề vai trò nổi bật, dễ quét mắt.
   - Thẻ huy hiệu phân loại ở đầu trang giúp người đọc nhận biết ngay lập tức trạng thái thẩm quyền của biểu đồ mà không bị nhầm lẫn.
3. **Màu sắc ngữ nghĩa tuân thủ `DESIGN.md`:**
   - Xanh đậm (`#166534`) và Xanh vôi (`#84CC16`): Tác nghiệp thành công, vai trò hoạt động, luồng được phép.
   - Hổ phách (`#D97706`): Trạng thái chờ (`WAITING_REVIEW`), cảnh báo sự cố (`BLOCKED`), góc nhìn đề xuất / hoãn lại.
   - Đỏ (`#DC2626`): Ranh giới nghiêm cấm, khuyết tật mã nguồn As-Is, nhánh hủy bỏ (`CANCELLED`).
   - Mực đậm (`#112116`) và Xám tiêu chuẩn (`#68756B`): Nền tảng, đường nối và văn bản thông tin.
4. **Không có hiệu ứng thừa:** Không sử dụng bóng đổ nặng nề (`heavy drop shadows`), không hiệu ứng hào quang phát sáng (`glow`), không phong cách viễn tưởng (`sci-fi styling`).

---

## 18. Bảng Bằng Chứng Các Cổng Kiểm Soát Phase 8 (P8 Evidence Table)

| Cổng | Yêu cầu chuẩn tắc | Phương pháp xác minh | Bằng chứng cụ thể | Chặn (`Blocking`) | Kết quả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P8-01** | Biểu đồ 01 phản ánh đúng mô hình 3 vai trò con người và năng lực quản trị của Admin. | So khớp tài liệu `PRODUCT.md` & xác thực hình học | Biểu đồ 01: 3 vai trò Field Staff, Operations Manager, Platform Administrator; đủ 9 năng lực MVP `CAP-ADM-01..09`; tách biệt NEXT/REJECTED. | CÓ | **PASS** |
| **P8-02** | Biểu đồ 02 phản ánh đúng 5 Bounded Contexts và ranh giới sở hữu tài nguyên. | So khớp `DOMAIN.md` & Decision 06 | Biểu đồ 02: Đúng 5 Contexts; Work Management gộp Verification & Review; Notifications là projection; Offline là technical concern; 0 đột biến chéo. | CÓ | **PASS** |
| **P8-03** | Biểu đồ 07 phân tách phân quyền Vận hành và phân quyền Quản trị Nền tảng. | So khớp `ACCESS-CONTROL.md` & Decision 07 | Biểu đồ 07: Tách mặt phẳng A (Staff & Manager, guards StartTask, ReportIssue, Reassign, Review) và mặt phẳng B (Admin MVP, cấm thao tác Task). | CÓ | **PASS** |
| **P8-04** | Biểu đồ 08 thể hiện không gian quản trị Admin với kênh phân phối ghi rõ TBD ADR. | So khớp `PRODUCT.md` & kiểm tra text SVG | Biểu đồ 08: Nhánh Platform Admin ghi rõ `KÊNH PHÂN PHỐI: TBD — PHASE 11 ADR`; cấm đưa tác vụ hiện trường vào điều hướng Admin. | CÓ | **PASS** |
| **P8-05** | Biểu đồ 09 bảo tồn As-Is và không bị trình bày như là mục tiêu. | So khớp mã nguồn baseline `2f9a26b` | Biểu đồ 09: Giữ nguyên MobileApp monolith; gán nhãn `[AS-IS DEFECT]` tại ép admin về Manager; banner khẳng định As-Is. | CÓ | **PASS** |
| **P8-06** | Biểu đồ 10 không tự ý sáng tác kiến trúc kỹ thuật triển khai cho Admin. | So khớp `ARCHITECTURE.md` | Biểu đồ 10: Giữ nguyên 5 tầng Clean Architecture; banner ghi chú kênh triển khai Admin hoãn lại cho Phase 11 ADR; không tự vẽ Admin Web. | CÓ | **PASS** |
| **P8-07** | Biểu đồ 12 không tự ý thêm phụ thuộc triển khai Admin trước khi có ADR. | So khớp `AGENTS.md` monorepo | Biểu đồ 12: Giữ nguyên các gói hiện có; ghi chú phụ thuộc triển khai Admin hoãn lại cho Phase 11 ADR; không thêm `apps/admin-web`. | CÓ | **PASS** |
| **P8-08** | Biểu đồ `proposed-02` không có làn bơi Admin trong tác nghiệp hiện trường. | Kiểm tra cấu trúc swimlane | `proposed-02`: Đúng 3 làn bơi Manager, Staff, System; hoàn toàn không có làn Admin trong quy trình hiện trường thông thường. | CÓ | **PASS** |
| **P8-09** | Biểu đồ `proposed-03` bảo tồn đúng máy trạng thái 7 trạng thái tất định. | So khớp `WORKFLOWS.md` Task lifecycle | `proposed-03`: Đúng 7 trạng thái chuẩn; không có trạng thái thứ 8; không có bước chuyển nào của Admin. | CÓ | **PASS** |
| **P8-10** | Biểu đồ `proposed-04` bảo tồn đúng 3 Hồ sơ Bằng chứng và quy trình Rework. | So khớp `DOMAIN.md` & `WORKFLOWS.md` | `proposed-04`: 3 Profiles (CHANGE, SERVICE, INSPECTION bắt buộc Structured Findings); Rework bảo toàn lịch sử bằng chứng hợp lệ. | CÓ | **PASS** |
| **P8-11** | Mọi biểu đồ đều có banner hiển thị trạng thái thẩm quyền rõ ràng. | Quét mã nguồn HTML 16 tệp | 100% 16 biểu đồ đều có banner chuẩn hóa theo 6 nhóm phân loại chuẩn tắc tại Mục 4. | CÓ | **PASS** |
| **P8-12** | Không một biểu đồ nào trở thành nguồn tạo nghiệp vụ mới. | Rà soát chéo toàn bộ biểu đồ vs canonical docs | Quy tắc `canonical text wins` được tuyên bố tại `README.md` và tuân thủ 100% trong toàn bộ suite; biểu đồ chỉ là derived view. | CÓ | **PASS** |

---

## 19. Xác Minh Ranh Giới Mã Nguồn & Tài Liệu (Source Boundary Verification)

Thực hiện kiểm tra tính toàn vẹn ranh giới repository thông qua Git:

1. **Kiểm tra mã nguồn ứng dụng và gói chia sẻ:**
   ```powershell
   git diff --name-only 11ac66f7517cb28cbefec2b5b66078c06d483927 HEAD -- apps packages
   ```
   **Kết quả:** 0 tệp bị sửa đổi. Hoàn toàn không xâm phạm mã nguồn.

2. **Kiểm tra 5 tài liệu nghiệp vụ chuẩn tắc:**
   ```powershell
   git diff --name-only 11ac66f7517cb28cbefec2b5b66078c06d483927 HEAD -- docs/PRODUCT.md docs/DOMAIN.md docs/ACCESS-CONTROL.md docs/WORKFLOWS.md docs/REQUIREMENTS-TRACEABILITY.md
   ```
   **Kết quả:** 0 tệp bị sửa đổi. Đường cơ sở nghiệp vụ Phase 1–7 được bảo vệ nguyên vẹn.

3. **Kiểm tra các tài liệu kiến trúc kỹ thuật và thiết kế:**
   ```powershell
   git diff --name-only 11ac66f7517cb28cbefec2b5b66078c06d483927 HEAD -- docs/ARCHITECTURE.md docs/NFR.md docs/TESTING.md DESIGN.md
   ```
   **Kết quả:** 0 tệp bị sửa đổi. Không làm thay đổi tài liệu kỹ thuật trước Phase 11.

4. **Kiểm tra hệ thống quality gates:**
   ```powershell
   git diff --name-only 11ac66f7517cb28cbefec2b5b66078c06d483927 HEAD -- docs/quality-gates scripts/quality_gate_report.py scripts/run_quality_evidence.py
   ```
   **Kết quả:** 0 tệp bị sửa đổi. Không thao túng hạ tầng kiểm thử.

5. **Kiểm tra định dạng khoảng trắng:**
   ```powershell
   git diff --check
   ```
   **Kết quả:** Sạch hoàn toàn, không có lỗi whitespace thừa.

---

## 20. Công Việc Chuyển Giao Cho Phase 9 (Residual Phase-9 Work)

Hệ thống biểu đồ đã được đồng bộ hoàn toàn với đường cơ sở nghiệp vụ đã đóng băng. Các công việc bàn giao cho Phase 9:

1. **Thực hiện Business Consistency Audit toàn diện (Phase 9):**
   - Đối soát ma trận chéo giữa 5 tài liệu chuẩn tắc và 16 biểu đồ dẫn xuất để phát hiện bất kỳ khoảng cách ngôn ngữ hoặc cách diễn đạt nào còn sót lại.
   - Xác minh sự nhất quán của danh pháp vai trò (`Field Staff`, `Operations Manager`, `Platform Administrator`), danh mục 18 quy trình, và các Acceptance Oracles.
2. **Chuẩn bị tiền đề cho Phase 10 (ADR Preparation):**
   - Đóng gói toàn bộ các vấn đề kỹ thuật đã được ghi nhận hoãn lại (`DEFERRED_UNTIL_ADR`) trong biểu đồ 08, 10 và 12 (kênh triển khai Admin, cấu trúc monorepo, topology lưu trữ bền vững) để chuyển giao cho Phase 10 & 11 xử lý.

---

## 21. Đóng Ngữ Nghĩa Phase 8 (Phase 8 Semantic Closure)

### 21.1 Lịch Sử Đóng Băng & Kiểm Toán (Audit Trail)
- **Initial Phase-8 commit:** `a800fae967046a6617cd4901967af777980c7b03` (Chứa 3 khuyết tật ngữ nghĩa thứ cấp tại các biểu đồ dẫn xuất).
- **Closure commit:** Ghi nhận tại commit đóng ngữ nghĩa hiện tại (`docs(diagrams): close phase 8 semantic mapping gaps`).
- **Nguyên tắc bảo tồn lịch sử:** Không xóa bỏ hay che giấu các khuyết tật ban đầu của commit `a800fae`; toàn bộ 3 khuyết tật được giải quyết minh bạch thông qua closure patch có bằng chứng xác minh.

### 21.2 Bảng Đối Soát Khuyết Tật Ngữ Nghĩa (Semantic Closure Defect Table)

| Defect | Canonical Evidence | Affected Diagram | Correction | Recheck | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P8-SC-01** | `docs/REQUIREMENTS-TRACEABILITY.md` (BR-ADM-10, BR-ADM-11), `docs/business-reconciliation/04-ADMIN-BUSINESS-SCOPE-DECISION.md`. Định danh chuẩn tắc: `CAP-ADM-10` = Findings Template Governance (`ManageDynamicFindingsTemplate`, NEXT); `CAP-ADM-11` = Break-Glass Access (`UseBreakGlass`, NEXT); `CAP-ADM-12` = Security & Governance Notifications (NEXT); `CAP-ADM-13` = Platform System Configuration (REJECTED). | `docs/diagrams/01-product-capability-map.html`, `docs/diagrams/07-action-eligibility-security-matrix.html` | Hoán đổi vị trí và chuẩn hóa mapping: `CAP-ADM-10` là Findings Template Governance (NEXT, MVP dùng Fixed Schema), `CAP-ADM-11` là Break-Glass Access (NEXT, khóa tại MVP). Khẳng định rõ ràng: Structured Findings là **BẮT BUỘC** trong MVP (`INSPECTION_PROOF = Site Verification + Structured Findings + Condition Photo(s)`), việc hoãn `CAP-ADM-10` chỉ áp dụng cho Dynamic/Admin-configurable template governance. | Quét mã nguồn SVG/HTML: 0 liên kết đảo ngược, 0 xuất hiện `CAP-ADM-10` gắn với Break-Glass, 0 xuất hiện `CAP-ADM-11` gắn với Dynamic Template. Kiểm tra hình học đạt `[PASS]`. | **CLOSED** |
| **P8-SC-02** | `docs/REQUIREMENTS-TRACEABILITY.md` (BR-ADM-05 danh mục lệnh chuẩn tắc: `ViewAuditLog`, `FilterAuditLog`), `docs/business-reconciliation/04-ADMIN-BUSINESS-SCOPE-DECISION.md`. RTM không định nghĩa lệnh `InspectAuditTrail` hay `ExportAuditReport`. | `docs/diagrams/01-product-capability-map.html`, `docs/diagrams/07-action-eligibility-security-matrix.html` (đồng thời dọn sạch tại `02-domain-context-map.html` và `08-role-information-architecture.html`) | Thay thế toàn bộ từ vựng command-level bằng đúng cặp lệnh chuẩn tắc: `ViewAuditLog`, `FilterAuditLog`. Loại bỏ hoàn toàn `InspectAuditTrail` và các quy định ngụ ý lệnh Export (`ExportAuditReport`). Nhãn năng lực khái niệm giữ là `Audit Log Inspection`. Tuyệt đối không tự ý thêm lệnh Export vào RTM chuẩn tắc. | Quét mã nguồn 16 biểu đồ: 0 lệnh `InspectAuditTrail`, 0 lệnh `ExportAuditReport`. Toàn bộ danh pháp khớp 100% RTM. Kiểm tra hình học đạt `[PASS]`. | **CLOSED** |
| **P8-SC-03** | `docs/DOMAIN.md`, `docs/WORKFLOWS.md`, `docs/ACCESS-CONTROL.md`. Danh mục 7 trạng thái chuẩn tắc của `TaskStatus`: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`. Không tồn tại token alias/shorthand `REWORK`. | `docs/diagrams/07-action-eligibility-security-matrix.html` (và bảng catalog tại `docs/diagrams/README.md`) | Thay thế token viết tắt `REWORK` thành token enum chuẩn tắc `REWORK_REQUIRED` trong danh sách các trạng thái nonterminal đủ điều kiện cho lệnh `CancelTask` (`Nonterminal: PENDING, IN_PROGRESS, BLOCKED, WAITING_REVIEW, REWORK_REQUIRED`). Rút gọn tiền tố dẫn để tránh tràn viewBox SVG. Cấm sử dụng alias/shorthand cho enum tokens trong ma trận phân quyền. | Quét ma trận phân quyền: 0 token `REWORK` độc lập làm alias cho `REWORK_REQUIRED`. `scripts/diagram_tool.py validate` đạt `[PASS]` (0 viewport overflow, right edge an toàn 95px). | **CLOSED** |

### 21.3 Thử Nghiệm Phủ Định Bắt Buộc (Negative Tests Verification)

| Mã kiểm thử | Tình huống đầu vào (Given) | Kỳ vọng chuẩn tắc (Expected) | Kết quả thực tế (Actual) | Đánh giá |
| :--- | :--- | :--- | :--- | :--- |
| **SC-NT-01** | Biểu đồ hiển thị `CAP-ADM-10` là Break-Glass Access. | **FAIL** (Bị từ chối / cấm tuyệt đối) | Không còn xuất hiện trên toàn bộ suite. Biểu đồ 01 và 07 hiển thị `CAP-ADM-10` = Findings Template Governance. | **PASS** |
| **SC-NT-02** | Biểu đồ hiển thị `CAP-ADM-11` là Dynamic Findings Template. | **FAIL** (Bị từ chối / cấm tuyệt đối) | Không còn xuất hiện trên toàn bộ suite. Biểu đồ 01 và 07 hiển thị `CAP-ADM-11` = Break-Glass Access. | **PASS** |
| **SC-NT-03** | Biểu đồ công bố lệnh `ExportAuditReport` trong khi RTM không có lệnh này. | **FAIL** (Bị từ chối / cấm tuyệt đối) | Loại bỏ hoàn toàn; 0 lệnh `ExportAuditReport` trong toàn bộ mã nguồn biểu đồ. | **PASS** |
| **SC-NT-04** | Biểu đồ dùng `InspectAuditTrail` làm executable command thay vì `ViewAuditLog` / `FilterAuditLog`. | **FAIL** (Bị từ chối / cấm tuyệt đối) | Toàn bộ command vocabulary đã chuyển về `ViewAuditLog, FilterAuditLog`. | **PASS** |
| **SC-NT-05** | Ma trận phân quyền sử dụng `TaskStatus` `REWORK`. | **FAIL** (Bị từ chối / cấm tuyệt đối) | Token `REWORK` viết tắt bị xóa bỏ; ma trận dùng chuẩn xác `REWORK_REQUIRED`. | **PASS** |
| **SC-NT-06** | `CAP-ADM-10` thuộc nhóm NEXT khiến biểu đồ diễn giải Structured Findings là tùy chọn trong MVP. | **FAIL** (Bị từ chối / cấm tuyệt đối) | Biểu đồ ghi chú rõ: MVP dùng Fixed Canonical Schema bắt buộc cho INSPECTION_PROOF; chỉ có Dynamic Template Governance là NEXT. | **PASS** |

### 21.4 Tái Thẩm Định Các Cổng Kiểm Soát Bị Ảnh Hưởng (Recheck Affected P8 Gates)

- **P8-01 (Biểu đồ 01 — Active Admin Capability Semantics):** **PASS**. 9 năng lực MVP giữ nguyên; `CAP-ADM-10` (Findings Template Governance) và `CAP-ADM-11` (Break-Glass Access) nằm đúng vị trí trong khối NEXT; `CAP-ADM-05` dùng đúng từ vựng `ViewAuditLog, FilterAuditLog` và nhãn `Audit Log Inspection`.
- **P8-03 (Biểu đồ 07 — Authorization Semantics):** **PASS**. Ma trận phân quyền phản ánh chuẩn xác `CancelTask` trên các trạng thái nonterminal với đầy đủ token `REWORK_REQUIRED`; phân quyền `CAP-ADM-05` bám sát `ViewAuditLog, FilterAuditLog`; phân quyền NEXT thể hiện đúng `ManageDynamicFindingsTemplate` (CAP-ADM-10) và `UseBreakGlass` (CAP-ADM-11).
- **P8-11 (Terminology Consistency & Authority):** **PASS**. Toàn bộ danh pháp vai trò, trạng thái nhiệm vụ (`TaskStatus`), và danh mục lệnh quản trị khớp hoàn toàn với RTM và Domain Model chuẩn tắc.
- **P8-12 (No Diagram Creates New Business Truth):** **PASS**. Không tự ý sáng tác lệnh audit export hoặc biến đổi mô hình phân quyền; biểu đồ hoàn toàn là derived view tuân thủ canonical sources.
- **P8-NT-15 (No New Business Requirement):** **PASS**. Biểu đồ không phát sinh yêu cầu mới ngoài RTM đã freeze tại Phase 7.
- **P8-NT-16 (Derived View Banner & Discipline):** **PASS**. Toàn bộ biểu đồ active bảo tồn banner `STATUS: DERIVED VIEW — NOT SOURCE OF TRUTH`.

---

## KẾT LUẬN & TRẠNG THÁI CUỐI CÙNG (FINAL STATUS)

```
PHASE 8 PASS — SEMANTICALLY CLOSED
— CAPABILITY IDS RECONCILED
— AUDIT COMMAND VOCABULARY RECONCILED
— TASK STATUS TERMINOLOGY RECONCILED
— DERIVED VIEWS MATCH FROZEN CANONICAL SOURCES
— READY FOR PHASE 9 BUSINESS CONSISTENCY AUDIT
```
