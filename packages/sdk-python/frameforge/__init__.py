"""FrameForge Python SDK — programmatic scene authoring for video rendering."""

from frameforge.scene import Scene
from frameforge.elements import Text, Shape, Image
from frameforge.animations import Animate
from frameforge import easing

__version__ = "0.1.0"
__all__ = ["Scene", "Text", "Shape", "Image", "Animate", "easing"]
