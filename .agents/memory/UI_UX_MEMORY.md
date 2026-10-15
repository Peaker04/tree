# PI FE UI/UX memory

Updated: 2026-10-06

This is the PI agent's compact durable memory for mobile UI/UX work. Source code and current runtime evidence override stale notes. Task plans and checklists belong in `.planning/`, not here.

## Project identity

- Product: NOVYX GreenOps mobile field-operations app.
- Stack: Expo SDK 57, React 19, React Native 0.86, TypeScript strict monorepo.
- Primary target: compact Android devices with Vietnamese UI copy.
- Roles: Staff and Manager.

## Canonical reading order

1. `AGENTS.md`
2. This file
3. `docs/MOBILE_UI_RULES.md`
4. Relevant architecture/product/testing docs
5. `.agents/skills/mobile-ui-ux/SKILL.md`
6. Affected implementation and callers

## Harness calibration

This file is a decision aid, not a rigid screen generator. Before applying a rule, classify it:

- **Invariant:** domain truth, authorization, security, data integrity, accessibility, or prevention of data loss. These may not be relaxed for visual convenience.
- **Contextual default:** hierarchy, surface, density, navigation, copy, and interaction patterns. Use them when their causal conditions match; deviate when device evidence or the task context shows a better fit.
- **Example:** prior screen, screenshot, implementation, or known-failure entry. Examples inform diagnosis but do not prescribe the next screen.

When a contextual default does not fit, record the conflict, choose the smallest context-specific deviation, preserve the invariant behind the rule, and verify the result. Do not create a global exception from one local case.

The known-failure register is causal memory, not a checklist to apply mechanically. An entry applies only when the same failure mechanism is present.

## Ephemeral evidence policy

User-provided screenshots, Downloads paths, chat attachment names, and temporary device files are session evidence. Do not store their filenames or paths in durable memory, plans, contracts, or review documents.

Durable documents record:

- the observed state or interaction;
- the finding and root cause;
- the decision or acceptance result;
- device/platform context when relevant;
- a stable repository artifact path only when the artifact was intentionally copied into the repository for retention.

If no durable artifact exists, use wording such as “physical iPhone review confirmed…” rather than an external filename. The user may delete temporary evidence after review without invalidating project documentation.

## Mandatory execution gate

This file is the single operational harness for mobile UI work. Reading it is not sufficient; every screen change must first apply the relevant criteria from `docs/FUNCTIONAL_NON_FUNCTIONAL_REQUIREMENTS_RULES.md`, then explicitly resolve the following before code is edited:

0. **FR/NFR context:** identify the relevant business intent, rules, data/lifecycle, validation, authorization, failure paths and quality attributes. Mark non-applicable rules as excluded rather than generating speculative implementation.

0a. **Principle before pattern:** express the reasoning chain `Problem → User Goal → Business Context → Design Principle → Spatial Composition → Candidate Pattern → Existing Design System → Component / Token → Implementation`. Principles evaluate; spatial composition determines how information should occupy and relate in space; patterns solve contextually; style presents; tokens encode; components implement. Screenshot evidence may expose a symptom but cannot choose dimensions or a pattern by itself. Never infer that a listed pattern must be implemented.

0b. **Spatial composition audit:** before changing layout, record the relevant content-to-container ratio, intrinsic/fixed sizing, grouping, proximity, vertical/horizontal rhythm, alignment, visual anchor, information density, container nesting, section separation, focal priority and responsive behavior. Classify the root cause as local layout, shared component, token, design system, content structure, responsive behavior or interaction pattern. Fix the lowest appropriate scope. Do not add decoration, fake content, cards, fixed heights or global spacing changes merely to make a screenshot look fuller or emptier.

1. **User/job:** who is acting and what single outcome they need.
2. **Information order:** orientation → decision → supporting evidence → metadata.
3. **Primary action:** exactly one dominant action for each state.
4. **Data scale:** expected production volume, search/filter need, and virtualization boundary. Never design from the one-row dev seed.
5. **Control semantics:** radio, toggle, multi-select, picker, clear and change behavior must be named before choosing visuals.
6. **User language:** visible copy must be approved Vietnamese product language or localized authoritative data. Internal enums, technical profile names, English seed descriptions, IDs-as-labels and raw API errors are prohibited.
7. **Input ergonomics:** choose device-appropriate controls. Date/time must use a picker, presets, or another bounded interaction unless free-form entry is an explicit product requirement.
8. **States:** loading, empty, error, retry, offline/cache, validation, submitting and success as applicable.
9. **Evidence:** define the device states/interactions required for acceptance. Record reviewed outcomes semantically; never persist temporary screenshot names or external paths.
10. **Research:** for a new or materially changed interaction, run `ui-ux-pro-max` with `--stack react-native`, then filter the result through `DESIGN.md`, the screen contract and native platform conventions.
11. **Responsive spatial evidence:** for a materially changed layout, define the smallest supported viewport, representative long Vietnamese copy/font scale, and the content expansion or sparse state needed to verify intrinsic sizing, scanability, no clipping, no obscured actions and no structurally wasted space.

A task is not complete when typecheck passes. It remains `NEEDS_EVIDENCE` until the relevant runtime/device states are reviewed. The exact evidence form is context-dependent; do not require a screenshot when an interaction trace, runtime log, accessibility inspection, or direct device observation is the stronger proof.

## First-failure learning protocol

When a new, reproducible and reusable UI failure is observed in physical-device evidence:

1. Diagnose the violated contract or missing rule and confirm the same causal condition can recur.
2. Add one generalized rule only when it is reusable; do not log screenshots, filenames, paths, or chat history.
3. Add the smallest durable check appropriate to the risk: focused test, contract assertion, lintable rule, or device acceptance item.
4. Correct an active contract only when the contract itself allowed the failure.
5. Re-run only the relevant execution-gate items before implementing the fix.

Do not promote one-off taste feedback, temporary seed-data artifacts, or local layout exceptions into global rules. A local correction may remain local when the cause is local.

## Known-failure register

| ID | Reusable failure | Preventive rule | Required check |
|---|---|---|---|
| UI-001 | A technically correct screen was accepted after compile/tests without full-size device review. | Visual acceptance is a blocking gate; never report UI PASS from typecheck/export alone. | Review required iPhone and compact-Android evidence at full size. |
| UI-002 | Internal vocabulary reached users: `CHANGE_PROOF`, English seed text, UUID/technical identifiers and raw server messages. | Screens consume user-facing Vietnamese labels; translate stable error codes at the boundary and keep technical metadata behind diagnostics. | Focused copy/error mapping tests plus screenshot review. |
| UI-003 | A one-record development catalog was rendered as the final selection interaction. | Design catalog interactions for production cardinality; people/trees/types require search or progressive selection and virtualized results when they can grow. | Test representative multi-record fixtures and inspect scroll/search behavior. |
| UI-004 | Selection rows looked like toggles but behaved as non-clearable radio controls. | Match visuals to semantics. Required single-select uses radio semantics and an explicit Change/Clear path when reversal is needed; never imply tap-to-toggle if deselection is unsupported. | Interaction test for select, change and clear/back preservation. |
| UI-005 | Deadline required manual `YYYY-MM-DD` entry and omitted time. | Operational deadlines use a date-and-time picker or bounded preset flow, display localized Vietnamese date/time, and serialize ISO only at the service boundary. | Tests for locale display, timezone, future validation and canonical payload. |
| UI-006 | Guidance copy repeated obvious implementation detail and pushed actions below the fold. | Copy only explains decisions, consequences or recovery. Remove text that merely narrates labels, server ownership or internal architecture. | Initial-viewport screenshot must show the current decision and reachable action without redundant prose. |
| UI-007 | Mutation failure surfaced as generic/raw `Internal server error`. | Map stable API error codes to actionable Vietnamese messages; log technical detail only in development diagnostics. Preserve form state and avoid duplicate submission. | Focused error-code mapping and retry/idempotency tests. |
| UI-008 | Create Task mutation initially omitted its required idempotency header. | Every state-changing command must trace transport requirements, including idempotency/OCC, before UI implementation is accepted. | Transport test asserts UUIDv4 header and absence from request body. |
| UI-009 | A successful mutation or later list response failed serialization because legacy stored JSON did not match the canonical response schema, producing false 500s, cache fallback and duplicate-submit risk. | Normalize persisted legacy shapes on every repository read boundary that can emit them, then exercise the real HTTP response schema before device acceptance. A failed response must not be assumed to mean no mutation occurred. | Backward-compatibility normalization test plus real database HTTP create/list/replay evidence. |
| UI-010 | Light hero surfaces retained white copy and transparent status treatments, producing washed-out content on physical devices. | Surface tone and foreground role are paired contracts: authority/dark surfaces use light copy; warm/light surfaces use ink/pewter. Status treatments use semantic surface-border-text token triplets. | Full-size contrast review of hero, offline and account states. |
| UI-011 | Status badges and compact metrics wrapped or escaped their parent row at production font scale. | Badges are one-line, short labels with fixed semantic treatment; parent rows must give primary copy `flex: 1`. Four-column metrics require one-line acceptance or must collapse to fewer columns. | Increased-font and compact-width screenshot review. |
| UI-012 | Deadline presets could not express an arbitrary operational date and felt like filters rather than a date-time control. | Use the project calendar page-sheet contract: arbitrary future date, explicit time slot, localized summary and explicit confirmation. | Interaction evidence for month navigation, past-date blocking, time selection, cancel and confirm. |
| UI-013 | A screen-level fixed action dock competed with the locked bottom navigation and overlaid form controls/labels. | Top-level tab screens use normal document flow above the global navigation. Fixed/sticky action surfaces are allowed only in focused workflows where bottom navigation is hidden and safe-area ownership is explicit. | Full-scroll device evidence proves no control, label or error is obscured. |
| UI-014 | Labels placed outside grouped selectable rows escaped rounded containers and overlapped separators during reflow. | A grouped row owns its own label, value, metadata and action inside one semantic boundary; standalone field labels remain outside only for standalone controls. | Increased-font and compact-width evidence for grouped selector rows. |
| UI-015 | Rejected login promises surfaced Expo's raw `Uncaught (in promise)` toast instead of an in-product authentication result. | The screen owner catches every login rejection and maps connectivity, credential and unknown failures to localized safe copy; raw infrastructure errors never reach the device UI. | Invalid credentials and unreachable API evidence show an in-product alert with no Expo error toast. |
| UI-016 | Single-line `TextInput` inherited both vertical padding and a `<Text>` typography role containing `lineHeight`; after correcting it, applying the same zero-padding/fixed-height rule to multiline fields left top-aligned copy flush against the border. | Shared Field has explicit native variants: single-line uses exact height, no explicit line height and centered text; multiline removes fixed height, restores balanced vertical padding and remains top-aligned. Screens must not compensate locally. | Foundation regression check plus physical-device single-line first-character and multiline empty/entered evidence. |
| UI-017 | Review attempted to render an authoritative `s3://` storage reference as a React Native image URI, causing a native red-screen. | Treat storage references and renderable media URLs as distinct contracts. Only pass supported `http(s)`, `file`, `content`, or `data` URIs to `Image`; otherwise show a truthful stored-but-not-previewable state until the backend provides a display URL. | Focused URI-scheme guard plus device review with a server storage reference. |
| UI-018 | A reason entered for one review outcome persisted after switching to a different outcome, silently reusing corrective copy as exception or cancellation rationale. | Inputs whose meaning changes with a mode/decision must reset validation, transport errors and mode-specific values when that semantic owner changes, unless the product explicitly defines a safe shared draft. | Switch through every outcome after entering a reason; each newly selected outcome starts with its own empty required field. |
| UI-019 | Opening a required picker marked its closed control invalid before the picker used to complete the value appeared, creating a yellow error flash under the modal transition. | Treat opening as interaction-in-progress, not failure. Show required feedback only after dismiss-without-value or submit intent; selecting a valid value completes the interaction without an intermediate invalid state. | Open each required picker from a neutral form, confirm no underlying error flash, then separately verify dismiss-without-value and valid selection outcomes. |
| UI-020 | A contextual action navigated from an expandable top-level row into a focused screen whose header had no Back owner, trapping the user unless they used global navigation. | Every focused route records its origin and renders an explicit Back action to that owner. Scrollability is independent: content that can exceed the viewport must use a scroll/list container. | Enter the focused screen from every supported origin, verify Back returns to that origin with state preserved, and inspect the smallest supported viewport. |
| UI-021 | A rework task retained all previously accepted proof, so the generic completeness helper routed Staff directly to final Review; Back then followed the original linear workflow, and storage-only photo refs crashed the camera preview. | Rework is a targeted corrective branch, not a fresh linear run or an automatically complete submission. Project the canonical review target/reason, route to that proof owner, make Back return to Task Detail, preserve unaffected proof, and never pass storage refs to native image loaders. | Cover each target (GPS, QR, before, checklist, after, generic), retained-proof routing, origin-aware Back, storage-only preview, replacement capture and resubmit. |
| UI-022 | A mutation catch block silently stayed on the same screen, making a failed network/upload/API action look like a dead button. The rework path also posted a temporary camera URI without first using the canonical presign/upload pipeline. | Never swallow user-initiated mutation failures. Preserve input/evidence, show actionable localized feedback beside the action, and convert local evidence to a server-issued durable reference before submitting canonical proof. | Force upload and API failures, verify visible retry feedback and retained evidence, then verify presign → binary PUT → durable reference → mutation → authoritative status. |
| UI-023 | A native camera preview used `flex: 1` inside a wrapper that only received a composed style array; the native child measured narrowly on iOS, while a dark header rendered a white Back icon on a light circular control. Expo Go also exposed Node-like process globals, causing runtime detection to choose the Node evidence hasher. | Native media should explicitly fill its owned wrapper (`StyleSheet.absoluteFill`) and controls must derive foreground from their actual local surface, not the surrounding screen. Runtime selection must identify React Native directly rather than treating `process.versions.node` as proof of a Node host. | Physical-device camera preview fills the capture surface; Back icon remains visible; captured evidence hashes/uploads through the Expo implementation and reaches the resubmit endpoint. |
| UI-024 | A path-owned mutation body schema required the same `taskId` that the mobile service correctly removed from the body, so a successfully uploaded rework image was followed by HTTP 400 before the use case ran. Existing API tests masked the mismatch by sending `taskId` in both path and body. | For path-owned identity, the HTTP body schema must omit that identifier and the route must inject the path value into the application request. Regression tests must use the same body shape as the real client. | Real-client-shaped route test omits `taskId`; malformed/stale requests reach business validation rather than failing body validation; device rework completes after S3 upload. |
| UI-025 | A new GPS-enabled form called Expo Location directly, bypassing the shared permission state owner; on a device where iOS had already decided permission, no system prompt appeared and the screen could not explain whether access was granted, denied or blocked. The same form silently defaulted age/health and generated identifiers in presentation. | Every device-capability flow uses the shared permission state machine and shows rationale, denied/retry, blocked/settings, granted, in-progress and result states independently of whether the OS displays a prompt. Domain values require explicit user confirmation or authoritative defaults; presentation does not generate canonical identity. | Re-enter after prior grant/deny, verify explicit state and recovery; GPS success shows accuracy/time; submit-with-missing produces field-level feedback; source check rejects direct permission requests and silent domain defaults in the screen. |
| UI-026 | Grouped selectors first used inset dividers that exposed neutral strips between invalid rows; changing the whole container to warning then incorrectly tinted untouched sibling controls when only one selection had been attempted. Account identity also used role icons instead of a reusable user identity representation. | Grouping owns geometry, clipping and full-width dividers only. Each child selector independently owns touched/invalid state, warning fill and corrective copy; validation may never propagate visually to untouched siblings. Authenticated account headers use one shared deterministic, accessible avatar fallback from session identity; photo upload is prohibited until IAM owns its canonical cross-device lifecycle. | Compact-width/font-scale review of one-invalid, partially invalid and fully invalid groups; source regression rejects group-level warning state and inset divider gaps. Manager/Staff account checks assert the shared avatar and long-email reflow. |
| UI-027 | Operational screens accumulated explanatory sentences that repeated headings, labels or already-visible state, causing avoidable wrapping and pushing evidence/actions downward. Near-white icon tiles also merged into the warm app background and card surfaces, weakening hierarchy. | Visible copy is edited by information value: orientation once, concise state, then the next action or recovery. Labels/statuses target one line and support copy targets two short lines before relying on wrapping. Shared icon containers use semantic `iconSurface` and `iconBorder`; screens do not invent white/background-colored tiles. | Source checks cover banned redundant phrases and shared icon tokens; physical compact-width + increased-font review covers review detail, permissions, dashboards, empty/error states and all ListRow/icon-tile families without clipping or lost contrast. |
| UI-028 | Android ADB automation exited the app to the home launcher because `closeKeyboard` sent `keyevent 4` (Back) unconditionally when IME was not open. | Query `dumpsys input_method` for `mInputShown=true`, and send `keyevent 111` (KEYCODE_ESCAPE) to dismiss the keyboard safely without popping navigation or backing out of the app. Ensure foreground focus check before interactions. | Full E2E automation run maintains `mCurrentFocus` on `com.novyx.greenops` across all authentication and modal workflows. |
| UI-029 | Date range picker rendered disjointed square boxes and sharp edges between selection days across calendar rows. | Use a continuous ribbon track (`ribbonTrack`) positioned behind day circles, with rounded caps at week boundaries (T2 and CN) and no square artifact bleed. | Device screenshot inspection across 3-day, multi-week presets and manual range selections. |
| UI-030 | Child workflows hid bottom navigation bar; tapping bottom tab coordinates while nested failed silently. | Nested sub-screens must pop back to root via `safelyExitToMain()` (top-left back chevron) before bottom tabs or role switching are reachable. | Automation back loop verifies bottom navigation is visible before role/tab transitions. |
| UI-031 | Calendar range picker displayed disjointed rectangular artifacts behind circular date badges. | Range selection uses continuous pill ribbons: start date has rounded left cap, end date has rounded right cap, and in-range tracks auto-cap at week/month boundaries without square protrusion. | Visual review of multi-day and multi-week range selections on physical device. |
| UI-032 | Modal/sheet backdrops used heavy dark grey-black scrim (`rgba(10, 25, 18, 0.48)`) that lingered during back navigation. | Use Soft Botanical Scrim (`rgba(12, 28, 20, 0.28)`) and snappy dismiss animation (100-140ms) so backdrops do not lag behind screen pops. | Physical device inspection confirms smooth, non-lingering backdrop dismissal. |
| UI-033 | Notification badges in StaffArea displayed unlocalized raw English enum types (`success`, `warning`, `danger`, `info`) in Vietnamese UI. | Map notification types through localized metadata contract (`NOTIFICATION_TYPE_META`: `Thành công`, `Cần làm lại`, `Khẩn cấp`, `Thông tin`) with consistent semantic tone colors. | Automated E2E notification center capture displays 100% localized Vietnamese badge text. |
| UI-034 | In Expo Go (iOS or generic runtime without native binary compilation), `react-native-maps` throws `AIRMap was not found in UIManager`, displaying fallback box and preventing map view. | Integrate `WebMapView` with interactive Leaflet + OpenStreetMap fallback via `react-native-webview`, rendering tree pin, 10m check-in radius circle, and real-time user GPS marker updates with smooth `injectJavaScript` animation. Native custom builds continue to use Google Maps natively. | Verified via mobile typecheck, vitest unit tests (`tests/mobile/ui-foundation.spec.ts`), and Metro android/ios bundle exports. |
| UI-035 | Fixed camera zoom in map check-in view clipped off-screen trees when farther away (>200m), and ambiguous "GPS đáng tin" copy caused users to conflate hardware GPS accuracy with operational check-in proximity. | Implement auto-fit bounds (`mapRegion` calculation) to dynamically frame both user and tree with safe margins, draw dashed navigation line between coordinates, and separate hardware satellite quality (`Tín hiệu vệ tinh: Tốt (±{accuracy}m)`) from check-in distance state (`< 10m`). | Verified on iOS Expo Go evidence, vitest unit tests, and Metro iOS bundle export. |
| UI-036 | Defaulting to native `MapView` on iOS rendered Apple Maps (`Maps Legal`) inside Expo Go, conflicting with requested Google Maps experience. | Transitioned default map presentation to `WebMapView` with dual-engine toggle (`Google Maps` via JS API using `GOOGLE_MAPS_API_KEY` ⇋ `Leaflet OSM`), completely eliminating Apple Maps by default while offering instant live switching between Google and OpenStreetMap. | Verified with vitest (`tests/mobile/ui-foundation.spec.ts`), mobile TypeScript checks, and Metro bundle exports. |

## Stable architecture

- Mobile application: `apps/mobile`.
- Shared UI tokens: `packages/ui/src/index.ts`, consumed through `apps/mobile/src/theme/tokens.ts`.
- Shared mobile primitives: `apps/mobile/src/components/AppPrimitives.tsx`.
- Bottom navigation owner: `apps/mobile/src/components/NotchedBottomNav.tsx`.
- Device permission state: `apps/mobile/src/hooks/useDevicePermissions.ts`, `apps/mobile/src/services/devicePermissions.ts`, and `apps/mobile/src/components/DevicePermissionState.tsx`.
- Camera preview owner: `apps/mobile/src/components/DeviceCameraView.tsx`; only one active `CameraView` owner is allowed.
- API boundary: `apps/mobile/src/services/greenOpsService.ts`.
- Shared API contracts: `packages/contracts`.
- Environment validation: `packages/config`.

Do not copy shared contracts into screens, read secrets through Expo public variables, or import `external/hermes-agent` internals.

## Design authority

- Active precedence for mobile UI is: functional/domain contracts → `docs/MOBILE_UI_RULES.md` → root `DESIGN.md` → `.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md` when published → historical planning artifacts.
- The historical `.planning/quick/20260714-mobile-ui-ux-operational-refactor-v2/UI-SPEC.md` is no longer normative for typography, gradients, spacing, fallback semantics, or mock-device paths.
- Product design read: trust-first field operations; botanical, restrained, operational, evidence-led.
- Active design dials: variance 3/10, motion 2/10, density 6/10.
- Active typography is the React Native system font with weights 400/500/600. Existing heavier weights are migration debt and must not be copied.
- B2.6 will publish `.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md`, which owns per-screen job-to-be-done, information priority, progressive disclosure, primary action, state matrix, and device acceptance.

## Locked UX decisions

- Five-action notched bottom navigation is locked for both roles.
- Staff: `Trang chủ`, `Cây của tôi`, centered QR FAB, `Công việc`, `Tài khoản`.
- Manager: `Tổng quan`, `Giao việc`, centered QR FAB, `Duyệt`, `Tài khoản`.
- Active side navigation uses green icon/text only; no active pill, top line, filled square, or background shell.
- Camera and location permissions are requested contextually, never immediately after login.
- Permission states are derived from Expo response truth: `status`, `granted`, and `canAskAgain`.
- Staff proof sequence is GPS → matching QR → before photo → checklist → after photo → review → submit.
- Back navigation inside active work preserves completed proof fields.
- Manager review is evidence-first; approval remains unavailable while proof gaps exist.

Full normative detail remains in `docs/MOBILE_UI_RULES.md`.

## Visual language

- Botanical palettes are primitive color sources, not screen mockup specifications. Warm/natural colors are foundation candidates and fresh/cool colors are accent candidates; semantic assignment follows product context, existing tokens, contrast and status meaning. Unused palette colors are acceptable, and reference artwork never authorizes gradients, glow, blur, noise or decorative effects.
- Foundational color, radius, spacing, and typography decisions belong in `packages/ui`.
- Field-use hierarchy beats decorative density. Cards group real work and should not nest for decoration.
- Copy must remain direct and readable on compact Android with long Vietnamese strings.
- Minimum touch target is 44×44; primary field actions normally use 48–52 height.
- Every meaningful status needs text/icon semantics; color alone is insufficient.

## Diagram maintenance

- `docs/diagrams/README.md` owns the diagram catalog, classifications, typography rules, and render/update procedure.
- Vietnamese diagrams use bundled Noto Serif for headings, bundled Noto Sans for prose, and bundled Geist Mono only for enum/path/technical labels; font files and OFL notices live in `docs/diagrams/assets/fonts/`.
- Never remove the bundled stylesheet without replacing it with an equally deterministic font source: missing Noto faces fall back to Times/Segoe metrics and visibly break Vietnamese kerning/diacritics.
- Font acceptance requires `document.fonts.ready`, loaded Noto Sans/Noto Serif FontFace entries, and a full-size regenerated PNG—not only a declared `font-family`.
- Prefer HTML/CSS Grid/Flex for text-heavy diagrams; do not place long Vietnamese prose at fixed SVG coordinates.
- Visual acceptance requires opening full-size 1440×1400 browser renders for every affected file; a contact sheet alone is not evidence.
- Re-render the entire diagram folder after shared typography/layout changes and never claim visual PASS without checking overlap, clipping, overflow, encoding, and source/status accuracy.

## Skill routing

- Entry point: `.agents/skills/mobile-ui-ux/SKILL.md`.
- Design exploration/review: `.agents/skills/ui-ux-pro-max/SKILL.md` with `--stack react-native`.
- Visual quality filter: existing Taste Skill.
- Implementation discipline: `karpathy-guidelines`.
- Broken or slow behavior: `diagnosing-bugs`.
- Regression/test-first work: `tdd`.

Do not apply web-library instructions from a generic skill to React Native. shadcn is a composition reference only; do not install shadcn, Radix, or Tailwind.

## Performance defaults

- Fix evidenced root causes rather than pre-optimizing.
- Use `FlatList`/`SectionList` for collections that can grow; keep stable keys.
- Derive values instead of duplicating state through effects.
- Keep state close to its owner and avoid broad rerender fanout.
- Do not add memoization without a concrete render cost.
- Clean up listeners, subscriptions, timers, and asynchronous work.
- Prefer native or existing Expo behavior over custom JS-driven per-frame work.

## Verification floor

Mobile UI code:

```powershell
npm run typecheck --workspace @novyx/mobile
npm run lint
```

Foundation, dependency, native config, or shared tokens:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run mobile:export:android
```

Use `npm run mobile:smoke:check` and `npm run mobile:e2e:lifecycle` for covered flows. Runtime, visual, emulator, or device claims require real evidence; otherwise record `NEEDS_EVIDENCE`.

## Current durable pointers

- Source-of-truth design and mobile rules: `DESIGN.md`, `docs/MOBILE_UI_RULES.md`, and the B2.6 `.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md` when published.
- Daily Care Dispatch Spec & Plan: `docs/superpowers/specs/2026-10-06-daily-care-dispatch-design.md`, `docs/superpowers/plans/2026-10-06-daily-care-dispatch.md`.
- Soft Botanical Components: `BottomSheetModal`, `DateRangePickerSheet`, `TreeScopeSelectorSheet` in `apps/mobile/src/components/`.
- Skill bundle manifest: `.agents/skills/MOBILE-UI-UX-BUNDLE.md`.
- Automated physical-device E2E lifecycle harness: `scripts/mobile-lifecycle-e2e.cjs` (`npm run mobile:e2e:lifecycle`).
- Prior UI/UX plans and evidence: `.planning/quick/20260714-mobile-ui-ux-operational-refactor-v2/` and `.planning/quick/20260714-mobile-visual-refactor-e2e/`.
- Current branch at memory creation: `main`; always re-check branch/status before work.

## Reusable Lessons Learned: Soft Botanical & Field Dispatch

- **Mobile First over Web Thinking:** Loại bỏ triệt để modal hộp vuông thô cứng và form dữ liệu dày đặc. Thay thế bằng Smooth Spring Bottom Sheets (`BottomSheetModal`) vuốt kéo tự nhiên, lưới lịch chọn 2 đầu ngày (`DateRangePickerSheet`), và bộ chọn cây theo Cụm/Khu vực (`TreeScopeSelectorSheet`).
- **Backward Compatible Schema Extension:** Khi mở rộng từ hạn chót đơn lẻ (`deadline`) sang dải ngày (`dateRange`), client tự động suy diễn `deadline = endDate + 18:00:00` để đảm bảo backend Fastify và các client cũ không bị break.
- **FlatList Optimization:** Đảm bảo `removeClippedSubviews={Platform.OS === 'android'}`, `maxToRenderPerBatch={10}`, `windowSize={5}`, `initialNumToRender={8}` cho các màn hình danh sách dài để duy trì 60fps mượt mà khi thao tác bằng 1 tay ngoài trời.
- **Anti-AI Aesthetic & Synchronous Vietnamese:** Tuyệt đối không nhúng emoji (`☀️`, `⛅`, `🕒`, `📅`...) vào nút bấm, chip lựa chọn hay văn bản nghiệp vụ. Dùng vector icon ngữ nghĩa (Ionicons) kết hợp token thiết kế chuẩn (`@novyx/ui`), phông chữ hệ thống chỉ dùng trọng số `400`, `500`, `600`, ngôn ngữ tác nghiệp Tiếng Việt chuẩn hóa toàn hệ thống (không dùng từ nửa vời như Before/After).

## Memory update policy

Update this file only for stable facts:

- a changed architecture owner or path;
- a user-approved locked UX decision;
- a verified reusable performance/accessibility lesson;
- a new authoritative plan/evidence pointer.

Do not store secrets, credentials, raw chat history, transient failures, or duplicated plan checklists here.
