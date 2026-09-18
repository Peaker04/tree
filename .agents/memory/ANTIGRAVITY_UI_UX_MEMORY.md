# Antigravity FE UI/UX memory

Updated: 2026-09-19

This is Antigravity's compact durable memory for mobile UI/UX work. Source code and current runtime evidence override stale notes. Task plans and checklists belong in `.planning/`, not here.

## Project identity

- Product: NOVYX GreenOps mobile field-operations app.
- Stack: Expo SDK 57, React 19, React Native 0.86, TypeScript strict monorepo.
- Primary target: compact Android devices with Vietnamese UI copy.
- Roles: Staff and Manager.

## Canonical reading order

1. `GEMINI.md`
2. `AGENTS.md`
3. This file
4. `docs/MOBILE_UI_RULES.md`
5. Relevant architecture/product/testing docs
6. `.agents/skills/mobile-ui-ux/SKILL.md`
7. Affected implementation and callers

## Stable architecture

- Mobile application: `apps/mobile`.
- Shared UI tokens: `packages/ui/src/index.ts`, consumed through `apps/mobile/src/theme/tokens.ts`.
- Shared mobile primitives: `apps/mobile/src/components/AppPrimitives.tsx`.
- Bottom navigation owner: `apps/mobile/src/components/NotchedBottomNav.tsx`.
- Device permission state: `apps/mobile/src/hooks/useDevicePermissions.ts`, `apps/mobile/src/services/devicePermissions.ts`, and `apps/mobile/src/components/DevicePermissionState.tsx`.
- Camera preview owner: `apps/mobile/src/components/DeviceCameraView.tsx`; only one active `CameraView` owner is allowed.
- API boundary: `apps/mobile/src/services/greenOpsService.ts`.
- Shared API contracts: `packages/contracts`.
- Environment validation: `packages/config`.

Do not copy shared contracts into screens, read secrets through Expo public variables, or import `external/hermes-agent` internals.

## Locked UX decisions

- Five-action notched bottom navigation is locked for both roles.
- Staff: `Trang chủ`, `Cây của tôi`, centered QR FAB, `Công việc`, `Tài khoản`.
- Manager: `Tổng quan`, `Giao việc`, centered QR FAB, `Duyệt`, `Tài khoản`.
- Active side navigation uses green icon/text only; no active pill, top line, filled square, or background shell.
- Camera and location permissions are requested contextually, never immediately after login.
- Permission states are derived from Expo response truth: `status`, `granted`, and `canAskAgain`.
- Staff proof sequence is GPS → matching QR → before photo → checklist → after photo → review → submit.
- Back navigation inside active work preserves completed proof fields.
- Manager review is evidence-first; approval remains unavailable while proof gaps exist.

Full normative detail remains in `docs/MOBILE_UI_RULES.md`.

## Visual language

- Botanical NOVYX palette: forest primary, honeydew/cornsilk/willow surfaces, emerald accent, mineral neutrals, restrained amber/danger/sky statuses.
- Foundational color, radius, spacing, and typography decisions belong in `packages/ui`.
- Field-use hierarchy beats decorative density. Cards group real work and should not nest for decoration.
- Copy must remain direct and readable on compact Android with long Vietnamese strings.
- Minimum touch target is 44×44; primary field actions normally use 48–52 height.
- Every meaningful status needs text/icon semantics; color alone is insufficient.

## Skill routing

- Entry point: `.agents/skills/mobile-ui-ux/SKILL.md`.
- Design exploration/review: `.agents/skills/ui-ux-pro-max/SKILL.md` with `--stack react-native`.
- Visual quality filter: existing Taste Skill.
- Implementation discipline: `karpathy-guidelines`.
- Broken or slow behavior: `diagnosing-bugs`.
- Regression/test-first work: `tdd`.

Do not apply web-library instructions from a generic skill to React Native. shadcn is a composition reference only; do not install shadcn, Radix, or Tailwind.

## Performance defaults

- Fix evidenced root causes rather than pre-optimizing.
- Use `FlatList`/`SectionList` for collections that can grow; keep stable keys.
- Derive values instead of duplicating state through effects.
- Keep state close to its owner and avoid broad rerender fanout.
- Do not add memoization without a concrete render cost.
- Clean up listeners, subscriptions, timers, and asynchronous work.
- Prefer native or existing Expo behavior over custom JS-driven per-frame work.

## Verification floor

Mobile UI code:

```powershell
npm run typecheck --workspace @novyx/mobile
npm run lint
```

Foundation, dependency, native config, or shared tokens:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run mobile:export:android
```

Use `npm run mobile:smoke:check` for covered flows. Runtime, visual, emulator, or device claims require real evidence; otherwise record `NEEDS_EVIDENCE`.

## Current durable pointers

- Mobile UI rules: `docs/MOBILE_UI_RULES.md`.
- Skill bundle manifest: `.agents/skills/MOBILE-UI-UX-BUNDLE.md`.
- Prior UI/UX plans and evidence: `.planning/quick/20260714-mobile-ui-ux-operational-refactor-v2/` and `.planning/quick/20260714-mobile-visual-refactor-e2e/`.
- Current branch at memory creation: `main`; always re-check branch/status before work.

## Memory update policy

Update this file only for stable facts:

- a changed architecture owner or path;
- a user-approved locked UX decision;
- a verified reusable performance/accessibility lesson;
- a new authoritative plan/evidence pointer.

Do not store secrets, credentials, raw chat history, transient failures, or duplicated plan checklists here.
