# Native Image Processing Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a production-grade native image processing pipeline on Expo SDK 57 that bounds captured photo resolution to 1440px max edge, auto-bakes EXIF orientation, applies 0.75 JPEG compression, purges raw cache files, and reduces evidence payloads from 4MB–12MB down to ~200KB–350KB.

**Architecture:** Integrate `expo-image-manipulator@~57.0.21` into `@novyx/mobile`. Build an isolated `ImageProcessingService` with dimension clamping and fail-safe fallback. Wire the pipeline into `StaffProofFlow.tsx` before sandbox persistence and Outbox upload. Rebuild Android native debug APK and verify on physical Samsung Galaxy Note 20 Ultra.

**Tech Stack:** Expo SDK 57, React Native 0.86, `expo-image-manipulator`, `expo-camera`, `expo-file-system`, TypeScript, Vitest, Gradle.

**Spec:** `docs/superpowers/specs/2026-10-28-native-image-processing-pipeline-design.md`

## Global Constraints
- **Platform Parity**: Clean build and exports on both iOS (Hermes bytecode) and Android (Samsung Galaxy Note 20 Ultra SM-N986N).
- **Target Evidence Size**: Processed JPEG between 150 KB and 400 KB (target ~250 KB) with 1440px max edge.
- **Orientation Invariant**: Orientation must be baked directly into pixel data (Orientation = 1), preventing rotation bugs in web portals.
- **Zero Field Disruption**: If image manipulation fails, fallback gracefully to raw capture URI; never block staff from completing their task.
- **Zero Cache Leaks**: Purge raw multi-megabyte camera cache files immediately upon successful processing.
- **Verification Gates**: 0 TypeScript errors (`npm run typecheck`), 0 ESLint errors (`npm run lint`), all Vitest tests pass, and 18/18 multi-staff operational matrix checks pass over public Ngrok tunnel.

## Review Focus
1. **Extreme Aspect Ratios**: Panoramic or ultra-wide/tall photos must correctly scale the dominant axis to 1440px without distortion.
2. **Missing Native Module in Test/Mock Environments**: Headless Vitest runs without native Android/iOS modules must gracefully mock or fallback without throwing uncaught exceptions.
3. **Double Compression Prevention**: Re-opened or previously persisted evidence URIs (`https://...` or `file:///.../evidence/...`) must not be re-compressed repeatedly.
4. **Non-blocking Cache Cleanup**: If raw file deletion fails due to file system locks, suppress the error so the user's flow is uninterrupted.
5. **Durable Sandbox Hashing**: The SHA-256 checksum stored in evidence metadata must match the exact binary bytes of the processed file, not the deleted raw file.

---

### Task 1: Add `expo-image-manipulator` Dependency & Autolink

**Files:**
- Modify: `apps/mobile/package.json`
- Test: `apps/mobile/android/settings.gradle` (autolinking check)

**Interfaces:**
- Consumes: None
- Produces: Native module `expo-image-manipulator` registered in Expo autolinking registry.

- [ ] **Step 1: Update `apps/mobile/package.json` with `expo-image-manipulator`**
  Add `"expo-image-manipulator": "~57.0.21"` under `dependencies`.

- [ ] **Step 2: Run npm install**
  Run: `npm install`
  Expected: Package installed without peer dependency conflicts.

- [ ] **Step 3: Verify autolinking**
  Run: `cd apps/mobile && npx expo-modules-autolinking search`
  Expected: `expo-image-manipulator` listed in detected modules.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/mobile/package.json package-lock.json
  git commit -m "chore(mobile): add expo-image-manipulator dependency for SDK 57"
  ```

---

### Task 2: Build `ImageProcessingService` with Unit Tests

**Files:**
- Create: `apps/mobile/src/services/imageProcessingService.ts`
- Test: `tests/mobile/image-processing.spec.ts`

**Interfaces:**
- Consumes: `expo-image-manipulator`, `expo-file-system/legacy`
- Produces: `processEvidencePhoto(rawUri: string, options?: ProcessImageOptions): Promise<ProcessedImageResult>`
  `calculateTargetDimensions(width: number, height: number, maxDimension: number): { width: number; height: number }`

- [ ] **Step 1: Write failing unit test in `tests/mobile/image-processing.spec.ts`**
  Test target dimension calculations for landscape (4032x3024 -> 1440x1080), portrait (3024x4032 -> 1080x1440), square (2000x2000 -> 1440x1440), and smaller images (800x600 -> unchanged).
  Test fallback behavior when manipulator throws.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/mobile/image-processing.spec.ts`
  Expected: FAIL with missing module/function.

- [ ] **Step 3: Implement `ImageProcessingService` in `apps/mobile/src/services/imageProcessingService.ts`**
  Implement:
  - `calculateTargetDimensions(width, height, maxDimension)`
  - `processEvidencePhoto(rawUri, options)` with auto-fallback and asynchronous raw cache purge.
  - Safe URI detection (`isAlreadyProcessed(uri)`).

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/mobile/image-processing.spec.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/mobile/src/services/imageProcessingService.ts tests/mobile/image-processing.spec.ts
  git commit -m "feat(mobile): implement native ImageProcessingService with dimension clamping and fallback"
  ```

---

### Task 3: Integrate Native Pipeline into `StaffProofFlow.tsx`

**Files:**
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx:940-980`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Consumes: `processEvidencePhoto` from `../services/imageProcessingService`
- Produces: Lightweight processed photo URI wired into `beforePhoto` and `afterPhoto` task state.

- [ ] **Step 1: Update `captureEvidencePhoto` in `StaffProofFlow.tsx`**
  - Call `cameraRef.current.takePictureAsync({ quality: 0.85 })`.
  - Process via `await processEvidencePhoto(rawUri, { maxDimension: 1440, quality: 0.75 })`.
  - Pass `processed.uri` to `patchActiveTask` and `upsertPhotoEvidence`.
  - Handle exceptions gracefully with user-friendly error copy.

- [ ] **Step 2: Run mobile typecheck and lint**
  Run: `npm run typecheck --workspace @novyx/mobile && npm run lint`
  Expected: 0 errors.

- [ ] **Step 3: Run Vitest test suite**
  Run: `npm run test`
  Expected: All tests pass.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/mobile/src/screens/staff/StaffProofFlow.tsx
  git commit -m "feat(mobile): wire native image processing pipeline into camera capture flow"
  ```

---

### Task 4: Align Sandbox File Persistence & Verification

**Files:**
- Modify: `apps/mobile/src/storage/evidence/evidenceFileStore.ts` (if needed for size logging/audit)
- Test: `tests/mobile/evidence-store.spec.ts` or `tests/mobile/r2a-lifecycle.spec.ts`

**Interfaces:**
- Consumes: `ExpoEvidenceFileStore.persistEvidence(input: SaveEvidenceInput)`
- Produces: Sandbox evidence file stored with accurate `sizeBytes` reflecting the 250KB processed binary.

- [ ] **Step 1: Verify `ExpoEvidenceFileStore` persistence contract**
  Confirm `persistEvidence()` correctly captures `fileInfo.size` of the already-processed file.

- [ ] **Step 2: Run all mobile unit tests**
  Run: `npm run test`
  Expected: All tests pass.

- [ ] **Step 3: Commit**
  ```bash
  git add apps/mobile/src/storage/evidence/evidenceFileStore.ts
  git commit -m "refactor(mobile): ensure evidence file store reflects processed binary footprint"
  ```

---

### Task 5: Rebuild Android Native APK & Install on Samsung Galaxy Note 20 Ultra

**Files:**
- Output: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

**Interfaces:**
- Consumes: Gradle daemon, Android SDK
- Produces: Fresh native Android APK containing `ImageManipulatorModule`.

- [ ] **Step 1: Compile debug APK via Gradle**
  Run: `cd apps/mobile/android && ./gradlew assembleDebug`
  Expected: `BUILD SUCCESSFUL`

- [ ] **Step 2: Install APK to connected Samsung Galaxy Note 20 Ultra**
  Run: `adb -s R3CN70ED57A install -r -d apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`
  Expected: `Success`

- [ ] **Step 3: Configure adb reverse and launch app**
  Run: `adb -s R3CN70ED57A reverse tcp:8082 tcp:8082 && adb -s R3CN70ED57A shell am start --user 0 -n com.novyx.greenops/.MainActivity`
  Expected: App launches into home view without crash.

---

### Task 6: Physical Device Field Evidence & Operational Matrix Verification

**Files:**
- Script: `scripts/multi-staff-operational-matrix.cjs`

**Interfaces:**
- Consumes: Samsung Galaxy Note 20 Ultra (`R3CN70ED57A`), Ngrok endpoint `https://cannot-gutter-retry.ngrok-free.dev`
- Produces: Real physical device capture proof and passing 18/18 multi-staff operational matrix.

- [ ] **Step 1: Test camera capture on physical Samsung Note 20 Ultra**
  Navigate to a task in `StaffProofFlow` and capture a photo.
  Inspect generated file size via adb:
  `adb -s R3CN70ED57A shell "run-as com.novyx.greenops ls -lh files/evidence/*/"`
  Expected: Image file size is between **150 KB and 400 KB** (down from > 4 MB).

- [ ] **Step 2: Run multi-staff operational matrix across 5 roles over Ngrok tunnel**
  Run: `node scripts/multi-staff-operational-matrix.cjs`
  Expected: 18/18 checks PASS across staff, supervisor, and manager.

---

### Task 7: Record Architectural Rule `UI-058` & Monorepo Validation

**Files:**
- Modify: `.agents/memory/UI_UX_MEMORY.md`

**Interfaces:**
- Consumes: Verification results
- Produces: Locked architectural rule `UI-058`.

- [ ] **Step 1: Record Rule UI-058 in `.agents/memory/UI_UX_MEMORY.md`**
  Document the bounded native image processing pipeline, resolution clamp (1440px), JPEG compression (0.75), auto-orientation bake, and raw cache cleanup.

- [ ] **Step 2: Run complete monorepo verification**
  Run:
  ```bash
  npm run typecheck
  npm run lint
  npm run test
  npm run mobile:export:ios
  npm run mobile:export:android
  ```
  Expected: All gates pass cleanly.

- [ ] **Step 3: Commit**
  ```bash
  git add .agents/memory/UI_UX_MEMORY.md
  git commit -m "docs(memory): record architectural rule UI-058 for native image processing pipeline"
  ```
