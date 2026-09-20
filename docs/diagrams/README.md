# NOVYX GreenOps — Diagram Suite Inventory & Visual Index

Tài liệu này quản lý toàn bộ hệ thống sơ đồ kiến trúc, quy trình vận hành, phân quyền và máy trạng thái của **NOVYX GreenOps**.

Toàn bộ biểu đồ được thiết kế và lưu trữ dưới dạng **Standalone HTML (Inline SVG & CSS)** tuân thủ quy chuẩn thiết kế [`diagram-design`](../../.agents/skills/diagram-design/SKILL.md) và bảng mã màu Seed/Linear tại [`DESIGN.md`](../../DESIGN.md). Các file này có thể mở trực tiếp trên mọi trình duyệt web hiện đại độc lập, không phụ thuộc vào công cụ vẽ bên thứ ba hay máy chủ render.

---

## 0. Nguyên tắc Thẩm quyền Nguồn & Quy tắc Ranh giới (Source of Truth & Governance Rules)

> ### ⚠️ NGUYÊN TẮC THẨM QUYỀN NGUỒN (SOURCE OF TRUTH PRINCIPLE)
>
> **TẤT CẢ BIỂU ĐỒ ĐỀU LÀ GÓC NHÌN DẪN XUẤT (`DERIVED VIEW`). BIỂU ĐỒ TUYỆT ĐỐI KHÔNG PHẢI NGUỒN TẠO THẨM QUYỀN HAY RA QUYẾT ĐỊNH MỚI.**
>
> Hệ thống thẩm quyền nguồn được phân định rõ theo hai miền độc lập:
>
> 1. **MIỀN NGHIỆP VỤ SẢN PHẨM (`Authoritative Canonical Business Baseline`):**
>    Bắt nguồn từ 5 tài liệu nghiệp vụ đã đóng băng:
>    - [`PRODUCT.md`](../PRODUCT.md) — Tầm nhìn sản phẩm, mô hình 3 tác nhân con người (`Field Staff`, `Operations Manager`, `Platform Administrator`) và danh mục năng lực nghiệp vụ.
>    - [`DOMAIN.md`](../DOMAIN.md) — 5 Bounded Contexts chuẩn tắc, ranh giới sở hữu tài nguyên và các Invariants.
>    - [`ACCESS-CONTROL.md`](../ACCESS-CONTROL.md) — Ma trận phân quyền 4 chiều (`Role ∧ Scope ∧ State ∧ Preconditions`) tách biệt 2 mặt phẳng Vận hành và Quản trị Nền tảng.
>    - [`WORKFLOWS.md`](../WORKFLOWS.md) — Vòng đời 7 trạng thái tất định của Task, 3 Hồ sơ Bằng chứng ngữ nghĩa và 18 quy trình chuẩn.
>    - [`REQUIREMENTS-TRACEABILITY.md`](../REQUIREMENTS-TRACEABILITY.md) — Ma trận truy vết yêu cầu và các Acceptance Oracles nhị phân.
>
> 2. **MIỀN KIẾN TRÚC KỸ THUẬT (`Authoritative Technical Architecture Baseline`):**
>    Bắt nguồn từ văn bản kiến trúc chuẩn tắc và tập hợp quyết định kiến trúc đã được phê duyệt:
>    - [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) — Tài liệu kiến trúc kỹ thuật hợp nhất chuẩn tắc.
>    - [`docs/adr/0001-monorepo-foundation.md`](../adr/0001-monorepo-foundation.md) đến [`docs/adr/0013-backend-runtime-persistence-topology.md`](../adr/0013-backend-runtime-persistence-topology.md) — Biên bản quyết định kiến trúc bất biến (`ACCEPTED ADRs`).
>
> **QUY TẮC BẮT BUỘC:**
> - **Nếu một biểu đồ xung đột với văn bản chuẩn tắc (Business doc hoặc accepted ADR / ARCHITECTURE.md), văn bản chuẩn tắc luôn luôn chiến thắng (`canonical text wins`).**
> - **Nếu hai văn bản chuẩn tắc mâu thuẫn: DỪNG LẠI và ghi nhận blocker.**
> - **TUYỆT ĐỐI KHÔNG sửa văn bản chuẩn tắc chỉ để làm cho biểu đồ dễ vẽ hơn.**
> - **Không một biểu đồ nào được tự tạo ra: vai trò (`role`), lệnh (`command`), trạng thái (`state`), năng lực (`capability`), sở hữu tài nguyên (`resource ownership`), chuyển dịch quy trình (`workflow transition`), hoặc quyết định kiến trúc kỹ thuật (`technical architecture decision`) khi chưa được phê duyệt.**

Mọi biểu đồ trong hệ thống bắt buộc phải thuộc chính xác **1 trong 6 nhóm phân loại chuẩn tắc**:

1. **`CURRENT_DERIVED_VIEW` (Góc nhìn dẫn xuất chuẩn tắc đang hoạt động):**
   - Biểu đồ phản ánh chính xác các quy tắc nghiệp vụ, phân quyền, cấu trúc ngữ cảnh và vòng đời đã được đóng băng từ Phase 1–7, HOẶC phản ánh kiến trúc kỹ thuật mục tiêu đã được chấp thuận chính thức qua ADR 0001..0013 và `docs/ARCHITECTURE.md`.
   - Huy hiệu hiển thị: `CANONICAL CURRENT-STATE — DERIVED VIEW` hoặc `STATUS: ACCEPTED TARGET ARCHITECTURE — DERIVED VIEW` kèm trích dẫn `SOURCE: ... | STATUS: DERIVED VIEW — NOT SOURCE OF TRUTH`.
2. **`HISTORICAL_SUPERSEDED` (Biểu đồ lịch sử đã bị thay thế — Chỉ dùng tham chiếu):**
   - Lưu trữ phục vụ kiểm toán lịch sử và đối chiếu phân tích khoảng cách. Giữ nguyên nội dung lịch sử ban đầu để bảo toàn bằng chứng tiến hóa.
   - Bắt buộc mang banner: `STATUS: HISTORICAL / SUPERSEDED — REFERENCE ONLY` và chỉ rõ biểu đồ thay thế.
3. **`AS_IS_IMPLEMENTATION_VIEW` (Góc nhìn hiện trạng mã nguồn thực tế):**
   - Phản ánh trung thực mã nguồn hiện hữu tại commit baseline `2f9a26b` (bao gồm cả các khuyết tật mã nguồn như ép role admin về manager). Tuyệt đối không xóa bỏ khuyết tật để làm đẹp hiện trạng.
   - Bắt buộc mang banner: `STATUS: CURRENT IMPLEMENTATION / AS-IS — NOT TARGET BUSINESS MODEL` và gán nhãn khuyết tật rõ ràng `[AS-IS DEFECT]`.
4. **`TARGET_DIRECTION_NOT_ARCHITECTURE` (Định hướng mục tiêu sơ khởi — Chưa chốt kiến trúc kỹ thuật):**
   - Dùng cho các bản thảo định hướng trước khi có ADR chấp thuận. (Sau Phase 11C, các sơ đồ mục tiêu đã có ADR phê duyệt được nâng cấp lên `CURRENT_DERIVED_VIEW`).
5. **`DEFERRED_UNTIL_ADR` (Góc nhìn phụ thuộc kiến trúc — Hoãn lại chờ ADR):**
   - Dùng cho các sơ đồ có quyết định bị hoãn lại chờ phê duyệt ADR. (Sau Phase 11C, đã được giải quyết qua bộ ADR 0005..0013).
6. **`REFERENCE_COMPARISON` (Biểu đồ đối chiếu tham chiếu):**
   - Dùng để so sánh đối chiếu giữa mô hình tuần tự cũ và mô hình chuẩn hóa linh hoạt mới. Không trình bày phía "cũ" như là đích đến.
   - Bắt buộc mang banner: `STATUS: REFERENCE COMPARISON — DERIVED VIEW`.

---

## 1. Danh mục Toàn bộ Biểu đồ Hệ thống (Master Diagram Suite Catalog)

| Mã số / Tên tệp | Tên biểu đồ | Phân loại chuẩn tắc (`Classification`) | Nguồn chuẩn tắc (`Primary Source`) | Trạng thái thẩm quyền (`Status`) | Lần đối soát gần nhất | Ghi chú & Nội dung chuẩn tắc |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| [`01-product-capability-map.html`](01-product-capability-map.html) | Bản đồ Năng lực Nghiệp vụ | `CURRENT_DERIVED_VIEW` | [`docs/PRODUCT.md`](../PRODUCT.md), [`docs/ACCESS-CONTROL.md`](../ACCESS-CONTROL.md) | `DERIVED VIEW — NOT SOURCE OF TRUTH` | Phase 8 Reconciled | 3 vai trò con người + System; 2 mặt phẳng (Vận hành & Quản trị MVP 9 năng lực CAP-ADM-01..09); Tách biệt NEXT (CAP-ADM-10..12) & REJECTED (CAP-ADM-13); Admin cấm tác vụ Task. |
| [`02-domain-context-map.html`](02-domain-context-map.html) | Bản đồ Ngữ cảnh Nghiệp vụ (Context Map) | `CURRENT_DERIVED_VIEW` | [`docs/DOMAIN.md`](../DOMAIN.md), [`docs/business-reconciliation/06-BOUNDED-CONTEXT-DECISIONS.md`](../business-reconciliation/06-BOUNDED-CONTEXT-DECISIONS.md) | `DERIVED VIEW — NOT SOURCE OF TRUTH` | Phase 8 Reconciled | Đúng 5 Bounded Contexts (Core: Work Management gộp Verification & Review; Supporting: Tree Asset Registry, Policy & Template, Audit; Generic: IAM); Notifications là Projection; Offline/Sync là technical concern; Không trực tiếp đột biến chéo ngữ cảnh. |
| [`03-mvp-operational-swimlane.html`](03-mvp-operational-swimlane.html) | Quy trình Vận hành 5 Chốt Cũ | `HISTORICAL_SUPERSEDED` | [`docs/WORKFLOWS.md`](../WORKFLOWS.md) (Historical Baseline) | `HISTORICAL / SUPERSEDED — REFERENCE ONLY` | Phase 8 Reconciled | Mô hình 5 chốt tuần tự cũ; Đã được thay thế chính thức bởi `proposed-02-mvp-operational-swimlane.html`. Giữ nguyên tính lịch sử. |
| [`04-task-lifecycle.html`](04-task-lifecycle.html) | Vòng đời Nhiệm vụ 4 Trạng thái Cũ | `HISTORICAL_SUPERSEDED` | [`docs/WORKFLOWS.md`](../WORKFLOWS.md) (Historical Baseline) | `HISTORICAL / SUPERSEDED — REFERENCE ONLY` | Phase 8 Reconciled | Vòng đời 4 trạng thái cũ thiếu `BLOCKED` và `CANCELLED`; Đã được thay thế bởi `proposed-03-minimal-task-lifecycle.html`. Giữ nguyên tính lịch sử. |
| [`05-proof-workflow.html`](05-proof-workflow.html) | Quy trình Lấy Bằng chứng Cố định Cũ | `HISTORICAL_SUPERSEDED` | [`docs/WORKFLOWS.md`](../WORKFLOWS.md) (Historical Baseline) | `HISTORICAL / SUPERSEDED — REFERENCE ONLY` | Phase 8 Reconciled | Chuỗi 5 bước tuần tự cứng nhắc; Đã được thay thế bởi `proposed-04-proof-policy-and-rework.html` (3 hồ sơ ngữ nghĩa). Giữ nguyên tính lịch sử. |
| [`06-review-rework-lifecycle.html`](06-review-rework-lifecycle.html) | Quy trình Thẩm định Nhị phân Cũ | `HISTORICAL_SUPERSEDED` | [`docs/WORKFLOWS.md`](../WORKFLOWS.md) (Historical Baseline) | `HISTORICAL / SUPERSEDED — REFERENCE ONLY` | Phase 8 Reconciled | Cổng duyệt nhị phân cũ; Đã được thay thế bởi mô hình 4 kết luận duyệt và làm lại có mục tiêu trong `proposed-02` & `proposed-04`. Giữ nguyên tính lịch sử. |
| [`07-action-eligibility-security-matrix.html`](07-action-eligibility-security-matrix.html) | Ma trận Phân quyền & Kích hoạt Hành động | `CURRENT_DERIVED_VIEW` | [`docs/ACCESS-CONTROL.md`](../ACCESS-CONTROL.md), [`docs/REQUIREMENTS-TRACEABILITY.md`](../REQUIREMENTS-TRACEABILITY.md) | `DERIVED VIEW — NOT SOURCE OF TRUTH` | Phase 8 Reconciled | Tách biệt 2 mặt phẳng: (A) Phân quyền Vận hành (Staff assignedId, Manager authorized scope; StartTask PENDING only, ReportFieldIssue IN_PROGRESS only, Reassign PENDING/BLOCKED only, cấm REWORK_REQUIRED->BLOCKED, cấm IN_PROGRESS direct reassign; Admin DENY), (B) Phân quyền Quản trị Nền tảng (Admin MVP 9 năng lực; Staff/Manager DENY; NEXT & REJECTED tách biệt), và (C) Tự động hóa Hệ thống (System deterministic). |
| [`08-role-information-architecture.html`](08-role-information-architecture.html) | Kiến trúc Thông tin theo Vai trò | `CURRENT_DERIVED_VIEW` | [`docs/PRODUCT.md`](../PRODUCT.md), [`docs/ACCESS-CONTROL.md`](../ACCESS-CONTROL.md), [`docs/WORKFLOWS.md`](../WORKFLOWS.md), ADR 0005 | `DERIVED VIEW — NOT SOURCE OF TRUTH` | Phase 11C Reconciled | 3 không gian chức năng: Field Staff Mobile App, Operations Manager Workspace, và Platform Admin Governance Workspace (kênh phân phối đã được phê duyệt tại ADR 0005 là Dedicated Admin Web `apps/admin-web`, cập nhật tại Phase 11C); Cấm đưa tác vụ hiện trường vào điều hướng Admin. |
| [`09-system-current-state.html`](09-system-current-state.html) | Hiện trạng Kiến trúc Hệ thống (As-Is) | `AS_IS_IMPLEMENTATION_VIEW` | Mã nguồn baseline `2f9a26b` | `CURRENT IMPLEMENTATION / AS-IS — NOT TARGET BUSINESS MODEL` | Phase 8 Reconciled | Bảo toàn nguyên vẹn hiện trạng mã nguồn baseline: Monolithic MobileApp, RAM Cache, ép admin về Manager [AS-IS DEFECT]. Tuyệt đối không ngụy tạo mã nguồn để làm đẹp hiện trạng. |
| [`10-system-target-architecture.html`](10-system-target-architecture.html) | Kiến trúc Kỹ thuật Mục tiêu (System Target Architecture) | `CURRENT_DERIVED_VIEW` | [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md), ADR 0005..0013 | `ACCEPTED TARGET ARCHITECTURE — DERIVED VIEW` | Phase 11C Reconciled | Cấu trúc hệ thống mục tiêu đã được phê duyệt: Phân định ranh giới Client Advisory (apps/mobile, apps/admin-web) vs Server Authoritative (apps/api Modular Monolith với 5 logical Bounded Contexts); Hợp đồng REST v1 (@novyx/contracts); Hạ tầng Relational DB Family (vendor-neutral) và phân tách đặc quyền nhật ký kiểm toán. Lưu ý apps/api và apps/admin-web là thành phần mục tiêu CHƯA TRIỂN KHAI MÃ NGUỒN. |
| [`11-evidence-submission-sequence.html`](11-evidence-submission-sequence.html) | Chuỗi Nộp Bằng chứng 5 Chốt Cũ | `HISTORICAL_SUPERSEDED` | [`docs/WORKFLOWS.md`](../WORKFLOWS.md) (Historical Baseline) | `HISTORICAL / SUPERSEDED — REFERENCE ONLY` | Phase 8 Reconciled | Chuỗi nộp 5 chốt cũ; Đã được thay thế bởi luồng nộp theo hồ sơ ngữ nghĩa và lưu vết phiên bản trong `proposed-04`. Giữ nguyên tính lịch sử. |
| [`12-architecture-dependency-map.html`](12-architecture-dependency-map.html) | Bản đồ Phụ thuộc Gói & Ranh giới Monorepo | `CURRENT_DERIVED_VIEW` | [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md), [`AGENTS.md`](../../AGENTS.md), ADR 0001..0013 | `ACCEPTED ARCHITECTURE DEPENDENCY MAP — DERIVED VIEW` | Phase 11C Reconciled | Bản đồ phụ thuộc monorepo đã được phê duyệt: apps/mobile, apps/admin-web, apps/api phụ thuộc vào packages/contracts, config, ui (theo thẩm quyền); apps/api CẤM import ui; packages tuyệt đối CẤM import apps; 5 Bounded Contexts là module logic nội bộ của apps/api, không phải npm packages hay microservices riêng lẻ; apps/admin-web và apps/api là mục tiêu CHƯA TRIỂN KHAI MÃ NGUỒN. |
| [`proposed-01-current-vs-recommended-workflow.html`](proposed-01-current-vs-recommended-workflow.html) | So sánh Quy trình Hiện tại vs Chuẩn hóa Khuyến nghị | `REFERENCE_COMPARISON` | [`docs/WORKFLOWS.md`](../WORKFLOWS.md), [`docs/PRODUCT.md`](../PRODUCT.md) | `REFERENCE COMPARISON — DERIVED VIEW` | Phase 8 Reconciled | Đối chiếu mô hình ép buộc tuần tự cũ và mô hình Xác thực hiện trường linh hoạt kết hợp 3 Hồ sơ Bằng chứng ngữ nghĩa mới; Không trình bày luồng cũ như mục tiêu. |
| [`proposed-02-mvp-operational-swimlane.html`](proposed-02-mvp-operational-swimlane.html) | Quy trình Vận hành Liên vai trò MVP | `CURRENT_DERIVED_VIEW` | [`docs/WORKFLOWS.md`](../WORKFLOWS.md), [`docs/ACCESS-CONTROL.md`](../ACCESS-CONTROL.md) | `DERIVED VIEW — NOT SOURCE OF TRUTH` | Phase 8 Reconciled | 3 làn bơi tác nghiệp chuẩn tắc: Operations Manager, Field Staff, và System (deterministic); Tuyệt đối không có làn bơi Admin trong quy trình hiện trường thông thường; Đầy đủ 4 kết luận duyệt và 3 lối thoát BLOCKED. |
| [`proposed-03-minimal-task-lifecycle.html`](proposed-03-minimal-task-lifecycle.html) | Vòng đời Nhiệm vụ 7 Trạng thái Tất định | `CURRENT_DERIVED_VIEW` | [`docs/WORKFLOWS.md`](../WORKFLOWS.md), [`docs/DOMAIN.md`](../DOMAIN.md) | `DERIVED VIEW — NOT SOURCE OF TRUTH` | Phase 8 Reconciled | Đúng 7 trạng thái chuẩn tắc: PENDING, IN_PROGRESS, BLOCKED, WAITING_REVIEW, REWORK_REQUIRED, COMPLETED, CANCELLED; Không có trạng thái lạ; Không có bước chuyển của Admin. |
| [`proposed-04-proof-policy-and-rework.html`](proposed-04-proof-policy-and-rework.html) | 3 Hồ sơ Bằng chứng Ngữ nghĩa & Rework Trọng tâm | `CURRENT_DERIVED_VIEW` | [`docs/WORKFLOWS.md`](../WORKFLOWS.md), [`docs/DOMAIN.md`](../DOMAIN.md) | `DERIVED VIEW — NOT SOURCE OF TRUTH` | Phase 8 Reconciled | Chuẩn 3 Profiles: CHANGE_PROOF (site verification + trước + checklist + sau), SERVICE_PROOF (site verification + checklist + hoàn tất), INSPECTION_PROOF (site verification + structured findings + ảnh hiện trạng); Rework bảo toàn lịch sử bằng chứng hợp lệ. |

---

## 2. Quy chuẩn Hình học & Kiểu chữ Tiếng Việt (Visual, Geometry & Typography Rules)

Toàn bộ các biểu đồ active/derived/target đã được cấu hình và xác minh tuân thủ các chỉ tiêu nghiêm ngặt:

- **Bảng màu Semantic Seed/Linear:** Tuân thủ 100% token của [`DESIGN.md`](../../DESIGN.md):
  - Paper canvas: `#FCFCF7` (`snowWhite`) / fill phụ: `#EEEEE9` (`warmStone`) hoặc `#FFFFFF`
  - Stroke & Ink chính: `#112116` (`forestDepths`) — độ tương phản WCAG AA $> 16:1 \ge 4.5:1$
  - Muted text & Connectors: `#68756B` (`pewter`)
  - Đường viền tế vi: `#E2E0D8` hoặc `rgba(17, 33, 22, 0.08)`
  - Accent / Trọng tâm: `#166534` (Forest dark green) & `#84CC16` (`limePulse`)
  - Cảnh báo / Đề xuất: `#D97706` (Amber - Rework / Waiting / Proposed badge / Target Component Not Yet Implemented)
  - Nguy hiểm / Cấm đoán: `#DC2626` (Red - Forbidden / Dead code / Gaps)
- **Hỗ trợ Tiếng Việt & Kiểu chữ:**
  - Font chữ: Noto Sans / Noto Serif nhúng qua Google Fonts với XML-safe URL (`&amp;`).
  - Sàn cỡ chữ: Font Floor $\ge 11\text{px}$ trên toàn bộ văn bản đọc được (loại bỏ hoàn toàn chữ quá nhỏ).
- **Quy chuẩn Hình học Thực tế:**
  - **Zero Visual Collision:** Không có bất kỳ giao cắt chồng lấn văn bản nào ($> 3\text{px} \times 3\text{px}$).
  - **Zero Non-Owner Crossing:** Đầu nhãn và connector không cắt xuyên qua các khối nội dung không liên quan.
  - **Zero Viewport Clipping / Boundary Overflow:** Toàn bộ text nằm trọn vẹn trong thẻ hộp chứa và khung nhìn SVG.
  - **Safe Internal Padding:** Khoảng đệm an toàn tối thiểu từ mép chữ tới viền hộp $x \ge 4\text{px}, y \ge 3\text{px}$ trên 100% các phần tử.
