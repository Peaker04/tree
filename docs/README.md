# NOVYX GreenOps — Documentation Authority & Governance Index

Chào mừng đến với hệ thống tài liệu chuẩn tắc (Canonical Documentation) của **NOVYX GreenOps**.

Tài liệu này là điểm khởi đầu duy nhất (Single Source of Truth) định vị quyền sở hữu thông tin cho toàn bộ dự án. Dự án áp dụng mô hình quản trị tài liệu nghiêm ngặt được kế thừa từ thực tiễn tốt nhất: **Một câu hỏi — Đúng một chủ sở hữu tài liệu (One Question, One Owner)**.

---

## 1. Bản đồ thẩm quyền tài liệu (Authority Map)

Khi tìm kiếm câu trả lời cho bất kỳ khía cạnh nào của hệ thống, hãy tra cứu đúng tài liệu chủ quản dưới đây. Tuyệt đối không suy diễn quy tắc nghiệp vụ từ mã nguồn giao diện (JSX/TSX).

| Câu hỏi cần giải đáp                                               | Tài liệu chủ quản                                                               | Thẩm quyền & Nội dung chính                                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hệ thống giải quyết bài toán gì? Phạm vi MVP là gì?**            | [`docs/PRODUCT.md`](PRODUCT.md)                                                 | Vision, Problem Statement, Business Capabilities, MVP Walking Skeleton, Explicit Non-goals.                                                    |
| **Nghiệp vụ có ý nghĩa gì? Bounded Context & Invariants là gì?**   | [`docs/DOMAIN.md`](DOMAIN.md)                                                   | Core/Supporting/Generic Domains, Bounded Contexts, Ubiquitous Language, Invariants (DR-01..DR-10), Entity Lifecycles.                          |
| **Các quy trình nghiệp vụ chuyển trạng thái như thế nào?**         | [`docs/WORKFLOWS.md`](WORKFLOWS.md)                                             | 7-State Task Lifecycle, Site Verification, 3 Proof Profiles, Manager Review, Targeted Rework, Blocked, Cancel, Reassign, Care History.         |
| **Ai có quyền xem và làm gì? Điều kiện kích hoạt action là gì?**   | [`docs/ACCESS-CONTROL.md`](ACCESS-CONTROL.md)                                   | Actor Registry, Role–Responsibility–Handoff Matrix, Action Eligibility Matrix (Role + Scope + State + Preconditions).                          |
| **Hệ thống phần mềm được cấu trúc như thế nào (Hiện tại & Đích)?** | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)                                       | AS-IS vs TO-BE Architecture, Layered Clean/Ports-and-Adapters, Feature Ownership, greenOpsService Decomposition, Contract & Data Architecture. |
| **Hệ thống phải chịu tải, phục hồi và xử lý lỗi ra sao?**          | [`docs/NFR.md`](NFR.md)                                                         | Measurable Quality Attribute Scenarios (QAS), Error & Recovery Matrix, Offline Interruption & Resilience Model.                                |
| **Thiết kế trực quan, màu sắc, font chữ và UI rules là gì?**       | [`/DESIGN.md`](../DESIGN.md)<br>[`docs/MOBILE_UI_RULES.md`](MOBILE_UI_RULES.md) | Authoritative Visual Profile (Seed botanical identity + Linear structural discipline), Five-Action Nav, Mobile UX Rules.                       |
| **Yêu cầu nghiệp vụ truy vết ra code và kiểm chứng như thế nào?**  | [`docs/REQUIREMENTS-TRACEABILITY.md`](REQUIREMENTS-TRACEABILITY.md)             | Requirements Taxonomy (BR, FR, DR, AR, NFR...), Traceability Matrix, Feature Definition of Ready (DoR), Definition of Done (DoD).              |
| **Các khoảng trống, rủi ro và quyết định chưa chốt nằm ở đâu?**    | [`docs/INCEPTION-GAP-REPORT.md`](INCEPTION-GAP-REPORT.md)                       | Comprehensive Inception Gap Report, Open Decision Register (Options A/B/C), Re-evaluated Audit Findings.                                       |
| **Lịch sử và bằng chứng ra quyết định nghiệp vụ nằm ở đâu?**       | [`docs/BUSINESS-PROCESS-REVIEW.md`](BUSINESS-PROCESS-REVIEW.md)                 | Approved Decision Evidence / Historical Decision Record (Lưu vết 14 quyết định nghiệp vụ `BUS-DEC-01`..`14`).                                  |
| **Các sơ đồ kiến trúc và luồng nghiệp vụ trực quan ở đâu?**        | [`docs/diagrams/`](diagrams/)                                                   | Standalone Branded HTML/SVG Diagrams (Derived Views từ Canonical Docs) tuân thủ tiêu chuẩn `diagram-design` và palette NOVYX.                  |

---

## 2. Mô hình phân tầng thẩm quyền tài liệu (Source-of-Truth Authority Hierarchy)

Dự án áp dụng mô hình phân cấp thẩm quyền tài liệu nghiêm ngặt, tuyệt đối không dùng quy tắc gộp chung "mọi file docs/*.md đều là canonical truth":

1. **Lớp A: BUSINESS TARGET CONTRACT — CANONICAL (Hợp đồng nghiệp vụ mục tiêu chuẩn tắc):**
   - Tài liệu chủ quản: [`docs/PRODUCT.md`](PRODUCT.md), [`docs/DOMAIN.md`](DOMAIN.md), [`docs/WORKFLOWS.md`](WORKFLOWS.md), [`docs/ACCESS-CONTROL.md`](ACCESS-CONTROL.md), và định nghĩa yêu cầu mục tiêu trong [`docs/REQUIREMENTS-TRACEABILITY.md`](REQUIREMENTS-TRACEABILITY.md).
   - Thẩm quyền: Đây là sự thật nghiệp vụ tối cao đã được Product Owner phê duyệt. Bất kỳ sự khác biệt nào giữa code và Lớp A đều được phân loại là Khoảng trống triển khai (`[GAP]`).
2. **Lớp B: TECHNICAL TARGET / ARCHITECTURE (Kiến trúc kỹ thuật mục tiêu):**
   - Tài liệu chủ quản: [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/NFR.md`](NFR.md).
   - Thẩm quyền: Định hướng cấu trúc phần mềm dài hạn. Các phần chưa có quyết định ADR chính thức từ Tech Lead/Owner bắt buộc phải mang nhãn `[PROPOSED]` hoặc `[NEEDS_DECISION]`.
3. **Lớp C: CURRENT IMPLEMENTATION TRUTH (Hiện trạng triển khai thực tế):**
   - Chủ sở hữu: Toàn bộ mã nguồn thực tế (`apps/mobile/src/`, `packages/contracts/src/`), cấu hình runtime đang chạy ở commit baseline (`2f9a26b`).
   - Thẩm quyền: Thể hiện chính xác những gì đang hoạt động. Mã nguồn hiện tại KHÔNG được tự động xem là business target; ngược lại, business target cũng KHÔNG được mô tả như đã hoàn thành nếu mã nguồn chưa đáp ứng.
4. **Lớp D: DESIGN GOVERNANCE (Quản trị thiết kế & Giao diện):**
   - Tài liệu chủ quản: [`/DESIGN.md`](../DESIGN.md), [`docs/MOBILE_UI_RULES.md`](MOBILE_UI_RULES.md).
   - Thẩm quyền: Chỉ quản lý khía cạnh hiển thị, hệ thống token, layout, khả năng tiếp cận ngoài trời và quy tắc tương tác UI. Tuyệt đối KHÔNG sở hữu máy trạng thái hay định nghĩa lại quy trình nghiệp vụ trái với `WORKFLOWS.md`.
5. **Lớp E: DECISION EVIDENCE / HISTORY (Chứng cứ quyết định & Lịch sử):**
   - Tài liệu chủ quản: [`docs/BUSINESS-PROCESS-REVIEW.md`](BUSINESS-PROCESS-REVIEW.md), các báo cáo kiểm toán cũ (`docs/MOBILE_DESIGN_AUDIT.md`).
   - Thẩm quyền: Lưu vết quá trình phân tích và căn cứ dẫn đến quyết định. Không ghi đè các tài liệu chuẩn tắc Lớp A sau khi đã đồng bộ.
6. **Lớp F: PLANNING / GAP / MIGRATION (Kế hoạch & Báo cáo khoảng trống):**
   - Tài liệu chủ quản: [`docs/POST-SYNC-IMPLEMENTATION-GAP-MAP.md`](POST-SYNC-IMPLEMENTATION-GAP-MAP.md), [`docs/INCEPTION-GAP-REPORT.md`](INCEPTION-GAP-REPORT.md).
   - Thẩm quyền: Bảng đối chiếu thực tế phục vụ lộ trình nâng cấp kỹ thuật; không thay đổi hợp đồng cốt lõi.
7. **Lớp G: DERIVED VIEWS (Góc nhìn trực quan dẫn xuất):**
   - Tài liệu chủ quản: Toàn bộ các sơ đồ tại [`docs/diagrams/`](diagrams/).
   - Thẩm quyền: Biểu đồ KHÔNG BAO GIỜ là hợp đồng độc lập hoặc business source of truth. Mọi sơ đồ phải trích dẫn rõ nguồn chuẩn tắc (`SOURCE: docs/WORKFLOWS.md`...).

---

## 3. Quy tắc phân loại nhận định (Claim Classification)

Mọi nhận định trong bộ tài liệu kiến trúc NOVYX bắt buộc phải được dán nhãn rõ ràng:

- `[VERIFIED]`: Đã được chứng minh trực tiếp từ mã nguồn thực tế, hợp đồng hoặc cấu hình đang chạy ở commit baseline (`2f9a26b`).
- `[INFERRED]`: Được suy luận hợp lý từ cấu trúc hiện có nhưng chưa có hợp đồng kiểm chứng chính thức.
- `[PROPOSED]`: Thiết kế kiến trúc/nghiệp vụ đề xuất cho tương lai, đang chờ phê duyệt.
- `[GAP]`: Yêu cầu hoặc chức năng còn thiếu sót, chưa có chủ sở hữu hoặc chưa được định nghĩa.
- `[NEEDS_DECISION]`: Vấn đề có nhiều phương án kỹ thuật/nghiệp vụ, bắt buộc Product Owner / Tech Lead ra quyết định.
- `[OUT_OF_MVP]`: Chủ động loại khỏi phạm vi MVP để bảo toàn nguồn lực.
- `[PLANNED]`: Đã có trong lộ trình kiến trúc nhưng chưa thực hiện mã hóa.

---

## 4. Quy tắc thay đổi và Đóng băng mã nguồn (Change Governance)

Trong giai đoạn **Product & Domain Inception**:

- Mã nguồn ứng dụng (`apps/mobile/src/`, `packages/contracts/`, `packages/config/`, `packages/ui/`) là **READ-ONLY**.
- Tuyệt đối không refactor giao diện, không đổi tên biến/hàm, không di chuyển file, không cài package mới.
- Mọi khiếm khuyết trong mã nguồn được phát hiện phải được ghi nhận vào [`docs/INCEPTION-GAP-REPORT.md`](INCEPTION-GAP-REPORT.md).
- Giai đoạn chuyển giao mã nguồn (Implementation) chỉ được bắt đầu khi toàn bộ bộ tài liệu chuẩn tắc và biểu đồ đã được phê duyệt.
