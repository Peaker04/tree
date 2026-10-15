# NOVYX GreenOps — UX Rules & Interaction

## 1. Navigation Behavior
- **Global Navigation (Bottom Nav)**
  - Staff: `Trang chủ` | `Cây của tôi` | `[CENTER QR]` | `Công việc` | `Tài khoản`.
  - Manager: `Tổng quan` | `Giao việc` | `[CENTER QR]` | `Duyệt` | `Tài khoản`.
- **Visibility**: Focused execution MAY hide bottom navigation when entering a contained workflow (e.g., deep evidence collection or review) if the screen contract requires immersion.
- **Sticky Actions**: Sticky PrimaryAction is used when persistent action access is required, not as a universal rule.

## 2. Status & Interaction Semantics
- **Domain-level state**: Allowed to use visually prominent badges.
- **Row-level state**: Use inline text/icon/progress marker.
- **Technical state**: Upload, sync, and offline feedback stays separate from business task state.
- **Feedback**: 
  - Pressed/Selected/Active/Disabled states must be distinct.
  - Disabled controls explain prerequisite (in text or a11y labels).

## 3. Loading & Layout Stability
- Loadings states must be calm and operational. 
- Avoid content jump. Skeletons (when used) preserve geometry.
- Images have reserved ratios/heights. 
- Focus on partial loading to preserve functionality.

## 4. Empty & Error States
- **Offline**: Offline states remain visible but do not shout with massive red cards unless a task is blocked. 
- **Error**: Must have clear recovery actions (e.g. Try Again).
- **Empty**: Contextual emptiness (e.g., "Tiến độ: Đã hoàn thành 5/8 việc" rather than an error). Feedback is operational.

## 5. Forms 
- Minimum 48dp interactive targets.
- 12–16px radii inputs.
- Readable text (>= 14px body).
- Required fields, inline validation clearly distinguished.

## 6. Offline / Sync
- Pending sync vs Synced successfully.
- Distinct states for Conflict, Sync Failed, Retry.

## 7. Responsiveness & Accessibility
- Compact Android first (360-393dp) with physical iPhone acceptance.
- Predictable safe-area margins.
- Long Vietnamese text wrapping gracefully without forcing 1-line truncation.
- Font scaling resilience (don't shrink fonts below 13px floor to solve spacing).
- Non-color-only communication.
- Touch affordance >= 48dp.
