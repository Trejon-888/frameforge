/**
 * Cinema Infrastructure — Shared Generators
 *
 * Generator functions for the cinema component design system.
 * All colors are driven by CSS custom properties injected per-render
 * from the active EditStyle — enabling fully style-adaptive overlays.
 *
 * CSS vars injected: --ff-bg, --ff-panel, --ff-viewport, --ff-border,
 * --ff-border-soft, --ff-text, --ff-text-muted, --ff-text-faint,
 * --ff-surface, --ff-backdrop, --ff-success
 *
 * Every pixel value is scaled by `s = cinemaScale(width, height)`.
 */

import type { EditStyle } from "../../../edit-styles.js";

export const R = Math.round;

/** Inline SVG dot-grid background (16px grid, white 8% opacity) */
export const DOT_GRID_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,0.08)'/%3E%3C/svg%3E")`;

/** Convert `#rrggbb` or `#rgb` to `rgba(r,g,b,a)` */
export function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// ─── Style token computation ──────────────────────────────────────────────────

/**
 * Computes a CSS custom-property block from the active EditStyle.
 * Injected once per scene — all component CSS uses var(--ff-*).
 * Dark styles get dark panels + glow; light styles get cream surfaces + flat.
 */
export function genStyleTokensCss(style: EditStyle): string {
  const dark = style.theme === "dark";
  const bg = style.colors.background;
  const primary = style.colors.primary;

  // Dark-mode tokens (hardcoded deep surfaces, white text)
  const tokens = dark ? `
  --ff-bg:            ${bg};
  --ff-panel:         #0d0f1a;
  --ff-titlebar:      #131520;
  --ff-viewport:      #0a0c18;
  --ff-border:        rgba(255,255,255,0.12);
  --ff-border-soft:   rgba(255,255,255,0.07);
  --ff-text:          #ffffff;
  --ff-text-muted:    rgba(255,255,255,0.45);
  --ff-text-faint:    rgba(255,255,255,0.28);
  --ff-surface:       rgba(255,255,255,0.05);
  --ff-surface-hov:   rgba(255,255,255,0.09);
  --ff-backdrop:      rgba(0,0,0,0.52);
  --ff-success:       #00e57a;
  --ff-success-glow:  rgba(0,229,122,0.35);
  --ff-dot-grid:      ${DOT_GRID_URI};
  --ff-radius:        0px;
  --ff-ease-in:       back.out(1.4);
  --ff-shadow:        0 40px 100px rgba(0,0,0,0.9);` : `
  --ff-bg:            ${bg};
  --ff-panel:         #ffffff;
  --ff-titlebar:      ${style.colors.surface};
  --ff-viewport:      #FAFAF8;
  --ff-border:        ${style.colors.border};
  --ff-border-soft:   ${style.colors.border};
  --ff-text:          ${style.colors.text};
  --ff-text-muted:    ${style.colors.textAlt};
  --ff-text-faint:    ${style.colors.muted};
  --ff-surface:       ${style.colors.surface};
  --ff-surface-hov:   #EEEEE8;
  --ff-backdrop:      ${hexToRgba(bg, 0.97)};
  --ff-success:       #0A7C59;
  --ff-success-glow:  rgba(10,124,89,0.2);
  --ff-dot-grid:      none;
  --ff-radius:        ${style.elements.borderRadius}px;
  --ff-ease-in:       power2.out;
  --ff-shadow:        0 8px 40px rgba(0,0,0,0.12);`;

  return `:root {${tokens}\n}`;
}

/**
 * Returns the GSAP entry ease appropriate for the style theme.
 * Dark/dramatic: spring back.out. Light/editorial: clean power2.out.
 */
export function gsapEntryEase(style: EditStyle): string {
  return style.theme === "dark" ? "back.out(1.4)" : "power2.out";
}

export function gsapExitEase(style: EditStyle): string {
  return style.theme === "dark" ? "power2.in" : "linear";
}

// ─── Orientation helpers ──────────────────────────────────────────────────────

export function isPortrait(width: number, height: number): boolean {
  return height > width * 1.2;
}

/**
 * Effective scale for cinema components.
 * Portrait: relative to width (9:16 reference = 1440px)
 * Landscape: relative to min dimension (16:9 reference = 1080px)
 */
export function cinemaScale(width: number, height: number): number {
  return isPortrait(width, height) ? width / 1440 : Math.min(width, height) / 1080;
}

/**
 * Panel width for cinema components.
 * Portrait: 92% of canvas width.
 * Landscape: fixed reference scaled by s.
 */
export function panelWidth(width: number, height: number, s: number, landscapeRef = 920): number {
  return isPortrait(width, height)
    ? R(width * 0.92)
    : R(landscapeRef * s);
}

// ─── Scene (full-frame backdrop) ─────────────────────────────────────────────

export function genSceneCss(ns: string, s: number, primary: string, portrait = false, style?: EditStyle): string {
  const vertAlign = portrait ? "flex-start" : "center";
  const vertPad = portrait ? "padding-top: 8%;" : "";
  const tokenBlock = style ? genStyleTokensCss(style) : "";
  return `
${tokenBlock}
.${ns}-scene {
  position: fixed; inset: 0; z-index: 9990;
  display: flex; align-items: ${vertAlign}; justify-content: center;
  ${vertPad}
  background: var(--ff-bg);
  background-image: var(--ff-dot-grid);
  pointer-events: none; overflow: hidden;
  opacity: 0;
}
.${ns}-glow {
  position: absolute;
  width: ${R(900 * s)}px; height: ${R(900 * s)}px;
  border-radius: 50%;
  background: radial-gradient(circle, ${hexToRgba(primary, 0.18)} 0%, transparent 70%);
  top: ${portrait ? "30%" : "50%"}; left: 50%; transform: translate(-50%, -50%);
  pointer-events: none;
}`;
}

export function genSceneHtml(ns: string, id: string, innerHtml: string): string {
  return `
<div class="${ns}-scene" id="${id}-scene">
  <div class="${ns}-glow"></div>
  ${innerHtml}
</div>`;
}

// ─── Browser Mockup ───────────────────────────────────────────────────────────

export function genBrowserCss(
  ns: string,
  s: number,
  primary: string,
  bodyFont: string,
  browserW: number,
  style?: EditStyle
): string {
  const br = style ? style.elements.borderRadius : R(14 * s);
  const urlBr = style ? Math.min(style.elements.borderRadius, 6) : R(6 * s);
  return `
.${ns}-browser {
  width: ${browserW}px;
  background: var(--ff-panel);
  border-radius: ${br}px;
  border: 1px solid var(--ff-border);
  box-shadow: var(--ff-shadow);
  overflow: hidden;
  transform-origin: 50% 50%;
}
.${ns}-titlebar {
  background: var(--ff-titlebar);
  border-bottom: 1px solid var(--ff-border-soft);
  padding: ${R(10 * s)}px ${R(16 * s)}px;
  display: flex; align-items: center; gap: ${R(8 * s)}px;
}
.${ns}-dot {
  width: ${R(11 * s)}px; height: ${R(11 * s)}px; border-radius: 50%; flex-shrink: 0;
}
.${ns}-urlbar {
  flex: 1; margin: 0 ${R(12 * s)}px;
  background: var(--ff-surface);
  border: 1px solid var(--ff-border-soft);
  border-radius: ${urlBr}px;
  padding: ${R(4 * s)}px ${R(10 * s)}px;
  font-family: ${bodyFont}; font-size: ${R(10 * s)}px;
  color: var(--ff-text-faint); letter-spacing: 0.01em;
  text-align: center;
}
.${ns}-nav {
  background: var(--ff-surface);
  border-bottom: 1px solid var(--ff-border-soft);
  padding: 0 ${R(20 * s)}px;
  display: flex; align-items: center; gap: ${R(24 * s)}px;
  height: ${R(36 * s)}px;
}
.${ns}-navitem {
  font-family: ${bodyFont}; font-size: ${R(11 * s)}px; font-weight: 600;
  color: var(--ff-text-faint); cursor: default; padding: ${R(4 * s)}px 0;
  border-bottom: ${R(2 * s)}px solid transparent;
}
.${ns}-navitem.active {
  color: ${primary}; border-color: ${primary};
}
.${ns}-viewport {
  position: relative; overflow: hidden; background: var(--ff-viewport);
}`;
}

export function genBrowserHtml(
  ns: string,
  id: string,
  url: string,
  navItems: string[],
  activeNav: number,
  viewportHtml: string,
  vpHeight: number  // computed by caller based on orientation
): string {
  const navHtml = navItems.map((item, i) =>
    `<div class="${ns}-navitem${i === activeNav ? " active" : ""}">${item}</div>`
  ).join("");

  return `
<div class="${ns}-browser" id="${id}-browser">
  <div class="${ns}-titlebar">
    <div class="${ns}-dot" style="background:#ff5f57"></div>
    <div class="${ns}-dot" style="background:#ffbd2e"></div>
    <div class="${ns}-dot" style="background:#28c840"></div>
    <div class="${ns}-urlbar">${url}</div>
  </div>
  <div class="${ns}-nav">${navHtml}</div>
  <div class="${ns}-viewport" id="${id}-vp" style="height:${vpHeight}px">
    ${viewportHtml}
  </div>
</div>`;
}

// ─── Cursor ───────────────────────────────────────────────────────────────────

export function genCursorCss(ns: string, s: number): string {
  return `
.${ns}-cursor {
  position: absolute; width: ${R(20 * s)}px; height: ${R(20 * s)}px;
  pointer-events: none; z-index: 100; opacity: 0;
}
.${ns}-cursor-ring {
  position: absolute; inset: 0;
  border: ${R(2 * s)}px solid rgba(255,255,255,0.9);
  border-radius: 50%;
  box-shadow: 0 0 ${R(8 * s)}px rgba(255,255,255,0.5);
}
.${ns}-cursor-dot {
  position: absolute;
  width: ${R(4 * s)}px; height: ${R(4 * s)}px;
  background: #fff; border-radius: 50%;
  top: 50%; left: 50%; transform: translate(-50%, -50%);
}`;
}

export function genCursorHtml(ns: string, id: string): string {
  return `
<div class="${ns}-cursor" id="${id}-cursor">
  <div class="${ns}-cursor-ring" id="${id}-cursor-ring"></div>
  <div class="${ns}-cursor-dot"></div>
</div>`;
}

// ─── Perspective entry / exit ─────────────────────────────────────────────────

/**
 * Generates the GSAP init JS for a browser-mockup component.
 * The scene fades in; the browser enters with rotateX perspective.
 * Returns a code string that sets up `tl` (paused GSAP timeline).
 * Caller must assign `el._tl = tl` after adding content tweens.
 */
export function genEntryInitJs(id: string, s: number, hasCursor = true, style?: EditStyle): string {
  const dark = !style || style.theme === "dark";
  // Dark: dramatic 3D perspective entry. Light: clean slide up, no rotation.
  const browserEntry = dark
    ? `gsap.set(browser, { rotateX: 12, scale: 0.88, opacity: 0, transformPerspective: 1400, transformOrigin: '50% 50%' });`
    : `gsap.set(browser, { y: ${R(28 * s)}, scale: 0.97, opacity: 0 });`;
  const browserTween = dark
    ? `tl.to(browser, { rotateX: 0, scale: 1, opacity: 1, duration: 0.65, ease: 'back.out(1.4)' }, 0.1);`
    : `tl.to(browser, { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.05);`;

  return `
var scene = document.getElementById('${id}-scene');
var browser = document.getElementById('${id}-browser');
${hasCursor ? `var cursor = document.getElementById('${id}-cursor');
var cursorRing = document.getElementById('${id}-cursor-ring');` : ""}

gsap.set(scene, { opacity: 0 });
${browserEntry}
${hasCursor ? `gsap.set(cursor, { opacity: 0 });` : ""}

var tl = gsap.timeline({ paused: true });
tl.to(scene, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0);
${browserTween}`;
}

export function genExitJs(id: string, exitSec: string, s: number, style?: EditStyle): string {
  const dark = !style || style.theme === "dark";
  const exitEase = dark ? "power2.in" : "linear";
  const exitY = dark ? R(-20 * s) : R(16 * s);
  return `
tl.to(document.getElementById('${id}-browser'), { scale: 0.94, opacity: 0, y: ${exitY}, duration: 0.35, ease: '${exitEase}' }, ${exitSec});
tl.to(document.getElementById('${id}-scene'), { opacity: 0, duration: 0.3 }, ${exitSec});`;
}

/** Standard updateJs — just scrubs the GSAP timeline */
export const STD_UPDATE_JS = `if (el._tl) el._tl.time(localT / 1000);`;

// ─── Left/Top headline block ──────────────────────────────────────────────────

export function genHeadlineCss(
  ns: string,
  s: number,
  primary: string,
  bodyFont: string,
  headFont: string,
  portrait = false
): string {
  // Portrait: headline sits above the browser, full-width, centered text
  // Landscape: fixed-width left column
  const lftStyle = portrait
    ? `flex: none; width: 100%; text-align: center;`
    : `flex: 0 0 ${R(280 * s)}px; display: flex; flex-direction: column; justify-content: center;`;
  const tagMb = portrait ? R(10 * s) : R(14 * s);
  const h1Size = portrait ? R(32 * s) : R(38 * s);
  const h1Mb = portrait ? R(8 * s) : R(12 * s);
  const descSize = portrait ? R(13 * s) : R(13 * s);

  return `
.${ns}-lft {
  ${lftStyle}
}
.${ns}-tag {
  font-family: ${bodyFont}; font-size: ${R(10 * s)}px; font-weight: 700;
  letter-spacing: ${R(2.5 * s)}px; color: ${primary};
  text-transform: uppercase; margin-bottom: ${tagMb}px; opacity: 0;
}
.${ns}-h1 {
  font-family: ${headFont}; font-size: ${h1Size}px; font-weight: 900;
  line-height: 1.08; color: var(--ff-text); margin-bottom: ${h1Mb}px; opacity: 0;
}
.${ns}-desc {
  font-family: ${bodyFont}; font-size: ${descSize}px; line-height: 1.65;
  color: var(--ff-text-muted); opacity: 0;
}`;
}

export function genHeadlineHtml(
  ns: string,
  id: string,
  tag: string,
  headline: string,
  desc: string,
  portrait = false
): string {
  // Portrait: strip <br> tags from headline so it flows naturally in single-line centered mode
  const headlineText = portrait ? headline.replace(/<br>/gi, " ") : headline;
  return `
<div class="${ns}-lft">
  <div class="${ns}-tag" id="${id}-tag">${tag}</div>
  <h2 class="${ns}-h1" id="${id}-h1">${headlineText}</h2>
  <p class="${ns}-desc" id="${id}-desc">${desc}</p>
</div>`;
}

export function genHeadlineInitJs(id: string): string {
  return `
tl.to(document.getElementById('${id}-tag'), { opacity: 1, duration: 0.25 }, 0.6);
tl.to(document.getElementById('${id}-h1'), { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.75);
tl.to(document.getElementById('${id}-desc'), { opacity: 1, duration: 0.3 }, 0.95);`;
}
