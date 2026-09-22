# Agent Instructions

This repository is an Expo SDK 57 React Native mobile app for NOVYX GreenOps. This file is the workspace harness loaded by PI CLI.

## Startup & Context

Before editing:

1. Read this `AGENTS.md` file completely.
2. Read `.agents/memory/UI_UX_MEMORY.md`.
3. Check `git status --short --branch`; preserve inherited changes.
4. Read the relevant document under `docs/`.
5. For mobile UI/UX work, read `docs/MOBILE_UI_RULES.md` and `.agents/skills/mobile-ui-ux/SKILL.md`.
6. Inspect the affected screen, shared primitives, tokens, callers, and state owners before choosing a solution.
7. Verify the exact Expo SDK 57 documentation before changing Expo or native APIs.

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

## Architecture Boundaries

- `apps/mobile` is the Expo React Native application. (Expo screens, navigation, device permissions, and mobile presentation.)
- `packages/contracts` is the only place for shared API envelopes, error codes, and cross-app DTO types.
- `packages/config` is the only place for environment validation helpers.
- `packages/ui` is the only place for shared design tokens.
- `apps/mobile/src/services/greenOpsService.ts`: mobile API boundary.
- `external/hermes-agent` is a pinned upstream submodule. Do not edit it directly for product work; update it through submodule workflow and document the new commit.

Reuse `apps/mobile/src/components/AppPrimitives.tsx` and existing tokens before adding a component, value, abstraction, or dependency.

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