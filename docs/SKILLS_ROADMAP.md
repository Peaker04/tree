# Agent Skills Roadmap (Composable Architecture)

Lấy cảm hứng từ phương pháp cấu trúc rule của hệ sinh thái hiện đại (như bộ Matt Pocock Cursor Rules / Composable Skills), tài liệu này thiết lập lộ trình (roadmap) để tổ chức và sử dụng các skills mềm dẻo. Mục tiêu là triệt tiêu tình trạng **bloat context (phình bộ nhớ)** do ép (force) tất cả rules vào một phiên làm việc, dẫn đến việc repository cài rất nhiều skill nhưng chỉ 1-2 cái thực sự mang lại giá trị hoặc AI bỏ qua các rule quan trọng vì bị loãng.

Trong PI CLI, các skills tự động được index, nhưng Agent chỉ chủ động đọc (thông qua tool `read` hoặc cơ chế tương đương) khi được trigger đúng ngữ cảnh.

## 1. Nguyên lý vận hành linh hoạt (Contextual Lazy-loading)

- **Không Global Include:** Không nhồi nhét mã nguồn/quy tắc UX vào file `AGENTS.md`. `AGENTS.md` chỉ chứa rule cấm kỵ (boundary) và nguyên lý tối cao.
- **Componentized Skills:** Tách skills thành các tệp `.md` hoàn toàn biệt lập (đã có ở `.agents/skills/`). Yêu cầu tác vụ gì -> kích hoạt (gọi) skill đó.
- **Orthogonality (Trực giao):** Mỗi skill giải quyết duy nhất một bài toán. Ví dụ: Debug là Debug, UX là UX. Không mix 2 thứ vào 1 file chung.

## 2. Phân tách & Roadmap sử dụng

Các skill hiện có trong dự án được tổ chức theo cấu trúc sau để team (và Agent) dễ dàng map (ánh xạ) khi làm việc:

### Khối Kỷ luật & Chất lượng thuật toán (Quality & Discipline)
Dùng cho mọi file mã nguồn (Service, Config, API binding).

| Skill | Ngữ cảnh sử dụng (Khi nào cần gọi?) | Tác dụng cốt lõi đích thực |
|---|---|---|
| `karpathy-guidelines` | Fix logic cốt lõi, viết hàm utility, xử lý state lớn, refactor lại code rối. Hoặc user ra lệnh *"bám sát nguyên tắc karpathy"*. | Cấm over-engineering. Ép viết code flat (phẳng), dùng sẵn hàng stdlib thay vì thêm thư viện ngoài, làm thay đổi càng nhỏ càng tốt. |
| `diagnosing-bugs` | Truy tìm bugs dị, crash log, màn hình trắng, hoặc app chậm vô cớ. | Cấm Agent "sửa mò". Ép phân tích log -> tìm root cause -> vạch giả thuyết -> mới patch code. |
| `tdd` | Trọng điểm vào CI/CD, viết logic xử lý tiền nong, logic quy trình có tính chất an toàn cao (Security). | Đảo ngược quy trình: bắt Agent tư duy fail case trước rồi mới implement. |
| `improve` | Auditing (đánh giá code định kỳ), onboarding người mới. | Chỉ Read-only. Quét nợ kỹ thuật, vi phạm kiến trúc. Không viết code (Safe). |

### Khối Domain Mobile UI/UX (Frontend/Expo)
Chỉ sử dụng khi đụng vào Component, Style (Tokens), và Luồng Màn Hình ở `apps/mobile/`.

| Skill | Ngữ cảnh sử dụng (Khi nào cần gọi?) | Tác dụng cốt lõi đích thực |
|---|---|---|
| `mobile-ui-ux` | Tác vụ tạo màn hình mới, bám sát các rule cho đặc thù Mobile GreenOps. | Đưa ra nguyên lý chạm (touch target 44px), màu sắc, điều hướng bottom bar không đổi, accessibility cho nhân viên thao tác field ngoài trời. |
| `ui-ux-pro-max` | Giao task làm UI phức tạp, cần flow chuẩn mực, hoặc tham khảo template nội bộ. | Truy vấn database UI/UX cực mạnh chuyên sâu cho React Native/Expo thay vì dùng component web. |
| `taste-skill` | Clean lại UI do AI sinh ra (loại bỏ hiệu ứng rẻ tiền, viền gradient vô nghĩa...). | Định hình độ cao cấp (premium). Ép UI ngăn nắp, bento-grid, minimalism. |
| `diagram-design`| Khi cần vẽ flow người dùng (cấp Manager/Staff), kiến trúc luồng dữ liệu trước khi code. | Sinh mã sơ đồ Mermaid, Draw.io để review trước với PO. |

### Khối Điều phối & Tự động hoá Workflow (Orchestration)
Dành cho scale up mô hình dự án lớn (Sử dụng GSD workflow).

| Skill | Ngữ cảnh sử dụng (Khi nào cần gọi?) | Tác dụng cốt lõi đích thực |
|---|---|---|
| `gsd-core` (và hệ sinh thái con) | Khi triển khai Epic/Feature lớn, chia Phase quy mô từ 2 ngày đến 2 tuần. Lập plan tổng biên. | Động cơ Spec-Driven Development: phân tác vụ, uỷ quyền qua Subagent chạy song song, review chéo, record decision. Dùng qua các lệnh `/gsd:xyz`. |

## 3. Demo cách tư duy ghép Skill của Agent (PI Prompting)

Dựa trên roadmap này, bạn (User) điều phối sẽ rất nhàn.

**Thay vì ra lệnh:**
*"Làm cho tôi tính năng gửi ảnh chụp màn hình check-in."* -> Trạng thái cũ: Agent sẽ vơ vét hàng đống skill gây loạn trí và trả về code nặng nề.

**Chuyển sang ra lệnh rành mạch (Trigger đúng lúc):**
*"Tạo màn hình check-in chụp ảnh (`mobile-ui-ux`), đảm bảo giao diện đẹp, tối giản (`taste-skill`). Phần lưu file viết code ngắn gọn gọn thôi, đừng thêm thư viện (`karpathy-guidelines`)."*

-> Agent ngay lập tức chỉ `read` 3 file skill được tham chiếu mà bỏ qua toàn bộ module GSD, TDD vô ích. Tốc độ sinh mã gen cực nhanh và tập trung.

## 4. Hướng dẫn nâng cấp Roadmap (Quy tắc cho Team)

1. Khi thêm 1 Skill mới vào `.agents/skills/`, phải ghi rõ ràng `<description>` (1-2 câu trọng tâm) ở đầu file hoặc qua tệp Index.
2. Không import (đọc) chéo Skill lung tung nếu không giải quyết chung bài toán. (Ví dụ: Đang check data DTO thì tuyệt đối không tải `taste-skill`).
3. Khuyến khích xóa (uninstall) hoặc lưu trữ Archive vĩnh viễn các skill lặp tính năng để Roadmap luôn trong trạng thái tinh gọn.