# Component System for Video Editing — Motion Graphics Engine

**Status: Completed — 2026-03-17**

## Context

The current video editing overlays are **styled divs with CSS opacity transitions**. Meanwhile, FrameForge's renderer has proven it can handle Canvas 2D particle systems, Three.js 3D scenes, WebGL shaders, and GSAP timelines — all deterministically. The gap is massive. The editor doesn't use any of this power.

This plan introduces a **component system** where each overlay is a rich, animated component built with real web technologies (GSAP for choreography, Canvas for particles, SVG for line-drawing reveals). Components are code generators — they produce HTML/CSS/JS strings that get injected into the transparent overlay page.

---

## Architecture

### Core Concept

A **ComponentRenderer** is a TypeScript class that accepts data + timing + style and returns HTML/CSS/JS strings. The strings use GSAP (loaded from CDN) for animation, read `__frameforge.currentTimeMs` for timing, and render on transparent backgrounds for FFmpeg compositing.

```
OverlayTimeline (unchanged) → ComponentRenderer.render() → HTML/CSS/JS → Overlay Page → Puppeteer → FFmpeg
```

### File Structure

```
packages/core/src/components/
  types.ts              — Interfaces (ComponentRenderer, ComponentOutput, etc.)
  registry.ts           — Singleton registry for component renderers
  assembler.ts          — Orchestrates rendering, replaces generateOverlayHTML
  init.ts               — Imports and registers all built-in renderers
  renderers/
    kinetic-title.ts    — Words fly in from different directions (GSAP)
    animated-lower-third.ts — Line draw → bar expand → name types in (GSAP)
    number-counter.ts   — Spring physics counting animation (pure JS)
    particle-burst.ts   — Canvas 2D particle explosion at transitions
    glass-callout.ts    — Backdrop-blur card with staggered content reveal (GSAP)
    progress-bar.ts     — Thin animated bar showing video progress (pure CSS/JS)
    cta-reveal.ts       — Dramatic CTA with scale + glow (GSAP)
    chapter-wipe.ts     — Full-width wipe transition between topics (GSAP)
```

### Key Interfaces

```typescript
interface ComponentRenderer {
  readonly type: string;                    // e.g., "kinetic-title"
  readonly dependencies: ComponentDependency[];  // e.g., GSAP CDN
  render(data: Record<string, any>, timing: ComponentTiming, ctx: ComponentContext): ComponentOutput;
}

interface ComponentOutput {
  css: string;      // Injected once per type into <style>
  html: string;     // DOM markup for this instance
  updateJs: string; // Runs every frame — receives `t` (currentTimeMs) and `el` (root DOM)
  initJs?: string;  // Runs once at startup
}

interface ComponentContext {
  style: EditStyle;     // Full style preset (colors, typography, elements, animations)
  width: number;        // Video width
  height: number;       // Video height
  scale: number;        // Math.min(width, height) / 1080 — proportional scaling
  instanceId: string;   // Unique DOM id (ff-c-0, ff-c-1, etc.)
}
```

### How GSAP Works

Each component creates a **paused GSAP timeline** in `initJs`, then manually drives it via `tl.time(elapsed)` in `updateJs`. This gives frame-perfect control synced to FrameForge's virtual clock. GSAP is loaded once from CDN in the page `<head>`.

### Integration Point

In `editor.ts`, replace:
```typescript
overlayScript = generateOverlayHTML(overlays, style, dims.width, dims.height);
```
with:
```typescript
import "./components/init.js";
import { assembleOverlayPage } from "./components/assembler.js";
const { script, dependencies } = assembleOverlayPage(overlays, style, dims.width, dims.height);
overlayScript = script;
// dependencies[] → <script> tags in <head>
```

`buildOverlayOnlyHTML()` gets a new `dependencies: string[]` parameter for CDN script tags.

---

## Components (8 total)

| Component | Replaces | Technology | Visual |
|-----------|----------|------------|--------|
| **kinetic-title** | hook-card | GSAP | Words fly in from random directions with rotation, background scales in with bounce |
| **animated-lower-third** | lower-third | GSAP | Line draws from left → expands to bar → name types itself → title fades |
| **number-counter** | stat-callout | Pure JS | Numbers count up from 0 with spring overshoot physics |
| **glass-callout** | key-point | GSAP | Glass card slides in, content staggers in with spring |
| **particle-burst** | (new) | Canvas 2D | 200+ particles explode at topic transitions, seeded PRNG for determinism |
| **progress-bar** | (new) | Pure CSS/JS | Thin accent-colored bar filling across bottom |
| **cta-reveal** | cta-card | GSAP | Scale from center with glow pulse |
| **chapter-wipe** | chapter-marker | GSAP | Full-width accent bar wipes across with label |

---

## Implementation Phases

### Phase 1: Foundation
1. Create `types.ts` — all interfaces
2. Create `registry.ts` — singleton with register/get/list/collectDependencies
3. Create `assembler.ts` — generates page script from component outputs, deduplicates deps
4. Modify `editor.ts` — call assembler, pass deps to `buildOverlayOnlyHTML`
5. Create `init.ts` — registers all built-in renderers

### Phase 2: Port existing overlays → components (8 renderers)
6. `kinetic-title.ts` — GSAP per-word animation with rotation + bounce
7. `animated-lower-third.ts` — GSAP line draw + typewriter
8. `number-counter.ts` — Spring physics counter (pure JS, no deps)
9. `glass-callout.ts` — GSAP slide-in with backdrop-blur + stagger
10. `particle-burst.ts` — Canvas 2D particles with seeded PRNG
11. `progress-bar.ts` — Pure CSS/JS thin bar
12. `cta-reveal.ts` — GSAP scale + glow
13. `chapter-wipe.ts` — GSAP horizontal wipe

### Phase 3: Wire up + test
14. Update `overlay-generator.ts` — map overlay types to component types
15. Add particle-burst as a new overlay type triggered at topic transitions
16. Add progress-bar as always-on component
17. Test: build, run tests, render a real video, upload for review

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/editor.ts` | Import assembler, pass deps to HTML builder |
| `packages/core/src/overlay-generator.ts` | Add particle-burst + progress-bar to timeline, keep existing types |
| `packages/core/src/index.ts` | Export component system types and registry |
| `packages/core/src/components/*` | All new files |

## Files NOT Modified

| File | Why |
|------|-----|
| `word-captions.ts` | Caption system is separate, already upgraded |
| `ffmpeg.ts` | Compositing pipeline unchanged |
| `frame-capture.ts` | Transparent capture unchanged |
| `video-probe.ts` | Probing unchanged |
| `edit-styles.ts` | Style presets consumed as-is by components |

---

## Design Decisions

1. **GSAP for choreography** — Already proven with FrameForge. Paused timelines driven by virtual time = frame-perfect.
2. **Components are code generators, not runtime modules** — Matches existing pattern (overlay-generator returns template strings).
3. **No component nesting in v1** — Complex components handle their own sub-elements internally.
4. **Seeded PRNG for determinism** — `seed = timing.startMs`, LCG algorithm. No `Math.random()`.
5. **CSS selectors prefixed per type** — `.ff-kt-` for kinetic-title, `.ff-lt-` for lower-third, etc. No conflicts.
6. **Backward compatible** — `generateOverlayHTML()` stays exported (deprecated). `OverlayElement` type unchanged.

---

## Verification

1. `pnpm --filter @frameforge/core test` — all existing tests pass (no regression)
2. `pnpm --filter @frameforge/core build` — builds clean
3. Render test video: `node packages/core/dist/cli.js edit <video> --srt <srt> --style neo-brutalist --output v5-components.mp4`
4. Visual check: GSAP animations play smoothly, particles render, progress bar visible, lower-third types in
5. Upload to 0x0.st for phone review
