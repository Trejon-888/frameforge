import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createPreviewServer, type PreviewServerOptions } from "./server.js";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { request as httpRequest } from "node:http";

/**
 * Preview server tests.
 *
 * Tests the HTTP routes and basic server lifecycle without requiring
 * a real video file or browser. Uses temp files for overlay content.
 */

// Helpers
function get(port: number, path: string): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(`http://127.0.0.1:${port}${path}`, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode || 0,
          body,
          headers: res.headers as Record<string, string>,
        });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

// Use a unique temp dir per test run
const TEMP_DIR = join(tmpdir(), `kino-preview-test-${Date.now()}`);
const OVERLAY_PATH = join(TEMP_DIR, "overlay.html");
const MANIFEST_PATH = join(TEMP_DIR, "scene.json");

const OVERLAY_CONTENT = `<!DOCTYPE html><html><body><h1>Test Overlay</h1></body></html>`;

// Use a dynamic port to avoid conflicts
let TEST_PORT = 0; // will be assigned in beforeAll

describe("preview-server", () => {
  beforeAll(() => {
    mkdirSync(TEMP_DIR, { recursive: true });
    writeFileSync(OVERLAY_PATH, OVERLAY_CONTENT, "utf-8");
    writeFileSync(
      MANIFEST_PATH,
      JSON.stringify({
        version: "1.0",
        entry: "overlay.html",
        canvas: { width: 1920, height: 1080, fps: 30, duration: 10 },
      }),
      "utf-8"
    );
  });

  afterAll(() => {
    try {
      rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch {
      // best effort cleanup
    }
  });

  describe("server lifecycle", () => {
    it("starts and stops cleanly", async () => {
      const { start, stop, server } = createPreviewServer({
        input: OVERLAY_PATH,
        port: 0, // Let OS assign a free port
      });

      const url = await start();
      expect(url).toContain("http://localhost:");

      await stop();
      // Server should be closed — no hanging handles
    });
  });

  describe("routes with HTML input", () => {
    let stop: () => Promise<void>;
    let port: number;

    beforeAll(async () => {
      const srv = createPreviewServer({
        input: OVERLAY_PATH,
        port: 0,
      });

      const url = await srv.start();
      port = parseInt(new URL(url).port, 10);
      stop = srv.stop;
    });

    afterAll(async () => {
      await stop();
    });

    it("GET / returns the preview page HTML", async () => {
      const res = await get(port, "/");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/html");
      expect(res.body).toContain("kino");
      expect(res.body).toContain("preview-live");
      expect(res.body).toContain("<iframe");
      expect(res.body).toContain("/overlay");
    });

    it("GET /overlay returns the overlay HTML content", async () => {
      const res = await get(port, "/overlay");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/html");
      expect(res.body).toContain("Test Overlay");
    });

    it("GET /video returns 404 when no video configured", async () => {
      const res = await get(port, "/video");
      expect(res.status).toBe(404);
      expect(res.body).toContain("No video configured");
    });

    it("GET /health returns server status JSON", async () => {
      const res = await get(port, "/health");
      expect(res.status).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.status).toBe("ok");
      expect(data.overlay).toContain("overlay.html");
    });

    it("GET /nonexistent returns 404", async () => {
      const res = await get(port, "/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  describe("routes with manifest input", () => {
    let stop: () => Promise<void>;
    let port: number;

    beforeAll(async () => {
      const srv = createPreviewServer({
        input: MANIFEST_PATH,
        port: 0,
      });

      const url = await srv.start();
      port = parseInt(new URL(url).port, 10);
      stop = srv.stop;
    });

    afterAll(async () => {
      await stop();
    });

    it("GET /overlay returns the entry HTML from manifest", async () => {
      const res = await get(port, "/overlay");
      expect(res.status).toBe(200);
      expect(res.body).toContain("Test Overlay");
    });

    it("GET /health shows manifest path", async () => {
      const res = await get(port, "/health");
      const data = JSON.parse(res.body);
      expect(data.manifest).toContain("scene.json");
    });
  });

  describe("overlay freshness", () => {
    let stop: () => Promise<void>;
    let port: number;

    beforeAll(async () => {
      // Write initial content
      writeFileSync(OVERLAY_PATH, OVERLAY_CONTENT, "utf-8");

      const srv = createPreviewServer({
        input: OVERLAY_PATH,
        port: 0,
      });

      const url = await srv.start();
      port = parseInt(new URL(url).port, 10);
      stop = srv.stop;
    });

    afterAll(async () => {
      // Restore original content
      writeFileSync(OVERLAY_PATH, OVERLAY_CONTENT, "utf-8");
      await stop();
    });

    it("GET /overlay re-reads from disk on each request", async () => {
      // Initial content
      const res1 = await get(port, "/overlay");
      expect(res1.body).toContain("Test Overlay");

      // Modify the file
      writeFileSync(OVERLAY_PATH, `<!DOCTYPE html><html><body><h1>Updated Overlay</h1></body></html>`, "utf-8");

      // Next request should get updated content
      const res2 = await get(port, "/overlay");
      expect(res2.body).toContain("Updated Overlay");
    });
  });

  describe("error handling", () => {
    it("throws when input file does not exist", () => {
      expect(() => {
        createPreviewServer({
          input: join(TEMP_DIR, "nonexistent.html"),
          port: 0,
        });
      }).toThrow("Input file not found");
    });

    it("throws when manifest entry file does not exist", () => {
      const badManifest = join(TEMP_DIR, "bad-manifest.json");
      writeFileSync(
        badManifest,
        JSON.stringify({ entry: "does-not-exist.html" }),
        "utf-8"
      );

      expect(() => {
        createPreviewServer({
          input: badManifest,
          port: 0,
        });
      }).toThrow("entry file not found");
    });

    it("throws when manifest has no entry field", () => {
      const noEntryManifest = join(TEMP_DIR, "no-entry.json");
      writeFileSync(
        noEntryManifest,
        JSON.stringify({ version: "1.0" }),
        "utf-8"
      );

      expect(() => {
        createPreviewServer({
          input: noEntryManifest,
          port: 0,
        });
      }).toThrow('no "entry" field');
    });
  });
});

describe("preview-page", () => {
  it("builds HTML with video element when hasVideo is true", async () => {
    const { buildPreviewPage } = await import("./preview-page.js");
    const html = buildPreviewPage({
      hasVideo: true,
      videoFilename: "test.mp4",
      port: 3456,
    });

    expect(html).toContain("<video");
    expect(html).toContain('src="/video"');
    expect(html).toContain("test.mp4");
    expect(html).toContain("kino");
  });

  it("builds HTML without video element when hasVideo is false", async () => {
    const { buildPreviewPage } = await import("./preview-page.js");
    const html = buildPreviewPage({
      hasVideo: false,
      videoFilename: null,
      port: 3456,
    });

    expect(html).toContain("No source video");
    expect(html).not.toContain('<video id="video" src="/video"');
  });

  it("includes iframe pointing to /overlay", async () => {
    const { buildPreviewPage } = await import("./preview-page.js");
    const html = buildPreviewPage({
      hasVideo: false,
      videoFilename: null,
      port: 3456,
    });

    expect(html).toContain('src="/overlay"');
    expect(html).toContain("<iframe");
  });

  it("includes WebSocket connection on the correct port", async () => {
    const { buildPreviewPage } = await import("./preview-page.js");
    const html = buildPreviewPage({
      hasVideo: false,
      videoFilename: null,
      port: 9999,
    });

    expect(html).toContain("ws://localhost:9999/ws");
  });

  it("includes keyboard shortcut documentation", async () => {
    const { buildPreviewPage } = await import("./preview-page.js");
    const html = buildPreviewPage({
      hasVideo: false,
      videoFilename: null,
      port: 3456,
    });

    expect(html).toContain("Space");
    expect(html).toContain("Play");
    expect(html).toContain("Previous frame");
    expect(html).toContain("Next frame");
  });
});
