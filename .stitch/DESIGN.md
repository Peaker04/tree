# NOVYX Living Botanical Operational - UI Kit DNA v1

> Status: non-authoritative evidence.
> Active mobile UI decisions live in root `DESIGN.md` after reconciliation.
> This artifact may inform rationale but cannot override domain contracts, FR/NFR, `docs/MOBILE_UI_RULES.md`, root `DESIGN.md`, or approved screen contracts.
STITCH DESIGN SYSTEM CONTRACT

## 1. Identity
The visual identity is "Living Botanical Operational".
Core character: botanical, warm, alive, calm, human, trustworthy, field-operational, Vietnamese-first, consumer-mobile friendly, high-legibility, restrained, and non-generic.
MUST NOT BE: generic Material, enterprise ERP, military/rugged, or shadow-heavy.

Approved visual evidence:
- **Specimen A — Core Visual Language:** `507dcfe250b549a7a968f96d82314603`.
- **Specimen B — Operational Patterns, revised:** `b9d38fb52ee1486ea70eeb4277412f65`.

Both specimens are visual evidence, not product-screen templates. Repository domain, workflow, navigation, accessibility, and data-integrity contracts override obsolete generated content.

## 2. Design Principles
* Semantic Proximity before Containers. Hierarchy comes from typography, alignment, and whitespace before drawing a card. 
* Visual weight follows semantic weight. 
* Functional clarity over decorative symmetry.

## 3. Color Roles
* **canvas-default**: Warm-neutral botanical family (Honeydew #F0F7EA). Not full-screen saturated green, nor pure white or clinical gray.
* **canvas-subtle**: Off-white or parchment for slight differentiation when needed.
* **Tonal Surfaces**: Brume #C2F2E4, Cornsilk #FFFAD0, Limonade #EDF7BE. Used for selective soft groupings.
* **PrimaryAction**: Emerald #75C97F. The sole contextual action color. Do not use competing green action roles.
* **Accents**: Menthe #35C8B4, Verveine #A4CF4A, Willow Green #AAD480. Do not use decorative green-on-green overload.
* **Deep Forest**: Ink, structural emphasis, and QR utility elements. High contrast without blinding black.

## 4. Typography
* **Plus Jakarta Sans**: headings, display anchors, and large metrics only.
* **Be Vietnam Pro**: body, metadata, forms, buttons, navigation, status, and all operational text.
* **Scale**:
  - Screen title: 22-26px / 600, Plus Jakarta Sans
  - Section title: 16-18px / 600, Plus Jakarta Sans
  - Large metric: 22-28px / 600, Plus Jakarta Sans
  - Body: 14-16px / 400, Be Vietnam Pro
  - Labels: 13-14px / 500, Be Vietnam Pro
  - Button: 14-16px / 600, Be Vietnam Pro
  - Metadata: >= 13px, Be Vietnam Pro
  - nav-label-compact: 11-12px / 500-600, Be Vietnam Pro
* **Behavior**: Sentence case. Wrap long Vietnamese strings naturally; do not force one-line truncation where meaning is lost. Do not solve density by shrinking body or metadata. No other readable UI metadata may use <13px. No excessive ALL CAPS.

## 5. Iconography
* **System/navigation grammar**: Coherent rounded-outline icons with balanced optical size and medium stroke.
* **Domain grammar**: Rounded, medium-stroke icons from one consistent family.
* **Sizing & state**: Optically 20-24px. Touch targets MUST remain >= 48dp independent of optical icon size.
* **Restrictions**: No emoji as structural icons. No arbitrary colored icon enclosures. State meaning must not depend on color alone.

## 6. Spacing
* Spacing creates rhythm, separates unrelated regions, and groups related data. Large 24-32px spacing is NOT automatic; it separates major semantic zones.

## 7. Shape Grammar
Softness comes from organic proportion, not just maximum border radius:
* **Large Surfaces**: 18-24px.
* **Controls & Inputs**: 12-18px.
* **PrimaryAction**: 16px rounded rectangle; never a full oval by default.
* **Status Badges**: Rounded badge only for domain-level state when semantically justified.
* **Bottom Navigation**: True concave/notched topology around the floating center QR utility. Active side destinations use green icon and green text only.
Do NOT repeat identical rounded rectangles everywhere.

## 8. Surface Grammar
* **Canvas**: Warm neutral background.
* **Tonal Region**: Grouping via wash, without explicit card framing.
* **Feature Surface**: High-importance content/action.
* **Evidence Surface**: Structured grouping for media/GPS/Proof.
* **Overlay / Sheet**: Elevated surface.
* **Navigation Surface**: Dedicated bottom nav.
Do NOT convert every group into a Feature Surface or card-in-card.

## 9. Action Grammar
* **PrimaryAction**: ONE dominant contextual action per active view. Emerald surface, 16px radius, >= 48dp height, Be Vietnam Pro 14-16px / 600, 20-22px icon, and 8px icon/text gap. It may be inline, full-width, or sticky in a focused workflow, but is never a full oval by default.
* **Secondary / Tertiary**: Supportive and lower weight (outline, text, or utility icon).
* **Danger**: Unmistakable and separated from normal progression.
* **Global QR**: A distinct navigation utility; it must not steal hierarchy from the contextual PrimaryAction.

## 10. Navigation
Explicitly document:
* **STAFF**: Trang chủ / Cây của tôi / CENTER QR / Công việc / Tài khoản
* **MANAGER**: Tổng quan / Giao việc / CENTER QR / Duyệt / Tài khoản
* **Side destination active state**: Green icon + green text only.
* **Inactive side destination**: Muted rounded-outline icon + muted text.
* **Center QR**:
  - floating circular utility
  - real concave/notched nav topology
  - CUSTOM_SCAN = four scan corners + horizontal scan line
  - no text label below QR
  - not a Material FAB
* **Behavior**: Safe-area aware. Focused execution MAY hide bottom navigation when entering a contained workflow.

## 11. Status & Feedback
Visual weight strictly follows semantic weight:
* **Domain-level state**: A badge is allowed when the state needs high-salience identification.
* **Row-level state**: Use icon, text, checkbox, or progress. No trailing micro-status badge.
* **Technical state**: Upload, sync, and offline feedback stays separate from business task state.
* **Rule**: Do not uniformly badge everything and do not communicate status by color alone.

## 12. Lists / Task Rows
* **TaskRow / ChecklistRow**: Open layout using semantic proximity, readable text hierarchy, and hairline separators.
* Do not wrap each row in a four-sided card.
* Do not add a trailing micro-status badge; use inline icon/text, checkbox, or progress appropriate to the row semantics.
* Preserve contextual density variation without mutating the component anatomy.

## 13. Evidence / Proof and Domain Vocabulary
Support only NOVYX concepts evidenced by the repository:
* tasks;
* before/after evidence;
* GPS verification;
* Tree QR verification;
* proof completeness;
* upload/sync and offline state;
* review and targeted rework.

Before/after evidence remains a paired, structured comparison. Feedback states pair a coherent icon with concise text. Do not introduce unsupported field measurements, sensor data, industrial telemetry, hardware counts, or external certification vocabulary.

## 14. Forms
* Min 48dp targets, 12-16px radii inputs, readable text.

## 15. Empty / Loading / Offline
* Feedback is calm and operational. Offline states remain visible but do not shout with massive red cards unless a task is blocked. Transitions preserve layout and geometry.

## 16. Focused Execution Flows
* Focused execution MAY hide bottom navigation when entering a contained workflow (e.g., deep evidence collection or review) if the repository screen contract requires it.
* Sticky PrimaryAction is used when persistent action access is required, not as a universal detail-screen rule.
* Keep the current decision, evidence, and one PrimaryAction reachable without unrelated dashboard content.

## 17. Accessibility
* Min interactive target 48dp. Contrast must pass outdoor glare requirements. Non-color-only communication.

## 18. Responsive / Device Behavior
* Compact Android first (360-393dp), with physical iPhone acceptance.
* Operational examples use real compact mobile content width, readable spacing, and field-usable density even when displayed on a wider specimen canvas.
* Preserve predictable safe-area margins, long Vietnamese wrapping, font scaling, and >= 48dp touch affordance.

## 19. Anti-Patterns
* MUST NOT: Use card-inside-card; make every semantic group a card; use identical radii everywhere; use shadow-heavy structures; uniformly badge everything; build generic AI Material dashboards; give unrelated actions the same secondary color; impose card grids; use green-on-green everywhere; make dark marketing hero imagery a global rule; or render documentation labels and numbered specimen headings as product copy.
* Product interfaces must not render design-commentary phrases. Documentation may name principles such as tonal adjacency, but generated product UI must show realistic NOVYX operational content instead.

## 20. Stitch Generation Rules
* Model MUST be `GEMINI_3_8_FLASH`. 
* Use valid DOM mappings conforming strictly to this visual DNA.

## COMPONENT GRAMMAR CORRECTION — PASS 1

### 1. PrimaryAction Anatomy
- Radius: 16px rounded rectangle. Height: 48-52dp.
- Label: Be Vietnam Pro, 14-16px / 600.
- Icon: 20-22px. Icon-to-text gap: exactly 8px. Horizontal padding: 16-20px.
- May adapt placement (inline, full-width, or sticky in a focused workflow) but internal anatomy must NOT mutate into a full oval.

### 2. Button & Shape Grammar
- PrimaryAction: Emerald rounded rectangle, 16px radius.
- SecondaryAction: Same family, lower weight.
- IconAction: Compact control with a >= 48dp target.
- StatusBadge: Rounded badge permitted only for semantically justified domain-level state.
- NavigationActiveIndicator: none; active side destination uses green icon + green text only.
- Do not uniformly badge everything.

### 3. Row Grammar
- TaskRow, ChecklistRow, EvidenceRow: leading zone -> primary text -> supporting state -> trailing affordance only when the row action requires it.
- Use semantic proximity and hairline dividers. Do not default to four-sided borders or isolated mini-cards per row.
- ChecklistRow: checkbox/icon + text. It must not become a card or receive a trailing micro-status badge.

### 4. Status Grammar
- Domain-level state: StatusBadge allowed.
- Row-level state: inline text/icon/checkbox/progress marker; no trailing micro-status badges.
- Technical state: upload/sync/offline feedback remains separate from business state.

### 5. Typography Floor
- Body: >= 14px, Be Vietnam Pro.
- Metadata/supporting: >= 13px, Be Vietnam Pro.
- Buttons: >= 14px, Be Vietnam Pro.
- nav-label-compact: 11-12px, Be Vietnam Pro. No other readable UI metadata may use < 13px.
- Never solve space pressure by shrinking Vietnamese text below these floors. Wrap, reflow, disclose, or scroll instead.

### 6. Surface & Edge Grammar
- Use minimum edge strength required. Canvas -> none. TonalRegion -> no border. EvidenceSurface -> slight definition for containment. Row -> hairline. 

### 7. Evidence Surface Inheritance
- Image/camera/GPS placeholders must use `radius.field` or `radius.control` (12-16px). Do not invent new geometry. 

### 8. Icon-to-Text Rhythm
- Inside controls: icon size 20-22px, gap 8px. Do not randomly stretch spacing.

### 9. Tonal Surface Spacing
- Standard TonalSurface: 16px padding.
- Compact TonalSurface: 12px padding. 
- FeatureSurface: 16-20px.
- EvidenceSurface: 12-16px. No arbitrary per-block padding.

### 10. Density Adaptation
- Maintain distinct comfortable and compact compositions without mutating primitive anatomy.
- Compact does not mean miniature labels, broken geometry, desktop-width operational content, or reduced touch affordance.

### 11. Spatial Composition
- Build hierarchy primarily through semantic proximity, whitespace, tonal adjacency, typography, alignment, and varied visual mass.
- Use neutral rest areas and selective Brume/Cornsilk tonal regions; reserve Emerald for important action.
- Use the minimum boundary needed: whitespace -> typography -> hairline -> tonal region -> contained surface.
- Do not mechanically wrap every semantic group in a card. Contextual density may vary while component anatomy remains stable.
