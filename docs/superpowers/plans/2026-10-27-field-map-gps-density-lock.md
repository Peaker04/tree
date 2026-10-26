# Field Map, GPS, Scope & Density Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate fake SVG maps, unblock 1-tap GPS satellite acquisition, remove fake address-split zone grouping, and enforce clean 6/10 information density on field check-in screens.

**Architecture:** Replace the mock SVG canvas with direct `react-native-webview` Leaflet/Google Roadmap raster tiles. Re-architect device location flow to check hardware services and request OS permissions directly without rationale deadlocks. Streamline tree scope selection to honest tree entities. Condense the field check-in UI to fit map, status, and 48dp primary actions in the initial viewport.

**Tech Stack:** React Native 0.86, Expo SDK 57 (`react-native-webview`, `expo-location`), TypeScript strict, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-field-map-gps-density-lock-design.md`

## Global Constraints

- Never use SVG mockups (`NativeVectorMap`) to simulate real geographic maps (Rule UI-038).
- Never split address strings (`.split(',').pop()`) to fabricate zones, and never silently drop selected trees (Rule UI-039).
- Never deadlock GPS acquisition behind manual rationale cards when tapping "Lấy GPS" (Rule UI-040).
- Adhere to Density 6/10: primary field check-in actions must be reachable above the fold on compact Android screens (Rule UI-041).
- Touch targets must be at least 44x44dp; primary field actions must be 48–52dp high.
- Zero new runtime dependencies; all implementations use existing repository packages.

## Review Focus

1. `react-native-webview` renders real tiles without white flash or crash when WebView is loaded on Android.
2. Device location services disabled in Android quick settings properly prompts the user to enable GPS instead of hanging indefinitely.
3. Cold-start GPS taking >10s under tree cover succeeds without returning null or falling back to hardcoded coordinates.
4. Tree selection preserves exact tree identities without fabricating nonexistent zone buckets.
5. Check-in screen on compact viewport (360x640dp) displays map, status, and both action buttons without requiring vertical scrolling.

---

### Task 1: Lock Known-Failure Register & Invariants in UI/UX Memory

**Files:**
- Modify: `.agents/memory/UI_UX_MEMORY.md`

**Interfaces:**
- Produces: Rules `UI-038`, `UI-039`, `UI-040`, `UI-041` in `UI_UX_MEMORY.md`

- [ ] **Step 1: Add rules UI-038 through UI-041 to Known-Failure Register**

Add rows to the Known-failure register table:
- `UI-038`: Fake SVG map drawing pretending to be a real geographic map. Rule: Direct WebView raster tiles required.
- `UI-039`: Address string-split hack to fabricate zones while silently creating tasks for only 1 tree. Rule: Honest cardinality; direct tree selection.
- `UI-040`: Tapping "Lấy GPS" deadlocked behind inline rationale without OS permission prompt, and 10s cutoff killing satellite fix. Rule: 1-tap direct OS request, hardware GPS service check, 20s satellite timeout.
- `UI-041`: Information density overload on check-in screen pushing action buttons below the fold. Rule: Density 6/10, compact 220dp map, above-the-fold 48dp buttons, no redundant bottom task list.

- [ ] **Step 2: Commit memory updates**

```bash
git add .agents/memory/UI_UX_MEMORY.md
git commit -m "docs(memory): record UI-038 to UI-041 field map, gps, scope and density rules"
```

---

### Task 2: Real Geographic Map Component (`WebMapView.tsx`)

**Files:**
- Modify: `apps/mobile/src/components/presentation/WebMapView.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: `WebMapView({ treeLat, treeLng, treeName, userLat, userLng, locationAccuracyMeters, locationCapturedAt, effectiveRadiusMeters, trees, style })`
- Consumes: `react-native-webview`

- [ ] **Step 1: Write test asserting direct WebView import and absence of fake NativeVectorMap**

In `tests/mobile/ui-foundation.spec.ts`, assert:
- `WebMapView.tsx` imports `WebView` directly from `react-native-webview`.
- `WebMapView.tsx` does not contain `NativeVectorMap`.
- `WebMapView.tsx` does not contain `TurboModuleRegistry.get('RNCWebViewModule')`.
- `WebMapView.tsx` contains interactive Leaflet tile layer using Google Roadmap / OSM tiles.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
Expected: FAIL on `NativeVectorMap` check.

- [ ] **Step 3: Refactor `WebMapView.tsx`**

- Remove `NativeVectorMap`, `isWebViewSupported`, and TurboModule checks.
- Import `WebView` from `react-native-webview`.
- Implement clean, responsive HTML using Leaflet 1.9.4:
  - Roadmap raster tiles: `https://mt{s}.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}` with subdomains `0123`.
  - Target tree marker at `[treeLat, treeLng]` with custom botanical SVG pin.
  - Pulsing check-in circle with radius `effectiveRadiusMeters`.
  - User location pin at `[userLat, userLng]` with accuracy circle if `locationCapturedAt` is present.
  - Dashed polyline between user and tree.
  - Nearby tree dots for spatial context.
  - Touch gestures enabled for intuitive pan and pinch-to-zoom.
  - Strip redundant floating buttons (zoom +/-, engine switchers).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/presentation/WebMapView.tsx tests/mobile/ui-foundation.spec.ts
git commit -m "feat(mobile): replace mock SVG map with authentic interactive WebView map"
```

---

### Task 3: Direct 1-Tap GPS Acquisition & Unblocking Flow

**Files:**
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx`
- Modify: `apps/mobile/src/hooks/useDevicePermissions.ts`

**Interfaces:**
- Consumes: `expo-location` (`hasServicesEnabledAsync`, `requestForegroundPermissionsAsync`, `getLastKnownPositionAsync`, `getCurrentPositionAsync`)
- Produces: Unblocked `refreshDeviceLocation` and robust `readDeviceLocationAfterPermission`

- [ ] **Step 1: Write test for direct GPS request and hardware service check**

Add unit tests in `tests/mobile/ui-foundation.spec.ts` asserting:
- `refreshDeviceLocation` calls `requestForegroundLocationPermission` directly.
- `StaffProofFlow.tsx` checks `Location.hasServicesEnabledAsync()`.
- Timeout for satellite GPS lock is at least 20 seconds.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement 1-tap GPS flow in `StaffProofFlow.tsx`**

- In `refreshDeviceLocation`:
  - Check `Location.hasServicesEnabledAsync()`. If disabled, set status: *"Vui lòng bật Định vị (GPS) trong Cài đặt của điện thoại."* and stop.
  - Call `readDeviceLocationAfterPermission()` directly without getting trapped in rationale state.
- In `readDeviceLocationAfterPermission`:
  - Call `requestLocationForPurpose('staff-gps')`. If granted, continue immediately.
  - First read `getLastKnownPositionAsync()` to immediately update coordinates if available.
  - Call `getCurrentPositionAsync({ accuracy: Location.Accuracy.High })` with 20s timeout.
  - Update `userLat`, `userLng`, `locationAccuracyMeters`, and `locationCapturedAt`.
  - Display localized Vietnamese status with exact time and error radius.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/screens/staff/StaffProofFlow.tsx apps/mobile/src/hooks/useDevicePermissions.ts tests/mobile/ui-foundation.spec.ts
git commit -m "fix(mobile): unblock 1-tap GPS acquisition and add hardware service check"
```

---

### Task 4: Honest Tree Selection & Removal of Fake Address-Split Zones

**Files:**
- Modify: `apps/mobile/src/screens/manager/ManagerCreateTask.tsx`
- Modify: `apps/mobile/src/components/TreeScopeSelectorSheet.tsx`

**Interfaces:**
- Produces: `TreeScopeSelectorSheet({ visible, onClose, trees, selectedTreeId, onSelectTree })`
- Eliminates: `t.address.split(',').pop()` and deceptive single-tree extraction from multi-tree selection

- [ ] **Step 1: Write test verifying absence of address-split zone fabrication**

In `tests/mobile/ui-foundation.spec.ts`, assert:
- `ManagerCreateTask.tsx` does not contain `.split(',').pop()`.
- `TreeScopeSelectorSheet` presents honest tree selection without fabricated zone groups.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Refactor `ManagerCreateTask.tsx` and `TreeScopeSelectorSheet.tsx`**

- In `ManagerCreateTask.tsx`:
  - Remove `treeScopeItems` zoneId/zoneName fabrication.
  - Pass tree list directly to `TreeScopeSelectorSheet`.
- In `TreeScopeSelectorSheet.tsx`:
  - Remove the fake "Khu vực" tab.
  - Provide a clean search input filtering trees by name, code (`#108`), or street.
  - Display trees with tree icon, name, species, and address.
  - Explicit radio selection with clear "Xác nhận chọn cây" action.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/screens/manager/ManagerCreateTask.tsx apps/mobile/src/components/TreeScopeSelectorSheet.tsx tests/mobile/ui-foundation.spec.ts
git commit -m "refactor(mobile): enforce honest tree selection and eliminate fake address-split zones"
```

---

### Task 5: Information Density Refactor & Above-the-Fold Thumb Action Layout

**Files:**
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx`

**Interfaces:**
- Produces: Compact `TreeCheckinMap` with above-the-fold action bar, density 6/10

- [ ] **Step 1: Write test asserting density rules in `StaffProofFlow.tsx`**

In `tests/mobile/ui-foundation.spec.ts`, assert:
- `TreeCheckinMap` does not render redundant `mapTaskList` on the check-in screen.
- Primary action buttons `Lấy GPS` and `Check-in` have height $\ge 48\text{dp}$.
- Subtitle does not contain contradictory "bán kính 10m" text.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Redesign `TreeCheckinMap` layout in `StaffProofFlow.tsx`**

- Limit map container height to 200–220dp.
- Card Header: Tree name and address in 1 clean line.
- Status Pill: Distance to tree with semantic color (green if $\le \text{effectiveRadius}$, amber otherwise).
- Signal Info: 1 concise line (`Tín hiệu GPS: ±{accuracy}m • {age}s trước`).
- Action Bar: 2 prominent 48dp buttons side-by-side (`[Lấy GPS]` outline + `[Check-in]` primary).
- Remove the redundant `mapTaskList` appended below the card.
- Subtitle updated to: *"Xác minh vị trí thiết bị trước khi quét mã QR hoặc chụp ảnh."*

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/screens/staff/StaffProofFlow.tsx tests/mobile/ui-foundation.spec.ts
git commit -m "style(mobile): streamline check-in layout to density 6/10 with above-the-fold actions"
```

---

### Task 6: Comprehensive Verification & Typecheck

**Files:**
- Entire repository

- [ ] **Step 1: Run mobile typecheck**

Run: `npm run typecheck --workspace @novyx/mobile`
Expected: 0 errors.

- [ ] **Step 2: Run monorepo lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Run Vitest test suite**

Run: `npm run test`
Expected: All tests pass.

- [ ] **Step 4: Commit all final adjustments**

```bash
git commit --allow-empty -m "chore(mobile): verify field map, gps, scope and density locks pass all quality gates"
```
