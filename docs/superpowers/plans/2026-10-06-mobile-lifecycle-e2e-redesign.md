# Kế Hoạch Triển Khai E2E Lifecycle Testing Harness Tái Cấu Trúc
## Closed-Loop Field Operations, Rework Loop & Global Capabilities UI/UX Audit

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi toàn diện `scripts/mobile-lifecycle-e2e.cjs` từ kịch bản đăng nhập/đăng xuất tĩnh và tạo task ép buộc thành Hệ thống Kiểm thử Vòng đời Tác nghiệp Thực tế Khép kín (Closed-Loop E2E Operations), bao quát 100% tính năng hiện có của app (quy trình 5 bước chứng thực hiện trường, quy trình làm lại Rework, nút FAB Quét QR toàn cục, tra cứu hồ sơ cây, trung tâm thông báo) và nhận diện các lỗi UI/UX tiềm ẩn trên thiết bị Samsung Galaxy Note 20 Ultra.

**Architecture:** Kiến trúc Multi-Scenario Runner Engine hỗ trợ chạy theo tham số CLI (`--scenario=lifecycle`, `--scenario=rework`, `--scenario=features`, `--scenario=all`). Thay vì ép tạo task rác, engine chủ động tận dụng các task hiện có trong DB, điều phối liên hoàn giữa 2 vai trò Staff (tác nghiệp hiện trường) và Manager (nghiệm thu/quyết định), chụp ảnh milestone đối chứng sắc nét ở mọi điểm chuyển dịch trạng thái để audit chất lượng UI/UX theo `UI_UX_MEMORY.md`.

**Tech Stack:** Node.js (CommonJS test runner), ADB (Android Debug Bridge for Samsung Note 20 Ultra), Fastify API Backend, Metro Dev Server, Expo SDK 57 / React Native.

**Spec:** `docs/superpowers/specs/2026-10-06-mobile-lifecycle-e2e-design.md`

## Global Constraints
- Target Device: Samsung Galaxy Note 20 Ultra 5G (1080x2316), Android Profile 0.
- Touch Target Invariant: Mọi nút bấm tác nghiệp phải đạt kích thước tối thiểu 44x44px (ưu tiên 48-52px ngoài hiện trường).
- IME Safety (UI-028): Đóng bàn phím an toàn bằng `dumpsys input_method` và `keyevent 111` (KEYCODE_ESCAPE) để không làm mất focus hay ấn nhầm back screen.
- Vietnamese Copy Invariant (UI-002): 100% nhãn và trạng thái hiển thị bằng tiếng Việt chuẩn hóa, tuyệt đối không lộ enum kỹ thuật (`CHANGE_PROOF`, `PENDING`, `REWORK_REQUIRED`).
- Continuous Ribbon & Sheet Isolation (UI-029 & AppPrimitives): Bảo toàn tính tách biệt của Modal Backdrop và Animation.
- Idempotency & OCC: Mọi request API phải tuân thủ Idempotency-Key và version control.

## Review Focus
1. Tỷ lệ khung hình và độ sắc nét của ảnh Trước/Sau trên màn hình nghiệm thu (`PhotoPair`): không bị méo, méo tỷ lệ hoặc cắt cụt tán cây.
2. Khả năng tương tác của Checklist hiện trường: touch target đủ lớn để thao tác 1 tay ngoài trời, phản hồi checked/unchecked tức thì.
3. Độ rõ ràng của phân cấp quyết định Quản lý: nút "Duyệt nghiệm thu" (xanh lá) và "Yêu cầu làm lại" (cam/hổ phách) không bị nhầm lẫn.
4. Trải nghiệm nút FAB Scanner trung tâm: mở nhanh, đóng thuận tiện, hiển thị đầy đủ hồ sơ cây và lịch sử chăm sóc.
5. Sự mượt mà khi xử lý luồng làm lại (Rework): thợ chỉ cần chụp lại đúng bức ảnh bị từ chối thay vì phải làm lại từ đầu.

---

### Task 1: Tái Cấu Trúc Khung Điều Phối Kịch Bản (Scenario Runner Engine) Trong `scripts/mobile-lifecycle-e2e.cjs`

**Files:**
- Modify: `scripts/mobile-lifecycle-e2e.cjs:1-150`

**Interfaces:**
- Consumes: `process.argv` (`--scenario=...`), `ADB_BIN`, `ADB_DEVICE`, `API_BASE_URL`.
- Produces: CLI argument parser, stateful helpers (`findOrCreateActionableTask`, `tapElementByLabel`, `waitForTextOrTimeout`), and scenario dispatcher.

- [ ] **Step 1: Khảo sát mã nguồn hiện tại và bổ sung parser tham số dòng lệnh `--scenario`**
  Hỗ trợ các tùy chọn: `lifecycle` (Happy path khép kín), `rework` (Quy trình làm lại), `features` (Tính năng nền tảng), `all` (Chạy toàn bộ).
  
- [ ] **Step 2: Xây dựng helper `findOrCreateActionableTask(roleToken, staffId)`**
  Kiểm tra danh sách task trong DB: nếu đã có task của Staff ở trạng thái `PENDING` hoặc `IN_PROGRESS` thì lấy task đó để chạy; chỉ khi DB hoàn toàn không có task nào mới gọi API tạo 1 task để phục vụ test. Không còn cảnh mỗi lần chạy test lại spam 1 task mới qua UI!

- [ ] **Step 3: Xây dựng helper điều hướng vai trò mượt mà (Role Switcher Helper)**
  Thay vì quy trình đăng xuất dài dòng và chạm mù tọa độ, xây dựng hàm `switchRole(targetRole, email, password)` kiểm tra chính xác màn hình hiện tại trước khi thực hiện chuyển đổi vai trò.

- [ ] **Step 4: Chạy thử nghiệm khung điều phối (Dry-run parser & Preflight)**
  Chạy lệnh: `node scripts/mobile-lifecycle-e2e.cjs --scenario=lifecycle --dry-run`
  Kỳ vọng: Preflight PASS, nhận diện đúng device và tham số kịch bản.

---

### Task 2: Triển Khai Kịch Bản 1 (Scenario 1 - Closed-Loop Field Operations Lifecycle)

**Files:**
- Modify: `scripts/mobile-lifecycle-e2e.cjs`

**Interfaces:**
- Consumes: `StaffProofFlow.tsx`, `ManagerReview.tsx`, `greenOpsService.ts`.
- Produces: Chuỗi kiểm thử liên hoàn từ Thợ tác nghiệp 5 bước đến Quản lý phê duyệt và cập nhật lịch sử chăm sóc.

- [ ] **Step 1: Triển khai luồng Thợ tiếp nhận công việc và Check-in GPS**
  - Đăng nhập Staff -> Mở tab Công việc -> Mở task mục tiêu.
  - Chạm "Bắt đầu làm việc" (chuyển sang `IN_PROGRESS`).
  - Mở bước "Xác minh GPS" -> Kiểm tra hiển thị khoảng cách -> Chạm "Check-in và quét QR" -> Chụp milestone screenshot: `milestone-s1-01-gps-checkin.png`.

- [ ] **Step 2: Triển khai luồng Thợ Quét mã QR gốc cây & Chụp ảnh Trước thi công**
  - Trong bước QR task: Xác nhận thông tin mã QR cây -> Chuyển sang bước "Chụp ảnh trước xử lý".
  - Chạm nút "Chụp ảnh" (Viewfinder camera chụp ảnh thật trên Note 20 Ultra) -> Chụp milestone screenshot: `milestone-s1-02-before-photo.png`.
  - Chạm "Dùng ảnh này" để chuyển sang Checklist.

- [ ] **Step 3: Triển khai luồng Thợ Tích chọn Checklist & Chụp ảnh Sau thi công**
  - Trong bước "Checklist tác nghiệp": Chạm lần lượt để tích chọn toàn bộ các hạng mục kỹ thuật an toàn.
  - Chạm "Chụp ảnh sau khi hoàn thành".
  - Chạm nút "Chụp ảnh" để ghi nhận ảnh Sau -> Chạm "Dùng ảnh này" -> Chuyển sang màn hình "Xem lại báo cáo".
  - Chụp milestone screenshot: `milestone-s1-03-after-and-checklist.png`.

- [ ] **Step 4: Triển khai luồng Thợ Nộp nghiệm thu biên bản 5/5 chứng thực**
  - Kiểm tra màn hình tổng hợp: hiển thị đủ 5/5 hạng mục chứng thực, không còn thiếu mục nào.
  - Chạm nút "Nộp nghiệm thu" (`submitEvidence`).
  - Kiểm tra chuyển sang màn hình thành công -> Chụp milestone screenshot: `milestone-s1-04-proof-submitted.png`.

- [ ] **Step 5: Triển khai luồng Quản lý Nghiệm thu & Phê duyệt Hoàn tất**
  - Chuyển sang tài khoản Manager -> Mở tab "Duyệt".
  - Tìm và mở đúng báo cáo mà Thợ vừa nộp.
  - Kiểm tra giao diện đối chứng ảnh song song (`PhotoPair`), kiểm tra GPS, QR, Checklist.
  - Chọn quyết định "Duyệt nghiệm thu" (`APPROVE`) -> Chạm "Xác nhận quyết định".
  - Chụp milestone screenshot: `milestone-s1-05-manager-approved.png`.

- [ ] **Step 6: Xác minh trạng thái cuối cùng và Lịch sử chăm sóc cây (`CareHistory`)**
  - Kiểm tra task đã chuyển sang trạng thái `COMPLETED`.
  - Kiểm tra API/DB xem cây liên quan đã được tự động thêm một bản ghi `CareHistory` mới.
  - Ghi nhận kết quả kịch bản 1 vào bảng tổng kết.

---

### Task 3: Triển Khai Kịch Bản 2 (Scenario 2 - Field Exception & Rework Loop)

**Files:**
- Modify: `scripts/mobile-lifecycle-e2e.cjs`

**Interfaces:**
- Consumes: `ManagerReview.tsx` (`REQUEST_REWORK`), `StaffProofFlow.tsx` (`resubmitRework`).
- Produces: Chuỗi kiểm thử luồng làm lại từ khi bị Quản lý từ chối đến khi Thợ khắc phục và nộp lại.

- [ ] **Step 1: Quản lý từ chối nghiệm thu và yêu cầu làm lại**
  - Manager mở một báo cáo chờ duyệt trong tab "Duyệt".
  - Chọn quyết định "Yêu cầu làm lại" (`REQUEST_REWORK`).
  - Chọn preset lý do: "Ảnh trước/sau chưa đủ rõ" (hoặc nhập lý do cụ thể).
  - Chạm "Xác nhận quyết định" -> Task chuyển sang `REWORK_REQUIRED` và sinh thông báo cho Thợ.
  - Chụp milestone screenshot: `milestone-s2-01-rework-requested.png`.

- [ ] **Step 2: Thợ nhận thông báo và truy cập nhiệm vụ cần sửa**
  - Chuyển sang tài khoản Staff -> Mở Trung tâm Thông báo (hoặc danh sách Công việc tab "Cần xử lý").
  - Mở công việc có huy hiệu cảnh báo "Cần làm lại".
  - Xác nhận Thợ nhìn thấy rõ lý do từ chối và hạng mục cần khắc phục -> Chụp milestone screenshot: `milestone-s2-02-staff-rework-view.png`.

- [ ] **Step 3: Thợ chụp lại bằng chứng bổ sung & Nộp lại biên bản**
  - Thợ chạm vào bước cần sửa -> Thực hiện chụp lại bức ảnh đạt yêu cầu -> Chạm "Dùng ảnh này".
  - Chạm nút "Nộp lại bằng chứng" (`resubmitRework`) -> Task chuyển lại về `WAITING_REVIEW`.
  - Chụp milestone screenshot: `milestone-s2-03-rework-resubmitted.png`.

- [ ] **Step 4: Quản lý nghiệm thu lại lần 2 và phê duyệt hoàn thành**
  - Manager mở lại báo cáo trong hàng chờ -> Kiểm tra ảnh đã được thay thế đạt chuẩn -> Bấm "Duyệt nghiệm thu" -> Task hoàn thành `COMPLETED`.
  - Chụp milestone screenshot: `milestone-s2-04-rework-completed.png`.

---

### Task 4: Triển Khai Kịch Bản 3 (Scenario 3 - Global Capabilities & UI/UX Audit)

**Files:**
- Modify: `scripts/mobile-lifecycle-e2e.cjs`

**Interfaces:**
- Consumes: `NotchedBottomNav.tsx`, `StaffTrees.tsx`, `ManagerTrees.tsx`, `StaffArea.tsx` (`NOTIFICATIONS`).
- Produces: Kiểm thử các tính năng toàn cục, phát hiện lỗi bố cục UI/UX.

- [ ] **Step 1: Kiểm thử Nút Quét QR Toàn Cục (FAB Scanner ở tâm thanh Bottom Nav)**
  - Chạm vào nút FAB quét QR ở tâm thanh Notched Bottom Nav (x=540, y=2180).
  - Kiểm tra mở màn hình tra cứu cây nhanh -> Mô phỏng quét mã cây mẫu (`TRE-DEV-01`).
  - Kiểm tra thẻ thông tin cây (`TreeLookupResult`): tên cây, đường kính, địa chỉ, lịch sử chăm sóc gần nhất -> Chụp milestone screenshot: `milestone-s3-01-fab-qr-lookup.png`.
  - Chạm nút đóng/quay lại để kiểm tra khả năng thoát êm ái.

- [ ] **Step 2: Kiểm thử Màn hình Hồ sơ cây & Bộ lọc Sức khỏe**
  - Mở tab "Cây của tôi" (Staff) hoặc "Cây" (Manager).
  - Thử nghiệm tìm kiếm tên đường trong ô tìm kiếm.
  - Chạm lần lượt các chip lọc: "Tất cả", "Khỏe mạnh", "Cần chăm sóc", "Cảnh báo".
  - Kiểm tra danh sách hiển thị mượt mà, không bị tràn viền -> Chụp milestone screenshot: `milestone-s3-02-tree-filters.png`.

- [ ] **Step 3: Kiểm thử Trung tâm Thông Báo & Thao tác Đánh dấu đã đọc**
  - Mở Trung tâm Thông báo từ tab Tài khoản hoặc icon chuông.
  - Chuyển đổi bộ lọc giữa "Tất cả" và "Chưa đọc".
  - Chạm nút "Đánh dấu đã đọc" -> Xác nhận badge cập nhật chính xác -> Chụp milestone screenshot: `milestone-s3-03-notifications-read.png`.
  - Chạm vào 1 thông báo có gắn `taskId` -> Xác nhận chuyển hướng chính xác đến chi tiết nhiệm vụ.

- [ ] **Step 4: Kiểm thử Báo cáo Sự cố Hiện trường (`ReportFieldIssue`)**
  - Trong một task đang thực hiện, chạm "Báo cáo sự cố".
  - Nhập lý do (ví dụ: "Cành cây vướng đường dây trung thế nguy hiểm").
  - Gửi báo cáo -> Xác nhận task chuyển sang trạng thái `BLOCKED` (Bị chặn).
  - Đăng nhập Manager -> Kiểm tra thẻ Bento Dashboard "Bị chặn" tăng số lượng và đổi màu cảnh báo -> Chụp milestone screenshot: `milestone-s3-04-blocked-task-dashboard.png`.

---

### Task 5: Thực Thi Toàn Diện Trên Samsung Galaxy Note 20 Ultra & Báo Cáo Chất Lượng

**Files:**
- Test Output: `tmp/mobile-smoke/milestone-*.png`
- Documentation: `.agents/memory/UI_UX_MEMORY.md`

- [ ] **Step 1: Thực thi toàn bộ bộ kịch bản E2E trên thiết bị thật**
  Chạy lệnh: `node scripts/mobile-lifecycle-e2e.cjs --scenario=all`
  Ghi nhận toàn bộ thời gian thực thi (latency), mã trạng thái PASS/FAIL của từng bước.

- [ ] **Step 2: Phân tích và kiểm định chất lượng các ảnh chụp màn hình milestone**
  - Rà soát toàn bộ các ảnh chụp trong thư mục `tmp/mobile-smoke/`.
  - Đối chiếu với các tiêu chí trong `docs/MOBILE_UI_RULES.md`: Độ tương phản màu sắc, kích thước touch target, tính đồng bộ tiếng Việt, không bị vỡ giao diện trên Note 20 Ultra.

- [ ] **Step 3: Cập nhật bài học kinh nghiệm và kiểm tra hồi quy vào `UI_UX_MEMORY.md`**
  Ghi nhận các mã lỗi phòng ngừa mới (nếu phát hiện khi test thực địa) và cập nhật bảng tổng kết vận hành bền vững.
