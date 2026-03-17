/**
 * GSAP Inline Loader
 *
 * Reads gsap.min.js from the installed npm package at runtime and caches it.
 * This eliminates CDN dependency — GSAP is embedded directly in the overlay HTML
 * as an inline <script>, guaranteeing it's available before any component code runs.
 *
 * Follows the same pattern as TIME_VIRTUALIZATION_SCRIPT — large JS payloads
 * injected into Puppeteer pages as inline scripts for deterministic execution.
 */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

let _gsapScript: string | null = null;

/**
 * Get the minified GSAP library as a string.
 * Resolved from the installed gsap npm package.
 * Result is cached after first call.
 */
export function getGsapScript(): string {
  if (!_gsapScript) {
    const require = createRequire(import.meta.url);
    const gsapPath = require.resolve("gsap/dist/gsap.min.js");
    _gsapScript = readFileSync(gsapPath, "utf-8");
  }
  return _gsapScript;
}
