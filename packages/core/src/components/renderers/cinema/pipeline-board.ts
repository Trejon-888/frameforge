/**
 * Pipeline Board — Cinema renderer
 *
 * Browser mockup: app.salesflow.io/pipeline
 * Content: Kanban with 3 cols (Leads, Qualified, Closed). One card in Leads
 * gets dragged by cursor across to Closed with a deal-won flash.
 */

import { CinemaBrowserRenderer, type HeadlineContent } from "./base-browser.js";
import { R, hexToRgba } from "./shared.js";

const COLS = [
  {
    label: "New Leads",
    count: 14,
    cards: [
      { name: "Growth Co.", val: "$4,200 / mo" },
      { name: "SaaS Founder — Jake R.", val: "$2,800 / mo" },
      { name: "E-comm Brand", val: "$6,100 / mo" },
    ],
  },
  {
    label: "Qualified",
    count: 6,
    cards: [
      { name: "Tech Startup — Maria L.", val: "$9,500 / mo" },
      { name: "PE Firm", val: "$18K / mo" },
    ],
  },
  {
    label: "Closed ✓",
    count: 3,
    cards: [
      { name: "Agency CEO — Tom K.", val: "$12K / mo" },
    ],
  },
];

class PipelineBoardRenderer extends CinemaBrowserRenderer {
  readonly type = "pipeline-board";
  protected readonly ns = "ff-kb";
  protected readonly browserUrl = "app.salesflow.io/pipeline";
  protected readonly navItems = ["Overview", "Pipeline", "Contacts", "Reports"];
  protected readonly activeNav = 1;

  protected headline(_s: number): HeadlineContent {
    return {
      tag: "📊 Sales Pipeline",
      headline: "Close deals<br>faster with<br>AI follow-up.",
      desc: "Every lead tracked. Every deal moved. AI handles the follow-up so you close more.",
    };
  }

  protected viewportCss(s: number, primary: string, bodyFont: string): string {
    return `
.ff-kb-board {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: ${R(8 * s)}px;
  padding: ${R(14 * s)}px ${R(14 * s)}px; background: var(--ff-viewport);
}
.ff-kb-col { display: flex; flex-direction: column; gap: ${R(6 * s)}px; }
.ff-kb-col-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: ${R(6 * s)}px;
  border-bottom: 1px solid var(--ff-border-soft);
  margin-bottom: ${R(2 * s)}px;
}
.ff-kb-col-name {
  font-family: ${bodyFont}; font-size: ${R(10 * s)}px; font-weight: 700;
  color: var(--ff-text-muted); text-transform: uppercase; letter-spacing: 1px;
}
.ff-kb-col-badge {
  font-family: ${bodyFont}; font-size: ${R(9 * s)}px; font-weight: 700;
  background: var(--ff-border-soft); color: var(--ff-text-muted);
  border-radius: ${R(4 * s)}px; padding: ${R(1 * s)}px ${R(6 * s)}px;
}
.ff-kb-card {
  background: var(--ff-surface);
  border: 1px solid var(--ff-border-soft);
  border-radius: ${R(8 * s)}px;
  padding: ${R(10 * s)}px ${R(10 * s)}px;
  opacity: 0; transform: translateY(${R(12 * s)}px);
}
.ff-kb-card-name {
  font-family: ${bodyFont}; font-size: ${R(10 * s)}px; font-weight: 700;
  color: var(--ff-text); margin-bottom: ${R(4 * s)}px;
}
.ff-kb-card-val {
  font-family: ${bodyFont}; font-size: ${R(9 * s)}px;
  color: var(--ff-text-muted);
}
.ff-kb-won-card {
  background: ${primary}; border-color: ${primary};
  box-shadow: 0 0 ${R(16 * s)}px ${hexToRgba(primary, 0.5)};
}
.ff-kb-won-card .ff-kb-card-name { color: #000; }
.ff-kb-won-card .ff-kb-card-val { color: rgba(0,0,0,0.6); }
.ff-kb-drag-card {
  position: absolute; width: ${R(130 * s)}px;
  background: var(--ff-border-soft);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: ${R(8 * s)}px;
  padding: ${R(10 * s)}px; opacity: 0; z-index: 50;
  box-shadow: 0 ${R(8 * s)}px ${R(24 * s)}px rgba(0,0,0,0.6);
}
.ff-kb-drag-name {
  font-family: ${bodyFont}; font-size: ${R(10 * s)}px; font-weight: 700;
  color: var(--ff-text);
}`;
  }

  protected viewportHtml(id: string, s: number): string {
    const colsHtml = COLS.map((col, ci) => {
      const cardsHtml = col.cards.map((card, ri) => `
<div class="ff-kb-card${ci === 2 ? " ff-kb-won-card" : ""}" id="${id}-c${ci}-${ri}">
  <div class="ff-kb-card-name">${card.name}</div>
  <div class="ff-kb-card-val">${card.val}</div>
</div>`).join("");

      return `
<div class="ff-kb-col" id="${id}-col${ci}">
  <div class="ff-kb-col-hdr">
    <span class="ff-kb-col-name">${col.label}</span>
    <span class="ff-kb-col-badge">${col.count}</span>
  </div>
  ${cardsHtml}
</div>`;
    }).join("");

    return `
<div class="ff-kb-board">
  ${colsHtml}
  <div class="ff-kb-drag-card" id="${id}-drag">
    <div class="ff-kb-drag-name">Growth Co.</div>
  </div>
</div>`;
  }

  protected viewportInitJs(id: string, _s: number, _primary: string): string {
    // All cards animate in by column with stagger
    const initCards: string[] = [];
    COLS.forEach((col, ci) => {
      col.cards.forEach((_c, ri) => {
        const t = 1.1 + ci * 0.2 + ri * 0.1;
        initCards.push(`tl.to(document.getElementById('${id}-c${ci}-${ri}'), { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.6)' }, ${t});`);
      });
    });

    return `
${initCards.join("\n")}

// Cursor grabs Growth Co. card (col 0, row 0) and drags to Closed col
var cursor = document.getElementById('${id}-cursor');
var dragCard = document.getElementById('${id}-drag');
var srcCard = document.getElementById('${id}-c0-0');

tl.to(cursor, { opacity: 1, duration: 0.2 }, 1.8);
tl.to(cursor, {
  x: function() {
    var vp = document.getElementById('${id}-vp');
    var r = srcCard.getBoundingClientRect();
    var vr = vp.getBoundingClientRect();
    return r.left - vr.left + r.width / 2 - 10;
  },
  y: function() {
    var vp = document.getElementById('${id}-vp');
    var r = srcCard.getBoundingClientRect();
    var vr = vp.getBoundingClientRect();
    return r.top - vr.top + r.height / 2 - 10;
  },
  duration: 0.5, ease: 'power2.inOut'
}, 1.85);
// Pick up
tl.to(srcCard, { opacity: 0.3, duration: 0.15 }, 2.4);
tl.to(dragCard, { opacity: 1, duration: 0.15 }, 2.4);
// Drag to closed col
var closedCol = document.getElementById('${id}-col2');
tl.to(dragCard, {
  x: function() {
    var vp = document.getElementById('${id}-vp');
    var r = closedCol.getBoundingClientRect();
    var vr = vp.getBoundingClientRect();
    return r.left - vr.left + 8;
  },
  y: function() {
    var vp = document.getElementById('${id}-vp');
    var r = closedCol.getBoundingClientRect();
    var vr = vp.getBoundingClientRect();
    return r.top - vr.top + 44;
  },
  duration: 0.7, ease: 'power2.inOut'
}, 2.5);
tl.to(cursor, {
  x: function() {
    var vp = document.getElementById('${id}-vp');
    var r = closedCol.getBoundingClientRect();
    var vr = vp.getBoundingClientRect();
    return r.left - vr.left + 80;
  },
  y: function() {
    var vp = document.getElementById('${id}-vp');
    var r = closedCol.getBoundingClientRect();
    var vr = vp.getBoundingClientRect();
    return r.top - vr.top + 54;
  },
  duration: 0.7, ease: 'power2.inOut'
}, 2.5);
// Drop — won card flashes
tl.to(dragCard, { opacity: 0, duration: 0.15 }, 3.25);
tl.to(srcCard, { opacity: 0, duration: 0.1 }, 3.25);
tl.to(document.getElementById('${id}-c2-0'), { scale: 1.06, duration: 0.15, yoyo: true, repeat: 1 }, 3.28);
tl.to(cursor, { opacity: 0, duration: 0.25 }, 3.5);`;
  }
}

export const pipelineBoardRenderer = new PipelineBoardRenderer();
