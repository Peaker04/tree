# Mobile Native Map and Widget Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the mobile map display to an authentic Google Maps look, eliminate GPS measurement UI flicker, and standardize widget/modal animations per project design rules.

**Architecture:** Expo SDK 57 / React Native 0.86 / Living Botanical Operational  
**Device Context:** Samsung Galaxy Note 20 Ultra (`R3CN70ED57A`), Android 13, 1080×2316 screen.

---

### Task 1: Android LayoutAnimation & BottomSheetModal Travel Polish

**Files to modify:**
- `apps/mobile/index.ts`
- `apps/mobile/src/components/AppPrimitives.tsx`

- [x] **Step 1: Enable experimental layout animation on Android**
  In `apps/mobile/index.ts`, add:
  ```ts
  import { Platform, UIManager } from 'react-native';
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  ```
- [x] **Step 2: Dynamic off-screen travel distance for `BottomSheetModal`**
  In `apps/mobile/src/components/AppPrimitives.tsx`:
  - Replace the static `450` travel distance with dynamic window height from `Dimensions.get('window').height`.
  - Ensure slide-down exit completely clears tall screens before unmounting.
- [x] **Step 3: Verification**
  Run `npm run typecheck --workspace @novyx/mobile` and `npm run lint`.

---

### Task 2: Standardize Modals (`ManualTreeCodeModal` & `TreeQrModal`)

**Files to modify:**
- `apps/mobile/src/components/ManualTreeCodeModal.tsx`
- `apps/mobile/src/components/presentation/TreeQrModal.tsx`

- [x] **Step 1: Fix `ManualTreeCodeModal` layout for keyboard and scrolling**
  In `apps/mobile/src/components/ManualTreeCodeModal.tsx`:
  - Remove fixed `maxHeight: 460` and the squashing `KeyboardAvoidingView`.
  - Structure `BottomSheetModal` with `maxHeight="85%"`.
  - Place search input in a sticky header area, and set `FlatList` to `flex: 1` with `keyboardShouldPersistTaps="handled"`.
- [x] **Step 2: Migrate `TreeQrModal` to use `BottomSheetModal`**
  In `apps/mobile/src/components/presentation/TreeQrModal.tsx`:
  - Replace raw `<Modal>` with `<BottomSheetModal>`.
  - Align headers, close buttons, and padding to design system tokens.
- [x] **Step 3: Verification**
  Run `npm run typecheck --workspace @novyx/mobile` and `npm run lint`.

---

### Task 3: Eliminate GPS "Lấy GPS" Layout Thrashing & Flashing

**Files to modify:**
- `apps/mobile/src/screens/staff/StaffProofFlow.tsx`

- [x] **Step 1: Prevent premature permission card mounting**
  In `StaffProofFlow.tsx`:
  - In `refreshDeviceLocation`: Do NOT prematurely trigger `setGpsPermissionVisible(true)`.
  - Directly invoke `readDeviceLocationAfterPermission()` which sets `locating = true` on the button.
  - If permission is denied or blocked after the request completes, set `gpsPermissionVisible(true)` or open a bottom sheet.
- [x] **Step 2: Clean `permissionStateNode` placement in `TreeCheckinMap`**
  Ensure `{permissionStateNode}` does not render as a layout-shifting element between coordinates and buttons when permission is granted.
- [x] **Step 3: Verification**
  Run `npm run typecheck --workspace @novyx/mobile` and `npm run lint`.

---

### Task 4: Modernize `WebMapView` (Google Roadmap Tiles, Geofence Sync & Pan/Recenter)

**Files to modify:**
- `apps/mobile/src/components/presentation/WebMapView.tsx`

- [x] **Step 1: Switch tile provider to Google Maps Roadmap**
  In `apps/mobile/src/components/presentation/WebMapView.tsx`:
  - Update tile URI formula to:
    ```ts
    const serverIdx = (tx + ty) % 4;
    const uri = `https://mt${serverIdx}.google.com/vt/lyrs=m&x=${tx}&y=${ty}&z=${zoom}`;
    ```
  - This replaces the yellow ArcGIS map with the familiar, clean Google Maps colorway (white roads, soft botanical green parks, pale blue water, sharp Vietnamese labels).
- [x] **Step 2: Synchronize visual geofence circle with `effectiveRadius`**
  - Calculate `effectiveRadius = Math.max(15, locationAccuracyMeters ?? 15) + 5`.
  - Compute `geofenceRadiusPx = Math.round(effectiveRadius / metersPerPixel)`.
  - The green geofence circle drawn on screen now matches the exact radius required by `checkInTask`.
- [x] **Step 3: Add Pan/Drag Gestures and Recenter Controls**
  - Implement a bounded `panOffset` (`{ x: number, y: number }`) using `PanResponder`.
  - Add quick action buttons:
    - `[+]` / `[-]` zoom controls.
    - `[Cây]` button to re-center viewport on tree.
    - `[Tôi]` button (when GPS is captured) to re-center viewport on user location.
- [x] **Step 4: Remove dead mock code and confusing attribution**
  - Clean dead `engine: 'google' | 'leaflet'` toggle state while preserving backward-compatible props.
  - Update attribution pill to `Google Maps • [coordinates]`.
- [x] **Step 5: Verification**
  Run `npm run typecheck --workspace @novyx/mobile` and `npm run lint`.

---

### Task 5: End-to-End Acceptance Verification on Physical Device

**Files to run:**
- `scripts/mobile-role-acceptance-e2e.cjs`

- [x] **Step 1: Run complete typecheck and lint suite**
  ```powershell
  npm run typecheck
  npm run lint
  npx vitest run tests/mobile/ui-foundation.spec.ts
  ```
- [x] **Step 2: Execute physical acceptance test on Samsung Galaxy Note 20 Ultra**
  ```powershell
  node scripts/mobile-role-acceptance-e2e.cjs
  ```
- [x] **Step 3: Visual inspection of captured screenshot**
  Pull `acceptance-06-S3-gps.png` and verify Google Maps visual rendering, geofence ring, and smooth layout.
- [x] **Step 4: Update durable memory**
  Update `.agents/memory/UI_UX_MEMORY.md` with final design/UX decisions.
