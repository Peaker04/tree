# Nghiên cứu kiểu chữ tiếng Việt cho Diagram Suite

## Vấn đề quan sát được

Ảnh audit cho thấy các tiêu đề như “Hồ sơ Bằng chứng…” bị giãn ký tự bất thường và dấu thanh không cân đối. Nguyên nhân không nằm ở UTF-8 mà ở **font fallback**:

- HTML khai báo `Noto Serif` và `Noto Sans` nhưng font không được cài trên máy.
- Google Fonts link trước đó đã bị loại để tránh remote dependency.
- Trình duyệt fallback sang `Times New Roman`/font hệ thống cho heading.
- Metrics của fallback khác Noto: độ rộng chữ, kerning, vị trí dấu và line box thay đổi sau layout/export.
- Validator cũ dùng `document.fonts.check()` theo tên family; API này có thể trả `true` dù trình duyệt có khả năng fallback, nên đã tạo false positive.

## Tiêu chí lựa chọn

Font dùng cho tiếng Việt trong diagram cần:

1. Có đầy đủ Latin Vietnamese precomposed và combining glyphs.
2. Dấu mũ, dấu râu và dấu thanh không chạm nhau ở weight 600–700.
3. Metrics ổn định giữa HTML, PNG và PDF.
4. Có đủ sans, serif và monospace roles.
5. Có giấy phép cho phép phân phối cùng repository.
6. Hoạt động offline, không phụ thuộc Google Fonts tại thời điểm render.

## Các lựa chọn đã đánh giá

| Font | Ưu điểm | Hạn chế | Quyết định |
|---|---|---|---|
| **Noto Sans + Noto Serif** | Phủ Unicode rộng; tiếng Việt tốt; sans/serif đồng bộ; OFL; ổn định trong Chromium/PDF | File font tương đối lớn | **Chọn** |
| Be Vietnam Pro | Thiết kế riêng cho tiếng Việt; hiện đại; nhiều weight | Không có serif companion chính thức; dễ làm mọi diagram mang cảm giác UI thay vì editorial document | Không chọn làm hệ chính |
| Source Sans/Source Serif | Chất lượng cao, metrics tốt | Cần thêm bộ mono riêng; không khớp guideline/project profile hiện tại | Lựa chọn dự phòng |
| Segoe UI + Georgia/Times | Có sẵn trên Windows | Không portable sang Linux/CI; Times gây lỗi thẩm mỹ đã quan sát | Chỉ fallback cuối |
| Roboto | Tiếng Việt tốt, quen thuộc | Không có editorial serif companion phù hợp bằng Noto Serif | Không chọn |

## Hệ font chuẩn

- Heading: `Noto Serif`, weight 600 hoặc 700.
- Body/node/action: `Noto Sans`, weight 400–600.
- Technical ID: `Geist Mono`, weight 500–600.
- Fallback cuối: `Segoe UI`, Arial, sans-serif hoặc Georgia, serif.

## Cách phân phối

Font được bundle tại:

```text
docs/diagrams/assets/fonts/
```

và khai báo trong:

```text
docs/diagrams/assets/fonts/fonts.css
```

Mọi current và historical HTML dùng relative stylesheet path. `font-display: block` được chọn cho tài liệu/export để tránh chụp fallback font trước khi font thật sẵn sàng.

## Acceptance

Validator chỉ PASS font khi:

- `document.fonts.ready` hoàn tất.
- `FontFaceSet` có Noto Sans và Noto Serif ở trạng thái `loaded`.
- Có ít nhất hai bundled font faces được đăng ký.
- Runtime geometry được đo sau khi font thật đã tải.

Không dùng riêng `document.fonts.check('12px "Noto Sans"')` làm bằng chứng vì nó không đủ để loại trừ fallback.
