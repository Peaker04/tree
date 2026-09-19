# NOVYX GreenOps — Requirements Taxonomy, Traceability & Quality Gates

Tài liệu này là chuẩn mực duy nhất định nghĩa **PHÂN LOẠI YÊU CẦU (Requirements Taxonomy)**, **MA TRẬN TRUY VẾT YÊU CẦU ĐẦU-CUỐI (End-to-End Traceability Matrix)**, **ĐỊNH NGHĨA SẴN SÀNG (Definition of Ready - DoR)** và **ĐỊNH NGHĨA HOÀN THÀNH (Definition of Done - DoD)**.

---

## 1. Phân loại yêu cầu hệ thống (Requirements Taxonomy)

Hệ thống phân chia yêu cầu thành các nhóm chuẩn tắc nhằm đảm bảo tính toàn diện và không bỏ sót khía cạnh kỹ thuật:

| Mã tiền tố | Nhóm yêu cầu                | Ý nghĩa & Thẩm quyền                                | Ví dụ minh họa                                                           |
| :--------- | :-------------------------- | :-------------------------------------------------- | :----------------------------------------------------------------------- |
| **BR**     | Business Requirements       | Mục tiêu kinh doanh, giá trị vận hành cốt lõi       | `BR-01`: Tăng cường tính xác thực và tin cậy của bằng chứng hiện trường. |
| **FR**     | Functional Requirements     | Tính năng nghiệp vụ người dùng tương tác trực tiếp  | `FR-01`: Nhân viên nộp chuỗi bằng chứng theo ProofProfile.               |
| **DR**     | Domain Rules / Invariants   | Bất biến nghiệp vụ bắt buộc tuân thủ                | `DR-HARD-01`: Cây mục tiêu bất biến trong suốt quá trình làm việc.       |
| **AR**     | Authorization Requirements  | Phân quyền vai trò và điều kiện kích hoạt hành động | `AR-01`: Chỉ Quản lý mới có quyền phê duyệt đóng nhiệm vụ.               |
| **IR**     | Integration Requirements    | Giao thức kết nối giữa Mobile, Backend và Ngoại vi  | `IR-01`: Gửi bằng chứng qua multipart khi có file ảnh nhị phân.          |
| **DRT**    | Data Requirements           | Ràng buộc cấu trúc dữ liệu, audit trail, lưu trữ    | `DRT-01`: Mỗi ảnh bằng chứng phải gắn chặt với timestamp và tọa độ.      |
| **NFR**    | Non-Functional Requirements | Hiệu năng, độ bền, độ tin cậy, khả năng chịu lỗi    | `NFR-01`: Danh sách cuộn mượt không rớt khung hình trên RAM 3GB.         |
| **UXR**    | Usability Requirements      | Trải nghiệm người dùng ngoài trời, thao tác 1 tay   | `UXR-01`: Vùng chạm nút bấm chính tối thiểu $48 \times 48\text{px}$.     |
| **A11Y**   | Accessibility Requirements  | Khả năng tiếp cận, tương phản ánh sáng ngoài trời   | `A11Y-01`: Độ tương phản văn bản đạt chuẩn WCAG AA $\ge 4.5:1$.          |
| **SEC**    | Security Requirements       | Bảo mật phiên, mã hóa dữ liệu, an toàn thiết bị     | `SEC-01`: Token JWT được lưu an toàn; tự động làm mới khi hết hạn.       |
| **OBS**    | Observability Requirements  | Giám sát hệ thống, theo dõi lỗi, truy vết request   | `OBS-01`: Mọi request API đều mang `requestId` duy nhất.                 |
| **TEST**   | Verification Requirements   | Phương pháp và tầng kiểm chứng tính đúng đắn        | `TEST-01`: Vòng đời 7 trạng thái kiểm chứng bằng State Machine Test.     |

---

## 2. Ma trận truy vết yêu cầu đầu-cuối chuẩn tắc (End-to-End Traceability Matrix)

> **Kỷ luật kiểm chứng (Verification Discipline):**<br>
> Tuyệt đối không ghi `PASS` cho các bài kiểm thử chưa được xây dựng tự động hoặc chưa có bằng chứng runtime thực tế.<br>
> Bảng sử dụng hệ thống nhãn trạng thái chính xác phản ánh thực tế mã nguồn đối chiếu với Acceptance Oracle:<br>
>
> - `[CURRENTLY_IMPLEMENTED]`: Mã nguồn hiện tại thực sự đáp ứng đầy đủ tiêu chuẩn nghiệm thu (Acceptance Oracle) của hợp đồng mục tiêu.<br>
> - `[PARTIALLY_IMPLEMENTED]`: Đã có một phần cơ chế trong mã nguồn hiện tại nhưng chưa đáp ứng đầy đủ ngữ nghĩa chuẩn tắc mục tiêu (ví dụ: có chuỗi 5 bước cố định nhưng chưa có kiến trúc ProofProfile đa hình, có form từ chối text thô nhưng chưa có targetedArea cấu trúc hay đa phiên bản).<br>
> - `[NEEDS_EVIDENCE]`: Đã có mã sơ khởi trong codebase nhưng thiếu bài test tự động hoặc chứng cứ runtime để xác nhận hành vi đạt chuẩn.<br>
> - `[PLANNED]`: Đã xác lập hợp đồng nghiệp vụ chuẩn tắc trong tài liệu Canonical, đang chờ triển khai ở pha sau.<br>
> - `[NOT_IMPLEMENTED]`: Khoảng trống nghiệp vụ mục tiêu hoàn toàn chưa có mã nguồn tương ứng trong repository baseline (`2f9a26b`).

| BR ID      | Tác nhân       | Năng lực (Capability)    | Ca sử dụng (Use Case)                | Đối tượng miền             | Điều kiện tiên quyết                                                                   | Lệnh / Thao tác              | Chuyển dịch trạng thái                                  | Chủ sở hữu tương lai        | Hợp đồng API (`@novyx/contracts`)                  | Màn hình / UI Control         | Hậu điều kiện & Tiêu chuẩn nghiệm thu (Acceptance Oracle)                                                                                                                                                                                                        | Trạng thái kiểm chứng     |
| :--------- | :------------- | :----------------------- | :----------------------------------- | :------------------------- | :------------------------------------------------------------------------------------- | :--------------------------- | :------------------------------------------------------ | :-------------------------- | :------------------------------------------------- | :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------ |
| **BR-01**  | Staff          | Field Work Verification  | Xác thực tọa độ GPS gốc cây          | `SiteVerification`, `Task` | Quyền Location granted; khoảng cách $\le 10$m                                          | `VerifyGps`                  | Ghi nhận `gpsVerified = true`                           | `LocationService`           | `GpsCheckDto`                                      | Nút "Lấy GPS hiện tại"        | Tọa độ, khoảng cách $\le 10$m và timestamp được ghi nhận vào task.                                                                                                                                                                                               | `[NEEDS_EVIDENCE]`        |
| **BR-01b** | Staff          | Field Work Verification  | Báo cáo ngoại lệ vị trí              | `VerificationException`    | Đã thử lại đo GPS; khoảng cách $> 10$m; có lý do                                       | `ReportLocationException`    | Ghi nhận `LOCATION_EXCEPTION`                           | `LocationService`           | `LocationExceptionDto`                             | Nút "Giải trình ngoại lệ GPS" | Task mang cờ ngoại lệ vị trí; lưu vết khoảng cách đo được để Quản lý hậu kiểm.                                                                                                                                                                                   | `[NOT_IMPLEMENTED]`       |
| **BR-02**  | Staff          | Field Work Verification  | Quét mã QR thân cây                  | `SiteVerification`, `Task` | Quyền Camera granted; mã khớp 100% mã cây                                              | `VerifyQr`                   | Ghi nhận `qrVerified = true`                            | `QrScannerService`          | `QrCheckDto`                                       | Camera Scanner / Input        | Đối soát khớp 100% mã cây được giao; mở bước thao tác tiếp theo.                                                                                                                                                                                                 | `[NEEDS_EVIDENCE]`        |
| **BR-02b** | Staff          | Field Work Verification  | Báo cáo tem QR hỏng                  | `VerificationException`    | Tem QR bị mờ/rách/mất; chụp ảnh tem hỏng + lý do                                       | `ReportIdentityException`    | Ghi nhận `IDENTITY_EXCEPTION`                           | `QrScannerService`          | `IdentityExceptionDto`                             | Nút "Báo tem QR hỏng"         | Task mang cờ ngoại lệ danh tính; cây mục tiêu giữ nguyên bất biến.                                                                                                                                                                                               | `[NOT_IMPLEMENTED]`       |
| **BR-03**  | Staff          | Work Management          | Bắt đầu thực hiện nhiệm vụ           | `Task`                     | Task thuộc sở hữu Staff; trạng thái `PENDING`                                          | `StartTask`                  | `PENDING` $\to$ `IN_PROGRESS`                           | `TaskWorkflowService`       | `StartTaskRequest`                                 | Nút "Bắt đầu làm việc"        | DUY NHẤT lệnh này chuyển trạng thái sang `IN_PROGRESS`. Mở task không đổi trạng thái. _(Hiện trạng có nút bấm và GPS check-in chuyển sang IN_PROGRESS trong StaffProofFlow, nhưng chưa chuẩn hóa thành lệnh StartTask độc lập và chưa có StartTaskRequest API)_. | `[PARTIALLY_IMPLEMENTED]` |
| **BR-04**  | Staff          | Field Work Verification  | Thu thập bằng chứng CHANGE_PROOF     | `TaskEvidence`, `Task`     | Task gán hồ sơ `CHANGE_PROOF`; Camera granted                                          | `CaptureChangeProof`         | Ghi nhận Trước $\to$ Checklist $\to$ Sau                | `ProofService`              | `TaskEvidenceDto`                                  | PhotoPreview, ChecklistForm   | Đủ ảnh Trước, 100% checklist hoàn tất, và ảnh Sau nghiệm thu. _(Hiện trạng mới có chuỗi 5 bước cố định, chưa có kiến trúc ProofProfile)_.                                                                                                                        | `[PARTIALLY_IMPLEMENTED]` |
| **BR-04b** | Staff          | Field Work Verification  | Thu thập bằng chứng SERVICE_PROOF    | `TaskEvidence`, `Task`     | Task gán hồ sơ `SERVICE_PROOF`; Camera granted                                         | `CaptureServiceProof`        | Ghi nhận Checklist $\to$ Ảnh Hoàn thành                 | `ProofService`              | `TaskEvidenceDto`                                  | ChecklistForm, PhotoPreview   | Đủ 100% checklist thao tác và 01 ảnh hoàn thành công tác. Không bắt ảnh Trước.                                                                                                                                                                                   | `[NOT_IMPLEMENTED]`       |
| **BR-04c** | Staff          | Field Work Verification  | Thu thập bằng chứng INSPECTION_PROOF | `TaskEvidence`, `Task`     | Task gán hồ sơ `INSPECTION_PROOF`; Camera granted                                      | `CaptureInspectionProof`     | Ghi nhận Findings $\to$ Ảnh hiện trạng                  | `ProofService`              | `InspectionFindingDto`                             | FindingsForm, PhotoList       | Đủ bảng tiêu chí phát hiện có cấu trúc và các ảnh hiện trạng minh chứng.                                                                                                                                                                                         | `[NOT_IMPLEMENTED]`       |
| **BR-05**  | Staff          | Field Work Verification  | Báo cáo sự cố hiện trường            | `FieldIssue`, `Task`       | Trở ngại bất khả kháng; chụp ảnh sự cố + lý do                                         | `ReportFieldIssue`           | `IN_PROGRESS` $\to$ `BLOCKED`                           | `FieldIssueService`         | `ReportFieldIssueRequest`                          | Nút "Báo cáo sự cố"           | Task chuyển sang `BLOCKED`; xuất hiện cảnh báo tại hàng đợi của Quản lý.                                                                                                                                                                                         | `[NOT_IMPLEMENTED]`       |
| **BR-05b** | Manager        | Work Management          | Giải tỏa sự cố hiện trường           | `Task`, `FieldIssue`       | Task đang ở trạng thái `BLOCKED`                                                       | `ResolveBlocked`             | `BLOCKED` $\to$ `IN_PROGRESS` / `PENDING` / `CANCELLED` | `ManagerTaskService`        | `ResolveBlockedRequest`                            | Hộp thoại xử lý sự cố         | 3 lối thoát tất định: Tiếp tục (`IN_PROGRESS`), Đổi người (`PENDING`), Hủy việc (`CANCELLED`).                                                                                                                                                                   | `[NOT_IMPLEMENTED]`       |
| **BR-06**  | Staff          | Field Work Verification  | Nộp chuỗi bằng chứng nghiệm thu      | `Task`, `ProofProgress`    | **100% bằng chứng đạt hợp đồng theo ProofProfile**                                     | `SubmitTaskEvidence`         | `IN_PROGRESS` $\to$ `WAITING_REVIEW`                    | `EvidenceSubmissionService` | `SubmitTaskEvidenceRequest`                        | Nút "Gửi duyệt kết quả"       | Task vào hàng đợi Quản lý. Nếu nộp offline: server giữ `IN_PROGRESS`, client đặt `PENDING_SYNC`. _(Hiện trạng nộp qua API hoặc fallback RAM, chưa có Outbox ngoại tuyến)_.                                                                                       | `[PARTIALLY_IMPLEMENTED]` |
| **BR-07**  | Manager        | Review & Quality Control | Phê duyệt chuẩn đạt 100%             | `Task`, `ReviewDecision`   | 100% bằng chứng đạt chuẩn, không có sai sót                                            | `ReviewApprove`              | `WAITING_REVIEW` $\to$ `COMPLETED`                      | `ManagerReviewService`      | `ReviewDecisionRequest` (`approve`)                | Nút "Phê duyệt"               | Task đóng vĩnh viễn (Terminal Success); chiếu bản ghi chính thức vào `CareHistory`.                                                                                                                                                                              | `[NEEDS_EVIDENCE]`        |
| **BR-07b** | Manager        | Review & Quality Control | Phê duyệt có ngoại lệ                | `Task`, `ReviewDecision`   | Việc đã làm thật, có ngoại lệ không thể tạo lại; Quản lý chịu trách nhiệm              | `ReviewApproveWithException` | `WAITING_REVIEW` $\to$ `COMPLETED`                      | `ManagerReviewService`      | `ReviewDecisionRequest` (`approve_with_exception`) | Nút "Nghiệm thu ngoại lệ"     | Task đóng vĩnh viễn; sinh bản ghi `CareHistory` mang cờ `HAS_EXCEPTION` kèm lý do.                                                                                                                                                                               | `[NOT_IMPLEMENTED]`       |
| **BR-08**  | Manager        | Review & Quality Control | Yêu cầu làm lại có mục tiêu          | `Task`, `ReviewDecision`   | Phát hiện sai sót; **chỉ rõ khâu sai sót (`targetedArea`) + nhập lý do**               | `ReviewRequestRework`        | `WAITING_REVIEW` $\to$ `REWORK_REQUIRED`                | `ManagerReviewService`      | `ReviewDecisionRequest` (`request_rework`)         | Nút "Yêu cầu làm lại"         | Task về hàng đợi Staff; bảo lưu bằng chứng hợp lệ cũ; lưu vết `Attempt 1`. _(Hiện trạng mới hỗ trợ lý do dạng text, chưa có targetedArea cấu trúc và versioned attempt)_.                                                                                        | `[PARTIALLY_IMPLEMENTED]` |
| **BR-08b** | Staff          | Field Work Verification  | Nộp lại khâu làm lại                 | `Task`, `TaskEvidence`     | Task ở `REWORK_REQUIRED`; bổ sung đúng khâu bị từ chối                                 | `ResubmitTargetedEvidence`   | `REWORK_REQUIRED` $\to$ `WAITING_REVIEW`                | `EvidenceSubmissionService` | `ResubmitEvidenceRequest`                          | Nút "Nộp lại bằng chứng"      | Ghép bằng chứng cũ và khâu sửa mới thành phiên bản `Attempt 2`; gửi lại cho Quản lý.                                                                                                                                                                             | `[NOT_IMPLEMENTED]`       |
| **BR-09**  | Manager        | Work Management          | Hủy nhiệm vụ có lý do                | `Task`                     | Task ở trạng thái chưa đóng (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING`, `REWORK`) | `CancelTask`                 | Bất kỳ $\to$ `CANCELLED`                                | `ManagerTaskService`        | `CancelTaskRequest`                                | Nút "Hủy nhiệm vụ"            | Bắt buộc nhập lý do; đóng vĩnh viễn (Terminal Void); không sinh `CareHistory`.                                                                                                                                                                                   | `[NOT_IMPLEMENTED]`       |
| **BR-10**  | Manager        | Work Management          | Phân công lại nhiệm vụ               | `Task`                     | Task ở `PENDING` hoặc `BLOCKED`; chọn nhân viên mới                                    | `ReassignTask`               | $\to$ `PENDING`                                         | `ManagerTaskService`        | `ReassignTaskRequest`                              | Nút "Phân công lại"           | Gán cho Staff mới; giữ nguyên quyền tác giả ban đầu của các bằng chứng lịch sử cũ.                                                                                                                                                                               | `[NOT_IMPLEMENTED]`       |
| **BR-11**  | System         | Tree Asset Registry      | Chiếu Lịch sử chăm sóc               | `CareHistory`, `Tree`      | **Task chuyển sang `COMPLETED`**                                                       | `ProjectCareHistory`         | Sinh bản ghi `CareHistory`                              | `CareHistoryProjector`      | `CareHistoryDto`                                   | Tab "Lịch sử chăm sóc"        | CHỈ task `COMPLETED` mới sinh Care History; bảo lưu cờ ngoại lệ nếu có. _(Hiện trạng buildCareHistory đang lọc cả WAITING_REVIEW)_.                                                                                                                              | `[PARTIALLY_IMPLEMENTED]` |
| **BR-12**  | Manager        | Work Management          | Tạo việc gắn TaskType $\to$ Profile  | `Task`, `Tree`             | Chọn cây, chọn Staff, chọn `TaskType`, hạn chót                                        | `CreateTask`                 | Khởi tạo $\to$ `PENDING`                                | `ManagerTaskService`        | `CreateTaskRequest`                                | Form "Tạo việc mới"           | TaskType quyết định tất định ProofProfile; Quản lý không thể hạ cấp profile của task. _(Hiện trạng mới có danh mục TaskType client, chưa có quan hệ ProofProfile ở hợp đồng)_.                                                                                   | `[PARTIALLY_IMPLEMENTED]` |
| **BR-13**  | Staff, Manager | Tree Asset Registry      | Tra cứu thông tin cây qua QR         | `Tree`, `CareHistory`      | Quyền Camera granted; mã QR hợp lệ trong hệ thống                                      | `LookupTreeByQr`             | Truy vấn đọc dữ liệu                                    | `TreeRegistryService`       | `TreeDto`, `CareHistoryDto`                        | QR Scanner / Màn hình Cây     | Hiển thị hồ sơ cây, tọa độ, trạng thái sức khỏe và lịch sử chăm sóc hoàn tất.                                                                                                                                                                                    | `[CURRENTLY_IMPLEMENTED]` |

---

## 3. Định nghĩa sẵn sàng cho tính năng (Definition of Ready - DoR)

Trước khi bất kỳ màn hình hoặc tính năng nào được phép đưa vào mã hóa, nhóm phát triển bắt buộc phải trả lời đầy đủ **26 câu hỏi thẩm định**:

1. **Work Object:** Tính năng thao tác trên đối tượng nghiệp vụ nào (`Task`, `Tree`, `SiteVerification`, `FieldIssue`...)?
2. **Actor:** Tác nhân vận hành là ai (`Staff`, `Manager`)?
3. **Actor Scope:** Tác nhân chỉ được xem dữ liệu cá nhân hay toàn tuyến?
4. **Capability:** Thuộc năng lực nghiệp vụ nào trong Business Capability Map?
5. **Use Case:** Ca sử dụng cụ thể là gì?
6. **Current State:** Trạng thái đầu vào của đối tượng là gì?
7. **Valid States:** Những trạng thái nào cho phép hành động này kích hoạt?
8. **Primary Goal:** Mục tiêu nghiệp vụ cao nhất cần đạt được là gì?
9. **Primary Action:** Nút bấm / Hành động chính trên giao diện là gì?
10. **Preconditions:** Điều kiện tiên quyết bắt buộc trước khi thực hiện?
11. **Action Eligibility:** Công thức kích hoạt hành động (Role + Scope + State + Preconditions)?
12. **Blocked Reasons:** Nếu bị chặn, câu thông báo giải thích cho người dùng là gì?
13. **State Transition:** Đối tượng sẽ chuyển sang trạng thái mới nào?
14. **Next Owner / Handoff:** Ai là người tiếp nhận công việc tiếp theo?
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
  - Ví dụ: Test chứng minh nhân viên không thể tự phê duyệt task của mình; cây mục tiêu bất biến.

[TẦNG 2: APPLICATION STATE TRANSITION EVIDENCE]
  - Bằng chứng: Test chứng minh Command tạo ra đúng State Transition trong 7 trạng thái tất định.
  - Ví dụ: StartTask chuyển PENDING -> IN_PROGRESS; ReportFieldIssue chuyển sang BLOCKED.

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
