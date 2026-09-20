# ADR 0011: Audit Trail Persistence & Tamper-Evident Integrity Architecture

## Status
ACCEPTED

## Acceptance Scope

ACCEPTED:
- `AuditEvent` persisted centrally on the authoritative server side.
- Append-only behavior enforced at the database engine level.
- Application runtime database identity granted `INSERT` and `SELECT` permissions.
- Normal `UPDATE`, `DELETE`, `TRUNCATE` authority over audit history denied.
- Database-level privilege separation provides defense-in-depth within the application and standard database user trust boundary.
- Efficient query and composite index support for `ViewAuditLog` and `FilterAuditLog` on Admin Web.
- Technical metadata (`clientIp`, `userAgent`, `correlationId`, summaries) may be added.

NOT ACCEPTED FOR MVP:
- Stream hash chaining
- Global hash chaining
- Blockchain / distributed ledgers
- External Merkle anchoring
- WORM storage requirement
- Cryptographic non-repudiation claim

SECURITY CLAIM PRECISION:
- Append-only integrity operates within the application and normal database-user trust boundary.
- It protects against product actors, application bugs, compromised application credentials, and accidental application `UPDATE`/`DELETE`.
- It does NOT prove cryptographic non-repudiation against a root DBA, infrastructure owner, or cloud storage administrator with privileged direct mutation ability.

DATABASE VENDOR NEUTRALITY:
- ADR 0013 accepted the Relational Database Family; it did not lock PostgreSQL.
- SQL syntax examples (such as `BIGSERIAL`, `TIMESTAMPTZ`, `JSONB`, `GRANT`/`REVOKE`) are ILLUSTRATIVE / POSTGRESQL-LIKE EXAMPLES and not vendor-neutral architectural requirements.
- The architectural invariant is that the selected relational engine must support equivalent privilege separation, append-only enforcement, indexing, and required data types.

STREAM HASH CHAINING:
- Stream-partitioned hash chaining remains OPTIONAL FUTURE HARDENING.
- It may be activated only through a new formal security or compliance decision if regulatory mandates, external audit requirements, carbon-credit certification, or a privileged-infrastructure threat model justify it.
- It must not be silently implemented without explicit governance.

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
- **Defense-in-Depth & Application-Boundary Integrity:** Technical assurance that past audit logs cannot be modified or deleted within the application and standard database user trust boundary.
- **Query Performance & Scalability:** Efficient pagination and indexing over hundreds of thousands of audit records without degrading operational database performance.
- **Cost-Proportional Simplicity:** Avoid premature, overly complex cryptographic chaining or distributed ledger schemes that add write latency and operational overhead without clear business justification.

## Threat Model & Integrity Trust Boundary
To evaluate integrity mechanisms honestly, the threat model defines the following boundaries:
1. **Threat Actor 1 — External Attacker / Compromised Application Account / Malicious Product Actor (Staff, Manager, Platform Admin):**
   - *Trust Boundary:* Bounded at the application and standard API layer.
   - *Defense:* Database user privilege separation (`REVOKE UPDATE, DELETE ON audit_events FROM app_user`) guarantees that no application bug, compromised API token, or SQL injection through the app user can modify or delete audit rows.
2. **Threat Actor 2 — Compromised Database Administrator (DBA) / Root Infrastructure Attacker:**
   - *Trust Boundary:* Bounded at the physical/cloud database root.
   - *Honest Protection Assessment:* A simple row hash chain stored within the database **does NOT prove non-repudiation against a root DBA**, because an attacker with full database mutation privileges can alter historical records and recompute the entire hash chain. Full protection against a rogue DBA requires an **external trust anchor** (e.g., periodic cryptographic hash checkpoints pushed to an immutable external log or WORM storage).
   - *Architecture Decision:* Unless the organization mandates external trust anchoring or formal compliance audits, cryptographic hash chaining is NOT required for MVP. Database privilege separation provides robust, cost-effective defense against Threat Actor 1.

## Decision Question
What technical architecture, persistence strategy, and integrity mechanisms should be selected for the NOVYX Audit Trail to enforce append-only immutability, support concurrent writes, and provide fast administrative querying?

## Options Considered

### Option A: Standard Relational Table with Application-Level Immutability Only
- **Description:** Store audit events in a standard relational table. Only `INSERT` and `SELECT` queries are exposed in application code; no `UPDATE` or `DELETE` endpoints exist.
- **Advantages:** Simplest implementation; standard SQL queries, indexes, and migrations.
- **Disadvantages:**
  - Weak security boundary: Any compromised database user, application bug, or SQL injection vulnerability can execute `DELETE FROM audit_events` or `UPDATE audit_events`.
  - Violates defense-in-depth principles.
- **Risks:** Fails basic forensic integrity standards if application database credentials are leaked.
- **Migration Impact:** Low.
- **Operational Impact:** Low.

### Option B: Database Privilege Separation + Append-Only Table + Indexes (Without Hash Chaining) [RECOMMENDED FOR MVP]
- **Description:**
  1. **Database-Level Privilege Separation (Primary Defense):**
     - Leverages the accepted backend relational persistence topology (`ADR 0013`).
     - The application connection uses a database user with permissions strictly restricted to `INSERT, SELECT` on `audit_events`. `UPDATE`, `DELETE`, `TRUNCATE`, and `DROP` are explicitly `REVOKED` at the database engine level (`REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM app_user;`).
  2. **Direct Table Indexing:**
     - Composite indexes on `(actor_id, timestamp)`, `(resource_type, resource_id)`, and `(action_type, timestamp)` guarantee fast query performance for Admin Web (`CAP-ADM-05`, `GV-08`, `GV-09`).
  3. **Absence of Hash Chaining at MVP:**
     - Zero write serialization bottleneck; zero extra hash calculation overhead on high-frequency operational mutations.
- **Advantages:**
  - **Robust Defense-in-Depth:** Application-level compromises and SQL injection cannot alter or delete past audit records.
  - **Zero Concurrency Overhead:** Unconstrained concurrent inserts across independent workers.
  - **Zero Exotic Dependencies:** Implemented natively in any standard relational database engine.
  - **Fast Multi-Criteria Queries:** Standard B-tree indexes power administrative filtering on Admin Web.
- **Disadvantages:** Does not protect against a root DBA (which hash chaining alone cannot protect against either without external anchoring).
- **Risks:** Low; pragmatic, scalable, and completely satisfies frozen business drivers.
- **Migration Impact:** Standard relational table schema and database user grant scripts.
- **Operational Impact:** Low; standard relational maintenance.

### Option C: Option B + Stream-Partitioned Hash Chaining [OPTIONAL FUTURE HARDENING]
- **Description:** Add cryptographic row hashing (`hash = SHA256(prev_stream_hash + event_data)`) partitioned by resource stream.
- **Evaluation:** Provides tamper-detection against internal out-of-band partial tampering by non-superusers. However, it adds algorithmic complexity and stream tracking. Reclassified as an **OPTIONAL FUTURE HARDENING** capability, to be implemented only if formal regulatory compliance requires it.

### Option D: Distributed Ledger / External Trust Anchoring (Blockchain / WORM Storage)
- **Description:** Write audit events or periodic Merkle roots to an external immutable ledger or cloud WORM storage.
- **Evaluation:** The only mathematical defense against a compromised root DBA, but disproportionately expensive and complex for urban forestry management. Deferred to future enterprise compliance phases if needed.

## Proposed Decision (Revised Candidate Pending Final Owner Review)
**Adopt Option B: Database-Level Privilege Separation + Append-Only Table + Indexes (Without Hash Chaining for MVP).**
*Recommendation Confidence: HIGH (revised per Owner Decision Batch 1 to establish pragmatic MVP baseline; hash chaining deferred to optional future hardening).*

1. **Database Privilege Controls (Architecture Invariant):**
   - For relational databases (per accepted `ADR 0013`), configure application user privileges (illustrative / PostgreSQL-like example):
     ```sql
     -- Illustrative / PostgreSQL-like example: application user cannot UPDATE or DELETE audit records
     GRANT SELECT, INSERT ON audit_events TO novyx_app_user;
     REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM novyx_app_user;
     ```
   - Exact SQL grant/revoke syntax remains engine-specific. The architectural invariant is that the selected engine must support equivalent privilege separation and append-only enforcement.
2. **Schema Definition (Illustrative / PostgreSQL-Like Relational Schema Example):**
   - Fields: `id UUID PRIMARY KEY`, `sequence_number BIGSERIAL`, `timestamp TIMESTAMPTZ`, `actor_id VARCHAR(64)`, `actor_role VARCHAR(32)`, `action_type VARCHAR(64)`, `resource_type VARCHAR(64)`, `resource_id VARCHAR(64)`, `outcome VARCHAR(16)`, `payload_summary JSONB`.
   - Technical metadata fields: `client_ip VARCHAR(45)`, `user_agent TEXT`, `correlation_id VARCHAR(64)`.
3. **Stream Hash-Chaining Reclassified as Optional Future Hardening:**
   - Cryptographic hash chaining is NOT implemented by default in MVP.
   - Trigger conditions for future activation:
     - Specific regulatory or banking compliance mandate.
     - Formal carbon-credit verification standard requiring cryptographic proof.
     - Defined privileged-DBA threat model requiring external trust anchoring.

## Rationale
Option B satisfies 100% of the frozen business baseline requirements (`CAP-ADM-05`, `DR-HARD-06`, `DR-POL-04`) and enforces true defense-in-depth against compromised application accounts via database privilege separation. Removing mandatory hash chaining from MVP avoids premature complexity and write serialization risks.

## Consequences
- **Positive:** Complete append-only immutability against application accounts; fast multi-criteria querying on Admin Web; zero write lock overhead; pragmatic maintainability.
- **Negative:** Database deployment scripts must configure distinct database roles and permissions.
- **Neutral:** Cold storage archiving policies (e.g., archiving events older than 1 year) can be established during future operations.

## Security Impact
- Append-only integrity of operational and governance actions within the application and standard database user trust boundary.
- Database engine blocks any application-level attempt to modify or delete audit rows.

## Offline / Reliability Impact
- Emitted strictly on the server upon verified API command execution. Mobile clients capture local timestamps in payload metadata without direct access to central audit tables.

## Contract Impact
- Add to `@novyx/contracts`:
  - `AuditEventDto`: Standard structure for audit log responses.
  - `ListAuditLogsQuery`: Filter parameters (`actorId`, `role`, `actionType`, `resourceType`, `from`, `to`, `cursor`, `limit`).

## Open Questions
1. Is external cryptographic anchoring (e.g., daily external Merkle root publication) mandated by any upcoming compliance standard? (To be evaluated during compliance review).

## Owner Decision Record
- **Owner Decision:** APPROVED — REVISED OPTION B
- **Accepted Decision:** Database privilege separation + append-only table + indexed admin queries without mandatory hash chaining in MVP.
- **Historical Note:** Batch 1 requested revision to remove mandatory hash chaining from MVP; Batch 2 confirmed final approval of the revised Option B.
