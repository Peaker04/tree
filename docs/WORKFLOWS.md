# NOVYX GreenOps — Workflows, State Machines & Handoffs

Tài liệu này là chuẩn mực duy nhất định nghĩa **QUY TRÌNH VẬN HÀNH (Operational Workflows)**. Tài liệu giải quyết triệt để vấn đề kiến trúc: **Tách biệt rạch ròi 3 luồng trạng thái độc lập** thay vì gộp chung vào một máy trạng thái khổng lồ gây nhầm lẫn giữa điều hướng màn hình và nghiệp vụ thực tế.

---

## 1. Tách biệt ba luồng vận hành độc lập (The Three Workflows)

Trong NOVYX GreenOps, có 3 luồng trạng thái với chu kỳ sống, tác nhân và mục đích hoàn toàn khác nhau:

```text
+-----------------------------------------------------------------------------------+
| [WORKFLOW A: VÒNG ĐỜI CÔNG VIỆC CHUNG - TASK LIFECYCLE STATE MACHINE]             |
|   Pending ---> In_Progress ---> Waiting_Review ---> Completed [TERMINAL]         |
|                     ^                  |                                          |
|                     +-- Rework_Required <+                                         |
+-----------------------------------------------------------------------------------+
                                  |
                                  | Khi Task ở trạng thái [In_Progress]
                                  v
+-----------------------------------------------------------------------------------+
| [WORKFLOW B: QUY TRÌNH THU THẬP BẰNG CHỨNG HIỆN TRƯỜNG - PROOF ACQUISITION]        |
|   GPS Check ---> QR Match ---> Before Photo ---> Checklist ---> After Photo       |
|      (<=10m)      (100% Khớp)    (Ảnh trước)    (100% Done)     (Ảnh sau)         |
|                                                                     |             |
|                               Review Bằng chứng <-------------------+             |
|                                       |                                           |
|                               Nộp (Submit Evidence)                              |
+-----------------------------------------------------------------------------------+
                                        |
                                        | Chuyển Task sang [Waiting_Review]
                                        v
+-----------------------------------------------------------------------------------+
| [WORKFLOW C: QUY TRÌNH THẨM ĐỊNH & DUYỆT CỦA QUẢN LÝ - MANAGER REVIEW & REWORK]   |
|   Hàng đợi duyệt ---> Soát 5 chốt bằng chứng ---> Quyết định:                    |
|                         |                                                         |
|                         +---> [PHÊ DUYỆT] --------> Task sang [Completed]         |
|                         |                                                         |
|                         +---> [YÊU CẦU LÀM LẠI] --> Task sang [Rework_Required]   |
|                                 (Bắt buộc kèm lý do rõ ràng)                      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Workflow A: Vòng đời nhiệm vụ (Task Lifecycle)

Vòng đời này quản lý trạng thái tổng thể của thực thể `Task` từ khi Quản lý lập kế hoạch cho đến khi đóng việc vĩnh viễn.

### 2.1. Biểu đồ chuyển trạng thái (State Transition Diagram)

```text
              [Tạo việc / Giao việc]
                        |
                        v
                 +--------------+
                 |   PENDING    | (Chờ bắt đầu)
                 +--------------+
                        |
                        | [Nhân viên bắt đầu / Mở bước proof đầu tiên]
                        v
                 +--------------+
       +-------> | IN_PROGRESS  | (Đang làm / Đang thu thập bằng chứng)
       |         +--------------+
       |                |
       |                | [Đủ 5/5 bằng chứng -> Nộp báo cáo]
       |                v
       |         +----------------+
       |         | WAITING_REVIEW | (Chờ Quản lý duyệt)
       |         +----------------+
       |             |        |
[Staff |             |        | [Quản lý duyệt - Đủ 5/5 bằng chứng]
mở lại |             |        v
để sửa]|             |   +---------------+
       |             |   |   COMPLETED   | [TERMINAL - Đóng vĩnh viễn]
       |             |   +---------------+
       |             v
       |    +-----------------+
       +--- | REWORK_REQUIRED | (Yêu cầu làm lại - Kèm lý do bắt buộc)
            +-----------------+
```

### 2.2. Bảng chuyển trạng thái Task (Task Transition Matrix)

| Trạng thái hiện tại | Lệnh / Thao tác (Command)  | Tác nhân | Điều kiện tiên quyết (Guards)                                                    | Trạng thái tiếp theo | Hậu điều kiện & Bàn giao (Handoff)                                                                            |
| ------------------- | -------------------------- | -------- | -------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| _(Khởi tạo)_        | `CreateTask`               | Manager  | Điền đủ tiêu đề, loại việc, chọn cây hợp lệ, chọn nhân viên, hạn chót tương lai. | `PENDING`            | Ghi nhận task vào hệ thống; phát thông báo giao việc cho Staff.                                               |
| `PENDING`           | `StartTask` / `BeginProof` | Staff    | Nhân viên được giao mở chi tiết task hoặc bấm thực hiện.                         | `IN_PROGRESS`        | Khởi tạo phiên làm việc; hiển thị bước thu thập bằng chứng đầu tiên.                                          |
| `IN_PROGRESS`       | `SubmitTaskEvidence`       | Staff    | **Bắt buộc đủ 5/5 bằng chứng hợp lệ** (`isComplete === true`, không còn gaps).   | `WAITING_REVIEW`     | Đóng gói bằng chứng; đẩy task vào hàng đợi duyệt của Manager; phát thông báo cho Manager.                     |
| `WAITING_REVIEW`    | `ReviewApprove`            | Manager  | **Bằng chứng không còn lỗ hổng** (`reviewProofGaps.length === 0`).               | `COMPLETED`          | Khép kín task; tạo bản ghi `CareHistory` cho cây; gửi thông báo chúc mừng cho Staff.                          |
| `WAITING_REVIEW`    | `ReviewRequestRework`      | Manager  | **Bắt buộc có lý do từ chối** (`rejectReason.trim().length > 0`).                | `REWORK_REQUIRED`    | Lưu lý do vào `rejectReason`; đẩy task lên ưu tiên cao nhất trong hàng đợi của Staff; gửi cảnh báo cho Staff. |
| `REWORK_REQUIRED`   | `ResumeRework`             | Staff    | Nhân viên mở task làm lại từ danh sách việc.                                     | `IN_PROGRESS`        | Giữ nguyên bằng chứng hợp lệ cũ; điều hướng Staff trực tiếp vào khâu bị từ chối để bổ sung.                   |
| `COMPLETED`         | _(Mọi thao tác ghi)_       | Bất kỳ   | **BỊ CẤM (Forbidden)** — Trạng thái đóng vĩnh viễn (DR-09).                      | `COMPLETED`          | Không có chuyển dịch nào được phép.                                                                           |

---

## 3. Workflow B: Quy trình thu thập bằng chứng hiện trường (Proof Acquisition)

Quy trình này diễn ra nội bộ khi `Task` đang ở trạng thái `IN_PROGRESS`. Nhân viên hiện trường phải thực hiện tuần tự qua 5 chốt bằng chứng theo nguyên tắc không thể đảo ngược (Chronological Integrity).

```text
[BẮT ĐẦU TÁC NGHIỆP TẠI CÂY]
            |
            v
   (1) BƯỚC 1: XÁC THỰC GPS
       +-- Thao tác: Bấm "Lấy GPS hiện tại"
       +-- Chốt chặn: Khoảng cách tới cây <= 10m (DR-01)
       +-- Nếu > 10m: Khóa, yêu cầu di chuyển lại gần gốc cây
       +-- Khi đạt: Ghi nhận GpsCheck (lat, lng, accuracy, distance, timestamp)
            |
            v
   (2) BƯỚC 2: QUÉT MÃ QR CÂY
       +-- Thao tác: Mở Camera quét mã QR gắn trên thân cây
       +-- Chốt chặn: Chuỗi mã quét phải khớp 100% với qrCode của cây (DR-02)
       +-- Nếu sai mã: Báo đỏ "Sai cây", không ghi nhận
       +-- Khi khớp: Ghi nhận QrCheck (scannedCode, timestamp, verified=true)
            |
            v
   (3) BƯỚC 3: CHỤP ẢNH TRƯỚC (BEFORE PHOTO)
       +-- Thao tác: Chụp ảnh hiện trạng cây trước khi chăm sóc/cắt tỉa/xử lý
       +-- Chốt chặn: Bắt buộc có ảnh hợp lệ; có thể chụp lại nếu mờ
       +-- Khi đạt: Ghi nhận TaskEvidence (stage='before', uri, capturedAt)
            |
            v
   (4) BƯỚC 4: THỰC THI CHECKLIST KỸ THUẬT
       +-- Thao tác: Tiến hành thao tác vật lý ngoài đời; tích từng hạng mục checklist
       +-- Chốt chặn: Bắt buộc 100% hạng mục được đánh dấu hoàn thành (DR-04)
       +-- Khi đạt: Checklist hợp lệ; mở khóa bước chụp ảnh sau
            |
            v
   (5) BƯỚC 5: CHỤP ẢNH SAU (AFTER PHOTO)
       +-- Thao tác: Chụp ảnh kết quả nghiệm thu sau khi hoàn thành công việc
       +-- Chốt chặn: Bắt buộc có ảnh sau rõ nét
       +-- Khi đạt: Ghi nhận TaskEvidence (stage='after', uri, capturedAt)
            |
            v
   (6) BƯỚC 6: RÀ SOÁT TỔNG THỂ & NỘP BÁO CÁO (REVIEW & SUBMIT)
       +-- Hiển thị thẻ Proof Gate 5/5, so sánh ảnh Trước/Sau, GPS, QR
       +-- Cho phép ghi chú thêm (notes)
       +-- Bấm "Gửi duyệt kết quả" -> Kích hoạt SubmitTaskEvidence
```

### 3.1. Điểm hồi phục khi gặp sự cố tại hiện trường (Exception & Recovery Paths)

| Sự cố hiện trường                  | Biểu hiện trên ứng dụng                                                              | Cơ chế xử lý & Điểm hồi phục (Recovery Path)                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GPS ngoài bán kính (> 10m)**     | Vạch khoảng cách báo đỏ (ví dụ `14.2m`), nút "Tiếp tục" bị mờ.                       | Nhân viên tiến lại gần gốc cây và bấm "Đo lại GPS". Nếu do GPS tán cây che khuất, hướng dẫn giơ cao máy để bắt lại tín hiệu vệ tinh.                                                                     |
| **Quét sai mã QR cây**             | Báo lỗi: _"Mã quét không khớp với nhiệm vụ này (Quét được: TREE-05, Cần: TREE-02)"_. | Cung cấp nút "Quét lại" ngay trên màn hình để nhân viên kiểm tra lại biển số cây thực địa.                                                                                                               |
| **Mã QR bị rách/mất/hỏng**         | Camera không quét được hoặc mã bị mờ gãy.                                            | Cung cấp tùy chọn _"Báo cáo mã QR hỏng"_ $\to$ Gửi thông báo vận hành cho Quản lý; không cho phép tự ý bỏ qua bước quét mà không có xác nhận ngoại lệ.                                                   |
| **Mất kết nối mạng (Offline)**     | Không có sóng 3G/4G khi đang chụp ảnh hoặc làm checklist.                            | **Bảo toàn dữ liệu cục bộ (Local Proof Cache):** Ảnh và tiến trình được lưu vào bộ nhớ máy; nhân viên vẫn hoàn thành đủ 5 bước và nộp; hệ thống lưu vào hàng đợi gửi (Outbox) chờ có mạng sẽ tự đồng bộ. |
| **Ứng dụng bị tắt ngầm (OS Kill)** | Bộ nhớ RAM đầy khiến Android tắt ứng dụng khi đang mở camera.                        | Khi mở lại ứng dụng, session và tiến trình task được khôi phục từ snapshot lưu trữ bền vững (Durable Store); nhân viên không phải làm lại từ đầu.                                                        |

---

## 4. Workflow C: Quy trình thẩm định & Duyệt của Quản lý (Manager Review & Rework)

Quy trình thẩm định được thiết kế để Quản lý làm việc **Dựa trên bằng chứng khách quan (Evidence-First)**, loại bỏ hoàn toàn việc phê duyệt cảm tính.

### 4.1. Cổng thẩm định 5 chốt (The 5-Point Review Gate)

Tại màn hình chi tiết duyệt (`ManagerReviewDetail`), Quản lý được cung cấp bảng đối soát:

1. **Đối soát GPS:** Hiển thị khoảng cách sai lệch thực tế (ví dụ `3.2m`), thời điểm lấy tọa độ và độ chính xác (m).
2. **Đối soát QR:** Hiển thị chuỗi mã QR quét được và xác nhận khớp với cây.
3. **Đối soát Ảnh Cặp (Before/After Pair):** Hiển thị trực quan hai ảnh đặt cạnh nhau để đối chiếu kết quả trước và sau khi làm.
4. **Đối soát Checklist:** Hiển thị danh sách các mục kỹ thuật nhân viên đã tích hoàn thành.
5. **Ghi chú & Metadata:** Người thực hiện, hạn chót, thời gian nộp, ghi chú của nhân viên.

### 4.2. Hai nhánh rẽ quyết định (Decision Branches)

```text
                               +-----------------------------+
                               |     Manager Review Gate     |
                               +-----------------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
        [NHÁNH 1: PHÊ DUYỆT]                              [NHÁNH 2: TỪ CHỐI / LÀM LẠI]
  +-------------------------------------+           +-------------------------------------+
  | Điều kiện: reviewProofGaps === 0    |           | Điều kiện: Manager phát hiện sai sót|
  | (Đủ 5/5 bằng chứng hợp lệ)          |           | Bắt buộc: Phải chọn hoặc nhập lý do |
  |                                     |           |                                     |
  | Hành động: Bấm "Phê duyệt"          |           | Hành động: Bấm "Từ chối"            |
  |                                     |           |                                     |
  | Kết quả:                            |           | Kết quả:                            |
  | 1. Task chuyển sang COMPLETED       |           | 1. Task chuyển sang REWORK_REQUIRED |
  | 2. Ghi nhận vào Care History của cây|           | 2. Lưu lý do vào rejectReason       |
  | 3. Bắn thông báo xanh cho Staff     |           | 3. Bắn cảnh báo vàng/đỏ cho Staff   |
  | 4. Task đóng vĩnh viễn              |           | 4. Task nổi lên đầu hàng đợi Staff  |
  +-------------------------------------+           +-------------------------------------+
```

### 4.3. Cơ chế giao việc làm lại có chỉ dẫn (Actionable Rework Loopback)

Khi Quản lý từ chối nghiệm thu:

1. Quản lý có thể chọn nhanh từ danh mục lý do chuẩn:
   - _"Ảnh before/after chưa đủ rõ"_
   - _"GPS chưa khớp vị trí cây"_
   - _"Checklist thiếu hạng mục"_
   - _"Cần bổ sung vệ sinh hiện trường"_
     Hoặc tự gõ lý do chi tiết bằng văn bản tự do.
2. Hệ thống lưu `rejectReason` và `rejectChips` vào Task.
3. Khi Staff mở tab `Công việc`, nhiệm vụ bị trả lại được:
   - Dán nhãn đỏ nổi bật: `Cần làm lại`.
   - Đẩy lên vị trí ưu tiên số 0 (`priority = 0`) trên danh sách việc.
   - Hiển thị trực tiếp hộp cảnh báo màu vàng ghi rõ lý do Quản lý từ chối.
4. Nút bấm duy nhất trên thẻ task trở thành: **"Tiếp tục làm lại"** $\to$ Điều hướng Staff trực tiếp vào khâu bằng chứng còn thiếu sót để bổ sung mà không làm mất các bằng chứng hợp lệ khác.

---

## 5. Ma trận bàn giao trách nhiệm vận hành (Handoff Matrix)

| Giai đoạn bàn giao   | Bên bàn giao (From) | Bên tiếp nhận (To)       | Vật thể bàn giao (Work Object) | Trạng thái vật thể | Bằng chứng kèm theo (Artifacts)                                            |
| -------------------- | ------------------- | ------------------------ | ------------------------------ | ------------------ | -------------------------------------------------------------------------- |
| **Giao việc mới**    | Quản lý (Manager)   | Nhân viên (Staff)        | `Task`                         | `PENDING`          | Mã cây, địa chỉ, hạn chót, danh mục checklist mẫu.                         |
| **Bắt đầu làm việc** | Nhân viên (Staff)   | Hiện trường / Bản thân   | `Task`                         | `IN_PROGRESS`      | Tọa độ GPS ban đầu.                                                        |
| **Nộp nghiệm thu**   | Nhân viên (Staff)   | Quản lý (Manager)        | `Task`                         | `WAITING_REVIEW`   | GpsCheck, QrCheck, Before Photo, Checklist hoàn tất, After Photo, Ghi chú. |
| **Trả việc làm lại** | Quản lý (Manager)   | Nhân viên (Staff)        | `Task`                         | `REWORK_REQUIRED`  | Toàn bộ bằng chứng cũ + Lý do từ chối cụ thể (`rejectReason`).             |
| **Nghiệm thu đóng**  | Quản lý (Manager)   | Hệ thống / Hồ sơ tài sản | `Task` $\to$ `CareHistory`     | `COMPLETED`        | Báo cáo hoàn chỉnh có xác nhận của Quản lý; sinh bản ghi lịch sử cây.      |
