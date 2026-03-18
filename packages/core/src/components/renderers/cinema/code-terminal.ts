/**
 * Code Terminal — Cinema standalone renderer
 *
 * Full-screen: Left headline + Right macOS terminal window.
 * Command types out character-by-character, then 4 process lines appear,
 * final line glows green. Enters with perspective rotateX from base class.
 */

import { CinemaStandaloneRenderer } from "./base-standalone.js";
import { R, hexToRgba } from "./shared.js";

const LINES = [
  { prefix: "$", text: "ai-agent run --prospects 47 --mode auto-reply", done: false },
  { prefix: "▶", text: "Connecting to CRM...", done: false },
  { prefix: "▶", text: "Generating personalized messages...", done: false },
  { prefix: "▶", text: "Sending outreach campaign...", done: false },
  { prefix: "✓", text: "47 emails sent. 3 meetings booked.", done: true },
];

class CodeTerminalRenderer extends CinemaStandaloneRenderer {
  readonly type = "code-terminal";
  protected readonly ns = "ff-term";

  protected contentCss(s: number, primary: string, bodyFont: string, headFont: string): string {
    return `
.ff-term-layout {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: ${R(60 * s)}px;
  padding: ${R(32 * s)}px ${R(56 * s)}px; width: 100%;
}
.ff-term-lft { flex: 0 0 ${R(300 * s)}px; }
.ff-term-tag {
  font-family: ${bodyFont}; font-size: ${R(11 * s)}px; font-weight: 700;
  letter-spacing: ${R(3 * s)}px; color: ${primary};
  text-transform: uppercase; margin-bottom: ${R(14 * s)}px; opacity: 0;
}
.ff-term-headline {
  font-family: ${headFont}; font-size: ${R(46 * s)}px; font-weight: 900;
  line-height: 1.05; color: #fff; margin-bottom: ${R(12 * s)}px; opacity: 0;
}
.ff-term-sub {
  font-family: ${bodyFont}; font-size: ${R(14 * s)}px; line-height: 1.65;
  color: rgba(255,255,255,0.4); opacity: 0;
}
.ff-term-rgt { flex: 1; min-width: 0; }
.ff-term-window {
  background: rgba(4,6,10,0.98);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: ${R(12 * s)}px; overflow: hidden;
  box-shadow: 0 ${R(24 * s)}px ${R(60 * s)}px rgba(0,0,0,0.8),
              0 0 0 ${R(8 * s)}px ${hexToRgba(primary, 0.08)};
  opacity: 0; transform: rotateX(10deg) scale(0.88);
  transform-origin: 50% 0%; perspective: 1200px;
}
.ff-term-titlebar {
  background: rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  padding: ${R(10 * s)}px ${R(14 * s)}px;
  display: flex; align-items: center; gap: ${R(6 * s)}px;
}
.ff-term-tdot { width: ${R(10 * s)}px; height: ${R(10 * s)}px; border-radius: 50%; }
.ff-term-bar-title {
  font-family: ${bodyFont}; font-size: ${R(10 * s)}px;
  color: rgba(255,255,255,0.2); margin: 0 auto; letter-spacing: 1px;
}
.ff-term-body {
  padding: ${R(16 * s)}px ${R(18 * s)}px;
  display: flex; flex-direction: column; gap: ${R(7 * s)}px;
}
.ff-term-line { display: flex; align-items: flex-start; gap: ${R(8 * s)}px; opacity: 0; }
.ff-term-pre {
  font-family: 'Space Mono', monospace; font-size: ${R(12 * s)}px; font-weight: 700;
  color: ${primary}; flex-shrink: 0; line-height: 1.6;
}
.ff-term-pre-ok { color: #00e57a; }
.ff-term-txt {
  font-family: 'Space Mono', monospace; font-size: ${R(11 * s)}px;
  color: rgba(255,255,255,0.6); line-height: 1.6; word-break: break-all;
}
.ff-term-done .ff-term-txt {
  color: #00e57a; font-weight: 700;
  text-shadow: 0 0 ${R(8 * s)}px rgba(0,229,122,0.5);
}`;
  }

  protected contentHtml(id: string, s: number, _primary: string): string {
    const linesHtml = LINES.map((line, i) => `
<div class="ff-term-line${line.done ? " ff-term-done" : ""}" id="${id}-l${i}">
  <span class="ff-term-pre${line.done ? " ff-term-pre-ok" : ""}">${line.prefix}</span>
  <span class="ff-term-txt" id="${id}-t${i}"></span>
</div>`).join("");

    return `
<div class="ff-term-layout">
  <div class="ff-term-lft">
    <div class="ff-term-tag" id="${id}-tag">🔧 API Integration</div>
    <div class="ff-term-headline" id="${id}-h1">One command.<br>Your entire<br>AI stack runs.</div>
    <p class="ff-term-sub" id="${id}-sub">Trigger your full automation pipeline with a single API call.</p>
  </div>
  <div class="ff-term-rgt">
    <div class="ff-term-window" id="${id}-win">
      <div class="ff-term-titlebar">
        <div class="ff-term-tdot" style="background:#ff5f57"></div>
        <div class="ff-term-tdot" style="background:#ffbd2e"></div>
        <div class="ff-term-tdot" style="background:#28c840"></div>
        <div class="ff-term-bar-title">terminal — bash</div>
      </div>
      <div class="ff-term-body">${linesHtml}</div>
    </div>
  </div>
</div>`;
  }

  protected contentInitJs(id: string, s: number, primary: string): string {
    const lineTextsJson = JSON.stringify(LINES.map(l => l.text));
    return `
var scene = document.getElementById('${id}-scene');
gsap.set(scene, { opacity: 0 });
var tl = gsap.timeline({ paused: true });
tl.to(scene, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);

// Headline
tl.to(document.getElementById('${id}-tag'), { opacity: 1, duration: 0.25 }, 0.4);
tl.to(document.getElementById('${id}-h1'), { opacity: 1, duration: 0.4, ease: 'power3.out' }, 0.55);
tl.to(document.getElementById('${id}-sub'), { opacity: 1, duration: 0.3 }, 0.8);

// Terminal window enters with perspective
var win = document.getElementById('${id}-win');
tl.to(win, { rotateX: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.3)' }, 0.6);

// Line 0: types out
var lineTexts = ${lineTextsJson};
var txtEls = [0,1,2,3,4].map(function(i){ return document.getElementById('${id}-t'+i); });
var lineEls = [0,1,2,3,4].map(function(i){ return document.getElementById('${id}-l'+i); });

tl.to(lineEls[0], { opacity: 1, duration: 0.15 }, 1.1);
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
}, 1.15);

// Lines 1-4 appear sequentially
[1,2,3,4].forEach(function(i) {
  var t = 1.15 + cmdDur + (i - 1) * 0.48;
  tl.to(lineEls[i], { opacity: 1, duration: 0.2 }, t);
  tl.add(function(idx){ return function(){ txtEls[idx].textContent = lineTexts[idx]; }; }(i), t + 0.05);
});`;
  }
}

export const codeTerminalRenderer = new CodeTerminalRenderer();
