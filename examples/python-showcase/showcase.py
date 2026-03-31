"""
kino Python Showcase — "Data Speaks"
Keynote-quality data-driven motion graphics, 100% Python.

This is the knockout punch: "Wait... Python made this?!"

NOTE: Each element must use ONE .animate() call per property with ALL
keyframes merged, since the codegen generates independent animation
blocks that overwrite each other.
"""
from kino import Scene, Text, Shape, Animate
from kino.easing import ease_out_cubic, spring, ease_in_out

scene = Scene(width=1920, height=1080, fps=30, duration=20, background="#0a0a0f")

ACCENT = "#00ff88"
WHITE = "#ffffff"
GRAY = "#666677"
ORANGE = "#ff6633"
RED = "#ff3333"

# ═══════════════════════════════════════════
# PHASE 1: HOOK (0–3s) — Big number slam
# ═══════════════════════════════════════════

accent_line = Shape(
    shape_type="rect", width=0, height=3, fill=ACCENT,
    x=960, y=540, opacity=0
)
accent_line.animate("opacity", {0: 0, 0.3: 0, 0.35: 1.0, 2.6: 1.0, 3.2: 0})
accent_line.animate("width", {0: 0, 0.3: 0, 1.2: 1600, 3.2: 1600})
accent_line.animate("y", {0: 540, 0.3: 540, 1.2: 340, 3.2: 340})
scene.add(accent_line)

hero_num = Text(
    "7", font_size=280, font_family="'Archivo Black', Impact, sans-serif",
    font_weight="900", color=WHITE, x=960, y=420, opacity=0
)
hero_num.animate("opacity", {0: 0, 0.3: 0, 0.6: 1.0, 2.6: 1.0, 3.2: 0})
hero_num.animate("font_size", {0: 400, 0.3: 400, 0.8: 280, 3.2: 280})
hero_num.animate("y", {0: 480, 0.3: 480, 0.8: 420, 3.2: 420})
scene.add(hero_num)

hero_sub = Text(
    "FRAMEWORKS. ONE RENDERER.", font_size=28, font_family="'Space Mono', monospace",
    color=ACCENT, x=960, y=560, opacity=0
)
hero_sub.animate("opacity", {0: 0, 0.8: 0, 1.2: 1.0, 2.6: 1.0, 3.2: 0})
scene.add(hero_sub)

tagline = Text(
    "ZERO LOCK-IN.", font_size=20, font_family="'Space Mono', monospace",
    color=GRAY, x=960, y=600, opacity=0
)
tagline.animate("opacity", {0: 0, 1.2: 0, 1.6: 0.7, 2.6: 0.7, 3.2: 0})
scene.add(tagline)

# ═══════════════════════════════════════════
# PHASE 2: DATA BARS (3–8s) — Framework comparison
# ═══════════════════════════════════════════

section_label = Text(
    "SUPPORTED TECHNOLOGIES", font_size=16, font_family="'Space Mono', monospace",
    color=ACCENT, x=960, y=140, opacity=0
)
section_label.animate("opacity", {0: 0, 3.2: 0, 3.6: 1.0, 7.8: 1.0, 8.3: 0})
scene.add(section_label)

frameworks = [
    "GSAP", "THREE.JS", "CANVAS 2D", "WEBGL", "PYTHON", "SVG", "HTML / CSS"
]

bar_start_y = 220
bar_gap = 56
bar_max_width = 800
bar_x_start = 560

for i, name in enumerate(frameworks):
    y = bar_start_y + i * bar_gap
    delay = 3.4 + i * 0.15
    fade_out = 7.8

    label = Text(
        name, font_size=16, font_family="'Space Mono', monospace",
        font_weight="700", color=WHITE, x=420, y=y, opacity=0, text_align="right"
    )
    label.animate("opacity", {0: 0, delay: 0, delay + 0.3: 1.0, fade_out: 1.0, fade_out + 0.5: 0})
    scene.add(label)

    bar_bg = Shape(
        shape_type="rect", width=bar_max_width, height=36,
        fill="#1a1a2e", x=bar_x_start + bar_max_width // 2, y=y,
        opacity=0, border_radius=4
    )
    bar_bg.animate("opacity", {0: 0, delay: 0, delay + 0.2: 0.5, fade_out: 0.5, fade_out + 0.5: 0})
    scene.add(bar_bg)

    bar_fill = Shape(
        shape_type="rect", width=0, height=36,
        fill=ACCENT, x=bar_x_start + bar_max_width // 2, y=y,
        opacity=0, border_radius=4
    )
    bar_fill.animate("opacity", {0: 0, delay: 0, delay + 0.1: 0.9, fade_out: 0.9, fade_out + 0.5: 0})
    bar_fill.animate("width", {0: 0, delay: 0, delay + 0.8: bar_max_width, fade_out + 0.5: bar_max_width})
    scene.add(bar_fill)

    check = Text(
        "✓", font_size=20, font_family="'Space Mono', monospace",
        color=ACCENT, x=bar_x_start + bar_max_width + 40, y=y, opacity=0
    )
    check.animate("opacity", {0: 0, delay + 0.6: 0, delay + 0.8: 1.0, fade_out: 1.0, fade_out + 0.5: 0})
    scene.add(check)

# ═══════════════════════════════════════════
# PHASE 2b: REMOTION COMPARISON (5.5–8s)
# ═══════════════════════════════════════════

vs_label = Text(
    "vs REMOTION", font_size=16, font_family="'Space Mono', monospace",
    color=ORANGE, x=1500, y=140, opacity=0
)
vs_label.animate("opacity", {0: 0, 5.5: 0, 5.8: 1.0, 7.8: 1.0, 8.3: 0})
scene.add(vs_label)

remotion_status = [
    ("REACT ONLY", True),
    ("WRAPPER",    True),
    ("REACT ONLY", True),
    ("IMPOSSIBLE", False),
    ("IMPOSSIBLE", False),
    ("REACT ONLY", True),
    ("IMPOSSIBLE", False),
]

for i, (status, partial) in enumerate(remotion_status):
    y = bar_start_y + i * bar_gap
    delay = 5.8 + i * 0.12
    fade_out = 7.8

    color = ORANGE if partial else RED
    symbol = "⚠" if partial else "✗"

    marker = Text(
        symbol, font_size=22, font_family="'Space Mono', monospace",
        color=color, x=1460, y=y, opacity=0
    )
    marker.animate("opacity", {0: 0, delay: 0, delay + 0.2: 1.0, fade_out: 1.0, fade_out + 0.5: 0})
    scene.add(marker)

    status_text = Text(
        status, font_size=12, font_family="'Space Mono', monospace",
        color=color, x=1540, y=y, opacity=0
    )
    status_text.animate("opacity", {0: 0, delay: 0, delay + 0.3: 0.8, fade_out: 0.8, fade_out + 0.5: 0})
    scene.add(status_text)

# ═══════════════════════════════════════════
# PHASE 3: STATS (8.5–13s)
# ═══════════════════════════════════════════

stats = [
    ("RENDER TIME",   "< 12s",   "PER MINUTE OF VIDEO"),
    ("FRAMEWORKS",    "7",       "ZERO LOCK-IN"),
    ("DEPENDENCIES",  "0",       "BEYOND NODE + FFMPEG"),
    ("LINES OF CODE", "3",       "TO PRODUCE A VIDEO"),
]

stat_y = 300
stat_gap_x = 420

for i, (label, value, sub) in enumerate(stats):
    x = 280 + i * stat_gap_x
    delay = 8.5 + i * 0.3
    fade_out = 13.0

    stat_label = Text(
        label, font_size=12, font_family="'Space Mono', monospace",
        color=GRAY, x=x, y=stat_y - 60, opacity=0
    )
    stat_label.animate("opacity", {0: 0, delay: 0, delay + 0.3: 0.7, fade_out: 0.7, fade_out + 0.5: 0})
    scene.add(stat_label)

    stat_val = Text(
        value, font_size=72, font_family="'Archivo Black', Impact, sans-serif",
        font_weight="900", color=WHITE, x=x, y=stat_y, opacity=0
    )
    stat_val.animate("opacity", {0: 0, delay: 0, delay + 0.2: 1.0, fade_out: 1.0, fade_out + 0.5: 0})
    scene.add(stat_val)

    stat_sub = Text(
        sub, font_size=13, font_family="'Space Mono', monospace",
        color=ACCENT, x=x, y=stat_y + 50, opacity=0
    )
    stat_sub.animate("opacity", {0: 0, delay + 0.3: 0, delay + 0.6: 0.9, fade_out: 0.9, fade_out + 0.5: 0})
    scene.add(stat_sub)

div_line = Shape(
    shape_type="rect", width=0, height=2, fill=ACCENT,
    x=960, y=420, opacity=0
)
div_line.animate("opacity", {0: 0, 8.3: 0, 8.6: 0.6, 13.0: 0.6, 13.5: 0})
div_line.animate("width", {0: 0, 8.6: 0, 9.5: 1400, 13.5: 1400})
scene.add(div_line)

# ═══════════════════════════════════════════
# PHASE 3b: CODE SNIPPET (10–13s)
# ═══════════════════════════════════════════

code_lines = [
    ('from kino import Scene, Text', True),
    ('', False),
    ('scene = Scene(duration=10)', False),
    ('scene.add(Text("Hello, world."))', False),
    ('scene.render("output.mp4")', False),
]

code_y_start = 500
code_line_height = 32

for i, (line, is_import) in enumerate(code_lines):
    if not line:
        continue
    delay = 10.2 + i * 0.2
    fade_out = 13.0
    code_text = Text(
        line, font_size=18, font_family="'JetBrains Mono', 'Fira Code', monospace",
        color="#88ffcc" if is_import else "#ccccdd",
        x=960, y=code_y_start + i * code_line_height, opacity=0,
        text_align="center"
    )
    code_text.animate("opacity", {0: 0, delay: 0, delay + 0.15: 0.9, fade_out: 0.9, fade_out + 0.5: 0})
    scene.add(code_text)

thats_it = Text(
    "THAT'S IT.", font_size=16, font_family="'Space Mono', monospace",
    color=ACCENT, x=960, y=code_y_start + 6 * code_line_height + 20, opacity=0
)
thats_it.animate("opacity", {0: 0, 11.5: 0, 11.8: 1.0, 13.0: 1.0, 13.5: 0})
scene.add(thats_it)

# ═══════════════════════════════════════════
# PHASE 4: CLOSER (14–20s) — Brand statement
# ═══════════════════════════════════════════

closer_line1 = Text(
    "IF A BROWSER CAN RENDER IT", font_size=48,
    font_family="'Archivo Black', Impact, sans-serif",
    font_weight="900", color=WHITE, x=960, y=440, opacity=0
)
closer_line1.animate("opacity", {0: 0, 14.0: 0, 14.5: 1.0, 18.5: 1.0, 19.5: 0})
closer_line1.animate("y", {0: 480, 14.0: 480, 14.5: 440, 19.5: 440})
scene.add(closer_line1)

closer_line2 = Text(
    "KINO CAN RECORD IT.", font_size=48,
    font_family="'Archivo Black', Impact, sans-serif",
    font_weight="900", color=ACCENT, x=960, y=520, opacity=0
)
closer_line2.animate("opacity", {0: 0, 14.5: 0, 15.0: 1.0, 18.5: 1.0, 19.5: 0})
closer_line2.animate("y", {0: 560, 14.5: 560, 15.0: 520, 19.5: 520})
scene.add(closer_line2)

closer_accent = Shape(
    shape_type="rect", width=0, height=4, fill=ACCENT,
    x=960, y=570, opacity=0
)
closer_accent.animate("opacity", {0: 0, 15.0: 0, 15.2: 1.0, 18.5: 1.0, 19.5: 0})
closer_accent.animate("width", {0: 0, 15.2: 0, 16.0: 600, 19.5: 600})
scene.add(closer_accent)

punchline = Text(
    "python made this.", font_size=20, font_family="'Space Mono', monospace",
    color=GRAY, x=960, y=640, opacity=0
)
punchline.animate("opacity", {0: 0, 16.5: 0, 17.0: 0.6, 18.5: 0.6, 19.5: 0})
scene.add(punchline)

# ─── GENERATE ───
if __name__ == "__main__":
    import json
    from pathlib import Path
    from kino.codegen import generate_html

    out_dir = Path("./output")
    out_dir.mkdir(exist_ok=True)

    html = generate_html(scene)
    html_path = Path("./scene.html")
    html_path.write_text(html, encoding="utf-8")

    manifest = scene.to_manifest(output="./output/python-showcase.mp4")
    manifest["entry"] = "./scene.html"
    manifest_path = Path("./scene.json")
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(f"Scene: {scene.width}x{scene.height} @ {scene.fps}fps, {scene.duration}s")
    print(f"Elements: {len(scene.elements)}")
    print(f"\nRender: node ../../packages/core/dist/cli.js render scene.json")
