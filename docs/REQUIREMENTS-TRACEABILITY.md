# NOVYX GreenOps — Requirements Taxonomy, Traceability & Quality Gates

Tài liệu này là chuẩn mực duy nhất định nghĩa **PHÂN LOẠI YÊU CẦU (Requirements Taxonomy)**, **MA TRẬN TRUY VẾT YÊU CẦU ĐẦU-CUỐI (End-to-End Traceability Matrix)**, **ĐỊNH NGHĨA SẴN SÀNG (Definition of Ready - DoR)** và **ĐỊNH NGHĨA HOÀN THÀNH (Definition of Done - DoD)**.

---

## 1. Phân loại yêu cầu hệ thống (Requirements Taxonomy)

Hệ thống phân chia yêu cầu thành các nhóm chuẩn tắc nhằm đảm bảo tính toàn diện và không bỏ sót khía cạnh kỹ thuật:

| Mã tiền tố | Nhóm yêu cầu | Ý nghĩa & Thẩm quyền | Ví dụ minh họa |
|:---|:---|:---|:---|
| **BR** | Business Requirements | Mục tiêu kinh doanh, giá trị vận hành và quản trị cốt lõi | `BR-01`: Xác thực vị trí thực địa GPS $\le 10$m. |
| **FR** | Functional Requirements | Tính năng nghiệp vụ người dùng tương tác trực tiếp | `FR-01`: Nhân viên nộp chuỗi bằng chứng theo ProofProfile. |
| **DR** | Domain Rules / Invariants | Bất biến nghiệp vụ bắt buộc tuân thủ | `DR-HARD-01`: Cây mục tiêu bất biến trong suốt vòng đời task. |
| **AR** | Authorization Requirements | Phân quyền vai trò và điều kiện kích hoạt hành động | `AR-01`: Chỉ Quản lý mới có quyền phê duyệt đóng nhiệm vụ. |
| **IR** | Integration Requirements | Giao thức kết nối giữa Mobile, Backend và Ngoại vi | `IR-01`: Gửi bằng chứng qua multipart khi có file ảnh nhị phân. |
| **DRT** | Data Requirements | Ràng buộc cấu trúc dữ liệu, audit trail, lưu trữ | `DRT-01`: Mỗi ảnh bằng chứng phải gắn chặt với timestamp và tọa độ. |
| **NFR** | Non-Functional Requirements | Hiệu năng, độ bền, độ tin cậy, khả năng chịu lỗi | `NFR-01`: Danh sách cuộn mượt không rớt khung hình trên RAM 3GB. |
| **UXR** | Usability Requirements | Trải nghiệm người dùng ngoài trời, thao tác 1 tay | `UXR-01`: Vùng chạm nút bấm chính tối thiểu $48 \times 48\text{px}$. |
| **A11Y** | Accessibility Requirements | Khả năng tiếp cận, tương phản ánh sáng ngoài trời | `A11Y-01`: Độ tương phản văn bản đạt chuẩn WCAG AA $\ge 4.5:1$. |
| **SEC** | Security Requirements | Bảo mật phiên, mã hóa dữ liệu, an toàn thiết bị | `SEC-01`: Cơ chế xác thực an toàn, thu hồi quyền phiên cũ khi đổi vai trò. |
| **OBS** | Observability Requirements | Giám sát hệ thống, theo dõi lỗi, truy vết request | `OBS-01`: Mọi request API đều mang `requestId` duy nhất. |
| **TEST** | Verification Requirements | Phương pháp và tầng kiểm chứng tính đúng đắn | `TEST-01`: Vòng đời 7 trạng thái kiểm chứng bằng State Machine Test. |

---

## 2. Ma trận truy vết yêu cầu đầu-cuối chuẩn tắc (End-to-End Traceability Matrix)

> **Kỷ luật kiểm chứng (Verification Discipline):**<br>
> - `[CURRENTLY_IMPLEMENTED]`: Mã nguồn hiện tại thực sự đáp ứng đầy đủ tiêu chuẩn nghiệm thu của hợp đồng mục tiêu.<br>
> - `[PARTIALLY_IMPLEMENTED]`: Đã có một phần cơ chế trong mã nguồn hiện tại nhưng chưa đáp ứng đầy đủ ngữ nghĩa chuẩn tắc mục tiêu.<br>
> - `[NEEDS_EVIDENCE]`: Đã có mã sơ khởi trong codebase nhưng thiếu bài test tự động hoặc chứng cứ runtime để xác nhận hành vi đạt chuẩn.<br>
> - `[PLANNED]`: Đã xác lập hợp đồng nghiệp vụ chuẩn tắc trong tài liệu Canonical, đang chờ triển khai ở pha sau.<br>
> - `[NOT_IMPLEMENTED]`: Khoảng trống nghiệp vụ mục tiêu hoàn toàn chưa có mã nguồn tương ứng trong repository baseline.<br>
> - `TO_BE_HARDENED_IN_PHASE_7`: Đánh dấu các tiêu chí nghiệm thu chi tiết (Acceptance Oracles) sẽ được tôi luyện và mở rộng thành bộ kiểm thử nhị phân tại Phase 7.

### 2.1. Yêu cầu Vận hành Tác nghiệp Thực địa (Operational Field Requirements)

| BR ID | Tác nhân | Năng lực & Ngữ cảnh | Ca sử dụng (Use Case) | Đối tượng miền | Điều kiện Tiên quyết | Lệnh / Thao tác | Chuyển dịch Trạng thái | Nguồn Quyết định | Hậu điều kiện & Tiêu chuẩn nghiệm thu (Acceptance Reference) | Trạng thái Kiểm chứng |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---:|
| **BR-01** | Field Staff | Work Management (Core) | Xác thực tọa độ GPS gốc cây | `SiteVerification`, `Task` | Location granted; khoảng cách $\le 10$m | `VerifyGps` | Ghi nhận `gpsVerified = true` | Phase 5 `WF-03` | Khoảng cách $\le 10$m và timestamp ghi vào task. Không đổi TaskStatus. | `[NEEDS_EVIDENCE]` |
| **BR-01b** | Field Staff | Work Management (Core) | Báo cáo ngoại lệ vị trí | `VerificationException` | Đã thử lại GPS; khoảng cách $> 10$m; có lý do | `ReportLocationException` | Ghi nhận `LOCATION_EXCEPTION` | Phase 5 `WF-03` | Task mang cờ ngoại lệ vị trí; lưu vết khoảng cách đo để Quản lý hậu kiểm. | `[NOT_IMPLEMENTED]` |
| **BR-02** | Field Staff | Work Management (Core) | Quét mã QR thân cây | `SiteVerification`, `Task` | Camera granted; mã khớp 100% mã cây | `VerifyQr` | Ghi nhận `qrVerified = true` | Phase 5 `WF-03` | Đối soát khớp 100% mã cây được giao; không đổi TaskStatus. | `[NEEDS_EVIDENCE]` |
| **BR-02b** | Field Staff | Work Management (Core) | Báo cáo tem QR hỏng | `VerificationException` | Tem QR bị mờ/rách/mất; chụp ảnh tem + lý do | `ReportIdentityException` | Ghi nhận `IDENTITY_EXCEPTION` | Phase 5 `WF-03` | Task mang cờ ngoại lệ danh tính; cây mục tiêu giữ nguyên bất biến. | `[NOT_IMPLEMENTED]` |
| **BR-03** | Field Staff | Work Management (Core) | Bắt đầu làm việc | `Task` | Task thuộc sở hữu Staff; trạng thái `PENDING` | `StartTask` | `PENDING` $\to$ `IN_PROGRESS` | Phase 5 `WF-02` | DUY NHẤT lệnh này chuyển sang `IN_PROGRESS`; snapshot mẫu checklist. | `[PARTIALLY_IMPLEMENTED]` |
| **BR-04** | Field Staff | Work Management (Core) | Thu thập bằng chứng CHANGE_PROOF | `TaskEvidence`, `Task` | Task gán hồ sơ `CHANGE_PROOF`; Camera granted | `CaptureProofEvidence` | Ghi nhận Trước $\to$ Checklist $\to$ Sau | Phase 5 `WF-04` | Đủ ảnh Trước, 100% checklist hoàn tất, và ảnh Sau nghiệm thu. | `[PARTIALLY_IMPLEMENTED]` |
| **BR-04b** | Field Staff | Work Management (Core) | Thu thập bằng chứng SERVICE_PROOF | `TaskEvidence`, `Task` | Task gán hồ sơ `SERVICE_PROOF`; Camera granted | `CaptureProofEvidence` | Ghi nhận Checklist $\to$ Ảnh Hoàn thành | Phase 5 `WF-04` | Đủ 100% checklist thao tác và 01 ảnh hoàn thành. Không bắt ảnh Trước. | `[NOT_IMPLEMENTED]` |
| **BR-04c** | Field Staff | Work Management (Core) | Thu thập bằng chứng INSPECTION_PROOF | `TaskEvidence`, `Task` | Task gán hồ sơ `INSPECTION_PROOF`; Camera granted | `CaptureProofEvidence` | Ghi nhận Findings $\to$ Ảnh hiện trạng | Phase 5 `WF-04` | Đủ bảng phát hiện có cấu trúc (`StructuredFindings`) và ảnh hiện trạng. | `[NOT_IMPLEMENTED]` |
| **BR-05** | Field Staff | Work Management (Core) | Báo cáo sự cố hiện trường | `FieldIssue`, `Task` | Trở ngại bất khả kháng; chụp ảnh sự cố + lý do | `ReportFieldIssue` | `IN_PROGRESS` $\to$ `BLOCKED` | Phase 5 `WF-08` | Task chuyển sang `BLOCKED`; cảnh báo xuất hiện tại hàng đợi Quản lý. | `[NOT_IMPLEMENTED]` |
| **BR-05b** | Operations Manager | Work Management (Core) | Giải tỏa sự cố hiện trường | `Task`, `FieldIssue` | Task đang ở trạng thái `BLOCKED` | `ResumeBlockedTask` / `Reassign` / `Cancel` | `BLOCKED` $\to$ `IN_PROGRESS` / `PENDING` / `CANCELLED` | Phase 5 `WF-08` | Đúng 3 lối thoát tất định: Resume, Reassign (Case B), Cancel. | `[NOT_IMPLEMENTED]` |
| **BR-06** | Field Staff | Work Management (Core) | Nộp chuỗi bằng chứng nghiệm thu | `Task`, `ProofProgress` | 100% bằng chứng đạt chuẩn theo ProofProfile | `SubmitEvidence` | `IN_PROGRESS` $\to$ `WAITING_REVIEW` | Phase 5 `WF-05` | Task vào hàng đợi Quản lý. Nếu nộp offline: server giữ `IN_PROGRESS`. | `[PARTIALLY_IMPLEMENTED]` |
| **BR-07** | Operations Manager | Work Management (Core) | Phê duyệt chuẩn đạt 100% | `Task`, `ReviewDecision` | 100% bằng chứng đạt chuẩn, không có sai sót | `ReviewApprove` | `WAITING_REVIEW` $\to$ `COMPLETED` | Phase 5 `WF-06` | Task đóng vĩnh viễn (Terminal Success); chiếu bản ghi vào `CareHistory`. | `[NEEDS_EVIDENCE]` |
| **BR-07b** | Operations Manager | Work Management (Core) | Phê duyệt có ngoại lệ | `Task`, `ReviewDecision` | Việc làm thật, có ngoại lệ; Quản lý chịu trách nhiệm | `ReviewApproveWithException`| `WAITING_REVIEW` $\to$ `COMPLETED` | Phase 5 `WF-06` | Task đóng vĩnh viễn; sinh `CareHistory` mang cờ `HAS_EXCEPTION`. | `[NOT_IMPLEMENTED]` |
| **BR-08** | Operations Manager | Work Management (Core) | Yêu cầu làm lại có mục tiêu | `Task`, `ReviewDecision` | Phát hiện sai sót; chỉ rõ `targetedArea` + lý do | `ReviewRequestRework` | `WAITING_REVIEW` $\to$ `REWORK_REQUIRED` | Phase 5 `WF-07` | Task về hàng đợi Staff; bảo lưu bằng chứng cũ; lưu vết `Attempt 1`. | `[PARTIALLY_IMPLEMENTED]` |
| **BR-08b** | Field Staff | Work Management (Core) | Nộp lại khâu làm lại | `Task`, `TaskEvidence` | Task ở `REWORK_REQUIRED`; sửa đúng khâu từ chối | `ResubmitRework` | `REWORK_REQUIRED` $\to$ `WAITING_REVIEW` | Phase 5 `WF-07` | Ghép bằng chứng cũ và khâu sửa mới thành `Attempt 2` gửi Quản lý. | `[NOT_IMPLEMENTED]` |
| **BR-09** | Operations Manager | Work Management (Core) | Hủy nhiệm vụ có lý do | `Task` | Task ở trạng thái chưa đóng; có lý do hủy | `CancelTask` | Bất kỳ $\to$ `CANCELLED` | Phase 5 `WF-09` | Bắt buộc nhập lý do; đóng vĩnh viễn; không sinh `CareHistory`. | `[NOT_IMPLEMENTED]` |
| **BR-10** | Operations Manager | Work Management (Core) | Phân công lại nhiệm vụ | `Task` | Task ở `PENDING` (Case A) hoặc `BLOCKED` (Case B) | `ReassignTask` | $\to$ `PENDING` | Phase 5 `WF-01`, `WF-08` | Gán cho Staff mới; giữ nguyên quyền tác giả của bằng chứng cũ. | `[NOT_IMPLEMENTED]` |
| **BR-11** | System | Tree Asset Registry | Chiếu Lịch sử chăm sóc | `CareHistory`, `Tree` | Task chuyển sang `COMPLETED` | `ProjectCareHistory` | Sinh bản ghi `CareHistory` | Phase 5 `WF-06` | CHỈ task `COMPLETED` mới sinh CareHistory; bảo lưu cờ ngoại lệ nếu có. | `[PARTIALLY_IMPLEMENTED]` |
| **BR-12** | Operations Manager | Work Management (Core) | Tạo việc gắn TaskType $\to$ Profile | `Task`, `Tree` | Chọn cây, chọn Staff, chọn `TaskType`, deadline | `CreateTask` | Khởi tạo $\to$ `PENDING` | Phase 5 `WF-01` | TaskType quyết định tất định ProofProfile; cấm Quản lý hạ cấp profile. | `[PARTIALLY_IMPLEMENTED]` |
| **BR-13** | Staff, Manager | Tree Asset Registry | Tra cứu thông tin cây qua QR | `Tree`, `CareHistory` | Camera granted; mã QR hợp lệ trong hệ thống | `LookupTreeByQr` | Truy vấn đọc dữ liệu | Phase 2 `WF-13` | Hiển thị hồ sơ cây, tọa độ, sức khỏe và CareHistory hoàn tất. | `[CURRENTLY_IMPLEMENTED]` |

---

### 2.2. Yêu cầu Quản trị Nền tảng (Platform Governance Requirements)

| BR ID | Tác nhân | Năng lực & Ngữ cảnh | Ca sử dụng (Use Case) | Đối tượng miền | Điều kiện Tiên quyết | Lệnh / Thao tác | Chuyển dịch Trạng thái | Nguồn Quyết định | Hậu điều kiện & Tiêu chuẩn nghiệm thu (Acceptance Reference) | Trạng thái Kiểm chứng |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---:|
| **BR-ACT-01** | Platform / System | IAM / Governance | Mô hình tác nhân 3 vai trò chuẩn | `UserRole`, `Actor` | Hệ thống khởi tạo | Khởi tạo mô hình tác nhân | Thiết lập phân quyền | Phase 1 `02-ACTOR` | Phân tách rạch ròi Field Staff, Operations Manager, Platform Admin, System. Cấm quan hệ kế thừa cấp bậc. | `[PLANNED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-01** | Platform Administrator | Identity & Access (`CAP-ADM-01`) | Khởi tạo tài khoản người dùng mới | `User`, `Account` | Admin `ACTIVE`; Email/Phone duy nhất | `ProvisionUser` | Khởi tạo $\to$ `INVITED`/`ACTIVE` | Phase 2, 5 `WF-10` | Khởi tạo danh tính an toàn; Admin không bao giờ thấy mật khẩu rõ. Lưu vết kiểm toán. | `[NOT_IMPLEMENTED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-02** | Platform Administrator | Identity & Access (`CAP-ADM-02`) | Điều chỉnh vai trò người dùng | `RoleAssignment` | Admin `ACTIVE`; cấm tự đổi quyền (`ADM-SOD-01`) | `AssignRole` | Cập nhật `User.role` | Phase 2, 5 `WF-11` | Rà soát xung đột trách nhiệm (`Role Change Impact Check`); giải tỏa task dở dang trước khi đổi quyền. | `[NOT_IMPLEMENTED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-02b**| System / Admin | IAM / Work Management | Chống tự duyệt bài khi thăng chức | `Task`, `ReviewDecision` | Staff được thăng chức thành Manager | Gác cổng thẩm định | Chặn tự duyệt bài | Phase 5 `WF-11` | Người từng thi công task (`executedBy`) bị cấm 100% duyệt task đó sau khi lên Manager (`DR-HARD-02`). | `[PLANNED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-03** | Platform Administrator | Identity & Access (`CAP-ADM-03`) | Khóa tạm thời tài khoản người dùng | `Account` | Admin `ACTIVE`; có lý do văn bản | `SuspendAccount` | `ACTIVE` $\to$ `SUSPENDED` | Phase 2, 5 `WF-12` | Tài khoản mất quyền xác thực; phát sự kiện `USER_NOT_OPERATIONALLY_AVAILABLE`; không tự đổi `TaskStatus`. | `[NOT_IMPLEMENTED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-03b**| Operations Manager | Work Management (`WF-12`) | Xử lý công việc khi nhân sự bị khóa | `Task` | Nhận sự kiện Staff bị khóa IAM | `CancelTask` / `Reassign` | Giải tỏa khối lượng việc | Phase 5 `WF-12` | Áp dụng Ma trận xử lý khối lượng công việc: PENDING reassign, IN_PROGRESS cancel + tạo task thay thế (WF-01). | `[PLANNED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-04** | Platform Administrator | Identity & Access (`CAP-ADM-04`) | Mở khóa & Khôi phục thông tin xác thực | `Account` | Admin `ACTIVE`; tài khoản bị khóa | `UnlockAccount` / `ResetCredential` | $\to$ `ACTIVE` | Phase 2 `04-SCOPE` | Mở khóa tài khoản nhập sai pass; gửi cơ chế thiết lập mật khẩu an toàn. | `[NOT_IMPLEMENTED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-05** | Platform Administrator | Audit & Compliance (`CAP-ADM-05`) | Tra cứu & Lọc sổ nhật ký kiểm toán | `AuditEvent` | Admin `ACTIVE` | `ViewAuditLog` / `FilterAuditLog` | Truy vấn chỉ-đọc | Phase 2, 5 `WF-17` | Xem log từ kho Append-Only; lọc theo thời gian, actor, action; cấm sửa/xóa log (`ADM-SOD-03`). | `[NOT_IMPLEMENTED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-06** | Platform Administrator | Tree Asset Registry (`CAP-ADM-06`) | Tạo mới cây trong sổ bộ Master Data | `Tree` | Admin `ACTIVE`; `treeId`, `qrCode` duy nhất | `CreateTree` | Khởi tạo thực thể `Tree` | Phase 2, 5 `WF-13` | `treeId` bất biến; `qrCode` duy nhất; tọa độ GPS chuẩn hợp lệ định dạng/dải đo (không yêu cầu duy nhất). | `[NOT_IMPLEMENTED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-06b**| Platform Administrator | Tree Asset Registry (`CAP-ADM-06`) | Cấp đổi tem QR bị hỏng ngoài thực địa | `Tree` | Tem QR hỏng; chuỗi QR mới duy nhất | `ReplaceTreeQrCode` | Cập nhật `Tree.qrCode` | Phase 2, 5 `WF-13` | Cấp mã QR mới duy nhất; giữ nguyên `treeId`; không viết lại dữ liệu quét QR của các task cũ trong quá khứ. | `[NOT_IMPLEMENTED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-06c**| Platform Administrator | Tree Asset Registry (`CAP-ADM-06`) | Cập nhật tọa độ chuẩn trắc địa | `Tree` | Có biên bản trắc địa; tọa độ hợp lệ | `UpdateCanonicalCoordinates` | Cập nhật `Tree.location` | Phase 2, 5 `WF-13` | Cập nhật tọa độ chuẩn kèm lý do bắt buộc; không làm thay đổi tọa độ đo thực tế của các task cũ. | `[NOT_IMPLEMENTED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-06d**| Platform Administrator | Tree Asset Registry (`CAP-ADM-06`) | Thanh lý cây xanh bị đốn hạ | `Tree` | Cây bị chết hoặc đốn hạ vĩnh viễn | `RetireTree` | `Tree.status = RETIRED` | Phase 2, 5 `WF-13` | Chuyển sang `RETIRED`; chặn tạo task mới cho cây này; không xóa vật lý bản ghi. | `[NOT_IMPLEMENTED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-07** | Platform Administrator | Policy & Template (`CAP-ADM-07`) | Quản trị danh mục loại việc lâm sinh | `TaskTypeCatalog` | Admin `ACTIVE` | `CreateTaskType` / `Deactivate` | Cập nhật Catalog | Phase 2, 5 `WF-14` | Tạo/ẩn loại việc; `TaskTypeCatalog` là tài nguyên kiểm toán; cấm xóa cứng loại việc đã có task. | `[NOT_IMPLEMENTED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-08** | Platform Administrator | Policy & Template (`CAP-ADM-08`) | Ban hành phiên bản chính sách bằng chứng | `ProofPolicyMapping` | Admin `ACTIVE`; gán TaskType $\to$ Profile | `PublishProofPolicyVersion` | Ban hành `PolicyVersion` | Phase 2, 5 `WF-15` | Đánh số phiên bản mới; áp dụng cho các task tạo mới trong tương lai; không áp dụng hồi tố task đang chạy. | `[NOT_IMPLEMENTED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-09** | Platform Administrator | Policy & Template (`CAP-ADM-09`) | Ban hành phiên bản mẫu checklist | `ChecklistTemplate` | Admin `ACTIVE`; danh sách tiêu chuẩn hợp lệ | `PublishChecklistTemplate` | Ban hành `TemplateVersion` | Phase 2, 5 `WF-16` | Ban hành phiên bản mới; áp dụng cơ chế snapshot độc lập khi `StartTask`; không làm đổi task đang thi công. | `[NOT_IMPLEMENTED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-ADM-10** | Platform Administrator | Policy & Template (`CAP-ADM-10`) | Biểu mẫu khám bệnh động (NEXT) | `FindingsSchema` | Giai đoạn sau MVP | `ManageDynamicFindings` | Bảo lưu giai đoạn NEXT | Phase 2 `04-SCOPE` | Biểu mẫu khám bệnh động được bảo lưu ở giai đoạn NEXT; MVP áp dụng Fixed Schema cho `StructuredFindings`. | `[PLANNED]` (NEXT) |
| **BR-ADM-11** | Platform Administrator | Governance Plane (`CAP-ADM-11`) | Can thiệp vượt quyền khẩn cấp (NEXT) | Khẩn cấp | Thiên tai bão lũ cấp tập | `UseBreakGlass` | Bảo lưu giai đoạn NEXT | Phase 2 `04-SCOPE` | Break-glass có thời hạn và kiểm toán tối cao; bị khóa hoàn toàn tại MVP. | `[PLANNED]` (NEXT) |
| **BR-ADM-12** | System | Audit & Compliance (`CAP-ADM-12`)| Cảnh báo an ninh quản trị (NEXT) | `AuditEvent` | Biến động quyền quản trị cấp cao | `SendSecurityAlert` | Bảo lưu giai đoạn NEXT | Phase 2 `04-SCOPE` | Cảnh báo tự động cho ban giám sát an ninh; được bảo lưu phát triển đồng bộ khi có Break-glass. | `[PLANNED]` (NEXT) |
| **BR-ADM-13** | N/A | N/A (`CAP-ADM-13`) | Quản trị cấu hình hạ tầng tùy tiện | N/A | N/A | N/A | **BÁC BỎ HOÀN TOÀN** | Phase 2 `04-SCOPE` | Cấu hình tham số hệ thống hạ tầng tùy tiện không gắn nghiệp vụ bị loại trừ dứt khoát khỏi sản phẩm. | `[REJECTED]` |
| **BR-DOM-01** | Architecture / System | Bounded Contexts | Đơn vị sở hữu thẩm quyền đơn nhất | Toàn bộ Entities | Khởi tạo kiến trúc | Ánh xạ Model $\to$ Context | Chuẩn hóa sở hữu miền | Phase 3 `05-DOMAIN` | Mỗi Aggregate/Entity thuộc quyền sở hữu độc quyền của đúng một Bounded Context. Không gộp context tùy tiện. | `[PLANNED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-DOM-02** | Architecture / System | Work Management | Vòng đời 7 trạng thái & Trạng thái đóng | `Task` | Vòng đời nhiệm vụ | Chuyển dịch trạng thái | 7 trạng thái chuẩn tắc | Phase 4 `07-AUTH` | Đúng 7 trạng thái. `COMPLETED` và `CANCELLED` là bất biến đóng vĩnh viễn, cấm mở lại (`DR-HARD-05`). | `[PLANNED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-DOM-03** | Mobile Client / Server | Integration & Client Outbox | Tách biệt trạng thái ngoại tuyến | `LocalSubmissionStatus` | Mất mạng ngoài thực địa | Nộp bài offline (`WF-18`) | Client Outbox Store | Phase 5 `WF-18` | Nộp offline đặt `LocalSubmissionStatus = PENDING_SYNC`; server giữ nguyên `IN_PROGRESS` (`DR-TECH-01`). | `[PLANNED]` (TO_BE_HARDENED_IN_PHASE_7) |
| **BR-DOM-04** | Platform Administrator | Governance / Work Management | Cấm Admin thao tác Task thực địa | `Task` | Admin đăng nhập | Thao tác tác nghiệp Task | **BỊ CẤM 100% (DENY)** | Phase 4, 5 `WF-01..09` | Admin hoàn toàn không có làn bơi (Swimlane) trong quy trình hiện trường; cấm tạo việc, duyệt việc hay đổi người. | `[PLANNED]` (TO_BE_HARDENED_IN_PHASE_7) |

---

## 3. Định nghĩa sẵn sàng cho tính năng (Definition of Ready - DoR)

Trước khi bất kỳ màn hình hoặc tính năng nào được phép đưa vào mã hóa, nhóm phát triển bắt buộc phải trả lời đầy đủ **26 câu hỏi thẩm định**:

1. **Work Object:** Tính năng thao tác trên đối tượng nghiệp vụ nào (`Task`, `Tree`, `SiteVerification`, `FieldIssue`, `Account`...)?
2. **Actor:** Tác nhân vận hành là ai (`Field Staff`, `Operations Manager`, `Platform Administrator`)?
3. **Actor Scope:** Tác nhân thuộc phạm vi sở hữu nào (`task.assignedStaffId`, `AUTHORIZED_OPERATIONAL_SCOPE`, `PLATFORM_GOVERNANCE_SCOPE`)?
4. **Capability:** Thuộc năng lực nghiệp vụ nào trong Business Capability Map (`CAP-01..05`, `CAP-ADM-01..09`)?
5. **Use Case:** Ca sử dụng cụ thể là gì?
6. **Current State:** Trạng thái đầu vào của đối tượng là gì?
7. **Valid States:** Những trạng thái nào cho phép hành động này kích hoạt?
8. **Primary Goal:** Mục tiêu nghiệp vụ cao nhất cần đạt được là gì?
9. **Primary Action:** Nút bấm / Hành động chính trên giao diện là gì?
10. **Preconditions:** Điều kiện tiên quyết bắt buộc trước khi thực hiện?
11. **Action Eligibility:** Công thức kích hoạt hành động (`Role` $\land$ `Scope` $\land$ `State` $\land$ `Preconditions`)?
12. **Blocked Reasons:** Nếu bị chặn, câu thông báo giải thích cho người dùng là gì?
13. **State Transition:** Đối tượng sẽ chuyển sang trạng thái mới nào?
14. **Next Owner / Handoff:** Ai là người tiếp nhận công việc tiếp theo (`HO-01..12`)?
15. **Query / Command:** Thao tác này là đọc dữ liệu (Query) hay biến đổi trạng thái (Command)?
16. **API Contract:** Dùng DTO / Request / Response nào trong `@novyx/contracts`?
17. **Loading State:** Giao diện hiển thị thế nào trong lúc chờ xử lý?
18. **Refreshing State:** Cơ chế kéo để làm mới (Pull-to-refresh) ra sao?
19. **Empty State:** Giao diện hiển thị thế nào khi danh sách rỗng?
20. **Error State:** Giao diện xử lý lỗi mạng / lỗi server thế nào?
21. **Offline State:** Tính năng có hoạt động được khi mất mạng không? Có phân tách `SyncStatus` không?
22. **Device Permission:** Cần quyền Camera hay GPS không? Cơ chế xin quyền theo ngữ cảnh ra sao?
23. **Recovery Path:** Khi gặp lỗi, người dùng có thể thử lại bằng cách nào?
24. **Accessibility:** Độ tương phản ($\ge 4.5:1$) và vùng chạm nút ($\ge 48 \times 48\text{px}$) có đạt chuẩn không?
25. **NFR Scenario:** Đáp ứng kịch bản chất lượng nào (QAS-PERF, QAS-OFFLINE, QAS-A11Y...)?
26. **Out of Scope:** Những khía cạnh nào cố tình loại trừ, không làm trong tính năng này?

---

## 4. Định nghĩa hoàn thành dựa trên bằng chứng (Definition of Done - DoD)

Một tính năng **KHÔNG ĐƯỢC COI LÀ HOÀN THÀNH** chỉ vì mã nguồn biên dịch thành công (`typecheck` pass) hay UI render không báo lỗi đỏ. Hệ thống yêu cầu **Chuỗi bằng chứng thực nghiệm 6 tầng (Multi-Layer Evidence Chain)**:

```text
[TẦNG 1: DOMAIN INVARIANT EVIDENCE]
  - Bằng chứng: Unit Test chứng minh các bất biến (DR-HARD-01..07, DR-MVP-01..06) được bảo vệ.
  - Ví dụ: Test chứng minh nhân viên không thể tự phê duyệt task của mình; cây mục tiêu bất biến; Admin cấm duyệt task.

[TẦNG 2: APPLICATION STATE TRANSITION EVIDENCE]
  - Bằng chứng: Test chứng minh Command tạo ra đúng State Transition trong 7 trạng thái tất định.
  - Ví dụ: StartTask chuyển PENDING -> IN_PROGRESS; ReportFieldIssue chuyển sang BLOCKED; CancelTask sang CANCELLED.

[TẦNG 3: API CONTRACT COMPLIANCE EVIDENCE]
  - Bằng chứng: Dữ liệu gửi và nhận khớp 100% với Envelope và Schema trong @novyx/contracts.

[TẦNG 4: PERSISTENCE & OFFLINE FAULT TOLERANCE EVIDENCE]
  - Bằng chứng: Bản nháp bằng chứng và Outbox sống sót sau khi kill app hoặc ngắt kết nối mạng.
  - Phân tách độc lập LocalSubmissionStatus = PENDING_SYNC trong khi server TaskStatus = IN_PROGRESS.

[TẦNG 5: MOBILE RUNTIME & HARDWARE COORDINATION EVIDENCE]
  - Bằng chứng: Thử nghiệm trên máy thật Android chứng minh quyền Camera và GPS hoạt động mượt mà;
  - Khóa tài nguyên Camera (CameraResourceLock) ngăn chặn hoàn toàn hiện tượng đen màn hình.

[TẦNG 6: NFR BENCHMARK EVIDENCE]
  - Bằng chứng: Danh sách nhiệm vụ và danh mục cây sử dụng FlatList ảo hóa; tỷ lệ rớt khung hình < 5%.
```
