# Phase 13 Wave 5A: Mobile Durable Persistence + Outbox Foundation

## 1. Executive Summary & Entry Gate Verification

Wave 5A establishes the durable client-side reliability foundation required by:
- ADR 0008 (Mobile Offline Durable Storage Engine & Outbox Synchronization Architecture)
- ADR 0009 (Concurrency & Idempotency Strategy)
- QAS-OFFLINE-01 (Offline Evidence Buffering)
- QAS-OFFLINE-02 (State Recoverability After OS Kill)
- QAS-FAULT-01 (Fault Injection & Storage Durability)
- QAS-SEC-01 (Secure Credential Storage Isolation)

### Authorized Entry Gate
- **Entry HEAD**: `634edff8a6f8c147b60043ce73a3bdf6675d8f99`
- **Entry TREE**: `de3753a9aac9a1c07b82ea3c70e8a8abb50fd5af`
- **Branch**: `base-setup`
- **Working Tree**: Clean at entry.

---

## 2. Dependencies Added

In alignment with Section 5 (Dependency Policy) and Expo SDK 57:

### `apps/mobile/package.json`
- `expo-sqlite`: `~57.0.3` (structured local relational database)
- `expo-file-system`: `~57.0.7` (sandboxed persistent filesystem storage)
- `expo-crypto`: `~57.0.3` (SHA-256 cryptographic digest computation)
- `@react-native-community/netinfo`: `~12.0.1` (network state observation)

### Root `package.json` (devDependencies only)
- `better-sqlite3`: `^13.0.3` (deterministic in-memory SQLite execution for Node/Vitest test runner)
- `@types/better-sqlite3`: `^9.6.0`

---

## 3. SQLite Schema & Migration Strategy

### Version Tracking
- Utilizes SQLite's native `PRAGMA user_version` coupled with a `schema_migrations` ledger.
- Deterministic, sequentially ordered migrations without destructive drops or resets.
- Current Schema Version: `1` (`LATEST_SCHEMA_VERSION = 1`).

### Schema Tables (`apps/mobile/src/storage/database/migrations.ts`)

1. **`schema_migrations`**:
   - `version INTEGER PRIMARY KEY`
   - `name TEXT NOT NULL`
   - `applied_at TEXT NOT NULL`

2. **`cached_tasks`** (Server task projection):
   - `id TEXT PRIMARY KEY` (taskId)
   - `tree_id TEXT`
   - `task_type_id TEXT`
   - `task_type_name TEXT`
   - `status TEXT NOT NULL` (CanonicalTaskStatus: PENDING, IN_PROGRESS, BLOCKED, WAITING_REVIEW, REWORK_REQUIRED, COMPLETED, CANCELLED)
   - `assigned_staff_id TEXT`
   - `assigned_staff_name TEXT`
   - `deadline TEXT`
   - `version INTEGER NOT NULL DEFAULT 0`
   - `proof_profile TEXT`
   - `title TEXT`
   - `description TEXT`
   - `priority TEXT`
   - `raw_json TEXT` (Faithful JSON snapshot of TaskDto)
   - `updated_at TEXT NOT NULL`

3. **`local_drafts`** (Client-side draft metadata):
   - `task_id TEXT PRIMARY KEY REFERENCES cached_tasks(id) ON DELETE CASCADE`
   - `submission_status TEXT NOT NULL DEFAULT 'IDLE'` ('IDLE' | 'SAVED_DRAFT' | 'PENDING_SYNC')
   - `gps_lat REAL`, `gps_lng REAL`, `gps_distance_meters REAL`
   - `gps_verified INTEGER NOT NULL DEFAULT 0`
   - `gps_timestamp TEXT`
   - `qr_scanned_code TEXT`
   - `qr_verified INTEGER NOT NULL DEFAULT 0`
   - `qr_timestamp TEXT`
   - `location_exception_json TEXT`, `identity_exception_json TEXT`
   - `checklist_json TEXT`, `findings_json TEXT`, `notes TEXT`
   - `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`

4. **`local_evidence`** (Evidence file metadata):
   - `id TEXT PRIMARY KEY`
   - `task_id TEXT NOT NULL REFERENCES cached_tasks(id) ON DELETE CASCADE`
   - `stage TEXT NOT NULL` ('BEFORE' | 'AFTER' | 'COMPLETION' | 'CONDITION' | 'EXCEPTION')
   - `local_file_uri TEXT NOT NULL` (Persistent sandboxed URI)
   - `file_name TEXT NOT NULL`
   - `content_type TEXT NOT NULL`
   - `size_bytes INTEGER NOT NULL`
   - `sha256 TEXT NOT NULL` (Canonical 64-character lowercase hexadecimal hash)
   - `captured_at TEXT NOT NULL`
   - `is_persisted_in_sandbox INTEGER NOT NULL DEFAULT 1`
   - `sync_status TEXT NOT NULL DEFAULT 'IDLE'`
   - `created_at TEXT NOT NULL`

5. **`outbox_items`** (Durable FIFO queue):
   - `id TEXT PRIMARY KEY` (UUID)
   - `task_id TEXT NOT NULL REFERENCES cached_tasks(id) ON DELETE CASCADE`
   - `command_type TEXT NOT NULL` ('SubmitEvidence')
   - `payload_json TEXT NOT NULL` (Reconstructable SubmitEvidenceRequest JSON)
   - `idempotency_key TEXT NOT NULL` (UUIDv4)
   - `attempt_count INTEGER NOT NULL DEFAULT 0`
   - `sync_status TEXT NOT NULL DEFAULT 'IDLE'` ('IDLE' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED')
   - `last_error TEXT`
   - `error_classification TEXT` ('NETWORK' | 'SERVER_5XX' | 'VALIDATION' | 'CONFLICT' | 'FORBIDDEN' | 'AUTH')
   - `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`

6. **Indexes**:
   - `idx_outbox_fifo ON outbox_items (created_at ASC)`
   - `idx_outbox_sync ON outbox_items (sync_status)`
   - `idx_local_evidence_task ON local_evidence (task_id)`

---

## 4. Persistent Sandbox Evidence File Topology

### Sandboxed Storage Path
- Files reside under the OS application sandbox:
  `${FileSystem.documentDirectory}/evidence/${taskId}/${fileName}`
- Immediately moved or copied out of volatile camera cache (`cacheDirectory`) into sandbox storage when captured.
- Survives application process termination and device restarts.

### Content SHA-256 Invariant
- Canonical representation: 64-character lowercase hexadecimal SHA-256 (`/^[0-9a-f]{64}$/`).
- Calculated directly on file content bytes via `IEvidenceHasher` (Node test implementation and Expo native `expo-crypto` implementation).
- File names, timestamps, URIs, or asset IDs are NEVER used as hash values.

### Non-Destructive Retention Invariant
- Evidence photos and local metadata are NEVER prematurely deleted.
- Retention check function `canSafelyDeleteEvidence` returns `false` if:
  - `syncStatus === 'PENDING_SYNC' | 'SYNCING' | 'SYNC_FAILED'`
  - `localSubmissionStatus === 'PENDING_SYNC'`
  - Conflict or validation failure requires manual user action.
- Only terminal `SYNCED` items confirmed by authoritative server receipt may qualify for future garbage collection.

---

## 5. Strict Three-Dimension State Separation

The architecture enforces strict orthogonality across state dimensions:

| Dimension | Domain Authority | Allowed Values |
|---|---|---|
| `TaskStatus` | Authoritative Server | `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED` |
| `LocalSubmissionStatus` | Client Local | `IDLE`, `SAVED_DRAFT`, `PENDING_SYNC` |
| `SyncStatus` | HTTP Transport | `IDLE`, `SYNCING`, `SYNCED`, `SYNC_FAILED` |

### Critical Invariants:
- `PENDING_SYNC` is NEVER assigned to `TaskStatus`.
- `SYNCING` and `SYNC_FAILED` are NEVER assigned to `TaskStatus`.
- Offline submit sets `LocalSubmissionStatus = PENDING_SYNC`. Server `TaskStatus` remains `IN_PROGRESS` until the backend accepts evidence.
- Only authoritative server acceptance can transition `TaskStatus` to `WAITING_REVIEW`.

---

## 6. Durable FIFO Outbox & Idempotency Model

### Transactional Enqueue
`SqliteOutboxRepository.enqueueTransactional` executes inside an atomic SQLite transaction:
1. Validates that `Idempotency-Key` is NOT in the payload body.
2. Updates `local_drafts.submission_status = 'PENDING_SYNC'`.
3. Inserts a row into `outbox_items` with a freshly generated UUIDv4 `idempotencyKey`.
4. Leaves `cached_tasks.status` strictly unchanged.

### Idempotency Key Stability
- The `idempotencyKey` (UUIDv4) is generated ONCE at initial enqueue.
- Retries of the same outbox item reuse the exact same persisted key.
- Two distinct logical submissions receive different keys.
- Sent strictly via HTTP header `Idempotency-Key: <key>`, never in the JSON body.

### Serialized FIFO Execution
`OutboxCoordinator`:
- Mutual-exclusion lock ensures only one worker processes an outbox item at a time.
- Queries oldest eligible items first (`sync_status IN ('IDLE', 'SYNC_FAILED') ORDER BY created_at ASC LIMIT 1`).
- Transitions item through `SYNCING` -> `SYNCED` or `SYNC_FAILED`.

### Error Classification & Retry Policy
- `NETWORK` / `SERVER_5XX`: Retryable transport failures; worker retries upon reconnection.
- `VALIDATION` / `CONFLICT` / `FORBIDDEN` / `AUTH`: Non-retryable client/security failures; worker halts retries to prevent spinning and preserves evidence.

---

## 7. Device / Process-Kill Acceptance Procedure

The following procedure specifies manual verification on a physical device or emulator:

1. **Start Task**: Open mobile app, select assigned task, verify status `IN_PROGRESS`.
2. **Capture Evidence**: Capture before photo and scan tree QR code.
3. **Persist into Sandbox**: File is copied into `${FileSystem.documentDirectory}/evidence/${taskId}/before.jpg` and SHA-256 is computed.
4. **Offline Enqueue**: Disconnect device network (Airplane mode) and tap "Gửi duyệt".
5. **Verify Local State**: UI indicates `LocalSubmissionStatus = PENDING_SYNC`; server `TaskStatus` remains `IN_PROGRESS`.
6. **Simulate OS Kill**: Force-kill application process via Android Recents / App Settings.
7. **Relaunch**: Open application while still in Airplane mode.
8. **Verify Survival**: Draft state, local evidence photos, and outbox queue item survive intact.
9. **Restore Connectivity**: Disable Airplane mode; background worker triggers sequential dispatch.
10. **Reconciliation**: Server receives payload with stable `Idempotency-Key`, returns HTTP 201 with `TaskStatus = WAITING_REVIEW`; client updates task status to `WAITING_REVIEW` and marks outbox item `SYNCED`.

> **Status for Wave 5A**: Marked **NOT_RUN** on physical device in this wave. Verified deterministically in automated unit/integration tests (`tests/mobile/offline-durable-foundation.spec.ts`).

---

## 8. Automated Quality Gate Evidence

### Local Gate Results
| Check | Command | Result | Notes |
|---|---|---|---|
| Prettier Code Style | `npm run format:check` | **PASS** | All matched files formatted |
| ESLint | `npm run lint` | **PASS** | 0 errors, 0 warnings |
| Workspace Typecheck | `npm run typecheck` | **PASS** | 0 type errors across all 6 workspaces |
| Mobile Typecheck | `npm run typecheck --workspace @novyx/mobile` | **PASS** | 0 type errors in `@novyx/mobile` |
| Full Test Suite | `npm test` | **PASS** | 212 tests passed, 21 skipped |
| Git Diff Check | `git diff --check` | **PASS** | Clean diff |
| Android Bundle Sanity | `npm run mobile:export:android` | **PASS** | 852 modules bundled cleanly in 11.1s |
| npm Audit | `npm audit --omit=dev` | **WARN** | 24 upstream vulnerabilities in transitive Expo packages (known baseline) |

### Test Matrix (`tests/mobile/offline-durable-foundation.spec.ts`)
- **Assertion A**: `PENDING_SYNC` never appears in `TaskStatus` (P13W5A-N02) — **PASS**
- **Assertion B**: `SYNCING` / `SYNC_FAILED` never appear in `TaskStatus` (P13W5A-N03) — **PASS**
- **Assertion C**: Enqueue creates exactly one stable UUIDv4 idempotency key (P13W5A-P06) — **PASS**
- **Assertion D**: Retry of the same outbox item retains the same key (P13W5A-N05) — **PASS**
- **Assertion E**: Two separate logical submissions receive different keys — **PASS**
- **Assertion F**: `Idempotency-Key` is absent from `SubmitEvidenceRequest` body (P13W5A-N04) — **PASS**
- **Assertion G**: FIFO ordering is deterministic (`ORDER BY created_at ASC`) (P13W5A-P05) — **PASS**
- **Assertion H**: Failed/retryable item remains durable with classified error — **PASS**
- **Section 15**: Error classification accurately identifies retryable vs non-retryable errors — **PASS**
- **Assertion I**: Conflict/failure does NOT delete local evidence metadata or files (P13W5A-N09) — **PASS**
- **Assertion J**: Offline enqueue produces `PENDING_SYNC` without changing server `TaskStatus` (P13W5A-N10, P13W5A-P08) — **PASS**
- **Assertion K**: Migration runner is deterministic and version-aware (`PRAGMA user_version`) (P13W5A-P02) — **PASS**
- **Assertion L**: Auth credentials are NOT persisted in SQLite/outbox schema (P13W5A-N08, P13W5A-P10) — **PASS**
- **Assertion M**: Binary image data/Base64 is NOT persisted in SQLite payload fields (P13W5A-N06) — **PASS**
- **Recovery**: Simulates process restart: draft state, outbox, and evidence metadata survive — **PASS**

---

## 9. Assertions Checklist

### Hard Negative Assertions (All MUST be FALSE)
- [x] **P13W5A-N01**: Wave 4 source was redesigned -> **FALSE** (`apps/api/**` untouched).
- [x] **P13W5A-N02**: TaskStatus contains PENDING_SYNC -> **FALSE** (Strict separation enforced).
- [x] **P13W5A-N03**: TaskStatus contains SYNCING or SYNC_FAILED -> **FALSE** (Strict separation enforced).
- [x] **P13W5A-N04**: Idempotency-Key is stored inside SubmitEvidenceRequest body -> **FALSE** (Transport header only).
- [x] **P13W5A-N05**: A retry generates a new key for an existing outbox item -> **FALSE** (Reused from outbox record).
- [x] **P13W5A-N06**: Evidence binary is stored as Base64 in SQLite -> **FALSE** (Sandboxed filesystem only).
- [x] **P13W5A-N07**: Temporary camera/cache URI is treated as durable evidence storage -> **FALSE** (Copied to sandbox).
- [x] **P13W5A-N08**: Access/refresh credentials are stored in plaintext SQLite -> **FALSE** (SecureStore only).
- [x] **P13W5A-N09**: Failed sync deletes local evidence -> **FALSE** (Evidence retained on failure).
- [x] **P13W5A-N10**: Offline submit changes authoritative TaskStatus to WAITING_REVIEW -> **FALSE** (TaskStatus remains IN_PROGRESS).
- [x] **P13W5A-N11**: Network error automatically falls back to mock engine -> **FALSE** (No automatic failover).
- [x] **P13W5A-N12**: A destructive fixed photo GC policy was introduced -> **FALSE** (Deferred).
- [x] **P13W5A-N13**: Mobile UI was broadly redesigned -> **FALSE** (0 UI layout changes).
- [x] **P13W5A-N14**: apps/admin-web was created -> **FALSE** (Not created).
- [x] **P13W5A-N15**: Wave 5B or Wave 6 was automatically started -> **FALSE** (Locked).

### Hard Positive Assertions (All MUST be TRUE)
- [x] **P13W5A-P01**: `expo-sqlite` durable persistence foundation exists -> **TRUE**
- [x] **P13W5A-P02**: SQLite schema has explicit version/migration handling (`PRAGMA user_version`) -> **TRUE**
- [x] **P13W5A-P03**: Persistent sandbox evidence storage boundary exists -> **TRUE**
- [x] **P13W5A-P04**: Durable Outbox exists -> **TRUE**
- [x] **P13W5A-P05**: Outbox ordering is deterministic FIFO -> **TRUE**
- [x] **P13W5A-P06**: Idempotency-Key is stable across retries -> **TRUE**
- [x] **P13W5A-P07**: TaskStatus / LocalSubmissionStatus / SyncStatus are independent -> **TRUE**
- [x] **P13W5A-P08**: Offline enqueue produces PENDING_SYNC without changing server TaskStatus -> **TRUE**
- [x] **P13W5A-P09**: Local evidence survives sync failure at the persistence-model level -> **TRUE**
- [x] **P13W5A-P10**: Auth credentials remain SecureStore-only -> **TRUE**
- [x] **P13W5A-P11**: Legacy mobile path remains available for gradual migration -> **TRUE**
- [x] **P13W5A-P12**: Wave 4 remains frozen -> **TRUE**
- [x] **P13W5A-P13**: Wave 5B remains locked -> **TRUE**

---

## 10. Changed File Inventory

| File | Status | Description |
|---|---|---|
| `apps/mobile/package.json` | MODIFIED | Added `expo-sqlite`, `expo-file-system`, `expo-crypto`, `@react-native-community/netinfo` |
| `package.json` | MODIFIED | Added `better-sqlite3`, `@types/better-sqlite3` devDependencies |
| `package-lock.json` | MODIFIED | Lockfile updated |
| `apps/mobile/src/storage/database/types.ts` | NEW | Interfaces for `IDatabaseConnection`, `RunResult`, `MigrationStep` |
| `apps/mobile/src/storage/database/migrations.ts` | NEW | Version 1 migrations with `PRAGMA user_version` |
| `apps/mobile/src/storage/database/sqliteDatabase.ts` | NEW | `ExpoSqliteAdapter` and `BetterSqliteAdapter` |
| `apps/mobile/src/storage/evidence/evidenceHasher.ts` | NEW | SHA-256 byte hashing port (`NodeEvidenceHasher`, `ExpoEvidenceHasher`) |
| `apps/mobile/src/storage/evidence/evidenceFileStore.ts` | NEW | Persistent sandbox evidence store with non-destructive retention |
| `apps/mobile/src/storage/outbox/types.ts` | NEW | Orthogonal state dimension types, outbox types, error classifications |
| `apps/mobile/src/storage/outbox/stateSeparation.ts` | NEW | Assertions and dimension validator |
| `apps/mobile/src/storage/outbox/outboxRepository.ts` | NEW | `SqliteOutboxRepository` with transactional enqueue and FIFO ordering |
| `apps/mobile/src/storage/outbox/outboxCoordinator.ts` | NEW | Single-executor FIFO coordinator with mutex lock and retry classification |
| `apps/mobile/src/storage/task/mobileTaskRepository.ts` | NEW | SQLite-backed task caching, draft management, and session recovery |
| `apps/mobile/src/storage/index.ts` | NEW | Storage module barrel exports |
| `tests/mobile/offline-durable-foundation.spec.ts` | NEW | Automated test suite verifying assertions A through M |
| `docs/PHASE13-WAVE5A-OFFLINE-FOUNDATION.md` | NEW | Wave 5A documentation record |

---

## 11. Known Remaining Work for Wave 5B

Wave 5A established the durable persistence layer, file sandbox, outbox, and state machine foundation.
The following items remain strictly reserved for Wave 5B:
1. Production REST cutover for mobile networking (`EXPO_PUBLIC_DATA_SOURCE=rest`).
2. S3 / MinIO presigned URL upload pipeline for binary photos from sandbox.
3. Network observer integration (`NetInfo.addEventListener`) triggering `OutboxCoordinator.processAll()`.
4. Transitional facade gradual refactoring in `greenOpsService.ts`.
5. Role-based navigation correction and ProofProfile UI integration.
