import { describe, it, expect } from "vitest";
import {
  computeMatchedEncoding,
  getFormatDimensions,
  type VideoProbeResult,
} from "./video-probe.js";

const MOCK_PROBE: VideoProbeResult = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 60,
  videoBitrate: 5000,
  videoCodec: "h264",
  pixelFormat: "yuv420p",
  hasAudio: true,
  audioBitrate: 192,
  audioCodec: "aac",
  audioSampleRate: 44100,
  audioChannels: 2,
  fileSize: 50000000,
  aspectRatio: "16:9",
  rotation: 0,
};

describe("video-probe.computeMatchedEncoding", () => {
  it("sets CRF based on source bitrate (balanced)", () => {
    const highBitrate = { ...MOCK_PROBE, videoBitrate: 15000 };
    expect(computeMatchedEncoding(highBitrate).crf).toBe(15);

    const medBitrate = { ...MOCK_PROBE, videoBitrate: 6000 };
    expect(computeMatchedEncoding(medBitrate).crf).toBe(17);

    const lowBitrate = { ...MOCK_PROBE, videoBitrate: 1500 };
    expect(computeMatchedEncoding(lowBitrate).crf).toBe(21);
  });

  it("sets maxrate to 1.5x source bitrate", () => {
    const result = computeMatchedEncoding(MOCK_PROBE);
    expect(result.maxrate).toBe("7500k");
  });

  it("sets audio bitrate to at least 192k", () => {
    const lowAudio = { ...MOCK_PROBE, audioBitrate: 128 };
    expect(computeMatchedEncoding(lowAudio).audioBitrate).toBe("192k");

    const highAudio = { ...MOCK_PROBE, audioBitrate: 320 };
    expect(computeMatchedEncoding(highAudio).audioBitrate).toBe("320k");
  });

  it("defaults to balanced preset (medium)", () => {
    expect(computeMatchedEncoding(MOCK_PROBE).preset).toBe("medium");
  });

  it("fast speed increases CRF and uses ultrafast preset", () => {
    // MOCK_PROBE has videoBitrate=5000 → baseCrf=19, fast offset +4 = 23
    const result = computeMatchedEncoding(MOCK_PROBE, "fast");
    expect(result.crf).toBe(23);
    expect(result.preset).toBe("ultrafast");
  });

  it("slow speed decreases CRF and uses slow preset", () => {
    // MOCK_PROBE baseCrf=19, slow offset -2 = 17
    const result = computeMatchedEncoding(MOCK_PROBE, "slow");
    expect(result.crf).toBe(17);
    expect(result.preset).toBe("slow");
  });

  it("lossless speed sets CRF to 0", () => {
    const result = computeMatchedEncoding(MOCK_PROBE, "lossless");
    expect(result.crf).toBe(0);
  });
});

describe("video-probe.getFormatDimensions", () => {
  it("returns correct landscape dimensions", () => {
    expect(getFormatDimensions("landscape", 1440, 2560)).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it("returns correct vertical dimensions", () => {
    expect(getFormatDimensions("vertical", 1920, 1080)).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it("returns correct square dimensions", () => {
    expect(getFormatDimensions("square", 1920, 1080)).toEqual({
      width: 1080,
      height: 1080,
    });
  });

  it("returns source dimensions (ensures even)", () => {
    expect(getFormatDimensions("source", 1921, 1081)).toEqual({
      width: 1922,
      height: 1082,
    });
  });

  it("keeps even source dimensions unchanged", () => {
    expect(getFormatDimensions("source", 1920, 1080)).toEqual({
      width: 1920,
      height: 1080,
    });
  });
});
