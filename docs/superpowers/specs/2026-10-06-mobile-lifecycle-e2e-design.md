# Báo Cáo Đánh Giá & Kiến Trúc Lại Mobile E2E Lifecycle Testing Harness
## Phân Tích Phê Phán Script Hiện Tại & Thiết Kế Kiểm Thử Quy Trình Vận Hành Khép Kín (Closed-Loop Field Operations)

> **Phương pháp luận**: Superpowers Brainstorming & Karpathy Guidelines  
> **Dự án**: NOVYX GreenOps Mobile App (Expo SDK 57 / React Native / Samsung Galaxy Note 20 Ultra)  
> **Tài liệu tham chiếu**: `AGENTS.md`, `.agents/memory/UI_UX_MEMORY.md`, `docs/MOBILE_UI_RULES.md`, `scripts/mobile-lifecycle-e2e.cjs`

---

## 1. Giải Phẫu Khiếm Khuyết Của `scripts/mobile-lifecycle-e2e.cjs` Hiện Tại

Qua khảo sát toàn bộ mã nguồn của file [`scripts/mobile-lifecycle-e2e.cjs`](file:///d:/ki7/EXE/tree/scripts/mobile-lifecycle-e2e.cjs) (512 dòng) và nhật ký thực thi trên thiết bị thật, chúng tôi nhận thấy script hiện tại mắc phải **4 sai lầm mang tính nguyên tắc**:

### 1.1. Ảo ảnh kiểm thử (Testing Theater) & Vòng lặp Login/Logout vô nghĩa
* **Thực trạng**: Script chạy theo trình tự:
  1. Login Manager $\to$ Dashboard $\to$ Giao việc $\to$ Chụp ảnh $\to$ Logout.
  2. Login Staff $\to$ Staff Home $\to$ Danh sách việc $\to$ Bấm mở Task Detail $\to$ Bấm Back $\to$ Logout.
  3. Login Manager $\to$ Hàng chờ duyệt $\to$ Bấm mở Review Detail $\to$ Bấm Back $\to$ Hết.
* **Hậu quả**: Script chỉ kiểm tra được việc "app không bị crash khi chuyển tab và đăng nhập lại". Đây là kiểm thử giao diện tĩnh (static smoke test), hoàn toàn **không phản ánh bất kỳ nghiệp vụ thực tế nào**. Ngoài đời thực, nhân viên không bao giờ đăng nhập vào, nhìn danh sách việc 1 giây rồi đăng xuất!

### 1.2. Đứt gãy chuỗi giá trị (Broken Value Chain) & Không có tính liên hoàn
* **Thực trạng**: 
  - Nhiệm vụ do Manager khởi tạo ở Bước 2.2 hoàn toàn **không được Staff tiếp nhận hay xử lý** ở Bước 2.5. Thay vào đó, Staff chỉ bấm bừa vào tọa độ `(540, 500)` để mở một task bất kỳ có sẵn trong danh sách!
  - Card mà Manager mở ra ở Bước 2.7 cũng chỉ là một task mẫu có sẵn từ trước, không hề liên quan đến công việc của Staff vừa làm.
* **Hậu quả**: Không có bất kỳ luồng dữ liệu nào chảy qua hệ thống (No data flow / No state transition). Hệ thống không được kiểm thử tính toàn vẹn trạng thái: `PENDING` $\to$ `IN_PROGRESS` $\to$ `WAITING_REVIEW` $\to$ `COMPLETED` / `REWORK_REQUIRED`.

### 1.3. Ác cảm "Ép buộc tạo task" (Forced Synthetic Task Creation)
* **Thực trạng**: Mỗi lần chạy test, script lại gọi API và thao tác UI để tạo mới một công việc mang tên *"Bao duong cay E2E"*.
* **Hậu quả**:
  - Gây rác cơ sở dữ liệu với hàng chục task trùng lặp không được giải quyết.
  - Chiếm dụng tài nguyên test vào việc gõ chữ, chọn dải ngày (vốn đã được kiểm thử ổn định), trong khi **hoàn toàn bỏ qua các tính năng tác nghiệp thực thụ** đang cần được kiểm định.

### 1.4. Bỏ sót 80% tính năng cốt lõi ngoài hiện trường
Script hiện tại hoàn toàn đứng ngoài cửa các tính năng quan trọng nhất của một ứng dụng quản lý cây xanh đô thị:
* Không có xác thực GPS hiện trường.
* Không có quét mã QR thân cây.
* Không có chụp ảnh đối chứng Trước/Sau thi công.
* Không có đánh dấu checklist an toàn lao động / kỹ thuật.
* Không có quyết định phê duyệt hoặc trả về làm lại của Quản lý.
* Không có xử lý luồng việc bị trả về (Rework Loop).
* Không có quét QR tra cứu nhanh bằng nút FAB trung tâm.
* Không có tra cứu danh mục cây & lịch sử chăm sóc.
* Không có trung tâm thông báo điều phối.

---

## 2. Ma Trận Tính Năng Đang Có Trên App Chưa Được Kiểm Thử

Hệ thống NOVYX GreenOps mobile hiện đã xây dựng đầy đủ các module nghiệp vụ hoàn chỉnh nhưng chưa từng được đưa vào kịch bản E2E. Dưới đây là ma trận phân rã chi tiết:

| Module / Màn hình | Tính năng nghiệp vụ hiện có | Trạng thái kiểm thử hiện tại | Rủi ro UI/UX chưa nhận diện |
|---|---|---|---|
| **1. Tác Nghiệp Hiện Trường (`StaffProofFlow.tsx`)** | **Quy trình 5 chứng thực**: <br>• Check-in GPS bán kính $\le 50\text{m}$<br>• Quét QR định danh gốc cây<br>• Chụp ảnh Trước thi công<br>• Tích chọn Checklist kỹ thuật<br>• Chụp ảnh Sau thi công<br>• Xem tổng hợp & Nộp nghiệm thu | ❌ **CHƯA TEST** (0%) | • Nút chụp ảnh / Viewfinder camera có bị vỡ giao diện trên Android không?<br>• Nút xác nhận GPS có phản hồi rõ ràng khi ngoài bán kính không?<br>• Checklist có bị chạm nhầm (touch target $<44\text{px}$) không?<br>• Bố cục tổng hợp biên bản có bị che khuất nút Nộp không? |
| **2. Báo Cáo Sự Cố (`ReportFieldIssue`)** | Nhân viên báo cáo cây gặp nguy hiểm (sâu bệnh nặng, vướng điện cao thế, gãy đổ) $\to$ Đưa task vào trạng thái `BLOCKED` kèm lý do. | ❌ **CHƯA TEST** (0%) | • Form nhập lý do sự cố có bị bàn phím che khuất không?<br>• Badge trạng thái `Bị chặn` hiển thị màu sắc và độ tương phản thế nào? |
| **3. Nghiệm Thu & Quyết Định (`ManagerReviewDetail.tsx`)** | **Quyết định của Quản lý**: <br>• Đối chiếu song song ảnh Trước vs Sau (`PhotoPair`)<br>• Kiểm tra GPS, QR, Checklist<br>• **Quyết định 1**: Phê duyệt hoàn thành (`APPROVE`) $\to$ status `COMPLETED`<br>• **Quyết định 2**: Yêu cầu làm lại (`REQUEST_REWORK`) kèm lý do preset | ❌ **CHƯA TEST** (Chỉ mở xem rồi bấm Back) | • Lưới so sánh 2 ảnh Trước/Sau có bị méo tỷ lệ (aspect ratio) không?<br>• Preset lý do làm lại có dễ đọc, dễ chọn không?<br>• Nút "Xác nhận quyết định" có hiển thị loading state mượt mà không? |
| **4. Luồng Làm Lại (`Rework Loop`)** | Thợ nhận việc bị trả về $\to$ Xem chính xác hạng mục bị từ chối (ví dụ: "Ảnh sau chưa rõ") $\to$ Chụp lại đúng ảnh đó $\to$ Nộp lại (`ResubmitRework`) $\to$ Quản lý duyệt lại lần 2. | ❌ **CHƯA TEST** (0%) | • Thông báo trả việc có nêu rõ lý do không?<br>• Thợ có bị bắt làm lại toàn bộ từ đầu hay chỉ làm lại bước bị yêu cầu?<br>• Trạng thái `Cần làm lại` trên danh sách có nổi bật không? |
| **5. Nút Quét QR Toàn Cục (FAB Center Notched Nav)** | Nhấn nút quét trung tâm trên thanh Bottom Bar để tra cứu tức thì thông tin cây, loài cây, đường kính, lịch sử chăm sóc (`CareHistory`). | ❌ **CHƯA TEST** (0%) | • Nút FAB có bị giật khi chuyển cảnh không?<br>• Thẻ kết quả tra cứu cây (`TreeLookupResult`) có hiển thị đầy đủ thông số không?<br>• Nút đóng / quay lại có thuận tiện bằng 1 tay không? |
| **6. Danh Mục Hồ Sơ Cây (`StaffTrees` / `ManagerTrees`)** | Tra cứu danh sách cây theo mã/tuyến đường; lọc theo tình trạng sức khỏe: Tất cả, Khỏe mạnh, Cần chăm sóc, Cảnh báo nguy hiểm; xem Lịch sử chăm sóc (`CareHistory`). | ❌ **CHƯA TEST** (0%) | • Thanh tìm kiếm có hỗ trợ xóa nhanh không?<br>• Các chip lọc sức khỏe có bị tràn viền màn hình không?<br>• Tốc độ cuộn danh sách (FlatList virtualization) có mượt mà không? |
| **7. Trung Tâm Thông Báo (`StaffNotifications`)** | Xem cập nhật phân công việc, thông báo phê duyệt/làm lại; lọc Chưa đọc / Tất cả; Đánh dấu đã đọc; Bấm vào thông báo nhảy thẳng đến Task tương ứng. | ❌ **CHƯA TEST** (0%) | • Badge số lượng thông báo chưa đọc có chính xác không?<br>• Thao tác bấm thông báo có mở đúng màn hình chi tiết việc không? |
| **8. Cơ Chế Ngoại Tuyến & Đồng Bộ Outbox** | Khi mất sóng ngoài công viên: lưu biên bản vào Outbox SQLite cục bộ, hiển thị banner ngoại tuyến, tự động đồng bộ khi có mạng lại. | ❌ **CHƯA TEST** (0%) | • Trạng thái badge Outbox Pending có hiển thị rõ không?<br>• Dữ liệu có bị mất mát khi chuyển mạng đột ngột không? |

---

## 3. Nhận Diện Các Rủi Ro UI/UX Tiềm Ẩn Ở Những Tính Năng Này

Áp dụng bộ tiêu chuẩn trong `.agents/memory/UI_UX_MEMORY.md` và `docs/MOBILE_UI_RULES.md`, các vấn đề UI/UX tiềm ẩn có nguy cơ cao xuất hiện khi chạy thực địa gồm có:

1. **Rủi ro bố cục đối chứng ảnh (`PhotoPair` trong Review Detail)**:
   - Hai ảnh chụp hiện trường thường có tỷ lệ khung hình khác nhau (dọc vs ngang). Nếu CSS dùng `aspectRatio: 1` hoặc `resizeMode: cover` không đúng cách, ảnh Trước và ảnh Sau sẽ bị cắt mất chi tiết quan trọng (ví dụ: tán cây bị cúp đỉnh, gốc cây bị mất phần rễ).
2. **Rủi ro Touch Targets ngoài hiện trường (`StaffProofFlow`)**:
   - Khi nhân viên mang găng tay bảo hộ hoặc thao tác ngoài nắng, các nút bấm chọn Checklist, nút chụp ảnh, nút xác thực GPS phải có chiều cao tối thiểu $48\text{px}$ đến $52\text{px}$ và vùng đệm (padding) đủ lớn. Nếu checkbox quá nhỏ ($<40\text{px}$), thao tác bấm sẽ rất dễ trượt.
3. **Rủi ro phân cấp thị giác giữa Duyệt Đạt và Yêu cầu Làm lại (`ManagerReviewDetail`)**:
   - Nút Duyệt hoàn thành (`APPROVE` - Tone xanh lá) và Yêu cầu làm lại (`REQUEST_REWORK` - Tone hổ phách/cam) không được đặt ngang hàng bằng phẳng dễ gây bấm nhầm. Hành động Duyệt đạt là hành động tích cực chính (Primary), trong khi Làm lại là hành động điều chỉnh cần xác nhận có điều kiện.
4. **Rủi ro đồng bộ ngôn ngữ tiếng Việt (UI-002 Invariant)**:
   - Các từ khóa như `CHANGE_PROOF`, `PENDING`, `IN_PROGRESS`, `REWORK_REQUIRED`, `BLOCKED`, `GPS 0.0m` không được phép xuất hiện trần trụi trước mắt người dùng. Toàn bộ phải được địa phương hóa sang thuật ngữ quản lý công viên cây xanh chuẩn mực: *"Chờ thực hiện"*, *"Đang làm"*, *"Cần làm lại"*, *"Tạm dừng do sự cố"*, *"Hoàn thành"*.
5. **Rủi ro điều hướng bàn phím ảo (IME) che khuất Form nhập liệu (UI-028)**:
   - Trong màn hình nhập lý do từ chối nghiệm thu hoặc màn hình báo cáo sự cố hiện trường, bàn phím Android xuất hiện có thể đẩy nút bấm "Gửi báo cáo" ra khỏi vùng nhìn thấy nếu không có `KeyboardAvoidingView` hoặc cơ chế tự động cuộn (Auto-scroll to focused input).

---

## 4. Đề Xuất 3 Phương Án Kiến Trúc Cho E2E Lifecycle Testing Harness Mới

Để giải quyết triệt để yêu cầu: **Kiểm thử quy trình luồng hoạt động E2E thực tế, kiểm thử các tính năng đang có trên app, phát hiện lỗi UI/UX, và không ép buộc tạo task vô nghĩa**, chúng tôi đề xuất 3 phương án kiến trúc:

### 🏆 Phương Án 1: Bộ Kịch Bản Vận Hành Theo Chu Trình Nghiệp Vụ Thực Tế (Stateful Closed-Loop Scenarios) — *KHUYẾN NGHỊ*

Thay vì chạy một script tuyến tính cứng nhắc, kịch bản được chia thành các **Scenario khép kín** mô phỏng chính xác ca làm việc hàng ngày của đô thị:

* **Scenario A: Vòng đời tác nghiệp hoàn chỉnh (Standard Happy Path - Closed-Loop)**:
  1. *Lựa chọn công việc*: Script tự động tìm kiếm một công việc đang ở trạng thái `PENDING` hoặc `IN_PROGRESS` đã được giao cho Thợ (không cần tạo mới vô nghĩa).
  2. *Thợ thực hiện tại hiện trường*:
     - Mở chi tiết việc $\to$ Bấm "Bắt đầu làm việc".
     - Xác thực vị trí GPS tại gốc cây.
     - Xác thực mã QR cây bằng camera / giả lập quét chuẩn.
     - Chụp ảnh Trước thi công $\to$ Xem preview.
     - Tích chọn đầy đủ checklist hạng mục kỹ thuật.
     - Chụp ảnh Sau thi công $\to$ Xem preview đối chứng.
     - Xem lại toàn bộ hồ sơ 5/5 chứng thực và bấm **"Nộp nghiệm thu"**.
  3. *Quản lý nghiệm thu*:
     - Quản lý mở hàng chờ Duyệt $\to$ Tìm đúng công việc vừa nộp.
     - So sánh ảnh Trước/Sau $\to$ Kiểm tra GPS/QR/Checklist.
     - Bấm **"Duyệt nghiệm thu"** $\to$ Công việc chuyển thành `COMPLETED`.
  4. *Kiểm chứng kết quả*:
     - Kiểm tra lịch sử chăm sóc cây (`CareHistory`) đã được ghi nhận bản ghi mới hay chưa.
     - Toàn bộ ảnh chụp màn hình được chụp ở từng thời điểm chuyển dịch trạng thái để đối chứng UI/UX.

* **Scenario B: Quy trình xử lý lỗi & Làm lại hiện trường (Field Exception & Rework Loop)**:
  1. Quản lý mở một báo cáo chờ duyệt $\to$ Chọn **"Yêu cầu làm lại"** kèm lý do: *"Ảnh sau chưa đủ rõ"*.
  2. Hệ thống gửi thông báo $\to$ Trạng thái chuyển thành `REWORK_REQUIRED`.
  3. Thợ mở Trung tâm thông báo $\to$ Chạm vào thông báo để nhảy thẳng tới công việc bị trả về.
  4. Thợ xem lý do từ chối $\to$ Thực hiện chụp lại đúng bức ảnh Sau $\to$ Bấm **"Nộp lại bằng chứng"**.
  5. Quản lý nhận lại báo cáo và bấm Phê duyệt hoàn tất.

* **Scenario C: Kiểm thử các tính năng độc lập & Audit UI/UX (Global Capabilities & UI Audit)**:
  1. *FAB Scanner*: Nhấn nút FAB quét QR ở tâm thanh điều hướng $\to$ Quét thử mã cây $\to$ Kiểm tra bảng thông tin cây và lịch sử chăm sóc.
  2. *Hồ sơ cây (`StaffTrees` / `ManagerTrees`)*: Thao tác tìm kiếm tên đường, bấm các chip lọc sức khỏe (Khỏe mạnh / Cần chăm sóc) $\to$ Kiểm tra hiển thị thẻ cây.
  3. *Trung tâm thông báo*: Thao tác lọc Chưa đọc / Tất cả $\to$ Bấm "Đánh dấu đã đọc".
  4. *Báo cáo sự cố*: Thử nghiệm luồng Thợ bấm "Báo cáo sự cố hiện trường" $\to$ Task chuyển thành `BLOCKED`.

* **Ưu điểm**:
  - Phản ánh đúng 100% nghiệp vụ thực tế của công nhân cây xanh và đội ngũ quản lý.
  - Tận dụng dữ liệu hiện có trong DB, không làm rác database.
  - Kiểm thử sâu toàn bộ các màn hình phức tạp nhất (`StaffProofFlow`, `ManagerReviewDetail`, `TreeSurfaces`, `Notifications`).
  - Dễ dàng chạy từng Scenario riêng lẻ khi cần debug (`--scenario=happy-path`, `--scenario=rework`, `--scenario=features`).

---

### Phương Án 2: Chuỗi Kiểm Thử Liền Mạch Một Lượt (Unified Single-Pass Pipeline)
Gộp toàn bộ các bước của Scenario A, B, C vào một chuỗi chạy duy nhất từ đầu đến cuối trong một lệnh chạy.
* **Ưu điểm**: Chạy một lần là quét qua toàn bộ app.
* **Nhược điểm**: Thời gian chạy rất dài (khoảng 3-5 phút); nếu một tương tác nhỏ bị lệch tọa độ ở giữa chừng thì toàn bộ các bước kiểm thử phía sau sẽ bị hủy bỏ, rất khó cô lập lỗi UI/UX.

---

### Phương Án 3: Kiểm Thử Theo Từng Màn Hình Riêng Biệt (Component/Screen Isolation Driver)
Viết script điều hướng trực tiếp bằng deep link hoặc state injection để nhảy vào từng màn hình riêng lẻ và chụp ảnh kiểm thử UI/UX.
* **Ưu điểm**: Nhanh, độc lập, không phụ thuộc vào trạng thái dữ liệu trước đó.
* **Nhược điểm**: Không kiểm thử được tính liên tục của luồng nghiệp vụ E2E và tính đồng bộ giữa 2 vai trò Staff và Manager.

---

## 5. Kế Hoạch Triển Khai Kiến Trúc E2E Đề Xuất (Theo Phương Án 1)

Nếu người dùng đồng ý với Phương án 1, chúng tôi sẽ cấu trúc lại [`scripts/mobile-lifecycle-e2e.cjs`](file:///d:/ki7/EXE/tree/scripts/mobile-lifecycle-e2e.cjs) với các khối kiến trúc sau:

1. **Khối Điều Phối Kịch Bản (Scenario Runner Engine)**:
   - Hỗ trợ chạy toàn bộ hoặc chạy riêng từng kịch bản qua tham số:
     - `node scripts/mobile-lifecycle-e2e.cjs --scenario=all`
     - `node scripts/mobile-lifecycle-e2e.cjs --scenario=happy-path`
     - `node scripts/mobile-lifecycle-e2e.cjs --scenario=rework`
     - `node scripts/mobile-lifecycle-e2e.cjs --scenario=features`
2. **Khối Trợ Lý Hiện Trường Thông Minh (Field Proof Driver)**:
   - Tự động hóa các thao tác thực địa trong `StaffProofFlow`: Xác thực GPS, mô phỏng quét QR cây, chụp ảnh bằng chứng Before/After, tích chọn toàn bộ Checklist, và bấm Nộp nghiệm thu.
3. **Khối Quyết Định Nghiệm Thu (Review Decision Driver)**:
   - Tự động hóa thao tác so sánh ảnh Before/After và thực hiện quyết định nghiệm thu thực tế: Phê duyệt đạt hoặc Yêu cầu làm lại kèm preset lý do.
4. **Khối Kiểm Thử Tính Năng Nền Tảng (Platform Features Driver)**:
   - Kiểm thử nút FAB Scanner trung tâm, kiểm thử bộ lọc hồ sơ cây xanh, kiểm thử danh mục thông báo và đánh dấu đã đọc.
5. **Khối Chụp Bằng Chứng & Báo Cáo Sai Lệch UI/UX (UI/UX Anomaly Detector)**:
   - Chụp ảnh sắc nét tại mọi điểm biến thiên trạng thái (milestone screenshots) và lưu vào `tmp/mobile-smoke/`.
   - Phân tích và đối chiếu kích thước, vị trí các nút bấm, sự tương phản màu sắc và tính toàn vẹn của ngôn ngữ tiếng Việt.
