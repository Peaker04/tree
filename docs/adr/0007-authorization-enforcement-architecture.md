# ADR 0007: Multi-Tier Authorization & Action Eligibility Enforcement Architecture

## Status
ACCEPTED

## Acceptance Scope
- **ACCEPTED:**
  - Three-tier defense-in-depth authorization architecture:
    - **Tier 1 (Client Presentation Guard):** Evaluates eligibility for UX ergonomics, button disabling, and offline guidance; strictly ADVISORY ONLY (never a security boundary).
    - **Tier 2 (Server Request Boundary Middleware):** Coarse gate enforcing authentication, account freshness (`accountStatus === 'ACTIVE'`), and broad role gating (e.g., blocking Admin from operational task routes).
    - **Tier 3 (Application / Domain Core):** Sole authoritative gate enforcing fine-grained business eligibility.
  - Action Eligibility Formula formally locked:
    $$\text{ACTION ELIGIBILITY} = \text{ACTOR ROLE} \land \text{RESOURCE SCOPE} \land \text{DOMAIN STATE} \land \text{BUSINESS PRECONDITIONS}$$
  - Separation of Duties (`SoD-02`) strictly locked: Reviewer must NOT be a historical evidence/submission author ($\text{reviewerId} \notin \text{task.getHistoricalSubmissionAuthorIds()}$). The rule must NEVER be reduced to a naive check against current `assignedStaffId`.
- **NOT ACCEPTED:**
  - External authorization engines (OPA/Casbin remain rejected as incompatible with offline mobile evaluation and disproportionate in complexity).

## Context
The frozen business baseline (Phase 0–10) establishes that security and permissioning in NOVYX are governed by the **Action Eligibility Principle**:
$$\text{ACTION ELIGIBILITY} = \text{ACTOR ROLE} \land \text{RESOURCE SCOPE} \land \text{DOMAIN STATE} \land \text{BUSINESS PRECONDITIONS}$$

In the current AS-IS implementation:
1. Authorization checks are largely conflated with UI visibility in React components (`StaffProofFlow.tsx`, `ManagerReview.tsx`, `ManagerArea.tsx`). If a user manages to invoke a service method or call a REST endpoint, the backend dev API (`scripts/greenops-dev-api.cjs`) and transitional client service (`greenOpsService.ts`) perform minimal authorization guards.
2. In `greenOpsService.ts`, actions like `reviewTask` or `createTask` rely on the client passing an already-mutated `fallbackTask` object rather than verifying server-side whether the calling actor is eligible to trigger the state transition.
3. Separation of Duties (`SoD-01..07`) and Resource Scopes (`assignedStaffId`, `AUTHORIZED_OPERATIONAL_SCOPE`, `PLATFORM_GOVERNANCE_SCOPE`) have no unified technical enforcement point.
4. An erroneous assumption in past code checked self-review via `reviewerId !== assignedStaffId`, which is critically flawed if a task was reassigned or if staff changed roles.

## Frozen Business Drivers
- **Three Planes of Authority (`Report 07 §2`, `Report 12 §4`):**
  1. *Operational Plane (Field Staff & Operations Manager):* `OP-01..22`. Staff is restricted to assigned tasks (`task.assignedStaffId == actor.userId`). Manager operates within `AUTHORIZED_OPERATIONAL_SCOPE`.
  2. *Governance Plane (Platform Administrator):* `GV-01..22` (`CAP-ADM-01..09` in MVP). Admin is restricted to `PLATFORM_GOVERNANCE_SCOPE` and **100% DENIED** on operational task mutations (`OP-03..15`, `OP-17..21`).
  3. *Technical Plane (System):* Deterministic automation only (CareHistory projection, GPS calculation, Audit logging). No discretionary auto-approval.
- **Task Lifecycle Preconditions (`DOMAIN.md §3`, `WORKFLOWS.md §2`):**
  - `StartTask`: Only by assigned Staff when Task is `PENDING`.
  - `ReportFieldIssue`: Only by assigned Staff when Task is `IN_PROGRESS` (results in `BLOCKED`).
  - `ReassignTask`: Only by authorized Manager when Task is `PENDING` or `BLOCKED` (DENIED in `IN_PROGRESS` and `WAITING_REVIEW`).
  - `ReviewTask`: Only by authorized Manager when Task is `WAITING_REVIEW`.
- **Separation of Duties & Historical Authorship Provenance (`DR-HARD-02`, `SoD-02`):**
  - A user who authored or submitted evidence on a task can **NEVER** review or approve that same submission later, even if the user subsequently transitioned roles to Manager or if the task was reassigned.
  - Eligibility requires checking historical submission provenance (`reviewerId NOT IN historical submission author set`), NOT merely comparing against current `assignedStaffId`.
- **Resource Scope Invariants:** `AUTHORIZED_OPERATIONAL_SCOPE` and `PLATFORM_GOVERNANCE_SCOPE` remain abstract domain concepts (do not prematurely invent hardcoded district or team tables in contracts).

## NFR / Quality Drivers
- **Security & Defense-in-Depth (`QAS-SEC-01`):** Client-side UI element hiding is purely an ergonomic convenience, NEVER a security boundary. All business invariants must be authoritatively enforced at the server API and application/domain layers.
- **Offline Field Advisory:** In disconnected mode, the mobile client must evaluate action eligibility locally to guide field workers ergonomically and prevent corrupt local drafts, while server-side sync provides the sole authoritative validation.
- **Maintainability & DRY:** Authorization logic should not be duplicated with conflicting rules across multiple files.

## Current Technical Evidence
- `apps/mobile/src/screens/StaffProofFlow.tsx` & `ManagerReview.tsx`: Dispersed JSX conditional checks (`if (role !== 'Manager') return null`).
- `apps/mobile/src/services/greenOpsService.ts`: Mutated objects passed directly to update methods.
- External Technical Evidence: OWASP Proactive Controls (C7: Enforce Access Controls) and OWASP Cheat Sheet Series (Authorization) mandate that access control decisions must be enforced server-side on trusted components, never relying on client-side state.

## Decision Question
Where and how should Action Eligibility be technically enforced across client presentation, server HTTP boundary middleware, application use cases, and domain entities?

## Options Considered

### Option A: Coarse Role-Based Access Control (RBAC) at Server HTTP Boundary Only
- **Description:** Server middleware checks only the user's role claim (`req.user.role === 'manager'`). Resource scope and state validation are left to ad-hoc code inside individual route handlers.
- **Advantages:** Simple to implement; fast execution.
- **Disadvantages:**
  - Complete failure on Action Eligibility: Cannot enforce resource ownership (`assignedStaffId`), task state preconditions (`PENDING` vs `IN_PROGRESS`), or historical authorship SoD (`SoD-02`).
  - Massive business logic leakage into route controllers.
  - Leaves client offline mode without an eligibility engine.
- **Risks:** High vulnerability to IDOR (Insecure Direct Object Reference) and illegal state transition exploits.
- **Migration Impact:** Minimal initially, but causes severe security regressions.
- **Operational Impact:** Low.

### Option B: Multi-Tier Defense-in-Depth Authorization Policy [RECOMMENDED]
- **Description:** Implement Action Eligibility across three distinct tiers with clear authority boundaries:
  1. **Tier 1 (Client Presentation Guard — Advisory Only):**
     - Mobile/web UI uses declarative eligibility functions (e.g., `canPerformAction(task, actor)`) to disable buttons, hide inappropriate controls, and render informative tooltips.
     - **Explicit Boundary Rule:** Client-side eligibility is strictly for **UX ergonomics and offline local workflow guidance**. It is **NOT** a security boundary.
  2. **Tier 2 (Server Request Boundary Middleware — Authoritative Coarse Gate):**
     - HTTP middleware authenticates credentials, checks active account status (`ACTIVE`), and validates coarse role boundaries.
     - Rejects Admin from operational task routes (`/v1/tasks/*`) with `403 FORBIDDEN: ADMIN_TASK_MUTATION_DENIED`.
     - Rejects Staff/Manager from governance routes (`/v1/governance/*`).
  3. **Tier 3 (Application / Domain Core — Authoritative Fine-Grained Gate):**
     - Use Cases and Domain Aggregates enforce granular business preconditions:
       - Resource scope matching.
       - Exact task state preconditions (e.g., `StartTask` requires `status === 'PENDING'`).
       - **Historical Authorship Separation of Duties (`SoD-02`):** Verifies that `reviewerId` is NOT in the historical author set of the submitted evidence.
     - Any violation throws a domain exception, mapped to `403 FORBIDDEN` or `409 CONFLICT`, and emits a security event to the audit trail.
- **Advantages:**
  - **True Defense-in-Depth:** Tampering with client code or directly calling the API cannot violate business rules or bypass SoD.
  - **Accurate SoD Enforcement:** Tracks historical evidence authorship, preventing self-approval across reassignments or role promotions.
  - **Deterministic Error Reporting:** Clear, standardized error codes.
- **Disadvantages:** Developers must maintain guards at both the server request boundary and domain layer.
- **Risks:** Synchronization drift if client advisory logic diverges from server domain rules (mitigated by sharing pure domain specifications).
- **Migration Impact:** Replaces fragmented JSX checks with centralized policy evaluators.
- **Operational Impact:** Structured 403 error logging with audit trail emission.

### Option C: External Authorization Engine (OPA / Open Policy Agent / Casbin)
- **Description:** Deploy an external OPA microservice running Rego policies for all authorization decisions.
- **Advantages:** Centralized policy management; auditable Rego code.
- **Disadvantages:**
  - Extreme over-engineering for a 3-role, 48-command platform.
  - Network latency overhead on every API request.
  - Incompatible with offline mobile evaluation (cannot run OPA sidecar inside React Native mobile app in disconnected field mode).
- **Risks:** Operational complexity, latency overhead, offline failure.
- **Migration Impact:** High.
- **Operational Impact:** Requires maintaining, deploying, and monitoring OPA servers.

## Proposed Decision
**Adopt Option B: Multi-Tier Defense-in-Depth Authorization Policy.**
*Recommendation Confidence: HIGH (universal security standard, directly fulfilling Report 07 and Report 12).*

1. **Client Tier (UX & Offline Advisory Only):**
   - Declarative helper functions in `@novyx/domain`:
     `canPerformTaskAction(action: OperationalAction, task: TaskDto, actor: ActorContext): EligibilityResult`
   - Returns `{ eligible: boolean, reason?: string }`.
   - Used by mobile UI to render buttons in active, disabled, or hidden states with clear tooltips.
2. **Server HTTP Boundary Middleware Tier (Authoritative Coarse Gate):**
   - Neutral server middleware (independent of whether deployed in a modular monolith or behind a future reverse proxy):
     - `requireRole('manager' | 'staff')`: Blocks Admin from operational routes (`/v1/tasks/*`).
     - `requireRole('admin')`: Blocks Staff/Manager from governance routes (`/v1/governance/*`, `/v1/audit/*`).
     - `requireAccountActive()`: Rejects requests if `accountStatus !== 'ACTIVE'` or if `authVersion` is stale (`ADR 0006`).
3. **Application & Domain Tier (Authoritative Fine-Grained Gate):**
   - Each Use Case (`StartTaskUseCase`, `ReviewTaskUseCase`, `ReassignTaskUseCase`, etc.) loads the aggregate and invokes its state machine guard:
     - `task.start(staffId)`: Verifies `status === 'PENDING'` AND `assignedStaffId === staffId`.
     - `task.review(reviewerId, decision)`: Verifies `status === 'WAITING_REVIEW'` AND **`reviewerId NOT IN task.getHistoricalSubmissionAuthorIds()`** (`SoD-02`).
   - Violations reject the command with `403 FORBIDDEN` or `409 CONFLICT` and emit an audit warning to `AuditEvent`.

## Rationale
Option B eliminates reliance on client UI hiding, guarantees that no unauthorized command can mutate the database, and provides field workers with instantaneous offline feedback when an action is unavailable. Checking historical evidence authorship ensures that Separation of Duties cannot be circumvented by task reassignment or role transitions.

## Consequences
- **Positive:** Robust defense against unauthorized mutations, complete adherence to frozen SoD and Action Eligibility rules, consistent error reporting.
- **Negative:** Developers must write guards at both the domain and request boundary layers.
- **Neutral:** Scope models (`AUTHORIZED_OPERATIONAL_SCOPE`) remain clean interfaces without premature database schema coupling.

## Security Impact
- Eliminates IDOR and privilege escalation vulnerabilities.
- Guarantees strict boundary enforcement between Platform Admin and Field Operations.
- Enforces Separation of Duties based on historical authorship provenance.

## Offline / Reliability Impact
- Pure TypeScript advisory rules run locally in mobile memory during offline disconnected mode, preventing corrupt local drafts.
- Server maintains sole authoritative decision rights during sync.

## Contract Impact
- Standardize 403 and 409 error responses in `@novyx/contracts`:
  - `FORBIDDEN: INSUFFICIENT_RESOURCE_SCOPE`
  - `FORBIDDEN: SOD_VIOLATION_SELF_REVIEW`
  - `FORBIDDEN: ADMIN_TASK_MUTATION_DENIED`
  - `CONFLICT: INVALID_STATE_TRANSITION`

## Migration / Compatibility
- Extract existing ad-hoc JSX conditional logic from `StaffProofFlow.tsx` and `ManagerReview.tsx` into clean, testable eligibility functions.

## Rejected Alternatives
- **Option A (HTTP-only RBAC):** Rejected due to inability to enforce state, scope, or historical authorship SoD.
- **Option C (External OPA Engine):** Rejected due to operational complexity and offline incompatibility.

## Open Questions
- None. Policy aligns 100% with Report 07 and Report 12.

## Owner Decision Required
- [x] **APPROVE** Option B (Multi-Tier Defense-in-Depth Authorization Policy).
- [ ] **REJECT** and mandate alternative option.
- [ ] **REQUEST_REVISION** with specific modifications.
