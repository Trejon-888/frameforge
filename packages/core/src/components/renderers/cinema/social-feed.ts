/**
 * Social Feed — Cinema renderer
 *
 * Browser mockup: app.contentai.io/schedule
 * Content: social media scheduler — 3 post cards with platform icons, engagement stats,
 * cursor clicks "Publish All" → posts animate out with ✓ confirmation
 */

import { CinemaBrowserRenderer, type HeadlineContent } from "./base-browser.js";
import { R, hexToRgba } from "./shared.js";

const POSTS = [
  {
    platform: "Instagram",
    icon: "IG",
    iconBg: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
    caption: "5 ways AI is changing your sales process 🚀",
    time: "Today 9:00 AM",
    reach: "12.4K est. reach",
  },
  {
    platform: "LinkedIn",
    icon: "in",
    iconBg: "#0a66c2",
    caption: "We scaled to 200 clients using just one AI agent.",
    time: "Today 10:30 AM",
    reach: "8.9K est. reach",
  },
  {
    platform: "Twitter / X",
    icon: "𝕏",
    iconBg: "#000",
    caption: "Thread: How we automated our entire outreach in 72 hours 🧵",
    time: "Today 12:00 PM",
    reach: "31K est. reach",
  },
];

class SocialFeedRenderer extends CinemaBrowserRenderer {
  readonly type = "social-feed";
  protected readonly ns = "ff-sf";
  protected readonly browserUrl = "app.contentai.io/schedule";
  protected readonly navItems = ["Content", "Schedule", "Analytics", "Settings"];
  protected readonly activeNav = 1;

  protected headline(_s: number): HeadlineContent {
    return {
      tag: "📱 Content AI",
      headline: "Schedule<br>every post<br>on autopilot.",
      desc: "AI writes platform-perfect posts and publishes them at peak engagement times.",
    };
  }

  protected viewportCss(s: number, primary: string, bodyFont: string): string {
    return `
.ff-sf-queue {
  padding: ${R(16 * s)}px ${R(18 * s)}px;
  display: flex; flex-direction: column; gap: ${R(10 * s)}px;
  background: var(--ff-viewport);
}
.ff-sf-card {
  background: var(--ff-surface);
  border: 1px solid var(--ff-border-soft);
  border-radius: ${R(10 * s)}px;
  padding: ${R(12 * s)}px ${R(14 * s)}px;
  display: flex; gap: ${R(12 * s)}px; align-items: flex-start;
  opacity: 0; transform: translateX(${R(-24 * s)}px);
}
.ff-sf-icon {
  width: ${R(32 * s)}px; height: ${R(32 * s)}px; border-radius: ${R(8 * s)}px;
  display: flex; align-items: center; justify-content: center;
  font-size: ${R(13 * s)}px; font-weight: 900; color: var(--ff-text); flex-shrink: 0;
}
.ff-sf-body { flex: 1; min-width: 0; }
.ff-sf-platform {
  font-family: ${bodyFont}; font-size: ${R(9 * s)}px; font-weight: 700;
  color: var(--ff-text-muted); text-transform: uppercase; letter-spacing: 1px;
  margin-bottom: ${R(4 * s)}px;
}
.ff-sf-caption {
  font-family: ${bodyFont}; font-size: ${R(11 * s)}px; font-weight: 500;
  color: var(--ff-text); line-height: 1.4; margin-bottom: ${R(6 * s)}px;
}
.ff-sf-meta {
  display: flex; gap: ${R(12 * s)}px;
  font-family: ${bodyFont}; font-size: ${R(9 * s)}px; color: var(--ff-text-faint);
}
.ff-sf-reach { color: #00e57a; font-weight: 700; }
.ff-sf-status {
  font-family: ${bodyFont}; font-size: ${R(9 * s)}px; font-weight: 700;
  padding: ${R(3 * s)}px ${R(8 * s)}px; border-radius: ${R(4 * s)}px; flex-shrink: 0;
  align-self: center;
}
.ff-sf-status-queue { background: var(--ff-border-soft); color: var(--ff-text-muted); }
.ff-sf-status-live {
  background: rgba(0,229,122,0.15); color: #00e57a;
  box-shadow: 0 0 ${R(8 * s)}px rgba(0,229,122,0.3);
}
.ff-sf-pubbar {
  display: flex; align-items: center; justify-content: flex-end;
  padding: ${R(10 * s)}px ${R(18 * s)}px;
  border-top: 1px solid var(--ff-surface-hov);
  background: var(--ff-viewport); opacity: 0;
}
.ff-sf-pubbtn {
  background: ${primary}; color: #000; font-weight: 800;
  font-family: ${bodyFont}; font-size: ${R(12 * s)}px;
  padding: ${R(8 * s)}px ${R(22 * s)}px; border-radius: ${R(8 * s)}px;
}`;
  }

  protected viewportHtml(id: string, s: number): string {
    const cards = POSTS.map((p, i) => `
<div class="ff-sf-card" id="${id}-card${i}">
  <div class="ff-sf-icon" style="background:${p.iconBg}">${p.icon}</div>
  <div class="ff-sf-body">
    <div class="ff-sf-platform">${p.platform}</div>
    <div class="ff-sf-caption">${p.caption}</div>
    <div class="ff-sf-meta">
      <span>${p.time}</span>
      <span class="ff-sf-reach">${p.reach}</span>
    </div>
  </div>
  <div class="ff-sf-status ff-sf-status-queue" id="${id}-st${i}">Queued</div>
</div>`).join("");

    return `
<div class="ff-sf-queue">${cards}</div>
<div class="ff-sf-pubbar" id="${id}-pubbar">
  <div class="ff-sf-pubbtn" id="${id}-pubbtn">▶ Publish All (3)</div>
</div>`;
  }

  protected viewportInitJs(id: string, s: number, primary: string): string {
    return `
// Cards slide in
[0,1,2].forEach(function(i) {
  tl.to(document.getElementById('${id}-card'+i), { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }, 1.1 + i * 0.14);
});
tl.to(document.getElementById('${id}-pubbar'), { opacity: 1, duration: 0.25 }, 1.58);

// Cursor clicks Publish All
var cursor = document.getElementById('${id}-cursor');
var pubbtn = document.getElementById('${id}-pubbtn');
tl.to(cursor, { opacity: 1, duration: 0.2 }, 1.9);
tl.to(cursor, {
  x: function() {
    var vp = document.getElementById('${id}-vp');
    var r = pubbtn.getBoundingClientRect();
    var vr = vp.getBoundingClientRect();
    return r.left - vr.left + r.width / 2 - 10;
  },
  y: function() {
    var vp = document.getElementById('${id}-vp');
    var r = pubbtn.getBoundingClientRect();
    var vr = vp.getBoundingClientRect();
    return r.top - vr.top + r.height / 2 - 10;
  },
  duration: 0.5, ease: 'power2.inOut'
}, 2.0);
tl.to(document.getElementById('${id}-cursor-ring'), { scale: 0.6, duration: 0.12 }, 2.55);
tl.to(document.getElementById('${id}-cursor-ring'), { scale: 1, duration: 0.12 }, 2.67);
// Status badges → Live
[0,1,2].forEach(function(i) {
  var st = document.getElementById('${id}-st'+i);
  tl.add(function(){ st.textContent = '✓ Live'; st.classList.remove('ff-sf-status-queue'); st.classList.add('ff-sf-status-live'); }, 2.75 + i * 0.15);
});
tl.to(cursor, { opacity: 0, duration: 0.25 }, 3.3);`;
  }
}

export const socialFeedRenderer = new SocialFeedRenderer();
