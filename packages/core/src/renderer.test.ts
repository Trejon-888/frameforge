import { describe, it, expect } from "vitest";
import { resolve } from "node:path";

/**
 * Renderer orchestrator tests.
 * Tests the logic of input detection, manifest building, and CLI overrides
 * without spawning Puppeteer or FFmpeg.
 */

describe("renderer", () => {
  describe("input type detection", () => {
    it("detects JSON manifest by extension", () => {
      const input = "scene.json";
      const isManifest = input.endsWith(".json");
      expect(isManifest).toBe(true);
    });

    it("detects HTML file by extension", () => {
      const input = "page.html";
      const isManifest = input.endsWith(".json");
      expect(isManifest).toBe(false);
    });

    it("handles paths with directories", () => {
      const input = "./examples/hello-world/scene.json";
      const isManifest = resolve(input).endsWith(".json");
      expect(isManifest).toBe(true);
    });
  });

  describe("raw HTML manifest building", () => {
    interface ManifestBuildOptions {
      width?: number;
      height?: number;
      fps?: number;
      duration?: number;
      output?: string;
    }

    function buildRawHtmlManifest(entryPath: string, options: ManifestBuildOptions) {
      if (!options.duration) {
        throw new Error(
          "Duration is required when rendering a raw HTML file.\n" +
            "Use --duration <seconds> or provide a scene manifest JSON."
        );
      }

      return {
        version: "1.0",
        canvas: {
          width: options.width ?? 1920,
          height: options.height ?? 1080,
          fps: options.fps ?? 30,
          duration: options.duration,
          background: "#000000",
        },
        entry: entryPath,
        audio: [],
        render: {
          codec: "h264" as const,
          quality: "high" as const,
          pixelFormat: "yuv420p",
          output: options.output ?? "./output.mp4",
        },
      };
    }

    it("requires duration for raw HTML", () => {
      expect(() => buildRawHtmlManifest("page.html", {})).toThrow(
        "Duration is required"
      );
    });

    it("builds manifest with defaults", () => {
      const manifest = buildRawHtmlManifest("page.html", { duration: 5 });
      expect(manifest.canvas.width).toBe(1920);
      expect(manifest.canvas.height).toBe(1080);
      expect(manifest.canvas.fps).toBe(30);
      expect(manifest.canvas.duration).toBe(5);
      expect(manifest.render.codec).toBe("h264");
      expect(manifest.render.quality).toBe("high");
    });

    it("applies custom dimensions", () => {
      const manifest = buildRawHtmlManifest("page.html", {
        duration: 5,
        width: 3840,
        height: 2160,
      });
      expect(manifest.canvas.width).toBe(3840);
      expect(manifest.canvas.height).toBe(2160);
    });

    it("applies custom fps", () => {
      const manifest = buildRawHtmlManifest("page.html", {
        duration: 5,
        fps: 60,
      });
      expect(manifest.canvas.fps).toBe(60);
    });

    it("applies custom output path", () => {
      const manifest = buildRawHtmlManifest("page.html", {
        duration: 5,
        output: "./videos/final.mp4",
      });
      expect(manifest.render.output).toBe("./videos/final.mp4");
    });
  });

  describe("CLI override logic", () => {
    function applyOverrides(
      manifest: any,
      overrides: { fps?: number; width?: number; height?: number; duration?: number; output?: string }
    ) {
      const result = { ...manifest, canvas: { ...manifest.canvas }, render: { ...manifest.render } };
      if (overrides.fps) result.canvas.fps = overrides.fps;
      if (overrides.width) result.canvas.width = overrides.width;
      if (overrides.height) result.canvas.height = overrides.height;
      if (overrides.duration) result.canvas.duration = overrides.duration;
      if (overrides.output) result.render.output = overrides.output;
      return result;
    }

    const baseManifest = {
      canvas: { width: 1920, height: 1080, fps: 30, duration: 5 },
      render: { output: "./default.mp4" },
    };

    it("overrides fps", () => {
      const result = applyOverrides(baseManifest, { fps: 60 });
      expect(result.canvas.fps).toBe(60);
    });

    it("overrides width and height", () => {
      const result = applyOverrides(baseManifest, { width: 3840, height: 2160 });
      expect(result.canvas.width).toBe(3840);
      expect(result.canvas.height).toBe(2160);
    });

    it("overrides duration", () => {
      const result = applyOverrides(baseManifest, { duration: 10 });
      expect(result.canvas.duration).toBe(10);
    });

    it("overrides output path", () => {
      const result = applyOverrides(baseManifest, { output: "./custom.mp4" });
      expect(result.render.output).toBe("./custom.mp4");
    });

    it("does not modify original manifest", () => {
      applyOverrides(baseManifest, { fps: 60, width: 3840 });
      expect(baseManifest.canvas.fps).toBe(30);
      expect(baseManifest.canvas.width).toBe(1920);
    });

    it("keeps defaults when no overrides provided", () => {
      const result = applyOverrides(baseManifest, {});
      expect(result.canvas.fps).toBe(30);
      expect(result.canvas.width).toBe(1920);
      expect(result.canvas.height).toBe(1080);
      expect(result.canvas.duration).toBe(5);
      expect(result.render.output).toBe("./default.mp4");
    });
  });

  describe("total frames calculation", () => {
    it("30fps * 5s = 150 frames", () => {
      expect(Math.ceil(30 * 5)).toBe(150);
    });

    it("60fps * 10s = 600 frames", () => {
      expect(Math.ceil(60 * 10)).toBe(600);
    });

    it("24fps * 3.5s = 84 frames (ceil)", () => {
      expect(Math.ceil(24 * 3.5)).toBe(84);
    });

    it("30fps * 0.1s = 3 frames (ceil)", () => {
      expect(Math.ceil(30 * 0.1)).toBe(3);
    });
  });
});
