# NOVYX GreenOps — Diagram Suite Inventory & Visual Index

Tài liệu này quản lý toàn bộ hệ thống sơ đồ kiến trúc, quy trình vận hành, phân quyền và máy trạng thái của **NOVYX GreenOps**.

Toàn bộ biểu đồ được lưu dưới dạng **repository-contained HTML (SVG/CSS + bundled fonts)** tuân thủ quy chuẩn thiết kế [`diagram-design`](../../.agents/skills/diagram-design/SKILL.md) và bảng mã màu Seed/Linear tại [`DESIGN.md`](../../DESIGN.md). Các file mở trực tiếp trong trình duyệt mà không cần máy chủ hoặc tài nguyên font từ bên thứ ba; giữ nguyên thư mục [`assets/fonts/`](assets/fonts/) khi sao chép suite.

Mức độ áp dụng upstream, các khoảng trống còn lại và lộ trình khai thác được lưu tại [`UPSTREAM-ADOPTION.md`](UPSTREAM-ADOPTION.md). Nghiên cứu font tiếng Việt và nguyên nhân lỗi fallback được lưu tại [`TYPOGRAPHY-RESEARCH-VI.md`](TYPOGRAPHY-RESEARCH-VI.md).

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
   - Phản ánh trung thực mã nguồn tại baseline được ghi ngay trên từng biểu đồ. Biểu đồ loại này phải ghi rõ commit hoặc trạng thái working tree đã đối soát; không được tự nhận là “current” sau khi baseline đã thay đổi.
   - Bắt buộc mang banner: `STATUS: IMPLEMENTATION SNAPSHOT / AS-IS — NOT TARGET BUSINESS MODEL` và gán nhãn khuyết tật rõ ràng `[AS-IS DEFECT]`.
4. **`TARGET_DIRECTION_NOT_ARCHITECTURE` (Định hướng mục tiêu sơ khởi — Chưa chốt kiến trúc kỹ thuật):**
   - Dùng cho các bản thảo định hướng trước khi có ADR chấp thuận. (Sau Phase 11C, các sơ đồ mục tiêu đã có ADR phê duyệt được nâng cấp lên `CURRENT_DERIVED_VIEW`).
5. **`DEFERRED_UNTIL_ADR` (Góc nhìn phụ thuộc kiến trúc — Hoãn lại chờ ADR):**
   - Dùng cho các sơ đồ có quyết định bị hoãn lại chờ phê duyệt ADR. (Sau Phase 11C, đã được giải quyết qua bộ ADR 0005..0013).
6. **`REFERENCE_COMPARISON` (Biểu đồ đối chiếu tham chiếu):**
   - Dùng để so sánh đối chiếu giữa mô hình tuần tự cũ và mô hình chuẩn hóa linh hoạt mới. Không trình bày phía "cũ" như là đích đến.
   - Bắt buộc mang banner: `STATUS: REFERENCE COMPARISON — DERIVED VIEW`.

---

## 1. Danh mục diagram hiện hành

Các file ở thư mục gốc là entry point mặc định. Tên file không dùng tiền tố `proposed-*` vì các view này đã được chấp thuận hoặc phản ánh implementation hiện tại.

| Tệp | Nội dung | Classification | Nguồn chính |
| :--- | :--- | :--- | :--- |
| [`01-product-capability-map.html`](01-product-capability-map.html) | Bản đồ năng lực sản phẩm và ranh giới ba vai trò | `CURRENT_DERIVED_VIEW` | `PRODUCT.md`, `ACCESS-CONTROL.md` |
| [`02-domain-context-map.html`](02-domain-context-map.html) | Năm bounded contexts và quan hệ sở hữu | `CURRENT_DERIVED_VIEW` | `DOMAIN.md` |
| [`03-operational-workflow.html`](03-operational-workflow.html) | Swimlane vận hành Manager–Staff–System | `CURRENT_DERIVED_VIEW` | `WORKFLOWS.md`, `ACCESS-CONTROL.md` |
| [`04-task-lifecycle.html`](04-task-lifecycle.html) | Vòng đời task đúng bảy trạng thái | `CURRENT_DERIVED_VIEW` | `WORKFLOWS.md`, `DOMAIN.md` |
| [`05-proof-policy-and-rework.html`](05-proof-policy-and-rework.html) | Ba proof profiles và rework có mục tiêu | `CURRENT_DERIVED_VIEW` | `WORKFLOWS.md`, `DOMAIN.md` |
| [`07-action-eligibility-security-matrix.html`](07-action-eligibility-security-matrix.html) | Role ∧ scope ∧ state ∧ preconditions | `CURRENT_DERIVED_VIEW` | `ACCESS-CONTROL.md` |
| [`08-role-information-architecture.html`](08-role-information-architecture.html) | Workspace và navigation theo vai trò | `CURRENT_DERIVED_VIEW` | `PRODUCT.md`, ADR 0005 |
| [`10-system-target-architecture.html`](10-system-target-architecture.html) | Kiến trúc client advisory / server authoritative | `CURRENT_DERIVED_VIEW` | `ARCHITECTURE.md`, ADR 0005..0013 |
| [`12-architecture-dependency-map.html`](12-architecture-dependency-map.html) | Ranh giới phụ thuộc monorepo | `CURRENT_DERIVED_VIEW` | `ARCHITECTURE.md`, `AGENTS.md` |
| [`13-e2e-lifecycle-implementation-audit.html`](13-e2e-lifecycle-implementation-audit.html) | Đối soát implementation với lifecycle chuẩn | `AS_IS_IMPLEMENTATION_VIEW` | Working tree, `WORKFLOWS.md`, `DOMAIN.md` |
| [`14-customer-e2e-workflow.html`](14-customer-e2e-workflow.html) | Swimlane 16:9 dùng demo khách hàng: cây → giao việc → hiện trường → nghiệm thu | `CUSTOMER_DEMO_VIEW` | Mobile screen contracts, verified live E2E |

### Kho lưu trữ lịch sử

Các file trong [`historical/`](historical/) chỉ phục vụ audit và đối chiếu tiến hóa. Không dùng chúng làm tài liệu triển khai hiện tại.

| Tệp | Nội dung lịch sử | Thay thế hiện hành |
| :--- | :--- | :--- |
| [`historical/legacy-operational-swimlane.html`](historical/legacy-operational-swimlane.html) | Swimlane 5 chốt tuần tự cũ | [`03-operational-workflow.html`](03-operational-workflow.html) |
| [`historical/legacy-four-state-task-lifecycle.html`](historical/legacy-four-state-task-lifecycle.html) | Lifecycle cũ thiếu `BLOCKED`, `CANCELLED` | [`04-task-lifecycle.html`](04-task-lifecycle.html) |
| [`historical/legacy-fixed-proof-workflow.html`](historical/legacy-fixed-proof-workflow.html) | Proof workflow cố định | [`05-proof-policy-and-rework.html`](05-proof-policy-and-rework.html) |
| [`historical/legacy-binary-review.html`](historical/legacy-binary-review.html) | Review nhị phân cũ | [`03-operational-workflow.html`](03-operational-workflow.html), [`05-proof-policy-and-rework.html`](05-proof-policy-and-rework.html) |
| [`historical/legacy-evidence-submission-sequence.html`](historical/legacy-evidence-submission-sequence.html) | Sequence nộp bằng chứng cũ | [`05-proof-policy-and-rework.html`](05-proof-policy-and-rework.html), [`13-e2e-lifecycle-implementation-audit.html`](13-e2e-lifecycle-implementation-audit.html) |
| [`historical/legacy-system-current-state.html`](historical/legacy-system-current-state.html) | Snapshot implementation tại baseline `2f9a26b` | [`10-system-target-architecture.html`](10-system-target-architecture.html), [`13-e2e-lifecycle-implementation-audit.html`](13-e2e-lifecycle-implementation-audit.html) |
| [`historical/workflow-evolution-comparison.html`](historical/workflow-evolution-comparison.html) | So sánh mô hình cũ và mô hình chuẩn hóa | Reference comparison only |

---

## 2. Quy chuẩn Hình học & Kiểu chữ Tiếng Việt (Visual, Geometry & Typography Rules)

Các biểu đồ active/derived/target dùng các chỉ tiêu dưới đây làm chuẩn kiểm tra. Chỉ được ghi “đã xác minh” khi có kết quả render/đo hình học tương ứng; kiểm tra encoding không thay thế kiểm tra trực quan.

- **Bảng màu Semantic Seed/Linear:** Tuân thủ 100% token của [`DESIGN.md`](../../DESIGN.md):
  - Paper canvas: `#FCFCF7` (`snowWhite`) / fill phụ: `#EEEEE9` (`warmStone`) hoặc `#FFFFFF`
  - Stroke & Ink chính: `#112116` (`forestDepths`) — độ tương phản WCAG AA $> 16:1 \ge 4.5:1$
  - Muted text & Connectors: `#68756B` (`pewter`)
  - Đường viền tế vi: `#E2E0D8` hoặc `rgba(17, 33, 22, 0.08)`
  - Accent / Trọng tâm: `#166534` (Forest dark green) & `#84CC16` (`limePulse`)
  - Cảnh báo / Đề xuất: `#D97706` (Amber - Rework / Waiting / Proposed badge / Target Component Not Yet Implemented)
  - Nguy hiểm / Cấm đoán: `#DC2626` (Red - Forbidden / Dead code / Gaps)
- **Hỗ trợ Tiếng Việt & Kiểu chữ:**
  - Mọi file HTML phải khai báo `<meta charset="utf-8">` và lưu thực tế bằng UTF-8.
  - Font chữ: bundled Noto Sans / Noto Serif tại [`assets/fonts/`](assets/fonts/); không phụ thuộc Google Fonts khi render.
  - Chỉ dùng Geist Mono cho enum, API path và technical ID; không dùng mono cho câu tiếng Việt.
  - Sàn cỡ chữ mục tiêu: 12 px cho nội dung, 11 px cho nhãn kỹ thuật ngắn.
- **Quy chuẩn Hình học Thực tế:**
  - Ưu tiên HTML/CSS Grid/Flex cho diagram nhiều văn bản; không đặt câu tiếng Việt dài bằng tọa độ SVG cố định.
  - SVG chỉ phù hợp với connector hoặc hình học ngắn, ổn định. Text trong SVG phải ngắn và đã được kiểm tra ở kích thước thật.
  - **Zero Visual Collision:** Không có bất kỳ giao cắt chồng lấn văn bản nào ($> 3\text{px} \times 3\text{px}$).
  - **Zero Non-Owner Crossing:** Đầu nhãn và connector không cắt xuyên qua các khối nội dung không liên quan.
  - **Zero Viewport Clipping / Boundary Overflow:** Toàn bộ text nằm trọn vẹn trong thẻ hộp chứa và khung nhìn.
  - **Safe Internal Padding:** Khoảng đệm an toàn tối thiểu từ mép chữ tới viền hộp $x \ge 4\text{px}, y \ge 3\text{px}$ trên 100% các phần tử.

## 3. Quy trình chỉnh sửa và cập nhật diagram

Mỗi lần sửa hoặc thêm diagram phải thực hiện theo thứ tự sau:

1. **Đối soát nguồn:** xác định classification và đọc tài liệu chuẩn tắc được ghi trong catalog. Không đưa quyết định mới vào diagram.
2. **Dùng layout chung:** canvas rộng 1440 px; nền `#FCFCF7`; card trắng; Noto Serif cho heading, Noto Sans cho tiếng Việt và Geist Mono chỉ cho technical label.
3. **Viết nội dung có khả năng co giãn:** dùng Grid/Flex, `min-width: 0`, padding tối thiểu 10–14 px và để trình duyệt tự wrap. Không dùng absolute positioning cho paragraph.
4. **Kiểm tra encoding và font:** mọi file phải có `<meta charset="utf-8">`, link đúng `assets/fonts/fonts.css`, và validator phải xác nhận Noto Sans/Noto Serif thực sự ở trạng thái `loaded`.
5. **Render từng file ở kích thước thật:** Chrome/Edge headless tối thiểu `1440×1400`; kiểm tra trực tiếp từng PNG, không kết luận từ contact sheet thu nhỏ.
6. **Acceptance bắt buộc:** không mất dấu tiếng Việt, không overlap, không clipping, không overflow, không connector xuyên node, status/source đúng và nội dung khớp canonical docs/code.
7. **Kiểm tra suite:** render lại toàn bộ folder sau thay đổi shared style hoặc typography; chạy upstream `self_check.py`, runtime validation, kiểm tra ký tự `�` và `git diff --check`.
8. **Xuất bản current suite:** tạo PNG/PDF full-page @2x trong `exports/`; không tái sử dụng artifact mang tên cũ hoặc `proposed-*`.
9. **Cập nhật catalog:** sửa dòng tương ứng trong README khi classification, source, implementation status hoặc file thay thế thay đổi.

Lệnh render kiểm tra cục bộ trên Windows/Git Bash:

```bash
ROOT=$(pwd -W)
CHROME='/c/Program Files/Google/Chrome/Application/chrome.exe'
mkdir -p .tmp/diagram-shots
for file in docs/diagrams/*.html; do
  name=$(basename "$file" .html)
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --window-size=1440,1400 \
    --screenshot="$(pwd -W)/.tmp/diagram-shots/$name.png" \
    "file:///$ROOT/$file"
done
```

Không ghi “visual PASS” nếu chưa mở ảnh render kích thước thật của từng file bị tác động.

Current-suite exports được lưu tại [`exports/`](exports/). Structured adoption và acceptance evidence được mô tả trong [`UPSTREAM-ADOPTION.md`](UPSTREAM-ADOPTION.md).
