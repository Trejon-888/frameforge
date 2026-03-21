# Feature: kino Rebrand

## Feature Description

Full brand migration from "FrameForge / @frameforge" to "kino / @kinohq". Rename all npm packages, CLI commands, internal browser globals, documentation, Python SDK module, and agent docs. Publish new @kinohq/* packages to npm.

## User Story

As the product owner,
I want all references to "FrameForge" and "@frameforge" replaced with "kino" and "@kinohq",
So that the brand is consistent across the npm registry, CLI, codebase, and all documentation.

## Problem Statement

The product was developed under the "FrameForge" brand. The brand has been pivoted to "kino" (lowercase). The npm scope @kinohq was secured on 2026-03-21. The published packages (@frameforge/core@0.2.0, @frameforge/sdk@0.2.0, @frameforge/studio@0.2.0) are live but branded incorrectly. All code, docs, and configs still say "FrameForge".

## Solution Statement

Execute a complete rename in this order: (1) Source code globals → build succeeds, (2) package.json names, (3) CLI bin names, (4) Python SDK module dir, (5) all documentation, (6) publish @kinohq/* to npm.

## Feature Metadata

**Type**: Refactor
**Complexity**: Medium
**Systems Affected**: npm packages, CLI, browser-injected globals, Python SDK, all docs
**Dependencies**: @kinohq npm org already created by user

---

## CONTEXT REFERENCES

### Files to Read Before Implementing

- `packages/core/src/time-virtualization.ts` — contains `__FRAMEFORGE_*` window constants and `window.__frameforge` → all must become `__KINO_*` / `window.__kino`
- `packages/core/src/page-api.ts` — extends `window.__frameforge` → change to `window.__kino`
- `packages/core/src/frame-capture.ts` — injects `__FRAMEFORGE_*` constants into page → change to `__KINO_*`
- `packages/core/src/preview.ts` — same `__FRAMEFORGE_*` injections → change to `__KINO_*`
- `packages/core/src/editor.ts` — same `__FRAMEFORGE_*` injections → change to `__KINO_*`
- `packages/core/src/cli.ts` — `.name("frameforge")`, all help text, all example command strings
- `packages/studio/src/cli.ts` — `.name("frameforge-studio")`, help text
- `packages/core/src/frame-capture.test.ts` — tests assert `__FRAMEFORGE_FPS__` string literal
- `packages/core/src/time-virtualization.test.ts` — tests assert `__FRAMEFORGE_*` string literals
- `packages/sdk-ts/src/scene.ts` — imports from `@frameforge/core`
- `packages/sdk-python/frameforge/*.py` — module is named `frameforge`; must rename dir to `kino/` and update all imports

### New Files to Create

None. This is a rename-only refactor.

### Directory to Rename

- `packages/sdk-python/frameforge/` → `packages/sdk-python/kino/`
  (5 files inside: `__init__.py`, `animations.py`, `codegen.py`, `easing.py`, `elements.py`, `scene.py`)

### Branding Note

- `branding/cosmo.svg` exists. HANDOVER says `branding/kino.svg` was created. Confirm which file is the mascot SVG and keep `kino.svg` as canonical. The old `cosmo.svg` can be left for now.

---

## IMPLEMENTATION PLAN

### Phase 1: Source Code — Internal Globals (Build-Critical)

Rename all `__FRAMEFORGE_*` window constants and `window.__frameforge` to `__KINO_*` / `window.__kino`. These are injected as strings into the browser — must be consistent across all injecting files AND consuming files.

**Injecting files (must match each other):**
- `packages/core/src/time-virtualization.ts`
- `packages/core/src/frame-capture.ts`
- `packages/core/src/preview.ts`
- `packages/core/src/editor.ts`

**Consuming files (page-side):**
- `packages/core/src/page-api.ts`

**Test files (assert string literals):**
- `packages/core/src/frame-capture.test.ts`
- `packages/core/src/time-virtualization.test.ts`

### Phase 2: Package.json Names

Rename all `@frameforge/*` → `@kinohq/*` and update descriptions, bin entries, internal peer deps.

Files:
- `package.json` (root monorepo)
- `packages/core/package.json`
- `packages/sdk-ts/package.json`
- `packages/studio/package.json`
- `packages/sdk-python/pyproject.toml`

### Phase 3: SDK TypeScript Imports

All `import ... from "@frameforge/core"` → `@kinohq/core` and `@frameforge/sdk` → `@kinohq/sdk` in:
- `packages/sdk-ts/src/**/*.ts`
- `packages/studio/src/**/*.ts`
- `examples/**/*.ts`

### Phase 4: Python SDK Module Rename

Rename `packages/sdk-python/frameforge/` → `packages/sdk-python/kino/` and update all internal Python imports (`from frameforge import` → `from kino import`), pyproject.toml module name.

### Phase 5: CLI Names

- `packages/core/src/cli.ts`: `.name("frameforge")` → `.name("kino")`, all `chalk.bold("\n  FrameForge ")` → `"kino "`, all example strings `frameforge render` → `kino render`
- `packages/studio/src/cli.ts`: `.name("frameforge-studio")` → `.name("kino-studio")`

### Phase 6: Documentation

- `README.md` — full sweep
- `CLAUDE.md` — tech stack table, CLI commands, page API section, architecture diagram
- `skill.md` — all CLI examples, description text
- `CHANGELOG.md` — package names and CLI commands in release notes
- `.agents/PRD.md` — CLI commands, package names, Page API section
- `.agents/EDIT-AGENT-CONTRACT.md` — any CLI references
- `.agents/PROJECT-MEMORY.md` — any explicit FrameForge references

### Phase 7: Config Files

- `.claude/settings.local.json` — `@frameforge/core` → `@kinohq/core`

### Phase 8: Build & Test

```bash
pnpm build
pnpm test
```

All 238 tests must pass. No TypeScript errors.

### Phase 9: npm Publish

Publish @kinohq/core@0.3.0, @kinohq/sdk@0.3.0, @kinohq/studio@0.3.0 to npmjs.com.

Version bump to 0.3.0 signals the rebrand (breaking: CLI renamed, globals renamed).

---

## STEP-BY-STEP TASKS

---

### TASK 1: UPDATE `packages/core/src/time-virtualization.ts`

Replace all `__FRAMEFORGE_*` constants and `window.__frameforge` references.

- **IMPLEMENT**: Global replace `__FRAMEFORGE_FPS__` → `__KINO_FPS__`
- **IMPLEMENT**: Global replace `__FRAMEFORGE_TOTAL_FRAMES__` → `__KINO_TOTAL_FRAMES__`
- **IMPLEMENT**: Global replace `__FRAMEFORGE_DURATION__` → `__KINO_DURATION__`
- **IMPLEMENT**: Global replace `__FRAMEFORGE_WIDTH__` → `__KINO_WIDTH__`
- **IMPLEMENT**: Global replace `__FRAMEFORGE_HEIGHT__` → `__KINO_HEIGHT__`
- **IMPLEMENT**: Global replace `window.__frameforge` → `window.__kino`
- **IMPLEMENT**: Global replace `__frameforge` (standalone) → `__kino`
- **IMPLEMENT**: Update any console.log/error strings `[FrameForge]` → `[kino]`
- **GOTCHA**: This file generates a string that is eval'd in the browser. ALL occurrences must match page-api.ts. Do a final grep after editing to confirm zero `__frameforge` or `__FRAMEFORGE` remain.
- **VALIDATE**: `grep -r "__frameforge\|__FRAMEFORGE" packages/core/src/time-virtualization.ts` → must return empty

---

### TASK 2: UPDATE `packages/core/src/page-api.ts`

- **IMPLEMENT**: Replace `window.__FRAMEFORGE_TOTAL_FRAMES__` → `window.__KINO_TOTAL_FRAMES__`
- **IMPLEMENT**: Replace `window.__FRAMEFORGE_DURATION__` → `window.__KINO_DURATION__`
- **IMPLEMENT**: Replace `window.__FRAMEFORGE_WIDTH__` → `window.__KINO_WIDTH__`
- **IMPLEMENT**: Replace `window.__FRAMEFORGE_HEIGHT__` → `window.__KINO_HEIGHT__`
- **IMPLEMENT**: Replace `window.__frameforge` → `window.__kino` (all occurrences)
- **IMPLEMENT**: Replace `'[FrameForge]'` → `'[kino]'` in error/log strings
- **VALIDATE**: `grep -r "__frameforge\|__FRAMEFORGE\|FrameForge" packages/core/src/page-api.ts` → empty

---

### TASK 3: UPDATE `packages/core/src/frame-capture.ts`

- **IMPLEMENT**: Replace all `__FRAMEFORGE_*` injected constants → `__KINO_*`
- **IMPLEMENT**: Replace any `window.__frameforge` → `window.__kino`
- **VALIDATE**: `grep "__frameforge\|__FRAMEFORGE" packages/core/src/frame-capture.ts` → empty

---

### TASK 4: UPDATE `packages/core/src/preview.ts`

- **IMPLEMENT**: Same `__FRAMEFORGE_*` → `__KINO_*` replacements
- **VALIDATE**: `grep "__frameforge\|__FRAMEFORGE" packages/core/src/preview.ts` → empty

---

### TASK 5: UPDATE `packages/core/src/editor.ts`

- **IMPLEMENT**: Same `__FRAMEFORGE_*` → `__KINO_*` replacements
- **VALIDATE**: `grep "__frameforge\|__FRAMEFORGE" packages/core/src/editor.ts` → empty

---

### TASK 6: UPDATE test files for globals

- **UPDATE** `packages/core/src/frame-capture.test.ts`: Replace `"__FRAMEFORGE_FPS__"` → `"__KINO_FPS__"` and all other `__FRAMEFORGE_*` string literals
- **UPDATE** `packages/core/src/time-virtualization.test.ts`: Same replacements for all `__FRAMEFORGE_*` string literals
- **VALIDATE**: `grep "__frameforge\|__FRAMEFORGE" packages/core/src/**/*.test.ts` → empty

---

### TASK 7: UPDATE `packages/core/src/cli.ts`

- **IMPLEMENT**: `.name("frameforge")` → `.name("kino")` (line ~43)
- **IMPLEMENT**: All `chalk.bold("\n  FrameForge ")` → `chalk.bold("\n  kino ")`
- **IMPLEMENT**: All example strings `"frameforge render ..."` → `"kino render ..."`
- **IMPLEMENT**: All example strings `"frameforge extract-transcript ..."` → `"kino extract-transcript ..."`
- **IMPLEMENT**: All example strings `"frameforge render-overlays ..."` → `"kino render-overlays ..."`
- **IMPLEMENT**: All example strings `"frameforge preview-overlays ..."` → `"kino preview-overlays ..."`
- **VALIDATE**: `grep -i "frameforge" packages/core/src/cli.ts` → empty

---

### TASK 8: UPDATE `packages/studio/src/cli.ts`

- **IMPLEMENT**: `.name("frameforge-studio")` → `.name("kino-studio")`
- **IMPLEMENT**: All `FrameForge Studio` display text → `kino studio`
- **VALIDATE**: `grep -i "frameforge" packages/studio/src/cli.ts` → empty

---

### TASK 9: UPDATE `packages/core/package.json`

```json
{
  "name": "@kinohq/core",
  "version": "0.3.0",
  "description": "kino rendering engine — deterministic browser-to-video pipeline + AI-powered video editing",
  "bin": { "kino": "dist/cli.js" },
  "repository": {
    "url": "git+https://github.com/Trejon-888/frameforge.git"
  },
  "homepage": "https://github.com/Trejon-888/frameforge"
}
```
Note: Keep repo URL pointing to existing repo unless user explicitly creates a new one.

---

### TASK 10: UPDATE `packages/sdk-ts/package.json`

```json
{
  "name": "@kinohq/sdk",
  "version": "0.3.0",
  "description": "kino TypeScript SDK — scene builder, elements, animations, codegen",
  "dependencies": { "@kinohq/core": "^0.3.0" },
  "keywords": [..., "kino"]
}
```
- Remove `"frameforge"` from keywords, add `"kino"`

---

### TASK 11: UPDATE `packages/studio/package.json`

```json
{
  "name": "@kinohq/studio",
  "version": "0.3.0",
  "description": "kino Studio — browser preview and development server",
  "bin": { "kino-studio": "dist/cli.js" },
  "dependencies": { "@kinohq/core": "^0.3.0" },
  "keywords": [..., "kino"]
}
```
- Remove `"frameforge"` from keywords, add `"kino"`

---

### TASK 12: UPDATE root `package.json`

- `"name": "frameforge-monorepo"` → `"kino-monorepo"`

---

### TASK 13: UPDATE `packages/sdk-python/pyproject.toml`

- `name = "frameforge"` → `name = "kino"`
- `description = "..."` → replace FrameForge with kino
- `packages = ["frameforge"]` → `packages = ["kino"]`

---

### TASK 14: RENAME Python SDK module directory

```bash
mv packages/sdk-python/frameforge packages/sdk-python/kino
```

Then update all internal Python imports in the 5 source files:
- `kino/__init__.py`: `from frameforge.` → `from kino.`
- `kino/scene.py`: same
- `kino/codegen.py`: same
- `kino/elements.py`: same
- `kino/animations.py`: same

And update test files in `packages/sdk-python/tests/`:
```bash
ls packages/sdk-python/tests/
```
- Replace all `from frameforge import` / `import frameforge` → `from kino import` / `import kino`

- **GOTCHA**: Don't forget `__init__.py` — it may re-export everything with `from frameforge.scene import Scene` style imports
- **VALIDATE**: `grep -r "from frameforge\|import frameforge" packages/sdk-python/` → empty

---

### TASK 15: UPDATE TypeScript SDK source imports

Search for all `@frameforge/core` / `@frameforge/sdk` in TypeScript source files:

```bash
grep -r "@frameforge" packages/sdk-ts/src/ packages/studio/src/
```

Replace all `@frameforge/core` → `@kinohq/core`, `@frameforge/sdk` → `@kinohq/sdk`.

---

### TASK 16: UPDATE example files

- `examples/animation-primitives/render.ts`: `@frameforge/sdk` → `@kinohq/sdk`; also the `new Text("@frameforge/sdk", ...)` watermark text → `@kinohq/sdk`
- `examples/sdk-ts/render.ts`: `@frameforge/sdk` → `@kinohq/sdk`
- `examples/frameforge-showcase/scene.json`: Update output filename inside file
- Consider renaming `examples/frameforge-showcase/` dir to `examples/kino-showcase/` (optional, non-breaking)

---

### TASK 17: UPDATE `README.md`

Global replacements:
- `FrameForge` → `kino` (display name, lowercase)
- `@frameforge/core` → `@kinohq/core`
- `@frameforge/sdk` → `@kinohq/sdk`
- `@frameforge/studio` → `@kinohq/studio`
- `frameforge render` → `kino render`
- `frameforge compose` → `kino compose`
- `frameforge preview` → `kino preview`
- `frameforge extract-transcript` → `kino extract-transcript`
- `frameforge render-overlays` → `kino render-overlays`
- `frameforge preview-overlays` → `kino preview-overlays`
- `frameforge edit` → `kino edit`
- `from frameforge import` → `from kino import`
- `__frameforge.ready()` → `__kino.ready()`
- npm badge URLs: update package name in badge URLs
- `## What is FrameForge?` → `## What is kino?`
- `## Why FrameForge?` → `## Why kino?`
- Comparison table row "FrameForge" → "kino"

- **VALIDATE**: `grep -i "frameforge\|@frameforge" README.md` → empty

---

### TASK 18: UPDATE `CLAUDE.md`

- Architecture diagram: `frameforge/` path label → `kino/`
- `# __frameforge Page API` section → `# __kino Page API`
- `__frameforge.ready()`, `__frameforge.totalFrames`, `__frameforge.currentFrame` → `__kino.*`
- `@frameforge/sdk` SDK label → `@kinohq/sdk`
- `@frameforge/core` filter commands → `@kinohq/core`
- `npx frameforge` → `npx kino`
- `sdk-ts/ # TypeScript SDK (@frameforge/sdk)` → `(@kinohq/sdk)`
- `sdk-python/ # Python SDK (frameforge PyPI)` → `(kino PyPI)`
- `├── frameforge/` in python tree → `├── kino/`
- `page-api.ts # __frameforge client API` → `__kino`

- **VALIDATE**: `grep -i "frameforge\|@frameforge" CLAUDE.md` → empty

---

### TASK 19: UPDATE `skill.md`

- Title: `# FrameForge — AI Video Generation Skill` → `# kino — AI Video Generation Skill`
- All `FrameForge` description text → `kino`
- All `npx frameforge` → `npx kino`
- `@frameforge/sdk` → `@kinohq/sdk`
- `window.__frameforge` → `window.__kino`

- **VALIDATE**: `grep -i "frameforge\|@frameforge" skill.md` → empty

---

### TASK 20: UPDATE `CHANGELOG.md`

- Title / intro text: `FrameForge` → `kino`
- All CLI command examples in release notes
- All package name references

---

### TASK 21: UPDATE `.agents/PRD.md`

- Header: `FrameForge — Product Requirements`
- Tagline: `"If a browser can render it, FrameForge can record it."` → `"If a browser can render it, kino can record it."`
- All `frameforge render`, `frameforge preview`, `frameforge edit`, etc. in feature tables
- `__frameforge` Page API section
- `@frameforge/sdk` references
- Vision section description text

---

### TASK 22: UPDATE `.agents/EDIT-AGENT-CONTRACT.md`

Search for `frameforge` CLI references and update to `kino`.

```bash
grep -i "frameforge" .agents/EDIT-AGENT-CONTRACT.md
```

---

### TASK 23: UPDATE `.agents/PROJECT-MEMORY.md`

Search and replace:
```bash
grep -i "frameforge" .agents/PROJECT-MEMORY.md
```
Replace CLI command examples and package name references. Historical context entries can note "formerly FrameForge" where relevant.

---

### TASK 24: UPDATE `.claude/settings.local.json`

- `"Bash(pnpm --filter @frameforge/core test)"` → `"Bash(pnpm --filter @kinohq/core test)"`
- Check for any other `@frameforge` references

---

### TASK 25: BUILD & TEST

```bash
pnpm build
pnpm test
```

- All 238 tests must pass
- Zero TypeScript errors
- **GOTCHA**: After renaming Python module dir, Python tests may fail if they import `frameforge`. Fix all Python test imports too.
- **VALIDATE**: `grep -r "__frameforge\|__FRAMEFORGE\|@frameforge" packages/ --include="*.ts" --include="*.js"` → empty (no source references remain)

---

### TASK 26: BUMP VERSIONS TO 0.3.0

In each package.json:
- `packages/core/package.json`: `"version": "0.3.0"`
- `packages/sdk-ts/package.json`: `"version": "0.3.0"`, peer dep `@kinohq/core: "^0.3.0"`
- `packages/studio/package.json`: `"version": "0.3.0"`, peer dep `@kinohq/core: "^0.3.0"`

Version 0.3.0 signals the rebrand (breaking change: CLI renamed, globals renamed).

---

### TASK 27: NPM PUBLISH

Publish in dependency order:

```bash
# 1. Core first (others depend on it)
pnpm --filter @kinohq/core publish --access public

# 2. SDK (depends on core)
pnpm --filter @kinohq/sdk publish --access public

# 3. Studio (depends on core)
pnpm --filter @kinohq/studio publish --access public
```

- **GOTCHA**: Auth token is the "Frameforge" granular access token (expires June 13, 2026). It was set up for @frameforge org. User needs to verify it has write access to @kinohq org OR create a new token for @kinohq.
- **ACTION REQUIRED**: Before running publish, user should verify token works: `npm whoami` and `npm access list packages @kinohq`
- If token doesn't cover @kinohq: user must go to npmjs.com → Access Tokens → create new granular token for @kinohq org

---

### TASK 28: UPDATE HANDOVER.md

After publish, update HANDOVER.md:
- Change "Active Plans" — mark Kino Rebrand as Complete
- Update npm Registry section to @kinohq packages
- Update What's Next to reflect post-rebrand priorities

---

## TESTING STRATEGY

### Unit Tests
- All existing 238 tests cover the rename implicitly (time-virtualization, frame-capture, page-api tests use the renamed constants)
- No new tests needed — this is a rename, not new behavior

### Integration Tests
- After build: run `node packages/core/dist/cli.js --help` — must show "kino" not "frameforge"
- After build: run a test render to confirm globals work end-to-end

### Edge Cases
- Python SDK: confirm `from kino import Scene` works after rename
- CLI: confirm `npx kino` resolves correctly with new bin entry

---

## VALIDATION COMMANDS

### Level 1: No remaining FrameForge references in source

```bash
grep -r "__frameforge\|__FRAMEFORGE" packages/ --include="*.ts"
grep -r "@frameforge" packages/ --include="*.ts" --include="*.json"
grep -i "frameforge" README.md CLAUDE.md skill.md
```

All must return empty.

### Level 2: Build

```bash
pnpm build
```

### Level 3: Tests

```bash
pnpm test
```

Must pass all 238 tests.

### Level 4: CLI Smoke Test

```bash
node packages/core/dist/cli.js --help
```

Must show "kino" in output, not "frameforge".

---

## ACCEPTANCE CRITERIA

- [ ] All `__FRAMEFORGE_*` → `__KINO_*` in all 5 injecting/consuming source files
- [ ] All `window.__frameforge` → `window.__kino` in all source files
- [ ] All package names `@frameforge/*` → `@kinohq/*` in all package.json files
- [ ] CLI bin `frameforge` → `kino`, `frameforge-studio` → `kino-studio`
- [ ] Python SDK module dir renamed `frameforge/` → `kino/` + all imports updated
- [ ] README.md has zero "frameforge" or "FrameForge" references
- [ ] CLAUDE.md updated to kino brand
- [ ] skill.md updated to kino brand
- [ ] `pnpm build` succeeds with zero errors
- [ ] `pnpm test` passes all 238 tests
- [ ] `node packages/core/dist/cli.js --help` shows "kino" not "frameforge"
- [ ] @kinohq/core@0.3.0, @kinohq/sdk@0.3.0, @kinohq/studio@0.3.0 published to npm
- [ ] HANDOVER.md updated with rebrand complete status

---

**Status:** Ready
**Created:** 2026-03-21
