# Cross-Role Workflow & Outbox Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the outbox Head-of-Line blocking defect, correctly transform GPS exception photo URIs, isolate failed items with a Dead-Letter Queue (DLQ), and guarantee cross-role workflow data continuity between Staff, Supervisor, and Manager over the public Ngrok HTTPS tunnel.

**Architecture:** Refactor `submitEvidenceDispatcher.ts` to reliably map `locationException.explanationPhotoUri` to durable S3/R2 references. Add `attempt_count < 3` and `DEAD_LETTER` non-blocking isolation to `outboxRepository.ts` and `outboxCoordinator.ts`. Scope outbox sync to the currently authenticated user in `MobileApp.tsx`. Purge deadlocked test records from the connected Samsung Galaxy Note 20 Ultra and verify complete cross-role lifecycle.

**Tech Stack:** React Native 0.86, Expo SDK 57, `expo-sqlite`, TypeScript, Vitest, Fastify, Drizzle ORM, ADB.

**Spec:** `docs/superpowers/specs/2026-10-28-cross-role-workflow-outbox-resilience-design.md`

## Global Constraints
- **Zero Data Loss**: Local evidence files are never deleted on sync failure; failed submissions transition to `DEAD_LETTER` for manual inspection rather than being silently dropped.
- **Strict Separation of Duties (DR-HARD-02)**: Backend enforcement remains invariant; Staff check-in must reach the server before Supervisor photo evidence can be submitted.
- **Head-of-Line Guarantee**: A failed outbox item must never prevent newer, valid tasks from syncing to the server.
- **Verification Gates**: 0 TypeScript errors, 0 ESLint errors, all Vitest tests pass, physical device completes Staff -> Supervisor -> Manager lifecycle, and 18/18 operational matrix checks pass over public Ngrok tunnel.

## Review Focus
1. **GPS Exception Photo Mapping**: When a task has a location exception, its `explanationPhotoUri` must receive the exact durable reference of the uploaded photo (`s3://...` or objectKey), never leaving `file:///`.
2. **Dead-Letter State Transition**: An item that fails 3 times must transition to `DEAD_LETTER` and not be returned by `getNextEligibleItem()`.
3. **Session User Mismatch**: A user logged in as Manager must not dispatch outbox items created by Staff or Supervisor.
4. **Role Switch Freshness**: Switching accounts in `MobileApp.tsx` must trigger a fresh server fetch rather than displaying stale in-memory task lists.
5. **Database Transaction Safety**: SQLite updates in `outboxRepository` must safely handle transaction rollbacks without deadlocking.

---

### Task 1: Fix Evidence URI Transformation & Location Exception Mapping

**Files:**
- Modify: `apps/mobile/src/storage/outbox/submitEvidenceDispatcher.ts:190-245`
- Test: `tests/mobile/outbox-resilience.spec.ts`

**Interfaces:**
- Consumes: `SubmitEvidenceRequest`, `uriMap: Map<string, string>`, `stageMap: Map<string, string>`
- Produces: Correctly transformed `SubmitEvidenceRequest` with no remaining `file:///` URIs.

- [ ] **Step 1: Write failing unit test in `tests/mobile/outbox-resilience.spec.ts`**
  Test `transformProofUris` with a `locationException` containing a local `file:///` URI, asserting it resolves to the durable reference of the `BEFORE` or `EXCEPTION` stage.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/mobile/outbox-resilience.spec.ts`
  Expected: FAIL (file:/// URI remains unresolved or throws error).

- [ ] **Step 3: Fix `transformProofUris` in `submitEvidenceDispatcher.ts`**
  Ensure `cloned.locationException.explanationPhotoUri` checks `uriMap.get(localUri)`, `stageMap.get('EXCEPTION')`, `stageMap.get('BEFORE')`, and `cloned.proof.beforePhotoUri`. If any produces a durable non-file reference, assign it.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/mobile/outbox-resilience.spec.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/mobile/src/storage/outbox/submitEvidenceDispatcher.ts tests/mobile/outbox-resilience.spec.ts
  git commit -m "fix(mobile): resolve location exception photo URI to durable reference in outbox dispatcher"
  ```

---

### Task 2: Implement Outbox Head-of-Line Isolation & Dead-Letter Queue

**Files:**
- Modify: `apps/mobile/src/storage/outbox/outboxRepository.ts:145-190`
- Modify: `apps/mobile/src/storage/outbox/outboxCoordinator.ts:80-140`
- Test: `tests/mobile/outbox-resilience.spec.ts`

**Interfaces:**
- Consumes: `OutboxItem`, `attemptCount`, `errorClassification`
- Produces: `getNextEligibleItem()` that skips failed items with `attemptCount >= 3` and isolates `DEAD_LETTER` items.

- [ ] **Step 1: Add unit test in `tests/mobile/outbox-resilience.spec.ts` for Head-of-Line skip**
  Verify that when an old item has `attempt_count >= 3`, `getNextEligibleItem()` returns the newer pending item instead of being blocked.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/mobile/outbox-resilience.spec.ts`
  Expected: FAIL

- [ ] **Step 3: Update `getNextEligibleItem` and failure handling**
  In `outboxRepository.ts`, update SQL query to filter `attempt_count < 3` and exclude `DEAD_LETTER`.
  In `outboxCoordinator.ts`, if `item.attemptCount + 1 >= 3`, transition status to `DEAD_LETTER`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run tests/mobile/outbox-resilience.spec.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/mobile/src/storage/outbox/outboxRepository.ts apps/mobile/src/storage/outbox/outboxCoordinator.ts tests/mobile/outbox-resilience.spec.ts
  git commit -m "feat(mobile): add Dead-Letter Queue and max attempt limit to unblock outbox Head-of-Line"
  ```

---

### Task 3: Enforce User Scoping & Snapshot Refresh on Role Switch

**Files:**
- Modify: `apps/mobile/src/screens/MobileApp.tsx`
- Modify: `apps/mobile/src/storage/outbox/outboxCoordinator.ts`

**Interfaces:**
- Consumes: `session.user.id`, `session.user.role`
- Produces: User-scoped outbox processing that prevents role token mismatches.

- [ ] **Step 1: Update `MobileApp.tsx` login & role switch logic**
  Ensure `login()` forces a fresh `refreshData()` from server and only triggers sync for operational mobile roles.
  Ensure `logout()` resets in-memory snapshot state so previous user tasks do not linger.

- [ ] **Step 2: Run typecheck and lint**
  Run: `npm run typecheck --workspace @novyx/mobile && npm run lint`
  Expected: 0 errors.

- [ ] **Step 3: Run Vitest test suite**
  Run: `npm run test`
  Expected: All tests pass.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/mobile/src/screens/MobileApp.tsx
  git commit -m "feat(mobile): enforce user scoping and fresh snapshot sync on role switch"
  ```

---

### Task 4: Clear Stuck Deadlocked Outbox Records on Physical Device

**Files:**
- Script: ADB execution / SQLite cleanup

**Interfaces:**
- Consumes: Samsung Galaxy Note 20 Ultra (`R3CN70ED57A`), `novyx_greenops_v1.db`
- Produces: Clean SQLite outbox with 0 deadlocked items.

- [ ] **Step 1: Execute SQLite cleanup on physical device**
  Clear deadlocked `SYNC_FAILED` records from `novyx_greenops_v1.db` via adb.

- [ ] **Step 2: Verify outbox items count**
  Query `SELECT count(*) FROM outbox_items;` on device.
  Expected: Count = 0.

---

### Task 5: End-to-End Cross-Role Field Verification & Concurrency Matrix

**Files:**
- Script: `scripts/multi-staff-operational-matrix.cjs`

**Interfaces:**
- Consumes: Physical device (`R3CN70ED57A`), Ngrok endpoint `https://cannot-gutter-retry.ngrok-free.dev`
- Produces: Verified end-to-end multi-role data flow with 0 stuck items.

- [ ] **Step 1: Test live Staff check-in on physical device**
  Perform Staff check-in on physical device and verify Outbox status becomes `SYNCED` immediately.

- [ ] **Step 2: Test live Supervisor photo submission on physical device**
  Verify task shows in Supervisor area, capture Before/After photos, submit evidence, and verify Outbox status becomes `SYNCED`.

- [ ] **Step 3: Run multi-staff operational matrix across 5 roles over Ngrok tunnel**
  Run: `node scripts/multi-staff-operational-matrix.cjs`
  Expected: 18/18 checks PASS.

---

### Task 6: Record Architectural Rule `UI-059` & Monorepo Validation

**Files:**
- Modify: `.agents/memory/UI_UX_MEMORY.md`

**Interfaces:**
- Consumes: Verification results
- Produces: Locked architectural rule `UI-059`.

- [ ] **Step 1: Record Rule UI-059 in `.agents/memory/UI_UX_MEMORY.md`**
  Document the outbox Head-of-Line isolation, Dead-Letter Queue, GPS exception photo reference mapping, and user-scoped sync rules.

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
  git commit -m "docs(memory): record architectural rule UI-059 for outbox resilience and cross-role workflow continuity"
  ```
