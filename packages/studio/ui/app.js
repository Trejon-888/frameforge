/**
 * FrameForge Studio — Client Application v2
 * Phase 2: smooth scrubbing, keyboard overlay, export presets, console panel
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
  let layers = [];
  let selectedLayerIdx = -1;
  let seekDebounceTimer = null;
  let pendingSeekFrame = null;

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
  const shortcutOverlay = document.getElementById("shortcut-overlay");
  const consolePanel = document.getElementById("console-panel");
  const consoleList = document.getElementById("console-list");
  const exportSelect = document.getElementById("export-preset");

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
        // Process pending seek if user was scrubbing fast
        if (pendingSeekFrame !== null && pendingSeekFrame !== currentFrame) {
          var next = pendingSeekFrame;
          pendingSeekFrame = null;
          seekTo(next);
        }
        // Auto-fetch layers after seek (not during playback)
        if (!isPlaying) requestLayers();
        break;

      case "layers":
        renderLayers(msg.layers || []);
        break;

      case "reload":
        infoStatus.textContent = "Reloading...";
        logToConsole("info", "File changed — hot-reloading...");
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
        var pct = Math.round((msg.current / msg.total) * 100);
        renderProgressFill.style.width = pct + "%";
        renderStatus.textContent = "Frame " + msg.current + " / " + msg.total + " (" + pct + "%)";
        break;

      case "render:complete":
        renderStatus.textContent = "Done: " + msg.output;
        logToConsole("success", "Rendered to " + msg.output);
        setTimeout(() => { renderOverlay.classList.remove("visible"); }, 2000);
        break;

      case "render:error":
        renderStatus.textContent = "Error: " + msg.message;
        logToConsole("error", "Render failed: " + msg.message);
        setTimeout(() => { renderOverlay.classList.remove("visible"); }, 4000);
        break;

      case "error":
        logToConsole("error", msg.message);
        break;
    }
  }

  // --- Seek with debounce for smooth scrubbing ---
  function seekTo(frame) {
    var targetFrame = Math.max(0, Math.min(Math.round(frame), info.totalFrames - 1));
    if (isSeeking) {
      // Queue the seek — will fire after current seek completes
      pendingSeekFrame = targetFrame;
      return;
    }
    isSeeking = true;
    previewLoading.classList.add("visible");
    send({ type: "seek", frame: targetFrame });
  }

  function seekDebounced(frame) {
    var targetFrame = Math.max(0, Math.min(Math.round(frame), info.totalFrames - 1));
    // Update UI immediately
    currentFrame = targetFrame;
    updateUI();
    // Debounce actual seek
    clearTimeout(seekDebounceTimer);
    seekDebounceTimer = setTimeout(function() {
      seekTo(targetFrame);
    }, 50);
  }

  // --- Playback ---
  function startPlayback() {
    if (isPlaying) return;
    isPlaying = true;
    btnPlay.textContent = "⏸";
    btnPlay.classList.add("playing");
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
    var progress = info.totalFrames > 1 ? currentFrame / (info.totalFrames - 1) : 0;
    var time = currentFrame / info.fps;

    infoFrame.textContent = "Frame " + currentFrame + " / " + info.totalFrames;
    infoTime.textContent = time.toFixed(2) + "s / " + info.duration.toFixed(2) + "s";

    timelineProgress.style.width = (progress * 100) + "%";
    timelineHandle.style.left = (progress * 100) + "%";
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  // --- Console Panel ---
  function logToConsole(level, message) {
    if (!consoleList) return;
    var time = new Date().toLocaleTimeString();
    var div = document.createElement("div");
    div.className = "console-entry console-" + level;
    div.innerHTML = '<span class="console-time">' + time + '</span> ' + message;
    consoleList.appendChild(div);
    consoleList.scrollTop = consoleList.scrollHeight;
    // Keep max 50 entries
    while (consoleList.children.length > 50) {
      consoleList.removeChild(consoleList.firstChild);
    }
  }

  // --- Timeline Interaction ---
  function getFrameFromTimelineX(clientX) {
    var rect = timeline.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (info.totalFrames - 1));
  }

  timeline.addEventListener("mousedown", function(e) {
    isDragging = true;
    if (isPlaying) stopPlayback();
    var frame = getFrameFromTimelineX(e.clientX);
    seekTo(frame);
  });

  document.addEventListener("mousemove", function(e) {
    if (!isDragging) return;
    var frame = getFrameFromTimelineX(e.clientX);
    seekDebounced(frame);
  });

  document.addEventListener("mouseup", function() {
    isDragging = false;
  });

  // --- Button Controls ---
  btnPlay.addEventListener("click", function() {
    if (isPlaying) stopPlayback();
    else startPlayback();
  });

  btnPrev.addEventListener("click", function() {
    if (isPlaying) stopPlayback();
    seekTo(Math.max(0, currentFrame - 1));
  });

  btnNext.addEventListener("click", function() {
    if (isPlaying) stopPlayback();
    seekTo(Math.min(info.totalFrames - 1, currentFrame + 1));
  });

  btnStart.addEventListener("click", function() {
    if (isPlaying) stopPlayback();
    seekTo(0);
  });

  btnEnd.addEventListener("click", function() {
    if (isPlaying) stopPlayback();
    seekTo(info.totalFrames - 1);
  });

  // --- Export Presets ---
  if (btnRender) {
    btnRender.addEventListener("click", function() {
      if (isPlaying) stopPlayback();
      var preset = exportSelect ? exportSelect.value : "default";
      var renderOpts = {};

      switch (preset) {
        case "shorts":
          renderOpts = { width: 1080, height: 1920, fps: 30 };
          break;
        case "instagram":
          renderOpts = { width: 1080, height: 1080, fps: 30 };
          break;
        case "twitter":
          renderOpts = { width: 1280, height: 720, fps: 30 };
          break;
        case "4k":
          renderOpts = { width: 3840, height: 2160, fps: 30 };
          break;
        default:
          // Use scene defaults
          break;
      }

      logToConsole("info", "Starting render" + (preset !== "default" ? " (" + preset + ")" : "") + "...");
      send({ type: "render", preset: renderOpts });
    });
  }

  // --- Keyboard Shortcuts ---
  document.addEventListener("keydown", function(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

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
        if (e.ctrlKey || e.metaKey) break;
        btnRender.click();
        break;
      case "?":
        e.preventDefault();
        toggleShortcutOverlay();
        break;
      case "Escape":
        if (shortcutOverlay && shortcutOverlay.classList.contains("visible")) {
          shortcutOverlay.classList.remove("visible");
        }
        break;
    }

    // Number keys 1-9 → jump to 10%-90%
    if (e.key >= "1" && e.key <= "9" && !e.ctrlKey && !e.metaKey) {
      var pct = parseInt(e.key) / 10;
      seekTo(Math.round(pct * (info.totalFrames - 1)));
    }
  });

  function toggleShortcutOverlay() {
    if (!shortcutOverlay) return;
    shortcutOverlay.classList.toggle("visible");
  }

  // --- Layers Panel ---
  var layerList = document.getElementById("layer-list");
  var propertyList = document.getElementById("property-list");
  var btnRefreshLayers = document.getElementById("btn-refresh-layers");

  function requestLayers() {
    send({ type: "inspect" });
  }

  function renderLayers(newLayers) {
    layers = newLayers;
    if (!layerList) return;
    if (!layers.length) {
      layerList.innerHTML = '<div class="layer-empty">No layers detected</div>';
      return;
    }

    layerList.innerHTML = layers.map(function(layer, i) {
      var name = layer.id || layer.className || "<" + layer.tag + ">";
      var dim = layer.rect.width + "×" + layer.rect.height;
      var selected = i === selectedLayerIdx ? " selected" : "";
      return '<div class="layer-item' + selected + '" data-idx="' + i + '">' +
        '<div class="layer-icon ' + layer.tag + '"></div>' +
        '<span class="layer-name">' + name + '</span>' +
        '<span class="layer-dim">' + dim + '</span>' +
        '</div>';
    }).join("");

    layerList.querySelectorAll(".layer-item").forEach(function(el) {
      el.addEventListener("click", function() {
        selectedLayerIdx = parseInt(el.dataset.idx);
        renderLayers(layers);
        renderProperties(layers[selectedLayerIdx]);
      });
    });
  }

  function renderProperties(layer) {
    if (!propertyList) return;
    if (!layer) {
      propertyList.innerHTML = '<div class="prop-empty">Select a layer</div>';
      return;
    }

    var props = [
      ["tag", "<" + layer.tag + ">"],
      ["id", layer.id || "—"],
      ["class", layer.className || "—"],
      ["x", layer.rect.x + "px"],
      ["y", layer.rect.y + "px"],
      ["width", layer.rect.width + "px"],
      ["height", layer.rect.height + "px"],
      ["visible", layer.visible ? "yes" : "no"],
    ];

    propertyList.innerHTML = props.map(function(p) {
      return '<div class="prop-row"><span class="prop-key">' + p[0] + '</span><span class="prop-value">' + p[1] + '</span></div>';
    }).join("");
  }

  if (btnRefreshLayers) {
    btnRefreshLayers.addEventListener("click", requestLayers);
  }

  // --- Initialize ---
  logToConsole("info", "FrameForge Studio starting...");
  connect();
})();
