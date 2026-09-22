# Phase 13 Wave 5B: Mobile REST Transport, Auth Refresh, Outbox Dispatcher & Server Reconciliation

## 1. Executive Summary & Architecture Scope

Wave 5B delivers the production REST networking, authentication lifecycle, outbox dispatch pipeline, and authoritative server state reconciliation layer for Novyx Mobile (Expo SDK 57).

### Architecture Alignment
- **ADR 0008** (Mobile Offline Durable Storage Engine & Outbox Synchronization Architecture)
- **ADR 0009** (Concurrency & Idempotency Strategy)
- **ADR 0010** (Authentication & Token Rotation Lifecycle)
- **Section 41** (Outbox Evidence Dispatch & S3 Presigned Binary Upload)
- **Section 42** (Opaque Session Single-Flight Refresh)
- **Section 43** (Authoritative Server State Reconciliation)

### Scope Boundaries
- **Wave 4 Frozen**: `apps/api/**` and `tests/api/**` remain strictly untouched.
- **Wave 5A Frozen**: SQLite schema version 2 (`LATEST_SCHEMA_VERSION = 2`), sandboxed persistent storage, and transaction semantics are fully preserved.
- **Wave 5C & 6 Locked**: No mobile UI redesign or screen layout modifications. Mobile integration connects through `apps/mobile/src/services/greenOpsService.ts` and background outbox sync.

---

## 2. Component Architecture Overview

```mermaid
flowchart TD
    subgraph Mobile Client
        OutboxCoordinator[OutboxCoordinator]
        SubmitDispatcher[SubmitEvidenceOutboxDispatcher]
        MobileApiClient[MobileApiClient]
        AuthManager[AuthSessionManager]
        UploadClient[EvidenceUploadClient]
        AuthStore[AuthSessionStore / SecureStore]
        SQLite[(SQLite DB: cached_tasks, local_drafts, local_evidence, outbox_items)]
        FileSystem[(App Sandbox FileSystem)]
    end

    subgraph Fastify API [apps/api - v1]
        AuthRoutes[/v1/auth/refresh, /v1/auth/login]
        TaskRoutes[/v1/tasks/:id, /v1/tasks/:id/evidence/presign, /v1/tasks/:id/evidence]
    end

    subgraph Object Storage
        S3MinIO[(S3 / MinIO Object Storage)]
    end

    OutboxCoordinator -->|1. fetch eligible item| SQLite
    OutboxCoordinator -->|2. dispatch item| SubmitDispatcher
    SubmitDispatcher -->|3. read binary & compute hash| FileSystem
    SubmitDispatcher -->|4. POST /v1/tasks/:id/evidence/presign| MobileApiClient
    MobileApiClient -->|Attach Bearer token & refresh on 401| AuthManager
    AuthManager <-->|Persist/Retrieve Tokens| AuthStore
    MobileApiClient -->|HTTP| Fastify API
    SubmitDispatcher -->|5. Binary PUT raw bytes| UploadClient
    UploadClient -->|PUT with Signed Headers| S3MinIO
    SubmitDispatcher -->|6. POST /v1/tasks/:id/evidence with Idempotency-Key Header| MobileApiClient
    OutboxCoordinator -->|7. Reconcile Task WAITING_REVIEW, update draft & evidence| SQLite
```

---

## 3. Canonical API Contract & Route Matrix

All network communication targets the canonical Fastify backend routes under `/v1`:

| Operation | Method | Route | Header Requirements | Payload / Details |
|---|---|---|---|---|
| **Login** | `POST` | `/v1/auth/login` | `Content-Type: application/json` | `{ email, password }` |
| **Token Refresh** | `POST` | `/v1/auth/refresh` | `Content-Type: application/json` | `{ refreshToken }` |
| **Logout** | `POST` | `/v1/auth/logout` | `Authorization: Bearer <token>`, `Content-Type: application/json` | `{ refreshToken? }` |
| **List Tasks** | `GET` | `/v1/tasks` | `Authorization: Bearer <token>` | Query params: status, treeId, limit |
| **Get Task Details** | `GET` | `/v1/tasks/:id` | `Authorization: Bearer <token>` | Response: authoritative `Task` DTO |
| **Review Task** | `POST` | `/v1/tasks/:id/review` | `Authorization: Bearer <token>`, `Content-Type: application/json` | `{ expectedVersion, decision, notes?, reworkReason? }` |
| **Presign Evidence Upload** | `POST` | `/v1/tasks/:id/evidence/presign` | `Authorization: Bearer <token>`, `Content-Type: application/json` | `{ fileName, contentType, sizeBytes, contentHash }` |
| **Upload Binary Object** | `PUT` | `<presignedUrl>` | Presigned headers (e.g. `Host`, `x-amz-*`) | Raw binary payload (exact bytes, `Uint8Array`) |
| **Submit Evidence** | `POST` | `/v1/tasks/:id/evidence` | `Authorization: Bearer <token>`, `Idempotency-Key: <uuid-v4>`, `Content-Type: application/json` | Submit Evidence payload (idempotency key excluded from JSON body) |

---

## 4. Opaque Session Lifecycle & Single-Flight Refresh

### Contract Invariants
1. **Zero JWT Parsing**: Tokens are treated as opaque, structured credentials. No client-side JWT claims parsing, expiration estimation, or Base64 decoding occurs.
2. **Single-Flight Coalescing**: When multiple parallel requests encounter an HTTP 401 Unauthorized, only a single refresh request (`POST /v1/auth/refresh`) is dispatched to the server. All waiting callers await the exact same promise (`refreshFlightPromise`).
3. **Secure Persistence**: Session tokens (`accessToken`, `refreshToken`, `user: { id, email, role }`) are stored via `expo-secure-store` with hardware-backed encryption where available, falling back gracefully to in-memory persistence in test/CLI environments.
4. **Finite Retry Bound**: The client retries a failed request at most once after a successful token refresh. If the retried request returns 401 or refresh fails, the session is cleared and callers receive an explicit `AUTH` error.

### Sequence Flow

```mermaid
sequenceDiagram
    participant C1 as Caller 1
    participant C2 as Caller 2
    participant Client as MobileApiClient
    participant Mgr as AuthSessionManager
    participant API as Fastify API (/v1)

    C1->>Client: GET /v1/tasks
    C2->>Client: GET /v1/trees
    Client->>API: GET /v1/tasks (Token A)
    Client->>API: GET /v1/trees (Token A)
    API-->>Client: 401 Unauthorized
    API-->>Client: 401 Unauthorized

    Note over Client,Mgr: Single-flight coalescing triggers
    Client->>Mgr: refreshSession() [Caller 1]
    Client->>Mgr: refreshSession() [Caller 2 awaits existing promise]
    Mgr->>API: POST /v1/auth/refresh { refreshToken }
    API-->>Mgr: 200 OK { accessToken: Token B, refreshToken: Token C }
    Mgr->>Mgr: Persist Token B & C in SecureStore

    Note over Client,API: Automatic retry with Token B
    Client->>API: GET /v1/tasks (Token B)
    Client->>API: GET /v1/trees (Token B)
    API-->>C1: 200 OK
    API-->>C2: 200 OK
```

---

## 5. Evidence Upload Pipeline & S3 / MinIO Integration

### Durable Preparation Boundary (Presign -> Binary PUT -> Durable Canonical Request -> Final POST)

The `SubmitEvidenceOutboxDispatcher` executes a safe, multi-stage transactional dispatch:

1. **Evidence Presigning (Single Object)**:
   - For each local evidence item, computes exact file size and exact SHA-256 hash using `ExpoEvidenceHasher` / `NodeEvidenceHasher`.
   - Sends presign request to `POST /v1/tasks/:id/evidence/presign` with single object metadata: `{ fileName, contentType, sizeBytes, contentHash: sha256Hex }`.
   - Receives presigned PUT URL and target canonical storage reference (`storageRef` or `objectKey`).

2. **Binary Stream Upload**:
   - `EvidenceUploadClient` uploads exact bytes (`Uint8Array` / binary buffer) directly to the storage bucket via `PUT <uploadUrl>`.
   - **No Base64 transformation** during transport: ensures byte-level integrity matching client and server SHA-256 digests.
   - Preserves signed headers: forwards any server-signed headers verbatim.

3. **Durable Canonical Request Persistence (5B-R01)**:
   - Transforms all local `file://` URIs in `SubmitEvidenceRequest` into canonical storage URIs (`s3://<bucket>/<objectKey>` or `tasks/:id/...`).
   - Verifies that zero local file or temporary HTTP URLs remain in the canonical request.
   - **Durably persists** the canonical request into `outbox_items.payload_json` in the local SQLite database **BEFORE** the final business POST.
   - This ensures that if the app crashes or network drops after upload or after server commit, the outbox row already contains canonical server references.

4. **Canonical Evidence Submission (Business POST)**:
   - Injects the persisted `idempotencyKey` strictly as the `Idempotency-Key` HTTP header.
   - Excludes `idempotencyKey` from the JSON request body (`stateSeparation.ts`).
   - Dispatches `POST /v1/tasks/:id/evidence` with the canonical request body.

### Supported Proof Profiles
The canonical operational system defines exactly three valid ProofProfiles:
- `CHANGE_PROOF`: Requires `beforePhotoUri` and `afterPhotoUri`.
- `SERVICE_PROOF`: Requires `completionPhotoUri`.
- `INSPECTION_PROOF`: Requires `conditionPhotos` (array of at least one condition photo).

Domain task types (e.g. `SURFACE_CLEANING`, `TREE_PLANTING`, `ORGANIC_FERTILIZATION`) are TaskType catalog entities, **not** ProofProfile identifiers.

---

## 6. Authoritative Server State Reconciliation

### Local Storage Updates upon Successful Submission
Upon receiving HTTP 200/201 from `POST /v1/tasks/:id/evidence`, `OutboxCoordinator` orchestrates the local reconciliation transaction:
1. **`cached_tasks` Table**:
   - Updated with the authoritative server `Task` DTO (status transitions to `WAITING_REVIEW`, updated version, server timestamps).
2. **`local_drafts` Table**:
   - Draft submission status resets from `PENDING_SYNC` to `IDLE` (`last_synced_at = ISO timestamp`).
3. **`local_evidence` Table**:
   - Associated evidence items transition from `SYNCING` to `SYNCED`.
4. **`outbox_items` Table**:
   - Outbox entry transitions from `SYNCING` to `SYNCED`, recording zero remaining sync attempts.

### Transaction Isolation & Savepoint Safety
To prevent nested transaction deadlocks in SQLite drivers, `OutboxCoordinator` ensures `taskRepo.cacheTasks` and draft/evidence updates execute sequentially in distinct transactions rather than overlapping savepoints.

---

## 7. Replay & Idempotency Guarantees

### Safe Network Crash Replay & Exact-Body Replay
When a network failure occurs after the server processed the submission but before the mobile client received the HTTP 200 response:
1. The outbox item remains in `SYNC_FAILED` with the original, immutable `idempotencyKey` and the durably stored canonical request in `payload_json`.
2. On the next dispatch cycle, `SubmitEvidenceOutboxDispatcher` detects that the payload is already canonical via `isAlreadyCanonical(parsedPayload)`.
3. The dispatcher bypasses the presign and binary upload stages entirely (0 additional presign calls, 0 additional binary PUT calls).
4. The dispatcher re-submits the **exact deeply equal canonical request body** with the **same identical `Idempotency-Key` header**.
5. Fastify's server-side `IdempotencyRepository` matches the actor ID and idempotency key, returning the replayed committed 200 response without duplicating attempts in the operational ledger (server `EvidenceAttempts` count remains 1).
6. **No Status Shortcut**: The dispatcher requires an authoritative response from `SubmitEvidence` (including idempotency replay). Simply seeing `WAITING_REVIEW` on a task does not constitute success without a matching replay response.

---

## 8. Error Classification & Outbox Retry Matrix

| HTTP Status | Client Classification | Description | Outbox Action |
|---|---|---|---|
| `TypeError: fetch failed` / Timeout | `NETWORK` | Network drop, DNS failure, connection reset | **Retryable** (eligible for auto-retry) |
| `500`, `502`, `503`, `504` | `SERVER_5XX` | Backend unhandled error or gateway timeout | **Retryable** (eligible for auto-retry) |
| `401 Unauthorized` | `AUTH` | Invalid/expired credentials after failed refresh | **Non-retryable** (retained for user re-auth) |
| `403 Forbidden` | `FORBIDDEN` | Scope restriction, RBAC denial, cross-crew violation | **Non-retryable** (requires manual review) |
| `409 Conflict` | `CONFLICT` | Concurrent modification or task version clash | **Non-retryable** (preserved for reconciliation) |
| `400 Bad Request`, `422 Unprocessable` | `VALIDATION` | Invalid proof schema, malformed checklist answers | **Non-retryable** (retained for correction) |

---

## 9. Verification & Test Evidence

### 1. Specification Unit & Mock Suite (`tests/mobile/wave5b-rest-sync.spec.ts`)
- **Coverage**: 46 dedicated test cases covering requirements B01 through B30, R01 through R15, and Section 31:
  - B01–B09: Auth session persistence, single-flight refresh coalescing, 401 retry, logout cleanup, no JWT decode, tokens outside SQLite/outbox.
  - B10–B20: Presign payload generation (`fileName`, `contentType`, `sizeBytes`, `contentHash`), SHA-256 validation, S3 PUT binary stream dispatch, proof profile transformation (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`), LocationException/IdentityException transformation.
  - B21–B30: Outbox dispatcher execution, idempotency header inclusion, body sanitation, error classification (`NETWORK`, `SERVER_5XX`, `AUTH`, `FORBIDDEN`, `CONFLICT`, `VALIDATION`), authoritative server state reconciliation.
  - R01–R08: REST authority invariants (explicit mock/rest configuration, no silent fallbacks, no `/progress`, `POST /v1/tasks/:id/review`, no notification HTTP calls, shared session authority).
  - R09–R15: Mobile sync runtime and lifecycle invariants (single SQLite/migrations init, startup recovery, single shared coordinator, restored session dispatch, parallel worker prevention, logout invalidation, task status preservation).
  - Section 31: WAITING_REVIEW status-as-success shortcut regression prevention.
- **Result**: **46 / 46 PASSING**.

### 2. Fastify Loopback Integration Suite (`tests/mobile/wave5b-fastify-http.spec.ts`)
- **Coverage**:
  - In-process HTTP server listening on dynamic port (`127.0.0.1:<port>`).
  - Full cryptographic authentication flow: Argon2 password verification, token issuance, single-flight refresh.
  - End-to-end task execution: Start task (`IN_PROGRESS`), presign evidence, binary upload to MinIO/S3 test double, submit evidence with `Idempotency-Key` header.
  - Idempotency replay verification: duplicate dispatch with the same key returns cached 200 response; exactly 1 evidence attempt exists in the server ledger.
- **Result**: **2 / 2 PASSING**.

### 3. Real Postgres 18 & MinIO Integration Suite (`tests/mobile/wave5b-real-integration.spec.ts`)
- **Coverage**: Sections 41, 42, and 43 tested against live containerized PostgreSQL 18 and MinIO services:
  - Section 30 Ambiguous Success Replay: asserts 1 presign call, 1 binary PUT call, 2 SubmitEvidence POST calls with identical canonical bodies and keys, 1 server evidence attempt in PostgreSQL, server and cached task WAITING_REVIEW, local outbox SYNCED, local evidence preserved.
- **Result**: Configured with conditional test execution (`it.runIf(hasDatabase && hasS3)`) for execution in CI/CD pipeline.
