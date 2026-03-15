# Phase 3 — Agent Skills & Integration

**Status:** Completed
**Priority:** P0
**Started:** 2026-03-15
**Completed:** 2026-03-15

---

## Objective

Make FrameForge usable by AI coding agents (Claude Code, etc.) through a comprehensive skill file, MCP server, and example prompts.

---

## What Was Delivered

### Agent Skill (skill.md)
- 3 authoring approaches (HTML, Manifest, SDK) with full code examples
- Animation patterns library (title card, staggered list, data viz, etc.)
- Complete API reference (elements, animation primitives, CLI commands)
- Time virtualization explanation for debugging
- Common pitfalls table with fixes
- Canvas presets for different platforms (YouTube, Shorts, Instagram, etc.)

### MCP Server (@frameforge/mcp-server)
- `frameforge_render` tool — render HTML/manifest to MP4
- `frameforge_validate` tool — validate manifest and return summary
- Stdio transport (standard MCP protocol)

### Preview Command
- `frameforge preview` CLI — capture any frame as PNG
- Supports both HTML and manifest inputs
- Useful for debugging and quick iteration

### Example Prompts Library
- 8 curated prompts with expected outputs
- Tips for writing good video generation prompts
- Covers: title cards, feature showcases, data viz, social media, countdowns, code walkthroughs
