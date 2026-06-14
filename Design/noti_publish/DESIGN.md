---
name: Lumina Learning
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
  on-surface-variant: '#434656'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747688'
  outline-variant: '#c4c5d9'
  surface-tint: '#104af0'
  primary: '#0040df'
  on-primary: '#ffffff'
  primary-container: '#2d5bff'
  on-primary-container: '#efefff'
  inverse-primary: '#b8c3ff'
  secondary: '#006b57'
  on-secondary: '#ffffff'
  secondary-container: '#58fcd4'
  on-secondary-container: '#00725d'
  tertiary: '#983121'
  on-tertiary: '#ffffff'
  tertiary-container: '#b84936'
  on-tertiary-container: '#ffece8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001355'
  on-primary-fixed-variant: '#0035bd'
  secondary-fixed: '#58fcd4'
  secondary-fixed-dim: '#2ddfb9'
  on-secondary-fixed: '#002019'
  on-secondary-fixed-variant: '#005141'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a6'
  on-tertiary-fixed: '#3f0300'
  on-tertiary-fixed-variant: '#842415'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  title-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style

The design system is engineered for the 2026 educational landscape, focusing on a "Smart Educational" aesthetic that balances high-performance academic utility with a calm, motivating atmosphere. The target audience is middle and high school students who require an interface that feels mature yet accessible, reducing cognitive load through generous whitespace and logical hierarchy.

The visual style is a hybrid of **Minimalism** and **Subtle Glassmorphism**. It utilizes depth through translucent layers and soft background blurs to create a sense of organized "floating" information. This approach differentiates the product from traditional, flat ed-tech platforms, offering a premium, high-tech experience that encourages deep focus and progress.

## Colors

The palette is centered around an **Electric Indigo** primary, chosen for its vibrancy and association with intelligence. Success states and progress bars utilize **Mint Green**, while high-priority alerts and "streaks" use **Soft Coral** to provide a warm, non-aggressive urgency.

**Light Mode:** Surfaces rely on `#F8FAFC` and pure white. Glassmorphism is achieved using `rgba(255, 255, 255, 0.7)` with a 20px backdrop blur.
**Dark Mode:** The foundation is a deep **Midnight Navy** (`#0F172A`). Depth is created through nested layers of increasing lightness rather than pure black. Accents in dark mode transition to more luminous, "neon" variants to maintain legibility and a futuristic feel.

## Typography

The design system uses **Geist** for its technical precision and exceptional legibility at small sizes, making it ideal for dense educational content and data-heavy dashboards. 

Headlines use a tighter letter-spacing and heavier weights to create an authoritative presence. Body text is optimized for long-form reading with a generous line height (1.6x). For mobile devices, display and headline sizes are scaled down to ensure content remains the primary focus without excessive scrolling. Labels and status indicators use medium weights and slight tracking to ensure clarity at a glance.

## Layout & Spacing

The design system follows a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The layout philosophy prioritizes "breathing room" to reduce academic anxiety.

A strict **8px spatial scale** governs all padding and margins. 
- **Desktop:** 32px outer margins with 24px gutters. Content is often contained in "Glass Plates" (containers with 0.7 opacity and backdrop blur).
- **Mobile:** 16px outer margins. Components reflow into a single column stack, maintaining the 16px gutter between vertical elements.
- **Sidebars:** Fixed at 280px on desktop to house navigation and teacher profiles, collapsing to a bottom navigation bar on mobile.

## Elevation & Depth

Visual hierarchy is communicated through **Soft Surface Elevation** rather than harsh shadows. 

1.  **Level 0 (Base):** Background color (`#F8FAFC` / `#0F172A`).
2.  **Level 1 (Cards):** Pure white (light) or +2% lighter navy (dark) with a 1px stroke at 10% opacity.
3.  **Level 2 (Active/Floating):** Subtle glassmorphic effect. Backdrop blur of 20px, 1px white inner border (20% opacity), and a soft, diffused shadow (`0px 10px 30px rgba(0,0,0,0.04)`).
4.  **Level 3 (Overlays/Modals):** Increased blur (40px) and a slightly darker/heavier shadow to pull the element significantly forward.

In Dark Mode, elevation is further enhanced by **Neon-Accented Borders**—thin, 1px strokes using the primary or success color at low opacity (20-30%) to define the edges of floating containers.

## Shapes

The shape language is modern and approachable. A **standard radius of 16px (1rem)** is applied to all primary containers and cards.

- **Secondary Elements:** Inputs and small chips use an 8px radius.
- **Interactive Prompts:** Primary action buttons use a 12px radius to feel distinct from background containers.
- **Avatars:** Strictly circular to denote "human" elements (teachers, peers) versus "system" elements (lessons, modules).
- **Unread Indicators:** Minimalist 8px circles (pill-shaped if containing text) for notifications.

## Components

### Notification Cards
Notification cards are the primary vessel for updates. They use a 16px+ corner radius, a subtle glassmorphic background, and a 1px border. Iconography within cards is monochromatic (Primary Indigo) to maintain a clean aesthetic.

### Buttons & Inputs
- **Primary Button:** Solid Indigo with white text, 12px radius. On hover, a subtle glow effect (box-shadow with primary color) is applied.
- **Input Fields:** 1px stroke (`#E2E8F0`). On focus, the stroke becomes Primary Indigo and gains a soft outer glow.

### Avatars & Badges
Teacher and student avatars are always circular with a 2px white border to separate them from the background. Badges for unread counts are small, high-contrast (Soft Coral) circles placed on the top-right shoulder of icons.

### Progress Indicators
Progress is visualized through "Smooth Track" bars—Mint Green fills with rounded caps, set against a low-opacity version of the same color as the track background.

### Lists
Lists are "airier" than standard tables, with 16px vertical padding between items and no horizontal dividers, using tonal changes on hover instead.