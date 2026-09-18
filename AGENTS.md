# Agent Instructions

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code in `apps/mobile`.

## Architecture Boundaries

- `apps/mobile` is the Expo React Native application.
- `packages/contracts` is the only place for shared API envelopes, error codes, and cross-app DTO types.
- `packages/config` is the only place for environment validation helpers.
- `packages/ui` is the only place for shared design tokens.
- `external/hermes-agent` is a pinned upstream submodule. Do not edit it directly for product work; update it through submodule workflow and document the new commit.

## Before Editing

- Read this file and the relevant doc under `docs/`.
- For mobile UI work, also read `docs/MOBILE_UI_RULES.md`.
- Check existing implementation before adding new dependencies or abstractions.
- Identify API, auth, database, security, and backward-compatibility impact.
- For mobile code, verify Expo SDK 57 docs first.

## Required Checks

Run the narrow relevant checks, and for foundation-level changes run:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run mobile:export:android
```

## Rules

- Do not commit secrets or `.env`.
- Do not copy API types manually into app code.
- Do not import from `external/hermes-agent` internals.
- Do not change architecture decisions without an ADR.
- Do not disable lint/type rules or reduce TypeScript strictness to make errors disappear.
- Keep changes scoped and rollback-friendly.
