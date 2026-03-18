/**
 * Inbox Send — Cinema renderer
 *
 * Browser mockup: app.outreach.io/campaigns
 * Content: Email composer with AI personalization tokens {Name}, {Company}.
 * Cursor clicks Send → sent counter increments → ✓ confirmation banner.
 */

import { CinemaBrowserRenderer, type HeadlineContent } from "./base-browser.js";
import { R } from "./shared.js";

class InboxSendRenderer extends CinemaBrowserRenderer {
  readonly type = "inbox-send";
  protected readonly ns = "ff-mail";
  protected readonly browserUrl = "app.outreach.io/campaigns/new";
  protected readonly navItems = ["Campaigns", "Sequences", "Analytics", "Templates"];
  protected readonly activeNav = 0;

  protected headline(_s: number): HeadlineContent {
    return {
      tag: "✉ AI Outreach",
      headline: "Send hundreds<br>of personalized<br>emails — instantly.",
      desc: "AI writes and sends tailored cold emails to every prospect automatically.",
    };
  }

  protected viewportCss(s: number, primary: string, bodyFont: string): string {
    return `
.ff-mail-composer-wrap {
  padding: ${R(16 * s)}px ${R(18 * s)}px; background: var(--ff-viewport);
  display: flex; flex-direction: column; gap: ${R(8 * s)}px;
}
.ff-mail-field {
  background: var(--ff-surface);
  border: 1px solid var(--ff-border-soft);
  border-radius: ${R(7 * s)}px;
  padding: ${R(8 * s)}px ${R(12 * s)}px;
  display: flex; gap: ${R(10 * s)}px; align-items: center;
  opacity: 0;
}
.ff-mail-label {
  font-family: ${bodyFont}; font-size: ${R(9 * s)}px; font-weight: 700;
  color: var(--ff-text-faint); text-transform: uppercase; letter-spacing: 1px;
  flex-shrink: 0; width: ${R(38 * s)}px;
}
.ff-mail-value {
  font-family: ${bodyFont}; font-size: ${R(11 * s)}px;
  color: var(--ff-text); flex: 1;
}
.ff-mail-body-area {
  background: var(--ff-surface);
  border: 1px solid var(--ff-border-soft);
  border-radius: ${R(7 * s)}px;
  padding: ${R(12 * s)}px; min-height: ${R(80 * s)}px;
  font-family: ${bodyFont}; font-size: ${R(11 * s)}px; line-height: 1.6;
  color: rgba(255,255,255,0.6); opacity: 0;
}
.ff-mail-token {
  background: rgba(124,108,252,0.25); color: #b4aaff;
  border-radius: ${R(3 * s)}px; padding: 0 ${R(3 * s)}px; font-weight: 700;
}
.ff-mail-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: ${R(6 * s)}px; opacity: 0;
}
.ff-mail-count {
  font-family: ${bodyFont}; font-size: ${R(10 * s)}px;
  color: var(--ff-text-faint);
}
.ff-mail-send-btn {
  background: ${primary}; color: #000; font-weight: 800;
  font-family: ${bodyFont}; font-size: ${R(12 * s)}px;
  padding: ${R(8 * s)}px ${R(20 * s)}px; border-radius: ${R(8 * s)}px;
  display: flex; align-items: center; gap: ${R(6 * s)}px;
}
.ff-mail-confirm {
  background: rgba(0,229,122,0.12); border: 1px solid rgba(0,229,122,0.3);
  border-radius: ${R(7 * s)}px;
  padding: ${R(10 * s)}px ${R(14 * s)}px;
  font-family: ${bodyFont}; font-size: ${R(12 * s)}px; font-weight: 700;
  color: #00e57a; text-align: center; opacity: 0;
}`;
  }

  protected viewportHtml(id: string, s: number): string {
    return `
<div class="ff-mail-composer-wrap">
  <div class="ff-mail-field" id="${id}-f0">
    <span class="ff-mail-label">To:</span>
    <span class="ff-mail-value">47 qualified prospects (imported from CRM)</span>
  </div>
  <div class="ff-mail-field" id="${id}-f1">
    <span class="ff-mail-label">From:</span>
    <span class="ff-mail-value">alex@youragency.com</span>
  </div>
  <div class="ff-mail-field" id="${id}-f2">
    <span class="ff-mail-label">Subj:</span>
    <span class="ff-mail-value">Quick question about <span class="ff-mail-token">{Company}</span></span>
  </div>
  <div class="ff-mail-body-area" id="${id}-body">
    Hi <span class="ff-mail-token">{Name}</span>, I noticed <span class="ff-mail-token">{Company}</span> is scaling fast — we help agencies like yours automate their entire outreach using AI.<br><br>
    Would a 15-min call make sense this week?
  </div>
  <div class="ff-mail-footer" id="${id}-footer">
    <span class="ff-mail-count" id="${id}-count">47 personalized emails ready</span>
    <div class="ff-mail-send-btn" id="${id}-sendbtn">✈ Send All</div>
  </div>
  <div class="ff-mail-confirm" id="${id}-confirm">✓ 47 personalized emails delivered in 3.2s</div>
</div>`;
  }

  protected viewportInitJs(id: string, _s: number, _primary: string): string {
    return `
// Fields appear sequentially
tl.to(document.getElementById('${id}-f0'), { opacity: 1, duration: 0.2 }, 1.1);
tl.to(document.getElementById('${id}-f1'), { opacity: 1, duration: 0.2 }, 1.24);
tl.to(document.getElementById('${id}-f2'), { opacity: 1, duration: 0.2 }, 1.38);
tl.to(document.getElementById('${id}-body'), { opacity: 1, duration: 0.3 }, 1.52);
tl.to(document.getElementById('${id}-footer'), { opacity: 1, duration: 0.25 }, 1.75);

// Cursor clicks Send All
var cursor = document.getElementById('${id}-cursor');
var sendbtn = document.getElementById('${id}-sendbtn');
tl.to(cursor, { opacity: 1, duration: 0.2 }, 2.1);
tl.to(cursor, {
  x: function() {
    var vp = document.getElementById('${id}-vp');
    var r = sendbtn.getBoundingClientRect();
    var vr = vp.getBoundingClientRect();
    return r.left - vr.left + r.width / 2 - 10;
  },
  y: function() {
    var vp = document.getElementById('${id}-vp');
    var r = sendbtn.getBoundingClientRect();
    var vr = vp.getBoundingClientRect();
    return r.top - vr.top + r.height / 2 - 10;
  },
  duration: 0.5, ease: 'power2.inOut'
}, 2.15);
tl.to(document.getElementById('${id}-cursor-ring'), { scale: 0.6, duration: 0.1 }, 2.7);
tl.to(document.getElementById('${id}-cursor-ring'), { scale: 1, duration: 0.1 }, 2.8);
// Send button pulses
tl.to(sendbtn, { scale: 1.05, duration: 0.1, yoyo: true, repeat: 1 }, 2.72);
// Footer fades, confirm appears
tl.to(document.getElementById('${id}-footer'), { opacity: 0, duration: 0.2 }, 2.85);
tl.to(document.getElementById('${id}-confirm'), { opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, 3.0);
tl.to(cursor, { opacity: 0, duration: 0.25 }, 3.4);`;
  }
}

export const inboxSendRenderer = new InboxSendRenderer();
