# Phase 4 — Advanced Features

**Status:** Completed (core features)
**Priority:** P1-P3
**Started:** 2026-03-15
**Completed:** 2026-03-15

---

## What Was Delivered

### Multi-Scene Composition
- `frameforge compose` CLI command
- Composition manifest schema (Zod-validated)
- Renders each scene to temp MP4, joins with FFmpeg xfade
- Supports 2+ scenes with per-scene transitions

### Transition Library (23 types)
fade, fadeblack, fadewhite, dissolve, wipeleft, wiperight, wipeup, wipedown,
slideleft, slideright, slideup, slidedown, circlecrop, rectcrop, circleopen,
circleclose, radial, smoothleft, smoothright, smoothup, smoothdown, pixelize, zoomin

### Subtitle/Caption Engine
- SRT parser (standard SubRip format)
- VTT parser (WebVTT format, both HH:MM:SS.mmm and MM:SS.mmm)
- HTML overlay generator synced to `__frameforge.currentTimeMs`
- Configurable styling (fontSize, color, background, position)

### GPU Acceleration
- `--gpu` flag on frame-capture for Chrome hardware acceleration
- Useful for Three.js, WebGL, and heavy CSS 3D transforms

### Validated Example
- multi-scene: 3 scenes (intro → features → outro) with fadeblack + wipeleft transitions
- Output: 8.7s, 261 frames, 1920x1080 H.264

## Test Coverage
- 28 new tests (composition: 12, subtitles: 16)
- Total project: 169 tests across 10 files
