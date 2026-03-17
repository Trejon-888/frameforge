import { describe, it, expect } from "vitest";
import {
  getStylePreset,
  createCustomStyle,
  listPresets,
  STYLE_PRESETS,
} from "./edit-styles.js";

describe("edit-styles.getStylePreset", () => {
  it("returns neo-brutalist preset", () => {
    const style = getStylePreset("neo-brutalist");
    expect(style.name).toBe("Neo-Brutalist");
    expect(style.colors.primary).toBe("#f97316");
  });

  it("returns clean-minimal preset", () => {
    const style = getStylePreset("clean-minimal");
    expect(style.name).toBe("Clean Minimal");
    expect(style.colors.primary).toBe("#3b82f6");
  });

  it("returns corporate preset", () => {
    const style = getStylePreset("corporate");
    expect(style.name).toBe("Corporate");
  });

  it("returns bold-dark preset", () => {
    const style = getStylePreset("bold-dark");
    expect(style.name).toBe("Bold Dark");
    expect(style.colors.primary).toBe("#e94560");
  });

  it("falls back to neo-brutalist for unknown presets", () => {
    const style = getStylePreset("nonexistent");
    expect(style.name).toBe("Neo-Brutalist");
  });
});

describe("edit-styles.createCustomStyle", () => {
  it("overrides brand color", () => {
    const style = createCustomStyle("neo-brutalist", {
      brandColor: "#ff0000",
    });
    expect(style.colors.primary).toBe("#ff0000");
    // Other properties should remain unchanged
    expect(style.elements.borderWidth).toBe(2);
  });

  it("overrides accent color", () => {
    const style = createCustomStyle("neo-brutalist", {
      accentColor: "#00ff00",
    });
    expect(style.colors.secondary).toBe("#00ff00");
  });

  it("overrides font family", () => {
    const style = createCustomStyle("neo-brutalist", {
      fontFamily: "Comic Sans MS",
    });
    expect(style.typography.heading).toBe("Comic Sans MS");
    expect(style.typography.body).toBe("Comic Sans MS");
    expect(style.typography.captionFont).toBe("Comic Sans MS");
  });

  it("does not mutate original preset", () => {
    const original = getStylePreset("neo-brutalist");
    createCustomStyle("neo-brutalist", { brandColor: "#ff0000" });
    expect(original.colors.primary).toBe("#f97316");
  });
});

describe("edit-styles.listPresets", () => {
  it("returns all preset names", () => {
    const names = listPresets();
    expect(names).toContain("neo-brutalist");
    expect(names).toContain("clean-minimal");
    expect(names).toContain("corporate");
    expect(names).toContain("bold-dark");
  });

  it("matches STYLE_PRESETS keys", () => {
    expect(listPresets()).toEqual(Object.keys(STYLE_PRESETS));
  });
});

describe("edit-styles preset structure", () => {
  it("all presets have required fields", () => {
    for (const [name, style] of Object.entries(STYLE_PRESETS)) {
      expect(style.name, `${name}.name`).toBeTruthy();
      expect(style.colors.primary, `${name}.colors.primary`).toBeTruthy();
      expect(style.colors.text, `${name}.colors.text`).toBeTruthy();
      expect(style.typography.heading, `${name}.typography.heading`).toBeTruthy();
      expect(style.typography.googleFontsUrl, `${name}.typography.googleFontsUrl`).toContain("fonts.googleapis.com");
      expect(style.animations.defaultDuration, `${name}.animations.defaultDuration`).toBeGreaterThan(0);
    }
  });
});
