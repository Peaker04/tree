# Safe Repository Cleanup Design

**Date:** 2026-10-15  
**Status:** Approved and implemented; verification recorded in the execution summary

## Purpose

Remove generated artifacts, committed cache files, dead exports, and one proven-unused mobile dependency without moving source directories or changing product behavior.

## Scope

### Tracked cleanup

1. Delete `apps/mobile/src/components/index.ts`.
   - The file has no source, test, script, documentation, package, or configuration caller.
   - Mobile components continue to use their existing direct imports.
2. Delete committed Python bytecode under `.agents/skills/ui-ux-pro-max/**/__pycache__/`.
   - These files are generated output.
   - The root `.gitignore` already ignores `__pycache__/` and `*.py[cod]`.
3. Remove `react-native-curved-bottom-bar` from `apps/mobile/package.json` and `package-lock.json`.
   - Repository search finds no source or configuration caller.
   - `apps/mobile/src/components/NotchedBottomNav.tsx` owns the active bottom navigation implementation.

### Local-only cleanup

Delete ignored generated output and caches when present:

- root `.expo/`, `.tmp/`, `tmp/`, and `dist/`;
- `apps/admin-web/dist/` and its workspace-local `node_modules/`;
- `apps/api/dist/`;
- `apps/mobile/.expo/`;
- generated Android caches and outputs under `apps/mobile/android/.gradle/`, `apps/mobile/android/app/build/`, and `apps/mobile/android/app/.cxx/`;
- `scripts/__pycache__/`;
- ignored root log and temporary-check files.

These files are reproducible and are not part of the Git diff.

## Explicit exclusions

- Do not move or rename application, package, test, script, workflow, design, or documentation directories.
- Do not change import conventions beyond deleting the unused barrel file.
- Do not remove root Expo, React, or React Native dependencies; their workspace-hoisting and launcher roles are outside this cleanup.
- Do not remove `react-native-maps`; it is dynamically imported by `StaffProofFlow.tsx` and configured by `apps/mobile/app.config.js`.
- Do not change `.env`, native source/configuration, architecture contracts, business behavior, API contracts, or UI behavior.
- Do not add a cleanup abstraction or new dependency.

## Lockfile handling

After removing `react-native-curved-bottom-bar` from the mobile manifest, regenerate package metadata with npm in lockfile-only, scripts-disabled mode. The expected lockfile change removes only the mobile dependency declaration and the package's now-unreachable lock entry. Any unrelated lockfile rewrite is a blocker and must be reverted or reduced before proceeding.

## Verification

Run, in order:

1. `npm run format:check`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run mobile:export:android`
5. Search again for `react-native-curved-bottom-bar`, directory-level component imports, tracked cache files, and generated artifacts.
6. Inspect `git diff --check`, the final diff, and repository status.

No new test is required because the cleanup adds no branch, parser, data write, business rule, or runtime behavior. Existing compile, lint, format, and Android bundle boundaries own the regression evidence.

## Success criteria

- No product behavior or public contract changes.
- No caller references a deleted file or dependency.
- No generated Python bytecode remains in the working tree, and the tracked diff schedules every previously tracked bytecode file for deletion.
- Package manifest and lockfile agree.
- All verification commands pass.
- The final tracked diff contains only the approved deletions and package metadata updates.

## Risks and recovery

- The next local Android or Expo build will be slower because deleted caches must be rebuilt.
- If Android export shows that the curved-bottom-bar package is loaded indirectly, restore the manifest and lockfile entries; do not replace it with another package.
- Existing uncommitted user work must remain untouched. No reset, restore, commit, or push is part of this cleanup.
