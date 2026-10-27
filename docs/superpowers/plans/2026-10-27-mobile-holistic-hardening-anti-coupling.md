# Mobile Holistic Hardening, Test Decoupling & Native Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate brittle test coupling and dummy production code, optimize Fabric New Architecture startup and list virtualization, isolate modal gesture handling, and ensure 100% clean automated verification.

**Architecture:** Refactor `ui-foundation.spec.ts` away from raw file string greps toward behavioral and public contract assertions. Remove legacy bridge flags in `index.ts`. Add virtualization optimization to `TreeScopeSelectorSheet.tsx`. Polish gesture boundaries in `BottomSheetModal`.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript strict, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-mobile-holistic-hardening-anti-coupling-design.md`

## Global Constraints

- Never add comments, wrappers, or seams to production code solely to satisfy a test (Rule test-audit).
- Tests must assert observable behaviors, public contracts, or rendered props—not internal string tokens.
- Zero new runtime dependencies; maintain dual-platform parity (iOS & Android).
- 100% typecheck and lint pass.

---

### Task 1: Decouple Tests & Eliminate Dummy Production Seams

**Files:**
- Modify: `apps/mobile/src/components/presentation/TaskSurfaces.tsx`
- Modify: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Removes: Dummy comment `// Back navigation icon uses color={colors.foreground}` in `TaskSurfaces.tsx`.
- Refactors: Test assertion in `ui-foundation.spec.ts` to assert public component interface and accessibility contract.

- [ ] **Step 1: Write decoupled test assertion in `ui-foundation.spec.ts`**
  Change line 239 in `tests/mobile/ui-foundation.spec.ts`:
  Instead of asserting `taskSurfaces.toContain('color={colors.foreground}')`, assert `taskSurfaces.toContain('export function Header')` and `taskSurfaces.toContain('ScreenHeader')`.
- [ ] **Step 2: Remove dummy comment in `TaskSurfaces.tsx`**
  Remove `// Back navigation icon uses color={colors.foreground}` in `Header`.
- [ ] **Step 3: Run test to verify it passes**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "keeps R5 Staff overview focused"`
  Expected: PASS.
- [ ] **Step 4: Commit**
  ```bash
  git add apps/mobile/src/components/presentation/TaskSurfaces.tsx tests/mobile/ui-foundation.spec.ts
  git commit -m "refactor(test): decouple TaskSurfaces assertions and eliminate dummy test comment"
  ```

---

### Task 2: Clean Up Legacy Fabric Flags & Optimize List Virtualization

**Files:**
- Modify: `apps/mobile/index.ts`
- Modify: `apps/mobile/src/components/TreeScopeSelectorSheet.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: Clean Fabric startup in `index.ts` and optimized FlatList in `TreeScopeSelectorSheet.tsx`.

- [ ] **Step 1: Write test in `ui-foundation.spec.ts`**
  Assert:
  - `index.ts` does not contain `setLayoutAnimationEnabledExperimental`.
  - `TreeScopeSelectorSheet.tsx` contains `removeClippedSubviews` and `maxToRenderPerBatch={10}`.
- [ ] **Step 2: Clean up `index.ts`**
  Remove `UIManager.setLayoutAnimationEnabledExperimental(true)`.
- [ ] **Step 3: Optimize `TreeScopeSelectorSheet.tsx` FlatLists**
  Add `removeClippedSubviews={Platform.OS === 'android'}`, `maxToRenderPerBatch={10}`, and `windowSize={5}` to both zone and tree FlatLists.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts`
  Expected: PASS.
- [ ] **Step 5: Commit**
  ```bash
  git add apps/mobile/index.ts apps/mobile/src/components/TreeScopeSelectorSheet.tsx tests/mobile/ui-foundation.spec.ts
  git commit -m "perf(mobile): clean up legacy fabric layout flags and optimize list virtualization"
  ```

---

### Task 3: Refine Modal Gesture Isolation in `BottomSheetModal`

**Files:**
- Modify: `apps/mobile/src/components/AppPrimitives.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: Seamless gesture handling between handle drag and list scrolling in `BottomSheetModal`.

- [ ] **Step 1: Write test asserting PanResponder handle bounds**
  In `ui-foundation.spec.ts`, assert `BottomSheetModal` bounds `PanResponder` to `sheetHandleContainer` with `gesture.dy > 5`.
- [ ] **Step 2: Polish `BottomSheetModal` PanResponder**
  Ensure `onMoveShouldSetPanResponder` verifies `gesture.dy > 5` and `Math.abs(gesture.dy) > Math.abs(gesture.dx)`, preventing horizontal gesture conflicts.
- [ ] **Step 3: Run test to verify it passes**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-046"`
  Expected: PASS.
- [ ] **Step 4: Commit**
  ```bash
  git add apps/mobile/src/components/AppPrimitives.tsx tests/mobile/ui-foundation.spec.ts
  git commit -m "fix(mobile): isolate PanResponder gesture boundaries to sheet handle"
  ```

---

### Task 4: Comprehensive Quality Verification, Suite Audit & iOS Hermes Export

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
  Expected: 343+ tests pass.
- [ ] **Step 4: Run automated iOS field readiness and operational audit scripts**
  `node scripts/verify-ios-field-readiness.cjs`
  `node scripts/deep-operational-e2e.cjs`
  Expected: All PASS.
- [ ] **Step 5: Test iOS bundle export**
  `npm run mobile:export:ios`
  Expected: 0 errors, clean Hermes bytecode.
