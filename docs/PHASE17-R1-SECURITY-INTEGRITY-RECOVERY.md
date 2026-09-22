# Phase 17 - Recovery R1: Security & Authorization Integrity

## Recovery Evidence Verified
1. **R1-A — GOVERNANCE USER READ SECURITY**: The endpoint `GET /v1/governance/users` now strictly enforces `[authenticate, requireAdmin]` middleware.
2. **R1-B — NEGATIVE AUTHORIZATION TESTS**: Added four negative and positive validation tests in `tests/api/governance-users.spec.ts` guaranteeing 401 for anonymous, 403 for staff/manager, and 200 for admins on the read surface.
3. **R1-C — ADMIN MOBILE COERCION SECURITY REGRESSION**: Adjusted `mapSessionRole()` in `apps/mobile/src/services/greenOpsService.ts` to strictly output `Role | 'UNSUPPORTED'`. Admin sessions trying to launch the mobile app now trigger a hard exit to the login screen with an unsupported role error, terminating the dangerous fallback into the `Manager` operational scope.

## Formal Verdict
R1 PASS.
All tests executing locally pass with 0 errors. Mobile TypeScript and Application tests perfectly uphold the rigorous R1 bounds. Null mock states accurately dropped previously!

Next logical trajectory is `R2: Mobile Product Integrity`.
