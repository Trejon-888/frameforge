import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    clean: true,
    target: "node20",
    splitting: false,
    sourcemap: true,
    external: [
      "puppeteer",
      "fastify",
      "@fastify/websocket",
      "@fastify/static",
      "chokidar",
      "@frameforge/core",
      "open",
    ],
  },
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    dts: false,
    clean: false,
    target: "node20",
    splitting: false,
    sourcemap: true,
    // banner removed — shebang conflicts with Node ESM direct execution
    external: [
      "puppeteer",
      "fastify",
      "@fastify/websocket",
      "@fastify/static",
      "chokidar",
      "@frameforge/core",
      "open",
      "commander",
      "chalk",
    ],
  },
]);
