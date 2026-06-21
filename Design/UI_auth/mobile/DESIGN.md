---
name: Lumina Learning
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#0060ac'
  on-secondary: '#ffffff'
  secondary-container: '#64a8fe'
  on-secondary-container: '#003c70'
  tertiary: '#006229'
  on-tertiary: '#ffffff'
  tertiary-container: '#007e37'
  on-tertiary-container: '#c1ffc5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a4c9ff'
  on-secondary-fixed: '#001c39'
  on-secondary-fixed-variant: '#004883'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
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
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
The design system is engineered for a premium English Learning Management System (LMS) that balances the systematic efficiency of Notion with the gamified engagement of Duolingo. The aesthetic is clean, professional, and high-trust SaaS, utilizing a "Modern Glassmorphism" style. 

The UI should evoke a sense of clarity, progress, and approachable intelligence. By combining heavy whitespace with soft, translucent layers, the system creates a focused learning environment that feels both lightweight and technologically advanced. The target audience includes professionals and students who value a structured yet visually stimulating educational experience.

## Colors
The palette is rooted in a "Trust Blue" foundation to signal professionalism and academic reliability. 

- **Primary (#2563EB):** Used for main actions, active states, and brand-critical elements.
- **Secondary (#60A5FA):** Used for accents, illustrations, and subtle highlights to prevent the UI from feeling too heavy.
- **Success (#22C55E):** Reserved exclusively for positive feedback, completed lessons, and achievement indicators.
- **Surface & Background:** The background uses a cool-toned slate (#F8FAFC) to reduce eye strain, while card surfaces are pure white with high transparency for glassmorphism effects.
- **Text:** Deep Navy (#0F172A) provides high contrast and superior readability for long-form educational content.

## Typography
The design system exclusively utilizes **Inter** to achieve a neutral, systematic, and highly legible interface. 

The type hierarchy is designed to guide the learner's eye through complex course structures. **Display** styles are reserved for landing pages and major milestone achievements. **Headlines** utilize a tighter letter-spacing and semi-bold weights to create a strong visual anchor. **Body** text is optimized for readability with generous line heights, ensuring that vocabulary definitions and grammar explanations are easy to digest.

## Layout & Spacing
This design system uses a **Fluid Grid** model with a consistent 8px spatial scale. 

- **Desktop (1440px+):** 12-column grid, 48px side margins, 24px gutters.
- **Tablet (768px - 1439px):** 8-column grid, 32px side margins, 20px gutters.
- **Mobile (Up to 767px):** 4-column grid, 16px side margins, 16px gutters.

The spacing rhythm prioritizes "breathing room" around educational content to prevent cognitive overload. Cards and content modules should use the `lg` (40px) spacing for vertical separation on desktop, scaling down to `md` (24px) on mobile.

## Elevation & Depth
Elevation is achieved through a combination of **Glassmorphism** and **Ambient Shadows**. 

1.  **Low Elevation (Surface):** Default state for cards. Uses a white fill at 80% opacity with a `backdrop-filter: blur(12px)` and a 1px solid border at 10% opacity of the primary color.
2.  **Mid Elevation (Hover/Active):** Used for interactive elements. Adds a soft, diffused shadow: `0 10px 25px -5px rgba(15, 23, 42, 0.08)`.
3.  **High Elevation (Modals/Popovers):** Focused depth. Uses a 20% opacity shadow with a larger blur radius: `0 20px 48px -12px rgba(15, 23, 42, 0.12)`.

Avoid harsh black shadows; always tint shadows with the Neutral (#0F172A) color to maintain the premium SaaS feel.

## Shapes
The shape language is "Hyper-Friendly." To mirror the approachability of modern learning apps, the system uses a consistent 16px (`rounded-lg`) corner radius for all main containers and cards.

- **Small Components (Buttons, Tags):** 12px radius.
- **Standard Containers (Cards, Inputs):** 16px radius.
- **Large Sections (Modals, Hero areas):** 24px radius.
- **Interactive Indicators:** Fully rounded (pill-shaped) for progress bars and status badges.

## Components

### Buttons
- **Primary:** Solid Primary Blue fill, white text, 12px radius. On hover, darken the fill by 10%.
- **Secondary/Social:** White background with a 1px border (#E2E8F0), 12px radius. 
- **Ghost:** No background, Primary Blue text. Used for less emphasized actions like "Cancel" or "Skip."

### Input Fields
Inputs use a 16px radius. The default state has a light gray border (#E2E8F0). On focus, the border transitions to Primary Blue with a 3px soft outer glow (box-shadow) of the same color at 10% opacity.

### Glassmorphism Cards
The signature component. Background: `rgba(255, 255, 255, 0.8)`, Backdrop Blur: `16px`, Border: `1px solid rgba(255, 255, 255, 0.4)`.

### Progress Indicators
Linear progress bars should have a height of 8px, a light secondary-blue track, and a vibrant primary-blue or success-green fill. The ends are always rounded (pill-shaped).

### Achievement Badges
Small circular or hexagonal containers with a soft gradient background (Secondary to Primary). Use semi-transparent white overlays for icon containers within the badge to maintain the glass effect.

### Stats Cards
Utilize "Body-LG" for the numerical value and "Label-SM" for the descriptor. Icons within stats cards should be placed in a circular background with 10% opacity of the icon color.