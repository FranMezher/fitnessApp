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
  secondary: '#ffb59d'
  on-secondary: '#5d1900'
  secondary-container: '#b83900'
  on-secondary-container: '#ffddd2'
  tertiary: '#ffffff'
  on-tertiary: '#313030'
  tertiary-container: '#e5e2e1'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59d'
  on-secondary-fixed: '#390c00'
  on-secondary-fixed-variant: '#832600'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c9c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  text-primary: '#F2F2F2'
  text-muted: '#888888'
  glass-border: rgba(255, 255, 255, 0.09)
  glass-fill: rgba(255, 255, 255, 0.04)
  brand-glass-fill: rgba(204, 255, 0, 0.08)
  brand-glass-border: rgba(204, 255, 0, 0.35)
  accent-glass-fill: rgba(255, 107, 53, 0.1)
  accent-glass-border: rgba(255, 107, 53, 0.4)
typography:
  hero-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  hero-md:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 4px
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 2px
  data-mono:
    fontFamily: monospace
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
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
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 20px
  gutter: 12px
---

## Brand & Style

The design system embodies a **High-Performance, Technical, and Energetic** personality. It is crafted for elite fitness tracking and bio-hacking applications where focus and data-driven results are paramount. The aesthetic is "HUD-inspired" (Heads-Up Display), creating a sense of being inside a high-tech laboratory or a premium performance vehicle.

The design style is a hybrid of **Minimalism** and **Glassmorphism**. It utilizes a deep, "obsidian" dark mode foundation to reduce eye strain during high-intensity workouts while using vibrant, high-energy accents to signal action and progress. Visual depth is achieved through translucent layers and blurred backgrounds rather than traditional shadows, mimicking the look of digital interfaces projected onto glass surfaces.

## Colors

The palette is optimized for high-contrast visibility in dark environments. 

- **Primary Background:** `#080808` provides a deep, ink-black foundation that makes accent colors "pop."
- **Primary Accent (Neon):** `#CCFF00` is the "Go" signal. It is reserved for primary calls to action, active states, and critical performance data.
- **Secondary Accent (Vibrant Orange):** `#FF6B35` is used for highlights, secondary progress indicators, and high-intensity alerts.
- **Glassmorphism Layers:** Utilize the defined `rgba` variables for surfaces. Containers should use a backdrop-blur (12px to 20px) combined with the semi-transparent border tokens to establish depth and hierarchy.

## Typography

This design system uses **Space Grotesk** for its geometric, technical character. 

- **Hero & Headlines:** Use tight letter spacing for large headers to maintain a compact, impactful look.
- **Data Display:** For technical data (reps, sets, timers), use the `data-mono` style to ensure tabular alignment and a "machine-like" feel.
- **Branding:** Labels like `label-caps` should be used for section headers and brand tags, utilizing aggressive tracking (4px) to create a sophisticated, airy feel that contrasts with the heavy body text.
- **Scaling:** On mobile, reduce `hero-lg` to 32px and `hero-md` to 26px to prevent line-breaking issues while maintaining visual drama.

## Layout & Spacing

The layout uses a **Fluid Grid** approach within defined mobile constraints (typically 320px-360px width artboards). 

- **Grid:** Use a 4-column grid for mobile with 12px gutters and 20px side margins. 
- **Rhythm:** Spacing is strictly based on a 4px/8px incremental scale. 
- **Density:** The system allows for high information density. Content should be grouped in glassmorphic "cards" that utilize `spacing.sm` (12px) for internal padding, creating a tight, efficient UI.
- **Reflow:** On larger viewports (tablet), the 4-column layout expands to 8 columns, while side margins increase to 40px to maintain readability.

## Elevation & Depth

Hierarchy is defined by **Tonal Layering** and **Transparency** rather than physical light sources.

1.  **Level 0 (Base):** Deep black (`#080808`).
2.  **Level 1 (Surfaces):** Muted dark surfaces (`#0E0E0E`) or `glass-fill` layers for cards and list items.
3.  **Level 2 (Overlays):** Modals, toasts, and navigation bars should use a stronger backdrop blur (25px) and a `glass-border` to separate them from the content below.
4.  **Accents:** Toned glass (e.g., `brand-glass-fill`) is used to highlight specific active segments or prioritized modules within a dashboard. 

Borders are the primary tool for definition. Use 1px borders for all glass elements. For device-level containers or primary frames, use 2px borders.

## Shapes

The shape language is **Modern and Purposeful**, striking a balance between approachable softness and technical precision.

- **Primary Radius:** 0.5rem (8px) is the standard for cards, system notifications, and buttons.
- **Container Radius:** Large containers or device frames use 1.25rem (20px) to create a distinct outer silhouette.
- **Pill Radius:** Use `rounded-xl` (1.5rem / 24px) for interactive chips and tags to differentiate them from static cards.
- **Interactive States:** Buttons should feel tactile. When pressed, a subtle scale-down (98%) is preferred over a shadow change to maintain the glass aesthetic.

## Components

### Buttons
- **Primary:** Solid `#CCFF00` fill with black text. High-contrast, no border.
- **Secondary:** Transparent background with `#FF6B35` border (1px) and matching text color.
- **Glass Action:** `glass-fill` with `glass-border` and white text for low-priority actions.

### Input Fields
- **Style:** Underlined or fully enclosed glass containers. 
- **Focus State:** Border color shifts to Primary Neon (`#CCFF00`) with a subtle outer glow (0px 0px 8px rgba(204, 255, 0, 0.3)).
- **Font:** Use `data-mono` for numeric inputs.

### Cards
- **Construction:** Use `glass-fill` with a 1px `glass-border`. Backdrop-filter blur set to 16px.
- **Padding:** Standardized at 16px (`spacing.md`).

### Chips & Tags
- **Style:** Small, pill-shaped components. 
- **Typography:** `label-sm` (10px, bold, 2px tracking).
- **Usage:** Indicate workout types, muscle groups, or status (e.g., "COMPLETED").

### Progress Indicators
- **Visuals:** Thin, 4px lines. Use gradients between Primary Neon and Secondary Orange to show intensity or completion zones.