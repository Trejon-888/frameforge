/**
 * Chapter Wipe — Full-width wipe transition between topics
 *
 * Replaces: chapter-marker
 * Technology: GSAP
 * Visual: Full-width accent bar wipes across screen from left,
 *         label fades in with offset, then bar wipes out to right.
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

export const chapterWipeRenderer: ComponentRenderer = {
  type: "chapter-wipe",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, width, instanceId } = ctx;
    const { colors, typography, elements } = style;
    const label = (data.label as string) || "";

    const barHeight = R(56 * s);

    const css = `
      .ff-cw-wrap {
        position: fixed; top: ${R(70 * s)}px; left: 0; width: 100%;
        z-index: 9990; pointer-events: none;
      }
      .ff-cw-bar {
        width: 100%; height: ${barHeight}px;
        background: ${colors.primary};
        display: flex; align-items: center;
        padding: 0 ${R(40 * s)}px;
        box-shadow: 0 ${R(4 * s)}px ${R(20 * s)}px rgba(0,0,0,0.3);
      }
      .ff-cw-label {
        font-family: ${typography.body};
        font-size: ${R(20 * s)}px; font-weight: 700;
        color: #000;
        text-transform: uppercase;
        letter-spacing: ${R(4 * s)}px;
        white-space: nowrap;
      }`;

    const html = `<div class="ff-cw-wrap">
      <div class="ff-cw-bar" id="${instanceId}-bar">
        <div class="ff-cw-label" id="${instanceId}-label">${escapeHtml(label)}</div>
      </div>
    </div>`;

    const exitStartSec = Math.max(0.8, (timing.durationMs - 500) / 1000);

    const initJs = `
    var bar = document.getElementById('${instanceId}-bar');
    var labelEl = document.getElementById('${instanceId}-label');
    var tl = gsap.timeline({ paused: true });
    gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' });
    gsap.set(labelEl, { opacity: 0, x: ${R(-30 * s)} });
    tl.to(bar, { scaleX: 1, duration: 0.5, ease: 'power3.out' });
    tl.to(labelEl, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }, 0.2);
    tl.set(bar, { transformOrigin: 'right center' }, ${exitStartSec.toFixed(3)});
    tl.to(labelEl, { opacity: 0, duration: 0.2, ease: 'power1.in' }, ${exitStartSec.toFixed(3)});
    tl.to(bar, { scaleX: 0, duration: 0.4, ease: 'power2.in' }, ${(exitStartSec + 0.1).toFixed(3)});
    el._tl = tl;`;

    const updateJs = `if (el._tl) el._tl.time(localT / 1000);`;

    return { css, html, initJs, updateJs };
  },
};
