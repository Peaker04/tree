# CỔNG KIỂM SOÁT CHẤT LƯỢNG BIỂU ĐỒ & HÌNH HỌC TRỰC QUAN

## Diagram Quality Checklist & Active Inventory Audit

> **Mục tiêu:** Thiết lập bộ tiêu chí nghiệm thu toàn diện cho biểu đồ kiến trúc, luồng vận hành và máy trạng thái trong NOVYX GreenOps. Ngăn chặn triệt để tình trạng biểu đồ cũ mâu thuẫn nghiệp vụ, chữ tràn viền, đè đường nối (connectors), font chữ không an toàn cho Tiếng Việt, hoặc validator báo PASS giả tạo.  
> **Tài liệu thẩm quyền:** [`.agents/skills/diagram-design/SKILL.md`](../../.agents/skills/diagram-design/SKILL.md), [`style-guide.md`](../../.agents/skills/diagram-design/references/style-guide.md), [`localization-vi.md`](../../.agents/skills/diagram-design/references/localization-vi.md), [`DESIGN.md`](../../DESIGN.md), [`scripts/diagram_tool.py`](../../scripts/diagram_tool.py).

---

## 1. Phần A — Tính Toàn Vẹn Ngữ Nghĩa (Semantic Integrity - DG-SEM)

| Mã ID          | Tiêu chí kiểm soát                 | Acceptance Oracle                                                                                                                | Phương pháp kiểm chứng                     | Bằng chứng yêu cầu |  Mức độ  | Khóa cổng? | Trạng thái hiện tại |
| :------------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- | :----------------- | :------: | :--------: | :-----------------: |
| **DG-SEM-001** | Phân Loại Rõ Ràng                  | Header hiển thị rõ: `DERIVED VIEW — CANONICAL BUSINESS BASELINE`, `PROPOSED ARCHITECTURE`, hoặc `HISTORICAL AS-IS`.              | Quét thẻ `.badge-*` trong HTML             | HTML DOM dump      | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-SEM-002** | Trích Dẫn Thẩm Quyền               | Có dòng `SOURCE: docs/<FILE>.md` chỉ định tài liệu Markdown Tầng A mà biểu đồ làm hình ảnh minh họa.                             | Quét thẻ `.source-ref` trong HTML          | HTML DOM dump      | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-SEM-003** | Không Tự Nhận Canonical            | Biểu đồ tuyệt đối không tự xưng là "Canonical Contract", không được tự ý phát minh thêm trạng thái ngoài Markdown.               | Đối soát nội dung văn bản và title         | File HTML          | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-SEM-004** | Biểu Đồ Active Không Chứa Lỗi Thời | Biểu đồ Active không chứa chuỗi 5 bước cào bằng, không thiếu `BLOCKED`/`CANCELLED`, không chứa duyệt nhị phân.                   | Grep chuỗi "5 bước", "5 chốt" trong active | `git grep` kết quả | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-SEM-005** | Khớp Vòng Đời 7 Trạng Thái         | Các trạng thái thể hiện (`PENDING`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_REVIEW`, `COMPLETED`, `BLOCKED`, `CANCELLED`) khớp 100%. | Soát xét node trạng thái và mũi tên        | `proposed-03.html` | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-SEM-006** | Nhận Diện Biểu Đồ Lịch Sử          | Biểu đồ cũ (`03`, `04`, `05`, `06`, `11`) có banner đỏ cảnh báo `[SUPERSEDED / HISTORICAL]` và trích dẫn file thay thế.          | Kiểm tra khối banner đầu trang             | File `03..11.html` | CRITICAL |  **YES**   |      `[PASS]`       |

---

## 2. Phần B — Kiểu Chữ Tiếng Việt (Vietnamese Typography - DG-TYP)

| Mã ID          | Tiêu chí kiểm soát                   | Acceptance Oracle                                                                                            | Phương pháp kiểm chứng                       | Bằng chứng yêu cầu          |  Mức độ  | Khóa cổng? | Trạng thái hiện tại |
| :------------- | :----------------------------------- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------- | :-------------------------- | :------: | :--------: | :-----------------: |
| **DG-TYP-001** | Khai Báo Ngôn Ngữ Tiếng Việt         | Thẻ gốc bắt buộc có thuộc tính `<html lang="vi">`.                                                           | Quét DOM thuộc tính `html`                   | HTML source                 | CRITICAL |  **YES**   |      `[PASS]`       |
| **DG-TYP-002** | Nạp Font Tiếng Việt Chuẩn            | Có link Google Fonts nạp đầy đủ `Noto Sans` và `Noto Serif` hỗ trợ `vietnamese` subset.                      | Kiểm tra thẻ `<link rel="stylesheet">`       | Header HTML                 | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-TYP-003** | Xác Thực Font Sẵn Sàng (VAL-003)     | `document.fonts.check('12px "Noto Sans"') === true` và `document.fonts.status === 'loaded'`.                 | Runtime check trong Headless Edge            | `validation_data.json`      | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-TYP-004** | Ngưỡng Cỡ Chữ Tối Thiểu (Font Floor) | Không có văn bản nội dung nào có `font-size < 10px` (nghiêm cấm font 7px–9px làm hỏng dấu thanh tiếng Việt). | Đo computedStyle `fontSize` của mọi `<text>` | Báo cáo fontFloorViolations | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-TYP-005** | Giãn Dòng Chống Chạm Dấu Thanh       | Văn bản nhiều dòng sử dụng `<tspan>` có khoảng bước `dy="1.35em"` đến `dy="1.5em"` (khuyến nghị `1.4em`).    | Regex quét thuộc tính `dy`                   | SVG markup                  |  MAJOR   |  **YES**   |      `[PASS]`       |
| **DG-TYP-006** | Cấm Thu Nhỏ Chữ Cứu Khung            | Tuyệt đối cấm co nhỏ font chữ xuống dưới 11px để nhồi nhét văn bản tiếng Việt dài vào khung cố định.         | Quét thuộc tính font-size                    | Báo cáo validator           | BLOCKER  |  **YES**   |      `[PASS]`       |

---

## 3. Phần C — Bố Trí Hình Học Theo Nội Dung (Content-Driven Sizing - DG-LAY)

| Mã ID          | Tiêu chí kiểm soát                    | Acceptance Oracle                                                                                                               | Phương pháp kiểm chứng                       | Bằng chứng yêu cầu            |  Mức độ  | Khóa cổng? | Trạng thái hiện tại |
| :------------- | :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------- | :---------------------------- | :------: | :--------: | :-----------------: |
| **DG-LAY-001** | Chiều Rộng Hộp Đủ Cho Nhãn            | Chiều rộng hộp thẻ (Card Width) $\ge \text{text.width} + 2 \times \text{safePaddingX}$ (tối thiểu $\ge 8\text{px}$ mỗi bên).    | Đo tọa độ hình học `getBoundingClientRect()` | Báo cáo boundaryOverflows     | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-LAY-002** | Chiều Cao Hộp Đủ Cho Nhãn             | Chiều cao hộp thẻ (Card Height) $\ge \text{text.height} + 2 \times \text{safePaddingY}$ (tối thiểu $\ge 6\text{px}$ trên/dưới). | Đo tọa độ hình học `getBoundingClientRect()` | Báo cáo boundaryOverflows     | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-LAY-003** | Không Dùng Pill Cố Định Ép Chữ        | Các huy hiệu (badges/pills) không dùng width cố định nhỏ hơn độ dài thực tế của cụm từ tiếng Việt.                              | Kiểm tra các rect bao bọc nhãn               | Báo cáo safePaddingViolations | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-LAY-004** | Nhận Diện Đúng Chủ Sở Hữu (VAL-004)   | Văn bản thuộc về hộp chứa nhỏ nhất (`tightest enclosing card`) hoặc có liên kết ngữ nghĩa rõ ràng.                              | Thuật toán diện tích card tối thiểu          | Báo cáo validator             | CRITICAL |  **YES**   |      `[PASS]`       |
| **DG-LAY-005** | Đệm An Toàn Bắt Buộc (Safe Padding)   | Khoảng cách từ mép chữ tới mép trong của hộp $\ge 4\text{px}$ (khuyến nghị $\ge 8\text{px}$); không dính sát viền.              | Đo khoảng cách `padRight`, `padLeft`         | Báo cáo safePaddingViolations | CRITICAL |  **YES**   |      `[PASS]`       |
| **DG-LAY-006** | Xuống Dòng Tự Động / Tĩnh Tương Thích | Văn bản dài được ngắt dòng thành nhiều `<tspan>`; không dùng `<foreignObject>` gây lỗi xuất bản độc lập.                        | Kiểm tra thẻ SVG markup                      | SVG source code               |  MAJOR   |  **YES**   |      `[PASS]`       |
| **DG-LAY-007** | Định Tuyến Lại Khi Đổi Kích Thước     | Khi hộp nội dung tăng chiều cao, các node phía dưới và đường nối (connectors) được tịnh tiến tương ứng.                         | Soát xét trực quan và tọa độ                 | Visual inspection             | CRITICAL |  **YES**   |      `[PASS]`       |

---

## 4. Phần D — Kiểm Tra Va Chạm Hình Học (Geometric Collision - DG-GEO)

| Mã ID          | Tiêu chí kiểm soát                  | Acceptance Oracle                                                                                                | Phương pháp kiểm chứng               | Bằng chứng yêu cầu         |  Mức độ  | Khóa cổng? | Trạng thái hiện tại |
| :------------- | :---------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :----------------------------------- | :------------------------- | :------: | :--------: | :-----------------: |
| **DG-GEO-001** | Va Chạm Chữ vs Chữ (VAL-006)        | Không có 2 phần tử `<text>` riêng biệt nào đè lên nhau với diện tích giao cắt $> 3\text{px} \times 3\text{px}$.  | Quét giao cắt bbox trong DOM         | Báo cáo textCollisions     | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-GEO-002** | Tràn Viền Hộp Sở Hữu (Overflow)     | Không có chữ nào vượt ra ngoài biên phải (`padRight < 0`) hoặc biên dưới (`padBottom < 0`) của hộp chứa.         | Đo tọa độ chữ vs hộp                 | Báo cáo boundaryOverflows  | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-GEO-003** | Chữ Đè Lên Hộp Không Phải Chủ       | Văn bản không được cắt ngang qua góc hoặc thân của hộp thẻ lân cận không liên quan.                              | Quét giao cắt text vs non-owner rect | Báo cáo geometry validator | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-GEO-004** | Nhãn Đè Lên Đường Nối               | Nhãn trên connector phải có mặt nạ nền (`rect` che hoặc khoảng đệm) để đường kẻ không cắt ngang mặt chữ.         | Soát xét DOM nhãn connector          | Báo cáo visual inspection  | CRITICAL |  **YES**   |      `[PASS]`       |
| **DG-GEO-005** | Chữ Đè Lên Đường Nối (Connectors)   | Không có đường nối nào đâm xuyên qua khối văn bản của một bước hoặc một mô tả.                                   | Quét tọa độ line/path vs text        | Báo cáo geometry validator | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-GEO-006** | Đường Nối Đâm Xuyên Node Thẻ        | Mũi tên kết thúc tại mép viền của thẻ; không đâm xuyên vào bên trong lòng thẻ gây rối mắt.                       | Soát xét tọa độ path điểm cuối       | Visual inspection          |  MAJOR   |  **YES**   |      `[PASS]`       |
| **DG-GEO-007** | Va Chạm Hộp vs Hộp (VAL-008)        | Không có 2 hộp thẻ ngang hàng nào đè lên nhau với diện tích giao cắt $> 4\text{px} \times 4\text{px}$.           | Quét giao cắt giữa các rect lá       | Báo cáo nodeCollisions     | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-GEO-008** | Tràn Khung Nhìn (Viewport Clipping) | Không có phần tử hình học hoặc chữ nào nằm ngoài phạm vi `viewBox` (tọa độ $< 0$ hoặc $> \text{width/height}$).  | Kiểm tra tọa độ vs viewBox           | Báo cáo clippingIssues     | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-GEO-009** | Ngoại Lệ Được Xác Lập (VAL-010)     | Các giao cắt có chủ đích (ví dụ: tab tiêu đề nằm đè lên mép trên của khung container) được tài liệu hóa rõ ràng. | Kiểm tra rule VAL-010 trong script   | `diagram_tool.py`          |  MAJOR   |  **YES**   |      `[PASS]`       |

---

## 5. Phần E — Quy Trình Soát Xét Thị Giác Thực Tế (Visual Inspection - DG-VIS)

> **Nguyên tắc:** _Validator chạy bằng code PASS là điều kiện cần nhưng CHƯA ĐỦ. Bắt buộc phải xuất ảnh PNG @2x và soi bằng mắt._

| Mã ID          | Tiêu chí soát xét trực quan         | Acceptance Oracle                                                                             | Phương pháp kiểm chứng          | Bằng chứng yêu cầu      |  Mức độ  | Khóa cổng? | Trạng thái hiện tại |
| :------------- | :---------------------------------- | :-------------------------------------------------------------------------------------------- | :------------------------------ | :---------------------- | :------: | :--------: | :-----------------: |
| **DG-VIS-001** | Không Mất Nét / Không Cắt Chữ       | Mọi chữ cái và dấu thanh tiếng Việt đều đọc rõ, không bị mép viền che khuất dù chỉ 1px.       | Mở file PNG @2x và soi cận cảnh | File `.png` xuất bản    | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-VIS-002** | Khoảng Đệm Cân Đối (Breathing Room) | Văn bản nằm giữa hộp với khoảng cách cân xứng; không có cảm giác "ngạt thở" hay dính sát mép. | Đánh giá bố cục thị giác        | File `.png` xuất bản    |  MAJOR   |  **YES**   |      `[PASS]`       |
| **DG-VIS-003** | Chiều Mũi Tên Rõ Ràng               | Các đầu mũi tên (`marker-end`) hiển thị sắc nét, chỉ đúng hướng luồng nghiệp vụ.              | Kiểm tra marker SVG trên ảnh    | File `.png` xuất bản    | CRITICAL |  **YES**   |      `[PASS]`       |
| **DG-VIS-004** | Phân Cấp Thị Giác Rõ Rệt            | Tiêu đề to nổi bật, nhãn bước rõ ràng, enum kỹ thuật dùng monospace, ghi chú màu muted.       | Soát xét độ tương phản thị giác | File `.png` xuất bản    | CRITICAL |  **YES**   |      `[PASS]`       |
| **DG-VIS-005** | Tương Phản Màu Đạt Chuẩn (WCAG AA)  | Màu chữ chính (`ink #112116`) trên nền (`paper #FBFBF9`) đạt độ tương phản $\ge 4.5:1$.       | Đo mã màu Hex                   | Bảng mã màu Seed/Linear | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-VIS-006** | Không Có Lỗi Render Fallback Font   | Không xuất hiện hiện tượng chữ to chữ nhỏ hoặc font lạ do hệ điều hành nạp thiếu font Noto.   | Soát xét kiểu dáng ký tự có dấu | File `.png` xuất bản    | CRITICAL |  **YES**   |      `[PASS]`       |

---

## 6. Phần F — Đường Ống Xuất Bản Đa Định Dạng (Export Pipeline - DG-EXP)

| Mã ID          | Tiêu chí xuất bản                     | Acceptance Oracle                                                                                            | Phương pháp kiểm chứng                | Bằng chứng yêu cầu         |  Mức độ  | Khóa cổng? | Trạng thái hiện tại |
| :------------- | :------------------------------------ | :----------------------------------------------------------------------------------------------------------- | :------------------------------------ | :------------------------- | :------: | :--------: | :-----------------: |
| **DG-EXP-001** | Standalone SVG Độc Lập                | File `.svg` mở trực tiếp trên trình duyệt hoặc nhúng vào PowerPoint không bị lỗi hộp đen `rgba`.             | Chạy xuất SVG và kiểm tra cú pháp     | File `.svg` xuất bản       | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-EXP-002** | Bảo Toàn Font Trong SVG               | Standalone SVG nhúng `@import` Google Fonts an toàn XML (`&amp;`) trong `<defs><style>`.                     | Kiểm tra nội dung `<style>` trong SVG | File `.svg` source         | CRITICAL |  **YES**   |      `[PASS]`       |
| **DG-EXP-003** | Diagram-only PNG Chuẩn Kích Thước     | File `.png` cắt đúng kích thước bounding box của SVG; không bị viền trắng thừa của trang HTML.               | Đo kích thước ảnh PNG xuất bản        | File `.png` (khớp viewBox) | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-EXP-004** | Full-page PNG Đủ Chiều Cao            | File `.full.png` chụp trọn vẹn tiêu đề, huy hiệu nguồn, phần mô tả và toàn bộ biểu đồ.                       | Soát xét chiều cao ảnh                | File `.full.png`           |  MAJOR   |  **YES**   |      `[PASS]`       |
| **DG-EXP-005** | Hỗ Trợ Độ Phân Giải Cao @2x           | Lệnh `--scale 2` sinh ảnh có mật độ điểm ảnh gấp đôi, sắc nét trên màn hình Retina/High-DPI.                 | Kiểm tra pixel dimensions             | File `.png` @2x            | CRITICAL |  **YES**   |      `[PASS]`       |
| **DG-EXP-006** | Hỗ Trợ Độ Phân Giải Cực Cao @3x       | Lệnh `--scale 3` sinh ảnh chuẩn in ấn chất lượng cao không bị vỡ hạt.                                        | Kiểm tra pixel dimensions             | File `@3x.png`             |  MAJOR   |  **YES**   |      `[PASS]`       |
| **DG-EXP-007** | Diagram-only PDF Vừa Trang (0-Margin) | File `.pdf` có kích thước trang `@page { size: Wpx Hpx; margin: 0; }` vừa khít biểu đồ; không header/footer. | Mở file PDF kiểm tra trang in         | File `.pdf` xuất bản       | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-EXP-008** | Full-page PDF Chuẩn Hồ Sơ             | File `.full.pdf` xuất dạng tài liệu khổ lớn kèm đầy đủ ngữ cảnh quản trị và nguồn dẫn xuất.                  | Mở file PDF kiểm tra trang in         | File `.full.pdf` xuất bản  |  MAJOR   |  **YES**   |      `[PASS]`       |
| **DG-EXP-009** | Bắt Buộc Chờ Font Sẵn Sàng            | Trình xuất bản bắt buộc đợi `document.fonts.ready` trước khi chụp ảnh hoặc in PDF.                           | Kiểm tra mã nguồn lệnh gọi browser    | `scripts/diagram_tool.py`  | BLOCKER  |  **YES**   |      `[PASS]`       |
| **DG-EXP-010** | File Xuất Ra Hợp Lệ & Không Rỗng      | Kích thước file SVG/PNG/PDF $> 10\text{KB}$; không bị hỏng cấu trúc (corrupted artifact).                    | Đo file size trên đĩa                 | `Get-ChildItem dist/`      | BLOCKER  |  **YES**   |      `[PASS]`       |

---

## 7. Phần G — Cổng Chất Lượng Dành Cho Chính Công Cụ Validator (VAL-001..014)

| Mã ID       | Tiêu chí công cụ                         | Acceptance Oracle                                                                                                                    | Bằng chứng kỹ thuật        | Trạng thái |
| :---------- | :--------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :------------------------- | :--------: |
| **VAL-001** | Bắt Buộc Môi Trường Headless Browser     | Nếu không tìm thấy `msedge.exe` hoặc `chrome.exe`, validator phải trả về `INCONCLUSIVE` (exit code 2); **TUYỆT ĐỐI KHÔNG BÁO PASS**. | `diagram_tool.py` dòng 415 |  `[PASS]`  |
| **VAL-002** | Bắt Buộc Chờ Font Hệ Thống               | Code tiêm vào DOM bắt buộc sử dụng `await document.fonts.ready`.                                                                     | `diagram_tool.py` dòng 123 |  `[PASS]`  |
| **VAL-003** | Kiểm Tra Trực Tiếp Font Noto             | Gọi hàm `document.fonts.check('12px "Noto Sans"')` và ghi nhận kết quả boolean.                                                      | `diagram_tool.py` dòng 136 |  `[PASS]`  |
| **VAL-004** | Nhận Diện Đúng Chủ Sở Hữu Nhỏ Nhất       | Tìm kiếm toàn bộ rect bao quanh chữ và chọn card có diện tích nhỏ nhất (`smallest enclosing card`).                                  | `diagram_tool.py` dòng 279 |  `[PASS]`  |
| **VAL-005** | Kiểm Tra Đệm An Toàn (Safe Padding)      | Báo vi phạm nếu khoảng cách mép chữ tới viền trong $< 4\text{px}$ ngay cả khi chưa tràn ra ngoài.                                    | `diagram_tool.py` dòng 298 |  `[PASS]`  |
| **VAL-006** | Đo Đạc Va Chạm Chữ vs Chữ Thực Tế        | Đo diện tích giao cắt dựa trên `getBoundingClientRect()` thực tế của engine trình duyệt.                                             | `diagram_tool.py` dòng 257 |  `[PASS]`  |
| **VAL-007** | Nhãn Connector vs Đường Nối              | Nhãn connector phải được bảo vệ bởi mặt nạ nền.                                                                                      | `localization-vi.md` mục 6 |  `[PASS]`  |
| **VAL-008** | Va Chạm Giữa Các Khối Thẻ (Node-to-Node) | Phát hiện 2 hộp thẻ ngang hàng đè lên nhau $> 4\text{px} \times 4\text{px}$.                                                         | `diagram_tool.py` dòng 217 |  `[PASS]`  |
| **VAL-009** | Phát Hiện Tràn ViewBox SVG               | Kiểm tra biên màn hình so với `viewBox` của SVG gốc.                                                                                 | `diagram_tool.py` dòng 235 |  `[PASS]`  |
| **VAL-010** | Tài Liệu Hóa Ngoại Lệ Hợp Lệ             | Bỏ qua các giao cắt có chủ đích (ví dụ: tab tiêu đề nằm đè lên mép container).                                                       | `diagram_tool.py` dòng 212 |  `[PASS]`  |
| **VAL-011** | Báo Cáo Sai Lệch Có Cấu Trúc Đầy Đủ      | Lỗi báo ra chứa đủ: element tag, nội dung chữ, id hộp chủ, tọa độ, và khoảng cách vi phạm.                                           | `diagram_tool.py` dòng 441 |  `[PASS]`  |
| **VAL-012** | Quy Tắc Tuyên Bố Zero Collision          | "Zero Collision" chỉ được thông báo khi 100% các cổng hình học bắt buộc đã thực sự chạy qua.                                         | `diagram_tool.py` dòng 459 |  `[PASS]`  |
| **VAL-013** | Hiển Thị Các Kiểm Tra Đã Chạy            | Báo cáo in rõ số lượng và danh sách các check gates đã thực thi.                                                                     | `diagram_tool.py` dòng 427 |  `[PASS]`  |
| **VAL-014** | Mã Thoát (Exit Code) Phản Ánh Trung Thực | Exit code `0` = PASS, `1` = FAIL, `2` = INCONCLUSIVE. Không bao giờ thoát 0 khi có lỗi.                                              | `diagram_tool.py` dòng 699 |  `[PASS]`  |

---

## 8. Phần H — Kiểm Toán Danh Mục Biểu Đồ Đang Hoạt Động (Active Diagram Inventory Audit)

Bảng đánh giá thực tế từng biểu đồ đang mang danh mục `Active Derived Views` sau pha sửa chữa hình học và ngữ nghĩa:

| Tên tệp biểu đồ                                                                                        | Nguồn thẩm quyền (`SOURCE`) | Ngữ nghĩa hợp lệ? (Semantic Freshness) | Kiểm tra hình học (Geometry) | Kiểu chữ (Typography) | Khả năng xuất bản (Export) | Soát xét thị giác (Visual) | Trạng thái cổng biểu đồ |
| :----------------------------------------------------------------------------------------------------- | :-------------------------- | :------------------------------------: | :--------------------------: | :-------------------: | :------------------------: | :------------------------: | :---------------------: |
| [`proposed-01`](../diagrams/proposed-01-current-vs-recommended-workflow.html)                          | `docs/WORKFLOWS.md`         |                `[PASS]`                |    `[PASS]` (0 collision)    |       `[PASS]`        |  `[PASS]` (Đủ định dạng)   |          `[PASS]`          |        **PASS**         |
| [`proposed-02`](../diagrams/proposed-02-mvp-operational-swimlane.html)                                 | `docs/WORKFLOWS.md`         |                `[PASS]`                |    `[PASS]` (0 collision)    |       `[PASS]`        |          `[PASS]`          |          `[PASS]`          |        **PASS**         |
| [`proposed-03`](../diagrams/proposed-03-minimal-task-lifecycle.html)                                   | `docs/WORKFLOWS.md`         |                `[PASS]`                |    `[PASS]` (0 collision)    |       `[PASS]`        |          `[PASS]`          |          `[PASS]`          |        **PASS**         |
| [`proposed-04`](../diagrams/proposed-04-proof-policy-and-rework.html)                                  | `docs/DOMAIN.md`            |                `[PASS]`                |    `[PASS]` (0 collision)    |       `[PASS]`        |          `[PASS]`          |          `[PASS]`          |        **PASS**         |
| [`01-product-capability-map.html`](../diagrams/01-product-capability-map.html)                         | `docs/PRODUCT.md`           |                `[PASS]`                |    `[PASS]` (0 collision)    |       `[PASS]`        |          `[PASS]`          |          `[PASS]`          |        **PASS**         |
| [`02-domain-context-map.html`](../diagrams/02-domain-context-map.html)                                 | `docs/DOMAIN.md`            |                `[PASS]`                |    `[PASS]` (0 collision)    |       `[PASS]`        |          `[PASS]`          |          `[PASS]`          |        **PASS**         |
| [`07-action-eligibility-security-matrix.html`](../diagrams/07-action-eligibility-security-matrix.html) | `docs/ACCESS-CONTROL.md`    |                `[PASS]`                |    `[PASS]` (0 collision)    |       `[PASS]`        |          `[PASS]`          |          `[PASS]`          |        **PASS**         |
| [`08-role-information-architecture.html`](../diagrams/08-role-information-architecture.html)           | `DESIGN.md`                 |                `[PASS]`                |    `[PASS]` (0 collision)    |       `[PASS]`        |          `[PASS]`          |          `[PASS]`          |        **PASS**         |
| [`09-system-current-state.html`](../diagrams/09-system-current-state.html)                             | Baseline `2f9a26b` (AS-IS)  |       `[PASS]` (Đã ghi rõ As-Is)       |    `[PASS]` (0 collision)    |       `[PASS]`        |          `[PASS]`          |          `[PASS]`          |        **PASS**         |
| [`10-system-target-architecture.html`](../diagrams/10-system-target-architecture.html)                 | `docs/ARCHITECTURE.md`      |       `[PASS]` (Đã ghi Proposed)       |    `[PASS]` (0 collision)    |       `[PASS]`        |          `[PASS]`          |          `[PASS]`          |        **PASS**         |
| [`12-architecture-dependency-map.html`](../diagrams/12-architecture-dependency-map.html)               | `AGENTS.md`                 |                `[PASS]`                |    `[PASS]` (0 collision)    |       `[PASS]`        |          `[PASS]`          |          `[PASS]`          |        **PASS**         |

> [!NOTE]
> **KẾT LUẬN CỔNG BIỂU ĐỒ (OVERALL DIAGRAM GATE): `[PASS]`**
> 100% biểu đồ Active (11/11) đã đạt chuẩn toàn diện về Ngữ nghĩa nghiệp vụ chuẩn tắc, Hình học không va chạm (Zero Collision), Kiểu chữ Tiếng Việt an toàn ($\ge 11\text{px}$), Đường ống xuất bản đa định dạng, và Soát xét thị giác trực tiếp trên ảnh kết xuất PNG @2x.
