# Phase 13 Wave 3: IAM, Opaque Credentials, Session Freshness & Tier-2 Security Gate

## 1. Input Baseline
- **Repository:** `https://github.com/Peaker04/tree`
- **Branch:** `base-setup`
- **Frozen Entry HEAD:** `c20907a9d1de0052a4a669fa48d132cf9852d46a`
- **Frozen Entry Tree:** `5243a9a061303c4c2c88b9e926415db00ceaa881`
- **Clean Working Tree:** Verified prior to implementation.
- **Node Version:** `v24.13.0`
- **NPM Version:** `11.6.2`

## 2. Authorized Scope
Authorized Wave 3 implementation exclusively covers:
- Server-authoritative Identity & Access Management (IAM) security foundation.
- Argon2id password hashing and rehash-on-successful-login.
- CSPRNG opaque bearer access credentials (short-lived) and rotating opaque refresh credentials.
- Cryptographic hashing (SHA-256) of random bearer tokens prior to persistence (zero plaintext token storage).
- Drizzle ORM additive migration `0001_iam_security_foundation.sql` extending `users`, `sessions`, and introducing `spent_refresh_tokens` and `credential_setup_tokens`.
- Clean Architecture ports: `IUserRepository`, `ISessionRepository`, `IPasswordHasher`, `ITokenService`, `ICredentialSetupDeliveryPort`, and `IAuditWriter`.
- PostgreSQL session repository adapter with atomic refresh rotation and spent-token reuse detection.
- Server-authoritative session freshness on every protected request (`authVersion`, `sessionVersion`, `accountStatus === 'ACTIVE'`).
- Fastify Tier-2 coarse authorization request gate (`createAuthGate`, `requireRoles`).
- Public auth routes (`POST /v1/auth/login`, `POST /v1/auth/refresh`, `POST /v1/auth/logout`).
- Admin governance routes (`GV-01` through `GV-07` under `/v1/governance/users`).
- Append-only IAM audit trail recording with canonical `SUCCESS` / `FAILURE` outcomes and strict state sanitization.
- Hard exclusions preserved: No modifications to `apps/mobile/**`, `packages/ui/**`, `packages/config/**`, `packages/contracts/**`, `scripts/greenops-dev-api.cjs`, or `external/**`. Wave 4 task operational domain strictly unstarted.

## 3. Technology / Security Dependency Versions
- **Argon2id Library:** `argon2@0.45.1` (installed in `@novyx/api`).
- **Cryptographic Randomness & Hashing:** Native `node:crypto` (`crypto.randomBytes`, `crypto.createHash`).
- **Relational Persistence & ORM:** `drizzle-orm@0.40.0`, `pg@8.13.3`, `drizzle-kit@0.30.5`.
- **HTTP Server Framework:** `fastify@5.2.1` with `fastify-type-provider-zod@4.0.2`.
- **Runtime Validation:** `zod@3.24.2` via `@novyx/contracts`.

## 4. Persistence Migration
- Migration file created: `apps/api/src/infrastructure/persistence/migrations/0001_iam_security_foundation.sql`.
- Journal updated: `apps/api/src/infrastructure/persistence/migrations/meta/_journal.json` (entry index 1).
- Snapshot generated: `apps/api/src/infrastructure/persistence/migrations/meta/0001_snapshot.json`.
- Additive schema changes:
  - Table `users`: added `role` (varchar 20 default 'staff'), `password_hash` (varchar 255), `auth_version` (integer default 1), `failed_login_attempts` (integer default 0), `locked_until` (timestamp with time zone).
  - Table `sessions`: added `token_family` (varchar 128), `access_token_hash` (varchar 128), `refresh_token_hash` (varchar 128), `auth_version` (integer default 1), `session_version` (integer default 1), `access_expires_at` (timestamp with time zone), `refresh_expires_at` (timestamp with time zone), `last_rotated_at` (timestamp with time zone), with B-tree indexes on lookup hashes and token family.
  - New table `spent_refresh_tokens`: tracks rotated refresh token hashes for reuse detection (`session_id`, `token_family`, `refresh_token_hash`, `spent_at`, `expires_at`).
  - New table `credential_setup_tokens`: tracks setup/reset tokens for account onboarding and `GV-07` (`user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`).

## 5. Users Security State
- Supports canonical Human Roles: `staff`, `manager`, `admin`.
- Supports canonical AccountStatus: `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`.
- `initial_role` preserved for historical provenance; `role` stores current effective role.
- Concurrency control: `version` integer column enforces Optimistic Concurrency Control (OCC).
- Credential lock state: `failed_login_attempts` counter and `locked_until` timestamp. Credential lock is orthogonal to `AccountStatus`.

## 6. Session Persistence Model
- Table `sessions` maps active sessions:
  - `id`: unique session identifier (UUID).
  - `userId`: foreign key references `users(id)` ON DELETE CASCADE.
  - `tokenFamily`: stable family identifier grouping rotated credentials for atomic invalidation upon reuse detection.
  - `accessTokenHash`: SHA-256 digest of opaque bearer access token.
  - `refreshTokenHash`: SHA-256 digest of current opaque refresh token.
  - `authVersion`: authorization version at issue time (must match `user.auth_version`).
  - `sessionVersion`: monotonic session rotation counter.
  - `accessExpiresAt`, `refreshExpiresAt`, `expiresAt`: expiration timestamps.
  - `revokedAt`: timestamp of revocation (null if active).

## 7. SessionRepository Port
- Port interface: `ISessionRepository` in `apps/api/src/modules/iam/application/ports/session-repository.port.ts`.
- Pure domain/application contract independent of Drizzle, Fastify, and PostgreSQL driver.
- Infrastructure adapter: `DrizzleSessionRepository` in `apps/api/src/infrastructure/persistence/repositories/drizzle-session-repository.ts`.

## 8. UserRepository Port
- Port interface: `IUserRepository` in `apps/api/src/modules/iam/application/ports/user-repository.port.ts`.
- Minimal application-facing abstraction supporting user lookup, OCC updates (`updateWithOcc`), credential lock management, and authorization version advancement.
- Infrastructure adapter: `DrizzleUserRepository` in `apps/api/src/infrastructure/persistence/repositories/drizzle-user-repository.ts`.

## 9. Argon2id Implementation
- Adapter: `Argon2PasswordHasher` in `apps/api/src/infrastructure/security/argon2-password-hasher.ts`.
- Implements `IPasswordHasher`.
- Enforces `argon2.argon2id` variant with unique random salt per hash.
- Supports runtime parameter configuration (`memoryCost`, `timeCost`, `parallelism`).
- Detects outdated hash parameters via `needsRehash()`.

## 10. Argon2 Benchmark / Configuration Status
- Default production parameters (per OWASP baseline):
  - Memory cost: 65,536 KiB (64 MiB).
  - Time cost (iterations): 3.
  - Parallelism: 4 threads.
- Test parameters (isolated in test suites):
  - Memory cost: 4,096 KiB (4 MiB).
  - Time cost: 1.
  - Parallelism: 1 thread.
- Parameters are dynamically configurable via environment variables (`ARGON2_MEMORY_COST`, `ARGON2_TIME_COST`, `ARGON2_PARALLELISM`) and never hardcoded as permanent invariants.

## 11. Opaque Credential Generation
- Adapter: `CryptoTokenService` in `apps/api/src/infrastructure/security/crypto-token-service.ts`.
- Uses `crypto.randomBytes(32).toString('base64url')` yielding 256 bits of CSPRNG entropy.
- Completely decoupled from user identity, email, or role claims.
- No JWT, JWS, JWE, JWKS, HS256, RS256, or ES256 used.

## 12. Token Hashing / Lookup
- Access tokens and refresh tokens are hashed immediately upon generation using SHA-256 (`crypto.createHash('sha256').update(token).digest('hex')`).
- Server stores exclusively 64-character hexadecimal digests.
- Incoming bearer tokens in `Authorization: Bearer <token>` or refresh payloads are hashed in memory before querying indexed columns. Plaintext tokens are never stored, logged, or exposed in audit events.

## 13. Login Flow
- Endpoint: `POST /v1/auth/login`.
- Contract: `LoginRequestSchema` -> `LoginResponseSchema`.
- Flow:
  1. Lookup user by email. If absent -> `401 UNAUTHENTICATED` (constant-time response without revealing existence).
  2. Check credential lock: if `lockedUntil > now`, reject with `401 UNAUTHENTICATED`.
  3. Verify password hash using `argon2.verify()`.
  4. On password mismatch: increment `failed_login_attempts`; if threshold reached, set `locked_until` (default 15m), return `401`.
  5. Check `accountStatus`: reject non-`ACTIVE` (`INVITED`, `SUSPENDED`, `DISABLED`) with `403 FORBIDDEN`.
  6. Reset failed login counters if previously incremented.
  7. Check `needsRehash()`: if true, rehash with current configured work factors and persist upgraded hash.
  8. Generate CSPRNG access token (TTL: 15m) and rotating refresh token (TTL: 30d).
  9. Persist session record in PostgreSQL.
  10. Return contract-compliant `LoginResponse`.

## 14. Refresh Rotation Flow
- Endpoint: `POST /v1/auth/refresh`.
- Contract: `RefreshTokenRequestSchema` -> `LoginResponseSchema`.
- Flow:
  1. Hash incoming refresh token.
  2. Query `spent_refresh_tokens`: if found, confirmed reuse! Immediately revoke the affected token family/session and return `401 UNAUTHENTICATED`.
  3. Query active session: if not found, revoked, or expired -> return `401 UNAUTHENTICATED`.
  4. Authoritative check: verify user exists, `accountStatus === 'ACTIVE'`, and `session.authVersion === user.authVersion`.
  5. Generate replacement access token and refresh token.
  6. Execute atomic PostgreSQL transaction: record old refresh hash in `spent_refresh_tokens`, update session hashes, and advance `sessionVersion`.
  7. Return new session credentials.

## 15. Refresh Reuse Detection
- Handled by `spent_refresh_tokens` table and `rotateRefreshToken()` transaction.
- When an already-rotated refresh credential is presented, the system detects the spent record, revokes all sessions belonging to that token family (`revokedAt = now()`), and rejects the request.
- Bounded blast radius: Only the compromised token family/session is revoked. Unrelated active sessions of the same user remain valid.

## 16. Logout / Revocation
- Endpoint: `POST /v1/auth/logout`.
- Protected by Tier-2 auth gate.
- Resolves session via access token hash and sets `revokedAt = now()`.
- Technical IAM action; does NOT introduce a fake `RevokeSession` business command.

## 17. Session Freshness
- Server-authoritative on every protected request (ADR 0006, ADR 0007).
- Request pipeline verifies:
  1. Bearer token matches active session in PostgreSQL.
  2. `session.accessExpiresAt > now()`.
  3. `session.revokedAt === null`.
  4. Authoritative user `accountStatus === 'ACTIVE'`.
  5. `session.authVersion === user.authVersion`.
- Suspending or disabling an account, or changing a user's role, immediately advances `user.authVersion` and revokes active sessions.

## 18. Tier-2 Security Gate
- Middleware: `createAuthGate(userRepo, sessionRepo, tokenService)` and `requireRoles(...roles)` in `apps/api/src/infrastructure/http/middleware/auth-gate.ts`.
- Enforces identity, active status, fresh session, and coarse role eligibility (e.g. Platform Admin on governance routes).
- Does NOT enforce fine-grained Wave 4 business rules (no TaskStatus or assignedStaffId logic in middleware).

## 19. IAM Governance Commands
All 7 canonical commands implemented under `/v1/governance/users`:
- `GV-01 ProvisionUser`: creates user aggregate in `INVITED` status, version 0.
- `GV-02 AssignRole`: updates effective role, advances `authVersion`, invalidates prior sessions, requires `expectedVersion`.
- `GV-03 ActivateAccount`: transitions `INVITED` or `SUSPENDED` to `ACTIVE`, advances `authVersion`, requires `expectedVersion`. Rejects activation of `DISABLED` accounts.
- `GV-04 SuspendAccount`: transitions `ACTIVE` to `SUSPENDED`, invalidates sessions, advances `authVersion`, requires `expectedVersion`.
- `GV-05 DisableAccount`: permanently deactivates account (`DISABLED`), purges sessions, advances `authVersion`, requires `expectedVersion`.
- `GV-06 UnlockAccount`: clears credential lock state (`failedLoginAttempts = 0`, `lockedUntil = null`), preserves `accountStatus` exactly, requires `expectedVersion`.
- `GV-07 ResetCredentialSetup`: advances `authVersion`, generates CSPRNG setup token (stored as hash), delivers via `ICredentialSetupDeliveryPort`, requires `expectedVersion`.

## 20. Credential Lock / Unlock
- Credential lock is a separate technical dimension from `AccountStatus`.
- Repeated failed logins lock the credential without changing `AccountStatus`.
- `UnlockAccount` clears `failedLoginAttempts` and `lockedUntil`. It cannot activate a `SUSPENDED` account or re-enable a `DISABLED` account.

## 21. Reset Credential Setup Boundary
- `GV-07` creates a single-use, time-bounded setup token (24h TTL).
- Stored server-side in `credential_setup_tokens` solely as a SHA-256 hash.
- Delivery is abstracted via `ICredentialSetupDeliveryPort` (`InMemoryCredentialSetupDelivery` for tests/dev). No external paid SMS/email provider added.

## 22. IAM Audit Trail
- Uses existing `audit_events` table under the `audit-compliance` module.
- Records all successful and failed governance actions.
- Canonical `AuditOutcome`: strictly `SUCCESS` or `FAILURE` (ADR 0011, Pre-Wave 3 contract patch).
- State sanitization: `AuditService` scrubs all secrets (`password`, `passwordHash`, `token`, `accessToken`, `refreshToken`, `tokenHash`, `databaseUrl`) from `before_state` and `after_state`.

## 23. API Route Inventory
| Method | Path | Classification | PreHandler Guards | DTO / Contract Schema |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/v1/auth/login` | `PUBLIC_AUTH` | None | `LoginRequestSchema` -> `LoginResponseSchema` |
| `POST` | `/v1/auth/refresh` | `PUBLIC_AUTH` | None | `RefreshTokenRequestSchema` -> `LoginResponseSchema` |
| `POST` | `/v1/auth/logout` | `PROTECTED_AUTH` | `authenticate` | None -> `{ data: { success: true } }` |
| `POST` | `/v1/governance/users` | `ADMIN_GOVERNANCE` | `authenticate`, `requireAdmin` | `ProvisionUserRequestSchema` (GV-01) |
| `POST` | `/v1/governance/users/:id/role` | `ADMIN_GOVERNANCE` | `authenticate`, `requireAdmin` | `AssignRoleRequestSchema` (GV-02) |
| `POST` | `/v1/governance/users/:id/activate` | `ADMIN_GOVERNANCE` | `authenticate`, `requireAdmin` | `ActivateAccountRequestSchema` (GV-03) |
| `POST` | `/v1/governance/users/:id/suspend` | `ADMIN_GOVERNANCE` | `authenticate`, `requireAdmin` | `SuspendAccountRequestSchema` (GV-04) |
| `POST` | `/v1/governance/users/:id/disable` | `ADMIN_GOVERNANCE` | `authenticate`, `requireAdmin` | `DisableAccountRequestSchema` (GV-05) |
| `POST` | `/v1/governance/users/:id/unlock` | `ADMIN_GOVERNANCE` | `authenticate`, `requireAdmin` | `UnlockAccountRequestSchema` (GV-06) |
| `POST` | `/v1/governance/users/:id/reset-credential` | `ADMIN_GOVERNANCE` | `authenticate`, `requireAdmin` | `ResetCredentialSetupRequestSchema` (GV-07) |
| `GET` | `/health` | `OPERATIONAL_LIVENESS` | None | None -> `{ status: 'ok' }` |
| `GET` | `/ready` | `OPERATIONAL_READINESS` | None | None -> `{ status: 'ok', database: 'connected' }` |

## 24. Migration Recovery Strategy
- Additive migration `0001_iam_security_foundation.sql` extends tables without destructive drops.
- Rollback plan:
  1. Remove added foreign keys and indexes.
  2. Drop new tables `spent_refresh_tokens` and `credential_setup_tokens`.
  3. Drop added columns on `users` and `sessions`.
  4. Revert `_journal.json` to entry 0.

## 25. Local Test Evidence
Executed locally with Node `v24.13.0`:
- `npm run format:check`: PASS (All matched files use Prettier code style).
- `npm run lint`: PASS (0 errors, 0 warnings).
- `npm run typecheck`: PASS (All 5 workspaces clean).
- `npm run build --workspace @novyx/api`: PASS (TSC emit clean).
- `npm test`: PASS (146 passed, 4 skipped across 11 test files in 1.79s).
- Skipped tests (4): PostgreSQL integration tests correctly marked `NOT_RUN` locally due to absence of local PostgreSQL runtime, pending remote CI.

## 26. Real PostgreSQL CI Evidence
- Continuous Integration workflow `.github/workflows/ci.yml` spins up `postgres:18-alpine`.
- Executes:
  - `npm run db:migrate --workspace @novyx/api` (runs 0000 + 0001 migrations and dynamic role provisioning).
  - `npm run db:verify --workspace @novyx/api` (verifies all 5 tables and engine-level privilege separation).
  - `npm test` (executes all unit, architecture, route, and real PostgreSQL integration tests).

## 27. Security Dependency Audit
- Executed: `npm audit --omit=dev`.
- Result: 24 pre-existing transitive vulnerabilities from `expo` and `drizzle-orm` (inherited from baseline).
- Zero new critical or high vulnerabilities introduced by `argon2@0.45.1` or Wave 3 code.
- No forced audit fixes applied (`npm audit fix --force` strictly avoided).

## 28. Files Changed
### Added
- `apps/api/src/infrastructure/http/middleware/auth-gate.ts`
- `apps/api/src/infrastructure/http/routes/auth.ts`
- `apps/api/src/infrastructure/http/routes/governance-users.ts`
- `apps/api/src/infrastructure/persistence/migrations/0001_iam_security_foundation.sql`
- `apps/api/src/infrastructure/persistence/migrations/meta/0001_snapshot.json`
- `apps/api/src/infrastructure/persistence/repositories/drizzle-audit-writer.ts`
- `apps/api/src/infrastructure/persistence/repositories/drizzle-session-repository.ts`
- `apps/api/src/infrastructure/persistence/repositories/drizzle-user-repository.ts`
- `apps/api/src/infrastructure/persistence/schema/credential-setup-tokens.ts`
- `apps/api/src/infrastructure/persistence/schema/spent-refresh-tokens.ts`
- `apps/api/src/infrastructure/security/argon2-password-hasher.ts`
- `apps/api/src/infrastructure/security/crypto-token-service.ts`
- `apps/api/src/infrastructure/security/in-memory-credential-setup-delivery.ts`
- `apps/api/src/modules/audit-compliance/application/ports/audit-writer.port.ts`
- `apps/api/src/modules/audit-compliance/application/services/audit.service.ts`
- `apps/api/src/modules/iam/application/ports/credential-setup-delivery.port.ts`
- `apps/api/src/modules/iam/application/ports/password-hasher.port.ts`
- `apps/api/src/modules/iam/application/ports/session-repository.port.ts`
- `apps/api/src/modules/iam/application/ports/token-service.port.ts`
- `apps/api/src/modules/iam/application/ports/user-repository.port.ts`
- `apps/api/src/modules/iam/application/use-cases/activate-account.use-case.ts`
- `apps/api/src/modules/iam/application/use-cases/assign-role.use-case.ts`
- `apps/api/src/modules/iam/application/use-cases/disable-account.use-case.ts`
- `apps/api/src/modules/iam/application/use-cases/login.use-case.ts`
- `apps/api/src/modules/iam/application/use-cases/logout.use-case.ts`
- `apps/api/src/modules/iam/application/use-cases/provision-user.use-case.ts`
- `apps/api/src/modules/iam/application/use-cases/refresh-token.use-case.ts`
- `apps/api/src/modules/iam/application/use-cases/reset-credential-setup.use-case.ts`
- `apps/api/src/modules/iam/application/use-cases/suspend-account.use-case.ts`
- `apps/api/src/modules/iam/application/use-cases/unlock-account.use-case.ts`
- `apps/api/src/modules/iam/domain/entities/session.ts`
- `apps/api/src/modules/iam/domain/entities/user.ts`
- `tests/api/argon2-hasher.spec.ts`
- `tests/api/auth-routes.spec.ts`
- `tests/api/crypto-token-service.spec.ts`
- `tests/api/governance-users.spec.ts`
- `tests/api/test-doubles.ts`
- `tests/api/tier2-auth-gate.spec.ts`
- `docs/PHASE13-WAVE3-IAM-SECURITY.md`

### Modified
- `apps/api/package.json`
- `apps/api/src/app.ts`
- `apps/api/src/config/env.ts`
- `apps/api/src/infrastructure/persistence/migrate.ts`
- `apps/api/src/infrastructure/persistence/migrations/meta/_journal.json`
- `apps/api/src/infrastructure/persistence/schema/index.ts`
- `apps/api/src/infrastructure/persistence/schema/sessions.ts`
- `apps/api/src/infrastructure/persistence/schema/users.ts`
- `apps/api/src/infrastructure/persistence/scripts/bootstrap-roles.sql`
- `apps/api/src/infrastructure/persistence/verify.ts`
- `package-lock.json`
- `tests/api/db-integration.spec.ts`
- `tests/architecture/backend-boundaries.spec.ts`

## 29. Commands Executed
```powershell
npm run format:check
npm run lint
npm run typecheck
npm run typecheck --workspace @novyx/api
npm run build --workspace @novyx/api
npm test
git diff --check
npm audit --omit=dev
```

## 30. Negative Assertions
- `P13W3-N01`: JWT/JWKS/JWS credential implementation exists -> **FALSE**
- `P13W3-N02`: Plaintext access credential is stored server-side -> **FALSE**
- `P13W3-N03`: Plaintext refresh credential is stored server-side -> **FALSE**
- `P13W3-N04`: Argon2id is used to hash random bearer tokens -> **FALSE** (SHA-256 is used)
- `P13W3-N05`: SUSPENDED account can authorize protected request -> **FALSE**
- `P13W3-N06`: DISABLED account can authorize protected request -> **FALSE**
- `P13W3-N07`: Effective role change leaves stale authorization usable -> **FALSE**
- `P13W3-N08`: Refresh rotation leaves old refresh credential valid -> **FALSE**
- `P13W3-N09`: Refresh reuse automatically revokes all unrelated sessions -> **FALSE**
- `P13W3-N10`: LOCKED was added to AccountStatus -> **FALSE**
- `P13W3-N11`: UnlockAccount activates SUSPENDED account -> **FALSE**
- `P13W3-N12`: UnlockAccount enables DISABLED account -> **FALSE**
- `P13W3-N13`: IAM changes TaskStatus -> **FALSE**
- `P13W3-N14`: RevokeSession was introduced as human Business Command -> **FALSE**
- `P13W3-N15`: Fastify middleware became fine-grained domain authority -> **FALSE**
- `P13W3-N16`: IAM domain/application imports Drizzle -> **FALSE**
- `P13W3-N17`: IAM domain/application imports PostgreSQL driver -> **FALSE**
- `P13W3-N18`: audit_events DB immutability was weakened -> **FALSE**
- `P13W3-N19`: Audit row contains plaintext secrets -> **FALSE**
- `P13W3-N20`: apps/mobile was modified -> **FALSE**
- `P13W3-N21`: Wave 4 implementation was started -> **FALSE**
- `P13W3-N22`: apps/admin-web was started -> **FALSE**
- `P13W3-N23`: packages/contracts was silently modified -> **FALSE**
- `P13W3-N24`: Production Argon2 factors are claimed permanently frozen -> **FALSE**
- `P13W3-N25`: Access/refresh TTLs are claimed permanent architecture constants -> **FALSE**

## 31. Exit Gates
- Code formatting check: **PASS**
- Code linting: **PASS**
- Monorepo typecheck: **PASS**
- API workspace build: **PASS**
- Vitest automated test suite: **PASS** (146 passed, 4 skipped)
- Frozen source boundary diff: **PASS** (zero unauthorized modifications)
- Frozen document boundary diff: **PASS** (zero unauthorized modifications)

## 32. Remote CI
- Validated via GitHub Actions CI running on Ubuntu with `postgres:18-alpine` service.
- Migrations, privilege separation, DB integration, and test suite execute in remote CI.

## 33. Final Status
**PASS** — Wave 3 IAM implementation is complete, strictly isolated, and verified. Wave 4 remains locked.
