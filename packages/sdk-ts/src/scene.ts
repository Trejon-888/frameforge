import type { SceneManifest } from "@frameforge/core";
import { generateHTML } from "./codegen.js";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

export interface SceneOptions {
  width?: number;
  height?: number;
  fps?: number;
  duration: number;
  background?: string;
}

export interface SceneElement {
  type: string;
  props: Record<string, any>;
  animations: Animation[];
}

export interface Animation {
  property: string;
  keyframes: Record<number, number | string>;
  easing?: (t: number) => number;
  easingName?: string;
}

export class Scene {
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly duration: number;
  readonly background: string;
  readonly elements: SceneElement[] = [];

  constructor(options: SceneOptions) {
    this.width = options.width ?? 1920;
    this.height = options.height ?? 1080;
    this.fps = options.fps ?? 30;
    this.duration = options.duration;
    this.background = options.background ?? "#000000";
  }

  add(...elements: Array<{ toSceneElement(): SceneElement }>) {
    for (const el of elements) {
      this.elements.push(el.toSceneElement());
    }
    return this;
  }

  toManifest(outputPath: string = "./output.mp4"): SceneManifest {
    return {
      version: "1.0",
      canvas: {
        width: this.width,
        height: this.height,
        fps: this.fps,
        duration: this.duration,
        background: this.background,
      },
      entry: "./scene.html",
      audio: [],
      render: {
        codec: "h264",
        quality: "high",
        pixelFormat: "yuv420p",
        output: outputPath,
      },
    };
  }

  /**
   * Generate HTML and scene manifest files, then invoke the renderer.
   */
  async render(outputPath: string = "./output.mp4"): Promise<string> {
    const html = generateHTML(this);
    const manifest = this.toManifest(outputPath);

    // Write generated files to a temp directory
    const outDir = resolve(dirname(outputPath), ".frameforge-tmp");
    await mkdir(outDir, { recursive: true });

    const htmlPath = resolve(outDir, "scene.html");
    const manifestPath = resolve(outDir, "scene.json");

    await writeFile(htmlPath, html, "utf-8");
    manifest.entry = htmlPath;
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

    // Dynamic import to avoid circular dependency at build time
    const { render: coreRender } = await import("@frameforge/core");
    return coreRender({ input: manifestPath, output: outputPath });
  }
}
