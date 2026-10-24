# NOVYX GreenOps — UI Kit Spec

> Status: non-authoritative evidence.
> Active mobile UI decisions live in root `DESIGN.md` after reconciliation.
> This artifact may inform rationale but cannot override domain contracts, FR/NFR, `docs/MOBILE_UI_RULES.md`, root `DESIGN.md`, or approved screen contracts.

## 1. Design Tokens

### Color Roles
- `canvas-default`: Warm-neutral botanical (#F0F7EA Honeydew).
- `canvas-subtle`: Off-white or parchment (#FCFCF7) for slight differentiation.
- `surface-tonal`: Brume (#C2F2E4), Cornsilk (#FFFAD0), Limonade (#EDF7BE) for selective soft groupings.
- `action-primary`: Emerald (#75C97F). The sole contextual action color.
- `action-accent`: Menthe (#35C8B4), Verveine (#A4CF4A), Willow Green (#AAD480).
- `text-primary`: Deep Forest (#143826) for ink, structural emphasis, and QR utility.
- `border-hairline`: #E6EDE3 (1px).

### Typography Scale
- **Display / Heading**: Plus Jakarta Sans
  - `display-lg`: 28–30px / 700
  - `title-lg` (Screen context): 22–26px / 600–700
  - `title-md` (Section / Task): 17–18px / 600
  - `metric-lg`: 22–28px / 600
- **Body / Interface**: Be Vietnam Pro
  - `body-lg`: 15px / 400–500
  - `body-md`: 14px / 400
  - `metadata-md`: 13px / 400–500 (Floor for readable UI metadata)
  - `button-md`: 14–16px / 600
  - `nav-label-compact`: 11–12px / 500–600 (Restricted explicitly to bottom-nav)

### Iconography
- **System/Navigation**: Coherent rounded-outline icons with balanced optical size and medium stroke. ZERO Material Symbols.
- **Sizing**: Optically 20–24px.
- **CUSTOM_SCAN**: Four scan corners + 1 horizontal scan line (exclusive to center QR).
- **Touch target**: >= 48dp independent of optical icon size.

---

## 2. Component Specifications

### 2.1 Primary Action
- **Purpose**: ONE dominant contextual action per active view.
- **Anatomy**: Height >= 48dp. Icon-to-text gap: exactly 8px. Horizontal padding: 16–20px. 
- **Radius**: 16px (radius-action). Never a full oval by default.
- **Color**: Emerald (`action-primary`), Text is Deep Forest (`text-primary`). No decorative glow.
- **Typography**: `button-md` (14–16px/600 Be Vietnam Pro).
- **Icon**: 20-22px optical.
- **Arrangement**: May be inline, full-width, or sticky in focused workflows.

### 2.2 TaskRow / ChecklistRow
- **Anatomy**: Leading zone -> primary text -> supporting state -> trailing affordance (only when required).
- **Separator**: Hairline divider.
- **Rules**: Open layout using semantic proximity. Do not wrap in a four-sided card. 
- **Checklist**: Checkbox/icon + text.
- **Anti-pattern**: No trailing micro-status badge. Use inline text/icon mapping.

### 2.3 Status Badge
- **Purpose**: High-salience domain identification only.
- **Anatomy**: Rounded pill or compact badge.
- **Rules**: No pill-everything. Pair color with a coherent icon + text. Do not communicate status by color alone. Technical states stay separate from domain badges.

### 2.4 Evidence Surface
- **Purpose**: Structured grouping for media/GPS/Proof before/after.
- **Anatomy**: Tonal wash background (`surface-tonal`) or edge-to-edge layout. Minimal container styling.
- **Images**: Inherit `radius-field` or `radius-control` (12–16px).
- **Rules**: Avoid large enclosing cards with nested cards inside. Tonal adjacency > heavy borders. Missing evidence must be distinct.

### 2.5 Bottom Navigation
- **Purpose**: Core module navigation.
- **Anatomy**: True concave/notched topology around the floating center QR utility.
- **QR Center Action**: Floating circular utility (Deep Forest surface). Contains `CUSTOM_SCAN` icon. NO text label below QR.
- **Side Destinations**: `nav-label-compact` typography. Active state = green icon + green text ONLY. Inactive = muted rounded-outline + muted text.
- **Anti-pattern**: No active background capsule, pill, or shell. 
