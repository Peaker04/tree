# Kế Hoạch Triển Khai: Nâng Cấp FE UI/UX Premium Toàn App, Khắc Phục Lỗi Giao Diện & Mở Rộng Harness E2E

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khắc phục triệt để lỗi modal backdrop trượt và date picker ô vuông gãy khúc, nâng cấp bố cục Dashboard sang Bento Grid 2x2 có điểm nhấn thị giác cao cấp thay vì 1 dải màu phẳng bệt, đồng bộ ngôn ngữ Soft Botanical Premium trên toàn bộ các màn hình app, và mở rộng harness E2E kiểm định thực tế trên điện thoại Samsung thật (User 0).

**Architecture:** Tách biệt thành 6 nhiệm vụ độc lập theo quy trình TDD & Verification Gate:
1. `BottomSheetModal` trong `AppPrimitives.tsx`: Độc lập hóa Backdrop Fade và Sheet TranslateY, loại bỏ triệt để hiện tượng dải đen trôi theo khi dismiss.
2. `DateRangePickerSheet.tsx`: Thay thế ô vuông ngắt quãng bằng Continuous Ribbon Track (34px) nối mượt mà giữa 2 vòng tròn ngày.
3. `ManagerDashboard.tsx`: Chuyển 4 ô badge ngang quê mùa thành Bento Grid 2x2 có phân cấp điểm nhấn màu sắc, chiều sâu ambient shadow, và bảo toàn 100% assertions hiện hữu.
4. Nâng cấp toàn diện các màn hình nghiệp vụ Quản lý & Nhân viên (`ManagerCreateTask`, `ManagerReview`, `StaffHome`, `StaffWork`, `StaffProofFlow`).
5. Mở rộng E2E Test Harness `scripts/mobile-lifecycle-e2e.cjs` trên User 0 (hỗ trợ cả USB & Wi-Fi ADB) để tự động hóa toàn bộ các tính năng và phát hiện lỗi UI/UX thực tế.
6. Xác thực thực tế trên Samsung Galaxy Note 20 Ultra 5G và chạy full kiểm thử chất lượng monorepo.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript Strict, Zod, Vitest, Fastify Backend API, ADB Physical Device Automation Harness.

**Spec:** [docs/superpowers/specs/2026-10-06-daily-care-dispatch-design.md](file:///d:/ki7/EXE/tree/docs/superpowers/specs/2026-10-06-daily-care-dispatch-design.md)

## Global Constraints

- Không cài đặt thêm bất kỳ thư viện web nào (`tailwind`, `radix`, `shadcn`) vào `apps/mobile`.
- Bắt buộc tuân thủ 100% Vietnamese product copy chuẩn hóa, không để lộ enum hay mã kỹ thuật thô.
- Mọi action touch target tối thiểu $44 \times 44\text{px}$, các nút điều hướng và submit chính đạt $48\text{px} - 52\text{px}$.
- Giữ nguyên cấu trúc notched bottom navigation 5 tabs đã khóa.
- Bảo toàn 100% các regex/string assertions trong `tests/mobile/ui-foundation.spec.ts`.
- Mọi mutation thay đổi trạng thái phải gửi kèm header `Idempotency-Key` (UUIDv4) ở tầng transport.
- Duy trì 100% tests pass trên toàn bộ monorepo (`npm test` 316+ tests).

## Review Focus

1. **Modal Backdrop Dismissal**: Khi người dùng nhấn nút đóng hoặc bấm ra ngoài màn hình mờ, lớp phủ backdrop đen mờ phải mờ dần tại chỗ (fade out), tuyệt đối không được trượt tụt theo xuống dưới cùng với sheet.
2. **Date Range Continuous Ribbon**: Khi chọn dải ngày, dải màu xanh ngọc bích phải là một thanh ruy-băng liên tục (continuous ribbon) có cùng chiều cao với vòng tròn ngày (34px), xuất phát từ tâm ngày bắt đầu và kết thúc tại tâm ngày kết thúc, không có góc vuông tràn ra ngoài.
3. **Bento Grid 2x2 Visual Contrast**: Khối 4 chỉ số ở Dashboard không được nén trên một hàng mỏng; các chỉ số quá hạn hoặc bị chặn phải có màu nền và viền nhấn mạnh cảnh báo tương phản rõ rệt trên nền canvas `#f0f7ea`.
4. **Physical Device Execution on User 0**: Toàn bộ kịch bản E2E phải thao tác chính xác trên User 0 của Samsung Galaxy Note 20 Ultra, tự động fallback giữa Wi-Fi (`192.168.0.106:5555`) và USB (`R3CN70ED57A`).
5. **Data Preservation**: Dữ liệu chụp ảnh bằng chứng (Trước/Sau), GPS, và Checklist không bị mất khi thoát màn hình hoặc khi rớt mạng.

---

### Task 1: Khắc Phục Lỗi Backdrop Trượt Trong `BottomSheetModal` (`AppPrimitives.tsx`)

**Files:**
- Modify: `apps/mobile/src/components/AppPrimitives.tsx:352-396`
- Modify: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Consumes: React Native `Animated`, `Modal`, `StyleSheet`.
- Produces: `BottomSheetModal` với 2 hiệu ứng song song độc lập: Backdrop Fade In/Out và Sheet TranslateY Slide Up/Down.

- [x] **Step 1: Viết test trong `tests/mobile/ui-foundation.spec.ts` kiểm tra kiến trúc animation của `BottomSheetModal`**
  Khẳng định `BottomSheetModal` sử dụng `Animated.Value` cho backdrop opacity và sheet translateY, không dùng `<Modal animationType="slide">` trượt toàn bộ lớp phủ.
- [x] **Step 2: Triển khai animation kép trong `BottomSheetModal` (`AppPrimitives.tsx`)**
  Tạo `backdropAnim` (0 -> 1) và `sheetAnim` (1 -> 0 cho translateY). Khi `visible` chuyển từ true sang false, chạy animation đóng trước khi unmount modal.
- [x] **Step 3: Chạy test xác nhận PASS**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
- [x] **Step 4: Kiểm tra lint và typecheck**
  Run: `npm run typecheck --workspace @novyx/mobile`

---

### Task 2: Tái Cấu Trúc Lưới Lịch `DateRangePickerSheet` Thành Continuous Ribbon Track

**Files:**
- Modify: `apps/mobile/src/components/DateRangePickerSheet.tsx:258-298`
- Modify: `apps/mobile/src/components/DateRangePickerSheet.tsx:440-475`
- Modify: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Consumes: `colors`, `radius`, `typography`.
- Produces: Giao diện dải ngày liên tục dạng dải băng ribbon (height 34px) kết nối mượt mà từ tâm ngày đầu đến tâm ngày cuối.

- [x] **Step 1: Viết test kiểm tra cấu trúc ribbon track trong `tests/mobile/ui-foundation.spec.ts`**
  Khẳng định `DateRangePickerSheet` chứa các class ribbon track (`ribbonTrack`, `ribbonStart`, `ribbonEnd`, `ribbonMiddle`) và không áp dụng background chữ nhật lên toàn bộ `dayCell`.
- [x] **Step 2: Cập nhật component render ngày trong `DateRangePickerSheet.tsx`**
  Tách `dayCellWrapper` và thêm layer `ribbonTrack` độc lập phía sau `dayCircle`. Bo tròn 17px tại Thứ Hai và Chủ Nhật.
- [x] **Step 3: Cập nhật StyleSheet trong `DateRangePickerSheet.tsx`**
  Định nghĩa `ribbonTrack` với `height: 34, top: 3, backgroundColor: colors.successSurface`.
- [x] **Step 4: Chạy test xác nhận PASS**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
- [x] **Step 5: Kiểm tra lint và typecheck**
  Run: `npm run typecheck --workspace @novyx/mobile`

---

### Task 3: Tái Thiết Kế 4 Chỉ Số `ManagerDashboard` Thành Bento Grid 2x2 Cao Cấp

**Files:**
- Modify: `apps/mobile/src/screens/manager/ManagerDashboard.tsx:86-91`
- Modify: `apps/mobile/src/screens/manager/ManagerDashboard.tsx:340-385`
- Modify: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Consumes: Tokens từ `@novyx/ui`, `Ionicons`.
- Produces: Khối Bento Grid 2x2 với 4 thẻ độc lập, có icon trạng thái, accent màu cảnh báo rõ ràng khi có việc Quá hạn/Bị chặn, số liệu nổi bật.

- [x] **Step 1: Viết test kiểm tra layout Bento Grid trong `tests/mobile/ui-foundation.spec.ts`**
  Bảo toàn 100% các assertion: `<Metric label="Cây chú ý" value={riskyTrees.length} tone="warning" />`, `const color = value > 0 ? semanticColor : colors.neutralText;`, `numberOfLines={1}`.
- [x] **Step 2: Cập nhật giao diện `Metric` và container `metricsGrid` trong `ManagerDashboard.tsx`**
  Bố cục `flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md`. Mỗi thẻ `Metric` chiếm `flexBasis: '47%', flexGrow: 1`, bo góc 16px, viền hairline, ambient shadow nhẹ, icon trạng thái tương ứng.
- [x] **Step 3: Chạy test xác nhận PASS**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
- [x] **Step 4: Kiểm tra lint và typecheck**
  Run: `npm run typecheck --workspace @novyx/mobile`

---

### Task 4: Nâng Cấp Chiều Sâu & Độ Tương Phản Toàn Bộ Màn Hình Quản Lý & Nhân Viên

**Files:**
- Modify: `apps/mobile/src/screens/manager/ManagerCreateTask.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerReview.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffHome.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffWork.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx`

**Interfaces:**
- Consumes: `AppPrimitives`, tokens, `greenOpsService`.
- Produces: Giao diện toàn app có chiều sâu, tương phản rõ rệt trên nền sương mai `#f0f7ea`, nút bấm thao tác hiện trường 48-52px, đối chiếu ảnh Trước/Sau rõ nét.

- [x] **Step 1: Nâng cấp `ManagerCreateTask.tsx`**
  Hoàn thiện các thẻ lựa chọn dải ngày, cụm cây, nhân viên với độ tương phản cao, nút tạo việc 50px nổi bật.
- [x] **Step 2: Nâng cấp `ManagerReview.tsx`**
  Thẻ đối chiếu ảnh Trước/Sau có khung viền sắc nét, checklist bằng chứng sạch sẽ, nút Phê duyệt / Yêu cầu làm lại trực quan.
- [x] **Step 3: Nâng cấp `StaffHome.tsx` và `StaffWork.tsx`**
  Thẻ ca làm việc hôm nay nổi bật, lộ trình cây có thứ tự rõ ràng, thanh tiến độ hoàn thành sinh động.
- [x] **Step 4: Nâng cấp `StaffProofFlow.tsx`**
  Nút chụp ảnh hiện trường 64px, radar GPS độ chính xác cao, chỉ dẫn checklist rõ ràng bằng tiếng Việt.
- [x] **Step 5: Kiểm tra lint và typecheck**
  Run: `npm run typecheck && npm run lint`

---

### Task 5: Mở Rộng Harness E2E `scripts/mobile-lifecycle-e2e.cjs` Trên User 0 Điện Thoại Thật

**Files:**
- Modify: `scripts/mobile-lifecycle-e2e.cjs`

**Interfaces:**
- Consumes: ADB Wi-Fi (`192.168.0.106:5555`) & USB (`R3CN70ED57A`), User 0.
- Produces: Kịch bản tự động hóa 100% tính năng và chụp ảnh đối chứng visual không lỗi:
  - Khởi động app & đảm bảo đang ở User 0.
  - Quản lý: Kiểm tra Bento Grid 2x2.
  - Quản lý: Mở Tạo việc -> Mở DateRangePickerSheet -> Chọn 3 ngày tới -> Kiểm tra ribbon dải ngày -> Áp dụng -> Tạo việc.
  - Thợ: Xem ca làm -> Check-in 5 bước (GPS, QR, ảnh Trước, Checklist, ảnh Sau) -> Nộp.
  - Quản lý: Mở Hàng chờ nghiệm thu -> Xem Bottom Sheet đối chiếu bằng chứng -> Duyệt.

- [x] **Step 1: Cập nhật cấu hình user mặc định là `0`, tự động dò thiết bị USB hoặc Wi-Fi trong `scripts/mobile-lifecycle-e2e.cjs`**
- [x] **Step 2: Thêm các bước tương tác với BottomSheet (Date Picker, Scope Selector, Review Sheet) kèm chụp ảnh màn hình**
- [x] **Step 3: Chạy thử nghiệm script E2E qua lệnh**
  Run: `node scripts/mobile-lifecycle-e2e.cjs`

---

### Task 6: Nghiệm Thu Thực Tế Trên Thiết Bị Thật & Toàn Bộ Quality Gate

**Files:**
- Test: Toàn bộ monorepo test suites & physical device runtime.

- [x] **Step 1: Chạy toàn bộ test suites monorepo**
  Run: `npx vitest run`
  Expected: 316+ tests pass 100%.
- [x] **Step 2: Chạy kiểm tra TypeScript và ESLint**
  Run: `npm run typecheck && npm run lint`
  Expected: 0 errors, 0 warnings.
- [x] **Step 3: Chạy script E2E trên điện thoại Samsung thật và thu thập ảnh chụp đối chứng**
  Run: `node scripts/mobile-lifecycle-e2e.cjs`
  Expected: 100% ALL MILESTONES PASSED!
- [x] **Step 4: Kiểm tra trực quan ảnh chụp màn hình sau khi cập nhật**
  Xác nhận:
  1. Backdrop modal mờ tại chỗ, không có dải đen trôi theo khi đóng.
  2. Date range ribbon nối mượt mà từ start sang end, không còn ô vuông chữ nhật.
  3. Bento Grid 2x2 nổi bật, có chiều sâu, loại bỏ hoàn toàn cảm giác bệt màu.
