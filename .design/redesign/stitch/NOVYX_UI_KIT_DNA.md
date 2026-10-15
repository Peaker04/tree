> NON-AUTHORITATIVE EXPLORATION ARTIFACT
> Defines the primitive-level visual identity for NOVYX GreenOps.

# NOVYX VISUAL DNA — Living Botanical Operational

## 1. Shape Language & Radius Philosophy
Softness does not mean everything is a 999px pill. It comes from organic, deliberate shape relationships:
*   **Major Surfaces & Modals:** 20–24px radius. Creates a warm, approachable container that does not feel like a sharp B2B panel.
*   **Controls & Inputs:** 12–16px radius. Retains operational firmness. They feel like tools, not toys.
*   **Status Indicators:** Pill-shaped only where they denote horizontal, inline meta-status.
*   **Edges:** Drop-shadows are strictly prohibited. Elevation is achieved via tonal shifts (e.g., Honeydew to Pure White or Brume) and 1px muted hairlines.

## 2. Color Rhythm & Ratio
Color is used for rhythm and hierarchy, not background noise:
*   **Neutral-to-Accent Ratio:** 80% Canvas / 15% Tonal Sections / 5% Interactive Accent.
*   **Base Canvas:** `Honeydew #F0F7EA`. Never use harsh `#FFFFFF` or `#F3F4F6` as the root background.
*   **Ink / Text:** `Deep Forest` instead of `#000000`. Ensures high legibility without optical burning outdoors.
*   **Primary Action:** `Emerald #75C97F`. Distinct, highly visible under glare.
*   **Tonal Adjacency:** Use `Cornsilk`, `Brume`, or `Limonade` for grouping sections (e.g., Warning banners, Evidence collections) instead of line-drawing borders.

## 3. Typography Rhythm & Vietnamese Behavior
*   **Typeface:** `Be Vietnam Pro`.
*   **Diacritic Safety:** Line-height strictly maintained around 140%-150% for body text. No descender/ascender clipping for Vietnamese tones.
*   **Scale:** Operations require legibility. No system label drops below 13px (except 11-12px for bottom navigation). Body copy stays at 14-16px.
*   **Case:** Sentence case mapping brings conversational warmth. All-caps is severely restricted to tiny un-intrusive metadata.

## 4. Iconography Grammar
*   **Geometry:** Rounded, approachable, consistent family. No mixed libraries.
*   **Stroke & Fill:** Outlined (medium 2px stroke) by default to keep the UI light. Filled variants exclusively denote `Active` or `Selected` states (e.g., Bottom Nav active tab).
*   **Recognizability at 20px:** Must not be overly complex. Must remain readable under sunlight without squinting.

## 5. Visual Density & Surface Hierarchy
*   **Rule of Proximity:** Use whitespace to group related objects. Only introduce a Tonal Surface when cognitive separation is strictly required. Only introduce a Feature Surface (White/Card) when the element requires dominant focal attention.
*   **No Card-in-Card:** A parent surface contains borderless inner components.

## 6. Interaction, State & Feedback
*   **Touch Targets:** Absolute minimum 48dp for functional buttons.
*   **State Intent:**
    *   *Pressed/Active:* Slight scale down (`0.98`) to mimic physical tool actuation, rather than generating heavy ripples.
    *   *Disabled:* Muted opacity, never hidden.
    *   *Offline:* Quiet tonal indicator, not an angry red banner unless it stops the immediate task block.

## 7. Navigation & Primary Action Anatomy
*   **Navigation:** Unboxed, non-floating solid base blending smoothly into the canvas. QR capability is a physical anchor in the center, not a floating ghost button.
*   **Primary Action:** Never competes. If it governs the screen, it consumes the sticky-bottom or the terminal end of the focused container. Full-width or generous padding, impossible to miss.
## 8. Status Component Grammar (Patched)
A pill is NOT the default representation of every state.
* **Domain-level state:** Stronger visual treatment. Use StatusPill ONLY when the state must be recognized immediately as a meaningful domain status (e.g., "Chờ duyệt", "Cần làm lại", "Ngoại tuyến").
* **Row-level state:** Lighter treatment. Use leading state icons, typography + proximity, or subtle inline text. Do NOT use pills for repeated row-level microstates (e.g., "chưa xử lý", "pending sub-step").
* **Micro-state:** Minimal treatment (e.g., checkbox / radio semantics or simple progress marker).
The visual hierarchy should become quieter as information becomes more granular.

## COMPONENT GRAMMAR CORRECTION — PASS 1

### 1. Primary Action Anatomy
- Lock radius to 16px. Height 48-52dp. 
- Icon size 20-22px, Icon-to-text gap exactly 8px. Horizontal padding 16-20px. 
- May adapt placement (Inline, Full-width, Sticky-bottom) but internal anatomy/radius must NOT mutate into full pills (999px).

### 2. Button & Shape Grammar
- PrimaryAction: rounded rectangle (16px).
- SecondaryAction: same family, lower weight.
- IconAction: compact control.
- StatusChip: Pill permitted ONLY when semantically justified.
- NavigationActiveIndicator: subtle capsule.
- Do NOT pill-everything.

### 3. Row Grammar
- TaskRow, ChecklistRow, EvidenceRow: Leading zone -> primary text -> supporting state -> trailing affordance.
- Use hairline dividers. DO NOT default to four-sided borders or isolated mini-cards per row.
- ChecklistRow: Checkbox/icon + text. MUST NOT become a card.

### 4. Status Grammar
- Domain-level (High-salience): StatusPill allowed.
- Row-level: Inline text/icon/checkbox/progress marker. NO trailing pills on every checklist row.
- Micro-state: Minimal.

### 5. Typography Floor
- Body: >= 14px. Metadata/supporting: >= 13px. Buttons: >= 14px. Nav labels: >= 11-12px.
- NEVER solve space pressure by shrinking Vietnamese text below 13px (No 10px labels). Wrap or scroll instead.

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
- Maintain distinct Comfortable and Compact modes without mutating primitive anatomy. Compact does NOT mean miniature labels or broken geometry.
