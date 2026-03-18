# Visual Style: Kinetic Orange

**Category:** Digital Brutalist / High-Impact Editorial
**Mood:** Urgency, Technical Sophistication, Authority
**Best For:** AI/tech content, hooks, product demos, thought leadership

---

## Aesthetic Summary

Heavy typography and mechanical motion. Three-color lock: orange, black, white. No gradients, no softness, no apology. Every element announces itself with a border, a slam, or a marquee. Feels like a Bloomberg terminal crossed with a protest poster.

---

## Color Palette

| Token | Hex | Use |
|-------|-----|-----|
| brand-orange | `#FF4D00` | Primary brand, headers, stat numbers, CTA buttons |
| void-black | `#000000` | Backgrounds, borders, secondary text |
| pure-white | `#FFFFFF` | Accent text on dark backgrounds |
| white-70 | `rgba(255,255,255,0.7)` | Secondary text on dark |
| black-70 | `rgba(0,0,0,0.7)` | Dimming veil when needed |

**Rules:**
- Orange is always dominant — never fight it with another color
- Borders are always 2-3px solid black (never colored borders except orange-on-black)
- No gradients, no shadows (only nav depth exception), no pastel anything

---

## Typography

### Headers (Archivo Black)
```css
font-family: 'Archivo Black', 'Arial Black', Impact, sans-serif;
font-weight: 900;
text-transform: uppercase;
letter-spacing: -0.04em;
line-height: 0.85;
```

### Metadata / Labels (Space Mono)
```css
font-family: 'Space Mono', 'Courier New', monospace;
font-weight: 700;
text-transform: uppercase;
letter-spacing: -0.02em;
```

### Size Scale (portrait 1080×1920)
| Use | Size |
|-----|------|
| Hero number / single word | 200-320px |
| Section headline | 100-160px |
| Sub-headline | 60-90px |
| Label | 20-28px |
| Micro / metadata | 16-20px |

---

## Borders

```css
/* Standard */
border: 2px solid #000000;

/* Heavy section divider */
border: 3px solid #000000;

/* Orange accent border */
border-top: 3px solid #FF4D00;

/* Pill element (navigation only) */
border-radius: 9999px;
```

**Rule:** All containers are sharp-cornered (border-radius: 0) except navigation pills and CTA buttons.

---

## Motion Principles

### Entries
- **Hard slam:** `fromTo({x/y: offscreen}, {x/y: 0}, {duration:0.32, ease:'power4.out'})` — feels mechanical, not floaty
- **Scale punch:** `fromTo({scale:3, filter:'blur(60px)'}, {scale:1, filter:'blur(0px)'}, {duration:0.32, ease:'power4.out'})`
- **Vertical wipe:** `fromTo({scaleY:0, transformOrigin:'top center'}, {scaleY:1})` — brutalist reveal

### Exits
- Reverse entry: `to({x:-1200}, {duration:0.32, ease:'power3.in'})`
- Fade-out: `to({opacity:0}, {duration:0.25})`

### Marquee (CSS-driven, not GSAP)
```css
@keyframes cls-__ID__-mq {
  from { transform: translateX(0) }
  to   { transform: translateX(-50%) }
}
/* Element must contain content duplicated twice for seamless loop */
animation: cls-__ID__-mq 6s linear infinite;
```

### Marquee Reverse
```css
@keyframes cls-__ID__-mq-r {
  from { transform: translateX(-50%) }
  to   { transform: translateX(0) }
}
animation: cls-__ID__-mq-r 9s linear infinite;
```

---

## Scene-Based Prompt Framework

Use this structure to design overlays scene-by-scene:

```
OVERLAY SPEC:
  Scene:   [what narrative moment this is]
  Timing:  [startMs → endMs, duration]
  State:   [what's visible / what zone]
  Effect:  [entry type · hold behavior · exit type]
  Keyword: [one word that captures the visual intent]
```

**Example:**
```
Scene:   Pivot moment — "But I did something different"
Timing:  12450ms → 15650ms (3200ms)
State:   Full-width orange strip, center zone
Effect:  slide-left · static · slide-left-out
Keyword: DISRUPTION
```

---

## Layout Zones (Portrait 1080×1920)

| Zone | px range | Use |
|------|----------|-----|
| TOP | 0–480px | Headers, labels, stats that don't cover face |
| CENTER | 480–1440px | Brief full-screen punches (<1.5s), strips |
| BOTTOM | 1440–1920px | Marquees, lower thirds, CTAs |

---

## Overlay Archetypes

### 1. Orange Header Bar (Top Zone)
Slides down from top. Full-width orange block with black text. 2px black border bottom.
- Font: Archivo Black, 100-130px
- Label above: Space Mono 20px, 0.7 opacity
- Entry: `y:-400 → y:0`, 0.32s power4.out
- Exit: `y:-400`, 0.3s power3.in

### 2. Stat Card (Bottom-Right Corner)
Slides from right. Black background, orange primary number, white Space Mono label.
- Border: 3px orange top, 3px orange left
- Number: Archivo Black 140-200px, orange
- Label: Space Mono 22px, white
- Entry: `x:1200 → x:0`, 0.35s power4.out

### 3. Corner Pill Label (Top-Left)
Tiny orange pill. Space Mono text. Signals section context.
- Background: #FF4D00, border: 2px solid #000
- Padding: 12px 24px
- Entry: `opacity:0 → opacity:1`, 0.25s

### 4. Full-Width Orange Strip (Center Zone)
Slides from left. Covers speaker briefly (max 3s). Orange background, black Archivo Black text.
- Border: 3px black top + bottom
- 2 lines of text, 140-160px
- Entry: `x:-1200 → x:0`, 0.38s power4.out
- Exit: `x:-1200`, 0.45s power3.in

### 5. Content List (Top Zone)
Black bar slides down. Items reveal sequentially with 0.9s stagger.
- Background: #000, border-bottom: 2px solid #FF4D00
- Number in orange Space Mono, title in white Archivo Black 80px
- Items animate: `x:-30 opacity:0 → x:0 opacity:1`

### 6. Platform Marquee (Bottom Strip)
CSS-driven infinite scroll. Two rows: orange Archivo Black top, white Space Mono reversed.
- Background: #000, border-top: 2px solid #FF4D00
- Row 1: 48px orange, 6s duration
- Row 2: 22px white 70%, reversed, 9s duration

### 7. Horizontal Wipe Reveal (Center)
`scaleY:0 → scaleY:1` on a black strip. Creates venetian-blind open effect.
- transformOrigin: top center
- Stat + label inside

### 8. Proof Tag Bar (Top Zone)
Orange bar slides down. Sequentially reveals pill-shaped bordered tags.
- Tags: Space Mono 18px, 2px border #000, padding 8px 20px
- Stagger: 0.5s between each tag

### 9. Two-Phase Reveal (Top → Bottom)
Phase 1: Information bar (top). Phase 2: Benefit statement (bottom).
- Use `.to({},{duration:N})` as hold between phases

### 10. Lower Third (Bottom Zone)
Slides from left. Orange background with black text. Name + role + org.
- Name: Archivo Black 100px
- Role: Space Mono 22px, opacity 0.7
- Org: Black background, orange text pill
- Long hold (15s+)

---

## Quality Gates

- [ ] Only 3 colors used: #FF4D00, #000000, #FFFFFF
- [ ] All headers are uppercase Archivo Black (or Arial Black fallback)
- [ ] All borders are sharp (no border-radius except pills/CTAs)
- [ ] Entry animations < 0.4s (brutalist = fast, not smooth)
- [ ] No gradients, no drop shadows
- [ ] Marquee content duplicated twice in HTML for seamless loop
- [ ] `@keyframes` names include `__ID__` to avoid animation name conflicts
- [ ] `el._tl` GSAP timeline fits within `durationMs/1000` seconds
- [ ] `overflow:hidden` on root element for clean slide clips

---

## Complete Overlay Template

```json
{
  "startMs": 0,
  "durationMs": 2700,
  "type": "kinetic-orange-header",
  "rationale": "Scene: [narrative moment] | Timing: [startMs-endMs] | State: [zone/element] | Effect: [slide-down · hold · slide-up] | Keyword: [SLAM]",
  "css": ".cls-__ID__-w{position:fixed;top:0;left:0;width:1080px;height:1920px;pointer-events:none;overflow:hidden;} .cls-__ID__-b{position:absolute;top:0;left:0;right:0;background:#FF4D00;border-bottom:3px solid #000;padding:35px 55px 30px;} .cls-__ID__-lbl{font-family:'Space Mono','Courier New',monospace;font-size:20px;color:#000;text-transform:uppercase;letter-spacing:-0.02em;opacity:.7;margin-bottom:8px;} .cls-__ID__-h{font-family:'Archivo Black','Arial Black',Impact,sans-serif;font-size:130px;color:#000;text-transform:uppercase;letter-spacing:-0.04em;line-height:.85;white-space:nowrap;}",
  "html": "<div class=\"cls-__ID__-w\"><div class=\"cls-__ID__-b\"><div class=\"cls-__ID__-lbl\">↳ trending now</div><div class=\"cls-__ID__-h\">CLOUD CODE<br>IS GOING—</div></div></div>",
  "initJs": "var b=el.querySelector('.cls-__ID__-b');el._tl=gsap.timeline({paused:true}).fromTo(b,{y:-400},{y:0,duration:0.32,ease:'power4.out'}).to({},{duration:2.0}).to(b,{y:-400,duration:0.28,ease:'power3.in'});"
}
```

---

*Spec captured 2026-03-18. Source: user-provided Kinetic Orange style brief + scene-based prompt framework image.*
