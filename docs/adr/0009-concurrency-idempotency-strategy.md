# ADR 0009: Optimistic Concurrency Control & Command Idempotency Strategy

## Status
PROPOSED

## Context
In the reconciled and frozen business baseline (Phase 0–10), field workflows are distributed and inherently asynchronous. Operations Managers manage tasks from an office or mobile workspace, while Field Staff execute work outdoors under intermittent connectivity.

This distributed environment produces concrete concurrency races:
1. **Offline Work vs Manager Intervention:** A Manager reassigns a `BLOCKED` task or cancels an `IN_PROGRESS` task while the assigned Staff is actively working or submitting evidence offline.
2. **Duplicate Network Retries:** A mobile client sends `SubmitTaskEvidenceRequest`; the server processes the submission and transitions the task to `WAITING_REVIEW`, but the cellular connection drops before the HTTP response reaches the mobile device. The client's Outbox retries the request, risking duplicate processing, corrupted history, or erroneous error states.
3. **Double Review Submission:** A Manager double-taps "Phê duyệt" or network latency causes a repeated `ReviewDecisionRequest`.
4. **Concurrent Master Data Updates:** Two administrators update the same tree's canonical coordinates or metadata simultaneously.

Currently in `packages/contracts` and `apps/mobile`:
- `TaskDto` has NO concurrency token or `version` property (`ARCHITECTURE.md §4.2`).
- State-mutating requests (`CreateTaskRequest`, `SubmitTaskEvidenceRequest`, `ReviewDecisionRequest`) have NO idempotency key mechanism.
- The server has no formal contract to return or detect conflicting concurrent mutations.

## Frozen Business Drivers
- **Deterministic State Transitions (`DOMAIN.md §3`, `WORKFLOWS.md §2`):** State transitions are strictly valid only from specific source states (e.g., `StartTask` only from `PENDING`; `ApproveTask` only from `WAITING_REVIEW`). Concurrency violations must not produce undefined intermediate states.
- **Evidence Immutability (`DR-HARD-03`):** Once evidence is accepted into `WAITING_REVIEW`, it cannot be overwritten by stale duplicate submissions.
- **Audit Traceability (`DR-POL-04`):** Every distinct state mutation must be uniquely identifiable and attributable in the audit log.

## NFR / Quality Drivers
- **Fault Tolerance & Reliability (`QAS-FAULT-01`, `QAS-OFFLINE-01`):** Retrying network requests after transport timeouts must be 100% safe and side-effect free.
- **Data Integrity (`QAS-SEC-01`):** Prevent lost updates (the "last write wins" hazard where a stale update overwrites concurrent progress).
- **Clear Error Feedback:** Concurrency conflicts must return actionable, structured error payloads (`409 CONFLICT`), allowing clients to gracefully resolve or inform the user.

## Decision Question
What technical mechanisms should be established across `@novyx/contracts`, client outboxes, and backend APIs to handle concurrent mutations and guarantee idempotent command retries?

## Options Considered

### Option A: Pessimistic Locking
- **Description:** Lock records in the database when a user begins viewing or editing a task (e.g., `SELECT FOR UPDATE` or explicit `isLocked` flag in task table).
- **Advantages:** Prevents concurrent access completely.
- **Disadvantages:**
  - Completely incompatible with offline field work: An offline staff member cannot hold a database lock over hours in disconnected areas.
  - Causes severe deadlock and starvation issues in distributed systems.
  - Bad UX: Workers or managers blocked from viewing tasks because another user has the screen open.
- **Risks:** High risk of orphaned locks when mobile apps crash.
- **Migration Impact:** High complexity.
- **Operational Impact:** High database lock contention.

### Option B: Combined Optimistic Concurrency Control (OCC) + Header-Based Idempotency Keys [RECOMMENDED]
- **Description:**
  1. **Optimistic Concurrency Control (OCC) via Entity Versioning:**
     - Add integer `version: number` to all mutating aggregates (`TaskDto`, `TreeDto`, `PolicyDto`).
     - Any mutating command (e.g., `PATCH /tasks/:id/progress`, `POST /tasks/:id/reassign`, `POST /tasks/:id/cancel`) must include the expected entity version in the request body (`expectedVersion: number`) or via `If-Match: "<version>"` HTTP header.
     - Server executes atomic update: `UPDATE tasks SET ..., version = version + 1 WHERE id = :id AND version = :expectedVersion`.
     - If rows affected is 0: Server rejects with `409 CONFLICT` and error code `CONFLICT: STALE_VERSION`, returning the current authoritative server version of the entity.
  2. **Command Idempotency via Client-Generated UUID:**
     - All state-transitioning and creation requests (`POST /tasks`, `POST /tasks/:id/evidence`, `POST /tasks/:id/review`, `POST /tasks/:id/field-issue`, etc.) must include an `Idempotency-Key: <UUIDv4>` HTTP header (also mirrored in request payload for offline outbox storage).
     - Backend maintains an `idempotency_records` table: `(idempotency_key, actor_id, request_path, request_hash, status, response_code, response_body, created_at, expires_at)`.
     - *On repeated request with identical key & hash within retention window (e.g., 24 hours):* Server bypasses business execution and replays the cached HTTP response directly.
     - *On repeated request with identical key but different payload:* Server rejects with `422 UNPROCESSABLE_ENTITY` (`VALIDATION_FAILED: IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`).
- **Advantages:**
  - **Zero Lost Updates:** If a Manager reassigns a task while Staff is offline, the Staff's subsequent submission attempt detects the version mismatch (`409 CONFLICT`), preventing accidental data corruption while preserving the Staff's local evidence draft.
  - **Safe Automated Retries:** Mobile Outbox can aggressively retry network requests after timeouts without fear of duplicate tasks, double approvals, or duplicate audit events.
  - **Clean Industry Standard:** Aligns with standard HTTP semantics (`409 Conflict`, `If-Match`, IETF Idempotency-Key draft specifications).
- **Disadvantages:**
  - Requires clients to handle `409 CONFLICT` gracefully (prompting user to refresh and view latest state).
  - Backend must manage a lightweight idempotency cache/table with TTL cleanup.
- **Risks:** Negligible; standard enterprise distributed architecture pattern.
- **Migration Impact:** Moderate contract additions (`version`, `idempotencyKey`).
- **Operational Impact:** Small table with 24-hour TTL index; minimal storage overhead.

### Option C: Last-Write-Wins (Timestamp-based resolution)
- **Description:** Compare `updatedAt` timestamps and let the latest timestamp overwrite previous data.
- **Advantages:** Simple to implement; no version fields.
- **Disadvantages:**
  - Subject to clock skew across mobile devices and servers.
  - Silent data loss: A stale manager reassign could silently wipe out hours of field inspection notes without either party knowing.
  - Fails to guarantee deterministic state machine transitions.
- **Risks:** Severe business invariant violations and unrecoverable data loss.
- **Migration Impact:** Low implementation effort, but catastrophic business risk.
- **Operational Impact:** Zero.

## Proposed Decision
**Adopt Option B: Combined Optimistic Concurrency Control (OCC) + Header-Based Idempotency Keys.**

1. **Entity Versioning in Contracts:**
   - Add `version: number` to `TaskDto`, `TreeDto`, and governance aggregates.
   - All mutation endpoints support `expectedVersion?: number` in the request payload and evaluate atomic version incrementing on update.
2. **Idempotency Standards:**
   - All mutating REST requests require `Idempotency-Key: <UUIDv4>`.
   - The mobile Outbox Worker (`ADR 0008`) generates the `idempotencyKey` at the moment of local draft finalization and preserves it through all subsequent retry attempts.
3. **Conflict Resolution Strategy for Field Tasks:**
   - When a mobile client receives `409 CONFLICT` on task evidence submission:
     - The Outbox halts automated retries for that task.
     - The task is flagged with `LocalSubmissionStatus = CONFLICT_DETECTED`.
     - The UI presents a clear resolution banner: `"Nhiệm vụ này đã bị thay đổi trên máy chủ (ví dụ: đã được phân công lại hoặc bị hủy bởi Quản lý). Bằng chứng đã chụp của bạn vẫn được lưu an toàn trên máy."`
     - Allows Staff to review the latest server state while giving the option to export/attach the local proof to an inquiry.

## Rationale
Option B eliminates both the duplicate submission risk and the silent overwrite hazard. It is the only option that preserves the integrity of the frozen state machine in an intermittently connected distributed mobile environment.

## Consequences
- **Positive:** Bulletproof network retries in cellular dead zones. Complete auditability. Clean conflict detection.
- **Negative:** Mobile client must handle `409 CONFLICT` in UI presentation. Backend requires an idempotency filter/interceptor.
- **Neutral:** Read operations (`GET`) remain standard without concurrency tokens.

## Security Impact
- Prevents replay attacks and double-spending/double-submission vulnerabilities.
- Idempotency keys are scoped strictly to the authenticated `actor.userId`.

## Offline / Reliability Impact
- Directly enables reliable, unattended Outbox background sync without manual user intervention.

## Contract Impact
- Update `@novyx/contracts`:
  - Add `version: number` to `TaskDto` and `TreeDto`.
  - Add optional `expectedVersion?: number` to `UpdateTaskProgressRequest`, `ReviewDecisionRequest`, `SubmitTaskEvidenceRequest`.
  - Add `idempotencyKey?: string` to mutating request types.
  - Add error code `ERROR_CODES.CONFLICT = 'CONFLICT'` with detail subtype `'STALE_VERSION'`.

## Migration / Compatibility
- Step 1: Update DTO contracts in `@novyx/contracts`.
- Step 2: In mobile, pass `idempotencyKey` generated via `crypto.randomUUID()` in Outbox Worker.

## Rejected Alternatives
- **Option A (Pessimistic Locking):** Incompatible with offline disconnected field workflows.
- **Option C (Last-Write-Wins):** Rejected due to risk of silent data loss and violation of state machine invariants.

## Open Questions
- What is the retention TTL for idempotency records on the server? (Recommended: 24 to 48 hours).

## Owner Decision Required
- [ ] **APPROVE** Option B (Optimistic Concurrency Control + Idempotency Keys).
- [ ] **REJECT** and mandate alternative option.
- [ ] **REQUEST_REVISION** with specific modifications.
