/**
 * CinemaBrowserRenderer — Abstract base class
 *
 * Handles orientation-aware layout:
 * - Landscape: left headline + right browser (two-column)
 * - Portrait (9:16): stacked headline above full-width browser
 *
 * Subclasses provide: type, namespace, browserUrl, navItems, activeNav,
 * and viewport content. The base class assembles everything else.
 */

import {
  type ComponentRenderer,
  type ComponentTiming,
  type ComponentContext,
  type ComponentOutput,
  GSAP_CDN,
} from "../../types.js";

import {
  R,
  isPortrait,
  cinemaScale,
  panelWidth,
  genSceneCss,
  genSceneHtml,
  genBrowserCss,
  genBrowserHtml,
  genCursorCss,
  genCursorHtml,
  genHeadlineCss,
  genHeadlineHtml,
  genEntryInitJs,
  genExitJs,
  genHeadlineInitJs,
  STD_UPDATE_JS,
} from "./shared.js";
import type { EditStyle } from "../../../edit-styles.js";

export interface HeadlineContent {
  tag: string;
  headline: string;  // may include <br> (stripped in portrait)
  desc: string;
}

export abstract class CinemaBrowserRenderer implements ComponentRenderer {
  abstract readonly type: string;
  /** CSS class namespace prefix (e.g. "ff-crm") */
  protected abstract readonly ns: string;
  /** URL shown in the browser bar */
  protected abstract readonly browserUrl: string;
  /** Nav tab labels */
  protected abstract readonly navItems: string[];
  protected abstract readonly activeNav: number;

  readonly dependencies = [GSAP_CDN];

  protected abstract headline(s: number): HeadlineContent;
  protected abstract viewportCss(s: number, primary: string, bodyFont: string, headFont: string): string;
  protected abstract viewportHtml(id: string, s: number): string;
  protected abstract viewportInitJs(id: string, s: number, primary: string): string;
  protected viewportUpdateJs(_id: string, _s: number): string { return ""; }

  render(
    _data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, width, height, instanceId: id } = ctx;
    const { colors, typography } = style;
    const primary = colors.primary;
    const bodyFont = typography.body;
    const headFont = typography.heading;
    const ns = this.ns;

    const portrait = isPortrait(width, height);
    const s = cinemaScale(width, height);
    const pw = panelWidth(width, height, s, 920);
    // Browser gets full panel width in portrait; in landscape it's the right column
    const browserW = portrait ? pw : R(1000 * s);
    // Viewport height: portrait gets more vertical space to use the tall canvas
    const vpH = portrait ? R(480 * s) : R(380 * s);

    const exitSec = ((timing.durationMs - 400) / 1000).toFixed(3);
    const hl = this.headline(s);

    // ── CSS ──────────────────────────────────────────────────────────────────
    const wrapCss = portrait
      ? `
.${ns}-wrap {
  display: flex; flex-direction: column; align-items: center;
  gap: ${R(16 * s)}px; position: relative; z-index: 1;
  width: ${pw}px;
}
.${ns}-rgt { width: 100%; position: relative; }`
      : `
.${ns}-wrap {
  display: flex; flex-direction: row; align-items: center;
  gap: ${R(36 * s)}px; position: relative; z-index: 1;
}
.${ns}-rgt { flex: 1; min-width: 0; position: relative; }`;

    const css =
      genSceneCss(ns, s, primary, portrait, style) +
      genBrowserCss(ns, s, primary, bodyFont, browserW, style) +
      genCursorCss(ns, s) +
      genHeadlineCss(ns, s, primary, bodyFont, headFont, portrait) +
      wrapCss +
      this.viewportCss(s, primary, bodyFont, headFont);

    // ── HTML ─────────────────────────────────────────────────────────────────
    const browserHtml = genBrowserHtml(
      ns, id,
      this.browserUrl,
      this.navItems, this.activeNav,
      this.viewportHtml(id, s),
      vpH
    );

    const html = genSceneHtml(ns, id, `
<div class="${ns}-wrap">
  ${genHeadlineHtml(ns, id, hl.tag, hl.headline, hl.desc, portrait)}
  <div class="${ns}-rgt">
    ${browserHtml}
    ${genCursorHtml(ns, id)}
  </div>
</div>`);

    // ── JS ───────────────────────────────────────────────────────────────────
    const initJs =
      genEntryInitJs(id, s, true, style) +
      genHeadlineInitJs(id) +
      this.viewportInitJs(id, s, primary) +
      genExitJs(id, exitSec, s, style) +
      `
el._tl = tl;`;

    const updateJs = STD_UPDATE_JS + this.viewportUpdateJs(id, s);

    return { css, html, initJs, updateJs };
  }
}
