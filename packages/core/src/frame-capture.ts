import puppeteer, { type Browser, type Page } from "puppeteer";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { TIME_VIRTUALIZATION_SCRIPT } from "./time-virtualization.js";
import { PAGE_API_SCRIPT } from "./page-api.js";
import type { SceneManifest } from "./manifest.js";

export interface FrameCaptureOptions {
  manifest: SceneManifest;
  entryPath: string;
  onFrame?: (frameData: Buffer, frameNumber: number) => void | Promise<void>;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Capture frames from an HTML page using headless Chrome.
 * Injects time virtualization, advances frame by frame, and
 * screenshots each frame via CDP.
 */
export async function captureFrames(
  options: FrameCaptureOptions
): Promise<void> {
  const { manifest, entryPath, onFrame, onProgress } = options;
  const { width, height, fps, duration } = manifest.canvas;
  const totalFrames = Math.ceil(fps * duration);

  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--window-size=${width},${height}`,
        "--disable-gpu",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

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

    // Set background color
    if (manifest.canvas.background) {
      await page.evaluate(
        (bg: string) => {
          document.body.style.background = bg;
          document.documentElement.style.background = bg;
        },
        manifest.canvas.background
      );
    }

    // Capture frames one by one
    for (let frame = 0; frame < totalFrames; frame++) {
      // Advance virtual time
      await page.evaluate(() => {
        (window as any).__frameforge.advanceFrame();
      });

      // Small yield to let the browser re-render
      await page.evaluate(
        () => new Promise<void>((r) => (window as any).__originalRAF?.(r) || r())
      );

      // Capture screenshot as raw PNG buffer
      const screenshot = await page.screenshot({
        type: "png",
        omitBackground: false,
        encoding: "binary",
      });

      if (onFrame) {
        await onFrame(screenshot as Buffer, frame);
      }

      if (onProgress) {
        onProgress(frame + 1, totalFrames);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
