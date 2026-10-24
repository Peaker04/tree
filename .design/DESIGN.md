# NOVYX GreenOps — Design DNA & Principles

> Status: non-authoritative evidence.
> Active mobile UI decisions live in root `DESIGN.md` after reconciliation.
> This artifact may inform rationale but cannot override domain contracts, FR/NFR, `docs/MOBILE_UI_RULES.md`, root `DESIGN.md`, or approved screen contracts.

## 1. Identity
**Living Botanical Operational**

Core character:
- Botanical, warm, alive
- Calm, human, trustworthy
- Field-operational
- Vietnamese-first
- Consumer-mobile friendly
- High-legibility
- Restrained
- Non-generic

**Must Not Be**:
- Generic Material
- Enterprise ERP
- Military/rugged
- Shadow-heavy

## 2. Design Principles
- **Semantic Proximity before Containers**: Hierarchy comes from typography, alignment, and whitespace before drawing a card. 
- **Visual Weight follows Semantic Weight**: Important content has the most obvious visual gravity.
- **Functional Clarity over Decorative Symmetry**: Alignment and layout support scanning, not symmetry for its own sake.
- **Use the minimum boundary needed**: Whitespace -> typography -> hairline -> tonal region -> contained surface.
- **Do not solve density by shrinking text**: Content below 13px is illegible in the field.
- **Do not make every semantic group a card**: Contextual density may vary while component anatomy remains stable.
- **Composition strength**: When all colors are removed, hierarchy must still be clear.
- **No global skeleton**: Do not hard-code a single layout template for all screens.

## 3. Shape Grammar
Softness comes from organic proportion, not just maximum border radius:
- Large Surfaces: 18–24px.
- Controls & Inputs: 12–18px.
- PrimaryAction: 16px rounded rectangle; never a full oval by default.
- Status Badges: Rounded badge only for domain-level state when semantically justified.
- Navigation: True concave/notched topology around the floating center QR utility. Active side destinations use green icon and green text only.

*Do NOT repeat identical rounded rectangles everywhere.*

## 4. Surface Grammar
- **Canvas**: Warm neutral background.
- **Tonal Region**: Grouping via wash, without explicit card framing.
- **Feature Surface**: High-importance content/action.
- **Evidence Surface**: Structured grouping for media/GPS/Proof.
- **Overlay / Sheet**: Elevated surface.
- **Navigation Surface**: Dedicated bottom nav.

*Do NOT convert every group into a Feature Surface or card-in-card.*

## 5. Spatial Composition
- Build hierarchy primarily through semantic proximity, whitespace, tonal adjacency, typography, alignment, and varied visual mass.
- Dense operational clusters followed by breathing zones.
- Use neutral rest areas and selective Brume/Cornsilk tonal regions; reserve Emerald for important action.
- Evidence/images can act as a visual anchor.
- Overlapping and asymmetric visual mass where appropriate to break generic dashboard feel.

## 6. Anti-Patterns
- MUST NOT: Use card-inside-card.
- MUST NOT: Make every semantic group a card.
- MUST NOT: Use identical radii everywhere.
- MUST NOT: Use shadow-heavy structures.
- MUST NOT: Uniformly badge everything (pill-everything).
- MUST NOT: Build generic AI Material dashboards.
- MUST NOT: Give unrelated actions the same secondary color.
- MUST NOT: Impose standard card grids everywhere.
- MUST NOT: Use green-on-green everywhere.
- MUST NOT: Make dark marketing hero imagery a global rule.
- MUST NOT: Render documentation labels and numbered headings as product copy.
- MUST NOT: Use generic `label-sm` (11px) outside navigation.
