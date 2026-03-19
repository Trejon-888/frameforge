# Changelog

All notable changes to FrameForge are documented here.

## [0.2.0] — 2026-03-19

### Added

#### Video Editing Engine (`frameforge edit`)
- **`frameforge edit`** — Full pipeline command: source footage → edited video with word-level captions + auto-generated motion graphics overlays. Single command replaces manual video editing workflow.
- **`frameforge extract-transcript`** — Extract enriched transcript from source video with word-level timing, pause detection, energy curve analysis, stat extraction, narrative segmentation, and suggested entry points.
- **`frameforge render-overlays`** — Render AI agent overlay decisions onto source video. Takes source video + overlay-decisions.json + optional SRT captions → final edited MP4.
- **`frameforge preview-overlays`** — Preview overlay decisions before full render. Captures one frame per overlay at its midpoint (~30s vs 8-12min full render). Generates a self-contained HTML gallery for review.

#### Edit Agent Contract (`EDIT-AGENT-CONTRACT.md`)
- Model-agnostic editing framework — any AI (Claude, GPT, Gemini, local models) reads the contract and produces overlay decisions as plain JSON.
- 5-phase editing loop: PERCEIVE → ORIENT → COMPOSE → PREVIEW → RENDER.
- Zone system for portrait (9:16) and landscape (16:9) with reserved caption and speaker zones.
- 5 Style Kits: kinetic-orange, minimal-authority, bold-dark-social, clean-professional, cosmic-particles.
- 4 Editorial Templates: authority-builder, viral-hook, educational-breakdown, social-proof-stack.
- 12 overlay technique vocabulary entries with usage guidance and GSAP examples.
- Rhythm principles: spacing rules, breathing room, pause alignment, entry timing, exit rules, energy matching.
- Rule of Restraint: design philosophy for edits that feel directed vs template-filled.

#### Cinema Renderer System
- Abstract base classes: `CinemaBrowserRenderer`, `CinemaStandaloneRenderer`.
- 8 renderer subclasses: kinetic-title, animated-lower-third, number-counter, glass-callout, particle-burst, progress-bar, cta-reveal, chapter-wipe.
- CSS custom property token system — all renderers auto-adapt to any `EditStyle` via `--ff-*` variables.
- `poster-modernist` style preset (cream/cobalt/sharp corners/linear easing/no shadows).
- `DESIGN-SYSTEM.md` — plain-text agent-readable spec, source of truth for AI agents generating overlays.

#### Word-Level Captions
- WhisperX integration for word-level timing extraction.
- 2-4 word grouping with active word highlighting.
- 5 animation presets: pop-in, karaoke, highlight, minimal, bold-center.
- Resolution-scaled sizing (all sizes proportional to video resolution, base reference: 1080p).

#### Quality-Matched Encoding
- `ffprobe` integration extracts source video bitrate, codec, resolution, rotation.
- Output CRF and bitrate matched to source — visually identical output.
- 4 quality presets: fast, balanced, slow, lossless.
- I-frame forced every second (fixes H.264 GOP corruption with fast preset).

#### Multi-Format Output
- `--format landscape|vertical|square|source` with FFmpeg scale+pad.
- Automatic aspect ratio handling.

#### Style Preset System
- 5 presets: neo-brutalist, clean-minimal, corporate, bold-dark, poster-modernist.
- All presets defined as CSS custom property token sets.

---

## [0.1.1] — 2026-03-16

### Fixed
- `workspace:*` dependency in published packages broke clean npm installs — all packages republished with resolved versions.
- Python SDK `subprocess.run(["npx"])` failed on Windows — added `shell=True`.

---

## [0.1.0] — 2026-03-15

### Added
- **Core Renderer** — Deterministic HTML → MP4 pipeline via headless Chrome + FFmpeg.
- **Time Virtualization** — Patches `Date.now`, `performance.now`, `requestAnimationFrame`, `setTimeout`, `setInterval`, CSS Animations, `<video>`/`<audio>` — any animation library works.
- **`frameforge render`** — CLI command for HTML files and scene manifests.
- **`frameforge preview`** — Single frame capture to PNG.
- **`frameforge compose`** — Multi-scene composition with 23 FFmpeg xfade transitions.
- **Scene Manifest** — Zod-validated JSON schema for scene definition.
- **TypeScript SDK** (`@frameforge/sdk`) — `Scene`, `Text`, `Shape`, `Image` elements with animation primitives.
- **Python SDK** (`frameforge` on PyPI) — Same API surface, generates HTML + calls Node renderer.
- **MCP Server** (`@frameforge/mcp-server`) — Model Context Protocol tools for `render` and `validate`.
- **Studio** (`@frameforge/studio`) — Visual timeline preview with hot-reload.
- **Subtitle engine** — SRT/VTT parser with HTML overlay synced to virtual time.
- **GPU acceleration** — `--gpu` flag for Chrome hardware acceleration.
- **106 tests** for core rendering, time virtualization, and SDK.
