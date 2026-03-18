/**
 * Edit Agent Contract — Types and Utilities
 *
 * FrameForge does NOT call any AI API. Instead, it defines a contract
 * that any AI agent (Claude, GPT, Gemini, Codex, local models) can fulfill.
 *
 * Workflow:
 *   1. frameforge extract-transcript video.mp4 -o transcript.json
 *   2. Agent reads transcript.json + EDIT-AGENT-CONTRACT.md
 *   3. Agent writes overlay-decisions.json
 *   4. frameforge edit video.mp4 --overlays overlay-decisions.json -o output.mp4
 *
 * The agent can be any model. FrameForge is model-agnostic.
 * See .agents/EDIT-AGENT-CONTRACT.md for the full agent specification.
 */

import { type WordTiming } from "./word-captions.js";

// ============================================================
// The Contract — what any AI agent must produce
// ============================================================

/**
 * A single overlay decision from an AI agent.
 *
 * The agent writes these. FrameForge renders them.
 * See EDIT-AGENT-CONTRACT.md for full specification and examples.
 */
export interface AgentOverlayDecision {
  /** When to show (milliseconds from video start) */
  startMs: number;
  /** How long to show (typically 4000–8000ms) */
  durationMs: number;
  /**
   * Editorial label — used for debugging and logging only.
   * Examples: "hook", "stat", "cta", "lower-third", "social-proof"
   */
  type: string;
  /** Why the agent chose this moment — editorial rationale */
  rationale: string;
  /**
   * CSS styles for this overlay instance.
   * Use `.cls-__ID__-*` naming — __ID__ is replaced with a unique instance ID.
   * The root container is already `position:fixed; top:0; left:0; width:100%; height:100%`.
   */
  css: string;
  /**
   * Inner HTML markup.
   * The root el is already a fixed full-canvas div.
   * Use `cls-__ID__-*` classes. Use `__ID__` as an id prefix if needed.
   */
  html: string;
  /**
   * GSAP animation init code. `el` is the root container (already in DOM).
   * REQUIRED: must set `el._tl = gsap.timeline({ paused: true })`
   * The system calls `el._tl.time(localT / 1000)` every frame.
   * Use `__ID__` in querySelector calls.
   */
  initJs: string;
}

// ============================================================
// Transcript — what the agent receives
// ============================================================

/** A timestamped phrase in the transcript (agent-readable format) */
export interface TranscriptPhrase {
  /** Start time in seconds */
  startSec: number;
  /** End time in seconds */
  endSec: number;
  /** Start time in milliseconds (for use in startMs fields) */
  startMs: number;
  /** End time in milliseconds */
  endMs: number;
  /** The spoken text */
  text: string;
}

/** Full transcript as provided to an AI agent */
export interface AgentTranscript {
  /** Total video duration in seconds */
  durationSec: number;
  /** Output canvas dimensions */
  width: number;
  height: number;
  /** "portrait" (9:16) or "landscape" (16:9) */
  orientation: "portrait" | "landscape";
  /** Timestamped phrases grouped by natural pauses and sentence boundaries */
  phrases: TranscriptPhrase[];
  /** Raw word-level timings (for precise millisecond targeting) */
  words: Array<{ word: string; startMs: number; endMs: number; confidence: number }>;
}

// ============================================================
// Transcript Extraction — utility for agents
// ============================================================

/**
 * Convert word-level timings to the AgentTranscript format.
 * Agents receive this JSON and use it to make editorial decisions.
 */
export function buildAgentTranscript(
  words: WordTiming[],
  durationSec: number,
  width: number,
  height: number
): AgentTranscript {
  const orientation = height > width ? "portrait" : "landscape";

  // Group words into natural phrases
  const phrases: TranscriptPhrase[] = [];
  let current: WordTiming[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const next = words[i + 1];
    current.push(w);

    const isLast = !next;
    const longGap = next && next.start - w.end > 0.6;
    const sentenceEnd = /[.!?,;]$/.test(w.word.trim());

    if ((isLast || longGap || sentenceEnd) && current.length > 0) {
      const startMs = Math.round(current[0].start * 1000);
      const endMs = Math.round(current[current.length - 1].end * 1000);
      phrases.push({
        startSec: current[0].start,
        endSec: current[current.length - 1].end,
        startMs,
        endMs,
        text: current.map((w) => w.word).join(" "),
      });
      current = [];
    }
  }

  return {
    durationSec,
    width,
    height,
    orientation,
    phrases,
    words: words.map((w) => ({
      word: w.word,
      startMs: Math.round(w.start * 1000),
      endMs: Math.round(w.end * 1000),
      confidence: w.confidence,
    })),
  };
}

// ============================================================
// Validation — load and validate agent output
// ============================================================

/**
 * Load and validate overlay decisions from a JSON file.
 * Clamps timing values and filters invalid entries with warnings.
 */
export function validateOverlayDecisions(
  raw: unknown,
  durationMs: number
): AgentOverlayDecision[] {
  if (!Array.isArray(raw)) {
    throw new Error("Overlay decisions must be a JSON array");
  }

  const valid: AgentOverlayDecision[] = [];

  for (let i = 0; i < raw.length; i++) {
    const d = raw[i] as any;

    const missing: string[] = [];
    if (typeof d.startMs !== "number") missing.push("startMs");
    if (typeof d.durationMs !== "number") missing.push("durationMs");
    if (typeof d.html !== "string") missing.push("html");
    if (typeof d.css !== "string") missing.push("css");
    if (typeof d.initJs !== "string") missing.push("initJs");

    if (missing.length > 0) {
      console.warn(`[FrameForge] Skipping overlay[${i}]: missing fields: ${missing.join(", ")}`);
      continue;
    }

    const startMs = Math.max(0, Math.round(d.startMs));
    const durationMsVal = Math.max(1000, Math.min(30000, Math.round(d.durationMs)));

    if (startMs >= durationMs) {
      console.warn(`[FrameForge] Skipping overlay[${i}]: startMs ${startMs} >= video duration ${durationMs}`);
      continue;
    }

    valid.push({
      startMs,
      durationMs: durationMsVal,
      type: typeof d.type === "string" ? d.type : "overlay",
      rationale: typeof d.rationale === "string" ? d.rationale : "",
      css: d.css,
      html: d.html,
      initJs: d.initJs,
    });
  }

  return valid;
}
