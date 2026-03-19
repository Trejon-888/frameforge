# Visual Style: Clean Professional

**Category:** Corporate Editorial / Trust-First
**Mood:** Clarity, reliability, organized expertise
**Best For:** YouTube, B2B explainers, educational content, agency/SaaS demos, presentations, how-to videos

---

## Aesthetic Summary

This style communicates that you've done the thinking before the viewer arrived. Information is organized. Hierarchy is clear. Color guides the eye rather than grabs it. The viewer feels oriented, not overwhelmed.

Think: a well-designed product landing page brought into motion. Clean backgrounds. Structured layouts. Data that's easy to parse. CTAs that feel natural, not forced. The production quality says *this team knows what they're doing* without announcing it.

This style works at any density. It's the flexible professional — equally at home in a 3-minute YouTube explainer or a 30-second LinkedIn ad. Its superpower is legibility and trust.

---

## Color Palette

| Token | Hex | Use |
|-------|-----|-----|
| `base` | `#FFFFFF` | Primary background |
| `surface` | `#F8F9FC` | Card backgrounds, elevated containers |
| `surface-2` | `#ECEEF4` | Subtle dividers, inactive states |
| `ink` | `#1A1A2E` | Primary text — deep navy-black |
| `ink-secondary` | `rgba(26,26,46,0.55)` | Secondary labels |
| `primary` | `#2563EB` | Action color — links, CTAs, progress |
| `primary-light` | `rgba(37,99,235,0.1)` | Card tint, highlight backgrounds |
| `success` | `#16A34A` | Positive results, growth, green metrics |
| `data-1` | `#2563EB` | Primary data series |
| `data-2` | `#7C3AED` | Secondary data series |

**Rules:**
- Primary blue is the trusted action color — apply to the one thing you want the viewer to notice
- Never use `success` and `primary` in the same overlay
- Backgrounds are always white or very light — never dark in this style
- Text is `ink` (#1A1A2E) not pure black — it reads more professionally

---

## Typography

### Primary: Inter (everything)
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
font-weight: 700;
letter-spacing: -0.02em;
color: #1A1A2E;
```

### Display numbers:
```css
font-family: 'Space Grotesk', 'Inter', sans-serif;
font-weight: 700;
letter-spacing: -0.04em;
color: #2563EB; /* primary color for data */
```

### Labels:
```css
font-family: 'Inter', sans-serif;
font-weight: 500;
font-size: 20px;
letter-spacing: 0.04em;
text-transform: uppercase;
color: rgba(26,26,46,0.5);
```

### Size Scale (Portrait 1080px wide)
| Role | Size | Weight |
|------|------|--------|
| Hero number | 120–180px | 700 |
| Section header | 64–96px | 700 |
| Body statement | 48–64px | 600 |
| Label | 18–24px | 500 |
| Annotation | 16–20px | 400 |

### Never
- All-caps beyond short labels (3 words max)
- Font sizes below 48px for primary elements
- More than 2 font sizes in one overlay

---

## Motion Vocabulary

**Entry philosophy:** Purposeful and clean. Elements appear as though they were always meant to be there — not dramatically, not tentatively, just clearly. Motion is a communication tool, not decoration.

```javascript
// Standard entry — slide in from bottom
gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })

// Data reveal — elements stack in sequence
gsap.fromTo(items, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out', stagger: 0.08 })

// Line/bar fill — progress visualization
gsap.fromTo(bar, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 1.0, ease: 'power2.inOut' })

// Number count-up
gsap.to(counter, { innerHTML: target, duration: 1.2, ease: 'power2.out', snap: { innerHTML: 1 } })

// Exit — clean fade
gsap.to(el, { opacity: 0, y: -12, duration: 0.4, ease: 'power2.in' })
```

**Easing:** `power2.out` for entries and slides, `power2.inOut` for fills and progress bars, `power2.in` for exits. `back.out(1.2)` permitted for icon/badge entries where a subtle pop is appropriate.

**Hold duration:** Comfortable. 5000–7000ms for stat cards. 4000–5000ms for labels. 6000–8000ms for process flows (people need time to read steps).

---

## Structural Elements

**Standard card:**
```css
background: #F8F9FC;
border: 1px solid #ECEEF4;
border-radius: 12px;
padding: 28px 36px;
box-shadow: none; /* clean, no shadows */
```

**Accent card (highlighted):**
```css
background: rgba(37,99,235,0.07);
border: 1.5px solid rgba(37,99,235,0.25);
border-radius: 12px;
padding: 28px 36px;
```

**Progress bar:**
```css
height: 6px;
background: #ECEEF4;
border-radius: 3px;
/* fill bar inside */
.fill {
  height: 100%;
  background: #2563EB;
  border-radius: 3px;
}
```

**Step indicator:**
```css
width: 36px;
height: 36px;
border-radius: 50%;
background: #2563EB;
color: #FFFFFF;
font-size: 16px;
font-weight: 700;
display: flex;
align-items: center;
justify-content: center;
```

**Divider:**
```css
height: 1px;
background: #ECEEF4;
margin: 16px 0;
```

---

## Layout Patterns

**Portrait stat card (right-anchored):**
```css
position: absolute;
top: 30%;
right: 56px;
width: 440px;
```

**Portrait lower-third:**
```css
position: absolute;
bottom: 220px;
left: 56px;
right: 56px;
```

**Portrait center-stage (hero numbers):**
```css
position: absolute;
top: 42%;
left: 50%;
transform: translate(-50%, -50%);
text-align: center;
width: 80%;
```

**Portrait process list:**
```css
position: absolute;
top: 25%;
left: 56px;
right: 56px;
display: flex;
flex-direction: column;
gap: 24px;
```

---

## Overlay Patterns

**Metric card:** number + label + optional comparison. Card container, centered stat, lighter label below. Primary color on number only.

**Process step list:** 3-4 steps with step circles and text. Items stagger in at 80ms intervals. Step circle is primary blue, text is ink.

**Chapter marker:** Thin horizontal line + title. Line draws in from left (0.5s), text fades in immediately after. Positioned at top of frame (y: 80-120px).

**Lower-third identity:** Horizontal layout, name + role. Clean, no excessive decoration. Optional: small logo on right.

**Data callout:** Stat + context in a card. "+300% growth" with "year over year" below in secondary color. Card background is primary-light.

---

## Anti-Patterns

- **Dark backgrounds** — this is the light-and-clean style, reserve dark for bold-dark-social
- **Orange or red accents** — use primary blue and success green only
- **Cluttered layouts** — this style breathes; max 3 elements per overlay
- **Fast/snappy motion** — power2 not power4, professional not aggressive
- **All-caps everywhere** — only labels, this style respects sentence case
- **Mixed card styles** — if you use rounded-12 on one card, use it on all cards

---

*Clean professional is the style of content that respects the viewer's time.*
