# ADR 0005: Platform Administrator Client Delivery Topology

## Status
PROPOSED

## Context
In the reconciled and frozen business baseline (Phase 0–10), the **Platform Administrator** (`admin`) is established as an active human governance role in MVP (`CAP-ADM-01..09`), responsible for user provisioning, role assignments, account lifecycle, tree master data management, task type catalog governance, proof policy configuration, checklist template versions, and audit log inspection.

Crucially, the frozen business baseline establishes the invariant: **Platform Administrator has zero field operational task permissions** (DENY on `OP-03..15` and `OP-17..21`). Admin does not create daily operational tasks, does not assign work to staff, does not execute field proofing, and does not conduct field task reviews.

Currently, the repository contains a single Expo React Native mobile application (`apps/mobile`) designed exclusively for field use on handheld Android devices with five bottom navigation tabs (`HOME`, `MY_TREES`, `WORK`, `NOTIFICATIONS`, `ACCOUNT`). When an `admin` user logs into the mobile app, current code explicitly coerces them into the `Manager` role (`greenOpsService.ts` line 349), which violates business boundaries. The delivery topology for the Platform Administrator client surface is currently deferred and requires an architectural decision.

## Frozen Business Drivers
- **Three-Role Product Model:** Field Staff (`staff`), Operations Manager (`manager`), Platform Administrator (`admin`) are distinct roles with zero role inheritance.
- **Admin Invariant (`BR-ACT-01`, `DR-HARD-01`):** Platform Admin is strictly confined to `PLATFORM_GOVERNANCE_SCOPE` (`CAP-ADM-01..09`). Normal operational task actions are DENIED.
- **Audit Log Inspection (`CAP-ADM-05`, `BR-ADM-05`):** Administrative inspection of security and audit events requires high-density tabular browsing, multi-criteria filtering, and log export.
- **Master Data & Policy Governance (`CAP-ADM-06..09`, `BR-ADM-06..09`):** Managing botanical tree species, geospatial coordinate updates, checklist versioning, and policy mappings involves complex form editing and desktop-scale data views.

## NFR / Quality Drivers
- **Usability & Information Density (`QAS-A11Y-01` contrast with Desktop Governance):** Mobile UI is optimized for outdoor, single-handed, high-contrast field interactions (touch target $\ge 48\text{px}$). Governance tasks are indoor, desktop-based, keyboard/mouse-driven workflows with high information density.
- **Security & Attack Surface Reduction (`QAS-SEC-01`):** Governance credentials should not be exposed on shared or personal mobile devices used in the field. Administrative sessions require strict timeout controls, IP restrictions, and isolated token storage.
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
  - Increases security risk: Admin governance logic and bundle distributed to every field device.
  - Field mobile UI rules (5-tab notched bottom nav, large touch targets, outdoor themes) clash with enterprise desktop administration.
- **Risks:** High probability of compromised audit review usability; security exposure of admin endpoints in mobile binary.
- **Migration Impact:** Moderate frontend changes in `MobileApp.tsx` and new mobile screens.
- **Operational Impact:** Low operational deployment complexity (single app store/APK deployment), but high administrative frustration.

### Option B: Dedicated Admin Web Application (`apps/admin-web`) [RECOMMENDED]
- **Description:** Introduce a separate web application within the monorepo (`apps/admin-web`), built with React/Vite or Next.js, consuming `@novyx/contracts` and `@novyx/ui` tokens.
- **Advantages:**
  - Optimal ergonomics: Native desktop browser experience for tabular audit logs, complex filters, botanical data management, and checklist authoring.
  - Complete security isolation: Governance code, session handlers, and routes are never bundled into the public field APK.
  - Independent deployment: Admin web can be deployed to internal VPC/private subnet with IP whitelisting, VPN, and independent release cycles.
  - Zero mobile bloat: `apps/mobile` remains lightweight, dedicated 100% to field operations.
  - Respects monorepo architecture (`ADR 0001`): Shares DTO contracts and design tokens seamlessly.
- **Disadvantages:**
  - Introduces a second deployable frontend application in the monorepo.
  - Requires web build/test infrastructure in CI/CD.
- **Risks:** Scope creep if web UI libraries diverge from design tokens (mitigated by `@novyx/ui` and `@novyx/contracts`).
- **Migration Impact:** Zero disruption to `apps/mobile`; clean addition of `apps/admin-web`.
- **Operational Impact:** Independent hosting (e.g., S3/CloudFront, Cloudflare Pages, or containerized web server); access restricted to platform administrators.

### Option C: Universal React Native Web App (Single App targeting Mobile + Web)
- **Description:** Use Expo Web / React Native for Web to compile `apps/mobile` into both mobile APK and desktop web bundle, dynamically rendering Admin screens when running on Web.
- **Advantages:**
  - Single framework (React Native) across both form factors.
  - Component logic shared across web and mobile.
- **Disadvantages:**
  - High complexity in responsive adaptive layouts between phone touch screens and multi-window desktop browsers.
  - Sub-optimal desktop web ergonomics (custom scrollbars, non-native table performance, complex web accessibility bridging).
  - High risk of regression when Expo SDK updates affect web compatibility.
- **Risks:** Fragile build pipelines; styling quirks with React Native Web primitives for complex enterprise data grids.
- **Migration Impact:** High refactoring of navigation and styling in `apps/mobile`.
- **Operational Impact:** Single codebase, but dual-platform QA overhead.

## Proposed Decision
**Adopt Option B: Dedicated Admin Web Application (`apps/admin-web`)**.

Platform Governance (`CAP-ADM-01..09`) will be implemented as an independent web application (`apps/admin-web`) inside the monorepo workspace, sharing `@novyx/contracts` and `@novyx/ui`.

In the mobile app (`apps/mobile`), when a user with `role === 'admin'` attempts to authenticate, the mobile app will reject the login with a user-friendly error: `"Tài khoản Quản trị viên Nền tảng phải đăng nhập trên Cổng Quản trị Web (Admin Web Portal)."`, and refuse session initialization.

## Rationale
1. **Business Invariant Alignment:** The frozen business model explicitly separates Platform Governance from Field Operations. Admin has zero field operations. A dedicated web tool mirrors this domain reality.
2. **Usability & Ergonomics:** High-density audit logs (viewing hundreds of system events, filtering by actor/resource/date) and tree master data tables are inherently desktop workflows.
3. **Defense in Depth & Security:** Isolating admin capabilities to a separate web channel allows organizations to enforce network boundaries (e.g., internal corporate network, VPN, Web Application Firewall) without impacting field staff working over cellular networks.
4. **Clean Code & Monorepo Foundation:** Follows `ADR 0001`. Both applications consume the identical TypeScript API contracts (`@novyx/contracts`), ensuring 100% type safety and contract synchronization without code duplication.

## Consequences
- **Positive:** `apps/mobile` remains lean, secure, and field-focused. Admin UI has full access to rich desktop web data grids and charts. Releases are completely decoupled.
- **Negative:** A new application workspace (`apps/admin-web`) must be initialized and maintained in CI/CD.
- **Neutral:** Backend REST endpoints (`/v1/governance/*`, `/v1/audit/*`) serve both clients based on authenticated bearer token role claims.

## Security Impact
- Eliminates administrative code and sensitive API routes from mobile client binaries.
- Allows strict Web-specific security headers (CSP, HSTS, SameSite cookies or short-lived memory tokens).
- Enables IP restriction and corporate SSO integration specifically for administrative accounts.

## Offline / Reliability Impact
- None on field mobile: Field mobile offline resilience is unencumbered by administrative caching.
- Admin Web assumes standard enterprise internet connectivity; offline storage is not required for governance functions.

## Contract Impact
- Contracts in `@novyx/contracts` will be categorized into operational endpoints and governance endpoints, both consumed by their respective frontends.

## Migration / Compatibility
- Step 1: Remove the `mapSessionRole` admin-to-manager coercion in `apps/mobile/src/services/greenOpsService.ts` and replace with an explicit rejection for `role === 'admin'`.
- Step 2: Establish `apps/admin-web` scaffold in monorepo post-ADR approval.

## Rejected Alternatives
- **Option A (Mobile Embedding):** Rejected due to unacceptable usability degradation for audit/master data and increased mobile attack surface.
- **Option C (Universal RN Web):** Rejected due to unnecessary technical complexity and inferior web desktop ergonomics.

## Open Questions
1. Should `apps/admin-web` be built with Vite + React SPA or Next.js? (Vite SPA is recommended for a pure internal dashboard behind authentication).
2. Is multi-factor authentication (MFA) mandatory for Admin Web at MVP? (Recommended for Phase 11 IAM decision).

## Owner Decision Required
- [ ] **APPROVE** Option B (Dedicated Admin Web Application `apps/admin-web`).
- [ ] **REJECT** and mandate mobile app embedding (Option A).
- [ ] **REQUEST_REVISION** with specific modifications.
