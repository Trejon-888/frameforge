/**
 * SDK-TS Integration Example
 *
 * Demonstrates the programmatic TypeScript API:
 *   Scene → add elements → animate → render → MP4
 *
 * Run: npx tsx examples/sdk-ts/render.ts
 */
import { Scene, Text, Shape } from "@frameforge/sdk";

const scene = new Scene({
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 4,
  background: "#1a1a2e",
});

// Title text — fades in and slides up
const title = new Text("FrameForge SDK", {
  fontSize: 72,
  fontWeight: "bold",
  color: "#e94560",
  x: 960,
  y: 400,
  opacity: 0,
});
title
  .animate("opacity", { 0: 0, 0.5: 0, 1.5: 1 })
  .animate("y", { 0: 460, 0.5: 460, 1.5: 400 });

// Subtitle — appears after title
const subtitle = new Text("Programmatic video from TypeScript", {
  fontSize: 36,
  color: "#ffffff",
  x: 960,
  y: 500,
  opacity: 0,
});
subtitle.animate("opacity", { 0: 0, 1.5: 0, 2.5: 1 });

// Animated accent bar
const bar = new Shape("rect", {
  width: 0,
  height: 4,
  fill: "#e94560",
  x: 960,
  y: 460,
  opacity: 1,
});
bar.animate("width", { 0: 0, 1.0: 0, 2.0: 500 });

// Decorative circle — pulses in
const circle = new Shape("circle", {
  width: 120,
  height: 120,
  fill: "#0f3460",
  x: 960,
  y: 700,
  opacity: 0,
});
circle
  .animate("opacity", { 0: 0, 2.5: 0, 3.0: 1 })
  .animate("width", { 2.5: 60, 3.0: 120 })
  .animate("height", { 2.5: 60, 3.0: 120 });

scene.add(title, subtitle, bar, circle);

console.log("Rendering SDK-TS example...");
scene
  .render("./examples/sdk-ts/output/sdk-demo.mp4")
  .then((path) => console.log(`Done: ${path}`))
  .catch((err) => {
    console.error("Render failed:", err.message);
    process.exit(1);
  });
