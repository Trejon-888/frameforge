# Plan: Real Video Editing Test — Overlay + Captions on Source Footage

**Status:** Ready
**Priority:** P0 — The ultimate product validation
**Date:** 2026-03-16

---

## Objective

Take a real source video, understand its content, and produce an edited version with:
- Styled captions (transcribed from audio)
- Motion graphics overlays (intro, lower third, key point callouts, outro)
- Neo-Brutalist style with ORANGE (#f97316) as primary branding color
- All done using FrameForge's rendering pipeline

This proves FrameForge can be used for **real video editing workflows**, not just from-scratch animation.

---

## Source Video

| Property | Value |
|----------|-------|
| File | `clip-7-RAW-building-ai-manager-v1.mp4` |
| Resolution | 1440×2560 (vertical/portrait) |
| Duration | 50.8 seconds |
| Codec | H.264 + AAC audio |
| Content | AI outreach campaign tutorial |

---

## Style Spec (Neo-Brutalist + Orange)

| Element | Value |
|---------|-------|
| Primary | `#f97316` (Orange) |
| Background | `#171e19` (Charcoal) |
| Accent | `#b7c6c2` (Sage) |
| Text | `#000000` / `#ffffff` |
| Borders | 2px solid black |
| Shadows | 4px/8px hard, 0 blur |
| Heading Font | Cabinet Grotesk / Inter 800 |
| Body Font | Satoshi / Inter 500 |

---

## Execution Steps

### Step 1: Transcribe Audio
- Extract transcript from source video using WhisperX or ffmpeg + whisper
- Generate SRT file with word-level timestamps
- Review transcript for accuracy

### Step 2: Analyze Content
- Read transcript to understand the video's purpose
- Identify key moments for motion graphics:
  - **Intro** (0-3s): Who is speaking, what topic
  - **Key points**: Important statements that deserve visual emphasis
  - **Transitions**: Topic changes where a divider/card could help
  - **Outro** (last 3-5s): CTA or closing

### Step 3: Create HTML Overlay
Build an HTML page that:
- Plays the source video via `<video>` element (FrameForge controls time)
- Overlays styled captions synced to virtual time
- Adds motion graphics at identified key moments:
  - Intro card with topic title
  - Lower third with speaker name
  - Key point callout cards
  - Animated transitions between sections
  - Outro CTA card

### Step 4: Apply Neo-Brutalist Styling
All overlay elements use:
- 2px solid black borders
- 4px-8px hard shadows (no blur)
- Orange (#f97316) primary
- Charcoal (#171e19) backgrounds
- Bold geometric typography
- Dot pattern on orange backgrounds

### Step 5: Render Composite
- `frameforge render overlay.html --duration 50.8 --fps 30 --width 1440 --height 2560`
- This produces a new MP4 with the source video + all overlays
- Audio from source video needs to be re-muxed (FrameForge handles video, ffmpeg merges audio)

### Step 6: Re-mux Audio
- Extract audio from source: `ffmpeg -i source.mp4 -vn -acodec copy audio.aac`
- Merge with rendered video: `ffmpeg -i rendered.mp4 -i audio.aac -c copy final.mp4`

---

## Technical Approach

```
Source Video (1440x2560, 50.8s)
       ↓
HTML Overlay Page
  ├── <video> element (source video, time-synced)
  ├── Caption overlay (from SRT, styled)
  ├── Intro card (0-3s)
  ├── Lower third (3-6s)
  ├── Key point cards (at key moments)
  └── Outro card (last 3s)
       ↓
FrameForge render (headless Chrome screenshots)
       ↓
Raw rendered MP4 (video only)
       ↓
FFmpeg re-mux (add original audio)
       ↓
Final edited video with captions + motion graphics
```

---

## Success Criteria

- [ ] Transcript is accurate
- [ ] Captions display at correct times in Neo-Brutalist style
- [ ] At least 3 motion graphic overlays (intro, lower third, key point)
- [ ] Source video plays correctly underneath overlays
- [ ] Audio is preserved in final output
- [ ] Final video looks professionally edited
- [ ] All done through FrameForge — no manual video editor used

---

## Why This Matters

If this works, FrameForge isn't just an "animation to video" tool — it's a **programmable video editor**. That changes the entire market positioning:
- Content creators can script their edits
- AI agents can edit videos end-to-end
- Bulk video editing becomes code, not clicking
