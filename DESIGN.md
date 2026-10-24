# NOVYX Mobile Design System

**Status:** authoritative mobile visual and interaction contract  
**Direction:** Living Botanical Operational  
**Platform:** Expo SDK 57 / React Native 0.86 / compact Android first  
**Language:** Vietnamese primary

## 1. Purpose and authority

NOVYX GreenOps is a trust-first field-operations product for Staff and Managers working outdoors, one-handed, under interruption and unreliable connectivity. The interface is botanical, calm, operational and evidence-led. It is not a marketing landing page, generic Material dashboard, enterprise ERP or decorative card template.

Apply mobile UI authority in this order:

1. Functional, domain, authorization, security and data-integrity contracts.
2. `docs/FUNCTIONAL_NON_FUNCTIONAL_REQUIREMENTS_RULES.md` for contextual reasoning and review.
3. `docs/MOBILE_UI_RULES.md` for workflow, navigation, device, accessibility and field-use invariants.
4. This root `DESIGN.md` for active visual hierarchy, spatial composition, semantic color, typography, shape and component grammar.
5. Approved `.planning/NOVYX_MOBILE_SCREEN_CONTRACTS.md` for screen-level jobs, information order, actions, states and acceptance evidence.
6. `docs/NOVYX_MOBILE_DESIGN_SYSTEM.md` as a subordinate implementation reference.
7. Historical plans, `.design/`, `.stitch/`, generated specimens and screenshots as non-authoritative evidence only.

When active sources conflict on an invariant, stop implementation and reconcile the conflict here. Contextual defaults may be adapted only when the user task and device evidence justify a smaller local deviation.

Existing pill-action, sub-13px metadata, repetitive-card and shadow-heavy source is migration debt. This authority does not claim that every current screen already conforms.

## 2. Design read and operating dials

**Living Botanical Operational** combines:

- botanical warmth without green-on-green saturation;
- native operational familiarity;
- strong next-action hierarchy;
- evidence and state before decoration;
- stable scanning on compact devices;
- restrained but authored composition.

| Dial             | Value | Consequence                                                                             |
| ---------------- | ----: | --------------------------------------------------------------------------------------- |
| Design variance  |  4/10 | Predictable task flow with enough compositional variation to avoid template repetition. |
| Motion intensity |  2/10 | Press, selection, loading and state-transition feedback only.                           |
| Visual density   |  6/10 | Compact operational information without tiny type or crowded touch targets.             |

## 3. Reasoning order

Every material UI decision follows:

```text
Business meaning
→ User goal
→ Design principle
→ Spatial composition
→ Candidate interaction pattern
→ Existing design system
→ Component / token
→ Implementation
```

A screenshot identifies symptoms; it does not select a pattern or dimension. Before adding a card, fixed height, large padding or decoration, audit content-to-container ratio, intrinsic sizing, grouping, proximity, rhythm, alignment, visual anchors, density, nesting, separation, priority and responsive behavior.

## 4. Information and action hierarchy

Render information in this order:

1. **Orientation:** role, task/tree identity and workflow location.
2. **Decision:** current state, risk, proof gap or next valid action.
3. **Supporting evidence:** facts required to act or trust the decision.
4. **Metadata:** IDs, timestamps, transport and audit detail.

Layers 3–4 must not compete with layers 1–2. Use progressive disclosure rather than rendering every DTO field.

Each state has exactly one visually dominant primary action. Secondary, tertiary and destructive actions remain distinct. Duplicate CTA intent is prohibited.

## 5. Spatial and surface grammar

Use the minimum boundary that preserves meaning:

```text
Whitespace
→ Typography
→ Hairline divider
→ Tonal region
→ Contained surface
→ Overlay elevation
```

### 5.1 Surface roles

- **Canvas:** warm neutral application background.
- **Tonal region:** borderless or lightly separated grouping for related information.
- **Contained surface:** a real object, decision or evidence group that needs a boundary.
- **Evidence surface:** media, GPS, QR, checklist or proof comparison.
- **Status notice:** actionable loading, offline, warning, error or recovery context.
- **Overlay:** sheet, modal, floating navigation or camera control.

Do not make every semantic group a card. Do not nest bordered cards. Content surfaces use zero elevation; shadows are reserved for true overlays, the bottom navigation and its QR utility.

A screen normally uses at most one dominant tonal region. Other regions remain neutral unless semantic state requires a status surface.

## 6. Color system

Palette values are primitive color sources. Screens consume semantic roles, not palette names or raw hex values.

### 6.1 Foundation roles

| Role           | Direction                     | Purpose                                                      |
| -------------- | ----------------------------- | ------------------------------------------------------------ |
| Canvas         | warm off-white / snow neutral | Main screen background and visual rest.                      |
| Content        | near-white neutral            | Inputs, rows and contained content.                          |
| Quiet grouping | warm stone                    | Low-emphasis grouping without card framing.                  |
| Primary action | Emerald family                | The one contextual progression action.                       |
| Authority      | deep forest                   | Limited orientation, trusted identity and global QR utility. |
| Information    | Brume / sky family            | In-progress or explanatory state.                            |
| Waiting        | Cornsilk / amber family       | Attention, waiting and caution.                              |
| Verified       | subtle success family         | Confirmed or accepted state.                                 |
| Critical       | rose family                   | Error, rework, cancellation and destructive state.           |
| Accent         | Limonade / Verveine           | Small progress or selection punctuation only.                |

### 6.2 Color rules

- Primary action and brand authority are separate roles; deep forest is not the default fill for every interactive element.
- Large green backgrounds are reserved for real authority or orientation needs.
- Status color is never decorative and never communicates meaning without text or icon semantics.
- Do not assign every icon a green container.
- Neutral areas must provide visual rest between operational clusters.
- A screen must not introduce its own foundational palette.
- Raw screen-level colors are prohibited except documented map, camera, QR-rendering or platform-surface requirements.
- All body text must meet WCAG AA contrast of at least `4.5:1`; large text requires at least `3:1`.

## 7. Typography

Use the React Native system font until a separate approved brand-font decision exists.

| Role              |            Size |    Weight | Line height | Use                                             |
| ----------------- | --------------: | --------: | ----------: | ----------------------------------------------- |
| Display           |       `22–26px` |     `600` |   `28–34px` | Screen title or major operational identity.     |
| Title             |       `18–20px` |     `600` |   `24–28px` | Focused decision or sheet title.                |
| Section           |       `16–18px` |     `600` |   `22–25px` | Semantic group heading.                         |
| Body strong       |       `14–16px` | `500–600` |   `20–24px` | Selected value, action label or prominent body. |
| Body              |       `14–16px` |     `400` |   `20–24px` | Instructions and supporting content.            |
| Label / metadata  | at least `13px` |     `500` |   `18–20px` | Labels, timestamps and secondary facts.         |
| Compact nav label |       `11–12px` | `500–600` |   `14–16px` | Bottom navigation only.                         |
| Metric            |       `22–28px` |     `600` |   `28–34px` | Decision-relevant operational value.            |

Rules:

- Product UI weights are `400`, `500` and `600`; `700/800/900` are migration debt.
- Vietnamese text requires explicit line height and vertical reflow.
- Do not shrink text to preserve a rigid layout.
- Do not disable font scaling for readable product content.
- Metadata never becomes the primary label.

## 8. Spacing and size

Use the existing 4px spacing rhythm.

| Role                        |     Value |
| --------------------------- | --------: |
| Compact gap                 |   `4–8px` |
| Content gap                 |    `12px` |
| Screen gutter               |    `16px` |
| Section rhythm              | `16–24px` |
| Minimum touch target        | `44×44dp` |
| Default control height      |    `48dp` |
| Primary field action        |    `52dp` |
| Bottom-navigation clearance |   `104dp` |

Fixed or minimum dimensions require a real interaction, media, accessibility, platform or product reason. Long Vietnamese copy expands vertically.

## 9. Shape grammar

| Role                       |    Radius | Use                                                             |
| -------------------------- | --------: | --------------------------------------------------------------- |
| Compact control            |  `8–12px` | Small utility and dense controls.                               |
| Primary action             |    `16px` | Contextual progression action; never a full oval by default.    |
| Input / selector           | `12–16px` | Fields and selection controls.                                  |
| Content / evidence surface | `16–20px` | Real contained objects and proof groups.                        |
| Sheet / overlay            | `24–28px` | Temporary elevated surfaces.                                    |
| Pill                       |      full | Status badges, chips, avatars and the circular QR utility only. |

Do not repeat one radius everywhere. Shape must communicate component role, not merely softness.

## 10. Actions and buttons

### Primary action

- one dominant action per state;
- Emerald semantic role;
- `16px` rounded rectangle;
- height `48–52dp`;
- label `14–16px / 600`;
- icon `20–22px` with `8px` gap;
- supports disabled, loading, pressed and error recovery;
- may be inline, full-width or persistent only when the screen contract requires it.

### Secondary action

Lower visual weight through neutral outline or quiet tonal treatment. It must not compete with the primary action.

### Ghost / utility action

Used for inline navigation, dismissal and low-risk support. It retains a `44×44dp` target.

### Destructive action

Uses critical semantics, remains separated from normal progression and collects user-owned rationale when the business contract requires it. Destructive commands may not submit fabricated or hard-coded reasons.

Primary field-action labels should normally remain one line. When long approved Vietnamese copy cannot be shortened safely, allow intrinsic vertical growth rather than truncation.

## 11. Badges, rows and status

### Badges

- reserved for concise domain-level state requiring salience;
- one line, normally one to three words;
- never expose internal enums;
- never become the default trailing decoration for every row.

### Rows

Use open layout and semantic proximity:

```text
leading identity/state
→ primary text
→ supporting fact
→ trailing affordance only when actionable
```

Row-level state normally uses inline icon, text, checkbox or progress. Growing task, tree, staff and review collections use virtualized lists with stable keys.

## 12. Metrics and progress

Metrics are grouped by decision purpose, not by visual tile count. Prefer one semantic region with internal alignment or dividers. Two or three initial values are normal; four require compact-width and increased-font evidence.

A grouped metric pattern does not require a `Card`, `MetricPill`, `metricsBar` style name or any private component anatomy.

Progress reflects domain truth:

- no assignments: `—`, never false completion;
- active work: completed over total;
- pending sync: locally safe but not server-authoritative;
- waiting review: submitted but not completed;
- completed: server-approved terminal state.

## 13. Domain-driven workflow UI

Presentation projects authoritative domain and application state. It does not invent workflow transitions.

- `docs/DOMAIN.md` and `docs/WORKFLOWS.md` own lifecycle and proof semantics.
- Shared workflow helpers own the next valid action and proof gaps.
- QR and GPS are independent verification signals unless a higher domain contract says otherwise.
- Opening a detail screen never silently starts a task.
- Waiting-review and completed tasks do not expose proof-editing actions.
- Targeted rework preserves unaffected accepted evidence.

## 14. First-class states

Every applicable screen designs:

- loading;
- success;
- empty and filtered-empty;
- offline/authenticated cache;
- error and retry;
- validation;
- permission rationale, denied-retry and blocked-settings;
- submitting;
- pending sync;
- conflict;
- terminal success.

Opening a required picker is interaction-in-progress, not validation failure. Preserve entered data and captured evidence across retry and Back.

## 15. Accessibility and adaptivity

- Interactive targets are at least `44×44dp`; primary field actions are normally `48–52dp` high.
- Interactive elements expose role, Vietnamese label, state and hint when needed.
- Major screen and section titles expose header semantics.
- Status uses text/icon meaning in addition to color.
- Layout supports `360–430dp` widths, long Vietnamese copy, increased font scale, keyboard and safe areas.
- Focused workflows own predictable Back behavior and may hide global navigation.
- Visual acceptance requires compact Android and physical iPhone evidence when the changed contract calls for both.

## 16. Navigation

The five-action notched navigation remains locked.

- Staff: `Trang chủ`, `Cây của tôi`, centered QR utility, `Công việc`, `Tài khoản`.
- Manager: `Tổng quan`, `Giao việc`, centered QR utility, `Duyệt`, `Tài khoản`.
- Active side destinations use green icon and text only; no active pill or filled tile.
- The QR utility is circular, centered and distinct from the contextual primary action.
- Focused device, evidence and review flows may hide bottom navigation.

## 17. Component and token governance

Before adding a primitive or token:

1. confirm no existing semantic equivalent exists;
2. identify at least two real consumers unless the component owns unique navigation/device semantics;
3. prove the distinction is semantic, not cosmetic;
4. add foundational tokens to `packages/ui` before screen consumption;
5. avoid dependencies for behavior covered by React Native, Expo or existing project code.

A component's existence never justifies using it where its semantics do not fit.

## 18. Performance and layout stability

- Growing collections use `FlatList` or `SectionList` with stable keys.
- Reserve media geometry where loading would otherwise cause layout jumps.
- Avoid opaque background stacking and content-card shadows.
- Do not add memoization without an evidenced render cost.
- Device listeners and async work clean up on unmount.
- Map and camera exceptions remain isolated from ordinary screen styling.

## 19. Anti-patterns

Prohibited in new or touched UI:

- pill-everything;
- green-on-green page composition;
- every group wrapped in a bordered card;
- card-inside-card;
- content-card shadows;
- `700/800/900` product typography;
- metadata below `13px` outside compact navigation;
- state communicated only by color;
- decorative gradients, glow or blur;
- raw enum, raw ISO, internal ID or raw API error as product copy;
- placeholder-only field labels;
- unvirtualized production catalogs;
- fixed-height text containers that clip Vietnamese;
- primary actions with no handler or false destination;
- destructive commands with fabricated rationale;
- tests that make private style/component identifiers into design contracts.

## 20. Screen review checklist

### Functional and FR/NFR

- [ ] User/job, entry/exit and authoritative business rules are recorded.
- [ ] Information order is orientation → decision → evidence → metadata.
- [ ] The state has one valid primary action.
- [ ] Destructive, authorization, data-loss and failure paths are resolved.
- [ ] Production data scale and virtualization boundary are explicit.

### Composition and design system

- [ ] Spatial root cause is identified before selecting a component.
- [ ] Whitespace, typography and dividers were tried before another container.
- [ ] The screen uses at most one dominant tonal region.
- [ ] Primary action uses the approved action grammar.
- [ ] Body and metadata respect the typography floor.
- [ ] Status color has text/icon meaning.

### Native mobile

- [ ] Touch targets, roles, labels, states and header semantics are present.
- [ ] Compact width, long Vietnamese copy, keyboard, safe area and font scale are covered.
- [ ] Loading, empty, error, offline, retry and success are covered where applicable.
- [ ] Back preserves active workflow input/evidence.
- [ ] Physical-device evidence status is stated honestly.

## 21. Evidence policy

`.design/`, `.stitch/`, generated specimens, screenshots and historical UI-SPECs are non-authoritative evidence. Approved reusable decisions must be reconciled into this file before implementation. Runtime source and current device evidence override stale examples, but neither may silently redefine domain or accessibility invariants.
