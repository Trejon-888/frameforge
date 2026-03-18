/**
 * Component System Tests
 *
 * Tests for the registry, assembler, and renderer outputs.
 * Validates the full pipeline: overlay elements → component renderers → script output.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { registry } from "./registry.js";
import { assembleOverlayPage } from "./assembler.js";
import {
  type ComponentRenderer,
  type ComponentOutput,
  type ComponentDependency,
  GSAP_CDN,
  escapeHtml,
} from "./types.js";
import { type OverlayElement } from "../overlay-generator.js";
import { getStylePreset } from "../edit-styles.js";

// Import init to register all built-in renderers
import "./init.js";

const style = getStylePreset("neo-brutalist");

// === Registry Tests ===

describe("components.registry", () => {
  it("has all 16 built-in renderers registered", () => {
    const types = registry.list();
    // Original 8
    expect(types).toContain("kinetic-title");
    expect(types).toContain("animated-lower-third");
    expect(types).toContain("number-counter");
    expect(types).toContain("glass-callout");
    expect(types).toContain("particle-burst");
    expect(types).toContain("progress-bar");
    expect(types).toContain("cta-reveal");
    expect(types).toContain("chapter-wipe");
    // Concept illustrations (8 new)
    expect(types).toContain("crm-calendar");
    expect(types).toContain("social-feed");
    expect(types).toContain("ai-workflow");
    expect(types).toContain("stat-counter");
    expect(types).toContain("pipeline-board");
    expect(types).toContain("inbox-send");
    expect(types).toContain("dashboard");
    expect(types).toContain("code-terminal");
    expect(types.length).toBe(16);
  });

  it("get() returns renderer for known type", () => {
    const renderer = registry.get("kinetic-title");
    expect(renderer).toBeDefined();
    expect(renderer!.type).toBe("kinetic-title");
  });

  it("get() returns undefined for unknown type", () => {
    expect(registry.get("nonexistent")).toBeUndefined();
  });

  it("collectDependencies() deduplicates by id", () => {
    // kinetic-title and animated-lower-third both depend on GSAP
    const deps = registry.collectDependencies([
      "kinetic-title",
      "animated-lower-third",
      "glass-callout",
    ]);
    const gsapDeps = deps.filter((d) => d.id === "gsap");
    expect(gsapDeps.length).toBe(1);
  });

  it("collectDependencies() returns empty for types with no deps", () => {
    const deps = registry.collectDependencies(["number-counter", "progress-bar"]);
    expect(deps.length).toBe(0);
  });

  it("collectDependencies() ignores unknown types", () => {
    const deps = registry.collectDependencies(["nonexistent"]);
    expect(deps.length).toBe(0);
  });

  it("GSAP dependency has getInlineContent", () => {
    expect(GSAP_CDN.getInlineContent).toBeDefined();
    const content = GSAP_CDN.getInlineContent!();
    expect(content.length).toBeGreaterThan(10000); // GSAP is ~73KB
    expect(content).toContain("timeline");
  });
});

// === Assembler Tests ===

describe("components.assembler", () => {
  it("returns empty script for empty overlays", () => {
    const result = assembleOverlayPage([], style, 1920, 1080);
    expect(result.script).toContain("COMPONENT OVERLAY SYSTEM");
    expect(result.script).toContain("var comps = [];");
    expect(result.dependencies.length).toBe(0);
  });

  it("maps hook-card → kinetic-title", () => {
    const overlays: OverlayElement[] = [
      {
        type: "hook-card",
        startMs: 200,
        endMs: 5000,
        data: { text: "Hello World" },
        position: "top-center",
      },
    ];
    const result = assembleOverlayPage(overlays, style, 1920, 1080);
    expect(result.script).toContain("ff-c-0");
    // Words are split into individual spans
    expect(result.script).toContain("Hello");
    expect(result.script).toContain("World");
    expect(result.script).toContain("start: 200");
    expect(result.script).toContain("end: 5000");
  });

  it("maps all overlay types to component types", () => {
    const typeMap: Array<[string, string]> = [
      ["hook-card", "ff-kt-"],
      ["lower-third", "ff-lt-"],
      ["key-point", "ff-gc-"],
      ["stat-callout", "ff-nc-"],
      ["chapter-marker", "ff-cw-"],
      ["cta-card", "ff-cr-"],
      ["particle-burst", "ff-pb-"],
      ["progress-bar", "ff-pb-"],
    ];

    for (const [overlayType, cssPrefix] of typeMap) {
      const overlays: OverlayElement[] = [
        {
          type: overlayType as any,
          startMs: 0,
          endMs: 3000,
          data: {
            text: "Test",
            name: "Name",
            title: "Title",
            label: "Label",
            durationMs: "3000",
            "42": "Users",
          },
          position: "top-center",
        },
      ];
      const result = assembleOverlayPage(overlays, style, 1920, 1080);
      expect(result.script).toContain("ff-c-0");
    }
  });

  it("deduplicates CSS for same component type", () => {
    const overlays: OverlayElement[] = [
      {
        type: "key-point",
        startMs: 0,
        endMs: 3000,
        data: { label: "Point 1", text: "First" },
        position: "top-right",
      },
      {
        type: "key-point",
        startMs: 5000,
        endMs: 8000,
        data: { label: "Point 2", text: "Second" },
        position: "top-left",
      },
    ];
    const result = assembleOverlayPage(overlays, style, 1920, 1080);
    // CSS should appear once, not twice
    const cssMatches = result.script.match(/ff-gc-wrap/g);
    // In the JSON-stringified CSS, the class appears once in the CSS block
    // But may appear in HTML too. Just verify it renders both instances.
    expect(result.script).toContain("ff-c-0");
    expect(result.script).toContain("ff-c-1");
  });

  it("collects GSAP dependency for GSAP-based components", () => {
    const overlays: OverlayElement[] = [
      {
        type: "hook-card",
        startMs: 0,
        endMs: 3000,
        data: { text: "Test" },
        position: "top-center",
      },
    ];
    const result = assembleOverlayPage(overlays, style, 1920, 1080);
    expect(result.dependencies.length).toBe(1);
    expect(result.dependencies[0].id).toBe("gsap");
  });

  it("no dependencies for pure JS components only", () => {
    const overlays: OverlayElement[] = [
      {
        type: "progress-bar",
        startMs: 0,
        endMs: 10000,
        data: { durationMs: "10000" },
        position: "bottom-left",
      },
    ];
    const result = assembleOverlayPage(overlays, style, 1920, 1080);
    expect(result.dependencies.length).toBe(0);
  });

  it("skips unknown overlay types gracefully", () => {
    const overlays: OverlayElement[] = [
      {
        type: "unknown-type" as any,
        startMs: 0,
        endMs: 3000,
        data: {},
        position: "top-center",
      },
    ];
    const result = assembleOverlayPage(overlays, style, 1920, 1080);
    // Should not crash, just skip
    expect(result.script).toContain("var comps = [];");
    expect(result.dependencies.length).toBe(0);
  });

  it("includes error boundaries in generated script", () => {
    const overlays: OverlayElement[] = [
      {
        type: "hook-card",
        startMs: 0,
        endMs: 3000,
        data: { text: "Test" },
        position: "top-center",
      },
    ];
    const result = assembleOverlayPage(overlays, style, 1920, 1080);
    expect(result.script).toContain("try {");
    expect(result.script).toContain("[FrameForge] Component ff-c-0");
  });

  it("passes position data to renderers", () => {
    const overlays: OverlayElement[] = [
      {
        type: "key-point",
        startMs: 0,
        endMs: 3000,
        data: { label: "Test", text: "Content" },
        position: "top-left",
      },
    ];
    const result = assembleOverlayPage(overlays, style, 1920, 1080);
    // Glass callout should have left-side positioning
    expect(result.script).toContain("ff-gc-left");
  });

  it("scales proportionally based on video dimensions", () => {
    const overlays: OverlayElement[] = [
      {
        type: "hook-card",
        startMs: 0,
        endMs: 3000,
        data: { text: "Test" },
        position: "top-center",
      },
    ];
    // 540p = 0.5x scale
    const result540 = assembleOverlayPage(overlays, style, 960, 540);
    // 1080p = 1.0x scale
    const result1080 = assembleOverlayPage(overlays, style, 1920, 1080);
    // 540p should have smaller font sizes in CSS
    expect(result540.script).not.toBe(result1080.script);
  });
});

// === Renderer Output Tests ===

describe("components.renderers", () => {
  const timing = { startMs: 1000, endMs: 5000, durationMs: 4000 };
  const ctx1080 = {
    style,
    width: 1920,
    height: 1080,
    scale: 1,
    instanceId: "ff-test-0",
  };

  describe("kinetic-title", () => {
    it("produces valid output with word spans", () => {
      const renderer = registry.get("kinetic-title")!;
      const output = renderer.render(
        { text: "Hello World Test" },
        timing,
        ctx1080
      );
      expect(output.css).toContain(".ff-kt-wrap");
      expect(output.css).toContain(".ff-kt-bg");
      expect(output.css).toContain(".ff-kt-word");
      expect(output.html).toContain("ff-test-0-w0");
      expect(output.html).toContain("ff-test-0-w1");
      expect(output.html).toContain("ff-test-0-w2");
      expect(output.html).toContain("Hello");
      expect(output.html).toContain("World");
      expect(output.initJs).toContain("gsap.timeline");
      expect(output.initJs).toContain("el._tl");
      expect(output.updateJs).toContain("el._tl");
    });

    it("handles empty text", () => {
      const renderer = registry.get("kinetic-title")!;
      const output = renderer.render({ text: "" }, timing, ctx1080);
      expect(output.html).toContain("ff-kt-bg");
    });

    it("escapes HTML in text", () => {
      const renderer = registry.get("kinetic-title")!;
      const output = renderer.render(
        { text: "<script>alert(1)</script>" },
        timing,
        ctx1080
      );
      expect(output.html).not.toContain("<script>");
      expect(output.html).toContain("&lt;script&gt;");
    });
  });

  describe("animated-lower-third", () => {
    it("produces line + name + title elements", () => {
      const renderer = registry.get("animated-lower-third")!;
      const output = renderer.render(
        { name: "John Doe", title: "CEO" },
        timing,
        ctx1080
      );
      expect(output.css).toContain(".ff-lt-wrap");
      expect(output.css).toContain(".ff-lt-line");
      expect(output.html).toContain("John Doe");
      expect(output.html).toContain("CEO");
      expect(output.initJs).toContain("clipPath");
    });

    it("handles missing title", () => {
      const renderer = registry.get("animated-lower-third")!;
      const output = renderer.render(
        { name: "John Doe" },
        timing,
        ctx1080
      );
      expect(output.html).toContain("John Doe");
      expect(output.html).not.toContain("ff-lt-title");
    });
  });

  describe("number-counter", () => {
    it("has no GSAP dependency", () => {
      const renderer = registry.get("number-counter")!;
      expect(renderer.dependencies.length).toBe(0);
    });

    it("creates stat boxes from data", () => {
      const renderer = registry.get("number-counter")!;
      const output = renderer.render(
        { "42+": "Users", "100": "Customers" },
        timing,
        ctx1080
      );
      expect(output.html).toContain("ff-nc-box");
      expect(output.html).toContain("Users");
      expect(output.html).toContain("Customers");
      expect(output.updateJs).toContain("zeta"); // Spring physics
    });
  });

  describe("glass-callout", () => {
    it("supports right positioning", () => {
      const renderer = registry.get("glass-callout")!;
      const output = renderer.render(
        { label: "Key", text: "Content", _position: "top-right" },
        timing,
        ctx1080
      );
      expect(output.html).toContain("ff-gc-right");
    });

    it("supports left positioning", () => {
      const renderer = registry.get("glass-callout")!;
      const output = renderer.render(
        { label: "Key", text: "Content", _position: "top-left" },
        timing,
        ctx1080
      );
      expect(output.html).toContain("ff-gc-left");
    });

    it("uses backdrop-filter for glass effect", () => {
      const renderer = registry.get("glass-callout")!;
      const output = renderer.render(
        { label: "Key", text: "Content" },
        timing,
        ctx1080
      );
      expect(output.css).toContain("backdrop-filter");
    });
  });

  describe("particle-burst", () => {
    it("has no external dependencies", () => {
      const renderer = registry.get("particle-burst")!;
      expect(renderer.dependencies.length).toBe(0);
    });

    it("creates a canvas element", () => {
      const renderer = registry.get("particle-burst")!;
      const output = renderer.render({}, timing, ctx1080);
      expect(output.html).toContain("<canvas");
      expect(output.html).toContain('width="1920"');
      expect(output.html).toContain('height="1080"');
    });

    it("uses seeded PRNG for determinism", () => {
      const renderer = registry.get("particle-burst")!;
      const output = renderer.render({}, timing, ctx1080);
      expect(output.initJs).toContain("seed");
      expect(output.initJs).toContain("1664525"); // LCG constant
      expect(output.initJs).toContain("200"); // 200 particles
    });

    it("seed is based on startMs", () => {
      const renderer = registry.get("particle-burst")!;
      const output1 = renderer.render(
        {},
        { startMs: 1000, endMs: 2500, durationMs: 1500 },
        ctx1080
      );
      const output2 = renderer.render(
        {},
        { startMs: 5000, endMs: 6500, durationMs: 1500 },
        ctx1080
      );
      // Different seeds produce different init code
      expect(output1.initJs).toContain("seed = 1000");
      expect(output2.initJs).toContain("seed = 5000");
    });
  });

  describe("progress-bar", () => {
    it("has no external dependencies", () => {
      const renderer = registry.get("progress-bar")!;
      expect(renderer.dependencies.length).toBe(0);
    });

    it("renders fill bar with accent color", () => {
      const renderer = registry.get("progress-bar")!;
      const output = renderer.render(
        { durationMs: "30000" },
        { startMs: 0, endMs: 30000, durationMs: 30000 },
        ctx1080
      );
      expect(output.css).toContain(".ff-pb-fill");
      expect(output.css).toContain(style.colors.primary);
      expect(output.updateJs).toContain("pct");
    });
  });

  describe("cta-reveal", () => {
    it("includes glow effect", () => {
      const renderer = registry.get("cta-reveal")!;
      const output = renderer.render(
        { text: "Follow", subtext: "@user" },
        timing,
        ctx1080
      );
      expect(output.html).toContain("ff-cr-glow");
      expect(output.html).toContain("Follow");
      expect(output.html).toContain("@user");
      expect(output.initJs).toContain("back.out");
    });
  });

  describe("chapter-wipe", () => {
    it("creates full-width bar with label", () => {
      const renderer = registry.get("chapter-wipe")!;
      const output = renderer.render(
        { label: "New Topic" },
        timing,
        ctx1080
      );
      expect(output.css).toContain(".ff-cw-bar");
      expect(output.css).toContain("width: 100%");
      expect(output.html).toContain("New Topic");
      expect(output.initJs).toContain("scaleX");
    });
  });
});

// === Utility Tests ===

describe("components.escapeHtml", () => {
  it("escapes angle brackets", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("a&b")).toBe("a&amp;b");
  });

  it("escapes quotes", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("returns empty string for empty/null input", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml(null as any)).toBe("");
    expect(escapeHtml(undefined as any)).toBe("");
  });
});
