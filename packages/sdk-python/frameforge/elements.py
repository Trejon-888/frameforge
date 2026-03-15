"""Built-in scene elements: Text, Shape, etc."""

from __future__ import annotations

from typing import Any, Callable


class _BaseElement:
    """Base class for all scene elements."""

    def __init__(self, element_type: str, **props: Any):
        self._type = element_type
        self._props = props
        self._animations: list[dict] = []

    def animate(
        self,
        prop: str,
        keyframes: dict[float, Any],
        easing: Callable[[float], float] | None = None,
    ) -> _BaseElement:
        """Add a keyframe animation to this element."""
        self._animations.append(
            {
                "property": prop,
                "keyframes": keyframes,
                "easing": easing,
                "easing_name": getattr(easing, "__name__", None),
            }
        )
        return self

    def to_dict(self) -> dict:
        """Serialize this element for codegen."""
        return {
            "type": self._type,
            "props": {**self._props},
            "animations": self._animations,
        }


class Text(_BaseElement):
    """A text element."""

    def __init__(
        self,
        content: str,
        *,
        font_size: int = 48,
        font_family: str = "system-ui, sans-serif",
        font_weight: str = "normal",
        color: str = "#ffffff",
        x: float = 960,
        y: float = 540,
        opacity: float = 1.0,
        text_align: str = "center",
    ):
        super().__init__(
            "text",
            content=content,
            fontSize=font_size,
            fontFamily=font_family,
            fontWeight=font_weight,
            color=color,
            x=x,
            y=y,
            opacity=opacity,
            textAlign=text_align,
        )


class Shape(_BaseElement):
    """A shape element (rect, circle, ellipse)."""

    def __init__(
        self,
        shape_type: str = "rect",
        *,
        width: float = 100,
        height: float = 100,
        fill: str = "#ffffff",
        stroke: str = "none",
        stroke_width: float = 0,
        border_radius: float = 0,
        x: float = 960,
        y: float = 540,
        opacity: float = 1.0,
    ):
        super().__init__(
            "shape",
            shapeType=shape_type,
            width=width,
            height=height,
            fill=fill,
            stroke=stroke,
            strokeWidth=stroke_width,
            borderRadius=border_radius,
            x=x,
            y=y,
            opacity=opacity,
        )
