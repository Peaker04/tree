# Security Policy

## Baseline

- Do not commit `.env`, tokens, keys, certificates, keystores, or production credentials.
- Mobile must not store backend secrets.
- Backend endpoints must enforce authorization; hidden UI is not security.
- API errors must use safe messages and must not expose stack traces.
- Logs must not contain tokens, passwords, raw location trails, or sensitive personal data.

## Reporting

Until a formal security channel exists, report security findings to the technical owner listed in `docs/PRODUCT.md`.
