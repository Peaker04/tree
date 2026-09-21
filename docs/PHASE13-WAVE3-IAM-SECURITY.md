# Phase 13 Wave 3: IAM Security Foundation & Final Evidence Normalization (W3-C01..W3-C06)

## 1. Input Baseline & Context
- **Repository:** `https://github.com/Peaker04/tree`
- **Branch:** `base-setup`
- **Wave 3 Initial HEAD:** `24f6df37fca6d572dcf5749e3074b97249b2b59e`
- **Primary Correction Commit:** `dd98efdfcfdacdbdabc3b7f9660db952ffba873b`
- **Final Test-Alignment Commit:** `9d5e71b5de6483c2dca06c028d47f9a3708f6c49`
- **Final Wave-3 HEAD:** `9d5e71b5de6483c2dca06c028d47f9a3708f6c49`
- **Final Tree SHA:** `beb4175c633cb3895dad6acbfd70de37aac504e3`
- **Wave 0, 1, 2 & Pre-Wave3 Audit Contract Patch:** ACCEPTED / FROZEN
- **Wave 4:** STRICTLY LOCKED / NOT STARTED

## 2. Verified Corrections Scope (W3-C01..W3-C06)
This document normalizes and preserves the six independently verified and accepted corrections in Wave 3:
1. **W3-C01 — IAM Transaction Atomicity (CLOSED):** Introduced Clean-Architecture `IIamUnitOfWork` abstraction and `DrizzleIamUnitOfWork` implementation. All IAM governance mutations (`ProvisionUser`, `AssignRole`, `ActivateAccount`, `SuspendAccount`, `DisableAccount`, `UnlockAccount`, `ResetCredentialSetup`) execute DB state changes and audit rows in a single atomic PostgreSQL transaction. Failure triggers automatic rollback, leaving no partial state or false SUCCESS audit rows; outer FAILURE audit is recorded.
2. **W3-C02 — Security Configuration Live Wiring (CLOSED):** Created `SecurityConfig` runtime interface populated from `loadEnv()` and injected through `startServer()` -> `buildApp()`. Directly configures `Argon2PasswordHasher` work factors (`memoryCost`, `timeCost`, `parallelism`), `LoginUseCase` TTL and lock parameters, `RefreshTokenUseCase` TTLs, and configuration-driven setup token TTL (`setupTokenTtlSeconds`).
3. **W3-C03 — Production Credential Delivery Fail-Closed (CLOSED):** `buildApp` without explicit `deliveryPort` leaves the adapter `undefined`. Production wiring does NOT silently default to in-memory delivery. Calls to `ResetCredentialSetup` fail closed with HTTP 503 when no production credential delivery adapter is configured. Under the current frozen `ErrorCodeSchema`, the canonical `error.code` remains `INTERNAL`. Production delivery status is recorded as `PRODUCTION_CREDENTIAL_SETUP_DELIVERY = NOT_IMPLEMENTED`.
4. **W3-C04 — Contract-First Response Boundary & Canonical Error Envelope (CLOSED):** Added `GovernanceUserDtoSchema` and `GovernanceUserResponseSchema` to `@novyx/contracts`. All governance user responses (`GV-01`..`GV-07`) serialize through this shared schema, never leaking internal fields (`passwordHash`, `authVersion`, `failedLoginAttempts`, `lockedUntil`, token digests, session internals). Fastify error handler guarantees `error.requestId = request.id` on every failure. `POST /v1/auth/logout` returns HTTP 204 No Content. Path `:id` and body `userId` mismatches reject with deterministic HTTP 400 `VALIDATION_FAILED`.
5. **W3-C05 — Real PostgreSQL Security Evidence (CLOSED):** Created `tests/api/iam-postgres-integration.spec.ts` running against the real CI PostgreSQL service (`postgres:18-alpine`). Validates transaction rollback on deliberate failure, server-authoritative freshness on every protected request across account states (`ACTIVE`, `SUSPENDED`, `DISABLED`) and role changes, refresh credential rotation and spent-token reuse detection with token family isolation, OCC 409 conflict handling, and append-only audit immutability.
6. **W3-C06 — Migration Upgrade Safety (Wave 2 -> Wave 3) (CLOSED):** Corrected `0001_iam_security_foundation.sql`. The `role` column is added as nullable, backfilled from `initial_role` (`UPDATE users SET role = initial_role`), and then constrained to `NOT NULL DEFAULT 'staff'`. Legacy pre-Wave 3 sessions are safely backfilled with non-secret sentinel identifiers and marked revoked (`revoked_at = COALESCE(revoked_at, now())`) before applying NOT NULL constraints. Verified in an automated real PostgreSQL upgrade test.

## 3. Technology & Credential Representation Boundary
- **Opaque Credential Model:**
  - No JWT / JWS / JWE / JWKS credential representation is used.
  - Access and refresh credentials are opaque high-entropy credentials generated via CSPRNG (`crypto.randomBytes(32)` yielding 256 bits).
  - Plaintext opaque credentials are necessarily returned to and held by the authenticated client for use.
  - Plaintext bearer credentials are NOT persisted server-side.
  - Server persistence contains only secure derived SHA-256 lookup digests (`crypto.createHash('sha256')`).
- **Argon2id Implementation:** `argon2@0.45.1` (in `@novyx/api`).
- **Persistence & Migration:** `drizzle-orm@0.40.0`, `pg@8.13.3`, `drizzle-kit@0.30.5`.
- **Zero Web / Framework Leaks in Application:** Domain and Application layers contain ZERO imports of `drizzle`, `pg`, or `fastify`.

## 4. Production Delivery Boundary & Reliability Precision
```
PRODUCTION_CREDENTIAL_SETUP_DELIVERY = NOT_IMPLEMENTED
```
- No external email or SMS delivery provider has been owner-approved.
- **Fail-Closed Semantics:** ResetCredentialSetup fails closed with HTTP 503 when no production credential delivery adapter is configured. Under the current frozen `ErrorCodeSchema`, the canonical `error.code` remains `INTERNAL`.
- `InMemoryCredentialSetupDelivery` is strictly restricted to development and test execution.
- **Delivery Reliability Precision Note:**
  - Absence of adapter fails before database mutation with HTTP 503.
  - When a delivery adapter is explicitly configured, DB security mutation commits before external delivery.
  - External provider delivery is intentionally NOT part of the PostgreSQL transaction.
  - Therefore, a future real production email/SMS adapter must add an appropriate reliable delivery mechanism such as retry/outbox/idempotent dispatch before that adapter is production-approved.
  - This is a future delivery integration concern, not a Wave-3 implementation failure because production delivery is currently `NOT_IMPLEMENTED`.

## 5. Security Configuration & Argon2 Parameter Provenance
### 5.1 Argon2 Work Factor Reference Distinction
- **OWASP Password Storage Reference:** `m = 19 MiB`, `t = 2`, `p = 1`.
- **RFC 9106 Second / Memory-Constrained Reference:** `m = 64 MiB`, `t = 3`, `p = 4`.
- **Current Application Defaults:** `m = 64 MiB (65536 KiB)`, `t = 3`, `p = 4`.
  - These values are classified strictly as **CURRENT CANDIDATE / DEPLOYMENT CONFIGURATION**, not permanent architecture invariants.
  - Production work factors remain: **NEEDS_BENCHMARK on target deployment hardware**.
  - All factors are configurable at runtime via environment variables without code modification.

### 5.2 Security Configuration Matrix
| Parameter | Env Variable | Default Value | Classification |
|:---|:---|:---|:---|
| Access Token TTL | `AUTH_ACCESS_TOKEN_TTL_SECONDS` | `900` (15 min) | Deployment configuration |
| Refresh Token TTL | `AUTH_REFRESH_TOKEN_TTL_SECONDS` | `2592000` (30 days) | Deployment configuration |
| Failed Login Lock Threshold | `AUTH_FAILED_LOGIN_LOCK_THRESHOLD` | `5` | Deployment configuration |
| Lock Duration | `AUTH_LOCK_DURATION_SECONDS` | `900` (15 min) | Deployment configuration |
| Setup Token TTL | `AUTH_SETUP_TOKEN_TTL_SECONDS` | `86400` (24 hours) | Configuration-driven TTL |
| Argon2 Memory Cost | `ARGON2_MEMORY_COST` | `65536` KiB (64 MiB) | RFC 9106 candidate default |
| Argon2 Time Cost | `ARGON2_TIME_COST` | `3` | RFC 9106 candidate default |
| Argon2 Parallelism | `ARGON2_PARALLELISM` | `4` | RFC 9106 candidate default |

## 6. Real PostgreSQL Evidence Suite (`tests/api/iam-postgres-integration.spec.ts`)
Executed against real PostgreSQL in CI (`postgres:18-alpine`):
1. **Transaction Rollback:** Deliberate failure after user mutation and session invalidation causes full PostgreSQL `ROLLBACK`. User version/role remain unchanged, session remains active, and no false SUCCESS audit row exists. Outer FAILURE audit is recorded.
2. **Server-Authoritative Freshness & Immediate Deny:**
   - Active user with fresh opaque access token allowed on protected route (HTTP 204).
   - **Immediate DENY is the invariant.** Final real-PostgreSQL acceptance tests allow HTTP 401 or 403 depending on which authoritative security check rejects the request first (e.g., HTTP 401 when the session has already been revoked / stale upon account mutation, or HTTP 403 when authoritative account status is evaluated first).
   - SuspendAccount immediately denies protected requests (verified immediate deny).
   - DisableAccount immediately denies protected requests (verified immediate deny).
   - AssignRole advances `authVersion` and invalidates sessions; prior access token is immediately denied with HTTP 401 `UNAUTHENTICATED` (stale authorization).
   - Revoked session in PostgreSQL is immediately denied with HTTP 401 `UNAUTHENTICATED`.
   - Expired access token in PostgreSQL is immediately denied with HTTP 401 `UNAUTHENTICATED`.
3. **Refresh Rotation & Reuse Detection:**
   - Valid refresh rotates credentials; new refresh token != old refresh token; old token stored in `spent_refresh_tokens`.
   - Replay of spent refresh token triggers reuse detection (HTTP 401), immediately revoking the affected token family.
   - Unrelated concurrent sessions for the same user remain valid and unaffected.
4. **Optimistic Concurrency Control (OCC) & Audit Immutability:**
   - Stale `expectedVersion` returns HTTP 409 `CONFLICT` with `subtype: 'STALE_VERSION'`.
   - Target user state in PostgreSQL is unchanged.
   - FAILURE audit row recorded; no false SUCCESS.
   - Runtime PostgreSQL role cannot `UPDATE`, `DELETE`, or `TRUNCATE` table `audit_events` (SQLSTATE `42501`).
5. **Migration Upgrade Safety:**
   - Wave 2 schema applied and seeded with staff, manager, admin users and legacy pre-auth sessions.
   - Corrected `0001_iam_security_foundation.sql` applied with isolated schema search path.
   - Roles accurately preserved: `initial_role=staff` -> `role=staff`, `initial_role=manager` -> `role=manager`, `initial_role=admin` -> `role=admin`.
   - Legacy pre-auth sessions safely migrated and marked revoked with non-secret sentinels.

## 7. Dependency Security Audit Precision (`npm audit --omit=dev`)
- **Local Audit Run:**
  - Command: `npm audit --omit=dev`
  - Exit Code: `1`
  - Locally reported production-scope count: `24 vulnerabilities (14 moderate, 10 high)`.
- **Remote CI Audit:**
  - `npm ci` reports the full dependency-tree audit summary separately during remote CI workflow execution.
- **Evaluation:**
  - Dependency audit remains **WARN** / non-blocking for this acceptance pass; no Wave-3 acceptance status is inferred from vulnerability counts alone.
  - The added Wave-3 production dependency `argon2@0.45.1` introduced 0 new vulnerabilities.

## 8. Verification Results (Local Non-DB Gates)
- `npm run format:check`: **PASS** (all files match Prettier code style)
- `npm run lint`: **PASS** (0 errors, 0 warnings)
- `npm run typecheck`: **PASS** (all workspaces typecheck clean)
- `npm run typecheck --workspace @novyx/contracts`: **PASS**
- `npm run typecheck --workspace @novyx/api`: **PASS**
- `npm run build --workspace @novyx/api`: **PASS**
- `npm test`: **PASS** (151 passed, 9 skipped; 12 test suites)
- `git diff --check`: **PASS** (0 whitespace/formatting errors)

## 9. Final Verified Remote CI Baseline
- **GitHub Actions Run ID:** `35585122993`
- **Job ID:** `106286554018`
- **Actual CI Node Version:** `v22.23.2`
- **CI Service Container:** `PostgreSQL 18.6 / postgres:18-alpine`
- **Final Remote Test Result:**
  - 12 test files passed
  - 159 tests passed
  - 1 skipped
  - 0 failures
- **Final Workflow Conclusion:** **SUCCESS**

## 10. Negative Assertions (All FALSE)
- `W3CF-N01`: Role/session/audit security mutation can partially commit -> **FALSE**
- `W3CF-N02`: Env security configuration is declared but ignored -> **FALSE**
- `W3CF-N03`: Production server defaults to InMemory credential delivery -> **FALSE**
- `W3CF-N04`: ResetCredentialSetup reports success without an available delivery adapter -> **FALSE**
- `W3CF-N05`: Governance endpoints return raw UserAccount -> **FALSE**
- `W3CF-N06`: Network user response contains passwordHash/authVersion or credential-lock internals -> **FALSE**
- `W3CF-N07`: ApiFailure omits requestId -> **FALSE**
- `W3CF-N08`: Path user id can silently disagree with body userId -> **FALSE**
- `W3CF-N09`: PostgreSQL freshness acceptance relies only on InMemory repos -> **FALSE**
- `W3CF-N10`: Existing manager/admin user is migrated to staff -> **FALSE**
- `W3CF-N11`: Wave-3 migration fails merely because a Wave-2 session exists -> **FALSE**
- `W3CF-N12`: Wave 4 was started -> **FALSE**

## 11. Positive Assertions (All TRUE)
- `W3CF-P01`: Security-sensitive IAM DB mutations use real PostgreSQL transaction boundaries -> **TRUE**
- `W3CF-P02`: Success audit and state mutation are transactionally consistent -> **TRUE**
- `W3CF-P03`: Security env configuration is actually wired -> **TRUE**
- `W3CF-P04`: Argon2 factors are deployment-configurable -> **TRUE**
- `W3CF-P05`: Access/refresh TTLs are deployment-configurable -> **TRUE**
- `W3CF-P06`: Credential setup TTL is configuration-driven -> **TRUE**
- `W3CF-P07`: Production credential delivery fails closed when unavailable -> **TRUE**
- `W3CF-P08`: GovernanceUser shared response schema exists -> **TRUE**
- `W3CF-P09`: ApiFailure includes requestId -> **TRUE**
- `W3CF-P10`: Real PostgreSQL proves suspension/disable/role freshness -> **TRUE**
- `W3CF-P11`: Real PostgreSQL proves OCC and audit behavior -> **TRUE**
- `W3CF-P12`: Migration preserves initial_role for existing users -> **TRUE**
- `W3CF-P13`: Legacy Wave-2 sessions migrate safely and remain unusable -> **TRUE**
- `W3CF-P14`: All Wave-0..3 regression tests remain green -> **TRUE**
- `W3CF-P15`: Wave 4 remains locked -> **TRUE**

## 12. Final Status
PHASE 13 / WAVE 3 — IMPLEMENTATION ACCEPTED
— FINAL EVIDENCE NORMALIZED
— IAM TRANSACTION ATOMICITY VERIFIED
— SECURITY CONFIGURATION LIVE
— OPAQUE CREDENTIAL MODEL VERIFIED
— ARGON2ID CONFIGURATION VERIFIED
— PRODUCTION CREDENTIAL DELIVERY FAILS CLOSED
— CONTRACT-FIRST GOVERNANCE RESPONSE VERIFIED
— CANONICAL REQUEST-ID ERROR ENVELOPE VERIFIED
— REAL POSTGRES AUTH FRESHNESS VERIFIED
— REAL POSTGRES REFRESH ROTATION / REUSE VERIFIED
— REAL POSTGRES OCC VERIFIED
— APPEND-ONLY AUDIT VERIFIED
— WAVE2 -> WAVE3 MIGRATION UPGRADE VERIFIED
— REMOTE CI PASS: 35585122993
— FINAL HEAD: 9d5e71b5de6483c2dca06c028d47f9a3708f6c49
— WAVE 4 NOT STARTED
— READY FOR OWNER FREEZE
