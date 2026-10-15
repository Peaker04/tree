# Thiết Kế Chi Tiết: Nâng Cấp UI/UX Toàn Cục & Chuẩn Hóa E2E Closed-Loop Test Harness

> **Phương pháp luận**: Superpowers Brainstorming & Karpathy Guidelines  
> **Dự án**: NOVYX GreenOps Mobile App (Expo SDK 57 / React 19 / Samsung Galaxy Note 20 Ultra)  
> **Ngày phê duyệt**: 2026-10-07  
> **Phương án thực hiện**: Phương Án A (Phân cấp khối thông tin động, Dải chọn ngày Capsule liền mạch, Lớp phủ Modal Botanical trong trẻo, Kịch bản E2E khép kín thực tế)

---

## 1. Mục Tiêu & Phạm Vi Công Việc

### 1.1. Phạm vi UI/UX Toàn Cục
1. **Nâng cấp Màn hình Tổng quan Quản lý (`ManagerDashboard.tsx`)**:
   - Loại bỏ hoàn toàn lưới 4 ô vuông bằng phẳng (2x2) mang tính "quê mùa" (`[Chờ duyệt]`, `[Bị chặn]`, `[Quá hạn]`, `[Cây chú ý]`).
   - Xây dựng **Bảng Điều Khiển Vận Hành Phân Cấp (Hierarchical Operations Hub)**:
     - **Hero Focus Banner (Khối trọng tâm ưu tiên số 1)**: Nổi bật tức thì trạng thái khẩn cấp nhất (`Quá hạn` > `Bị chặn` > `Chờ duyệt` > `Vận hành ổn định`) với nền màu ấm áp, huy hiệu nổi bật và nút chuyển nhanh tới công việc.
     - **Asymmetric Metrics Strip (Dải chỉ số tinh gọn)**: Nhóm các chỉ số phụ theo hàng ngang phân cấp, sử dụng icon vector ngữ nghĩa và kiểu chữ số sắc nét, loại bỏ khung hộp vuông thô cứng.
     - **Routine Progress Card (Tiến độ chăm sóc định kỳ)**: Giữ vững và làm mượt mà thanh tiến độ hoàn thành cây xanh đô thị.
2. **Sửa lỗi Dải chọn ngày (`DateRangePickerSheet.tsx`)**:
   - Khắc phục triệt để hiện tượng 2 đầu hình tròn nhưng dải kéo theo là hình chữ nhật sắc cạnh, tạo cảm giác chắp vá.
   - Tái cấu trúc thành **Dải Capsule Liền Khối (Continuous Pill Ribbon)**:
     - Đầu bắt đầu (`isStart`): Bo tròn hoàn hảo góc trái (`borderTopLeftRadius: 17, borderBottomLeftRadius: 17`), chạy mượt sang phải.
     - Đầu kết thúc (`isEnd`): Bo tròn hoàn hảo góc phải (`borderTopRightRadius: 17, borderBottomRightRadius: 17`), nhận mượt từ trái.
     - Các ngày trong khoảng (`inRange`): Dải màu xanh ngọc dịu nhẹ (`colors.successSurface`) kết nối liền mạch, tự động bo góc tại ranh giới tuần (Thứ 2 và Chủ nhật) và đầu/cuối tháng.
3. **Sửa lỗi Lớp phủ Nền Modal / Bottom Sheet (`AppPrimitives.tsx`)**:
   - Khắc phục hiện tượng nền đen nhạt nặng nề (`rgba(10, 25, 18, 0.48)`) và vệt đen chạy theo khi bấm quay lại (Back).
   - Chuyển sang **Soft Botanical Scrim** (`rgba(12, 28, 20, 0.28)`) tạo độ trong trẻo cao cấp.
   - Tối ưu hóa chu kỳ đóng (`onDismiss` / `onRequestClose`): Thu hồi lớp phủ mượt mà, triệt tiêu hoàn toàn độ trễ Dialog trên Android.

### 1.2. Phạm vi Kiểm Thử E2E (`scripts/mobile-lifecycle-e2e.cjs`)
1. **Khắc phục Báo cáo Đạt Ảo (Eliminate Fake PASS)**:
   - Sửa tọa độ cuộn và chạm tại bước Quản lý Duyệt: Swiping up trước khi chọn để đưa thẻ "Duyệt nghiệm thu" (Card 1) và nút "Xác nhận quyết định" vào đúng vùng chạm thực tế.
   - Đảm bảo sau khi bấm nút xác nhận, màn hình chuyển trạng thái thực sự sang danh sách hoặc trạng thái hoàn tất.
2. **Kịch bản Làm Lại (Rework Lifecycle)**:
   - Quản lý mở task trong hàng chờ duyệt $\to$ Yêu cầu làm lại kèm lý do preset $\to$ Xác nhận.
   - Thợ mở danh sách $\to$ Lọc "Làm lại" $\to$ Mở chi tiết việc $\to$ Chụp lại ảnh cần khắc phục $\to$ Nộp lại báo cáo.
3. **Kịch bản Tính năng Toàn Cục (Features & Catalogs)**:
   - Tra cứu cây tức thì qua nút FAB trung tâm (Notched Bottom Nav).
   - Kiểm thử Danh mục hồ sơ cây và bộ lọc sức khỏe ("Khỏe mạnh", "Cần chăm sóc").
   - Kiểm thử Trung tâm thông báo điều phối và tính năng Đánh dấu đã đọc.
4. **Không Spam Task Vô Nghĩa**:
   - Sử dụng các task thực tế có sẵn trong cơ sở dữ liệu thay vì liên tục gọi API tạo task rác.

---

## 2. Thiết Kế Kiến Trúc & Chi Tiết Kỹ Thuật

### 2.1. Cấu Trúc Bảng Điều Khiển Vận Hành (`ManagerDashboard.tsx`)
```tsx
// 1. Hero Operational Action Card (Ưu tiên động theo trọng số nghiệp vụ)
<View style={[styles.heroCard, heroPriorityStyle]}>
  <View style={styles.heroHeader}>
    <View style={styles.heroIconBadge}>
      <Ionicons name={heroIcon} size={20} color={heroIconColor} />
    </View>
    <View style={styles.flex}>
      <Text style={styles.heroPretitle}>{heroLabel}</Text>
      <Text style={styles.heroTitle}>{heroTitle}</Text>
    </View>
    {heroCount > 0 ? (
      <View style={styles.heroBadge}>
        <Text style={styles.heroBadgeText}>{heroCount}</Text>
      </View>
    ) : null}
  </View>
  <Text style={styles.heroDescription}>{heroBody}</Text>
  {heroAction ? (
    <Button variant="primary" size="compact" icon={heroActionIcon} onPress={heroActionPress}>
      {heroActionLabel}
    </Button>
  ) : null}
</View>

// 2. Streamlined Operational Metrics Bar (Thanh chỉ số phân cấp tinh tế)
<View style={styles.metricsBar}>
  <MetricPill label="Chờ duyệt" count={pendingReview.length} tone="warning" icon="document-text-outline" onPress={() => props.setActiveStep('REVIEW')} />
  <MetricPill label="Bị chặn" count={blocked.length} tone="danger" icon="alert-circle-outline" />
  <MetricPill label="Quá hạn" count={overdue.length} tone="danger" icon="time-outline" />
  <MetricPill label="Cây chú ý" count={riskyTrees.length} tone="warning" icon="leaf-outline" onPress={() => props.onNavigateToTrees?.()} />
</View>
```

### 2.2. Dải Capsule Liền Mạch Cho Date Range Picker (`DateRangePickerSheet.tsx`)
```tsx
// Thuật toán xác định bán kính bo tròn cho từng ô ngày trong lưới lịch
const isStart = cell.dateStr === selectedStart;
const isEnd = cell.dateStr === selectedEnd;
const isSingleSelected = isStart && isEnd;
const inRange = selectedStart && selectedEnd && cell.dateStr > selectedStart && cell.dateStr < selectedEnd;

// Dải ribbon track nằm chìm dưới vòng tròn ngày:
// - Ngày bắt đầu: bo tròn bên trái (radius 17), trải rộng sang mép phải
// - Ngày kết thúc: nhận từ mép trái, bo tròn bên phải (radius 17)
// - Ngày ở giữa: phủ từ mép trái sang mép phải, tự bo tròn nếu ở biên tuần (Thứ 2 hoặc CN)
<View
  style={[
    styles.ribbonTrack,
    isStart && !isSingleSelected && styles.ribbonStartPill,
    isEnd && !isSingleSelected && styles.ribbonEndPill,
    inRange && styles.ribbonMiddlePill,
    isMonday && styles.ribbonRoundLeft,
    isSunday && styles.ribbonRoundRight,
  ]}
/>
```

### 2.3. Tối Ưu Lớp Phủ Modal (`AppPrimitives.tsx`)
```tsx
sheetBackdrop: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(12, 28, 20, 0.28)', // Soft botanical haze thay vì đen nặng
},
```
- Khi `visible` chuyển từ `true` sang `false`, đồng bộ animation kết thúc để đóng `Modal` ngay lập tức, không để lại Dialog vô hình cản trở điều hướng.

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

1. **Manager Dashboard**:
   - Không còn 4 ô vuông chia đều (2x2).
   - Có điểm nhấn thị giác rõ ràng (Hero Focus Card) và thanh chỉ số thanh mảnh, cao cấp.
2. **Date Range Picker**:
   - Khi chọn từ ngày này sang ngày khác, dải màu nối giữa 2 ngày là một khối capsule bo tròn liền mạch, không có góc vuông thừa hay mảnh ghép chữ nhật lồi ra.
3. **Modal / Bottom Sheet**:
   - Nền mờ dịu mắt, hòa quyện với phong cách thực vật tự nhiên (Botanical).
   - Bấm Back hoặc đóng modal không còn vệt đen chạy theo.
4. **E2E Automation Harness**:
   - Chạy `npm run mobile:e2e:lifecycle` hoặc `node scripts/mobile-lifecycle-e2e.cjs --scenario=all` đạt 100% PASS chân thực.
   - Tất cả ảnh chụp màn hình trong `tmp/mobile-smoke/` phản ánh đúng màn hình đích của từng bước nghiệp vụ.
