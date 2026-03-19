/**
 * Code Terminal — Full-screen panel: API integration terminal typing animation
 *
 * Triggers: "API integration", "code that", "deploy it", "technical setup"
 * Layout: Left headline + Right large terminal window with typing command → output
 */

import {
  type ComponentRenderer,
  type ComponentTiming,
  type ComponentContext,
  type ComponentOutput,
  GSAP_CDN,
} from "../types.js";

const R = Math.round;

const LINES = [
  { prefix: "$", text: "ai-agent run --client 47-prospects --auto-reply", done: false },
  { prefix: "▶", text: "Connecting to CRM...", done: false },
  { prefix: "▶", text: "Generating personalized messages...", done: false },
  { prefix: "▶", text: "Sending outreach campaign...", done: false },
  { prefix: "✓", text: "47 emails sent. 3 meetings booked.", done: true },
];

export const codeTerminalRenderer: ComponentRenderer = {
  type: "code-terminal",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId: id } = ctx;
    const { colors, typography } = style;

    const linesHtml = LINES.map(
      (line, i) => `
      <div class="ff-term-line${line.done ? " ff-term-done" : ""}" id="${id}-l${i}">
        <span class="ff-term-pre${line.done ? " ff-term-pre-ok" : ""}">${line.prefix}</span>
        <span class="ff-term-txt" id="${id}-t${i}"></span>
      </div>`
    ).join("");

    const css = `
      .ff-term-bd {
        position: fixed; inset: 0; z-index: 9990;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }
      .ff-term-panel {
        width: ${R(920 * s)}px;
        background: rgba(6,8,14,0.97);
        border: ${R(2 * s)}px solid rgba(255,255,255,0.14);
        border-radius: ${R(20 * s)}px;
        box-shadow: 0 ${R(32 * s)}px ${R(80 * s)}px rgba(0,0,0,0.9),
                    ${R(8 * s)}px ${R(8 * s)}px 0 ${colors.primary},
                    inset 0 1px 0 rgba(255,255,255,0.07);
        padding: ${R(44 * s)}px ${R(56 * s)}px;
        display: flex; gap: ${R(52 * s)}px; align-items: center;
        overflow: hidden;
      }
      .ff-term-lft { flex: 1; min-width: 0; }
      .ff-term-rgt { flex: 1.4; min-width: 0; }
      .ff-term-tag {
        font-family: ${typography.body};
        font-size: ${R(11 * s)}px; font-weight: 700;
        letter-spacing: ${R(2 * s)}px; color: ${colors.primary};
        text-transform: uppercase; margin-bottom: ${R(18 * s)}px; opacity: 0;
      }
      .ff-term-h2 {
        font-family: ${typography.heading};
        font-size: ${R(46 * s)}px; font-weight: 900;
        line-height: 1.05; color: #fff;
        margin-bottom: ${R(14 * s)}px; opacity: 0;
      }
      .ff-term-sub {
        font-family: ${typography.body}; font-size: ${R(15 * s)}px; line-height: 1.6;
        color: rgba(255,255,255,0.45); opacity: 0;
      }
      .ff-term-card {
        background: rgba(4,6,10,0.98);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: ${R(12 * s)}px;
        overflow: hidden; opacity: 0;
      }
      .ff-term-titlebar {
        background: rgba(255,255,255,0.04);
        border-bottom: 1px solid rgba(255,255,255,0.07);
        padding: ${R(10 * s)}px ${R(14 * s)}px;
        display: flex; align-items: center; gap: ${R(6 * s)}px;
      }
      .ff-term-tdot { width: ${R(10 * s)}px; height: ${R(10 * s)}px; border-radius: 50%; }
      .ff-term-title-txt {
        font-family: ${typography.body}; font-size: ${R(10 * s)}px; font-weight: 600;
        color: rgba(255,255,255,0.22); margin: 0 auto; letter-spacing: ${R(1 * s)}px;
      }
      .ff-term-body {
        padding: ${R(16 * s)}px ${R(18 * s)}px;
        display: flex; flex-direction: column; gap: ${R(7 * s)}px;
      }
      .ff-term-line { display: flex; align-items: flex-start; gap: ${R(8 * s)}px; opacity: 0; }
      .ff-term-pre {
        font-family: 'Space Mono', monospace;
        font-size: ${R(12 * s)}px; font-weight: 700;
        color: ${colors.primary}; flex-shrink: 0; line-height: 1.6;
      }
      .ff-term-pre-ok { color: #00e57a; }
      .ff-term-txt {
        font-family: 'Space Mono', monospace;
        font-size: ${R(11 * s)}px; font-weight: 400;
        color: rgba(255,255,255,0.65); line-height: 1.6; word-break: break-all;
      }
      .ff-term-done .ff-term-txt {
        color: #00e57a; font-weight: 700;
        text-shadow: 0 0 ${R(8 * s)}px rgba(0,229,122,0.5);
      }`;

    const html = `
      <div class="ff-term-bd" id="${id}-bd">
        <div class="ff-term-panel" id="${id}-panel">
          <div class="ff-term-lft">
            <div class="ff-term-tag" id="${id}-tag">🔧 API Integration</div>
            <h2 class="ff-term-h2" id="${id}-h2">Automate your<br>entire workflow.</h2>
            <p class="ff-term-sub" id="${id}-sub">One command triggers your<br>entire AI stack automatically.</p>
          </div>
          <div class="ff-term-rgt">
            <div class="ff-term-card" id="${id}-card">
              <div class="ff-term-titlebar">
                <div class="ff-term-tdot" style="background:#ff5f57"></div>
                <div class="ff-term-tdot" style="background:#ffbd2e"></div>
                <div class="ff-term-tdot" style="background:#28c840"></div>
                <div class="ff-term-title-txt">terminal — bash</div>
              </div>
              <div class="ff-term-body">${linesHtml}</div>
            </div>
          </div>
        </div>
      </div>`;

    const exitSec = ((timing.durationMs - 400) / 1000).toFixed(3);
    const lineTextsJson = JSON.stringify(LINES.map((l) => l.text));

    const initJs = `
      var bd = document.getElementById('${id}-bd');
      var panel = document.getElementById('${id}-panel');
      var tag = document.getElementById('${id}-tag');
      var h2 = document.getElementById('${id}-h2');
      var sub = document.getElementById('${id}-sub');
      var card = document.getElementById('${id}-card');
      var lineEls = [0,1,2,3,4].map(function(i){ return document.getElementById('${id}-l'+i); });
      var txtEls = [0,1,2,3,4].map(function(i){ return document.getElementById('${id}-t'+i); });
      var lineTexts = ${lineTextsJson};

      gsap.set(bd, { backgroundColor: 'rgba(0,0,0,0)' });
      gsap.set(panel, { scale: 0.78, opacity: 0, y: ${R(60 * s)} });
      var tl = gsap.timeline({ paused: true });

      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0.48)', duration: 0.4 }, 0);
      tl.to(panel, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.3)' }, 0.05);
      tl.to(tag, { opacity: 1, duration: 0.3 }, 0.5);
      tl.to(h2, { opacity: 1, duration: 0.4, ease: 'power3.out' }, 0.62);
      tl.to(sub, { opacity: 1, duration: 0.35 }, 0.82);
      tl.to(card, { opacity: 1, duration: 0.3 }, 0.9);

      // Line 0: command types out
      tl.to(lineEls[0], { opacity: 1, duration: 0.15 }, 1.0);
      var cmdText = lineTexts[0];
      var cmdDur = Math.min(0.9, cmdText.length * 0.022);
      tl.to({}, {
        duration: cmdDur,
        onUpdate: function() {
          var p = this.progress();
          var chars = Math.round(p * cmdText.length);
          txtEls[0].textContent = cmdText.substring(0, chars) + (chars < cmdText.length ? '|' : '');
        },
        onComplete: function() { txtEls[0].textContent = cmdText; }
      }, 1.05);

      // Lines 1-4 appear in sequence
      [1,2,3,4].forEach(function(i) {
        var t = 1.05 + cmdDur + (i - 1) * 0.48;
        tl.to(lineEls[i], { opacity: 1, duration: 0.2 }, t);
        tl.add(function(idx){ return function(){ txtEls[idx].textContent = lineTexts[idx]; }; }(i), t + 0.05);
      });

      tl.to(panel, { scale: 0.92, opacity: 0, y: ${R(-30 * s)}, duration: 0.4, ease: 'power2.in' }, ${exitSec});
      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.35 }, ${exitSec});
      el._tl = tl;`;

    const updateJs = `if (el._tl) el._tl.time(localT / 1000);`;
    return { css, html, initJs, updateJs };
  },
};
