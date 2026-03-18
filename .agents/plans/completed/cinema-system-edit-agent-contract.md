# Cinema System + Edit Agent Contract

**Status:** Completed
**Date:** 2026-03-17
**Session:** 11

## What Was Built

### Cinema Renderer System
Abstract base class architecture for all 8 concept illustration renderers. Each renderer is 50-80 lines (content only) vs 300+ lines previously (infrastructure repeated). Shared generators in `cinema/shared.ts` handle browser chrome, cursor, headline, entry/exit animations, and CSS custom property tokens.

### Poster Modernist Style
Full `EditStyle` preset: cream #E3E2DE, cobalt #1351AA, zero border-radius, no shadows, linear easing. All existing renderers automatically adapt via CSS custom properties (`--ff-*`).

### DESIGN-SYSTEM.md
Plain-text agent-readable spec covering both style presets with all color tokens, typography rules, animation specs, layout diagrams, trigger keyword guide, and quality gate checklist.

### Edit Agent Contract — Model-Agnostic Architecture
The critical architectural decision: FrameForge never calls AI APIs. The edit agent is external. Any model reads `EDIT-AGENT-CONTRACT.md` and produces `overlay-decisions.json`.

New CLI commands:
- `frameforge extract-transcript video.mp4 -o transcript.json`
- `frameforge render-overlays video.mp4 --overlays decisions.json -o output.mp4`

New types: `AgentOverlayDecision`, `AgentTranscript`
New functions: `buildAgentTranscript()`, `validateOverlayDecisions()`, `editVideoWithOverlays()`, `extractTranscript()`, `assembleAgentOverlayPage()`

Removed: `@anthropic-ai/sdk` dependency (zero AI coupling in core)

## Results

- Build: clean (220KB CLI, 192KB index)
- Tests: 238 passing
- Rendered `agent-latest.mp4` with 6 creative overlays on clip-06
- EDIT-AGENT-CONTRACT.md: complete spec with 9 techniques, examples, validation rules
