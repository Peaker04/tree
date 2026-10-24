# NOVYX Mobile UI Authority Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish one enforceable Living Botanical Operational UI authority, approve screen contracts, strengthen mandatory UI/FR-NFR routing, and remove tests that pull visual implementation back to obsolete source shapes.

**Architecture:** Root `DESIGN.md` remains the single active visual authority. `.design/`, `.stitch/`, historical UI specs and generated specimens become evidence-only; project instructions and one governance test enforce that boundary. Existing UI tests are classified with `test-audit`, then reduced to observable behavior, platform contracts and architecture boundaries rather than style names or JSX structure.

**Tech Stack:** Markdown governance contracts, Expo SDK 57, React Native 0.86, TypeScript, Vitest, npm workspaces, Prettier, ESLint

**Spec:** `docs/superpowers/specs/2026-10-15-novyx-mobile-ui-authority-convergence-design.md`

## Global Constraints

- Do not redesign or alter rendered product screens in this wave.
- Do not change domain state transitions, API contracts, storage, permissions, service boundaries or navigation destinations.
- Root `DESIGN.md` must remain the only active visual authority; do not create `DESIGN_v2.md` or `ui-v2`.
- `.design/`, `.stitch/`, screenshots and historical UI-SPECs remain evidence only.
- Preserve compact Android, Vietnamese, field-use, accessibility and data-loss invariants.
- Primary-action grammar becomes a `16px` rounded rectangle; metadata is at least `13px` outside compact bottom navigation.
- Taste remains an anti-slop filter, not a native UI framework or primary product-flow authority.
- UI-UX Pro Max results are research inputs that require an explicit accept/reject record.
- Use `test-audit` for every changed test. Do not add production exports, wrappers or seams only for tests.
- Preserve inherited working-tree changes. Do not reset, restore, commit, push, install dependencies or alter environment/secrets.
- No physical-device or visual PASS may be claimed because Wave 1 changes governance and tests, not rendered UI.

## Review Focus

- Root `DESIGN.md` must not retain contradictory full-pill, 10px metadata or 12px body rules after declaring Living Botanical Operational.
- Evidence documents must not be mistaken for implementation authority by future agents or plans.
- The approved screen contract must not invent domain transitions or transport rules.
- Test migration must retain unique workflow, security, platform and architecture guards while deleting implementation-coupled visual assertions.
- Governance tests must enforce boundaries without becoming another inventory of private identifiers that blocks future refactors.

---

### Task 1: Converge the active design authority

**Files:**
- Create: `tests/governance/mobile-ui-authority.spec.ts`
- Modify: `DESIGN.md`
- Modify: `docs/NOVYX_MOBILE_DESIGN_SYSTEM.md`
- Modify: `.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md`
- Modify: `.design/DESIGN.md`
- Modify: `.design/SCREEN_CONTRACTS.md`
- Modify: `.design/UI_KIT_SPEC.md`
- Modify: `.design/UX_RULES.md`
- Modify: `.stitch/DESIGN.md`

**Interfaces:**
- Consumes: domain/security authority, FR/NFR harness and `docs/MOBILE_UI_RULES.md`.
- Produces: one active Living Botanical Operational authority and explicitly non-authoritative evidence documents.

- [ ] **Step 1: Write the failing authority-boundary test**

Create `tests/governance/mobile-ui-authority.spec.ts` with one test named `keeps one approved mobile visual authority` that reads the named documents and asserts:

```ts
expect(design).toContain('Living Botanical Operational');
expect(design).toContain('Design variance');
expect(design).toContain('4/10');
expect(design).toContain('Primary action');
expect(design).toContain('16px');
expect(design).toContain('at least `13px`');
expect(design).not.toMatch(/Primary[^\n]*radius\.pill/i);
expect(design).not.toMatch(/Metadata[^\n]*\|\s*`10px`/i);
expect(design).not.toMatch(/Body[^\n]*\|\s*`12px`/i);
expect(screenContracts).toContain('Status: approved');
for (const evidence of evidenceDocs) {
  expect(evidence).toContain('non-authoritative evidence');
  expect(evidence).toContain('root `DESIGN.md`');
}
```

The test may assert stable authority phrases and prohibited contradictory rules. It must not assert section line numbers, style names, component names or a complete token inventory.

- [ ] **Step 2: Run the test and verify the authority is currently inconsistent**

Run:

```bash
npm test -- tests/governance/mobile-ui-authority.spec.ts
```

Expected: FAIL because root `DESIGN.md` lacks the approved direction/rules, screen contracts are proposed, and evidence documents do not all carry the required boundary notice.

- [ ] **Step 3: Rewrite root design authority sections in place**

Modify `DESIGN.md` sections 1–12 and the review checklist so they consistently state:

- identity: Living Botanical Operational;
- dials: variance `4/10`, motion `2/10`, density `6/10`;
- body `14–16px`, metadata/supporting text at least `13px`, compact nav `11–12px`;
- primary action uses `radius.action = 16px` or the documented semantic equivalent, not `radius.pill`;
- pills are reserved for badges/chips/avatars and the circular QR utility;
- surface hierarchy is whitespace → typography → divider → tonal region → contained surface;
- at most one dominant tonal region per screen state;
- Emerald is the contextual primary-action role; forest is limited authority/orientation;
- Brume/sky, Cornsilk/amber, subtle success and rose critical roles remain semantic rather than decorative;
- grouped metrics describe information composition, not a required `Card`, style name or layout;
- implementation identifiers are not design contracts.

Preserve domain, workflow, accessibility, navigation, token ownership and state-completeness invariants. Remove contradictory old tables/examples rather than leaving both versions with a precedence note. State explicitly that existing pill-action, sub-13px metadata and repetitive-surface source is migration debt for later screen/foundation waves; Wave 1 does not claim implementation conformance or visual PASS.

- [ ] **Step 4: Align the implementation reference without changing code**

Update `docs/NOVYX_MOBILE_DESIGN_SYSTEM.md` to match the converged root authority:

- primary-action geometry and color role;
- typography floors;
- shape grammar;
- tonal-region and contained-surface distinction;
- badge/row/metric contracts;
- explicit subordinate authority statement.

Do not change `packages/ui` or mobile source in this wave.

- [ ] **Step 5: Approve the screen contract after consistency review**

In `.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md`:

- set `Status: approved`;
- retain its subordinate authority order;
- update visual references to the converged typography, primary-action and surface grammar;
- verify every screen retains user/job, information order, action hierarchy, states, NFR and evidence;
- remove any visual rule that conflicts with root `DESIGN.md`;
- do not add domain transitions or request payload rules.

- [ ] **Step 6: Mark design artifacts as evidence-only**

Add a short boundary block near the top of every listed `.design/`/`.stitch/` Markdown file:

```md
> Status: non-authoritative evidence.
> Active mobile UI decisions live in root `DESIGN.md` after reconciliation.
> This artifact may inform rationale but cannot override domain contracts, FR/NFR, `docs/MOBILE_UI_RULES.md`, root `DESIGN.md`, or approved screen contracts.
```

Keep specimens and historical reasoning intact; do not rewrite them into duplicate active specifications.

- [ ] **Step 7: Run the authority test**

Run:

```bash
npm test -- tests/governance/mobile-ui-authority.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Run document formatting**

Run:

```bash
npx prettier --check DESIGN.md docs/NOVYX_MOBILE_DESIGN_SYSTEM.md .planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md .design .stitch tests/governance/mobile-ui-authority.spec.ts
```

Expected: all listed files pass. Use Prettier only on failing files; do not format unrelated repository content.

### Task 2: Make UI skill and FR/NFR routing enforceable

**Files:**
- Modify: `AGENTS.md`
- Modify: `.agents/skills/mobile-ui-ux/SKILL.md`
- Modify: `.agents/memory/UI_UX_MEMORY.md`
- Modify: `docs/MOBILE_UI_RULES.md`
- Modify: `tests/governance/mobile-ui-authority.spec.ts`

**Interfaces:**
- Consumes: Task 1's authority order and approved screen contract.
- Produces: one mandatory mobile UI workflow with explicit research decisions and execution evidence.

- [ ] **Step 1: Extend the governance test with routing assertions**

Add a test named `requires the mobile UI research and evidence harness` that checks stable routing contracts:

```ts
expect(agents).toContain('mobile-ui-ux');
expect(agents).toContain('impeccable');
expect(agents).toContain('test-audit');
expect(mobileSkill).toContain('FUNCTIONAL_NON_FUNCTIONAL_REQUIREMENTS_RULES.md');
expect(mobileSkill).toContain('Research acceptance record');
expect(mobileSkill).toContain('physical-device acceptance matrix');
expect(mobileRules).toContain('Impeccable');
expect(memory).toContain('accepted or rejected');
```

Do not assert exact bullet ordering or full prose.

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm test -- tests/governance/mobile-ui-authority.spec.ts
```

Expected: FAIL because Impeccable, test-audit and the research-decision record are not yet fully routed.

- [ ] **Step 3: Update project-level routing**

Update `AGENTS.md` so mobile UI work requires:

1. `mobile-ui-ux` entry point;
2. relevant FR/NFR and owner contracts;
3. Impeccable `shape`/`critique`/native `audit` at the appropriate stages;
4. UI-UX Pro Max as optional external research with explicit accept/reject;
5. Taste as anti-slop filter only;
6. `karpathy-guidelines` for implementation;
7. `test-audit` for UI test changes;
8. debugging/TDD for behavior changes;
9. physical-device evidence before visual completion.

State that skills do not override business, security, accessibility or data-integrity authority.

- [ ] **Step 4: Update the mobile skill workflow**

In `.agents/skills/mobile-ui-ux/SKILL.md`, add reusable templates for:

**Research acceptance record**

```md
- Source/skill:
- Recommendation:
- Decision: accepted | adapted | rejected
- Resolving authority:
- Affected surface:
- Required evidence:
```

**FR/NFR execution record**

```md
- Business intent and authoritative rule:
- User/job and entry/exit:
- Information order and primary action:
- Data scale and control semantics:
- Applicable states and failure recovery:
- Security/data-loss/accessibility invariants:
- Spatial-composition root cause:
- Physical-device acceptance matrix:
- Explicit exclusions:
```

Require the approved reasoning chain from the spec. Keep the templates concise; do not create a new planning framework.

- [ ] **Step 5: Synchronize memory and mobile rules**

Update `.agents/memory/UI_UX_MEMORY.md` and `docs/MOBILE_UI_RULES.md` with stable rules only:

- root `DESIGN.md` is the reconciled authority;
- `.design/.stitch` are evidence-only;
- research must record accepted/adapted/rejected;
- Impeccable owns native critique/audit/shape roles;
- Taste remains a filter;
- device evidence status is explicit.

Do not duplicate the full templates into every document; `mobile-ui-ux/SKILL.md` owns the operational form.

- [ ] **Step 6: Run routing and formatting checks**

Run:

```bash
npm test -- tests/governance/mobile-ui-authority.spec.ts
npx prettier --check AGENTS.md .agents/skills/mobile-ui-ux/SKILL.md .agents/memory/UI_UX_MEMORY.md docs/MOBILE_UI_RULES.md tests/governance/mobile-ui-authority.spec.ts
```

Expected: governance test and formatting pass.

### Task 3: Audit and migrate implementation-coupled UI tests

**Files:**
- Create: `docs/quality-gates/MOBILE_UI_TEST_AUDIT.md`
- Modify: `tests/mobile/ui-foundation.spec.ts`
- Modify: `tests/governance/mobile-ui-authority.spec.ts`
- Test owner references: `tests/mobile/task-deadline.spec.ts`, `tests/mobile/r2a-lifecycle.spec.ts`, `tests/mobile/offline-durable-foundation.spec.ts`, `tests/mobile/wave5b-rest-sync.spec.ts`

**Interfaces:**
- Consumes: Task 1's approved design contract and Task 2's `test-audit` requirement.
- Produces: a smaller test suite that protects observable UI/platform/architecture contracts without preserving visual source shape.

- [ ] **Step 1: Write the test-audit ledger before editing tests**

Create `docs/quality-gates/MOBILE_UI_TEST_AUDIT.md`. Classify every `it(...)` block in `tests/mobile/ui-foundation.spec.ts` as `R`, `F`, `C` or `D`, recording:

- exact test name and line range;
- actual contract it can detect;
- credible regression;
- strongest owner boundary;
- overlapping owner test if any;
- action and focused validation command.

Use these minimum rulings:

| Current test area | Mark | Required action |
|---|---|---|
| Semantic token triplets | R | Keep direct exported-token contract. |
| Touch sizes and weight vocabulary | R/F | Keep public token assertions; update approved geometry/type floors. |
| Single-line/multiline Field geometry | F | Retain the proven native variant contract with the smallest robust source guard; remove unrelated style inventory. |
| Create Task mega source test | C/F | Retain trust-boundary, validation lifecycle and catalog semantics; delete visual/import/private-shape assertions; defer behavior to the strongest existing owner tests where covered. |
| Icon-tile color implementation | D | Remove; visual token use is not an independent behavior contract. |
| Exact concise-copy strings | D/F | Keep only prohibited raw/internal vocabulary or stable product terminology; remove sentence-level implementation copy locks. |
| Manager `heroCard`/`metricsBar` | D | Delete all style/layout-name assertions. |
| Tree QR PNG export | R | Keep platform file-format/export contract. |
| Permission refresh on app resume | R | Keep architecture/platform contract. |
| Staff overview mega source test | C/F | Retain lifecycle, cache, camera ownership, storage-URI and Back invariants; delete component/style/copy-shape assertions. |
| Localized roles/avatar | F | Retain user-language and deterministic accessible fallback; remove alignment/icon implementation locks. |
| Manager Review/QR mega source test | C/F | Retain canonical decisions, evidence gate, reason reset and evidence-neutral lookup; delete tone/style/layout names. |
| BottomSheet visual anatomy | D/F | Retain close/back/accessibility behavior only if no stronger owner exists; delete radius/animation-variable names. |
| Date/tree sheet visual anatomy | C/F | Retain bounded selection/date semantics; delete ribbon/style/export-name inventory. |
| Web map fallback | R/F | Retain fallback availability and supported map engines; remove private identifier inventory. |
| Deadline source assertions | C/D | Consolidate into `tests/mobile/task-deadline.spec.ts`; remove duplicate source test. |

- [ ] **Step 2: Extend governance protection against known source-shape locks**

Add a test named `does not lock obsolete UI implementation identifiers` that reads `tests/mobile/ui-foundation.spec.ts` and asserts only the known forbidden regression pattern:

```ts
expect(uiFoundationTest).not.toMatch(/toContain\(['"]heroCard['"]\)/);
expect(uiFoundationTest).not.toMatch(/toContain\(['"]metricsBar['"]\)/);
expect(uiFoundationTest).not.toMatch(/not\.toContain\(['"]<Card['"]\)/);
```

This is a narrow governance boundary against the diagnosed failure mechanism, not a general ban on source inspection.

- [ ] **Step 3: Run the governance test and verify it fails**

Run:

```bash
npm test -- tests/governance/mobile-ui-authority.spec.ts
```

Expected: FAIL on the current `heroCard`, `metricsBar` and `<Card>` assertions.

- [ ] **Step 4: Migrate `ui-foundation.spec.ts` according to the ledger**

Edit one test block at a time:

- remove style names, component names, private helper shapes and incidental copy;
- keep public tokens and measurable accessibility/size contracts;
- keep architecture source checks only where they protect a real ownership boundary and can survive ordinary renames;
- consolidate duplicate deadline coverage into `task-deadline.spec.ts` without adding another case when that owner already proves the behavior;
- do not create new product exports or wrappers;
- prefer fewer, focused test names whose assertions match their promised behavior.

The resulting file should be materially smaller than the original and must no longer contain `heroCard`, `metricsBar`, `workHeroCard`, `decisionSelected_`, `ribbonTrack`, or `not.toContain('<Card')` assertions.

- [ ] **Step 5: Run focused migrated tests**

Run:

```bash
npm test -- tests/governance/mobile-ui-authority.spec.ts tests/mobile/ui-foundation.spec.ts tests/mobile/task-deadline.spec.ts tests/mobile/r2a-lifecycle.spec.ts
```

Expected: PASS. If deleting an assertion exposes an unowned important contract, add one smallest owner-boundary test before continuing; record the ruling in the audit ledger.

- [ ] **Step 6: Verify the test diff is net-negative and has no test-only production seams**

Run:

```bash
git diff --numstat -- tests/mobile/ui-foundation.spec.ts tests/governance/mobile-ui-authority.spec.ts docs/quality-gates/MOBILE_UI_TEST_AUDIT.md
rg -n "heroCard|metricsBar|workHeroCard|decisionSelected_|ribbonTrack|not\.toContain\(['\"]<Card" tests/mobile/ui-foundation.spec.ts || true
git diff -- apps/mobile packages
```

Expected:

- UI test/support code is net-negative after excluding the audit report and new governance owner;
- forbidden implementation locks print no matches;
- `git diff -- apps/mobile packages` contains no Wave 1 product-source edits beyond inherited pre-existing cleanup changes.

### Task 4: Final governance verification

**Files:**
- Verify only: all files changed in Tasks 1–3

**Interfaces:**
- Consumes: converged authority, mandatory routing and migrated tests.
- Produces: verified Wave 1 governance foundation for the next functional UX wave.

- [ ] **Step 1: Run focused authority and mobile tests**

Run:

```bash
npm test -- tests/governance/mobile-ui-authority.spec.ts tests/mobile/ui-foundation.spec.ts tests/mobile/task-deadline.spec.ts tests/mobile/r2a-lifecycle.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run full repository quality gates**

Run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
```

Expected: formatting, lint and all workspace typechecks pass; Vitest reports zero failures. Record intentional skips exactly.

- [ ] **Step 3: Run final authority/reference searches**

Run:

```bash
rg -n "Status: proposed for user approval|Normative after approval" .planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md
rg -n "Primary.*radius\.pill|Metadata.*10px|Body.*12px" DESIGN.md
rg -n "active authority|authoritative" .design .stitch --glob '*.md'
rg -n "heroCard|metricsBar|not\.toContain\(['\"]<Card" tests/mobile/ui-foundation.spec.ts
```

Expected:

- first, second and fourth commands print nothing;
- evidence documents may contain historical prose using “authority”, but each top-level file clearly states `non-authoritative evidence` and cannot be read as active authority.

- [ ] **Step 4: Inspect the final diff and verify exclusions**

Run:

```bash
git diff --check
git status --short --branch
git diff --stat
git diff -- DESIGN.md AGENTS.md .agents/skills/mobile-ui-ux/SKILL.md .agents/memory/UI_UX_MEMORY.md docs/MOBILE_UI_RULES.md docs/NOVYX_MOBILE_DESIGN_SYSTEM.md .planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md tests/governance/mobile-ui-authority.spec.ts tests/mobile/ui-foundation.spec.ts docs/quality-gates/MOBILE_UI_TEST_AUDIT.md
```

Expected:

- no whitespace errors;
- only approved Wave 1 governance/test files plus inherited cleanup changes appear;
- no product screen, domain, API, storage, permission or navigation implementation changed;
- no commit or push is performed.

- [ ] **Step 5: Record the handoff for Wave 2**

In the execution summary, state:

- root authority is converged;
- screen contracts are approved;
- obsolete UI test locks are removed;
- no rendered UI changed and no device PASS is claimed;
- Wave 2 starts with Manager Dashboard P0/P1 functional UX: no-op blocked CTA, overdue routing and user-owned destructive reasons.
