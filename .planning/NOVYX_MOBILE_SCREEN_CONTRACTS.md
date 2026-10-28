# NOVYX Mobile Screen Contracts

Status: approved
Owner: Mobile UI information architecture and screen contracts
Normative after approval: yes
Implementation status: contract authority; screen visual migration proceeds by approved wave

## 1. Purpose and authority

This document defines screen-level information architecture for the NOVYX GreenOps Expo mobile application. It translates functional requirements, non-functional requirements, `docs/MOBILE_UI_RULES.md`, and root `DESIGN.md` into implementation-ready contracts.

Authority order:

1. Functional/domain/security contracts.
2. `docs/MOBILE_UI_RULES.md`.
3. Root `DESIGN.md`.
4. This document for screen composition and state behavior.
5. Historical planning artifacts as evidence only.

When this document conflicts with a higher authority, the higher authority wins and this document must be corrected before implementation.

## 2. Product design read

NOVYX GreenOps is a trust-first field-operations application used outdoors, one-handed, under interruption and unreliable connectivity. Staff need a clear next valid action and reliable evidence preservation. Managers need exception-first monitoring and evidence-led decisions.

Active dials:

- Design variance: 4/10.
- Motion intensity: 2/10.
- Visual density: 6/10.
- Typography: React Native system font, weights 400/500/600; body 14–16px and supporting metadata at least 13px outside compact bottom navigation.
- Primary action: one contextual Emerald action using a 16px rounded rectangle, not a full oval by default.

## 3. Universal screen contract

Every screen or focused workflow step must define:

- user and job-to-be-done;
- entry and exit conditions;
- information priority;
- one primary action for the current state;
- secondary and destructive actions;
- loading, empty, error, offline/cache, retry and success states when applicable;
- accessibility and Back behavior;
- NFR constraints;
- objective acceptance evidence.

### 3.1 Information layers

Render information in this order:

1. **Orientation:** where the user is; task/tree/account identity.
2. **Decision:** current operational state, risk, proof gap, or next action.
3. **Supporting evidence:** facts required to complete or trust that decision.
4. **Metadata:** IDs, timestamps, transport/debug and audit detail.

Layers 3–4 use lower visual emphasis and progressive disclosure. Do not render all DTO fields merely because they exist.

### 3.2 Action hierarchy

- One visually dominant primary action per context.
- Secondary actions use outline/ghost treatment.
- Destructive actions remain visually distinct and separated from primary progression.
- Duplicate CTA intent is prohibited.
- Disabled actions explain their prerequisite through nearby text or accessibility hints.

### 3.3 Surface hierarchy

Use, in order:

1. whitespace;
2. typography;
3. hairline divider;
4. subtle semantic tonal region;
5. contained surface only when real related work needs a boundary.

No decorative card nesting. Content surfaces have elevation 0. Floating navigation/FAB and true overlays may use elevation. Do not treat a contained surface or private style name as a mandatory implementation pattern.

### 3.4 Layout and interaction

- Screen horizontal padding: `layout.screenPadding` (16).
- Section gap: `layout.sectionGap` (16).
- Bottom-navigation clearance: `layout.bottomNavClearance` (104).
- Minimum touch target: `controlSize.minimumTouchTarget` (44).
- Primary field action height: `controlSize.field` (52).
- Growing tasks/trees/review queues use `FlatList` or `SectionList` with stable IDs.
- Long Vietnamese text expands vertically; no fixed-height text container or tiny-font escape hatch.
- Status always uses text/icon semantics, never color alone.
- Focused GPS/QR/photo/review workflows hide bottom navigation when needed.

### 3.5 Network-state grammar

| State | Contract |
|---|---|
| REST loading | Preserve stable layout; show specific loading copy or skeleton-shaped placeholder. |
| REST success | No source banner. Render authoritative data. |
| Authenticated cache | Show one compact stale/offline notice with cache timestamp and retry; keep cached content readable. |
| Error without cache | Show explicit error/empty state and retry; never substitute demo records. |
| Mutation pending sync | State that evidence is safely stored locally and not yet authoritative on the server. |
| Mutation failed | Preserve input/evidence; provide retry or recovery without false success. |

## 4. Shared shell contracts

### 4.1 Session Restore

**File owner:** `apps/mobile/src/screens/auth/AuthScreens.tsx`, `MobileApp.tsx`

- **User/job:** returning Staff or Manager waiting for secure local session resolution.
- **Entry:** app cold start or full reload before session readiness.
- **Exit:** authenticated role home, or Login when no valid session exists.
- **Priority:** orientation (NOVYX) → current operation (restoring session).
- **Primary action:** none; restoration is automatic.
- **States:** restoring, restore failure, signed out.
- **Must not show:** protected snapshot, demo data, role dashboard, camera/location prompt.
- **Accessibility:** announce restoration status; avoid indefinite unlabeled spinner.
- **Acceptance:** cold launch has no protected 401, no demo flash and no role-home flash before readiness.

### 4.2 Login

**File owner:** `apps/mobile/src/screens/auth/AuthScreens.tsx`

- **User/job:** establish an authenticated operational session.
- **Entry:** confirmed signed out, explicit logout, invalid/revoked session.
- **Exit:** role home after session and first protected snapshot are ready.
- **Information order:** NOVYX identity → concise operational value → credentials → contextual error → Login action.
- **Primary action:** `Đăng nhập`.
- **Secondary actions:** password visibility only; no speculative recovery flow.
- **Validation:** visible labels; email keyboard; field-adjacent missing-value feedback; server error near form.
- **States:** idle, submitting, invalid input, auth error, network error.
- **NFR:** keyboard avoidance, safe area, no layout jump, no credential logging.
- **Acceptance:** CTA remains reachable with keyboard open; long error copy wraps; no 700/900 legacy typography after migration.

### 4.3 Bottom navigation

**File owner:** `NotchedBottomNav.tsx`, `MobileApp.tsx`

- Preserve locked five-action role navigation and centered QR FAB.
- Active side item is green icon/text only.
- Labels stay one line and retain 44×44+ hit targets.
- FAB purpose is role-specific; it does not silently advance incompatible workflows.
- Focused detail/device/review steps hide the bar according to `MOBILE_UI_RULES.md`.

## 5. Staff screen contracts

### 5.1 Staff Home

**File owner:** `screens/staff/StaffHome.tsx`

- **Job:** understand shift state and start the next valid action.
- **Entry:** authenticated Staff home, refresh, or return from top-level navigation.
- **Exit:** next task/detail, Work, My Trees, Notifications, Account.
- **Information order:**
  1. Staff/shift orientation and network source.
  2. Next-action or standby decision.
  3. Maximum three grouped metrics.
  4. Secondary navigation.
- **Primary action:** next valid task action; when no assignment, `Kiểm tra việc` or one approved route—not competing equal CTAs.
- **Do not show:** decorative hero media, repeated zero-state cards, full task queue, technical metadata.
- **States:** loading, actionable, waiting review, completed shift, no assignment, cache, error.
- **Cognitive-load gate:** each state gets one summary surface; do not repeat “0 tasks/0 trees/no assignment” in multiple large panels.
- **Acceptance:** next action is visible in initial viewport; offline notice does not duplicate an error card unless retry detail is required.

### 5.2 Staff Work

**File owner:** `screens/staff/StaffWork.tsx`

- **Job:** find and open a task requiring attention.
- **Entry:** Work tab or Home task shortcut.
- **Exit:** Task Detail.
- **Information order:** title/open count → compact filters/result count → task rows.
- **Primary action:** open the selected task; no page-level CTA when list items are the action.
- **Task-row hierarchy:** status/rework → task and tree → deadline → proof progress → next-action hint.
- **States:** loading, no assignments, filtered empty with reset/change-filter guidance, cache, error.
- **NFR:** `FlatList`, stable key, no heavy row shadows, list preserves selected filter.
- **Acceptance:** a rework reason is visible without opening metadata; scrolling remains stable with large fixture volume.

### 5.3 Staff My Trees

**File owner:** `screens/staff/StaffTrees.tsx`

- **Job:** find an assigned tree and access its related active work or location.
- **Entry:** My Trees tab or Home shortcut.
- **Exit:** Task Detail, Map/GPS, care history detail when requested.
- **Information order:** assigned count → search/filter control group → tree rows.
- **Primary action:** active related task when one exists; otherwise no false action.
- **Tree-row hierarchy:** tree identity/location → risk/health → active task relationship → deferred care history.
- **States:** no assigned trees, filtered empty, care-history loading/error, cache/error.
- **NFR:** `FlatList`, search by canonical fields, history loaded on demand.
- **Acceptance:** no tree is inferred as assigned without a real task relationship.

### 5.4 Staff Task Detail

**File owner:** `screens/staff/StaffProofFlow.tsx` (`DETAIL`)

- **Job:** understand task context, proof gaps and the next valid lifecycle action.
- **Entry:** task row/tree relation/notification.
- **Exit:** Start, next proof step, report field issue, return to Work.
- **Information order:**
  1. task/tree identity and lifecycle status;
  2. rework/block reason when present;
  3. proof progress/gaps;
  4. compact checklist/metadata disclosure;
  5. primary action.
- **Primary action:** derived from `getTaskProofWorkflowState`; opening detail never starts the task.
- **Secondary:** map, field issue, Back.
- **Do not show:** five consecutive cards, duplicate task summaries, unrelated dashboard metrics.
- **States:** pending, in progress, blocked, rework, waiting review, completed, cancelled, unsupported profile.
- **Acceptance:** primary action and lifecycle state cannot diverge from domain helper.

### 5.5 Staff Map/GPS

**File owner:** `StaffProofFlow.tsx` (`MAP`, `GPS`)

- **Job:** locate the tree and capture trustworthy current-position evidence.
- **Entry:** active task map/check-in action.
- **Exit:** QR step after valid check-in, or Back preserving data.
- **Information order:** tree/task identity → permission/current-fix state → distance/accuracy/time/threshold → action.
- **Primary action:** `Lấy GPS`, then `Check-in và quét QR` only when current fix satisfies requirements.
- **Secondary:** open Settings/retry permission, Back.
- **States:** rationale, requesting, denied-retry, blocked-settings, locating, inaccurate/stale, outside threshold, verified, runtime error.
- **NFR:** current fix only; no background location; show timestamp and accuracy; action reachable without precision scrolling.
- **Acceptance:** initial seeded coordinates never count as captured GPS.

### 5.6 Staff Free QR Lookup

**File owner:** `StaffProofFlow.tsx` (`QR` without active task)

- **Job:** identify a tree without advancing proof.
- **Entry:** centered Staff QR FAB when not continuing active proof.
- **Exit:** tree facts, related task, Trees, Back.
- **Primary action:** scanning occurs through camera; retry is recovery, not a competing main CTA.
- **States:** camera rationale/denied/blocked, scanning, lookup loading, unknown QR, cache result, API error, matched result.
- **Must not show:** sample scan, mock payload, task-proof completion.
- **Acceptance:** result makes source limitations clear; no unrelated tree is chosen as fallback.

### 5.7 Staff Task QR Verification

**File owner:** `StaffProofFlow.tsx` (`QR` with active task)

- **Job:** verify the physical tree matches the task.
- **Entry:** task workflow after valid site position according to active CHANGE_PROOF sequence.
- **Exit:** Before Photo on match; remain on QR on mismatch; Back preserves GPS.
- **Information order:** expected tree identity → camera → mismatch/recovery state.
- **Primary action:** camera scan; no manual “success” control.
- **Secondary:** report damaged QR, Back.
- **States:** permission, scanning, match, mismatch showing scanned value, damaged QR, API/cache error.
- **Acceptance:** mismatch never advances; report-damaged does not mark QR verified.

### 5.8 Before/After Photo Capture

**File owner:** `StaffProofFlow.tsx` (`BEFORE`, `AFTER`)

- **Job:** capture and confirm real evidence for one stage.
- **Entry:** valid preceding proof step.
- **Exit:** Checklist after Before; Review after After; Back preserves prior evidence.
- **Information order:** stage/task identity → camera/permission → capture control → preview/retake/confirm → compact metadata.
- **Primary action:** `Chụp ảnh`, then `Dùng ảnh này` after preview.
- **Secondary:** `Chụp lại`, Back/settings.
- **States:** permission, camera ready, capture failure, preview, persisted-file failure.
- **Must not show:** mock image fallback or `mock://` URI.
- **Acceptance:** action is visible with camera preview; only one `CameraView` owner is mounted.

### 5.9 Checklist

**File owner:** `StaffProofFlow.tsx` (`CHECKLIST`)

- **Job:** confirm required work items without losing captured evidence.
- **Entry:** Before Photo confirmed.
- **Exit:** After Photo when required items are complete; Back to Before.
- **Information order:** task identity → completion summary → checklist rows → next action.
- **Primary action:** continue to After Photo.
- **States:** incomplete, complete, empty-policy error, rework-targeted checklist.
- **Accessibility:** each row announces checked state and full Vietnamese text.
- **Acceptance:** false values are never rewritten to true; long rows wrap.

### 5.10 Staff Proof Review

**File owner:** `StaffProofFlow.tsx` (`REVIEW`)

- **Job:** verify evidence completeness and submit safely.
- **Entry:** After Photo confirmed or rework resume.
- **Exit:** local pending-sync Success or first missing step.
- **Information order:** evidence gate → site verification → before/after → checklist → notes → low-priority transport metadata → submit.
- **Primary action:** `Gửi báo cáo nghiệm thu` when complete; otherwise `Hoàn thiện bằng chứng` routes to first gap.
- **Secondary:** edit notes, Back preserving proof.
- **States:** complete, missing evidence, submitting, pending sync, sync failure/conflict, unsupported profile.
- **NFR:** durable outbox; no false `WAITING_REVIEW` before server sync.
- **Acceptance:** primary action remains discoverable; metadata does not dominate evidence.

### 5.11 Staff Submission Success/Pending Sync

**File owner:** `StaffProofFlow.tsx` (`SUCCESS`)

- **Job:** understand whether evidence is stored locally or authoritative on server.
- **Primary action:** return to Work.
- **Copy:** distinguish `Đang chờ đồng bộ` from server-confirmed waiting review.
- **States:** local pending, synced, retryable failure.
- **Acceptance:** no false success language; local evidence remains preserved.

### 5.12 Staff Notifications

**File owner:** `StaffArea.tsx`

- **Job:** review device-local operational notices.
- **Information order:** explicit local/ephemeral limitation → all/unread filter → notice rows → mark read.
- **Primary action:** open related task when present; otherwise none.
- **States:** empty, unread, all read.
- **Acceptance:** copy never implies server synchronization or cross-device durability.

### 5.13 Staff Account

**File owner:** `StaffAccount.tsx`

- **Job:** confirm identity/session, access local notifications/diagnostics, and logout.
- **Information order:** deterministic identity avatar + authenticated email/role/status → relevant shortcuts → development diagnostics when enabled → logout.
- **Avatar contract:** use the same shared initials fallback as Manager; it must be stable, accessible, local and independent of network availability. Do not store a device-only photo as account truth.
- **Primary action:** no positive primary CTA; logout is destructive and separated.
- **Do not show:** hard-coded employee identity, decorative performance dashboard, remote avatar dependency without fallback.
- **States:** authenticated, diagnostics unavailable, logout in progress/error.
- **Acceptance:** identity matches session UUID/role; local notification limitation is visible where relevant.

## 6. Manager screen contracts

### 6.1 Manager Dashboard

**File owner:** `ManagerDashboard.tsx`

- **Job:** identify operational exceptions and choose the next management action.
- **Entry:** authenticated Manager home.
- **Exit:** Create, Review, Trees, QR, blocked-task resolution.
- **Information order:** network/scope orientation → exception summary → review priority → quick actions → secondary operational detail.
- **Primary action:** state-dependent: review backlog when present; otherwise Create Task. Do not render equally dominant Create and Review actions.
- **Metrics:** one grouped surface, maximum four decision-relevant values.
- **Priorities:** waiting review, blocked, overdue, risky trees; normal totals are secondary.
- **Remove/defer:** QR catalog, duplicate totals, decorative hero copy, repeated pulse cards.
- **States:** loading, normal, exception present, empty operation, cache, error.
- **Acceptance:** the first viewport answers “what needs management attention now?”

### 6.2 Manager Create Task

**File owner:** `ManagerCreateTask.tsx`

- **Job:** create one valid CHANGE_PROOF task using canonical catalogs.
- **Entry:** Create tab/dashboard shortcut.
- **Exit:** successful task detail/dashboard; Back preserving input unless explicitly discarded.
- **Progressive sections:**
  1. task purpose/title;
  2. localized deadline date and time using a bounded picker/preset interaction;
  3. target tree search/selection designed for many records;
  4. assignable Staff search/selection designed for many people;
  5. active supported task type shown with user-facing Vietnamese labels;
  6. concise policy/checklist preview only when it changes the Manager's decision;
  7. compact final summary and submit.
- **Selection semantics:** tree, Staff and task type are required single-select controls. Tapping another row changes the selection; the selected summary exposes an explicit `Thay đổi` action. Do not render these as tap-to-toggle controls or imply that tapping the selected row will deselect it.
- **User language:** never expose `CHANGE_PROOF`, English seed/test descriptions, Staff email as the primary display name, UUIDs, transport requirements or raw API errors. Stable error codes map to concise Vietnamese recovery copy.
- **Deadline:** collect both date and time, display in Vietnamese locale, preserve timezone intent and serialize canonical ISO at the service boundary. Manual `YYYY-MM-DD` entry is prohibited.
- **Primary action:** `Tạo việc`.
- **Secondary:** change selected item, Back.
- **States:** catalog loading, tree/staff/type empty, catalog error/retry, invalid deadline, submitting, API conflict/error, success.
- **Must not show/send:** local `STF-*`, display-name task type as ID, arbitrary client checklist, unsupported profile.
- **NFR:** selection summaries remain visible; catalogs support search/progressive disclosure and virtualized results; keyboard avoidance; representative multi-record fixtures are required for interaction acceptance.
- **Acceptance:** canonical request contains `taskTypeId`, real Staff UUID, ISO deadline with time, no checklist; multi-record selection is usable; visible copy is Vietnamese product language; errors are actionable and never raw server text.

### 6.3 Manager QR Lookup

**File owner:** `ManagerQrLookup.tsx`

- **Job:** identify a tree and inspect facts without advancing Staff proof.
- **Information order:** purpose → camera → lookup state → tree facts → related tasks/history.
- **Primary action:** scanning; retry is recovery.
- **States:** permission, scanning, lookup, unknown QR, result, cache, API error.
- **Must not show:** mock scanner/sample QR.
- **Acceptance:** physical iPhone Expo Go camera preview works; result is evidence-neutral.

### 6.4 Manager Review List

**File owner:** `ManagerReview.tsx`

- **Job:** find the most important waiting-review submission.
- **Entry:** Review tab/dashboard shortcut.
- **Exit:** Review Detail.
- **Information order:** waiting count/priority → search/filter → report rows.
- **Primary action:** open selected report.
- **Row hierarchy:** readable task title up to two lines → one-line tree context → footer with canonical assignee identity at left and compact proof status at right (`Đủ 5/5` / `Thiếu n`) → concise age from the authoritative latest task update (`Vừa gửi`, minutes, hours or date). Status must not share the title's horizontal budget or occupy a floating row. At increased font scale, footer content may reflow without overlap; title and recovery semantics remain visible.
- **States:** loading, empty, filtered empty, cache, error.
- **NFR:** `FlatList`, stable keys, preserve query.
- **Acceptance:** incomplete/risky submissions are distinguishable without color alone.

### 6.5 Manager Review Detail

**File owner:** `ManagerReview.tsx` (`REVIEW_DETAIL`)

- **Job:** make one evidence-based canonical review decision.
- **Entry:** waiting-review task selected.
- **Exit:** APPROVE, REQUEST_REWORK, APPROVE_WITH_EXCEPTION, CANCEL, or Back.
- **Information order:**
  1. task/tree/staff identity and evidence gate;
  2. GPS/QR verification summary;
  3. photo evidence;
  4. checklist and notes;
  5. metadata/history disclosure;
  6. decision controls.
- **Primary action:** selected canonical decision; Approve is primary only when proof gate permits.
- **Progressive decisions:** rework fields appear after REQUEST_REWORK; exception reason after APPROVE_WITH_EXCEPTION; cancel reason after CANCEL.
- **States:** complete, gaps, submitting, OCC conflict, API error, success.
- **Must support:** all four canonical outcomes when backend/mobile wiring reaches B5/B5.5; current UI must not falsely imply unsupported decisions are complete.
- **Acceptance:** no approve when gaps remain; reason is mandatory where required; action bar remains reachable with keyboard.

### 6.6 Manager Trees

**File owner:** `ManagerTrees.tsx`

- **Job:** find and inspect managed trees, or start a focused on-site onboarding flow for a new tree.
- **Information order:** directory count → create-tree entry or search/filter → tree rows → on-demand history/related work. Inside onboarding: permission rationale → current GPS fix → suggested/editable location → species/name/age/health confirmation → submit.
- **Primary action:** directory inspection by default; `Tạo hồ sơ cây` becomes the sole primary action only while the progressive onboarding section is open.
- **States:** loading, no trees, filtered empty, history loading/error, cache/error, permission rationale/denied/blocked/granted, locating, GPS success/error, validation, submitting and create success/error.
- **NFR:** `FlatList`; canonical tree scope only; no mock illustration; reverse-geocoded address is an editable suggestion; no silent health/age defaults; IDs and QR identity are generated outside presentation.
- **Acceptance:** bottom-nav clearance is preserved; rows remain scan-friendly at scale; permission state is explicit even when the OS does not show a prompt again; GPS success shows accuracy/time; missing values receive field-level feedback only after submit intent.

### 6.7 Manager Account

**File owner:** `ManagerAccount.tsx`

- **Job:** confirm authenticated identity/scope, access Review/diagnostics, and logout.
- **Information order:** session identity avatar/email/role/status → pending-review shortcut → development diagnostics → logout.
- **Avatar contract:** render a deterministic local initials avatar from the authenticated email when no canonical profile-photo field exists. Do not invent a remote image URL, upload endpoint or local-only photo that cannot follow the account across devices. A future photo avatar requires an optional canonical `avatarUrl`/storage lifecycle in IAM contracts, authenticated mutation, size/type validation, deletion/replacement semantics and cache/privacy rules.
- **Do not show:** hard-coded Manager identity/scope, duplicate dashboard metrics, fake notifications.
- **Primary action:** review shortcut only when backlog exists; logout is destructive and separated.
- **States:** authenticated, no backlog, diagnostics unavailable, logout progress/error.
- **Acceptance:** displayed identity and scope come from authoritative session/catalog data when available.

## 7. Development diagnostics contract

**Owner:** B6; account screens or one shared development-only surface.

Show only in development:

- sanitized API origin;
- source `REST/cache/error` and cache timestamp;
- session state, non-sensitive user ID and role;
- available Expo/app/build/update metadata;
- last request method/path/status/request ID where available.

Never show token, SecureStore content, auth headers or sensitive payloads.

## 8. Cross-screen copy contract

- Direct Vietnamese operational language; no marketing slogans or vague “Có lỗi xảy ra”.
- Apply progressive copy disclosure: the initial viewport states the decision, current status and recovery action only. Explanations that merely restate a heading, field label, icon or obvious prerequisite are removed or moved behind the relevant focused state.
- Default visible copy budgets are one line for labels/statuses and at most two short lines for supporting copy on compact Android. Content may wrap for accessibility, but the product copy itself must first be edited for information value rather than relying on truncation.
- Use `subject + state/action` wording. Avoid duplicated constructions such as a heading saying “Bằng chứng” followed by a notice saying “Bằng chứng đủ điều kiện duyệt” and a body restating the same count.
- Icon containers on warm/white content surfaces use the shared semantic `iconSurface` + `iconBorder` treatment. Do not use white, near-white or screen-background icon tiles that visually disappear into the page.
- Success copy states exactly what is local versus server-authoritative.
- Buttons use short verb-first labels.
- Metadata uses sentence case and lower emphasis.
- Notifications are described as local/ephemeral until server capability exists.
- Unsupported SERVICE_PROOF/INSPECTION_PROOF copy states that mobile execution is not yet supported and provides a safe return path.

## 9. Functional and NFR traceability

| Requirement | UI consequence |
|---|---|
| Account identity at production scale | Shared deterministic avatar fallback uses session identity, remains stable across reloads, has an accessible label and does not require one network request per list/account render. A photo avatar is not added until IAM owns a canonical optional field and lifecycle. |
| Grouped validation composition | Grouping owns shared geometry only. Each selector owns its touched/invalid state and warning fill, so untouched siblings remain neutral. Full-width hairline dividers prevent visual gaps without propagating validation state across rows. |
| Catalog growth | Tree/staff/task-type selectors remain virtualized/searchable; validation styling must not alter row height unpredictably or assume three fixed records. |
| Validation lifecycle | Required feedback appears after dismiss/submit intent, clears when selection becomes valid and remains adjacent to the owning row. |
| Semantic-state theming | Warning/error surfaces use global semantic tokens with text/icon meaning and sufficient contrast; screens do not invent stronger local fills. |
| Authenticated Staff actor scoping | Staff tasks use session identity; no literal Staff ID. |
| Real REST authority | No demo record fallback or mock mutation. |
| Authenticated cache | Explicit stale state keyed by user; no cross-user display. |
| Interrupted field workflow | Back preserves proof/input; retake clears only selected evidence. |
| Durable evidence outbox | Pending-sync state is distinct from server waiting review. |
| Unreliable network | Cache/error/retry states are first-class and non-destructive. |
| Compact device and long Vietnamese copy | Vertical reflow, 16px screen padding, no clipped fixed-height text. |
| Outdoor readability | High contrast, restrained surfaces, no decorative shadow dependence. |
| Growing collections | Virtualized lists with stable keys. |
| Accessibility | 44×44 targets, labels/state, icon+text status, predictable Back. |
| Current proof support | Catalog and execution permit CHANGE_PROOF only. |
| Local notifications | UI does not promise durability or server synchronization. |

## 10. Implementation order and rollback boundaries

B5.5 convergence must implement one family at a time:

1. Shared shell/primitives.
2. Staff Home/Work/Trees.
3. Staff Detail and proof steps.
4. Manager Dashboard/Trees/Review List.
5. Manager Create/Review Detail/Account.
6. Legacy style/token cleanup.

Each family must pass typecheck, lint, focused tests and runtime visual review before the next family starts. Do not mass-replace typography, colors, radii or spacing across the repository.

## 11. Visual acceptance matrix

Required physical iPhone + Expo Go evidence:

- session restore and Login keyboard/error;
- Staff Home actionable and no-assignment states;
- Work populated, empty and filtered-empty;
- Trees assigned and empty;
- Task Detail lifecycle variants;
- GPS permission/verified/outside-threshold;
- QR permission/mismatch/result;
- Before/After camera and preview;
- Checklist incomplete/complete;
- Review missing/complete/pending-sync;
- Manager Dashboard normal/exception/cache/error;
- Create Task catalog loading/error/valid preview;
- Manager QR scanner/result/unknown;
- Review list empty/populated;
- Review Detail gaps/rework/approve/loading;
- Accounts and development diagnostics.

Required compact Android evidence:

- 360–393dp width;
- increased font scale;
- long Vietnamese text;
- keyboard avoidance;
- bottom-nav and safe-area clearance;
- list scrolling with representative volume.

Objective gates:

- one primary action per context;
- no decorative card nesting;
- no foundational screen-local colors/type/radii;
- no clipped text or horizontal page overflow;
- no action hidden below unrelated long content;
- no status communicated only by color;
- no runtime mock/demo asset or wording;
- no visual PASS without full-size runtime review.

## 12. Implementation checklist template

Before touching a screen in B4/B5/B5.5, copy this checklist into the batch notes:

- [ ] Job-to-be-done and entry/exit confirmed.
- [ ] Domain/state owner and service boundary traced.
- [ ] Information layers 1–4 identified.
- [ ] One primary action identified for each state.
- [ ] Loading/empty/error/cache/retry/success states defined.
- [ ] Back/input/evidence preservation defined.
- [ ] Tokens/primitives reused; no new foundational value.
- [ ] Growing collection uses virtualized list.
- [ ] Accessibility labels/state/touch targets defined.
- [ ] iPhone and compact Android acceptance evidence listed.
