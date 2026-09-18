# NOVYX GreenOps — Requirements Taxonomy, Traceability & Quality Gates

Tài liệu này là chuẩn mực duy nhất định nghĩa **PHÂN LOẠI YÊU CẦU (Requirements Taxonomy)**, **MA TRẬN TRUY VẾT YÊU CẦU ĐẦU-CUỐI (End-to-End Traceability Matrix)**, **ĐỊNH NGHĨA SẴN SÀNG (Definition of Ready - DoR)** và **ĐỊNH NGHĨA HOÀN THÀNH (Definition of Done - DoD)**.

---

## 1. Phân loại yêu cầu hệ thống (Requirements Taxonomy)

Hệ thống phân chia yêu cầu thành các nhóm chuẩn tắc nhằm đảm bảo tính toàn diện và không bỏ sót khía cạnh kỹ thuật:

| Mã tiền tố | Nhóm yêu cầu                | Ý nghĩa & Thẩm quyền                                | Ví dụ minh họa                                                         |
| ---------- | --------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| **BR**     | Business Requirements       | Mục tiêu kinh doanh, giá trị vận hành cốt lõi       | `BR-01`: Đảm bảo bằng chứng hiện trường không thể làm giả.             |
| **FR**     | Functional Requirements     | Tính năng nghiệp vụ người dùng tương tác trực tiếp  | `FR-01`: Nhân viên chụp và xem trước ảnh Before/After.                 |
| **DR**     | Domain Rules / Invariants   | Bất biến nghiệp vụ cứng bắt buộc phải tuân thủ      | `DR-01`: Bán kính GPS hợp lệ $\le 10$m.                                |
| **AR**     | Authorization Requirements  | Phân quyền vai trò và điều kiện kích hoạt hành động | `AR-01`: Chỉ Quản lý mới có quyền phê duyệt đóng nhiệm vụ.             |
| **IR**     | Integration Requirements    | Giao thức kết nối giữa Mobile, Backend và Ngoại vi  | `IR-01`: Gửi bằng chứng qua multipart khi có file ảnh nhị phân.        |
| **DRT**    | Data Requirements           | Ràng buộc cấu trúc dữ liệu, audit trail, lưu trữ    | `DRT-01`: Mỗi ảnh bằng chứng phải gắn chặt với timestamp và tọa độ.    |
| **NFR**    | Non-Functional Requirements | Hiệu năng, độ bền, độ tin cậy, khả năng chịu lỗi    | `NFR-01`: Danh sách cuộn không giật lag trên máy RAM 3GB.              |
| **UXR**    | Usability Requirements      | Trải nghiệm người dùng ngoài trời, thao tác 1 tay   | `UXR-01`: Vùng chạm nút bấm chính tối thiểu $48 \times 48\text{px}$.   |
| **A11Y**   | Accessibility Requirements  | Khả năng tiếp cận, tương phản ánh sáng ngoài trời   | `A11Y-01`: Độ tương phản văn bản đạt chuẩn WCAG AA $\ge 4.5:1$.        |
| **SEC**    | Security Requirements       | Bảo mật phiên, mã hóa dữ liệu, an toàn thiết bị     | `SEC-01`: Token JWT được lưu an toàn; tự động làm mới khi hết hạn.     |
| **OBS**    | Observability Requirements  | Giám sát hệ thống, theo dõi lỗi, truy vết request   | `OBS-01`: Mọi request API đều mang `requestId` duy nhất.               |
| **TEST**   | Verification Requirements   | Phương pháp và tầng kiểm chứng tính đúng đắn        | `TEST-01`: Cổng 5/5 proof phải được kiểm chứng bằng Unit Test độc lập. |

---

## 2. Ma trận truy vết yêu cầu đầu-cuối (End-to-End Traceability Matrix)

Ma trận này liên kết chặt chẽ từ **Mục tiêu kinh doanh** đến **Mã nguồn thực thi** và **Bằng chứng kiểm chứng**:

| BR ID     | Tác nhân       | Năng lực (Capability)    | Ca sử dụng (Use Case) | Đối tượng miền           | Điều kiện tiên quyết                         | Lệnh / Thao tác  | Chuyển dịch trạng thái                   | Chủ sở hữu mã nguồn hiện tại `[VERIFIED]`     | Hợp đồng API (`@novyx/contracts`)                     | Màn hình / Nút điều khiển     | Hậu điều kiện & Kết quả                         | Bằng chứng kiểm chứng (Acceptance Evidence)                |
| --------- | -------------- | ------------------------ | --------------------- | ------------------------ | -------------------------------------------- | ---------------- | ---------------------------------------- | --------------------------------------------- | ----------------------------------------------------- | ----------------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| **BR-01** | Staff          | Field Work Verification  | Xác thực tọa độ GPS   | `GpsCheck`, `Task`       | Quyền Location granted, cách cây $\le 10$m   | `VerifyGps`      | `gpsCheck.verified = true`               | `StaffProofFlow.tsx`                          | `GpsCheckDto`                                         | Nút "Lấy GPS hiện tại"        | Tọa độ và khoảng cách được ghi nhận vào task    | Unit test `distance <= 10`; Runtime GPS mock test PASS     |
| **BR-01** | Staff          | Field Work Verification  | Quét mã QR cây        | `QrCheck`, `Task`        | Quyền Camera granted, mã khớp 100%           | `VerifyQr`       | `qrCheck.verified = true`                | `StaffProofFlow.tsx`                          | `QrCheckDto`                                          | Camera Scanner / Input        | Ghi nhận mã QR khớp; mở bước tiếp theo          | Unit test so khớp chuỗi mã; Camera scan test PASS          |
| **BR-02** | Staff          | Field Work Verification  | Chụp ảnh Trước/Sau    | `TaskEvidence`, `Task`   | Camera granted, GPS/Checklist đạt            | `CapturePhoto`   | Thêm bản ghi `TaskEvidence`              | `StaffProofFlow.tsx`                          | `TaskEvidenceDto`, `EvidenceStage`                    | Nút "Chụp ảnh" / PhotoPreview | Lưu URI ảnh cục bộ và metadata                  | File tồn tại trên filesystem; Preview render đúng          |
| **BR-03** | Staff          | Field Work Verification  | Nộp chuỗi bằng chứng  | `Task`, `ProofWorkflow`  | **Đủ 5/5 bằng chứng hợp lệ (DR-05)**         | `SubmitEvidence` | `IN_PROGRESS` $\to$ `WAITING_REVIEW`     | `StaffProofFlow.tsx`, `greenOpsService.ts`    | `SubmitTaskEvidenceRequest`                           | Nút "Gửi duyệt kết quả"       | Task chuyển sang chờ duyệt, xuất hiện ở Manager | Test kiểm tra cổng 5/5; API trả về task `WAITING_REVIEW`   |
| **BR-04** | Manager        | Review & Quality Control | Phê duyệt hoàn thành  | `Task`, `ReviewDecision` | **Bằng chứng đủ 5/5, không còn gap (DR-06)** | `ApproveTask`    | `WAITING_REVIEW` $\to$ `COMPLETED`       | `ManagerReview.tsx`, `greenOpsService.ts`     | `ReviewDecisionRequest` (`decision='approve'`)        | Nút "Phê duyệt"               | Task đóng vĩnh viễn; sinh CareHistory cho cây   | Test cổng duyệt khóa khi thiếu gap; CareHistory chiếu đúng |
| **BR-05** | Manager        | Review & Quality Control | Yêu cầu làm lại       | `Task`, `ReviewDecision` | **Bắt buộc có lý do cụ thể (DR-07)**         | `RequestRework`  | `WAITING_REVIEW` $\to$ `REWORK_REQUIRED` | `ManagerReview.tsx`, `greenOpsService.ts`     | `ReviewDecisionRequest` (`decision='request_rework'`) | Nút "Từ chối"                 | Task về hàng đợi Staff kèm cảnh báo và lý do    | Test chặn gửi khi lý do rỗng; Staff thấy lý do trên thẻ    |
| **BR-06** | Manager        | Work Management          | Tạo và giao việc      | `Task`, `Tree`           | Chọn cây, nhân viên, hạn chót tương lai      | `CreateTask`     | Khởi tạo $\to$ `PENDING`                 | `ManagerCreateTask.tsx`, `greenOpsService.ts` | `CreateTaskRequest`                                   | Nút "Tạo việc"                | Task mới xuất hiện trên hàng đợi của Staff      | Form validation test; Task DTO được tạo đầy đủ trường      |
| **BR-07** | Staff, Manager | Tree Asset Registry      | Tra cứu thông tin cây | `Tree`, `CareHistory`    | Camera granted, mã QR hợp lệ                 | `LookupTree`     | Truy vấn thông tin                       | `ManagerQrLookup.tsx`, `StaffTrees.tsx`       | `ListTreesQuery`, `CareHistoryDto`                    | Scanner / Ô tìm kiếm cây      | Hiển thị hồ sơ cây, vị trí và lịch sử chăm sóc  | Query test trả về đúng cây và danh sách lịch sử            |

---

## 3. Định nghĩa sẵn sàng cho tính năng (Definition of Ready - DoR)

Trước khi bất kỳ màn hình hoặc tính năng nào được phép đưa vào mã hóa (Implementation Phase), nhóm phát triển bắt buộc phải trả lời đầy đủ **26 câu hỏi thẩm định**:

1. **Work Object:** Tính năng thao tác trên đối tượng nghiệp vụ nào (`Task`, `Tree`, `Evidence`...)?
2. **Actor:** Tác nhân vận hành là ai (`Staff`, `Manager`)?
3. **Actor Scope:** Tác nhân chỉ được xem dữ liệu của mình hay toàn hệ thống?
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
21. **Offline State:** Tính năng có hoạt động được khi mất mạng không?
22. **Device Permission:** Cần quyền Camera hay GPS không? Cơ chế xử lý khi bị từ chối?
23. **Recovery Path:** Khi gặp lỗi, người dùng có thể thử lại bằng cách nào?
24. **Accessibility:** Độ tương phản và vùng chạm nút có đạt chuẩn không?
25. **NFR Scenario:** Đáp ứng kịch bản chất lượng nào (QAS-PERF, QAS-OFFLINE...)?
26. **Out of Scope:** Những khía cạnh nào cố tình loại trừ, không làm trong tính năng này?

---

## 4. Định nghĩa hoàn thành dựa trên bằng chứng (Definition of Done - DoD)

Một tính năng **KHÔNG ĐƯỢC COI LÀ HOÀN THÀNH** chỉ vì:

- Mã nguồn biên dịch thành công (`typecheck` pass).
- Màn hình mở lên được mà không báo lỗi đỏ.
- Ảnh chụp màn hình trông có vẻ đẹp mắt.
- API trả về mã `200 OK` trên môi trường giả lập.

Hệ thống yêu cầu **Chuỗi bằng chứng thực nghiệm nhiều tầng (Multi-Layer Evidence Chain)**:

```text
[TẦNG 1: DOMAIN RULE EVIDENCE]
  - Bằng chứng: Unit Test chứng minh Invariant (DR-01..DR-10) được bảo vệ.
  - Ví dụ: Test chứng minh distance > 10m thì không thể verify GPS.

[TẦNG 2: APPLICATION STATE TRANSITION EVIDENCE]
  - Bằng chứng: Test chứng minh Command tạo ra đúng State Transition và Domain Event.
  - Ví dụ: SubmitEvidence chuyển Task từ IN_PROGRESS sang WAITING_REVIEW.

[TẦNG 3: API CONTRACT COMPLIANCE EVIDENCE]
  - Bằng chứng: Dữ liệu gửi và nhận khớp 100% với Envelope và Schema trong @novyx/contracts.

[TẦNG 4: PERSISTENCE & FAULT TOLERANCE EVIDENCE]
  - Bằng chứng: Trạng thái và bản nháp form sống sót sau khi ứng dụng bị ngắt mạng hoặc kill app.

[TẦNG 5: MOBILE RUNTIME & HARDWARE EVIDENCE]
  - Bằng chứng: Kiểm thử trên máy thật hoặc Android Emulator chứng minh quyền Camera/GPS hoạt động mượt mà, không xung đột tài nguyên.

[TẦNG 6: NFR BENCHMARK EVIDENCE]
  - Bằng chứng: Danh sách lớn cuộn mượt không rớt khung hình (FlatList, không dùng ScrollView.map).
```
