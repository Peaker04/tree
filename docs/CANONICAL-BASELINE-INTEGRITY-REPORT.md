# BÁO CÁO TOÀN VẸN ĐƯỜNG CƠ SỞ CHUẨN TẮC (CANONICAL BASELINE INTEGRITY REPORT)

## NOVYX GreenOps — Documentation, Traceability, Governance & Diagram Reconciliation

> **Phân loại báo cáo:** `[VERIFIED]` / `[PROPOSED]` / `[NEEDS_DECISION]`  
> **Giai đoạn:** CANONICAL BASELINE INTEGRITY REPAIR  
> **Trạng thái kết thúc:** `READY FOR TECHNICAL ARCHITECTURE BASELINE RECONCILIATION`

---

## 1. Kiểm toán Commit Gốc (Baseline Commit Audited)

- **Repository:** `https://github.com/Peaker04/tree`
- **Branch làm việc:** `base-setup`
- **Baseline SHA thẩm tra:** `facfedf9bcf2c28e98654fe2684976fbc9fac392`
- **Tình trạng Working Tree:** Toàn bộ mã nguồn ứng dụng (`apps/mobile/src/**`) và hợp đồng dữ liệu (`packages/**/src/**`) được bảo toàn tuyệt đối **0 tệp sửa đổi**. Các thay đổi chỉ tập trung tại `docs/**`, `DESIGN.md`, `.agents/skills/diagram-design/**`, và `scripts/diagram_tool.py`.

---

## 2. Hệ Thống Thẩm Quyền Tài Liệu (Canonical Source Hierarchy)

Để loại bỏ hoàn toàn nhận định mơ hồ "mọi file docs/*.md đều là canonical truth", hệ thống phân cấp thẩm quyền 7 tầng đã được thiết lập chính thức tại [`docs/README.md`](file:///d:/ki7/EXE/tree/docs/README.md):

```
TẦNG A: CANONICAL BUSINESS TARGET CONTRACT
  (PRODUCT.md, DOMAIN.md, WORKFLOWS.md, ACCESS-CONTROL.md, REQUIREMENTS-TRACEABILITY.md target specs)
        ▼
TẦNG B: TECHNICAL TARGET / ARCHITECTURE [PROPOSED / NEEDS_DECISION]
  (ARCHITECTURE.md, NFR.md)
        ▼
TẦNG C: CURRENT IMPLEMENTATION TRUTH [AS-IS]
  (Actual source code apps/mobile/src/**, @novyx/contracts, config)
        ▼
TẦNG D: DESIGN GOVERNANCE
  (DESIGN.md, MOBILE_UI_RULES.md - Quản lý presentation/UX/tokens, không sở hữu state transition)
        ▼
TẦNG E: DECISION EVIDENCE / HISTORY
  (BUSINESS-PROCESS-REVIEW.md, audit notes)
        ▼
TẦNG F: PLANNING / GAP / MIGRATION
  (POST-SYNC-IMPLEMENTATION-GAP-MAP.md, INCEPTION-GAP-REPORT.md)
        ▼
TẦNG G: DERIVED VIEWS
  (docs/diagrams/** - Biểu đồ trực quan dẫn xuất, trích dẫn nguồn Tầng A, không bao giờ là Canonical Contract)
```

---

## 3. Các Xung Đột Được Phát Hiện (Conflicts Found)

1. **Xung đột Chuỗi Bằng Chứng Cứng Nhắc trong Design System:**
   `DESIGN.md` và `MOBILE_UI_RULES.md` vẫn quy định chuỗi 5 bước tuần tự phổ quát ("GPS → QR → BEFORE → CHECKLIST → AFTER", "5-step proof chain", "5 proof gates", quản lý nghiệm thu 5/5 proof), mâu thuẫn trực tiếp với Mô hình 3 Hồ sơ Bằng chứng Ngữ nghĩa (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`) của `WORKFLOWS.md`.
2. **Tuyên Bố Sai Lệch về Mã Nguồn trong Gap Map cũ:**
   - Khai báo sai rằng `buildCareHistory` chỉ lọc `COMPLETED` (thực tế code lọc cả `WAITING_REVIEW`).
   - Khai báo sai rằng Quản lý nhập chuỗi tự do `TaskType` (thực tế code có mảng chọn cố định `TASK_TYPE_OPTIONS`).
   - Khai báo sai rằng mở màn hình Detail tự động kích hoạt `StartTask` (thực tế mở detail chỉ đổi UI step sang `'DETAIL'`).
   - Khai báo sai rằng 25m là ngưỡng GPS thứ hai (thực tế 25m là chỉ số đo chất lượng thiết bị `locationAccuracyMeters <= 25`, còn 10m là ngưỡng check-in).
   - Khai báo sai rằng Rework xóa trắng toàn bộ bằng chứng (thực tế `getNextProofStep()` đã giữ lại bằng chứng và chỉ yêu cầu bổ sung bước thiếu).
   - Khai báo sai về Offline (mô hình hiện tại chỉ là fallback biến RAM `snapshot`, không phải hàng đợi bền vững).
3. **Hiện Tượng Hai "Sự Thật" trong Hệ Thống Biểu Đồ (Diagram Authority Conflict):**
   Tồn tại đồng thời nhóm biểu đồ cũ (`01` đến `12`) vẫn mang nhãn "Canonical Contract" dù thể hiện quy trình 5 chốt cũ, đối đầu với nhóm biểu đồ mới (`proposed-01` đến `proposed-04`).
4. **Tuyên Bố Vượt Quá Thẩm Quyền (Business & Architecture Overclaims):**
   Sử dụng các thuật ngữ chưa có căn cứ kỹ thuật/pháp lý như "tamper-evident", "không thể chối bỏ", "giá trị pháp lý", "forensic-grade", giả định nhà cung cấp lưu trữ đám mây "S3 / GCS / storage.novyx.vn", hoặc xem Clean Architecture / Ports & Adapters là quyết định đã khóa dù chưa có ADR phê duyệt.
5. **Kỷ Luật Chỉ Tiêu Phi Chức Năng (NFR Over-specification):**
   Biến các tham số ước lượng kỹ thuật (200-1000 items, RAM 3-4GB, dropped frames <5%, FlatList windowSize <=5) thành ràng buộc nghiệp vụ bắt buộc khi chưa qua đo đạc thực tế.
6. **Công Cụ Biểu Đồ (Diagram Tooling) Thiếu Năng Lực Kiểm Tra Hình Học Thực:**
   `scripts/diagram_tool.py` trước đây dùng regex tĩnh để kiểm tra typography mà không đo đạc va chạm hình học DOM thực tế trong trình duyệt headless, không hỗ trợ xuất ảnh PNG diagram-only chuẩn kích thước hay xuất PDF diagram-only 0-margin.

---

## 4. Các Xung Đột Đã Được Khắc Phục (Conflicts Repaired)

- [x] **Chuẩn hóa DESIGN.md & MOBILE_UI_RULES.md:**
      Loại bỏ hoàn toàn quy tắc cứng ép chuỗi 5 bước. Xác lập rõ ràng: UI chỉ hiển thị các yêu cầu bằng chứng do domain/application layer cung cấp theo `ProofProfile`. Site Verification gồm QR và GPS độc lập về thứ tự thực hiện. Cập nhật 4 kết luận thẩm định (`APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL`).
- [x] **Xóa bỏ các Tuyên Bố Quá Mức (Overclaims):**
  - Tại `PRODUCT.md` và `WORKFLOWS.md`: Thay "Tamper-evident Proof Chain" bằng "Evidence-backed Field Verification Trail"; gắn nhãn rõ ràng `LEGAL STATUS: NOT ESTABLISHED / OUTSIDE CURRENT MVP CLAIMS`.
  - Tại `ARCHITECTURE.md`: Đưa Clean Architecture / Ports & Adapters về trạng thái `[PROPOSED TARGET ARCHITECTURE]` chờ phê duyệt ADR; chuyển Object Storage về `[NEEDS_DECISION]` (TBD).
- [x] **Tái Cấu Trúc Bảng Chỉ Tiêu NFR.md:**
      Phân tách rành mạch thành 4 cột: Thuộc tính chất lượng (Quality Attribute), Mục tiêu đo lường & Phân loại (`[APPROVED REQUIREMENT]`, `[TARGET SLO]`, `[PROPOSED BENCHMARK]`, `[NEEDS_MEASUREMENT]`, `[NEEDS_DECISION]`), Tùy chọn hiện thực tham chiếu (Reference Implementation Option), và Phương pháp kiểm chứng (Verification Method).
- [x] **Hóa Giải Xung Đột Biểu Đồ (Diagram Authority Reconciliation):**
  - Tại `docs/diagrams/README.md`: Phân định danh mục thành 2 nhóm rõ ràng: **Active Derived Views** (Dẫn xuất chuẩn tắc từ Markdown Tầng A) và **Superseded / Historical Diagrams** (Biểu đồ lịch sử đã hết hiệu lực).
  - Bổ sung banner cảnh báo đỏ nổi bật `[SUPERSEDED / HISTORICAL — KHÔNG DÙNG LÀM CHUẨN THIẾT KẾ]` vào trực tiếp các file HTML `03`, `04`, `05`, `06`, và `11`.
  - Gắn nhãn `DERIVED VIEW — CANONICAL BUSINESS BASELINE` và trích dẫn nguồn canonical (`SOURCE: docs/WORKFLOWS.md`, v.v.) vào toàn bộ biểu đồ active.
  - Sửa lỗi hình học SVG lồng khối trong `proposed-01-current-vs-recommended-workflow.html` (đóng gói từng thẻ hộp vào nhóm tịnh tiến `<g transform="translate(...)">` riêng biệt).
- [x] **Thiết Lập NOVYX Local Visual Profile (Seed + Linear):**
      Tích hợp bảng ánh xạ semantic tokens vào `.agents/skills/diagram-design/references/style-guide.md` khớp 100% với mã màu của `DESIGN.md` (`snowWhite` `#fcfcf7`, `warmStone` `#eeeee9`, `card` `#fffffb`, `forestDepths` `#1c3a13`, `limePulse` `#d3fa99`, `ink` `#13231a`, `pewter` `#64748b`, `hairlineBorder` `#e6ede3`).

---

## 5. Hiệu Đính Factual Claims Khớp Mã Nguồn Thực Tế (Source Corrections)

Tại tài liệu [`docs/POST-SYNC-IMPLEMENTATION-GAP-MAP.md`](file:///d:/ki7/EXE/tree/docs/POST-SYNC-IMPLEMENTATION-GAP-MAP.md):

| Hạng mục              | Khai báo cũ (SAI)                                         | Hiện trạng mã nguồn thực tế (ĐÃ HIỆU ĐÍNH)                                                                                                                              | Khoảng cách thực tế cần làm (GAP)                                                                               |
| :-------------------- | :-------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **CareHistory**       | Ghi rằng chỉ lọc `COMPLETED`.                             | `buildCareHistory` trong `greenOpsService.ts` (dòng 318) lọc: `status === 'COMPLETED' \|\| status === 'WAITING_REVIEW'`.                                                | Cần thu hẹp chỉ lấy `COMPLETED`; bổ sung metadata `exceptionReason` cho `APPROVE_WITH_EXCEPTION`.               |
| **ManagerCreateTask** | Ghi rằng quản lý gõ tự do `TaskType`.                     | Client có mảng chọn cố định `TASK_TYPE_OPTIONS` (`PRUNING`, `WATERING`, `FERTILIZING`, `PEST_CONTROL`, `INSPECTION`).                                                   | Thiếu hợp đồng ràng buộc `TaskType -> ProofProfile` có thẩm quyền từ server; client đang tự suy diễn checklist. |
| **StartTask**         | Ghi rằng mở màn hình Detail tự động chuyển `IN_PROGRESS`. | Mở task detail chỉ cập nhật `activeTask` và set step thành `'DETAIL'`, không chuyển trạng thái. Trạng thái chỉ đổi khi bấm "Bắt đầu tác nghiệp" hoặc gọi `checkInTask`. | Thiếu lệnh `StartTask` tường minh ở mức API/Domain sở hữu chuyển dịch `PENDING -> IN_PROGRESS`.                 |
| **GPS**               | Coi 25m là ngưỡng xác thực vị trí thứ hai.                | `distanceToTreeMeters <= 10` là ngưỡng check-in; `locationAccuracyMeters <= 25` là cờ chất lượng tín hiệu thiết bị.                                                     | Cần tách bạch `GPS Distance Gate` (10m) và `GPS Device Quality Flag` (<=25m) kèm cờ `LOCATION_EXCEPTION`.       |
| **Rework**            | Ghi rằng xóa trắng toàn bộ dữ liệu làm lại từ đầu.        | `getNextProofStep()` giữ lại bằng chứng cũ và bỏ qua các bước đã hoàn thành.                                                                                            | Thiếu phân vùng `targetedArea`, thiếu phiên bản `attempt 1..N`, thiếu nhật ký bảo toàn lịch sử bất biến.        |
| **Offline**           | Nhầm lẫn giữa fallback RAM và outbox.                     | Ứng dụng chỉ lưu tạm trong biến RAM `snapshot` khi mất mạng; tắt app là mất toàn bộ dữ liệu chưa sync.                                                                  | Cần triển khai lưu trữ cục bộ bền vững (SQLite/WatermelonDB/MMKV) và Hàng đợi Outbox đồng bộ tin cậy.           |

---

## 6. Hiệu Đính Ma Trận Yêu Cầu (Requirements Traceability Corrections)

Tại [`docs/REQUIREMENTS-TRACEABILITY.md`](file:///d:/ki7/EXE/tree/docs/REQUIREMENTS-TRACEABILITY.md), đã bổ sung định nghĩa chính thức cho `[PARTIALLY_IMPLEMENTED]` và hạ cấp các trạng thái "fake PASS":

- **`BR-04` (Quy định 3 Hồ sơ Bằng chứng Ngữ nghĩa):**
  Chuyển từ `[CURRENTLY_IMPLEMENTED]` sang `[PARTIALLY_IMPLEMENTED]`.
  _Lý do:_ Ứng dụng hiện tại chỉ chạy 1 chuỗi 5 bước cào bằng cố định, chưa có kiến trúc `ProofProfile` phân hóa theo nhiệm vụ.
- **`BR-06` (Nộp Bằng chứng & Ngoại tuyến):**
  Chuyển sang `[PARTIALLY_IMPLEMENTED]`.
  _Lý do:_ Đã có API submit mạng nhưng cơ chế offline chỉ là biến RAM tạm thời, chưa có hàng đợi Outbox bền vững.
- **`BR-08` (Làm lại có trọng tâm - Targeted Rework):**
  Chuyển sang `[PARTIALLY_IMPLEMENTED]`.
  _Lý do:_ Đã có chuỗi lý do và giữ lại proof cũ, nhưng chưa có cấu trúc `targetedArea`, chưa có đa phiên bản `attempt 1..N`.
- **`BR-11` & `BR-12` (Cơ chế Ngoại lệ & Lối thoát Tắc nghẽn):**
  Chuyển sang `[PARTIALLY_IMPLEMENTED]`.
  _Lý do:_ Client đã có giao diện báo sự cố nhưng chưa tích hợp trạng thái `BLOCKED` và 3 lối thoát tất định vào vòng đời nghiệp vụ chuẩn.

---

## 7. Cải Tiến & Kiểm Chứng Công Cụ Biểu Đồ (Diagram Tooling Verification)

File [`scripts/diagram_tool.py`](file:///d:/ki7/EXE/tree/scripts/diagram_tool.py) đã được nâng cấp toàn diện:

1. **Thuật toán Kiểm Tra Hình Học Thực Tế (Runtime Browser Geometry Validation):**
   - Tiêm kịch bản kiểm tra vào DOM và chạy qua Microsoft Edge Headless (`msedge.exe`).
   - Bắt buộc chờ font hệ thống sẵn sàng: `await document.fonts.ready` (xác nhận trạng thái `loaded=True`, nạp đủ 82 font face Noto).
   - Đo đạc kích thước và tọa độ màn hình thực tế thông qua `getBoundingClientRect()`.
   - Kiểm tra va chạm Text vs Text (ngưỡng giao cắt $> 3\text{px} \times 3\text{px}$).
   - Kiểm tra tràn viền node (Text vs Owning Card boundary overflow).
   - Kiểm tra tràn khung nhìn SVG (Viewport clipping).
   - Kiểm tra chuẩn cỡ chữ Tiếng Việt (báo lỗi nếu font $< 10\text{px}$, cảnh báo nếu $< 11\text{px}$).
2. **Xuất Bản Đa Định Dạng (Multi-format Export):**
   - **Standalone SVG:** Trích xuất SVG sạch, nhúng `@import` Google Fonts an toàn với XML (`&amp;`), chuẩn hóa màu `rgba(...)` thành `#hex` + `opacity` chống lỗi đen hộp trên PowerPoint/Figma.
   - **Diagram-only PNG:** Đóng gói SVG vào khung HTML có margin 0, bắt đúng kích thước bounding box của biểu đồ (hỗ trợ scale thực `@2x` và `@3x`).
   - **Full-page PNG:** Chụp ảnh toàn bộ trang tài liệu kèm tiêu đề, huy hiệu, và mô tả.
   - **Diagram-only PDF:** Xuất PDF vector với `@page { size: Wpx Hpx; margin: 0; }` và cờ `--no-pdf-header-footer`, cho trang in vừa khít biểu đồ.
   - **Full-page PDF:** Xuất PDF toàn trang chuẩn tài liệu.

### Kết Quả Kiểm Chứng Thực Nghiệm:

```
[PASS] validate proposed-01: 51 texts, 13 nodes — Zero Collision, Zero Overflow, Zero Clipping.
[PASS] validate proposed-02: 59 texts, 21 nodes — Zero Collision, Zero Overflow, Zero Clipping.
[PASS] validate proposed-03: 43 texts, 19 nodes — Zero Collision, Zero Overflow, Zero Clipping.
[PASS] validate proposed-04: 44 texts, 12 nodes — Zero Collision, Zero Overflow, Zero Clipping.

[PASS] export smoke-test proposed-01:
  - SVG: proposed-01-current-vs-recommended-workflow.svg (14,605 bytes)
  - PNG diagram @2x: proposed-01-current-vs-recommended-workflow.png (262,317 bytes)
  - PNG diagram @3x: proposed-01-current-vs-recommended-workflow@3x.png (415,487 bytes)
  - PDF diagram: proposed-01-current-vs-recommended-workflow.pdf (292,443 bytes)
  - PNG full-page @2x: proposed-01-current-vs-recommended-workflow.full.png (349,998 bytes)
  - PDF full-page: proposed-01-current-vs-recommended-workflow.full.pdf (384,221 bytes)
```

---

## 8. Các Quyết Định Mở Cần Giải Quyết Tiếp Theo (Open Decisions)

### A. Quyết Định Kiến Trúc (Architecture - Cần ADR):

- **ADR-ARCH-01:** Phê duyệt cấu trúc thư mục mục tiêu (Clean Architecture / Ports & Adapters trong `apps/mobile/src/domain`, `application`, `infrastructure`).
- **ADR-ARCH-02:** Lựa chọn giải pháp lưu trữ dữ liệu bền vững Offline (SQLite thuần, WatermelonDB, hay OP-SQLite + MMKV).
- **ADR-ARCH-03:** Quyết định giải pháp lưu trữ Object Storage backend (MinIO tự host, S3, hay Google Cloud Storage).

### B. Quyết Định Chỉ Tiêu Phi Chức Năng (NFR - Cần Đo Đạc):

- **SLO-PERF-01:** Đo đạc FPS và memory footprint thực tế trên thiết bị Android RAM 3–4GB với danh sách 200–500 cây/nhiệm vụ.
- **SLO-SYNC-01:** Đo đạc độ trễ hàng đợi Outbox khi kết nối mạng chập chờn (2G/3G hiện trường).

---

## 9. Giới Hạn Phạm Vi Mã Nguồn (Source Boundary Verification)

- Số tệp sửa đổi trong `apps/mobile/src/**`: **0**
- Số tệp sửa đổi trong `packages/**/src/**`: **0**
- Ứng dụng runtime hoàn toàn không bị ảnh hưởng hành vi.

---

## 10. Điều Kiện Dừng (Stop Condition Evaluation)

| Tiêu chí dừng                                                         | Trạng thái | Ghi chú bằng chứng                                                                                    |
| :-------------------------------------------------------------------- | :--------: | :---------------------------------------------------------------------------------------------------- |
| Tài liệu chuẩn tắc nghiệp vụ không mâu thuẫn                          |  **ĐẠT**   | `PRODUCT`, `DOMAIN`, `WORKFLOWS`, `ACCESS-CONTROL` thống nhất mô hình 7 trạng thái & 3 ProofProfiles. |
| `DESIGN.md` & `MOBILE_UI_RULES.md` không còn quy tắc 5 bước cứng nhắc |  **ĐẠT**   | Đã chuyển dịch sang profile-driven rendering.                                                         |
| Phân cấp thẩm quyền không dùng wildcard sai                           |  **ĐẠT**   | Đã thiết lập mô hình thẩm quyền 7 tầng tại `docs/README.md`.                                          |
| Phân biệt rành mạch Source hiện tại vs Business Target                |  **ĐẠT**   | `POST-SYNC-IMPLEMENTATION-GAP-MAP.md` và `REQUIREMENTS-TRACEABILITY.md` phản ánh trung thực.          |
| Không còn nhầm lẫn biểu đồ cũ thành canonical truth                   |  **ĐẠT**   | Biểu đồ 03–11 đã gắn banner `SUPERSEDED / HISTORICAL`.                                                |
| Công cụ diagram thực hiện kiểm tra hình học thực tế                   |  **ĐẠT**   | Headless Edge runtime getBoundingClientRect() cho kết quả Zero Collision.                             |
| Không overclaim pháp lý / mật mã / cloud provider                     |  **ĐẠT**   | Đã gắn nhãn `LEGAL STATUS: NOT ESTABLISHED` và Object Storage `TBD`.                                  |
| Mã nguồn ứng dụng và packages nguyên vẹn (0 files modified)           |  **ĐẠT**   | `git status` chứng minh 0 tệp source bị thay đổi.                                                     |

**KẾT LUẬN CUỐI CÙNG:**

### `READY FOR TECHNICAL ARCHITECTURE BASELINE RECONCILIATION`

Repository đã đạt trạng thái đường cơ sở tin cậy, nhất quán và sẵn sàng bước vào giai đoạn tái điều hòa kiến trúc kỹ thuật.
