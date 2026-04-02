export interface PreviewPageOptions {
  hasVideo: boolean;
  videoFilename: string | null;
  port: number;
}

/**
 * Builds the main preview page HTML.
 *
 * Layout:
 * - Video element (bottom layer) with overlay iframe on top
 * - Timeline scrubber bar
 * - Side panel with current time / frame info
 * - Keyboard shortcuts: arrow keys for frame stepping, space for play/pause
 */
export function buildPreviewPage(options: PreviewPageOptions): string {
  const { hasVideo, videoFilename, port } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>kino preview-live${videoFilename ? ` — ${videoFilename}` : ""}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: "SF Mono", "Cascadia Code", "JetBrains Mono", monospace;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      user-select: none;
    }

    /* Top bar */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #111;
      border-bottom: 1px solid #222;
      flex-shrink: 0;
    }
    .topbar .brand {
      font-weight: 700;
      color: #ff4444;
      font-size: 14px;
      letter-spacing: 0.5px;
    }
    .topbar .brand span { color: #666; font-weight: 400; }
    .topbar .status {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .topbar .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #333;
      transition: background 0.3s;
    }
    .topbar .dot.connected { background: #4caf50; }
    .topbar .dot.disconnected { background: #f44336; }

    /* Main content area */
    .main {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Preview viewport */
    .viewport {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      position: relative;
      overflow: hidden;
    }

    .preview-container {
      position: relative;
      /* Sized by JS to maintain aspect ratio */
    }

    .preview-container video {
      width: 100%;
      height: 100%;
      display: block;
      background: #111;
    }

    .preview-container iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      pointer-events: none;
      background: transparent;
    }

    .no-video {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #111;
      color: #444;
      font-size: 16px;
    }

    /* Side panel */
    .sidebar {
      width: 260px;
      background: #111;
      border-left: 1px solid #222;
      padding: 16px;
      flex-shrink: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sidebar h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 8px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .info-row .label { color: #888; }
    .info-row .value { color: #fff; font-variant-numeric: tabular-nums; }

    .shortcuts {
      margin-top: auto;
    }
    .shortcuts .key {
      display: inline-block;
      background: #222;
      border: 1px solid #333;
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 11px;
      margin-right: 4px;
    }
    .shortcuts p {
      margin: 4px 0;
      color: #666;
      font-size: 11px;
    }

    /* Timeline / scrubber */
    .timeline {
      background: #111;
      border-top: 1px solid #222;
      padding: 12px 16px;
      flex-shrink: 0;
    }

    .timeline-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .timeline .time-display {
      font-variant-numeric: tabular-nums;
      min-width: 100px;
      font-size: 12px;
      color: #aaa;
    }

    .timeline input[type="range"] {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 4px;
      background: #333;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    }
    .timeline input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ff4444;
      cursor: pointer;
    }

    .play-btn {
      background: none;
      border: 1px solid #444;
      color: #ccc;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
    }
    .play-btn:hover { border-color: #666; color: #fff; }

    /* Reload flash */
    .reload-flash {
      position: fixed;
      top: 48px;
      right: 16px;
      background: #ff444422;
      border: 1px solid #ff4444;
      color: #ff8888;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 11px;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      z-index: 100;
    }
    .reload-flash.visible { opacity: 1; }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="brand">kino <span>preview-live</span></div>
    <div class="status">
      <span id="ws-label">connecting...</span>
      <div class="dot" id="ws-dot"></div>
    </div>
  </div>

  <div class="main">
    <div class="viewport">
      <div class="preview-container" id="container">
        ${hasVideo
          ? `<video id="video" src="/video" preload="auto" muted></video>`
          : `<div class="no-video" id="video-placeholder">No source video</div>`
        }
        <iframe id="overlay" src="/overlay"></iframe>
      </div>
    </div>

    <div class="sidebar">
      <div>
        <h3>Time</h3>
        <div class="info-row">
          <span class="label">Current</span>
          <span class="value" id="info-time">0:00.000</span>
        </div>
        <div class="info-row">
          <span class="label">Frame</span>
          <span class="value" id="info-frame">0</span>
        </div>
        <div class="info-row">
          <span class="label">Duration</span>
          <span class="value" id="info-duration">--</span>
        </div>
      </div>

      <div>
        <h3>Source</h3>
        <div class="info-row">
          <span class="label">Video</span>
          <span class="value">${videoFilename || "none"}</span>
        </div>
        <div class="info-row">
          <span class="label">Reloads</span>
          <span class="value" id="info-reloads">0</span>
        </div>
      </div>

      <div class="shortcuts">
        <h3>Shortcuts</h3>
        <p><span class="key">Space</span> Play / Pause</p>
        <p><span class="key">\u2190</span> Previous frame</p>
        <p><span class="key">\u2192</span> Next frame</p>
        <p><span class="key">Home</span> Go to start</p>
        <p><span class="key">End</span> Go to end</p>
        <p><span class="key">R</span> Reload overlay</p>
      </div>
    </div>
  </div>

  <div class="timeline">
    <div class="timeline-row">
      <button class="play-btn" id="play-btn">\u25B6</button>
      <span class="time-display" id="time-display">0:00.000 / 0:00.000</span>
      <input type="range" id="scrubber" min="0" max="1000" value="0" step="1">
    </div>
  </div>

  <div class="reload-flash" id="reload-flash">Overlay reloaded</div>

  <script>
    const FPS = 30; // Assumed, could be read from manifest
    const FRAME_DURATION = 1 / FPS;

    // Elements
    const video = document.getElementById("video");
    const overlay = document.getElementById("overlay");
    const container = document.getElementById("container");
    const scrubber = document.getElementById("scrubber");
    const playBtn = document.getElementById("play-btn");
    const timeDisplay = document.getElementById("time-display");
    const infoTime = document.getElementById("info-time");
    const infoFrame = document.getElementById("info-frame");
    const infoDuration = document.getElementById("info-duration");
    const infoReloads = document.getElementById("info-reloads");
    const wsDot = document.getElementById("ws-dot");
    const wsLabel = document.getElementById("ws-label");
    const reloadFlash = document.getElementById("reload-flash");

    let isPlaying = false;
    let reloadCount = 0;
    const hasVideo = ${hasVideo};

    // Format time as M:SS.mmm
    function formatTime(seconds) {
      if (!isFinite(seconds)) return "--";
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return mins + ":" + secs.toFixed(3).padStart(6, "0");
    }

    function getDuration() {
      if (hasVideo && video && video.duration) return video.duration;
      return 30; // Default fallback
    }

    function getCurrentTime() {
      if (hasVideo && video) return video.currentTime;
      return 0;
    }

    function setCurrentTime(t) {
      if (hasVideo && video) {
        video.currentTime = Math.max(0, Math.min(t, getDuration()));
      }
    }

    // Update UI
    function updateUI() {
      const t = getCurrentTime();
      const d = getDuration();
      const frame = Math.round(t * FPS);

      timeDisplay.textContent = formatTime(t) + " / " + formatTime(d);
      infoTime.textContent = formatTime(t);
      infoFrame.textContent = String(frame);
      scrubber.value = String(Math.round((t / Math.max(d, 0.001)) * 1000));
    }

    // Video events
    if (hasVideo && video) {
      video.addEventListener("loadedmetadata", () => {
        infoDuration.textContent = formatTime(video.duration);
        updateUI();
      });

      video.addEventListener("timeupdate", updateUI);

      video.addEventListener("play", () => {
        isPlaying = true;
        playBtn.textContent = "\u23F8";
      });

      video.addEventListener("pause", () => {
        isPlaying = false;
        playBtn.textContent = "\u25B6";
      });
    }

    // Scrubber
    scrubber.addEventListener("input", () => {
      const ratio = parseInt(scrubber.value) / 1000;
      setCurrentTime(ratio * getDuration());
      updateUI();
    });

    // Play/Pause
    function togglePlay() {
      if (!hasVideo || !video) return;
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
    }
    playBtn.addEventListener("click", togglePlay);

    // Frame stepping
    function stepFrame(delta) {
      if (!hasVideo || !video) return;
      video.pause();
      setCurrentTime(getCurrentTime() + delta * FRAME_DURATION);
      updateUI();
    }

    // Reload overlay iframe
    function reloadOverlay() {
      overlay.src = "/overlay?t=" + Date.now();
      reloadCount++;
      infoReloads.textContent = String(reloadCount);

      // Flash notification
      reloadFlash.classList.add("visible");
      setTimeout(() => reloadFlash.classList.remove("visible"), 800);
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          stepFrame(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          stepFrame(1);
          break;
        case "Home":
          e.preventDefault();
          setCurrentTime(0);
          updateUI();
          break;
        case "End":
          e.preventDefault();
          setCurrentTime(getDuration());
          updateUI();
          break;
        case "KeyR":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            reloadOverlay();
          }
          break;
      }
    });

    // WebSocket hot-reload
    let ws;
    let reconnectTimer;

    function connectWS() {
      ws = new WebSocket("ws://localhost:${port}/ws");

      ws.onopen = () => {
        wsDot.className = "dot connected";
        wsLabel.textContent = "watching";
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "reload") {
            reloadOverlay();
          }
        } catch {}
      };

      ws.onclose = () => {
        wsDot.className = "dot disconnected";
        wsLabel.textContent = "disconnected";
        // Reconnect after 2s
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectWS, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connectWS();

    // Resize container to maintain aspect ratio
    function resizeContainer() {
      const viewport = container.parentElement;
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;

      // Default 16:9, or match video if loaded
      let aspectW = 16, aspectH = 9;
      if (hasVideo && video && video.videoWidth) {
        aspectW = video.videoWidth;
        aspectH = video.videoHeight;
      }

      const ratio = aspectW / aspectH;
      let w, h;
      if (vw / vh > ratio) {
        h = vh - 16;
        w = h * ratio;
      } else {
        w = vw - 16;
        h = w / ratio;
      }

      container.style.width = Math.round(w) + "px";
      container.style.height = Math.round(h) + "px";
    }

    window.addEventListener("resize", resizeContainer);
    if (hasVideo && video) {
      video.addEventListener("loadedmetadata", resizeContainer);
    }
    resizeContainer();
  </script>
</body>
</html>`;
}
