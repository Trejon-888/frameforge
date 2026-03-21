# Content Queue

**Protocol:** kino dev agent drops READY items here. Scooby picks up, uploads, schedules, marks POSTED.

**Last Updated:** 2026-03-21

---

## Queue

| # | Asset | Copy | Platforms | Priority | Status |
|---|-------|------|-----------|----------|--------|
| 001 | `examples/social-media/output/kinetic-white-v4-clip01-v2.mp4` | See below | LinkedIn | P0 | READY |
| 002 | `examples/social-media/output/v5-kino-any-framework.mp4` | See below | X, Instagram Reels | P0 | READY |
| 003 | `examples/brand-video/output/kino-endcard-ix.mp4` | — | Internal reference only | — | HOLD |
| 004 | `examples/frameforge-showcase/output/kino-showcase-v2.mp4` | See below | X, LinkedIn | P0 | PENDING RENDER |

---

## Copy Bank

### 001 — kinetic-white-v4-clip01-v2.mp4

**LinkedIn:**
> Your competitors are still editing in Premiere.
>
> This took 12 seconds.

**X:**
> this was code 12 seconds ago.

---

### 002 — v5-kino-any-framework.mp4

**LinkedIn:**
> If a browser can render it, she renders it.
>
> HTML. Canvas. WebGL. Three.js. GSAP. Python.
> One render command. One MP4.

**X:**
> she renders anything a browser can render.

**Instagram caption:**
> she renders anything ✦ html · canvas · webgl · three.js · gsap · python

---

### 004 — kino-showcase-v2.mp4 (Transmission from Kino)

**LinkedIn:**
> Transmission received.
>
> 30 seconds. 4 scenes. Zero After Effects.
> This is how we produce IX content.

**X:**
> transmission received.
> origin: unknown.
> render time: pending.

---

## Archive (Posted)

*(empty — first posts haven't gone out yet)*

---

## Notes for Scooby

- Assets are local MP4s at the paths listed above
- Upload via `media_generate_upload_link` before scheduling
- Post 001 first — LinkedIn, no hashtags, no explanation
- Post 002 second — X and Reels simultaneously
- Hold 003 (end card) — internal use only until compositing workflow is ready
- 004 pending render confirmation — check with kino dev agent before scheduling
- **Rule: Never post anything that wasn't rendered by kino**
