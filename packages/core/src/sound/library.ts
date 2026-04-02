import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Sound categories for the kino sound design system.
 */
export type SoundCategory = "hits" | "transitions" | "accents" | "ambient";

/**
 * Metadata for a single sound in the library.
 */
export interface SoundEntry {
  /** Display name */
  name: string;
  /** Category for organization */
  category: SoundCategory;
  /** Relative path from assets/sounds/ directory */
  file: string;
  /** Human-readable description */
  description: string;
}

/**
 * Sound library registry.
 *
 * Maps sound names to their metadata and file paths.
 * Actual WAV files will be added to packages/core/assets/sounds/ later.
 * The registry defines the contract so the mixer and scene format can
 * reference sounds by name immediately.
 */
export const SOUND_LIBRARY: Record<string, SoundEntry> = {
  // --- Hits ---
  kick: {
    name: "kick",
    category: "hits",
    file: "hits/kick.wav",
    description: "Punchy kick drum hit for hard cuts and impacts",
  },
  snap: {
    name: "snap",
    category: "hits",
    file: "hits/snap.wav",
    description: "Crisp finger snap for precise timing accents",
  },
  click: {
    name: "click",
    category: "hits",
    file: "hits/click.wav",
    description: "Subtle click for UI interactions and micro-transitions",
  },
  thud: {
    name: "thud",
    category: "hits",
    file: "hits/thud.wav",
    description: "Deep thud for heavy impacts and scene drops",
  },
  glass: {
    name: "glass",
    category: "hits",
    file: "hits/glass.wav",
    description: "Glass impact for shatter effects and breakpoints",
  },

  // --- Transitions ---
  "whoosh-in": {
    name: "whoosh-in",
    category: "transitions",
    file: "transitions/whoosh-in.wav",
    description: "Fast whoosh for elements entering the frame",
  },
  "whoosh-out": {
    name: "whoosh-out",
    category: "transitions",
    file: "transitions/whoosh-out.wav",
    description: "Fast whoosh for elements leaving the frame",
  },
  "sweep-up": {
    name: "sweep-up",
    category: "transitions",
    file: "transitions/sweep-up.wav",
    description: "Rising frequency sweep for building tension",
  },
  "sweep-down": {
    name: "sweep-down",
    category: "transitions",
    file: "transitions/sweep-down.wav",
    description: "Falling frequency sweep for resolution and drops",
  },

  // --- Accents ---
  pop: {
    name: "pop",
    category: "accents",
    file: "accents/pop.wav",
    description: "Playful pop for element appearances",
  },
  ding: {
    name: "ding",
    category: "accents",
    file: "accents/ding.wav",
    description: "Bell ding for notifications and highlights",
  },
  chime: {
    name: "chime",
    category: "accents",
    file: "accents/chime.wav",
    description: "Gentle chime for ambient accents",
  },
  sparkle: {
    name: "sparkle",
    category: "accents",
    file: "accents/sparkle.wav",
    description: "Shimmering sparkle for magical reveal moments",
  },

  // --- Ambient ---
  "low-hum": {
    name: "low-hum",
    category: "ambient",
    file: "ambient/low-hum.wav",
    description: "Deep low-frequency hum for tension and atmosphere",
  },
  "digital-texture": {
    name: "digital-texture",
    category: "ambient",
    file: "ambient/digital-texture.wav",
    description: "Digital noise texture for tech/cyber aesthetics",
  },
  breath: {
    name: "breath",
    category: "ambient",
    file: "ambient/breath.wav",
    description: "Soft breath-like pad for organic transitions",
  },
};

/**
 * Base directory for sound assets.
 * Points to packages/core/assets/sounds/ relative to this file.
 */
function getAssetsDir(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return resolve(thisDir, "..", "..", "assets", "sounds");
}

/**
 * Resolve a sound name to its absolute file path.
 *
 * @param name - Sound name from the library (e.g., "kick", "whoosh-in")
 * @returns Absolute path to the WAV file, or null if the sound name is unknown
 */
export function resolveSoundPath(name: string): string | null {
  const entry = SOUND_LIBRARY[name];
  if (!entry) return null;
  return resolve(getAssetsDir(), entry.file);
}

/**
 * List all available sounds, optionally filtered by category.
 *
 * @param category - Optional category filter
 * @returns Array of sound entries
 */
export function listSounds(category?: SoundCategory): SoundEntry[] {
  const entries = Object.values(SOUND_LIBRARY);
  if (!category) return entries;
  return entries.filter((e) => e.category === category);
}

/**
 * Check whether a sound name exists in the library.
 *
 * @param name - Sound name to check
 * @returns true if the sound is registered
 */
export function hasSound(name: string): boolean {
  return name in SOUND_LIBRARY;
}
