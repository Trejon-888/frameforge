import puppeteer, { type Browser, type Page } from "puppeteer";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
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
      window.__FRAMEFORGE_FPS__ = ${fps};
      window.__FRAMEFORGE_TOTAL_FRAMES__ = ${totalFrames};
      window.__FRAMEFORGE_DURATION__ = ${duration};
      window.__FRAMEFORGE_WIDTH__ = ${width};
      window.__FRAMEFORGE_HEIGHT__ = ${height};
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
            (window as any).__frameforge.resetReady();
          }),
          frameTimeout,
          `resetReady at frame ${frame}`
        );

        // Advance virtual time (fires timers, rAF callbacks, syncs CSS animations)
        await withTimeout(
          page.evaluate(() => {
            (window as any).__frameforge.advanceFrame();
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
        `[FrameForge] ${uniqueErrors.length} page error(s) during render:\n` +
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
