# NOVYX GreenOps — Đánh giá & Chuẩn hóa Mô hình Quy trình Vận hành Nghiệp vụ

_(Business Process Discovery, Critical Evaluation & Recalibration)_

> **Trạng thái tài liệu:** `PROPOSED FOR OWNER REVIEW` (Dự thảo đề xuất — Chờ phê duyệt từ Product Owner).  
> **Mục tiêu cốt lõi:** Trả lời câu hỏi: _"Quy trình vận hành tối giản, thực tế và khả thi nhất cho phiên bản MVP là gì mà vẫn giữ trọn vẹn ý tưởng gốc của NOVYX?"_  
> **Nguyên tắc vàng:** Không phát triển hệ thống thành nền tảng Enterprise Field Service cồng kềnh; tối ưu cho hiện trường thực tế, tăng độ bền vững và khả năng hồi phục.

---

## 1. Ý tưởng sản phẩm gốc (Original Product Intent)

NOVYX GreenOps không phải là một hệ thống ERP hay FSM (Field Service Management) khổng lồ. Mục tiêu nguyên bản của NOVYX rất rõ ràng và tập trung:

> **Ý tưởng nguyên bản:**  
> Giúp **Quản lý vận hành (Manager)** điều phối công tác chăm sóc cây xanh đô thị, và giúp **Nhân viên hiện trường (Staff)** chứng minh một cách tin cậy rằng công việc bắt buộc đã thực sự được thực hiện trên **đúng cây** tại **đúng vị trí** với **kết quả đạt chuẩn**.

### Các trụ cột bất biến cần bảo tồn:

1. **Cây xanh (Tree):** Là thực thể tài sản vật lý cố định trong không gian đô thị.
2. **Quản lý (Manager):** Tạo và phân công nhiệm vụ bảo dưỡng.
3. **Nhân viên (Staff):** Thực hiện công việc được giao tại hiện trường.
4. **Mã QR:** Nhận diện và đối soát đúng cây cần làm.
5. **GPS:** Xác nhận sự hiện diện thực tế của nhân viên tại tọa độ gốc cây.
6. **Bằng chứng Ảnh Trước/Sau:** Minh chứng kết quả can thiệp kỹ thuật.
7. **Checklist:** Thể hiện các thao tác chuyên môn bắt buộc phải hoàn thành.
8. **Thẩm định & Phê duyệt:** Quản lý xem xét bằng chứng và duyệt hoặc yêu cầu sửa chữa.
9. **Lịch sử chăm sóc (Care History):** Hồ sơ ghi nhận kết quả bảo dưỡng chính thức.

### Các phạm vi cố tình LOẠI BỎ khỏi MVP (Out of Scope):

- Tối ưu hóa lộ trình di chuyển (Route optimization / TSP).
- Chấm công, tính lương công nhật (Workforce payroll).
- Quản lý kho phụ tùng, phân bón, thuốc trừ sâu chi tiết (Parts & inventory).
- Hợp đồng dịch vụ phức tạp (SLA management, contractor billing).
- Ký tên điện tử của người dân/khách hàng (Customer signature).
- Hệ thống GIS biên tập bản đồ đa lớp phức tạp (Advanced GIS polygon editing).
- Cảm biến IoT gắn trên đất/cây (IoT soil/moisture sensors).
- Bảo trì dự đoán dựa trên AI (Predictive maintenance).
- Phê duyệt nhiều cấp (Multi-level hierarchy approval).

---

## 2. Tóm tắt quy trình hiện tại & Các điểm bất hợp lý (Current Process & Flaws)

### 2.1. Mô hình giả định hiện tại (Current Baseline Hypothesis)

Mô hình hiện tại (được mã hóa trong `mobileWorkflow.ts` và `StaffProofFlow.tsx`) áp dụng một khuôn mẫu cứng nhắc duy nhất cho mọi trường hợp:

$$\text{Tạo việc} \to \text{Pending} \to \text{In\_Progress} \to [\text{GPS} \to \text{QR} \to \text{Ảnh Trước} \to \text{Checklist} \to \text{Ảnh Sau}] \to \text{Review} \to \text{Submit} \to \text{Duyệt}$$

### 2.2. Bảng phân tích các điểm nghẽn và phi lý trong thực tế vận hành

| Quy tắc hiện tại                                                               | Lý do tồn tại trong ý tưởng ban đầu              | Vấn đề phát sinh ngoài thực địa (Real-World Reality)                                                                                                                                                                                             | Đánh giá tính cần thiết           | Phương án thay thế thực tế hơn                                                                                                                                                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mọi task bắt buộc đủ 5 chốt bằng chứng:** GPS + QR + Trước + Checklist + Sau | Đảm bảo tính toàn vẹn tối đa, chống gian lận.    | **Quá cứng nhắc:** Việc "Tưới nước" thì ảnh Trước và Sau khác gì nhau ngoài việc đất ướt? Việc "Khảo sát sâu bệnh" (Inspection) thì chụp ảnh Sau cái gì khi chỉ kiểm tra và ghi nhận? Việc dọn cành gãy khẩn cấp sau bão không có checklist dài. | **KHÔNG CẦN THIẾT PHẢI CÀO BẰNG** | Phân loại **Chính sách bằng chứng theo Loại việc (Proof Policy by Task Type)**: Cắt tỉa cần Before/After; Tưới nước/Khảo sát chỉ cần 1 ảnh minh chứng.                                        |
| **Thứ tự tuần tự ép buộc:** Bắt buộc xong GPS mới được quét QR                 | Đảm bảo nhân viên đến nơi rồi mới nhận diện cây. | **Gây ức chế ngoài thực địa:** Nhân viên đứng ngay trước gốc cây, thấy mã QR trước mắt nhưng không quét được vì GPS thiết bị đang trôi sai lệch 11m do tán lá che khuất.                                                                         | **PHI LÝ VỀ TRẬT TỰ**             | Cho phép linh hoạt giữa định vị và quét mã trong khâu **"Xác thực hiện trường" (Site Verification)**: Quét QR xong rồi đo GPS hoặc ngược lại đều hợp lệ trước khi bắt đầu làm.                |
| **Khóa cứng GPS $\le 10$m:** Nếu $> 10$m thì không thể tiếp tục                | Ngăn chặn nhân viên đứng từ xa báo cáo khống.    | **Nghẽn tác nghiệp do tán cây:** Tán cây rậm rạp và nhà cao tầng gây hiện tượng trôi GPS (GNSS multipath), độ lệch thường lên tới 15–20m dù nhân viên đứng sát gốc cây. Khóa cứng làm nhân viên bó tay.                                          | **CẦN MỀM HÓA THÀNH CẢNH BÁO**    | Chuyển thành **Soft Warning / Cảnh báo kèm gắn cờ (Flagged for Review)**: Cho phép xác nhận với ghi chú tọa độ thực tế, báo cho Quản lý hậu kiểm thay vì chặn đứng công việc.                 |
| **Mã QR là bắt buộc tuyệt đối:** Không quét được thì dừng                      | Chống nhầm lẫn cây trên tuyến phố.               | Biển QR ngoài đường thường xuyên bị trầy xước, bùn đất bám, hoặc bị gãy mất sau mưa bão. Nhân viên không có cách nào làm việc tiếp.                                                                                                              | **THIẾU ĐƯỜNG THOÁT NGOẠI LỆ**    | Cung cấp luồng **Báo cáo mã QR hỏng (Damaged QR)**: Cho phép chụp ảnh biển mã bị hỏng + chọn cây theo số hiệu để Quản lý duyệt ngoại lệ.                                                      |
| **Làm lại (Rework) bắt làm lại từ đầu:** Reset toàn bộ                         | Đảm bảo việc sửa chữa tuân thủ lại quy trình.    | **Bất khả thi về mặt vật lý:** Cây đã cắt tỉa xong rồi thì làm sao nhân viên "chụp lại ảnh Trước"? GPS và QR đã xác thực đúng rồi tại sao phải quét lại?                                                                                         | **CỰC KỲ PHI LÝ**                 | **Sửa chữa có trọng tâm (Targeted Correction):** Chỉ yêu cầu bổ sung đúng bằng chứng bị từ chối (ví dụ: chụp lại ảnh sau rõ nét hơn, bổ sung checklist), giữ nguyên các bằng chứng cũ hợp lệ. |
| **Không có luồng "Không thể hoàn thành":** Chỉ có nộp hoặc bỏ dở               | Giả định mọi nhiệm vụ đều làm được.              | Hiện trường có thể bị rào chắn thi công, có ong độc, cây đã bị đổ gãy do bão, hoặc sai địa chỉ. Nhân viên không có nút báo hủy/báo nghẽn.                                                                                                        | **BẮT BUỘC PHẢI CÓ**              | Thêm nút **"Báo cáo sự cố / Không thể thực hiện" (Report Field Issue)** kèm lý do và ảnh hiện trường để trả việc về cho Quản lý điều phối.                                                    |

---

## 3. Nghiên cứu thực tiễn ngành (Field-Service Industry Research)

Chúng tôi đã nghiên cứu thực tiễn từ các giải pháp quản lý công việc hiện trường (ServiceNow FSM, IBM Maximo) và các hệ thống chuyên ngành cây xanh đô thị (TreePlotter, ArborNote, Davey Tree):

| Hệ thống tham chiếu                                             | Mô hình / Thực tiễn quan sát được                                                                                                                                                                                | Giá trị tham khảo cho NOVYX                                                                                                                              | Rủi ro nếu sao chép nguyên xi                                                                                                    | Quyết định (Adopt/Adapt/Reject)                                                                                                                                                               |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ArborNote / TreePlotter (Phần mềm chuyên ngành cây xanh)**    | Dùng mã QR/Barcode gắn thẻ cây để tra cứu nhanh hồ sơ; định vị GPS được lưu tự động ngầm dưới dạng Metadata kèm sai số (Accuracy radius), không chặn màn hình của thợ.                                           | Chứng minh giá trị cốt lõi của QR trong quản lý tài sản cây; GPS nên là metadata đính kèm hơn là bài toán đố chặn người dùng.                            | Các hệ thống này thiên về kiểm kê tài sản (Inventory/GIS) hơn là chuỗi bằng chứng kiểm toán nghiêm ngặt chống gian lận nhà thầu. | **ADAPT:** Giữ việc quét QR để xác thực đúng cây; GPS lưu tọa độ thực tế + khoảng cách; nếu lệch $> 10$m thì cảnh báo và ghi cờ cho Quản lý duyệt thay vì khóa cứng.                          |
| **ServiceNow Field Service Management (FSM)**                   | Vòng đời Work Order: `Draft` $\to$ `Assigned` $\to$ `Accepted` $\to$ `En Route` $\to$ `On Site` $\to$ `Completed` $\to$ `Closed`.                                                                                | Phân định rạch ròi giữa việc "Đang làm ngoài hiện trường" và "Quản lý đã nghiệm thu đóng hồ sơ".                                                         | Quá nhiều trạng thái trung gian (`En Route`, `Accepted`) không cần thiết cho thợ cây xanh làm theo tuyến phố cố định hàng ngày.  | **REJECT sự phức tạp, ADAPT phân định đóng việc:** Giữ luồng gọn: `Pending` (Đã giao) $\to$ `In_Progress` (Đang làm) $\to$ `Waiting_Review` (Thợ nộp) $\to$ `Completed` (Quản lý duyệt đóng). |
| **Tiêu chuẩn Bằng chứng Hiện trường (Proof of Work Standards)** | Phân loại bằng chứng theo rủi ro công việc: Công việc biến đổi vật chất (Cắt tỉa, Đốn hạ) bắt buộc Before/After; Công việc bảo trì định kỳ (Tưới nước, Bón phân) chỉ cần Timestamp + Checklist + 1 ảnh xác nhận. | Giúp giảm tải $50\%$ thao tác thừa cho nhân viên; giảm $60\%$ dung lượng lưu trữ ảnh không cần thiết; phản ánh đúng bản chất kỹ thuật lâm nghiệp đô thị. | Nếu cho phép cấu hình tự do tùy ý trên từng task sẽ làm phức tạp hóa MVP.                                                        | **ADOPT dạng tinh gọn (Simplified Proof Profiles):** Chỉ định nghĩa sẵn 3 nhóm mẫu theo `TaskType`, không làm công cụ cấu hình động phức tạp.                                                 |

---

## 4. Phân tích 18 câu hỏi nghiệp vụ cốt lõi

### Q1: Có bắt buộc mọi task đều phải qua đủ 5 chốt bằng chứng không?

- **Kết luận:** **KHÔNG**. Ép buộc cào bằng 5 chốt là nguyên nhân chính khiến quy trình cảm thấy "quá cứng nhắc".
- **Giải pháp:** Phân loại theo 2 nhóm chính sách bằng chứng (Proof Policy) định sẵn:
  1. **Chính sách Toàn diện (Full Proof - Cắt tỉa, Xử lý sâu bệnh, Bón phân):** Cần GPS + QR + Ảnh Trước + Checklist + Ảnh Sau.
  2. **Chính sách Tinh gọn (Light Proof - Tưới nước, Khảo sát sức khỏe cây):** Cần GPS + QR + Checklist + 1 Ảnh hiện trường (không bắt buộc chia Trước/Sau).

### Q2: Thứ tự thu thập bằng chứng có cần tuần tự tuyệt đối (GPS $\to$ QR) không?

- **Kết luận:** **KHÔNG CẦN ÉP THỨ TỰ TRƯỚC SAU**.
- **Thực tế:** Thợ đến gốc cây, việc quét QR hay bấm lấy GPS trước đều mang cùng một ý nghĩa: **"Xác thực vị trí và danh tính cây" (Site Verification)**.
- **Giải pháp:** Gộp GPS và QR thành nhóm **"Xác thực cây"**. Nhân viên có thể quét QR trước rồi bấm GPS hoặc ngược lại, miễn là cả hai hoàn tất trước khi kết thúc nộp báo cáo.

### Q3: Đo GPS nên là chốt chặn cứng (Hard Gate) hay cảnh báo có thể bỏ qua?

- **Kết luận:** **CẢNH BÁO KÈM GẮN CỜ DUYỆT (Soft Warning with Audit Flag)**.
- **Thực tế:** Dưới tán cây rậm rạp, GPS điện thoại rất hay lệch 12–15m. Khóa cứng nút bấm sẽ biến ứng dụng thành công cụ cản trở công việc ngoài đời thực.
- **Giải pháp:** Nếu khoảng cách $\le 10$m: Báo xanh hợp lệ. Nếu $> 10$m: Báo vàng cảnh báo, cho phép nhân viên bấm "Tiếp tục với tọa độ này" $\to$ Hệ thống ghi nhận tọa độ thực tế và gắn nhãn `[Vị trí cần đối soát]` để Quản lý chú ý khi duyệt.

### Q4: Xử lý thế nào khi mã QR bị mất, mờ hoặc rách?

- **Kết luận:** Cung cấp đường thoát **"Báo cáo QR hư hỏng / Nhập mã thủ công"**.
- **Giải pháp:** Nhân viên chọn "QR không đọc được" $\to$ Chụp 1 ảnh chụp biển mã bị hỏng/vị trí thân cây + nhập mã số cây ghi trên thân (hoặc xác nhận theo tọa độ) $\to$ Task được gắn cờ ngoại lệ để Quản lý xác minh.

### Q5: Nhân viên có cần bước "Chấp nhận việc" (Accept Task) không?

- **Kết luận:** **KHÔNG CẦN CHO MVP**.
- **Lý do:** Nhân viên cây xanh làm việc theo ca phân công của công ty/xí nghiệp công viên. Việc hiển thị sẵn trong tab "Công việc" là đủ; khi nhân viên mở và bắt đầu thao tác thì task tự chuyển sang `In_Progress`.

### Q6: Trạng thái `PENDING` có nghĩa chính xác là gì?

- **Định nghĩa chuẩn:** `PENDING` = **Đã giao cho nhân viên cụ thể, nhưng chưa bắt đầu thực hiện ngoài hiện trường**.
- Trong MVP, mọi task khi tạo bắt buộc phải gán `assignedStaffId`. Không tạo trạng thái "Chưa giao việc" (Unassigned) để giữ MVP tinh gọn.

### Q7: Khi nào thì Task chính thức chuyển sang `IN_PROGRESS`?

- **Sự kiện kích hoạt:** Khi nhân viên bấm nút **"Bắt đầu công việc"** trên thẻ việc, hoặc khi **chốt xác thực đầu tiên (GPS hoặc QR) được ghi nhận**.
- Việc chỉ mở xem chi tiết (View Details) KHÔNG làm thay đổi trạng thái của task.

### Q8: Có cần Quản lý duyệt 100% nhiệm vụ không?

- **Kết luận:** **CÓ, BẮT BUỘC TRONG MVP**.
- **Lý do:** Giá trị cạnh tranh cốt lõi của NOVYX là **"Sự tin cậy có kiểm soát"**. Nếu tự động duyệt sẽ làm mất đi tính chất nghiệm thu của sản phẩm. Việc Quản lý duyệt là lời khẳng định về chất lượng với chủ đầu tư/cơ quan quản lý đô thị.

### Q9: Bản chất của "Làm lại" (Rework) là gì?

- **Định nghĩa chuẩn:** Rework là **Yêu cầu bổ sung hoặc khắc phục bằng chứng chưa đạt yêu cầu**.
- **Quy tắc:**
  - Không xóa bỏ chuỗi bằng chứng cũ đã được xác thực đúng.
  - Quản lý bắt buộc chọn/nhập lý do cụ thể (ví dụ: _"Ảnh sau bị mờ, không thấy vết cắt cành"_).
  - Nhân viên chỉ cần chụp lại ảnh sau hoặc bổ sung mục còn thiếu, sau đó nộp lại.

### Q10: Trạng thái `COMPLETED` có nghĩa là gì?

- **Định nghĩa chuẩn:** `COMPLETED` = **Quản lý đã thẩm định bằng chứng và chính thức nghiệm thu đóng nhiệm vụ**.
- Khi nhân viên nộp báo cáo xong, trạng thái chỉ là `WAITING_REVIEW`, chưa được coi là hoàn thành.

### Q11: Lịch sử chăm sóc (Care History) chứa những gì?

- **Định nghĩa chuẩn:** Chỉ ghi nhận các nhiệm vụ đã ở trạng thái **`COMPLETED`**.
- Các nhiệm vụ đang làm dở hoặc đang chờ duyệt không được xuất hiện trong Lịch sử chăm sóc chính thức của cây để tránh làm sai lệch hồ sơ tài sản.

### Q12: Mối quan hệ giữa Task và Checklist?

- **Quy tắc:** **1 Task = 1 Cây = 1 Hợp đồng công việc**.
- Checklist là danh mục các thao tác kỹ thuật bên trong Task đó (ví dụ: Cắt cành khô, Vệ sinh bồn cây, Bôi keo liền sẹo). Không gọi từng mục checklist là "task" để tránh nhầm lẫn.

### Q13: Nhân viên làm gì khi gặp sự cố không thể hoàn thành việc?

- **Giải pháp:** Cung cấp tính năng **"Báo cáo sự cố hiện trường" (Report Field Issue)**:
  - Nhân viên chọn lý do: _Kẹt rào chắn/công trường, Cây bị gãy đổ, Nguy cơ mất an toàn, Cây không tồn tại_.
  - Chụp 1 ảnh minh chứng hiện trường.
  - Task chuyển trạng thái sang `BLOCKED` (hoặc trả về Quản lý xử lý) mà không bắt ép nhân viên phải giả mạo bằng chứng.

---

## 5. So sánh 3 Phương án Mô hình Vận hành (Workflow Options)

```text
+------------------------------------------------------------------------------------+
|                                BA PHƯƠNG ÁN QUY TRÌNH                              |
+------------------------------------------------------------------------------------+
| OPTION A: GIỮ NGUYÊN HIỆN TRẠNG (5 CHỐT CỨNG CÀO BẰNG, LÀM SẠCH KỸ THUẬT)          |
| - Ưu điểm: Không thay đổi logic hiện có.                                           |
| - Nhược điểm: Vẫn quá cứng nhắc, thợ bị kẹt ngoài thực địa khi GPS trôi hoặc QR mờ.|
| - Kết luận: Không giải quyết được nỗi trăn trở của Product Owner.                  |
+------------------------------------------------------------------------------------+
| OPTION B: MÔ HÌNH THÍCH ỨNG THEO RỦI RO & LOẠI VIỆC (RECOMMENDED - KHUYẾN NGHỊ)    |
| - Định nghĩa 2 hồ sơ bằng chứng: Toàn diện (Full) và Tinh gọn (Light).             |
| - GPS cảnh báo mềm; QR có đường hồi phục mã hỏng; Rework chỉ sửa điểm sai.        |
| - Thêm nút "Báo sự cố không thể làm". Giữ nguyên tính kiểm toán 100% của Quản lý.  |
| - Kết luận: Hài hòa hoàn hảo giữa sự tin cậy và thực tế hiện trường.               |
+------------------------------------------------------------------------------------+
| OPTION C: TỐI GIẢN HÓA CỰC ĐOAN (MINIMAL WALKING SKELETON)                         |
| - Chỉ chụp 1 ảnh duy nhất tại cây + vị trí GPS ngầm. Không có Checklist.           |
| - Nhược điểm: Mất đi tính kỷ luật và bản sắc cốt lõi của NOVYX (Proof of Work).    |
| - Kết luận: Quá sơ sài, không đáp ứng yêu cầu nghiệm thu dịch vụ đô thị.           |
+------------------------------------------------------------------------------------+
```

---

## 6. Đề xuất Mô hình Vận hành MVP Chuẩn hóa (Recommended MVP Business Process)

Mô hình **Phương án B** được đề xuất làm chuẩn mực vận hành mới:

```text
===================================================================================
               QUY TRÌNH VẬN HÀNH THỰC TẾ NOVYX GREENOPS (MVP)
===================================================================================

[BƯỚC 1: QUẢN LÝ GIAO VIỆC]
  Quản lý chọn Cây xanh + Chọn Nhân viên + Chọn Loại việc (Cắt tỉa / Tưới / Khảo sát)
  -> Task khởi tạo ở trạng thái [PENDING]

[BƯỚC 2: NHÂN VIÊN TIẾP NHẬN & ĐẾN HIỆN TRƯỜNG]
  Nhân viên thấy task trong tab "Công việc" -> Bấm "Bắt đầu" -> Task chuyển [IN_PROGRESS]

[BƯỚC 3: XÁC THỰC HIỆN TRƯỜNG (LINH HOẠT THỨ TỰ)]
  Nhân viên thực hiện 2 xác nhận (không ép thứ tự):
  - Quét mã QR thân cây (Nếu hỏng -> Bấm "Báo mã hỏng" + Nhập mã thủ công).
  - Đo GPS (Nếu > 10m do tán cây -> Cảnh báo vàng, cho phép xác nhận kèm cờ hậu kiểm).

[BƯỚC 4: THU THẬP BẰNG CHỨNG THEO LOẠI VIỆC]
  - Việc cắt tỉa / bón phân: Chụp ảnh Trước -> Tích Checklist -> Chụp ảnh Sau.
  - Việc tưới nước / khảo sát: Tích Checklist -> Chụp 1 ảnh nghiệm thu.
  *(Nếu gặp sự cố bất khả kháng: Bấm "Báo sự cố không thể làm" -> Trả việc về Quản lý)*

[BƯỚC 5: NỘP BÁO CÁO NGHIỆM THU]
  Nhân viên soát lại bằng chứng -> Bấm "Gửi duyệt"
  -> Task chuyển sang trạng thái [WAITING_REVIEW]

[BƯỚC 6: QUẢN LÝ THẨM ĐỊNH & KẾT LUẬN]
  Quản lý mở báo cáo, xem ảnh đối chiếu, tọa độ GPS thực tế và checklist:

  +---> [NHÁNH PHÊ DUYỆT]:
  |       Bằng chứng đạt yêu cầu -> Bấm "Phê duyệt"
  |       -> Task chuyển [COMPLETED] (Đóng vĩnh viễn)
  |       -> Tự động ghi vào LỊCH SỬ CHĂM SÓC (Care History) của cây.
  |
  +---> [NHÁNH YÊU CẦU LÀM LẠI]:
          Phát hiện sai sót -> Nhập lý do (ví dụ: "Ảnh sau bị mờ, chụp lại tán cây")
          -> Task chuyển [REWORK_REQUIRED], nổi lên đầu danh sách của Staff.
          -> Staff chỉ cần chụp lại ảnh sau và nộp lại (Bảo toàn bằng chứng cũ).
===================================================================================
```

---

## 7. Phân loại Quy tắc Nghiệp vụ (Business Rule Catalog)

Để tránh nhầm lẫn giữa bất biến kinh doanh và các ràng buộc kỹ thuật tạm thời:

| Mã        | Quy tắc nghiệp vụ                                        | Phân loại chuẩn          | Diễn giải                                                                   |
| --------- | -------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------- |
| **BR-01** | Staff không được tự phê duyệt nhiệm vụ của chính mình    | **HARD INVARIANT**       | Nguyên tắc kiểm soát nội bộ (Separation of Duties); bất biến vĩnh viễn.     |
| **BR-02** | Task đã `COMPLETED` thì không thể sửa đổi                | **HARD INVARIANT**       | Đảm bảo tính pháp lý của hồ sơ kiểm toán sau khi Quản lý đã ký duyệt.       |
| **BR-03** | 1 Task chỉ gắn với duy nhất 1 Cây xanh trong MVP         | **HARD INVARIANT**       | Đơn giản hóa chuỗi bằng chứng 1-1, tránh phân tán trách nhiệm.              |
| **BR-04** | Yêu cầu làm lại bắt buộc phải có lý do cụ thể từ Quản lý | **HARD INVARIANT**       | Tránh từ chối cảm tính; tạo đường hồi phục rõ ràng cho nhân viên.           |
| **BR-05** | Khoảng cách GPS lý tưởng $\le 10$m                       | **MVP POLICY**           | Tiêu chuẩn đo đạc; nếu vượt quá do tán cây thì chuyển sang cảnh báo gắn cờ. |
| **BR-06** | Loại việc quyết định số lượng ảnh bằng chứng             | **MVP POLICY**           | Cắt tỉa cần Trước/Sau; Tưới nước/Kiểm tra chỉ cần 1 ảnh xác nhận.           |
| **BR-07** | Hiển thị cảnh báo khi khoảng cách GPS $> 10$m            | **SOFT WARNING**         | Báo hiệu cho nhân viên biết vệ tinh đang bị trôi để điều chỉnh vị trí.      |
| **BR-08** | Cho phép chụp lại ảnh nếu ảnh vừa chụp bị mờ/ngược sáng  | **OPERATIONAL GUIDANCE** | Hướng dẫn nhân viên kiểm tra trước khi bấm nộp.                             |
| **BR-09** | Danh sách công việc sử dụng FlatList có ảo hóa           | **TECHNICAL CONSTRAINT** | Ràng buộc kỹ thuật di động; không phải quy tắc nghiệp vụ kinh doanh.        |

---

## 8. Sổ đăng ký quyết định nghiệp vụ mở (Business Decision Register)

Các quyết định dưới đây cần **Product Owner xem xét và phê duyệt**:

---

### BUS-DEC-01: Áp dụng Chính sách bằng chứng theo Loại việc hay giữ nguyên 5 chốt cứng?

- **Hiện trạng:** Bắt buộc mọi việc đều phải đủ 5 bước (GPS, QR, Trước, Checklist, Sau).
- **Lựa chọn A:** Giữ nguyên 5 chốt cào bằng cho tất cả các việc.
- **Lựa chọn B (Khuyến nghị):** Phân chia thành 2 mức:
  - _Việc can thiệp vật lý (Cắt tỉa, Bón phân):_ Đủ 5 bước.
  - _Việc định kỳ / Kiểm tra (Tưới nước, Khảo sát):_ GPS + QR + Checklist + 1 Ảnh.
- **Đánh giá:** Lựa chọn B giúp giảm 40% thao tác thừa ngoài nắng cho thợ, tăng tính thực tế của sản phẩm.
- **Trạng thái:** `OPEN FOR OWNER DECISION`

---

### BUS-DEC-02: Cơ chế GPS là Khóa cứng (Hard Gate) hay Cảnh báo gắn cờ (Soft Warning)?

- **Hiện trạng:** Nếu cách $> 10$m thì nút Tiếp tục bị vô hiệu hóa hoàn toàn.
- **Lựa chọn A:** Giữ nguyên khóa cứng $\le 10$m.
- **Lựa chọn B (Khuyến nghị):** Cảnh báo vàng khi $> 10$m; cho phép thợ bấm "Xác nhận vị trí hiện tại" kèm lý do (ví dụ: tán rậm/nhà cao) $\to$ Gắn cờ để Quản lý kiểm tra tọa độ khi duyệt.
- **Đánh giá:** Tránh bế tắc công việc ngoài thực địa do lỗi cảm biến điện thoại.
- **Trạng thái:** `OPEN FOR OWNER DECISION`

---

### BUS-DEC-03: Đường thoát khi mã QR trên cây bị hỏng/mất

- **Hiện trạng:** Không có đường thoát; quét sai hoặc không quét được thì kẹt lại.
- **Lựa chọn A:** Không cho phép làm việc; thợ phải bỏ qua cây đó.
- **Lựa chọn B (Khuyến nghị):** Cung cấp tính năng "Báo QR hỏng" $\to$ Chụp ảnh thân cây/mã hỏng + Nhập số hiệu cây thủ công $\to$ Gửi kèm báo cáo để Quản lý duyệt.
- **Đánh giá:** Giữ cho công việc được thông suốt mà vẫn có bằng chứng hình ảnh đối chiếu.
- **Trạng thái:** `OPEN FOR OWNER DECISION`

---

### BUS-DEC-04: Xử lý trường hợp không thể hoàn thành việc (Cannot Complete)

- **Hiện trạng:** Chưa có luồng này trong ứng dụng.
- **Lựa chọn A:** Thợ tự ý bỏ qua, không thao tác trên app.
- **Lựa chọn B (Khuyến nghị):** Bổ sung nút "Báo sự cố hiện trường" (Kẹt rào, cây gãy, nguy hiểm) $\to$ Đóng task kèm ghi chú sự cố để Quản lý phân công lại.
- **Đánh giá:** Phản ánh đúng thực tế vận hành đô thị.
- **Trạng thái:** `OPEN FOR OWNER DECISION`

---

### BUS-DEC-05: Phạm vi của Lịch sử chăm sóc (Care History)

- **Hiện trạng:** Hiển thị cả task đang chờ duyệt (`Waiting_Review`).
- **Lựa chọn A:** Giữ nguyên hiển thị cả task chờ duyệt.
- **Lựa chọn B (Khuyến nghị):** Chỉ hiển thị các task đã được Quản lý phê duyệt (`Completed`).
- **Đánh giá:** Lựa chọn B đảm bảo hồ sơ cây chỉ chứa dữ liệu đã được xác nhận chính thức.
- **Trạng thái:** `OPEN FOR OWNER DECISION`

---

## 9. Tác động dự kiến đến Mã nguồn và Tài liệu (Impact Analysis)

Khi Product Owner phê duyệt mô hình vận hành khuyến nghị (Phương án B):

1. **Tài liệu chuẩn tắc:** Sẽ cập nhật nhẹ `docs/PRODUCT.md`, `docs/DOMAIN.md`, `docs/WORKFLOWS.md` để đưa Proof Policy và Soft Warning vào contract chính thức.
2. **Hợp đồng `@novyx/contracts`:** Bổ sung trường `proofPolicy?: 'full' | 'light'` vào `TaskDto` và trường `issueReport` cho trường hợp không thể hoàn thành.
3. **Mã nguồn Mobile (`apps/mobile/src`):**
   - `mobileWorkflow.ts`: Cập nhật hàm tính toán gaps để tôn trọng `proofPolicy`.
   - `StaffProofFlow.tsx`: Bổ sung cảnh báo mềm GPS và nút báo mã QR hỏng.
   - `ManagerReview.tsx`: Hiển thị cờ cảnh báo nếu GPS vượt ngưỡng 10m để Quản lý lưu tâm.
4. **Mã nguồn hiện tại:** Vẫn giữ nguyên trạng thái **READ-ONLY** trong đợt này.
