import { describe, it, expect } from "vitest";
import {
  fadeIn,
  fadeOut,
  slideIn,
  slideOut,
  scaleIn,
  scaleOut,
  rotateIn,
  rotateTo,
  stagger,
} from "./index.js";

describe("animation primitives", () => {
  describe("fadeIn", () => {
    it("creates opacity 0→1 animation", () => {
      const preset = fadeIn(0, 1);
      expect(preset.property).toBe("opacity");
      expect(preset.keyframes).toEqual({ 0: 0, 1: 1 });
    });

    it("supports custom timing", () => {
      const preset = fadeIn(0.5, 2.5);
      expect(preset.keyframes).toEqual({ 0.5: 0, 2.5: 1 });
    });
  });

  describe("fadeOut", () => {
    it("creates opacity 1→0 animation", () => {
      const preset = fadeOut(3, 4);
      expect(preset.property).toBe("opacity");
      expect(preset.keyframes).toEqual({ 3: 1, 4: 0 });
    });
  });

  describe("slideIn", () => {
    it("slides up with positive y offset", () => {
      const presets = slideIn("up", 0, 1, 80);
      expect(presets).toHaveLength(1);
      expect(presets[0].property).toBe("y");
      expect(presets[0].keyframes).toEqual({ 0: 80, 1: 0 });
    });

    it("slides down with negative y offset", () => {
      const presets = slideIn("down", 0, 1, 80);
      expect(presets[0].property).toBe("y");
      expect(presets[0].keyframes).toEqual({ 0: -80, 1: 0 });
    });

    it("slides left with positive x offset", () => {
      const presets = slideIn("left", 0, 1, 100);
      expect(presets[0].property).toBe("x");
      expect(presets[0].keyframes).toEqual({ 0: 100, 1: 0 });
    });

    it("slides right with negative x offset", () => {
      const presets = slideIn("right", 0, 1, 100);
      expect(presets[0].property).toBe("x");
      expect(presets[0].keyframes).toEqual({ 0: -100, 1: 0 });
    });

    it("uses default distance of 60", () => {
      const presets = slideIn("up", 0, 1);
      expect(presets[0].keyframes).toEqual({ 0: 60, 1: 0 });
    });
  });

  describe("slideOut", () => {
    it("slides up from 0 to negative", () => {
      const presets = slideOut("up", 0, 1, 80);
      expect(presets[0].property).toBe("y");
      expect(presets[0].keyframes).toEqual({ 0: 0, 1: -80 });
    });
  });

  describe("scaleIn", () => {
    it("creates scale 0→1 animation", () => {
      const preset = scaleIn(0, 1);
      expect(preset.property).toBe("scale");
      expect(preset.keyframes).toEqual({ 0: 0, 1: 1 });
    });
  });

  describe("scaleOut", () => {
    it("creates scale 1→0 animation", () => {
      const preset = scaleOut(2, 3);
      expect(preset.property).toBe("scale");
      expect(preset.keyframes).toEqual({ 2: 1, 3: 0 });
    });
  });

  describe("rotateIn", () => {
    it("creates rotation from -360 to 0", () => {
      const preset = rotateIn(0, 1);
      expect(preset.property).toBe("rotation");
      expect(preset.keyframes).toEqual({ 0: -360, 1: 0 });
    });

    it("supports custom degrees", () => {
      const preset = rotateIn(0, 1, 90);
      expect(preset.keyframes).toEqual({ 0: -90, 1: 0 });
    });
  });

  describe("rotateTo", () => {
    it("creates rotation from 0 to degrees", () => {
      const preset = rotateTo(0, 1, 180);
      expect(preset.property).toBe("rotation");
      expect(preset.keyframes).toEqual({ 0: 0, 1: 180 });
    });
  });

  describe("stagger", () => {
    it("applies animation presets with staggered timing", () => {
      const elements = [
        { animate: function(p: string, k: any) { this._calls.push({ p, k }); return this; }, _calls: [] as any[] },
        { animate: function(p: string, k: any) { this._calls.push({ p, k }); return this; }, _calls: [] as any[] },
        { animate: function(p: string, k: any) { this._calls.push({ p, k }); return this; }, _calls: [] as any[] },
      ];

      stagger(elements, fadeIn, 0, 0.5, 0.2);

      // Element 0: fadeIn(0, 0.5)
      expect(elements[0]._calls[0].k).toEqual({ 0: 0, 0.5: 1 });
      // Element 1: fadeIn(0.2, 0.7)
      expect(elements[1]._calls[0].k).toEqual({ 0.2: 0, 0.7: 1 });
      // Element 2: fadeIn(0.4, 0.9)
      expect(elements[2]._calls[0].k).toEqual({ 0.4: 0, 0.9: 1 });
    });

    it("handles multi-preset functions like slideIn", () => {
      const elements = [
        { animate: function(p: string, k: any) { this._calls.push({ p, k }); return this; }, _calls: [] as any[] },
        { animate: function(p: string, k: any) { this._calls.push({ p, k }); return this; }, _calls: [] as any[] },
      ];

      stagger(
        elements,
        (start, end) => slideIn("up", start, end),
        0,
        1,
        0.3
      );

      expect(elements[0]._calls[0].p).toBe("y");
      expect(elements[1]._calls[0].p).toBe("y");
    });
  });
});
