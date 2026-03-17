/**
 * Particle Burst — Canvas 2D particle explosion at transitions
 *
 * Replaces: (new component)
 * Technology: Canvas 2D
 * Visual: 200+ particles explode outward from center at topic transitions.
 *         Seeded PRNG for deterministic rendering across frames.
 */

import {
  type ComponentRenderer,
  type ComponentTiming,
  type ComponentContext,
  type ComponentOutput,
} from "../types.js";

export const particleBurstRenderer: ComponentRenderer = {
  type: "particle-burst",
  dependencies: [],

  render(
    data: Record<string, any>,
    timing: ComponentTiming,
    ctx: ComponentContext
  ): ComponentOutput {
    const { style, width, height, instanceId } = ctx;
    const { colors } = style;

    const css = `
      .ff-pb-canvas {
        position: fixed; top: 0; left: 0;
        z-index: 9995; pointer-events: none;
      }`;

    const html = `<canvas class="ff-pb-canvas" id="${instanceId}-canvas" width="${width}" height="${height}" style="width:${width}px;height:${height}px;"></canvas>`;

    // Seeded PRNG (LCG) for deterministic particles
    // Generate particle initial conditions at init time
    const seed = timing.startMs || 12345;

    const initJs = `
    var canvas = document.getElementById('${instanceId}-canvas');
    var pctx = canvas.getContext('2d');

    // Seeded PRNG — Linear Congruential Generator
    var seed = ${seed};
    function rng() {
      seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF;
      return (seed >>> 0) / 0xFFFFFFFF;
    }

    // Generate 200 particles with deterministic initial conditions
    var particles = [];
    var cx = ${Math.round(width / 2)};
    var cy = ${Math.round(height / 2)};
    var primary = '${colors.primary}';
    var textCol = '${colors.text}';

    for (var i = 0; i < 200; i++) {
      var angle = rng() * Math.PI * 2;
      var speed = 200 + rng() * 600;
      particles.push({
        x0: cx, y0: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 200,
        size: 3 + rng() * 8,
        color: rng() > 0.5 ? primary : textCol,
        life: 0.5 + rng() * 1.0,
        shape: rng() > 0.7 ? 1 : 0
      });
    }
    el._particles = particles;
    el._pctx = pctx;
    el._cw = ${width};
    el._ch = ${height};`;

    // Deterministic physics: position computed from initial conditions + elapsed time
    const updateJs = `
      var particles = el._particles;
      var pctx = el._pctx;
      var elapsed = localT / 1000;
      pctx.clearRect(0, 0, el._cw, el._ch);

      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        if (elapsed > p.life) continue;
        var alpha = 1 - (elapsed / p.life);
        alpha = alpha * alpha;
        var x = p.x0 + p.vx * elapsed;
        var y = p.y0 + p.vy * elapsed + 400 * elapsed * elapsed;
        var size = p.size * (1 - elapsed / p.life * 0.5);

        pctx.globalAlpha = alpha;
        pctx.fillStyle = p.color;

        if (p.shape === 1) {
          pctx.fillRect(x - size/2, y - size/2, size, size);
        } else {
          pctx.beginPath();
          pctx.arc(x, y, size / 2, 0, Math.PI * 2);
          pctx.fill();
        }
      }
      pctx.globalAlpha = 1;`;

    return { css, html, initJs, updateJs };
  },
};
