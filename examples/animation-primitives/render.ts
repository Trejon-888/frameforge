/**
 * Animation Primitives Example
 *
 * Demonstrates the high-level animation API:
 * fadeIn, slideIn, scaleIn, stagger
 *
 * Run: pnpm exec tsx examples/animation-primitives/render.ts
 */
import {
  Scene,
  Text,
  Shape,
  fadeIn,
  slideIn,
  scaleIn,
  stagger,
} from "@frameforge/sdk";

const scene = new Scene({
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 5,
  background: "#0f0f23",
});

// Title with fadeIn + slideIn
const title = new Text("Animation Primitives", {
  fontSize: 64,
  fontWeight: "bold",
  color: "#ffffff",
  x: 960,
  y: 200,
  opacity: 0,
});
// Apply fadeIn preset
const fi = fadeIn(0.3, 1.3);
title.animate(fi.property, fi.keyframes);
// Apply slideIn preset
const si = slideIn("up", 0.3, 1.3, 40);
for (const p of si) {
  title.animate(p.property, p.keyframes);
}

// Subtitle
const subtitle = new Text("fadeIn · slideIn · scaleIn · stagger", {
  fontSize: 28,
  color: "#818cf8",
  x: 960,
  y: 280,
  opacity: 0,
});
const subFade = fadeIn(1.0, 1.8);
subtitle.animate(subFade.property, subFade.keyframes);

// Staggered cards
const colors = ["#6366f1", "#ec4899", "#f97316", "#10b981", "#3b82f6"];
const labels = ["Fade", "Slide", "Scale", "Rotate", "Stagger"];
const cards: Shape[] = [];
const cardLabels: Text[] = [];

for (let i = 0; i < 5; i++) {
  const card = new Shape("rect", {
    width: 200,
    height: 120,
    fill: colors[i],
    x: 280 + i * 320,
    y: 550,
    opacity: 0,
    borderRadius: 16,
  });

  const label = new Text(labels[i], {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    x: 280 + i * 320,
    y: 550,
    opacity: 0,
  });

  cards.push(card);
  cardLabels.push(label);
}

// Stagger the cards with fadeIn
stagger(cards, fadeIn, 1.5, 0.6, 0.15);
stagger(
  cards,
  (start, end) => slideIn("up", start, end, 50),
  1.5,
  0.6,
  0.15
);

// Stagger the labels slightly behind the cards
stagger(cardLabels, fadeIn, 1.8, 0.4, 0.15);

// Scale-in circle
const circle = new Shape("circle", {
  width: 80,
  height: 80,
  fill: "#fbbf24",
  x: 960,
  y: 800,
  opacity: 0,
});
const scPreset = scaleIn(3.0, 3.8);
circle.animate(scPreset.property, scPreset.keyframes);
circle.animate("opacity", { 3.0: 0, 3.3: 1 });

// Footer
const footer = new Text("@frameforge/sdk", {
  fontSize: 20,
  color: "rgba(255,255,255,0.3)",
  x: 960,
  y: 950,
  opacity: 0,
});
const footerFade = fadeIn(3.5, 4.2);
footer.animate(footerFade.property, footerFade.keyframes);

scene.add(title, subtitle, ...cards, ...cardLabels, circle, footer);

console.log("Rendering animation primitives example...");
scene
  .render("./examples/animation-primitives/output/primitives.mp4")
  .then((path) => console.log(`Done: ${path}`))
  .catch((err) => {
    console.error("Render failed:", err.message);
    process.exit(1);
  });
