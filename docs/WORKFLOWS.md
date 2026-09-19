# NOVYX GreenOps — Canonical Workflows, State Machines & Handoffs

Tài liệu này là chuẩn mực thẩm quyền cao nhất định nghĩa **QUY TRÌNH VẬN HÀNH (Operational Workflows)**, **MÁY TRẠNG THÁI VÒNG ĐỜI (Lifecycle State Machines)**, **CÁC ĐIỀU KIỆN TIÊN QUYẾT (Guards)** và **MA TRẬN BÀN GIAO (Handoffs)**.

---

## 1. Phân tách rạch ròi các chiều trạng thái (Separate State Dimensions)

Hệ thống phân biệt rành mạch 5 chiều trạng thái độc lập nhằm tránh nhầm lẫn giữa vòng đời nghiệp vụ, tiến trình bằng chứng, xử lý ngoại lệ và kết nối mạng:

```text
+-----------------------------------------------------------------------------------+
|                        FIVE SEPARATE STATE DIMENSIONS                             |
+-----------------------------------------------------------------------------------+
| 1. TaskStatus        | Vòng đời nghiệp vụ chuẩn tắc (7 trạng thái tất định)       |
| 2. ProofProgress     | Tiến độ thu thập bằng chứng theo ProofProfile nhiệm vụ    |
| 3. VerificationState | Kết quả xác thực hiện trường (Bình thường vs Ngoại lệ)    |
| 4. SyncStatus        | Trạng thái đồng bộ máy khách (SYNCED / PENDING / FAILED)   |
| 5. NavigationState   | Điều hướng giao diện người dùng (Màn hình hiện thời)       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Phần A: Vòng đời nhiệm vụ chuẩn tắc (Task Lifecycle)

Vòng đời của thực thể `Task` trong phiên bản MVP gồm chính xác **7 trạng thái tất định**. Tuyệt đối không đưa thêm bất kỳ trạng thái trung gian nào khác.

### 2.1. Sơ đồ chuyển dịch trạng thái tổng thể (State Machine Diagram)

```text
                     [Manager Tạo việc & Giao việc]
                                   |
                                   v
             +-------------------------------------------+
             |                  PENDING                  | <---------------------+
             +-------------------------------------------+                       |
               |                     |                 |                         |
    [Manager   |          [Staff bấm |        [Manager |                         |
     Hủy việc] |          StartTask] |       Reassign] |                         |
               |                     v                 |                         |
               |      +-----------------------------+  |                         |
               |      |         IN_PROGRESS         |  |                         |
               |      +-----------------------------+  |                         |
               |        |                         |    |                         |
               |        | [Staff bấm              |    |                         |
               |        |  ReportFieldIssue]      |    |                         |
               |        v                         |    |                         |
               |   +---------+                    |    |                         |
               |   | BLOCKED |                    |    |                         |
               |   +---------+                    |    |                         |
               |     |  |  |                      |    |                         |
               |     |  |  +-- [Manager Reassign] -+    |                         |
               |     |  |                               |                         |
               |     |  +----- [Manager Resume] --------+                         |
               |     |                                                            |
               |     |                                [Staff Nộp đủ               |
               |     |                                 bằng chứng theo Profile]   |
               |     |                                                            |
               |     +----------------------------+     |                         |
               |                                  |     v                         |
               |                           +----------------+                     |
               |                           | WAITING_REVIEW |                     |
               |                           +----------------+                     |
               |                                |   |   |                         |
               |          [Quản lý yêu cầu      |   |   | [Quản lý Phê duyệt      |
               |           làm lại có mục tiêu] |   |   |  hoặc Duyệt ngoại lệ]   |
               |                                v   |   v                         |
               |      +-----------------+           |  +---------------+          |
               |      | REWORK_REQUIRED |           |  |   COMPLETED   | [TERMINAL|
               |      +-----------------+           |  +---------------+  SUCCESS]|
               |        |       |                   |                             |
               |        |       | [Staff nộp lại    |                             |
               |        |       |  khâu bổ sung]    |                             |
               |        |       +-------------------+                             |
               |        |                                                         |
               v        v                                                         |
        +-------------------+                                                     |
        |     CANCELLED     | <---------------------------------------------------+
        +-------------------+ [TERMINAL VOID - Hủy việc từ mọi trạng thái chưa đóng]
```

### 2.2. Bảng chuyển trạng thái chuẩn tắc (Canonical Transition Matrix)

| Trạng thái hiện tại | Lệnh / Thao tác (Command)    | Tác nhân | Điều kiện tiên quyết (Guards)                                                                                    | Trạng thái kế tiếp | Hậu điều kiện & Bàn giao (Handoff)                                                                                    |
| :------------------ | :--------------------------- | :------- | :--------------------------------------------------------------------------------------------------------------- | :----------------- | :-------------------------------------------------------------------------------------------------------------------- |
| _(Khởi tạo)_        | `CreateTask`                 | Manager  | Chọn đúng cây, chọn nhân viên hợp lệ, hạn chót tương lai, loại việc `TaskType`. Hệ thống tự gán `ProofProfile`.  | `PENDING`          | Task xuất hiện trong hàng đợi của Staff; phát thông báo việc mới.                                                     |
| `PENDING`           | `StartTask`                  | Staff    | **DUY NHẤT hành động Staff bấm "Bắt đầu làm việc"**. Mở task, quét QR hay đo GPS không đổi trạng thái.           | `IN_PROGRESS`      | Mở giao diện thu thập bằng chứng hiện trường.                                                                         |
| `PENDING`           | `ReassignTask`               | Manager  | Chọn nhân viên mới khác với nhân viên hiện tại.                                                                  | `PENDING`          | Cập nhật `assignedStaffId`; chuyển task sang hàng đợi của nhân viên mới.                                              |
| `PENDING`           | `CancelTask`                 | Manager  | **Bắt buộc nhập lý do hủy** (`cancelReason.trim().length > 0`).                                                  | `CANCELLED`        | Ghi nhận thời điểm và người hủy; đóng vĩnh viễn (Terminal Void); không sinh Care History.                             |
| `IN_PROGRESS`       | `ReportFieldIssue`           | Staff    | Phát sinh trở ngại hiện trường không thể thi công (ong độc, rào chắn, bão ngập...). Bắt buộc ảnh chụp + lý do.   | `BLOCKED`          | Chuyển task vào danh sách sự cố của Manager kèm cảnh báo vàng/đỏ.                                                     |
| `IN_PROGRESS`       | `SubmitTaskEvidence`         | Staff    | **Bằng chứng đạt 100% hợp đồng quy định của ProofProfile** (hoặc có cờ ngoại lệ hợp lệ). Đã đồng bộ lên máy chủ. | `WAITING_REVIEW`   | Đẩy task vào hàng đợi thẩm định của Manager. (Nếu nộp offline: giữ `IN_PROGRESS` ở server, `PENDING_SYNC` tại local). |
| `IN_PROGRESS`       | `CancelTask`                 | Manager  | Bắt buộc nhập lý do hủy.                                                                                         | `CANCELLED`        | Bảo toàn các bằng chứng nháp đã thu thập; đóng task vĩnh viễn.                                                        |
| `BLOCKED`           | `ResolveBlockedResume`       | Manager  | Sự cố hiện trường đã được giải tỏa; cho phép nhân viên hiện tại tiếp tục.                                        | `IN_PROGRESS`      | Staff nhận thông báo có thể tiếp tục công việc tại hiện trường.                                                       |
| `BLOCKED`           | `ResolveBlockedReassign`     | Manager  | Nhân viên hiện tại không thể tiếp tục (tai nạn, đổi ca); giao cho nhân viên khác.                                | `PENDING`          | Chuyển task về `PENDING` gán cho Staff mới; **bảo toàn nguyên vẹn quyền tác giả của bằng chứng cũ**.                  |
| `BLOCKED`           | `ResolveBlockedCancel`       | Manager  | Sự cố bất khả kháng không thể khắc phục (cây đã bị gãy đổ, công trình giải tỏa).                                 | `CANCELLED`        | Đóng task vĩnh viễn; lưu vết sự cố và lý do hủy.                                                                      |
| `WAITING_REVIEW`    | `ReviewApprove`              | Manager  | Hồ sơ đạt 100% tiêu chuẩn chất lượng và xác thực hiện trường.                                                    | `COMPLETED`        | **Khép kín thành công (Terminal Success)**; chiếu bản ghi chính thức vào `CareHistory` của cây.                       |
| `WAITING_REVIEW`    | `ReviewApproveWithException` | Manager  | Công việc thực tế đã làm, có lỗi định vị/danh tính/bằng chứng không thể tái tạo; Quản lý chấp thuận kèm lý do.   | `COMPLETED`        | Khép kín thành công; chiếu bản ghi vào `CareHistory` mang cờ `HAS_EXCEPTION`.                                         |
| `WAITING_REVIEW`    | `ReviewRequestRework`        | Manager  | Phát hiện sai sót kỹ thuật; **bắt buộc chọn mục sai sót cụ thể (`targetedArea`) và nhập lý do**.                 | `REWORK_REQUIRED`  | Lưu lý do; đẩy task lên ưu tiên hàng đầu của Staff; bảo lưu toàn bộ bằng chứng hợp lệ cũ.                             |
| `WAITING_REVIEW`    | `CancelTask`                 | Manager  | Hủy việc trong lúc thẩm định (phát hiện vi phạm nghiêm trọng hoặc hủy kế hoạch).                                 | `CANCELLED`        | Đóng task; bảo toàn toàn bộ bằng chứng đã nộp phục vụ kiểm toán; không sinh Care History.                             |
| `REWORK_REQUIRED`   | `ResubmitTargetedEvidence`   | Staff    | **Chỉ cần bổ sung/chụp lại đúng khâu bị từ chối**; ghép với bằng chứng cũ thành phiên bản mới (`Attempt 2`).     | `WAITING_REVIEW`   | Đẩy lại về hàng đợi thẩm định của Quản lý.                                                                            |
| `REWORK_REQUIRED`   | `CancelTask`                 | Manager  | Hủy việc khi không thể khắc phục sửa chữa.                                                                       | `CANCELLED`        | Đóng task; bảo toàn lịch sử nộp và thẩm định.                                                                         |
| `COMPLETED`         | _(Mọi thao tác sửa)_         | Bất kỳ   | **BỊ CẤM TUYỆT ĐỐI (DR-HARD-05)** — Trạng thái đóng vĩnh viễn.                                                   | `COMPLETED`        | Toàn bộ dữ liệu bất biến.                                                                                             |
| `CANCELLED`         | _(Mọi thao tác sửa)_         | Bất kỳ   | **BỊ CẤM TUYỆT ĐỐI (DR-HARD-05)** — Trạng thái đóng vĩnh viễn.                                                   | `CANCELLED`        | Toàn bộ dữ liệu bất biến.                                                                                             |

---

## 3. Phần B: Xác thực hiện trường (Site Verification)

Xác thực hiện trường bao gồm **hai tín hiệu độc lập**:

1. **Định danh thực thể (Tree Identity):** Quét mã QR gắn cố định trên thân cây mục tiêu.
2. **Vị trí thực địa (Location):** GPS đo khoảng cách giữa thiết bị và tọa độ gốc cây.

### 3.1. Quy tắc vận hành Site Verification

- **Thứ tự độc lập:** Nhân viên có thể quét QR trước rồi lấy GPS, hoặc lấy GPS trước rồi quét QR tùy điều kiện thực địa.
- **Không đổi TaskStatus:** Việc hoàn thành QR và GPS chỉ làm thay đổi trạng thái xác thực nội bộ (`siteVerification`), tuyệt đối không làm đổi trạng thái nhiệm vụ.
- **Tiêu chuẩn GPS:** Khoảng cách mục tiêu là $\le 10$ mét (`distance <= 10`). Không tồn tại ngưỡng phụ 25m.
- **Xử lý ngoại lệ vị trí (`LOCATION_EXCEPTION`):**
  - Nếu GPS trôi do tán lá rậm hoặc nhà cao tầng ($> 10$m), nhân viên bấm thử lại (Retry).
  - Nếu vẫn không đạt, hệ thống cho phép kích hoạt `LOCATION_EXCEPTION`.
  - Bắt buộc ghi nhận: Tọa độ đo được, khoảng cách thực tế, độ chính xác thiết bị, thời điểm đo, và lý do giải trình của nhân viên.
  - Ngoại lệ này **không được biểu diễn như xác thực thành công thông thường** mà mang cờ cảnh báo để Quản lý thẩm định.
- **Xử lý ngoại lệ danh tính (`IDENTITY_EXCEPTION`):**
  - Cây mục tiêu của Task là **bất biến trong suốt quá trình thực thi**.
  - Nếu mã QR bị rách/mờ/mất tem, nhân viên chọn `Báo cáo tem QR hỏng`.
  - Bắt buộc chụp ảnh hiện trạng tem tại gốc cây, nhập lý do và có thể nhập mã số dập nổi thủ công (nếu còn đọc được).
  - Mã nhập tay chỉ được đối chiếu với duy nhất cây được giao. **Tuyệt đối cấm nhân viên tự ý chuyển việc sang cây khác**.

---

## 4. Phần C: Quy trình 3 Hồ sơ Bằng chứng Ngữ nghĩa (Proof Profiles)

Khác với mô hình 5 chốt cứng nhắc trước đây, hệ thống áp dụng hợp đồng bằng chứng thích ứng theo đúng bản chất can thiệp kỹ thuật:

```text
+-----------------------------------------------------------------------------------+
|                        THE THREE SEMANTIC PROOF PROFILES                          |
+-----------------------------------------------------------------------------------+
| 1. CHANGE_PROOF     | Công việc tạo biến đổi vật lý trực quan rõ rệt              |
|                     | Hợp đồng: Site Verification + Ảnh Trước + Checklist + Ảnh Sau|
+-----------------------------------------------------------------------------------+
| 2. SERVICE_PROOF    | Bảo dưỡng định kỳ không tạo khác biệt trước/sau rõ rệt      |
|                     | Hợp đồng: Site Verification + Checklist + Ảnh Hoàn thành    |
+-----------------------------------------------------------------------------------+
| 3. INSPECTION_PROOF | Khảo sát, quan sát, đánh giá tình trạng chuyên môn           |
|                     | Hợp đồng: Site Verification + Khảo sát cấu trúc + Ảnh Hiện trạng|
+-----------------------------------------------------------------------------------+
```

### 4.1. Ma trận hợp đồng bằng chứng bắt buộc (Evidence Contract Matrix)

| Hồ sơ bằng chứng (ProofProfile) | Phạm vi công việc điển hình                                                       | Site Verification (QR + GPS)           | Bằng chứng trước (Before Photo)                       | Thao tác kỹ thuật                          | Bằng chứng sau (After / Completion Photo)                  | Bằng chứng kiểm tra chuyên sâu                                                       |
| :------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------- | :---------------------------------------------------- | :----------------------------------------- | :--------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **`CHANGE_PROOF`**              | Cắt tỉa cành, đốn hạ cành mục, trồng mới cây, can thiệp khẩn cấp sau bão.         | **Bắt buộc** (Hoặc cờ ngoại lệ hợp lệ) | **Bắt buộc 01 ảnh** chụp toàn cảnh trước khi thao tác | **Bắt buộc 100%** checklist hoàn thành     | **Bắt buộc 01 ảnh** chụp nghiệm thu góc tương tự ảnh Trước | Không áp dụng                                                                        |
| **`SERVICE_PROOF`**             | Tưới nước, bón phân, xử lý thuốc bảo vệ thực vật định kỳ, làm cỏ bồn cây.         | **Bắt buộc** (Hoặc cờ ngoại lệ hợp lệ) | _Không bắt buộc_ (Tránh chụp ảnh hình thức)           | **Bắt buộc 100%** checklist hoàn thành     | **Bắt buộc 01 ảnh** chụp hoàn thành công tác               | Không áp dụng                                                                        |
| **`INSPECTION_PROOF`**          | Kiểm tra sức khỏe cây, phát hiện sâu bệnh, đánh giá rủi ro cây nghiêng/nguy hiểm. | **Bắt buộc** (Hoặc cờ ngoại lệ hợp lệ) | _Không bắt buộc_                                      | Không dùng checklist thao tác thông thường | _Không bắt buộc_                                           | **Bắt buộc Structured Findings** (Đánh giá theo mẫu) + **Ảnh hiện trạng** (1..* ảnh) |

---

## 5. Phần D & E: Quy trình nộp hồ sơ & Ngữ nghĩa Ngoại tuyến (Offline Submission Semantics)

### 5.1. Quy trình nộp hồ sơ (Submission Workflow)

1. Khi nhân viên thu thập đủ hợp đồng bằng chứng theo đúng `ProofProfile` của nhiệm vụ, nút **"Gửi duyệt kết quả"** được kích hoạt.
2. Hệ thống đóng gói toàn bộ: Dữ liệu Site Verification (kèm tọa độ, độ chính xác, cờ ngoại lệ nếu có), ảnh bằng chứng (kèm URI, timestamp, metadata), danh mục checklist hoặc bảng phát hiện, và ghi chú hiện trường.

### 5.2. Ngữ nghĩa ngoại tuyến chuẩn tắc (Offline Semantics)

Trạng thái nghiệp vụ của nhiệm vụ (`TaskStatus`) và Trạng thái đồng bộ của máy khách (`LocalSubmissionStatus`) là **hai khái niệm hoàn toàn độc lập**:

```text
[Nhân viên bấm Nộp khi MẤT MẠNG]
  |
  +---> TẠI MÁY KHÁCH (LOCAL CLIENT):
  |     - Ghi nhận trạng thái: LocalSubmissionStatus = PENDING_SYNC
  |     - Lưu bền vững toàn bộ dữ liệu form và file ảnh vào Durable Local Store / Outbox
  |     - Giao diện hiển thị nhãn: "Đang chờ đồng bộ khi có mạng"
  |
  +---> TRÊN HỆ THỐNG MÁY CHỦ CHUẨN TẮC (AUTHORITATIVE SERVER):
        - Trạng thái nhiệm vụ VẪN LÀ: TaskStatus = IN_PROGRESS
        - Tuyệt đối KHÔNG có trạng thái "OFFLINE_SUBMITTED" trong TaskStatus!

[Khi thiết bị CÓ KẾT NỐI MẠNG TRỞ LẠI]
  |
  +---> ĐỒNG BỘ THÀNH CÔNG (Success):
  |     - Máy chủ tiếp nhận trọn vẹn chuỗi bằng chứng
  |     - Máy chủ chuyển trạng thái: TaskStatus = WAITING_REVIEW
  |     - Máy khách cập nhật: LocalSubmissionStatus = SYNCED
  |
  +---> ĐỒNG BỘ THẤT BẠI (Failure - Lỗi mạng ngắt quãng / Lỗi server):
        - Máy chủ giữ nguyên: TaskStatus = IN_PROGRESS
        - Máy khách ghi nhận: LocalSubmissionStatus = SYNC_FAILED
        - Cung cấp nút "Thử gửi lại" (Manual Retry) cho nhân viên.
```

---

## 6. Phần F: Cổng thẩm định của Quản lý (Manager Review Hub)

Tại trạng thái `WAITING_REVIEW`, Quản lý vận hành tiến hành thẩm định toàn bộ hồ sơ. Trong phiên bản MVP, Quản lý thẩm định 100% nhiệm vụ được nộp.

### 6.1. Bốn kết luận duyệt dứt điểm

Quản lý có chính xác **4 quyết định nghiệp vụ dứt điểm**:

```text
                               +-----------------------------+
                               |     Manager Review Gate     |
                               |    (Task: WAITING_REVIEW)   |
                               +-----------------------------+
                                              |
     +-------------------+--------------------+-------------------+-------------------+
     |                   |                                        |                   |
     v                   v                                        v                   v
[1. APPROVE]    [2. APPROVE_WITH_EXCEPTION]              [3. REQUEST_REWORK]     [4. CANCEL]
     |                   |                                        |                   |
     |                   | Bắt buộc có lý do giải trình;          | Bắt buộc chỉ rõ   | Bắt buộc có lý do;
     |                   | chỉ áp dụng khi việc đã làm thật,      | mục sai sót &     | hủy việc từ mọi
     |                   | lỗi ngoại lệ không thể tạo lại.        | lý do cụ thể.     | trạng thái chưa đóng.
     v                   v                                        v                   v
+-----------------------------+                          +-----------------+    +-----------+
|          COMPLETED          |                          | REWORK_REQUIRED |    | CANCELLED |
|     (TERMINAL SUCCESS)      |                          +-----------------+    +-----------+
+-----------------------------+                                   |                   |
     |                   |                                        | Sửa đúng mục      | Không sinh
     | Sinh CareHistory  | Sinh CareHistory                       | bị từ chối        | CareHistory
     | chuẩn             | mang cờ HAS_EXCEPTION                  v                   |
     v                   v                               +-----------------+          v
[Official Care History Record]                           | WAITING_REVIEW  |   [Audit Trail]
                                                         +-----------------+
```

1. **`APPROVE` $\to$ `COMPLETED`:** Nghiệm thu đạt chuẩn 100%. Nhiệm vụ đóng vĩnh viễn và sinh bản ghi Lịch sử chăm sóc chính thức (`CareHistory`).
2. **`APPROVE_WITH_EXCEPTION` $\to$ `COMPLETED`:** Áp dụng khi công việc thực tế đã được thi công đạt chất lượng, nhưng có khiếm khuyết về định vị (GPS trôi), tem QR hỏng hoặc thiếu sót bằng chứng lịch sử không thể tái tạo; Quản lý chấp nhận nghiệm thu kèm lý do chịu trách nhiệm. Bản ghi `CareHistory` được sinh ra mang cờ `HAS_EXCEPTION` kèm tham chiếu lý do.
   > **Lưu ý:** Tuyệt đối không tạo trạng thái `COMPLETED_WITH_EXCEPTION` trong `TaskStatus`. Trạng thái vẫn là `COMPLETED`.
3. **`REQUEST_REWORK` $\to$ `REWORK_REQUIRED`:** Phát hiện sai sót kỹ thuật hoặc bằng chứng chưa rõ ràng. Bắt buộc chọn mục sai sót (`targetedArea`) và nhập lý do. Task chuyển sang `REWORK_REQUIRED`.
4. **`CANCEL` $\to$ `CANCELLED`:** Quản lý hủy bỏ nhiệm vụ kèm lý do bắt buộc. Nhiệm vụ đóng vĩnh viễn và không bao giờ sinh Care History.

---

## 7. Phần G: Vòng lặp làm lại có mục tiêu (Targeted Rework Loop)

Nguyên tắc cốt tử: **Làm lại có trọng tâm, không bắt làm lại từ đầu (No Full Reset)**.

1. **Chỉ định khâu cần sửa:** Quản lý chỉ định chính xác khâu có sai sót:
   - `AFTER_PHOTO`: Chụp lại ảnh nghiệm thu sau khi làm.
   - `COMPLETION_PHOTO`: Chụp lại ảnh hoàn thành dịch vụ.
   - `CHECKLIST`: Bổ sung mục thao tác kỹ thuật còn thiếu.
   - `INSPECTION_FINDING`: Bổ sung hoặc làm rõ thông số khảo sát.
   - `VERIFICATION`: Quét lại mã QR hoặc đo lại GPS (nếu thuộc trường hợp có thể khắc phục hợp lệ).
2. **Bảo tồn bằng chứng hợp lệ:** Toàn bộ bằng chứng của các khâu không bị từ chối được giữ nguyên vẹn.
3. **Lưu vết đa phiên bản (Versioned Evidence):**
   - Lần nộp 1 (`Attempt 1`): Bằng chứng ban đầu $\to$ Quản lý từ chối kèm lý do.
   - Lần nộp 2 (`Attempt 2`): Bằng chứng bổ sung/sửa đổi $\to$ Quản lý thẩm định lại.
   - Không bao giờ ghi đè hoặc xóa mất lịch sử nộp ban đầu.
4. **Bảo vệ tính toàn vẹn bằng chứng (`EVIDENCE_INTEGRITY_EXCEPTION`):**
   - Nếu bằng chứng lịch sử đã bị bỏ sót nhưng hiện trường thực tế đã thay đổi (ví dụ: quên chụp ảnh Trước, nhưng cành cây đã cắt tỉa xong), nhân viên **tuyệt đối không được chụp ảnh giả ngụy tạo ảnh Trước**.
   - Nhân viên phải báo cáo `EVIDENCE_INTEGRITY_EXCEPTION` để Quản lý xem xét chấp thuận ngoại lệ (`APPROVE_WITH_EXCEPTION`) hoặc xử lý theo quy chế.

---

## 8. Phần H: Xử lý sự cố hiện trường (Field Issue & BLOCKED)

`BLOCKED` là trạng thái **TẠM DỪNG PHI KẾT THÚC (Non-terminal)**.

### 8.1. Lối vào duy nhất

`IN_PROGRESS` $\to$ Nhân viên bấm `ReportFieldIssue` $\to$ `BLOCKED`.

Nhân viên gặp chướng ngại vật ngoài ý muốn không thể tiếp tục công việc (rào chắn công trình, đàn ong độc trên cây, đường ngập lụt, cành cây gãy nguy hiểm đe dọa an toàn...). Nhân viên chụp ảnh hiện trường và nhập mô tả sự cố.

### 8.2. Ba lối thoát tất định

Chỉ có Quản lý vận hành mới có thẩm quyền giải quyết trạng thái `BLOCKED` qua đúng 3 lối thoát:

```text
                     +---------------------------------------+
                     |           Task: BLOCKED               |
                     +---------------------------------------+
                                         |
     +-----------------------------------+-----------------------------------+
     |                                   |                                   |
     v                                   v                                   v
[LỐI THOÁT 1: RESUME]          [LỐI THOÁT 2: REASSIGN]             [LỐI THOÁT 3: CANCEL]
Tháo gỡ sự cố thực địa         Đổi nhân viên thực hiện             Hủy nhiệm vụ
(ví dụ: đã dọn rào chắn)       (ví dụ: nhân viên bị ốm/tai nạn)    (sự cố bất khả kháng)
     |                                   |                                   |
     v                                   v                                   v
+--------------------+         +--------------------+              +--------------------+
|    IN_PROGRESS     |         |      PENDING       |              |     CANCELLED      |
+--------------------+         +--------------------+              +--------------------+
Nhân viên cũ tiếp tục          Giao cho nhân viên mới;             Đóng vĩnh viễn;
công việc hiện trường          bảo toàn tác giả bằng chứng cũ      không sinh CareHistory
```

---

## 9. Phần I: Phân công lại nhiệm vụ (Reassignment Governance)

Quy tắc phân công lại nhân viên thực hiện nhiệm vụ:

| Trạng thái hiện tại       | Được phép Reassign? | Đường thực hiện (Required Path)                                                                                                                | Quy tắc bảo toàn dữ liệu bằng chứng                                                                                                                     |
| :------------------------ | :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PENDING`                 | **ĐƯỢC PHÉP**       | Quản lý đổi trực tiếp `assignedStaffId`.                                                                                                       | Task chưa thi công, không có bằng chứng nào phát sinh.                                                                                                  |
| `IN_PROGRESS`             | **CẤM TRỰC TIẾP**   | **Bắt buộc qua:** `IN_PROGRESS` $\to$ `ReportFieldIssue` $\to$ `BLOCKED` $\to$ `Reassign` $\to$ `PENDING`.                                     | Không cho phép âm thầm cướp việc hay đổi người khi nhân viên đang thi công dở dang.                                                                     |
| `BLOCKED`                 | **ĐƯỢC PHÉP**       | Quản lý bấm Reassign từ màn hình xử lý sự cố $\to$ Task về `PENDING`.                                                                          | **Toàn bộ bằng chứng do nhân viên trước thu thập vẫn giữ nguyên tác giả ban đầu (`capturedByUserId`)**. Nhân viên mới được phân công sẽ tiếp quản task. |
| `WAITING_REVIEW`          | **BỊ CẤM**          | Hồ sơ đang trong tay Quản lý thẩm định; không có cơ chế đổi người lúc này.                                                                     | Không áp dụng.                                                                                                                                          |
| `REWORK_REQUIRED`         | **CẤM TRỰC TIẾP**   | Việc làm lại gắn liền với nhân viên đã thi công khâu đó. Nếu nhân viên nghỉ việc, Quản lý phải hủy task hoặc có cơ chế can thiệp có kiểm toán. | Bảo toàn trách nhiệm giải trình.                                                                                                                        |
| `COMPLETED` / `CANCELLED` | **BỊ CẤM**          | Trạng thái đóng vĩnh viễn.                                                                                                                     | Không áp dụng.                                                                                                                                          |

---

## 10. Phần J: Hủy nhiệm vụ (Cancellation Rules)

- **Thẩm quyền:** Duy nhất **Quản lý vận hành (Manager)** mới có quyền Hủy nhiệm vụ.
- **Phạm vi cho phép:** Cho phép hủy từ **bất kỳ trạng thái nào chưa đóng**:
  - `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`.
- **Phạm vi bị cấm:** Tuyệt đối không thể hủy từ `COMPLETED` hoặc `CANCELLED`.
- **Điều kiện bắt buộc:**
  - Lý do hủy rõ ràng (`cancelReason`).
  - Danh tính người hủy (`cancelledByUserId`).
  - Dấu thời gian hủy (`cancelledAt`).
- **Bảo toàn dữ liệu:**
  - Không bao giờ xóa cứng (No Hard Delete) khỏi cơ sở dữ liệu.
  - Toàn bộ lịch sử nhiệm vụ, bằng chứng đã chụp và các lần nộp đều được lưu trữ phục vụ hậu kiểm.
  - **Nhiệm vụ bị hủy TUYỆT ĐỐI KHÔNG BAO GIỜ sinh bản ghi Lịch sử chăm sóc (`CareHistory`)**.

---

## 11. Phần K: Chiếu Lịch sử chăm sóc (Care History Projection)

`CareHistory` là hồ sơ kỹ thuật chính thức và có giá trị kiểm toán vận hành cao nhất đối với tài sản cây xanh (LEGAL STATUS: NOT ESTABLISHED / OUTSIDE CURRENT MVP CLAIMS):

- **Điều kiện sinh ra:** **CHỈ KHI TASK CHUYỂN SANG TRẠNG THÁI `COMPLETED`**.
- **Cờ ngoại lệ:** Nếu nghiệm thu thông qua `APPROVE_WITH_EXCEPTION`, bản ghi `CareHistory` phải giữ cờ `HAS_EXCEPTION` kèm tham chiếu mã ngoại lệ và lý do chấp thuận của Quản lý.
- **Các trạng thái không bao giờ vào Care History:** `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `CANCELLED`.

---

## 12. Ma trận bàn giao vận hành chuẩn tắc (Canonical Handoff Matrix)

| Giai đoạn bàn giao      | Bên bàn giao (From) | Bên tiếp nhận (To)        | Vật thể bàn giao (Work Object) | Trạng thái vật thể | Bằng chứng & Dữ liệu kèm theo                                                      |
| :---------------------- | :------------------ | :------------------------ | :----------------------------- | :----------------- | :--------------------------------------------------------------------------------- |
| **Giao việc mới**       | Quản lý (Manager)   | Nhân viên (Staff)         | `Task`                         | `PENDING`          | Cây mục tiêu, loại việc (`TaskType`), hạn chót, checklist/findings mẫu.            |
| **Bắt đầu làm việc**    | Nhân viên (Staff)   | Hiện trường / Bản thân    | `Task`                         | `IN_PROGRESS`      | Khởi tạo phiên làm việc thực địa qua lệnh `StartTask`.                             |
| **Báo cáo sự cố**       | Nhân viên (Staff)   | Quản lý (Manager)         | `FieldIssue`                   | `BLOCKED`          | Ảnh hiện trạng sự cố, mô tả lý do cản trở thực tế.                                 |
| **Nộp nghiệm thu**      | Nhân viên (Staff)   | Quản lý (Manager)         | `Task`                         | `WAITING_REVIEW`   | Chuỗi bằng chứng theo ProofProfile, dữ liệu Site Verification (QR/GPS/Ngoại lệ).   |
| **Yêu cầu làm lại**     | Quản lý (Manager)   | Nhân viên (Staff)         | `ReworkRequest`                | `REWORK_REQUIRED`  | Chỉ rõ khâu sai sót (`targetedArea`), lý do từ chối cụ thể; bảo lưu bằng chứng cũ. |
| **Nghiệm thu hoàn tất** | Quản lý (Manager)   | Hồ sơ Cây xanh (`Tree`)   | `Task` $\to$ `CareHistory`     | `COMPLETED`        | Báo cáo hoàn chỉnh có phê duyệt của Quản lý; sinh bản ghi Care History chính thức. |
| **Hủy việc**            | Quản lý (Manager)   | Nhật ký Kiểm toán (Audit) | `Task`                         | `CANCELLED`        | Lý do hủy, người hủy, thời điểm hủy; đóng việc không sinh Care History.            |
