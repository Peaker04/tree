# NOVYX GreenOps

Mobile-first foundation for NOVYX urban green verification: an Expo Android app, shared API contracts, shared config validation, shared UI tokens, and an external Hermes Agent integration reference.

## Repository Layout

```text
apps/
  mobile/              Expo SDK 57 React Native app
packages/
  contracts/           API envelopes, error codes, shared request/response types
  config/              Runtime environment validation
  ui/                  Shared design tokens
external/
  hermes-agent/        NousResearch/hermes-agent pinned as a git submodule
docs/
  adr/                 Architecture decision records
  integrations/        Integration notes for external repos/services
```

## Stack

- Mobile: Expo SDK 57, React Native 0.86, React 19.2.3
- Package manager: npm workspaces
- API style: REST, contract-first, `/v1`
- Shared contracts: TypeScript package in `packages/contracts`
- Design system: shadcn-style React Native primitives backed by `packages/ui`
- Agent integration: `external/hermes-agent` submodule; do not deep-import it into app code

## Local Commands

```powershell
npm install
npm run mobile:start
npm run mobile:android
npm run typecheck
npm run lint
npm run format:check
npm run mobile:export:android
```

Run the full foundation check:

```powershell
npm run check
```

For Android role, contextual permission, Staff proof, Manager review, API offline, loading, empty, and retry evidence, follow [docs/MOBILE_SMOKE_TEST.md](docs/MOBILE_SMOKE_TEST.md). This mobile UI/UX refactor did not add new commands, env vars, rebuild requirements, package dependencies, native config requirements, API endpoints, or contract packages.

## Environment

Copy `.env.example` to `.env` for local development. Public Expo variables must use the `EXPO_PUBLIC_` prefix. Secrets must never be committed or embedded in the mobile app.

Already expected mobile keys:

- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_API_BASE_URL`
- `GOOGLE_MAPS_API_KEY`

## Hermes Agent

Hermes is installed as a submodule:

```powershell
git submodule update --init --recursive
```

See [docs/integrations/HERMES_AGENT.md](docs/integrations/HERMES_AGENT.md).
