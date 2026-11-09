(() => {
  "use strict";

  const dialog = document.getElementById("sla-image-viewer");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const viewport = dialog.querySelector(".sla-viewer-viewport");
  const image = dialog.querySelector(".sla-viewer-image");
  const status = dialog.querySelector(".sla-viewer-status");
  const controls = [...dialog.querySelectorAll("[data-zoom]")];
  const pointers = new Map();
  const maxScale = 4;
  let ready = false;
  let sequence = 0;
  let frame = 0;
  let trigger;
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
      dialog.querySelector(".sla-viewer-scale").value = `${Math.round(scale * 100)}%`;
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
    if (!ready) return;
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
    if (!ready) return;
    if (fitMode) fit();
    else {
      x += (width - oldWidth) / 2;
      y += (height - oldHeight) / 2;
      zoom(scale);
    }
    resetGesture();
  };
  new ResizeObserver(measure).observe(viewport);

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
  const open = async link => {
    if (dialog.open) return;
    trigger = link;
    const panel = link.closest(".sla-screen-panel");
    const source = panel.querySelector("img");
    const version = ++sequence;
    ready = false;
    image.hidden = true;
    status.hidden = false;
    status.textContent = "화면을 불러오는 중";
    viewport.setAttribute("aria-busy", "true");
    dialog.querySelector("#sla-viewer-title").textContent = `SLA · ${panel.querySelector("h3").textContent}`;
    dialog.querySelector(".sla-viewer-date").textContent = panel.querySelector(".screen-capture-note").textContent;
    dialog.querySelector(".sla-viewer-scale").value = "—";
    controls.forEach(button => { button.disabled = true; });
    restorePage = lockPage();
    dialog.showModal();
    measure();
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
      status.textContent = "화면을 불러오지 못했습니다 닫고 다시 열어주세요";
    }
    viewport.setAttribute("aria-busy", "false");
  };

  for (const link of document.querySelectorAll(".sla-screen-panel a")) {
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
  dialog.querySelector(".sla-viewer-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const stops = [...dialog.querySelectorAll('button:not(:disabled), [tabindex="0"]')];
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
    pointers.clear();
    resetGesture();
    cancelAnimationFrame(frame);
    frame = 0;
    image.removeAttribute("src");
    image.hidden = true;
    restorePage?.();
    trigger?.focus({ preventScroll: true });
  });
  for (const button of controls) {
    button.addEventListener("click", () => {
      if (!ready) return;
      if (button.dataset.zoom === "fit") fit();
      else zoom(button.dataset.zoom === "original" ? 1 : scale * (button.dataset.zoom === "in" ? 1.5 : 1 / 1.5));
    });
  }
  viewport.addEventListener("wheel", event => {
    if (!ready) return;
    event.preventDefault();
    const point = pointFor(event);
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1);
    zoom(scale * Math.exp(-clamp(delta, -250, 250) * .003), point.x, point.y);
  }, { passive: false });
  viewport.addEventListener("keydown", event => {
    if (!ready || event.ctrlKey || event.metaKey || event.altKey) return;
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
    if (!ready || event.button !== 0 || pointers.size >= 2) return;
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
