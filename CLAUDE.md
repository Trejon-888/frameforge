# FrameForge

**Framework-agnostic programmatic video from any web technology. If a browser can render it, FrameForge can record it.**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (core + TS SDK), Python (Python SDK) |
| Runtime | Node.js 20+ |
| Browser Automation | Puppeteer (Chrome DevTools Protocol) |
| Video Encoding | FFmpeg (spawned process, frames piped to stdin) |
| Package Manager | pnpm (monorepo) |
| Schema Validation | Zod (TS), Pydantic (Python) |
| Testing | Vitest |
| Build | tsup |

---

## Architecture Overview

```
frameforge/
├── packages/
│   ├── core/                    # Render engine (CLI + library)
│   │   ├── src/
│   │   │   ├── cli.ts           # CLI entry point
│   │   │   ├── renderer.ts      # Main render orchestrator
│   │   │   ├── time-virtualization.ts  # Browser time-patching script
│   │   │   ├── frame-capture.ts # Puppeteer frame capture
│   │   │   ├── ffmpeg.ts        # FFmpeg pipeline
│   │   │   ├── manifest.ts      # Scene manifest parsing (Zod)
│   │   │   ├── page-api.ts      # __frameforge client API
│   │   │   └── preview.ts       # Single frame capture
│   │   └── package.json
│   │
│   ├── sdk-ts/                  # TypeScript SDK (@frameforge/sdk)
│   │   ├── src/
│   │   │   ├── scene.ts         # Scene builder
│   │   │   ├── elements/        # Text, Shape, Image, etc.
│   │   │   ├── animations/      # Animation primitives
│   │   │   ├── easing.ts        # Easing functions
│   │   │   └── codegen.ts       # Generates HTML from scene graph
│   │   └── package.json
│   │
│   ├── mcp-server/              # MCP Server (@frameforge/mcp-server)
│   │   ├── src/
│   │   │   └── index.ts         # MCP protocol server (render + validate tools)
│   │   └── package.json
│   │
│   └── sdk-python/              # Python SDK (frameforge PyPI)
│       ├── frameforge/
│       │   ├── scene.py
│       │   ├── elements.py
│       │   ├── animations.py
│       │   ├── easing.py
│       │   └── codegen.py
│       └── pyproject.toml
│
├── examples/                    # Example projects
├── templates/                   # Pre-built scene templates
├── .agents/                     # Project memory & plans
├── .claude/                     # Claude Code configuration
└── CLAUDE.md                    # This file
```

---

## Essential Commands

```bash
pnpm install              # Install all dependencies
pnpm build                # Build all packages
pnpm dev                  # Dev mode with watch
pnpm test                 # Run tests (Vitest)
pnpm lint                 # Lint source code

# Core package
pnpm --filter @frameforge/core build
pnpm --filter @frameforge/core test

# Render a page
npx frameforge render ./page.html --duration 10 --fps 30 -o video.mp4

# Preview a single frame
npx frameforge preview ./scene.json --frame 45 -o preview.png
```

---

## Commands & Skills

| Category | Commands |
|----------|----------|
| Build Loop | `/plan`, `/execute`, `/review`, `/system-review`, `/validate`, `/prime` |
| Worktrees | `/worktree`, `/merge-worktrees`, `/worktree-cleanup` |
| GitHub | `/fix-issue`, `/review-pr`, `/create-pr`, `/merge-pr` |
| Session | `/continue`, `/done`, `/piv` |
| Diagnostics | `/doctor`, `/security-audit` |
| Other | `/agent-browser`, `/auto-research` |

**Composition examples:**
- Feature: `/plan` → `/execute` → `/review` → `/done`
- Bug fix: `/fix-issue 42`
- Full autopilot: `/piv`

---

## Core Concepts

### Time Virtualization
The core innovation. We inject a script into the page that patches all browser time APIs:
- `Date.now()`, `performance.now()` → virtual clock we control
- `requestAnimationFrame()` → manual queue flushed per frame
- `setTimeout()` / `setInterval()` → fire based on virtual time
- CSS Animations / Web Animations API → controlled via `document.timeline`
- `<video>` / `<audio>` → seeked to correct time per frame

This makes rendering deterministic regardless of system performance.

### Scene Manifest
JSON file describing what to render: entry HTML, canvas dimensions, fps, duration, audio tracks, codec settings. All authoring paths (raw HTML, TS SDK, Python SDK) produce a manifest + HTML entry.

### __frameforge Page API
Global API injected into pages. Pages can optionally use it to signal frame readiness for async content:
- `__frameforge.ready()` — signal current frame is ready to capture
- `__frameforge.totalFrames` — total frames to render
- `__frameforge.currentFrame` — current frame number

---

## Guidelines

- All rendering logic lives in `packages/core/` — SDKs are codegen-only, they produce HTML + manifests
- Time virtualization must be framework-agnostic — no React/Vue/Svelte assumptions
- Frames pipe directly to FFmpeg stdin — no intermediate PNG files on disk
- Scene manifests are the universal contract between authoring and rendering
- Error messages must be agent-friendly (parseable, actionable suggestions)
- Tests required for all core rendering logic, especially time virtualization edge cases

---

## Source of Truth

| Concept | File | What It Owns |
|---------|------|-------------|
| How we build | `CLAUDE.md` (this file) | Tech stack, commands, conventions |
| What we're building | `.agents/PRD.md` | Features, roles, requirements, status |
| Session context | `.agents/HANDOVER.md` | What happened, what's next |
| Lessons learned | `.agents/PROJECT-MEMORY.md` | Decisions, gotchas, solved problems |
| Plan tracking | `.agents/plans/INDEX.md` | Active, pending, completed plans |

---

*Powered by [ix-claude-code-starter-kit](https://github.com/Trejon-888/ix-claude-code-starter-kit) from [INFINITX](https://app.infinitxai.com) — AI-native business infrastructure.*
