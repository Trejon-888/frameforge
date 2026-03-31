# Summary

'Data Viz Technical' is a design system built for developers, analysts, and engineering audiences. It mimics the aesthetic of a live monitoring dashboard — dark terminal background, monospaced type, real-time chart animations, and the visual language of CLI tools and IDE interfaces. Every frame should feel like it's rendering actual data.

# Style

Dark navy/charcoal background (#0E1117, #161B22 — GitHub-dark territory) with a technical accent: terminal green (#00FF41), cobalt blue (#58A6FF), or amber (#F0A500) — one per video. 'JetBrains Mono' or 'Fira Code' for all technical text, 'Inter' for headers. The visual grammar is: grids, charts, code blocks, progress bars, and terminal output. Motion is purposeful — data reveals itself, bars grow, lines draw, numbers tick.

## Spec

### Core Aesthetics
- **Color Palette**: Background: `#0E1117`; Surface: `#161B22`; Border: `#30363D`; Text Primary: `#E6EDF3`; Text Secondary: `#7D8590`; Accent Green: `#00FF41`; Accent Blue: `#58A6FF`; Accent Amber: `#F0A500`; Error Red: `#FF4444`; Success Green: `#2DFF6E`.
- **Typography**:
  - **Headlines / Section Titles**: 'Inter', weight 700, tracking -0.02em, `#E6EDF3`.
  - **Code / Labels / Values**: 'JetBrains Mono' or 'Fira Code', weight 400–600, `#E6EDF3` or accent color.
  - **Metadata / Timestamps**: 'JetBrains Mono', weight 300, `#7D8590`, 10px–11px.
- **Visual Effects**:
  - **Grid Background**: Subtle dot-grid: `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`, 24px cell size, `background-position: 0 0`.
  - **Surface Cards**: `background: #161B22`, `border: 1px solid #30363D`, `border-radius: 8px`. No blur, no shadows — clean technical.
  - **Terminal Cursor**: Blinking block cursor — 2px × 14px `#00FF41`, `opacity: 1 → 0` over 0.6s, infinite step animation.
  - **Chart Lines**: Drawn via Canvas 2D or SVG — `stroke-dasharray` / `stroke-dashoffset` technique for line reveal.
- **Animations**: `ease-out` for data reveals (feel like rendering). Bars grow from 0 to value in 1–1.5s. Line charts draw left-to-right. Numbers count up at `ease-out` pace (fast start, slow finish).

# Layout & Structure

Dashboard-style layout. Multiple surface cards in a bento grid, each containing a different data visualization or technical readout. Information density is higher than other styles — this is meant to look busy-but-legible, like a real dashboard.

## Title Card

Top-left: product/project name in Inter 700, 20px. Top-right: timestamp in JetBrains Mono 11px, `#7D8590` — shows real-time or a fixed meaningful date. Below the header bar: a 1px `#30363D` divider. Background: `#0E1117` with dot grid. Version badge: `background: #161B22`, `border: 1px solid #30363D`, `border-radius: 4px`, mono text. All elements fade in over 0.4s.

## Opening Scene

A terminal-style text animation — text types out line by line (typewriter effect) starting with `$ ` prefix lines. Each line appears with cursor at end, types 0–40 characters at ~30ms per character, then cursor moves to next line. After 3–6 lines: the terminal output fades to background and a main dashboard layout appears over it with a cross-fade.

## Feature Section

Bento grid of 4–6 cards:
- **Card 1**: Line chart (animated path draw, left→right, 1.2s)
- **Card 2**: Bar chart (bars grow from 0, staggered 0.1s per bar)
- **Card 3**: Single large stat with label (count-up animation)
- **Card 4**: Progress bars (horizontal, fill left-to-right, staggered)
- **Card 5**: Code block (syntax-highlighted, typewriter reveal)
- **Card 6**: Circular/donut chart (arc draws clockwise, 1s)

Cards enter staggered: `opacity 0 → 1`, `translateY(10px) → translateY(0)`, 0.15s between cards.

## End Card

Full-width terminal block. Typing animation: `> [product] ready.` followed by `> ✓ [key stat or claim]`. Cursor blinks at end. After 2s: display name and minimal CTA below. Background: `#0E1117`.

# Special Components

## Typewriter

Text that types out character by character, with a blinking cursor.

Characters are appended to the DOM one by one using `setInterval(16ms)` per character (or GSAP ticker). Cursor is a separate span with a blink CSS animation: `@keyframes blink { 50% { opacity: 0; } }`, 0.6s step. When a line completes, cursor moves to next line start.

## Bar Chart Animator

Canvas 2D or HTML div-based bars that grow from 0 to data value on entry.

Bars: `height: 0 → targetHeight`, `transition: height 1.2s ease-out`. Labels appear after bar reaches full height. Each bar staggers: `animation-delay: 0.1s × index`. X-axis labels always visible; Y-axis labels fade in after all bars complete.

## Line Chart Draw

SVG path or Canvas 2D line that draws itself from left to right.

SVG: set `stroke-dasharray` and `stroke-dashoffset` equal to path length. Animate `stroke-dashoffset: pathLength → 0` over 1.5s, `ease-in-out`. Canvas: draw path segment by segment each frame over 90 frames. Add a small dot at the current draw position for a 'pen drawing' effect.

## Live Counter

A number that counts up from 0 to target value.

Duration: 1.5s, `ease-out`. Formula: `value = target × easeOut(progress)`. Optional: number formats with commas (e.g., 1,284,390) — format after calculating raw value. Below the number: a unit label in JetBrains Mono uppercase 11px, `#7D8590`.

## Progress Bar

A horizontal bar that fills left-to-right with a percentage label.

Container: `#161B22`, `border: 1px solid #30363D`, `border-radius: 4px`, height 8px. Fill: accent color, `border-radius: 4px`. Fills from `width: 0%` → `width: [value]%` over 1s, ease-out. Label right-aligned: `[value]%` in JetBrains Mono 11px, updates in sync with fill.

# Special Notes

MUST: Use monospaced font for all data values — proportional fonts cause layout shift as numbers change during count-up animations.
MUST: Keep chart lines crisp — subpixel rendering on canvas; use `devicePixelRatio` scaling on Canvas 2D contexts.
MUST: Give every card a visible `border: 1px solid #30363D` — borderless cards look unfinished in this style.
DO NOT: Use gradient fills on chart bars — flat accent color only. Gradients feel consumer-app, not technical.
DO NOT: Round any numbers during animation — show the raw intermediate values for authenticity.
DO NOT: Use emoji or illustrations — the aesthetic is pure technical information design.

## Kino Rendering

- **Recommended**: Canvas 2D (charts, live drawing) + GSAP (card stagger entrances, count-up timing)
- **Advanced variant**: SVG for crisp line charts at any resolution
- **Scene duration**: 15–45s | **FPS**: 60 | **Canvas**: 1920×1080 (horizontal dashboard) or 1080×1920 (vertical stats)
- **Key technique**: For Canvas charts, kino's time virtualization means `requestAnimationFrame` is deterministic — chart draws will be perfectly timed every render
