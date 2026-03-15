<p align="center">
  <b style="font-size: 48px;">
    <span style="color: #e94560;">F</span><span style="color: #6366f1;">F</span>
  </b>
</p>

<h1 align="center">FrameForge</h1>

<p align="center">
  <strong>If a browser can render it, FrameForge can record it.</strong><br>
  <em>Framework-agnostic programmatic video from any web technology.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@frameforge/core"><img src="https://img.shields.io/npm/v/@frameforge/core?style=flat-square&color=e94560&label=npm" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-6366f1?style=flat-square" alt="MIT License"></a>
  <a href="#"><img src="https://img.shields.io/badge/tests-169%20passing-10b981?style=flat-square" alt="Tests"></a>
  <a href="#"><img src="https://img.shields.io/badge/node-%3E%3D20-333?style=flat-square" alt="Node 20+"></a>
</p>

---

## What is FrameForge?

FrameForge takes **any animated HTML page** — vanilla JS, GSAP, Three.js, CSS animations, p5.js, Svelte, whatever — and renders it into a **deterministic MP4 video** via headless Chrome + FFmpeg.

No framework lock-in. No custom DSL. If Chrome can display it, FrameForge can capture it frame-by-frame with perfect timing.

```bash
npm install @frameforge/core
```

---

## Quickstart

### Option 1: Render any HTML page

```bash
npx frameforge render animation.html --duration 10 --fps 30 -o video.mp4
```

### Option 2: Use the TypeScript SDK

```typescript
import { Scene, Text, Shape, fadeIn, stagger } from "@frameforge/sdk";

const scene = new Scene({ duration: 5, background: "#0a0a0a" });

const title = new Text("Hello World", { fontSize: 72, fontWeight: "bold", color: "#fff" });
title.animate("opacity", { 0: 0, 0.5: 0, 1.5: 1 });

scene.add(title);
await scene.render("output.mp4");
```

### Option 3: Use the Python SDK

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
| **AI Agent Integration** | ✅ MCP + Skill | ❌ | ❌ |
| **Multi-scene + Transitions** | ✅ 23 types | ❌ | ✅ |
| **Visual Studio** | ✅ Timeline | ✅ | ✅ |
| **Subtitles (SRT/VTT)** | ✅ | ❌ | ❌ |
| **Zero config** | ✅ | ❌ React setup | ❌ |

---

## Features

### 🎬 Core Renderer
- **Time Virtualization** — Patches `Date.now`, `performance.now`, `requestAnimationFrame`, `setTimeout`, `setInterval`, CSS Animations, and `<video>`/`<audio>` elements
- **Frame-perfect capture** — Every frame rendered deterministically via headless Chrome CDP screenshots
- **FFmpeg pipeline** — Frames piped directly to FFmpeg stdin — no temp files, any codec

### 🧩 SDKs
- **TypeScript SDK** — `Scene`, `Text`, `Shape`, `Image` elements with chainable animations
- **Python SDK** — Same API surface, generates HTML + calls Node renderer
- **Animation Primitives** — `fadeIn`, `fadeOut`, `slideIn`, `slideOut`, `scaleIn`, `rotateIn`, `stagger`

### 🎞️ Composition
- **Multi-scene** — Stitch multiple HTML pages as scenes via `frameforge compose`
- **23 Transitions** — fade, dissolve, wipe, slide, circle, smooth, pixelize, zoom, and more
- **Subtitles** — SRT/VTT parser with customizable HTML overlay

### 🖥️ Studio
- **Visual Timeline** — Scrub to any frame, see it instantly
- **Hot-reload** — Edit your HTML, see changes immediately
- **Keyboard-first** — Space, arrows, Home/End, number keys
- **One-click render** — Preview → Render MP4

### 🤖 AI-Native
- **Agent Skill** — Comprehensive guide for Claude Code / coding agents
- **MCP Server** — Model Context Protocol tools for render + validate
- **Agent-friendly errors** — Parseable error messages with actionable hints

---

## CLI Commands

```bash
# Render a video
frameforge render <input> [options]
  -o, --output <path>       Output file path
  -d, --duration <seconds>  Duration (required for HTML)
  --fps <number>            Frames per second (default: 30)
  --width <pixels>          Width (default: 1920)
  --height <pixels>         Height (default: 1080)

# Preview a single frame
frameforge preview <input> --frame 75 -o preview.png

# Compose multiple scenes with transitions
frameforge compose composition.json -o output.mp4

# Launch visual studio
frameforge-studio scene.json
```

---

## Scene Manifest

```json
{
  "canvas": { "width": 1920, "height": 1080, "fps": 30, "duration": 5 },
  "entry": "./animation.html",
  "render": { "codec": "h264", "quality": "high", "output": "./output.mp4" }
}
```

---

## Composition Manifest

```json
{
  "canvas": { "width": 1920, "height": 1080, "fps": 30 },
  "scenes": [
    { "entry": "./intro.html", "duration": 3, "transition": { "type": "fadeblack", "duration": 0.5 } },
    { "entry": "./main.html", "duration": 5, "transition": { "type": "wipeleft", "duration": 0.8 } },
    { "entry": "./outro.html", "duration": 3 }
  ],
  "render": { "codec": "h264", "quality": "high", "output": "./output.mp4" }
}
```

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

This means **any animation library** that uses standard browser APIs works automatically — GSAP, anime.js, Three.js, Lottie, D3, p5.js, Framer Motion, you name it.

---

## Packages

| Package | Description |
|---------|-------------|
| `@frameforge/core` | Render engine, CLI, time virtualization, FFmpeg pipeline |
| `@frameforge/sdk` | TypeScript SDK — Scene, elements, animations, codegen |
| `@frameforge/studio` | Visual preview UI with timeline and hot-reload |
| `@frameforge/mcp-server` | MCP server for AI tool integration |
| `frameforge` (PyPI) | Python SDK — same API, generates HTML, calls Node renderer |

---

## Requirements

- **Node.js 20+**
- **FFmpeg** in PATH ([install](https://ffmpeg.org/download.html))
- Chrome/Chromium (auto-downloaded by Puppeteer)

---

## Examples

| Example | Tech | Duration |
|---------|------|----------|
| [hello-world](examples/hello-world/) | Vanilla JS | 5s |
| [css-animations](examples/css-animations/) | CSS @keyframes | 6s |
| [gsap](examples/gsap/) | GSAP 3.12 CDN | 5s |
| [sdk-ts](examples/sdk-ts/) | TypeScript SDK | 4s |
| [animation-primitives](examples/animation-primitives/) | SDK presets + stagger | 5s |
| [multi-scene](examples/multi-scene/) | 3 scenes + transitions | 8.7s |
| [brand-video](examples/brand-video/) | Full composition | 13.4s |

---

## Contributing

```bash
git clone https://github.com/Trejon-888/frameforge.git
cd frameforge
pnpm install
pnpm build
pnpm test     # 169 tests
```

---

## License

[MIT](LICENSE) — Free and open source.

---

<p align="center">
  <strong><span style="color: #e94560;">F</span><span style="color: #6366f1;">F</span></strong><br>
  <em>Code your video. Frame by frame.</em>
</p>
