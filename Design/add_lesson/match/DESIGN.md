---
name: Skyward Scholar
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#424754'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
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
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-xl:
    fontFamily: Lexend
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-xl:
    fontFamily: Lexend
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Lexend
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Lexend
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1024px
  content-max: 640px
  gutter-desktop: 32px
  gutter-mobile: 16px
  stack-gap: 24px
---

## Brand & Style

This design system is built to transform K-12 English language acquisition into an immersive, rewarding adventure. The brand personality is optimistic, energetic, and encouraging—acting more like a digital "tutor-friend" than a traditional textbook. It prioritizes clarity and emotional resonance to reduce the cognitive load often associated with learning a second language.

The visual style is **Tactile / Modern**, drawing inspiration from contemporary mobile gaming. It utilizes "squishy" UI elements that respond to user interaction with physical metaphors. The interface avoids flat, sterile layouts in favor of depth, bounce, and vibrant character-driven feedback. Every interaction should feel like a small celebration, reinforcing the "Reward & Motivation" loop essential for younger learners.

## Colors

The palette is anchored by **Sky Blue**, a trustworthy and playful primary hue that directs focus to functional elements. **Vibrant Emerald** is reserved exclusively for "Success" states and correct answers, creating a strong psychological link between the color and achievement. **Bright Gold** serves as the "Reward" accent, used for experience points, leveling up, and streaks.

The background uses a soft **Off-white** to minimize eye strain while maintaining a high-contrast environment for accessibility. Subtle geometric patterns (circles, zig-zags) in a 2% opacity tint of the primary color can be layered over the background to add texture and a sense of "play" without distracting from the instructional content.

## Typography

The design system utilizes **Lexend** across all levels. Lexend was specifically designed to reduce visual stress and improve reading proficiency, making it the ideal choice for an EdTech platform. 

Headlines are set with an "Extra Bold" weight to create a friendly, "chunky" aesthetic that feels approachable. For younger users, the `body-xl` scale is the default for reading exercises to ensure maximum legibility on tablets and mobile devices. All type should maintain generous line heights to prevent "crowding" of text, which can be intimidating for early-stage language learners.

## Layout & Spacing

This design system follows a **Fixed-Fluid Hybrid** model. While the outer containers are fluid to accommodate various tablet and phone sizes, the core learning content is constrained to a `content-max` width of 640px. This vertical "column" focus mimics social media feeds, keeping the user's attention centered and preventing long line lengths that hinder reading comprehension.

Spacing follows an 8px base grid. In learning modules, vertical spacing is intentionally exaggerated (`stack-gap`) to separate distinct tasks or questions. This "one thing at a time" philosophy reduces anxiety. Layouts should utilize large safe-area margins to ensure the "tactile" buttons are never too close to the screen edges, preventing accidental taps.

## Elevation & Depth

To achieve the "squishy" and "bouncy" feel, this design system avoids traditional, fuzzy drop shadows. Instead, it uses **Tonal 3D Offsets**. 

Interactive elements (buttons, cards) feature a solid, darker-toned bottom border (typically 4px to 8px) that creates a physical sense of height. When an element is pressed, it translates downward along the Y-axis and the bottom border disappears, providing immediate tactile feedback that the "button" has been pushed into the screen. 

Secondary elevation is handled via **Soft Tonal Layers**, where containers are slightly darker or lighter than the background, separated by a crisp 2px stroke in a muted neutral tone.

## Shapes

The shape language is defined by **Extreme Rounding**. With a `roundedness` level of 3, all primary UI components like cards, buttons, and progress bars use pill-shaped or "super-elliptical" corners. 

This lack of sharp edges removes the "institutional" feel of traditional software, making the platform feel safe and toy-like. For specific decorative elements or "correct/incorrect" modal overlays, the roundedness may even increase to create a circular or "blob" aesthetic that feels organic and friendly.

## Components

### 3D Action Buttons
The primary action buttons must be "chunky." They use a 4px bottom-offset shadow of a darker shade of the button color. The text inside should be `label-bold` and centered. On `:active` states, the button shifts down 4px.

### Progress Tracks
Unlike standard thin loading bars, progress bars here are thick (at least 20px height) with a "gloss" highlight on the top half. The bar should "grow" with a spring-physics animation when a user completes a task.

### Lesson Cards
Cards should have a white background, a 2px stroke of `surface_border_hex`, and a 4px bottom offset to match the button style. They serve as containers for multiple-choice answers or vocabulary images.

### Reward Chips
Small, floating badges that use the `tertiary_color` (Gold). These are used to highlight "New," "Streak," or "Bonus" items. They should have a slight 5-degree rotation to look "tossed" onto the screen rather than strictly aligned.

### Feedback Modals
Full-width sheets that slide up from the bottom. For correct answers, the sheet background becomes a light tint of `secondary_color` (Emerald) with a large "Continue" button. For errors, a light tint of a soft red is used, focusing on "Try again" rather than "Incorrect."