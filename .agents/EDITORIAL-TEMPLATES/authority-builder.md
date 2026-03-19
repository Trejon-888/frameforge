# Editorial Template: Authority Builder

**Intent:** Establish the speaker as an undeniable expert. The viewer should finish the video thinking "this person knows more than I do about this, and I should follow them."

**Overlay Count:** 6–8
**Pacing:** Deliberate. Held. Confident. 7–10 second average between overlays.
**Visual Density:** Low-to-medium. Long empty frames are a feature, not a bug.
**Platform Fit:** LinkedIn (primary), YouTube, Twitter/X, professional Instagram

---

## Why This Template Works

Authority is not announced — it's demonstrated. This edit makes the speaker look like someone who doesn't need to perform. They just state facts. The visual system confirms those facts without trying too hard.

The single most important move in this template is **restraint**. A business consultant who adds 15 overlays looks like they don't trust their content. The same consultant with 6 well-placed overlays looks like they know exactly which moments matter. The edit communicates taste.

The contrast principle is central here: 10 seconds of clean white canvas makes the "$4B" stat card hit with physical weight. Plan the empty space as carefully as the overlays.

---

## Edit Architecture

### Act 1: Establish (0 – 20% of video)

**Overlay 1: Identity (0s – 6s)**
*Technique: lower-third-identity*
Establish who this person is before they earn it through the content. Name, role/title, brand. Appears in the first 5 seconds, holds through the hook, exits cleanly before the first content beat.
- Position: lower-third zone
- Duration: 5000–6000ms
- Style note: accent color on left bar only; everything else restrained

**Overlay 2: Hook Amplifier (post-hook, at first pause after the opening claim)**
*Technique: kinetic-phrase OR word-slam*
The opening claim of the video deserves a visual exclamation point. This is the moment that tells the viewer "this is going to be worth watching." It should appear 200-400ms AFTER the speaker finishes the first strong statement — not before.
- Position: headline zone (top-center frame)
- Duration: 4000–5000ms
- Timing: `pauses[0].endMs + 300` (first natural pause after hook)

### Act 2: Build Proof (20% – 75% of video)

This is where 3-4 overlays live, spaced generously. Each should correspond to a concrete claim — a number, a result, a named client, a specific system. Abstract claims do not need overlays. Facts do.

**Overlay 3: First Proof Point (first stat/number)**
*Technique: number-reveal OR social-proof-band*
The first concrete evidence. This could be a revenue number, a client count, a time saved, a percentage improvement. Counter animation if it's a number. Clean text band if it's a phrase.
- Position: stat zone (center or lower-center)
- Duration: 5000–6000ms
- Timing: transcript `stats[0].startMs + 400`

**Overlay 4: Process/System Visualization (optional — if speaker describes a system)**
*Technique: ui-panel OR process-flow*
If the speaker says "here's how the system works" or describes a workflow, this is the moment for a visual representation of that system. Shows, doesn't explain.
- Position: center-frame (use full-width if white canvas)
- Duration: 6000–8000ms
- Only include if the speaker explicitly describes something visual

**Overlay 5: Second Proof Point / Peak Stat (hero moment)**
*Technique: number-reveal with large hero typography*
The anchor proof. The biggest number. The most specific claim. This is your hero overlay — design it larger, bolder, more carefully than any other. It should be preceded by at least 7 seconds of empty canvas.
- Position: full-center, large typography
- Duration: 5000–6500ms
- Timing: transcript `emphasis[0].startMs + 400` (highest weight moment)

**Overlay 6: Ambient Context (optional — for extended proof sections)**
*Technique: ambient-watermark OR canvas-animation*
If the proof section is long (>25 seconds), add an ambient visual element that keeps the frame alive without competing with the speaker. This should be subtle — 8-12% opacity at most.
- Position: full-canvas (hook zone or full-frame at low opacity)
- Duration: 12000–20000ms
- Never in the lower-third or caption zone

### Act 3: Close with Action (75% – 100% of video)

**Overlay 7: Outro Energy (optional — if video has a clear outro)**
*Technique: canvas-animation OR ambient-watermark*
If the speaker has a winding-down section before the CTA, this gives the outro visual life without distracting from the final message.
- Position: full-canvas, low opacity
- Duration: 10000–15000ms

**Overlay 8: CTA Card (final 15-20% of video)**
*Technique: cta-card*
One CTA. Clear, direct, actionable. Matches what the speaker is saying. Appears when they are delivering the CTA, not before.
- Position: lower-third zone to lower-center (above caption zone)
- Duration: 7000–10000ms
- Text must match the spoken CTA (follow, subscribe, book a call, link in bio)

---

## Timing Formula

For a 60-second video:
```
0s      → Identity lower-third
5s      → [empty — hook playing out]
12s     → Hook amplifier
17s     → [empty — building proof]
24s     → First proof point
32s     → [empty — breathing room]
38s     → Process/system (if applicable)
46s     → Hero stat (anchor moment)
52s     → [empty — let it land]
55s     → CTA card
```

For a 90-second video, add one more proof point at ~65s. Do not exceed 8 overlays.

---

## Quality Signals

**This template is working when:**
- The video feels like it could run without the overlays — they add, not substitute
- The hero stat feels earned because of the space before it
- The viewer could describe the speaker's credentials after watching
- Nothing feels rushed or anxious

**This template is failing when:**
- More than 2 overlays appear in any 15-second window
- The identity card is still on screen past 8s
- Overlays explain what the speaker is saying rather than confirming it
- The CTA appears before the last 20% of the video

---

## Style Kit Recommendations

**Primary:** `minimal-authority` — the obvious choice for this intent
**Alternative:** `kinetic-orange` — for more aggressive authority (tech/AI brand)
**Avoid:** `bold-dark-social` — the urgency of that style undermines the confidence this template projects

---

*Authority is built through precision, not volume.*
