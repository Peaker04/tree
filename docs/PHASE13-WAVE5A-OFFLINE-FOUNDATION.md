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
- **Integrity Correction HEAD**: `613e97fc0958768004dcd8f542e4278c88cec491`
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
- `better-sqlite3`: `^13.0.3` (deterministic SQLite execution on memory and disk files for Node/Vitest test runner)
- `@types/better-sqlite3`: `^9.6.0`

---

## 3. SQLite Schema & Migration Strategy

### Version Tracking
- Utilizes SQLite's native `PRAGMA user_version` coupled with a `schema_migrations` ledger.
- Deterministic, sequentially ordered migrations without destructive drops or resets.
- Current Schema Version: `2` (`LATEST_SCHEMA_VERSION = 2`).

### Schema Migrations (`apps/mobile/src/storage/database/migrations.ts`)

- **Migration 1 (`initial_offline_schema`)**:
  - `schema_migrations`: tracks applied versions and timestamps.
  - `cached_tasks`: projection of server task state.
  - `local_drafts`: client draft state referencing `cached_tasks` via `ON DELETE RESTRICT`.
  - `local_evidence`: metadata referencing `cached_tasks` via `ON DELETE RESTRICT`.
  - `outbox_items`: outbox records referencing `cached_tasks` via `ON DELETE RESTRICT`.
  - Indexes: `idx_outbox_fifo`, `idx_outbox_sync`, `idx_local_evidence_task`.
- **Migration 2 (`remove_destructive_cascade_fk`)**:
  - Eliminates any lingering `ON DELETE CASCADE` path by migrating `local_drafts`, `local_evidence`, and `outbox_items` to `ON DELETE RESTRICT`.
  - Guarantees that cache maintenance or task purging can never silently delete unsynchronized evidence, drafts, or outbox records at the database engine level.

---

## 4. Exact-Byte SHA-256 & Persistent Sandbox Storage

### Exact-Byte Content Hash Contract
- Canonical representation: 64-character lowercase hexadecimal SHA-256 (`/^[0-9a-f]{64}$/`).
- Invariant: `client SHA-256 == SHA-256 of exact persisted local file bytes == server SHA-256 after upload`.
- Pure byte decoding: `base64ToUint8Array` decodes Base64 payloads into exact `Uint8Array` bytes without using `atob()` or JavaScript binary strings.
- Native hashing: `ExpoEvidenceHasher` passes the raw `Uint8Array` buffer to `Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bufferSource)`.
- Test vector validation: Verified using byte sequence `00 01 7f 80 ff 10 c3 a9` (containing bytes $\ge \text{0x80}$), producing reference digest `7e34c09ae4313a57257abb2ebe1276c47d9ad0f2e34f0d52d0fb199ed161817f` identical in both Node and conversion path.

### Platform-Neutral Sandbox Storage
- Files reside under the OS application sandbox: `${FileSystem.documentDirectory}/evidence/${taskId}/${fileName}`.
- If `documentDirectory` is unavailable, an explicit infrastructure error is thrown. No hardcoded Android `/data/user/0/` or iOS paths exist.
- Non-destructive retention rule (`canSafelyDeleteEvidence` invariant): Local evidence is never deleted if status is `PENDING_SYNC`, `SYNCING`, `SYNC_FAILED`, or if in conflict.

---

## 5. Strict State Dimension Separation

| Dimension | Domain Authority | Allowed Values |
|---|---|---|
| `TaskStatus` | Authoritative Server | `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED` |
| `LocalSubmissionStatus` | Client Local | `IDLE`, `SAVED_DRAFT`, `PENDING_SYNC` |
| `SyncStatus` | HTTP Transport | `IDLE`, `SYNCING`, `SYNCED`, `SYNC_FAILED` |

- `PENDING_SYNC`, `SYNCING`, and `SYNC_FAILED` are strictly client/transport states and NEVER appear in `TaskStatus`.
- Offline submit sets `LocalSubmissionStatus = PENDING_SYNC`. Authoritative server `TaskStatus` remains `IN_PROGRESS` until the server accepts `SubmitEvidence`.

---

## 6. Durable Outbox, Crash Recovery, & Retry Policy

### Atomic Transactional Enqueue
`executeOfflineSubmission` orchestrates offline intent:
1. Copies/moves binary files to sandbox storage and computes exact-byte SHA-256.
2. In ONE atomic SQLite transaction on `db.withTransactionAsync`:
   - Updates `local_drafts.submission_status = 'PENDING_SYNC'`.
   - Inserts `local_evidence` metadata rows with sandbox URIs and SHA-256 checksums.
   - Inserts `outbox_items` row with stable UUIDv4 `idempotencyKey`.
3. If the SQLite transaction fails, sandbox files remain safely as orphans and are NEVER deleted.

### Crash Recovery from SYNCING
- `recoverInterruptedSyncs()`: Invoked automatically during database initialization (`openAppDatabase`).
- Atomically converts interrupted in-flight `SYNCING` records to `SYNC_FAILED` with `error_classification = 'NETWORK'` and `last_error = 'INTERRUPTED_SYNC_RECOVERY'`.
- Preserves outbox ID, exact Idempotency-Key, payload, draft, and evidence files.

### Non-Retryable Error Exclusion
- `getNextEligibleItem()` selects only items that are `IDLE` or `SYNC_FAILED` with retryable classifications: `NETWORK` or `SERVER_5XX`.
- Non-retryable failure classes (`VALIDATION`, `CONFLICT`, `FORBIDDEN`, `AUTH`) remain durably stored for user resolution and are NOT auto-picked, preventing infinite retry loops.

### CSPRNG UUID Generation
- Uses `generateSecureUuid()` from `apps/mobile/src/storage/utils/uuid.ts` backed by `crypto.randomUUID()` / `expo-crypto.randomUUID()`.
- Zero `Math.random()` fallbacks.

---

## 7. Device & Process-Kill Verification Strategy

### Distinction of Verification Environments:
- **`SQLITE_TRANSACTION_ROLLBACK`**: **PASS**
  - Proven via real SQLite transaction failure (`5A-R01 / W5A-F12`).
  - An internal statement failure after `local_drafts` and `local_evidence` writes aborts before commit, executing a real SQLite rollback to savepoint.
  - Verified that all partial writes are rolled back together while the pre-written sandbox binary file remains safely preserved.
- **`EVIDENCE_PATH_COLLISION_SAFETY`**: **PASS**
  - Proven via same-filename regression test (`5A-R02`).
  - Durable sandbox file identity incorporates the unique evidence UUID (`<evidenceId>_<sanitizedOriginalFileName>`).
  - Identical camera filenames (`photo.jpg`) for the same task produce separate sandbox URIs, separate IDs, and independent SHA-256 byte hashes without overwriting existing files.
  - Input filename hints are sanitized to prevent directory traversal (`..`, slashes).
- **`SUPPLIED_IDEMPOTENCY_UUIDV4`**: **PASS**
  - Proven via strict RFC 4122 UUIDv4 validation (`5A-R03`).
  - Caller-supplied keys are validated before any database mutation. Valid UUIDv4 keys are accepted unchanged; malformed strings, UUIDv1, and UUIDv5 are rejected immediately.
  - Generated keys strictly use CSPRNG (`generateSecureUuid()`).
- **`NODE_SQLITE_REOPEN_CHARACTERIZATION`**: **PASS**
  - Verified on disk using a temporary SQLite file via `createDiskTestDatabase`.
  - Data was written, process crash was simulated by closing connection, new connection was opened to the same file, `recoverInterruptedSyncs()` ran, and all rows and Idempotency-Keys were recovered intact.
- **`NATIVE_DEVICE_PROCESS_KILL`**: **NOT_RUN**
  - Physical Android/iOS process-kill and relaunch requires physical device/emulator testing and remains scheduled for physical device test suites.
- **`NATIVE_EXPO_SHA256_RUNTIME`**: **NOT_RUN**
  - Verified in Node via byte conversion and reference digest tests; native device execution remains marked NOT_RUN.

---

## 8. Automated Quality Gate Evidence

### Local Gate Results
| Check | Command | Result | Notes |
|---|---|---|---|
| Prettier Code Style | `npm run format:check` | **PASS** | 100% matched files compliant |
| ESLint | `npm run lint` | **PASS** | 0 errors, 0 warnings |
| Workspace Typecheck | `npm run typecheck` | **PASS** | 0 type errors across all 6 workspaces |
| Mobile Typecheck | `npm run typecheck --workspace @novyx/mobile` | **PASS** | 0 type errors in `@novyx/mobile` |
| Full Test Suite | `npm test` | **PASS** | 222 passed, 21 skipped |
| Git Diff Check | `git diff --check` | **PASS** | Clean diff |
| Android Bundle Sanity | `npm run mobile:export:android` | **PASS** | 854 modules bundled cleanly |
| npm Audit | `npm audit --omit=dev` | **WARN** | 24 upstream vulnerabilities in transitive packages (baseline) |

### Integrity Correction Test Matrix (`tests/mobile/offline-durable-foundation.spec.ts`)
- **W5A-F01**: Exact-byte SHA-256 test vector includes bytes $\ge \text{0x80}$ — **PASS**
- **W5A-F02**: Same byte vector produces Node reference digest and identical decoded bytes — **PASS**
- **W5A-F03**: No `digestStringAsync` binary-string hashing in evidenceHasher — **PASS**
- **W5A-F04**: Persisted `SYNCING` item recovered after real DB disk close/reopen — **PASS**
- **W5A-F05**: Recovered item preserves Idempotency-Key across close/reopen — **PASS**
- **W5A-F06**: `NETWORK` failure is auto-eligible for retry — **PASS**
- **W5A-F07**: `SERVER_5XX` failure is auto-eligible for retry — **PASS**
- **W5A-F08**: `VALIDATION` failure is NOT auto-eligible — **PASS**
- **W5A-F09**: `CONFLICT` failure is NOT auto-eligible — **PASS**
- **W5A-F10**: `FORBIDDEN` failure is NOT auto-eligible — **PASS**
- **W5A-F11**: `AUTH` failure is NOT auto-eligible — **PASS**
- **5A-R01 / W5A-F12**: Actual internal SQLite rollback rolls back draft + evidence metadata on failure before commit — **PASS**
- **5A-R02**: Collision-safe durable evidence identity & same-filename regression without overwrite — **PASS**
- **5A-R03**: Strict RFC 4122 UUIDv4 idempotency key validation (rejects malformed, v1, v5) — **PASS**
- **W5A-F13**: Cached task deletion cannot cascade-delete pending evidence/outbox (`ON DELETE RESTRICT`) — **PASS**
- **W5A-F14**: Source contains no hardcoded Android `/data/user/0/` fallback — **PASS**
- **W5A-F15**: UUID generation uses CSPRNG and remains stable on retry — **PASS**

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

## 10. Changed File Inventory (Wave 5A Correction)

| File | Status | Description |
|---|---|---|
| `apps/mobile/src/storage/utils/uuid.ts` | NEW | CSPRNG UUIDv4 generator without Math.random fallback |
| `apps/mobile/src/storage/outbox/submissionService.ts` | NEW | Atomic offline submission service covering draft, evidence metadata, outbox |
| `apps/mobile/src/storage/evidence/evidenceHasher.ts` | MODIFIED | Exact-byte SHA-256 via Crypto.digest and byte-level Base64 decoding |
| `apps/mobile/src/storage/evidence/evidenceFileStore.ts` | MODIFIED | Removed Android fallback path; uses CSPRNG UUID |
| `apps/mobile/src/storage/database/migrations.ts` | MODIFIED | Added Migration 2 (schema version 2) with ON DELETE RESTRICT |
| `apps/mobile/src/storage/database/sqliteDatabase.ts` | MODIFIED | Added createDiskTestDatabase and recoverInterruptedSyncs on startup |
| `apps/mobile/src/storage/outbox/outboxRepository.ts` | MODIFIED | Added recoverInterruptedSyncs, filtered out non-retryable auto-retries |
| `apps/mobile/src/storage/outbox/types.ts` | MODIFIED | Added evidenceFiles to EnqueueSubmitEvidenceParams |
| `apps/mobile/src/storage/index.ts` | MODIFIED | Exported submissionService and uuid |
| `tests/mobile/offline-durable-foundation.spec.ts` | MODIFIED | Added tests W5A-F01 through W5A-F15 |
| `docs/PHASE13-WAVE5A-OFFLINE-FOUNDATION.md` | MODIFIED | Updated documentation record |
