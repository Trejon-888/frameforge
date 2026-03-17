/**
 * Overlay Generator
 *
 * Analyzes a transcript and auto-generates a timeline of overlay elements
 * (hook cards, lower thirds, key points, stats, CTAs) with proper timing.
 *
 * Rules:
 * - Minimum 1 overlay every 5 seconds
 * - Maximum 3 overlays visible simultaneously
 * - Overlays must not overlap the caption area
 * - Each overlay: enter (0.3s) + display (2-8s) + exit (0.3s)
 *
 * All sizes are proportionally scaled to the video dimensions.
 * Reference: 1080px minimum dimension = 1.0x scale.
 */

import { type EditStyle } from "./edit-styles.js";
import { type WordTiming } from "./word-captions.js";

// === Types ===

export type OverlayType =
  | "hook-card"
  | "lower-third"
  | "key-point"
  | "stat-callout"
  | "chapter-marker"
  | "cta-card"
  | "progress-bar";

export interface OverlayElement {
  type: OverlayType;
  startMs: number;
  endMs: number;
  data: Record<string, string>;
  position: "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right";
}

export interface TranscriptSegment {
  start: number; // seconds
  end: number; // seconds
  text: string;
}

export interface OverlayGeneratorOptions {
  /** Full transcript segments */
  segments: TranscriptSegment[];
  /** Word-level timings (if available) */
  words?: WordTiming[];
  /** Total video duration in seconds */
  duration: number;
  /** Speaker name (for lower third) */
  speakerName?: string;
  /** Speaker title (for lower third) */
  speakerTitle?: string;
  /** Style preset (for color/element decisions) */
  style: EditStyle;
  /** Output video width (for scaling) */
  width?: number;
  /** Output video height (for scaling) */
  height?: number;
}

// === Main Generator ===

/**
 * Analyze transcript and generate overlay timeline.
 */
export function generateOverlayTimeline(
  options: OverlayGeneratorOptions
): OverlayElement[] {
  const { segments, duration, speakerName, speakerTitle } = options;
  const overlays: OverlayElement[] = [];

  // 1. Hook card — first 3-5 seconds, summarizes the video
  const hookText = extractHook(segments);
  if (hookText) {
    overlays.push({
      type: "hook-card",
      startMs: 200,
      endMs: Math.min(5000, segments[0] ? segments[0].end * 1000 : 5000),
      data: { text: hookText },
      position: "top-center",
    });
  }

  // 2. Lower third — when speaker introduces themselves
  const introTime = findIntroduction(segments);
  if (introTime && speakerName) {
    overlays.push({
      type: "lower-third",
      startMs: introTime.startMs,
      endMs: introTime.endMs,
      data: {
        name: speakerName,
        title: speakerTitle || "",
      },
      position: "bottom-left",
    });
  }

  // 3. Key points — detect important concepts
  const keyPoints = extractKeyPoints(segments);
  let kpPosition: "top-left" | "top-right" = "top-right";
  for (const kp of keyPoints) {
    // Don't overlap with hook card
    if (kp.startMs < 5500) continue;

    overlays.push({
      type: "key-point",
      startMs: kp.startMs,
      endMs: kp.endMs,
      data: {
        label: kp.label,
        text: kp.text,
      },
      position: kpPosition,
    });
    // Alternate sides
    kpPosition = kpPosition === "top-right" ? "top-left" : "top-right";
  }

  // 4. Stat callouts — detect numbers and statistics
  const stats = extractStats(segments);
  for (const stat of stats) {
    overlays.push({
      type: "stat-callout",
      startMs: stat.startMs,
      endMs: stat.endMs,
      data: stat.data,
      position: "top-left",
    });
  }

  // 5. Chapter markers — detect topic transitions
  const chapters = detectTopicTransitions(segments);
  for (const ch of chapters) {
    // Don't place in first 8 seconds (hook + intro territory)
    if (ch.startMs < 8000) continue;

    overlays.push({
      type: "chapter-marker",
      startMs: ch.startMs,
      endMs: ch.startMs + 2500,
      data: { label: ch.label },
      position: "top-center",
    });
  }

  // 6. CTA card — last 3-5 seconds
  if (duration > 10) {
    overlays.push({
      type: "cta-card",
      startMs: (duration - 4) * 1000,
      endMs: (duration - 0.5) * 1000,
      data: {
        text: "Follow for more",
        subtext: speakerName ? `@${speakerName.toLowerCase().replace(/\s+/g, "")}` : "",
      },
      position: "top-center",
    });
  }

  // 7. Ensure minimum overlay density (1 per 5s)
  fillGaps(overlays, segments, duration);

  // 8. Remove overlaps (max 3 simultaneous)
  return resolveOverlaps(overlays);
}

/**
 * Generate the HTML for all overlay elements.
 * Sizes are scaled proportionally to video dimensions.
 */
export function generateOverlayHTML(
  overlays: OverlayElement[],
  style: EditStyle,
  width?: number,
  height?: number
): string {
  const { colors, typography, elements, animations } = style;
  const overlaysJSON = JSON.stringify(overlays);

  // Scale factor based on video dimensions (reference: 1080p)
  const refDim = 1080;
  const scaleDim = Math.min(width ?? 1920, height ?? 1080);
  const s = scaleDim / refDim; // scale multiplier

  return `
(function() {
  // === OVERLAY GENERATOR ===
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '${typography.googleFontsUrl}';
  document.head.appendChild(link);

  var styleEl = document.createElement('style');
  styleEl.textContent = \`
    .ff-overlay {
      position: fixed;
      z-index: 9990;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ${animations.enterCurve}, transform 0.3s ${animations.enterCurve};
    }
    .ff-overlay.visible {
      opacity: 1;
      transform: translate(0, 0) !important;
    }

    /* Hook Card — large, prominent, centered */
    .ff-hook-card {
      top: ${Math.round(100 * s)}px; left: 50%; transform: translateX(-50%) translateY(-20px);
      background: ${colors.primary};
      border: ${Math.max(2, Math.round(elements.borderWidth * 1.5))}px solid #000;
      border-radius: ${Math.round(elements.borderRadius * s)}px;
      padding: ${Math.round(24 * s)}px ${Math.round(48 * s)}px;
      box-shadow: ${elements.shadowStyle};
      font-family: ${typography.heading};
      font-size: ${Math.round(36 * s)}px; font-weight: 800;
      color: #000; text-align: center;
      max-width: 80%;
      text-transform: uppercase;
      letter-spacing: ${Math.round(3 * s)}px;
    }
    .ff-hook-card.visible { transform: translateX(-50%) translateY(0); }

    /* Lower Third — name + title bar */
    .ff-lower-third {
      bottom: ${Math.round(360 * s)}px; left: ${Math.round(60 * s)}px;
      transform: translateX(-30px);
      display: flex; align-items: center; gap: ${Math.round(16 * s)}px;
    }
    .ff-lt-bar {
      width: ${Math.round(6 * s)}px; height: ${Math.round(80 * s)}px;
      background: ${colors.primary};
      border: ${Math.max(1, elements.borderWidth)}px solid #000;
    }
    .ff-lt-name {
      font-family: ${typography.heading};
      font-size: ${Math.round(44 * s)}px; font-weight: 900;
      color: ${colors.text};
      text-shadow: 3px 3px 0 #000;
    }
    .ff-lt-title {
      font-family: ${typography.body};
      font-size: ${Math.round(22 * s)}px; font-weight: 600;
      color: ${colors.primary};
      text-shadow: 2px 2px 0 #000;
      margin-top: ${Math.round(4 * s)}px;
    }

    /* Key Point — info cards */
    .ff-key-point {
      background: ${colors.background};
      border: ${Math.max(2, Math.round(elements.borderWidth * 1.5))}px solid #000;
      border-radius: ${Math.round(elements.borderRadius * s)}px;
      padding: ${Math.round(24 * s)}px ${Math.round(36 * s)}px;
      box-shadow: ${Math.round(6 * s)}px ${Math.round(6 * s)}px 0 ${colors.primary};
      max-width: ${Math.round(480 * s)}px;
    }
    .ff-key-point.pos-top-right { top: ${Math.round(140 * s)}px; right: ${Math.round(60 * s)}px; transform: translateX(30px); }
    .ff-key-point.pos-top-left { top: ${Math.round(140 * s)}px; left: ${Math.round(60 * s)}px; transform: translateX(-30px); }
    .ff-kp-label {
      font-family: ${typography.body};
      font-size: ${Math.round(16 * s)}px; font-weight: 700;
      color: ${colors.primary};
      text-transform: uppercase; letter-spacing: ${Math.round(4 * s)}px;
      margin-bottom: ${Math.round(8 * s)}px;
    }
    .ff-kp-text {
      font-family: ${typography.heading};
      font-size: ${Math.round(32 * s)}px; font-weight: 800;
      color: ${colors.text};
      line-height: 1.2;
    }

    /* Stat Callout — prominent number displays */
    .ff-stat-callout {
      top: ${Math.round(140 * s)}px; left: ${Math.round(60 * s)}px;
      display: flex; gap: ${Math.round(16 * s)}px;
      transform: translateY(-20px);
    }
    .ff-stat-box {
      background: ${colors.primary};
      border: ${Math.max(2, Math.round(elements.borderWidth * 1.5))}px solid #000;
      border-radius: ${Math.round(elements.borderRadius * 0.8 * s)}px;
      padding: ${Math.round(18 * s)}px ${Math.round(28 * s)}px;
      box-shadow: ${elements.shadowStyle};
      text-align: center;
    }
    .ff-stat-num {
      font-family: 'Space Mono', ${typography.heading};
      font-size: ${Math.round(48 * s)}px; font-weight: 900; color: #000;
    }
    .ff-stat-label {
      font-family: ${typography.body};
      font-size: ${Math.round(14 * s)}px; font-weight: 700;
      color: ${colors.background};
      text-transform: uppercase; letter-spacing: ${Math.round(2 * s)}px;
      margin-top: ${Math.round(4 * s)}px;
    }

    /* Chapter Marker — topic transition pill */
    .ff-chapter-marker {
      top: ${Math.round(70 * s)}px; left: 50%;
      transform: translateX(-50%) translateY(-15px);
      background: ${colors.background};
      border: ${Math.max(2, Math.round(elements.borderWidth * 1.5))}px solid ${colors.primary};
      border-radius: 100px;
      padding: ${Math.round(12 * s)}px ${Math.round(32 * s)}px;
      font-family: ${typography.body};
      font-size: ${Math.round(18 * s)}px; font-weight: 700;
      color: ${colors.primary};
      text-transform: uppercase;
      letter-spacing: ${Math.round(4 * s)}px;
    }
    .ff-chapter-marker.visible { transform: translateX(-50%) translateY(0); }

    /* CTA Card — call to action */
    .ff-cta-card {
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      text-align: center;
    }
    .ff-cta-card.visible { transform: translate(-50%, -50%) scale(1); }
    .ff-cta-text {
      font-family: ${typography.heading};
      font-size: ${Math.round(60 * s)}px; font-weight: 900;
      color: ${colors.text};
      text-shadow: 3px 3px 0 #000;
      margin-bottom: ${Math.round(20 * s)}px;
    }
    .ff-cta-sub {
      font-family: ${typography.body};
      font-size: ${Math.round(30 * s)}px; font-weight: 600;
      color: ${colors.primary};
      text-shadow: 2px 2px 0 #000;
    }
    .ff-cta-btn {
      display: inline-block;
      background: ${colors.primary};
      color: #000;
      border: ${Math.max(2, elements.borderWidth)}px solid #000;
      border-radius: ${Math.round(elements.borderRadius * s)}px;
      padding: ${Math.round(18 * s)}px ${Math.round(48 * s)}px;
      font-family: ${typography.heading};
      font-size: ${Math.round(28 * s)}px; font-weight: 800;
      box-shadow: ${elements.shadowStyle};
      margin-top: ${Math.round(24 * s)}px;
    }
  \`;
  document.head.appendChild(styleEl);

  var overlayContainer = document.createElement('div');
  overlayContainer.id = 'ff-overlays';
  document.body.appendChild(overlayContainer);

  var overlays = ${overlaysJSON};
  var elements = {};

  // Create DOM elements for each overlay
  for (var i = 0; i < overlays.length; i++) {
    var ov = overlays[i];
    var el = document.createElement('div');
    el.className = 'ff-overlay';
    el.id = 'ff-ov-' + i;
    el.innerHTML = buildOverlayContent(ov);
    el.className += ' ' + getOverlayClass(ov);
    if (ov.position) el.className += ' pos-' + ov.position;
    overlayContainer.appendChild(el);
    elements[i] = el;
  }

  function buildOverlayContent(ov) {
    switch (ov.type) {
      case 'hook-card':
        return '<div>' + esc(ov.data.text) + '</div>';
      case 'lower-third':
        return '<div class="ff-lt-bar"></div><div><div class="ff-lt-name">' +
          esc(ov.data.name) + '</div><div class="ff-lt-title">' + esc(ov.data.title) + '</div></div>';
      case 'key-point':
        return '<div class="ff-kp-label">' + esc(ov.data.label) +
          '</div><div class="ff-kp-text">' + esc(ov.data.text) + '</div>';
      case 'stat-callout':
        var html = '';
        var pairs = Object.entries(ov.data);
        for (var j = 0; j < pairs.length; j++) {
          html += '<div class="ff-stat-box"><div class="ff-stat-num">' +
            esc(pairs[j][0]) + '</div><div class="ff-stat-label">' + esc(pairs[j][1]) + '</div></div>';
        }
        return html;
      case 'chapter-marker':
        return esc(ov.data.label);
      case 'cta-card':
        return '<div class="ff-cta-text">' + esc(ov.data.text) + '</div>' +
          (ov.data.subtext ? '<div class="ff-cta-sub">' + esc(ov.data.subtext) + '</div>' : '');
      default:
        return '';
    }
  }

  function getOverlayClass(ov) {
    switch (ov.type) {
      case 'hook-card': return 'ff-hook-card';
      case 'lower-third': return 'ff-lower-third';
      case 'key-point': return 'ff-key-point';
      case 'stat-callout': return 'ff-stat-callout';
      case 'chapter-marker': return 'ff-chapter-marker';
      case 'cta-card': return 'ff-cta-card';
      default: return '';
    }
  }

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function update() {
    var t = window.__frameforge ? window.__frameforge.currentTimeMs : performance.now();
    for (var i = 0; i < overlays.length; i++) {
      var ov = overlays[i];
      var el = elements[i];
      if (t >= ov.startMs && t <= ov.endMs) {
        el.classList.add('visible');
      } else {
        el.classList.remove('visible');
      }
    }
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
})();`;
}

// === Content Analysis Functions ===

function extractHook(segments: TranscriptSegment[]): string | null {
  if (segments.length === 0) return null;
  const firstSeg = segments[0];
  // Use first sentence, truncated to ~60 chars
  const text = firstSeg.text.trim();
  if (text.length <= 60) return text;
  // Truncate at word boundary
  const truncated = text.substring(0, 60).replace(/\s+\S*$/, "");
  return truncated + "...";
}

function findIntroduction(
  segments: TranscriptSegment[]
): { startMs: number; endMs: number } | null {
  const introPatterns = [
    /my name is/i,
    /i'm\s+\w+/i,
    /i am\s+\w+/i,
    /hey.*new here/i,
    /what's up/i,
    /hello.*i'm/i,
  ];

  for (const seg of segments) {
    for (const pattern of introPatterns) {
      if (pattern.test(seg.text)) {
        return {
          startMs: Math.round(seg.start * 1000),
          endMs: Math.round(seg.end * 1000) + 2000,
        };
      }
    }
  }
  return null;
}

interface KeyPoint {
  startMs: number;
  endMs: number;
  label: string;
  text: string;
}

function extractKeyPoints(segments: TranscriptSegment[]): KeyPoint[] {
  const points: KeyPoint[] = [];
  const keyPatterns = [
    { pattern: /(?:build|built|create|created)\s+(.{5,40})/i, label: "Building" },
    { pattern: /(?:launch|launched|ship|shipped)\s+(.{5,40})/i, label: "Launching" },
    { pattern: /(?:the (?:first|biggest|most))\s+(.{5,40})/i, label: "Highlight" },
    { pattern: /(?:important|key|critical|essential)\s+(.{5,30})/i, label: "Key Point" },
    { pattern: /(?:workflow|system|platform|tool)\s+(.{5,30})/i, label: "System" },
    { pattern: /(?:agent|ai|automation)\s+(.{5,30})/i, label: "AI" },
  ];

  for (const seg of segments) {
    for (const { pattern, label } of keyPatterns) {
      const match = seg.text.match(pattern);
      if (match) {
        const startMs = Math.round(seg.start * 1000);
        if (points.some((p) => Math.abs(p.startMs - startMs) < 3000)) continue;

        let text = match[1] || match[0];
        text = text.replace(/[.,!?]+$/, "").trim();
        if (text.length > 40) {
          text = text.substring(0, 40).replace(/\s+\S*$/, "");
        }

        points.push({
          startMs,
          endMs: Math.round(seg.end * 1000) + 1500,
          label,
          text: capitalizeFirst(text),
        });
        break;
      }
    }
  }

  return points.slice(0, 6);
}

interface StatResult {
  startMs: number;
  endMs: number;
  data: Record<string, string>;
}

function extractStats(segments: TranscriptSegment[]): StatResult[] {
  const stats: StatResult[] = [];
  const numberPattern = /(\d+[\d,]*\.?\d*)\s*(?:\+\s*)?((?:percent|%|million|billion|thousand|k|m|plus|partners|clients|users|customers|companies|businesses|people|team|years?|months?|hours?|dollars?|\$)[\w]*)/gi;

  for (const seg of segments) {
    const matches = [...seg.text.matchAll(numberPattern)];
    if (matches.length > 0) {
      const data: Record<string, string> = {};
      for (const m of matches.slice(0, 3)) {
        const num = m[1].replace(/,/g, "");
        const label = m[2].trim();
        data[num + (m[0].includes("+") ? "+" : "")] = capitalizeFirst(label);
      }

      if (Object.keys(data).length > 0) {
        const startMs = Math.round(seg.start * 1000);
        if (!stats.some((s) => Math.abs(s.startMs - startMs) < 5000)) {
          stats.push({
            startMs,
            endMs: Math.round(seg.end * 1000) + 2000,
            data,
          });
        }
      }
    }
  }

  return stats.slice(0, 4);
}

interface TopicTransition {
  startMs: number;
  label: string;
}

function detectTopicTransitions(
  segments: TranscriptSegment[]
): TopicTransition[] {
  const transitions: TopicTransition[] = [];

  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];
    const gap = curr.start - prev.end;

    // Significant pause between segments
    if (gap > 1.0) {
      const words = curr.text.split(/\s+/).slice(0, 4);
      const label = words.join(" ").replace(/[.,!?]+$/, "");

      if (label.length > 3 && label.length < 40) {
        transitions.push({
          startMs: Math.round(curr.start * 1000),
          label: capitalizeFirst(label),
        });
      }
    }
  }

  return transitions.slice(0, 5);
}

function fillGaps(
  overlays: OverlayElement[],
  segments: TranscriptSegment[],
  duration: number
): void {
  overlays.sort((a, b) => a.startMs - b.startMs);

  const maxGapMs = 5000;
  const durationMs = duration * 1000;

  let lastEnd = 0;
  const gaps: Array<{ start: number; end: number }> = [];

  for (const ov of overlays) {
    if (ov.startMs - lastEnd > maxGapMs) {
      gaps.push({ start: lastEnd + 500, end: ov.startMs - 500 });
    }
    lastEnd = Math.max(lastEnd, ov.endMs);
  }

  if (durationMs - lastEnd > maxGapMs) {
    gaps.push({ start: lastEnd + 500, end: durationMs - 4500 });
  }

  let gapAlternator = 0;
  for (const gap of gaps) {
    const nearSeg = segments.find(
      (s) => s.start * 1000 >= gap.start && s.start * 1000 <= gap.end
    );
    if (nearSeg) {
      const text = nearSeg.text.split(/[.,!?]/).filter((s) => s.trim().length > 5)[0];
      if (text) {
        overlays.push({
          type: "key-point",
          startMs: Math.round(nearSeg.start * 1000),
          endMs: Math.round(nearSeg.start * 1000) + 3500,
          data: { label: "Key Insight", text: text.trim().substring(0, 50) },
          position: gapAlternator % 2 === 0 ? "top-right" : "top-left",
        });
        gapAlternator++;
      }
    }
  }
}

function resolveOverlaps(overlays: OverlayElement[]): OverlayElement[] {
  overlays.sort((a, b) => a.startMs - b.startMs);

  const maxSimultaneous = 3;
  const result: OverlayElement[] = [];

  for (const ov of overlays) {
    const activeCount = result.filter(
      (r) => r.startMs <= ov.startMs && r.endMs >= ov.startMs
    ).length;

    if (activeCount < maxSimultaneous) {
      result.push(ov);
    }
  }

  return result;
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
