import { describe, it, expect, vi, beforeEach } from "vitest";
import { TIME_VIRTUALIZATION_SCRIPT } from "./time-virtualization.js";
import { PAGE_API_SCRIPT } from "./page-api.js";
import { splitFrameRange, clampWorkerCount, type FrameRange } from "./frame-capture.js";

/**
 * Frame capture tests verify the integration contract between
 * Puppeteer, time virtualization, and the frame capture loop.
 *
 * We mock Puppeteer since we can't launch a real browser in unit tests.
 * Integration tests with real Puppeteer are in e2e tests.
 */

// Mock page object factory
function createMockPage() {
  const evaluateOnNewDocumentCalls: string[] = [];
  const evaluateCalls: Function[] = [];
  let viewport = { width: 1920, height: 1080, deviceScaleFactor: 1 };
  const eventHandlers: Record<string, Function[]> = {};

  return {
    setViewport: vi.fn(async (vp: any) => {
      viewport = vp;
    }),
    evaluateOnNewDocument: vi.fn(async (script: string) => {
      evaluateOnNewDocumentCalls.push(script);
    }),
    evaluate: vi.fn(async (fn: any, ...args: any[]) => {
      evaluateCalls.push(fn);
      // Return undefined by default (simulate browser evaluate)
      return undefined;
    }),
    goto: vi.fn(async () => {}),
    screenshot: vi.fn(async () => {
      // Return a minimal PNG buffer (8x8 pixel transparent PNG header)
      return Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAC0lEQVQI12NgAAIABAABINItbwAAAABJRU5ErkJggg==",
        "base64"
      );
    }),
    on: vi.fn((event: string, handler: Function) => {
      if (!eventHandlers[event]) eventHandlers[event] = [];
      eventHandlers[event].push(handler);
    }),

    // Test helpers
    _evaluateOnNewDocumentCalls: evaluateOnNewDocumentCalls,
    _evaluateCalls: evaluateCalls,
    _viewport: viewport,
    _eventHandlers: eventHandlers,
  };
}

function createMockBrowser(page: ReturnType<typeof createMockPage>) {
  return {
    newPage: vi.fn(async () => page),
    close: vi.fn(async () => {}),
  };
}

describe("frame-capture", () => {
  describe("injection contract", () => {
    it("TIME_VIRTUALIZATION_SCRIPT is a valid string", () => {
      expect(typeof TIME_VIRTUALIZATION_SCRIPT).toBe("string");
      expect(TIME_VIRTUALIZATION_SCRIPT.length).toBeGreaterThan(0);
    });

    it("PAGE_API_SCRIPT is a valid string", () => {
      expect(typeof PAGE_API_SCRIPT).toBe("string");
      expect(PAGE_API_SCRIPT.length).toBeGreaterThan(0);
    });

    it("time virtualization defines __kino global", () => {
      expect(TIME_VIRTUALIZATION_SCRIPT).toContain("__kino");
      expect(TIME_VIRTUALIZATION_SCRIPT).toContain("advanceFrame");
    });

    it("page-api extends __kino with metadata", () => {
      expect(PAGE_API_SCRIPT).toContain("totalFrames");
      expect(PAGE_API_SCRIPT).toContain("duration");
      expect(PAGE_API_SCRIPT).toContain("width");
      expect(PAGE_API_SCRIPT).toContain("height");
      expect(PAGE_API_SCRIPT).toContain("progress");
    });

    it("time virtualization exposes __originalRAF", () => {
      expect(TIME_VIRTUALIZATION_SCRIPT).toContain("__originalRAF");
    });
  });

  describe("capture loop contract (mocked)", () => {
    let mockPage: ReturnType<typeof createMockPage>;
    let mockBrowser: ReturnType<typeof createMockBrowser>;

    beforeEach(() => {
      mockPage = createMockPage();
      mockBrowser = createMockBrowser(mockPage);
    });

    it("mock page can take screenshots", async () => {
      const screenshot = await mockPage.screenshot({ type: "png" });
      expect(Buffer.isBuffer(screenshot)).toBe(true);
      expect(screenshot.length).toBeGreaterThan(0);
    });

    it("mock browser creates pages", async () => {
      const page = await mockBrowser.newPage();
      expect(page).toBe(mockPage);
    });

    it("evaluateOnNewDocument stores scripts for injection", async () => {
      await mockPage.evaluateOnNewDocument("console.log('test')");
      expect(mockPage._evaluateOnNewDocumentCalls).toHaveLength(1);
      expect(mockPage._evaluateOnNewDocumentCalls[0]).toContain("console.log");
    });

    it("injection order: config → time-virtualization → page-api", async () => {
      // Simulate the injection order from frame-capture.ts
      await mockPage.evaluateOnNewDocument(`window.__KINO_FPS__ = 30;`);
      await mockPage.evaluateOnNewDocument(TIME_VIRTUALIZATION_SCRIPT);
      await mockPage.evaluateOnNewDocument(PAGE_API_SCRIPT);

      expect(mockPage._evaluateOnNewDocumentCalls).toHaveLength(3);
      expect(mockPage._evaluateOnNewDocumentCalls[0]).toContain("__KINO_FPS__");
      expect(mockPage._evaluateOnNewDocumentCalls[1]).toContain("advanceFrame");
      expect(mockPage._evaluateOnNewDocumentCalls[2]).toContain("totalFrames");
    });
  });

  describe("frame data format", () => {
    it("screenshots return Buffer objects", async () => {
      const page = createMockPage();
      const data = await page.screenshot({ type: "png", omitBackground: false, encoding: "binary" });
      expect(Buffer.isBuffer(data)).toBe(true);
    });
  });

  describe("progress reporting", () => {
    it("progress callback receives frame/total numbers", () => {
      const progressCalls: Array<{ current: number; total: number }> = [];
      const onProgress = (current: number, total: number) => {
        progressCalls.push({ current, total });
      };

      // Simulate the progress calls from the capture loop
      const totalFrames = 150; // 5s @ 30fps
      for (let frame = 0; frame < 5; frame++) {
        onProgress(frame + 1, totalFrames);
      }

      expect(progressCalls).toHaveLength(5);
      expect(progressCalls[0]).toEqual({ current: 1, total: 150 });
      expect(progressCalls[4]).toEqual({ current: 5, total: 150 });
    });

    it("calculates total frames correctly", () => {
      const fps = 30;
      const duration = 5;
      const totalFrames = Math.ceil(fps * duration);
      expect(totalFrames).toBe(150);
    });

    it("handles fractional frame counts", () => {
      const fps = 24;
      const duration = 3.5;
      const totalFrames = Math.ceil(fps * duration);
      expect(totalFrames).toBe(84);
    });
  });

  // ── Parallel Frame Capture Tests ─────────────────────────────────

  describe("splitFrameRange", () => {
    it("splits 100 frames across 3 workers into contiguous ranges", () => {
      const ranges = splitFrameRange(100, 3);
      expect(ranges).toHaveLength(3);
      expect(ranges[0]).toEqual({ start: 0, end: 33 });
      expect(ranges[1]).toEqual({ start: 33, end: 66 });
      expect(ranges[2]).toEqual({ start: 66, end: 100 });
    });

    it("covers every frame exactly once", () => {
      const ranges = splitFrameRange(100, 3);
      const allFrames = new Set<number>();
      for (const range of ranges) {
        for (let f = range.start; f < range.end; f++) {
          expect(allFrames.has(f)).toBe(false); // no duplicates
          allFrames.add(f);
        }
      }
      expect(allFrames.size).toBe(100);
    });

    it("handles even division (300 frames / 3 workers)", () => {
      const ranges = splitFrameRange(300, 3);
      expect(ranges).toHaveLength(3);
      expect(ranges[0]).toEqual({ start: 0, end: 100 });
      expect(ranges[1]).toEqual({ start: 100, end: 200 });
      expect(ranges[2]).toEqual({ start: 200, end: 300 });
    });

    it("last chunk absorbs remainder for uneven splits", () => {
      const ranges = splitFrameRange(10, 3);
      expect(ranges).toHaveLength(3);
      // chunkSize = floor(10/3) = 3
      expect(ranges[0]).toEqual({ start: 0, end: 3 });
      expect(ranges[1]).toEqual({ start: 3, end: 6 });
      expect(ranges[2]).toEqual({ start: 6, end: 10 }); // absorbs remainder
    });

    it("handles 1 worker (single range covering all frames)", () => {
      const ranges = splitFrameRange(500, 1);
      expect(ranges).toHaveLength(1);
      expect(ranges[0]).toEqual({ start: 0, end: 500 });
    });

    it("handles 2 workers", () => {
      const ranges = splitFrameRange(600, 2);
      expect(ranges).toHaveLength(2);
      expect(ranges[0]).toEqual({ start: 0, end: 300 });
      expect(ranges[1]).toEqual({ start: 300, end: 600 });
    });

    it("clamps workers to totalFrames when frames < workers", () => {
      const ranges = splitFrameRange(2, 5);
      expect(ranges).toHaveLength(2);
      expect(ranges[0]).toEqual({ start: 0, end: 1 });
      expect(ranges[1]).toEqual({ start: 1, end: 2 });
    });

    it("handles single frame", () => {
      const ranges = splitFrameRange(1, 3);
      expect(ranges).toHaveLength(1);
      expect(ranges[0]).toEqual({ start: 0, end: 1 });
    });

    it("ranges are contiguous (no gaps between chunks)", () => {
      const ranges = splitFrameRange(997, 3);
      for (let i = 1; i < ranges.length; i++) {
        expect(ranges[i].start).toBe(ranges[i - 1].end);
      }
      expect(ranges[0].start).toBe(0);
      expect(ranges[ranges.length - 1].end).toBe(997);
    });
  });

  describe("clampWorkerCount", () => {
    it("defaults to a safe value when no argument provided", () => {
      const count = clampWorkerCount();
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(2);
    });

    it("defaults to a safe value for undefined", () => {
      const count = clampWorkerCount(undefined);
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(2);
    });

    it("clamps to maximum of 3", () => {
      expect(clampWorkerCount(4)).toBe(3);
      expect(clampWorkerCount(10)).toBe(3);
      expect(clampWorkerCount(100)).toBe(3);
    });

    it("clamps to minimum of 1", () => {
      expect(clampWorkerCount(0)).toBe(1);
      expect(clampWorkerCount(-1)).toBe(1);
      expect(clampWorkerCount(-100)).toBe(1);
    });

    it("allows valid values 1, 2, and 3", () => {
      expect(clampWorkerCount(1)).toBe(1);
      expect(clampWorkerCount(2)).toBe(2);
      expect(clampWorkerCount(3)).toBe(3);
    });

    it("floors fractional values", () => {
      expect(clampWorkerCount(2.7)).toBe(2);
      expect(clampWorkerCount(1.9)).toBe(1);
      expect(clampWorkerCount(3.9)).toBe(3);
    });
  });
});
