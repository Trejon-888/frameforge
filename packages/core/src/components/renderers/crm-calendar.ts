/**
 * CRM Calendar — Full-screen panel: AI auto-booking meetings
 *
 * Triggers: "book a meeting", "schedule a call", "CRM", "automatically book"
 * Layout: Left headline + Right calendar grid (3×4 slots, 4 booked spring in)
 */

import {
  type ComponentRenderer,
  type ComponentTiming,
  type ComponentContext,
  type ComponentOutput,
  GSAP_CDN,
} from "../types.js";

const R = Math.round;
const BOOKED = [2, 5, 7, 10];

export const crmCalendarRenderer: ComponentRenderer = {
  type: "crm-calendar",
  dependencies: [GSAP_CDN],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, scale: s, instanceId: id } = ctx;
    const { colors, typography } = style;

    const emptyIdx: number[] = [];
    let slotsHtml = "";
    for (let i = 0; i < 12; i++) {
      const bk = BOOKED.includes(i);
      if (!bk) emptyIdx.push(i);
      slotsHtml += `<div class="ff-cal-slot${bk ? " ff-cal-bk" : ""}" id="${id}-s${i}"></div>`;
    }

    const css = `
      .ff-cal-bd {
        position: fixed; inset: 0; z-index: 9990;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }
      .ff-cal-panel {
        width: ${R(920 * s)}px;
        background: rgba(6,8,14,0.97);
        border: ${R(2 * s)}px solid rgba(255,255,255,0.14);
        border-radius: ${R(20 * s)}px;
        box-shadow: 0 ${R(32 * s)}px ${R(80 * s)}px rgba(0,0,0,0.9),
                    ${R(8 * s)}px ${R(8 * s)}px 0 ${colors.primary},
                    inset 0 1px 0 rgba(255,255,255,0.07);
        padding: ${R(44 * s)}px ${R(56 * s)}px;
        display: flex; gap: ${R(64 * s)}px; align-items: center;
        overflow: hidden;
      }
      .ff-cal-lft { flex: 1; min-width: 0; }
      .ff-cal-rgt { flex: 1.2; min-width: 0; }
      .ff-cal-tag {
        font-family: ${typography.body};
        font-size: ${R(11 * s)}px; font-weight: 700;
        letter-spacing: ${R(2 * s)}px; color: ${colors.primary};
        text-transform: uppercase; margin-bottom: ${R(18 * s)}px; opacity: 0;
      }
      .ff-cal-h2 {
        font-family: ${typography.heading};
        font-size: ${R(46 * s)}px; font-weight: 900;
        line-height: 1.05; color: #fff;
        margin-bottom: ${R(14 * s)}px; opacity: 0;
      }
      .ff-cal-sub {
        font-family: ${typography.body};
        font-size: ${R(15 * s)}px; line-height: 1.6;
        color: rgba(255,255,255,0.45);
        margin-bottom: ${R(32 * s)}px; opacity: 0;
      }
      .ff-cal-badge {
        display: inline-flex; align-items: center; gap: ${R(10 * s)}px;
        background: rgba(0,229,122,0.12);
        border: 1px solid rgba(0,229,122,0.35);
        border-radius: ${R(40 * s)}px;
        padding: ${R(10 * s)}px ${R(22 * s)}px;
        font-family: ${typography.body};
        font-size: ${R(14 * s)}px; font-weight: 700;
        color: #00e57a; opacity: 0;
      }
      .ff-cal-dot { width: ${R(8 * s)}px; height: ${R(8 * s)}px; background: #00e57a; border-radius: 50%; }
      .ff-cal-ghdr {
        display: grid; grid-template-columns: ${R(52 * s)}px repeat(3, 1fr);
        gap: ${R(8 * s)}px; margin-bottom: ${R(8 * s)}px;
      }
      .ff-cal-dh {
        font-family: ${typography.body};
        font-size: ${R(11 * s)}px; font-weight: 700;
        letter-spacing: ${R(1.5 * s)}px;
        color: rgba(255,255,255,0.3); text-transform: uppercase; text-align: center;
      }
      .ff-cal-body { display: flex; gap: ${R(8 * s)}px; }
      .ff-cal-tls { width: ${R(52 * s)}px; display: flex; flex-direction: column; gap: ${R(8 * s)}px; }
      .ff-cal-tl {
        font-family: ${typography.body}; font-size: ${R(9 * s)}px;
        color: rgba(255,255,255,0.22); height: ${R(44 * s)}px;
        display: flex; align-items: center;
      }
      .ff-cal-grid {
        flex: 1; display: grid; grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(4, ${R(44 * s)}px); gap: ${R(8 * s)}px;
      }
      .ff-cal-slot {
        border-radius: ${R(8 * s)}px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.07);
        opacity: 0; transform: scale(0);
      }
      .ff-cal-bk {
        background: ${colors.primary}; border-color: ${colors.primary};
        box-shadow: 0 0 ${R(14 * s)}px ${colors.primary}55;
      }`;

    const html = `
      <div class="ff-cal-bd" id="${id}-bd">
        <div class="ff-cal-panel" id="${id}-panel">
          <div class="ff-cal-lft">
            <div class="ff-cal-tag" id="${id}-tag">📅 AI Scheduler</div>
            <h2 class="ff-cal-h2" id="${id}-h2">Book meetings<br>automatically.</h2>
            <p class="ff-cal-sub" id="${id}-sub">AI books qualified leads directly<br>into your calendar — 24/7.</p>
            <div class="ff-cal-badge" id="${id}-badge">
              <div class="ff-cal-dot"></div>✓ 4 meetings booked this week
            </div>
          </div>
          <div class="ff-cal-rgt">
            <div class="ff-cal-ghdr">
              <div></div>
              <div class="ff-cal-dh">MON</div>
              <div class="ff-cal-dh">TUE</div>
              <div class="ff-cal-dh">WED</div>
            </div>
            <div class="ff-cal-body">
              <div class="ff-cal-tls">
                <div class="ff-cal-tl">9:00</div>
                <div class="ff-cal-tl">11:00</div>
                <div class="ff-cal-tl">2:00</div>
                <div class="ff-cal-tl">4:00</div>
              </div>
              <div class="ff-cal-grid">${slotsHtml}</div>
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
      var slots = Array.from({length:12},function(_,i){ return document.getElementById('${id}-s'+i); });
      var emptyIdx = ${JSON.stringify(emptyIdx)};
      var bookedIdx = ${JSON.stringify(BOOKED)};

      gsap.set(bd, { backgroundColor: 'rgba(0,0,0,0)' });
      gsap.set(panel, { scale: 0.78, opacity: 0, y: ${R(60 * s)} });
      var tl = gsap.timeline({ paused: true });

      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0.48)', duration: 0.4 }, 0);
      tl.to(panel, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.3)' }, 0.05);
      tl.to(tag, { opacity: 1, duration: 0.3 }, 0.5);
      tl.to(h2, { opacity: 1, duration: 0.4, ease: 'power3.out' }, 0.62);
      tl.to(sub, { opacity: 1, duration: 0.35 }, 0.82);
      emptyIdx.forEach(function(i, n) {
        tl.to(slots[i], { scale: 1, opacity: 1, duration: 0.18, ease: 'back.out(1.5)' }, 0.85 + n * 0.04);
      });
      bookedIdx.forEach(function(i, n) {
        tl.to(slots[i], { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2.5)' }, 1.15 + n * 0.22);
      });
      tl.to(badge, { opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, 2.1);

      tl.to(panel, { scale: 0.92, opacity: 0, y: ${R(-30 * s)}, duration: 0.4, ease: 'power2.in' }, ${exitSec});
      tl.to(bd, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.35 }, ${exitSec});
      el._tl = tl;`;

    const updateJs = `if (el._tl) el._tl.time(localT / 1000);`;
    return { css, html, initJs, updateJs };
  },
};
