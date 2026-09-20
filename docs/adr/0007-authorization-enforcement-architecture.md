# ADR 0007: Multi-Tier Authorization & Action Eligibility Enforcement Architecture

## Status
PROPOSED

## Context
The frozen business baseline (Phase 0–10) establishes that security and permissioning in NOVYX are governed by the **Action Eligibility Principle**:
$$\text{ACTION ELIGIBILITY} = \text{ACTOR ROLE} \land \text{RESOURCE SCOPE} \land \text{DOMAIN STATE} \land \text{BUSINESS PRECONDITIONS}$$

In the current AS-IS implementation:
1. Authorization checks are largely conflated with UI visibility in React components (`StaffProofFlow.tsx`, `ManagerReview.tsx`, `ManagerArea.tsx`). If a user manages to invoke a service method or call a REST endpoint, the backend dev API (`scripts/greenops-dev-api.cjs`) and transitional client service (`greenOpsService.ts`) perform minimal authorization guards.
2. In `greenOpsService.ts`, actions like `reviewTask` or `createTask` rely on the client passing an already-mutated `fallbackTask` object rather than verifying server-side whether the calling actor is eligible to trigger the state transition.
3. Separation of Duties (`SoD-01..07`) and Resource Scopes (`assignedStaffId`, `AUTHORIZED_OPERATIONAL_SCOPE`, `PLATFORM_GOVERNANCE_SCOPE`) have no unified technical enforcement point.

## Frozen Business Drivers
- **Three Planes of Authority (`Report 07 §2`, `Report 12 §4`):**
  1. *Operational Plane (Field Staff & Operations Manager):* `OP-01..22`. Staff is restricted to assigned tasks (`task.assignedStaffId == actor.userId`). Manager operates within `AUTHORIZED_OPERATIONAL_SCOPE`.
  2. *Governance Plane (Platform Administrator):* `GV-01..22` (`CAP-ADM-01..09` in MVP). Admin is restricted to `PLATFORM_GOVERNANCE_SCOPE` and **100% DENIED** on operational task mutations (`OP-03..15`, `OP-17..21`).
  3. *Technical Plane (System):* Deterministic automation only (CareHistory projection, GPS calculation, Audit logging). No discretionary auto-approval.
- **Task Lifecycle Preconditions (`DOMAIN.md §3`, `WORKFLOWS.md §2`):**
  - `StartTask`: Only by assigned Staff when Task is `PENDING`.
  - `ReportFieldIssue`: Only by assigned Staff when Task is `IN_PROGRESS` (results in `BLOCKED`).
  - `ReassignTask`: Only by authorized Manager when Task is `PENDING` or `BLOCKED` (DENIED in `IN_PROGRESS` and `WAITING_REVIEW`).
  - `ReviewTask`: Only by authorized Manager when Task is `WAITING_REVIEW`. Staff who previously performed work on the task cannot approve it (`DR-HARD-02`, `SoD-02`).
- **Resource Scope Invariants:** `AUTHORIZED_OPERATIONAL_SCOPE` and `PLATFORM_GOVERNANCE_SCOPE` remain abstract domain concepts (do not prematurely invent hardcoded district or team tables in contracts).

## NFR / Quality Drivers
- **Security & Defense-in-Depth (`QAS-SEC-01`):** Client-side UI element hiding is purely an ergonomic convenience, NEVER a security boundary. All business invariants must be strictly enforced at the server API and application/domain layers.
- **Offline Field Eligibility:** In disconnected mode, the mobile client must locally evaluate action eligibility to prevent field workers from entering invalid states, while server-side sync guarantees final authoritative validation.
- **Maintainability & DRY:** Authorization logic should not be duplicated with conflicting rules across multiple files.

## Decision Question
Where and how should Action Eligibility be technically enforced across client, API gateway/middleware, application use cases, and domain entities?

## Options Considered

### Option A: Coarse Role-Based Access Control (RBAC) at API Gateway Only
- **Description:** Route-level middleware checks only the user's role claim (`req.user.role === 'manager'`). Resource scope and state validation are left to ad-hoc code inside individual route handlers.
- **Advantages:** Simple to implement; fast execution at the gateway.
- **Disadvantages:**
  - Complete failure on Action Eligibility: Cannot enforce resource ownership (`assignedStaffId`), task state preconditions (`PENDING` vs `IN_PROGRESS`), or Separation of Duties (`SoD-02`).
  - Massive business logic leakage into route controllers.
  - Leaves client offline mode without an eligibility engine.
- **Risks:** High vulnerability to IDOR (Insecure Direct Object Reference) and illegal state transition exploits.
- **Migration Impact:** Minimal initially, but causes severe security regressions.
- **Operational Impact:** Low.

### Option B: Unified Multi-Tier Defense-in-Depth Authorization Policy [RECOMMENDED]
- **Description:** Implement Action Eligibility across three complementary tiers:
  1. **Tier 1 (Presentation / Ergonomic Guard):** Client UI uses declarative eligibility helper functions (e.g., `canStartTask(task, user)`, `canReviewTask(task, user)`) to hide/disable buttons and show explanatory disabled tooltips.
  2. **Tier 2 (API Gateway / Route Guard):** Middleware validates authenticated JWT, active account status (`ACTIVE`), and coarse role/scope authorization (e.g., rejects Admin from `/v1/tasks/*` routes with `403 FORBIDDEN: ADMIN_NORMAL_TASK_MUTATION_DENIED`).
  3. **Tier 3 (Application / Domain Core Guard):** Use Cases and Domain Entities enforce granular action eligibility ($ROLE \land SCOPE \land STATE \land PRECONDITIONS$). The Task aggregate checks preconditions and raises a domain violation error if an illegal transition is attempted.
- **Advantages:**
  - True Defense-in-Depth: Bypassing the client UI or calling the API directly cannot violate business rules.
  - Perfectly reflects the frozen formula: Every command executes within an authorization context containing actor identity, resource instance, and current domain state.
  - Reusable logic: Domain policies can be packaged in a shared TypeScript domain helper or compiled for both offline client validation and server enforcement.
- **Disadvantages:** Requires disciplined layering and clear separation between route guards and use-case guards.
- **Risks:** Synchronization drift if client and server policy implementations diverge (mitigated by shared contracts/domain specifications).
- **Migration Impact:** Replaces fragmented JSX checks with centralized policy evaluators.
- **Operational Impact:** Structured 403 error logging with audit trail emission.

### Option C: External Authorization Engine (Opa / Open Policy Agent / Casbin)
- **Description:** Deploy an external OPA microservice or sidecar running Rego policies for all authorization decisions.
- **Advantages:** Centralized policy management; auditable Rego code.
- **Disadvantages:**
  - Massive over-engineering for a 3-role, 48-command platform.
  - Network latency overhead on every API request.
  - Incompatible with offline mobile evaluation (cannot run OPA sidecar inside React Native mobile app in disconnected field mode).
- **Risks:** Operational complexity, high latency, offline failure.
- **Migration Impact:** High.
- **Operational Impact:** Requires maintaining, deploying, and monitoring OPA servers.

## Proposed Decision
**Adopt Option B: Unified Multi-Tier Defense-in-Depth Authorization Policy.**

1. **Client Tier:** Export deterministic pure functions in `@novyx/domain` (or shared domain module):
   - `canPerformTaskAction(action: OperationalAction, task: TaskDto, actor: ActorContext): EligibilityResult`
   - Returns `{ eligible: boolean, reason?: string }`. Used by UI components to render buttons in active, disabled, or hidden states with clear tooltips.
2. **Server Middleware Tier:**
   - `requireRole('manager' | 'staff')`: Blocks Admin from operational routes (`/v1/tasks/*`, `/v1/trees/*/review`).
   - `requireRole('admin')`: Blocks Staff/Manager from governance routes (`/v1/governance/*`, `/v1/audit/*`).
   - `requireAccountActive()`: Immediately rejects requests if `accountStatus !== 'ACTIVE'`.
3. **Application / Domain Tier (The Authoritative Gate):**
   - Each Use Case (e.g., `StartTaskUseCase`, `ReviewTaskUseCase`, `ReassignTaskUseCase`) loads the aggregate and invokes its state machine guard:
     - `task.start(staffId)` verifies `status === 'PENDING'` AND `assignedStaffId === staffId`.
     - `task.review(reviewerId, decision)` verifies `status === 'WAITING_REVIEW'` AND `reviewerId !== assignedStaffId` (`SoD-02`).
   - Violations reject the command with `403 FORBIDDEN` or `409 CONFLICT` and emit a security warning to the audit log.

## Rationale
Option B eliminates security reliance on UI hiding, guarantees that no illegal command can mutate the database, and provides field workers with instantaneous offline feedback when an action is unavailable.

## Consequences
- **Positive:** Robust defense against unauthorized mutations, complete adherence to frozen SoD and Action Eligibility rules, consistent error reporting.
- **Negative:** Developers must write guards at both the domain and route layer.
- **Neutral:** Scope models (`AUTHORIZED_OPERATIONAL_SCOPE`) remain clean interfaces without premature database schema coupling.

## Security Impact
- Eliminates IDOR and privilege escalation vulnerabilities.
- Guarantees strict boundary enforcement between Platform Admin and Field Operations.

## Offline / Reliability Impact
- Pure TypeScript eligibility rules run locally in mobile memory during offline disconnected mode, preventing corrupt local drafts.

## Contract Impact
- Standardize 403 and 409 error responses in `@novyx/contracts` with descriptive error details:
  - `FORBIDDEN: INSUFFICIENT_RESOURCE_SCOPE`
  - `FORBIDDEN: SOD_VIOLATION_SELF_REVIEW`
  - `CONFLICT: INVALID_STATE_TRANSITION`

## Migration / Compatibility
- Extract existing ad-hoc JSX conditional logic from `StaffProofFlow.tsx` and `ManagerReview.tsx` into clean, testable eligibility functions.

## Rejected Alternatives
- **Option A (Gateway-only RBAC):** Rejected due to inability to enforce state, scope, or SoD invariants.
- **Option C (External OPA Engine):** Rejected due to operational complexity and offline incompatibility.

## Open Questions
- None. Policy aligns 100% with Report 07 and Report 12.

## Owner Decision Required
- [ ] **APPROVE** Option B (Multi-Tier Defense-in-Depth Authorization Policy).
- [ ] **REJECT** and mandate alternative option.
- [ ] **REQUEST_REVISION** with specific modifications.
