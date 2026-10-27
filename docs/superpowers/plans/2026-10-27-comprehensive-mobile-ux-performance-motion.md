# Comprehensive Mobile UX, Modal Geometry, Motion & Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix sunken/collapsed bottom sheet modals, upgrade all modal and button animations to physics-based spring motion with gesture dismissal, eliminate iOS Camera QR scan deep-link crashes with ATS-compliant HTTPS schemes, and enforce clean dual-platform ergonomics.

**Architecture:** Enforce explicit vertical constraints on `BottomSheetModal` (`height: '82%'` and `flex: 1` on `sheetBody`) so inner FlatLists expand completely without collapsing. Replace linear cubic modal timing with `Animated.spring` and integrate a native `PanResponder` on sheet handles for swipe-down-to-dismiss. Secure QR deep links by registering `"scheme": "novyx-greenops"` in `app.json` and generating `exps://` (HTTPS) URLs.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript strict, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-comprehensive-mobile-ux-performance-motion-design.md`

## Global Constraints

- `BottomSheetModal` must expand with explicit height (`height: '82%'`) and `flex: 1` body; inner FlatLists must never collapse to 0 height (Rule UI-045).
- Modals must use damped spring physics (`Animated.spring`) and support swipe-down gesture dismissal (Rule UI-046).
- QR code payloads for tunnels must use `exps://` (HTTPS) and `app.json` must declare `"scheme": "novyx-greenops"` to prevent iOS ATS Camera crash (Rule UI-047).
- Navigation bar sits flush with 56dp base height on iOS and 64dp on Android (Rule UI-048).
- 100% typecheck and lint pass.

## Review Focus

1. Opening `TreeScopeSelectorSheet` or `ManualTreeCodeModal` displays full search bar, tree list, and bottom button (not sunken or empty).
2. Swiping down on the sheet handle smoothly dismisses the modal.
3. Scanning the QR code with the iOS native Camera app routes directly into Expo Go without crashing.
4. Tapping buttons compresses smoothly to $0.97\times$ with native driver.
5. Zero raw scrollbar indicators visible during scrolling.

---

### Task 1: Record UI-045 to UI-048 in UI/UX Memory

**Files:**
- Modify: `.agents/memory/UI_UX_MEMORY.md`

**Interfaces:**
- Produces: Rules `UI-045`, `UI-046`, `UI-047`, `UI-048` in `UI_UX_MEMORY.md`

- [ ] **Step 1: Add rules to Known-Failure Register**

- `UI-045`: BottomSheetModal collapsed to 0 height when children contained FlatList due to unconstrained `sheetBody`. Rule: Explicit `height: '82%'` and `flex: 1` on `sheetBody`.
- `UI-046`: Stiff cubic timing and non-dismissable handles on sheets. Rule: Damped spring physics (`Animated.spring`) and `PanResponder` drag-down dismissal.
- `UI-047`: iOS Camera app QR scan crash on cold start due to `exp://` ATS rejection. Rule: Use `exps://` (HTTPS) scheme and register `"scheme": "novyx-greenops"`.
- `UI-048`: Dual-platform navigation bar geometry: iOS 56dp base + single Home Bar inset, Android 64dp base + 3-button detection.

- [ ] **Step 2: Commit memory updates**

```bash
git add .agents/memory/UI_UX_MEMORY.md
git commit -m "docs(memory): record UI-045 to UI-048 modal geometry, spring motion and secure QR rules"
```

---

### Task 2: Overhaul `BottomSheetModal` Geometry & Spring Physics

**Files:**
- Modify: `apps/mobile/src/components/AppPrimitives.tsx`
- Modify: `apps/mobile/src/components/TreeScopeSelectorSheet.tsx`
- Modify: `apps/mobile/src/components/ManualTreeCodeModal.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: Full-height (82%) `BottomSheetModal` with `flex: 1` body, `PanResponder` swipe-down dismiss, and `Animated.spring`.

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**

Assert:
- `BottomSheetModal` has `height: '82%'` and `flex: 1` on `sheetBody`.
- `BottomSheetModal` uses `Animated.spring` for opening.
- `BottomSheetModal` integrates `PanResponder` for swipe-down dismissal.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-045|UI-046"`
Expected: FAIL.

- [ ] **Step 3: Refactor `BottomSheetModal` in `AppPrimitives.tsx`**

- In `styles.sheetContainer`:
  Add `height: '82%'`, `maxHeight: '92%'`.
- In `styles.sheetBody`:
  Add `flex: 1`.
- In `KeyboardAvoidingView`:
  Set `style={[styles.sheetBody, styles.flex]}`.
- Upgrade `sheetAnim` to `Animated.spring`:
  ```tsx
  Animated.spring(sheetAnim, {
    toValue: 0,
    bounciness: 3,
    speed: 14,
    useNativeDriver: true,
  }).start();
  ```
- Implement `PanResponder` on `sheetHandleContainer`:
  Track `dy`: if dragged down $> 80\text{dp}$, call `onClose()`; otherwise spring back to 0.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-045|UI-046"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/AppPrimitives.tsx apps/mobile/src/components/TreeScopeSelectorSheet.tsx apps/mobile/src/components/ManualTreeCodeModal.tsx tests/mobile/ui-foundation.spec.ts
git commit -m "fix(mobile): resolve sunken modal defect with full-height flex body and spring physics"
```

---

### Task 3: Fix iOS Camera QR Deep Link Scheme & Register App Scheme

**Files:**
- Modify: `apps/mobile/app.json`
- Modify: `scripts/field-tunnel.cjs`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: ATS-compliant `exps://` QR deep links and registered `"scheme": "novyx-greenops"`.

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**

Assert:
- `app.json` contains `"scheme": "novyx-greenops"`.
- `field-tunnel.cjs` uses `exps://` for tunnel URL generation.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-047"`
Expected: FAIL.

- [ ] **Step 3: Configure app scheme and secure QR generation**

- In `apps/mobile/app.json`:
  Add `"scheme": "novyx-greenops"`.
- In `scripts/field-tunnel.cjs`:
  Replace `exp://` with `exps://` when generating tunnel deep link for iOS Camera.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-047"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app.json scripts/field-tunnel.cjs tests/mobile/ui-foundation.spec.ts
git commit -m "fix(mobile): secure iOS camera QR scan deep link with exps scheme and register app scheme"
```

---

### Task 4: Comprehensive Verification & Monorepo Quality Gate

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
Expected: 336+ tests pass.

- [ ] **Step 4: Test iOS bundle export**

Run: `npm run mobile:export:ios`
Expected: 0 errors.
