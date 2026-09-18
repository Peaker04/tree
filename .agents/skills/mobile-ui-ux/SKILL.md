---
name: mobile-ui-ux
summary: Project-specific Expo React Native UI/UX design, implementation, review, and performance guidance for NOVYX GreenOps.
description: Use for any UI/UX task in apps/mobile: screen design, interaction flows, accessibility, responsive compact-Android layouts, design tokens, React Native performance, loading/empty/error states, or visual review.
license: MIT
---

# NOVYX Mobile UI/UX

Use this as the project entry point for mobile interface work. It complements, rather than replaces, `docs/MOBILE_UI_RULES.md`.

## Required reading

1. `AGENTS.md`
2. `docs/MOBILE_UI_RULES.md`
3. The affected screen, `apps/mobile/src/components/AppPrimitives.tsx`, and `apps/mobile/src/theme/tokens.ts`
4. Expo SDK 57 documentation for every Expo or native API touched

For new visual direction or a broad redesign, also use:

- `ui-ux-pro-max` with `--stack react-native`
- the existing Taste Skill as a quality filter

For implementation, review, or refactoring, also use `karpathy-guidelines`. Add `diagnosing-bugs` for broken or slow behavior and `tdd` for regressions or test-first work.

## Design principles

- Design for field use first: sunlight, one-handed operation, interrupted workflows, unreliable networks, and long Vietnamese labels.
- Preserve the locked five-action bottom navigation and contextual permission model in `docs/MOBILE_UI_RULES.md`.
- Use `packages/ui` tokens and owned primitives before adding values, components, abstractions, or dependencies.
- Keep one clear primary action per state. Use progressive disclosure for secondary detail.
- Minimum touch target: 44×44; prefer 48–52 high for primary field actions.
- Respect safe areas, font scaling, compact Android widths, keyboard avoidance, and predictable Back behavior.
- Never communicate status by color alone. Provide text/icon semantics and accessible labels.
- Every network or device workflow needs deliberate loading, empty, denied/blocked permission, error, retry, and success states.
- Preserve user-entered and captured proof when navigating backward through an active workflow.
- Avoid decorative card nesting, gratuitous gradients, tiny text, placeholder-only labels, fake native controls, and animation without meaning.

## React Native implementation rules

- Use React Native and Expo SDK 57 APIs; do not install shadcn, Radix, Tailwind, or web-only UI packages.
- Keep API calls behind `apps/mobile/src/services/greenOpsService.ts` and shared DTOs in `packages/contracts`.
- Keep foundational colors, spacing, radius, and typography tokens in `packages/ui`.
- Prefer existing `AppPrimitives` and native components. Add a primitive only when at least two real screens need the same behavior.
- Use `Pressable` state for interaction feedback and accessibility props for role, label, hint, state, and disabled status.
- Use `FlatList`/`SectionList` for growing collections; keep stable keys and avoid recreating heavy row work during render.
- Keep state local unless multiple screens truly share it. Derive values instead of synchronizing duplicate state with effects.
- Memoize only after identifying a real render cost; do not blanket-wrap components in `memo`, `useMemo`, or `useCallback`.
- Avoid JS-driven per-frame layout animation. Prefer native/layout-safe animation and honor reduced-motion settings when motion is non-essential.
- Do not add a dependency for a small helper already covered by JavaScript, React Native, Expo, or the existing repository.

## Workflow

1. Trace the user flow and existing state owners end to end.
2. State the target user, task, device constraints, states, and success criteria.
3. Reuse tokens/primitives and choose the smallest change that preserves architecture.
4. Implement accessibility and failure states with the happy path, not afterward.
5. Review compact Android width, long Vietnamese copy, keyboard, safe area, font scale, loading/error/permission states, and Back behavior.
6. Run the narrow checks below.

## Verification

For mobile UI changes:

```powershell
npm run typecheck --workspace @novyx/mobile
npm run lint
```

For foundation, dependency, native config, or shared-token changes:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run mobile:export:android
```

Use `npm run mobile:smoke:check` when the changed flow is covered by the repository smoke path. Report visual/runtime behavior as unverified when no emulator/device evidence was collected.

## Delivery checklist

- Existing architecture and mobile rules preserved
- Compact Android and long Vietnamese copy considered
- Touch targets and accessibility semantics present
- Loading/empty/error/permission/retry states covered where relevant
- No unnecessary dependency or abstraction
- Relevant checks pass; runtime evidence and limits stated precisely
