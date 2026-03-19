/**
 * Stat Counter — Full-screen panel: Huge animated number with spring physics
 *
 * Triggers: "50% faster", "$12k revenue", "47 clients", "save N hours"
 * Receives: data.value, data.suffix (%), data.label
 * Layout: Centered — colossal number + label + ascending sparkline
 */

import {
  type ComponentRenderer,
  type ComponentTiming,
  type ComponentContext,
  type ComponentOutput,
  GSAP_CDN,
  escapeHtml,
} from "../types.js";

const R = Math.round;

const BAR_HEIGHTS = [0.18, 0.28, 0.42, 0.56, 0.68, 0.82, 1.0];

export const statCounterRenderer: ComponentRenderer = {
  type: "stat-counter",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId: id } = ctx;
    const { colors, typography } = style;

    const targetVal = Math.abs(parseInt(String(data.value ?? "100"), 10)) || 100;
    const suffix = escapeHtml(String(data.suffix ?? ""));
    const label = escapeHtml(String(data.label ?? "results"));

    const barsHtml = BAR_HEIGHTS.map(
      (h, i) =>
        `<div class="ff-sc-bar" id="${id}-b${i}" style="height:0;max-height:${R(72 * h * s)}px"></div>`
    ).join("");

    const css = `
      .ff-sc-bd {
        position: fixed; inset: 0; z-index: 9990;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }
      .ff-sc-panel {
        width: ${R(920 * s)}px;
        background: rgba(6,8,14,0.97);
        border: ${R(2 * s)}px solid rgba(255,255,255,0.14);
        border-radius: ${R(20 * s)}px;
        box-shadow: 0 ${R(32 * s)}px ${R(80 * s)}px rgba(0,0,0,0.9),
                    ${R(8 * s)}px ${R(8 * s)}px 0 ${colors.primary},
                    inset 0 1px 0 rgba(255,255,255,0.07);
        padding: ${R(52 * s)}px ${R(80 * s)}px;
        display: flex; flex-direction: column; align-items: center;
        overflow: hidden;
      }
      .ff-sc-tag {
        font-family: ${typography.body};
        font-size: ${R(11 * s)}px; font-weight: 700;
        letter-spacing: ${R(2 * s)}px; color: ${colors.primary};
        text-transform: uppercase; margin-bottom: ${R(24 * s)}px; opacity: 0;
      }
      .ff-sc-num {
        font-family: 'Space Mono', ${typography.heading};
        font-size: ${R(120 * s)}px; font-weight: 900;
        color: ${colors.primary}; line-height: 1;
        letter-spacing: -0.03em;
        opacity: 0; transform: scale(0.55);
        text-shadow: 0 0 ${R(60 * s)}px ${colors.primary}40;
      }
      .ff-sc-label {
        font-family: ${typography.body};
        font-size: ${R(18 * s)}px; font-weight: 600;
        color: rgba(255,255,255,0.5); text-transform: uppercase;
        letter-spacing: ${R(3 * s)}px; margin-top: ${R(12 * s)}px;
        opacity: 0;
      }
      .ff-sc-sparkline {
        display: flex; align-items: flex-end; justify-content: center;
        gap: ${R(6 * s)}px; margin-top: ${R(32 * s)}px;
        height: ${R(72 * s)}px;
      }
      .ff-sc-bar {
        width: ${R(20 * s)}px;
        background: ${colors.primary};
        border-radius: ${R(4 * s)}px ${R(4 * s)}px 0 0;
        opacity: 0.7;
        transition: height 0.4s cubic-bezier(0.16,1,0.3,1);
      }`;

    const html = `
      <div class="ff-sc-bd" id="${id}-bd">
        <div class="ff-sc-panel" id="${id}-panel">
          <div class="ff-sc-tag" id="${id}-tag">📊 Results</div>
          <div class="ff-sc-num" id="${id}-num">0</div>
          <div class="ff-sc-label" id="${id}-label">${label}</div>
          <div class="ff-sc-sparkline">${barsHtml}</div>
        </div>
      </div>`;

    const barMaxH = BAR_HEIGHTS.map((h) => R(72 * h * s));
    const exitSec = ((timing.durationMs - 400) / 1000).toFixed(3);

    const initJs = `
      var bd = document.getElementById('${id}-bd');
      var panel = document.getElementById('${id}-panel');
      var tag = document.getElementById('${id}-tag');
      var numEl = document.getElementById('${id}-num');
      var labelEl = document.getElementById('${id}-label');
      var bars = Array.from({length:7},function(_,i){ return document.getElementById('${id}-b'+i); });
      var barH = ${JSON.stringify(barMaxH)};

      gsap.set(bd, { backgroundColor: 'rgba(0,0,0,0)' });
      gsap.set(panel, { scale: 0.78, opacity: 0, y: ${R(60 * s)} });
      var tl = gsap.timeline({ paused: true });

      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0.48)', duration: 0.4 }, 0);
      tl.to(panel, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.3)' }, 0.05);
      tl.to(tag, { opacity: 1, duration: 0.3 }, 0.5);
      tl.to(numEl, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, 0.62);
      tl.to(labelEl, { opacity: 1, duration: 0.3 }, 0.88);
      bars.forEach(function(b, i) {
        tl.to(b, { height: barH[i], duration: 0.45, ease: 'back.out(1.5)' }, 1.0 + i * 0.06);
      });

      tl.to(panel, { scale: 0.92, opacity: 0, y: ${R(-30 * s)}, duration: 0.4, ease: 'power2.in' }, ${exitSec});
      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.35 }, ${exitSec});
      el._tl = tl;
      el._target = ${targetVal};
      el._suffix = ${JSON.stringify(suffix)};
      el._numEl = numEl;`;

    // Spring physics counter — damped harmonic oscillator
    const updateJs = `
      if (el._tl) el._tl.time(localT / 1000);
      var tSec = localT / 1000;
      var animStart = 0.62;
      var countT = Math.max(0, tSec - animStart);
      var duration = 1.6;
      var target = el._target;
      var value;
      if (countT >= duration) {
        value = target;
      } else {
        var zeta = 0.38, omega = 9;
        var omegaD = omega * Math.sqrt(1 - zeta * zeta);
        value = target * (1 - Math.exp(-zeta * omega * countT) * Math.cos(omegaD * countT));
      }
      var display = Math.round(value);
      if (target >= 1000) display = display.toLocaleString();
      el._numEl.textContent = display + el._suffix;`;

    return { css, html, initJs, updateJs };
  },
};
