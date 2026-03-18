/**
 * Stat Counter — Cinema standalone renderer
 *
 * Full-screen: HUGE animated number (spring physics), context label beneath,
 * horizontal sparkline bars animate up in stagger, confetti-like particles.
 * Driven by `data` from concept extractor: { value, suffix, label }
 */

import { CinemaStandaloneRenderer } from "./base-standalone.js";
import { R, hexToRgba } from "./shared.js";

const BAR_HEIGHTS = [0.3, 0.55, 0.4, 0.7, 0.5, 0.85, 0.65, 0.95, 0.78, 1.0];

class StatCounterRenderer extends CinemaStandaloneRenderer {
  readonly type = "stat-counter";
  protected readonly ns = "ff-stat";

  protected contentCss(s: number, primary: string, bodyFont: string, headFont: string): string {
    return `
.ff-stat-center {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  gap: ${R(28 * s)}px; padding: ${R(40 * s)}px ${R(60 * s)}px;
}
.ff-stat-tag {
  font-family: ${bodyFont}; font-size: ${R(11 * s)}px; font-weight: 700;
  letter-spacing: ${R(3 * s)}px; color: ${primary};
  text-transform: uppercase; opacity: 0;
}
.ff-stat-num-row {
  display: flex; align-items: baseline; gap: ${R(12 * s)}px;
  opacity: 0; transform: scale(0.7);
}
.ff-stat-value {
  font-family: 'Space Mono', ${headFont}; font-size: ${R(128 * s)}px; font-weight: 900;
  line-height: 1; color: ${primary};
  text-shadow: 0 0 ${R(60 * s)}px ${hexToRgba(primary, 0.45)};
}
.ff-stat-suffix {
  font-family: ${headFont}; font-size: ${R(64 * s)}px; font-weight: 900;
  color: rgba(255,255,255,0.5);
}
.ff-stat-label {
  font-family: ${bodyFont}; font-size: ${R(18 * s)}px; font-weight: 600;
  color: rgba(255,255,255,0.45); letter-spacing: ${R(1 * s)}px;
  text-transform: uppercase; opacity: 0;
}
.ff-stat-bars {
  display: flex; align-items: flex-end; gap: ${R(6 * s)}px;
  height: ${R(48 * s)}px; opacity: 0;
}
.ff-stat-bar {
  width: ${R(18 * s)}px; border-radius: ${R(3 * s)}px ${R(3 * s)}px 0 0;
  background: ${primary}; opacity: 0.7;
  height: 0%; transition: none;
}`;
  }

  protected contentHtml(id: string, s: number, _primary: string): string {
    const bars = BAR_HEIGHTS.map((_, i) =>
      `<div class="ff-stat-bar" id="${id}-bar${i}"></div>`
    ).join("");

    return `
<div class="ff-stat-center">
  <div class="ff-stat-tag" id="${id}-tag">📈 Results</div>
  <div class="ff-stat-num-row" id="${id}-numrow">
    <div class="ff-stat-value" id="${id}-val">0</div>
    <div class="ff-stat-suffix" id="${id}-suf"></div>
  </div>
  <div class="ff-stat-label" id="${id}-lbl">improvement</div>
  <div class="ff-stat-bars" id="${id}-bars">${bars}</div>
</div>`;
  }

  protected contentInitJs(id: string, s: number, primary: string): string {
    const barHeightsJson = JSON.stringify(BAR_HEIGHTS);
    return `
var scene = document.getElementById('${id}-scene');
gsap.set(scene, { opacity: 0 });
var tl = gsap.timeline({ paused: true });
tl.to(scene, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);
tl.to(document.getElementById('${id}-tag'), { opacity: 1, duration: 0.3 }, 0.35);
tl.to(document.getElementById('${id}-numrow'), { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.8)' }, 0.52);
tl.to(document.getElementById('${id}-lbl'), { opacity: 1, duration: 0.3 }, 0.9);
tl.to(document.getElementById('${id}-bars'), { opacity: 1, duration: 0.2 }, 1.1);

var barHeights = ${barHeightsJson};
barHeights.forEach(function(h, i) {
  tl.to(document.getElementById('${id}-bar'+i), {
    height: (h * 100) + '%',
    duration: 0.4, ease: 'back.out(1.8)'
  }, 1.15 + i * 0.05);
});

el._targetValue = 100;
el._suffix = '';
el._label = 'improvement';
el._valEl = document.getElementById('${id}-val');
el._sufEl = document.getElementById('${id}-suf');
el._lblEl = document.getElementById('${id}-lbl');`;
  }

  protected contentUpdateJs(id: string, _s: number): string {
    return `
if (el._valEl) {
  var tSec = localT / 1000;
  var st = 0.52;
  var t = Math.max(0, tSec - st);
  var dur = 1.6;
  var target = el._targetValue || 100;
  var v;
  if (t >= dur) { v = target; }
  else {
    var z = 0.42, w = 8, oD = w * Math.sqrt(1 - z * z);
    v = target * (1 - Math.exp(-z * w * t) * Math.cos(oD * t));
  }
  var disp = Math.round(v);
  if (target >= 1000) disp = Math.round(v / 100) / 10 + 'K';
  el._valEl.textContent = disp;
}`;
  }

  // Override render to inject data from concept extractor
  render(data: Record<string, any>, timing: any, ctx: any) {
    const out = super.render(data, timing, ctx);
    // Patch initJs to use real data values
    if (data.value || data.suffix || data.label) {
      const val = parseFloat(data.value) || 100;
      const suffix = data.suffix ?? "";
      const label = data.label ?? "improvement";
      const id = ctx.instanceId;
      const patch = `
el._targetValue = ${val};
el._suffix = ${JSON.stringify(suffix)};
el._label = ${JSON.stringify(label)};
if (el._sufEl) el._sufEl.textContent = ${JSON.stringify(suffix)};
if (el._lblEl) el._lblEl.textContent = ${JSON.stringify(label)};`;
      out.initJs = (out.initJs ?? "") + patch;
    }
    return out;
  }
}

export const statCounterRenderer = new StatCounterRenderer();
