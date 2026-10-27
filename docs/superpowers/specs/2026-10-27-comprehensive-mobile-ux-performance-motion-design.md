# Comprehensive Mobile UX, Modal Geometry, Motion & Performance Architecture Specification

**Date:** 2026-10-27  
**Status:** Approved  
**Author:** Mobile & FE Lead Architect  
**Platform:** Dual-Platform (Apple iOS First-Class & Samsung Galaxy Note 20 Ultra Android Testbed)  
**Standard:** Living Botanical Operational Design System / Expo SDK 57 / React Native 0.86  
**Target:** `apps/mobile`, `scripts`, `.agents/memory/UI_UX_MEMORY.md`

---

## 1. Problem Statement & Root Cause Synthesis

Following deep physical device testing and a complete codebase scan, 5 critical architectural defects were identified that degrade user experience and violate Mobile Non-Functional Requirements (NFR-01 to NFR-16):

### 1.1 Sunken / Collapsed BottomSheet Modal Defect ("Modal bị lỏm bên dưới app")
* **Root Cause:** In `BottomSheetModal` (`AppPrimitives.tsx`), `sheetContainer` only declared `maxHeight: '88%'` without a flex or height constraint, and its inner wrapper `sheetBody` lacked `flex: 1`.
* When child components containing `<FlatList>` (such as `TreeScopeSelectorSheet.tsx`, `SearchSelector` in `ManagerCreateTask.tsx`, and `ManualTreeCodeModal.tsx`) rendered with `flex: 1`, **React Native's flexbox engine collapsed the unconstrained child height to 0**.
* **Visual Symptom:** The modal opened as an empty, sunken strip showing only the handle and header pinned against the bottom of the screen, with the list and actions completely invisible.

### 1.2 Stiff, Jerky Motion & Lack of Physics-Based Spring Transitions
* **Root Cause:**
  - `BottomSheetModal` used linear/cubic timing (`duration: 220ms, Easing.out(Easing.cubic)`) instead of physics-based spring dynamics.
  - Modals lacked drag-down gesture dismissal (`PanResponder`).
  - Screen transitions lacked exit/entry pacing, and buttons lacked tactile compression.

### 1.3 iOS Camera QR Scan Crash vs. Direct Expo Go Connection
* **Root Cause:**
  - When scanning a QR code with the **iOS native Camera app**, iOS opens the URL scheme: `exp://<subdomain>.exp.direct`.
  - Expo Go translates `exp://` to clear-text `http://`. On iOS, **App Transport Security (ATS) strictly blocks unencrypted HTTP connections to public web domains**.
  - In Expo Go SDK 58, a cold-start deep link blocked by ATS triggers an uncaught native network exception, crashing the app before the JavaScript bundle can initialize.
  - When opening Expo Go directly, it connects via HTTPS or local subnet (`172.20.10.x` / `10.x.x.x`), which is exempt from ATS, avoiding the crash.
  - Missing `"scheme": "novyx-greenops"` in `app.json` also breaks deep link routing.

### 1.4 Persistent Scrollbar Clutter & Layout Friction
* **Root Cause:** Multiple list surfaces lacked `showsVerticalScrollIndicator={false}` and WebView lacked CSS scrollbar suppression, causing grey scrollbar pills to pop over card borders.

### 1.5 Performance & State Rerender Fanout
* **Root Cause:** Large root-level state in `MobileApp.tsx` caused broad re-evaluations across navigation and child screens during state updates.

---

## 2. Architecture & Design Principles

### Principle 1: Structural Modal Rigor & Viewport Anchoring (Rule UI-045)
* `BottomSheetModal` must guarantee an explicit vertical geometry:
  - Container height: default `height: '82%'` (or explicit `minHeight: 460` and `maxHeight: '90%'`).
  - `sheetBody` must have `flex: 1` so that any `<FlatList>`, `<ScrollView>`, or custom form inside automatically expands to fill the entire body.
  - The footer action bar remains permanently pinned above the bottom safe area.

### Principle 2: Physics-Based Spring Dynamics (Rule UI-046)
* Replace mechanical `timing` curves in modal slide-ins with **Damped Spring Physics**:
  ```tsx
  Animated.spring(sheetAnim, {
    toValue: 0,
    bounciness: 3,
    speed: 14,
    useNativeDriver: true,
  })
  ```
* **Swipe-Down-to-Dismiss Gesture:**
  Attach a lightweight `PanResponder` to `sheetHandleContainer`. Swiping down $>80\text{dp}$ smoothly triggers `onClose()`.
* **Button Tactile Spring:**
  `Button` provides $0.97\times$ scale compression with `onPressIn`/`onPressOut` spring physics and Taptic feedback.

### Principle 3: ATS-Compliant Secure QR Scheme (Rule UI-047)
* For tunnel connections, QR payloads and links must use the secure scheme:
  ```text
  exps://<subdomain>.exp.direct
  ```
* `exps://` instructs iOS Camera and Expo Go to connect strictly over **HTTPS**, satisfying iOS App Transport Security and eliminating cold-launch deep link crashes.
* Configure `"scheme": "novyx-greenops"` in `apps/mobile/app.json`.

### Principle 4: Universal Dual-Platform Ergonomics (Rule UI-048)
* On iOS:
  - `NotchedBottomNav` base height = `56dp`, flush with Home Indicator (`paddingBottom = insets.bottom`).
  - Total bar height = $56 + 34 = 90\text{dp}$.
* On Android:
  - 3-button navigation detection (`insets.bottom >= 40`) and bottom filler remain fully intact.
* All scrollable surfaces enforce `showsVerticalScrollIndicator={false}`.

---

## 3. Systematic Component Implementation Plan

### 3.1 `apps/mobile/src/components/AppPrimitives.tsx`
- Refactor `BottomSheetModal`:
  - Enforce `height: '82%'`, `maxHeight: '92%'` on `sheetContainer`.
  - Set `flex: 1` on `sheetBody` and `KeyboardAvoidingView`.
  - Implement `PanResponder` on `sheetHandleContainer` for interactive drag-down dismiss.
  - Upgrade `sheetAnim` to `Animated.spring`.
- Upgrade `Button`:
  - Enhance micro-spring scale animation with native driver.

### 3.2 `apps/mobile/src/components/TreeScopeSelectorSheet.tsx` & `ManualTreeCodeModal.tsx`
- Ensure `sheetContainer` has `flex: 1` and list content fills the expanded sheet with the bottom confirm button fixed in the viewport.

### 3.3 `apps/mobile/app.json` & `scripts/field-tunnel.cjs`
- Add `"scheme": "novyx-greenops"` to `apps/mobile/app.json`.
- In `scripts/field-tunnel.cjs`, generate QR code and output URL using `exps://` for tunnel mode, and `exp://` for local LAN mode.

---

## 4. Verification Floor & Test Plan

1. **Automated Unit & Contract Tests:**
   - `tests/mobile/ui-foundation.spec.ts` verifies:
     - `BottomSheetModal` has `flex: 1` in `sheetBody` and spring animation.
     - `TreeScopeSelectorSheet` expands with list content and button.
     - `app.json` contains `"scheme": "novyx-greenops"`.
     - Monorepo tests: 336+ passing.
2. **Physical Device Verification:**
   - Scan QR code via native iOS Camera app: opens Expo Go and enters app with zero crash.
   - Open Tree Selector and Manual Code modals: sheets slide up with fluid spring physics to full 82% height; list and buttons are fully visible and responsive.
   - Swipe down on sheet handle smoothly dismisses modal.
   - Navigation bar sits flush on iOS and Android.
