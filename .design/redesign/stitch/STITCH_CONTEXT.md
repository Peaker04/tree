> NON-AUTHORITATIVE DESIGN EXPLORATION
> This artifact cannot override domain contracts, MOBILE_UI_RULES, DESIGN.md, screen contracts, or architecture.
> Approved decisions must be reconciled back into root DESIGN.md before implementation.

# Stitch Redesign Context Package

## Product
NOVYX GreenOps is a mobile application for field operations and urban forestry verification. The app orchestrates Staff workflows in the field and provides exception monitoring and evidence review for Managers.

## Product Character
- Trust-first field operations
- Botanical
- Restrained
- Operational
- Evidence-led

## Platform Context
- Expo / React Native mobile architecture
- Compact Android FIRST (360–393dp width prioritization)
- Physical iPhone acceptance required
- Primary Language: Vietnamese
- Outdoor usage (glare, high contrast requirements)
- One-handed usage priority
- Interruption / unreliable network considerations
- Font scaling support required
- Safe area awareness
- Minimum touch-target requirements (44x44 minimum, 48-52 for primary controls)

## Business Invariants (Do NOT Alter)
- Authenticated roles (Staff vs. Manager)
- Fixed five-action bottom navigation structure
- Domain data lifecycle & Proof profiles
- Hardware verification rules (GPS bounds, QR processes)
- Manager review outcomes (Approve, Rework, Exception, Cancel)
- Native device permissions behavior
- API payload contracts and validations
- Error states and missing networks must remain explicit (no masking)

## Screen Contracts (Condensed)
1. **Staff Home**: Orient shift, surface true next action or standby. No decorative filler.
2. **Staff Task Detail**: Show status, block reasons, gaps. State dictates the single primary proof action.
3. **Staff Proof Execution**: Camera/GPS driven. Clear preview of gathered evidence before advancing.
4. **Manager Dashboard**: Highlight exceptions natively over generic metric grids.
5. **Manager Create Task**: Streamlined single-selection paths to assign staff/tree/deadline without input fatigue.
6. **Manager Review Detail**: Stack evidence securely so manager trusts the physical outcome before deciding.

## Existing Design Principles
- *Contextual Default*: Content-to-container ratio matters; do not stretch sparse content just to fill empty screens.
- *Contextual Default*: Group via proximity and hairline separators rather than introducing deep nested cards.
- *Contextual Default*: Align secondary metadata to reduce visual competition with the current state or next action.
- *Contextual Default*: Operational list rows should size intrinsically from content.

## Exploration Goals
Stitch must explore:
- stronger information hierarchy;
- better content-to-container ratio;
- reduced unnecessary container nesting;
- appropriate information density;
- clearer focal priority;
- better spatial balance;
- stronger grouping/proximity;
- clear decision → evidence → metadata progression;
- one dominant primary action;
- better handling of sparse and dense content;
- responsive composition with long Vietnamese text.

## Non-goals (Do NOT Do This)
- Do NOT redesign business workflows.
- Do NOT invent roles.
- Do NOT invent states.
- Do NOT invent domain actions.
- Do NOT modify API behavior.
- Do NOT change permission semantics.
- Do NOT redesign offline synchronization.
- Do NOT generate production architecture.
- Do NOT create another design authority.
- Do NOT treat current screenshots as layouts to reproduce.

---

# Stitch Representative-Screen Brief

Create three materially different design directions for the six representative NOVYX mobile screens:
1. Staff Home
2. Staff Task Detail
3. Staff Proof Execution / Evidence
4. Manager Dashboard
5. Manager Create Task
6. Manager Review Detail

The variants must differ primarily through:
- spatial composition;
- grouping;
- hierarchy;
- density;
- progressive disclosure;
- focal point;
- CTA placement;
- supporting-information treatment.

They must NOT merely differ by:
- color;
- radius;
- icon style;
- decoration.

Define the three target directions as:

### Direction A — Compact Operational
High scan efficiency and operational density.

### Direction B — Calm Structured
Stronger grouping and progressive disclosure with reduced cognitive competition.

### Direction C — Field Focused
Stronger visual focal point and one-handed field-operation priority.