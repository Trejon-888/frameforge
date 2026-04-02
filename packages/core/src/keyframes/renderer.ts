/**
 * Canvas 2D Scene Renderer
 *
 * Takes a SceneComposition + current time → draws everything to a canvas.
 * This is the bridge between the keyframe engine and the browser.
 *
 * Element renderers are registered by type name. The system is open —
 * agents can use built-in renderers or provide custom draw functions
 * inline via the scene format.
 */

import { resolveAtTime, type AnimatedElement, type ResolvedProps } from "./engine.js";

// ═══════════════════════════════════════════════════════════════════════════
//  Element renderer registry
// ═══════════════════════════════════════════════════════════════════════════

export type ElementRenderer = (
  ctx: CanvasRenderingContext2D,
  props: Record<string, any>,
  animated: ResolvedProps,
  time: number,
  element: AnimatedElement
) => void;

const rendererRegistry = new Map<string, ElementRenderer>();

/**
 * Register a renderer for an element type.
 */
export function registerRenderer(type: string, renderer: ElementRenderer): void {
  rendererRegistry.set(type, renderer);
}

/**
 * Get a registered renderer (or undefined).
 */
export function getRenderer(type: string): ElementRenderer | undefined {
  return rendererRegistry.get(type);
}

/**
 * List all registered renderer types.
 */
export function listRenderers(): string[] {
  return Array.from(rendererRegistry.keys());
}

// ═══════════════════════════════════════════════════════════════════════════
//  Built-in element renderers
// ═══════════════════════════════════════════════════════════════════════════

/** Circle */
registerRenderer("circle", (ctx, props, anim) => {
  const cx = anim.cx ?? props.cx ?? 0;
  const cy = anim.cy ?? props.cy ?? 0;
  const r = anim.r ?? props.r ?? 50;
  const opacity = anim.opacity ?? 1;
  const lineWidth = anim.lineWidth ?? props.lineWidth ?? 2;
  const fill = props.fill || "transparent";
  const stroke = props.stroke || "#ffffff";

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2);
  if (fill !== "transparent" && fill !== "none") {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke !== "none") {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
});

/** Rectangle */
registerRenderer("rect", (ctx, props, anim) => {
  const x = anim.x ?? props.x ?? 0;
  const y = anim.y ?? props.y ?? 0;
  const w = anim.width ?? props.width ?? 100;
  const h = anim.height ?? props.height ?? 100;
  const opacity = anim.opacity ?? 1;
  const rotation = anim.rotation ?? 0;
  const fill = props.fill || "transparent";
  const stroke = props.stroke || "#ffffff";
  const lineWidth = anim.lineWidth ?? props.lineWidth ?? 2;
  const radius = props.borderRadius ?? 0;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);

  ctx.beginPath();
  if (radius > 0) {
    ctx.roundRect(0, 0, w, h, radius);
  } else {
    ctx.rect(0, 0, w, h);
  }

  if (fill !== "transparent" && fill !== "none") {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke !== "none") {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
});

/** Line */
registerRenderer("line", (ctx, props, anim) => {
  const x1 = anim.x1 ?? props.x1 ?? 0;
  const y1 = anim.y1 ?? props.y1 ?? 0;
  const x2 = anim.x2 ?? props.x2 ?? 100;
  const y2 = anim.y2 ?? props.y2 ?? 100;
  const opacity = anim.opacity ?? 1;
  const progress = anim.progress ?? 1; // 0-1: how much of the line to draw
  const stroke = props.stroke || "#ffffff";
  const lineWidth = anim.lineWidth ?? props.lineWidth ?? 2;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = (props.lineCap as CanvasLineCap) || "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  // Partial line drawing (for line-draw animations)
  const ex = x1 + (x2 - x1) * Math.max(0, Math.min(1, progress));
  const ey = y1 + (y2 - y1) * Math.max(0, Math.min(1, progress));
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.restore();
});

/** Text */
registerRenderer("text", (ctx, props, anim) => {
  const x = anim.x ?? props.x ?? 0;
  const y = anim.y ?? props.y ?? 0;
  const opacity = anim.opacity ?? 1;
  const scale = anim.scale ?? 1;
  const rotation = anim.rotation ?? 0;
  const content = props.content || "";
  const fontSize = anim.fontSize ?? props.fontSize ?? 48;
  const fontFamily = props.fontFamily || "'Inter', system-ui, sans-serif";
  const fontWeight = props.fontWeight || "900";
  const color = props.color || "#ffffff";
  const align = props.align || "center";
  const baseline = props.baseline || "middle";
  const letterSpacing = props.letterSpacing ?? 0;
  const strokeColor = props.strokeColor;
  const strokeWidth = anim.strokeWidth ?? props.strokeWidth ?? 0;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate((rotation * Math.PI) / 180);

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = align as CanvasTextAlign;
  ctx.textBaseline = baseline as CanvasTextBaseline;

  // Stroke (outline) first, then fill
  if (strokeColor && strokeWidth > 0) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeText(content, 0, 0);
  }

  ctx.fillStyle = color;
  ctx.fillText(content, 0, 0);
  ctx.restore();
});

/** Grid background */
registerRenderer("grid", (ctx, props, anim) => {
  const opacity = anim.opacity ?? 1;
  const spacing = props.spacing ?? 60;
  const color = props.color || "rgba(255,255,255,0.08)";
  const width = props.width ?? ctx.canvas.width;
  const height = props.height ?? ctx.canvas.height;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
  ctx.restore();
});

/** Dot / particle */
registerRenderer("dot", (ctx, props, anim) => {
  const cx = anim.x ?? props.x ?? 0;
  const cy = anim.y ?? props.y ?? 0;
  const r = anim.r ?? props.r ?? 4;
  const opacity = anim.opacity ?? 1;
  const color = props.color || "#ffffff";
  const glow = anim.glow ?? props.glow ?? 0;

  ctx.save();
  ctx.globalAlpha = opacity;
  if (glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
});

/** Image (draws a preloaded image — the props.src is loaded externally) */
registerRenderer("image", (ctx, props, anim) => {
  const x = anim.x ?? props.x ?? 0;
  const y = anim.y ?? props.y ?? 0;
  const w = anim.width ?? props.width ?? 200;
  const h = anim.height ?? props.height ?? 200;
  const opacity = anim.opacity ?? 1;
  const scale = anim.scale ?? 1;
  const rotation = anim.rotation ?? 0;
  const radius = props.borderRadius ?? 0;

  // props._img is the preloaded Image object (set by the page setup)
  const img = props._img;
  if (!img) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.rotate((rotation * Math.PI) / 180);

  if (radius > 0) {
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, radius);
    ctx.clip();
  }

  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
});

/** Group — renders children with shared transform */
registerRenderer("group", (ctx, props, anim, time, element) => {
  const x = anim.x ?? props.x ?? 0;
  const y = anim.y ?? props.y ?? 0;
  const opacity = anim.opacity ?? 1;
  const scale = anim.scale ?? 1;
  const rotation = anim.rotation ?? 0;

  ctx.save();
  ctx.globalAlpha *= opacity;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate((rotation * Math.PI) / 180);

  if (element.children) {
    for (const child of element.children) {
      renderElement(ctx, child, time);
    }
  }

  ctx.restore();
});

// ═══════════════════════════════════════════════════════════════════════════
//  Render pipeline
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render a single element to canvas at a given time.
 */
export function renderElement(
  ctx: CanvasRenderingContext2D,
  element: AnimatedElement,
  time: number
): void {
  const renderer = rendererRegistry.get(element.type);
  if (!renderer) return; // Unknown type — skip silently

  const animated = resolveAtTime(element, time);
  renderer(ctx, element.props, animated, time, element);
}

/**
 * Render all elements from a list at a given time.
 */
export function renderElements(
  ctx: CanvasRenderingContext2D,
  elements: AnimatedElement[],
  time: number
): void {
  for (const el of elements) {
    renderElement(ctx, el, time);
  }
}
