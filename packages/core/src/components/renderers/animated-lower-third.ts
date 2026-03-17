/**
 * Animated Lower Third — Line draw + name reveal + title fade
 *
 * Replaces: lower-third
 * Technology: GSAP
 * Visual: Line draws from left -> expands to bar -> name wipes in via
 *         clip-path -> title fades up. Exit reverses.
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

export const animatedLowerThirdRenderer: ComponentRenderer = {
  type: "animated-lower-third",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId } = ctx;
    const { colors, typography, elements } = style;
    const name = (data.name as string) || "";
    const title = (data.title as string) || "";

    const css = `
      .ff-lt-wrap {
        position: fixed; bottom: ${R(360 * s)}px; left: ${R(60 * s)}px;
        z-index: 9990; pointer-events: none;
        display: flex; align-items: center; gap: ${R(16 * s)}px;
      }
      .ff-lt-line {
        width: ${R(6 * s)}px;
        background: ${colors.primary};
        border: ${Math.max(1, elements.borderWidth)}px solid #000;
      }
      .ff-lt-content { overflow: hidden; }
      .ff-lt-name {
        font-family: ${typography.heading};
        font-size: ${R(44 * s)}px; font-weight: 900;
        color: ${colors.text};
        text-shadow: 3px 3px 0 #000, 0 0 ${R(20 * s)}px rgba(0,0,0,0.3);
        white-space: nowrap;
      }
      .ff-lt-title {
        font-family: ${typography.body};
        font-size: ${R(22 * s)}px; font-weight: 600;
        color: ${colors.primary};
        text-shadow: 2px 2px 0 #000;
        margin-top: ${R(4 * s)}px;
      }`;

    const html = `<div class="ff-lt-wrap">
      <div class="ff-lt-line" id="${instanceId}-line"></div>
      <div class="ff-lt-content">
        <div class="ff-lt-name" id="${instanceId}-name">${escapeHtml(name)}</div>
        ${title ? `<div class="ff-lt-title" id="${instanceId}-title">${escapeHtml(title)}</div>` : ""}
      </div>
    </div>`;

    const exitStartSec = Math.max(0.8, (timing.durationMs - 400) / 1000);

    const initJs = `
    var line = document.getElementById('${instanceId}-line');
    var nameEl = document.getElementById('${instanceId}-name');
    var titleEl = ${title ? `document.getElementById('${instanceId}-title')` : "null"};
    var tl = gsap.timeline({ paused: true });
    gsap.set(line, { height: 0 });
    gsap.set(nameEl, { clipPath: 'inset(0 100% 0 0)' });
    ${title ? "gsap.set(titleEl, { opacity: 0, y: 10 });" : ""}
    tl.to(line, { height: ${R(80 * s)}, duration: 0.4, ease: 'back.out(1.7)' });
    tl.to(nameEl, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power2.out' }, 0.15);
    ${title ? "tl.to(titleEl, { opacity: 1, y: 0, duration: 0.3, ease: 'power1.out' }, 0.6);" : ""}
    tl.to(line, { height: 0, duration: 0.25, ease: 'power2.in' }, ${exitStartSec.toFixed(3)});
    tl.to(nameEl, { clipPath: 'inset(0 100% 0 0)', duration: 0.3, ease: 'power2.in' }, ${exitStartSec.toFixed(3)});
    ${title ? `tl.to(titleEl, { opacity: 0, duration: 0.2, ease: 'power1.in' }, ${exitStartSec.toFixed(3)});` : ""}
    el._tl = tl;`;

    const updateJs = `if (el._tl) el._tl.time(localT / 1000);`;

    return { css, html, initJs, updateJs };
  },
};
