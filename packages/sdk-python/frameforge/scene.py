"""Scene builder — the top-level container for a FrameForge video."""

from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from frameforge.codegen import generate_html


class Scene:
    """A video scene with elements and animations."""

    def __init__(
        self,
        *,
        width: int = 1920,
        height: int = 1080,
        fps: int = 30,
        duration: float,
        background: str = "#000000",
    ):
        self.width = width
        self.height = height
        self.fps = fps
        self.duration = duration
        self.background = background
        self.elements: list[Any] = []
        self.audio: list[dict] = []

    def add(self, *elements: Any) -> Scene:
        """Add elements to the scene."""
        for el in elements:
            self.elements.append(el)
        return self

    def add_audio(
        self, src: str, *, start_at: float = 0, volume: float = 1.0
    ) -> Scene:
        """Add an audio track to the scene."""
        self.audio.append({"src": src, "startAt": start_at, "volume": volume})
        return self

    def to_manifest(self, output: str = "./output.mp4") -> dict:
        """Generate a scene manifest dict."""
        return {
            "version": "1.0",
            "canvas": {
                "width": self.width,
                "height": self.height,
                "fps": self.fps,
                "duration": self.duration,
                "background": self.background,
            },
            "entry": "./scene.html",
            "audio": self.audio,
            "render": {
                "codec": "h264",
                "quality": "high",
                "pixelFormat": "yuv420p",
                "output": output,
            },
        }

    def render(self, output: str = "./output.mp4") -> str:
        """Generate HTML and manifest, then invoke the FrameForge CLI."""
        with tempfile.TemporaryDirectory(prefix="frameforge-") as tmpdir:
            tmpdir_path = Path(tmpdir)

            # Generate HTML
            html = generate_html(self)
            html_path = tmpdir_path / "scene.html"
            html_path.write_text(html, encoding="utf-8")

            # Generate manifest
            manifest = self.to_manifest(str(Path(output).resolve()))
            manifest["entry"] = str(html_path)
            manifest_path = tmpdir_path / "scene.json"
            manifest_path.write_text(
                json.dumps(manifest, indent=2), encoding="utf-8"
            )

            # Call frameforge CLI
            result = subprocess.run(
                ["npx", "frameforge", "render", str(manifest_path)],
                capture_output=True,
                text=True,
            )

            if result.returncode != 0:
                raise RuntimeError(
                    f"FrameForge render failed:\n{result.stderr}"
                )

            return str(Path(output).resolve())
