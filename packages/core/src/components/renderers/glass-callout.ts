/**
 * Glass Callout — Backdrop-blur card with staggered content reveal
 *
 * Replaces: key-point
 * Technology: GSAP
 * Visual: Glass card slides in from the side, content staggers in with
 *         spring physics. Supports top-left and top-right positions.
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

export const glassCalloutRenderer: ComponentRenderer = {
  type: "glass-callout",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId } = ctx;
    const { colors, typography, elements } = style;
    const label = (data.label as string) || "Key Point";
    const text = (data.text as string) || "";

    // Determine slide direction from position data
    const isRight = data._position === "top-right" || !data._position;
    const side = isRight ? "right" : "left";
    const slideFrom = isRight ? R(80 * s) : R(-80 * s);

    const bgColor =
      colors.background === "#ffffff" || colors.background === "#0a0a0a"
        ? "0,0,0,0.7"
        : "23,30,25,0.85";

    const css = `
      .ff-gc-wrap {
        position: fixed; top: ${R(140 * s)}px;
        z-index: 9990; pointer-events: none;
        max-width: ${R(480 * s)}px;
      }
      .ff-gc-wrap.ff-gc-right { right: ${R(60 * s)}px; }
      .ff-gc-wrap.ff-gc-left { left: ${R(60 * s)}px; }
      .ff-gc-card {
        background: rgba(${bgColor});
        backdrop-filter: blur(${R(16 * s)}px);
        -webkit-backdrop-filter: blur(${R(16 * s)}px);
        border: ${Math.max(2, R(elements.borderWidth * 1.5))}px solid ${colors.primary}80;
        border-radius: ${R(elements.borderRadius * s)}px;
        padding: ${R(24 * s)}px ${R(36 * s)}px;
        box-shadow: ${R(6 * s)}px ${R(6 * s)}px 0 ${colors.primary}, 0 0 ${R(30 * s)}px rgba(0,0,0,0.3);
      }
      .ff-gc-label {
        font-family: ${typography.body};
        font-size: ${R(16 * s)}px; font-weight: 700;
        color: ${colors.primary};
        text-transform: uppercase; letter-spacing: ${R(4 * s)}px;
        margin-bottom: ${R(8 * s)}px;
      }
      .ff-gc-text {
        font-family: ${typography.heading};
        font-size: ${R(32 * s)}px; font-weight: 800;
        color: ${colors.text};
        line-height: 1.2;
      }`;

    const html = `<div class="ff-gc-wrap ff-gc-${side}">
      <div class="ff-gc-card" id="${instanceId}-card">
        <div class="ff-gc-label" id="${instanceId}-label">${escapeHtml(label)}</div>
        <div class="ff-gc-text" id="${instanceId}-text">${escapeHtml(text)}</div>
      </div>
    </div>`;

    const exitStartSec = Math.max(0.8, (timing.durationMs - 400) / 1000);

    const initJs = `
    var card = document.getElementById('${instanceId}-card');
    var labelEl = document.getElementById('${instanceId}-label');
    var textEl = document.getElementById('${instanceId}-text');
    var tl = gsap.timeline({ paused: true });
    gsap.set(card, { x: ${slideFrom}, opacity: 0 });
    gsap.set(labelEl, { opacity: 0, y: ${R(15 * s)} });
    gsap.set(textEl, { opacity: 0, y: ${R(20 * s)} });
    tl.to(card, { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.2)' });
    tl.to(labelEl, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.4)' }, 0.2);
    tl.to(textEl, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.4)' }, 0.35);
    tl.to(card, { x: ${slideFrom}, opacity: 0, duration: 0.35, ease: 'power2.in' }, ${exitStartSec.toFixed(3)});
    el._tl = tl;`;

    const updateJs = `if (el._tl) el._tl.time(localT / 1000);`;

    return { css, html, initJs, updateJs };
  },
};
