# PHASE 13 — WAVE 4 OPERATIONAL DOMAIN EVIDENCE

**Document Purpose**: Authoritative factual evidence record for Wave 4 implementation of NOVYX GreenOps.
**Status**: IMPLEMENTED / VERIFIED IN REMOTE CI
**Wave 5**: LOCKED (DO NOT START)

---

## 1. ENTRY GATES & REPOSITORY BASELINE

- **Authorized Entry Commit**: `0bd7cc95bd8700e2f0fca1a2d96317ff68d65114`
- **Authorized Entry Tree**: `810f82dd0627213dae766c063d950b7f7dd0d0a5`
- **Wave 4 Implementation Commit**: `a462e8fcd1f82f841ad63af33626a43020295143`
- **Wave 4 CI Verified Commit**: `346db348687b4bad4311c65bda8739c346d28e50`
- **Wave 4 CI Verified Tree**: `4a2ca2f347046c043effa591a0436eba110f46c9`
- **Branch**: `base-setup`
- **Node Version**: v22.14.0
- **NPM Version**: 10.9.2
- **Pre-change Baseline Tests**: 151 passed, 9 skipped (160 total across 12 test suites)
- **Pre-change Vulnerabilities**: 24 upstream vulnerabilities recorded as WARN (no fix executed per rule).

---

## 2. MODULE TOPOLOGY & CANONICAL BOUNDED CONTEXTS (Section 4)

Exactly five logical bounded contexts are active inside `apps/api/src/modules/`:

1. `work-management`: Task Aggregate Root (7 canonical states), Evidence Attempts history, Field Issues, Reviews, S3 Object Storage Port, Idempotency & OCC persistence.
2. `tree-asset-registry`: Tree aggregate governance (coordinates, QR code, master data, retirement) and CareHistory derived projection.
3. `policy-template-governance`: TaskType catalog, versioned Proof Policy mappings, and centrally governed Checklist Templates.
4. `audit-compliance`: Append-only audit trail with DB-engine denial of UPDATE/DELETE/TRUNCATE.
5. `iam`: Tier-2 authentication gate, session repository, user accounts, and role checking.

**Negative Verification (P13W4-N01)**:
- NO sixth bounded context introduced.
- Rejected names: `tree-asset`, `policy-governance`, `operational-domain`, `evidence-service`.

---

## 3. RELATIONAL PERSISTENCE & MIGRATION (Sections 34, 35)

- **Migration File**: `apps/api/src/infrastructure/persistence/migrations/0002_operational_domain.sql`
- **Applied On Top Of**: `0000_init.sql`, `0001_iam_security_foundation.sql` (additive, non-destructive).
- **New Tables Provisioned** (12 tables):
  1. `trees`: Master tree registry with OCC `version`, unique `qr_code`, coordinates, retirement metadata.
  2. `task_types`: Catalog of operational task types with active status.
  3. `proof_policy_versions`: Immutable versioned proof profile mappings per task type.
  4. `checklist_template_versions`: Centrally governed checklist templates per task type.
  5. `manager_operational_scopes`: PostgreSQL-backed scope mapping for Operations Managers (`AUTHORIZED_OPERATIONAL_SCOPE`).
  6. `tasks`: 7-state task aggregate with immutable `tree_id`, OCC `version`, policy snapshotting.
  7. `evidence_objects`: Metadata linking S3-compatible binary objects with task and uploader identity.
  8. `evidence_attempts`: Multi-version submission history preserving historical authorship.
  9. `field_issues`: Origin record for BLOCKED task status with photo reference.
  10. `task_reviews`: Review outcome records preserving reviewer, decision, exception, and targeted rework details.
  11. `care_histories`: Read-only derived projection populated ONLY for COMPLETED tasks.
  12. `idempotency_records`: Actor-scoped HTTP mutation response cache mapped to `(actor_id, idempotency_key)` with SHA-256 request fingerprint.
- **Rollback Strategy**:
  - Additive non-destructive migration.
  - Recovery: Drop Wave-4 tables if rollback is mandated without affecting Wave 0–3 IAM or audit tables.

---

## 4. CANONICAL TASK LIFECYCLE & INVARIANTS (Sections 5, 6, 7, 8, 9, 10, 15, 17)

### 4.1 Canonical States (Section 5)
Exactly 7 canonical states:
`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`.
No `DRAFT`, `ASSIGNED`, `SUBMITTED`, `APPROVED`, `REJECTED`.

### 4.2 State Transitions (Section 6)
- `CreateTask` -> `PENDING` (Manager with scope)
- `StartTask` -> `IN_PROGRESS` (Staff only, only from `PENDING`)
- `ReportFieldIssue` -> `BLOCKED` (Staff only, only from `IN_PROGRESS`)
- `ResumeBlockedTask` -> `IN_PROGRESS` (Manager in scope, same staff continues)
- `ReassignTask` -> `PENDING` (Manager in scope; allowed ONLY from `PENDING` or `BLOCKED` — Case B DR-MVP-05)
- `SubmitEvidence` -> `WAITING_REVIEW` (Staff only, server validates proof/verification)
- `RequestRework` -> `REWORK_REQUIRED` (Manager in scope)
- `ResubmitRework` -> `WAITING_REVIEW` (Staff only, new attempt created, old retained)
- `ApproveTask` -> `COMPLETED` (Manager in scope, CareHistory created)
- `ApproveWithException` -> `COMPLETED` (Manager in scope, CareHistory created with exception flag)
- `CancelTask` -> `CANCELLED` (Manager only, allowed from all non-terminal states; terminal states immutable; no CareHistory)

### 4.3 Invariants
- **DR-HARD-01 (Task Tree Immutability)**: `Task.treeId` is immutable post-creation. Verified by test.
- **DR-HARD-02 (Separation of Duties)**: Reviewer cannot approve or review evidence they historically authored. Verified by test.
- **DR-HARD-05 (Terminal Immutability)**: `COMPLETED` and `CANCELLED` reject all mutations.
- **DR-HARD-06 (Reassignment Invariant)**: Direct reassignment from `IN_PROGRESS` is rejected. Task must be `BLOCKED` first.
- **DR-HARD-07 (CareHistory Integrity)**: CareHistory is produced ONLY for `COMPLETED`. Non-terminal and cancelled tasks never produce CareHistory.
- **Upload != Acceptance**: S3 binary upload does not alter `TaskStatus`.

---

## 5. OBJECT STORAGE ARCHITECTURE & INTEGRATION (Sections 29, 30, 31, 32, 33)

- **Port**: Provider-neutral `IObjectStoragePort` in Application layer (`apps/api/src/modules/work-management/application/ports/object-storage.port.ts`).
- **Adapter**: `S3ObjectStorageAdapter` in Infrastructure layer (`apps/api/src/infrastructure/storage/s3-object-storage.ts`).
- **Isolation**: Zero `@aws-sdk` imports in Domain or Application layers. Verified by architecture test.
- **Security Boundary**:
  - Private by default.
  - Temporary presigned URLs generated server-side for upload (15-minute TTL) and download.
  - Durable reference persisted in DB: `objectKey`, `storageRef`, `contentHash`, `sizeBytes`. Temporary URLs are NOT persisted as durable identity.
- **CI Test Infrastructure**: MinIO disposable container in GitHub Actions (`.github/workflows/ci.yml`). Zero paid cloud credentials required.
- **Production Status**: `S3_COMPATIBLE_PORT = IMPLEMENTED`, `S3_COMPATIBLE_ADAPTER = IMPLEMENTED`, `CI_OBJECT_STORAGE_INTEGRATION = PASS`, `PRODUCTION_OBJECT_STORAGE_PROVIDER = CONFIGURATION_REQUIRED / NOT_PROVISIONED`.

---

## 6. OPTIMISTIC CONCURRENCY CONTROL (OCC) & IDEMPOTENCY (Sections 38, 39, 40)

- **OCC Pattern**: Atomically enforced via `UPDATE ... WHERE id = ? AND version = expectedVersion`.
  - Mismatched version: 0 affected rows -> 409 CONFLICT with `{ subtype: 'STALE_VERSION', currentVersion, expectedVersion }`.
- **Idempotency Pattern**:
  - `Idempotency-Key` read exclusively from HTTP header. Never placed in Business DTO.
  - PostgreSQL table `idempotency_records` scoped by `(actor_id, idempotency_key)` with SHA-256 request body hash.
  - Same key + same request payload: Replays committed response without executing side effects.
  - Same key + different request payload: Rejects deterministically with 409 CONFLICT.
  - Retention Boundary (IDB-09): Deferred with boundary; retention exceeds maximum legitimate retry window.

---

## 7. ASSERTIONS EVALUATION

### 7.1 Negative Assertions (All FALSE)
- [x] **P13W4-N01**: A sixth bounded context was introduced — **FALSE** (exactly 5 exist).
- [x] **P13W4-N02**: Task has a state outside the canonical seven — **FALSE** (only 7 canonical states).
- [x] **P13W4-N03**: Anything other than StartTask opens PENDING work — **FALSE** (only StartTask moves to IN_PROGRESS).
- [x] **P13W4-N04**: Task.treeId can mutate after creation — **FALSE** (treeId is strictly immutable).
- [x] **P13W4-N05**: Manager can directly reassign IN_PROGRESS — **FALSE** (rejected by DR-HARD-06).
- [x] **P13W4-N06**: WAITING_REVIEW or REWORK_REQUIRED can be directly reassigned — **FALSE** (rejected).
- [x] **P13W4-N07**: Terminal Task can mutate — **FALSE** (COMPLETED/CANCELLED are immutable).
- [x] **P13W4-N08**: Admin can execute normal operational Task mutation — **FALSE** (403 Forbidden).
- [x] **P13W4-N09**: Staff can mutate another staff member's task — **FALSE** (403 Forbidden).
- [x] **P13W4-N10**: Reviewer can approve their own evidence — **FALSE** (DR-HARD-02 SoD enforced).
- [x] **P13W4-N11**: Policy publication retroactively changes an existing Task — **FALSE** (snapshot is immutable).
- [x] **P13W4-N12**: CareHistory contains a non-COMPLETED Task — **FALSE** (only COMPLETED creates CareHistory).
- [x] **P13W4-N13**: Object upload alone changes TaskStatus — **FALSE** (upload does not affect task status).
- [x] **P13W4-N14**: Temporary presigned URL is persisted as durable evidence identity — **FALSE** (only objectKey/storageRef persisted).
- [x] **P13W4-N15**: Provider SDK leaks into Domain/Application/contracts — **FALSE** (verified by AST boundary tests).
- [x] **P13W4-N16**: Idempotency-Key is put in business DTO body — **FALSE** (HTTP header only).
- [x] **P13W4-N17**: Same idempotency key can duplicate a committed mutation — **FALSE** (replay cache prevents re-execution).
- [x] **P13W4-N18**: OCC is implemented as unsafe read-then-write only — **FALSE** (atomic WHERE version = expectedVersion).
- [x] **P13W4-N19**: Legacy mock API was removed/repointed — **FALSE** (scripts/greenops-dev-api.cjs untouched).
- [x] **P13W4-N20**: apps/mobile was modified — **FALSE** (git diff is completely empty).
- [x] **P13W4-N21**: apps/admin-web was created — **FALSE** (does not exist).
- [x] **P13W4-N22**: Dynamic findings governance was activated — **FALSE** (fixed findings schema for MVP).
- [x] **P13W4-N23**: Hash chaining/blockchain was introduced — **FALSE** (standard append-only audit table).
- [x] **P13W4-N24**: A paid production cloud service is required to pass Wave 4 — **FALSE** (disposable MinIO in CI).
- [x] **P13W4-N25**: Wave 5 was started — **FALSE** (Wave 5 remains locked).

### 7.2 Positive Assertions (All TRUE)
- [x] **P13W4-P01**: Exactly five canonical logical modules remain — **TRUE**.
- [x] **P13W4-P02**: Work Management Task Aggregate implements canonical lifecycle — **TRUE**.
- [x] **P13W4-P03**: Task.treeId is immutable — **TRUE**.
- [x] **P13W4-P04**: TaskType deterministically snapshots approved ProofProfile/policy — **TRUE**.
- [x] **P13W4-P05**: GPS <=10m semantics are enforced — **TRUE**.
- [x] **P13W4-P06**: QR identity compares against assigned immutable tree — **TRUE**.
- [x] **P13W4-P07**: Verification exceptions remain distinct from verified state — **TRUE**.
- [x] **P13W4-P08**: EvidenceAttempt history preserves authorship — **TRUE**.
- [x] **P13W4-P09**: Targeted rework preserves prior evidence — **TRUE**.
- [x] **P13W4-P10**: Human review SoD is enforced — **TRUE**.
- [x] **P13W4-P11**: CareHistory is produced only for COMPLETED — **TRUE**.
- [x] **P13W4-P12**: Tree governance uses OCC and retains retired history — **TRUE**.
- [x] **P13W4-P13**: TaskType/policy/checklist governance is versioned and non-retroactive — **TRUE**.
- [x] **P13W4-P14**: S3-compatible storage port is provider-neutral — **TRUE**.
- [x] **P13W4-P15**: Binary evidence is outside PostgreSQL — **TRUE**.
- [x] **P13W4-P16**: Durable object identity + checksum metadata persists in PostgreSQL — **TRUE**.
- [x] **P13W4-P17**: Private-by-default storage behavior is proven in CI — **TRUE**.
- [x] **P13W4-P18**: Upload success and business acceptance are separate — **TRUE**.
- [x] **P13W4-P19**: PostgreSQL OCC returns deterministic 409 STALE_VERSION — **TRUE**.
- [x] **P13W4-P20**: Persistent Idempotency-Key replay prevents duplicates — **TRUE**.
- [x] **P13W4-P21**: Wave-4 mutations emit append-only audit — **TRUE**.
- [x] **P13W4-P22**: Real PostgreSQL integration passes — **TRUE**.
- [x] **P13W4-P23**: Real S3-compatible integration passes — **TRUE**.
- [x] **P13W4-P24**: Full create -> execute -> submit -> review -> CareHistory E2E passes — **TRUE**.
- [x] **P13W4-P25**: Wave 0..3 regression remains green — **TRUE**.
- [x] **P13W4-P26**: Wave 5 remains unstarted — **TRUE**.

---

## 8. QUALITY GATES & LOCAL VERIFICATION SUMMARY

| Check | Result | Evidence |
|---|---|---|
| `npm run format:check` | PASS | All matched files use Prettier code style |
| `npm run lint` | PASS | 0 errors, 0 warnings across monorepo |
| `npm run typecheck` | PASS | Code 0 across all 5 monorepo workspaces |
| `npm run typecheck --workspace @novyx/contracts` | PASS | Code 0 |
| `npm run typecheck --workspace @novyx/api` | PASS | Code 0 |
| `npm run build --workspace @novyx/api` | PASS | Clean TypeScript compilation to dist |
| `npm test` (local) | PASS | 188 passed, 12 skipped (real DB/S3 tests skipped locally, run in CI), 0 failed (200 total) |
| `git diff --check` | PASS | Clean whitespace / line endings |
| `git diff --name-only 0bd7cc... -- apps/mobile ...` | PASS | Empty (100% untouched) |
| Frozen docs diff check | PASS | Empty (100% untouched) |
| `npm audit --omit=dev` | WARN | 24 pre-existing upstream vulnerabilities from Wave 0..3 baseline (no fix executed per rule) |

### 8.2 Remote GitHub Actions CI Verification

- **Workflow Run ID**: `35591875006`
- **Workflow Run URL**: `https://github.com/Peaker04/tree/actions/runs/35591875006`
- **Workflow Job ID**: `106307846522` (`Code Quality & Test Verification`)
- **Status**: SUCCESS / PASS in 1m57s
- **Commit SHA**: `346db348687b4bad4311c65bda8739c346d28e50`
- **Tree SHA**: `4a2ca2f347046c043effa591a0436eba110f46c9`

| CI Pipeline Step | Result | Log Output / Verification |
|---|---|---|
| `Initialize containers` | PASS | PostgreSQL 17-alpine service container initialized |
| `Checkout repository` | PASS | Branch `base-setup` checked out |
| `Setup Node.js` | PASS | Node.js 22.x configured with npm cache |
| `Install dependencies` | PASS | Clean install via `npm ci` |
| `Check code formatting` | PASS | `prettier . --check` -> All matched files use Prettier code style |
| `Lint codebase` | PASS | `eslint .` -> 0 errors, 0 warnings |
| `Typecheck monorepo` | PASS | `tsc -b --noEmit` across all 5 monorepo workspaces |
| `Build API workspace` | PASS | Clean TypeScript compilation to `apps/api/dist` |
| `Start disposable MinIO container` | PASS | `quay.io/minio/minio server /data` on port 9000 |
| `Setup test S3 bucket` | PASS | `scripts/setup-s3-test.cjs` -> Verified test S3 bucket `novyx-evidence` is accessible |
| `Run PostgreSQL migrations and role bootstrap` | PASS | 17 tables migrated; role separation & non-bypassable immutability triggers created |
| `Verify PostgreSQL schema and roles` | PASS | `[verify] All database & privilege checks passed successfully.` |
| `Run automated test suite (including DB and S3 integration)` | PASS | **15 test files passed (15/15), 199 tests passed, 1 skipped, 0 failed (200 total)** |

---

## 9. HARD BOUNDARIES PRESERVED

- `apps/mobile`: UNTOUCHED.
- `apps/admin-web`: NOT CREATED.
- `scripts/greenops-dev-api.cjs`: UNTOUCHED.
- Wave 5: NOT STARTED.
