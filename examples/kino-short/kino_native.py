#!/usr/bin/env python3
"""
kino-native: FFmpeg-native caption pipeline (no Puppeteer)

Uses ASS (Advanced SubStation Alpha) subtitles rendered by libass inside FFmpeg.
This is the same rendering engine used by Premiere Pro, DaVinci Resolve, and VLC.

Renders a 26s video in ~5 seconds instead of 3+ minutes.

Usage: py kino_native.py <input.mp4> [output_name]
"""

import json
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "output"


def format_time(seconds: float) -> str:
    """Format seconds as ASS timestamp H:MM:SS.CC"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int(round((seconds % 1) * 100))
    if cs >= 100:
        s += 1
        cs = 0
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def hex_to_ass(hex_color: str, alpha: int = 0) -> str:
    """Convert #RRGGBB to ASS &HAABBGGRR format"""
    h = hex_color.lstrip('#')
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"&H{alpha:02X}{b:02X}{g:02X}{r:02X}"


def generate_ass(analysis: dict, width: int, height: int, style_name: str = "editorial") -> str:
    """Generate professional ASS subtitle file from analysis data.

    Styles:
      editorial  — Inter-inspired, B&W, tight tracking, slide-up
      social-pop — Bold, yellow emphasis, high energy
    """
    groups = analysis["caption_groups"]

    # ── Style definitions ──────────────────────────────────────────────────
    styles = {
        "editorial": {
            "font":       "Arial",     # Fallback; Inter if installed
            "size":       int(height * 0.047),   # ~90px at 1920
            "emph_size":  int(height * 0.054),   # ~104px at 1920
            "color":      hex_to_ass("#FFFFFF"),
            "emph_color": hex_to_ass("#FFFFFF"),  # B&W discipline: still white, but bolder
            "outline_c":  hex_to_ass("#000000"),
            "shadow_c":   hex_to_ass("#000000", 0x60),
            "outline":    5,
            "shadow":     0,
            "bold":       -1,   # -1 = true in ASS
            "spacing":    -2,   # tight tracking
            "scale_x":    100,
            "scale_y":    100,
            "emph_scale": 108,
            "blur":       1,    # subtle edge softening
            "fade_in":    180,
            "fade_out":   100,
            "margin_v":   int(height * 0.11),
        },
        "social-pop": {
            "font":       "Arial",
            "size":       int(height * 0.050),
            "emph_size":  int(height * 0.060),
            "color":      hex_to_ass("#FFFFFF"),
            "emph_color": hex_to_ass("#FFD700"),  # Yellow emphasis
            "outline_c":  hex_to_ass("#000000"),
            "shadow_c":   hex_to_ass("#000000", 0x80),
            "outline":    6,
            "shadow":     0,
            "bold":       -1,
            "spacing":    -1,
            "scale_x":    100,
            "scale_y":    100,
            "emph_scale": 115,
            "blur":       0,
            "fade_in":    120,
            "fade_out":   80,
            "margin_v":   int(height * 0.10),
        },
    }
    s = styles.get(style_name, styles["editorial"])

    margin_lr = int(width * 0.04)

    # ── ASS header ─────────────────────────────────────────────────────────
    ass = f"""[Script Info]
Title: kino captions
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{s['font']},{s['size']},{s['color']},{s['color']},{s['outline_c']},{s['shadow_c']},{s['bold']},0,0,0,{s['scale_x']},{s['scale_y']},{s['spacing']},0,1,{s['outline']},{s['shadow']},2,{margin_lr},{margin_lr},{s['margin_v']},1
Style: Emph,{s['font']},{s['emph_size']},{s['emph_color']},{s['emph_color']},{s['outline_c']},{s['shadow_c']},{s['bold']},0,0,0,{s['emph_scale']},{s['emph_scale']},{s['spacing']},0,1,{s['outline']},{s['shadow']},2,{margin_lr},{margin_lr},{s['margin_v']},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    # ── Generate dialogue lines ────────────────────────────────────────────
    for g in groups:
        start = format_time(g["start"])
        end_t = g["end"] + 0.10
        end = format_time(end_t)

        words = g["words"]
        emp_idx = g.get("emphasis_idx", -1)

        parts = []
        for i, w in enumerate(words):
            if i == emp_idx:
                # Inline style override for emphasis word
                parts.append(f"{{\\rEmph}}{w}{{\\rDefault}}")
            else:
                parts.append(w)

        text = " ".join(parts)

        # Fade + subtle blur edge
        fade = f"\\fad({s['fade_in']},{s['fade_out']})"
        blur = f"\\be{s['blur']}" if s['blur'] > 0 else ""
        text = f"{{{fade}{blur}}}{text}"

        ass += f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}\n"

    return ass


def probe_video(path: str) -> dict:
    """Get video dimensions and duration via ffprobe."""
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_streams", "-show_format", path],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    vs = next(s for s in data["streams"] if s["codec_type"] == "video")
    return {
        "width":    int(vs["width"]),
        "height":   int(vs["height"]),
        "duration": float(data["format"]["duration"]),
        "fps":      eval(vs.get("r_frame_rate", "30/1")),
    }


def render_with_ass(video_path: str, ass_path: str, output_path: str):
    """Single-pass FFmpeg render: source video + ASS captions → output."""
    # FFmpeg ASS filter path: forward slashes, escape colons and backslashes
    ass_ffmpeg = str(Path(ass_path).resolve()).replace('\\', '/').replace(':', '\\:')

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vf", f"ass='{ass_ffmpeg}'",
        "-c:v", "libx264", "-crf", "18", "-preset", "medium",
        "-c:a", "copy",
        output_path,
    ]

    print(f"  ffmpeg -i source -vf ass=captions.ass → {Path(output_path).name}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        # Try subtitles filter as fallback (also renders ASS via libass)
        print("  ass filter failed, trying subtitles filter...")
        ass_sub = str(Path(ass_path).resolve()).replace('\\', '/').replace(':', '\\:')
        cmd2 = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vf", f"subtitles='{ass_sub}'",
            "-c:v", "libx264", "-crf", "18", "-preset", "medium",
            "-c:a", "copy",
            output_path,
        ]
        result2 = subprocess.run(cmd2, capture_output=True, text=True)
        if result2.returncode != 0:
            print(f"  stderr: {result2.stderr[-600:]}")
            raise RuntimeError("FFmpeg render failed")

    size_kb = Path(output_path).stat().st_size // 1024
    print(f"  ✔ {Path(output_path).name} ({size_kb}KB)")


def main():
    if len(sys.argv) < 2:
        print("Usage: py kino_native.py <input.mp4> [output_name] [style]")
        print("Styles: editorial, social-pop")
        sys.exit(1)

    video_path  = sys.argv[1]
    output_name = sys.argv[2] if len(sys.argv) > 2 else "kino-native"
    style_name  = sys.argv[3] if len(sys.argv) > 3 else "social-pop"

    if not Path(video_path).exists():
        print(f"File not found: {video_path}")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load analysis
    analysis_path = OUTPUT_DIR / "analysis.json"
    if not analysis_path.exists():
        print(f"Missing: {analysis_path}")
        print("Run kino_short.py first to generate analysis.json")
        sys.exit(1)

    with open(analysis_path) as f:
        analysis = json.load(f)

    # Probe video
    info = probe_video(video_path)
    print(f"\nSource: {Path(video_path).name} | {info['width']}x{info['height']} | {info['duration']:.1f}s")
    print(f"Style:  {style_name}\n")

    # Generate ASS
    print("━━━ Step 1: Generate ASS captions ━━━")
    ass_content = generate_ass(analysis, info["width"], info["height"], style_name)
    ass_path = OUTPUT_DIR / "captions.ass"
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_content)
    n_groups = len(analysis.get("caption_groups", []))
    print(f"  ✔ captions.ass ({n_groups} groups, {len(ass_content)} bytes)")

    # Render
    print("\n━━━ Step 2: FFmpeg render (no Puppeteer) ━━━")
    output = str(OUTPUT_DIR / f"{output_name}.mp4")
    render_with_ass(video_path, str(ass_path), output)

    print(f"\n✔ Done! → {output}")
    print(f"  Run: start \"\" \"{output}\"")


if __name__ == "__main__":
    main()
