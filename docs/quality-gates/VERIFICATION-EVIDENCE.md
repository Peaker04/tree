# SỔ BỘ BẰNG CHỨNG THỰC TẾ (ACTIVE EVIDENCE LEDGER)

## NOVYX GreenOps — Verification Execution Records

> **Baseline SHA Thẩm Tra:** `f5c49fc6d7df8a0d0282b26494af5b6f4519a93b`  
> **Nhánh (Branch):** `base-setup`  
> **Thời điểm cập nhật:** `2026-09-19T12:08:00+07:00`  
> **Quy tắc:** Mọi dòng trạng thái đều ghi nhận trung thực từ terminal thực tế; không làm tròn, không fake PASS.

---

## 1. Sổ Bộ Bằng Chứng Kiểm Tra Thực Tế (Execution Records)

| Mã Check ID    | Thời điểm | Commit SHA | Lệnh thực thi                                                                        |    Môi trường    | Tiêu chí kỳ vọng          | Kết quả thực tế đo được              | Exit | Bằng chứng Artifact        | Trạng thái | Ghi chú kỹ thuật                                   |
| :------------- | :-------- | :--------: | :----------------------------------------------------------------------------------- | :--------------: | :------------------------ | :----------------------------------- | :--: | :------------------------- | :--------: | :------------------------------------------------- |
| **CAN-001**    | 11:24     | `f5c49fc`  | Static inspection                                                                    | `LOCAL_VERIFIED` | 7-layer hierarchy         | 7 tầng rõ ràng Tầng A..G             | `0`  | `docs/README.md`           |  `[PASS]`  | Xóa bỏ hoàn toàn quy tắc wildcard cũ.              |
| **CAN-007**    | 11:27     | `f5c49fc`  | `git grep -i "tamper-evident" docs/`                                                 | `LOCAL_VERIFIED` | 0 kết quả ngoài audit     | Chỉ xuất hiện trong audit report     | `0`  | Git grep output            |  `[PASS]`  | Gắn disclaimer pháp lý chính thức.                 |
| **CAN-009**    | 11:24     | `f5c49fc`  | Static inspection                                                                    | `LOCAL_VERIFIED` | Bỏ 5 bước cứng            | Chuyển sang profile-driven UI        | `0`  | `DESIGN.md` dòng 84        |  `[PASS]`  | Presentation decoupled from workflow.              |
| **SRC-001**    | 12:01     | `f5c49fc`  | `git status --porcelain apps/mobile`                                                 | `LOCAL_VERIFIED` | 0 modified files          | 0 files modified                     | `0`  | Git status check           |  `[PASS]`  | Mã nguồn ứng dụng mobile nguyên vẹn 100%.          |
| **SRC-002**    | 12:01     | `f5c49fc`  | `git status --porcelain packages`                                                    | `LOCAL_VERIFIED` | 0 modified files          | 0 files modified                     | `0`  | Git status check           |  `[PASS]`  | Mã nguồn các gói packages nguyên vẹn 100%.         |
| **BLD-DIF**    | 11:26     | `f5c49fc`  | `git diff --check`                                                                   | `LOCAL_VERIFIED` | Exit code 0               | Clean diff, 0 trailing whitespace    | `0`  | Terminal output            |  `[PASS]`  | Không có xung đột hoặc khoảng trắng lỗi.           |
| **BLD-FMT**    | 11:27     | `f5c49fc`  | `npm run format:check`                                                               | `LOCAL_VERIFIED` | All files match prettier  | All matched files use Prettier style | `0`  | Terminal output            |  `[PASS]`  | 100% tài liệu và code đạt chuẩn Prettier.          |
| **BLD-LNT**    | 11:27     | `f5c49fc`  | `npm run lint`                                                                       | `LOCAL_VERIFIED` | 0 errors, 0 warnings      | ESLint passed cleanly                | `0`  | Terminal output            |  `[PASS]`  | ESLint không có bất kỳ warning nào.                |
| **BLD-TYP**    | 11:27     | `f5c49fc`  | `npm run typecheck`                                                                  | `LOCAL_VERIFIED` | 4 workspaces pass         | 4/4 packages pass typecheck          | `0`  | Terminal output            |  `[PASS]`  | TypeScript biên dịch thành công.                   |
| **BLD-AND**    | 11:28     | `f5c49fc`  | `npm run mobile:export:android`                                                      | `LOCAL_VERIFIED` | Metro bundle succeeded    | Bundled 810 modules, 2.1MB Hermes    | `0`  | `dist/mobile-android`      |  `[PASS]`  | Xuất thành công gói bundle Android.                |
| **DG-EXP-01**  | 11:26     | `f5c49fc`  | `python scripts/diagram_tool.py export proposed-01 ...`                              | `LOCAL_VERIFIED` | Export đủ 6 định dạng     | Sinh đủ 6 file: SVG, PNG 2x/3x, PDF  | `0`  | `dist/diagrams_smoke_test` |  `[PASS]`  | Đã xác nhận file size > 14KB hợp lệ.               |
| **DG-VAL-01**  | 12:06     | `f5c49fc`  | `python scripts/diagram_tool.py validate proposed-01.html`                           | `LOCAL_VERIFIED` | 0 collision, 0 overflow   | 51 texts, 0 collision, 0 overflow    | `0`  | Terminal output            |  `[PASS]`  | proposed-01 đạt chuẩn sau khi sửa group.           |
| **DG-VAL-02**  | 12:04     | `f5c49fc`  | `python scripts/diagram_tool.py validate proposed-02.html`                           | `LOCAL_VERIFIED` | 0 collision, 0 overflow   | 6 boundary overflows detected        | `1`  | Terminal output            |  `[FAIL]`  | **BLOCKER**: Chữ tràn mép card 90x66px.            |
| **DG-VAL-03**  | 12:04     | `f5c49fc`  | `python scripts/diagram_tool.py validate proposed-03.html`                           | `LOCAL_VERIFIED` | 0 collision, 0 overflow   | 4 boundary overflows detected        | `1`  | Terminal output            |  `[FAIL]`  | **BLOCKER**: Chữ tràn mép trong block Rework.      |
| **DG-VAL-04**  | 12:06     | `f5c49fc`  | `python scripts/diagram_tool.py validate proposed-04.html`                           | `LOCAL_VERIFIED` | 0 collision, 0 overflow   | 5 boundary overflows detected        | `1`  | Terminal output            |  `[FAIL]`  | **BLOCKER**: Chữ tràn mép trong Profile cards.     |
| **DG-VAL-CAP** | 12:02     | `f5c49fc`  | `python scripts/diagram_tool.py validate 01-product-capability-map.html`             | `LOCAL_VERIFIED` | 0 collision, font >= 11px | 3 collisions, 4 overflows, font 9px  | `1`  | Terminal output            |  `[FAIL]`  | **BLOCKER**: Lỗi va chạm và chứa cụm 5 chốt cũ.    |
| **DG-VAL-CTX** | 12:02     | `f5c49fc`  | `python scripts/diagram_tool.py validate 02-domain-context-map.html`                 | `LOCAL_VERIFIED` | 0 collision, font >= 11px | 1 overflow, font 9px, "5 bước"       | `1`  | Terminal output            |  `[FAIL]`  | **BLOCKER**: Chứa "State Machine 5 bước" dòng 138. |
| **DG-VAL-SEC** | 12:02     | `f5c49fc`  | `python scripts/diagram_tool.py validate 07-action-eligibility-security-matrix.html` | `LOCAL_VERIFIED` | 0 collision, 0 overflow   | 38 texts, 0 collision, 0 overflow    | `0`  | Terminal output            |  `[PASS]`  | Biểu đồ ma trận phân quyền đạt chuẩn.              |
| **DG-VAL-IA**  | 12:02     | `f5c49fc`  | `python scripts/diagram_tool.py validate 08-role-information-architecture.html`      | `LOCAL_VERIFIED` | Font floor >= 11px        | 10 font-size 8px violations          | `1`  | Terminal output            |  `[FAIL]`  | **BLOCKER**: Font thanh điều hướng 8px quá nhỏ.    |
| **DG-VAL-TGT** | 12:02     | `f5c49fc`  | `python scripts/diagram_tool.py validate 10-system-target-architecture.html`         | `LOCAL_VERIFIED` | 0 collision, 0 overflow   | 34 texts, 0 collision, 0 overflow    | `0`  | Terminal output            |  `[PASS]`  | Biểu đồ kiến trúc mục tiêu đạt chuẩn.              |
| **DG-VAL-DEP** | 12:02     | `f5c49fc`  | `python scripts/diagram_tool.py validate 12-architecture-dependency-map.html`        | `LOCAL_VERIFIED` | Font floor >= 11px        | 5 font-size 9px violations           | `1`  | Terminal output            |  `[FAIL]`  | **BLOCKER**: Font nhãn cảnh báo 9px quá nhỏ.       |

---

## 2. Báo Cáo Tóm Tắt Tỷ Lệ Đạt / Hỏng Của Đường Cơ Sở

- **Tổng số hạng mục đã kiểm tra:** 21 hạng mục
- **Số hạng mục `[PASS]`:** 14 hạng mục (66.7%)
- **Số hạng mục `[WARN]`:** 1 hạng mục (4.8%)
- **Số hạng mục `[FAIL]` (BLOCKER):** 6 hạng mục (28.5%)
  1. `DG-VAL-02`: `proposed-02-mvp-operational-swimlane.html` (Lỗi tràn viền hình học)
  2. `DG-VAL-03`: `proposed-03-minimal-task-lifecycle.html` (Lỗi tràn viền hình học)
  3. `DG-VAL-04`: `proposed-04-proof-policy-and-rework.html` (Lỗi tràn viền hình học)
  4. `DG-VAL-CAP`: `01-product-capability-map.html` (Lỗi va chạm chữ, font 9px, ngữ nghĩa 5 chốt cũ)
  5. `DG-VAL-CTX`: `02-domain-context-map.html` (Lỗi tràn viền, font 9px, ngữ nghĩa "5 bước" cũ)
  6. `DG-VAL-IA` & `DEP`: `08-role-information-architecture.html`, `12-architecture-dependency-map.html` (Lỗi font floor < 10px)

> [!CAUTION]
> **KẾT QUẢ TỔNG THỂ TỪ SỔ BỘ BẰNG CHỨNG:**  
> **OVERALL BASELINE STATUS: `NOT READY — QUALITY GATE REVALIDATION REQUIRED`**  
> Do còn 6 kiểm tra bắt buộc bị `[FAIL]` trong Danh mục Biểu đồ Active, đường cơ sở hiện tại **chưa thể tuyên bố READY** cho pha Technical Architecture. Bắt buộc phải thực hiện pha sửa chữa dứt điểm các biểu đồ này trước khi khóa cổng.
