# Apple HIG Natural Deceleration Modal Motion & Tactile Press Design Specification

**Date:** 2026-10-27  
**Status:** Approved by Operator (Option A)  
**Author:** Mobile & FE Lead Architect  
**Platform:** Dual-Platform (iOS Primary HIG & Samsung Galaxy Note 20 Ultra Android Testbed)  
**Standard:** Living Botanical Operational Design System / Expo SDK 57 / React Native 0.86  
**Target:** `apps/mobile/src/components/AppPrimitives.tsx`, `apps/mobile/src/screens/manager/ManagerCreateTask.tsx`, `.agents/memory/UI_UX_MEMORY.md`

---

## 1. Problem Statement & Root Cause

### 1.1 The "Rushing/Snapping Modal" Defect ("Lướt ầm lên")
* In `BottomSheetModal` (`AppPrimitives.tsx`), the entrance animation previously used:
  ```tsx
  Animated.spring(sheetAnim, {
    toValue: 0,
    bounciness: 3,
    speed: 14,
    useNativeDriver: true,
  })
  ```
* When an object travels from `screenHeight` (~900–1000px) to 0, `speed: 14` produces an initial velocity exceeding 6000px/s.
* The sheet shoots up in under 120ms and halts abruptly at Y=0, creating a jarring, aggressive "rocket launch" feeling rather than an organic, smooth slide-in.
* Furthermore, `backdropAnim` ran with a mismatched 160ms cubic timing, causing the overlay to darken prematurely before the sheet arrived.

---

## 2. Architecture & Design Principles (Option A: Apple HIG Natural Deceleration)

### 2.1 Principle 1: 280ms Apple HIG Deceleration Curve (`cubic-bezier(0.16, 1, 0.3, 1)`)
* Replace uncontrolled high-speed spring physics with Apple's standard modal entrance curve:
  ```tsx
  Animated.parallel([
    Animated.timing(backdropAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 280,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }),
  ]).start();
  ```
* **Perceptual Mechanics**: The sheet rises with confident initial velocity over the first 20% of travel, then smoothly and progressively decelerates over the remaining 80%, gliding into place with zero jarring bounce.

### 2.2 Principle 2: Snappy, Asymmetrical Exit (200ms)
* In accordance with `impeccable/reference/animate.md`, exit animations must be faster than entrance animations:
  ```tsx
  Animated.parallel([
    Animated.timing(backdropAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(sheetAnim, {
      toValue: screenHeight,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
  ]).start();
  ```

### 2.3 Principle 3: Smooth Handle Drag Reset
* When a user releases a drag-down gesture without crossing the 80dp dismiss threshold, the sheet returns to Y=0 using a gentle spring:
  ```tsx
  Animated.spring(sheetAnim, {
    toValue: 0,
    bounciness: 0, // Zero overshoot
    speed: 12,
    useNativeDriver: true,
  }).start();
  ```

### 2.4 Principle 4: Tactile Widget Press Choreography
* When tapping interactive selector fields (e.g. "Cây mục tiêu", "Thời gian & ca làm việc", "Người thực hiện" in `ManagerCreateTask`), the field subtly scales down to $0.98\times$ over 60ms and triggers light tactile feedback, creating a cohesive physical bridge between touch and sheet reveal.

---

## 3. Verification & Acceptance Criteria

1. **Entrance Pacing**: Tapping to open `TreeScopeSelectorSheet`, `DateRangePickerSheet`, `ManualTreeCodeModal`, or `TreeQrModal` produces a continuous, silky 280ms slide-up with zero aggressive snapping or abrupt deceleration.
2. **Backdrop Harmony**: The dark scrim darkens in exact parallel synchronization with the sheet's upward movement.
3. **Exit Snappiness**: Dismissing via background tap, close button, or drag-down completes cleanly in $\le 200\text{ms}$.
4. **Quality Floor**: 100% typecheck pass, 0 lint warnings, all Vitest tests pass.
