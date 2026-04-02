import { createServer, type Server as HttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, existsSync, watchFile, unwatchFile, statSync, openSync, readSync, closeSync } from "node:fs";
import { resolve, dirname, extname, basename } from "node:path";
import { WebSocketServer, type WebSocket } from "ws";
import { buildPreviewPage } from "./preview-page.js";

export interface PreviewServerOptions {
  /** Path to scene.json or overlay HTML */
  input: string;
  /** Path to source video file */
  video?: string;
  /** Server port (default 3456) */
  port?: number;
  /** Callback when server is ready */
  onReady?: (url: string) => void;
  /** Callback on file change */
  onChange?: (file: string) => void;
}

interface ServerState {
  overlayHtml: string;
  overlayPath: string;
  manifestPath: string | null;
  videoPath: string | null;
  watchedFiles: string[];
}

/**
 * Resolve the overlay HTML content from an input path.
 * If the input is a scene.json manifest, resolve the entry HTML.
 * If the input is an HTML file, read it directly.
 */
function resolveOverlay(inputPath: string): { html: string; overlayPath: string; manifestPath: string | null } {
  const absInput = resolve(inputPath);

  if (!existsSync(absInput)) {
    throw new Error(`Input file not found: ${absInput}`);
  }

  if (absInput.endsWith(".json")) {
    // Parse as manifest — find the entry HTML
    const raw = readFileSync(absInput, "utf-8");
    const manifest = JSON.parse(raw);

    if (manifest.entry) {
      const entryPath = resolve(dirname(absInput), manifest.entry);
      if (!existsSync(entryPath)) {
        throw new Error(`Manifest entry file not found: ${entryPath}\n  Referenced from: ${absInput}`);
      }
      return {
        html: readFileSync(entryPath, "utf-8"),
        overlayPath: entryPath,
        manifestPath: absInput,
      };
    }

    throw new Error(`Manifest has no "entry" field: ${absInput}`);
  }

  // Direct HTML file
  return {
    html: readFileSync(absInput, "utf-8"),
    overlayPath: absInput,
    manifestPath: null,
  };
}

/**
 * Serve a static video file. Returns appropriate headers for range requests
 * to support seeking in the video element.
 */
function serveVideoFile(
  videoPath: string,
  req: IncomingMessage,
  res: ServerResponse,
): void {
  if (!existsSync(videoPath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Video not found");
    return;
  }

  const stat = statSync(videoPath);
  const fileSize = stat.size;
  const ext = extname(videoPath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
  };
  const contentType = mimeTypes[ext] || "video/mp4";

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    // Read the chunk synchronously — acceptable for a dev preview server.
    const fd = openSync(videoPath, "r");
    const buf = Buffer.alloc(chunkSize);
    readSync(fd, buf, 0, chunkSize, start);
    closeSync(fd);

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": String(chunkSize),
      "Content-Type": contentType,
    });
    res.end(buf);
  } else {
    const buf = readFileSync(videoPath);
    res.writeHead(200, {
      "Content-Length": String(fileSize),
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    });
    res.end(buf);
  }
}

/**
 * Creates the Express-like HTTP server with WebSocket hot-reload.
 */
export function createPreviewServer(options: PreviewServerOptions): {
  server: HttpServer;
  start: () => Promise<string>;
  stop: () => Promise<void>;
} {
  const port = options.port ?? 3456;
  const videoPath = options.video ? resolve(options.video) : null;

  // Resolve overlay content
  const overlay = resolveOverlay(options.input);
  const state: ServerState = {
    overlayHtml: overlay.html,
    overlayPath: overlay.overlayPath,
    manifestPath: overlay.manifestPath,
    videoPath,
    watchedFiles: [],
  };

  // Create HTTP server (plain Node, no Express dependency needed)
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    const pathname = url.pathname;

    // Route: GET / — preview page
    if (pathname === "/" && req.method === "GET") {
      const html = buildPreviewPage({
        hasVideo: !!videoPath,
        videoFilename: videoPath ? basename(videoPath) : null,
        port,
      });
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    // Route: GET /overlay — current overlay HTML
    if (pathname === "/overlay" && req.method === "GET") {
      // Re-read from disk for freshness
      try {
        state.overlayHtml = readFileSync(state.overlayPath, "utf-8");
      } catch {
        // Use cached version if read fails
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(state.overlayHtml);
      return;
    }

    // Route: GET /video — serve the source video with range support
    if (pathname === "/video" && req.method === "GET") {
      if (!videoPath) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("No video configured");
        return;
      }
      serveVideoFile(videoPath, req, res);
      return;
    }

    // Route: GET /health — health check
    if (pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "ok",
        overlay: state.overlayPath,
        video: state.videoPath,
        manifest: state.manifestPath,
      }));
      return;
    }

    // 404 fallback
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  // WebSocket server on /ws
  const wss = new WebSocketServer({ server, path: "/ws" });
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
  });

  function broadcast(message: object): void {
    const data = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(data);
      }
    }
  }

  // File watcher — watch overlay HTML and manifest
  function setupWatchers(): void {
    const filesToWatch = [state.overlayPath];
    if (state.manifestPath) filesToWatch.push(state.manifestPath);

    for (const filePath of filesToWatch) {
      if (existsSync(filePath)) {
        watchFile(filePath, { interval: 300 }, () => {
          try {
            // Re-resolve overlay in case manifest changed entry
            if (state.manifestPath && filePath === state.manifestPath) {
              const newOverlay = resolveOverlay(state.manifestPath);
              state.overlayHtml = newOverlay.html;
              state.overlayPath = newOverlay.overlayPath;
            } else {
              state.overlayHtml = readFileSync(state.overlayPath, "utf-8");
            }
          } catch {
            // Ignore read errors during save
          }

          broadcast({ type: "reload", file: basename(filePath) });
          options.onChange?.(filePath);
        });
        state.watchedFiles.push(filePath);
      }
    }
  }

  function teardownWatchers(): void {
    for (const filePath of state.watchedFiles) {
      unwatchFile(filePath);
    }
    state.watchedFiles = [];
  }

  return {
    server,

    start(): Promise<string> {
      return new Promise((resolveUrl, reject) => {
        server.on("error", reject);
        server.listen(port, () => {
          // Get actual port (important when port=0 for OS-assigned port)
          const addr = server.address();
          const actualPort = typeof addr === "object" && addr ? addr.port : port;
          const url = `http://localhost:${actualPort}`;
          setupWatchers();
          options.onReady?.(url);
          resolveUrl(url);
        });
      });
    },

    stop(): Promise<void> {
      return new Promise((resolvePromise) => {
        teardownWatchers();

        // Close all WebSocket connections
        for (const client of clients) {
          client.close();
        }
        clients.clear();

        wss.close(() => {
          server.close(() => {
            resolvePromise();
          });
        });
      });
    },
  };
}
