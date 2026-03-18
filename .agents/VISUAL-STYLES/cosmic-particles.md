# Visual Style: Cosmic Particles

**Category:** Particle Physics / Dark Atmosphere
**Mood:** Cinematic, Otherworldly, High-Stakes
**Best For:** Tech demos, product reveals, transformation narratives, "before/after" moments

---

## Aesthetic Summary

Dark void backgrounds where subjects appear to dissolve, coalesce, or explode into swirling particles. Inspired by cosmic photography — black holes pulling matter into spirals, supernovas scattering debris, nebulae forming from gas clouds. Monochromatic with surgical crimson accents. The visual language says: *something powerful is happening that cannot be seen with the naked eye.*

---

## Color Palette

| Token | Hex | Use |
|-------|-----|-----|
| void | `#000000` | Background canvas — absolute black |
| near-void | `#050505` | Alternate bg for very subtle depth |
| particle-bright | `#ffffff` | Primary particle color, brightest nodes |
| particle-mid | `#e8e8e0` | Most particles — slightly warm white |
| particle-dim | `#aaaaaa` | Fading, dying particles |
| crimson | `#cc0000` | Accent only — key stats, CTAs, critical moments |
| crimson-glow | `#ff2222` | Crimson at peak brightness |
| cobalt-trace | `#1a3a8a` | Optional second accent — cold energy trails |

**Rule:** Use crimson for at most ONE element per overlay. Never use crimson and cobalt-trace simultaneously. Background is always void-black — particles composite over video via `mix-blend-mode: screen` (not over a solid black panel).

---

## Particle Physics

### Core Particle Object

```javascript
// Each particle in the simulation
{
  x: number,       // current X position (canvas pixels)
  y: number,       // current Y position (canvas pixels)
  vx: number,      // velocity X (pixels/frame)
  vy: number,      // velocity Y (pixels/frame)
  life: number,    // 0.0 → 1.0 (0 = just born, 1 = dead)
  decay: number,   // rate life increases per frame (0.003–0.015)
  size: number,    // radius in pixels (0.5–3.0)
  brightness: number, // 0.0–1.0 (modulates opacity)
  hue: number      // 0 for white, occasional -1 for crimson accent
}
```

### Motion Archetypes

**Disintegration** — particles drift outward from a focal point, decelerating
```javascript
const angle = Math.random() * Math.PI * 2;
const speed = 0.3 + Math.random() * 1.5;
vx = Math.cos(angle) * speed;
vy = Math.sin(angle) * speed * 0.7 - 0.4; // bias upward
```

**Vortex / Spiral** — particles orbit an attractor while slowly spiraling inward
```javascript
const dx = cx - p.x, dy = cy - p.y;
const dist = Math.sqrt(dx*dx + dy*dy);
const tangentX = -dy / dist, tangentY = dx / dist;
p.vx += tangentX * 0.08 + dx/dist * 0.02; // orbit + pull
p.vy += tangentY * 0.08 + dy/dist * 0.02;
```

**Comet Trail** — directional streaks with long tails
```javascript
// Render as line, not dot:
ctx.beginPath();
ctx.moveTo(p.x, p.y);
ctx.lineTo(p.x - p.vx * 8, p.y - p.vy * 8); // trail length
ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
ctx.lineWidth = p.size * 0.5;
ctx.stroke();
```

**Emergence / Coalescence** — particles converge from random positions toward a center
```javascript
// Reverse: target is center, spawn at radius
const angle = Math.random() * Math.PI * 2;
const r = 200 + Math.random() * 300;
p.x = cx + Math.cos(angle) * r;
p.y = cy + Math.sin(angle) * r;
p.vx = (cx - p.x) * 0.02;
p.vy = (cy - p.y) * 0.02;
```

---

## Compositing Rule (Critical)

```css
canvas {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  mix-blend-mode: screen;   /* WHITE particles show, BLACK is transparent */
  pointer-events: none;
}
```

`mix-blend-mode: screen` means the black canvas background is invisible — only the bright particles composite over the video. DO NOT wrap the canvas in a dark panel unless intentional (panel effect creates a "portal" look, which is a different technique).

---

## Particle Count Guidelines

| Effect | Count | Performance |
|--------|-------|-------------|
| Subtle atmosphere | 300–600 | Low |
| Active disintegration | 800–1500 | Medium |
| Full vortex / black hole | 2000–4000 | High |
| Storm / explosion | 5000+ | Use WebGL |

For FrameForge overlays targeting 30fps render: cap at 2000 particles with Canvas 2D.

---

## Typography in Cosmic Style

Text appears as if carved from light — white or off-white, often with glowing blur behind it.

```css
.cosmic-text {
  font-family: 'Space Grotesk', 'Inter', sans-serif; /* or Impact for slams */
  color: #ffffff;
  text-shadow:
    0 0 20px rgba(255,255,255,0.8),
    0 0 60px rgba(255,255,255,0.3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cosmic-accent {   /* crimson version */
  color: #cc0000;
  text-shadow:
    0 0 20px rgba(204,0,0,0.9),
    0 0 80px rgba(204,0,0,0.4);
}
```

**Do not use backgrounds behind text** — text floats in void. If text is hard to read, increase text-shadow blur radius rather than adding a panel.

---

## GSAP Animation Patterns

### Particle Canvas + GSAP Envelope

The recommended dual-track architecture:
- **GSAP timeline** controls opacity, scale, position of the entire canvas overlay
- **rAF loop** (via FrameForge virtualized `requestAnimationFrame`) drives particle physics simulation

```javascript
// In initJs — set up both tracks
const canvas = el.querySelector('canvas');
const ctx = canvas.getContext('2d');
const particles = initParticles(canvas.width, canvas.height);

// GSAP envelope (drives overall overlay fade in/out)
el._tl = gsap.timeline({ paused: true })
  .fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
  .to({}, { duration: 0.2 }, '>+end-padding')
  .to(canvas, { opacity: 0, duration: 0.3, ease: 'power2.in' });

// Particle physics loop (driven by FrameForge virtualized rAF)
let lastT = 0;
function tick() {
  const now = performance.now();
  const dt = Math.min((now - lastT) / 16.67, 3); // normalized delta
  lastT = now;
  updateParticles(particles, dt);
  renderParticles(ctx, particles, canvas.width, canvas.height);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

### Entry: Matter Coalescence

```javascript
gsap.timeline({ paused: true })
  .fromTo(textEl,
    { opacity: 0, scale: 1.4, filter: 'blur(20px)' },
    { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' })
```

### Exit: Disintegration

```javascript
  .to(textEl,
    { opacity: 0, scale: 0.85, filter: 'blur(15px)', duration: 0.5, ease: 'power2.in' })
```

### Number Reveal (Crimson Accent)

```javascript
  .fromTo(numEl,
    { textContent: '0', color: '#ffffff' },
    { textContent: targetNum, color: '#cc0000',
      snap: { textContent: 1 }, duration: 1.2, ease: 'power2.out',
      textShadow: '0 0 40px rgba(204,0,0,0.8)' })
```

---

## Overlay Techniques in This Style

### 1. Void Word Slam
Full canvas goes dark-dim (20% opacity black overlay), text slams in white with particle burst origin.
- Background: `rgba(0,0,0,0.2)` fullscreen div
- Particles: 800 disintegrating outward from text center
- Text: 120–200px Impact or Black weight, white, text-shadow glow
- Duration: 1.5–3s

### 2. Particle Counter
Crimson number counts up while particle vortex spins around it.
- Canvas: vortex attractor at number center point
- Number: 80–120px, starts white, shifts to crimson at peak
- Duration: 2–4s

### 3. Comet Title Card
Lower third with comet trail streaking left-to-right, depositing text.
- Canvas: 20–40 comet particles trailing horizontal
- Text: slides in from right as comet arrives
- Background: none — composited on screen
- Duration: 2–3s

### 4. Black Hole Pull
Text/logo at center, particles spiral inward from edges, compressing.
- Canvas: vortex attractor = overlay center
- Particle spawn: edges of canvas
- Use for reveals where something "materializes"
- Duration: 3–5s

### 5. Crimson Flash Wipe
Fast horizontal flash of crimson, clears to black, text appears from void.
- Frame 1–5: thin crimson line sweeps across
- Frame 6+: text emerges from where the line was
- Duration: 0.5–1.5s (very fast, punch cuts)

---

## Complete Overlay Example

```json
{
  "startMs": 5000,
  "durationMs": 3000,
  "type": "cosmic-word-slam",
  "rationale": "Emphasize the scale of the statistic at peak audience attention",
  "css": ".cls-__ID__-wrap { position:fixed; top:0; left:0; width:1080px; height:1920px; pointer-events:none; } .cls-__ID__-canvas { position:absolute; top:0; left:0; width:100%; height:100%; mix-blend-mode:screen; } .cls-__ID__-text { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-family:'Impact',sans-serif; font-size:180px; color:#ffffff; text-transform:uppercase; letter-spacing:-0.02em; text-shadow:0 0 40px rgba(255,255,255,0.8),0 0 100px rgba(255,255,255,0.3); white-space:nowrap; }",
  "html": "<div class=\"cls-__ID__-wrap\"><canvas class=\"cls-__ID__-canvas\" width=\"1080\" height=\"1920\"></canvas><div class=\"cls-__ID__-text\">BUILT DIFFERENT</div></div>",
  "initJs": "const wrap = el; const canvas = wrap.querySelector('canvas'); const ctx = canvas.getContext('2d'); const textEl = wrap.querySelector('.cls-__ID__-text'); const W = 1080, H = 1920; const particles = []; for (let i=0; i<1200; i++) { particles.push({ x: W/2 + (Math.random()-0.5)*400, y: H/2 + (Math.random()-0.5)*200, vx: (Math.random()-0.5)*3, vy: -Math.random()*2 - 0.5, life: Math.random(), decay: 0.004+Math.random()*0.008, size: 0.5+Math.random()*2, opacity: 0.6+Math.random()*0.4 }); } function tick() { ctx.clearRect(0,0,W,H); particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy -= 0.01; p.vx *= 0.99; p.life += p.decay; const a = p.opacity * Math.max(0, 1 - p.life); if (a > 0) { ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill(); } if (p.life >= 1) { p.life = 0; p.x = W/2 + (Math.random()-0.5)*300; p.y = H/2 + (Math.random()-0.5)*150; p.vx = (Math.random()-0.5)*3; p.vy = -Math.random()*2 - 0.5; } }); requestAnimationFrame(tick); } requestAnimationFrame(tick); el._tl = gsap.timeline({paused:true}).fromTo(textEl,{opacity:0,scale:1.5,filter:'blur(20px)'},{opacity:1,scale:1,filter:'blur(0px)',duration:0.5,ease:'power3.out'}).to(textEl,{opacity:0,scale:0.8,filter:'blur(10px)',duration:0.4,ease:'power2.in'},'>+1.8');"
}
```

---

## Reference Aesthetic Sources

- **NASA Hubble Deep Field** — particle density, color temperature
- **Black hole event horizon photography** — the Sagittarius A* images from EHT
- **Film:** Interstellar (wormhole sequence), Annihilation (shimmer), Arrival (heptapod ink)
- **Motion design:** GMUNK, Ash Thorp, Syd Mead concept continuations
- **Web refs:** https://particles.js.org, https://vincentgarreau.com/particles.js (for density inspiration)
- **Pinterest terms:** "particle disintegration cinema", "dark matter motion graphics", "cosmic particle loop"

---

## Quality Gates

- [ ] Canvas uses `mix-blend-mode: screen` (not wrapped in dark panel)
- [ ] No particle count > 2000 for Canvas 2D (use WebGL above that)
- [ ] Text has text-shadow glow, not background box
- [ ] Crimson used for max ONE element per overlay
- [ ] `el._tl` set as GSAP timeline controlling overall opacity envelope
- [ ] Particle loop uses `requestAnimationFrame` (not `setInterval`)
- [ ] Canvas cleared with `clearRect` each frame (not black fill)
- [ ] Exit animation matches entry in reverse: blur + scale or fade

---

*This spec was created from Pinterest reference images showing dark cosmic particle aesthetics — figures disintegrating into particles, vortex spirals, comet trails, crimson accents — captured 2026-03-17.*
