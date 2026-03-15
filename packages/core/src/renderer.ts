import { resolve, dirname } from "node:path";
import { parseManifest, resolveEntry, type SceneManifest } from "./manifest.js";
import { captureFrames } from "./frame-capture.js";
import { encodeVideo, type FFmpegPipeline } from "./ffmpeg.js";

export interface RenderOptions {
  /** Path to an HTML file or scene manifest JSON */
  input: string;
  /** Output file path (overrides manifest) */
  output?: string;
  /** Duration in seconds (overrides manifest, required for raw HTML) */
  duration?: number;
  /** Frames per second (overrides manifest) */
  fps?: number;
  /** Width in pixels (overrides manifest) */
  width?: number;
  /** Height in pixels (overrides manifest) */
  height?: number;
  /** Progress callback */
  onProgress?: (current: number, total: number) => void;
}

/**
 * Main render function. Takes an HTML file or scene manifest
 * and produces an MP4 video.
 */
export async function render(options: RenderOptions): Promise<string> {
  const { input } = options;
  const inputPath = resolve(input);

  let manifest: SceneManifest;
  let entryPath: string;

  if (inputPath.endsWith(".json")) {
    // Scene manifest
    manifest = await parseManifest(inputPath);
    entryPath = resolveEntry(inputPath, manifest.entry);
    // Resolve output path relative to manifest location (if not overridden by CLI)
    if (!options.output) {
      manifest.render.output = resolve(
        dirname(inputPath),
        manifest.render.output
      );
    }
  } else {
    // Raw HTML file — build a minimal manifest
    if (!options.duration) {
      throw new Error(
        "Duration is required when rendering a raw HTML file.\n" +
          "Use --duration <seconds> or provide a scene manifest JSON."
      );
    }

    manifest = {
      version: "1.0",
      canvas: {
        width: options.width ?? 1920,
        height: options.height ?? 1080,
        fps: options.fps ?? 30,
        duration: options.duration,
        background: "#000000",
      },
      entry: inputPath,
      audio: [],
      render: {
        codec: "h264",
        quality: "high",
        pixelFormat: "yuv420p",
        output: options.output ?? "./output.mp4",
      },
    };
    entryPath = inputPath;
  }

  // Apply CLI overrides
  if (options.fps) manifest.canvas.fps = options.fps;
  if (options.width) manifest.canvas.width = options.width;
  if (options.height) manifest.canvas.height = options.height;
  if (options.duration) manifest.canvas.duration = options.duration;
  if (options.output) manifest.render.output = options.output;

  // Start FFmpeg pipeline
  const pipeline = await encodeVideo({
    width: manifest.canvas.width,
    height: manifest.canvas.height,
    fps: manifest.canvas.fps,
    codec: manifest.render.codec,
    quality: manifest.render.quality,
    pixelFormat: manifest.render.pixelFormat,
    output: manifest.render.output,
    audioTracks:
      manifest.audio.length > 0
        ? manifest.audio.map((a) => ({
            src: a.src,
            startAt: a.startAt,
            volume: a.volume,
          }))
        : undefined,
  });

  // Capture frames and pipe to FFmpeg
  await captureFrames({
    manifest,
    entryPath,
    onFrame: async (frameData, frameNumber) => {
      await pipeline.writeFrame(frameData);
    },
    onProgress: options.onProgress,
  });

  // Finalize encoding
  const outputPath = await pipeline.finalize();
  return outputPath;
}
