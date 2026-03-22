# Week 10 Reveal — First Public Kino Post

**Status:** DRAFT — DO NOT POST before Week 10
**Planned date:** ~2026-05-30 (10 weeks from launch)
**Platforms:** LinkedIn (flagship) → Reddit (technical) → X (cryptic) → YouTube (long-form)

---

## The Sequence

Post in this order, same day:
1. LinkedIn flagship (morning, 8:30am)
2. X post (immediately after LinkedIn)
3. Reddit: r/webdev + r/MachineLearning (afternoon)
4. YouTube video premieres (evening)

---

## LinkedIn Post (Flagship)

```
For 10 weeks, INFINITX has been producing every video with the same system.

You've seen the content. You've wondered how.

Today I'm naming it: kino.

kino is a programmatic video engine I built for IX.
If a browser can render it — HTML, Canvas, WebGL, Three.js, GSAP, Python —
kino records it. Frame by frame. Deterministic. Reproducible.

No After Effects. No Premiere. No editor.
One JSON manifest. One render command. One MP4.

The real play: AI agents write the scene. kino renders it.
That's the pipeline I built. That's what's been producing your content.

For now, kino is exclusive to INFINITX.
If you want access, you know where to find us.

[link to IX community]
```

---

## X Post (Cryptic, same day)

```
she has a name.

kino.

browsers dream in code. kino renders the dream.
she's been doing it for 10 weeks.
you've been watching.

now you know.

kino · ix
```

---

## Reddit Post (Technical, r/webdev)

**Title:** `I built a programmatic video engine that patches browser time APIs — here's why and how`

**Body:**
```
For the past 6 months I've been building kino — a video renderer that:
- Loads any HTML page in headless Chrome
- Patches ALL time APIs (Date.now, performance.now, requestAnimationFrame, setTimeout, CSS animations, Web Animations API, <video>, <audio>)
- Advances virtual time per frame
- Pipes raw frames directly to FFmpeg stdin (no intermediate PNG files)

The result: any animation that runs in a browser renders to video, deterministically, at any speed.

[showcase video embed]

**Why this matters:**
Regular screen recording is non-deterministic. Complex GSAP animations stutter. Canvas particle systems render at different speeds depending on CPU load. kino makes it deterministic — what you design is what you get, frame-perfect, every time.

**The time virtualization approach:**
[2-3 paragraphs of genuine technical explanation about the time patching approach, rAF queue, virtual clock]

**What I've rendered with it so far:**
- Kinetic typography videos for content production
- Data visualization animations
- AI agent-generated video reports

**It's on npm:** `npm install @kinohq/core`
**Repo:** [GitHub link]

Happy to answer technical questions about the time virtualization approach — it's the interesting part.
```

---

## YouTube Video (Long-form, same day premiere)

**Title:** `Why I built the video tool AI agents use — kino`

**Structure (10–15 min):**
1. Show the output (30s of best renders — no explanation yet)
2. "For 10 weeks, IX has been producing content with this. Now you know what it is."
3. The problem: video production is a bottleneck for AI agents
4. The insight: browsers already know how to animate — just record them
5. Live demo: write JSON manifest → run kino → watch MP4 appear
6. The IX application: how members use it for content production
7. What's next: AI agent pipeline (Claude → kino → video)
8. CTA: Join INFINITX for access

---

## The Reddit/HN Timing

The Reddit post is the "Show HN" moment — but done right.
Lead with technical depth. Let the comments carry it. Respond to everything for 48 hours.

If it gets traction on r/webdev: cross-post to r/MachineLearning with the AI angle.
If it gets really big: that's when to post on Hacker News.

HN post title: `Show HN: kino – programmatic video renderer that patches all browser time APIs`

---

## Pre-Reveal Checklist (complete before posting)

- [ ] kino npm packages updated and published
- [ ] GitHub README is polished (it gets thousands of eyes on reveal day)
- [ ] IX community landing page is ready and live
- [ ] At least 8 IX members actively using kino (the network proves the claim)
- [ ] `kino-showcase-v2.mp4` is the best render we've ever made (re-render if needed)
- [ ] YouTube video is recorded, edited, ready to premiere
- [ ] Scooby has all platform posts ready to publish in sequence
- [ ] Enrique has cleared his calendar for 48 hours to respond to comments personally
