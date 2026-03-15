/**
 * FrameForge Studio — Client Application
 */

(function () {
  "use strict";

  // --- State ---
  let ws = null;
  let info = { width: 1920, height: 1080, fps: 30, duration: 5, totalFrames: 150 };
  let currentFrame = 0;
  let isPlaying = false;
  let isSeeking = false;
  let isDragging = false;

  // --- DOM Elements ---
  const previewImg = document.getElementById("preview-img");
  const previewLoading = document.getElementById("preview-loading");
  const infoFrame = document.getElementById("info-frame");
  const infoTime = document.getElementById("info-time");
  const infoFps = document.getElementById("info-fps");
  const infoRes = document.getElementById("info-res");
  const infoStatus = document.getElementById("info-status");
  const fileName = document.getElementById("file-name");
  const timeline = document.getElementById("timeline");
  const timelineProgress = document.getElementById("timeline-progress");
  const timelineHandle = document.getElementById("timeline-handle");
  const timelineEnd = document.getElementById("timeline-end");
  const btnPlay = document.getElementById("btn-play");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnStart = document.getElementById("btn-start");
  const btnEnd = document.getElementById("btn-end");
  const btnRender = document.getElementById("btn-render");
  const renderOverlay = document.getElementById("render-overlay");
  const renderProgressFill = document.getElementById("render-progress-fill");
  const renderStatus = document.getElementById("render-status");

  // --- WebSocket ---
  function connect() {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${location.host}/ws`);

    ws.onopen = () => {
      infoStatus.textContent = "Connected";
      seekTo(0);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      handleServerMessage(msg);
    };

    ws.onclose = () => {
      infoStatus.textContent = "Disconnected";
      setTimeout(connect, 2000);
    };
  }

  function send(msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function handleServerMessage(msg) {
    switch (msg.type) {
      case "info":
        info = msg;
        updateInfo();
        break;

      case "frame":
        currentFrame = msg.frame;
        previewImg.src = "data:image/jpeg;base64," + msg.data;
        previewLoading.classList.remove("visible");
        isSeeking = false;
        updateUI();
        break;

      case "reload":
        infoStatus.textContent = "Reloading...";
        seekTo(currentFrame);
        setTimeout(() => {
          infoStatus.textContent = "Hot-reloaded";
          setTimeout(() => { infoStatus.textContent = ""; }, 2000);
        }, 500);
        break;

      case "playback:end":
        stopPlayback();
        break;

      case "render:start":
        renderOverlay.classList.add("visible");
        renderStatus.textContent = "Starting render...";
        renderProgressFill.style.width = "0%";
        break;

      case "render:progress":
        const pct = Math.round((msg.current / msg.total) * 100);
        renderProgressFill.style.width = pct + "%";
        renderStatus.textContent = `Frame ${msg.current} / ${msg.total} (${pct}%)`;
        break;

      case "render:complete":
        renderStatus.textContent = `Done: ${msg.output}`;
        setTimeout(() => {
          renderOverlay.classList.remove("visible");
        }, 2000);
        break;

      case "render:error":
        renderStatus.textContent = `Error: ${msg.message}`;
        setTimeout(() => {
          renderOverlay.classList.remove("visible");
        }, 4000);
        break;

      case "error":
        console.error("[Studio]", msg.message);
        break;
    }
  }

  // --- Seek ---
  function seekTo(frame) {
    if (isSeeking) return;
    isSeeking = true;
    previewLoading.classList.add("visible");
    send({ type: "seek", frame: Math.round(frame) });
  }

  // --- Playback ---
  function startPlayback() {
    if (isPlaying) return;
    isPlaying = true;
    btnPlay.textContent = "⏸";
    btnPlay.classList.add("playing");
    // Play from current frame, skip every other frame for speed
    send({ type: "play", from: currentFrame, to: info.totalFrames, step: 2 });
  }

  function stopPlayback() {
    isPlaying = false;
    btnPlay.textContent = "▶";
    btnPlay.classList.remove("playing");
  }

  // --- UI Updates ---
  function updateInfo() {
    infoFps.textContent = info.fps + " fps";
    infoRes.textContent = info.width + "×" + info.height;
    timelineEnd.textContent = formatTime(info.duration);
    fileName.textContent = info.width + "×" + info.height + " @ " + info.fps + "fps · " + info.duration + "s";
  }

  function updateUI() {
    const progress = info.totalFrames > 0 ? currentFrame / (info.totalFrames - 1) : 0;
    const time = currentFrame / info.fps;

    infoFrame.textContent = `Frame ${currentFrame} / ${info.totalFrames}`;
    infoTime.textContent = `${time.toFixed(2)}s / ${info.duration.toFixed(2)}s`;

    timelineProgress.style.width = (progress * 100) + "%";
    timelineHandle.style.left = (progress * 100) + "%";
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  // --- Timeline Interaction ---
  function getFrameFromTimelineX(clientX) {
    const rect = timeline.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (info.totalFrames - 1));
  }

  timeline.addEventListener("mousedown", (e) => {
    isDragging = true;
    if (isPlaying) stopPlayback();
    const frame = getFrameFromTimelineX(e.clientX);
    seekTo(frame);
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const frame = getFrameFromTimelineX(e.clientX);
    // Update UI immediately for responsiveness
    currentFrame = frame;
    updateUI();
    seekTo(frame);
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // --- Button Controls ---
  btnPlay.addEventListener("click", () => {
    if (isPlaying) stopPlayback();
    else startPlayback();
  });

  btnPrev.addEventListener("click", () => {
    if (isPlaying) stopPlayback();
    seekTo(Math.max(0, currentFrame - 1));
  });

  btnNext.addEventListener("click", () => {
    if (isPlaying) stopPlayback();
    seekTo(Math.min(info.totalFrames - 1, currentFrame + 1));
  });

  btnStart.addEventListener("click", () => {
    if (isPlaying) stopPlayback();
    seekTo(0);
  });

  btnEnd.addEventListener("click", () => {
    if (isPlaying) stopPlayback();
    seekTo(info.totalFrames - 1);
  });

  btnRender.addEventListener("click", () => {
    if (isPlaying) stopPlayback();
    send({ type: "render" });
  });

  // --- Keyboard Shortcuts ---
  document.addEventListener("keydown", (e) => {
    // Don't capture if user is typing in an input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        if (isPlaying) stopPlayback();
        else startPlayback();
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (isPlaying) stopPlayback();
        seekTo(Math.max(0, currentFrame - (e.shiftKey ? info.fps : 1)));
        break;
      case "ArrowRight":
        e.preventDefault();
        if (isPlaying) stopPlayback();
        seekTo(Math.min(info.totalFrames - 1, currentFrame + (e.shiftKey ? info.fps : 1)));
        break;
      case "Home":
        e.preventDefault();
        if (isPlaying) stopPlayback();
        seekTo(0);
        break;
      case "End":
        e.preventDefault();
        if (isPlaying) stopPlayback();
        seekTo(info.totalFrames - 1);
        break;
      case "r":
        if (e.ctrlKey || e.metaKey) break; // don't capture Cmd+R
        send({ type: "render" });
        break;
    }

    // Number keys 1-9 → jump to 10%-90%
    if (e.key >= "1" && e.key <= "9") {
      const pct = parseInt(e.key) / 10;
      seekTo(Math.round(pct * (info.totalFrames - 1)));
    }
  });

  // --- Initialize ---
  connect();
})();
