import { describe, it, expect } from "vitest";
import { buildAudioMixArgs, buildSimpleAudioMixArgs, type SoundCue } from "./mixer.js";

describe("sound.mixer", () => {
  const SOURCE = "/tmp/source.mp4";
  const OUTPUT = "/tmp/output.mp4";

  describe("buildAudioMixArgs.empty_cues", () => {
    it("returns copy args when cues array is empty", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [],
        output: OUTPUT,
      });

      expect(args).toEqual(["-y", "-i", SOURCE, "-c", "copy", OUTPUT]);
    });

    it("does not include filter_complex for empty cues", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [],
        output: OUTPUT,
      });

      expect(args).not.toContain("-filter_complex");
    });
  });

  describe("buildAudioMixArgs.single_cue", () => {
    const cues: SoundCue[] = [{ type: "kick", time: 1.5, volume: 0.8 }];

    it("includes source video as input 0", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });

      // First -i should be the source
      const firstInputIdx = args.indexOf("-i");
      expect(args[firstInputIdx + 1]).toBe(SOURCE);
    });

    it("includes sound file as input 1", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });

      // Count -i flags — should be 2 (source + 1 cue)
      const inputFlags = args.filter((a, i) => a === "-i").length;
      expect(inputFlags).toBe(2);
    });

    it("generates filter_complex with adelay and volume", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });

      const filterIdx = args.indexOf("-filter_complex");
      expect(filterIdx).toBeGreaterThan(-1);

      const filter = args[filterIdx + 1];
      // 1.5s * 1000 = 1500ms delay
      expect(filter).toContain("adelay=1500|1500");
      expect(filter).toContain("volume=0.8");
    });

    it("generates amix with inputs=2 (source + 1 cue)", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });

      const filterIdx = args.indexOf("-filter_complex");
      const filter = args[filterIdx + 1];
      expect(filter).toContain("amix=inputs=2");
    });

    it("maps video as copy (no re-encode)", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });

      expect(args).toContain("-c:v");
      const cvIdx = args.indexOf("-c:v");
      expect(args[cvIdx + 1]).toBe("copy");
    });

    it("maps mixed audio with aac codec", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });

      expect(args).toContain("-c:a");
      const caIdx = args.indexOf("-c:a");
      expect(args[caIdx + 1]).toBe("aac");
    });

    it("output path is last argument", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });

      expect(args[args.length - 1]).toBe(OUTPUT);
    });
  });

  describe("buildAudioMixArgs.timestamp_conversion", () => {
    it("converts 0 seconds to 0ms delay", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "click", time: 0 }],
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("adelay=0|0");
    });

    it("converts 2.5 seconds to 2500ms delay", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "snap", time: 2.5 }],
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("adelay=2500|2500");
    });

    it("converts 0.3 seconds to 300ms delay (rounds correctly)", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "pop", time: 0.3 }],
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("adelay=300|300");
    });

    it("converts 10.123 seconds to 10123ms delay", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "ding", time: 10.123 }],
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("adelay=10123|10123");
    });

    it("handles sub-millisecond precision with rounding", () => {
      // 0.1 + 0.2 = 0.30000000000000004 in JS
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "click", time: 0.1 + 0.2 }],
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      // Math.round(300.00000000000004) = 300
      expect(filter).toContain("adelay=300|300");
    });
  });

  describe("buildAudioMixArgs.volume_scaling", () => {
    it("uses default volume 0.7 when not specified", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "kick", time: 0 }],
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("volume=0.7");
    });

    it("uses explicit volume when provided", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "kick", time: 0, volume: 0.3 }],
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("volume=0.3");
    });

    it("applies masterVolume multiplier to cue volume", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "kick", time: 0, volume: 0.5 }],
        output: OUTPUT,
        masterVolume: 0.8,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      // 0.5 * 0.8 = 0.4
      expect(filter).toContain("volume=0.4");
    });

    it("applies masterVolume to default cue volume", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "kick", time: 0 }],
        output: OUTPUT,
        masterVolume: 0.5,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      // 0.7 (default) * 0.5 = 0.35
      expect(filter).toContain(`volume=${0.7 * 0.5}`);
    });

    it("full volume (1.0) is preserved", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "kick", time: 0, volume: 1.0 }],
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("volume=1");
    });
  });

  describe("buildAudioMixArgs.multiple_cues", () => {
    it("creates correct number of inputs for 3 cues", () => {
      const cues: SoundCue[] = [
        { type: "whoosh-in", time: 0.3 },
        { type: "kick", time: 2.0 },
        { type: "pop", time: 4.5 },
      ];

      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });

      const inputCount = args.filter((a) => a === "-i").length;
      expect(inputCount).toBe(4); // 1 source + 3 cues
    });

    it("generates amix with correct input count", () => {
      const cues: SoundCue[] = [
        { type: "whoosh-in", time: 0.3 },
        { type: "kick", time: 2.0 },
        { type: "pop", time: 4.5 },
      ];

      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("amix=inputs=4"); // source + 3 cues
    });

    it("each cue gets its own adelay+volume filter", () => {
      const cues: SoundCue[] = [
        { type: "whoosh-in", time: 0.3, volume: 0.6 },
        { type: "kick", time: 2.0, volume: 0.9 },
      ];

      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("[1:a]adelay=300|300,volume=0.6[s0]");
      expect(filter).toContain("[2:a]adelay=2000|2000,volume=0.9[s1]");
    });

    it("amix references all cue labels in order", () => {
      const cues: SoundCue[] = [
        { type: "snap", time: 1.0 },
        { type: "click", time: 2.0 },
        { type: "ding", time: 3.0 },
      ];

      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("[0:a][s0][s1][s2]amix=inputs=4");
    });
  });

  describe("buildAudioMixArgs.same_timestamp", () => {
    it("handles multiple cues at the same timestamp", () => {
      const cues: SoundCue[] = [
        { type: "kick", time: 1.0, volume: 0.8 },
        { type: "whoosh-in", time: 1.0, volume: 0.5 },
      ];

      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      // Both should have the same delay
      expect(filter).toContain("[1:a]adelay=1000|1000,volume=0.8[s0]");
      expect(filter).toContain("[2:a]adelay=1000|1000,volume=0.5[s1]");
      // amix should combine all
      expect(filter).toContain("amix=inputs=3");
    });
  });

  describe("buildAudioMixArgs.filter_graph_structure", () => {
    it("uses duration=first to match source video length", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "kick", time: 0 }],
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("duration=first");
    });

    it("uses dropout_transition=0 to prevent fade-out", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "kick", time: 0 }],
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("dropout_transition=0");
    });

    it("filter stages are semicolon-separated", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [
          { type: "kick", time: 0 },
          { type: "snap", time: 1 },
        ],
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      const stages = filter.split(";");
      // 2 cue filters + 1 amix = 3 stages
      expect(stages).toHaveLength(3);
    });

    it("output label is [aout]", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "kick", time: 0 }],
        output: OUTPUT,
      });

      const filter = args[args.indexOf("-filter_complex") + 1];
      expect(filter).toContain("[aout]");
      expect(args).toContain("-map");
      // Check that [aout] is mapped
      const mapIndices = args.reduce<number[]>((acc, a, i) => {
        if (a === "-map") acc.push(i);
        return acc;
      }, []);
      const mapValues = mapIndices.map((i) => args[i + 1]);
      expect(mapValues).toContain("[aout]");
    });
  });

  describe("buildAudioMixArgs.custom_options", () => {
    it("uses custom audio codec", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "kick", time: 0 }],
        output: OUTPUT,
        audioCodec: "libmp3lame",
      });

      const caIdx = args.indexOf("-c:a");
      expect(args[caIdx + 1]).toBe("libmp3lame");
    });

    it("uses custom audio bitrate", () => {
      const args = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues: [{ type: "kick", time: 0 }],
        output: OUTPUT,
        audioBitrate: "320k",
      });

      const baIdx = args.indexOf("-b:a");
      expect(args[baIdx + 1]).toBe("320k");
    });
  });

  describe("buildAudioMixArgs.unknown_sound", () => {
    it("throws for unknown sound name", () => {
      expect(() =>
        buildAudioMixArgs({
          sourceVideo: SOURCE,
          cues: [{ type: "nonexistent-sound", time: 0 }],
          output: OUTPUT,
        })
      ).toThrow("Unknown sound cue(s): nonexistent-sound");
    });

    it("lists all unknown sounds in error message", () => {
      expect(() =>
        buildAudioMixArgs({
          sourceVideo: SOURCE,
          cues: [
            { type: "bad-one", time: 0 },
            { type: "kick", time: 1 },
            { type: "bad-two", time: 2 },
          ],
          output: OUTPUT,
        })
      ).toThrow("Unknown sound cue(s): bad-one, bad-two");
    });

    it("suggests listSounds() in error message", () => {
      expect(() =>
        buildAudioMixArgs({
          sourceVideo: SOURCE,
          cues: [{ type: "nope", time: 0 }],
          output: OUTPUT,
        })
      ).toThrow("listSounds()");
    });
  });

  describe("buildSimpleAudioMixArgs", () => {
    it("delegates to buildAudioMixArgs with defaults", () => {
      const cues: SoundCue[] = [{ type: "kick", time: 1.0 }];
      const full = buildAudioMixArgs({
        sourceVideo: SOURCE,
        cues,
        output: OUTPUT,
      });
      const simple = buildSimpleAudioMixArgs(SOURCE, cues, OUTPUT);

      expect(simple).toEqual(full);
    });

    it("returns copy args for empty cues", () => {
      const args = buildSimpleAudioMixArgs(SOURCE, [], OUTPUT);
      expect(args).toEqual(["-y", "-i", SOURCE, "-c", "copy", OUTPUT]);
    });
  });
});
