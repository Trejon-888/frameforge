/**
 * Transcript Intelligence — Perception Layer for Agentic Video Editing
 *
 * Takes a raw AgentTranscript and enriches it with structured intelligence
 * that AI agents need to make great creative editing decisions.
 *
 * All computation is pure — no external dependencies, no I/O.
 */

import { type AgentTranscript } from "./edit-agent.js";

// ============================================================
// Exported Types
// ============================================================

export interface PausePoint {
  startMs: number;
  endMs: number;
  durationMs: number;
  /** breath <600ms, beat 600–1500ms, transition >1500ms */
  type: "breath" | "beat" | "transition";
}

export interface EnergyPoint {
  timeMs: number;
  wordsPerSecond: number;
  isHigh: boolean; // > 3.5 wps
  isLow: boolean;  // < 1.5 wps
}

export interface DetectedStat {
  /** e.g. "$4B", "50+", "23%" */
  value: string;
  /** surrounding phrase text */
  rawText: string;
  startMs: number;
  endMs: number;
  phraseIndex: number;
}

export interface EmphasisMoment {
  text: string;
  startMs: number;
  endMs: number;
  reason: "number" | "all-caps" | "repetition" | "short-phrase" | "pause-before";
  /** 1–3, higher = stronger emphasis signal */
  weight: number;
}

export interface NarrativeSegment {
  type: "hook" | "setup" | "proof" | "climax" | "cta" | "outro";
  startMs: number;
  endMs: number;
  startPhrase: number;
  endPhrase: number;
  /** first phrase text of this segment */
  summary: string;
  energyProfile: "rising" | "falling" | "sustained" | "spike";
}

export interface ZoneRecommendation {
  // Portrait 1080×1920
  /** 0–15% — ambient, watermarks */
  hookZone: { top: number; bottom: number };
  /** 15–45% — big statements */
  headlineZone: { top: number; bottom: number };
  /** 40–75% — avoid overlapping face */
  speakerZone: { top: number; bottom: number };
  /** 30–65% — hero numbers */
  statZone: { top: number; bottom: number };
  /** 72–88% — identity, captions */
  lowerThirdZone: { top: number; bottom: number };
  /** 88–100% — RESERVED for captions */
  captionZone: { top: number; bottom: number };
}

export interface TranscriptIntelligence {
  // Original transcript data preserved
  durationSec: number;
  width: number;
  height: number;
  orientation: string;
  phrases: AgentTranscript["phrases"];
  words: AgentTranscript["words"];

  // === INTELLIGENCE LAYER ===

  /** Detected pauses — use for overlay entry/exit timing */
  pauses: PausePoint[];

  /** Speech energy over time — use for pacing decisions */
  energyCurve: EnergyPoint[];

  /** Numbers, percentages, dollar amounts, quantities */
  stats: DetectedStat[];

  /** High-emphasis moments — candidates for kinetic text overlays */
  emphasis: EmphasisMoment[];

  /** Auto-detected narrative structure */
  narrative: NarrativeSegment[];

  /** Recommended overlay zones for this video's dimensions */
  zones: ZoneRecommendation;

  /** Best ms timestamps for overlay entry (pause-aligned, breathing room enforced) */
  suggestedEntryPoints: number[];

  /** Total word count and speaking rate stats */
  speechStats: {
    totalWords: number;
    avgWordsPerSecond: number;
    peakWordsPerSecond: number;
    totalPauseDurationMs: number;
    pausePercentage: number;
  };
}

// ============================================================
// Pause Detection
// ============================================================

function detectPauses(transcript: AgentTranscript): PausePoint[] {
  const pauses: PausePoint[] = [];
  const { words, phrases } = transcript;

  // Word-level gap analysis
  for (let i = 0; i < words.length - 1; i++) {
    const gap = words[i + 1].startMs - words[i].endMs;
    if (gap >= 400) {
      pauses.push({
        startMs: words[i].endMs,
        endMs: words[i + 1].startMs,
        durationMs: gap,
        type: gap > 1500 ? "transition" : gap > 600 ? "beat" : "breath",
      });
    }
  }

  // Phrase boundary gaps (deduplicate — only add if not already covered by word-level)
  for (let i = 0; i < phrases.length - 1; i++) {
    const gap = phrases[i + 1].startMs - phrases[i].endMs;
    if (gap >= 400) {
      const alreadyCovered = pauses.some(
        (p) =>
          Math.abs(p.startMs - phrases[i].endMs) < 100 &&
          Math.abs(p.endMs - phrases[i + 1].startMs) < 100
      );
      if (!alreadyCovered) {
        pauses.push({
          startMs: phrases[i].endMs,
          endMs: phrases[i + 1].startMs,
          durationMs: gap,
          type: gap > 1500 ? "transition" : gap > 600 ? "beat" : "breath",
        });
      }
    }
  }

  return pauses.sort((a, b) => a.startMs - b.startMs);
}

// ============================================================
// Energy Curve
// ============================================================

function buildEnergyCurve(transcript: AgentTranscript): EnergyPoint[] {
  const { words, durationSec } = transcript;
  const durationMs = durationSec * 1000;
  const windowMs = 3000;
  const stepMs = 500;
  const curve: EnergyPoint[] = [];

  for (let t = 0; t < durationMs; t += stepMs) {
    const windowStart = t;
    const windowEnd = t + windowMs;
    const windowWords = words.filter(
      (w) => w.startMs >= windowStart && w.startMs < windowEnd
    );
    const wps = windowWords.length / (windowMs / 1000);
    curve.push({
      timeMs: t,
      wordsPerSecond: Math.round(wps * 100) / 100,
      isHigh: wps > 3.5,
      isLow: wps < 1.5,
    });
  }

  return curve;
}

// ============================================================
// Stat Detection
// ============================================================

const STAT_PATTERNS: RegExp[] = [
  // Dollar amounts: $4B, $47K, $1.2M, $500, $1,000
  /\$[\d,.]+[BKMGT]?/gi,
  // Percentages: 23%, 300%
  /\d+(?:\.\d+)?%/g,
  // Multipliers: 10x, 5X
  /\d+[xX]/g,
  // Large round numbers with optional suffix: 50+, 1000, 10k
  /\b\d{2,}[+]?\b/g,
  // Numbers with K/M/B suffix: 50K, 1.2M, 4B
  /\b\d+(?:\.\d+)?[BKMG]\b/gi,
];

function detectStats(transcript: AgentTranscript): DetectedStat[] {
  const { phrases, words } = transcript;
  const stats: DetectedStat[] = [];
  const seen = new Set<string>();

  for (let pi = 0; pi < phrases.length; pi++) {
    const phrase = phrases[pi];
    const text = phrase.text;

    for (const pattern of STAT_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const value = match[0];
        const key = `${pi}:${value}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Find timing range by locating the matched word(s) in the word list
        // that fall within this phrase's time range
        const phraseWords = words.filter(
          (w) => w.startMs >= phrase.startMs && w.endMs <= phrase.endMs + 50
        );

        let matchStartMs = phrase.startMs;
        let matchEndMs = phrase.endMs;

        // Try to narrow down to the specific word containing the stat
        for (const w of phraseWords) {
          const normalised = w.word.replace(/[^a-zA-Z0-9$%.+xXBKMG]/g, "");
          if (value.replace(/[^a-zA-Z0-9$%.+xXBKMG]/g, "").toLowerCase() === normalised.toLowerCase()) {
            matchStartMs = w.startMs;
            matchEndMs = w.endMs;
            break;
          }
        }

        stats.push({
          value,
          rawText: text,
          startMs: matchStartMs,
          endMs: matchEndMs,
          phraseIndex: pi,
        });
      }
    }
  }

  return stats.sort((a, b) => a.startMs - b.startMs);
}

// ============================================================
// Emphasis Detection
// ============================================================

function detectEmphasis(
  transcript: AgentTranscript,
  pauses: PausePoint[],
  stats: DetectedStat[]
): EmphasisMoment[] {
  const { phrases } = transcript;
  const moments: EmphasisMoment[] = [];

  const statPhraseIndexes = new Set(stats.map((s) => s.phraseIndex));

  // Build word frequency map within 5-second windows for repetition detection
  const wordFreqInWindow = (phraseIndex: number, word: string): number => {
    const phrase = phrases[phraseIndex];
    const windowStart = phrase.startMs - 5000;
    const windowEnd = phrase.startMs;
    let count = 0;
    for (let i = 0; i < phraseIndex; i++) {
      const p = phrases[i];
      if (p.endMs < windowStart) continue;
      if (p.startMs > windowEnd) break;
      const pWords = p.text.toLowerCase().split(/\s+/);
      count += pWords.filter((w) => w === word.toLowerCase()).length;
    }
    return count;
  };

  const pauseBefore = (phraseStartMs: number, minGapMs: number): boolean => {
    return pauses.some(
      (p) => p.endMs <= phraseStartMs && phraseStartMs - p.endMs < 200 && p.durationMs >= minGapMs
    );
  };

  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i];
    const words = phrase.text.trim().split(/\s+/);
    const wordCount = words.length;

    const addMoment = (
      reason: EmphasisMoment["reason"],
      weight: number
    ) => {
      moments.push({
        text: phrase.text,
        startMs: phrase.startMs,
        endMs: phrase.endMs,
        reason,
        weight,
      });
    };

    // Weight 3: stat phrase + pause before it
    if (statPhraseIndexes.has(i) && pauseBefore(phrase.startMs, 600)) {
      addMoment("number", 3);
      continue; // strongest signal, no need to stack
    }

    // Weight 3: short phrase (< 5 words) that looks like a complete sentence
    if (wordCount < 5 && /[.!?]$/.test(phrase.text.trim())) {
      addMoment("short-phrase", 3);
      continue;
    }

    // Weight 2: preceded by a pause > 800ms
    if (pauseBefore(phrase.startMs, 800)) {
      addMoment("pause-before", 2);
    }

    // Weight 2: repeated word within 5 seconds
    const phraseWordList = phrase.text.toLowerCase().split(/\s+/);
    for (const w of phraseWordList) {
      if (w.length < 4) continue; // skip small words
      if (wordFreqInWindow(i, w) > 0) {
        addMoment("repetition", 2);
        break;
      }
    }

    // Weight 1: ALL CAPS word present (length > 2 to filter "I", "A")
    const hasAllCaps = words.some((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
    if (hasAllCaps) {
      addMoment("all-caps", 1);
    }

    // Weight 1: first phrase of the video (hook)
    if (i === 0) {
      addMoment("pause-before", 1); // treat hook as noteworthy
    }
  }

  return moments.sort((a, b) => a.startMs - b.startMs);
}

// ============================================================
// Narrative Segmentation
// ============================================================

const CTA_KEYWORDS = [
  "follow", "subscribe", "link", "click", "book", "comment", "dm", "message",
  "sign up", "sign-up", "register", "join", "visit", "check out", "drop",
  "tap", "swipe", "reach out",
];

const PROOF_KEYWORDS = [
  "clients", "customers", "agencies", "results", "revenue", "users",
  "members", "team", "portfolio", "case", "study", "proof", "reviews",
  "testimonial", "feedback", "ratings", "awards", "certified",
];

function detectNarrative(
  transcript: AgentTranscript,
  energyCurve: EnergyPoint[],
  stats: DetectedStat[]
): NarrativeSegment[] {
  const { phrases, durationSec } = transcript;
  if (phrases.length === 0) return [];

  const durationMs = durationSec * 1000;
  const segments: NarrativeSegment[] = [];
  const statPhraseIndexes = new Set(stats.map((s) => s.phraseIndex));

  // --- Label each phrase ---
  type PhraseLabel = "hook" | "cta" | "proof" | "climax" | "setup";
  const labels: PhraseLabel[] = phrases.map((p, i) => {
    const relPos = p.startMs / durationMs;
    const text = p.text.toLowerCase();

    if (relPos <= 0.10) return "hook";

    const isCTA = CTA_KEYWORDS.some((kw) => text.includes(kw));
    if (isCTA && relPos >= 0.80) return "cta";

    const isProof =
      PROOF_KEYWORDS.some((kw) => text.includes(kw)) || statPhraseIndexes.has(i);
    if (isProof) return "proof";

    return "setup";
  });

  // Mark climax: highest energy segment in the middle third
  const middleStart = durationMs * 0.33;
  const middleEnd = durationMs * 0.67;
  let peakEnergy = -1;
  let peakPhraseIndex = -1;
  for (let i = 0; i < phrases.length; i++) {
    if (phrases[i].startMs < middleStart || phrases[i].startMs > middleEnd) continue;
    if (labels[i] === "proof" || labels[i] === "cta") continue;
    const phraseMidMs = (phrases[i].startMs + phrases[i].endMs) / 2;
    const closestEnergy = energyCurve.reduce((best, ep) =>
      Math.abs(ep.timeMs - phraseMidMs) < Math.abs(best.timeMs - phraseMidMs) ? ep : best
    );
    if (closestEnergy.wordsPerSecond > peakEnergy) {
      peakEnergy = closestEnergy.wordsPerSecond;
      peakPhraseIndex = i;
    }
  }
  if (peakPhraseIndex !== -1) {
    labels[peakPhraseIndex] = "climax";
  }

  // --- Group consecutive same-label phrases into segments ---
  const groupedLabels: Array<{ label: PhraseLabel; start: number; end: number }> = [];
  let runLabel = labels[0];
  let runStart = 0;

  for (let i = 1; i <= labels.length; i++) {
    const label = labels[i];
    if (label !== runLabel || i === labels.length) {
      groupedLabels.push({ label: runLabel, start: runStart, end: i - 1 });
      runLabel = label!;
      runStart = i;
    }
  }

  // --- Check for outro: last segment if not CTA and last 5–8% of video ---
  const lastGroup = groupedLabels[groupedLabels.length - 1];
  if (lastGroup && lastGroup.label !== "cta") {
    const lastPhraseStartRel = phrases[lastGroup.start].startMs / durationMs;
    if (lastPhraseStartRel >= 0.92) {
      lastGroup.label = "outro" as any;
    }
  }

  // --- Compute energy profile for each segment ---
  const computeEnergyProfile = (
    startMs: number,
    endMs: number
  ): NarrativeSegment["energyProfile"] => {
    const pts = energyCurve.filter((e) => e.timeMs >= startMs && e.timeMs <= endMs);
    if (pts.length < 2) return "sustained";

    const firstHalf = pts.slice(0, Math.floor(pts.length / 2));
    const secondHalf = pts.slice(Math.floor(pts.length / 2));
    const avgFirst = firstHalf.reduce((s, e) => s + e.wordsPerSecond, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, e) => s + e.wordsPerSecond, 0) / secondHalf.length;

    const maxPt = pts.reduce((m, e) => (e.wordsPerSecond > m.wordsPerSecond ? e : m));
    const avgAll = pts.reduce((s, e) => s + e.wordsPerSecond, 0) / pts.length;

    if (maxPt.wordsPerSecond > avgAll * 1.6) return "spike";
    if (avgSecond > avgFirst * 1.15) return "rising";
    if (avgFirst > avgSecond * 1.15) return "falling";
    return "sustained";
  };

  for (const g of groupedLabels) {
    const startPhrase = phrases[g.start];
    const endPhrase = phrases[g.end];
    segments.push({
      type: (g.label as any) === "outro" ? "outro" : g.label,
      startMs: startPhrase.startMs,
      endMs: endPhrase.endMs,
      startPhrase: g.start,
      endPhrase: g.end,
      summary: startPhrase.text,
      energyProfile: computeEnergyProfile(startPhrase.startMs, endPhrase.endMs),
    });
  }

  return segments;
}

// ============================================================
// Zone Calculation
// ============================================================

function calculateZones(width: number, height: number): ZoneRecommendation {
  const isPortrait = height >= width;

  if (isPortrait) {
    return {
      hookZone:       { top: 0,                  bottom: Math.round(height * 0.15) },
      headlineZone:   { top: Math.round(height * 0.15), bottom: Math.round(height * 0.45) },
      speakerZone:    { top: Math.round(height * 0.40), bottom: Math.round(height * 0.75) },
      statZone:       { top: Math.round(height * 0.30), bottom: Math.round(height * 0.65) },
      lowerThirdZone: { top: Math.round(height * 0.72), bottom: Math.round(height * 0.88) },
      captionZone:    { top: Math.round(height * 0.88), bottom: height },
    };
  }

  // Landscape — proportionally adjusted
  return {
    hookZone:       { top: 0,                  bottom: Math.round(height * 0.12) },
    headlineZone:   { top: Math.round(height * 0.08), bottom: Math.round(height * 0.35) },
    speakerZone:    { top: Math.round(height * 0.10), bottom: Math.round(height * 0.90) },
    statZone:       { top: Math.round(height * 0.25), bottom: Math.round(height * 0.75) },
    lowerThirdZone: { top: Math.round(height * 0.72), bottom: Math.round(height * 0.90) },
    captionZone:    { top: Math.round(height * 0.88), bottom: height },
  };
}

// ============================================================
// Suggested Entry Points
// ============================================================

function buildSuggestedEntryPoints(
  pauses: PausePoint[],
  narrative: NarrativeSegment[],
  durationMs: number
): number[] {
  const MIN_GAP_MS = 5000;
  const candidates: Array<{ timeMs: number; score: number }> = [];

  // Pause-aligned candidates (only significant pauses — beat or transition)
  for (const pause of pauses) {
    if (pause.durationMs >= 600) {
      // Entry at the END of the pause (after the breath)
      candidates.push({
        timeMs: pause.endMs,
        score: pause.type === "transition" ? 3 : 2,
      });
    }
  }

  // Narrative segment starts
  for (const seg of narrative) {
    candidates.push({
      timeMs: seg.startMs,
      score: ["hook", "climax", "cta"].includes(seg.type) ? 3 : 1,
    });
  }

  // Sort by time
  candidates.sort((a, b) => a.timeMs - b.timeMs);

  // Enforce minimum 5000ms gap between selected entry points
  const selected: number[] = [];
  let lastSelected = -MIN_GAP_MS;

  // Sort by score desc within valid spacing
  const scored = [...candidates].sort((a, b) => b.score - a.score);

  for (const c of scored) {
    if (c.timeMs < 0 || c.timeMs >= durationMs) continue;
    const tooClose = selected.some((s) => Math.abs(s - c.timeMs) < MIN_GAP_MS);
    if (tooClose) continue;
    selected.push(c.timeMs);
    lastSelected = c.timeMs;
    if (selected.length >= 12) break;
  }
  void lastSelected; // suppress unused variable warning

  return selected.sort((a, b) => a - b).slice(0, 12);
}

// ============================================================
// Speech Stats
// ============================================================

function computeSpeechStats(
  transcript: AgentTranscript,
  pauses: PausePoint[],
  energyCurve: EnergyPoint[]
): TranscriptIntelligence["speechStats"] {
  const totalWords = transcript.words.length;
  const durationMs = transcript.durationSec * 1000;

  const avgWordsPerSecond =
    durationMs > 0
      ? Math.round((totalWords / (durationMs / 1000)) * 100) / 100
      : 0;

  const peakWordsPerSecond =
    energyCurve.length > 0
      ? Math.max(...energyCurve.map((e) => e.wordsPerSecond))
      : 0;

  const totalPauseDurationMs = pauses.reduce((sum, p) => sum + p.durationMs, 0);

  const pausePercentage =
    durationMs > 0
      ? Math.round((totalPauseDurationMs / durationMs) * 1000) / 10
      : 0;

  return {
    totalWords,
    avgWordsPerSecond,
    peakWordsPerSecond: Math.round(peakWordsPerSecond * 100) / 100,
    totalPauseDurationMs,
    pausePercentage,
  };
}

// ============================================================
// Main Export
// ============================================================

/**
 * Analyze a raw AgentTranscript and return enriched intelligence
 * ready for AI agent consumption.
 */
export function analyzeTranscript(transcript: AgentTranscript): TranscriptIntelligence {
  const pauses = detectPauses(transcript);
  const energyCurve = buildEnergyCurve(transcript);
  const stats = detectStats(transcript);
  const emphasis = detectEmphasis(transcript, pauses, stats);
  const narrative = detectNarrative(transcript, energyCurve, stats);
  const zones = calculateZones(transcript.width, transcript.height);
  const durationMs = transcript.durationSec * 1000;
  const suggestedEntryPoints = buildSuggestedEntryPoints(pauses, narrative, durationMs);
  const speechStats = computeSpeechStats(transcript, pauses, energyCurve);

  return {
    // Preserve original transcript data
    durationSec: transcript.durationSec,
    width: transcript.width,
    height: transcript.height,
    orientation: transcript.orientation,
    phrases: transcript.phrases,
    words: transcript.words,

    // Intelligence layer
    pauses,
    energyCurve,
    stats,
    emphasis,
    narrative,
    zones,
    suggestedEntryPoints,
    speechStats,
  };
}

// ============================================================
// Agent Prompt Formatter
// ============================================================

/**
 * Returns a markdown-formatted string summarising the key intelligence.
 * Prepend this to agent prompts to give the model a concise structural briefing.
 * Kept to ~40 lines for token efficiency.
 */
export function formatIntelligenceForAgent(intel: TranscriptIntelligence): string {
  const { speechStats, stats, emphasis, narrative, suggestedEntryPoints, pauses } = intel;

  const durMin = Math.floor(intel.durationSec / 60);
  const durSec = Math.round(intel.durationSec % 60);
  const durationStr = durMin > 0 ? `${durMin}m ${durSec}s` : `${durSec}s`;

  const lines: string[] = [];

  lines.push(`## Transcript Intelligence Brief`);
  lines.push(``);
  lines.push(`**Video:** ${intel.width}×${intel.height} ${intel.orientation} · ${durationStr}`);
  lines.push(`**Speech:** ${speechStats.totalWords} words · ${speechStats.avgWordsPerSecond} wps avg · ${speechStats.peakWordsPerSecond} wps peak · ${speechStats.pausePercentage}% pause`);
  lines.push(``);

  // Stats
  if (stats.length > 0) {
    const uniqueStats = [...new Set(stats.map((s) => s.value))].slice(0, 8);
    lines.push(`**Detected Stats (${stats.length}):** ${uniqueStats.join(", ")}`);
  } else {
    lines.push(`**Detected Stats:** none`);
  }
  lines.push(``);

  // Emphasis moments
  const topEmphasis = [...emphasis]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
  if (topEmphasis.length > 0) {
    lines.push(`**Top Emphasis Moments:**`);
    for (const e of topEmphasis) {
      const t = (e.startMs / 1000).toFixed(1);
      lines.push(`- [${t}s] weight:${e.weight} (${e.reason}) — "${e.text.slice(0, 60)}${e.text.length > 60 ? "…" : ""}"`);
    }
  } else {
    lines.push(`**Top Emphasis Moments:** none detected`);
  }
  lines.push(``);

  // Narrative
  if (narrative.length > 0) {
    lines.push(`**Narrative Structure:**`);
    for (const seg of narrative) {
      const start = (seg.startMs / 1000).toFixed(1);
      const end = (seg.endMs / 1000).toFixed(1);
      lines.push(`- [${start}s–${end}s] **${seg.type}** (${seg.energyProfile}) — "${seg.summary.slice(0, 50)}${seg.summary.length > 50 ? "…" : ""}"`);
    }
  }
  lines.push(``);

  // Pauses summary
  const beats = pauses.filter((p) => p.type === "beat" || p.type === "transition");
  lines.push(`**Significant Pauses (≥600ms):** ${beats.length} — ideal for overlay entry/exit`);
  lines.push(``);

  // Suggested entry points
  if (suggestedEntryPoints.length > 0) {
    const pts = suggestedEntryPoints.map((ms) => `${(ms / 1000).toFixed(1)}s`).join(", ");
    lines.push(`**Suggested Entry Points (${suggestedEntryPoints.length}):** ${pts}`);
  }
  lines.push(``);
  lines.push(`> Use suggestedEntryPoints for startMs values. Avoid speakerZone for text overlays.`);

  return lines.join("\n");
}
