# NOVYX Mobile iOS Navigation, Motion, Scrollbar & NFR Polish Specification

**Date:** 2026-10-27  
**Status:** Approved  
**Author:** Mobile & FE Lead Architect  
**Platform:** Apple iOS (Primary) & Android (Secondary Testbed) / Expo SDK 57 / React Native 0.86  
**Target:** `apps/mobile`, `packages/ui`, `.agents/memory/UI_UX_MEMORY.md`

---

## 1. Problem Statement & Expert Research

Physical device testing on iOS (iPhone 11 through 16 Pro Max) and deep technical audit revealed 5 critical UX, visual, and performance defects violating Mobile Non-Functional Requirements (NFR-01 to NFR-12):

1. **Abnormally Elevated Navigation Bar (`NotchedBottomNav.tsx`):**
   - On iOS, `BASE_BAR_HEIGHT` is hardcoded to 82dp, and `bottomPadding` adds `insets.bottom` (34dp) twice: once to the container height and once to `paddingBottom` (`14 + bottomPadding` = 48dp).
   - This inflates total nav container height to **144dp** (nearly double the standard 83dp Apple `UITabBar`), causing the bar to float unnaturally high above the iOS Home Indicator, covering content and looking disjointed.

2. **Visible Raw Scrollbars Across All Screens (`ScrollView`, `FlatList`, `WebView`):**
   - 11 out of 12 scroll containers omit `showsVerticalScrollIndicator={false}`.
   - In mobile operational apps, persistent or flickering scroll bars popping over card borders and icons is an anti-pattern that destroys visual hierarchy and makes native views feel like unoptimized web views.
   - In `WebMapView.tsx`, `<WebView>` lacks `showsVerticalScrollIndicator={false}` and CSS `::-webkit-scrollbar { display: none; }`.

3. **Lack of Fluid Micro-Motion & Abrupt "Hard-Mount" State Jumps:**
   - Tab switching in `StaffArea` and `MobileApp` uses raw ternary rendering (`if (step === 'HOME') return ...`), causing abrupt unmount/mount flashes with zero transition motion.
   - Buttons in `AppPrimitives.tsx` only toggle opacity (`pressed && { opacity: 0.72 }`) with zero tactile spring compression or haptic depth.

4. **`LayoutAnimation` Frame Drops in React Native New Architecture (Fabric):**
   - Calling `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` inside Fabric is a deprecated no-op or causes frame dropping when expanding complex tree rows.

5. **NFR Violations:**
   - **NFR-01 (Performance):** Frame rate dips during list expansion on 120Hz ProMotion screens.
   - **NFR-02 (Perceived Performance):** Stiff, sudden visual pops instead of botanical fluid transitions.
   - **NFR-03 (Layout Stability):** Floating bottom nav causing inconsistent content clearances.

---

## 2. Core Invariants & Architectural Rules

### Invariant 1: Clean Platform-Conforming Navigation Bar (Rule UI-042)
* On iOS:
  - `BASE_BAR_HEIGHT = 56dp`.
  - Body height = `56 + insets.bottom` (total 90dp on iPhones with Home Bar, 56dp on older home button devices).
  - Navigation tab icons and labels are cleanly aligned above the Home Indicator bar with `paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.xs`.
  - Center QR FAB sits precisely nested in the SVG notch without floating or clipping.
* On Android:
  - Preserves 3-button navigation detection (`insets.bottom >= 40`) and bottom filler.

### Invariant 2: Zero Unwanted Scrollbars Invariant (Rule UI-043)
* Every `<ScrollView>` and `<FlatList>` across all operational, form, and modal screens must set `showsVerticalScrollIndicator={false}` and `showsHorizontalScrollIndicator={false}`.
* `<WebView>` in `WebMapView.tsx` must configure `showsVerticalScrollIndicator={false}`, `showsHorizontalScrollIndicator={false}`, and inject CSS:
  ```css
  ::-webkit-scrollbar { display: none !important; width: 0px !important; height: 0px !important; background: transparent !important; }
  ```

### Invariant 3: Botanical Micro-Spring Motion & Fluid Transition (Rule UI-044)
* **Button Tactile Spring:**
  Wrap interactive pressables with smooth scale feedback:
  `transform: [{ scale: pressed ? 0.97 : 1.0 }]` powered by `useNativeDriver: true` and subtle Taptic vibration (`triggerTactileFeedback('light')`).
* **Screen Transition Fade:**
  Wrap active step views in `AnimatedScreenTransition` with snappy cubic fade (150ms in, 120ms out) to eliminate abrupt screen pops.
* **Physics-based Modals:**
  Ensure bottom sheets and image preview modals use spring easing with native driver.

---

## 3. Component Technical Specifications

### 3.1 `apps/mobile/src/components/NotchedBottomNav.tsx`
- Refactor geometry calculation:
  ```tsx
  const isIos = Platform.OS === 'ios';
  const hasHomeBar = isIos && insets.bottom > 0;
  const barHeight = isIos ? 56 : 64;
  const bottomInset = hasHomeBar ? insets.bottom : (Platform.OS === 'android' && insets.bottom >= 40 ? insets.bottom : 0);
  const totalBarHeight = barHeight + bottomInset;
  ```
- Align SVG path and tab item row cleanly to the bottom edge.

### 3.2 Scrollbar Elimination Sweep
Add `showsVerticalScrollIndicator={false}` to:
- `apps/mobile/src/screens/staff/StaffHome.tsx`
- `apps/mobile/src/screens/staff/StaffWork.tsx`
- `apps/mobile/src/screens/staff/StaffTrees.tsx`
- `apps/mobile/src/screens/staff/StaffProofFlow.tsx` (all ScrollViews)
- `apps/mobile/src/screens/staff/StaffArea.tsx`
- `apps/mobile/src/screens/manager/ManagerDashboard.tsx`
- `apps/mobile/src/screens/manager/ManagerTrees.tsx`
- `apps/mobile/src/screens/manager/ManagerCreateTask.tsx`
- `apps/mobile/src/screens/manager/ManagerReview.tsx`
- `apps/mobile/src/screens/manager/ManagerQrLookup.tsx`
- `apps/mobile/src/screens/auth/AuthScreens.tsx`
- `apps/mobile/src/components/TreeScopeSelectorSheet.tsx`
- `apps/mobile/src/components/ManualTreeCodeModal.tsx`
- `apps/mobile/src/components/presentation/WebMapView.tsx`

### 3.3 Micro-Spring Button & Animated Screen Wrapper
- Enhance `Button` in `AppPrimitives.tsx`:
  Support spring press transform and subtle haptic response.
- Create `AnimatedScreenTransition`:
  Lightweight fade wrapper for tab and step navigation.

### 3.4 Replace Problematic `LayoutAnimation`
- Replace calls to `LayoutAnimation.configureNext` with safe, Fabric-compatible animated transitions or state-driven CSS/timing animations.

---

## 4. Verification & Acceptance Criteria

- **Automated Tests:**
  `tests/mobile/ui-foundation.spec.ts` asserts:
  - `NotchedBottomNav.tsx` enforces iOS 56dp base bar height.
  - Zero unconfigured `ScrollView` / `FlatList` with missing `showsVerticalScrollIndicator={false}`.
  - `WebMapView.tsx` contains scrollbar hiding CSS.
  - Button contains scale transform animation.
- **Physical Device Check:**
  - On iPhone: Bottom Nav sits flush with Home Bar; no floating gap.
  - No scroll bars flicker during scrolling.
  - Tapping buttons produces subtle 0.97 scale spring.
  - 100% Typecheck and Lint pass.
