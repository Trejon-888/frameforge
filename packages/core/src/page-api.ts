/**
 * Page API Script
 *
 * Lightweight script injected after time virtualization.
 * Provides the public-facing __frameforge API that animation
 * authors can optionally use to coordinate with the renderer.
 *
 * The time-virtualization script creates __frameforge.
 * This script extends it with metadata set by the renderer.
 */
export const PAGE_API_SCRIPT = `
(function() {
  'use strict';

  // These are set by the renderer before the page loads
  const totalFrames = window.__FRAMEFORGE_TOTAL_FRAMES__ || 0;
  const duration = window.__FRAMEFORGE_DURATION__ || 0;
  const width = window.__FRAMEFORGE_WIDTH__ || 1920;
  const height = window.__FRAMEFORGE_HEIGHT__ || 1080;

  if (!window.__frameforge) {
    console.error('[FrameForge] Time virtualization must load before page-api');
    return;
  }

  Object.defineProperties(window.__frameforge, {
    totalFrames: { value: totalFrames, writable: false },
    duration: { value: duration, writable: false },
    width: { value: width, writable: false },
    height: { value: height, writable: false },
  });

  // Convenience: progress from 0 to 1
  Object.defineProperty(window.__frameforge, 'progress', {
    get: function() {
      return totalFrames > 0 ? window.__frameforge.currentFrame / totalFrames : 0;
    }
  });

  console.log('[FrameForge] Page API ready — ' + totalFrames + ' frames, ' + duration + 's');
})();
`;
