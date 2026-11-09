(() => {
  'use strict';
  const section = document.querySelector('.event-photos');
  if (!section) return;
  const rail = section.querySelector('.photo-reel');
  const track = section.querySelector('.photo-track');
  const cards = [...track.children];
  const links = cards.map(card => card.querySelector('a'));
  const controls = section.querySelector('.photo-controls');
  const motion = section.querySelector('.photo-motion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const viewer = document.getElementById('event-photo-viewer');
  const holder = viewer.querySelector('.photo-viewer-image');
  const state = viewer.querySelector('.photo-viewer-state');
  const retry = viewer.querySelector('[data-photo-retry]');
  let paused = !!navigator.connection?.saveData;
  let inView = false;
  let hovered = false;
  let focused = false;
  let frame = 0;
  let lastTime = 0;
  let position = 0;
  let span = 0;
  let index = 0;
  let trigger;
  let previousOverflow = '';
  let swipe = null;

  // The second set joins the loop visually; assistive technology sees six photos.
  for (const card of cards) {
    const copy = card.cloneNode(true);
    copy.dataset.copy = '';
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelector('a').tabIndex = -1;
    track.append(copy);
  }
  const measure = () => { span = track.children[cards.length].offsetLeft - cards[0].offsetLeft; };
  new ResizeObserver(measure).observe(track);
  measure();
  const stop = () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0; };
  const advance = time => {
    if (lastTime) position += Math.min(time - lastTime, 250) * .024;
    lastTime = time;
    if (span) position %= span;
    rail.scrollLeft = position;
    frame = requestAnimationFrame(advance);
  };
  const update = () => {
    motion.hidden = reduced.matches;
    motion.setAttribute('aria-pressed', String(paused));
    motion.setAttribute('aria-label', paused ? '사진 자동 넘김 켜기' : '사진 자동 넘김 멈추기');
    motion.querySelector('[data-photo-pause]').toggleAttribute('hidden', paused);
    motion.querySelector('[data-photo-play]').toggleAttribute('hidden', !paused);
    const playing = !paused && !reduced.matches && inView && !document.hidden && !hovered && !focused && !viewer.open;
    section.dataset.playing = String(playing);
    if (!playing) stop();
    else if (!frame) { position = rail.scrollLeft; frame = requestAnimationFrame(advance); }
  };
  const pause = () => { paused = true; update(); };
  motion.addEventListener('click', () => { paused = !paused; update(); });
  rail.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; update(); } });
  rail.addEventListener('pointerleave', () => { hovered = false; update(); });
  rail.addEventListener('pointerdown', pause, {passive: true});
  rail.addEventListener('wheel', pause, {passive: true});
  rail.addEventListener('focusin', () => { focused = true; update(); });
  rail.addEventListener('focusout', event => { focused = rail.contains(event.relatedTarget); update(); });
  for (const button of controls.querySelectorAll('[data-photo-step]')) {
    button.addEventListener('click', () => {
      pause();
      const direction = Number(button.dataset.photoStep);
      const step = cards[0].getBoundingClientRect().width + 28;
      let next = rail.scrollLeft + direction * step;
      if (next < 0) next += span;
      if (next >= span) { rail.scrollLeft -= span; next -= span; }
      rail.scrollTo({left: next, behavior: reduced.matches ? 'instant' : 'smooth'});
    });
  }
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); }, {threshold: .1}).observe(rail);
  reduced.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', update);
  controls.hidden = false;
  update();

  const clearImage = () => {
    const previous = holder.querySelector('img');
    if (previous) { previous.onload = null; previous.onerror = null; previous.removeAttribute('src'); }
    holder.replaceChildren();
  };
  const showPhoto = next => {
    index = (next + links.length) % links.length;
    clearImage();
    const source = links[index];
    viewer.querySelector('.photo-viewer-caption').textContent = cards[index].querySelector('figcaption span').textContent;
    viewer.querySelector('.photo-viewer-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(links.length).padStart(2, '0')}`;
    state.hidden = false;
    state.querySelector('p').textContent = '사진을 불러오는 중';
    retry.hidden = true;
    holder.setAttribute('aria-busy', 'true');
    const image = new Image();
    image.alt = source.querySelector('img').alt;
    image.draggable = false;
    image.decoding = 'async';
    image.onload = () => {
      if (!image.isConnected || !viewer.open) return;
      holder.setAttribute('aria-busy', 'false');
      state.hidden = true;
    };
    image.onerror = () => {
      if (!image.isConnected || !viewer.open) return;
      holder.setAttribute('aria-busy', 'false');
      state.querySelector('p').textContent = '사진을 불러오지 못했습니다';
      state.hidden = false;
      retry.hidden = false;
    };
    holder.append(image);
    image.src = source.href;
  };
  rail.addEventListener('click', event => {
    const link = event.target.closest('a[data-photo]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof viewer.showModal !== 'function') return;
    event.preventDefault();
    index = Number(link.dataset.photo);
    trigger = links[index];
    if (span && rail.scrollLeft >= span) rail.scrollLeft -= span;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    viewer.showModal();
    update();
    showPhoto(index);
    viewer.querySelector('.photo-viewer-close').focus({preventScroll: true});
  });
  viewer.querySelector('.photo-viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => {
    clearImage();
    state.hidden = true;
    swipe = null;
    document.body.style.overflow = previousOverflow;
    trigger?.focus({preventScroll: true});
    update();
  });
  for (const button of viewer.querySelectorAll('[data-viewer-step]')) {
    button.addEventListener('click', () => showPhoto(index + Number(button.dataset.viewerStep)));
  }
  viewer.addEventListener('keydown', event => {
    const next = {ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: links.length - 1}[event.key];
    if (next !== undefined) { event.preventDefault(); showPhoto(next); }
  });
  retry.addEventListener('click', () => showPhoto(index));
  const stage = viewer.querySelector('.photo-viewer-stage');
  stage.addEventListener('pointerdown', event => {
    swipe = event.isPrimary && event.pointerType === 'touch' ? {x: event.clientX, y: event.clientY} : null;
  }, {passive: true});
  stage.addEventListener('pointercancel', () => { swipe = null; });
  stage.addEventListener('pointerup', event => {
    if (!swipe) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) showPhoto(index + (dx < 0 ? 1 : -1));
  }, {passive: true});
})();
