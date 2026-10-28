# Field Operations Mock Elimination & Real-World Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all fake bypass shortcuts (`__DEV__` taps) and dead-ends in mobile field operations by introducing manual QR fallbacks, adaptive GPS accuracy thresholds, 1-tap unblocking field exceptions, actionable central FAB QR workflows, accurate time-based overdue tracking, multi-tree map visualization, and realistic multi-tree seed data.

**Architecture:** Field operations adhere to resilient, offline-first mobile standards: no operation is deadlocked when hardware sensors or physical tags face degraded real-world conditions (muddy QR, canopy GPS drift, missing barcode). Manual inputs and field exceptions provide legitimate, auditable operational fallbacks. Exact time tracking replaces midnight assumptions.

**Tech Stack:** TypeScript strict, React 19 / React Native 0.86, Expo SDK 57 (`expo-camera`, `expo-location`), Leaflet/WebView map engine, Vitest, ADB / UIAutomator E2E harness (`scripts/mobile-role-acceptance-e2e.cjs`).

**Spec:** `docs/superpowers/specs/2026-10-26-field-operations-mock-elimination-design.md`

## Global Constraints

- Preserve the frozen five-action locked bottom navigation contract from `docs/MOBILE_UI_RULES.md`.
- Comply with `tests/mobile/r2a-lifecycle.spec.ts` invariants (no `refreshData()` in `useEffect` or tab navigation `onPress`).
- Comply with `AGENTS.md`: no git commit, git push, git reset, or unauthorized dependencies.
- Touch targets must be at least 44×44dp; primary actions must be 48–52dp.
- Never expose technical IDs (`TRE-DEV-01`), enums, or email addresses as labels in Vietnamese user-facing UI.
- All code must pass `npm run typecheck --workspace @novyx/mobile`, `npm run lint`, and `npm test`.

## Review Focus

1. **Physical QR degradation**: When camera cannot read a torn or muddy QR code, Staff must be able to tap "Nhập mã cây" or "Xác nhận theo nhiệm vụ" and proceed immediately to Checklist without developer bypasses.
2. **Dense canopy GPS error**: When GPS accuracy is $\pm 20\text{m}$ under urban trees, the adaptive radius allows check-in; when obstructed by construction walls, 1-tap exception check-in unblocks the shift while recording coordinates and reason.
3. **Overdue precision**: A task with deadline 10:00 AM becomes overdue at 10:01 AM (not waiting until 23:59), turns red, and appears in the "Quá hạn" filter tab.
4. **Actionable FAB lookup**: Scanning any tree tag via the center FAB presents real operational actions ("Bắt đầu công việc này", "Báo cáo sự cố", "Giao việc cho cây này") instead of a dead-end view.
5. **No regression**: 328 unit tests and the 11-scenario strict device E2E on `R3CN70ED57A` must pass 100% cleanly.

---

### Task 1: Overdue Task Logic & Filter Resolution

**Files:**
- Modify: `apps/mobile/src/domain/mobileWorkflow.ts:40-130`
- Modify: `apps/mobile/src/screens/staff/StaffWork.tsx:60-80`
- Modify: `apps/mobile/src/screens/supervisor/SupervisorArea.tsx:370-390`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Overview:**
Remove the midnight clamping `setHours(23, 59, 59, 999)` from `isTaskOverdue` to honor exact operational hours. Fix `filterTasks` to correctly call `isTaskOverdue(task)` when `filter === 'overdue'`. Add the "Quá hạn" filter chip to `TASK_FILTER_OPTIONS` and ensure it renders in Staff and Supervisor task lists.

- [ ] **Step 1: Write unit tests in `tests/mobile/ui-foundation.spec.ts`**
  Add unit tests verifying:
  - Exact deadline times (e.g. 10:00 AM) are recognized as overdue after 10:00 AM on the same day.
  - `filterTasks(tasks, 'overdue')` returns tasks flagged by `isTaskOverdue`.
  - `TASK_FILTER_OPTIONS` includes `{ id: 'overdue', label: 'Quá hạn' }`.
- [ ] **Step 2: Update `isTaskOverdue` and `filterTasks` in `apps/mobile/src/domain/mobileWorkflow.ts`**
  Implement exact-hour comparison and wire `filter === 'overdue'` to `isTaskOverdue(task)`.
- [ ] **Step 3: Add 'overdue' chip in `TASK_FILTER_OPTIONS` and verify in UI**
  Add `{ id: 'overdue', label: 'Quá hạn' }` to `TASK_FILTER_OPTIONS` in `mobileWorkflow.ts`.
- [ ] **Step 4: Run unit tests to verify**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
  Confirm: All tests pass.

---

### Task 2: QR Scanner Real-World Resilience & Fallbacks

**Files:**
- Create: `apps/mobile/src/components/ManualTreeCodeModal.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx:1270-1310`
- Modify: `apps/mobile/src/screens/manager/ManagerQrLookup.tsx:75-115`
- Modify: `scripts/mobile-role-acceptance-e2e.cjs:335-345`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Overview:**
Remove the fake `onPress={__DEV__ ? ... : undefined}` bypass from `StaffProofFlow.tsx` and `ManagerQrLookup.tsx`. Build `ManualTreeCodeModal` allowing staff to type or select a tree code when a QR code is unreadable. Integrate manual confirmation fallback into the staff proof workflow.

- [ ] **Step 1: Create `ManualTreeCodeModal.tsx`**
  Create an accessible bottom sheet/modal containing:
  - Input field for Tree ID or Tree Code (auto-capitalized, clear button).
  - List of matching trees from local catalog (`props.trees`).
  - "Xác nhận mã" button (min height 48dp, hitSlop).
  - "Hủy" button.
- [ ] **Step 2: Integrate manual fallback into `StaffProofFlow.tsx`**
  - Remove `onPress={__DEV__ ? ... : undefined}` from line 1288.
  - Add "Nhập mã cây bằng tay" button below camera preview.
  - When the active task's tree is selected/entered manually, set `qrCheck: { verified: true, code: matchedCode, method: 'manual_entry' }` and proceed to Checklist.
  - Add "Xác nhận cây theo nhiệm vụ" option if tag is missing.
- [ ] **Step 3: Integrate manual fallback into `ManagerQrLookup.tsx`**
  - Remove `onPress={__DEV__ ? ... : undefined}` from line 96.
  - Add "Nhập mã cây bằng tay" action below camera view.
- [ ] **Step 4: Update E2E test in `scripts/mobile-role-acceptance-e2e.cjs`**
  Update S3 to use the legitimate "Nhập mã cây" or "Xác nhận cây theo nhiệm vụ" action, proving the production fallback works end-to-end without developer shortcuts.
- [ ] **Step 5: Run tests to verify**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
  Confirm: PASS.

---

### Task 3: Adaptive GPS Accuracy & 1-Tap Field Exception Flow

**Files:**
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx:178-255, 540-580, 1340-1535`
- Modify: `apps/mobile/src/screens/MobileApp.tsx:83-85`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Overview:**
Replace the rigid $<10\text{m}$ geofence with an adaptive radius formula that factors in device GPS accuracy under canopy conditions. Ensure that workers outside the radius are never deadlocked: provide a prominent 1-tap "Check-in kèm báo ngoại lệ vị trí" button with standard field reasons, automatically recording measured GPS coordinates and advancing to the next step.

- [ ] **Step 1: Implement adaptive geofence formula in `StaffProofFlow.tsx`**
  Calculate:
  `const effectiveRadius = Math.max(15, locationAccuracyMeters ?? 15) + 5;`
  `const verified = distance <= effectiveRadius;`
- [ ] **Step 2: Unblock out-of-range Check-in with 1-tap exception**
  In `TreeCheckinMap`:
  - If `verified` is true: button says "Check-in" (green tone).
  - If `verified` is false: button says "Check-in có ngoại lệ" (amber tone, never disabled).
  - Tapping "Check-in có ngoại lệ" opens the 1-tap reason selector ("Tán cây làm trôi GPS", "Rào chắn công trình", "Lệch mốc bản đồ"), captures current coordinates, sets `locationException`, and cleanly proceeds to QR/Checklist.
- [ ] **Step 3: Auto-sense GPS upon screen entry**
  Trigger `readDeviceLocationAfterPermission()` automatically when entering the `GPS` step if permission is already granted.
- [ ] **Step 4: Run unit tests to verify**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
  Confirm: PASS.

---

### Task 4: Actionable Central FAB QR Workflows

**Files:**
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx:730-760`
- Modify: `apps/mobile/src/screens/manager/ManagerQrLookup.tsx:110-160`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Overview:**
Transform the central FAB QR lookup from a dead-end read-only screen into an active workflow launcher. Staff can directly start assigned work on the scanned tree or report an unexpected field issue. Managers can directly initiate a task for the scanned tree.

- [ ] **Step 1: Enhance `TreeLookupResult` in `StaffProofFlow.tsx`**
  - If the tree has an open task assigned to current staff: show prominent CTA "Bắt đầu công việc này" (sets `activeTask` and navigates to detail/GPS).
  - Add CTA "Báo cáo sự cố cho cây này" (navigates to field issue reporting with `treeId` pre-filled).
- [ ] **Step 2: Enhance `ManagerQrLookup.tsx`**
  - Add primary CTA "Giao việc cho cây này" (navigates to `ManagerCreateTask` with `treeId` pre-selected).
- [ ] **Step 3: Run unit tests to verify**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
  Confirm: PASS.

---

### Task 5: Multi-Tree Map View & Rich Seed Data

**Files:**
- Modify: `apps/mobile/src/components/presentation/WebMapView.tsx:24-70, 110-230, 340-470`
- Modify: `apps/api/src/infrastructure/persistence/scripts/seed-dev.ts:110-180`
- Test: `tests/api/dev-seed.spec.ts`

**Overview:**
Enhance `WebMapView.tsx` to accept an array of surrounding trees (`trees: Tree[]`) with interactive markers color-coded by health/task state. Expand `seed-dev.ts` from 1 tree to 16 realistic urban trees distributed across major Ho Chi Minh City park locations with genuine coordinates and varied task states.

- [ ] **Step 1: Extend `WebMapViewProps` for multi-tree visualization**
  Add `trees?: Tree[]` and `activeTreeId?: string` to `WebMapViewProps`.
  In Leaflet HTML generator, loop through `trees` and render custom pins:
  - 🟢 Green: Normal / healthy.
  - 🟡 Amber: Pending / in-progress task.
  - 🔴 Red: Overdue task or hazardous tree.
- [ ] **Step 2: Expand `seed-dev.ts` with 16 realistic trees**
  Seed 16 trees across Công viên Tao Đàn, Thảo Cầm Viên, Lê Duẩn, Pasteur, and Nam Kỳ Khởi Nghĩa with realistic coordinates (`10.77...`, `106.69...`), species (Sao đen, Dầu rái, Bàng đài loan, Me tây, Giáng hương), QR codes (`NOVYX-TRE-01` to `NOVYX-TRE-16`), and distributed tasks across Staff and Supervisor.
- [ ] **Step 3: Run API dev seed test**
  Run: `npm test tests/api/dev-seed.spec.ts`
  Confirm: PASS.

---

### Task 6: Full Verification Gate & Physical Device E2E

**Files:**
- Execute: `scripts/mobile-role-acceptance-e2e.cjs` on `R3CN70ED57A`
- Update: `task.md`

**Overview:**
Verify the entire codebase through TypeScript compilation, ESLint, unit test suites, and strict physical device E2E execution on `R3CN70ED57A`.

- [ ] **Step 1: Run workspace typecheck**
  `npm run typecheck --workspace @novyx/mobile`
  Confirm: 0 errors.
- [ ] **Step 2: Run workspace lint**
  `npm run lint`
  Confirm: 0 errors, 0 warnings.
- [ ] **Step 3: Run complete unit test suite**
  `npm test`
  Confirm: All 328+ tests pass.
- [ ] **Step 4: Run strict physical device E2E test on `R3CN70ED57A`**
  `node scripts/mobile-role-acceptance-e2e.cjs`
  Confirm: 11/11 PASS (100% success with zero fake taps).
- [ ] **Step 5: Update `task.md` and report to user**
