# Phase 13 Wave 2: Backend Runtime & PostgreSQL Persistence Foundation

## 1. Input Baseline

- **Repository**: `https://github.com/Peaker04/tree`
- **Branch**: `base-setup`
- **Entry Head Commit**: `1f5e8dfe9d2cbf7e9e60f76f5e094e62e123bbce`
- **Entry Tree SHA**: `fbcf64e82b4c225d040a9a1f9ce8bbed4bc36371`
- **Working Tree State at Entry**: Clean
- **Pre-Change Baseline Gates**:
  - `node --version`: `v22.13.1` (PASS)
  - `npm --version`: `10.9.2` (PASS)
  - `npm run format:check`: PASS (exit code 0)
  - `npm run lint`: PASS (exit code 0)
  - `npm run typecheck`: PASS (exit code 0)
  - `npm test`: PASS (exit code 0, 94 passing tests)

---

## 2. Authorized Scope

Wave 2 establishes:
- `apps/api` workspace (`@novyx/api`) within existing npm workspaces (`apps/*`)
- Fastify 5.x HTTP runtime with `fastify-type-provider-zod` at the transport boundary
- Clean Architecture backend directory structure (`core/`, `infrastructure/`, `modules/`)
- Exactly 5 logical Bounded Context module boundaries (`work-management`, `tree-asset-registry`, `policy-template-governance`, `audit-compliance`, `iam`)
- PostgreSQL 18.x relational persistence foundation with Drizzle ORM and `drizzle-kit`
- Initial relational tables: `users`, `sessions`, `audit_events`
- Real Drizzle migrations (`0000_simple_epoch.sql`)
- Engine-level database privilege separation:
  - Migration / schema owner (`novyx_admin`) owns tables and runs migrations
  - Runtime application role (`app_runtime`) is granted `SELECT`, `INSERT` on `audit_events`, with `UPDATE`, `DELETE`, `TRUNCATE` revoked
- Executable HTTP health check (`GET /health`, `GET /ready`) using Fastify `inject()`
- Executable PostgreSQL integration and privilege test suite (`tests/api/db-integration.spec.ts`)
- Architecture boundary tests (`tests/architecture/backend-boundaries.spec.ts`)
- Local and CI configuration adhering to COST-01 ($0 / near-zero budget)

**Explicitly Unauthorized / Excluded:**
- Wave 3 IAM behavior (no Argon2, password hashing, credential issuance, login/logout endpoints, session rotation)
- Wave 4 operational task domain behavior (no task state machine, review workflow, rework logic)
- Changes to `apps/mobile` (hard deny)
- Removal or silent repointing of legacy mock server (`scripts/greenops-dev-api.cjs` / `npm run api:dev`)
- Object storage implementation (no S3, R2, MinIO SDKs)
- Changes to `@novyx/contracts` or frozen planning documents

---

## 3. Technology Versions Actually Installed

Installed into `@novyx/api` (`apps/api/package.json`):
- `fastify`: `^5.2.1` (resolved `5.2.1`)
- `fastify-type-provider-zod`: `^4.0.2` (resolved `4.0.2`)
- `drizzle-orm`: `^0.40.0` (resolved `0.40.0`)
- `pg`: `^8.13.3` (resolved `8.13.3`)
- `zod`: `^3.24.2` (resolved `3.24.2`)
- `drizzle-kit`: `^0.30.5` (resolved `0.30.5`, devDependency)
- `tsx`: `^4.19.3` (resolved `4.19.3`, devDependency)
- `@types/pg`: `^8.11.11` (resolved `8.11.11`, devDependency)
- `typescript`: `^5.8.2` (workspace inheritance / devDependency)

---

## 4. apps/api Workspace Structure

```
apps/api/
├── .env.example
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── src/
    ├── app.ts
    ├── index.ts
    ├── config/
    │   └── env.ts
    ├── core/
    │   └── errors.ts
    ├── infrastructure/
    │   ├── http/
    │   │   └── routes/
    │   │       └── health.ts
    │   └── persistence/
    │       ├── db.ts
    │       ├── migrate.ts
    │       ├── verify.ts
    │       ├── migrations/
    │       │   ├── 0000_simple_epoch.sql
    │       │   └── meta/
    │       ├── schema/
    │       │   ├── audit-events.ts
    │       │   ├── index.ts
    │       │   ├── sessions.ts
    │       │   └── users.ts
    │       └── scripts/
    │           └── bootstrap-roles.sql
    └── modules/
        ├── audit-compliance/
        │   └── index.ts
        ├── iam/
        │   └── index.ts
        ├── policy-template-governance/
        │   └── index.ts
        ├── tree-asset-registry/
        │   └── index.ts
        └── work-management/
            └── index.ts
```

---

## 5. Clean Architecture Dependency Direction

Adhering to ADR 0012 and ADR 0013:
- `core/` and `modules/` (domain/application layers) declare interfaces and pure domain abstractions.
- `infrastructure/` implements ports (HTTP adapters via Fastify, persistence via Drizzle/pg).
- Forbidden dependencies enforced by automated architecture tests (`tests/architecture/backend-boundaries.spec.ts`):
  - Domain/core does NOT import Fastify.
  - Domain/core does NOT import Drizzle ORM.
  - Domain/core does NOT import the PostgreSQL driver (`pg`).
  - `@novyx/api` does NOT import `packages/ui`.
  - `external/hermes-agent` is NOT imported into product runtime.

---

## 6. Five Module Boundaries

Exactly 5 logical Bounded Context modules are established under `apps/api/src/modules/`:
1. `work-management`: Owns tasks, work orders, proof submissions, and verification workflows.
2. `tree-asset-registry`: Owns tree asset lifecycle, botanical metadata, geospatial attributes, and health status.
3. `policy-template-governance`: Owns proof policy templates, validation rules, species policies, and operational constraints.
4. `audit-compliance`: Owns immutable audit event recording, query interfaces, and compliance verification.
5. `iam`: Owns identity accounts, role assignments, authentication credentials, and session state.

No additional business modules (e.g. notifications or offline bounded contexts) were created.

---

## 7. Fastify Runtime

- Application factory: `buildApp(options?: AppOptions): FastifyInstance` in `apps/api/src/app.ts`.
- Server entrypoint: `startServer()` in `apps/api/src/index.ts` (invoked only when executed directly, not at import time).
- Integrated `fastify-type-provider-zod` for request validation and serialization at HTTP boundaries.
- Contract authority: `@novyx/contracts` is consumed directly; no schemas are duplicated in `@novyx/api`.

---

## 8. PostgreSQL Configuration

Environment variables (defined in `apps/api/src/config/env.ts` and `apps/api/.env.example`):
- `DATABASE_MIGRATION_URL`: Privileged connection string for schema migrations and administrative role management (e.g., `postgresql://novyx_admin:novyx_test_password@localhost:5432/novyx_test`).
- `DATABASE_RUNTIME_URL`: Least-privilege connection string for normal application execution (e.g., `postgresql://app_runtime:app_runtime_password@localhost:5432/novyx_test`).
- `PORT`: HTTP server listening port (default: `3000`).
- `HOST`: HTTP server listening host (default: `0.0.0.0`).
- `NODE_ENV`: Application environment (`development`, `production`, `test`).

No credentials or secrets are committed into version control.

---

## 9. Drizzle Persistence

- Configuration file: `apps/api/drizzle.config.ts`.
- Schema location: `apps/api/src/infrastructure/persistence/schema/`.
- Migrations output: `apps/api/src/infrastructure/persistence/migrations/`.
- Dialect: `postgresql`.
- Drizzle schemas represent persistence mappings only and are not domain entities.

---

## 10. Initial Tables

1. **`users`**:
   - `id`: `varchar(36)` primary key (UUIDv4)
   - `email`: `varchar(255)` unique not null
   - `full_name`: `varchar(255)` not null
   - `role`: `varchar(32)` not null (constrained to `'staff' | 'manager' | 'admin'`)
   - `status`: `varchar(32)` not null default `'INVITED'` (constrained to `'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED'`)
   - `version`: `integer` not null default `1` (OCC concurrency control)
   - `created_at`: `timestamptz` not null
   - `updated_at`: `timestamptz` not null

2. **`sessions`**:
   - `id`: `varchar(36)` primary key (UUIDv4)
   - `user_id`: `varchar(36)` not null foreign key to `users(id)`
   - `refresh_token_hash`: `varchar(255)` not null unique
   - `expires_at`: `timestamptz` not null
   - `revoked_at`: `timestamptz` nullable
   - `created_at`: `timestamptz` not null
   - `updated_at`: `timestamptz` not null

3. **`audit_events`**:
   - `id`: `varchar(36)` primary key (UUIDv4)
   - `timestamp`: `timestamptz` not null
   - `actor_id`: `varchar(36)` not null
   - `actor_role`: `varchar(32)` not null
   - `action_type`: `varchar(64)` not null
   - `resource_type`: `varchar(64)` not null
   - `resource_id`: `varchar(36)` not null
   - `outcome`: `varchar(16)` not null (constrained to `'SUCCESS' | 'FAILURE'`)
   - `ip_address`: `varchar(45)` nullable
   - `user_agent`: `varchar(255)` nullable
   - `details`: `jsonb` nullable
   - `created_at`: `timestamptz` not null default `now()`
   - Composite indexes:
     - `idx_audit_actor_timestamp`: `(actor_id, timestamp)`
     - `idx_audit_resource`: `(resource_type, resource_id)`
     - `idx_audit_action_timestamp`: `(action_type, timestamp)`

---

## 11. Migration Inventory

- Migration directory: `apps/api/src/infrastructure/persistence/migrations/`
- File: `0000_simple_epoch.sql`
- Journal: `meta/_journal.json`
- Snapshot: `meta/0000_snapshot.json`
- Role Bootstrap script: `apps/api/src/infrastructure/persistence/scripts/bootstrap-roles.sql`

---

## 12. Migration Recovery Strategy

- **Scope**: Migration `0000_simple_epoch.sql` is strictly additive, creating baseline tables (`users`, `sessions`, `audit_events`) and query indexes.
- **Failure Handling**:
  - Drizzle migration runner executes DDL within transaction blocks where supported by PostgreSQL.
  - In case of network interruption or partial execution failure, the migration fails fast and rolls back the active transaction.
- **Retry Safety**:
  - Migration script uses standard Drizzle migrations journal (`__drizzle_migrations`) tracking applied hashes.
  - Rerunning `npm run db:migrate` resumes or detects already applied migrations idempotently.
- **Role Bootstrap**:
  - `bootstrap-roles.sql` uses `DO $$ ... IF NOT EXISTS ... END $$` block for `app_runtime` creation, ensuring idempotence across repeated executions.
- **Rollback vs. Restore**:
  - In development/testing environments, dropping and recreating the database via migration role is the supported clean-slate recovery path.
  - In persistent environments, forward-fixing via sequential additive migrations is required per ADR 0013. Destructive down-migrations are prohibited on production data.

---

## 13. Audit Privilege Separation

Implemented via PostgreSQL role separation (`bootstrap-roles.sql`):
- Migration/Admin role (`novyx_admin`) owns `audit_events` and database schema.
- Runtime application role (`app_runtime`):
  - `GRANT SELECT, INSERT ON audit_events TO app_runtime;`
  - `REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM app_runtime;`
- Invariant: `audit_events` is immutable from the application perspective. Even if application code attempted an update or delete, PostgreSQL engine-level permission checks raise SQL error code `42501` (`insufficient_privilege`).

---

## 14. Architecture Tests

Executed in `tests/architecture/backend-boundaries.spec.ts`:
1. `Domain/core/application layer does not import Fastify`: PASS
2. `Domain/core/application layer does not import Drizzle ORM`: PASS
3. `Domain/core/application layer does not import PostgreSQL driver (pg)`: PASS
4. `apps/api does not import packages/ui`: PASS
5. `Exactly 5 logical business bounded context modules exist in apps/api/src/modules`: PASS
6. `external/hermes-agent is not imported into apps/api`: PASS

---

## 15. HTTP Health Tests

Executed in `tests/api/health.spec.ts` via Fastify `inject()`:
1. `GET /health returns 200 with status ok`: PASS
2. `GET /ready returns 200 with database status ok when pool is healthy`: PASS
3. `GET /ready returns 503 without leaking credentials when pool query fails`: PASS

---

## 16. Local Database Runtime Evidence

- **Preflight Check**:
  - `psql`: Not installed on local Windows host
  - `docker`: Not installed on local Windows host
- **Status**: `LOCAL_DB_INTEGRATION = NOT_RUN`
- Per Section 35 of the instruction, since no local PostgreSQL runtime or Docker is available, local database integration is classified as `NOT_RUN` (not fake PASS).
- Execution is delegated to remote CI PostgreSQL 18 service.

---

## 17. CI PostgreSQL Runtime Evidence

GitHub Actions workflow `.github/workflows/ci.yml` is configured with:
- Service: `postgres:18-alpine`
- Health check: `pg_isready`
- Credentials: CI-only non-production test credentials
- Execution steps:
  1. `npm run build --workspace @novyx/api`
  2. `npm run db:migrate --workspace @novyx/api`
  3. `npm run db:verify --workspace @novyx/api`
  4. `npm test` (running `tests/api/db-integration.spec.ts` with `DATABASE_MIGRATION_URL` and `DATABASE_RUNTIME_URL`)

---

## 18. Files Changed

**New Files:**
- `apps/api/.env.example`
- `apps/api/drizzle.config.ts`
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/src/app.ts`
- `apps/api/src/index.ts`
- `apps/api/src/config/env.ts`
- `apps/api/src/core/errors.ts`
- `apps/api/src/infrastructure/http/routes/health.ts`
- `apps/api/src/infrastructure/persistence/db.ts`
- `apps/api/src/infrastructure/persistence/migrate.ts`
- `apps/api/src/infrastructure/persistence/verify.ts`
- `apps/api/src/infrastructure/persistence/schema/audit-events.ts`
- `apps/api/src/infrastructure/persistence/schema/index.ts`
- `apps/api/src/infrastructure/persistence/schema/sessions.ts`
- `apps/api/src/infrastructure/persistence/schema/users.ts`
- `apps/api/src/infrastructure/persistence/scripts/bootstrap-roles.sql`
- `apps/api/src/infrastructure/persistence/migrations/0000_simple_epoch.sql`
- `apps/api/src/infrastructure/persistence/migrations/meta/_journal.json`
- `apps/api/src/infrastructure/persistence/migrations/meta/0000_snapshot.json`
- `apps/api/src/modules/audit-compliance/index.ts`
- `apps/api/src/modules/iam/index.ts`
- `apps/api/src/modules/policy-template-governance/index.ts`
- `apps/api/src/modules/tree-asset-registry/index.ts`
- `apps/api/src/modules/work-management/index.ts`
- `tests/api/health.spec.ts`
- `tests/api/db-integration.spec.ts`
- `tests/architecture/backend-boundaries.spec.ts`
- `docs/PHASE13-WAVE2-BACKEND-FOUNDATION.md`

**Modified Files:**
- `.github/workflows/ci.yml` (added postgres 18 service, build, migrate, verify, test steps)
- `eslint.config.mjs` (added `**/dist/**` to ignored directories)
- `tsconfig.json` (added `apps/api` reference)
- `package-lock.json` (lockfile update for `@novyx/api` dependencies)

**Untouched / Preserved Files:**
- `apps/mobile/**`: Unchanged (0 diff)
- `scripts/greenops-dev-api.cjs`: Unchanged (0 diff)
- `external/**`: Unchanged (0 diff)
- `packages/contracts/**`: Unchanged (0 diff)
- `packages/ui/**`: Unchanged (0 diff)
- `packages/config/**`: Unchanged (0 diff)

---

## 19. Commands Executed

```powershell
node --version
npm --version
npm run format:check
npm run lint
npm run typecheck
npm test
npx drizzle-kit generate
npm run typecheck --workspace @novyx/api
npm run build --workspace @novyx/api
git diff --check
git diff --name-only 1f5e8dfe9d2cbf7e9e60f76f5e094e62e123bbce HEAD -- apps/mobile scripts/greenops-dev-api.cjs external packages/ui packages/config
```

---

## 20. Exit Codes

- `node --version`: `0`
- `npm --version`: `0`
- `npm run format:check`: `0`
- `npm run lint`: `0`
- `npm run typecheck`: `0`
- `npm test`: `0` (104 passed, 2 skipped)
- `npm run typecheck --workspace @novyx/api`: `0`
- `npm run build --workspace @novyx/api`: `0`
- `git diff --check`: `0`
- Protected path diff: `0` (empty)

---

## 21. Negative Assertions

- `P13W2-N01` (Wave 3 IAM behavior was implemented): **FALSE**
- `P13W2-N02` (Wave 4 task domain behavior was implemented): **FALSE**
- `P13W2-N03` (apps/mobile was modified): **FALSE**
- `P13W2-N04` (existing mock api:dev was removed or silently repointed): **FALSE**
- `P13W2-N05` (Domain imports Fastify): **FALSE**
- `P13W2-N06` (Domain imports Drizzle): **FALSE**
- `P13W2-N07` (Domain imports PostgreSQL driver): **FALSE**
- `P13W2-N08` (apps/api imports packages/ui): **FALSE**
- `P13W2-N09` (a sixth business bounded context was introduced): **FALSE**
- `P13W2-N10` (audit_events is owned by the runtime application role): **FALSE**
- `P13W2-N11` (runtime DB role can UPDATE audit_events): **FALSE**
- `P13W2-N12` (runtime DB role can DELETE audit_events): **FALSE**
- `P13W2-N13` (runtime DB role can TRUNCATE audit_events): **FALSE**
- `P13W2-N14` (hash chaining was introduced): **FALSE**
- `P13W2-N15` (paid cloud infrastructure is required): **FALSE**
- `P13W2-N16` (production credentials were committed): **FALSE**
- `P13W2-N17` (Android or iOS build is required): **FALSE**
- `P13W2-N18` (mobile was cut over to apps/api): **FALSE**
- `P13W2-N19` (object storage implementation was started): **FALSE**
- `P13W2-N20` (Wave 3 was automatically started): **FALSE**

---

## 22. Exit Gates

- All local non-DB gates: **PASS**
  - `npm run format:check`: PASS
  - `npm run lint`: PASS
  - `npm run typecheck`: PASS
  - `npm test`: PASS
  - `npm run typecheck --workspace @novyx/api`: PASS
  - `npm run build --workspace @novyx/api`: PASS
  - `git diff --check`: PASS
- Local database integration: **NOT_RUN** (no local PostgreSQL/Docker environment)
- Remote CI integration: **PENDING CI EXECUTION**

---

## 23. Remote CI Status

Pending commit and push of Wave 2 implementation to `origin/base-setup`.
Remote CI will execute all quality checks and database integration tests against PostgreSQL 18 Alpine service.

---

## 24. Final Status

- **Wave 2 Implementation**: Complete, verified against all local non-DB gates.
- **Wave 3 Status**: LOCKED.
