# Summary

'Neo-Brutalist' is a deliberately raw, high-energy design system that weaponizes constraints — no gradients, no blur, hard shadows, system fonts, and a limited 2-color palette. It feels like a protest poster designed by an engineer who read too much Dieter Rams. Maximum information, minimum decoration. Everything is a statement.

# Style

Bright yellow (#FFDD00) primary with pure black (#000000) and white (#FFFFFF). Hard drop shadows (offset, not blurred). Heavy borders (2px–4px). System-stack or 'Space Grotesk' for type — chunky, legible, no-nonsense. 'IBM Plex Mono' for technical elements. The aesthetic is defined by what it refuses to do: no rounded corners, no shadows with blur, no smooth gradients, no subtle opacity. Elements look physically constructed, like objects placed on a surface.

## Spec

### Core Aesthetics
- **Color Palette**: Primary Yellow: `#FFDD00`; Black: `#000000`; White: `#FFFFFF`; Optional Accent: `#FF3700` (red, for error/alert states only).
- **Typography**:
  - **Headlines**: 'Space Grotesk' weight 700, tracking -0.03em, uppercase. Fluid: `clamp(3rem, 10vw, 9rem)`.
  - **Technical / Labels**: 'IBM Plex Mono', weight 400–600, uppercase, tracking 0.1em, 11px–14px.
  - **Body**: 'Space Grotesk', weight 400, line-height 1.55.
- **Visual Effects**:
  - **Hard Shadow**: `box-shadow: 4px 4px 0px 0px #000000`. Always exact pixel offset, always `blur: 0`. No exceptions.
  - **Thick Border**: `border: 2px solid #000000` on all interactive or featured elements. Cards get `border: 3px solid #000000`.
  - **Background Patterns**: Diagonal stripes (`repeating-linear-gradient(45deg, #FFDD00, #FFDD00 4px, #000000 4px, #000000 8px)`) or dot grids used as accents or full backgrounds.
  - **No blur, no gradients, no rounded corners** on any structural element.
- **Animations**: Short, snappy. `ease-out`, 0.2s–0.4s. Elements 'stamp in' — they appear with immediate scale from 0.95→1 and a small Y translation. The shadow animates on hover/entry: from `2px 2px` → `4px 4px`. Transitions have a physical, mechanical feel.

# Layout & Structure

Dense, grid-based but deliberately broken. Asymmetric borders (border-bottom only, or border-left only) create structure without boxes. Yellow fills are used as knockout backgrounds for hero text — black text reversed on yellow, or yellow text on black.

## Title Card

Full yellow background (`#FFDD00`). Product name in black Space Grotesk 700 uppercase, massive. Below: a thin black horizontal rule. Below that: a category label in IBM Plex Mono uppercase black, small. The entire card is surrounded by an optional thick black border frame. Elements appear instantly (0.15s stamp-in). No fade — this style does not fade.

## Opening Scene

Split: left 60% is black background with headline text in white; right 40% is solid yellow with a secondary element (stat, label, graphic). A 3px black vertical divider between them. Headline: Space Grotesk 700, `clamp(4rem, 12vw, 10rem)`. The split animates in: left half enters from left, right half from right — both `translateX` ± 40px, 0.35s `ease-out`. Zero overlap.

## Feature Section

Card grid with each card having `border: 3px solid #000`, `box-shadow: 5px 5px 0px #000`. Cards alternate: yellow background with black text, or white background with black text. Each card: top-aligned index in IBM Plex Mono, large headline in Space Grotesk, body below. Cards enter with a sequential stamp: each scales from 0.96→1 with its hard shadow growing from `2px 2px` → `5px 5px`, 0.15s stagger.

## End Card

Full black background. Product name in yellow, massive, centered. Below: a yellow horizontal rule (2px). Below: tagline in white Space Grotesk 400. A rotating or blinking yellow square or asterisk acts as a typographic punctuation mark. Scene holds 3s, then a sharp cut to black (no fade).

# Special Components

## Hard Shadow Card

The defining container of Neo-Brutalism.

`background: #FFFFFF` (or `#FFDD00`). `border: 3px solid #000000`. `border-radius: 0`. `box-shadow: 5px 5px 0px 0px #000000`. No `blur`. On entry animation: shadow starts at `2px 2px` and grows to `5px 5px` over 0.2s `ease-out` — simulates being 'stamped' onto the surface.

## Stamp Button

A CTA button that feels physical — it pushes down when activating.

Default: `background: #FFDD00`, `border: 3px solid #000`, `border-radius: 0`, `box-shadow: 4px 4px 0px #000`, `color: #000`, `font: Space Grotesk 700 uppercase`. On activation: `box-shadow: 0px 0px 0px #000`, `transform: translate(4px, 4px)` — simulates pressing the button into the surface.

## Stripe Pattern

A high-energy background fill used for emphasis panels.

`background: repeating-linear-gradient(45deg, #FFDD00 0px, #FFDD00 6px, #000000 6px, #000000 12px)`. Used full-bleed for alert sections or small accent blocks. Never used as the primary background for text-heavy areas (too much visual noise).

## Counter Badge

A compact number badge with hard shadow — used for stats, rankings, counts.

Shape: square or circle (border-radius 0 or 50%). Background: `#FFDD00`. `border: 2px solid #000`. `box-shadow: 3px 3px 0px #000`. Number: IBM Plex Mono 700, black. Appears with a stamp animation: `scale(0)` → `scale(1.1)` → `scale(1)`, 0.25s total.

## Marquee Strip

A horizontal scrolling text strip, full-width, used as a section separator.

`overflow: hidden`. Inner element: duplicated text `• [LABEL] •` repeating, `translateX: 0 → -50%` over 8–12s linear infinite. Background: `#000000`. Text: `#FFDD00` in IBM Plex Mono uppercase. Border-top and border-bottom: `2px solid #000`.

# Special Notes

MUST: Hard shadows are always at the same angle (bottom-right offset) — consistency makes it feel designed, not sloppy.
MUST: Use only the 2-color palette (yellow + black) for structural elements. White is for text on black, not for backgrounds.
MUST: Cut transitions, not fades — this style does not dissolve. A new element appears by snapping or stamping.
DO NOT: Add border-radius to cards, buttons, or containers — rounded corners neutralize the aesthetic.
DO NOT: Use gradient shadows (`blur > 0`) — soft shadows are the antithesis of this style.
DO NOT: Use more than 3 typefaces. Space Grotesk + IBM Plex Mono is the complete system.

## Kino Rendering

- **Recommended**: CSS-only (all effects are pure CSS — no canvas or GSAP required)
- **Accent**: GSAP only for the marquee loop or sequential stagger timing
- **Scene duration**: 10–25s | **FPS**: 30 (snappy style doesn't benefit from 60fps smooth motion) | **Canvas**: 1920×1080 or 1080×1920
- **Key CSS techniques**: `box-shadow` with 0 blur, `transform: translate()` for stamp animations, `repeating-linear-gradient` for stripe fills
