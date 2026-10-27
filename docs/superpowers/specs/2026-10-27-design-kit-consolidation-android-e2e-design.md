# Design Kit Consolidation, Shared Primitives & Android Physical E2E Architecture Specification

**Date:** 2026-10-27  
**Status:** Approved  
**Author:** Mobile & FE Lead Architect  
**Platform:** Dual-Platform (iOS Primary Production HIG & Samsung Galaxy Note 20 Ultra Android Testbed)  
**Standard:** Living Botanical Operational Design System / Expo SDK 57 / React Native 0.86  
**Target:** `apps/mobile/src/components/AppPrimitives.tsx`, `packages/ui`, `scripts/mobile-lifecycle-e2e.cjs`, `.agents/memory/UI_UX_MEMORY.md`

---

## 1. Problem Statement & Tree Architecture Audit

Following our comprehensive tree architecture audit, four foundational component gaps in `AppPrimitives.tsx` were identified that force screens to implement ad-hoc local styling, fragmenting the visual design language and complicating cross-platform maintenance:

### 1.1 Fragmented Filter & Segmented Switchers
* **Current State:**
  - `TreeScopeSelectorSheet`: Declares local `styles.segmentBar` and `styles.segmentTab`.
  - `StaffWork`: Declares local `styles.filter` and `styles.filterActive`.
  - `StaffTrees`: Re-implements local `styles.filter` and `styles.filterActive`.
  - `ManagerCreateTask`: Declares local `styles.shiftSelectorRow` and `styles.shiftChip`.
* **Architectural Flaw:** Four separate screens implement four slightly different segmented tab and filter chip rows with inconsistent paddings, border radiuses, and active states.

### 1.2 Fragmented Radio & Checkbox Selection Rows
* **Current State:**
  - `TreeScopeSelectorSheet`: Manually renders `styles.radioCircle`, `styles.radioDot`, and `styles.checkboxBox`.
  - `ManagerCreateTask`: Manually renders `SelectionField` with custom icons and right chevrons.
  - `ManagerReview`: Manually renders `DecisionOption` with custom radio buttons and tone borders.
* **Architectural Flaw:** Repeated manual implementations of selection controls without shared tactile feedback or unified accessibility roles.

### 1.3 Fragmented KPI & Metric Cards
* **Current State:**
  - `StaffHome`: Implements local `Metric` (`styles.metric`, `styles.metricHeader`, `styles.metricValue`).
  - `ManagerDashboard`: Implements local `MetricPill` (`styles.metricPill`, `styles.metricPillTop`, `styles.metricPillValue`).
  - `TaskSurfaces`: Implements another `Metric` (`styles.metricCard`, `styles.metricTile`).
* **Architectural Flaw:** Three incompatible implementations of KPI tiles, resulting in visual inconsistency between Staff and Manager dashboards.

---

## 2. Shared Primitive Architecture in `AppPrimitives.tsx`

### 2.1 `SegmentedFilterBar` Primitive
A unified, tactile segmented tab and filter chip component:
```tsx
export interface FilterOption<T extends string = string> {
  id: T;
  label: string;
  icon?: IconName;
  badge?: number | string;
}

export function SegmentedFilterBar<T extends string>({
  options,
  selectedId,
  onSelect,
  variant = 'segmented', // 'segmented' (fixed row) | 'scrollable' (horizontal pills)
  style,
}: {
  options: readonly FilterOption<T>[] | FilterOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  variant?: 'segmented' | 'scrollable';
  style?: StyleProp<ViewStyle>;
})
```
* **Visuals:** Uses Living Botanical tokens: `#faf7ef` card container, `#15803d` primary active state, smooth $0.97\times$ spring tap feedback via `PressableScale`.

### 2.2 `SelectableItemRow` Primitive
A unified, accessible selection row supporting single (radio) and multiple (checkbox) selection:
```tsx
export function SelectableItemRow({
  title,
  subtitle,
  badge,
  icon,
  selected,
  mode = 'radio', // 'radio' | 'checkbox'
  onPress,
  disabled,
  style,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: IconName;
  selected: boolean;
  mode?: 'radio' | 'checkbox';
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
})
```
* **Visuals:** Padded card container, tactile press feedback, high-contrast radio/checkbox indicator, and clean truncate handling for long Vietnamese text.

### 2.3 `MetricStatTile` Primitive
A unified KPI metric card for operational dashboards:
```tsx
export function MetricStatTile({
  label,
  value,
  icon,
  tone = 'neutral', // 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  onPress,
  style,
}: {
  label: string;
  value: number | string;
  icon?: IconName;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
})
```
* **Visuals:** Standardized top icon/dot row, bold 24pt metric counter, clear secondary label, and semantic status borders.

---

## 3. Strict Taste Skill & Impeccable Design Governance

* **Mode:** `Operate` (Utilitarian, calm, high-contrast outdoor readability).
* **Three Dials:** `DESIGN_VARIANCE: 5`, `MOTION_INTENSITY: 4`, `VISUAL_DENSITY: 6`.
* **Anti-Slop Hard Guards:**
  - Zero emojis in buttons, chips, or labels.
  - Zero decorative card nesting.
  - Touch targets locked to $\ge 44\times 44\text{dp}$; primary field actions $48\text{–}52\text{dp}$.
  - Edge-to-edge canvas with safe anchored `ScreenHeader`.

---

## 4. Android Physical E2E Verification Strategy

* **Testbed:** Samsung Galaxy Note 20 Ultra (`SM-N986N`, serial `R3CN70ED57A`, user 0).
* **Transport:** Local USB `adb reverse tcp:3000 tcp:3000` (Fastify API) & `tcp:8082 tcp:8082` (Metro).
* **Harness:** `scripts/mobile-lifecycle-e2e.cjs` covering:
  1. Staff login & dashboard orientation.
  2. Task check-in: GPS satellite acquisition + QR code match.
  3. Evidence capture & 100% checklist completion.
  4. Supervisor verification & photo upload.
  5. Manager dashboard metrics & evidence review approval.
  6. Task creation with 3-tier tree scope selection.
* **Output:** Clean PASS report + physical screenshot & XML UI dump verification.
