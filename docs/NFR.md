# NOVYX GreenOps — Non-Functional Requirements & Resilience Architecture

Tài liệu này là chuẩn mực duy nhất định nghĩa **CÁC YÊU CẦU PHI CHỨC NĂNG (Non-Functional Requirements - NFR)**, các kịch bản thuộc tính chất lượng có thể đo lường (Quality Attribute Scenarios), mô hình xử lý lỗi & phục hồi (Error & Recovery Model) và mô hình hoạt động ngoại tuyến (Offline Resilience).

---

## 1. Kịch bản thuộc tính chất lượng định lượng (Quality Attribute Scenarios)

Hệ thống loại bỏ hoàn toàn các tuyên bố chung chung (như "ứng dụng phải mượt mà"). Mọi yêu cầu chất lượng bắt buộc phải tuân theo cấu trúc 9 thành phần có thể kiểm chứng bằng thực nghiệm:

---

### QAS-PERF-01: Hiệu năng hiển thị danh sách lớn ngoài thực địa

- **ID:** `QAS-PERF-01`
- **Thuộc tính chất lượng (Quality Attribute):** **Performance / UI Responsiveness** (`[APPROVED REQUIREMENT]`)
- **Kịch bản vận hành:** Nhân viên hoặc Quản lý thao tác cuộn nhanh danh sách nhiệm vụ hoặc danh mục cây trên thiết bị Android ngoài thực địa.
- **Kích hoạt (Trigger):** Thao tác cuộn nhanh (Fling scroll) hoặc nhập từ khóa tìm kiếm.
- **Ngữ cảnh kiểm thử tham chiếu:** Thiết bị Android phân khúc phổ thông (tham chiếu `[PROPOSED BENCHMARK]`: RAM 3GB–4GB, danh sách 200–1.000 bản ghi).
- **Mục tiêu chất lượng (Quality Outcome):** Duy trì bộ nhớ có giới hạn (bounded-memory) và giao diện phản hồi mượt mà cho các danh sách lớn; không bị đơ giật hoặc crash OOM trên thiết bị hạn chế tài nguyên.
- **Ràng buộc kiến trúc (Architecture Constraint):** Bắt buộc sử dụng cơ chế ảo hóa danh sách (virtualized collection); nghiêm cấm render danh sách tăng trưởng không giới hạn bằng `ScrollView` kết hợp `map()`.
- **Tùy chọn kỹ thuật triển khai (Implementation Option):** `FlatList` / `SectionList` tiêu chuẩn của React Native với `windowSize` tối ưu và `keyExtractor` ổn định (hoặc `FlashList` nếu profiling thực tế yêu cầu).
- **Chỉ tiêu đo lường & Phân loại:**
  - `[TARGET SLO]`: Tỷ lệ khung hình rơi (Dropped frames) $< 5\%$; thời gian kết xuất khung hình hướng tới $\le 16.6\text{ms}$ (60 FPS).
  - `[BENCHMARK CONTEXT]`: Thiết bị Android phổ thông RAM 3GB–4GB, danh sách tham chiếu 200–1.000 bản ghi.
  - `[NEEDS_MEASUREMENT]`: Ngưỡng tải chính xác và giới hạn bộ nhớ cụ thể cần đo đạc thực nghiệm trên thiết bị mục tiêu ở pha Kiến trúc kỹ thuật.
- **Phương thức kiểm chứng (Verification Method):** Đo đạc qua React Native DevTools / Systrace trên máy ảo và thiết bị thật.

---

### QAS-OFFLINE-01: Mất kết nối mạng giữa chu trình thu thập bằng chứng

- **ID:** `QAS-OFFLINE-01`
- **Thuộc tính chất lượng (Quality Attribute):** **Offline Resilience / Zero Data Loss** (`[APPROVED REQUIREMENT]`)
- **Kịch bản vận hành:** Nhân viên đang thực hiện dở dang bước thu thập bằng chứng hoặc Checklist thì thiết bị mất sóng 3G/4G hoàn toàn (vào vùng mù viễn thông).
- **Kích hoạt (Trigger):** Rớt mạng đột ngột khi đang tương tác tại hiện trường.
- **Ngữ cảnh kiểm thử tham chiếu:** Nhiệm vụ đã có Site Verification; ảnh chụp vừa lưu vào bộ nhớ tạm của máy.
- **Phản ứng kỳ vọng:**
  - Ứng dụng không bật popup lỗi chặn màn hình; không chuyển hướng người dùng về màn hình đăng nhập.
  - Hiển thị huy hiệu nhận diện: `Ngoại tuyến (Dữ liệu cục bộ)` màu hổ phách (Amber).
  - Nhân viên tiếp tục hoàn thành các hạng mục bằng chứng theo `ProofProfile` bình thường.
  - Khi bấm "Gửi duyệt", báo cáo được đóng gói và đưa vào Hàng đợi gửi (Outbox) với trạng thái `LocalSubmissionStatus = PENDING_SYNC` để tự động gửi lại khi có mạng; trên máy chủ trạng thái vẫn là `IN_PROGRESS`.
- **Chỉ tiêu đo lường & Phân loại:**
  - `[APPROVED REQUIREMENT]`: $0\%$ dữ liệu bằng chứng đã chụp và checklist đã hoàn thành bị mất khi rớt mạng.
  - `[APPROVED REQUIREMENT]`: Toàn bộ chuỗi bằng chứng theo hồ sơ nhiệm vụ vẫn được ghi nhận đầy đủ với timestamp cục bộ chính xác.
  - `[NEEDS_DECISION]`: Lựa chọn engine lưu trữ bền vững ngoại tuyến (SQLite vs MMKV) cần quyết định qua `ADR-PROPOSED-02`.
- **Tùy chọn kỹ thuật tham chiếu (Reference Implementation Option):** Outbox Queue tuần tự (FIFO) với exponential backoff.
- **Phương thức kiểm chứng (Verification Method):** Kiểm thử ngắt mạng (Airplane mode test) trên máy thật; khôi phục mạng và kiểm tra dữ liệu nhận được trên server.

---

### QAS-OFFLINE-02: Ứng dụng bị hệ điều hành tắt ngầm khi đang mở Camera

- **ID:** `QAS-OFFLINE-02`
- **Thuộc tính chất lượng (Quality Attribute):** **Fault Tolerance / State Recoverability** (`[APPROVED REQUIREMENT]`)
- **Kịch bản vận hành:** Khi nhân viên bật Camera để chụp ảnh bằng chứng, hệ điều hành Android giải phóng RAM bằng cách tắt ngầm (OS Kill) tiến trình chính của ứng dụng.
- **Kích hoạt (Trigger):** Ứng dụng bị tắt cưỡng bức trong lúc tác vụ đang dang dở.
- **Ngữ cảnh kiểm thử tham chiếu:** Nhân viên vừa hoàn thành Site Verification và các bằng chứng giai đoạn đầu.
- **Phản ứng kỳ vọng:** Khi nhân viên mở lại ứng dụng, phiên đăng nhập được tự động khôi phục từ lưu trữ bền vững (Durable Store); nhiệm vụ đang làm dở được tự động mở lại với đầy đủ bằng chứng đã thu thập trước thời điểm bị tắt.
- **Chỉ tiêu đo lường & Phân loại:**
  - `[APPROVED REQUIREMENT]`: Nhân viên không phải đi lại từ đầu các khâu đã hoàn thành hợp lệ trước đó.
  - `[TARGET SLO]`: Thời gian phục hồi về đúng màn hình tác vụ trước khi tắt hướng tới mục tiêu $\le 2$ giây.
- **Tùy chọn kỹ thuật tham chiếu (Reference Implementation Option):** Local Persistence lưu draft ngay sau mỗi bước chụp ảnh hoặc tích checklist.
- **Phương thức kiểm chứng (Verification Method):** Thử nghiệm bật chế độ "Don't keep activities" trên Android Developer Options và kiểm tra độ bền dữ liệu.

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
