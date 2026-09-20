# ADR 0006: Identity & Access Management, Session Lifecycle & Role Administration

## Status
ACCEPTED

## Acceptance Scope

ACCEPTED:

1. Canonical AccountStatus remains exactly:
   - `INVITED`
   - `ACTIVE`
   - `SUSPENDED`
   - `DISABLED`

2. Temporary credential lock is NOT AccountStatus.

3. Every protected authenticated server request:
   - READ
   - MUTATE
   - DECIDE
   - ADMINISTER
   must establish current authoritative authorization state.

4. `SUSPENDED`: protected requests DENY.

5. `DISABLED`: protected requests DENY.

6. Effective role change: stale privilege DENY.

7. Refresh credentials rotate.

8. Server-side revocation/freshness is authoritative.

9. Mobile offline drafts remain locally preservable without implying online authorization.

NOT LOCKED BY THIS ADR:
- opaque access token vs JWT
- HS256
- RS256
- ES256
- JWKS
- exact access credential TTL
- exact refresh credential TTL
- Redis/cache technology
- password hashing algorithm choice

These are bounded security implementation decisions unless separately governed later.

## Context
The frozen business baseline (Phase 0–10) establishes a three-role human actor model (`staff`, `manager`, `admin`) and four canonical account lifecycle states (`INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`). A technical invariant strictly mandates that `LOCKED` is NOT an `AccountStatus`, but rather a temporary credential lock condition managed by the Identity & Access Management (IAM) bounded context (`CAP-ADM-04`, `BR-ADM-04`).

In the current AS-IS mobile implementation:
1. `apps/mobile/src/services/authSessionStore.ts` stores an `AuthSession` in `expo-secure-store`, consisting of `accessToken`, `refreshToken`, `expiresAt`, and a user object.
2. In `packages/contracts`, `UserRole = 'staff' | 'manager' | 'admin'` is declared, but `Role = 'Staff' | 'Manager'` is used by application code, omitting Admin.
3. No backend identity provider, credential verification specification, or session invalidation protocol is architecturally defined.
4. Silent refresh and account state revocation handling (`QAS-SEC-01`) are only mocked in development files.

## Frozen Business Drivers
- **Exact Canonical Roles:** `staff` (Field Staff), `manager` (Operations Manager), `admin` (Platform Administrator).
- **Exact Account Lifecycle States (`DR-HARD-05`, `CAP-ADM-03`):** `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`.
- **Credential Lock vs Account Status (`P7-SC-01`, `BR-ADM-04`):** An account whose credentials are temporarily locked due to repeated failed logins remains in `AccountStatus = ACTIVE`. Admin command `UnlockAccount` clears the temporary credential failure counter; `ResetCredentialSetup` issues a secure time-bounded setup link.
- **Immediate Effective Suspension & Role Revocation (`WF-12`):**
  - `SUSPENDED`: Once suspension is effective, stale credentials/tokens must no longer authorize ANY protected authenticated server action (READ, MUTATE, DECIDE, ADMINISTER). Login is blocked.
  - `DISABLED`: Permanent deactivation; all active sessions purged; cannot be unlocked without formal re-activation.
  - Role Change: When a user transitions roles (e.g., from `staff` to `manager`), past privileges cannot authorize subsequent protected requests.
- **Separation of Duties (`SoD-01..07`, `DR-HARD-02`):** Users who transition from `staff` to `manager` cannot approve tasks they previously executed as staff. Historical action provenance is preserved.

## NFR / Quality Drivers
- **Security & Data Loss Prevention (`QAS-SEC-01`):** Access credential expiration during field data entry must trigger silent token refresh using a valid refresh credential ($\le 1\text{s}$). If refresh fails, local form drafts must be preserved in durable storage before redirecting to login.
- **Offline Field Continuity:** Field staff must remain operational in remote cellular dead zones without continuous online credential verification for local drafts. Offline drafting is local to the device and independent of server credential representation.
- **Secure Credential Storage:** Sensitive credentials must be stored in encrypted, OS-protected storage (iOS Keychain / Android Keystore-backed storage via `expo-secure-store` on mobile; `HttpOnly; Secure; SameSite=Strict` cookies on web).

## Current Technical Evidence
- `apps/mobile/src/services/authSessionStore.ts`: Uses `expo-secure-store` to persist session.
- `scripts/greenops-dev-api.cjs`: Mock login endpoint with static tokens; no verification of active account status or token revocation.
- External Technical Evidence: [Expo SecureStore Documentation](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/) states that data is stored in `SharedPreferences` encrypted with a key stored in Android Keystore on Android, and in the Keychain on iOS.

## Decision Question
How should the IAM boundary, authentication mechanism, session lifecycle, authorization freshness across protected reads and mutations, and credential storage be architected across mobile and admin clients?

## Architectural Analysis & Comparison of Credential Representations

The Owner's Batch 1 review confirmed that **authoritative freshness verification across all protected server actions is non-negotiable**. Because the server must establish that the user's `accountStatus === 'ACTIVE'` and authorization version is current on every protected request, authorization is fundamentally server-authoritative.

We compare two primary technical options for the access credential:

### Option A: Opaque Short-Lived Access Token + Authoritative Session Lookup
- **Description:** Server issues a cryptographically random, high-entropy opaque string (e.g., 256-bit token) as the access credential. The server validates this token by looking up the active session record in a fast indexed database table or in-memory cache.
- **Advantages:**
  - Complete control and instantaneous revocation: Deleting the session record immediately invalidates the credential everywhere.
  - Minimal payload size transferred in HTTP `Authorization` headers.
  - No cryptographic key management or asymmetric key rotation overhead.
- **Disadvantages:**
  - Every API request requires a server-side state lookup (though this lookup is already required for `authVersion` and `accountStatus` freshness).
- **Offline Assessment:** Completely compatible with offline drafting. Field workers draft in local SQLite; online sessions are only engaged when transmitting outbox payloads to the server.

### Option B: Signed Short-Lived Access Token (JWT) + Authoritative Account/AuthVersion Freshness Lookup
- **Description:** Server issues a signed JWT containing user claims (`sub`, `role`, `accountStatus`, `authVersion`, `exp`). On protected requests, middleware validates signature and expiration, then queries user state to verify `accountStatus === 'ACTIVE'` and `token.authVersion === user.authVersion`.
- **Advantages:**
  - Token carries verified identity claims in memory, reducing redundant joins for basic user attributes (e.g., email, role).
  - Standardized tooling across web and mobile ecosystems.
- **Disadvantages:**
  - **Does NOT make requests stateless:** Because `WF-12` mandates immediate revocation for suspended accounts across all protected actions, a valid cryptographic signature alone is insufficient. The server must still query authoritative state.
  - Asymmetric signing (RS256/ES256) and JWKS distribution add cryptographic complexity without architectural necessity when verifying requests within a single Modular Monolith backend (`ADR 0013`).
- **Offline Assessment:** Identical to Option A; offline continuity is managed entirely by client-side local storage (`ADR 0008`).

### Option C: Third-Party Managed Identity (Auth0 / Supabase Auth / Firebase)
- **Description:** Outsource authentication entirely to an external Identity-as-a-Service (IDaaS) provider.
- **Evaluation:** Rejected due to vendor lock-in, recurring subscription costs, and friction mapping custom domain lifecycle states (`INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`) and credential lock semantics (`CAP-ADM-04`).

## Proposed Decision (Revised Candidate Pending Final Owner Review)
**Adopt a Server-Authoritative Session Architecture with Short-Lived Access Credentials, Rotating Refresh Credentials, and Mandatory Authorization Freshness Verification.**
*Recommendation Confidence: HIGH (revised per Owner Decision Batch 1 to avoid premature token-type lock-in).*

1. **Non-Negotiable Security Semantics (Architecture Invariants):**
   - **Four Canonical Account States:** `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED`.
   - **Credential Lock Independence:** Repeated failed login attempts trigger a temporary credential lock (`CAP-ADM-04`) while `AccountStatus` remains `ACTIVE`. `UnlockAccount` clears the lock counter; `ResetCredentialSetup` generates a secure link.
   - **Comprehensive Revocation across All Protected Actions (`WF-12`):**
     - For **EVERY PROTECTED AUTHENTICATED SERVER REQUEST** (whether READ like `ViewAssignedTask`, `ViewOperationalTask`, `ViewCareHistory`, `ViewAuditLog`, or MUTATE like `SubmitEvidence`, `ReviewTask`, and Governance actions):
       - Server request boundary middleware establishes that the calling user's authoritative `accountStatus === 'ACTIVE'` and verifies that their current `authVersion` / `sessionVersion` matches the active server state.
       - `SUSPENDED`: Server immediately rejects request with `403 FORBIDDEN: ACCOUNT_SUSPENDED`.
       - `DISABLED`: Server immediately rejects request with `403 FORBIDDEN: ACCOUNT_DISABLED`.
       - Role Change or Revocation: Server immediately rejects request with `403 FORBIDDEN: PRIVILEGE_REVOKED`.
     - Stale credentials/tokens alone never authorize protected requests.
   - **Offline Draft Preservation:** An offline device preserves local SQLite drafts and captured evidence. Offline persistence does NOT confer server authorization: at the next online server interaction, authoritative IAM state governs, and unauthorized requests are rejected.
2. **Credential Lifecycle & Rotation:**
   - **Access Credential:** Short-lived (proposed parameter: 15 minutes, subject to security review).
   - **Refresh Credential:** Long-lived (proposed parameter: 30 days, subject to security review) with mandatory **Refresh Token Rotation (RTR)**. Every refresh request issues a new refresh credential and invalidates the previous one. Detected reuse of an invalidated refresh credential triggers immediate revocation of all sessions for that user.
   - Admin actions `SuspendAccount`, `DisableAccount`, or role changes immediately increment `user.authVersion = user.authVersion + 1` and purge all active refresh records.
3. **Access Credential Representation (Bounded Technical Choice):**
   - The choice between **Opaque Short-Lived Token** (Option A) and **Signed Short-Lived JWT** (Option B) is retained as a bounded technical choice to be finalized during security implementation planning.
   - Asymmetric JWT / JWKS is NOT an architecture invariant for the single Modular Monolith deployment (`ADR 0013`). If JWT is selected during implementation, symmetric signing (HS256) or asymmetric signing (RS256) may be evaluated based on verified performance and operational needs.
4. **Client-Side Secure Storage:**
   - **Mobile (`apps/mobile`):** Refresh and access credentials persisted exclusively via `expo-secure-store` (Android Keystore / iOS Keychain).
   - **Admin Web (`apps/admin-web`):** Refresh credentials stored in `HttpOnly; Secure; SameSite=Strict` cookies; access credentials held in application memory.

## Rationale
This revised decision focuses on what is architecturally vital: absolute compliance with `WF-12` revocation across reads and mutations, Separation of Duties, and offline draft preservation, while deliberately avoiding over-specifying token representations (such as mandating RS256 and JWKS) before implementation requirements demand them.

## Consequences
- **Positive:** Complete defense against stale credential replay across all protected endpoints; fully satisfies `WF-12`; preserves local mobile drafts; eliminates unnecessary cryptographic complexity.
- **Negative:** Server must perform an indexed account status check on every protected request.
- **Neutral:** Token format can be finalized during Phase 12 security implementation without altering client/server API contracts.

## Security Impact
- Eliminates the stale token vulnerability window for both sensitive reads and state mutations.
- Refresh token rotation prevents long-lived credential hijacking.

## Offline / Reliability Impact
- Seamless offline field continuity: field workers continue drafting locally without continuous server polling.
- Transparent silent token refresh ($\le 1$s) satisfies `QAS-SEC-01`.

## Contract Impact
- Standardize in `@novyx/contracts`:
  - `AccountStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED'`.
  - `AuthSession`, `RefreshTokenRequest`, `RefreshTokenResponse`.

## Open Questions
1. Should password hashing strictly require Argon2id or bcrypt? (Argon2id recommended per OWASP standards).
2. What are the final approved TTL values for access credentials and refresh credentials? (To be decided during security review).
3. Which access credential representation (opaque token vs signed JWT) is preferred during implementation? (Bounded technical choice).

## Owner Decision Record
- **Owner Decision:** APPROVED — REVISED CANDIDATE
- **Accepted Decision:** Server-authoritative session architecture with short-lived access credential, rotating refresh credential, and mandatory authorization freshness.
- **Historical Note:** Batch 1 requested revision to remove premature token format lock-in; Batch 2 confirmed final approval of the revised server-authoritative candidate.
