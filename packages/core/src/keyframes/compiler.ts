/**
 * Scene Compiler
 *
 * Takes a SceneComposition JSON → generates a self-contained HTML page
 * that renders all scenes via Canvas 2D + the keyframe engine.
 *
 * The generated HTML page:
 * 1. Reads virtual time from performance.now() (patched by kino's time virtualization)
 * 2. Each rAF: finds active scenes → resolves keyframes → draws elements to canvas
 * 3. kino's Puppeteer pipeline captures frames as usual
 *
 * This is the bridge that connects the scene format (what agents generate)
 * to the render pipeline (what kino already does).
 */

import type { SceneComposition } from "./scene.js";

/**
 * Compile a SceneComposition into a self-contained HTML page.
 *
 * The page includes:
 * - Inlined easing library (no external dependencies)
 * - Inlined keyframe interpolation engine
 * - Inlined Canvas 2D element renderers
 * - The scene data as a JSON constant
 * - A rAF loop that draws each frame
 *
 * The page expects kino's time virtualization to control performance.now().
 */
export function compileScene(composition: SceneComposition): string {
  const { canvas } = composition;
  const sceneJSON = JSON.stringify(composition);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${canvas.width}px; height:${canvas.height}px; overflow:hidden; background:transparent; }
  canvas { position:absolute; top:0; left:0; display:block; }
</style>
</head>
<body>
<canvas id="c" width="${canvas.width}" height="${canvas.height}"></canvas>
<script>
// ═══════════════════════════════════════════════════════════════════════════
//  INLINED EASING LIBRARY
// ═══════════════════════════════════════════════════════════════════════════

const _easingCache = {};

function _powerIn(p) { return (t) => Math.pow(t, p); }
function _powerOut(p) { return (t) => 1 - Math.pow(1 - t, p); }
function _powerInOut(p) {
  return (t) => t < 0.5 ? Math.pow(2*t, p)/2 : 1 - Math.pow(2*(1-t), p)/2;
}

function _cubicBezier(x1, y1, x2, y2) {
  const cx = 3*x1, bx = 3*(x2-x1)-cx, ax = 1-cx-bx;
  const cy = 3*y1, by = 3*(y2-y1)-cy, ay = 1-cy-by;
  function sx(t) { return ((ax*t+bx)*t+cx)*t; }
  function sy(t) { return ((ay*t+by)*t+cy)*t; }
  function sdx(t) { return (3*ax*t+2*bx)*t+cx; }
  function solveT(x) {
    let t = x;
    for (let i=0; i<8; i++) {
      const err = sx(t)-x;
      if (Math.abs(err)<1e-7) return t;
      const d = sdx(t);
      if (Math.abs(d)<1e-7) break;
      t -= err/d;
    }
    let lo=0, hi=1; t=x;
    for (let i=0; i<20; i++) {
      const v = sx(t);
      if (Math.abs(v-x)<1e-7) return t;
      if (v<x) lo=t; else hi=t;
      t = (lo+hi)/2;
    }
    return t;
  }
  return (x) => { if(x<=0)return 0; if(x>=1)return 1; return sy(solveT(x)); };
}

const _EASE_PRESETS = {
  "linear": (t) => t,
  "ease": _cubicBezier(0.25,0.1,0.25,1),
  "ease-in": _cubicBezier(0.42,0,1,1),
  "ease-out": _cubicBezier(0,0,0.58,1),
  "ease-in-out": _cubicBezier(0.42,0,0.58,1),
  "power2.in": _powerIn(2), "power2.out": _powerOut(2), "power2.inOut": _powerInOut(2),
  "power3.in": _powerIn(3), "power3.out": _powerOut(3), "power3.inOut": _powerInOut(3),
  "power4.in": _powerIn(4), "power4.out": _powerOut(4), "power4.inOut": _powerInOut(4),
  "back.in": (t) => { const s=1.70158; return t*t*((s+1)*t-s); },
  "back.out": (t) => { const s=1.70158,q=t-1; return q*q*((s+1)*q+s)+1; },
  "elastic.out": (t) => {
    if(t===0||t===1) return t;
    return Math.pow(2,-10*t)*Math.sin((t-0.075)*(2*Math.PI)/0.3)+1;
  },
  "expo.out": (t) => t===1?1:1-Math.pow(2,-10*t),
  "sine.out": (t) => Math.sin((t*Math.PI)/2),
  "sine.in": (t) => 1-Math.cos((t*Math.PI)/2),
  "circ.out": (t) => Math.sqrt(1-(t-1)*(t-1)),
};

function _createEasing(spec) {
  if (!spec || spec === "linear") return _EASE_PRESETS.linear;
  if (_easingCache[spec]) return _easingCache[spec];
  if (_EASE_PRESETS[spec]) { _easingCache[spec] = _EASE_PRESETS[spec]; return _EASE_PRESETS[spec]; }
  const bm = spec.match(/^cubic-bezier\\(\\s*([\\d.+-]+)\\s*,\\s*([\\d.+-]+)\\s*,\\s*([\\d.+-]+)\\s*,\\s*([\\d.+-]+)\\s*\\)$/);
  if (bm) { const fn = _cubicBezier(+bm[1],+bm[2],+bm[3],+bm[4]); _easingCache[spec]=fn; return fn; }
  const sm = spec.match(/^step\\((\\d+)\\)$/);
  if (sm) { const n=+sm[1]; const fn=(t)=>Math.floor(t*n)/n; _easingCache[spec]=fn; return fn; }
  return _EASE_PRESETS.linear;
}

// ═══════════════════════════════════════════════════════════════════════════
//  INLINED KEYFRAME ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function _interpolate(kfs, time) {
  if (kfs.length === 0) return 0;
  if (kfs.length === 1) return kfs[0].value;
  if (time <= kfs[0].time) return kfs[0].value;
  if (time >= kfs[kfs.length-1].time) return kfs[kfs.length-1].value;
  for (let i=1; i<kfs.length; i++) {
    if (time <= kfs[i].time) {
      const prev=kfs[i-1], next=kfs[i];
      const dur = next.time-prev.time;
      if (dur<=0) return next.value;
      const t = (time-prev.time)/dur;
      const eased = _createEasing(next.easing||"linear")(t);
      return prev.value + (next.value-prev.value)*eased;
    }
  }
  return kfs[kfs.length-1].value;
}

function _resolve(element, time) {
  const r = {};
  for (const tl of element.animations||[]) {
    r[tl.property] = _interpolate(tl.keyframes, time);
  }
  return r;
}

// ═══════════════════════════════════════════════════════════════════════════
//  INLINED ELEMENT RENDERERS
// ═══════════════════════════════════════════════════════════════════════════

const _renderers = {};

_renderers.circle = (ctx, p, a) => {
  const cx=a.cx??p.cx??0, cy=a.cy??p.cy??0, r=a.r??p.r??50;
  ctx.save(); ctx.globalAlpha=a.opacity??1;
  ctx.beginPath(); ctx.arc(cx,cy,Math.max(0,r),0,Math.PI*2);
  if(p.fill&&p.fill!=="transparent"&&p.fill!=="none"){ctx.fillStyle=p.fill;ctx.fill();}
  if(p.stroke&&p.stroke!=="none"){ctx.strokeStyle=p.stroke;ctx.lineWidth=a.lineWidth??p.lineWidth??2;ctx.stroke();}
  if(a.glow>0){ctx.shadowColor=p.fill||p.stroke||"#fff";ctx.shadowBlur=a.glow;ctx.beginPath();ctx.arc(cx,cy,Math.max(0,r),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  ctx.restore();
};

_renderers.rect = (ctx, p, a) => {
  const x=a.x??p.x??0, y=a.y??p.y??0, w=a.width??p.width??100, h=a.height??p.height??100;
  const rot=a.rotation??0, rad=p.borderRadius??0;
  ctx.save(); ctx.globalAlpha=a.opacity??1;
  ctx.translate(x+w/2,y+h/2); ctx.rotate(rot*Math.PI/180); ctx.translate(-w/2,-h/2);
  ctx.beginPath(); rad>0?ctx.roundRect(0,0,w,h,rad):ctx.rect(0,0,w,h);
  if(p.fill&&p.fill!=="transparent"){ctx.fillStyle=p.fill;ctx.fill();}
  if(p.stroke&&p.stroke!=="none"){ctx.strokeStyle=p.stroke;ctx.lineWidth=a.lineWidth??p.lineWidth??2;ctx.stroke();}
  ctx.restore();
};

_renderers.line = (ctx, p, a) => {
  const x1=a.x1??p.x1??0,y1=a.y1??p.y1??0,x2=a.x2??p.x2??100,y2=a.y2??p.y2??100;
  const prog=Math.max(0,Math.min(1,a.progress??1));
  ctx.save(); ctx.globalAlpha=a.opacity??1;
  ctx.strokeStyle=p.stroke||"#fff"; ctx.lineWidth=a.lineWidth??p.lineWidth??2;
  ctx.lineCap=p.lineCap||"round"; ctx.beginPath();
  ctx.moveTo(x1,y1); ctx.lineTo(x1+(x2-x1)*prog,y1+(y2-y1)*prog); ctx.stroke();
  ctx.restore();
};

_renderers.text = (ctx, p, a) => {
  const x=a.x??p.x??0, y=a.y??p.y??0, sc=a.scale??1, rot=a.rotation??0;
  const fs=a.fontSize??p.fontSize??48;
  ctx.save(); ctx.globalAlpha=a.opacity??1;
  ctx.translate(x,y); ctx.scale(sc,sc); ctx.rotate(rot*Math.PI/180);
  ctx.font=(p.fontWeight||"900")+" "+fs+"px "+(p.fontFamily||"'Inter',system-ui,sans-serif");
  ctx.textAlign=p.align||"center"; ctx.textBaseline=p.baseline||"middle";
  if(p.strokeColor&&(a.strokeWidth??p.strokeWidth??0)>0){
    ctx.strokeStyle=p.strokeColor;ctx.lineWidth=a.strokeWidth??p.strokeWidth;ctx.lineJoin="round";ctx.miterLimit=2;ctx.strokeText(p.content||"",0,0);
  }
  ctx.fillStyle=p.color||"#fff"; ctx.fillText(p.content||"",0,0);
  ctx.restore();
};

_renderers.grid = (ctx, p, a) => {
  const sp=p.spacing??60, c=p.color||"rgba(255,255,255,0.08)";
  const w=p.width??ctx.canvas.width, h=p.height??ctx.canvas.height;
  ctx.save(); ctx.globalAlpha=a.opacity??1; ctx.strokeStyle=c; ctx.lineWidth=1;
  ctx.beginPath();
  for(let x=0;x<=w;x+=sp){ctx.moveTo(x,0);ctx.lineTo(x,h);}
  for(let y=0;y<=h;y+=sp){ctx.moveTo(0,y);ctx.lineTo(w,y);}
  ctx.stroke(); ctx.restore();
};

_renderers.dot = (ctx, p, a) => {
  const cx=a.x??p.x??0,cy=a.y??p.y??0,r=a.r??p.r??4;
  ctx.save(); ctx.globalAlpha=a.opacity??1;
  if((a.glow??p.glow??0)>0){ctx.shadowColor=p.color||"#fff";ctx.shadowBlur=a.glow??p.glow;}
  ctx.fillStyle=p.color||"#fff"; ctx.beginPath(); ctx.arc(cx,cy,Math.max(0,r),0,Math.PI*2); ctx.fill();
  ctx.restore();
};

_renderers.group = (ctx, p, a, t, el) => {
  ctx.save();
  ctx.globalAlpha *= (a.opacity??1);
  ctx.translate(a.x??p.x??0, a.y??p.y??0);
  ctx.scale(a.scale??1, a.scale??1);
  ctx.rotate((a.rotation??0)*Math.PI/180);
  if(el.children) el.children.forEach(c => _renderEl(ctx,c,t));
  ctx.restore();
};

_renderers.image = (ctx, p, a) => {
  if(!p._img) return;
  const x=a.x??p.x??0,y=a.y??p.y??0,w=a.width??p.width??200,h=a.height??p.height??200;
  const sc=a.scale??1,rot=a.rotation??0,rad=p.borderRadius??0;
  ctx.save(); ctx.globalAlpha=a.opacity??1;
  ctx.translate(x+w/2,y+h/2); ctx.scale(sc,sc); ctx.rotate(rot*Math.PI/180);
  if(rad>0){ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,rad);ctx.clip();}
  ctx.drawImage(p._img,-w/2,-h/2,w,h); ctx.restore();
};

function _renderEl(ctx, el, time) {
  const renderer = _renderers[el.type];
  if(!renderer) return;
  const a = _resolve(el, time);
  renderer(ctx, el.props||{}, a, time, el);
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCENE DATA + MAIN LOOP
// ═══════════════════════════════════════════════════════════════════════════

const COMP = ${sceneJSON};
const W = ${canvas.width}, H = ${canvas.height};
const cv = document.getElementById("c");
const ctx = cv.getContext("2d");

// Preload images
const _images = {};
function _preloadImages() {
  for (const scene of COMP.scenes) {
    for (const el of scene.elements||[]) {
      if (el.props && el.props.src && !_images[el.props.src]) {
        const img = new Image();
        img.src = el.props.src;
        _images[el.props.src] = img;
      }
    }
  }
}
_preloadImages();

function _setImageRefs(elements) {
  for (const el of elements) {
    if (el.props && el.props.src && _images[el.props.src]) {
      el.props._img = _images[el.props.src];
    }
    if (el.children) _setImageRefs(el.children);
  }
}

function update() {
  const t = performance.now() / 1000;
  ctx.clearRect(0, 0, W, H);

  // Find active scenes
  for (const scene of COMP.scenes) {
    if (t < scene.start || t >= scene.end) continue;

    // Scene background (for full-frame mode)
    if (scene.background && scene.mode === "full-frame") {
      ctx.fillStyle = scene.background;
      ctx.fillRect(0, 0, W, H);
    }

    // Set image refs
    _setImageRefs(scene.elements || []);

    // Render elements
    const localTime = t - scene.start;
    for (const el of scene.elements||[]) {
      _renderEl(ctx, el, localTime);
    }
  }

  requestAnimationFrame(update);
}
requestAnimationFrame(update);
</script>
</body>
</html>`;
}

/**
 * Compile a scene and write to a file path, returning a kino scene manifest.
 * This is the convenience function for the CLI pipeline.
 */
export function compileSceneManifest(
  composition: SceneComposition,
  entryPath: string
): {
  html: string;
  manifest: {
    version: string;
    canvas: { width: number; height: number; fps: number; duration: number; background: string };
    entry: string;
    audio: any[];
    render: { codec: string; quality: string; pixelFormat: string; output: string };
  };
} {
  const html = compileScene(composition);

  // Determine background: if any scene is full-frame, use transparent for overlay compositing
  const hasFullFrame = composition.scenes.some((s) => s.mode === "full-frame");
  const background = hasFullFrame ? "#000000" : "transparent";

  const manifest = {
    version: "1.0",
    canvas: {
      width: composition.canvas.width,
      height: composition.canvas.height,
      fps: composition.canvas.fps,
      duration: composition.canvas.duration,
      background,
    },
    entry: entryPath,
    audio: [],
    render: {
      codec: "h264",
      quality: "high",
      pixelFormat: "yuv420p",
      output: "./output.mp4",
    },
  };

  return { html, manifest };
}
