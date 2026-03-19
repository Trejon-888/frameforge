import { spawn, type ChildProcess } from "node:child_process";
import { resolve, dirname } from "node:path";
import { mkdir } from "node:fs/promises";

export interface FFmpegOptions {
  width: number;
  height: number;
  fps: number;
  codec: "h264" | "h265";
  quality: "low" | "medium" | "high" | "lossless";
  pixelFormat: string;
  output: string;
  audioTracks?: Array<{ src: string; startAt: number; volume: number }>;
  /** Override CRF value (takes precedence over quality preset) */
  crf?: number;
  /** FFmpeg encoding preset (ultrafast, fast, medium, slow, veryslow) */
  preset?: string;
  /** Max bitrate constraint (e.g., "8000k") */
  maxrate?: string;
  /** Buffer size for rate control (e.g., "16000k") */
  bufsize?: string;
  /** Audio bitrate (e.g., "256k") */
  audioBitrate?: string;
}

/**
 * Options for compositing transparent overlay frames on top of a source video.
 * This is the correct architecture for video editing — the source video is
 * handled natively by FFmpeg (smooth, frame-accurate) while overlays are
 * rendered as transparent PNGs via Puppeteer.
 */
export interface CompositeOptions {
  /** Path to source video file */
  sourceVideo: string;
  /** Output dimensions */
  width: number;
  height: number;
  /** Overlay frame rate (must match source) */
  fps: number;
  /** Output file path */
  output: string;
  /** CRF value for encoding */
  crf?: number;
  /** FFmpeg encoding preset */
  preset?: string;
  /** Max bitrate constraint */
  maxrate?: string;
  /** Buffer size for rate control */
  bufsize?: string;
  /** Audio bitrate (e.g., "256k") */
  audioBitrate?: string;
  /** Pixel format for output (default: yuv420p) */
  pixelFormat?: string;
}

const QUALITY_CRF: Record<string, number> = {
  low: 28,
  medium: 23,
  high: 18,
  lossless: 0,
};

const CODEC_MAP: Record<string, string> = {
  h264: "libx264",
  h265: "libx265",
};

/**
 * Creates an FFmpeg pipeline that accepts PNG frames on stdin
 * and produces an MP4 file.
 */
export async function encodeVideo(
  options: FFmpegOptions
): Promise<FFmpegPipeline> {
  const outputPath = resolve(options.output);
  await mkdir(dirname(outputPath), { recursive: true });

  const codec = CODEC_MAP[options.codec] || "libx264";
  const crf = options.crf ?? QUALITY_CRF[options.quality] ?? 18;
  const preset = options.preset || "medium";

  const args = [
    // Input: raw PNG frames from stdin
    "-y",
    "-f",
    "image2pipe",
    "-framerate",
    String(options.fps),
    "-i",
    "pipe:0",

    // Video encoding
    "-c:v",
    codec,
    "-crf",
    String(crf),
    "-pix_fmt",
    options.pixelFormat,
    "-preset",
    preset,

    // Ensure dimensions are even (required by H.264)
    "-vf",
    `scale=trunc(iw/2)*2:trunc(ih/2)*2`,
  ];

  // Add rate control if specified (for quality matching)
  if (options.maxrate) {
    args.push("-maxrate", options.maxrate);
  }
  if (options.bufsize) {
    args.push("-bufsize", options.bufsize);
  }

  // Add audio tracks if provided
  if (options.audioTracks && options.audioTracks.length > 0) {
    for (const track of options.audioTracks) {
      args.push("-i", resolve(track.src));
    }

    // Build complex filter for audio mixing
    if (options.audioTracks.length === 1) {
      const track = options.audioTracks[0];
      args.push(
        "-filter_complex",
        `[1:a]adelay=${track.startAt * 1000}|${track.startAt * 1000},volume=${track.volume}[a]`,
        "-map",
        "0:v",
        "-map",
        "[a]",
        "-c:a",
        "aac",
        "-b:a",
        options.audioBitrate || "192k"
      );
    } else {
      const filters: string[] = [];
      const inputs: string[] = [];
      options.audioTracks.forEach((track, i) => {
        const label = `a${i}`;
        filters.push(
          `[${i + 1}:a]adelay=${track.startAt * 1000}|${track.startAt * 1000},volume=${track.volume}[${label}]`
        );
        inputs.push(`[${label}]`);
      });
      filters.push(`${inputs.join("")}amix=inputs=${options.audioTracks.length}[aout]`);
      args.push(
        "-filter_complex",
        filters.join(";"),
        "-map",
        "0:v",
        "-map",
        "[aout]",
        "-c:a",
        "aac",
        "-b:a",
        options.audioBitrate || "192k"
      );
    }
  }

  // Output
  args.push(outputPath);

  const process = spawn("ffmpeg", args, {
    stdio: ["pipe", "pipe", "pipe"],
  });

  return new FFmpegPipeline(process, outputPath);
}

export class FFmpegPipeline {
  private process: ChildProcess;
  private stderr: string = "";
  private exited: boolean = false;
  private exitCode: number | null = null;
  readonly outputPath: string;

  constructor(process: ChildProcess, outputPath: string) {
    this.process = process;
    this.outputPath = outputPath;

    process.stderr?.on("data", (data: Buffer) => {
      this.stderr += data.toString();
    });

    // Track early exits so writeFrame can reject instead of silently failing
    process.on("close", (code) => {
      this.exited = true;
      this.exitCode = code;
    });
  }

  /**
   * Write a PNG frame buffer to FFmpeg's stdin.
   * Rejects if FFmpeg has already exited (e.g., invalid filter, codec error).
   */
  writeFrame(pngBuffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.exited) {
        reject(
          new Error(
            `FFmpeg exited unexpectedly (code ${this.exitCode}) before all frames were written.\n` +
              `stderr: ${this.stderr.slice(-500)}`
          )
        );
        return;
      }

      const canContinue = this.process.stdin?.write(pngBuffer);
      if (canContinue === false) {
        this.process.stdin?.once("drain", resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Close stdin and wait for FFmpeg to finish encoding.
   */
  async finalize(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.exited) {
        if (this.exitCode === 0) {
          resolve(this.outputPath);
        } else {
          reject(
            new Error(
              `FFmpeg exited with code ${this.exitCode}.\n` +
                `stderr: ${this.stderr.slice(-500)}`
            )
          );
        }
        return;
      }

      this.process.on("close", (code) => {
        if (code === 0) {
          resolve(this.outputPath);
        } else {
          reject(
            new Error(
              `FFmpeg exited with code ${code}.\n` +
                `This usually means FFmpeg is not installed or the codec is unsupported.\n` +
                `stderr: ${this.stderr.slice(-500)}`
            )
          );
        }
      });

      this.process.on("error", (err) => {
        reject(
          new Error(
            `Failed to spawn FFmpeg: ${err.message}\n` +
              `Make sure FFmpeg is installed and available in your PATH.`
          )
        );
      });

      this.process.stdin?.end();
    });
  }
}

/**
 * Composite transparent overlay PNG frames on top of a source video.
 *
 * Architecture: Source video is decoded natively by FFmpeg (smooth, frame-accurate).
 * Overlay frames (with alpha channel) are piped from Puppeteer to stdin.
 * FFmpeg's overlay filter composites them together.
 *
 * This avoids the browser video element seeking problem that causes choppy playback.
 */
export async function compositeVideo(
  options: CompositeOptions
): Promise<FFmpegPipeline> {
  const outputPath = resolve(options.output);
  await mkdir(dirname(outputPath), { recursive: true });

  const crf = options.crf ?? 18;
  const preset = options.preset ?? "medium";
  const pixFmt = options.pixelFormat ?? "yuv420p";

  const args = [
    "-y",
    // Input 0: source video (decoded natively by FFmpeg — smooth & frame-accurate)
    "-i", resolve(options.sourceVideo),
    // Input 1: transparent overlay PNGs piped from Puppeteer
    "-f", "image2pipe",
    "-framerate", String(options.fps),
    "-i", "pipe:0",
    // Composite: scale source to output dimensions, overlay transparent frames on top
    "-filter_complex",
    [
      // Scale source video to target dimensions (handles format changes like vertical/square)
      `[0:v]scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,`,
      `pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2:color=black[base]`,
      `;[1:v]format=rgba[ov]`,
      `;[base][ov]overlay=0:0:shortest=1[out]`,
    ].join(""),
    "-map", "[out]",
    // Copy audio from source if present
    "-map", "0:a?",
    // Video encoding
    "-c:v", "libx264",
    "-crf", String(crf),
    "-pix_fmt", pixFmt,
    "-preset", preset,
    // Force I-frame every second — prevents long GOP chains that cause bitstream corruption
    // with fast presets (ultrafast disables scene detection, leaving only 4-5 I-frames in 73s)
    "-g", String(Math.round(options.fps)),
    // Audio encoding
    "-c:a", "aac",
  ];

  // Rate control
  if (options.maxrate) args.push("-maxrate", options.maxrate);
  if (options.bufsize) args.push("-bufsize", options.bufsize);
  if (options.audioBitrate) args.push("-b:a", options.audioBitrate);

  // Output
  args.push(outputPath);

  const process = spawn("ffmpeg", args, {
    stdio: ["pipe", "pipe", "pipe"],
  });

  return new FFmpegPipeline(process, outputPath);
}
