# Premium UI & Closed-Loop E2E Testing Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện nâng cấp UI/UX toàn cục (Bảng điều khiển quản lý phân cấp, Dải chọn ngày capsule liền mạch, Lớp phủ modal botanical trong trẻo) và chuẩn hóa bộ kịch bản kiểm thử E2E tác nghiệp khép kín không pass ảo trên điện thoại Samsung Note 20 Ultra.

**Architecture:** Nâng cấp các thành phần trình diễn di động (`DateRangePickerSheet`, `AppPrimitives`, `ManagerDashboard`), bảo tồn token thiết kế `@novyx/ui`, và hoàn thiện kịch bản kiểm thử tự động `scripts/mobile-lifecycle-e2e.cjs` với độ chính xác tọa độ thực tế và bằng chứng ảnh chụp thật 100%.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript strict, Node.js child_process / ADB Android Automation.

**Spec:** `docs/superpowers/specs/2026-10-07-premium-ui-and-e2e-closed-loop-design.md`

## Global Constraints
- Không cài thêm thư viện web (`tailwind`, `shadcn`, `radix`).
- Phải duy trì chuẩn ngôn ngữ Tiếng Việt 100% không dùng từ nửa vời (Before/After).
- Giữ nguyên cấu trúc điều hướng 5 tab Notched Bottom Navigation.
- Không báo cáo Đạt ảo (Fake PASS); tất cả milestone phải được kiểm chứng qua ảnh chụp thực tế trong `tmp/mobile-smoke/`.

## Review Focus
1. Dải chọn ngày qua nhiều tuần không bị vỡ vụn hoặc lộ góc vuông.
2. Lớp phủ modal không để lại bóng đen trễ khi bấm nút Back của Android.
3. Bảng điều khiển Quản lý có điểm nhấn thị giác rõ ràng, không còn 4 ô vuông bằng nhau.
4. Quản lý duyệt và thợ nộp lại báo cáo làm lại hoạt động trơn tru trên thiết bị thật.

---

### Task 1: Dải Chọn Ngày Capsule Liền Mạch (`DateRangePickerSheet.tsx`)

**Files:**
- Modify: `apps/mobile/src/components/DateRangePickerSheet.tsx`

- [ ] **Step 1.1**: Tái cấu trúc logic xác định ranh giới bo góc trong `calendarCells.map`:
  - Xác định `isStart`, `isEnd`, `isSingleSelected`, `inRange`.
  - Thiết lập bán kính bo góc cho `ribbonTrack`:
    - `isStart && !isSingleSelected`: Bo tròn góc trái (`borderTopLeftRadius: 17, borderBottomLeftRadius: 17`), kéo sang mép phải.
    - `isEnd && !isSingleSelected`: Bắt đầu từ mép trái, bo tròn góc phải (`borderTopRightRadius: 17, borderBottomRightRadius: 17`).
    - `inRange`: Kéo từ mép trái sang phải. Nếu rơi vào Thứ 2 hoặc ngày đầu tháng thì bo tròn góc trái; nếu rơi vào Chủ nhật hoặc ngày cuối tháng thì bo tròn góc phải.
- [ ] **Step 1.2**: Tinh chỉnh màu sắc và độ tương phản:
  - Vòng tròn ngày được chọn (`dayCircleActive`): Dùng màu xanh rừng đậm `colors.forestDepths`, chữ trắng tinh `colors.snowWhite` in đậm.
  - Dải ribbon nền (`ribbonTrack`): Dùng màu xanh ngọc dịu `colors.successSurface`.
  - Ngày nằm trong dải (`dayTextInRange`): Dùng màu `colors.forestDepths` với `fontWeight: '600'`.
- [ ] **Step 1.3**: Kiểm tra TypeScript: `npm run typecheck --workspace @novyx/mobile`.

---

### Task 2: Lớp Phủ Modal Trong Trẻo & Tắt Nhanh Không Giật (`AppPrimitives.tsx`)

**Files:**
- Modify: `apps/mobile/src/components/AppPrimitives.tsx`

- [ ] **Step 2.1**: Tinh chỉnh màu lớp phủ backdrop `sheetBackdrop`:
  - Thay thế màu đen nặng `rgba(10, 25, 18, 0.48)` bằng màu Soft Botanical Scrim dịu nhẹ `rgba(12, 28, 20, 0.28)`.
- [ ] **Step 2.2**: Tối ưu hóa chu kỳ đóng của `BottomSheetModal`:
  - Giảm thời gian fade-out animation khi đóng từ 180-220ms xuống 100-120ms để backdrop không bị kéo dài sau khi thao tác quay lại.
  - Khi người dùng bấm nút Android Back (`onRequestClose`), gọi ngay `onClose()` và thu hồi trạng thái hiển thị an toàn.
- [ ] **Step 2.3**: Kiểm tra TypeScript: `npm run typecheck --workspace @novyx/mobile`.

---

### Task 3: Bảng Điều Khiển Quản Lý Phân Cấp (`ManagerDashboard.tsx`)

**Files:**
- Modify: `apps/mobile/src/screens/manager/ManagerDashboard.tsx`

- [ ] **Step 3.1**: Loại bỏ lưới 4 ô vuông bằng nhau `metricsGrid` (2x2).
- [ ] **Step 3.2**: Xây dựng **Hero Focus Card (Khối trọng tâm vận hành số 1)**:
  - Phân cấp ưu tiên: Quá hạn > Bị chặn > Chờ duyệt > Vận hành ổn định.
  - Hiển thị tiêu đề, số lượng nổi bật, badge cảnh báo và nút hành động nhanh.
- [ ] **Step 3.3**: Xây dựng **Thanh Chỉ Số Phân Cấp (Streamlined Metrics Bar)**:
  - Hiển thị 4 chỉ số phụ dạng thanh ngang/pill thanh thoát với icon vector, nhãn rõ ràng và số đếm sắc nét.
- [ ] **Step 3.4**: Giữ vững và làm mượt **Thẻ Tiến Độ Chăm Sóc Cây (Routine Progress Card)**.
- [ ] **Step 3.5**: Kiểm tra TypeScript và Lint:
  - `npm run typecheck --workspace @novyx/mobile`
  - `npm run lint`

---

### Task 4: Chuẩn Hóa E2E Closed-Loop Test Harness (`scripts/mobile-lifecycle-e2e.cjs`)

**Files:**
- Modify: `scripts/mobile-lifecycle-e2e.cjs`

- [ ] **Step 4.1**: Tự động nhận diện thiết bị khả dụng (`ADB_DEVICE`) ngay khi khởi động `run()`.
- [ ] **Step 4.2**: Chuẩn hóa Scenario 1 (Closed-Loop Lifecycle):
  - Tìm hoặc dùng task thực tế trong DB.
  - Thực hiện đủ 5 bước hiện trường: GPS -> QR -> Ảnh trước -> Checklist -> Ảnh sau -> Nộp nghiệm thu.
  - Khi Quản lý duyệt: Thực hiện thao tác cuộn (swipe up) đưa vùng "Quyết định" vào giữa màn hình, bấm "Duyệt nghiệm thu" (Card 1) và bấm "Xác nhận quyết định" tại tọa độ chính xác.
  - Kiểm chứng màn hình thực tế sau khi duyệt.
- [ ] **Step 4.3**: Chuẩn hóa Scenario 2 (Rework Loop):
  - Loại bỏ hoàn toàn lệnh gọi API `POST tasks/evidence` không tồn tại.
  - Sử dụng task thực tế ở trạng thái `WAITING_REVIEW`.
  - Quản lý chọn "Yêu cầu làm lại", chọn lý do preset "Ảnh trước/sau chưa đủ rõ", cuộn và xác nhận.
  - Thợ đăng nhập, lọc danh sách "Làm lại", mở chi tiết, chụp lại ảnh Trước, gửi lại báo cáo.
- [ ] **Step 4.4**: Chuẩn hóa Scenario 3 (Features Audit):
  - Mở FAB Scanner trung tâm trên Notched Bottom Nav.
  - Quét mã QR tra cứu hồ sơ cây tức thì.
  - Mở danh mục cây, kiểm thử chip lọc "Khỏe mạnh" và "Cần chăm sóc".
  - Mở Tài khoản -> Trung tâm thông báo -> Đánh dấu đã đọc.
- [ ] **Step 4.5**: Chạy toàn bộ suite:
  - `node scripts/mobile-lifecycle-e2e.cjs --scenario=all`
  - Kiểm tra và thẩm định 22 ảnh chụp thực tế tại `tmp/mobile-smoke/`.

---

### Task 5: Cập Nhật Bộ Nhớ Bền Vững (`UI_UX_MEMORY.md`) & Báo Cáo

**Files:**
- Modify: `.agents/memory/UI_UX_MEMORY.md`

- [ ] **Step 5.1**: Ghi nhận bài học kinh nghiệm về tọa độ cuộn màn hình Quản lý duyệt (UI-030) và thuật toán Dải Capsule (UI-031).
- [ ] **Step 5.2**: Lập báo cáo kết quả tổng kết gửi người dùng kèm bảng minh chứng.
