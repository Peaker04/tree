# NOVYX GreenOps — Documentation Authority & Governance Index

Chào mừng đến với hệ thống tài liệu chuẩn tắc (Canonical Documentation) của **NOVYX GreenOps**.

Tài liệu này là điểm khởi đầu duy nhất (Single Source of Truth) định vị quyền sở hữu thông tin cho toàn bộ dự án. Dự án áp dụng mô hình quản trị tài liệu nghiêm ngặt được kế thừa từ thực tiễn tốt nhất: **Một câu hỏi — Đúng một chủ sở hữu tài liệu (One Question, One Owner)**.

---

## 1. Bản đồ thẩm quyền tài liệu (Authority Map)

Khi tìm kiếm câu trả lời cho bất kỳ khía cạnh nào của hệ thống, hãy tra cứu đúng tài liệu chủ quản dưới đây. Tuyệt đối không suy diễn quy tắc nghiệp vụ từ mã nguồn giao diện (JSX/TSX).

| Câu hỏi cần giải đáp                                               | Tài liệu chủ quản                                                               | Thẩm quyền & Nội dung chính                                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hệ thống giải quyết bài toán gì? Phạm vi MVP là gì?**            | [`docs/PRODUCT.md`](PRODUCT.md)                                                 | Vision, Problem Statement, Business Capabilities, MVP Walking Skeleton, Explicit Non-goals.                                                    |
| **Nghiệp vụ có ý nghĩa gì? Bounded Context & Invariants là gì?**   | [`docs/DOMAIN.md`](DOMAIN.md)                                                   | Core/Supporting/Generic Domains, Bounded Contexts, Ubiquitous Language, Invariants (DR-01..DR-09), Entity Lifecycles.                          |
| **Các quy trình nghiệp vụ chuyển trạng thái như thế nào?**         | [`docs/WORKFLOWS.md`](WORKFLOWS.md)                                             | Tách biệt 3 luồng: (1) Task Lifecycle, (2) Proof Acquisition, (3) Manager Review & Rework; Guards, Transition Tables, Handoffs.                |
| **Ai có quyền xem và làm gì? Điều kiện kích hoạt action là gì?**   | [`docs/ACCESS-CONTROL.md`](ACCESS-CONTROL.md)                                   | Actor Registry, Role–Responsibility–Handoff Matrix, Action Eligibility Matrix (Role + Scope + State + Preconditions).                          |
| **Hệ thống phần mềm được cấu trúc như thế nào (Hiện tại & Đích)?** | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)                                       | AS-IS vs TO-BE Architecture, Layered Clean/Ports-and-Adapters, Feature Ownership, greenOpsService Decomposition, Contract & Data Architecture. |
| **Hệ thống phải chịu tải, phục hồi và xử lý lỗi ra sao?**          | [`docs/NFR.md`](NFR.md)                                                         | Measurable Quality Attribute Scenarios (QAS), Error & Recovery Matrix, Offline Interruption & Resilience Model.                                |
| **Thiết kế trực quan, màu sắc, font chữ và UI rules là gì?**       | [`/DESIGN.md`](../DESIGN.md)<br>[`docs/MOBILE_UI_RULES.md`](MOBILE_UI_RULES.md) | Authoritative Visual Profile (Seed botanical identity + Linear structural discipline), Five-Action Nav, Mobile UX Rules.                       |
| **Yêu cầu nghiệp vụ truy vết ra code và kiểm chứng như thế nào?**  | [`docs/REQUIREMENTS-TRACEABILITY.md`](REQUIREMENTS-TRACEABILITY.md)             | Requirements Taxonomy (BR, FR, DR, AR, NFR...), Traceability Matrix, Feature Definition of Ready (DoR), Definition of Done (DoD).              |
| **Các khoảng trống, rủi ro và quyết định chưa chốt nằm ở đâu?**    | [`docs/INCEPTION-GAP-REPORT.md`](INCEPTION-GAP-REPORT.md)                       | Comprehensive Inception Gap Report, Open Decision Register (Options A/B/C), Re-evaluated Audit Findings.                                       |
| **Các sơ đồ kiến trúc và luồng nghiệp vụ trực quan ở đâu?**        | [`docs/diagrams/`](diagrams/)                                                   | Standalone Branded HTML/SVG Diagrams tuân thủ tiêu chuẩn `diagram-design` và palette NOVYX.                                                    |

---

## 2. Phân loại tài liệu và Quy tắc giá trị (Classification Hierarchy)

Để tránh tình trạng tài liệu cũ mâu thuẫn với thiết kế mới, mọi tài liệu trong repository được phân hạng theo trật tự ưu tiên:

1. **CANONICAL (Chuẩn tắc - Cấp 1):**
   - Các file nằm tại thư mục gốc `docs/*.md`, `/DESIGN.md`, và `@novyx/contracts`.
   - Đây là sự thật tuyệt đối về hợp đồng, nghiệp vụ và kiến trúc mục tiêu.
2. **REFERENCE (Tham chiếu - Cấp 2):**
   - Tài liệu bên ngoài được ghi nhận: `Peaker04/IPCManagement` (mô hình quản trị), `cathrynlavery/diagram-design` (công cụ biểu đồ), tài liệu chính thức `Expo SDK 57`.
   - Dùng để học hỏi kỷ luật và giải pháp kỹ thuật; không ghi đè quy tắc nghiệp vụ của NOVYX.
3. **PLANNING (Kế hoạch thực thi - Cấp 3):**
   - Các tài liệu trong `.planning/` hoặc kế hoạch nhiệm vụ ngắn hạn.
   - Thể hiện trạng thái triển khai, không thay đổi hợp đồng cốt lõi nếu chưa qua ADR.
4. **HISTORICAL / AUDIT (Lịch sử & Báo cáo kiểm toán - Cấp 4):**
   - Các file audit cũ như `docs/MOBILE_DESIGN_AUDIT.md`.
   - **Quy tắc vàng:** Một phát hiện kiểm toán cũ hoặc một đoạn mã UI lịch sử KHÔNG ĐƯỢC PHÉP ghi đè tài liệu chuẩn tắc. Mọi phát hiện audit phải được tái đánh giá dựa trên Domain Baseline.
5. **EVIDENCE (Bằng chứng thực thi):**
   - Kết quả test thực tế, profiling log, runtime trace, snapshot verify. Chỉ có bằng chứng thực mới được chứng nhận hoàn thành (DoD).

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
