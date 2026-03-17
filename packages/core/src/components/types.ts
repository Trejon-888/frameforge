/**
 * Component System Types
 *
 * A ComponentRenderer is a TypeScript class that accepts data + timing + style
 * and returns HTML/CSS/JS strings. Components use GSAP for choreography,
 * Canvas for particles, and SVG for line-drawing reveals.
 */

import { type EditStyle } from "../edit-styles.js";
import { getGsapScript } from "./gsap-inline.js";

export interface ComponentDependency {
  type: "script" | "style";
  /** CDN fallback URL */
  url: string;
  /** Deduplication key */
  id: string;
  /** If provided, embed content inline instead of loading from URL.
   *  Eliminates CDN race conditions in headless Chrome. */
  getInlineContent?: () => string;
}

export interface ComponentTiming {
  startMs: number;
  endMs: number;
  durationMs: number;
}

export interface ComponentContext {
  style: EditStyle;
  width: number;
  height: number;
  /** Math.min(width, height) / 1080 — proportional scaling */
  scale: number;
  /** Unique DOM id (ff-c-0, ff-c-1, etc.) */
  instanceId: string;
}

export interface ComponentOutput {
  /** Injected once per type into <style> */
  css: string;
  /** DOM markup for this instance */
  html: string;
  /** Runs every frame — receives `el` (root DOM) and `localT` (ms since start) */
  updateJs: string;
  /** Runs once at startup — receives `el` (root DOM) */
  initJs?: string;
}

export interface ComponentRenderer {
  readonly type: string;
  readonly dependencies: ComponentDependency[];
  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput;
}

// === Shared Constants ===

export const GSAP_CDN: ComponentDependency = {
  type: "script",
  url: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
  id: "gsap",
  getInlineContent: getGsapScript,
};

// === Utilities ===

export function escapeHtml(s: string): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
