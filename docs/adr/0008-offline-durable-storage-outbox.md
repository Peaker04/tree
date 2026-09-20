# ADR 0008: Mobile Offline Durable Storage Engine & Outbox Synchronization Architecture

## Status
PROPOSED

## Context
In the reconciled and frozen business baseline (Phase 0–10), Field Staff operate in urban parks, streets, and rural nurseries where cellular data connectivity (3G/4G) is frequently degraded or entirely lost.

The business baseline enforces two critical offline invariants:
1. **Three Orthogonal State Dimensions:**
   - `TaskStatus`: Authoritative server-side domain lifecycle (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`).
   - `LocalSubmissionStatus`: Local client lifecycle (`IDLE`, `SAVED_DRAFT`, `PENDING_SYNC`, `SYNCED`, `SYNC_FAILED`).
   - `SyncStatus`: Transport-level synchronization state (`IDLE`, `SYNCING`, `SYNCED`, `FAILED`).
2. **Offline Submission Rule:** When a field worker submits evidence while disconnected, `LocalSubmissionStatus` transitions to `PENDING_SYNC`. **Crucially, on the server, `TaskStatus` remains strictly `IN_PROGRESS`** until the server receives, validates, and accepts the evidence payload, at which point `TaskStatus` becomes `WAITING_REVIEW`.

In the current AS-IS mobile implementation (`apps/mobile/src/services/greenOpsService.ts`):
- All task data, trees, notifications, and drafts are kept in an **in-memory JavaScript object** (`let snapshot: AppData`).
- If the app is killed by the OS while the camera is active (a frequent occurrence on Android low-RAM devices, `QAS-OFFLINE-02`) or if the user exits the app while offline, **100% of newly collected evidence, checklist entries, and drafts are lost permanently**.
- There is no persistent Outbox queue, no retry backoff mechanism, and no durable storage engine configured.

## Frozen Business Drivers
- **Offline Data Loss Prevention (`DR-HARD-04`, `DR-MVP-04`):** Zero accepted field evidence or checklist input may be lost due to network dropouts or process termination.
- **Proof Profile Support:** Structured evidence for `CHANGE_PROOF`, `SERVICE_PROOF`, and `INSPECTION_PROOF` (Site Verification GPS/QR, condition photos, findings JSON, checklist items) must be transactionally preserved.
- **Strict Domain State Separation:** `PENDING_SYNC` must never be sent to or stored as a server `TaskStatus`.

## NFR / Quality Drivers
- **`QAS-OFFLINE-01` (Zero Data Loss Mid-Evidence):** Offline actions must be persisted locally in $< 100\text{ms}$; when the worker taps "Submit", the payload is enqueued into a durable Outbox with `LocalSubmissionStatus = PENDING_SYNC`.
- **`QAS-OFFLINE-02` (State Recoverability After OS Kill):** If Android terminates the app process during photo capture, on relaunch the session and task draft must be restored from durable storage in $\le 2\text{s}$.
- **Storage Durability & File Integrity:** Binary photo files must not be stored as Base64 strings in database rows; they must reside in persistent application sandbox storage (`expo-file-system`) with local URIs referenced by structured database records.

## Decision Question
What local storage engine, binary management strategy, and Outbox synchronization architecture should be adopted in `apps/mobile` to fulfill the zero-data-loss and offline-resilience NFRs?

## Options Considered

### Option A: Pure Key-Value Storage (AsyncStorage or MMKV)
- **Description:** Store entire application snapshots or serialized JSON blobs in MMKV or React Native AsyncStorage. Outbox is an array of serialized JSON objects in a single key.
- **Advantages:**
  - Simple key-value API; fast read/write for small simple blobs.
  - MMKV is extremely fast for simple key-value lookups.
- **Disadvantages:**
  - No transactional ACID integrity across related entities (tasks, evidence items, checklist records, outbox queue entries). A crash mid-write can corrupt the entire JSON blob.
  - Inefficient querying: Filtering tasks by status or staff requires deserializing the entire multi-megabyte JSON database into JavaScript memory on every screen render.
  - Outbox concurrency hazards: Updating outbox status while adding new draft items risks race conditions and data overwrites.
- **Risks:** High risk of state corruption during sudden OS process kills; memory spikes on low-end Android devices.
- **Migration Impact:** Low implementation effort, but high long-term defect rate.
- **Operational Impact:** Low.

### Option B: Relational SQLite Engine (`expo-sqlite`) for Metadata & Outbox + Sandbox Filesystem for Photos [RECOMMENDED]
- **Description:**
  1. **Structured Data & Outbox:** Use `expo-sqlite` (official Expo SDK 57 SQLite module) with a structured relational schema:
     - `tasks` (id, task_type, proof_profile, status, assigned_staff_id, tree_id, created_at, updated_at, version, draft_state)
     - `task_evidence` (id, task_id, stage, local_file_uri, remote_url, captured_at, sync_status)
     - `checklist_items` (id, task_id, text, done)
     - `outbox_queue` (id, task_id, command_type, payload_json, idempotency_key, attempt_count, last_error, status, created_at)
  2. **Binary Evidence Files:** Photos captured via `expo-camera` / `expo-image-picker` are immediately copied from temporary cache to persistent sandbox directory: `file://${FileSystem.documentDirectory}/evidence/${taskId}/${filename}.jpg`.
  3. **Outbox Worker:** A persistent, sequential FIFO synchronization worker that watches network connectivity via `@react-native-community/netinfo`, processes `outbox_queue` entries, uploads binary multipart payloads, and updates local state upon server acceptance.
- **Advantages:**
  - **ACID Transactional Guarantees:** Updating task draft state and enqueuing an outbox item occurs inside a single SQLite transaction (`db.withTransactionSync`). Impossible to corrupt state mid-crash.
  - **Fulfills `QAS-OFFLINE-02`:** Every photo capture and checklist check is committed immediately to SQLite and permanent disk storage. OS kill causes zero data loss.
  - **Optimized Memory & Fast Queries:** Relational SQL queries (`SELECT * FROM tasks WHERE status = 'IN_PROGRESS'`) load only the needed rows, avoiding massive JSON deserialization overhead on 3GB RAM Android devices.
  - **Clean Outbox State Machine:** Outbox items have distinct retry counts, exponential backoff, error logs, and idempotency keys.
  - **First-Class Expo SDK 57 Support:** `expo-sqlite` is a first-class, fully maintained Expo native library with synchronous and asynchronous prepared statement support.
- **Disadvantages:**
  - Requires maintaining SQL migration scripts (`db.execSync('CREATE TABLE IF NOT EXISTS...')`).
  - Slightly higher initial setup overhead than a simple key-value store.
- **Risks:** Database migration failures between app updates (mitigated by a strict versioned migration runner).
- **Migration Impact:** Replaces in-memory `snapshot` in `greenOpsService.ts` with a `SqliteTaskRepository` and `SqliteOutboxQueue`.
- **Operational Impact:** None on server; massive reliability boost on client.

### Option C: WatermelonDB or Realm
- **Description:** Use a heavyweight reactive mobile ORM (WatermelonDB or Realm) with built-in sync adapters.
- **Advantages:** Automated observable bindings to React components.
- **Disadvantages:**
  - Heavy native dependencies, complex native compilation, and frequent Expo version incompatibilities.
  - Pre-supposes a specific server-side synchronization protocol (e.g., Watermelon sync protocol or Realm Object Server), clashing with the accepted contract-first REST architecture (`ADR 0003`).
- **Risks:** High risk of breaking during Expo SDK upgrades; heavy build footprint.
- **Migration Impact:** Severe; introduces invasive decorator-based model classes.
- **Operational Impact:** May require proprietary or custom backend synchronization endpoints.

## Proposed Decision
**Adopt Option B: Relational SQLite Engine (`expo-sqlite`) for Structured Data & Outbox + Sandbox Filesystem for Binary Photos.**

1. **Storage Topology:**
   - **`expo-sqlite`:** Manages relational entities (`tasks`, `trees`, `task_evidence`, `checklist_items`, `outbox_queue`, `app_cache_metadata`).
   - **`expo-file-system` (`documentDirectory`):** Stores permanent binary evidence images.
   - **`expo-secure-store`:** Stores authentication credentials (`AuthSession`) per `ADR 0006`.
   - **MMKV (Optional/Secondary):** Only for non-critical transient UI preferences (e.g., last selected filter chip).
2. **Outbox Synchronization Lifecycle:**
   - *Enqueue:* Tapping "Gửi duyệt" bundles the evidence metadata, writes local URIs, generates a UUIDv4 `idempotencyKey`, and writes an `outbox_queue` record (`status = 'PENDING_SYNC'`) in a single database transaction.
   - *UI State:* UI immediately reflects `LocalSubmissionStatus = PENDING_SYNC` with amber indicator.
   - *Worker Execution:* When network is online, Outbox Worker reads the next pending queue item:
     1. Uploads multipart binary photos and metadata to `POST /v1/tasks/:id/evidence` with `Idempotency-Key` header.
     2. On HTTP 200/201: Worker updates local `Task.status = WAITING_REVIEW`, `LocalSubmissionStatus = SYNCED`, marks outbox item `COMPLETED`, and deletes the outbox entry.
     3. On HTTP 4xx (Validation / SoD / Precondition error): Worker sets `LocalSubmissionStatus = SYNC_FAILED`, logs exact error details, and halts retry to prevent server spamming.
     4. On HTTP 5xx / Network Timeout: Worker increments `attemptCount`, calculates exponential backoff ($2^n \times 1000\text{ms}$ up to 60s), and leaves item in `PENDING_SYNC` for automatic retry.

## Rationale
Option B directly satisfies both `QAS-OFFLINE-01` and `QAS-OFFLINE-02` with mathematically proven transactional ACID boundaries. It avoids the catastrophic data loss of the AS-IS in-memory snapshot while avoiding the vendor lock-in and native build instability of heavyweight sync ORMs.

## Consequences
- **Positive:** Zero data loss during network drops or OS kills. Predictable, auditable Outbox queue. Low memory consumption on budget devices.
- **Negative:** Schema migrations must be authored and tested as domain contracts evolve.
- **Neutral:** Binary file cleanup policies must be implemented (purge local photos after task reaches terminal `COMPLETED` state and photos are confirmed on remote object storage).

## Security Impact
- Local database file resides in application-private storage, protected by Android/iOS sandboxing.
- Sensitive credentials remain isolated in `expo-secure-store`, not stored in plaintext SQLite.

## Offline / Reliability Impact
- Resolves `AR-11-02` (in-memory snapshot data loss).
- Guarantees that field workers never lose completed work or photos.

## Contract Impact
- Adds `idempotencyKey: string` to `SubmitTaskEvidenceRequest` and standardizes `Idempotency-Key` HTTP header.

## Migration / Compatibility
- Transition `greenOpsService.ts` from reading/writing in-memory `snapshot` variable to querying `LocalDatabaseService` backed by `expo-sqlite`.

## Rejected Alternatives
- **Option A (Pure MMKV/AsyncStorage JSON blobs):** Rejected due to lack of ACID transactions and risk of JSON corruption during process kill.
- **Option C (WatermelonDB / Realm):** Rejected due to build fragility, heavy footprint, and protocol mismatch with REST baseline.

## Open Questions
1. What is the local photo retention period after confirmed server sync? (Recommended: Retain for 7 days post-completion, then garbage-collect to conserve device disk space).

## Owner Decision Required
- [ ] **APPROVE** Option B (`expo-sqlite` Relational Outbox + Sandbox Filesystem).
- [ ] **REJECT** and mandate alternative option.
- [ ] **REQUEST_REVISION** with specific modifications.
