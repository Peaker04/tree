# HỆ THỐNG CỔNG CHẤT LƯỢNG ĐƯỜNG CƠ SỞ & GIAO THỨC BẰNG CHỨNG KIỂM CHỨNG

## NOVYX GreenOps — Baseline Quality Gates, Acceptance Checklists & Verification Evidence Protocol

> **Phiên bản:** `1.0.0` (Chuẩn mực quản trị đường cơ sở)  
> **Áp dụng cho:** Toàn bộ các pha phát triển từ Inception, Architecture, Requirements, Diagrams, UI/UX đến Implementation.  
> **Nguyên tắc cốt tử:** _Không có PASS suy diễn; mọi PASS phải có bằng chứng độc lập kiểm chứng được._

---

## 1. Mục Đích & Phạm Vi Áp Dụng

Tài liệu này thiết lập hệ thống **Cổng Chất Lượng (Quality Gates)** chuẩn tắc cho dự án **NOVYX GreenOps**. Hệ thống này được xây dựng nhằm mục đích:

1. **Khóa chính xác các yêu cầu:** Định nghĩa cụ thể, không mập mờ những điều kiện bắt buộc phải đạt trước khi một pha được tuyên bố hoàn thành.
2. **Acceptance Oracle rành mạch:** Mỗi yêu cầu kỹ thuật hoặc nghiệp vụ bắt buộc phải đi kèm một **Acceptance Oracle** (tiêu chí nghiệm thu khách quan, nhị phân, kiểm chứng được bằng công cụ hoặc đo đạc).
3. **Loại bỏ "Fake PASS":** Nghiêm cấm tuyệt đối việc giả định "đã sửa văn bản/code nên coi như PASS", không cho phép AI/agent tự suy luận kết quả khi chưa thực thi kiểm tra, không cho phép validator tự báo PASS khi một số kiểm tra bị bỏ qua (skipped) hoặc thiếu môi trường (headless browser).
4. **Phân định rõ ràng phạm vi bằng chứng:** Tách biệt triệt để giữa kết quả kiểm tra cục bộ (`LOCAL_VERIFIED`), kết quả đường ống tự động (`CI_VERIFIED`), và kiểm tra thị giác thủ công (`MANUAL_VISUAL_VERIFIED`).

---

## 2. Mô Hình Trạng Thái Chuẩn Bắt Buộc (Status Model)

Mọi mục kiểm tra (Checklist Item) trong toàn bộ các checklist của dự án **chỉ được phép** mang một trong sáu trạng thái sau:

|     Trạng thái     | Tên định danh      | Định nghĩa chuẩn xác                                                                                                                                | Quy tắc quyết định                                     |
| :----------------: | :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- |
|      `[PASS]`      | **Pass**           | **Acceptance Oracle** đã được thỏa mãn đầy đủ VÀ bằng chứng bắt buộc (`Required Evidence`) đã được ghi nhận vào Evidence Ledger.                    | Đủ điều kiện thông qua.                                |
|      `[FAIL]`      | **Fail**           | Acceptance Oracle không thỏa mãn, hoặc phát hiện sai lệch, lỗi cú pháp, va chạm hình học, mâu thuẫn nghiệp vụ.                                      | **CHẶN CỔNG** (nếu là mục Blocking).                   |
|      `[WARN]`      | **Warning**        | Phát hiện rủi ro phi chức năng hoặc sai lệch nhỏ không vi phạm Oracle cốt tử; không chặn cổng ngay nhưng phải có kế hoạch theo dõi.                 | Không chặn, nhưng `WARN != PASS`.                      |
|    `[NOT_RUN]`     | **Not Run**        | Kiểm tra chưa được thực thi trong lượt chạy hiện tại.                                                                                               | `NOT_RUN != PASS`. Gate tổng phải là `NOT READY`.      |
|  `[INCONCLUSIVE]`  | **Inconclusive**   | Đã cố gắng kiểm tra nhưng không thể kết luận do thiếu môi trường (ví dụ: thiếu headless browser), thiếu công cụ, hoặc kết quả bị mờ nhạt/chập chờn. | `INCONCLUSIVE != PASS`. Gate tổng phải là `NOT READY`. |
| `[NOT_APPLICABLE]` | **Not Applicable** | Yêu cầu không áp dụng cho phạm vi của pha hiện tại (bắt buộc phải ghi rõ lý do/rationale).                                                          | Không tính vào tỷ lệ đạt/hỏng.                         |

### Các Tiên Đề Bất Biến (Non-Negotiable Axioms):

$$\text{NOT\_RUN} \neq \text{PASS}$$
$$\text{INCONCLUSIVE} \neq \text{PASS}$$
$$\text{WARN} \neq \text{PASS}$$
$$\text{SKIPPED} \neq \text{PASS}$$

> [!CAUTION]
> **Quy tắc chặn cổng:** Nếu bất kỳ mục kiểm tra bắt buộc (`Blocking: YES`) nào mang trạng thái `[FAIL]`, `[NOT_RUN]`, hoặc `[INCONCLUSIVE]`, Cổng Tổng thể (Overall Gate) **BẮT BUỘC PHẢI LÀ `NOT READY`** hoặc `FAIL`. Nghiêm cấm sử dụng các thuật ngữ thỏa hiệp như: _"Mostly Pass"_, _"Pass with assumptions"_, _"100% Pass"_, hoặc _"Ready"_ khi điều kiện tiên quyết chưa thỏa mãn.

---

## 3. Cấu Trúc Bản Ghi Kiểm Tra Chuẩn (Checklist Item Schema)

Mỗi hạng mục trong hệ thống Quality Gates bắt buộc tuân thủ cấu trúc 13 trường dữ liệu chuẩn:

```yaml
ID: <Mã định danh duy nhất, ví dụ: CAN-001, RTM-004, DG-GEO-002>
Category: <Nhóm phân loại, ví dụ: Semantic Authority, Typography, Geometry>
Requirement: <Điều hệ thống hoặc tài liệu bắt buộc phải đạt>
Authority / Source: <Tài liệu chuẩn tắc làm căn cứ thẩm quyền, ví dụ: docs/WORKFLOWS.md>
Acceptance Oracle: <Tiêu chí nghiệm thu khách quan, chính xác, có thể đo đạc nhị phân>
Verification Method: <Phương pháp kiểm chứng: Static Audit, Runtime Geometry, Unit Test, Build>
Required Evidence: <Bằng chứng bắt buộc phải xuất trình: Log file, JSON output, Screenshot @2x>
Severity: <Mức độ nghiêm trọng: BLOCKER, CRITICAL, MAJOR, MINOR>
Blocking?: <YES / NO>
Execution Status: <PASS / FAIL / WARN / NOT_RUN / INCONCLUSIVE / NOT_APPLICABLE>
Evidence Scope: <LOCAL_VERIFIED / CI_VERIFIED / MANUAL_VISUAL_VERIFIED / CI_NOT_AVAILABLE>
Evidence Result: <Tóm tắt kết quả đo đạc thực tế kèm tọa độ, mã lỗi, hoặc giá trị đo>
Notes / Gap: <Ghi chú nguyên nhân gốc hoặc mã lỗi tồn đọng nếu có>
```

---

## 4. Phân Biệt: Yêu Cầu vs Oracle vs Phương Án Thực Hiện

Để tránh việc biến quyết định hiện thực hóa thành "chân lý nghiệp vụ", mọi checklist phải tuân thủ sự phân định:

1. **YÊU CẦU (Requirement):** Mục tiêu cốt lõi mà hệ thống/tài liệu phải đạt (Ví dụ: _"Dữ liệu danh sách lớn phải cuộn mượt và không gây cạn kiệt bộ nhớ"_).
2. **ACCEPTANCE ORACLE:** Điều kiện biên cụ thể để máy hoặc con người phán quyết đạt hay không (Ví dụ: _"Bộ nhớ RAM tăng trưởng $\le 20\text{MB}$ sau khi cuộn 500 dòng; tỷ lệ rớt khung hình $< 5\%$ ở 60fps"_).
3. **PHƯƠNG PHÁP KIỂM CHỨNG (Verification Method):** Cách thức thu thập bằng chứng (Ví dụ: _"Chạy benchmark đo FPS bằng Expo dev-client trên thiết bị Android RAM 3GB"_).
4. **PHƯƠNG ÁN HIỆN THỰC (Implementation Option):** Công nghệ hoặc thư viện cụ thể có thể dùng (Ví dụ: _`FlatList` tối ưu windowSize, hoặc `FlashList`_). Phương án hiện thực **KHÔNG ĐƯỢC XEM LÀ REQUIREMENT** trừ khi đã có Architecture Decision Record (ADR) được phê duyệt chính thức.

---

## 5. Danh Mục Các Cổng Chất Lượng Trong Dự Án

Hệ thống Quality Gates của NOVYX GreenOps bao gồm các tập tài liệu chuyên biệt sau:

1. [`docs/quality-gates/BASELINE-ACCEPTANCE-CHECKLIST.md`](BASELINE-ACCEPTANCE-CHECKLIST.md)  
   _Cổng chuẩn tắc Đường cơ sở Nghiệp vụ (CAN-001 đến CAN-015)._ Khóa tính nhất quán giữa tài liệu nghiệp vụ, không mâu thuẫn quyền hạn, không overclaim pháp lý/kỹ thuật.
2. [`docs/quality-gates/REQUIREMENTS-TRACEABILITY-CHECKLIST.md`](REQUIREMENTS-TRACEABILITY-CHECKLIST.md)  
   _Cổng Ma trận Yêu cầu & Bằng chứng Mã nguồn (RTM-001 đến RTM-015)._ Khóa tính trung thực giữa ma trận RTM và mã nguồn thực tế, kiểm soát chặt chẽ các hành vi cốt tử (`StartTask`, `ProofProfiles`, `Targeted Rework`, `Offline`).
3. [`docs/quality-gates/ARCHITECTURE-NFR-CHECKLIST.md`](ARCHITECTURE-NFR-CHECKLIST.md)  
   _Cổng Kiến trúc & Chỉ tiêu Phi chức năng (ARC-001 đến ARC-006, NFR-001 đến NFR-010)._ Tách bạch đề xuất kiến trúc (PROPOSED) với quyết định đã duyệt (ADR), chuẩn hóa các kịch bản đo đạc NFR.
4. [`docs/quality-gates/DIAGRAM-QUALITY-CHECKLIST.md`](DIAGRAM-QUALITY-CHECKLIST.md)  
   _Cổng Chất lượng Toàn diện Biểu đồ (DG-SEM, DG-TYP, DG-LAY, DG-GEO, DG-VIS, DG-EXP, VAL-001 đến VAL-014)._ Kiểm soát ngữ nghĩa, typography tiếng Việt, đo đạc hình học không va chạm trong trình duyệt headless, và kiểm toán danh mục biểu đồ active.
5. [`docs/quality-gates/IMPLEMENTATION-READINESS-CHECKLIST.md`](IMPLEMENTATION-READINESS-CHECKLIST.md)  
   _Cổng Sẵn sàng Thực thi Mã nguồn & Ranh giới Monorepo (SRC-001, SRC-002, Build Matrix)._ Kiểm soát ranh giới 0 tệp sửa đổi, bộ kiểm tra monorepo lint/format/typecheck và tìm kiếm chuỗi lỗi thời.
6. [`docs/quality-gates/VERIFICATION-EVIDENCE-TEMPLATE.md`](VERIFICATION-EVIDENCE-TEMPLATE.md)  
   _Khuôn mẫu Sổ bộ Bằng chứng & Giao thức Phân loại._ Định nghĩa cấu trúc lưu trữ bằng chứng, phân biệt bằng chứng Local vs CI.
7. [`docs/quality-gates/VERIFICATION-EVIDENCE.md`](VERIFICATION-EVIDENCE.md)  
   _Sổ Bộ Bằng Chứng Thực Tế (Evidence Ledger)._ Nhật ký ghi lại toàn bộ các lệnh kiểm tra, exit code, hash commit, và đường dẫn artifact của dự án.
8. [`docs/quality-gates/FINAL-GATE-PROTOCOL.md`](FINAL-GATE-PROTOCOL.md)  
   _Giao thức Phán Quyết Cổng Cuối Cùng & Xác thực Hai Lượt (Two-Pass Verification)._ Quy định quy trình Pass A (kiểm tra sau sửa đổi) và Pass B (tái kiểm tra độc lập trên môi trường sạch), checklist khóa đường cơ sở tổng hợp.
9. `dist/quality-evidence/evidence-index.json`
   _Sổ Bộ Bằng Chứng Máy Tính Thẩm Quyền Duy Nhất (Authoritative Machine Evidence Registry)._ Được sinh trực tiếp trên commit SHA cuối cùng (`FINAL_COMMITTED_SHA`) ở trạng thái working tree sạch, chứa 100% bản ghi thực thi khách quan (stdout/stderr, exit code, execution time, structured data, SHA, tool hashes, oracle_execution) của toàn bộ 113 cổng chất lượng, phục vụ công cụ phán quyết `scripts/quality_gate_report.py`.
10. [`docs/quality-gates/evidence-index.json`](evidence-index.json)
    _Bản Lưu Lịch Sử Không Thẩm Quyền (Non-Authoritative Historical Snapshot)._ Chỉ phục vụ lưu vết tham chiếu lịch sử; TUYỆT ĐỐI KHÔNG dùng làm căn cứ phán quyết cổng hiện tại. Mọi thẩm quyền bằng chứng máy tính bắt buộc đọc từ `dist/quality-evidence/evidence-index.json`.
