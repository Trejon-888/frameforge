import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { render } from "./renderer.js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from cwd if present (no external dependency)
(function loadDotenv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  try {
    const lines = readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch { /* best-effort */ }
})();

function getVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, "../package.json"), "utf-8")
    );
    return pkg.version;
  } catch {
    return "0.1.0";
  }
}

const program = new Command();

program
  .name("frameforge")
  .description(
    "Framework-agnostic programmatic video renderer.\n" +
      "If a browser can render it, FrameForge can record it."
  )
  .version(getVersion());

program
  .command("render")
  .description("Render an HTML page or scene manifest to MP4 video")
  .argument("<input>", "Path to HTML file or scene manifest JSON")
  .option("-o, --output <path>", "Output file path (default: manifest output or ./output.mp4)")
  .option("-d, --duration <seconds>", "Duration in seconds (required for HTML input)", parseFloat)
  .option("--fps <number>", "Frames per second", parseInt)
  .option("--width <pixels>", "Video width in pixels", parseInt)
  .option("--height <pixels>", "Video height in pixels", parseInt)
  .action(async (input: string, opts) => {
    const spinner = ora();

    console.log(
      chalk.bold("\n  FrameForge ") +
        chalk.dim(`v${getVersion()}`) +
        "\n"
    );

    try {
      spinner.start(chalk.dim("Starting render..."));

      const startTime = Date.now();

      const outputPath = await render({
        input,
        output: opts.output,
        duration: opts.duration,
        fps: opts.fps,
        width: opts.width,
        height: opts.height,
        onProgress: (current, total) => {
          const pct = Math.round((current / total) * 100);
          spinner.text = chalk.dim(
            `Rendering frame ${current}/${total} (${pct}%)`
          );
        },
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      spinner.succeed(
        chalk.green(`Rendered to ${outputPath}`) +
          chalk.dim(` in ${elapsed}s`)
      );
    } catch (err: any) {
      spinner.fail(chalk.red("Render failed"));
      console.error(chalk.red(`\n  ${err.message}\n`));

      // Agent-friendly error hints
      if (err.message.includes("FFmpeg") || err.message.includes("ffmpeg")) {
        console.error(
          chalk.yellow("  Hint: Install FFmpeg — https://ffmpeg.org/download.html\n")
        );
      }
      if (err.message.includes("Duration is required")) {
        console.error(
          chalk.yellow(
            "  Hint: Use --duration <seconds> when rendering raw HTML files.\n" +
              "  Example: frameforge render page.html --duration 10\n"
          )
        );
      }
      if (err.message.includes("Entry file not found")) {
        console.error(
          chalk.yellow(
            '  Hint: Check that the HTML file path is correct.\n' +
              '  For manifests, the "entry" path is relative to the manifest file.\n'
          )
        );
      }
      if (err.message.includes("ENOENT") || err.message.includes("no such file")) {
        console.error(
          chalk.yellow(
            "  Hint: The input file was not found. Check the file path.\n"
          )
        );
      }

      process.exit(1);
    }
  });

program
  .command("preview")
  .description("Capture a single frame as a PNG image")
  .argument("<input>", "Path to HTML file or scene manifest JSON")
  .option("-o, --output <path>", "Output PNG path", "./preview.png")
  .option("-f, --frame <number>", "Frame number to capture (0-indexed)", parseInt, 0)
  .option("-d, --duration <seconds>", "Duration in seconds (required for HTML input)", parseFloat)
  .option("--fps <number>", "Frames per second", parseInt)
  .option("--width <pixels>", "Video width in pixels", parseInt)
  .option("--height <pixels>", "Video height in pixels", parseInt)
  .action(async (input: string, opts) => {
    const spinner = ora();

    console.log(
      chalk.bold("\n  FrameForge ") +
        chalk.dim(`v${getVersion()} — preview`) +
        "\n"
    );

    try {
      spinner.start(chalk.dim(`Capturing frame ${opts.frame}...`));

      const inputPath = resolve(input);
      let manifest: any;
      let entryPath: string;

      if (inputPath.endsWith(".json")) {
        const { parseManifest, resolveEntry } = await import("./manifest.js");
        manifest = await parseManifest(inputPath);
        entryPath = resolveEntry(inputPath, manifest.entry);
      } else {
        if (!opts.duration) {
          throw new Error("Duration is required for raw HTML. Use --duration <seconds>.");
        }
        manifest = {
          version: "1.0",
          canvas: {
            width: opts.width ?? 1920,
            height: opts.height ?? 1080,
            fps: opts.fps ?? 30,
            duration: opts.duration,
            background: "#000000",
          },
          entry: inputPath,
          audio: [],
          render: { codec: "h264", quality: "high", pixelFormat: "yuv420p", output: "./output.mp4" },
        };
        entryPath = inputPath;
      }

      if (opts.fps) manifest.canvas.fps = opts.fps;
      if (opts.width) manifest.canvas.width = opts.width;
      if (opts.height) manifest.canvas.height = opts.height;

      const { capturePreview } = await import("./preview.js");
      const outputPath = await capturePreview({
        manifest,
        entryPath,
        frame: opts.frame,
        output: opts.output,
      });

      spinner.succeed(
        chalk.green(`Preview saved to ${outputPath}`) +
          chalk.dim(` (frame ${opts.frame})`)
      );
    } catch (err: any) {
      spinner.fail(chalk.red("Preview failed"));
      console.error(chalk.red(`\n  ${err.message}\n`));
      process.exit(1);
    }
  });

program
  .command("compose")
  .description("Compose multiple scenes into a single video with transitions")
  .argument("<input>", "Path to composition manifest JSON")
  .option("-o, --output <path>", "Output file path")
  .action(async (input: string, opts) => {
    const spinner = ora();

    console.log(
      chalk.bold("\n  FrameForge ") +
        chalk.dim(`v${getVersion()} — compose`) +
        "\n"
    );

    try {
      spinner.start(chalk.dim("Starting composition..."));

      const startTime = Date.now();

      const { compose } = await import("./composition.js");
      const outputPath = await compose({
        input,
        output: opts.output,
        onProgress: (msg) => {
          spinner.text = chalk.dim(msg);
        },
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      spinner.succeed(
        chalk.green(`Composed to ${outputPath}`) +
          chalk.dim(` in ${elapsed}s`)
      );
    } catch (err: any) {
      spinner.fail(chalk.red("Composition failed"));
      console.error(chalk.red(`\n  ${err.message}\n`));
      process.exit(1);
    }
  });

program
  .command("preview-edit")
  .description("Generate an interactive HTML preview of edit overlays + captions (no video needed)")
  .option("-o, --output <path>", "Output HTML path", "./edit-preview.html")
  .option("-s, --style <preset>", "Style preset", "neo-brutalist")
  .option("--caption-style <style>", "Caption style", "pop-in")
  .option("--srt <path>", "SRT file for transcript")
  .option("--word-timings <path>", "WhisperX word timings JSON")
  .option("-d, --duration <seconds>", "Video duration in seconds", parseFloat, 30)
  .option("--width <pixels>", "Video width", parseInt, 1920)
  .option("--height <pixels>", "Video height", parseInt, 1080)
  .option("--brand-color <hex>", "Override primary brand color")
  .option("--speaker-name <name>", "Speaker name for lower third")
  .option("--speaker-title <title>", "Speaker title for lower third")
  .option("--max-words <n>", "Max words per caption group", parseInt, 4)
  .option("--caption-position <pos>", "Caption position (bottom, center, top)", "bottom")
  .option("--captions-only", "Skip overlay generation")
  .option("--background <path>", "Background image or video file (jpg/png/mp4/webm)")
  .action(async (opts) => {
    const spinner = ora();

    console.log(
      chalk.bold("\n  FrameForge ") +
        chalk.dim(`v${getVersion()} — preview-edit`) +
        "\n"
    );

    try {
      spinner.start(chalk.dim("Generating edit preview..."));

      const { generateEditPreview } = await import("./preview-edit.js");
      const { parseSRT } = await import("./subtitles.js");
      const { parseWhisperXWords } = await import("./word-captions.js");
      const { writeFile } = await import("node:fs/promises");

      // Load word timings from SRT or WhisperX JSON
      let words: any[];
      if (opts.wordTimings) {
        const json = readFileSync(resolve(opts.wordTimings), "utf-8");
        words = parseWhisperXWords(json);
      } else if (opts.srt) {
        const srtContent = readFileSync(resolve(opts.srt), "utf-8");
        const entries = parseSRT(srtContent);
        words = srtToWordTimings(entries);
      } else {
        // Generate sample words for preview
        words = generateSampleWords(opts.duration);
      }

      // Handle background image/video
      let backgroundImage: string | undefined;
      let backgroundVideo: string | undefined;
      if (opts.background) {
        const bgPath = resolve(opts.background);
        const ext = bgPath.toLowerCase().split(".").pop();
        if (ext === "mp4" || ext === "webm" || ext === "mov") {
          // Video: use file:// URL (works when HTML and video are on same machine)
          backgroundVideo = "file:///" + bgPath.replace(/\\/g, "/");
        } else {
          // Image: base64 encode for portability
          const imgBuf = readFileSync(bgPath);
          const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
          backgroundImage = `data:${mime};base64,${imgBuf.toString("base64")}`;
        }
      }

      const html = generateEditPreview({
        words,
        duration: opts.duration,
        style: opts.style,
        brandColor: opts.brandColor,
        captionPreset: opts.captionStyle,
        width: opts.width,
        height: opts.height,
        speakerName: opts.speakerName,
        speakerTitle: opts.speakerTitle,
        maxWordsPerGroup: opts.maxWords,
        captionPosition: opts.captionPosition,
        captionsOnly: opts.captionsOnly,
        backgroundImage,
        backgroundVideo,
      });

      const outputPath = resolve(opts.output);
      await writeFile(outputPath, html, "utf-8");

      spinner.succeed(
        chalk.green(`Preview saved to ${outputPath}`) +
          chalk.dim(" — open in browser to view")
      );
    } catch (err: any) {
      spinner.fail(chalk.red("Preview generation failed"));
      console.error(chalk.red(`\n  ${err.message}\n`));
      process.exit(1);
    }
  });

program
  .command("edit")
  .description("Edit a video with auto-generated captions and motion graphics")
  .argument("<input>", "Path to source video file")
  .option("-o, --output <path>", "Output file path", "./edited.mp4")
  .option("-s, --style <preset>", "Style preset (neo-brutalist, clean-minimal, corporate, bold-dark, poster-modernist)", "neo-brutalist")
  .option("--caption-style <style>", "Caption style (pop-in, karaoke, highlight, minimal, bold-center)", "pop-in")
  .option("--format <format>", "Output format (landscape, vertical, square, source)", "source")
  .option("--brand-color <hex>", "Override primary brand color")
  .option("--srt <path>", "Use existing SRT file (skip transcription)")
  .option("--word-timings <path>", "Use existing WhisperX word timings JSON")
  .option("--speaker-name <name>", "Speaker name for lower third")
  .option("--speaker-title <title>", "Speaker title for lower third")
  .option("--max-words <n>", "Max words per caption group", parseInt, 4)
  .option("--caption-position <pos>", "Caption position (bottom, center, top)", "bottom")
  .option("--captions-only", "Skip overlay generation, only add captions")
  .option("--quality <speed>", "Encoding quality (fast, balanced, slow, lossless)", "balanced")
  .action(async (input: string, opts) => {
    const spinner = ora();

    console.log(
      chalk.bold("\n  FrameForge ") +
        chalk.dim(`v${getVersion()} — edit`) +
        "\n"
    );

    try {
      spinner.start(chalk.dim("Starting video edit..."));

      const { editVideo } = await import("./editor.js");
      const result = await editVideo({
        input,
        output: opts.output,
        style: opts.style,
        brandColor: opts.brandColor,
        captionPreset: opts.captionStyle,
        format: opts.format,
        encodingSpeed: opts.quality,
        srtPath: opts.srt,
        wordTimingsPath: opts.wordTimings,
        speakerName: opts.speakerName,
        speakerTitle: opts.speakerTitle,
        maxWordsPerGroup: opts.maxWords,
        captionPosition: opts.captionPosition,
        captionsOnly: opts.captionsOnly,
        onProgress: (stage, detail) => {
          spinner.text = chalk.dim(`[${stage}] ${detail}`);
        },
      });

      spinner.succeed(
        chalk.green(`Edited video saved to ${result.outputPath}`) +
          chalk.dim(
            ` (${result.wordCount} words, ${result.captionGroupCount} caption groups, ` +
              `${result.overlayCount} overlays, ${(result.durationMs / 1000).toFixed(1)}s)`
          )
      );
    } catch (err: any) {
      spinner.fail(chalk.red("Edit failed"));
      console.error(chalk.red(`\n  ${err.message}\n`));

      if (err.message.includes("ffprobe") || err.message.includes("FFmpeg")) {
        console.error(
          chalk.yellow("  Hint: Install FFmpeg — https://ffmpeg.org/download.html\n")
        );
      }
      if (err.message.includes("speech recognition")) {
        console.error(
          chalk.yellow(
            "  Hint: Install WhisperX (pip install whisperx) or provide --srt <file>\n"
          )
        );
      }

      process.exit(1);
    }
  });

program
  .command("render-overlays")
  .description(
    "Render agent-produced overlay decisions onto a video.\n" +
    "Any AI model (Claude, GPT, Gemini, local) can produce the overlays JSON.\n" +
    "See EDIT-AGENT-CONTRACT.md for the overlay specification."
  )
  .argument("<input>", "Path to source video file")
  .option("--overlays <path>", "Path to overlay decisions JSON (from AI agent)")
  .option("-o, --output <path>", "Output file path", "./output-with-overlays.mp4")
  .option("--srt <path>", "SRT file for captions")
  .option("--word-timings <path>", "WhisperX word timings JSON for captions")
  .option("--caption-style <style>", "Caption style (pop-in, karaoke, highlight, minimal, bold-center)", "pop-in")
  .option("--caption-position <pos>", "Caption position (bottom, center, top)", "bottom")
  .option("--max-words <n>", "Max words per caption group", parseInt, 4)
  .option("--captions-only", "Skip overlays, only render captions")
  .option("-s, --style <preset>", "Style for captions (bold-dark, poster-modernist, neo-brutalist)", "bold-dark")
  .option("--brand-color <hex>", "Caption accent color")
  .option("--format <format>", "Output format (landscape, vertical, square, source)", "source")
  .option("--quality <speed>", "Encoding quality (fast, balanced, slow, lossless)", "balanced")
  .action(async (input: string, opts) => {
    const spinner = ora();

    console.log(
      chalk.bold("\n  FrameForge ") +
        chalk.dim(`v${getVersion()} — render-overlays`) +
        "\n"
    );

    if (!opts.overlays && !opts.captionsOnly) {
      console.error(chalk.red("\n  Error: --overlays <path> is required (or use --captions-only).\n"));
      console.error(
        chalk.yellow(
          "  Workflow:\n" +
          "    1. frameforge extract-transcript video.mp4 -o transcript.json\n" +
          "    2. Agent reads transcript.json + EDIT-AGENT-CONTRACT.md\n" +
          "    3. Agent writes overlay-decisions.json\n" +
          "    4. frameforge render-overlays video.mp4 --overlays overlay-decisions.json\n"
        )
      );
      process.exit(1);
    }

    try {
      spinner.start(chalk.dim("Rendering agent overlays..."));

      const { editVideoWithOverlays } = await import("./editor.js");
      const result = await editVideoWithOverlays({
        input,
        output: opts.output,
        overlaysPath: opts.overlays || "",
        srtPath: opts.srt,
        wordTimingsPath: opts.wordTimings,
        captionPreset: opts.captionStyle,
        captionPosition: opts.captionPosition,
        maxWordsPerGroup: opts.maxWords,
        captionsOnly: opts.captionsOnly,
        style: opts.style,
        brandColor: opts.brandColor,
        format: opts.format,
        encodingSpeed: opts.quality,
        onProgress: (stage, detail) => {
          spinner.text = chalk.dim(`[${stage}] ${detail}`);
        },
      });

      spinner.succeed(
        chalk.green(`Rendered to ${result.outputPath}`) +
          chalk.dim(
            ` (${result.overlayCount} overlays, ${result.captionGroupCount} caption groups, ${(result.durationMs / 1000).toFixed(1)}s)`
          )
      );
    } catch (err: any) {
      spinner.fail(chalk.red("Render failed"));
      console.error(chalk.red(`\n  ${err.message}\n`));
      if (err.message.includes("ffprobe") || err.message.includes("FFmpeg")) {
        console.error(chalk.yellow("  Hint: Install FFmpeg — https://ffmpeg.org/download.html\n"));
      }
      process.exit(1);
    }
  });

program
  .command("extract-transcript")
  .description("Extract a transcript from a video — produces the JSON that AI agents read")
  .argument("<input>", "Path to video file")
  .option("-o, --output <path>", "Output JSON path", "./transcript.json")
  .option("--srt <path>", "Use existing SRT instead of running speech recognition")
  .option("--word-timings <path>", "Use existing WhisperX JSON instead of running speech recognition")
  .action(async (input: string, opts) => {
    const spinner = ora();

    console.log(
      chalk.bold("\n  FrameForge ") +
        chalk.dim(`v${getVersion()} — extract-transcript`) +
        "\n"
    );

    try {
      spinner.start(chalk.dim("Extracting transcript..."));

      const { extractTranscript } = await import("./editor.js");
      await extractTranscript({
        input,
        output: opts.output,
        srtPath: opts.srt,
        wordTimingsPath: opts.wordTimings,
        onProgress: (stage, detail) => {
          spinner.text = chalk.dim(`[${stage}] ${detail}`);
        },
      });

      spinner.succeed(
        chalk.green(`Transcript saved to ${opts.output}`) +
          chalk.dim(" — pass this to your AI agent with EDIT-AGENT-CONTRACT.md")
      );
    } catch (err: any) {
      spinner.fail(chalk.red("Extraction failed"));
      console.error(chalk.red(`\n  ${err.message}\n`));
      if (err.message.includes("speech recognition")) {
        console.error(
          chalk.yellow("  Hint: Install WhisperX (pip install whisperx) or provide --srt <file>\n")
        );
      }
      process.exit(1);
    }
  });

// === CLI Helpers ===

function srtToWordTimings(
  entries: Array<{ startMs: number; endMs: number; text: string }>
): Array<{ word: string; start: number; end: number; confidence: number }> {
  const words: Array<{ word: string; start: number; end: number; confidence: number }> = [];
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

function generateSampleWords(
  duration: number
): Array<{ word: string; start: number; end: number; confidence: number }> {
  const sentences = [
    "So you can create your own social media AI agent manager that is going to post for you.",
    "What's up, everyone?",
    "Hey, if you're new here, my name is Creator.",
    "My background is in business development.",
    "This last year has been spent building agent workflows.",
    "We built the first AI client acquisition system for agencies.",
    "Used by 50 plus partners to automate client acquisition.",
    "The key thing is automation saves you time.",
    "Let me show you how it works.",
    "Step one: connect your accounts.",
    "Step two: set your schedule.",
    "Step three: watch the magic happen.",
    "This is a game changer for small businesses.",
    "Follow for more tips on automation.",
  ];

  const words: Array<{ word: string; start: number; end: number; confidence: number }> = [];
  let t = 0.2;
  const sentenceDur = Math.max(2, duration / sentences.length);

  for (let s = 0; s < sentences.length && t < duration - 1; s++) {
    const sWords = sentences[s].split(/\s+/);
    const wordDur = (sentenceDur - 0.5) / sWords.length;
    for (const w of sWords) {
      if (t >= duration - 1) break;
      words.push({ word: w, start: t, end: t + wordDur * 0.9, confidence: 0.95 });
      t += wordDur;
    }
    t += 0.5; // pause between sentences
  }

  return words;
}

program.parse();
