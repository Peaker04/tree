# Camera Check-in Anti-Flicker, Role Proof Chain & Filter Ergonomics Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate camera viewfinder mounting flicker, smooth check-in tactile feedback, resolve role evidence chain contradictions, sanitize user names, and streamline role-adapted task filters across Staff and Supervisor screens.

**Architecture:** Refactor `DeviceCameraView` mounting guards, enhance `ProofChainCard` exception awareness and name formatting in `TaskSurfaces.tsx`, and deploy role-specific filter options with live badge counts via `SegmentedFilterBar`.

**Tech Stack:** React Native, Expo Camera, Expo Haptics / Vibration, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-28-camera-checkin-filter-ergonomics-design.md`

---

## Global Constraints

- **Zero-Mock Policy**: All user identities must be sanitized via `formatActorDisplayName()`.
- **Zero-Flicker Invariant**: When OS camera permission is already granted, never render `<DevicePermissionState>`.
- **Proof Consistency**: Gate banner verdict and `ProofChainCard` status must agree 100% on location exceptions.
- **Density 6/10**: Max 5 filter chips per role with live badge counts; eliminate generic 8-chip clutter.
- **Quality Gates**: `npm run test` (349+ passing), `npm run lint` (0 errors), `npm run typecheck` (0 errors), clean iOS/Android bytecode exports.

## Review Focus

1. **Permission Card Flashing**: Tapping check-in must transition directly into dark viewfinder without visual flash of the permission request card.
2. **Tactile Feedback Disruption**: Single light vibration pulse (12ms) without locking the UI thread.
3. **Supervisor Review Contradiction**: `ProofChainCard` must show a green check `(v)` for GPS when an exception is present.
4. **Email Leakage in Presentation**: Raw emails (`staff@novyx.local`) must not appear in `ProofChainCard` labels.
5. **Filter Count Synchronization**: Badge numbers on filter chips must reflect actual task counts in memory.

---

### Task 1: Eliminate Camera Viewfinder Mounting Flicker & Smooth Vibration

**Files:**
- Modify: `apps/mobile/src/components/DeviceCameraView.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

- [ ] **Step 1: Write regression test for DeviceCameraView zero-flicker guard**
  Assert `DeviceCameraView` renders dark container when `permissionState === 'granted'` instead of `<DevicePermissionState>`.
- [ ] **Step 2: Update `DeviceCameraView.tsx`**
  Add check `if (isPermissionGranted) return <View style={[style, { backgroundColor: colors.ink }]} />;`
- [ ] **Step 3: Update check-in vibration in `StaffProofFlow.tsx`**
  Change `triggerTactileFeedback(isVerified ? 'success' : 'warning')` to `triggerTactileFeedback('light')` on check-in navigation to prevent multi-pulse lag.
- [ ] **Step 4: Run Vitest test**
  Execute: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "zero-flicker"`
  Expected: PASS.
- [ ] **Step 5: Commit Task 1 changes**
  Commit message: `fix(mobile): eliminate camera mounting flicker and smooth check-in haptic feedback`

---

### Task 2: Fix Role Evidence Chain & GPS Exception Consistency in `ProofChainCard`

**Files:**
- Modify: `apps/mobile/src/components/presentation/TaskSurfaces.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

- [ ] **Step 1: Write regression test for ProofChainCard exception awareness and name formatting**
  Assert `ProofChainCard` marks `sup-gps` done when `hasLocationEx` is true, displays exception reason, and uses `formatActorDisplayName()`.
- [ ] **Step 2: Update `TaskSurfaces.tsx` (`ProofChainCard`)**
  - Implement `hasLocationEx` check in `supervisorChecks`.
  - Format `task.assignedStaffName` with `formatActorDisplayName(task.assignedStaffName)`.
  - Format body to display `Ngoại lệ: ${locationExReason}` with checkmark when exception exists.
- [ ] **Step 3: Clean up verbose narration strings in `StaffProofFlow.tsx`**
  Simplify gate banner copy and note sections according to Density 6/10.
- [ ] **Step 4: Run Vitest test**
  Execute: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "ProofChainCard"`
  Expected: PASS.
- [ ] **Step 5: Commit Task 2 changes**
  Commit message: `fix(mobile): synchronize proof chain exception state and sanitize actor names`

---

### Task 3: Streamline & Role-Adapt Task Filters (`StaffWork` & `SupervisorArea`)

**Files:**
- Modify: `apps/mobile/src/domain/mobileWorkflow.ts`
- Modify: `apps/mobile/src/screens/staff/StaffWork.tsx`
- Modify: `apps/mobile/src/screens/supervisor/SupervisorArea.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

- [ ] **Step 1: Define role-adapted filter constants & builders in `mobileWorkflow.ts`**
  - Add `SUPERVISOR_FILTER_OPTIONS` with `awaiting_capture` (`Chờ chụp ảnh`), `all`, `waiting_review`, `rework`, `completed`.
  - Add `STAFF_FILTER_OPTIONS` with `open`, `rework`, `overdue`, `all`, `completed`.
  - Add filter handler for `awaiting_capture` in `filterTasks()`.
- [ ] **Step 2: Update `StaffWork.tsx` to consume streamlined `STAFF_FILTER_OPTIONS`**
  Pass live count badges to `SegmentedFilterBar variant="scrollable"`.
- [ ] **Step 3: Update `SupervisorArea.tsx` to consume `SUPERVISOR_FILTER_OPTIONS`**
  Replace ad-hoc horizontal ScrollView with `SegmentedFilterBar variant="scrollable"` with live counts.
- [ ] **Step 4: Run Vitest test**
  Execute: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "filters"`
  Expected: PASS.
- [ ] **Step 5: Commit Task 3 changes**
  Commit message: `feat(mobile): deploy role-adapted streamlined task filters with live badge counts`

---

### Task 4: Monorepo Quality Gates & Live Physical Device Verification

**Files:**
- Entire repository

- [ ] **Step 1: Run typecheck across monorepo**
  Execute: `npm run typecheck`
  Expected: 0 errors.
- [ ] **Step 2: Run linter across monorepo**
  Execute: `npm run lint`
  Expected: 0 errors.
- [ ] **Step 3: Run full Vitest suite**
  Execute: `npm run test`
  Expected: 350+ tests pass.
- [ ] **Step 4: Verify iOS and Android Hermes Bytecode Exports**
  Execute: `npm run mobile:export:ios && npm run mobile:export:android`
  Expected: Clean 2.7MB bytecode bundles exported without errors.
- [ ] **Step 5: Verify on Samsung Galaxy Note 20 Ultra**
  Capture live screenshots verifying:
  - Zero-flicker transition to camera on Check-in.
  - Consistent green checkmark and reason on Review screen.
  - Streamlined filter bar displaying badge counts on Supervisor & Staff lists.
- [ ] **Step 6: Update UI/UX Memory**
  Record Rule `UI-057` in `.agents/memory/UI_UX_MEMORY.md`.
