# Plan: Video Quality v2 — From Template to Showpiece

**Status:** Ready
**Priority:** P0 — Product testing through creation
**Date:** 2026-03-15

---

## Problem Statement

The current social media videos are functional but uninspiring. They look like templates, not like content that would stop someone scrolling. Rating: 4-5/10 across the board.

### Root causes:
1. Only using fade + slide animations (boring)
2. Slow hooks (2-3s to first interesting frame)
3. Neo-Brutalist style is color-only, not applied to motion/energy
4. Dead space — not using the full canvas
5. No canvas/SVG/generative visuals
6. No motion design principles (anticipation, overshoot, follow-through)
7. Typography is small and polite instead of bold and filling the frame

---

## Target: What 10/10 Looks Like

1. **First frame is scroll-stopping** — Bold text filling 80% of screen, high contrast
2. **Hook in 0.5s** — Not 2 seconds. Immediate visual impact.
3. **Constant motion** — Something is always moving. No dead moments.
4. **Typography IS the design** — Words fill the frame. Size 120px+. Mixed weights.
5. **Canvas/SVG effects** — Particles, path drawing, generative patterns
6. **Neo-Brutalist MOTION** — Elements slam in, snap to position, have weight. Shadows animate. Borders draw on.
7. **Every frame is a poster** — Pause at any point and it looks designed.
8. **Kinetic typography** — Words that split, rotate, scale, reveal character by character
9. **Scene transitions within one video** — Background color shifts, layout transforms
10. **Sound-ready pacing** — Visual beats at regular intervals even without audio

---

## Techniques to Implement

### Animation Upgrades
| Technique | How | Impact |
|-----------|-----|--------|
| Kinetic typography | Character-by-character reveal with scale + rotation per letter | High — looks professional |
| Canvas particles | Spawn particles on element appearance, floating geometric shapes | High — adds life |
| SVG path drawing | stroke-dashoffset animation for line/icon reveals | Medium — polished |
| Spring physics | Overshoot on all entries, not just ease-in-out | High — feels alive |
| Stagger with offset scale | Each card enters slightly larger then settles to final size | Medium — depth |
| Color wipes | Background transitions from one color to another via expanding circle/rect | High — scene changes |
| Shadow animation | Hard shadows animate from 0px to 8px on entry | Medium — Neo-Brutalist motion |
| Border drawing | Border draws around elements via clip-path or border-image | Medium — eye-catching |
| Counting animations | Numbers tick up (like "23 transitions" counting from 0) | Medium — data feels dynamic |
| Glitch/shake | Brief 2-frame shake on impact moments | Low — subtle energy |

### Layout Upgrades
| Principle | Rule |
|-----------|------|
| Fill the frame | Main text should be 100-160px, filling 70%+ of width |
| No dead space | Use full 1080x1920 — elements edge to edge |
| Visual hierarchy | One dominant element per scene, 2-3 supporting |
| Rhythm | New element every 0.5-0.8s — never leave the viewer waiting |

---

## Video Remake Plan

### V2-01: "Any Framework" (Remake)
- Open: Full-screen "ANY" in 200px, slams in with shake
- Each framework name fills the entire screen, 1 per second
- Background color changes per framework (GSAP green, Three.js blue, etc.)
- Canvas particle burst on each transition
- End: "FrameForge" with Neo-Brutalist card + hard shadow animating in

### V2-02: "3 Lines to Video" (Remake)
- Open: "3" fills entire screen (300px), scales down to corner
- Code types character-by-character with cursor blink
- Each line causes a visual change on the right side (split screen)
- Line 1: Scene appears. Line 2: Text appears. Line 3: Play button → video renders
- Result: MP4 file icon slams in with bounce

### V2-03: "Why Not Remotion?" (Remake)
- Open: "REMOTION" fills screen, then gets crossed out with animated X
- Visual strike-through draws across the word
- Splits to show limitations (text flies off screen)
- "FRAMEFORGE" slams in from bottom, fills screen
- Features animate as checkmarks that POP with scale overshoot

### V2-04: "AI → Video" (Remake)
- Open: Chat bubble appears with typing indicator
- Prompt text types out in the bubble
- Split: code writes itself on the right (fast, like a terminal)
- Video frame renders pixel-by-pixel or scan-line style
- Final: MP4 plays in a Neo-Brutalist frame

### V2-05: "Python" (Remake)
- Open: Python logo (drawn SVG) with "🐍" filling screen
- Snake animation draws a path across the canvas
- Code appears along the snake's path
- Terminal output appears: "Rendered in 12s"
- Output card with animated counting stats

---

## Success Criteria

- [ ] Each video scores 8+/10 on self-critique
- [ ] First frame of each video is screenshot-worthy
- [ ] Hook happens within 0.5 seconds
- [ ] At least one "wow" moment per video
- [ ] Uses canvas or SVG in at least 3 of 5 videos
- [ ] Typography fills 70%+ of frame at peak moments
- [ ] Zero dead space — every frame has visual density
