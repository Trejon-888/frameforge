/**
 * Social Feed — Full-screen panel: AI content manager posting automatically
 *
 * Triggers: "social media manager", "post content", "Instagram/TikTok/LinkedIn"
 * Layout: Left headline + Right 3 post cards with platform icons + engagement
 */

import {
  type ComponentRenderer,
  type ComponentTiming,
  type ComponentContext,
  type ComponentOutput,
  GSAP_CDN,
} from "../types.js";

const R = Math.round;

const POSTS = [
  { platform: "🐦", handle: "@yourhandle", text: "How AI is replacing manual outreach in 2025 →", likes: "2.4K", views: "18K" },
  { platform: "📷", handle: "@yourhandle", text: "Built an AI agent that books 40+ meetings/month 🤖", likes: "891", views: "7.2K" },
  { platform: "💼", handle: "@yourhandle", text: "The agency automation stack we use to save 20h/week", likes: "1.1K", views: "9.4K" },
];

export const socialFeedRenderer: ComponentRenderer = {
  type: "social-feed",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId: id } = ctx;
    const { colors, typography } = style;

    const postsHtml = POSTS.map(
      (p, i) => `
      <div class="ff-sf-post" id="${id}-p${i}">
        <div class="ff-sf-post-accent"></div>
        <div class="ff-sf-post-ico">${p.platform}</div>
        <div class="ff-sf-post-body">
          <div class="ff-sf-post-handle">${p.handle}</div>
          <div class="ff-sf-post-text">${p.text}</div>
        </div>
        <div class="ff-sf-post-stats">
          <span class="ff-sf-stat">❤ ${p.likes}</span>
          <span class="ff-sf-stat">👁 ${p.views}</span>
        </div>
      </div>`
    ).join("");

    const css = `
      .ff-sf-bd {
        position: fixed; inset: 0; z-index: 9990;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }
      .ff-sf-panel {
        width: ${R(920 * s)}px;
        background: rgba(6,8,14,0.97);
        border: ${R(2 * s)}px solid rgba(255,255,255,0.14);
        border-radius: ${R(20 * s)}px;
        box-shadow: 0 ${R(32 * s)}px ${R(80 * s)}px rgba(0,0,0,0.9),
                    ${R(8 * s)}px ${R(8 * s)}px 0 ${colors.primary},
                    inset 0 1px 0 rgba(255,255,255,0.07);
        padding: ${R(44 * s)}px ${R(56 * s)}px;
        display: flex; gap: ${R(60 * s)}px; align-items: center;
        overflow: hidden;
      }
      .ff-sf-lft { flex: 1; min-width: 0; }
      .ff-sf-rgt { flex: 1.3; min-width: 0; display: flex; flex-direction: column; gap: ${R(10 * s)}px; }
      .ff-sf-tag {
        font-family: ${typography.body};
        font-size: ${R(11 * s)}px; font-weight: 700;
        letter-spacing: ${R(2 * s)}px; color: ${colors.primary};
        text-transform: uppercase; margin-bottom: ${R(18 * s)}px; opacity: 0;
      }
      .ff-sf-h2 {
        font-family: ${typography.heading};
        font-size: ${R(46 * s)}px; font-weight: 900;
        line-height: 1.05; color: #fff;
        margin-bottom: ${R(14 * s)}px; opacity: 0;
      }
      .ff-sf-sub {
        font-family: ${typography.body}; font-size: ${R(15 * s)}px; line-height: 1.6;
        color: rgba(255,255,255,0.45); margin-bottom: ${R(32 * s)}px; opacity: 0;
      }
      .ff-sf-badge {
        display: inline-flex; align-items: center; gap: ${R(10 * s)}px;
        background: rgba(0,229,122,0.12); border: 1px solid rgba(0,229,122,0.35);
        border-radius: ${R(40 * s)}px; padding: ${R(10 * s)}px ${R(22 * s)}px;
        font-family: ${typography.body}; font-size: ${R(14 * s)}px; font-weight: 700;
        color: #00e57a; opacity: 0;
      }
      .ff-sf-bdot { width: ${R(8 * s)}px; height: ${R(8 * s)}px; background: #00e57a; border-radius: 50%; }
      .ff-sf-post {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.09);
        border-radius: ${R(12 * s)}px;
        padding: ${R(14 * s)}px ${R(16 * s)}px;
        display: flex; align-items: center; gap: ${R(12 * s)}px;
        position: relative; overflow: hidden;
        opacity: 0;
      }
      .ff-sf-post-accent {
        position: absolute; left: 0; top: 0; bottom: 0;
        width: ${R(3 * s)}px; background: ${colors.primary};
        border-radius: 1px 0 0 1px;
      }
      .ff-sf-post-ico {
        font-size: ${R(20 * s)}px; flex-shrink: 0;
      }
      .ff-sf-post-body { flex: 1; min-width: 0; }
      .ff-sf-post-handle {
        font-family: ${typography.body}; font-size: ${R(10 * s)}px; font-weight: 700;
        color: rgba(255,255,255,0.3); margin-bottom: ${R(4 * s)}px;
      }
      .ff-sf-post-text {
        font-family: ${typography.body}; font-size: ${R(12 * s)}px; font-weight: 500;
        color: rgba(255,255,255,0.8); line-height: 1.4;
      }
      .ff-sf-post-stats {
        display: flex; flex-direction: column; gap: ${R(4 * s)}px;
        flex-shrink: 0; text-align: right;
      }
      .ff-sf-stat {
        font-family: ${typography.body}; font-size: ${R(11 * s)}px; font-weight: 700;
        color: ${colors.primary};
      }`;

    const html = `
      <div class="ff-sf-bd" id="${id}-bd">
        <div class="ff-sf-panel" id="${id}-panel">
          <div class="ff-sf-lft">
            <div class="ff-sf-tag" id="${id}-tag">📱 Content Manager</div>
            <h2 class="ff-sf-h2" id="${id}-h2">Post while<br>you sleep.</h2>
            <p class="ff-sf-sub" id="${id}-sub">AI creates and schedules posts<br>across every platform — daily.</p>
            <div class="ff-sf-badge" id="${id}-badge">
              <div class="ff-sf-bdot"></div>+284 new followers today
            </div>
          </div>
          <div class="ff-sf-rgt">${postsHtml}</div>
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
      var posts = [0,1,2].map(function(i){ return document.getElementById('${id}-p'+i); });

      gsap.set(bd, { backgroundColor: 'rgba(0,0,0,0)' });
      gsap.set(panel, { scale: 0.78, opacity: 0, y: ${R(60 * s)} });
      var tl = gsap.timeline({ paused: true });

      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0.48)', duration: 0.4 }, 0);
      tl.to(panel, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.3)' }, 0.05);
      tl.to(tag, { opacity: 1, duration: 0.3 }, 0.5);
      tl.to(h2, { opacity: 1, duration: 0.4, ease: 'power3.out' }, 0.62);
      tl.to(sub, { opacity: 1, duration: 0.35 }, 0.82);
      posts.forEach(function(p, i) {
        tl.to(p, { opacity: 1, x: 0, duration: 0.35, ease: 'back.out(1.5)' }, 0.8 + i * 0.2);
      });
      tl.to(badge, { opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, 1.5);

      tl.to(panel, { scale: 0.92, opacity: 0, y: ${R(-30 * s)}, duration: 0.4, ease: 'power2.in' }, ${exitSec});
      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.35 }, ${exitSec});
      el._tl = tl;`;

    const updateJs = `if (el._tl) el._tl.time(localT / 1000);`;
    return { css, html, initJs, updateJs };
  },
};
