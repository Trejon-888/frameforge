# kino Style Library

A collection of named design systems for kino video production. Each style is a complete prompt: color palette, typography, visual effects, animation specs, scene structure, and special components — ready to drop into any kino scene.

---

## How to Use

1. Pick a style that fits your content goal
2. Copy the style spec into your scene prompt
3. Build your HTML scene using the spec's colors, fonts, and animation patterns
4. Render with kino

Each style includes a **Kino Rendering** section at the bottom that specifies the recommended rendering approach (CSS, GSAP, Canvas 2D, Three.js, WebGL) and optimal scene duration/FPS.

---

## Style Catalog

| Style | Aesthetic | Energy | Best For | Renderer |
|-------|-----------|--------|----------|----------|
| [Neon Velocity](styles/neon-velocity.md) | Brutalist glass, neon lime on near-black | High | Tech SaaS, developer tools, launches | GSAP |
| [Brutalist Editorial](styles/brutalist-editorial.md) | Poster-first, red-orange gradient blobs, Clash Display | High | Brand announcements, fashion, premium | GSAP |
| [Swiss Minimalist](styles/swiss-minimalist.md) | Grid-pure, helvetica, monochrome, zero decoration | Low | Architecture, luxury, editorial | CSS-only |
| [Glassmorphism Dark](styles/glassmorphism-dark.md) | Depth layers, blur panels, ethereal glows | Medium | AI products, premium SaaS, spatial UI | GSAP + CSS |
| [Kinetic Typography](styles/kinetic-typography.md) | Text IS the animation, word-by-word reveals | High | Quote videos, manifestos, lyric-style | GSAP |
| [Synthwave Retro](styles/synthwave-retro.md) | 80s retrowave, perspective grid, CRT scanlines | High | Gaming, nostalgia, music, entertainment | Canvas 2D + CSS |
| [Data Viz Technical](styles/data-viz-technical.md) | Dashboard, charts, terminals, engineering | Medium | Analytics, metrics, developer content | Canvas 2D + GSAP |
| [Soft Wellness](styles/soft-wellness.md) | Pastel-organic, breathing blobs, serif warmth | Low | Health, lifestyle, mindfulness, Gen-Z | CSS-only |
| [Cinematic Dark](styles/cinematic-dark.md) | Film grain, letterbox, tungsten light, dramatic | Low | Launches, manifestos, brand films | Canvas 2D + CSS |
| [Neo-Brutalist](styles/neo-brutalist.md) | Hard shadows, yellow+black, stamp animations | High | Startups, protest aesthetic, raw energy | CSS-only |

---

## Style Format

Each style file follows this structure:

```
# Summary          — What the style is and who it's for
# Style            — Design philosophy + full spec (colors, type, effects, animations)
# Layout & Structure — Scene sections: Title Card, Opening Scene, Feature Section, End Card
# Special Components — Unique interactive/animated elements with implementation notes
# Special Notes    — MUST / DO NOT rules
## Kino Rendering  — Recommended renderer, duration, FPS, canvas size
```

---

## Adding a Style

1. Create `library/styles/[style-name].md`
2. Follow the format above exactly
3. Add a row to the catalog table in this README
4. Include a **Kino Rendering** section — specify renderer, duration, FPS, and canvas

---

## Style Inspirations

These styles are drawn from and extend the [SuperDesign prompt library](https://superdesign.dev) — adapted for **video animation** rather than static web design. Key adaptations:
- Layout sections describe **scenes** (Title Card, Opening, Feature, End Card), not webpage sections
- Animation specs include exact durations, easing functions, and frame counts
- Each style includes a **Kino Rendering** recommendation (which kino technology fits best)
