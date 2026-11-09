(() => {
  "use strict";

  const dialog = document.getElementById("screen-image-viewer");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const viewport = dialog.querySelector(".screen-viewer-viewport");
  const image = dialog.querySelector(".screen-viewer-image");
  const status = dialog.querySelector(".screen-viewer-status");
  const controls = [...dialog.querySelectorAll("[data-zoom]")];
  const playButton = dialog.querySelector("[data-video-play]");
  const replayButton = dialog.querySelector("[data-video-replay]");
  const help = dialog.querySelector("#screen-viewer-help");
  const imageHelp = help.textContent;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const screenTabs = [...dialog.querySelectorAll('.screen-viewer-tabs [role="tab"]')];
  const pointers = new Map();
  const maxScale = 4;
  let ready = false;
  let sequence = 0;
  let frame = 0;
  let trigger;
  let activePanel;
  let video = null;
  let restorePage;
  let gesture;
  let scale = 1;
  let x = 0;
  let y = 0;
  let width = 0;
  let height = 0;
  let fitMode = true;

  const fitScale = () => Math.min(width / image.naturalWidth, height / image.naturalHeight, 1);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const clampOffset = (offset, space, size) => size <= space ? (space - size) / 2 : clamp(offset, space - size, 0);
  const render = () => {
    x = clampOffset(x, width, image.naturalWidth * scale);
    y = clampOffset(y, height, image.naturalHeight * scale);
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      image.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      dialog.querySelector(".screen-viewer-scale").value = `${Math.round(scale * 100)}%`;
      viewport.dataset.pannable = String(scale > fitScale() + .001);
      for (const button of controls) {
        button.disabled = !ready || (button.dataset.zoom === "out" && scale <= fitScale() + .001)
          || (button.dataset.zoom === "in" && scale >= maxScale);
      }
    });
  };
  const fit = () => {
    fitMode = true;
    scale = fitScale();
    x = (width - image.naturalWidth * scale) / 2;
    y = (height - image.naturalHeight * scale) / 2;
    render();
  };
  const zoom = (next, anchorX = width / 2, anchorY = height / 2) => {
    if (!ready || video) return;
    next = clamp(next, fitScale(), maxScale);
    x = anchorX - (anchorX - x) * next / scale;
    y = anchorY - (anchorY - y) * next / scale;
    scale = next;
    fitMode = scale <= fitScale() + .001;
    render();
  };
  const resetGesture = () => {
    const points = [...pointers.values()];
    gesture = points.length ? {
      scale, x, y,
      midpoint: points.length > 1 ? { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 } : points[0],
      distance: points.length > 1 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0,
    } : null;
    viewport.dataset.dragging = String(points.length > 0);
  };
  const pointFor = event => {
    const rect = viewport.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top - viewport.clientTop };
  };
  const measure = () => {
    if (!dialog.open) return;
    const oldWidth = width;
    const oldHeight = height;
    width = viewport.clientWidth;
    height = viewport.clientHeight;
    if (!ready || video) return;
    if (fitMode) fit();
    else {
      x += (width - oldWidth) / 2;
      y += (height - oldHeight) / 2;
      zoom(scale);
    }
    resetGesture();
  };
  new ResizeObserver(measure).observe(viewport);

  const isCurrentVideo = current => video === current && dialog.open && !document.hidden;
  const updatePlayback = () => {
    playButton.textContent = video && !video.paused && !video.ended ? "일시정지" : "재생";
  };
  const stopVideo = () => {
    const previous = video;
    video = null;
    if (previous) {
      previous.pause();
      previous.removeAttribute("src");
      previous.load();
      previous.remove();
    }
    playButton.disabled = true;
    replayButton.disabled = true;
    updatePlayback();
  };
  const playVideo = current => {
    if (!isCurrentVideo(current)) return;
    current.play().then(() => {
      if (!isCurrentVideo(current)) current.pause();
    }).catch(error => {
      if (!isCurrentVideo(current) || error.name === "AbortError" || current.error) return;
      status.textContent = "재생 버튼을 눌러주세요";
      status.hidden = false;
      updatePlayback();
    });
  };
  const loadVideo = (source, version) => {
    const current = document.createElement("video");
    video = current;
    current.className = "screen-viewer-video";
    current.controls = true;
    current.defaultMuted = true;
    current.muted = true;
    current.playsInline = true;
    current.preload = "metadata";
    current.tabIndex = 0;
    current.poster = source.poster;
    current.setAttribute("aria-label", source.getAttribute("aria-label"));
    current.addEventListener("loadedmetadata", () => {
      if (version !== sequence || video !== current || !dialog.open) return;
      ready = true;
      viewport.setAttribute("aria-busy", "false");
      status.hidden = true;
      playButton.disabled = false;
      replayButton.disabled = false;
      if (!reducedMotion.matches && !navigator.connection?.saveData) playVideo(current);
    }, { once: true });
    current.addEventListener("play", () => {
      if (!isCurrentVideo(current)) { current.pause(); return; }
      status.hidden = true;
      updatePlayback();
    });
    for (const event of ["pause", "ended"]) current.addEventListener(event, () => {
      if (video === current) updatePlayback();
    });
    current.addEventListener("error", () => {
      if (version !== sequence || video !== current || !dialog.open) return;
      ready = false;
      viewport.setAttribute("aria-busy", "false");
      status.textContent = "영상을 불러오지 못했습니다 탭을 다시 눌러주세요";
      status.hidden = false;
      playButton.disabled = true;
      replayButton.disabled = true;
    });
    viewport.insertBefore(current, status);
    current.src = source.currentSrc || source.querySelector("source").src;
    current.load();
  };

  const lockPage = () => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const body = document.body;
    const saved = ["position", "top", "left", "width"].map(name => [name, body.style[name]]);
    body.style.position = "fixed";
    body.style.top = `${-scrollY}px`;
    body.style.left = `${-scrollX}px`;
    body.style.width = "100%";
    return () => {
      for (const [name, value] of saved) body.style[name] = value;
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
    };
  };
  const showScreen = async panel => {
    if (activePanel === panel && (ready || viewport.getAttribute("aria-busy") === "true")) return;
    activePanel = panel;
    const source = panel.querySelector("video, img");
    const isVideo = source.tagName === "VIDEO";
    const version = ++sequence;
    ready = false;
    stopVideo();
    cancelAnimationFrame(frame);
    frame = 0;
    for (const id of pointers.keys()) {
      if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id);
    }
    pointers.clear();
    resetGesture();
    for (const tab of screenTabs) {
      const selected = tab.dataset.panel === panel.id;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) {
        viewport.setAttribute("aria-labelledby", tab.id);
        const tabs = tab.parentElement;
        if (tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft = tab.offsetLeft - tabs.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2;
      }
    }
    const outerPanel = panel.closest(".screen-panel");
    if (outerPanel !== panel) document.getElementById(outerPanel.getAttribute("aria-labelledby")).click();
    document.getElementById(panel.getAttribute("aria-labelledby")).click();
    trigger = panel.querySelector(trigger.matches(".screen-image-link") ? ".screen-image-link" : ".screen-caption [data-viewer-open]") || panel.querySelector("[data-viewer-open]");
    image.hidden = true;
    image.removeAttribute("src");
    status.hidden = false;
    status.textContent = isVideo ? "영상을 불러오는 중" : "화면을 불러오는 중";
    viewport.dataset.media = isVideo ? "video" : "image";
    viewport.dataset.pannable = "false";
    viewport.setAttribute("aria-describedby", isVideo ? "screen-viewer-help" : "screen-viewer-help screen-viewer-keys");
    dialog.querySelector(".screen-viewer-image-tools").hidden = isVideo;
    dialog.querySelector(".screen-viewer-video-tools").hidden = !isVideo;
    dialog.querySelector(".screen-viewer-tools").setAttribute("aria-label", isVideo ? "영상 재생 조절" : "화면 확대 조절");
    help.textContent = isVideo ? "재생·일시정지 · 재생 막대로 이동" : imageHelp;
    viewport.setAttribute("aria-busy", "true");
    dialog.querySelector("#screen-viewer-title").textContent = panel.dataset.screenViewer;
    dialog.querySelector(".screen-viewer-date").textContent = panel.querySelector(".screen-capture-note")?.textContent || "개발·예시 데이터 포함";
    dialog.querySelector(".screen-viewer-scale").value = "—";
    controls.forEach(button => { button.disabled = true; });
    measure();
    if (isVideo) {
      loadVideo(source, version);
      return;
    }
    image.alt = source.alt;
    image.src = source.currentSrc || source.src;
    try {
      await image.decode();
      if (version !== sequence || !dialog.open) return;
      image.width = image.naturalWidth;
      image.height = image.naturalHeight;
      ready = true;
      fit();
      image.hidden = false;
      status.hidden = true;
    } catch {
      if (version !== sequence || !dialog.open) return;
      status.textContent = "화면을 불러오지 못했습니다 탭을 다시 눌러주세요";
    }
    viewport.setAttribute("aria-busy", "false");
  };
  const open = link => {
    if (dialog.open) return;
    trigger = link;
    restorePage = lockPage();
    dialog.showModal();
    document.dispatchEvent(new Event("platform-viewer-change"));
    showScreen(link.closest("[data-screen-viewer]"));
  };

  for (const tab of screenTabs) {
    const select = () => showScreen(document.getElementById(tab.dataset.panel));
    let touchStart;
    let lastTouch = -Infinity;
    // A browser may suppress the next click after a touch drag in the image.
    tab.addEventListener("pointerdown", event => {
      if (event.pointerType === "touch" && event.isPrimary) {
        touchStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }
    });
    tab.addEventListener("pointercancel", () => { touchStart = null; });
    tab.addEventListener("pointerup", event => {
      const start = touchStart;
      touchStart = null;
      if (!start || event.pointerId !== start.id || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) return;
      const rect = tab.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
      event.preventDefault();
      lastTouch = performance.now();
      tab.focus({ preventScroll: true });
      select();
    });
    tab.addEventListener("click", event => {
      if (event.detail > 0 && event.pointerType !== "mouse" && performance.now() - lastTouch < 750) return;
      select();
    });
    tab.addEventListener("keydown", event => {
      const index = screenTabs.indexOf(tab);
      let next;
      if (event.key === "ArrowRight") next = screenTabs[(index + 1) % screenTabs.length];
      if (event.key === "ArrowLeft") next = screenTabs[(index + screenTabs.length - 1) % screenTabs.length];
      if (event.key === "Home") next = screenTabs[0];
      if (event.key === "End") next = screenTabs[screenTabs.length - 1];
      if (!next) return;
      event.preventDefault();
      next.click();
      next.focus();
    });
  }

  for (const link of document.querySelectorAll("[data-viewer-open]")) {
    link.setAttribute("role", "button");
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-controls", dialog.id);
    link.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(link);
    });
    link.addEventListener("keydown", event => {
      if (event.key !== " ") return;
      event.preventDefault();
      open(link);
    });
  }
  dialog.querySelector(".screen-viewer-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", event => {
    // Native video controls manage their own keyboard focus inside the modal.
    if (event.key !== "Tab" || video) return;
    const stops = [...dialog.querySelectorAll('button:not(:disabled), [tabindex="0"]')].filter(element => element.getClientRects().length);
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  let backdropDown = false;
  dialog.addEventListener("pointerdown", event => { backdropDown = event.target === dialog; });
  dialog.addEventListener("click", event => {
    if (backdropDown && event.target === dialog) dialog.close();
    backdropDown = false;
  });
  dialog.addEventListener("close", () => {
    ++sequence;
    ready = false;
    activePanel = null;
    stopVideo();
    pointers.clear();
    resetGesture();
    cancelAnimationFrame(frame);
    frame = 0;
    image.removeAttribute("src");
    image.hidden = true;
    restorePage?.();
    trigger?.focus({ preventScroll: true });
    document.dispatchEvent(new Event("platform-viewer-change"));
  });
  playButton.addEventListener("click", () => {
    if (!ready || !video) return;
    if (video.paused || video.ended) playVideo(video);
    else video.pause();
  });
  replayButton.addEventListener("click", () => {
    if (!ready || !video) return;
    video.currentTime = 0;
    playVideo(video);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) video?.pause(); });
  window.addEventListener("pagehide", () => video?.pause());
  reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) video?.pause(); });
  for (const button of controls) {
    button.addEventListener("click", () => {
      if (!ready || video) return;
      if (button.dataset.zoom === "fit") fit();
      else zoom(button.dataset.zoom === "original" ? 1 : scale * (button.dataset.zoom === "in" ? 1.5 : 1 / 1.5));
    });
  }
  viewport.addEventListener("wheel", event => {
    if (!ready || video) return;
    event.preventDefault();
    const point = pointFor(event);
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1);
    zoom(scale * Math.exp(-clamp(delta, -250, 250) * .003), point.x, point.y);
  }, { passive: false });
  viewport.addEventListener("keydown", event => {
    if (!ready || video || event.ctrlKey || event.metaKey || event.altKey) return;
    if (["+", "="].includes(event.key)) zoom(scale * 1.5);
    else if (event.key === "-") zoom(scale / 1.5);
    else if (event.key === "0") fit();
    else if (event.key === "1") zoom(1);
    else if (event.key.startsWith("Arrow")) {
      if (event.key === "ArrowLeft") x += 60;
      if (event.key === "ArrowRight") x -= 60;
      if (event.key === "ArrowUp") y += 60;
      if (event.key === "ArrowDown") y -= 60;
      render();
    } else return;
    event.preventDefault();
  });
  viewport.addEventListener("pointerdown", event => {
    if (!ready || video || event.button !== 0 || pointers.size >= 2) return;
    viewport.focus({ preventScroll: true });
    viewport.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, pointFor(event));
    resetGesture();
  });
  viewport.addEventListener("pointermove", event => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, pointFor(event));
    const points = [...pointers.values()];
    if (points.length === 2 && gesture.distance > 0) {
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      scale = clamp(gesture.scale * distance / gesture.distance, fitScale(), maxScale);
      x = (points[0].x + points[1].x) / 2 - (gesture.midpoint.x - gesture.x) * scale / gesture.scale;
      y = (points[0].y + points[1].y) / 2 - (gesture.midpoint.y - gesture.y) * scale / gesture.scale;
      fitMode = scale <= fitScale() + .001;
    } else {
      x = gesture.x + points[0].x - gesture.midpoint.x;
      y = gesture.y + points[0].y - gesture.midpoint.y;
    }
    render();
  });
  const release = event => {
    if (!pointers.delete(event.pointerId)) return;
    resetGesture();
  };
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) viewport.addEventListener(type, release);
})();
