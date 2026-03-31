# Summary

'Kinetic Typography' is a video-native design system where words are the primary visual medium. Inspired by lyric videos, motion title sequences, and high-energy editorial reels. There are no illustrations, no photos, no complex graphics — just type in motion, at scale. The discipline is in making text feel alive without making it feel busy.

# Style

Stark monochromatic base: pure black (#000000) or pure white (#FFFFFF) background (choose per video). Type uses a single-family system — 'Bebas Neue' for all-caps kinetic headers, 'Inter Variable' for body reveals. Words, phrases, and individual characters are the animation units. The defining technique: text enters not as a block but as individual words or characters — splitting, scaling, fading, wiping — each word taking exactly the time it takes to be read. Rhythm is everything.

## Spec

### Core Aesthetics
- **Color Palette (Dark Mode)**: Background: `#000000`; Text: `#FFFFFF`; Accent: any single color — `#FF3B30`, `#FFCC00`, `#00FF87` (pick one per video, use for single-word emphasis only).
- **Color Palette (Light Mode)**: Background: `#FFFFFF`; Text: `#000000`; Accent: same rule.
- **Typography**:
  - **Hero Words**: 'Bebas Neue', weight 400 (it's display-only), tracking 0.01em. Fluid sizing: `clamp(5rem, 18vw, 14rem)`.
  - **Phrase / Body**: 'Inter Variable', weight 200–800 (vary per phrase for emphasis). Tracking 0–0.05em.
  - **Accent Word**: Same font as context, but colored with accent color. Never more than 1–2 words per scene.
- **Visual Effects**:
  - **No backgrounds effects**: No blobs, no gradients, no noise. Pure type on pure ground.
  - **Stagger Mask Reveals**: Words clip-reveal from below or scale-reveal from 0%.
  - **Color Flash**: Single frame (4–6 frames at 60fps) of inverted or accent color on beat.
- **Animations**: Beat-synchronized — every major entrance hits a musical beat or spoken word. Use `cubic-bezier(0.22, 1, 0.36, 1)` for entries. Exits: fast fade (0.2s) or snap-cut (immediate).

# Layout & Structure

Full-canvas type. No containers, no frames. Words occupy the canvas at scale — a 5-word phrase can span the full width. Vertical centering is loose — headlines can sit high, mid, or low by design. Negative space is intentional breathing room between beats.

## Title Card

Blank canvas for 12 frames (0.2s). Then: product name enters — either scaling from 50%→100% (punch-in) or wiping left-to-right. Color: white on black or black on white. Duration on screen: 1.5–2s before first scene transition. No other elements.

## Opening Scene

The video's thesis statement: 2–5 words at maximum scale. Each word enters on a beat — either:
- **Stagger up**: Each word translates `Y(60px)→Y(0)`, staggered 0.08s apart
- **Stamp in**: Each word scales from `scale(1.3) opacity(0)` → `scale(1) opacity(1)`, 0.15s
- **Wipe across**: Words appear left-to-right with a `clip-path: inset(0 100% 0 0)` → `inset(0 0% 0 0)` reveal

After the statement lands: hold for 1s. Then either fade out or snap-cut to next beat.

## Phrase Section

The body of the video. Rapid-fire phrases in sync with audio (VO, music, or rhythm). Each phrase: 0.3s–1.5s on screen. Key techniques:
- **Scale contrast**: First word huge (hero size), second word small (caption size), same line — creates visual hierarchy without design elements
- **Weight contrast**: Same font, weight 800 then weight 200, alternating phrases
- **Position flip**: One phrase left-aligned, next right-aligned, next centered — visual rhythm
- Words or characters split into individual animation units for fine control

## End Card

A final emphatic statement — the most important message. Enters with the most aggressive animation in the video (stamp-in or zoom-out: `scale(1.5)→scale(1)`). Holds for 3s. Then: product name appears below in smaller weight. Optional: accent-color underline draws in left-to-right beneath key word. Fade to black/white.

# Special Components

## Word Split

Breaks a sentence into individual `<span>` elements per word, enabling per-word animation.

```html
<div class="phrase">
  <span class="word">Every</span>
  <span class="word">word</span>
  <span class="word">moves.</span>
</div>
```
GSAP `staggerTo()` or per-span `animation-delay` increments of 0.08s–0.15s.

## Character Split

For single impactful words — split into individual characters for fine-grain stagger.

Each character: `display: inline-block`. Stagger: 0.03s per character. Entry: `translateY(40px) opacity(0)` → `translateY(0) opacity(1)`. Gives a 'raining down' or 'wave' effect.

## Stamp In

A high-energy word entrance used for the most emphatic beats.

Starting state: `scale(1.4) opacity(0)`. End state: `scale(1) opacity(1)`. Duration: 0.12s. Easing: `ease-out`. Optional: add a 1-frame (0.016s) white flash on the same beat for impact.

## Scale Contrast Pair

Two words on the same line at radically different sizes for hierarchy without decoration.

```
[HUGE WORD]  small context word
```
Implemented as flexbox with `align-items: baseline`. Large: `font-size: 8rem`. Small: `font-size: 1.2rem`. Both in same font, both uppercase.

# Special Notes

MUST: Sync animation timing to audio beats — kinetic type without rhythm is just fast text.
MUST: Allow breathing room between phrases — 0.3s–0.5s of blank canvas between beats resets the eye.
MUST: Limit the accent color to maximum 3 uses per video — overuse destroys the emphasis effect.
DO NOT: Animate more than 3 elements simultaneously — simultaneous motion creates noise, not energy.
DO NOT: Use italic text — it softens the energy. This is a bold, declarative system.
DO NOT: Mix more than 2 font sizes in a single phrase — scale contrast works in pairs, not palettes.

## Kino Rendering

- **Recommended**: GSAP (`SplitText` pattern or manual word spans + `staggerTo()`)
- **Audio sync**: Use kino's time virtualization — set animation keyframes to exact frame numbers matching beat positions (e.g., beat at 1.2s = frame 72 at 60fps)
- **Scene duration**: 15–60s | **FPS**: 60 | **Canvas**: 1080×1920 (vertical for Reels/Shorts) or 1920×1080
- **Beat mapping**: Provide beat timestamps in scene manifest; set GSAP timeline position by seconds, not duration
