# Mobile iOS-Primary Dual-Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish an iOS-primary mobile experience adhering to Apple Human Interface Guidelines (native MapKit vector maps, keyboard avoidance, CoreLocation satellite precision, non-hardware navigation, tactile feedback) while preserving complete automated regression testing on the Android testbed.

**Architecture:** iOS Primary Target (MapKit / CoreLocation / HIG) + Android Testbed Target (Google Roadmap / ADB automation). Platform-divergent execution paths with unified business domain contracts.

**Tech Stack:** Expo SDK 57, React Native 0.86, `react-native-maps` (1.27.2 / MapKit), `expo-location`, TypeScript strict, Hermes.

**Spec:** `docs/superpowers/specs/2026-10-26-mobile-ios-primary-dual-platform-design.md`

## Global Constraints

- **Platform Invariant:** iOS is the primary production operational platform; Android is the automated test harness. Neither platform may break the other.
- **Dependency Invariant:** No new unvetted npm packages. Use React Native / Expo built-in capabilities (`Vibration`, `Platform`, `Linking`, `react-native-maps`).
- **Touch Target Invariant:** Every interactive element has $\ge 44\times 44\text{dp}$ touch target; primary field buttons are $48-52\text{dp}$.
- **Vietnamese Language Invariant:** All visible copy is approved operational Vietnamese.
- **Zero Raw Enums / IDs:** Never expose internal enums or database IDs in customer/operator-facing labels.

## Review Focus

1. **iOS MapKit Native Rendering:** Native `MKMapView` must render on iOS without requiring API keys, with synchronized `Circle` geofence and `showsUserLocation`.
2. **Keyboard Avoidance on iOS:** Tapping the search input in `ManualTreeCodeModal` must not obscure the search input or top result rows behind the iOS software keyboard.
3. **CoreLocation Satellite Precision:** GPS acquisition on iOS must use `Location.Accuracy.High` so accuracy is $\le 15\text{m}$, not cellular coarse estimates ($\ge 35\text{m}$).
4. **Navigation Without Hardware Back:** Every full-screen screen must have an explicit, thumb-friendly `<Header onBack={...}>` or close button.
5. **Android Testbed Regression Protection:** The entire 3-role automated lifecycle test (`scripts/mobile-role-acceptance-e2e.cjs`) on the connected Galaxy Note 20 Ultra must continue to pass with 0 failures.

---

### Task 1: iOS Native MapKit Resolution with Android Fallback

**Files to modify:**
- `apps/mobile/src/screens/staff/StaffProofFlow.tsx`

- [x] **Step 1: Remove hardcoded `useWebMap = true`**
  In `TreeCheckinMap` in `StaffProofFlow.tsx`:
  - Replace `const [useWebMap] = useState(true);` with dynamic module resolution:
    ```ts
    const [mapsModule, setMapsModule] = useState<typeof import('react-native-maps') | null>(cachedMapsModule ?? null);
    const [nativeMapAvailable, setNativeMapAvailable] = useState<boolean>(cachedMapsModule !== null && cachedMapsModule !== undefined);
    ```
  - On mount, dynamically import `react-native-maps`:
    - On iOS: loads native MapKit (`MKMapView`) without API keys.
    - On Android: loads native Google Maps if Google Play Services are present; otherwise sets `nativeMapAvailable = false`.
- [x] **Step 2: Render Native Map with MapKit on iOS**
  When `nativeMapAvailable && MapView && Circle && Marker`:
  - Render native `<MapView>` with `showsUserLocation`, `showsCompass={Platform.OS === 'ios'}`.
  - Render native `<Circle>` using the synchronized `radius={effectiveRadius}`.
  - Render native `<Marker>` for tree and GPS position.
  - When native map is not available (e.g. Android testbed without Play Services), gracefully fall back to `<WebMapView>`.
- [x] **Step 3: Verification**
  Run `npm run typecheck --workspace @novyx/mobile` and `npx vitest run tests/mobile/ui-foundation.spec.ts`.

---

### Task 2: iOS Keyboard Avoidance & Input Ergonomics in Bottom Sheets

**Files to modify:**
- `apps/mobile/src/components/AppPrimitives.tsx`
- `apps/mobile/src/components/ManualTreeCodeModal.tsx`

- [x] **Step 1: Integrate conditional `KeyboardAvoidingView` in `BottomSheetModal`**
  In `apps/mobile/src/components/AppPrimitives.tsx`:
  - Wrap the inner sheet content with `KeyboardAvoidingView`:
    ```tsx
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      style={styles.sheetBodyWrap}
    >
      {children}
    </KeyboardAvoidingView>
    ```
- [x] **Step 2: Update `ManualTreeCodeModal` for iOS keyboard behavior**
  In `apps/mobile/src/components/ManualTreeCodeModal.tsx`:
  - Ensure the search bar is pinned outside the scrolling list in a fixed container.
  - Set `keyboardShouldPersistTaps="handled"` on the `FlatList` so operators can tap a tree item immediately without needing an extra tap to close the keyboard.
  - Add `clearButtonMode="while-editing"` on iOS `TextInput`.
- [x] **Step 3: Verification**
  Run `npm run typecheck --workspace @novyx/mobile` and `npm run lint`.

---

### Task 3: iOS CoreLocation Precision & Precise Location Prompt

**Files to modify:**
- `apps/mobile/src/screens/staff/StaffProofFlow.tsx`

- [x] **Step 1: Escalate location accuracy on iOS**
  In `readDeviceLocationAfterPermission` in `StaffProofFlow.tsx`:
  - Update `Location.getCurrentPositionAsync` to use `accuracy: Location.Accuracy.High` (or `Accuracy.Highest` on iOS) instead of `Accuracy.Balanced`.
  - This activates the iOS GPS chip for sub-15m accuracy, matching field tree positions.
- [x] **Step 2: Add iOS Precise Location permission guard**
  - Check `permission.scope`: if `permission.scope === 'reduced'` on iOS 14+:
    - Set `locationMessage` to: *"Cần bật 'Vị trí chính xác' trong Cài đặt iPhone để định vị đúng gốc cây."*
- [x] **Step 3: Verification**
  Run `npm run typecheck --workspace @novyx/mobile` and `npm run lint`.

---

### Task 4: Tactile Haptic Utilities & Navigation Affordances

**Files to modify:**
- `apps/mobile/src/infrastructure/tactile.ts` (new)
- `apps/mobile/src/screens/staff/StaffProofFlow.tsx`

- [x] **Step 1: Create lightweight tactile vibration helper**
  Create `apps/mobile/src/infrastructure/tactile.ts`:
  - Implement `tactileFeedback(type: 'light' | 'success' | 'warning')` using native `Vibration.vibrate`.
  - Include platform safety guard so it gracefully runs on iOS and Android without extra dependencies.
- [x] **Step 2: Connect tactile feedback to key field actions**
  - Trigger light tick on checklist item toggle.
  - Trigger success pulse when GPS check-in is verified or QR code matches.
  - Trigger warning pulse when reporting an issue or exception.
- [x] **Step 3: Verification**
  Run `npm run typecheck --workspace @novyx/mobile` and `npm run lint`.

---

### Task 5: Dual-Platform Verification & Regression Acceptance

**Commands to run:**
- [x] **Step 1: Run comprehensive typecheck and lint**
  ```powershell
  npm run typecheck
  npm run lint
  npx vitest run tests/mobile/ui-foundation.spec.ts
  ```
- [x] **Step 2: Verify iOS Bundle compilation**
  ```powershell
  npm run mobile:export:ios
  ```
  Confirms Hermes iOS bytecode exports with 0 errors.
- [x] **Step 3: Run Android E2E lifecycle regression test**
  ```powershell
  node scripts/mobile-role-acceptance-e2e.cjs
  ```
  Confirms that iOS-first enhancements did not break any Android testbed workflows.
- [x] **Step 4: Update durable memory**
  Update `.agents/memory/UI_UX_MEMORY.md` with final dual-platform guidelines.
