# Shared UI Tokens

## Status

ACCEPTED

## Context

The mobile app already uses shadcn-style React Native primitives. The project needs one source of truth for colors, spacing, and radius.

## Options

- Keep tokens inside the mobile app only.
- Move tokens to a shared package.

## Decision

Move shared tokens to `packages/ui` and re-export them from the mobile compatibility file.

## Rationale

This keeps the design system consistent as more apps or backend/admin surfaces are added.

## Tradeoffs

Expo/Metro must resolve workspace packages correctly.

## Consequences

New shared UI tokens are added in `packages/ui`, not directly in screens.
