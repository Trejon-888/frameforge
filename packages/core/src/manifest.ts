import { z } from "zod";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const AudioTrackSchema = z.object({
  src: z.string(),
  startAt: z.number().default(0),
  volume: z.number().min(0).max(1).default(1.0),
});

const CanvasConfigSchema = z.object({
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().int().positive().default(30),
  duration: z.number().positive(),
  background: z.string().default("#000000"),
});

const RenderConfigSchema = z.object({
  codec: z.enum(["h264", "h265"]).default("h264"),
  quality: z.enum(["low", "medium", "high", "lossless"]).default("high"),
  pixelFormat: z.string().default("yuv420p"),
  output: z.string().default("./output.mp4"),
});

const MetadataSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .optional();

const SceneManifestSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().default("1.0"),
  name: z.string().optional(),
  canvas: CanvasConfigSchema,
  entry: z.string(),
  audio: z.array(AudioTrackSchema).default([]),
  render: RenderConfigSchema.default({}),
  metadata: MetadataSchema,
});

export type SceneManifest = z.infer<typeof SceneManifestSchema>;
export type CanvasConfig = z.infer<typeof CanvasConfigSchema>;
export type AudioTrack = z.infer<typeof AudioTrackSchema>;
export type RenderConfig = z.infer<typeof RenderConfigSchema>;

/**
 * Parse and validate a scene manifest from a JSON file path or object.
 */
export async function parseManifest(
  input: string | Record<string, unknown>
): Promise<SceneManifest> {
  let data: unknown;

  if (typeof input === "string") {
    const raw = await readFile(resolve(input), "utf-8");
    data = JSON.parse(raw);
  } else {
    data = input;
  }

  return SceneManifestSchema.parse(data);
}

/**
 * Resolve the entry HTML path relative to the manifest file location.
 */
export function resolveEntry(
  manifestPath: string,
  entry: string
): string {
  return resolve(dirname(manifestPath), entry);
}
