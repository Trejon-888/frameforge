# Plan: Studio Phase 2 — Polish

**Status:** Ready
**Priority:** P1 — Parallel with launch content
**Depends on:** Studio Phase 1 (done)

---

## Objective

Elevate FrameForge Studio from MVP to demo-ready. Add the features that make screenshots and screen recordings look professional: layer inspector, property panel, smooth caching, and keyboard-first workflow.

---

## Tasks

### UI Enhancements

| Task | Description |
|------|-------------|
| Layer panel | List DOM elements with visibility toggles, click to select |
| Property inspector | Show CSS properties of selected layer (position, size, opacity, color) |
| Frame cache warmup | Pre-render nearby frames for smooth scrubbing |
| Responsive preview | Scale preview to window size, maintain aspect ratio |
| Dark/light theme toggle | (Start with dark only, add toggle later) |
| Loading states | Skeleton loaders while frames render |
| Error display | Show page errors in a console panel |

### Interaction Polish

| Task | Description |
|------|-------------|
| Smooth scrubbing | Debounce seek requests, show cached frames instantly |
| Keyboard shortcut overlay | Press `?` to show shortcuts |
| Frame step buttons polish | Hold arrow key = auto-repeat stepping |
| Loop region | Click+drag on timeline to set loop in/out points |
| Zoom timeline | Scroll to zoom into timeline sections |
| Minimap | Small overview bar showing full timeline with current viewport |

### Composition Support

| Task | Description |
|------|-------------|
| Multi-scene timeline | Show scene segments as colored blocks |
| Transition markers | Show transition type + duration between segments |
| Scene switching | Click a segment to preview that scene |

### Export & Output

| Task | Description |
|------|-------------|
| Export presets | Dropdown: YouTube 1080p, Shorts 1080x1920, Instagram, Twitter |
| Thumbnail picker | Click any frame → save as thumbnail PNG |
| Render settings panel | Codec, quality, fps overrides before rendering |

---

## Success Criteria

- [ ] Layer panel shows all positioned elements
- [ ] Property inspector updates when scrubbing
- [ ] Scrubbing feels smooth (cached frames display < 50ms)
- [ ] Screenshot of Studio looks professional enough for README hero image
- [ ] Composition timeline shows scene segments
