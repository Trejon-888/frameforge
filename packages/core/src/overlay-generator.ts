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
  | "particle-burst"
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

  // 6. Particle bursts — at topic transitions for visual impact
  for (const ch of chapters) {
    if (ch.startMs < 8000) continue;
    overlays.push({
      type: "particle-burst",
      startMs: ch.startMs,
      endMs: ch.startMs + 1500,
      data: {},
      position: "top-center",
    });
  }

  // 7. Progress bar — always visible, spans full video
  overlays.push({
    type: "progress-bar",
    startMs: 0,
    endMs: duration * 1000,
    data: { durationMs: String(duration * 1000) },
    position: "bottom-left",
  });

  // 8. CTA card — last 3-5 seconds
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

  // 9. Ensure minimum overlay density (1 per 5s)
  fillGaps(overlays, segments, duration);

  // 10. Remove overlaps (max 3 simultaneous)
  return resolveOverlaps(overlays);
}

/**
 * Generate the HTML for all overlay elements.
 * Sizes are scaled proportionally to video dimensions.
 *
 * @deprecated Use `assembleOverlayPage()` from `./components/assembler.js` instead.
 * This function uses basic CSS transitions. The component system provides
 * GSAP-driven animations, Canvas particles, and spring physics.
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
  // Google Fonts are loaded via <link> in the HTML template — no need to load again here.

  var styleEl = document.createElement('style');
  styleEl.textContent = \`
    .ff-overlay {
      position: fixed;
      z-index: 9990;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.4s ${animations.enterCurve}, transform 0.5s ${animations.enterCurve};
    }
    .ff-overlay.visible {
      opacity: 1;
      transform: translate(0, 0) !important;
    }

    /* Hook Card — drops down from top with bounce + glow pulse */
    .ff-hook-card {
      top: ${Math.round(100 * s)}px; left: 50%; transform: translateX(-50%) translateY(-${Math.round(60 * s)}px);
      background: ${colors.primary};
      border: ${Math.max(3, Math.round(elements.borderWidth * 2))}px solid #000;
      border-radius: ${Math.round(elements.borderRadius * s)}px;
      padding: ${Math.round(28 * s)}px ${Math.round(56 * s)}px;
      box-shadow: ${elements.shadowStyle}, 0 0 ${Math.round(40 * s)}px ${colors.primary}30;
      font-family: ${typography.heading};
      font-size: ${Math.round(38 * s)}px; font-weight: 800;
      color: #000; text-align: center;
      max-width: 80%;
      text-transform: uppercase;
      letter-spacing: ${Math.round(4 * s)}px;
      transition: opacity 0.4s ${animations.enterCurve}, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ff-hook-card.visible {
      transform: translateX(-50%) translateY(0);
      animation: ff-hook-pulse 2s ease-in-out 0.6s infinite;
    }
    @keyframes ff-hook-pulse {
      0%, 100% { box-shadow: ${elements.shadowStyle}, 0 0 ${Math.round(40 * s)}px ${colors.primary}30; }
      50% { box-shadow: ${elements.shadowStyle}, 0 0 ${Math.round(60 * s)}px ${colors.primary}50; }
    }

    /* Lower Third — slides in from left with animated bar */
    .ff-lower-third {
      bottom: ${Math.round(360 * s)}px; left: ${Math.round(60 * s)}px;
      transform: translateX(-${Math.round(120 * s)}px);
      display: flex; align-items: center; gap: ${Math.round(16 * s)}px;
      transition: opacity 0.3s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .ff-lt-bar {
      width: ${Math.round(6 * s)}px; height: 0;
      background: ${colors.primary};
      border: ${Math.max(1, elements.borderWidth)}px solid #000;
      transition: height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s;
    }
    .ff-lower-third.visible .ff-lt-bar {
      height: ${Math.round(80 * s)}px;
    }
    .ff-lt-name {
      font-family: ${typography.heading};
      font-size: ${Math.round(44 * s)}px; font-weight: 900;
      color: ${colors.text};
      text-shadow: 3px 3px 0 #000, 0 0 ${Math.round(20 * s)}px rgba(0,0,0,0.3);
    }
    .ff-lt-title {
      font-family: ${typography.body};
      font-size: ${Math.round(22 * s)}px; font-weight: 600;
      color: ${colors.primary};
      text-shadow: 2px 2px 0 #000;
      margin-top: ${Math.round(4 * s)}px;
    }

    /* Key Point — slides in from side with glass backdrop */
    .ff-key-point {
      background: rgba(${colors.background === '#ffffff' || colors.background === '#0a0a0a' ? '0,0,0,0.7' : '23,30,25,0.85'});
      backdrop-filter: blur(${Math.round(16 * s)}px);
      -webkit-backdrop-filter: blur(${Math.round(16 * s)}px);
      border: ${Math.max(2, Math.round(elements.borderWidth * 1.5))}px solid ${colors.primary}80;
      border-radius: ${Math.round(elements.borderRadius * s)}px;
      padding: ${Math.round(24 * s)}px ${Math.round(36 * s)}px;
      box-shadow: ${Math.round(6 * s)}px ${Math.round(6 * s)}px 0 ${colors.primary}, 0 0 ${Math.round(30 * s)}px rgba(0,0,0,0.3);
      max-width: ${Math.round(480 * s)}px;
      transition: opacity 0.3s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .ff-key-point.pos-top-right { top: ${Math.round(140 * s)}px; right: ${Math.round(60 * s)}px; transform: translateX(${Math.round(80 * s)}px); }
    .ff-key-point.pos-top-left { top: ${Math.round(140 * s)}px; left: ${Math.round(60 * s)}px; transform: translateX(-${Math.round(80 * s)}px); }
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

    /* Stat Callout — pops up with staggered boxes */
    .ff-stat-callout {
      top: ${Math.round(140 * s)}px; left: ${Math.round(60 * s)}px;
      display: flex; gap: ${Math.round(16 * s)}px;
      transform: translateY(${Math.round(40 * s)}px);
      transition: opacity 0.3s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
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
      font-size: ${Math.round(52 * s)}px; font-weight: 900; color: #000;
    }
    .ff-stat-label {
      font-family: ${typography.body};
      font-size: ${Math.round(14 * s)}px; font-weight: 700;
      color: ${colors.background};
      text-transform: uppercase; letter-spacing: ${Math.round(2 * s)}px;
      margin-top: ${Math.round(4 * s)}px;
    }

    /* Chapter Marker — drops from top with line extension */
    .ff-chapter-marker {
      top: ${Math.round(70 * s)}px; left: 50%;
      transform: translateX(-50%) translateY(-${Math.round(40 * s)}px);
      background: rgba(${colors.background === '#ffffff' ? '255,255,255,0.9' : '0,0,0,0.8'});
      backdrop-filter: blur(${Math.round(12 * s)}px);
      -webkit-backdrop-filter: blur(${Math.round(12 * s)}px);
      border: ${Math.max(2, Math.round(elements.borderWidth * 1.5))}px solid ${colors.primary};
      border-radius: 100px;
      padding: ${Math.round(14 * s)}px ${Math.round(36 * s)}px;
      font-family: ${typography.body};
      font-size: ${Math.round(18 * s)}px; font-weight: 700;
      color: ${colors.primary};
      text-transform: uppercase;
      letter-spacing: ${Math.round(4 * s)}px;
      transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .ff-chapter-marker.visible { transform: translateX(-50%) translateY(0); }

    /* CTA Card — dramatic scale-in with glow */
    .ff-cta-card {
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0.5);
      text-align: center;
      transition: opacity 0.4s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ff-cta-card.visible { transform: translate(-50%, -50%) scale(1); }
    .ff-cta-text {
      font-family: ${typography.heading};
      font-size: ${Math.round(64 * s)}px; font-weight: 900;
      color: ${colors.text};
      text-shadow: 3px 3px 0 #000, 0 0 ${Math.round(40 * s)}px rgba(0,0,0,0.3);
      margin-bottom: ${Math.round(20 * s)}px;
    }
    .ff-cta-sub {
      font-family: ${typography.body};
      font-size: ${Math.round(32 * s)}px; font-weight: 600;
      color: ${colors.primary};
      text-shadow: 2px 2px 0 #000;
    }
    .ff-cta-btn {
      display: inline-block;
      background: ${colors.primary};
      color: #000;
      border: ${Math.max(2, elements.borderWidth)}px solid #000;
      border-radius: ${Math.round(elements.borderRadius * s)}px;
      padding: ${Math.round(20 * s)}px ${Math.round(52 * s)}px;
      font-family: ${typography.heading};
      font-size: ${Math.round(30 * s)}px; font-weight: 800;
      box-shadow: ${elements.shadowStyle}, 0 0 ${Math.round(30 * s)}px ${colors.primary}40;
      margin-top: ${Math.round(24 * s)}px;
    }
  \`;
  document.head.appendChild(styleEl);

  var overlayContainer = document.createElement('div');
  overlayContainer.id = 'ff-overlays';
  document.body.appendChild(overlayContainer);

  var overlays = ${overlaysJSON};
  var overlayEls = {};

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
    overlayEls[i] = el;
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
      var el = overlayEls[i];
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

// --- Multi-domain key point patterns ---
// Organized by content domain for broad coverage across video types

const KEY_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // Business / Growth
  { pattern: /(?:build|built|create|created)\s+(.{5,40})/i, label: "Building" },
  { pattern: /(?:launch|launched|ship|shipped|released)\s+(.{5,40})/i, label: "Launching" },
  { pattern: /(?:grow|grew|scale|scaled|expanded)\s+(.{5,40})/i, label: "Growth" },
  { pattern: /(?:revenue|profit|income|sales|earnings)\s+(.{5,30})/i, label: "Revenue" },
  { pattern: /(?:strategy|approach|method|framework|playbook)\s+(.{5,30})/i, label: "Strategy" },
  { pattern: /(?:customer|client|user|subscriber)\s+(.{5,30})/i, label: "Audience" },

  // Tech / Product
  { pattern: /(?:workflow|system|platform|tool|product)\s+(.{5,30})/i, label: "System" },
  { pattern: /(?:agent|ai|automation|machine learning|gpt)\s+(.{5,30})/i, label: "AI" },
  { pattern: /(?:api|database|server|deploy|infrastructure)\s+(.{5,30})/i, label: "Tech" },
  { pattern: /(?:feature|update|version|upgrade)\s+(.{5,30})/i, label: "Feature" },
  { pattern: /(?:performance|speed|optimization|latency)\s+(.{5,30})/i, label: "Performance" },

  // Education / Tutorial
  { pattern: /(?:step|method|technique|process|recipe)\s+(.{5,30})/i, label: "Method" },
  { pattern: /(?:learn|discover|understand|master|study)\s+(.{5,30})/i, label: "Learning" },
  { pattern: /(?:mistake|avoid|wrong|don't|never)\s+(.{5,30})/i, label: "Watch Out" },
  { pattern: /(?:tip|trick|hack|shortcut|cheat)\s+(.{5,30})/i, label: "Pro Tip" },
  { pattern: /(?:example|demonstration|case study|real.?world)\s+(.{5,30})/i, label: "Example" },

  // Emphasis / Highlight
  { pattern: /(?:the (?:first|biggest|most|best|worst|fastest|easiest))\s+(.{5,40})/i, label: "Highlight" },
  { pattern: /(?:important|key|critical|essential|crucial|vital)\s+(.{5,30})/i, label: "Key Point" },
  { pattern: /(?:secret|hidden|unknown|surprising|shocking)\s+(.{5,30})/i, label: "Insight" },
  { pattern: /(?:game.?changer|breakthrough|revolution|disrupt)\s*(.{0,30})/i, label: "Breakthrough" },
  { pattern: /(?:problem|challenge|issue|pain\s?point|struggle)\s+(.{5,30})/i, label: "Challenge" },
  { pattern: /(?:solution|answer|fix|resolve|overcome)\s+(.{5,30})/i, label: "Solution" },

  // Personal / Story
  { pattern: /(?:experience|journey|story|background)\s+(.{5,30})/i, label: "Story" },
  { pattern: /(?:result|outcome|achievement|accomplishment)\s+(.{5,30})/i, label: "Result" },
  { pattern: /(?:goal|dream|vision|mission|passion)\s+(.{5,30})/i, label: "Vision" },

  // Creative / Design
  { pattern: /(?:design|style|aesthetic|brand|visual)\s+(.{5,30})/i, label: "Design" },
  { pattern: /(?:template|layout|mockup|prototype)\s+(.{5,30})/i, label: "Template" },

  // Comparison
  { pattern: /(?:better than|faster than|more than|unlike)\s+(.{5,30})/i, label: "Comparison" },
  { pattern: /(?:versus|vs\.?|compared to)\s+(.{5,30})/i, label: "vs" },
];

// --- Transition phrase patterns (topic shifts beyond just pauses) ---

const TRANSITION_PATTERNS: RegExp[] = [
  /(?:now let'?s|moving on|the next|another thing|but here'?s)/i,
  /(?:on (?:the other|that) (?:hand|note)|speaking of|when it comes to)/i,
  /(?:^(?:so|now|but|however|anyway|alright|okay|next)\b)/i,
  /(?:let me (?:show|tell|explain)|here'?s (?:the|what|how|why))/i,
  /(?:the (?:real|big|main|key) (?:thing|question|point|takeaway))/i,
];

// --- Stat number patterns (expanded) ---

const STAT_PATTERN = /(\d+[\d,]*\.?\d*)\s*(?:\+\s*)?((?:percent|%|x|million|billion|thousand|k|m|b|plus|partners|clients|users|customers|companies|businesses|people|team|employees|members|followers|subscribers|downloads|installs|views|likes|years?|months?|weeks?|days?|hours?|minutes?|seconds?|dollars?|\$|euros?|pounds?|points?|times|episodes?|steps?|projects?|deals?|leads?)[\w]*)/gi;

/**
 * Extract the most engaging sentence for the hook card.
 * Prefers questions, bold claims with numbers, or superlatives over plain statements.
 */
function extractHook(segments: TranscriptSegment[]): string | null {
  if (segments.length === 0) return null;

  // Score each segment in the first ~10 seconds for engagement
  const candidates: Array<{ text: string; score: number }> = [];

  for (const seg of segments) {
    if (seg.start > 10) break;
    const sentences = seg.text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 10);
    if (sentences.length === 0) {
      candidates.push({ text: seg.text, score: scoreEngagement(seg.text) });
    } else {
      for (const s of sentences) {
        candidates.push({ text: s, score: scoreEngagement(s) });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Pick the highest-scoring candidate
  candidates.sort((a, b) => b.score - a.score);
  let text = candidates[0].text.trim();

  if (text.length <= 60) return text;
  const truncated = text.substring(0, 60).replace(/\s+\S*$/, "");
  return truncated + "...";
}

/** Score a sentence's engagement level for hook selection */
function scoreEngagement(text: string): number {
  let score = 0;
  if (text.endsWith("?")) score += 3; // Questions are engaging
  if (/\d/.test(text)) score += 2; // Numbers add credibility
  if (/(?:you|your)\b/i.test(text)) score += 2; // Direct address
  if (/(?:how to|why|secret|truth|real|actually)/i.test(text)) score += 2;
  if (/(?:best|worst|most|biggest|fastest|easiest|hardest)/i.test(text)) score += 1;
  if (/[!]/.test(text)) score += 1;
  if (text.length > 20 && text.length < 60) score += 1; // Goldilocks length
  return score;
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
    /welcome (?:to|back)/i,
    /thanks for (?:watching|tuning|joining)/i,
    /(?:this is|it's)\s+\w+\s+here/i,
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

  for (const seg of segments) {
    // Check multi-domain keyword patterns
    for (const { pattern, label } of KEY_PATTERNS) {
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
        break; // One match per segment
      }
    }
  }

  // Also extract question-based callouts
  const questions = extractQuestions(segments);
  for (const q of questions) {
    if (!points.some((p) => Math.abs(p.startMs - q.startMs) < 3000)) {
      points.push(q);
    }
  }

  // Sort by time, cap at 8 for longer videos
  points.sort((a, b) => a.startMs - b.startMs);
  return points.slice(0, 8);
}

/** Extract rhetorical questions as callout-worthy moments */
function extractQuestions(segments: TranscriptSegment[]): KeyPoint[] {
  const questions: KeyPoint[] = [];

  for (const seg of segments) {
    // Skip first 5s (hook territory)
    if (seg.start < 5) continue;

    const text = seg.text.trim();
    // Direct question marks
    if (text.includes("?")) {
      const qSentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.includes("?"));
      for (const q of qSentences) {
        const clean = q.trim().substring(0, 50);
        if (clean.length > 10) {
          questions.push({
            startMs: Math.round(seg.start * 1000),
            endMs: Math.round(seg.end * 1000) + 1500,
            label: "Question",
            text: clean,
          });
        }
      }
    }
    // Implicit questions (how to, why, what if)
    else if (/^(?:how|why|what if|have you ever|did you know)/i.test(text)) {
      questions.push({
        startMs: Math.round(seg.start * 1000),
        endMs: Math.round(seg.end * 1000) + 1500,
        label: "Question",
        text: text.substring(0, 50),
      });
    }
  }

  return questions.slice(0, 3);
}

interface StatResult {
  startMs: number;
  endMs: number;
  data: Record<string, string>;
}

function extractStats(segments: TranscriptSegment[]): StatResult[] {
  const stats: StatResult[] = [];

  for (const seg of segments) {
    const matches = [...seg.text.matchAll(STAT_PATTERN)];
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

/**
 * Detect topic transitions using BOTH pauses AND transition phrases.
 * This catches topic shifts even without silence, and avoids false
 * positives from breathing pauses within the same topic.
 */
function detectTopicTransitions(
  segments: TranscriptSegment[]
): TopicTransition[] {
  const transitions: TopicTransition[] = [];

  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];
    const gap = curr.start - prev.end;

    // Method 1: Significant pause (>1s) between segments
    const hasPause = gap > 1.0;

    // Method 2: Transition phrase at start of segment
    const hasTransitionPhrase = TRANSITION_PATTERNS.some((p) => p.test(curr.text));

    // Either a long pause or a transition phrase (or both) triggers a chapter
    if (hasPause || hasTransitionPhrase) {
      // Extract a clean label: prefer first noun phrase, fall back to first 4 words
      let label = extractTopicLabel(curr.text);

      if (label.length > 3 && label.length < 40) {
        // Avoid duplicate transitions within 5s
        if (!transitions.some((t) => Math.abs(t.startMs - Math.round(curr.start * 1000)) < 5000)) {
          transitions.push({
            startMs: Math.round(curr.start * 1000),
            label: capitalizeFirst(label),
          });
        }
      }
    }
  }

  return transitions.slice(0, 6);
}

/** Extract a clean topic label from a segment's text */
function extractTopicLabel(text: string): string {
  // Strip transition words from the start
  let clean = text
    .replace(/^(?:so|now|but|however|anyway|alright|okay|next|and|then)\s+/i, "")
    .replace(/^(?:let me|let's|here's|here is|this is)\s+/i, "")
    .replace(/^(?:the (?:next|real|big|main|key) (?:thing|question|point) is)\s*/i, "");

  // Take first meaningful phrase (up to 4 words or first punctuation)
  const words = clean.split(/\s+/).slice(0, 4);
  return words.join(" ").replace(/[.,!?:;]+$/, "");
}

/**
 * Fill gaps in the overlay timeline with contextual key-point overlays.
 * Adaptive density: shorter videos get fewer gap-fillers, longer videos get more.
 */
function fillGaps(
  overlays: OverlayElement[],
  segments: TranscriptSegment[],
  duration: number
): void {
  overlays.sort((a, b) => a.startMs - b.startMs);

  // Adaptive gap threshold based on video length
  // Short (<30s): 8s gaps OK, Long (>5m): 4s gaps filled
  const maxGapMs = duration < 30 ? 8000 : duration < 120 ? 6000 : 4000;
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

  // Score candidate segments for gap filling (prefer engaging content)
  let gapAlternator = 0;
  for (const gap of gaps) {
    const candidateSegs = segments.filter(
      (s) => s.start * 1000 >= gap.start && s.start * 1000 <= gap.end
    );

    // Pick the most engaging segment for the gap filler
    let bestSeg: TranscriptSegment | null = null;
    let bestScore = -1;
    for (const seg of candidateSegs) {
      const score = scoreEngagement(seg.text);
      if (score > bestScore) {
        bestScore = score;
        bestSeg = seg;
      }
    }

    // Fallback: first segment in the gap
    if (!bestSeg && candidateSegs.length > 0) bestSeg = candidateSegs[0];

    if (bestSeg) {
      const text = bestSeg.text.split(/[.,!?]/).filter((s) => s.trim().length > 5)[0];
      if (text) {
        overlays.push({
          type: "key-point",
          startMs: Math.round(bestSeg.start * 1000),
          endMs: Math.round(bestSeg.start * 1000) + 3500,
          data: { label: "Key Insight", text: text.trim().substring(0, 50) },
          position: gapAlternator % 2 === 0 ? "top-right" : "top-left",
        });
        gapAlternator++;
      }
    }
  }
}

/** Overlay types that are background UI, not competing for content slots */
const BACKGROUND_OVERLAY_TYPES = new Set<OverlayType>(["progress-bar"]);

function resolveOverlaps(overlays: OverlayElement[]): OverlayElement[] {
  overlays.sort((a, b) => a.startMs - b.startMs);

  const maxSimultaneous = 3;
  const result: OverlayElement[] = [];

  for (const ov of overlays) {
    // Background overlays (progress-bar) always pass — they don't compete for slots
    if (BACKGROUND_OVERLAY_TYPES.has(ov.type)) {
      result.push(ov);
      continue;
    }

    // Count only content overlays (not background) for overlap limit
    const activeCount = result.filter(
      (r) =>
        !BACKGROUND_OVERLAY_TYPES.has(r.type) &&
        r.startMs <= ov.startMs &&
        r.endMs >= ov.startMs
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
