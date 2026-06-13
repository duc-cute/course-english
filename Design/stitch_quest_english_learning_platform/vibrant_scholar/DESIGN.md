---
name: Vibrant Scholar
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e5'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fe'
  surface-container: '#eeedf9'
  surface-container-high: '#e8e7f3'
  surface-container-highest: '#e2e1ed'
  on-surface: '#1a1b23'
  on-surface-variant: '#444655'
  inverse-surface: '#2f3039'
  inverse-on-surface: '#f1effb'
  outline: '#757686'
  outline-variant: '#c5c5d7'
  surface-tint: '#324eda'
  primary: '#2d4bd7'
  on-primary: '#ffffff'
  primary-container: '#4b66f1'
  on-primary-container: '#fdfaff'
  inverse-primary: '#bac3ff'
  secondary: '#7b24dc'
  on-secondary: '#ffffff'
  secondary-container: '#9547f7'
  on-secondary-container: '#fffbff'
  tertiary: '#296800'
  on-tertiary: '#ffffff'
  tertiary-container: '#368400'
  on-tertiary-container: '#f3ffe5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee0ff'
  primary-fixed-dim: '#bac3ff'
  on-primary-fixed: '#00105a'
  on-primary-fixed-variant: '#0932c3'
  secondary-fixed: '#eddcff'
  secondary-fixed-dim: '#d8b9ff'
  on-secondary-fixed: '#290055'
  on-secondary-fixed-variant: '#6200bc'
  tertiary-fixed: '#87fe45'
  tertiary-fixed-dim: '#6be026'
  on-tertiary-fixed: '#082100'
  on-tertiary-fixed-variant: '#1f5100'
  background: '#fbf8ff'
  on-background: '#1a1b23'
  surface-variant: '#e2e1ed'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '800'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '700'
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
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is engineered for a high-energy, gamified educational environment. It prioritizes engagement, psychological safety, and "fun-first" learning for a young audience (ages 6-15). The aesthetic is **Playful Modernism**, characterized by soft geometries, tactile depth, and a high-chroma palette that signals excitement rather than academic "work."

The emotional goal is to transform the anxiety of language learning into the dopamine-driven loop of gaming. We achieve this through:
- **Expressive Motion:** Bouncy, elastic transitions that make the UI feel alive.
- **Character-Centricity:** Ample space for vector mascots to guide the user.
- **Low Friction:** Oversized touch targets and clear, singular calls to action.
- **Friendly Depth:** Soft, tinted shadows that make elements look "squishy" and interactive.

## Colors

This design system utilizes a high-contrast, multi-tonal palette designed to celebrate progress and define clear functional zones.

- **Primary (Learning Blue):** Used for core navigation, interactive elements, and information density.
- **Secondary (Smart Purple):** Reserved for "level up" moments, specialized grammar tasks, and premium features.
- **Success Green:** A vibrant, high-saturation green used exclusively for positive feedback, correct answers, and progress bars.
- **Action Yellow:** High-energy highlight color for tips, streaks, and warnings.
- **Neutrals:** We avoid pure black to maintain friendliness. Off-whites and cool grays provide a clean canvas that prevents the vibrant colors from causing visual fatigue.

## Typography

The typography strategy focuses on readability for emerging readers. **Quicksand** is used for headlines due to its rounded terminals and open apertures, which mirror the "friendly" nature of the brand. **Nunito Sans** serves as the workhorse for body text, providing a highly legible, geometric structure that remains clear even in dense quiz formats.

**Hierarchy Guidance:**
- Use **Display** sizes for achievement screens and celebratory "Level Up" states.
- Use **Label-LG** (Uppercase/Bold) for navigation tabs and button text to increase perceived "actionability."
- All text should maintain a high contrast ratio against backgrounds to ensure accessibility for children with varying visual needs.

## Layout & Spacing

The design system employs a **Fluid Grid** model with generous safe areas. The goal is to maximize whitespace to focus the student's attention on one task at a time.

- **Mobile:** Single-column layout. Cards take up 100% of the available width minus margins.
- **Tablet:** 2-column layout for dash-style views; centered single-column for focus modes (lessons).
- **Desktop:** 12-column grid. Max-content width of 1140px. Gutters are kept wide (20px-24px) to maintain a "breezy" and uncrowded feel.

**Vertical Rhythm:** We use a strict 8px-based spacing system to ensure all components feel mathematically balanced even when using large rounded corners.

## Elevation & Depth

This system avoids traditional "floating" shadows in favor of **Tactile Layering**. Surfaces should feel like physical pieces of plastic or cards stacked on a table.

- **Soft Tactility:** Use low-blur, high-spread shadows tinted with the primary color (e.g., a Blue shadow for a Blue button) to create a "3D" effect.
- **Active State Depth:** Buttons should use a 3D-press effect (moving the element 4px down on click) rather than a simple color change.
- **Layering:**
    - **Level 0 (Background):** Soft pastels or off-white.
    - **Level 1 (Cards):** Pure white with a 2px "inner-border" look or a subtle drop shadow.
    - **Level 2 (Pop-ups/Dialogs):** High-diffusion shadows with a semi-transparent backdrop blur to keep the background context visible.

## Shapes

The shape language is dominated by **Max-Radius** geometry. Sharp corners are strictly prohibited to avoid an "institutional" feel.

- **Base Components:** 1rem (16px) radius for standard cards and buttons.
- **Large Containers:** 2rem-3rem (32px-48px) for major layout sections or dashboard modules.
- **Icons:** All icons must have rounded caps and joins. Avoid thin lines; use a 2px-3px stroke weight minimum to ensure they look "chunky" and friendly.

## Components

### Buttons (The "Action" Engine)
- **Primary:** Oversized, 3D effect with a darker bottom border (e.g., Learning Blue with a 4px Indigo bottom border). On hover, it brightens; on active, it shifts down 4px.
- **Ghost:** Thin borders, transparent centers, used for secondary "Back" or "Skip" actions.

### Progress Tracks
- Thick, rounded tracks (16px height) using Success Green for the fill. 
- Include a "mascot head" or "star icon" as the progress thumb to show position.

### Cards
- White backgrounds with a subtle, colored border (1px) that matches the category of learning (e.g., Purple for Grammar, Blue for Vocab).
- Heavy internal padding (24px) to ensure content doesn't feel cramped.

### Input Fields
- Extra large height (56px) with rounded corners. 
- Focus state uses a 3px border in Learning Blue.

### Chips & Badges
- Used for rewards and XP counts. Always include an icon (e.g., a gold coin or lightning bolt) and use bold, high-contrast colors.

### Character Guidance
- Mascot containers should be placed consistently in the bottom-left or top-right of the viewport. Speech bubbles must use the same "3" roundedness level with a distinct tail pointing toward the character.