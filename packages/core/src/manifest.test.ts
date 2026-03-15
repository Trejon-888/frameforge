import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { parseManifest, resolveEntry } from "./manifest.js";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

describe("manifest.parseManifest", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `frameforge-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("parses a minimal valid manifest", async () => {
    const manifest = await parseManifest({
      canvas: { duration: 5 },
      entry: "./index.html",
    });

    expect(manifest.version).toBe("1.0");
    expect(manifest.canvas.width).toBe(1920);
    expect(manifest.canvas.height).toBe(1080);
    expect(manifest.canvas.fps).toBe(30);
    expect(manifest.canvas.duration).toBe(5);
    expect(manifest.canvas.background).toBe("#000000");
    expect(manifest.entry).toBe("./index.html");
    expect(manifest.audio).toEqual([]);
    expect(manifest.render.codec).toBe("h264");
    expect(manifest.render.quality).toBe("high");
    expect(manifest.render.pixelFormat).toBe("yuv420p");
    expect(manifest.render.output).toBe("./output.mp4");
  });

  it("parses a full manifest with all fields", async () => {
    const manifest = await parseManifest({
      version: "1.0",
      name: "test-scene",
      canvas: {
        width: 3840,
        height: 2160,
        fps: 60,
        duration: 10,
        background: "#ff0000",
      },
      entry: "./scene.html",
      audio: [
        { src: "./music.mp3", startAt: 0, volume: 0.8 },
        { src: "./voiceover.wav", startAt: 2.5, volume: 1.0 },
      ],
      render: {
        codec: "h265",
        quality: "lossless",
        pixelFormat: "yuv444p",
        output: "./output/final.mp4",
      },
      metadata: {
        title: "Test Video",
        description: "A test scene",
        tags: ["test", "video"],
      },
    });

    expect(manifest.canvas.width).toBe(3840);
    expect(manifest.canvas.height).toBe(2160);
    expect(manifest.canvas.fps).toBe(60);
    expect(manifest.canvas.duration).toBe(10);
    expect(manifest.audio).toHaveLength(2);
    expect(manifest.audio[0].src).toBe("./music.mp3");
    expect(manifest.audio[1].startAt).toBe(2.5);
    expect(manifest.render.codec).toBe("h265");
    expect(manifest.render.quality).toBe("lossless");
    expect(manifest.metadata?.title).toBe("Test Video");
    expect(manifest.metadata?.tags).toEqual(["test", "video"]);
  });

  it("parses from a JSON file path", async () => {
    const manifestPath = join(tempDir, "scene.json");
    await writeFile(
      manifestPath,
      JSON.stringify({
        canvas: { duration: 3 },
        entry: "./test.html",
      })
    );

    const manifest = await parseManifest(manifestPath);
    expect(manifest.canvas.duration).toBe(3);
    expect(manifest.entry).toBe("./test.html");
  });

  it("applies defaults for omitted fields", async () => {
    const manifest = await parseManifest({
      canvas: { duration: 1 },
      entry: "page.html",
    });

    expect(manifest.canvas.width).toBe(1920);
    expect(manifest.canvas.height).toBe(1080);
    expect(manifest.canvas.fps).toBe(30);
    expect(manifest.render.codec).toBe("h264");
    expect(manifest.render.quality).toBe("high");
  });

  it("applies audio track defaults", async () => {
    const manifest = await parseManifest({
      canvas: { duration: 5 },
      entry: "page.html",
      audio: [{ src: "./audio.mp3" }],
    });

    expect(manifest.audio[0].startAt).toBe(0);
    expect(manifest.audio[0].volume).toBe(1.0);
  });

  describe("validation errors", () => {
    it("rejects missing entry", async () => {
      await expect(
        parseManifest({ canvas: { duration: 5 } } as any)
      ).rejects.toThrow();
    });

    it("rejects missing duration", async () => {
      await expect(
        parseManifest({ canvas: {}, entry: "test.html" } as any)
      ).rejects.toThrow();
    });

    it("rejects negative duration", async () => {
      await expect(
        parseManifest({ canvas: { duration: -1 }, entry: "test.html" })
      ).rejects.toThrow();
    });

    it("rejects zero duration", async () => {
      await expect(
        parseManifest({ canvas: { duration: 0 }, entry: "test.html" })
      ).rejects.toThrow();
    });

    it("rejects negative dimensions", async () => {
      await expect(
        parseManifest({
          canvas: { duration: 5, width: -100 },
          entry: "test.html",
        })
      ).rejects.toThrow();
    });

    it("rejects invalid codec", async () => {
      await expect(
        parseManifest({
          canvas: { duration: 5 },
          entry: "test.html",
          render: { codec: "vp9" },
        })
      ).rejects.toThrow();
    });

    it("rejects invalid quality", async () => {
      await expect(
        parseManifest({
          canvas: { duration: 5 },
          entry: "test.html",
          render: { quality: "ultra" },
        })
      ).rejects.toThrow();
    });

    it("rejects audio volume > 1", async () => {
      await expect(
        parseManifest({
          canvas: { duration: 5 },
          entry: "test.html",
          audio: [{ src: "x.mp3", volume: 1.5 }],
        })
      ).rejects.toThrow();
    });

    it("rejects audio volume < 0", async () => {
      await expect(
        parseManifest({
          canvas: { duration: 5 },
          entry: "test.html",
          audio: [{ src: "x.mp3", volume: -0.5 }],
        })
      ).rejects.toThrow();
    });

    it("rejects non-integer fps", async () => {
      await expect(
        parseManifest({
          canvas: { duration: 5, fps: 29.97 },
          entry: "test.html",
        })
      ).rejects.toThrow();
    });

    it("rejects non-existent file path", async () => {
      await expect(
        parseManifest("/tmp/definitely-does-not-exist-12345.json")
      ).rejects.toThrow();
    });
  });
});

describe("manifest.resolveEntry", () => {
  it("resolves entry relative to manifest directory", () => {
    const result = resolveEntry("/project/scenes/scene.json", "./index.html");
    expect(result).toBe(resolve("/project/scenes/index.html"));
  });

  it("resolves nested entry paths", () => {
    const result = resolveEntry("/project/scene.json", "./pages/main.html");
    expect(result).toBe(resolve("/project/pages/main.html"));
  });

  it("handles absolute entry paths", () => {
    const absPath = resolve("/absolute/path/page.html");
    const result = resolveEntry("/project/scene.json", absPath);
    expect(result).toBe(absPath);
  });
});
