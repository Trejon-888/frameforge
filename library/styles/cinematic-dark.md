# Summary

'Cinematic Dark' is a film-production aesthetic that makes short-form video feel like a movie trailer. Deep blacks, dramatic directional lighting, film grain, letterbox bars, and type that enters with the weight of a title card. This style is for content that needs to feel important — product launches, brand manifestos, dramatic announcements.

# Style

Near-black backgrounds (#080808, #0C0C0C) with warm tungsten highlights (#D4A96A, #F5E6C8) and cool steel shadows (#1A2030). The signature is cinematic contrast: elements that emerge from darkness, lit from one side, with deep shadows and no ambient fill. 'Canela' or 'Playfair Display' for display — serifed, editorial, weighty. Film grain and horizontal letterbox bars (2.39:1 crop) are always present. Motion is choreographed, not random — every cut and reveal is deliberate.

## Spec

### Core Aesthetics
- **Color Palette**: Background: `#080808`; Highlight Warm: `#D4A96A`; Highlight Cool: `#8BA3BE`; Text Primary: `#F5F0E8`; Text Secondary: `rgba(245, 240, 232, 0.5)`; Letterbox: `#000000`.
- **Typography**:
  - **Title Cards**: 'Playfair Display' or 'Canela' (if available), weight 700, tracking -0.02em, line-height 1.0. Fluid: `clamp(3rem, 9vw, 8rem)`.
  - **Subtitles / Context**: 'Inter', weight 300, tracking 0.2em, uppercase, 11px–14px. Color: `rgba(245,240,232,0.6)`.
  - **Credits / Fine Print**: 'Courier New' or 'IBM Plex Mono', weight 400, 10px, `rgba(245,240,232,0.35)`.
- **Visual Effects**:
  - **Film Grain**: Canvas 2D noise overlay — per-frame random noise at 8–12% opacity, updated every 2–3 frames for authentic film texture. Alternatively: SVG feTurbulence animated with `seed` attribute change.
  - **Letterbox Bars**: Fixed `#000000` bars at top and bottom of canvas, each ~11% of canvas height (achieving 2.39:1 ratio on 16:9 canvas). Present throughout entire scene.
  - **Vignette**: CSS radial gradient overlay: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, rgba(0,0,0,0.75) 100%)`.
  - **Lens Flare**: Optional — a diagonal streak of warm light that crosses the frame once. Animated: `opacity 0 → 0.8 → 0` over 0.4s, `scaleX 0.5 → 1.2` simultaneously.
- **Animations**: `ease-in` for disappearances (elements exit into darkness), `ease-out` for appearances (emerge from darkness). Fade durations: 0.6s–1.5s. NO bounce, NO spring, NO overshoot. Every transition should feel like a film dissolve or cut.

# Layout & Structure

Centered, anamorphic. Content lives within the letterbox-cropped area. Text is sparse — one thought per frame. Negative space is vast and intentional. The camera (viewport) feels fixed, observing.

## Title Card

Full black canvas, letterbox bars in place. Text appears centered — a single word or short phrase in Playfair Display. It fades in slowly: opacity 0 → 1 over 1.5s, `ease-out`. Hold for 2s. Fades out: opacity 1 → 0 over 0.8s, `ease-in`. Only element. Film grain running throughout.

## Opening Scene

A cinematic reveal sequence:
1. **Frame 1** (0s–0.8s): Complete darkness. Film grain only.
2. **Frame 2** (0.8s–2s): A narrow horizontal strip of content fades in — the scene emerges from black via the letterbox opening: letterbox bars slide outward (top bar moves up, bottom bar moves down) over 0.8s.
3. **Frame 3** (2s–5s): Main visual or headline fully visible. A warm-lit element centered, vignette applied.
4. **Headline** appears: character-by-character or word-by-word, 0.08s stagger, from `opacity(0)` → `opacity(1)`, no offset (cinematic type doesn't fly in from off-screen).

## Feature Section

Sequence of single-subject frames, each cut to. Each frame: dark background with one element spotlit (via CSS radial gradient `lighting: radial-gradient(circle at [subject position], rgba(212,169,106,0.15) 0%, transparent 50%)`). Sub-label fades in above the element in Inter uppercase 12px. Main statement below in Playfair Display. Transition: cross-dissolve (outgoing element opacity → 0 while incoming → 1, overlap 0.4s).

## End Card

The final frame of a film. Product name in Playfair Display, centered, held for 3s. Below: tagline in Inter 300 uppercase tracking 0.25em, fades in 0.5s after name. A thin warm horizontal rule `#D4A96A` draws in below the tagline over 1s. Hold. Slow fade to full black over 2s. Film grain continues until completely dark.

# Special Components

## Film Grain Overlay

Authentic per-frame film noise applied as a Canvas 2D overlay.

Two approaches:
1. **CSS**: `filter: url(#grain)` with SVG `feTurbulence` + `feDisplacementMap`. Animate `baseFrequency` slightly per second.
2. **Canvas 2D** (preferred for kino): Each frame, draw random pixel noise at 10% opacity onto a canvas overlay. Since kino renders each frame individually, the noise is automatically different per frame — authentic film grain, no looping.

## Letterbox

The 2.39:1 cinematic crop.

Two `div` elements: `position: fixed; left: 0; right: 0; background: #000`. Top: `top: 0; height: [crop height]px`. Bottom: `bottom: 0; height: [crop height]px`. Crop height = `(canvasHeight - canvasWidth / 2.39) / 2`. Always on top of all content.

## Spotlight

A soft directional light effect on the subject element.

`background: radial-gradient(ellipse 40% 60% at [light origin], rgba(212,169,106,0.2) 0%, transparent 70%)` — positioned as an absolutely-placed overlay behind the subject element. No actual CSS filter — this is a pure gradient. Optionally animate light position very slowly (±5px over 8s) for a subtle camera float feeling.

## Dissolve Transition

A cinematic cross-fade between two content states.

Outgoing element: `opacity: 1 → 0`, `ease-in`, 0.4s. Incoming element: begins at 0, starts fading in at the 0.2s mark (before outgoing finishes). Net: 0.2s of overlap. Total perceived transition: 0.6s.

# Special Notes

MUST: Film grain must update every 2–3 frames — static grain looks like a texture, not film.
MUST: Letterbox bars must be present from first frame to last frame — removing them breaks the cinematic frame.
MUST: Use sparse, wide tracking for subtitle text — cinematic sub-labels feel spacious, not dense.
DO NOT: Use any colored backgrounds — everything lives in darkness. Color appears only in warm light sources.
DO NOT: Use bouncing or springy motion — this is cinema, not UI design. Every transition is a dissolve or a cut.
DO NOT: Show more than one visual idea per 'frame' — cinematic pacing is slow and deliberate.

## Kino Rendering

- **Recommended**: Canvas 2D (film grain overlay, spotlight), CSS-only (letterbox, vignette, dissolves)
- **Advanced variant**: WebGL shader for true film grain simulation with halation and bloom
- **Scene duration**: 20–60s | **FPS**: 24 (authentic film) or 30 | **Canvas**: 1920×1080 only (letterbox is a horizontal format)
- **Key kino advantage**: Per-frame Canvas grain is free in kino — each frame renders independently so grain is always unique
