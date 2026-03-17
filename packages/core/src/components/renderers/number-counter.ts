/**
 * Number Counter — Spring physics counting animation
 *
 * Replaces: stat-callout
 * Technology: Pure JS (no GSAP needed)
 * Visual: Numbers count up from 0 with damped spring overshoot.
 *         Multiple stat boxes supported.
 */

import {
  type ComponentRenderer,
  type ComponentTiming,
  type ComponentContext,
  type ComponentOutput,
  escapeHtml,
} from "../types.js";

const R = Math.round;

interface StatPair {
  target: number;
  suffix: string;
  label: string;
}

function parseStatPairs(data: Record<string, any>): StatPair[] {
  return Object.entries(data).map(([key, label]) => {
    const numStr = key.replace(/[^0-9.]/g, "");
    const suffix = key.replace(/[0-9.,]/g, "");
    return {
      target: parseFloat(numStr) || 0,
      suffix,
      label: String(label),
    };
  });
}

export const numberCounterRenderer: ComponentRenderer = {
  type: "number-counter",
  dependencies: [],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId } = ctx;
    const { colors, typography, elements } = style;
    const pairs = parseStatPairs(data);

    const css = `
      .ff-nc-wrap {
        position: fixed; top: ${R(140 * s)}px; left: ${R(60 * s)}px;
        z-index: 9990; pointer-events: none;
        display: flex; gap: ${R(16 * s)}px;
      }
      .ff-nc-box {
        background: ${colors.primary};
        border: ${Math.max(2, R(elements.borderWidth * 1.5))}px solid #000;
        border-radius: ${R(elements.borderRadius * 0.8 * s)}px;
        padding: ${R(18 * s)}px ${R(28 * s)}px;
        box-shadow: ${elements.shadowStyle};
        text-align: center;
        opacity: 0; transform: translateY(${R(40 * s)}px);
        transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .ff-nc-box.visible { opacity: 1; transform: translateY(0); }
      .ff-nc-num {
        font-family: 'Space Mono', ${typography.heading};
        font-size: ${R(52 * s)}px; font-weight: 900; color: #000;
      }
      .ff-nc-label {
        font-family: ${typography.body};
        font-size: ${R(14 * s)}px; font-weight: 700;
        color: ${colors.background};
        text-transform: uppercase; letter-spacing: ${R(2 * s)}px;
        margin-top: ${R(4 * s)}px;
      }`;

    const boxesHtml = pairs
      .map(
        (p, i) =>
          `<div class="ff-nc-box" id="${instanceId}-box${i}">` +
          `<div class="ff-nc-num" id="${instanceId}-num${i}">0</div>` +
          `<div class="ff-nc-label">${escapeHtml(p.label)}</div>` +
          `</div>`
      )
      .join("");

    const html = `<div class="ff-nc-wrap">${boxesHtml}</div>`;

    // Embed stat targets as JSON for the update function
    const pairsJson = JSON.stringify(
      pairs.map((p) => ({ target: p.target, suffix: p.suffix }))
    );

    const initJs = `
    el._pairs = ${pairsJson};
    el._entered = false;`;

    // Spring physics: damped harmonic oscillator
    // x(t) = target * (1 - e^(-zeta*omega*t) * cos(omegaD*t))
    const updateJs = `
      var pairs = el._pairs;
      var tSec = localT / 1000;
      var enterDur = 0.3;
      var animStart = 0.35;
      var exitStart = ${((timing.durationMs - 400) / 1000).toFixed(3)};
      var exiting = tSec >= exitStart;

      for (var j = 0; j < pairs.length; j++) {
        var box = document.getElementById('${instanceId}-box' + j);
        var numEl = document.getElementById('${instanceId}-num' + j);
        var stagger = j * 0.12;

        if (tSec >= stagger && !exiting) {
          box.classList.add('visible');
        }
        if (exiting) {
          box.classList.remove('visible');
        }

        var countT = Math.max(0, tSec - animStart - stagger);
        var duration = 1.2;
        var target = pairs[j].target;
        var suffix = pairs[j].suffix;
        var value;

        if (countT >= duration) {
          value = target;
        } else {
          var zeta = 0.35;
          var omega = 12;
          var omegaD = omega * Math.sqrt(1 - zeta * zeta);
          var decay = Math.exp(-zeta * omega * countT);
          value = target * (1 - decay * Math.cos(omegaD * countT));
        }

        var display = Math.round(value);
        if (target >= 1000) display = display.toLocaleString();
        numEl.textContent = display + suffix;
      }`;

    return { css, html, initJs, updateJs };
  },
};
