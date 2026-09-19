# NOVYX GreenOps — Đánh giá & Chuẩn hóa Mô hình Quy trình Vận hành Nghiệp vụ

_(Business Process Discovery, Critical Evaluation & Recalibration — Historical Decision Record)_

> [!NOTE]
> **PHÂN LOẠI TÀI LIỆU (DOCUMENT RECLASSIFICATION):** `DECISION EVIDENCE / BUSINESS DESIGN HISTORY`<br />
> **Trạng thái:** `APPROVED HISTORICAL DECISION EVIDENCE`<br />
> **Phiên bản:** 3.1 (Tài liệu lưu vết quyết định nghiệp vụ đã được phê duyệt)<br />
> **Nguyên tắc thẩm quyền:** Tài liệu này là hồ sơ lưu vết (audit trail) quá trình đánh giá và phê duyệt các quyết định nghiệp vụ cốt lõi (`BUS-DEC-01` đến `BUS-DEC-14`).<br />
> **Hợp đồng nghiệp vụ chuẩn tắc (Canonical Business Semantics) hiện được chuyển giao và sở hữu chính thức tại:**<br />
>
> - [`docs/PRODUCT.md`](PRODUCT.md): Tầm nhìn, giá trị cốt lõi, năng lực kinh doanh và phạm vi MVP.<br />
> - [`docs/DOMAIN.md`](DOMAIN.md): Ngôn ngữ chung, Bounded Contexts, thực thể miền và các bất biến nghiệp vụ.<br />
> - [`docs/WORKFLOWS.md`](WORKFLOWS.md): Vòng đời 7 trạng thái, quy trình Site Verification, 3 Proof Profiles, Review, Rework, Blocked, Cancel, Reassign và Care History.<br />
> - [`docs/ACCESS-CONTROL.md`](ACCESS-CONTROL.md): Ma trận phân quyền và điều kiện kích hoạt hành động.<br />
> - [`docs/REQUIREMENTS-TRACEABILITY.md`](REQUIREMENTS-TRACEABILITY.md): Ma trận truy vết yêu cầu và tiêu chuẩn nghiệm thu.

---

## 1. Ý tưởng sản phẩm gốc & Ranh giới bảo tồn (Core Product Intent)

NOVYX GreenOps được định hình để giải quyết bài toán cốt lõi của công tác bảo tồn cây xanh đô thị:

> **Ý tưởng nguyên bản:**  
> Giúp **Quản lý vận hành (Manager)** lập kế hoạch và phân công công tác bảo dưỡng cho từng cây xanh cụ thể; và giúp **Nhân viên hiện trường (Staff)** thu thập các bằng chứng tin cậy chứng minh rằng công việc bắt buộc đã thực sự được thực hiện trên **đúng cây**, tại **đúng vị trí thực địa**, với **kết quả đạt tiêu chuẩn kỹ thuật**. Quản lý thẩm định bằng chứng, phê duyệt nghiệm thu hoặc yêu cầu làm lại có trọng tâm. Công việc được nghiệm thu sẽ tạo nên **Lịch sử chăm sóc chính thức (Care History)** của cây.

### Các trụ cột nghiệp vụ được bảo tồn nguyên vẹn:

1. **Cây xanh (Tree):** Là thực thể tài sản vật lý trung tâm trong không gian đô thị.
2. **Quản lý (Manager):** Lập kế hoạch, giao việc, theo dõi tiến độ, xử lý sự cố, thẩm định hồ sơ, phê duyệt nghiệm thu hoặc yêu cầu làm lại.
3. **Nhân viên (Staff):** Xem việc được giao, chủ động bấm bắt đầu, thực hiện thi công ngoài hiện trường, nộp bằng chứng trung thực.
4. **Mã QR:** Nhận diện và đối soát danh tính thực thể cây mục tiêu.
5. **GPS:** Xác nhận sự hiện diện thực tế của nhân viên tại tọa độ gốc cây.
6. **Bằng chứng hình ảnh:** Minh chứng trực quan cho hiện trạng và kết quả can thiệp kỹ thuật.
7. **Checklist:** Danh mục hướng dẫn và xác nhận các thao tác kỹ thuật bắt buộc.
8. **Thẩm định & Phê duyệt:** Cổng kiểm soát chất lượng bắt buộc trước khi đóng việc.
9. **Lịch sử chăm sóc (Care History):** Hồ sơ kỹ thuật chính thức tích lũy qua vòng đời của cây.

### Các phạm vi DỨT KHOÁT LOẠI BỎ khỏi MVP (Out of Scope):

- Tối ưu hóa lộ trình di chuyển tự động (Route optimization / TSP).
- Quản lý chấm công, tính lương công nhật (Workforce payroll).
- Quản trị kho vật tư, phân bón, thuốc bảo vệ thực vật chi tiết (Parts & inventory).
- Quản lý hợp đồng nhà thầu và thanh quyết toán dịch vụ (Contractor billing, SLAs).
- Ký nhận điện tử của người dân/chủ đầu tư (Customer digital signatures).
- Hệ thống GIS chuyên sâu biên tập đa giác bản đồ (Advanced GIS polygon editing).
- Cảm biến IoT gắn đất hoặc thân cây (IoT soil/tree tilt sensors).
- Dự báo bảo trì bằng trí tuệ nhân tạo (Predictive maintenance AI).
- Phê duyệt đa cấp bậc tổ chức (Multi-level corporate approvals).
- Vai trò Quản trị viên hệ thống (Admin) — _Dành cho giai đoạn tương lai_.

---

## 2. Rà soát độ lệch quy trình (Workflow Deviation Analysis)

Quy trình vận hành thực tế đã được **tinh chỉnh đáng kể (Materially Refined)** so với giả thuyết thiết kế ban đầu nhằm tháo gỡ sự cứng nhắc ngoài thực tế mà vẫn bảo toàn tính toàn vẹn của bằng chứng:

| Giả thuyết thiết kế ban đầu                                                                        | Tinh chỉnh nghiệp vụ đề xuất (Proposed Refinement)                                                                                                             | Lý do tinh chỉnh vận hành                                                                                                                |
| :------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **5 chốt bằng chứng bắt buộc cho 100% task** (GPS $\to$ QR $\to$ Trước $\to$ Checklist $\to$ Sau). | **Chính sách bằng chứng theo 3 Hồ sơ ngữ nghĩa**: `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`.                                                         | Tưới nước hoặc khảo sát sâu bệnh không tạo ra thay đổi hình thái trước/sau rõ rệt; ép 2 ảnh Trước/Sau là hình thức và lãng phí thao tác. |
| **Thứ tự tuần tự ép buộc tuyệt đối**: Bắt buộc GPS xong mới được quét QR.                          | **Xác thực hiện trường (Site Verification)**: QR và GPS là 2 tín hiệu độc lập, thực hiện thứ tự nào trước cũng được.                                           | Nhân viên đứng trước gốc cây có thể quét QR ngay khi đến mà không cần chờ chip GPS trên điện thoại ổn định tín hiệu.                     |
| **Khóa cứng GPS $\le 10$m**: Sai lệch $> 10$m thì chặn đứng hoàn toàn.                             | **Mục tiêu 10m + Ngoại lệ vị trí có kiểm soát (`LOCATION_EXCEPTION`)**: Cho phép gửi giải trình kèm cờ hậu kiểm khi GPS trôi do tán lá rậm/nhà cao.            | Tán cây rậm gây suy giảm tín hiệu vệ tinh; khóa cứng làm tê liệt công việc thực tế của công nhân dù đang đứng cạnh cây.                  |
| **Mã QR là cửa ải duy nhất**: Không quét được QR thì bế tắc.                                       | **Ngoại lệ danh tính (`IDENTITY_EXCEPTION`)**: Cho phép chụp ảnh tem hỏng + nhập mã đối chiếu với cây được giao. Cây mục tiêu **bất biến, không bao giờ đổi**. | Tem QR ngoài trời chịu mưa nắng, rêu mốc có thể bị trầy xước; cần đường phục hồi có bằng chứng ảnh cho Quản lý hậu kiểm.                 |
| **Làm lại (Rework) xóa sạch toàn bộ**: Bắt làm lại từ đầu cả 5 bước.                               | **Làm lại có mục tiêu (`Targeted Rework`)**: Chỉ sửa đúng mục bị từ chối; bằng chứng cũ và bằng chứng mới đều được lưu vết lịch sử (versioned).                | Cây đã cắt tỉa xong thì không thể chụp lại "Ảnh trước"; việc xóa sạch bằng chứng cũ là phi lý về mặt vật lý.                             |
| **Không có luồng dừng khi gặp trở ngại**: Chỉ có nộp hoặc bỏ việc.                                 | **Báo cáo sự cố hiện trường (`ReportFieldIssue`)**: Chuyển task sang trạng thái tạm dừng `BLOCKED` có 3 lối thoát tất định (`RESUME`, `REASSIGN`, `CANCEL`).   | Hiện trường có thể bị rào chắn, ong độc, cây đổ gãy do bão; cần cơ chế báo cáo chính danh thay vì bỏ rơi việc.                           |

---

## 3. Rà soát nghiên cứu thực tiễn ngành (Industry Research Grounding)

_Lưu ý: Nghiên cứu thực tiễn dùng để nhận diện các MÔ HÌNH VẬN HÀNH (Operational Patterns), không dùng để sao chép độ phức tạp của các nền tảng doanh nghiệp lớn._

| Hệ thống / Thực tiễn                                   | Mô hình vận hành quan sát được (Observed Pattern)                                                                                                                                                      | Khả năng ứng dụng cho NOVYX                                                                                                                                                                  | Giới hạn & Điểm loại trừ (Limitations)                                                                                                              |
| :----------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ServiceNow / Enterprise FSM**                        | Phân định rạch ròi giữa việc "Đang thao tác ngoài hiện trường" (`In_Progress`) và "Hồ sơ đã được thẩm định nghiệm thu" (`Closed/Completed`). Có cơ chế báo chặn việc (`Suspended/Blocked`).            | Áp dụng phân định trạng thái đóng việc rõ ràng: Nhân viên nộp bài chỉ là `WAITING_REVIEW`; chỉ Quản lý duyệt mới thành `COMPLETED`. Áp dụng trạng thái `BLOCKED` để nhân viên báo cáo sự cố. | Loại bỏ toàn bộ các trạng thái trung gian rườm rà như `Accepted`, `En Route`, `On Site`, `Parts Required`, `Customer Signoff`.                      |
| **Hệ thống Quản lý Cây xanh (ArborNote, TreePlotter)** | Sử dụng mã định danh vật lý (QR/Barcode/Tag) gắn vào thân cây để tra cứu hồ sơ. Dữ liệu GPS được lưu kèm bán kính sai số (Accuracy) để làm metadata kiểm toán vị trí.                                  | Xác nhận rằng mã vật lý là phương tiện tốt nhất để tránh nhầm lẫn cây trên tuyến phố. Tọa độ GPS đi kèm độ chính xác của thiết bị để Quản lý có cơ sở đánh giá độ tin cậy.                   | Các hệ thống này thiên về bản đồ GIS quản lý tài sản, không tập trung vào chuỗi bằng chứng kiểm toán nghiêm ngặt chống gian lận nhà thầu như NOVYX. |
| **Mô hình Thu thập Bằng chứng Dịch vụ**                | Phân loại bằng chứng theo bản chất kỹ thuật: Việc thay đổi hình thái yêu cầu ảnh trước/sau; Việc duy tu định kỳ yêu cầu checklist và ảnh xác nhận; Việc kiểm tra yêu cầu kết quả ghi nhận có cấu trúc. | Giúp NOVYX xây dựng các Hồ sơ bằng chứng ngữ nghĩa (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`), xóa bỏ việc bắt buộc chụp ảnh trước/sau một cách giả tạo cho công việc tưới nước.  | Không triển khai công cụ cấu hình quy trình động (workflow engine phức tạp) ở MVP; chỉ cung cấp các mẫu hồ sơ cố định được gán sẵn theo Loại việc.  |

---

## 4. Mô hình 3 Hồ sơ Bằng chứng Ngữ nghĩa & Khung Quản trị TaskType (Proof Profiles & Governance)

Tuyệt đối loại bỏ cách gọi định lượng "Full Proof / Light Proof". Chuẩn hóa dứt điểm thành **3 Hồ sơ Bằng chứng Ngữ nghĩa (Semantic Proof Profiles)**:

```text
+----------------------------------------------------------------------------------------------------+
|                                BA HỒ SƠ BẰNG CHỨNG NGỮ NGHĨA (MVP)                                 |
+----------------------------------------------------------------------------------------------------+
| 1. CHANGE_PROOF (Bằng chứng Thay đổi Hình thái)                                                    |
|    - Mục đích: Áp dụng cho công việc làm biến đổi rõ rệt trạng thái vật lý của cây.                |
|    - Loại việc ví dụ: Cắt tỉa cành, Đốn hạ cành mục nguy hiểm, Trồng dặm, Trồng mới.               |
|    - Hợp đồng bằng chứng bắt buộc:                                                                 |
|      * Xác thực hiện trường (QR + GPS hoặc Ngoại lệ có kiểm soát)                                  |
|      * ẢNH TRƯỚC (Before Evidence) khi can thiệp                                                   |
|      * Checklist kỹ thuật hoàn thành 100%                                                          |
|      * ẢNH SAU (After Evidence) khi can thiệp xong                                                 |
+----------------------------------------------------------------------------------------------------+
| 2. SERVICE_PROOF (Bằng chứng Dịch vụ Duy trì)                                                      |
|    - Mục đích: Áp dụng cho công việc bảo dưỡng định kỳ không tạo ra khác biệt hình thái rõ rệt.    |
|    - Loại việc ví dụ: Tưới nước, Bón phân gốc/lá, Phun thuốc vi sinh, Vệ sinh bồn cây.             |
|    - Hợp đồng bằng chứng bắt buộc:                                                                 |
|      * Xác thực hiện trường (QR + GPS hoặc Ngoại lệ có kiểm soát)                                  |
|      * Checklist kỹ thuật hoàn thành 100%                                                          |
|      * 01 ẢNH HOÀN TẤT HIỆN TRƯỜNG (Completion Photo) chụp hiện trường/gốc cây                     |
+----------------------------------------------------------------------------------------------------+
| 3. INSPECTION_PROOF (Bằng chứng Khảo sát / Đánh giá)                                               |
|    - Mục đích: Áp dụng cho công việc quan sát, đánh giá tình trạng sức khỏe mà không can thiệp cơ học.|
|    - Loại việc ví dụ: Khảo sát sâu bệnh, Đánh giá độ nghiêng/nguy cơ mùa mưa bão.                 |
|    - Hợp đồng bằng chứng bắt buộc:                                                                 |
|      * Xác thực hiện trường (QR + GPS hoặc Ngoại lệ có kiểm soát)                                  |
|      * Ghi nhận tình trạng có cấu trúc (Structured Findings / Checklist sức khỏe)                  |
|      * 01 hoặc nhiều ẢNH HIỆN TRẠNG (Condition Photos) phản ánh đúng vị trí bị bệnh/bị nghiêng     |
+----------------------------------------------------------------------------------------------------+
```

### Khung Quản trị Khóa chặt (Governance Rule: TaskType $\to$ ProofProfile):

- **Cơ chế suy diễn tự động:** Quản lý chỉ chọn **`TaskType`**. Hệ thống tự động suy diễn ra **`ProofProfile`** và **`Checklist Template`** mặc định tương ứng.
- **NGHIÊM CẤM HẠ CẤP BẰNG CHỨNG (NO MANUAL DOWNGRADE):** Quản lý **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** tự ý hạ cấp Proof Profile của một nhiệm vụ (ví dụ: gán `TaskType = PRUNING` nhưng lại chọn `INSPECTION_PROOF` để giảm bớt bước chụp ảnh).
- **Quyền hạn của Quản lý:**
  - Được xem xét danh mục checklist do hệ thống tự sinh.
  - Được bổ sung ghi chú/chỉ dẫn tác nghiệp vận hành.
  - Được chọn giữa các mẫu checklist đã được phê duyệt sẵn nếu loại việc đó có nhiều mẫu hợp lệ.
- **Giới hạn bất biến:** Quản lý không được tùy tiện xóa bỏ các yêu cầu bằng chứng bắt buộc, không được chuyển đổi hồ sơ bằng chứng tự do, và hệ thống không xây dựng trình cấu hình workflow động trong MVP.

---

## 5. Mô hình Xác thực Hiện trường (Site Verification Model)

Xác thực hiện trường trả lời câu hỏi nghiệp vụ: **"Nhân viên có thực sự đang có mặt tại đúng cây được giao hay không?"**

Quy trình gom hai tín hiệu độc lập vào một cổng chung **`SITE VERIFICATION`**:

1. **Tín hiệu Danh tính Tài sản (Asset Identity Signal):** Quét mã QR gắn trên thân cây.
2. **Tín hiệu Vị trí Địa lý (Location Signal):** Tọa độ GPS thu được từ cảm biến thiết bị di động.

### Quy tắc vận hành Xác thực Hiện trường:

- **Thứ tự độc lập:** Nhân viên có thể quét QR trước rồi lấy GPS, hoặc lấy GPS trước rồi quét QR. Hệ thống không ép buộc trình tự giữa hai thao tác này.
- **Không thay đổi trạng thái Task:** Thao tác đo GPS hay quét QR chỉ cập nhật trạng thái xác thực (`SiteVerification`), **tuyệt đối không làm thay đổi trạng thái vòng đời Task**.
- **Điều kiện tiên quyết để nộp bài:** Cổng `SITE VERIFICATION` phải được giải quyết (qua xác thực chuẩn hoặc kích hoạt ngoại lệ có kiểm soát) thì hệ thống mới cho phép nộp báo cáo bằng chứng (`SubmitEvidence`).

---

## 6. Chính sách Ngoại lệ Vị trí (GPS Controlled Exception)

- **Chính sách mục tiêu MVP (Target Policy):** Khoảng cách từ vị trí nhân viên đến tọa độ gốc cây $\le 10$m.
- **Tuyệt đối không sử dụng ngưỡng ma thuật:** Bỏ hoàn toàn khái niệm 10–25m.
- **Quy trình xử lý ngoại lệ:**
  1. Khi cảm biến ghi nhận khoảng cách $> 10$m: Hệ thống hiển thị nhắc nhở nhân viên di chuyển lại gần hoặc bấm đo lại.
  2. Nếu sau khi đo lại mà tín hiệu vẫn không đạt do tán lá rậm hoặc hẻm vực đô thị: Nhân viên bấm chọn **"Yêu cầu ngoại lệ vị trí" (`Invoke Location Exception`)**.
  3. **Dữ liệu bắt buộc lưu trữ:** Tọa độ đo được, khoảng cách đo được, độ chính xác cảm biến (accuracy), thời điểm ghi nhận (timestamp), và lý do giải trình bắt buộc.
  4. **Nguyên tắc kiểm toán:** Ngoại lệ vị trí **KHÔNG TƯƠNG ĐƯƠNG VỚI HỢP LỆ CHUẨN**. Hệ thống không tự động chuyển `verified = true`, mà lưu vết `LOCATION_EXCEPTION` và hiển thị cảnh báo nổi bật trên giao diện duyệt của Quản lý.

---

## 7. Chính sách Ngoại lệ Danh tính (QR / Identity Exception)

- **Bất biến trung tâm:** **CÂY MỤC TIÊU (`Task.treeId`) LÀ BẤT BIẾN TRONG SUỐT QUÁ TRÌNH THI CÔNG HIỆN TRƯỜNG**.
- **Quy trình xử lý khi mã QR hỏng/mất:**
  1. Quét QR thành công $\to$ Trạng thái `TREE_IDENTITY_VERIFIED`.
  2. Tem QR bị rách, mất, bám rêu $\to$ Nhân viên bấm **"Báo mã QR hư hỏng" (`IDENTITY_EXCEPTION`)**.
  3. **Bằng chứng bắt buộc thu thập:**
     - 01 Ảnh hiện trạng tem QR bị rách/vị trí thân cây gắn tem.
     - Lý do/ghi chú giải trình.
     - Mã số nhận dạng vật lý sơn trên thân cây (nếu đọc được bằng mắt thường).
  4. **Ràng buộc đạo đức dữ liệu:** Mã nhập thủ công chỉ dùng để đối chiếu với `Task.treeId` đã được giao. Nhân viên **tuyệt đối không được dùng tính năng này để tráo đổi sang làm việc trên cây khác**. Quản lý bắt buộc phải đối chiếu ảnh thân cây khi duyệt.

---

## 8. Sự kiện Bắt đầu Công việc Tất định (Deterministic Task Start)

Khóa chặt điều kiện chuyển trạng thái sang `IN_PROGRESS`:

- **Quy tắc tất định duy nhất:** Nhiệm vụ chỉ chuyển từ `PENDING` sang `IN_PROGRESS` khi **Nhân viên bấm nút "Bắt đầu công việc" (`StartTask`)** trên màn hình chi tiết công việc.
- **Các hành động KHÔNG ĐƯỢC PHÉP tự động kích hoạt chuyển trạng thái:**
  - Mở xem chi tiết nhiệm vụ (View Task Details) $\to$ Vẫn là `PENDING`.
  - Bấm đo GPS $\to$ Vẫn là `PENDING`.
  - Bấm quét mã QR $\to$ Vẫn là `PENDING`.
  - Chụp ảnh trước $\to$ Vẫn là `PENDING`.

---

## 9. Ngữ nghĩa Trạng thái BLOCKED & Các Lối thoát Tất định (Blocked Semantics & Deterministic Exits)

`BLOCKED` là một trạng thái chính thức trong `TaskStatus` của MVP nhằm phản ánh tình trạng đình chỉ thi công do trở ngại vật lý bất khả kháng ngoài hiện trường (công trường rào chắn, ong vò vẽ nguy hiểm, cây đã bị bão quật đổ trước đó, sai địa chỉ):

- **Điều kiện vào duy nhất:** Task chỉ có thể chuyển sang `BLOCKED` từ **`IN_PROGRESS`** thông qua hành động **"Báo sự cố hiện trường" (`ReportFieldIssue`)** kèm lý do, ghi chú và ảnh chụp minh chứng. Task ở `PENDING` chưa đi làm thì không thể bị `BLOCKED`.
- **Bản chất:** `BLOCKED` là trạng thái tạm dừng vận hành, **KHÔNG PHẢI LÀ TRẠNG THÁI KẾT THÚC (NON-TERMINAL)**.
- **3 LỐI THOÁT TẤT ĐỊNH DUY NHẤT CỦA QUẢN LÝ TỪ `BLOCKED`:**
  1. **`BLOCKED + RESUME` $\to$ `IN_PROGRESS`:** Khi sự cố hiện trường đã được giải quyết (ví dụ: công trường đã dỡ rào chắn), Quản lý mở lại việc cho nhân viên cũ tiếp tục làm việc.
  2. **`BLOCKED + REASSIGN` $\to$ `PENDING`:** Khi Quản lý quyết định chuyển giao công việc cho nhân viên/tổ chuyên trách khác $\to$ Gán `assignedStaffId` mới, nhiệm vụ quay về `PENDING` để người mới bắt đầu lại.
  3. **`BLOCKED + CANCEL` $\to$ `CANCELLED`:** Khi cây không còn tồn tại hoặc công việc không còn cần thiết $\to$ Quản lý đóng việc vĩnh viễn với trạng thái hủy.
- _Loại bỏ hoàn toàn các mô tả mơ hồ như "Resume $\to$ IN_PROGRESS hoặc PENDING"._

---

## 10. Quy định Phân công lại Công việc (Reassignment Rules) & Sở hữu Bằng chứng

Phân định ranh giới chặt chẽ theo từng trạng thái vòng đời:

1. **Ở `PENDING`:** Quản lý được phép đổi người thực hiện tự do. Nhiệm vụ giữ nguyên `PENDING`, chỉ thay đổi `assignedStaffId`.
2. **Ở `IN_PROGRESS`:** **CẤM PHÂN CÔNG LẠI TRỰC TIẾP**. Nếu nhân viên đang làm dở mà không thể tiếp tục, công việc bắt buộc phải đi qua luồng: `IN_PROGRESS` $\to$ `BLOCKED` $\to$ Quản lý `REASSIGN` $\to$ `PENDING` với nhân viên mới.
3. **Ở `BLOCKED`:** Quản lý được phép phân công lại sang nhân viên mới $\to$ Nhiệm vụ chuyển về `PENDING`.
4. **Ở `WAITING_REVIEW`:** **TUYỆT ĐỐI CẤM PHÂN CÔNG LẠI**. Gói bằng chứng đã nộp gắn liền với nhân thân và trách nhiệm của người đã thực hiện.
5. **Ở `REWORK_REQUIRED`:** **CẤM PHÂN CÔNG LẠI TRỰC TIẾP**. Nếu thợ cũ không thể sửa, công việc phải được báo nghẽn/leo thang để Quản lý giải quyết theo quy trình kiểm soát trách nhiệm.
6. **Ở `COMPLETED` và `CANCELLED`:** Đã đóng, cấm phân công lại.

### Nguyên tắc Bảo toàn Quyền Tác giả Bằng chứng (Evidence Ownership):

- Khi nhiệm vụ được gán lại cho người mới sau khi đã có bằng chứng phát sinh từ người cũ:
  - Tuyệt đối **không xóa bỏ** các bằng chứng cũ.
  - Tuyệt đối **không viết lại tác giả** (`capturedByUserId`) để gán sang cho người mới.
  - Bằng chứng của người cũ được lưu vào **Lịch sử nỗ lực kiểm toán (Historical Attempt)**; người mới tiếp tục hoàn thành các yêu cầu công việc còn lại dưới danh tính của chính mình.

---

## 11. Cơ chế Hủy Nhiệm vụ Chuẩn hóa (Final Cancellation Model)

- **Trạng thái:** `CANCELLED` là trạng thái kết thúc (Terminal State).
- **Quyền hạn:** Chỉ duy nhất Quản lý (Manager) có quyền hủy việc.
- **Phạm vi cho phép hủy:** Quản lý có thể hủy từ **bất kỳ trạng thái chưa kết thúc nào**:
  - `PENDING` $\to$ `CANCELLED`
  - `IN_PROGRESS` $\to$ `CANCELLED`
  - `BLOCKED` $\to$ `CANCELLED`
  - `WAITING_REVIEW` $\to$ `CANCELLED`
  - `REWORK_REQUIRED` $\to$ `CANCELLED`
- **Cấm hủy:** Tuyệt đối không được hủy nhiệm vụ đã `COMPLETED` hoặc đã `CANCELLED`.
- **Yêu cầu kiểm toán:** Hủy việc bắt buộc phải có lý do hủy, danh tính Quản lý hủy và thời điểm hủy.
- **Ranh giới dữ liệu:** Hủy việc không xóa cứng dữ liệu, không xóa bằng chứng đã thu thập, và nhiệm vụ bị hủy **KHÔNG BAO GIỜ ĐƯỢC GHI VÀO CAREHISTORY**.

---

## 12. Cơ chế Sửa chữa có Trọng tâm & Bảo toàn Lịch sử Phiên bản (Targeted Rework & Versioning)

- Khi Quản lý từ chối nghiệm thu (`REQUEST_REWORK`), Quản lý bắt buộc chỉ định danh mục cần sửa:
  - `AFTER_PHOTO`: Chụp lại ảnh sau rõ nét hơn.
  - `COMPLETION_PHOTO`: Chụp lại ảnh hoàn tất.
  - `CHECKLIST`: Hoàn thiện lại mục thao tác còn thiếu.
  - `INSPECTION_FINDING`: Bổ sung chi tiết khảo sát bệnh học.
  - `IDENTITY_EXCEPTION` / `LOCATION_EXCEPTION`: Giải trình rõ hơn về ngoại lệ.
- **Bảo toàn bằng chứng cũ:** Hệ thống **tuyệt đối không reset** GPS, QR hay Ảnh Trước nếu các mục này đã hợp lệ.
- **Lưu vết phiên bản (Versioned Evidence):**
  - Lần nộp 1 (bị từ chối) được lưu trữ đầy đủ trong lịch sử kiểm toán.
  - Lần nộp 2 (khắc phục) được lưu kèm chỉ số phiên bản mới.
  - Quá trình làm lại không bao giờ được xóa đè lịch sử nộp bài trước đó.

---

## 13. Xử lý Sai sót Lịch sử Không thể Khắc phục & Cơ chế `APPROVE_WITH_EXCEPTION`

### Vấn đề thực tế:

Nhân viên cắt tỉa cành xong xuôi nhưng quên chụp Ảnh Trước. Cây đã trơ cành, trạng thái vật lý ban đầu không còn tồn tại trên thực tế. Nhân viên **tuyệt đối không được ngụy tạo ảnh trước giả mạo**. Tình huống này được định danh chính thức là: **`EVIDENCE_INTEGRITY_EXCEPTION`**.

### 4 Kết quả Thẩm định Duyệt chính thức tại `WAITING_REVIEW`:

Quản lý khi mở hồ sơ duyệt tại `WAITING_REVIEW` có đúng 4 lựa chọn kết luận:

1. **`APPROVE` (Nghiệm thu Đạt chuẩn):**
   - Áp dụng: Toàn bộ bằng chứng và xác thực đều hợp lệ.
   - Kết quả: `WAITING_REVIEW` $\to$ `COMPLETED` $\to$ Tạo bản ghi chính thức trong `CareHistory`.
2. **`REQUEST_REWORK` (Yêu cầu Sửa chữa có Trọng tâm):**
   - Áp dụng: Phát hiện sai sót có thể khắc phục được ngoài hiện trường.
   - Kết quả: `WAITING_REVIEW` $\to$ `REWORK_REQUIRED` (chỉ định rõ mục cần sửa).
3. **`APPROVE_WITH_EXCEPTION` (Chấp thuận Nghiệm thu kèm Ngoại lệ):**
   - Áp dụng: Tồn tại ngoại lệ không thể khắc phục (như thiếu ảnh trước hoặc GPS trôi bất khả kháng), nhưng Quản lý thẩm tra thực tế xác nhận công việc đã hoàn thành đạt chất lượng lâm sinh và ra quyết định chấp thuận nghiệm thu theo quy chế vận hành nội bộ.
   - Điều kiện bắt buộc: Phải có hành động xác nhận chủ động của Quản lý, lý do chấp thuận bắt buộc, lưu vết vĩnh viễn trong hồ sơ kiểm toán.
   - Kết quả: `WAITING_REVIEW` $\to$ `COMPLETED` (với cờ đánh dấu chấp thuận kèm ngoại lệ). Bản ghi trong `CareHistory` hiển thị rõ thông tin ngoại lệ này.
   - _Lưu ý kiến trúc:_ Không tạo thêm trạng thái `COMPLETED_WITH_EXCEPTION` trong `TaskStatus`; cờ ngoại lệ thuộc về metadata thẩm định.
4. **`CANCEL` (Hủy bỏ Nhiệm vụ):**
   - Áp dụng: Phát hiện sai sót nghiêm trọng hoặc hồ sơ không hợp lệ không thể chấp nhận.
   - Kết quả: `WAITING_REVIEW` $\to$ `CANCELLED`.

### Nguyên tắc Kiểm soát `APPROVE_WITH_EXCEPTION`:

Tính năng này tuyệt đối không được biến thành lối đi tắt để bỏ qua quy trình. Nếu bằng chứng bị thiếu có thể chụp lại được (ví dụ: ảnh sau bị mờ), Quản lý bắt buộc phải dùng `REQUEST_REWORK`.

---

## 14. Phân định Rạch ròi 5 Chiều Trạng thái (State Dimensions)

Tuyệt đối không gộp các chiều trạng thái khác nhau vào một enum duy nhất:

1. **Vòng đời Nhiệm vụ (`TaskStatus`):**<br />
   `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`.
2. **Tiến độ Bằng chứng (`ProofProgress`):**<br />
   Tập hợp các yêu cầu bằng chứng đã hoàn thành theo hồ sơ ngữ nghĩa (`SiteVerified`, `BeforePhotoCaptured`, `ChecklistCompleted`, `AfterPhotoCaptured`, `CompletionPhotoCaptured`).
3. **Trạng thái Ngoại lệ (`VerificationException`):**<br />
   `LOCATION_EXCEPTION`, `IDENTITY_EXCEPTION`, `EVIDENCE_INTEGRITY_EXCEPTION`.
4. **Trạng thái Đồng bộ (`SyncStatus`):**<br />
   `SYNCED`, `PENDING_SYNC`, `SYNC_FAILED`.
5. **Trạng thái Điều hướng (`NavigationState`):**<br />
   Màn hình đang hiển thị trong ứng dụng di động.

### Ngữ nghĩa Vận hành Ngoại tuyến (Offline Semantics):

- Khi nhân viên không có mạng và bấm "Gửi duyệt" tại hiện trường:
  - Trên thiết bị cục bộ: `LocalSubmissionStatus = PENDING_SYNC`.
  - Trên hệ thống máy chủ chính thức: Nhiệm vụ **VẪN Ở TRẠNG THÁI `IN_PROGRESS`**.
  - Khi có mạng và gói tin nộp bài được máy chủ tiếp nhận thành công: Nhiệm vụ mới chính thức chuyển sang `WAITING_REVIEW` và `LocalSubmissionStatus = SYNCED`.
  - Nếu đồng bộ thất bại: `LocalSubmissionStatus = SYNC_FAILED`, nhiệm vụ trên máy chủ vẫn là `IN_PROGRESS`.
  - Tuyệt đối không đưa giá trị `OFFLINE_SUBMITTED` vào `TaskStatus`.

---

## 15. Sơ đồ Vòng đời Nhiệm vụ Tất định (Final Deterministic Task Lifecycle)

Mô hình trạng thái khép kín, đầy đủ mọi lối thoát và không còn bất kỳ nhánh rẽ ngầm nào:

```text
       [Tạo việc & Gán nhân viên]
                   |
                   v
              +---------+ (Cancel) -------------------------------------+
              | PENDING |                                               |
              +---------+                                               |
                   |                                                    |
             (StartTask)                                                |
                   |                                                    |
                   v                                                    |
             +-------------+  (ReportFieldIssue)   +---------+ (Cancel) |
             | IN_PROGRESS | --------------------> | BLOCKED | ---+     |
             +-------------+                       +---------+    |     |
                   |                                |       |     |     |
            (SubmitEvidence)        (Resume) <------+       |     |     |
                   |                    |                   |     |     |
                   |                    +---> (Reassign)    |     |     |
                   |                             |          |     |     |
                   v                             v          |     |     |
           +----------------+                [PENDING]      |     |     |
           | WAITING_REVIEW |                               |     |     |
           +----------------+                               |     |     |
              |     |     |                                 |     |     |
     (Approve)|     |     | (RequestRework)                 |     |     |
              |     |     v                                 |     |     |
              |     |   +-----------------+                 |     |     |
              |     |   | REWORK_REQUIRED | (Cancel) -------+     |     |
              |     |   +-----------------+                 |     |     |
              |     |            |                          |     |     |
              |     |      (Resubmit)                       |     |     |
              |     |            |                          |     |     |
              |     |            +---> [WAITING_REVIEW]     |     |     |
              |     |                                       |     |     |
              |     +---> (ApproveWithException)            |     |     |
              |     |                                       |     |     |
              |     +---> (Cancel) -------------------------+     |     |
              v     v                                             v     v
        +-----------+                                       +-----------+
        | COMPLETED | (Terminal: Thành công)                | CANCELLED | (Terminal: Đã hủy)
        +-----------+                                       +-----------+
         -> Tạo CareHistory                                  -> Không vào CareHistory
```

### Bảng Chuyển Trạng Thái Tất Định (State Transition Table):

| Trạng thái Nguồn  | Sự kiện Kích hoạt      | Trạng thái Đích   | Người thực hiện    | Điều kiện Nghiệp vụ                                              |
| :---------------- | :--------------------- | :---------------- | :----------------- | :--------------------------------------------------------------- |
| `PENDING`         | `StartTask`            | `IN_PROGRESS`     | Staff              | Nhân viên bấm "Bắt đầu công việc" ngoài hiện trường.             |
| `PENDING`         | `Reassign`             | `PENDING`         | Manager            | Quản lý đổi `assignedStaffId` mới cho công việc chưa làm.        |
| `PENDING`         | `Cancel`               | `CANCELLED`       | Manager            | Quản lý hủy việc kèm lý do bắt buộc.                             |
| `IN_PROGRESS`     | `SubmitEvidence`       | `WAITING_REVIEW`  | Staff $\to$ System | Bằng chứng đủ theo Profile và máy chủ nhận thành công.           |
| `IN_PROGRESS`     | `ReportFieldIssue`     | `BLOCKED`         | Staff              | Báo cáo sự cố hiện trường bất khả kháng kèm ảnh.                 |
| `IN_PROGRESS`     | `Cancel`               | `CANCELLED`       | Manager            | Quản lý hủy việc đang làm dở kèm lý do.                          |
| `BLOCKED`         | `Resume`               | `IN_PROGRESS`     | Manager            | Sự cố đã được gỡ bỏ, cho nhân viên cũ làm tiếp.                  |
| `BLOCKED`         | `Reassign`             | `PENDING`         | Manager            | Gán sang nhân viên mới làm lại từ đầu.                           |
| `BLOCKED`         | `Cancel`               | `CANCELLED`       | Manager            | Hủy công việc bị sự cố không thể khắc phục.                      |
| `WAITING_REVIEW`  | `Approve`              | `COMPLETED`       | Manager            | Bằng chứng đạt chuẩn 100% $\to$ Ghi CareHistory.                 |
| `WAITING_REVIEW`  | `ApproveWithException` | `COMPLETED`       | Manager            | Nghiệm thu có ngoại lệ lưu vết $\to$ Ghi CareHistory.            |
| `WAITING_REVIEW`  | `RequestRework`        | `REWORK_REQUIRED` | Manager            | Chỉ định cụ thể mục bị từ chối kèm lý do.                        |
| `WAITING_REVIEW`  | `Cancel`               | `CANCELLED`       | Manager            | Quản lý từ chối hoàn toàn và hủy việc.                           |
| `REWORK_REQUIRED` | `Resubmit`             | `WAITING_REVIEW`  | Staff              | Sửa đúng mục yêu cầu và nộp lại gói bằng chứng mới.              |
| `REWORK_REQUIRED` | `Cancel`               | `CANCELLED`       | Manager            | Quản lý hủy việc đang trong diện sửa đổi.                        |
| `COMPLETED`       | _None_                 | _None_            | _None_             | **Trạng thái kết thúc (Terminal)**. Không thể chuyển trạng thái. |
| `CANCELLED`       | _None_                 | _None_            | _None_             | **Trạng thái kết thúc (Terminal)**. Không thể chuyển trạng thái. |

---

## 16. Bảng Phân loại Quy tắc Nghiệp vụ Chuẩn (Business Rule Catalog)

Phân loại rành mạch thành 6 nhóm danh mục, loại bỏ hoàn toàn các tuyên bố pháp lý hay hình sự hóa không căn cứ:

| Mã Quy tắc | Nội dung Quy tắc Nghiệp vụ                                                | Danh mục Phân loại        | Diễn giải Vận hành                                                           |
| :--------- | :------------------------------------------------------------------------ | :------------------------ | :--------------------------------------------------------------------------- |
| **BR-01**  | Staff không được tự phê duyệt nhiệm vụ của chính mình                     | **HARD DOMAIN INVARIANT** | Nguyên tắc phân tách trách nhiệm (Separation of Duties); bất biến vĩnh viễn. |
| **BR-02**  | Cây mục tiêu (`Task.treeId`) không được phép thay đổi khi làm việc        | **HARD DOMAIN INVARIANT** | Bất biến toàn vẹn tài sản; cấm tráo đổi cây mục tiêu ngoài thực địa.         |
| **BR-03**  | Tác giả bằng chứng lịch sử (`capturedByUserId`) không được viết đè        | **HARD DOMAIN INVARIANT** | Bất biến tính trung thực dữ liệu; bảo lưu dấu vết nhân thân kiểm toán.       |
| **BR-04**  | Nghiêm cấm ngụy tạo bằng chứng lịch sử không thể phục hồi                 | **HARD DOMAIN INVARIANT** | Bất biến đạo đức dữ liệu; cấm chụp ảnh giả để bù vào ảnh trước bị quên.      |
| **BR-05**  | 1 Nhiệm vụ gắn liền với đúng 1 Cây xanh cụ thể trong MVP                  | **MVP DOMAIN INVARIANT**  | Giữ chuỗi bằng chứng 1-1 tinh gọn cho giai đoạn khởi tạo nền tảng.           |
| **BR-06**  | Tạo nhiệm vụ bắt buộc phải gán sẵn một Nhân viên cụ thể                   | **MVP DOMAIN INVARIANT**  | Đảm bảo tính sẵn sàng thi công; không tạo task mồ côi (unassigned) ở MVP.    |
| **BR-07**  | Loại việc (`TaskType`) quy định cố định Hồ sơ bằng chứng (`ProofProfile`) | **MVP DOMAIN INVARIANT**  | Quản lý không được tùy tiện hạ cấp bằng chứng của từng task riêng lẻ.        |
| **BR-08**  | Quản lý thẩm định thủ công 100% nhiệm vụ đã nộp trong MVP                 | **MVP POLICY**            | Chính sách kiểm soát chất lượng tuyệt đối của giai đoạn đầu vận hành.        |
| **BR-09**  | Khoảng cách GPS mục tiêu tiêu chuẩn $\le 10$m                             | **MVP POLICY**            | Tiêu chuẩn đo lường vị trí thực địa ngoài trời.                              |
| **BR-10**  | Chỉ các nhiệm vụ `COMPLETED` mới được ghi vào `CareHistory`               | **MVP DOMAIN INVARIANT**  | Hồ sơ tài sản chỉ lưu trữ các hoạt động đã được nghiệm thu chính thức.       |
| **BR-11**  | Cờ cảnh báo ngoại lệ vị trí (`LOCATION_EXCEPTION`) và danh tính           | **SOFT CONTROL**          | Cảnh báo mềm giúp công việc không bị ách tắc nhưng vẫn lưu vết hậu kiểm.     |
| **BR-12**  | Kiểm tra chất lượng ảnh chụp trước khi bấm nộp bài                        | **OPERATIONAL GUIDANCE**  | Hướng dẫn công nhân nhằm giảm tỷ lệ bị Quản lý trả về làm lại.               |
| **BR-13**  | Nhân viên nên thử đo lại GPS trước khi kích hoạt ngoại lệ vị trí          | **OPERATIONAL GUIDANCE**  | Khuyến khích cải thiện độ chính xác tọa độ nếu do cảm biến chậm ổn định.     |

_(Các ràng buộc kỹ thuật di động như FlatList, SQLite, MMKV, React Navigation được chuyển về tài liệu kiến trúc, không đưa vào quy tắc nghiệp vụ kinh doanh)._

---

## 17. Sổ Đăng ký Quyết định Nghiệp vụ (Business Decision Register)

Toàn bộ 14 quyết định nghiệp vụ đã được đồng thuận theo định hướng của Product Owner:

| Mã             | Tên Quyết định Nghiệp vụ          | Tóm tắt Phương án Chuẩn hóa                                                                                                                                   | Trạng thái Phê duyệt                                                     |
| :------------- | :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------- |
| **BUS-DEC-01** | Hồ sơ Bằng chứng Ngữ nghĩa        | Áp dụng 3 Hồ sơ: `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`. Khóa chặt quan hệ TaskType $\to$ ProofProfile.                                          | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-02** | Định vị GPS & Ngoại lệ Vị trí     | Mục tiêu $\le 10$m; nếu lệch cho đo lại, không đạt thì chọn Ngoại lệ vị trí kèm cờ kiểm toán. Không dùng ngưỡng 25m.                                          | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-03** | Ngoại lệ Mã QR Hư hỏng            | Chụp ảnh tem hỏng + nhập mã đối chiếu; Cây mục tiêu **bất biến, không bao giờ được đổi**. Gắn cờ đối soát danh tính.                                          | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-04** | Sự kiện Bắt đầu Công việc         | Chỉ chuyển sang `IN_PROGRESS` khi bấm rõ ràng nút "Bắt đầu công việc". Các thao tác xem chi tiết/đo thử không đổi trạng thái.                                 | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-05** | Chính sách Thẩm định Quản lý      | Quản lý duyệt thủ công 100% nhiệm vụ đã nộp trong giai đoạn MVP.                                                                                              | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-06** | Sửa chữa có Trọng tâm             | Chỉ định rõ mục cần sửa; bảo toàn toàn bộ bằng chứng cũ đã đạt chuẩn; lưu vết lịch sử phiên bản (versioned).                                                  | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-07** | Xử lý Sai sót Lịch sử & Thẩm định | Đánh dấu `EVIDENCE_INTEGRITY_EXCEPTION`; cấm ngụy tạo ảnh; áp dụng 4 kết quả duyệt: `APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, `CANCEL`.          | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-08** | Báo cáo Sự cố Hiện trường         | Nút "Báo sự cố" (Lý do + Ảnh + Ghi chú) chuyển nhiệm vụ sang `BLOCKED` khi gặp chướng ngại bất khả kháng.                                                     | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-09** | Bản chất & Lối thoát BLOCKED      | `BLOCKED` là trạng thái chính thức, chỉ vào từ `IN_PROGRESS`. Có đúng 3 lối thoát: `RESUME`, `REASSIGN`, `CANCEL`.                                            | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-10** | Chính sách Hủy Nhiệm vụ           | Quản lý được hủy từ mọi trạng thái chưa kết thúc $\to$ `CANCELLED`. Bắt buộc lý do; không vào CareHistory.                                                    | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-11** | Ranh giới Phân công lại           | Đổi tự do ở `PENDING`/`BLOCKED`; cấm đổi trực tiếp ở `IN_PROGRESS` (phải qua BLOCKED); cấm tuyệt đối ở `WAITING_REVIEW`. Bảo lưu quyền tác giả bằng chứng cũ. | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-12** | Ranh giới Lịch sử Chăm sóc        | Chỉ các nhiệm vụ `COMPLETED` mới được ghi vào `CareHistory`. Nếu duyệt qua `APPROVE_WITH_EXCEPTION` thì ghi kèm tham chiếu ngoại lệ.                          | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-13** | Tách biệt Trạng thái Ngoại tuyến  | Tách riêng `TaskStatus` và `SyncStatus`. Nộp offline: client là `PENDING_SYNC`, server vẫn là `IN_PROGRESS` đến khi sync thành công mới là `WAITING_REVIEW`.  | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |
| **BUS-DEC-14** | Bất biến 1 Task = 1 Cây           | Duy trì bất biến 1 Task = 1 Tree cho giai đoạn MVP để giữ chuỗi minh chứng 1-1 tinh gọn, không phân tán trách nhiệm.                                          | `STATUS: OWNER-APPROVED DIRECTION — READY FOR CANONICAL SYNCHRONIZATION` |

---

## 18. BẢN ĐẶC TẢ NỀN TẢNG NGHIỆP VỤ MVP ĐƯỢC PHÊ DUYỆT (FINAL APPROVED MVP BUSINESS BASELINE)

Phần này đúc kết toàn bộ nền tảng vận hành chuẩn hóa làm đầu vào trực tiếp cho pha đồng bộ tài liệu chuẩn:

### 18.1. Ý tưởng sản phẩm cốt lõi (Core Product Intent)

Hệ thống điều phối bảo dưỡng cây xanh đô thị, kết nối Quản lý và Nhân viên hiện trường thông qua chuỗi bằng chứng xác thực địa điểm, danh tính cây, thao tác kỹ thuật và thẩm định chất lượng có lưu vết kiểm toán.

### 18.2. Các tác nhân tham gia (Actors)

- **Field Staff (Nhân viên hiện trường):** Nhận việc, bấm bắt đầu, xác thực hiện trường (QR + GPS), thao tác theo checklist, thu thập ảnh theo hồ sơ, báo sự cố nếu gặp trở ngại, nộp báo cáo duyệt và khắc phục mục làm lại có mục tiêu.
- **Operations Manager (Quản lý vận hành):** Tạo việc, chọn cây, chọn loại việc (hệ thống tự gán hồ sơ bằng chứng), gán thợ, giải quyết sự cố bị chặn (Resume/Reassign/Cancel), thẩm định hồ sơ (Approve / Request Rework / Approve With Exception / Cancel), hủy việc không còn giá trị.
- **Admin (Quản trị hệ thống):** _Out of Scope cho MVP_ (sử dụng seed script/cấu hình ban đầu).

### 18.3. Vòng đời Nhiệm vụ (Task Lifecycle)

Bao gồm đúng 7 trạng thái vận hành tất định:
`PENDING` $\to$ `IN_PROGRESS` $\to$ `WAITING_REVIEW` $\to$ `COMPLETED` (Terminal).
Các nhánh phụ: `BLOCKED` (tạm dừng từ In Progress), `REWORK_REQUIRED` (sửa có trọng tâm), `CANCELLED` (Terminal - hủy bỏ có lý do).

### 18.4. Hồ sơ Bằng chứng (Proof Profiles)

- `CHANGE_PROOF`: Cắt tỉa, Đốn hạ $\to$ Site Verification + Ảnh Trước + Checklist 100% + Ảnh Sau.
- `SERVICE_PROOF`: Tưới nước, Bón phân $\to$ Site Verification + Checklist 100% + 01 Ảnh Hoàn tất.
- `INSPECTION_PROOF`: Khảo sát sâu bệnh $\to$ Site Verification + Ghi nhận cấu trúc + Ảnh Hiện trạng.

### 18.5. Xác thực Hiện trường (Site Verification)

Gồm 2 tín hiệu độc lập: Quét mã QR (danh tính cây) và Định vị GPS (vị trí gốc cây). Thực hiện theo thứ tự linh hoạt; không làm đổi trạng thái Task; phải hoàn tất (hoặc có ngoại lệ được ghi nhận) trước khi được nộp bài.

### 18.6. Cơ chế Ngoại lệ Hiện trường (Field Exceptions)

- `LOCATION_EXCEPTION`: GPS lệch $> 10$m sau khi đo lại $\to$ Xác nhận vị trí hiện tại kèm lý do và cờ đối soát.
- `IDENTITY_EXCEPTION`: Tem QR hỏng/mất $\to$ Chụp ảnh tem hỏng + nhập mã đối chiếu. Cây mục tiêu bất biến.
- `EVIDENCE_INTEGRITY_EXCEPTION`: Thiếu bằng chứng lịch sử không thể tái tạo (quên ảnh trước) $\to$ Cấm ngụy tạo ảnh, ghi nhận sự cố để Quản lý thẩm định.

### 18.7. Cơ chế Nộp bài (Submission)

Nhân viên soát lại bằng chứng và bấm "Gửi duyệt". Nếu mất mạng, lưu Outbox cục bộ (`PENDING_SYNC`), nhiệm vụ trên máy chủ vẫn giữ nguyên `IN_PROGRESS` cho đến khi tải lên thành công mới chính thức chuyển `WAITING_REVIEW`.

### 18.8. Thẩm định của Quản lý (Manager Review)

Quản lý xem xét 100% báo cáo, đối soát ảnh, checklist và các cờ cảnh báo ngoại lệ. Đưa ra 1 trong 4 quyết định: `APPROVE`, `REQUEST_REWORK`, `APPROVE_WITH_EXCEPTION`, hoặc `CANCEL`.

### 18.9. Cơ chế Làm lại (Rework)

Chỉ định đích danh mục cần sửa; bảo toàn toàn bộ bằng chứng cũ đã đạt chuẩn; lưu vết lịch sử phiên bản (versioned evidence).

### 18.10. Cơ chế Hủy việc (Cancellation)

Chỉ Quản lý được hủy từ các trạng thái chưa kết thúc (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`) $\to$ `CANCELLED`. Bắt buộc lý do; không bao giờ vào `CareHistory`.

### 18.11. Cơ chế Phân công lại (Reassignment)

Được đổi người tự do ở `PENDING` và `BLOCKED`. Cấm đổi trực tiếp ở `IN_PROGRESS` (phải đi qua BLOCKED). Cấm tuyệt đối ở `WAITING_REVIEW`. Bằng chứng cũ của người đi trước luôn được lưu vết quyền tác giả lịch sử.

### 18.12. Cơ chế Vận hành Ngoại tuyến (Offline Semantics)

Phân tách rạch ròi `TaskStatus` khỏi `SyncStatus`. Không tạo trạng thái offline giả tạo trên máy chủ.

### 18.13. Lịch sử Chăm sóc Cây (Care History)

Chỉ các nhiệm vụ `COMPLETED` mới tạo bản ghi trong `CareHistory`. Nếu duyệt qua `APPROVE_WITH_EXCEPTION`, bản ghi lưu kèm tham chiếu ngoại lệ phục vụ kiểm toán tài sản.

### 18.14. Các Bất biến Nghiệp vụ (Business Invariants)

- Phân tách vai trò tuyệt đối: Nhân viên không tự duyệt việc của mình.
- Bất biến mục tiêu: 1 Task = 1 Cây; không được đổi cây mục tiêu giữa chừng.
- Toàn vẹn dữ liệu: Bằng chứng lịch sử không bị viết đè tác giả; không ngụy tạo ảnh; hồ sơ đã nộp không bị đổi người.

---

## 19. Tác động Dự kiến đến Giao diện & Hợp đồng (Future Migration Map)

_(Phục vụ lập kế hoạch cho các giai đoạn tiếp theo; mã nguồn và hợp đồng vẫn được giữ nguyên READ-ONLY trong đợt này)_

- **Hợp đồng `@novyx/contracts` tương lai:**
  - Cập nhật `TaskTypeEnum` và thêm `ProofProfileEnum` (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`).
  - Thêm trạng thái `BLOCKED` và `CANCELLED` vào `TaskStatusEnum`.
  - Bổ sung cấu trúc `FieldIssueReport`, `LocationExceptionDetails`, `IdentityExceptionDetails`.
  - Mở rộng `ReviewDecisionDto` hỗ trợ 4 lựa chọn kết luận (bao gồm `APPROVE_WITH_EXCEPTION` và chi tiết `ReworkSpecification`).
- **Ứng dụng di động `@novyx/mobile` tương lai:**
  - `StaffWork`: Nút bấm rõ ràng "Bắt đầu công việc"; hiển thị huy hiệu `BLOCKED` khi có sự cố.
  - `StaffProofFlow`: Render màn hình linh hoạt theo `ProofProfile` được giao; chế độ Rework chỉ hiển thị các mục bị yêu cầu sửa; nút "Báo sự cố hiện trường" thường trực.
  - `ManagerReview`: Hiển thị rõ cờ cảnh báo GPS/QR; form yêu cầu Rework có checkbox chọn mục cụ thể; nút "Nghiệm thu kèm ngoại lệ" kèm trường lý do bắt buộc.
  - `ManagerCreateTask`: Loại việc tự động gắn kèm mẫu checklist và hồ sơ bằng chứng.

---

## 20. Tuyên bố Giai đoạn Kế tiếp (Next Phase Declaration)

```text
====================================================================================================
NEXT PHASE: CANONICAL BUSINESS BASELINE SYNCHRONIZATION
====================================================================================================

Mục tiêu giai đoạn kế tiếp:
Đồng bộ toàn bộ Bản đặc tả nền tảng nghiệp vụ MVP đã được phê duyệt ở trên vào bộ tài liệu chuẩn tắc:
  - docs/PRODUCT.md
  - docs/DOMAIN.md
  - docs/WORKFLOWS.md
  - docs/ACCESS-CONTROL.md
  - docs/REQUIREMENTS-TRACEABILITY.md
  - Cập nhật các sơ đồ kiến trúc chuẩn tắc tương ứng trong docs/diagrams/

Sau đó tái đánh giá:
  - docs/ARCHITECTURE.md
  - docs/NFR.md
đối chiếu với nền tảng nghiệp vụ chuẩn hóa mới trước khi lập kế hoạch triển khai mã nguồn.
====================================================================================================
```
