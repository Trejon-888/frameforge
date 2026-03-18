/**
 * CRM Calendar — Cinema renderer
 *
 * Browser mockup: app.acme.com/calendar
 * Content: week-view calendar grid, 4 time slots animate in, AI books a meeting
 * with cursor hover + click on empty slot → slot fills green with "Meeting Booked ✓"
 */

import { CinemaBrowserRenderer, type HeadlineContent } from "./base-browser.js";
import { R, hexToRgba } from "./shared.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = ["9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm"];
const BOOKED = [
  { day: 0, hour: 1, label: "Discovery Call", color: "#7c6cfc" },
  { day: 1, hour: 3, label: "Demo — Acme Corp", color: "#7c6cfc" },
  { day: 2, hour: 0, label: "Strategy Review", color: "#7c6cfc" },
  { day: 3, hour: 5, label: "Onboarding", color: "#7c6cfc" },
];
// Target slot where AI books the new meeting (day 4, hour 2 = 11am Friday)
const NEW_SLOT = { day: 4, hour: 2, label: "New Lead — AI Booked ✓" };

class CrmCalendarRenderer extends CinemaBrowserRenderer {
  readonly type = "crm-calendar";
  protected readonly ns = "ff-crm";
  protected readonly browserUrl = "app.salesflow.io/calendar";
  protected readonly navItems = ["Dashboard", "Calendar", "Contacts", "Deals"];
  protected readonly activeNav = 1;

  protected headline(s: number): HeadlineContent {
    return {
      tag: "📅 Smart Scheduling",
      headline: "AI books<br>meetings<br>automatically.",
      desc: "Your calendar fills itself. Every lead, every slot — scheduled without you lifting a finger.",
    };
  }

  protected viewportCss(s: number, primary: string, bodyFont: string): string {
    return `
.ff-crm-grid-wrap {
  padding: ${R(14 * s)}px ${R(18 * s)}px;
  background: var(--ff-viewport);
}
.ff-crm-grid-head {
  display: grid; grid-template-columns: ${R(44 * s)}px repeat(5, 1fr);
  gap: ${R(4 * s)}px; margin-bottom: ${R(6 * s)}px;
}
.ff-crm-day-label {
  font-family: ${bodyFont}; font-size: ${R(10 * s)}px; font-weight: 700;
  color: var(--ff-text-muted); text-align: center;
  text-transform: uppercase; letter-spacing: 1px;
}
.ff-crm-grid-body {
  display: grid; grid-template-columns: ${R(44 * s)}px repeat(5, 1fr);
  gap: ${R(4 * s)}px;
}
.ff-crm-hour {
  font-family: ${bodyFont}; font-size: ${R(9 * s)}px;
  color: rgba(255,255,255,0.2); text-align: right;
  padding-right: ${R(6 * s)}px; line-height: ${R(34 * s)}px;
}
.ff-crm-cell {
  height: ${R(34 * s)}px; border-radius: ${R(5 * s)}px;
  background: var(--ff-surface);
  border: 1px solid var(--ff-border-soft);
  position: relative; overflow: hidden;
}
.ff-crm-event {
  position: absolute; inset: ${R(2 * s)}px;
  border-radius: ${R(4 * s)}px;
  display: flex; align-items: center; padding: 0 ${R(6 * s)}px;
  font-family: ${bodyFont}; font-size: ${R(9 * s)}px; font-weight: 700;
  color: var(--ff-text); opacity: 0; transform: scaleX(0); transform-origin: left;
}
.ff-crm-new-event {
  background: ${primary}; color: #000;
  box-shadow: 0 0 ${R(12 * s)}px ${hexToRgba(primary, 0.6)};
}`;
  }

  protected viewportHtml(id: string, s: number): string {
    // Build grid: 7 rows × 5 cols
    const cells: string[] = [];
    for (let h = 0; h < HOURS.length; h++) {
      cells.push(`<div class="ff-crm-hour">${HOURS[h]}</div>`);
      for (let d = 0; d < DAYS.length; d++) {
        const booked = BOOKED.find(b => b.day === d && b.hour === h);
        const isNew = NEW_SLOT.day === d && NEW_SLOT.hour === h;
        const cellId = `${id}-cell-${d}-${h}`;
        cells.push(`
<div class="ff-crm-cell" id="${cellId}">
  ${booked ? `<div class="ff-crm-event" id="${id}-ev-${d}-${h}" style="background:${booked.color}">${booked.label}</div>` : ""}
  ${isNew ? `<div class="ff-crm-event ff-crm-new-event" id="${id}-new">${NEW_SLOT.label}</div>` : ""}
</div>`);
      }
    }

    return `
<div class="ff-crm-grid-wrap">
  <div class="ff-crm-grid-head">
    <div></div>
    ${DAYS.map(d => `<div class="ff-crm-day-label">${d}</div>`).join("")}
  </div>
  <div class="ff-crm-grid-body">${cells.join("")}</div>
</div>`;
  }

  protected viewportInitJs(id: string, s: number, primary: string): string {
    const bookedIds = BOOKED.map(b => `'${id}-ev-${b.day}-${b.hour}'`).join(",");
    const newCellId = `${id}-cell-${NEW_SLOT.day}-${NEW_SLOT.hour}`;

    return `
// Animate existing booked events in with stagger
var evEls = [${bookedIds}].map(function(eid){ return document.getElementById(eid); });
evEls.forEach(function(e, i) {
  if (e) tl.to(e, { opacity: 1, scaleX: 1, duration: 0.28, ease: 'back.out(2)' }, 1.1 + i * 0.12);
});

// Cursor moves to empty Friday slot and clicks → new event appears
var cursor = document.getElementById('${id}-cursor');
var newCell = document.getElementById('${newCellId}');
var newEv = document.getElementById('${id}-new');

tl.to(cursor, { opacity: 1, duration: 0.2 }, 1.8);
tl.to(cursor, {
  x: function() {
    var vp = document.getElementById('${id}-vp');
    var cell = newCell.getBoundingClientRect();
    var vpRect = vp.getBoundingClientRect();
    return cell.left - vpRect.left + cell.width / 2 - 10;
  },
  y: function() {
    var vp = document.getElementById('${id}-vp');
    var cell = newCell.getBoundingClientRect();
    var vpRect = vp.getBoundingClientRect();
    return cell.top - vpRect.top + cell.height / 2 - 10;
  },
  duration: 0.6, ease: 'power2.inOut'
}, 1.85);
// Click pulse
tl.to(document.getElementById('${id}-cursor-ring'), { scale: 0.65, opacity: 0.5, duration: 0.12 }, 2.5);
tl.to(document.getElementById('${id}-cursor-ring'), { scale: 1, opacity: 1, duration: 0.12 }, 2.62);
// Slot fills
tl.to(newEv, { opacity: 1, scaleX: 1, duration: 0.35, ease: 'back.out(2.5)' }, 2.7);
// Cursor fades out
tl.to(cursor, { opacity: 0, duration: 0.3 }, 3.4);`;
  }
}

export const crmCalendarRenderer = new CrmCalendarRenderer();
