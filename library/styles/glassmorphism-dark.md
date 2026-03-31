# Summary

'Glassmorphism Dark' is an atmospheric, depth-layered design system that feels like looking through frosted glass at a luminous interior. It creates a sense of technological luxury — the aesthetic of premium AI products, spatial interfaces, and next-generation dashboards. Every element floats, glows, and refracts.

# Style

Deep space backgrounds (#08090F, #0A0B14) with vivid ambient light sources: electric violet (#7C3AFF), cerulean (#00C6FF), and deep rose (#FF3D8A) acting as ethereal glows. Glass panels with `backdrop-filter: blur(16px–40px)` sit in front of gradients, creating depth through layers. Typography is 'Inter' or 'DM Sans' — clean, legible, never competing with the glass effects. The animation language is slow, floating, and continuous — nothing snaps.

## Spec

### Core Aesthetics
- **Color Palette**: Background: `#08090F`; Panel Glass: `rgba(255, 255, 255, 0.06)`; Border Glass: `rgba(255, 255, 255, 0.12)`; Glow Violet: `#7C3AFF`; Glow Blue: `#00C6FF`; Glow Pink: `#FF3D8A`; Text Primary: `#FFFFFF`; Text Secondary: `rgba(255, 255, 255, 0.5)`.
- **Typography**:
  - **Headlines**: 'Inter', weight 700, tracking -0.03em, line-height 1.1.
  - **Interface Labels**: 'DM Mono' or 'JetBrains Mono', weight 400, tracking 0.05em, 11px–13px.
  - **Body**: 'Inter', weight 400, line-height 1.65.
- **Visual Effects**:
  - **Glass Panel**: `background: rgba(255, 255, 255, 0.06)`, `backdrop-filter: blur(24px)`, `border: 1px solid rgba(255, 255, 255, 0.12)`, `border-radius: 20px`.
  - **Ambient Glow**: Positioned fixed or absolute, `filter: blur(100px–200px)`, radial gradient of 2–3 glow colors at 20–35% opacity. Slowly drift with `transform: translate()` over 10–20s.
  - **Inner Highlight**: Top edge of glass panels gets `border-top: 1px solid rgba(255, 255, 255, 0.25)` for a light-catching rim.
  - **Star Field**: Optional CSS-only star field — tiny `box-shadow` clusters on a pseudo-element, opacity 0.4.
- **Animations**: Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for element entrances (slight spring). Floating elements use `keyframes` with `translateY(-8px)` → `translateY(0)` over 4s, ease-in-out, infinite alternate.

# Layout & Structure

Layered, centered composition. Content floats in the middle third of the canvas, with ambient glows and star field occupying the full background. No rigid grid — elements are positioned by visual weight and depth, not columns.

## Title Card

Centered. Product name in Inter 700, 22px, with a subtle gradient text fill (violet → blue via `background-clip: text`). Below: version or status tag in DM Mono 11px, `rgba(255,255,255,0.4)`. Behind: a single large glow blob (violet, blur 150px) positioned upper-center. Entire card fades in from opacity 0 over 0.8s.

## Opening Scene

Center-stage glass panel (70% canvas width, 55% canvas height, `border-radius: 24px`). Inside: headline stacked 2 lines, Inter 700 `clamp(2.8rem, 7vw, 6rem)`. Sub-headline below in Inter 400 20px, `rgba(255,255,255,0.6)`. Panel itself fades in from `scale(0.94) opacity(0)` → `scale(1) opacity(1)` over 0.9s. Behind the panel: 2 large glow orbs drift slowly (violet upper-right, blue lower-left).

## Feature Section

3 floating glass cards in a horizontal row. Each card: 300px min-width, `border-radius: 20px`, glass panel style. Content: top-aligned icon area (40px glyph in glow color), headline below, descriptor below. Cards enter with staggered float-up: `translateY(40px) opacity(0)` → `translateY(0) opacity(1)`, 0.2s stagger. After entering, each card gently bobs: `translateY(0)` ↔ `translateY(-6px)` over 3–5s, offset timing so they don't sync.

## End Card

Centered glass panel narrows to a pill shape. Product logo centered. Below: a gradient-text tagline (violet→blue). A glow ring pulses outward from the logo: `box-shadow: 0 0 0 0px rgba(124, 58, 255, 0.4)` → `0 0 0 60px rgba(124, 58, 255, 0)`, 2s, infinite. Scene dissolves to `#08090F`.

# Special Components

## Glass Panel

The core container of the system.

`background: rgba(255, 255, 255, 0.06)` | `backdrop-filter: blur(24px) saturate(180%)` | `border: 1px solid rgba(255, 255, 255, 0.12)` | `border-radius: 20px` | `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)`.

## Ambient Glow Orb

A large, soft light source that gives the scene a sense of physical illumination.

Absolutely positioned `div` with no content. `border-radius: 50%`. `background: radial-gradient(circle, [glow-color] 0%, transparent 70%)`. `filter: blur(80px–160px)`. `opacity: 0.25–0.4`. Animates slowly: drifts ±30px X/Y over 12–20s, ease-in-out, infinite alternate. Layer 3 orbs (violet, blue, pink) at different positions for depth.

## Gradient Text

Headlines and key labels rendered with a color gradient.

`background: linear-gradient(135deg, #7C3AFF, #00C6FF)` | `-webkit-background-clip: text` | `color: transparent`. For video rendering in kino: render text in gradient fill via Canvas 2D `createLinearGradient()` if CSS `background-clip` doesn't render correctly in headless Chrome.

## Pulse Ring

A circular glow that expands and fades, used for logo reveals or CTA emphasis.

`box-shadow: 0 0 0 0px rgba(124, 58, 255, 0.5)` → `0 0 0 80px rgba(124, 58, 255, 0)`. Duration: 2s, ease-out, infinite. Optionally: 2 rings offset by 1s for a radar effect.

# Special Notes

MUST: Always have at least 2 ambient glow orbs active — a single glow looks flat.
MUST: Glass panels must have `backdrop-filter: blur()` — without it, the glass reads as a flat semi-transparent box.
MUST: Keep floating card animations out of phase — stagger start times so cards don't bob in sync.
DO NOT: Use more than 3 glow colors in the same scene — it becomes chaotic.
DO NOT: Use white or light backgrounds — the entire aesthetic depends on dark surfaces.
DO NOT: Use sharp corners anywhere — `border-radius` should be ≥12px on all panels.

## Kino Rendering

- **Recommended**: GSAP + CSS-only (GSAP for entrance/exit timeline, CSS `@keyframes` for ambient float loops)
- **Advanced variant**: Three.js for true 3D depth layers and refraction effects
- **Scene duration**: 15–30s | **FPS**: 60 | **Canvas**: 1920×1080 or 1080×1920
- **Note**: `backdrop-filter` works in Puppeteer/Chrome — test that glass panels render correctly before final render
