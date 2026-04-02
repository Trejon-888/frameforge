/**
 * Scene Composition Format
 *
 * The JSON contract between AI agents and kino's renderer.
 * Agents generate this format → kino compiles it to Canvas 2D / DOM / FFmpeg.
 *
 * A scene is a tree of animated elements with timing and sound cues.
 * Elements can be ANYTHING — the system is open, not constrained to
 * a fixed set of component types.
 */

import type { AnimatedElement, PropertyTimeline, Keyframe } from "./engine.js";

// ═══════════════════════════════════════════════════════════════════════════
//  Scene format types
// ═══════════════════════════════════════════════════════════════════════════

export interface SceneComposition {
  version: "2.0";
  canvas: {
    width: number;
    height: number;
    fps: number;
    duration: number;
  };
  /** Ordered scenes on the timeline */
  scenes: Scene[];
  /** Caption configuration (rendered via ASS for speed) */
  captions?: CaptionConfig;
  /** Global style preset name */
  style?: string;
}

export interface Scene {
  /** Unique scene ID */
  id: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Background color (default: transparent for overlay mode) */
  background?: string;
  /**
   * Rendering mode:
   * - "overlay": composited on top of source video
   * - "full-frame": replaces the video entirely
   * - "split": half screen video, half screen graphics
   */
  mode: "overlay" | "full-frame" | "split";
  /** Elements in this scene (rendered in order, first = bottom) */
  elements: AnimatedElement[];
  /** Sound cues triggered during this scene */
  sound?: SoundCue[];
}

export interface SoundCue {
  /** Sound name from the library (e.g., "whoosh-in", "kick", "pop") */
  type: string;
  /** Time in seconds (relative to scene start) */
  time: number;
  /** Volume 0-1 (default: 0.7) */
  volume?: number;
}

export interface CaptionConfig {
  /** Style preset name (maps to EditStyle) */
  style: string;
  /** Caption position */
  position?: "bottom" | "center" | "top";
  /** Path to word timings JSON */
  wordTimingsPath?: string;
  /** Inline word timings */
  wordTimings?: Array<{ word: string; start: number; end: number }>;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Scene validation
// ═══════════════════════════════════════════════════════════════════════════

export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Validate a scene composition JSON.
 * Returns an array of errors (empty = valid).
 */
export function validateComposition(comp: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!comp) {
    errors.push({ path: "", message: "Composition is null/undefined" });
    return errors;
  }

  if (comp.version !== "2.0") {
    errors.push({ path: "version", message: `Expected "2.0", got "${comp.version}"` });
  }

  if (!comp.canvas) {
    errors.push({ path: "canvas", message: "Missing canvas configuration" });
  } else {
    if (!comp.canvas.width || comp.canvas.width <= 0) errors.push({ path: "canvas.width", message: "Invalid width" });
    if (!comp.canvas.height || comp.canvas.height <= 0) errors.push({ path: "canvas.height", message: "Invalid height" });
    if (!comp.canvas.fps || comp.canvas.fps <= 0) errors.push({ path: "canvas.fps", message: "Invalid fps" });
    if (!comp.canvas.duration || comp.canvas.duration <= 0) errors.push({ path: "canvas.duration", message: "Invalid duration" });
  }

  if (!Array.isArray(comp.scenes)) {
    errors.push({ path: "scenes", message: "Missing or invalid scenes array" });
  } else {
    for (let i = 0; i < comp.scenes.length; i++) {
      const scene = comp.scenes[i];
      const prefix = `scenes[${i}]`;

      if (!scene.id) errors.push({ path: `${prefix}.id`, message: "Missing scene ID" });
      if (typeof scene.start !== "number") errors.push({ path: `${prefix}.start`, message: "Invalid start time" });
      if (typeof scene.end !== "number") errors.push({ path: `${prefix}.end`, message: "Invalid end time" });
      if (scene.start >= scene.end) errors.push({ path: `${prefix}`, message: "start must be < end" });
      if (!["overlay", "full-frame", "split"].includes(scene.mode)) {
        errors.push({ path: `${prefix}.mode`, message: `Invalid mode "${scene.mode}"` });
      }
      if (!Array.isArray(scene.elements)) {
        errors.push({ path: `${prefix}.elements`, message: "Missing elements array" });
      }
    }
  }

  return errors;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Scene query helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all scenes active at a given time.
 */
export function getActiveScenesAtTime(comp: SceneComposition, time: number): Scene[] {
  return comp.scenes.filter((s) => time >= s.start && time < s.end);
}

/**
 * Get all sound cues across all scenes, with absolute timestamps.
 */
export function getAllSoundCues(comp: SceneComposition): Array<SoundCue & { absoluteTime: number }> {
  const cues: Array<SoundCue & { absoluteTime: number }> = [];
  for (const scene of comp.scenes) {
    if (scene.sound) {
      for (const cue of scene.sound) {
        cues.push({ ...cue, absoluteTime: scene.start + cue.time });
      }
    }
  }
  return cues.sort((a, b) => a.absoluteTime - b.absoluteTime);
}

/**
 * Flatten all elements from all scenes active at a given time.
 * Returns elements in render order (first scene's elements first).
 */
export function getElementsAtTime(comp: SceneComposition, time: number): AnimatedElement[] {
  const active = getActiveScenesAtTime(comp, time);
  const elements: AnimatedElement[] = [];
  for (const scene of active) {
    elements.push(...scene.elements);
  }
  return elements;
}
