import { describe, it, expect } from "vitest";
import { Text } from "./text.js";
import { Shape } from "./shape.js";
import { Image } from "./image.js";

describe("Text element", () => {
  it("creates with default options", () => {
    const text = new Text("Hello");
    const el = text.toSceneElement();
    expect(el.type).toBe("text");
    expect(el.props.content).toBe("Hello");
    expect(el.props.fontSize).toBe(48);
    expect(el.props.color).toBe("#ffffff");
    expect(el.props.x).toBe(960);
    expect(el.props.y).toBe(540);
    expect(el.animations).toEqual([]);
  });

  it("accepts custom options", () => {
    const text = new Text("Custom", {
      fontSize: 72,
      color: "#ff0000",
      x: 100,
      y: 200,
      fontWeight: "bold",
    });
    const el = text.toSceneElement();
    expect(el.props.fontSize).toBe(72);
    expect(el.props.color).toBe("#ff0000");
    expect(el.props.x).toBe(100);
    expect(el.props.fontWeight).toBe("bold");
  });

  it("supports chainable animate()", () => {
    const text = new Text("Animated")
      .animate("opacity", { 0: 0, 1: 1 })
      .animate("y", { 0: 600, 1: 500 });

    const el = text.toSceneElement();
    expect(el.animations).toHaveLength(2);
    expect(el.animations[0].property).toBe("opacity");
    expect(el.animations[1].property).toBe("y");
  });
});

describe("Shape element", () => {
  it("creates rect with defaults", () => {
    const shape = new Shape("rect");
    const el = shape.toSceneElement();
    expect(el.type).toBe("shape");
    expect(el.props.shapeType).toBe("rect");
    expect(el.props.width).toBe(100);
    expect(el.props.height).toBe(100);
    expect(el.props.fill).toBe("#ffffff");
  });

  it("creates circle", () => {
    const shape = new Shape("circle", { fill: "#ff0000", width: 200, height: 200 });
    const el = shape.toSceneElement();
    expect(el.props.shapeType).toBe("circle");
    expect(el.props.fill).toBe("#ff0000");
    expect(el.props.width).toBe(200);
  });

  it("supports animations", () => {
    const shape = new Shape("rect").animate("width", { 0: 0, 2: 500 });
    expect(shape.toSceneElement().animations).toHaveLength(1);
  });
});

describe("Image element", () => {
  it("creates with default options", () => {
    const img = new Image("photo.jpg");
    const el = img.toSceneElement();
    expect(el.type).toBe("image");
    expect(el.props.src).toBe("photo.jpg");
    expect(el.props.width).toBe(400);
    expect(el.props.height).toBe(300);
    expect(el.props.objectFit).toBe("cover");
    expect(el.props.borderRadius).toBe(0);
  });

  it("accepts custom options", () => {
    const img = new Image("banner.png", {
      width: 1920,
      height: 1080,
      objectFit: "contain",
      borderRadius: 16,
      opacity: 0.8,
    });
    const el = img.toSceneElement();
    expect(el.props.width).toBe(1920);
    expect(el.props.height).toBe(1080);
    expect(el.props.objectFit).toBe("contain");
    expect(el.props.borderRadius).toBe(16);
    expect(el.props.opacity).toBe(0.8);
  });

  it("supports animations", () => {
    const img = new Image("pic.jpg")
      .animate("opacity", { 0: 0, 1: 1 })
      .animate("width", { 0: 200, 2: 600 });

    const el = img.toSceneElement();
    expect(el.animations).toHaveLength(2);
  });
});
