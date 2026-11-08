(() => {
  "use strict";

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
        if (visible) shown += 1;
      }
      status.textContent = `${button.textContent.trim()} · 저장소 ${shown}개`;
    });
  }
})();
