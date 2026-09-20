# ADR 0011: Audit Trail Persistence & Tamper-Evident Integrity Architecture

## Status
PROPOSED

## Context
In the reconciled and frozen business baseline (Phase 0–10), the **Audit & Compliance** bounded context (`Audit & Compliance Subdomain`) is established as a critical supporting capability. The Platform Administrator is empowered in MVP with `CAP-ADM-05` to view and filter audit records (`ViewAuditLog`, `FilterAuditLog`).

Crucially, the frozen business rules mandate strict immutability invariants:
1. **Append-Only Historical Invariant (`DR-HARD-06`, `DR-POL-04`):** Audit events are strictly append-only. No product actor (including Platform Administrator or Operations Manager) possesses permission to mutate, overwrite, truncate, or delete historical audit entries (`P9-06`).
2. **Comprehensive Audit Scope:** All state-changing operations across the Operational Plane (Task transitions, Evidence submissions, Reviews, Rework requests, Cancellations) and Governance Plane (User provisioning, Role changes, Suspensions, Master data edits, Policy versions) must emit an `AuditEvent`.

In the current AS-IS implementation:
- No audit persistence mechanism exists in the codebase.
- In `packages/contracts`, there is no `AuditEventDto` or audit query schema.
- In `greenOpsService.ts`, actions emit no structured audit records; only transient `console.warn` or local state changes occur.

## Frozen Business Drivers
- **Audit Capabilities (`CAP-ADM-05`, `BR-ADM-05`):** Administrative querying and multi-criteria filtering of audit events by actor, action type, resource ID, and date range.
- **Strict Role Boundaries:** Staff and Manager cannot view system-wide audit logs; Platform Admin can view and filter audit logs, but has **zero mutation rights** over existing audit records.
- **Frozen Business Minimum Audit Fields:** Every audit event must deterministically record: `actorId`, `actorRole`, `actionType`, `resourceType`, `resourceId`, `timestamp` (ISO UTC), and `outcome` (`SUCCESS` | `FAILURE`).

## Proposed Technical Metadata (Non-Frozen Context)
- Additional technical attributes proposed for diagnostics and forensic analysis: `clientIp`, `userAgent`, `correlationId`, `beforeState` (summary), `afterState` (summary). These are classified as **PROPOSED TECHNICAL METADATA** and do not alter frozen business requirements.

## NFR / Quality Drivers
- **Tamper Evidence & Non-Repudiation:** Technical assurance that past audit logs cannot be modified undetected within the application and database user trust boundary.
- **Query Performance & Scalability:** Efficient pagination and indexing over hundreds of thousands of audit records without degrading operational database performance.
- **Cost-Proportional Simplicity:** Avoid premature, overly complex distributed ledger or blockchain technologies that add massive latency and operational friction without clear business justification.

## Threat Model & Integrity Trust Boundary
To evaluate integrity mechanisms honestly, the threat model defines the following boundaries:
1. **Threat Actor 1 — External Attacker / Compromised Application Account / Malicious Product Actor (Staff, Manager, Platform Admin):**
   - *Trust Boundary:* Bounded at the application and standard API layer.
   - *Defense:* Database user privilege separation (`REVOKE UPDATE, DELETE`) guarantees that no application bug, compromised API token, or SQL injection through the app user can modify or delete audit rows.
2. **Threat Actor 2 — Compromised Database Administrator (DBA) / Root Infrastructure Attacker:**
   - *Trust Boundary:* Bounded at the physical/cloud database root.
   - *Honest Protection Assessment:* A simple row hash chain stored within the database **does NOT prove non-repudiation against a root DBA**, because an attacker with full database mutation privileges can alter historical records and recompute the entire hash chain. Full protection against a rogue DBA requires an **external trust anchor** (e.g., periodic cryptographic hash checkpoints pushed to an immutable external log or WORM storage).
   - *Architecture Decision:* Unless the organization mandates external trust anchoring, row hash chaining is positioned as tamper-detection against internal partial tampering and data corruption, not cryptographic proof against root DBAs.

## Decision Question
What technical architecture, persistence strategy, and integrity mechanisms should be selected for the NOVYX Audit Trail to enforce append-only immutability, support concurrent writes, and provide fast administrative querying?

## Options Considered

### Option A: Standard Relational Table with Application-Level Immutability Only
- **Description:** Store audit events in a standard relational table. Only `INSERT` and `SELECT` queries are exposed in application code; no `UPDATE` or `DELETE` endpoints exist.
- **Advantages:** Simplest implementation; standard SQL queries, indexes, and migrations.
- **Disadvantages:**
  - Weak security boundary: Any database administrator, compromised DB user, or SQL injection vulnerability can execute `DELETE FROM audit_events` or `UPDATE audit_events`.
  - No cryptographic proof of non-tampering.
- **Risks:** Fails rigorous compliance or forensics standards if database credentials are leak-prone.
- **Migration Impact:** Low.
- **Operational Impact:** Low.

### Option B: Database Privilege Separation + Append-Only Table + Stream-Partitioned Hash Chaining [RECOMMENDED]
- **Description:**
  1. **Database-Level Privilege Separation (Primary Defense):**
     - Dependent on the backend relational persistence topology (`ADR 0013`).
     - The application connection uses a database user with permissions strictly restricted to `INSERT, SELECT` on `audit_events`. `UPDATE`, `DELETE`, `TRUNCATE`, and `DROP` are explicitly `REVOKED` at the database engine level (`REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM app_user;`).
  2. **Stream-Partitioned Hash Chaining (Mitigating Write Serialization Bottlenecks):**
     - *Concurrency Analysis:* A single global hash chain (`prev_hash` across all system events) forces serial ordering across every concurrent task update, review, and login across the platform, creating an severe database lock bottleneck.
     - *Solution:* Hash chaining is partitioned by resource stream (e.g., by `resource_type` and `resource_id`, or by Bounded Context stream), allowing independent concurrent audit writes without global lock contention.
     - `hash = SHA256(prev_stream_hash + event_id + timestamp + actor_id + action + resource_id + payload_summary)`.
  3. **Direct Table Indexing:**
     - Composite indexes on `(actor_id, timestamp)`, `(resource_type, resource_id)`, and `(action_type, timestamp)` guarantee fast query performance for Admin Web (`CAP-ADM-05`).
- **Advantages:**
  - **Robust Defense in Depth:** Application layer compromises cannot modify or delete audit rows.
  - **No Global Write Bottleneck:** Stream-partitioned chaining allows high-throughput concurrent writes across different tasks and users.
  - **Zero Exotic Infrastructure:** Operates entirely within standard relational database engines without third-party blockchain services.
  - **Fast Administrative Filtering:** Native SQL queries with composite indexes support responsive pagination on Admin Web.
- **Disadvantages:**
  - Does not prevent tampering by a root DBA without an external cryptographic anchor.
  - Stream hash lookup requires tracking previous hash per resource stream.
- **Risks:** Low; pragmatic, scalable integrity assurance.
- **Migration Impact:** Clean addition of schema and database role configuration.
- **Operational Impact:** Standard relational database maintenance.

### Option C: Distributed Ledger / Blockchain (Hyperledger / Ethereum / AWS QLDB)
- **Description:** Write every audit event to a private blockchain or cloud ledger.
- **Advantages:** Cryptographic immutability enforced by distributed consensus.
- **Disadvantages:**
  - Extreme over-engineering for an urban green management platform.
  - High operational complexity, slow write latency (hundreds of milliseconds to seconds), and high cloud costs.
  - Complex query limitations (poor support for multi-criteria relational filtering needed by `CAP-ADM-05`).
- **Risks:** Vendor lock-in, latency bottlenecks, high operational burden.
- **Migration Impact:** Severe; requires external SDKs and consensus management.
- **Operational Impact:** High maintenance and hosting costs.

## Proposed Decision
**Adopt Option B: Database-Level Privilege Separation + Append-Only Table + Stream-Partitioned Hash Chaining.**
*Recommendation Confidence: MEDIUM (depends on backend persistence engine selection in ADR 0013 and organizational threat model confirmation).*

1. **Database Privilege Controls:**
   - For relational databases (e.g., PostgreSQL-compatible per `ADR 0013`), configure application user privileges:
     ```sql
     -- Conditional implementation candidate for relational engine
     GRANT SELECT, INSERT ON audit_events TO novyx_app_user;
     REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM novyx_app_user;
     ```
2. **Schema Definition (Candidate Relational Schema):**
   - Fields: `id UUID PRIMARY KEY`, `sequence_number BIGSERIAL`, `timestamp TIMESTAMPTZ`, `actor_id VARCHAR(64)`, `actor_role VARCHAR(32)`, `action_type VARCHAR(64)`, `resource_type VARCHAR(64)`, `resource_id VARCHAR(64)`, `outcome VARCHAR(16)`, `payload_summary JSONB`, `prev_hash VARCHAR(64)`, `current_hash VARCHAR(64)`.
   - Technical metadata fields: `client_ip VARCHAR(45)`, `user_agent TEXT`, `correlation_id VARCHAR(64)`.
3. **Integrity Scope:**
   - Detects application-level tampering, payload corruption, and non-superuser manual database tampering.
   - External trust anchoring (e.g., publishing daily Merkle roots to external immutable storage) is deferred as an optional hardening measure.

## Rationale
Option B satisfies the absolute append-only invariant of the frozen business baseline while preserving standard relational query efficiency for Admin Web. Partitioning hash chains by stream eliminates global concurrency write bottlenecks.

## Consequences
- **Positive:** Complete append-only enforcement against application users, fast multi-criteria queries, scalable concurrent writes.
- **Negative:** Database setup scripts must configure explicit user roles and permissions.
- **Neutral:** Cold storage archiving policies (e.g., moving audit events older than 1 year to compressed storage) can be scheduled in future operational phases.

## Security Impact
- Non-repudiation of operational and governance actions within the application trust boundary.
- Any attempt to modify audit records via application accounts is rejected by the database engine.

## Offline / Reliability Impact
- Audit events are emitted on the backend server upon receiving verified API commands. Mobile clients do not directly write to central audit tables; mobile operational timestamps are captured in payload metadata.

## Contract Impact
- Add to `@novyx/contracts`:
  - `AuditEventDto`: Standard structure for audit log responses.
  - `ListAuditLogsQuery`: Filter parameters (`actorId`, `role`, `actionType`, `resourceType`, `from`, `to`, `cursor`, `limit`).

## Migration / Compatibility
- Implemented as a dedicated module (`modules/audit`) within the backend architecture (`ADR 0012`, `ADR 0013`).

## Rejected Alternatives
- **Option A (Plain Table with no DB constraints):** Rejected due to lack of defense-in-depth and vulnerability to application-level tampering.
- **Option C (Blockchain / QLDB):** Rejected as disproportionate over-engineering with high latency and cost.

## Open Questions
1. Is external cryptographic anchoring (e.g., daily external Merkle root publication) required for compliance against privileged DBA threat actors? (To be evaluated during compliance review).

## Owner Decision Required
- [ ] **APPROVE** Option B (Database Privilege Separation + Stream-Partitioned Hash Chaining).
- [ ] **REJECT** and mandate alternative option.
- [ ] **REQUEST_REVISION** with specific modifications.
