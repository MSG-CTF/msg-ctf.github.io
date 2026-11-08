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
    document.dispatchEvent(new Event("platform-screen-change"));
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

  const catalog = document.querySelector("[data-catalog]");
  if (catalog) {
    const isAuthors = catalog.dataset.catalog === "authors";
    const controls = catalog.querySelector(".catalog-controls");
    const buttons = Array.from(catalog.querySelectorAll("[data-category-filter]"));
    const input = catalog.querySelector('input[type="search"]');
    const items = Array.from(catalog.querySelectorAll(isAuthors ? ".author-card" : ".challenge-card"));
    const catalogStatus = catalog.querySelector("#catalog-status");
    const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase().trim();
    let category = "all";

    const update = (writeURL = true) => {
      const terms = normalize(input.value).split(/\s+/).filter(Boolean);
      const matches = (item) => (category === "all" || item.dataset.category === category)
        && terms.every((term) => normalize(item.dataset.search).includes(term));
      const slugs = new Set();
      let shown = 0;
      for (const item of items) {
        let visible;
        if (isAuthors) {
          let problems = 0;
          for (const row of item.querySelectorAll("li[data-slug]")) {
            row.hidden = !matches(row);
            if (!row.hidden) { problems += 1; slugs.add(row.dataset.slug); }
          }
          item.querySelector(".author-problem-count").textContent = `${problems}문제`;
          visible = problems > 0;
        } else {
          visible = matches(item);
        }
        item.hidden = !visible;
        if (visible) shown += 1;
      }
      for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset.categoryFilter === category));
      catalogStatus.textContent = isAuthors ? `출제자 ${shown}명 · ${slugs.size}문제` : `${category === "all" ? "전체" : category.toUpperCase()} ${shown}문제`;
      catalog.querySelector(".catalog-empty").hidden = shown > 0;
      if (writeURL) {
        const url = new URL(location.href);
        if (category === "all") url.searchParams.delete("category");
        else url.searchParams.set("category", category);
        if (input.value.trim()) url.searchParams.set("q", input.value.trim());
        else url.searchParams.delete("q");
        history.replaceState(null, "", url);
      }
    };
    const restore = () => {
      const params = new URLSearchParams(location.search);
      category = buttons.some((b) => b.dataset.categoryFilter === params.get("category")) ? params.get("category") : "all";
      input.value = (params.get("q") || "").slice(0, 200);
      update(false);
    };
    controls.hidden = false;
    controls.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-category-filter]");
      if (!button) return;
      category = button.dataset.categoryFilter;
      update();
    });
    input.addEventListener("input", () => update());
    catalog.querySelector("[data-catalog-reset]").addEventListener("click", () => {
      category = "all";
      input.value = "";
      update();
      input.focus();
    });
    window.addEventListener("popstate", restore);
    window.addEventListener("pageshow", restore);
    restore();
  }
})();
