# Plan: Real Video Editing Test — `frameforge edit` Validation

**Status:** Ready
**Priority:** P0 — The ultimate product validation
**Date:** 2026-03-16
**Updated:** 2026-03-16 (rewritten for v2 transparent compositing architecture)

---

## Objective

Validate the `frameforge edit` pipeline end-to-end with a real source video. This proves FrameForge can be used for **real video editing workflows** — a single CLI command takes raw footage and produces a professionally edited video with word-level captions and auto-generated motion graphics.

---

## Source Video

| Property | Value |
|----------|-------|
| File | `clip-7-RAW-building-ai-manager-v1.mp4` |
| Resolution | 1440x2560 (vertical/portrait) |
| Duration | 50.8 seconds |
| Codec | H.264 + AAC audio |
| Content | AI outreach campaign tutorial |

---

## Test Commands

### Test 1: Basic edit with word timings
```bash
frameforge edit clip-7-RAW-building-ai-manager-v1.mp4 \
  --word-timings word-timings.json \
  --style neo-brutalist \
  --caption-style pop-in \
  --speaker-name "Enrique" \
  --speaker-title "Business Development" \
  --quality balanced \
  --output edited-basic.mp4
```

### Test 2: Different style presets
```bash
# Clean minimal
frameforge edit clip.mp4 --word-timings wt.json --style clean-minimal --output edited-minimal.mp4

# Bold dark
frameforge edit clip.mp4 --word-timings wt.json --style bold-dark --output edited-dark.mp4

# Corporate
frameforge edit clip.mp4 --word-timings wt.json --style corporate --output edited-corp.mp4
```

### Test 3: Format conversion (vertical → landscape)
```bash
frameforge edit clip.mp4 --word-timings wt.json --format landscape --output edited-landscape.mp4
```

### Test 4: Caption styles
```bash
frameforge edit clip.mp4 --word-timings wt.json --caption-style karaoke --output edited-karaoke.mp4
frameforge edit clip.mp4 --word-timings wt.json --caption-style bold-center --output edited-bold.mp4
```

### Test 5: Quality presets
```bash
frameforge edit clip.mp4 --word-timings wt.json --quality fast --output preview.mp4    # Fast preview
frameforge edit clip.mp4 --word-timings wt.json --quality slow --output final.mp4      # High quality
```

### Test 6: Captions only (no overlays)
```bash
frameforge edit clip.mp4 --word-timings wt.json --captions-only --output captions-only.mp4
```

---

## Architecture (v2 — Transparent Overlay Compositing)

```
Source Video (1440x2560, 50.8s)
       ↓
frameforge edit (single command)
  ├── 1. ffprobe → probe source metadata
  ├── 2. WhisperX or --word-timings → word-level timestamps
  ├── 3. Content analysis → auto-generate overlay timeline
  ├── 4. Style preset → generate transparent overlay HTML (NO <video> element)
  ├── 5. Puppeteer → render overlay as transparent PNG frames (omitBackground: true)
  ├── 6. FFmpeg overlay filter → composite transparent frames ON TOP of source video
  └── 7. Audio copied from source
       ↓
Final edited video (smooth, native playback)
```

**Key:** Source video NEVER touches the browser. FFmpeg handles it natively.

---

## Success Criteria

- [ ] Video plays smoothly (not frame-by-frame/choppy)
- [ ] Captions show 2-4 words at a time with active word highlighting
- [ ] Overlays are proportionally sized (readable, not tiny)
- [ ] At least 5+ auto-generated overlay elements (hook, lower third, key points, CTA)
- [ ] Audio is preserved in final output
- [ ] All 4 style presets produce visually distinct results
- [ ] Format conversion (vertical → landscape) works with proper padding
- [ ] Quality presets affect encode speed and file size as expected
- [ ] Final video looks professionally edited
- [ ] All done via single CLI command — no manual steps

---

## Why This Matters

If this works, FrameForge isn't just an "animation to video" tool — it's a **programmable video editor**:
- Content creators can script their edits
- AI agents can edit videos end-to-end
- Bulk video editing becomes code, not clicking
