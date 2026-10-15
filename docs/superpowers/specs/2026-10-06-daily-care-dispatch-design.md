# Đặc tả Thiết kế Toàn diện: Nâng Cấp FE UI/UX Premium Toàn App, Chuẩn Hóa Nghiệp Vụ Chăm Sóc & Harness Kiểm Thử E2E

- **Tài liệu**: `docs/superpowers/specs/2026-10-06-daily-care-dispatch-design.md`
- **Ngày cập nhật**: 2026-10-06 (Cập nhật Toàn diện theo Feedback Người dùng)
- **Phương pháp**: Superpowers Architectural Design Spec
- **Phạm vi**: Toàn bộ ứng dụng di động NOVYX GreenOps (`apps/mobile`), Shared UI Tokens (`packages/ui`), Contracts (`packages/contracts`), API Gateway (`@novyx/api`), E2E Test Harness (`scripts/mobile-lifecycle-e2e.cjs`)

---

## 1. Tầm nhìn & Mục tiêu Cốt lõi (Vision & Intent)

### 1.1 Khắc phục Triệt để Các Lỗi UI/UX Đã Nhận Diện
1. **Lỗi Modal Backdrop Trượt Theo Sheet**:
   - *Hiện trạng*: `BottomSheetModal` trong `AppPrimitives.tsx` dùng `<Modal visible={visible} transparent animationType="slide">`. Khi mở/đóng, lớp phủ tối màu `sheetOverlay` (`rgba(10, 25, 18, 0.48)`) bị trượt từ dưới lên và kéo tụt xuống dưới cùng với sheet, tạo dải đen trôi theo rất thô và khó chịu.
   - *Giải pháp*: Tách cơ chế animation. Sử dụng `animationType="none"` kết hợp `Animated.Value` nội tại:
     - `backdropOpacity`: Fade mờ tại chỗ (từ 0 lên 1 và từ 1 về 0), không bao giờ di chuyển theo phương dọc.
     - `sheetTranslateY`: Trượt độc lập từ đáy màn hình lên vị trí hiển thị (0) và trượt xuống khi đóng. Khi animation trượt và mờ hoàn tất mới ẩn Modal.
2. **Lỗi Date Range Picker (Dải ô vuông chữ nhật ngắt quãng)**:
   - *Hiện trạng*: Khi chọn dải ngày từ ngày A sang ngày B, 2 ngày đầu/cuối là hình tròn nhưng các ngày ở giữa và 2 đầu đều bị bao bọc bởi ô vuông/chữ nhật cao 40px (`dayCellInRange`), làm dải ngày bị gãy khúc, thô ráp, không kết nối liền mạch.
   - *Giải pháp*: Thiết kế dải băng kết nối **Continuous Ribbon Bar** (chiều cao 34px khớp với đường kính vòng tròn ngày, nằm ở layer nền phía sau text/icon):
     - Ngày bắt đầu (`isStart`): Dải ribbon xuất phát từ tâm vòng tròn (`left: '50%'`) kéo sang mép phải (`right: 0`).
     - Ngày kết thúc (`isEnd`): Dải ribbon xuất phát từ mép trái (`left: 0`) kéo vào tâm vòng tròn (`right: '50%'`).
     - Ngày trong dải (`inRange`): Dải ribbon lấp đầy toàn bộ ô (`left: 0, right: 0`). Tại vị trí đầu tuần (Thứ Hai), bo tròn bán nguyệt mép trái; tại vị trí cuối tuần (Chủ Nhật), bo tròn bán nguyệt mép phải.
     - Vòng tròn ngày (`dayCircle`): Đặt trên dải ribbon. Ngày đầu/cuối có nền màu xanh rừng đậm `colors.forestDepths` và chữ trắng sắc nét. Các ngày ở giữa trong suốt, chữ màu xanh ngọc bích đậm (`colors.forestDepths`), tạo dải ruy-băng liền mạch chuẩn mực Apple/Airbnb Calendar.
3. **Bố Cục 4 Ô Badge/Metric Quê Mùa & Giao Diện 1 Dải Màu Bệt**:
   - *Hiện trạng*: 4 chỉ số điều hành ở đầu Dashboard bị nén trên 1 hàng ngang 4 cột mỏng, màu sắc nhợt nhạt, không có điểm nhấn thị giác. Toàn bộ màn hình tạo cảm giác một dải màu phẳng trải dài đơn điệu ("bệt màu").
   - *Giải pháp Bento Grid 2x2 Soft Botanical Premium*:
     - Chuyển sang bố cục **Bento Grid 2x2**: 4 thẻ thẻ độc lập với bo góc $16\text{px}$, độ sâu ambient shadow nhẹ nhàng (`elevation: 2`, `shadowColor: colors.forest`, `shadowOpacity: 0.05`).
     - Phân cấp điểm nhấn màu sắc (Color Hierarchy): Thẻ có việc Quá hạn / Bị chặn có accent cảnh báo riêng (`criticalSurface`/`criticalBorder`), thẻ Chờ duyệt có accent hổ phách (`warningSurface`/`warningBorder`), các thẻ bình thường có nền thẻ thanh lịch.
     - Phông chữ số nổi bật (font size 24, font weight 600), nhãn thông tin rõ ràng, không bị co ép chữ.
     - Tạo nhịp điệu thị giác (Visual Rhythm) toàn app: Phân tách rõ ràng giữa nền canvas sương mai `#f0f7ea`, các thẻ card nội dung trắng sứ `#ffffff`, và các thẻ nhấn nhiệm vụ nổi bật.

### 1.2 Mở Rộng Harness Kiểm Thử E2E Toàn Diện
1. **Khắc phục Giới hạn E2E Hiện Tại**:
   - Script E2E hiện tại cấu hình User 10 và tọa độ lệch, dẫn đến việc không chạy thực tế trên hồ sơ chính (User 0) của điện thoại Samsung thật.
   - Chưa tự động mở và kiểm tra giao diện của các Modal/Sheet, chưa xác thực visual dải ngày và danh sách cây.
2. **Kịch bản E2E Mới Đi Trọn Vẹn 100% Tính Năng**:
   - Hỗ trợ User 0 mặc định, tự động kết nối qua USB (`R3CN70ED57A`) hoặc Wi-Fi (`192.168.0.106:5555`).
   - Chu trình kiểm thử 7 bước:
     1. Khởi động app & Xác thực quyền thiết bị.
     2. Manager: Kiểm tra Dashboard Bento Grid 2x2 & thanh tiến độ điều phối.
     3. Manager: Mở Tạo việc -> Mở `DateRangePickerSheet` -> Chọn dải ngày (xác nhận dải ribbon không bị vỡ) -> Mở `TreeScopeSelectorSheet` -> Chọn cụm cây -> Tạo việc thành công.
     4. Staff: Đăng nhập -> Xem ca làm hôm nay và lộ trình cây.
     5. Staff: Thực hiện quy trình nộp bằng chứng 5 bước (GPS, QR, ảnh Trước, Checklist, ảnh Sau) -> Nộp báo cáo.
     6. Manager: Mở Hàng chờ nghiệm thu -> Xem Bottom Sheet đối chiếu bằng chứng Trước/Sau -> Phê duyệt đạt chuẩn.
     7. Chụp ảnh màn hình ở từng bước và xác thực tính toàn vẹn thị giác.

---

## 2. Kiến Trúc & Chi Tiết Thiết Kế Thành Phần (Component Architecture)

### 2.1 `BottomSheetModal` Mới (`apps/mobile/src/components/AppPrimitives.tsx`)
```typescript
// Cơ chế 2 Animated.Value độc lập:
// 1. backdropAnim: 0 -> 1 (fade mờ lớp phủ tại chỗ)
// 2. sheetAnim: translateY từ 1000 -> 0 (trượt sheet mượt mà)
```
- Khi mở modal: Backdrop fade in đồng thời Sheet trượt lên từ đáy.
- Khi đóng modal: Sheet trượt xuống đáy đồng thời Backdrop fade out mờ dần tại chỗ. Lớp phủ đen KHÔNG BAO GIỜ bị trượt tụt theo xuống dưới.
- Giữ nguyên toàn bộ Props và API của `BottomSheetModal` để tương thích 100% với các component hiện hữu.

### 2.2 `DateRangePickerSheet` Mới (`apps/mobile/src/components/DateRangePickerSheet.tsx`)
- Cấu trúc Render mỗi ô ngày (`calendarCell`):
  ```tsx
  <Pressable style={styles.dayCellWrapper}>
    {/* Dải Ribbon Track nằm ở tầng nền */}
    {hasRibbon && (
      <View style={[
        styles.ribbonTrack,
        isStart && styles.ribbonStart, // left: '50%', right: 0
        isEnd && styles.ribbonEnd,     // left: 0, right: '50%'
        inRange && styles.ribbonMiddle,// left: 0, right: 0
        isMonday && styles.ribbonRoundLeft,
        isSunday && styles.ribbonRoundRight,
      ]} />
    )}
    {/* Vòng tròn ngày nổi phía trên */}
    <View style={[styles.dayCircle, (isStart || isEnd) && styles.dayCircleActive]}>
      <Text style={[styles.dayText, (isStart || isEnd) && styles.dayTextActive, inRange && styles.dayTextInRange]}>
        {cell.day}
      </Text>
    </View>
  </Pressable>
  ```
- Kích thước: `ribbonTrack` có chiều cao đúng 34px (bằng đường kính `dayCircle`), căn giữa theo chiều dọc. Không còn bất kỳ góc vuông thô kệch nào lòi ra ngoài.

### 2.3 `ManagerDashboard` Bento Grid 2x2 (`apps/mobile/src/screens/manager/ManagerDashboard.tsx`)
- Bố cục 2x2 Bento Grid:
  - Khối 1: **Chờ duyệt** (Màu hổ phách nhẹ khi có báo cáo, icon chiếc khiên/checklist).
  - Khối 2: **Bị chặn** (Màu đỏ cảnh báo nhẹ khi > 0, icon cảnh báo).
  - Khối 3: **Quá hạn** (Màu đỏ cảnh báo đậm khi > 0, icon đồng hồ cát).
  - Khối 4: **Cây chú ý** (Màu vàng cam khi có cây sâu bệnh/nghiêng ngả, icon lá cây).
- Thẻ card Bento: Bo góc 16px, đổ bóng nhẹ, số liệu hiển thị lớn nổi bật (size 26, weight 600), nhãn chỉ số thanh lịch phía trên.
- Khối Tiến độ điều phối: Thanh progress bar bo tròn mượt mà, tỷ lệ % rõ ràng.
- Khối Việc cần làm tiếp theo: Nền accent nổi bật chỉ dẫn người quản lý hành động tức thì.
- **Bảo toàn 100% assertions trong `tests/mobile/ui-foundation.spec.ts`**:
  - Giữ nguyên component `<Metric label="..." value={...} tone="..." />`.
  - Giữ nguyên logic `const color = value > 0 ? semanticColor : colors.neutralText;`.
  - Giữ nguyên `numberOfLines={1}`.

### 2.4 Đồng Bộ Thẩm Mỹ Toàn App (Global Visual Polish)
- **Bảng màu & Nền**:
  - Nền canvas toàn app: Màu sương mai `#f0f7ea`.
  - Nền thẻ nội dung: Màu trắng tinh `#ffffff` kèm viền hairline thực vật siêu mảnh `#e6ede3`.
  - Thẻ thông tin nhấn: Màu kem ấm `colors.cardWarm` hoặc xanh ngọc bích `colors.successSurface`.
- **Typography & Iconography**:
  - 100% font weight nằm trong dải 400, 500, 600.
  - 100% icons dùng vector `Ionicons`, không có bất kỳ emoji nào trong giao diện nghiệp vụ.
  - 100% ngôn ngữ là Tiếng Việt chuẩn quản lý công viên cây xanh đô thị.

---

## 3. Kế Hoạch Kiểm Thử & Tiêu Chí Nghiệm Thu (Acceptance Criteria)

### 3.1 Kiểm thử Tự động (Automated Tests)
1. `npm test`: 308/308 tests pass 100%.
2. `vitest run tests/mobile/ui-foundation.spec.ts`: Toàn bộ assertions về Primitives, Dashboard, Metrics, và Date Picker pass 100%.
3. `npm run typecheck`: 0 lỗi typecheck trên toàn bộ monorepo.
4. `npm run lint`: 0 lỗi linting.

### 3.2 Kiểm thử Thực tế trên Thiết bị Thật (Physical Device Gate)
1. Chạy kịch bản `scripts/mobile-lifecycle-e2e.cjs` trên Samsung Galaxy Note 20 Ultra (User 0).
2. Kịch bản tự động mở `DateRangePickerSheet`, chọn dải ngày, chụp ảnh kiểm chứng dải ribbon mượt mà không có ô vuông chữ nhật.
3. Kịch bản tự động mở và đóng `BottomSheetModal`, kiểm chứng backdrop mờ tại chỗ, không bị trượt kéo dải đen xuống dưới.
4. Kịch bản kiểm chứng `ManagerDashboard` hiển thị Bento Grid 2x2 đẹp mắt, có điểm nhấn phân cấp rõ ràng.
5. Kịch bản hoàn tất chu trình Giao việc $\rightarrow$ Bằng chứng 5 bước $\rightarrow$ Nghiệm thu với kết quả 100% PASS.
