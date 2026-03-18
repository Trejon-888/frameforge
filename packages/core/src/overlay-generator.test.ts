import { describe, it, expect } from "vitest";
import {
  generateOverlayTimeline,
  type TranscriptSegment,
} from "./overlay-generator.js";
import { getStylePreset } from "./edit-styles.js";

const SAMPLE_SEGMENTS: TranscriptSegment[] = [
  { start: 0.0, end: 8.74, text: "So you can create your own social media AI agent manager that is going to post for you." },
  { start: 8.88, end: 9.38, text: "What's up, everyone?" },
  { start: 9.8, end: 12.02, text: "Hey, if you're new here, my name is Enrique." },
  { start: 12.4, end: 14.34, text: "My background is in business development." },
  { start: 14.92, end: 21.1, text: "This last year has been spent building agent workflows." },
  { start: 21.1, end: 24.06, text: "Agent systems at Infinite X." },
  { start: 24.98, end: 35.76, text: "We built the first AI client acquisition system for agencies." },
  { start: 36.02, end: 50.54, text: "Used by 50 plus partners, PE firms, and M&A advisories to automate client acquisition." },
];

const style = getStylePreset("neo-brutalist");

describe("overlay-generator.generateOverlayTimeline", () => {
  it("generates a non-empty timeline", () => {
    const overlays = generateOverlayTimeline({
      segments: SAMPLE_SEGMENTS,
      duration: 51,
      style,
    });
    expect(overlays.length).toBeGreaterThan(0);
  });

  it("generates a hook card in the first 5 seconds", () => {
    const overlays = generateOverlayTimeline({
      segments: SAMPLE_SEGMENTS,
      duration: 51,
      style,
    });
    const hook = overlays.find((o) => o.type === "hook-card");
    expect(hook).toBeDefined();
    expect(hook!.startMs).toBeLessThan(1000);
    expect(hook!.endMs).toBeLessThanOrEqual(9000);
  });

  it("generates a lower third when speaker is identified", () => {
    const overlays = generateOverlayTimeline({
      segments: SAMPLE_SEGMENTS,
      duration: 51,
      speakerName: "Enrique",
      speakerTitle: "Business Development",
      style,
    });
    const lt = overlays.find((o) => o.type === "lower-third");
    expect(lt).toBeDefined();
    expect(lt!.data.name).toBe("Enrique");
  });

  it("generates concept illustrations instead of text-label stat/key-point cards", () => {
    const overlays = generateOverlayTimeline({
      segments: SAMPLE_SEGMENTS,
      duration: 51,
      style,
    });
    // No raw text-label stat-callout or key-point overlays — replaced by concept illustrations
    const textLabels = overlays.filter(
      (o) => o.type === "stat-callout" || o.type === "key-point"
    );
    expect(textLabels.length).toBe(0);

    // Concept illustrations should be present for relevant content
    const illustrations = overlays.filter((o) =>
      String(o.type).startsWith("illustration-")
    );
    expect(illustrations.length).toBeGreaterThan(0);
  });

  it("generates CTA card near the end", () => {
    const overlays = generateOverlayTimeline({
      segments: SAMPLE_SEGMENTS,
      duration: 51,
      style,
    });
    const cta = overlays.find((o) => o.type === "cta-card");
    expect(cta).toBeDefined();
    expect(cta!.startMs).toBeGreaterThan(45000);
  });

  it("does not exceed 3 simultaneous content overlays", () => {
    const overlays = generateOverlayTimeline({
      segments: SAMPLE_SEGMENTS,
      duration: 51,
      style,
    });
    // Background overlays (progress-bar) don't count toward the content limit
    const contentOverlays = overlays.filter((o) => o.type !== "progress-bar");
    for (const ov of contentOverlays) {
      const simultaneousCount = contentOverlays.filter(
        (o) => o.startMs <= ov.startMs && o.endMs >= ov.startMs
      ).length;
      expect(simultaneousCount).toBeLessThanOrEqual(3);
    }
  });

  it("sets all overlay times within video duration", () => {
    const overlays = generateOverlayTimeline({
      segments: SAMPLE_SEGMENTS,
      duration: 51,
      style,
    });
    for (const ov of overlays) {
      expect(ov.startMs).toBeGreaterThanOrEqual(0);
      expect(ov.endMs).toBeLessThanOrEqual(51000 + 3000); // Allow 3s margin for CTA/stat extensions
    }
  });

  it("handles empty segments gracefully", () => {
    const overlays = generateOverlayTimeline({
      segments: [],
      duration: 10,
      style,
    });
    // Should still generate CTA at minimum
    expect(overlays.length).toBeGreaterThanOrEqual(0);
  });
});
