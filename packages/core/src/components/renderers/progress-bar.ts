/**
 * Progress Bar — Thin animated bar showing video progress
 *
 * Replaces: (new component)
 * Technology: Pure CSS/JS
 * Visual: Thin accent-colored bar at the bottom filling left to right.
 */

import {
  type ComponentRenderer,
  type ComponentTiming,
  type ComponentContext,
  type ComponentOutput,
} from "../types.js";

const R = Math.round;

export const progressBarRenderer: ComponentRenderer = {
  type: "progress-bar",
  dependencies: [],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, width, instanceId } = ctx;
    const { colors } = style;
    const totalDurationMs = parseFloat(data.durationMs) || timing.durationMs;
    const barHeight = Math.max(3, R(4 * s));

    const css = `
      .ff-pb-wrap {
        position: fixed; bottom: 0; left: 0; width: 100%;
        z-index: 9998; pointer-events: none;
        height: ${barHeight}px;
      }
      .ff-pb-track {
        width: 100%; height: 100%;
        background: rgba(255,255,255,0.1);
      }
      .ff-pb-fill {
        height: 100%; width: 0%;
        background: ${colors.primary};
        box-shadow: 0 0 ${R(8 * s)}px ${colors.primary}80;
        transition: none;
      }`;

    const html = `<div class="ff-pb-wrap">
      <div class="ff-pb-track">
        <div class="ff-pb-fill" id="${instanceId}-fill"></div>
      </div>
    </div>`;

    const initJs = `
    el._fill = document.getElementById('${instanceId}-fill');
    el._totalMs = ${totalDurationMs};`;

    const updateJs = `
      var pct = Math.min(100, (localT / el._totalMs) * 100);
      el._fill.style.width = pct.toFixed(2) + '%';`;

    return { css, html, initJs, updateJs };
  },
};
