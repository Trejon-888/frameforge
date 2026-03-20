<p align="center">
  <b style="font-size: 48px;">
    <span style="color: #e94560;">F</span><span style="color: #6366f1;">F</span>
  </b>
</p>

<h1 align="center">FrameForge</h1>

<p align="center">
  <strong>If a browser can render it, FrameForge can record it.</strong><br>
  <em>Programmatic video generation + AI-powered video editing. Framework-agnostic, agent-native.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@frameforge/core"><img src="https://img.shields.io/npm/v/@frameforge/core?style=flat-square&color=e94560&label=npm" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-6366f1?style=flat-square" alt="MIT License"></a>
  <a href="#"><img src="https://img.shields.io/badge/tests-238%20passing-10b981?style=flat-square" alt="Tests"></a>
  <a href="#"><img src="https://img.shields.io/badge/node-%3E%3D20-333?style=flat-square" alt="Node 20+"></a>
</p>

---

## What is FrameForge?

FrameForge is two things in one:

**1. Programmatic video generation** — render any animated HTML page (GSAP, Three.js, CSS, p5.js, Svelte, React — anything) into a deterministic MP4 via headless Chrome + FFmpeg. No framework lock-in, no DSL.

**2. AI-powered video editing** — take source footage, extract word-level captions via WhisperX, then have an AI agent write overlay decisions in plain JSON. FrameForge renders the overlays as transparent frames and composites them natively via FFmpeg. Any model — Claude, GPT, Gemini, local — can direct the edit.

```bash
npm install @frameforge/core
```

---

## Quickstart

### Option 1: Edit a video with AI overlays

```bash
# Step 1 — Extract transcript with word-level timing
frameforge extract-transcript clip.mp4 -o transcript.json

# Step 2 — Give transcript.json to any AI agent with EDIT-AGENT-CONTRACT.md
#           The agent writes overlay-decisions.json

# Step 3 — Preview overlays (one frame per overlay, ~30s)
frameforge preview-overlays clip.mp4 --overlays overlay-decisions.json -o preview.html

# Step 4 — Full render
frameforge render-overlays clip.mp4 \
  --overlays overlay-decisions.json \
  --srt captions.srt \
  --quality balanced \
  -o output.mp4
```

### Option 2: Render any HTML page

```bash
npx frameforge render animation.html --duration 10 --fps 30 -o video.mp4
```

### Option 3: TypeScript SDK

```typescript
import { Scene, Text, Shape, fadeIn, stagger } from "@frameforge/sdk";

const scene = new Scene({ duration: 5, background: "#0a0a0a" });

const title = new Text("Hello World", { fontSize: 72, fontWeight: "bold", color: "#fff" });
title.animate("opacity", { 0: 0, 0.5: 0, 1.5: 1 });

scene.add(title);
await scene.render("output.mp4");
```

### Option 4: Python SDK

```python
from frameforge import Scene, Text

scene = Scene(duration=5, background="#0a0a0a")
scene.add(Text("Hello World", font_size=72, font_weight="bold", color="#ffffff"))
scene.render("output.mp4")
```

---

## Why FrameForge?

| | FrameForge | Remotion | Motion Canvas |
|---|:---:|:---:|:---:|
| **Any HTML/CSS/JS** | ✅ | ❌ React only | ❌ Custom DSL |
| **GSAP, Three.js, p5.js** | ✅ Native | ⚠️ Wrappers | ❌ |
| **CSS Animations** | ✅ Automatic | ⚠️ Limited | ❌ |
| **Python SDK** | ✅ | ❌ | ❌ |
| **Video editing from footage** | ✅ | ❌ | ❌ |
| **Word-level captions (WhisperX)** | ✅ | ❌ | ❌ |
| **AI Agent Integration** | ✅ skill.md + CLI Contract | ❌ | ❌ |
| **Multi-scene + Transitions** | ✅ 23 types | ❌ | ✅ |
| **Subtitles (SRT/VTT)** | ✅ | ❌ | ❌ |
| **Zero config** | ✅ | ❌ React setup | ❌ |

---

## Features

### 🎬 Core Renderer
- **Time Virtualization** — Patches `Date.now`, `performance.now`, `requestAnimationFrame`, `setTimeout`, `setInterval`, CSS Animations, `<video>`/`<audio>` — every time API, every animation library works
- **Frame-perfect capture** — Deterministic via headless Chrome CDP screenshots; rendering is independent of system speed
- **FFmpeg pipeline** — Frames piped directly to FFmpeg stdin — no temp files, any codec, quality-matched encoding

### ✂️ Video Editing Engine
- **`frameforge edit`** — Single command: source footage → edited video with word-level captions + auto-generated motion graphics overlays
- **Word-level captions** — WhisperX word timing → 2-4 word groups, 5 animation presets (pop-in, karaoke, highlight, minimal, bold-center)
- **Quality-matched encoding** — ffprobe extracts source bitrate/codec → output is visually identical to input
- **Transparent overlay compositing** — Overlay frames rendered in browser as transparent PNGs, composited by FFmpeg natively — source video never touches the browser
- **Multi-format output** — `--format landscape|vertical|square|source` with automatic FFmpeg scale+pad
- **Style presets** — neo-brutalist, clean-minimal, corporate, bold-dark, poster-modernist

### 🤖 Edit Agent Contract
- **Model-agnostic** — Any AI (Claude, GPT, Gemini, local) reads `EDIT-AGENT-CONTRACT.md` and writes overlay decisions in plain JSON
- **`frameforge extract-transcript`** — Extracts enriched transcript with pause detection, energy curve, stat detection, narrative segmentation, and suggested entry points
- **`frameforge render-overlays`** — Takes agent-written JSON + source video → professionally edited output
- **`frameforge preview-overlays`** — One frame per overlay, ~30s, catches 90% of issues before committing to 8-minute full render
- **5 Style Kits** — kinetic-orange, minimal-authority, bold-dark-social, clean-professional, cosmic-particles
- **4 Editorial Templates** — authority-builder, viral-hook, educational-breakdown, social-proof-stack

### 🎞️ Composition & Subtitles
- **Multi-scene** — Stitch multiple HTML pages as scenes via `frameforge compose`
- **23 Transitions** — fade, dissolve, wipe, slide, circle, smooth, pixelize, zoom, and more
- **Subtitles** — SRT/VTT parser with customizable HTML overlay synced to virtual time

### 🧩 SDKs
- **TypeScript SDK** — `Scene`, `Text`, `Shape`, `Image` elements with chainable animations
- **Python SDK** — Same API surface, generates HTML + calls Node renderer
- **Animation Primitives** — `fadeIn`, `fadeOut`, `slideIn`, `slideOut`, `scaleIn`, `rotateIn`, `stagger`

### 🖥️ Studio
- **Visual Timeline** — Scrub to any frame, see it instantly
- **Hot-reload** — Edit your HTML, see changes immediately
- **Keyboard-first** — Space, arrows, Home/End, number keys
- **One-click render** — Preview → Render MP4

### 🤖 AI-Native
- **Agent Skill** — Comprehensive `skill.md` + `EDIT-AGENT-CONTRACT.md` for Claude Code and any coding agent
- **Agent-friendly errors** — Parseable error messages with actionable hints
- **Model-agnostic edit pipeline** — Any AI writes overlay decisions; FrameForge renders them

---

## CLI Reference

```bash
# ── Video Editing ──────────────────────────────────────────────────────────

# Full auto-edit pipeline (probe + transcribe + overlay generation + render)
frameforge edit <video> [options]
  --word-timings <path>     WhisperX JSON with word-level timing
  --style <preset>          neo-brutalist | clean-minimal | corporate | bold-dark
  --caption-style <preset>  pop-in | karaoke | highlight | minimal | bold-center
  --format <format>         landscape | vertical | square | source
  --quality <level>         fast | balanced | slow | lossless
  --speaker-name <name>     For lower-third identity card
  --output <path>

# Extract enriched transcript (pause detection, stats, energy curve)
frameforge extract-transcript <video> -o transcript.json

# Render agent overlay decisions onto source video
frameforge render-overlays <video> --overlays decisions.json [--srt captions.srt] -o output.mp4

# Preview overlays before full render (~30s vs 8-12min)
frameforge preview-overlays <video> --overlays decisions.json -o preview.html

# ── Programmatic Video ─────────────────────────────────────────────────────

# Render any HTML page or scene manifest
frameforge render <input> -o video.mp4
  -d, --duration <seconds>  Duration (required for HTML files)
  --fps <number>            Frames per second (default: 30)
  --width <pixels>          Width (default: 1920)
  --height <pixels>         Height (default: 1080)

# Preview a single frame as PNG
frameforge preview <input> --frame 75 -o preview.png

# Compose multiple scenes with transitions
frameforge compose composition.json -o output.mp4

# Launch visual studio
frameforge-studio scene.json
```

---

## The Edit Agent Contract

FrameForge is a **rendering engine**, not an AI. Any AI agent reads `EDIT-AGENT-CONTRACT.md` and produces overlay decisions as JSON. FrameForge renders them.

### What the agent produces

```json
[
  {
    "startMs": 4200,
    "durationMs": 5000,
    "type": "hook-phrase",
    "rationale": "Post-pause entry after hook setup; kinetic phrase amplifies the thesis",
    "css": ".cls-__ID__-wrap { position: absolute; top: 15%; width: 100%; text-align: center; }",
    "html": "<div class=\"cls-__ID__-wrap\"><span class=\"cls-__ID__-word\">AUTOMATE</span></div>",
    "initJs": "el._tl = gsap.timeline({paused:true}); el._tl.fromTo('.cls-__ID__-word', {scale:0, opacity:0}, {scale:1, opacity:1, duration:0.4, ease:'back.out(1.7)'});"
  }
]
```

### What FrameForge renders

The agent writes CSS, HTML, and GSAP timelines with `__ID__` as a namespace. FrameForge replaces `__ID__` with a unique instance ID, renders each overlay as a transparent PNG frame via headless Chrome, and FFmpeg composites them onto the source video.

**Any model, any overlay. The contract is the only coupling.**

Read `.agents/EDIT-AGENT-CONTRACT.md` for the full 5-phase editing loop: PERCEIVE → ORIENT → COMPOSE → PREVIEW → RENDER.

---

## How Time Virtualization Works

FrameForge injects a script that patches all browser time APIs **before** your page loads:

| API | What Happens |
|-----|-------------|
| `Date.now()` | Returns virtual time |
| `performance.now()` | Returns virtual time (ms) |
| `requestAnimationFrame()` | Queued, flushed per virtual frame |
| `setTimeout()` / `setInterval()` | Fire at virtual time thresholds |
| CSS Animations | `document.getAnimations()` synced to virtual time |
| `<video>` / `<audio>` | Seeked to virtual time, `play()` is no-op |

This means **any animation library** that uses standard browser APIs works automatically — GSAP, anime.js, Three.js, Lottie, D3, p5.js, Framer Motion, you name it. Rendering is deterministic regardless of system speed.

---

## Packages

| Package | Description |
|---------|-------------|
| `@frameforge/core` | Render engine, CLI, time virtualization, FFmpeg pipeline, video editing |
| `@frameforge/sdk` | TypeScript SDK — Scene, elements, animations, codegen |
| `@frameforge/studio` | Visual preview UI with timeline and hot-reload |
| `frameforge` (PyPI) | Python SDK — same API, generates HTML, calls Node renderer |

---

## Requirements

- **Node.js 20+**
- **FFmpeg** in PATH ([install](https://ffmpeg.org/download.html))
- Chrome/Chromium (auto-downloaded by Puppeteer)
- **WhisperX** (optional — for word-level caption extraction)

---

## Examples

| Example | Use Case | Tech |
|---------|----------|------|
| [hello-world](examples/hello-world/) | Basic render | Vanilla JS |
| [css-animations](examples/css-animations/) | CSS @keyframes | CSS |
| [gsap](examples/gsap/) | GSAP timeline | GSAP 3.12 CDN |
| [sdk-ts](examples/sdk-ts/) | TypeScript SDK | SDK |
| [animation-primitives](examples/animation-primitives/) | SDK presets + stagger | SDK |
| [multi-scene](examples/multi-scene/) | Composition + transitions | 3 scenes |
| [brand-video](examples/brand-video/) | Full composition | 13.4s |
| [video-edit/overlay-kinetic-white-v4-clip01.json](examples/video-edit/) | 24-overlay AI edit | Edit Agent |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   AUTHORING LAYER                    │
│  HTML  │  TS SDK  │  Python SDK  │  AI Agent JSON   │
└────────────────────────┬────────────────────────────┘
                         │ Scene Manifest / Overlay Decisions
┌────────────────────────▼────────────────────────────┐
│                  CORE RENDERER                       │
│  Time Virtualization → Puppeteer → FFmpeg Pipeline  │
│  (All time APIs patched — deterministic per frame)  │
└────────────────────────┬────────────────────────────┘
                         │ MP4
┌────────────────────────▼────────────────────────────┐
│               OUTPUT VIDEO                          │
└─────────────────────────────────────────────────────┘
```

---

## Contributing

```bash
git clone https://github.com/Trejon-888/frameforge.git
cd frameforge
pnpm install
pnpm build
pnpm test     # 238 tests
```

---

## License

[MIT](LICENSE) — Free and open source.

---

<p align="center">
  <strong><span style="color: #e94560;">F</span><span style="color: #6366f1;">F</span></strong><br>
  <em>Code your video. Frame by frame.</em>
</p>
