# Phase 11 Owner ADR Decisions

**Baseline Review Packet Commit:** `8e73f71c478a5ca7d58d7b7ffb2f132b2c92cedc`
**Governance State:** BINDING OWNER DECISION LEDGER
**Batch Summary:** 5 ACCEPTED | 4 PROPOSED (REQUEST_REVISION) | 0 REJECTED

---

## Decision Batch 1

| ADR | Owner Decision | Accepted / Revision Direction | Resulting ADR Status |
| :--- | :--- | :--- | :--- |
| **ADR 0013** | **APPROVE** | **Option A (Modular Monolith Backend + Relational Database Family)** accepted. Authoritative production backend in Node.js/TypeScript with 5 internal Bounded Context modules and scoped ACID transactions. PostgreSQL remains a recommendation; concrete DB vendor, HTTP framework (Fastify/Express), and ORM remain open implementation choices. | **ACCEPTED** |
| **ADR 0005** | **APPROVE** | **Option B (Dedicated Admin Web Application `apps/admin-web`)** accepted. Desktop governance UI with authorized read-only `OP-22 ViewCareHistory`. Zero normal task operational mutation/review authority. Web framework, UI library, and network hosting perimeter remain open implementation choices. | **ACCEPTED** |
| **ADR 0010** | **REQUEST_REVISION** | Reaffirm Zod schema-first contracts, but enforce strict architectural separation between Business Command Payloads (`expectedVersion` + business fields) and HTTP Transport Metadata (`Idempotency-Key` header). Update DTO schemas accordingly. | **PROPOSED** |
| **ADR 0006** | **REQUEST_REVISION** | Reaffirm non-negotiable security semantics: 4-state `AccountStatus`, `WF-12` revocation covering all protected online actions (reads and mutations), rotating refresh tokens, and offline draft preservation. Revise architecture so access credential representation (opaque token vs signed JWT) is an implementation-level choice rather than mandating asymmetric JWT/JWKS at the architecture level. | **PROPOSED** |
| **ADR 0007** | **APPROVE** | **Option B (Multi-Tier Defense-in-Depth Authorization Policy)** accepted. Tier 1 Client Advisory UX, Tier 2 Server Request Boundary Coarse Gate, Tier 3 Domain Core Fine-Grained Eligibility (`ROLE ∧ SCOPE ∧ STATE ∧ PRECONDITIONS`). Historical evidence authorship Separation of Duties (`SoD-02`) strictly locked. | **ACCEPTED** |
| **ADR 0012** | **APPROVE** | **Option B (Pragmatic Clean Architecture / Ports & Adapters)** accepted. Server domain/application core = AUTHORITATIVE; mobile domain model = LOCAL / ADVISORY. Unidirectional dependency flow (`Presentation → Application → Domain`, Infrastructure implements ports). | **ACCEPTED** |
| **ADR 0008** | **REQUEST_REVISION** | Reaffirm `expo-sqlite` + sandbox filesystem + durable Outbox. Align DTO naming to canonical `SubmitEvidenceRequest` (command: `SubmitEvidence`). Remove `idempotencyKey` from business payload body, binding it to the HTTP `Idempotency-Key` transport header. Preserve empirical reliability testing requirements; leave photo retention period open. | **PROPOSED** |
| **ADR 0009** | **APPROVE** | **Option B (Command Payload OCC `expectedVersion` + HTTP `Idempotency-Key` Header)** accepted. Atomic optimistic version checking returning `409 CONFLICT: STALE_VERSION`. Safe retry semantics where identical logical retry reuses the same idempotency key, and local evidence survives conflicts. Final numeric idempotency TTL remains open pending operational measurement ($\ge$ max offline retry horizon). | **ACCEPTED** |
| **ADR 0011** | **REQUEST_REVISION** | Reaffirm append-only audit trail and database privilege separation (`GRANT INSERT, SELECT; REVOKE UPDATE, DELETE`). Remove stream-partitioned hash chaining from mandatory MVP scope, reclassifying cryptographic tamper-evidence as an optional future hardening capability when compliance dictates. | **PROPOSED** |

---

## Ledger Summary Statistics

- **Total Decisions Evaluated:** 9
- **Total ACCEPTED:** 5 (ADR 0013, ADR 0005, ADR 0007, ADR 0012, ADR 0009)
- **Total PROPOSED (Under Owner Revision):** 4 (ADR 0006, ADR 0008, ADR 0010, ADR 0011)
- **Total REJECTED:** 0
- **Status Invariant:** Existing foundational ADRs `0001` through `0004` remain unchanged in historical `ACCEPTED` status.
