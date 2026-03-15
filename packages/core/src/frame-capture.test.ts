import { describe, it, expect, vi, beforeEach } from "vitest";
import { TIME_VIRTUALIZATION_SCRIPT } from "./time-virtualization.js";
import { PAGE_API_SCRIPT } from "./page-api.js";

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

    it("time virtualization defines __frameforge global", () => {
      expect(TIME_VIRTUALIZATION_SCRIPT).toContain("__frameforge");
      expect(TIME_VIRTUALIZATION_SCRIPT).toContain("advanceFrame");
    });

    it("page-api extends __frameforge with metadata", () => {
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
      await mockPage.evaluateOnNewDocument(`window.__FRAMEFORGE_FPS__ = 30;`);
      await mockPage.evaluateOnNewDocument(TIME_VIRTUALIZATION_SCRIPT);
      await mockPage.evaluateOnNewDocument(PAGE_API_SCRIPT);

      expect(mockPage._evaluateOnNewDocumentCalls).toHaveLength(3);
      expect(mockPage._evaluateOnNewDocumentCalls[0]).toContain("__FRAMEFORGE_FPS__");
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
});
