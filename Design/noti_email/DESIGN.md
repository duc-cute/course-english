---
name: Premium EdTech System
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
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#623c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#825100'
  on-tertiary-container: '#ffcb8f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 40px
  gutter: 24px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

This design system establishes a high-trust, high-energy environment for language acquisition. It balances the rigor of academic excellence with the warmth of a supportive mentor. The personality is **motivating, accessible, and premium**, designed to reduce the friction of learning while celebrating small victories.

The visual style is a refined **Modern Corporate** aesthetic infused with **Soft Minimalism**. It prioritizes clarity and whitespace to prevent cognitive overload, using vibrant accents and friendly geometries to keep users engaged. The result is a UI that feels like an elite private tutor—professional yet deeply encouraging.

## Colors

The palette is built on a "High-Confidence" Blue, signaling authority and reliability. This is complemented by an Emerald Green that represents growth and "correctness" in a learning context. 

- **Primary (Vibrant Blue):** Used for main actions, active states, and progress indicators.
- **Secondary (Emerald Green):** Reserved for positive feedback, success states, and achievement milestones.
- **Tertiary (Amber):** Used sparingly for streaks, rewards, and cautionary notifications.
- **Neutrals (Slate Grays):** Applied to typography and borders to maintain a sophisticated, legible hierarchy against the clean white background.

## Typography

The system utilizes a dual-font strategy to balance character with readability. **Plus Jakarta Sans** provides a modern, geometric feel for headlines and UI labels, ensuring the brand feels "premium" and sharp. **Nunito Sans** is used for body copy; its slightly rounded terminals and open apertures make long-form reading comfortable and approachable, which is critical for an educational platform.

Scale headlines aggressively on desktop to create a clear entry point for lessons, but keep body text large (minimum 16px) to ensure accessibility across all age groups.

## Layout & Spacing

This design system uses a **Fluid Grid** model with high-margin containers to evoke a sense of "premium space." 

- **Desktop:** 12-column grid with a 1200px max-width container. Gutters are fixed at 24px to maintain breathability.
- **Mobile:** Single column layout with 20px side margins. 
- **Rhythm:** All vertical spacing follows an 8px baseline. Use `stack-lg` (48px) between major lesson sections and `stack-sm` (12px) for grouping related interactive elements like a question and its multiple-choice answers.

## Elevation & Depth

Visual hierarchy is achieved through **Ambient Shadows** and **Tonal Layering**. Unlike flat designs, this system uses depth to indicate interactivity:

1.  **Base Layer:** Pure white (#FFFFFF) background.
2.  **Surface Level:** Content cards use a very subtle 1px border (#E2E8F0) and a soft, diffused shadow (Y: 4, Blur: 20, Opacity: 0.05) to appear lifted.
3.  **Active Level:** When hovered or focused, cards and buttons increase their shadow spread and slightly shift Y-position to provide tactile feedback.
4.  **Overlays:** Modals and pop-overs use a heavy backdrop blur (20px) to maintain context while focusing the user's attention on the task at hand.

## Shapes

The shape language is defined by **Generous Radii**. Standard components utilize a 16px (1rem) corner radius, while large containers and featured lesson cards utilize 24px (1.5rem). This high level of roundedness removes "sharpness" from the learning experience, making the software feel friendly and safe to fail in. 

Badges, chips, and primary action buttons should use **Pill-shaped** (full-radius) styling to distinguish them from content containers.

## Components

### Buttons
- **Primary:** Gradient-filled (Blue #1D4ED8 to #3B82F6) with white text. They feature a slight "press-down" animation (scale 0.98) to mimic physical buttons.
- **Secondary:** White background with a 2px blue border. 
- **Ghost:** Text-only for less frequent actions like "Skip."

### Cards
Cards are the primary container for lessons. They must have 24px internal padding, a 16px corner radius, and a soft shadow. Use a high-contrast heading and a secondary emerald accent for "Completed" states.

### Inputs & Selectors
Form fields use a light gray background (#F8FAFC) that turns white with a 2px blue border on focus. Radio buttons for multiple-choice questions should be large (min-height 56px) with 16px rounding to be "thumb-friendly" on mobile.

### Progress Indicators
Progress bars are thick (12px height) with fully rounded caps. Use the Emerald Green color to visualize progress, providing an immediate psychological reward.

### Chips & Badges
Small, pill-shaped markers used for "Level," "Category," or "New." These use low-saturation background tints of the primary colors (e.g., light blue background with dark blue text).