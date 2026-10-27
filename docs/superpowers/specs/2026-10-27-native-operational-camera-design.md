# Native Operational Camera Interface & Performance Specification

**Date:** 2026-10-27  
**Status:** Approved by Operator  
**Author:** Mobile & FE Lead Architect  
**Platform:** Dual-Platform (iOS Primary Production HIG & Samsung Galaxy Note 20 Ultra Android Testbed)  
**Standard:** Living Botanical Operational Design System / Expo SDK 57 / React Native 0.86  
**Target:** `apps/mobile/src/screens/staff/StaffProofFlow.tsx`, `apps/mobile/src/components/DeviceCameraView.tsx`, `.agents/memory/UI_UX_MEMORY.md`

---

## 1. Problem Statement & Root Cause

### 1.1 Viewfinder Obstruction & Low-Contrast Status Bar
* In `StaffProofFlow.tsx`, the camera preview previously rendered a 64px camera icon and static title right in the crosshairs (`styles.nativeCameraOverlay`), blocking the worker's view of leaves, tree trunks, and inspection targets.
* When dark mode (`#020617`) was mounted, the system status bar remained in dark-text mode (`19:12` dark grey on black), violating WCAG AAA contrast and making time/battery unreadable.

### 1.2 Non-Native Shutter Ergonomics & Dead Space
* The "Chụp ảnh" button was rendered as a rectangular green submit button directly below the camera card, leaving the lower 40% of the display as empty black space.
* Workers holding the phone with one hand were forced to stretch their thumbs upward into the middle of the screen to capture photos.

---

## 2. Architecture & Design Principles

### 2.1 Principle 1: Unobstructed Viewfinder with Translucent Corner Badge
* Remove center blocking overlay icons.
* The camera viewfinder is 100% clean for aiming.
* Stage metadata is placed in an unobtrusive top-left translucent badge:
  `[ Ảnh trước xử lý ]` or `[ Ảnh sau xử lý ]` (`rgba(0, 0, 0, 0.55)`).

### 2.2 Principle 2: Dedicated Bottom Shutter Dock (Thumb Zone Ergonomics)
* Pin controls to the bottom thumb zone above the safe area:
  - **Center:** Circular Native Shutter button ($76\times 76\text{dp}$ outer ring, $62\times 62\text{dp}$ inner button) with spring compression on press.
  - **Left:** Flash / Torch toggle button ($44\times 44\text{dp}$, `flash-outline` / `flash-off-outline`).
  - **Right:** Camera flip toggle button ($44\times 44\text{dp}$, `camera-reverse-outline`).
  - **Gallery Exclusion:** No photo library picker (ensuring proof is captured live at the tree location).

### 2.3 Principle 3: High-Contrast Status Bar & Fast Capture Performance
* Mount `<StatusBar style="light" />` during active camera steps (`BEFORE`, `AFTER`, `QR`).
* Optimize picture capture: `quality: 0.65`, snappy capture transition with light haptic feedback.

---

## 3. Data Contracts & UI Interfaces

```tsx
interface CameraControlsProps {
  onCapture: () => void;
  onToggleTorch?: () => void;
  onToggleFacing?: () => void;
  torchActive?: boolean;
  capturing?: boolean;
}
```

---

## 4. Verification & Acceptance Criteria

1. **Clean Viewfinder**: Zero icons or text blocking the center of the camera preview.
2. **Status Bar**: Clock and battery icons display in crisp white over the `#020617` camera canvas.
3. **Shutter Dock**: Circular 76dp shutter button is placed in the bottom thumb zone with Flash and Flip camera toggles.
4. **Physical Verification**: Live capture and screenshot validation on Samsung Galaxy Note 20 Ultra.
5. **Quality Floor**: 100% typecheck pass, 0 lint warnings, all Vitest tests pass.
