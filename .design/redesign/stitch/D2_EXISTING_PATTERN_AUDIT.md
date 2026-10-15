> NON-AUTHORITATIVE EXPLORATION ARTIFACT
> Selective Legacy Synthesis Audit - Mapping current application UX into D2.1 visual language.

# D2 Existing Pattern Audit

## A. PRESERVE AS-IS (Behavior & Core UX)
**1. Primary Action Singularity**
*   **Current pattern:** One dominant CTA per context (e.g., `Kiểm tra việc`).
*   **Why it works:** Prevents decision fatigue and directs the field worker clearly in high-glare, high-stress environments.
*   **Invariant:** Only one visually dominant button is active at a time. Must maintain 48dp minimum touch target.
*   **Visual changes:** Update from rigid rect/hard standard button to a softer D2.1 pill shape using `Emerald` (#75C97F) and `Deep Forest` text.

**2. Offline / Error State Semantics**
*   **Current pattern:** Explicit cache timestamps, network indicators, and inline retry buttons.
*   **Why it works:** Never masks a failure with a blank screen; keeps the operator informed of their synchronization status.
*   **Invariant:** Network state must be visible on the Home screen.
*   **Visual changes:** Remove heavy alert boxes. Map to D2.1 subtle tonal warnings (e.g., `Cornsilk` backgrounds for soft warnings).

**3. Back-Navigation & Context Preservation**
*   **Current pattern:** Predictable backward flow preserving input/proof.
*   **Invariant:** State machine ownership over back-navigation.
*   **Map to D2.1:** Native-feeling rounded return indicators. No heavy top-bar containers.

## B. PRESERVE STRUCTURE / REDESIGN VISUALS
**1. Five-Action Bottom Navigation & Centered QR**
*   **Current pattern:** Staff (Trang chủ, Cây của tôi, [QR FAB], Công việc, Tài khoản).
*   **Why it works:** Muscular memory. The QR code is a trust-first operational anchor. Tabs effectively isolate work domains.
*   **Invariant:** The layout order and centered ownership of the QR action mechanism.
*   **Visual changes:** Eliminate the heavy border shell, oversized active backgrounds, and drop-shadows. Use a softer warm/neutral surface, D2.1 rounded icon language, and a subtle capsule for active states to prevent visual competition with the main CTA.

**2. List Rows & Task Presentations**
*   **Current pattern:** Iterating items (Trees, Work orders) vertically.
*   **Why it works:** Simple scanning flow, highly scalable for React Native `FlatList`.
*   **Invariant:** Order of information (Status -> Title -> Metadata).
*   **Visual changes:** Move away from hard-boxed white cards on a grey background. Use D2.1 proximity clustering, typography scale, and subtle separators on a warm canvas.

**3. Task/Status Presentation**
*   **Current pattern:** Using color + text to define status (e.g., "Chờ duyệt").
*   **Invariant:** Never rely on color alone (Accessibility rule).
*   **Visual changes:** Replace old rigid square tags. Use D2.1 soft pill chips with botanical accent palettes (Verveine/Menthe).

## C. REPLACE (Conflicts with D2.1)
**1. Heavy Screen Headers (Profile Cards)**
*   **Current pattern:** Excessive vertical space used for a boxed profile/hero card.
*   **Conflict:** Pushes primary work below the fold; relies on legacy ERP dashboard aesthetics.
*   **Map to D2.1:** Replace entirely with a compact, inline human header (Name, Role, Network status) floating naturally at the top using typography.

**2. Metric Tiles / Boxed Grids**
*   **Current pattern:** 3 rigid rectangular boxes forcing identical geometry.
*   **Conflict:** Creates trapped whitespace, dry administrative feel.
*   **Map to D2.1:** Inline metric summaries (Number + Label) placed closely together using whitespace and scale, abandoning the bounding boxes altogether.

**3. Legacy Tokens & AppPrimitives**
*   **Current pattern:** Old sharp radii, dark monochrome green theme, heavy drop shadows.
*   **Conflict:** Eliminates the "Living Botanical" softness.
*   **Map to D2.1:** Sunset legacy UI primitives in favor of the D2.1 warm canvas (`Honeydew`), mixed radii (18-24px for major, 12-18px for controls), and `Be Vietnam Pro` typeface.

## D. CONTEXTUAL
**1. GPS / QR / Camera Viewfinders**
*   **Current pattern:** Full-screen hardware focus hiding standard navigation.
*   **Invariant:** Bottom-nav stays hidden to maximize viewport for outdoor camera/hardware actions. Focus remains strict.