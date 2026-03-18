/**
 * AI Workflow — Cinema standalone renderer
 *
 * Full-screen: 5-node horizontal pipeline (Trigger → Enrich → AI Agent → Schedule → Done)
 * SVG strokeDashoffset reveals connecting lines between nodes.
 * Each node activates with glow pulse. A dot travels each arrow path.
 * Top: large headline. Bottom: node row with SVG connectors.
 */

import { CinemaStandaloneRenderer } from "./base-standalone.js";
import { R, hexToRgba } from "./shared.js";

const NODES = [
  { icon: "⚡", label: "Trigger", sub: "New Lead" },
  { icon: "🔍", label: "Enrich", sub: "CRM Lookup" },
  { icon: "🤖", label: "AI Agent", sub: "Writes Reply" },
  { icon: "📅", label: "Schedule", sub: "Books Call" },
  { icon: "✓", label: "Done", sub: "Deal Won", done: true },
];

class AiWorkflowRenderer extends CinemaStandaloneRenderer {
  readonly type = "ai-workflow";
  protected readonly ns = "ff-wf";

  protected contentCss(s: number, primary: string, bodyFont: string, headFont: string): string {
    return `
.ff-wf-center {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  gap: ${R(48 * s)}px; padding: ${R(32 * s)}px;
}
.ff-wf-tag {
  font-family: ${bodyFont}; font-size: ${R(11 * s)}px; font-weight: 700;
  letter-spacing: ${R(3 * s)}px; color: ${primary};
  text-transform: uppercase; opacity: 0;
}
.ff-wf-headline {
  font-family: ${headFont}; font-size: ${R(58 * s)}px; font-weight: 900;
  line-height: 1.05; color: #fff; text-align: center; opacity: 0;
}
.ff-wf-sub {
  font-family: ${bodyFont}; font-size: ${R(16 * s)}px; line-height: 1.6;
  color: rgba(255,255,255,0.45); text-align: center; opacity: 0;
}
.ff-wf-pipeline {
  display: flex; align-items: center; gap: 0;
  position: relative; width: 100%;
  justify-content: center;
}
.ff-wf-node {
  display: flex; flex-direction: column; align-items: center;
  gap: ${R(8 * s)}px; position: relative; z-index: 2;
  opacity: 0; transform: translateY(${R(16 * s)}px);
}
.ff-wf-node-icon {
  width: ${R(64 * s)}px; height: ${R(64 * s)}px;
  border-radius: ${R(16 * s)}px;
  background: rgba(255,255,255,0.06);
  border: ${R(1.5 * s)}px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: ${R(26 * s)}px;
  transition: none;
}
.ff-wf-node-label {
  font-family: ${bodyFont}; font-size: ${R(11 * s)}px; font-weight: 700;
  color: rgba(255,255,255,0.7); text-align: center;
}
.ff-wf-node-sub {
  font-family: ${bodyFont}; font-size: ${R(9 * s)}px;
  color: rgba(255,255,255,0.3); text-align: center;
}
.ff-wf-node-done .ff-wf-node-icon {
  background: ${primary}; border-color: ${primary}; color: #000;
}
.ff-wf-node-done .ff-wf-node-label { color: ${primary}; }
.ff-wf-connector {
  flex: 1; height: ${R(2 * s)}px; position: relative;
  margin: 0 ${R(4 * s)}px; margin-bottom: ${R(52 * s)}px;
}
.ff-wf-conn-line {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
}
.ff-wf-conn-fill {
  height: 100%; width: 0%; background: ${primary};
  box-shadow: 0 0 ${R(8 * s)}px ${hexToRgba(primary, 0.7)};
}
.ff-wf-orb {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: ${R(8 * s)}px; height: ${R(8 * s)}px; border-radius: 50%;
  background: ${primary};
  box-shadow: 0 0 ${R(12 * s)}px ${hexToRgba(primary, 0.9)};
  opacity: 0; left: 0;
}`;
  }

  protected contentHtml(id: string, s: number, _primary: string): string {
    const nodesHtml = NODES.map((n, i) => {
      const parts = [
        `<div class="ff-wf-node${n.done ? " ff-wf-node-done" : ""}" id="${id}-node${i}">
  <div class="ff-wf-node-icon">${n.icon}</div>
  <div class="ff-wf-node-label">${n.label}</div>
  <div class="ff-wf-node-sub">${n.sub}</div>
</div>`,
      ];
      if (i < NODES.length - 1) {
        parts.push(`
<div class="ff-wf-connector">
  <div class="ff-wf-conn-line">
    <div class="ff-wf-conn-fill" id="${id}-fill${i}"></div>
  </div>
  <div class="ff-wf-orb" id="${id}-orb${i}"></div>
</div>`);
      }
      return parts.join("");
    }).join("");

    return `
<div class="ff-wf-center">
  <div class="ff-wf-tag" id="${id}-tag">🤖 AI Automation</div>
  <div>
    <div class="ff-wf-headline" id="${id}-h1">Your AI agent<br>handles everything.</div>
    <div class="ff-wf-sub" id="${id}-sub" style="margin-top:${R(12 * s)}px">One trigger. Five steps. Zero manual work.</div>
  </div>
  <div class="ff-wf-pipeline">${nodesHtml}</div>
</div>`;
  }

  protected contentInitJs(id: string, s: number, primary: string): string {
    return `
var scene = document.getElementById('${id}-scene');
gsap.set(scene, { opacity: 0 });
var tl = gsap.timeline({ paused: true });
tl.to(scene, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);

tl.to(document.getElementById('${id}-tag'), { opacity: 1, duration: 0.3 }, 0.35);
tl.to(document.getElementById('${id}-h1'), { opacity: 1, duration: 0.45, ease: 'power3.out' }, 0.5);
tl.to(document.getElementById('${id}-sub'), { opacity: 1, duration: 0.3 }, 0.78);

// Nodes enter with stagger
${NODES.map((_, i) => `tl.to(document.getElementById('${id}-node${i}'), { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.5)' }, ${1.0 + i * 0.15});`).join("\n")}

// Connectors: fill + orb travel for each
${Array.from({ length: NODES.length - 1 }, (_, i) => {
  const t = 1.2 + i * 0.55;
  return `
// Connector ${i}
tl.to(document.getElementById('${id}-fill${i}'), { width: '100%', duration: 0.4, ease: 'power2.inOut' }, ${t});
tl.to(document.getElementById('${id}-orb${i}'), { opacity: 1, duration: 0.1 }, ${t});
tl.to(document.getElementById('${id}-orb${i}'), { left: 'calc(100% - ${R(8 * s)}px)', duration: 0.4, ease: 'power2.inOut' }, ${t});
tl.to(document.getElementById('${id}-orb${i}'), { opacity: 0, duration: 0.1 }, ${t + 0.38});`;
}).join("\n")}

// Node icon glow on activate
${NODES.map((n, i) => {
  const t = 1.2 + i * 0.55;
  if (n.done) return `tl.to(document.getElementById('${id}-node${i}'), { scale: 1.06, duration: 0.15, yoyo: true, repeat: 1 }, ${t + 0.45});`;
  return `tl.to(document.getElementById('${id}-node${i}').querySelector('.ff-wf-node-icon'), { boxShadow: '0 0 ${R(20 * s)}px ${hexToRgba(primary, 0.6)}', duration: 0.2 }, ${t + 0.45});`;
}).join("\n")}`;
  }
}

export const aiWorkflowRenderer = new AiWorkflowRenderer();
