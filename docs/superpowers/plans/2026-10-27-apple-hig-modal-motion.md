# Apple HIG Natural Deceleration Modal Motion & Tactile Press Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace aggressive high-velocity spring modal snapping with Apple HIG natural deceleration (`cubic-bezier(0.16, 1, 0.3, 1)` over 280ms) and add micro-tactile press feedback to selector widgets.

**Architecture:** Refactor `BottomSheetModal` in `AppPrimitives.tsx` to drive entrance with `Easing.bezier(0.16, 1, 0.3, 1)` and synchronized backdrop opacity. Upgrade `SelectionField` in `ManagerCreateTask.tsx` with animated scale compression ($0.98\times$) and native driver.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript strict, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-apple-hig-modal-motion-design.md`

## Global Constraints

- Modal entrance duration locked to 280ms with `Easing.bezier(0.16, 1, 0.3, 1)`.
- Backdrop opacity timing synchronized to 280ms on open and 180ms on close.
- Modal exit duration locked to $\le 200\text{ms}$ with `Easing.in(Easing.cubic)`.
- Zero new runtime dependencies; 100% native driver acceleration (`useNativeDriver: true`).
- 100% typecheck and lint pass.

---

### Task 1: Record Rule UI-053 in UI/UX Memory

**Files:**
- Modify: `.agents/memory/UI_UX_MEMORY.md`

**Interfaces:**
- Produces: Rule `UI-053` in `UI_UX_MEMORY.md`

- [ ] **Step 1: Add rule UI-053 to Known-Failure Register**
  - `UI-053`: Uncontrolled spring speed in bottom sheet modals causing aggressive snapping. Rule: 280ms Apple HIG deceleration curve (`cubic-bezier(0.16, 1, 0.3, 1)`) and synchronized backdrop.
- [ ] **Step 2: Commit**
  ```bash
  git add .agents/memory/UI_UX_MEMORY.md
  git commit -m "docs(memory): record UI-053 Apple HIG modal deceleration and synchronized backdrop rule"
  ```

---

### Task 2: Implement Apple HIG Deceleration in `BottomSheetModal`

**Files:**
- Modify: `apps/mobile/src/components/AppPrimitives.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: 280ms Apple HIG curve in `BottomSheetModal` entrance and 200ms exit.

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**
  Assert:
  - `BottomSheetModal` uses `Easing.bezier(0.16, 1, 0.3, 1)` for sheet entrance.
  - Entrance duration is 280ms for both backdrop and sheet.
  - Exit duration is 200ms for sheet and 180ms for backdrop.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-053"`
  Expected: FAIL.
- [ ] **Step 3: Update `BottomSheetModal` in `AppPrimitives.tsx`**
  Update `useEffect` in `BottomSheetModal`:
  ```tsx
  if (visible) {
    setModalVisible(true);
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
  } else if (modalVisible) {
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
    ]).start(({ finished }) => {
      if (finished) {
        setModalVisible(false);
      }
    });
  }
  ```
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-053"`
  Expected: PASS.
- [ ] **Step 5: Commit**
  ```bash
  git add apps/mobile/src/components/AppPrimitives.tsx tests/mobile/ui-foundation.spec.ts
  git commit -m "feat(mobile): implement Apple HIG 280ms deceleration curve for bottom sheet modals"
  ```

---

### Task 3: Add Tactile Micro-Press Choreography to Selector Widgets

**Files:**
- Modify: `apps/mobile/src/screens/manager/ManagerCreateTask.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: $0.98\times$ scale compression and tactile feedback on `SelectionField` press.

- [ ] **Step 1: Write test in `ui-foundation.spec.ts`**
  Assert `SelectionField` integrates `Animated.Value` scale press feedback.
- [ ] **Step 2: Update `SelectionField` in `ManagerCreateTask.tsx`**
  Wrap pressable target in `Animated.View` with `transform: [{ scale: scaleAnim }]`, applying `toValue: 0.98` on `onPressIn` and `toValue: 1` on `onPressOut`.
- [ ] **Step 3: Run test to verify it passes**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
  Expected: PASS.
- [ ] **Step 4: Commit**
  ```bash
  git add apps/mobile/src/screens/manager/ManagerCreateTask.tsx tests/mobile/ui-foundation.spec.ts
  git commit -m "feat(mobile): add tactile micro-press choreography to SelectionField widgets"
  ```

---

### Task 4: Comprehensive Verification & Automated Monorepo Quality Gate

**Files:**
- Entire repository

- [ ] **Step 1: Run mobile typecheck**
  `npm run typecheck --workspace @novyx/mobile`
  Expected: 0 errors.
- [ ] **Step 2: Run monorepo lint**
  `npm run lint`
  Expected: 0 errors.
- [ ] **Step 3: Run full Vitest suite**
  `npm run test`
  Expected: 345+ tests pass.
- [ ] **Step 4: Run automated iOS field readiness and operational audit scripts**
  `node scripts/verify-ios-field-readiness.cjs`
  `node scripts/deep-operational-e2e.cjs`
  Expected: All PASS.
- [ ] **Step 5: Test iOS bundle export**
  `npm run mobile:export:ios`
  Expected: 0 errors, clean Hermes bytecode.
