# iOS Safe Area, Tree Scope Hierarchy, Motion Stability & Background Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate iOS status bar/Dynamic Island overlaps via anchored safe headers, restore the 3-tier tree scope hierarchy (Zone, Multi-tree, Single-tree), eradicate screen flickering in animations, and eliminate violent layout shifts during tab switching.

**Architecture:** Refactor `AnimatedScreenTransition` to key-based animation to prevent rerender opacity resets. Decouple background data sync from `UIRefreshControl` to ensure layout stability. Upgrade `TreeScopeSelectorSheet` to support segmented Single, Multi-tree, and Zone selection. Anchor `ScreenHeader` with `useSafeAreaInsets().top` above scrolling content.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript strict, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-ios-safe-area-scope-motion-refresh-design.md`

## Global Constraints

- Never place top navigation headers under scrolling viewports where they can collide with the iOS Dynamic Island/Notch (Rule UI-049).
- Task dispatch must support Single Tree, Multi-Tree, and Zone selection conforming to `TreeScopeSchema` (Rule UI-050).
- `AnimatedScreenTransition` must key on route/screen ID and never reset opacity on `children` rerenders (Rule UI-051).
- Screen focus or tab switching must never force-expand `UIRefreshControl` or cause 60dp vertical layout shifts (Rule UI-052).
- Zero new runtime dependencies; strictly dual-platform compatible (iOS & Android).
- 100% typecheck and lint pass.

## Review Focus

1. On iPhone with Dynamic Island (`insets.top >= 44`), titles and back buttons sit cleanly below system indicators.
2. Typing into any search bar or input field never causes a white or transparent screen flicker.
3. Switching between Manager and Staff tabs loads cached data instantly without a 60dp drop and snap-back.
4. `TreeScopeSelectorSheet` allows switching between Single Tree, Multi-Tree, and Zone, correctly tracking tree IDs.
5. Android layout behavior remains 100% intact with zero visual regressions.

---

### Task 1: Record Rules UI-049 to UI-052 in UI/UX Memory

**Files:**
- Modify: `.agents/memory/UI_UX_MEMORY.md`

**Interfaces:**
- Produces: Rules `UI-049`, `UI-050`, `UI-051`, `UI-052` in `UI_UX_MEMORY.md`

- [ ] **Step 1: Add rules to Known-Failure Register**

Add rows to the Known-failure register table:
- `UI-049`: Headers inside ScrollView colliding with iOS status bar/Dynamic Island. Rule: Dedicated anchored header using `insets.top`.
- `UI-050`: Flattened tree selection missing Zone and Multi-tree capabilities. Rule: 3-tier segmented scope (Single, Multi, Zone) conforming to `TreeScopeSchema`.
- `UI-051`: `AnimatedScreenTransition` resetting opacity on every keystroke due to `[children]` dependency. Rule: Key-based transition `[screenKey]` with 0.7 to 1.0 smooth fade.
- `UI-052`: Tab transitions triggering eager refresh and 60dp `UIRefreshControl` layout jump. Rule: Stale-while-revalidate silent sync; pull-to-refresh reserved for explicit user gestures.

- [ ] **Step 2: Commit memory updates**

```bash
git add .agents/memory/UI_UX_MEMORY.md
git commit -m "docs(memory): record UI-049 to UI-052 safe area, tree scope, motion and refresh rules"
```

---

### Task 2: Eradicate Screen Flickering in `AnimatedScreenTransition`

**Files:**
- Modify: `apps/mobile/src/components/AppPrimitives.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerArea.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffArea.tsx`
- Modify: `apps/mobile/src/screens/supervisor/SupervisorArea.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: `AnimatedScreenTransition({ screenKey, children, style })`

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**

Assert:
- `AnimatedScreenTransition` accepts `screenKey`.
- `AnimatedScreenTransition` does not have `children` in its `useEffect` dependency array.
- Initial fade starts at `0.7` or `1` rather than `0` to prevent white flashes.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-051"`
Expected: FAIL.

- [ ] **Step 3: Refactor `AnimatedScreenTransition`**

In `apps/mobile/src/components/AppPrimitives.tsx`:
```tsx
export function AnimatedScreenTransition({
  screenKey,
  children,
  style,
}: {
  screenKey?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    fadeAnim.setValue(0.7);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [screenKey, fadeAnim]);

  return <Animated.View style={[{ flex: 1, opacity: fadeAnim }, style]}>{children}</Animated.View>;
}
```
Update callers in `ManagerArea.tsx`, `StaffArea.tsx`, and `SupervisorArea.tsx` to pass `screenKey={props.activeStep}` or the relevant step identifier.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-051"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/AppPrimitives.tsx apps/mobile/src/screens/manager/ManagerArea.tsx apps/mobile/src/screens/staff/StaffArea.tsx apps/mobile/src/screens/supervisor/SupervisorArea.tsx tests/mobile/ui-foundation.spec.ts
git commit -m "fix(mobile): eliminate screen flickering with key-based transition and 0.7 floor"
```

---

### Task 3: Eliminate Tab Transition Layout Shifts & Eager Refresh

**Files:**
- Modify: `apps/mobile/src/screens/manager/ManagerReview.tsx`
- Modify: `apps/mobile/src/screens/MobileApp.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: Layout-stable tab switching with separate `isPullRefreshing` state.

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**

Assert:
- `ManagerReview.tsx` does not trigger `refreshData()` in `useEffect` on tab step transition.
- Pull-to-refresh maintains local gesture state and does not cause eager layout expansion on mount.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-052"`
Expected: FAIL.

- [ ] **Step 3: Refactor refresh mechanics**

1. In `ManagerReview.tsx`:
   Remove the eager `useEffect` that called `void refreshData?.()` on every step change.
   Add local `pullRefreshing` state:
   ```tsx
   const [pullRefreshing, setPullRefreshing] = useState(false);
   const handlePullRefresh = async () => {
     setPullRefreshing(true);
     try {
       await props.onRefreshData?.();
     } finally {
       setPullRefreshing(false);
     }
   };
   ```
   Pass `refreshing={pullRefreshing}` to `<RefreshControl>`.
2. Apply the same pattern to `ManagerDashboard.tsx`, `ManagerTrees.tsx`, `StaffTrees.tsx`, and `StaffWork.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-052"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/screens/manager/ManagerReview.tsx apps/mobile/src/screens/manager/ManagerDashboard.tsx apps/mobile/src/screens/manager/ManagerTrees.tsx apps/mobile/src/screens/staff/StaffTrees.tsx apps/mobile/src/screens/staff/StaffWork.tsx tests/mobile/ui-foundation.spec.ts
git commit -m "fix(mobile): eliminate eager tab refresh and layout shifts with gesture-bound pull refresh"
```

---

### Task 4: Re-architect `TreeScopeSelectorSheet` with 3-Tier Hierarchy

**Files:**
- Modify: `apps/mobile/src/components/TreeScopeSelectorSheet.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerCreateTask.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Consumes: `TreeScopeItem[]`, `TreeScopeSelection`
- Produces: 3-tier selector supporting `single_tree`, `multi_trees`, and `zone` modes.

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**

Assert:
- `TreeScopeSelectorSheet` exports `ScopeMode = 'single_tree' | 'multi_trees' | 'zone'`.
- Segmented controls allow switching between "1 Cây", "Nhiều cây", and "Khu vực".
- Multi-tree mode supports toggling individual tree checkboxes.
- Zone mode groups trees by area/address/cluster and selects all trees in the zone.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-050"`
Expected: FAIL.

- [ ] **Step 3: Implement 3-tier segmented `TreeScopeSelectorSheet`**

1. Add Segmented Bar at top:
   - `single_tree` (1 Cây)
   - `multi_trees` (Nhiều cây)
   - `zone` (Khu vực / Cụm)
2. In `single_tree` mode:
   Render list with Radio indicator (single selection).
3. In `multi_trees` mode:
   Render list with Checkbox indicators, "Chọn tất cả" / "Bỏ chọn", and count badge.
4. In `zone` mode:
   Group trees by canonical cluster/zone (or street/area fallback). Render zone cards showing tree counts. Selecting a zone marks all trees in that zone.
5. In `ManagerCreateTask.tsx`:
   Display selected scope badge: `1 cây`, `3 cây`, or `Khu A (8 cây)`. Pass full `scope` payload to `createTask`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-050"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/TreeScopeSelectorSheet.tsx apps/mobile/src/screens/manager/ManagerCreateTask.tsx tests/mobile/ui-foundation.spec.ts
git commit -m "feat(mobile): implement 3-tier tree scope selection for single, multi-tree and zone dispatch"
```

---

### Task 5: Standardize iOS Safe Area & Anchored Screen Headers

**Files:**
- Modify: `apps/mobile/App.tsx`
- Modify: `apps/mobile/src/components/AppPrimitives.tsx`
- Modify: `apps/mobile/src/screens/MobileApp.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffHome.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerCreateTask.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: Non-colliding anchored headers respecting iOS dynamic insets.

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**

Assert:
- `App.tsx` does not supply static `initialWindowMetrics` that can cache 0 insets.
- Screen containers apply `useSafeAreaInsets().top` to anchor headers outside scrollable content.
- Camera dark header includes safe area top padding.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-049"`
Expected: FAIL.

- [ ] **Step 3: Refactor Safe Area & Header Anchoring**

1. In `apps/mobile/App.tsx`:
   Remove `initialMetrics={initialWindowMetrics}` to allow clean runtime measurement.
2. In `StaffHome.tsx`, `ManagerCreateTask.tsx`, `StaffProofFlow.tsx`:
   Anchor `ScreenHeader` above the `<ScrollView>` with `useSafeAreaInsets().top`.
   Content scrolls beneath the anchored header without clipping under the system status bar.
3. In `StaffProofFlow.tsx` camera views:
   Add `paddingTop: Math.max(insets.top, 24)` to `styles.cameraScreen`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-049"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/App.tsx apps/mobile/src/components/AppPrimitives.tsx apps/mobile/src/screens/MobileApp.tsx apps/mobile/src/screens/staff/StaffHome.tsx apps/mobile/src/screens/staff/StaffProofFlow.tsx apps/mobile/src/screens/manager/ManagerCreateTask.tsx tests/mobile/ui-foundation.spec.ts
git commit -m "fix(mobile): anchor screen headers outside scrollviews with dynamic ios safe insets"
```

---

### Task 6: Comprehensive Verification & Automated Monorepo Quality Gate

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
Expected: 338+ tests pass.

- [ ] **Step 4: Run automated iOS field readiness and operational audit scripts**

Run: `node scripts/verify-ios-field-readiness.cjs`
Expected: 20/20 PASS.
Run: `node scripts/deep-operational-e2e.cjs`
Expected: 18/18 PASS.

- [ ] **Step 5: Test iOS bundle export**

Run: `npm run mobile:export:ios`
Expected: 0 errors, clean Hermes bytecode.
