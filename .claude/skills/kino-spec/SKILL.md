---
name: kino-spec
description: "Write a production spec for a kino video — the creative contract that defines beat map, color arc, visual philosophy, key moments, persistent elements, and audio sync. Use after /kino-analyze, before /kino-build."
argument-hint: "[path to analysis or paste analysis]"
---

# /kino-spec — Production Spec Writer

**Input:** Script analysis from `/kino-analyze` (or raw script if starting fresh)
**Output:** A production spec — the complete creative contract a coding agent follows to build the video

---

## What a Production Spec Is

A production spec is **plain English + structured data** that tells a coding agent exactly what to build. It's the bridge between creative vision and code execution. Every creative decision is made HERE, not during coding.

A spec answers: What does every second look like, sound like, and feel like?

---

## Spec Structure

### 1. Creative Brief

```markdown
## Creative Brief

**Title:** [video title]
**Duration:** [Xs]
**Format:** [9:16 / 16:9 / 1:1]
**Platform:** [TikTok, Instagram Reels, YouTube Shorts, LinkedIn]
**Tone:** [one line — e.g., "Confident and technical, with moments of warmth"]
**Audience:** [who watches this]
**Core message:** [one sentence — what should the viewer remember?]
```

### 2. Visual Philosophy

The overarching design language for the entire video. Every frame must feel like it belongs to this philosophy.

```markdown
## Visual Philosophy

**Style:** [e.g., "Black canvas, white wireframe geometry, editorial precision"]
**Color palette:**
  - Primary: [hex] — [when/why]
  - Secondary: [hex] — [when/why]
  - Background: [hex]
  - Accent: [hex] — [used sparingly for emphasis]

**Typography:**
  - Headlines: [font, weight, tracking]
  - Body/captions: [font, weight, tracking]
  - Metadata: [font, weight, style]

**Motion language:**
  - Enter: [how elements appear — e.g., "slide up with cubic-bezier(0.16,1,0.3,1)"]
  - Exit: [how elements leave — e.g., "fade out over 0.3s"]
  - Emphasis: [how key moments hit — e.g., "scale pop 1.0→1.15→1.0"]
  - Idle: [what moves when nothing happens — e.g., "subtle particle drift"]

**Rendering mode:** [full-frame / overlay / hybrid]
  - full-frame: black canvas + motion graphics (no source video)
  - overlay: graphics composited on talking head
  - hybrid: alternates between both
```

### 3. Color Arc

How the color palette evolves through the video to match emotional progression:

```markdown
## Color Arc

| Section | Time | Dominant Color | Reason |
|---------|------|---------------|--------|
| Hook | 0:00-0:06 | Pure white on black | Clean, stark, attention-grabbing |
| Setup | 0:06-0:18 | White + subtle blue accent | Trust, technology |
| Flex | 0:18-0:38 | White + warm amber pulses | Energy, achievement |
| Character | 0:38-0:48 | Soft white, lower contrast | Vulnerability, honesty |
| CTA | 0:48-0:58 | White + brand accent | Action, community |
```

### 4. Beat Map (the backbone)

Every beat from the analysis, now with **exact visual and audio assignments**:

```markdown
## Beat Map

| Time | Beat | Visual | Elements | Audio | Duration |
|------|------|--------|----------|-------|----------|
| 0:00 | Silence | Black screen | none | Low ambient hum fades in | 0.5s |
| 0:00.5 | "I am" | Word appears | text: "I am", typewriter reveal | Soft key click | 0.8s |
| 0:01.3 | "not a chatbot" | Words appear, slight shake | text: "not a chatbot", scale emphasis on "chatbot" | Percussive hit | 1.2s |
| 0:02.5 | Beat pause | Words hold, ring expands | circle expanding from center, opacity fading | Subtle reverb tail | 1.0s |
```

**Beat map rules:**
- Every 0.5s should have an entry (even if "hold current state")
- Audio column is never empty — silence is a choice, write "silence" or "ambient continues"
- Elements column uses kino element types: `text`, `circle`, `rect`, `line`, `dot`, `grid`, `group`, `image`
- Duration is how long this beat holds before the next one

### 5. Key Moments

The 3-5 most impactful visual moments — where extra creative effort goes:

```markdown
## Key Moments

### Moment 1: "I am not a chatbot" (0:00-0:03)
**Concept:** Identity declaration
**Visual:** Words appear one at a time, typewriter style, centered on black.
On "chatbot" — the word shakes slightly, then a thin ring expands outward from center.
**Easing:** Text: ease-out. Ring: cubic-bezier(0.16,1,0.3,1).
**Audio:** Each word gets a subtle click. "Chatbot" gets a deeper hit.
**Mood:** Stark. Confident. Minimal.

### Moment 2: The Flex Montage (0:18-0:38)
**Concept:** Rapid capability showcase
**Visual:** 3-second cuts. Each cut: new concept visual assembles from scattered elements.
Cut 1: Wireframe screen with code scrolling. Cut 2: Carousel cards fanning out. Cut 3: Video player with progress bar.
**Easing:** Fast assembly (0.4s ease-out), hold 2s, quick dissolve (0.3s).
**Audio:** Whoosh on each cut. Rising energy. Subtle bass pulse underneath.
**Mood:** Impressive. Rapid. Technical competence.
```

### 6. Persistent Elements

Things that appear throughout the video for visual consistency:

```markdown
## Persistent Elements

| Element | Type | Behavior | Purpose |
|---------|------|----------|---------|
| Grid background | grid | Always visible at 5-8% opacity, subtle drift | Design environment feel |
| Corner markers | line group | Appear in transitions, pulse on beats | "Design tool" meta-layer |
| Dot particle field | dot array | 20-30 dots drifting slowly | Ambient life/energy |
| Progress indicator | line | Bottom edge, advances with time | Engagement hook |
```

### 7. Audio Sync Points

Precise timestamps where audio and visual must hit together:

```markdown
## Audio Sync Points

| Time | Audio Event | Visual Event | Sync Type |
|------|------------|--------------|-----------|
| 0:01.3 | Kick hit | "chatbot" scale pop | Hard sync — must be frame-accurate |
| 0:06.0 | Whoosh sweep | Section transition wipe | Soft sync — within 2 frames |
| 0:18.0 | Rising build starts | Flex montage begins | Hard sync |
| 0:48.0 | Chime | CTA card appears | Hard sync |
```

**Sync types:**
- **Hard sync:** Audio and visual must land on the same frame (±1 frame)
- **Soft sync:** Within 2-3 frames is fine
- **Ambient:** Continuous, no precise sync needed

### 8. Scene Breakdown

Map sections to kino scene format modes:

```markdown
## Scene Breakdown

| Scene ID | Time | Mode | Background | Notes |
|----------|------|------|------------|-------|
| hook | 0:00-0:06 | full-frame | #000000 | Black canvas, white geometry |
| setup | 0:06-0:18 | overlay | transparent | Graphics over talking head |
| flex | 0:18-0:38 | full-frame | #000000 | Rapid visual montage |
| character | 0:38-0:48 | overlay | transparent | Minimal, let face carry it |
| cta | 0:48-0:58 | full-frame | #0A0A0A | End card |
```

---

## Output Format

The spec is a single markdown file: `spec.md`

```markdown
# Production Spec: [Title]

## Creative Brief
[...]

## Visual Philosophy
[...]

## Color Arc
[...]

## Beat Map
[...]

## Key Moments
[...]

## Persistent Elements
[...]

## Audio Sync Points
[...]

## Scene Breakdown
[...]

## Technical Notes
- Canvas: [width]x[height] @ [fps]fps
- Rendering: [kino render-scene / kino edit --native / hybrid]
- Captions: [ASS style preset name]
- Sound cues: [list from kino sound library]
```

---

## Principles

1. **The spec is the single source of truth.** The coding agent reads ONLY the spec. If it's not in the spec, it doesn't exist.
2. **Every second is accounted for.** No gaps in the beat map. No undefined moments.
3. **Creative decisions are made here, not in code.** The build phase executes, it doesn't ideate.
4. **Sound and visual are equal.** Every visual decision has a corresponding audio decision.
5. **Be specific about easing.** "Smooth animation" is worthless. "cubic-bezier(0.16,1,0.3,1) over 0.6s" is actionable.
6. **Name your elements.** Every element in the beat map gets an ID that the coding agent will use.
7. **Think in layers.** Background → persistent elements → scene elements → captions → sound.
