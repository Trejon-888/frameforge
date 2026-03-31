# Summary

'Brutalist Editorial' is a poster-first design system inspired by campaign graphics and magazine spreads. It pairs aggressive grotesque typography with blurred organic gradient forms to create maximum visual tension — raw yet refined. Every frame should feel like it could be printed and wheat-pasted on a wall.

# Style

Built on a warm cream foundation (#E4E2DD) with deep charcoal text and rich red-orange gradient forms (#DB4A2B, #F8A348). Uses 'Clash Display' for display headlines and 'Satoshi' for body text. The defining visual is large, blurred gradient blobs that float behind crisp, oversized type — soft backgrounds, hard foregrounds. Mix-blend-mode interactions and scroll-triggered entrances give it motion energy.

## Spec

### Core Aesthetics
- **Color Palette**: Background: `#E4E2DD`; Text Primary: `#1A1A1A`; Accent Red: `#DB4A2B`; Accent Orange: `#F8A348`; Text Secondary: `rgba(26, 26, 26, 0.5)`.
- **Typography**:
  - **Display**: 'Clash Display', weight 700, tracking -0.04em, line-height 0.9. Fluid sizing: `clamp(4rem, 12vw, 10rem)`.
  - **Sub-labels**: 'Satoshi', weight 500, tracking 0.15em, uppercase, font-size: 11px–13px.
  - **Body**: 'Satoshi', weight 400, leading 1.6.
- **Visual Effects**:
  - **Gradient Blobs**: Large elliptical elements with `filter: blur(80px)`, colors `#DB4A2B` and `#F8A348`, opacity 0.6–0.8. Position: behind all content.
  - **Mix-Blend-Mode**: Text elements use `mix-blend-mode: multiply` against gradient forms for color interaction.
  - **Noise Grain**: SVG turbulence noise overlay at 4% opacity for print texture.
- **Animations**: Use `cubic-bezier(0.25, 0.46, 0.45, 0.94)` for entrances. Elements clip in from bottom edge (clip-path reveal). Large type enters with 120px Y offset, opacity 0.

# Layout & Structure

Asymmetric, borderless grid. No containers — content bleeds to edges. Heavy use of negative space. Headlines are the dominant visual element; images and graphics are secondary.

## Title Card

Minimal. Left-aligned product name in Clash Display 700, 24px. Right-aligned: category label in Satoshi uppercase 11px tracking 0.2em, plus a simple text CTA. Background: `#E4E2DD`. No borders, no boxes. A single red-orange blob animates from scale(0) to scale(1) at 40% opacity over 1s.

## Opening Scene

Full-viewport headline: 2–3 words, massive Clash Display, line-height 0.88. The headline breaks across 2 lines with staggered line reveals — each line clips up from behind a mask with 0.3s delay between lines. Behind the text: a large blurred gradient blob (red→orange) slowly drifts 30px left over 8s (infinite, alternate). Below the headline: a horizontal rule + 2-column split with a left-aligned descriptor paragraph and right-aligned large stat or date.

## Feature Section

Alternating 2-column layout (image/visual left, text right; then text left, visual right). Each text column: large headline (60px), sub-label above in Satoshi uppercase, 2–3 lines of body copy. Visuals: high-contrast geometric shapes or abstract forms on solid accent color backgrounds. Each pair enters with a split-screen wipe: left half enters from left, right half from right, meeting at center.

## End Card

Full-bleed gradient background (red → orange, 135deg). Product name reversed out in `#E4E2DD`. Tagline below in Satoshi 500. Bottom row: URL / handle in mono. Scene fades to `#E4E2DD` on exit.

# Special Components

## Blob Form

A large, organic background shape that gives depth without structure.

Shape: SVG path or CSS border-radius 60%/40%/50%/60% / 70%/30%/40%/80%. Background: `radial-gradient(#F8A348, #DB4A2B)`. `filter: blur(60px-100px)`. Opacity: 0.55. Animation: slow drift — `transform: translate(0, 0)` → `translate(30px, -20px)` over 8–12s, alternate, ease-in-out infinite.

## Headline Clip Reveal

Text enters by unmasking from below — the element is clipped by a parent div with `overflow: hidden`. The text translates from `translateY(100%)` to `translateY(0)` over 0.7s, `cubic-bezier(0.25, 0.46, 0.45, 0.94)`. Each line staggers 0.25s.

## Split Stat

A large isolated number with a descriptor, used to punctuate sections.

Number: Clash Display 700, `clamp(5rem, 15vw, 12rem)`. Color: `#DB4A2B`. Descriptor: Satoshi 500 uppercase 11px, stacked below. The number counts up or scales from 0.8→1 on entry.

# Special Notes

MUST: Keep the grain texture — without it, the gradient blobs look digital and cheap.
MUST: Use line-height ≤ 0.95 for display headlines to create dense, impactful stacking.
MUST: Left-align all body text — centered text breaks the editorial feel.
DO NOT: Use dark backgrounds — the cream is load-bearing; gradients only appear as blobs, not backgrounds.
DO NOT: Add drop shadows to text — mix-blend-mode interactions replace them.
DO NOT: Round the corners of image frames — keep them sharp (0px).

## Kino Rendering

- **Recommended**: GSAP (blob drift, clip-path reveal timeline, stat counters)
- **Accent**: CSS-only for noise grain, mix-blend-mode text
- **Scene duration**: 20–45s | **FPS**: 60 | **Canvas**: 1920×1080 or 1080×1920
- **Key GSAP calls**: `gsap.to()` for blob position drift (infinite), `clipPath` from `inset(100% 0 0 0)` → `inset(0% 0 0 0)` for reveals
