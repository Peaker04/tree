# Hermes Agent As External Submodule

## Status

ACCEPTED

## Context

The project needs `NousResearch/hermes-agent` installed and available for future agent integration.

## Options

- Copy Hermes source into product packages.
- Install Hermes globally only.
- Add Hermes as a git submodule.

## Decision

Add Hermes as a git submodule under `external/hermes-agent`.

## Rationale

Submodules preserve upstream history, make the pinned commit auditable, and prevent accidental source mixing.

## Tradeoffs

Developers must run `git submodule update --init --recursive` after cloning.

## Consequences

Product code integrates through documented process/API boundaries only.
