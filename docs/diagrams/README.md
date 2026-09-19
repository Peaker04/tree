# NOVYX GreenOps — Diagram Inventory & Visual Index

Thư mục này chứa toàn bộ các sơ đồ kiến trúc, quy trình nghiệp vụ và máy trạng thái chuẩn tắc của **NOVYX GreenOps**.

Toàn bộ biểu đồ được tạo dưới dạng **Standalone HTML (Inline SVG & CSS)** tuân thủ tiêu chuẩn [`diagram-design`](../../.agents/skills/diagram-design/SKILL.md) và bảng màu chuẩn tắc của NOVYX tại [`DESIGN.md`](../../DESIGN.md). Các file này có thể mở trực tiếp trên mọi trình duyệt mà không cần cài đặt thêm bất kỳ công cụ hoặc server nào.

---

## 1. Danh mục biểu đồ dẫn xuất chuẩn tắc đang hoạt động (Active Derived Views)

> **Nguyên tắc thẩm quyền:** Mọi biểu đồ dưới đây là **GÓC NHÌN DẪN XUẤT (`DERIVED VIEW`)** trực quan từ các tài liệu chuẩn tắc Markdown. Biểu đồ KHÔNG BAO GIỜ là chủ sở hữu hợp đồng độc lập.

| File                                                                                                   | Tên biểu đồ                           | Loại trực quan (Visual Type) | Phân loại & Thẩm quyền    | Nguồn chuẩn tắc (`SOURCE`)                       | Nội dung mô hình thể hiện                                                                                                       |
| :----------------------------------------------------------------------------------------------------- | :------------------------------------ | :--------------------------- | :------------------------ | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| [`proposed-01-current-vs-recommended-workflow.html`](proposed-01-current-vs-recommended-workflow.html) | So sánh Hiện trạng vs Chuẩn hóa       | Comparison / Flow            | **DERIVED VIEW**          | [`docs/WORKFLOWS.md`](../WORKFLOWS.md)           | So sánh mô hình 5 chốt cứng nhắc cũ và mô hình Xác thực hiện trường linh hoạt kết hợp 3 Hồ sơ Bằng chứng.                       |
| [`proposed-02-mvp-operational-swimlane.html`](proposed-02-mvp-operational-swimlane.html)               | Luồng Vận hành Liên vai trò MVP       | Swimlane                     | **DERIVED VIEW**          | [`docs/WORKFLOWS.md`](../WORKFLOWS.md)           | Chu trình vận hành MVP: Bắt đầu tất định, Xác thực hiện trường, Báo sự cố BLOCKED (3 lối thoát), 4 kết luận duyệt.              |
| [`proposed-03-minimal-task-lifecycle.html`](proposed-03-minimal-task-lifecycle.html)                   | Vòng đời Nhiệm vụ 7 Trạng thái        | State Machine                | **DERIVED VIEW**          | [`docs/WORKFLOWS.md`](../WORKFLOWS.md)           | Máy trạng thái 7 trạng thái tất định cho MVP: Khởi đầu với StartTask, các lối thoát BLOCKED, duyệt ngoại lệ, 2 trạng thái đóng. |
| [`proposed-04-proof-policy-and-rework.html`](proposed-04-proof-policy-and-rework.html)                 | 3 Hồ sơ Ngữ nghĩa & Làm lại Trọng tâm | Matrix / Flow                | **DERIVED VIEW**          | [`docs/DOMAIN.md`](../DOMAIN.md)                 | Chi tiết 3 Hồ sơ Bằng chứng (`CHANGE`, `SERVICE`, `INSPECTION`), làm lại có mục tiêu lưu vết đa phiên bản, xử lý ngoại lệ.      |
| [`01-product-capability-map.html`](01-product-capability-map.html)                                     | Bản đồ Năng lực Nghiệp vụ             | Architecture / Nested        | **DERIVED VIEW**          | [`docs/PRODUCT.md`](../PRODUCT.md)               | Phân tách Core Domain (Field Work Verification) với Supporting Subdomains và Generic Platform Capabilities.                     |
| [`02-domain-context-map.html`](02-domain-context-map.html)                                             | Bản đồ Ngữ cảnh Bounded Contexts      | Architecture / Context Map   | **DERIVED VIEW**          | [`docs/DOMAIN.md`](../DOMAIN.md)                 | Thể hiện mối quan hệ Upstream/Downstream giữa Verification Context và các Subdomain vệ tinh.                                    |
| [`07-action-eligibility-security-matrix.html`](07-action-eligibility-security-matrix.html)             | Ma trận Phân quyền & Kích hoạt        | Security Matrix              | **DERIVED VIEW**          | [`docs/ACCESS-CONTROL.md`](../ACCESS-CONTROL.md) | Quyền hành động dựa trên 4 yếu tố: Role $\land$ Scope $\land$ State $\land$ Preconditions.                                      |
| [`08-role-information-architecture.html`](08-role-information-architecture.html)                       | Kiến trúc Thông tin & Điều hướng      | Tree                         | **DERIVED VIEW**          | [`/DESIGN.md`](../../DESIGN.md)                  | Cấu trúc thanh điều hướng Notched Bottom Nav 5 chốt và cây màn hình chi tiết cho Staff và Manager.                              |
| [`09-system-current-state.html`](09-system-current-state.html)                                         | Hiện trạng Kiến trúc Hệ thống         | IT Current-State             | **HISTORICAL AS-IS**      | Mã nguồn baseline (`2f9a26b`)                    | Phản ánh trung thực mã nguồn hiện tại: Khối MobileApp 2.054 dòng, service quá tải và bộ đệm RAM dễ mất dữ liệu.                 |
| [`10-system-target-architecture.html`](10-system-target-architecture.html)                             | Kiến trúc Mục tiêu Clean Architecture | Architecture / Layers        | **PROPOSED ARCHITECTURE** | [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)     | Cấu trúc phân tầng Clean / Ports & Adapters đề xuất cho tương lai (chờ phê duyệt ADR).                                          |
| [`12-architecture-dependency-map.html`](12-architecture-dependency-map.html)                           | Bản đồ Phụ thuộc Gói & Ranh giới      | Dependency Graph             | **GOVERNANCE**            | [`AGENTS.md`](../../AGENTS.md)                   | Chiều phụ thuộc cho phép giữa `apps/mobile` và các `packages/`, cùng các ranh giới bị nghiêm cấm trong monorepo.                |

---

## 2. Danh mục biểu đồ lịch sử đã bị thay thế (Superseded / Historical Diagrams)

Các biểu đồ dưới đây thuộc thiết kế sơ khởi ban đầu (sử dụng chuỗi 5 bước cố định, thiếu trạng thái `BLOCKED` và `CANCELLED`, hoặc duyệt nhị phân). Chúng được lưu giữ để bảo toàn lịch sử phân tích, nhưng **KHÔNG ĐƯỢC COI LÀ CONTRACT ĐANG HOẠT ĐỘNG**:

| File                                                                           | Tên biểu đồ ban đầu                | Trạng thái kỹ thuật | Biểu đồ chuẩn tắc thay thế                                                                             | Lý do thay thế                                                                                         |
| :----------------------------------------------------------------------------- | :--------------------------------- | :------------------ | :----------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| [`03-mvp-operational-swimlane.html`](03-mvp-operational-swimlane.html)         | Quy trình Vận hành Liên vai trò    | **SUPERSEDED**      | [`proposed-02-mvp-operational-swimlane.html`](proposed-02-mvp-operational-swimlane.html)               | Mô hình cũ ép buộc 5 chốt tuần tự và duyệt nhị phân; thay thế bởi luồng vận hành linh hoạt có BLOCKED. |
| [`04-task-lifecycle.html`](04-task-lifecycle.html)                             | Vòng đời Nhiệm vụ (Task Lifecycle) | **SUPERSEDED**      | [`proposed-03-minimal-task-lifecycle.html`](proposed-03-minimal-task-lifecycle.html)                   | Vòng đời cũ chỉ có 4 trạng thái; thay thế bởi máy trạng thái 7 trạng thái tất định.                    |
| [`05-proof-workflow.html`](05-proof-workflow.html)                             | Quy trình Thu thập Bằng chứng      | **SUPERSEDED**      | [`proposed-04-proof-policy-and-rework.html`](proposed-04-proof-policy-and-rework.html)                 | Chuỗi 5 bước cố định vi phạm tính thích ứng ngoài thực địa; thay thế bởi 3 Proof Profiles ngữ nghĩa.   |
| [`06-review-rework-lifecycle.html`](06-review-rework-lifecycle.html)           | Quy trình Thẩm định của Quản lý    | **SUPERSEDED**      | [`proposed-04-proof-policy-and-rework.html`](proposed-04-proof-policy-and-rework.html) & `proposed-02` | Cổng duyệt cũ chỉ có Duyệt/Từ chối nhị phân; thay thế bởi 4 kết luận duyệt và làm lại có mục tiêu.     |
| [`11-evidence-submission-sequence.html`](11-evidence-submission-sequence.html) | Chuỗi Tương tác Nộp Bằng chứng     | **SUPERSEDED**      | [`proposed-04-proof-policy-and-rework.html`](proposed-04-proof-policy-and-rework.html)                 | Trình tự nộp cũ dựa trên giả định 5 chốt bằng chứng cố định.                                           |

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
