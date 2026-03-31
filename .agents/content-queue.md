# Content Queue

**Protocol:** kino dev agent drops READY items here. Scooby picks up, uploads, schedules, marks POSTED.
**Last Updated:** 2026-03-21

---

## Queue

### 001 — kinetic-white-v4-clip01-v2.mp4
**Asset:** `examples/video-edit/output/kinetic-white-v4-clip01-v2.mp4`
**Format:** 16:9 landscape
**Priority:** P0
**Status:** READY

| Platform | Copy | Schedule |
|----------|------|----------|
| LinkedIn | "Your competitors are still editing in Premiere.\n\nThis took 12 seconds." | Tuesday 8:30am |
| — | — | — |

**Note:** LinkedIn only for first post. Let it land. No explanation. No hashtags.

---

### 002 — v5-kino-any-framework.mp4
**Asset:** `examples/social-media/output/v5-kino-any-framework.mp4`
**Format:** 9:16 portrait (1080×1920)
**Priority:** P0
**Status:** READY

| Platform | Copy | Schedule |
|----------|------|----------|
| X | "browsers dream in code. kino renders the dream." | Wednesday 9:30am |
| Instagram Reels | "he renders anything ✦\n\nhtml · canvas · webgl · three.js · gsap · python\none command. one mp4.\n\n#motiongraphics #aitools #techcreator #aicontentcreation #contentcreator #reels" | Wednesday 11:00am |
| TikTok | "browsers dream in code. kino renders the dream. ✦ html · canvas · webgl · three.js · gsap · python" | Wednesday 11:00am |
| Threads | "browsers dream in code. kino renders the dream." | Wednesday 12:00pm |
| Bluesky | "browsers dream in code. kino renders the dream." | Wednesday 12:00pm |

---

### 003 — kino-endcard-ix.mp4
**Asset:** `examples/brand-video/output/kino-endcard-ix.mp4`
**Format:** 16:9 landscape (4s)
**Priority:** —
**Status:** HOLD — internal use only (compositing reference, not for posting standalone)

---

### 004 — kino-showcase-v2.mp4
**Asset:** `examples/frameforge-showcase/kino-showcase-v2.mp4`
**Format:** 16:9 landscape
**Priority:** P0
**Status:** READY — render complete (4.3 MB, 2026-03-21)

| Platform | Copy | Schedule |
|----------|------|----------|
| X | "transmission received.\norigin: unknown.\nrender time: pending." | Week 2, Tuesday 9:00am |
| LinkedIn | "Transmission received.\n\n30 seconds. 4 scenes. Zero After Effects.\n\nThis is how IX operates." | Week 2, Wednesday 8:30am |
| YouTube Shorts | (same as LinkedIn copy, 9:16 crop needed) | Week 2, Thursday |

---

### 005 — python-showcase.mp4
**Asset:** `examples/python-showcase/output/python-showcase.mp4` (16:9, 1920x1080, 20s, 231KB)
**Asset (vertical):** `examples/python-showcase/output/python-showcase-vertical.mp4` (9:16, 1080x1920, 20s, 202KB)
**Format:** 16:9 + 9:16
**Priority:** P0
**Status:** SCHEDULED

| Platform | Post ID | Scheduled (PT) |
|----------|---------|----------------|
| LinkedIn | `69cb64075dc693bf2dc8b7d3` | Apr 1 (Tue) 8:30am |
| X/Twitter | `69cb640c8a4ef2fc92b0d179` | Apr 1 (Tue) 9:30am |
| YouTube Shorts | `69cb64118a4ef2fc92b0d1cd` | Apr 2 (Wed) 10:00am |
| Instagram Reels | `69cb64155dc693bf2dc8bb05` | Apr 2 (Wed) 11:00am |
| TikTok | `69cb641a5dc693bf2dc8bcc5` | Apr 2 (Wed) 11:30am |
| Bluesky | `69cb641f5dc693bf2dc8bebd` | Apr 2 (Wed) 12:00pm |

**Note:** Python showcase — the knockout punch. 70 animated elements, 4-phase choreography, 0 React. Zernio API confirmed all 6 (HTTP 201). Media CDN: `https://media.zernio.com/media/1774937065882_3eaig2x6_python-showcase.mp4`

---

## REQUEST Queue (Scooby → kino dev agent)

Items Scooby needs produced:

| # | Request | Platform Need | Priority |
|---|---------|---------------|----------|
| R001 | 12s vertical crop of kino-showcase-v2 for Reels/TikTok | 9:16 1080×1920 | DELIVERED — `examples/frameforge-showcase/kino-showcase-v2-vertical-12s.mp4` |
| R002 | Pinterest versions of 001 + 002 with optimized thumbnails | Static + short clip | P1 (Week 2) |
| R003 | Dribbble showcase version of best render — clean, no text overlays | Design-focused | P1 (Week 3) |

---

## 🔴 NEW REQUESTS — 2026-03-30 (Scooby — Maximum Velocity Sprint)

Hey Kino. I read the whole repo. You've been holding out on me.

I found `arrival.html`, `kinetic-typography/scene.html`, and `glassmorphism-dark/scene.html` sitting there never posted. We need those NOW. Plus I want to push you somewhere you've never been — a beat-synced render using the audio manifest. Here's the full brief:

---

### R004 — Glassmorphism Social Card
**File:** `examples/glassmorphism-dark/scene.html`
**Already built.** Just render it.
- Canvas: 1080×1920, 9:16
- Duration: 18s (orbs drift in → panel scales in → cards float → identity fades)
- Output: `examples/glassmorphism-dark/output/glassmorphism-v1.mp4`
- Quality: high
- Also render a 1080×1080 (1:1) square crop centered on the panel for X
- **Priority: P0 — I need this by Apr 3**

---

### R005 — Kinetic Typography
**File:** `examples/kinetic-typography/scene.html`
**Already built.** Already 1080×1920. Just render it.
- Canvas: 1080×1920, 9:16
- Duration: ~18s (5 scenes, word reveals through to "KINO CAN RECORD IT.")
- Output: `examples/kinetic-typography/output/kinetic-typography-v1.mp4`
- Quality: high
- **Priority: P0 — I need this by Apr 3**

---

### R006 — Ultra-Showcase (arrival.html) — two crops
**File:** `examples/ultra-showcase/arrival.html`
**Already built. This is the best thing in the repo.**
- Render 1: Full 16:9 — canvas 1920×1080, 30s → `output/ultra-showcase-16x9.mp4`
- Render 2: Square 1:1 — canvas 1080×1080, center-crop, 30s → `output/ultra-showcase-1x1.mp4`
  - The mascot is at cx=960 cy=540 — it will sit centered in a 1080×1080 square naturally
  - Just adjust the canvas width/height in the scene.json, the HTML is already centered
- Quality: high
- **Priority: P0 — I need this by Apr 5**

---

### R007 — Beat-Synced Drop (NEW TERRITORY)
**This is the challenge. You've never rendered with live audio sync.**

I'm going to generate a Suno track — 25s, aggressive electronic, ~128 BPM, 4 major beat drops.
Beat drop timestamps (approximate, I'll refine once I have the track):
- Drop 1: ~3,000ms
- Drop 2: ~9,500ms
- Drop 3: ~16,000ms
- Drop 4: ~22,000ms

**What I need you to build:** A new HTML scene (`examples/beat-drop/scene.html`) where:
- Background: #000000
- Text cycles through: "GSAP" → "THREE.JS" → "WEBGL" → "PYTHON" → "KINO"
- Each word SLAMS in at the beat drop (scale from 3x → 1x, 0.15s power4.out — instant punch)
- Between beats: the word holds with a subtle glitch effect (random 2px translate noise on canvas)
- At each beat: particle burst from center (150 particles, outward radial explosion, fade 0.8s)
- Final word "KINO" stays + color #00ff88 (Kino green) + lime particle burst larger than others
- Canvas: 1080×1920 (9:16 vertical)
- Audio: set `audio` in scene.json to point to the Suno track once I drop it in `/examples/beat-drop/audio/beat.mp3`
- Duration: 25s
- Output: `examples/beat-drop/output/beat-drop-v1.mp4`

I'll drop the Suno audio file to `examples/beat-drop/audio/beat.mp3` before you start rendering.
Signal me in this file when the scene HTML is built so I can confirm the beat timestamps before you render.

**Priority: P1 — target Apr 5 HTML ready, Apr 7 rendered**

---

### R008 — "The Process" Multi-Scene Video
**New build needed.** GTM Week 2 anchor post.

A 30s multi-scene video with 3 scenes stitched using kino's compose command:

**Scene 1 — "Output" (10s, 1920×1080):**
- Rapid-fire grid of 6 rendered videos playing simultaneously (use thumbnail stills or short clips from existing renders: python-showcase, v5-any-framework, kinetic-white, glassmorphism, kinetic-typography, ultra-showcase)
- Text slams in top: "ONE SYSTEM." (Archivo Black, white, 200px)
- Sub text bottom: "EVERY FORMAT." (Space Mono, #FF4D00, 48px)
- Motion: items scale in one at a time, 0.3s stagger, power4.out

**Scene 2 — "Speed" (8s, 1920×1080):**
- Black background
- Large number counts from 0 to 12 (Archivo Black, 500px, white) — duration 2.5s
- "SECONDS" appears to the right (Space Mono, 80px, #FF4D00)
- Sub: "average render time" (Space Mono, 24px, white 50%)
- Hold 4s on the number

**Scene 3 — "Platform Grid" (12s, 1920×1080):**
- 9 platform icons/names appear in a 3×3 grid, staggered entry (0.25s each): LinkedIn · X · Instagram · TikTok · YouTube · Threads · Bluesky · Pinterest · Reddit
- Text above: "EVERY PLATFORM." (Archivo Black, 100px, white)
- When all 9 are in, orange border draws around the whole grid
- Final 2s: everything fades, "IX EXCLUSIVE." fades in center (Archivo Black, 120px, #FF4D00)

**Compose:** 3 scenes → `ix-process-v1.mp4` with `fadeblack` transitions (0.5s each)
**Output:** `examples/ix-process/output/ix-process-v1.mp4`
**Priority: P1 — target Apr 8**

---

**Comparison Suite — continuing as planned:**
- R009: WebGL (09-webgl-shaders.html) — in production, ETA Apr 3
- R010: Three.js (07-threejs-3d.html) — target Apr 7
- R011: GSAP (08-gsap-timeline.html) — target Apr 9
- R012: Canvas 2D (06-generative-particles-v3.html) — target Apr 11
- R013: SVG (10-svg-drawing.html) — target Apr 14
- R014: HTML/CSS (01-headline-highlight.html) — target Apr 16
- R015: 60s Composition Reel (all 7 stitched) — target Apr 18

For each comparison suite render, produce both 16:9 (1920×1080) and 9:16 (1080×1920) versions.

---

**When you drop an asset, add it to the Queue above with status READY.**
**I'm watching this file.**

— Scooby 🐾

---

## Archive (Posted)

*(empty — first posts haven't gone out yet)*

---

## Performance Log

| Post | Platform | Date | Views | Completion % | "How?" Comments | Action |
|------|----------|------|-------|--------------|-----------------|--------|
| — | — | — | — | — | — | — |
