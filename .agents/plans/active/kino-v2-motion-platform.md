# kino v2 — Agentic Motion Platform

**Status:** Active
**Started:** 2026-04-01
**Goal:** Transform kino from an overlay renderer into a full motion graphics platform where AI agents create After Effects-quality geometric animations from transcript concepts.

---

## Vision

kino renders anything a browser can render. The rendering engine is proven. What's missing is the **creative abstraction layer** — the system that lets an AI agent think in visual metaphors (wireframe pyramids, dot patterns, particle streams) instead of text cards.

The stack:
```
AI Agent (concept extraction + metaphor mapping)
        ↓
Scene Composition (primitives + timing + sound cues)
        ↓
Keyframe Engine (property interpolation + easing)
        ↓
Renderers: ASS (text) | Canvas 2D (geometry) | FFmpeg (composite)
```

---

## Workstreams

### WS-1: Keyframe Animation Engine
**Location:** `packages/core/src/keyframes/`
**Priority:** P0 — foundation, everything depends on this

A declarative keyframe system where any numeric property can be animated between values with custom easing.

**API Design:**
```typescript
interface Keyframe {
  time: number;        // seconds
  value: number;       // target value
  easing?: string;     // "linear" | "ease-out" | "cubic-bezier(0.16,1,0.3,1)"
}

interface PropertyTimeline {
  property: string;    // "x" | "y" | "scale" | "rotation" | "opacity" | "strokeWidth" ...
  keyframes: Keyframe[];
}

interface AnimatedElement {
  id: string;
  type: "circle" | "rect" | "line" | "path" | "text" | "group";
  properties: PropertyTimeline[];
  children?: AnimatedElement[];  // for groups
}

// Core function: given an element and a time, return all interpolated values
function resolveAtTime(element: AnimatedElement, time: number): Record<string, number>;

// Easing: input 0-1 → output 0-1
function createEasing(spec: string): (t: number) => number;
```

**Easing library (built-in):**
- linear, ease-in, ease-out, ease-in-out
- power2.in/out/inOut, power3.in/out/inOut
- back.in/out/inOut (overshoot)
- elastic.out (bounce)
- cubic-bezier(a,b,c,d) — custom curves
- step(n) — discrete steps

**Interpolation modes:**
- Numeric (default): linear interpolation between values
- Color: HSL interpolation for smooth color transitions
- Path: interpolate along an SVG path

**Output formats:**
- JavaScript object (for Canvas 2D renderer)
- FFmpeg expression string (for native filters)
- CSS @keyframes (for DOM elements)

**Tests:** Property interpolation, easing curves, edge cases (single keyframe, time before first, time after last), group transforms.

---

### WS-2: Scene Composition Format
**Location:** `packages/core/src/scene-format/`
**Priority:** P0 — the contract between AI agents and the renderer
**Depends on:** WS-1 (keyframe types)

A JSON format that AI agents generate. Describes a full motion graphics scene as a tree of animated primitives.

**Format:**
```json
{
  "version": "2.0",
  "canvas": { "width": 1080, "height": 1920, "fps": 30, "duration": 26.1 },
  "scenes": [
    {
      "id": "wireframe-pyramid",
      "start": 5.0,
      "end": 10.0,
      "background": "#000000",
      "mode": "full-frame",
      "elements": [
        {
          "id": "grid",
          "type": "grid",
          "props": { "spacing": 60, "color": "rgba(255,255,255,0.08)" },
          "animations": [
            { "property": "opacity", "keyframes": [
              { "time": 0, "value": 0 },
              { "time": 0.5, "value": 1, "easing": "ease-out" }
            ]}
          ]
        },
        {
          "id": "pyramid",
          "type": "wireframe",
          "props": { "shape": "pyramid", "size": 400, "x": 540, "y": 960 },
          "animations": [
            { "property": "assembleProgress", "keyframes": [
              { "time": 0.3, "value": 0 },
              { "time": 2.0, "value": 1, "easing": "cubic-bezier(0.16,1,0.3,1)" }
            ]}
          ]
        }
      ],
      "sound": [
        { "type": "whoosh", "time": 0.3 },
        { "type": "hit", "time": 2.0 }
      ]
    }
  ],
  "captions": {
    "style": "editorial-studio",
    "position": "bottom",
    "wordTimings": "./transcript.json"
  }
}
```

**Scene modes:**
- `full-frame` — replaces the video entirely (black canvas + geometry)
- `overlay` — composited on top of source video (magenta key or transparent)
- `split` — half screen video, half screen motion graphics

**Renderer:** Reads this format → generates Canvas 2D HTML → kino renders via Puppeteer. Captions go through ASS for speed.

---

### WS-3: Open Element System
**Location:** `packages/core/src/elements/`
**Priority:** P1 — the visual vocabulary (unlimited)
**Depends on:** WS-1 (keyframe engine for animation)

NOT a fixed list of geometric shapes. An open registry where ANY visual element can be registered and animated through the keyframe engine. The AI agent decides what to create — the system imposes no creative limits.

**Element types (extensible, not exhaustive):**
| Category | Examples | Renderer |
|----------|---------|----------|
| Shapes | Circles, rects, paths, polygons, wireframes | Canvas 2D |
| Text | Headlines, captions, per-character kinetic typography | Canvas 2D / DOM |
| Images | Photos, screenshots, icons, emoji | Canvas drawImage / DOM img |
| UI Mockups | Scrolling screens, buttons, forms, dashboards | DOM + CSS |
| Data Viz | Charts, counters, progress bars, gauges | Canvas 2D / SVG |
| Particles | Streams, bursts, trails, confetti, comets | Canvas 2D rAF |
| Video | Picture-in-picture, screen recordings | DOM video element |
| SVG | Lottie playback, animated icons, morphing paths | SVG / lottie-web |
| 3D | CSS perspective transforms, WebGL scenes | CSS / Three.js |
| Transitions | Wipes, dissolves, iris, slide | Canvas 2D / CSS |
| Backgrounds | Gradients, grids, noise, patterns | Canvas 2D |
| Masks | Reveal masks, clip paths, animated mattes | Canvas 2D clip / CSS |

**Element interface:**
```typescript
interface SceneElement {
  id: string;
  type: string;                    // open string — not a union of fixed types
  props: Record<string, any>;      // element-specific properties
  animations: PropertyTimeline[];  // keyframed property changes
  children?: SceneElement[];       // nesting for groups
}

type ElementRenderer = (
  ctx: CanvasRenderingContext2D | null,
  container: HTMLElement | null,
  props: Record<string, any>,
  time: number
) => void;
```

**Registry pattern:**
```typescript
registerElement("wireframe", wireframeRenderer);
registerElement("image-reveal", imageRevealRenderer);
registerElement("counter", counterRenderer);
// Agent can register custom renderers at runtime
```

The agent has full creative freedom. It can use built-in element types or write custom Canvas/DOM rendering code inline via the scene format.

---

### WS-4: Live Preview Server
**Location:** `packages/core/src/preview-server/`
**Priority:** P1 — creative iteration speed
**Independent:** no dependencies on other workstreams

Express + WebSocket server that serves overlay HTML with the source video playing underneath.

**Architecture:**
```
Browser tab:
  ├── <video src="source.mp4"> (bottom layer, native playback)
  └── <iframe src="/overlay"> (top layer, overlay HTML)

Server:
  ├── GET /              → preview page (video + iframe)
  ├── GET /overlay       → current overlay HTML
  ├── WS  /ws            → hot-reload signal
  └── File watcher       → watches overlay.html, scene.json
```

**Features:**
- Video plays natively (no Puppeteer)
- Overlay iframe reloads on file change
- Timeline scrubber syncs video.currentTime with overlay
- Frame-by-frame step (arrow keys)
- Side panel: current time, active scene, active captions

**CLI:** `kino preview-live scene.json --video source.mp4`

---

### WS-5: Sound Design System
**Location:** `packages/core/src/sound/`
**Priority:** P2 — polish layer
**Independent:** no dependencies on other workstreams

FFmpeg-based audio mixing. Takes sound cues from the scene composition format and mixes them with the source audio.

**Sound library (bundled, royalty-free):**
| Category | Sounds |
|----------|--------|
| Hits | kick, snap, click, thud, glass |
| Transitions | whoosh-in, whoosh-out, sweep-up, sweep-down |
| Accents | pop, ding, chime, sparkle |
| Ambient | low-hum, digital-texture, breath |

**Format:** WAV files in `packages/core/assets/sounds/`

**Mixer:**
```typescript
interface SoundCue {
  type: string;      // sound name from library
  time: number;      // seconds
  volume?: number;   // 0-1, default 0.7
  pan?: number;      // -1 to 1, default 0
}

function buildAudioMixArgs(
  sourceVideo: string,
  cues: SoundCue[],
  output: string
): string[];  // FFmpeg args
```

Uses FFmpeg `amix` / `adelay` / `volume` filters to mix sound cues at precise timestamps.

---

### WS-6: Parallel Frame Capture
**Location:** `packages/core/src/frame-capture.ts` (modify existing)
**Priority:** P2 — performance
**Independent:** no dependencies on other workstreams

Split frame range across N Puppeteer browser instances, each rendering a chunk. Merge frame sequences into FFmpeg.

**Design:**
```typescript
interface ParallelCaptureOptions {
  workers: number;  // default: Math.min(4, os.cpus().length / 2)
  // ... existing FrameCaptureOptions
}
```

Each worker:
1. Launches its own Puppeteer browser
2. Navigates to the same overlay HTML
3. Renders frames [start, end) for its chunk
4. Pipes frames to a shared FFmpeg stdin (in order)

**Constraint from PROJECT-MEMORY:** "Parallel renders cause frame timeouts — Running 4+ Puppeteer/Chrome instances simultaneously overwhelms system resources." Solution: limit to 2-3 workers, benchmark before defaulting higher.

---

## Worktree Plan

| Branch | Workstream | Can parallelize? |
|--------|-----------|-----------------|
| `feat/keyframe-engine` | WS-1 + WS-2 + WS-3 | Foundation — build first or in parallel with independent streams |
| `feat/preview-server` | WS-4 | ✅ Fully independent |
| `feat/sound-design` | WS-5 | ✅ Fully independent |
| `feat/parallel-capture` | WS-6 | ✅ Fully independent |

WS-1/2/3 are coupled (primitives need keyframes, scene format references both) — same worktree.
WS-4, WS-5, WS-6 are independent — separate worktrees, can build in parallel.

---

## Success Criteria

1. An AI agent can produce a scene composition JSON → kino renders geometric motion graphics at AE quality
2. `kino edit --native` renders captions in seconds (done ✅)
3. `kino preview-live` shows overlay + video with hot-reload
4. Sound cues mix with source audio at precise timestamps
5. Parallel capture achieves 2-3x speedup on multi-core machines
6. 280+ tests passing (currently 260)

---

## Non-Goals (for this plan)

- GUI timeline editor (agents don't need one)
- 3D rendering / WebGL (2D geometric art covers the target aesthetic)
- Plugin ecosystem (the agent IS the plugin)
- Real-time playback (preview at 2-5fps is enough)
