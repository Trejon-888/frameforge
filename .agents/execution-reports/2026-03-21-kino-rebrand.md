# Execution Report: kino Rebrand

**Date:** 2026-03-21
**Plan:** `.agents/plans/completed/kino-rebrand.md`
**Status:** ✅ Complete
**Duration:** ~1 session

---

## Summary

Full brand migration from "FrameForge / @frameforge" to "kino / @kinohq" executed across the entire monorepo. All source code, tests, documentation, configuration, and the Python SDK were updated in a single session. Build and all tests pass.

---

## What Was Done

### npm Package Renames
- `@frameforge/core` → `@kinohq/core` (v0.3.0)
- `@frameforge/sdk` → `@kinohq/sdk` (v0.3.0)
- `@frameforge/studio` → `@kinohq/studio` (v0.3.0)
- Root monorepo renamed to `kino-monorepo`
- All `workspace:*` dependencies updated to use new `@kinohq/*` names

### CLI Commands
- `packages/core/src/cli.ts`: `.name("frameforge")` → `.name("kino")`; all example strings updated
- `packages/studio/src/cli.ts`: `.name("frameforge-studio")` → `.name("kino-studio")`
- bin entries in package.json: `"frameforge": "dist/cli.js"` → `"kino": "dist/cli.js"`

### Browser Globals (Critical — 5 injecting files)
All 5 files that inject browser globals were updated in sync:
- `window.__FRAMEFORGE_FPS__` → `window.__KINO_FPS__`
- `window.__FRAMEFORGE_TOTAL_FRAMES__` → `window.__KINO_TOTAL_FRAMES__`
- `window.__FRAMEFORGE_CURRENT_FRAME__` → `window.__KINO_CURRENT_FRAME__`
- `window.__frameforge` → `window.__kino`
- `[FrameForge]` log tags → `[kino]`

Files updated: `frame-capture.ts`, `preview.ts`, `editor.ts`, `studio/renderer.ts`, `time-virtualization.ts`, `page-api.ts`

### Python SDK
- Directory renamed: `packages/sdk-python/frameforge/` → `packages/sdk-python/kino/`
- `pyproject.toml`: name `frameforge` → `kino`, version `0.3.0`
- All internal imports `from frameforge.*` → `from kino.*` (4 files)
- CLI invocation updated: `@frameforge/core` → `@kinohq/core`

### Documentation & Agent Docs
- `README.md`: Full sweep — header, CLI examples, package names, npm badges
- `CLAUDE.md`: Title, architecture diagram, `__kino` API section
- `.agents/PRD.md`: All references
- `.agents/PROJECT-MEMORY.md`: Architecture notes, gotchas
- `.agents/EDIT-AGENT-CONTRACT.md`: All CLI commands
- `CHANGELOG.md`: All references

### Tests Updated
- `time-virtualization.test.ts`: All `__FRAMEFORGE_*` → `__KINO_*`, getter renamed
- `frame-capture.test.ts`: Injection string assertions updated
- `components/components.test.ts`: Log tag assertions updated
- `codegen.test.ts`: `__frameforge` → `__kino`
- `subtitles.test.ts`: `__frameforge` → `__kino`, temp dir prefix, SRT sample text

---

## Key Fix During Execution

**Issue:** After renaming packages to `@kinohq/*`, `pnpm install` tried to resolve them from npm registry (not yet published), causing ENOTFOUND errors.

**Fix:** Changed all cross-package dependencies from `"@kinohq/core": "^0.3.0"` to `"@kinohq/core": "workspace:*"` in `sdk-ts/package.json` and `studio/package.json`. The `workspace:*` protocol forces pnpm to resolve locally.

---

## Validation Results

```
Build: ✅ All 3 TypeScript packages built cleanly (tsup)
Tests: ✅ 238 core + 35 SDK = 273 passing, 0 failures
CLI:   ✅ kino --help shows "kino" branding
```

---

## Pending

- [ ] **npm publish**: Verify "Frameforge" granular access token covers @kinohq org, then publish `@kinohq/core@0.3.0`, `@kinohq/sdk@0.3.0`, `@kinohq/studio@0.3.0`
- [ ] Social Media Launch (now unblocked)
- [ ] Demo Content Series — 3 remaining videos (now unblocked)

---

## Files Changed

~35 files across: `packages/core/src/`, `packages/sdk-ts/src/`, `packages/studio/src/`, `packages/sdk-python/`, `README.md`, `CLAUDE.md`, `CHANGELOG.md`, `.agents/`, `package.json` files
