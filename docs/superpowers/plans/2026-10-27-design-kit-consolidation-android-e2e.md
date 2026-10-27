# Design Kit Consolidation, Shared Primitives & Android Physical E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate missing shared design primitives (`SegmentedFilterBar`, `SelectableItemRow`, `MetricStatTile`) into `AppPrimitives.tsx`, eliminate ad-hoc local styling across operational screens, and execute full automated E2E lifecycle testing on the physical Samsung Galaxy Note 20 Ultra.

**Architecture:** Build the three missing primitives in `AppPrimitives.tsx` using Living Botanical tokens and `PressableScale`. Refactor consuming screens (`TreeScopeSelectorSheet`, `StaffWork`, `StaffTrees`, `ManagerCreateTask`, `StaffHome`, `ManagerDashboard`). Run `mobile-lifecycle-e2e.cjs` over ADB reverse proxy.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript strict, Vitest, Android ADB automation.

**Spec:** `docs/superpowers/specs/2026-10-27-design-kit-consolidation-android-e2e-design.md`

## Global Constraints

- Mode: `Operate`. Density 6/10. Zero emojis in buttons, chips, or labels.
- Touch targets $\ge 44\times 44\text{dp}$; primary field actions $48\text{–}52\text{dp}$.
- Dual-platform parity: identical behavior on iOS (Dynamic Island / Notch) and Android.
- Zero new runtime dependencies; 100% typecheck and lint pass.

---

### Task 1: Record Rule UI-054 in UI/UX Memory

**Files:**
- Modify: `.agents/memory/UI_UX_MEMORY.md`

**Interfaces:**
- Produces: Rule `UI-054` in `UI_UX_MEMORY.md`

- [ ] **Step 1: Add rule UI-054 to Known-Failure Register**
  - `UI-054`: Screens implementing fragmented local chips, radio circles, and KPI tiles. Rule: Use shared `SegmentedFilterBar`, `SelectableItemRow`, and `MetricStatTile` primitives in `AppPrimitives.tsx`.
- [ ] **Step 2: Commit**
  ```bash
  git add .agents/memory/UI_UX_MEMORY.md
  git commit -m "docs(memory): record UI-054 shared primitive consolidation rule"
  ```

---

### Task 2: Implement Shared Primitives in `AppPrimitives.tsx`

**Files:**
- Modify: `apps/mobile/src/components/AppPrimitives.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces:
  - `SegmentedFilterBar({ options, selectedId, onSelect, variant, style })`
  - `SelectableItemRow({ title, subtitle, badge, icon, selected, mode, onPress, disabled, style })`
  - `MetricStatTile({ label, value, icon, tone, onPress, style })`

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**
  Assert:
  - `AppPrimitives.tsx` exports `SegmentedFilterBar`, `SelectableItemRow`, and `MetricStatTile`.
  - `SegmentedFilterBar` supports both `segmented` and `scrollable` variants.
  - `SelectableItemRow` supports both `radio` and `checkbox` modes.
  - `MetricStatTile` renders semantic tone styling.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-054"`
  Expected: FAIL.
- [ ] **Step 3: Implement components in `AppPrimitives.tsx`**
  Implement the 3 primitives with `PressableScale` tactile touch feedback and Living Botanical tokens.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-054"`
  Expected: PASS.
- [ ] **Step 5: Commit**
  ```bash
  git add apps/mobile/src/components/AppPrimitives.tsx tests/mobile/ui-foundation.spec.ts
  git commit -m "feat(mobile): add SegmentedFilterBar, SelectableItemRow, and MetricStatTile primitives"
  ```

---

### Task 3: Refactor Screens to Consume Shared Primitives

**Files:**
- Modify: `apps/mobile/src/components/TreeScopeSelectorSheet.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffHome.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffWork.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffTrees.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerDashboard.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerCreateTask.tsx`

**Interfaces:**
- Replaces ad-hoc local styling with clean shared primitives across all 6 screens.

- [ ] **Step 1: Refactor `TreeScopeSelectorSheet.tsx`**
  Use `SegmentedFilterBar` for mode switching (1 Cây / Nhiều cây / Khu vực) and `SelectableItemRow` for tree/zone items.
- [ ] **Step 2: Refactor `StaffWork.tsx` and `StaffTrees.tsx`**
  Use `SegmentedFilterBar variant="scrollable"` for filter options.
- [ ] **Step 3: Refactor `StaffHome.tsx` and `ManagerDashboard.tsx`**
  Use `MetricStatTile` for operational KPI cards.
- [ ] **Step 4: Refactor `ManagerCreateTask.tsx`**
  Use `SegmentedFilterBar` for shift selection (Cả ngày / Ca sáng / Ca chiều).
- [ ] **Step 5: Run full test suite & lint**
  Run: `npm run test && npm run lint && npm run typecheck`
  Expected: All PASS.
- [ ] **Step 6: Commit**
  ```bash
  git add apps/mobile/src/components/TreeScopeSelectorSheet.tsx apps/mobile/src/screens/staff/ apps/mobile/src/screens/manager/
  git commit -m "refactor(mobile): eliminate ad-hoc styles by adopting shared design primitives across screens"
  ```

---

### Task 4: Execute Full Automated E2E Lifecycle Testing on Physical Android Testbed

**Files:**
- Modify: `scripts/mobile-lifecycle-e2e.cjs` (configure device serial `R3CN70ED57A`, user 0, and ADB reverse proxy)

**Interfaces:**
- Executes real automated lifecycle across Staff, Supervisor, and Manager roles on Samsung Galaxy Note 20 Ultra.

- [ ] **Step 1: Configure ADB device target in `scripts/mobile-lifecycle-e2e.cjs`**
  Ensure script targets `R3CN70ED57A` with `--user 0` and reverse proxy port 3000.
- [ ] **Step 2: Start local Fastify API**
  Ensure API is running on `http://127.0.0.1:3000`.
- [ ] **Step 3: Run full automated E2E lifecycle test**
  Run: `node scripts/mobile-lifecycle-e2e.cjs --scenario=all`
  Expected: All lifecycle stages PASS.
- [ ] **Step 4: Capture physical device screenshots and UI dump**
  Inspect device artifacts to verify visual layout, text wrapping, and zero status bar overlap.
- [ ] **Step 5: Commit**
  ```bash
  git add scripts/mobile-lifecycle-e2e.cjs
  git commit -m "test(mobile): configure and verify physical Android E2E lifecycle test harness"
  ```
