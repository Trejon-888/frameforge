import { describe, it, expect } from "vitest";
import {
  groupWords,
  parseWhisperXWords,
  generateCaptionOverlay,
  type WordTiming,
} from "./word-captions.js";

const SAMPLE_WORDS: WordTiming[] = [
  { word: "So", start: 0.0, end: 0.2, confidence: 0.99 },
  { word: "you", start: 0.22, end: 0.35, confidence: 0.99 },
  { word: "can", start: 0.37, end: 0.5, confidence: 0.98 },
  { word: "create", start: 0.52, end: 0.8, confidence: 0.99 },
  { word: "your", start: 0.82, end: 0.95, confidence: 0.98 },
  { word: "own", start: 0.97, end: 1.1, confidence: 0.99 },
  { word: "social", start: 1.12, end: 1.4, confidence: 0.97 },
  { word: "media.", start: 1.42, end: 1.7, confidence: 0.99 },
  // Gap > 300ms
  { word: "What's", start: 2.2, end: 2.4, confidence: 0.98 },
  { word: "up,", start: 2.42, end: 2.6, confidence: 0.99 },
  { word: "everyone?", start: 2.62, end: 3.0, confidence: 0.98 },
];

describe("word-captions.groupWords", () => {
  it("groups words into chunks of max 4", () => {
    const groups = groupWords(SAMPLE_WORDS, 4);
    expect(groups.length).toBeGreaterThanOrEqual(2);
    for (const group of groups) {
      expect(group.words.length).toBeLessThanOrEqual(4);
      expect(group.words.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("breaks at punctuation", () => {
    const groups = groupWords(SAMPLE_WORDS, 4);
    // "media." ends with punctuation, so it should be the end of a group
    const mediaGroup = groups.find((g) =>
      g.words.some((w) => w.word === "media.")
    );
    expect(mediaGroup).toBeDefined();
    // "media." should be the last word in its group
    expect(mediaGroup!.words[mediaGroup!.words.length - 1].word).toBe("media.");
  });

  it("breaks at natural pauses (>300ms gap)", () => {
    const groups = groupWords(SAMPLE_WORDS, 4);
    // There's a 500ms gap between "media." and "What's"
    // They should be in different groups
    const mediaGroupIdx = groups.findIndex((g) =>
      g.words.some((w) => w.word === "media.")
    );
    const whatsGroupIdx = groups.findIndex((g) =>
      g.words.some((w) => w.word === "What's")
    );
    expect(mediaGroupIdx).not.toBe(whatsGroupIdx);
  });

  it("sets correct startMs and endMs", () => {
    const groups = groupWords(SAMPLE_WORDS, 4);
    for (const group of groups) {
      expect(group.startMs).toBe(Math.round(group.words[0].start * 1000));
      expect(group.endMs).toBe(
        Math.round(group.words[group.words.length - 1].end * 1000)
      );
    }
  });

  it("joins words into text", () => {
    const groups = groupWords(SAMPLE_WORDS, 4);
    for (const group of groups) {
      expect(group.text).toBe(group.words.map((w) => w.word).join(" "));
    }
  });

  it("returns empty array for empty input", () => {
    expect(groupWords([], 4)).toEqual([]);
  });

  it("respects maxPerGroup of 2", () => {
    const groups = groupWords(SAMPLE_WORDS, 2);
    for (const group of groups) {
      expect(group.words.length).toBeLessThanOrEqual(2);
    }
  });
});

describe("word-captions.parseWhisperXWords", () => {
  it("parses flat array format", () => {
    const data = [
      { word: "Hello", start: 0.0, end: 0.5, confidence: 0.99 },
      { word: "world", start: 0.6, end: 1.0, confidence: 0.98 },
    ];
    const words = parseWhisperXWords(data);
    expect(words).toHaveLength(2);
    expect(words[0].word).toBe("Hello");
    expect(words[1].start).toBe(0.6);
  });

  it("parses WhisperX segments format", () => {
    const data = {
      segments: [
        {
          words: [
            { word: "Hello", start: 0.0, end: 0.5, score: 0.99 },
            { word: "world", start: 0.6, end: 1.0, score: 0.98 },
          ],
        },
      ],
    };
    const words = parseWhisperXWords(data);
    expect(words).toHaveLength(2);
    expect(words[0].confidence).toBe(0.99);
  });

  it("parses JSON string input", () => {
    const json = JSON.stringify([
      { word: "Test", start: 0.0, end: 0.3, confidence: 1.0 },
    ]);
    const words = parseWhisperXWords(json);
    expect(words).toHaveLength(1);
  });

  it("skips entries without required fields", () => {
    const data = [
      { word: "Good", start: 0.0, end: 0.5, confidence: 0.99 },
      { word: "Bad" }, // Missing start/end
      { start: 1.0, end: 1.5 }, // Missing word
    ];
    const words = parseWhisperXWords(data);
    expect(words).toHaveLength(1);
  });
});

describe("word-captions.generateCaptionOverlay", () => {
  it("generates valid JavaScript", () => {
    const groups = groupWords(SAMPLE_WORDS, 4);
    const script = generateCaptionOverlay(groups, { preset: "pop-in" });
    expect(script).toContain("ff-word-captions");
    expect(script).toContain("ff-caption-group");
    expect(script).toContain("requestAnimationFrame");
  });

  it("includes preset-specific styles", () => {
    const groups = groupWords(SAMPLE_WORDS, 4);

    const popIn = generateCaptionOverlay(groups, { preset: "pop-in" });
    expect(popIn).toContain("ff-pop-word");

    const karaoke = generateCaptionOverlay(groups, { preset: "karaoke" });
    expect(karaoke).toContain("spoken");

    const highlight = generateCaptionOverlay(groups, { preset: "highlight" });
    expect(highlight).toContain("speaking");

    const boldCenter = generateCaptionOverlay(groups, { preset: "bold-center" });
    expect(boldCenter).toContain("ff-bold-slam");
  });

  it("embeds group data as JSON", () => {
    const groups = groupWords(SAMPLE_WORDS, 4);
    const script = generateCaptionOverlay(groups);
    // Verify the groups JSON is embedded
    expect(script).toContain("startMs");
    expect(script).toContain("endMs");
  });

  it("uses custom colors", () => {
    const groups = groupWords(SAMPLE_WORDS, 4);
    const script = generateCaptionOverlay(groups, {
      accentColor: "#ff0000",
      primaryColor: "#00ff00",
    });
    expect(script).toContain("#ff0000");
    expect(script).toContain("#00ff00");
  });
});
