/**
 * Video Probe — FFprobe wrapper for reading source video metadata.
 *
 * Used by the video editing pipeline to match output quality
 * to source quality (resolution, bitrate, codec, audio settings).
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access } from "node:fs/promises";

const execFileAsync = promisify(execFile);

export interface VideoProbeResult {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Frames per second */
  fps: number;
  /** Duration in seconds */
  duration: number;
  /** Video bitrate in kbps */
  videoBitrate: number;
  /** Video codec name (h264, hevc, vp9, etc.) */
  videoCodec: string;
  /** Pixel format (yuv420p, yuv444p, etc.) */
  pixelFormat: string;
  /** Whether video has an audio stream */
  hasAudio: boolean;
  /** Audio bitrate in kbps (0 if no audio) */
  audioBitrate: number;
  /** Audio codec (aac, opus, mp3, etc.) */
  audioCodec: string;
  /** Audio sample rate in Hz */
  audioSampleRate: number;
  /** Audio channel count */
  audioChannels: number;
  /** Total file size in bytes */
  fileSize: number;
  /** Aspect ratio as string (e.g., "16:9") */
  aspectRatio: string;
  /** Rotation in degrees (for mobile-shot videos) */
  rotation: number;
}

interface FFprobeStream {
  codec_type: string;
  codec_name?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  bit_rate?: string;
  pix_fmt?: string;
  sample_rate?: string;
  channels?: number;
  duration?: string;
  display_aspect_ratio?: string;
  tags?: Record<string, string>;
  side_data_list?: Array<{ rotation?: number }>;
}

interface FFprobeFormat {
  duration?: string;
  size?: string;
  bit_rate?: string;
}

interface FFprobeOutput {
  streams: FFprobeStream[];
  format: FFprobeFormat;
}

/**
 * Probe a video file using ffprobe to extract metadata.
 *
 * @throws Error if ffprobe is not installed or file doesn't exist
 */
export async function probeVideo(filePath: string): Promise<VideoProbeResult> {
  // Verify file exists
  try {
    await access(filePath);
  } catch {
    throw new Error(
      `Video file not found: ${filePath}\n` +
        `Check the file path and try again.`
    );
  }

  let stdout: string;
  try {
    const result = await execFileAsync("ffprobe", [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_streams",
      "-show_format",
      filePath,
    ]);
    stdout = result.stdout;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      throw new Error(
        `ffprobe not found. FFmpeg must be installed.\n` +
          `Install FFmpeg: https://ffmpeg.org/download.html`
      );
    }
    throw new Error(
      `ffprobe failed for ${filePath}: ${err.message}\n` +
        `The file may be corrupted or in an unsupported format.`
    );
  }

  let data: FFprobeOutput;
  try {
    data = JSON.parse(stdout);
  } catch {
    throw new Error(
      `ffprobe returned invalid JSON for ${filePath}.\n` +
        `The file may be corrupted.`
    );
  }

  const videoStream = data.streams.find((s) => s.codec_type === "video");
  const audioStream = data.streams.find((s) => s.codec_type === "audio");

  if (!videoStream) {
    throw new Error(
      `No video stream found in ${filePath}.\n` +
        `This file may be audio-only or in an unsupported format.`
    );
  }

  // Parse frame rate from fractional string like "30000/1001"
  const fps = parseFPS(
    videoStream.avg_frame_rate || videoStream.r_frame_rate || "30/1"
  );

  // Parse duration (prefer format-level, fallback to stream-level)
  const duration = parseFloat(data.format.duration || videoStream.duration || "0");

  // Parse video bitrate (stream-level, fallback to computed from format)
  let videoBitrate = parseInt(videoStream.bit_rate || "0", 10) / 1000;
  if (videoBitrate === 0 && data.format.bit_rate) {
    // Approximate: total bitrate minus audio bitrate
    const totalBitrate = parseInt(data.format.bit_rate, 10) / 1000;
    const audioBr = audioStream ? parseInt(audioStream.bit_rate || "0", 10) / 1000 : 0;
    videoBitrate = Math.max(0, totalBitrate - audioBr);
  }

  // Detect rotation from side data or tags
  let rotation = 0;
  if (videoStream.side_data_list) {
    for (const sd of videoStream.side_data_list) {
      if (sd.rotation !== undefined) {
        rotation = Math.abs(sd.rotation);
      }
    }
  }
  if (rotation === 0 && videoStream.tags?.rotate) {
    rotation = Math.abs(parseInt(videoStream.tags.rotate, 10));
  }

  // Compute effective dimensions (swap if rotated 90/270)
  let width = videoStream.width || 1920;
  let height = videoStream.height || 1080;
  if (rotation === 90 || rotation === 270) {
    [width, height] = [height, width];
  }

  // Compute aspect ratio
  const aspectRatio = computeAspectRatio(width, height);

  return {
    width,
    height,
    fps: Math.round(fps * 100) / 100,
    duration,
    videoBitrate: Math.round(videoBitrate),
    videoCodec: videoStream.codec_name || "unknown",
    pixelFormat: videoStream.pix_fmt || "yuv420p",
    hasAudio: !!audioStream,
    audioBitrate: audioStream
      ? Math.round(parseInt(audioStream.bit_rate || "0", 10) / 1000)
      : 0,
    audioCodec: audioStream?.codec_name || "",
    audioSampleRate: audioStream
      ? parseInt(audioStream.sample_rate || "0", 10)
      : 0,
    audioChannels: audioStream?.channels || 0,
    fileSize: parseInt(data.format.size || "0", 10),
    aspectRatio,
    rotation,
  };
}

/**
 * Compute encoding settings that match or exceed source quality.
 *
 * @param speed - Encoding speed: "fast" (preview), "balanced" (default), "slow" (final), "lossless"
 *   Adjusts CRF relative to the source-matched baseline.
 */
export function computeMatchedEncoding(
  probe: VideoProbeResult,
  speed: "fast" | "balanced" | "slow" | "lossless" = "balanced"
): {
  crf: number;
  preset: string;
  maxrate: string;
  bufsize: string;
  pixelFormat: string;
  audioBitrate: string;
} {
  // CRF based on source bitrate — higher bitrate sources get lower CRF
  let baseCrf: number;
  if (probe.videoBitrate > 10000) {
    baseCrf = 15; // Very high quality source
  } else if (probe.videoBitrate > 5000) {
    baseCrf = 17;
  } else if (probe.videoBitrate > 2000) {
    baseCrf = 19;
  } else {
    baseCrf = 21; // Lower quality source — no need to exceed
  }

  // Adjust CRF based on encoding speed
  const speedOffsets: Record<string, number> = {
    fast: 4,       // Higher CRF = faster, lower quality preview
    balanced: 0,   // Source-matched baseline
    slow: -2,      // Lower CRF = higher quality final output
    lossless: -baseCrf, // CRF 0 = lossless
  };
  const crf = Math.max(0, baseCrf + (speedOffsets[speed] ?? 0));

  // Preset mapped from speed
  const presetMap: Record<string, string> = {
    fast: "ultrafast",
    balanced: "medium",
    slow: "slow",
    lossless: "medium",
  };

  // Maxrate = 1.5x source bitrate to allow headroom
  const maxrate = `${Math.round(probe.videoBitrate * 1.5)}k`;
  const bufsize = `${Math.round(probe.videoBitrate * 3)}k`;

  // Audio bitrate — match source or minimum 192k
  const audioBitrate = `${Math.max(probe.audioBitrate || 192, 192)}k`;

  return {
    crf,
    preset: presetMap[speed] || "medium",
    maxrate,
    bufsize,
    pixelFormat: probe.pixelFormat,
    audioBitrate,
  };
}

/**
 * Determine output format dimensions from a preset name.
 */
export function getFormatDimensions(
  format: "landscape" | "vertical" | "square" | "source",
  sourceWidth: number,
  sourceHeight: number
): { width: number; height: number } {
  switch (format) {
    case "landscape":
      return { width: 1920, height: 1080 };
    case "vertical":
      return { width: 1080, height: 1920 };
    case "square":
      return { width: 1080, height: 1080 };
    case "source":
    default:
      return {
        width: sourceWidth % 2 === 0 ? sourceWidth : sourceWidth + 1,
        height: sourceHeight % 2 === 0 ? sourceHeight : sourceHeight + 1,
      };
  }
}

function parseFPS(rateStr: string): number {
  const parts = rateStr.split("/");
  if (parts.length === 2) {
    const num = parseInt(parts[0], 10);
    const den = parseInt(parts[1], 10);
    if (den > 0) return num / den;
  }
  const parsed = parseFloat(rateStr);
  return isNaN(parsed) ? 30 : parsed;
}

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function computeAspectRatio(width: number, height: number): string {
  const d = gcd(width, height);
  return `${width / d}:${height / d}`;
}
