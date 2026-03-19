# Visual Style: Minimal Authority

**Category:** Clean Confidence / Professional Editorial
**Mood:** Expertise, restraint, earned credibility
**Best For:** LinkedIn, founder content, business thought leadership, B2B, expertise positioning

---

## Aesthetic Summary

The style of someone who doesn't need to shout. White space is deliberate. Typography is precise. Color is used once — at the exact moment it needs to land. The overall feeling is a Bloomberg or WSJ editorial translated into motion — authoritative, minimal, expensive-looking. Nothing is there by accident. Everything earns its place.

The paradox of this style: the less you do visually, the more authority it projects. An empty white frame with one precisely-placed number reads as confident. The same frame cluttered with 4 elements reads as anxious.

---

## Color Palette

| Token | Hex | Use |
|-------|-----|-----|
| `background` | `#FFFFFF` | Frame background (white canvas) |
| `surface` | `#F5F5F5` | Card backgrounds, subtle containers |
| `ink` | `#0D0D0D` | Primary text, borders |
| `ink-secondary` | `rgba(13,13,13,0.5)` | Secondary labels, subtitles |
| `accent` | `#0052CC` | Single accent — numbers, borders, CTAs |
| `accent-light` | `rgba(0,82,204,0.08)` | Card tint, hover states |
| `white` | `#FFFFFF` | Text on dark backgrounds |

**Rules:**
- Accent is used in exactly ONE place per overlay (a border, a number, a line)
- No gradients
- No shadows (exception: 1px subtle card border)
- Text on white: use `#0D0D0D` not `#000000` — the contrast is slightly softer

---

## Typography

### Primary: Space Grotesk (headers, numbers, main text)
```css
font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
font-weight: 700;
letter-spacing: -0.03em;
color: #0D0D0D;
```

### Secondary: Inter (labels, subtitles, body)
```css
font-family: 'Inter', system-ui, sans-serif;
font-weight: 500;
letter-spacing: 0.02em;
color: rgba(13,13,13,0.55);
text-transform: uppercase;
font-size: 24px; /* on 1080-wide portrait */
```

### Size Scale (Portrait 1080px wide)
| Role | Size | Weight |
|------|------|--------|
| Hero stat | 160–220px | 700 |
| Section header | 80–120px | 700 |
| Quote text | 52–72px | 600 |
| Label | 20–28px | 500 |
| Caption (no overlap) | — | — |

### Never
- All-caps for body text (only for labels/tabs, max 3 words)
- Outline/stroke fonts
- Font sizes below 52px for primary elements on portrait

---

## Motion Vocabulary

**Entry philosophy:** Confident arrivals. Elements slide in with weight — not bounce, not spring, not pop. They arrive because they belong there.

```javascript
// Standard entry — clean slide up
gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' })

// Number reveal — count up with clean ease
gsap.to(counter, { innerHTML: targetValue, duration: 1.4, ease: 'power3.out', snap: { innerHTML: 1 } })

// Line draw — accent line sweeps in
gsap.fromTo(line, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.6, ease: 'power2.out' })

// Exit — fade and lift slightly
gsap.to(el, { opacity: 0, y: -16, duration: 0.4, ease: 'power2.in' })
```

**Easing:** `power2.out` for entries, `power2.in` for exits. Never `back.out`, `elastic`, or `bounce` — those communicate playfulness, not authority.

**Hold duration:** Longer than you think. A stat card at 6000ms feels slow in isolation but professional in context. Authority is patient.

---

## Structural Elements

**The accent line:**
```css
width: 3px;
height: 56px;
background: #0052CC;
border-radius: 1px;
/* use as left border of identity elements */
```

**Card container:**
```css
background: rgba(245, 245, 245, 0.97);
border: 1px solid rgba(13,13,13,0.08);
border-radius: 8px;
padding: 28px 36px;
```

**Rule divider:**
```css
height: 1px;
background: rgba(13,13,13,0.12);
width: 100%;
```

---

## Overlay Positioning

**Portrait lower-third (identity):**
```css
position: absolute;
bottom: 220px; /* above caption zone */
left: 60px;
display: flex;
align-items: center;
gap: 20px;
```

**Portrait hero stat (center):**
```css
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
text-align: center;
```

**Portrait right-anchored stat card:**
```css
position: absolute;
top: 35%;
right: 60px;
max-width: 480px;
```

---

## Use Case Examples

**Founder identity (lower-third):**
- White background, accent line left, name in Space Grotesk 42px, role in Inter 24px 50% opacity
- Slides up from below, holds 5s, fades out

**Revenue stat:**
- Center-frame, large counter (160-220px), label below in Inter uppercase
- Accent color on the number only, everything else is ink

**Quote pull:**
- Full-width, centered, Space Grotesk 64px, no decoration, 65% opacity ink
- Slow fade in (0.8s), long hold (6s), slow fade out (0.5s)

**CTA card:**
- Card with accent-light background, accent border-left, bold action text
- Subtle arrow or → in accent color

---

## Anti-Patterns

These will break the minimal-authority aesthetic:
- **Orange** — this is kinetic-orange territory, not this style
- **Uppercase everything** — only labels, never body text
- **Bounce or spring easing** — this is not a startup pitch, it's a board meeting
- **Multiple accent colors** — one accent, used once per overlay
- **Busy backgrounds** — the white canvas IS the aesthetic
- **Text below 52px** — this style is about precision, not density

---

*Minimal authority is the style of someone who has already won.*
