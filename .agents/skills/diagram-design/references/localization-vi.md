# NOVYX Diagram Design — Vietnamese Typography & Layout Localization Guide

Tài liệu này là chuẩn mực kỹ thuật định nghĩa **HỆ THỐNG ĐỊNH DẠNG TRỰC QUAN TIẾNG VIỆT (Vietnamese-First Typography & Layout System)** cho toàn bộ biểu đồ kiến trúc, luồng vận hành và máy trạng thái trong dự án NOVYX GreenOps.

Tài liệu này mở rộng bộ kỹ năng upstream [`diagram-design`](../SKILL.md) (nguồn: `cathrynlavery/diagram-design` commit `8585047d16a7973f1c1a126e3eea3c38027e52d0`) nhằm giải quyết dứt điểm các khiếm khuyết hiển thị chữ tiếng Việt phức hợp trên đồ họa vector SVG/HTML.

---

## 1. Bản đồ kiểu chữ chuyên biệt (Typography Role Mapping)

Tuyệt đối tuân thủ phân vai font chữ theo đúng chức năng ngữ nghĩa. Không dùng lẫn lộn font chữ trong cùng một cụm ngữ pháp tiếng Việt.

| Vai trò ngữ nghĩa | Font Family ưu tiên (Font Stack) | Cỡ chữ tối thiểu (Min Size) | Trọng số (Weight) | Trường hợp sử dụng chuẩn | Trường hợp NGHIÊM CẤM |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tiêu đề biểu đồ / Editorial Heading** | `'Noto Serif', 'Times New Roman', serif` | **18px - 24px** | 600, 700 | Tên biểu đồ, tiêu đề phân vùng (Bản đồ năng lực, Vòng đời nhiệm vụ). | Không dùng cho nhãn nút bấm, không dùng cho enum kỹ thuật. |
| **Nội dung node / Hành động / Diễn giải** | `'Noto Sans', 'Segoe UI', Arial, sans-serif` | **12px - 14px** | 400, 500, 600 | Văn bản trong node, mô tả bước thao tác, diễn giải luồng, ghi chú nghiệp vụ. | CẤM dùng font Monospace; CẤM co nhỏ chữ xuống 7px - 9px. |
| **Nhãn mũi tên / Nhãn điều hướng** | `'Noto Sans', 'Segoe UI', Arial, sans-serif` | **11px - 12px** | 500, 600 | Nhãn trên connector (ví dụ: `Quản lý duyệt`, `Báo sự cố`). | CẤM đặt nhãn đè lên đường kẻ hoặc đè lên mép viền của node. |
| **Định danh kỹ thuật (Technical IDs)** | `'Geist Mono', ui-monospace, monospace` | **11px - 12px** | 500 | Enum trạng thái, tên API, mã DTO: `WAITING_REVIEW`, `StartTask`, `POST /tasks`. | CẤM dùng cho câu văn tiếng Việt (ví dụ: cấm dùng cho `Yêu cầu làm lại`). |

---

## 2. Nạp Font tiếng Việt & Đồng bộ hóa thời gian đo (Font Loading & Timing)

Diagram suite dùng font bundle trong repository để kết quả không phụ thuộc mạng hoặc font cài sẵn trên máy:

```html
<link rel="stylesheet" href="assets/fonts/fonts.css">
```

Các file trong `historical/` dùng `../assets/fonts/fonts.css`. Font assets gồm Noto Sans 400–700, Noto Serif 600–700 và Geist Mono 500–600. Không xóa stylesheet này để đổi lấy “single-file” nếu chưa nhúng toàn bộ font data; fallback sang Times/Georgia đã được chứng minh làm sai kerning và vị trí dấu tiếng Việt.

Chi tiết lựa chọn font và phân tích lỗi được lưu tại [`../../../docs/diagrams/TYPOGRAPHY-RESEARCH-VI.md`](../../../docs/diagrams/TYPOGRAPHY-RESEARCH-VI.md).

### Quy tắc kiểm tra sẵn sàng trước khi đo hoặc xuất (Wait for Fonts Ready):
Trước khi thực hiện bất kỳ lệnh đo đạc kích thước (`getBBox()`, `measureText()`) hoặc chụp ảnh raster (`screenshot`, `print-to-pdf`):
```javascript
// BẮT BUỘC CHỜ FONT SẴN SÀNG
await document.fonts.ready;
```

---

## 3. Quy chuẩn giãn dòng chống va chạm dấu thanh (Diacritic-Safe Metrics)

Tiếng Việt là ngôn ngữ có dấu thanh kép (ví dụ: `ắ`, `ẵ`, `ấ`, `ệ`, `ộ`, `ự`). Nếu sử dụng khoảng cách dòng mặc định của tiếng Anh ($1.1 - 1.2$), các dấu mũ và dấu thanh sẽ bị cấn chạm vào dòng trên hoặc mép hộp.

### 3.1. Ràng buộc giãn dòng:
- Giãn dòng văn bản tiếng Việt trong SVG `<text>` bắt buộc sử dụng:
  $$\text{line-height} = 1.35 - 1.5\text{em} \quad (\text{Khuyến nghị: } \text{dy} = \text{"1.4em"})$$
- Đệm trên/dưới của hộp (Vertical Node Padding): Tối thiểu **10px - 14px** ở đỉnh và đáy để dấu thanh không bao giờ chạm đường viền.

### 3.2. Cấu trúc xuống dòng tĩnh lúc biên soạn (Authoring-Time Wrapping):
SVG không tự động ngắt dòng văn bản. Tuyệt đối **KHÔNG sử dụng `<foreignObject>`** làm giải pháp mặc định vì gây lỗi khi xuất sang SVG độc lập hoặc chèn vào PowerPoint/Figma.  
Bắt buộc dùng các thẻ `<tspan>` tĩnh với tọa độ `x` đồng nhất và khoảng bước `dy`:

```xml
<!-- MẪU CHUẨN TẮC CHO SVG TEXT NHIỀU DÒNG -->
<text x="120" y="85" text-anchor="middle" font-family="'Noto Sans', sans-serif" font-size="12" fill="#112116">
  <tspan x="120" dy="0">Xác thực hiện trường</tspan>
  <tspan x="120" dy="1.4em">Bằng chứng trước khi làm</tspan>
</text>
```

---

## 4. Nguyên lý kích thước node do nội dung quyết định (Content-Driven Node Sizing)

> **MẬT LỆNH BẮT BUỘC:**  
> **NỘI DUNG QUYẾT ĐỊNH KÍCH THƯỚC HỘP (CONTENT DEFINES NODE SIZE).**  
> Tuyệt đối không bao giờ ép văn bản tiếng Việt dài vào một khung kích thước cố định bằng cách co nhỏ font chữ xuống 7px - 9px hoặc để chữ tràn ra ngoài.

### Quy trình bố trí hình học thích ứng:
1. **Ước lượng / Đo đạc thực tế:** Dựa trên độ dài cụm từ tiếng Việt, tính toán số dòng cần thiết với font size chuẩn ($\ge 12\text{px}$).
2. **Mở rộng chiều cao node:** Nếu văn bản cần thêm 1 dòng, tăng chiều cao node ($H_{\text{mới}} = H_{\text{cũ}} + 18\text{px}$).
3. **Dịch chuyển các node phía dưới (Downstream Relayout):** Tịnh tiến tọa độ $Y$ của các node liên quan bên dưới để bảo toàn khoảng cách an toàn ($gap \ge 24\text{px}$).
4. **Định tuyến lại đường nối (Reroute Connectors):** Cập nhật tọa độ điểm xuất phát và điểm đích của các mũi tên; cập nhật vị trí nhãn connector.

---

## 5. Mật độ từ vựng tinh gọn (Vietnamese Copy Density Policy)

Trong biểu đồ, từ vựng tiếng Việt cần được chắt lọc súc tích, phản ánh mô hình nghiệp vụ mà không mang tính chất diễn văn dài dòng:

| Khái niệm nghiệp vụ | Cụm từ rườm rà (TRÁNH) | Cụm từ tinh gọn chuẩn cho Diagram (KHUYẾN NGHỊ) | Kèm Technical ID |
| :--- | :--- | :--- | :--- |
| `WAITING_REVIEW` | Trạng thái Chờ Quản lý Thẩm định duyệt kết quả | Chờ duyệt | `WAITING_REVIEW` |
| `REWORK_REQUIRED` | Yêu cầu nhân viên thực hiện làm lại các mục sai | Cần làm lại | `REWORK_REQUIRED` |
| `BLOCKED` | Đang bị tạm dừng do có sự cố cản trở hiện trường | Tạm dừng sự cố | `BLOCKED` |
| `APPROVE_WITH_EXCEPTION` | Phê duyệt nghiệm thu có chấp thuận ngoại lệ | Duyệt có ngoại lệ | `APPROVE_WITH_EXCEPTION` |
| `SiteVerification` | Thực hiện quét mã QR và lấy tọa độ GPS | Xác thực hiện trường | QR + GPS |
| `CareHistory` | Lịch sử hồ sơ chăm sóc chính thức của cây | Lịch sử chăm sóc | `CareHistory` |

---

## 6. Tiêu chí kiểm chứng va chạm trực quan (Collision Validation Oracle)

Một biểu đồ chỉ được coi là đạt chất lượng khi vượt qua bài kiểm tra **KHÔNG VA CHẠM (Zero Visual Collision)**:

1. **Text vs Node Boundary:** Chữ cách mép viền node tối thiểu 8px; không có dấu thanh nào chạm viền.
2. **Text vs Text:** Khoảng cách giữa các khối chữ liền kề $\ge 6\text{px}$; không có chữ đè lên nhau.
3. **Text vs Connector:** Nhãn trên đường nối bắt buộc có mặt nạ nền (`rect` fill màu nền hoặc `paint-order: stroke fill`) để che đường kẻ bên dưới.
4. **Node vs Node:** Khoảng cách giữa hai hộp nội dung $\ge 20\text{px}$.
5. **Arrow Label vs Node:** Nhãn connector không được đè lên góc bo hoặc mép hộp của bất kỳ node nào.

---

## 7. Quy cách xuất bản đa định dạng (Export Formats Specification)

Biểu đồ NOVYX hỗ trợ 4 định dạng xuất bản chính thức:

| Định dạng | Công cụ tạo | Mục đích sử dụng | Lưu ý kỹ thuật |
| :--- | :--- | :--- | :--- |
| **HTML** | File gốc (`docs/diagrams/*.html`) | Xem tương tác trên trình duyệt, nhúng CSS/SVG. | Tự chứa (Self-contained), responsive wrapper, viewBox cố định. |
| **SVG** | `scripts/diagram_tool.py` | Chèn vào tài liệu Markdown, Figma, Illustrator. | Chuẩn hóa màu: đổi `rgba(...)` thành `#hex` + `opacity` để tương thích PowerPoint. |
| **PNG (@2x / @3x)** | Headless Edge/Chrome | Chia sẻ báo cáo, nhúng slide, xem trên điện thoại. | Chờ `document.fonts.ready`, chụp ảnh đúng kích thước SVG bounding box. |
| **PDF** | Headless Edge/Chrome | Hồ sơ in ấn, bàn giao các bên liên quan. | Hỗ trợ 2 chế độ: **Diagram-only** (khổ vừa biểu đồ) và **Full-page** (kèm header/source). |
