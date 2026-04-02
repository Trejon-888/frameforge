import { describe, it, expect } from "vitest";
import { createEasing, listEasings } from "./easing.js";

describe("keyframes.easing", () => {
  describe("createEasing", () => {
    it("linear: identity function", () => {
      const fn = createEasing("linear");
      expect(fn(0)).toBe(0);
      expect(fn(0.5)).toBe(0.5);
      expect(fn(1)).toBe(1);
    });

    it("ease-out: faster start, slower end", () => {
      const fn = createEasing("ease-out");
      expect(fn(0)).toBeCloseTo(0, 3);
      expect(fn(1)).toBeCloseTo(1, 3);
      expect(fn(0.5)).toBeGreaterThan(0.5);
    });

    it("ease-in: slower start, faster end", () => {
      const fn = createEasing("ease-in");
      expect(fn(0)).toBeCloseTo(0, 3);
      expect(fn(1)).toBeCloseTo(1, 3);
      expect(fn(0.5)).toBeLessThan(0.5);
    });

    it("ease-in-out: S-curve", () => {
      const fn = createEasing("ease-in-out");
      expect(fn(0)).toBeCloseTo(0, 3);
      expect(fn(1)).toBeCloseTo(1, 3);
      expect(fn(0.5)).toBeCloseTo(0.5, 1); // midpoint ~= 0.5
    });

    it("power2.out: quadratic ease-out", () => {
      const fn = createEasing("power2.out");
      expect(fn(0)).toBe(0);
      expect(fn(1)).toBe(1);
      expect(fn(0.5)).toBeGreaterThan(0.5);
    });

    it("power3.in: cubic ease-in", () => {
      const fn = createEasing("power3.in");
      expect(fn(0)).toBe(0);
      expect(fn(1)).toBe(1);
      expect(fn(0.5)).toBeLessThan(0.25); // 0.5^3 = 0.125
    });

    it("back.out: overshoots then settles", () => {
      const fn = createEasing("back.out");
      expect(fn(0)).toBeCloseTo(0, 2);
      expect(fn(1)).toBeCloseTo(1, 2);
      // Should overshoot 1.0 somewhere in the middle
      let maxVal = 0;
      for (let t = 0; t <= 1; t += 0.01) {
        maxVal = Math.max(maxVal, fn(t));
      }
      expect(maxVal).toBeGreaterThan(1);
    });

    it("elastic.out: bounces past target", () => {
      const fn = createEasing("elastic.out");
      expect(fn(0)).toBeCloseTo(0, 2);
      expect(fn(1)).toBeCloseTo(1, 2);
    });

    it("expo.out: exponential deceleration", () => {
      const fn = createEasing("expo.out");
      expect(fn(0)).toBe(0);
      expect(fn(1)).toBe(1);
      expect(fn(0.3)).toBeGreaterThan(0.85); // very fast start
    });

    it("sine.out: sinusoidal ease-out", () => {
      const fn = createEasing("sine.out");
      expect(fn(0)).toBeCloseTo(0, 5);
      expect(fn(1)).toBeCloseTo(1, 5);
      expect(fn(0.5)).toBeGreaterThan(0.5);
    });

    it("parses cubic-bezier(x1,y1,x2,y2)", () => {
      const fn = createEasing("cubic-bezier(0.16, 1, 0.3, 1)");
      expect(fn(0)).toBeCloseTo(0, 3);
      expect(fn(1)).toBeCloseTo(1, 3);
      // This aggressive ease-out should be past 0.9 at midpoint
      expect(fn(0.5)).toBeGreaterThan(0.9);
    });

    it("parses step(n)", () => {
      const fn = createEasing("step(4)");
      expect(fn(0)).toBe(0);
      expect(fn(0.24)).toBe(0);
      expect(fn(0.25)).toBe(0.25);
      expect(fn(0.49)).toBe(0.25);
      expect(fn(0.5)).toBe(0.5);
      expect(fn(0.99)).toBe(0.75);
    });

    it("returns linear for unknown spec", () => {
      const fn = createEasing("unknown-easing");
      expect(fn(0.5)).toBe(0.5);
    });

    it("returns linear for empty string", () => {
      const fn = createEasing("");
      expect(fn(0.5)).toBe(0.5);
    });
  });

  describe("listEasings", () => {
    it("returns all preset names", () => {
      const names = listEasings();
      expect(names).toContain("linear");
      expect(names).toContain("ease-out");
      expect(names).toContain("power3.inOut");
      expect(names).toContain("back.out");
      expect(names).toContain("elastic.out");
      expect(names).toContain("expo.out");
      expect(names).toContain("sine.out");
      expect(names.length).toBeGreaterThan(20);
    });
  });
});
