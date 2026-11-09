(() => {
  const film = document.querySelector('[data-workflow]');
  if (!film) return;
  const panels = [...film.querySelectorAll('.workflow-panel')];
  const tabs = [...film.querySelectorAll('[role="tab"]')];
  const play = film.querySelector('.workflow-play');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 3000;
  let index = 0, playing = false, elapsed = 0, started = 0, timer = null;
  let inView = false, userControlled = false, wantsPlayback = !reducedMotion.matches;
  film.style.setProperty('--workflow-duration', `${duration}ms`);

  function label() {
    play.setAttribute('aria-pressed', String(playing));
    play.innerHTML = playing ? '일시정지 <span aria-hidden="true">Ⅱ</span>' :
      '재생 <span aria-hidden="true">▶</span>';
    film.dataset.playing = String(playing);
  }
  function pause() {
    if (playing) elapsed = Math.min(duration, elapsed + performance.now() - started);
    playing = false;
    clearTimeout(timer);
    timer = null;
    label();
  }
  function select(next, animate = false) {
    clearTimeout(timer);
    index = next;
    elapsed = 0;
    film.dataset.animated = 'false';
    panels.forEach((panel, i) => { panel.hidden = i !== index; });
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    if (animate) {
      void film.offsetWidth;
      film.dataset.animated = 'true';
    }
  }
  function schedule() {
    started = performance.now();
    timer = setTimeout(() => {
      select((index + 1) % panels.length, true);
      schedule();
    }, Math.max(0, duration - elapsed));
  }
  function syncPlayback() {
    if (!wantsPlayback || !inView || document.hidden) return pause();
    if (playing) return;
    if (!elapsed) select(index, true);
    playing = true;
    label();
    schedule();
  }
  function stopForReading() {
    userControlled = true;
    wantsPlayback = false;
    pause();
  }
  function seek(next, focus) {
    stopForReading();
    select(next);
    if (focus) tabs[next].focus();
  }
  panels.forEach((panel, i) => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabs[i].id);
  });
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => seek(i, false));
    tab.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? (i + 1) % tabs.length :
        event.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length :
        event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
      if (next === null) return;
      event.preventDefault();
      seek(next, true);
    });
  });
  film.addEventListener('focusin', event => {
    if (event.target.closest('.workflow-tabs, .workflow-source')) stopForReading();
  });
  play.addEventListener('click', () => {
    userControlled = true;
    wantsPlayback = !playing;
    if (wantsPlayback && !inView) {
      film.scrollIntoView({ block: 'center', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', syncPlayback);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) wantsPlayback = false;
    else if (!userControlled) wantsPlayback = true;
    syncPlayback();
  });

  select(0);
  label();
  film.querySelector('.workflow-controls').hidden = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting && entries[0].intersectionRatio >= .35;
      syncPlayback();
    }, { threshold: [0, .35], rootMargin: '-88px 0px -20px 0px' }).observe(film);
  } else {
    const updateVisibility = () => {
      const rect = film.getBoundingClientRect();
      const visible = Math.max(0, Math.min(rect.bottom, innerHeight - 20) - Math.max(rect.top, 88));
      inView = visible >= Math.min(rect.height, innerHeight - 108) * .35;
      syncPlayback();
    };
    addEventListener('scroll', updateVisibility, { passive: true });
    addEventListener('resize', updateVisibility);
    updateVisibility();
  }
})();
