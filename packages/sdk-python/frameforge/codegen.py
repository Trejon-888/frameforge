"""HTML code generation from Python scene graph."""

from __future__ import annotations

import html
import json
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from frameforge.scene import Scene


def generate_html(scene: Scene) -> str:
    """Generate a self-contained HTML page from a Scene."""
    elements_html = "\n".join(
        _generate_element(el.to_dict(), i)
        for i, el in enumerate(scene.elements)
    )

    animation_js = "\n\n".join(
        code
        for i, el in enumerate(scene.elements)
        if (code := _generate_animation_js(el.to_dict(), i))
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={scene.width}, height={scene.height}">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html, body {{
      width: {scene.width}px;
      height: {scene.height}px;
      overflow: hidden;
      background: {scene.background};
    }}
    .ff-element {{
      position: absolute;
      transform-origin: center center;
    }}
  </style>
</head>
<body>
{elements_html}
<script>
function updateAnimations() {{
  const t = window.__frameforge ? window.__frameforge.currentTime : 0;

{animation_js}
}}

function loop() {{
  updateAnimations();
  requestAnimationFrame(loop);
}}
requestAnimationFrame(loop);
</script>
</body>
</html>"""


def _generate_element(el: dict, index: int) -> str:
    """Generate HTML for a single element."""
    el_id = f"ff-el-{index}"
    props = el["props"]

    if el["type"] == "text":
        content = html.escape(props.get("content", ""))
        return (
            f'  <div id="{el_id}" class="ff-element" style="'
            f"left: {props['x']}px; top: {props['y']}px; "
            f"font-size: {props['fontSize']}px; "
            f"font-family: {props['fontFamily']}; "
            f"font-weight: {props['fontWeight']}; "
            f"color: {props['color']}; "
            f"opacity: {props['opacity']}; "
            f"text-align: {props['textAlign']}; "
            f'transform: translate(-50%, -50%);">'
            f"{content}</div>"
        )

    if el["type"] == "shape":
        shape_type = props.get("shapeType", "rect")
        radius = "50%" if shape_type == "circle" else f"{props['borderRadius']}px"
        return (
            f'  <div id="{el_id}" class="ff-element" style="'
            f"left: {props['x']}px; top: {props['y']}px; "
            f"width: {props['width']}px; height: {props['height']}px; "
            f"background: {props['fill']}; "
            f"border: {props['strokeWidth']}px solid {props['stroke']}; "
            f"border-radius: {radius}; "
            f"opacity: {props['opacity']}; "
            f'transform: translate(-50%, -50%);"></div>'
        )

    return f"<!-- Unknown element type: {el['type']} -->"


def _generate_animation_js(el: dict, index: int) -> str:
    """Generate JavaScript for animating an element."""
    animations = el.get("animations", [])
    if not animations:
        return ""

    el_id = f"ff-el-{index}"
    lines = [
        f"  // Element {index}: {el['type']}",
        f"  (function() {{",
        f"    const el = document.getElementById('{el_id}');",
        f"    if (!el) return;",
    ]

    for anim in animations:
        lines.append(_generate_keyframe_interpolation(anim))

    lines.append("  })();")
    return "\n".join(lines)


_CSS_PROPERTY_MAP = {
    "x": "left",
    "y": "top",
    "opacity": "opacity",
    "width": "width",
    "height": "height",
    "fontSize": "fontSize",
    "color": "color",
    "fill": "background",
}

_UNIT_PROPERTIES = {"x", "y", "width", "height", "fontSize", "left", "top"}


def _generate_keyframe_interpolation(anim: dict) -> str:
    """Generate JS code for interpolating keyframe values."""
    keyframes = anim["keyframes"]
    prop = anim["property"]
    times = sorted(keyframes.keys())
    values = [keyframes[t] for t in times]
    is_numeric = all(isinstance(v, (int, float)) for v in values)

    css_prop = _CSS_PROPERTY_MAP.get(prop, prop)
    needs_unit = prop in _UNIT_PROPERTIES
    unit = "px" if needs_unit else ""

    pairs = ", ".join(f"[{t}, {json.dumps(v)}]" for t, v in zip(times, values))

    if is_numeric:
        suffix = f" + '{unit}'" if needs_unit else ""
        return f"""
    // Animate: {prop}
    {{
      const keyframes = [{pairs}];
      let value = keyframes[0][1];
      for (let i = 0; i < keyframes.length - 1; i++) {{
        const [t0, v0] = keyframes[i];
        const [t1, v1] = keyframes[i + 1];
        if (t >= t0 && t <= t1) {{
          const progress = (t - t0) / (t1 - t0);
          value = v0 + (v1 - v0) * progress;
          break;
        }}
        if (t > t1) value = v1;
      }}
      el.style.{css_prop} = value{suffix};
    }}"""

    return f"""
    // Animate: {prop} (discrete)
    {{
      const keyframes = [{pairs}];
      let value = keyframes[0][1];
      for (const [kt, kv] of keyframes) {{
        if (t >= kt) value = kv;
      }}
      el.style.{css_prop} = value;
    }}"""
