# ADR 0005: Platform Administrator Client Delivery Topology

## Status
ACCEPTED

## Acceptance Scope
- **ACCEPTED:**
  - Dedicated Platform Administration Web application as an independent client workspace in the monorepo (conceptual future workspace: `apps/admin-web`).
  - Scope is strictly confined to Platform Governance (`CAP-ADM-01..09`, `GV-01..19`) and authorized read-only tree care history inspection (`OP-22 ViewCareHistory`).
  - Invariant locked: Platform Administrator has ZERO normal Task operational mutation, assignment, execution, or review authority.
  - Server authentication and authorization remain the sole security boundary; client separation is an ergonomic and delivery convenience.
  - Mobile app (`apps/mobile`) explicitly blocks login attempts for `role === 'admin'` with a directive to use the web portal.
- **NOT ACCEPTED / STILL OPEN (Implementation & Deployment Decisions):**
  - Concrete frontend framework (Vite SPA vs Next.js).
  - Exact web UI / component library.
  - Exact hosting provider or infrastructure deployment mechanism.
  - Network perimeter hardening requirements (VPN, WAF, IP allowlisting remain optional deployment choices, not frozen architecture mandates).

## Context
In the reconciled and frozen business baseline (Phase 0–10), the **Platform Administrator** (`admin`) is established as an active human governance role in MVP (`CAP-ADM-01..09`), responsible for user provisioning, role assignments, account lifecycle, tree master data management, task type catalog governance, proof policy configuration, checklist template versions, and audit log inspection.

Crucially, the frozen business baseline establishes the invariant: **Platform Administrator has ZERO normal Task mutation / execution / review / operational decision authority** (DENY on operational tasks: `OP-01`, `OP-02`, `OP-03`, `OP-04`, `OP-05..15`, `OP-16`, `OP-17..21`). Admin does not create daily operational tasks, does not assign work to staff, does not execute field proofing, does not manage operational review queues, and does not conduct field task reviews. However, frozen authorization permits Admin read-only access to **`OP-22 ViewCareHistory`** within `PLATFORM_GOVERNANCE_SCOPE` for botanical oversight and compliance inspection.

Currently, the repository contains a single Expo React Native mobile application (`apps/mobile`) designed exclusively for field use on handheld Android devices with five bottom navigation tabs (`HOME`, `MY_TREES`, `WORK`, `NOTIFICATIONS`, `ACCOUNT`). When an `admin` user logs into the mobile app, current code explicitly coerces them into the `Manager` role (`greenOpsService.ts` line 349), which violates business boundaries. The delivery topology for the Platform Administrator client surface is currently deferred and requires an architectural decision.

## Frozen Business Drivers
- **Three-Role Product Model:** Field Staff (`staff`), Operations Manager (`manager`), Platform Administrator (`admin`) are distinct roles with zero role inheritance.
- **Admin Authority Boundary (`BR-ACT-01`, `DR-HARD-01`):** Platform Admin is strictly confined to `PLATFORM_GOVERNANCE_SCOPE` (`CAP-ADM-01..09`). Normal operational task mutations, assignments, executions, and reviews are strictly DENIED. Admin retains explicitly approved read-only visibility into `OP-22 ViewCareHistory`.
- **Audit Log Inspection (`CAP-ADM-05`, `BR-ADM-05`, `GV-08`, `GV-09`):** Administrative inspection of security and audit events via `ViewAuditLog` and `FilterAuditLog` (multi-criteria filtering by actor, action, resource, date).
- **Master Data & Policy Governance (`CAP-ADM-06..09`, `BR-ADM-06..09`, `GV-10..19`):** Managing botanical tree species, geospatial coordinate updates, checklist template versions, and proof policy configurations.

## Technical & UX Assumptions (Non-Frozen Context)
- Governance workflows involve high-density data viewing (wide tables, complex multi-field filters, multi-step policy configuration), which are typically operated on desktop web browsers with physical keyboard and mouse.
- Mobile field devices are subject to field hazards (loss, shared usage, outdoor sunlight) that are suboptimal for dense administrative governance.
- Read-only tree care history (`OP-22 ViewCareHistory`) can be viewed within the desktop Admin Web portal alongside tree master data (`GV-10..14`).

## NFR / Quality Drivers
- **Usability & Information Density (`QAS-A11Y-01` contrast with Desktop Governance):** Mobile UI is optimized for outdoor, single-handed, high-contrast field interactions (touch target $\ge 48\text{px}$). Governance tasks benefit from desktop-scale layout, high tabular data density, and comprehensive filter controls.
- **Security & Attack Surface Hygiene (`QAS-SEC-01`):** Isolating administrative interfaces to a separate client application reduces accidental exposure of administrative UI elements to field workers and prevents administrative code from being bundled into mobile binaries distributed to field staff.
- **Maintainability & Deployment Independence:** Decoupling the release lifecycle of administrative governance tooling from field mobile APK updates.

## Current Technical Evidence
- `apps/mobile/src/screens/MobileApp.tsx`: Contains navigation and orchestration strictly for `StaffArea` and `ManagerArea`. Zero admin views exist.
- `apps/mobile/src/services/greenOpsService.ts`: `mapSessionRole` forcibly coerces `session.user.role === 'admin'` to `'Manager'`.
- `scripts/greenops-dev-api.cjs`: `login` route coerces `admin` identifier into `'manager'` role.
- Monorepo foundation (`ADR 0001`): Workspace already supports multi-app topologies (`apps/*`, `packages/*`).

## Decision Question
How should the Platform Administrator client interface be architected and delivered within the NOVYX platform?

## Options Considered

### Option A: Embedded Admin Workspace in Existing Mobile App (`apps/mobile`)
- **Description:** Add a third top-level area (`AdminArea`) into the existing Expo React Native mobile app alongside `StaffArea` and `ManagerArea`.
- **Advantages:**
  - Single application bundle and single codebase to build and test.
  - Reuses React Native components and shared mobile primitives.
- **Disadvantages:**
  - Severe ergonomic mismatch: Desktop-scale governance (audit logs, master data tables, policy JSON/schema forms) compressed into a 5-inch handheld screen.
  - Bloats field mobile APK size with administrative code never used by field workers.
  - Conflates field operational workflows with administrative governance.
  - Field mobile UI rules (5-tab notched bottom nav, large touch targets, outdoor themes) clash with dense administrative governance.
- **Risks:** High probability of compromised audit review usability; administrative UX confusion on mobile screens.
- **Migration Impact:** Moderate frontend changes in `MobileApp.tsx` and new mobile screens.
- **Operational Impact:** Low operational deployment complexity (single app store/APK deployment), but high administrative friction.

### Option B: Dedicated Admin Web Application (`apps/admin-web`) [RECOMMENDED]
- **Description:** Introduce a separate web application within the monorepo (`apps/admin-web`), built with standard web technologies (React/Vite or Next.js), consuming `@novyx/contracts` and `@novyx/ui` tokens.
- **Advantages:**
  - **Ergonomic Alignment:** Native desktop browser experience for tabular audit logs, complex filters, botanical data management, checklist authoring, and read-only care history inspection (`OP-22`).
  - **Reduced Surface Exposure:** Governance UI code, administrative session handlers, and management routes are separated from the public field APK.
  - **Independent Deployment:** Admin web can be deployed, updated, and versioned independently of mobile app store release cycles. Optional enterprise hardening (e.g., corporate network restriction, VPN, WAF) can be applied to the web host if required by the organization.
  - **Zero Mobile Bloat:** `apps/mobile` remains lightweight, dedicated 100% to field operations.
  - **Respects Monorepo Architecture (`ADR 0001`):** Shares DTO contracts and design tokens seamlessly.
- **Disadvantages:**
  - Introduces a second deployable frontend application in the monorepo.
  - Requires web build/test infrastructure in CI/CD.
- **Risks:** Scope creep if web UI libraries diverge from design tokens (mitigated by `@novyx/ui` and `@novyx/contracts`).
- **Migration Impact:** Zero disruption to `apps/mobile`; clean addition of `apps/admin-web`.
- **Operational Impact:** Independent hosting (e.g., static hosting via Cloudflare Pages / S3 / containerized web server); access restricted to platform administrators.

### Option C: Universal React Native Web App (Single App targeting Mobile + Web)
- **Description:** Use Expo Web / React Native for Web to compile `apps/mobile` into both mobile APK and desktop web bundle, dynamically rendering Admin screens when running on Web.
- **Advantages:**
  - Single framework (React Native) across both form factors.
  - Component logic shared across web and mobile.
  - Single application codebase.
- **Disadvantages:**
  - High complexity in responsive adaptive layouts between phone touch screens and multi-window desktop browsers.
  - Sub-optimal desktop web ergonomics (custom scrollbars, non-native table performance, complex web accessibility bridging).
  - High risk of regression when Expo SDK updates affect web compatibility.
- **Risks:** Fragile build pipelines; styling quirks with React Native Web primitives for complex enterprise data grids.
- **Migration Impact:** High refactoring of navigation and styling in `apps/mobile`.
- **Operational Impact:** Single codebase, but dual-platform QA overhead.

## Proposed Decision
**Adopt Option B: Dedicated Admin Web Application (`apps/admin-web`).**
*Recommendation Confidence: MEDIUM (pending formal confirmation of enterprise administrative hosting environment).*

Platform Governance (`CAP-ADM-01..09`, `GV-01..19`) and authorized administrative reads (including `OP-22 ViewCareHistory`) will be implemented as an independent web application (`apps/admin-web`) inside the monorepo workspace, sharing `@novyx/contracts` and `@novyx/ui`.

In the mobile app (`apps/mobile`), when a user with `role === 'admin'` attempts to authenticate, the mobile app will reject the login with a user-friendly error: `"Tài khoản Quản trị viên Nền tảng phải đăng nhập trên Cổng Quản trị Web (Admin Web Portal)."`, and refuse session initialization.

## Rationale
1. **Business Invariant Alignment:** The frozen business model explicitly separates Platform Governance from Field Operations. Admin has zero normal task operational mutation, assignment, or review authority. A dedicated web tool cleanly reflects this separation while accommodating authorized read-only care history inspection (`OP-22`).
2. **Usability & Ergonomics:** High-density audit logs (viewing hundreds of system events, filtering by actor/resource/date) and tree master data tables are inherently desktop workflows.
3. **Deployment Independence & Clean Surface Separation:** Separating the web application isolates administrative UI from field devices and allows independent deployment cadences.
4. **Monorepo Synergy:** Follows `ADR 0001`. Both applications consume the identical TypeScript API contracts (`@novyx/contracts`), ensuring 100% type safety without code duplication.

## Security Clarification (Critical Boundary)
- A separate Admin Web application separates the delivery/release surface and reduces accidental exposure of Admin UX to field users.
- **Client bundle separation is NOT an authorization boundary:** Server-side authentication and authorization (`ADR 0006`, `ADR 0007`) remain the sole authoritative security boundary. All administrative API endpoints (`/v1/governance/*`, `/v1/audit/*`) must independently authenticate and authorize callers, regardless of which client sends the request.
- Network restrictions (VPN, IP allowlisting, WAF) are optional operational deployment hardening measures, not frozen product requirements.

## Consequences
- **Positive:** `apps/mobile` remains lean, secure, and field-focused. Admin UI has full access to rich desktop web data grids and filters. Releases are completely decoupled.
- **Negative:** A new application workspace (`apps/admin-web`) must be initialized and maintained in CI/CD.
- **Neutral:** Backend REST endpoints serve both clients based on authenticated bearer token role claims.

## Offline / Reliability Impact
- None on field mobile: Field mobile offline resilience is unencumbered by administrative caching.
- Admin Web assumes standard internet connectivity; offline durable storage is not required for governance functions.

## Contract Impact
- Contracts in `@novyx/contracts` are partitioned into operational contracts (used by Mobile + Backend) and governance contracts (used by Admin Web + Backend).

## Migration / Compatibility
- Step 1: Remove the `mapSessionRole` admin-to-manager coercion in `apps/mobile/src/services/greenOpsService.ts` and replace with an explicit rejection for `role === 'admin'`.
- Step 2: Establish `apps/admin-web` scaffold in monorepo post-ADR approval.

## Rejected Alternatives
- **Option A (Mobile Embedding):** Rejected due to unacceptable usability degradation for audit/master data and clashing ergonomic requirements.
- **Option C (Universal RN Web):** Rejected due to unnecessary technical complexity and inferior web desktop ergonomics.

## Open Questions
1. Should `apps/admin-web` be built with Vite + React SPA or Next.js? (Vite SPA is recommended for a pure internal dashboard behind authentication).
2. What are the specific deployment hosting requirements for the admin web portal in the target infrastructure? (To be evaluated during implementation planning).

## Owner Decision Required
- [x] **APPROVE** Option B (Dedicated Admin Web Application `apps/admin-web`).
- [ ] **REJECT** and mandate mobile app embedding (Option A).
- [ ] **REQUEST_REVISION** with specific modifications.
