# Phase 1 — Core Renderer MVP

**Status:** In Progress
**Priority:** P0
**Started:** 2026-03-15

---

## Objective

Deliver a working `frameforge render` CLI that takes any HTML page and produces a deterministic MP4 video via headless Chrome + FFmpeg.

---

## Features & Status

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| `frameforge render` CLI | P0 | Done | Full Commander.js CLI with progress, error hints |
| Time Virtualization Script | P0 | Done | Patches Date.now, rAF, setTimeout/setInterval, CSS animations |
| Puppeteer Frame Capture | P0 | Done | CDP screenshots, error capture, rAF yield |
| FFmpeg Pipeline | P0 | Done | Piped stdin encoding, audio mixing, backpressure |
| Scene Manifest Parser | P0 | Done | Zod schemas, file + object parsing, defaults |
| `__frameforge` Page API | P0 | Done | Frame readiness, metadata, progress |
| Tests (time virtualization) | P0 | Done | 35 tests covering all patched APIs |
| Tests (manifest, capture, ffmpeg, renderer) | P0 | Done | 66 additional tests |
| End-to-end render validation | P0 | Done | hello-world renders 1920x1080@30fps, 150 frames, 5s |
| Output path resolution | P0 | Done | Resolves relative to manifest location |
| Error handling | P1 | Done | Entry validation, page error capture, agent-friendly hints |
| Audio mixing | P1 | Scaffolded | Code complete, needs audio test files to validate |

---

## Remaining Work

- [ ] Test with GSAP, Three.js, and CSS animation examples
- [ ] Video/audio element time patching (media playback)
- [ ] Animation event emission (animationstart, animationend)
- [ ] Per-frame timeout enforcement
- [ ] SDK-TS integration test (Scene → render → MP4)

---

## Risks

- Chrome headless rendering differences on Linux vs Windows vs macOS
- Large canvas dimensions may hit memory limits
- Complex pages with heavy async loading may need longer networkidle timeouts
