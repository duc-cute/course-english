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
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#46566c'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e6e85'
  on-tertiary-container: '#e9f0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
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
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
  container-max: 1200px
  sidebar-width: 280px
---

## Brand & Style

The design system is built for a focused, AI-driven educational environment. It balances the systematic efficiency of an enterprise SaaS tool with the approachability of a personal tutor. The aesthetic is rooted in **Modern Minimalism**, emphasizing clarity, generous white space, and a high signal-to-noise ratio to minimize cognitive load during the learning process.

The target audience consists of students and professionals seeking a distraction-free interface that feels both intelligent and supportive. The UI evokes a sense of calm, precision, and progress—drawing inspiration from the structural integrity of Notion and the conversational fluidity of ChatGPT. Visual elements are intentional, using soft elevation and subtle borders to define structure without adding visual clutter.

## Colors

The palette is anchored by a **Pure White (#FFFFFF)** background to maintain a "blank slate" feel that keeps the focus on content. 

- **Primary (Educational Blue):** A vibrant yet professional blue used for primary calls-to-action, user-generated chat bubbles, and active progress states. 
- **Secondary (Soft Surface):** Utilized for the sidebar, AI response bubbles, and background containers to provide subtle contrast against the white canvas.
- **Neutrals:** A scale of grays from Slate-50 to Slate-900 manages the hierarchy. Borders use a very light tint (#E2E8F0) to remain unobtrusive.
- **Status Colors:** Success (Emerald), Warning (Amber), and Error (Rose) are used sparingly for feedback on grammar and pronunciation exercises.

## Typography

This design system utilizes **Inter** for its exceptional legibility and systematic feel. The type hierarchy is strictly defined to help users distinguish between UI controls, AI-generated explanations, and their own inputs.

- **Headlines:** Use tighter letter spacing and semi-bold weights to provide strong structural anchors.
- **Chat Bubbles:** The primary body size is 16px (body-lg) for the chat interface to ensure comfortable reading of long-form AI explanations.
- **Labels & Captions:** Used for metadata like timestamps, grammar tags, and secondary navigation items.
- **Mobile Scaling:** Headline sizes are aggressively reduced on mobile to ensure chat bubbles remain the primary focus without excessive vertical scrolling.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a max-width container for the chat interface to prevent line lengths from becoming too long for comfortable reading. 

- **Sidebar:** A fixed 280px sidebar on desktop for navigation and history, which collapses into a drawer on mobile.
- **Chat Thread:** Centrally aligned with a max-width of 800px. 
- **Spacing Rhythm:** Based on a 4px baseline. Use 16px (md) for standard padding within cards and bubbles, and 24px (lg) for gutter spacing between major sections.
- **Margins:** Desktop views utilize 40px lateral margins; mobile views drop to 16px.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Ambient Shadows**.

- **Level 0 (Surface):** Pure white background for the main content area.
- **Level 1 (Subtle):** Low-contrast outlines (1px #E2E8F0) for input fields and chat bubbles.
- **Level 2 (Elevated):** Used for suggestion chips and dropdown menus, utilizing a soft, diffused shadow: `0 4px 12px rgba(0, 0, 0, 0.05)`.
- **Level 3 (Overlay):** Used for modals and tooltips, with a more pronounced shadow and a backdrop blur (8px) to maintain context without visual noise.

## Shapes

The design system employs a **Rounded (Level 2)** shape language to reinforce the "friendly tutor" personality. 

- **Standard Elements:** 8px (0.5rem) radius for chat bubbles, input fields, and small cards.
- **Large Elements:** 16px (1rem) for the main sidebar container and large modals.
- **Interactive Elements:** Buttons and suggestion chips use a slightly higher roundedness or pill-shape to distinguish them from static containers.

## Components

### Chat Bubbles
- **User Bubble:** Right-aligned, Brand Blue background, White text. No shadow, 8px corner radius, with the bottom-right corner being slightly sharper.
- **AI Bubble:** Left-aligned, Light Gray (#F1F5F9) background, Neutral-900 text. 8px corner radius. Includes a small AI avatar icon to the left.

### Sidebar Navigation
- Minimalist list items with Lucide-style stroke icons (2px stroke). Active states use a subtle gray background and a 3px vertical blue indicator on the left.

### Suggestion Chips
- Small, rounded-full pill shapes with a 1px border. Hovering triggers a subtle blue tint and a 2px lift shadow. Used for quick-replies or grammar corrections.

### Input Field
- A floating "Command-bar" style input at the bottom of the chat. Minimal icons for "Attach" and "Voice". It expands vertically with the text. Focus state is indicated by a subtle primary blue glow (2px).

### Avatars & Badges
- **Avatars:** Circular, 32px or 40px. The AI avatar is a stylized geometric spark.
- **Badges:** Small, high-contrast pills used for grammar tags (e.g., "Past Tense," "B2 Level"). Use low-saturation background tints corresponding to the category.

### Cards
- Used for "Lesson Summaries" or "Vocabulary Lists." Features a 1px border and 12px corner radius. Titles are `title-md` and secondary text is `body-md`.