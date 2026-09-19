# Mobile UI Rules

These rules govern NOVYX GreenOps mobile UI work in `apps/mobile`.

## Skill Routing

- Use GSD Core as the workflow guardrail for non-trivial UI slices, but keep execution artifacts outside product code unless the task explicitly owns them.
- Use Taste Skill as a quality filter, not as a native-mobile library. Its web and landing-page rules translate here into: no generic template UI, no AI-purple gradients, consistent tokens, readable copy, designed loading/empty/error states, and a final visual self-audit.
- Use shadcn as a composition model only for mobile. Do not install or copy shadcn/ui, Radix, or Tailwind into the Expo native app. Map shadcn concepts to owned React Native primitives in `apps/mobile/src/components/AppPrimitives.tsx`, such as `Card`, `Button`, `Badge`, `Field`, `SectionTitle`, and `EmptyState`.
- This refactor adds no test framework, package install, new native dependency, new environment variable, new API endpoint, or copied contract type.

## Architecture Rules

- `apps/mobile` owns Expo screens, navigation state, device permissions, and mobile-only presentation.
- `packages/ui` owns shared design tokens. New product colors, spacing, and radius values start there.
- `packages/contracts` owns API envelopes, error codes, and DTOs. Do not copy API response types into mobile screens.
- `packages/config` owns environment validation. Add new public runtime variables there before reading them in the app.
- API calls stay behind `apps/mobile/src/services/greenOpsService.ts`; screens pass through service callbacks instead of calling `fetch` directly.
- Do not import from `external/hermes-agent` internals.

## Visual Rules

- Use shared tokens for foundational colors, radius, and spacing. Avoid ad hoc hex values except for one-off platform surfaces or map/camera overlays.
- Keep the NOVYX botanical palette: forest green primary, honeydew/cornsilk/willow surfaces, emerald accents, mineral neutrals, restrained amber/danger/sky statuses.
- Keep copy direct and field-ready. Vietnamese labels must fit compact Android screens without awkward wrapping.
- Minimum practical tap target is 44x44, with primary field actions closer to 48 or 52 high.
- Every network/device workflow must include loading, denied permission, empty, and error states.
- Cards should group real work surfaces. Avoid nesting cards inside cards for decoration.
- Screens must stay usable in compact Android viewports and with long Vietnamese strings.

## Locked Bottom Navigation

The current notched five-action bottom navigation is locked for both roles.

- Staff actions: `Trang chủ`, `Cây của tôi`, centered QR FAB, `Công việc`, `Tài khoản`.
- Manager actions: `Tổng quan`, `Giao việc`, centered QR FAB, `Duyệt`, `Tài khoản`.
- The QR FAB remains centered over the notch. Staff QR either continues the next active proof step or opens free tree lookup; Manager QR opens fast tree lookup only.
- Active side navigation uses green icon and green text only. Do not restore an active pill, top line, filled square, or background shell.
- Inactive side navigation uses muted icon/text. The FAB has no text label.
- Detail, evidence, camera, and review-detail workflows may hide the bottom navigation when focused full-height content is required.
- Nav labels must remain one line on compact Android; use `numberOfLines={1}` and `adjustsFontSizeToFit` where labels are rendered.

## Contextual Permissions

There is no post-login Permission screen. Login and restored sessions enter the Staff or Manager home screen without requesting camera or GPS.

- Request foreground location only when the user first invokes a GPS function such as `Lấy GPS` or check-in.
- Request camera only when the user first opens a real QR scanner or a real photo capture action.
- Read permission truth from Expo permission responses, not UI-only booleans. The implemented states come from `status`, `granted`, and `canAskAgain`.
- Expo SDK 57 permission status values are `granted`, `denied`, and `undetermined`; the UI maps them to `granted`, `denied-retry`, `blocked-settings`, and `not-determined`.
- `denied` with `canAskAgain=true` must offer retry (`Thử cấp quyền lại`).
- `denied` with `canAskAgain=false` is blocked and must offer Android Settings recovery with `Mở cài đặt`.
- `not-determined` must show an in-context rationale before the native prompt. It is not an app-level gate.
- Do not request background location, microphone, notification permission, or any new device capability for this refactor.

## QR, GPS, Camera, And Map Rules

- Real QR scanning uses Expo SDK 57 `expo-camera` with `CameraView`, `onBarcodeScanned`, and `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}`.
- The app config already contains `expo-camera` with Vietnamese camera text, `recordAudioAndroid: false`, and `barcodeScannerEnabled: true`; this docs wave does not require native config changes.
- Only one active `CameraView` owner is allowed. `apps/mobile/src/components/DeviceCameraView.tsx` is the preview owner, and it renders only when permission is `granted`, the focused purpose matches `activeCameraPurpose`, and the camera module is available.
- Photo capture must not play a custom app sound or load an audio asset. `takePictureAsync` stays native so Android controls any shutter feedback through the device camera/system volume and mute policy.
- Camera purposes are Staff free QR, Staff task QR, Staff before photo, Staff after photo, and Manager QR lookup.
- QR scan results must be validated against tree/task identifiers before advancing workflow. Invalid QR needs a visible recovery path.
- GPS verification uses Expo SDK 57 `expo-location` foreground permission and `getCurrentPositionAsync` for a current location fix. The UI must show distance to tree, timestamp, accuracy, and the 10m threshold.
- `react-native-maps` is the current map implementation. Keep native map key handling out of `EXPO_PUBLIC_` variables.

## Staff Proof Execution Rules

Staff task execution follows profile-driven proof rendering determined by `ProofProfile` (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`) and canonical lifecycle states:

- **Explicit Start:** Opening task details does NOT transition status; only the explicit `StartTask` action transitions `PENDING` $\to$ `IN_PROGRESS`.
- **Site Verification:** GPS ($\le 10$m target distance) and Tree QR verification are independent signals and may be completed in any order. Neither changes the Task lifecycle state.
- **Profile-Driven Requirements:**
  - `CHANGE_PROOF`: Site Verification + Before Photo + Checklist + After Photo.
  - `SERVICE_PROOF`: Site Verification + Checklist + Completion Photo.
  - `INSPECTION_PROOF`: Site Verification + Structured Findings + Condition Photos.
- **Review & Submission:** Once profile evidence is complete, Staff reviews and submits. Local submission sets `LocalSubmissionStatus = PENDING_SYNC`; server authoritative status transitions to `WAITING_REVIEW` upon sync.
- **Data Preservation:** Back navigation inside an active task must preserve completed proof fields.
- **Targeted Rework:** Tasks in `REWORK_REQUIRED` display the Manager's reject reason and focus on the affected proof area; previously valid evidence is retained.
- **Field Issue:** Tasks blocked by on-site impediments enter `BLOCKED` via `ReportFieldIssue` and can be resumed, reassigned, or cancelled.

## Manager Evidence & Review Rules

- Manager Dashboard prioritizes review backlog, operational pulse, quick actions, risky trees, QR issues, overdue work, and QR demo payloads.
- Manager Create Task is guided: tree, assignee, task type, checklist, deadline validation, and preview before `Tạo việc`. TaskType determines the required ProofProfile by system policy.
- Manager QR lookup is evidence-neutral: it opens tree facts, location/care history, and related tasks; it does not advance Staff proof.
- Manager Review supports the 4 canonical outcomes at `WAITING_REVIEW`:
  1. `Phê duyệt` (`APPROVE` $\to$ `COMPLETED`, creates CareHistory).
  2. `Yêu cầu làm lại` (`REQUEST_REWORK` $\to$ `REWORK_REQUIRED`, requires targeted reason/area).
  3. `Duyệt có ngoại lệ` (`APPROVE_WITH_EXCEPTION` $\to$ `COMPLETED`, records exception audit marker in CareHistory).
  4. `Hủy bỏ` (`CANCEL` $\to$ `CANCELLED`, requires reason, preserves history, no CareHistory created).

## Environment Variables

Already expected:

- `EXPO_PUBLIC_APP_ENV`: public Expo environment, one of `development`, `staging`, or `production`.
- `EXPO_PUBLIC_API_BASE_URL`: public base URL for the `/v1` API or local dev API.
- `GOOGLE_MAPS_API_KEY`: native Android map key for `react-native-maps` builds. Do not prefix with `EXPO_PUBLIC_`.

This refactor introduces no new environment variables. Tell the user before adding or requiring:

- Any map provider key beyond `GOOGLE_MAPS_API_KEY`.
- Any auth provider domain/client ID.
- Any image/object storage public base URL.
- Any backend-only secret. Backend secrets must stay out of Expo public variables.

QR and GPS do not require API keys by themselves. Tree lookup after scanning uses existing `greenOpsService` paths and `EXPO_PUBLIC_API_BASE_URL` when the API is reachable.

## Required Checks

- For docs/rule-only changes: run `npm run format:check`.
- For mobile UI changes: run `npm run typecheck --workspace @novyx/mobile`, then `npm run lint`.
- For foundation-level or dependency/config changes: run `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run mobile:export:android`.
