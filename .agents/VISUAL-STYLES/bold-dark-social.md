# Visual Style: Bold Dark Social

**Category:** High-Contrast Kinetic / Social-First
**Mood:** Energy, urgency, immediacy, FOMO
**Best For:** TikTok, Instagram Reels, short-form social, viral hooks, entertainment, high-energy business content

---

## Aesthetic Summary

No patience. Maximum contrast. The first frame needs to earn the second. This style is designed for an environment where the viewer's thumb is already halfway to a swipe — every visual event must feel like a reason to stay.

Dark backgrounds make color explode. White text on black reads at a glance. Motion is fast, decisive, no lingering. Elements snap in, hold their beat, snap out. The visual grammar is closer to a music video edit than a corporate presentation. The goal isn't beauty — it's *grip*.

This style works because of contrast: dark backgrounds make light elements pop. Fast elements make held elements feel heavy. Empty frames make full frames feel loud.

---

## Color Palette

| Token | Hex | Use |
|-------|-----|-----|
| `void` | `#000000` | Primary background |
| `surface-dark` | `#0F0F0F` | Card backgrounds, subtle elevation |
| `white` | `#FFFFFF` | Primary text — maximum contrast |
| `white-70` | `rgba(255,255,255,0.7)` | Secondary text |
| `white-20` | `rgba(255,255,255,0.2)` | Borders, dividers |
| `punch` | `#FF2D55` | Primary accent — alert, urgency, calls to action |
| `punch-alt` | `#FF6B00` | Secondary accent — swap to match brand |
| `electric` | `#00E5FF` | Technical/data accent — cold, precise |

**Rules:**
- Dark is the dominant value — never a white or light background in this style
- `punch` is the visual alarm — reserve it for the most important element per overlay
- One accent color per overlay (don't mix punch + electric in the same frame)
- White text only — never dark text in this style

**Brand override:** The `punch` color can be swapped for a brand color via `--brand-punch`. When user specifies a brand color, apply it as `punch`.

---

## Typography

### Primary: Space Grotesk (everything)
```css
font-family: 'Space Grotesk', 'Arial Black', Impact, sans-serif;
font-weight: 900;
letter-spacing: -0.04em;
text-transform: uppercase;
color: #FFFFFF;
```

### Secondary labels:
```css
font-family: 'Inter', system-ui, sans-serif;
font-weight: 600;
letter-spacing: 0.12em;
text-transform: uppercase;
color: rgba(255,255,255,0.6);
font-size: 22px;
```

### Size Scale (Portrait 1080px wide)
| Role | Size | Feel |
|------|------|------|
| Hero slam | 200–280px | FILLS THE FRAME |
| Section statement | 100–140px | DEMANDS ATTENTION |
| Stat number | 160–240px | UNDENIABLE |
| Supporting label | 24–36px | reads in half a second |

### Never
- Mixed case for hero text (all-caps or nothing)
- Serif fonts
- Sizes below 80px for primary elements

---

## Motion Vocabulary

**Entry philosophy:** Snap. Not slide, not fade — *snap*. Elements appear with attitude. They don't gently arrive. They show up.

```javascript
// Snap-in with scale punch
gsap.fromTo(el, { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'power3.out' })

// Slam — zero entry time, immediate presence
gsap.set(el, { opacity: 1 });
gsap.fromTo(el, { scaleY: 0, transformOrigin: 'top center' }, { scaleY: 1, duration: 0.2, ease: 'power4.out' })

// Number snap-count
gsap.to(counter, { innerHTML: target, duration: 0.8, ease: 'power2.out', snap: { innerHTML: 1 } })

// Exit — quick fade
gsap.to(el, { opacity: 0, duration: 0.2, ease: 'power2.in' })

// Flash — instant on, instant off
el._tl.set(el, { opacity: 1 }, 0);
el._tl.set(el, { opacity: 0 }, 0.35); // hold 350ms only
```

**Easing:** `power3.out` or `power4.out` for entries — aggressive. `power2.in` for exits — quick. `back.out(1.4)` sparingly for elements that need a physical pop.

**Hold duration:** Shorter than you think. 3000–4000ms for stat cards. 5000–6000ms for complex overlays. The urgency of this style is partly in how quickly things pass.

---

## Structural Elements

**The slash/bar accent:**
```css
width: 5px;
height: 64px;
background: #FF2D55;
border-radius: 0; /* sharp, no radius in this style */
```

**Dark card:**
```css
background: rgba(15, 15, 15, 0.97);
border: 2px solid rgba(255,255,255,0.15);
border-radius: 4px; /* minimal radius */
padding: 24px 32px;
```

**Punch border:**
```css
border: 3px solid #FF2D55;
border-radius: 4px;
```

**Color fill background (for word slams):**
```css
background: #FF2D55;
position: fixed;
top: 0; left: 0;
width: 100%; height: 100%;
/* full-frame flash */
```

---

## Layout Patterns

**Full-frame word slam (most powerful):**
```css
position: absolute;
top: 50%; left: 50%;
transform: translate(-50%, -50%);
font-size: 200px; /* fills 1080px width */
text-align: center;
```

**Lower-center CTA:**
```css
position: absolute;
bottom: 260px;
left: 50%;
transform: translateX(-50%);
white-space: nowrap;
```

**Top-anchored label:**
```css
position: absolute;
top: 120px;
left: 60px;
right: 60px;
```

---

## Signature Patterns

**The pattern interrupt opener:** Start with a full-frame color flash at t=0.2s. White text appears over it. Flash clears. Viewer is hooked.

**The stat hit:** Number counts up (0.8s), holds 2.5s. BANG. The label fades in beneath. No transition, no build — it's already there when you look.

**The word sequence:** WORD ONE → WORD TWO → WORD THREE. Each slams in 80ms after the previous, staggered via timeline. Each word creates suspense for the next.

**The proof stack:** Three overlapping credibility lines appear sequentially, each adding weight to the previous. By the third, the viewer believes.

---

## Anti-Patterns

- **Gentle easing** — `ease: 'power1.out'` has no place here
- **Soft colors** — pastels, muted tones break the contrast logic
- **Long hold times** — 8000ms is comfortable, this style is not comfortable
- **Multiple accent colors** — dilutes the urgency signal
- **Cards with rounded corners > 8px** — too friendly for this aesthetic
- **Fade-ins over 0.4s** — every extra second of fade is a lost frame of grip

---

*Bold dark social is for content that fights for attention and wins.*
