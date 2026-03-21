"""kino Python SDK — programmatic scene authoring for video rendering."""

from kino.scene import Scene
from kino.elements import Text, Shape, Image
from kino.animations import Animate
from kino import easing

__version__ = "0.3.0"
__all__ = ["Scene", "Text", "Shape", "Image", "Animate", "easing"]
