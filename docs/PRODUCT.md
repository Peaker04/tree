# Product

## Project

- Name: NOVYX GreenOps
- Users: field staff, operation managers, and future admin operators
- Problem: verify urban tree maintenance work with GPS, QR, photos, checklist evidence, and manager approval
- Core value: trustworthy field-work verification with mobile-first workflows

## MVP Scope

- Android Expo mobile app
- Staff task execution flow
- Manager task creation and evidence approval flow
- Contextual GPS/camera permissions at first use of the relevant function
- Shared API contracts and environment conventions
- Foundation for future backend API
- Hermes Agent available as an external automation/agent runtime reference

## Staff Experience

Staff work is structured as an operational field workflow, not a generic task list.

- Home is an overview and next-action surface with NOVYX header, daily summary, progress metrics, and a card that sends the worker to `Công việc` or `Cây của tôi`.
- My Trees is the assigned-tree workspace. Staff can search/filter assigned trees, inspect status, location, QR, current task, and care history, then open task detail or map/check-in when work exists.
- Work is the task queue. It shows open count, status filters, priority/rework signals through task cards, proof count, and one next action per task.
- Rework tasks show the Manager reason before Staff continues.

The Staff proof sequence is:

1. Task context and current proof gaps.
2. GPS check-in with `Lấy GPS`, distance, timestamp, accuracy, and 10m threshold.
3. QR scan matched to the active tree/task.
4. Before photo capture and preview.
5. Checklist completion.
6. After photo capture and preview.
7. Review with proof gate, proof chain, evidence transport, before/after pair, checklist, and notes.
8. Submit evidence, success state, and return to Work.

If proof is incomplete, the submit action becomes `Hoàn thiện bằng chứng` and routes to the first missing step. Wrong QR stays recoverable with rescan/report paths. Damaged QR creates an operational notification and does not silently pass review.

## Manager Experience

Manager work is evidence-first and has parity with Staff depth.

- Dashboard prioritizes review backlog, operational pulse, workload, risky trees, QR issues, overdue/open work, quick actions, and QR demo payloads.
- Create Task is a guided form with tree selection, assignee, work type, checklist preview, deadline validation, and a draft summary before `Tạo việc`.
- QR lookup is a fast tree lookup. It shows camera permission state if needed, scanner/mock scanner, loading while resolving, tree facts, location/care history, related tasks, and unknown-QR recovery.
- Review starts with pending reports and search, then opens an evidence-first detail page.

Manager review detail shows proof gate, GPS distance/timestamp/threshold, QR match, proof chain, before/after comparison, checklist, notes, and metadata before approve/rework actions. `Phê duyệt` is disabled while proof gaps remain. `Từ chối` requires a concrete reason from a chip or free text; the reason becomes the visible Staff recovery path.

## Permission Product Contract

There is no post-login Permission screen. Fresh login and restored sessions enter the correct role home without requesting GPS or camera.

- GPS is requested only from GPS/check-in actions.
- Camera is requested only from real QR scanner or photo capture actions.
- Permission states use actual Expo response fields: `status`, `granted`, and `canAskAgain`.
- `not-determined` shows a point-of-use rationale before the native prompt.
- `denied` with `canAskAgain=true` offers retry.
- `denied` with `canAskAgain=false` offers `Mở cài đặt`.
- Only one focused `CameraView` can own the camera preview at a time.

## Runtime And Scope Contract

This refactor does not introduce new environment variables, packages, native capabilities, backend endpoints, or manual copies of API contracts. The existing mobile runtime uses `expo-camera`, `expo-location`, `react-native-maps`, `@novyx/contracts`, `@novyx/config`, `@novyx/ui`, and the `greenOpsService` service boundary.

## Non-goals

- Production backend implementation in this foundation slice
- Real authentication provider
- Production database schema
- Store release automation
- Background location, microphone, notifications, or geofencing
- New navigation framework
- Direct modification of upstream Hermes Agent internals
