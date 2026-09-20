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
- **Audit Capabilities (`CAP-ADM-05`, `BR-ADM-05`):** High-performance read and multi-criteria filtering of audit events by actor, action type, resource ID, date range, and severity.
- **Strict Role Boundaries:** Staff and Manager cannot view system-wide audit logs; Platform Admin can view and filter audit logs, but has **zero mutation rights** over existing audit records.
- **Legal & Operational Accountability:** Every audit event must deterministically record: `eventId`, `timestamp` (ISO UTC), `actorId`, `actorRole`, `actionType`, `resourceType`, `resourceId`, `beforeState` (summary/diff), `afterState` (summary/diff), `clientIp`, `userAgent`, and `requestId`.

## NFR / Quality Drivers
- **Tamper Evidence & Non-Repudiation:** Technical assurance that past audit logs cannot be modified undetected, even in the event of compromised administrative credentials.
- **Query Performance & Scalability:** Efficient pagination and indexing over hundreds of thousands of audit records without degrading operational database performance.
- **Cost-Proportional Simplicity:** Avoid premature, overly complex distributed ledger or blockchain technologies that add massive latency and operational friction without clear business justification.

## Decision Question
What technical architecture and persistence strategy should be selected for the NOVYX Audit Trail to enforce append-only immutability, provide fast administrative querying, and guarantee tamper-evident integrity?

## Options Considered

### Option A: Standard Relational Table with Application-Level Immutability Only
- **Description:** Store audit events in a standard PostgreSQL/MySQL table `audit_events`. Only `INSERT` and `SELECT` queries are exposed in application code; no `UPDATE` or `DELETE` endpoints exist.
- **Advantages:** Simplest implementation; standard SQL queries, indexes, and migrations.
- **Disadvantages:**
  - Weak security boundary: Any database administrator, compromised DB user, or SQL injection vulnerability can execute `DELETE FROM audit_events` or `UPDATE audit_events`.
  - No cryptographic proof of non-tampering.
- **Risks:** Fails rigorous compliance or forensics standards if database credentials are leak-prone.
- **Migration Impact:** Low.
- **Operational Impact:** Low.

### Option B: Database-Level Privilege Separation + Append-Only Table with Row Hash-Chain [RECOMMENDED]
- **Description:**
  1. **Dual Database Roles / Permissions:**
     - The application connection uses a dedicated database user `app_audit_writer` with permissions restricted strictly to `INSERT, SELECT` on `audit_events`. `UPDATE`, `DELETE`, `TRUNCATE`, and `DROP` are explicitly `REVOKED` at the database engine level (`REVOKE UPDATE, DELETE ON audit_events FROM app_user;`).
  2. **Row-Level Cryptographic Hash Chaining:**
     - Each audit row contains:
       `hash = SHA256(prev_hash + event_id + timestamp + actor_id + action + resource_id + payload_json)`.
     - `prev_hash` links directly to the previous audit event's hash, forming an unbroken cryptographic chain.
     - A daily background job or read-time check verifies that the chain has not been tampered with.
  3. **Direct Table Indexing:**
     - Composite indexes on `(actor_id, timestamp)`, `(resource_type, resource_id)`, and `(action_type, timestamp)` guarantee sub-100ms query performance for Admin Web (`CAP-ADM-05`).
- **Advantages:**
  - **Defense in Depth:** Even if an attacker compromises the application layer or executes arbitrary application code, the database user cannot execute `UPDATE` or `DELETE`.
  - **Tamper Evidence:** Any unauthorized direct database modification breaks the SHA-256 hash-chain, immediately flagging the anomaly to platform auditors.
  - **Zero Exotic Infrastructure:** Requires no blockchain, no external SaaS services, and no specialized hardware; operates entirely on standard relational database engines (PostgreSQL).
  - **Fast Querying:** Full SQL filtering and cursor-based pagination for Admin Web.
- **Disadvantages:**
  - Generating hashes adds a fraction of a millisecond per write (negligible).
  - Chain verification requires occasional batch scanning.
- **Risks:** Low; well-established standard for tamper-evident logging.
- **Migration Impact:** Clean addition of schema and database role scripts.
- **Operational Impact:** Standard relational database maintenance; minimal overhead.

### Option C: Distributed Ledger / Blockchain (Hyperledger / Ethereum / AWS QLDB)
- **Description:** Write every audit event to a private blockchain or proprietary cloud ledger (such as AWS QLDB or Hyperledger Fabric).
- **Advantages:** Cryptographic immutability enforced by distributed consensus or cloud provider attestation.
- **Disadvantages:**
  - Extreme over-engineering for an urban green management platform.
  - High operational complexity, slow write latency (hundreds of milliseconds to seconds), and high cloud costs.
  - Complex query limitations (poor support for multi-criteria relational filtering needed by `CAP-ADM-05`).
- **Risks:** Vendor lock-in, latency bottlenecks, high operational burden.
- **Migration Impact:** Severe; requires external SDKs and consensus management.
- **Operational Impact:** High maintenance and hosting costs.

## Proposed Decision
**Adopt Option B: Database-Level Privilege Separation + Append-Only Table with Row Hash-Chain.**

1. **Storage Schema:**
   ```sql
   CREATE TABLE audit_events (
     id UUID PRIMARY KEY,
     sequence_number BIGSERIAL UNIQUE NOT NULL,
     timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     actor_id VARCHAR(64) NOT NULL,
     actor_role VARCHAR(32) NOT NULL,
     action_type VARCHAR(64) NOT NULL,
     resource_type VARCHAR(64) NOT NULL,
     resource_id VARCHAR(64) NOT NULL,
     payload_summary JSONB NOT NULL,
     client_ip VARCHAR(45),
     user_agent TEXT,
     correlation_id VARCHAR(64),
     prev_hash VARCHAR(64) NOT NULL,
     current_hash VARCHAR(64) NOT NULL
   );
   ```
2. **Database Engine Safeguard:**
   ```sql
   -- Application user can only insert and read
   GRANT SELECT, INSERT ON audit_events TO novyx_app_user;
   REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM novyx_app_user;
   ```
3. **Application Layer Service:**
   - An asynchronous, non-blocking `AuditService` captures domain events emitted by use cases, computes the sequential SHA-256 hash using the previous event's hash, and commits the record.
   - Admin Web consumes `GET /v1/audit/events` with query filters matching `CAP-ADM-05`.

## Rationale
Option B satisfies the absolute immutability mandate of the frozen business baseline while preserving standard relational query efficiency for Admin Web. It provides cryptographic tamper detection without the unnecessary operational friction and latency of a blockchain.

## Consequences
- **Positive:** Complete immutability, tamper evidence, rapid querying, zero exotic dependencies.
- **Negative:** Database provisioning scripts must configure specific user roles and permissions.
- **Neutral:** Audit log table will grow steadily; long-term cold storage archiving (e.g., partitioned tables older than 1 year exported to S3 Glacier) can be adopted in future maintenance phases.

## Security Impact
- Non-repudiation of operational and governance actions.
- Any attempt to tamper with audit logs breaks cryptographic integrity.

## Offline / Reliability Impact
- Audit events are emitted on the backend server upon receiving verified API commands. Mobile client does not directly write to the central audit log; mobile actions are recorded with client timestamps and ingested upon sync.

## Contract Impact
- Add to `@novyx/contracts`:
  - `AuditEventDto`: Standard structure for audit log responses.
  - `ListAuditLogsQuery`: Filter parameters (`actorId`, `role`, `actionType`, `resourceType`, `from`, `to`, `cursor`, `limit`).

## Migration / Compatibility
- Clean addition in Phase 11B/12 backend implementation.

## Rejected Alternatives
- **Option A (Plain Table with no DB constraints):** Rejected due to lack of defense-in-depth and lack of cryptographic tamper-evidence.
- **Option C (Blockchain / QLDB):** Rejected as disproportionate over-engineering with high latency and cost.

## Open Questions
- What is the recommended retention window for hot audit logs before archiving to cold storage? (Recommended: 365 days hot in PostgreSQL, indefinite cold archive).

## Owner Decision Required
- [ ] **APPROVE** Option B (Database-Level Privilege Separation + Row Hash-Chain).
- [ ] **REJECT** and mandate alternative option.
- [ ] **REQUEST_REVISION** with specific modifications.
