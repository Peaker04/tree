# NOVYX Mobile Native Map & Widget Experience Specification

**Date:** 2026-10-26  
**Status:** Approved  
**Platform:** Expo SDK 57 / React Native 0.86 / Android First (Samsung Galaxy Note 20 Ultra)  
**Authority:** `docs/MOBILE_UI_RULES.md`, root `DESIGN.md`, `docs/NOVYX_MOBILE_DESIGN_SYSTEM.md`

---

## 1. Context & Problem Statement

Through field-device testing and expert audit, 3 critical UX and architectural bottlenecks were identified in the mobile experience:

1. **Map Appearance & Inaccurate Visual Geofence:**
   - Map tiles are using an outdated yellow/sepia ArcGIS map tile (`World_Street_Map`) that looks completely unlike Google Maps and clashes with the *Living Botanical Operational* design palette.
   - The map's visual geofence circle is hardcoded to 10m, while the actual check-in verification formula uses an adaptive threshold `effectiveRadius = Math.max(15, locationAccuracyMeters ?? 15) + 5` (typically 20m–30m). Users standing at 18m see themselves outside the green circle yet the Check-in button is enabled.
   - The map is completely static (no pan/drag gesture support).
   - `WebMapView.tsx` contains dead mock code switching between Google and Leaflet that renders the same static component.

2. **GPS Click Flicker / Layout Thrashing:**
   - Tapping "Lấy GPS" forces `setGpsPermissionVisible(true)` while `getPermissionStateForPurpose('staff-gps')` evaluates asynchronously. This mounts `<DevicePermissionState>` inline directly above the buttons, shoving the layout down, and then unmounts 150ms later when the permission check completes, causing a jarring visual flicker.

3. **Widget & Modal Animation Imperfections:**
   - `BottomSheetModal` in `AppPrimitives.tsx` hardcodes `sheetAnim: 450px`. On modern tall screens (e.g. 2316px on Note 20 Ultra), sheets do not animate completely off-screen before unmounting, snapping away abruptly.
   - Android native `LayoutAnimation` drops frames or fails to animate because `UIManager.setLayoutAnimationEnabledExperimental(true)` was never enabled at the root.
   - `ManualTreeCodeModal.tsx` and `TreeQrModal.tsx` deviate from the design system sheet contracts (rigid `maxHeight: 460`, raw `<Modal>` usage).

---

## 2. Technical Architecture & Solutions

### 2.1 Map Modernization (`WebMapView.tsx`)
- **Tile Provider:** Switch to high-performance Google Roadmap raster tiles:
  `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}` with multi-server round-robin (`mt0`, `mt1`, `mt2`, `mt3`).
  - Clean light-neutral roads, fresh botanical green for parks, soft blue for water, crisp Vietnamese labels, zero API key required, sub-50ms latency in Vietnam.
- **Dynamic Adaptive Geofence:**
  - Pass `effectiveRadius` (computed from `locationAccuracyMeters`) into `WebMapView`.
  - Draw the green geofence circle matching `effectiveRadius` in meters so visual appearance and business logic are 100% congruent.
- **Pan & Recenter Interactivity:**
  - Add lightweight `PanResponder` to `OsmTileCanvas` allowing users to drag/pan the map within a bounded viewport.
  - Add floating control buttons: `[+]` / `[-]` for zoom, and `[Về cây]` / `[Về tôi]` to instantly snap back to the tree or user pin.
- **Dead Code Cleanup:**
  - Remove fake `engine === 'google'` toggle logic and unneeded attribution pills.

### 2.2 Seamless GPS Measurement (`StaffProofFlow.tsx` & `TreeCheckinMap`)
- **Zero-Flicker Feedback:**
  - When the user taps "Lấy GPS", `locating` state is set to `true`, providing instant spinner feedback on the button itself.
  - Do NOT mount `<DevicePermissionState>` inline above buttons.
  - If and only if permission is truly `denied` or `blocked` (after the async request resolves), trigger a non-disruptive BottomSheet or dedicated permission guidance card.

### 2.3 Widget, Sheet & Modal Polish
- **Full Travel Distance for `BottomSheetModal`:**
  - Use `useWindowDimensions().height` (or fallback `Dimensions.get('window').height`) instead of `450` for `sheetAnim` initial/hidden value.
- **Enable Android Layout Animation:**
  - Call `Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true)` in `apps/mobile/index.ts`.
- **Standardize `ManualTreeCodeModal`:**
  - Make `FlatList` `flex: 1` inside `BottomSheetModal` with `maxHeight="85%"`.
  - Remove rigid `maxHeight: 460` and faulty `KeyboardAvoidingView` squash.
- **Standardize `TreeQrModal`:**
  - Refactor from raw `<Modal>` to `BottomSheetModal`.

---

## 3. Non-Functional Requirements & Invariants

- **Performance (NFR-01):** 60fps interaction during pan gestures and sheet slides on Samsung Galaxy Note 20 Ultra.
- **Spatial Stability (DESIGN.md Section 5):** No layout thrashing or element popping when tapping action buttons.
- **Data Integrity (FR-03):** GPS accuracy and distance values match domain models.
- **Accessibility:** Minimum touch targets $\ge 44\times 44\text{dp}$, labels in Vietnamese.
- **Zero New Dependencies:** All implementations use existing Expo/React Native primitives.
