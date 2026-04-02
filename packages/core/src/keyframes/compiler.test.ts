import { describe, it, expect } from "vitest";
import { compileScene, compileSceneManifest } from "./compiler.js";
import type { SceneComposition } from "./scene.js";

const SAMPLE: SceneComposition = {
  version: "2.0",
  canvas: { width: 1080, height: 1920, fps: 30, duration: 10 },
  scenes: [
    {
      id: "intro",
      start: 0,
      end: 5,
      mode: "full-frame",
      background: "#000000",
      elements: [
        {
          id: "grid-bg",
          type: "grid",
          props: { spacing: 60, color: "rgba(255,255,255,0.06)" },
          animations: [
            { property: "opacity", keyframes: [{ time: 0, value: 0 }, { time: 1, value: 1, easing: "ease-out" }] },
          ],
        },
        {
          id: "title",
          type: "text",
          props: { content: "HELLO WORLD", fontSize: 120, fontWeight: "900", color: "#ffffff", align: "center", baseline: "middle" },
          animations: [
            { property: "x", keyframes: [{ time: 0, value: 540 }] },
            { property: "y", keyframes: [{ time: 0, value: 960 }, { time: 0.8, value: 960 }] },
            { property: "opacity", keyframes: [{ time: 0, value: 0 }, { time: 0.6, value: 1, easing: "cubic-bezier(0.16,1,0.3,1)" }] },
            { property: "scale", keyframes: [{ time: 0, value: 0.5 }, { time: 0.8, value: 1, easing: "back.out" }] },
          ],
        },
        {
          id: "circle-1",
          type: "circle",
          props: { fill: "transparent", stroke: "#ffffff" },
          animations: [
            { property: "cx", keyframes: [{ time: 0, value: 540 }] },
            { property: "cy", keyframes: [{ time: 0, value: 960 }] },
            { property: "r", keyframes: [{ time: 0.5, value: 0 }, { time: 2, value: 300, easing: "ease-out" }] },
            { property: "opacity", keyframes: [{ time: 0.5, value: 0 }, { time: 1, value: 1 }, { time: 3, value: 0 }] },
          ],
        },
      ],
      sound: [{ type: "whoosh-in", time: 0 }, { type: "kick", time: 0.8 }],
    },
    {
      id: "overlay-section",
      start: 5,
      end: 10,
      mode: "overlay",
      elements: [
        {
          id: "label",
          type: "text",
          props: { content: "OVERLAY", fontSize: 48, color: "#ffffff", strokeColor: "#000000", strokeWidth: 4 },
          animations: [
            { property: "x", keyframes: [{ time: 0, value: 540 }] },
            { property: "y", keyframes: [{ time: 0, value: 100 }] },
            { property: "opacity", keyframes: [{ time: 0, value: 0 }, { time: 0.3, value: 1 }] },
          ],
        },
      ],
    },
  ],
};

describe("keyframes.compiler", () => {
  describe("compileScene", () => {
    it("produces valid HTML with DOCTYPE", () => {
      const html = compileScene(SAMPLE);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("sets canvas dimensions from composition", () => {
      const html = compileScene(SAMPLE);
      expect(html).toContain('width="1080"');
      expect(html).toContain('height="1920"');
      expect(html).toContain("width:1080px");
      expect(html).toContain("height:1920px");
    });

    it("inlines the scene data as JSON", () => {
      const html = compileScene(SAMPLE);
      expect(html).toContain('"version":"2.0"');
      expect(html).toContain('"HELLO WORLD"');
      expect(html).toContain('"whoosh-in"');
    });

    it("includes easing functions", () => {
      const html = compileScene(SAMPLE);
      expect(html).toContain("_cubicBezier");
      expect(html).toContain("_EASE_PRESETS");
      expect(html).toContain("ease-out");
      expect(html).toContain("back.out");
    });

    it("includes keyframe interpolation engine", () => {
      const html = compileScene(SAMPLE);
      expect(html).toContain("_interpolate");
      expect(html).toContain("_resolve");
    });

    it("includes element renderers", () => {
      const html = compileScene(SAMPLE);
      expect(html).toContain("_renderers.circle");
      expect(html).toContain("_renderers.rect");
      expect(html).toContain("_renderers.line");
      expect(html).toContain("_renderers.text");
      expect(html).toContain("_renderers.grid");
      expect(html).toContain("_renderers.dot");
      expect(html).toContain("_renderers.group");
      expect(html).toContain("_renderers.image");
    });

    it("includes the main rAF loop", () => {
      const html = compileScene(SAMPLE);
      expect(html).toContain("requestAnimationFrame(update)");
      expect(html).toContain("performance.now()");
    });

    it("handles full-frame scene backgrounds", () => {
      const html = compileScene(SAMPLE);
      expect(html).toContain("full-frame");
      expect(html).toContain("fillRect");
    });

    it("includes image preloading", () => {
      const html = compileScene(SAMPLE);
      expect(html).toContain("_preloadImages");
      expect(html).toContain("new Image()");
    });
  });

  describe("compileSceneManifest", () => {
    it("returns HTML and manifest", () => {
      const result = compileSceneManifest(SAMPLE, "./scene.html");
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.manifest.version).toBe("1.0");
      expect(result.manifest.canvas.width).toBe(1080);
      expect(result.manifest.canvas.height).toBe(1920);
      expect(result.manifest.canvas.fps).toBe(30);
      expect(result.manifest.canvas.duration).toBe(10);
    });

    it("sets black background for compositions with full-frame scenes", () => {
      const result = compileSceneManifest(SAMPLE, "./scene.html");
      expect(result.manifest.canvas.background).toBe("#000000");
    });

    it("sets transparent background for overlay-only compositions", () => {
      const overlayOnly: SceneComposition = {
        ...SAMPLE,
        scenes: [{ id: "a", start: 0, end: 5, mode: "overlay", elements: [] }],
      };
      const result = compileSceneManifest(overlayOnly, "./scene.html");
      expect(result.manifest.canvas.background).toBe("transparent");
    });

    it("sets entry path in manifest", () => {
      const result = compileSceneManifest(SAMPLE, "./output/scene.html");
      expect(result.manifest.entry).toBe("./output/scene.html");
    });
  });
});
