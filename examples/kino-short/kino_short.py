#!/usr/bin/env python3
"""
kino-short: Dynamic 9:16 short-form video pipeline

Input:  talking head MP4 (9:16, any resolution)
Output: polished short with animated captions + B-roll panels

Usage:  py kino_short.py <input.mp4> [output_name]
"""

import json
import os
import re
import subprocess
import sys
import urllib.parse
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
OUTPUT_DIR   = SCRIPT_DIR / "output"
OVERLAY_HTML = SCRIPT_DIR / "overlay.html"
SCENE_JSON   = SCRIPT_DIR / "scene.json"
KINO_CLI     = SCRIPT_DIR / "../../packages/core/dist/cli.js"

# ── Step 1: Transcribe ─────────────────────────────────────────────────────────
def transcribe(video_path: str) -> list[dict]:
    print("  Loading faster-whisper (base, CPU)...")
    from faster_whisper import WhisperModel
    model = WhisperModel("base", device="cpu", compute_type="int8")

    print("  Transcribing (this takes ~30-60s for a 26s clip)...")
    segments, info = model.transcribe(
        video_path,
        word_timestamps=True,
        beam_size=5,
        language="en"
    )

    words = []
    for seg in segments:
        for w in (seg.words or []):
            word = w.word.strip()
            if word:
                words.append({
                    "word":  word,
                    "start": round(w.start, 3),
                    "end":   round(w.end,   3)
                })

    return words


# ── Step 2: Analyze with Claude ────────────────────────────────────────────────
ANALYSIS_PROMPT = """You are an expert short-form video editor analyzing a talking head transcript.

Video duration: {duration:.1f}s
Full transcript: "{full_text}"

Word-level timings:
{timings}

Return ONLY a JSON object (no markdown, no explanation) with:

"caption_groups": Array covering the FULL duration. Each group:
  {{
    "words": ["word1", "word2"],   // 2-3 words max
    "start": 0.0,
    "end":   0.8,
    "emphasis_idx": 1             // index of key word (-1 if none)
  }}
  Rules:
  - Cover every word in the transcript, no gaps
  - 2 words for punchy moments, 3 for connective tissue
  - emphasis_idx marks the most impactful word (number, verb, brand name, etc.)
  - A new group starts on each natural breath/pause

"broll_segments": 2-4 B-roll panels to inject. Each:
  {{
    "start": 5.0,
    "end":   10.0,
    "type":  "stat_card" | "feature_list" | "terminal" | "platform_grid",
    "content": {{ ... }}
  }}
  Content schemas:
  - stat_card:     {{"number": "12s", "label": "avg render time"}}
  - feature_list:  {{"title": "WHAT KINO DOES", "items": ["renders any HTML", "frame-perfect timing", "one command"]}}
  - terminal:      {{"command": "kino render scene.json", "output": ["✔ 300 frames captured", "✔ MP4 ready — 2.1s"]}}
  - platform_grid: {{"title": "EVERY PLATFORM", "items": ["LinkedIn","X","Instagram","TikTok","YouTube","Threads"]}}
  Rules:
  - Show B-roll when speaker mentions something visual/demonstrable
  - Keep each segment 4-10 seconds
  - Don't overlap with intro or outro (first/last 2s)
  - Space them out — don't stack back to back

Return ONLY valid JSON."""


def analyze(words: list[dict], duration: float) -> dict:
    import anthropic

    full_text = " ".join(w["word"] for w in words)
    timings   = json.dumps(words, indent=2)

    client  = anthropic.Anthropic()
    message = client.messages.create(
        model      = "claude-opus-4-6",
        max_tokens = 4096,
        messages   = [{"role": "user", "content": ANALYSIS_PROMPT.format(
            duration  = duration,
            full_text = full_text,
            timings   = timings
        )}]
    )

    raw = message.content[0].text.strip()
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$',          '', raw)

    return json.loads(raw)


# ── Step 3: Generate kino scene HTML ───────────────────────────────────────────
def generate_html(video_path: str, analysis: dict, duration: float) -> str:
    caption_groups = analysis.get("caption_groups", [])
    broll_segments = analysis.get("broll_segments", [])

    captions_js = json.dumps(caption_groups)
    broll_js    = json.dumps(broll_segments)

    # Pure Canvas 2D — social media caption standard.
    # Magenta background keyed out by FFmpeg. Source video untouched.
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap" rel="stylesheet">
  <style>
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    html, body {{ width:1080px; height:1920px; overflow:hidden; background:#FF00FF !important; }}
    canvas {{ position:absolute; top:0; left:0; display:block; }}
  </style>
</head>
<body>
  <canvas id="c" width="1080" height="1920"></canvas>
  <script>
    const CAPTIONS = {captions_js};
    const BROLL    = {broll_js};

    const cv  = document.getElementById('c');
    const ctx = cv.getContext('2d');
    const W = 1080, H = 1920;

    const eOut3 = t => 1 - Math.pow(1 - t, 3);
    const eOut2 = t => 1 - Math.pow(1 - t, 2);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const prog  = (t, s, e) => clamp((t - s) / (e - s), 0, 1);

    const YELLOW = '#FFD700';
    const WHITE  = '#FFFFFF';

    // ═══════════════════════════════════════════════════════════════════════
    //  CAPTIONS — the main event (90% of the edit)
    //  Montserrat Black, white + yellow emphasis, stroked, pill background
    // ═══════════════════════════════════════════════════════════════════════
    function drawCaptions(t) {{
      let ci = -1;
      for (let i = 0; i < CAPTIONS.length; i++) {{
        if (t >= CAPTIONS[i].start && t < CAPTIONS[i].end + 0.12) {{ ci = i; break; }}
      }}
      if (ci < 0) return;

      const g      = CAPTIONS[ci];
      const fadeIn  = eOut2(prog(t, g.start, g.start + 0.09));
      const fadeOut = 1 - prog(t, g.end, g.end + 0.07);
      const alpha   = Math.min(fadeIn, fadeOut);
      const scale   = 0.88 + 0.12 * eOut3(prog(t, g.start, g.start + 0.13));
      const empIdx  = g.emphasis_idx;
      const yBase   = 1420;

      // Adaptive font sizing: fit within 960px
      let szReg  = 90;
      let szEmph = 104;

      // Measure at current size
      function measure(sr, se) {{
        let tw = 0;
        g.words.forEach((w, i) => {{
          ctx.font = `900 ${{i === empIdx ? se : sr}}px 'Montserrat', sans-serif`;
          tw += ctx.measureText(w + ' ').width;
        }});
        return tw;
      }}

      ctx.textBaseline = 'middle';
      let totalW = measure(szReg, szEmph);
      if (totalW > 960) {{
        const ratio = 960 / totalW;
        szReg  = Math.floor(szReg  * ratio);
        szEmph = Math.floor(szEmph * ratio);
        totalW = measure(szReg, szEmph);
      }}

      // Get individual word widths for layout
      const sizes = g.words.map((w, i) => {{
        ctx.font = `900 ${{i === empIdx ? szEmph : szReg}}px 'Montserrat', sans-serif`;
        return ctx.measureText(w + ' ').width;
      }});
      totalW = sizes.reduce((a, b) => a + b, 0);

      ctx.save();
      ctx.globalAlpha = alpha;

      // Scale from center of caption area
      ctx.translate(W / 2, yBase);
      ctx.scale(scale, scale);
      ctx.translate(-W / 2, -yBase);

      // Background pill
      const px = 32, py = 20;
      const pillH = Math.max(szReg, szEmph) + py * 2 + 20;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.roundRect(
        W / 2 - totalW / 2 - px,
        yBase - pillH / 2,
        totalW + px * 2,
        pillH,
        22
      );
      ctx.fill();

      // Draw each word
      let xc = W / 2 - totalW / 2;
      g.words.forEach((w, i) => {{
        const isE = i === empIdx;
        const sz  = isE ? szEmph : szReg;
        ctx.font = `900 ${{sz}}px 'Montserrat', sans-serif`;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';

        // Black stroke (outline) — readability on any background
        ctx.lineWidth   = 10;
        ctx.lineJoin    = 'round';
        ctx.miterLimit  = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.strokeText(w, xc, yBase);

        // Fill
        ctx.fillStyle = isE ? YELLOW : WHITE;
        ctx.fillText(w, xc, yBase);

        xc += sizes[i];
      }});

      ctx.restore();
    }}

    // ═══════════════════════════════════════════════════════════════════════
    //  FEATURE LIST — small checkmarks + text, top zone, no panel
    // ═══════════════════════════════════════════════════════════════════════
    function drawFeatureList(seg, t) {{
      const items = (seg.content && seg.content.items) || [];
      const lt = t - seg.start;

      items.forEach((item, i) => {{
        const delay = 0.25 + i * 0.45;
        if (lt < delay) return;
        const p = eOut3(prog(lt, delay, delay + 0.22));
        const a = eOut2(prog(lt, delay, delay + 0.16));
        const y = 110 + i * 76;
        if (y > 400) return;
        const slideY = (1 - p) * 28;

        ctx.save();
        ctx.globalAlpha = a;
        ctx.textBaseline = 'middle';

        // Checkmark
        ctx.font      = "900 38px 'Montserrat', sans-serif";
        ctx.fillStyle = YELLOW;
        ctx.textAlign = 'left';
        ctx.fillText('\u2713', 72, y + slideY);

        // Text with stroke
        ctx.font        = "800 38px 'Montserrat', sans-serif";
        ctx.lineWidth   = 6;
        ctx.lineJoin    = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText(item, 128, y + slideY);
        ctx.fillStyle   = WHITE;
        ctx.fillText(item, 128, y + slideY);

        ctx.restore();
      }});
    }}

    // ═══════════════════════════════════════════════════════════════════════
    //  PLATFORM ICONS — small branded circles, horizontal row, top zone
    // ═══════════════════════════════════════════════════════════════════════
    const BRAND = {{
      'YouTube':   {{ color:'#FF0000', sym:'\u25B6' }},
      'Instagram': {{ color:'#E4405F', sym:'\u2726' }},
      'TikTok':    {{ color:'#111111', sym:'\u266A' }},
      'LinkedIn':  {{ color:'#0A66C2', sym:'in'     }},
      'X':         {{ color:'#111111', sym:'X'      }},
      'Threads':   {{ color:'#111111', sym:'@'      }},
    }};

    function drawPlatformIcons(seg, t) {{
      const c     = seg.content || {{}};
      const items = c.items || [];
      const lt    = t - seg.start;
      const n     = items.length;
      const gap   = 105;
      const x0    = W / 2 - ((n - 1) * gap) / 2;

      // Icons
      items.forEach((name, i) => {{
        const delay = i * 0.10;
        if (lt < delay) return;
        const p  = eOut3(prog(lt, delay, delay + 0.18));
        const a  = eOut2(prog(lt, delay, delay + 0.14));
        const cx = x0 + i * gap;
        const cy = 180;
        const r  = 38 * (0.3 + 0.7 * p);

        const b = BRAND[name] || {{ color:'#333', sym:name[0] }};

        ctx.save();
        ctx.globalAlpha = a;

        // Circle fill with brand color
        ctx.fillStyle   = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur  = 14 * p;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // White ring
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Symbol
        const fz = b.sym.length > 1 ? 18 : 22;
        ctx.font         = `900 ${{fz}}px 'Montserrat', sans-serif`;
        ctx.fillStyle    = WHITE;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.sym, cx, cy + 1);

        ctx.restore();
      }});

      // Title below
      if (lt > 0.4) {{
        const ta = eOut2(prog(lt, 0.4, 0.6));
        ctx.save();
        ctx.globalAlpha   = ta;
        ctx.font          = "900 32px 'Montserrat', sans-serif";
        ctx.textAlign     = 'center';
        ctx.textBaseline  = 'middle';
        ctx.lineWidth     = 5;
        ctx.lineJoin      = 'round';
        ctx.strokeStyle   = 'rgba(0,0,0,0.8)';
        ctx.strokeText((c.title || '').toUpperCase(), W / 2, 250);
        ctx.fillStyle     = WHITE;
        ctx.fillText((c.title || '').toUpperCase(), W / 2, 250);
        ctx.restore();
      }}
    }}

    // ═══════════════════════════════════════════════════════════════════════
    //  TERMINAL BADGE — tiny floating snippet, top-right corner
    // ═══════════════════════════════════════════════════════════════════════
    function drawTerminal(seg, t) {{
      const c  = seg.content || {{}};
      const lt = t - seg.start;
      const a  = eOut2(prog(lt, 0, 0.22));
      if (a <= 0) return;

      const BW = 410, BH = 120;
      const BX = W - BW - 44;
      const BY = 56;

      ctx.save();
      ctx.globalAlpha = a * 0.88;

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      ctx.beginPath();
      ctx.roundRect(BX, BY, BW, BH, 14);
      ctx.fill();

      // Command (typewriter)
      const cmd   = '$ ' + (c.command || '');
      const chars = Math.min(cmd.length, Math.floor(lt / 0.048));
      ctx.font         = "bold 21px 'Montserrat', monospace";
      ctx.fillStyle    = YELLOW;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(cmd.substring(0, chars), BX + 14, BY + 12);

      // Output
      if (chars >= cmd.length) {{
        const outE = lt - cmd.length * 0.048 - 0.3;
        const outLines = c.output || [];
        const shown = outE > 0 ? Math.min(outLines.length, Math.ceil(outE / 0.4)) : 0;
        ctx.font      = "16px monospace";
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        outLines.slice(0, shown).forEach((line, li) => {{
          ctx.fillText(line, BX + 14, BY + 12 + 32 * (li + 1));
        }});
      }}

      ctx.restore();
    }}

    // ═══════════════════════════════════════════════════════════════════════
    //  B-ROLL DISPATCHER
    // ═══════════════════════════════════════════════════════════════════════
    function drawBroll(t) {{
      for (const seg of BROLL) {{
        if (t < seg.start || t > seg.end) continue;
        switch (seg.type) {{
          case 'feature_list':  drawFeatureList(seg, t);    break;
          case 'platform_grid': drawPlatformIcons(seg, t);  break;
          case 'terminal':      drawTerminal(seg, t);       break;
        }}
      }}
    }}

    // ═══════════════════════════════════════════════════════════════════════
    //  MAIN LOOP
    // ═══════════════════════════════════════════════════════════════════════
    function update() {{
      const t = performance.now() / 1000;
      ctx.clearRect(0, 0, W, H);
      drawBroll(t);
      drawCaptions(t);
      requestAnimationFrame(update);
    }}
    requestAnimationFrame(update);
  </script>
</body>
</html>"""


# ── Step 4: Render + composite ─────────────────────────────────────────────────
def render_and_composite(video_path: str, duration: float, output_name: str) -> Path:
    final_out  = OUTPUT_DIR / f"{output_name}.mp4"
    visual_out = OUTPUT_DIR / "visual.mp4"

    scene = {
        "version": "1.0",
        "name":    "kino-short",
        "canvas":  {"width": 1080, "height": 1920, "fps": 30, "duration": duration, "background": "#FF00FF"},
        "entry":   "./overlay.html",
        "audio":   [],
        "render":  {
            "codec":       "h264",
            "quality":     "high",
            "pixelFormat": "yuv420p",
            "output":      "./output/visual.mp4"
        },
        "warmup": 3
    }
    with open(SCENE_JSON, "w") as f:
        json.dump(scene, f, indent=2)

    print("  Running kino render...")
    result = subprocess.run(
        ["node", str(KINO_CLI.resolve()), "render", str(SCENE_JSON)],
        cwd=str(SCRIPT_DIR),
        capture_output=True, text=True, timeout=600
    )
    if result.returncode != 0 or not visual_out.exists():
        print("  kino render stderr:", result.stderr[-800:])
        raise RuntimeError("kino render failed")
    print(f"  ✔ visual.mp4 rendered ({visual_out.stat().st_size // 1024}KB)")

    # Colorkey composite — key out magenta, overlay on native source
    print("  Compositing (colorkey magenta -> native source)...")
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", str(visual_out),
        "-filter_complex",
        "[1:v]colorkey=color=0xFF00FF:similarity=0.25:blend=0.05[ov];"
        "[0:v][ov]overlay=0:0[vout]",
        "-map", "[vout]",
        "-map", "0:a:0",
        "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-g", "30",
        "-c:a", "copy",
        str(final_out)
    ]
    result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("  FFmpeg stderr:", result.stderr[-800:])
        raise RuntimeError("FFmpeg composite failed")
    print(f"  ✔ {final_out.name} ({final_out.stat().st_size // 1024}KB)")

    return final_out


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    args = sys.argv[1:]
    if not args:
        print("Usage: py kino_short.py <input.mp4> [output_name]")
        sys.exit(1)

    video_path  = args[0]
    output_name = args[1] if len(args) > 1 else "kino-short-final"

    if not Path(video_path).exists():
        print(f"File not found: {video_path}")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", video_path],
        capture_output=True, text=True
    )
    duration = float(json.loads(probe.stdout)["format"]["duration"])
    print(f"\nSource: {Path(video_path).name} | {duration:.1f}s | 1080x1920 | 30fps\n")

    # Step 1
    print("━━━ Step 1: Transcribe ━━━")
    transcript_path = OUTPUT_DIR / "transcript.json"
    if transcript_path.exists():
        print("  Using cached transcript.json")
        with open(transcript_path) as f:
            words = json.load(f)
        print(f"  ✔ {len(words)} words")
    else:
        words = transcribe(video_path)
        print(f"  ✔ {len(words)} words")
        with open(transcript_path, "w") as f:
            json.dump(words, f, indent=2)

    # Step 2
    print("\n━━━ Step 2: Analyze ━━━")
    analysis_path = OUTPUT_DIR / "analysis.json"
    if analysis_path.exists():
        print("  Using cached analysis.json")
        with open(analysis_path) as f:
            analysis = json.load(f)
    else:
        analysis = analyze(words, duration)
        with open(analysis_path, "w") as f:
            json.dump(analysis, f, indent=2)
    n_caps  = len(analysis.get("caption_groups", []))
    n_broll = len(analysis.get("broll_segments", []))
    print(f"  ✔ {n_caps} caption groups, {n_broll} B-roll segments")

    # Step 3
    print("\n━━━ Step 3: Generate overlay HTML ━━━")
    html = generate_html(video_path, analysis, duration)
    with open(OVERLAY_HTML, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  ✔ overlay.html written ({len(html)//1024}KB)")

    # Step 4
    print("\n━━━ Step 4: Render + composite ━━━")
    final = render_and_composite(video_path, duration, output_name)

    print(f"\n✔ Done! → {final}")
    print("  Run: start \"\" \"" + str(final) + "\"")


if __name__ == "__main__":
    main()
