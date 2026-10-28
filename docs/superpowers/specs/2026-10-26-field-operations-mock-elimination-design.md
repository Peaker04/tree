# Field Operations Mock Elimination & Real-World Resilience Specification

**Date:** 2026-10-26  
**Status:** Approved  
**Author:** Antigravity (FE & Mobile Architecture Expert)  
**Target:** `apps/mobile`, `apps/api`, `packages/contracts`

---

## 1. Context & Problem Statement

Through physical device inspection and E2E verification, 4 critical operational gaps and mock shortcuts ("thao tác giả") were identified that block real-world field users from completing tasks:

1. **Fake QR Scanner Tap Bypass**:
   - `StaffProofFlow.tsx:1288` and `ManagerQrLookup.tsx:96` contained `onPress={__DEV__ ? () => onBarcodeScanned('TRE-DEV-01') : undefined}`. Tapping the camera frame skipped real QR recognition.
   - Real-world blocker: In the field, physical QR tags are frequently damaged, muddy, torn, or unreadable under poor lighting. With no manual code entry or task selection fallback, field staff are permanently blocked from reaching the Checklist step.
2. **Rigid GPS Threshold & Hardcoded Static Location**:
   - `MobileApp.tsx:83-84` initialized `userLat` and `userLng` to hardcoded coordinates `(10.77402, 106.69974)`.
   - `TreeCheckinMap` in `StaffProofFlow.tsx:1528` hard-disabled the `Check-in` button whenever calculated distance $\ge 10\text{m}$.
   - Real-world blocker: Under dense urban tree canopies, Android device GPS accuracy ranges from $\pm 15\text{m}$ to $\pm 30\text{m}$. A worker standing right at the tree trunk with $\pm 18\text{m}$ GPS error is locked out with a disabled button.
3. **Dead-End Central FAB QR Scanner**:
   - The elevated FAB scanner only displays read-only tree parameters.
   - Real-world blocker: After scanning a tree in the field, Staff cannot directly start assigned work or report field hazards; Managers cannot directly create or assign work for that tree.
4. **Flawed Overdue Logic, Broken Filter, Single-Tree Map & Monolithic Seed**:
   - `isTaskOverdue` in `mobileWorkflow.ts:126` forced `deadline.setHours(23, 59, 59, 999)`, obscuring precise operational deadlines (e.g. 10:00 or 14:00).
   - `filterTasks` in `mobileWorkflow.ts:91` compared `task.status === 'overdue'`, returning an empty array because `overdue` is an SLA state, not an enum status. Staff and Supervisor work screens lacked an "Overdue" filter chip.
   - `WebMapView.tsx` only supported a single tree coordinate pair (`treeLat`, `treeLng`), unable to display surrounding trees in a work zone.
   - `seed-dev.ts` contained only 1 tree (`TRE-DEV-01`), violating the project rule *"Never design from the one-row dev seed"*.

---

## 2. Architecture & Design Principles

### Pillar 1: Robust Field QR Recognition & 2-Tier Fallback

- **Remove Dev Shortcuts**: Eliminate all `onPress={__DEV__ ? ... : undefined}` bypasses on camera overlays.
- **Fallback 1: Manual Code Entry (Nhập mã cây thủ công)**:
  - Accessible directly below the camera viewport via a prominent secondary action.
  - Opens a lightweight bottom sheet / dialog with auto-capitalized input (`TRE-...`, `NOVYX-...`, or tree name).
  - Matches against local cached trees (`props.trees` / SQLite).
- **Fallback 2: Task-Bound Confirmation (Xác nhận theo nhiệm vụ)**:
  - When the physical tag is destroyed or missing, allow staff to confirm the tree directly from their active task with a mandatory audit flag `qrCheck: { verified: true, method: 'manual_task_bound', reason: 'Tem QR hư hỏng' }`.
  - Flags the task for Supervisor verification during review.

### Pillar 2: Real-World Adaptive GPS & Seamless Exception Handling

- **Automatic Location Sensing**: When opening the GPS verification step, immediately trigger `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })`.
- **Adaptive Geofence Formula**:
  $$\text{Effective Radius} = \max(15,\, \text{locationAccuracyMeters} \mathbin{??} 15) + 5\text{ meters}$$
  A worker is considered at the tree if measured distance is within the device's current GPS error margin plus a 5m buffer.
- **Unblocking Field Exception Flow**:
  - If the worker is physically obstructed (construction fence, deep ditch, water body) and distance exceeds the adaptive radius, the `Check-in` button is NOT disabled.
  - Instead, the UI clearly shows `Check-in kèm báo ngoại lệ vị trí`, allowing selection of standard field reasons (*"Tán cây cản sóng GPS"*, *"Rào chắn công trình"*, *"Vị trí cây lệch mốc bản đồ"*) and recording the exact measured GPS coordinates.
  - The task transitions to `CHECKLIST` without deadlock, with `locationException` recorded for review.

### Pillar 3: Actionable Central FAB Scanner

When scanning any tree via the central FAB:
- **Staff Role**:
  - If a task is assigned to this staff on this tree $\rightarrow$ Primary CTA: **"Bắt đầu công việc này"** (opens active task detail).
  - If an issue is discovered $\rightarrow$ Secondary CTA: **"Báo cáo sự cố cây"** (opens issue reporting sheet).
  - Care History preview (last 3 interventions).
- **Manager Role**:
  - Primary CTA: **"Giao việc cho cây này"** (navigates to `ManagerCreateTask` with `treeId` pre-selected).

### Pillar 4: Real Overdue Handling, Multi-Dimensional Filters, Multi-Tree Map & Rich Seed

- **Exact Time Overdue**:
  ```typescript
  export const isTaskOverdue = (task: Task): boolean => {
    if (task.status === TaskStatus.COMPLETED || task.status === 'CANCELLED') return false;
    const deadline = new Date(task.deadline);
    if (Number.isNaN(deadline.getTime())) return false;
    return deadline.getTime() < Date.now();
  };
  ```
- **Filter Resolution**:
  ```typescript
  export const filterTasks = (tasks: Task[], filter: TaskFilter): Task[] => {
    if (filter === 'all') return tasks;
    if (filter === 'open') {
      return tasks.filter((t) => t.status !== TaskStatus.COMPLETED && t.status !== 'CANCELLED');
    }
    if (filter === 'overdue') {
      return tasks.filter(isTaskOverdue);
    }
    return tasks.filter((t) => t.status === filter);
  };
  ```
- **Multi-Tree Map View**:
  - Enhance `WebMapViewProps` to support `trees?: Tree[]` alongside `activeTreeId?: string`.
  - Leaflet / Google map engine renders markers for all trees in the active zone, color-coded:
    - 🟢 Green: Healthy / up-to-date.
    - 🟡 Amber: Open task awaiting work.
    - 🔴 Red: Overdue task or high-risk tree.
- **Rich Seed Data (`seed-dev.ts`)**:
  - Seed 16 realistic trees distributed across Ho Chi Minh City park systems (Công viên Tao Đàn, Thảo Cầm Viên, đường Lê Duẩn, Pasteur, Nam Kỳ Khởi Nghĩa) with realistic coordinates, varied species (Sao đen, Dầu rái, Bàng đài loan, Me tây), realistic QR codes, and varied task states (pending, in progress, overdue, waiting review).

---

## 3. Verification & Acceptance Criteria

1. **Zero Dev Bypasses**: No `__DEV__` taps on camera screens in `apps/mobile`.
2. **Manual QR Fallback**: Tapping "Nhập mã cây" allows typing a tree code and proceeding to Checklist.
3. **Adaptive GPS**: Devices with GPS accuracy $\pm 20\text{m}$ can check-in smoothly within range; out-of-range users can submit a 1-tap exception with verified coordinates without blocking work.
4. **Overdue Accurate Flagging**: Tasks with passed deadline times immediately turn red with "Quá hạn" badge and appear in the "Quá hạn" filter tab.
5. **Multi-Tree Visualization**: Map displays surrounding trees in the catalog with interactive pins.
6. **Tests & Invariants**:
   - Full TypeScript strict check (`npm run typecheck`).
   - ESLint (`npm run lint`).
   - Vitest suite (328+ tests passing).
   - Strict physical device E2E test on `R3CN70ED57A` passes 100% without fake camera clicks.
