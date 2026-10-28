# Supervisor Role & Sequential Field Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `supervisor` (`Giám sát hiện trường`) role and split field execution so `staff` submits GPS check-in ($\le 10\text{m}$), QR scan, and checklist completion first, `supervisor` captures Before & After photo evidence with supervisor GPS/timestamp second, and `manager` reviews and approves the combined record.

**Architecture:** Preserve the frozen 7-state `TaskStatus` lifecycle (`DR-MVP-03`) by tracking the sequential handoff inside `status: 'IN_PROGRESS'` via `staffCompletedAt` and `submissionStage: 'STAFF_EXECUTION' | 'SUPERVISOR_EVIDENCE'`. Extend shared `@novyx/contracts` role and DTO schemas, add `POST /v1/tasks/:id/staff-checkin` alongside supervisor support on `/v1/tasks/:id/evidence/presign`, `/v1/tasks/:id/evidence`, and `/v1/tasks/:id/rework/resubmit`, and update the Expo React Native mobile workflow (`mobileWorkflow.ts`, `StaffProofFlow.tsx`, `SupervisorArea.tsx`, `ManagerReview.tsx`, `ManagerCreateTask.tsx`) and Admin Web user selector.

**Tech Stack:** TypeScript 5.8, Zod (`@novyx/contracts`), Fastify + PostgreSQL (`apps/api`), Expo SDK 57 / React Native (`apps/mobile`), React + Vite (`apps/admin-web`), Vitest (`tests/`).

**Spec:** `docs/superpowers/specs/2026-10-24-supervisor-role-workflow-design.md`

## Global Constraints

- `CANONICAL_TASK_STATUSES` MUST remain the exact 7-state array `['PENDING', 'IN_PROGRESS', 'BLOCKED', 'WAITING_REVIEW', 'REWORK_REQUIRED', 'COMPLETED', 'CANCELLED']` (`DR-MVP-03`).
- `HUMAN_ROLES` in `packages/contracts/src/auth/roles.ts` MUST be `['staff', 'supervisor', 'manager', 'admin']`; `Role` in `packages/contracts/src/legacy/transitional.ts` MUST be `'Staff' | 'Supervisor' | 'Manager'`.
- Separation of Duties (`DR-HARD-02`): `supervisor` submitting evidence MUST NOT equal `task.assignedStaffId`; `manager` reviewing a task MUST NOT equal `task.assignedStaffId`, `task.supervisorId`, or any historical author in `evidence_attempts`.
- Staff GPS verification MUST enforce distance $\le 10\text{m}$ (`MAX_GPS_DISTANCE_METERS = 10`) unless an explicit `locationException` reason is recorded.
- Mobile UI (`apps/mobile`) MUST use only tokens from `@novyx/ui` (`apps/mobile/src/theme/tokens.ts`), font weights `400` / `500` / `600` only, `Ionicons` vector icons (zero emojis in product UI), touch targets $\ge 44\times44\text{pt}$, and 100% Vietnamese user-facing product copy.
- Per `AGENTS.md`, do not run `git commit`, `git push`, `git reset`, or install new dependencies unless explicitly authorized by the user.

## Review Focus

- **Self-supervision (`DR-HARD-02` violation):** A user whose `actorId === task.assignedStaffId` attempts to presign or submit supervisor photo evidence (`POST /v1/tasks/:id/evidence/presign` or `POST /v1/tasks/:id/evidence` with `role: 'supervisor'`) — must be rejected with HTTP `403 FORBIDDEN`.
- **Premature supervisor submission before staff check-in:** A `supervisor` attempts to submit photo evidence (`POST /v1/tasks/:id/evidence`) while `task.staffCompletedAt` is still `undefined` — must be rejected with HTTP `409 CONFLICT` (`"Staff must complete GPS, QR, and checklist check-in before supervisor submits photo evidence"`).
- **Assigned supervisor mismatch:** When `task.assignedSupervisorId` is set to `sup-1`, another supervisor `sup-2` attempts to presign or submit evidence — must be rejected with HTTP `403 FORBIDDEN`.
- **Staff GPS out-of-range without exception:** A `staff` user submits `POST /v1/tasks/:id/staff-checkin` with `gpsCheck.distanceMeters = 22` (> 10m) and no `locationException` — must be rejected with HTTP `422 VALIDATION_ERROR`.
- **Targeted rework preservation (`REWORK_REQUIRED`):** When `manager` requests rework on `BEFORE` or `AFTER` photos (`reworkTargetStep: 'BEFORE' | 'AFTER'`), `task.gpsCheck`, `task.qrCheck`, `task.checklist`, and `task.staffCompletedAt` from `staff` must remain intact so `supervisor` only recaptures the requested photo(s) without forcing `staff` to redo GPS/QR/Checklist.

---

### Task 1: Shared Role Taxonomy & DTO Contracts (`@novyx/contracts`)

**Files:**
- Modify: `packages/contracts/src/auth/roles.ts`
- Modify: `packages/contracts/src/operational/evidence.ts`
- Modify: `packages/contracts/src/operational/operational-tasks.ts`
- Modify: `packages/contracts/src/legacy/transitional.ts`
- Test: `tests/contracts/contracts.spec.ts`

**Interfaces:**
- Produces:
  - `HUMAN_ROLES = ['staff', 'supervisor', 'manager', 'admin'] as const` (`HumanRole = 'staff' | 'supervisor' | 'manager' | 'admin'`)
  - `Role = 'Staff' | 'Supervisor' | 'Manager'` in `packages/contracts/src/legacy/transitional.ts`
  - `StaffExecutionSubmitRequestSchema` (`{ version: number; siteVerification: SiteVerificationPayload; checklist: ChecklistItem[]; notes?: string }`) and `StaffExecutionSubmitRequest` in `packages/contracts/src/operational/evidence.ts`
  - `SupervisorEvidenceSubmitRequestSchema` (`{ version: number; proof: ChangeProofPayload; supervisorGpsCheck?: GpsCheckRecord; notes?: string }`) and `SupervisorEvidenceSubmitRequest` in `packages/contracts/src/operational/evidence.ts`
  - Extended `CreateTaskRequestSchema` (`assignedSupervisorId?: string`, `assignedSupervisorName?: string`) and `TaskDtoSchema` / `TaskDto` (`assignedSupervisorId?: string`, `assignedSupervisorName?: string`, `staffCompletedAt?: string`, `supervisorId?: string`, `supervisorName?: string`, `supervisorGpsCheck?: GpsCheckRecord`, `supervisorCompletedAt?: string`, `supervisorNotes?: string`)

- [x] **Step 1: Update contract tests in `tests/contracts/contracts.spec.ts` to assert `'supervisor'` role and new submission schemas**

Add assertions in `tests/contracts/contracts.spec.ts` (around lines 228–260):
```ts
it('separates human roles (staff, supervisor, manager, admin) from system actors (system, cron, webhook)', () => {
  expect(HUMAN_ROLES).toEqual(['staff', 'supervisor', 'manager', 'admin']);
  expect(SYSTEM_ACTOR_TYPES).toEqual(['system', 'cron', 'webhook']);
  expect(ALL_ACTOR_ROLES).toHaveLength(7);
});

it('validates StaffExecutionSubmitRequestSchema and SupervisorEvidenceSubmitRequestSchema', () => {
  const validStaffCheckin = StaffExecutionSubmitRequestSchema.safeParse({
    version: 2,
    siteVerification: {
      gpsCheck: {
        lat: 10.7769,
        lng: 106.7009,
        accuracyMeters: 4.5,
        distanceMeters: 3.2,
        timestamp: '2026-10-24T08:00:00.000Z',
        verified: true,
      },
      qrCheck: {
        scannedCode: 'TREE-001',
        expectedCode: 'TREE-001',
        matched: true,
        timestamp: '2026-10-24T08:01:00.000Z',
      },
    },
    checklist: [{ id: 'chk-1', label: 'Tưới gốc cây', completed: true }],
    notes: 'Đã hoàn thành tại hiện trường',
  });
  expect(validStaffCheckin.success).toBe(true);

  const validSupervisorEvidence = SupervisorEvidenceSubmitRequestSchema.safeParse({
    version: 3,
    proof: {
      beforePhotoUri: 's3://evidence/before.jpg',
      afterPhotoUri: 's3://evidence/after.jpg',
      checklist: [{ id: 'chk-1', label: 'Tưới gốc cây', completed: true }],
    },
    supervisorGpsCheck: {
      lat: 10.7769,
      lng: 106.7009,
      accuracyMeters: 5.0,
      distanceMeters: 4.0,
      timestamp: '2026-10-24T08:15:00.000Z',
      verified: true,
    },
    notes: 'Ảnh chụp rõ nét trước và sau khi thực hiện',
  });
  expect(validSupervisorEvidence.success).toBe(true);
});
```

- [x] **Step 2: Run contract tests to verify failure**

Run: `npx vitest run tests/contracts/contracts.spec.ts`
Expected: FAIL (`StaffExecutionSubmitRequestSchema` not exported / `HUMAN_ROLES` length mismatch).

- [x] **Step 3: Implement role & schema updates in `packages/contracts`**

1. In `packages/contracts/src/auth/roles.ts`:
   Update `HUMAN_ROLES` to `['staff', 'supervisor', 'manager', 'admin'] as const`.
2. In `packages/contracts/src/operational/evidence.ts`:
   Add and export `StaffExecutionSubmitRequestSchema`, `StaffExecutionSubmitRequest`, `SupervisorEvidenceSubmitRequestSchema`, and `SupervisorEvidenceSubmitRequest`.
3. In `packages/contracts/src/operational/operational-tasks.ts`:
   Add optional `assignedSupervisorId` and `assignedSupervisorName` to `CreateTaskRequestSchema`; add optional `assignedSupervisorId`, `assignedSupervisorName`, `staffCompletedAt`, `supervisorId`, `supervisorName`, `supervisorGpsCheck`, `supervisorCompletedAt`, and `supervisorNotes` to `TaskDtoSchema`.
4. In `packages/contracts/src/legacy/transitional.ts`:
   Update `export type Role = 'Staff' | 'Supervisor' | 'Manager'` and add optional supervisor/staff-completion fields to `TaskDto` and `CareHistoryDto`.

- [x] **Step 4: Run contract and governance tests to verify they pass**

Run: `npx vitest run tests/contracts/contracts.spec.ts tests/governance/frozen-semantics.spec.ts`
Expected: PASS (all contract and frozen-semantics assertions pass, `CANONICAL_TASK_STATUSES` remains 7 states).

---

### Task 2: Backend Domain, Use Cases, HTTP Routes & Seed (`apps/api`)

**Files:**
- Modify: `apps/api/src/modules/work-management/domain/task.entity.ts`
- Modify: `apps/api/src/modules/work-management/application/ports/evidence-attempt.repository.port.ts`
- Modify: `apps/api/src/modules/work-management/application/use-cases/create-task.use-case.ts`
- Modify: `apps/api/src/modules/work-management/application/use-cases/presign-evidence-upload.use-case.ts`
- Modify: `apps/api/src/modules/work-management/application/use-cases/submit-evidence.use-case.ts`
- Modify: `apps/api/src/modules/work-management/application/use-cases/resubmit-rework.use-case.ts`
- Modify: `apps/api/src/modules/work-management/application/use-cases/review-task.use-case.ts`
- Modify: `apps/api/src/infrastructure/http/routes/tasks.ts`
- Modify: `apps/api/src/infrastructure/persistence/scripts/seed-dev.ts`
- Test: `tests/api/operational-tasks.spec.ts`

**Interfaces:**
- Consumes: `HumanRole`, `StaffExecutionSubmitRequestSchema`, `SupervisorEvidenceSubmitRequestSchema`, `TaskDto` from `@novyx/contracts`.
- Produces:
  - `Task.recordStaffExecution(params: { gpsCheck?: GpsCheckRecord; qrCheck?: QrCheckRecord; locationException?: string; identityException?: string; checklist: ChecklistItem[]; notes?: string; completedAt?: string }): void` in `task.entity.ts` (sets `staffCompletedAt`, updates `gpsCheck`, `qrCheck`, `checklist`, `notes`, increments `version`, keeps `status = 'IN_PROGRESS'`).
  - `Task.submitSupervisorEvidence(params: { supervisorId: string; supervisorName?: string; supervisorGpsCheck?: GpsCheckRecord; beforePhoto: PhotoCaptureRecord; afterPhoto: PhotoCaptureRecord; checklist?: ChecklistItem[]; supervisorNotes?: string; completedAt?: string }): void` in `task.entity.ts` (sets `supervisorId`, `supervisorName`, `supervisorGpsCheck`, `supervisorCompletedAt`, `beforePhoto`, `afterPhoto`, transitions `IN_PROGRESS` $\to$ `WAITING_REVIEW`, increments `version`).
  - `SubmitEvidenceUseCase.submitStaffExecution(command: SubmitStaffExecutionCommand): Promise<Task>`
  - `HTTP POST /v1/tasks/:id/staff-checkin` (`requireRole(['staff'])`)
  - Updated `HTTP POST /v1/tasks/:id/evidence/presign`, `POST /v1/tasks/:id/evidence`, and `POST /v1/tasks/:id/rework/resubmit` (`requireRole(['staff', 'supervisor'])`)

- [x] **Step 1: Write failing backend integration tests in `tests/api/operational-tasks.spec.ts` covering the sequential Staff $\to$ Supervisor $\to$ Manager lifecycle and all 5 Review Focus edge cases**

Add a `describe('Sequential Staff GPS Check-in -> Supervisor Photo Evidence -> Manager Review workflow', ...)` block in `tests/api/operational-tasks.spec.ts` testing:
1. `staff-1` starts task (`PENDING` $\to$ `IN_PROGRESS`), then calls `POST /v1/tasks/:id/staff-checkin` with `distanceMeters: 22` and no exception $\to$ rejected with `422 VALIDATION_ERROR`.
2. `sup-1` calls `POST /v1/tasks/:id/evidence` before `staff-1` checks in $\to$ rejected with `409 CONFLICT`.
3. `staff-1` calls `POST /v1/tasks/:id/staff-checkin` with valid GPS (`distanceMeters: 4.1`), matched QR, and completed checklist $\to$ returns `200`, `status === 'IN_PROGRESS'`, `staffCompletedAt` defined, `version === 3`.
4. Self-supervision check (`DR-HARD-02`): `staff-1` (even if passing `x-actor-role: supervisor`) attempts `POST /v1/tasks/:id/evidence/presign` or `/evidence` on their own assigned task $\to$ rejected with `403 FORBIDDEN`.
5. Assigned supervisor check: if `assignedSupervisorId: 'sup-1'` was set on task creation, `sup-2` attempting presign/evidence is rejected with `403 FORBIDDEN`.
6. `sup-1` presigns `before` and `after` photos via `POST /v1/tasks/:id/evidence/presign` (`role: 'supervisor'`) and submits `POST /v1/tasks/:id/evidence` with `supervisorGpsCheck` $\to$ returns `200`, `status === 'WAITING_REVIEW'`, `supervisorId === 'sup-1'`, preserving `staff-1`'s `gpsCheck`, `qrCheck`, `checklist`, and `staffCompletedAt`.
7. `DR-HARD-02` review check: neither `staff-1` nor `sup-1` can approve the task as manager (`403 FORBIDDEN`); `mgr-1` approves (`WAITING_REVIEW` $\to$ `COMPLETED`).
8. Rework targeting `AFTER`: when `mgr-1` rejects with `reworkReason: '[REWORK_TARGET:AFTER] Ảnh sau bị mờ'`, `task.staffCompletedAt` and `task.gpsCheck` remain intact, and `sup-1` can resubmit rework via `POST /v1/tasks/:id/rework/resubmit`.

- [x] **Step 2: Run the API test suite to verify the new tests fail**

Run: `npx vitest run tests/api/operational-tasks.spec.ts`
Expected: FAIL (`404` on `/v1/tasks/:id/staff-checkin` and `403` for `supervisor` on `/v1/tasks/:id/evidence/presign`).

- [x] **Step 3: Implement domain entity, use cases, HTTP routes, and seed updates in `apps/api`**

1. **`apps/api/src/modules/work-management/domain/task.entity.ts`**:
   - Add `assignedSupervisorId?: string`, `assignedSupervisorName?: string`, `staffCompletedAt?: string`, `supervisorId?: string`, `supervisorName?: string`, `supervisorGpsCheck?: GpsCheckRecord`, `supervisorCompletedAt?: string`, `supervisorNotes?: string` to `TaskProps` and getters on `Task`.
   - Implement `recordStaffExecution(...)` (validates `status === 'IN_PROGRESS'`, updates GPS/QR/checklist/notes, sets `staffCompletedAt`, increments `version`).
   - Update `submitForReview(...)` / `submitSupervisorEvidence(...)` and `resubmitRework(...)` to preserve existing `gpsCheck`, `qrCheck`, `checklist`, `staffCompletedAt`, and record `supervisorId`, `supervisorName`, `supervisorGpsCheck`, `supervisorCompletedAt`, `supervisorNotes`.
2. **`apps/api/src/modules/work-management/application/use-cases/presign-evidence-upload.use-case.ts`**:
   - Allow `context.role === 'supervisor'` or `'staff'`.
   - When `context.role === 'supervisor'`: enforce `context.actorId !== task.assignedStaffId` (`DR-HARD-02`), and if `task.assignedSupervisorId` is set, enforce `task.assignedSupervisorId === context.actorId`.
3. **`apps/api/src/modules/work-management/application/use-cases/submit-evidence.use-case.ts`**:
   - Add `submitStaffExecution(command)` for `staff`: validates `status === 'IN_PROGRESS'`, `task.assignedStaffId === context.actorId`, GPS distance $\le 10\text{m}$ (unless `locationException` is present), QR match (unless `identityException` is present), all checklist items `completed: true`, saves `EvidenceAttempt` (`submissionType: 'INITIAL'`), calls `task.recordStaffExecution(...)`, and persists task.
   - Update `execute(command)` so when `context.role === 'supervisor'`:
     - Enforces `context.actorId !== task.assignedStaffId` (`DR-HARD-02`).
     - Enforces `!task.assignedSupervisorId || task.assignedSupervisorId === context.actorId`.
     - Enforces `Boolean(task.staffCompletedAt)` (throws `ConflictError('Staff must complete GPS, QR, and checklist check-in before supervisor submits photo evidence')` if missing).
     - Validates S3 object reservations for `beforePhotoUri` and `afterPhotoUri` owned by `context.actorId`.
     - Merges supervisor's `beforePhoto`, `afterPhoto`, `supervisorGpsCheck`, `supervisorNotes` with the task's existing `gpsCheck`, `qrCheck`, and `checklist`, transitions `IN_PROGRESS` $\to$ `WAITING_REVIEW`, and records an `EvidenceAttempt` authored by `supervisor`.
   - Keep `context.role === 'staff'` full submission in `execute(command)` working for existing tests.
4. **`apps/api/src/modules/work-management/application/use-cases/resubmit-rework.use-case.ts`**:
   - Allow `context.role === 'supervisor'` (verifying `context.actorId !== task.assignedStaffId` and `!task.assignedSupervisorId || task.assignedSupervisorId === context.actorId`) as well as `'staff'`. When `supervisor` resubmits rework, allow `siteVerification` to fall back to the task's already-verified `gpsCheck` and `qrCheck` from `staff`.
5. **`apps/api/src/infrastructure/http/routes/tasks.ts`**:
   - Project the new supervisor & staff-checkin fields in `toTaskDto(task)`.
   - Add `POST /v1/tasks/:id/staff-checkin` (`preHandler: requireRole(['staff'])`).
   - Update `POST /v1/tasks/:id/evidence/presign`, `POST /v1/tasks/:id/evidence`, and `POST /v1/tasks/:id/rework/resubmit` to `requireRole(['staff', 'supervisor'])`. For `supervisor` on `/v1/tasks/:id/evidence`, accept `SupervisorEvidenceSubmitRequestSchema` (or `EvidenceSubmitRequestSchema`) and populate `siteVerification` from the task's `gpsCheck`/`qrCheck` when omitted by the supervisor payload.
6. **`apps/api/src/infrastructure/persistence/scripts/seed-dev.ts`**:
   - Seed demo supervisor account `supervisor1@novyx.vn` (`displayName: 'Phạm Giám Sát'`, `role: 'supervisor'`, password `'NovyxDemo!2026'`).

- [x] **Step 4: Run API tests to verify all existing and new tests pass**

Run: `npx vitest run tests/api/operational-tasks.spec.ts`
Expected: PASS.

---

### Task 3: Mobile Workflow Domain & API Service (`apps/mobile/src/domain` & `services`)

**Files:**
- Modify: `apps/mobile/src/domain/mobileWorkflow.ts`
- Modify: `apps/mobile/src/services/greenOpsService.ts`
- Test: `tests/mobile/r2a-lifecycle.spec.ts`

**Interfaces:**
- Consumes: `Role`, `TaskDto`, `GpsCheckRecord`, `ChecklistItem` from `@novyx/contracts`.
- Produces:
  - `getNextProofStep(task: TaskDto, role?: 'Staff' | 'Supervisor'): ProofStep` in `apps/mobile/src/domain/mobileWorkflow.ts`:
    - When `role === 'Staff'`: checks only `GPS` $\to$ `QR` $\to$ `CHECKLIST` $\to$ `'REVIEW'`. Never returns `'BEFORE'` or `'AFTER'`.
    - When `role === 'Supervisor'`: checks `GPS` (via `task.supervisorGpsCheck`) $\to$ `BEFORE` $\to$ `AFTER` $\to$ `'REVIEW'`.
    - When `role` is omitted: preserves combined 5-item evaluation (`GPS`, `QR`, `BEFORE`, `AFTER`, `CHECKLIST`) for manager gap validation and backward-compatible unit tests.
  - `getTaskProofWorkflowState(task: TaskDto, role?: 'Staff' | 'Supervisor'): TaskProofWorkflowState` in `apps/mobile/src/domain/mobileWorkflow.ts`:
    - When `role === 'Staff'`: `totalRequired = 3` (`gpsVerified`, `qrVerified`, `checklistComplete`), `readyToSubmit = completedCount === 3 && !task.staffCompletedAt`.
    - When `role === 'Supervisor'`: `totalRequired = 3` (`supervisorGpsVerified`, `beforeCaptured`, `afterCaptured`), `readyToSubmit = Boolean(task.staffCompletedAt) && completedCount === 3`.
  - `isTaskAwaitingSupervisor(task: TaskDto): boolean` in `apps/mobile/src/domain/mobileWorkflow.ts` (`task.status === 'IN_PROGRESS' && Boolean(task.staffCompletedAt) && (!task.beforePhoto?.uri || !task.afterPhoto?.uri)`).
  - `greenOpsService.submitStaffCheckin(id: string, payload: { version?: number; gpsCheck?: GpsCheckRecord; qrCheck?: QrCheckRecord; locationException?: string; identityException?: string; checklist: ChecklistItem[]; notes?: string }): Promise<TaskDto>`
  - `greenOpsService.submitSupervisorEvidence(id: string, payload: { version?: number; supervisorGpsCheck?: GpsCheckRecord; beforePhotoUri: string; afterPhotoUri: string; checklist: ChecklistItem[]; notes?: string }): Promise<TaskDto>`
  - `greenOpsService.getSupervisors(): Promise<StaffDto[]>`

- [x] **Step 1: Add unit tests in `tests/mobile/r2a-lifecycle.spec.ts` for role-aware `getNextProofStep`, `getTaskProofWorkflowState`, and `isTaskAwaitingSupervisor`**

Add test cases in `tests/mobile/r2a-lifecycle.spec.ts`:
```ts
it('excludes BEFORE and AFTER photo steps for Staff role and requires only GPS, QR, and CHECKLIST', () => {
  const inProgressTask = makeTask({ status: 'IN_PROGRESS' });
  expect(getNextProofStep(inProgressTask, 'Staff')).toBe('GPS');

  const afterGpsAndQr = makeTask({
    status: 'IN_PROGRESS',
    gpsCheck: {
      lat: 10.77,
      lng: 106.69,
      accuracyMeters: 5,
      distanceMeters: 3.5,
      timestamp: '2026-10-24T08:00:00Z',
      verified: true,
    },
    qrCheck: {
      scannedCode: 'QR-T-101',
      expectedCode: 'QR-T-101',
      matched: true,
      timestamp: '2026-10-24T08:01:00Z',
    },
    checklist: [{ id: 'c1', label: 'Kiểm tra gốc', completed: true }],
  });

  expect(getNextProofStep(afterGpsAndQr, 'Staff')).toBe('REVIEW');
  const staffState = getTaskProofWorkflowState(afterGpsAndQr, 'Staff');
  expect(staffState.totalRequired).toBe(3);
  expect(staffState.completedCount).toBe(3);
  expect(staffState.readyToSubmit).toBe(true);
});

it('routes Supervisor through GPS, BEFORE, and AFTER photo steps after Staff check-in', () => {
  const handoffTask = makeTask({
    status: 'IN_PROGRESS',
    staffCompletedAt: '2026-10-24T08:05:00Z',
    gpsCheck: {
      lat: 10.77,
      lng: 106.69,
      accuracyMeters: 5,
      distanceMeters: 3.5,
      timestamp: '2026-10-24T08:00:00Z',
      verified: true,
    },
    qrCheck: {
      scannedCode: 'QR-T-101',
      expectedCode: 'QR-T-101',
      matched: true,
      timestamp: '2026-10-24T08:01:00Z',
    },
    checklist: [{ id: 'c1', label: 'Kiểm tra gốc', completed: true }],
  });

  expect(isTaskAwaitingSupervisor(handoffTask)).toBe(true);
  expect(getNextProofStep(handoffTask, 'Supervisor')).toBe('GPS');

  const withSupGpsAndBefore = {
    ...handoffTask,
    supervisorGpsCheck: {
      lat: 10.77,
      lng: 106.69,
      accuracyMeters: 4,
      distanceMeters: 2.1,
      timestamp: '2026-10-24T08:10:00Z',
      verified: true,
    },
    beforePhoto: { uri: 'file:///before.jpg', timestamp: '2026-10-24T08:11:00Z' },
  };
  expect(getNextProofStep(withSupGpsAndBefore, 'Supervisor')).toBe('AFTER');
});
```

- [x] **Step 2: Run mobile workflow tests to verify failure**

Run: `npx vitest run tests/mobile/r2a-lifecycle.spec.ts`
Expected: FAIL (`isTaskAwaitingSupervisor` not exported / `getNextProofStep(afterGpsAndQr, 'Staff')` returns `'BEFORE'`).

- [x] **Step 3: Implement `mobileWorkflow.ts` and `greenOpsService.ts` updates**

1. In `apps/mobile/src/domain/mobileWorkflow.ts`:
   - Export `isTaskAwaitingSupervisor(task: TaskDto): boolean`.
   - Update `getNextProofStep(task: TaskDto, role?: 'Staff' | 'Supervisor'): ProofStep` and `getTaskProofWorkflowState(task: TaskDto, role?: 'Staff' | 'Supervisor'): TaskProofWorkflowState`.
   - Ensure `STAFF_STEPS = ['GPS', 'QR', 'CHECKLIST', 'REVIEW'] as const` and `SUPERVISOR_STEPS = ['GPS', 'BEFORE', 'AFTER', 'REVIEW'] as const` are exported for UI progress bars.
2. In `apps/mobile/src/services/greenOpsService.ts`:
   - Map backend role `'supervisor'` to `'Supervisor'` in `mapBackendRole`.
   - Add demo supervisor user (`sup-1`, `'Phạm Giám Sát'`, `'supervisor@novyx.vn'`) to fallback/demo directory.
   - Implement `submitStaffCheckin(...)` calling `POST /v1/tasks/:id/staff-checkin` (with offline/demo fallback updating `staffCompletedAt`, `gpsCheck`, `qrCheck`, `checklist`).
   - Implement `submitSupervisorEvidence(...)` calling `POST /v1/tasks/:id/evidence` (or `/v1/tasks/:id/rework/resubmit` when `status === 'REWORK_REQUIRED'`) with `supervisorGpsCheck` and `beforePhotoUri`/`afterPhotoUri`.
   - Implement `getSupervisors()` returning supervisor list for `ManagerCreateTask`.

- [x] **Step 4: Run mobile unit tests to verify they pass**

Run: `npx vitest run tests/mobile/r2a-lifecycle.spec.ts`
Expected: PASS.

---

### Task 4: Mobile Screens (`StaffProofFlow`, `SupervisorArea`, `ManagerReview`, `ManagerCreateTask`, `MobileApp`, `AuthScreens`) & Admin Web

**Files:**
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffArea.tsx`
- Create: `apps/mobile/src/screens/supervisor/SupervisorArea.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerReview.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerCreateTask.tsx`
- Modify: `apps/mobile/src/screens/MobileApp.tsx`
- Modify: `apps/mobile/src/screens/AuthScreens.tsx`
- Modify: `apps/admin-web/src/pages/UsersPage.tsx`

**Interfaces:**
- Consumes: `getNextProofStep`, `getTaskProofWorkflowState`, `isTaskAwaitingSupervisor`, `STAFF_STEPS`, `SUPERVISOR_STEPS` from `apps/mobile/src/domain/mobileWorkflow.ts`; `greenOpsService` methods from Task 3; primitives from `apps/mobile/src/components/AppPrimitives.tsx`; tokens from `apps/mobile/src/theme/tokens.ts`.
- Produces:
  - `StaffProofFlow`: 3-step field check-in UI (`1. Định vị GPS (≤ 10m)` $\to$ `2. Quét mã QR cây` $\to$ `3. Danh mục công việc` $\to$ `4. Gửi xác nhận hiện trường`). No `BEFORE` or `AFTER` camera steps for `Staff`. Shows read-only banner `"Đã gửi xác nhận hiện trường — Đang chờ Giám sát hiện trường chụp ảnh nghiệm thu"` when `task.staffCompletedAt` is set.
  - `SupervisorArea`: Dedicated screen for `Role === 'Supervisor'` with filter tabs (`Chờ chụp ảnh`, `Cần chụp lại`, `Đã gửi duyệt`), Supervisor GPS verification, Before & After photo capture via `captureProofPhoto`, and `Gửi bằng chứng giám sát` action transitioning task to `WAITING_REVIEW`.
  - `ManagerReview`: Combined verification view showing **1. Xác nhận từ Nhân viên hiện trường (`staff`)** (Staff name, GPS distance $\le 10\text{m}$, accuracy, timestamp, QR match, Checklist) and **2. Bằng chứng ảnh từ Giám sát hiện trường (`supervisor`)** (Supervisor name, Supervisor GPS/timestamp, Before & After `PhotoPair`), plus targeted rework chips (`[REWORK_TARGET:GPS]`, `[REWORK_TARGET:QR]`, `[REWORK_TARGET:CHECKLIST]` for Staff vs `[REWORK_TARGET:BEFORE]`, `[REWORK_TARGET:AFTER]` for Supervisor).

- [x] **Step 1: Update `StaffProofFlow.tsx` and `StaffArea.tsx` to remove Before/After photo capture from `Staff` and submit GPS + QR + Checklist check-in**

1. In `apps/mobile/src/screens/staff/StaffProofFlow.tsx`:
   - Replace the 5-step array with `STAFF_STEPS` (`['GPS', 'QR', 'CHECKLIST', 'REVIEW']`) and pass `'Staff'` to `getNextProofStep(task, 'Staff')` and `getTaskProofWorkflowState(task, 'Staff')`.
   - Remove the `BEFORE` and `AFTER` photo capture cards from the `Staff` flow; in the `REVIEW` step, display a summary of:
     - Vị trí GPS hiện trường (`distanceMeters` m, `accuracyMeters` m, trạng thái $\le 10\text{m}$ hoặc ngoại lệ)
     - Mã QR cây xanh (`scannedCode` / ngoại lệ)
     - Tiến độ danh mục công việc (`completedCount/total`)
   - Primary CTA: `"Gửi định vị GPS & Xác nhận hoàn thành"` calling `onSubmitStaffCheckin(task)`.
   - When `task.staffCompletedAt` is already set and `task.status === 'IN_PROGRESS'`, render an informational `Banner` (`tone="info"`, title `"Đang chờ Giám sát hiện trường"`, message `"Bạn đã gửi định vị GPS và danh mục công việc. Giám sát hiện trường sẽ chụp ảnh Trước & Sau để hoàn tất hồ sơ trình Quản lý duyệt."`).
2. In `apps/mobile/src/screens/staff/StaffArea.tsx`:
   - Pass `'Staff'` to `getTaskProofWorkflowState(task, 'Staff')` and display badge `"Chờ giám sát chụp ảnh"` when `isTaskAwaitingSupervisor(task)` is true.

- [x] **Step 2: Create `apps/mobile/src/screens/supervisor/SupervisorArea.tsx` for `Supervisor` role**

Create `apps/mobile/src/screens/supervisor/SupervisorArea.tsx` using `AppPrimitives.tsx` (`ScreenHeader`, `SurfaceCard`, `Badge`, `PrimaryButton`, `SecondaryButton`, `PhotoPair`, `CheckRow`, `Banner`, `EmptyState`, `SearchField`) and `tokens.ts`:
- Lists tasks in `IN_PROGRESS` (prioritizing tasks where `staffCompletedAt` is present) and `REWORK_REQUIRED` targeting `BEFORE`/`AFTER`/`EVIDENCE`.
- Displays Staff's verified check-in summary card (`Nhân viên thực hiện`, `Khoảng cách GPS`, `Mã QR`, `Checklist đã hoàn thành`, `Thời gian báo cáo`).
- Provides the 3-step Supervisor Evidence Flow (`SUPERVISOR_STEPS`: `1. Định vị Giám sát` $\to$ `2. Ảnh Trước` $\to$ `3. Ảnh Sau` $\to$ `4. Gửi duyệt Quản lý`):
  - Step `GPS`: Captures `supervisorGpsCheck` with Haversine distance to tree coordinates.
  - Step `BEFORE` & `AFTER`: Uses `onCapturePhoto('before' | 'after')` (`expo-image-picker` + `ExpoEvidenceFileStore`) and previews via `PhotoPair`.
  - Step `REVIEW`: Submits supervisor evidence via `onSubmitSupervisorEvidence(task)`.

- [x] **Step 3: Update `ManagerReview.tsx`, `ManagerCreateTask.tsx`, `MobileApp.tsx`, `AuthScreens.tsx`, and `apps/admin-web/src/pages/UsersPage.tsx`**

1. **`apps/mobile/src/screens/manager/ManagerReview.tsx`**:
   - Render two distinct verification sections inside the task review modal/detail:
     - **Phần 1 — Nhân viên hiện trường (`task.assignedStaff`)**: GPS distance ($\le 10\text{m}$ badge), GPS accuracy & timestamp (`task.staffCompletedAt`), QR verification status, and Checklist items.
     - **Phần 2 — Giám sát hiện trường (`task.supervisorName || task.assignedSupervisorName || 'Giám sát hiện trường'`)**: Supervisor GPS check & timestamp (`task.supervisorCompletedAt`), Before & After `PhotoPair`, and `supervisorNotes`.
2. **`apps/mobile/src/screens/manager/ManagerCreateTask.tsx`**:
   - Add optional `"Giám sát hiện trường (Tùy chọn)"` selector populated from `supervisors` prop so Manager can either assign a specific supervisor or leave open for any supervisor in the area.
3. **`apps/mobile/src/screens/MobileApp.tsx` & `AuthScreens.tsx`**:
   - Support `role === 'Supervisor'` routing to `SupervisorArea`.
   - Wire `submitStaffCheckin` and `submitSupervisorEvidence` handlers.
   - Add quick-switch / demo role support for `'Supervisor'` (`Giám sát hiện trường`) in `AuthScreens.tsx` / profile switcher.
4. **`apps/admin-web/src/pages/UsersPage.tsx`**:
   - Add `<option value="supervisor">Supervisor (Giám sát hiện trường)</option>` to the role `<select>`.

- [x] **Step 4: Run typecheck across all workspaces**

Run: `npm run typecheck`
Expected: PASS (0 TypeScript errors across `@novyx/contracts`, `@novyx/api`, `@novyx/mobile`, `@novyx/admin-web`).

---

### Task 5: End-to-End Verification & Regression Gate

**Files:**
- Test: `tests/contracts/contracts.spec.ts`
- Test: `tests/governance/frozen-semantics.spec.ts`
- Test: `tests/api/operational-tasks.spec.ts`
- Test: `tests/mobile/r2a-lifecycle.spec.ts`

**Interfaces:**
- Consumes: All deliverables from Tasks 1–4.
- Produces: Verified green test suite, typecheck, and lint across the monorepo.

- [x] **Step 1: Run full Vitest test suite**

Run: `npm test`
Expected: PASS (all contract, governance, API, and mobile tests pass).

- [x] **Step 2: Run workspace typechecks and linter**

Run: `npm run typecheck --workspace @novyx/mobile && npm run typecheck && npm run lint`
Expected: PASS with zero errors.
