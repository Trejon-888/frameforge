/**
 * Dashboard — Cinema renderer
 *
 * Browser mockup: app.analytiq.io/dashboard
 * Content: Live analytics panel — 3 KPI cards count up with spring physics,
 * SVG line chart draws itself left→right, progress ring fills.
 */

import { CinemaBrowserRenderer, type HeadlineContent } from "./base-browser.js";
import { R, hexToRgba } from "./shared.js";

const METRICS = [
  { label: "Conv Rate", value: 94, suffix: "%", icon: "📈" },
  { label: "Leads", value: 2400, suffix: "", icon: "👥" },
  { label: "MRR", value: 12, suffix: "K", icon: "💰" },
];

// SVG sparkline points (normalized 0-1 mapped to viewBox)
const CHART_POINTS = [0.08, 0.22, 0.15, 0.45, 0.38, 0.60, 0.52, 0.78, 0.70, 0.92];

class DashboardRenderer extends CinemaBrowserRenderer {
  readonly type = "dashboard";
  protected readonly ns = "ff-dash";
  protected readonly browserUrl = "app.analytiq.io/dashboard";
  protected readonly navItems = ["Overview", "Reports", "Leads", "Settings"];
  protected readonly activeNav = 0;

  protected headline(_s: number): HeadlineContent {
    return {
      tag: "📊 Live Analytics",
      headline: "Track every<br>metric in<br>real time.",
      desc: "Every lead, every deal, every dollar — visible in one clean dashboard.",
    };
  }

  protected viewportCss(s: number, primary: string, bodyFont: string, headFont: string): string {
    return `
.ff-dash-vp-inner {
  padding: ${R(14 * s)}px ${R(18 * s)}px; background: var(--ff-viewport);
  display: flex; flex-direction: column; gap: ${R(10 * s)}px;
}
.ff-dash-kpis {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: ${R(8 * s)}px;
}
.ff-dash-kpi {
  background: var(--ff-surface);
  border: 1px solid var(--ff-border-soft);
  border-radius: ${R(10 * s)}px;
  padding: ${R(12 * s)}px ${R(10 * s)}px; text-align: center;
  opacity: 0; transform: translateY(${R(14 * s)}px);
}
.ff-dash-kpi-icon { font-size: ${R(18 * s)}px; margin-bottom: ${R(5 * s)}px; }
.ff-dash-kpi-val {
  font-family: 'Space Mono', ${headFont}; font-size: ${R(26 * s)}px; font-weight: 900;
  color: ${primary}; line-height: 1;
}
.ff-dash-kpi-lbl {
  font-family: ${bodyFont}; font-size: ${R(9 * s)}px; font-weight: 600;
  color: var(--ff-text-faint); text-transform: uppercase; letter-spacing: 1px;
  margin-top: ${R(4 * s)}px;
}
.ff-dash-chart {
  background: var(--ff-surface);
  border: 1px solid var(--ff-border-soft);
  border-radius: ${R(10 * s)}px;
  padding: ${R(10 * s)}px; opacity: 0;
}
.ff-dash-chart-title {
  font-family: ${bodyFont}; font-size: ${R(10 * s)}px; font-weight: 700;
  color: var(--ff-text-muted); margin-bottom: ${R(8 * s)}px;
  text-transform: uppercase; letter-spacing: 1px;
}
.ff-dash-live-dot {
  display: inline-block; width: ${R(6 * s)}px; height: ${R(6 * s)}px;
  background: #00e57a; border-radius: 50%; margin-right: ${R(5 * s)}px;
}
.ff-dash-chart-svg { width: 100%; overflow: visible; }
.ff-dash-chart-line {
  fill: none; stroke: ${primary}; stroke-width: ${R(2 * s)};
  stroke-linecap: round; stroke-linejoin: round;
}
.ff-dash-chart-area { fill: url(#ff-dash-grad); }`;
  }

  protected viewportHtml(id: string, s: number): string {
    const kpisHtml = METRICS.map((m, i) => `
<div class="ff-dash-kpi" id="${id}-kpi${i}">
  <div class="ff-dash-kpi-icon">${m.icon}</div>
  <div class="ff-dash-kpi-val" id="${id}-val${i}">0</div>
  <div class="ff-dash-kpi-lbl">${m.label}</div>
</div>`).join("");

    // Build SVG polyline path
    const W = 320, H = 70;
    const pts = CHART_POINTS.map((y, i) => {
      const x = R(i / (CHART_POINTS.length - 1) * W);
      const yp = R((1 - y) * H);
      return `${x},${yp}`;
    }).join(" ");
    const areaPath = `M0,${H} ` + CHART_POINTS.map((y, i) => {
      const x = R(i / (CHART_POINTS.length - 1) * W);
      const yp = R((1 - y) * H);
      return `L${x},${yp}`;
    }).join(" ") + ` L${W},${H} Z`;

    return `
<div class="ff-dash-vp-inner">
  <div class="ff-dash-kpis">${kpisHtml}</div>
  <div class="ff-dash-chart" id="${id}-chart">
    <div class="ff-dash-chart-title">
      <span class="ff-dash-live-dot"></span>Revenue Growth — Last 30 days
    </div>
    <svg class="ff-dash-chart-svg" viewBox="0 0 ${W} ${H}" height="${R(70 * s)}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ff-dash-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="currentColor" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path class="ff-dash-chart-area" id="${id}-area" d="${areaPath}" style="color:currentColor"/>
      <polyline class="ff-dash-chart-line" id="${id}-line" points="${pts}"/>
    </svg>
  </div>
</div>`;
  }

  protected viewportInitJs(id: string, s: number, _primary: string): string {
    const metricsJson = JSON.stringify(METRICS);
    return `
// KPIs enter
[0,1,2].forEach(function(i) {
  tl.to(document.getElementById('${id}-kpi'+i), { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.6)' }, 1.1 + i * 0.14);
});
tl.to(document.getElementById('${id}-chart'), { opacity: 1, duration: 0.3 }, 1.58);

// SVG line strokeDashoffset reveal
var line = document.getElementById('${id}-line');
var lineLen = 0;
try { lineLen = line.getTotalLength(); } catch(e) { lineLen = 340; }
gsap.set(line, { strokeDasharray: lineLen, strokeDashoffset: lineLen });
tl.to(line, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 1.7);
gsap.set(document.getElementById('${id}-area'), { opacity: 0 });
tl.to(document.getElementById('${id}-area'), { opacity: 1, duration: 0.6 }, 2.2);

el._metrics = ${metricsJson};
el._vals = [0,1,2].map(function(i){ return document.getElementById('${id}-val'+i); });`;
  }

  protected viewportUpdateJs(id: string, _s: number): string {
    return `
if (el._metrics && el._vals) {
  var tSec = localT / 1000;
  for (var i = 0; i < el._metrics.length; i++) {
    var st = 1.1 + i * 0.14;
    var t = Math.max(0, tSec - st);
    var dur = 1.4;
    var target = el._metrics[i].value;
    var v;
    if (t >= dur) { v = target; }
    else {
      var z = 0.42, w = 9, oD = w * Math.sqrt(1 - z * z);
      v = target * (1 - Math.exp(-z * w * t) * Math.cos(oD * t));
    }
    var disp = Math.round(v);
    if (target >= 1000) disp = (Math.round(v) / 1000).toFixed(1);
    el._vals[i].textContent = disp + el._metrics[i].suffix;
  }
}`;
  }
}

export const dashboardRenderer = new DashboardRenderer();
