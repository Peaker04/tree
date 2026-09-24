# NOVYX Mobile Design & Architecture Audit

**Date:** 2026-09-19  
**Specification:** [`DESIGN.md`](../DESIGN.md) (Unified Seed Botanical Identity + Linear Structural Precision)  
**Target Platform:** Expo SDK 57 / React Native 0.86 / Android (Pixel 7a Reference)  
**Status:** Audit-First Baseline (No direct style mass-replacements executed)

---

## Authority Status

This audit remains a useful current-state inventory and migration backlog, but it is not a design authority. Root `DESIGN.md` and `docs/MOBILE_UI_RULES.md` govern active decisions; the approved master plan at `.planning/NOVYX_GREENOPS_TRUTHFUL_MOBILE_E2E_MASTER_PLAN.md` controls execution order. Line references and findings must be revalidated before implementation because the working tree has advanced since this audit.

## 1. Executive Summary

This repository-wide audit systematically evaluates the NOVYX GreenOps mobile application (`apps/mobile`) against the newly established, authoritative [`DESIGN.md`](../DESIGN.md).

The evaluation confirms that while the recently refactored **`StaffHome` screen represents an approved reference implementation** that successfully embodies the Seed + Linear philosophy, the remaining screens across both the **Staff** and **Manager** experiences exhibit substantial architectural and visual drift.

### High-Level Metrics

- **Total User-Facing Screens & Steps Audited:** 16 distinct screen views / workflow steps across Staff, Manager, and Shared shells.
- **Total Identified Issues:** 24 issues categorized by engineering severity:
  - **BLOCKER:** 0 (No app-breaking crashes or fatal compile errors)
  - **HIGH Severity:** 7 (Domain state reconstruction in JSX, non-virtualized lists, `GradientCard` proliferation, dead code divergence)
  - **MEDIUM Severity:** 12 (Card nesting fatigue, font-weight shouting 800/900, raw hex literals, metric fragmentation)
  - **LOW Severity:** 5 (Minor spacing inconsistencies, legacy token references, cosmetic touch-ups)
- **Primary Architectural Insight:** Visual inconsistencies are largely symptoms of **structural drift**:
  1. Screens independently recalculating workflow state instead of projecting domain models from [`mobileWorkflow.ts`](../apps/mobile/src/domain/mobileWorkflow.ts).
  2. Heavy decorative legacy components (notably [`GradientCard`](../apps/mobile/src/components/AppPrimitives.tsx#L32-L72)) being used as default wrappers.
  3. Lists rendered via `.map()` inside `ScrollView`, posing severe memory and rendering risks on compact Android devices.

---

## 2. Screen Inventory

| Screen / Step                       | Role    | Purpose & Main Workflow                             | Shared Components Used                                                                         | Current Visual Pattern                             | State Dependencies                               | Migration Severity | Migration Complexity |
| :---------------------------------- | :------ | :-------------------------------------------------- | :--------------------------------------------------------------------------------------------- | :------------------------------------------------- | :----------------------------------------------- | :----------------- | :------------------- |
| **`StaffHome`**                     | Staff   | Daily overview, quick stats, priority task CTA      | `BrandMark`, `Card` (warm/flat), `Metric` (unbordered), `Badge` (pill), `Button` (forest pill) | **Approved Reference** (Seed+Linear flat hairline) | `tasks`, `trees`, `notifications`, `dataSource`  | **REFERENCE**      | **None** (Base)      |
| **`StaffWork`**                     | Staff   | Task queue, status filtering, task selection        | `GradientCard`, `TaskStatusFilters`, `TaskCard`, `Badge`, `EmptyState`                         | Legacy gradient hero + stacked bordered cards      | `staffTasks`, `taskFilter`                       | **HIGH**           | **Medium**           |
| **`StaffTrees`**                    | Staff   | Assigned tree inventory, search, risk filtering     | `GradientCard`, `TreeSearchFilters`, `TreeAssignmentCard`, `EmptyState`                        | Legacy gradient hero + nested tree cards           | `assignedTrees`, `staffTasks`, `query`, `filter` | **MEDIUM**         | **Medium**           |
| **`StaffProofFlow (DETAIL)`**       | Staff   | Task overview, proof gaps, start/resume CTA         | `Header`, `Card`, `Badge`, `TaskSummary`, `ChecklistLine`, `Button`                            | Card fatigue (5+ stacked cards), primary button    | `activeTask`, `proofGaps`                        | **HIGH**           | **Medium**           |
| **`StaffProofFlow (GPS)`**          | Staff   | Field check-in, distance & accuracy verification    | `Header`, `Card`, `Button`, `DevicePermissionState`                                            | Map/location card with mock/live coordinates       | `userLat`, `userLng`, `locationAccuracy`         | **MEDIUM**         | **Low**              |
| **`StaffProofFlow (QR)`**           | Staff   | Task QR matching & free tree lookup                 | `Header`, `Card`, `DeviceCameraView`, `TreeLookupResult`                                       | Dark camera overlay + mock scan buttons            | `cameraPermission`, `scannedTree`                | **MEDIUM**         | **Medium**           |
| **`StaffProofFlow (BEFORE/AFTER)`** | Staff   | Photo evidence capture, preview & retake            | `Header`, `Card`, `DeviceCameraView`, `Button`                                                 | Native/Mock camera viewfinder + preview card       | `activeTask.evidence`, `cameraMode`              | **MEDIUM**         | **Medium**           |
| **`StaffProofFlow (CHECKLIST)`**    | Staff   | Field task item checklist confirmation              | `Header`, `Card`, `Button`                                                                     | Checkbox list with index badges                    | `activeTask.checklist`                           | **LOW**            | **Low**              |
| **`StaffProofFlow (REVIEW)`**       | Staff   | Evidence transport, proof chain gate, submit        | `Header`, `Card`, `ProofChainCard`, `PhotoPair`, `ChecklistLine`, `Field`, `Button`            | Dense multi-card summary, primary CTA              | `activeTask`, `proofGaps`, `submitting`          | **HIGH**           | **Medium**           |
| **`StaffProofFlow (SUCCESS)`**      | Staff   | Submission confirmation & return to queue           | `Card` (green), `Button` (pill)                                                                | Centered success icon and confirmation actions     | `activeTask`                                     | **LOW**            | **Low**              |
| **`StaffAccount`**                  | Staff   | Profile info, shift stats, notifications link       | `Header`, `Card`, `Metric` (bordered), `Button` (danger)                                       | Avatar card + separate metric tiles                | `completed`, `total`, `notifications`            | **LOW**            | **Low**              |
| **`ManagerDashboard`**              | Manager | HQ operations pulse, backlog, risky trees           | `GradientCard` (3x), `Metric` (bordered grid), `Card`, `Button`, `TreeIdentityVisual`          | Heavy gradient cards + fragmented metric tiles     | `tasks`, `trees`, `pendingReview`, `riskTrees`   | **HIGH**           | **High**             |
| **`ManagerReview (List)`**          | Manager | Pending review backlog, search filter               | `Header`, `GradientCard`, `Card`, `Field`, `TaskCard`, `EmptyState`                            | Gradient hero + stacked task cards                 | `pendingReview`, `reviewQuery`                   | **HIGH**           | **Medium**           |
| **`ManagerReview (Detail)`**        | Manager | Audit GPS/QR, proof chain, photos, approve/rework   | `Header`, `GradientCard`, `Card`, `ProofChainCard`, `PhotoPair`, `ChecklistLine`, `Button`     | Proof gate gradient card + 5 stacked audit cards   | `reviewTask`, `proofGaps`, `reworkReason`        | **HIGH**           | **High**             |
| **`ManagerCreateTask`**             | Manager | Guided task creation & assignation form             | `Header`, `GradientCard`, `Card`, `Field`, `Button`                                            | Gradient hero + multi-field card form              | `formState`, `trees`, `staff`                    | **MEDIUM**         | **High**             |
| **`ManagerTrees`**                  | Manager | Complete park tree directory, search & history      | `Header`, `GradientCard`, `TreeSearchFilters`, `Card`, `EmptyState`                            | Gradient hero + list of tree cards                 | `trees`, `query`, `filter`                       | **MEDIUM**         | **Medium**           |
| **`ManagerQrLookup`**               | Manager | Instant tree lookup via QR without proof advance    | `Header`, `Card`, `DeviceCameraView`, `TreeLookupResult`                                       | Dark camera viewfinder + fact sheets               | `cameraPermission`, `scannedTree`                | **LOW**            | **Medium**           |
| **`ManagerAccount`**                | Manager | Profile, session info, review queue link            | `Header`, `GradientCard`, `Metric` (bordered), `Card`                                          | Forest gradient hero + separate metric tiles       | `trees`, `tasks`, `notifications`                | **LOW**            | **Low**              |
| **`MobileApp (Shell)`**             | Shared  | Login, session restore, forgot password, bottom nav | `BrandMark`, `Card`, `Field`, `Button`, `NotchedBottomNav`                                     | Centered auth cards + bottom notched navigation    | `authSession`, `role`, `screen`                  | **MEDIUM**         | **Medium**           |

---

## 3. Detailed Issue Findings

### 3.1 Functional & Domain Findings

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN PIPELINE HEALTH                          │
│                                                                        │
│   Domain Data ──► mobileWorkflow.ts ──► Derived State ──► Screen UI    │
│                        ▲                                     ▲         │
│                        │                                     │         │
│                        └──────────── VIOLATION ──────────────┘         │
│                           (UI reconstructs domain rules)               │
└────────────────────────────────────────────────────────────────────────┘
```

#### Issue: UI-DOM-001

- **AREA:** Staff Proof Flow — Task Detail
- **FILE:** [`apps/mobile/src/screens/staff/StaffProofFlow.tsx`](../apps/mobile/src/screens/staff/StaffProofFlow.tsx#L320-L377)
- **SEVERITY:** **HIGH**
- **CATEGORY:** Domain workflow logic duplicated in JSX
- **CURRENT:**
  The `DETAIL` step manually reconstructs proof resumption and CTA text using local ternary logic:
  ```tsx
  const canResumeProof =
    props.activeTask.status === TaskStatus.IN_PROGRESS || props.activeTask.status === TaskStatus.REWORK_REQUIRED;
  // ...
  {
    props.activeTask.status === TaskStatus.WAITING_REVIEW
      ? 'Đang chờ quản lý duyệt'
      : props.activeTask.status === TaskStatus.COMPLETED
        ? 'Đã hoàn thành'
        : canResumeProof
          ? 'Hoàn thiện bằng chứng'
          : 'Bắt đầu công việc';
  }
  ```
- **EXPECTED:**
  The component must consume `getTaskProofWorkflowState(props.activeTask)` from [`mobileWorkflow.ts`](../apps/mobile/src/domain/mobileWorkflow.ts#L173), which already exposes `workflowState.activeActionText`, `workflowState.nextStep`, and `workflowState.isTerminal`.
- **WHY IT MATTERS:**
  Reconstructing business rules in presentation components leads to out-of-sync CTAs, where a task with missing GPS could jump to a photo step, bypassing prerequisite validation.
- **RECOMMENDED DIRECTION:**
  Refactor `StaffProofFlow` to derive its action button label and destination directly from `getTaskProofWorkflowState(task)`.
- **DEPENDENCIES:** [`apps/mobile/src/domain/mobileWorkflow.ts`](../apps/mobile/src/domain/mobileWorkflow.ts)

---

#### Issue: UI-DOM-002

- **AREA:** Staff Proof Flow — Review & Submission Gate
- **FILE:** [`apps/mobile/src/screens/staff/StaffProofFlow.tsx`](../apps/mobile/src/screens/staff/StaffProofFlow.tsx#L836-L871)
- **SEVERITY:** **HIGH**
- **CATEGORY:** Ad hoc submit gate logic
- **CURRENT:**
  The submission button independently checks `proofGaps.length === 0` to decide whether to submit or redirect to the next missing proof step:
  ```tsx
  if (gaps.length > 0) {
    props.setStep(getNextProofStep(task));
    return;
  }
  ```
- **EXPECTED:**
  The submission gate must be driven by `workflowState.canSubmit` and `workflowState.nextStep` from the domain workflow helper.
- **WHY IT MATTERS:**
  If proof gap criteria change in `mobileWorkflow.ts` (e.g., adding a signature or environmental sensor check), the UI button behavior will diverge from backend and contract validation.
- **RECOMMENDED DIRECTION:**
  Align review action handler with `TaskProofWorkflowState`.
- **DEPENDENCIES:** [`apps/mobile/src/domain/mobileWorkflow.ts`](../apps/mobile/src/domain/mobileWorkflow.ts)

---

#### Issue: UI-DOM-003

- **AREA:** Authentication & Shell
- **FILE:** [`apps/mobile/src/screens/LoginScreen.tsx`](../apps/mobile/src/screens/LoginScreen.tsx) vs [`apps/mobile/src/screens/MobileApp.tsx`](../apps/mobile/src/screens/MobileApp.tsx#L373-L483)
- **SEVERITY:** **HIGH**
- **CATEGORY:** Dead code & unreferenced screen divergence
- **CURRENT:**
  `apps/mobile/src/screens/LoginScreen.tsx` is an unreferenced 319-line file that duplicates login UI with non-standard primitives (`TouchableOpacity`, hardcoded `#dc2626`, `#ffffff`). Meanwhile, `MobileApp.tsx` contains its own internal `LoginScreen` component.
- **EXPECTED:**
  One single, canonical `LoginScreen` component that consumes standard `Field`, `Button`, and `BrandMark` primitives.
- **WHY IT MATTERS:**
  Future developers or agents editing `LoginScreen.tsx` will not see any change in the running app, leading to wasted effort and confusion.
- **RECOMMENDED DIRECTION:**
  Extract `LoginScreen` from `MobileApp.tsx` into a proper screen file in `apps/mobile/src/screens/auth/LoginScreen.tsx`, delete the obsolete duplicate, and wire it into `MobileApp.tsx`.
- **DEPENDENCIES:** [`apps/mobile/src/screens/MobileApp.tsx`](../apps/mobile/src/screens/MobileApp.tsx)

---

### 3.2 Design System & Visual Findings

#### Issue: UI-DS-001

- **AREA:** Shared Surface Presentation
- **FILE:** [`apps/mobile/src/components/AppPrimitives.tsx`](../apps/mobile/src/components/AppPrimitives.tsx#L32-L72) and 6 consuming screen files
- **SEVERITY:** **HIGH**
- **CATEGORY:** `GradientCard` violation of Seed + Linear flat surface rule
- **CURRENT:**
  `GradientCard` is used 10 times across `StaffWork`, `StaffTrees`, `ManagerTrees`, `ManagerReview`, `ManagerDashboard`, `ManagerCreateTask`, and `ManagerAccount`. It renders multi-colored gradient backgrounds, double radial glows (`gradientGlowTop`, `gradientGlowBottom`), and `elevation: 4`.
- **EXPECTED:**
  Per [`DESIGN.md` Section 9.2](../DESIGN.md#92-surface-tones), default surfaces must be flat with 1px hairline borders (`Card tone="flat"` or `Card tone="warm"` with 0 elevation and 0 shadow).
- **WHY IT MATTERS:**
  Gradients and ambient shadows wash out on compact Android screens under direct sunlight, cause noticeable overdraw, and directly contradict the botanical-clinical Seed identity.
- **RECOMMENDED DIRECTION:**
  Systematically migrate `GradientCard` usage across screens to `Card tone="flat"` or `Card tone="warm"` with 1px hairline borders. Deprecate `GradientCard` in `AppPrimitives.tsx`.
- **DEPENDENCIES:** [`apps/mobile/src/components/AppPrimitives.tsx`](../apps/mobile/src/components/AppPrimitives.tsx)

---

#### Issue: UI-DS-002

- **AREA:** Typography Hierarchy
- **FILE:** Multiple screens (`StaffWork`, `StaffTrees`, `ManagerDashboard`, `ManagerReview`, `ManagerAccount`, `AppPrimitives`)
- **SEVERITY:** **MEDIUM**
- **CATEGORY:** Widespread font-weight shouting (`700`, `800`, `900`)
- **CURRENT:**
  Over 50 instances of `fontWeight: '900'` and `'800'` are applied to standard titles, hero headers, body subtext, and even button labels (e.g., `BrandMark` has `fontWeight: '900'`, `pageTitle` in `StaffWork` has `fontWeight: '900'`).
- **EXPECTED:**
  Per [`DESIGN.md` Section 6.2](../DESIGN.md#62-typography-rules), the system mandates restrained weights: `400` (regular), `500` (medium), and `600` (semibold for titles and numbers).
- **WHY IT MATTERS:**
  Heavy font weights shout at the user, degrade Vietnamese diacritic legibility, and violate the peer-reviewed clinical calm of the Seed identity.
- **RECOMMENDED DIRECTION:**
  Audit and transition headings from `900`/`800` to `600`, and secondary/body labels to `500`/`400`.
- **DEPENDENCIES:** [`DESIGN.md`](../DESIGN.md)

---

#### Issue: UI-DS-003

- **AREA:** Manager Metrics Presentation
- **FILE:** [`apps/mobile/src/screens/manager/ManagerDashboard.tsx`](../apps/mobile/src/screens/manager/ManagerDashboard.tsx#L52-L60), [`apps/mobile/src/screens/manager/ManagerAccount.tsx`](../apps/mobile/src/screens/manager/ManagerAccount.tsx#L40-L44)
- **SEVERITY:** **MEDIUM**
- **CATEGORY:** Metric fragmentation (Floating separate tiles)
- **CURRENT:**
  Metrics are rendered as individual floating cards (`<Metric bordered={true} />`) arranged in flex rows:
  ```tsx
  <View style={styles.statsGrid}>
    <Metric label="Tổng việc" value={total} tone="slate" />
    <Metric label="Hoàn thành" value={completed} tone="green" />
    <Metric label="Chờ duyệt" value={pendingReview.length} tone="amber" />
  </View>
  ```
- **EXPECTED:**
  Per [`DESIGN.md` Section 12.1](../DESIGN.md#121-the-grouped-metrics-pattern-linear-style), metrics must use the unified Linear grouped metrics bar: a single cohesive `Card tone="flat"` housing unbordered tiles separated by 1px vertical hairline dividers (`statsDivider`).
- **WHY IT MATTERS:**
  Floating individual metric cards create visual clutter, waste screen padding, and break cross-role visual consistency between Staff and Manager interfaces.
- **RECOMMENDED DIRECTION:**
  Adopt the `statsBar` pattern established in `StaffHome`.
- **DEPENDENCIES:** [`apps/mobile/src/components/presentation/TaskSurfaces.tsx`](../apps/mobile/src/components/presentation/TaskSurfaces.tsx)

---

#### Issue: UI-DS-004

- **AREA:** Card & Surface Hierarchy
- **FILE:** [`apps/mobile/src/screens/staff/StaffProofFlow.tsx`](../apps/mobile/src/screens/staff/StaffProofFlow.tsx#L326-L354), [`apps/mobile/src/screens/manager/ManagerReview.tsx`](../apps/mobile/src/screens/manager/ManagerReview.tsx#L214-L242)
- **SEVERITY:** **MEDIUM**
- **CATEGORY:** Card nesting fatigue (5+ consecutive bordered cards)
- **CURRENT:**
  In task detail and manager review, almost every section is enclosed in a separate bordered `Card`. In `StaffProofFlow` (DETAIL), there is Status Card $\rightarrow$ TaskCard $\rightarrow$ Tree Info Card $\rightarrow$ Checklist Card $\rightarrow$ Proof Gaps Card.
- **EXPECTED:**
  Per [`DESIGN.md` Section 9.1](../DESIGN.md#91-the-surface-hierarchy-rule), developers must prefer whitespace, typographic hierarchy, hairline dividers, and subtle surface shifts before introducing another bordered card.
- **WHY IT MATTERS:**
  Excessive card containers consume horizontal padding, produce visual noise, and fatigue the operator scrolling through work on a small device.
- **RECOMMENDED DIRECTION:**
  Group related sections into fewer composite cards using internal hairline dividers and subtle `warmStone` container shells.
- **DEPENDENCIES:** [`apps/mobile/src/components/AppPrimitives.tsx`](../apps/mobile/src/components/AppPrimitives.tsx)

---

#### Issue: UI-DS-005

- **AREA:** Color Consistency & Token Discipline
- **FILE:** [`apps/mobile/src/screens/staff/StaffProofFlow.tsx`](../apps/mobile/src/screens/staff/StaffProofFlow.tsx), [`apps/mobile/src/screens/MobileApp.tsx`](../apps/mobile/src/screens/MobileApp.tsx)
- **SEVERITY:** **MEDIUM**
- **CATEGORY:** Raw hex literals in styles
- **CURRENT:**
  Over 80 occurrences of literal hex colors exist across screen styles (e.g., `#d9f7dd`, `#cbd5e1`, `#2c6a45`, `#030814`, `#1e293b`, `#fecdd3`, `#f3d5a7`, `#ccebf4`).
- **EXPECTED:**
  Per [`DESIGN.md` Section 5.3](../DESIGN.md#53-color-usage-rules), all colors must be referenced through `colors.*` tokens from `@novyx/ui`.
- **WHY IT MATTERS:**
  Hardcoded hex values break dark mode readiness, prevent systematic theming, and introduce subtle color fragmentation.
- **RECOMMENDED DIRECTION:**
  Replace all raw hex values with their semantic token equivalents during screen refactor waves.
- **DEPENDENCIES:** [`packages/ui/src/index.ts`](../packages/ui/src/index.ts)

---

### 3.3 Non-Functional Requirements (NFR) & Performance Findings

#### Issue: UI-NFR-001

- **AREA:** List Virtualization & Memory
- **FILE:** [`apps/mobile/src/screens/staff/StaffWork.tsx`](../apps/mobile/src/screens/staff/StaffWork.tsx#L63-L73), [`apps/mobile/src/screens/staff/StaffTrees.tsx`](../apps/mobile/src/screens/staff/StaffTrees.tsx#L69-L85), [`apps/mobile/src/screens/manager/ManagerTrees.tsx`](../apps/mobile/src/screens/manager/ManagerTrees.tsx#L48-L62), [`apps/mobile/src/screens/manager/ManagerReview.tsx`](../apps/mobile/src/screens/manager/ManagerReview.tsx#L86-L98)
- **SEVERITY:** **HIGH**
- **CATEGORY:** Non-virtualized lists inside `ScrollView`
- **CURRENT:**
  All four list screens render growing collections via `visibleTasks.map(...)` or `visibleTrees.map(...)` inside an unbounded `<ScrollView>`.
- **EXPECTED:**
  Per [`DESIGN.md` Section 17](../DESIGN.md#17-performance--layout-stability) and project architecture rules, growing collections must be rendered with `FlatList` using a stable `keyExtractor={(item) => item.id}` and windowing parameters (`maxToRenderPerBatch`, `windowSize`).
- **WHY IT MATTERS:**
  When park inventories scale to hundreds of trees or long task queues, non-virtualized lists cause substantial memory allocation, slow screen transitions, and stutter during scrolling on compact Android devices.
- **RECOMMENDED DIRECTION:**
  Migrate list screens from `ScrollView` with `.map()` to `FlatList`.
- **DEPENDENCIES:** None

---

#### Issue: UI-NFR-002

- **AREA:** Bundle Size & Dead Code
- **FILE:** [`apps/mobile/src/screens/MobileApp.tsx`](../apps/mobile/src/screens/MobileApp.tsx#L527-L2054)
- **SEVERITY:** **MEDIUM**
- **CATEGORY:** 1,500+ lines of obsolete legacy stylesheet
- **CURRENT:**
  `MobileApp.tsx` contains 1,527 lines of styles (`styles.*`) left over from the original monolithic pre-decomposition architecture, even though those screens now live in `screens/staff/*` and `screens/manager/*`.
- **EXPECTED:**
  `MobileApp.tsx` should only maintain styles relevant to its own shell (auth containers, session restore, root safe area, banner).
- **WHY IT MATTERS:**
  Bloats file size to 2,054 lines, slows down IDE indexing and TypeScript checking, and creates false-positive grep results during refactoring.
- **RECOMMENDED DIRECTION:**
  Prune unreferenced style rules from `MobileApp.tsx`.
- **DEPENDENCIES:** None

---

### 3.4 Accessibility (a11y) Findings

#### Issue: UI-A11Y-001

- **AREA:** Interactive Filter Accessibility
- **FILE:** [`apps/mobile/src/components/presentation/TreeSurfaces.tsx`](../apps/mobile/src/components/presentation/TreeSurfaces.tsx#L47-L58)
- **SEVERITY:** **MEDIUM**
- **CATEGORY:** Incomplete accessibility state on filter chips
- **CURRENT:**
  `TreeSearchFilters` and `TaskStatusFilters` provide `accessibilityRole="button"`, but omit `accessibilityState={{ selected: active }}` on task status filter chips, and rely on color alone to indicate active filter state in certain layouts.
- **EXPECTED:**
  All filter chips must announce their selected state to TalkBack (`accessibilityState={{ selected: active }}`) and pair visual color changes with clear semantic indicators.
- **WHY IT MATTERS:**
  Visually impaired field staff using Android TalkBack cannot reliably discern which task or tree filter is currently active.
- **RECOMMENDED DIRECTION:**
  Add `accessibilityState={{ selected: active }}` and `accessibilityHint` across all filter chips in `TreeSurfaces.tsx`.
- **DEPENDENCIES:** [`apps/mobile/src/components/presentation/TreeSurfaces.tsx`](../apps/mobile/src/components/presentation/TreeSurfaces.tsx)

---

#### Issue: UI-A11Y-002

- **AREA:** Color-Independent State Presentation
- **FILE:** [`apps/mobile/src/screens/manager/ManagerDashboard.tsx`](../apps/mobile/src/screens/manager/ManagerDashboard.tsx#L212-L237)
- **SEVERITY:** **MEDIUM**
- **CATEGORY:** Operational pulse status communicated primarily by text color
- **CURRENT:**
  `PulseRow` renders a numeric value colored green, amber, sky, or danger without an icon or explicit textual semantic qualifier:
  ```tsx
  <Text style={[styles.metricStrong, tone === 'danger' && styles.metricDanger]}>{value}</Text>
  ```
- **EXPECTED:**
  Per [`DESIGN.md` Section 4 Rule 8](../DESIGN.md#4-core-design-principles), state must never be communicated by color alone.
- **WHY IT MATTERS:**
  Color-blind managers or operators reviewing tasks under harsh outdoor sunlight cannot distinguish amber from green or danger counts.
- **RECOMMENDED DIRECTION:**
  Pair `PulseRow` metrics with small status icons or descriptive accessibility text.
- **DEPENDENCIES:** None

---

## 4. Legacy Components & Token Findings

### 4.1 Component Evaluation: `GradientCard`

- **Classification:** **DECORATIVE LEGACY USAGE (MIGRATE TO FLAT/WARM SURFACE)**
- **Audit Finding:**
  None of the 10 occurrences of `GradientCard` represent functional elevation requirements (such as modal overlays or bottom navigation sheets). Every single occurrence is used as an in-page section header or content card.
- **Recommendation:**
  1. Do NOT delete immediately.
  2. In Wave 1 (Staff) and Wave 3/4 (Manager), replace each occurrence with `Card tone="flat"` or `Card tone="warm"`.
  3. Once zero callers remain, mark `GradientCard` as deprecated, then prune it in Wave 5.

### 4.2 Token Audit & Mapping

| Token Name              | Current Value | Classification   | Target Mapping / Action                   | Rationale                                       |
| :---------------------- | :------------ | :--------------- | :---------------------------------------- | :---------------------------------------------- |
| `colors.brandForest`    | `#0f3b2e`     | **MAP**          | `colors.forestDepths` (`#1c3a13`)         | Unify brand green under Seed authority color    |
| `colors.brandIvory`     | `#f7f3e9`     | **DEPRECATE**    | `colors.warmStone` (`#eeeee9`)            | Off-palette yellow tint; warmStone is standard  |
| `colors.canopy`         | `#d9efbf`     | **DEPRECATE**    | `colors.warmStone` / `colors.primarySoft` | Washed-out lime background; violates restraint  |
| `colors.leafImageTint`  | `#cfebb9`     | **REMOVE_LATER** | `colors.primarySoft`                      | One-off image overlay tint; not a semantic role |
| `colors.willowGreen`    | `#aad080`     | **REMOVE_LATER** | `colors.limePulse`                        | Superfluous green; conflicts with Lime Pulse    |
| `colors.vanillaCustard` | `#eee59f`     | **REMOVE_LATER** | `colors.amberSoft`                        | Unaligned yellow; amberSoft covers warning      |
| `colors.forestDeep`     | `#062217`     | **MAP**          | `colors.forestDepths` (`#1c3a13`)         | Duplicate dark green tone                       |

---

## 5. Migration Map

The migration is organized by architectural flow rather than random screens, ensuring high-blast-radius foundations are stabilized first.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MIGRATION ARCHITECTURE                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                                                               ▼
┌───────────────────────┐                               ┌───────────────────────┐
│  A. SHARED FOUNDATION │                               │  B. STAFF TASK FLOW   │
│  • Prune dead styles  │                               │  • Work FlatList      │
│  • Remove dead login  │                               │  • Detail card groups │
│  • Align BrandMark    │                               │  • Proof step CTA     │
└───────────┬───────────┘                               └───────────┬───────────┘
            │                                                       │
            ▼                                                       ▼
┌───────────────────────┐                               ┌───────────────────────┐
│  C. STAFF TREE FLOW   │                               │  D. MGR REVIEW FLOW   │
│  • Trees FlatList     │                               │  • Review FlatList    │
│  • TreeAssignmentCard │                               │  • Streamlined audit  │
│  • Filter a11y states │                               │  • Remove 2x gradient │
└───────────┬───────────┘                               └───────────┬───────────┘
            │                                                       │
            ▼                                                       ▼
┌───────────────────────┐                               ┌───────────────────────┐
│  E. MGR MGMT FLOW     │                               │  F. LEGACY CLEANUP    │
│  • Dashboard metrics  │                               │  • Deprecate Gradient │
│  • Remove 3x gradient │                               │  • Prune legacy color │
│  • CreateTask radius  │                               │  • Verify 100% tokens │
└───────────────────────┘                               └───────────────────────┘
```

---

## 6. Recommended Refactor Waves

> [!IMPORTANT]
> **Execution Rule:** Do NOT start Wave 0 automatically. Await user authorization and review.

### Wave 0: Shared Foundation & Dead Code Pruning

- **Goal:** Eliminate risk of editing the wrong files and stabilize foundational primitives.
- **Tasks:**
  1. Delete unreferenced [`apps/mobile/src/screens/LoginScreen.tsx`](../apps/mobile/src/screens/LoginScreen.tsx).
  2. Prune ~1,500 lines of obsolete styles in [`apps/mobile/src/screens/MobileApp.tsx`](../apps/mobile/src/screens/MobileApp.tsx).
  3. Align [`BrandMark`](../apps/mobile/src/components/AppPrimitives.tsx#L352) font weight from `900` to `600`.
  4. Fix missing `accessibilityState={{ selected }}` on filter chips in [`TreeSurfaces.tsx`](../apps/mobile/src/components/presentation/TreeSurfaces.tsx).

### Wave 1: Staff Task Workflow (`StaffWork` & `StaffProofFlow`)

- **Goal:** Align worker task execution with Seed + Linear discipline and domain state machine.
- **Tasks:**
  1. Refactor `StaffWork.tsx` from `ScrollView.map` to `FlatList`. Replace `GradientCard` with `Card tone="warm"`.
  2. Refactor `StaffProofFlow.tsx` (DETAIL & REVIEW steps):
     - Replace hardcoded CTA strings with `workflowState.activeActionText`.
     - Use `Button variant="forest" pill size="field"` for primary action.
     - Group consecutive cards to eliminate card fatigue.

### Wave 2: Staff Tree Workflow (`StaffTrees`)

- **Goal:** High-performance assigned tree browsing.
- **Tasks:**
  1. Refactor `StaffTrees.tsx` from `ScrollView.map` to `FlatList`.
  2. Replace `GradientCard` with `Card tone="warm"`.
  3. Align `TreeAssignmentCard` to hairline flat surface.

### Wave 3: Manager Review Workflow (`ManagerReview`)

- **Goal:** Evidence-first manager audit with fast scrolling and clean visual hierarchy.
- **Tasks:**
  1. Refactor review queue from `ScrollView.map` to `FlatList`.
  2. Replace `GradientCard` in list and detail with flat/warm hairline surfaces.
  3. Streamline 5+ stacked audit cards in `ManagerReviewDetail` into structured hairline sections.

### Wave 4: Manager Management & Dashboard (`ManagerDashboard`, `ManagerCreateTask`, `ManagerTrees`)

- **Goal:** Eliminate remaining gradients and adopt the Linear grouped metrics bar for HQ.
- **Tasks:**
  1. Refactor `ManagerDashboard.tsx`: replace 3 `GradientCard` instances with flat/warm cards.
  2. Replace fragmented `statsGrid` tiles with the unified Linear `statsBar` pattern.
  3. Refactor `ManagerTrees.tsx` to `FlatList`.
  4. Constrain input and chip border radii in `ManagerCreateTask.tsx`.

### Wave 5: Legacy Token & Primitive Cleanup

- **Goal:** Final polish and dead code elimination.
- **Tasks:**
  1. Deprecate and remove `GradientCard` from `AppPrimitives.tsx`.
  2. Migrate remaining legacy color tokens (`brandIvory`, `canopy`, `leafImageTint`, `willowGreen`).
  3. Run full verification suite (`format:check`, `lint`, `typecheck`, `mobile:export:android`).

---

## 7. Risks and Dependencies

1. **State Synchronization Risk:** Modifying `StaffProofFlow` must preserve current mock GPS/QR camera testing flows and permission hooks (`useDevicePermissions`).
2. **List Key Stability:** Migrating from `.map()` to `FlatList` requires verifying that task and tree identifiers (`task.id`, `tree.id`) remain strictly unique.
3. **Safe Area Insets:** When converting `ScrollView` to `FlatList`, ensure `contentContainerStyle={{ paddingBottom: 104 }}` is retained to clear the notched bottom navigation.
4. **Android Emulation Validation:** After completing each wave, verify layout on compact Android (Pixel 7a, 411×892dp, API 34).
