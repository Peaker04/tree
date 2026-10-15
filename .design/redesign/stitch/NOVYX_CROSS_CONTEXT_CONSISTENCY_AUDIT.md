> NON-AUTHORITATIVE RESEARCH ARTIFACT
> Cross-Context Component Consistency Audit for NOVYX GreenOps.

# CROSS-CONTEXT COMPONENT CONSISTENCY AUDIT

## 1. COMPONENT CROSSWALK MATRIX

| Primitive | Specimen Anatomy | Test A Anatomy | Test B Anatomy | Status | Reason |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PrimaryAction** | Emerald, min 48dp, 16px radius, Icon + Text | Emerald, inline, pill shape | Emerald, sticky bottom, full-width, flat bottom corners | **DRIFTED** | Shape grammar (corner radii) is improvising based on layout position rather than enforcing brand DNA. |
| **SecondaryAction** | Outline/Tonal, 14px radius | Tonal wash | Outline/Warning | **CONTEXTUALLY ADAPTED** | Visual contrast adjusted appropriately for contextual importance. |
| **TaskRow / Checklist** | Highlight hover, hairline separator, no border | Hairline separator | Boxed rows / Heavy borders | **DRIFTED** | Test B reverted to generic list cards instead of maintaining the unboxed proximity style. |
| **Status Treatment** | High-level pill, row-level icon/typography | Root-level StatusPill | Repeated StatusPill on checklist rows | **DRIFTED** | Generative model ignored the semantic weight rule, returning to "pill-everything" for microstates. |
| **TonalSurface** | 16-24px soft wash grouping | Not utilized | Cornsilk wash grouping evidence placeholders | **CONTEXTUALLY ADAPTED** | Semantic grouping successfully deployed for deep execution zones. |
| **Metric Treatment** | Inline, typographical, unboxed | Proximity-grouped, no boxes | N/A | **CONSISTENT** | Preserved the exact proximity-driven anatomy required. |
| **Input / Placeholders** | 12-16px radii | N/A | Variable radii | **DRIFTED** | Image placeholders and inputs varied in corner harshness. |
| **Navigation** | 5-tab, subtle capsule, centered QR | 5-tab, subtle capsule, centered QR | Hidden | **CONTEXTUALLY ADAPTED** | Legitimate architectural hiding for focused execution. |
| **Typography Hierarchy** | Be VN Pro, 13px min, scale gaps | Followed strictly | Headings shrunk, labels became tiny near evidence | **DRIFTED** | Test B compressed metadata to fit evidence blocks, violating the 13px minimum rule. |

## 2. VISUAL GRAMMAR AUDIT

### A. CORNER / SHAPE GRAMMAR
*Drift identified.* Stitch is improvising radius per screen. Test A utilized almost exclusively pill-shapes for actions, while the Specimen specified 12-18px controls. Test B flattened the sticky button completely and boxed checklists.

### B. SURFACE GRAMMAR
*Mixed.* The Canvas (`Honeydew`) and Tonal Grouping (`Cornsilk` in Test B) worked well. However, edge density increased dramatically in Test B (Checklists and Evidence blocks started showing 1px hard borders instead of relying on the canvas).

### C. ACTION GRAMMAR
*Drift identified.* While placement must adapt (Inline vs Sticky), the internal anatomy (icon size, padding, corner radius) of `PrimaryAction` failed to remain stable across viewports.

### D. ROW GRAMMAR
*Drift identified.* Stitch fell back into generic AI card-lists in Test B for the checklist, entirely forgetting the hairline separation logic defined in Test A and the Specimen.

### E. TYPOGRAPHIC RHYTHM
*Drift identified.* Test B compressed metadata into micro-typography to save space. Legitimate density adaptation cannot violate the base readability threshold (13px).

### F. ICON GRAMMAR
*Consistent.* Rounded, medium stroke icons remained reliable across contexts. Active states translated well.

### G. DENSITY GRAMMAR
*Contextual Adaptation.* Test B successfully compressed content for deep execution without breaking the overall app framework. However, the compression mechanism used (shrinking fonts and boxing rows) was incorrect.

## 3. SPECIMEN → SCREEN DRIFT CLASSIFICATION
**Why did primitives drift?**
1. **PrimaryAction anatomy:** *UI Kit DNA underspecified.* The rule said "Inline, full-width, or sticky" but did not explicitly freeze corner radii across these states.
2. **TaskRow / Checklist boxes:** *Stitch generation improvisation.* The AI reverted to its baseline training (card-based lists) in Test B when faced with a checklist.
3. **StatusPill overuse:** *Conflicting rules / Improvisation.* Without a rigid component definition mapping "Checklist" strictly to "Icon + Text", Stitch applied "Status = Pill".
4. **Tiny Metadata in Test B:** *Stitch generation improvisation.* Forced to fit photo placeholders and checklists, the model compromised on accessible font scales.