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

---

## Problems Solved

### General

| Problem | Root Cause | Solution | Session |
|---------|-----------|----------|---------|
| `__originalRAF` undefined in frame-capture | Variable scoped inside time-virtualization IIFE, not exposed on window | Added `window.__originalRAF = _originalRAF` at end of IIFE | Session 1 |
| Output path resolves to CWD not manifest dir | `resolve(options.output)` uses CWD; CLI always set default `-o` value | Remove CLI default for `-o`; resolve output relative to `dirname(manifestPath)` in renderer | Session 1 |

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

### Time Virtualization

- **CSS animations via Web Animations API:** `document.getAnimations()` returns all running CSS animations and transitions. Setting `.currentTime` on each one syncs them to virtual time.
- **eval() in setTimeout:** The spec allows `setTimeout("string", delay)` — the time virtualization must handle this (rare edge case).
- **GSAP works automatically:** GSAP uses rAF internally. Our virtualized rAF feeds it virtual timestamps, making GSAP animations deterministic with zero integration code.
- **Media elements need seek, not play:** Patching HTMLMediaElement.play to no-op and seeking `.currentTime` on each advanceFrame is the correct pattern for video/audio sync.
- **Animation events don't fire on manual currentTime set:** Setting `anim.currentTime` doesn't trigger animationstart/animationend events. We manually dispatch them by tracking boundary crossings.

### SDK / Codegen

- **tsx required for TS examples:** The monorepo needs `tsx` as a workspace dev dependency to run TypeScript example files with workspace package resolution.
- **Scene.render() uses dynamic import:** The SDK dynamically imports `@frameforge/core` to avoid circular deps at build time. This means the core package must be built before SDK render works.

---

## Superseded Patterns

| Old Pattern | New Pattern | Date | Why Changed |
|-------------|-------------|------|-------------|
| — | — | — | — |
