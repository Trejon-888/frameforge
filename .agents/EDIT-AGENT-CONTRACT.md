# FrameForge Edit Agent Contract
**Version:** 1.0
**Purpose:** Plain-text specification for AI agents that want to produce video overlays. Any model — Claude, GPT, Gemini, Codex, local — reads this document and produces overlays that FrameForge renders.

---

## The Workflow

```
frameforge extract-transcript video.mp4 -o transcript.json
   ↓
Agent reads transcript.json + this document
   ↓
Agent writes overlay-decisions.json
   ↓
frameforge render-overlays video.mp4 --overlays overlay-decisions.json --srt captions.srt -o output.mp4
```

FrameForge does not call any AI. The agent is external and model-agnostic.

---

## What the Agent Receives

### transcript.json (AgentTranscript format)

```json
{
  "durationSec": 62.4,
  "width": 1080,
  "height": 1920,
  "orientation": "portrait",
  "phrases": [
    {
      "startSec": 0.2,
      "endSec": 3.1,
      "startMs": 200,
      "endMs": 3100,
      "text": "So you can create your own social media AI agent"
    }
  ],
  "words": [
    { "word": "So", "startMs": 200, "endMs": 340, "confidence": 0.97 }
  ]
}
```

Use `startMs` / `endMs` directly as the `startMs` in your overlay decisions.

---

## What the Agent Produces

### overlay-decisions.json

A JSON array of overlay objects. Each object:

```json
[
  {
    "startMs": 400,
    "durationMs": 5000,
    "type": "hook",
    "rationale": "The word 'automate' at 0:04 is the thesis — punch it hard",
    "css": ".cls-__ID__-main { position: absolute; ... }",
    "html": "<div class=\"cls-__ID__-main\">...</div>",
    "initJs": "el._tl = gsap.timeline({paused:true}); el._tl.fromTo(...);"
  }
]
```

### Field reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `startMs` | number | ✓ | When to show (ms from video start). Use `startMs` from transcript.json |
| `durationMs` | number | ✓ | How long to show. Range: 3000–10000ms |
| `type` | string | ✓ | Editorial label. Free-form. Examples: "hook", "stat", "cta", "lower-third" |
| `rationale` | string | ✓ | Why you chose this moment. Used for logging/debugging only |
| `css` | string | ✓ | CSS for this overlay. Use `.cls-__ID__-*` class names |
| `html` | string | ✓ | Inner HTML. The root el is already a full-canvas fixed div |
| `initJs` | string | ✓ | GSAP init code. **Must set `el._tl`** |

---

## Technical Contract

### Canvas

The overlay sits on a **transparent canvas** on top of the video. Dimensions from `transcript.json` (`width` × `height`).

The root element (`el`) for each overlay is already:
```css
position: fixed;
top: 0;
left: 0;
width: {canvas-width}px;
height: {canvas-height}px;
pointer-events: none;
z-index: 90;
overflow: hidden;
background: transparent;
```

You cannot change these. Add children inside it.

### The __ID__ Placeholder

Use `__ID__` everywhere as a namespace for your class names and sub-element IDs. It gets replaced with a unique instance ID at render time (e.g., `ff-ag-0`, `ff-ag-1`).

```css
/* ✓ correct */
.cls-__ID__-title { font-size: 120px; }
.cls-__ID__-bar { height: 4px; }

/* ✗ wrong — not namespaced */
.my-title { font-size: 120px; }
```

```html
<!-- ✓ correct -->
<div class="cls-__ID__-title">AUTOMATE</div>

<!-- ✓ correct — if you need sub-IDs -->
<div class="cls-__ID__-title" id="__ID__-title">AUTOMATE</div>
```

```javascript
// ✓ correct querySelector
el.querySelector('.cls-__ID__-title')

// ✗ wrong — getElementById won't work without ID replacement
document.getElementById('my-title')
```

### Animation Timeline (REQUIRED)

Every `initJs` **must** set `el._tl`. The system calls `el._tl.time(localT / 1000)` every frame (where `localT` is milliseconds since `startMs`).

```javascript
// Required pattern:
el._tl = gsap.timeline({ paused: true });

// Entry animation
el._tl.fromTo(
  el.querySelector('.cls-__ID__-main'),
  { opacity: 0, y: 30 },
  { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
);

// ... content animations at various timeline positions ...

// Exit animation — schedule at (durationMs/1000 - 0.4) seconds
el._tl.to(
  el.querySelector('.cls-__ID__-main'),
  { opacity: 0, duration: 0.35, ease: 'power2.in' },
  5 - 0.4  // if durationMs is 5000
);
```

### Available Tools

| Tool | Available | Notes |
|------|-----------|-------|
| `gsap` | ✓ global | GSAP 3.x. Use `gsap.timeline()`, `gsap.fromTo()`, `gsap.set()`, etc. |
| `el` | ✓ scoped | The root container for this overlay instance |
| Google Fonts | ✓ | Space Grotesk, Inter, Space Mono |
| CSS Variables | ✓ | `var(--ff-bg)`, `var(--ff-text)`, `var(--ff-surface)` |
| DOM | ✓ limited | `el.querySelector()`, `el.querySelectorAll()` |

### Prohibited

```javascript
// ✗ No external resources
fetch('https://...')
new Image().src = '...'

// ✗ No timers
setTimeout(() => {})
setInterval(() => {})

// ✗ No document/body manipulation
document.body.style.background = '...'
document.head.appendChild(...)

// ✗ No unscoped DOM
document.getElementById('my-id')  // won't find it across instances
```

---

## Editorial Philosophy

You are a creative director, not a template-filler. Read the transcript. Feel the rhythm. Make real choices.

### Rules

1. **Enhance, don't explain.** Never create text that restates what the speaker is saying. If they say "we automate your pipeline", your overlay is NOT "Automation". Your overlay might be a progress bar sweeping or a giant number.

2. **The hook is everything.** First 5 seconds decide if someone keeps watching. Your first overlay must appear before 8 seconds.

3. **Breathing room.** Minimum 6 seconds between overlay start times. 5–9 total overlays for a 60s video. More is worse.

4. **Numbers land hard.** Extract exact numbers from the transcript. "$47K" hits harder than "a lot". Make numbers visual.

5. **Exit with intention.** Always animate out. The timeline approach makes this automatic — just schedule the exit in `el._tl`.

6. **Position for the format.** Portrait (9:16): full-width elements, large text (80px+), center/lower frame. Landscape (16:9): use horizontal space, lower-third anchoring.

### Technique Palette

Choose the right technique for each moment:

#### kinetic-word-slam
Full-frame giant word. Impact. No context needed.
```
AUTOMATE  →  scale bounce in  →  hold  →  scale out
```
Best for: single impactful words, thesis moments

#### number-reveal
Giant number counts up. Spring physics. Label below.
```
$47K  →  counts 0 → 47K  →  "MRR" fades in below
```
Best for: stats, social proof numbers, results

#### lower-third-identity
Speaker name/title slides up from bottom edge.
```
[Creator]  [AI Agency Builder]  →  slides in  →  dissolves
```
Best for: video start, first 5 seconds, identity establishment

#### social-proof-band
Center-frame, bold, minimal. Reads in 2 seconds.
```
"50+ agencies automated"
```
Best for: credibility moments, results claims

#### cta-card
Action card with directional element. Appears late in video.
```
[Follow for more →]  or  [Book a call ↗]
```
Best for: final 20% of video. Use only once.

#### ambient-watermark
Large faint text (8–12% opacity) as background texture.
```
AUTOMATE  AUTOMATE  AUTOMATE  (fills frame, barely visible)
```
Best for: sustained theme reinforcement. Doesn't compete with speaker.

#### split-flash
Momentary full-frame color fill with single word. 0.3–0.5s.
```
Frame → fills with #7c6cfc → "SCALE" in white → clears
```
Best for: dramatic transition beats. Use max twice per video.

#### progress-strip
Thin 4px bar sweeps across bottom. 1s duration.
Best for: chapter transitions, structural beats in educational content.

#### quote-pull
Speaker's key sentence, large and beautiful. No restating.
```
"If a browser can render it,
 FrameForge can record it."
```
Best for: moments where the phrasing itself is quotable.

---

## Complete Example

Transcript excerpt:
```
[0:02–0:05] So you can create your own AI agent that posts for you.
[0:08–0:12] We built this for 50+ agencies and they're getting results.
[0:15–0:18] The whole thing runs itself. You set it once.
[0:52–0:58] Follow for more on how I'm building this.
```

Good overlay decisions:
```json
[
  {
    "startMs": 500,
    "durationMs": 5000,
    "type": "lower-third",
    "rationale": "Establish speaker identity in first 3 seconds",
    "css": ".cls-__ID__-bar { position: absolute; bottom: 200px; left: 0; right: 0; padding: 0 60px; display: flex; align-items: center; gap: 16px; } .cls-__ID__-name { font-family: 'Space Grotesk', sans-serif; font-size: 42px; font-weight: 900; color: #fff; letter-spacing: -0.02em; } .cls-__ID__-title { font-family: 'Inter', sans-serif; font-size: 26px; font-weight: 500; color: rgba(255,255,255,0.6); } .cls-__ID__-accent { width: 4px; height: 48px; background: #7c6cfc; border-radius: 2px; }",
    "html": "<div class=\"cls-__ID__-bar\"><div class=\"cls-__ID__-accent\"></div><div><div class=\"cls-__ID__-name\">Creator</div><div class=\"cls-__ID__-title\">AI Agency Builder</div></div></div>",
    "initJs": "el._tl = gsap.timeline({paused:true}); var bar = el.querySelector('.cls-__ID__-bar'); gsap.set(bar, {y: 60, opacity: 0}); el._tl.to(bar, {y: 0, opacity: 1, duration: 0.45, ease: 'power2.out'}); el._tl.to(bar, {opacity: 0, y: -20, duration: 0.35, ease: 'power2.in'}, 4.3);"
  },
  {
    "startMs": 8200,
    "durationMs": 6000,
    "type": "stat",
    "rationale": "50+ agencies is a concrete credibility number — make it the hero",
    "css": ".cls-__ID__-wrap { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; } .cls-__ID__-num { font-family: 'Space Grotesk', sans-serif; font-size: 180px; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -0.04em; } .cls-__ID__-label { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 600; color: rgba(255,255,255,0.55); margin-top: 8px; text-transform: uppercase; letter-spacing: 0.15em; }",
    "html": "<div class=\"cls-__ID__-wrap\"><div class=\"cls-__ID__-num\" id=\"__ID__-counter\">0</div><div class=\"cls-__ID__-label\">Agencies Automated</div></div>",
    "initJs": "el._tl = gsap.timeline({paused:true}); var wrap = el.querySelector('.cls-__ID__-wrap'); var counter = el.querySelector('#__ID__-counter'); gsap.set(wrap, {opacity:0, scale:0.7}); el._tl.to(wrap, {opacity:1, scale:1, duration:0.5, ease:'back.out(1.7)'}); el._tl.to(counter, { innerHTML: 50, duration: 1.2, ease: 'power2.out', snap: { innerHTML: 1 }, onUpdate: function() { counter.textContent = Math.round(parseFloat(counter.innerHTML)) + '+'; } }, 0.3); el._tl.to(wrap, {opacity:0, scale:0.9, duration:0.4, ease:'power2.in'}, 5.3);"
  },
  {
    "startMs": 52000,
    "durationMs": 6000,
    "type": "cta",
    "rationale": "Final CTA — video is ending, convert the viewer",
    "css": ".cls-__ID__-card { position: absolute; bottom: 220px; left: 50%; transform: translateX(-50%); background: rgba(124,108,252,0.15); border: 1.5px solid rgba(124,108,252,0.5); border-radius: 16px; padding: 24px 48px; display: flex; align-items: center; gap: 20px; white-space: nowrap; } .cls-__ID__-text { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 800; color: #fff; letter-spacing: -0.02em; } .cls-__ID__-arrow { font-size: 36px; color: #7c6cfc; }",
    "html": "<div class=\"cls-__ID__-card\"><span class=\"cls-__ID__-text\">Follow for more</span><span class=\"cls-__ID__-arrow\">→</span></div>",
    "initJs": "el._tl = gsap.timeline({paused:true}); var card = el.querySelector('.cls-__ID__-card'); gsap.set(card, {opacity:0, y:30}); el._tl.to(card, {opacity:1, y:0, duration:0.5, ease:'power2.out'}); el._tl.to(card, {opacity:0, y:-20, duration:0.4, ease:'power2.in'}, 5.3);"
  }
]
```

---

## Validation

FrameForge validates your JSON before rendering:
- Missing required fields → overlay is skipped (warning logged)
- `startMs` ≥ video duration → overlay is skipped
- `durationMs` outside 1000–30000 → clamped automatically
- Invalid JSON → error thrown with first 500 chars shown

---

## Orientation Quick Reference

### Portrait (9:16) — `"orientation": "portrait"`
- Canvas: 1080×1920 (or 1440×2560)
- Large text: 80–200px minimum
- Full-width elements work well (90%+ canvas width)
- `bottom: 150–300px` for lower elements (caption zone is bottom 200px)
- Center-frame statistics dominate beautifully

### Landscape (16:9) — `"orientation": "landscape"`
- Canvas: 1920×1080
- Lower-thirds: `bottom: 80–180px, left: 60px`
- Stats: center or left-anchored
- Text: 48–100px for main elements
- Reserve right 30% if speaker is visible on left

---

*This document is the contract. Code is derived from it.*
*GSAP, HTML, CSS — if a browser can render it, FrameForge can record it.*
