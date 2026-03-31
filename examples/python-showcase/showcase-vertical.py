"""
kino Python Showcase — VERTICAL (9:16) native render
1080x1920, optimized layout for Reels/TikTok/Shorts
"""
from kino import Scene, Text, Shape
from kino.easing import ease_out_cubic, spring

scene = Scene(width=1080, height=1920, fps=30, duration=20, background="#0a0a0f")

ACCENT = "#00ff88"
WHITE = "#ffffff"
GRAY = "#666677"
ORANGE = "#ff6633"
RED = "#ff3333"

# ═══════════════════════════════════════════
# PHASE 1: HOOK (0–3s)
# ═══════════════════════════════════════════

accent_line = Shape(shape_type="rect", width=0, height=3, fill=ACCENT, x=540, y=900, opacity=0)
accent_line.animate("opacity", {0: 0, 0.3: 0, 0.35: 1.0, 2.6: 1.0, 3.2: 0})
accent_line.animate("width", {0: 0, 0.3: 0, 1.2: 900, 3.2: 900})
accent_line.animate("y", {0: 900, 0.3: 900, 1.2: 780, 3.2: 780})
scene.add(accent_line)

hero_num = Text("7", font_size=240, font_family="'Archivo Black', Impact, sans-serif",
    font_weight="900", color=WHITE, x=540, y=820, opacity=0)
hero_num.animate("opacity", {0: 0, 0.3: 0, 0.6: 1.0, 2.6: 1.0, 3.2: 0})
hero_num.animate("font_size", {0: 340, 0.3: 340, 0.8: 240, 3.2: 240})
scene.add(hero_num)

hero_sub = Text("FRAMEWORKS.\nONE RENDERER.", font_size=26, font_family="'Space Mono', monospace",
    color=ACCENT, x=540, y=940, opacity=0)
hero_sub.animate("opacity", {0: 0, 0.8: 0, 1.2: 1.0, 2.6: 1.0, 3.2: 0})
scene.add(hero_sub)

tagline = Text("ZERO LOCK-IN.", font_size=18, font_family="'Space Mono', monospace",
    color=GRAY, x=540, y=1010, opacity=0)
tagline.animate("opacity", {0: 0, 1.2: 0, 1.6: 0.7, 2.6: 0.7, 3.2: 0})
scene.add(tagline)

# ═══════════════════════════════════════════
# PHASE 2: DATA BARS (3–8s)
# ═══════════════════════════════════════════

section_label = Text("SUPPORTED TECHNOLOGIES", font_size=14, font_family="'Space Mono', monospace",
    color=ACCENT, x=540, y=350, opacity=0)
section_label.animate("opacity", {0: 0, 3.2: 0, 3.6: 1.0, 7.8: 1.0, 8.3: 0})
scene.add(section_label)

frameworks = ["GSAP", "THREE.JS", "CANVAS 2D", "WEBGL", "PYTHON", "SVG", "HTML / CSS"]
bar_start_y = 440
bar_gap = 80
bar_max_width = 600
bar_x_start = 240

for i, name in enumerate(frameworks):
    y = bar_start_y + i * bar_gap
    delay = 3.4 + i * 0.15
    fade_out = 7.8

    label = Text(name, font_size=14, font_family="'Space Mono', monospace",
        font_weight="700", color=WHITE, x=160, y=y, opacity=0, text_align="right")
    label.animate("opacity", {0: 0, delay: 0, delay + 0.3: 1.0, fade_out: 1.0, fade_out + 0.5: 0})
    scene.add(label)

    bar_bg = Shape(shape_type="rect", width=bar_max_width, height=40,
        fill="#1a1a2e", x=bar_x_start + bar_max_width // 2, y=y, opacity=0, border_radius=4)
    bar_bg.animate("opacity", {0: 0, delay: 0, delay + 0.2: 0.5, fade_out: 0.5, fade_out + 0.5: 0})
    scene.add(bar_bg)

    bar_fill = Shape(shape_type="rect", width=0, height=40,
        fill=ACCENT, x=bar_x_start + bar_max_width // 2, y=y, opacity=0, border_radius=4)
    bar_fill.animate("opacity", {0: 0, delay: 0, delay + 0.1: 0.9, fade_out: 0.9, fade_out + 0.5: 0})
    bar_fill.animate("width", {0: 0, delay: 0, delay + 0.8: bar_max_width, fade_out + 0.5: bar_max_width})
    scene.add(bar_fill)

    check = Text("✓", font_size=18, font_family="'Space Mono', monospace",
        color=ACCENT, x=bar_x_start + bar_max_width + 40, y=y, opacity=0)
    check.animate("opacity", {0: 0, delay + 0.6: 0, delay + 0.8: 1.0, fade_out: 1.0, fade_out + 0.5: 0})
    scene.add(check)

# Remotion comparison
vs_label = Text("vs REMOTION", font_size=14, font_family="'Space Mono', monospace",
    color=ORANGE, x=540, y=1060, opacity=0)
vs_label.animate("opacity", {0: 0, 5.5: 0, 5.8: 1.0, 7.8: 1.0, 8.3: 0})
scene.add(vs_label)

remotion_status = [
    ("⚠ REACT ONLY", ORANGE), ("⚠ WRAPPER", ORANGE), ("⚠ REACT ONLY", ORANGE),
    ("✗ IMPOSSIBLE", RED), ("✗ IMPOSSIBLE", RED), ("⚠ REACT ONLY", ORANGE), ("✗ IMPOSSIBLE", RED),
]

for i, (status, color) in enumerate(remotion_status):
    y = bar_start_y + i * bar_gap + 28
    delay = 5.8 + i * 0.12

    st = Text(status, font_size=11, font_family="'Space Mono', monospace",
        color=color, x=bar_x_start + bar_max_width // 2, y=y, opacity=0)
    st.animate("opacity", {0: 0, delay: 0, delay + 0.3: 0.8, 7.8: 0.8, 8.3: 0})
    scene.add(st)

# ═══════════════════════════════════════════
# PHASE 3: STATS (8.5–13s)
# ═══════════════════════════════════════════

stats = [
    ("RENDER TIME", "< 12s", "PER MINUTE OF VIDEO"),
    ("FRAMEWORKS", "7", "ZERO LOCK-IN"),
    ("DEPENDENCIES", "0", "BEYOND NODE + FFMPEG"),
    ("LINES OF CODE", "3", "TO PRODUCE A VIDEO"),
]

for i, (label, value, sub) in enumerate(stats):
    y = 500 + i * 180
    delay = 8.5 + i * 0.3

    Text_label = Text(label, font_size=12, font_family="'Space Mono', monospace",
        color=GRAY, x=540, y=y - 40, opacity=0)
    Text_label.animate("opacity", {0: 0, delay: 0, delay + 0.3: 0.7, 13.0: 0.7, 13.5: 0})
    scene.add(Text_label)

    Text_val = Text(value, font_size=64, font_family="'Archivo Black', Impact, sans-serif",
        font_weight="900", color=WHITE, x=540, y=y, opacity=0)
    Text_val.animate("opacity", {0: 0, delay: 0, delay + 0.2: 1.0, 13.0: 1.0, 13.5: 0})
    scene.add(Text_val)

    Text_sub = Text(sub, font_size=12, font_family="'Space Mono', monospace",
        color=ACCENT, x=540, y=y + 40, opacity=0)
    Text_sub.animate("opacity", {0: 0, delay + 0.3: 0, delay + 0.6: 0.9, 13.0: 0.9, 13.5: 0})
    scene.add(Text_sub)

# Code snippet
code_lines = [
    ('from kino import Scene, Text', True),
    ('scene = Scene(duration=10)', False),
    ('scene.add(Text("Hello, world."))', False),
    ('scene.render("output.mp4")', False),
]

for i, (line, is_import) in enumerate(code_lines):
    delay = 10.5 + i * 0.25
    ct = Text(line, font_size=15, font_family="'JetBrains Mono', monospace",
        color="#88ffcc" if is_import else "#ccccdd", x=540, y=1350 + i * 36, opacity=0)
    ct.animate("opacity", {0: 0, delay: 0, delay + 0.15: 0.9, 13.0: 0.9, 13.5: 0})
    scene.add(ct)

thats_it = Text("THAT'S IT.", font_size=14, font_family="'Space Mono', monospace",
    color=ACCENT, x=540, y=1530, opacity=0)
thats_it.animate("opacity", {0: 0, 11.8: 0, 12.0: 1.0, 13.0: 1.0, 13.5: 0})
scene.add(thats_it)

# ═══════════════════════════════════════════
# PHASE 4: CLOSER (14–20s)
# ═══════════════════════════════════════════

closer1 = Text("IF A BROWSER\nCAN RENDER IT", font_size=44,
    font_family="'Archivo Black', Impact, sans-serif", font_weight="900",
    color=WHITE, x=540, y=820, opacity=0)
closer1.animate("opacity", {0: 0, 14.0: 0, 14.5: 1.0, 18.5: 1.0, 19.5: 0})
scene.add(closer1)

closer2 = Text("KINO CAN\nRECORD IT.", font_size=44,
    font_family="'Archivo Black', Impact, sans-serif", font_weight="900",
    color=ACCENT, x=540, y=960, opacity=0)
closer2.animate("opacity", {0: 0, 14.5: 0, 15.0: 1.0, 18.5: 1.0, 19.5: 0})
scene.add(closer2)

closer_accent = Shape(shape_type="rect", width=0, height=4, fill=ACCENT,
    x=540, y=1030, opacity=0)
closer_accent.animate("opacity", {0: 0, 15.0: 0, 15.2: 1.0, 18.5: 1.0, 19.5: 0})
closer_accent.animate("width", {0: 0, 15.2: 0, 16.0: 500, 19.5: 500})
scene.add(closer_accent)

punchline = Text("python made this.", font_size=18, font_family="'Space Mono', monospace",
    color=GRAY, x=540, y=1100, opacity=0)
punchline.animate("opacity", {0: 0, 16.5: 0, 17.0: 0.6, 18.5: 0.6, 19.5: 0})
scene.add(punchline)

# ─── GENERATE ───
if __name__ == "__main__":
    import json
    from pathlib import Path
    from kino.codegen import generate_html

    Path("./output").mkdir(exist_ok=True)
    html = generate_html(scene)
    Path("./scene-vertical.html").write_text(html, encoding="utf-8")

    manifest = scene.to_manifest(output="./output/python-showcase-vertical.mp4")
    manifest["entry"] = "./scene-vertical.html"
    Path("./scene-vertical.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(f"Scene: {scene.width}x{scene.height} @ {scene.fps}fps, {scene.duration}s")
    print(f"Elements: {len(scene.elements)}")
    print(f"\nRender: node ../../packages/core/dist/cli.js render scene-vertical.json")
