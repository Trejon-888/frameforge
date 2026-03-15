/**
 * FrameForge Studio Server
 *
 * Fastify HTTP server for the UI + WebSocket for real-time frame delivery.
 * Watches source files for hot-reload.
 */

import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import { watch } from "chokidar";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseManifest } from "@frameforge/core";
import type { SceneManifest } from "@frameforge/core";
import { resolve as resolvePath, dirname as dirnamePath } from "node:path";
import { StudioRenderer } from "./renderer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface StudioServerOptions {
  input: string;
  port?: number;
  host?: string;
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
}

export async function startStudio(options: StudioServerOptions) {
  const { input, port = 6639, host = "localhost" } = options;
  const inputPath = resolve(input);

  // Parse manifest or build one for raw HTML
  let manifest: SceneManifest;
  let entryPath: string;
  let watchDir: string;

  if (inputPath.endsWith(".json")) {
    manifest = await parseManifest(inputPath);
    entryPath = resolvePath(dirnamePath(inputPath), manifest.entry);
    watchDir = dirnamePath(inputPath);
  } else {
    if (!options.duration) {
      throw new Error("Duration is required for raw HTML. Use --duration <seconds>.");
    }
    manifest = {
      version: "1.0",
      canvas: {
        width: options.width ?? 1920,
        height: options.height ?? 1080,
        fps: options.fps ?? 30,
        duration: options.duration,
        background: "#000000",
      },
      entry: inputPath,
      audio: [],
      render: {
        codec: "h264",
        quality: "high",
        pixelFormat: "yuv420p",
        output: "./output.mp4",
      },
    };
    entryPath = inputPath;
    watchDir = dirnamePath(inputPath);
  }

  // Apply CLI overrides
  if (options.fps) manifest.canvas.fps = options.fps;
  if (options.width) manifest.canvas.width = options.width;
  if (options.height) manifest.canvas.height = options.height;

  // Initialize renderer
  const renderer = new StudioRenderer({ manifest, entryPath });
  await renderer.initialize();

  // Track connected WebSocket clients
  const clients = new Set<any>();

  // Create Fastify server
  const app = Fastify({ logger: false });
  await app.register(fastifyWebsocket);

  // Serve UI static files
  // In dev: from packages/studio/ui/
  // In dist: from ../ui/ relative to dist/
  const uiPath = resolve(__dirname, "../ui");
  await app.register(fastifyStatic, {
    root: uiPath,
    prefix: "/",
  });

  // Serve scene info at /api/info
  app.get("/api/info", async () => {
    return renderer.info;
  });

  // WebSocket endpoint
  app.register(async function (fastify) {
    fastify.get("/ws", { websocket: true }, (socket) => {
      clients.add(socket);

      socket.on("message", async (raw: Buffer) => {
        try {
          const msg = JSON.parse(raw.toString());
          await handleMessage(socket, msg, renderer, manifest);
        } catch (err: any) {
          socket.send(
            JSON.stringify({ type: "error", message: err.message })
          );
        }
      });

      socket.on("close", () => {
        clients.delete(socket);
      });

      // Send initial info
      socket.send(
        JSON.stringify({ type: "info", ...renderer.info })
      );
    });
  });

  // File watcher for hot-reload
  const watcher = watch(watchDir, {
    ignoreInitial: true,
    ignored: [
      "**/node_modules/**",
      "**/dist/**",
      "**/output/**",
      "**/*.mp4",
      "**/*.png",
      "**/*.jpg",
    ],
  });

  watcher.on("change", () => {
    renderer.invalidateCache();
    for (const client of clients) {
      try {
        client.send(JSON.stringify({ type: "reload" }));
      } catch {}
    }
  });

  // Start server
  await app.listen({ port, host });

  return {
    url: `http://${host}:${port}`,
    async close() {
      await watcher.close();
      await renderer.close();
      await app.close();
    },
  };
}

async function handleMessage(
  socket: any,
  msg: any,
  renderer: StudioRenderer,
  manifest: SceneManifest
) {
  switch (msg.type) {
    case "seek": {
      const result = await renderer.seekToFrame(msg.frame ?? 0);
      socket.send(
        JSON.stringify({
          type: "frame",
          frame: result.frame,
          time: result.time,
          cached: result.cached,
          data: result.data.toString("base64"),
        })
      );
      break;
    }

    case "play": {
      const from = msg.from ?? 0;
      const to = msg.to ?? renderer.info.totalFrames;
      const step = msg.step ?? 1;

      for (let f = from; f < to; f += step) {
        const result = await renderer.seekToFrame(f);
        socket.send(
          JSON.stringify({
            type: "frame",
            frame: result.frame,
            time: result.time,
            cached: result.cached,
            data: result.data.toString("base64"),
          })
        );

        // Check if client sent a pause
        // (We can't truly check mid-loop, but the client will
        //  send a new seek/pause which overrides via the next message)
      }

      socket.send(JSON.stringify({ type: "playback:end" }));
      break;
    }

    case "inspect": {
      const layers = await renderer.getLayers();
      socket.send(JSON.stringify({ type: "layers", layers }));
      break;
    }

    case "render": {
      try {
        const { render } = await import("@frameforge/core");
        socket.send(
          JSON.stringify({ type: "render:start" })
        );

        const totalFrames = renderer.info.totalFrames;
        const outputPath = await render({
          input: manifest.entry,
          output: msg.output,
          duration: manifest.canvas.duration,
          fps: manifest.canvas.fps,
          width: manifest.canvas.width,
          height: manifest.canvas.height,
          onProgress: (current, total) => {
            socket.send(
              JSON.stringify({
                type: "render:progress",
                current,
                total,
              })
            );
          },
        });

        socket.send(
          JSON.stringify({ type: "render:complete", output: outputPath })
        );
      } catch (err: any) {
        socket.send(
          JSON.stringify({ type: "render:error", message: err.message })
        );
      }
      break;
    }

    default:
      socket.send(
        JSON.stringify({ type: "error", message: `Unknown message type: ${msg.type}` })
      );
  }
}
