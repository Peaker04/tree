# Multi-Staff Operational Matrix & Dual-Platform Verification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute and verify complete multi-role operational lifecycle (Dispatch -> Field Execution -> Cloudflare R2 Evidence -> Review -> Rework -> Approval) across 4 Staff, 1 Supervisor, and 1 Manager over an external Ngrok tunnel, with dual-platform verification on both iOS and physical Android.

**Architecture:** Automated multi-session operational harness querying Fastify REST API, Drizzle ORM on PostgreSQL 18, Cloudflare R2 object storage, and Ngrok TLS edge, with strict zero-mock data integrity.

**Tech Stack:** Fastify, Drizzle ORM, PostgreSQL 18, React Native (Expo SDK 57), Cloudflare R2 (S3 API), Ngrok v3, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-28-multi-staff-operational-matrix-design.md`

---

## Global Constraints

- **Zero-Mock Policy**: All user identities (`Ngọc Diễm`, `Duy Hưng`, `Duy Phong`) must be queried directly from PostgreSQL table `users` column `full_name`. No in-memory dictionary overrides.
- **Role Scoping**: Exactly 6 personas tested (4 Staff, 1 Supervisor, 1 Manager) to prevent Ngrok free-tier connection rate limiting.
- **Dual-Platform Parity**: Clean verification on both iOS (Apple HIG, ATS `exps://`, Hermes bytecode) and Android (Samsung Galaxy Note 20 Ultra).
- **Quality Gates**: `npm run test` (349+ passing), `npm run lint` (0 errors), `npm run typecheck` (0 errors), and clean iOS/Android bytecode exports.

## Review Focus

1. **Concurrent Session Token Collisions**: Each persona must receive an isolated JWT access token and refresh token that do not invalidate sibling sessions.
2. **OCC Task Version Desynchronization**: Concurrent state transitions (`startTask`, `submitEvidence`, `reviewTask`) must increment version deterministically (0 -> 1 -> 2 -> 3 -> 4 -> 5).
3. **Cloudflare R2 Binary Upload Integrity**: Presigned PUT URLs must successfully store JPEG binary data with HTTP 200 without CORS or authorization failures.
4. **Targeted Rework Routing**: Rework must correctly route back to the responsible field worker (Duy Hưng) with preserved prior evidence and required replacement target.
5. **Ngrok Tunnel Gateway Stability**: Tunnel must maintain stable HTTP/HTTPS request forwarding across consecutive multi-user batches.

---

### Task 1: Verify PostgreSQL Persona Persistence & Catalogs (Zero Mocks)

**Files:**
- Modify: `apps/api/src/infrastructure/persistence/scripts/seed-dev.ts`
- Modify: `apps/api/src/modules/work-management/application/use-cases/list-assignable-staff.use-case.ts`
- Verify: PostgreSQL `users` table via `psql` / node script

- [x] **Step 1: Verify PostgreSQL column `full_name` in `users` table**
  Confirm `full_name` column exists and contains `'Ngọc Diễm'`, `'Duy Hưng'`, `'Duy Phong'`, `'Nhân viên hiện trường'`.
- [x] **Step 2: Verify `ListAssignableStaffUseCase` queries database directly**
  Ensure `user.fullName` is returned in `displayName` property without any dictionary mocks.
- [x] **Step 3: Run dev seed to assert idempotency**
  Execute: `npm run db:seed:dev --workspace @novyx/api`
  Expected: All 6 accounts verified/updated with `fullName`.
- [x] **Step 4: Execute HTTP check against `GET /v1/operational/assignable-staff`**
  Assert HTTP 200 with all 4 staff members returning their authentic Vietnamese names.
- [x] **Step 5: Commit Task 1 changes**
  Commit message: `feat(api): persist authentic staff full names in PostgreSQL and operational catalogs`

---

### Task 2: Build Automated Multi-Staff Concurrency Test Suite (`scripts/multi-staff-operational-matrix.cjs`)

**Files:**
- Create: `scripts/multi-staff-operational-matrix.cjs`
- Reference: `scripts/deep-operational-e2e.cjs`

- [x] **Step 1: Write `scripts/multi-staff-operational-matrix.cjs`**
  Implement the 18 verification checks specified in `docs/superpowers/specs/2026-10-28-multi-staff-operational-matrix-design.md`:
  - Phase 1: Multi-role authentication (Manager, Supervisor, Ngọc Diễm, Duy Hưng, Duy Phong).
  - Phase 2: Manager dispatches 3 distinct tasks to 3 workers (Single Tree, Multi-Tree, Zone).
  - Phase 3: Parallel field execution (All 3 workers claim and start tasks simultaneously).
  - Phase 4: Parallel evidence submission with Cloudflare R2 presigned uploads.
  - Phase 5: Field issue reporting for Duy Phong -> Task becomes `BLOCKED`.
  - Phase 6: Manager review: Approve Ngọc Diễm (`COMPLETED`), Request rework for Duy Hưng (`REWORK_REQUIRED`).
  - Phase 7: Duy Hưng uploads replacement evidence and resubmits (`WAITING_REVIEW`).
  - Phase 8: Manager approves Duy Hưng (`COMPLETED`).
- [x] **Step 2: Run test suite against local Fastify API**
  Execute: `node scripts/multi-staff-operational-matrix.cjs`
  Expected: 18/18 checks PASS.
- [x] **Step 3: Commit Task 2 changes**
  Commit message: `test(mobile): build multi-staff operational concurrency matrix suite`

---

### Task 3: Launch Ngrok Tunnel & Validate Over Public Internet Edge

**Files:**
- Script: `scripts/field-tunnel.cjs`
- Config: `.env` (`NGROK_AUTHTOKEN`)

- [x] **Step 1: Verify Ngrok authentication and CLI readiness**
  Execute: `ngrok config check`
  Expected: Valid configuration file found.
- [x] **Step 2: Launch Ngrok background tunnel**
  Execute: `node scripts/field-tunnel.cjs` or start background ngrok process for port 3000.
  Expected: Public HTTPS URL acquired (`https://<id>.ngrok-free.dev`).
- [x] **Step 3: Test public tunnel connectivity**
  Execute: `curl -s -H "ngrok-skip-browser-warning: true" https://<id>.ngrok-free.dev/health`
  Expected: `{"status":"ok"}`.
- [x] **Step 4: Run operational matrix suite over Ngrok**
  Execute: `API_BASE_URL=https://<id>.ngrok-free.dev node scripts/multi-staff-operational-matrix.cjs`
  Expected: 18/18 checks PASS through the external Internet tunnel.
- [x] **Step 5: Commit Task 3 changes**
  Commit message: `chore: verify operational lifecycle over public ngrok internet tunnel`

---

### Task 4: Dual-Platform Physical Device & Bundle Verification

**Files:**
- Entire repository

- [x] **Step 1: Test physical Android device over Ngrok**
  Set `EXPO_PUBLIC_API_BASE_URL` to Ngrok URL and verify login as Ngọc Diễm on Samsung Galaxy Note 20 Ultra.
- [x] **Step 2: Run iOS Field Readiness Audit**
  Execute: `node scripts/verify-ios-field-readiness.cjs`
  Expected: 20/20 PASS.
- [x] **Step 3: Run full Vitest suite**
  Execute: `npm run test`
  Expected: 349+ tests pass.
- [x] **Step 4: Run typecheck and lint**
  Execute: `npm run typecheck` and `npm run lint`
  Expected: 0 errors.
- [x] **Step 5: Verify iOS and Android Hermes Bytecode Exports**
  Execute: `npm run mobile:export:ios` and `npm run mobile:export:android`
  Expected: Clean 2.7MB bytecode bundles exported without errors.
- [x] **Step 6: Update UI/UX Memory and durable state**
  Record operational audit results and device evidence in `.agents/memory/UI_UX_MEMORY.md`.
