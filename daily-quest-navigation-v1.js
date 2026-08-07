(() => {
  "use strict";

  if (window.__salitaDailyQuestNavigationV1Installed) return;
  window.__salitaDailyQuestNavigationV1Installed = true;

  function retry() { window.setTimeout(install, 80); }

  function quickReviewLength() {
    const activity = document.getElementById("activityQuickLength");
    const home = document.getElementById("homeQuickReviewLength");
    const value = Number(activity?.value || home?.value || state?.settings?.quickReviewLength || 4);
    return Number.isFinite(value) && value > 0 ? value : 4;
  }

  function launchQuest(questId) {
    if (questId === "session") {
      startSession("daily");
      return;
    }
    if (questId === "correct" || questId === "review" || questId === "quick_twice") {
      startSession("quick", false, {length: quickReviewLength()});
    }
  }

  function decorateQuestRows() {
    const list = document.getElementById("dailyQuestList");
    if (!list || typeof DAILY_QUESTS === "undefined") return;
    const rows = [...list.querySelectorAll(".daily-quest")];
    rows.forEach((row, index) => {
      const quest = DAILY_QUESTS[index];
      if (!quest) return;
      row.dataset.questNavigationId = quest.id;
      row.setAttribute("role", "button");
      row.setAttribute("tabindex", "0");
      const destination = quest.id === "session" ? "Daily Session" : "Quick Review";
      row.setAttribute("aria-label", `${quest.title}. Open ${destination}.`);
      row.classList.add("daily-quest-navigable");
    });
  }

  function ensureStyles() {
    if (document.getElementById("dailyQuestNavigationStyles")) return;
    const style = document.createElement("style");
    style.id = "dailyQuestNavigationStyles";
    style.textContent = `
      .daily-quest-navigable{cursor:pointer;transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease}
      .daily-quest-navigable:hover{transform:translateY(-1px)}
      .daily-quest-navigable:focus-visible{outline:3px solid rgba(11,111,103,.28);outline-offset:2px}
      .daily-quest-navigable .daily-quest-copy strong::after{content:"  ›";color:#0b6f67;font-weight:900}
      @media(prefers-reduced-motion:reduce){.daily-quest-navigable{transition:none}.daily-quest-navigable:hover{transform:none}}
    `;
    document.head.appendChild(style);
  }

  function install() {
    try {
      if (typeof startSession !== "function" || typeof DAILY_QUESTS === "undefined") { retry(); return; }
    } catch { retry(); return; }

    ensureStyles();
    decorateQuestRows();

    document.addEventListener("click", event => {
      const row = event.target.closest(".daily-quest[data-quest-navigation-id]");
      if (!row || event.target.closest("button,a,select,input")) return;
      launchQuest(row.dataset.questNavigationId);
    });

    document.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const row = event.target.closest(".daily-quest[data-quest-navigation-id]");
      if (!row) return;
      event.preventDefault();
      launchQuest(row.dataset.questNavigationId);
    });

    const list = document.getElementById("dailyQuestList");
    if (list) new MutationObserver(decorateQuestRows).observe(list, {childList:true, subtree:false});
    document.addEventListener("salita:daily-quests-rendered", decorateQuestRows);
  }

  install();
})();
