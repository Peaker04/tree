# Mobile Tab Navigation Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the 400ms–2500ms perceived delay during bottom tab navigation by decoupling tab switching from unsolicited REST/SQLite data syncing in `MobileApp.tsx`, optimizing bulk SQLite caching in `SqliteMobileTaskRepository.ts`, and memoizing derived task/tree collections in `StaffArea.tsx`, `SupervisorArea.tsx`, and `StaffTrees.tsx`.

**Architecture:** Bottom navigation is a fast, local viewport switch over client-cached memory (`AppData`), running in <16ms (60fps) without triggering HTTP round-trips or layout-shifting loading states. Active network synchronization is preserved strictly for explicit user pull-to-refresh gestures (`RefreshControl`) and post-mutation workflows (task start, evidence submission, review decisions). SQLite caching operations are batched within an atomic transaction to prevent native JNI bridge saturation.

**Tech Stack:** TypeScript strict, React 19 / React Native 0.86, Expo SDK 57, `expo-sqlite`, Vitest (`tests/`), ADB / UIAutomator E2E harness (`scripts/mobile-lifecycle-e2e.cjs`).

**Spec:** `docs/superpowers/specs/2026-10-26-mobile-tab-navigation-performance-optimization-design.md`

## Global Constraints

- Preserve the frozen five-action locked bottom navigation contract from `docs/MOBILE_UI_RULES.md`:
  - Staff & Supervisor: `Trang chủ`, `Cây của tôi`, centered QR FAB, `Công việc`, `Tài khoản`.
  - Manager: `Tổng quan`, `Giao việc`, centered QR FAB, `Duyệt`, `Tài khoản`.
- Comply with `tests/mobile/r2a-lifecycle.spec.ts` invariant: `expect(mobileAppSource).not.toMatch(/useEffect\(\(\) => \{\s*void refreshData\(\)/)`. Never move `refreshData()` into an unconditioned `useEffect`.
- Preserve the explicit pull-to-refresh gesture: every list screen (`StaffHome`, `StaffTrees`, `StaffWork`, `ManagerDashboard`, `ManagerReview`, `SupervisorArea`) retains `onRefreshData={refreshData}` bound to `RefreshControl`.
- Preserve post-mutation data synchronization: `startTask`, `submitTaskEvidence`, `submitStaffCheckin`, `reportFieldIssue`, `resubmitRework`, and `reviewTaskDecision` must continue refreshing snapshot state upon mutation completion.
- Comply with `AGENTS.md`: do not run `git commit`, `git push`, `git reset`, or install new dependencies unless explicitly authorized by the user.

## Review Focus

- **Tab switch network silence:** Tapping any bottom navigation tab (`Trang chủ`, `Cây của tôi`, `Công việc`, `Tài khoản`, `Tổng quan`, `Duyệt`) must issue ZERO network HTTP requests to `/trees` or `/tasks`.
- **Layout stability during tab switch:** Tapping "Trang chủ" must NOT flash the Hero card text to *"Đang tải ca làm việc"*; tapping "Công việc" or "Cây của tôi" must NOT trigger the pull-to-refresh spinner.
- **Offline navigation resilience:** When network connection is severed or in flight mode, switching between bottom tabs must continue functioning smoothly using existing client-cached data without throwing unhandled network rejections.
- **Pull-to-refresh functional integrity:** When the user explicitly pulls down on `StaffHome`, `StaffTrees`, `StaffWork`, or `ManagerDashboard`, `refreshData()` must execute and update the screen with latest server state.
- **Post-mutation data freshness:** After completing a check-in or review decision, the active task and review queue must reflect the updated task state immediately.

---

### Task 1: Decouple Tab Navigation from `refreshData` in `MobileApp.tsx`

**Files:**
- Modify: `apps/mobile/src/screens/MobileApp.tsx:765-805`
- Test: `tests/mobile/r2a-lifecycle.spec.ts`

**Overview:**
Remove `void refreshData();` calls from the `onPress` callback in both `showStaffNav` and `showManagerNav` in `MobileApp.tsx`. Tab switching will update only navigation state (`staffStep` / `managerStep`) and clear `activeTask`, achieving instantaneous local navigation.

- [x] **Step 1: Inspect and update `apps/mobile/src/screens/MobileApp.tsx`**

In `apps/mobile/src/screens/MobileApp.tsx`:
Replace lines 770–788:
```tsx
          onPress={(id) => {
            if (id === 'QR') {
              // The centered FAB is a global tree lookup action. Task proof steps stay inside task detail.
              setActiveTask(null);
              setStaffStep('QR');
            } else if (id === 'MY_TREES') {
              setActiveTask(null);
              setStaffStep('MY_TREES');
            } else if (id === 'WORK') {
              setActiveTask(null);
              setStaffStep('WORK');
            } else if (id === 'ACCOUNT') {
              setActiveTask(null);
              setStaffStep('ACCOUNT');
            } else {
              setActiveTask(null);
              setStaffStep('HOME');
            }
          }}
```

Replace lines 797–802:
```tsx
          onPress={(id) => {
            setManagerStep(id as ManagerStep);
          }}
```

- [x] **Step 2: Add contract assertion in `tests/mobile/r2a-lifecycle.spec.ts`**

Add an assertion in `tests/mobile/r2a-lifecycle.spec.ts` (inside test `B1: mobile app lifecycle maintains single auth/session owner and clean state flow`):
```ts
    expect(mobileAppSource).not.toMatch(/onPress=\{.*void refreshData\(\).*\}/s);
```
Ensure that `onPress` handlers on bottom navigation bars do not embed speculative `refreshData()` calls.

- [x] **Step 3: Run unit tests to verify**
Run: `npm test tests/mobile/r2a-lifecycle.spec.ts`
Confirm: PASS.

---

### Task 2: Optimize Bulk SQLite Caching in `mobileTaskRepository.ts`

**Files:**
- Modify: `apps/mobile/src/storage/task/mobileTaskRepository.ts:48-80`
- Test: `tests/mobile/r2a-lifecycle.spec.ts`

**Overview:**
In `SqliteMobileTaskRepository.cacheTasks()`, batch SQLite inserts inside a single multi-row statement (chunked in groups of 25) or use a prepared statement inside `withTransactionAsync` rather than awaiting 50 separate async JNI bridge round-trips.

- [x] **Step 1: Refactor `cacheTasks` in `apps/mobile/src/storage/task/mobileTaskRepository.ts`**

Update `cacheTasks`:
```typescript
  async cacheTasks(tasks: Array<TaskDto | CanonicalTaskDto>): Promise<void> {
    if (tasks.length === 0) return;
    const now = new Date().toISOString();
    
    // Chunk in batches of 25 to avoid SQLite variable limits (max 999 parameters)
    const CHUNK_SIZE = 25;
    await this.db.withTransactionAsync(async () => {
      for (let i = 0; i < tasks.length; i += CHUNK_SIZE) {
        const chunk = tasks.slice(i, i + CHUNK_SIZE);
        const valuePlaceholders: string[] = [];
        const params: unknown[] = [];

        for (const task of chunk) {
          const raw = task as unknown as Record<string, unknown>;
          const taskTypeId = (raw.taskTypeId ?? raw.taskType ?? null) as string | null;
          const taskTypeName = (raw.taskTypeName ?? raw.taskType ?? null) as string | null;
          const proofProfile = (raw.proofProfile ?? null) as string | null;
          const priority = (raw.priority ?? null) as string | null;

          valuePlaceholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
          params.push(
            task.id,
            task.treeId,
            taskTypeId,
            taskTypeName,
            task.status,
            task.assignedStaffId ?? null,
            task.assignedStaffName ?? null,
            task.deadline ?? null,
            task.version ?? 0,
            proofProfile,
            task.title,
            task.description ?? null,
            priority,
            JSON.stringify(task),
            now,
            now,
          );
        }

        const query = `
          INSERT INTO cached_tasks (
            id, tree_id, task_type_id, task_type_name, status,
            assigned_staff_id, assigned_staff_name, deadline, version,
            proof_profile, title, description, priority, raw_json,
            created_at, updated_at
          ) VALUES ${valuePlaceholders.join(', ')}
          ON CONFLICT(id) DO UPDATE SET
            tree_id = excluded.tree_id,
            task_type_id = excluded.task_type_id,
            task_type_name = excluded.task_type_name,
            status = excluded.status,
            assigned_staff_id = excluded.assigned_staff_id,
            assigned_staff_name = excluded.assigned_staff_name,
            deadline = excluded.deadline,
            version = excluded.version,
            proof_profile = excluded.proof_profile,
            title = excluded.title,
            description = excluded.description,
            priority = excluded.priority,
            raw_json = excluded.raw_json,
            updated_at = excluded.updated_at;
        `;

        await this.db.runAsync(query, params);
      }
    });
  }
```

- [x] **Step 2: Run test suite to verify storage repository behavior**
Run: `npm test`
Confirm: All 328 tests pass.

---

### Task 3: Memoize Derived Data Collections in `StaffArea.tsx`, `SupervisorArea.tsx`, and `StaffTrees.tsx`

**Files:**
- Modify: `apps/mobile/src/screens/staff/StaffArea.tsx:84-115`
- Modify: `apps/mobile/src/screens/supervisor/SupervisorArea.tsx:85-120`
- Modify: `apps/mobile/src/screens/staff/StaffTrees.tsx:144-162`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Overview:**
Bọc các phép toán lọc và sắp xếp (`filter`, `sort`, `Set`) bằng `useMemo` để khi component cha re-render (hoặc khi chuyển tab), JavaScript thread không phải lặp lại các phép tính dẫn xuất trên hàng chục task và cây. Tách `renderItem` trong `StaffTrees.tsx` ra hàm memoized callback.

- [x] **Step 1: Add `useMemo` in `apps/mobile/src/screens/staff/StaffArea.tsx`**

In `StaffArea.tsx`:
```tsx
  const staffTasks = useMemo(
    () => (props.authenticatedStaffId ? props.tasks.filter((task) => task.assignedStaffId === props.authenticatedStaffId) : []),
    [props.authenticatedStaffId, props.tasks],
  );
  const openTasks = useMemo(
    () => staffTasks.filter((task) => task.status !== TaskStatus.COMPLETED && task.status !== 'CANCELLED'),
    [staffTasks],
  );
  const completedTasks = useMemo(
    () => staffTasks.filter((task) => task.status === TaskStatus.COMPLETED),
    [staffTasks],
  );
  const waitingReviewTasks = useMemo(
    () => staffTasks.filter((task) => task.status === TaskStatus.WAITING_REVIEW),
    [staffTasks],
  );
  const actionableTasks = useMemo(
    () => staffTasks.filter(isStaffActionableTask),
    [staffTasks],
  );
  const visibleTasks = useMemo(
    () =>
      [...filterTasks(staffTasks, taskFilter)].sort((a, b) => {
        const aActionable = isStaffActionableTask(a) ? 0 : 1;
        const bActionable = isStaffActionableTask(b) ? 0 : 1;
        if (aActionable !== bActionable) return aActionable - bActionable;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [staffTasks, taskFilter],
  );
  const assignedTrees = useMemo(() => {
    const assignedTreeIds = new Set(staffTasks.map((task) => task.treeId));
    return props.trees.filter((tree) => assignedTreeIds.has(tree.id));
  }, [props.trees, staffTasks]);
  const visibleAssignedTrees = useMemo(
    () => filterTrees(assignedTrees, staffTreeQuery, staffTreeFilter),
    [assignedTrees, staffTreeFilter, staffTreeQuery],
  );
  const nextTask = useMemo(() => getNextActionTask(actionableTasks), [actionableTasks]);
```

- [x] **Step 2: Add `useMemo` in `apps/mobile/src/screens/supervisor/SupervisorArea.tsx`**

Perform the equivalent memoization for supervisor tasks, visible tasks, and tree filters.

- [x] **Step 3: Memoize `renderItem` in `apps/mobile/src/screens/staff/StaffTrees.tsx`**

Wrap `renderItem` in `useCallback` to prevent `FlatList` virtualized cell invalidation on every render.

- [x] **Step 4: Verify typecheck and tests**
Run:
`npm run typecheck --workspace @novyx/mobile`
`npm run lint`
`npm test`
Confirm: 0 errors, 0 warnings, all tests pass.

---

### Task 4: Physical Device Performance Verification & Latency Audit

**Files:**
- Execute: `scripts/mobile-lifecycle-e2e.cjs` on `R3CN70ED57A`
- Artifact: `task.md`

**Overview:**
Verify on the connected physical Android device (`R3CN70ED57A`) that bottom tab navigation is instantaneous (<32ms), generates 0 network calls, causes 0 layout jumps, and all 11+ role lifecycle scenarios pass cleanly.

- [x] **Step 1: Run mobile lifecycle e2e on physical device**
Run:
`node scripts/mobile-lifecycle-e2e.cjs`
Verify:
- S3.3 (Mở danh mục hồ sơ cây đô thị): Latency reduces significantly from ~4.2s to sub-second UI transition.
- S3.6 (Mở trung tâm thông báo): Transition occurs smoothly without network stall.
- 100% scenarios PASS with high fidelity evidence.

- [x] **Step 2: Capture device screenshot and UI tree**
Verify that tab selection highlight responds immediately upon touch.

- [x] **Step 3: Update `task.md` and report metrics**
Record measured before/after timings in `task.md`.
