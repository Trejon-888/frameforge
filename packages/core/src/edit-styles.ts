/**
 * Edit Style Preset System
 *
 * Defines reusable visual styles for video editing overlays.
 * Each preset specifies colors, typography, element styling,
 * and animation parameters applied consistently across all overlays.
 */

export interface EditStyleColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  textAlt: string;
  /** Card / panel surface background */
  surface: string;
  /** Border / divider color */
  border: string;
  /** Labels, metadata, very muted text */
  muted: string;
}

export interface EditStyleTypography {
  heading: string;
  body: string;
  captionFont: string;
  googleFontsUrl: string;
}

export interface EditStyleElements {
  borderWidth: number;
  borderRadius: number;
  shadowStyle: string;
  cornerStyle: "rounded" | "sharp" | "pill";
}

export interface EditStyleAnimations {
  enterCurve: string;
  exitCurve: string;
  defaultDuration: number;
}

export interface EditStyle {
  name: string;
  /** "dark" or "light" — drives cinema renderer token selection */
  theme: "dark" | "light";
  colors: EditStyleColors;
  typography: EditStyleTypography;
  elements: EditStyleElements;
  animations: EditStyleAnimations;
}

export const STYLE_PRESETS: Record<string, EditStyle> = {
  "neo-brutalist": {
    name: "Neo-Brutalist",
    theme: "dark",
    colors: {
      primary: "#f97316",
      secondary: "#171e19",
      background: "#171e19",
      text: "#ffffff",
      textAlt: "#b7c6c2",
      surface: "rgba(255,255,255,0.05)",
      border: "rgba(255,255,255,0.12)",
      muted: "rgba(255,255,255,0.35)",
    },
    typography: {
      heading: "'Cabinet Grotesk', 'Inter', system-ui",
      body: "'Satoshi', 'Inter', system-ui",
      captionFont: "'Inter', system-ui",
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap",
    },
    elements: {
      borderWidth: 2,
      borderRadius: 12,
      shadowStyle: "6px 6px 0 #000",
      cornerStyle: "sharp",
    },
    animations: {
      enterCurve: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      exitCurve: "ease-in",
      defaultDuration: 0.4,
    },
  },

  "clean-minimal": {
    name: "Clean Minimal",
    theme: "light",
    colors: {
      primary: "#3b82f6",
      secondary: "#f1f5f9",
      background: "#ffffff",
      text: "#1e293b",
      textAlt: "#64748b",
      surface: "#f8fafc",
      border: "#e2e8f0",
      muted: "#94a3b8",
    },
    typography: {
      heading: "'Inter', system-ui",
      body: "'Inter', system-ui",
      captionFont: "'Inter', system-ui",
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    },
    elements: {
      borderWidth: 0,
      borderRadius: 16,
      shadowStyle: "0 4px 24px rgba(0,0,0,0.08)",
      cornerStyle: "rounded",
    },
    animations: {
      enterCurve: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      exitCurve: "ease-in",
      defaultDuration: 0.3,
    },
  },

  corporate: {
    name: "Corporate",
    theme: "light",
    colors: {
      primary: "#0f172a",
      secondary: "#2563eb",
      background: "#ffffff",
      text: "#0f172a",
      textAlt: "#475569",
      surface: "#f8fafc",
      border: "#e2e8f0",
      muted: "#94a3b8",
    },
    typography: {
      heading: "'Plus Jakarta Sans', 'Inter', system-ui",
      body: "'Inter', system-ui",
      captionFont: "'Inter', system-ui",
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
    },
    elements: {
      borderWidth: 1,
      borderRadius: 8,
      shadowStyle: "0 2px 8px rgba(0,0,0,0.06)",
      cornerStyle: "rounded",
    },
    animations: {
      enterCurve: "ease-out",
      exitCurve: "ease-in",
      defaultDuration: 0.25,
    },
  },

  "bold-dark": {
    name: "Bold Dark",
    theme: "dark",
    colors: {
      primary: "#e94560",
      secondary: "#6366f1",
      background: "#0a0a0a",
      text: "#ffffff",
      textAlt: "#a1a1aa",
      surface: "rgba(255,255,255,0.05)",
      border: "rgba(255,255,255,0.12)",
      muted: "rgba(255,255,255,0.35)",
    },
    typography: {
      heading: "'Space Grotesk', 'Inter', system-ui",
      body: "'Inter', system-ui",
      captionFont: "'Space Grotesk', 'Inter', system-ui",
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap",
    },
    elements: {
      borderWidth: 0,
      borderRadius: 20,
      shadowStyle: "0 0 40px rgba(233,69,96,0.15)",
      cornerStyle: "pill",
    },
    animations: {
      enterCurve: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      exitCurve: "ease-in",
      defaultDuration: 0.35,
    },
  },

  /**
   * Poster Modernist — Reality-First design system.
   * Cream background, cobalt blue accent, jet black type.
   * Zero border-radius, no shadows, no gradients.
   * Fast linear transitions (0.3s). Strict grid. Authority through restraint.
   */
  "poster-modernist": {
    name: "Poster Modernist",
    theme: "light",
    colors: {
      primary: "#1351AA",      // Cobalt Blue
      secondary: "#141414",    // Jet Black (used as strong contrast accent)
      background: "#E3E2DE",   // Cream
      text: "#141414",         // Jet Black
      textAlt: "#444343",      // Deep Gray
      surface: "#F5F5F2",      // Off-white card surface
      border: "#C7C7C7",       // Light Gray dividers
      muted: "#7A7A7A",        // Gray for labels / metadata
    },
    typography: {
      heading: "'Inter', 'DM Sans', system-ui",
      body: "'Inter', system-ui",
      captionFont: "'Inter', system-ui",
      // Inter at 900 weight with tight tracking approximates General Sans / Aileron
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap",
    },
    elements: {
      borderWidth: 1,
      borderRadius: 0,         // Zero radius — defining characteristic
      shadowStyle: "none",     // No shadows — flat color blocks only
      cornerStyle: "sharp",
    },
    animations: {
      enterCurve: "power2.out", // No bounce — editorial gravity
      exitCurve: "linear",
      defaultDuration: 0.3,
    },
  },
};

/**
 * Get a style preset by name. Falls back to neo-brutalist if not found.
 */
export function getStylePreset(name: string): EditStyle {
  return STYLE_PRESETS[name] || STYLE_PRESETS["neo-brutalist"];
}

/**
 * Create a custom style by merging overrides onto a base preset.
 */
export function createCustomStyle(
  baseName: string,
  overrides: {
    brandColor?: string;
    accentColor?: string;
    fontFamily?: string;
  }
): EditStyle {
  const base = getStylePreset(baseName);
  const style = JSON.parse(JSON.stringify(base)) as EditStyle;

  if (overrides.brandColor) {
    style.colors.primary = overrides.brandColor;
  }
  if (overrides.accentColor) {
    style.colors.secondary = overrides.accentColor;
  }
  if (overrides.fontFamily) {
    style.typography.heading = overrides.fontFamily;
    style.typography.body = overrides.fontFamily;
    style.typography.captionFont = overrides.fontFamily;
  }

  return style;
}

/**
 * List all available preset names.
 */
export function listPresets(): string[] {
  return Object.keys(STYLE_PRESETS);
}
