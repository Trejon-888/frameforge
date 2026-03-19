/**
 * Dashboard — Full-screen panel: Live analytics metrics counting up
 *
 * Triggers: "track performance", "analytics", "dashboard", "real-time data"
 * Layout: Left headline + Right 3 large metric cards + progress bar
 */

import {
  type ComponentRenderer,
  type ComponentTiming,
  type ComponentContext,
  type ComponentOutput,
  GSAP_CDN,
} from "../types.js";

const R = Math.round;

const METRICS = [
  { value: 94, suffix: "%", label: "Conv Rate", icon: "📈" },
  { value: 2400, suffix: "", label: "Leads", icon: "👥" },
  { value: 12, suffix: "K", label: "Revenue", icon: "💰" },
];

export const dashboardRenderer: ComponentRenderer = {
  type: "dashboard",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId: id } = ctx;
    const { colors, typography } = style;

    const boxesHtml = METRICS.map(
      (m, i) => `
      <div class="ff-dash-box" id="${id}-box${i}">
        <div class="ff-dash-box-ico">${m.icon}</div>
        <div class="ff-dash-val" id="${id}-val${i}">0</div>
        <div class="ff-dash-lbl">${m.label}</div>
      </div>`
    ).join("");

    const css = `
      .ff-dash-bd {
        position: fixed; inset: 0; z-index: 9990;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }
      .ff-dash-panel {
        width: ${R(920 * s)}px;
        background: rgba(6,8,14,0.97);
        border: ${R(2 * s)}px solid rgba(255,255,255,0.14);
        border-radius: ${R(20 * s)}px;
        box-shadow: 0 ${R(32 * s)}px ${R(80 * s)}px rgba(0,0,0,0.9),
                    ${R(8 * s)}px ${R(8 * s)}px 0 ${colors.primary},
                    inset 0 1px 0 rgba(255,255,255,0.07);
        padding: ${R(44 * s)}px ${R(56 * s)}px;
        display: flex; gap: ${R(56 * s)}px; align-items: center;
        overflow: hidden;
      }
      .ff-dash-lft { flex: 1; min-width: 0; }
      .ff-dash-rgt { flex: 1.4; min-width: 0; }
      .ff-dash-tag {
        font-family: ${typography.body};
        font-size: ${R(11 * s)}px; font-weight: 700;
        letter-spacing: ${R(2 * s)}px; color: ${colors.primary};
        text-transform: uppercase; margin-bottom: ${R(18 * s)}px; opacity: 0;
      }
      .ff-dash-h2 {
        font-family: ${typography.heading};
        font-size: ${R(46 * s)}px; font-weight: 900;
        line-height: 1.05; color: #fff;
        margin-bottom: ${R(14 * s)}px; opacity: 0;
      }
      .ff-dash-sub {
        font-family: ${typography.body}; font-size: ${R(15 * s)}px; line-height: 1.6;
        color: rgba(255,255,255,0.45); margin-bottom: ${R(32 * s)}px; opacity: 0;
      }
      .ff-dash-live {
        display: inline-flex; align-items: center; gap: ${R(8 * s)}px;
        font-family: ${typography.body}; font-size: ${R(13 * s)}px; font-weight: 700;
        color: #00e57a; opacity: 0;
      }
      .ff-dash-ldot { width: ${R(8 * s)}px; height: ${R(8 * s)}px; background: #00e57a; border-radius: 50%; }
      .ff-dash-boxes {
        display: grid; grid-template-columns: repeat(3, 1fr);
        gap: ${R(10 * s)}px; margin-bottom: ${R(16 * s)}px;
      }
      .ff-dash-box {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.09);
        border-radius: ${R(12 * s)}px;
        padding: ${R(18 * s)}px ${R(12 * s)}px;
        text-align: center;
        opacity: 0; transform: translateY(${R(16 * s)}px);
      }
      .ff-dash-box-ico { font-size: ${R(20 * s)}px; margin-bottom: ${R(8 * s)}px; }
      .ff-dash-val {
        font-family: 'Space Mono', ${typography.heading};
        font-size: ${R(28 * s)}px; font-weight: 900;
        color: ${colors.primary}; line-height: 1;
      }
      .ff-dash-lbl {
        font-family: ${typography.body}; font-size: ${R(10 * s)}px; font-weight: 600;
        color: rgba(255,255,255,0.35); text-transform: uppercase;
        letter-spacing: ${R(0.5 * s)}px; margin-top: ${R(5 * s)}px;
      }
      .ff-dash-bar-row {
        display: flex; align-items: center; gap: ${R(10 * s)}px; opacity: 0;
      }
      .ff-dash-bar-track {
        flex: 1; height: ${R(8 * s)}px;
        background: rgba(255,255,255,0.07);
        border-radius: ${R(4 * s)}px; overflow: hidden;
      }
      .ff-dash-bar-fill {
        height: 100%; width: 0%;
        background: linear-gradient(90deg, ${colors.primary}, ${colors.primary}cc);
        border-radius: ${R(4 * s)}px;
      }
      .ff-dash-bar-pct {
        font-family: ${typography.body}; font-size: ${R(12 * s)}px; font-weight: 700;
        color: ${colors.primary}; flex-shrink: 0; min-width: ${R(36 * s)}px;
      }`;

    const html = `
      <div class="ff-dash-bd" id="${id}-bd">
        <div class="ff-dash-panel" id="${id}-panel">
          <div class="ff-dash-lft">
            <div class="ff-dash-tag" id="${id}-tag">📊 Live Analytics</div>
            <h2 class="ff-dash-h2" id="${id}-h2">Track results<br>in real time.</h2>
            <p class="ff-dash-sub" id="${id}-sub">Every metric, every lead, every deal<br>— visible in one dashboard.</p>
            <div class="ff-dash-live" id="${id}-live">
              <div class="ff-dash-ldot"></div>Live data
            </div>
          </div>
          <div class="ff-dash-rgt">
            <div class="ff-dash-boxes">${boxesHtml}</div>
            <div class="ff-dash-bar-row" id="${id}-barrow">
              <div class="ff-dash-bar-track">
                <div class="ff-dash-bar-fill" id="${id}-fill"></div>
              </div>
              <div class="ff-dash-bar-pct" id="${id}-pct">0%</div>
            </div>
          </div>
        </div>
      </div>`;

    const exitSec = ((timing.durationMs - 400) / 1000).toFixed(3);
    const metricsJson = JSON.stringify(METRICS);

    const initJs = `
      var bd = document.getElementById('${id}-bd');
      var panel = document.getElementById('${id}-panel');
      var tag = document.getElementById('${id}-tag');
      var h2 = document.getElementById('${id}-h2');
      var sub = document.getElementById('${id}-sub');
      var live = document.getElementById('${id}-live');
      var barrow = document.getElementById('${id}-barrow');
      var fill = document.getElementById('${id}-fill');
      var pctEl = document.getElementById('${id}-pct');
      var boxes = [0,1,2].map(function(i){ return document.getElementById('${id}-box'+i); });
      var vals = [0,1,2].map(function(i){ return document.getElementById('${id}-val'+i); });
      var metrics = ${metricsJson};

      gsap.set(bd, { backgroundColor: 'rgba(0,0,0,0)' });
      gsap.set(panel, { scale: 0.78, opacity: 0, y: ${R(60 * s)} });
      var tl = gsap.timeline({ paused: true });

      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0.48)', duration: 0.4 }, 0);
      tl.to(panel, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.3)' }, 0.05);
      tl.to(tag, { opacity: 1, duration: 0.3 }, 0.5);
      tl.to(h2, { opacity: 1, duration: 0.4, ease: 'power3.out' }, 0.62);
      tl.to(sub, { opacity: 1, duration: 0.35 }, 0.82);
      boxes.forEach(function(b, i) {
        tl.to(b, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.5)' }, 0.85 + i * 0.14);
      });
      tl.to(barrow, { opacity: 1, duration: 0.3 }, 1.3);
      tl.to(live, { opacity: 1, duration: 0.3 }, 1.5);

      tl.to(panel, { scale: 0.92, opacity: 0, y: ${R(-30 * s)}, duration: 0.4, ease: 'power2.in' }, ${exitSec});
      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.35 }, ${exitSec});
      el._tl = tl;
      el._metrics = metrics;
      el._vals = vals;
      el._fill = fill;
      el._pctEl = pctEl;`;

    const updateJs = `
      if (el._tl) el._tl.time(localT / 1000);
      var tSec = localT / 1000;
      var metrics = el._metrics;
      for (var i = 0; i < metrics.length; i++) {
        var st = 0.85 + i * 0.14;
        var t = Math.max(0, tSec - st);
        var dur = 1.4;
        var target = metrics[i].value;
        var v;
        if (t >= dur) { v = target; }
        else {
          var zeta = 0.42, omega = 9;
          var oD = omega * Math.sqrt(1 - zeta * zeta);
          v = target * (1 - Math.exp(-zeta * omega * t) * Math.cos(oD * t));
        }
        var display = Math.round(v);
        if (target >= 1000) display = (display / 1000).toFixed(1);
        el._vals[i].textContent = display + metrics[i].suffix;
      }
      var barT = Math.max(0, tSec - 1.3);
      var pct = Math.min(78, Math.round(barT / 1.2 * 78));
      el._fill.style.width = pct + '%';
      el._pctEl.textContent = pct + '%';`;

    return { css, html, initJs, updateJs };
  },
};
