# Plan: npm Publish + Killer README

**Status:** Ready
**Priority:** P0 — Nothing else matters until people can install it
**Started:** 2026-03-15

---

## Objective

Get FrameForge installable via `npm install` and make the GitHub repo page convert visitors into users within 10 seconds.

---

## Tasks

### 1. npm Publish Preparation

| Task | Description |
|------|-------------|
| Add .npmignore to each package | Exclude tests, tsconfig, src (ship dist only) |
| Verify package.json metadata | name, description, repository, homepage, keywords, engines |
| Add LICENSE file to root + each package | MIT |
| Verify exports field in each package.json | ESM + types |
| Set publishConfig in each package.json | access: public for scoped packages |
| Dry run `npm pack` for each package | Verify bundle contents and size |
| Publish @frameforge/core | npm publish --access public |
| Publish @frameforge/sdk | npm publish --access public |
| Publish @frameforge/studio | npm publish --access public |
| Publish @frameforge/mcp-server | npm publish --access public |
| Test installation from npm | npx @frameforge/core render in a fresh directory |

### 2. README Overhaul

| Task | Description |
|------|-------------|
| Hero section | Logo (FF monogram), tagline, 3 badges (npm, license, tests) |
| Animated demo | GIF or MP4 of Studio timeline scrubbing |
| Quickstart (3 lines) | npm install → create HTML → render |
| "Why FrameForge" section | Framework-agnostic, any animation lib, Python SDK, AI-native |
| Comparison table | vs Remotion, vs Motion Canvas, vs FFmpeg raw |
| Feature grid | Icons + one-liners for each capability |
| Examples section | Links to all 7 examples with thumbnails |
| CLI reference | render, preview, compose commands |
| SDK quickstart | TypeScript + Python side by side |
| Studio screenshot | The dark UI with timeline |
| Contributing guide | How to set up dev, run tests, submit PRs |
| Footer | License, links, credits |

### 3. Post-Publish Verification

| Task | Description |
|------|-------------|
| Fresh machine test | npm install + render in clean directory |
| npx test | npx @frameforge/core render works without prior install |
| Verify npmjs.com pages | Package descriptions, READMEs render correctly |

---

## Success Criteria

- [ ] `npm install @frameforge/core @frameforge/sdk` works
- [ ] `npx frameforge render page.html --duration 5` produces MP4
- [ ] README has hero image, quickstart, comparison table
- [ ] Package sizes are reasonable (<500KB each)
