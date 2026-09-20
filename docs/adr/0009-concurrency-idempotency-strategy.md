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
- State-mutating requests have NO idempotency key mechanism.
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

### Option B: Command Payload OCC (`expectedVersion`) + Header-Based Idempotency Keys [RECOMMENDED]
- **Description:**
  1. **Normalized Concurrency Contract (Command Payload `expectedVersion`):**
     - Add integer `version: number` to all mutating aggregates (`TaskDto`, `TreeDto`, `PolicyDto`).
     - Every mutating command DTO (e.g., `SubmitTaskEvidenceRequest`, `ReviewDecisionRequest`, `ReassignTaskRequest`, `CancelTaskRequest`) includes an explicit `expectedVersion: number`.
     - *Why command payload over HTTP If-Match:* The project REST API baseline (`ADR 0003`) is command-oriented (`POST /v1/tasks/:id/evidence`, `POST /v1/tasks/:id/review`) rather than full-resource HTTP PUT replacements. Using `expectedVersion` directly in the command payload provides type-safe Zod schema validation (`ADR 0010`) and maps cleanly to the project-standard `409 CONFLICT` (`STALE_VERSION`), avoiding the RFC 9110 header semantics (which mandate 412 Precondition Failed).
     - Server executes atomic update: `UPDATE tasks SET ..., version = version + 1 WHERE id = :id AND version = :expectedVersion`.
     - If rows affected is 0: Server rejects with `409 CONFLICT` and error code `CONFLICT: STALE_VERSION`, returning the current authoritative server version in the error details.
  2. **Command Idempotency via Client-Generated UUID:**
     - All state-transitioning and creation requests require an `Idempotency-Key: <UUIDv4>` HTTP header (also mirrored in request payload for offline outbox tracking).
     - *Industry Standard Reference:* Follows the widely used API design pattern originating from the former IETF draft convention (`draft-ietf-httpapi-idempotency-key-header`, now expired, but universally adopted by major API platforms like Stripe and AWS).
     - Backend maintains an `idempotency_records` table: `(idempotency_key, actor_id, request_path, request_hash, status, response_code, response_body, created_at, expires_at)`.
     - *Identical key & payload within retention horizon:* Server replays cached response without re-executing business logic.
     - *Identical key with different payload:* Server rejects with `422 UNPROCESSABLE_ENTITY` (`VALIDATION_FAILED: IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`).
- **Advantages:**
  - **Zero Lost Updates:** If a Manager reassigns a task while Staff is offline, Staff's submission detects the version mismatch (`409 CONFLICT`), preventing accidental data corruption while preserving the Staff's local evidence draft in SQLite.
  - **Safe Automated Retries:** Mobile Outbox can aggressively retry network requests after timeouts without fear of duplicate tasks, double approvals, or duplicate audit events.
  - **Single Consistent Concurrency Model:** Avoids mixing header-based and body-based concurrency controls.
- **Disadvantages:**
  - Requires clients to handle `409 CONFLICT` gracefully.
  - Backend must manage an idempotency cache/table with TTL cleanup.
- **Risks:** Negligible; standard distributed architecture pattern.
- **Migration Impact:** Contract additions (`version`, `expectedVersion`, `idempotencyKey`).
- **Operational Impact:** Small table with indexed expiration; minimal overhead.

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
**Adopt Option B: Command Payload OCC (`expectedVersion`) + Header-Based Idempotency Keys.**
*Recommendation Confidence: HIGH (standard, battle-tested distributed pattern).*

1. **Entity Versioning & Mutation Contracts:**
   - Add `version: number` to `TaskDto`, `TreeDto`, and governance aggregates.
   - All state-mutating request schemas in `@novyx/contracts` mandate `expectedVersion: number`.
   - On concurrency mismatch, server returns HTTP `409 CONFLICT` with:
     ```json
     {
       "success": false,
       "error": {
         "code": "CONFLICT",
         "message": "Task has been modified by another operation",
         "details": { "subtype": "STALE_VERSION", "currentVersion": 5, "expectedVersion": 4 }
       }
     }
     ```
2. **Idempotency Standards & Retention Horizon:**
   - All mutating REST requests require header `Idempotency-Key: <UUIDv4>`.
   - The mobile Outbox Worker generates the key upon draft finalization and preserves it through all retries.
   - **Retention Horizon Rule (Parameter Subject to Measurement):** The server idempotency record retention window must be configured to be **strictly greater than or equal to the maximum expected offline outbox retry horizon** (proposed baseline: 72 hours, subject to field operational measurement). An idempotency record must NEVER expire while a valid offline outbox item could still legitimately retry!
3. **Conflict Handling on Mobile Client:**
   - When the Outbox Worker receives `409 CONFLICT`:
     - The outbox halts automated retries for that item.
     - Transport state updates to `SyncStatus = SYNC_FAILED` with `syncFailureReason = 'CONFLICT'`.
     - **Authoritative `TaskStatus` remains `IN_PROGRESS`** (preserving local field evidence).
     - UI displays a resolution banner: `"Nhiệm vụ đã được cập nhật trên máy chủ (ví dụ: đã phân công lại hoặc hủy). Bằng chứng thực địa của bạn vẫn được lưu an toàn trên máy."`

## Rationale
Option B eliminates both duplicate submissions and silent overwrite hazards. Selecting `expectedVersion` in the command payload aligns perfectly with command-oriented REST and Zod contract validation.

## Consequences
- **Positive:** Network retries in cellular dead zones are safe and idempotent. Lost updates are impossible. Complete audit trail integrity.
- **Negative:** Mobile client must handle `409 CONFLICT` in UI presentation. Backend requires an idempotency filter/interceptor.
- **Neutral:** Read operations (`GET`) remain standard without version checks.

## Security Impact
- Prevents replay attacks and double-submission vulnerabilities.
- Idempotency keys are scoped strictly to the authenticated `actor.userId`.

## Offline / Reliability Impact
- Directly enables reliable, unattended Outbox background sync without manual user intervention.

## Contract Impact
- Update `@novyx/contracts`:
  - Add `version: number` to `TaskDto` and `TreeDto`.
  - Add `expectedVersion: number` to `SubmitTaskEvidenceRequest`, `ReviewDecisionRequest`, `ReassignTaskRequest`, `CancelTaskRequest`.
  - Add `idempotencyKey?: string` to mutating request schemas.
  - Standardize error subtype `STALE_VERSION` under `ERROR_CODES.CONFLICT`.

## Migration / Compatibility
- Step 1: Update DTO contracts in `@novyx/contracts`.
- Step 2: In mobile, pass `idempotencyKey` generated via `crypto.randomUUID()` in Outbox Worker.

## Rejected Alternatives
- **Option A (Pessimistic Locking):** Incompatible with offline disconnected field workflows.
- **Option C (Last-Write-Wins):** Rejected due to risk of silent data loss and violation of state machine invariants.

## Open Questions
1. What is the maximum expected offline horizon in remote forestry regions to finalize the idempotency TTL? (Proposed baseline: 72 hours; to be verified during operational testing).

## Owner Decision Required
- [ ] **APPROVE** Option B (Command Payload OCC + Header-Based Idempotency Keys).
- [ ] **REJECT** and mandate alternative option.
- [ ] **REQUEST_REVISION** with specific modifications.
