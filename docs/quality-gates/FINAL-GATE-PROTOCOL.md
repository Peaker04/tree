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
- [x] [DG-SEM-004](DIAGRAM-QUALITY-CHECKLIST.md#1-phần-a--tính-toàn-vẹn-ngữ-nghĩa-semantic-integrity---dg-sem) `[PASS]` Biểu đồ Active (`01..12`, `proposed-01..04`) đã được làm mới ngữ nghĩa, loại bỏ hoàn toàn các khái niệm lỗi thời "5 chốt" và "State Machine 5 bước".
- [x] [DG-SEM-006](DIAGRAM-QUALITY-CHECKLIST.md#1-phần-a--tính-toàn-vẹn-ngữ-nghĩa-semantic-integrity---dg-sem) Biểu đồ lịch sử `03`, `04`, `05`, `06`, `11` đã có banner cảnh báo `SUPERSEDED`.

### G. DIAGRAM GEOMETRY & COLLISION

- [x] [DG-GEO-001](DIAGRAM-QUALITY-CHECKLIST.md#4-phần-d--kiểm-tra-va-chạm-hình-học-geometric-collision---dg-geo) `proposed-01`: Đạt Zero Collision sau khi sửa nhóm tịnh tiến.
- [x] [DG-GEO-002](DIAGRAM-QUALITY-CHECKLIST.md#4-phần-d--kiểm-tra-va-chạm-hình-học-geometric-collision---dg-geo) `proposed-02`: Đạt Zero Boundary Overflow (mở rộng thẻ lên 195/240px, mở rộng pill lên 210px).
- [x] [DG-GEO-002](DIAGRAM-QUALITY-CHECKLIST.md#4-phần-d--kiểm-tra-va-chạm-hình-học-geometric-collision---dg-geo) `proposed-03`: Đạt Zero Boundary Overflow (giãn track ngang 100-120px và căn chỉnh nhãn).
- [x] [DG-GEO-002](DIAGRAM-QUALITY-CHECKLIST.md#4-phần-d--kiểm-tra-va-chạm-hình-học-geometric-collision---dg-geo) `proposed-04`: Đạt Zero Boundary Overflow (định hình profile cards chuẩn xác).
- [x] [DG-GEO-001](DIAGRAM-QUALITY-CHECKLIST.md#4-phần-d--kiểm-tra-va-chạm-hình-học-geometric-collision---dg-geo) `01-product-capability-map`: Đạt Zero Collision và Zero Boundary Overflow (tái cấu trúc 5 nhóm năng lực chuẩn).

### H. DIAGRAM TYPOGRAPHY

- [x] [DG-TYP-001](DIAGRAM-QUALITY-CHECKLIST.md#2-phần-b--kiểu-chữ-tiếng-việt-vietnamese-typography---dg-typ) Thuộc tính `<html lang="vi">` hiện diện.
- [x] [DG-TYP-003](DIAGRAM-QUALITY-CHECKLIST.md#2-phần-b--kiểu-chữ-tiếng-việt-vietnamese-typography---dg-typ) Engine nạp font `Noto Sans` và `Noto Serif` sẵn sàng (`loaded=True`).
- [x] [DG-TYP-004](DIAGRAM-QUALITY-CHECKLIST.md#2-phần-b--kiểu-chữ-tiếng-việt-vietnamese-typography---dg-typ) `[PASS]` 100% biểu đồ active tuân thủ ngưỡng cỡ chữ tối thiểu (font floor $\ge 11\text{px}$, không còn font 8px/9px).

### I. DIAGRAM VISUAL REVIEW

- [x] [DG-VIS-003](DIAGRAM-QUALITY-CHECKLIST.md#5-phần-e--quy-trình-soát-xét-thị-giác-thực-tế-visual-inspection---dg-vis) Chiều mũi tên và marker hiển thị đúng hướng.
- [x] [DG-VIS-005](DIAGRAM-QUALITY-CHECKLIST.md#5-phần-e--quy-trình-soát-xét-thị-giác-thực-tế-visual-inspection---dg-vis) Độ tương phản màu sắc đạt chuẩn WCAG AA trên bảng màu Seed/Linear.
- [x] [DG-VIS-001](DIAGRAM-QUALITY-CHECKLIST.md#5-phần-e--quy-trình-soát-xét-thị-giác-thực-tế-visual-inspection---dg-vis) `[PASS]` Soát xét ảnh PNG @2x của 100% biểu đồ active: chữ rõ nét, đệm an toàn thoáng đãng, không mất nét/cắt chữ.

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

- [x] Đã tái thực thi độc lập bộ kiểm tra từ terminal sạch ở Pass B, kết quả khớp 100% với Sổ Bộ Bằng Chứng.

---

## 3. Phán Quyết Cổng Cuối Cùng (Final Baseline Determination)

Dựa trên kết quả đối soát toàn diện với Hệ thống Cổng Chất Lượng và kết quả Pass B sạch:

- [x] **READY FOR TECHNICAL ARCHITECTURE BASELINE RECONCILIATION**
- [ ] **NOT READY — QUALITY GATE REVALIDATION REQUIRED**

### Tình Trạng Các Yếu Tố Chặn Cổng (Blockers Status):

1. **Biểu đồ `proposed-02`, `proposed-03`, `proposed-04`:** `[RESOLVED & VERIFIED]` Đã mở rộng kích thước hình học, khoảng đệm an toàn đạt $\ge 8\text{px}$, 0 boundary overflows, 0 va chạm.
2. **Biểu đồ Active cũ `01-product-capability-map`:** `[RESOLVED & VERIFIED]` Tái cấu trúc theo 5 nhóm năng lực chuẩn từ `PRODUCT.md`, loại bỏ hoàn toàn khái niệm 5 chốt cũ, 0 va chạm text, 0 overflow, font floor $\ge 11\text{px}$.
3. **Biểu đồ Active cũ `02-domain-context-map`:** `[RESOLVED & VERIFIED]` Đồng bộ ngữ nghĩa Bounded Context chuẩn tắc, loại bỏ chuỗi "State Machine 5 bước", font floor $\ge 11\text{px}$, 0 overflow.
4. **Biểu đồ Active cũ `08` và `12`:** `[RESOLVED & VERIFIED]` Nâng cấp toàn bộ nhãn thanh điều hướng và nhãn cảnh báo lên font $\ge 11\text{px}$, 0 font floor violations.
5. **Đường cơ sở chính thức:** Toàn bộ 10 điều kiện bất biến (10 Invariants of PASS) đã được thỏa mãn. Đường cơ sở được khóa chính thức: **BASELINE QUALITY GATE PASS — READY FOR TECHNICAL ARCHITECTURE BASELINE RECONCILIATION**.
