# NOVYX GreenOps — Non-Functional Requirements & Resilience Architecture

Tài liệu này là chuẩn mực duy nhất định nghĩa **CÁC YÊU CẦU PHI CHỨC NĂNG (Non-Functional Requirements - NFR)**, các kịch bản thuộc tính chất lượng có thể đo lường (Quality Attribute Scenarios), mô hình xử lý lỗi & phục hồi (Error & Recovery Model) và mô hình hoạt động ngoại tuyến (Offline Resilience).

---

## 1. Kịch bản thuộc tính chất lượng định lượng (Quality Attribute Scenarios)

Hệ thống loại bỏ hoàn toàn các tuyên bố chung chung (như "ứng dụng phải mượt mà"). Mọi yêu cầu chất lượng bắt buộc phải tuân theo cấu trúc 9 thành phần có thể kiểm chứng bằng thực nghiệm:

---

### QAS-PERF-01: Hiệu năng hiển thị danh sách lớn ngoài thực địa

- **ID:** `QAS-PERF-01`
- **Thuộc tính chất lượng:** **Performance / UI Responsiveness**
- **Kịch bản:** Nhân viên hoặc Quản lý mở danh sách nhiệm vụ hoặc danh mục cây chứa từ 200 đến 1.000 mục trên thiết bị Android phổ thông (RAM 3GB - 4GB).
- **Kích hoạt (Trigger):** Người dùng cuộn nhanh (Fling scroll) hoặc nhập từ khóa tìm kiếm.
- **Ngữ cảnh (Context):** Thiết bị đang chạy ngoài trời dưới nhiệt độ cao, pin còn dưới 20%.
- **Phản ứng kỳ vọng:** Giao diện duy trì tốc độ khung hình ổn định, không bị đơ giật; bộ nhớ RAM không tăng đột biến dẫn đến ứng dụng bị hệ điều hành tắt ngầm (OOM Crash).
- **Thước đo / Chấp thuận:**
  - Danh sách bắt buộc sử dụng cơ chế ảo hóa danh sách (`FlatList` / `FlashList`) với `windowSize <= 5` và định danh khóa ổn định (`keyExtractor={(item) => item.id}`).
  - Tỷ lệ khung hình rơi (Dropped frames) $< 5\%$; thời gian phản hồi khung hình $\le 16.6\text{ms}$ (60 FPS).
  - Nghiêm cấm sử dụng `ScrollView` bọc toàn bộ danh sách kết hợp hàm `map()`.
- **Bằng chứng kiểm chứng:** Profiling qua React Native DevTools / Systrace trên máy ảo hoặc thiết bị thật; báo cáo không còn cảnh báo bộ nhớ.
- **Trạng thái MVP:** **MUST HAVE**

---

### QAS-OFFLINE-01: Mất kết nối mạng giữa chu trình thu thập bằng chứng

- **ID:** `QAS-OFFLINE-01`
- **Thuộc tính chất lượng:** **Offline Resilience / Zero Data Loss**
- **Kịch bản:** Nhân viên đang thực hiện dở dang bước Chụp ảnh trước hoặc Checklist thì thiết bị mất sóng 3G/4G hoàn toàn (vào vùng mù viễn thông).
- **Kích hoạt (Trigger):** Rớt mạng đột ngột khi đang tương tác tại hiện trường.
- **Ngữ cảnh (Context):** Nhiệm vụ đã có GPS và QR hợp lệ; ảnh chụp vừa lưu vào bộ nhớ tạm của máy.
- **Phản ứng kỳ vọng:**
  - Ứng dụng không bật popup lỗi chặn màn hình; không chuyển hướng người dùng về màn hình đăng nhập.
  - Hiển thị huy hiệu nhận diện: `Ngoại tuyến (Dữ liệu cục bộ)` màu hổ phách (Amber).
  - Nhân viên tiếp tục hoàn thành các mục checklist và chụp ảnh sau bình thường.
  - Khi bấm "Gửi duyệt", báo cáo được đóng gói và đưa vào Hàng đợi gửi (Outbox) để tự động gửi lại khi có mạng.
- **Thước đo / Chấp thuận:**
  - $0\%$ dữ liệu bằng chứng bị mất khi rớt mạng.
  - Toàn bộ 5 chốt bằng chứng vẫn được ghi nhận đầy đủ với timestamp cục bộ chính xác.
- **Bằng chứng kiểm chứng:** Kiểm thử ngắt mạng (Airplane mode test) xuyên suốt 5 bước proof trên máy thật; khôi phục mạng và kiểm tra dữ liệu nhận được trên server.
- **Trạng thái MVP:** **MUST HAVE**

---

### QAS-OFFLINE-02: Ứng dụng bị hệ điều hành tắt ngầm khi đang mở Camera

- **ID:** `QAS-OFFLINE-02`
- **Thuộc tính chất lượng:** **Fault Tolerance / State Recoverability**
- **Kịch bản:** Khi nhân viên bật Camera để chụp ảnh Sau, hệ điều hành Android giải phóng RAM bằng cách tắt ngầm (OS Kill) tiến trình chính của ứng dụng.
- **Kích hoạt (Trigger):** Ứng dụng bị tắt cưỡng bức trong lúc tác vụ đang dang dở.
- **Ngữ cảnh (Context):** Nhân viên vừa hoàn thành GPS, QR, ảnh Trước và Checklist.
- **Phản ứng kỳ vọng:** Khi nhân viên mở lại ứng dụng, phiên đăng nhập được tự động khôi phục từ lưu trữ bền vững (Durable Store); nhiệm vụ đang làm dở được tự động mở lại với đầy đủ bằng chứng đã thu thập trước thời điểm bị tắt.
- **Thước đo / Chấp thuận:** Nhân viên không phải đi lại từ đầu các bước GPS, QR hay chụp lại ảnh trước; thời gian phục hồi về đúng trạng thái trước khi tắt $\le 2$ giây.
- **Bằng chứng kiểm chứng:** Thử nghiệm bật chế độ "Don't keep activities" trên Android Developer Options và kiểm tra độ bền dữ liệu.
- **Trạng thái MVP:** **MUST HAVE**

---

### QAS-A11Y-01: Tương tác ngoài trời nắng chói & Ngôn ngữ tiếng Việt có dấu

- **ID:** `QAS-A11Y-01`
- **Thuộc tính chất lượng:** **Usability / Accessibility / Outdoor Readability**
- **Kịch bản:** Nhân viên thao tác dưới ánh nắng mặt trời trực tiếp gay gắt, một tay cầm máy, một tay cầm dụng cụ chăm sóc cây.
- **Kích hoạt (Trigger):** Thao tác bấm nút, đọc văn bản hướng dẫn và thông số sai lệch GPS.
- **Ngữ cảnh (Context):** Màn hình bị chói lóa; văn bản tiếng Việt dài với nhiều dấu thanh.
- **Phản ứng kỳ vọng:**
  - Độ tương phản màu văn bản đạt chuẩn WCAG AA ($\ge 4.5:1$ đối với văn bản thường, $\ge 3:1$ đối với chữ lớn).
  - Vùng chạm (Touch Target) của mọi nút thao tác chính đạt tối thiểu $48 \times 48\text{px}$ (khuyến nghị $48 - 52\text{px}$ chiều cao).
  - Không có hiện tượng cắt cụt chữ tiếng Việt (No ugly text truncation) làm mất nghĩa từ vựng.
- **Thước đo / Chấp thuận:** Toàn bộ bảng màu tuân thủ nghiêm ngặt `DESIGN.md` (nền `snowWhite`, chữ `forestDepths`, nút bấm `forestDepths` hoặc `limePulse` tương phản cao).
- **Bằng chứng kiểm chứng:** Kiểm toán trực quan ngoài trời nắng thực tế và đo tỷ lệ tương phản bằng công cụ Accessibility Inspector.
- **Trạng thái MVP:** **MUST HAVE**

---

### QAS-SEC-01: Hết hạn phiên làm việc không làm mất dữ liệu nhập dở

- **ID:** `QAS-SEC-01`
- **Thuộc tính chất lượng:** **Security & Data Integrity**
- **Kịch bản:** Access Token của nhân viên hết hạn trong lúc nhân viên đang viết ghi chú hiện trường dài.
- **Kích hoạt (Trigger):** Server trả về mã lỗi `401 UNAUTHENTICATED`.
- **Ngữ cảnh (Context):** Nhân viên đang ở màn hình Review chuẩn bị nộp báo cáo.
- **Phản ứng kỳ vọng:** Ứng dụng tự động sử dụng Refresh Token để lấy Access Token mới trong im lặng (Silent Token Refresh); nếu Refresh Token cũng hết hạn, ứng dụng lưu bản nháp form vào local storage trước khi điều hướng về màn hình đăng nhập.
- **Thước đo / Chấp thuận:** Người dùng không bị mất trắng đoạn ghi chú vừa nhập sau khi đăng nhập lại.
- **Bằng chứng kiểm chứng:** Giả lập token hết hạn trong network interceptor và kiểm tra form draft tồn lưu.
- **Trạng thái MVP:** **MUST HAVE**

---

## 2. Mô hình xử lý lỗi và Phục hồi (Error & Recovery Model)

Mọi mã lỗi phát sinh trong hệ thống phải có ý nghĩa trực quan đối với người dùng cuối, đồng thời cung cấp lộ trình khắc phục rõ ràng (Actionable Recovery Path):

| Loại lỗi phát sinh                  | Ý nghĩa hiển thị cho người dùng                                             | Hành động khắc phục cung cấp trên UI                                             | Khả năng thử lại (Retryability)                | Bảo toàn trạng thái dữ liệu (State Preservation)                    |
| ----------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| **GPS ngoài bán kính (> 10m)**      | _"Khoảng cách hiện tại là 15.4m, vượt quá ngưỡng 10m so với gốc cây."_      | Nút _"Đo lại GPS"_ kèm hướng dẫn di chuyển sát lại gốc cây.                      | Có (Thử lại ngay lập tức)                      | Giữ nguyên trạng thái task; không hủy các bước trước.               |
| **Quét sai mã QR cây**              | _"Mã QR vừa quét (TREE-08) không khớp với cây của nhiệm vụ này (TREE-02)."_ | Nút _"Quét lại"_ và nút _"Xem danh sách cây"_ để đối chiếu.                      | Có (Mở lại camera quét)                        | Giữ nguyên trạng thái; không ghi đè dữ liệu rác.                    |
| **Mã QR bị mờ / gãy / hỏng**        | _"Không thể nhận diện mã QR trên thân cây."_                                | Tùy chọn _"Báo cáo mã QR hư hỏng"_ gửi thông báo vận hành cho Quản lý.           | Có                                             | Ghi nhận sự cố ngoại lệ vào task.                                   |
| **Quyền Camera bị từ chối lần đầu** | _"Ứng dụng cần quyền Camera để quét mã QR và chụp ảnh bằng chứng."_         | Hiển thị màn hình giải thích ngữ cảnh (Rationale) kèm nút _"Cho phép truy cập"_. | Có (Gọi lại hàm xin quyền của OS)              | Giữ nguyên màn hình hiện tại.                                       |
| **Quyền Camera bị chặn vĩnh viễn**  | _"Quyền Camera đã bị tắt trong Cài đặt thiết bị."_                          | Nút _"Mở Cài đặt hệ thống"_ (`Linking.openSettings()`).                          | Có (Sau khi người dùng bật lại trong Settings) | Lưu lại bước đang làm; khi quay lại app tự động kiểm tra lại quyền. |
| **Xung đột tài nguyên Camera**      | _"Camera đang được sử dụng bởi tác vụ khác."_                               | Tự động giải phóng camera cũ trước khi kích hoạt preview mới (DR-10).            | Tự động                                        | Ngăn chặn sập ứng dụng (Crash prevention).                          |
| **Lỗi mạng khi nộp bằng chứng**     | _"Không thể kết nối đến máy chủ. Đã lưu bằng chứng vào bộ nhớ máy."_        | Nút _"Thử gửi lại"_ hoặc tự động chuyển sang chế độ hàng đợi ngoại tuyến.        | Có (Hỗ trợ thử lại thủ công và tự động)        | **Bảo toàn 100% bằng chứng và ảnh chụp cục bộ.**                    |
| **Quản lý từ chối nghiệm thu**      | _"Báo cáo cần làm lại: [Lý do cụ thể từ Quản lý]"_                          | Nút _"Tiếp tục làm lại"_ đưa thẳng về bước bằng chứng bị yêu cầu sửa.            | Có                                             | Giữ nguyên các bằng chứng hợp lệ; chỉ yêu cầu bổ sung phần thiếu.   |
| **Hết hạn phiên đăng nhập**         | _"Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục."_          | Nút _"Đăng nhập"_ (Lưu lại tuyến đường và task đang làm dở).                     | Có                                             | Lưu trữ dữ liệu nháp vào local storage.                             |
