import { describe, it, expect } from "vitest";
import { Scene } from "./scene.js";
import { Text } from "./elements/text.js";
import { Shape } from "./elements/shape.js";
import { Image } from "./elements/image.js";
import { generateHTML } from "./codegen.js";

describe("codegen", () => {
  it("generates valid HTML document", () => {
    const scene = new Scene({ duration: 3 });
    const html = generateHTML(scene);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
    expect(html).toContain("__frameforge");
  });

  it("sets canvas dimensions in styles", () => {
    const scene = new Scene({ width: 3840, height: 2160, duration: 5 });
    const html = generateHTML(scene);
    expect(html).toContain("width: 3840px");
    expect(html).toContain("height: 2160px");
  });

  it("renders text elements", () => {
    const scene = new Scene({ duration: 3 });
    scene.add(new Text("Hello World", { fontSize: 72, color: "#ff0000" }));
    const html = generateHTML(scene);
    expect(html).toContain("Hello World");
    expect(html).toContain("font-size: 72px");
    expect(html).toContain("color: #ff0000");
  });

  it("renders shape elements", () => {
    const scene = new Scene({ duration: 3 });
    scene.add(new Shape("circle", { width: 200, height: 200, fill: "#00ff00" }));
    const html = generateHTML(scene);
    expect(html).toContain("width: 200px");
    expect(html).toContain("background: #00ff00");
    expect(html).toContain("border-radius: 50%");
  });

  it("renders image elements", () => {
    const scene = new Scene({ duration: 3 });
    scene.add(new Image("test.jpg", { width: 800, height: 600 }));
    const html = generateHTML(scene);
    expect(html).toContain('<img');
    expect(html).toContain('src="test.jpg"');
    expect(html).toContain("width: 800px");
    expect(html).toContain("height: 600px");
    expect(html).toContain("object-fit: cover");
  });

  it("generates animation JavaScript", () => {
    const scene = new Scene({ duration: 3 });
    const text = new Text("Animated").animate("opacity", { 0: 0, 1: 1 });
    scene.add(text);
    const html = generateHTML(scene);
    expect(html).toContain("Animate: opacity");
    expect(html).toContain("keyframes");
  });

  it("handles scale transform animation", () => {
    const scene = new Scene({ duration: 3 });
    const shape = new Shape("rect").animate("scale", { 0: 0, 1: 1 });
    scene.add(shape);
    const html = generateHTML(scene);
    expect(html).toContain("scale(");
    expect(html).toContain("translate(-50%, -50%)");
  });

  it("handles rotation transform animation", () => {
    const scene = new Scene({ duration: 3 });
    const shape = new Shape("rect").animate("rotation", { 0: 0, 1: 360 });
    scene.add(shape);
    const html = generateHTML(scene);
    expect(html).toContain("rotate(");
    expect(html).toContain("deg");
  });

  it("escapes HTML in text content", () => {
    const scene = new Scene({ duration: 3 });
    scene.add(new Text("<script>alert('xss')</script>"));
    const html = generateHTML(scene);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("generates animation loop", () => {
    const scene = new Scene({ duration: 3 });
    const html = generateHTML(scene);
    expect(html).toContain("requestAnimationFrame(loop)");
    expect(html).toContain("updateAnimations()");
  });
});
