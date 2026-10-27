# Immersive Botanical Navigation Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Option 1 (Immersive Botanical Navigation Bar): full-canvas edge-to-edge background with an anchored navigation bar integrating dynamic safe insets, eliminating both notch content collisions and artificial root padding gaps.

**Architecture:** Upgrade `ScreenHeader` in `AppPrimitives.tsx` to directly consume `useSafeAreaInsets()`, applying `paddingTop: insets.top` with a clean 52dp content row. Remove root-level `paddingTop` from `MobileApp.tsx` to restore full edge-to-edge canvas. Anchor `ScreenHeader` outside scroll containers across all mobile screens.

**Tech Stack:** React Native 0.86, Expo SDK 57, TypeScript strict, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-immersive-botanical-navigation-bar-design.md`

## Global Constraints

- Root screen canvas must extend edge-to-edge ($Y = 0$) with background `#faf7ef` without artificial top padding gaps.
- `ScreenHeader` owns top safe area insets via `useSafeAreaInsets().top` and must sit outside scrollable containers.
- Interactive header targets must maintain minimum 44x44dp touch ergonomics.
- Dual-platform parity: identical seamless behavior on iOS (Dynamic Island / Notch) and Android.
- 100% typecheck and lint pass.

---

### Task 1: Overhaul `ScreenHeader` with Safe Insets & Restore Edge-to-Edge Root Canvas

**Files:**
- Modify: `apps/mobile/src/components/AppPrimitives.tsx`
- Modify: `apps/mobile/src/screens/MobileApp.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: `ScreenHeader({ title, subtitle, onBack, action, dark, borderBottom })`

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**

Assert:
- `ScreenHeader` consumes `useSafeAreaInsets` and sets `paddingTop: insets.top`.
- `MobileApp.tsx` does not have `paddingTop: insets.top` on `styles.root`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-049"`
Expected: FAIL.

- [ ] **Step 3: Implement `ScreenHeader` & update `MobileApp.tsx`**

1. In `apps/mobile/src/components/AppPrimitives.tsx`:
   Update `ScreenHeader`:
   ```tsx
   export function ScreenHeader({
     title,
     subtitle,
     onBack,
     action,
     dark = false,
     borderBottom = true,
   }: {
     title: string;
     subtitle?: string;
     onBack?: () => void;
     action?: React.ReactNode;
     dark?: boolean;
     borderBottom?: boolean;
   }) {
     const insets = useSafeAreaInsets();
     return (
       <View
         style={[
           styles.screenHeaderWrap,
           { paddingTop: insets.top },
           dark && styles.screenHeaderDark,
           borderBottom && styles.screenHeaderBorder,
         ]}
       >
         <View style={styles.screenHeaderContent}>
           {onBack ? (
             <Pressable
               accessibilityRole="button"
               accessibilityLabel="Quay lại"
               onPress={onBack}
               style={[styles.headerButton, dark && styles.headerButtonDark]}
             >
               <Ionicons name="chevron-back" size={22} color={dark ? colors.snowWhite : colors.ink} />
             </Pressable>
           ) : null}
           <View style={styles.flex}>
             <Text numberOfLines={1} style={[styles.screenTitle, dark && styles.screenTitleDark]}>
               {title}
             </Text>
             {subtitle ? (
               <Text numberOfLines={1} style={[styles.screenSubtitle, dark && styles.screenSubtitleDark]}>
                 {subtitle}
               </Text>
             ) : null}
           </View>
           {action}
         </View>
       </View>
     );
   }
   ```
2. In `apps/mobile/src/screens/MobileApp.tsx`:
   Restore root container to plain edge-to-edge:
   `<View style={styles.root}>` (no `paddingTop: insets.top`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "UI-049"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/AppPrimitives.tsx apps/mobile/src/screens/MobileApp.tsx tests/mobile/ui-foundation.spec.ts
git commit -m "feat(mobile): overhaul ScreenHeader with safe area insets and restore edge-to-edge canvas"
```

---

### Task 2: Anchor Header outside ScrollViews in Account Screens

**Files:**
- Modify: `apps/mobile/src/screens/staff/StaffAccount.tsx`
- Modify: `apps/mobile/src/screens/supervisor/SupervisorArea.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerAccount.tsx`
- Test: `tests/mobile/ui-foundation.spec.ts`

**Interfaces:**
- Produces: Anchored `ScreenHeader` outside `<ScrollView>` in all 3 Account screens.

- [ ] **Step 1: Write failing test in `ui-foundation.spec.ts`**

Assert:
- `StaffAccount.tsx` places `<ScreenHeader>` outside `<ScrollView>`.
- `SupervisorArea.tsx` places `<ScreenHeader>` outside `<ScrollView>`.
- `ManagerAccount.tsx` places `<ScreenHeader>` outside `<ScrollView>`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "Account"`
Expected: FAIL.

- [ ] **Step 3: Refactor Account screens to 2-tier anchored structure**

In `StaffAccount.tsx`, `SupervisorArea.tsx`, `ManagerAccount.tsx`:
```tsx
return (
  <View style={styles.container}>
    <ScreenHeader title="Tài khoản" subtitle="Thông tin từ phiên đăng nhập hiện tại" />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screen}>
      {/* Account content scrolls beneath */}
    </ScrollView>
  </View>
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/mobile/ui-foundation.spec.ts -t "Account"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/screens/staff/StaffAccount.tsx apps/mobile/src/screens/supervisor/SupervisorArea.tsx apps/mobile/src/screens/manager/ManagerAccount.tsx tests/mobile/ui-foundation.spec.ts
git commit -m "fix(mobile): anchor ScreenHeader outside ScrollView in Account screens"
```

---

### Task 3: Anchor Header in Operational & Form Screens

**Files:**
- Modify: `apps/mobile/src/screens/manager/ManagerCreateTask.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerDashboard.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerReview.tsx`
- Modify: `apps/mobile/src/screens/manager/ManagerTrees.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffHome.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffWork.tsx`
- Modify: `apps/mobile/src/screens/staff/StaffTrees.tsx`

**Interfaces:**
- Produces: 2-tier anchored layout across all primary tab and task creation screens.

- [ ] **Step 1: Refactor `ManagerCreateTask.tsx`**
  Move `<ScreenHeader title="Tạo việc" ... />` outside `<ScrollView>`, placing it directly inside the root container.
- [ ] **Step 2: Refactor `StaffHome.tsx`, `StaffWork.tsx`, `StaffTrees.tsx`**
  Place `ScreenHeader` above `<ScrollView>` / `<FlatList>`.
- [ ] **Step 3: Refactor `ManagerDashboard.tsx`, `ManagerReview.tsx`, `ManagerTrees.tsx`**
  Place `ScreenHeader` above `<ScrollView>` / `<FlatList>`.
- [ ] **Step 4: Run full Vitest suite**
  Run: `npm run test`
  Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/screens/manager/ apps/mobile/src/screens/staff/
git commit -m "fix(mobile): anchor ScreenHeader above scrollable lists across operational screens"
```

---

### Task 4: Integrate Safe Header in Camera & Fullscreen Proof Flows

**Files:**
- Modify: `apps/mobile/src/screens/staff/StaffProofFlow.tsx`

**Interfaces:**
- Produces: `ScreenHeader` with `dark` variant in camera and verification screens.

- [ ] **Step 1: Replace custom `Header` with `ScreenHeader`**
  In `StaffProofFlow.tsx`, replace `TaskSurfaces` `Header` with `ScreenHeader dark={isDarkMode}` so camera screens fill to Y=0 with `#020617` while controls sit safely below Dynamic Island.
- [ ] **Step 2: Test & Commit**

```bash
git add apps/mobile/src/screens/staff/StaffProofFlow.tsx
git commit -m "fix(mobile): integrate safe dark ScreenHeader in camera and proof flow screens"
```

---

### Task 5: Comprehensive Verification & Automated Monorepo Quality Gate

**Files:**
- Entire repository

- [ ] **Step 1: Run mobile typecheck**
  `npm run typecheck --workspace @novyx/mobile`
  Expected: 0 errors.
- [ ] **Step 2: Run monorepo lint**
  `npm run lint`
  Expected: 0 errors.
- [ ] **Step 3: Run full Vitest suite**
  `npm run test`
  Expected: 342+ tests pass.
- [ ] **Step 4: Run automated iOS field readiness and operational audit scripts**
  `node scripts/verify-ios-field-readiness.cjs`
  `node scripts/deep-operational-e2e.cjs`
  Expected: All PASS.
- [ ] **Step 5: Test iOS bundle export**
  `npm run mobile:export:ios`
  Expected: 0 errors, clean Hermes bytecode.
