/**
 * Video Editor — Main Orchestrator
 *
 * ARCHITECTURE (v2 — fixed):
 * 1. Probe source video with ffprobe
 * 2. Transcribe with WhisperX (word-level timestamps)
 * 3. Analyze transcript → generate overlay timeline
 * 4. Generate overlay-only HTML (transparent background, NO video element)
 * 5. Render overlay as transparent PNG frames via Puppeteer
 * 6. Use FFmpeg's overlay filter to composite transparent frames ON TOP of source video
 * 7. FFmpeg handles source video natively (smooth, frame-accurate playback)
 *
 * KEY INSIGHT: The source video NEVER touches the browser. FFmpeg decodes it
 * natively, which gives us smooth playback. Only the overlay/captions are
 * rendered in the browser as transparent frames.
 */

import { resolve, join } from "node:path";
import { readFile, writeFile, mkdir, rm, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";

import { probeVideo, computeMatchedEncoding, getFormatDimensions, type VideoProbeResult } from "./video-probe.js";
import { parseWhisperXWords, groupWords, generateCaptionOverlay, type WordTiming, type CaptionStyleConfig, type CaptionPreset } from "./word-captions.js";
import { getStylePreset, createCustomStyle, type EditStyle } from "./edit-styles.js";
import { generateOverlayTimeline, type TranscriptSegment } from "./overlay-generator.js";
import { captureFrames } from "./frame-capture.js";
import { compositeVideo } from "./ffmpeg.js";
import "./components/init.js";
import { assembleOverlayPage, assembleAgentOverlayPage } from "./components/assembler.js";
import { type ComponentDependency } from "./components/types.js";
import { validateOverlayDecisions, buildAgentTranscript, type AgentOverlayDecision } from "./edit-agent.js";

const execFileAsync = promisify(execFile);

// === Encoding speed presets ===

const ENCODING_SPEED_PRESETS = {
  fast:     { preset: "ultrafast", crfOffset: 4 },   // Preview — fast encode, larger file
  balanced: { preset: "medium",    crfOffset: 0 },   // Default — good balance
  slow:     { preset: "slow",      crfOffset: -2 },   // Final output — best quality
  lossless: { preset: "medium",    crfOffset: -18 },  // Archival — near-lossless
} as const;

// === Types ===

export interface EditOptions {
  /** Path to source video file */
  input: string;
  /** Output file path */
  output: string;
  /** Style preset name (default: "neo-brutalist") */
  style?: string;
  /** Custom brand color (overrides preset primary) */
  brandColor?: string;
  /** Caption animation style (default: "pop-in") */
  captionPreset?: CaptionPreset;
  /** Output format */
  format?: "landscape" | "vertical" | "square" | "source";
  /** Encoding speed (default: "balanced") */
  encodingSpeed?: "fast" | "balanced" | "slow" | "lossless";
  /** Path to existing SRT file (skip transcription) */
  srtPath?: string;
  /** Path to existing WhisperX word-level JSON (skip transcription) */
  wordTimingsPath?: string;
  /** Speaker name for lower third */
  speakerName?: string;
  /** Speaker title for lower third */
  speakerTitle?: string;
  /** Max words per caption group (default: 4) */
  maxWordsPerGroup?: number;
  /** Caption position */
  captionPosition?: "bottom" | "center" | "top";
  /** Skip overlay generation (captions only) */
  captionsOnly?: boolean;
  /** Progress callback */
  onProgress?: (stage: string, detail: string) => void;
}

export interface EditResult {
  outputPath: string;
  probe: VideoProbeResult;
  wordCount: number;
  captionGroupCount: number;
  overlayCount: number;
  durationMs: number;
}

// === Main Edit Function ===

/**
 * Edit a video with auto-generated captions and overlays.
 *
 * Uses a transparent overlay compositing pipeline:
 * - Overlay layer rendered as transparent PNGs via Puppeteer
 * - FFmpeg composites overlays on source video natively (smooth playback)
 */
export async function editVideo(options: EditOptions): Promise<EditResult> {
  const startTime = Date.now();
  const progress = options.onProgress || (() => {});

  const inputPath = resolve(options.input);
  const outputPath = resolve(options.output);

  // === Stage 1: Probe source video ===
  progress("probe", "Analyzing source video...");
  const probe = await probeVideo(inputPath);
  progress("probe", `Source: ${probe.width}x${probe.height} @ ${probe.fps}fps, ${Math.round(probe.duration)}s`);

  // === Stage 2: Determine output dimensions ===
  const format = options.format || "source";
  const dims = getFormatDimensions(format, probe.width, probe.height);
  progress("format", `Output format: ${dims.width}x${dims.height}`);

  // === Stage 3: Get or create word-level timings ===
  progress("transcribe", "Getting word-level transcription...");
  const words = await getWordTimings(inputPath, options, progress);
  progress("transcribe", `Got ${words.length} word timings`);

  // Build sentence-level segments for overlay analysis
  const segments = wordsToSegments(words);

  // === Stage 4: Group words into caption groups ===
  const maxWords = options.maxWordsPerGroup ?? 4;
  const captionGroups = groupWords(words, maxWords);
  progress("captions", `Created ${captionGroups.length} caption groups (max ${maxWords} words each)`);

  // === Stage 5: Get style preset ===
  let style: EditStyle;
  if (options.brandColor) {
    style = createCustomStyle(options.style || "neo-brutalist", {
      brandColor: options.brandColor,
    });
  } else {
    style = getStylePreset(options.style || "neo-brutalist");
  }

  // === Stage 6: Generate overlay timeline ===
  let overlayCount = 0;
  let overlayScript = "";
  let overlayDeps: ComponentDependency[] = [];
  if (!options.captionsOnly) {
    progress("overlays", "Generating overlay timeline...");
    const overlays = generateOverlayTimeline({
      segments,
      words,
      duration: probe.duration,
      speakerName: options.speakerName,
      speakerTitle: options.speakerTitle,
      style,
      width: dims.width,
      height: dims.height,
    });
    overlayCount = overlays.length;
    const assembled = assembleOverlayPage(overlays, style, dims.width, dims.height);
    overlayScript = assembled.script;
    overlayDeps = assembled.dependencies;
    progress("overlays", `Generated ${overlayCount} overlay elements (${overlayDeps.length} deps)`);
  }

  // === Stage 7: Generate caption overlay ===
  progress("captions", "Generating caption overlay...");
  const captionPosition = options.captionPosition || "bottom";
  const captionConfig: Partial<CaptionStyleConfig> = {
    preset: options.captionPreset || "pop-in",
    fontSize: scaleFontSize(80, dims.width, dims.height),
    fontFamily: style.typography.captionFont,
    primaryColor: style.colors.text,
    accentColor: style.colors.primary,
    position: captionPosition,
    maxWordsPerGroup: maxWords,
  };
  const captionScript = generateCaptionOverlay(captionGroups, captionConfig);

  // === Stage 8+9: Build HTML and composite ===
  return compositeOverlayVideo({
    inputPath,
    outputPath,
    probe,
    dims,
    captionScript,
    overlayScript,
    overlayDeps,
    style,
    captionPosition,
    encodingSpeed: options.encodingSpeed || "balanced",
    startTime,
    wordCount: words.length,
    captionGroupCount: captionGroups.length,
    overlayCount,
    progress,
  });
}

// ============================================================
// Agent Overlay Rendering — model-agnostic
// ============================================================

export interface EditWithOverlaysOptions {
  /** Path to source video file */
  input: string;
  /** Output file path */
  output: string;
  /**
   * Path to overlay decisions JSON — produced by any AI agent.
   * Must be an array of AgentOverlayDecision objects.
   * See EDIT-AGENT-CONTRACT.md for the full specification.
   */
  overlaysPath: string;
  /** Caption animation preset */
  captionPreset?: CaptionPreset;
  /** Output format */
  format?: "landscape" | "vertical" | "square" | "source";
  /** Encoding speed */
  encodingSpeed?: "fast" | "balanced" | "slow" | "lossless";
  /** Path to existing SRT file (skip transcription) */
  srtPath?: string;
  /** Path to existing WhisperX word-level JSON (skip transcription) */
  wordTimingsPath?: string;
  /** Max words per caption group */
  maxWordsPerGroup?: number;
  /** Caption position */
  captionPosition?: "bottom" | "center" | "top";
  /** Skip captions entirely */
  captionsOnly?: boolean;
  /** Style preset for captions (does not affect agent overlays) */
  style?: string;
  /** Brand color for captions */
  brandColor?: string;
  /** Progress callback */
  onProgress?: (stage: string, detail: string) => void;
}

/**
 * Render a video with agent-produced overlays.
 *
 * The agent (any model) has already done the creative work and written
 * overlay-decisions.json. This function renders it. No AI calls here.
 *
 * See EDIT-AGENT-CONTRACT.md for how to produce the overlays JSON.
 */
export async function editVideoWithOverlays(options: EditWithOverlaysOptions): Promise<EditResult> {
  const startTime = Date.now();
  const progress = options.onProgress || (() => {});

  const inputPath = resolve(options.input);
  const outputPath = resolve(options.output);

  // Stage 1: Probe
  progress("probe", "Analyzing source video...");
  const probe = await probeVideo(inputPath);
  progress("probe", `Source: ${probe.width}x${probe.height} @ ${probe.fps}fps, ${Math.round(probe.duration)}s`);

  // Stage 2: Dimensions
  const format = options.format || "source";
  const dims = getFormatDimensions(format, probe.width, probe.height);
  progress("format", `Output format: ${dims.width}x${dims.height}`);

  // Stage 3: Load agent overlay decisions
  progress("overlays", `Loading overlay decisions from ${options.overlaysPath}...`);
  const rawJson = await readFile(resolve(options.overlaysPath), "utf-8");
  const rawDecisions = JSON.parse(rawJson);
  const decisions = validateOverlayDecisions(rawDecisions, probe.duration * 1000);
  progress("overlays", `Loaded ${decisions.length} overlay decisions`);

  // Stage 4: Word timings (for captions)
  let words: WordTiming[] = [];
  if (!options.captionsOnly || options.srtPath || options.wordTimingsPath) {
    progress("transcribe", "Getting word-level transcription...");
    words = await getWordTimings(inputPath, options as any, progress);
    progress("transcribe", `Got ${words.length} word timings`);
  }

  // Stage 5: Caption groups
  const maxWords = options.maxWordsPerGroup ?? 4;
  const captionGroups = groupWords(words, maxWords);

  // Stage 6: Style (for captions only — agent overlays are self-styled)
  let style: EditStyle;
  if (options.brandColor) {
    style = createCustomStyle(options.style || "bold-dark", { brandColor: options.brandColor });
  } else {
    style = getStylePreset(options.style || "bold-dark");
  }

  // Stage 7: Assemble agent overlays
  let overlayScript = "";
  let overlayDeps: ComponentDependency[] = [];
  if (!options.captionsOnly && decisions.length > 0) {
    const assembled = assembleAgentOverlayPage(decisions, dims.width, dims.height);
    overlayScript = assembled.script;
    overlayDeps = assembled.dependencies;
  }

  // Stage 8: Captions
  const captionPosition = options.captionPosition || "bottom";
  const captionConfig: Partial<CaptionStyleConfig> = {
    preset: options.captionPreset || "pop-in",
    fontSize: scaleFontSize(80, dims.width, dims.height),
    fontFamily: style.typography.captionFont,
    primaryColor: style.colors.text,
    accentColor: style.colors.primary,
    position: captionPosition,
    maxWordsPerGroup: maxWords,
  };
  const captionScript = generateCaptionOverlay(captionGroups, captionConfig);

  // Stage 9: Build HTML + composite
  return compositeOverlayVideo({
    inputPath,
    outputPath,
    probe,
    dims,
    captionScript,
    overlayScript,
    overlayDeps,
    style,
    captionPosition,
    encodingSpeed: options.encodingSpeed || "balanced",
    startTime,
    wordCount: words.length,
    captionGroupCount: captionGroups.length,
    overlayCount: decisions.length,
    progress,
  });
}

// === Internal Functions ===

/**
 * Scale a base font size proportionally to the video dimensions.
 * Reference: 1080px is the base dimension.
 */
function scaleFontSize(baseSize: number, width: number, height: number): number {
  const referenceDim = 1080;
  const scaleDim = Math.min(width, height);
  return Math.round(baseSize * (scaleDim / referenceDim));
}

async function getWordTimings(
  videoPath: string,
  options: EditOptions,
  progress: (stage: string, detail: string) => void
): Promise<WordTiming[]> {
  // Option 1: Pre-existing word timings JSON
  if (options.wordTimingsPath) {
    const json = await readFile(resolve(options.wordTimingsPath), "utf-8");
    return parseWhisperXWords(json);
  }

  // Option 2: Pre-existing SRT (convert to word-level approximation)
  if (options.srtPath) {
    const { parseSRT } = await import("./subtitles.js");
    const srtContent = await readFile(resolve(options.srtPath), "utf-8");
    const entries = parseSRT(srtContent);
    return srtToWordTimings(entries);
  }

  // Option 3: Run WhisperX for word-level transcription
  progress("transcribe", "Running WhisperX transcription...");
  return await transcribeWithWhisperX(videoPath, progress);
}

function srtToWordTimings(
  entries: Array<{ startMs: number; endMs: number; text: string }>
): WordTiming[] {
  const words: WordTiming[] = [];

  for (const entry of entries) {
    const entryWords = entry.text.split(/\s+/).filter((w) => w.length > 0);
    if (entryWords.length === 0) continue;

    const wordDuration = (entry.endMs - entry.startMs) / entryWords.length;

    for (let i = 0; i < entryWords.length; i++) {
      words.push({
        word: entryWords[i],
        start: (entry.startMs + i * wordDuration) / 1000,
        end: (entry.startMs + (i + 1) * wordDuration) / 1000,
        confidence: 0.8,
      });
    }
  }

  return words;
}

async function transcribeWithWhisperX(
  videoPath: string,
  progress: (stage: string, detail: string) => void
): Promise<WordTiming[]> {
  const tmpDir = join(tmpdir(), `frameforge-whisper-${Date.now()}`);
  await mkdir(tmpDir, { recursive: true });

  try {
    // Extract audio first
    const audioPath = join(tmpDir, "audio.wav");
    progress("transcribe", "Extracting audio...");

    try {
      await execFileAsync("ffmpeg", [
        "-y", "-i", videoPath,
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        audioPath,
      ]);
    } catch (err: any) {
      throw new Error(
        `Failed to extract audio from video: ${err.message}\n` +
          `Make sure FFmpeg is installed.`
      );
    }

    // Try WhisperX first, fall back to faster-whisper
    progress("transcribe", "Running speech recognition...");

    try {
      const outputJson = join(tmpDir, "audio.json");
      await execFileAsync("whisperx", [
        audioPath,
        "--model", "base",
        "--output_format", "json",
        "--output_dir", tmpDir,
        "--word_timestamps", "True",
      ], { timeout: 300000 });

      const jsonContent = await readFile(outputJson, "utf-8");
      const data = JSON.parse(jsonContent);
      return parseWhisperXWords(data);
    } catch {
      try {
        const outputJson = join(tmpDir, "transcription.json");
        await execFileAsync("faster-whisper", [
          audioPath,
          "--model", "base",
          "--output_format", "json",
          "--word_timestamps",
          "--output_dir", tmpDir,
        ], { timeout: 300000 });

        const jsonContent = await readFile(outputJson, "utf-8");
        return parseWhisperXWords(jsonContent);
      } catch {
        throw new Error(
          `No speech recognition tool found.\n` +
            `Install WhisperX: pip install whisperx\n` +
            `Or provide word timings with --word-timings <path>\n` +
            `Or provide an SRT file with --srt <path>`
        );
      }
    }
  } finally {
    // Always clean up whisper temp files
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort
    }
  }
}

function wordsToSegments(words: WordTiming[]): TranscriptSegment[] {
  if (words.length === 0) return [];

  const segments: TranscriptSegment[] = [];
  let currentWords: WordTiming[] = [];

  for (let i = 0; i < words.length; i++) {
    currentWords.push(words[i]);

    const isLast = i === words.length - 1;
    const nextWord = isLast ? null : words[i + 1];

    const shouldBreak =
      isLast ||
      (nextWord && nextWord.start - words[i].end > 0.8) ||
      /[.!?]$/.test(words[i].word);

    if (shouldBreak && currentWords.length > 0) {
      segments.push({
        start: currentWords[0].start,
        end: currentWords[currentWords.length - 1].end,
        text: currentWords.map((w) => w.word).join(" "),
      });
      currentWords = [];
    }
  }

  return segments;
}

/**
 * Build HTML that contains ONLY the overlay/caption layers.
 * NO <video> element — the source video is handled by FFmpeg.
 * Background is transparent so only overlay elements are visible.
 *
 * Readability gradients are rendered for whichever position captions appear.
 */
function buildOverlayOnlyHTML(
  width: number,
  height: number,
  captionScript: string,
  overlayScript: string,
  style: EditStyle,
  captionPosition: "bottom" | "center" | "top",
  dependencies?: ComponentDependency[]
): string {
  // Build gradient CSS based on caption position
  const gradients: string[] = [];

  if (captionPosition === "bottom" || captionPosition === "center") {
    gradients.push(`
    .gradient-bottom {
      position: fixed; bottom: 0; left: 0; width: 100%;
      height: ${Math.round(height * 0.30)}px;
      background: linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);
      z-index: 5; pointer-events: none;
    }`);
  }

  if (captionPosition === "top" || captionPosition === "center") {
    gradients.push(`
    .gradient-top {
      position: fixed; top: 0; left: 0; width: 100%;
      height: ${Math.round(height * 0.25)}px;
      background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 60%, transparent 100%);
      z-index: 5; pointer-events: none;
    }`);
  }

  const gradientDivs = [
    captionPosition === "bottom" || captionPosition === "center" ? '<div class="gradient-bottom"></div>' : '',
    captionPosition === "top" || captionPosition === "center" ? '<div class="gradient-top"></div>' : '',
  ].filter(Boolean).join("\n  ");

  const depScripts = (dependencies || [])
    .map(dep => {
      // Prefer inline content (eliminates CDN race condition in headless Chrome)
      if (dep.getInlineContent) {
        return `  <script>${dep.getInlineContent()}<\/script>`;
      }
      return `  <script src="${dep.url}"><\/script>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="${style.typography.googleFontsUrl}" rel="stylesheet">
${depScripts}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: transparent;
    }
    ${gradients.join("")}
  </style>
</head>
<body>
  ${gradientDivs}

  <script>
    ${overlayScript}
  </script>
  <script>
    ${captionScript}
  </script>
</body>
</html>`;
}

/** Shared composite pipeline used by editVideo + editVideoWithOverlays */
async function compositeOverlayVideo(args: {
  inputPath: string;
  outputPath: string;
  probe: import("./video-probe.js").VideoProbeResult;
  dims: { width: number; height: number };
  captionScript: string;
  overlayScript: string;
  overlayDeps: ComponentDependency[];
  style: EditStyle;
  captionPosition: "bottom" | "center" | "top";
  encodingSpeed: string;
  startTime: number;
  wordCount: number;
  captionGroupCount: number;
  overlayCount: number;
  progress: (stage: string, detail: string) => void;
}): Promise<EditResult> {
  const { inputPath, outputPath, probe, dims, captionScript, overlayScript, overlayDeps, style, captionPosition, encodingSpeed, startTime, wordCount, captionGroupCount, overlayCount, progress } = args;

  progress("build", "Building overlay layer...");
  const tmpDir = join(tmpdir(), `frameforge-edit-${Date.now()}`);
  await mkdir(tmpDir, { recursive: true });

  const htmlPath = join(tmpDir, "overlay.html");
  const overlayHTML = buildOverlayOnlyHTML(
    dims.width,
    dims.height,
    captionScript,
    overlayScript,
    style,
    captionPosition,
    overlayDeps
  );
  await writeFile(htmlPath, overlayHTML, "utf-8");

  const speed = (ENCODING_SPEED_PRESETS as any)[encodingSpeed] ? encodingSpeed as keyof typeof ENCODING_SPEED_PRESETS : "balanced";
  const speedPreset = ENCODING_SPEED_PRESETS[speed];
  const encoding = computeMatchedEncoding(probe, speed as any);

  progress("render", `Starting composite render (${speed} quality)...`);

  const pipeline = await compositeVideo({
    sourceVideo: inputPath,
    width: dims.width,
    height: dims.height,
    fps: probe.fps,
    output: outputPath,
    crf: encoding.crf,
    preset: speedPreset.preset,
    maxrate: encoding.maxrate,
    bufsize: encoding.bufsize,
    audioBitrate: encoding.audioBitrate,
    pixelFormat: "yuv420p",
  });

  await captureFrames({
    manifest: {
      version: "1.0",
      canvas: { width: dims.width, height: dims.height, fps: probe.fps, duration: probe.duration, background: "transparent" },
      entry: htmlPath,
      audio: [],
      render: { codec: "h264", quality: "high", pixelFormat: "yuv420p", output: outputPath },
    },
    entryPath: htmlPath,
    transparentBackground: true,
    onFrame: async (frameData) => { await pipeline.writeFrame(frameData); },
    onProgress: (current, total) => {
      progress("render", `Frame ${current}/${total} (${Math.round((current / total) * 100)}%)`);
    },
  });

  await pipeline.finalize();

  try {
    const s = await stat(outputPath);
    if (s.size < 1000) progress("warn", `Output suspiciously small (${s.size}B)`);
  } catch { /* file missing — finalize already threw */ }

  try { await rm(tmpDir, { recursive: true, force: true }); } catch { /* best-effort */ }

  const durationMs = Date.now() - startTime;
  progress("done", `Completed in ${(durationMs / 1000).toFixed(1)}s`);

  return { outputPath, probe, wordCount, captionGroupCount, overlayCount, durationMs };
}

// ============================================================
// Transcript Extraction — standalone command
// ============================================================

export interface ExtractTranscriptOptions {
  input: string;
  output: string;
  srtPath?: string;
  wordTimingsPath?: string;
  onProgress?: (stage: string, detail: string) => void;
}

/**
 * Extract a transcript from a video file and write it as AgentTranscript JSON.
 * This is what AI agents receive as input when making overlay decisions.
 */
export async function extractTranscript(options: ExtractTranscriptOptions): Promise<void> {
  const progress = options.onProgress || (() => {});
  const inputPath = resolve(options.input);
  const outputPath = resolve(options.output);

  progress("probe", "Probing video...");
  const probe = await probeVideo(inputPath);
  const dims = getFormatDimensions("source", probe.width, probe.height);

  progress("transcribe", "Getting word timings...");
  const words = await getWordTimings(inputPath, { input: inputPath, output: outputPath, srtPath: options.srtPath, wordTimingsPath: options.wordTimingsPath }, progress);

  const transcript = buildAgentTranscript(words, probe.duration, dims.width, dims.height);

  await writeFile(outputPath, JSON.stringify(transcript, null, 2), "utf-8");
  progress("done", `Transcript written to ${outputPath} (${transcript.phrases.length} phrases, ${words.length} words)`);
}
