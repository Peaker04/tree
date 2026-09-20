# NOVYX GreenOps — RTM Expansion & Acceptance Oracle Report (Phase 7)

**Tài liệu:** Báo cáo Tôi luyện & Thiết lập Chuẩn Nghiệm thu Nhị phân (Binary Acceptance Oracles)  
**Mã tài liệu:** `10-RTM-ACCEPTANCE-ORACLE-REPORT.md`  
**Giai đoạn:** Phase 7 — RTM Expansion & Acceptance Oracles  
**Baseline Commit:** `86e0df7e2d9820518da67d92d42ab6bbf60d0057`  
**Trạng thái:** `APPROVED & FROZEN`  

---

## 1. Phạm vi & Mục tiêu (Scope & Objectives)

Mục tiêu tối cao của Phase 7 là biến toàn bộ các yêu cầu nghiệp vụ (Business Requirements - BR) đã được chuẩn tắc hóa tại Phase 1–6 thành **Bộ chuẩn nghiệm thu nhị phân (Binary Acceptance Oracles)**:
- **Nhị phân (Binary):** Mọi tiêu chuẩn nghiệm thu phải được đánh giá tất định thành `PASS` hoặc `FAIL` mà không phụ thuộc vào diễn giải chủ quan của con người.
- **Tất định (Deterministic):** Cùng một bộ tiền điều kiện và hành động kích hoạt phải cho ra cùng một kết quả trạng thái và dữ liệu quan sát được.
- **Kiểm thử được (Testable):** Có thể viết thành các ca kiểm thử tự động độc lập hoặc quy trình đối soát thực nghiệm.
- **Độc lập cài đặt (Implementation-Independent):** Nghiệm thu dựa trên hành vi nghiệp vụ quan sát được (observable business behavior); tuyệt đối không phụ thuộc vào tên interface TypeScript, DTO `@novyx/contracts`, đường dẫn REST API, mã HTTP status, cấu trúc bảng cơ sở dữ liệu, hay công nghệ kỹ thuật cụ thể (JWT, Redis, Kafka, SQLite, WORM, blockchain, chữ ký số).
- **Đầy đủ cặp Positive & Negative/Forbidden:** Mỗi yêu cầu nghiệp vụ đều phải có ca chấp thuận hợp lệ (Positive Oracle) và tối thiểu một ca từ chối/bị cấm (Negative/Forbidden Oracle).
- **Lưu vết kiểm toán chuẩn tắc (Audit Expectations):** Xác định rõ ràng yêu cầu ghi vết kiểm toán (`AUDIT_REQUIRED`, `AUDIT_RECOMMENDED`, `NO_BUSINESS_AUDIT_REQUIRED`, `NOT_APPLICABLE`).

Phase 7 tuân thủ nghiêm ngặt **Quy tắc đóng băng (Freeze Rule)**: Không tạo ngữ nghĩa nghiệp vụ mới, không thiết kế DTO/API/DB/UI/Architecture, và không mở lại các quyết định đã chốt từ Phase 1–6.

---

## 2. Điểm tựa Chuẩn tắc đã Đóng băng (Frozen Baseline)

Bộ chuẩn nghiệm thu trong báo cáo này được xây dựng trực tiếp và truy vết 100% tới các tài liệu chuẩn tắc và quyết định đã được phê duyệt:
1. `docs/PRODUCT.md`: Bản đồ năng lực nghiệp vụ (`CAP-01..05`, `CAP-ADM-01..09`), phân loại MVP/NEXT/REJECTED.
2. `docs/DOMAIN.md`: Ngữ cảnh bị giới hạn (`Work Management`, `Tree Asset Registry`, `Policy & Template Governance`, `Audit & Compliance`, `IAM`), 5 chiều trạng thái, và các bất biến miền (`DR-HARD-01..07`, `DR-MVP-01..06`).
3. `docs/ACCESS-CONTROL.md`: Mô hình 4 tác nhân, công thức phân quyền 4 yếu tố, ma trận phân quyền tác nghiệp (`CMD-OP-01..17`), ma trận phân quyền quản trị (`CMD-ADM-01..22`), và ranh giới cấm nghiêm ngặt.
4. `docs/WORKFLOWS.md`: Vòng đời 7 trạng thái của Task, quy trình tác nghiệp thực địa `WF-01..09`, quy trình quản trị nền tảng `WF-10..17`, quy trình ngoại tuyến `WF-18`, quy trình tương lai `WF-NEXT-01..03`, và ma trận bàn giao xuyên ngữ cảnh `HO-01..12`.
5. Báo cáo đối soát Phase 1–6: `02-ACTOR`, `03-TAXONOMY`, `04-ADMIN-SCOPE`, `05-DOMAIN`, `06-BOUNDED-CONTEXT`, `07-AUTH`, `08-WORKFLOW`, `09-CANONICAL-REPORT`.

---

## 3. Kiểm kê Toàn bộ Yêu cầu Nghiệp vụ trong RTM (RTM Requirement Inventory)

Hệ thống RTM chuẩn tắc chứa đúng **43 yêu cầu nghiệp vụ (Business Requirements)**, được phân loại chính xác như sau:

| Nhóm yêu cầu | Mã yêu cầu | Số lượng | Phân loại Phase 7 |
|---|---|:---:|---|
| **Vận hành Tác nghiệp Thực địa** | `BR-01`, `BR-01b`, `BR-02`, `BR-02b`, `BR-03`, `BR-04`, `BR-04b`, `BR-04c`, `BR-05`, `BR-05b`, `BR-06`, `BR-07`, `BR-07b`, `BR-08`, `BR-08b`, `BR-09`, `BR-10`, `BR-11`, `BR-12`, `BR-13` | 20 | `HARDEN_NOW` |
| **Mô hình Tác nhân & Phân tầng** | `BR-ACT-01` | 1 | `HARDEN_NOW` |
| **Quản trị Nền tảng (MVP)** | `BR-ADM-01`, `BR-ADM-02`, `BR-ADM-02b`, `BR-ADM-03`, `BR-ADM-03b`, `BR-ADM-04`, `BR-ADM-05`, `BR-ADM-06`, `BR-ADM-06b`, `BR-ADM-06c`, `BR-ADM-06d`, `BR-ADM-07`, `BR-ADM-08`, `BR-ADM-09` | 14 | `HARDEN_NOW` |
| **Quản trị Nền tảng (NEXT)** | `BR-ADM-10`, `BR-ADM-11`, `BR-ADM-12` | 3 | `NEXT_REQUIREMENT` |
| **Quản trị Nền tảng (Bác bỏ)** | `BR-ADM-13` | 1 | `REJECTED_REQUIREMENT` |
| **Bất biến Kiến trúc & Miền** | `BR-DOM-01`, `BR-DOM-02`, `BR-DOM-03`, `BR-DOM-04` | 4 | `HARDEN_NOW` |
| **TỔNG CỘNG** | | **43** | **43 yêu cầu được tôi luyện đầy đủ** |

---

## 4. Danh mục Cần Tôi luyện Ngay (HARDEN_NOW Set)

Tập hợp `HARDEN_NOW` bao gồm toàn bộ các yêu cầu mang nhãn tạm thời `TO_BE_HARDENED_IN_PHASE_7` cùng với toàn bộ các yêu cầu tác nghiệp thực địa cần chuẩn hóa thành tiêu chuẩn nghiệm thu nhị phân độc lập cài đặt:
1. **Toàn bộ 19 yêu cầu mang nhãn `TO_BE_HARDENED_IN_PHASE_7`:** `BR-ACT-01`, `BR-ADM-01..09`, `BR-ADM-02b`, `BR-ADM-03b`, `BR-ADM-06b..d`, `BR-DOM-01..04`.
2. **Toàn bộ 20 yêu cầu tác nghiệp thực địa:** `BR-01..13`, `BR-01b`, `BR-02b`, `BR-04b`, `BR-04c`, `BR-05b`, `BR-07b`, `BR-08b`.
3. **Bộ 4 yêu cầu tương lai / bác bỏ:** `BR-ADM-10..12` (NEXT) và `BR-ADM-13` (REJECTED) được thiết lập oracle khóa kiểm soát biên giới tính năng rõ ràng.

---

## 5. Cấu trúc Chuẩn Nghiệm thu Nhị phân (Oracle Schema)

Mỗi yêu cầu nghiệp vụ được chuẩn hóa theo lược đồ kiểm thử thống nhất gồm 16 trường bắt buộc:

```text
Requirement ID:       Mã yêu cầu chuẩn tắc (BR-*, không đổi mã)
Requirement Statement:Phát biểu nghiệp vụ cốt lõi
Actor:                Tác nhân kích hoạt (Field Staff | Operations Manager | Platform Administrator | System)
Command:              Tên lệnh chuẩn tắc Phase 4/5/6
Owning Context:       Ngữ cảnh sở hữu (Work Management | Tree Asset Registry | Policy & Template Governance | Audit & Compliance | IAM)
Resource:             Thực thể nghiệp vụ đích thao tác
Resource Scope:       Phạm vi dữ liệu hợp lệ của tác nhân
Eligible State:       Trạng thái đối tượng cho phép kích hoạt (hoặc NOT_APPLICABLE)
Preconditions:        Điều kiện tiên quyết trước khi thực hiện
Action / Trigger:     Hành vi kích hoạt lệnh
Expected Result:      Kết quả trạng thái và dữ liệu quan sát được
Forbidden Behavior:   Hành vi bị từ chối / cấm đoán / báo lỗi nghiệp vụ
Audit Expectation:    Mức độ kiểm toán (AUDIT_REQUIRED | AUDIT_RECOMMENDED | NO_BUSINESS_AUDIT_REQUIRED | NOT_APPLICABLE)
MVP Classification:   Phân loại triển khai (MVP | NEXT | REJECTED)
Positive Oracle:      Kịch bản kiểm thử chấp thuận hợp lệ (Given / When / Then)
Negative Oracle(s):   Kịch bản kiểm thử từ chối / cấm (Given / When / Then / Forbidden)
Canonical Source:     Truy vết tài liệu chuẩn tắc (PRODUCT §..., DOMAIN §..., ACCESS-CONTROL §..., WORKFLOWS WF-...)
```

---

## 6. Bảng Chuẩn Nghiệm thu Tác nghiệp Thực địa (Operational Requirements BR-01..BR-13)

### BR-01 — Xác thực Tọa độ GPS Gốc cây (VerifyGps)
- **Actor:** Field Staff (`staff`)
- **Command:** `VerifyGps`
- **Owning Context:** `Work Management`
- **Resource:** `SiteVerification`, `Task`
- **Resource Scope:** `task.assignedStaffId == actor.userId`
- **Eligible State:** `TaskStatus = IN_PROGRESS`
- **Preconditions:** Thiết bị đã cấp quyền vị trí (Location granted); vị trí GPS đo được có sai số khoảng cách $\le 10$m so với tọa độ cây mục tiêu `tree.canonicalCoordinates`.
- **Action / Trigger:** Nhân viên bấm nút đo GPS tại hiện trường.
- **Expected Result:** `SiteVerification.locationStatus = LOCATION_VERIFIED`; lưu vết tọa độ đo, khoảng cách tính toán ($\le 10$m), độ chính xác GPS và timestamp. `TaskStatus` giữ nguyên `IN_PROGRESS`.
- **Forbidden Behavior:** Mở xem chi tiết task, đo GPS thành công hoặc thất bại **tuyệt đối không được làm đột biến `TaskStatus`** (`PENDING -> IN_PROGRESS` hoặc `IN_PROGRESS -> WAITING_REVIEW`). Nhân viên không được gán task cấm thực hiện `VerifyGps`.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED` (Ghi nhận trực tiếp vào trường dữ liệu `Task.siteVerification`).
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `actor.role = staff`, `task.assignedStaffId = actor.userId`, `task.status = IN_PROGRESS`, GPS distance đo được $= 6.5\text{m} \le 10\text{m}$.  
  *When:* Field Staff gọi lệnh `VerifyGps`.  
  *Then:* `locationStatus` trở thành `LOCATION_VERIFIED`, bản ghi lưu khoảng cách $6.5\text{m}$, `task.status` vẫn là `IN_PROGRESS`.
- **Negative Oracle(s):**  
  *Neg 1 (Khoảng cách vượt ngưỡng):* GPS distance $= 15\text{m} > 10\text{m}$ $\to$ Lệnh `VerifyGps` bị từ chối chuyển sang `LOCATION_VERIFIED`.  
  *Neg 2 (Sai trạng thái):* `task.status = PENDING` $\to$ Từ chối thực hiện đo GPS (`INVALID_TASK_STATE`).  
  *Neg 3 (Sai phân công):* `task.assignedStaffId != actor.userId` $\to$ Từ chối quyền truy cập (`RESOURCE_SCOPE_MISMATCH`).
- **Canonical Source:** `WORKFLOWS WF-03`, `ACCESS-CONTROL §4 CMD-OP-03`, `DOMAIN §4 DR-MVP-04`.

---

### BR-01b — Báo cáo Ngoại lệ Vị trí Thực địa (ReportLocationException)
- **Actor:** Field Staff (`staff`)
- **Command:** `ReportLocationException`
- **Owning Context:** `Work Management`
- **Resource:** `VerificationException`, `Task`
- **Resource Scope:** `task.assignedStaffId == actor.userId`
- **Eligible State:** `TaskStatus = IN_PROGRESS`
- **Preconditions:** Đã thực hiện đo GPS nhưng khoảng cách $> 10$m do tán lá/nhà cao tầng; có ảnh hiện trường và lý do văn bản không rỗng.
- **Action / Trigger:** Nhân viên xác nhận báo cáo ngoại lệ GPS.
- **Expected Result:** `SiteVerification.locationStatus = LOCATION_EXCEPTION`; lưu vết lý do, ảnh thực địa, khoảng cách thực đo. `TaskStatus` giữ nguyên `IN_PROGRESS`. Cờ ngoại lệ được bảo lưu để Quản lý hậu kiểm tại `WF-06`.
- **Forbidden Behavior:** Báo ngoại lệ khi chưa nhập lý do; xóa cờ ngoại lệ sau khi ghi; làm thay đổi `TaskStatus`.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED` (Lưu vào thực thể ngoại lệ gắn kèm Task).
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status = IN_PROGRESS`, GPS đo $= 18\text{m}$, nhân viên cung cấp ảnh hiện trường và văn bản lý do "Tán lá rậm rạp che khuất vệ tinh".  
  *When:* Gọi `ReportLocationException`.  
  *Then:* `locationStatus` trở thành `LOCATION_EXCEPTION`, lý do được lưu trữ, `task.status` giữ nguyên `IN_PROGRESS`.
- **Negative Oracle(s):**  
  *Neg 1 (Lý do rỗng):* Lý do văn bản rỗng $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Tự xóa ngoại lệ):* Staff gửi lệnh xóa bản ghi ngoại lệ $\to$ Bị từ chối 100%.
- **Canonical Source:** `WORKFLOWS WF-03`, `ACCESS-CONTROL §4 CMD-OP-04`.

---

### BR-02 — Quét Mã QR Thân Cây (VerifyQr)
- **Actor:** Field Staff (`staff`)
- **Command:** `VerifyQr`
- **Owning Context:** `Work Management`
- **Resource:** `SiteVerification`, `Task`
- **Resource Scope:** `task.assignedStaffId == actor.userId`
- **Eligible State:** `TaskStatus = IN_PROGRESS`
- **Preconditions:** Camera granted; chuỗi quét mã QR khớp 100% với `tree.qrCode` của cây được giao trong nhiệm vụ.
- **Action / Trigger:** Nhân viên quét mã tem QR trên thân cây.
- **Expected Result:** `SiteVerification.identityStatus = TREE_IDENTITY_VERIFIED`; lưu vết timestamp quét mã. `TaskStatus` giữ nguyên `IN_PROGRESS`.
- **Forbidden Behavior:** Quét mã QR của cây khác trong công viên rồi gán vào task này (`DR-HARD-01`); làm thay đổi `TaskStatus`.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.treeId = "TREE-001"`, `tree.qrCode = "QR-TREE-001"`, chuỗi quét camera $= "QR-TREE-001"$.  
  *When:* Gọi `VerifyQr`.  
  *Then:* `identityStatus = TREE_IDENTITY_VERIFIED`, `task.status` giữ nguyên `IN_PROGRESS`.
- **Negative Oracle(s):**  
  *Neg 1 (Sai mã cây):* Chuỗi quét $= "QR-TREE-999"$ khác mã cây giao $\to$ Từ chối xác thực (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Đổi cây mục tiêu):* Staff gửi yêu cầu đổi `task.treeId` sang cây vừa quét $\to$ Bị cấm 100% (`DR-HARD-01`).
- **Canonical Source:** `WORKFLOWS WF-03`, `ACCESS-CONTROL §4 CMD-OP-05`, `DOMAIN §4 DR-HARD-01`.

---

### BR-02b — Báo cáo Tem QR Bị Hỏng / Mất (ReportIdentityException)
- **Actor:** Field Staff (`staff`)
- **Command:** `ReportIdentityException`
- **Owning Context:** `Work Management`
- **Resource:** `VerificationException`, `Task`
- **Resource Scope:** `task.assignedStaffId == actor.userId`
- **Eligible State:** `TaskStatus = IN_PROGRESS`
- **Preconditions:** Tem QR bị mờ, rách hoặc mất hẳn; có ảnh chụp gốc cây tại vị trí tem bị hỏng; có lý do văn bản; tùy chọn nhập mã dập nổi đối chiếu của cây được giao.
- **Action / Trigger:** Nhân viên gửi báo cáo sự cố tem QR.
- **Expected Result:** `SiteVerification.identityStatus = IDENTITY_EXCEPTION`; lưu vết ảnh tem hỏng, lý do và mã đối chiếu. Cây mục tiêu `task.treeId` giữ nguyên bất biến. `TaskStatus` giữ nguyên `IN_PROGRESS`.
- **Forbidden Behavior:** Tự ý gán mã QR của cây khác vào thay thế; thay đổi `task.treeId`.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Tem QR rách nát không thể quét, nhân viên chụp ảnh vết rách tại thân cây, nhập mã dập kim loại "TREE-001" và lý do "Tem bị trầy xước".  
  *When:* Gọi `ReportIdentityException`.  
  *Then:* `identityStatus = IDENTITY_EXCEPTION`, dữ liệu ngoại lệ được lưu, `task.treeId` không đổi, `task.status` giữ nguyên `IN_PROGRESS`.
- **Negative Oracle(s):**  
  *Neg 1 (Thiếu ảnh minh chứng):* Báo mất tem nhưng không có ảnh chụp gốc cây $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Nhập mã cây khác):* Nhập mã dập nổi của một cây khác với `task.treeId` $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).
- **Canonical Source:** `WORKFLOWS WF-03`, `ACCESS-CONTROL §4 CMD-OP-06`.

---

### BR-03 — Bắt đầu Thi công Nhiệm vụ (StartTask)
- **Actor:** Field Staff (`staff`)
- **Command:** `StartTask`
- **Owning Context:** `Work Management`
- **Resource:** `Task`
- **Resource Scope:** `task.assignedStaffId == actor.userId`
- **Eligible State:** `TaskStatus = PENDING`
- **Preconditions:** Tài khoản nhân viên đang `ACTIVE`; nhiệm vụ thuộc danh sách phân công của nhân viên.
- **Action / Trigger:** Nhân viên chủ động bấm nút "Bắt đầu làm việc" (`StartTask`).
- **Expected Result:** `TaskStatus` chuyển từ `PENDING` sang `IN_PROGRESS`. Hệ thống chụp bản sao mẫu checklist hiện hành vào `Task.checklistSnapshot`.
- **Forbidden Behavior:** DUY NHẤT lệnh `StartTask` mới được phép chuyển `PENDING -> IN_PROGRESS`. Mở màn hình xem chi tiết task, mở máy ảnh, quét QR hoặc đo GPS **tuyệt đối không được kích hoạt chuyển trạng thái**. Quản lý hoặc Admin gọi `StartTask` bị từ chối 100%.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED` (Chuyển trạng thái nghiệp vụ chuẩn tắc).
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status = PENDING`, `task.assignedStaffId = actor.userId`, tài khoản `ACTIVE`.  
  *When:* Field Staff bấm `StartTask`.  
  *Then:* `task.status = IN_PROGRESS`, `task.checklistSnapshot` được khởi tạo bản chụp từ mẫu checklist, phát sự kiện bàn giao `HO-02`.
- **Negative Oracle(s):**  
  *Neg 1 (Hành vi thụ động):* Nhân viên mở xem màn hình chi tiết hoặc bật camera $\to$ `task.status` bắt buộc vẫn là `PENDING`.  
  *Neg 2 (Sai tác nhân):* Operations Manager hoặc Platform Admin bấm `StartTask` $\to$ Bị từ chối (`ROLE_NOT_ALLOWED`).  
  *Neg 3 (Nhân viên khác gọi):* `actor.userId != task.assignedStaffId` $\to$ Bị từ chối (`RESOURCE_SCOPE_MISMATCH`).
- **Canonical Source:** `WORKFLOWS WF-02`, `ACCESS-CONTROL §4 CMD-OP-02`, `DOMAIN §4 DR-MVP-04`.

---

### BR-04 — Thu thập Bằng chứng Hồ sơ CHANGE_PROOF (CaptureProofEvidence)
- **Actor:** Field Staff (`staff`)
- **Command:** `CaptureProofEvidence`, `CompleteChecklist`
- **Owning Context:** `Work Management`
- **Resource:** `TaskEvidence`, `Task`
- **Resource Scope:** `task.assignedStaffId == actor.userId`
- **Eligible State:** `TaskStatus = IN_PROGRESS`
- **Preconditions:** Nhiệm vụ được gán `ProofProfile = CHANGE_PROOF`; Camera granted.
- **Action / Trigger:** Nhân viên chụp ảnh Trước (`beforePhoto`), tích hoàn thành 100% tiêu chí trong `ChecklistSnapshot`, và chụp ảnh Sau (`afterPhoto`) tại góc tương tự.
- **Expected Result:** Ghi nhận đầy đủ chuỗi 3 thành phần bằng chứng: `beforePhoto` (kèm timestamp/coords), `completedChecklistItems` (100%), `afterPhoto` (kèm timestamp/coords). Tiến độ bằng chứng chuyển sang sẵn sàng nộp. `TaskStatus` giữ nguyên `IN_PROGRESS`.
- **Forbidden Behavior:** Bỏ qua ảnh Trước rồi cắt tỉa sau đó mới chụp; tải ảnh từ thư viện thiết bị cũ; ngụy tạo ảnh chụp màn hình (`DR-HARD-04`). Quản lý không được tùy tiện hạ cấp sang `SERVICE_PROOF`.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status = IN_PROGRESS`, `task.proofProfile = CHANGE_PROOF`.  
  *When:* Nhân viên chụp ảnh Trước $\to$ tích 5/5 mục checklist $\to$ chụp ảnh Sau.  
  *Then:* Bản nháp bằng chứng ghi nhận đủ 3 thành phần, sẵn sàng cho lệnh `SubmitEvidence`.
- **Negative Oracle(s):**  
  *Neg 1 (Thiếu ảnh Trước):* Nhân viên chỉ có ảnh Sau và checklist $\to$ Không đủ điều kiện nộp duyệt.  
  *Neg 2 (Chưa hoàn tất checklist):* Mới hoàn thành 4/5 mục checklist $\to$ Không cho phép nộp duyệt (`PRECONDITION_NOT_MET`).
- **Canonical Source:** `WORKFLOWS WF-04`, `ACCESS-CONTROL §4 CMD-OP-07`, `DOMAIN §3 ProofProfile`.

---

### BR-04b — Thu thập Bằng chứng Hồ sơ SERVICE_PROOF (CaptureProofEvidence)
- **Actor:** Field Staff (`staff`)
- **Command:** `CaptureProofEvidence`, `CompleteChecklist`
- **Owning Context:** `Work Management`
- **Resource:** `TaskEvidence`, `Task`
- **Resource Scope:** `task.assignedStaffId == actor.userId`
- **Eligible State:** `TaskStatus = IN_PROGRESS`
- **Preconditions:** Nhiệm vụ được gán `ProofProfile = SERVICE_PROOF`; Camera granted.
- **Action / Trigger:** Nhân viên thực hiện dịch vụ, hoàn thành 100% tiêu chí `ChecklistSnapshot`, và chụp 01 ảnh Hoàn thành (`completionPhoto`).
- **Expected Result:** Ghi nhận đầy đủ: 100% checklist và 01 ảnh hoàn thành. Không bắt buộc và không đòi hỏi ảnh Trước (`beforePhoto`). `TaskStatus` giữ nguyên `IN_PROGRESS`.
- **Forbidden Behavior:** Đòi hỏi ảnh Trước đối với dịch vụ bôi vôi, tưới nước; nộp bài khi thiếu ảnh hoàn thành.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status = IN_PROGRESS`, `task.proofProfile = SERVICE_PROOF`.  
  *When:* Nhân viên tích đủ 100% checklist dịch vụ và chụp 01 ảnh hoàn thành tại gốc cây.  
  *Then:* Hồ sơ bằng chứng hợp lệ 100% mà không cần ảnh Trước.
- **Negative Oracle(s):**  
  *Neg 1 (Thiếu ảnh hoàn thành):* Đã tích 100% checklist nhưng không có ảnh hoàn thành $\to$ Không đủ điều kiện nộp (`PRECONDITION_NOT_MET`).
- **Canonical Source:** `WORKFLOWS WF-04`, `ACCESS-CONTROL §4 CMD-OP-07`.

---

### BR-04c — Thu thập Bằng chứng Hồ sơ INSPECTION_PROOF (CaptureProofEvidence)
- **Actor:** Field Staff (`staff`)
- **Command:** `RecordStructuredFindings`, `CaptureProofEvidence`
- **Owning Context:** `Work Management`
- **Resource:** `TaskEvidence`, `Task`
- **Resource Scope:** `task.assignedStaffId == actor.userId`
- **Eligible State:** `TaskStatus = IN_PROGRESS`
- **Preconditions:** Nhiệm vụ được gán `ProofProfile = INSPECTION_PROOF`; Camera granted.
- **Action / Trigger:** Nhân viên điền bảng kết quả khám bệnh có cấu trúc (`StructuredFindings` theo Fixed Schema) và chụp tối thiểu 01 ảnh hiện trạng khuyết tật/sâu bệnh (`conditionPhotos[]`).
- **Expected Result:** Ghi nhận đầy đủ: Site Verification + Bảng phát hiện có cấu trúc (`StructuredFindings`) + Danh sách ảnh hiện trạng. Không sử dụng checklist thao tác chung chung. `TaskStatus` giữ nguyên `IN_PROGRESS`.
- **Forbidden Behavior:** Biến bảng khám bệnh lâm sinh `StructuredFindings` thành tùy chọn không bắt buộc; dùng checklist chung thay thế bảng phát hiện có cấu trúc.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status = IN_PROGRESS`, `task.proofProfile = INSPECTION_PROOF`.  
  *When:* Nhân viên điền bảng khám bệnh (mức độ sâu bệnh, đường kính tán, nghiêng đổ) và chụp 02 ảnh vết nứt thân cây.  
  *Then:* Hồ sơ bằng chứng ghi nhận đầy đủ, đủ điều kiện kích hoạt `SubmitEvidence`.
- **Negative Oracle(s):**  
  *Neg 1 (Bỏ trống Structured Findings):* Nhân viên chụp ảnh nhưng không điền bảng khám bệnh $\to$ Bị từ chối nộp (`PRECONDITION_NOT_MET`).
- **Canonical Source:** `WORKFLOWS WF-04`, `ACCESS-CONTROL §4 CMD-OP-07`.

---

### BR-05 — Báo cáo Sự cố Hiện trường (ReportFieldIssue)
- **Actor:** Field Staff (`staff`)
- **Command:** `ReportFieldIssue`
- **Owning Context:** `Work Management`
- **Resource:** `FieldIssue`, `Task`
- **Resource Scope:** `task.assignedStaffId == actor.userId`
- **Eligible State:** `TaskStatus = IN_PROGRESS`
- **Preconditions:** Xuất hiện chướng ngại vật hoặc sự cố thực địa bất khả kháng; có ảnh chụp hiện trường sự cố; có lý do văn bản không rỗng.
- **Action / Trigger:** Nhân viên bấm nút "Báo cáo sự cố" (`ReportFieldIssue`).
- **Expected Result:** `TaskStatus` chuyển từ `IN_PROGRESS` sang `BLOCKED`. Tạo thực thể `FieldIssue` gắn với Task; phát tín hiệu bàn giao `HO-03` sang hàng đợi giải quyết của Quản lý vận hành.
- **Forbidden Behavior:** Gọi `ReportFieldIssue` khi task đang ở `REWORK_REQUIRED` (`P4-SC-01`); gọi lệnh khi task ở `PENDING` hoặc `WAITING_REVIEW`; báo sự cố mà không có ảnh minh chứng hoặc không có lý do.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED` (Lưu vết trực tiếp trong thực thể Task và FieldIssue).
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status = IN_PROGRESS`, nhân viên gặp tổ ong vò vẽ trên thân cây, chụp ảnh tổ ong và nhập lý do "Tổ ong hung dữ không thể trèo cây".  
  *When:* Nhân viên gọi `ReportFieldIssue`.  
  *Then:* `task.status` chuyển thành `BLOCKED`, tạo bản ghi `FieldIssue`, gửi cảnh báo tới Quản lý (`HO-03`).
- **Negative Oracle(s):**  
  *Neg 1 (Gọi từ REWORK_REQUIRED):* `task.status = REWORK_REQUIRED` $\to$ Gọi `ReportFieldIssue` bị từ chối 100% (`INVALID_TASK_STATE` / `P4-SC-01`).  
  *Neg 2 (Thiếu ảnh sự cố):* Không cung cấp ảnh chụp hiện trường $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).
- **Canonical Source:** `WORKFLOWS WF-08`, `ACCESS-CONTROL §3, §4 CMD-OP-08`, `P4-SC-01`.

---

### BR-05b — Giải tỏa Sự cố Hiện trường (ResumeBlockedTask / ReassignTask / CancelTask)
- **Actor:** Operations Manager (`manager`)
- **Command:** `ResumeBlockedTask` | `ReassignTask` (Case B) | `CancelTask`
- **Owning Context:** `Work Management`
- **Resource:** `Task`, `FieldIssue`
- **Resource Scope:** `AUTHORIZED_OPERATIONAL_SCOPE`
- **Eligible State:** `TaskStatus = BLOCKED`
- **Preconditions:** Nhiệm vụ đang ở trạng thái `BLOCKED` thuộc phạm vi quản lý của Quản lý.
- **Action / Trigger:** Quản lý lựa chọn chính xác 1 trong 3 lối thoát chuẩn tắc:
  1. `ResumeBlockedTask`: Chướng ngại vật đã giải tỏa $\to$ `TaskStatus` chuyển sang `IN_PROGRESS` (cho nhân viên cũ tiếp tục).
  2. `ReassignTask` (Case B): Nhân viên cũ không thể tiếp tục $\to$ chọn nhân sự mới `ACTIVE` $\to$ `TaskStatus` chuyển sang `PENDING`. Bảo toàn 100% quyền tác giả của bằng chứng cũ.
  3. `CancelTask`: Sự cố bất khả kháng không thể thi công $\to$ nhập lý do $\to$ `TaskStatus` chuyển sang `CANCELLED`.
- **Expected Result:** `TaskStatus` chuyển dịch tất định về đúng 1 trong 3 trạng thái: `IN_PROGRESS`, `PENDING`, hoặc `CANCELLED`.
- **Forbidden Behavior:** Tồn tại lối thoát thứ 4 từ `BLOCKED` (như chuyển trực tiếp `BLOCKED -> COMPLETED` hoặc `BLOCKED -> WAITING_REVIEW`); Field Staff tự ý Resume hoặc tự Reassign khi đang `BLOCKED`.
- **Audit Expectation:** `AUDIT_REQUIRED` cho trường hợp `CancelTask` và `ReassignTask`; `NO_BUSINESS_AUDIT_REQUIRED` cho `ResumeBlockedTask`.
- **MVP Classification:** `MVP`
- **Positive Oracle (Resume):**  
  *Given:* `task.status = BLOCKED`, Quản lý xác nhận rào chắn thi công đã dỡ bỏ.  
  *When:* Quản lý gọi `ResumeBlockedTask`.  
  *Then:* `task.status = IN_PROGRESS`, nhân viên cũ tiếp tục thực hiện (`HO-04`).
- **Positive Oracle (Reassign Case B):**  
  *Given:* `task.status = BLOCKED`, nhân viên cũ bị chấn thương, Quản lý chọn nhân sự mới "STAFF-002" đang `ACTIVE`.  
  *When:* Quản lý gọi `ReassignTask`.  
  *Then:* `task.status = PENDING`, `task.assignedStaffId = "STAFF-002"`, quyền tác giả của các ảnh cũ do nhân viên ban đầu chụp giữ nguyên vẹn.
- **Negative Oracle(s):**  
  *Neg 1 (Chuyển sai trạng thái):* Quản lý duyệt hoàn thành trực tiếp từ `BLOCKED` $\to$ Bị từ chối (`INVALID_TASK_STATE`).  
  *Neg 2 (Staff tự mở lại):* Field Staff bấm tiếp tục khi task đang `BLOCKED` $\to$ Bị từ chối (`ROLE_NOT_ALLOWED`).
- **Canonical Source:** `WORKFLOWS WF-08`, `ACCESS-CONTROL §3, §4 CMD-OP-14, 16, 17`.

---

### BR-06 — Nộp Chuỗi Bằng chứng Nghiệm thu (SubmitEvidence)
- **Actor:** Field Staff (`staff`)
- **Command:** `SubmitEvidence`
- **Owning Context:** `Work Management`
- **Resource:** `Task`, `ProofProgress`
- **Resource Scope:** `task.assignedStaffId == actor.userId`
- **Eligible State:** `TaskStatus = IN_PROGRESS`
- **Preconditions:** Hồ sơ bằng chứng đạt 100% tiêu chuẩn theo `ProofProfile` được giao (ảnh, checklist/findings, xác thực GPS và QR/Ngoại lệ).
- **Action / Trigger:** Nhân viên bấm nút "Gửi duyệt kết quả" (`SubmitEvidence`).
- **Expected Result:**  
  - *Trường hợp Trực tuyến (Online):* Máy chủ chấp thuận dữ liệu $\to$ `TaskStatus` chuyển từ `IN_PROGRESS` sang `WAITING_REVIEW`. Đưa task vào hàng đợi thẩm định của Quản lý (`HO-05`).  
  - *Trường hợp Ngoại tuyến (Offline `WF-18`):* Gói tin lưu vào Outbox cục bộ, thiết bị đặt `LocalSubmissionStatus = PENDING_SYNC`. **Trên máy chủ, `TaskStatus` BẮT BUỘC VẪN LÀ `IN_PROGRESS`**. Sau khi có mạng và máy chủ xác nhận tiếp nhận trọn vẹn $\to$ `TaskStatus` mới chuyển sang `WAITING_REVIEW` và `SyncStatus = SYNCED`.
- **Forbidden Behavior:** Nộp hồ sơ khi thiếu bằng chứng hoặc thiếu xác thực vị trí/danh tính; xuất hiện trạng thái giả lập `"OFFLINE_SUBMITTED"` tại `TaskStatus` của máy chủ.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle (Online):**  
  *Given:* `task.status = IN_PROGRESS`, đủ 100% bằng chứng theo Profile, thiết bị online.  
  *When:* Nhân viên gọi `SubmitEvidence`.  
  *Then:* Máy chủ chấp thuận, `task.status` chuyển thành `WAITING_REVIEW`, hiển thị trên hàng đợi Quản lý.
- **Positive Oracle (Offline WF-18):**  
  *Given:* `task.status = IN_PROGRESS`, đủ 100% bằng chứng, thiết bị ngắt kết nối mạng.  
  *When:* Nhân viên bấm nộp bài.  
  *Then:* `LocalSubmissionStatus = PENDING_SYNC`, máy chủ vẫn duy trì `task.status = IN_PROGRESS`. Khi kết nối khôi phục và sync thành công $\to$ máy chủ chuyển `task.status = WAITING_REVIEW`.
- **Negative Oracle(s):**  
  *Neg 1 (Thiếu bằng chứng):* Chưa chụp ảnh Sau trong hồ sơ `CHANGE_PROOF` $\to$ Bị từ chối nộp bài (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Sinh trạng thái lạ):* Hệ thống sinh `task.status = "OFFLINE_SUBMITTED"` $\to$ Vi phạm bất biến miền (`DR-TECH-01` / P7-NT-18).
- **Canonical Source:** `WORKFLOWS WF-05, WF-18`, `ACCESS-CONTROL §4 CMD-OP-09`, `DOMAIN §4 DR-TECH-01`.

---

### BR-07 — Phê duyệt Chuẩn Đạt 100% (ApproveTask)
- **Actor:** Operations Manager (`manager`)
- **Command:** `ApproveTask`
- **Owning Context:** `Work Management`
- **Resource:** `Task`, `ReviewDecision`
- **Resource Scope:** `AUTHORIZED_OPERATIONAL_SCOPE`
- **Eligible State:** `TaskStatus = WAITING_REVIEW`
- **Preconditions:** Nhiệm vụ thuộc phạm vi quản lý; hồ sơ bằng chứng đạt 100% tiêu chuẩn; `actor.userId != task.assignedStaffId` (Cấm tự duyệt việc của chính mình `DR-HARD-02`).
- **Action / Trigger:** Quản lý ban hành quyết định phê duyệt chuẩn.
- **Expected Result:** `TaskStatus` chuyển từ `WAITING_REVIEW` sang `COMPLETED`. Nhiệm vụ đóng vĩnh viễn (**Terminal Success**, bất biến, cấm sửa đổi). Kích hoạt chiếu dữ liệu sang `CareHistory` (`HO-08`).
- **Forbidden Behavior:** Nhân viên tự duyệt việc của mình (`DR-HARD-02`); Platform Admin duyệt việc thay Quản lý (`BR-DOM-04`); Hệ thống tự động duyệt (`Auto-approval` `DR-POL-01`); mở lại task sau khi đã `COMPLETED`.
- **Audit Expectation:** `AUDIT_REQUIRED` (Lưu vết quyết định nghiệm thu).
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status = WAITING_REVIEW`, `actor.role = manager`, `actor.userId != task.assignedStaffId`, hồ sơ đạt chuẩn 100%.  
  *When:* Quản lý gọi `ApproveTask`.  
  *Then:* `task.status = COMPLETED`, bản ghi `CareHistory` được chiếu thành công, audit event được tạo, task không thể chuyển sang bất kỳ trạng thái nào khác.
- **Negative Oracle(s):**  
  *Neg 1 (Tự duyệt việc):* `actor.userId == task.assignedStaffId` $\to$ Bị từ chối 100% (`DR-HARD-02` / `ACTION_REJECTED_BY_PRODUCT_MODEL`).  
  *Neg 2 (Admin duyệt thay):* `actor.role = admin` $\to$ Bị từ chối 100% (`ROLE_NOT_ALLOWED` / `BR-DOM-04`).  
  *Neg 3 (Sửa task COMPLETED):* Gọi bất kỳ lệnh sửa đổi nào trên task đã `COMPLETED` $\to$ Bị từ chối (`TERMINAL_RESOURCE`).
- **Canonical Source:** `WORKFLOWS WF-06`, `ACCESS-CONTROL §4 CMD-OP-10, §6`, `DOMAIN §4 DR-HARD-02, 05`.

---

### BR-07b — Phê duyệt Có Ngoại lệ (ApproveWithException)
- **Actor:** Operations Manager (`manager`)
- **Command:** `ApproveWithException`
- **Owning Context:** `Work Management`
- **Resource:** `Task`, `ReviewDecision`
- **Resource Scope:** `AUTHORIZED_OPERATIONAL_SCOPE`
- **Eligible State:** `TaskStatus = WAITING_REVIEW`
- **Preconditions:** Nhiệm vụ có ngoại lệ thực địa hợp lý (vị trí GPS trôi hoặc tem QR hỏng đã có biên bản); công việc thực tế đã làm thật; Quản lý chịu trách nhiệm bảo lãnh; có lý do văn bản bắt buộc (`exceptionReason`); `actor.userId != task.assignedStaffId`.
- **Action / Trigger:** Quản lý ban hành quyết định duyệt ngoại lệ.
- **Expected Result:** `TaskStatus` chuyển từ `WAITING_REVIEW` sang `COMPLETED`. Nhiệm vụ đóng vĩnh viễn (**Terminal Success**). Kích hoạt chiếu sang `CareHistory` mang cờ `hasException = true` và bảo lưu toàn bộ tham chiếu ngoại lệ ban đầu (`HO-08`).
- **Forbidden Behavior:** Duyệt ngoại lệ nhưng bỏ trống lý do bảo lãnh; sinh trạng thái riêng mang tên `"COMPLETED_WITH_EXCEPTION"` (phải là `COMPLETED` chuẩn); nhân viên tự duyệt ngoại lệ bài của mình.
- **Audit Expectation:** `AUDIT_REQUIRED` (Lưu vết lý do bảo lãnh ngoại lệ).
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status = WAITING_REVIEW`, task mang `LOCATION_EXCEPTION`, Quản lý nhập lý do bảo lãnh "Đã kiểm tra đối chiếu qua camera an ninh công viên, vị trí chính xác".  
  *When:* Quản lý gọi `ApproveWithException`.  
  *Then:* `task.status = COMPLETED`, sinh `CareHistory` mang cờ `hasException = true`, ghi nhận audit event đầy đủ.
- **Negative Oracle(s):**  
  *Neg 1 (Lý do rỗng):* Lý do bảo lãnh rỗng $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Sinh sai trạng thái):* `task.status` trở thành `"COMPLETED_WITH_EXCEPTION"` $\to$ Vi phạm mô hình 7 trạng thái (`INVALID_TASK_STATE`).
- **Canonical Source:** `WORKFLOWS WF-06`, `ACCESS-CONTROL §4 CMD-OP-11`, `DOMAIN §2 5-Dimensions`.

---

### BR-08 — Yêu cầu Làm lại Có Trọng tâm (RequestRework)
- **Actor:** Operations Manager (`manager`)
- **Command:** `RequestRework`
- **Owning Context:** `Work Management`
- **Resource:** `Task`, `ReviewDecision`
- **Resource Scope:** `AUTHORIZED_OPERATIONAL_SCOPE`
- **Eligible State:** `TaskStatus = WAITING_REVIEW`
- **Preconditions:** Quản lý phát hiện sai sót kỹ thuật; chỉ định chính xác khâu sai sót (`targetedArea`, ví dụ `AFTER_PHOTO` hoặc khâu bón phân trong `CHECKLIST`); có hướng dẫn sửa chữa văn bản không rỗng; `actor.userId != task.assignedStaffId`.
- **Action / Trigger:** Quản lý ban hành quyết định yêu cầu làm lại.
- **Expected Result:** `TaskStatus` chuyển từ `WAITING_REVIEW` sang `REWORK_REQUIRED`. Toàn bộ bằng chứng hợp lệ ban đầu (`Attempt 1`) được bảo lưu nguyên vẹn; nhiệm vụ hiển thị lên đầu danh sách của nhân viên thực hiện (`HO-06`).
- **Forbidden Behavior:** Xóa sạch toàn bộ hồ sơ làm lại từ đầu; bắt nhân viên chụp lại ảnh Trước khi đã cắt tỉa xong; không chỉ định rõ khâu sai sót (`targetedArea`); từ `REWORK_REQUIRED` gọi `ReportFieldIssue` sang `BLOCKED` (`P4-SC-01`).
- **Audit Expectation:** `AUDIT_REQUIRED` (Ghi nhận lý do từ chối và khâu chỉ định làm lại).
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status = WAITING_REVIEW`, ảnh Sau bị mờ, Quản lý chọn `targetedArea = "AFTER_PHOTO"` và ghi chú "Chụp lại ảnh sau góc nhìn rộng hơn".  
  *When:* Quản lý gọi `RequestRework`.  
  *Then:* `task.status = REWORK_REQUIRED`, ảnh Trước và checklist của Attempt 1 được giữ nguyên, task chuyển về nhân viên (`HO-06`).
- **Negative Oracle(s):**  
  *Neg 1 (Bỏ trống khâu chỉ định):* Không khai báo `targetedArea` $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Tự xóa bằng chứng cũ):* Hệ thống tự động xóa bản ghi ảnh Trước của task $\to$ Vi phạm bất biến bằng chứng (`DR-HARD-04`).
- **Canonical Source:** `WORKFLOWS WF-06, WF-07`, `ACCESS-CONTROL §4 CMD-OP-12`, `DOMAIN §4 DR-HARD-04`.

---

### BR-08b — Nộp lại Khâu Làm lại (ResubmitRework)
- **Actor:** Field Staff (`staff`)
- **Command:** `ResubmitRework`
- **Owning Context:** `Work Management`
- **Resource:** `Task`, `TaskEvidence`
- **Resource Scope:** `task.assignedStaffId == actor.userId`
- **Eligible State:** `TaskStatus = REWORK_REQUIRED`
- **Preconditions:** Nhiệm vụ đang ở `REWORK_REQUIRED`; nhân viên đã hoàn thành bổ sung/sửa đổi đúng khâu chỉ định (`targetedArea`).
- **Action / Trigger:** Nhân viên bấm nút "Nộp lại hồ sơ" (`ResubmitRework`).
- **Expected Result:** Hệ thống đóng gói dữ liệu hợp lệ cũ và phần sửa đổi mới thành phiên nộp `Attempt 2`. `TaskStatus` chuyển từ `REWORK_REQUIRED` sang `WAITING_REVIEW` (`HO-07`).
- **Forbidden Behavior:** Sửa các phần bằng chứng không bị yêu cầu sửa; gọi `ResubmitRework` khi chưa cập nhật khâu chỉ định; phân công lại trực tiếp từ `REWORK_REQUIRED`.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status = REWORK_REQUIRED`, `targetedArea = "AFTER_PHOTO"`, nhân viên chụp ảnh Sau mới đạt chất lượng.  
  *When:* Nhân viên bấm `ResubmitRework`.  
  *Then:* Gói bằng chứng Attempt 2 được tạo, `task.status = WAITING_REVIEW`, xuất hiện trở lại tại hàng đợi Quản lý.
- **Negative Oracle(s):**  
  *Neg 1 (Chưa sửa khâu chỉ định):* Bấm resubmit khi chưa chụp lại ảnh Sau $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Gọi Reassign trực tiếp):* Quản lý bấm phân công lại từ `REWORK_REQUIRED` $\to$ Bị từ chối (`DR-HARD-06`).
- **Canonical Source:** `WORKFLOWS WF-07`, `ACCESS-CONTROL §4 CMD-OP-13`.

---

### BR-09 — Hủy Nhiệm vụ Có Lý do (CancelTask)
- **Actor:** Operations Manager (`manager`)
- **Command:** `CancelTask`
- **Owning Context:** `Work Management`
- **Resource:** `Task`
- **Resource Scope:** `AUTHORIZED_OPERATIONAL_SCOPE`
- **Eligible State:** Bất kỳ trạng thái nào **chưa đóng** (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`).
- **Preconditions:** Nhiệm vụ thuộc phạm vi quản lý; có lý do hủy văn bản không rỗng (`cancelReason`).
- **Action / Trigger:** Quản lý ban hành quyết định hủy nhiệm vụ.
- **Expected Result:** `TaskStatus` chuyển sang `CANCELLED`. Nhiệm vụ đóng vĩnh viễn (**Terminal Void**, cấm sửa đổi, cấm phục hồi). Bảo toàn toàn bộ dữ liệu lịch sử phục vụ kiểm toán (`HO-09`). **TUYỆT ĐỐI KHÔNG BAO GIỜ sinh Lịch sử chăm sóc `CareHistory`** (`DR-HARD-07`).
- **Forbidden Behavior:** Hủy task khi đã ở trạng thái đóng `COMPLETED` hoặc `CANCELLED` (`DR-HARD-05`); hủy mà không nhập lý do; sinh bản ghi `CareHistory`; Field Staff hoặc Platform Admin thực hiện hủy task.
- **Audit Expectation:** `AUDIT_REQUIRED` (Lưu vết lý do hủy, tác nhân và thời điểm hủy).
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status = IN_PROGRESS`, công viên có lệnh đóng cửa khẩn cấp do giông bão, Quản lý nhập lý do hủy "Thời tiết nguy hiểm bất khả kháng".  
  *When:* Quản lý gọi `CancelTask`.  
  *Then:* `task.status = CANCELLED`, audit event ghi nhận lý do hủy, không sinh `CareHistory`, task đóng vĩnh viễn.
- **Negative Oracle(s):**  
  *Neg 1 (Hủy task COMPLETED):* `task.status = COMPLETED` $\to$ Gọi `CancelTask` bị từ chối 100% (`TERMINAL_RESOURCE` / `DR-HARD-05`).  
  *Neg 2 (Sinh CareHistory):* Sau khi hủy, hệ thống xuất hiện bản ghi `CareHistory` cho task này $\to$ Vi phạm nghiêm trọng bất biến miền (`DR-HARD-07`).  
  *Neg 3 (Admin hủy task):* Platform Admin gọi `CancelTask` $\to$ Bị từ chối 100% (`BR-DOM-04`).
- **Canonical Source:** `WORKFLOWS WF-09`, `ACCESS-CONTROL §4 CMD-OP-17`, `DOMAIN §4 DR-HARD-05, 07`.

---

### BR-10 — Phân công lại Nhiệm vụ (ReassignTask)
- **Actor:** Operations Manager (`manager`)
- **Command:** `ReassignTask`
- **Owning Context:** `Work Management`
- **Resource:** `Task`
- **Resource Scope:** `AUTHORIZED_OPERATIONAL_SCOPE`
- **Eligible State:** Đúng 2 trường hợp hợp lệ:
  - **Case A:** `TaskStatus = PENDING` $\to$ chuyển sang nhân sự mới, `TaskStatus` giữ nguyên `PENDING`.
  - **Case B:** `TaskStatus = BLOCKED` $\to$ chuyển sang nhân sự mới, `TaskStatus` chuyển về `PENDING`.
- **Preconditions:** Chọn nhân sự mới khác nhân sự hiện tại; nhân sự mới có tài khoản `ACTIVE` và mang vai trò `staff`; bảo toàn quyền tác giả của bằng chứng cũ nếu có.
- **Action / Trigger:** Quản lý thực hiện điều chuyển phân công.
- **Expected Result:** Cập nhật `task.assignedStaffId = newStaffId`. Nhiệm vụ xuất hiện trên danh sách của nhân viên mới.
- **Forbidden Behavior:** Phân công lại trực tiếp khi task đang `IN_PROGRESS` (`DR-HARD-06`); phân công lại khi đang `WAITING_REVIEW` hoặc `REWORK_REQUIRED`; phân công lại khi task đã `COMPLETED` hoặc `CANCELLED`; gán cho nhân viên đang bị khóa (`SUSPENDED`).
- **Audit Expectation:** `AUDIT_REQUIRED` (Lưu vết điều phối nhân sự).
- **MVP Classification:** `MVP`
- **Positive Oracle (Case A):**  
  *Given:* `task.status = PENDING`, `task.assignedStaffId = "STAFF-A"`, chọn nhân viên "STAFF-B" (`ACTIVE`).  
  *When:* Quản lý gọi `ReassignTask`.  
  *Then:* `task.assignedStaffId = "STAFF-B"`, `task.status` giữ nguyên `PENDING`.
- **Negative Oracle(s):**  
  *Neg 1 (Phân công lại khi IN_PROGRESS):* `task.status = IN_PROGRESS` $\to$ Gọi `ReassignTask` bị từ chối 100% (`INVALID_TASK_STATE` / `DR-HARD-06`). Phải qua quy trình `ReportFieldIssue` $\to$ `BLOCKED` $\to$ Reassign Case B.  
  *Neg 2 (Gán cho tài khoản SUSPENDED):* Chọn nhân sự mới đang bị khóa $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).
- **Canonical Source:** `WORKFLOWS WF-01, WF-08`, `ACCESS-CONTROL §4 CMD-OP-15, 16`, `DOMAIN §4 DR-HARD-06`.

---

### BR-11 — Chiếu Lịch sử Chăm sóc Cây xanh (ProjectCareHistory)
- **Actor:** `System` (Tác nhân kỹ thuật tự động hóa tất định)
- **Command:** `ProjectCareHistory` (Automation Projection)
- **Owning Context:** `Tree Asset Registry` (Tiếp nhận từ `Work Management`)
- **Resource:** `CareHistory`, `Tree`
- **Resource Scope:** Hệ thống nội bộ
- **Eligible State:** Kích hoạt duy nhất khi `TaskStatus` vừa chuyển sang `COMPLETED`.
- **Preconditions:** Nhiệm vụ đã hoàn tất phê duyệt chính thức qua `ApproveTask` hoặc `ApproveWithException`.
- **Action / Trigger:** Hệ thống phát hiện sự kiện đóng thành công nhiệm vụ (`HO-08`).
- **Expected Result:** Tạo mới một bản ghi `CareHistory` gắn với cây `task.treeId`: lưu loại việc, ngày hoàn thành, người thực hiện, người duyệt, đường dẫn bằng chứng tiêu biểu, và cờ ngoại lệ (`hasException`) nếu duyệt ngoại lệ.
- **Forbidden Behavior:** Sinh bản ghi `CareHistory` khi task ở các trạng thái: `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, hoặc `CANCELLED` (`DR-HARD-07`). Xóa hoặc sửa đổi bản ghi `CareHistory` lịch sử.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED` (Là hình chiếu dữ liệu tất định từ Work Management).
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status` chuyển từ `WAITING_REVIEW` sang `COMPLETED` kèm cờ ngoại lệ vị trí.  
  *When:* Hệ thống thực hiện chiếu `ProjectCareHistory`.  
  *Then:* Thực thể `CareHistory` tương ứng với `treeId` được tạo mới, chứa thông tin nghiệm thu và cờ `hasException = true`.
- **Negative Oracle(s):**  
  *Neg 1 (Chiếu từ CANCELLED):* Task bị hủy chuyển sang `CANCELLED` $\to$ Chiếu CareHistory bị từ chối/không kích hoạt (`DR-HARD-07`).  
  *Neg 2 (Chiếu từ IN_PROGRESS):* Task đang làm dở $\to$ Tuyệt đối không có bản ghi CareHistory nào được sinh ra.
- **Canonical Source:** `WORKFLOWS WF-06, HO-08`, `DOMAIN §4 DR-HARD-07`.

---

### BR-12 — Khởi tạo Nhiệm vụ Gắn TaskType $\to$ Profile (CreateTask)
- **Actor:** Operations Manager (`manager`)
- **Command:** `CreateTask`
- **Owning Context:** `Work Management`
- **Resource:** `Task`, `Tree`
- **Resource Scope:** `AUTHORIZED_OPERATIONAL_SCOPE`
- **Eligible State:** Khởi tạo mới (Initial creation)
- **Preconditions:** Cây mục tiêu tồn tại và không ở trạng thái `RETIRED`; nhân viên thực hiện mang vai trò `staff` và đang `ACTIVE`; loại việc `taskTypeId` đang ở trạng thái `ACTIVE` trong Catalog; hạn chót là thời điểm trong tương lai.
- **Action / Trigger:** Quản lý bấm nút tạo nhiệm vụ.
- **Expected Result:** Khởi tạo thực thể `Task` ở trạng thái `PENDING`. Hệ thống tự động ánh xạ tất định `TaskType -> ProofProfile` theo chính sách hiện hành và snapshot `policyVersionId` cùng `treeIdSnapshot`. Nhiệm vụ xuất hiện trên hàng đợi nhân viên (`HO-01`).
- **Forbidden Behavior:** Quản lý tự ý hạ cấp `ProofProfile` trên từng task đơn lẻ (`DR-MVP-02`); tạo việc cho cây đã bị thanh lý (`RETIRED`); gán việc cho nhân viên đang bị khóa (`SUSPENDED`); Platform Admin tạo task vận hành (`BR-DOM-04`).
- **Audit Expectation:** `AUDIT_REQUIRED` (Ghi nhận quyết định phân bổ công việc của Quản lý).
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `tree.status = ACTIVE`, `taskType.status = ACTIVE`, `proofProfile = CHANGE_PROOF`, nhân viên `ACTIVE`, hạn chót ngày mai.  
  *When:* Quản lý bấm `CreateTask`.  
  *Then:* `task.status = PENDING`, `task.proofProfile = CHANGE_PROOF`, lưu `treeIdSnapshot`, phát sự kiện `HO-01`, ghi nhận audit log.
- **Negative Oracle(s):**  
  *Neg 1 (Tạo việc cho cây RETIRED):* Cây mục tiêu đã bị đốn hạ `RETIRED` $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Quản lý tự đổi Profile):* Quản lý gửi request ép đổi từ `CHANGE_PROOF` sang `SERVICE_PROOF` $\to$ Bị từ chối (`DR-MVP-02`).  
  *Neg 3 (Admin tạo việc):* Platform Admin gọi `CreateTask` $\to$ Bị từ chối 100% (`ROLE_NOT_ALLOWED` / `BR-DOM-04`).
- **Canonical Source:** `WORKFLOWS WF-01`, `ACCESS-CONTROL §4 CMD-OP-01`, `DOMAIN §4 DR-MVP-02`.

---

### BR-13 — Tra cứu Thông tin Cây qua Mã QR (LookupTreeByQr)
- **Actor:** Field Staff (`staff`), Operations Manager (`manager`)
- **Command:** `LookupTreeByQr` (Query)
- **Owning Context:** `Tree Asset Registry`
- **Resource:** `Tree`, `CareHistory`
- **Resource Scope:** Được phép truy vấn đọc trên toàn bộ cây xanh hợp lệ
- **Eligible State:** `NOT_APPLICABLE` (Thao tác đọc)
- **Preconditions:** Camera granted; mã QR quét được tồn tại trong cơ sở dữ liệu Sổ bộ Cây xanh.
- **Action / Trigger:** Người dùng quét mã tem QR trên thân cây để tra cứu hồ sơ.
- **Expected Result:** Trả về thông tin chi tiết: mã định danh `treeId`, chủng loại thực vật, tọa độ GPS chuẩn, chiều cao, đường kính tán, trạng thái sức khỏe, và toàn bộ danh sách lịch sử chăm sóc đã hoàn tất (`CareHistory`).
- **Forbidden Behavior:** Thao tác tra cứu làm thay đổi bất kỳ trường dữ liệu nào của thực thể `Tree` hoặc `CareHistory`; quét mã QR không tồn tại mà báo lỗi sập ứng dụng.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED` (Truy vấn chỉ-đọc thông thường).
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `tree.qrCode = "QR-001"`, cây có 2 bản ghi `CareHistory` hoàn thành.  
  *When:* Staff hoặc Manager quét mã "QR-001".  
  *Then:* Giao diện hiển thị đúng hồ sơ cây và 2 bản ghi lịch sử chăm sóc, dữ liệu cây không đổi.
- **Negative Oracle(s):**  
  *Neg 1 (Mã không tồn tại):* Quét mã lạ chưa có trong hệ thống $\to$ Trả về thông báo không tìm thấy cây, không đột biến dữ liệu.
- **Canonical Source:** `ACCESS-CONTROL §2.1`, `PRODUCT §4 CAP-04`.

---

## 7. Bảng Chuẩn Nghiệm thu Quản trị Nền tảng (Platform Governance Requirements)

### BR-ACT-01 — Mô hình Tác nhân Chuẩn tắc & Phân tầng Thẩm quyền
- **Actor:** `System` / `Platform Administrator`
- **Command:** Khởi tạo kiến trúc phân quyền
- **Owning Context:** `IAM / Governance Plane`
- **Resource:** `UserRole`, `Actor`
- **Resource Scope:** Toàn hệ thống
- **Eligible State:** `NOT_APPLICABLE`
- **Preconditions:** Cấu hình hệ sinh thái tác nhân ban đầu.
- **Action / Trigger:** Thiết lập cơ chế kiểm soát truy cập và định danh vai trò người dùng.
- **Expected Result:** Hệ thống phân tách rành mạch đúng 3 vai trò con người (`Field Staff` / `staff`, `Operations Manager` / `manager`, `Platform Administrator` / `admin`) và 1 tác nhân tự động hóa kỹ thuật (`System`). Áp dụng nguyên tắc **Không có kế thừa cấp bậc (No Role Inheritance)**: Admin không tự động có quyền của Manager; Manager không làm thay việc của Staff. `System` không phải là `UserRole`.
- **Forbidden Behavior:** Thiết lập mô hình phân cấp `Admin > Manager > Staff`; cho phép người dùng tự đăng ký tài khoản tự do ngoài màn hình đăng nhập; gán vai trò `System` cho tài khoản người dùng con người.
- **Audit Expectation:** `AUDIT_REQUIRED` khi khởi tạo hoặc thay đổi cấu hình vai trò.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Hệ thống tiếp nhận thông tin người dùng với vai trò `staff`.  
  *When:* Đánh giá quyền kích hoạt `CreateTask`.  
  *Then:* Kết quả là `DENY` vì vai trò `staff` không sở hữu năng lực giao việc.
- **Negative Oracle(s):**  
  *Neg 1 (Kế thừa quyền Admin):* Tài khoản `admin` cố gắng gọi lệnh `StartTask` hoặc `ApproveTask` $\to$ Bị từ chối 100% (`ROLE_NOT_ALLOWED` / No Inheritance).  
  *Neg 2 (Tạo tài khoản role System):* Yêu cầu cấp tài khoản người dùng với vai trò `System` $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).
- **Canonical Source:** `ACCESS-CONTROL §1, §2`, `PRODUCT §2 Actor Registry`, `02-ACTOR-DECISION`.

---

### BR-ADM-01 — Khởi tạo Tài khoản Người dùng Mới (ProvisionUser)
- **Actor:** Platform Administrator (`admin`)
- **Command:** `ProvisionUser`
- **Owning Context:** `Identity & Access Management (IAM)`
- **Resource:** `User`, `Account`, `RoleAssignment`
- **Resource Scope:** `PLATFORM_GOVERNANCE_SCOPE`
- **Eligible State:** `NOT_APPLICABLE` (Khởi tạo tài khoản mới)
- **Preconditions:** Admin thực hiện đang ở trạng thái `ACTIVE`; thông tin định danh (Email hoặc Số điện thoại) chưa từng tồn tại trong hệ thống; vai trò chỉ định thuộc tập hợp hợp lệ (`staff`, `manager`, `admin`).
- **Action / Trigger:** Admin nhập thông tin định danh, chọn vai trò ban đầu và gửi lệnh khởi tạo.
- **Expected Result:** Tạo thực thể `User` và `Account` ở trạng thái `INVITED` hoặc `ACTIVE`; lưu vết vai trò ban đầu vào `RoleAssignment`; phát sự kiện kích hoạt tài khoản an toàn tới kênh liên lạc của người dùng; phát sinh bản ghi `AuditEvent` đầy đủ thông tin (Admin, đối tượng, vai trò, thời gian). **Admin tuyệt đối không bao giờ nhận hoặc nhìn thấy mật khẩu dạng rõ**.
- **Forbidden Behavior:** Cho phép Operations Manager hoặc Field Staff khởi tạo tài khoản người dùng; cho phép người dùng tự đăng ký tự do; Admin nhìn thấy mật khẩu dạng rõ; tạo trùng lặp email/số điện thoại đã có.
- **Audit Expectation:** `AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `actor.role = admin`, email "staff1@novyx.vn" chưa tồn tại, vai trò chọn `staff`.  
  *When:* Admin gọi `ProvisionUser`.  
  *Then:* Bản ghi `User` và `Account` được tạo với trạng thái `INVITED`/`ACTIVE`, gửi cơ chế thiết lập mật khẩu an toàn tới người dùng, Admin không nhận được mật khẩu rõ, `AuditEvent` được lưu vào kho Append-Only.
- **Negative Oracle(s):**  
  *Neg 1 (Trùng định danh):* Khởi tạo với email đã tồn tại $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Manager tạo tài khoản):* Operations Manager gọi `ProvisionUser` $\to$ Bị từ chối 100% (`ROLE_NOT_ALLOWED`).  
  *Neg 3 (Mật khẩu dạng rõ):* Phản hồi trả về thông tin mật khẩu ban đầu dạng rõ $\to$ Vi phạm tiêu chuẩn an ninh nghiệp vụ.
- **Canonical Source:** `WORKFLOWS WF-10`, `ACCESS-CONTROL §5 CMD-ADM-01`, `PRODUCT §4 CAP-ADM-01`.

---

### BR-ADM-02 — Điều chỉnh Vai trò Người dùng & Đối soát Trách nhiệm (AssignRole)
- **Actor:** Platform Administrator (`admin`)
- **Command:** `AssignRole`
- **Owning Context:** `Identity & Access Management (IAM)`
- **Resource:** `RoleAssignment`, `User`
- **Resource Scope:** `PLATFORM_GOVERNANCE_SCOPE`
- **Eligible State:** `AccountStatus = ACTIVE`
- **Preconditions:** Admin thực hiện `ACTIVE`; đối tượng được sửa tồn tại và đang `ACTIVE`; `actor.userId != targetUserId` (Admin cấm tự đổi quyền của chính mình `ADM-SOD-01`); vai trò mới hợp lệ; hoàn tất đối soát trách nhiệm dở dang (`Role Change Impact Check`).
- **Action / Trigger:** Admin chọn người dùng, chọn vai trò mới và nhập lý do văn bản bắt buộc.
- **Expected Result:**  
  - Nếu còn tồn đọng trách nhiệm tác nghiệp xung đột: Ghi nhận điều kiện quy trình `ROLE_CHANGE_PENDING_OPERATIONAL_HANDOFF`; phát tín hiệu sang Quản lý vận hành giải tỏa (`HO-12`); vai trò mới **chưa có hiệu lực**.  
  - Khi toàn bộ trách nhiệm đã được giải tỏa: Cập nhật `User.role = newRole`; lưu lịch sử phân quyền cũ vào `RoleAssignment`; bảo toàn toàn bộ quyền tác giả của các bằng chứng đã làm trong quá khứ; phát sinh bản ghi `AuditEvent` ghi nhận tác nhân, đối tượng, vai trò cũ, vai trò mới, lý do và thời gian. Thẩm quyền phiên làm việc hiện thời với các đặc quyền cũ bị thu hồi.
- **Forbidden Behavior:** Admin tự thay đổi vai trò của chính mình (`ADM-SOD-01`); Manager tự phân vai trò cho nhân viên; vai trò mới có hiệu lực ngay khi chưa bàn giao trách nhiệm tác nghiệp đang dở dang; xóa bỏ lịch sử vai trò cũ.
- **Audit Expectation:** `AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `actor.role = admin`, `target.role = staff`, nhân viên không còn nắm giữ task `PENDING` hoặc `IN_PROGRESS`, Admin nhập lý do "Thăng chức lên Quản lý vận hành tuyến 1".  
  *When:* Admin gọi `AssignRole(targetUserId, manager)`.  
  *Then:* `target.role` cập nhật thành `manager`, lưu vết lịch sử vai trò, ghi sự kiện kiểm toán `AUDIT_REQUIRED`.
- **Negative Oracle(s):**  
  *Neg 1 (Admin tự đổi quyền):* `actor.userId == targetUserId` $\to$ Bị từ chối 100% (`ADM-SOD-01` / `ACTION_REJECTED_BY_PRODUCT_MODEL`).  
  *Neg 2 (Chưa giải tỏa việc dở dang):* Nhân viên đang nắm giữ task `IN_PROGRESS` $\to$ Không kích hoạt ngay vai trò mới; thiết lập điều kiện chờ bàn giao `ROLE_CHANGE_PENDING_OPERATIONAL_HANDOFF` (`PRECONDITION_NOT_MET`).  
  *Neg 3 (Manager đổi quyền):* Operations Manager gọi `AssignRole` $\to$ Bị từ chối (`ROLE_NOT_ALLOWED`).
- **Canonical Source:** `WORKFLOWS WF-11`, `ACCESS-CONTROL §5 CMD-ADM-02, §6`, `P5-SC-02`.

---

### BR-ADM-02b — Chống Tự Duyệt Bài Lịch sử khi Thăng chức (DR-HARD-02 Separation)
- **Actor:** `System` / `Operations Manager`
- **Command:** Gác cổng thẩm định nghiệm thu (`ApproveTask`, `ApproveWithException`, `RequestRework`)
- **Owning Context:** `Work Management`
- **Resource:** `Task`, `ReviewDecision`
- **Resource Scope:** `AUTHORIZED_OPERATIONAL_SCOPE`
- **Eligible State:** `TaskStatus = WAITING_REVIEW`
- **Preconditions:** Người dùng User A trước đây từng là Field Staff thực hiện/nộp bằng chứng cho Task X (`executedBy = User A`), nay được thăng chức thành Operations Manager.
- **Action / Trigger:** User A (nay là Manager) mở hàng đợi và bấm duyệt hoặc yêu cầu sửa Task X.
- **Expected Result:** Hệ thống **TỪ CHỐI 100%** hành vi tự thẩm định này theo bất biến `DR-HARD-02`. Task X bắt buộc phải do một Operations Manager khác thẩm định và phê duyệt. Quyền tác giả lịch sử của User A trên Task X giữ nguyên bất biến.
- **Forbidden Behavior:** Cho phép người từng thi công tự duyệt bài của mình sau khi lên chức; sửa đổi thông tin người thi công cũ thành người khác để né tránh kiểm tra.
- **Audit Expectation:** `AUDIT_REQUIRED` khi phát hiện nỗ lực tự duyệt không hợp lệ.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Task X có `executedBy = "USER-001"`. Người dùng "USER-001" nay có vai trò `manager`. Task X được Quản lý "USER-002" mở ra thẩm định.  
  *When:* Quản lý "USER-002" gọi `ApproveTask(Task X)`.  
  *Then:* Phê duyệt thành công, `Task X.status = COMPLETED`.
- **Negative Oracle(s):**  
  *Neg 1 (Tự duyệt sau thăng chức):* Quản lý "USER-001" mở Task X và bấm `ApproveTask` $\to$ Hệ thống chặn đứng, trả về lỗi vi phạm phân tách trách nhiệm (`DR-HARD-02` / P7-NT-19).
- **Canonical Source:** `WORKFLOWS WF-11`, `ACCESS-CONTROL §6`, `DOMAIN §4 DR-HARD-02`, `P5-SC-02`.

---

### BR-ADM-03 — Khóa Tạm thời Tài khoản Người dùng (SuspendAccount)
- **Actor:** Platform Administrator (`admin`)
- **Command:** `SuspendAccount`
- **Owning Context:** `Identity & Access Management (IAM)`
- **Resource:** `Account`
- **Resource Scope:** `PLATFORM_GOVERNANCE_SCOPE`
- **Eligible State:** `AccountStatus = ACTIVE`
- **Preconditions:** Admin thực hiện `ACTIVE`; tài khoản đối tượng đang `ACTIVE`; có lý do văn bản đình chỉ bắt buộc (`suspendReason`).
- **Action / Trigger:** Admin gửi lệnh khóa tạm thời tài khoản.
- **Expected Result:**  
  1. `AccountStatus` chuyển từ `ACTIVE` sang `SUSPENDED`.  
  2. Tài khoản đối tượng **ngay lập tức mất khả năng xác thực** và không thể thực hiện bất kỳ hành động nghiệp vụ có xác thực nào.  
  3. Hệ thống phát sự kiện `USER_NOT_OPERATIONALLY_AVAILABLE` sang bảng điều hành của Quản lý vận hành (`HO-10`).  
  4. **BẤT BIẾN:** IAM và System **TUYỆT ĐỐI KHÔNG tự ý đột biến `TaskStatus`** (các task của nhân sự này giữ nguyên trạng thái hiện tại).  
  5. Ghi nhận sự kiện kiểm toán `AUDIT_REQUIRED`.
- **Forbidden Behavior:** Tự ý đổi `TaskStatus` sang `CANCELLED`, `BLOCKED` hoặc tạo ra enum lạ `"ACCOUNT_SUSPENDED"`; Admin trực tiếp phân công lại task của nhân sự bị khóa; khóa tài khoản mà không có lý do văn bản.
- **Audit Expectation:** `AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `account.status = ACTIVE`, Admin nhập lý do "Đang trong quá trình thanh tra nội bộ".  
  *When:* Admin gọi `SuspendAccount(targetAccountId)`.  
  *Then:* `account.status = SUSPENDED`, đối tượng không thể xác thực vào hệ thống, các task của đối tượng giữ nguyên trạng thái, phát thông báo `HO-10`, tạo audit event.
- **Negative Oracle(s):**  
  *Neg 1 (Tài khoản bị khóa thực hiện lệnh):* Tài khoản đang `SUSPENDED` cố gắng gọi `SubmitEvidence` $\to$ Bị từ chối xác thực 100%.  
  *Neg 2 (Tự đột biến TaskStatus):* Sau lệnh đình chỉ, `task.status` tự động chuyển sang `CANCELLED` $\to$ Vi phạm bất biến miền (`P5-SC-01`).  
  *Neg 3 (Admin tự ý Reassign task):* Platform Admin thực hiện lệnh phân công lại task của người bị khóa $\to$ Bị từ chối (`BR-DOM-04`).
- **Canonical Source:** `WORKFLOWS WF-12`, `ACCESS-CONTROL §5 CMD-ADM-03`, `P5-SC-01`.

---

### BR-ADM-03b — Xử lý Khối lượng Công việc của Nhân sự Bị Khóa (WF-12 Disposition)
- **Actor:** Operations Manager (`manager`)
- **Command:** `ReassignTask` | `CancelTask` | `CreateTask`
- **Owning Context:** `Work Management`
- **Resource:** `Task`
- **Resource Scope:** `AUTHORIZED_OPERATIONAL_SCOPE`
- **Eligible State:** Theo Ma trận Xử lý Khối lượng Công việc chuẩn tắc (`WF-12 Disposition Matrix`)
- **Preconditions:** Quản lý tiếp nhận thông tin sự kiện `USER_NOT_OPERATIONALLY_AVAILABLE` (`HO-10`) về nhân sự bị đình chỉ.
- **Action / Trigger:** Quản lý rà soát và xử lý từng task của nhân sự bị khóa theo đúng thẩm quyền:
  - Task ở `PENDING`: Quản lý thực hiện `ReassignTask (Case A)` sang nhân viên mới `ACTIVE`.
  - Task ở `IN_PROGRESS`: Cấm Reassign trực tiếp. Quản lý thực hiện `CancelTask` có lý do văn bản "Nhân sự bị đình chỉ". Nếu việc cần làm tiếp, Quản lý tạo task thay thế mới qua `WF-01`.
  - Task ở `BLOCKED`: Quản lý thực hiện `ReassignTask (Case B)` sang nhân sự mới hoặc `CancelTask`.
  - Task ở `WAITING_REVIEW`: Giữ nguyên `WAITING_REVIEW`; Quản lý tiến hành thẩm định bình thường (`ApproveTask`, `ApproveWithException`, hoặc `CancelTask`).
  - Task ở `REWORK_REQUIRED`: Cấm Reassign trực tiếp. Quản lý thực hiện `CancelTask` và tạo task thay thế mới nếu cần.
  - Task ở `COMPLETED` / `CANCELLED`: Giữ nguyên vẹn, không can thiệp.
- **Expected Result:** Khối lượng công việc của nhân sự bị khóa được giải tỏa an toàn mà không làm gián đoạn vận hành và không vi phạm bất biến vòng đời nhiệm vụ.
- **Forbidden Behavior:** Quản lý phân công lại trực tiếp khi task đang `IN_PROGRESS` hoặc `REWORK_REQUIRED`; bỏ mặc công việc không xử lý; Admin can thiệp xử lý thay Quản lý.
- **Audit Expectation:** `AUDIT_REQUIRED` cho từng lệnh điều chuyển/hủy.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Nhân sự A bị đình chỉ, có Task 1 (`PENDING`) và Task 2 (`IN_PROGRESS`).  
  *When:* Quản lý thực hiện: (1) `ReassignTask(Task 1, Staff B)`; (2) `CancelTask(Task 2, "Nhân sự bị đình chỉ")` và `CreateTask(Task 2 mới, Staff B)`.  
  *Then:* Cả 2 task được giải tỏa đúng luật, không vi phạm bất biến vòng đời, audit log ghi nhận đầy đủ.
- **Negative Oracle(s):**  
  *Neg 1 (Reassign trực tiếp Task IN_PROGRESS):* Quản lý bấm phân công lại Task 2 đang `IN_PROGRESS` sang Staff B $\to$ Bị từ chối (`DR-HARD-06` / P7-NT-17).
- **Canonical Source:** `WORKFLOWS WF-12 Disposition Matrix`, `P5-SC-01`.

---

### BR-ADM-04 — Mở khóa Tài khoản & Khôi phục Thông tin Xác thực (UnlockAccount / ResetCredentialSetup)
- **Actor:** Platform Administrator (`admin`)
- **Command:** `UnlockAccount` | `ResetCredentialSetup`
- **Owning Context:** `Identity & Access Management (IAM)`
- **Resource:** `Account`
- **Resource Scope:** `PLATFORM_GOVERNANCE_SCOPE`
- **Eligible State:** `AccountStatus = LOCKED` (do nhập sai mật khẩu) hoặc `ACTIVE` / `SUSPENDED`
- **Preconditions:** Admin thực hiện `ACTIVE`; tài khoản đối tượng tồn tại trong hệ thống.
- **Action / Trigger:** Admin gửi lệnh mở khóa tài khoản hoặc gửi yêu cầu thiết lập lại mật khẩu an toàn.
- **Expected Result:**  
  - Với `UnlockAccount`: `AccountStatus` chuyển từ `LOCKED` về `ACTIVE`. Người dùng có thể đăng nhập lại bình thường.  
  - Với `ResetCredentialSetup`: Hệ thống gửi cơ chế thiết lập lại mật khẩu an toàn tới kênh liên lạc đã xác thực của người dùng. **Admin tuyệt đối không nhận được mật khẩu mới dạng rõ**. Ghi nhận `AuditEvent`.
- **Forbidden Behavior:** Admin tự đặt mật khẩu mới rồi đọc mật khẩu đó cho người dùng; mở khóa tài khoản đã bị vô hiệu hóa vĩnh viễn (`DISABLED`) mà không có quy trình phục hồi đặc biệt.
- **Audit Expectation:** `AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Tài khoản bị khóa do nhập sai pass quá số lần cho phép (`status = LOCKED`).  
  *When:* Admin gọi `UnlockAccount(targetAccountId)`.  
  *Then:* `account.status = ACTIVE`, phát sinh audit log, người dùng có thể thực hiện đăng nhập.
- **Negative Oracle(s):**  
  *Neg 1 (Trả về mật khẩu rõ):* Lệnh reset credential trả về chuỗi mật khẩu dạng rõ trên màn hình Admin $\to$ Vi phạm tiêu chuẩn bảo mật nghiệp vụ.
- **Canonical Source:** `WORKFLOWS WF-10, WF-12`, `ACCESS-CONTROL §5 CMD-ADM-06, 07`.

---

### BR-ADM-05 — Tra cứu & Lọc Sổ Nhật ký Kiểm toán (ViewAuditLog / FilterAuditLog)
- **Actor:** Platform Administrator (`admin`)
- **Command:** `ViewAuditLog` | `FilterAuditLog` (Query)
- **Owning Context:** `Audit & Compliance`
- **Resource:** `AuditEvent`
- **Resource Scope:** `PLATFORM_GOVERNANCE_SCOPE`
- **Eligible State:** `NOT_APPLICABLE` (Thao tác đọc)
- **Preconditions:** Admin thực hiện `ACTIVE`.
- **Action / Trigger:** Admin mở phân hệ kiểm toán, áp dụng bộ lọc (theo khoảng thời gian, tác nhân, loại hành động, loại tài nguyên) và tra cứu danh sách bản ghi.
- **Expected Result:** Trả về danh sách các bản ghi `AuditEvent` bất biến từ kho lưu trữ Append-Only: hiển thị timestamp, actorId, actionName, resourceId, và payload tóm lược. Không một bản ghi nào bị ẩn giấu hoặc sai lệch.
- **Forbidden Behavior:** Tồn tại bất kỳ thao tác nào cho phép Admin **sửa (Update), xóa (Delete), viết lại (Rewrite) hoặc thanh trừng (Purge)** bản ghi kiểm toán (`ADM-SOD-03`). Quyền xem kiểm toán không trao quyền can thiệp dữ liệu nghiệp vụ.
- **Audit Expectation:** `AUDIT_REQUIRED` cho các truy vấn tra cứu cấp cao (hoặc ghi nhận lượt truy cập sổ kiểm toán).
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Kho kiểm toán có 100 bản ghi `AuditEvent` được ghi nhận từ các thao tác trước.  
  *When:* Admin gọi `FilterAuditLog(actor = "ADMIN-01", action = "AssignRole")`.  
  *Then:* Trả về chính xác các bản ghi khớp bộ lọc từ kho Append-Only, dữ liệu không bị thay đổi.
- **Negative Oracle(s):**  
  *Neg 1 (Thao tác sửa xóa log):* Admin gửi request cập nhật hoặc xóa một bản ghi `AuditEvent` $\to$ Bị từ chối 100% (`ADM-SOD-03` / `ACTION_REJECTED_BY_PRODUCT_MODEL`).  
  *Neg 2 (Field Staff xem log kiểm toán):* Field Staff cố gắng truy vấn `ViewAuditLog` $\to$ Bị từ chối (`ROLE_NOT_ALLOWED`).
- **Canonical Source:** `WORKFLOWS WF-17`, `ACCESS-CONTROL §5 CMD-ADM-08, 09, §6`, `DOMAIN §3 Audit & Compliance`.

---

### BR-ADM-06 — Tạo Mới Cây trong Sổ bộ Master Data (CreateTree)
- **Actor:** Platform Administrator (`admin`)
- **Command:** `CreateTree`
- **Owning Context:** `Tree Asset Registry`
- **Resource:** `Tree`
- **Resource Scope:** `PLATFORM_GOVERNANCE_SCOPE`
- **Eligible State:** Khởi tạo mới
- **Preconditions:** Admin thực hiện `ACTIVE`; mã định danh `treeId` chưa từng tồn tại (duy nhất); mã tem `qrCode` chưa từng tồn tại (duy nhất); tọa độ GPS chuẩn hợp lệ về định dạng và dải đo trắc địa (**tọa độ không yêu cầu duy nhất toàn cục** `P5-SC-04`).
- **Action / Trigger:** Admin nhập thông tin thực vật học, mã tem QR và tọa độ chuẩn để tạo cây mới.
- **Expected Result:** Tạo thực thể `Tree` ở trạng thái `ACTIVE`; lưu trữ thông tin thực vật học, `qrCode`, tọa độ chuẩn bền vững; phát sinh `AuditEvent` kiểm toán tài sản.
- **Forbidden Behavior:** Tạo cây trùng `treeId` hoặc trùng `qrCode`; từ chối tạo cây chỉ vì tọa độ GPS trùng với một cây khác gần đó (`P5-SC-04` / P7-NT-20); Field Staff hoặc Operations Manager tạo cây master data.
- **Audit Expectation:** `AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `treeId = "TREE-100"` duy nhất, `qrCode = "QR-100"` duy nhất, tọa độ (10.7769, 106.7009) hợp lệ dải trắc địa.  
  *When:* Admin gọi `CreateTree`.  
  *Then:* Bản ghi `Tree` mới được khởi tạo ở trạng thái `ACTIVE`, ghi sự kiện kiểm toán `AUDIT_REQUIRED`.
- **Negative Oracle(s):**  
  *Neg 1 (Trùng qrCode):* `qrCode = "QR-EXISTING"` đã thuộc về cây khác $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Trùng tọa độ không bị chặn):* Cây mới có cùng tọa độ trắc địa với cây bên cạnh $\to$ Lệnh tạo cây vẫn được chấp thuận nếu `treeId` và `qrCode` là duy nhất (`P5-SC-04`).  
  *Neg 3 (Manager tạo cây):* Operations Manager gọi `CreateTree` $\to$ Bị từ chối (`ROLE_NOT_ALLOWED`).
- **Canonical Source:** `WORKFLOWS WF-13`, `ACCESS-CONTROL §5 CMD-ADM-10`, `P5-SC-04`.

---

### BR-ADM-06b — Cấp Đổi Tem QR Bị Hỏng Ngoài Hiện trường (ReplaceTreeQrCode)
- **Actor:** Platform Administrator (`admin`)
- **Command:** `ReplaceTreeQrCode`
- **Owning Context:** `Tree Asset Registry`
- **Resource:** `Tree`
- **Resource Scope:** `PLATFORM_GOVERNANCE_SCOPE`
- **Eligible State:** `TreeStatus = ACTIVE`
- **Preconditions:** Cây mục tiêu tồn tại; tiếp nhận báo cáo ngoại lệ tem hỏng (`IDENTITY_EXCEPTION`); chuỗi `newQrCode` chưa từng được gán cho bất kỳ cây nào khác (duy nhất); có lý do văn bản bắt buộc.
- **Action / Trigger:** Admin gửi lệnh cấp đổi tem QR mới cho cây.
- **Expected Result:** Cập nhật `Tree.qrCode = newQrCode`; **mã định danh `treeId` giữ nguyên bất biến**; **toàn bộ dữ liệu quét QR của các nhiệm vụ lịch sử trong quá khứ giữ nguyên vẹn không bị sửa đổi**; phát sinh bản ghi `AuditEvent`.
- **Forbidden Behavior:** Cấp chuỗi QR đã tồn tại trên cây khác; thay đổi `treeId`; sửa đổi hồi tố dữ liệu lịch sử của các task cũ.
- **Audit Expectation:** `AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Cây "TREE-001" có tem cũ hỏng, Admin cấp mã mới "QR-NEW-999" (chưa gán cho ai) kèm lý do "Tem cũ bị vỡ".  
  *When:* Admin gọi `ReplaceTreeQrCode`.  
  *Then:* `Tree.qrCode` cập nhật thành "QR-NEW-999", `treeId` vẫn là "TREE-001", các task cũ trong quá khứ giữ nguyên mã QR đã quét lúc trước, phát sinh audit event.
- **Negative Oracle(s):**  
  *Neg 1 (Mã mới trùng lặp):* Mã "QR-NEW-999" đã gán cho "TREE-002" $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Đổi luôn treeId):* Thao tác làm thay đổi `treeId` của cây $\to$ Vi phạm bất biến định danh tài sản.
- **Canonical Source:** `WORKFLOWS WF-13`, `ACCESS-CONTROL §5 CMD-ADM-12, §6`.

---

### BR-ADM-06c — Cập nhật Tọa độ Chuẩn Trắc địa (UpdateCanonicalCoordinates)
- **Actor:** Platform Administrator (`admin`)
- **Command:** `UpdateCanonicalCoordinates`
- **Owning Context:** `Tree Asset Registry`
- **Resource:** `Tree`
- **Resource Scope:** `PLATFORM_GOVERNANCE_SCOPE`
- **Eligible State:** `TreeStatus = ACTIVE`
- **Preconditions:** Cây mục tiêu tồn tại; tọa độ mới hợp lệ về mặt trắc địa; có lý do văn bản bắt buộc (ví dụ: biên bản trắc địa đo đạc lại chính xác).
- **Action / Trigger:** Admin gửi lệnh cập nhật tọa độ chuẩn cho cây.
- **Expected Result:** Cập nhật `Tree.canonicalCoordinates = newCoordinates`; **mã định danh `treeId` giữ nguyên bất biến**; **toàn bộ dữ liệu tọa độ thực tế đã đo của các task cũ trong quá khứ giữ nguyên vẹn**; phát sinh `AuditEvent`.
- **Forbidden Behavior:** Cập nhật tọa độ mà không có lý do; yêu cầu tọa độ mới phải là duy nhất toàn cầu (`P5-SC-04`); thay đổi tọa độ của các task đã hoàn thành trong lịch sử.
- **Audit Expectation:** `AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Cây "TREE-001" có biên bản đo trắc địa chuẩn xác mới, tọa độ mới hợp lệ, có lý do văn bản.  
  *When:* Admin gọi `UpdateCanonicalCoordinates`.  
  *Then:* `Tree.canonicalCoordinates` được cập nhật, `treeId` không đổi, các task lịch sử giữ nguyên tọa độ đo cũ, ghi audit log.
- **Negative Oracle(s):**  
  *Neg 1 (Thiếu lý do):* Không nhập lý do cập nhật $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Tọa độ sai dải đo):* Tọa độ kinh độ/vĩ độ nằm ngoài dải hợp lệ $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).
- **Canonical Source:** `WORKFLOWS WF-13`, `ACCESS-CONTROL §5 CMD-ADM-13`, `P5-SC-04`.

---

### BR-ADM-06d — Thanh lý Cây xanh Bị Đốn hạ (RetireTree)
- **Actor:** Platform Administrator (`admin`)
- **Command:** `RetireTree`
- **Owning Context:** `Tree Asset Registry`
- **Resource:** `Tree`
- **Resource Scope:** `PLATFORM_GOVERNANCE_SCOPE`
- **Eligible State:** `TreeStatus = ACTIVE`
- **Preconditions:** Cây mục tiêu đã chết, bị gãy đổ hoặc có biên bản đốn hạ vĩnh viễn; có lý do thanh lý bắt buộc.
- **Action / Trigger:** Admin gửi lệnh thanh lý cây xanh.
- **Expected Result:** `TreeStatus` chuyển sang `RETIRED`. **Chặn 100% việc tạo nhiệm vụ mới (`CreateTask`) cho cây này về sau**. Toàn bộ hồ sơ lịch sử và `CareHistory` trong quá khứ được bảo lưu vĩnh viễn, **tuyệt đối không xóa vật lý bản ghi**. Phát sinh `AuditEvent`.
- **Forbidden Behavior:** Xóa vật lý bản ghi `Tree` khỏi cơ sở dữ liệu; tạo nhiệm vụ mới cho cây đã `RETIRED`; phục hồi cây đã thanh lý mà không có quyết định quản trị đặc biệt.
- **Audit Expectation:** `AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Cây "TREE-001" bị bão quật đổ gãy hoàn toàn, Admin nhập lý do "Cây gãy đổ do bão số 3, đã dọn dẹp mặt bằng".  
  *When:* Admin gọi `RetireTree`.  
  *Then:* `Tree.status = RETIRED`, lịch sử cũ được bảo toàn, các nỗ lực `CreateTask` cho cây này sau đó đều bị chặn.
- **Negative Oracle(s):**  
  *Neg 1 (Tạo việc cho cây RETIRED):* Quản lý tạo task cho cây đã `RETIRED` $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).  
  *Neg 2 (Xóa cứng dữ liệu):* Lệnh thanh lý xóa mất bản ghi cây và lịch sử $\to$ Vi phạm bất biến bảo tồn dữ liệu kiểm toán.
- **Canonical Source:** `WORKFLOWS WF-13`, `ACCESS-CONTROL §5 CMD-ADM-14`, `PRODUCT §4 CAP-ADM-06`.

---

### BR-ADM-07 — Quản trị Danh mục Loại việc Lâm sinh (TaskType Catalog)
- **Actor:** Platform Administrator (`admin`)
- **Command:** `CreateTaskType` | `DeactivateTaskType` | `ActivateTaskType`
- **Owning Context:** `Policy & Template Governance`
- **Resource:** `TaskTypeCatalog` (Tài nguyên chỉ ghi lưu vết kiểm toán - AUDIT-ONLY resource)
- **Resource Scope:** `PLATFORM_GOVERNANCE_SCOPE`
- **Eligible State:** `ACTIVE` hoặc `INACTIVE`
- **Preconditions:** Admin thực hiện `ACTIVE`; mã `taskTypeId` ổn định không thay đổi ngữ nghĩa sau khi tạo; loại việc chỉ được phép chọn trong `CreateTask` khi đã có ánh xạ `ProofPolicyMapping` tương ứng (`WF-15`).
- **Action / Trigger:** Admin tạo mới loại việc, hoặc tạm ngưng (`DeactivateTaskType` $\to$ `INACTIVE`), hoặc kích hoạt lại (`ActivateTaskType` $\to$ `ACTIVE`).
- **Expected Result:** Cập nhật trạng thái hiển thị của loại việc trong danh mục giao việc. Toàn bộ các nhiệm vụ lịch sử đang tham chiếu tới loại việc này giữ nguyên vẹn.
- **Forbidden Behavior:** **Xóa cứng (Hard-delete)** loại việc đã từng có nhiệm vụ tham chiếu; thay đổi ngữ nghĩa của một `taskTypeId` cũ (muốn đổi ngữ nghĩa phải tạo `taskTypeId` mới); Quản lý tự tạo loại việc.
- **Audit Expectation:** `AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Loại việc "CHAM-SOC-01" đang `ACTIVE`, Admin muốn tạm ngừng không cho giao việc mới.  
  *When:* Admin gọi `DeactivateTaskType`.  
  *Then:* Trạng thái chuyển thành `INACTIVE`, không còn xuất hiện trên giao diện tạo task của Quản lý, các task cũ giữ nguyên tham chiếu, phát sinh audit event.
- **Negative Oracle(s):**  
  *Neg 1 (Xóa cứng loại việc):* Admin gửi lệnh DELETE loại việc đã có 10 task tham chiếu $\to$ Bị từ chối 100% (`PRECONDITION_NOT_MET` / AUDIT-ONLY resource).  
  *Neg 2 (Giao việc cho loại việc chưa có Policy):* Quản lý tạo task với loại việc mới chưa được gán ProofProfile $\to$ Bị từ chối (`PRECONDITION_NOT_MET`).
- **Canonical Source:** `WORKFLOWS WF-14`, `ACCESS-CONTROL §5 CMD-ADM-15, 16, 17`, `PRODUCT §4 CAP-ADM-07`.

---

### BR-ADM-08 — Ban hành Phiên bản Chính sách Bằng chứng (PublishProofPolicyVersion)
- **Actor:** Platform Administrator (`admin`)
- **Command:** `PublishProofPolicyVersion`
- **Owning Context:** `Policy & Template Governance`
- **Resource:** `ProofPolicyMapping` (Tài nguyên phiên bản chính sách - VERSIONED policy resource)
- **Resource Scope:** `PLATFORM_GOVERNANCE_SCOPE`
- **Eligible State:** Ban hành phiên bản mới
- **Preconditions:** Admin thực hiện `ACTIVE`; mỗi `TaskType` đang `ACTIVE` bắt buộc ánh xạ tới chính xác 1 trong 3 hồ sơ (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`); đánh số phiên bản mới (`policyVersionId`).
- **Action / Trigger:** Admin xác nhận ban hành phiên bản chính sách mới.
- **Expected Result:** Tạo bản ghi phiên bản chính sách mới có hiệu lực. **Quy tắc không áp dụng hồi tố (No Retroactive Application):** Phiên bản mới chỉ áp dụng cho các nhiệm vụ tạo mới trong tương lai. Toàn bộ các nhiệm vụ đang chạy (`IN_PROGRESS`, `BLOCKED`, `REWORK_REQUIRED`) hoặc đã đóng giữ nguyên bản hợp đồng bằng chứng của phiên bản cũ. Phát sinh `AuditEvent`.
- **Forbidden Behavior:** Quản lý tự ý hạ cấp hồ sơ bằng chứng trên từng task riêng lẻ (`DR-MVP-02`); áp dụng hồi tố làm thay đổi yêu cầu bằng chứng của task đang làm dở; sửa đổi đè lên phiên bản chính sách cũ.
- **Audit Expectation:** `AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Phiên bản V1 đang áp dụng, Admin ban hành bản đồ mới V2 chuyển loại việc "CAT-TIA" từ `SERVICE_PROOF` sang `CHANGE_PROOF`.  
  *When:* Admin gọi `PublishProofPolicyVersion`.  
  *Then:* Phiên bản V2 được lưu trữ, các task tạo sau đó áp dụng V2, task đang thi công tạo từ trước vẫn giữ nguyên bản hợp đồng V1, ghi audit log.
- **Negative Oracle(s):**  
  *Neg 1 (Quản lý hạ cấp profile):* Quản lý tự chỉnh trường `proofProfile` từ `CHANGE_PROOF` về `SERVICE_PROOF` khi tạo task $\to$ Bị từ chối 100% (`DR-MVP-02`).  
  *Neg 2 (Đè phiên bản cũ):* Ban hành chính sách mới nhưng ghi đè lên mã phiên bản cũ $\to$ Vi phạm bất biến phiên bản.
- **Canonical Source:** `WORKFLOWS WF-15`, `ACCESS-CONTROL §5 CMD-ADM-18`, `DOMAIN §4 DR-MVP-02`.

---

### BR-ADM-09 — Ban hành Phiên bản Mẫu Checklist Kỹ thuật (PublishChecklistTemplateVersion)
- **Actor:** Platform Administrator (`admin`)
- **Command:** `PublishChecklistTemplateVersion`
- **Owning Context:** `Policy & Template Governance`
- **Resource:** `ChecklistTemplate` (Tài nguyên quản lý phiên bản)
- **Resource Scope:** `PLATFORM_GOVERNANCE_SCOPE`
- **Eligible State:** Ban hành phiên bản mới
- **Preconditions:** Admin thực hiện `ACTIVE`; danh sách tiêu chuẩn kiểm tra kỹ thuật hợp lệ; đánh số phiên bản mới (`templateVersionId`).
- **Action / Trigger:** Admin gửi lệnh ban hành mẫu checklist mới.
- **Expected Result:** Tạo phiên bản mẫu checklist mới. **Cơ chế bản chụp độc lập (Decoupled Snapshotting):** Khi nhân viên bấm `StartTask`, hệ thống chụp bản sao mẫu checklist hiện hành vào `Task.checklistSnapshot`. Do đó, việc ban hành mẫu mới không bao giờ làm đột biến checklist của các task đang thi công. Phát sinh `AuditEvent`.
- **Forbidden Behavior:** Nhân viên sửa đổi nội dung mẫu checklist gốc; Quản lý can thiệp sửa câu hỏi checklist; sửa đổi hồi tố nội dung checklist của task đang làm dở.
- **Audit Expectation:** `AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Mẫu checklist V1 có 4 câu hỏi. Admin bổ sung thêm câu hỏi an toàn lao động và ban hành V2 có 5 câu hỏi.  
  *When:* Admin gọi `PublishChecklistTemplateVersion`.  
  *Then:* V2 được lưu trữ, task bắt đầu thi công sau đó sẽ nhận snapshot V2 (5 câu), task đã bấm `StartTask` trước đó giữ nguyên snapshot V1 (4 câu).
- **Negative Oracle(s):**  
  *Neg 1 (Nhân viên sửa mẫu gốc):* Field Staff gửi request cập nhật mẫu checklist gốc $\to$ Bị từ chối (`ROLE_NOT_ALLOWED`).  
  *Neg 2 (Đột biến snapshot đang chạy):* Ban hành V2 làm đổi checklist của task đang `IN_PROGRESS` $\to$ Vi phạm bất biến snapshot độc lập.
- **Canonical Source:** `WORKFLOWS WF-16`, `ACCESS-CONTROL §5 CMD-ADM-19`, `PRODUCT §4 CAP-ADM-09`.

---

## 8. Bảng Chuẩn Nghiệm thu Bất biến Kiến trúc & Miền (Domain Invariants BR-DOM-01..BR-DOM-04)

### BR-DOM-01 — Đơn vị Sở hữu Thẩm quyền Đơn nhất (Single Authoritative Context Ownership)
- **Actor:** `System` / `Architecture Boundary Guard`
- **Command:** Kiểm soát tính liêm chính ranh giới Bounded Context
- **Owning Context:** Toàn bộ 5 Bounded Contexts chuẩn tắc
- **Resource:** Toàn bộ Aggregates & Entities
- **Resource Scope:** Toàn hệ thống
- **Eligible State:** `NOT_APPLICABLE`
- **Preconditions:** Khởi tạo và thực thi quy tắc kiến trúc nghiệp vụ.
- **Action / Trigger:** Bất kỳ thao tác ghi dữ liệu nào trên thực thể miền.
- **Expected Result:** Mỗi Aggregate/Entity thuộc quyền sở hữu độc quyền của **đúng một Bounded Context thẩm quyền**:
  - `Task`, `SiteVerification`, `FieldIssue`, `TaskEvidence`, `ReviewDecision`: thuộc độc quyền `Work Management`.
  - `Tree`, `TreeMasterData`, `CareHistory`: thuộc độc quyền `Tree Asset Registry`.
  - `TaskTypeCatalog`, `ProofPolicyMapping`, `ChecklistTemplate`: thuộc độc quyền `Policy & Template Governance`.
  - `AuditEvent`: thuộc độc quyền `Audit & Compliance`.
  - `User`, `Account`, `RoleAssignment`: thuộc độc quyền `Identity & Access Management`.
  - `Operational Notifications`: là Mô hình đọc dẫn xuất (Derived Read Model), không có thẩm quyền sở hữu dữ liệu gốc (`Owning Context: N/A`).
- **Forbidden Behavior:** Ngữ cảnh này can thiệp trực tiếp ghi vào cơ sở dữ liệu hoặc đột biến trạng thái thực thể của ngữ cảnh khác mà không thông qua hợp đồng bàn giao chuẩn tắc (`HO-01..12`); gộp các context tùy tiện.
- **Audit Expectation:** `NOT_APPLICABLE`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Hành động cập nhật dữ liệu `TreeMasterData`.  
  *When:* Kiểm tra ngữ cảnh sở hữu.  
  *Then:* Thao tác được định tuyến và sở hữu độc quyền bởi `Tree Asset Registry`.
- **Negative Oracle(s):**  
  *Neg 1 (Work Management tự sửa Tree Master):* Lệnh từ Work Management tự ý sửa chiều cao cây trong Tree Asset Registry $\to$ Bị từ chối vi phạm ranh giới thẩm quyền.  
  *Neg 2 (IAM sở hữu Task):* IAM tự ý sửa trường `TaskStatus` $\to$ Bị từ chối 100% (`P5-SC-01`).
- **Canonical Source:** `DOMAIN §1 Bounded Contexts`, `05-DOMAIN-OWNERSHIP-MATRIX`.

---

### BR-DOM-02 — Vòng đời 7 Trạng thái Chuẩn tắc & Tính Bất biến của Trạng thái Đóng
- **Actor:** `System` / `Work Management State Machine`
- **Command:** Kiểm soát chuyển dịch trạng thái nhiệm vụ
- **Owning Context:** `Work Management`
- **Resource:** `Task`
- **Resource Scope:** Toàn bộ nhiệm vụ vận hành
- **Eligible State:** `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`
- **Preconditions:** Thực hiện chuyển trạng thái cho thực thể `Task`.
- **Action / Trigger:** Bất kỳ lệnh nghiệp vụ nào làm biến đổi `TaskStatus`.
- **Expected Result:** Vòng đời của Task chỉ chứa đúng **7 trạng thái tất định**. Hai trạng thái `COMPLETED` và `CANCELLED` là **Trạng thái đóng bất biến vĩnh viễn (Terminal States)**: một khi đã chuyển sang trạng thái này, task không bao giờ có thể chuyển sang bất kỳ trạng thái nào khác và cấm sửa đổi dữ liệu (`DR-HARD-05`).
- **Forbidden Behavior:** Tồn tại trạng thái thứ 8 ngoài 7 trạng thái trên (như `"OFFLINE_SUBMITTED"`, `"COMPLETED_WITH_EXCEPTION"`, `"ADMIN_CANCELLED"`); mở lại hoặc phục hồi task đã `COMPLETED` hoặc `CANCELLED`.
- **Audit Expectation:** `AUDIT_REQUIRED` cho các lệnh đóng task.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `task.status = COMPLETED`.  
  *When:* Tiếp nhận bất kỳ lệnh Mutation nào (`ApproveTask`, `CancelTask`, `StartTask`, `SubmitEvidence`).  
  *Then:* Tất cả đều bị từ chối 100%, trạng thái giữ nguyên `COMPLETED`.
- **Negative Oracle(s):**  
  *Neg 1 (Phục hồi task đã đóng):* Gọi lệnh mở lại task đã `CANCELLED` $\to$ Bị từ chối 100% (`TERMINAL_RESOURCE` / `DR-HARD-05`).  
  *Neg 2 (Trạng thái lạ):* Hệ thống lưu trạng thái `"ADMIN_CANCELLED"` $\to$ Vi phạm mô hình 7 trạng thái chuẩn tắc.
- **Canonical Source:** `WORKFLOWS §2 Lifecycle`, `ACCESS-CONTROL §3`, `DOMAIN §4 DR-HARD-05`.

---

### BR-DOM-03 — Tách biệt Tuyệt đối Trạng thái Ngoại tuyến khỏi TaskStatus
- **Actor:** `System` / `Mobile Client Integration`
- **Command:** Quản lý quy trình ngoại tuyến (`WF-18`)
- **Owning Context:** `Mobile Client Integration & Client Outbox`
- **Resource:** `LocalSubmissionStatus`, `Task`
- **Resource Scope:** Thiết bị di động máy khách và giao tiếp mạng
- **Eligible State:** `TaskStatus = IN_PROGRESS`
- **Preconditions:** Thiết bị di động thực hiện nộp hồ sơ khi mất kết nối mạng.
- **Action / Trigger:** Nhân viên nộp bài ngoại tuyến.
- **Expected Result:** Trạng thái nộp ngoại tuyến được ghi nhận độc lập trên thiết bị qua `LocalSubmissionStatus = PENDING_SYNC`. **Trên máy chủ, trạng thái nghiệp vụ chuẩn tắc BẮT BUỘC VẪN LÀ `TaskStatus = IN_PROGRESS`**. Khi có mạng đồng bộ thành công $\to$ máy chủ chuyển `TaskStatus = WAITING_REVIEW` và thiết bị đặt `LocalSubmissionStatus = SYNCED`. Nếu đồng bộ thất bại $\to$ `TaskStatus` vẫn là `IN_PROGRESS` và thiết bị đặt `SYNC_FAILED`.
- **Forbidden Behavior:** Gán nhãn `"OFFLINE_SUBMITTED"` vào thuộc tính `TaskStatus` của máy chủ; làm xáo trộn vòng đời nghiệp vụ 7 trạng thái vì vấn đề kết nối kỹ thuật.
- **Audit Expectation:** `NO_BUSINESS_AUDIT_REQUIRED`.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* Thiết bị ngắt kết nối mạng hoàn toàn, nhân viên bấm nộp bài.  
  *When:* Kiểm tra trạng thái trên thiết bị và trên máy chủ.  
  *Then:* Thiết bị hiển thị `LocalSubmissionStatus = PENDING_SYNC`; trên máy chủ cơ sở dữ liệu `task.status` vẫn ghi nhận chính xác `IN_PROGRESS`.
- **Negative Oracle(s):**  
  *Neg 1 (Đột biến TaskStatus thành OFFLINE_SUBMITTED):* Máy chủ lưu `task.status = "OFFLINE_SUBMITTED"` $\to$ Bị coi là lỗi nghiêm trọng vi phạm bất biến miền (`DR-TECH-01` / P7-NT-18).
- **Canonical Source:** `WORKFLOWS WF-18`, `DOMAIN §2 5-Dimensions, §4 DR-TECH-01`.

---

### BR-DOM-04 — Cấm Tuyệt đối Admin Thao tác Tác nghiệp Task Thực địa
- **Actor:** Platform Administrator (`admin`)
- **Command:** Toàn bộ các lệnh tác nghiệp hiện trường (`CMD-OP-01..17`)
- **Owning Context:** `Work Management`
- **Resource:** `Task`
- **Resource Scope:** Toàn bộ nhiệm vụ vận hành
- **Eligible State:** Mọi trạng thái
- **Preconditions:** Người dùng đăng nhập có vai trò `admin`.
- **Action / Trigger:** Admin cố gắng thực hiện các thao tác: tạo việc, giao việc, phân công lại, bấm bắt đầu, đo GPS, quét QR, nộp bằng chứng, báo sự cố, duyệt bài, duyệt ngoại lệ, yêu cầu sửa, hoặc hủy việc thông thường.
- **Expected Result:** **HỆ THỐNG TỪ CHỐI 100% (DENY)** toàn bộ các hành vi trên tại tầng Use Case / Domain Service. Platform Administrator hoàn toàn không có bất kỳ làn bơi (Swimlane) nào trong quy trình vận hành thực địa.
- **Forbidden Behavior:** Cấp quyền cho Admin tạo task vận hành; cho phép Admin duyệt bài thay Quản lý; cho phép Admin tự ý đổi phân công task của nhân viên.
- **Audit Expectation:** `AUDIT_REQUIRED` khi phát hiện truy cập trái thẩm quyền mặt bằng.
- **MVP Classification:** `MVP`
- **Positive Oracle:**  
  *Given:* `actor.role = admin`.  
  *When:* Admin gửi request gọi `ApproveTask` hoặc `CreateTask`.  
  *Then:* Hệ thống trả về lỗi từ chối quyền hạn (`ROLE_NOT_ALLOWED` / Zero Normal Task Operations), không có dữ liệu nào bị thay đổi.
- **Negative Oracle(s):**  
  *Neg 1 (Admin duyệt thành công):* Request `ApproveTask` từ Admin chuyển trạng thái task sang `COMPLETED` $\to$ Vi phạm nghiêm trọng ranh giới mặt bằng (P7-NT-16).
- **Canonical Source:** `ACCESS-CONTROL §2.1, §4, §6`, `WORKFLOWS §3`, `PRODUCT §3 Admin Boundaries`.

---

## 9. Bảng Chuẩn Nghiệm thu Yêu cầu Tương lai & Bác bỏ (NEXT & REJECTED)

### BR-ADM-10 — Biểu mẫu Khám bệnh Lâm sinh Động (CAP-ADM-10 / ManageDynamicFindingsTemplate)
- **Status:** `NEXT (Bảo lưu giai đoạn sau MVP)`
- **Actor:** Platform Administrator (`admin`)
- **Command:** `ManageDynamicFindingsTemplate`
- **Resource:** `FindingsSchema`
- **MVP Acceptance Oracle:**  
  - Lệnh `ManageDynamicFindingsTemplate` **BỊ KHÓA HOÀN TOÀN TẠI PHIÊN BẢN MVP**; không xuất hiện trên giao diện và trả về lỗi từ chối nếu có yêu cầu API (`CAPABILITY_NOT_IN_MVP`).  
  - Trong giai đoạn MVP, hồ sơ `INSPECTION_PROOF` **BẮT BUỘC SỬ DỤNG BIỂU MẪU CỐ ĐỊNH (Fixed Schema)** cho `StructuredFindings`; tuyệt đối không được biến bảng khám bệnh thành tùy chọn không bắt buộc (P7-NT-15).
- **Canonical Source:** `PRODUCT §4 CAP-ADM-10`, `WORKFLOWS §6 WF-NEXT-01`.

---

### BR-ADM-11 — Can thiệp Vượt quyền Khẩn cấp Thiên tai (CAP-ADM-11 / UseBreakGlass)
- **Status:** `NEXT (Bảo lưu giai đoạn sau MVP)`
- **Actor:** Platform Administrator (`admin`)
- **Command:** `UseBreakGlass`
- **Resource:** Khẩn cấp
- **MVP Acceptance Oracle:**  
  - Lệnh `UseBreakGlass` **HOÀN TOÀN KHÔNG KHẢ DỤNG TRONG PHÂN QUYỀN MVP BÌNH THƯỜNG** (P7-NT-14). Mọi yêu cầu can thiệp vượt quyền đều bị từ chối 100% (`CAPABILITY_NOT_IN_MVP`).  
  - Khi được phát triển ở giai đoạn NEXT, tính năng này bắt buộc đi kèm phiên giới hạn thời gian (Time-boxed), lưu vết kiểm toán tối cao (`CRITICAL_AUDIT`) và quy trình phê duyệt/hậu kiểm độc lập.
- **Canonical Source:** `PRODUCT §4 CAP-ADM-11`, `ACCESS-CONTROL §5 CMD-ADM-21`, `WORKFLOWS §6 WF-NEXT-02`.

---

### BR-ADM-12 — Cảnh báo An ninh Quản trị Cấp cao (CAP-ADM-12 / SendSecurityAlert)
- **Status:** `NEXT (Bảo lưu giai đoạn sau MVP)`
- **Actor:** `System`
- **Command:** `SendSecurityAlert`
- **Resource:** `AuditEvent`
- **MVP Acceptance Oracle:**  
  - Cơ chế gửi thông báo đẩy an ninh tự động tới ban giám sát khi có biến động quyền quản trị cấp cao được bảo lưu phát triển đồng bộ với Break-glass ở giai đoạn NEXT.  
  - Trong MVP, sự kiện quản trị cấp cao được lưu vết đầy đủ trong sổ nhật ký kiểm toán Append-Only thông thường (`AUDIT_REQUIRED`), không tạo luồng xử lý chặn đứng (non-blocking).
- **Canonical Source:** `PRODUCT §4 CAP-ADM-12`, `WORKFLOWS §6 WF-NEXT-03`.

---

### BR-ADM-13 — Quản trị Cấu hình Hạ tầng Hệ thống Tùy tiện (CAP-ADM-13 / ManagePlatformSystemConfig)
- **Status:** `REJECTED (Bác bỏ hoàn toàn khỏi Sản phẩm)`
- **Actor:** N/A
- **Command:** `ManagePlatformSystemConfig`
- **Resource:** Hạ tầng kỹ thuật (Server, Database, Secrets, Deployment)
- **Acceptance Oracle:**  
  - Platform Administrator **TUYỆT ĐỐI KHÔNG CÓ THẨM QUYỀN** quản trị hạ tầng kỹ thuật máy chủ, cơ sở dữ liệu, quản lý khóa bí mật hay cấu hình triển khai thông qua năng lực nghiệp vụ sản phẩm.  
  - Toàn bộ các yêu cầu, giao diện hoặc mã nguồn liên quan đến quản trị cấu hình hạ tầng tùy tiện đều bị **loại trừ dứt khoát 100% khỏi phạm vi sản phẩm NOVYX**. Không tạo bất kỳ nhiệm vụ triển khai hay DTO nào cho yêu cầu này.
- **Canonical Source:** `PRODUCT §3 Capability Taxonomy`, `ACCESS-CONTROL §5 CMD-ADM-22`, `04-ADMIN-BUSINESS-SCOPE`.

---

## 10. Phủ sóng Kịch bản Chấp thuận & Từ chối (Positive / Negative Coverage)

Tất cả các yêu cầu nghiệp vụ đều được bao phủ đầy đủ kịch bản chấp thuận (Positive) và kịch bản từ chối (Negative). Đối với các yêu cầu rủi ro cao, hệ thống trang bị nhiều kịch bản phủ định chuyên biệt:

| Yêu cầu Rủi ro Cao | Mã yêu cầu | Số kịch bản Positive | Số kịch bản Negative | Trọng tâm Từ chối & Chặn đứng |
|---|---|:---:|:---:|---|
| **Điều chỉnh vai trò** | `BR-ADM-02` | 1 | 3 | Chặn Admin tự đổi quyền; chặn đổi quyền khi chưa bàn giao việc; chặn Manager đổi quyền. |
| **Khóa tài khoản** | `BR-ADM-03` | 1 | 3 | Chặn tài khoản bị khóa thực hiện lệnh; cấm tự đổi TaskStatus; cấm Admin can thiệp task. |
| **Chống tự duyệt bài** | `BR-ADM-02b` | 1 | 1 | Chặn 100% người thi công tự duyệt việc sau khi được thăng chức lên Quản lý (`DR-HARD-02`). |
| **Phân công lại** | `BR-10` | 1 | 2 | Chặn phân công lại khi task đang `IN_PROGRESS` (`DR-HARD-06`); chặn gán cho nhân sự bị khóa. |
| **Hủy nhiệm vụ** | `BR-09` | 1 | 3 | Chặn hủy task đã đóng (`DR-HARD-05`); chặn sinh CareHistory (`DR-HARD-07`); chặn Admin hủy task. |
| **Phê duyệt chuẩn** | `BR-07` | 1 | 3 | Chặn tự duyệt việc của mình; chặn Admin duyệt việc; chặn sửa đổi task đã `COMPLETED`. |
| **Phê duyệt ngoại lệ** | `BR-07b` | 1 | 2 | Chặn duyệt khi thiếu lý do văn bản bảo lãnh; chặn sinh trạng thái lạ. |
| **Yêu cầu làm lại** | `BR-08` | 1 | 2 | Chặn yêu cầu sửa khi thiếu khâu chỉ định (`targetedArea`); chặn xóa bằng chứng cũ. |
| **Đổi tem QR cây** | `BR-ADM-06b` | 1 | 2 | Chặn cấp mã QR trùng lặp; chặn làm thay đổi mã định danh bất biến `treeId`. |
| **Chính sách bằng chứng**| `BR-ADM-08` | 1 | 2 | Chặn Quản lý tự ý hạ cấp Profile (`DR-MVP-02`); chặn áp dụng hồi tố task đang chạy. |

---

## 11. Ma trận Bao phủ Tiêu chuẩn Nghiệm thu Toàn diện (Requirement Coverage Matrix)

| Requirement ID | Actor | Command | Resource | Preconditions | Result | Negative Oracle | Audit | Status | Binary? |
|:---|:---|:---|:---|:---|:---|:---|:---|:---:|:---:|
| **BR-01** | Field Staff | `VerifyGps` | `SiteVerification`, `Task` | Location granted, dist $\le 10$m | `LOCATION_VERIFIED`, dist stored, TaskStatus invariant | Dist $> 10$m rejected, wrong state rejected, non-owner rejected | `NO_AUDIT` | MVP | **YES** |
| **BR-01b** | Field Staff | `ReportLocationException` | `VerificationException` | Dist $> 10$m, reason non-empty | `LOCATION_EXCEPTION`, evidence preserved, TaskStatus invariant | Empty reason rejected, deleting exception denied | `NO_AUDIT` | MVP | **YES** |
| **BR-02** | Field Staff | `VerifyQr` | `SiteVerification`, `Task` | Camera granted, QR matches tree | `TREE_IDENTITY_VERIFIED`, TaskStatus invariant | Mismatched QR rejected, mutating target treeId denied | `NO_AUDIT` | MVP | **YES** |
| **BR-02b** | Field Staff | `ReportIdentityException` | `VerificationException` | QR damaged, photo provided, reason non-empty | `IDENTITY_EXCEPTION`, treeId invariant | Missing photo rejected, mismatched manual code rejected | `NO_AUDIT` | MVP | **YES** |
| **BR-03** | Field Staff | `StartTask` | `Task` | Account ACTIVE, assignedStaffId, `PENDING` | `IN_PROGRESS`, checklist snapshot initialized | Passive views do not transition, manager/admin calling denied | `NO_AUDIT` | MVP | **YES** |
| **BR-04** | Field Staff | `CaptureProofEvidence` | `TaskEvidence`, `Task` | Profile CHANGE_PROOF, `IN_PROGRESS` | Before photo + 100% checklist + After photo recorded | Submitting without Before photo rejected, incomplete checklist rejected | `NO_AUDIT` | MVP | **YES** |
| **BR-04b** | Field Staff | `CaptureProofEvidence` | `TaskEvidence`, `Task` | Profile SERVICE_PROOF, `IN_PROGRESS` | 100% checklist + completion photo recorded | Submitting without completion photo rejected | `NO_AUDIT` | MVP | **YES** |
| **BR-04c** | Field Staff | `RecordStructuredFindings` | `TaskEvidence`, `Task` | Profile INSPECTION_PROOF, `IN_PROGRESS` | StructuredFindings + condition photos recorded | Submitting with empty findings rejected | `NO_AUDIT` | MVP | **YES** |
| **BR-05** | Field Staff | `ReportFieldIssue` | `FieldIssue`, `Task` | `IN_PROGRESS`, photo provided, reason non-empty | `BLOCKED`, issue entity created, alert sent (HO-03) | Calling from REWORK_REQUIRED denied, empty photo rejected | `NO_AUDIT` | MVP | **YES** |
| **BR-05b** | Operations Manager | `ResumeBlockedTask` / `ReassignTask` / `CancelTask` | `Task`, `FieldIssue` | `BLOCKED`, operational scope | Transitions strictly to `IN_PROGRESS`, `PENDING`, or `CANCELLED` | 4th exit transition denied, staff resuming denied | `AUDIT_REQUIRED` (Reassign/Cancel) | MVP | **YES** |
| **BR-06** | Field Staff | `SubmitEvidence` | `Task`, `ProofProgress` | 100% proof complete, `IN_PROGRESS` | Online: `WAITING_REVIEW`; Offline: Outbox PENDING_SYNC & server IN_PROGRESS | Incomplete proof rejected, server OFFLINE_SUBMITTED state denied | `NO_AUDIT` | MVP | **YES** |
| **BR-07** | Operations Manager | `ApproveTask` | `Task`, `ReviewDecision` | `WAITING_REVIEW`, 100% proof ok, actor != assigned | `COMPLETED`, terminal success, CareHistory projected (HO-08) | Self-approval denied (DR-HARD-02), admin approving denied, mutating COMPLETED denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-07b** | Operations Manager | `ApproveWithException` | `Task`, `ReviewDecision` | `WAITING_REVIEW`, exception reason non-empty, actor != assigned | `COMPLETED`, CareHistory hasException=true, audit emitted | Empty exception reason rejected, non-standard state name denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-08** | Operations Manager | `RequestRework` | `Task`, `ReviewDecision` | `WAITING_REVIEW`, targetedArea specified, reason non-empty | `REWORK_REQUIRED`, Attempt 1 preserved, sent to staff (HO-06) | Empty targetedArea rejected, deleting previous evidence denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-08b** | Field Staff | `ResubmitRework` | `Task`, `TaskEvidence` | `REWORK_REQUIRED`, assignedStaffId, targeted area fixed | Attempt 2 packaged, `WAITING_REVIEW` (HO-07) | Resubmitting without fixing targeted area rejected, direct reassign denied | `NO_AUDIT` | MVP | **YES** |
| **BR-09** | Operations Manager | `CancelTask` | `Task` | Non-terminal state, operational scope, reason non-empty | `CANCELLED`, terminal void, history preserved (HO-09) | Cancelling COMPLETED/CANCELLED denied, generating CareHistory denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-10** | Operations Manager | `ReassignTask` | `Task` | Case A: `PENDING`; Case B: `BLOCKED`; new staff ACTIVE | `assignedStaffId` updated, authorship of old evidence preserved | Direct reassign on IN_PROGRESS denied (DR-HARD-06), assigning to SUSPENDED denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-11** | System | `ProjectCareHistory` | `CareHistory`, `Tree` | Transition into `COMPLETED` | `CareHistory` record created with full verification/exception flags | Projection on non-COMPLETED states denied, mutating historical CareHistory denied | `NO_AUDIT` | MVP | **YES** |
| **BR-12** | Operations Manager | `CreateTask` | `Task`, `Tree` | Tree ACTIVE, staff ACTIVE, TaskType ACTIVE, future due date | Initialized `PENDING`, deterministic ProofProfile assigned, snapshot policy | Creating for RETIRED tree denied, manager profile downgrade denied, admin creating denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-13** | Staff / Manager | `LookupTreeByQr` | `Tree`, `CareHistory` | Camera granted, valid QR | Read tree profile, health, and completed CareHistory | Mutation of tree records denied, invalid QR crashing denied | `NO_AUDIT` | MVP | **YES** |
| **BR-ACT-01** | Platform / System | Initialize RBAC | `UserRole`, `Actor` | Architecture baseline initialization | Explicit 3 human roles + 1 system technical actor, no role inheritance | Hierarchy inheritance denied, staff self-register denied, human assigned System role denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-01** | Platform Administrator | `ProvisionUser` | `User`, `Account`, `RoleAssignment` | Admin ACTIVE, unique email/phone, role ∈ staff/manager/admin | `User` & `Account` created (`INVITED`/`ACTIVE`), secure credential invite sent, plaintext secret hidden | Manager provisioning denied, duplicate identity rejected, admin receiving plaintext secret denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-02** | Platform Administrator | `AssignRole` | `RoleAssignment`, `User` | Admin ACTIVE, target ACTIVE, target != actor, impact check satisfied | `User.role` updated upon handoff clearance, role history archived, audit emitted | Admin self-role mutation denied (ADM-SOD-01), role effective before handoff denied, manager assigning denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-02b**| System / Manager | Review gatekeeping | `Task`, `ReviewDecision` | Staff promoted to Manager; target task has executedBy == actor | 100% blocked from reviewing own past work (DR-HARD-02), transferred to peer manager | Promoted manager self-reviewing historical work denied (P7-NT-19) | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-03** | Platform Administrator | `SuspendAccount` | `Account` | Admin ACTIVE, target ACTIVE, reason non-empty | `AccountStatus = SUSPENDED`, auth denied immediately, TaskStatus invariant, HO-10 emitted | Auth allowed for suspended account denied, TaskStatus mutation denied (P5-SC-01), admin reassigning tasks denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-03b**| Operations Manager | WF-12 Disposition | `Task` | Operational scope, event HO-10 received | Tasks resolved via disposition matrix: PENDING reassign, IN_PROGRESS cancel+replace | Direct reassign on IN_PROGRESS denied (DR-HARD-06), leaving tasks unhandled denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-04** | Platform Administrator | `UnlockAccount` / `ResetCredentialSetup` | `Account` | Admin ACTIVE, target exists | `AccountStatus = ACTIVE` or secure reset credential invite sent, plaintext secret hidden | Admin manually setting/reading plaintext secret denied, unlocking DISABLED denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-05** | Platform Administrator | `ViewAuditLog` / `FilterAuditLog` | `AuditEvent` | Admin ACTIVE | Immutable read query executed from append-only store | Mutation/deletion of audit logs denied (ADM-SOD-03), staff viewing audit log denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-06** | Platform Administrator | `CreateTree` | `Tree` | Admin ACTIVE, unique treeId, unique qrCode, valid coords | `Tree` created `ACTIVE`, audit emitted, coords do not require uniqueness | Duplicate treeId rejected, duplicate qrCode rejected, identical coords rejecting tree denied (P5-SC-04) | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-06b**| Platform Administrator | `ReplaceTreeQrCode` | `Tree` | Tree ACTIVE, new qrCode unique, reason non-empty | `Tree.qrCode` updated, treeId invariant, past task QR logs invariant | Duplicate new QR rejected, treeId mutation denied, rewriting historical task QR logs denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-06c**| Platform Administrator | `UpdateCanonicalCoordinates` | `Tree` | Tree ACTIVE, valid coords, reason non-empty | `canonicalCoordinates` updated, treeId invariant, past task GPS logs invariant | Empty reason rejected, invalid coords rejected, rewriting historical GPS logs denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-06d**| Platform Administrator | `RetireTree` | `Tree` | Tree ACTIVE, reason non-empty | `Tree.status = RETIRED`, future task creation blocked, physical deletion denied | Physical deletion denied, creating task for RETIRED tree denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-07** | Platform Administrator | `CreateTaskType` / `DeactivateTaskType` / `ActivateTaskType` | `TaskTypeCatalog` | Admin ACTIVE, stable taskTypeId | Catalog updated, historical task references preserved | Hard-deletion of referenced TaskType denied, manager creating TaskType denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-08** | Platform Administrator | `PublishProofPolicyVersion` | `ProofPolicyMapping` | Admin ACTIVE, all active TaskTypes mapped to exactly 1 profile | New policy version active, future tasks adopt version, retroactive changes denied | Manager per-task profile downgrade denied (DR-MVP-02), overwriting active task profile denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-09** | Platform Administrator | `PublishChecklistTemplateVersion` | `ChecklistTemplate` | Admin ACTIVE, valid checklist items | New template version published, running task snapshots invariant | Staff/manager mutating master template denied, retroactive mutation of running task snapshot denied | `AUDIT_REQUIRED` | MVP | **YES** |
| **BR-ADM-10** | Platform Administrator | `ManageDynamicFindingsTemplate` | `FindingsSchema` | Post-MVP phase | Capability completely locked in MVP; Fixed Schema enforced for StructuredFindings | Dynamic template builder enabled in MVP denied (P7-NT-14), making StructuredFindings optional denied | `AUDIT_REQUIRED` | NEXT | **YES** |
| **BR-ADM-11** | Platform Administrator | `UseBreakGlass` | Emergency Plane | Post-MVP phase | Capability completely locked in MVP normal authorization | Invoking BreakGlass in normal MVP authorization denied (P7-NT-14) | `CRITICAL_AUDIT`| NEXT | **YES** |
| **BR-ADM-12** | System | `SendSecurityAlert` | `AuditEvent` | Post-MVP phase | Automatic security alerts reserved for NEXT alongside Break-Glass; standard append-only audit active | Treating security alerts as an MVP blocking workflow denied | `AUDIT_REQUIRED` | NEXT | **YES** |
| **BR-ADM-13** | N/A | `ManagePlatformSystemConfig` | System Infrastructure | N/A | **COMPLETELY REJECTED FROM PRODUCT**; zero governance authority over servers/DB/secrets | Admin managing infrastructure via product capability denied (P7-NT-09) | `NOT_APPLICABLE` | REJECTED | **YES** |
| **BR-DOM-01** | System / Arch | Context Boundary Enforcement | All Entities | Architectural baseline | Single authoritative context ownership strictly enforced per model | Direct cross-context database mutation denied, IAM mutating task directly denied | `NOT_APPLICABLE` | MVP | **YES** |
| **BR-DOM-02** | System / Work Mgmt | Lifecycle Machine | `Task` | State transition command | Exactly 7 states enforced, COMPLETED & CANCELLED terminal & immutable | 8th state creation denied, mutating COMPLETED/CANCELLED denied (DR-HARD-05) | `AUDIT_REQUIRED` (Closing) | MVP | **YES** |
| **BR-DOM-03** | System / Mobile | Client Outbox Sync | `LocalSubmissionStatus`, `Task` | Mobile offline submission | `LocalSubmissionStatus = PENDING_SYNC`, server TaskStatus remains `IN_PROGRESS` | Server TaskStatus becoming OFFLINE_SUBMITTED denied (P7-NT-18) | `NO_AUDIT` | MVP | **YES** |
| **BR-DOM-04** | Platform Administrator | Normal Task Operations | `Task` | Admin authenticated | **100% BLOCKED (DENY)** on all operational field actions | Admin creating task, approving task, or reassigning task denied (P7-NT-16) | `AUDIT_REQUIRED` | MVP | **YES** |

---

## 12. Kiểm toán Tính Duy nhất của Định danh Yêu cầu (Unique ID Audit)

Thực hiện kiểm tra tính duy nhất trên toàn bộ 43 mã yêu cầu nghiệp vụ:
- Tập hợp mã: `BR-01`, `BR-01b`, `BR-02`, `BR-02b`, `BR-03`, `BR-04`, `BR-04b`, `BR-04c`, `BR-05`, `BR-05b`, `BR-06`, `BR-07`, `BR-07b`, `BR-08`, `BR-08b`, `BR-09`, `BR-10`, `BR-11`, `BR-12`, `BR-13`, `BR-ACT-01`, `BR-ADM-01`, `BR-ADM-02`, `BR-ADM-02b`, `BR-ADM-03`, `BR-ADM-03b`, `BR-ADM-04`, `BR-ADM-05`, `BR-ADM-06`, `BR-ADM-06b`, `BR-ADM-06c`, `BR-ADM-06d`, `BR-ADM-07`, `BR-ADM-08`, `BR-ADM-09`, `BR-ADM-10`, `BR-ADM-11`, `BR-ADM-12`, `BR-ADM-13`, `BR-DOM-01`, `BR-DOM-02`, `BR-DOM-03`, `BR-DOM-04`.
- **Kết quả đối soát:**
  - Tổng số ID được khai báo: 43.
  - Tổng số ID duy nhất (Unique count): 43.
  - Số lượng ID trùng lặp (Duplicates): **0**.
  - Không có hiện tượng đổi mã tùy tiện hay tái sử dụng ID cũ.
  - **Gate P7-01: PASS**.

---

## 13. Kiểm toán Tính Nhất quán của Từ vựng Lệnh (Canonical Command Consistency)

Đối soát toàn bộ tên lệnh trong RTM và Báo cáo Phase 7 với `docs/ACCESS-CONTROL.md` và `docs/WORKFLOWS.md`:
1. **Lệnh Tác nghiệp Vận hành (Operational Commands):** `CreateTask`, `StartTask`, `VerifyGps`, `ReportLocationException`, `VerifyQr`, `ReportIdentityException`, `CaptureProofEvidence`, `ReportFieldIssue`, `SubmitEvidence`, `ApproveTask`, `ApproveWithException`, `RequestRework`, `ResubmitRework`, `ResumeBlockedTask`, `ReassignTask`, `CancelTask`, `LookupTreeByQr`, `ProjectCareHistory`.
2. **Lệnh Quản trị Nền tảng (Platform Governance Commands):** `ProvisionUser`, `AssignRole`, `SuspendAccount`, `ActivateAccount`, `DisableAccount`, `UnlockAccount`, `ResetCredentialSetup`, `ViewAuditLog`, `FilterAuditLog`, `CreateTree`, `UpdateTreeMasterData`, `ReplaceTreeQrCode`, `UpdateCanonicalCoordinates`, `RetireTree`, `CreateTaskType`, `DeactivateTaskType`, `ActivateTaskType`, `PublishProofPolicyVersion`, `PublishChecklistTemplateVersion`.
3. **Lệnh Tương lai (NEXT Commands):** `ManageDynamicFindingsTemplate`, `UseBreakGlass`, `SendSecurityAlert`.
4. **Lệnh Bác bỏ (REJECTED):** `ManagePlatformSystemConfig`.
- **Kết quả đối soát:**
  - Không còn bất kỳ bí danh cũ nào (`ReviewApprove`, `ReviewApproveWithException`, `ReviewRequestRework`, v.v.).
  - 100% tên lệnh khớp chính xác từng ký tự với tài liệu chuẩn tắc Phase 4, 5, 6.
  - **Gate P7-03: PASS**.

---

## 14. Kiểm toán Tính Độc lập Cài đặt (Implementation-Independence Audit)

Rà soát toàn bộ các tiêu chuẩn nghiệm thu và điều kiện kiểm thử trong Phase 7:
- **Kiểm tra từ khóa kỹ thuật bị cấm:**
  - Tên interface TypeScript / Type DTO: Không bắt buộc `@novyx/contracts` cụ thể trong tiêu chuẩn nghiệm thu nghiệp vụ.
  - REST path / HTTP Status codes: Không đòi hỏi `200 OK`, `400 Bad Request`, `403 Forbidden`, `404 Not Found` (thay thế bằng danh mục lỗi ngữ nghĩa: `ROLE_NOT_ALLOWED`, `RESOURCE_SCOPE_MISMATCH`, `INVALID_TASK_STATE`, `PRECONDITION_NOT_MET`, `TERMINAL_RESOURCE`, `CAPABILITY_NOT_IN_MVP`, `ACTION_REJECTED_BY_PRODUCT_MODEL`).
  - Cơ sở dữ liệu: Không đòi hỏi tên bảng SQL, kiểu cột, hay foreign key constraint.
  - Cơ chế kỹ thuật phiên/mạng/lưu trữ: Không ràng buộc JWT, refresh token, token blacklist, Redis, SQLite, MMKV, FCM, APNs, Kafka, RabbitMQ, Saga.
  - Cơ chế toàn vẹn kỹ thuật: Không ràng buộc hash chain, WORM storage, chữ ký số, blockchain cho `AuditEvent` (toàn bộ được bảo lưu cho Kiến trúc kỹ thuật / NFR / ADR).
- **Loại bỏ từ ngữ mơ hồ (P7-11):** Toàn bộ các từ "appropriate/phù hợp", "secure/an toàn", "proper/hợp lý", "good/tốt" đều được thay bằng điều kiện quan sát khách quan (ví dụ: "Admin không nhận mật khẩu dạng rõ", "chỉ tài khoản mục tiêu nhận liên kết kích hoạt", "không thể thực hiện hành động xác thực").
- **Gate P7-11 & P7-12: PASS**.

---

## 15. Kiểm thử Phủ định Chuẩn tắc (Negative Tests P7-NT-01..20)

| Mã kiểm thử | Kịch bản kiểm thử phủ định | Hành vi kỳ vọng | Kết quả thực tế | Đánh giá |
|:---:|---|---|---|:---:|
| **P7-NT-01** | Xuất hiện mã yêu cầu trùng lặp trong RTM | Bị phát hiện và từ chối | 43 ID duy nhất 100%, 0 duplicate | **PASS** |
| **P7-NT-02** | Yêu cầu nghiệp vụ bỏ trống trường Actor | Bị từ chối | 43/43 yêu cầu đều định danh rõ Actor | **PASS** |
| **P7-NT-03** | Yêu cầu ghi mơ hồ "Admin quản lý user" không có Command | Bị từ chối | Phân tách rạch ròi 5 lệnh quản trị IAM | **PASS** |
| **P7-NT-04** | Yêu cầu không xác định tài nguyên đích (Resource) | Bị từ chối | 43/43 yêu cầu định danh rõ Resource | **PASS** |
| **P7-NT-05** | Lệnh phụ thuộc trạng thái nhưng bỏ trống Eligible State | Bị từ chối | State được chỉ định rõ hoặc `NOT_APPLICABLE` | **PASS** |
| **P7-NT-06** | Tiêu chuẩn nghiệm thu chỉ ghi "thao tác thành công" chung chung | Bị từ chối | 100% yêu cầu có hậu điều kiện quan sát được | **PASS** |
| **P7-NT-07** | Yêu cầu phân quyền nhưng không có hành vi từ chối (Denial) | Bị từ chối | 100% yêu cầu có kịch bản Negative/Forbidden | **PASS** |
| **P7-NT-08** | Hành động đột biến quan trọng thiếu chuẩn nghiệm thu Audit | Bị từ chối | 100% đột biến quản trị mang `AUDIT_REQUIRED` | **PASS** |
| **P7-NT-09** | Năng lực Admin thiếu trạng thái MVP / NEXT / REJECTED | Bị từ chối | 9 MVP, 3 NEXT, 1 REJECTED phân định rõ | **PASS** |
| **P7-NT-10** | Tiêu chuẩn nghiệm thu ghi "xử lý an toàn/hợp lý" mà không có tiêu chí | Bị từ chối | Đã thay bằng điều kiện quan sát khách quan | **PASS** |
| **P7-NT-11** | Tiêu chuẩn nghiệm thu đòi hỏi tên TypeScript DTO cụ thể | Bị từ chối | Độc lập cài đặt, dùng khái niệm ngữ nghĩa | **PASS** |
| **P7-NT-12** | Tiêu chuẩn nghiệm thu đòi hỏi HTTP Status code cụ thể | Bị từ chối | Sử dụng Semantic Error Categories | **PASS** |
| **P7-NT-13** | Tiêu chuẩn kiểm toán đòi hỏi cơ chế kỹ thuật băm/chữ ký số | Bị từ chối | Bảo lưu cho NFR/ADR; lưu trữ append-only | **PASS** |
| **P7-NT-14** | Lệnh NEXT `UseBreakGlass` được cấu hình ALLOW trong MVP | Bị từ chối | Bị khóa hoàn toàn tại MVP (`CAPABILITY_NOT_IN_MVP`)| **PASS** |
| **P7-NT-15** | `StructuredFindings` bị biến thành tùy chọn trong INSPECTION_PROOF | Bị từ chối | Bắt buộc 100% qua Fixed Schema | **PASS** |
| **P7-NT-16** | Platform Admin gửi lệnh `ApproveTask` được chấp thuận | Bị từ chối | Bị chặn 100% (`ROLE_NOT_ALLOWED` / BR-DOM-04) | **PASS** |
| **P7-NT-17** | Quản lý gửi lệnh `ReassignTask` trực tiếp khi task `IN_PROGRESS` | Bị từ chối | Bị chặn 100% (`DR-HARD-06`), phải qua BLOCKED | **PASS** |
| **P7-NT-18** | Máy chủ lưu trữ `TaskStatus = "OFFLINE_SUBMITTED"` | Bị từ chối | Máy chủ giữ `IN_PROGRESS`, client lưu outbox | **PASS** |
| **P7-NT-19** | Nhân viên thăng chức thành Quản lý tự duyệt bài cũ của chính mình | Bị từ chối | Bị chặn 100% (`DR-HARD-02`), chuyển quản lý khác | **PASS** |
| **P7-NT-20** | Lệnh `CreateTree` bị từ chối chỉ vì tọa độ trùng với cây bên cạnh | Bị từ chối | Cho phép tạo nếu `treeId` và `qrCode` duy nhất | **PASS** |

---

## 16. Bảng Bằng chứng Tiêu chuẩn Chất lượng Phase 7 (P7 Evidence Table)

| Quality Gate | Tiêu chuẩn Đánh giá | Bằng chứng Cụ thể (Concrete Evidence) | Blocking | Kết quả |
|:---:|---|---|:---:|:---:|
| **P7-01** | Requirement IDs unique | 43 ID duy nhất 100% (Mục 11 & 12) | YES | **PASS** |
| **P7-02** | Actor non-empty | 43/43 yêu cầu có Actor chuẩn tắc (Mục 6, 7, 8, 11) | YES | **PASS** |
| **P7-03** | Command explicit | 100% tên lệnh khớp chính xác từ vựng Phase 4/5/6 (Mục 13) | YES | **PASS** |
| **P7-04** | Resource explicit | 43/43 yêu cầu định danh rõ tài nguyên đích (Mục 11) | YES | **PASS** |
| **P7-05** | Preconditions explicit | 43/43 yêu cầu có điều kiện tiên quyết rõ ràng (Mục 11) | YES | **PASS** |
| **P7-06** | Result explicit | 43/43 yêu cầu có hậu điều kiện quan sát khách quan (Mục 11) | YES | **PASS** |
| **P7-07** | Error/forbidden behavior explicit | 43/43 yêu cầu có hành vi bị cấm/từ chối rõ ràng (Mục 10, 11) | YES | **PASS** |
| **P7-08** | Audit requirement explicit | 4 mức kiểm toán phân định chính xác (`AUDIT_REQUIRED`...) | YES | **PASS** |
| **P7-09** | MVP classification explicit | Phân loại rõ ràng: 39 MVP, 3 NEXT, 1 REJECTED (Mục 11) | YES | **PASS** |
| **P7-10** | Acceptance criteria binary | 100% tiêu chí đánh giá nhị phân PASS/FAIL tất định (Mục 6..9) | YES | **PASS** |
| **P7-11** | No vague words without metric | Loại bỏ hoàn toàn các từ mơ hồ không có điều kiện đo đếm | YES | **PASS** |
| **P7-12** | Implementation-independence | Không phụ thuộc DTO, API path, SQL, HTTP codes, crypto tech | YES | **PASS** |

---

## 17. Công việc Tồn đọng & Kế hoạch Tiếp theo (Residual Work)

Phase 7 hoàn thành 100% nhiệm vụ tôi luyện các tiêu chuẩn nghiệm thu nghiệp vụ. Toàn bộ các công việc tiếp theo tuân thủ lộ trình Master Plan:
1. **Phase 8 — Diagram Suite Reconciliation:** Rà soát và cập nhật 16 sơ đồ HTML đảm bảo đồng bộ 100% với baseline nghiệp vụ đã freeze (Bản đồ năng lực, Domain Context Map, Action Eligibility Matrix, Role Information Architecture).
2. **Phase 9 — Business Consistency Audit:** Vòng rà soát tổng thể toàn bộ hệ sinh thái tài liệu nghiệp vụ (Machine checks kiểm tra thuật ngữ cũ, vai trò cũ, các câu từ mâu thuẫn).
3. **Phase 10 — Business Baseline Freeze:** Đóng băng toàn diện bộ tài liệu kinh doanh và chuyển giao chính thức sang giai đoạn kỹ thuật.
4. **Phase 11 — Technical Architecture, ADRs & Contracts:** Thiết kế kiến trúc kỹ thuật chi tiết, ban hành các Quyết định Kiến trúc (ADRs), thiết kế DTO trong `@novyx/contracts`, cơ chế bảo vệ kiểm toán tamper-evidence, cấu trúc database và triển khai mã nguồn.

*Tuyệt đối không đưa bất kỳ công việc lập trình DTO, API, Database hay Auth nào vào Phase 8–10.*

---

## 18. Xác minh Ranh giới Tệp tin (Source Boundary Verification)

Đối soát các tệp tin thay đổi so với Frozen Commit `86e0df7e2d9820518da67d92d42ab6bbf60d0057`:
- **Tệp tin mã nguồn (`apps/**`, `packages/**`):** 0 thay đổi.
- **Tệp tin sơ đồ (`docs/diagrams/**`):** 0 thay đổi.
- **Tệp tin tài liệu chuẩn tắc khác (`PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `ARCHITECTURE.md`, `NFR.md`, `TESTING.md`, `DESIGN.md`):** 0 thay đổi.
- **Tệp tin được phép tạo và chỉnh sửa:**
  - `docs/business-reconciliation/10-RTM-ACCEPTANCE-ORACLE-REPORT.md` (Tạo mới).
  - `docs/REQUIREMENTS-TRACEABILITY.md` (Cập nhật tiêu chuẩn nghiệm thu và xóa nhãn Phase 7).
  - `docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md` (Cập nhật trạng thái Phase 7).

---

## 19. Kết luận & Trạng thái Exit Gate

Phase 7 đã hoàn thành xuất sắc toàn bộ 12 tiêu chí chất lượng `P7-01..P7-12` và 20 bài kiểm thử phủ định `P7-NT-01..20`. Toàn bộ 43 yêu cầu nghiệp vụ đã trở thành các chuẩn nghiệm thu nhị phân độc lập cài đặt.

```text
PHASE 7 PASS
— RTM REQUIREMENTS HARDENED
— ACCEPTANCE ORACLES BINARY
— POSITIVE AND NEGATIVE CASES DEFINED
— AUDIT EXPECTATIONS TRACEABLE
— IMPLEMENTATION INDEPENDENCE PRESERVED
— READY FOR PHASE 8 DIAGRAM SUITE RECONCILIATION
```
