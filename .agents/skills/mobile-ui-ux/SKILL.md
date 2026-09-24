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
3. Root `DESIGN.md`; it is the active visual/token/primitive authority. Historical UI-SPEC files are evidence only when they conflict.
4. The affected screen, `apps/mobile/src/components/AppPrimitives.tsx`, and `apps/mobile/src/theme/tokens.ts`
5. Expo SDK 57 documentation for every Expo or native API touched

For new visual direction or a broad redesign, also use:

- `ui-ux-pro-max` with `--stack react-native`
- the existing Taste Skill as a quality filter

For implementation, review, or refactoring, also use `karpathy-guidelines`. Add `diagnosing-bugs` for broken or slow behavior and `tdd` for regressions or test-first work.

## Harness calibration

Treat project guidance by strength:

- invariants: domain/security/data-integrity/accessibility/data-loss constraints;
- contextual defaults: visual hierarchy, density, surfaces, navigation and interaction patterns;
- examples: screenshots, prior implementations and historical findings.

Never weaken an invariant for convenience. Do not apply a contextual default when its causal assumptions do not fit the current screen. In that case, state the conflict, make the smallest local deviation, and verify it. Known-failure entries are applied by matching root cause, not by keyword or visual similarity.

Temporary user screenshots and external file paths are review inputs, not durable project artifacts. Durable notes store semantic findings and outcomes, never Downloads filenames, unless the user explicitly asks to retain an artifact and it is copied to a stable repository path.

## Mandatory harness procedure

Before implementing or reviewing any mobile screen:

1. Load `docs/FUNCTIONAL_NON_FUNCTIONAL_REQUIREMENTS_RULES.md`, apply only the criteria relevant to the feature, and identify the project owner documents that resolve them.
2. Load `.agents/memory/UI_UX_MEMORY.md` and apply its mandatory execution gate and known-failure register.
3. Record the screen's user/job, information order, primary action, production data scale, control semantics, user-facing vocabulary, applicable states and required device interactions. Classify each applied rule as invariant or contextual default.
4. For every reported UI issue, write the reasoning chain before choosing a solution: `Problem → User Goal → Business Context → Design Principle → Spatial Composition → Candidate Pattern → Existing Design System → Component / Token → Implementation`. Name the affected principle explicitly. A screenshot identifies symptoms; it never selects dimensions or the pattern by itself.
5. Audit the relevant spatial composition before implementation: content-to-container ratio, intrinsic/fixed sizing, grouping, proximity, vertical/horizontal rhythm, alignment, visual anchors, information density, container nesting, section separation, focal priority and responsive behavior. Classify the cause as local layout, shared component, token, design system, content structure, responsive behavior or interaction pattern, then fix the lowest appropriate scope.
6. Compare candidate patterns against action frequency, risk, reversibility, information volume, platform convention, accessibility, responsive behavior and existing project patterns. Do not treat a pattern list as a component backlog, and do not confuse interaction behavior with visual style.
7. Run `ui-ux-pro-max` with `--stack react-native` for any new or materially changed interaction. Treat database results as research input only; reject recommendations that conflict with project authority or native conventions.
8. Use Taste as a visual quality filter and `karpathy-guidelines` as the implementation filter.
9. Before implementation, resolve trust-boundary, data-loss, authorization and accessibility invariants. Resolve other criteria only when relevant; do not block work to satisfy an inapplicable pattern.
10. On the first reproducible occurrence of a reusable device-discovered failure, update the memory register and add the smallest durable regression check. Keep one-off or local exceptions local.

## Design authority

For mobile UI work, read sources in this order after the project instructions:

1. `docs/MOBILE_UI_RULES.md` for workflow, navigation, device, accessibility, and field-use constraints.
2. Root `DESIGN.md` for active visual hierarchy, typography, semantic tokens, surfaces, and primitive governance.
3. `docs/NOVYX_MOBILE_DESIGN_SYSTEM.md` for implementation-ready component, color, typography, size, badge, metric, selector and date-time picker contracts.
4. `.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md` when present for screen-specific information architecture and state composition.
5. Historical UI-SPEC/planning artifacts only as evidence; they cannot override the active sources above.

When active sources conflict on an invariant, stop and reconcile authority before editing. For contextual defaults, choose the source that best matches the actual user task and device evidence, and record a concise rationale rather than treating every difference as a blocker.

## Design principles

Design principles are evaluation criteria; spatial composition determines how information occupies and relates in space; patterns are context-selected tools. Always establish business meaning, the affected principle, and the content/task spatial needs before selecting radio groups, cards, sticky actions, sheets, dialogs, accordions, or any other pattern. Pattern styling—fill, border, icon, radius, spacing—is a separate decision and must not alter behavior accidentally.

Prefer intrinsic sizing and semantic proximity. A card, wrapper, fixed/minimum height, equal-height layout or viewport-filling surface must have a real grouping, hierarchy, interaction, state, media, accessibility, navigation or product role. Do not add decoration or fake content to fill empty space, and do not globally change density because one screenshot appears sparse or crowded.

- Design for field use first: sunlight, one-handed operation, interrupted workflows, unreliable networks, and long Vietnamese labels.
- Preserve the locked five-action bottom navigation and contextual permission model in `docs/MOBILE_UI_RULES.md`.
- Use `packages/ui` tokens and owned primitives before adding values, components, abstractions, or dependencies.
- Keep one clear primary action per state. Use progressive disclosure for secondary detail.
- Minimum touch target: 44×44; prefer 48–52 high for primary field actions.
- Respect safe areas, font scaling, compact Android widths, keyboard avoidance, and predictable Back behavior.
- Never communicate status by color alone. Provide text/icon semantics and accessible labels.
- Every network or device workflow needs deliberate loading, empty, denied/blocked permission, error, retry, and success states.
- Validation timing follows interaction lifecycle: opening a picker is neutral/in-progress; show missing-required feedback only after dismiss-without-value or submit intent, never before the completion overlay appears.
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
2. State the target user, job-to-be-done, entry/exit conditions, information priority, one primary action, device constraints, states, and success criteria.
3. Evaluate spatial composition against actual content: intrinsic sizing, grouping/proximity, rhythm/alignment, anchors, density, nesting, balance, section separation and responsive allocation. Identify the lowest root-cause scope before choosing a pattern.
4. Reuse tokens/primitives and choose the smallest change that preserves architecture.
5. Implement accessibility and failure states with the happy path, not afterward.
6. Review compact Android width, long Vietnamese copy, keyboard, safe area, font scale, loading/error/permission states, Back behavior, sparse and expanded content, and content-to-container fit.
7. Run the narrow checks below.

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
