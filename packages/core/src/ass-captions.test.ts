import { describe, it, expect } from "vitest";
import { hexToASS, formatASSTime, generateASS, assFilterString, buildASSCompositeArgs } from "./ass-captions.js";
import { getStylePreset } from "./edit-styles.js";
import type { CaptionGroup } from "./word-captions.js";

describe("ass-captions", () => {
  describe("hexToASS", () => {
    it("converts white correctly (BGR order)", () => {
      expect(hexToASS("#FFFFFF")).toBe("&H00FFFFFF");
    });

    it("converts red to ASS BGR format", () => {
      // #FF0000 → R=FF, G=00, B=00 → ASS: &H000000FF
      expect(hexToASS("#FF0000")).toBe("&H000000FF");
    });

    it("converts yellow (#FFD700) to ASS BGR", () => {
      // R=FF, G=D7, B=00 → ASS: &H0000D7FF
      expect(hexToASS("#FFD700")).toBe("&H0000D7FF");
    });

    it("applies alpha prefix", () => {
      expect(hexToASS("#000000", 0x60)).toBe("&H60000000");
    });

    it("handles lowercase hex", () => {
      expect(hexToASS("#ff00ff")).toBe("&H00FF00FF");
    });
  });

  describe("formatASSTime", () => {
    it("formats zero", () => {
      expect(formatASSTime(0)).toBe("0:00:00.00");
    });

    it("formats seconds with centiseconds", () => {
      expect(formatASSTime(5.5)).toBe("0:00:05.50");
    });

    it("formats minutes", () => {
      expect(formatASSTime(65.25)).toBe("0:01:05.25");
    });

    it("formats hours", () => {
      expect(formatASSTime(3661.0)).toBe("1:01:01.00");
    });

    it("handles edge case near 1.0", () => {
      const result = formatASSTime(0.99);
      expect(result).toBe("0:00:00.99");
    });

    it("clamps negative to zero", () => {
      expect(formatASSTime(-1)).toBe("0:00:00.00");
    });
  });

  describe("generateASS", () => {
    const mockGroups: CaptionGroup[] = [
      {
        words: [
          { word: "This", start: 0.5, end: 0.8, confidence: 0.99 },
          { word: "Cloud", start: 0.85, end: 1.2, confidence: 0.98 },
          { word: "Code", start: 1.25, end: 1.6, confidence: 0.97 },
        ],
        startMs: 500,
        endMs: 1600,
        text: "This Cloud Code",
      },
      {
        words: [
          { word: "pipeline", start: 1.8, end: 2.3, confidence: 0.95 },
          { word: "takes", start: 2.35, end: 2.6, confidence: 0.94 },
        ],
        startMs: 1800,
        endMs: 2600,
        text: "pipeline takes",
      },
    ];

    const style = getStylePreset("editorial-studio");

    it("produces valid ASS with Script Info header", () => {
      const ass = generateASS(mockGroups, {
        width: 1080,
        height: 1920,
        style,
      });

      expect(ass).toContain("[Script Info]");
      expect(ass).toContain("PlayResX: 1080");
      expect(ass).toContain("PlayResY: 1920");
      expect(ass).toContain("ScriptType: v4.00+");
    });

    it("produces V4+ Styles section with Default and Emph", () => {
      const ass = generateASS(mockGroups, {
        width: 1080,
        height: 1920,
        style,
      });

      expect(ass).toContain("[V4+ Styles]");
      expect(ass).toContain("Style: Default,");
      expect(ass).toContain("Style: Emph,");
    });

    it("produces Dialogue lines for each group", () => {
      const ass = generateASS(mockGroups, {
        width: 1080,
        height: 1920,
        style,
      });

      const dialogueLines = ass.split("\n").filter((l) => l.startsWith("Dialogue:"));
      expect(dialogueLines).toHaveLength(2);
    });

    it("includes fade tags in dialogue text", () => {
      const ass = generateASS(mockGroups, {
        width: 1080,
        height: 1920,
        style,
        fadeIn: 200,
        fadeOut: 100,
      });

      expect(ass).toContain("\\fad(200,100)");
    });

    it("includes emphasis style override for content words", () => {
      const ass = generateASS(mockGroups, {
        width: 1080,
        height: 1920,
        style,
      });

      // "pipeline" should be emphasis (longest word in group 2)
      expect(ass).toContain("{\\rEmph}pipeline{\\rDefault}");
    });

    it("uses different font sizes for Default and Emph", () => {
      const ass = generateASS(mockGroups, {
        width: 1080,
        height: 1920,
        style,
      });

      // Extract font sizes from style lines
      const defaultLine = ass.split("\n").find((l) => l.startsWith("Style: Default,"));
      const emphLine = ass.split("\n").find((l) => l.startsWith("Style: Emph,"));

      expect(defaultLine).toBeDefined();
      expect(emphLine).toBeDefined();

      // Emph font size should be larger
      const defaultSize = parseInt(defaultLine!.split(",")[2]);
      const emphSize = parseInt(emphLine!.split(",")[2]);
      expect(emphSize).toBeGreaterThan(defaultSize);
    });

    it("respects position setting", () => {
      const bottom = generateASS(mockGroups, { width: 1080, height: 1920, style, position: "bottom" });
      const top = generateASS(mockGroups, { width: 1080, height: 1920, style, position: "top" });

      // Top alignment = 8, bottom = 2 in ASS
      const bottomAlign = bottom.split("\n").find((l) => l.startsWith("Style: Default,"));
      const topAlign = top.split("\n").find((l) => l.startsWith("Style: Default,"));

      // Alignment is field index 18 (0-indexed) in the Style line
      expect(bottomAlign).toContain(",2,"); // alignment 2
      expect(topAlign).toContain(",8,");    // alignment 8
    });
  });

  describe("assFilterString", () => {
    it("escapes Windows paths for FFmpeg", () => {
      const result = assFilterString("C:\\Users\\test\\captions.ass");
      expect(result).toBe("ass='C\\:/Users/test/captions.ass'");
    });

    it("escapes colons in drive letters", () => {
      const result = assFilterString("C:\\tmp\\test.ass");
      expect(result).toContain("\\:");
    });
  });

  describe("buildASSCompositeArgs", () => {
    it("returns valid FFmpeg argument array", () => {
      const args = buildASSCompositeArgs({
        input: "source.mp4",
        assFile: "/tmp/captions.ass",
        output: "output.mp4",
      });

      expect(args[0]).toBe("-y");
      expect(args).toContain("-i");
      expect(args).toContain("source.mp4");
      expect(args).toContain("-c:v");
      expect(args).toContain("libx264");
      expect(args).toContain("output.mp4");
    });

    it("applies custom CRF and preset", () => {
      const args = buildASSCompositeArgs({
        input: "in.mp4",
        assFile: "/tmp/test.ass",
        output: "out.mp4",
        crf: 22,
        preset: "fast",
      });

      const crfIdx = args.indexOf("-crf");
      expect(args[crfIdx + 1]).toBe("22");

      const presetIdx = args.indexOf("-preset");
      expect(args[presetIdx + 1]).toBe("fast");
    });
  });
});
