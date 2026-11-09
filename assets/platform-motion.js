(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const viewerOpen = () => document.getElementById('screen-image-viewer')?.open;
  const players = Array.from(document.querySelectorAll('.platform-video')).map(video => ({video, panel:video.closest('.screen-panel'), visible:false, started:false}));
  const update = () => {
    for (const player of players) {
      const {video,panel} = player;
      const enlarged = viewerOpen();
      if (enlarged && !panel.hidden) player.started = true;
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
      video.currentTime = 0;
      video.play().catch(() => {panel.querySelector('.video-error').hidden=false;});
    });
    video.addEventListener('play', () => {
      player.started=true;
      if (viewerOpen() || panel.hidden || document.hidden) { video.pause(); return; }
      panel.querySelector('.video-error').hidden=true;
    });
    const failed = () => {panel.querySelector('.video-error').hidden=false;};
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
