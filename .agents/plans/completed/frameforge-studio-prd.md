# FrameForge Studio — Product Requirements Document

**Version:** 0.1.0
**Status:** Planning
**Priority:** P0 — GTM Critical
**Author:** Claude + Human
**Date:** 2026-03-15

---

## Vision

FrameForge Studio is a local web-based preview and editing environment for FrameForge projects. It provides the visual feedback loop that turns FrameForge from a CLI tool into a creative platform — a timeline you can scrub, a preview you can see, and a render button that ships.

**The 30-second demo:** Someone opens `frameforge studio`, scrubs a timeline, sees animations update frame-by-frame, tweaks their code, watches it hot-reload, and clicks "Render." That demo sells itself.

**Why this matters for GTM:** Every successful programmatic video tool (Remotion, Motion Canvas) has a visual studio. Without it, FrameForge is a black box. With it, FrameForge becomes the tool people screenshot, share, and recommend.

---

## User Roles

| Role | What They Do | What Studio Gives Them |
|------|-------------|----------------------|
| Developer | Writes HTML/CSS/JS animations | Instant visual feedback, no more render-wait-check cycles |
| Content Creator | Uses SDK to build scenes | Timeline scrubbing, see exactly what frame 75 looks like |
| AI Agent | Generates video from prompts | Preview endpoint for validation before full render |
| Open Source Contributor | Evaluates FrameForge | "Wow factor" — the UI that makes them star the repo |

---

## Core User Flows

### Flow 1: Open a Project
```bash
frameforge studio ./scene.json
# or
frameforge studio ./animation.html --duration 5
```
Browser opens to `http://localhost:6639` (FF on a phone keypad). Studio loads the scene, renders frame 0, and shows the timeline.

### Flow 2: Scrub the Timeline
User drags the scrub handle to 2.5s. Studio renders frame 75 on-demand and displays it in the preview pane. Response target: <300ms per frame.

### Flow 3: Play Preview
User clicks Play. Studio renders frames sequentially and displays them at best-effort speed (~10-15fps preview rate). Not real-time, but smooth enough to review timing and motion.

### Flow 4: Edit → Hot Reload
User edits their HTML in VS Code. Studio detects the file change, re-renders the current frame, and updates the preview instantly. No manual refresh needed.

### Flow 5: Render to MP4
User clicks "Render MP4." Studio runs the full render pipeline in the background, shows a progress bar, and opens the output file when done.

### Flow 6: Composition Timeline
For multi-scene compositions, the timeline shows scene segments with transition markers. Clicking a segment shows that scene's preview. Transitions are visualized as overlapping regions.

---

## UI Design

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  FF  FrameForge Studio          scene.json    [Render MP4 ▼] [⚙]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│         ┌──────────────────────────────────────┐                 │
│         │                                      │                 │
│         │                                      │                 │
│         │         PREVIEW PANE                 │                 │
│         │         (scaled 1920×1080)            │                 │
│         │                                      │                 │
│         │                                      │                 │
│         └──────────────────────────────────────┘                 │
│                                                                  │
│  Frame 75 / 150  ·  2.50s / 5.00s  ·  30fps  ·  1920×1080      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [⏮] [◀] [ ▶ ] [▶] [⏭]          [Loop] [1x▼]                  │
│                                                                  │
│   0s ├──────────●──────────────────────────────┤ 5.0s           │
│      ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                 │
│                                                                  │
│   ┌─ Subtitle Track ──────────────────────────────┐              │
│   │  [Hello]           [World]        [End]        │              │
│   └───────────────────────────────────────────────┘              │
│                                                                  │
│   ┌─ Audio Track ─────────────────────────────────┐              │
│   │  ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿  │              │
│   └───────────────────────────────────────────────┘              │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  Layers                          │  Properties                   │
│  ☑ ● title-text          visible │  font-size: 72px              │
│  ☑ ■ accent-bar          visible │  color: #ffffff               │
│  ☑ ● background-circle   visible │  opacity: 0.85                │
│  ☐ ■ debug-grid          hidden  │  x: 960  y: 400              │
└──────────────────────────────────────────────────────────────────┘
```

### Design System

| Element | Value |
|---------|-------|
| Background | `#0f0f13` (darker than preview) |
| Surface | `#1a1a24` |
| Border | `#2a2a3a` |
| Text Primary | `#e2e8f0` |
| Text Secondary | `#64748b` |
| Accent | `#e94560` (Forge Red) |
| Scrub Handle | `#6366f1` (Code Indigo) |
| Font | Inter (UI), JetBrains Mono (code/numbers) |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` `→` | Previous / Next frame |
| `Shift+←` `Shift+→` | Jump 1 second |
| `Home` / `End` | Go to first / last frame |
| `L` | Toggle loop |
| `R` | Trigger render |
| `Cmd+S` | Save & hot-reload |
| `1`–`9` | Jump to 10%–90% of timeline |
| `F` | Toggle fullscreen preview |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser UI                        │
│  ┌─────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Preview  │  │ Timeline │  │ Layers/Properties │  │
│  │ (Canvas) │  │ (Scrub)  │  │ (Inspector)       │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       └──────────────┼─────────────────┘             │
│                      │ WebSocket                     │
├──────────────────────┼──────────────────────────────┤
│              Studio Server (Node.js)                 │
│  ┌───────────┐  ┌────────────┐  ┌────────────────┐  │
│  │ HTTP      │  │ WebSocket  │  │ File Watcher   │  │
│  │ (serves   │  │ (frame     │  │ (chokidar)     │  │
│  │  UI files)│  │  requests) │  │                │  │
│  └───────────┘  └─────┬──────┘  └───────┬────────┘  │
│                       │                  │           │
│              ┌────────┴──────────────────┘           │
│              │                                       │
│  ┌───────────┴──────────────────────────────────┐   │
│  │  Renderer (persistent Puppeteer instance)     │   │
│  │  ├── Page loaded with time virtualization     │   │
│  │  ├── Seeks to requested frame on demand       │   │
│  │  ├── Screenshots as PNG/JPEG                  │   │
│  │  ├── DOM inspection for layer list            │   │
│  │  └── Frame cache (LRU, ~100 frames)           │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌───────────────────────────────────────────────┐   │
│  │  Full Render (spawned on demand)               │   │
│  │  └── Uses existing render() pipeline → MP4     │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Server framework | Fastify | Fast, lightweight, WebSocket support via @fastify/websocket |
| Frontend | Vanilla HTML/CSS/JS | Zero build step, dogfoods FrameForge philosophy, ships as static files |
| Frame transport | WebSocket + base64 JPEG | Lower latency than HTTP polling, JPEG smaller than PNG for preview |
| Browser instance | Persistent (kept alive) | Avoids 2-3s Puppeteer launch per frame seek |
| Frame cache | LRU cache (~100 frames) | Smooth scrubbing without re-rendering |
| File watching | chokidar | Cross-platform, battle-tested, debounced |
| Port | 6639 | FF on phone keypad — memorable, unlikely to conflict |

### WebSocket Protocol

```typescript
// Client → Server
{ type: "seek", frame: 75 }                    // Render specific frame
{ type: "play", from: 0, to: 150 }             // Start playback
{ type: "pause" }                               // Stop playback
{ type: "render", output?: string }             // Trigger full render
{ type: "inspect" }                             // Get DOM layer list

// Server → Client
{ type: "frame", frame: 75, time: 2.5, data: "base64..." }  // Frame image
{ type: "layers", layers: [...] }                              // DOM layers
{ type: "reload" }                                             // File changed
{ type: "render:progress", current: 45, total: 150 }          // Render progress
{ type: "render:complete", output: "/path/to/video.mp4" }     // Render done
{ type: "render:error", message: "..." }                       // Render failed
{ type: "error", message: "..." }                              // General error
```

---

## Implementation Phases

### Phase 1 — Core Studio (MVP)
**Goal:** Scrub a timeline, see frames, hot-reload on edit.

| Feature | Priority | Description |
|---------|----------|-------------|
| `frameforge studio` CLI command | P0 | Launches server, opens browser |
| Preview pane | P0 | Displays rendered frame, scaled to fit |
| Timeline with scrub bar | P0 | Drag to any time, renders that frame |
| Frame-by-frame stepping | P0 | Arrow keys / buttons for ±1 frame |
| Play/Pause | P0 | Sequential frame rendering at best-effort rate |
| Hot-reload | P0 | File watcher detects changes, re-renders current frame |
| Frame info bar | P0 | Shows frame number, time, fps, resolution |
| Persistent browser | P0 | Single Puppeteer instance kept alive for session |

### Phase 2 — Enhanced Experience
**Goal:** Layer inspection, keyboard shortcuts, caching.

| Feature | Priority | Description |
|---------|----------|-------------|
| Layer list | P1 | Lists DOM elements with visibility toggles |
| Property inspector | P1 | Shows CSS properties of selected element |
| Frame cache | P1 | LRU cache for smooth scrubbing |
| Keyboard shortcuts | P1 | Space, arrows, Home/End, number keys |
| Render from UI | P1 | "Render MP4" button with progress bar |
| Composition timeline | P1 | Multi-scene segments with transition markers |
| Loop playback | P1 | Loop the entire timeline or a selection |
| Playback speed | P1 | 0.5x, 1x, 2x playback rate |

### Phase 3 — Pro Features
**Goal:** Audio visualization, subtitles, export presets.

| Feature | Priority | Description |
|---------|----------|-------------|
| Audio waveform | P2 | Visualize audio tracks on timeline |
| Subtitle track | P2 | Show subtitle cues on timeline |
| Export presets | P2 | One-click YouTube, Shorts, Instagram, TikTok settings |
| Thumbnail extraction | P2 | Pick any frame as video thumbnail |
| Project browser | P2 | List recent projects, quick-open |
| Console panel | P2 | Show page console.log/error output |
| Performance stats | P2 | Frame render time, memory usage |

---

## Dependencies

### New packages needed
```json
{
  "fastify": "^5.0.0",
  "@fastify/websocket": "^11.0.0",
  "@fastify/static": "^8.0.0",
  "chokidar": "^4.0.0"
}
```

### Package structure
```
packages/
  studio/                     # New package: @frameforge/studio
    src/
      server.ts               # Fastify server + WebSocket
      renderer.ts             # Persistent Puppeteer frame renderer
      watcher.ts              # File watcher
      cli.ts                  # CLI command integration
    ui/
      index.html              # Main UI
      styles.css              # Studio design system
      app.js                  # Timeline, preview, controls
      timeline.js             # Timeline component
      preview.js              # Preview pane
      layers.js               # Layer inspector
      shortcuts.js            # Keyboard shortcut handler
      ws.js                   # WebSocket client
    package.json
```

---

## Success Criteria

### MVP (Phase 1)
- [ ] `frameforge studio scene.json` opens browser with working preview
- [ ] Scrubbing the timeline renders any frame in <500ms
- [ ] Play button shows frame-by-frame animation
- [ ] Editing HTML triggers hot-reload with visible update
- [ ] Works on Windows, macOS, and Linux

### Phase 2
- [ ] Layer list shows all positioned DOM elements
- [ ] Property inspector shows live CSS values
- [ ] "Render MP4" produces correct output
- [ ] Composition timeline shows multi-scene segments
- [ ] Keyboard shortcuts work without focus issues

### Phase 3
- [ ] Audio waveform renders from audio track files
- [ ] Subtitle cues visible and clickable on timeline
- [ ] Export presets produce correctly sized outputs

---

## GTM Integration

This Studio is the centerpiece of FrameForge's go-to-market:

1. **Hero demo video:** Screen recording of Studio in action — scrub, edit, render. This IS the social media content.
2. **README screenshot:** The Studio UI screenshot replaces the CLI-only impression.
3. **Conference talks:** Live-code a video in Studio, render on stage.
4. **Comparison content:** Side-by-side with Remotion Studio, showing FrameForge's framework-agnostic advantage.
5. **Tutorial series:** "Build X in FrameForge Studio" — title cards, data viz, social clips.

### Competitive Positioning

| Feature | FrameForge Studio | Remotion Studio | Motion Canvas |
|---------|------------------|-----------------|---------------|
| Framework lock-in | None (any HTML) | React only | Custom DSL |
| Timeline scrub | Yes | Yes | Yes |
| Hot-reload | Yes | Yes | Yes |
| Multi-scene | Yes (composition) | No (single comp) | Yes |
| Python SDK | Yes | No | No |
| AI agent integration | MCP + Skill | No | No |
| 3rd-party animation libs | All (GSAP, Three.js, etc.) | React ecosystem only | Limited |

---

## Open Questions

1. **JPEG vs PNG for preview frames?** JPEG is ~5x smaller but lossy. For a preview pane, quality loss is acceptable. Use PNG for full-resolution export preview.

2. **WebSocket vs Server-Sent Events?** WebSocket is bidirectional (needed for seek requests). SSE is simpler but one-way. WebSocket wins.

3. **Should the UI be a separate npm package or bundled with core?** Separate package (`@frameforge/studio`) keeps core lightweight. Studio is optional.

4. **Electron wrapper?** Not for MVP. The browser-based approach is simpler and cross-platform. Electron could come later for a desktop app experience.

5. **Remote access?** Should Studio be accessible from other machines on the network? Useful for reviewing on a phone/tablet. Add `--host 0.0.0.0` flag.

---

## Timeline Estimate

| Phase | Scope |
|-------|-------|
| Phase 1 (MVP) | Server, preview, timeline, hot-reload |
| Phase 2 | Layers, inspector, caching, render button, shortcuts |
| Phase 3 | Audio, subtitles, export presets |

---

*This PRD is a living document. Update as decisions are made during implementation.*
