/**
 * Studio Renderer
 *
 * Maintains a persistent Puppeteer browser instance and renders
 * individual frames on demand. Uses an LRU cache for smooth scrubbing.
 */

import puppeteer, { type Browser, type Page } from "puppeteer";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { TIME_VIRTUALIZATION_SCRIPT, PAGE_API_SCRIPT } from "@frameforge/core";
import type { SceneManifest } from "@frameforge/core";

const MAX_CACHE_SIZE = 120;

export interface StudioRendererOptions {
  manifest: SceneManifest;
  entryPath: string;
}

export interface FrameResult {
  frame: number;
  time: number;
  data: Buffer;
  cached: boolean;
}

export interface LayerInfo {
  id: string;
  tag: string;
  className: string;
  visible: boolean;
  rect: { x: number; y: number; width: number; height: number };
}

export class StudioRenderer {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private manifest: SceneManifest;
  private entryPath: string;
  private totalFrames: number;
  private cache = new Map<number, Buffer>();
  private cacheOrder: number[] = [];

  constructor(options: StudioRendererOptions) {
    this.manifest = options.manifest;
    this.entryPath = options.entryPath;
    this.totalFrames = Math.ceil(
      this.manifest.canvas.fps * this.manifest.canvas.duration
    );
  }

  get info() {
    return {
      width: this.manifest.canvas.width,
      height: this.manifest.canvas.height,
      fps: this.manifest.canvas.fps,
      duration: this.manifest.canvas.duration,
      totalFrames: this.totalFrames,
      background: this.manifest.canvas.background,
    };
  }

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        `--window-size=${this.manifest.canvas.width},${this.manifest.canvas.height}`,
        "--disable-gpu",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
    await this.loadPage();
  }

  private async loadPage(): Promise<void> {
    if (!this.browser) throw new Error("Browser not initialized");

    const { width, height, fps, duration } = this.manifest.canvas;

    // Close existing page if any
    if (this.page) {
      await this.page.close().catch(() => {});
    }

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width, height, deviceScaleFactor: 1 });

    // Inject time virtualization
    await this.page.evaluateOnNewDocument(`
      window.__FRAMEFORGE_FPS__ = ${fps};
      window.__FRAMEFORGE_TOTAL_FRAMES__ = ${this.totalFrames};
      window.__FRAMEFORGE_DURATION__ = ${duration};
      window.__FRAMEFORGE_WIDTH__ = ${width};
      window.__FRAMEFORGE_HEIGHT__ = ${height};
    `);
    await this.page.evaluateOnNewDocument(TIME_VIRTUALIZATION_SCRIPT);
    await this.page.evaluateOnNewDocument(PAGE_API_SCRIPT);

    // Navigate
    const entryUrl = pathToFileURL(resolve(this.entryPath)).href;
    await this.page.goto(entryUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Set background — only as fallback if page doesn't define its own
    if (this.manifest.canvas.background) {
      await this.page.evaluate((bg: string) => {
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
        const isTransparent = (c: string) =>
          !c || c === "transparent" || c === "rgba(0, 0, 0, 0)";
        if (isTransparent(bodyBg) && isTransparent(htmlBg)) {
          document.body.style.background = bg;
          document.documentElement.style.background = bg;
        }
      }, this.manifest.canvas.background);
    }
  }

  /**
   * Render a specific frame. Reloads the page and advances to the target frame.
   */
  async seekToFrame(frame: number): Promise<FrameResult> {
    const targetFrame = Math.max(0, Math.min(frame, this.totalFrames - 1));

    // Check cache
    if (this.cache.has(targetFrame)) {
      return {
        frame: targetFrame,
        time: targetFrame / this.manifest.canvas.fps,
        data: this.cache.get(targetFrame)!,
        cached: true,
      };
    }

    // Reload page for clean state
    await this.loadPage();

    // Advance to target frame
    for (let f = 0; f <= targetFrame; f++) {
      await this.page!.evaluate(() => {
        (window as any).__frameforge.advanceFrame();
      });
    }

    // Yield for repaint
    await this.page!.evaluate(
      () =>
        new Promise<void>((r) => {
          const raf = (window as any).__originalRAF;
          if (raf) raf(r);
          else Promise.resolve().then(r);
        })
    );

    // Screenshot as JPEG for speed
    const screenshot = (await this.page!.screenshot({
      type: "jpeg",
      quality: 90,
      omitBackground: false,
      encoding: "binary",
    })) as Buffer;

    // Cache with LRU eviction
    this.addToCache(targetFrame, screenshot);

    return {
      frame: targetFrame,
      time: targetFrame / this.manifest.canvas.fps,
      data: screenshot,
      cached: false,
    };
  }

  /**
   * Get DOM layers for the inspector panel.
   */
  async getLayers(): Promise<LayerInfo[]> {
    if (!this.page) return [];

    return this.page.evaluate(() => {
      const elements = document.querySelectorAll(
        "body > *, body > * > *"
      );
      const layers: any[] = [];

      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        layers.push({
          id: el.id || `<${el.tagName.toLowerCase()}>`,
          tag: el.tagName.toLowerCase(),
          className: el.className || "",
          visible: style.display !== "none" && style.visibility !== "hidden",
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        });
      });

      return layers;
    });
  }

  /**
   * Invalidate the frame cache (called on file changes).
   */
  invalidateCache(): void {
    this.cache.clear();
    this.cacheOrder = [];
  }

  private addToCache(frame: number, data: Buffer): void {
    if (this.cache.has(frame)) return;

    // Evict oldest if at capacity
    while (this.cacheOrder.length >= MAX_CACHE_SIZE) {
      const oldest = this.cacheOrder.shift()!;
      this.cache.delete(oldest);
    }

    this.cache.set(frame, data);
    this.cacheOrder.push(frame);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
