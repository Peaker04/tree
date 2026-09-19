# CỔNG KIỂM TRA SẴN SÀNG TRIỂN KHAI & RANH GIỚI MÃ NGUỒN

## Implementation Readiness & Source Boundary Checklist

> **Mục tiêu:** Thiết lập hàng rào kiểm soát tuyệt đối trước khi bước vào bất kỳ pha triển khai mã nguồn (Technical Architecture / Feature Implementation) nào; bảo vệ ranh giới monorepo, kiểm soát toàn vẹn cú pháp/format/lint/typecheck và truy quét toàn diện các chuỗi văn bản lỗi thời.  
> **Tài liệu thẩm quyền:** [`AGENTS.md`](../../AGENTS.md), [`GEMINI.md`](../../GEMINI.md), `package.json`.

---

## 1. Cổng Ranh Giới Mã Nguồn Tuyệt Đối (Source Boundary Gate - SRC)

> [!IMPORTANT]
> Trong các pha quản trị, tài liệu, biểu đồ và thiết lập cổng chất lượng: **MÃ NGUỒN ỨNG DỤNG BẮT BUỘC PHẢI NGUYÊN VẸN 100%**. Không được sửa code để "làm cho docs đúng".

| Mã ID       | Tiêu chí ranh giới           | Acceptance Oracle                                                               | Phương pháp kiểm chứng   | Bằng chứng yêu cầu  | Mức độ  | Khóa cổng? | Trạng thái hiện tại |
| :---------- | :--------------------------- | :------------------------------------------------------------------------------ | :----------------------- | :------------------ | :-----: | :--------: | :-----------------: |
| **SRC-001** | Bất Biến Ứng Dụng Mobile     | Số lượng tệp bị sửa đổi trong `apps/mobile/src/**` chính xác bằng **0**.        | `git status --porcelain` | Output `git status` | BLOCKER |  **YES**   |      `[PASS]`       |
| **SRC-002** | Bất Biến Gói Dữ Liệu Chung   | Số lượng tệp bị sửa đổi trong `packages/**/src/**` chính xác bằng **0**.        | `git status --porcelain` | Output `git status` | BLOCKER |  **YES**   |      `[PASS]`       |
| **SRC-003** | Ranh Giới Submodule Upstream | Không có bất kỳ sửa đổi trực tiếp nào trong `external/hermes-agent/**`.         | `git diff external/`     | Git diff output     | BLOCKER |  **YES**   |      `[PASS]`       |
| **SRC-004** | Bảo Vệ Bí Mật Môi Trường     | Không commit các file môi trường `.env`, `.env.local` hoặc private keys/tokens. | `git status --ignored`   | Quét file `.env*`   | BLOCKER |  **YES**   |      `[PASS]`       |

---

## 2. Ma Trận Kiểm Tra Nền Tảng (Build & Source Quality Matrix)

Mọi thay đổi trên repository (dù chỉ là docs hoặc scripts) đều phải vượt qua bộ kiểm tra nền tảng cục bộ:

| Lệnh kiểm tra                   | Acceptance Oracle                                                                                                                       | Phân loại bằng chứng | Exit Code yêu cầu | Trạng thái thực tế | Bằng chứng thực nghiệm                                  |
| :------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------- | :------------------: | :---------------: | :----------------: | :------------------------------------------------------ |
| `git diff --check`              | Không có khoảng trắng thừa cuối dòng (trailing whitespace), không có lỗi conflict markers còn sót.                                      |   `LOCAL_VERIFIED`   |        `0`        |      `[PASS]`      | Exit `0`, không có lỗi định dạng patch.                 |
| `npm run format:check`          | 100% các tệp trong workspace tuân thủ quy chuẩn Prettier của repository.                                                                |   `LOCAL_VERIFIED`   |        `0`        |      `[PASS]`      | `All matched files use Prettier code style!`            |
| `npm run lint`                  | ESLint chạy qua toàn bộ dự án với 0 errors và 0 warnings.                                                                               |   `LOCAL_VERIFIED`   |        `0`        |      `[PASS]`      | `eslint .` thoát mã `0` sạch sẽ.                        |
| `npm run typecheck`             | TypeScript compiler (`tsc --noEmit`) pass 100% trên cả 4 workspaces: `@novyx/mobile`, `@novyx/config`, `@novyx/contracts`, `@novyx/ui`. |   `LOCAL_VERIFIED`   |        `0`        |      `[PASS]`      | `tsc --noEmit` thoát mã `0` trên 4 gói.                 |
| `npm run mobile:export:android` | Metro bundler biên dịch thành công 810 modules, xuất bundle bytecode Hermes mà không có lỗi thiếu asset/module.                         |   `LOCAL_VERIFIED`   |        `0`        |      `[PASS]`      | Xuất thành công `dist/mobile-android` (2.1MB bytecode). |

---

## 3. Cổng Truy Quét Chuỗi Lỗi Thời & Tuyên Bố Sai Lệch (Stale Content Gate)

Toàn bộ repository được quét định kỳ để phát hiện các khái niệm sơ khai ban đầu đã bị bãi bỏ:

| Chuỗi truy quét                          |       Phân loại trạng thái       | Đánh giá hiện trạng trong repo                                                                      | Hành động bắt buộc                                                                  |
| :--------------------------------------- | :------------------------------: | :-------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| `"5-step"`                               |    `HISTORICAL` / `REPAIRED`     | Chỉ còn xuất hiện trong các báo cáo audit đối soát lịch sử.                                         | Giữ nguyên trong ngữ cảnh audit; cấm đưa vào tài liệu target.                       |
| `"5 bước"`                               | `HISTORICAL` / `STALE_IN_ACTIVE` | Còn xuất hiện trong biểu đồ active `02-domain-context-map.html` (dòng 138: "State Machine 5 bước"). | **CHẶN CỔNG DIAGRAM**: Bắt buộc sửa biểu đồ 02.                                     |
| `"5 chốt"`                               |        `STALE_IN_ACTIVE`         | Còn xuất hiện trong biểu đồ active `01-product-capability-map.html` (5 chốt cứng).                  | **CHẶN CỔNG DIAGRAM**: Bắt buộc sửa biểu đồ 01.                                     |
| `"5/5"`                                  |           `HISTORICAL`           | Đã bị loại khỏi `DESIGN.md` và `MOBILE_UI_RULES.md`.                                                | Cấm tái xuất hiện trong các tài liệu thiết kế.                                      |
| `"GPS → QR"` / `"GPS -> QR"`             |           `STALE_RULE`           | Đã được chuẩn hóa thành độc lập thứ tự trong `WORKFLOWS.md` và `DESIGN.md`.                         | Cấm ép cứng thứ tự tuần tự trong form UI.                                           |
| `"FULL_PROOF"` / `"LIGHT_PROOF"`         |        `OBSOLETE_CONCEPT`        | Đã được thay thế hoàn toàn bởi 3 `ProofProfiles` ngữ nghĩa chuẩn tắc.                               | Cấm sử dụng trong hợp đồng DTO tương lai.                                           |
| `"tamper-evident"` / `"giá trị pháp lý"` |          `FALSE_CLAIM`           | Đã xóa khỏi `PRODUCT.md` và `WORKFLOWS.md`; bổ sung disclaimer pháp lý.                             | Cấm tái đưa vào khi chưa có hạ tầng mật mã / thẩm định pháp lý.                     |
| `"S3"` / `"GCS"` / `"storage.novyx"`     |     `UNAPPROVED_ASSUMPTION`      | Đã chuyển về `Provider: TBD / NEEDS_DECISION` trong `ARCHITECTURE.md`.                              | Cấm hardcode tên miền hoặc SDK cloud cụ thể trong code.                             |
| `"CANONICAL CONTRACT"` (trên Diagram)    |       `MISCLASSIFICATION`        | Đã đổi nhãn thành `DERIVED VIEW` trên toàn bộ biểu đồ active.                                       | Tuyệt đối không để diagram tự xưng là Canonical Contract.                           |
| `"CURRENTLY_IMPLEMENTED"`                |       `MISCLASSIFICATION`        | Đã hạ cấp `BR-04`, `BR-06`, `BR-08`, `BR-11`, `BR-12` sang `PARTIALLY_IMPLEMENTED`.                 | Chỉ được nâng cấp khi có bằng chứng code và runtime test đầy đủ.                    |
| `"READY FOR TECHNICAL ARCHITECTURE"`     |         `PREMATURE_PASS`         | Commit trước ghi nhận READY nhưng thực tế Cổng Biểu đồ và RTM còn tồn đọng lỗi.                     | **HẠ CẤP BẮT BUỘC**: Chuyển thành `NOT READY — QUALITY GATE REVALIDATION REQUIRED`. |

---

## 4. Điều Kiện Tiên Quyết Mở Cổng Triển Khai (Definition of Implementation Readiness)

Một pha kỹ thuật chỉ được phép bắt đầu viết code khi và chỉ khi:

1. [ ] Toàn bộ các cổng `CAN-001..015`, `RTM-001..015`, `ARC-001..006`, `NFR-001..010` đạt `[PASS]`.
2. [ ] Toàn bộ 11 biểu đồ Active trong `docs/quality-gates/DIAGRAM-QUALITY-CHECKLIST.md` đạt `[PASS]` (0 collision, 0 overflow, font floor $\ge 11\text{px}$, không còn chuỗi 5 bước cũ).
3. [ ] Các Architecture Decision Records (ADRs) cho Clean Architecture và Offline Persistence đã được Product Owner / Tech Lead phê duyệt chính thức (`ACCEPTED`).
4. [ ] Bản kế hoạch thực thi kỹ thuật (`implementation_plan.md`) đã được phê duyệt bằng văn bản.
