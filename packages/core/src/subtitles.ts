/**
 * Subtitle Engine
 *
 * Parses SRT subtitle files and generates an HTML overlay script
 * that can be injected into any page during rendering.
 * Subtitles display/hide based on FrameForge's virtual time.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface SubtitleEntry {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

/**
 * Parse an SRT subtitle file into timed entries.
 */
export function parseSRT(content: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = [];
  const blocks = content.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;

    const index = parseInt(lines[0], 10);
    if (isNaN(index)) continue;

    const timeLine = lines[1];
    const match = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    );
    if (!match) continue;

    const startMs =
      parseInt(match[1]) * 3600000 +
      parseInt(match[2]) * 60000 +
      parseInt(match[3]) * 1000 +
      parseInt(match[4]);
    const endMs =
      parseInt(match[5]) * 3600000 +
      parseInt(match[6]) * 60000 +
      parseInt(match[7]) * 1000 +
      parseInt(match[8]);

    const text = lines
      .slice(2)
      .join("\n")
      .replace(/<[^>]+>/g, ""); // Strip HTML tags from SRT

    entries.push({ index, startMs, endMs, text });
  }

  return entries;
}

/**
 * Parse a VTT (WebVTT) subtitle file into timed entries.
 */
export function parseVTT(content: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = [];
  // Remove WEBVTT header and any metadata
  const body = content.replace(/^WEBVTT[^\n]*\n/, "").trim();
  const blocks = body.split(/\n\s*\n/);

  let index = 1;
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    // Find the timing line (may or may not have a cue identifier before it)
    let timingLineIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        timingLineIdx = i;
        break;
      }
    }

    const timeLine = lines[timingLineIdx];
    const match = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2})[.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.](\d{3})/
    );
    // Also try MM:SS.mmm format
    const shortMatch = timeLine.match(
      /(\d{2}):(\d{2})[.](\d{3})\s*-->\s*(\d{2}):(\d{2})[.](\d{3})/
    );

    let startMs: number, endMs: number;

    if (match) {
      startMs =
        parseInt(match[1]) * 3600000 +
        parseInt(match[2]) * 60000 +
        parseInt(match[3]) * 1000 +
        parseInt(match[4]);
      endMs =
        parseInt(match[5]) * 3600000 +
        parseInt(match[6]) * 60000 +
        parseInt(match[7]) * 1000 +
        parseInt(match[8]);
    } else if (shortMatch) {
      startMs =
        parseInt(shortMatch[1]) * 60000 +
        parseInt(shortMatch[2]) * 1000 +
        parseInt(shortMatch[3]);
      endMs =
        parseInt(shortMatch[4]) * 60000 +
        parseInt(shortMatch[5]) * 1000 +
        parseInt(shortMatch[6]);
    } else {
      continue;
    }

    const text = lines
      .slice(timingLineIdx + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "");

    entries.push({ index: index++, startMs, endMs, text });
  }

  return entries;
}

/**
 * Load and parse a subtitle file (SRT or VTT).
 */
export async function loadSubtitles(filePath: string): Promise<SubtitleEntry[]> {
  const absPath = resolve(filePath);
  const content = await readFile(absPath, "utf-8");

  if (absPath.endsWith(".vtt")) {
    return parseVTT(content);
  }
  return parseSRT(content);
}

export interface SubtitleOverlayOptions {
  /** Font size in px */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Text color */
  color?: string;
  /** Background color (semi-transparent recommended) */
  background?: string;
  /** Position from bottom in px */
  bottom?: number;
  /** Max width as percentage of canvas */
  maxWidth?: string;
}

/**
 * Generate an HTML/JS overlay script for subtitles.
 * This script is injected into the page and uses __frameforge.currentTimeMs
 * to show/hide subtitles at the correct times.
 */
export function generateSubtitleOverlay(
  entries: SubtitleEntry[],
  options: SubtitleOverlayOptions = {}
): string {
  const {
    fontSize = 32,
    fontFamily = "system-ui, sans-serif",
    color = "#ffffff",
    background = "rgba(0, 0, 0, 0.7)",
    bottom = 60,
    maxWidth = "80%",
  } = options;

  const entriesJSON = JSON.stringify(
    entries.map((e) => ({ s: e.startMs, e: e.endMs, t: e.text }))
  );

  return `
(function() {
  // Create subtitle container
  var container = document.createElement('div');
  container.id = 'ff-subtitles';
  container.style.cssText = 'position:fixed;bottom:${bottom}px;left:50%;transform:translateX(-50%);' +
    'max-width:${maxWidth};text-align:center;font-size:${fontSize}px;font-family:${fontFamily};' +
    'color:${color};background:${background};padding:8px 20px;border-radius:6px;' +
    'pointer-events:none;opacity:0;transition:none;z-index:9999;white-space:pre-line;';
  document.body.appendChild(container);

  var entries = ${entriesJSON};
  var lastText = '';

  function updateSubtitles() {
    var t = window.__frameforge ? window.__frameforge.currentTimeMs : 0;
    var text = '';
    for (var i = 0; i < entries.length; i++) {
      if (t >= entries[i].s && t <= entries[i].e) {
        text = entries[i].t;
        break;
      }
    }
    if (text !== lastText) {
      lastText = text;
      if (text) {
        container.textContent = text;
        container.style.opacity = '1';
      } else {
        container.style.opacity = '0';
      }
    }
  }

  function loop() {
    updateSubtitles();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();`;
}
