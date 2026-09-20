# PHASE 11B — ARCHITECTURE DECISION OWNER REVIEW PACKET

**Document Version:** 1.0.0
**Status:** OWNER REVIEW READY
**Repository Branch:** `base-setup`
**Reference Baseline Commit:** `56ed66d4a21cf980368cff016fc5df3397e2be0f`
**Target Candidate Set:** ADRs `0005` through `0013` (all currently in status `PROPOSED`)

---

## 1. Executive Summary & Review Protocol

### 1.1 Purpose of Phase 11B
This document serves as the authoritative **Owner Architecture Review Packet** for NOVYX GreenOps Phase 11B. Following the complete freeze of the Business Baseline (Phases 0–10) and technical gap closure (Phase 11A), this packet organizes, analyzes, and evaluates candidate Architecture Decision Records (`ADR 0005` through `ADR 0013`) to enable the System Owner to execute informed, binding architecture decisions (`APPROVE`, `REJECT`, or `REQUEST_REVISION`).

### 1.2 Strict Review Boundaries
In strict accordance with project governance rules:
1. **Zero Automated Acceptance:** Antigravity does NOT mark any ADR as `ACCEPTED` or choose architecture unilaterally for the Owner.
2. **Zero Code Implementation:** No source code in `apps/**` or `packages/**` is modified or introduced in Phase 11B.
3. **Zero Business Baseline Drift:** The frozen business documentation (`PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `REQUIREMENTS-TRACEABILITY.md`, `docs/business-reconciliation/**`), diagrams (`docs/diagrams/**`), and canonical `ARCHITECTURE.md` are 100% immutable.
4. **Historical ADR Integrity:** Existing foundational ADRs (`ADR 0001` through `ADR 0004`) remain untouched in their accepted state.
5. **State Invariant:** All 9 candidate ADRs (`0005..0013`) remain strictly in `Status: PROPOSED`.

### 1.3 Evaluation Rating Scale
Every ADR is evaluated against 13 objective architectural dimensions using the four-level qualitative rating scale (no synthetic weighted scores):
- **`STRONG`**: Excellently aligned with business drivers, NFRs, and repository context; minimal risk; high confidence.
- **`ACCEPTABLE`**: Fully viable and meets requirements; standard engineering trade-offs present; manageable risks.
- **`WEAK`**: Significant architectural compromises, excessive complexity, or potential maintainability friction; requires careful Owner scrutiny.
- **`BLOCKED`**: Fundamental contradiction with frozen baseline or unresolvable technical hurdle (no candidate ADR currently in this state).

### 1.4 Dependency Gate Protocol (`DEPENDENCY_PENDING`)
When an architectural decision logically depends on the prior determination of an upstream foundation decision, it is designated as **`DEPENDENCY_PENDING`** rather than failed. This explicitly informs the Owner of the natural evaluation and approval sequencing.

---

## 2. Executive Owner Decision Table

The 9 candidate ADRs are ordered below by architectural dependency hierarchy, progressing from foundational runtime and client surfaces up through security, consistency, and compliance:

| ADR | Decision Title | Recommended Candidate | Confidence | Primary Risk / Trade-off | Upstream Dependency | Owner Decision |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **0013** | Backend Runtime & Relational Persistence Topology | **Option A:** Modular Monolith (`apps/api`) + Relational DB Family | `MEDIUM` | Monolith discipline required to prevent ad-hoc cross-module SQL coupling | Independent Foundation | **APPROVED** |
| **0005** | Platform Administrator Client Delivery Topology | **Option B:** Dedicated Admin Web App (`apps/admin-web`) | `MEDIUM` | Second frontend workspace in monorepo; CI/CD pipeline expansion | Independent Foundation | **APPROVED** |
| **0010** | Contract Evolution & Runtime Schema Validation | **Option B:** Zod Schema-First Contracts in `@novyx/contracts` | `HIGH` | Zod runtime bundle size overhead (~14KB min/gzip) | Independent Foundation | **REQUEST_REVISION** |
| **0006** | IAM, Session Lifecycle & Role Administration | **Option B:** Signed Access Token + Refresh Rotation + AuthVersion Gate | `MEDIUM` | Freshness check required on all protected server actions (Reads & Mutations) | `ADR 0013`, `ADR 0005` | **REQUEST_REVISION** |
| **0007** | Multi-Tier Authorization Enforcement | **Option B:** Multi-Tier Defense-in-Depth (Client Advisory, HTTP Gate, Domain Core) | `HIGH` | Maintenance of eligibility rules across both advisory client and domain core | `ADR 0006`, `ADR 0010` | **APPROVED** |
| **0012** | Clean Architecture Layering & Facade Decomposition | **Option B:** Pragmatic Ports & Adapters within Monorepo | `HIGH` | Refactoring effort to untangle existing 856-line `greenOpsService` facade | `ADR 0007`, `ADR 0008` | **APPROVED** |
| **0008** | Mobile Offline Durable Storage & Outbox | **Option B:** `expo-sqlite` Relational Outbox + Sandbox Filesystem Photos | `HIGH` | SQLite schema migration management; empirical verification required | Independent Mobile | **REQUEST_REVISION** |
| **0009** | Concurrency Control & Idempotency Strategy | **Option B:** Command Payload OCC (`expectedVersion`) + Header Idempotency | `HIGH` | Server must maintain idempotency cache; clients must handle `409 CONFLICT` | `ADR 0008`, `ADR 0010` | **APPROVED** |
| **0011** | Audit Trail Persistence & Integrity Architecture | **Option B:** Database Privilege Separation + Stream Hash-Chaining | `MEDIUM` | Hash-chaining adds overhead; does not defend against root DBA without external anchor | `ADR 0013` | **REQUEST_REVISION** |

*Note: Owner Decisions recorded per Decision Batch 1 (Baseline Commit: `8e73f71c478a5ca7d58d7b7ffb2f132b2c92cedc`).*

---

## 3. Detailed Review Analysis by Dependency Group

```
                    ┌────────────────────────────────────────┐
                    │          GROUP A: FOUNDATION           │
                    │   ADR 0013: Backend Runtime & Topology │
                    │   ADR 0005: Admin Client Topology      │
                    │   ADR 0010: Contracts & Zod Validation │
                    └───────────────────┬────────────────────┘
                                        │
                    ┌───────────────────▼────────────────────┐
                    │      GROUP B: SECURITY & AUTHORITY     │
                    │   ADR 0006: IAM & Session Lifecycle    │
                    │   ADR 0007: Authorization Enforcement  │
                    │   ADR 0012: Clean Arch Layering        │
                    └───────────────────┬────────────────────┘
                                        │
                    ┌───────────────────▼────────────────────┐
                    │   GROUP C: OFFLINE & CONCURRENCY       │
                    │   ADR 0008: Mobile Offline & Outbox    │
                    │   ADR 0009: Concurrency & Idempotency  │
                    └───────────────────┬────────────────────┘
                                        │
                    ┌───────────────────▼────────────────────┐
                    │           GROUP D: AUDIT               │
                    │   ADR 0011: Audit Persistence          │
                    └────────────────────────────────────────┘
```

---

### GROUP A — FOUNDATION ARCHITECTURE

#### ADR 0013: Backend Runtime & Relational Persistence Topology

##### 1. Decision Question
What production server application runtime and persistence topology should be selected to provide the authoritative API and domain execution boundary for NOVYX GreenOps?

##### 2. Recommended Option
**Option A: Modular Monolith Backend Application (`apps/api`) + Relational Database Family**
- Single deployable backend workspace in Node.js / TypeScript within the existing monorepo.
- Internally structured into 5 cohesive modules matching the 5 Bounded Contexts.
- Single relational database instance (e.g., PostgreSQL-compatible relational engine).
- In-process domain calls and scoped technical ACID transactions across workflows.

##### 3. Critical Architectural Analysis
- **Monorepo & TypeScript Fit:** Outstanding synergy with `@novyx/contracts`. Frontend and backend share exact Zod schemas and DTO types with zero translation or code generation layers.
- **ACID Requirements & Scoped Transactions:** Critical technical workflows (e.g., updating task state, registering evidence metadata, enqueueing audit events, and advancing version counters) require atomic database transactions. Option A provides this natively via relational database transactions without distributed transaction protocols.
- **Authoritative Boundary Rule:** Bounded Contexts represent logical domain boundaries, NOT physical microservices or separate databases. The shared relational database is a proposed technical deployment convenience; it **does NOT permit one module to bypass another module's domain ownership via direct SQL mutation**. Cross-context operations must invoke application use case interfaces.
- **Foreign Key vs Business Authority:** Foreign Keys enforce referential integrity at the storage layer; they do NOT confer mutation authority.
- **Vendor Neutrality:** Relational topology is specified at the architectural family level; PostgreSQL is recommended for production, but concrete database engine selection is an implementation-level detail unless the Owner chooses to lock it now.

##### 4. Comprehensive 13-Dimension Owner Evaluation
| Dimension | Rating | Rationale |
| :--- | :---: | :--- |
| **Business Fit** | `STRONG` | Direct mapping to the 5 Bounded Contexts and authoritative server boundary (`DOMAIN.md §2-3`). |
| **NFR Fit** | `STRONG` | Satisfies latency targets (`QAS-PERF-01`, `QAS-SEC-01` $\le 1$s) and atomicity needs without network hops. |
| **Security** | `STRONG` | Centralizes authentication, authorization, and audit logging within a single secure perimeter. |
| **Reliability** | `STRONG` | Zero distributed network partition failure modes; standard relational backup and recovery. |
| **Offline Fit** | `STRONG` | Provides fast, predictable ingestion endpoints for mobile Outbox sync batches. |
| **Maintainability** | `STRONG` | Single repository, uniform TypeScript tooling, straightforward debugging and observability. |
| **Testability** | `STRONG` | Enables fast in-memory integration testing and local mock server replacement via `npm run api:dev`. |
| **Implementation Complexity** | `ACCEPTABLE` | Low; standard Express/Fastify modular backend with clean module boundaries. |
| **Operational Complexity** | `STRONG` | Minimal; single container artifact and single managed relational database instance. |
| **Current Repository Fit** | `STRONG` | `package.json` workspace is already designed to host `apps/api` alongside `apps/mobile`. |
| **Dependency Readiness** | `STRONG` | Foundational ADR with zero upstream architectural blockers. |
| **Open Questions** | `ACCEPTABLE` | Specific DB engine (PostgreSQL recommended) and HTTP framework (Fastify/Express) open for implementation. |
| **Reversibility** | `ACCEPTABLE` | Cleanly separated internal modules allow future extraction into microservices if extreme scale dictates. |

##### 5. Owner Decision Packet
- **Why it fits:** Matches current team size and platform scale; eliminates distributed transaction complexity while strictly enforcing domain boundaries.
- **Main trade-offs:** Application scales as a single unit; requires linting/architectural discipline to prevent ad-hoc SQL joins across module schemas.
- **Dependencies:** Independent Foundation ADR.
- **Open Questions:**
  1. Preferred relational engine in production infrastructure (PostgreSQL recommended).
  2. Preferred Node.js HTTP framework (Fastify recommended for high throughput and native schema validation).
- **Risk if accepted:** Potential for module boundaries to blur over time if code reviews do not enforce Clean Architecture.
- **Risk if rejected:** Adopting serverless or microservices introduces crippling operational complexity, latency spikes, and distributed transaction fragility.
- **Reversibility:** High; modular internal boundaries enable future physical decoupling.

```markdown
Owner Decision:
APPROVED
```

---

#### ADR 0005: Platform Administrator Client Delivery Topology

##### 1. Decision Question
How should the Platform Administrator client interface be architected and delivered within the NOVYX platform?

##### 2. Recommended Option
**Option B: Dedicated Admin Web Application (`apps/admin-web`)**
- Independent web application workspace in the monorepo built with modern React/Vite.
- Dedicated strictly to Platform Governance (`CAP-ADM-01..09`, `GV-01..19`) and authorized read-only care history (`OP-22 ViewCareHistory`).
- Mobile app (`apps/mobile`) explicitly blocks login attempts for `role === 'admin'` with a clear directive to use the Admin Web portal.

##### 3. Critical Architectural Analysis
- **Dense Governance Ergonomics:** Administrative workflows (filtering thousands of audit log entries, managing botanical taxonomies, editing polygon coordinates, configuring proof policies) require high-density data tables, wide monitors, and desktop input devices. Compressing these into a 5-inch mobile screen degrades operational effectiveness.
- **Deployment & Security Surface Separation:** Embedding admin UI into `apps/mobile` bloats the APK distributed to field personnel and leaks administrative routes into client-side bundles. A dedicated web app cleanly decouples deployment cycles and allows enterprise network hardening (e.g., VPN/WAF restrictions).
- **Preservation of Business Invariants:**
  - Platform Administrator has **ZERO normal Task mutation, execution, assignment, or operational review authority**.
  - Admin retains explicitly authorized read-only visibility into `OP-22 ViewCareHistory` within `PLATFORM_GOVERNANCE_SCOPE`.
  - Client separation is an ergonomic and delivery convenience, **NOT a security boundary**: the server independently validates every governance API request.

##### 4. Comprehensive 13-Dimension Owner Evaluation
| Dimension | Rating | Rationale |
| :--- | :---: | :--- |
| **Business Fit** | `STRONG` | Cleanly reflects the three-role model and preserves Admin operational task prohibitions. |
| **NFR Fit** | `STRONG` | Provides desktop data grid density required for audit logs (`CAP-ADM-05`) without compromising mobile field UX. |
| **Security** | `STRONG` | Isolates administrative client code from field mobile binaries; enables optional network perimeter controls. |
| **Reliability** | `STRONG` | Administrative updates deploy independently of mobile app store review cycles. |
| **Offline Fit** | `ACCEPTABLE` | Admin governance assumes stable office internet connectivity; zero offline burden. |
| **Maintainability** | `ACCEPTABLE` | Introduces a second frontend codebase, but shares `@novyx/contracts` and `@novyx/ui` tokens. |
| **Testability** | `STRONG` | Web dashboards are easily tested using standard end-to-end web testing tools (Playwright/Cypress). |
| **Implementation Complexity** | `ACCEPTABLE` | Standard Single Page Application (SPA) development using React and Vite. |
| **Operational Complexity** | `ACCEPTABLE` | Requires hosting for static web assets (e.g., Cloudflare Pages, S3/CloudFront, or Nginx). |
| **Current Repository Fit** | `STRONG` | Monorepo structure (`apps/*`) is natively organized for multi-client deployment. |
| **Dependency Readiness** | `STRONG` | Foundational ADR; depends only on monorepo structure (`ADR 0001`). |
| **Open Questions** | `ACCEPTABLE` | Web framework choice (Vite SPA recommended over Next.js for pure internal dashboard). |
| **Reversibility** | `STRONG` | Static web frontends can be restructured or migrated with zero impact on mobile operations. |

##### 5. Owner Decision Packet
- **Why it fits:** Respects the operational vs governance role boundary; prevents mobile APK bloat; provides professional desktop tooling for system administrators.
- **Main trade-offs:** Maintenance of a second frontend application in CI/CD.
- **Dependencies:** Independent Foundation ADR.
- **Open Questions:**
  1. Frontend framework selection: Vite SPA (recommended) vs Next.js SSR.
  2. Production hosting infrastructure for admin web assets.
- **Risk if accepted:** Frontend maintenance overhead increases slightly with two user-facing applications.
- **Risk if rejected:** Embedding Admin into mobile compromises field usability, bloats the APK, and creates severe ergonomic frustration for administrators.
- **Reversibility:** High.

```markdown
Owner Decision:
APPROVED
```

---

#### ADR 0010: Contract Evolution, Runtime Schema Validation & Governance API Extension

##### 1. Decision Question
How should `@novyx/contracts` be restructured and extended to support the full frozen business model, provide runtime schema validation, and cleanly organize operational vs governance API surfaces?

##### 2. Recommended Option
**Option B: Zod Schema-First Contracts with Automatic Type Inference**
- Introduce `zod` into `packages/contracts`.
- Author schemas as Zod definitions; automatically infer TypeScript types via `z.infer<typeof Schema>`.
- Expand contract coverage to encompass all 48 business inventory commands, canonical 7-state task lifecycle, 3 proof profiles, 4 review outcomes, and 4 account lifecycle states.
- Reconcile API exposure categories (`EXTERNAL_OPERATIONAL_API`, `EXTERNAL_GOVERNANCE_API`, `EXTERNAL_READ_API`, `SYSTEM_INTERNAL`, `CLIENT_LOCAL_ADVISORY`, `FUTURE_NOT_ACTIVE`, `NOT_NETWORK_EXPOSED`).

##### 3. Critical Architectural Analysis
- **Business Command vs HTTP Route vs DTO:** Strictly reinforces:
  $$\text{Business Command Identity} \neq \text{HTTP Route Identity} \neq \text{DTO Type Name}$$
  Canonical business commands (e.g., `OP-15 SubmitEvidence`, `OP-05 StartTask`, `GV-01 ProvisionUser`) remain unmutated by transport naming conventions.
- **Runtime Untrusted Boundary Validation:** Fulfills the commitment in `ADR 0003`. Unvalidated JSON payloads are rejected at the network boundary with standardized `400 VALIDATION_FAILED` errors before invoking application logic.
- **Zero Type Drift:** Schema-first inference guarantees that compile-time types and runtime validation rules never diverge.
- **Exclusion of Future/Rejected Commands:** `GV-20` (Dynamic Findings) and `GV-21` (Break Glass) are marked `FUTURE_NOT_ACTIVE` with zero MVP endpoints. `GV-22` (System Config) is marked `NOT_NETWORK_EXPOSED` (REJECTED). `ProjectCareHistory` is classified as `SYSTEM_INTERNAL`.

##### 4. Comprehensive 13-Dimension Owner Evaluation
| Dimension | Rating | Rationale |
| :--- | :---: | :--- |
| **Business Fit** | `STRONG` | 100% fidelity to frozen business inventory (`OP-01..22`, `GV-01..22`, 4 supplementary commands). |
| **NFR Fit** | `STRONG` | Enforces robust boundary validation (`QAS-FAULT-01`) and standardized error reporting. |
| **Security** | `STRONG` | Prevents malformed, unexpected, or poisoned JSON payloads from penetrating domain logic. |
| **Reliability** | `STRONG` | Complete type safety across client network requests and backend handlers. |
| **Offline Fit** | `STRONG` | Enables client outbox worker to perform pre-flight validation before enqueuing offline mutations. |
| **Maintainability** | `STRONG` | Single source of truth: changing a Zod schema updates TypeScript types across all apps automatically. |
| **Testability** | `STRONG` | Schemas can be tested with valid/invalid fixtures in pure unit tests. |
| **Implementation Complexity** | `ACCEPTABLE` | Straightforward migration from existing interfaces to Zod schemas using `z.infer`. |
| **Operational Complexity** | `STRONG` | Zero runtime infrastructure; lightweight library executed in-process. |
| **Current Repository Fit** | `STRONG` | Monorepo is already configured with `@novyx/contracts` consumed by all packages. |
| **Dependency Readiness** | `STRONG` | Foundational ADR; directly derived from `ADR 0003`. |
| **Open Questions** | `STRONG` | Zero open questions; fully aligned with business baseline and OpenAPI compatibility. |
| **Reversibility** | `ACCEPTABLE` | Zod types infer to standard TypeScript interfaces; can be swapped if necessary without breaking callers. |

##### 5. Owner Decision Packet
- **Why it fits:** Eliminates manual validation boilerplate; provides single source of truth; fully covers the frozen 48-command inventory.
- **Main trade-offs:** Adds `zod` dependency (~14KB min/gzip) to client bundles.
- **Dependencies:** Independent Foundation ADR (fulfills `ADR 0003`).
- **Open Questions:** None.
- **Risk if accepted:** Negligible; Zod is the de facto TypeScript standard.
- **Risk if rejected:** Manual validation in controllers is notoriously error-prone, leading to validation bypasses and type desynchronization.
- **Reversibility:** High.

```markdown
Owner Decision:
REQUEST_REVISION — UPDATED CANDIDATE PENDING FINAL REVIEW
```

---

### GROUP B — SECURITY & AUTHORITY ARCHITECTURE

#### ADR 0006: Identity & Access Management, Session Lifecycle & Role Administration

##### 1. Decision Question
How should the IAM boundary, authentication mechanism, session lifecycle, authorization freshness across protected reads and mutations, and token storage be architected across mobile and admin clients?

##### 2. Recommended Option
**Option B: Signed Short-Lived Access Token + Refresh Token Rotation + Authoritative Account Version Check**
- Short-lived asymmetric JWT access tokens (RS256/ES256, proposed 15m TTL).
- Long-lived cryptographically random refresh tokens stored in `expo-secure-store` (mobile) and `HttpOnly` cookies (web), with single-use rotation (RTR).
- **Mandatory Freshness Invariant:** For EVERY protected authenticated server request (READ, MUTATE, DECIDE, ADMINISTER), server verifies `accountStatus === 'ACTIVE'` and `token.authVersion === user.authVersion`.
- Offline field drafting is preserved; however, offline persistence conveys zero server authorization upon reconnection.

##### 3. Critical Architectural Analysis
- **Critical Comparison: JWT vs Fully Stateful Sessions:**
  - *Why not traditional cookie-based sessions (Option A)?* Stateful session cookies are brittle across native mobile operating systems, create CORS/cross-origin complexities between native Android apps and backend APIs, and introduce severe latency bottlenecks in field environments with high packet loss.
  - *Why Asymmetric JWT + JWKS in our proposed topology?* Even in a modular monolith, asymmetric signatures (RS256) allow the API gateway/middleware to verify cryptographic integrity locally using public keys (`jwks.json`), decoupling verification from token issuance secrets.
  - *The Revocation Reality Check:* Standard JWT architectures suffer from the "stale token window" (a suspended user retains access until token expiration). Option B closes this vulnerability completely by mandating an authoritative `authVersion` and `accountStatus` check at the server request boundary.
- **Enforcing WF-12 Across All Protected Actions:**
  - Stale credentials must NEVER authorize ANY protected online action.
  - Suspended accounts are barred not only from mutations (`SubmitEvidence`, `ReviewTask`), but also from protected reads (`ViewAssignedTask`, `ViewOperationalTask`, `ViewCareHistory`, `ViewAuditLog`).
  - Read actions leak sensitive operational intelligence and audit records; treating reads as harmless is a critical security defect.
- **Implementation Strategy for Freshness:**
  - Freshness can be enforced via indexed database lookup on `users(id, account_status, auth_version)` or a high-performance in-memory revocation cache (e.g., Redis or in-process LRU cache) without hardcoding a specific cache technology into the architecture.

##### 4. Comprehensive 13-Dimension Owner Evaluation
| Dimension | Rating | Rationale |
| :--- | :---: | :--- |
| **Business Fit** | `STRONG` | Directly satisfies `WF-12`, `CAP-ADM-01..04`, and exact 4-state account lifecycle. |
| **NFR Fit** | `STRONG` | Supports silent token refresh $\le 1$s (`QAS-SEC-01`) and OS-backed secure storage. |
| **Security** | `STRONG` | Immediate effective revocation across both reads and mutations; mitigates replay via RTR. |
| **Reliability** | `STRONG` | Mobile client interceptor automatically handles token renewal without interrupting field staff. |
| **Offline Fit** | `STRONG` | Allows offline drafting in cellular dead zones without continuous server pinging. |
| **Maintainability** | `ACCEPTABLE` | Standard OAuth2/OIDC patterns; well-supported by established Node.js libraries (`jose`). |
| **Testability** | `STRONG` | Easy to test token expiration, rotation, and revocation via automated integration tests. |
| **Implementation Complexity** | `ACCEPTABLE` | Requires token issuance service, rotation table, and request boundary middleware. |
| **Operational Complexity** | `ACCEPTABLE` | Minimal overhead; uses standard database user table or lightweight cache. |
| **Current Repository Fit** | `STRONG` | `expo-secure-store` is already integrated in `apps/mobile/src/services/authSessionStore.ts`. |
| **Dependency Readiness** | `DEPENDENCY_PENDING` | Logically depends on backend runtime (`ADR 0013`) and client topology (`ADR 0005`). |
| **Open Questions** | `ACCEPTABLE` | Password hashing algorithm (Argon2id recommended) and final approved token TTL values. |
| **Reversibility** | `ACCEPTABLE` | Token envelope and session interfaces in `@novyx/contracts` isolate authentication details. |

##### 5. Owner Decision Packet
- **Why it fits:** Eliminates stale token vulnerabilities for all protected online actions while supporting seamless offline mobile work and silent session refresh.
- **Main trade-offs:** Every protected server request requires an authoritative account status check, necessitating fast indexed lookups.
- **Dependencies:** `ADR 0013` (Backend Runtime), `ADR 0005` (Admin Client Topology).
- **Open Questions:**
  1. Confirmation of Argon2id as the mandatory password hashing algorithm.
  2. Final approval of token TTLs (proposed: 15m access token, 30d refresh token).
- **Risk if accepted:** If user lookups are poorly indexed, high API traffic could add database latency (mitigated by indexed query or cache).
- **Risk if rejected:** Plain JWTs leave a dangerous vulnerability window where suspended accounts continue accessing sensitive audit and task data. Stateful sessions break mobile offline continuity.
- **Reversibility:** High.

```markdown
Owner Decision:
REQUEST_REVISION — UPDATED CANDIDATE PENDING FINAL REVIEW
```

---

#### ADR 0007: Multi-Tier Authorization & Action Eligibility Enforcement Architecture

##### 1. Decision Question
Where and how should Action Eligibility be technically enforced across client presentation, server HTTP boundary middleware, application use cases, and domain entities?

##### 2. Recommended Option
**Option B: Multi-Tier Defense-in-Depth Authorization Policy**
- **Tier 1 (Client Presentation — Advisory Only):** UI disables buttons, hides controls, and displays tooltips for ergonomics and offline guidance. Strictly non-authoritative.
- **Tier 2 (Server Request Boundary — Authoritative Coarse Gate):** Middleware validates active account status, token freshness, and coarse role boundaries (e.g., rejecting Admin from operational routes).
- **Tier 3 (Application / Domain Core — Authoritative Fine-Grained Gate):** Use cases and domain aggregates enforce granular business rules, exact task lifecycle state preconditions, and **historical evidence authorship Separation of Duties (`SoD-02`)**.

##### 3. Critical Architectural Analysis
- **The Action Eligibility Formula:**
  $$\text{ACTION ELIGIBILITY} = \text{ACTOR ROLE} \land \text{RESOURCE SCOPE} \land \text{DOMAIN STATE} \land \text{BUSINESS PRECONDITIONS}$$
  All four factors must evaluate to TRUE for an action to proceed.
- **Historical Authorship Separation of Duties (`SoD-02`):**
  - Past code incorrectly checked `reviewerId !== assignedStaffId`. This is critically flawed: if a task was reassigned, or if a field staff member was promoted to Operations Manager, they could approve evidence they personally authored.
  - Option B mandates checking the historical submission author set:
    $$\text{reviewerId} \notin \text{task.getHistoricalSubmissionAuthorIds()}$$
- **Client Advisory vs Server Security Boundary:** Tampering with client code or crafting raw HTTP requests cannot bypass authorization. The server domain model is the sole arbiter of truth.
- **Rejection of External Engines (OPA):** Running Open Policy Agent (Option C) is rejected as severe over-engineering that introduces network latency and cannot run inside the mobile app during offline disconnected field work.

##### 4. Comprehensive 13-Dimension Owner Evaluation
| Dimension | Rating | Rationale |
| :--- | :---: | :--- |
| **Business Fit** | `STRONG` | 100% alignment with `Report 07` (Action Eligibility) and `Report 12` (Consistency Audit). |
| **NFR Fit** | `STRONG` | Satisfies `QAS-SEC-01` (defense in depth) and provides offline field workers with immediate feedback. |
| **Security** | `STRONG` | Eliminates IDOR, privilege escalation, and self-review SoD violations permanently. |
| **Reliability** | `STRONG` | Authoritative domain state machines prevent illegal transitions and race conditions. |
| **Offline Fit** | `STRONG` | Pure TypeScript eligibility evaluators run locally in mobile memory without network calls. |
| **Maintainability** | `STRONG` | Centralizes scattered JSX permission logic into reusable, testable policy functions. |
| **Testability** | `STRONG` | Pure domain functions enable comprehensive unit testing of all SoD and state combinations. |
| **Implementation Complexity** | `ACCEPTABLE` | Requires implementing guards at both route middleware and domain use cases. |
| **Operational Complexity** | `STRONG` | Zero infrastructure overhead; executed in-process. |
| **Current Repository Fit** | `STRONG` | Directly addresses the ad-hoc conditional logic currently scattered across `StaffProofFlow.tsx` and `ManagerReview.tsx`. |
| **Dependency Readiness** | `DEPENDENCY_PENDING` | Depends on IAM session identity (`ADR 0006`) and contracts (`ADR 0010`). |
| **Open Questions** | `STRONG` | Zero open questions; fully conforms to frozen business baseline. |
| **Reversibility** | `STRONG` | Code-level domain patterns; highly maintainable and adaptable. |

##### 5. Owner Decision Packet
- **Why it fits:** Eliminates client UI hiding as a security model; guarantees historical authorship SoD; provides offline ergonomic guidance.
- **Main trade-offs:** Developers must write validation logic at both the request boundary and domain use cases.
- **Dependencies:** `ADR 0006` (IAM & Session), `ADR 0010` (Contracts).
- **Open Questions:** None.
- **Risk if accepted:** Slight initial development overhead to establish domain policy evaluators.
- **Risk if rejected:** Relying on coarse HTTP RBAC leaves the system vulnerable to illegal state transitions, IDOR, and self-review fraud.
- **Reversibility:** High.

```markdown
Owner Decision:
APPROVED
```

---

#### ADR 0012: Clean Architecture Layering & Transitional Facade Decomposition

##### 1. Decision Question
How should the mobile application and platform architecture be structured into layers, and how should the transitional `greenOpsService` and `MobileApp.tsx` monoliths be decomposed without unnecessary architectural overhead?

##### 2. Recommended Option
**Option B: Pragmatic Clean Architecture (Ports & Adapters) within Monorepo**
- Establish 4 concentric layers: Presentation, Application (Use Cases), Domain Core, Infrastructure (Adapters).
- Decompose the 856-line `greenOpsService.ts` facade into focused single-responsibility adapters (`SqliteTaskRepository`, `RestApiAdapter`, `OutboxQueue`, `AuthService`).
- Split the 2,054-line `MobileApp.tsx` root into dedicated route screens and state providers.
- Maintain a single cohesive package structure without premature micro-packages.

##### 3. Critical Architectural Analysis
- **Authoritative Boundary Rule:**
  - *Server Domain & Application Core:* **AUTHORITATIVE**. Sole arbiter of business invariants, state transitions, and audit records.
  - *Mobile Domain & Application Model:* **LOCAL & ADVISORY**. Manages local draft integrity in SQLite, drives UI ergonomics, and buffers Outbox submissions. Under no circumstances is the mobile model treated as a security perimeter.
- **Resolving Presentation Domain Inversion:** Current code in `ManagerReview.tsx` manually builds mutated `fallbackTask` objects with new statuses (`COMPLETED`, `REWORK_REQUIRED`) and passes them down. Clean Architecture restores the domain core as the sole owner of state transitions.
- **Pragmatic Anti-Over-Engineering Discipline:** A Bounded Context does NOT equal a separate microservice or npm package. Clean Architecture is enforced via clear directory structure and interface contracts within the monorepo, avoiding the build overhead of dozens of small packages.

##### 4. Comprehensive 13-Dimension Owner Evaluation
| Dimension | Rating | Rationale |
| :--- | :---: | :--- |
| **Business Fit** | `STRONG` | Perfectly models the 5 Bounded Contexts and 7-state task lifecycle. |
| **NFR Fit** | `STRONG` | Satisfies `QAS-MAINT-01` (testability) and isolates persistence for offline resilience (`QAS-OFFLINE-01`). |
| **Security** | `STRONG` | Enforces unidirectional dependency flow; prevents UI layers from tampering with domain invariants. |
| **Reliability** | `STRONG` | Eliminates volatile memory crashes by decoupling UI rendering from state storage. |
| **Offline Fit** | `STRONG` | Cleanly encapsulates SQLite and Outbox behind repository interfaces. |
| **Maintainability** | `STRONG` | Decomposes two massive unmaintainable files (`MobileApp.tsx` and `greenOpsService.ts`). |
| **Testability** | `STRONG` | Pure TypeScript domain logic and use cases testable in milliseconds without React/Expo mocks. |
| **Implementation Complexity** | `ACCEPTABLE` | Refactoring effort during Phase 12; mitigated by Strangler Fig incremental migration. |
| **Operational Complexity** | `STRONG` | Zero operational footprint; pure software architecture pattern. |
| **Current Repository Fit** | `STRONG` | Directly targets the primary source of technical debt in `apps/mobile`. |
| **Dependency Readiness** | `DEPENDENCY_PENDING` | Closely linked with Authorization (`ADR 0007`) and Offline Storage (`ADR 0008`). |
| **Open Questions** | `STRONG` | Zero open questions; aligns with `ARCHITECTURE.md` target intent. |
| **Reversibility** | `STRONG` | Standard Ports & Adapters interfaces make underlying technologies easily swappable. |

##### 5. Owner Decision Packet
- **Why it fits:** Eliminates massive technical debt in mobile; enables fast unit testing of business logic; establishes clear authority boundaries.
- **Main trade-offs:** Requires refactoring the existing facade during Phase 12 implementation.
- **Dependencies:** `ADR 0007` (Authorization), `ADR 0008` (Offline Storage).
- **Open Questions:** None.
- **Risk if accepted:** Risk of developers over-abstracting simple CRUD operations (mitigated by pragmatic guidelines).
- **Risk if rejected:** Continuing with `greenOpsService` and `MobileApp.tsx` guarantees exponential bug accumulation, untestable domain logic, and high regression rates.
- **Reversibility:** High.

```markdown
Owner Decision:
APPROVED
```

---

### GROUP C — OFFLINE & CONSISTENCY ARCHITECTURE

#### ADR 0008: Mobile Offline Durable Storage Engine & Outbox Synchronization Architecture

##### 1. Decision Question
What local storage engine, binary management strategy, and Outbox synchronization architecture should be adopted in `apps/mobile` to provide the durability primitives required for offline resilience?

##### 2. Recommended Option
**Option B: Relational SQLite Engine (`expo-sqlite`) for Structured Data & Outbox + Sandbox Filesystem for Binary Photos**
- Structured data, drafts, and Outbox queue managed via `expo-sqlite` (official Expo SDK 57 native module).
- Binary evidence photos stored in application sandbox filesystem (`file://${FileSystem.documentDirectory}/evidence/...`).
- Sequential FIFO Outbox Worker with exponential backoff and connectivity monitoring.
- Strict state separation: local submission status `PENDING_SYNC` never mutates authoritative server `TaskStatus` (which remains `IN_PROGRESS` until server acceptance).

##### 3. Critical Architectural Analysis
- **Empirical Proof vs Architectural Guarantee:**
  - Selecting SQLite alone does NOT guarantee zero evidence loss.
  - The architecture provides the **durability primitives** designed to satisfy `QAS-OFFLINE-01` and `QAS-OFFLINE-02`.
  - **Mandatory Empirical Verification:** Formal architecture acceptance requires passing real-world fault test suites:
    1. *Process Kill Interruption:* Simulating OS kill during active camera use and verifying draft recovery $\le 2$s.
    2. *Transaction Interruption:* Power/process loss mid-write to verify zero database corruption.
    3. *Network Dropout Cycles:* Airplane mode toggling during active outbox transmission to verify idempotent retries.
    4. *Disk-Full & Migration Scenarios:* Graceful error handling under low-storage conditions.
- **Three Orthogonal State Dimensions:**
  - `TaskStatus`: Server domain lifecycle (`PENDING` $\to$ `IN_PROGRESS` $\to$ `WAITING_REVIEW` $\dots$).
  - `LocalSubmissionStatus`: Local intent (`IDLE`, `SAVED_DRAFT`, `PENDING_SYNC`).
  - `SyncStatus`: Transport outcome (`IDLE`, `SYNCING`, `SYNCED`, `SYNC_FAILED`).
  - *Invariant:* In disconnected mode, `TaskStatus` remains `IN_PROGRESS`; on sync failure, local evidence is NEVER discarded.
- **Unresolved Parameter — Photo Retention:** Local device storage is finite. Photos must eventually be purged, but only after confirmed server upload and terminal task completion. (Recommended: 7 days post-completion retention).

##### 4. Comprehensive 13-Dimension Owner Evaluation
| Dimension | Rating | Rationale |
| :--- | :---: | :--- |
| **Business Fit** | `STRONG` | Protects field evidence against loss (`DR-HARD-04`); implements the 3 orthogonal state dimensions. |
| **NFR Fit** | `STRONG` | Designed to fulfill `QAS-OFFLINE-01` ($< 100$ms local commit) and `QAS-OFFLINE-02` ($\le 2$s recovery). |
| **Security** | `STRONG` | Local database resides in private app sandbox; auth tokens isolated in `expo-secure-store`. |
| **Reliability** | `STRONG` | ACID transactions (`db.withTransactionSync`) prevent corrupted partial writes. |
| **Offline Fit** | `STRONG` | Purpose-built for urban dead zones and remote nursery environments. |
| **Maintainability** | `STRONG` | Standard SQL schema and versioned migrations; native Expo SDK 57 support. |
| **Testability** | `STRONG` | Outbox state machine and SQLite queries testable via automated integration tests. |
| **Implementation Complexity** | `ACCEPTABLE` | Requires SQL schema setup, migration runner, and FIFO background worker. |
| **Operational Complexity** | `STRONG` | Zero server infrastructure; runs entirely on mobile clients. |
| **Current Repository Fit** | `STRONG` | Solves the critical in-memory volatile storage defect (`let snapshot: AppData`) in `greenOpsService.ts`. |
| **Dependency Readiness** | `STRONG` | Independent mobile persistence foundation; ready for implementation. |
| **Open Questions** | `ACCEPTABLE` | Local photo garbage collection horizon (7 days recommended). |
| **Reversibility** | `ACCEPTABLE` | Encapsulated behind `ITaskRepository` and `IOutboxQueue` interfaces (`ADR 0012`). |

##### 5. Owner Decision Packet
- **Why it fits:** Eliminates mobile volatile memory loss; provides atomic transaction primitives; leverages official Expo SDK 57 native SQLite.
- **Main trade-offs:** Requires authoring and testing SQL migration scripts across mobile app releases.
- **Dependencies:** Independent Mobile Foundation ADR.
- **Open Questions:**
  1. Approval of local photo retention policy (7 days post-completion recommended).
- **Risk if accepted:** Database schema migrations must be carefully managed to avoid client update failures.
- **Risk if rejected:** Retaining in-memory or raw key-value storage guarantees continuous field data loss whenever Android kills background processes.
- **Reversibility:** High (isolated behind repository interfaces).

```markdown
Owner Decision:
REQUEST_REVISION — UPDATED CANDIDATE PENDING FINAL REVIEW
```

---

#### ADR 0009: Optimistic Concurrency Control & Command Idempotency Strategy

##### 1. Decision Question
What technical mechanisms should be established across `@novyx/contracts`, client outboxes, and backend APIs to handle concurrent mutations and guarantee idempotent command retries?

##### 2. Recommended Option
**Option B: Command Payload OCC (`expectedVersion`) + Header-Based Idempotency Keys**
- Add `version: number` to mutating aggregates (`TaskDto`, `TreeDto`).
- Mandate `expectedVersion: number` in mutating command payloads; server checks `version === expectedVersion` atomically, returning `409 CONFLICT: STALE_VERSION` on mismatch.
- Mandate `Idempotency-Key: <UUIDv4>` HTTP header for all state transitions and creations; server caches responses in an `idempotency_records` table to ensure safe, duplicate-free network retries.

##### 3. Critical Architectural Analysis
- **Why Command Payload OCC over HTTP `If-Match`:** The project API baseline (`ADR 0003`) is command-oriented (`POST /v1/tasks/:id/evidence`, `POST /v1/tasks/:id/review`) rather than full-resource PUT replacements. Including `expectedVersion` in the payload enables type-safe Zod validation (`ADR 0010`) and maps cleanly to `409 CONFLICT` (`STALE_VERSION`), avoiding RFC 9110 header friction.
- **The 409 STALE_VERSION Model:**
  - If a Manager reassigns or cancels a task while Staff is working offline, Staff's subsequent submission receives `409 CONFLICT`.
  - **Crucial Rule:** The mobile client halts automated retries, flags `SyncStatus = SYNC_FAILED`, but **NEVER discards the field evidence**. Local proof remains safely stored in SQLite for manual review or dispute resolution.
- **Idempotency Retention Horizon Discipline:**
  - An idempotency record must NEVER expire while a valid offline outbox item could still legitimately retry.
  - A definitive numeric TTL must NOT be finalized without operational field evidence. A baseline of 72 hours is proposed, subject to empirical measurement in remote forestry zones.

##### 4. Comprehensive 13-Dimension Owner Evaluation
| Dimension | Rating | Rationale |
| :--- | :---: | :--- |
| **Business Fit** | `STRONG` | Guarantees deterministic state machine transitions and audit traceability (`DR-HARD-03`). |
| **NFR Fit** | `STRONG` | Fulfills `QAS-FAULT-01` (safe retries) and prevents lost updates across distributed clients. |
| **Security** | `STRONG` | Idempotency keys scoped to authenticated actor prevent replay and race-condition exploits. |
| **Reliability** | `STRONG` | Network timeouts in cellular dead zones can be retried aggressively without duplicate side-effects. |
| **Offline Fit** | `STRONG` | Directly integrates with `ADR 0008` Outbox Worker; preserves local evidence on conflict. |
| **Maintainability** | `STRONG` | Uniform pattern across all mutating endpoints; standardized error structures. |
| **Testability** | `STRONG` | Highly testable via concurrent simulated requests and duplicate replay test scripts. |
| **Implementation Complexity** | `ACCEPTABLE` | Requires database `version` columns and an idempotency middleware/table on the server. |
| **Operational Complexity** | `STRONG` | Small indexed database table with standard periodic TTL row cleanup. |
| **Current Repository Fit** | `STRONG` | Resolves the complete absence of versioning or idempotency in current contracts. |
| **Dependency Readiness** | `DEPENDENCY_PENDING` | Linked with Mobile Outbox (`ADR 0008`) and Contracts (`ADR 0010`). |
| **Open Questions** | `ACCEPTABLE` | Finalization of exact idempotency TTL based on field connectivity empirical data (72h proposed). |
| **Reversibility** | `ACCEPTABLE` | Standard distributed systems pattern; easily tuned or extended. |

##### 5. Owner Decision Packet
- **Why it fits:** Completely eliminates lost updates (last-write-wins) and duplicate submissions; enables safe background outbox retries.
- **Main trade-offs:** Mobile UI must implement graceful conflict notification banners; server must maintain an idempotency table.
- **Dependencies:** `ADR 0008` (Mobile Outbox), `ADR 0010` (Contracts).
- **Open Questions:**
  1. Final confirmation of idempotency TTL horizon (72h baseline proposed, subject to field measurement).
- **Risk if accepted:** Poorly designed client conflict UI could confuse users if tasks are reassigned frequently.
- **Risk if rejected:** High probability of duplicate tasks, double approvals, corrupted care histories, and silent data overwrites during intermittent network retries.
- **Reversibility:** High.

```markdown
Owner Decision:
APPROVED
```

---

### GROUP D — AUDIT & COMPLIANCE ARCHITECTURE

#### ADR 0011: Audit Trail Persistence & Tamper-Evident Integrity Architecture

##### 1. Decision Question
What technical architecture, persistence strategy, and integrity mechanisms should be selected for the NOVYX Audit Trail to enforce append-only immutability, support concurrent writes, and provide fast administrative querying?

##### 2. Recommended Option
**Option B: Database Privilege Separation + Append-Only Table + Stream-Partitioned Hash Chaining**
- Application user privileges strictly restricted to `INSERT, SELECT` on `audit_events`. `UPDATE`, `DELETE`, `TRUNCATE`, and `DROP` are explicitly revoked at the database engine level.
- Stream-partitioned hash chaining (partitioned by resource or bounded context stream) to prevent global database write serialization bottlenecks.
- Composite indexes to power multi-criteria administrative queries (`CAP-ADM-05`, `GV-08`, `GV-09`).

##### 3. Critical Architectural Analysis & Owner Scrutiny
This decision warrants the most critical Owner examination. We explicitly separate two distinct questions:

###### Question A: How is append-only persistence enforced?
- The frozen business baseline mandates an absolute append-only historical invariant (`DR-HARD-06`, `DR-POL-04`): no product actor may delete or alter past audit logs.
- **Application-only prohibition (Option A)** is an inadequate security boundary: any SQL injection bug, application privilege escalation, or developer error could delete rows.
- **Database privilege separation** (`REVOKE UPDATE, DELETE ON audit_events FROM app_user`) establishes a true defense-in-depth perimeter against all product actors and compromised application accounts.

###### Question B: Does NOVYX require cryptographic tamper-evidence?
- **Baseline Reality:** The frozen business baseline requires append-only persistence, audit logging, and administrative filtering. It does **NOT** mandate cryptographic hash chaining.
- **Comparative Options for Owner Consideration:**
  - **Option 1 (Privilege Separation WITHOUT Hash Chaining):**
    - Application user has `INSERT, SELECT` only.
    - Standard relational table with indexes.
    - *Evaluation:* Completely satisfies frozen business requirements; zero write concurrency overhead; highly pragmatic.
  - **Option 2 (Privilege Separation WITH Stream-Partitioned Hash Chaining — Proposed Option B):**
    - Adds cryptographic hash linking within each resource stream (`prev_stream_hash`).
    - *Evaluation:* Detects internal database row tampering or out-of-band manual edits by non-superusers. Solves the global write serialization bottleneck by partitioning by stream.
  - **Option 3 (External Trust Anchoring / Blockchain — Option C/D):**
    - Pushes periodic Merkle roots to external immutable WORM storage or public ledger.
    - *Evaluation:* The ONLY method that mathematically proves non-tampering against a rogue root Database Administrator (DBA). However, it introduces significant external operational friction and cost.
- **Owner Scrutiny Warning:** Do NOT approve cryptographic hash chaining merely because it sounds more sophisticated. If no external regulatory, banking, or carbon-credit compliance mandate requires cryptographic audit proofs, Option 1 (Privilege Separation without Hash Chaining) may offer lower implementation friction. If future compliance is anticipated, Option B provides the necessary structure without global lock bottlenecks.

##### 4. Comprehensive 13-Dimension Owner Evaluation
| Dimension | Rating | Rationale |
| :--- | :---: | :--- |
| **Business Fit** | `STRONG` | Directly satisfies `CAP-ADM-05`, `BR-ADM-05`, `DR-HARD-06`, and `DR-POL-04`. |
| **NFR Fit** | `STRONG` | Provides defense-in-depth and supports fast multi-criteria queries via composite indexes. |
| **Security** | `STRONG` | Database engine enforces append-only immutability against compromised application accounts. |
| **Reliability** | `STRONG` | Stream partitioning eliminates global database lock contention across concurrent workers. |
| **Offline Fit** | `STRONG` | Server-side emission upon verified API reception; mobile does not write directly to audit table. |
| **Maintainability** | `ACCEPTABLE` | Database role configuration and stream hash tracking require careful maintenance. |
| **Testability** | `STRONG` | Append-only enforcement and hash verification easily validated via automated test scripts. |
| **Implementation Complexity** | `WEAK` | Stream hash chaining adds algorithmic complexity; simpler privilege separation is more straightforward. |
| **Operational Complexity** | `ACCEPTABLE` | Requires configuring specific database roles and permissions during deployment. |
| **Current Repository Fit** | `STRONG` | Solves the complete absence of audit persistence in current codebase. |
| **Dependency Readiness** | `DEPENDENCY_PENDING` | Critically depends on backend persistence topology selection (`ADR 0013`). |
| **Open Questions** | `ACCEPTABLE` | Whether organizational compliance truly necessitates hash chaining or external trust anchoring. |
| **Reversibility** | `STRONG` | Hash columns can be added, ignored, or removed without breaking audit query APIs. |

##### 5. Owner Decision Packet
- **Why it fits:** Guarantees append-only audit integrity via database-level privilege separation; avoids global write lock contention via stream partitioning.
- **Main trade-offs:** Stream hash chaining adds implementation complexity; does not defend against a root DBA without external trust anchoring.
- **Dependencies:** `ADR 0013` (Backend Runtime & Persistence Topology).
- **Open Questions:**
  1. Does NOVYX require cryptographic hash chaining at MVP, or is database privilege separation alone sufficient until external compliance audits require it?
  2. Is external trust anchoring (e.g., daily external Merkle root publication) mandated?
- **Risk if accepted:** Unnecessary cryptographic verification overhead if the organization has no formal audit compliance requirement.
- **Risk if rejected:** Application-only immutability leaves audit trails vulnerable to accidental or malicious deletion via SQL injection or developer error.
- **Reversibility:** High.

```markdown
Owner Decision:
REQUEST_REVISION — UPDATED CANDIDATE PENDING FINAL REVIEW
```

---

## 4. Cross-ADR Consistency & Architectural Cohesion

The candidate ADR set was rigorously audited across seven critical architectural intersections to guarantee zero circular contradictions or hidden integration hazards:

```
    ┌────────────┐        Session Auth        ┌────────────┐
    │  ADR 0005  │ ◄────────────────────────► │  ADR 0006  │
    │ Admin Web  │                            │    IAM     │
    └────────────┘                            └─────┬──────┘
                                                    │
                                   Freshness Check  │
                                                    ▼
    ┌────────────┐     Authority Boundary     ┌────────────┐
    │  ADR 0012  │ ◄────────────────────────► │  ADR 0007  │
    │ Clean Arch │                            │   Authz    │
    └─────┬──────┘                            └────────────┘
          │
          │ Local Persistence
          ▼
    ┌────────────┐      OCC / Idempotency     ┌────────────┐
    │  ADR 0008  │ ◄────────────────────────► │  ADR 0009  │
    │  Offline   │                            │ Concurrency│
    └────────────┘                            └─────┬──────┘
                                                    │
                                      Schema Spec   │
                                                    ▼
    ┌────────────┐      Module Persistence    ┌────────────┐
    │  ADR 0013  │ ◄────────────────────────► │  ADR 0010  │
    │  Backend   │                            │ Contracts  │
    └─────┬──────┘                            └────────────┘
          │
          │ Privilege Separation
          ▼
    ┌────────────┐
    │  ADR 0011  │
    │   Audit    │
    └────────────┘
```

### 4.1 ADR 0005 (Admin Web) ↔ ADR 0006 (IAM & Session Lifecycle)
- **Consistency Verification:** **PASSED**.
- `ADR 0005` establishes a dedicated Admin Web application for Platform Governance. `ADR 0006` natively supports this topology by specifying `HttpOnly; SameSite=Strict` secure cookies for refresh tokens on the web client, while using `expo-secure-store` on mobile. Both clients share identical JWT validation and `authVersion` revocation semantics at the API gateway.
- Mobile explicitly rejects `role === 'admin'` sessions, preventing administrative role confusion.

### 4.2 ADR 0006 (IAM & Freshness) ↔ ADR 0007 (Authorization Enforcement)
- **Consistency Verification:** **PASSED**.
- `ADR 0006` establishes that authentication freshness (`accountStatus === 'ACTIVE'` and `authVersion` match) is verified on **all protected requests (both reads and mutations)** at the server request boundary (Tier 2).
- `ADR 0007` builds directly upon this valid authenticated identity to evaluate Tier 3 fine-grained Action Eligibility (Resource Scope, Domain Lifecycle State, Historical Authorship SoD). No circular dependencies exist.

### 4.3 ADR 0007 (Authorization) ↔ ADR 0012 (Clean Architecture Layering)
- **Consistency Verification:** **PASSED**.
- `ADR 0007` dictates that client-side UI guards are purely advisory, while server domain models are authoritative.
- `ADR 0012` structures this exact boundary: client presentation calls use cases with command parameters; domain aggregates enforce state machine rules; the server application core is the sole authoritative gate. Mobile domain models buffer local SQLite drafts without claiming security authority.

### 4.4 ADR 0008 (Offline Storage) ↔ ADR 0009 (Concurrency & Idempotency)
- **Consistency Verification:** **PASSED**.
- `ADR 0008` defines the mobile Outbox synchronization lifecycle (`LocalSubmissionStatus = PENDING_SYNC`, `TaskStatus = IN_PROGRESS`).
- `ADR 0009` equips the Outbox Worker with client-generated `Idempotency-Key` headers and `expectedVersion` payload attributes.
- On HTTP `409 CONFLICT` (`STALE_VERSION`), both ADRs align: the Outbox Worker halts automatic retries, sets `SyncStatus = SYNC_FAILED`, and **retains 100% of local evidence** in SQLite without discarding data.

### 4.5 ADR 0009 (Concurrency) ↔ ADR 0010 (Contracts & Zod Validation)
- **Consistency Verification:** **PASSED**.
- `ADR 0009` mandates `expectedVersion: number` in mutating commands.
- `ADR 0010` includes `expectedVersion` and `idempotencyKey` directly into Zod request schemas in `@novyx/contracts`, standardizing the `409 CONFLICT: STALE_VERSION` error structure.

### 4.6 ADR 0010 (Contracts) ↔ ADR 0013 (Backend Runtime Topology)
- **Consistency Verification:** **PASSED**.
- `ADR 0013` establishes a Node.js / TypeScript modular monolith backend (`apps/api`).
- This backend directly imports `@novyx/contracts` for runtime Zod request validation, response serialization, and shared error envelopes without compilation overhead or code generators.

### 4.7 ADR 0011 (Audit Persistence) ↔ ADR 0013 (Backend Persistence Topology)
- **Consistency Verification:** **PASSED**.
- `ADR 0011` relies on database user privilege separation (`REVOKE UPDATE, DELETE ON audit_events FROM app_user`).
- `ADR 0013` provides the relational database family architecture (PostgreSQL-compatible engine) necessary to support relational user grants, transactions, and composite indexes.

---

## 5. Dependency Gate & Approval Sequencing Recommendation

To ensure logical consistency and prevent downstream rework, the Owner is advised to review and decide the ADRs in the following three sequential waves:

```
   WAVE 1: CORE FOUNDATION
   ├── ADR 0013: Backend Runtime & Relational Persistence Topology
   ├── ADR 0005: Platform Administrator Client Delivery Topology
   └── ADR 0010: Contract Evolution & Runtime Schema Validation
              │
              ▼
   WAVE 2: AUTHORITY, SECURITY & STRUCTURE
   ├── ADR 0006: IAM, Session Lifecycle & Role Administration
   ├── ADR 0007: Multi-Tier Authorization Enforcement Architecture
   └── ADR 0012: Clean Architecture Layering & Facade Decomposition
              │
              ▼
   WAVE 3: FIELD RESILIENCE, CONSISTENCY & AUDIT
   ├── ADR 0008: Mobile Offline Durable Storage & Outbox
   ├── ADR 0009: Concurrency Control & Idempotency Strategy
   └── ADR 0011: Audit Trail Persistence & Integrity Architecture
```

### Sequencing Rationale
1. **Wave 1 establishes the structural boundaries:** Deciding the backend application model (`ADR 0013`), administrative client surface (`ADR 0005`), and runtime schema contracts (`ADR 0010`) unblocks all downstream server and contract specifications.
2. **Wave 2 establishes the security and domain core:** With the runtime and client surfaces approved, the authentication lifecycle (`ADR 0006`), multi-tier authorization model (`ADR 0007`), and architectural layering (`ADR 0012`) can be formally locked.
3. **Wave 3 establishes the field data engine and compliance trail:** With domain and security boundaries settled, mobile offline durability (`ADR 0008`), distributed concurrency (`ADR 0009`), and audit trail persistence (`ADR 0011`) complete the production architecture foundation.

---

## 6. Formal Verification Checklist

- [x] All 9 candidate ADRs (`0005` through `0013`) verified in status `PROPOSED`.
- [x] Canonical business command identity (`OP-01..22`, `GV-01..22`, 4 supplementary) preserved across all reviews.
- [x] Invariant enforced: Suspension and deactivation block ALL protected online requests (Reads and Mutations).
- [x] Invariant enforced: Platform Admin has zero normal task mutation/review authority; read-only `OP-22 ViewCareHistory` preserved.
- [x] Invariant enforced: Bounded Context $\neq$ Microservice; Foreign Key $\neq$ Business Authority.
- [x] Offline durability claims empirically bounded and tied to physical fault test suites.
- [x] All Owner Decision checkboxes remain clean and un-checked.
- [x] Zero changes to source code (`apps/**`, `packages/**`), business reconciliation reports, or diagrams.

---

*This concludes the Phase 11B Owner Review Packet. The engineering harness is paused awaiting formal System Owner determination.*
