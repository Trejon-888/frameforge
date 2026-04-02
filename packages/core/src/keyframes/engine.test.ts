import { describe, it, expect } from "vitest";
import {
  interpolateProperty,
  resolveAtTime,
  resolveTree,
  element,
  stagger,
  type PropertyTimeline,
} from "./engine.js";

describe("keyframes.engine", () => {
  describe("interpolateProperty", () => {
    it("returns 0 for empty keyframes", () => {
      expect(interpolateProperty({ property: "x", keyframes: [] }, 0)).toBe(0);
    });

    it("returns value for single keyframe at any time", () => {
      const tl: PropertyTimeline = {
        property: "x",
        keyframes: [{ time: 1, value: 100 }],
      };
      expect(interpolateProperty(tl, 0)).toBe(100);
      expect(interpolateProperty(tl, 1)).toBe(100);
      expect(interpolateProperty(tl, 5)).toBe(100);
    });

    it("holds before first keyframe", () => {
      const tl: PropertyTimeline = {
        property: "x",
        keyframes: [
          { time: 1, value: 0 },
          { time: 2, value: 100 },
        ],
      };
      expect(interpolateProperty(tl, 0)).toBe(0);
      expect(interpolateProperty(tl, 0.5)).toBe(0);
    });

    it("holds after last keyframe", () => {
      const tl: PropertyTimeline = {
        property: "x",
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 100 },
        ],
      };
      expect(interpolateProperty(tl, 2)).toBe(100);
      expect(interpolateProperty(tl, 999)).toBe(100);
    });

    it("interpolates linearly by default", () => {
      const tl: PropertyTimeline = {
        property: "x",
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 100, easing: "linear" },
        ],
      };
      expect(interpolateProperty(tl, 0)).toBe(0);
      expect(interpolateProperty(tl, 0.5)).toBe(50);
      expect(interpolateProperty(tl, 1)).toBe(100);
    });

    it("interpolates with ease-out", () => {
      const tl: PropertyTimeline = {
        property: "x",
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 100, easing: "ease-out" },
        ],
      };
      // ease-out should be faster at start, slower at end
      const mid = interpolateProperty(tl, 0.5);
      expect(mid).toBeGreaterThan(50); // ahead of linear
    });

    it("handles multiple keyframes", () => {
      const tl: PropertyTimeline = {
        property: "x",
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 100, easing: "linear" },
          { time: 2, value: 0, easing: "linear" },
        ],
      };
      expect(interpolateProperty(tl, 0)).toBe(0);
      expect(interpolateProperty(tl, 0.5)).toBe(50);
      expect(interpolateProperty(tl, 1)).toBe(100);
      expect(interpolateProperty(tl, 1.5)).toBe(50);
      expect(interpolateProperty(tl, 2)).toBe(0);
    });

    it("handles negative values", () => {
      const tl: PropertyTimeline = {
        property: "x",
        keyframes: [
          { time: 0, value: -100 },
          { time: 1, value: 100, easing: "linear" },
        ],
      };
      expect(interpolateProperty(tl, 0.5)).toBe(0);
    });

    it("uses cubic-bezier easing", () => {
      const tl: PropertyTimeline = {
        property: "x",
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 100, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        ],
      };
      const mid = interpolateProperty(tl, 0.5);
      // This aggressive ease-out should be well past 50 at midpoint
      expect(mid).toBeGreaterThan(80);
    });
  });

  describe("resolveAtTime", () => {
    it("resolves all animated properties", () => {
      const el = element("circle", "c1")
        .animate("cx", [{ time: 0, value: 0 }, { time: 1, value: 540 }])
        .animate("cy", [{ time: 0, value: 0 }, { time: 1, value: 960 }])
        .animate("opacity", [{ time: 0, value: 0 }, { time: 0.5, value: 1 }])
        .build();

      const at0 = resolveAtTime(el, 0);
      expect(at0.cx).toBe(0);
      expect(at0.cy).toBe(0);
      expect(at0.opacity).toBe(0);

      const at05 = resolveAtTime(el, 0.5);
      expect(at05.cx).toBe(270);
      expect(at05.cy).toBe(480);
      expect(at05.opacity).toBe(1);

      const at1 = resolveAtTime(el, 1);
      expect(at1.cx).toBe(540);
      expect(at1.cy).toBe(960);
      expect(at1.opacity).toBe(1); // holds after last keyframe
    });
  });

  describe("resolveTree", () => {
    it("resolves parent and children", () => {
      const child = element("dot", "d1")
        .animate("x", [{ time: 0, value: 0 }, { time: 1, value: 100 }])
        .build();

      const parent = element("group", "g1")
        .animate("opacity", [{ time: 0, value: 0 }, { time: 1, value: 1 }])
        .child(child)
        .build();

      const tree = resolveTree(parent, 0.5);
      expect(tree.get("g1")?.opacity).toBe(0.5);
      expect(tree.get("d1")?.x).toBe(50);
    });
  });

  describe("element builder", () => {
    it("builds a valid AnimatedElement", () => {
      const el = element("text", "title")
        .prop("content", "HELLO")
        .prop("fontSize", 80)
        .props({ color: "#fff", fontWeight: "900" })
        .animate("opacity", [
          { time: 0, value: 0 },
          { time: 0.5, value: 1, easing: "ease-out" },
        ])
        .build();

      expect(el.id).toBe("title");
      expect(el.type).toBe("text");
      expect(el.props.content).toBe("HELLO");
      expect(el.props.fontSize).toBe(80);
      expect(el.props.color).toBe("#fff");
      expect(el.animations).toHaveLength(1);
      expect(el.animations[0].property).toBe("opacity");
      expect(el.animations[0].keyframes).toHaveLength(2);
    });

    it("sorts keyframes by time", () => {
      const el = element("dot", "d1")
        .animate("x", [
          { time: 2, value: 200 },
          { time: 0, value: 0 },
          { time: 1, value: 100 },
        ])
        .build();

      expect(el.animations[0].keyframes[0].time).toBe(0);
      expect(el.animations[0].keyframes[1].time).toBe(1);
      expect(el.animations[0].keyframes[2].time).toBe(2);
    });
  });

  describe("stagger", () => {
    it("creates staggered values", () => {
      const result = stagger(4, 0.1, (i, delay) => ({ time: delay, value: 1 }));
      expect(result).toHaveLength(4);
      expect(result[0].time).toBeCloseTo(0, 10);
      expect(result[1].time).toBeCloseTo(0.1, 10);
      expect(result[2].time).toBeCloseTo(0.2, 10);
      expect(result[3].time).toBeCloseTo(0.3, 10);
      expect(result.every((r) => r.value === 1)).toBe(true);
    });
  });
});
