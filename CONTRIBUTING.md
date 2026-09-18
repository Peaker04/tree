# Contributing

## Workflow

- Use short-lived branches from `main`.
- Use conventional commits: `feat(scope): ...`, `fix(scope): ...`, `docs(scope): ...`, `chore(scope): ...`.
- Keep pull requests focused on one goal.
- Update docs and ADRs with architecture-impacting changes.

## Required Checks

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run mobile:export:android
```

## Dependency Rules

Before adding a dependency, document:

- purpose
- why existing code is not enough
- maintenance/license risk
- bundle/build impact
- owner and removal plan

Hermes Agent is managed as a submodule under `external/hermes-agent`; do not vendor-copy its files into product packages.
