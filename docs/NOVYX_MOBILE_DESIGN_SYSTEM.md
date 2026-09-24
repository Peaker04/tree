# NOVYX Mobile Design System — Implementation Reference

Status: active implementation reference
Authority: subordinate to root `DESIGN.md`, `docs/MOBILE_UI_RULES.md` and screen contracts
Platform: Expo SDK 57 / React Native / compact Android first / physical iPhone acceptance

## 1. Product expression

NOVYX GreenOps is an operational botanical product, not a generic white-card dashboard.

The interface must communicate:

- **Forest authority:** dark forest surfaces identify orientation, primary action and trusted operational context.
- **Living-system accent:** lime is a small active/verified accent, never a page background.
- **Warm field canvas:** off-white botanical canvas reduces glare without sacrificing contrast.
- **Operational precision:** hairline separators, restrained radius, concise copy and predictable alignment.
- **Evidence over decoration:** color and emphasis identify state, action or trust—not visual filler.

Design dials remain variance `3/10`, motion `2/10`, density `6/10`.

## 2. Color System Integration

The provided color palettes are visual references and color sources, not screen-level implementation specifications.

Do not reproduce the reference images literally.

### Principles

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

### Palette Sources

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

### Intended Direction

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

## 3. Token ownership

All foundational values live in `packages/ui/src/index.ts` and are consumed through `apps/mobile/src/theme/tokens.ts`.

Screens may compose semantic tokens but may not introduce new foundational colors, type sizes, weights, spacing, radii or shadows.

### Canvas and surfaces

| Role | Token | Use |
|---|---|---|
| App canvas | `colors.snowWhite` / `colors.background` | Screen background |
| Primary content | `colors.card` | Inputs, rows, grouped data |
| Secondary grouping | `colors.warmStone` | Quiet grouping and neutral callouts |
| Authority surface | `colors.forestDepths` | Hero/context surface and primary CTA |
| Hairline | `colors.hairlineBorder` | Dividers and flat boundaries |

Dark text must not be placed on authority surfaces; white text must not be placed on warm/light surfaces.

### Status surfaces

Status tokens use a three-token set: surface, border and text.

| Meaning | Surface | Border | Text |
|---|---|---|---|
| Success/verified | `successSurface` | `successBorder` | `successText` |
| Information/in progress | `infoSurface` | `infoBorder` | `infoText` |
| Warning/waiting | `warningSurface` | `warningBorder` | `warningText` |
| Critical/rework/error | `criticalSurface` | `criticalBorder` | `criticalText` |
| Neutral/standby | `neutralSurface` | `neutralBorder` | `neutralText` |

Status color is never decorative and never communicates meaning without text/icon semantics.

## 4. Typography

Use the React Native system font only until an explicit brand-font decision is approved.

| Role | Token | Typical use |
|---|---|---|
| Display | `typography.display` | Screen title or major operational identity |
| Title | `typography.title` | Modal title and major section |
| Section | `typography.section` | Group heading |
| Body strong | `typography.bodyStrong` | Selected values and row title |
| Body | `typography.body` | Instructions and supporting copy |
| Label | `typography.label` | Field labels and badges |
| Metadata | `typography.metadata` | IDs/timestamps only when required |
| Metric | `typography.metric` | Operational numbers |

Rules:

- weights: `400`, `500`, `600` only;
- Vietnamese text uses explicit line height;
- body text does not use `700/900`;
- do not shrink text to preserve a rigid layout;
- technical metadata never becomes the primary label.

## 5. Size and spacing

- Screen gutter: `layout.screenPadding` (`16`).
- Standard section gap: `layout.sectionGap` (`16`).
- Compact row gap: `layout.compactGap` (`8`).
- Minimum touch target: `controlSize.minimumTouchTarget` (`44`).
- Default control: `controlSize.default` (`48`).
- Primary field action: `controlSize.field` (`52`).
- Bottom-navigation clearance: `layout.bottomNavClearance` (`104`).

Use the existing 4px spacing scale. New one-off numeric spacing is prohibited unless it represents platform chrome or measured media geometry.

## 6. Shape language

| Component | Radius |
|---|---|
| Input/control | `radius.control` |
| Compact media/callout | `radius.compact` |
| Content surface | `radius.card` |
| Sheet/container | `radius.container` |
| Badge/chip/primary CTA | `radius.pill` |

Cards are flat. Shadows are reserved for bottom navigation, FAB, sheets and true overlays.

## 7. Component contracts

### Badge

- One line only; status badges never wrap.
- Use short user language, normally 1–3 words.
- Never show internal enums such as `CHANGE_PROOF`.
- Badge must use a semantic status token set, not white-on-white or transparent low-contrast treatment.
- Badge cannot be positioned outside the parent row because sibling copy failed to shrink.
- At larger font scale, simplify the label rather than wrapping.

### Metric group

- One grouped surface with dividers.
- Prefer two or three values in the initial viewport.
- Four values are allowed only when every label remains one line at compact width and increased font scale.
- Do not duplicate the same metrics in a second large section.

### Hero/context surface

- Use a dark authority surface when text is light.
- One title, one short supporting sentence and at most two compact signals.
- Hero is not required on every screen.
- Never pair `tone="warm"` with white hero copy.

### Selection field

- Closed state shows the selected value and `Chọn`/`Thay đổi`.
- Opens a modal/page-sheet with search and virtualized results when data can grow.
- Required single-select uses radio semantics.
- Selection replacement is explicit; no ambiguous tap-to-toggle behavior.

### Date-time picker

- Closed state shows a localized date and time.
- Opens a page-sheet calendar with month navigation and touch-sized day cells.
- Past dates are disabled.
- Time is chosen separately with bounded operational time slots.
- Confirmation is explicit; dismissing does not alter the saved value.
- Payload serialization uses ISO at the service boundary.

### Error and offline state

- User copy is Vietnamese and action-specific.
- Technical timestamps use localized display, not raw ISO strings.
- Preserve useful cached content without washing out or disabling unrelated sections.
- Diagnostic details stay in development diagnostics.

## 8. Visual acceptance

Every changed screen requires full-size device evidence for:

- normal state;
- selected/active state;
- disabled/loading/error state where relevant;
- increased text scale;
- compact-width wrapping;
- bottom-nav and safe-area clearance.

Reject the implementation when any of these occur:

- white text on a light surface;
- status badge wrapping or clipping;
- raw enum, raw ISO timestamp or raw server message;
- repeated equal-weight cards without information hierarchy;
- CTA hidden by navigation or keyboard;
- visual acceptance inferred from typecheck/export alone.
