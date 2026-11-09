(() => {
  const film = document.querySelector('[data-workflow]');
  if (!film) return;
  const panels = [...film.querySelectorAll('.workflow-panel')];
  const tabs = [...film.querySelectorAll('[role="tab"]')];
  const play = film.querySelector('.workflow-play');
  const duration = 6500;
  let index = 0, playing = false, elapsed = 0, started = 0, timer = null, finished = false;

  function label() {
    play.setAttribute('aria-pressed', String(playing));
    play.innerHTML = playing ? '일시정지 <span aria-hidden="true">Ⅱ</span>' :
      `${finished ? '다시 보기' : elapsed ? '이어서 재생' : '재생'} <span aria-hidden="true">▶</span>`;
    film.dataset.playing = String(playing);
  }
  function pause() {
    if (playing) elapsed += performance.now() - started;
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
      if (index === panels.length - 1) {
        pause();
        elapsed = 0;
        finished = true;
        label();
        return;
      }
      select(index + 1, true);
      schedule();
    }, Math.max(0, duration - elapsed));
  }
  function seek(next, focus) {
    pause();
    finished = false;
    select(next);
    label();
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
  play.addEventListener('click', () => {
    if (playing) return pause();
    if (finished) { select(0, true); finished = false; }
    else if (!elapsed) select(index, true);
    playing = true;
    label();
    schedule();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) pause();
    }).observe(film);
  }
  select(0);
  label();
  film.querySelector('.workflow-controls').hidden = false;
})();
