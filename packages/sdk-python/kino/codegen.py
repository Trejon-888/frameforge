"""HTML code generation from Python scene graph."""

from __future__ import annotations

import html
import json
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from kino.scene import Scene


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
  const t = window.__kino ? window.__kino.currentTime : 0;

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

    if el["type"] == "image":
        src = html.escape(props.get("src", ""))
        return (
            f'  <img id="{el_id}" class="ff-element" src="{src}" style="'
            f"left: {props['x']}px; top: {props['y']}px; "
            f"width: {props['width']}px; height: {props['height']}px; "
            f"opacity: {props['opacity']}; "
            f"object-fit: {props['objectFit']}; "
            f"border-radius: {props['borderRadius']}px; "
            f'transform: translate(-50%, -50%);" />'
        )

    return f"<!-- Unknown element type: {el['type']} -->"


def _generate_animation_js(el: dict, index: int) -> str:
    """Generate JavaScript for animating an element."""
    animations = el.get("animations", [])
    if not animations:
        return ""

    # Merge multiple animations on the same property into one.
    # Without this, later animation blocks overwrite earlier ones
    # because each block's initial keyframe value applies for all
    # time before its first keyframe.
    merged: dict[str, dict] = {}
    easing_for_prop: dict[str, str | None] = {}
    for anim in animations:
        prop = anim["property"]
        if prop not in merged:
            merged[prop] = {}
            easing_for_prop[prop] = anim.get("easing_name")
        merged[prop].update(anim["keyframes"])
        if anim.get("easing_name"):
            easing_for_prop[prop] = anim["easing_name"]

    el_id = f"ff-el-{index}"
    lines = [
        f"  // Element {index}: {el['type']}",
        f"  (function() {{",
        f"    const el = document.getElementById('{el_id}');",
        f"    if (!el) return;",
    ]

    for prop, keyframes in merged.items():
        merged_anim = {
            "property": prop,
            "keyframes": keyframes,
            "easing_name": easing_for_prop.get(prop),
        }
        lines.append(_generate_keyframe_interpolation(merged_anim))

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


_EASING_JS = {
    "linear": "function(t) { return t; }",
    "ease_in": "function(t) { return t * t; }",
    "ease_out": "function(t) { return t * (2 - t); }",
    "ease_in_out": "function(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }",
    "ease_in_cubic": "function(t) { return t * t * t; }",
    "ease_out_cubic": "function(t) { var f = t - 1; return f*f*f + 1; }",
    "ease_in_out_cubic": "function(t) { return t < 0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; }",
    "spring": "function(t) { return 1 - Math.cos(t * 4.5 * Math.PI) * Math.exp(-t * 6); }",
    "bounce": "function(t) { if(t<1/2.75) return 7.5625*t*t; if(t<2/2.75){t-=1.5/2.75; return 7.5625*t*t+0.75;} if(t<2.5/2.75){t-=2.25/2.75; return 7.5625*t*t+0.9375;} t-=2.625/2.75; return 7.5625*t*t+0.984375; }",
}


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

    easing_name = anim.get("easing_name")
    easing_js = _EASING_JS.get(easing_name, "") if easing_name else ""
    easing_decl = f"\n      const ease = {easing_js};" if easing_js else ""
    ease_call = "ease(progress)" if easing_js else "progress"

    if is_numeric:
        suffix = f" + '{unit}'" if needs_unit else ""
        return f"""
    // Animate: {prop}{f' (easing: {easing_name})' if easing_name else ''}
    {{{easing_decl}
      const keyframes = [{pairs}];
      let value = keyframes[0][1];
      for (let i = 0; i < keyframes.length - 1; i++) {{
        const [t0, v0] = keyframes[i];
        const [t1, v1] = keyframes[i + 1];
        if (t >= t0 && t <= t1) {{
          const progress = (t - t0) / (t1 - t0);
          value = v0 + (v1 - v0) * {ease_call};
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
