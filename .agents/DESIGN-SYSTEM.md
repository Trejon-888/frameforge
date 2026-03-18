# FrameForge Design System
**Version:** 1.0
**Purpose:** Plain-text specification for AI agents generating video overlays. Read this to produce cinema-quality video content without needing reference code.

---

## How agents use this

You do not need to read TypeScript source files. This document is the source of truth. To produce a video overlay:
1. Choose a style from the presets below
2. Follow the token values and layout rules for that style
3. Write HTML/CSS/JS (or any language that compiles to HTML) using those values
4. Call `frameforge render` with your HTML file

The rendering engine handles all timing, frame capture, and FFmpeg compositing.

---

## Style Presets

### `bold-dark` — The Default Dark Mode
High-impact dark cinema. Primary use: social media content, AI/tech demos, authority content.

**Colors**
| Token | Value | Use |
|-------|-------|-----|
| Scene background | `#07080f` | Full-frame dark backdrop |
| Panel surface | `#0d0f1a` | Browser/panel background |
| Viewport | `#0a0c18` | Content area inside panel |
| Primary accent | User-defined (e.g. `#7c6cfc`) | Active elements, borders, glows |
| Text primary | `#ffffff` | Headlines, strong content |
| Text muted | `rgba(255,255,255,0.45)` | Body copy, descriptions |
| Text faint | `rgba(255,255,255,0.28)` | Labels, metadata, timestamps |
| Surface card | `rgba(255,255,255,0.05)` | Card/cell backgrounds |
| Border | `rgba(255,255,255,0.12)` | Panel borders |
| Border soft | `rgba(255,255,255,0.07)` | Internal dividers |
| Success | `#00e57a` | Confirmed actions, done states |
| Backdrop dim | `rgba(0,0,0,0.52)` | Overlay dimming layer |

**Typography**
- Heading: `Space Grotesk` or `Inter`, weight 900, tight leading (~1.05)
- Body: `Inter`, weight 400–600
- Mono: `Space Mono` for terminal/code elements
- Letter-spacing: `-0.02em` for headlines

**Structure**
- Entry animation: `rotateX(12deg) → 0` perspective entry, `back.out(1.4)` spring ease, 0.65s
- Exit: scale to 0.94 + opacity 0, `power2.in`, 0.35s
- Background texture: white dot grid, 16px spacing, 8% opacity
- Glow: radial gradient from primary color at 18% opacity, centered behind content
- Panel shadow: `0 40px 100px rgba(0,0,0,0.9)` + accent color offset shadow

**Rules**
- Full-frame cutaway: scene background covers the speaker entirely
- Content positioned upper-center on portrait (9:16), centered on landscape
- No gap-filling: only illustrate real spoken concepts with confidence ≥ 2
- Min 7.5s spacing between overlays; 6s per overlay

---

### `poster-modernist` — Reality-First Editorial
Structured, authoritative, zero-decoration. Primary use: B2B, consulting, finance, premium professional content.

**Colors**
| Token | Value | Use |
|-------|-------|-----|
| Scene background | `#E3E2DE` | Cream backdrop — the defining character |
| Panel surface | `#ffffff` | Clean white panels |
| Viewport | `#FAFAF8` | Content area — barely off-white |
| Primary accent | `#1351AA` | Cobalt blue — single vibrant element |
| Text primary | `#141414` | Jet black headlines and body |
| Text muted | `#444343` | Deep gray body copy |
| Text faint | `#7A7A7A` | Labels, metadata, uppercase tags |
| Surface card | `#F5F5F2` | Card backgrounds — off-white |
| Border | `#C7C7C7` | All structural borders |
| Border soft | `#E0DFD9` | Internal dividers |
| Success | `#0A7C59` | Dark green — readable on cream |
| Backdrop | `rgba(227,226,222,0.97)` | Cream overlay, near-opaque |

**Typography**
- Heading: `Inter` at weight 900, or `General Sans` / `Aileron` if available
- Body: `Inter` weight 400–600
- Mono: `DM Mono` for labels and technical text
- Letter-spacing headlines: `-0.03em` to `-0.04em` — compressed, authoritative
- Text transform: uppercase for section labels and tags (tracking `0.2em`)
- Line-height headlines: `0.85` to `1.05` — tight, poster-like

**Structure**
- Border-radius: **0px everywhere** — no rounded corners, no softness
- Shadows: **none** — flat color blocks create depth instead
- Entry animation: `y: 28px → 0`, `scale: 0.97 → 1`, `power2.out`, 0.35s (no rotation, no spring)
- Exit: scale 0.94 + opacity 0, `linear`, 0.35s
- No dot grid background — clean flat cream
- Grid: strict 12-column (cols 1–3 = label sidebar, cols 4–12 = primary content)
- Borders: 1px solid `#C7C7C7` as structural dividers between all sections

**Rules**
- No gradients — use flat color blocks for contrast
- No glows — rely on typography weight and color contrast
- No bouncy or organic easing — strictly linear or power curves
- Cobalt blue (`#1351AA`) is used sparingly: one element per composition maximum
- The typographic contrast (900 weight, tight tracking, large size) IS the design
- Hover states: background transitions from surface to white in 0.3s linear

---

## Layout Principles for Video Overlays

### Portrait (9:16 — Short-Form)
- Canvas: `1440 × 2560px` reference
- Scale factor: `width / 1440` (1.0 at reference, proportional at other sizes)
- Layout: **vertical stack** — tag/headline above, browser/content below
- Panel width: 92% of canvas width (`1325px` at reference)
- Vertical position: upper region with `8%` top padding from scene top
- Browser viewport height: `480px` at reference scale

### Landscape (16:9)
- Canvas: `1920 × 1080px` reference (or source video dimensions)
- Scale factor: `Math.min(width, height) / 1080`
- Layout: **two-column horizontal** — headline left (280px), browser right (1000px)
- Centered vertically in the full-frame cutaway canvas

### Portrait layout structure
```
┌──────────────────────────────────────┐  ← scene (1440×2560, full-frame)
│          (8% top padding)            │
│  ┌────────────────────────────────┐  │
│  │  TAG LABEL                    │  │  ← 10px uppercase, tracking 2.5px
│  │  Headline text that            │  │  ← 32px, weight 900
│  │  matters here                 │  │
│  │  Description body copy goes   │  │  ← 13px, muted color
│  │  here for context             │  │
│  └────────────────────────────────┘  │
│                16px gap              │
│  ┌────────────────────────────────┐  │
│  │ ● ● ●  browser.url.here       │  │  ← macOS titlebar
│  │ Nav  Active  Nav  Nav         │  │  ← nav tabs
│  │ ┌──────────────────────────┐  │  │
│  │ │  viewport content        │  │  │  ← 480px height
│  │ │  (cards, grid, form)     │  │  │
│  │ └──────────────────────────┘  │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Landscape layout structure
```
┌────────────────────────────────────────────────────────┐
│  ┌──────────────┐    ┌────────────────────────────────┐│
│  │ TAG LABEL    │    │ ● ● ●  browser.url             ││
│  │ Headline     │    │ Nav  Active  Nav                ││
│  │ text here    │    │ ┌──────────────────────────────┐││
│  │              │    │ │  viewport content (380px H)  │││
│  │ Description  │    │ └──────────────────────────────┘││
│  └──────────────┘    └────────────────────────────────┘│
└────────────────────────────────────────────────────────┘
```

---

## Cinema Component Patterns

### Browser Mockup
Always include: macOS traffic dots (red `#ff5f57`, yellow `#ffbd2e`, green `#28c840`), URL bar, nav tabs with one active tab highlighted in the primary accent color.

### Cursor Interaction
For components that show a software interaction: animate a semi-transparent ring cursor from off-screen to the target element (0.5–0.7s), pause, simulate click (ring scales to 0.6 then back to 1.0 in 0.12s each), then trigger the UI response.

### Entry timing
- Scene opacity: 0 → 1, 0.3s
- Browser enters at: +0.05s from scene start
- Headline tag appears: +0.6s
- Headline h1: +0.75s
- Description: +0.95s
- Content elements stagger: +1.1s, 0.1–0.15s between each
- Cursor appears: +1.8s (after content is established)
- Exit begins: `durationMs - 400ms`

### SVG Line Drawing
Use `strokeDashoffset` animation to reveal connection lines and chart paths:
1. Set `strokeDasharray = totalLength` and `strokeDashoffset = totalLength`
2. Animate `strokeDashoffset → 0` over 0.8–1.2s with `power2.inOut`
3. Area fill fades in at +0.5s after line completes

### Spring Physics for Counters (dark styles)
```
ζ = 0.42, ω = 9, ωD = ω × √(1 - ζ²)
v = target × (1 - e^(-ζωt) × cos(ωD × t))
```
Use linear interpolation for light/modernist styles (no spring).

---

## Illustration Trigger Guide

When should each component appear? Use these keyword patterns as a guide:

| Component | Triggers on | Data to extract |
|-----------|------------|-----------------|
| crm-calendar | "book meeting", "schedule appointment", "calendar", "CRM" | — |
| social-feed | "social media", "post content", "instagram/linkedin/tiktok" | — |
| ai-workflow | "AI agent", "automate", "workflow", "pipeline" | — |
| stat-counter | Numbers: "50%", "$12K", "47 clients" | value, suffix, label |
| pipeline-board | "sales pipeline", "close deals", "lead generation" | — |
| inbox-send | "send emails", "cold outreach", "personalized messages" | — |
| dashboard | "track performance", "analytics", "real-time data" | — |
| code-terminal | "API integration", "technical setup", "deploy" | — |

---

## Quality Gate — What "Cinema Quality" Means

Before shipping any overlay, verify:
- [ ] Content fills the canvas appropriately — no tiny card in a huge frame
- [ ] Text is readable at phone viewing distance (min 11px at 1440px canvas)
- [ ] Entry animation feels purposeful, not gratuitous
- [ ] Colors match the active style preset — no hardcoded values
- [ ] Portrait layout is vertical stack, not compressed two-column
- [ ] Cursor interaction shows the software WORKING, not just existing
- [ ] Exit is clean and doesn't clip or flash
- [ ] No hardcoded dark backgrounds in light styles, no hardcoded light in dark styles

---

## Adding a New Style

To add a new style preset, add an entry to `packages/core/src/edit-styles.ts` with:
- All required `EditStyleColors` fields (primary, secondary, background, text, textAlt, surface, border, muted)
- `theme: "dark" | "light"` — this drives the entire cinema token system
- Typography, elements (borderRadius, cornerStyle), animations

The cinema renderer base classes automatically adapt to the theme. You do not need to touch the renderers.

---

*This document is the source of truth for design decisions. Code is derived from it, not the other way around.*
