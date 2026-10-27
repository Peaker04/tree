# iOS Safe Area, Tree Scope Hierarchy, Motion Stability & Background Refresh Architecture Specification

**Date:** 2026-10-27  
**Status:** Draft / Proposed  
**Author:** Mobile & FE Lead Architect  
**Platform:** Dual-Platform (iOS Primary HIG & Samsung Galaxy Note 20 Ultra Android Testbed)  
**Standard:** Living Botanical Operational Design System / Expo SDK 57 / React Native 0.86  
**Target:** `apps/mobile`, `packages/contracts`, `.agents/memory/UI_UX_MEMORY.md`

---

## 1. Problem Statement & Root Cause Synthesis

Following live outdoor testing on iPhone via Expo Go and deep technical inspection of the mobile code, four systemic architectural defects were diagnosed:

### 1.1 iOS Safe Area Deficit & Content Collision Under Status Bar / Dynamic Island
* **Root Cause:**
  1. In `apps/mobile/App.tsx`, `<SafeAreaProvider initialMetrics={initialWindowMetrics}>` feeds static metrics that can evaluate to `{ insets: { top: 0, bottom: 0, left: 0, right: 0 } }` at bundle initialization in Expo Go, caching a 0dp top inset until layout reflow.
  2. In multiple screens (`StaffHome.tsx`, `ManagerCreateTask.tsx`, `StaffProofFlow.tsx`), `<ScreenHeader>` is placed directly inside `<ScrollView>` or `<FlatList>`. When scrolling, headings and buttons scroll directly under the iPhone clock, battery pill, and Dynamic Island.
  3. Camera screens (`StaffProofFlow.tsx`) declare fixed `padding: 16`, completely ignoring `insets.top`, causing Back buttons to collide with the camera island.
* **Impact:** Violates Rule UI-020 & iOS Human Interface Guidelines (HIG). Content is visually clipped, unreadable, and touch targets become difficult to tap.

### 1.2 Tree Scope Hierarchy Flattening in Task Dispatch (`TreeScopeSelectorSheet.tsx`)
* **Root Cause:** In the previous refactor eliminating fake address-split zone fabrication (`.split(',').pop()`), `TreeScopeSelectorSheet.tsx` was over-simplified to exclusively support single-tree radio selection.
* **Impact:** Managers are unable to dispatch routine care for multiple trees (`multi_trees`) or entire operational zones (`zone`), breaking parity with the backend schema `TreeScopeSchema` (`mode: 'zone' | 'multi_trees' | 'single_tree'`).

### 1.3 Screen Flickering / Flashing Due to Over-Reactive `AnimatedScreenTransition`
* **Root Cause:** In `AnimatedScreenTransition` (`AppPrimitives.tsx`), `React.useEffect` has `[children, fadeAnim]` in its dependency array.
* Because `children` is a ReactElement reference created on every render, **every single keystroke in text fields or internal state change resets `fadeAnim.setValue(0)`**, causing the entire screen to blink white/transparent for 140ms.
* **Impact:** Stiff, distracting visual flashes that make typing and rapid list navigation feel broken.

### 1.4 Automatic Screen-Enter Refresh Triggering Violent Layout Shift
* **Root Cause:**
  1. `ManagerReview.tsx` contained an eager `useEffect` that called `props.onRefreshData()` on every tab focus.
  2. Calling `refreshData()` set `dataSource.loading = true` globally in `MobileApp.tsx`.
  3. Screens tied their `<RefreshControl refreshing={Boolean(props.dataSource?.loading)}>` directly to this global flag.
  4. On iOS, `UIRefreshControl` automatically forces a 60dp vertical spacer at the top of the list when `refreshing={true}`, then snaps back when finished.
* **Impact:** Tab switching causes content to violently jump down by 60dp and snap back up 300ms later, violating layout stability principles.

---

## 2. Architectural Principles & Structural Solutions

### 2.1 Principle 1: Dedicated Screen Shell & Anchored Header (Rule UI-049)
* **Decoupled SafeAreaProvider:** Remove hardcoded `initialMetrics` in `App.tsx` to allow dynamic native measurement.
* **Anchored Header Pattern:** Every top-level screen and modal adopts a 2-tier layout:
  ```tsx
  <View style={[styles.root, { paddingTop: insets.top }]}>
    <ScreenHeader title="..." subtitle="..." action={...} />
    <View style={styles.contentWrap}>
      {/* Scrollable list or form scrolls beneath the anchored header */}
    </View>
  </View>
  ```
* **Camera Safe Top:** Camera screens dynamically add `paddingTop: Math.max(insets.top, 24)` so controls sit safely below the Dynamic Island.

### 2.2 Principle 2: 3-Tier Tree Scope Hierarchy (Rule UI-050)
* Re-architect `TreeScopeSelectorSheet.tsx` with a segmented header supporting 3 distinct modes:
  1. **Đơn lẻ (`single_tree`)**: Radio selection for 1 target tree.
  2. **Nhiều cây (`multi_trees`)**: Checkbox list, "Chọn tất cả" / "Bỏ chọn", live count badge.
  3. **Khu vực (`zone`)**: Group trees by `zoneId` / street / ward, displaying zone cards with tree counts. Selecting a zone automatically resolves all tree IDs.
* Return payload conforms strictly to `TreeScopeSchema`:
  ```ts
  {
    mode: 'zone' | 'multi_trees' | 'single_tree',
    zoneId?: string,
    treeIds: string[]
  }
  ```

### 2.3 Principle 3: Key-Based Transition Stability (Rule UI-051)
* Refactor `AnimatedScreenTransition` to accept a stable `screenKey: string`.
* Dependency array watches only `[screenKey]`.
* Opacity animates from `0.7` to `1.0` (duration: 160ms, easing: `Easing.out(Easing.quad)`).
* Result: Zero flicker during keystrokes or local state updates; smooth tab cross-fades.

### 2.4 Principle 4: Stale-While-Revalidate & Layout-Stable Refresh (Rule UI-052)
* **Separation of Concerns:**
  - `isPullRefreshing`: Only `true` when user actively pulls the list down.
  - `isSilentSyncing`: Background sync on tab focus or mount runs quietly without forcing `UIRefreshControl` expansion.
* **Eliminate Auto-Refresh Layout Jumps:**
  - Remove eager `useEffect` refresh in `ManagerReview.tsx`.
  - Cache/snapshot renders immediately (0ms latency); background data revalidates without layout shifts.

---

## 3. Data Contracts & Interfaces

### 3.1 `TreeScopeSelectorSheetProps`
```ts
export type ScopeMode = 'single_tree' | 'multi_trees' | 'zone';

export interface TreeScopeSelection {
  mode: ScopeMode;
  zoneId?: string;
  treeIds: string[];
}

export interface TreeScopeSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  trees: TreeScopeItem[];
  selectedScope?: TreeScopeSelection;
  onConfirm: (scope: TreeScopeSelection) => void;
}
```

### 3.2 `AnimatedScreenTransitionProps`
```ts
export interface AnimatedScreenTransitionProps {
  screenKey: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
```

---

## 4. Verification & Acceptance Criteria

1. **iOS Safe Area:** On iPhone with Dynamic Island or Notch, headers, back buttons, and status texts never collide with system indicators.
2. **Tree Scope:** In `ManagerCreateTask`, user can switch between Single Tree, Multi-Tree, and Zone, with correct tree counts and valid form submission.
3. **Motion Stability:** Typing in text fields or checking checklist items causes 0 screen flickers.
4. **Layout Stability:** Switching tabs displays content instantly without 60dp vertical jumping.
5. **Quality Gates:** 100% typecheck pass, 0 lint warnings, all Vitest tests pass.
