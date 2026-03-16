# Plan: Product Stress Test — Break Everything, Fix Everything

**Status:** Ready
**Priority:** P0 — Product quality before GTM
**Date:** 2026-03-15

---

## Objective

Systematically test every surface of FrameForge to find and fix bugs before anyone else uses it. This is NOT about UX or design — it's about "does the product actually work in every scenario?"

---

## Test Categories

### 1. Clean Install Test (npm)
Can someone install from npm and render a video in under 2 minutes?

| Test | What to verify |
|------|---------------|
| Fresh directory install | `npm init -y && npm install @frameforge/core` succeeds |
| CLI works from npm | `npx @frameforge/core render` runs (or does the bin path work?) |
| SDK import works | `import { Scene } from "@frameforge/sdk"` resolves |
| Minimal render | 3-line SDK script produces an MP4 |
| Error messages | Missing FFmpeg, missing Chrome, wrong paths — all give helpful output |

### 2. TypeScript SDK Full Coverage
Test every element, animation primitive, and codegen path.

| Test | What to verify |
|------|---------------|
| Text element — all options | fontSize, fontFamily, fontWeight, color, x, y, opacity, textAlign |
| Shape element — all types | rect, circle, ellipse with all options |
| Image element | Local file path, width, height, objectFit, borderRadius |
| Scene.render() | Generates HTML → writes temp files → calls core → produces MP4 |
| Scene.toManifest() | Outputs valid JSON that `frameforge render` accepts |
| fadeIn / fadeOut | Opacity animates correctly at specified times |
| slideIn / slideOut | All 4 directions, custom distance |
| scaleIn / scaleOut | Scale transform renders correctly in video |
| rotateIn / rotateTo | Rotation renders correctly (not just CSS left/top) |
| stagger() | Multiple elements animate with correct timing offsets |
| Codegen HTML validity | Generated HTML is valid, no XSS, no broken tags |
| Codegen scale/rotation | transform properties render correctly (not just style.left) |

### 3. Python SDK Full Coverage
Test the entire Python → MP4 pipeline end-to-end.

| Test | What to verify |
|------|---------------|
| Import all | `from frameforge import Scene, Text, Shape, Image, Animate` |
| Scene creation | Scene with all options (width, height, fps, duration, background) |
| Text element | All constructor kwargs map correctly to JS property names |
| Shape element | rect, circle, ellipse with stroke, borderRadius |
| Image element | src, objectFit, borderRadius |
| Animate presets | fade_in, fade_out, slide_in_left, slide_in_right |
| Codegen output | generate_html() produces valid HTML with correct animations |
| scene.render() | Full end-to-end: Python → HTML → Node CLI → MP4 |
| Error handling | Missing Node.js, missing FFmpeg, invalid manifest |

### 4. Core Renderer Edge Cases
Push the rendering pipeline to its limits.

| Test | What to verify |
|------|---------------|
| Very short video | 0.5s duration, 15 frames |
| Very long video | 60s duration, 1800 frames (does it complete without OOM?) |
| High resolution | 3840x2160 (4K) render |
| Odd dimensions | 1921x1081 (odd numbers — H.264 needs even) |
| Low FPS | 1 fps |
| High FPS | 60 fps |
| Empty HTML page | Blank page with no content — should render without error |
| Heavy page | 100+ DOM elements, 50+ animations |
| External resources | Page with Google Fonts, CDN scripts (GSAP), external images |
| setTimeout chains | Deeply nested setTimeout callbacks |
| setInterval | Interval that runs entire duration |
| CSS variables | Animations using CSS custom properties |
| SVG animation | Animated SVG (SMIL or CSS) |
| Canvas 2D | Raw canvas drawing with requestAnimationFrame |
| WebGL (Three.js) | Basic Three.js scene renders |
| Async content | Page that fetches data then renders |
| Console errors | Page with JS errors — should warn but not crash |
| No rAF usage | Page with only CSS animations, no JS |

### 5. Composition Pipeline
Test multi-scene rendering and transitions.

| Test | What to verify |
|------|---------------|
| 2 scenes, no transition | Produces correct duration |
| 2 scenes, fade transition | Transition renders smoothly |
| 3+ scenes | Duration math correct (total - transition overlaps) |
| Different resolutions per scene | All scenes render at composition canvas size |
| Invalid transition type | Error message is helpful |
| Single scene composition | Should just copy/pass through |
| 10+ scenes | Does it handle many scenes without issues? |

### 6. Subtitle Engine
Test SRT/VTT parsing and overlay generation.

| Test | What to verify |
|------|---------------|
| Valid SRT | All entries parsed with correct timestamps |
| Valid VTT | WebVTT format parsed correctly |
| Overlapping subtitles | What happens when two subtitles overlap in time? |
| Unicode text | Non-ASCII characters (Chinese, Arabic, emoji) |
| Empty lines | Blank subtitle entries don't crash |
| Overlay injection | Generated JS correctly shows/hides text at virtual time |

### 7. CLI Commands
Test all 3 CLI commands with various inputs.

| Test | What to verify |
|------|---------------|
| `render` with HTML | `--duration` required, error if missing |
| `render` with JSON | Reads manifest, resolves entry relative to manifest |
| `render` with output override | `-o custom.mp4` overrides manifest output |
| `preview` with frame 0 | First frame captured correctly |
| `preview` with last frame | Last frame of video |
| `preview` with frame beyond range | Clamps to valid range, no crash |
| `compose` with composition.json | Multi-scene renders and joins |
| `compose` with invalid JSON | Helpful error message |
| `--help` for all commands | Help text is clear and complete |
| Version flag | `--version` shows correct version |

### 8. MCP Server
Test the MCP protocol tools.

| Test | What to verify |
|------|---------------|
| Server starts | `node packages/mcp-server/dist/index.js` launches |
| frameforge_render tool | Renders a video via MCP call |
| frameforge_validate tool | Validates manifest and returns summary |
| Invalid input | Returns error, doesn't crash |

### 9. Studio Server
Test the Studio preview server.

| Test | What to verify |
|------|---------------|
| Server starts | Launches on port 6639 |
| API endpoint | `/api/info` returns scene metadata |
| WebSocket connection | Client connects and receives info |
| Frame seek | Requesting a frame returns JPEG data |
| Hot-reload | Changing source file triggers reload message |
| Multiple sessions | Two browser tabs don't crash server |

---

## Execution Strategy

1. Run tests by category, top to bottom
2. Log every failure in a table
3. Fix each failure immediately
4. Re-test after fix
5. Move to next category only when current is 100% pass

---

## Success Criteria

- [ ] Clean npm install → render works in < 2 minutes
- [ ] TypeScript SDK: all elements, all primitives, codegen correct
- [ ] Python SDK: full end-to-end Python → MP4 pipeline works
- [ ] Core renderer handles all edge cases without crash
- [ ] Composition with transitions produces correct output
- [ ] Subtitle engine parses SRT/VTT correctly
- [ ] All CLI commands work with all valid inputs
- [ ] All error messages are helpful and actionable
- [ ] Zero crashes across all test scenarios
