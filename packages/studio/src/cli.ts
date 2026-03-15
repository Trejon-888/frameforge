#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { startStudio } from "./server.js";

const program = new Command();

program
  .name("frameforge-studio")
  .description("FrameForge Studio — visual preview with timeline scrubbing")
  .argument("<input>", "Path to HTML file or scene manifest JSON")
  .option("-p, --port <number>", "Server port", parseInt, 6639)
  .option("--host <address>", "Server host", "localhost")
  .option("-d, --duration <seconds>", "Duration (required for HTML)", parseFloat)
  .option("--fps <number>", "Frames per second", parseInt)
  .option("--width <pixels>", "Width in pixels", parseInt)
  .option("--height <pixels>", "Height in pixels", parseInt)
  .action(async (input: string, opts) => {
    console.log(
      chalk.bold("\n  FrameForge Studio\n")
    );

    try {
      const studio = await startStudio({
        input,
        port: opts.port,
        host: opts.host,
        duration: opts.duration,
        fps: opts.fps,
        width: opts.width,
        height: opts.height,
      });

      console.log(
        chalk.green(`  Studio running at `) +
          chalk.bold.underline(studio.url) +
          "\n"
      );
      console.log(
        chalk.dim("  Watching for file changes. Press Ctrl+C to stop.\n")
      );

      // Open browser
      try {
        const open = (await import("open")).default;
        await open(studio.url);
      } catch {
        // open is optional
      }

      // Handle shutdown
      process.on("SIGINT", async () => {
        console.log(chalk.dim("\n  Shutting down studio..."));
        await studio.close();
        process.exit(0);
      });
    } catch (err: any) {
      console.error(chalk.red(`  Error: ${err.message}\n`));
      process.exit(1);
    }
  });

program.parse();
