---
name: Fluent Edge
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#434655'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
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
  tertiary: '#525657'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b6e70'
  on-tertiary-container: '#eff1f3'
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
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  margin-mobile: 16px
  container-max: 1200px
---

## Brand & Style

The design system is engineered for a high-end educational experience that balances the gamified encouragement of modern language apps with the structured clarity of professional productivity tools. It targets lifelong learners and professionals who value efficiency and a premium feel.

The aesthetic is a hybrid of **Minimalism** and **Modern Corporate**, utilizing expansive white space, precise typography, and subtle depth to reduce cognitive load. The emotional response is one of "focused momentum"—the UI feels light and responsive, making the daunting task of language acquisition feel manageable and sophisticated.

## Colors

This design system utilizes a structured blue-scale palette to denote progress and interaction. 

- **Primary & Secondary:** A vibrant gradient from `#2563EB` to `#60A5FA` is reserved for primary actions, progress bars, and "level up" moments.
- **Surface & Background:** Pure white (`#FFFFFF`) is used for primary content cards, while the tertiary light gray (`#F8FAFC`) provides subtle contrast for page backgrounds to define layout boundaries.
- **Typography:** Deep slate (`#1E293B`) is used for headlines, while the neutral slate (`#475569`) handles body text and UI labels to maintain a soft, accessible reading experience.
- **Semantic Accents:** Success (Emerald), Warning (Amber), and Error (Rose) colors should be desaturated to fit the "SaaS" aesthetic while remaining clear.

## Typography

The typography system relies exclusively on **Inter** to achieve a systematic, utilitarian, yet modern appearance. 

- **Headlines:** Use tighter letter spacing and heavier weights (600-700) to create a strong visual hierarchy.
- **Body Text:** Set at 16px (md) or 18px (lg) for maximum readability during long reading or grammar sessions.
- **Labels:** Used for micro-copy, navigation items, and data points, employing medium weights to ensure legibility at smaller scales.
- **Mobile Scaling:** Display and Large Headlines must scale down significantly on mobile devices to prevent excessive line wrapping in lesson modules.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. Content is centered within a 1200px container on desktop, while utilizing a fluid 12-column grid system for internal dashboard elements.

- **Rhythm:** An 8px linear scale (referenced as 4px base units) governs all padding and margins. 
- **Grid:** Use a 24px gutter for desktop and tablet. On mobile, transition to a 1-column layout with 16px side margins.
- **Vertical Rhythm:** Larger sections (like Lesson Cards vs. Vocabulary Lists) should be separated by 40px (xl) to provide clear visual breathing room.

## Elevation & Depth

This design system uses **Ambient Shadows** and **Tonal Layers** to establish hierarchy without the clutter of heavy borders.

- **Level 0 (Background):** Surface color `#F8FAFC`.
- **Level 1 (Cards/Sidebar):** White surface with a very soft, diffused shadow: `0px 1px 3px rgba(0,0,0,0.05), 0px 10px 15px -3px rgba(0,0,0,0.02)`.
- **Level 2 (Dropdowns/Modals):** White surface with a more pronounced "Dribbble-style" shadow: `0px 20px 25px -5px rgba(0,0,0,0.05), 0px 10px 10px -5px rgba(0,0,0,0.02)`.
- **Interaction:** On hover, Level 1 cards should subtly lift (translate -2px) and increase shadow density to provide tactile feedback.

## Shapes

The shape language is "Friendly Professional." Every container, button, and input field uses a **16px (1rem)** corner radius as the standard.

- **Standard (16px):** Main cards, buttons, and input fields.
- **Large (24px):** Hero sections and large promotional banners.
- **Small (8px):** Tooltips and nested tags.
- **Full (Pill):** Used exclusively for progress bars and "Status" chips (e.g., "In Progress," "Mastered").

## Components

### Buttons
- **Primary:** Gradient background (`#2563EB` to `#60A5FA`), white text, 16px height-relative padding.
- **Secondary:** White background with a 1px border of `#E2E8F0`. On hover, a light blue tint surface.
- **Ghost:** No background, primary color text. Used for less frequent actions like "Skip" or "Cancel."

### Learning Specifics
- **Progress Bars:** Thick 12px height, pill-shaped, with a subtle inner-glow effect on the filled portion.
- **Vocabulary Cards:** Level 1 elevation, 16px rounding, featuring a "play audio" icon in the secondary color.
- **Inputs:** 16px rounded, 1.5px border in light gray (`#E2E8F0`), transitioning to primary blue on focus with a 4px soft outer glow.

### Navigation
- **Sidebar:** Clean, vertical layout using 14px Medium labels. Active states indicated by a primary blue vertical bar on the left and a subtle light blue background wash.
- **Top Bar:** Blurrable background (Glassmorphism effect) when scrolling, keeping the "Progress Tracking" stats visible at all times.