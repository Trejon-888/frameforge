import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { render } from "./renderer.js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  .command("edit")
  .description("Edit a video with auto-generated captions and motion graphics")
  .argument("<input>", "Path to source video file")
  .option("-o, --output <path>", "Output file path", "./edited.mp4")
  .option("-s, --style <preset>", "Style preset (neo-brutalist, clean-minimal, corporate, bold-dark)", "neo-brutalist")
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

program.parse();
