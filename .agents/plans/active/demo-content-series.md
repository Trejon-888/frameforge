# FrameForge Demo Content Series

**Status:** Active
**Created:** 2026-03-20
**Priority:** P0 — This is what makes the product compete

---

## The Core Insight

FrameForge's competitive advantage is not that it renders video. Every tool renders video. The advantage is that it renders **anything a browser can render** with **frame-perfect determinism**. Canvas, WebGL, GSAP physics, flow fields, 3D projections, particle systems — things that are impossible in CapCut templates, expensive in After Effects, and limited in Remotion.

The demo content must prove this. Not by saying it. By showing it. Every video in this series should make the viewer think: *"I could not have made that with any other tool I know."*

**Quality bar:** Compete with the best short-form content on LinkedIn/TikTok. Not "good for a programmatic tool." Just good.

---

## The 4 Videos

---

### VIDEO 1 — "The Showcase" (BUILDING NOW)
**File:** `examples/frameforge-showcase/scene.html`
**Type:** Pure programmatic (no source footage)
**Duration:** 30s | **Format:** 1920×1080 | **Audience:** Developers

**Narrative:** GSAP. THREE.JS. CSS. ANYTHING → Tech grid showing 6 live demos → Frame counter rendering → `npm install @frameforge/core`

**What makes it competitive:**
- 6 simultaneously running live Canvas/GSAP animations in a grid
- Icosahedron wireframe projection (pure Canvas 2D, no three.js needed)
- Flow field particle system (WebGL-grade visual in Canvas)
- Lissajous orbit trails
- Background flow field running the entire 30 seconds

**Render command:**
```bash
npx frameforge render examples/frameforge-showcase/scene.json
```

---

### VIDEO 2 — "The Edit" (Kinetic White v4 — already rendered)
**File:** `examples/video-edit/overlay-kinetic-white-v4-clip01.json`
**Type:** AI edit on source footage
**Duration:** 73.9s | **Format:** 1080×1920 | **Audience:** Content creators

**Status:** ✅ Rendered — `kinetic-white-v4-clip01-v2.mp4`
24 overlays, 41 captions, zero H.264 corruption.
This is the flagship edit demo. Launch asset.

**Use for:** LinkedIn/X launch announcement, shows the editing pipeline at its ceiling.

---

### VIDEO 3 — "The Speed Run" (TO BUILD)
**Type:** AI edit, different clip, different style
**Duration:** ~45-60s | **Format:** 1080×1920 | **Audience:** Content creators on TikTok/Reels
**Template:** Viral Hook | **Style:** bold-dark-social

**Creative direction:**
- Use a different source clip (tutorial or results-heavy content)
- Maximum density in first 10 seconds (3-4 overlays)
- Show that the system works on ANY content, not just clip01
- Bold, fast, TikTok-native pacing
- Proves: "one system, every video type"

**Key overlays to include:**
1. Pattern interrupt at 0.3s (split-flash or instant word-slam)
2. Opening claim visual at 3s (kinetic-phrase, fast stagger)
3. First credibility signal at 8s (number-reveal, small)
4. Hero stat at the video's peak
5. Outro canvas animation (orbital or neural)
6. CTA card

**Needs:** A new source clip from user. ~45-60s of talking-head content.

---

### VIDEO 4 — "The Framework" (TO BUILD)
**Type:** Pure programmatic, developer-facing deep dive
**Duration:** 60s | **Format:** 1920×1080 | **Audience:** Developers, YouTube
**Template:** Educational Breakdown | **Style:** Poster Modernist (cream/cobalt)

**Narrative:**
1. The problem: "Video rendering should work like code."
2. Time virtualization visualized: virtual clock controlling RAF queue
3. The pipeline: HTML → Chrome → frames → FFmpeg stdin → H.264
4. The output: different technologies rendering side by side
5. The SDK: 5 lines of TypeScript → 30 second video
6. The edit pipeline: extract-transcript → AI writes overlays → render

**What makes it competitive:**
- Self-referential: it explains HOW FrameForge works while demonstrating it
- The time virtualization visualization is genuinely novel
- Developer audience has never seen a tool explain itself this way
- Cream/cobalt aesthetic is distinct from every AI tool out there

**Render command:** Will be pure HTML, no source footage needed.

---

## New Visual Techniques to Build

These don't exist yet and would expand what agents can produce:

### TECHNIQUE A — Network Topology Visualizer
**File to create:** `packages/core/src/components/renderers/network-graph.ts`
**Description:** Animated node-edge graph. Nodes appear and connect with drawn edges. Each node is a label (AI tool, client, agency). Lines pulse with data flow.
**Use case:** AI pipeline content — "this is how 50 agencies connect to my system"
**Uniqueness:** Completely impossible in CapCut. Looks like real product UI.

### TECHNIQUE B — Data Race Bar Chart
**File to create:** `packages/core/src/components/renderers/race-chart.ts`
**Description:** 4-6 bars race to their values with spring physics. Labels. Leader highlighted in accent color. Before/after pairs supported.
**Use case:** Stats content — "results after 90 days" — bars growing from left
**Uniqueness:** Animated data viz that's actually beautiful, not just a CapCut progress bar

### TECHNIQUE C — Code Terminal (enhanced)
**Current:** `packages/core/src/components/renderers/code-terminal.ts` exists
**Enhancement:** Add syntax highlighting, cursor blink, multi-line type-in with pauses
**Use case:** Developer demos, "this is the code" moments
**Uniqueness:** Actual typing simulation synchronized to content moments

---

## The Quality Standard

Every video in this series must pass:

- [ ] **The stranger test:** Someone who has never heard of FrameForge should be able to identify what it does from the video alone
- [ ] **The screenshot test:** At least 3 frames in the video are individually shareable as standalone images
- [ ] **The comparison test:** Viewed next to a CapCut-edited version of the same content, FrameForge's version looks more considered
- [ ] **The scroll-stop test:** The first 2 seconds make a person stop scrolling
- [ ] **The "how did they do that?" test:** At least one visual element per video is something the viewer can't immediately explain

---

## Execution Order

1. ✅ `VIDEO 1` — Render showcase and review
2. ⏳ Build `TECHNIQUE A` (Network Topology) — unblocks new overlay type for agents
3. ⏳ `VIDEO 3` — Needs user to provide new source clip
4. ⏳ Build `TECHNIQUE B` (Race Chart) — high-demand for business content
5. ⏳ `VIDEO 4` — Pure programmatic, build when techniques are ready

---

## Assets

| Asset | Location | Status |
|-------|----------|--------|
| Showcase HTML | `examples/frameforge-showcase/scene.html` | Ready to render |
| Showcase manifest | `examples/frameforge-showcase/scene.json` | Ready |
| kinetic-white v4 | `examples/video-edit/overlay-kinetic-white-v4-clip01.json` | Rendered ✅ |
| Starter overlay | `examples/video-edit/overlay-starter.json` | Template ready |
| Style kits | `.agents/VISUAL-STYLES/` | 5 kits available |
| Editorial templates | `.agents/EDITORIAL-TEMPLATES/` | 4 templates available |

---

*The goal is not to show that FrameForge works. It's to show what FrameForge makes possible.*
