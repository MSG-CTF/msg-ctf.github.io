(() => {
  "use strict";

  if (document.body.classList.contains("page-home") && ["#platform", "#architecture", "#contributors"].includes(location.hash)) {
    location.replace("platform.html" + location.hash);
    return;
  }

  const leaves = document.querySelector(".autumn-leaves");
  const motionToggle = document.querySelector(".motion-toggle");
  if (leaves && motionToggle) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let paused = false;
    let inView = false;
    const updateMotion = () => {
      leaves.dataset.playing = String(!paused && inView && !document.hidden && !reducedMotion.matches);
      motionToggle.hidden = reducedMotion.matches;
      motionToggle.setAttribute("aria-pressed", String(paused));
      motionToggle.setAttribute("aria-label", paused ? "낙엽 모션 재생" : "낙엽 모션 일시정지");
      motionToggle.querySelector("span").textContent = paused ? "모션 켜기" : "모션 끄기";
      motionToggle.querySelector(".pause-icon").toggleAttribute("hidden", paused);
      motionToggle.querySelector(".play-icon").toggleAttribute("hidden", !paused);
    };
    motionToggle.addEventListener("click", () => { paused = !paused; updateMotion(); });
    reducedMotion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateMotion);
    window.addEventListener("pageshow", updateMotion);
    window.addEventListener("pagehide", () => { leaves.dataset.playing = "false"; });
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateMotion();
    }).observe(leaves);
    updateMotion();
  }

  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const activate = (selected) => {
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
    }
  };
  for (const tab of tabs) {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (event) => {
      const index = tabs.indexOf(tab);
      let next;
      if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
      if (event.key === "ArrowLeft") next = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === "Home") next = tabs[0];
      if (event.key === "End") next = tabs[tabs.length - 1];
      if (!next) return;
      event.preventDefault();
      activate(next);
      next.focus();
    });
  }
  if (tabs.length) {
    activate(tabs[0]);
    document.querySelector(".screen-tabs").hidden = false;
  }

  const filters = document.querySelector(".repo-filters");
  const repositories = Array.from(document.querySelectorAll(".repository"));
  const status = document.getElementById("repo-status");
  if (filters) {
    filters.hidden = false;
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (!button) return;
      const category = button.dataset.filter;
      for (const option of filters.querySelectorAll("button")) {
        option.setAttribute("aria-pressed", String(option === button));
      }
      let shown = 0;
      for (const repository of repositories) {
        const visible = category === "all" || repository.dataset.category === category;
        repository.hidden = !visible;
        if (visible) shown += Number(repository.dataset.repoCount || 1);
      }
      status.textContent = `${button.textContent.trim()} · 저장소 ${shown}개`;
    });
  }

  const authorFilters = document.querySelector(".author-filters");
  if (authorFilters) {
    const categories = Array.from(document.querySelectorAll(".author-category"));
    const authorStatus = document.getElementById("author-status");
    authorFilters.hidden = false;
    authorFilters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-author-filter]");
      if (!button) return;
      for (const option of authorFilters.querySelectorAll("button")) {
        option.setAttribute("aria-pressed", String(option === button));
      }
      for (const section of categories) {
        section.hidden = button.dataset.authorFilter !== "all" && section.dataset.category !== button.dataset.authorFilter;
      }
      authorStatus.textContent = `${button.textContent.trim()} 분야 출제자를 표시합니다`;
    });
  }
})();
