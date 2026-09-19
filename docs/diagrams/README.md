# NOVYX GreenOps — Diagram Inventory & Visual Index

Thư mục này chứa toàn bộ các sơ đồ kiến trúc, quy trình nghiệp vụ và máy trạng thái chuẩn tắc của **NOVYX GreenOps**.

Toàn bộ biểu đồ được tạo dưới dạng **Standalone HTML (Inline SVG & CSS)** tuân thủ tiêu chuẩn [`diagram-design`](../../.agents/skills/diagram-design/SKILL.md) và bảng màu chuẩn tắc của NOVYX tại [`DESIGN.md`](../../DESIGN.md). Các file này có thể mở trực tiếp trên mọi trình duyệt mà không cần cài đặt thêm bất kỳ công cụ hoặc server nào.

---

## 1. Danh mục biểu đồ chuẩn tắc (Canonical Diagram Set)

| File                                                                                       | Tên biểu đồ                           | Loại trực quan (Visual Type) | Phân loại trạng thái   | Mục đích & Mô hình thể hiện                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ------------------------------------- | ---------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`01-product-capability-map.html`](01-product-capability-map.html)                         | Bản đồ Năng lực Nghiệp vụ             | Architecture / Nested        | **TARGET BASELINE**    | Phân tách Core Domain (Field Work Verification) với Supporting Subdomains và Generic Platform Capabilities.                                             |
| [`02-domain-context-map.html`](02-domain-context-map.html)                                 | Bản đồ Ngữ cảnh Bounded Contexts      | Architecture / Context Map   | **TARGET BASELINE**    | Thể hiện mối quan hệ Upstream/Downstream giữa Verification Context và các Subdomain vệ tinh.                                                            |
| [`03-mvp-operational-swimlane.html`](03-mvp-operational-swimlane.html)                     | Quy trình Vận hành Liên vai trò       | Swimlane                     | **MVP WORKFLOW**       | Chu trình Walking Skeleton đầu-cuối: Quản lý tạo việc $\to$ Nhân viên thu thập 5 chốt $\to$ Nộp $\to$ Quản lý thẩm định $\to$ Duyệt/Làm lại.            |
| [`04-task-lifecycle.html`](04-task-lifecycle.html)                                         | Vòng đời Nhiệm vụ (Task Lifecycle)    | State Machine                | **CANONICAL CONTRACT** | Workflow A: Chuyển dịch trạng thái Task (`Pending` $\to$ `In_Progress` $\to$ `Waiting_Review` $\to$ `Completed`), vòng lặp `Rework_Required`.           |
| [`05-proof-workflow.html`](05-proof-workflow.html)                                         | Quy trình Thu thập Bằng chứng         | State Machine                | **CANONICAL CONTRACT** | Workflow B: 5 bước thu thập bằng chứng hiện trường (GPS $\to$ QR $\to$ Before $\to$ Checklist $\to$ After $\to$ Submit) và các nhánh phục hồi ngoại lệ. |
| [`06-review-rework-lifecycle.html`](06-review-rework-lifecycle.html)                       | Quy trình Thẩm định của Quản lý       | State Machine                | **CANONICAL CONTRACT** | Workflow C: Cổng kiểm duyệt 5 chốt, nhánh Phê duyệt đóng việc và nhánh Yêu cầu làm lại kèm lý do bắt buộc.                                              |
| [`07-action-eligibility-security-matrix.html`](07-action-eligibility-security-matrix.html) | Ma trận Phân quyền & Kích hoạt        | Security Matrix              | **AUTHORIZATION**      | Quyền hành động dựa trên 4 yếu tố: Role $\land$ Scope $\land$ State $\land$ Preconditions.                                                              |
| [`08-role-information-architecture.html`](08-role-information-architecture.html)           | Kiến trúc Thông tin & Điều hướng      | Tree                         | **MOBILE IA**          | Cấu trúc thanh điều hướng Notched Bottom Nav 5 chốt và cây màn hình chi tiết cho Staff và Manager.                                                      |
| [`09-system-current-state.html`](09-system-current-state.html)                             | Hiện trạng Kiến trúc Hệ thống         | IT Current-State             | **AS-IS (2f9a26b)**    | Phản ánh trung thực mã nguồn hiện tại: Khối MobileApp 2.054 dòng, service quá tải và bộ đệm RAM dễ mất dữ liệu.                                         |
| [`10-system-target-architecture.html`](10-system-target-architecture.html)                 | Kiến trúc Mục tiêu Clean Architecture | Architecture / Layers        | **TO-BE (TARGET)**     | Cấu trúc 5 tầng chuẩn Clean / Ports & Adapters: Presentation $\to$ Application $\to$ Domain $\leftarrow$ Ports $\leftarrow$ Adapters.                   |
| [`11-evidence-submission-sequence.html`](11-evidence-submission-sequence.html)             | Chuỗi Tương tác Nộp Bằng chứng        | Sequence                     | **DYNAMIC BEHAVIOR**   | Thứ tự thông điệp từ nút bấm trên UI qua Domain Invariants, lưu trữ bền vững đến khi hiển thị tại hàng đợi Quản lý.                                     |
| [`12-architecture-dependency-map.html`](12-architecture-dependency-map.html)               | Bản đồ Phụ thuộc Gói & Ranh giới      | Dependency Graph             | **GOVERNANCE**         | Chiều phụ thuộc cho phép giữa `apps/mobile` và các `packages/`, cùng các ranh giới bị nghiêm cấm trong monorepo.                                        |

---

## 2. Danh mục biểu đồ chuẩn hóa quy trình nghiệp vụ (Derived Views — Canonical Baseline)

Các sơ đồ dưới đây phản ánh trực quan mô hình vận hành chuẩn tắc đã được đồng bộ chính thức vào [`docs/WORKFLOWS.md`](../WORKFLOWS.md), [`docs/PRODUCT.md`](../PRODUCT.md) và [`docs/DOMAIN.md`](../DOMAIN.md):

| File                                                                                                   | Tên biểu đồ                           | Loại trực quan    | Phân loại & Nguồn chuẩn tắc                 | Nội dung mô hình thể hiện                                                                                                                              |
| :----------------------------------------------------------------------------------------------------- | :------------------------------------ | :---------------- | :------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`proposed-01-current-vs-recommended-workflow.html`](proposed-01-current-vs-recommended-workflow.html) | So sánh Hiện trạng vs Chuẩn hóa       | Comparison / Flow | **DERIVED VIEW**<br>_Nguồn: `WORKFLOWS.md`_ | So sánh trực quan mô hình 5 chốt cứng nhắc cũ và mô hình Xác thực hiện trường linh hoạt kết hợp 3 Hồ sơ Bằng chứng Ngữ nghĩa.                          |
| [`proposed-02-mvp-operational-swimlane.html`](proposed-02-mvp-operational-swimlane.html)               | Luồng Vận hành Liên vai trò Tối ưu    | Swimlane          | **DERIVED VIEW**<br>_Nguồn: `WORKFLOWS.md`_ | Chu trình vận hành MVP: Bắt đầu tất định, Xác thực hiện trường, Báo sự cố BLOCKED (3 lối thoát), 4 kết luận duyệt tại WAITING_REVIEW.                  |
| [`proposed-03-minimal-task-lifecycle.html`](proposed-03-minimal-task-lifecycle.html)                   | Vòng đời Nhiệm vụ 7 Trạng thái        | State Machine     | **DERIVED VIEW**<br>_Nguồn: `WORKFLOWS.md`_ | Máy trạng thái 7 trạng thái tất định cho MVP: Khởi đầu với StartTask, các lối thoát của BLOCKED, kết luận duyệt ngoại lệ, và 2 trạng thái đóng.        |
| [`proposed-04-proof-policy-and-rework.html`](proposed-04-proof-policy-and-rework.html)                 | 3 Hồ sơ Ngữ nghĩa & Làm lại Trọng tâm | Matrix / Flow     | **DERIVED VIEW**<br>_Nguồn: `DOMAIN.md`_    | Chi tiết 3 Hồ sơ Bằng chứng (`CHANGE`, `SERVICE`, `INSPECTION`), làm lại có mục tiêu lưu vết đa phiên bản, và xử lý sai sót lịch sử không thể tái tạo. |

---

## 3. Bảng mã màu trực quan (Visual Palette Profile)

Mọi biểu đồ đều tuân thủ bảng màu Seed/Linear được quy định tại [`DESIGN.md`](../../DESIGN.md):

- **Paper / Canvas:** `#FBFBF9` (`snowWhite`)
- **Secondary Paper / Box fill:** `#F0EFEA` (`warmStone`) hoặc `#FFFFFF`
- **Ink / Stroke chính:** `#112116` (`forestDepths`)
- **Muted text & Arrows:** `#68756B` (`pewter`)
- **Hairline Borders:** `#E2E0D8` hoặc `rgba(17, 33, 22, 0.08)`
- **Accent / Focal Node:** `#166534` (Forest dark green) & `#84CC16` (`limePulse` - chỉ dùng cho 1–2 điểm nhấn trọng tâm)
- **Warning / Alert:** `#D97706` (Amber - Rework / Waiting / Proposed badge)
- **Danger / Prohibited:** `#DC2626` (Red - Forbidden / Dead code / Gaps / Flaws)
