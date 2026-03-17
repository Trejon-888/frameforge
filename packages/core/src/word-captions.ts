/**
 * Word-Level Caption Engine
 *
 * Generates captions with 2-4 words per group, active word highlighting,
 * and multiple animation styles (pop-in, karaoke, highlight, minimal, bold-center).
 *
 * Designed for modern short-form content where each word group appears
 * and disappears rapidly with visual emphasis on the currently-spoken word.
 */

export interface WordTiming {
  word: string;
  start: number; // seconds
  end: number; // seconds
  confidence: number;
}

export interface CaptionGroup {
  words: WordTiming[];
  startMs: number;
  endMs: number;
  text: string;
}

export type CaptionPreset =
  | "pop-in"
  | "karaoke"
  | "highlight"
  | "minimal"
  | "bold-center";

export interface CaptionStyleConfig {
  preset: CaptionPreset;
  fontSize: number;
  fontFamily: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  position: "bottom" | "center" | "top";
  maxWordsPerGroup: number;
}

const DEFAULT_CONFIG: CaptionStyleConfig = {
  preset: "pop-in",
  fontSize: 64,
  fontFamily: "'Inter', system-ui, sans-serif",
  primaryColor: "#ffffff",
  accentColor: "#f97316",
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  position: "bottom",
  maxWordsPerGroup: 4,
};

/**
 * Group word-level timestamps into 2-4 word caption groups.
 *
 * Grouping rules:
 * 1. Max `maxWordsPerGroup` words per group
 * 2. Break at natural pauses (gap > 300ms between words)
 * 3. Break at punctuation (commas, periods, question marks, exclamation marks)
 * 4. Minimum 1 word per group
 */
export function groupWords(
  words: WordTiming[],
  maxPerGroup: number = 4
): CaptionGroup[] {
  if (words.length === 0) return [];

  const groups: CaptionGroup[] = [];
  let currentGroup: WordTiming[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentGroup.push(word);

    const isLast = i === words.length - 1;
    const nextWord = isLast ? null : words[i + 1];

    // Decide whether to break after this word
    let shouldBreak = false;

    // Rule 1: Hit max words per group
    if (currentGroup.length >= maxPerGroup) {
      shouldBreak = true;
    }

    // Rule 2: Natural pause (gap > 300ms to next word)
    if (nextWord && nextWord.start - word.end > 0.3) {
      shouldBreak = true;
    }

    // Rule 3: Punctuation at end of word
    if (endsWithPunctuation(word.word)) {
      shouldBreak = true;
    }

    // Rule 4: Last word
    if (isLast) {
      shouldBreak = true;
    }

    if (shouldBreak && currentGroup.length > 0) {
      groups.push({
        words: [...currentGroup],
        startMs: Math.round(currentGroup[0].start * 1000),
        endMs: Math.round(currentGroup[currentGroup.length - 1].end * 1000),
        text: currentGroup.map((w) => w.word).join(" "),
      });
      currentGroup = [];
    }
  }

  return groups;
}

/**
 * Parse WhisperX word-level JSON output into WordTiming array.
 *
 * WhisperX output format:
 * { segments: [{ words: [{ word: "hello", start: 0.0, end: 0.5, score: 0.99 }] }] }
 *
 * Also supports flat array format:
 * [{ word: "hello", start: 0.0, end: 0.5, confidence: 0.99 }]
 */
export function parseWhisperXWords(json: string | object): WordTiming[] {
  const data = typeof json === "string" ? JSON.parse(json) : json;
  const words: WordTiming[] = [];

  if (Array.isArray(data)) {
    // Flat array format
    for (const item of data) {
      if (item.word && item.start !== undefined && item.end !== undefined) {
        words.push({
          word: cleanWord(item.word),
          start: item.start,
          end: item.end,
          confidence: item.confidence ?? item.score ?? 1.0,
        });
      }
    }
  } else if (data.segments) {
    // WhisperX segments format
    for (const seg of data.segments) {
      if (seg.words) {
        for (const w of seg.words) {
          if (w.word && w.start !== undefined && w.end !== undefined) {
            words.push({
              word: cleanWord(w.word),
              start: w.start,
              end: w.end,
              confidence: w.confidence ?? w.score ?? 1.0,
            });
          }
        }
      }
    }
  }

  return words;
}

/**
 * Generate the HTML/CSS/JS for a caption overlay.
 * This produces a self-contained script block that can be injected into any page.
 */
export function generateCaptionOverlay(
  groups: CaptionGroup[],
  config: Partial<CaptionStyleConfig> = {}
): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const groupsJSON = JSON.stringify(groups);

  // Position CSS
  const positionCSS = getPositionCSS(cfg.position);

  // Generate preset-specific styles and animation logic
  const { styles, animationLogic } = getPresetCode(cfg);

  return `
(function() {
  // === WORD-LEVEL CAPTION ENGINE ===

  // Inject Google Fonts if needed
  if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap';
    document.head.appendChild(link);
  }

  // Create styles
  var styleEl = document.createElement('style');
  styleEl.textContent = \`
    #ff-word-captions {
      position: fixed;
      ${positionCSS}
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 1200px;
      text-align: center;
      z-index: 9999;
      pointer-events: none;
      font-family: ${cfg.fontFamily};
    }

    .ff-caption-group {
      display: inline;
      opacity: 0;
      transition: opacity 0.08s ease;
    }

    .ff-caption-group.active {
      opacity: 1;
    }

    .ff-word {
      display: inline-block;
      font-size: ${cfg.fontSize}px;
      font-weight: 800;
      color: ${cfg.primaryColor};
      line-height: 1.2;
      margin: 0 4px;
      transition: all 0.1s ease;
    }

    ${styles}
  \`;
  document.head.appendChild(styleEl);

  // Create container
  var container = document.createElement('div');
  container.id = 'ff-word-captions';
  document.body.appendChild(container);

  var groups = ${groupsJSON};
  var lastGroupIdx = -1;

  function update() {
    var t = window.__frameforge ? window.__frameforge.currentTimeMs : performance.now();

    // Find active group
    var activeIdx = -1;
    for (var i = 0; i < groups.length; i++) {
      if (t >= groups[i].startMs && t <= groups[i].endMs) {
        activeIdx = i;
        break;
      }
    }

    if (activeIdx !== lastGroupIdx) {
      lastGroupIdx = activeIdx;

      if (activeIdx === -1) {
        container.innerHTML = '';
      } else {
        var group = groups[activeIdx];
        var html = '<div class="ff-caption-group active">';
        for (var w = 0; w < group.words.length; w++) {
          var word = group.words[w];
          html += '<span class="ff-word" data-start="' + Math.round(word.start * 1000) +
            '" data-end="' + Math.round(word.end * 1000) + '">' +
            escapeHtml(word.word) + '</span>';
        }
        html += '</div>';
        container.innerHTML = html;
      }
    }

    // Per-word animation (runs every frame for active words)
    ${animationLogic}

    requestAnimationFrame(update);
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  requestAnimationFrame(update);
})();`;
}

/**
 * Convenience function: parse words, group them, generate overlay.
 */
export function createWordCaptions(
  whisperData: string | object,
  config: Partial<CaptionStyleConfig> = {}
): string {
  const words = parseWhisperXWords(whisperData);
  const groups = groupWords(words, config.maxWordsPerGroup ?? DEFAULT_CONFIG.maxWordsPerGroup);
  return generateCaptionOverlay(groups, config);
}

// === Internal helpers ===

function cleanWord(w: string): string {
  return w.trim().replace(/^\s+|\s+$/g, "");
}

function endsWithPunctuation(word: string): boolean {
  return /[.,!?;:—–]$/.test(word);
}

function getPositionCSS(position: "bottom" | "center" | "top"): string {
  switch (position) {
    case "top":
      return "top: 80px;";
    case "center":
      return "top: 50%; transform: translate(-50%, -50%);";
    case "bottom":
    default:
      return "bottom: 120px;";
  }
}

function getPresetCode(cfg: CaptionStyleConfig): {
  styles: string;
  animationLogic: string;
} {
  switch (cfg.preset) {
    case "pop-in":
      return {
        styles: `
          .ff-word {
            text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
            transform: scale(0.5);
            opacity: 0;
          }
          .ff-caption-group.active .ff-word {
            animation: ff-pop-word 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          .ff-word.speaking {
            color: ${cfg.accentColor};
            transform: scale(1.15);
          }
          @keyframes ff-pop-word {
            0% { transform: scale(0.5); opacity: 0; }
            60% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
        `,
        animationLogic: `
          var wordEls = container.querySelectorAll('.ff-word');
          for (var j = 0; j < wordEls.length; j++) {
            var ws = parseInt(wordEls[j].getAttribute('data-start'));
            var we = parseInt(wordEls[j].getAttribute('data-end'));
            wordEls[j].style.animationDelay = (j * 0.06) + 's';
            if (t >= ws && t <= we) {
              wordEls[j].classList.add('speaking');
            } else {
              wordEls[j].classList.remove('speaking');
            }
          }
        `,
      };

    case "karaoke":
      return {
        styles: `
          .ff-word {
            text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
            opacity: 0.4;
            transition: all 0.12s ease;
          }
          .ff-caption-group.active .ff-word {
            opacity: 0.4;
          }
          .ff-word.spoken {
            opacity: 1;
            color: ${cfg.accentColor};
          }
          .ff-word.speaking {
            opacity: 1;
            color: ${cfg.accentColor};
            transform: scale(1.1);
          }
        `,
        animationLogic: `
          var wordEls = container.querySelectorAll('.ff-word');
          for (var j = 0; j < wordEls.length; j++) {
            var ws = parseInt(wordEls[j].getAttribute('data-start'));
            var we = parseInt(wordEls[j].getAttribute('data-end'));
            if (t >= ws && t <= we) {
              wordEls[j].classList.add('speaking');
              wordEls[j].classList.remove('spoken');
            } else if (t > we) {
              wordEls[j].classList.remove('speaking');
              wordEls[j].classList.add('spoken');
            } else {
              wordEls[j].classList.remove('speaking');
              wordEls[j].classList.remove('spoken');
            }
          }
        `,
      };

    case "highlight":
      return {
        styles: `
          .ff-word {
            text-shadow: 1px 1px 0 #000;
            padding: 2px 6px;
            border-radius: 4px;
            transition: all 0.1s ease;
          }
          .ff-caption-group.active .ff-word {
            opacity: 1;
          }
          .ff-word.speaking {
            background: ${cfg.accentColor};
            color: #000;
            text-shadow: none;
            transform: scale(1.05);
            box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
          }
        `,
        animationLogic: `
          var wordEls = container.querySelectorAll('.ff-word');
          for (var j = 0; j < wordEls.length; j++) {
            var ws = parseInt(wordEls[j].getAttribute('data-start'));
            var we = parseInt(wordEls[j].getAttribute('data-end'));
            if (t >= ws && t <= we) {
              wordEls[j].classList.add('speaking');
            } else {
              wordEls[j].classList.remove('speaking');
            }
          }
        `,
      };

    case "minimal":
      return {
        styles: `
          .ff-word {
            font-weight: 600;
            font-size: ${Math.round(cfg.fontSize * 0.85)}px;
            opacity: 0.9;
            text-shadow: 1px 1px 4px rgba(0,0,0,0.6);
          }
          .ff-caption-group.active .ff-word {
            opacity: 0.9;
          }
        `,
        animationLogic: `
          // Minimal — no per-word animation, just show the group
        `,
      };

    case "bold-center":
      return {
        styles: `
          #ff-word-captions {
            bottom: auto !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
          }
          .ff-word {
            font-size: ${Math.round(cfg.fontSize * 1.4)}px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -2px;
            text-shadow: 3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000;
            transform: scale(0.8);
            opacity: 0;
          }
          .ff-caption-group.active .ff-word {
            animation: ff-bold-slam 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .ff-word.speaking {
            color: ${cfg.accentColor};
          }
          @keyframes ff-bold-slam {
            0% { transform: scale(1.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `,
        animationLogic: `
          var wordEls = container.querySelectorAll('.ff-word');
          for (var j = 0; j < wordEls.length; j++) {
            var ws = parseInt(wordEls[j].getAttribute('data-start'));
            var we = parseInt(wordEls[j].getAttribute('data-end'));
            wordEls[j].style.animationDelay = (j * 0.08) + 's';
            if (t >= ws && t <= we) {
              wordEls[j].classList.add('speaking');
            } else {
              wordEls[j].classList.remove('speaking');
            }
          }
        `,
      };
  }
}
