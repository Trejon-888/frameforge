# FrameForge — Product Requirements

**Version:** 0.1.0-alpha
**Last Updated:** 2026-03-15

---

## Vision

FrameForge is the missing bridge between "animated webpage" and "rendered video." It's a framework-agnostic rendering pipeline that takes any animated HTML page (React, vanilla, GSAP, Three.js, Svelte, p5.js, whatever), deterministically captures every frame via headless Chrome, and stitches them into a production-quality MP4 via FFmpeg. Ships with Agent Skills so Claude Code (or any coding agent) can generate videos end-to-end.

**Tagline:** _"If a browser can render it, FrameForge can record it."_

---

## User Roles

| Role | Description | Key Actions |
|------|-------------|-------------|
| Developer | Web developers creating programmatic video | Write animations in HTML/CSS/JS, use TS/Python SDK, run CLI |
| AI Agent | Coding agents (Claude Code, etc.) with FrameForge skill | Generate animations from prompts, render via CLI/SDK |
| Content Creator | Non-technical users via agent-assisted workflow | Describe desired video, agent handles implementation |

---

## Features

### Phase 1 — Core Renderer (MVP)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| `frameforge render` CLI | Takes HTML file + options → MP4 | P0 | Implemented |
| Time Virtualization Script | Patches Date.now, rAF, setTimeout, CSS animations | P0 | Implemented |
| Puppeteer Frame Capture | Headless Chrome screenshot loop with CDP | P0 | Implemented |
| FFmpeg Pipeline | Frame → pipe → encode → MP4 (no intermediate files) | P0 | Implemented |
| Scene Manifest Parser | Read & validate scene.json via Zod | P0 | Implemented |
| `__frameforge` Page API | Global API for signaling frame readiness | P0 | Implemented |
| Audio mixing | Overlay audio tracks onto final video | P1 | Scaffolded |
| Error handling | Timeouts, crash recovery, agent-friendly messages | P1 | Implemented |

### Phase 2 — SDKs (Python + TypeScript)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| TypeScript SDK | `@frameforge/sdk` — Define scenes, elements, animations | P0 | Implemented |
| Python SDK | `frameforge` PyPI — Same API surface in Python | P0 | Implemented |
| Scene Graph Model | Scene → Layer → Element → Animation → Keyframe | P0 | Implemented |
| Built-in Elements | Text, Shape, Image (Video, Code Block, Chart planned) | P1 | Partial |
| Animation Primitives | fadeIn/Out, slideIn/Out, scaleIn/Out, rotateIn/To, stagger | P1 | Implemented |
| Template System | Pre-built scene templates | P2 | Planned |

### Phase 3 — Agent Skills & Integration

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Claude Code Agent Skill | Skill file teaching Claude how to use FrameForge | P0 | Implemented |
| MCP Server | Model Context Protocol server for FrameForge | P1 | Implemented |
| Example prompts library | Curated prompts for good video output | P1 | Implemented |
| Agent-friendly errors | Errors an LLM can parse and fix | P0 | Implemented |
| Render preview server | Hot-reload preview before final render | P2 | Planned |

### Phase 4 — Advanced Features (Nice to Have)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Multi-scene composition | Stitch multiple HTML pages as scenes | P1 | Implemented |
| Transition library | 23 FFmpeg xfade transitions (fade, wipe, slide, dissolve, etc.) | P2 | Implemented |
| Live footage overlay | Composite via `<video>` element + media time patching | P2 | Implemented |
| Subtitle/caption engine | SRT/VTT parser → HTML overlay synced to virtual time | P2 | Implemented |
| Remote/cloud rendering | Render on Lambda/Cloud Run | P3 | Planned |
| GPU acceleration | Chrome GPU flag for complex 3D scenes | P3 | Implemented |

---

## Implementation Status

| Feature | Plan | Date Completed | Notes |
|---------|------|---------------|-------|
| Project scaffolding | — | 2026-03-15 | Initial repo setup |
| `frameforge render` CLI | Phase 1 MVP | 2026-03-15 | Commander.js CLI with progress + error hints |
| Time Virtualization Script | Phase 1 MVP | 2026-03-15 | Patches Date.now, rAF, setTimeout, CSS animations |
| Puppeteer Frame Capture | Phase 1 MVP | 2026-03-15 | CDP screenshots, error capture, rAF yield |
| FFmpeg Pipeline | Phase 1 MVP | 2026-03-15 | Piped stdin, audio mixing, backpressure |
| Scene Manifest Parser | Phase 1 MVP | 2026-03-15 | Zod schemas, defaults, file + object input |
| `__frameforge` Page API | Phase 1 MVP | 2026-03-15 | Readiness signaling, metadata, progress |
| Core test suite | Phase 1 MVP | 2026-03-15 | 106 tests across 5 files |
| Media time patching | Phase 1 MVP | 2026-03-15 | HTMLMediaElement.play intercepted, seek on advanceFrame |
| Animation events | Phase 1 MVP | 2026-03-15 | animationstart/animationend at virtual time |
| Per-frame timeout | Phase 1 MVP | 2026-03-15 | Configurable timeout with descriptive errors |
| CSS animation example | Phase 1 MVP | 2026-03-15 | Pure CSS @keyframes rendered deterministically |
| GSAP example | Phase 1 MVP | 2026-03-15 | GSAP 3.12 timeline with stagger from CDN |
| SDK-TS integration | Phase 1 MVP | 2026-03-15 | Scene → codegen → render → MP4 end-to-end |
| Animation primitives (TS) | Phase 2 SDKs | 2026-03-15 | fadeIn/Out, slideIn/Out, scaleIn/Out, rotateIn/To, stagger |
| Image element | Phase 2 SDKs | 2026-03-15 | TS + Python SDKs, codegen support |
| Python SDK codegen | Phase 2 SDKs | 2026-03-15 | Scene, Text, Shape, Image, Animate, easing — generates HTML |
| SDK-TS test suite | Phase 2 SDKs | 2026-03-15 | 35 tests (elements, animations, codegen) |
| Claude Code Agent Skill | Phase 3 Agent | 2026-03-15 | skill.md — comprehensive video generation guide |
| MCP Server | Phase 3 Agent | 2026-03-15 | @frameforge/mcp-server — render + validate tools |
| Example prompts library | Phase 3 Agent | 2026-03-15 | 8 curated prompts with expected outputs |
| Preview CLI command | Phase 3 Agent | 2026-03-15 | frameforge preview — single frame PNG capture |
| Multi-scene composition | Phase 4 Advanced | 2026-03-15 | frameforge compose — stitch scenes with transitions |
| Transition library | Phase 4 Advanced | 2026-03-15 | 23 FFmpeg xfade types (fade, dissolve, wipe, slide, etc.) |
| Subtitle engine | Phase 4 Advanced | 2026-03-15 | SRT/VTT parser + HTML overlay synced to virtual time |
| GPU acceleration | Phase 4 Advanced | 2026-03-15 | --gpu flag for Chrome hardware acceleration |

---

## Success Criteria

### MVP (Phase 1)
- [ ] `frameforge render page.html` produces a valid MP4
- [ ] Time virtualization handles: rAF, Date.now, setTimeout, CSS animations
- [ ] Works with vanilla HTML/CSS, GSAP, and Three.js test pages
- [ ] 1080p @ 30fps render completes without dropped/duplicate frames
- [ ] CLI has clear error messages

### Phase 2
- [ ] Python SDK can define and render a scene end-to-end
- [ ] TypeScript SDK can define and render a scene end-to-end
- [ ] Both SDKs produce identical output for the same scene definition
- [ ] Audio mixing works (voiceover + background music)

### Phase 3
- [ ] Claude Code with FrameForge skill can generate a video from a text prompt
- [ ] Agent-generated videos are deterministic
- [ ] At least 5 example prompts that consistently produce good output

---

## Out of Scope (for now)

- Mobile app / native GUI
- Real-time streaming output
- Non-Chrome browser support (Firefox, Safari)
- Commercial licensing (project is MIT)

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Core language | TypeScript | Puppeteer is Node-native; aligns with web ecosystem |
| Browser automation | Puppeteer (CDP) | Most mature for screenshot capture, headless shell |
| Video encoding | FFmpeg (spawned, piped stdin) | Universal, no intermediate files, max codec support |
| Time virtualization | Custom injection script | Must patch at every level to be framework-agnostic |
| Python SDK approach | Generates HTML + manifest, calls Node renderer | Python writes scenes; rendering stays in Node/Chrome |
| Package manager | pnpm (monorepo) | Best for multi-package repos; fast, deterministic |
| Schema validation | Zod (TS) / Pydantic (Python) | Type-safe manifest validation in both languages |
| Licensing | MIT | Maximize adoption, no usage restrictions |

---

## Open Questions

1. **Cloud rendering?** Should Phase 1 include a Docker image, or defer to Phase 4?
2. **Remotion interop?** Should we support rendering Remotion bundles (they're React apps in a browser)?
3. **Multi-page composition UX?** Sequential manifest? Scene graph?
4. **Asset pipeline?** How to handle fonts, images, and other assets referenced by HTML pages?
