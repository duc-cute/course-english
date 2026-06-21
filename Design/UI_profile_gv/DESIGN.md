---
name: Course English
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
  on-surface-variant: '#424754'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
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
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '700'
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
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 24px
  gutter: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The brand personality is energetic, encouraging, and academically supportive. It balances the rigor of high school curriculum with the dopamine-driven engagement of modern gaming. The interface aims to lower the barrier to learning through a friendly, non-intimidating aesthetic that celebrates small wins.

The design style is **Modern Tactile**, a fusion of clean minimalism and soft, playful skeuomorphism. It utilizes high-contrast interactive elements, vibrant accent colors for feedback, and "squishy" buttons that provide immediate visual satisfaction. The overall environment is airy and focused, using generous white space to prevent cognitive overload while using saturated color pops to direct attention to progress and achievements.

## Colors
The palette is rooted in a "Learning Blue" primary that signals trust and focus. Success and progress are exclusively handled by a vibrant green, while warnings and "streak-at-risk" states use a warm yellow. 

To support gamification, a range of vibrant tertiary accents (Purple and Pink) are reserved for rare achievements, leveling up, and special events. Surfaces are predominantly pure white, with extremely subtle linear gradients (Primary Blue at 5% opacity to White) used to differentiate background sections without adding visual weight. Text uses a deep slate neutral rather than pure black to maintain a softer, more accessible reading experience.

## Typography
The typography strategy uses a "Dual-Personality" approach. **Quicksand** is used for all headlines and display text to provide a soft, rounded, and friendly voice that feels approachable for students. **Inter** is used for all functional UI text, body copy, and instructional content to ensure maximum legibility and a professional underlying structure. 

Large display sizes use tighter letter spacing to feel more cohesive, while labels and small captions use increased letter spacing and semi-bold weights to remain legible even on smaller mobile screens during quick study sessions.

## Layout & Spacing
The layout follows a **Fluid-Fixed Hybrid** model. On desktop, content is contained within a 1200px max-width 12-column grid to prevent line lengths from becoming too long for reading exercises. On mobile, a single-column layout with 24px side margins ensures elements remain tap-friendly.

Spacing follows an 8px base grid. Interactive components (cards, buttons) are separated by `stack-md` (24px) to maintain a clean, airy feel. Progress maps and lesson paths use a centered, vertical flow to mimic the feeling of "advancing" through a journey.

## Elevation & Depth
Depth is created through **Tonal Layering** and physical metaphors rather than heavy shadows. 

1.  **Level 0 (Base):** Pure white background.
2.  **Level 1 (Cards):** White background with a 1px border of #E2E8F0. No shadow.
3.  **Level 2 (Interactive/Hover):** When a user interacts with a card or button, it gains a "thick" bottom border (4px) in a darker shade of the element's primary color, creating a 3D "pressable" effect similar to physical arcade buttons.
4.  **Level 3 (Modals):** High-diffusion, 20% opacity primary color shadows to make the element feel as if it is floating above the game board.

## Shapes
The shape language is extremely soft and welcoming. A base border-radius of 24px (rounded-xl) is applied to all primary lesson cards and containers to create a "bubbly" and safe environment. Smaller components like input fields and buttons utilize a 16px radius. Progress bars must have fully pill-shaped (rounded-full) caps to emphasize the fluid nature of the learning journey.

## Components

### Buttons
Primary buttons use a "3D" style: a solid fill with a 4px bottom offset border in a darker shade. On click, the button shifts down by 2px to simulate a physical press. Secondary buttons use a thick outline with a transparent base.

### Lesson Cards
Large-format cards featuring a 24px corner radius. They must include a prominent visual progress indicator (circular or linear bar) and a clear "Start" or "Continue" call-to-action.

### Badge Systems & Heatmaps
Badges are displayed in a centered 3 or 4-column grid. Unlocked badges are rendered in full color with a subtle inner glow; locked badges are rendered in a desaturated, 30% opacity slate. Heatmaps (for activity tracking) use a "Square-to-Round" transition where higher activity intensity results in more rounded cell corners.

### Progress Indicators
Progress bars should be thick (12px height minimum) with a secondary-colored (Green) track for completed portions and a ghost-white track for remaining portions. A subtle "sparkle" animation should trigger when the bar reaches 100%.

### Input Fields
Inputs should feel "large" with 16px vertical padding. Use a 2px border that transitions from light gray to Primary Blue on focus, accompanied by a soft blue outer glow.