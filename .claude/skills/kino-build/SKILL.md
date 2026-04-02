---
name: kino-build
description: "Build and render a kino video from a production spec. Generates SceneComposition v2.0 JSON, handles rendering, and composites final output. Use after /kino-spec when ready to code and render."
argument-hint: "[path to spec.md]"
---

# /kino-build — Scene Builder & Renderer

**Input:** Production spec from `/kino-spec`
**Output:** Rendered MP4 video

---

## What This Skill Does

Translates a production spec into kino's SceneComposition v2.0 JSON format, then renders it. This is pure execution — all creative decisions were made in the spec. The build phase is about precision, performance, and quality.

---

## Tech Stack

| Layer | Technology | When to Use |
|-------|-----------|-------------|
| Scene Format | SceneComposition v2.0 JSON | Always — this is the universal format |
| Text/Captions | ASS subtitles via FFmpeg libass | All caption and text overlay rendering |
| Motion Graphics | Canvas 2D via Puppeteer | Geometric scenes, complex visuals, any animation |
| Audio | FFmpeg filter_complex (adelay, amix) | Sound cue mixing |
| Video Composite | FFmpeg colorkey or overlay filter | Combining overlay + source video |
| Rendering | `kino render-scene` CLI | Full-frame scenes from v2.0 JSON |
| Editing | `kino edit --native` CLI | Caption-only edits (fastest path) |

---

## Build Process

### Step 1: Read the Spec

Parse the production spec. Extract:
- Canvas dimensions, fps, duration
- Scene breakdown (IDs, times, modes)
- Beat map (every element with timing)
- Persistent elements
- Sound cues
- Caption style

### Step 2: Generate SceneComposition JSON

Build a `v2.0` SceneComposition from the spec:

```json
{
  "version": "2.0",
  "canvas": { "width": 1080, "height": 1920, "fps": 30, "duration": 58 },
  "scenes": [...],
  "captions": { "style": "editorial-studio", "position": "bottom" },
  "style": "editorial-studio"
}
```

#### Element Type Reference

| Type | Required Props | Animatable Properties | Use For |
|------|---------------|----------------------|---------|
| `text` | `content`, `fontSize`, `fontFamily`, `color` | `x`, `y`, `opacity`, `scale`, `rotation`, `fontSize`, `strokeWidth` | Headlines, labels, captions |
| `circle` | `fill` or `stroke` | `cx`, `cy`, `r`, `opacity`, `lineWidth`, `glow` | Rings, dots, orbs, highlights |
| `rect` | `fill` or `stroke` | `x`, `y`, `width`, `height`, `opacity`, `rotation`, `lineWidth` | Cards, panels, bars, progress |
| `line` | `stroke` | `x1`, `y1`, `x2`, `y2`, `progress`, `opacity`, `lineWidth` | Connections, dividers, draw-on effects |
| `dot` | `color` | `x`, `y`, `r`, `opacity`, `glow` | Particles, constellation points |
| `grid` | `spacing`, `color` | `opacity` | Background grid pattern |
| `group` | — | `x`, `y`, `opacity`, `scale`, `rotation` | Group transform for children |
| `image` | `src`, `width`, `height` | `x`, `y`, `opacity`, `scale`, `rotation` | Photos, icons, screenshots |

#### Keyframe Format

```json
{
  "property": "opacity",
  "keyframes": [
    { "time": 0, "value": 0 },
    { "time": 0.5, "value": 1, "easing": "ease-out" }
  ]
}
```

**Time is in seconds, relative to scene start.**

#### Easing Reference

| Name | Feel | Use For |
|------|------|---------|
| `linear` | Constant speed | Progress bars, continuous motion |
| `ease-out` | Fast start, slow end | Most entrances |
| `ease-in` | Slow start, fast end | Most exits |
| `ease-in-out` | S-curve | Position changes |
| `cubic-bezier(0.16,1,0.3,1)` | Premium ease-out (overshoot) | Hero reveals, editorial feel |
| `back.out` | Overshoot + settle | Playful entrances, bouncy |
| `elastic.out` | Spring bounce | Energetic, attention-grabbing |
| `expo.out` | Very fast deceleration | Dramatic reveals |
| `power2.out` / `power3.out` | Moderate / strong decel | General purpose |
| `step(N)` | N discrete steps | Typewriter, frame-by-frame |

### Step 3: Handle Captions

If the spec includes dialogue/narration with word timings:

**Option A — ASS native (preferred, fastest):**
```bash
kino edit --native --style editorial-studio --word-timings transcript.json -o output.mp4
```

**Option B — If word timings don't exist yet:**
```bash
# Extract transcript first
kino extract-transcript source.mp4 -o transcript.json
# Then edit
kino edit --native --word-timings transcript.json -o output.mp4
```

### Step 4: Handle Sound

Map spec audio sync points to kino's sound library:

**Available sounds:**
| Category | Sounds |
|----------|--------|
| Hits | `kick`, `snap`, `click`, `thud`, `glass` |
| Transitions | `whoosh-in`, `whoosh-out`, `sweep-up`, `sweep-down` |
| Accents | `pop`, `ding`, `chime`, `sparkle` |
| Ambient | `low-hum`, `digital-texture`, `breath` |

Add sound cues to scene JSON:
```json
"sound": [
  { "type": "whoosh-in", "time": 0.3, "volume": 0.7 },
  { "type": "kick", "time": 0.8, "volume": 0.8 }
]
```

### Step 5: Render

**For full-frame motion graphics:**
```bash
kino render-scene composition.json -o scene-output.mp4
```

**For overlay on talking head:**
```bash
# Render overlay with magenta key
kino render scene.json -o overlay.mp4
# Composite via FFmpeg
ffmpeg -y -i source.mp4 -i overlay.mp4 \
  -filter_complex "[1:v]colorkey=color=0xFF00FF:similarity=0.25:blend=0.05[ov];[0:v][ov]overlay=0:0[vout]" \
  -map "[vout]" -map "0:a:0" \
  -c:v libx264 -crf 16 -preset medium -c:a copy output.mp4
```

**For captions only (fastest):**
```bash
kino edit --native --style editorial-studio --word-timings transcript.json -o output.mp4
```

### Step 6: Quality Check

After rendering, verify:
- [ ] Duration matches spec
- [ ] All sections present (scrub through video)
- [ ] Captions sync with audio
- [ ] Sound cues hit on beat
- [ ] No blank frames or glitches
- [ ] File size is reasonable (target: 1-3MB per 10s at 1080p)

---

## Rendering Modes Decision Tree

```
Does the video have a source clip (talking head, screen recording)?
  ├── YES → Does it need motion graphics ON TOP of the video?
  │   ├── YES → Overlay mode: render scene + FFmpeg colorkey composite
  │   └── NO  → kino edit --native (captions only, fastest)
  └── NO → Full-frame mode: kino render-scene (pure motion graphics)

Are there sections that alternate between talking head and full graphics?
  └── YES → Hybrid: render each scene separately, compose with kino compose
```

---

## Common Patterns

### Typewriter Text Reveal
```json
{
  "id": "title",
  "type": "text",
  "props": { "content": "", "fontSize": 80, "color": "#ffffff" },
  "animations": [
    { "property": "opacity", "keyframes": [{"time":0,"value":1}] }
  ]
}
```
For typewriter, create separate text elements for each word with staggered opacity keyframes (0→1 at word's start time).

### Expanding Ring
```json
{
  "type": "circle",
  "props": { "fill": "transparent", "stroke": "#ffffff" },
  "animations": [
    { "property": "cx", "keyframes": [{"time":0,"value":540}] },
    { "property": "cy", "keyframes": [{"time":0,"value":960}] },
    { "property": "r", "keyframes": [{"time":0,"value":0},{"time":1.5,"value":300,"easing":"cubic-bezier(0.16,1,0.3,1)"}] },
    { "property": "opacity", "keyframes": [{"time":0,"value":0.8},{"time":1.5,"value":0}] },
    { "property": "lineWidth", "keyframes": [{"time":0,"value":3},{"time":1.5,"value":1}] }
  ]
}
```

### Staggered Dot Array
Create N dot elements with increasing delay:
```json
[0,1,2,3,4].map(i => ({
  "type": "dot",
  "props": { "color": "#ffffff" },
  "animations": [
    { "property": "x", "keyframes": [{"time":0,"value": 200 + i*160}] },
    { "property": "y", "keyframes": [{"time":0,"value": 500}] },
    { "property": "opacity", "keyframes": [
      {"time": 0 + i*0.1, "value": 0},
      {"time": 0.3 + i*0.1, "value": 1, "easing": "ease-out"}
    ]},
    { "property": "r", "keyframes": [
      {"time": 0 + i*0.1, "value": 0},
      {"time": 0.3 + i*0.1, "value": 6, "easing": "back.out"}
    ]}
  ]
}))
```

### Line Draw-On
Animate `progress` from 0 to 1:
```json
{ "property": "progress", "keyframes": [
  {"time": 0.5, "value": 0},
  {"time": 1.5, "value": 1, "easing": "cubic-bezier(0.16,1,0.3,1)"}
]}
```

---

## Principles

1. **The spec is law.** Don't improvise. If the spec says "circle at 540,960 expanding to r=300 over 1.5s with expo.out" — that's exactly what you build.
2. **Use ASS for all text.** Faster, better quality, no Puppeteer overhead.
3. **Prefer full-frame for impact.** When the spec says "full-frame", use black canvas + white geometry. Don't add unnecessary elements.
4. **Easing is everything.** The difference between amateur and professional is the easing curve. Use the spec's easing exactly.
5. **Test with preview first.** `kino preview scene.json --frame 45` captures a single frame in seconds. Use it to check positioning before full render.
6. **Sound must sync.** If the spec says "hard sync", the sound cue and visual must land on the same frame.
