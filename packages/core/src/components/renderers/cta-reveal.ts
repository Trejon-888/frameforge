/**
 * CTA Reveal — Dramatic call-to-action with scale + glow
 *
 * Replaces: cta-card
 * Technology: GSAP
 * Visual: Scales in from center with glow pulse effect,
 *         button slides up with spring.
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

export const ctaRevealRenderer: ComponentRenderer = {
  type: "cta-reveal",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId } = ctx;
    const { colors, typography, elements } = style;
    const text = (data.text as string) || "Follow for more";
    const subtext = (data.subtext as string) || "";

    const css = `
      .ff-cr-wrap {
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9990; pointer-events: none;
        text-align: center;
      }
      .ff-cr-text {
        font-family: ${typography.heading};
        font-size: ${R(64 * s)}px; font-weight: 900;
        color: ${colors.text};
        text-shadow: 3px 3px 0 #000, 0 0 ${R(40 * s)}px rgba(0,0,0,0.3);
        margin-bottom: ${R(20 * s)}px;
      }
      .ff-cr-sub {
        font-family: ${typography.body};
        font-size: ${R(32 * s)}px; font-weight: 600;
        color: ${colors.primary};
        text-shadow: 2px 2px 0 #000;
        margin-bottom: ${R(24 * s)}px;
      }
      .ff-cr-btn {
        display: inline-block;
        background: ${colors.primary};
        color: #000;
        border: ${Math.max(2, elements.borderWidth)}px solid #000;
        border-radius: ${R(elements.borderRadius * s)}px;
        padding: ${R(20 * s)}px ${R(52 * s)}px;
        font-family: ${typography.heading};
        font-size: ${R(30 * s)}px; font-weight: 800;
        box-shadow: ${elements.shadowStyle}, 0 0 ${R(30 * s)}px ${colors.primary}40;
      }
      .ff-cr-glow {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: ${R(300 * s)}px; height: ${R(300 * s)}px;
        border-radius: 50%;
        background: radial-gradient(circle, ${colors.primary}30 0%, transparent 70%);
        pointer-events: none;
      }`;

    const html = `<div class="ff-cr-wrap" id="${instanceId}-wrap">
      <div class="ff-cr-glow" id="${instanceId}-glow"></div>
      <div class="ff-cr-text" id="${instanceId}-text">${escapeHtml(text)}</div>
      ${subtext ? `<div class="ff-cr-sub">${escapeHtml(subtext)}</div>` : ""}
      <div class="ff-cr-btn" id="${instanceId}-btn">${escapeHtml(text)}</div>
    </div>`;

    const exitStartSec = Math.max(1.5, (timing.durationMs - 500) / 1000);

    const initJs = `
    var wrap = document.getElementById('${instanceId}-wrap');
    var glow = document.getElementById('${instanceId}-glow');
    var textEl = document.getElementById('${instanceId}-text');
    var btn = document.getElementById('${instanceId}-btn');
    var tl = gsap.timeline({ paused: true });
    gsap.set(wrap, { scale: 0.5, opacity: 0 });
    gsap.set(btn, { y: ${R(30 * s)}, opacity: 0 });
    gsap.set(glow, { scale: 0.3, opacity: 0 });
    tl.to(wrap, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' });
    tl.to(glow, { scale: 1.2, opacity: 0.6, duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0.3);
    tl.to(btn, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.4)' }, 0.4);
    tl.to(wrap, { scale: 0.5, opacity: 0, duration: 0.4, ease: 'power2.in' }, ${exitStartSec.toFixed(3)});
    el._tl = tl;`;

    const updateJs = `if (el._tl) el._tl.time(localT / 1000);`;

    return { css, html, initJs, updateJs };
  },
};
