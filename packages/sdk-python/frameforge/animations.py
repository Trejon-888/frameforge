"""Animation helpers for FrameForge scenes."""

from __future__ import annotations

from typing import Any, Callable


class Animate:
    """Fluent helper for building animations.

    Example:
        title.animate("opacity", Animate.keyframes({0: 0, 1: 1}))
    """

    @staticmethod
    def keyframes(kf: dict[float, Any]) -> dict[float, Any]:
        """Create a keyframes dict. Convenience pass-through."""
        return kf

    @staticmethod
    def fade_in(start: float = 0, end: float = 1.0) -> dict:
        """Preset: fade from 0 to 1 opacity."""
        return {"property": "opacity", "keyframes": {start: 0, end: 1}}

    @staticmethod
    def fade_out(start: float = 0, end: float = 1.0) -> dict:
        """Preset: fade from 1 to 0 opacity."""
        return {"property": "opacity", "keyframes": {start: 1, end: 0}}

    @staticmethod
    def slide_in_left(
        start: float = 0, end: float = 1.0, target_x: float = 960
    ) -> dict:
        """Preset: slide in from the left."""
        return {
            "property": "x",
            "keyframes": {start: -200, end: target_x},
        }

    @staticmethod
    def slide_in_right(
        start: float = 0, end: float = 1.0, target_x: float = 960
    ) -> dict:
        """Preset: slide in from the right."""
        return {
            "property": "x",
            "keyframes": {start: 2120, end: target_x},
        }
