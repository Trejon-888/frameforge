# Project Memory

**Institutional knowledge that persists across sessions.**

---

## Architecture Decisions

| # | Decision | Date | Rationale | Supersedes |
|---|----------|------|-----------|------------|
| ADR-001 | pnpm monorepo with packages/core, sdk-ts, sdk-python | 2026-03-15 | Clean separation: core owns rendering, SDKs are pure codegen producing HTML + manifests | — |
| ADR-002 | Time virtualization via injected script (not CDP time domain) | 2026-03-15 | CDP's Emulation.setVirtualTimePolicy doesn't patch CSS animations or Web Animations API; injection gives full control | — |
| ADR-003 | Frames piped to FFmpeg stdin (no temp PNGs) | 2026-03-15 | Avoids disk I/O bottleneck, no cleanup needed, works on systems with limited storage | — |
| ADR-004 | Python SDK calls Node renderer via subprocess | 2026-03-15 | Python generates HTML + manifest, rendering stays in Node/Puppeteer where it's native; avoids maintaining two renderers | — |
| ADR-005 | tsup for building, vitest for testing | 2026-03-15 | Fast, modern, good ESM support; matches the project's Node 20+ target | — |
| ADR-006 | Edit agent is model-agnostic — kino never calls AI APIs | 2026-03-17 | kino philosophy: framework-agnostic rendering. Embedding Anthropic SDK contradicts this. Agent reads EDIT-AGENT-CONTRACT.md, writes overlay-decisions.json, kino renders it. Any model works. | Supersedes: any design where kino calls an AI API internally |
| ADR-007 | Always pass `-g fps` to libx264 in compositeVideo | 2026-03-18 | `ultrafast` preset disables scene-change detection, producing long GOP chains that corrupt bitstreams. Explicit keyframe interval every second ensures valid bitstream regardless of preset. Applies to all quality levels including `fast`. | — |
| ADR-008 | No MCP server — coding agents + CLI replace MCP entirely | 2026-03-20 | MCP exists to give AI structured tool access. A coding agent with skill.md + CLI is strictly better: 7 commands vs 2 tools, full Phase 5 support, composable, agent-friendly errors. MCP is a pre-coding-agent pattern. `@frameforge/mcp-server (legacy)` removed from monorepo. | Supersedes: @frameforge/mcp-server (legacy) (Phase 3) |
| ADR-009 | Captions rendered via ASS/libass in FFmpeg, not Puppeteer | 2026-04-01 | ASS is the same subtitle engine used by Premiere Pro, DaVinci Resolve, VLC. 100x faster than rendering text in a browser and taking screenshots. No quality loss — libass renders at output resolution with subpixel antialiasing. | Supersedes: Puppeteer-based caption rendering for text-only edits |
| ADR-010 | Keyframe engine is renderer-agnostic | 2026-04-01 | Outputs resolved property values (numbers). Any renderer — Canvas 2D, DOM/CSS, SVG, FFmpeg expressions — can consume them. No GSAP lock-in. The same engine powers all animation types. | Supersedes: GSAP-only animation contract |
| ADR-011 | Scene composition v2.0 format replaces overlay-decisions.json | 2026-04-01 | Richer format: scenes with timing + animated elements + sound cues + captions. Open element types (not a fixed enum). AI agents generate this, kino renders it. | Supersedes: overlay-decisions.json for new content |
| ADR-012 | Old component system kept temporarily for backward compat | 2026-04-01 | 16 rigid components (hook-card, lower-third, etc.) still used by `kino edit` Puppeteer path. Keyframe engine + scene v2.0 is the replacement. Remove once scene compiler is built and proven. | — |

---

## Problems Solved

### General

| Problem | Root Cause | Solution | Session |
|---------|-----------|----------|---------|
| H.264 bitstream corruption ("Invalid NAL unit size -1713181357") | `ultrafast` preset disables scene detection → only 4 I-frames in 73s → long GOP P-frame chains produce invalid NAL headers. Confirmed: 4 I-frames (corrupt) vs 75 I-frames (clean) | Added `-g ${Math.round(fps)}` to `compositeVideo` in `ffmpeg.ts` — forces I-frame every second regardless of preset | Session 14 |
| `__originalRAF` undefined in frame-capture | Variable scoped inside time-virtualization IIFE, not exposed on window | Added `window.__originalRAF = _originalRAF` at end of IIFE | Session 1 |
| Output path resolves to CWD not manifest dir | `resolve(options.output)` uses CWD; CLI always set default `-o` value | Remove CLI default for `-o`; resolve output relative to `dirname(manifestPath)` in renderer | Session 1 |
| npm install fails with EUNSUPPORTEDPROTOCOL | `workspace:*` in published package.json — pnpm workspace ref doesn't work on npm | Changed to `^0.1.0`, republished all packages at 0.1.1 | Session 7 |
| Python SDK render fails on Windows | `subprocess.run(["npx"])` — npx not found without `shell=True` on Windows | Added `shell=True` on Windows + `shutil.which("npx")` | Session 7 |
| `npx frameforge` resolves to wrong package | Unscoped `frameforge` on npm is a different project (needs GEMINI_API_KEY) — now resolved by rebrand to `npx kino` | Use `@kinohq/core` as scoped name | Session 7 / Session 17 |
| Background override breaks light-themed pages | Renderer sets `document.body.style.background` which overrides page CSS | Use `!important` in page CSS, or check if bg is already set before override | Session 6 |

---

## Breaking Changes

| Date | Change | What Breaks | Migration Path |
|------|--------|-------------|----------------|
| — | — | — | — |

---

## Gotchas

### Puppeteer / CDP

- **evaluateOnNewDocument order matters:** Time virtualization script MUST be injected before the page API script. Both must inject before any page scripts run.
- **networkidle0 timeout:** Complex pages with many assets may need longer than the default 30s timeout.

### FFmpeg

- **Even dimensions required:** H.264 requires width/height to be even numbers. The ffmpeg pipeline includes a `scale=trunc(iw/2)*2:trunc(ih/2)*2` filter as a safety net.
- **PATH availability:** FFmpeg must be installed and in PATH. Error messages should guide the user to install it.
- **`ultrafast` preset causes H.264 bitstream corruption on long videos:** `ultrafast` disables scene-change detection, producing only 4–5 I-frames in a 73s video (avg GOP = 18s). FFmpeg rate-control with such long P-frame chains produces invalid NAL unit headers (`-1713181357`). Fix: always pass `-g fps` (I-frame every second) in `compositeVideo`. Applied in Session 14. Never use `ultrafast` without `-g` on videos > 30s.
- **`ultrafast` forces Constrained Baseline profile:** Disables CABAC, 8×8 DCT, B-frames. This halves compression efficiency — a 73s video encoded at CRF 23 / ultrafast was 33MB vs 14MB at CRF 19 / medium. Use `balanced` (medium preset) for production renders.

### Time Virtualization

- **CSS `animation: ... infinite` is incompatible with kino:** CSS keyframe animations with `infinite` iteration count conflict with kino's `document.timeline` virtualization, causing `resetReady` timeouts at very early frames (frame 15). Never use `@keyframes` + `animation: ... infinite` in kino scenes. Replace all looping blob/background animations with GSAP: `gsap.to(el, { x: 20, y: -15, duration: 22, ease: 'sine.inOut' })` — single-pass, no `repeat: -1`.
- **GSAP `repeat: -1` may also conflict:** Infinite GSAP repeats could trigger the same virtualization issue. Use long single-pass durations (e.g., `duration: 22` for a 22s scene) instead of `repeat: -1, yoyo: true` for ambient drift effects.
- **GSAP ticker override crashes kino:** Never call `gsap.ticker.remove(gsap.updateRoot)` or `tl.seek(kinoTime)` inside a ticker callback. GSAP drives itself naturally through kino's patched rAF — manual seeks cause browser hangs. Only use `gsap.ticker.add(callback)` for display-only side effects (e.g., updating a timer readout).
- **Canvas 2D grain on large canvases causes frame timeout:** Creating `ImageData` at 1920×1080 per frame allocates 8MB and iterates 2M pixels — too slow for the per-frame budget. Use SVG `feTurbulence` as a CSS `background-image` instead (static, zero per-frame cost).
- **Parallel renders cause frame timeouts:** Running 4+ Puppeteer/Chrome instances simultaneously overwhelms system resources. Always render sequentially.
- **CSS animations via Web Animations API:** `document.getAnimations()` returns all running CSS animations and transitions. Setting `.currentTime` on each one syncs them to virtual time.
- **eval() in setTimeout:** The spec allows `setTimeout("string", delay)` — the time virtualization must handle this (rare edge case).
- **GSAP works automatically:** GSAP uses rAF internally. Our virtualized rAF feeds it virtual timestamps, making GSAP animations deterministic with zero integration code.
- **Media elements need seek, not play:** Patching HTMLMediaElement.play to no-op and seeking `.currentTime` on each advanceFrame is the correct pattern for video/audio sync.
- **Animation events don't fire on manual currentTime set:** Setting `anim.currentTime` doesn't trigger animationstart/animationend events. We manually dispatch them by tracking boundary crossings.

### SDK / Codegen

- **tsx required for TS examples:** The monorepo needs `tsx` as a workspace dev dependency to run TypeScript example files with workspace package resolution.
- **Scene.render() uses dynamic import:** The SDK dynamically imports `@kinohq/core` to avoid circular deps at build time. This means the core package must be built before SDK render works.

---

### Owner / GTM

- **npm user:** enriquemarq, **GitHub:** Trejon-888
- **Working style:** Says "ULTRATHINK take autonomous action" for full auto mode. Values speed, creative branding, GTM strategy.
- **Launch plan:** 7-day testing period (March 15–22), then public launch ~March 22 if product feels solid.
- **Branding decision:** kino name, red/indigo colors, and target audience are ALL open for revision. Don't invest heavily in branding until ideal customer is identified through real usage.
- **Publish commands:** `cd packages/core && npm publish --access public` (then sdk-ts, studio, mcp-server in order)

---

## Superseded Patterns

| Old Pattern | New Pattern | Date | Why Changed |
|-------------|-------------|------|-------------|
| — | — | — | — |
