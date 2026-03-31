# Summary

'Swiss Minimalist' is a design system rooted in the International Typographic Style — rigid grid systems, Helvetica Neue dominance, and zero decoration. Every element earns its place or is removed. The aesthetic is disciplined, cold, and prestigious: what high-end architecture firms and luxury fashion brands use when they want to say nothing but mean everything.

# Style

Monochromatic palette anchored in off-white (#F5F4F0) and near-black (#111111), with single-color accents used sparingly (cobalt blue #1A56F0 or deep red #D01C1C — pick one and use it for exactly one purpose). Typography is the entire visual system. Helvetica Neue or 'Inter' at extreme weights (300 and 800) in strict typographic hierarchy. No shadows, no gradients, no textures. Motion is measured and precise — not decorative, but structural.

## Spec

### Core Aesthetics
- **Color Palette**: Background: `#F5F4F0`; Text Primary: `#111111`; Text Secondary: `#999999`; Accent: `#1A56F0` (or `#D01C1C` — choose one, use once); Dividers: `#E0E0E0`.
- **Typography**:
  - **Display**: 'Helvetica Neue' or 'Inter', weight 800, tracking -0.06em, line-height 0.88. Fluid: `clamp(3.5rem, 11vw, 9rem)`.
  - **Caption / Label**: 'Helvetica Neue' or 'Inter', weight 300, tracking 0.08em, uppercase, 10px–12px.
  - **Body**: weight 300, line-height 1.7, no tracking.
- **Visual Effects**:
  - **Grid Lines**: 1px `#E0E0E0` horizontal and vertical dividers that structure the page like a baseline grid. Visible, functional, not decorative.
  - **No Effects**: No blur, no shadows, no gradients, no rounded corners anywhere.
  - **Rule Lines**: 2px horizontal rules in `#111111` used to open or close sections.
- **Animations**: Linear or `ease-in-out` ONLY. Duration: 0.4s–0.8s. Elements enter with opacity 0→1 and 20px Y offset. No bouncing, no spring, no overshoot.

# Layout & Structure

Strict 12-column grid. All content aligns to columns and a baseline unit of 8px. Gutters are generous — breathing room is structural, not cosmetic. Asymmetric column spans are encouraged (e.g., headline spans 9 cols, sidebar spans 3).

## Title Card

Single horizontal row across full width. Left: product name in weight 800, 18px, tracking -0.02em. Center: category label in weight 300 uppercase 10px tracking 0.15em. Right: a single text CTA in weight 300. Separated by 1px vertical rules. The entire row sits 40px from top edge. Fades in over 0.5s, no offset.

## Opening Scene

Type-only composition. A single oversized headline (3–5 words) spans the full canvas, broken across 2–3 lines with deliberate manual line breaks. Below: a 1px rule. Below the rule: a narrow caption block in weight 300 describing context (year, subject, location). No images, no shapes. The headline stacks in line by line, each line fading in with a 0.3s delay from the previous.

## Feature Section

Left column (3/12): vertical index labels stacked top-to-bottom in weight 300 uppercase 10px, each prefixed with a two-digit number (01, 02, 03). Right column (9/12): corresponding content blocks separated by thin horizontal rules. Content blocks fade in sequentially as the left label highlights (accent color) on entry.

## End Card

Centered. Product name massive (display size). Below: a single-line descriptor in weight 300. Below that: a thin 1px rule, then the URL or CTA in weight 300 tracking 0.1em. Accent line appears first, then headline, then descriptor — total entry over 1.2s.

# Special Components

## Baseline Grid Reveal

A composition where a horizontal grid of thin lines (1px, `#E0E0E0`, 40px apart) is revealed top-to-bottom like a venetian blind opening, then content appears on top.

Grid lines draw in left-to-right individually with 0.02s stagger. After grid is complete (0.6s), content elements begin entering. Gives the impression of the grid 'placing' the content.

## Numeric Stagger

A column of large numbers (01–06) that enter one by one, each slightly offset from the last.

Each number: weight 800, `clamp(2rem, 6vw, 5rem)`, 60% opacity. Active number: 100% opacity, accent color. They cycle or enter sequentially with 0.2s stagger.

## Rule Draw

A 1px horizontal line that draws in left-to-right.

`width: 0 → 100%` over 0.8s, `ease-in-out`. Color: `#111111` or `#E0E0E0`. Used as a transition beat between sections — the line draws, then the next content block fades in.

# Special Notes

MUST: Stick to a strict 8px baseline grid — every element's height and margin should be a multiple of 8.
MUST: Use only one accent color per video, deployed in exactly one context (e.g., only for active states, or only for the rule lines, never both).
MUST: Keep animations measured — Swiss Minimalism is NOT kinetic. Motion should feel inevitable, not exciting.
DO NOT: Use more than 2 font weights in the same scene (800 and 300 is the entire system).
DO NOT: Add any decorative elements — no icons, no illustrations, no emoji.
DO NOT: Use color fills on containers — backgrounds are always `#F5F4F0`.

## Kino Rendering

- **Recommended**: CSS-only (pure CSS animations, no GSAP needed — the style is simple enough)
- **Accent**: GSAP only if sequential stagger timing needs precision
- **Scene duration**: 10–25s | **FPS**: 30 or 60 | **Canvas**: 1920×1080 (horizontal preferred — vertical feels cramped)
- **Key techniques**: CSS `transition` on opacity/transform, `width` animation for rule draws, `animation-delay` for sequential fades
