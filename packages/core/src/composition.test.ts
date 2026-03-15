import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseComposition, TRANSITIONS } from "./composition.js";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("composition", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `frameforge-comp-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("parseComposition", () => {
    it("parses a minimal composition", async () => {
      const comp = await parseComposition({
        canvas: { width: 1920, height: 1080, fps: 30 },
        scenes: [{ entry: "./scene1.html", duration: 5 }],
      });

      expect(comp.version).toBe("1.0");
      expect(comp.canvas.width).toBe(1920);
      expect(comp.canvas.fps).toBe(30);
      expect(comp.scenes).toHaveLength(1);
      expect(comp.scenes[0].duration).toBe(5);
    });

    it("parses multi-scene with transitions", async () => {
      const comp = await parseComposition({
        canvas: { width: 1920, height: 1080, fps: 30 },
        scenes: [
          {
            entry: "./intro.html",
            duration: 3,
            transition: { type: "fade", duration: 0.5 },
          },
          {
            entry: "./main.html",
            duration: 5,
            transition: { type: "wipeleft", duration: 0.8 },
          },
          { entry: "./outro.html", duration: 2 },
        ],
      });

      expect(comp.scenes).toHaveLength(3);
      expect(comp.scenes[0].transition?.type).toBe("fade");
      expect(comp.scenes[0].transition?.duration).toBe(0.5);
      expect(comp.scenes[1].transition?.type).toBe("wipeleft");
      expect(comp.scenes[2].transition).toBeUndefined();
    });

    it("applies defaults", async () => {
      const comp = await parseComposition({
        scenes: [{ entry: "./scene.html", duration: 5 }],
      });

      expect(comp.canvas.width).toBe(1920);
      expect(comp.canvas.height).toBe(1080);
      expect(comp.canvas.fps).toBe(30);
      expect(comp.render.codec).toBe("h264");
      expect(comp.render.quality).toBe("high");
      expect(comp.audio).toEqual([]);
    });

    it("parses from JSON file", async () => {
      const filePath = join(tempDir, "composition.json");
      await writeFile(
        filePath,
        JSON.stringify({
          canvas: { fps: 60 },
          scenes: [{ entry: "./test.html", duration: 3 }],
        })
      );

      const comp = await parseComposition(filePath);
      expect(comp.canvas.fps).toBe(60);
      expect(comp.scenes[0].duration).toBe(3);
    });

    it("rejects empty scenes array", async () => {
      await expect(
        parseComposition({ scenes: [] })
      ).rejects.toThrow();
    });

    it("rejects scene without duration", async () => {
      await expect(
        parseComposition({
          scenes: [{ entry: "./test.html" }],
        })
      ).rejects.toThrow();
    });

    it("rejects invalid transition type", async () => {
      await expect(
        parseComposition({
          scenes: [
            {
              entry: "./test.html",
              duration: 5,
              transition: { type: "invalid" },
            },
          ],
        })
      ).rejects.toThrow();
    });

    it("applies default background #000000", async () => {
      const comp = await parseComposition({
        scenes: [{ entry: "./test.html", duration: 5 }],
      });
      expect(comp.scenes[0].background).toBe("#000000");
    });
  });

  describe("TRANSITIONS", () => {
    it("includes common transition types", () => {
      expect(TRANSITIONS).toContain("fade");
      expect(TRANSITIONS).toContain("fadeblack");
      expect(TRANSITIONS).toContain("dissolve");
      expect(TRANSITIONS).toContain("wipeleft");
      expect(TRANSITIONS).toContain("slideright");
      expect(TRANSITIONS).toContain("circleopen");
    });

    it("has at least 20 transitions", () => {
      expect(TRANSITIONS.length).toBeGreaterThanOrEqual(20);
    });
  });
});
