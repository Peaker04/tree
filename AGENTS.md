# Agent Instructions

This repository is an Expo SDK 57 React Native mobile app for NOVYX GreenOps. This file is the workspace harness loaded by PI CLI.

## Startup & Context

Before editing:

1. Read this `AGENTS.md` file completely.
2. Read `.agents/memory/UI_UX_MEMORY.md`. This is the mandatory mobile UI execution harness and known-failure register, not optional background context.
3. Check `git status --short --branch`; preserve inherited changes.
4. Read `docs/FUNCTIONAL_NON_FUNCTIONAL_REQUIREMENTS_RULES.md` as the cross-cutting reasoning and review harness, then read the relevant owner document under `docs/`.
5. For mobile UI/UX work, read `docs/MOBILE_UI_RULES.md`, root `DESIGN.md`, `docs/NOVYX_MOBILE_DESIGN_SYSTEM.md`, and `.agents/skills/mobile-ui-ux/SKILL.md`. Read `.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md` when present; historical UI-SPEC files are evidence only.
6. Treat UI guidance by strength: domain/security/data-integrity/accessibility rules are invariants; visual, spatial-composition and interaction rules are contextual defaults that may be locally adapted with rationale and verification.
7. Do not persist user-provided screenshot names, Downloads paths, or temporary attachment paths in durable docs; record semantic findings/outcomes unless an artifact is intentionally copied into the repository.
8. Inspect the affected screen, shared primitives, tokens, callers, state owners, content structure and responsive spatial behavior before choosing a solution.
9. Verify the exact Expo SDK 57 documentation before changing Expo or native APIs.
10. For every mobile screen change, complete only the relevant execution-gate items in `.agents/memory/UI_UX_MEMORY.md` before editing. A screen implementation may not start from personal design preference or code convenience.
11. When physical-device evidence reveals a reproducible reusable failure, update the known-failure register and add the smallest durable regression check. Keep one-off and context-specific findings local.

Do not ask the user to repeat project context that is already available in these files.

## PI CLI Skill Routing

PI discovers project skills under `.agents/skills/`.

- Always start mobile interface work with `mobile-ui-ux`.
- Use `ui-ux-pro-max` only when visual direction, interaction patterns, color, typography, layout, accessibility, or React Native-specific recommendations need exploration. Run its bundled script from the repository root and pass `--stack react-native`.
- Use the existing Taste Skill as a quality filter for visual work, not as a web component library.
- Use `karpathy-guidelines` for every implementation or refactor.
- Add `diagnosing-bugs` for broken, failing, or slow behavior.
- Add `tdd` for regressions or explicitly test-first work.

Do not install shadcn, Radix, Tailwind, or web-only UI packages in `apps/mobile`.

## Functional & Non-Functional Requirements Harness

`docs/FUNCTIONAL_NON_FUNCTIONAL_REQUIREMENTS_RULES.md` is mandatory for analysis, implementation and review. It is a context-sensitive reasoning checklist, not a source of new business requirements and not a fixed implementation recipe.

Before editing, apply only the relevant FR/NFR items and record the result in the task reasoning or durable plan when the work is non-trivial:

1. Business intent, authoritative rules, data, lifecycle, validation, authorization and failure paths.
2. Relevant quality attributes such as performance, resilience, accessibility, security, integrity, concurrency, compatibility and maintainability.
3. Existing project owner documents and implementation evidence that resolve each decision.
4. Explicit exclusions: rules that do not apply to this task must not generate speculative code or abstractions.
5. Acceptance and regression evidence proportional to impact.

When this general harness conflicts with a project-specific canonical contract, the project context wins. Explain the reason rather than applying the general rule mechanically. Never use this harness to invent a role, state, workflow, validation rule, architecture layer or dependency.

## Architecture Boundaries

- `apps/mobile` is the Expo React Native application. (Expo screens, navigation, device permissions, and mobile presentation.)
- `packages/contracts` is the only place for shared API envelopes, error codes, and cross-app DTO types.
- `packages/config` is the only place for environment validation helpers.
- `packages/ui` is the only place for shared design tokens.
- `apps/mobile/src/services/greenOpsService.ts`: mobile API boundary.
- `external/hermes-agent` is a pinned upstream submodule. Do not edit it directly for product work; update it through submodule workflow and document the new commit.

Reuse `apps/mobile/src/components/AppPrimitives.tsx` and existing tokens before adding a component, value, abstraction, or dependency.

## Mobile UI Harness Gate

Every mobile UI task must use `.agents/memory/UI_UX_MEMORY.md` as the single operational harness. The agent must:

1. State the user/job, information order, primary action, data scale, control semantics, user-facing vocabulary, required states, physical-device evidence, and relevant spatial-composition assumptions.
2. Use the reasoning chain `Problem → User Goal → Business Context → Design Principle → Spatial Composition → Design Pattern → Existing Design System → Component / Token → Implementation`.
3. Before adding cards, wrappers, fixed/minimum heights, large padding, decoration or global spacing changes, evaluate content-to-container ratio, intrinsic sizing, grouping, proximity, rhythm, alignment, anchors, density, nesting, section separation, priority and responsive behavior. Fix the lowest appropriate root cause.
4. Trace every visible string to approved Vietnamese product copy or authoritative localized data. Never expose enum names, seed/test descriptions, internal identifiers as labels, or raw API errors.
5. Prefer scalable selection controls for people, trees, and task types. A fixture with one row is never evidence that the production catalog is a one-row list.
6. Define selection behavior explicitly: radio, toggle, multi-select, clear, and change actions may not be visually conflated.
7. Use an appropriate date-and-time interaction. Do not require users to type machine-formatted timestamps when a bounded picker/preset flow is feasible.
8. Run the documented research and visual quality checks before implementation, not after screenshots expose problems.
9. Treat physical-device screenshots as a gate. Failed evidence returns the screen to implementation; it does not become a cosmetic follow-up.

## Mobile UI/UX Contract

- Design for compact Android, long Vietnamese text, outdoor/field use, one-handed interaction, interrupted workflows, and unreliable networks.
- Preserve the locked five-action bottom navigation and contextual permission model from `docs/MOBILE_UI_RULES.md`.
- Touch targets are at least 44×44; primary field actions should normally be 48–52 high.
- Cover loading, empty, error, retry, permission-denied, permission-blocked, and success states when relevant.
- Respect safe areas, font scaling, keyboard avoidance, accessible labels/state, and predictable Android Back behavior.
- Preserve captured proof and user input when navigating backward through active workflows.
- Do not communicate status by color alone.
- Avoid decorative card nesting, tiny text, generic template UI, gratuitous gradients, placeholder-only labels, and motion without meaning.

## Code and Performance Discipline

- Make the smallest root-cause change. No speculative abstractions or dependencies.
- Prefer React Native/Expo/JavaScript capabilities and existing repository helpers.
- Use `FlatList` or `SectionList` for growing collections with stable keys.
- Keep state local; derive values instead of synchronizing duplicate state with effects.
- Do not blanket-add `memo`, `useMemo`, or `useCallback`; optimize only a measured or directly evidenced cost.
- Clean up subscriptions and asynchronous work on unmount.
- Accessibility, validation, security, and data-loss prevention are never optional optimizations.
- Do not disable lint/type rules or reduce TypeScript strictness to make errors disappear.
- Keep changes scoped and rollback-friendly.
- Do not copy API types manually into app code.
- Do not commit secrets or `.env`.
- Do not change architecture decisions without an ADR.

## Verification

For mobile UI changes:

```powershell
npm run typecheck --workspace @novyx/mobile
npm run lint
```

For foundation, dependency, native configuration, or shared-token changes:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run mobile:export:android
```

Use `npm run mobile:smoke:check` when the changed flow is covered. Never claim emulator/device or visual PASS without real runtime evidence.

## Durable State

- `.planning/` owns plans and execution state.
- `.agents/memory/UI_UX_MEMORY.md` owns PI's compact, durable FE UI/UX working memory.
- Update memory only when a stable architecture rule, verified design decision, current UI pointer, or reusable lesson changes. Do not turn it into a chat log.
- Do not commit, push, reset, restore, install dependencies, or alter environment/secrets unless the user explicitly authorizes it.
