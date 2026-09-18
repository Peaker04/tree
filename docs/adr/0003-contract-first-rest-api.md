# Contract-first REST API

## Status

ACCEPTED

## Context

Mobile and backend need a stable shared contract before backend implementation starts.

## Options

- Let backend routes define ad hoc responses.
- Use GraphQL.
- Use REST with shared TypeScript contracts.

## Decision

Use REST under `/v1` with shared TypeScript envelopes and error codes in `packages/contracts`.

## Rationale

The current product flows are resource/action oriented and can start with a small consistent contract surface.

## Tradeoffs

Runtime schema validation still needs to be added before real backend endpoints ship.

## Consequences

API response shapes and error codes are not copied manually into mobile screens.
