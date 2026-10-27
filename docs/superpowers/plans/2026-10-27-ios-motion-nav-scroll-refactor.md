# iOS Navigation, Motion, Scrollbar & NFR Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate floating navigation bar on iOS, eradicate all unwanted scrollbars, add fluid micro-spring motion to buttons and modals, eliminate Fabric `LayoutAnimation` frame drops, and resolve NFR violations.

**Architecture:** Normalize `NotchedBottomNav` geometry to standard iOS HIG (56dp base bar height + single Home Indicator inset). Sweep all `ScrollView`, `FlatList`, and `<WebView>` components with `showsVerticalScrollIndicator={false}` and scrollbar suppression CSS. Upgrade `Button` with hardware-accelerated spring compression scale ($0.97\times$) and Taptic touch feedback. Introduce `AnimatedScreenTransition` for snappy tab cross-fades.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript strict, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-ios-motion-nav-scroll-refactor-design.md`

## Global Constraints

- Navigation bar on iOS must sit flush above the Home Indicator bar with 56dp base height (Rule UI-042).
- Every `ScrollView`, `FlatList`, and `WebView` must hide raw scrollbars (Rule UI-043).
- Buttons must provide tactile spring feedback ($0.97\times$ scale) with native driver (Rule UI-044).
- Never use `LayoutAnimation.configureNext` inside Fabric New Architecture.
- Zero new runtime dependencies; use existing React Native / Expo primitives.
- 100% typecheck and lint pass.

## Review Focus

1. On iPhone with Home Bar (`insets.bottom === 34`), the bottom nav bar sits flush without a 50dp floating empty gap.
2. Fast scrolling on long task lists and tree lists never displays a vertical scrollbar pill.
3. Rapidly tapping buttons scales smoothly without visual layout snapping or frame stutter.
4. Switching between Home, Trees, and Work tabs transitions smoothly without white flash.
5. Android 3-button navigation (`insets.bottom >= 40`) remains fully functional without regression.

---

### Task 1: Record UI-042, UI-043, UI-044 in UI/UX Memory

**Files:**
- Modify: `.agents/memory/UI_UX_MEMORY.md`

**Interfaces:**
- Produces: Rules `UI-042`, `UI-043`, `UI-044` in `UI_UX_MEMORY.md`

- [ ] **Step 1: Add rules to Known-Failure Register**

- `UI-042`: Navigation bar floating high on iOS due to Android 3-button padding collision. Rule: iOS base height 56dp + exact Home Bar inset.
- `UI-043`: Raw vertical scrollbars popping over card borders. Rule: `showsVerticalScrollIndicator={false}` across all scroll views and WebViews.
- `UI-044`: Stiff hard-mounted views and lifeless button clicks. Rule: Micro-spring scale ($0.97\times$), screen fade transition, and Fabric-safe animation.

- [ ] **Step 2: Commit**

```bash
git add .agents/memory/UI_UX_MEMORY.md
git commit -m "docs(memory): record UI-042 to UI-044 iOS navigation, scrollbar and motion rules"
```

---

### Task 2: Standardize `NotchedBottomNav.tsx` for iOS Platform Geometry

**Files:**
- Modify: `apps/mobile/src/components/NotchedBottomNav.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: Platform-conforming `NotchedBottomNav` with 56dp iOS base height and flush bottom seating.

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**

Assert:
- `BASE_BAR_HEIGHT = Platform.OS === 'ios' ? 56 : 64`.
- `NotchedBottomNav.tsx` does not use inflated 82dp height for iOS.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-042"`
Expected: FAIL.

- [ ] **Step 3: Refactor `NotchedBottomNav.tsx`**

- Set `BASE_BAR_HEIGHT = Platform.OS === 'ios' ? 56 : 64`.
- Calculate `bottomPadding`:
  - On iOS: `insets.bottom` (34dp on Home Bar phones, 0 on older models).
  - On Android: `insets.bottom >= 40 ? insets.bottom : 0`.
- In `styles.content`:
  Set `paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.xs`.
- In `useBottomNavPadding`:
  Return `BASE_BAR_HEIGHT + bottomPadding + extraGap`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-042"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/NotchedBottomNav.tsx tests/mobile/ui-foundation.spec.ts
git commit -m "fix(mobile): standardize bottom navigation bar geometry for iOS Home Indicator"
```

---

### Task 3: Eliminate Raw Scrollbars Across All Screens

**Files:**
- Modify: `apps/mobile/src/screens/staff/StaffHome.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffWork.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffTrees.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffArea.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerDashboard.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerTrees.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerCreateTask.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerReview.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerQrLookup.tsx`
- Modify: `apps/mobile/src/screens/auth/AuthScreens.tsx`
- Modify: `apps/mobile/src/components/TreeScopeSelectorSheet.tsx`
- Modify: `apps/mobile/src/components/ManualTreeCodeModal.tsx`
- Modify: `apps/mobile/src/components/presentation/WebMapView.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: Clean, scrollbar-free native views across all screens.

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**

Assert:
- `WebMapView.tsx` contains CSS scrollbar suppression `::-webkit-scrollbar { display: none`.
- `StaffHome.tsx`, `StaffWork.tsx`, `StaffTrees.tsx`, `ManagerCreateTask.tsx`, `ManagerDashboard.tsx` contain `showsVerticalScrollIndicator={false}`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-043"`
Expected: FAIL.

- [ ] **Step 3: Add `showsVerticalScrollIndicator={false}` to all scroll containers**

- Add `showsVerticalScrollIndicator={false}` to every `<ScrollView>` and `<FlatList>`.
- In `WebMapView.tsx`, add `showsVerticalScrollIndicator={false}` and `showsHorizontalScrollIndicator={false}` on `<WebView>`, and inject CSS:
  `::-webkit-scrollbar { display: none !important; width: 0px !important; height: 0px !important; }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-043"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/ tests/mobile/ui-foundation.spec.ts
git commit -m "style(mobile): eliminate raw scrollbars across all mobile scrollviews, lists and webviews"
```

---

### Task 4: Implement Micro-Spring Motion & Fluid Transitions

**Files:**
- Modify: `apps/mobile/src/components/AppPrimitives.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffArea.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerArea.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffTrees.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerTrees.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: `Button` with $0.97\times$ spring compression; `AnimatedScreenTransition` wrapper; zero `LayoutAnimation` in Fabric.

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**

Assert:
- `Button` in `AppPrimitives.tsx` contains `scale` transform.
- `StaffTrees.tsx` and `ManagerTrees.tsx` do not invoke `LayoutAnimation.configureNext`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-044"`
Expected: FAIL.

- [ ] **Step 3: Implement spring press and smooth transitions**

- In `AppPrimitives.tsx`:
  - Upgrade `Button` with `Animated.Value(1)`: on `onPressIn`, animate scale to `0.97` (duration 80ms, `useNativeDriver: true`). On `onPressOut`, spring back to `1.0`.
  - Trigger `triggerTactileFeedback('light')` on press.
  - Export `AnimatedScreenTransition`: wraps children with `Animated.View` fading in (opacity 0 to 1 in 140ms with `Easing.out(Easing.cubic)`).
- Remove `LayoutAnimation.configureNext` from `StaffTrees.tsx`, `ManagerTrees.tsx`, `ManagerReview.tsx`, `StaffProofFlow.tsx`.
- Wrap tab contents in `AnimatedScreenTransition`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-044"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/ tests/mobile/ui-foundation.spec.ts
git commit -m "feat(mobile): add micro-spring button motion, tab transitions, and eliminate Fabric LayoutAnimation"
```

---

### Task 5: Comprehensive Quality Verification

**Files:**
- Entire repository

- [ ] **Step 1: Run mobile typecheck**

Run: `npm run typecheck --workspace @novyx/mobile`
Expected: 0 errors.

- [ ] **Step 2: Run monorepo lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Run full Vitest suite**

Run: `npm run test`
Expected: 333+ tests pass.

- [ ] **Step 4: Verify iOS and Android exports**

Run: `npm run mobile:export:ios && npm run mobile:export:android`
Expected: Both export with 0 errors.
