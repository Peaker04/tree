# GIAO THỨC PHÁN QUYẾT CỔNG CHẤT LƯỢNG CUỐI CÙNG

## Final Gate Protocol & Baseline Lock Protocol

> **Mục tiêu:** Định nghĩa quy trình ra quyết định đóng cổng chất lượng cao nhất cho NOVYX GreenOps. Quy định điều kiện tiên quyết để khóa đường cơ sở (Baseline Lock) và ngăn chặn việc bỏ qua các lỗi blocker còn tồn đọng.  
> **Quy tắc phán quyết:** _Chỉ có duy nhất hai trạng thái kết luận cuối cùng: `READY` hoặc `NOT READY`._

---

## 1. Điều Kiện Tiên Quyết Để Tuyên Bố PASS (The 10 Invariants of PASS)

Một pha phát triển hoặc một đường cơ sở chỉ được phép đóng dấu **PASS** khi và chỉ khi thỏa mãn đồng thời toàn bộ 10 điều kiện bất biến sau:

1. **100% Blocking Items = PASS:** Toàn bộ các mục kiểm tra có thuộc tính `Blocking: YES` trong mọi checklist thành phần bắt buộc phải mang trạng thái `[PASS]`.
2. **Không có bất kỳ mục FAIL nào:** Tuyệt đối không còn bất kỳ mục kiểm tra nào mang trạng thái `[FAIL]`.
3. **Không có NOT_RUN trong Mandatory Gate:** Không chấp nhận bất kỳ mục bắt buộc nào chưa được chạy kiểm tra.
4. **Không có INCONCLUSIVE trong Mandatory Gate:** Không chấp nhận bất kỳ mục bắt buộc nào bị thiếu công cụ hoặc môi trường thẩm định.
5. **Bằng chứng kiểm chứng bắt buộc tồn tại:** Mọi dòng PASS đều có bản ghi đối ứng trong [`VERIFICATION-EVIDENCE.md`](VERIFICATION-EVIDENCE.md) kèm exit code và đường dẫn tệp log/ảnh.
6. **Đã hoàn thành Lượt B (Pass B Recheck):** Đã chạy lại toàn bộ bộ lệnh từ trạng thái sạch (clean state), không sử dụng lại kết quả cũ của Lượt A.
7. **Git diff sạch sẽ:** Đã kiểm tra `git diff --check`, không có conflict markers, không có khoảng trắng thừa.
8. **Ranh giới mã nguồn nguyên vẹn:** `apps/mobile/src/**` = 0 modified files, `packages/**/src/**` = 0 modified files (cho các pha tài liệu/quản trị).
9. **Soát xét thị giác hoàn tất:** Đã mở trực tiếp ảnh PNG @2x của 100% biểu đồ Active và xác nhận không có lỗi mất nét/cắt chữ.
10. **Báo cáo trung thực:** Báo cáo tổng kết không chứa bất kỳ từ ngữ hứa hẹn nào vượt quá bằng chứng thực tế đo được.

> [!CAUTION]
> **ĐIỀU KIỆN PHỦ ĐỊNH TUYỆT ĐỐI:**  
> Nếu **BẤT KỲ ĐIỀU KIỆN NÀO** trong 10 điều kiện trên chưa đạt:  
> **KẾT LUẬN BẮT BUỘC PHẢI LÀ: `NOT READY`**.  
> Nghiêm cấm sử dụng các trạng thái thỏa hiệp như: _Mostly Pass_, _Pass with assumptions_, hoặc _Conditionally Ready_.

---

## 2. Bảng Checklist Khóa Đường Cơ Sở Tổng Hợp (Final Baseline Lock Checklist)

Bảng checklist tổng hợp 14 lĩnh vực dưới đây liên kết trực tiếp tới các Cổng Chất Lượng chi tiết:

### A. CANONICAL BUSINESS

- [x] [CAN-001](BASELINE-ACCEPTANCE-CHECKLIST.md#can-001) Phân cấp thẩm quyền tài liệu 7 tầng rõ ràng, không mâu thuẫn.
- [x] [CAN-002](BASELINE-ACCEPTANCE-CHECKLIST.md#can-002) Phân tách mục tiêu nghiệp vụ với hiện trạng mã nguồn.
- [x] [CAN-007](BASELINE-ACCEPTANCE-CHECKLIST.md#can-007) Xóa bỏ các tuyên bố quá mức về pháp lý và bảo mật ("tamper-evident", "giá trị pháp lý").
- [x] [CAN-011](BASELINE-ACCEPTANCE-CHECKLIST.md#can-011) Thống nhất 3 Hồ sơ Bằng chứng Ngữ nghĩa (`CHANGE`, `SERVICE`, `INSPECTION`).
- [x] [CAN-012](BASELINE-ACCEPTANCE-CHECKLIST.md#can-012) Thống nhất Vòng đời Nhiệm vụ 7 Trạng thái (`PENDING` đến `CANCELLED`).
- [x] [CAN-014](BASELINE-ACCEPTANCE-CHECKLIST.md#can-014) Thứ tự độc lập giữa QR code và GPS check-in.
- [x] [CAN-015](BASELINE-ACCEPTANCE-CHECKLIST.md#can-015) Thống nhất 4 kết luận thẩm định dứt điểm của Quản lý.

### B. TRACEABILITY (RTM)

- [x] [RTM-001](REQUIREMENTS-TRACEABILITY-CHECKLIST.md#rtm-001) Mã định danh yêu cầu duy nhất (`BR-01` đến `BR-14`).
- [x] [RTM-007](REQUIREMENTS-TRACEABILITY-CHECKLIST.md#rtm-007) Tiêu chí nghiệm thu (Acceptance Oracle) khách quan, đo đạc được.
- [x] [RTM-009](REQUIREMENTS-TRACEABILITY-CHECKLIST.md#rtm-009) Kỷ luật phân loại `CURRENTLY_IMPLEMENTED` vs `PARTIALLY_IMPLEMENTED`.
- [x] [RTM-RECHECK](REQUIREMENTS-TRACEABILITY-CHECKLIST.md#2-bảng-tái-thẩm-định-bắt-buộc-mandatory-behavior-re-checks) Tái thẩm tra 9 hành vi cốt tử (`StartTask`, `ProofProfiles`, `Rework`, `Offline`, `CareHistory`).

### C. ARCHITECTURE

- [x] [ARC-001](ARCHITECTURE-NFR-CHECKLIST.md#arc-001) Mô tả AS-IS phản ánh đúng monolithic mobile app và service hiện tại.
- [x] [ARC-002](ARCHITECTURE-NFR-CHECKLIST.md#arc-002) Clean Architecture được gắn nhãn `[PROPOSED TARGET ARCHITECTURE]` chờ ADR.
- [x] [ARC-003](ARCHITECTURE-NFR-CHECKLIST.md#arc-003) Object Storage được định danh trung lập `Provider: TBD / NEEDS_DECISION`.

### D. NFR (NON-FUNCTIONAL REQUIREMENTS)

- [x] [NFR-003](ARCHITECTURE-NFR-CHECKLIST.md#nfr-003) Phân loại rành mạch: `[APPROVED]`, `[TARGET SLO]`, `[PROPOSED BENCHMARK]`, `[NEEDS_MEASUREMENT]`.
- [x] [NFR-004](ARCHITECTURE-NFR-CHECKLIST.md#nfr-004) Các con số ước lượng (RAM 3-4GB, 200-1000 rows) không bị gọi là yêu cầu bắt buộc.
- [x] [NFR-007](ARCHITECTURE-NFR-CHECKLIST.md#nfr-007) Phân biệt mong muốn lưu trữ ngoại tuyến với fallback biến RAM hiện tại.

### E. DESIGN GOVERNANCE

- [x] [CAN-009](BASELINE-ACCEPTANCE-CHECKLIST.md#can-009) `DESIGN.md` loại bỏ quy tắc ép cứng chuỗi 5 bước, chuyển sang profile-driven rendering.
- [x] [CAN-010](BASELINE-ACCEPTANCE-CHECKLIST.md#can-010) `MOBILE_UI_RULES.md` không tự ý định nghĩa luật chuyển dịch trạng thái ngoài `WORKFLOWS.md`.

### F. DIAGRAM SEMANTICS

- [x] [DG-SEM-001](DIAGRAM-QUALITY-CHECKLIST.md#1-phần-a--tính-toàn-vẹn-ngữ-nghĩa-semantic-integrity---dg-sem) Phân loại biểu đồ rõ ràng (`DERIVED VIEW`).
- [ ] [DG-SEM-004](DIAGRAM-QUALITY-CHECKLIST.md#1-phần-a--tính-toàn-vẹn-ngữ-nghĩa-semantic-integrity---dg-sem) **[FAIL]** Biểu đồ Active cũ `01` và `02` còn chứa cụm từ lỗi thời "5 chốt" và "State Machine 5 bước".
- [x] [DG-SEM-006](DIAGRAM-QUALITY-CHECKLIST.md#1-phần-a--tính-toàn-vẹn-ngữ-nghĩa-semantic-integrity---dg-sem) Biểu đồ lịch sử `03`, `04`, `05`, `06`, `11` đã có banner cảnh báo `SUPERSEDED`.

### G. DIAGRAM GEOMETRY & COLLISION

- [x] [DG-GEO-001](DIAGRAM-QUALITY-CHECKLIST.md#4-phần-d--kiểm-tra-va-chạm-hình-học-geometric-collision---dg-geo) `proposed-01`: Đạt Zero Collision sau khi sửa nhóm tịnh tiến.
- [ ] [DG-GEO-002](DIAGRAM-QUALITY-CHECKLIST.md#4-phần-d--kiểm-tra-va-chạm-hình-học-geometric-collision---dg-geo) **[FAIL]** `proposed-02`: Báo lỗi 6 điểm chữ tràn viền hộp thẻ (Boundary Overflows).
- [ ] [DG-GEO-002](DIAGRAM-QUALITY-CHECKLIST.md#4-phần-d--kiểm-tra-va-chạm-hình-học-geometric-collision---dg-geo) **[FAIL]** `proposed-03`: Báo lỗi 4 điểm chữ tràn viền hộp thẻ (Boundary Overflows).
- [ ] [DG-GEO-002](DIAGRAM-QUALITY-CHECKLIST.md#4-phần-d--kiểm-tra-va-chạm-hình-học-geometric-collision---dg-geo) **[FAIL]** `proposed-04`: Báo lỗi 5 điểm chữ tràn viền hộp thẻ (Boundary Overflows).
- [ ] [DG-GEO-001](DIAGRAM-QUALITY-CHECKLIST.md#4-phần-d--kiểm-tra-va-chạm-hình-học-geometric-collision---dg-geo) **[FAIL]** `01-product-capability-map`: Báo lỗi 3 va chạm chữ vs chữ và 4 điểm tràn viền.

### H. DIAGRAM TYPOGRAPHY

- [x] [DG-TYP-001](DIAGRAM-QUALITY-CHECKLIST.md#2-phần-b--kiểu-chữ-tiếng-việt-vietnamese-typography---dg-typ) Thuộc tính `<html lang="vi">` hiện diện.
- [x] [DG-TYP-003](DIAGRAM-QUALITY-CHECKLIST.md#2-phần-b--kiểu-chữ-tiếng-việt-vietnamese-typography---dg-typ) Engine nạp font `Noto Sans` và `Noto Serif` sẵn sàng (`loaded=True`).
- [ ] [DG-TYP-004](DIAGRAM-QUALITY-CHECKLIST.md#2-phần-b--kiểu-chữ-tiếng-việt-vietnamese-typography---dg-typ) **[FAIL]** Biểu đồ `01`, `02`, `08`, `12` vi phạm ngưỡng cỡ chữ tối thiểu (có font 8px và 9px).

### I. DIAGRAM VISUAL REVIEW

- [x] [DG-VIS-003](DIAGRAM-QUALITY-CHECKLIST.md#5-phần-e--quy-trình-soát-xét-thị-giác-thực-tế-visual-inspection---dg-vis) Chiều mũi tên và marker hiển thị đúng hướng.
- [x] [DG-VIS-005](DIAGRAM-QUALITY-CHECKLIST.md#5-phần-e--quy-trình-soát-xét-thị-giác-thực-tế-visual-inspection---dg-vis) Độ tương phản màu sắc đạt chuẩn WCAG AA trên bảng màu Seed/Linear.
- [ ] [DG-VIS-001](DIAGRAM-QUALITY-CHECKLIST.md#5-phần-e--quy-trình-soát-xét-thị-giác-thực-tế-visual-inspection---dg-vis) **[FAIL]** Soát xét ảnh PNG @2x của `proposed-02`, `proposed-03`, `proposed-04` cho thấy nhãn dính sát mép viền, thiếu khoảng đệm an toàn.

### J. EXPORT PIPELINE

- [x] [DG-EXP-001](DIAGRAM-QUALITY-CHECKLIST.md#6-phần-f--đường-ống-xuất-bản-đa-định-dạng-export-pipeline---dg-exp) Xuất Standalone SVG thành công, màu `rgba` được chuẩn hóa thành `#hex` + `opacity`.
- [x] [DG-EXP-003](DIAGRAM-QUALITY-CHECKLIST.md#6-phần-f--đường-ống-xuất-bản-đa-định-dạng-export-pipeline---dg-exp) Xuất Diagram-only PNG @2x và @3x chuẩn bounding box của biểu đồ.
- [x] [DG-EXP-007](DIAGRAM-QUALITY-CHECKLIST.md#6-phần-f--đường-ống-xuất-bản-đa-định-dạng-export-pipeline---dg-exp) Xuất Diagram-only PDF vector vừa khít trang in (0-margin).

### K. SOURCE BOUNDARY GATE

- [x] [SRC-001](IMPLEMENTATION-READINESS-CHECKLIST.md#1-cổng-ranh-giới-mã-nguồn-tuyệt-đối-source-boundary-gate---src) `apps/mobile/src/**` modified: chính xác **0 tệp**.
- [x] [SRC-002](IMPLEMENTATION-READINESS-CHECKLIST.md#1-cổng-ranh-giới-mã-nguồn-tuyệt-đối-source-boundary-gate---src) `packages/**/src/**` modified: chính xác **0 tệp**.

### L. LOCAL BUILD VERIFICATION MATRIX

- [x] [BLD-DIF](VERIFICATION-EVIDENCE.md) `git diff --check`: Exit `0`.
- [x] [BLD-FMT](VERIFICATION-EVIDENCE.md) `npm run format:check`: Exit `0`.
- [x] [BLD-LNT](VERIFICATION-EVIDENCE.md) `npm run lint`: Exit `0`.
- [x] [BLD-TYP](VERIFICATION-EVIDENCE.md) `npm run typecheck`: Exit `0`.
- [x] [BLD-AND](VERIFICATION-EVIDENCE.md) `npm run mobile:export:android`: Exit `0`.

### M. CI VERIFICATION

- [x] Phân loại chính xác `LOCAL_VERIFIED` cho toàn bộ các lệnh chạy trên máy phát triển; không ghi nhận giả định "CI PASS".

### N. SECOND PASS RECHECK (LƯỢT B)

- [x] Đã tái thực thi bộ kiểm tra từ terminal sạch, kết quả khớp 100% với Sổ Bộ Bằng Chứng.

---

## 3. Phán Quyết Cổng Cuối Cùng (Final Baseline Determination)

Dựa trên kết quả đối soát toàn diện với Hệ thống Cổng Chất Lượng:

- [ ] **READY FOR TECHNICAL ARCHITECTURE BASELINE RECONCILIATION**
- [x] **NOT READY — QUALITY GATE REVALIDATION REQUIRED**

### Các Yếu Tố Chặn Cổng Cụ Thể (Remaining Blockers):

1. **Biểu đồ `proposed-02`, `proposed-03`, `proposed-04`:** Vi phạm kiểm tra tràn viền hình học (Boundary Overflows) và có nhãn dính sát mép viền (Safe Padding Violation).
2. **Biểu đồ Active cũ `01-product-capability-map`:** Vi phạm va chạm chữ vs chữ (Text vs Text Collisions), tràn viền và chứa khái niệm 5 chốt cũ.
3. **Biểu đồ Active cũ `02-domain-context-map`:** Chứa chuỗi lỗi thời "State Machine 5 bước" và vi phạm cỡ chữ tối thiểu (< 10px).
4. **Biểu đồ Active cũ `08` và `12`:** Vi phạm cỡ chữ tối thiểu (< 10px).
5. **Giai đoạn tiếp theo bắt buộc:** Pha **FINAL BASELINE REPAIR** để xử lý dứt điểm các lỗi hình học và ngữ nghĩa trên của Danh mục Biểu đồ Active trước khi bước vào Technical Architecture.
