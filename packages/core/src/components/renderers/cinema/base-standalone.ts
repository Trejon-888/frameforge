/**
 * CinemaStandaloneRenderer — Abstract base class
 *
 * For components that don't use a browser window mockup:
 * ai-workflow, stat-counter, code-terminal.
 *
 * Subclasses provide: type, namespace, and content CSS/HTML/JS.
 * Base class provides: scene + glow + perspective entry + exit.
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
  genSceneCss,
  genStyleTokensCss,
  genSceneHtml,
  genExitJs,
  STD_UPDATE_JS,
} from "./shared.js";
import type { EditStyle } from "../../../edit-styles.js";

export abstract class CinemaStandaloneRenderer implements ComponentRenderer {
  abstract readonly type: string;
  protected abstract readonly ns: string;

  readonly dependencies = [GSAP_CDN];

  protected abstract contentCss(s: number, primary: string, bodyFont: string, headFont: string): string;
  protected abstract contentHtml(id: string, s: number, primary: string): string;

  /**
   * GSAP init JS. Must:
   * 1. Use `var scene = document.getElementById('${id}-scene');`
   * 2. Use `var tl = gsap.timeline({ paused: true });`
   * 3. Animate the content
   * Base class will append exit tweens and `el._tl = tl`.
   */
  protected abstract contentInitJs(id: string, s: number, primary: string): string;

  protected contentUpdateJs(_id: string, _s: number): string { return ""; }

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
    const exitSec = ((timing.durationMs - 400) / 1000).toFixed(3);

    const css = genSceneCss(ns, s, primary, portrait, style) + this.contentCss(s, primary, bodyFont, headFont);

    const html = genSceneHtml(ns, id, this.contentHtml(id, s, primary));

    const initJs =
      this.contentInitJs(id, s, primary) +
      genExitJs(id, exitSec, s, style) +
      `
el._tl = tl;`;

    const updateJs = STD_UPDATE_JS + this.contentUpdateJs(id, s);

    return { css, html, initJs, updateJs };
  }
}
