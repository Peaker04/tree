# ADR 0006: Identity & Access Management, Session Lifecycle & Role Administration

## Status
PROPOSED

## Context
The frozen business baseline (Phase 0–10) establishes a three-role human actor model (`staff`, `manager`, `admin`) and four canonical account lifecycle states (`INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`). A technical invariant strictly mandates that `LOCKED` is NOT an `AccountStatus`, but rather a temporary credential lock condition managed by the Identity & Access Management (IAM) bounded context (`CAP-ADM-04`, `BR-ADM-04`).

In the current AS-IS mobile implementation:
1. `apps/mobile/src/services/authSessionStore.ts` stores an `AuthSession` in `expo-secure-store`, consisting of `accessToken`, `refreshToken`, `expiresAt`, and a user object.
2. In `packages/contracts`, `UserRole = 'staff' | 'manager' | 'admin'` is declared, but `Role = 'Staff' | 'Manager'` is used by application code, omitting Admin.
3. No backend identity provider, token signing/verification specification, or session invalidation protocol is architecturally defined.
4. Silent refresh and account state revocation handling (`QAS-SEC-01`) are only mocked.

## Frozen Business Drivers
- **Exact Canonical Roles:** `staff` (Field Staff), `manager` (Operations Manager), `admin` (Platform Administrator).
- **Exact Account Lifecycle States (`DR-HARD-05`, `CAP-ADM-03`):** `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`.
- **Credential Lock vs Account Status (`P7-SC-01`, `BR-ADM-04`):** An account whose credentials are temporarily locked due to repeated failed logins remains in `AccountStatus = ACTIVE`. Admin command `UnlockAccount` clears the temporary credential failure counter; `ResetCredentialSetup` issues a secure time-bounded setup link.
- **Account State Enforcement:**
  - `SUSPENDED`: Immediate session revocation; login blocked; cannot execute operational or governance commands.
  - `DISABLED`: Permanent deactivation; all active sessions purged; cannot be unlocked without formal re-activation.
- **Separation of Duties (`SoD-01..07`, `DR-HARD-02`):** Users who transition from `staff` to `manager` cannot approve tasks they previously executed as staff.

## NFR / Quality Drivers
- **Security & Data Loss Prevention (`QAS-SEC-01`):** Access token expiration during field data entry must trigger silent token refresh using a valid refresh token ($\le 1\text{s}$). If refresh fails, local form drafts must be preserved in durable storage before redirecting to login.
- **Offline Field Authentication:** Field staff must remain authenticated and operational in remote cellular dead zones without continuous online token verification.
- **Secure Token Storage:** Tokens must be stored in hardware-backed secure storage (iOS Keychain / Android Keystore via `expo-secure-store`).

## Decision Question
How should the IAM boundary, authentication mechanism, session lifecycle, and token storage be architected across mobile and admin clients?

## Options Considered

### Option A: Stateful Server Sessions (Session Cookies / Redis Session Store)
- **Description:** Traditional stateful sessions with HTTP-only cookies managed via a server-side session store (Redis).
- **Advantages:** Instant server-side revocation on account suspension; simple backend invalidation.
- **Disadvantages:**
  - Poor fit for offline mobile clients: Cookie handling across native network boundaries can be brittle.
  - Incompatible with disconnected field operations: Every request requires online session lookup against central Redis.
  - Cross-origin cookie complexities between mobile native apps, web clients, and backend REST APIs.
- **Risks:** Field app failures during intermittent network disruptions.
- **Migration Impact:** High complexity for mobile networking.
- **Operational Impact:** Requires running and scaling a high-availability Redis cluster.

### Option B: Stateless JWT + Refresh Token Rotation with Blacklist/Version Cache [RECOMMENDED]
- **Description:**
  - Short-lived asymmetric JWT Access Tokens (RS256/ES256, lifetime: 15 minutes) containing `userId`, `role`, `accountStatus`, and a `tokenVersion` / `sessionVersion`.
  - Long-lived cryptographically random Refresh Tokens (lifetime: 30 days) stored securely in `expo-secure-store` on mobile and `HttpOnly; SameSite=Strict` cookies on Admin Web.
  - Refresh token rotation (RTR) on every refresh request to prevent replay attacks.
  - Server maintains a lightweight `user_session_state` (or user table column `tokenVersion: number`, `accountStatus: string`) checked during token refresh and critical state mutations.
- **Advantages:**
  - Fully supports offline field use: Mobile client validates local access token expiration locally; doesn't need constant server ping for offline draft creation.
  - Meets `QAS-SEC-01`: Client HTTP interceptor detects `401 UNAUTHENTICATED`, transparently triggers `/v1/auth/refresh`, updates tokens, and retries the original request seamlessly.
  - Rapid revocation: Bumping `tokenVersion` upon `SuspendAccount` or `DisableAccount` immediately invalidates all refresh tokens and blocks subsequent access token issuance.
  - Asymmetric keys allow any backend microservice or gateway to verify tokens offline without hitting a central auth database.
- **Disadvantages:**
  - Access tokens remain valid for their short lifetime (15 mins) after suspension unless an active revocation list is queried for high-risk endpoints.
- **Risks:** Token leakage if secure storage is compromised (mitigated by OS hardware keystore and short expiry).
- **Migration Impact:** Directly formalizes and hardens the existing `AuthSession` interface in `@novyx/contracts`.
- **Operational Impact:** Standard stateless JWT infrastructure; minimal database overhead (only hits DB during login and 15-minute refresh).

### Option C: Third-Party Managed Identity (Auth0 / Firebase / Supabase Auth)
- **Description:** Outsource authentication entirely to a cloud Identity-as-a-Service (IDaaS) provider.
- **Advantages:** Pre-built MFA, email verification, password reset flows, and compliance certifications.
- **Disadvantages:**
  - Vendor lock-in and ongoing per-user cost.
  - Difficult to enforce exact custom domain rules (e.g., specific `AccountStatus` enums, custom `CAP-ADM-04` credential lock behavior, strict audit logging of auth events into internal `AuditEvent` store).
  - External network dependency for authentication in developing regions or private infrastructure.
- **Risks:** Complex webhook synchronization to keep user records in sync with internal domain tables.
- **Migration Impact:** Replaces existing contract types with third-party SDKs.
- **Operational Impact:** Recurring vendor fees and external SLA dependencies.

## Proposed Decision
**Adopt Option B: Stateless Asymmetric JWT + Refresh Token Rotation with Session Versioning.**

1. **Authentication Boundary:**
   - Auth endpoints live under `/v1/auth`: `POST /login`, `POST /refresh`, `POST /logout`, `POST /forgot-password`.
   - Admin governance endpoints live under `/v1/governance/users` (`CAP-ADM-01..04`).
2. **Token Structure:**
   - Access Token payload: `{ sub: string, email: string, role: 'staff' | 'manager' | 'admin', accountStatus: 'ACTIVE', tokenVersion: number, exp: number, iat: number }`.
   - Signature: RS256 with public key distributed via JWKS (`/v1/.well-known/jwks.json`).
3. **Session Enforcement:**
   - Account state `SUSPENDED` or `DISABLED` increments `tokenVersion` on the user record and invalidates the refresh token record.
   - On the next refresh attempt (within 15 minutes), the server rejects the refresh request with `FORBIDDEN: ACCOUNT_SUSPENDED`.
4. **Client Storage:**
   - Mobile: `accessToken` and `refreshToken` stored in `expo-secure-store` (`authSessionStore.ts`).
   - Admin Web: `accessToken` in memory, `refreshToken` in `HttpOnly, Secure, SameSite=Strict` cookie.

## Rationale
Option B provides the ideal balance between offline mobile autonomy, security, and low operational overhead. Field staff can operate with short-lived tokens in disconnected environments without latency penalties, while Refresh Token Rotation and `tokenVersion` checks ensure that administrative account suspensions (`CAP-ADM-03`) take effect promptly.

## Consequences
- **Positive:** Full alignment with `QAS-SEC-01` (silent refresh) and frozen business rules (`CAP-ADM-01..04`). Zero client vendor lock-in.
- **Negative:** Backend must implement token generation, refresh rotation, and public key management.
- **Neutral:** Mobile client needs an Axios/Fetch network interceptor for automated 401 refresh handling.

## Security Impact
- Tokens protected by hardware-backed storage on device.
- Mitigates replay attacks via one-time-use refresh tokens.
- Immediate lockout of compromised credentials upon Admin `SuspendAccount` or `DisableAccount`.

## Offline / Reliability Impact
- Access token validity allows offline field operations to continue uninterrupted.
- Local form drafts are saved before logout if session refresh fails permanently.

## Contract Impact
- Update `@novyx/contracts`:
  - Standardize `AuthSession` with explicit token expiration metadata.
  - Add `RefreshTokenRequest { refreshToken: string }` and `RefreshTokenResponse { accessToken: string, refreshToken: string, expiresAt: string }`.
  - Add `AccountStatus` enum: `'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED'`.

## Migration / Compatibility
- Existing `authSessionStore.ts` already stores `AuthSession` in `expo-secure-store`.
- Update `greenOpsService.ts` to implement 401 retry interceptor.

## Rejected Alternatives
- **Option A (Stateful Sessions):** Incompatible with offline mobile architecture.
- **Option C (Third-Party IDaaS):** Incompatible with custom domain governance requirements and cost constraints.

## Open Questions
1. Should password hashing strictly require Argon2id or bcrypt? (Argon2id recommended per OWASP).
2. What is the exact expiration window for the secure credential setup link issued by `ResetCredentialSetup`? (Recommended: 24 hours).

## Owner Decision Required
- [ ] **APPROVE** Option B (Asymmetric JWT + Refresh Token Rotation).
- [ ] **REJECT** and mandate alternative option.
- [ ] **REQUEST_REVISION** with specific modifications.
