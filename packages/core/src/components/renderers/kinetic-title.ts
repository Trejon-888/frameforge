/**
 * Kinetic Title — Words fly in from different directions
 *
 * Replaces: hook-card
 * Technology: GSAP
 * Visual: Words fly in from golden-angle directions with rotation,
 *         background scales in with bounce, glow pulse while visible.
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

export const kineticTitleRenderer: ComponentRenderer = {
  type: "kinetic-title",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId } = ctx;
    const { colors, typography, elements } = style;
    const text = (data.text as string) || "";
    const words = text.split(/\s+/).filter((w) => w.length > 0);

    const css = `
      .ff-kt-wrap {
        position: fixed; top: ${R(100 * s)}px; left: 50%; transform: translateX(-50%);
        z-index: 9990; pointer-events: none; max-width: 80%;
      }
      .ff-kt-bg {
        background: ${colors.primary};
        border: ${Math.max(3, R(elements.borderWidth * 2))}px solid #000;
        border-radius: ${R(elements.borderRadius * s)}px;
        padding: ${R(28 * s)}px ${R(56 * s)}px;
        box-shadow: ${elements.shadowStyle};
        text-align: center;
      }
      .ff-kt-word {
        display: inline-block;
        font-family: ${typography.heading};
        font-size: ${R(38 * s)}px; font-weight: 800; color: #000;
        text-transform: uppercase;
        letter-spacing: ${R(4 * s)}px;
        margin: 0 ${R(6 * s)}px;
      }`;

    const wordHtml = words
      .map(
        (w, i) =>
          `<span class="ff-kt-word" id="${instanceId}-w${i}">${escapeHtml(w)}</span>`
      )
      .join(" ");

    const html = `<div class="ff-kt-wrap"><div class="ff-kt-bg" id="${instanceId}-bg">${wordHtml}</div></div>`;

    // Golden angle distribution for word entry directions
    const directions = words.map((_, i) => {
      const angle = ((i * 137.5) % 360) * (Math.PI / 180);
      const dist = 80 * s;
      return {
        x: R(Math.cos(angle) * dist),
        y: R(Math.sin(angle) * dist),
        rot: (i % 2 === 0 ? 1 : -1) * (10 + ((i * 5) % 20)),
      };
    });

    const exitStartSec = Math.max(0.5, (timing.durationMs - 400) / 1000);

    const wordInits = words
      .map((_, i) => {
        const d = directions[i];
        return `gsap.set(document.getElementById('${instanceId}-w${i}'), { opacity: 0, x: ${d.x}, y: ${d.y}, rotation: ${d.rot} });
    tl.to(document.getElementById('${instanceId}-w${i}'), { opacity: 1, x: 0, y: 0, rotation: 0, duration: 0.35, ease: 'back.out(1.4)' }, ${(0.15 + i * 0.08).toFixed(3)});`;
      })
      .join("\n    ");

    const initJs = `
    var bg = document.getElementById('${instanceId}-bg');
    var tl = gsap.timeline({ paused: true });
    gsap.set(bg, { scale: 0 });
    tl.to(bg, { scale: 1, duration: 0.4, ease: 'back.out(1.7)' });
    ${wordInits}
    tl.to(bg, { scale: 0, opacity: 0, duration: 0.35, ease: 'power2.in' }, ${exitStartSec.toFixed(3)});
    el._tl = tl;`;

    const updateJs = `if (el._tl) el._tl.time(localT / 1000);`;

    return { css, html, initJs, updateJs };
  },
};
