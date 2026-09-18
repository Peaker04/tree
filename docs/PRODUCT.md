# NOVYX GreenOps — Product Baseline & Business Capabilities

Tài liệu này là hợp đồng thẩm quyền cao nhất giải thích **TẠI SAO** sản phẩm tồn tại, giải quyết bài toán gì, mang lại giá trị vận hành nào và ranh giới phạm vi của phiên bản **Minimum Viable Product (MVP)**.

---

## 1. Tuyên ngôn sản phẩm & Tầm nhìn (Product Vision)

> **Tầm nhìn:** Thiết lập hệ thống chuẩn mực vận hành số tin cậy cho công tác quản lý và chăm sóc cây xanh đô thị, biến mọi tác nghiệp hiện trường thành chuỗi bằng chứng không thể chối bỏ (Tamper-evident Proof Chain) thông qua định vị thực địa, định danh số và cổng kiểm duyệt chất lượng nghiêm ngặt.

### 1.1. Bài toán thực tiễn (Problem Statement)

Các đơn vị quản lý công viên, cây xanh đô thị và nhà thầu dịch vụ cảnh quan hiện gặp 4 thách thức cốt tử:

1. **Gian lận và thiếu tin cậy hiện trường:** Khó xác minh nhân viên có thực sự đến đúng vị trí cây hay chỉ chụp ảnh từ xa, chụp ảnh cũ hoặc báo cáo khống.
2. **Sai lệch định danh tài sản:** Trong các tuyến đường hàng trăm cây cùng chủng loại, nhân viên rất dễ nhầm lẫn cây cần chăm sóc với cây lân cận nếu chỉ dựa vào số nhà hoặc mô tả cảm tính.
3. **Thiếu tính toàn vẹn thời gian của bằng chứng:** Ảnh chụp thường bị dồn về cuối ngày, không phản ánh trạng thái trước (Before) và sau (After) khi can thiệp kỹ thuật (cắt tỉa, bón phân, xử lý sâu bệnh).
4. **Quy trình duyệt lỏng lẻo, thiếu đường hồi phục:** Quản lý không có công cụ đối soát nhanh giữa tọa độ thực tế, mã quét cây và checklist; khi từ chối nghiệm thu, thông tin phản hồi tới nhân viên bị đứt gãy dẫn đến chậm trễ tiến độ.

### 1.2. Giá trị vận hành cốt lõi (Core Value Proposition)

NOVYX GreenOps giải quyết bài toán trên bằng mô hình **Xác thực tác nghiệp 5 điểm chốt (5-Point Field Verification Gate)**:

- **Chốt 1 — Tọa độ thực địa:** GPS sai lệch $\le 10$m so với tọa độ gốc của cây `[VERIFIED]`.
- **Chốt 2 — Định danh thực thể:** Quét mã QR gắn cố định trên thân cây phải khớp 100% với Task `[VERIFIED]`.
- **Chốt 3 — Trạng thái ban đầu:** Ảnh chụp hiện trường trước tác nghiệp (Before Photo) `[VERIFIED]`.
- **Chốt 4 — Tuân thủ quy trình:** Đánh dấu hoàn tất toàn bộ hạng mục kỹ thuật bắt buộc (Checklist) `[VERIFIED]`.
- **Chốt 5 — Nghiệm thu kết quả:** Ảnh chụp hiện trường sau khi hoàn thành (After Photo) `[VERIFIED]`.

---

## 2. Đối tượng sử dụng & Chân dung người dùng (Target Actors)

| Tác nhân (Actor)                  | Bối cảnh vận hành                                                                                               | Mục tiêu chính                                                                                                                       | Rào cản môi trường                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **Nhân viên hiện trường (Staff)** | Làm việc ngoài trời, di chuyển liên tục, thiết bị Android tầm trung/giá rẻ, sử dụng 1 tay, đeo găng tay bảo hộ. | Nhận việc rõ ràng, thao tác chứng thực nhanh gọn trong $\le 2$ phút/cây, không bị mất dữ liệu khi rớt mạng.                          | Ánh sáng chói chang, mạng 3G/4G chập chờn, bụi bẩn, pin yếu, ứng dụng dễ bị OS tắt ngầm. |
| **Quản lý vận hành (Manager)**    | Điều hành tại văn phòng hoặc kiểm tra đột xuất ngoài tuyến đường; sử dụng smartphone hoặc tablet.               | Giao việc đúng người đúng cây, giám sát tiến độ toàn tuyến, duyệt nhanh báo cáo với bằng chứng minh bạch, yêu cầu làm lại chính xác. | Quá tải báo cáo tồn đọng, thiếu dữ liệu đối chiếu khách quan nếu bằng chứng bị cắt xén.  |
| **Quản trị hệ thống (Admin)**     | Vận hành cấp cao, quản lý danh mục đô thị, tài khoản và phân quyền.                                             | Đảm bảo tính toàn vẹn dữ liệu, phân quyền bảo mật, tích hợp hệ sinh thái đô thị thông minh.                                          | _(Dự kiến cho tương lai — [OUT_OF_MVP], [RESERVED])_.                                    |

---

## 3. Bản đồ năng lực kinh doanh (Business Capability Map)

Hệ thống năng lực của NOVYX GreenOps được phân tách rành mạch giữa **Năng lực nghiệp vụ (Business Capabilities)** và **Năng lực kỹ thuật nền tảng (Platform Capabilities)**:

```text
+-----------------------------------------------------------------------------------+
|                            NOVYX BUSINESS CAPABILITIES                            |
+-----------------------------------------------------------------------------------+
| [CORE DOMAIN]                                                                     |
| 1. Field Work Verification (Xác thực tác nghiệp hiện trường)                       |
|    - GPS Proximity Enforcement (Xác thực bán kính 10m)                            |
|    - Physical Asset QR Validation (Xác thực mã QR thân cây)                       |
|    - Chronological Photo Evidence Acquisition (Chụp ảnh Trước/Sau)                |
|    - Technical Checklist Execution (Thực thi danh mục kỹ thuật)                   |
|    - Proof Chain Packaging & Submission (Đóng gói và nộp chuỗi bằng chứng)        |
+-----------------------------------------------------------------------------------+
| [SUPPORTING DOMAINS]                                                              |
| 2. Work Management (Quản lý công việc)                                            |
|    - Task Dispatching & Assignment (Tạo và phân công nhiệm vụ)                     |
|    - Work Queue & Prioritization (Hàng đợi công việc và ưu tiên hóa việc làm lại)  |
| 3. Tree Asset Registry (Quản lý hồ sơ cây xanh)                                   |
|    - Tree Catalog & Risk Profiling (Hồ sơ cây và phân loại rủi ro/sức khỏe)       |
|    - Fast QR Lookup (Tra cứu nhanh thông tin cây tại hiện trường)                  |
|    - Care History Projection (Chiếu lịch sử chăm sóc từ các task hoàn thành)      |
| 4. Review & Quality Control (Kiểm soát chất lượng & Nghiệm thu)                   |
|    - Evidence Audit Gate (Cổng thẩm định 5 chốt bằng chứng)                       |
|    - Review Approval (Phê duyệt đóng việc)                                        |
|    - Rework Dispatch with Actionable Feedback (Trả việc làm lại kèm lý do rõ ràng)|
| 5. Operational Notifications (Thông báo vận hành)                                 |
|    - Task Status Alerts (Cảnh báo việc mới, việc bị trả lại, việc đã duyệt)       |
|    - Operational Exception Alerts (Cảnh báo mã QR hỏng, bất thường hiện trường)   |
+-----------------------------------------------------------------------------------+
| [GENERIC / PLATFORM CAPABILITIES]                                                 |
| - Identity & Session (Đăng nhập, duy trì phiên, phân quyền vai trò)               |
| - Contextual Device Permissions (Cấp quyền camera, định vị đúng thời điểm)        |
| - Resilient Local Persistence (Lưu trữ ngoại tuyến, chống mất dữ liệu khi kill app)|
| - API Transport & Envelopes (Giao thức REST v1, chuẩn hóa lỗi, upload multipart)   |
| - Seed/Linear Design System (Giao diện chuẩn hóa, tối ưu ngoài trời)              |
+-----------------------------------------------------------------------------------+
```

### 3.1. Bảng chi tiết năng lực nghiệp vụ (Business Capabilities Matrix)

| Mã         | Tên năng lực                   | Vai trò    | Tác nhân chính         | Đối tượng xử lý (Work Object)                 | Trạng thái MVP      | Chủ sở hữu mã nguồn hiện tại `[VERIFIED]`                      |
| ---------- | ------------------------------ | ---------- | ---------------------- | --------------------------------------------- | ------------------- | -------------------------------------------------------------- |
| **CAP-01** | **Field Work Verification**    | **CORE**   | Staff                  | `Task`, `TaskEvidence`, `GpsCheck`, `QrCheck` | **MUST HAVE**       | `StaffProofFlow.tsx`, `mobileWorkflow.ts`                      |
| **CAP-02** | **Work Management**            | SUPPORTING | Manager, Staff         | `Task`                                        | **MUST HAVE**       | `ManagerCreateTask.tsx`, `StaffWork.tsx`, `greenOpsService.ts` |
| **CAP-03** | **Tree Asset Registry**        | SUPPORTING | Manager, Staff         | `Tree`, `CareHistory`                         | **MUST HAVE**       | `StaffTrees.tsx`, `ManagerTrees.tsx`, `ManagerQrLookup.tsx`    |
| **CAP-04** | **Review & Quality Control**   | SUPPORTING | Manager                | `Task`, `TaskEvidence`, `ReviewDecision`      | **MUST HAVE**       | `ManagerReview.tsx`, `greenOpsService.ts`                      |
| **CAP-05** | **Operational Notifications**  | SUPPORTING | System, Staff, Manager | `Notification`                                | **MUST HAVE**       | `StaffArea.tsx`, `greenOpsService.ts`                          |
| **CAP-06** | **Session & Access Control**   | GENERIC    | Staff, Manager         | `AuthSession`, `User`                         | **MUST HAVE**       | `MobileApp.tsx`, `authSessionStore.ts`                         |
| **CAP-07** | **Contextual Permissions**     | GENERIC    | System, Staff, Manager | `DevicePermission`                            | **MUST HAVE**       | `devicePermissions.ts`, `useDevicePermissions.ts`              |
| **CAP-08** | **Offline Resilience & Cache** | GENERIC    | System                 | `Snapshot`, `LocalCache`                      | **MUST HAVE (GAP)** | `greenOpsService.ts` _(Hiện tại in-memory, cần nâng cấp)_      |

---

## 4. Phạm vi MVP — Luồng vận hành tối thiểu (Walking Skeleton)

Định nghĩa MVP của NOVYX GreenOps **KHÔNG ĐƯỢC ĐO BẰNG SỐ LƯỢNG MÀN HÌNH**, mà được đo bằng **Một chu trình công việc khép kín đầu-cuối (End-to-End Minimum Viable Workflow)**:

```text
[1. Manager Tạo việc]
  |-- Chọn cây, người làm, loại việc, hạn chót, checklist mẫu
  v
[2. Staff Tiếp nhận]
  |-- Nhận thông báo việc mới, thấy việc trong hàng đợi Công việc
  v
[3. Staff Xác thực GPS]
  |-- Đo khoảng cách tới tọa độ cây, yêu cầu <= 10m
  v
[4. Staff Quét QR Cây]
  |-- Quét mã vật lý trên cây, đối soát khớp 100% mã cây của task
  v
[5. Staff Chụp Ảnh Trước]
  |-- Ghi nhận hiện trạng cây trước khi thao tác
  v
[6. Staff Làm việc & Tích Checklist]
  |-- Hoàn thành từng hạng mục chăm sóc thực tế
  v
[7. Staff Chụp Ảnh Sau]
  |-- Ghi nhận hiện trạng cây sau khi hoàn thành
  v
[8. Staff Soát Bằng chứng & Nộp]
  |-- Kiểm tra cổng 5 điểm chốt, nộp báo cáo (Status: Waiting_Review)
  v
[9. Manager Thẩm định Bằng chứng]
  |-- Xem chi tiết GPS (m/timestamp), QR, cặp ảnh Trước/Sau, Checklist
  v
  +---> [Nhánh A: PHÊ DUYỆT (Approve)]
  |       |-- Khép kín nhiệm vụ (Status: Completed)
  |       |-- Ghi nhận vào Lịch sử chăm sóc (Care History) của cây
  |       v
  +---> [Nhánh B: YÊU CẦU LÀM LẠI (Request Rework)]
          |-- Manager bắt buộc nhập lý do cụ thể (Reject Reason)
          |-- Chuyển trạng thái (Status: Rework_Required)
          |-- Staff nhận thông báo, thấy lý do, tiếp tục đúng bước thiếu
          |-- Staff bổ sung bằng chứng và nộp lại (Loopback to Step 8)
```

### 4.1. Tiêu chí phân định phạm vi (Scope Boundary)

#### MUST HAVE (Bắt buộc trong MVP):

- Đăng nhập theo vai trò (`Staff` hoặc `Manager`) với cơ chế khôi phục phiên từ storage cục bộ.
- Cơ chế xin quyền thiết bị theo ngữ cảnh sử dụng (Contextual Permissions) cho Camera và GPS, không có màn xin quyền chung sau đăng nhập.
- Luồng 5 bước thu thập bằng chứng tuần tự của Staff có chốt chặn (Guards).
- Luồng duyệt của Manager với cổng khóa nút Duyệt nếu thiếu bất kỳ bằng chứng nào trong 5 chốt.
- Luồng trả việc làm lại kèm lý do bắt buộc và chỉ dẫn hồi phục cho Staff.
- Tra cứu nhanh thông tin cây qua quét QR cho cả Staff và Manager.
- Chế độ hoạt động ngoại tuyến / rớt mạng bảo toàn dữ liệu nhập liệu không bị mất khi thoát ứng dụng.

#### SHOULD HAVE (Giai đoạn tiếp theo sau MVP):

- Tải ảnh nền đồng bộ (Background photo upload) khi mạng yếu.
- Phân trang dạng Cursor cho danh sách hàng trăm cây và hàng trăm task.
- Lọc cây theo bản đồ thực địa tương tác cụ thể (Interactive Map clustering).

#### EXPLICIT NON-GOALS (Tuyệt đối không làm trong MVP):

- Triển khai toàn bộ Backend Cloud Production trong giai đoạn hiện tại (giữ nguyên hợp đồng Mock/REST hybrid).
- Tích hợp nhà cung cấp định danh doanh nghiệp SSO/Active Directory/OAuth2 phức tạp.
- Phát triển giao diện Admin Web/Mobile (Role Admin là `[RESERVED]`).
- Tính năng chạy ngầm liên tục theo dõi vị trí (Background continuous geolocation tracking / Geofencing).
- Cho phép người dân/cộng đồng gửi phản ánh (Citizen public reporting portal).
- Bổ sung framework điều hướng bên ngoài (React Navigation v7 / Expo Router mới) khi chưa có ADR.

---

## 5. Giả định và Ràng buộc vận hành (Assumptions & Constraints)

1. **Ràng buộc phần cứng:** Thiết bị Staff là Android 10+ với camera có tự động lấy nét và GPS phần cứng hoạt động được ngoài trời.
2. **Ràng buộc độ chính xác GPS:** Ngưỡng 10 mét là tiêu chuẩn kỹ thuật đô thị đã được nghiệm thu trong mã nguồn (`DISTANCE_THRESHOLD = 10`). Độ chính xác GPS thực địa có thể dao động tùy tán cây và nhà cao tầng, hệ thống cung cấp cơ chế thông báo rõ ràng cho nhân viên.
3. **Ràng buộc định danh QR:** Mỗi cây xanh chỉ gắn duy nhất một mã QR kim loại/nhựa chịu thời tiết. Mã QR chứa trực tiếp chuỗi định danh cây (ví dụ `TREE-01` hoặc URL chứa mã cây).
4. **Ràng buộc ngôn ngữ & Định dạng:** Toàn bộ giao diện người dùng sử dụng tiếng Việt tiêu chuẩn; thời gian hiển thị theo múi giờ `Asia/Ho_Chi_Minh` (GMT+7); khoảng cách hiển thị theo mét (m).
5. **Ràng buộc kiến trúc monorepo:** Mọi cấu trúc dữ liệu trao đổi giữa ứng dụng di động và backend tương lai phải đi qua package `@novyx/contracts`. Cấm tuyệt đối việc sao chép thủ công kiểu dữ liệu vào `apps/mobile/src/`.
