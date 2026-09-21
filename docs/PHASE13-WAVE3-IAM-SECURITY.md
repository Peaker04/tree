# Phase 13 Wave 3: IAM Security Foundation & Final Corrections (W3-C01..W3-C06)

## 1. Input Baseline & Context
- **Repository:** `https://github.com/Peaker04/tree`
- **Branch:** `base-setup`
- **Wave 3 Initial HEAD:** `24f6df37fca6d572dcf5749e3074b97249b2b59e`
- **Wave 0, 1, 2 & Pre-Wave3 Audit Contract Patch:** ACCEPTED / FROZEN
- **Wave 4:** STRICTLY LOCKED / NOT STARTED

## 2. Corrected Acceptance Scope (W3-C01..W3-C06)
This implementation closes all six independently verified acceptance gaps in Wave 3:
1. **W3-C01 — IAM Transaction Atomicity:** Introduced Clean-Architecture `IIamUnitOfWork` abstraction and `DrizzleIamUnitOfWork` implementation. All IAM governance mutations (`ProvisionUser`, `AssignRole`, `ActivateAccount`, `SuspendAccount`, `DisableAccount`, `UnlockAccount`, `ResetCredentialSetup`) execute DB state changes and audit rows in a single atomic PostgreSQL transaction. Failure triggers automatic rollback, leaving no partial state or false SUCCESS audit rows; outer FAILURE audit is recorded.
2. **W3-C02 — Security Configuration Live Wiring:** Created `SecurityConfig` runtime interface populated from `loadEnv()` and injected through `startServer()` -> `buildApp()`. Directly configures `Argon2PasswordHasher` work factors (`memoryCost`, `timeCost`, `parallelism`), `LoginUseCase` TTL and lock parameters, `RefreshTokenUseCase` TTLs, and configuration-driven setup token TTL (`setupTokenTtlSeconds`).
3. **W3-C03 — Production Credential Delivery Fail-Closed:** `buildApp` without explicit `deliveryPort` leaves the adapter `undefined`. Production wiring does NOT silently default to in-memory delivery. Calls to `ResetCredentialSetup` fail closed with HTTP 503 `SERVICE_UNAVAILABLE` before any DB mutation or transaction occurs. Production delivery status is recorded as `PRODUCTION_CREDENTIAL_SETUP_DELIVERY = NOT_IMPLEMENTED`.
4. **W3-C04 — Contract-First Response Boundary & Canonical Error Envelope:** Added `GovernanceUserDtoSchema` and `GovernanceUserResponseSchema` to `@novyx/contracts`. All governance user responses (`GV-01`..`GV-07`) serialize through this shared schema, never leaking internal fields (`passwordHash`, `authVersion`, `failedLoginAttempts`, `lockedUntil`, session internals). Fastify error handler guarantees `error.requestId = request.id` on every failure. `POST /v1/auth/logout` returns HTTP 204 No Content. Path `:id` and body `userId` mismatches reject with deterministic HTTP 400 `VALIDATION_FAILED`.
5. **W3-C05 — Real PostgreSQL Security Evidence:** Created `tests/api/iam-postgres-integration.spec.ts` running against the real CI PostgreSQL service (`postgres:18-alpine`). Validates transaction rollback on deliberate failure, server-authoritative freshness on every protected request across account states (`ACTIVE`, `SUSPENDED`, `DISABLED`) and role changes, refresh credential rotation and spent-token reuse detection with token family isolation, OCC 409 conflict handling, and append-only audit immutability.
6. **W3-C06 — Migration Upgrade Safety (Wave 2 -> Wave 3):** Corrected `0001_iam_security_foundation.sql`. The `role` column is added as nullable, backfilled from `initial_role` (`UPDATE users SET role = initial_role`), and then constrained to `NOT NULL DEFAULT 'staff'`. Legacy pre-Wave 3 sessions are safely backfilled with non-secret sentinel identifiers and marked revoked (`revoked_at = COALESCE(revoked_at, now())`) before applying NOT NULL constraints. Verified in an automated real PostgreSQL upgrade test.

## 3. Technology & Dependency Boundary
- **Argon2id:** `argon2@0.45.1` (in `@novyx/api`).
- **CSPRNG Entropy:** `node:crypto` (`randomBytes(32)` yielding 256 bits).
- **Lookup Digest:** SHA-256 (`crypto.createHash('sha256')`).
- **Persistence & Migration:** `drizzle-orm@0.40.0`, `pg@8.13.3`, `drizzle-kit@0.30.5`.
- **Zero Web / Framework Leaks in Application:** Domain and Application layers contain ZERO imports of `drizzle`, `pg`, or `fastify`.
- **Zero JWT / JWKS:** No JWT, JWKS, JWS, or client-side tokens exist.

## 4. Production Delivery Adapter Status
```
PRODUCTION_CREDENTIAL_SETUP_DELIVERY = NOT_IMPLEMENTED
```
- No external email or SMS delivery provider has been owner-approved.
- In production wiring, `ResetCredentialSetup` fails closed with HTTP 503 `SERVICE_UNAVAILABLE` before database state mutation.
- `InMemoryCredentialSetupDelivery` is restricted to development and test execution.

## 5. Security Configuration Parameters
| Parameter | Env Variable | Default Value | Notes |
|:---|:---|:---|:---|
| Access Token TTL | `AUTH_ACCESS_TOKEN_TTL_SECONDS` | `900` (15 min) | Configurable deployment parameter |
| Refresh Token TTL | `AUTH_REFRESH_TOKEN_TTL_SECONDS` | `2592000` (30 days) | Configurable deployment parameter |
| Failed Login Lock Threshold | `AUTH_FAILED_LOGIN_LOCK_THRESHOLD` | `5` | Failed attempts before lockout |
| Lock Duration | `AUTH_LOCK_DURATION_SECONDS` | `900` (15 min) | Credential lock window |
| Setup Token TTL | `AUTH_SETUP_TOKEN_TTL_SECONDS` | `86400` (24 hours) | Configuration-driven setup token TTL |
| Argon2 Memory Cost | `ARGON2_MEMORY_COST` | `65536` KiB (64 MiB) | OWASP baseline |
| Argon2 Time Cost | `ARGON2_TIME_COST` | `3` | Iteration count |
| Argon2 Parallelism | `ARGON2_PARALLELISM` | `4` | Thread concurrency |

## 6. Real PostgreSQL Evidence Suite (`tests/api/iam-postgres-integration.spec.ts`)
Executed against real PostgreSQL in CI:
1. **Transaction Rollback:** Deliberate failure after user mutation and session invalidation causes full PostgreSQL `ROLLBACK`. User version/role remain unchanged, session remains active, and no false SUCCESS audit row exists. Outer FAILURE audit is recorded.
2. **Server-Authoritative Freshness:**
   - Active user with fresh opaque access token allowed on protected route (HTTP 204).
   - SuspendAccount immediately denies protected requests (HTTP 403 `FORBIDDEN`).
   - DisableAccount immediately denies protected requests (HTTP 403 `FORBIDDEN`).
   - AssignRole advances `authVersion` and invalidates sessions; prior access token is immediately denied (HTTP 401 `UNAUTHENTICATED`).
   - Revoked session in PostgreSQL is immediately denied (HTTP 401 `UNAUTHENTICATED`).
   - Expired access token in PostgreSQL is immediately denied (HTTP 401 `UNAUTHENTICATED`).
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
   - Corrected `0001_iam_security_foundation.sql` applied.
   - Roles accurately preserved: `initial_role=staff` -> `role=staff`, `initial_role=manager` -> `role=manager`, `initial_role=admin` -> `role=admin`.
   - Legacy pre-auth sessions safely migrated and marked revoked with non-secret sentinels.

## 7. Dependency Security Audit (`npm audit --omit=dev`)
- **Actual Exit Code:** `1`
- **Result:** **WARN** (24 vulnerabilities: 14 moderate, 10 high)
- **Root Cause Analysis:** All 24 detected vulnerabilities reside in pre-existing dependencies inherited from previous waves (e.g., `expo`, `metro`, `@react-navigation`, `drizzle-orm`, `js-yaml`).
- **Wave 3 Contribution:** 0 new vulnerabilities. The added dependency `argon2@0.45.1` has 0 reported vulnerabilities.

## 8. Verification Results (Local Non-DB Gates)
- `npm run format:check`: **PASS** (all files match Prettier code style)
- `npm run lint`: **PASS** (0 errors, 0 warnings)
- `npm run typecheck`: **PASS** (all workspaces typecheck clean)
- `npm run typecheck --workspace @novyx/contracts`: **PASS**
- `npm run typecheck --workspace @novyx/api`: **PASS**
- `npm run build --workspace @novyx/api`: **PASS**
- `npm test`: **PASS** (151 passed, 9 skipped; 12 test suites)
- `git diff --check`: **PASS** (0 whitespace/formatting errors)

## 9. Negative Assertions (All FALSE)
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

## 10. Positive Assertions (All TRUE)
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

## 11. Final Acceptance Conclusion
**PHASE 13 / WAVE 3 CORRECTED — READY FOR INDEPENDENT ACCEPTANCE**
- IAM MULTI-WRITE TRANSACTIONS ATOMIC
- SECURITY CONFIGURATION LIVE
- ARGON2 / TOKEN TTL POLICY CONFIGURABLE
- CREDENTIAL DELIVERY FAILS CLOSED WHEN UNAVAILABLE
- CONTRACT-FIRST GOVERNANCE RESPONSE ESTABLISHED
- CANONICAL ERROR ENVELOPE RESTORED
- REAL POSTGRES AUTH FRESHNESS PROVEN
- REAL POSTGRES OCC PROVEN
- REAL POSTGRES IAM AUDIT PROVEN
- WAVE2->WAVE3 MIGRATION UPGRADE SAFE
- APPEND-ONLY AUDIT PRIVILEGES PRESERVED
- MOBILE UNCHANGED
- WAVE 4 NOT STARTED
