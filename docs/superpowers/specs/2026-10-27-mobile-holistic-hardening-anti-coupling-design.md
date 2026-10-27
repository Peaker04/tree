# Mobile Holistic Hardening, Test Decoupling & Native Performance Architecture Specification

**Date:** 2026-10-27  
**Status:** Approved  
**Author:** Mobile & FE Lead Architect  
**Platform:** Dual-Platform (iOS Primary HIG & Samsung Galaxy Note 20 Ultra Android Testbed)  
**Standard:** Living Botanical Operational Design System / Expo SDK 57 / React Native 0.86  
**Target:** `apps/mobile`, `tests/mobile`, `.agents/memory/UI_UX_MEMORY.md`

---

## 1. Problem Statement & Root Cause Synthesis

Following our comprehensive multi-dimensional audit, three deep technical friction points were identified across the codebase:

### 1.1 Brittle Source-Code Test Coupling & Artificial Hardcoding
* **Root Cause:** In `tests/mobile/ui-foundation.spec.ts`, multiple tests read raw `.tsx` files via `fs.readFileSync` and perform rigid string searches (`.toContain(...)`) on internal style names, comments, and private variables (e.g., `expect(taskSurfaces).toContain('color={colors.foreground}')`).
* **Impact:** Refactoring components or improving styles causes false test failures even when behavior is 100% correct, forcing developers to leave dummy comments (e.g. `// color={colors.foreground}`) in production code just to appease tests. This directly violates the `test-audit` authoring gate.

### 1.2 Fabric New Architecture Friction & Gesture Clashes in Modals
* **Root Cause:**
  1. `apps/mobile/index.ts` still invokes `UIManager.setLayoutAnimationEnabledExperimental(true)`, a legacy bridge API that can cause frame drops and unexpected layout glitches under React Native New Architecture (Fabric).
  2. In `BottomSheetModal`, the `PanResponder` capture phase needs explicit boundaries so dragging the handle bar does not fight with inner list scrolls.
  3. `TreeScopeSelectorSheet` executes search filtering synchronously on every render, risking frame drops on larger tree catalogs.

### 1.3 Strict Taste Skill & Impeccable Governance
* **Standard:** Living Botanical design system must remain strictly functional (Mode: `Operate`).
* **Bans:** Zero emojis in buttons, zero nested cards, zero AI-purple gradients, zero unstyled scrollbars, and initial-viewport density locked to 6/10.

---

## 2. Architecture & Design Principles

### 2.1 Principle 1: Contract-Driven Testing (Anti-Mocking & Decoupling)
* **Rule:** Tests must verify public exports, schema invariants, and observable behavior—never private implementation tokens or dummy comments.
* Remove dummy comments in `TaskSurfaces.tsx`.
* Refactor `ui-foundation.spec.ts` assertions to verify exported components, accessibility roles, and design system contracts rather than arbitrary file strings.

### 2.2 Principle 2: Native Fabric Performance & Virtualization
* Clean up `index.ts`: Remove legacy `UIManager.setLayoutAnimationEnabledExperimental(true)`.
* In `TreeScopeSelectorSheet.tsx` and all list views, ensure `removeClippedSubviews`, `maxToRenderPerBatch={10}`, and `windowSize={5}` are active.
* Add 150ms debouncing or memoized filtering to search inputs.

### 2.3 Principle 3: Modal Gesture Isolation
* In `BottomSheetModal`, `PanResponder` is strictly bound to `sheetHandleContainer` so handle dragging dismisses smoothly, while inner `FlatList` retains full native scrolling velocity.

### 2.4 Principle 4: Taste Skill Anti-Slop Discipline
* Preserve the locked palette: `#faf7ef` background, `#15803d` primary, `#153d2b` forest depths, `#0f172a` ink.
* Every button touch maintains $0.97\times$ spring compression with native driver.
* Touch targets are at least 44x44dp; primary field actions are 48–52dp.

---

## 3. Verification & Acceptance Criteria

1. **Zero Dummy Code:** No production file contains dummy comments solely to pass tests.
2. **Behavioral Test Suite:** All 343+ tests pass without relying on brittle exact-string greps.
3. **Fabric Cleanliness:** Clean startup without legacy experimental layout flags.
4. **Modal & List Smoothness:** 60fps scrolling and effortless handle-swipe dismissal.
5. **Quality Gates:** 100% typecheck pass, 0 ESLint errors, clean iOS Hermes bundle export.
