/**
 * Pipeline Board — Full-screen panel: AI sales pipeline Kanban
 *
 * Triggers: "sales pipeline", "close deals", "lead generation", "client acquisition"
 * Layout: Left headline + Right 3-column Kanban with deal cards (one closes with ✓)
 */

import {
  type ComponentRenderer,
  type ComponentTiming,
  type ComponentContext,
  type ComponentOutput,
  GSAP_CDN,
} from "../types.js";

const R = Math.round;

const COLS = [
  { label: "Leads", cards: ["Agency CEO", "SaaS Founder", "E-comm Brand"] },
  { label: "Active", cards: ["Tech Startup", "PE Firm"] },
  { label: "Closed ✓", cards: ["Growth Co."] },
];

export const pipelineBoardRenderer: ComponentRenderer = {
  type: "pipeline-board",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId: id } = ctx;
    const { colors, typography } = style;

    const colsHtml = COLS.map(
      (col, ci) => `
      <div class="ff-kb-col" id="${id}-col${ci}">
        <div class="ff-kb-col-hdr">${col.label}</div>
        ${col.cards.map(
          (card, ri) =>
            `<div class="ff-kb-card${ci === 2 ? " ff-kb-won" : ""}" id="${id}-c${ci}${ri}">${card}</div>`
        ).join("")}
      </div>`
    ).join("");

    const css = `
      .ff-kb-bd {
        position: fixed; inset: 0; z-index: 9990;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }
      .ff-kb-panel {
        width: ${R(920 * s)}px;
        background: rgba(6,8,14,0.97);
        border: ${R(2 * s)}px solid rgba(255,255,255,0.14);
        border-radius: ${R(20 * s)}px;
        box-shadow: 0 ${R(32 * s)}px ${R(80 * s)}px rgba(0,0,0,0.9),
                    ${R(8 * s)}px ${R(8 * s)}px 0 ${colors.primary},
                    inset 0 1px 0 rgba(255,255,255,0.07);
        padding: ${R(44 * s)}px ${R(56 * s)}px;
        display: flex; gap: ${R(56 * s)}px; align-items: flex-start;
        overflow: hidden;
      }
      .ff-kb-lft { flex: 1; min-width: 0; }
      .ff-kb-rgt { flex: 1.5; min-width: 0; }
      .ff-kb-tag {
        font-family: ${typography.body};
        font-size: ${R(11 * s)}px; font-weight: 700;
        letter-spacing: ${R(2 * s)}px; color: ${colors.primary};
        text-transform: uppercase; margin-bottom: ${R(18 * s)}px; opacity: 0;
      }
      .ff-kb-h2 {
        font-family: ${typography.heading};
        font-size: ${R(46 * s)}px; font-weight: 900;
        line-height: 1.05; color: #fff;
        margin-bottom: ${R(14 * s)}px; opacity: 0;
      }
      .ff-kb-sub {
        font-family: ${typography.body}; font-size: ${R(15 * s)}px; line-height: 1.6;
        color: rgba(255,255,255,0.45); margin-bottom: ${R(32 * s)}px; opacity: 0;
      }
      .ff-kb-badge {
        display: inline-flex; align-items: center; gap: ${R(10 * s)}px;
        background: rgba(0,229,122,0.12); border: 1px solid rgba(0,229,122,0.35);
        border-radius: ${R(40 * s)}px; padding: ${R(10 * s)}px ${R(22 * s)}px;
        font-family: ${typography.body}; font-size: ${R(14 * s)}px; font-weight: 700;
        color: #00e57a; opacity: 0;
      }
      .ff-kb-bdot { width: ${R(8 * s)}px; height: ${R(8 * s)}px; background: #00e57a; border-radius: 50%; }
      .ff-kb-cols {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: ${R(10 * s)}px;
      }
      .ff-kb-col { opacity: 0; }
      .ff-kb-col-hdr {
        font-family: ${typography.body};
        font-size: ${R(10 * s)}px; font-weight: 700;
        color: rgba(255,255,255,0.35); text-transform: uppercase;
        letter-spacing: ${R(1 * s)}px; margin-bottom: ${R(8 * s)}px; text-align: center;
      }
      .ff-kb-card {
        font-family: ${typography.body};
        font-size: ${R(11 * s)}px; font-weight: 600;
        color: rgba(255,255,255,0.65);
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.09);
        border-radius: ${R(7 * s)}px;
        padding: ${R(10 * s)}px ${R(10 * s)}px;
        margin-bottom: ${R(6 * s)}px;
        transform: scaleX(0); transform-origin: left;
        text-align: center;
      }
      .ff-kb-won {
        background: ${colors.primary}; border-color: ${colors.primary};
        color: #000; font-weight: 800;
        box-shadow: 0 0 ${R(14 * s)}px ${colors.primary}55;
      }`;

    const html = `
      <div class="ff-kb-bd" id="${id}-bd">
        <div class="ff-kb-panel" id="${id}-panel">
          <div class="ff-kb-lft">
            <div class="ff-kb-tag" id="${id}-tag">📊 Sales Pipeline</div>
            <h2 class="ff-kb-h2" id="${id}-h2">Close more<br>deals faster.</h2>
            <p class="ff-kb-sub" id="${id}-sub">AI moves leads through your pipeline<br>and closes deals on autopilot.</p>
            <div class="ff-kb-badge" id="${id}-badge">
              <div class="ff-kb-bdot"></div>✓ Deal closed
            </div>
          </div>
          <div class="ff-kb-rgt">
            <div class="ff-kb-cols">${colsHtml}</div>
          </div>
        </div>
      </div>`;

    const exitSec = ((timing.durationMs - 400) / 1000).toFixed(3);

    const initJs = `
      var bd = document.getElementById('${id}-bd');
      var panel = document.getElementById('${id}-panel');
      var tag = document.getElementById('${id}-tag');
      var h2 = document.getElementById('${id}-h2');
      var sub = document.getElementById('${id}-sub');
      var badge = document.getElementById('${id}-badge');
      var cols = [0,1,2].map(function(i){ return document.getElementById('${id}-col'+i); });
      var allCards = [];
      [[3],[2],[1]].forEach(function(counts, ci) {
        for (var ri = 0; ri < counts[0]; ri++) {
          var c = document.getElementById('${id}-c'+ci+ri);
          if (c) allCards.push({ el: c, ci: ci, ri: ri });
        }
      });

      gsap.set(bd, { backgroundColor: 'rgba(0,0,0,0)' });
      gsap.set(panel, { scale: 0.78, opacity: 0, y: ${R(60 * s)} });
      var tl = gsap.timeline({ paused: true });

      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0.48)', duration: 0.4 }, 0);
      tl.to(panel, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.3)' }, 0.05);
      tl.to(tag, { opacity: 1, duration: 0.3 }, 0.5);
      tl.to(h2, { opacity: 1, duration: 0.4, ease: 'power3.out' }, 0.62);
      tl.to(sub, { opacity: 1, duration: 0.35 }, 0.82);

      cols.forEach(function(col, i) {
        tl.to(col, { opacity: 1, duration: 0.25 }, 0.8 + i * 0.12);
      });
      allCards.forEach(function(c) {
        tl.to(c.el, { scaleX: 1, duration: 0.22, ease: 'power2.out' }, 1.0 + c.ci * 0.15 + c.ri * 0.1);
      });

      // Won card pulse
      var wonCard = document.getElementById('${id}-c20');
      if (wonCard) {
        tl.to(wonCard, { scale: 1.06, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }, 1.75);
      }
      tl.to(badge, { opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, 1.9);

      tl.to(panel, { scale: 0.92, opacity: 0, y: ${R(-30 * s)}, duration: 0.4, ease: 'power2.in' }, ${exitSec});
      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.35 }, ${exitSec});
      el._tl = tl;`;

    const updateJs = `if (el._tl) el._tl.time(localT / 1000);`;
    return { css, html, initJs, updateJs };
  },
};
