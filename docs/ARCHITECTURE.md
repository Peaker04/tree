# Architecture

## Overview

```text
apps/mobile
  |
  | REST /v1 contracts from packages/contracts
  v
apps/api (planned/local dev API)
  |
  +-- database (planned)
  +-- object storage (planned)
  +-- background jobs (planned)
  +-- Hermes Agent integration boundary
```

## Repository Strategy

This repository is an npm workspace monorepo:

- `apps/mobile`: Expo SDK 57 mobile application.
- `apps/api`: reserved for the backend API.
- `packages/contracts`: shared API contracts, error registry, and cross-app DTOs.
- `packages/config`: environment validation.
- `packages/ui`: shared design tokens.
- `external/hermes-agent`: git submodule pinned to upstream.

## Module Boundaries

- Mobile imports shared package public APIs only.
- Backend must not return raw database entities as API responses.
- Contracts must not import mobile, backend, ORM, or Hermes implementation code.
- `external/hermes-agent` is treated as an external tool/runtime, not a shared library for deep imports.
- This mobile UI/UX refactor does not add environment variables, backend endpoints, native capabilities, package installs, or copied contract types.

## Mobile Ownership

`apps/mobile` owns the operational UI, device permissions, role routing, and screen composition.

- `apps/mobile/src/screens/MobileApp.tsx` owns auth/session restore routing, role selection, bottom-nav visibility, and `greenOpsService` callback wiring.
- `apps/mobile/src/screens/staff/*` owns Staff Home, My Trees, Work, Account, notifications, and the proof sequence.
- `apps/mobile/src/screens/manager/*` owns Manager Dashboard, Create Task, QR lookup, Review, Trees, and Account.
- `apps/mobile/src/components/AppPrimitives.tsx` owns React Native primitives used in place of shadcn/Radix/Tailwind.
- `apps/mobile/src/components/NotchedBottomNav.tsx` owns the locked notched five-action navigation and centered QR FAB for both roles.
- `apps/mobile/src/theme/tokens.ts` re-exports shared tokens from `packages/ui`.

## Device Permission Architecture

Device permission behavior is contextual and source-of-truth based.

- `apps/mobile/src/services/devicePermissions.ts` wraps Expo SDK 57 camera/location permission APIs, maps permission responses, and exposes `openDeviceSettings()`.
- `apps/mobile/src/hooks/useDevicePermissions.ts` stores camera/location permission responses, active camera purpose, runtime-unavailable messages, and request/refresh callbacks.
- `apps/mobile/src/components/DevicePermissionState.tsx` renders rationale, `not-determined`, `denied-retry`, `blocked-settings`, `granted`, checking, and runtime-unavailable states.
- `apps/mobile/src/components/DeviceCameraView.tsx` is the one active `CameraView` owner. It renders the native preview only when permission is `granted`, the focused purpose owns the camera, and `expo-camera` is available.
- `Linking.openSettings()` is the blocked recovery path behind the `Mở cài đặt` action.

The app has no post-login Permission gate. `type Screen = 'Login' | 'Forgot' | 'Main'` in `MobileApp.tsx`; login and restored sessions route directly to the role home.

## Role Navigation

Both roles use the same `NotchedBottomNav` primitive.

- Staff left actions are `Trang chủ` and `Cây của tôi`; right actions are `Công việc` and `Tài khoản`; the centered QR FAB resumes next proof or opens free QR lookup.
- Manager left actions are `Tổng quan` and `Giao việc`; right actions are `Duyệt` and `Tài khoản`; the centered QR FAB opens Manager QR lookup.
- Active side-nav state is green icon/text only. The implementation does not use an active pill, top line, or filled square.
- Staff nav hides during focused proof/detail workflows; Manager nav hides for review detail and QR lookup.

## Staff Workflow Ownership

- `StaffHome.tsx`: overview, metrics, progress, and next-action card.
- `StaffTrees.tsx`: assigned-tree workspace with search/filter, QR, current task, and care history entry points.
- `StaffWork.tsx`: task queue with filters, rework markers through `TaskCard`, and open-task count.
- `StaffProofFlow.tsx`: GPS, QR, before photo, checklist, after photo, review, submit, success, wrong QR, damaged QR, loading, and permission recovery states.

The proof sequence is task context -> GPS -> QR -> before photo -> checklist -> after photo -> review -> submit. Progress is stored on the active task as GPS/QR/photo/checklist evidence before submission.

## Manager Workflow Ownership

- `ManagerDashboard.tsx`: dashboard metrics, operational pulse, review queue, exceptions, risky trees, and QR demo payloads.
- `ManagerCreateTask.tsx`: guided task creation with tree, assignee, task type, deadline, checklist preview, and field validation.
- `ManagerQrLookup.tsx`: camera/mock QR lookup that resolves tree facts, care history, and related tasks without advancing Staff proof.
- `ManagerReview.tsx`: evidence-first review list/detail, proof gate, GPS/QR audit, proof chain, before/after photo comparison, checklist, metadata, approve, and rework.
- `ManagerTrees.tsx`: searchable tree inventory and care-history entry points.

Manager rework requires a concrete reason before request; approve is disabled while proof gaps remain.

## API And Contract Boundary

`apps/mobile/src/services/greenOpsService.ts` is the mobile API boundary.

- It reads `EXPO_PUBLIC_APP_ENV` and `EXPO_PUBLIC_API_BASE_URL` through `@novyx/config`.
- It imports DTOs and requests from `@novyx/contracts`.
- It owns REST calls, fallback behavior, task progress mutation, evidence submission, review decisions, notifications, login, and session restore.
- Screen components receive typed callbacks and do not copy contracts or call `fetch` directly.
- Evidence submission uses multipart only when local file URIs are present; otherwise it sends metadata JSON.
- Offline/API failure falls back to the local snapshot while preserving field workflow continuity.

## Planned Backend Baseline

- REST API under `/v1`.
- Request ID on every response.
- Standard success envelope: `{ "data": ... }`.
- Standard error envelope: `{ "error": { "code", "message", "details", "requestId" } }`.
- Health and readiness endpoints.
- Structured logging and safe error handling.
