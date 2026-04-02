/**
 * Easing Function Library
 *
 * Every easing function takes a progress value 0→1 and returns
 * an eased value (usually 0→1, but can overshoot for back/elastic).
 *
 * Supports:
 * - Named presets (linear, ease-in, ease-out, ease-in-out)
 * - Power curves (power2.in, power3.out, power4.inOut)
 * - Back (overshoot)
 * - Elastic (bounce)
 * - Cubic bezier (cubic-bezier(x1,y1,x2,y2))
 * - Step functions (step(n))
 */

export type EasingFn = (t: number) => number;

// ═══════════════════════════════════════════════════════════════════════════
//  Core easing functions
// ═══════════════════════════════════════════════════════════════════════════

const linear: EasingFn = (t) => t;

// Power curves
function powerIn(p: number): EasingFn {
  return (t) => Math.pow(t, p);
}
function powerOut(p: number): EasingFn {
  return (t) => 1 - Math.pow(1 - t, p);
}
function powerInOut(p: number): EasingFn {
  return (t) =>
    t < 0.5
      ? Math.pow(2 * t, p) / 2
      : 1 - Math.pow(2 * (1 - t), p) / 2;
}

// Back (overshoot)
function backIn(overshoot: number = 1.70158): EasingFn {
  return (t) => t * t * ((overshoot + 1) * t - overshoot);
}
function backOut(overshoot: number = 1.70158): EasingFn {
  return (t) => {
    const s = t - 1;
    return s * s * ((overshoot + 1) * s + overshoot) + 1;
  };
}
function backInOut(overshoot: number = 1.70158): EasingFn {
  const s = overshoot * 1.525;
  return (t) => {
    const p = t * 2;
    if (p < 1) return 0.5 * (p * p * ((s + 1) * p - s));
    const q = p - 2;
    return 0.5 * (q * q * ((s + 1) * q + s) + 2);
  };
}

// Elastic
function elasticOut(amplitude: number = 1, period: number = 0.3): EasingFn {
  return (t) => {
    if (t === 0 || t === 1) return t;
    const s = (period / (2 * Math.PI)) * Math.asin(1 / amplitude);
    return amplitude * Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / period) + 1;
  };
}

// Step function
function step(steps: number): EasingFn {
  return (t) => Math.floor(t * steps) / steps;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Cubic Bezier
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Attempt to use a fast analytic cubic bezier solver.
 * Falls back to binary search for edge cases.
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFn {
  // Pre-compute coefficients for the x(t) curve
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  function sampleX(t: number): number {
    return ((ax * t + bx) * t + cx) * t;
  }

  function sampleY(t: number): number {
    return ((ay * t + by) * t + cy) * t;
  }

  function sampleDerivX(t: number): number {
    return (3 * ax * t + 2 * bx) * t + cx;
  }

  // Newton-Raphson to solve for t given x
  function solveForT(x: number): number {
    // Initial guess
    let t = x;

    // Newton-Raphson (fast convergence for most curves)
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-7) return t;
      const d = sampleDerivX(t);
      if (Math.abs(d) < 1e-7) break;
      t -= err / d;
    }

    // Fallback: binary search
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 20; i++) {
      const v = sampleX(t);
      if (Math.abs(v - x) < 1e-7) return t;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  }

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return sampleY(solveForT(x));
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  Preset registry
// ═══════════════════════════════════════════════════════════════════════════

const PRESETS: Record<string, EasingFn> = {
  "linear": linear,

  // CSS standard
  "ease": cubicBezier(0.25, 0.1, 0.25, 1),
  "ease-in": cubicBezier(0.42, 0, 1, 1),
  "ease-out": cubicBezier(0, 0, 0.58, 1),
  "ease-in-out": cubicBezier(0.42, 0, 0.58, 1),

  // Power 2
  "power2.in": powerIn(2),
  "power2.out": powerOut(2),
  "power2.inOut": powerInOut(2),

  // Power 3
  "power3.in": powerIn(3),
  "power3.out": powerOut(3),
  "power3.inOut": powerInOut(3),

  // Power 4
  "power4.in": powerIn(4),
  "power4.out": powerOut(4),
  "power4.inOut": powerInOut(4),

  // Back
  "back.in": backIn(),
  "back.out": backOut(),
  "back.inOut": backInOut(),

  // Elastic
  "elastic.out": elasticOut(),

  // Expo
  "expo.in": (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  "expo.out": (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  "expo.inOut": (t) => {
    if (t === 0 || t === 1) return t;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // Sine
  "sine.in": (t) => 1 - Math.cos((t * Math.PI) / 2),
  "sine.out": (t) => Math.sin((t * Math.PI) / 2),
  "sine.inOut": (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Circ
  "circ.in": (t) => 1 - Math.sqrt(1 - t * t),
  "circ.out": (t) => Math.sqrt(1 - (t - 1) * (t - 1)),
  "circ.inOut": (t) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
};

// ═══════════════════════════════════════════════════════════════════════════
//  Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create an easing function from a spec string.
 *
 * Accepts:
 * - Named presets: "linear", "ease-out", "power3.inOut", "back.out", "elastic.out"
 * - Cubic bezier: "cubic-bezier(0.16, 1, 0.3, 1)"
 * - Step function: "step(5)"
 */
export function createEasing(spec: string): EasingFn {
  if (!spec || spec === "linear") return linear;

  // Check presets
  const preset = PRESETS[spec];
  if (preset) return preset;

  // Parse cubic-bezier(x1, y1, x2, y2)
  const bezierMatch = spec.match(
    /^cubic-bezier\(\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*,\s*([\d.+-]+)\s*\)$/
  );
  if (bezierMatch) {
    return cubicBezier(
      parseFloat(bezierMatch[1]),
      parseFloat(bezierMatch[2]),
      parseFloat(bezierMatch[3]),
      parseFloat(bezierMatch[4])
    );
  }

  // Parse step(n)
  const stepMatch = spec.match(/^step\((\d+)\)$/);
  if (stepMatch) {
    return step(parseInt(stepMatch[1], 10));
  }

  // Unknown — fall back to linear
  return linear;
}

/**
 * List all available named easing presets.
 */
export function listEasings(): string[] {
  return Object.keys(PRESETS);
}
