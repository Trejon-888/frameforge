import type { Scene, SceneElement, Animation } from "./scene.js";

/**
 * Generate a self-contained HTML page from a Scene graph.
 * The generated page uses CSS for styling and JavaScript
 * for animation driven by __frameforge time virtualization.
 */
export function generateHTML(scene: Scene): string {
  const elements = scene.elements
    .map((el, i) => generateElement(el, i))
    .join("\n");

  const animationCode = scene.elements
    .map((el, i) => generateAnimationJS(el, i, scene.fps))
    .filter(Boolean)
    .join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${scene.width}, height=${scene.height}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${scene.width}px;
      height: ${scene.height}px;
      overflow: hidden;
      background: ${scene.background};
    }
    .ff-element {
      position: absolute;
      transform-origin: center center;
    }
  </style>
</head>
<body>
${elements}
<script>
// Animation update function called each frame by __frameforge
function updateAnimations() {
  const t = window.__frameforge ? window.__frameforge.currentTime : 0;

${animationCode}
}

// Hook into requestAnimationFrame (which is virtualized by FrameForge)
function loop() {
  updateAnimations();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script>
</body>
</html>`;
}

function generateElement(el: SceneElement, index: number): string {
  const id = `ff-el-${index}`;

  if (el.type === "text") {
    const { content, fontSize, fontFamily, fontWeight, color, x, y, opacity, textAlign } =
      el.props;
    return `  <div id="${id}" class="ff-element" style="
    left: ${x}px; top: ${y}px;
    font-size: ${fontSize}px; font-family: ${fontFamily}; font-weight: ${fontWeight};
    color: ${color}; opacity: ${opacity}; text-align: ${textAlign};
    transform: translate(-50%, -50%);
  ">${escapeHTML(content)}</div>`;
  }

  if (el.type === "shape") {
    const { shapeType, width, height, fill, stroke, strokeWidth, borderRadius, x, y, opacity } =
      el.props;
    const radius =
      shapeType === "circle" ? "50%" : `${borderRadius}px`;
    return `  <div id="${id}" class="ff-element" style="
    left: ${x}px; top: ${y}px;
    width: ${width}px; height: ${height}px;
    background: ${fill}; border: ${strokeWidth}px solid ${stroke};
    border-radius: ${radius}; opacity: ${opacity};
    transform: translate(-50%, -50%);
  "></div>`;
  }

  if (el.type === "image") {
    const { src, width, height, x, y, opacity, objectFit, borderRadius } = el.props;
    return `  <img id="${id}" class="ff-element" src="${escapeHTML(src)}" style="
    left: ${x}px; top: ${y}px;
    width: ${width}px; height: ${height}px;
    opacity: ${opacity}; object-fit: ${objectFit};
    border-radius: ${borderRadius}px;
    transform: translate(-50%, -50%);
  " />`;
  }

  return `<!-- Unknown element type: ${el.type} -->`;
}

function generateAnimationJS(
  el: SceneElement,
  index: number,
  fps: number
): string {
  if (el.animations.length === 0) return "";

  const id = `ff-el-${index}`;
  const lines: string[] = [];
  lines.push(`  // Element ${index}: ${el.type}`);
  lines.push(`  (function() {`);
  lines.push(`    const el = document.getElementById('${id}');`);
  lines.push(`    if (!el) return;`);

  for (const anim of el.animations) {
    lines.push(generateKeyframeInterpolation(anim));
  }

  lines.push(`  })();`);
  return lines.join("\n");
}

function generateKeyframeInterpolation(anim: Animation): string {
  const times = Object.keys(anim.keyframes)
    .map(Number)
    .sort((a, b) => a - b);
  const values = times.map((t) => anim.keyframes[t]);

  const isNumeric = values.every((v) => typeof v === "number");
  const prop = anim.property;

  // Map property names to CSS
  const cssProperty = mapPropertyToCSS(prop);

  if (isNumeric) {
    const pairs = times.map((t, i) => `[${t}, ${values[i]}]`);

    // Scale and rotation need special transform handling
    if (prop === "scale" || prop === "rotation") {
      const transformFn = prop === "scale" ? "scale" : "rotate";
      const unit = prop === "rotation" ? "deg" : "";
      return `
    // Animate: ${prop} (transform)
    {
      const keyframes = [${pairs.join(", ")}];
      let value = keyframes[0][1];
      for (let i = 0; i < keyframes.length - 1; i++) {
        const [t0, v0] = keyframes[i];
        const [t1, v1] = keyframes[i + 1];
        if (t >= t0 && t <= t1) {
          const progress = (t - t0) / (t1 - t0);
          value = v0 + (v1 - v0) * progress;
          break;
        }
        if (t > t1) value = v1;
      }
      el.style.transform = 'translate(-50%, -50%) ${transformFn}(' + value + '${unit})';
    }`;
    }

    return `
    // Animate: ${prop}
    {
      const keyframes = [${pairs.join(", ")}];
      let value = keyframes[0][1];
      for (let i = 0; i < keyframes.length - 1; i++) {
        const [t0, v0] = keyframes[i];
        const [t1, v1] = keyframes[i + 1];
        if (t >= t0 && t <= t1) {
          const progress = (t - t0) / (t1 - t0);
          value = v0 + (v1 - v0) * progress;
          break;
        }
        if (t > t1) value = v1;
      }
      el.style.${cssProperty} = ${needsUnit(prop) ? `value + '${getUnit(prop)}'` : "value"};
    }`;
  }

  // Non-numeric: step through string values
  const pairs = times.map((t, i) => `[${t}, ${JSON.stringify(values[i])}]`);
  return `
    // Animate: ${prop} (discrete)
    {
      const keyframes = [${pairs.join(", ")}];
      let value = keyframes[0][1];
      for (const [kt, kv] of keyframes) {
        if (t >= kt) value = kv;
      }
      el.style.${cssProperty} = value;
    }`;
}

function mapPropertyToCSS(prop: string): string {
  const map: Record<string, string> = {
    x: "left",
    y: "top",
    opacity: "opacity",
    width: "width",
    height: "height",
    fontSize: "fontSize",
    color: "color",
    fill: "background",
    scale: "transform",
    rotation: "transform",
  };
  return map[prop] ?? prop;
}

function needsUnit(prop: string): boolean {
  return ["x", "y", "width", "height", "fontSize", "left", "top"].includes(
    prop
  );
}

function getUnit(prop: string): string {
  return "px";
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
