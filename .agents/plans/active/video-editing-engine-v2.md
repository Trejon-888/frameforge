# Video Editing Engine v2 — PRD

**Status:** Active
**Priority:** P0
**Created:** 2026-03-16
**Owner:** FrameForge Core

---

## Problem Statement

FrameForge's first video editing test (real footage + overlays + captions) exposed critical quality gaps:

1. **Captions show full sentences** — 30+ words displayed for 8+ seconds. Modern short-form content shows 2-4 words at a time with active word highlighting.
2. **Overlays are too sparse** — Only 5 overlay elements across 50 seconds of video. Professional edits have something happening every 2-3 seconds.
3. **Video quality degrades** — Output bitrate/resolution doesn't match input. The render pipeline re-encodes at generic CRF 23, losing quality.
4. **No multi-format support** — Can't easily switch between landscape (1920x1080), vertical (1080x1920), and square (1080x1080) from the same source.
5. **Subtitle engine is too basic** — No word-level timing, no animation, no style presets, just plain text on a dark box.

---

## Success Criteria

| Metric | Current (v1) | Target (v2) |
|--------|-------------|-------------|
| Words per caption | 10-30 | 2-4 |
| Caption style options | 1 (plain box) | 5+ (pop-in, karaoke, highlight, minimal, bold) |
| Overlay density | 1 per 10s | 1 per 2-3s |
| Output quality vs input | Noticeable degradation | Visually identical |
| Format switching | Manual resize | CLI flag (`--format vertical`) |
| Time to edit a 60s video | Manual HTML authoring | Automated with style preset |

---

## Architecture

### Current Pipeline (v1)
```
Source Video → Manual HTML overlay → FrameForge render → FFmpeg re-encode → Re-mux audio
```

**Problems:** Every step is manual. Captions are hand-written. Overlays are hand-timed. Quality settings are hardcoded.

### Target Pipeline (v2)
```
Source Video
    ↓
Transcribe (WhisperX word-level)
    ↓
Content Analysis (detect topics, emphasis, pauses)
    ↓
Auto-generate overlay timeline (captions + motion graphics)
    ↓
Apply style preset (Neo-Brutalist, Minimal, Corporate, etc.)
    ↓
FrameForge render (quality-matched encoding)
    ↓
Output in requested format(s)
```

---

## Feature Breakdown

### F1: Word-Level Caption Engine (P0)

**Problem:** Current captions show entire sentences. WhisperX provides word-level timestamps but we only use sentence-level.

**Solution:**

1. **Word-level transcription** — Use WhisperX `--word_timestamps True` to get per-word timing
2. **Smart word grouping** — Group words into 2-4 word chunks based on natural speech pauses and phrase boundaries
3. **Active word highlighting** — The currently-spoken word scales up / changes color
4. **Caption animation styles:**
   - `pop-in` — Each word group pops in with scale spring (TikTok style)
   - `karaoke` — Words highlight left-to-right as spoken
   - `highlight` — Active word gets a colored background box
   - `minimal` — Simple fade, white text, no background
   - `bold-center` — Large centered text, background blur behind it

**Technical spec:**
```typescript
interface WordTiming {
  word: string;
  start: number;  // seconds
  end: number;    // seconds
  confidence: number;
}

interface CaptionGroup {
  words: WordTiming[];
  startMs: number;
  endMs: number;
  text: string;    // joined words
}

interface CaptionStyle {
  preset: 'pop-in' | 'karaoke' | 'highlight' | 'minimal' | 'bold-center';
  fontSize: number;
  fontFamily: string;
  primaryColor: string;
  accentColor: string;     // highlight/active word color
  position: 'bottom' | 'center' | 'top';
  maxWordsPerGroup: number; // default: 4
}
```

**Grouping algorithm:**
- Group consecutive words into chunks of `maxWordsPerGroup`
- Break at natural pauses (gap > 300ms between words)
- Break at punctuation (commas, periods, question marks)
- Never split mid-phrase if detectable

---

### F2: Quality-Matched Encoding (P0)

**Problem:** Output quality is noticeably worse than input. CRF is hardcoded to 23 (medium), FFmpeg preset is hardcoded to "medium", audio bitrate is hardcoded to 192k.

**Solution:**

1. **Probe input video** — Use `ffprobe` to read source video's resolution, bitrate, codec, pixel format, frame rate
2. **Match output settings** — Set CRF, resolution, and bitrate to match or exceed source
3. **Configurable encoding preset** — Add `--encoding-speed` flag: `fast` (for preview), `balanced`, `slow` (for final output)
4. **Hardware acceleration** — Detect NVENC/QSV and use hardware encoding when available

**Technical spec:**
```typescript
interface VideoProbe {
  width: number;
  height: number;
  fps: number;
  duration: number;
  bitrate: number;        // kbps
  codec: string;          // h264, h265, vp9
  pixelFormat: string;    // yuv420p, yuv444p
  audioBitrate: number;   // kbps
  audioCodec: string;     // aac, opus
  audioSampleRate: number;
}

// New encoding presets
const ENCODING_PRESETS = {
  fast:     { preset: 'ultrafast', crf: 23 },  // preview
  balanced: { preset: 'medium',    crf: 18 },  // default
  slow:     { preset: 'slow',      crf: 15 },  // final output
  lossless: { preset: 'medium',    crf: 0 },   // archival
};
```

**Changes to FFmpeg pipeline:**
- Add `probeVideo(path)` function using `ffprobe -v quiet -print_format json`
- Use probed bitrate to set `-maxrate` and `-bufsize`
- Match source pixel format instead of always using yuv420p
- Make audio bitrate configurable (default: match source or 256k)

---

### F3: Multi-Format Support (P1)

**Problem:** Source video is one aspect ratio but output may need to be different (landscape source → vertical output for Shorts/Reels).

**Solution:**

1. **Format presets:**
   - `landscape` — 1920x1080 (16:9)
   - `vertical` — 1080x1920 (9:16)
   - `square` — 1080x1080 (1:1)
   - `custom` — any dimensions

2. **Smart cropping strategies:**
   - `fit` — Letterbox/pillarbox (no crop, add bars)
   - `fill` — Crop to fill (may lose edges)
   - `smart` — Face/subject detection to center crop on speaker

3. **CLI interface:**
   ```bash
   frameforge edit video.mp4 --format vertical --crop smart
   frameforge edit video.mp4 --format square --crop fill
   ```

---

### F4: Automated Overlay Timeline (P1)

**Problem:** Overlays are manually coded in HTML. A 50-second video had only 5 overlays — too sparse. Professional edits have visual elements appearing every 2-3 seconds.

**Solution:**

1. **Content analysis from transcript** — Detect:
   - Topic changes (new subject introduced)
   - Key phrases / emphasis words (numbers, proper nouns, superlatives)
   - Questions (hook moments)
   - Pauses > 1 second (natural break points)
   - Lists ("first, second, third")

2. **Auto-generated overlay types:**
   - `hook-card` — First 3-5 seconds, summarizes the video's value prop
   - `lower-third` — Name/title card, appears when speaker introduces themselves
   - `key-point` — Animated card for important concepts
   - `stat-callout` — Numbers/statistics get a prominent display
   - `list-items` — Staggered bullet points for enumerated items
   - `chapter-marker` — Topic transition indicator
   - `progress-bar` — Shows video progress (optional)
   - `cta-card` — Call to action at the end

3. **Overlay density rules:**
   - Minimum: 1 overlay element every 5 seconds
   - Maximum: 3 overlays visible simultaneously
   - Overlays should not overlap captions
   - Each overlay has enter animation (0.3s) + display (2-8s) + exit animation (0.3s)

---

### F5: Style Preset System (P1)

**Problem:** Each edit requires custom CSS. No reusable style system.

**Solution:**

Presets define colors, typography, element styles, and animation curves. Applied consistently across all overlays and captions.

```typescript
interface EditStyle {
  name: string;
  colors: {
    primary: string;      // brand color
    secondary: string;    // accent
    background: string;   // dark/light
    text: string;         // primary text
    textAlt: string;      // secondary text
  };
  typography: {
    heading: string;      // Google Font name
    body: string;
    captionFont: string;
  };
  elements: {
    borderWidth: number;
    borderRadius: number;
    shadowStyle: string;  // CSS box-shadow
    cornerStyle: 'rounded' | 'sharp' | 'pill';
  };
  animations: {
    enterCurve: string;   // CSS easing
    exitCurve: string;
    defaultDuration: number;
  };
}

// Built-in presets
const PRESETS = {
  'neo-brutalist': {
    colors: { primary: '#f97316', secondary: '#171e19', background: '#171e19', text: '#ffffff', textAlt: '#b7c6c2' },
    typography: { heading: 'Cabinet Grotesk', body: 'Satoshi', captionFont: 'Inter' },
    elements: { borderWidth: 2, borderRadius: 12, shadowStyle: '6px 6px 0 #000', cornerStyle: 'sharp' },
    animations: { enterCurve: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', exitCurve: 'ease-in', defaultDuration: 0.4 },
  },
  'clean-minimal': {
    colors: { primary: '#3b82f6', secondary: '#f1f5f9', background: '#ffffff', text: '#1e293b', textAlt: '#64748b' },
    typography: { heading: 'Inter', body: 'Inter', captionFont: 'Inter' },
    elements: { borderWidth: 0, borderRadius: 16, shadowStyle: '0 4px 24px rgba(0,0,0,0.08)', cornerStyle: 'rounded' },
    animations: { enterCurve: 'ease-out', exitCurve: 'ease-in', defaultDuration: 0.3 },
  },
  'corporate': {
    colors: { primary: '#0f172a', secondary: '#2563eb', background: '#ffffff', text: '#0f172a', textAlt: '#475569' },
    typography: { heading: 'Plus Jakarta Sans', body: 'Inter', captionFont: 'Inter' },
    elements: { borderWidth: 1, borderRadius: 8, shadowStyle: '0 2px 8px rgba(0,0,0,0.06)', cornerStyle: 'rounded' },
    animations: { enterCurve: 'ease-out', exitCurve: 'ease-in', defaultDuration: 0.25 },
  },
  'bold-dark': {
    colors: { primary: '#e94560', secondary: '#6366f1', background: '#0a0a0a', text: '#ffffff', textAlt: '#a1a1aa' },
    typography: { heading: 'Space Grotesk', body: 'Inter', captionFont: 'Space Grotesk' },
    elements: { borderWidth: 0, borderRadius: 20, shadowStyle: '0 0 40px rgba(233,69,96,0.2)', cornerStyle: 'pill' },
    animations: { enterCurve: 'cubic-bezier(0.34, 1.56, 0.64, 1)', exitCurve: 'ease-in', defaultDuration: 0.35 },
  },
};
```

---

### F6: `frameforge edit` CLI Command (P0)

**Problem:** No unified command for video editing. Current workflow requires manual HTML authoring + multiple CLI steps + FFmpeg re-muxing.

**Solution:** Single command that handles the full pipeline:

```bash
# Basic edit with auto-captions
frameforge edit video.mp4 --style neo-brutalist --output edited.mp4

# With options
frameforge edit video.mp4 \
  --style neo-brutalist \
  --caption-style pop-in \
  --format vertical \
  --quality slow \
  --brand-color "#f97316" \
  --output edited.mp4

# With custom SRT (skip transcription)
frameforge edit video.mp4 --srt captions.srt --style minimal --output edited.mp4

# Preview a single frame
frameforge edit video.mp4 --preview-frame 150 --output preview.png
```

**Pipeline steps (automated):**
1. Probe source video (ffprobe)
2. Extract audio → transcribe with WhisperX (word-level)
3. Analyze transcript → generate overlay timeline
4. Apply style preset → generate HTML overlay page
5. Render composite (video + overlays) with FrameForge
6. Re-mux original audio
7. Output final video

---

## Non-Goals (This Version)

- Video trimming/cutting/splicing (out of scope — FrameForge is an overlay engine, not a NLE)
- Color grading the source footage
- Multi-camera editing
- Background music addition (already supported via audio tracks in manifest)
- AI-generated b-roll or stock footage insertion

---

## Implementation Phases

### Phase A: Foundation (Week 1)
- [ ] F1: Word-level caption engine
- [ ] F2: Quality-matched encoding (ffprobe + CRF matching)
- [ ] F6: `frameforge edit` CLI command (basic pipeline)

### Phase B: Intelligence (Week 2)
- [ ] F4: Automated overlay timeline (content analysis)
- [ ] F5: Style preset system (3 presets minimum)

### Phase C: Polish (Week 3)
- [ ] F3: Multi-format support (landscape, vertical, square)
- [ ] 5 caption animation styles
- [ ] Documentation + examples

---

## Technical Dependencies

| Dependency | Purpose | Status |
|-----------|---------|--------|
| WhisperX | Word-level transcription | Available locally |
| ffprobe | Video probing | Ships with FFmpeg |
| Google Fonts API | Style preset fonts | CDN loaded |
| FrameForge Core | Rendering engine | Existing |

---

## Testing Plan

1. **Caption quality test** — Render same video with v1 captions vs v2 word-level captions. Side-by-side comparison.
2. **Quality preservation test** — Compare input video bitrate/quality to output. Should be visually identical.
3. **Format test** — Same source → landscape, vertical, square outputs. All look correct.
4. **Style test** — Same video with each preset. All look cohesive and professional.
5. **Real-world test** — Edit 3 different video types:
   - Talking head (like Enrique's clip)
   - Screen recording / tutorial
   - Product demo / B-roll heavy

---

## Competitive Benchmark

| Feature | FrameForge v2 | Remotion | Descript | CapCut |
|---------|--------------|----------|---------|--------|
| Word-level captions | Yes | Manual only | Yes | Yes |
| Auto-caption styling | 5 presets | Manual CSS | 3 presets | 10+ presets |
| Programmatic overlays | Full HTML/CSS/JS | React only | No | No |
| Quality preservation | Matched encoding | Fixed CRF | Good | Variable |
| CLI automation | Yes | Yes | No | No |
| AI-powered editing | Content analysis | No | Transcript-based | Template-based |
| Framework agnostic | Yes | React only | N/A | N/A |

---

*Version: 2.0 | FrameForge Video Editing Engine*
