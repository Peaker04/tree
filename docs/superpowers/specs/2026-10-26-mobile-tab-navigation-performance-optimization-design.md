# Đặc tả Thiết kế & Tối ưu Hiệu năng Chuyển Trang Điều Hướng Đáy (`NotchedBottomNav` Performance & Decoupled Navigation)

- **Tài liệu**: `docs/superpowers/specs/2026-10-26-mobile-tab-navigation-performance-optimization-design.md`
- **Ngày tạo**: 2026-10-26
- **Phương pháp**: Superpowers Brainstorming & Architectural Design Spec
- **Phạm vi**:
  - `apps/mobile/src/screens/MobileApp.tsx` (Orchestration & Navigation state)
  - `apps/mobile/src/storage/task/mobileTaskRepository.ts` (SQLite Caching Batching)
  - `apps/mobile/src/screens/staff/StaffArea.tsx` & `StaffTrees.tsx` (Memoization & Virtualized List)
  - `apps/mobile/src/screens/supervisor/SupervisorArea.tsx` (Memoization & Virtualized List)
  - `docs/FUNCTIONAL_NON_FUNCTIONAL_REQUIREMENTS_RULES.md` (`NFR-01`, `NFR-02`, `NFR-03`)
  - `docs/MOBILE_UI_RULES.md` (Locked Bottom Navigation & Offline-first Resilience)

---

## 1. Mục đích & Bối cảnh Vấn đề (Intent & The Why)

Trong quá trình sử dụng thực tế trên thiết bị di động Android (`R3CN70ED57A`), thao tác chuyển đổi giữa các tab điều hướng đáy (`Trang chủ`, `Cây của tôi`, `Công việc` cho Nhân viên/Giám sát và `Tổng quan`, `Cây xanh` cho Quản lý) xuất hiện độ trễ nhận thức (perceived delay) đáng kể, kéo dài từ **400ms đến hơn 2.500ms** (có trường hợp đo được trên E2E lifecycle harness lên tới 4.243ms).

Qua phân tích và chẩn đoán kỹ thuật (Frontend Performance Audit), nguyên nhân gốc rễ xuất phát từ việc **gắn nhầm side-effect đồng bộ mạng vào sự kiện chuyển trang cục bộ**:
1. **Side-effect mạng thừa thãi khi bấm Tab:** Trong `MobileApp.tsx`, sự kiện `onPress` của thanh điều hướng đáy `NotchedBottomNav` đang gọi `void refreshData()` mỗi khi người dùng bấm vào các tab (`MY_TREES`, `WORK`, `HOME` của Staff/Supervisor hoặc `HOME`, `TREES` của Manager).
2. **Chi phí I/O mạng và ghi đĩa SQLite:**
   - `refreshData()` kích hoạt 2 HTTP REST requests đồng thời (`restService.listTrees()` và `restService.listTasks()`).
   - Khi có dữ liệu về, ứng dụng tiếp tục chạy `runtime.taskRepo.cacheTasks(result.data.tasks)`. Hàm này đang duyệt vòng lặp tuần tự `for (const task of tasks)` và thực thi 50 câu lệnh SQL `INSERT ... ON CONFLICT` riêng rẽ qua native JNI bridge của Android, làm nghẽn Event Loop của JavaScript thread.
3. **Mất ổn định bố cục (Layout Shift & Spinner Flashing):**
   - Đầu hàm `refreshData()`, app gọi `setDataSource((curr) => ({ ...curr, loading: true }))`.
   - Điều này làm thẻ Hero Card tại `StaffHome` giật đổi chữ thành *"Đang tải ca làm việc"*, đồng thời các danh sách có `RefreshControl` (`StaffTrees`, `StaffWork`) bị kéo giật vòng quay spinner xuống dù người dùng không hề thực hiện cử chỉ vuốt kéo làm mới (pull-to-refresh).
4. **Vi phạm nguyên tắc Ngoại tuyến (Offline-First):**
   - Khi nhân viên đang tác nghiệp ngoài thực địa (khu vực cây rậm rạp, sóng yếu hoặc ngắt mạng), thao tác chuyển đổi xem công việc hoặc cây đã lưu trong máy lại bị ép thực hiện lệnh gọi mạng REST, gây cảm giác ứng dụng bị treo hoặc báo lỗi không cần thiết.

---

## 2. Mục tiêu, Phi mục tiêu & Chống mục tiêu (Goals, Non-Goals & Anti-Goals)

### 2.1. Mục tiêu (Goals)
1. **Tách rời hoàn toàn thao tác Chuyển Tab khỏi Đồng bộ Mạng (Decouple Navigation from Sync):** Thao tác bấm tab điều hướng đáy chỉ thực hiện chuyển đổi trạng thái hiển thị (`setStaffStep` / `setManagerStep`) cục bộ trong bộ nhớ RAM, đạt tốc độ phản hồi tức thì **< 16ms (chuẩn 60fps)**.
2. **Bảo tồn cơ chế Làm mới Chủ động (User-Initiated Pull-to-Refresh):** Giữ nguyên kết nối `onRefreshData={refreshData}` tại các danh sách cuộn (`ScrollView` / `FlatList`) thông qua `RefreshControl` để người dùng chủ động vuốt màn hình khi thực sự muốn lấy dữ liệu mới nhất từ máy chủ.
3. **Tối ưu hóa ghi đĩa SQLite Caching:** Nâng cấp `SqliteMobileTaskRepository.cacheTasks` để thực thi câu lệnh SQL theo dạng batch hoặc chuẩn bị câu lệnh tối ưu trong transaction duy nhất, loại bỏ việc await tuần tự 50 round-trips qua JNI bridge.
4. **Memoize các phép tính toán dẫn xuất tại Màn hình:** Bọc các phép lọc dữ liệu (`visibleTasks`, `assignedTrees`, `actionableTasks`) trong `StaffArea` và `SupervisorArea` bằng `useMemo`.
5. **Ổn định hóa `FlatList` Virtualization:** Tách `renderItem` trong `StaffTrees.tsx` và `StaffWork.tsx` khỏi inline closures để tránh hủy bỏ và tạo lại DOM ảo trên mỗi lần render.

### 2.2. Phi mục tiêu (Non-Goals)
- Không thay đổi kiến trúc lưu trữ dữ liệu hoặc thay thế SQLite (`expo-sqlite`).
- Không thay đổi cấu trúc dữ liệu hoặc API Contracts (`packages/contracts`).
- Không thay đổi thiết kế giao diện thị giác hoặc cấu trúc 5 vị trí của thanh đáy `NotchedBottomNav` đã được khóa theo `docs/MOBILE_UI_RULES.md`.

### 2.3. Chống mục tiêu (Anti-Goals)
- **Không tự ý gọi lại `refreshData()` trong `useEffect` unconditioned:** Tuân thủ nghiêm ngặt quy tắc kiểm thử `tests/mobile/r2a-lifecycle.spec.ts` (`expect(mobileAppSource).not.toMatch(/useEffect\(\(\) => \{\s*void refreshData\(\)/)`).
- **Không làm mất tính cập nhật của dữ liệu sau khi thực hiện nghiệp vụ (Mutations):** Các hành động làm thay đổi trạng thái nghiệp vụ (Bắt đầu việc, Nộp bằng chứng, Báo cáo sự cố, Duyệt, Yêu cầu làm lại) vẫn kích hoạt đồng bộ dữ liệu sau khi mutation hoàn tất như thiết kế chuẩn.

---

## 3. Các Quyết định Kỹ thuật Chi tiết (Architectural & Technical Decisions)

### Quyết định 1: Loại bỏ `void refreshData()` khỏi sự kiện `onPress` của thanh đáy

Trong `apps/mobile/src/screens/MobileApp.tsx`:
```tsx
// Trước khi tối ưu:
onPress={(id) => {
  if (id === 'QR') {
    setActiveTask(null);
    setStaffStep('QR');
  } else if (id === 'MY_TREES') {
    setActiveTask(null);
    setStaffStep('MY_TREES');
    void refreshData(); // GÂY TRỄ MẠNG
  } else if (id === 'WORK') {
    setActiveTask(null);
    setStaffStep('WORK');
    void refreshData(); // GÂY TRỄ MẠNG
  } else if (id === 'ACCOUNT') {
    setActiveTask(null);
    setStaffStep('ACCOUNT');
  } else {
    setActiveTask(null);
    setStaffStep('HOME');
    void refreshData(); // GÂY TRỄ MẠNG
  }
}}

// Sau khi tối ưu (Tức thì, 0ms I/O):
onPress={(id) => {
  if (id === 'QR') {
    setActiveTask(null);
    setStaffStep('QR');
  } else if (id === 'MY_TREES') {
    setActiveTask(null);
    setStaffStep('MY_TREES');
  } else if (id === 'WORK') {
    setActiveTask(null);
    setStaffStep('WORK');
  } else if (id === 'ACCOUNT') {
    setActiveTask(null);
    setStaffStep('ACCOUNT');
  } else {
    setActiveTask(null);
    setStaffStep('HOME');
  }
}}
```
Tương tự cho thanh điều hướng của Quản lý (`showManagerNav`):
```tsx
// Sau khi tối ưu:
onPress={(id) => {
  setManagerStep(id as ManagerStep);
}}
```

### Quyết định 2: Tối ưu hóa SQLite Cache Bulk Insertion

Trong `apps/mobile/src/storage/task/mobileTaskRepository.ts`:
Hàm `cacheTasks(tasks: Array<TaskDto | CanonicalTaskDto>)` hiện tại:
- Đang lặp `for (const task of tasks)` và thực thi 50 lệnh `await this.db.runAsync(...)`.
- Khi tối ưu: Thực hiện gom nhóm (chunking) theo lô 25 bản ghi thành câu lệnh `INSERT INTO cached_tasks (...) VALUES (...), (...)... ON CONFLICT(id) DO UPDATE ...` hoặc sử dụng một transaction atomic duy nhất với prepared statements, giảm thời gian thực thi từ ~350ms xuống **< 25ms**.

### Quyết định 3: Tối ưu hóa Re-render bằng `useMemo` và `useCallback`

Tại `StaffArea.tsx` và `SupervisorArea.tsx`:
- Bọc toàn bộ các mảng lọc dẫn xuất (`staffTasks`, `openTasks`, `completedTasks`, `waitingReviewTasks`, `actionableTasks`, `visibleTasks`, `assignedTrees`, `visibleAssignedTrees`) trong `useMemo` với dependency `[props.tasks, props.trees, props.authenticatedStaffId, taskFilter, staffTreeQuery, staffTreeFilter]`.
- Giúp component con không bị re-calculate lại hàng chục danh sách khi props không thay đổi.

---

## 4. Đối soát Tiêu chuẩn Nghiệp vụ & Kỹ thuật (Requirements Traceability)

| Tiêu chuẩn | Nội dung quy định | Đáp ứng trong thiết kế tối ưu |
|---|---|---|
| **NFR-01: Performance** | Tránh chi phí mạng và tính toán không cần thiết; tối ưu dựa trên vấn đề thực tế. | Loại bỏ 100% request mạng REST thừa khi đổi tab. Giảm 95% độ trễ ghi SQLite. |
| **NFR-02: Perceived Performance** | Thao tác đổi góc nhìn phải mượt mà, phản hồi tức thì. | Chuyển tab đạt 60fps (< 16ms), phản hồi ngay khi ngón tay chạm vào nút. |
| **NFR-03: Layout Stability** | Dữ liệu bất đồng bộ không làm giao diện giật hoặc nhảy vị trí bất ngờ. | Loại bỏ tình trạng giật chữ thẻ Hero Home và tự ý bung vòng quay spinner. |
| **Offline-First Resilience** | Đảm bảo sử dụng đầy đủ các màn hình khi mất mạng ngoài thực địa. | Khi không có internet, người dùng vẫn xem được toàn bộ danh sách việc và cây đã cache. |
| **Pull-to-Refresh Invariant** | Người dùng có quyền chủ động cập nhật dữ liệu. | Giữ nguyên `RefreshControl` trên tất cả các danh sách cuộn. |

---

## 5. Tiêu chí Nghiệm thu (Acceptance Criteria)

1. **Hiệu năng chuyển tab**:
   - Khi bấm chuyển giữa các tab `Trang chủ` $\leftrightarrow$ `Cây của tôi` $\leftrightarrow$ `Công việc` $\leftrightarrow$ `Tài khoản`, giao diện chuyển đổi tức thì, không có độ trễ nhận thức (latency < 32ms).
   - Không có request HTTP nào được gửi đi trong lúc bấm chuyển tab.
   - Không xuất hiện vòng quay `RefreshControl` tự động bung ra khi đổi tab.
2. **Tính toàn vẹn chức năng**:
   - Thao tác kéo vuốt màn hình (Pull-to-Refresh) tại các trang vẫn hoạt động bình thường và tải lại dữ liệu mới nhất từ server.
   - Thao tác nộp bằng chứng, hoàn thành việc, phê duyệt vẫn kích hoạt cập nhật dữ liệu chính xác sau mutation.
3. **Kiểm thử tự động**:
   - `npm run typecheck --workspace @novyx/mobile` $\to$ PASS 0 errors.
   - `npm run lint` $\to$ PASS 0 errors.
   - `npm run test` $\to$ PASS 328/328 tests.
   - Chạy `scripts/mobile-lifecycle-e2e.cjs` trên thiết bị vật lý `R3CN70ED57A` đạt 100% PASS với độ trễ chuyển tab giảm rõ rệt.
