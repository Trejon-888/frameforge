import { resolveSoundPath, hasSound } from "./library.js";

/**
 * A sound cue to mix into the audio at a precise timestamp.
 *
 * These come from the scene composition format's `sound` array:
 * ```json
 * { "type": "whoosh-in", "time": 0.3, "volume": 0.7 }
 * ```
 */
export interface SoundCue {
  /** Sound name from the library (e.g., "kick", "whoosh-in", "pop") */
  type: string;
  /** Timestamp in seconds where the sound should play */
  time: number;
  /** Volume level 0-1 (default: 0.7) */
  volume?: number;
  /** Stereo pan position -1 (left) to 1 (right) (default: 0 = center) */
  pan?: number;
}

/**
 * Options for building the audio mix FFmpeg arguments.
 */
export interface AudioMixOptions {
  /** Path to the source video file (input 0) */
  sourceVideo: string;
  /** Sound cues to mix in */
  cues: SoundCue[];
  /** Output file path */
  output: string;
  /** Audio codec (default: "aac") */
  audioCodec?: string;
  /** Audio bitrate (default: "192k") */
  audioBitrate?: string;
  /** Master volume for all sound cues (default: 1.0) — multiplied with per-cue volume */
  masterVolume?: number;
}

/**
 * Default volume for sound cues when not specified.
 */
const DEFAULT_CUE_VOLUME = 0.7;

/**
 * Build FFmpeg arguments that mix sound cues into a source video's audio track.
 *
 * Architecture:
 * - Input 0: source video (video + original audio)
 * - Inputs 1..N: sound effect WAV files (one per cue)
 * - filter_complex: adelay each cue to its timestamp, apply volume, then amix all together
 * - Output: video copied, audio re-encoded with mixed sound cues
 *
 * The generated filter graph looks like:
 * ```
 * [1:a]adelay=300|300,volume=0.7[s0];
 * [2:a]adelay=2000|2000,volume=0.5[s1];
 * [0:a][s0][s1]amix=inputs=3:duration=first:dropout_transition=0[aout]
 * ```
 *
 * @param options - Mix configuration
 * @returns Array of FFmpeg CLI arguments
 * @throws Error if a sound cue references an unknown sound name
 */
export function buildAudioMixArgs(options: AudioMixOptions): string[] {
  const {
    sourceVideo,
    cues,
    output,
    audioCodec = "aac",
    audioBitrate = "192k",
    masterVolume = 1.0,
  } = options;

  // No cues — just copy the source as-is
  if (cues.length === 0) {
    return ["-y", "-i", sourceVideo, "-c", "copy", output];
  }

  // Validate all cue sound names exist in the library
  const unknownCues = cues.filter((c) => !hasSound(c.type));
  if (unknownCues.length > 0) {
    const names = unknownCues.map((c) => c.type).join(", ");
    throw new Error(
      `Unknown sound cue(s): ${names}. ` +
        `Use listSounds() to see available sounds.`
    );
  }

  const args: string[] = ["-y"];

  // Input 0: source video
  args.push("-i", sourceVideo);

  // Inputs 1..N: each sound cue WAV file
  for (const cue of cues) {
    const soundPath = resolveSoundPath(cue.type)!;
    args.push("-i", soundPath);
  }

  // Build filter_complex graph
  const filters: string[] = [];
  const mixLabels: string[] = [];

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const inputIdx = i + 1; // 0 is source video
    const label = `s${i}`;
    const delayMs = Math.round(cue.time * 1000);
    const volume = (cue.volume ?? DEFAULT_CUE_VOLUME) * masterVolume;

    // adelay: delay in ms, both channels (L|R)
    // volume: scale the cue volume
    filters.push(
      `[${inputIdx}:a]adelay=${delayMs}|${delayMs},volume=${volume}[${label}]`
    );
    mixLabels.push(`[${label}]`);
  }

  // amix: merge source audio + all delayed cues
  // duration=first: output length matches source video
  // dropout_transition=0: no fade-out when inputs end
  const totalInputs = cues.length + 1; // source audio + cues
  filters.push(
    `[0:a]${mixLabels.join("")}amix=inputs=${totalInputs}:duration=first:dropout_transition=0[aout]`
  );

  args.push("-filter_complex", filters.join(";"));

  // Map video from source (copy, no re-encode)
  args.push("-map", "0:v", "-c:v", "copy");

  // Map mixed audio output
  args.push("-map", "[aout]", "-c:a", audioCodec, "-b:a", audioBitrate);

  // Output path
  args.push(output);

  return args;
}

/**
 * Convenience: build FFmpeg args from just a source path, cue list, and output path.
 * Uses all defaults for codec, bitrate, and master volume.
 */
export function buildSimpleAudioMixArgs(
  sourceVideo: string,
  cues: SoundCue[],
  output: string
): string[] {
  return buildAudioMixArgs({ sourceVideo, cues, output });
}
