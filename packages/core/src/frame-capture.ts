import puppeteer, { type Browser, type Page } from "puppeteer";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { cpus } from "node:os";
import { TIME_VIRTUALIZATION_SCRIPT } from "./time-virtualization.js";
import { PAGE_API_SCRIPT } from "./page-api.js";
import type { SceneManifest } from "./manifest.js";

export interface FrameCaptureOptions {
  manifest: SceneManifest;
  entryPath: string;
  onFrame?: (frameData: Buffer, frameNumber: number) => void | Promise<void>;
  onProgress?: (current: number, total: number) => void;
  /** Per-frame timeout in ms. Default: 10000 (10s) */
  frameTimeout?: number;
  /** Enable GPU acceleration for complex 3D scenes. Default: false */
  gpu?: boolean;
  /** Capture with transparent background (for overlay compositing). Default: false */
  transparentBackground?: boolean;
}

/**
 * Capture frames from an HTML page using headless Chrome.
 * Injects time virtualization, advances frame by frame, and
 * screenshots each frame via CDP.
 */
export async function captureFrames(
  options: FrameCaptureOptions
): Promise<void> {
  const { manifest, entryPath, onFrame, onProgress, frameTimeout = 10000, gpu = false, transparentBackground = false } = options;
  const { width, height, fps, duration } = manifest.canvas;
  const totalFrames = Math.ceil(fps * duration);

  // Validate entry file exists
  const resolvedEntry = resolve(entryPath);
  if (!existsSync(resolvedEntry)) {
    throw new Error(
      `Entry file not found: ${resolvedEntry}\n` +
        `Make sure the HTML file exists at this path.\n` +
        `If using a scene manifest, check that the "entry" path is correct relative to the manifest.`
    );
  }

  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--window-size=${width},${height}`,
        ...(gpu ? ["--enable-gpu"] : ["--disable-gpu"]),
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    // Capture page errors for debugging
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        pageErrors.push(`[console.error] ${msg.text()}`);
      }
    });

    // Inject time virtualization BEFORE the page loads
    await page.evaluateOnNewDocument(`
      window.__KINO_FPS__ = ${fps};
      window.__KINO_TOTAL_FRAMES__ = ${totalFrames};
      window.__KINO_DURATION__ = ${duration};
      window.__KINO_WIDTH__ = ${width};
      window.__KINO_HEIGHT__ = ${height};
    `);
    await page.evaluateOnNewDocument(TIME_VIRTUALIZATION_SCRIPT);
    await page.evaluateOnNewDocument(PAGE_API_SCRIPT);

    // Navigate to the entry HTML
    const entryUrl = pathToFileURL(resolve(entryPath)).href;
    await page.goto(entryUrl, { waitUntil: "networkidle0", timeout: 30000 });

    // Set background color — skip for transparent mode (overlay compositing)
    if (transparentBackground) {
      await page.evaluate(() => {
        document.body.style.background = "transparent";
        document.documentElement.style.background = "transparent";
      });
    } else if (manifest.canvas.background) {
      await page.evaluate(
        (bg: string) => {
          const bodyBg = window.getComputedStyle(document.body).backgroundColor;
          const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
          const isTransparent = (c: string) =>
            !c || c === "transparent" || c === "rgba(0, 0, 0, 0)";

          // Only apply manifest background if page has no background set
          if (isTransparent(bodyBg) && isTransparent(htmlBg)) {
            document.body.style.background = bg;
            document.documentElement.style.background = bg;
          }
        },
        manifest.canvas.background
      );
    }

    // Per-frame timeout helper
    const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
      let timer: ReturnType<typeof setTimeout>;
      return Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`Frame timeout (${ms}ms): ${label}`)),
            ms
          );
        }),
      ]).finally(() => clearTimeout(timer));
    };

    // Capture frames one by one
    for (let frame = 0; frame < totalFrames; frame++) {
      try {
        // Reset async readiness state before advancing
        await withTimeout(
          page.evaluate(() => {
            (window as any).__kino.resetReady();
          }),
          frameTimeout,
          `resetReady at frame ${frame}`
        );

        // Advance virtual time (fires timers, rAF callbacks, syncs CSS animations)
        await withTimeout(
          page.evaluate(() => {
            (window as any).__kino.advanceFrame();
          }),
          frameTimeout,
          `advanceFrame at frame ${frame}`
        );

        // Yield to the browser's real rAF to allow repaint
        await withTimeout(
          page.evaluate(
            () =>
              new Promise<void>((r) => {
                const raf = (window as any).__originalRAF;
                if (raf) {
                  raf(r);
                } else {
                  Promise.resolve().then(r);
                }
              })
          ),
          frameTimeout,
          `repaint yield at frame ${frame}`
        );

        // Capture screenshot as raw PNG buffer
        // For overlay compositing, omitBackground=true captures with alpha channel
        const screenshot = await withTimeout(
          page.screenshot({
            type: "png",
            omitBackground: transparentBackground,
            encoding: "binary",
          }),
          frameTimeout,
          `screenshot at frame ${frame}`
        );

        if (onFrame) {
          await onFrame(screenshot as Buffer, frame);
        }
      } catch (err: any) {
        throw new Error(
          `Failed at frame ${frame + 1}/${totalFrames} (${((frame / fps) * 1000 / 1000).toFixed(2)}s):\n` +
            `${err.message}\n` +
            (pageErrors.length > 0
              ? `Page errors:\n${pageErrors.slice(-3).map((e) => `  - ${e}`).join("\n")}\n`
              : "") +
            `Hint: If the page hangs, check for infinite loops or heavy async operations.`
        );
      }

      if (onProgress) {
        onProgress(frame + 1, totalFrames);
      }
    }

    // Warn about page errors (non-fatal, but useful for debugging)
    if (pageErrors.length > 0) {
      const uniqueErrors = [...new Set(pageErrors)];
      console.warn(
        `[kino] ${uniqueErrors.length} page error(s) during render:\n` +
          uniqueErrors.slice(0, 5).map((e) => `  - ${e}`).join("\n") +
          (uniqueErrors.length > 5 ? `\n  ... and ${uniqueErrors.length - 5} more` : "")
      );
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// ── Parallel Frame Capture ───────────────────────────────────────────

/** Maximum allowed worker count to prevent system resource exhaustion. */
const MAX_WORKERS = 3;

export interface ParallelCaptureOptions extends FrameCaptureOptions {
  /**
   * Number of parallel Puppeteer workers.
   * Default: Math.min(2, Math.floor(os.cpus().length / 2))
   * Maximum: 3 (higher values overwhelm system resources)
   */
  workers?: number;
}

/** A contiguous range of frames [start, end) for a single worker. */
export interface FrameRange {
  start: number; // inclusive
  end: number;   // exclusive
}

/**
 * Clamp the requested worker count to a safe value.
 * - Minimum: 1
 * - Maximum: MAX_WORKERS (3)
 * - Default: Math.min(2, Math.floor(cpus / 2))
 */
export function clampWorkerCount(requested?: number): number {
  if (requested === undefined || requested === null) {
    return Math.max(1, Math.min(2, Math.floor(cpus().length / 2)));
  }
  return Math.max(1, Math.min(MAX_WORKERS, Math.floor(requested)));
}

/**
 * Split a total frame count into N contiguous, non-overlapping ranges.
 * Every frame is covered exactly once. The last chunk absorbs any remainder.
 *
 * Example: splitFrameRange(100, 3) → [{0,34}, {34,67}, {67,100}]
 */
export function splitFrameRange(totalFrames: number, workers: number): FrameRange[] {
  const n = Math.max(1, Math.min(workers, totalFrames)); // never more workers than frames
  const chunkSize = Math.floor(totalFrames / n);
  const ranges: FrameRange[] = [];

  for (let i = 0; i < n; i++) {
    const start = i * chunkSize;
    const end = i === n - 1 ? totalFrames : (i + 1) * chunkSize;
    ranges.push({ start, end });
  }

  return ranges;
}

/**
 * Capture a chunk of frames with a dedicated Puppeteer browser instance.
 * The worker advances virtual time from frame 0 but only captures frames
 * in its assigned [range.start, range.end) range, because time
 * virtualization must build up state from the beginning.
 *
 * Optimization: each worker navigates to the page and fast-forwards to
 * its start frame (advancing without capturing), then captures its chunk.
 */
async function captureWorkerChunk(
  range: FrameRange,
  totalFrames: number,
  options: ParallelCaptureOptions,
  workerIndex: number,
): Promise<Map<number, Buffer>> {
  const { manifest, entryPath, frameTimeout = 10000, gpu = false, transparentBackground = false } = options;
  const { width, height, fps, duration } = manifest.canvas;
  const frames = new Map<number, Buffer>();

  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--window-size=${width},${height}`,
        ...(gpu ? ["--enable-gpu"] : ["--disable-gpu"]),
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    // Capture page errors for debugging
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        pageErrors.push(`[console.error] ${msg.text()}`);
      }
    });

    // Inject time virtualization BEFORE the page loads
    await page.evaluateOnNewDocument(`
      window.__KINO_FPS__ = ${fps};
      window.__KINO_TOTAL_FRAMES__ = ${totalFrames};
      window.__KINO_DURATION__ = ${duration};
      window.__KINO_WIDTH__ = ${width};
      window.__KINO_HEIGHT__ = ${height};
    `);
    await page.evaluateOnNewDocument(TIME_VIRTUALIZATION_SCRIPT);
    await page.evaluateOnNewDocument(PAGE_API_SCRIPT);

    // Navigate to the entry HTML
    const entryUrl = pathToFileURL(resolve(entryPath)).href;
    await page.goto(entryUrl, { waitUntil: "networkidle0", timeout: 30000 });

    // Set background color
    if (transparentBackground) {
      await page.evaluate(() => {
        document.body.style.background = "transparent";
        document.documentElement.style.background = "transparent";
      });
    } else if (manifest.canvas.background) {
      await page.evaluate(
        (bg: string) => {
          const bodyBg = window.getComputedStyle(document.body).backgroundColor;
          const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
          const isTransparent = (c: string) =>
            !c || c === "transparent" || c === "rgba(0, 0, 0, 0)";

          if (isTransparent(bodyBg) && isTransparent(htmlBg)) {
            document.body.style.background = bg;
            document.documentElement.style.background = bg;
          }
        },
        manifest.canvas.background
      );
    }

    // Per-frame timeout helper
    const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
      let timer: ReturnType<typeof setTimeout>;
      return Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`Frame timeout (${ms}ms): ${label}`)),
            ms
          );
        }),
      ]).finally(() => clearTimeout(timer));
    };

    // Advance through all frames from 0 to range.end.
    // Only capture screenshots for frames in [range.start, range.end).
    for (let frame = 0; frame < range.end; frame++) {
      try {
        await withTimeout(
          page.evaluate(() => { (window as any).__kino.resetReady(); }),
          frameTimeout,
          `worker ${workerIndex}: resetReady at frame ${frame}`
        );

        await withTimeout(
          page.evaluate(() => { (window as any).__kino.advanceFrame(); }),
          frameTimeout,
          `worker ${workerIndex}: advanceFrame at frame ${frame}`
        );

        await withTimeout(
          page.evaluate(
            () =>
              new Promise<void>((r) => {
                const raf = (window as any).__originalRAF;
                if (raf) { raf(r); } else { Promise.resolve().then(r); }
              })
          ),
          frameTimeout,
          `worker ${workerIndex}: repaint yield at frame ${frame}`
        );

        // Only capture if this frame belongs to our chunk
        if (frame >= range.start) {
          const screenshot = await withTimeout(
            page.screenshot({
              type: "png",
              omitBackground: transparentBackground,
              encoding: "binary",
            }),
            frameTimeout,
            `worker ${workerIndex}: screenshot at frame ${frame}`
          );
          frames.set(frame, screenshot as Buffer);
        }
      } catch (err: any) {
        throw new Error(
          `Worker ${workerIndex} failed at frame ${frame + 1}/${totalFrames} (${((frame / fps) * 1000 / 1000).toFixed(2)}s):\n` +
            `${err.message}\n` +
            (pageErrors.length > 0
              ? `Page errors:\n${pageErrors.slice(-3).map((e) => `  - ${e}`).join("\n")}\n`
              : "") +
            `Hint: If the page hangs, check for infinite loops or heavy async operations.`
        );
      }
    }

    // Warn about page errors
    if (pageErrors.length > 0) {
      const uniqueErrors = [...new Set(pageErrors)];
      console.warn(
        `[kino] Worker ${workerIndex}: ${uniqueErrors.length} page error(s) during render:\n` +
          uniqueErrors.slice(0, 5).map((e) => `  - ${e}`).join("\n") +
          (uniqueErrors.length > 5 ? `\n  ... and ${uniqueErrors.length - 5} more` : "")
      );
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return frames;
}

/**
 * Capture frames in parallel across multiple Puppeteer browser instances.
 *
 * Splits the total frame range into N chunks (one per worker), launches
 * N browser instances, and each worker renders its chunk. Frames are
 * delivered to the `onFrame` callback in strict sequential order.
 *
 * Worker count is clamped to a maximum of 3 to prevent system resource
 * exhaustion (see PROJECT-MEMORY: "Parallel renders cause frame timeouts").
 *
 * The existing `captureFrames()` function is unchanged — use this for
 * parallel rendering only when the system has enough resources.
 */
export async function captureFramesParallel(
  options: ParallelCaptureOptions
): Promise<void> {
  const { manifest, entryPath, onFrame, onProgress, workers: requestedWorkers } = options;
  const { fps, duration } = manifest.canvas;
  const totalFrames = Math.ceil(fps * duration);

  // Validate entry file exists
  const resolvedEntry = resolve(entryPath);
  if (!existsSync(resolvedEntry)) {
    throw new Error(
      `Entry file not found: ${resolvedEntry}\n` +
        `Make sure the HTML file exists at this path.\n` +
        `If using a scene manifest, check that the "entry" path is correct relative to the manifest.`
    );
  }

  const workerCount = clampWorkerCount(requestedWorkers);

  // If only 1 worker, delegate to sequential capture (no overhead)
  if (workerCount === 1) {
    return captureFrames(options);
  }

  const ranges = splitFrameRange(totalFrames, workerCount);

  // Launch all workers in parallel — each returns a Map<frameNumber, Buffer>
  const workerResults = await Promise.all(
    ranges.map((range, index) =>
      captureWorkerChunk(range, totalFrames, options, index)
    )
  );

  // Deliver frames to onFrame callback in strict sequential order
  let deliveredCount = 0;
  for (let frame = 0; frame < totalFrames; frame++) {
    // Find which worker has this frame
    const workerMap = workerResults.find((m) => m.has(frame));
    if (!workerMap) {
      throw new Error(
        `Frame ${frame} was not captured by any worker. This is a bug in parallel frame splitting.`
      );
    }

    const frameData = workerMap.get(frame)!;

    if (onFrame) {
      await onFrame(frameData, frame);
    }

    deliveredCount++;
    if (onProgress) {
      onProgress(deliveredCount, totalFrames);
    }
  }
}
