# Hermes Agent Integration

## Installation

Hermes Agent is installed as a git submodule:

```text
external/hermes-agent
```

Pinned upstream commit at installation time:

```text
7b5ba2054721dde998ed47fd4a0f031955278e99
```

## Boundary

Hermes is an external agent runtime and reference implementation. Product code must not deep-import Python or JavaScript internals from the submodule.

Allowed integration paths:

- run Hermes as a separate process or service
- communicate through documented CLI/API/MCP/gateway boundaries
- document environment variables and operational assumptions before wiring product flows

Disallowed:

- editing files inside `external/hermes-agent` for NOVYX product behavior
- copying large Hermes source files into app packages
- depending on Hermes internal module paths

## Relevant Upstream Capabilities

- CLI and messaging gateway
- skills system
- MCP integration
- cron scheduling
- providers/toolsets
- dashboard/web surfaces

These should be evaluated through ADRs before production use.
