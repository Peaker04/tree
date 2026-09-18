# Monorepo Foundation

## Status

ACCEPTED

## Context

The project needs a mobile app, future backend API, shared contracts, shared environment policy, and integration with external agent tooling.

## Options

- Keep Expo app at repository root.
- Use a monorepo with `apps/*`, `packages/*`, and `external/*`.

## Decision

Use an npm workspace monorepo.

## Rationale

This keeps mobile, future API, contracts, config, and UI tokens separated while preserving one source of truth for shared concerns.

## Tradeoffs

Workspace tooling is slightly more complex than a single Expo app.

## Consequences

Root commands orchestrate workspace checks. Expo mobile lives in `apps/mobile`.
