# Immersive Botanical Navigation Bar Architecture Specification

**Date:** 2026-10-27  
**Status:** Approved by Operator (Option 1)  
**Author:** Mobile & FE Lead Architect  
**Platform:** Dual-Platform (iOS Primary HIG & Samsung Galaxy Note 20 Ultra Android Testbed)  
**Standard:** Living Botanical Operational Design System / Expo SDK 57 / React Native 0.86  
**Target:** `apps/mobile/src/components/AppPrimitives.tsx`, `apps/mobile/src/screens/`, `.agents/memory/UI_UX_MEMORY.md`

---

## 1. Problem Statement & Root Cause

### 1.1 The Anti-Pattern: Pushing Content via Global Padding (Symptom Patching)
* Gán `paddingTop: insets.top` lên `styles.root` tạo ra một khoảng trống giả tạo (gutter) ở đỉnh đầu, khiến background bị đứt đoạn, màn hình không đạt chuẩn Edge-to-Edge của iOS HIG.
* Khi đặt `<ScreenHeader>` bên trong `<ScrollView>` hoặc `<FlatList>`, khi người dùng cuộn trang, tiêu đề và các nút trôi trực tiếp vào bên dưới Dynamic Island và đồng hồ hệ thống (`13:32`), gây cắt chữ hoặc đè chữ lên nhau (như bức ảnh bằng chứng `4dd8d9e3-...`).

---

## 2. Architecture & Design Principles (Option 1: Immersive Botanical Navigation Bar)

### 2.1 Principle 1: Edge-to-Edge Canvas with Root Freedom
* `MobileApp.tsx` (`styles.root`) mở rộng toàn bộ canvas từ tọa độ $Y = 0$ đến hết mép dưới màn hình với màu nền thương hiệu `#faf7ef` (`colors.background`).
* Tuyệt đối không gán `paddingTop` cứng lên `styles.root`. Toàn bộ quyền điều phối vùng an toàn đỉnh thuộc về **Thành phần Navigation Bar chuyên trách**.

### 2.2 Principle 2: Dedicated Immersive `ScreenHeader` Component
* Nâng cấp `ScreenHeader` trong `apps/mobile/src/components/AppPrimitives.tsx` thành một thanh điều hướng chuẩn mực:
  - Tự động tiêu thụ `const insets = useSafeAreaInsets()`.
  - Khối chứa ngoài cùng phủ màu nền (mặc định: `colors.background`, hoặc `surface_dark: '#020617'` cho màn hình máy ảnh) tràn lên đỉnh đầu với:
    ```tsx
    paddingTop: insets.top
    ```
  - Chiều cao dải tương tác bên dưới: cố định `52dp` (chuẩn công thái học iOS chạm ngón tay).
  - Nội dung tương tác (Nút quay lại, Tiêu đề, Dòng phụ, Nút thao tác phải) được căn giữa trong dải `52dp` này, nằm cách biệt hoàn toàn bên dưới Dynamic Island và Status Bar.
  - Viền dưới tinh tế: `borderBottomWidth: StyleSheet.hairlineWidth`, màu `colors.hairlineBorder`.

### 2.3 Principle 3: Anchored Screen Shell Architecture
* Mọi màn hình chuẩn hóa theo bố cục 2 tầng độc lập:
  ```tsx
  <View style={styles.screenContainer}>
    {/* Tầng 1: Navigation Bar neo cố định ở đỉnh, tích hợp Safe Area */}
    <ScreenHeader title="..." subtitle="..." onBack={...} action={...} />

    {/* Tầng 2: Vùng nội dung cuộn bên dưới */}
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Thẻ, danh sách, form cuộn mượt mà bên dưới NavBar */}
    </ScrollView>
  </View>
  ```
* **Hành vi thị giác**: Khi cuộn, nội dung lướt chìm êm ái ra phía sau `ScreenHeader`. Không bao giờ có chữ nào bị trôi lên đồng hồ hay chạm vào tai thỏ.

---

## 3. Data Contracts & Interfaces

### 3.1 `ScreenHeaderProps`
```ts
export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  dark?: boolean; // Hỗ trợ màn hình máy ảnh / chế độ tối
  borderBottom?: boolean; // Hiển thị viền phân tách mờ khi cuộn
}
```

---

## 4. Verification & Acceptance Criteria

1. **Bố cục màn hình Tài khoản, Trang chủ, Giao việc, Duyệt**:
   - Nền màu kem thảo mộc phủ tràn lên tận viền kính trên cùng của iPhone ($Y = 0$).
   - Tiêu đề "Tài khoản" và dòng phụ "Thông tin từ phiên đăng nhập hiện tại" hiển thị trọn vẹn 100%, nằm thoáng đãng bên dưới Dynamic Island và đồng hồ `13:32`.
2. **Hành vi cuộn**: Khi cuộn danh sách lên, nội dung biến mất êm ái bên dưới thanh header neo cố định.
3. **Màn hình chụp ảnh thực địa**: Nút Back và tiêu đề camera lùi xuống dưới Dynamic Island với nền đen `#020617` tràn đỉnh tự nhiên.
4. **Chất lượng**: 100% typecheck pass, 0 lint warnings, tất cả test cases pass.
