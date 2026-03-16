# Plan: Competitive Benchmark v4 — Beat Remotion at Their Own Game

**Status:** Ready
**Priority:** P0 — Product quality + GTM content
**Date:** 2026-03-15

---

## Objective

Run Remotion's own showcase prompts through FrameForge and produce equal or better output. Simultaneously push video quality to 9-10/10 by implementing the missing pro techniques.

---

## Two Tracks Running in Parallel

### Track A: Pro Technique Upgrades (9-10/10 quality)
Implement the missing techniques that separate amateur from professional motion design.

### Track B: Remotion Competitive Benchmarks
Recreate Remotion's top showcase videos to prove FrameForge matches or exceeds their output — without React.

---

## Track A: Pro Techniques to Implement

### 1. Per-Character Kinetic Typography
Individual letters animate independently — scale, rotation, position, color per character. This is the single biggest quality jump remaining.

**Implementation:**
- Split text into `<span>` per character in codegen
- Each span gets independent transform with staggered delay
- Support: wave, scatter, typewriter, bounce-in, rotation cascade
- Characters can have different colors, sizes during transition

**Example effect:** "FRAMEFORGE" where each letter scales from 0 to 1 with 30ms stagger + slight rotation overshoot = text that "pops" into existence with personality.

### 2. Morphing Scene Transitions
Instead of instant cuts between scenes, elements morph/transform. Background colors wipe via expanding circles or diagonal sweeps. Text cross-fades or one word transforms into the next.

**Implementation:**
- Circle wipe: expanding circle clip-path reveals next scene
- Diagonal sweep: CSS clip-path polygon animating across screen
- Color bleed: background gradient transitions smoothly
- Text morph: old text scales down + fades while new text scales up + fades in (overlapping)

### 3. Sound-Synced Visual Beats
Design animations with rhythmic timing even without actual audio. Elements hit at regular intervals (every 0.5s or 0.75s) creating visual rhythm that FEELS like music.

**Implementation:**
- Define a BPM (120 BPM = 0.5s per beat)
- Major elements enter on beat (0, 0.5, 1.0, 1.5...)
- Secondary elements enter on off-beats (0.25, 0.75...)
- "Hit" animations: brief scale overshoot (1.0 → 1.08 → 1.0) on beat

### 4. Complex Multi-Element Compositions
Multiple elements on screen interacting — not just stacking. Elements influence each other: one entering pushes another aside. Cards arrange in dynamic grids. Text wraps around shapes.

**Implementation:**
- Grid layouts that animate into position
- Elements that "push" others (translateX based on neighbor state)
- Overlapping elements with z-index animation
- Dynamic layouts: elements rearrange mid-video

### 5. Rich Color Gradients
Not flat colors — animated gradients, color-shifting backgrounds, chromatic accents on text edges.

**Implementation:**
- CSS background-size animation on gradients (200% → scrolling)
- Text with gradient fill that shifts over time
- Ambient color glow behind key elements
- Dark scenes with colored light sources (radial gradients that drift)

### 6. Advanced Canvas Effects
Beyond particles — scanning lines, glitch effects, waveforms, generative patterns.

**Implementation:**
- Scan line: horizontal line sweeps down during reveals
- Noise field: Perlin-like noise for organic motion
- Connection lines: particles connected by lines (constellation effect)
- Progress ring: circular loading animation for render visualization

---

## Track B: Remotion Benchmark Videos

### Priority 1 — High Impact (build these first)

#### B1: Cinematic Tech Intro
Remotion's showcase. We beat it with:
- Per-character kinetic typography for the product name
- Canvas particle constellation in background
- Film grain + camera zoom
- Morphing color transitions
- Sound-synced timing (120 BPM)

#### B2: Shape to Words Transformation
Geometric shapes morph into text. This tests:
- SVG path morphing OR clip-path animation
- Canvas shape drawing + dissolve into text
- Coordinated multi-element choreography

#### B3: Bar + Line Chart (Combined)
Animated data visualization. Tests:
- Canvas drawing for chart axes, bars, line
- Counting number animations
- Staggered bar growth with spring overshoot
- Line drawing with stroke-dashoffset
- Labels appearing on beat

### Priority 2 — Medium Impact

#### B4: News Article Headline Highlight
Text with animated highlight/underline. Tests:
- Text reveal with highlight marker sweep
- Clean typography animation
- Simple but polished execution

#### B5: Product Demo / Launch Video
Software product showcase. Tests:
- Browser mockup with animated UI
- Feature callouts with pointer/annotation
- Multi-scene composition with transitions

#### B6: Three.js 3D Ranking
3D animated ranking. Tests:
- Actual Three.js integration (our competitive advantage)
- FrameForge handles WebGL natively, Remotion needs wrappers

---

## Execution Order

```
Phase 1: Implement kinetic typography + morphing transitions
    ↓
Phase 2: Build B1 (Cinematic Tech Intro) — our flagship demo
    ↓
Phase 3: Build B3 (Animated Chart) — data viz showcase
    ↓
Phase 4: Build B2 (Shape to Words) — creative flex
    ↓
Phase 5: Build B4-B6 — fill out the portfolio
    ↓
Phase 6: Self-critique all against Remotion originals, iterate
```

---

## Quality Checklist (Every Video Must Pass)

- [ ] **Hook < 0.5s** — First frame is scroll-stopping
- [ ] **Film grain** — Texture overlay present
- [ ] **Camera motion** — At least one zoom kick
- [ ] **Kinetic typography** — At least one per-character animation
- [ ] **Morphing transition** — No instant cuts between scenes
- [ ] **Rhythmic timing** — Elements enter on 0.5s beat grid
- [ ] **Zero dead space** — Every frame has visual density
- [ ] **Every frame is a poster** — Pause at any point and it looks designed
- [ ] **Particle system** — Canvas particles with gravity + rotation
- [ ] **Color depth** — Gradients, not flat colors

---

## Success Criteria

- [ ] 6+ benchmark videos completed
- [ ] Each scores 8+/10 against pro standard
- [ ] At least 2 score 9+/10
- [ ] Side-by-side comparison with Remotion shows FrameForge is equal or better
- [ ] All videos saved as GTM resources in examples/social-media/
- [ ] Kinetic typography system is reusable (not one-off per video)
- [ ] Morphing transitions work in composition pipeline

---

## GTM Integration

Every video produced becomes launch content:
- Direct comparison posts: "Same prompt. Remotion vs FrameForge."
- Technical breakdown threads: "How we built X without React"
- The cinematic intro becomes the new brand video
- The data viz becomes the "FrameForge for data teams" pitch
- All videos rendered BY FrameForge (meta proof)

---

*This plan is the bridge from "interesting tool" to "professional-grade creative platform."*
