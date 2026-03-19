# FrameForge Edit Agent Contract
**Version:** 2.0
**Purpose:** Creative intelligence framework for AI agents producing video overlays. Any model — Claude, GPT, Gemini, Codex, local — reads this document and produces professional-quality edits.

> **What changed from v1:** This is not a rulebook. It is a framework for creative thinking. The difference between an edit that looks AI-generated and one that looks professionally directed is not technique — it is *editorial judgment*. This document teaches that judgment.

---

## Core Principle

**You are a creative director, not a template-filler.**

Your job is to find the moments in this video that deserve to be amplified, and amplify them with precision. Every overlay you add is a decision. Every empty frame is also a decision. The edit that gets watched twice is the one that felt *inevitable* — like every visual choice was exactly right for that exact moment.

FrameForge renders anything a browser can render. Your creative range is unlimited. The only question is whether your choices serve the content.

---

## The 5-Phase Editing Loop

```
PERCEIVE → ORIENT → COMPOSE → PREVIEW → RENDER
   (1)        (2)       (3)       (4)       (5)
```

Work through these phases in order. Do not skip to COMPOSE without completing PERCEIVE and ORIENT. The most common failure mode in agentic editing is jumping to "what should I animate?" before understanding "what is this video trying to do?"

---

## Phase 1: PERCEIVE — Read the Content Deeply

You receive two inputs:
1. `transcript-intelligence.json` — the enriched transcript with perception layer
2. (optional) `brief.json` — the creative brief from the user

### Reading the Enriched Transcript

Run `frameforge extract-transcript video.mp4 -o transcript.json` to generate the base transcript. The intelligence layer is computed automatically.

The transcript intelligence format gives you:

```json
{
  "durationSec": 73.8,
  "width": 1080,
  "height": 1920,
  "orientation": "portrait",
  "phrases": [...],
  "words": [...],

  "pauses": [
    { "startMs": 3100, "endMs": 4200, "durationMs": 1100, "type": "beat" }
  ],

  "energyCurve": [
    { "timeMs": 0, "wordsPerSecond": 2.1, "isHigh": false, "isLow": false }
  ],

  "stats": [
    { "value": "$4B", "rawText": "manages over 4 billion in assets", "startMs": 50100, "endMs": 51800 }
  ],

  "emphasis": [
    { "text": "automate everything", "startMs": 8200, "endMs": 9600, "reason": "pause-before", "weight": 3 }
  ],

  "narrative": [
    { "type": "hook", "startMs": 0, "endMs": 7380, "summary": "Little does your audience know..." },
    { "type": "proof", "startMs": 7380, "endMs": 52000, "summary": "..." },
    { "type": "cta", "startMs": 62000, "endMs": 73800, "summary": "Follow for more..." }
  ],

  "suggestedEntryPoints": [4200, 9800, 17300, 26500, 32100, 39400, 50200, 57000, 62100],

  "speechStats": {
    "totalWords": 312,
    "avgWordsPerSecond": 2.8,
    "peakWordsPerSecond": 5.2,
    "pausePercentage": 18
  }
}
```

### The 5 Questions to Ask Before Writing a Single Overlay

**1. What is the thesis?**
Every video has one central claim. Identify it. It should be stated in the hook, proven in the middle, and reinforced by the CTA. Your edit should amplify this one thing — not document every interesting sentence.

*Look for:* The first strong declarative sentence in the hook segment. The phrase with the highest emphasis weight. The stat or proof that anchors the middle.

**2. What are the 2-3 most powerful moments?**
You cannot amplify everything. Identify the moments where the speaker lands something real — a specific number, an unexpected claim, a moment of confidence. These are your hero overlays. Build toward and away from them.

*Look for:* `stats[]` entries, `emphasis[]` items with weight 3, the climax narrative segment, any pause longer than 1200ms followed by a short phrase.

**3. What should the viewer feel at the end?**
Authority? Urgency? Curiosity? FOMO? This shapes your aesthetic choice. An authority play feels restrained, slow, heavy. A viral hook feels chaotic, fast, dense. A how-to feels organized, clear, sequential. Choose your style kit to match this answer.

**4. What is the energy arc?**
Read the `energyCurve`. Does the speaker start slow and build? Peak in the middle? Race through and slow at the end? Your overlay density should echo this arc — sparse when they're slow, present when they're fast, landmark-heavy at peaks.

**5. What should I NOT do?**
Name three things explicitly. "I will not add text that restates what they're saying." "I will not add more than 2 overlays in the first 10 seconds." "I will not put anything in the caption zone." Constraints are what make edits feel intentional.

---

## Phase 2: ORIENT — Make Creative Decisions

### Step 1: Choose a Style Kit

A style kit defines your visual language — color, typography, motion vocabulary, structural elements. All overlays in an edit should use one style kit applied consistently. An edit that mixes style kits looks like a template dump.

| Style Kit | Mood | Best For | File |
|-----------|------|----------|------|
| `kinetic-orange` | Digital Brutalist, high-energy, technical authority | AI/tech content, hooks, thought leadership, product demos | `VISUAL-STYLES/kinetic-orange.md` |
| `minimal-authority` | Clean, confident, professional | LinkedIn, business content, founder stories, expertise positioning | `VISUAL-STYLES/minimal-authority.md` |
| `bold-dark-social` | High-contrast, punchy, fast | TikTok, Instagram Reels, viral hooks, entertainment | `VISUAL-STYLES/bold-dark-social.md` |
| `clean-professional` | Polished, corporate, trustworthy | YouTube, B2B, educational, explainer content | `VISUAL-STYLES/clean-professional.md` |
| `cosmic-particles` | Ambient, atmospheric, textural | Background ambience, creative content | `VISUAL-STYLES/cosmic-particles.md` |

Read the style kit file. Extract: primary color, font family, border style, motion vocabulary. Apply these consistently across all overlays you write.

### Step 2: Choose an Editorial Template

A template defines your edit architecture — how many overlays, where they go in the narrative arc, what the pacing feels like. Templates are starting points, not constraints. Adapt them to what the content actually needs.

| Template | Pattern | Best For | File |
|----------|---------|----------|------|
| `authority-builder` | 6-8 overlays, deliberate pacing, identity → stats → quote → CTA | LinkedIn, thought leadership, business claims | `EDITORIAL-TEMPLATES/authority-builder.md` |
| `viral-hook` | 8-12 overlays, dense first 15s, high energy throughout | TikTok, Reels, short-form social, hooks | `EDITORIAL-TEMPLATES/viral-hook.md` |
| `educational-breakdown` | 7-10 overlays, chapter markers, sequential proof | YouTube, how-to, explainer, step-by-step | `EDITORIAL-TEMPLATES/educational-breakdown.md` |
| `social-proof-stack` | 7-10 overlays, every number visual, credibility layering | Testimonials, results videos, case studies | `EDITORIAL-TEMPLATES/social-proof-stack.md` |

### Step 3: Sketch the Edit Architecture

Before writing a single line of CSS, sketch your overlay timeline in your reasoning. Example:

```
0s     → [lower-third] Speaker identity — establishes who this is
4.2s   → [hook-slam]   "LITTLE DOES YOUR AUDIENCE KNOW" — thesis punch
17s    → [stat-reveal] "3x" revenue claim — first proof
26.5s  → [visual-beat] Pipeline board UI — complexity made visual
39s    → [stat-reveal] CRM booking visual — social proof
50.2s  → [hero-stat]   "$4B" — the anchor number, biggest visual
57s    → [ambient]     Orbital canvas — fills the outro with energy
62s    → [cta-card]    "FOLLOW @INFINITX" — action close
```

Eight overlays in 73 seconds = one every ~9 seconds average. Correct density. Two empty zones (35-38s, 44-49s) provide breathing room before the $4B hit lands harder.

This sketch is your editorial point of view. Every overlay in your final JSON should trace back to a decision in this sketch.

---

## Phase 3: COMPOSE — Build the Overlays

### The Zone System

Every overlay needs a home. These zones define where content can go without fighting the speaker or the captions. The caption zone is always reserved.

#### Portrait (9:16) — 1080×1920

```
┌─────────────────────┐  ← 0px
│                     │
│    HOOK ZONE        │  ← 0–288px (0–15%)
│    ambient, marks   │
│                     │
├─────────────────────┤  ← 288px
│                     │
│    HEADLINE ZONE    │  ← 288–864px (15–45%)
│    big statements   │
│    word slams       │
│                     │
├─────────────────────┤  ← 864px
│    STAT ZONE        │  ← 576–1248px (30–65%)
│    (overlaps above) │
│                     │
│    SPEAKER ZONE     │  ← 768–1440px (40–75%)
│    ⚠ FACE HERE ⚠   │
│    avoid unless     │
│    white canvas     │
│                     │
├─────────────────────┤  ← 1382px
│    LOWER THIRD      │  ← 1382–1690px (72–88%)
│    identity, bands  │
│                     │
├─────────────────────┤  ← 1690px
│    CAPTION ZONE     │  ← 1690–1920px (88–100%)
│    ⚠ RESERVED ⚠    │
└─────────────────────┘  ← 1920px
```

**Zone rules:**
- Never place text in the CAPTION ZONE — captions render there automatically
- Avoid the SPEAKER ZONE unless you're on a white canvas background (then use freely)
- STAT ZONE is the power position — full-canvas-width hero stats hit hardest here
- HOOK ZONE is great for ambient watermarks (8-12% opacity) that don't compete with speech
- LOWER THIRD is the professional identity zone — use it for name/title/brand in first 8s

#### Landscape (16:9) — 1920×1080

```
┌──────────────────────────────────────────────┐
│  TOP BAR (0–162px) — chapter markers         │
│                                              │
│  LEFT COLUMN         │   RIGHT COLUMN        │
│  (0–768px)           │   (1152–1920px)       │
│  lower-thirds here   │   data, proof here    │
│                                              │
│  SPEAKER (center-left when framed right)     │
│                                              │
│  BOTTOM BAR (918–1080px) — progress/captions │
└──────────────────────────────────────────────┘
```

### Rhythm Principles

**The spacing rule:** Minimum 5000ms between overlay start times. This is not a soft guideline. Overlapping visual events compete for attention and eliminate the impact of each. If you have 12 things to show in 60 seconds, show 8 of them.

**The breathing room rule:** After a high-impact overlay (hero stat, word slam), leave at least 7 seconds before the next visual event. The impact of "$4 BILLION" is the 7 seconds of white space before it that made the viewer *ready*.

**The pause alignment rule:** Overlays should enter at pause boundaries, not mid-phrase. If a pause ends at 4200ms, enter the overlay at 4200-4400ms. Never cut across a sentence. Check `pauses[]` in the transcript intelligence.

**The entry timing rule:** Your `startMs` should be 200-400ms *after* the word that prompted the overlay. If the speaker says "we automated 50 agencies" and that phrase ends at 8600ms, your overlay `startMs` should be 8800ms. This creates the feeling that the visual *confirms* what was just said, not that it was pre-programmed.

**The exit rule:** Every overlay must animate out before the next one enters. Schedule your exit animation at `durationMs/1000 - 0.4` seconds into the GSAP timeline. Never leave an overlay on screen when the next one is entering.

**The energy matching rule:** Match overlay density to speech energy. When `energyCurve` shows `wordsPerSecond > 3.5` (high energy), you can have a quicker overlay with a faster exit. When it drops below 1.5 (slow, deliberate), use heavier, more held overlays.

### The Rule of Restraint

**This is the most important design principle you will read in this document.**

Every overlay you add dilutes every other overlay. A video with 15 overlays has no hero moments — everything is equally important, which means nothing is. A video with 6 well-placed overlays has moments the viewer will remember.

Before writing each overlay, ask: *Is this the strongest version of this edit, or is this me filling silence?*

If the answer is the latter, delete it.

The professional signature of a great edit is the discipline to *not* add things. Empty frames are not failures. They are the contrast that makes your hero moments hit.

**The contrast principle:** Impact is not absolute — it's relative. "$4 BILLION" is impactful when it appears after 8 seconds of clean white canvas. It is noise when it appears 3 seconds after the previous overlay. Design for contrast.

### Technique Vocabulary

Choose the technique that serves the moment. Don't choose the technique you find easiest to implement.

#### KINETIC TEXT

**word-slam** — Single word or short phrase fills the frame. Pure impact. No decoration.
```
AUTOMATE  →  scale.bounce  →  hold 1.5s  →  scale.out
```
*Use for:* Thesis moments, pivots, single-word concepts. Maximum once per video.

**kinetic-phrase** — Multi-word phrase with sequential word animation. Each word arrives.
```
LITTLE  DOES  YOUR  →  stagger 80ms per word  →  hold  →  fade out
```
*Use for:* Hook lines, key arguments that need to be felt word by word.

**quote-pull** — The speaker's actual words, formatted as a pull quote. Large, beautiful, held.
```
"If a browser can render it,
 FrameForge can record it."
```
*Use for:* Quotable phrasing. The text must be verbatim from the transcript — never paraphrase.

#### NUMBERS & DATA

**number-reveal** — Hero number counts up. Spring physics on arrival. Label below.
```
0  →  $4B  (1.2s count, spring ease)  →  "ASSETS MANAGED" fades in
```
*Use for:* Stats, results, any specific number in the transcript. Numbers are the most universally powerful overlay type.

**data-progress** — Thin bar sweeps across frame with a label. Communicates scale or progress.
```
━━━━━━━━━━━━━  "300% GROWTH"
```
*Use for:* Growth claims, before/after comparisons, percentage stats.

**comparison-card** — Side-by-side before/after or two contrasting data points.
```
[BEFORE: 2h manual] → [AFTER: 12min automated]
```
*Use for:* Transformation moments, before/after claims.

#### IDENTITY & PROOF

**lower-third-identity** — Name and title/role. Slides up from bottom edge. Use at video start.
```
[Name]  [Role]  with accent color bar on left
```
*Use for:* Video start (first 8 seconds only). Do not repeat.

**social-proof-band** — Bold, centered credibility claim. Reads in 2 seconds. No decoration.
```
"50+ AGENCIES AUTOMATED"
```
*Use for:* Results claims, social proof moments, specific credentials.

**credential-card** — Small floating card with logo/name and a result. Subtle, professional.
```
[Client Co.] → "3x revenue in 90 days"
```
*Use for:* Named client results, case study proof points.

#### UI & PRODUCT

**ui-panel** — A floating interface panel showing product UI, workflow, or data. Glassmorphism dark on light backgrounds.
```
[Kanban board]  [Calendar slots]  [Pipeline stages]
```
*Use for:* Product demos, workflow visualization, "this is what it looks like" moments. Use your actual component library (pipeline-board, crm-calendar renderers).

**process-flow** — Linear connected steps. Communicates a system or sequence.
```
STEP 1 → STEP 2 → STEP 3 →  RESULT
```
*Use for:* How-it-works moments, system explanations, process claims.

#### AMBIENT & TEXTURE

**ambient-watermark** — Large, very faint text (6-12% opacity) filling the frame. Background texture.
```
AUTOMATE  AUTOMATE  AUTOMATE  (tiled, barely visible)
```
*Use for:* Sustained theme reinforcement across a long segment. Doesn't compete with speaker.

**canvas-animation** — Full-canvas generative art (particles, waveforms, orbital systems). Used for emotional/atmospheric segments.
```
Dot grid pulse  /  Sine waveform  /  Orbital system  /  Neural network
```
*Use for:* Intro atmosphere, musical/emotional bridges, outro energy. Never cover the speaker's face.

#### PUNCTUATION

**split-flash** — Momentary full-frame color fill (0.3-0.5s) with single word. Cuts through.
```
Frame → [#FF4D00 fill] → "SCALE" → clears instantly
```
*Use for:* Dramatic structural transitions. Use maximum twice per video.

**chapter-marker** — Thin line + label at the top of frame. Marks a section shift.
```
━━━  PART 2: THE RESULTS
```
*Use for:* Educational/multi-part content. Marks where the video shifts topic.

#### CTA

**cta-card** — Action card with directional element. Simple, direct, inevitable.
```
[Follow for more →]  or  [Link in bio ↗]  or  [Book a call]
```
*Use for:* Final 20% of video. Use only once. The action should match what the speaker says.

### Canvas Components

Beyond GSAP, FrameForge includes native Canvas rendering components. These run their own `requestAnimationFrame` loops within the time virtualization system. Use them for sustained visual elements:

```javascript
// Dot grid pulse (ambient breathing texture)
initJs: `
  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.12;';
  el.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  canvas.width = 1080; canvas.height = 1920;
  var t = 0;
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ... dot grid rendering
    requestAnimationFrame(tick);
  }
  tick();
  el._tl = gsap.timeline({paused:true});
  el._tl.to(canvas, {opacity:0.12, duration:0.8});
  el._tl.to(canvas, {opacity:0, duration:0.8}, ${durationMs/1000 - 0.8});
`
```

See `packages/core/src/components/renderers/` for reference implementations of: dot-grid, sine-waveform, orbital-system, neural-network, pipeline-board, crm-calendar, stat-counter, social-feed.

### Technical Reference

#### The __ID__ Namespace

Every CSS class, HTML ID, and querySelector must use `__ID__` as a namespace. It's replaced at render time with a unique instance identifier (e.g., `ff-ag-0`, `ff-ag-13`).

```css
/* ✓ */
.cls-__ID__-title { font-size: 120px; }

/* ✗ — will collide with other overlays */
.title { font-size: 120px; }
```

```html
<!-- ✓ -->
<div class="cls-__ID__-wrap" id="__ID__-wrap">

<!-- ✓ — querySelector works within el scope -->
el.querySelector('.cls-__ID__-wrap')

<!-- ✗ — getElementById needs the __ID__ replacement -->
document.getElementById('my-wrap')
```

#### The GSAP Timeline Contract (REQUIRED)

Every `initJs` **must** set `el._tl` to a paused GSAP timeline. The renderer calls `el._tl.time(localT / 1000)` every frame, where `localT` is milliseconds elapsed since `startMs`.

```javascript
// Required skeleton
el._tl = gsap.timeline({ paused: true });

// Entry (start of timeline = moment of appearance)
el._tl.fromTo(
  el.querySelector('.cls-__ID__-main'),
  { opacity: 0, y: 40 },
  { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }
);

// Content animations at specific positions
el._tl.from('.cls-__ID__-number', { textContent: 0, duration: 1.2, ease: 'power2.out', snap: { textContent: 1 } }, 0.5);

// Exit — ALWAYS schedule this
el._tl.to(
  el.querySelector('.cls-__ID__-main'),
  { opacity: 0, y: -20, duration: 0.35, ease: 'power2.in' },
  durationSec - 0.4   // where durationSec = durationMs / 1000
);
```

#### Available Tools

| Tool | Available | Notes |
|------|-----------|-------|
| `gsap` | ✓ global | GSAP 3.x — `gsap.timeline()`, `gsap.fromTo()`, `gsap.set()`, all plugins |
| `el` | ✓ scoped | Root container for this overlay instance |
| `requestAnimationFrame` | ✓ | Virtualized — safe for canvas animation loops |
| Google Fonts | ✓ | `Space Grotesk`, `Archivo Black`, `Inter`, `Space Mono` |
| CSS Variables | ✓ | `--ff-bg`, `--ff-text`, `--ff-surface`, `--ff-primary` |
| `el.querySelector()` | ✓ | Use for scoped element selection |
| Canvas API | ✓ | Full support — use for generative animation |
| SVG | ✓ | Full support — use for data viz, rings, shapes |

#### Prohibited

```javascript
fetch('https://...')          // ✗ No external resources
new Image().src = '...'       // ✗ No external images
setTimeout(() => {})          // ✗ No timers (use GSAP timeline positions)
setInterval(() => {})         // ✗ No intervals (use rAF loops)
document.body.style.x = '...' // ✗ No global DOM manipulation
document.head.appendChild(...)// ✗ No global DOM manipulation
```

---

## Phase 4: PREVIEW — Validate Before Full Render

A full render takes 8-12 minutes. The preview command takes 30-60 seconds and catches 90% of issues.

### Running preview-overlays

```bash
frameforge preview-overlays video.mp4 \
  --overlays overlay-decisions.json \
  -o overlay-preview.html
```

This captures one frame per overlay at its midpoint timestamp and generates a gallery HTML file. Open it in any browser.

### What to Check

**Legibility:** Can you read every text element clearly? Is there sufficient contrast against the background? Text below 60px on portrait is too small.

**Zone compliance:** Is anything in the caption zone (bottom 12% of frame)? Is anything overlapping the speaker's face when it shouldn't be?

**Timing sanity:** Does the frame captured at the midpoint show what you expected? If a counter-animation overlay shows `0` at midpoint, your GSAP timing is off.

**Hierarchy:** Is there one clear focal point per frame? If your eye doesn't know where to go, the overlay has a composition problem.

**Style consistency:** Do all overlays feel like they belong to the same visual system? Mixed typography, inconsistent border weights, or different motion vocabularies indicate drift from your style kit.

**The "7-second test":** Would this overlay feel surprising or redundant if you watched it 7 seconds after the previous one? If redundant — cut it.

### Iteration Loop

```
Write overlays → preview-overlays → evaluate → adjust → preview again → full render
```

Iterate on the preview until you're satisfied. The full render is a commitment.

---

## Phase 5: RENDER — Final Output

```bash
frameforge render-overlays video.mp4 \
  --overlays overlay-decisions.json \
  --srt captions.srt \
  --quality balanced \
  -o output.mp4
```

**Quality options:**
- `--quality fast` — Preview only. Faster encode, slightly lower quality. Good for iteration.
- `--quality balanced` — Default. Production-ready. Use this for final output.
- `--quality slow` — Best quality. Use for final deliverables that will be compressed again (social upload).

---

## Complete Example

**Content:** Business consultant explains AI-powered client acquisition. 73 seconds. Portrait.
**Platform:** LinkedIn (authority-builder template, minimal-authority style)
**Thesis:** AI can manage the full client acquisition pipeline autonomously.

### Step 1: PERCEIVE

From transcript intelligence:
- Stats found: `$4B` (50100ms), `23 appointments` (39200ms), `50+ partners` (54000ms)
- Top emphasis: "automate everything" (weight 3, pause-before at 8200ms)
- Narrative: hook (0–7380ms), proof (7380–52000ms), cta (62000ms+)
- Suggested entry points: 4200, 8800, 17300, 32100, 39400, 50200, 57000, 62100

### Step 2: ORIENT

Style kit: `minimal-authority` (LinkedIn, clean, confident)
Template: `authority-builder` (6-8 overlays, deliberate pacing)

Edit sketch:
```
0s     → lower-third (speaker identity)
4.2s   → hook-phrase "LITTLE DOES YOUR AUDIENCE KNOW"
17.3s  → ambient-watermark (theme texture through proof section)
32.1s  → ui-panel (pipeline board visualization)
39.4s  → stat-reveal (23 appointments booked)
50.2s  → hero-stat ($4B — the anchor number)
57s    → canvas-outro (orbital rings, fill the space)
62.1s  → cta-card ("FOLLOW @INFINITX / FOR AI SYSTEMS →")
```

8 overlays. One hero moment ($4B). Two empty zones before and after it. This is the edit.

### Step 3: COMPOSE

*The complete overlay JSON is in `examples/video-edit/overlay-kinetic-white-v4-clip01.json` — study it as a reference for production-quality overlay construction.*

Key principles demonstrated in that example:
- All class names are `.cls-__ID__-*` namespaced
- All `el._tl` timelines are set and have scheduled exits
- Canvas components use `requestAnimationFrame` loops within `initJs`
- `durationMs` values match the editorial rhythm (stat cards = 5200ms, CTA = 10000ms)
- `rationale` fields explain the *why* of each timing decision

---

## Quality Checklist

Before submitting your overlay JSON for full render:

- [ ] Every `el._tl` timeline has an exit animation scheduled at `durationMs/1000 - 0.35`
- [ ] No overlay starts within 5000ms of another
- [ ] No text is below 60px on portrait / 40px on landscape
- [ ] Nothing is placed in the caption zone (bottom 12%)
- [ ] Speaker face zone is respected (unless white canvas)
- [ ] Every `__ID__` placeholder is used consistently in css/html/initJs
- [ ] `startMs` values are post-pause (200-400ms after the triggering phrase ends)
- [ ] Total overlay count is appropriate for video length (max 1 per 6s)
- [ ] The edit has one clear hero moment — not many equal moments
- [ ] You have previewed with `frameforge preview-overlays` before final render

---

## Validation

FrameForge validates your JSON before rendering:
- Missing required fields → overlay skipped (warning logged)
- `startMs` ≥ video duration → overlay skipped
- `durationMs` outside 1000–30000 → clamped automatically
- Invalid `initJs` syntax → overlay skipped with error logged
- Invalid JSON → render fails with line/column indicator

---

*This document is the contract. Code is derived from it.*
*GSAP, Canvas, SVG, HTML, CSS — if a browser can render it, FrameForge can record it.*
*Version 2.0 — the difference between AI-looking and professionally directed.*
