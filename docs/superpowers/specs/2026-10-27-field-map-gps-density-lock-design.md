# NOVYX Mobile Real Field Map, GPS, Scope & Density Lock Specification

**Date:** 2026-10-27  
**Status:** Approved  
**Author:** Mobile & FE Lead Architect  
**Platform:** Expo SDK 57 / React Native 0.86 / Android & iOS  
**Target:** `apps/mobile`, `.agents/memory/UI_UX_MEMORY.md`, `docs/MOBILE_UI_RULES.md`

---

## 1. Context & Problem Statement

Field testing and systematic code audit revealed 4 critical failures and anti-patterns in the mobile field operations application:

1. **Fake SVG Map Deception (`WebMapView.tsx`):**
   - A flawed native module availability check (`TurboModuleRegistry.get('RNCWebViewModule')`) permanently evaluated to `false` on Android, disabling `react-native-webview`.
   - The application silently fell back to `NativeVectorMap`—an artificial SVG mockup with hardcoded gray rectangles, fake street lines, and a green box pretending to be a park, showing neither genuine geographic land cover nor real streets of Ho Chi Minh City.
   - Surrounding trees placed on this SVG canvas with flat Cartesian scaling (`5.0 * zoom`) either clustered illegibly or disappeared off-screen.

2. **Honest Tree Scope vs. String Hack Deception (`TreeScopeSelectorSheet.tsx` & `ManagerCreateTask.tsx`):**
   - The manager task creation flow fabricated operational "Zones" by executing `t.address.split(',').pop()?.trim()` on tree address strings (e.g. grouping any tree with "Q.1" into "Khu Q.1").
   - Crucially, when a manager selected a zone containing multiple trees (e.g., 6 trees), the screen executed `if (scope.treeIds.length > 0) setTreeId(scope.treeIds[0])`, silently dropping all other trees and dispatching a single-tree task without user warning. The backend API has no bulk zone creation endpoint.

3. **GPS Acquisition Deadlock & Premature Timeout (`StaffProofFlow.tsx` & `useDevicePermissions.ts`):**
   - Tapping "Lấy GPS" did not directly trigger the OS location permission dialog when the permission was undetermined; instead, it prematurely mounted an inline rationale card and returned, giving users the impression that the button was unresponsive.
   - The acquisition logic lacked a check for hardware location services (`Location.hasServicesEnabledAsync()`).
   - A rigid 10-second `Promise.race` timeout cancelled GPS measurement before physical satellite lock could be obtained under dense tree canopies, locking workers into hardcoded fallback coordinates.

4. **Information Density Overload & Viewport Sprawl (`StaffProofFlow.tsx` / `TreeCheckinMap`):**
   - The check-in screen was overwhelmed with redundant prose, duplicate tree details, multiple floating map buttons, dual-engine switchers, technical timestamp logs, and an auxiliary list of daily tasks appended below the card.
   - Workers on compact Android devices were forced to scroll down 2-3 screen lengths just to locate the primary "Lấy GPS" and "Check-in" action buttons.

---

## 2. Core Invariants & Architectural Rules

### Invariant 1: Real Geographic Map (Rule UI-038)
* **Zero Mock Visuals:** `NativeVectorMap` and artificial SVG land cover drawings are prohibited.
* **Direct WebView Rendering:** `react-native-webview` is a standard Expo SDK 57 dependency and must be imported directly. The component must render real interactive raster tiles (OpenStreetMap / Google Roadmap raster tiles).
* **Native Touch Gestures:** Users interact directly with the map via native pinch-to-zoom and pan gestures, removing redundant floating zoom buttons and engine toggles.
* **Geographical Coherence:** Markers for the target tree and surrounding trees must be projected using standard geographic coordinates (WGS84 lat/lng).

### Invariant 2: Honest Tree Scope & Explicit Cardinality (Rule UI-039)
* **Zero String-Split Parsing:** Presentation code must never fabricate domain entities or zones by splitting free-form address strings.
* **Cardinality Honesty:** If the underlying mutation creates a single task for a single tree, the UI must explicitly represent single-tree selection.
* **Simplified Selection:** `TreeScopeSelectorSheet` must focus on fast, searchable tree selection (by Tree Code, Name, or Street/Address), eliminating the fake "Khu vực" tab until a dedicated backend zone/polygon management subsystem is implemented.

### Invariant 3: Unblocked 1-Tap GPS Acquisition (Rule UI-040)
* **Immediate Permission Request:** Tapping "Lấy GPS" must immediately invoke `requestForegroundLocationPermission()` if not already granted, delegating prompt management directly to the OS.
* **Hardware Service Pre-check:** Check `Location.hasServicesEnabledAsync()`. If device location services are disabled, prompt the user with an actionable message to enable GPS in device settings.
* **Robust Satellite Fix Strategy:** First read `getLastKnownPositionAsync()` for immediate rough positioning, then initiate `getCurrentPositionAsync({ accuracy: Location.Accuracy.High })` with a sufficient timeout (20s) and responsive progress feedback. Update parent coordinates (`userLat`, `userLng`) immediately upon resolution.

### Invariant 4: Clean Botanical Field Density & Thumb-Zone Action (Rule UI-041)
* **Density 6/10 Constraint:** In accordance with `DESIGN.md` Section 5, field operational screens must fit primary orientation, status, and action in the initial viewport without requiring vertical scrolling.
* **Map Height:** Compact map frame of 200–220dp height.
* **Concise Check-in Card:**
  - Header: Tree Name & concise address (1 line).
  - Status Row: Single-line badge with Distance and Geofence status (`≤ {effectiveRadius}m`).
  - Signal Row: Compact GPS signal indicator (`±{accuracy}m` and last fix status).
  - Eliminate multi-line explanatory paragraphs and repetitive timestamp text.
* **Primary Actions:** A clean 2-button row (`[Lấy GPS]` outline and `[Check-in]` primary) with standard 48dp touch targets, positioned above the fold.
* **Removal of Redundant Task List:** Remove `mapTaskList` from the bottom of the check-in view; tasks are already managed in the dedicated Work list screen.

---

## 3. Detailed Component Technical Specifications

### 3.1 `apps/mobile/src/components/presentation/WebMapView.tsx`
- Remove `isWebViewSupported` flawed TurboModule check and `NativeVectorMap` completely.
- Import `WebView` directly from `react-native-webview`.
- Clean Leaflet HTML template:
  - Standard Leaflet 1.9.4 with OpenStreetMap / Google Roadmap raster tiles (`https://mt{s}.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}`).
  - Target Tree: High-contrast green botanical pin with pulsing check-in radius circle matching `effectiveRadiusMeters`.
  - User Pin: Distinct blue dot with translucent accuracy circle.
  - Dashed connection line between User and Tree.
  - Nearby Trees: Small subtle green dots for spatial context.
  - Remove intrusive overlay controls (zoom buttons, engine switchers, duplicate coordinate cards).

### 3.2 `apps/mobile/src/screens/staff/StaffProofFlow.tsx`
- **`refreshDeviceLocation`:**
  - Check `Location.hasServicesEnabledAsync()`. If false, set message: *"Vui lòng bật Định vị (GPS) trong Cài đặt của điện thoại."*
  - Directly invoke `requestLocationForPurpose('staff-gps')`.
  - Call `readDeviceLocationAfterPermission()` with active spinner state on the "Lấy GPS" button.
- **`readDeviceLocationAfterPermission`:**
  - Fast-path cached location with `getLastKnownPositionAsync`.
  - Active high-accuracy location acquisition with 20s timeout.
  - Set `userLat`, `userLng`, `locationAccuracyMeters`, and update `locationCapturedAt`.
- **`TreeCheckinMap`:**
  - Streamline to compact card layout.
  - Eliminate verbose multi-sentence text.
  - Ensure the action buttons (`Lấy GPS`, `Check-in` / `Báo ngoại lệ`) remain permanently visible in the viewport.

### 3.3 `apps/mobile/src/components/TreeScopeSelectorSheet.tsx` & `ManagerCreateTask.tsx`
- Remove `address.split(',').pop()` logic in `ManagerCreateTask.tsx`.
- Refactor `TreeScopeSelectorSheet.tsx` to streamline tree selection:
  - Remove the deceptive "Khu vực" mode.
  - Provide a clean, fast search bar and clear tree item list with radio/single-select semantics matching the single-tree task creation contract.

### 3.4 `.agents/memory/UI_UX_MEMORY.md`
- Register entries `UI-038`, `UI-039`, `UI-040`, and `UI-041` in the Known-Failure Register to permanently prevent regressions in future development cycles.

---

## 4. Verification & Non-Functional Requirements

- **Typecheck & Linter Floor:**
  - `npm run typecheck --workspace @novyx/mobile` passes with 0 errors.
  - `npm run lint` passes with 0 errors.
  - `npm run test` passes existing Vitest test suite.
- **Spatial Composition & Viewport Audit:**
  - Initial viewport on compact Android (360x640dp to 412x915dp) must display Map, Target Tree, Geofence Status, and Action Buttons without vertical scroll.
- **Performance:**
  - WebView renders within 400ms without freezing native UI thread.
  - Zero layout flickering when tapping "Lấy GPS".
