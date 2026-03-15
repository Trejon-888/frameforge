#!/usr/bin/env node
/**
 * FrameForge MCP Server
 *
 * Exposes FrameForge as Model Context Protocol tools:
 * - frameforge_render: Render an HTML page or manifest to MP4
 * - frameforge_preview: Capture a single frame as PNG
 * - frameforge_validate: Validate a scene manifest
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { render } from "@frameforge/core";
import { parseManifest } from "@frameforge/core";
import { resolve } from "node:path";

const server = new Server(
  {
    name: "frameforge",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "frameforge_render",
      description:
        "Render an HTML page or scene manifest JSON to an MP4 video file. " +
        "Returns the output file path on success.",
      inputSchema: {
        type: "object" as const,
        properties: {
          input: {
            type: "string",
            description: "Path to HTML file or scene manifest JSON",
          },
          output: {
            type: "string",
            description: "Output file path (default: ./output.mp4)",
          },
          duration: {
            type: "number",
            description:
              "Duration in seconds (required when rendering raw HTML)",
          },
          fps: {
            type: "number",
            description: "Frames per second (default: 30)",
          },
          width: {
            type: "number",
            description: "Video width in pixels (default: 1920)",
          },
          height: {
            type: "number",
            description: "Video height in pixels (default: 1080)",
          },
        },
        required: ["input"],
      },
    },
    {
      name: "frameforge_validate",
      description:
        "Validate a scene manifest JSON. Returns validation result with any errors.",
      inputSchema: {
        type: "object" as const,
        properties: {
          manifest: {
            type: "object",
            description:
              "Scene manifest object to validate (with canvas, entry, etc.)",
          },
          path: {
            type: "string",
            description: "Path to a scene manifest JSON file to validate",
          },
        },
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "frameforge_render") {
    try {
      const input = args?.input as string;
      if (!input) {
        return {
          content: [
            { type: "text", text: "Error: 'input' parameter is required (path to HTML or JSON manifest)" },
          ],
        };
      }

      const outputPath = await render({
        input: resolve(input),
        output: args?.output as string | undefined,
        duration: args?.duration as number | undefined,
        fps: args?.fps as number | undefined,
        width: args?.width as number | undefined,
        height: args?.height as number | undefined,
      });

      return {
        content: [
          {
            type: "text",
            text: `Video rendered successfully to: ${outputPath}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `Render failed: ${err.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === "frameforge_validate") {
    try {
      const manifestInput = args?.manifest || args?.path;
      if (!manifestInput) {
        return {
          content: [
            { type: "text", text: "Error: provide either 'manifest' (object) or 'path' (file path)" },
          ],
        };
      }

      const manifest = await parseManifest(manifestInput as any);
      const totalFrames = Math.ceil(
        manifest.canvas.fps * manifest.canvas.duration
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                valid: true,
                summary: {
                  resolution: `${manifest.canvas.width}x${manifest.canvas.height}`,
                  fps: manifest.canvas.fps,
                  duration: `${manifest.canvas.duration}s`,
                  totalFrames,
                  codec: manifest.render.codec,
                  quality: manifest.render.quality,
                  audioTracks: manifest.audio.length,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                valid: false,
                error: err.message,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[FrameForge MCP] Server started");
}

main().catch((err) => {
  console.error("[FrameForge MCP] Fatal error:", err);
  process.exit(1);
});
