import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  parseSRT,
  parseVTT,
  generateSubtitleOverlay,
  loadSubtitles,
} from "./subtitles.js";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SAMPLE_SRT = `1
00:00:01,000 --> 00:00:03,500
Hello, welcome to FrameForge.

2
00:00:04,000 --> 00:00:06,000
This is a subtitle test.

3
00:00:07,000 --> 00:00:10,000
Multiple lines
of text here.`;

const SAMPLE_VTT = `WEBVTT

00:00:01.000 --> 00:00:03.500
Hello from WebVTT.

00:00:04.000 --> 00:00:06.000
Second cue here.`;

describe("subtitles", () => {
  describe("parseSRT", () => {
    it("parses valid SRT content", () => {
      const entries = parseSRT(SAMPLE_SRT);
      expect(entries).toHaveLength(3);
    });

    it("extracts correct timing for first entry", () => {
      const entries = parseSRT(SAMPLE_SRT);
      expect(entries[0].startMs).toBe(1000);
      expect(entries[0].endMs).toBe(3500);
    });

    it("extracts correct text", () => {
      const entries = parseSRT(SAMPLE_SRT);
      expect(entries[0].text).toBe("Hello, welcome to FrameForge.");
      expect(entries[1].text).toBe("This is a subtitle test.");
    });

    it("handles multi-line text", () => {
      const entries = parseSRT(SAMPLE_SRT);
      expect(entries[2].text).toContain("Multiple lines");
      expect(entries[2].text).toContain("of text here.");
    });

    it("extracts correct index numbers", () => {
      const entries = parseSRT(SAMPLE_SRT);
      expect(entries[0].index).toBe(1);
      expect(entries[1].index).toBe(2);
      expect(entries[2].index).toBe(3);
    });

    it("handles hours correctly", () => {
      const srt = `1
01:30:00,000 --> 01:30:05,000
Hour and half mark.`;
      const entries = parseSRT(srt);
      expect(entries[0].startMs).toBe(5400000); // 1h 30m = 5400s
      expect(entries[0].endMs).toBe(5405000);
    });

    it("handles empty input", () => {
      const entries = parseSRT("");
      expect(entries).toEqual([]);
    });

    it("strips HTML tags from text", () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
<i>Italic text</i>`;
      const entries = parseSRT(srt);
      expect(entries[0].text).toBe("Italic text");
    });
  });

  describe("parseVTT", () => {
    it("parses valid VTT content", () => {
      const entries = parseVTT(SAMPLE_VTT);
      expect(entries).toHaveLength(2);
    });

    it("extracts correct timing", () => {
      const entries = parseVTT(SAMPLE_VTT);
      expect(entries[0].startMs).toBe(1000);
      expect(entries[0].endMs).toBe(3500);
    });

    it("extracts correct text", () => {
      const entries = parseVTT(SAMPLE_VTT);
      expect(entries[0].text).toBe("Hello from WebVTT.");
      expect(entries[1].text).toBe("Second cue here.");
    });

    it("handles short MM:SS.mmm format", () => {
      const vtt = `WEBVTT

01:30.000 --> 01:35.000
Short format.`;
      const entries = parseVTT(vtt);
      expect(entries[0].startMs).toBe(90000);
      expect(entries[0].endMs).toBe(95000);
    });
  });

  describe("generateSubtitleOverlay", () => {
    it("generates a JavaScript overlay script", () => {
      const entries = parseSRT(SAMPLE_SRT);
      const script = generateSubtitleOverlay(entries);

      expect(script).toContain("ff-subtitles");
      expect(script).toContain("__frameforge");
      expect(script).toContain("requestAnimationFrame");
      expect(script).toContain("currentTimeMs");
    });

    it("embeds subtitle entries as JSON", () => {
      const entries = [
        { index: 1, startMs: 1000, endMs: 3000, text: "Hello" },
      ];
      const script = generateSubtitleOverlay(entries);
      expect(script).toContain('"s":1000');
      expect(script).toContain('"e":3000');
      expect(script).toContain('"t":"Hello"');
    });

    it("applies custom styling options", () => {
      const entries = [
        { index: 1, startMs: 0, endMs: 1000, text: "Test" },
      ];
      const script = generateSubtitleOverlay(entries, {
        fontSize: 48,
        color: "#ff0000",
        bottom: 100,
      });
      expect(script).toContain("48px");
      expect(script).toContain("#ff0000");
      expect(script).toContain("100px");
    });

    it("uses default styling when no options provided", () => {
      const entries = [
        { index: 1, startMs: 0, endMs: 1000, text: "Test" },
      ];
      const script = generateSubtitleOverlay(entries);
      expect(script).toContain("32px"); // default fontSize
      expect(script).toContain("#ffffff"); // default color
      expect(script).toContain("60px"); // default bottom
    });
  });

  describe("loadSubtitles", () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = join(tmpdir(), `frameforge-sub-test-${Date.now()}`);
      await mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it("loads and parses SRT file", async () => {
      const filePath = join(tempDir, "test.srt");
      await writeFile(filePath, SAMPLE_SRT);

      const entries = await loadSubtitles(filePath);
      expect(entries).toHaveLength(3);
      expect(entries[0].text).toBe("Hello, welcome to FrameForge.");
    });

    it("loads and parses VTT file", async () => {
      const filePath = join(tempDir, "test.vtt");
      await writeFile(filePath, SAMPLE_VTT);

      const entries = await loadSubtitles(filePath);
      expect(entries).toHaveLength(2);
      expect(entries[0].text).toBe("Hello from WebVTT.");
    });
  });
});
