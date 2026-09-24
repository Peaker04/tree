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
3. **NOVYX domain requirements:** Profile-driven proof rendering (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`), independent site verification (QR & GPS), outdoor readability, one-handed field usability, and interrupted workflow resilience.

Every future screen refactor, component creation, and code review must strictly adhere to this specification.

### 1.1 Authority and conflict resolution

This document is the normative visual and interaction authority for `apps/mobile`. Apply sources in this order:

1. Functional/domain contracts and security rules.
2. `docs/FUNCTIONAL_NON_FUNCTIONAL_REQUIREMENTS_RULES.md` for evaluative criteria and the principle-before-pattern reasoning order.
3. `docs/MOBILE_UI_RULES.md` for mobile workflow, permission, navigation, accessibility, and device constraints.
4. This `DESIGN.md` for visual hierarchy, semantic tokens, typography, spacing, surfaces, interaction hierarchy, and component governance.
5. `.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md` once B2.6 publishes it; until then, do not infer screen-specific information architecture from historical specs.
6. Historical planning artifacts only as implementation evidence; they cannot override items 1–5.

`.planning/quick/20260714-mobile-ui-ux-operational-refactor-v2/UI-SPEC.md` is historical and superseded as a normative visual source. Its permission and workflow research may be consulted, but its heavy `700/900` typography, gradient budget, legacy fallback language, and alternate spacing scale are not active design rules.

When two active documents appear to conflict, stop implementation and resolve the conflict here before editing screens. Do not silently choose whichever rule is easier.

### 1.2 Design read and operating dials

**Design read:** a trust-first field-operations application for Staff and Managers working outdoors, under interruption and unreliable connectivity. The visual language is botanical, restrained, operational, and evidence-led—not a marketing dashboard or generic card template.

| Dial             | Value | Consequence                                                                                         |
| ---------------- | ----: | --------------------------------------------------------------------------------------------------- |
| Design variance  |  3/10 | Predictable composition, stable scan paths, no decorative asymmetry.                                |
| Motion intensity |  2/10 | Press/selection/loading feedback only; no decorative motion.                                        |
| Visual density   |  6/10 | Compact operational information, controlled through hierarchy and disclosure rather than tiny text. |

The active font strategy remains the React Native system font. No font dependency is introduced merely for visual novelty. The active weight vocabulary is `400`, `500`, and `600`; heavier weights in legacy screens are migration debt and must not be copied.

### 1.3 Information hierarchy and cognitive-load contract

Every screen must order information in four layers:

1. **Orientation:** role, task/tree identity, current location in the workflow.
2. **Decision:** current state, risk, proof gap, or next valid action.
3. **Supporting evidence:** facts required to trust or complete that decision.
4. **Metadata:** IDs, timestamps, transport/debug detail, and audit data.

Layers 3–4 must not compete visually with layers 1–2. Use progressive disclosure, internal dividers, concise summaries, or focused detail screens instead of rendering all available DTO fields at equal weight.

Each context has exactly one visually dominant primary action. A block of information must trace to a functional requirement, user decision, recovery action, or audit need; otherwise remove it or defer it.

### 1.4 Harness synchronization contract

For every mobile UI task, the harness must read, in order: `AGENTS.md`, `.agents/memory/UI_UX_MEMORY.md`, `docs/MOBILE_UI_RULES.md`, this `DESIGN.md`, `.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md` when present, shared tokens/primitives, then the affected screen and state owner.

A screen is not conformant merely because it uses green tokens. Conformance requires consistent typography, spacing, surface hierarchy, action hierarchy, state completeness, accessibility, list performance, and device evidence.

### 1.5 Principles, patterns, styles, and implementation

The design system uses these layers in order:

```text
Business meaning
→ Design principle
→ Spatial composition
→ Context-appropriate interaction pattern
→ Existing design system and component
→ Tokens and styling
→ Implementation
```

- **Principles** evaluate whether a decision is clear, meaningful, prioritized, accessible, and appropriate to the workflow. They do not mandate a component or visual value.
- **Spatial composition** evaluates how content occupies and relates in space: intrinsic sizing, content-to-container ratio, proximity, grouping, rhythm, alignment, anchors, density, nesting, balance, separation, priority, and responsive allocation. It is not a fixed layout recipe.
- **Patterns** describe interaction behavior such as radio selection, progressive disclosure, master-detail, inline validation, or contextual actions. They are optional tools selected by context, not a required inventory.
- **Style** controls presentation such as fill, border, radius, icon, spacing, and emphasis. A style change must not silently change interaction semantics.
- **Tokens** encode approved visual decisions; they do not define domain meaning.
- **Components** implement selected patterns; their existence does not justify using them where the semantics do not fit.

Pattern selection must consider user goal, workflow stage, domain meaning, action frequency and risk, data scale, platform convention, accessibility, responsive behavior, and existing project patterns. Similar screenshots do not prove that two cases require the same pattern.

Screenshots are evidence for symptoms such as hierarchy, density, consistency, reflow, spatial imbalance, weak content-to-container ratio, or interaction ambiguity. Resolve the actual problem using project rules, domain flow, spatial composition, state ownership, existing components, and implementation evidence before changing the UI.

Before adding a card, fixed/minimum height, large padding, decorative surface, or viewport-filling section, verify that it contributes semantic grouping, hierarchy, interaction boundary, state distinction, visual separation, navigation context, media presentation, accessibility, or another explicit product need. Prefer intrinsic sizing and remove any container layer whose removal preserves clarity and safety.

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
 │• Warm canvas │                 │• Hairline 1px│                 │• Profile UI  │
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
> The UI must faithfully render proof requirements provided by the domain and application layers according to the assigned `ProofProfile` (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`) and Site Verification signals (`QR` & `GPS`). The design system must never provide visual shortcuts or false completion CTAs that bypass domain prerequisites.

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
12. **Production Cardinality Over Seed Cardinality:** Catalog and people-selection UI must be designed against expected production volume. One-row development data is not a valid basis for the final interaction.
13. **User Language Boundary:** Internal enums, technical profile names, English seed descriptions, raw API errors and transport metadata never appear in normal product UI.
14. **Control Semantics Must Match Behavior:** Radio, toggle, multi-select, picker, clear and change affordances must visually communicate their actual behavior.
15. **Bounded Date-Time Input:** Operational deadlines use localized date-and-time selection; canonical ISO serialization belongs at the service boundary, not in user-entered text.
16. **Calibrated Learning:** Promote a device-discovered failure into durable memory/contract/tests only when the root cause is reproducible and reusable. Keep one-off taste judgments, temporary seed artifacts and context-specific exceptions local; known failures are causal guidance, not mandatory visual templates.
17. **Content-Fit Spatial Composition:** Layout dimensions, grouping, whitespace, density and visual weight follow the information and task. Prefer intrinsic sizing; validate content-to-container ratio; use proximity, rhythm and alignment before adding containers or decoration; and avoid stretching sparse content merely to occupy the viewport.

---

## 5. Color System

### 5.0 Color System Integration

The provided color palettes are visual references and color sources, not screen-level implementation specifications.

Do not reproduce the reference images literally.

#### Principles

- Preserve the project's existing product, domain, UX, and structural design rules.
- Treat palette colors as primitives, not direct component colors.
- Map primitive colors into semantic roles before applying them to UI.
- Prefer semantic tokens over raw HEX values inside components.
- Determine color roles from actual context rather than from the position or usage shown in the reference images.
- Do not force every palette color into the product.
- A color may remain unused if no meaningful semantic role exists for it.
- Do not create different color conventions per screen.
- Reuse existing tokens when they already express the required semantic role.
- Do not introduce gradients, blur, glow, noise, shadows, or decorative treatments merely because they appear in palette reference artwork.
- Color must not be the only indicator of state or meaning.
- Verify readable foreground/background contrast before adopting a pairing.
- Preserve established status semantics; do not assign business meaning to a color solely because of its visual appearance.

#### Palette Sources

Warm / natural family:

- Honeydew — `#F0F7EA`
- Cornsilk — `#FFFAE0`
- Vanilla Custard — `#EEE59F`
- Willow Green — `#AAD480`
- Emerald — `#75C97F`

Fresh / cool family:

- Brume — `#C2F2E4`
- Menthe — `#35C8B4`
- Limonade — `#EDF7BE`
- Verveine — `#A4CF4A`

#### Intended Direction

Use the warm/natural family primarily as a foundation candidate and the fresh/cool family primarily as an accent candidate.

This is a direction, not a mandatory mapping.

The final semantic assignment must be determined after inspecting:

- existing design tokens;
- existing components;
- current color usage;
- accessibility requirements;
- product semantics;
- interaction patterns.

Prefer extending or normalizing the existing design system over creating a parallel color system.

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

### 13.2 Profile-Driven Proof UI Rules

1. **Domain State Ownership:** `docs/WORKFLOWS.md` and `docs/DOMAIN.md` strictly own business semantics, Task lifecycle state transitions, and proof policies. `DESIGN.md` owns visual presentation, tokens, stepper components, and feedback surfaces.
2. **Profile-Driven Stepper Projection:** The UI must render proof requirements provided by the domain and application layers according to the assigned `ProofProfile`:
   - `CHANGE_PROOF`: Site Verification (QR + GPS) + Before Evidence + Checklist + After Evidence.
   - `SERVICE_PROOF`: Site Verification (QR + GPS) + Checklist + Completion Photo.
   - `INSPECTION_PROOF`: Site Verification (QR + GPS) + Structured Findings + Condition Photos.
     _Note: Site Verification consists of independent QR and GPS signals; they may be captured in either order._
3. **Dynamic Stepper Projection:** Each step pill reflects domain state computed by workflow helpers:
   - `done`: Background `primarySoft`, checkmark icon, dark green text.
   - `isCurrent`: Background `limePulse`, step icon, forest green bold text.
   - `pending`: Background `card`, circle icon, pewter text.
4. **Guaranteed Valid Action:** The primary CTA button text and destination must be computed directly by `workflowState.activeActionText` and `workflowState.nextStep`. Components must never bypass prerequisite domain steps.
5. **Canonical Lifecycle States:** The UI recognizes the 7 canonical Task lifecycle states (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`). When a task is `COMPLETED` or `WAITING_REVIEW`, primary proof editing is locked down and replaced by review inspection or queue return.

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
4. **Contrast Compliance (WCAG AA minimum 4.5:1):**
   - Forest Depths (`#1c3a13`) on Snow White (`#fcfcf7`): Contrast ratio **14.2:1** (Passes AAA, well above 4.5:1 minimum).
   - Ink (`#13231a`) on Snow White (`#fcfcf7`): Contrast ratio **15.8:1** (Passes AAA, well above 4.5:1 minimum).
   - Pewter (`#64748b`) on Snow White (`#fcfcf7`): Contrast ratio **5.1:1** (Passes AA, above 4.5:1 minimum for body text).
   - **Minimum enforced:** All body text must maintain $\ge 4.5:1$ contrast; large text $\ge 3:1$.
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

## 22. Structural Reference Implementation

`apps/mobile/src/screens/staff/StaffHome.tsx` is a structural reference for state branching and grouped metrics, not a pixel-perfect template or permanent visual authority. Runtime evidence showed that its repeated summary surfaces, decorative imagery, and page length still require B2.6/B5.5 review.

### Patterns worth preserving from StaffHome:

1. **State ownership:** explicit loading, offline, actionable, waiting, completed, and standby branches.
2. **Grouped metrics:** related metrics share one surface with internal dividers.
3. **Domain-derived action:** the next task and workflow action come from shared helpers.
4. **Truthful zero state:** no assignment is presented as standby, not completion.

### Patterns that must not be copied blindly:

- Decorative hero media without a functional purpose.
- Multiple cards repeating the same zero/summary state.
- Long pages where the next action is pushed below secondary information.
- Screen-local typography, color, spacing, or radius values.

> [!IMPORTANT]
> **Adoption Guidance:** Reuse the state and information-architecture discipline, then validate the specific screen against its B2.6 contract. Do not copy-paste StaffHome markup or treat its current layout as automatic visual PASS.

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
