# Native Operational Camera Interface & Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the mobile camera capture screen (`BEFORE` / `AFTER` steps) with an unobstructed viewfinder, crisp light status bar, native bottom circular shutter dock with Flash/Flip toggles, and fast picture capture performance.

**Architecture:** Refactor `StaffProofFlow.tsx` camera view: remove central blocking overlay, mount `<StatusBar style="light" />`, and implement a bottom shutter dock with a 76dp circular trigger, Flash toggle, and Camera facing toggle. Verify live on physical Samsung Galaxy Note 20 Ultra.

**Tech Stack:** React Native 0.86, Expo SDK 57 (`expo-camera`, `expo-status-bar`), TypeScript strict, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-native-operational-camera-design.md`

## Global Constraints

- Never block the central camera viewfinder with static icons or text (Rule UI-055).
- Never allow photo gallery picking for field operational proof (Rule UI-022 data-integrity).
- Shutter button must be circular, minimum 72dp, positioned in the bottom thumb zone.
- Dual-platform parity: identical seamless behavior on iOS and Android.
- 100% typecheck and lint pass.

---

### Task 1: Record Rule UI-055 in UI/UX Memory

**Files:**
- Modify: `.agents/memory/UI_UX_MEMORY.md`

**Interfaces:**
- Produces: Rule `UI-055` in `UI_UX_MEMORY.md`

- [ ] **Step 1: Add rule UI-055 to Known-Failure Register**
  - `UI-055`: Camera viewfinder obstructed by central overlay text/icon, rectangular submit shutter button floating in mid-screen, and low-contrast dark status bar. Rule: Unobstructed viewfinder with top-corner stage badge, light status bar, and bottom circular shutter dock (Flash + Shutter + Flip).
- [ ] **Step 2: Commit**
  ```bash
  git add .agents/memory/UI_UX_MEMORY.md
  git commit -m "docs(memory): record UI-055 native operational camera ergonomics rule"
  ```

---

### Task 2: Implement Unobstructed Viewfinder, Light Status Bar & Bottom Shutter Dock

**Files:**
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx`
- Modify: `apps/mobile/src/components/DeviceCameraView.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: Clean camera viewfinder with bottom shutter dock, Flash toggle, Camera Flip toggle, and light status bar.

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**
  Assert:
  - `StaffProofFlow.tsx` renders `<StatusBar style="light" />` in camera view.
  - `StaffProofFlow.tsx` does not render `styles.nativeCameraOverlay` in the center.
  - `StaffProofFlow.tsx` contains `styles.shutterButton` and bottom dock.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-055"`
  Expected: FAIL.
- [ ] **Step 3: Refactor Camera View in `StaffProofFlow.tsx`**
  - Add `<StatusBar style="light" />` when `isCameraActive`.
  - Remove center overlay icon and text.
  - Add top-left translucent pill: `[ Ảnh trước xử lý ]` / `[ Ảnh sau xử lý ]`.
  - Add bottom shutter dock:
    - Left: Flash toggle button (`flash-outline` / `flash-off-outline`).
    - Center: Circular Shutter button (76x76dp, white outer ring, inner filled circle with scale spring).
    - Right: Flip Camera button (`camera-reverse-outline`).
  - Optimize capture quality: `{ quality: 0.65 }`.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-055"`
  Expected: PASS.
- [ ] **Step 5: Commit**
  ```bash
  git add apps/mobile/src/screens/staff/StaffProofFlow.tsx apps/mobile/src/components/DeviceCameraView.tsx tests/mobile/ui-foundation.spec.ts
  git commit -m "feat(mobile): overhaul camera screen with clean viewfinder, light status bar, and native shutter dock"
  ```

---

### Task 3: Comprehensive Verification & Physical Device Screenshot Audit

**Files:**
- Entire repository

- [x] **Step 1: Run mobile typecheck**
  `npm run typecheck --workspace @novyx/mobile`
  Expected: 0 errors.
- [x] **Step 2: Run monorepo lint**
  `npm run lint`
  Expected: 0 errors.
- [x] **Step 3: Run full Vitest suite**
  `npm run test`
  Expected: 348+ tests pass.
- [x] **Step 4: Capture live screenshot from Samsung Galaxy Note 20 Ultra**
  Capture `screencap -p` and audit live camera screen for contrast, ergonomics, and absence of obstructions.
- [x] **Step 5: Test iOS bundle export**
  `npm run mobile:export:ios`
  Expected: 0 errors, clean Hermes bytecode.
