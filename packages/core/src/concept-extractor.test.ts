import { describe, it, expect } from "vitest";
import {
  extractConceptIllustrations,
  type TranscriptSegment,
} from "./concept-extractor.js";

const DURATION_MS = 60000;

function seg(start: number, end: number, text: string): TranscriptSegment {
  return { start, end, text };
}

describe("concept-extractor.extractConceptIllustrations", () => {
  it("returns empty array for empty segments", () => {
    expect(extractConceptIllustrations([], DURATION_MS)).toEqual([]);
  });

  it("detects crm-calendar for booking language", () => {
    const segs = [seg(10, 14, "You can automatically book a meeting with every inbound lead")];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe("crm-calendar");
  });

  it("detects social-feed for social media content language", () => {
    const segs = [seg(10, 14, "Our AI social media manager posts content automatically every day")];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe("social-feed");
  });

  it("detects ai-workflow for automation language", () => {
    const segs = [seg(10, 14, "The AI agent handles the entire workflow automatically without human input")];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe("ai-workflow");
  });

  it("detects stat-counter for numeric claims", () => {
    const segs = [seg(10, 14, "We save clients 50 hours every week using this system")];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe("stat-counter");
  });

  it("detects pipeline-board for sales pipeline language", () => {
    const segs = [seg(10, 14, "We use this to close more deals and manage our sales pipeline")];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe("pipeline-board");
  });

  it("detects inbox-send for outreach language", () => {
    const segs = [seg(10, 14, "It sends personalized emails to 100 prospects automatically at scale")];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe("inbox-send");
  });

  it("detects dashboard for analytics language", () => {
    const segs = [seg(10, 14, "You can track your performance and see real-time analytics in the dashboard")];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe("dashboard");
  });

  it("detects code-terminal for API/technical language", () => {
    const segs = [seg(10, 14, "It uses an API integration to connect all your tools together")];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe("code-terminal");
  });

  it("skips segments in first 2 seconds", () => {
    const segs = [seg(0, 1.5, "Book a meeting with AI automatically")];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBe(0);
  });

  it("skips segments in last 4 seconds", () => {
    const durationMs = 30000;
    const segs = [seg(27, 29, "Book a meeting with AI automatically")];
    const result = extractConceptIllustrations(segs, durationMs);
    expect(result.length).toBe(0);
  });

  it("enforces minimum 7.5s spacing between illustrations", () => {
    const segs = [
      seg(5, 7, "Book a meeting automatically with our AI CRM"),
      seg(8, 10, "Post content on social media automatically"),
    ];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBe(1); // only first passes; second is too close
  });

  it("allows second illustration after spacing clears", () => {
    const segs = [
      seg(5, 7, "Book a meeting automatically with our AI CRM"),
      seg(20, 22, "Post content on social media and automate engagement"),
    ];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBe(2);
    expect(result[0].startMs).toBeLessThan(result[1].startMs);
  });

  it("alternates positions left/right", () => {
    const segs = [
      seg(5, 7, "Book a meeting automatically with our AI CRM"),
      seg(20, 22, "Post content on social media and automate engagement"),
    ];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result[0].position).toBe("top-right");
    expect(result[1].position).toBe("top-left");
  });

  it("extracts stat data for stat-counter type", () => {
    const segs = [seg(10, 14, "We save clients 47 hours every week")];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    const statResult = result.find((r) => r.type === "stat-counter");
    expect(statResult).toBeDefined();
    expect(statResult!.data.value).toBe("47");
    expect(statResult!.data.label).toContain("hour");
  });

  it("does not trigger on low-confidence segments", () => {
    const segs = [seg(10, 14, "And that is just something to consider today")];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBe(0);
  });

  it("uses context window (current + next segment) for detection", () => {
    // "social media" is MED (score=1), need context from next segment for "manager" to score high
    const segs = [
      seg(10, 12, "So our social media"),
      seg(12.5, 15, "manager AI posts content automatically every day"),
    ];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    expect(result.length).toBeGreaterThan(0);
  });

  it("illustration end time does not exceed reasonable bounds", () => {
    const segs = [seg(10, 14, "We use the AI agent to handle the entire automation workflow")];
    const result = extractConceptIllustrations(segs, DURATION_MS);
    for (const r of result) {
      expect(r.endMs).toBeGreaterThan(r.startMs);
      expect(r.endMs - r.startMs).toBeLessThanOrEqual(6001);
    }
  });
});
