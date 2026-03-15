# FrameForge — AI Video Generation Skill

**Use this skill when the user asks you to create, generate, or render a video, animation, or motion graphic.**

---

## What is FrameForge?

FrameForge renders any animated HTML page into a deterministic MP4 video using headless Chrome + FFmpeg. It patches all browser time APIs so animations are frame-perfect regardless of system performance.

**Tagline:** "If a browser can render it, FrameForge can record it."

---

## Quick Start (3 approaches)

### Approach 1: Raw HTML (most flexible)

Create an HTML file with animations, then render:

```html
<!-- animation.html -->
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1920px; height: 1080px; overflow: hidden; background: #0a0a0a; }
  .title {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    font: 800 72px system-ui; color: white; opacity: 0;
  }
</style>
</head>
<body>
  <h1 class="title">Hello World</h1>
  <script>
    // Use performance.now() — it's virtualized by FrameForge
    function update() {
      const t = performance.now() / 1000; // seconds
      const title = document.querySelector('.title');
      if (t > 0.5 && t < 2) {
        title.style.opacity = Math.min(1, (t - 0.5) / 0.8);
      }
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  </script>
</body>
</html>
```

```bash
npx frameforge render animation.html --duration 5 --fps 30 -o output.mp4
```

### Approach 2: Scene Manifest (configurable)

```json
{
  "version": "1.0",
  "canvas": { "width": 1920, "height": 1080, "fps": 30, "duration": 5, "background": "#0a0a0a" },
  "entry": "./animation.html",
  "render": { "codec": "h264", "quality": "high", "pixelFormat": "yuv420p", "output": "./output.mp4" }
}
```

```bash
npx frameforge render scene.json
```

### Approach 3: TypeScript SDK (programmatic)

```typescript
import { Scene, Text, Shape, fadeIn, slideIn, stagger } from "@frameforge/sdk";

const scene = new Scene({ width: 1920, height: 1080, fps: 30, duration: 5, background: "#0a0a0a" });

const title = new Text("Hello World", { fontSize: 72, fontWeight: "bold", color: "#ffffff", y: 400, opacity: 0 });
title.animate("opacity", { 0: 0, 0.5: 0, 1.5: 1 });
title.animate("y", { 0: 460, 0.5: 460, 1.5: 400 });

const bar = new Shape("rect", { width: 0, height: 4, fill: "#818cf8", y: 460 });
bar.animate("width", { 0: 0, 1: 0, 2: 500 });

scene.add(title, bar);
await scene.render("./output.mp4");
```

---

## When to Use Each Approach

| Approach | Best For |
|----------|----------|
| **Raw HTML** | Complex animations, 3rd-party libraries (GSAP, Three.js, p5.js), full creative control |
| **Manifest** | Configuring existing HTML pages, changing resolution/fps/duration without code changes |
| **SDK** | Programmatic content, data-driven videos, consistent branding, rapid prototyping |

---

## Animation Patterns That Work Well

### Title Card
```typescript
const title = new Text("Title", { fontSize: 72, fontWeight: "bold", color: "#fff", y: 400, opacity: 0 });
title.animate("opacity", { 0: 0, 0.5: 0, 1.5: 1 });
title.animate("y", { 0: 460, 0.5: 460, 1.5: 400 });
```

### Staggered List
```typescript
const items = ["Feature 1", "Feature 2", "Feature 3"].map((text, i) =>
  new Text(text, { fontSize: 36, color: "#fff", x: 400, y: 400 + i * 60, opacity: 0, textAlign: "left" })
);
stagger(items, fadeIn, 1.0, 0.5, 0.2);
stagger(items, (s, e) => slideIn("left", s, e, 40), 1.0, 0.5, 0.2);
```

### Data Visualization Bar
```typescript
const bar = new Shape("rect", { width: 0, height: 40, fill: "#6366f1", x: 200, y: 500 });
bar.animate("width", { 0: 0, 1: 0, 2.5: 600 }); // grows from 0 to 600px
```

### Background with CSS Gradient
```html
<style>
  body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
</style>
```

---

## Available Animation Primitives (SDK)

```typescript
import { fadeIn, fadeOut, slideIn, slideOut, scaleIn, scaleOut, rotateIn, rotateTo, stagger } from "@frameforge/sdk";

// Each returns an AnimationPreset { property, keyframes }
fadeIn(startSec, endSec)
fadeOut(startSec, endSec)
slideIn("up" | "down" | "left" | "right", start, end, distance?)
slideOut("up" | "down" | "left" | "right", start, end, distance?)
scaleIn(start, end)
scaleOut(start, end)
rotateIn(start, end, degrees?)
rotateTo(start, end, degrees?)

// Apply presets to element
const preset = fadeIn(0, 1);
element.animate(preset.property, preset.keyframes);

// Stagger across multiple elements
stagger(elements, fadeIn, baseStart, duration, offset);
```

---

## Available Elements (SDK)

```typescript
new Text("content", { fontSize, fontFamily, fontWeight, color, x, y, opacity, textAlign })
new Shape("rect" | "circle" | "ellipse", { width, height, fill, stroke, strokeWidth, borderRadius, x, y, opacity })
new Image("path.jpg", { width, height, x, y, opacity, objectFit, borderRadius })
```

---

## CLI Commands

```bash
# Render video
npx frameforge render <input> [options]
  -o, --output <path>      Output file path
  -d, --duration <seconds>  Duration (required for HTML)
  --fps <number>            Frames per second (default: 30)
  --width <pixels>          Width (default: 1920)
  --height <pixels>         Height (default: 1080)

# Preview single frame
npx frameforge preview <input> [options]
  -o, --output <path>       Output PNG path (default: ./preview.png)
  -f, --frame <number>      Frame number (default: 0)
```

---

## How Time Virtualization Works

FrameForge injects a script that patches all browser time APIs before page scripts load:

- `Date.now()` → returns virtual time
- `performance.now()` → returns virtual time (ms)
- `requestAnimationFrame()` → queued, flushed per virtual frame
- `setTimeout()` / `setInterval()` → fire at virtual time thresholds
- CSS Animations → `document.getAnimations()` synced to virtual time
- `<video>` / `<audio>` → seeked to virtual time, play() is no-op

**This means:** Any animation framework that uses standard browser APIs (GSAP, anime.js, Three.js, Lottie, p5.js, D3, etc.) works automatically. No integration code needed.

---

## Common Pitfalls

| Issue | Fix |
|-------|-----|
| Canvas dimensions not even | H.264 requires even width/height. FrameForge auto-fixes with scale filter. |
| Page uses `fetch()` for data | Works fine — network requests complete normally. Use `networkidle0` (default). |
| Duration not specified for HTML | Add `--duration <seconds>` flag when rendering raw HTML files. |
| FFmpeg not installed | Install from https://ffmpeg.org/download.html and ensure it's in PATH. |
| Animations look jerky | Ensure you're using `requestAnimationFrame` or `performance.now()`, not `Date.now()` for animation timing. |
| GSAP animations don't play | GSAP should work automatically. Make sure GSAP loads before your animation code (CDN script tag before your `<script>`). |

---

## Canvas Presets

| Use Case | Width | Height | FPS | Notes |
|----------|-------|--------|-----|-------|
| YouTube / Standard | 1920 | 1080 | 30 | Default |
| YouTube Shorts / TikTok | 1080 | 1920 | 30 | Portrait |
| Instagram Reels | 1080 | 1920 | 30 | Portrait |
| Twitter/X | 1280 | 720 | 30 | Lower res for faster upload |
| 4K | 3840 | 2160 | 30 | High quality, slower render |
| Presentation | 1920 | 1080 | 24 | Cinema-like feel |

---

## Requirements

- Node.js 20+
- FFmpeg in PATH
- Chrome/Chromium (auto-downloaded by Puppeteer)
