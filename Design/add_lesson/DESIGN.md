---
name: Authoring Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444653'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#170cae'
  on-tertiary: '#ffffff'
  tertiary-container: '#3433c3'
  on-tertiary-container: '#b3b5ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar_width: 260px
  container_max_width: 1200px
  gutter: 24px
  margin_mobile: 16px
  margin_desktop: 32px
  stack_unit: 8px
---

## Brand & Style

The design system is engineered for educators and content creators. It prioritizes clarity, focus, and reduced cognitive load to facilitate the intensive process of course authoring. The personality is **Professional, Systematic, and Facilitative**.

The visual style is **Modern Minimalism**. By utilizing high levels of whitespace and a "container-first" architecture, the system directs attention to the content rather than the chrome. It draws inspiration from modern productivity tools where the interface is a quiet canvas for the user's work. It avoids unnecessary decoration, opting for subtle tonal shifts and precise alignment to communicate structure.

The target audience expects a reliable, utilitarian workspace that feels more like a professional workstation than a consumer entertainment app.

## Colors

The palette is anchored by a deep **Indigo** primary, chosen for its association with authority and focus in education. The UI relies heavily on a neutral scale of "Slate" and "Blue-Gray" to maintain a clean, institutional feel without appearing sterile.

- **Primary:** Used for high-emphasis actions, active states in navigation, and brand identification.
- **Backgrounds:** A tiered system of white (`#FFFFFF`) for main content surfaces and light grays (`#F1F5F9`) for systemic backdrops (like the sidebar and gutter areas).
- **Functional:** Success, Warning, and Error colors are used sparingly for validation feedback and status indicators, ensuring they remain high-impact when they appear.

## Typography

The design system utilizes **Inter** exclusively to ensure maximum legibility across dense data interfaces. The type hierarchy is designed to guide the eye through nested structures (lessons > sections > questions).

- **Weight Scaling:** Use `Semibold (600)` for titles and action labels to provide contrast against `Regular (400)` body text.
- **Labeling:** Small, uppercase labels with slightly increased tracking are used for metadata and category headers to provide a clear secondary layer of information.
- **Spacing:** Paragraph spacing is set to 1.5x the line height to ensure readability in long-form rich text blocks.

## Layout & Spacing

This design system uses a **Two-Panel Fixed Grid** philosophy. 

1.  **Sidebar:** A fixed-width navigation panel on the left (`260px`) provides consistent access to high-level course modules.
2.  **Authoring Canvas:** The primary workspace is a fluid container with a maximum width of `1200px` to prevent line lengths from becoming unreadable on ultra-wide monitors.

**Grid Rhythm:**
- A base unit of **8px** governs all spacing. 
- **Card Gutter:** 24px between main section cards.
- **Nested Spacing:** Inside question containers, use 16px padding to maintain a compact, "form-like" feel.
- **Mobile Adaption:** On mobile, the sidebar collapses into a drawer, and margins reduce to 16px. Cards become full-bleed to maximize the narrow horizontal space.

## Elevation & Depth

Hierarchy is communicated through **Tonal Layering** and **Subtle Outlines** rather than heavy shadows.

- **Level 0 (Background):** `#F8FAFC` — Used for the app canvas.
- **Level 1 (Cards):** `#FFFFFF` with a `1px` border of `#E2E8F0`. This is the primary surface for authoring questions.
- **Level 2 (Active/Hover):** A soft, ambient shadow (`0 4px 6px -1px rgb(0 0 0 / 0.1)`) is applied only when a card is being edited or dragged.
- **In-Set Depth:** Form fields and rich-text editors use a subtle inner shadow or a `1.5px` border to indicate interactivity and "input" potential.

## Shapes

The design system uses a **Soft (Level 1)** corner radius. 

- **Components:** Standard buttons and input fields use a `4px` (0.25rem) radius for a precise, professional look.
- **Containers:** Content cards and modal dialogs use `8px` (0.5rem) to provide a softer, more modern framing.
- **Selection Indicators:** Radio buttons and checkboxes follow standard conventions (circular and soft-square respectively) to maintain user familiarity.

## Components

### Question List Items
Individual questions are housed in white cards. Each card includes a "drag-handle" on the far left, a numerical index badge, and a set of quick-actions (Delete, Duplicate) in the top-right corner.

### Two-Panel Containers
The authoring tool utilizes a split-view where necessary: a navigation tree of questions on the left and the active rich-text editor on the right. This allows for rapid jumping between content sections.

### Rich Text Editors
Editors are borderless by default, appearing as plain text until clicked. Upon focus, a toolbar appears at the top of the container, and the border transitions to the primary Indigo color.

### Bulk Action Buttons
Located at the bottom of the question list, these use a "Ghost" button style (outline only) for secondary actions like "Import CSV" and a "Filled" style for the primary "Add New Question" action.

### Inputs & Selects
Use floating labels or clear top-aligned labels. The active state must be clearly marked with a `2px` indigo border to assist with keyboard navigation.