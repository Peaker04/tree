# Camera Check-in Anti-Flicker, Role Proof Chain & Task Filter Ergonomics Design

**Date:** 2026-10-28  
**Author:** PI Agent & Mobile Field Lead  
**Scope:** Camera mounting flicker elimination, vibration timing smoothing, role-tailored proof chain & exception display, structured note separation, and role-adapted task filters for Staff & Supervisor.

---

## 1. Problem Statement & Root Cause Synthesis

### 1.1 Camera Viewfinder Mounting Flicker (Bug A)
- **Problem**: When a Supervisor or Staff taps "Check-in" on the GPS map, a permission notice card flashes on screen for 100-200ms, followed by a harsh 3-pulse vibration, before the camera preview mounts.
- **Root Cause**: In `DeviceCameraView.tsx`, `canRenderPreview` requires `activeCameraPurpose === purpose`. When step changes to `BEFORE`, `purpose` updates immediately but `activeCameraPurpose` remains `null` until the asynchronous `requestCameraForPurpose` effect executes. Even when `permissionState === 'granted'`, `DeviceCameraView` prematurely renders `<DevicePermissionState>`, which unmounts a fraction of a second later, creating a jarring flash.
- **Solution**: In `DeviceCameraView.tsx`, if `permissionState === 'granted'`, never render `<DevicePermissionState>`. Render a clean, dark viewfinder container (`backgroundColor: colors.ink`) while `activeCameraPurpose` syncs, eliminating the flash.
- **Vibration**: Change check-in tactile feedback to a subtle single-pulse `light` tap (10-12ms) instead of heavy `warning` multi-pulse vibration (`[0, 50, 50, 50]`).

### 1.2 Role-Misaligned Evidence Chain & False Contradictions (Bug B)
- **Problem**: On the Supervisor Review screen, the top gate banner says *"Vị trí Giám sát và ảnh Trước/Sau hợp lệ (tích xanh)"*, but the `ProofChainCard` item below says *"Vị trí GPS Giám sát: Chưa xác minh vị trí giám sát hiện trường (vòng tròn rỗng)"*. Additionally, raw technical emails like `NV staff@novyx.local` appear in user-facing labels.
- **Root Cause**:
  1. In `TaskSurfaces.tsx` (`ProofChainCard`), `sup-gps` only checked `task.supervisorGpsCheck?.verified`. It completely ignored `hasLocationEx` / `locationException`. When an exception was reported, `verified` was `false`, causing the proof item to show an unverified empty circle `(o)`.
  2. `ProofChainCard` concatenated raw `task.assignedStaffName` directly without calling `formatActorDisplayName()`.
- **Solution**:
  1. In `ProofChainCard`, check `hasLocationEx`. If an exception exists, mark item `done: true`, display label *"Ngoại lệ vị trí: [Lý do ngoại lệ]"* with green checkmark.
  2. Filter `assignedStaffName` through `formatActorDisplayName()`.

### 1.3 Fragile Note String Parsing & Narration Copy (Bug C)
- **Problem**: In `MobileApp.tsx`, GPS exception reasons are extracted via `.split('Ngoại lệ GPS:')[1]`, falling back to a hardcoded string *"Tán cây rậm rạp làm trôi tín hiệu GPS"*, ignoring custom notes and supervisor notes. Long-winded explanatory sentences clutter the UI.
- **Root Cause**: Absence of structured exception extraction and conflation of Staff notes with Supervisor notes.
- **Solution**:
  1. Extract reason from structured `task.locationException?.reason` or `task.supervisorLocationException?.reason`, before checking note strings.
  2. On Supervisor Review screen: Show Staff's field notes as a read-only card, and Supervisor's notes in a distinct editable field.
  3. Purge verbose narration copy into concise 1-line state badges.

### 1.4 Cluttered & Role-Blind Task Filters (Bug D)
- **Problem**: Both Staff and Supervisor share a generic list of 8 filter chips (`Việc mở`, `Tất cả`, `Quá hạn`, `Chờ bắt đầu`, `Đang làm`, `Chờ duyệt`, `Làm lại`, `Hoàn thành`), which is cluttered, scrolls off screen, lacks badge counts, and omits the Supervisor's primary workflow filter (`Chờ chụp ảnh`).
- **Solution**: Split task filters into clean, role-adapted options with live counts:
  - **Supervisor Filters**:
    1. `awaiting_capture`: `Chờ chụp ảnh` (with badge count of tasks where staff completed checkin and photos are needed)
    2. `all`: `Tất cả`
    3. `waiting_review`: `Chờ duyệt`
    4. `rework`: `Cần làm lại`
    5. `completed`: `Hoàn thành`
  - **Staff Filters**:
    1. `open`: `Việc mở`
    2. `rework`: `Cần làm lại` (prominent warning tone if > 0)
    3. `overdue`: `Quá hạn`
    4. `all`: `Tất cả`
    5. `completed`: `Hoàn thành`

---

## 2. Architectural Boundaries & Data Flow

```
   ┌────────────────────────────────────────────────────────┐
   │                    SupervisorArea                      │
   │  Role Filters: [Chờ chụp ảnh (5)] [Tất cả] [Chờ duyệt] │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                    StaffProofFlow                      │
   │                                                        │
   │  [Check-in Action] ──> Soft Tactile Tap (12ms)         │
   │                    ──> Direct transition to 'BEFORE'   │
   │                                                        │
   │  [DeviceCameraView]                                    │
   │    permissionState === 'granted'?                      │
   │      YES ──> Dark Viewfinder (Zero Flicker)            │
   │      NO  ──> DevicePermissionState                    │
   │                                                        │
   │  [ProofChainCard]                                      │
   │    hasLocationEx?                                      │
   │      YES ──> Done (v): "Ngoại lệ vị trí: [Lý do]"      │
   │      NO  ──> Distance: "3.2m từ gốc cây"               │
   │    Staff Name: formatActorDisplayName()                │
   └────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Specifications

### 3.1 `DeviceCameraView.tsx`
```tsx
const canRenderPreview = permissionState === 'granted' && activeCameraPurpose === purpose && Boolean(cameraModule);
const isPermissionGranted = permissionState === 'granted';

if (!canRenderPreview) {
  // If permission is already granted by OS, do NOT flash the permission request card.
  // Render a clean dark placeholder while activeCameraPurpose synchronizes.
  if (isPermissionGranted) {
    return <View style={[style, { backgroundColor: colors.ink }]} />;
  }
  return (
    <DevicePermissionState
      kind={kind}
      purpose={purpose}
      state={permissionState === 'granted' && !cameraModule ? 'runtime-unavailable' : permissionState}
      runtimeMessage={runtimeMessage}
      onRequest={onRequestPermission}
      onOpenSettings={onOpenSettings}
      onCancel={onCancel}
    />
  );
}
```

### 3.2 `TaskSurfaces.tsx` (`ProofChainCard`)
```tsx
const hasLocationEx = Boolean(
  task.notes?.includes('Ngoại lệ GPS:') ||
  task.supervisorNotes?.includes('Ngoại lệ GPS:') ||
  (task as unknown as { locationException?: { reason?: string } }).locationException,
);

const locationExReason =
  (task as unknown as { locationException?: { reason?: string } }).locationException?.reason ||
  task.notes?.split('Ngoại lệ GPS:')[1]?.split('\n')[0]?.trim() ||
  task.supervisorNotes?.split('Ngoại lệ GPS:')[1]?.split('\n')[0]?.trim() ||
  'Có ngoại lệ được duyệt';

// In supervisorChecks:
{
  id: 'sup-gps',
  label: 'Vị trí GPS Giám sát',
  body: task.supervisorGpsCheck?.verified
    ? `${task.supervisorGpsCheck.distance.toFixed(1)}m từ gốc${supGpsTime ? `, ${supGpsTime}` : ''}`
    : hasLocationEx
      ? `Ngoại lệ: ${locationExReason}`
      : task.status === TaskStatus.REWORK_REQUIRED && task.gpsCheck?.verified
        ? 'Đã xác minh vị trí tại hiện trường'
        : 'Chưa xác minh vị trí giám sát hiện trường',
  done: Boolean(
    task.supervisorGpsCheck?.verified ||
    hasLocationEx ||
    (task.status === TaskStatus.REWORK_REQUIRED && task.gpsCheck?.verified),
  ),
  icon: 'location-outline' as const,
}
```

### 3.3 Role-Adapted Task Filters
In `apps/mobile/src/domain/mobileWorkflow.ts`:
```ts
export const SUPERVISOR_FILTER_OPTIONS = (counts: { awaitingCapture: number; waitingReview: number; rework: number; total: number }) => [
  { id: 'awaiting_capture', label: 'Chờ chụp ảnh', badge: counts.awaitingCapture },
  { id: 'all', label: 'Tất cả', badge: counts.total },
  { id: 'waiting_review', label: 'Chờ duyệt', badge: counts.waitingReview },
  { id: 'rework', label: 'Cần làm lại', badge: counts.rework },
  { id: 'completed', label: 'Hoàn thành' },
];

export const STAFF_FILTER_OPTIONS = (counts: { open: number; rework: number; overdue: number; total: number }) => [
  { id: 'open', label: 'Việc mở', badge: counts.open },
  { id: 'rework', label: 'Cần làm lại', badge: counts.rework },
  { id: 'overdue', label: 'Quá hạn', badge: counts.overdue },
  { id: 'all', label: 'Tất cả', badge: counts.total },
  { id: 'completed', label: 'Hoàn thành' },
];
```

---

## 4. Verification & Success Criteria

1. **Zero Flicker Gate**: When tapping Check-in as Supervisor, zero permission cards render; transition directly to black viewfinder before camera frames stream.
2. **Smooth Tactile Feedback**: Vibration duration $\le 15\text{ms}$ (`light` tap), zero blocking lag.
3. **Proof Chain Consistency**: With GPS exception, `ProofChainCard` displays green check `(v)` and exact exception reason. Gate banner and chain items are 100% consistent.
4. **Name Sanitization**: Zero occurrences of raw emails like `staff@novyx.local` in `ProofChainCard`.
5. **Filter Usability**: Staff sees 5 streamlined chips; Supervisor sees 5 specialized chips starting with `Chờ chụp ảnh`.
6. **Code & Quality Gates**: All Vitest tests pass (349+), 0 ESLint errors, 0 TypeScript errors, Hermes iOS and Android exports clean.
