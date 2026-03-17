/**
 * Edit Preview Generator
 *
 * Generates a standalone HTML preview of the overlay + caption system.
 * Opens in any browser — no Puppeteer, no FFmpeg, no video file needed.
 *
 * The preview includes:
 * - All overlay components (GSAP animations, Canvas particles, spring physics)
 * - Word-level captions with chosen preset
 * - Interactive time scrubber (play/pause/seek/speed)
 * - Dark background simulating video footage
 *
 * The overlay scripts read from `window.__frameforge.currentTimeMs`,
 * which is controlled by the scrubber. GSAP paused timelines are driven
 * via `.time()` exactly like in the real renderer — frame-perfect preview.
 */

import { type WordTiming, groupWords, generateCaptionOverlay, type CaptionPreset, type CaptionStyleConfig } from "./word-captions.js";
import { type TranscriptSegment, generateOverlayTimeline } from "./overlay-generator.js";
import { getStylePreset, createCustomStyle, type EditStyle } from "./edit-styles.js";
import "./components/init.js";
import { assembleOverlayPage } from "./components/assembler.js";

export interface EditPreviewOptions {
  /** Word-level timings */
  words: WordTiming[];
  /** Total duration in seconds */
  duration: number;
  /** Style preset name (default: "neo-brutalist") */
  style?: string;
  /** Custom brand color */
  brandColor?: string;
  /** Caption animation preset */
  captionPreset?: CaptionPreset;
  /** Video width (default: 1920) */
  width?: number;
  /** Video height (default: 1080) */
  height?: number;
  /** Speaker name for lower third */
  speakerName?: string;
  /** Speaker title for lower third */
  speakerTitle?: string;
  /** Max words per caption group (default: 4) */
  maxWordsPerGroup?: number;
  /** Caption position (default: "bottom") */
  captionPosition?: "bottom" | "center" | "top";
  /** Skip overlays, captions only */
  captionsOnly?: boolean;
  /** Background image as base64 data URL (e.g., "data:image/jpeg;base64,...") */
  backgroundImage?: string;
  /** Background video file path for <video> element (works best served locally) */
  backgroundVideo?: string;
}

/**
 * Generate a standalone HTML preview of the edit overlay + caption system.
 * Returns a complete HTML string that can be opened directly in a browser.
 */
export function generateEditPreview(options: EditPreviewOptions): string {
  const width = options.width ?? 1920;
  const height = options.height ?? 1080;
  const duration = options.duration;
  const durationMs = duration * 1000;
  const captionPosition = options.captionPosition || "bottom";
  const maxWords = options.maxWordsPerGroup ?? 4;

  // Resolve style
  let style: EditStyle;
  if (options.brandColor) {
    style = createCustomStyle(options.style || "neo-brutalist", { brandColor: options.brandColor });
  } else {
    style = getStylePreset(options.style || "neo-brutalist");
  }

  // Build segments from words
  const segments = wordsToSegments(options.words);

  // Generate overlay timeline + assemble components
  let overlayScript = "";
  let overlayDepScripts = "";
  let overlayCount = 0;
  if (!options.captionsOnly) {
    const overlays = generateOverlayTimeline({
      segments,
      words: options.words,
      duration,
      speakerName: options.speakerName,
      speakerTitle: options.speakerTitle,
      style,
      width,
      height,
    });
    overlayCount = overlays.length;
    const assembled = assembleOverlayPage(overlays, style, width, height);
    overlayScript = assembled.script;
    overlayDepScripts = assembled.dependencies
      .map((dep) => {
        if (dep.getInlineContent) return `<script>${dep.getInlineContent()}<\/script>`;
        return `<script src="${dep.url}"><\/script>`;
      })
      .join("\n");
  }

  // Generate captions
  const captionGroups = groupWords(options.words, maxWords);
  const scaleDim = Math.min(width, height);
  const fontSize = Math.round(80 * (scaleDim / 1080));
  const captionConfig: Partial<CaptionStyleConfig> = {
    preset: options.captionPreset || "pop-in",
    fontSize,
    fontFamily: style.typography.captionFont,
    primaryColor: style.colors.text,
    accentColor: style.colors.primary,
    position: captionPosition,
    maxWordsPerGroup: maxWords,
  };
  const captionScript = generateCaptionOverlay(captionGroups, captionConfig);

  // Format duration for display
  const durationMin = Math.floor(duration / 60);
  const durationSec = Math.floor(duration % 60);
  const durationDisplay = `${durationMin}:${durationSec.toString().padStart(2, "0")}`;

  // Build gradient CSS
  const gradients: string[] = [];
  if (captionPosition === "bottom" || captionPosition === "center") {
    gradients.push(`.gradient-bottom { position: absolute; bottom: 0; left: 0; width: 100%; height: ${Math.round(height * 0.30)}px; background: linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%); z-index: 5; pointer-events: none; }`);
  }
  if (captionPosition === "top" || captionPosition === "center") {
    gradients.push(`.gradient-top { position: absolute; top: 0; left: 0; width: 100%; height: ${Math.round(height * 0.25)}px; background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 60%, transparent 100%); z-index: 5; pointer-events: none; }`);
  }

  const gradientDivs = [
    captionPosition === "bottom" || captionPosition === "center" ? '<div class="gradient-bottom"></div>' : "",
    captionPosition === "top" || captionPosition === "center" ? '<div class="gradient-top"></div>' : "",
  ].filter(Boolean).join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FrameForge Edit Preview — ${style.name} — ${durationDisplay}</title>
  <link href="${style.typography.googleFontsUrl}" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
${overlayDepScripts}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #0a0a0a;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100vh;
      font-family: 'Inter', system-ui, sans-serif;
      color: #fff;
    }

    .header {
      padding: 16px 24px; text-align: center;
      color: #888; font-size: 13px;
    }
    .header strong { color: #fff; font-size: 15px; }
    .header .stats { color: #555; margin-top: 4px; }

    .viewport-container {
      position: relative;
      border: 1px solid #333;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }

    .viewport {
      width: ${width}px; height: ${height}px;
      position: relative;
      overflow: hidden;
      background: ${options.backgroundImage ? `url(${options.backgroundImage}) center/cover no-repeat` : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"};
      transform-origin: top left;
    }
    .viewport video.bg-video {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover; z-index: 0;
    }
    .viewport .no-video-hint {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      color: rgba(255,255,255,0.08); font-size: ${Math.round(48 * Math.min(width, height) / 1080)}px;
      font-weight: 700; text-transform: uppercase; letter-spacing: 8px;
      pointer-events: none; z-index: 0; white-space: nowrap;
    }

    ${gradients.join("\n    ")}

    .controls {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 24px; width: 100%; max-width: 800px;
    }

    .controls button {
      background: ${style.colors.primary}; color: #000;
      border: none; border-radius: 6px;
      padding: 8px 20px; font-weight: 700; font-size: 14px;
      cursor: pointer; min-width: 72px;
      font-family: 'Inter', system-ui;
    }
    .controls button:hover { filter: brightness(1.1); }

    .controls input[type="range"] {
      flex: 1; height: 6px; -webkit-appearance: none;
      background: #333; border-radius: 3px; outline: none;
    }
    .controls input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none; width: 16px; height: 16px;
      background: ${style.colors.primary}; border-radius: 50%; cursor: pointer;
    }

    .time-display {
      font-variant-numeric: tabular-nums; font-size: 13px;
      color: #888; min-width: 110px; text-align: right;
    }

    .controls select {
      background: #222; color: #aaa; border: 1px solid #444;
      border-radius: 4px; padding: 4px 8px; font-size: 12px;
      font-family: 'Inter', system-ui;
    }

    .keyboard-hint {
      color: #444; font-size: 11px; margin-top: 8px; text-align: center;
    }
    .keyboard-hint kbd {
      background: #222; border: 1px solid #444; border-radius: 3px;
      padding: 1px 6px; font-family: 'Inter', system-ui;
    }
  </style>
</head>
<body>
  <div class="header">
    <strong>FrameForge Edit Preview</strong><br>
    Style: ${style.name} &nbsp;|&nbsp; ${width}&times;${height} &nbsp;|&nbsp; ${durationDisplay}
    <div class="stats">${overlayCount} overlays &nbsp;|&nbsp; ${captionGroups.length} caption groups &nbsp;|&nbsp; ${options.words.length} words</div>
  </div>

  <div class="viewport-container" id="viewport-container">
    <div class="viewport" id="viewport">
      ${options.backgroundVideo ? `<video class="bg-video" id="bg-video" src="${options.backgroundVideo}" muted preload="auto"></video>` : ""}
      ${!options.backgroundVideo && !options.backgroundImage ? '<div class="no-video-hint">Video Layer</div>' : ""}
      ${gradientDivs}
    </div>
  </div>

  <div class="controls">
    <button id="play-btn">Play</button>
    <input type="range" id="time-slider" min="0" max="${durationMs}" value="0" step="1">
    <span class="time-display" id="time-display">0:00.0 / ${durationDisplay}</span>
    <select id="speed-select">
      <option value="0.25">0.25x</option>
      <option value="0.5">0.5x</option>
      <option value="1" selected>1x</option>
      <option value="2">2x</option>
      <option value="4">4x</option>
    </select>
  </div>
  <div class="keyboard-hint">
    <kbd>Space</kbd> play/pause &nbsp; <kbd>&larr;</kbd><kbd>&rarr;</kbd> seek 1s &nbsp; <kbd>.</kbd><kbd>,</kbd> frame step
  </div>

  <script>
  (function() {
    // === Preview Controller ===
    var durationMs = ${durationMs};
    var fps = 30;
    var frameDur = 1000 / fps;

    // Controlled clock for overlay/caption scripts
    window.__frameforge = {
      currentTimeMs: 0,
      currentFrame: 0,
      totalFrames: Math.ceil(${duration} * fps)
    };

    var slider = document.getElementById('time-slider');
    var display = document.getElementById('time-display');
    var playBtn = document.getElementById('play-btn');
    var speedSelect = document.getElementById('speed-select');
    var bgVideo = document.getElementById('bg-video');

    var playing = false;
    var speed = 1;
    var lastTick = 0;

    function setTime(ms) {
      ms = Math.max(0, Math.min(ms, durationMs));
      window.__frameforge.currentTimeMs = ms;
      window.__frameforge.currentFrame = Math.floor(ms / frameDur);
      slider.value = ms;
      // Sync background video if present
      if (bgVideo) bgVideo.currentTime = ms / 1000;
      var s = Math.floor(ms / 1000);
      var m = Math.floor(s / 60);
      var sec = s % 60;
      var tenth = Math.floor((ms % 1000) / 100);
      display.textContent = m + ':' + (sec < 10 ? '0' : '') + sec + '.' + tenth + ' / ${durationDisplay}';
    }

    slider.addEventListener('input', function() { setTime(parseFloat(this.value)); });
    speedSelect.addEventListener('change', function() { speed = parseFloat(this.value); });

    playBtn.addEventListener('click', function() {
      playing = !playing;
      this.textContent = playing ? 'Pause' : 'Play';
      if (playing) {
        lastTick = performance.now();
        if (bgVideo) { bgVideo.playbackRate = speed; bgVideo.play(); }
      } else {
        if (bgVideo) bgVideo.pause();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (e.code === 'Space') { e.preventDefault(); playBtn.click(); }
      if (e.code === 'ArrowRight') { setTime(window.__frameforge.currentTimeMs + 1000); }
      if (e.code === 'ArrowLeft') { setTime(window.__frameforge.currentTimeMs - 1000); }
      if (e.key === '.') { setTime(window.__frameforge.currentTimeMs + frameDur); }
      if (e.key === ',') { setTime(window.__frameforge.currentTimeMs - frameDur); }
    });

    // Playback loop
    function tick() {
      if (playing) {
        var now = performance.now();
        var delta = (now - lastTick) * speed;
        lastTick = now;
        var newTime = window.__frameforge.currentTimeMs + delta;
        if (newTime >= durationMs) newTime = 0; // Loop
        setTime(newTime);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Auto-scale viewport to fit screen
    var vpc = document.getElementById('viewport-container');
    var vp = document.getElementById('viewport');
    function autoScale() {
      var maxW = window.innerWidth - 48;
      var maxH = window.innerHeight - 200;
      var scaleW = maxW / ${width};
      var scaleH = maxH / ${height};
      var s = Math.min(scaleW, scaleH, 1);
      vp.style.transform = 'scale(' + s + ')';
      vpc.style.width = Math.round(${width} * s) + 'px';
      vpc.style.height = Math.round(${height} * s) + 'px';
    }
    autoScale();
    window.addEventListener('resize', autoScale);
  })();
  </script>

  <script>
    ${overlayScript}
  </script>
  <script>
    ${captionScript}
  </script>
</body>
</html>`;
}

/** Convert word timings to sentence-level segments for overlay analysis */
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
