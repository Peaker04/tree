# NOVYX Mobile UI Authority and Harness Convergence Design

**Date:** 2026-10-15  
**Status:** Approved direction; awaiting written-spec review  
**Scope:** Wave 1 of the approved full UI convergence

## 1. Purpose

Establish one enforceable mobile UI authority before further visual redesign. This wave resolves contradictory design documents, approves screen-level contracts, strengthens mandatory skill and FR/NFR routing, and removes tests that lock obsolete visual implementation details.

This wave does not redesign product screens. It creates the stable authority and regression boundaries that later screen-family waves must follow.

## 2. Approved direction

NOVYX GreenOps uses the **Living Botanical Operational** direction:

- Vietnamese-first field operations;
- compact Android first with physical iPhone acceptance;
- trust-first, evidence-led and interruption-safe;
- warm neutral canvas with selective semantic tonal regions;
- Emerald as the single contextual primary-action role;
- deep forest reserved for trusted orientation and limited authority surfaces;
- reduced card, badge and pill repetition;
- flat content surfaces, hairline separators and restrained motion;
- system font with weights `400`, `500`, and `600`;
- body text `14–16px`, supporting text and metadata at least `13px` except compact bottom-navigation labels;
- primary actions are `16px` rounded rectangles, not full ovals by default.

Active design dials:

| Dial | Value |
|---|---:|
| Design variance | 4/10 |
| Motion intensity | 2/10 |
| Visual density | 6/10 |

## 3. Authority model

After this wave, mobile UI authority is applied in this order:

1. Functional, domain, authorization, security and data-integrity contracts.
2. `docs/FUNCTIONAL_NON_FUNCTIONAL_REQUIREMENTS_RULES.md` as the mandatory contextual reasoning and review harness.
3. `docs/MOBILE_UI_RULES.md` for workflow, navigation, native-device, accessibility and field-use invariants.
4. Root `DESIGN.md` for the approved Living Botanical Operational visual system, spatial-composition defaults, tokens and component grammar.
5. `.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md` for approved screen-level jobs, information order, actions, states and acceptance evidence.
6. `docs/NOVYX_MOBILE_DESIGN_SYSTEM.md` as the implementation reference subordinate to items 1–5.
7. Historical plans, `.design/`, `.stitch/`, screenshots and generated specimens as non-authoritative evidence only.

When active sources conflict on an invariant, implementation stops until the authority is reconciled. Contextual defaults may be locally adapted only with a recorded rationale and acceptance evidence.

## 4. Root `DESIGN.md` convergence

Root `DESIGN.md` remains the single visual authority. It is updated in place rather than replaced by `DESIGN_v2.md` or a parallel design system.

### 4.1 Preserve

- domain-driven UI and workflow integrity;
- one dominant primary action per state;
- compact field-use constraints;
- safe areas, long Vietnamese copy and accessibility;
- 4px spacing rhythm;
- semantic status roles;
- flat-before-elevated hierarchy;
- token ownership in `packages/ui`;
- loading, empty, error, offline, retry and interrupted-flow requirements;
- locked five-action bottom navigation.

### 4.2 Replace or correct

- full-pill primary buttons become `16px` rounded rectangles;
- body `12–13px` becomes `14–16px` for readable product copy;
- metadata `10px` becomes at least `13px`, except bottom-navigation labels at `11–12px`;
- buttons, chips, badges and avatars no longer share one universal pill grammar;
- identical card radius and bordered-container repetition are prohibited;
- large green/forest surfaces are limited to real authority or primary-action roles;
- semantic tonal regions—neutral, information, warning, verified and critical—are explicitly separated from brand decoration;
- grouped metrics are an information pattern, not a required `Card` or named style;
- component and style identifiers are never design contracts.

### 4.3 Color roles

- Canvas: warm neutral `snowWhite`/approved replacement.
- Default content: neutral card surface.
- Rest/grouping region: warm neutral stone.
- Primary action: Emerald role.
- Authority: deep forest, used sparingly.
- Information: Brume/sky semantic family.
- Waiting/attention: Cornsilk/amber semantic family.
- Verified: subtle success surface.
- Critical: rose semantic family.
- Accent/progress punctuation: Limonade/Verveine, never full-screen.

Each screen normally has one primary action color, at most one dominant tonal region, and semantic colors only for real state meaning.

## 5. Evidence and archive policy

The following directories remain design evidence but cannot override root authority:

- `.design/`;
- `.stitch/`;
- `.design/redesign/`;
- historical `.planning/quick/**/UI-SPEC.md` documents;
- generated UI-kit specimens and screenshots.

Every top-level evidence document must state that approved decisions are reconciled into root `DESIGN.md` before implementation. New implementation plans may cite these artifacts for rationale but must cite root `DESIGN.md` for active rules.

No active screen imports code or tokens from `.design/` or `.stitch/`.

## 6. Screen-contract approval

`.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md` changes from proposed to approved after a consistency review against domain, FR/NFR, mobile rules and the converged `DESIGN.md`.

The approved contract owns, per screen:

- user and job-to-be-done;
- entry and exit conditions;
- orientation → decision → evidence → metadata information order;
- one primary action for each state;
- secondary and destructive actions;
- loading, empty, error, offline/cache, retry, submitting and success states when relevant;
- Back, keyboard, safe-area and accessibility behavior;
- production data scale and virtualization boundary;
- physical-device acceptance evidence.

The contract does not define domain lifecycle transitions or transport payloads; those remain owned by domain and API contracts.

## 7. Mandatory UI skill routing

`AGENTS.md` and `.agents/skills/mobile-ui-ux/SKILL.md` must route mobile UI work through the following sequence:

1. `mobile-ui-ux` as the project entry point.
2. `docs/FUNCTIONAL_NON_FUNCTIONAL_REQUIREMENTS_RULES.md` and relevant business/domain owner documents.
3. `impeccable`:
   - `shape` for materially changed interactions or screen composition;
   - `critique` for holistic design review;
   - native `audit` for accessibility, performance, platform and adaptivity;
   - focused commands such as `layout`, `colorize`, `clarify`, `harden` only after authority and requirements are resolved.
4. `ui-ux-pro-max --stack react-native` for external pattern research when materially needed.
5. Taste Skill only as an anti-slop visual filter; its landing-page/web architecture recommendations do not apply to React Native product flows.
6. `karpathy-guidelines` for implementation discipline.
7. `test-audit` whenever UI tests are created, changed or reviewed.
8. `diagnosing-bugs`/systematic debugging for broken behavior.
9. TDD for behavioral regressions and bug fixes.
10. Verification and physical-device evidence before completion claims.

### 7.1 Research acceptance record

A materially changed UI plan records:

- research/skill executed;
- relevant recommendation;
- accepted or rejected decision;
- project authority that resolves the decision;
- affected screen/component;
- required evidence.

A bad research match must be explicitly rejected rather than silently followed. The existing UI-UX Pro Max App Store landing result is the canonical example of a rejected mismatch.

## 8. Mandatory FR/NFR execution record

Every non-trivial mobile UI slice records the following before implementation:

- business intent and authoritative rules;
- user/job and entry/exit conditions;
- information order;
- one primary action for each state;
- production data scale and virtualization boundary;
- control semantics;
- user-facing Vietnamese vocabulary source;
- loading, empty, error, offline, retry, submitting and success states as applicable;
- destructive-action and data-loss safeguards;
- authorization and trust-boundary decisions;
- accessibility and responsive constraints;
- physical-device acceptance matrix;
- explicit exclusions for non-applicable FR/NFR criteria.

The required reasoning chain is:

```text
Problem
→ User Goal
→ Business Context
→ Design Principle
→ Spatial Composition
→ Candidate Pattern
→ Existing Design System
→ Component / Token
→ Implementation
```

A template or checklist is acceptable; speculative code or architecture created merely to satisfy the checklist is prohibited.

## 9. UI test-contract migration

The UI test suite must protect observable behavior, independent contracts and credible regressions. It must not preserve implementation names or obsolete visual composition.

### 9.1 Delete or replace

Tests are removed or rewritten when they assert only:

- style names such as `heroCard`, `metricsBar`, `workHeroCard` or `nextAction`;
- component/import names when another implementation can satisfy the same behavior;
- exact JSX fragments unrelated to an external contract;
- absence/presence of `<Card>` as a proxy for hierarchy;
- exact copy that is not an approved product term or behavior;
- source structure, comments or private helper call shape.

### 9.2 Retain

Source inspection remains valid when it independently protects:

- one camera owner;
- no direct device-permission requests outside the shared owner;
- no screen-level `fetch` bypassing the service boundary;
- no raw secrets or forbidden environment variables;
- use of virtualized lists at a real growing-collection boundary;
- architecture ownership that cannot be cheaply tested at runtime.

### 9.3 Preferred owner boundaries

UI tests should verify:

- action invokes the correct callback or route;
- primary action is absent or disabled when prerequisites fail;
- destructive actions require user-owned rationale where the contract requires it;
- loading/error/retry and interrupted-flow behavior;
- accessibility role, label and state;
- Back preserves owned input/evidence;
- selection semantics and replacement behavior;
- virtualized production-scale collections;
- domain-derived state and canonical service payloads;
- screen contract state matrices.

No production export, wrapper, flag or seam may exist only to make these tests possible.

## 10. Mechanical governance gates

The smallest durable checks should detect:

- active UI plans that omit FR/NFR context and evidence sections;
- screen contracts that remain unapproved while implementation claims them as authority;
- new references treating `.design/`, `.stitch/` or historical UI-SPECs as active authority;
- forbidden UI-test source assertions for known implementation-only identifiers;
- new `700/800/900` weights in touched product UI;
- growing catalog selectors implemented with unvirtualized mapped `ScrollView` lists;
- screen-level foundational color literals outside documented map/camera/platform exceptions;
- completion claims without the required device-evidence status.

Gates must be narrow and explain failures. They may not enforce one universal screen layout or visual component.

## 11. Explicit exclusions

Wave 1 does not:

- redesign Manager Dashboard, Staff Home or any other screen;
- fix the blocked-task CTA or destructive-action behavior;
- change domain state transitions, API contracts, storage, permissions or navigation destinations;
- replace all tokens or primitives;
- introduce a UI framework or font dependency;
- create `ui-v2` or duplicate component families;
- run mass search-and-replace over colors, radii, spacing or typography;
- claim visual/device acceptance.

Functional UX repairs occur in the next approved wave after authority and tests no longer pull the source backward.

## 12. Verification

Wave 1 verification includes:

1. Cross-document authority search proving root `DESIGN.md` is the only active visual authority.
2. Test-audit report for every changed UI test: retain/fix/consolidate/delete classification and owner boundary.
3. Focused mobile test run for migrated tests.
4. `npm run format:check`.
5. `npm run lint`.
6. `npm run typecheck`.
7. `npm test`.
8. `npm run mobile:export:android` when shared tokens, native configuration or foundation code changes; documentation/test-only Wave 1 work does not require an export unless its diff crosses those boundaries.
9. `git diff --check` and final authority/reference searches.

No emulator, screenshot or physical-device PASS is claimed because Wave 1 does not change rendered product UI.

## 13. Success criteria

- Root `DESIGN.md` expresses one internally consistent Living Botanical Operational system.
- `.design/`, `.stitch/` and historical specs are explicitly evidence-only.
- Screen contracts are approved and consistent with higher authority.
- Project routing includes Impeccable and test-audit at the correct stages.
- UI-UX Pro Max and Taste responsibilities are bounded correctly.
- FR/NFR application is recorded per non-trivial UI slice.
- UI tests no longer require `heroCard`, `metricsBar`, `<Card>` or equivalent implementation details.
- Stronger observable or architecture-boundary tests remain green.
- No product screen or business behavior changes in this wave.

## 14. Subsequent waves

After Wave 1 passes:

1. Wave 2 — Manager Dashboard functional UX and visual convergence.
2. Wave 3 — Staff Home functional UX and visual convergence.
3. Wave 4 — Manager Create, Review and Trees.
4. Wave 5 — Staff proof workflow presentation convergence.
5. Wave 6 — Auth, Account and Notifications.
6. Wave 7 — cross-role physical-device acceptance and residual legacy deletion.
