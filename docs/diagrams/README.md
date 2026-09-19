# NOVYX GreenOps — Diagram Suite Inventory & Visual Index

Tài liệu này quản lý toàn bộ hệ thống sơ đồ kiến trúc, quy trình vận hành và máy trạng thái của **NOVYX GreenOps**.

Toàn bộ biểu đồ được thiết kế và lưu trữ dưới dạng **Standalone HTML (Inline SVG & CSS)** tuân thủ quy chuẩn thiết kế [`diagram-design`](../../.agents/skills/diagram-design/SKILL.md) và bảng mã màu Seed/Linear tại [`DESIGN.md`](../../DESIGN.md). Các file này có thể mở trực tiếp trên mọi trình duyệt web hiện đại độc lập, không phụ thuộc vào công cụ vẽ bên thứ ba hay máy chủ render.

---

## 0. Mô hình phân loại 3 tầng chuẩn tắc (3-Tier Classification Model)

Mọi biểu đồ trong hệ thống bắt buộc phải thuộc chính xác 1 trong 3 nhóm phân loại sau:

1. **CANONICAL CURRENT-STATE (Hiện trạng chuẩn tắc & Đường cơ sở đã chốt):**
   - Mô tả hiện trạng thực tế của mã nguồn baseline (`2f9a26b`) hoặc các quy tắc nghiệp vụ/bảo mật đã được chốt chính thức trong tài liệu Markdown chuẩn tắc (`WORKFLOWS.md`, `DOMAIN.md`, `PRODUCT.md`, `ACCESS-CONTROL.md`, `AGENTS.md`, `DESIGN.md`).
   - Tuyệt đối không chứa các giả định kiến trúc tương lai chưa được phê duyệt (`speculative / unapproved`).
   - Huy hiệu hiển thị: `CANONICAL CURRENT-STATE — DERIVED VIEW`, `CANONICAL CURRENT-STATE — HISTORICAL AS-IS`, hoặc `GOVERNANCE & ARCHITECTURE BOUNDARIES`.

2. **PROPOSED TARGET / RECOMMENDED (Định hướng kiến trúc mục tiêu & Khuyến nghị chuẩn hóa):**
   - Mô tả hướng cải tiến, kiến trúc mục tiêu phân tầng Clean / Ports & Adapters, hoặc lộ trình chuyển đổi từ mô hình cũ sang luồng vận hành linh hoạt.
   - Bắt buộc phải gắn nhãn hiển thị `PROPOSED TARGET / RECOMMENDED` hoặc `PROPOSED TARGET ARCHITECTURE — PENDING ADR APPROVAL` kèm cờ cảnh báo chờ phê duyệt ADR.
   - Không tự ý xem là hợp đồng bắt buộc cho đến khi được phê duyệt qua Architecture Decision Record (ADR).

3. **HISTORICAL / SUPERSEDED (Biểu đồ lịch sử đã hết hiệu lực):**
   - Lưu trữ phục vụ kiểm toán lịch sử và đối chiếu phân tích khoảng cách (gap analysis).
   - Bắt buộc mang banner cảnh báo viền đỏ nổi bật: `[SUPERSEDED / HISTORICAL — KHÔNG DÙNG LÀM CHUẨN THIẾT KẾ]` và trích dẫn rõ biểu đồ chuẩn tắc thay thế.

---

## 1. Danh mục biểu đồ dẫn xuất chuẩn tắc đang hoạt động (Active Derived Views)

> **Nguyên tắc thẩm quyền cốt lõi:** Mọi biểu đồ đang hoạt động đều là **GÓC NHÌN DẪN XUẤT (`DERIVED VIEW`)** trực quan từ các tài liệu chuẩn tắc Markdown hoặc mã nguồn baseline đã kiểm toán. Biểu đồ KHÔNG BAO GIỜ là chủ sở hữu hợp đồng độc lập (`NEVER A CANONICAL CONTRACT`).

| File                                                                                                   | Tên biểu đồ                                 | Phân tầng kiến trúc (Classification) | Huy hiệu hiển thị (Status Badge)                      | Nguồn chuẩn tắc (`SOURCE`)                       | Mục đích & Nội dung mô hình thể hiện                                                                                                                       | Trạng thái Export (Artifacts)                        |
| :----------------------------------------------------------------------------------------------------- | :------------------------------------------ | :----------------------------------- | :---------------------------------------------------- | :----------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| [`proposed-01-current-vs-recommended-workflow.html`](proposed-01-current-vs-recommended-workflow.html) | So sánh Hiện trạng vs Chuẩn hóa Khuyến nghị | **PROPOSED TARGET / RECOMMENDED**    | `PROPOSED TARGET / RECOMMENDED — DERIVED VIEW`        | [`docs/WORKFLOWS.md`](../WORKFLOWS.md)           | So sánh đối chiếu trực quan mô hình 5 chốt tuần tự cũ và luồng Xác thực hiện trường linh hoạt kết hợp 3 Hồ sơ Bằng chứng.                                  | SVG, PNG @2x, PNG @3x, full PNG, PDF, full PDF (6/6) |
| [`proposed-02-mvp-operational-swimlane.html`](proposed-02-mvp-operational-swimlane.html)               | Luồng Vận hành Liên vai trò MVP             | **CANONICAL CURRENT-STATE**          | `CANONICAL CURRENT-STATE — DERIVED VIEW`              | [`docs/WORKFLOWS.md`](../WORKFLOWS.md)           | Chu trình vận hành MVP: Bắt đầu tất định `StartTask`, Xác thực hiện trường linh hoạt, Báo sự cố `BLOCKED` (3 lối thoát), 4 kết luận thẩm định.             | SVG, PNG @2x, full PNG, PDF, full PDF (5/5)          |
| [`proposed-03-minimal-task-lifecycle.html`](proposed-03-minimal-task-lifecycle.html)                   | Vòng đời Nhiệm vụ 7 Trạng thái Tất định     | **CANONICAL CURRENT-STATE**          | `CANONICAL CURRENT-STATE — DERIVED VIEW`              | [`docs/WORKFLOWS.md`](../WORKFLOWS.md)           | Máy trạng thái 7 trạng thái tất định cho MVP: Khởi đầu `StartTask`, các lối thoát `BLOCKED`, duyệt ngoại lệ, 2 trạng thái đóng (`COMPLETED`, `CANCELLED`). | SVG, PNG @2x, full PNG, PDF, full PDF (5/5)          |
| [`proposed-04-proof-policy-and-rework.html`](proposed-04-proof-policy-and-rework.html)                 | 3 Hồ sơ Ngữ nghĩa & Làm lại Trọng tâm       | **CANONICAL CURRENT-STATE**          | `CANONICAL CURRENT-STATE — DERIVED VIEW`              | [`docs/DOMAIN.md`](../DOMAIN.md)                 | Chi tiết 3 Hồ sơ Bằng chứng (`CHANGE`, `SERVICE`, `INSPECTION`), làm lại có mục tiêu lưu vết đa phiên bản (`attempt 1..N`), xử lý ngoại lệ.                | SVG, PNG @2x, full PNG, PDF, full PDF (5/5)          |
| [`01-product-capability-map.html`](01-product-capability-map.html)                                     | Bản đồ Năng lực Nghiệp vụ (Capability Map)  | **CANONICAL CURRENT-STATE**          | `CANONICAL CURRENT-STATE — DERIVED VIEW`              | [`docs/PRODUCT.md`](../PRODUCT.md)               | Phân rã năng lực từ `CAP-01` đến `CAP-08`: Core Domain (Field Work Verification), Supporting Subdomains, Generic Platform Capabilities.                    | SVG, PNG @2x, full PNG, PDF, full PDF (5/5)          |
| [`02-domain-context-map.html`](02-domain-context-map.html)                                             | Bản đồ Ngữ cảnh Bounded Contexts            | **CANONICAL CURRENT-STATE**          | `CANONICAL CURRENT-STATE — DERIVED VIEW`              | [`docs/DOMAIN.md`](../DOMAIN.md)                 | Thể hiện mối quan hệ Upstream/Downstream giữa Verification Context và các Subdomain vệ tinh (Scheduling, Catalog, Identity, Storage).                      | SVG, PNG @2x, full PNG, PDF, full PDF (5/5)          |
| [`07-action-eligibility-security-matrix.html`](07-action-eligibility-security-matrix.html)             | Ma trận Phân quyền & Kích hoạt Hành động    | **CANONICAL CURRENT-STATE**          | `CANONICAL CURRENT-STATE — DERIVED VIEW`              | [`docs/ACCESS-CONTROL.md`](../ACCESS-CONTROL.md) | Quyền thực thi lệnh dựa trên công thức 4 yếu tố: Role $\land$ Scope $\land$ State $\land$ Preconditions.                                                   | SVG, PNG @2x, full PNG, PDF, full PDF (5/5)          |
| [`08-role-information-architecture.html`](08-role-information-architecture.html)                       | Kiến trúc Thông tin & Điều hướng Vai trò    | **CANONICAL CURRENT-STATE**          | `CANONICAL CURRENT-STATE — DERIVED VIEW`              | [`/DESIGN.md`](../../DESIGN.md)                  | Cấu trúc thanh điều hướng Notched Bottom Nav 5 vị trí và cây màn hình chi tiết cho Staff và Manager.                                                       | SVG, PNG @2x, full PNG, PDF, full PDF (5/5)          |
| [`09-system-current-state.html`](09-system-current-state.html)                                         | Hiện trạng Kiến trúc Hệ thống As-Is         | **CANONICAL CURRENT-STATE**          | `CANONICAL CURRENT-STATE — HISTORICAL AS-IS`          | Mã nguồn baseline (`2f9a26b`)                    | Phản ánh trung thực mã nguồn hiện tại: Khối MobileApp 2.054 dòng, service quá tải, thiếu outbox và bộ đệm RAM dễ mất dữ liệu.                              | SVG, PNG @2x, full PNG, PDF, full PDF (5/5)          |
| [`10-system-target-architecture.html`](10-system-target-architecture.html)                             | Kiến trúc Mục tiêu Clean Architecture       | **PROPOSED TARGET / RECOMMENDED**    | `PROPOSED TARGET ARCHITECTURE — PENDING ADR APPROVAL` | [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)     | Cấu trúc phân tầng Clean / Ports & Adapters đề xuất cho tương lai (chờ phê duyệt ADR).                                                                     | SVG, PNG @2x, full PNG, PDF, full PDF (5/5)          |
| [`12-architecture-dependency-map.html`](12-architecture-dependency-map.html)                           | Bản đồ Phụ thuộc Gói & Ranh giới Monorepo   | **CANONICAL CURRENT-STATE**          | `GOVERNANCE & ARCHITECTURE BOUNDARIES`                | [`AGENTS.md`](../../AGENTS.md)                   | Chiều phụ thuộc cho phép giữa `apps/mobile` và các `packages/`, cùng các ranh giới bị nghiêm cấm trong monorepo.                                           | SVG, PNG @2x, full PNG, PDF, full PDF (5/5)          |

---

## 2. Danh mục biểu đồ lịch sử đã bị thay thế (Superseded / Historical Diagrams)

Các biểu đồ dưới đây thuộc thiết kế sơ khởi ban đầu (sử dụng chuỗi 5 bước cố định, thiếu trạng thái `BLOCKED` và `CANCELLED`, hoặc duyệt nhị phân). Chúng được lưu giữ để bảo toàn lịch sử phân tích, nhưng **TUYỆT ĐỐI KHÔNG ĐƯỢC COI LÀ CONTRACT ĐANG HOẠT ĐỘNG**:

| File                                                                           | Tên biểu đồ ban đầu                | Phân loại kỹ thuật          | Biểu đồ chuẩn tắc thay thế (Replaced By)                                                               | Lý do thay thế                                                                                                                             |
| :----------------------------------------------------------------------------- | :--------------------------------- | :-------------------------- | :----------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| [`03-mvp-operational-swimlane.html`](03-mvp-operational-swimlane.html)         | Quy trình Vận hành Liên vai trò    | **SUPERSEDED / HISTORICAL** | [`proposed-02-mvp-operational-swimlane.html`](proposed-02-mvp-operational-swimlane.html)               | Mô hình cũ ép buộc 5 chốt tuần tự và duyệt nhị phân; thay thế bởi luồng vận hành linh hoạt có `BLOCKED` (3 lối thoát) và 4 kết luận duyệt. |
| [`04-task-lifecycle.html`](04-task-lifecycle.html)                             | Vòng đời Nhiệm vụ (Task Lifecycle) | **SUPERSEDED / HISTORICAL** | [`proposed-03-minimal-task-lifecycle.html`](proposed-03-minimal-task-lifecycle.html)                   | Vòng đời cũ chỉ có 4 trạng thái; thay thế bởi máy trạng thái 7 trạng thái tất định với lệnh `StartTask` tường minh.                        |
| [`05-proof-workflow.html`](05-proof-workflow.html)                             | Quy trình Thu thập Bằng chứng      | **SUPERSEDED / HISTORICAL** | [`proposed-04-proof-policy-and-rework.html`](proposed-04-proof-policy-and-rework.html)                 | Chuỗi 5 bước cố định vi phạm tính thích ứng ngoài thực địa; thay thế bởi 3 Hồ sơ Bằng chứng ngữ nghĩa (`CHANGE`, `SERVICE`, `INSPECTION`). |
| [`06-review-rework-lifecycle.html`](06-review-rework-lifecycle.html)           | Quy trình Thẩm định của Quản lý    | **SUPERSEDED / HISTORICAL** | [`proposed-04-proof-policy-and-rework.html`](proposed-04-proof-policy-and-rework.html) & `proposed-02` | Cổng duyệt cũ chỉ có Duyệt/Từ chối nhị phân; thay thế bởi 4 kết luận duyệt và làm lại có mục tiêu (`targetedArea`, đa phiên bản).          |
| [`11-evidence-submission-sequence.html`](11-evidence-submission-sequence.html) | Chuỗi Tương tác Nộp Bằng chứng     | **SUPERSEDED / HISTORICAL** | [`proposed-04-proof-policy-and-rework.html`](proposed-04-proof-policy-and-rework.html)                 | Trình tự nộp cũ dựa trên giả định 5 chốt bằng chứng cố định và thiếu hỗ trợ ngoại tuyến tin cậy.                                           |

---

## 3. Quy chuẩn Hình học & Kiểu chữ Tiếng Việt (Visual, Geometry & Typography Rules)

Toàn bộ 11 biểu đồ active đã được xác minh tự động thông qua công cụ kiểm tra hình học trình duyệt headless (`scripts/diagram_tool.py validate`) với các chỉ tiêu nghiêm ngặt:

- **Bảng màu Semantic Seed/Linear:** Tuân thủ 100% token của [`DESIGN.md`](../../DESIGN.md):
  - Paper canvas: `#FCFCF7` (`snowWhite`) / fill phụ: `#EEEEE9` (`warmStone`) hoặc `#FFFFFF`
  - Stroke & Ink chính: `#112116` (`forestDepths`) — độ tương phản WCAG AA $> 16:1 \ge 4.5:1$
  - Muted text & Connectors: `#68756B` (`pewter`)
  - Đường viền tế vi: `#E2E0D8` hoặc `rgba(17, 33, 22, 0.08)`
  - Accent / Trọng tâm: `#166534` (Forest dark green) & `#84CC16` (`limePulse`)
  - Cảnh báo / Đề xuất: `#D97706` (Amber - Rework / Waiting / Proposed badge)
  - Nguy hiểm / Cấm đoán: `#DC2626` (Red - Forbidden / Dead code / Gaps)
- **Hỗ trợ Tiếng Việt & Kiểu chữ:**
  - Font chữ: Noto Sans / Noto Serif nhúng qua Google Fonts với XML-safe URL (`&amp;`).
  - Sàn cỡ chữ: Font Floor $\ge 11\text{px}$ trên toàn bộ văn bản đọc được (loại bỏ hoàn toàn chữ quá nhỏ).
- **Quy chuẩn Hình học Thực tế:**
  - **Zero Visual Collision:** Không có bất kỳ giao cắt chồng lấn văn bản nào ($> 3\text{px} \times 3\text{px}$).
  - **Zero Non-Owner Crossing:** Đầu nhãn và connector không cắt xuyên qua các khối nội dung không liên quan.
  - **Zero Viewport Clipping / Boundary Overflow:** Toàn bộ text nằm trọn vẹn trong thẻ hộp chứa và khung nhìn SVG.
  - **Safe Internal Padding:** Khoảng đệm an toàn tối thiểu từ mép chữ tới viền hộp $x \ge 4\text{px}, y \ge 3\text{px}$ trên 100% các phần tử.

---

## 4. Hệ thống Artifact Xuất Bản Đa Định Dạng (Multi-Format Export Pipeline)

Toàn bộ các tệp xuất bản phục vụ tài liệu, in ấn và trình chiếu được lưu trữ tập trung tại thư mục `dist/diagrams_verification/` với 56 artifact được tái tạo đồng bộ:

1. **Standalone SVG (`*.svg` - 11 tệp):** Trích xuất SVG độc lập, XML-valid, nhúng Google Fonts an toàn, chuẩn hóa mã màu RGBA thành Hex + Opacity chống lỗi đen nền trên PowerPoint và Figma.
2. **Diagram-Only PNG (`*.png` @2x - 11 tệp):** Rasterization độ phân giải cao tỉ lệ 2x, ôm sát bounding box của biểu đồ (không viền trang thừa).
3. **High-Res Diagram PNG (`proposed-01@3x.png` @3x - 1 tệp):** Rasterization siêu nét tỉ lệ 3x (3180x2040px) dành cho biểu đồ so sánh phức tạp.
4. **Full-Page PNG (`*.full.png` @2x - 11 tệp):** Chụp toàn bộ trang tài liệu bao gồm tiêu đề, thanh phân loại và khối chú thích.
5. **Diagram-Only PDF (`*.pdf` - 11 tệp):** Định dạng vector PDF 0-margin khớp chính xác kích thước biểu đồ cho việc in ấn kỹ thuật.
6. **Full-Page PDF (`*.full.pdf` - 11 tệp):** Định dạng PDF trang đầy đủ chuẩn tài liệu kỹ thuật.
