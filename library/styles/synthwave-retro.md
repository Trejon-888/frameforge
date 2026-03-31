# Summary

'Synthwave Retro' is an 80s-inspired aesthetic built on neon-on-dark contrast, perspective grid horizons, and retrofuturist chrome type. It evokes the feeling of a VHS tape of the future — scanlines, chromatic aberration, sunset gradients, and infinite grid roads. High energy, nostalgic, and completely unambiguous in its vibe.

# Style

Deep indigo-black background (#0D0015, #0A0020) with vivid neon palette: hot pink (#FF2D78), electric cyan (#00F5FF), golden yellow (#FFD700), and violet (#9B00FF). The signature visual is a vanishing-point perspective grid on the lower half of the canvas and a gradient sunset (purple → pink → orange) on the upper half. Typography goes full chrome or gradient. Scanlines and CRT artifacts are essential texture.

## Spec

### Core Aesthetics
- **Color Palette**: Background: `#0D0015`; Neon Pink: `#FF2D78`; Neon Cyan: `#00F5FF`; Neon Yellow: `#FFD700`; Violet: `#9B00FF`; Grid Lines: `rgba(255, 45, 120, 0.6)`; Horizon Glow: `rgba(255, 100, 0, 0.8)`.
- **Typography**:
  - **Display**: 'Audiowide', 'Orbitron', or 'Exo 2', weight 700–900. Tracking 0.1em–0.2em, uppercase. Fluid: `clamp(3rem, 10vw, 8rem)`.
  - **Sub-labels**: Same family, weight 300–400, tracking 0.3em, uppercase, 11px–14px.
  - **Body**: 'Exo 2' or 'Rajdhani', weight 300, slightly wide.
- **Visual Effects**:
  - **Perspective Grid**: CSS `perspective` transform on a horizontal grid (lines at regular intervals, converging to horizon vanishing point). Grid lines colored neon pink at 60% opacity.
  - **Sunset Gradient**: Upper half background: `linear-gradient(to bottom, #0D0015 0%, #2D0060 30%, #8B0057 60%, #FF6B35 85%, #FFD700 100%)`.
  - **Scanlines**: Repeating CSS gradient: `repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)`, fixed, full-canvas overlay at 30% opacity.
  - **Chromatic Aberration**: Duplicate headline elements offset ±2px in red and blue channels with `mix-blend-mode: screen` or CSS `filter: drop-shadow(2px 0 0 #FF2D78) drop-shadow(-2px 0 0 #00F5FF)`.
  - **CRT Vignette**: Radial gradient overlay: `radial-gradient(ellipse, transparent 60%, rgba(0,0,0,0.7) 100%)`.
- **Animations**: Fast on entries (0.3s), slow on atmospheric loops (8–20s). Use `ease-out` for snap-ins. Grid lines appear with a sweep from horizon outward. Neon elements flicker on entry (opacity stutters 0→1→0.8→1 over 0.4s).

# Layout & Structure

Split-plane composition: upper 55% is sky/sunset/text, lower 45% is the perspective grid. The horizon line is the visual anchor point. Neon elements float above the grid, casting implied reflections into it.

## Title Card

Full canvas. Background: sunset gradient fills upper half, grid fills lower half. The title appears at center mass — either chrome gradient text or outlined text (`-webkit-text-stroke: 2px #FF2D78`). Text entry: flicker-in (opacity flashes 3 times in 0.4s) then holds. Below the title: sub-label in cyan 11px tracking 0.3em, fades in after 0.5s delay. Scanlines overlay the entire scene at 30% opacity.

## Opening Scene

The grid extends outward from horizon (reveal: grid lines draw from center vanishing point outward, 0.8s). A large headline sits above the horizon, chrome or pink gradient. The sun/horizon glow pulses — `box-shadow` or radial gradient at the horizon line brightens and dims over 3s, infinite. Stars (CSS `box-shadow` clusters on pseudo-element) appear in the upper sky with a slow twinkle.

## Feature Section

Floating neon-bordered cards above the grid plane. Each card: `border: 1px solid rgba(255, 45, 120, 0.6)`, `box-shadow: 0 0 20px rgba(255, 45, 120, 0.4), inset 0 0 20px rgba(255, 45, 120, 0.1)`, `background: rgba(13, 0, 21, 0.8)`. Entry: slide up from below grid horizon, `translateY(80px)→translateY(0)`, 0.4s ease-out. Optional: a subtle reflection below the card (scaled Y -1, opacity 0.15, gradient to transparent at 60%).

## End Card

Zoom out: the grid pulls back (perspective increases), the horizon recedes. Title fades to just the neon outline version. A thin neon horizontal rule draws across the horizon. Product name / handle in cyan mono below. Slow fade to `#0D0015`.

# Special Components

## Perspective Grid

The signature element. A flat grid receding to a central vanishing point.

Implemented via CSS `transform: perspective(400px) rotateX(35deg)` on a grid element with `background-image: linear-gradient(rgba(255,45,120,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,120,0.5) 1px, transparent 1px)`. Background-size sets the cell spacing. The grid animates slowly: `background-position-y` shifts downward over 4s in a loop, giving the illusion of forward motion.

## Chrome Text

A metallic gradient text effect for headlines.

`background: linear-gradient(180deg, #FFFFFF 0%, #00F5FF 30%, #9B00FF 60%, #FF2D78 100%)` | `-webkit-background-clip: text` | `color: transparent`. Optional chromatic aberration applied via CSS filter.

## Neon Flicker

An entry animation for neon-lit elements (text, borders, glows).

```
@keyframes flicker {
  0%   { opacity: 0; }
  10%  { opacity: 0.9; }
  15%  { opacity: 0.4; }
  25%  { opacity: 1; }
  35%  { opacity: 0.7; }
  40%  { opacity: 1; }
  100% { opacity: 1; }
}
```
Duration: 0.5s. Apply to any neon element on scene entry.

## Horizon Pulse

The glowing line at the grid's vanishing point that implies a sun or light source.

A 4px tall `div` at full width, positioned at the horizon. `background: linear-gradient(90deg, transparent, #FF6B35, #FFD700, #FF6B35, transparent)`. `box-shadow: 0 0 40px 10px rgba(255, 107, 53, 0.8)`. Animates: brightness pulses from 80%→120%→80% over 3s, infinite.

# Special Notes

MUST: Include scanlines — they are the CRT filter that makes neon pop instead of bloom.
MUST: Use the perspective grid with forward-motion scroll animation — static grid reads as decorative, animated grid reads as speed.
MUST: Apply chromatic aberration to at least the main headline — it's the defining retro artifact.
DO NOT: Use soft pastel neons — this is not vaporwave (softer). Synthwave is saturated, high-voltage.
DO NOT: Use any light backgrounds — the entire palette depends on darkness to make neons glow.
DO NOT: Use rounded corners on cards or containers — the 80s geometric aesthetic is hard-edged.

## Kino Rendering

- **Recommended**: CSS-only + Canvas 2D (perspective grid forward animation via Canvas, CSS for scanlines/chromatic aberration)
- **Advanced variant**: WebGL shaders for true CRT screen simulation (barrel distortion, phosphor glow)
- **Scene duration**: 15–30s | **FPS**: 60 | **Canvas**: 1920×1080 (horizontal, cinematic)
- **Key technique**: Animate `background-position` on the grid div for forward-motion effect. Canvas 2D for any dynamic grid drawing. GSAP for element entrance timing.
