---
name: Kinetic Obsidian
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#ffffff'
  on-tertiary: '#303030'
  tertiary-container: '#e4e2e1'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e4e2e1'
  tertiary-fixed-dim: '#c8c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474747'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  nav-label:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
---

## Brand & Style

The design system embodies a high-performance, nocturnal aesthetic tailored for elite fitness and lifestyle tracking. It leverages a **Glassmorphic** and **Modern** style characterized by deep, obsidian-toned translucent surfaces that evoke a sense of focus and intensity.

The target audience consists of dedicated athletes and health enthusiasts who value precision and data. The UI evokes an emotional response of "energetic focus"—using high-contrast neon accents against a dark, moody atmosphere to highlight progress and call-to-actions. Movement is suggested through sharp typography and sleek, layered depth.

## Colors

The palette is anchored by "Kinetic Neon" (#ccff00), a high-visibility primary color used exclusively for active states, primary actions, and critical data points. The foundation is built on "Obsidian" (#0a0a0a), providing a deep black base that allows for sophisticated layering.

Secondary and tertiary greys are used for surface containers and borders to maintain a monochromatic hierarchy, ensuring the neon primary color remains impactful without overwhelming the user.

## Typography

This design system utilizes a trio of typefaces to balance technical precision with modern aesthetics. **Sora** provides a geometric and futuristic feel for headlines. **Hanken Grotesk** ensures high readability for body content and interface labels. **JetBrains Mono** is used sparingly for technical data (reps, sets, calories) to reinforce the "performance tracking" narrative.

Headlines use tight letter spacing to feel "compressed" and energetic. Labels often utilize uppercase styling with increased tracking to provide a technical, instrument-like appearance.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a focus on mobile-first interaction. Spacing is strictly based on an 8px rhythm to maintain mathematical harmony.

On mobile, the system utilizes a 4-column grid with 16px gutters and 20px side margins. Desktop layouts expand to 12 columns with a maximum content width of 1200px. The spacing between logical sections (e.g., Fitness cards vs. Nutrition logs) should consistently use the `lg` (24px) or `xl` (32px) units to prevent visual clutter in the dark theme.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and tonal layering rather than traditional drop shadows. Higher elevation levels are represented by lighter surface transparencies and increased background blur (Backdrop Filter).

- **Level 0 (Base):** Solid Obsidian (#0a0a0a).
- **Level 1 (Cards/Lists):** Semi-transparent Grey (#1a1a1a at 60% opacity) with a 1px subtle border (#ffffff10).
- **Level 2 (Floating Nav/Headers):** High-blur Obsidian glass (80% opacity) with a 12px-20px backdrop-blur.

Interactive elements use "Inner Glows" with the primary neon color to indicate focus or active states, mimicking a backlit display.

## Shapes

The shape language is "Rounded" but controlled. Standard UI components like cards and input fields use a 0.5rem (8px) radius. Larger containers or the Bottom Navigation bar utilize 1rem (16px) or 1.5rem (24px) for a softer, more modern handheld feel. The use of "Pill-shapes" is reserved strictly for interactive buttons and chips to distinguish them from informational containers.

## Components

### Bottom Navigation Bar (5 Destinos)
The navigation bar is a floating glass element at the bottom of the viewport.
- **Surface:** Obsidian glass with 20px blur and a 1px top border (#ccff00 at 20% opacity).
- **Destinations:**
    1. **Inicio (home):** Outline icon / Solid neon when active.
    2. **Entreno (fitness_center):** Outline icon / Solid neon when active.
    3. **Nutrición (restaurant):** Outline icon / Solid neon when active.
    4. **Social (groups):** Outline icon / Solid neon when active.
    5. **Perfil (person):** Outline icon / Solid neon when active.
- **Active State:** The active icon and its label use the primary neon (#ccff00). A small glowing dot or bar may appear below the active icon.

### Top App Bar
Since the Profile has moved to the Bottom Navigation, the Top Bar is streamlined for utility.
- **Left Alignment:** Screen title or branding logo in Sora Bold.
- **Right Alignment:** Action icons for **Notifications** and **Settings**. 
- **Style:** Minimalist transparency that becomes a blurred glass surface upon scroll.

### Buttons & Inputs
- **Primary Button:** Pill-shaped, solid Neon (#ccff00) with black text (#0a0a0a).
- **Input Fields:** Dark containers with a "bottom-line only" or "ghost-border" focus state in Neon.
- **Cards:** Used for workouts and meals. Level 1 glass elevation with high-contrast typography for metrics.