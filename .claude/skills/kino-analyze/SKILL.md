---
name: kino-analyze
description: "Analyze a video script or transcript — extract beats, concepts, emotional arc, and visual metaphor opportunities. Use when the user provides a script, transcript, or video brief and needs creative structure analysis before building."
argument-hint: "[paste script or path to script file]"
---

# /kino-analyze — Script & Transcript Analysis

**Input:** Raw script, transcript, or video brief
**Output:** Structured creative analysis ready for `/kino-spec`

---

## What This Skill Does

Takes raw creative input (a script with dialogue, a transcript with timestamps, or a brief) and produces a structured analysis that maps every moment to its visual, emotional, and sonic potential. This is the perception layer — understanding WHAT the content is saying before deciding HOW to visualize it.

---

## Analysis Process

### Step 1: Section Mapping

Break the script into discrete sections. Each section has:

```markdown
| Section | Time | Type | Emotional Beat | Core Concept |
|---------|------|------|----------------|--------------|
| Hook | 0:00-0:06 | Cold open | Curiosity/intrigue | Identity statement |
| Setup | 0:06-0:18 | Exposition | Building credibility | Capability showcase |
```

**Section types:** hook, setup, demonstration, flex, character-moment, climax, resolution, cta

### Step 2: Beat Extraction

A "beat" is a moment where something changes — tone shifts, a key word lands, a concept crystallizes. Identify every beat:

```markdown
| Time | Beat | Type | Intensity (1-10) | Visual Potential |
|------|------|------|------------------|-----------------|
| 0:02 | "I am not a chatbot" | Identity claim | 8 | Text reveal, typewriter |
| 0:12 | "while you sleep" | Power statement | 7 | Clock/moon visual |
| 0:38 | "I'm not perfect" | Vulnerability | 6 | Imperfection visual |
```

**Beat types:** statement, reveal, transition, emphasis, question, callback, punchline, emotional-shift

### Step 3: Concept-to-Metaphor Mapping

For each concept mentioned in the script, propose a visual metaphor. This is the creative leap — turning words into motion graphics:

```markdown
| Concept | Visual Metaphor | Element Type | Notes |
|---------|----------------|--------------|-------|
| "content operation" | Assembly line / conveyor belt | Animated wireframe | Parts moving through stages |
| "17 skills" | Constellation of dots | Dot array + connections | Each dot lights up in sequence |
| "your DNA" | Helix / spiral structure | Animated path | Double helix rotating |
```

**Rules for good metaphors:**
- Abstract over literal (a wireframe pyramid > a photo of a pyramid)
- Motion over static (an assembling shape > a finished shape)
- One concept = one visual (don't overload)
- Match emotional weight (big claims get big visuals)

### Step 4: Emotional Arc

Map the emotional trajectory of the entire piece:

```
Hook: Intrigue (7) → Setup: Credibility (6) → Flex: Awe (9) → Character: Trust (7) → CTA: Action (8)
```

This drives the **color arc** and **pacing** in the spec.

### Step 5: Audio Landscape

Identify moments that need sound design:

```markdown
| Time | Sound Type | Trigger | Notes |
|------|-----------|---------|-------|
| 0:00 | Ambient start | Section open | Low digital hum |
| 0:02 | Hit | Word lands | Percussive snap on "chatbot" |
| 0:06 | Transition | Section change | Whoosh sweep |
| 0:18 | Build | Flex begins | Rising tension |
```

### Step 6: Persistent Elements

Identify elements that should recur throughout (visual consistency):

- **Color motif:** What color represents the core brand/emotion?
- **Recurring shape:** What geometric element ties scenes together?
- **Typography style:** Bold/minimal/handwritten — what matches the tone?
- **Transition pattern:** How do sections flow into each other?

---

## Output Format

Produce the analysis as a structured markdown document:

```markdown
# Script Analysis: [Title]

## Overview
- **Duration:** Xs
- **Sections:** N
- **Emotional arc:** [one line]
- **Core metaphor:** [the single image that captures the whole piece]

## Section Map
[table]

## Beat Map
[table]

## Concept-Metaphor Map
[table]

## Emotional Arc
[graph or description]

## Audio Landscape
[table]

## Persistent Elements
[list]

## Creative Notes
[any observations about tone, pacing, audience, platform]
```

---

## Principles

1. **Every word matters** — short-form content has no filler. If a word is in the script, it's there for a reason.
2. **Beats drive everything** — the beat map becomes the timing backbone of the entire production.
3. **Metaphors > literals** — "processing a podcast" is better shown as a machine assembling parts than a screenshot of a podcast app.
4. **Sound is 50% of quality** — identify audio moments during analysis, not as an afterthought.
5. **The emotional arc is the real script** — visuals follow emotion, not just words.
