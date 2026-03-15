import { z } from "zod";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { render } from "./renderer.js";
import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Supported FFmpeg xfade transitions
export const TRANSITIONS = [
  "fade",
  "fadeblack",
  "fadewhite",
  "dissolve",
  "wipeleft",
  "wiperight",
  "wipeup",
  "wipedown",
  "slideleft",
  "slideright",
  "slideup",
  "slidedown",
  "circlecrop",
  "rectcrop",
  "circleopen",
  "circleclose",
  "radial",
  "smoothleft",
  "smoothright",
  "smoothup",
  "smoothdown",
  "pixelize",
  "zoomin",
] as const;

export type TransitionType = (typeof TRANSITIONS)[number];

const TransitionSchema = z.object({
  type: z.enum(TRANSITIONS).default("fade"),
  duration: z.number().positive().default(0.5),
});

const CompositionSceneSchema = z.object({
  entry: z.string(),
  duration: z.number().positive(),
  background: z.string().default("#000000"),
  transition: TransitionSchema.optional(),
});

const CompositionSchema = z.object({
  version: z.string().default("1.0"),
  name: z.string().optional(),
  canvas: z
    .object({
      width: z.number().int().positive().default(1920),
      height: z.number().int().positive().default(1080),
      fps: z.number().int().positive().default(30),
    })
    .default({}),
  scenes: z.array(CompositionSceneSchema).min(1),
  audio: z
    .array(
      z.object({
        src: z.string(),
        startAt: z.number().default(0),
        volume: z.number().min(0).max(1).default(1.0),
      })
    )
    .default([]),
  render: z
    .object({
      codec: z.enum(["h264", "h265"]).default("h264"),
      quality: z.enum(["low", "medium", "high", "lossless"]).default("high"),
      pixelFormat: z.string().default("yuv420p"),
      output: z.string().default("./output.mp4"),
    })
    .default({}),
});

export type Composition = z.infer<typeof CompositionSchema>;
export type CompositionScene = z.infer<typeof CompositionSceneSchema>;

export async function parseComposition(
  input: string | Record<string, unknown>
): Promise<Composition> {
  let data: unknown;
  if (typeof input === "string") {
    const raw = await readFile(resolve(input), "utf-8");
    data = JSON.parse(raw);
  } else {
    data = input;
  }
  return CompositionSchema.parse(data);
}

export interface ComposeOptions {
  input: string;
  output?: string;
  onProgress?: (message: string) => void;
}

/**
 * Compose multiple scenes into a single video with transitions.
 *
 * Strategy:
 * 1. Render each scene to a temporary MP4
 * 2. Use FFmpeg xfade filter to join scenes with transitions
 * 3. Clean up temp files
 */
export async function compose(options: ComposeOptions): Promise<string> {
  const inputPath = resolve(options.input);
  const composition = await parseComposition(inputPath);
  const manifestDir = dirname(inputPath);

  const outputPath = resolve(
    options.output ?? resolve(manifestDir, composition.render.output)
  );
  await mkdir(dirname(outputPath), { recursive: true });

  const tempDir = join(tmpdir(), `frameforge-compose-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });

  const tempFiles: string[] = [];

  try {
    // Step 1: Render each scene to a temp MP4
    for (let i = 0; i < composition.scenes.length; i++) {
      const scene = composition.scenes[i];
      const tempOutput = join(tempDir, `scene-${i}.mp4`);
      tempFiles.push(tempOutput);

      options.onProgress?.(
        `Rendering scene ${i + 1}/${composition.scenes.length}...`
      );

      await render({
        input: resolve(manifestDir, scene.entry),
        output: tempOutput,
        duration: scene.duration,
        fps: composition.canvas.fps,
        width: composition.canvas.width,
        height: composition.canvas.height,
      });
    }

    // Step 2: Join with transitions using FFmpeg xfade
    if (tempFiles.length === 1) {
      // Single scene — just copy
      await copyFile(tempFiles[0], outputPath);
    } else {
      options.onProgress?.("Compositing scenes with transitions...");
      await joinWithTransitions(
        tempFiles,
        composition.scenes,
        composition,
        outputPath
      );
    }

    return outputPath;
  } finally {
    // Cleanup temp files
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function copyFile(src: string, dest: string): Promise<void> {
  const { copyFile: cp } = await import("node:fs/promises");
  await cp(src, dest);
}

async function joinWithTransitions(
  tempFiles: string[],
  scenes: CompositionScene[],
  composition: Composition,
  outputPath: string
): Promise<void> {
  // Build the FFmpeg xfade filter chain
  // For N scenes, we need N-1 xfade filters chained together
  const args: string[] = ["-y"];

  // Add all input files
  for (const file of tempFiles) {
    args.push("-i", file);
  }

  if (tempFiles.length === 2) {
    // Simple case: 2 scenes, 1 transition
    const transition = scenes[0].transition;
    const transType = transition?.type ?? "fade";
    const transDur = transition?.duration ?? 0.5;
    const offset = scenes[0].duration - transDur;

    args.push(
      "-filter_complex",
      `[0:v][1:v]xfade=transition=${transType}:duration=${transDur}:offset=${offset}[v]`,
      "-map",
      "[v]",
      "-c:v",
      composition.render.codec === "h265" ? "libx265" : "libx264",
      "-pix_fmt",
      composition.render.pixelFormat
    );
  } else {
    // Chain multiple xfade filters
    const filters: string[] = [];
    let prevLabel = "0:v";
    let cumulativeOffset = 0;

    for (let i = 0; i < tempFiles.length - 1; i++) {
      const transition = scenes[i].transition;
      const transType = transition?.type ?? "fade";
      const transDur = transition?.duration ?? 0.5;

      cumulativeOffset += scenes[i].duration - transDur;
      const outLabel = i < tempFiles.length - 2 ? `v${i}` : "v";

      filters.push(
        `[${prevLabel}][${i + 1}:v]xfade=transition=${transType}:duration=${transDur}:offset=${cumulativeOffset}[${outLabel}]`
      );

      prevLabel = outLabel;
    }

    args.push(
      "-filter_complex",
      filters.join(";"),
      "-map",
      "[v]",
      "-c:v",
      composition.render.codec === "h265" ? "libx265" : "libx264",
      "-pix_fmt",
      composition.render.pixelFormat
    );
  }

  // Audio handling
  if (composition.audio.length > 0) {
    // TODO: mix audio tracks
    args.push("-an"); // no audio for now in compose
  }

  args.push(outputPath);

  // Run FFmpeg
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `FFmpeg composition failed (code ${code}).\nstderr: ${stderr.slice(-500)}`
          )
        );
    });
    proc.on("error", (err) => {
      reject(
        new Error(
          `Failed to spawn FFmpeg: ${err.message}\nMake sure FFmpeg is installed.`
        )
      );
    });
  });
}
