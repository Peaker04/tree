# Diagram Design Upstream Adoption Assessment

Upstream: <https://github.com/cathrynlavery/diagram-design>  
Pinned skill baseline: `8585047d16a7973f1c1a126e3eea3c38027e52d0`  
Local skill version: `2.6`

## Kết luận sau nghiệm thu

NOVYX hiện đã khai thác các phần upstream phù hợp trực tiếp với repository: profile, semantic/type routing, localization, accessibility metadata, runtime geometry validation, deterministic browser export, canonical governance và historical archive.

Không cố sử dụng các khả năng không có nhu cầu thực tế như animation, sketchy style, biểu đồ định lượng hoặc import Draw.io/Excalidraw/Mermaid. Đây là quyết định YAGNI, không phải khoảng trống chất lượng.

## Đã triển khai

### Project profile

- Marker dự án: `.diagram-design`
- Profile: `~/.diagram-design/profiles/novyx-greenops.md`
- Profile lấy toàn bộ schema hiện hành từ local `style-guide.md`, gồm token NOVYX và typography tiếng Việt.

### Typography và encoding

- UTF-8 cho toàn bộ HTML.
- Noto Serif cho heading.
- Noto Sans cho văn bản tiếng Việt.
- Geist Mono chỉ cho enum, command, path và technical ID.
- Không còn Instrument Serif hoặc blanket mono cho câu tiếng Việt.
- Diagram là self-contained; không phụ thuộc remote font request.

### Accessibility contract

Mọi diagram có accessible SVG metadata với:

- `role="img"`
- `<title>` đứng trước `<desc>`
- ID được prefix theo diagram
- `aria-labelledby="<title-id> <desc-id>"`

Kết quả upstream self-check: **17/17 PASS**.

### Content-driven layout

- Diagram nhiều chữ dùng HTML/CSS Grid/Flex và tự wrap.
- Các luồng 03, 04 và 05 không còn connector vẽ xuyên node.
- Nhánh BLOCKED, rework, cancel và review decisions được tách thành vùng độc lập.
- Arrow/action labels có cột riêng đủ rộng; không dùng button nổi đè lên đường nối.
- Hard-code chỉ giữ cho canonical enum, command, role và policy invariant; phần giải thích dùng tiếng Việt.

### Geometry validation

`scripts/diagram_tool.py` đã được mở rộng để kiểm tra cả hai chế độ:

1. SVG diagram truyền thống.
2. HTML/CSS Grid/Flex diagram có accessible metadata SVG.

HTML mode kiểm tra:

- Node overlap.
- Content overflow qua `scrollWidth/clientWidth` và `scrollHeight/clientHeight`.
- Viewport clipping.
- Font floor.

Kết quả runtime validation bằng Chrome/Edge: **17/17 VERIFIED PASS**.

Structured evidence:

```text
.tmp/diagram-validation-final.json
```

### Export pipeline

Current suite đã được xuất lại bằng tên canonical mới:

```text
docs/diagrams/exports/*.full.png
docs/diagrams/exports/*.full.pdf
```

- 10 current diagrams.
- PNG full-page @2x: `2800×2160`.
- PDF full-page.
- Export chờ `document.fonts.ready` và chạy validation trước khi ghi artifact.

SVG export không được tạo cho HTML/CSS diagrams vì SVG 1×1 chỉ là accessibility metadata, không phải visual canvas. Tạo SVG bằng cách bọc toàn bộ HTML trong `foreignObject` sẽ giảm khả năng tương thích và không mang thêm giá trị thực tế.

### Governance và lưu trữ

- Current diagrams nằm tại root `docs/diagrams/`.
- Historical diagrams nằm tại `docs/diagrams/historical/`.
- Không còn tên canonical dạng `proposed-*`.
- `README.md` sở hữu catalog, classification, quy trình update và lệnh render.
- Source links trong business reconciliation, quality gates và evidence index đã được đổi sang tên mới.

## Phần upstream chủ động không sử dụng

| Khả năng | Quyết định |
|---|---|
| Animation | Không dùng; lifecycle hiện hiểu rõ hơn ở dạng static. |
| Sketchy/hand-drawn | Không phù hợp tài liệu governance/architecture. |
| Chart định lượng | Không có dataset định lượng cần biểu diễn. |
| Draw.io/Mermaid/Excalidraw import | Không có source format đầu vào cần migrate. |
| SVG-only rendering cho mọi file | Không dùng cho diagram nhiều tiếng Việt vì fixed-coordinate text từng gây overlap và clipping. |
| Icon gallery | Chỉ thêm khi icon mang nghĩa, không dùng trang trí. |

## Acceptance commands

```bash
# Upstream accessibility/safety contract
for file in docs/diagrams/*.html docs/diagrams/historical/*.html; do
  python .agents/skills/diagram-design/scripts/self_check.py "$file"
done

# Runtime geometry and semantic validation
python scripts/diagram_tool.py validate \
  $(find docs/diagrams -name '*.html' -print) \
  --json-output .tmp/diagram-validation-final.json

# Current-suite PNG/PDF exports
python scripts/diagram_tool.py export docs/diagrams/*.html \
  --format png,pdf --mode full-page --scale 2 \
  --out-dir docs/diagrams/exports
```

## Definition of done

Một diagram chỉ được nghiệm thu khi:

1. Khớp canonical source và classification.
2. Upstream `self_check.py` PASS.
3. Runtime validator PASS, không phải vacuous pass trên metadata SVG.
4. Full-size PNG được mở kiểm tra trực quan.
5. Không overlap, clipping, overflow hoặc connector xuyên node.
6. Tiếng Việt rõ nghĩa; technical identifier chỉ được giữ tiếng Anh khi thuộc contract/code.
7. Export mang tên canonical hiện hành.
