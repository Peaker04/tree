# NOVYX GreenOps — Screen Contracts

> Status: non-authoritative evidence.
> Active mobile UI decisions live in root `DESIGN.md` after reconciliation.
> This artifact may inform rationale but cannot override domain contracts, FR/NFR, `docs/MOBILE_UI_RULES.md`, root `DESIGN.md`, or approved screen contracts.

*(Extracted from B2.6 and Workspace Memory)*

## 1. Universal Screen Contract
Every screen or focused workflow step must define:
- User and job-to-be-done
- Entry and exit conditions
- Information priority
- One primary action for the current state (if applicable)
- Empty/loading/error/offline limits
- Accessibility and Back behavior
- Forbidden invented domains (NO DBH, Geofence, RTK, GNSS counts, RFID, industrial telemetry, soil metrics)

## 2. Staff Home
- **Purpose**: Field worker orientation and assignment selection.
- **Must show**: 
  - Shift / context info ("Ca sáng...").
  - Current actionable task / Active operation.
  - Relevant progress / Timeline.
- **Primary CTA**: Proceed with active task (e.g., "Tiếp tục thực hiện nhiệm vụ" or "Ghi nhận bằng chứng").
- **Navigation visibility**: Bottom navigation docked.
- **Domain restrictions**: Pure Vietnamese Tree Care terminology.

## 3. Staff Task Detail / Proof Flow
- **Purpose**: Deep evidence collection and task execution.
- **Must show**: 
  - Tree QR verification state.
  - GPS verification state.
  - Before/After photo placeholders or proofs.
  - Task metadata / checklist.
- **Primary CTA**: Next step in the proof flow.
- **Navigation visibility**: MAY hide bottom navigation if intense immersion is needed.
- **Back behavior**: Preserves proof/evidence.

## 4. Manager Dashboard
- **Purpose**: Identify operational exceptions and management action.
- **Must show**: 
  - Review priority / queue.
  - Quick actions (Giao việc).
  - Exception summary (Risks, Overdue tasks).
- **Primary CTA**: Review backlog (when present) or Create Task.

## 5. Manager Create Task
- **Purpose**: Create valid CHANGE_PROOF task.
- **Must show**: 
  - Deadline input (Date & Time).
  - Target tree search.
  - Assignable Staff search.
  - Policy preview.
- **Primary CTA**: "Tạo việc".
- **Empty/Error**: Catalog loading/error handling. Multi-record selection must be robust.

## 6. Tree QR Scanner (Global Center Action)
- **Purpose**: Quick tree identification and check.
- **Must show**: Camera viewfinder, CUSTOM_SCAN grid.
- **Exit conditions**: Match -> Tree facts or task flow. Unknown -> Retry.
