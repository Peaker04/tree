# ADR 0012: Clean Architecture Layering & Transitional Facade (`greenOpsService`) Decomposition

## Status
ACCEPTED

## Acceptance Scope
- **ACCEPTED:**
  - Pragmatic Clean Architecture (Ports & Adapters) within the monorepo structure.
  - Strict authority boundary locked:
    - **Server Application / Domain Core = AUTHORITATIVE:** Sole arbiter of state transitions, invariants, SoD, and audit logging.
    - **Mobile Local Model = LOCAL / ADVISORY / OFFLINE BUFFER:** Manages SQLite draft integrity, Outbox queue buffering, and UI ergonomics without security authority.
  - Unidirectional dependency flow: `Presentation → Application → Domain Core`; `Infrastructure` implements ports/interfaces defined by inner layers.
  - Decomposition of `greenOpsService.ts` into single-responsibility adapters (`SqliteTaskRepository`, `RestApiAdapter`, `OutboxQueue`, `AuthService`) and `MobileApp.tsx` into standalone screen modules.
- **NOT ACCEPTED / STILL OPEN (Implementation Decisions):**
  - Arbitrary file line-count targets.
  - Exact class, interface, or provider names.
  - Separate npm packages per Bounded Context (avoided as unnecessary friction).
  - Separate microservices per Bounded Context (explicitly rejected).

## Context
The current mobile codebase (`apps/mobile`) operates as a client-side monolith with heavy architectural coupling:
1. **Monolithic Component Root (`MobileApp.tsx` - 2,054 lines):** Coordinates global state, screen routing, inline JSX forms for login/forgot, prop-drills over 30 properties down to `StaffArea` and `ManagerArea`, and directly handles data source notifications.
2. **Overloaded Transitional Facade (`greenOpsService.ts` - 856 lines):** Combines HTTP network client, mock data generator, in-memory volatile snapshot store (`let snapshot: AppData`), session manager, and domain calculations (`buildCareHistory`) in a single catch-all service.
3. **Domain Logic Inversion:** In `ManagerReview.tsx` (lines 132-136, 163-167), UI presentation code manually constructs mutated `fallbackTask` objects with new statuses (`COMPLETED` or `REWORK_REQUIRED`) and passes them down into `greenOpsService.reviewTask(request, fallbackTask)`. The presentation layer acts as the state machine instead of a protected domain core!
4. **Conflated Navigation and Workflow:** `mobileWorkflow.ts` merges top-level screen navigation (`HOME`, `MY_TREES`, `WORK`) with granular evidence collection steps (`GPS`, `QR`, `BEFORE`, `CHECKLIST`, `AFTER`).

`ARCHITECTURE.md` proposes Clean Architecture / Ports & Adapters, but this proposal has not yet been formalized or approved through an ADR. At the same time, we must adhere strictly to the rule: **A business Bounded Context does NOT automatically imply a separate microservice, separate npm package, or separate database**. Over-engineering into dozens of microservices or micro-packages would paralyze development velocity.

## Authoritative Boundary Rule: Server vs Mobile Domain Models
Architecture must maintain a strict separation of authority between client and server domain models:
- **Server Domain & Application Core (AUTHORITATIVE):** The server is the sole authoritative source of truth for business invariants, state machine transitions, Separation of Duties enforcement, and audit logging.
- **Mobile Domain & Application Model (ADVISORY & OFFLINE BUFFER):** The mobile domain model provides immediate ergonomic feedback (disabling buttons, checking pre-conditions), manages offline draft integrity in SQLite, and buffers actions in the Outbox queue. Under no circumstances is the mobile domain aggregate treated as an authoritative security boundary.

## Frozen Business Drivers
- **5 Canonical Bounded Contexts (`DOMAIN.md §2`, `Report 06 §3`):**
  - `Work Management` (CORE DOMAIN)
  - `Tree Asset Registry` (SUPPORTING SUBDOMAIN)
  - `Policy & Template Governance` (SUPPORTING SUBDOMAIN)
  - `Audit & Compliance` (SUPPORTING SUBDOMAIN)
  - `Identity & Access Management` (GENERIC SUBDOMAIN)
- **7-State Task Lifecycle Invariants:** Task state mutations are governed strictly by state machine rules, never by client UI whim.
- **Single CareHistory Origin (`BR-11`, `DR-HARD-07`):** CareHistory is projected exclusively from tasks in state `COMPLETED`.

## NFR / Quality Drivers
- **Maintainability & Testability (`QAS-MAINT-01`):** Domain rules, state machine transitions, and evidence validation must be unit-testable in pure TypeScript without mounting React components or mocking HTTP servers.
- **Zero Data Loss & Resilience (`QAS-OFFLINE-01`, `QAS-OFFLINE-02`):** Decouple UI state from persistence so that crashes or background kills do not wipe uncommitted work.
- **Simplicity & Anti-Over-Engineering:** Avoid creating 20 micro-packages or separate network services. Maintain a pragmatic modular monolith architecture with clean internal boundaries.

## Decision Question
How should the mobile application and platform architecture be structured into layers, and how should the transitional `greenOpsService` and `MobileApp.tsx` monoliths be decomposed without unnecessary architectural overhead?

## Options Considered

### Option A: Retain Single Service Facade with Internal Helpers
- **Description:** Keep `greenOpsService.ts` and `MobileApp.tsx` as the primary files, but extract helper utility functions into smaller files.
- **Advantages:** Minimal file reorganization.
- **Disadvantages:**
  - Fails to fix the core problem: Prop drilling, UI state leakage, and inability to unit test use cases in isolation remain.
  - High risk of regression whenever `greenOpsService` is edited.
  - Does not establish clear Ports and Adapters.
- **Risks:** Continued technical debt accumulation.
- **Migration Impact:** Low.
- **Operational Impact:** None.

### Option B: Pragmatic Clean Architecture (Ports & Adapters) within Monorepo [RECOMMENDED]
- **Description:**
  Establish 4 distinct concentric layers within `apps/mobile` (and shared backend code) without creating premature npm packages:
  1. **Presentation Layer (`src/presentation/`):**
     - UI Screens, ViewModels / Custom Hooks, pure presentational components.
     - *Zero business rules, zero direct SQLite/HTTP calls.*
  2. **Application Layer (`src/application/`):**
     - Command Use Cases: `StartTaskUseCase`, `SubmitEvidenceUseCase`, `ResolveBlockedUseCase`, `ReviewTaskUseCase`, `CancelTaskUseCase`, `ReassignTaskUseCase`.
     - Query Use Cases: `ListAssignedTasksUseCase`, `LookupTreeByQrUseCase`, `GetCareHistoryUseCase`.
     - *Orchestrates domain entities and interfaces; agnostic of UI framework.*
  3. **Domain Core (`src/domain/`):**
     - Aggregates & Entities: `Task`, `Tree`, `SiteVerification`.
     - Value Objects: `ProofProfile`, `Coordinates`, `GpsCheck`, `QrCheck`.
     - Domain Invariants & Policy Evaluators: `canPerformAction()`, `SoD` checks.
     - *Pure TypeScript. Zero dependencies on React, Expo, SQLite, or HTTP.*
  4. **Infrastructure Layer (`src/infrastructure/`):**
     - Adapters implementing Ports:
       - `SqliteTaskRepository` & `SqliteOutboxQueue` (implementing `ITaskRepository`, `IOutboxQueue` per `ADR 0008`).
       - `RestApiAdapter` (implementing `IApiClient` per `ADR 0003`).
       - `ExpoHardwareAdapter` (camera & location permissions/sensors).
       - `SecureStoreAuthRepository` (session persistence per `ADR 0006`).
- **Advantages:**
  - **Testable Core:** Core business rules (state machine, proof profiles, SoD) are testable via fast unit tests in milliseconds without React or native mocks.
  - **Pragmatic Decomposition:** Decomposes the 856-line `greenOpsService` into single-responsibility adapters and use cases without fragmenting into dozens of npm packages.
  - **Prevents UI Domain Leakage:** UI components simply invoke use cases with pure command arguments; use cases coordinate with domain entities and persistence adapters.
  - **Clear Dependency Direction:** Outer layers depend on inner layers; inner layers know nothing of outer layers.
- **Disadvantages:**
  - Requires disciplined folder structure and interface boundaries.
  - Initial refactoring effort across existing mobile screens.
- **Risks:** Over-abstraction if developers create boilerplate interfaces for trivial operations (mitigated by pragmatic guidelines).
- **Migration Impact:** Phased migration (Use Cases introduced behind existing screens).
- **Operational Impact:** None.

### Option C: Distributed Microservices & Micro-Frontends
- **Description:** Split every Bounded Context into an independent deployable microservice with separate databases, and split the mobile app into multiple federated micro-apps.
- **Advantages:** Total deployment decoupling for massive engineering teams.
- **Disadvantages:**
  - Catastrophic over-engineering for the current product stage.
  - Massive network latency, complex distributed transactions (Sagas), multi-repo overhead, and deployment complexity.
  - Extreme friction for a focused engineering team.
- **Risks:** System gridlock; project failure due to operational complexity.
- **Migration Impact:** Unmanageable.
- **Operational Impact:** Requires Kubernetes, service meshes, distributed tracing, and high cloud bills.

## Proposed Decision
**Adopt Option B: Pragmatic Clean Architecture (Ports & Adapters) within the Monorepo.**
*Recommendation Confidence: HIGH (well-established pattern to untangle monoliths without microservice overhead).*

### Responsibility Mapping for Decomposing `greenOpsService.ts`

| Trách nhiệm hiện tại trong `greenOpsService` | Thành phần thay thế mục tiêu (Target Component) | Tầng kiến trúc (Layer) | Căn cứ quyết định |
| :--- | :--- | :--- | :--- |
| Gọi HTTP REST `/v1/` và xử lý envelope | `RestApiAdapter` / `HttpClient` | Infrastructure | `ADR 0003` (Contract-First REST) |
| Quản lý token, login, logout, restoreSession | `AuthService` & `SecureStoreAuthRepository` | Application / Infra | `ADR 0006` (IAM & Session Lifecycle) |
| Lưu trữ và cập nhật danh sách Task, Tree | `SqliteTaskRepository`, `SqliteTreeRepository` | Infrastructure | `ADR 0008` (Offline Durable SQLite) |
| Hàng đợi ngoại tuyến & đồng bộ bằng chứng | `OutboxQueue` & `OutboxSyncWorker` | Infrastructure | `ADR 0008` (Offline Outbox) |
| Quản lý máy trạng thái Task và chuyển bước | `TaskAggregate` (Domain Entity) | Domain Core | `DOMAIN.md §3`, `WORKFLOWS.md §2` |
| Tính toán `buildCareHistory` | `CareHistoryProjector` | Domain / Application | `BR-11` (Chỉ chiếu từ `COMPLETED`) |
| Quản lý thông báo | `NotificationRepository` | Infrastructure | Hỗ trợ read-model thông báo |

### Phân rã `MobileApp.tsx` (Non-Binding Implementation Direction)
1. Extract Auth / Login UI into standalone screen files (retiring dead code and eliminating inline JSX in `MobileApp`).
2. Replace prop-drilling with focused state management (e.g., React Context or lightweight store for session, task queue, and connectivity).
3. `MobileApp.tsx` focuses strictly on root routing and provider assembly.

## Rationale
Option B eliminates technical debt, provides rock-solid unit testability for business rules, and protects the codebase against regression without falling into the microservice over-engineering trap.

## Consequences
- **Positive:** UI presentation is cleanly separated from business logic. Testability reaches high coverage for domain logic. Code files become concise and maintainable.
- **Negative:** Requires refactoring the existing facade during Phase 12 implementation.
- **Neutral:** The existing facade can be refactored step-by-step using the Strangler Fig pattern.

## Security Impact
- Ensures authorization and validation logic cannot be bypassed by UI manipulation.
- Clarifies that mobile domain checks are advisory; server domain core remains the sole authoritative gate.

## Offline / Reliability Impact
- Directly integrates with `ADR 0008` SQLite repositories to provide complete offline resilience.

## Contract Impact
- None. Adapters continue to consume `@novyx/contracts`.

## Migration / Compatibility
- Step 1: Establish `domain/`, `application/`, and `infrastructure/` directory scaffolds.
- Step 2: Implement `Task` domain aggregate and use cases with automated tests.
- Step 3: Implement `SqliteTaskRepository` and replace `greenOpsService` calls screen by screen.

## Rejected Alternatives
- **Option A (Keep Monolithic Facade):** Rejected due to persistent technical debt, domain leakage, and lack of testability.
- **Option C (Microservices):** Rejected as grotesque over-engineering.

## Open Questions
- None. Fully aligns with `ARCHITECTURE.md` target intent and frozen business baseline.

## Owner Decision Required
- [x] **APPROVE** Option B (Pragmatic Clean Architecture Layering & Facade Decomposition).
- [ ] **REJECT** and mandate alternative option.
- [ ] **REQUEST_REVISION** with specific modifications.
