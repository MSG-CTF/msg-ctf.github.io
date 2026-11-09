(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const viewerOpen = () => document.getElementById('screen-image-viewer')?.open;
  const connection = navigator.connection;
  const compact = matchMedia('(max-width: 900px)').matches || connection?.saveData
    || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType);
  const players = Array.from(document.querySelectorAll('.platform-video')).map(video => {
    const source = video.querySelector('source');
    if (compact && source.dataset.compactSrc) {
      source.src = source.dataset.compactSrc;
      video.load();
    }
    video.dataset.playbackSrc = source.src;
    return {video, source, panel:video.closest('.screen-panel'), visible:false, started:false, suspended:false};
  });
  const update = () => {
    for (const player of players) {
      const {video,source,panel} = player;
      const enlarged = viewerOpen();
      if (enlarged && !panel.hidden) player.started = true;
      const suspended = !!enlarged || panel.hidden;
      if (suspended !== player.suspended) {
        player.suspended = suspended;
        video.pause();
        if (suspended) source.removeAttribute('src');
        else source.src = video.dataset.playbackSrc;
        // pause() and preload="none" alone can leave the download running.
        video.load();
      }
      const onScreen = player.visible && !panel.hidden && !document.hidden && !enlarged;
      if (!onScreen) {
        if (!video.paused) video.pause();
      } else if (!player.started && !reduced.matches && !navigator.connection?.saveData) {
        player.started = true;
        video.muted = true;
        video.play().catch(() => {});
      }
    }
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const player = players.find(item => item.video === entry.target);
      player.visible = entry.isIntersecting && entry.intersectionRatio >= .15;
    }
    update();
  }, {threshold:[0,.15]});
  for (const player of players) {
    const {video,panel} = player;
    const replay = panel.querySelector('.video-replay');
    replay.hidden = false;
    replay.addEventListener('click', () => {
      player.started = true;
      if (video.error) video.load();
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) video.currentTime = 0;
      video.play().catch(error => {
        if (error.name !== 'AbortError' && !viewerOpen() && !panel.hidden) panel.querySelector('.video-error').hidden=false;
      });
    });
    video.addEventListener('play', () => {
      player.started=true;
      if (viewerOpen() || panel.hidden || document.hidden) { video.pause(); return; }
      panel.querySelector('.video-error').hidden=true;
    });
    const failed = () => {if (!player.suspended) panel.querySelector('.video-error').hidden=false;};
    video.addEventListener('error',failed);
    video.querySelector('source').addEventListener('error',failed);
    observer.observe(video);
  }
  document.addEventListener('platform-screen-change',update);
  document.addEventListener('platform-viewer-change',update);
  document.addEventListener('visibilitychange',update);
  window.addEventListener('pagehide',()=>players.forEach(({video})=>video.pause()));
  reduced.addEventListener('change',()=>{
    if(reduced.matches) players.forEach(({video})=>video.pause());
    else update();
  });
})();
