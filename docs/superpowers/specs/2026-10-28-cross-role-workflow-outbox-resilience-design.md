# Cross-Role Workflow & Outbox Resilience Design Spec

## Executive Summary
This design specification defines the architectural remediation for cross-role business workflow synchronization and mobile outbox resilience in NOVYX GreenOps. It resolves the critical **Head-of-Line (HoL) blocking** bug in the mobile SQLite Outbox queue, fixes the `locationException.explanationPhotoUri` presigned reference mapping failure, enforces user-scoped outbox item dispatching, establishes a Dead-Letter Queue (DLQ) for non-retryable failures, and provides automatic snapshot synchronization upon role switching. This guarantees that field data moves seamlessly and reliably across Field Staff, Field Supervisors, and Operations Managers over the public Ngrok HTTPS tunnel without stalls.

---

## 1. Problem Statement & Root Cause Analysis

### 1.1 The Outbox Head-of-Line Blocking Failure
On the physical Samsung Galaxy Note 20 Ultra (`novyx_greenops_v1.db`), inspect table `outbox_items`:
1. `TSK-0066454e`: `SYNC_FAILED` (HTTP 403 Forbidden: `Role 'manager' is not authorized for this resource`).
2. `TSK-57343c94`: `SYNC_FAILED` (`Forbidden: local file URI "file:///..." cannot be submitted as durable server evidence`).

#### Root Cause A: Flawed URI Transformation in `submitEvidenceDispatcher.ts`
When an evidence submission includes a `locationException`:
```ts
if (cloned.locationException?.explanationPhotoUri) {
  cloned.locationException.explanationPhotoUri =
    resolveRef(cloned.locationException.explanationPhotoUri, 'EXCEPTION') ||
    resolveRef(cloned.locationException.explanationPhotoUri, 'BEFORE');
}
```
In `resolveRef`:
```ts
const resolveRef = (uri?: string, stageFallback?: string): string => {
  if (!uri) return uri ?? '';
  return uriMap.get(uri) ?? (stageFallback ? stageMap.get(stageFallback) : undefined) ?? uri;
};
```
When `stageMap.get('EXCEPTION')` is undefined, `resolveRef` returns `uri` (a raw `file:///...` string). Because a non-empty string is truthy, JavaScript short-circuits the `||` operator, leaving `explanationPhotoUri` as a raw local URI. Then `assertNoLocalOrTemporaryUris()` rejects it, throwing an error.

#### Root Cause B: FIFO Head-of-Line Queue Jam
In `outboxRepository.ts`:
```sql
SELECT * FROM outbox_items
WHERE sync_status = 'IDLE'
   OR (sync_status = 'SYNC_FAILED' AND error_classification IN ('NETWORK', 'SERVER_5XX'))
ORDER BY created_at ASC
LIMIT 1;
```
Because the failed item is the oldest record in SQLite (`ORDER BY created_at ASC`), `getNextEligibleItem()` repeatedly selects it. When it fails, `outboxCoordinator.processAll()` halts (`break`). Every subsequent evidence submission or check-in is permanently trapped in the client's local SQLite database.

#### Root Cause C: Separation of Duties Deadlock (DR-HARD-02)
Because Staff's check-in was trapped in the mobile outbox, `task.staffCompletedAt` remained `null` on the PostgreSQL server. When the Supervisor later attempted to submit evidence for that task, the backend use case rejected the request with HTTP 409 Conflict:
`"Staff must complete GPS, QR, and checklist check-in before supervisor submits photo evidence"`.

#### Root Cause D: Multi-Role Session Token Collision
The outbox item did not track which user created it. When a tester logged out of Staff and logged in as Manager, `runtime.triggerSync()` dispatched the pending Staff evidence using the Manager's auth token. The server rejected it with HTTP 403 Forbidden (`preHandler: [authHandler, staffOrSupervisor]`).

---

## 2. Goals & Non-Goals

### 2.1 Goals
- **Correct Evidence URI Mapping**: Fix `transformProofUris` so `locationException.explanationPhotoUri` reliably resolves to the durable S3/R2 reference of `BEFORE`, `EXCEPTION`, or the exact sandbox file hash.
- **Outbox Head-of-Line Isolation & Dead-Letter Handling**: Ensure that if an outbox item encounters repeated failures (max 3 attempts) or non-retryable errors (`FORBIDDEN`, `VALIDATION`), it is marked `DEAD_LETTER` so subsequent items can immediately sync.
- **User-Scoped Outbox Dispatch**: Store `userId` on each outbox item. Only dispatch items matching the currently logged-in user's identity.
- **Fresh Snapshot Synchronization**: Ensure that switching roles or logging in always forces a fresh fetch from `GET /v1/tasks` so that updates made by other roles are immediately visible.
- **Device Database Recovery**: Provide a clean recovery mechanism to purge existing deadlocked records on the physical test device.
- **End-to-End Multi-Role Validation**: Verify complete operational lifecycle (Manager dispatches -> Staff checks in -> Supervisor captures evidence -> Manager approves) on physical Samsung Note 20 Ultra over public Ngrok tunnel.

### 2.2 Non-Goals
- Changing the backend Separation of Duties rule (DR-HARD-02): Staff check-in *must* precede Supervisor evidence; this invariant remains strictly enforced.
- Introducing a third-party WebSocket server (lightweight polling / event-driven refresh suffices for current requirements).

---

## 3. Architecture & System Flow

```
[ User Action: Submit Check-in or Evidence ]
                      │
                      ▼
            [ SQLite Outbox Table ]
        (id, taskId, userId, payloadJson,
         syncStatus, attemptCount, errorClassification)
                      │
                      ▼
            [ outboxCoordinator ]
                      │
     Is item created by currently logged-in user?
           ├── NO  ──► Skip item (wait for correct user session)
           └── YES ──► Proceed to dispatch
                      │
                      ▼
          [ submitEvidenceDispatcher ]
       ├── Upload local files to S3/R2 presigned URLs
       ├── Map all URIs (including locationException.explanationPhotoUri)
       │     to durable S3/R2 keys (s3://... or raw objectKey)
       └── Assert no file:// remains
                      │
                      ▼
         [ POST /v1/tasks/:id/evidence ]
                      │
           Success? ──┬──► YES: Mark 'SYNCED', update local cache, reconcile version
                      └──► NO:
                            ├── If attemptCount >= 3 or permanent error:
                            │     Mark 'DEAD_LETTER' (HoL unblocked)
                            └── If network error:
                                  Increment attemptCount, mark 'SYNC_FAILED'
                                  Continue to next task
```

---

## 4. Component Changes

### 4.1 Fix URI Transformation (`apps/mobile/src/storage/outbox/submitEvidenceDispatcher.ts`)
Refactor `transformProofUris`:
```ts
if (cloned.locationException?.explanationPhotoUri) {
  const localUri = cloned.locationException.explanationPhotoUri;
  const durableRef =
    uriMap.get(localUri) ??
    stageMap.get('EXCEPTION') ??
    stageMap.get('BEFORE') ??
    cloned.proof.beforePhotoUri;

  if (durableRef && !durableRef.startsWith('file://')) {
    cloned.locationException.explanationPhotoUri = durableRef;
  }
}
```
This guarantees that `explanationPhotoUri` always receives the uploaded durable reference of the `BEFORE` or `EXCEPTION` photo.

### 4.2 Dead-Letter Queue & Max Attempts in `outboxRepository.ts`
1. Update database migration to support `DEAD_LETTER` sync status and add `user_id` column to `outbox_items`.
2. Update `getNextEligibleItem(currentUserId?: string)`:
   - Filter by `user_id = currentUserId` (if provided).
   - Only select `sync_status = 'IDLE'` or (`sync_status = 'SYNC_FAILED'` AND `attempt_count < 3` AND `error_classification IN ('NETWORK', 'SERVER_5XX')`).
   - If `attempt_count >= 3`, mark item as `DEAD_LETTER` so it will never block the queue again.

### 4.3 Safe Role Switch & Cache Invalidation in `MobileApp.tsx`
1. On `logout()`:
   - Reset active task, review task, and clear `snapshot` memory.
2. On `login()`:
   - Set `authenticatedUser`, `authenticatedStaffId`.
   - Pass `currentUserId` to `runtime.triggerSync(currentUserId)`.
   - Immediately invoke `refreshData()` to retrieve fresh server tasks.

### 4.4 SQLite Database Cleaner for Physical Device
A one-time ADB script to clear deadlocked rows:
```sql
DELETE FROM outbox_items WHERE sync_status IN ('SYNC_FAILED', 'DEAD_LETTER');
```

---

## 5. Verification & Acceptance Criteria
1. **Unit Tests**:
   - New unit tests in `tests/mobile/outbox-resilience.spec.ts` proving:
     - `explanationPhotoUri` transforms properly to durable storage reference.
     - Outbox queue skips items with `attempt_count >= 3` or non-matching `userId`.
     - Non-retryable errors do not cause Head-of-Line blocking.
2. **Monorepo Suite**:
   - `npm run typecheck` passes with 0 errors.
   - `npm run lint` passes with 0 errors.
   - `npm run test` passes (361+ tests green).
   - `npm run mobile:export:ios` & `npm run mobile:export:android` succeed.
3. **Physical Device Verification (Samsung Galaxy Note 20 Ultra)**:
   - Clear stuck outbox rows on phone.
   - Log in as Staff (Ngọc Diễm) -> Check in with GPS exception -> Submit -> Verify Outbox status = `SYNCED` immediately.
   - Log in as Supervisor -> Verify task shows "Chờ chụp ảnh" -> Capture Before & After photos -> Submit evidence -> Verify Outbox status = `SYNCED`.
   - Log in as Manager -> Verify task is in "Chờ duyệt" tab -> Review and Approve -> Verify task status = `COMPLETED`.
4. **Operational Concurrency Matrix**:
   - `node scripts/multi-staff-operational-matrix.cjs` passes 18/18 checks over Ngrok tunnel.
