# Summary

'Soft Wellness' is a Gen-Z design system for health, mindfulness, journaling, and lifestyle content. It feels warm, unhurried, and human. The visual language is pastel-organic: blobs that breathe, type that drifts like a leaf, and a color palette that feels like a Sunday morning. Everything here is intentionally anti-corporate and anti-aggressive.

# Style

Warm off-white foundation (#FDFCF8, #FAF7F2) layered with soft pastels: coral (#FFB7B2), sage (#B8D4B8), lavender (#D4C5E9), peach (#F2C4A0), and sky (#BFD7EA). Typography pairs 'DM Serif Display' (elegant, warm serif for headlines) with 'DM Sans' (friendly, rounded sans for body). Every shape has maximum border-radius — pill shapes, blobs, circles. Motion is slow, organic, and continuous — nothing snaps, nothing rushes.

## Spec

### Core Aesthetics
- **Color Palette**: Background: `#FDFCF8`; Surface: `#FAF7F2`; Coral: `#FFB7B2`; Sage: `#B8D4B8`; Lavender: `#D4C5E9`; Peach: `#F2C4A0`; Text Primary: `#2C2C2C`; Text Secondary: `rgba(44, 44, 44, 0.55)`.
- **Typography**:
  - **Headlines**: 'DM Serif Display', weight 400 (italic variant for tenderness), font-size: `clamp(2.8rem, 8vw, 7rem)`, line-height 1.15.
  - **Sub-labels**: 'DM Sans', weight 500, tracking 0.08em, uppercase, 11px–12px. Color: `rgba(44,44,44,0.5)`.
  - **Body**: 'DM Sans', weight 300–400, line-height 1.75, `rgba(44,44,44,0.8)`.
- **Visual Effects**:
  - **Grain Overlay**: Fine SVG noise at 5% opacity — gives warmth and print-like texture.
  - **Organic Blobs**: CSS shapes with extreme border-radius variation (`60%/40%/50%/60% / 40%/60%/70%/30%`), filled with pastel colors at 60–80% opacity. Gently morph shape and drift position over 8–15s.
  - **Soft Shadows**: All cards use `box-shadow: 0 4px 24px rgba(0,0,0,0.06)` — barely perceptible, just depth.
- **Animations**: Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for element entrances (gentle spring). Blob morphing: CSS `border-radius` keyframes over 8–12s. All transitions ≥ 0.5s. Nothing faster than 0.3s.

# Layout & Structure

Loose, organic layout. Centered or slightly offset content. Cards use very large border-radius (24px–40px). Generous whitespace. Multiple pastel blobs in background layer. The feeling is a digital garden, not a grid.

## Title Card

Centered. A small rounded pill label at top in DM Sans 11px uppercase: `[category] · [season or date]` in `rgba(44,44,44,0.4)`. Below: product or content name in DM Serif Display italic. Below: a soft coral or sage horizontal squiggle SVG (~3px path, rounded caps). All elements float up from `translateY(20px)` over 0.8s with a gentle spring. Blobs are already animating in background before any text appears.

## Opening Scene

A centered 'comfort card' — large rounded card (border-radius: 32px), soft shadow, white/cream fill. Inside: a short inspirational phrase or value proposition in DM Serif Display italic, 3–4 words large, then 1–2 lines of DM Sans body below. Optional: a small pastel icon or abstract shape above the headline. Card enters: scales from `scale(0.94) opacity(0)` → `scale(1) opacity(1)` over 0.7s with spring. Background blobs drift slowly throughout.

## Feature Section

Vertical card stack (mobile-first). Each card: pastel background fill (use different pastel per card — coral, sage, lavender, peach in sequence), `border-radius: 28px`, `padding: 40px`. Top: category label in DM Sans uppercase. Middle: headline in DM Serif Display. Bottom: 1–2 lines body copy. Cards stagger in from bottom: `translateY(40px) opacity(0)` → rest, 0.25s between cards.

## End Card

Full-bleed soft gradient: `linear-gradient(135deg, #FFB7B2 0%, #D4C5E9 50%, #BFD7EA 100%)`. Centered. Product name in DM Serif Display white or `#2C2C2C` depending on gradient. Below: a sub-label in DM Sans. Below: a minimal CTA pill button (white background, `#2C2C2C` text, 9999px border-radius, soft shadow). Scene: blobs drift through gradient, fade to `#FDFCF8`.

# Special Components

## Breathing Blob

An organic shape that slowly morphs and drifts, simulating a living organism.

CSS `@keyframes` on `border-radius` between 2–3 states:
```css
@keyframes blob-morph {
  0%   { border-radius: 60% 40% 50% 60% / 40% 60% 70% 30%; }
  50%  { border-radius: 40% 70% 30% 60% / 60% 40% 50% 40%; }
  100% { border-radius: 60% 40% 50% 60% / 40% 60% 70% 30%; }
}
```
Duration: 8–12s. Simultaneously: `transform: translate()` drifts ±20px in X and Y over 12–18s.

## Comfort Card

The signature container of this style.

`background: #FFFFFF` (or very light pastel tint). `border-radius: 28px–40px`. `box-shadow: 0 4px 32px rgba(0,0,0,0.07)`. `padding: 48px`. Optional: a subtle top-edge gradient `border-image` in the card's signature pastel color. Content is vertically centered.

## Serif Italic Headline

DM Serif Display in italic for warmth and humanity.

`font-family: 'DM Serif Display'` | `font-style: italic` | `font-weight: 400`. Render via Google Fonts `?display=swap`. This is NOT a decorative choice — the italic weight in DM Serif Display is a distinct, humanist cut designed for reading.

## Squiggle Accent

A hand-drawn SVG path used as a section divider or underline.

A simple wavy SVG path (~200px wide, 3px stroke, `stroke-linecap: round`). Colored in the section's pastel accent. Animates in with `stroke-dashoffset` draw effect (0.6s). Positioned below headlines, above CTA buttons.

# Special Notes

MUST: Animate the background blobs before any content appears — they establish the warmth before the message.
MUST: Use the italic variant of DM Serif Display — the roman cut is less characteristic of this style.
MUST: Apply grain overlay — without it, the pastels look flat and digital.
DO NOT: Use any sharp corners (border-radius: 0) — they break the organic feel entirely.
DO NOT: Use pure black for text — `#2C2C2C` keeps text warm; pure black is too harsh for this palette.
DO NOT: Use fast animations (< 0.4s) — this style communicates calm, and rushed motion undermines it.

## Kino Rendering

- **Recommended**: CSS-only (blob morph via `@keyframes`, card entrance with CSS `transition`)
- **Accent**: GSAP for sequential card stagger timing
- **Scene duration**: 15–30s | **FPS**: 30 (slower FPS fits the calm aesthetic) or 60 | **Canvas**: 1080×1920 (vertical, Instagram/TikTok) or 1920×1080
- **Note**: SVG squiggle paths render perfectly in kino's headless Chrome — use `stroke-dashoffset` animation for draw effects
