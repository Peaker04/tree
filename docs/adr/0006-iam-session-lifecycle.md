# ADR 0006: Identity & Access Management, Session Lifecycle & Role Administration

## Status
PROPOSED

## Context
The frozen business baseline (Phase 0–10) establishes a three-role human actor model (`staff`, `manager`, `admin`) and four canonical account lifecycle states (`INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`). A technical invariant strictly mandates that `LOCKED` is NOT an `AccountStatus`, but rather a temporary credential lock condition managed by the Identity & Access Management (IAM) bounded context (`CAP-ADM-04`, `BR-ADM-04`).

In the current AS-IS mobile implementation:
1. `apps/mobile/src/services/authSessionStore.ts` stores an `AuthSession` in `expo-secure-store`, consisting of `accessToken`, `refreshToken`, `expiresAt`, and a user object.
2. In `packages/contracts`, `UserRole = 'staff' | 'manager' | 'admin'` is declared, but `Role = 'Staff' | 'Manager'` is used by application code, omitting Admin.
3. No backend identity provider, token signing/verification specification, or session invalidation protocol is architecturally defined.
4. Silent refresh and account state revocation handling (`QAS-SEC-01`) are only mocked in development files.

## Frozen Business Drivers
- **Exact Canonical Roles:** `staff` (Field Staff), `manager` (Operations Manager), `admin` (Platform Administrator).
- **Exact Account Lifecycle States (`DR-HARD-05`, `CAP-ADM-03`):** `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`.
- **Credential Lock vs Account Status (`P7-SC-01`, `BR-ADM-04`):** An account whose credentials are temporarily locked due to repeated failed logins remains in `AccountStatus = ACTIVE`. Admin command `UnlockAccount` clears the temporary credential failure counter; `ResetCredentialSetup` issues a secure time-bounded setup link.
- **Immediate Effective Suspension & Role Revocation:**
  - `SUSPENDED`: Once suspension is effective, stale credentials/tokens must no longer authorize server-side product mutations. Login is blocked.
  - `DISABLED`: Permanent deactivation; all active sessions purged; cannot be unlocked without formal re-activation.
  - Role Change: When a user transitions roles (e.g., from `staff` to `manager`), past permissions must be immediately invalidated for future actions.
- **Separation of Duties (`SoD-01..07`, `DR-HARD-02`):** Users who transition from `staff` to `manager` cannot approve tasks they previously executed as staff. Historical action provenance is preserved.

## NFR / Quality Drivers
- **Security & Data Loss Prevention (`QAS-SEC-01`):** Access token expiration during field data entry must trigger silent token refresh using a valid refresh token ($\le 1\text{s}$). If refresh fails, local form drafts must be preserved in durable storage before redirecting to login.
- **Offline Field Continuity:** Field staff must remain operational in remote cellular dead zones without continuous online token verification for local drafts.
- **Secure Token Storage:** Tokens must be stored in encrypted, OS-protected storage (iOS Keychain / Android Keystore-backed storage via `expo-secure-store`).

## Current Technical Evidence
- `apps/mobile/src/services/authSessionStore.ts`: Uses `expo-secure-store` to persist session.
- `scripts/greenops-dev-api.cjs`: Mock login endpoint with static tokens; no verification of active account status or token revocation.
- External Technical Evidence: [Expo SecureStore Documentation](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/) states that data is stored in `SharedPreferences` encrypted with a key stored in Android Keystore on Android, and in the Keychain on iOS.

## Decision Question
How should the IAM boundary, authentication mechanism, session lifecycle, authorization freshness, and token storage be architected across mobile and admin clients?

## Options Considered

### Option A: Fully Stateful Server Sessions (Session Cookies / Central Session Store)
- **Description:** Traditional stateful sessions with HTTP-only cookies managed via a server-side session store (e.g., Redis or database session table).
- **Advantages:** Instant server-side revocation on account suspension; simple invalidation.
- **Disadvantages:**
  - Poor fit for mobile field clients: Cookie handling across native network boundaries can be brittle.
  - Incompatible with disconnected field continuity: Every client action requires an active online session lookup against central infrastructure.
  - Cross-origin cookie complexities between mobile native apps, web clients, and backend REST APIs.
- **Risks:** Field app lockouts during intermittent network disruptions.
- **Migration Impact:** High complexity for mobile networking.
- **Operational Impact:** Requires running and maintaining a high-availability session store cluster.

### Option B: Signed Short-Lived Access Token + Refresh Token Rotation + Authoritative Account Version Check [RECOMMENDED]
- **Description:**
  - **Access Token:** Short-lived asymmetric JWT (RS256/ES256; proposed parameter: 15 minutes, subject to security decision) containing `userId`, `role`, `accountStatus`, and `authVersion`.
  - **Refresh Credential:** Long-lived cryptographically random token (proposed parameter: 30 days, subject to security decision) stored in `expo-secure-store` on mobile and `HttpOnly; SameSite=Strict` cookie on Admin Web. Enforces Refresh Token Rotation (RTR) on every refresh request.
  - **Authoritative Authorization Freshness:**
    - To eliminate the security hole where a suspended user continues executing mutations for the remaining token lifetime:
      1. For non-mutating read requests, signature and expiry are validated locally by API middleware.
      2. For all **authoritative state-mutating commands** (e.g., `SubmitTaskEvidence`, `ReviewDecision`, `CancelTask`, `ReassignTask`, and all Governance commands), the server checks the user's authoritative `accountStatus === 'ACTIVE'` and compares `token.authVersion === user.authVersion`.
      3. Admin actions `SuspendAccount`, `DisableAccount`, or `RevokeRole` immediately increment `user.authVersion = user.authVersion + 1` in the database and invalidate the refresh token record.
      4. Any subsequent mutating command carrying a stale `authVersion` or issued by an account that is not `ACTIVE` is immediately rejected with `403 FORBIDDEN: ACCOUNT_SUSPENDED` or `403 FORBIDDEN: PRIVILEGE_REVOKED`.
  - **Offline Draft Preservation:** If a field worker's session is suspended while offline, local evidence drafts in SQLite remain intact on device, but any subsequent network sync mutation is authoritatively rejected by the server.
- **Advantages:**
  - **Guarantees Immediate Revocation:** Solves the stale JWT vulnerability on all authoritative state transitions without needing a distributed cache for read traffic.
  - **Fulfills `QAS-SEC-01`:** Client HTTP interceptor detects `401 UNAUTHENTICATED`, transparently calls `/v1/auth/refresh`, updates tokens, and retries the original request seamlessly ($\le 1\text{s}$).
  - **Field Continuity:** Field staff continue drafting work locally in cellular dead zones without continuous server pings.
- **Disadvantages:**
  - Mutating commands require a fast database lookup of `user.authVersion` (mitigated by indexed user table query or cached user state).
- **Risks:** Low; balances offline mobile operation with strict authoritative governance.
- **Migration Impact:** Formalizes `AuthSession` in `@novyx/contracts` and establishes standard interceptor logic.
- **Operational Impact:** Low; leverages relational database user record.

### Option C: Third-Party Managed Identity (Auth0 / Supabase Auth / Firebase)
- **Description:** Outsource authentication entirely to an external Identity-as-a-Service (IDaaS) provider.
- **Advantages:** Out-of-the-box password hashing, brute-force protection, and hosted login.
- **Disadvantages:**
  - Vendor lock-in and ongoing subscription costs.
  - Awkward synchronization with internal domain rules: Hard to map custom `AccountStatus` enums (`INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`) and specific `CAP-ADM-04` credential lock semantics to proprietary IDaaS models.
  - External network dependency for authentication in disconnected or private environments.
- **Risks:** Complex webhook synchronization and potential data divergence.
- **Migration Impact:** Replaces internal contracts with proprietary vendor SDKs.
- **Operational Impact:** External SLA dependency and recurring service costs.

## Proposed Decision
**Adopt Option B: Signed Short-Lived Access Token + Refresh Token Rotation + Authoritative Account Version Check.**
*Recommendation Confidence: MEDIUM (depends on final backend runtime topology per ADR 0013 and admin web setup per ADR 0005).*

1. **Authentication Boundary:**
   - Public auth endpoints: `POST /v1/auth/login`, `POST /v1/auth/refresh`, `POST /v1/auth/logout`, `POST /v1/auth/forgot-password`.
   - Governance IAM endpoints: `POST /v1/governance/users/*` (`CAP-ADM-01..04`).
2. **Token & Verification Specifications:**
   - Access Token payload: `{ sub: string, email: string, role: 'staff' | 'manager' | 'admin', accountStatus: 'ACTIVE', authVersion: number, exp: number, iat: number }`.
   - Signature: RS256 with public key distributed via JWKS (`/v1/.well-known/jwks.json`).
3. **Session Revocation & Authorization Freshness Mechanism:**
   - Database maintains `authVersion: number` and `accountStatus: string` on the `users` table.
   - Any execution of `SuspendAccount`, `DisableAccount`, or role change increments `authVersion` and deletes active refresh token records.
   - Server request boundary checks `authVersion` on every state-mutating command. If mismatched or if `accountStatus !== 'ACTIVE'`, the request is immediately rejected (`403 FORBIDDEN`).
4. **Proposed Lifetimes (Parameters Subject to Security Decision):**
   - Access Token TTL: Proposed 15 minutes (configurable; subject to formal security review).
   - Refresh Token TTL: Proposed 30 days with single-use rotation (configurable; subject to formal security review).
   - Password Setup Link TTL (`ResetCredentialSetup`): Proposed 24 hours (configurable; subject to formal security review).
5. **Client-Side Secure Storage:**
   - **Mobile (`apps/mobile`):** Tokens stored via `expo-secure-store` (utilizing Android Keystore-protected SharedPreferences on Android, and Keychain on iOS).
   - **Admin Web (`apps/admin-web`):** Refresh token in `HttpOnly, Secure, SameSite=Strict` cookie; access token kept in browser memory.

## Rationale
Option B eliminates the security vulnerability of stale JWT tokens on state mutations while preserving seamless offline mobile drafting for field personnel. It provides authoritative revocation without the distributed complexity of external session stores.

## Consequences
- **Positive:** Full alignment with `QAS-SEC-01` (silent refresh), frozen business rules (`CAP-ADM-01..04`), and strict Separation of Duties. Zero vendor lock-in.
- **Negative:** Backend must maintain token issuance, refresh token rotation, and `authVersion` validation on mutating commands.
- **Neutral:** Mobile client requires an Axios/Fetch network interceptor for automated 401 refresh handling.

## Security Impact
- Tokens protected in OS-encrypted storage on devices.
- Single-use Refresh Token Rotation mitigates token replay.
- Suspension and role changes immediately block subsequent state mutations at the server boundary.

## Offline / Reliability Impact
- Valid access tokens allow offline field operations to continue locally.
- Local form drafts are preserved in durable SQLite storage if session renewal fails permanently.

## Contract Impact
- Update `@novyx/contracts`:
  - Standardize `AuthSession` with explicit token expiration metadata.
  - Add `RefreshTokenRequest { refreshToken: string }` and `RefreshTokenResponse { accessToken: string, refreshToken: string, expiresAt: string }`.
  - Standardize `AccountStatus` enum: `'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED'`.

## Migration / Compatibility
- Existing `authSessionStore.ts` already uses `expo-secure-store`.
- Update `greenOpsService.ts` / `RestApiAdapter` to implement 401 retry interceptor.

## Rejected Alternatives
- **Option A (Stateful Sessions):** Incompatible with offline mobile architecture.
- **Option C (Third-Party IDaaS):** Incompatible with custom domain governance requirements and cost constraints.

## Open Questions
1. Should password hashing strictly require Argon2id or bcrypt? (Argon2id recommended per OWASP Password Storage Cheat Sheet).
2. What are the final approved TTL values for access tokens and refresh tokens in production? (To be decided during security review).

## Owner Decision Required
- [ ] **APPROVE** Option B (Signed Short-Lived Access Token + Refresh Token Rotation + Authoritative Account Version Check).
- [ ] **REJECT** and mandate alternative option.
- [ ] **REQUEST_REVISION** with specific modifications.
