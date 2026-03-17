/**
 * Component Assembler
 *
 * Orchestrates rendering of overlay elements through the component system.
 * Maps overlay types to component renderers, collects outputs, deduplicates
 * CSS and dependencies, and builds the final page script.
 *
 * Replaces generateOverlayHTML with rich GSAP/Canvas/SVG animations.
 */

import { type OverlayElement } from "../overlay-generator.js";
import { type EditStyle } from "../edit-styles.js";
import {
  type ComponentDependency,
  type ComponentContext,
  type ComponentTiming,
} from "./types.js";
import { registry } from "./registry.js";

/** Maps old overlay types to new component renderer types */
const OVERLAY_TO_COMPONENT: Record<string, string> = {
  "hook-card": "kinetic-title",
  "lower-third": "animated-lower-third",
  "key-point": "glass-callout",
  "stat-callout": "number-counter",
  "chapter-marker": "chapter-wipe",
  "cta-card": "cta-reveal",
  "particle-burst": "particle-burst",
  "progress-bar": "progress-bar",
};

export interface AssembleResult {
  script: string;
  dependencies: ComponentDependency[];
}

/**
 * Assemble overlay elements into a page script using the component system.
 * Returns the script (for <script> injection) and dependencies (for <head> script tags).
 */
export function assembleOverlayPage(
  overlays: OverlayElement[],
  style: EditStyle,
  width: number,
  height: number
): AssembleResult {
  const scale = Math.min(width, height) / 1080;
  const usedTypes = new Set<string>();
  const cssPerType = new Map<string, string>();

  const instances: Array<{
    instanceId: string;
    html: string;
    initJs: string;
    updateJs: string;
    startMs: number;
    endMs: number;
  }> = [];

  for (let i = 0; i < overlays.length; i++) {
    const ov = overlays[i];
    const componentType = OVERLAY_TO_COMPONENT[ov.type] || ov.type;
    const renderer = registry.get(componentType);
    if (!renderer) continue;

    usedTypes.add(componentType);
    const instanceId = `ff-c-${i}`;
    const ctx: ComponentContext = { style, width, height, scale, instanceId };
    const timing: ComponentTiming = {
      startMs: ov.startMs,
      endMs: ov.endMs,
      durationMs: ov.endMs - ov.startMs,
    };

    // Pass overlay position to renderer via data (for position-aware components)
    const renderData = { ...ov.data, _position: ov.position };
    const output = renderer.render(renderData, timing, ctx);

    // Deduplicate CSS — one block per component type
    if (!cssPerType.has(componentType)) {
      cssPerType.set(componentType, output.css);
    }

    instances.push({
      instanceId,
      html: output.html,
      initJs: output.initJs || "",
      updateJs: output.updateJs,
      startMs: ov.startMs,
      endMs: ov.endMs,
    });
  }

  const dependencies = registry.collectDependencies([...usedTypes]);
  const allCss = [...cssPerType.values()].join("\n");

  // Build HTML for all instances
  const allHtml = instances
    .map(
      (inst) =>
        `<div id="${inst.instanceId}" style="display:none">${inst.html}</div>`
    )
    .join("");

  // Build per-instance init + registration blocks (with error boundaries)
  const componentBlocks = instances
    .map((inst) => {
      return `  (function() {
    var el = document.getElementById(${JSON.stringify(inst.instanceId)});
    try {
      ${inst.initJs}
    } catch(e) { console.error('[FrameForge] Component ${inst.instanceId} init error:', e); }
    comps.push({ el: el, start: ${inst.startMs}, end: ${inst.endMs}, update: function(el, localT) {
      try {
        ${inst.updateJs}
      } catch(e) { if (!el._err) { el._err = true; console.error('[FrameForge] Component ${inst.instanceId} error:', e); } }
    }});
  })();`;
    })
    .join("\n");

  const script = `(function() {
  // === COMPONENT OVERLAY SYSTEM ===
  var styleEl = document.createElement('style');
  styleEl.textContent = ${JSON.stringify(allCss)};
  document.head.appendChild(styleEl);

  var container = document.createElement('div');
  container.id = 'ff-components';
  container.innerHTML = ${JSON.stringify(allHtml)};
  document.body.appendChild(container);

  var comps = [];
${componentBlocks}

  function update() {
    var t = window.__frameforge ? window.__frameforge.currentTimeMs : performance.now();
    for (var i = 0; i < comps.length; i++) {
      var c = comps[i];
      var active = t >= c.start && t <= c.end;
      if (active) {
        if (c.el.style.display === 'none') c.el.style.display = '';
        c.update(c.el, t - c.start);
      } else {
        if (c.el.style.display !== 'none') {
          c.el.style.display = 'none';
          if (c.el._tl) c.el._tl.time(0);
        }
      }
    }
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
})();`;

  return { script, dependencies };
}
