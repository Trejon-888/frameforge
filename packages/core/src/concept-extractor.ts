/**
 * Concept Extractor
 *
 * Analyzes transcript segments to detect semantic concepts and maps them
 * to visual illustration types. Applies visual restraint rules:
 * - Minimum 7.5s spacing between illustrations
 * - Only triggers where concept confidence is high enough (score ≥ 2)
 * - No gap-filling — only illustrate real concepts, not silence
 * - Sliding context window (current + next segment) for better phrase detection
 */

export type IllustrationType =
  | "crm-calendar"
  | "social-feed"
  | "ai-workflow"
  | "stat-counter"
  | "pipeline-board"
  | "inbox-send"
  | "dashboard"
  | "code-terminal";

export interface TranscriptSegment {
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

export interface ConceptIllustration {
  type: IllustrationType;
  startMs: number;
  endMs: number;
  data: Record<string, string>;
  position: "top-left" | "top-right";
}

// HIGH match = +3 points, MED match = +1 point
// Minimum score to trigger an illustration: 2
const CONCEPT_PATTERNS: Record<IllustrationType, { high: RegExp[]; med: RegExp[] }> = {
  "crm-calendar": {
    high: [
      /book(?:ing)?\s+(?:a\s+)?(?:meeting|appointment|call|demo)\b/i,
      /schedule\s+(?:a\s+)?(?:meeting|call|appointment)\b/i,
      /meetings?\s+automatically\b/i,
      /\bcrm\b/i,
      /auto(?:matically)?\s+(?:book|schedule)\b/i,
      /calendar\s+(?:invite|booking|management)\b/i,
    ],
    med: [
      /\b(?:meeting|appointment|booking|calendar|schedule)\b/i,
      /\bfollow.?up\b/i,
    ],
  },

  "social-feed": {
    high: [
      /social\s+media\s+(?:manager|management|post|content|agent)/i,
      /(?:post|schedule|create)\s+(?:social\s+media\s+)?content\b/i,
      /content\s+calendar\b/i,
      /(?:instagram|twitter|linkedin|tiktok)\s+(?:post|content|reel|video)/i,
      /ai\s+(?:social|content)\s+manager/i,
    ],
    med: [
      /\bsocial\s+media\b/i,
      /\b(?:followers?|engagement|viral|reels?)\b/i,
      /\b(?:post(?:ing)?|content)\s+(?:for|to|on)\b/i,
    ],
  },

  "ai-workflow": {
    high: [
      /ai\s+agents?\s+(?:that|which|who|can|will|automatically)\b/i,
      /automat(?:e|ing|ion)\s+(?:your|the|this|client|entire)\b/i,
      /(?:runs?|works?|operates?)\s+automatically\b/i,
      /ai\s+(?:handles?|manages?|does?|runs?)\s+/i,
      /(?:workflow|pipeline)\s+automation\b/i,
    ],
    med: [
      /\bautomat(?:e|ion|ing|ed)\b/i,
      /\bai\s+(?:agent|system|tool|workflow)\b/i,
      /\bworkflow\b/i,
    ],
  },

  "stat-counter": {
    high: [
      /\d+\s*(?:percent|%)\s+(?:increase|decrease|more|less|faster|better)\b/i,
      /\bsaved?\b.{0,20}\b\d+\s+hours?\b/i,
      /\d[\d,]+\s+(?:clients?|customers?|users?|businesses?|companies?)\b/i,
      /\$\s*\d+(?:k|m|b|million|billion)\b/i,
    ],
    med: [
      /\d+\s*(?:%|percent)\b/i,
      /\d+\s*x\s+(?:faster|more|better)\b/i,
      /\b\d+\s+hours?\s+(?:per|every|a|each)\b/i,
    ],
  },

  "pipeline-board": {
    high: [
      /sales\s+pipeline\b/i,
      /close\s+(?:more\s+)?deals?\b/i,
      /(?:lead|prospect)\s+generation\b/i,
      /move\s+(?:leads?|deals?)\s+through\b/i,
      /outbound\s+(?:sales|outreach)\b/i,
      /client\s+acquisition\b/i,
    ],
    med: [
      /\bsales\s+(?:process|funnel)\b/i,
      /\b(?:leads?|prospects?|deals?)\b/i,
    ],
  },

  "inbox-send": {
    high: [
      /\bsends?\s+(?:personalized\s+)?emails?\b/i,
      /\bsending\s+(?:personalized\s+)?emails?\b/i,
      /personalized\s+(?:emails?|messages?)\s+(?:to|at\s+scale|automatically)\b/i,
      /cold\s+(?:email|outreach)\b/i,
      /(?:email|outreach)\s+campaign\b/i,
      /dms?\s+(?:to\s+)?(?:leads?|prospects?|them)\b/i,
    ],
    med: [
      /\bcold\s+email\b/i,
      /\boutreach\b/i,
      /\bsend(?:s|ing)?\s+(?:emails?|dms?|messages?)\b/i,
    ],
  },

  "dashboard": {
    high: [
      /(?:track|monitor|measure)\s+(?:your\s+)?(?:performance|results?|metrics?|roi)\b/i,
      /(?:analytics?|dashboard)\s+(?:shows?|tells?|gives?|tracks?)\b/i,
      /real.?time\s+(?:data|analytics?|insights?)\b/i,
      /see\s+(?:all\s+)?(?:your\s+)?(?:data|metrics?|results?|stats?)\b/i,
    ],
    med: [
      /\b(?:analytics?|dashboard|reporting|kpis?)\b/i,
      /\btrack(?:ing)?\s+(?:your\s+)?(?:results?|metrics?|performance)\b/i,
    ],
  },

  "code-terminal": {
    high: [
      /\bapi\s+(?:integration|key|call|endpoint)\b/i,
      /(?:code|script)\s+(?:that|to|which)\s+(?:automatically|runs?)\b/i,
      /(?:integrate|deploy|build)\s+(?:it|with|using|into)\b/i,
      /technical\s+(?:solution|setup|implementation)\b/i,
    ],
    med: [
      /\b(?:api|webhook|sdk|cli)\b/i,
      /\b(?:developer|technical|integrate)\b/i,
    ],
  },
};

// How long each illustration stays on screen (ms)
const ILLUSTRATION_DURATION: Record<IllustrationType, number> = {
  "crm-calendar":   6000,
  "social-feed":    6000,
  "ai-workflow":    6000,
  "stat-counter":   6000,
  "pipeline-board": 6000,
  "inbox-send":     6000,
  "dashboard":      6000,
  "code-terminal":  6000,
};

const MIN_SPACING_MS = 7500;
const MIN_SCORE = 2;

function scoreText(text: string): Array<{ type: IllustrationType; score: number }> {
  return (
    Object.entries(CONCEPT_PATTERNS) as Array<
      [IllustrationType, { high: RegExp[]; med: RegExp[] }]
    >
  )
    .map(([type, { high, med }]) => {
      let score = 0;
      for (const p of high) if (p.test(text)) score += 3;
      for (const p of med) if (p.test(text)) score += 1;
      return { type, score };
    })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
}

function extractStatData(text: string): Record<string, string> {
  // "50 percent faster", "50% improvement"
  const pctMatch = text.match(/(\d[\d,]*\.?\d*)\s*(?:percent|%)/i);
  if (pctMatch) {
    const after = text
      .substring(text.indexOf(pctMatch[0]) + pctMatch[0].length)
      .replace(/[.,!?].*/, "")
      .trim()
      .substring(0, 24);
    return { value: pctMatch[1].replace(/,/g, ""), suffix: "%", label: after || "improvement" };
  }

  // "$12k revenue", "$1.5 million"
  const dollarMatch = text.match(/\$\s*(\d[\d,.]*)\s*(k|m|b|million|billion)?\b/i);
  if (dollarMatch) {
    const mult: Record<string, string> = { k: "K", m: "M", b: "B", million: "M", billion: "B" };
    const n = dollarMatch[1].replace(/,/g, "");
    const suffix = dollarMatch[2] ? (mult[dollarMatch[2].toLowerCase()] ?? "") : "";
    return { value: n, suffix, label: "revenue" };
  }

  // "save 5 hours", "47 clients", "200 businesses"
  const unitMatch = text.match(
    /(\d[\d,]*)\s+(hours?|days?|clients?|customers?|users?|leads?|meetings?|partners?|companies?)\b/i
  );
  if (unitMatch) {
    return {
      value: unitMatch[1].replace(/,/g, ""),
      suffix: "",
      label: unitMatch[2].replace(/s$/, ""),
    };
  }

  // Generic large number
  const numMatch = text.match(/(\d[\d,]+)\b/);
  if (numMatch) {
    return { value: numMatch[1].replace(/,/g, ""), suffix: "+", label: "results" };
  }

  return { value: "100", suffix: "+", label: "results" };
}

export function extractConceptIllustrations(
  segments: TranscriptSegment[],
  durationMs: number
): ConceptIllustration[] {
  const results: ConceptIllustration[] = [];
  let lastPlacedMs = -MIN_SPACING_MS;
  let alternator = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const startMs = Math.round(seg.start * 1000);

    // Skip first 2s (hook territory) and last 4s (CTA territory)
    if (startMs < 2000) continue;
    if (startMs > durationMs - 4000) continue;

    // Enforce minimum spacing
    if (startMs - lastPlacedMs < MIN_SPACING_MS) continue;

    // Context window: current + next segment for better phrase detection
    const nextSeg = segments[i + 1];
    const contextText = nextSeg ? seg.text + " " + nextSeg.text : seg.text;

    const scores = scoreText(contextText);
    if (scores.length === 0) continue;

    const best = scores[0];
    const illDuration = ILLUSTRATION_DURATION[best.type];
    const startWithDelay = startMs + 200; // slight offset after word is spoken

    const data = best.type === "stat-counter" ? extractStatData(contextText) : {};

    results.push({
      type: best.type,
      startMs: startWithDelay,
      endMs: startWithDelay + illDuration,
      data,
      position: alternator % 2 === 0 ? "top-right" : "top-left",
    });

    lastPlacedMs = startWithDelay + illDuration;
    alternator++;
  }

  return results;
}
