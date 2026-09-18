# Code Quality

## Required Gates

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run mobile:export:android
```

## Rules

- TypeScript strict mode stays enabled.
- No `any` in product code.
- No ignored type errors without an ADR-level justification.
- Shared API types live in `packages/contracts`.
- Shared design tokens live in `packages/ui`.
- New dependencies require documented purpose and owner.
