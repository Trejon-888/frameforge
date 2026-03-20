# Session Handover

**Project:** FrameForge
**Current Status:** v0.2.0 published to npm — video editing engine, edit agent contract, 3 packages live

---

## Active Plans

| Plan | Status | Notes |
|------|--------|-------|
| [Video Editing Engine v2](plans/active/video-editing-engine-v2.md) | Complete | Cinema system + edit agent contract shipped |
| [Video Editing Test](plans/active/video-editing-test.md) | In Progress | agent-latest.mp4 rendered, review quality |
| [Social Media Launch](plans/active/social-media-launch.md) | On Hold | Waiting for testing week (~March 22) |

---

## What's Next

**#1: Social media launch posts (~March 22 — 2 days away)**
- Social Media Launch plan is on hold, ready to go
- v0.2.0 is live — this is the actual product, not a preview
- Content should lead with the video editing angle (most visually impressive)

**#2: kinetic-white-v4-clip01-v2.mp4 review**
- 24 overlays, 41 captions, 73.9s, 14MB, zero H.264 corruption
- This is the best demo asset for launch — use it for social posts
- Served at http://localhost:9000/kinetic-white-v4-clip01-v2.mp4

**#3: Post-launch iteration**
1. Smart cropping strategies (fit/fill/smart)
2. Template system
3. Render preview server (hot-reload)
4. Remote/cloud rendering (Docker image)

---

## Session Log

### Session 15 — 2026-03-20
- **Context:** Launch prep — npm v0.2.0 publish, README overhaul, architectural cleanup
- **Completed:**
  - **README rewrite:** Added full Phase 5 video editing pipeline, updated test count (169→238), complete CLI reference (7 commands), Edit Agent Contract section, updated comparison table with video editing row
  - **CHANGELOG.md:** Created v0.2.0 release notes
  - **Version bump:** All packages 0.1.1 → 0.2.0, core peer deps updated to ^0.2.0
  - **Removed @frameforge/mcp-server entirely:** ADR-008 — MCP is a pre-coding-agent pattern. skill.md + CLI is strictly better (7 commands vs 2 tools, full Phase 5, composable). Package deleted from monorepo.
  - **skill.md updated:** Added Approach 4 (video editing), Phase 5 CLI commands, Edit Agent Contract inline example
  - **overlay-starter.json:** 4-overlay beginner example (lower-third → hook-phrase → stat-reveal → cta-card)
  - **Published:** @frameforge/core@0.2.0, @frameforge/sdk@0.2.0, @frameforge/studio@0.2.0 — all live on npm
- **Stats:** 238 tests passing, 3 packages on npm, launch-ready
- **Next:** Social media launch posts (~March 22), review kinetic-white-v4-clip01-v2.mp4 for demo content

### Session 14 — 2026-03-18
- **Context:** H.264 bitstream corruption fix — v4 render (`kinetic-white-v4-clip01.mp4`) was corrupt after second "5" stat card
- **Completed:**
  - **Diagnosed root cause:** `--quality fast` → `ultrafast` preset → `Constrained Baseline` profile → only 4 I-frames in 73s (avg GOP = 18s). FFmpeg rate-control produces invalid NAL unit headers (`-1713181357`) with such long P-frame chains
  - **Fix:** Added `-g ${Math.round(fps)}` to `compositeVideo` in `packages/core/src/ffmpeg.ts` — forces I-frame every second regardless of preset. One-line fix, applies to ALL future renders
  - **Re-rendered:** `kinetic-white-v4-clip01-v2.mp4` — 73.9s, 14MB, zero H.264 errors, 75 I-frames/s (vs 4 in corrupt original)
  - **Source note:** Original `clip01-split-v7.mp4` was in an empty directory (gone). Used `clip-01-v18.mp4` trimmed to 73.83s as source (same clip01 content, correct audio)
- **Stats:** 24 overlays, 41 caption groups, 473s render time (balanced quality), 14MB, served at http://localhost:9000/kinetic-white-v4-clip01-v2.mp4
- **Next:** Review v4-v2 quality; if audio sync feels off vs overlay events, provide the correct portrait-crop source video for one final re-render

### Session 13 — 2026-03-18
- **Context:** v4 — 3x visual density, explicit UI components
- **Completed:**
  - Designed and wrote `overlay-kinetic-white-v4-clip01.json` — 24 overlays (17 v3 + 7 new)
  - **"THE OTHER HALF." word slam** (26300ms) — quick top-zone orange punch at pivot moment
  - **Pipeline Board UI panel** (32000ms, 7200ms) — dark floating Kanban panel: Leads→Active→Closed, orange accent, "DEAL CLOSED" badge; appears as speaker describes AI client acquisition
  - **CRM Calendar UI panel** (39200ms, 7000ms) — calendar grid with orange booked slots springing in; appears as speaker says "books appointments directly into your calendar"
  - **$4B stat card** (50100ms, 5200ms) — right-side stat card slides from right, counts 0→$4B; appears when "$4 billion in assets" is mentioned
  - **"20+ PARTNERS" top-zone stat** (54021ms, 4500ms) — large left-anchored stat with orange border-left, slides down
  - **Orbital Canvas animation** (57000ms, 16833ms) — 5 rotating ellipses with drifting dots fill white canvas during entire outro section
  - **CTA "FOLLOW @INFINITX" card** (62000ms, 10000ms) — centered full-width card with orange top border, "FOR AI SYSTEMS →"
  - Render: 73.8s, 3.5 Mb/s, 31MB, served at http://localhost:9000/kinetic-white-v4-clip01.mp4
- **Key decisions:** Pipeline board + Calendar panels use dark glassmorphism (rgba(6,8,14,0.96)) over white canvas — intentional contrast; ID-based selectors (document.getElementById('__ID__-...')) used since __ID__ ensures uniqueness post-replacement
- **Stats:** 24 overlays, ~281s render time (fast quality), 31MB
- **Next:** Review v4 quality; if good, v5 could add even more density or different clip

### Session 12 — 2026-03-18
- **Context:** White canvas motion graphics video — user wanted ENTIRE video on white background with motion graphics supporting narration, captions at bottom
- **Completed:**
  - **White background architecture solved:** Use source video as render-overlays input (quality reference), add `background:#fff` div as overlay[0] — Puppeteer captures it as opaque white, FFmpeg composites to cover footage. No separate white-bg.mp4 needed.
  - **Caption zone overlay:** Dark strip at bottom (0-55762ms) ensures caption readability on white; lower-third takes over at 55762ms
  - **kinetic-white-v1:** First attempt — revealed pixelation bug from white-bg.mp4 quality reference
  - **kinetic-white-v2 (12 overlays):** Correct white canvas approach. Full Kinetic Orange motion graphics: word-slam, stat-progress, chat-bubble, orange-strip, content-cards, platform-marquee, chat-thread, checklist, two-phase-system, lower-third
  - **kinetic-white-v3 (17 overlays):** 5 Canvas/SVG creative additions:
    - Dot grid pulse (Canvas, ambient full-video breathing orange matrix)
    - Opening sine waveform (Canvas, 3-layer audio visualizer, 0-2700ms)
    - SVG ring burst (SVG vector, 4 circles expanding via GSAP `attr:{r}`, 3200-8800ms)
    - Neural network (Canvas, 26 drifting nodes + orange data pulses, 41500-53857ms)
    - Closing sine waveform (Canvas, 4-layer bridge before lower third, 53700-55762ms)
  - Faststart applied (movflags faststart) for mobile Safari streaming
  - Served on local HTTP server port 9000
- **Key architectural decision:** White canvas = overlay[0] with `background:#fff` — source video input for quality metadata, white canvas visually covers it in Puppeteer capture
- **Kinetic Orange style spec:** `.agents/VISUAL-STYLES/kinetic-orange.md` — colors (#FF4D00/#000/#fff), Archivo Black + Space Mono, 2-3px borders, power4.out entries
- **Stats:** v3 = 17 overlays, 67 caption groups, 2755 kb/s, 281s render time
- **Next:** User wants v4 with even more visual density — explicit UI components, 3x the visuals

### Session 11 — 2026-03-17
- **Context:** Cinema renderer system, poster-modernist style, Edit Agent Contract architecture
- **Completed:**
  - Cinema renderer system: `cinema/shared.ts`, `base-browser.ts`, `base-standalone.ts`, 8 subclass renderers
  - CSS custom property token system — all renderers auto-adapt to any `EditStyle` via `--ff-*` vars
  - `poster-modernist` style preset (cream/cobalt/sharp corners/linear easing/no shadows)
  - `.agents/DESIGN-SYSTEM.md` — plain-text spec for AI agents, source of truth for styles
  - **CRITICAL ARCHITECTURE PIVOT:** Removed `@anthropic-ai/sdk`. FrameForge never calls AI.
  - `edit-agent.ts` — types only: `AgentOverlayDecision`, `AgentTranscript`, validation utils
  - `assembleAgentOverlayPage()` — assembles raw HTML/CSS/JS from any AI agent
  - `editVideoWithOverlays()` + `extractTranscript()` — new pipeline functions
  - CLI: `extract-transcript` + `render-overlays` commands; `.env` auto-loader
  - `.agents/EDIT-AGENT-CONTRACT.md` — full agent spec: 9 techniques, GSAP contract, examples, portrait/landscape rules
  - Rendered `agent-latest.mp4` with 6 creative overlays on clip-06
- **Key architectural decision:** FrameForge is a rendering engine. AI is external. Any model reads EDIT-AGENT-CONTRACT.md, writes overlay-decisions.json, FrameForge renders it. Claude/GPT/Gemini/local models all work.
- **Stats:** 238 tests pass, clean build
- **Next:** Review agent-latest.mp4, iterate on overlays if needed, build preview-overlays command

### Session 10 — 2026-03-17
- **Context:** Component system implementation — replace CSS-transition overlays with GSAP/Canvas/Spring components
- **Completed:**
  - Full component architecture: types, registry, assembler, init, gsap-inline
  - 8 renderers: kinetic-title, animated-lower-third, number-counter, glass-callout, particle-burst, progress-bar, cta-reveal, chapter-wipe
  - GSAP inlined from node_modules (no CDN race conditions)
  - Error boundaries on every component init + update
  - 39 component tests (all pass)
  - 30 keyword patterns across 7 domains in overlay-generator
  - Filler word filtering (um, uh, hmm, er, ah...) + confidence < 0.3 filter
  - Engagement-scored hook extraction, rhetorical question detection, dual-trigger transitions
  - BACKGROUND_OVERLAY_TYPES: progress-bar excluded from 3-slot limit
  - `frameforge preview-edit` CLI command — standalone HTML with play/pause/scrub controls
  - `--background` flag with base64 image embed + video file:// URL support
  - Rendered v5-components.mp4 with new system
- **Critical feedback from user:** Text-label overlays (glass-callout, number-counter) have no visual value — they repeat what the speaker says. User wants animated mini-UI illustrations that SHOW the concept (calendar for CRM, social feed for social media, etc.). Called out "50 plus" rendering as debug-looking "50 | PLUS".
- **Stats:** 220 tests (all pass), build clean
- **Next:** Semantic Illustration System (see What's Next)

### Session 9 — 2026-03-16
- **Context:** Critical fix — video editing output was choppy (frame-by-frame) with undersized overlays
- **Root Cause:** v1 editor embedded `<video>` element in browser HTML, then Puppeteer captured it frame-by-frame. Browser video seeking is not frame-accurate → choppy playback. Overlay/caption font sizes were too small for video.
- **Iteration 1 — Architecture Rewrite:**
  1. Source video NEVER touches the browser — FFmpeg handles it natively (smooth, frame-accurate)
  2. Only the overlay/caption layer is rendered in Puppeteer as transparent PNG frames (`omitBackground: true`)
  3. FFmpeg's `overlay` filter composites transparent frames on top of source video
  4. All overlay/caption sizes proportionally scaled to video resolution (base: 1080p)
- **Iteration 2 — Quality & Efficiency Audit (12 fixes):**
  - `--quality` flag was declared but never wired up — now maps to FFmpeg preset + CRF offsets
  - `Math.random()` in overlay placement → deterministic alternation
  - Gradient only worked for bottom captions → now adapts to all positions
  - WhisperX temp dir never cleaned up → added finally block
  - FFmpegPipeline silently dropped errors on early exit → tracks process state, rejects writes
  - Removed unused imports, redundant regex, verbose type patterns
  - `computeMatchedEncoding()` now accepts speed param (fast/balanced/slow/lossless)
  - 3 new tests for encoding speed presets
- **Stats:** 181 tests passing (+3 new), build succeeds, 0 regressions
- **Next:** Real-world test with actual video files, validate smooth playback

### Session 8 — 2026-03-16
- **Context:** Remotion competitive benchmark + video quality iterations + stress testing
- **Completed:**
  - Fetched actual Remotion prompts from remotion.dev/prompts
  - Built 10 benchmark videos across 7 technologies (Canvas, Three.js, GSAP, React, WebGL shaders, SVG, CSS)
  - Built 18s Demo Reel composition (5 scenes, 4 transitions)
  - Video quality pushed v1(4/10) → v2(6/10) → v3(7/10) → v4(8.5/10)
  - Fixed critical bugs: workspace:* in npm, Python SDK Windows subprocess
  - Stress tested clean npm install, Python e2e, 15/15 edge cases pass
  - Republished all packages at v0.1.1
- **Stats:** 169 tests, 10 benchmark videos, 1 demo reel, 2 critical bugs fixed
- **Known issue:** Background override breaks light-themed pages (needs proper fix in renderer)
- **Next:** Real usage testing, fix bg override, remaining stress tests, then launch ~March 22

### Session 7 — 2026-03-16
- **Context:** Product stress testing — find and fix bugs before real users hit them
- **Completed:**
  - **BUG FIX (CRITICAL):** `workspace:*` in published packages broke npm install — republished all at 0.1.1
  - **BUG FIX:** Python SDK `subprocess.run(["npx"])` fails on Windows — added `shell=True`
  - **BUG FIX:** `npx frameforge` resolved to wrong package — use `@frameforge/core` scoped name
  - Verified clean npm install → render works in 10 seconds
  - Verified SDK render from npm (3-line script → MP4)
  - Verified Python SDK full end-to-end (Python → HTML → Node CLI → MP4)
  - Tested edge cases: 0.5s video, odd dims, 1fps, 60fps, empty page, JS errors, CSS-only, Canvas 2D, SVG
  - Tested CLI error handling: missing duration, missing file, invalid manifest — all clear
  - 15/15 test scenarios passing
- **Stats:** 169 tests, 2 critical bugs fixed, all packages republished at 0.1.1
- **Next:** Continue stress testing (composition, subtitles, animation libs), then remaining Remotion benchmarks

### Session 6 — 2026-03-15
- **Context:** Social media videos v1→v4 + Studio Phase 2 + competitive benchmark plan
- **Completed:** 8 video iterations (v1 4/10 → v4 8/10), Studio keyboard overlay + export presets + console, data viz + headline videos, competitive benchmark plan
- **Next:** Product stress testing, remaining Remotion benchmarks

### Session 5 — 2026-03-15
- **Context:** Phase 4 Advanced Features — composition, transitions, subtitles, GPU
- **Completed:**
  - Multi-scene composition engine with Zod schema and FFmpeg xfade joining
  - `frameforge compose` CLI command
  - 23 FFmpeg xfade transition types
  - SRT + VTT subtitle parsers with HTML overlay generator
  - GPU acceleration flag for Chrome
  - Multi-scene example: 3 scenes with fadeblack + wipeleft transitions (8.7s, 261 frames)
  - 28 new tests (composition + subtitles)
- **Stats:** 169 tests passing, 10 test files, 4 packages, 6 rendered examples
- **ALL 4 PHASES: DONE.** The entire PRD is implemented.
- **Next:** Polish, remaining elements, templates, npm publish

### Session 4 — 2026-03-15
- **Context:** Phase 3 Agent Skills — skill file, MCP server, preview command, example prompts
- **Completed:**
  - Created comprehensive Agent Skill (skill.md) with 3 authoring paths, API reference, patterns
  - Built MCP Server (@frameforge/mcp-server) with render + validate tools
  - Added `frameforge preview` CLI command for single-frame PNG capture
  - Created example prompts library (8 curated prompts with expected outputs)
  - Updated CLAUDE.md architecture (MCP server, preview command)
  - Updated PRD Phase 3 feature statuses
- **Stats:** 141 tests passing, 8 test files, 3 packages building, 5 rendered examples
- **Phases 1–3: DONE.** Core renderer, SDKs, and agent integration all complete.
- **Next:** Phase 4 advanced features (multi-scene, transitions, cloud rendering)

### Session 3 — 2026-03-15
- **Context:** Phase 2 SDKs — animation primitives, Image element, Python SDK, tests
- **Completed:**
  - Animation primitives: fadeIn, fadeOut, slideIn, slideOut, scaleIn, scaleOut, rotateIn, rotateTo
  - stagger() utility for coordinated multi-element animations
  - Image element for TS + Python SDKs with codegen support
  - Scale/rotation transform handling in codegen
  - SDK-TS test suite: 35 tests (animations, elements, codegen)
  - Animation primitives example: renders 5s, 150 frames MP4
  - Python SDK Image element + codegen validation
  - Updated PRD Phase 2 feature statuses
- **Stats:** 141 tests passing (106 core + 35 SDK), 8 test files, 5 validated examples
- **Next:** Phase 3 agent skills, remaining Phase 2 elements

### Session 2 — 2026-03-15
- **Context:** Complete remaining Phase 1 work — examples, media patching, animation events, timeouts
- **Completed:**
  - Added video/audio element time patching (HTMLMediaElement.play intercepted, seek on advanceFrame)
  - Added animation event emission (animationstart/animationend dispatched at correct virtual time)
  - Added per-frame timeout enforcement with descriptive error messages
  - Created CSS animation example (pure @keyframes, 6s, 180 frames) — **renders correctly**
  - Created GSAP example (GSAP 3.12 from CDN, timeline + stagger, 5s, 150 frames) — **renders correctly**
  - Created SDK-TS integration example (Scene → codegen → render → MP4, 4s, 120 frames) — **renders correctly**
  - Added 5 new tests for media patching and animation events
  - Added tsx as workspace dev dependency for running TS examples
  - Moved Phase 1 plan to completed
- **Stats:** 106 tests passing, 0 failures, 5 test files, 4 validated examples
- **Phase 1 MVP: DONE.** All P0 and P1 features implemented and tested.
- **Next:** Phase 2 SDKs (Python SDK, built-in elements, animation primitives)

### Session 1 — 2026-03-15
- **Context:** First development session — bring scaffolding to working MVP
- **Completed:**
  - Fixed `__originalRAF` not exposed on window (time-virtualization.ts)
  - Integrated async frame readiness reset into capture loop (frame-capture.ts)
  - Added page error capture (pageerror + console.error) to frame-capture
  - Added entry file validation with agent-friendly error messages
  - Fixed output path resolution (now resolves relative to manifest, not CWD)
  - Fixed CLI default output interfering with manifest output path
  - Created vitest config for core package
  - Wrote 101 tests across 5 test files
  - **First successful render:** hello-world → 1920x1080@30fps, 150 frames, 5s, H.264 MP4
  - Both render paths validated: scene manifest JSON and raw HTML with --duration
- **Stats:** 101 tests passing, 0 failures, 5 test files
- **Next:** Test with GSAP/Three.js pages, media playback patching, SDK integration

### Session 0 — 2026-03-15
- **Context:** Initial project setup from ix-claude-code-starter-kit template
- **Completed:**
  - Created GitHub repo (Trejon-888/frameforge)
  - Wrote PRD with all 4 phases, set up pnpm monorepo
  - Scaffolded all packages (core, sdk-ts, sdk-python)
  - Created hello-world example
  - Initial commit pushed to GitHub
- **Next:** Install deps, build, test time virtualization, run first render

---

## Last Alignment Check

- **Date:** 2026-03-15
- **Score:** 100% (Session 5)
- **Issues Found:** 0

---

## Launch Timeline

- **2026-03-15 (Sunday):** All 4 PRD phases built, npm published, branding drafted
- **2026-03-15 → 2026-03-22:** Testing week — use the product daily, find rough edges, iterate
- **~2026-03-22 (target):** Public launch if product feels solid after a week of real usage
- **Branding:** Name, colors, and target audience are all open for revision based on who the ideal customer turns out to be

## npm Registry

- **Org:** @frameforge (npmjs.com/org/frameforge)
- **User:** enriquemarq
- **Auth:** Granular Access Token (name: "Frameforge", expires June 13, 2026, 2FA bypass enabled)
- **Published packages:** @frameforge/core@0.1.0, @frameforge/sdk@0.1.0, @frameforge/studio@0.1.0, @frameforge/mcp-server@0.1.0
- **Publish order:** core → sdk-ts → studio → mcp-server (core first, others depend on it)
