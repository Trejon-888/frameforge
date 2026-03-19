/**
 * AI Workflow — Full-screen panel: AI automation pipeline diagram
 *
 * Triggers: "AI agent", "automate workflow", "runs automatically"
 * Layout: Left headline + Right 5-node horizontal pipeline with glow activations
 */

import {
  type ComponentRenderer,
  type ComponentTiming,
  type ComponentContext,
  type ComponentOutput,
  GSAP_CDN,
} from "../types.js";

const R = Math.round;

const NODES = [
  { icon: "▶", label: "Trigger" },
  { icon: "🔍", label: "Qualify" },
  { icon: "⚡", label: "AI Agent" },
  { icon: "📅", label: "Schedule" },
  { icon: "✓", label: "Done" },
];

export const aiWorkflowRenderer: ComponentRenderer = {
  type: "ai-workflow",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId: id } = ctx;
    const { colors, typography } = style;

    const nodeSize = R(56 * s);
    const nodesHtml = NODES.map(
      (n, i) => `
      <div class="ff-wf-node-wrap">
        <div class="ff-wf-node" id="${id}-n${i}">
          <span class="ff-wf-node-ico">${n.icon}</span>
        </div>
        <div class="ff-wf-node-lbl" id="${id}-lbl${i}">${n.label}</div>
        ${i < NODES.length - 1 ? `
          <div class="ff-wf-arrow" id="${id}-a${i}">
            <div class="ff-wf-dot" id="${id}-d${i}"></div>
          </div>` : ""}
      </div>`
    ).join("");

    const css = `
      .ff-wf-bd {
        position: fixed; inset: 0; z-index: 9990;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }
      .ff-wf-panel {
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
      .ff-wf-lft { flex: 1; min-width: 0; }
      .ff-wf-rgt { flex: 1.4; min-width: 0; }
      .ff-wf-tag {
        font-family: ${typography.body};
        font-size: ${R(11 * s)}px; font-weight: 700;
        letter-spacing: ${R(2 * s)}px; color: ${colors.primary};
        text-transform: uppercase; margin-bottom: ${R(18 * s)}px; opacity: 0;
      }
      .ff-wf-h2 {
        font-family: ${typography.heading};
        font-size: ${R(46 * s)}px; font-weight: 900;
        line-height: 1.05; color: #fff;
        margin-bottom: ${R(14 * s)}px; opacity: 0;
      }
      .ff-wf-sub {
        font-family: ${typography.body}; font-size: ${R(15 * s)}px; line-height: 1.6;
        color: rgba(255,255,255,0.45); margin-bottom: ${R(28 * s)}px; opacity: 0;
      }
      .ff-wf-live {
        display: inline-flex; align-items: center; gap: ${R(8 * s)}px;
        font-family: ${typography.body}; font-size: ${R(13 * s)}px; font-weight: 700;
        color: #00e57a; opacity: 0;
      }
      .ff-wf-live-dot { width: ${R(8 * s)}px; height: ${R(8 * s)}px; background: #00e57a; border-radius: 50%; }
      .ff-wf-nodes {
        display: flex; align-items: center; justify-content: space-between;
        width: 100%; position: relative;
      }
      .ff-wf-node-wrap {
        display: flex; flex-direction: column; align-items: center;
        gap: ${R(8 * s)}px; position: relative; flex: 1;
      }
      .ff-wf-node {
        width: ${nodeSize}px; height: ${nodeSize}px;
        border-radius: ${R(14 * s)}px;
        background: rgba(255,255,255,0.05);
        border: ${R(2 * s)}px solid rgba(255,255,255,0.1);
        display: flex; align-items: center; justify-content: center;
        font-size: ${R(20 * s)}px;
        opacity: 0; transform: scale(0.5);
        position: relative; z-index: 2;
      }
      .ff-wf-node.active {
        border-color: ${colors.primary};
        background: rgba(255,255,255,0.08);
        box-shadow: 0 0 ${R(24 * s)}px ${colors.primary}60,
                    0 0 ${R(8 * s)}px ${colors.primary}40;
      }
      .ff-wf-node-ico { line-height: 1; }
      .ff-wf-node.active .ff-wf-node-ico { filter: drop-shadow(0 0 ${R(4 * s)}px ${colors.primary}); }
      .ff-wf-node-lbl {
        font-family: ${typography.body};
        font-size: ${R(10 * s)}px; font-weight: 700;
        color: rgba(255,255,255,0.3); text-transform: uppercase;
        letter-spacing: ${R(0.5 * s)}px; text-align: center; opacity: 0;
      }
      .ff-wf-node.active + .ff-wf-node-lbl { color: rgba(255,255,255,0.7); }
      .ff-wf-arrow {
        position: absolute;
        top: ${R(nodeSize / 2)}px;
        left: ${R(nodeSize / 2 + 4 * s)}px;
        right: ${R(-8 * s)}px;
        height: ${R(2 * s)}px;
        background: rgba(255,255,255,0.08);
        z-index: 1; opacity: 0;
      }
      .ff-wf-dot {
        position: absolute;
        width: ${R(8 * s)}px; height: ${R(8 * s)}px;
        background: ${colors.primary}; border-radius: 50%;
        top: ${R(-3 * s)}px; left: 0;
        box-shadow: 0 0 ${R(10 * s)}px ${colors.primary};
        opacity: 0;
      }`;

    const html = `
      <div class="ff-wf-bd" id="${id}-bd">
        <div class="ff-wf-panel" id="${id}-panel">
          <div class="ff-wf-lft">
            <div class="ff-wf-tag" id="${id}-tag">⚡ AI Automation</div>
            <h2 class="ff-wf-h2" id="${id}-h2">Let AI do<br>the work.</h2>
            <p class="ff-wf-sub" id="${id}-sub">Your workflow runs automatically<br>while you focus on growth.</p>
            <div class="ff-wf-live" id="${id}-live">
              <div class="ff-wf-live-dot"></div>Running automatically
            </div>
          </div>
          <div class="ff-wf-rgt">
            <div class="ff-wf-nodes">${nodesHtml}</div>
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
      var live = document.getElementById('${id}-live');
      var nodes = [0,1,2,3,4].map(function(i){ return document.getElementById('${id}-n'+i); });
      var lbls = [0,1,2,3,4].map(function(i){ return document.getElementById('${id}-lbl'+i); });
      var arrows = [0,1,2,3].map(function(i){ return document.getElementById('${id}-a'+i); });
      var dots = [0,1,2,3].map(function(i){ return document.getElementById('${id}-d'+i); });

      gsap.set(bd, { backgroundColor: 'rgba(0,0,0,0)' });
      gsap.set(panel, { scale: 0.78, opacity: 0, y: ${R(60 * s)} });
      var tl = gsap.timeline({ paused: true });

      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0.48)', duration: 0.4 }, 0);
      tl.to(panel, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.3)' }, 0.05);
      tl.to(tag, { opacity: 1, duration: 0.3 }, 0.5);
      tl.to(h2, { opacity: 1, duration: 0.4, ease: 'power3.out' }, 0.62);
      tl.to(sub, { opacity: 1, duration: 0.35 }, 0.82);

      nodes.forEach(function(n, i) {
        tl.to(n, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 0.75 + i * 0.12);
        tl.to(lbls[i], { opacity: 1, duration: 0.2 }, 0.9 + i * 0.12);
      });
      arrows.forEach(function(a, i) {
        tl.to(a, { opacity: 1, duration: 0.2 }, 0.9 + i * 0.12);
      });

      // Activate nodes in sequence with glowing dots
      var actStart = 1.5;
      nodes.forEach(function(n, i) {
        tl.add(function(){ n.classList.add('active'); }, actStart + i * 0.38);
        if (dots[i]) {
          tl.to(dots[i], { opacity: 1, x: '100%', duration: 0.32, ease: 'power1.inOut' }, actStart + i * 0.38);
          tl.to(dots[i], { opacity: 0, duration: 0.08 }, actStart + i * 0.38 + 0.32);
        }
      });
      tl.to(live, { opacity: 1, duration: 0.3 }, actStart + 1.5);

      tl.to(panel, { scale: 0.92, opacity: 0, y: ${R(-30 * s)}, duration: 0.4, ease: 'power2.in' }, ${exitSec});
      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.35 }, ${exitSec});
      el._tl = tl;`;

    const updateJs = `if (el._tl) el._tl.time(localT / 1000);`;
    return { css, html, initJs, updateJs };
  },
};
