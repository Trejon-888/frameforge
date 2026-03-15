/**
 * Animation Primitives
 *
 * Convenience functions that generate keyframe animations.
 * These are syntactic sugar over the low-level .animate() API.
 *
 * Usage:
 *   import { fadeIn, slideIn } from "@frameforge/sdk";
 *   const title = new Text("Hello").apply(fadeIn(0, 1)).apply(slideIn("up", 0, 1));
 *
 *   // Or use the chainable methods directly:
 *   title.fadeIn(0, 1).slideIn("up", 0, 1);
 */

export type Direction = "up" | "down" | "left" | "right";

export interface AnimationTiming {
  start: number;
  end: number;
}

export interface AnimationPreset {
  property: string;
  keyframes: Record<number, number | string>;
}

// --- Fade ---

export function fadeIn(start: number, end: number): AnimationPreset {
  return { property: "opacity", keyframes: { [start]: 0, [end]: 1 } };
}

export function fadeOut(start: number, end: number): AnimationPreset {
  return { property: "opacity", keyframes: { [start]: 1, [end]: 0 } };
}

// --- Slide ---

export function slideIn(
  direction: Direction,
  start: number,
  end: number,
  distance: number = 60
): AnimationPreset[] {
  const presets: AnimationPreset[] = [];

  switch (direction) {
    case "up":
      presets.push({
        property: "y",
        keyframes: { [start]: distance, [end]: 0 },
      });
      break;
    case "down":
      presets.push({
        property: "y",
        keyframes: { [start]: -distance, [end]: 0 },
      });
      break;
    case "left":
      presets.push({
        property: "x",
        keyframes: { [start]: distance, [end]: 0 },
      });
      break;
    case "right":
      presets.push({
        property: "x",
        keyframes: { [start]: -distance, [end]: 0 },
      });
      break;
  }

  return presets;
}

export function slideOut(
  direction: Direction,
  start: number,
  end: number,
  distance: number = 60
): AnimationPreset[] {
  const presets: AnimationPreset[] = [];

  switch (direction) {
    case "up":
      presets.push({
        property: "y",
        keyframes: { [start]: 0, [end]: -distance },
      });
      break;
    case "down":
      presets.push({
        property: "y",
        keyframes: { [start]: 0, [end]: distance },
      });
      break;
    case "left":
      presets.push({
        property: "x",
        keyframes: { [start]: 0, [end]: -distance },
      });
      break;
    case "right":
      presets.push({
        property: "x",
        keyframes: { [start]: 0, [end]: distance },
      });
      break;
  }

  return presets;
}

// --- Scale ---

export function scaleIn(start: number, end: number): AnimationPreset {
  return { property: "scale", keyframes: { [start]: 0, [end]: 1 } };
}

export function scaleOut(start: number, end: number): AnimationPreset {
  return { property: "scale", keyframes: { [start]: 1, [end]: 0 } };
}

// --- Rotate ---

export function rotateIn(
  start: number,
  end: number,
  degrees: number = 360
): AnimationPreset {
  return {
    property: "rotation",
    keyframes: { [start]: -degrees, [end]: 0 },
  };
}

export function rotateTo(
  start: number,
  end: number,
  degrees: number = 360
): AnimationPreset {
  return {
    property: "rotation",
    keyframes: { [start]: 0, [end]: degrees },
  };
}

// --- Stagger utility ---

/**
 * Apply the same animation presets to multiple elements with staggered timing.
 *
 * @param elements - Array of elements to animate
 * @param presetFn - Function that takes (start, end) and returns presets
 * @param baseStart - Start time of the first element
 * @param duration - Duration of each element's animation
 * @param staggerOffset - Time offset between each element
 */
export function stagger<T extends { animate(property: string, keyframes: Record<number, number | string>): T }>(
  elements: T[],
  presetFn: (start: number, end: number) => AnimationPreset | AnimationPreset[],
  baseStart: number,
  duration: number,
  staggerOffset: number
): void {
  elements.forEach((el, i) => {
    const start = baseStart + i * staggerOffset;
    const end = start + duration;
    const presets = presetFn(start, end);
    const arr = Array.isArray(presets) ? presets : [presets];
    for (const preset of arr) {
      el.animate(preset.property, preset.keyframes);
    }
  });
}
