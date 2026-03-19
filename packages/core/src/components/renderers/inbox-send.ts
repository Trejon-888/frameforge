/**
 * Inbox Send — Full-screen panel: AI sending personalized email outreach
 *
 * Triggers: "sends emails", "cold email", "outreach campaign", "personalized messages"
 * Layout: Left headline + Right email composer (types in → SEND glows → confirmation)
 */

import {
  type ComponentRenderer,
  type ComponentTiming,
  type ComponentContext,
  type ComponentOutput,
  GSAP_CDN,
} from "../types.js";

const R = Math.round;

export const inboxSendRenderer: ComponentRenderer = {
  type: "inbox-send",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId: id } = ctx;
    const { colors, typography } = style;

    const css = `
      .ff-mail-bd {
        position: fixed; inset: 0; z-index: 9990;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }
      .ff-mail-panel {
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
      .ff-mail-lft { flex: 1; min-width: 0; }
      .ff-mail-rgt { flex: 1.3; min-width: 0; }
      .ff-mail-tag {
        font-family: ${typography.body};
        font-size: ${R(11 * s)}px; font-weight: 700;
        letter-spacing: ${R(2 * s)}px; color: ${colors.primary};
        text-transform: uppercase; margin-bottom: ${R(18 * s)}px; opacity: 0;
      }
      .ff-mail-h2 {
        font-family: ${typography.heading};
        font-size: ${R(42 * s)}px; font-weight: 900;
        line-height: 1.05; color: #fff;
        margin-bottom: ${R(14 * s)}px; opacity: 0;
      }
      .ff-mail-sub {
        font-family: ${typography.body}; font-size: ${R(15 * s)}px; line-height: 1.6;
        color: rgba(255,255,255,0.45); margin-bottom: ${R(32 * s)}px; opacity: 0;
      }
      .ff-mail-badge {
        display: inline-flex; align-items: center; gap: ${R(10 * s)}px;
        background: rgba(0,229,122,0.12); border: 1px solid rgba(0,229,122,0.35);
        border-radius: ${R(40 * s)}px; padding: ${R(10 * s)}px ${R(22 * s)}px;
        font-family: ${typography.body}; font-size: ${R(14 * s)}px; font-weight: 700;
        color: #00e57a; opacity: 0;
      }
      .ff-mail-bdot { width: ${R(8 * s)}px; height: ${R(8 * s)}px; background: #00e57a; border-radius: 50%; }
      .ff-mail-composer {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: ${R(12 * s)}px;
        overflow: hidden; opacity: 0;
      }
      .ff-mail-comp-hdr {
        background: rgba(255,255,255,0.05);
        border-bottom: 1px solid rgba(255,255,255,0.07);
        padding: ${R(10 * s)}px ${R(16 * s)}px;
        display: flex; align-items: center; gap: ${R(6 * s)}px;
      }
      .ff-mail-mdot {
        width: ${R(9 * s)}px; height: ${R(9 * s)}px; border-radius: 50%;
      }
      .ff-mail-comp-body { padding: ${R(16 * s)}px; }
      .ff-mail-row {
        font-family: ${typography.body}; font-size: ${R(12 * s)}px;
        color: rgba(255,255,255,0.5);
        padding: ${R(6 * s)}px 0;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        display: flex; gap: ${R(8 * s)}px; opacity: 0;
      }
      .ff-mail-row:last-child { border-bottom: none; }
      .ff-mail-rl { color: rgba(255,255,255,0.25); font-weight: 700; flex-shrink: 0; width: ${R(28 * s)}px; }
      .ff-mail-rv { color: rgba(255,255,255,0.75); }
      .ff-mail-body-row {
        font-family: ${typography.body}; font-size: ${R(12 * s)}px;
        color: rgba(255,255,255,0.5); line-height: 1.6;
        padding-top: ${R(10 * s)}px; opacity: 0;
      }
      .ff-mail-send-row {
        display: flex; justify-content: flex-end; margin-top: ${R(12 * s)}px;
        opacity: 0;
      }
      .ff-mail-btn {
        background: ${colors.primary}; border-radius: ${R(8 * s)}px;
        padding: ${R(8 * s)}px ${R(20 * s)}px;
        font-family: ${typography.body}; font-size: ${R(13 * s)}px; font-weight: 800;
        color: #000; display: flex; align-items: center; gap: ${R(6 * s)}px;
      }
      .ff-mail-confirm {
        background: rgba(0,229,122,0.1); border: 1px solid rgba(0,229,122,0.25);
        border-radius: ${R(8 * s)}px; padding: ${R(12 * s)}px ${R(16 * s)}px;
        font-family: ${typography.body}; font-size: ${R(14 * s)}px; font-weight: 700;
        color: #00e57a; text-align: center; margin-top: ${R(10 * s)}px;
        opacity: 0;
      }`;

    const html = `
      <div class="ff-mail-bd" id="${id}-bd">
        <div class="ff-mail-panel" id="${id}-panel">
          <div class="ff-mail-lft">
            <div class="ff-mail-tag" id="${id}-tag">✉ AI Outreach</div>
            <h2 class="ff-mail-h2" id="${id}-h2">Send hundreds of<br>personalized emails.</h2>
            <p class="ff-mail-sub" id="${id}-sub">AI writes and sends tailored messages<br>to every prospect automatically.</p>
            <div class="ff-mail-badge" id="${id}-badge">
              <div class="ff-mail-bdot"></div>✓ 47 emails sent today
            </div>
          </div>
          <div class="ff-mail-rgt">
            <div class="ff-mail-composer" id="${id}-comp">
              <div class="ff-mail-comp-hdr">
                <div class="ff-mail-mdot" style="background:#ff5f57"></div>
                <div class="ff-mail-mdot" style="background:#ffbd2e"></div>
                <div class="ff-mail-mdot" style="background:#28c840"></div>
              </div>
              <div class="ff-mail-comp-body">
                <div class="ff-mail-row" id="${id}-r0">
                  <span class="ff-mail-rl">To:</span>
                  <span class="ff-mail-rv">47 qualified prospects</span>
                </div>
                <div class="ff-mail-row" id="${id}-r1">
                  <span class="ff-mail-rl">Re:</span>
                  <span class="ff-mail-rv">Quick question about {Company}</span>
                </div>
                <div class="ff-mail-body-row" id="${id}-body">
                  Hi {Name}, I noticed your agency is scaling fast…
                </div>
                <div class="ff-mail-send-row" id="${id}-sendrow">
                  <div class="ff-mail-btn" id="${id}-btn">✈ SEND ALL</div>
                </div>
                <div class="ff-mail-confirm" id="${id}-confirm">✓ 47 personalized emails delivered</div>
              </div>
            </div>
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
      var comp = document.getElementById('${id}-comp');
      var r0 = document.getElementById('${id}-r0');
      var r1 = document.getElementById('${id}-r1');
      var body = document.getElementById('${id}-body');
      var sendrow = document.getElementById('${id}-sendrow');
      var btn = document.getElementById('${id}-btn');
      var confirm = document.getElementById('${id}-confirm');

      gsap.set(bd, { backgroundColor: 'rgba(0,0,0,0)' });
      gsap.set(panel, { scale: 0.78, opacity: 0, y: ${R(60 * s)} });
      var tl = gsap.timeline({ paused: true });

      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0.48)', duration: 0.4 }, 0);
      tl.to(panel, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.3)' }, 0.05);
      tl.to(tag, { opacity: 1, duration: 0.3 }, 0.5);
      tl.to(h2, { opacity: 1, duration: 0.4, ease: 'power3.out' }, 0.62);
      tl.to(sub, { opacity: 1, duration: 0.35 }, 0.82);
      tl.to(comp, { opacity: 1, duration: 0.3 }, 0.85);
      tl.to(r0, { opacity: 1, duration: 0.2 }, 1.0);
      tl.to(r1, { opacity: 1, duration: 0.2 }, 1.18);
      tl.to(body, { opacity: 1, duration: 0.3 }, 1.36);
      tl.to(sendrow, { opacity: 1, duration: 0.25 }, 1.6);
      tl.to(btn, {
        scale: 1.05,
        boxShadow: '0 0 ${R(20 * s)}px ${colors.primary}80',
        duration: 0.2, yoyo: true, repeat: 1
      }, 2.0);
      tl.to(sendrow, { opacity: 0, duration: 0.2 }, 2.5);
      tl.to(confirm, { opacity: 1, duration: 0.35, ease: 'back.out(1.5)' }, 2.65);
      tl.to(badge, { opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, 2.8);

      tl.to(panel, { scale: 0.92, opacity: 0, y: ${R(-30 * s)}, duration: 0.4, ease: 'power2.in' }, ${exitSec});
      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.35 }, ${exitSec});
      el._tl = tl;`;

    const updateJs = `if (el._tl) el._tl.time(localT / 1000);`;
    return { css, html, initJs, updateJs };
  },
};
