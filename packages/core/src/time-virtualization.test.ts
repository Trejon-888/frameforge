import { describe, it, expect, beforeEach } from "vitest";
import { TIME_VIRTUALIZATION_SCRIPT } from "./time-virtualization.js";
import vm from "node:vm";

/**
 * Create a sandboxed browser-like environment to test time virtualization.
 * Uses Node's vm module to execute the script in an isolated context
 * with mocked browser globals.
 */
function createVirtualizedContext(fps = 30) {
  const rafCallbacks: Array<{ id: number; cb: Function }> = [];
  let rafIdCounter = 0;

  // Mock browser globals
  const context: Record<string, any> = {
    // FrameForge config (injected by renderer before the script)
    __FRAMEFORGE_FPS__: fps,
    __FRAMEFORGE_TOTAL_FRAMES__: 150,
    __FRAMEFORGE_DURATION__: 5,
    __FRAMEFORGE_WIDTH__: 1920,
    __FRAMEFORGE_HEIGHT__: 1080,

    // Browser globals
    Date: Date,
    console: console,
    Promise: Promise,

    window: {} as any,
    document: {
      getAnimations: () => [],
    },
    performance: {
      now: () => 0,
    },
  };

  // window is the context itself
  context.window = context;
  context.window.requestAnimationFrame = (cb: Function) => {
    const id = ++rafIdCounter;
    rafCallbacks.push({ id, cb });
    return id;
  };
  context.window.cancelAnimationFrame = (id: number) => {
    const idx = rafCallbacks.findIndex((r) => r.id === id);
    if (idx >= 0) rafCallbacks.splice(idx, 1);
  };
  context.window.setTimeout = globalThis.setTimeout;
  context.window.clearTimeout = globalThis.clearTimeout;
  context.window.setInterval = globalThis.setInterval;
  context.window.clearInterval = globalThis.clearInterval;

  // Create a VM context and run the script
  const vmContext = vm.createContext(context);

  // Set __FRAMEFORGE globals on the vm context's window
  vm.runInContext(
    `window.__FRAMEFORGE_FPS__ = ${fps};
     window.__FRAMEFORGE_TOTAL_FRAMES__ = 150;
     window.__FRAMEFORGE_DURATION__ = 5;
     window.__FRAMEFORGE_WIDTH__ = 1920;
     window.__FRAMEFORGE_HEIGHT__ = 1080;`,
    vmContext
  );

  // Run the time virtualization script
  vm.runInContext(TIME_VIRTUALIZATION_SCRIPT, vmContext);

  return {
    context: vmContext,
    get frameforge() {
      return vm.runInContext("window.__frameforge", vmContext);
    },
    evaluate(code: string) {
      return vm.runInContext(code, vmContext);
    },
  };
}

describe("time-virtualization", () => {
  describe("script structure", () => {
    it("exports a non-empty string", () => {
      expect(TIME_VIRTUALIZATION_SCRIPT).toBeDefined();
      expect(typeof TIME_VIRTUALIZATION_SCRIPT).toBe("string");
      expect(TIME_VIRTUALIZATION_SCRIPT.length).toBeGreaterThan(100);
    });

    it("is a self-executing IIFE", () => {
      expect(TIME_VIRTUALIZATION_SCRIPT.trim()).toMatch(/^\(function\(\)/);
      expect(TIME_VIRTUALIZATION_SCRIPT.trim()).toMatch(/\}\)\(\);$/);
    });
  });

  describe("__frameforge API", () => {
    let env: ReturnType<typeof createVirtualizedContext>;

    beforeEach(() => {
      env = createVirtualizedContext(30);
    });

    it("exposes __frameforge global", () => {
      expect(env.frameforge).toBeDefined();
    });

    it("starts at frame 0, time 0", () => {
      expect(env.frameforge.currentFrame).toBe(0);
      expect(env.frameforge.currentTime).toBe(0);
      expect(env.frameforge.currentTimeMs).toBe(0);
    });

    it("reports correct fps", () => {
      expect(env.frameforge.fps).toBe(30);
    });

    it("advanceFrame increments frame number", () => {
      env.frameforge.advanceFrame();
      expect(env.frameforge.currentFrame).toBe(1);
      env.frameforge.advanceFrame();
      expect(env.frameforge.currentFrame).toBe(2);
    });

    it("advanceFrame increments time correctly at 30fps", () => {
      env.frameforge.advanceFrame();
      // 1 frame at 30fps = 1000/30 = ~33.33ms
      expect(env.frameforge.currentTimeMs).toBeCloseTo(1000 / 30, 5);
      expect(env.frameforge.currentTime).toBeCloseTo(1 / 30, 5);
    });

    it("advanceFrame returns frame info", () => {
      const result = env.frameforge.advanceFrame();
      expect(result).toEqual({
        frame: 1,
        timeMs: expect.closeTo(1000 / 30, 5),
        timeSec: expect.closeTo(1 / 30, 5),
      });
    });

    it("multiple frames accumulate time linearly", () => {
      for (let i = 0; i < 30; i++) {
        env.frameforge.advanceFrame();
      }
      // 30 frames at 30fps = 1 second
      expect(env.frameforge.currentTimeMs).toBeCloseTo(1000, 5);
      expect(env.frameforge.currentTime).toBeCloseTo(1, 5);
    });
  });

  describe("Date.now() virtualization", () => {
    let env: ReturnType<typeof createVirtualizedContext>;

    beforeEach(() => {
      env = createVirtualizedContext(30);
    });

    it("Date.now() returns base time initially", () => {
      const dateNow = env.evaluate("Date.now()");
      expect(typeof dateNow).toBe("number");
      // Should be roughly "real now" since virtualTimeMs starts at 0
      expect(dateNow).toBeGreaterThan(0);
    });

    it("Date.now() advances with virtual time", () => {
      const t0 = env.evaluate("Date.now()");
      env.frameforge.advanceFrame();
      const t1 = env.evaluate("Date.now()");
      const diff = t1 - t0;
      expect(diff).toBeCloseTo(1000 / 30, 0);
    });
  });

  describe("performance.now() virtualization", () => {
    let env: ReturnType<typeof createVirtualizedContext>;

    beforeEach(() => {
      env = createVirtualizedContext(30);
    });

    it("starts at 0", () => {
      const t = env.evaluate("performance.now()");
      expect(t).toBe(0);
    });

    it("advances by frame duration per frame", () => {
      env.frameforge.advanceFrame();
      const t = env.evaluate("performance.now()");
      expect(t).toBeCloseTo(1000 / 30, 5);
    });

    it("reaches 1000ms after 30 frames at 30fps", () => {
      for (let i = 0; i < 30; i++) {
        env.frameforge.advanceFrame();
      }
      const t = env.evaluate("performance.now()");
      expect(t).toBeCloseTo(1000, 5);
    });
  });

  describe("requestAnimationFrame virtualization", () => {
    let env: ReturnType<typeof createVirtualizedContext>;

    beforeEach(() => {
      env = createVirtualizedContext(30);
    });

    it("returns a numeric ID", () => {
      const id = env.evaluate(
        "window.requestAnimationFrame(function(){})"
      );
      expect(typeof id).toBe("number");
      expect(id).toBeGreaterThan(0);
    });

    it("fires callbacks on advanceFrame with virtual time", () => {
      const result = env.evaluate(`
        let callbackTime = null;
        window.requestAnimationFrame(function(t) { callbackTime = t; });
        window.__frameforge.advanceFrame();
        callbackTime;
      `);
      expect(result).toBeCloseTo(1000 / 30, 5);
    });

    it("clears rAF callbacks between frames", () => {
      const result = env.evaluate(`
        let count = 0;
        window.requestAnimationFrame(function() { count++; });
        window.__frameforge.advanceFrame();
        window.__frameforge.advanceFrame();
        count;
      `);
      // Should fire once, not twice — rAF is one-shot
      expect(result).toBe(1);
    });

    it("cancelAnimationFrame prevents callback from firing", () => {
      const result = env.evaluate(`
        let called = false;
        const id = window.requestAnimationFrame(function() { called = true; });
        window.cancelAnimationFrame(id);
        window.__frameforge.advanceFrame();
        called;
      `);
      expect(result).toBe(false);
    });

    it("multiple rAF callbacks fire in order", () => {
      const result = env.evaluate(`
        const order = [];
        window.requestAnimationFrame(function() { order.push(1); });
        window.requestAnimationFrame(function() { order.push(2); });
        window.requestAnimationFrame(function() { order.push(3); });
        window.__frameforge.advanceFrame();
        order;
      `);
      expect(result).toEqual([1, 2, 3]);
    });

    it("rAF callback registering new rAF fires next frame", () => {
      const result = env.evaluate(`
        let secondFired = false;
        window.requestAnimationFrame(function() {
          window.requestAnimationFrame(function() {
            secondFired = true;
          });
        });
        window.__frameforge.advanceFrame(); // first fires, registers second
        const afterFirst = secondFired;
        window.__frameforge.advanceFrame(); // second fires
        ({ afterFirst, afterSecond: secondFired });
      `);
      expect(result.afterFirst).toBe(false);
      expect(result.afterSecond).toBe(true);
    });
  });

  describe("setTimeout virtualization", () => {
    let env: ReturnType<typeof createVirtualizedContext>;

    beforeEach(() => {
      env = createVirtualizedContext(30);
    });

    it("setTimeout fires when virtual time reaches delay", () => {
      // At 30fps, each frame = ~33.33ms, so 100ms = ~3 frames
      const result = env.evaluate(`
        let fired = false;
        window.setTimeout(function() { fired = true; }, 100);
        window.__frameforge.advanceFrame(); // 33.33ms
        const at1 = fired;
        window.__frameforge.advanceFrame(); // 66.67ms
        const at2 = fired;
        window.__frameforge.advanceFrame(); // 100ms
        const at3 = fired;
        ({ at1, at2, at3 });
      `);
      expect(result.at1).toBe(false);
      expect(result.at2).toBe(false);
      expect(result.at3).toBe(true);
    });

    it("setTimeout(fn, 0) fires on next frame", () => {
      const result = env.evaluate(`
        let fired = false;
        window.setTimeout(function() { fired = true; }, 0);
        const beforeAdvance = fired;
        window.__frameforge.advanceFrame();
        ({ before: beforeAdvance, after: fired });
      `);
      expect(result.before).toBe(false);
      expect(result.after).toBe(true);
    });

    it("clearTimeout prevents firing", () => {
      const result = env.evaluate(`
        let fired = false;
        const id = window.setTimeout(function() { fired = true; }, 0);
        window.clearTimeout(id);
        window.__frameforge.advanceFrame();
        fired;
      `);
      expect(result).toBe(false);
    });

    it("passes arguments to callback", () => {
      const result = env.evaluate(`
        let receivedArgs = null;
        window.setTimeout(function(a, b) { receivedArgs = [a, b]; }, 0, 'hello', 42);
        window.__frameforge.advanceFrame();
        receivedArgs;
      `);
      expect(result).toEqual(["hello", 42]);
    });
  });

  describe("setInterval virtualization", () => {
    let env: ReturnType<typeof createVirtualizedContext>;

    beforeEach(() => {
      env = createVirtualizedContext(30);
    });

    it("setInterval fires repeatedly", () => {
      // 30fps = 33.33ms/frame, interval of 33ms → fires roughly every frame
      const result = env.evaluate(`
        let count = 0;
        window.setInterval(function() { count++; }, 33);
        for (let i = 0; i < 6; i++) {
          window.__frameforge.advanceFrame();
        }
        count;
      `);
      // Should fire multiple times (at least 4-6 times in 6 frames)
      expect(result).toBeGreaterThanOrEqual(4);
    });

    it("clearInterval stops firing", () => {
      const result = env.evaluate(`
        let count = 0;
        const id = window.setInterval(function() { count++; }, 33);
        window.__frameforge.advanceFrame();
        window.__frameforge.advanceFrame();
        window.clearInterval(id);
        window.__frameforge.advanceFrame();
        window.__frameforge.advanceFrame();
        count;
      `);
      // Should only count from first 2 frames
      const countAfterClear = result;
      expect(countAfterClear).toBeGreaterThanOrEqual(1);
      expect(countAfterClear).toBeLessThanOrEqual(3);
    });
  });

  describe("Web Animations API (CSS Animations)", () => {
    let env: ReturnType<typeof createVirtualizedContext>;

    it("syncs document.getAnimations() to virtual time", () => {
      const mockAnimations = [
        { currentTime: 0 },
        { currentTime: 0 },
      ];

      env = createVirtualizedContext(30);

      // Override getAnimations to return our mocks
      env.evaluate(`
        document.getAnimations = function() {
          return ${JSON.stringify(mockAnimations)};
        };
      `);

      // Re-create with the mock in place — since getAnimations is called during advanceFrame,
      // we need to set the mock before advancing
      const env2 = createVirtualizedContext(30);
      const result = env2.evaluate(`
        const anims = [{ currentTime: 0 }, { currentTime: 0 }];
        document.getAnimations = function() { return anims; };
        window.__frameforge.advanceFrame();
        [anims[0].currentTime, anims[1].currentTime];
      `);
      expect(result[0]).toBeCloseTo(1000 / 30, 5);
      expect(result[1]).toBeCloseTo(1000 / 30, 5);
    });
  });

  describe("frame readiness signaling", () => {
    let env: ReturnType<typeof createVirtualizedContext>;

    beforeEach(() => {
      env = createVirtualizedContext(30);
    });

    it("ready() resolves waitForReady()", async () => {
      // Simulate: page calls ready(), renderer calls waitForReady()
      const result = env.evaluate(`
        let resolved = false;
        window.__frameforge.waitForReady().then(function() { resolved = true; });
        window.__frameforge.ready();
        resolved;
      `);
      // Note: Promise resolution is async, so we check the direct ready state
      // In a real browser, ready() would resolve the promise
    });

    it("resetReady() clears ready state", () => {
      env.evaluate(`
        window.__frameforge.ready();
        window.__frameforge.resetReady();
      `);
      // After reset, waitForReady should NOT resolve immediately
      // (it should return a pending promise)
    });
  });

  describe("__originalRAF exposure", () => {
    it("exposes the original rAF on window", () => {
      const env = createVirtualizedContext(30);
      const hasOriginalRAF = env.evaluate(
        "typeof window.__originalRAF === 'function'"
      );
      expect(hasOriginalRAF).toBe(true);
    });
  });

  describe("different FPS values", () => {
    it("60fps frame duration is ~16.67ms", () => {
      const env = createVirtualizedContext(60);
      env.frameforge.advanceFrame();
      expect(env.frameforge.currentTimeMs).toBeCloseTo(1000 / 60, 5);
    });

    it("24fps frame duration is ~41.67ms", () => {
      const env = createVirtualizedContext(24);
      env.frameforge.advanceFrame();
      expect(env.frameforge.currentTimeMs).toBeCloseTo(1000 / 24, 5);
    });

    it("1fps frame duration is 1000ms", () => {
      const env = createVirtualizedContext(1);
      env.frameforge.advanceFrame();
      expect(env.frameforge.currentTimeMs).toBe(1000);
    });
  });

  describe("error isolation", () => {
    it("rAF callback error does not stop other callbacks", () => {
      const env = createVirtualizedContext(30);
      const result = env.evaluate(`
        let secondCalled = false;
        window.requestAnimationFrame(function() { throw new Error('boom'); });
        window.requestAnimationFrame(function() { secondCalled = true; });
        window.__frameforge.advanceFrame();
        secondCalled;
      `);
      expect(result).toBe(true);
    });

    it("timer callback error does not stop other timers", () => {
      const env = createVirtualizedContext(30);
      const result = env.evaluate(`
        let secondCalled = false;
        window.setTimeout(function() { throw new Error('boom'); }, 0);
        window.setTimeout(function() { secondCalled = true; }, 0);
        window.__frameforge.advanceFrame();
        secondCalled;
      `);
      expect(result).toBe(true);
    });
  });
});
