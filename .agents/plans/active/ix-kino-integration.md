# Plan: IX-Kino Integration — Community Weapon Deployment

**Status:** Active
**Priority:** P0 — Foundation for the 3-year arc
**Created:** 2026-03-21

---

## Objective

Turn Kino from a standalone render engine into the operational video production infrastructure of the INFINITX community. Every IX member who produces video content should be using Kino, visibly or invisibly.

---

## User Story

As an IX community member,
I want access to Kino's AI video pipeline,
So that my content looks like it was produced by a professional studio — because it was.

---

## What Needs to Exist

### Tier 1: The End Card (Build NOW — Day 1)
**`examples/brand-video/kino-endcard-ix.html`** ← building this session

A 3-second scene: Kino mascot + "made with kino · infinitx"
Rendered as `kino-endcard-ix.mp4` — composited onto every IX video's last 3 seconds.
This is the brand signature. It ships today.

### Tier 2: Template Library (Month 1)
5 pre-built overlay manifests optimized for IX content types:

| Template | Use Case | Key Components |
|----------|----------|----------------|
| `ix-authority.json` | Expert positioning content | Word-slam hook, stat cards, CTA |
| `ix-results.json` | "Results in 90 days" content | Number counters, before/after, credibility signals |
| `ix-education.json` | Tutorial/breakdown content | Step labels, code terminal, timeline |
| `ix-announcement.json` | Launch/news content | Kinetic phrase, orbital outro, CTA card |
| `ix-interview.json` | Podcast clip / talking head | Lower thirds, pull quotes, outro |

Each template is a JSON overlay manifest. Member clips a video → drops it in → `npx kino render` → done.

### Tier 3: The Edit Agent Pipeline (Month 2)
The full IX content production service:

```
Member submits: raw footage (MP4) + brief ("make this look like IX content")
    ↓
kino extract-transcript → transcript.json
    ↓
Claude reads transcript + ix-authority template → overlay.json
    ↓
kino render-overlays → final.mp4 (with captions + overlays + end card)
    ↓
Member receives: production-ready video
```

This is the "IX concierge" — AI does the edit, member gets the video.
Needs: a simple intake form/system (could be Discord bot, Notion form, or direct DM to Enrique initially).

### Tier 4: Self-Service Member Access (Month 3)
- Documentation: "Your Kino Access Guide" — one page, zero fluff
- Starter pack: 5 templates + example renders + CLI setup guide
- Community Slack/Discord channel: `#kino-renders` — members share outputs, get feedback

---

## The "Powered by kino · infinitx" Brand System

### The End Card (Tier 1)
3-second video closing card. Dark background, Kino mascot centered, "made with kino · infinitx" below.
Used as: final clip in all IX video content.

### The Watermark (Future)
Optional subtle bottom-right watermark for shorter content where end card doesn't fit.
Size: ~60px height. Appears at 0.2 opacity. "kino · ix"

### The Production Note
For long-form or article content:
*"Produced with kino, an infinitx tool."*
This is the first time Kino is publicly named — always in context of IX.

---

## Implementation Order

### Phase 1: This Session (TODAY)
- [x] Memory documented — strategy locked
- [x] Social media plan rewritten for IX flywheel
- [ ] End card HTML + manifest + render
- [ ] Update HANDOVER with new direction
- [ ] Commit everything

### Phase 2: This Week
- [ ] Post kinetic-white-v4 as first IX flagship content
- [ ] Post kino-showcase-v2 as capability demonstration
- [ ] Write IX member onboarding one-pager
- [ ] Build ix-authority template (first of 5)

### Phase 3: Month 1
- [ ] Build remaining 4 IX templates
- [ ] Build the AI edit agent pipeline (CLI wrapper)
- [ ] First IX member gets Kino access + produces content
- [ ] Establish #kino-renders community channel

### Phase 4: Month 2-3
- [ ] Full edit agent pipeline operational
- [ ] 10+ IX members actively using Kino
- [ ] "AI produced this video in 90 seconds" viral post
- [ ] Monthly content: "this month's best IX Kino content"

---

## The Category Play

The 3-year goal is owning the sentence:
**"Kino is what AI agents use to produce video."**

Every step should advance this claim:
- Month 1: IX content quality visibly exceeds the market
- Month 2: AI pipeline demonstrated publicly
- Month 3: "How IX members produce content" is a known thing
- Year 2: Other communities/agencies approach IX for access
- Year 3: Kino = industry standard for AI-native video production

---

## Acceptance Criteria (Month 1)

- [ ] End card ships and is on all IX content
- [ ] 8 IX videos posted with Kino production
- [ ] At least 3 "how did you make that?" engagement moments
- [ ] ix-authority template ready for member use
- [ ] Enrique's posting cadence: 2 Kino-produced posts/week
