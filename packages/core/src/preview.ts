import puppeteer from "puppeteer";
import { resolve } from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { TIME_VIRTUALIZATION_SCRIPT } from "./time-virtualization.js";
import { PAGE_API_SCRIPT } from "./page-api.js";
import type { SceneManifest } from "./manifest.js";

export interface PreviewOptions {
  manifest: SceneManifest;
  entryPath: string;
  /** Frame number to capture (0-indexed). Default: 0 */
  frame?: number;
  /** Output path for the PNG. Default: ./preview.png */
  output?: string;
}

/**
 * Capture a single frame as a PNG image.
 * Useful for previewing animations at a specific point in time.
 */
export async function capturePreview(
  options: PreviewOptions
): Promise<string> {
  const { manifest, entryPath, frame = 0 } = options;
  const { width, height, fps, duration } = manifest.canvas;
  const totalFrames = Math.ceil(fps * duration);
  const outputPath = resolve(options.output ?? "./preview.png");

  await mkdir(dirname(outputPath), { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--window-size=${width},${height}`,
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    await page.evaluateOnNewDocument(`
      window.__FRAMEFORGE_FPS__ = ${fps};
      window.__FRAMEFORGE_TOTAL_FRAMES__ = ${totalFrames};
      window.__FRAMEFORGE_DURATION__ = ${duration};
      window.__FRAMEFORGE_WIDTH__ = ${width};
      window.__FRAMEFORGE_HEIGHT__ = ${height};
    `);
    await page.evaluateOnNewDocument(TIME_VIRTUALIZATION_SCRIPT);
    await page.evaluateOnNewDocument(PAGE_API_SCRIPT);

    const entryUrl = pathToFileURL(resolve(entryPath)).href;
    await page.goto(entryUrl, { waitUntil: "networkidle0", timeout: 30000 });

    if (manifest.canvas.background) {
      await page.evaluate(
        (bg: string) => {
          document.body.style.background = bg;
          document.documentElement.style.background = bg;
        },
        manifest.canvas.background
      );
    }

    // Advance to the target frame
    const targetFrame = Math.min(frame, totalFrames - 1);
    for (let f = 0; f <= targetFrame; f++) {
      await page.evaluate(() => {
        (window as any).__frameforge.advanceFrame();
      });
    }

    // Yield to repaint
    await page.evaluate(
      () =>
        new Promise<void>((r) => {
          const raf = (window as any).__originalRAF;
          if (raf) raf(r);
          else Promise.resolve().then(r);
        })
    );

    // Capture
    const screenshot = await page.screenshot({
      type: "png",
      omitBackground: false,
      encoding: "binary",
    });

    await writeFile(outputPath, screenshot as Buffer);
    return outputPath;
  } finally {
    await browser.close();
  }
}
