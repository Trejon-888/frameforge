/**
 * Time Virtualization Script
 *
 * This script is injected into the page BEFORE any other scripts load.
 * It patches all browser time APIs so the renderer can control time
 * deterministically, frame by frame.
 *
 * Patched APIs:
 * - Date.now()
 * - performance.now()
 * - requestAnimationFrame() / cancelAnimationFrame()
 * - setTimeout() / clearTimeout()
 * - setInterval() / clearInterval()
 * - document.timeline (Web Animations API)
 */
export const TIME_VIRTUALIZATION_SCRIPT = `
(function() {
  'use strict';

  // Virtual clock state
  let virtualTimeMs = 0;
  let frameNumber = 0;
  const fps = window.__FRAMEFORGE_FPS__ || 30;
  const frameDurationMs = 1000 / fps;

  // --- Date.now patch ---
  const _originalDateNow = Date.now;
  const startRealTime = _originalDateNow.call(Date);
  Date.now = function() {
    return startRealTime + virtualTimeMs;
  };

  // Patch new Date() to use virtual time
  const _OriginalDate = Date;
  const _DateProxy = new Proxy(_OriginalDate, {
    construct(target, args) {
      if (args.length === 0) {
        return new target(startRealTime + virtualTimeMs);
      }
      return new target(...args);
    },
    apply(target, thisArg, args) {
      if (args.length === 0) {
        return new target(startRealTime + virtualTimeMs).toString();
      }
      return target.apply(thisArg, args);
    },
    get(target, prop, receiver) {
      if (prop === 'now') return Date.now;
      return Reflect.get(target, prop, receiver);
    }
  });

  // --- performance.now patch ---
  const _originalPerfNow = performance.now.bind(performance);
  performance.now = function() {
    return virtualTimeMs;
  };

  // --- requestAnimationFrame patch ---
  let rafId = 0;
  let rafCallbacks = new Map();

  const _originalRAF = window.requestAnimationFrame;
  const _originalCancelRAF = window.cancelAnimationFrame;

  window.requestAnimationFrame = function(callback) {
    const id = ++rafId;
    rafCallbacks.set(id, callback);
    return id;
  };

  window.cancelAnimationFrame = function(id) {
    rafCallbacks.delete(id);
  };

  // --- setTimeout / setInterval patch ---
  let timerId = 0;
  let pendingTimers = [];

  const _originalSetTimeout = window.setTimeout;
  const _originalClearTimeout = window.clearTimeout;
  const _originalSetInterval = window.setInterval;
  const _originalClearInterval = window.clearInterval;

  window.setTimeout = function(callback, delay, ...args) {
    const id = ++timerId;
    delay = delay || 0;
    pendingTimers.push({
      id,
      callback,
      args,
      triggerTime: virtualTimeMs + delay,
      interval: null,
    });
    return id;
  };

  window.clearTimeout = function(id) {
    pendingTimers = pendingTimers.filter(t => t.id !== id);
  };

  window.setInterval = function(callback, delay, ...args) {
    const id = ++timerId;
    delay = Math.max(delay || 0, 1);
    pendingTimers.push({
      id,
      callback,
      args,
      triggerTime: virtualTimeMs + delay,
      interval: delay,
    });
    return id;
  };

  window.clearInterval = function(id) {
    pendingTimers = pendingTimers.filter(t => t.id !== id);
  };

  // --- Core: advance one frame ---
  function advanceFrame() {
    frameNumber++;
    virtualTimeMs = frameNumber * frameDurationMs;

    // Fire expired timers
    const toFire = [];
    const remaining = [];

    for (const timer of pendingTimers) {
      if (timer.triggerTime <= virtualTimeMs) {
        toFire.push(timer);
        // Re-queue intervals
        if (timer.interval !== null) {
          remaining.push({
            ...timer,
            triggerTime: timer.triggerTime + timer.interval,
          });
        }
      } else {
        remaining.push(timer);
      }
    }

    pendingTimers = remaining;

    for (const timer of toFire) {
      try {
        if (typeof timer.callback === 'function') {
          timer.callback(...timer.args);
        } else {
          // String callbacks (rare, but spec-compliant)
          eval(timer.callback);
        }
      } catch (e) {
        console.error('[FrameForge] Timer callback error:', e);
      }
    }

    // Flush rAF callbacks
    const callbacks = new Map(rafCallbacks);
    rafCallbacks.clear();

    for (const [id, callback] of callbacks) {
      try {
        callback(virtualTimeMs);
      } catch (e) {
        console.error('[FrameForge] rAF callback error:', e);
      }
    }

    // Advance CSS animations via Web Animations API
    if (document.getAnimations) {
      const animations = document.getAnimations();
      for (const anim of animations) {
        anim.currentTime = virtualTimeMs;
      }
    }

    return {
      frame: frameNumber,
      timeMs: virtualTimeMs,
      timeSec: virtualTimeMs / 1000,
    };
  }

  // --- Expose __frameforge global API ---
  let _frameReady = false;
  let _frameReadyResolver = null;

  window.__frameforge = {
    get currentFrame() { return frameNumber; },
    get currentTime() { return virtualTimeMs / 1000; },
    get currentTimeMs() { return virtualTimeMs; },
    get fps() { return fps; },

    // Called by renderer to advance to next frame
    advanceFrame: advanceFrame,

    // Called by page to signal async frame is ready
    ready: function() {
      _frameReady = true;
      if (_frameReadyResolver) {
        _frameReadyResolver();
        _frameReadyResolver = null;
      }
    },

    // Called by renderer to wait for page readiness
    waitForReady: function() {
      if (_frameReady) {
        _frameReady = false;
        return Promise.resolve();
      }
      return new Promise(function(resolve) {
        _frameReadyResolver = resolve;
      });
    },

    // Reset ready state for next frame
    resetReady: function() {
      _frameReady = false;
      _frameReadyResolver = null;
    },
  };

  // Expose original rAF for the renderer to yield to the browser repaint
  window.__originalRAF = _originalRAF;

  console.log('[FrameForge] Time virtualization initialized @ ' + fps + ' fps');
})();
`;
