# NOVYX Design System

**Specification Version:** 1.0.0 (Authoritative)  
**Target Platform:** Expo SDK 57 / React Native 0.86 (Compact Android First)  
**Primary Domain:** NOVYX GreenOps — Urban Forestry Verification & Field Operations  
**Language Scope:** Vietnamese (Primary)  
**Reference Baseline:** Seed Botanical Identity + Linear Structural Precision

---

## 1. Purpose

This document is the single authoritative design specification for the NOVYX GreenOps mobile platform. It establishes a unified visual and architectural standard for all screens in `apps/mobile`, synthesizing:

1. **Seed's botanical-clinical identity:** Warm organic canvas, deep forest green authority, and restrained lime functional accent.
2. **Linear's structural precision:** Hairline borders, density discipline, 4px spacing rhythm, flat surface hierarchy, and minimal decoration.
3. **NOVYX domain requirements:** Rigorous 5-step field proof chain (GPS → QR → Before Photo → Checklist → After Photo), outdoor readability, one-handed field usability, and interrupted workflow resilience.

Every future screen refactor, component creation, and code review must strictly adhere to this specification.

---

## 2. Source Principles

```
                  ┌──────────────────────────────────────────────┐
                  │            NOVYX DESIGN SYSTEM               │
                  └──────────────────────┬───────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
 ┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
 │     SEED     │                 │    LINEAR    │                 │    NOVYX     │
 │  IDENTITY    │                 │  DISCIPLINE  │                 │    DOMAIN    │
 ├──────────────┤                 ├──────────────┤                 ├──────────────┤
 │• Warm canvas │                 │• Hairline 1px│                 │• 5-step proof│
 │• Forest tone │                 │• 4px rhythm  │                 │• Field-ready │
 │• Lime accent │                 │• Flat over   │                 │• TalkBack    │
 │• Quiet calm  │                 │  elevated    │                 │• Offline     │
 │• Restraint   │                 │• 1 CTA focus │                 │• VN wrapping │
 └──────────────┘                 └──────────────┘                 └──────────────┘
```

### 2.1 Seed Botanical Identity

- **Tone:** Scientific, trustworthy, botanical authority without marketing noise.
- **Canvas:** Warm off-white (`snowWhite` `#fcfcf7`) and muted organic stone (`warmStone` `#eeeee9`), avoiding sterile cold white.
- **Authority:** Deep near-black green (`forestDepths` `#1c3a13`) acts as primary text, dark accent, and primary action surface.
- **Functional Accent:** A single vivid lime (`limePulse` `#d3fa99`) used strictly as punctuation for active badges, step indicators, and progress highlights.
- **Weightless Restraint:** No aggressive drop shadows, no glossy glows, no decorative multi-color gradients.

### 2.2 Linear Structural Precision

- **Information Hierarchy:** Data and task hierarchy dictate layout; whitespace and typography separate content before boxes are introduced.
- **Hairline Dividers:** 1px subtle borders (`hairlineBorder` `#e6ede3`) replace drop shadows to define surfaces cleanly.
- **Density Discipline:** Controlled spacing scale based on 4px units (`4, 8, 12, 16, 20, 24`).
- **Grouped Metrics:** Shared surface with internal hairline dividers rather than floating individual card tiles.
- **Interaction Clarity:** Exactly one obvious primary action per screen context.

### 2.3 NOVYX Operational Reality

- **Field Usability:** High outdoor contrast under direct sunlight, touch targets minimum 44×44 (primary field CTAs 48–52px).
- **Diacritic Sensitivity:** Vietnamese typography requires generous line-height (`1.35x–1.5x`) and flexible vertical reflow.
- **Device Support:** Resilient on compact Android viewports (360dp–390dp width) with variable font scaling.

---

## 3. Rule Priority

When design decisions, layout trade-offs, or visual preferences conflict, apply this strict priority order:

```
Business / Functional Requirements
             ▼
Non-Functional Requirements (Performance, Offline, Memory)
             ▼
Accessibility (TalkBack, Contrast, Touch Targets)
             ▼
Design System Architecture (Tokens, Primitives)
             ▼
Visual Polish & Aesthetic Detail
```

> [!IMPORTANT]
> **Workflow Integrity Rule:** A visual rule must NEVER override a domain workflow requirement.
> For example, if the proof sequence mandates `GPS → QR → BEFORE PHOTO → CHECKLIST → AFTER PHOTO`, the UI must faithfully reflect that sequence. The design system must never provide visual shortcuts or false completion CTAs that bypass domain prerequisites.

---

## 4. Core Design Principles

1. **Domain-Driven UI:** Presentation components never invent or duplicate workflow rules. Screen components project state derived from domain helpers (`mobileWorkflow.ts`).
2. **One Clear Primary Action:** Every view has exactly one primary action (`variant="forest"` button) representing the next valid domain step.
3. **Information Before Decoration:** Communicate task status, proof progress, and urgent risks before adding decorative elements.
4. **Flat Before Elevated:** Default to flat surfaces (`Card tone="flat"` or `tone="warm"` with 0 elevation and 0 shadow). Shadows are reserved exclusively for floating overlays (e.g., bottom navigation FAB).
5. **Spacing Before Containers:** Use spacing and typography to separate content before introducing another card.
6. **Borders Before Shadows:** Define card edges with 1px hairline borders (`#e6ede3`), not blur/shadow layers.
7. **Semantic Tokens Before Literal Values:** No hard-coded hex colors (`#1c3a13`) or arbitrary numeric radii in screen styles. Always use tokens from `@novyx/ui`.
8. **State Never by Color Alone:** Every badge, alert, and status indicator must pair color with an icon and explicit text label.
9. **Reflow Instead of Clipping:** Layouts must expand vertically when font size increases or Vietnamese copy wraps; never use fixed-height containers that clip text.
10. **First-Class System States:** Loading, error, offline, empty, and waiting-review states are fully designed, first-class layouts.
11. **No Visual Effect Without Functional Purpose:** If a border, background tint, or icon does not convey domain state or assist field execution, remove it.

---

## 5. Color System

The color system separates **Primitive / Brand Tokens** from **Semantic Application Tokens**. Screens must consume semantic tokens.

### 5.1 Palette Tokens

| Category             | Token Name              | Hex Value | Primary Role                                             |
| :------------------- | :---------------------- | :-------- | :------------------------------------------------------- |
| **Canvas**           | `colors.snowWhite`      | `#fcfcf7` | Default app background, screen canvas, card body         |
| **Surface**          | `colors.warmStone`      | `#eeeee9` | Alternate section background, steppers, pill tracks      |
| **Surface**          | `colors.card`           | `#fffffb` | Clean card surface on warm background                    |
| **Surface**          | `colors.cardWarm`       | `#fbfff5` | Soft organic surface for secondary callouts              |
| **Brand Authority**  | `colors.forestDepths`   | `#1c3a13` | Primary filled action CTA, dark headers, authority icons |
| **Accent**           | `colors.limePulse`      | `#d3fa99` | Punctuation badge, current step pill, progress emphasis  |
| **Neutral Text**     | `colors.ink`            | `#13231a` | Primary titles, high-contrast headings, active text      |
| **Neutral Text**     | `colors.pewter`         | `#64748b` | Body copy, secondary descriptions, metadata              |
| **Neutral Text**     | `colors.muted`          | `#94a3b8` | Captions, timestamps, disabled indicators                |
| **Hairline**         | `colors.hairlineBorder` | `#e6ede3` | 1px card borders, table dividers, button outlines        |
| **Status Green**     | `colors.primaryDark`    | `#236236` | Success text, verified checkmark fill                    |
| **Status Green Bg**  | `colors.primarySoft`    | `#e7f6df` | Verified step background, success badge bg               |
| **Status Amber**     | `colors.amber`          | `#9f7115` | Waiting review, overdue warning, caution text            |
| **Status Amber Bg**  | `colors.amberSoft`      | `#fffae0` | Waiting review badge bg, warning card bg                 |
| **Status Danger**    | `colors.danger`         | `#c92c4a` | Rework required, validation error, offline error         |
| **Status Danger Bg** | `colors.dangerSoft`     | `#fff1f2` | Error banner bg, rework callout bg                       |
| **Status Sky**       | `colors.sky`            | `#1c7890` | In-progress tasks, GPS in-progress, informative pill     |
| **Status Sky Bg**    | `colors.skySoft`        | `#eef8fb` | In-progress badge bg                                     |

### 5.2 Semantic Token Mapping

```
Brand Primary    ───► colors.forestDepths (Action) / colors.ink (Text)
Screen Canvas    ───► colors.snowWhite
Card Surface     ───► colors.card (Default) / colors.warmStone (Subtle container)
Dividers/Borders ───► colors.hairlineBorder (1px)
Text Hierarchy   ───► colors.ink (Headings) ──► colors.pewter (Body) ──► colors.muted (Metadata)
Accent Highlight ───► colors.limePulse (Badges, Current step)
Success State    ───► colors.forestDepths / colors.primaryDark on colors.primarySoft
Warning State    ───► colors.amber on colors.amberSoft
Danger State     ───► colors.danger on colors.dangerSoft
```

### 5.3 Color Usage Rules

1. **Zero Hex Literals in Screens:** All colors must be imported from `theme/tokens`.
2. **Lime Pulse Restraint:** `limePulse` must never be used as a full-screen background or text color. It is strictly for small accent badges, current-step stepper pills, and progress track fills.
3. **No Arbitrary Page Palettes:** Do not invent green shades for particular screens.
4. **Status Independence:** Status colors (`danger`, `amber`, `sky`) are strictly for domain states, never for brand decoration.

---

## 6. Typography

Typography uses system sans-serif fonts with restrained weights to convey scientific clarity and operational efficiency.

### 6.1 Type Scale

| Role                 | Font Size       | Font Weight   | Line Height     | Letter Spacing | Usage Context                                    |
| :------------------- | :-------------- | :------------ | :-------------- | :------------- | :----------------------------------------------- |
| **Display / Hero**   | `18px` – `22px` | `600`         | `24px` – `28px` | `0`            | Screen hero titles, major metric numbers         |
| **Section Title**    | `14px` – `16px` | `600`         | `20px` – `22px` | `0`            | Card headers, task tree names, modal titles      |
| **Body Large**       | `14px`          | `500` / `600` | `20px`          | `0`            | Button text, field input text, prominent body    |
| **Body**             | `12px` – `13px` | `400` / `500` | `18px`          | `0`            | Standard instructions, descriptions, notes       |
| **Caption / Small**  | `11px` – `12px` | `500`         | `16px`          | `0`            | Field labels, stepper titles, progress captions  |
| **Metadata / Micro** | `10px`          | `500` / `600` | `14px`          | `0.2px`        | Task IDs, timestamps, badge labels, step indices |
| **Numeric Metric**   | `22px` – `24px` | `600`         | `26px`          | `-0.2px`       | Quick stat values (`--`, `85%`, `12`)            |

### 6.2 Typography Rules

- **Restrained Weights:** Standard weights are `400` (regular), `500` (medium), and `600` (semibold). Banned: widespread `800` or `900` bold shouting.
- **Vietnamese Language Support:** Vietnamese diacritics (e.g., `ẩ`, `ễ`, `ợ`, `ự`) require adequate vertical headroom. Never set `lineHeight` equal to `fontSize`. Maintain at least `1.35x` line-height.
- **No Text Shrinking as a Crutch:** Do not use `fontSize: 8` or `adjustsFontSizeToFit` to squeeze complex text into fixed containers. Let the container reflow or break into a two-line layout.
- **Tabular Numerics:** For counters, percentages, and dates, use monospaced or tabular numbers where possible to avoid jitter during updates.

---

## 7. Spacing and Layout

Layout follows a strict 4px-base rhythm adapted from Linear.

### 7.1 Spacing Scale

| Token             | Value         | Applied To                                                            |
| :---------------- | :------------ | :-------------------------------------------------------------------- |
| `spacing.xs`      | `4px`         | Step pill icon gap, tiny indicator spacing, metric dot offset         |
| `spacing.sm`      | `8px`         | Badge internal gap, list row gap, button icon-to-label gap            |
| `spacing.md`      | `12px`        | Header icon gap, card internal padding (compact), stat divider margin |
| `spacing.lg`      | `16px`        | Standard screen horizontal padding, standard card padding             |
| `spacing.xl`      | `20px`        | Major section vertical gaps, empty state padding                      |
| `spacing.xxl`     | `24px`        | Loading state vertical padding, modal container padding               |
| `spacing.screen`  | `16px`–`20px` | Screen boundary margin                                                |
| `spacing.section` | `14px`–`18px` | Stack gap between consecutive cards                                   |

### 7.2 Safe Area & Scrolling Layout

- **Screen Padding:** Standard screen horizontal padding is `16px` (`paddingHorizontal: 16`).
- **Bottom Inset for Notched Navigation:** All primary scrollable screens must set `paddingBottom: 104px` in `contentContainerStyle` to prevent the bottom navigation from obscuring content or actions.
- **Responsive Width:** Layouts must fluidly scale across device widths from `360dp` to `430dp`. Never hardcode fixed pixel widths for cards, rows, or buttons.

---

## 8. Radius System

The radius vocabulary is strictly constrained to 5 semantic levels. Arbitrary border-radius values are prohibited.

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐
│  control (8) │   │ compact (12) │   │   card (16)  │   │        pill (9999)       │
│  Text Inputs │   │ Media Thumb  │   │ Standard Card│   │ Badges / Buttons / Chips │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────────────────┘
```

| Token              | Radius Value | Approved Component Usage                                                  |
| :----------------- | :----------- | :------------------------------------------------------------------------ |
| `radius.control`   | `8px`        | Text inputs, search fields, compact controls, checkbox boxes              |
| `radius.compact`   | `12px`       | Evidence image thumbnails, stepper container shells, nested callout boxes |
| `radius.card`      | `16px`       | Standard cards (`Card`), list item surfaces, summary panels               |
| `radius.container` | `24px`       | Bottom sheet modals, full-width dialog containers                         |
| `radius.pill`      | `9999px`     | Buttons, status badges, filter chips, step pills, avatar outlines         |

---

## 9. Surfaces, Cards & Elevation

### 9.1 The Surface Hierarchy Rule

Before creating a new card, developers must evaluate whether separation can be achieved with lighter techniques:

$$\text{Whitespace} \longrightarrow \text{Type Hierarchy} \longrightarrow \text{Hairline Divider} \longrightarrow \text{Surface Tone Shift} \longrightarrow \text{Card Container}$$

### 9.2 Surface Tones

```tsx
// 1. Flat Clean Surface (Default for lists, metrics, task cards)
<Card tone="flat" style={styles.card}>...</Card>

// 2. Warm Organic Surface (For Hero context, empty states, callouts)
<Card tone="warm" style={styles.card}>...</Card>

// 3. Status Surface (For rework alerts or error notices)
<Card tone="danger" style={styles.card}>...</Card>
```

- **`tone="flat"`:** Background `#fffffb` (or `#fcfcf7`), border `1px solid #e6ede3`, `shadowOpacity: 0`, `elevation: 0`.
- **`tone="warm"`:** Background `#eeeee9`, border `1px solid #e6ede3`, `shadowOpacity: 0`, `elevation: 0`.
- **Card Nesting Prohibition:** Never put a bordered card inside another bordered card. If a section within a card requires emphasis, use a `warmStone` background container with `radius.compact` (as demonstrated by the stepper in `StaffHome`).
- **Elevation Ban:** Decorative card shadows (`elevation: 4`, large blur offsets) are prohibited on content cards. Clean 1px hairline borders provide crisp separation under sunlight.

---

## 10. Actions and Buttons

### 10.1 Button Variants

| Variant                      | Styling                                                                                         | Usage Rule                                                        |
| :--------------------------- | :---------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **`forest`** _(Primary)_     | Background `colors.forestDepths`, Text `#fff`, `radius.pill`, 0 shadow                          | Exactly one per context. Represents the next valid domain action. |
| **`outline`** _(Secondary)_  | Background `colors.card`, Border `1px solid #e6ede3`, Text `colors.ink`, `radius.pill`          | Supporting actions: "Xem chi tiết", "Kiểm tra việc", "Lịch sử".   |
| **`ghost`** _(Tertiary)_     | Transparent bg, no border, Text `colors.primaryDark` or `colors.forestDepths`                   | In-line navigation, skip actions, dismiss actions.                |
| **`danger`** _(Destructive)_ | Background `colors.dangerSoft`, Border `1px solid #fecdd3`, Text `colors.danger`, `radius.pill` | Reject report, cancel operation, destructive reset.               |

### 10.2 Size and Touch Targets

- **Field Primary (`size="field"`):** `minHeight: 52px`, `paddingHorizontal: 18px`. Designed for field staff with gloves or outdoor one-handed use.
- **Default Action (`size="default"`):** `minHeight: 48px`, `paddingHorizontal: 16px`. Standard form and modal buttons.
- **Compact Action (`size="compact"`):** `minHeight: 38px`, `paddingHorizontal: 12px`. In-card retry or table row actions.
- **Touch Target Floor:** Every interactive element must satisfy at least `44×44px` physical tap area (using `hitSlop` where visual footprint is smaller).

---

## 11. Badges, Chips and Status Indicators

Badges must communicate domain status with high information density without visual clutter.

```tsx
// Example Usage
<Badge tone="accent" pill>ƯU TIÊN XỬ LÝ TIẾP</Badge>
<Badge tone="amber" pill>CHỜ DUYỆT</Badge>
<Badge tone="danger" pill>CẦN LÀM LẠI</Badge>
<Badge tone="neutral" pill>CHƯA GIAO VIỆC</Badge>
```

### 11.1 Semantic Badge Tones

| Tone          | Background           | Border                  | Text Color            | Domain Meaning                              |
| :------------ | :------------------- | :---------------------- | :-------------------- | :------------------------------------------ |
| **`accent`**  | `colors.limePulse`   | `#c0ea82`               | `colors.forestDepths` | Actionable priority, active shift indicator |
| **`green`**   | `colors.primarySoft` | `colors.primaryBorder`  | `colors.primaryDark`  | Verified proof step, approved task          |
| **`amber`**   | `colors.amberSoft`   | `#fde68a`               | `colors.amber`        | Waiting manager review, overdue risk        |
| **`danger`**  | `colors.dangerSoft`  | `#fecdd3`               | `colors.danger`       | Rework required, validation failed          |
| **`sky`**     | `colors.skySoft`     | `#bae6fd`               | `colors.sky`          | In progress, GPS tracking active            |
| **`neutral`** | `colors.warmStone`   | `colors.hairlineBorder` | `colors.pewter`       | Standby, no assignment, unstarted item      |

---

## 12. Metrics and Data Presentation

### 12.1 The Grouped Metrics Pattern (Linear Style)

Rather than rendering individual floating metric boxes, metrics must be grouped into a single cohesive surface with hairline dividers:

```tsx
<Card tone="flat" style={styles.statsBar}>
  <Metric label="Tiến độ" value={hasNoTasks ? '--' : `${rate}%`} tone="green" bordered={false} />
  <View style={styles.statsDivider} />
  <Metric label="Cây phụ trách" value={treeCount} tone="slate" bordered={false} />
  <View style={styles.statsDivider} />
  <Metric label="Chờ duyệt" value={reviewCount} tone="amber" bordered={false} />
</Card>
```

### 12.2 Numerical Edge Case Rules

- **Zero Assigned Work:** When `totalTasks === 0`, display `'--'` for completion rate. Never show `0%`, `100%`, `NaN`, or `Infinity`.
- **Missing or Loading Data:** Render `'--'` or an inline `ActivityIndicator`, keeping card dimensions stable.
- **Font Scaling Resilience:** Metric values must use `numberOfLines={1}` and `adjustsFontSizeToFit` to accommodate 3-digit figures on narrow screens.

---

## 13. Domain-Driven Workflow UI

UI components are strict projections of underlying domain state.

### 13.1 Architecture Pipeline

```
┌─────────────────┐       ┌────────────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│   Task Data     │ ───►  │  mobileWorkflow.ts     │ ───►  │ TaskProofWorkflow    │ ───►  │ UI Projection   │
│ (Raw API / DTO) │       │  (Proof State Machine) │       │ State Object         │       │ (StaffHome, etc)│
└─────────────────┘       └────────────────────────┘       └──────────────────────┘       └─────────────────┘
```

### 13.2 Proof Sequence Rules

1. **Mandatory Step Order:** `GPS` $\rightarrow$ `QR` $\rightarrow$ `BEFORE` $\rightarrow$ `CHECKLIST` $\rightarrow$ `AFTER` $\rightarrow$ `REVIEW` $\rightarrow$ `SUBMIT`.
2. **Dynamic Stepper Projection:** Each step pill reflects one of three domain states:
   - `done`: Background `primarySoft`, checkmark icon, dark green text.
   - `isCurrent`: Background `limePulse`, step icon, forest green bold text.
   - `pending`: Background `card`, circle icon, pewter text.
3. **Guaranteed Valid Action:** The primary CTA button text and destination must be computed directly by `workflowState.activeActionText` and `workflowState.nextStep`. Components must never hardcode "Bắt đầu chụp ảnh" if GPS has not yet passed.
4. **Terminal State Lockdown:** When a task is `COMPLETED` or `WAITING_REVIEW`, the primary proof action disappears, replaced by review inspection or return to queue.

---

## 14. First-Class State Handling

The application recognizes 8 distinct operational states. A screen is never considered complete without designing for each applicable state:

```
                               ┌───────────────────────────┐
                               │   DATA SOURCE / ENGINE    │
                               └─────────────┬─────────────┘
                                             │
      ┌──────────────┬──────────────┬────────┼──────────────┬──────────────┬──────────────┐
      ▼              ▼              ▼        ▼              ▼              ▼              ▼
 ┌─────────┐   ┌───────────┐   ┌─────────┐ ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
 │ LOADING │   │  OFFLINE  │   │  ERROR  │ │ STANDBY │   │ ACTION  │   │ WAITING │   │ FULLY   │
 │         │   │  BANNER   │   │ BANNER  │ │ (NO TASKS)│ │ (NEXT)  │   │ REVIEW  │   │ COMPLETE│
 └─────────┘   └───────────┘   └─────────┘ └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

1. **`LOADING`:** Render a calm placeholder card with `ActivityIndicator` and explicit text. Do not flash empty-state messages while data is still loading.
2. **`OFFLINE`:** Render a clean top pill: `Chế độ ngoại tuyến • Đang dùng dữ liệu lưu trên thiết bị`. Keep workflows interactive using local cache.
3. **`ERROR`:** Render an actionable notice card (`Card tone="danger"`) with clear explanation and a `Thử lại` button.
4. **`STANDBY (NO_ASSIGNMENT)`:** Worker has 0 tasks assigned today. Header says "Chưa giao việc", CTA routes to `Cây của tôi`.
5. **`ACTIONABLE TASK`:** Worker has pending/in-progress/rework tasks. Priority card displays proof stepper and next valid CTA.
6. **`WAITING_REVIEW`:** All tasks submitted; waiting for manager review. Display amber badge, clear message, and quick navigation.
7. **`FULLY_COMPLETED`:** Entire shift finished and approved. Display accent badge and congratulations.
8. **`EMPTY_RESULT`:** Search/filter returns zero items. Provide an instant "Xóa bộ lọc" action.

> [!WARNING]
> **Anti-Pattern Alert:** Never equate `totalTasks === 0` with `COMPLETED`. An empty assignment list means standby, not a finished shift.

---

## 15. Progress Semantics

Progress bars must reflect true operational completion, not naive mathematical division:

| Operational Situation              | Formula / Value                    | Display Label               | Progress Fill |
| :--------------------------------- | :--------------------------------- | :-------------------------- | :------------ |
| **No tasks assigned**              | `total === 0`                      | `Chưa giao việc` / `--`     | `0%`          |
| **Active tasks in progress**       | `completed / total`                | `X / Y việc (Z%)`           | `Z%`          |
| **All submitted, awaiting review** | `completed < total`, all submitted | `Đã nộp X / Y (Z%)` (Amber) | `Z%`          |
| **Shift 100% approved**            | `completed === total`              | `Hoàn thành X / X (100%)`   | `100%`        |

---

## 16. Accessibility & Field Inclusivity

Compliance with mobile accessibility standards is mandatory:

1. **TalkBack Labels:** Every interactive element must define `accessibilityRole="button"` and a descriptive Vietnamese `accessibilityLabel` (e.g., `accessibilityLabel="Thông báo, 2 tin chưa đọc"`).
2. **Screen Reader Headers:** Major section titles must define `accessibilityRole="header"`.
3. **Touch Targets:** Tap targets must meet the minimum 44×44dp boundary.
4. **Contrast Compliance:**
   - Forest Depths (`#1c3a13`) on Snow White (`#fcfcf7`): Contrast ratio **14.2:1** (Passes AAA).
   - Ink (`#13231a`) on Snow White (`#fcfcf7`): Contrast ratio **15.8:1** (Passes AAA).
   - Pewter (`#64748b`) on Snow White (`#fcfcf7`): Contrast ratio **5.1:1** (Passes AA).
5. **Color Independence:** Ensure all colored status dots and badges are paired with descriptive text.

---

## 17. Performance & Layout Stability

1. **Zero Layout Jumps:** Reserve media dimensions (`width: 76, height: 76`) and set static min-heights on cards during loading to prevent jarring shifts when images or data resolve.
2. **Overdraw Prevention:** Never stack multiple opaque backgrounds on top of each other. If a parent view has `backgroundColor: snowWhite`, child views default to transparent unless switching to a distinct surface tone.
3. **List Rendering:** Use `FlatList` with stable `keyExtractor={(item) => item.id}` for growing lists (Work queue, Tree inventory). Avoid rendering lists inside unbounded `ScrollView`s.
4. **No Heavy Shadows / Blur:** Prohibit runtime blur filters and dynamic shadow calculation on scroll items.

---

## 18. Navigation Conventions

1. **Locked 5-Action Bottom Navigation:**
   - **Staff:** `Trang chủ` | `Cây của tôi` | `[Centered QR FAB]` | `Công việc` | `Tài khoản`.
   - **Manager:** `Tổng quan` | `Giao việc` | `[Centered QR FAB]` | `Duyệt` | `Tài khoản`.
2. **Active State Representation:** Active bottom nav item uses green icon and green text only. No background pill, no underline, no filled tab square.
3. **Intent-Driven Routing:**
   - Tapping a Task Card opens **Task Detail** (`DETAIL`).
   - Tapping the Primary CTA opens the **Next Proof Step** (e.g., `GPS` or `BEFORE`).
   - Tapping quick nav buttons routes to top-level tabs (`WORK`, `MY_TREES`).
4. **Workflow Immersion:** In full-screen focused flows (Camera capture, GPS check-in, Review detail), the bottom navigation is hidden.

---

## 19. Component Governance

Before creating any new UI component, run this 4-step governance check:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Does an existing primitive in AppPrimitives.tsx suffice? │
└──────────────────────────────┬──────────────────────────────┘
                               │ No
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Is this pattern used or planned across 2+ screens?       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Yes
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Is the distinction SEMANTIC rather than purely visual?   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Yes
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Implement as a shared semantic primitive in              │
│    AppPrimitives.tsx or TaskSurfaces.tsx                    │
└─────────────────────────────────────────────────────────────┘
```

- **Banned Redundant Components:** Do not create `StaffHomeButton`, `ManagerCard`, `TreeGreenBadge`, or `SpecialSeedBox`.
- **Composition Over Duplication:** Combine existing `Card`, `Badge`, `Button`, and `Metric` primitives.

---

## 20. Token Governance

A new design token may only be introduced if it meets all three criteria:

1. **Semantic Meaning:** It represents a distinct functional role (e.g., `borderSubtle`), not a single-use aesthetic tweak.
2. **Repeated Usage:** It is consumed across multiple screens or components.
3. **No Existing Equivalent:** No current token in `packages/ui` can fulfill the requirement.

> [!NOTE]
> All new tokens must be registered in `packages/ui/src/index.ts` first, then consumed via `apps/mobile/src/theme/tokens.ts`.

---

## 21. Catalog of Anti-Patterns

The following patterns are strictly banned in NOVYX mobile code:

| Anti-Pattern                         | Why It Is Prohibited                            | Required Alternative                                          |
| :----------------------------------- | :---------------------------------------------- | :------------------------------------------------------------ |
| **Decorative Gradients & Glows**     | Heavy rendering cost, distracting outdoors      | Flat surfaces with hairline borders (`Card tone="flat"`)      |
| **Drop Shadows on Every Card**       | Washes out under sunlight, creates visual mud   | 1px hairline border (`colors.hairlineBorder`)                 |
| **Font Weight 800/900 Everywhere**   | Visual shouting, reduces readability            | Restrained weights: `400` body, `500` labels, `600` headers   |
| **Nested Cards**                     | Wastes screen padding, creates visual confusion | Single outer card; use whitespace or subtle tone shift inside |
| **Fixed Multi-Column Grid**          | Breaks and clips text on narrow Android screens | Flexible rows that reflow or stack gracefully                 |
| **Hardcoded Hex Values**             | Destroys theming consistency                    | Always reference `colors.*` from tokens                       |
| **Duplicated Domain Logic in JSX**   | Causes synchronization bugs and invalid CTAs    | Derive state through `mobileWorkflow.ts` helpers              |
| **0/0 = 100% or 0% Fallacy**         | Misleads field staff regarding shift status     | Show `'--'` and label `Chưa giao việc`                        |
| **State by Color Alone**             | Violates accessibility for color-blind workers  | Always pair color with an icon and text label                 |
| **Clipping Long Vietnamese Strings** | Obscures vital tree/task addresses              | Allow vertical text expansion, set appropriate line-height    |

---

## 22. Approved Reference Implementation

`apps/mobile/src/screens/staff/StaffHome.tsx` is the first validated reference implementation of the Seed + Linear unified specification.

### Key Patterns Standardized in StaffHome:

1. **Header & Context:** `BrandMark` on the left, notifications button and avatar on the right.
2. **Warm Hero Card:** Contextual live status indicator (`statusDotLive`), clear operational kicker, and landscape photo thumbnail.
3. **Linear Grouped Metrics:** A single `Card tone="flat"` housing 3 unbordered metrics separated by 1px vertical hairline dividers (`statsDivider`).
4. **Shift Progress:** Clean progress bar with Seed lime accent and semantic handling of 0/0 tasks.
5. **Priority Action Card:** Clear priority badge, `#task-id`, tree info, 5-step proof stepper, and single `size="field"` primary action button.
6. **State-Driven Multi-Branch Rendering:** Explicit, separate layout branches for Loading, Actionable Task, Waiting Review, Fully Completed, and Standby states.

> [!IMPORTANT]
> **Adoption Guidance:** Do not copy-paste `StaffHome` markup into other screens. Instead, adopt its architectural discipline: flat surfaces, hairline borders, grouped metrics, restrained typography, and domain-derived actions.

---

## 23. Screen Review Checklist

Every screen refactor must pass this review checklist before merge:

### 1. Functional & Domain

- [ ] Is all workflow state derived from `mobileWorkflow.ts` rather than reconstructed in JSX?
- [ ] Is there exactly one primary action button per view representing the next valid domain step?
- [ ] Are terminal states (Completed, Waiting Review, Rework) handled with appropriate disabled or alternative CTAs?

### 2. State & Edge Cases

- [ ] Is there a designed `LOADING` state that avoids layout jump?
- [ ] Is there an `ERROR` state with a visible retry button?
- [ ] Is the `OFFLINE` mode clearly communicated?
- [ ] Is zero assigned work (`total === 0`) handled gracefully as Standby rather than 0% or 100%?

### 3. Design & Tokens

- [ ] Are all colors imported from `theme/tokens` with zero raw hex literals?
- [ ] Are border radii constrained to `control`, `compact`, `card`, `container`, or `pill`?
- [ ] Is the surface hierarchy respected (flat/warm surfaces with hairline borders, zero arbitrary drop shadows)?
- [ ] Are font weights restrained (`400`, `500`, `600`), avoiding shouting `800`/`900` bold?

### 4. Responsive & Mobile

- [ ] Does the screen render cleanly on narrow Android viewports (360dp–390dp width)?
- [ ] Do long Vietnamese strings wrap naturally without clipping?
- [ ] Is bottom padding (`104px`) provided to clear the notched bottom navigation?

### 5. Accessibility

- [ ] Do all interactive elements have `accessibilityRole` and clear Vietnamese `accessibilityLabel`s?
- [ ] Are all statuses communicated by icon + text in addition to color?
- [ ] Do all touch targets meet the 44×44dp minimum?
