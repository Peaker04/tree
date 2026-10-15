> NON-AUTHORITATIVE DESIGN EXPLORATION
> This artifact cannot override domain contracts, MOBILE_UI_RULES, DESIGN.md, screen contracts, or architecture.
> Approved decisions must be reconciled back into root DESIGN.md before implementation.

# Screen Direction Notes

## 1. Staff Home
* **Role**: Staff
* **Job-to-be-done**: Understand shift state and start the next valid action.
* **Entry context**: Authenticated Staff home, refresh, or return from top-level navigation.
* **Orientation information**: Staff/shift orientation and network source.
* **Main decision/state**: Next-action or standby decision.
* **Required supporting evidence**: Maximum three grouped metrics.
* **Metadata priority**: Secondary navigation.
* **Primary action**: Next valid task action; when no assignment, "Kiểm tra việc".
* **Secondary actions**: None competing.
* **Important domain states**: Actions waiting, standby, waiting review, completed shift, cache.
* **Loading / empty / error / offline concerns**: Each state gets one summary surface (do not repeat 0 states).
* **Navigation constraints**: Bottom navigation visible.
* **Accessibility/device constraints**: Next action in initial viewport.
* **Visual problems currently open for exploration**: Repetitive zero-state cards, inefficient dashboard metric grouping, balancing the layout when sparse vs. dense.

## 2. Staff Task Detail
* **Role**: Staff
* **Job-to-be-done**: Understand task context, proof gaps, and the next valid lifecycle action.
* **Entry context**: Task row, tree relation, notification.
* **Orientation information**: Task/tree identity and lifecycle status.
* **Main decision/state**: Rework/block reason and next required proof step.
* **Required supporting evidence**: Proof progress/gaps, compact checklist.
* **Metadata priority**: Disclosure metadata.
* **Primary action**: Derived dynamic proof step.
* **Secondary actions**: Map, field issue, Back.
* **Important domain states**: pending, in progress, blocked, rework, waiting review.
* **Loading / empty / error / offline concerns**: Task data must survive offline.
* **Navigation constraints**: Focused detail—hide bottom nav if actively executing proof.
* **Accessibility/device constraints**: Dynamic primary action must be readable/reachable on compact screens.
* **Visual problems currently open for exploration**: Card-stack repetition (consecutive un-grouped cards), balancing hierarchy of evidence vs. pure data.

## 3. Staff Proof Execution / Evidence Step
* **Role**: Staff
* **Job-to-be-done**: Capture trustworthy current-position or photo evidence.
* **Entry context**: Valid preceding proof step.
* **Orientation information**: Stage/task identity.
* **Main decision/state**: Permission state, current fix state, camera preview.
* **Required supporting evidence**: Distance/accuracy/time (GPS) or retake option (photos).
* **Metadata priority**: Compact metadata (timestamp).
* **Primary action**: Lấy GPS / Chụp ảnh -> Dùng ảnh này.
* **Secondary actions**: Chụp lại, Settings/retry permission, Back.
* **Important domain states**: Rationale, requesting, denied, blocked, accurate fix, mismatch.
* **Loading / empty / error / offline concerns**: Hardware fallback states.
* **Navigation constraints**: Bottom navigation hidden to focus on camera/hardware.
* **Accessibility/device constraints**: Action must be visible alongside camera preview.
* **Visual problems currently open for exploration**: Connecting hardware views with floating operational controls; permission rationale aesthetics.

## 4. Manager Dashboard
* **Role**: Manager
* **Job-to-be-done**: Identify operational exceptions and choose the next management action.
* **Entry context**: Authenticated Manager home.
* **Orientation information**: Network/scope orientation.
* **Main decision/state**: Exception summary.
* **Required supporting evidence**: Review priority, quick actions.
* **Metadata priority**: Secondary operational detail.
* **Primary action**: State-dependent (Review backlog or Create Task).
* **Secondary actions**: QR lookup, Trees.
* **Important domain states**: loading, normal, exception present, empty operation, error.
* **Loading / empty / error / offline concerns**: Cache indicator for stale monitoring data.
* **Navigation constraints**: Bottom navigation visible.
* **Accessibility/device constraints**: Exceptions must be visible in first viewport.
* **Visual problems currently open for exploration**: Over-reliance on generic metrics grids, decorative hero copy crowding out real priorities.

## 5. Manager Create Task
* **Role**: Manager
* **Job-to-be-done**: Create one valid task using canonical catalogs.
* **Entry context**: Create tab/dashboard shortcut.
* **Orientation information**: Task purpose/title.
* **Main decision/state**: Progressive selection of tree, staff, task type, deadline.
* **Required supporting evidence**: Concise policy/checklist preview.
* **Metadata priority**: Compact final summary.
* **Primary action**: Tạo việc.
* **Secondary actions**: Thay đổi (Change selected item), Back.
* **Important domain states**: Catalog loading, empty catalogs, validation states.
* **Loading / empty / error / offline concerns**: Search error retries.
* **Navigation constraints**: Deep flow (bottom nav rules apply based on context).
* **Accessibility/device constraints**: Safe keyboard avoidance, readable long Vietnamese names.
* **Visual problems currently open for exploration**: Long form fatigue, visually differentiating 'selected' state vs 'selectable' catalogs, making progressive disclosure linear.

## 6. Manager Review Detail
* **Role**: Manager
* **Job-to-be-done**: Make one evidence-based canonical review decision.
* **Entry context**: Waiting-review task selected.
* **Orientation information**: Task/tree/staff identity and evidence gate.
* **Main decision/state**: Approve, Rework, Exception, or Cancel.
* **Required supporting evidence**: GPS/QR summary, photo evidence, checklist, notes.
* **Metadata priority**: History/transport disclosure.
* **Primary action**: Canonical decision (Approve primary only if gate permits).
* **Secondary actions**: Back, edit notes.
* **Important domain states**: Complete evidence vs gaps, submitting, conflict.
* **Loading / empty / error / offline concerns**: Submitting loader, OCC conflict.
* **Navigation constraints**: Bottom nav hidden.
* **Accessibility/device constraints**: Action bar reachable with keyboard open.
* **Visual problems currently open for exploration**: Metadata overwhelming evidence; scaling 4 valid paths distinctively.