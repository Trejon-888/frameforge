import { describe, it, expect } from "vitest";
import {
  validateComposition,
  getActiveScenesAtTime,
  getAllSoundCues,
  getElementsAtTime,
  type SceneComposition,
} from "./scene.js";

const VALID_COMP: SceneComposition = {
  version: "2.0",
  canvas: { width: 1080, height: 1920, fps: 30, duration: 10 },
  scenes: [
    {
      id: "intro",
      start: 0,
      end: 3,
      mode: "full-frame",
      background: "#000000",
      elements: [
        {
          id: "title",
          type: "text",
          props: { content: "HELLO" },
          animations: [
            { property: "opacity", keyframes: [{ time: 0, value: 0 }, { time: 1, value: 1 }] },
          ],
        },
      ],
      sound: [
        { type: "whoosh-in", time: 0 },
        { type: "kick", time: 1.5 },
      ],
    },
    {
      id: "middle",
      start: 3,
      end: 7,
      mode: "overlay",
      elements: [
        {
          id: "circle",
          type: "circle",
          props: { cx: 540, cy: 960, r: 100 },
          animations: [],
        },
      ],
    },
    {
      id: "outro",
      start: 7,
      end: 10,
      mode: "full-frame",
      elements: [],
      sound: [{ type: "hit", time: 0 }],
    },
  ],
};

describe("keyframes.scene", () => {
  describe("validateComposition", () => {
    it("accepts valid composition", () => {
      expect(validateComposition(VALID_COMP)).toEqual([]);
    });

    it("rejects null", () => {
      const errors = validateComposition(null);
      expect(errors.length).toBe(1);
    });

    it("rejects wrong version", () => {
      const errors = validateComposition({ ...VALID_COMP, version: "1.0" });
      expect(errors.some((e) => e.path === "version")).toBe(true);
    });

    it("rejects missing canvas", () => {
      const errors = validateComposition({ ...VALID_COMP, canvas: undefined });
      expect(errors.some((e) => e.path === "canvas")).toBe(true);
    });

    it("rejects invalid scene", () => {
      const bad = {
        ...VALID_COMP,
        scenes: [{ id: "x", start: 5, end: 3, mode: "overlay", elements: [] }],
      };
      const errors = validateComposition(bad);
      expect(errors.some((e) => e.message.includes("start must be < end"))).toBe(true);
    });

    it("rejects invalid mode", () => {
      const bad = {
        ...VALID_COMP,
        scenes: [{ id: "x", start: 0, end: 1, mode: "invalid", elements: [] }],
      };
      const errors = validateComposition(bad);
      expect(errors.some((e) => e.message.includes("Invalid mode"))).toBe(true);
    });
  });

  describe("getActiveScenesAtTime", () => {
    it("returns scenes active at a time", () => {
      expect(getActiveScenesAtTime(VALID_COMP, 1).map((s) => s.id)).toEqual(["intro"]);
      expect(getActiveScenesAtTime(VALID_COMP, 5).map((s) => s.id)).toEqual(["middle"]);
      expect(getActiveScenesAtTime(VALID_COMP, 8).map((s) => s.id)).toEqual(["outro"]);
    });

    it("returns empty for gaps between scenes", () => {
      const comp: SceneComposition = {
        ...VALID_COMP,
        scenes: [
          { id: "a", start: 0, end: 2, mode: "overlay", elements: [] },
          { id: "b", start: 5, end: 8, mode: "overlay", elements: [] },
        ],
      };
      expect(getActiveScenesAtTime(comp, 3)).toEqual([]);
    });

    it("returns overlapping scenes", () => {
      const comp: SceneComposition = {
        ...VALID_COMP,
        scenes: [
          { id: "a", start: 0, end: 5, mode: "overlay", elements: [] },
          { id: "b", start: 3, end: 8, mode: "overlay", elements: [] },
        ],
      };
      expect(getActiveScenesAtTime(comp, 4).map((s) => s.id)).toEqual(["a", "b"]);
    });
  });

  describe("getAllSoundCues", () => {
    it("collects and sorts all cues with absolute times", () => {
      const cues = getAllSoundCues(VALID_COMP);
      expect(cues).toHaveLength(3);
      // intro: whoosh at 0+0=0, kick at 0+1.5=1.5
      // outro: hit at 7+0=7
      expect(cues[0].absoluteTime).toBe(0);
      expect(cues[0].type).toBe("whoosh-in");
      expect(cues[1].absoluteTime).toBe(1.5);
      expect(cues[1].type).toBe("kick");
      expect(cues[2].absoluteTime).toBe(7);
      expect(cues[2].type).toBe("hit");
    });
  });

  describe("getElementsAtTime", () => {
    it("returns elements from active scenes", () => {
      const els = getElementsAtTime(VALID_COMP, 1);
      expect(els).toHaveLength(1);
      expect(els[0].id).toBe("title");
    });

    it("returns empty when no scene is active", () => {
      const comp: SceneComposition = {
        ...VALID_COMP,
        scenes: [{ id: "a", start: 5, end: 8, mode: "overlay", elements: [] }],
      };
      expect(getElementsAtTime(comp, 1)).toEqual([]);
    });
  });
});
