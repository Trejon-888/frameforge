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

program.parse();
