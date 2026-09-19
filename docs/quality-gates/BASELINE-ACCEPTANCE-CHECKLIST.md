# CỔNG KIỂM TRA CHUẨN TẮC ĐƯỜNG CƠ SỞ NGHIỆP VỤ

## Canonical Baseline Acceptance Checklist (CAN-001 đến CAN-015)

> **Mục tiêu:** Đảm bảo toàn bộ hệ thống tài liệu chuẩn tắc không mâu thuẫn, quyền hạn rõ ràng, phân biệt rạch ròi giữa mục tiêu nghiệp vụ (Target Contract) và hiện trạng mã nguồn (Current Implementation), loại bỏ hoàn toàn các tuyên bố quá mức (overclaims).  
> **Áp dụng cho:** `docs/README.md`, `PRODUCT.md`, `DOMAIN.md`, `WORKFLOWS.md`, `ACCESS-CONTROL.md`, `DESIGN.md`, `MOBILE_UI_RULES.md`, và `docs/diagrams/README.md`.

---

## Bảng Ma Trận Cổng Chất Lượng Đường Cơ Sở

| Mã ID       | Hạng mục kiểm tra               | Acceptance Oracle                                                                                                                                                                          | Phương pháp kiểm chứng                            | Bằng chứng yêu cầu                 |  Mức độ  | Khóa cổng? | Trạng thái hiện tại |
| :---------- | :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------ | :--------------------------------- | :------: | :--------: | :-----------------: |
| **CAN-001** | Phân cấp Thẩm quyền Tài liệu    | `docs/README.md` định nghĩa đủ 7 tầng (A-G); không chứa phát biểu cào bằng "mọi docs/*.md đều là canonical".                                                                               | Đối soát tĩnh văn bản                             | `docs/README.md`                   | BLOCKER  |  **YES**   |      `[PASS]`       |
| **CAN-002** | Phân tách Target vs As-Is       | Không tài liệu nào mô tả tính năng chưa code như đã hoàn thành; không coi code hiện tại là chuẩn mục tiêu nếu vi phạm hợp đồng.                                                            | Đối soát chéo giữa `WORKFLOWS.md` và `GAP-MAP.md` | `POST-SYNC-GAP-MAP.md`             | BLOCKER  |  **YES**   |      `[PASS]`       |
| **CAN-003** | Thẩm quyền Biểu đồ dẫn xuất     | Biểu đồ mang phân loại `DERIVED VIEW`, trích dẫn `SOURCE: docs/...`, không định nghĩa luật nghiệp vụ ngoài Markdown.                                                                       | Kiểm tra metadata trong header HTML diagram       | `docs/diagrams/*.html`             | BLOCKER  |  **YES**   |      `[PASS]`       |
| **CAN-004** | Nhận diện Tài liệu Lịch sử      | Tài liệu/biểu đồ cũ (`03`, `04`, `05`, `06`, `11`) có banner `[SUPERSEDED / HISTORICAL]` và chỉ định tài liệu thay thế.                                                                    | Kiểm tra thẻ cảnh báo đầu file                    | `docs/diagrams/03..11`             |  MAJOR   |  **YES**   |      `[PASS]`       |
| **CAN-005** | Phân loại Kiến trúc Đề xuất     | Clean Architecture / Ports & Adapters trong `ARCHITECTURE.md` được ghi rõ `[PROPOSED TARGET]` chờ duyệt ADR.                                                                               | Kiểm tra nhãn trạng thái kiến trúc                | `docs/ARCHITECTURE.md`             | CRITICAL |  **YES**   |      `[PASS]`       |
| **CAN-006** | Quản lý Quyết định Mở           | Các mục chưa chốt mang nhãn `[NEEDS_DECISION]` hoặc `TBD`; không gán trạng thái hoàn tất giả tạo.                                                                                          | Grep nhãn trạng thái quyết định                   | `docs/ARCHITECTURE.md`, `NFR.md`   |  MAJOR   |  **YES**   |      `[PASS]`       |
| **CAN-007** | Loại bỏ Tuyên bố Quá mức        | Không còn các cụm từ "tamper-evident", "không thể làm giả", "giá trị pháp lý", "forensic-grade"; gắn disclaimer pháp lý.                                                                   | Tìm kiếm chuỗi văn bản toàn repo                  | `git grep` kết quả                 | BLOCKER  |  **YES**   |      `[PASS]`       |
| **CAN-008** | Phi phụ thuộc Cloud Provider    | Không gán cứng nhà cung cấp Object Storage là "S3" hay "GCS"; ghi nhận rõ `Object Storage Provider: TBD`.                                                                                  | Kiểm tra phần sơ đồ và bảng cấu hình              | `docs/ARCHITECTURE.md`             |  MAJOR   |  **YES**   |      `[PASS]`       |
| **CAN-009** | Giới hạn Thẩm quyền DESIGN.md   | `DESIGN.md` chỉ sở hữu presentation/UX/tokens; không định nghĩa state machine hoặc ép chuỗi 5 bước.                                                                                        | Soát xét mục 3 và 8 trong DESIGN.md               | `DESIGN.md`                        | BLOCKER  |  **YES**   |      `[PASS]`       |
| **CAN-010** | Giới hạn Thẩm quyền Mobile UI   | `MOBILE_UI_RULES.md` phản ánh đúng luồng hồ sơ thích ứng, độc lập QR/GPS; không tự ý tạo chuyển dịch trạng thái.                                                                           | Soát xét quy tắc điều hướng và proof              | `docs/MOBILE_UI_RULES.md`          | BLOCKER  |  **YES**   |      `[PASS]`       |
| **CAN-011** | Nhất quán 3 ProofProfiles       | Cả 7 tài liệu (PRODUCT, DOMAIN, WORKFLOWS, ACCESS-CONTROL, RTM, DESIGN, UI rules) thống nhất đúng 3 profiles.                                                                              | Soát xét ma trận hồ sơ bằng chứng                 | Bảng đối chiếu chéo                | BLOCKER  |  **YES**   |      `[PASS]`       |
| **CAN-012** | Nhất quán Vòng đời 7 Trạng thái | 7 trạng thái chuẩn tắc (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`) thống nhất 100%. Tuyệt đối không có trạng thái giả `ASSIGNED`. | Soát xét state machine diagram & docs             | `docs/WORKFLOWS.md`, `proposed-03` | BLOCKER  |  **YES**   |      `[PASS]`       |
| **CAN-013** | Quy tắc Chuẩn tắc CareHistory   | `CareHistory` chỉ được sinh ra từ nhiệm vụ `COMPLETED`; `APPROVE_WITH_EXCEPTION` ghi nhận thêm metadata ngoại lệ.                                                                          | Soát xét luồng hoàn tất và thẩm định              | `docs/DOMAIN.md`, `WORKFLOWS.md`   | CRITICAL |  **YES**   |      `[PASS]`       |
| **CAN-014** | Độc lập Tín hiệu Hiện trường    | Xác thực hiện trường gồm QR và GPS độc lập thứ tự; lệch GPS không chặn quét QR; hỏng QR có luồng phục hồi danh tính.                                                                       | Soát xét bảng ma trận xác thực hiện trường        | `docs/WORKFLOWS.md`                | BLOCKER  |  **YES**   |      `[PASS]`       |
| **CAN-015** | Nhất quán 4 Kết luận Thẩm định  | Thẩm định có đúng 4 kết quả: `APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL`; không duyệt nhị phân.                                                                        | Soát xét quy trình thẩm định                      | `docs/WORKFLOWS.md`, `proposed-04` | BLOCKER  |  **YES**   |      `[PASS]`       |

---

## Chi Tiết Kỹ Thuật Từng Mục Kiểm Tra

### CAN-001: Phân cấp Thẩm quyền Tài liệu

- **Requirement:** Hệ thống thẩm quyền tài liệu phải được thiết lập tường minh, triệt tiêu xung đột nguồn chân lý.
- **Authority / Source:** [`docs/README.md`](../README.md).
- **Acceptance Oracle:**
  1. `docs/README.md` định nghĩa chính thức mô hình 7 tầng từ Tầng A (Business Target Contract) đến Tầng G (Derived Views).
  2. Tuyệt đối không tồn tại câu: _"mọi docs/_.md đều là canonical truth"* hoặc tương đương.
- **Verification Method:** Đọc và đối soát cấu trúc tài liệu [`docs/README.md`](../README.md).
- **Required Evidence:** Nội dung mục `2. Hệ Thống Thẩm Quyền Tài Liệu 7 Tầng`.
- **Severity / Blocking:** `BLOCKER` / `YES`.
- **Execution Status:** `[PASS]`.

---

### CAN-003: Thẩm quyền Biểu đồ Dẫn xuất

- **Requirement:** Toàn bộ biểu đồ trực quan (Diagrams) phải được định danh là góc nhìn dẫn xuất, trích dẫn tài liệu Markdown nguồn và không bao giờ tự sở hữu luật nghiệp vụ.
- **Authority / Source:** [`docs/README.md`](../README.md) & [`docs/diagrams/README.md`](../diagrams/README.md).
- **Acceptance Oracle:**
  1. Header mọi biểu đồ active hiển thị huy hiệu: `DERIVED VIEW — CANONICAL BUSINESS BASELINE` (hoặc `PROPOSED TARGET ARCHITECTURE` cho sơ đồ kiến trúc đề xuất).
  2. Có dòng chú thích nguồn cụ thể: `SOURCE: docs/<FILE>.md` (hoặc commit AS-IS đối ứng).
  3. Không có biểu đồ active nào định nghĩa trạng thái hoặc luật rẽ nhánh mâu thuẫn với Markdown Tầng A.
- **Verification Method:** Quét DOM runtime của 100% file HTML trong `docs/diagrams/`.
- **Required Evidence:** Báo cáo trích xuất metadata từ `scripts/diagram_tool.py validate`.
- **Severity / Blocking:** `BLOCKER` / `YES`.
- **Execution Status:** `[PASS]`.
  _(Ghi chú: Đã bổ sung đầy đủ huy hiệu DERIVED VIEW và trích dẫn SOURCE chuẩn tắc cho 100% biểu đồ active: `01`, `02`, `07`, `08`, `09`, `10`, `12`, `proposed-01..04`)._

---

### CAN-007: Loại bỏ Tuyên bố Quá mức về Pháp lý & Bảo mật

- **Requirement:** Không sử dụng các từ ngữ hứa hẹn vượt quá năng lực kỹ thuật và pháp lý hiện tại của sản phẩm MVP.
- **Authority / Source:** [`docs/PRODUCT.md`](../PRODUCT.md) & [`docs/WORKFLOWS.md`](../WORKFLOWS.md).
- **Acceptance Oracle:**
  1. Không chứa: `tamper-evident`, `không thể làm giả`, `giá trị pháp lý`, `forensic-grade`, `không thể chối bỏ`.
  2. Bắt buộc có tuyên bố giới hạn: `LEGAL STATUS: NOT ESTABLISHED / OUTSIDE CURRENT MVP CLAIMS`.
- **Verification Method:** Chạy lệnh tìm kiếm chuỗi văn bản không phân biệt hoa thường (`grep -i`) trên toàn bộ thư mục `docs/`.
- **Required Evidence:** Log kết quả `git grep -i "tamper-evident" docs/` trả về rỗng (ngoại trừ các file báo cáo audit lịch sử).
- **Severity / Blocking:** `BLOCKER` / `YES`.
- **Execution Status:** `[PASS]`.

---

### CAN-009: Giới hạn Thẩm quyền của DESIGN.md

- **Requirement:** `DESIGN.md` chỉ quản lý cấu trúc hiển thị, layout, tokens, typography, khả năng tiếp cận ngoài trời; không định nghĩa máy trạng thái nghiệp vụ.
- **Authority / Source:** [`DESIGN.md`](../../DESIGN.md).
- **Acceptance Oracle:**
  1. Loại bỏ toàn bộ các quy tắc cứng: _"chuỗi 5 bước bắt buộc"_, _"5 chốt bảo vệ"_, _"GPS -> QR -> Before -> Checklist -> After"_.
  2. Quy định rõ: UI hiển thị động các bước bằng chứng do Domain Layer cung cấp dựa theo `ProofProfile`.
- **Verification Method:** Đọc mục 3, 5, 8 trong [`DESIGN.md`](../../DESIGN.md).
- **Required Evidence:** Khối cảnh báo `Workflow Integrity Rule` tại dòng 84 của `DESIGN.md`.
- **Severity / Blocking:** `BLOCKER` / `YES`.
- **Execution Status:** `[PASS]`.

---

### CAN-011: Tính Nhất Quán của 3 Hồ sơ Bằng chứng Ngữ nghĩa

- **Requirement:** Định nghĩa 3 Hồ sơ Bằng chứng (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`) phải thống nhất 100% trên mọi tài liệu.
- **Authority / Source:** [`docs/DOMAIN.md`](../DOMAIN.md) & [`docs/WORKFLOWS.md`](../WORKFLOWS.md).
- **Acceptance Oracle:**
  1. `CHANGE_PROOF`: Site Verification + Ảnh Trước + Checklist tác nghiệp + Ảnh Sau nghiệm thu.
  2. `SERVICE_PROOF`: Site Verification + Checklist định lượng + 01 Ảnh Hoàn thành.
  3. `INSPECTION_PROOF`: Site Verification + Bảng phát hiện cấu trúc (Findings) + Ảnh Hiện trạng.
  4. Cấm tùy tiện hạ cấp profile; gán cố định từ `TaskType`.
- **Verification Method:** Đối soát chéo giữa `PRODUCT.md`, `DOMAIN.md`, `WORKFLOWS.md`, `ACCESS-CONTROL.md`, `REQUIREMENTS-TRACEABILITY.md`, `DESIGN.md`, và `MOBILE_UI_RULES.md`.
- **Required Evidence:** Bảng so sánh ProofProfile trong `docs/WORKFLOWS.md` mục 2.
- **Severity / Blocking:** `BLOCKER` / `YES`.
- **Execution Status:** `[PASS]`.
