# ADR 0013: Backend Runtime & Relational Persistence Topology

## Status
PROPOSED

## Context
The frozen business baseline (Phase 0–10) establishes a comprehensive operational and governance platform comprising 5 Bounded Contexts, a 7-state task lifecycle, 3 proof profiles, 4 review outcomes, 48 canonical business commands, and multi-tier action eligibility enforcement.

However, in the current repository:
1. The only server-side artifact is a development/mock script: `scripts/greenops-dev-api.cjs` (537 lines), executed via `npm run api:dev`.
2. Multiple proposed ADRs (`ADR 0006`, `0007`, `0009`, `0010`, `0011`) critically depend on an authoritative production server runtime to execute use cases, enforce domain invariants, verify credentials/tokens across protected actions, handle idempotency caching, manage transactions, and write immutable audit logs.
3. No architectural decision currently defines the production backend application runtime or persistence topology.

Without deciding the backend topology candidate, downstream decisions risk either over-specifying technologies (e.g., prematurely assuming PostgreSQL, Redis, Kafka, or Kubernetes) or assuming non-existent infrastructure.

## Frozen Business Drivers
- **Authoritative Business Boundary:** The server is the sole authoritative gate for state mutations (`DOMAIN.md §3`), Separation of Duties (`SoD-01..07`), and immutable audit logging (`DR-POL-04`).
- **5 Bounded Contexts (`DOMAIN.md §2`):** Work Management, Tree Asset Registry, Policy & Template Governance, Audit & Compliance, Identity & Access Management.
- **Cross-Context Referential Meaning & Historical Integrity:** Tasks reference Trees, Proof Policies, Checklist Templates, Users (assignee/reviewer), and emit AuditEvents. Frozen business semantics require authoritative context ownership, referential meaning, and historical integrity across domain boundaries. *(Note: Relational storage topology, foreign keys, shared databases, or event buses are technical implementation mechanisms, NOT frozen business mandates).*
- **Simplicity & Development Discipline:** A business Bounded Context does NOT automatically imply a microservice, separate package, or separate database.

## NFR / Quality Drivers
- **Transactionality & Atomicity (`QAS-OFFLINE-01`, `QAS-FAULT-01`):** Task status updates, evidence linkages, outbox processing acknowledgments, and optimistic concurrency version increments require atomic execution for defined technical workflows.
- **Performance & Latency (`QAS-PERF-01`, `QAS-SEC-01`):** Sub-second token validation and lightweight query execution for mobile field workers and admin governance.
- **Maintainability & Monorepo Synergy (`ADR 0001`, `QAS-MAINT-01`):** Seamless sharing of `@novyx/contracts` TypeScript schemas between frontend and backend without translation layers or duplicate code generators.
- **Anti-Over-Engineering:** Avoid distributed infrastructure complexity (Kafka, Kubernetes, service meshes, distributed saga transactions) that exceeds platform requirements and team capacity.

## Current Technical Evidence
- `scripts/greenops-dev-api.cjs`: In-memory development script running on Node.js HTTP.
- `packages/contracts`: Pure TypeScript shared types and schemas, designed for zero-overhead import in Node.js.
- `package.json`: Workspace structure (`apps/*`, `packages/*`) natively ready to host a backend application workspace (e.g., `apps/api` or `apps/server`).

## Decision Question
What production server application runtime and persistence topology should be selected to provide the authoritative API and domain execution boundary for NOVYX GreenOps?

## Options Considered

### Option A: Modular Monolith Backend Application + Relational Database Family [RECOMMENDED]
- **Description:**
  - Build a single, deployable backend application (`apps/api`) using Node.js / TypeScript within the monorepo.
  - Internally organized into clean modules corresponding to the 5 Bounded Contexts, sharing a single relational database instance (e.g., PostgreSQL-compatible relational engine).
  - Cross-module operations execute within local in-process use cases and scoped transactions.
- **Advantages:**
  - **Monorepo Synergy:** Directly imports `@novyx/contracts` for runtime Zod validation (`ADR 0010`) and TypeScript types with zero build friction.
  - **ACID Transactions:** Concurrency version checking (`ADR 0009`), state mutation, and audit event insertion occur within scoped database transactions.
  - **Low Operational Complexity:** Single deployment artifact (container or Node process); standard relational database backup and monitoring; zero distributed transaction or network partition hazards.
  - **Pragmatic Evolvability:** Modules are cleanly decoupled via domain interfaces; if a specific context requires independent scaling in the distant future, it can be extracted without rewriting business logic.
- **Disadvantages:**
  - Scaled as a single unit (though stateless API processes scale horizontally behind a basic load balancer).
  - Requires discipline to prevent developers from writing ad-hoc cross-module SQL joins bypassing domain boundaries.
- **Risks:** Monolith becoming tightly coupled if module boundaries are not enforced via linting or folder structure (mitigated by Clean Architecture per `ADR 0012`).
- **Migration Impact:** Replaces `greenops-dev-api.cjs` with a structured `apps/api` workspace.
- **Operational Impact:** Low; single container and managed relational database.

### Option B: Serverless / Function-Oriented Backend (FaaS)
- **Description:** Deploy each API route or context as an independent serverless function (e.g., AWS Lambda, Cloud Functions) with serverless database connections.
- **Advantages:** Pay-per-use scaling; zero server idle cost.
- **Disadvantages:**
  - Cold start latency spikes, directly impacting mobile field workers and silent token refresh (`QAS-SEC-01` $\le 1$s).
  - Database connection exhaustion: Relational databases struggle with hundreds of concurrent ephemeral function connections.
  - Complex local development and testing environment compared to `npm run api:dev`.
- **Risks:** Unpredictable latency for offline outbox sync bursts; complex debugging across distributed invocations.
- **Migration Impact:** High; requires serverless framework setup.
- **Operational Impact:** Complex monitoring, distributed logging, cold start mitigation.

### Option C: Distributed Microservices Architecture
- **Description:** Deploy each of the 5 Bounded Contexts as an independent microservice with its own dedicated database, communicating via gRPC / REST or message broker (Kafka/RabbitMQ).
- **Advantages:** Completely independent deployment and tech stack flexibility for massive engineering teams.
- **Disadvantages:**
  - Extreme over-engineering for the current system scale.
  - Eliminates transactional boundaries across contexts: Requires distributed Sagas for workflows spanning Work Management, Tree Registry, and Audit.
  - High operational overhead: Service discovery, routing, distributed tracing, container orchestration (Kubernetes).
  - Drastically slows development velocity for a focused engineering team.
- **Risks:** System failure due to distributed complexity and network latency.
- **Migration Impact:** Severe; unmanageable overhead.
- **Operational Impact:** Very high cloud infrastructure and DevOps costs.

## Proposed Decision
**Adopt Option A: Modular Monolith Backend Application + Relational Database Family.**
*Recommendation Confidence: MEDIUM (pending Owner review of backend topology direction).*

1. **Application Runtime:**
   - Establish a backend application workspace in the monorepo (`apps/api`), implemented in **Node.js / TypeScript**.
   - Consume `@novyx/contracts` directly for request validation, response serialization, and shared error envelopes (`ADR 0003`, `ADR 0010`).
   - Organized internally by Bounded Context: `modules/work-management`, `modules/tree-registry`, `modules/governance`, `modules/audit`, `modules/iam`.
2. **Persistence Topology (Proposed Technical Consequence):**
   - Adopt the **Relational Database Family** (PostgreSQL-compatible relational engine recommended for production).
   - Use relational database foreign keys to enforce technical referential integrity where appropriate.
   - Enforce database user privilege separation (`REVOKE UPDATE, DELETE`) for the `audit_events` table as proposed in `ADR 0011`.
3. **Cross-Context Domain Ownership & Safety (Non-Negotiable Architecture Rule):**
   - **Crucial Rule:** Sharing a single physical relational database does **NOT** permit one module to bypass another module's authoritative domain ownership.
   - Modules must **NEVER** perform direct ad-hoc SQL mutations on tables owned by another bounded context.
   - Cross-module operations must pass through defined application service / use case interfaces.
   - Foreign Keys, if used, enforce technical referential consistency only; they do NOT confer mutation authority.
4. **Transaction Scope Discipline:**
   - ACID transactions are applied where the atomicity of a specific approved technical workflow requires it (e.g., updating task version, committing evidence records, and enqueueing audit events in a single workflow).
   - The architecture avoids turning cross-context handoffs into one giant monolithic transaction across all 5 contexts.
5. **HTTP / API Boundary:**
   - Expose the versioned REST API (`/v1/*`) per `ADR 0003`.
   - Apply neutral route-level middleware for authentication, token version verification across all protected actions, and coarse role gating per `ADR 0006` and `ADR 0007`.

## Rationale
Option A provides the simplest, most robust architecture that completely fulfills all frozen business and NFR requirements. It guarantees atomic transactions for critical workflows, avoids distributed systems failure modes, maximizes code reuse with TypeScript contracts, and keeps operational costs minimal.

## Consequences
- **Positive:** Single deployment target, full ACID guarantees for technical workflows, instant local testing (`npm run dev:api`), shared TypeScript types.
- **Negative:** Horizontal scaling scales the entire application rather than individual endpoints (acceptable given expected operational traffic).
- **Neutral:** Concrete HTTP framework (e.g., Fastify vs Express) and ORM/Query Builder (e.g., Kysely, Prisma, Drizzle) remain non-binding implementation choices to be finalized during implementation planning.

## Security Impact
- Centralizes authentication and authorization enforcement in a single server boundary.
- Direct database connection credentials remain strictly within backend infrastructure, never exposed to clients.

## Offline / Reliability Impact
- Fast, predictable API response times support smooth mobile Outbox synchronization without cold start delays.

## Contract Impact
- Directly imports and validates schemas from `@novyx/contracts`.

## Migration / Compatibility
- Cleanly transitions `scripts/greenops-dev-api.cjs` from a mock script to a structured production modular monolith (`apps/api`).

## Rejected Alternatives
- **Option B (Serverless FaaS):** Rejected due to cold start latency, connection pooling friction, and local testing overhead.
- **Option C (Distributed Microservices):** Rejected as disproportionate over-engineering that introduces distributed transaction fragility.

## Open Questions
1. Which specific relational database engine is preferred in the production environment? (PostgreSQL is recommended, but relational topology is vendor-neutral at the architecture level).
2. Which HTTP framework provides optimal performance and lightweight middleware integration? (Fastify or Express are standard candidates).

## Owner Decision Required
- [ ] **APPROVE** Option A (Modular Monolith Backend Application + Relational Database Family).
- [ ] **REJECT** and mandate alternative option.
- [ ] **REQUEST_REVISION** with specific modifications.
