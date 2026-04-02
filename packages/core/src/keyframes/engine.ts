/**
 * Keyframe Animation Engine
 *
 * The foundation of kino's motion graphics system. Any numeric property
 * can be animated between values with custom easing curves.
 *
 * This is the same math that After Effects, Premiere Pro, and every
 * professional motion graphics tool uses: bezier interpolation between
 * keyframes on a timeline.
 *
 * The engine is renderer-agnostic — it outputs resolved values that
 * Canvas 2D, DOM/CSS, SVG, FFmpeg expressions, or any other renderer
 * can consume.
 */

import { createEasing, type EasingFn } from "./easing.js";

// ═══════════════════════════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════════════════════════

export interface Keyframe {
  /** Time in seconds */
  time: number;
  /** Target value at this time */
  value: number;
  /** Easing curve to this keyframe (default: "linear") */
  easing?: string;
}

export interface PropertyTimeline {
  /** Property name (e.g., "x", "y", "scale", "opacity", "rotation") */
  property: string;
  /** Ordered keyframes */
  keyframes: Keyframe[];
}

export interface AnimatedElement {
  /** Unique element ID */
  id: string;
  /** Element type (open string — not a fixed enum) */
  type: string;
  /** Static properties (non-animated) */
  props: Record<string, any>;
  /** Animated property timelines */
  animations: PropertyTimeline[];
  /** Child elements (for groups) */
  children?: AnimatedElement[];
}

export interface ResolvedProps {
  [key: string]: number;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Core interpolation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Interpolate a single property timeline at a given time.
 *
 * Rules:
 * - Before first keyframe: returns first keyframe value (hold)
 * - After last keyframe: returns last keyframe value (hold)
 * - Between keyframes: interpolates with the target keyframe's easing
 * - Single keyframe: returns that value always
 */
export function interpolateProperty(timeline: PropertyTimeline, time: number): number {
  const kfs = timeline.keyframes;
  if (kfs.length === 0) return 0;
  if (kfs.length === 1) return kfs[0].value;

  // Before first keyframe — hold
  if (time <= kfs[0].time) return kfs[0].value;

  // After last keyframe — hold
  if (time >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1].value;

  // Find surrounding keyframes
  for (let i = 1; i < kfs.length; i++) {
    if (time <= kfs[i].time) {
      const prev = kfs[i - 1];
      const next = kfs[i];
      const duration = next.time - prev.time;
      if (duration <= 0) return next.value;

      // Linear progress 0→1 between the two keyframes
      const t = (time - prev.time) / duration;

      // Apply easing (defined on the target keyframe)
      const easingFn = createEasing(next.easing || "linear");
      const eased = easingFn(t);

      // Interpolate
      return prev.value + (next.value - prev.value) * eased;
    }
  }

  return kfs[kfs.length - 1].value;
}

/**
 * Resolve all animated properties of an element at a given time.
 * Returns a flat object of property name → interpolated value.
 */
export function resolveAtTime(element: AnimatedElement, time: number): ResolvedProps {
  const result: ResolvedProps = {};

  for (const timeline of element.animations) {
    result[timeline.property] = interpolateProperty(timeline, time);
  }

  return result;
}

/**
 * Resolve an entire element tree (element + children) at a given time.
 * Returns a map of element ID → resolved properties.
 */
export function resolveTree(
  element: AnimatedElement,
  time: number
): Map<string, ResolvedProps> {
  const result = new Map<string, ResolvedProps>();

  result.set(element.id, resolveAtTime(element, time));

  if (element.children) {
    for (const child of element.children) {
      const childResults = resolveTree(child, time);
      for (const [id, props] of childResults) {
        result.set(id, props);
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Builder API (fluent, agent-friendly)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fluent builder for constructing animated elements.
 *
 * Usage:
 *   const circle = element("circle", "hero-circle")
 *     .prop("cx", 540).prop("cy", 960).prop("r", 100)
 *     .animate("opacity", [
 *       { time: 0, value: 0 },
 *       { time: 0.5, value: 1, easing: "ease-out" },
 *     ])
 *     .animate("r", [
 *       { time: 0, value: 0 },
 *       { time: 0.8, value: 200, easing: "cubic-bezier(0.16,1,0.3,1)" },
 *     ])
 *     .build();
 */
export function element(type: string, id: string): ElementBuilder {
  return new ElementBuilder(type, id);
}

export class ElementBuilder {
  private _type: string;
  private _id: string;
  private _props: Record<string, any> = {};
  private _animations: PropertyTimeline[] = [];
  private _children: AnimatedElement[] = [];

  constructor(type: string, id: string) {
    this._type = type;
    this._id = id;
  }

  /** Set a static property */
  prop(name: string, value: any): this {
    this._props[name] = value;
    return this;
  }

  /** Set multiple static properties */
  props(obj: Record<string, any>): this {
    Object.assign(this._props, obj);
    return this;
  }

  /** Add a keyframed animation for a property */
  animate(property: string, keyframes: Keyframe[]): this {
    // Sort keyframes by time
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    this._animations.push({ property, keyframes: sorted });
    return this;
  }

  /** Add a child element */
  child(child: AnimatedElement): this {
    this._children.push(child);
    return this;
  }

  /** Build the AnimatedElement */
  build(): AnimatedElement {
    return {
      id: this._id,
      type: this._type,
      props: { ...this._props },
      animations: [...this._animations],
      children: this._children.length > 0 ? [...this._children] : undefined,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Stagger helper
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create staggered keyframes for multiple elements.
 * Common in motion graphics: N items animate in sequence with a time offset.
 *
 * Usage:
 *   const items = stagger(5, 0.1, (i, delay) => ({
 *     time: delay,
 *     value: 1,
 *     easing: "ease-out",
 *   }));
 */
export function stagger<T>(
  count: number,
  interval: number,
  fn: (index: number, delay: number) => T
): T[] {
  return Array.from({ length: count }, (_, i) => fn(i, i * interval));
}
