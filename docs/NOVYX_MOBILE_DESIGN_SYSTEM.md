# NOVYX Mobile Design System — Implementation Reference

**Status:** active implementation reference  
**Authority:** subordinate to domain/security contracts, FR/NFR, `docs/MOBILE_UI_RULES.md`, root `DESIGN.md` and approved screen contracts  
**Platform:** Expo SDK 57 / React Native / compact Android first / physical iPhone acceptance

## 1. Product expression

NOVYX GreenOps uses the **Living Botanical Operational** direction:

- warm neutral canvas with selective semantic tonal regions;
- Emerald as the contextual primary-action role;
- deep forest for limited authority/orientation and the global QR utility;
- evidence and state before decoration;
- open rows, hairline dividers and intrinsic layout before contained surfaces;
- low motion and field-readable density.

Design dials: variance `4/10`, motion `2/10`, density `6/10`.

Current source that still uses pill primary actions, sub-13px metadata, repetitive cards, shadows or heavy weights is migration debt. This reference does not claim current visual conformance.

## 2. Token ownership

Foundational values live in `packages/ui/src/index.ts` and are consumed through `apps/mobile/src/theme/tokens.ts`. Screen styles may not invent foundational colors, type sizes, weights, radii, shadows or spacing scales.

Later foundation waves may rename or replace legacy tokens after caller migration. Until then, map existing tokens by semantic role rather than palette name.

## 3. Color roles

| Semantic role | Direction | Usage |
|---|---|---|
| Canvas | warm off-white | Screen background and visual rest. |
| Content | near-white neutral | Inputs, rows and contained content. |
| Quiet grouping | warm stone | Borderless low-emphasis grouping. |
| Primary action | Emerald | One contextual progression action. |
| Authority | deep forest | Limited trusted orientation and global QR utility. |
| Information | Brume / sky | In-progress or explanatory state. |
| Waiting | Cornsilk / amber | Waiting, attention and caution. |
| Verified | subtle success | Confirmed state without green saturation. |
| Critical | rose | Error, rework, cancellation and destructive state. |
| Accent | Limonade / Verveine | Small progress or selection punctuation. |

Rules:

- screens consume semantic roles, not raw palette colors;
- primary action and brand authority are not the same role;
- status uses a surface/border/text triplet plus text or icon meaning;
- green icon containers are not a default;
- normally use at most one dominant tonal region per screen state;
- map/camera/QR/platform exceptions remain isolated and documented.

## 4. Typography

Use the React Native system font.

| Role | Size | Weight | Use |
|---|---:|---:|---|
| Display | `22–26px` | `600` | Screen identity. |
| Title | `18–20px` | `600` | Focused decision or sheet. |
| Section | `16–18px` | `600` | Semantic group. |
| Body strong | `14–16px` | `500–600` | Selected value and action label. |
| Body | `14–16px` | `400` | Instructions and supporting content. |
| Label / metadata | at least `13px` | `500` | Labels, timestamps and secondary facts. |
| Compact navigation | `11–12px` | `500–600` | Bottom navigation only. |
| Metric | `22–28px` | `600` | Decision-relevant operational values. |

Rules:

- weights are `400`, `500` and `600`;
- Vietnamese uses explicit line height and intrinsic reflow;
- do not shrink text or disable scaling to preserve rigid geometry;
- technical metadata remains lower priority than user decisions.

## 5. Size and spacing

- screen gutter: `16px`;
- section rhythm: `16–24px`;
- compact gap: `4–8px`;
- content gap: `12px`;
- minimum touch target: `44dp`;
- default control: `48dp`;
- primary field action: `52dp`;
- bottom-navigation clearance: `104dp`.

Use the existing 4px rhythm. Fixed dimensions require a media, interaction, accessibility, platform or product reason.

## 6. Shape grammar

| Component role | Radius |
|---|---:|
| Compact control | `8–12px` |
| Primary action | `16px` rounded rectangle |
| Input / selector | `12–16px` |
| Content / evidence surface | `16–20px` |
| Sheet / overlay | `24–28px` |
| Badge / chip / avatar / QR utility | pill or circle |

Do not use a full oval for the default primary action. Do not repeat one radius across unrelated components.

## 7. Surface grammar

Use the minimum boundary:

```text
whitespace → typography → hairline → tonal region → contained surface → overlay
```

- **Tonal region:** quiet grouping, normally without four-sided border.
- **Contained surface:** a real object, decision or evidence block.
- **Evidence surface:** media/GPS/QR/checklist grouping.
- **Status notice:** loading/offline/error/recovery.
- **Overlay:** elevated sheet, modal or floating navigation.

Content surfaces have zero elevation. Card nesting and decorative shadow stacks are prohibited.

## 8. Component contracts

### Button

- variants: primary, secondary, ghost and destructive;
- primary is Emerald, `16px` radius and `48–52dp` high;
- one dominant primary action per state;
- disabled, loading, pressed and recovery states are owned by the primitive;
- destructive actions collect user-owned rationale when required.

### Badge

- short one-line domain-level status only;
- normally one to three words;
- never raw enums;
- not a default trailing row decoration.

### Row

- open layout with semantic proximity and hairline separation;
- primary text, supporting state and trailing affordance only when actionable;
- row-level state uses text/icon/checkbox/progress before a badge;
- growing collections are virtualized.

### Metric group

- group values by decision purpose, not visual tile count;
- normally two or three values in the initial viewport;
- grouped metrics do not require a card or a named private style;
- do not duplicate metrics elsewhere on the same screen.

### Selection field

- closed state shows current value and `Chọn`/`Thay đổi`;
- growing results use a searchable virtualized sheet;
- required single-select uses radio semantics;
- replacement and clear behavior are explicit.

### Date-time picker

- localized closed summary;
- arbitrary future date plus bounded time selection;
- past dates disabled;
- explicit confirmation;
- cancellation does not mutate the saved value;
- ISO serialization occurs at the service boundary.

### Notice and operational states

- Vietnamese action-specific copy;
- cached/offline state remains readable and recoverable;
- errors preserve input and evidence;
- diagnostics remain separate from user copy.

## 9. Accessibility and native behavior

- interactive targets are at least `44×44dp`;
- interactive elements expose Vietnamese role, label and state;
- major screen and section titles expose header semantics;
- color never carries status alone;
- content supports long Vietnamese, increased font scale, keyboard and safe areas;
- focused workflows own predictable Back behavior;
- visual acceptance is blocked until required compact Android and iPhone evidence is reviewed.

## 10. Governance

A primitive or token is added only when:

1. no existing semantic equivalent exists;
2. at least two real consumers need it, except unique device/navigation owners;
3. the distinction is semantic rather than cosmetic;
4. it belongs in the architecture owner named by `AGENTS.md`.

`.design/`, `.stitch/` and historical UI specs are non-authoritative evidence. Approved decisions must be reconciled into root `DESIGN.md` before implementation.
