(() => {
  "use strict";
  if (window.__salitaCalendarKeyRewardCopyV1Installed) return;
  window.__salitaCalendarKeyRewardCopyV1Installed = true;

  const QUEST_TOTAL = 4;
  const WEEKLY_KEY_TARGET = 5;
  let queued = false;

  function ensureDailyQuestNavigation() {
    if (window.__salitaDailyQuestNavigationV1Installed || document.querySelector('script[data-sq-daily-quest-navigation]')) return;
    const script = document.createElement("script");
    script.src = "./daily-quest-navigation-v1.js?v=1.0.0";
    script.dataset.sqDailyQuestNavigation = "true";
    script.onerror = () => console.warn("Daily Quest navigation shortcuts could not be loaded.");
    document.body.appendChild(script);
  }

  function localDayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  }

  function currentWeekCount() {
    try {
      const chest = state?.weeklyAvatarChest;
      const dates = Array.isArray(chest?.keyDates) ? chest.keyDates : [];
      const now = new Date();
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
      monday.setDate(monday.getDate() - ((monday.getDay()+6)%7));
      const keys = new Set(Array.from({length:7},(_,i)=>{
        const date = new Date(monday); date.setDate(monday.getDate()+i);
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
      }));
      return Math.min(WEEKLY_KEY_TARGET, dates.filter(date => keys.has(date)).length);
    } catch { return 0; }
  }

  function questState() {
    try {
      const activity = typeof ensureDailyActivity === "function" ? ensureDailyActivity() : state?.dailyActivity;
      const claimed = Array.isArray(activity?.questsClaimed) ? activity.questsClaimed : [];
      const total = Array.isArray(DAILY_QUESTS) ? DAILY_QUESTS.length : QUEST_TOTAL;
      const complete = total === QUEST_TOTAL && DAILY_QUESTS.every(quest => claimed.includes(quest.id));
      return {activity, claimed, total, complete};
    } catch {
      return {activity:null, claimed:[], total:QUEST_TOTAL, complete:false};
    }
  }

  function ensureStyles() {
    if (document.getElementById("calendarQuestUiFixStyles")) return;
    const style = document.createElement("style");
    style.id = "calendarQuestUiFixStyles";
    style.textContent = `
      .daily-quests-card{position:relative}
      .daily-quests-card .quest-card-header{position:relative}
      .daily-quest-collapse-toggle{appearance:none;border:1px solid rgba(11,111,103,.2);background:#f4faf7;color:#0b6f67;border-radius:999px;min-width:36px;height:36px;padding:0 10px;font:inherit;font-weight:900;cursor:pointer;display:inline-grid;place-items:center;line-height:1}
      .daily-quest-collapse-toggle:hover{background:#e8f5ef}.daily-quest-collapse-toggle:focus-visible{outline:3px solid rgba(11,111,103,.22);outline-offset:2px}
      .daily-quests-card.sq-quests-collapsed{padding-top:12px!important;padding-bottom:12px!important}
      .daily-quests-card.sq-quests-collapsed .daily-quest-list,.daily-quests-card.sq-quests-collapsed #questChest{display:none!important}
      .daily-quests-card.sq-quests-collapsed .quest-card-header{margin:0!important;align-items:center!important;min-height:40px!important}
      .daily-quests-card.sq-quests-collapsed .quest-card-header>div:first-child{display:flex!important;align-items:center!important;gap:10px!important;flex-wrap:wrap}
      .daily-quests-card.sq-quests-collapsed .quest-card-header .eyebrow{margin:0!important}
      .daily-quests-card.sq-quests-collapsed .quest-card-header h3{margin:0!important;font-size:1rem!important}
      .daily-quests-card.sq-quests-collapsed .quest-card-header p:not(.eyebrow){display:none!important}
      .daily-quests-card .calendar-detail-meter{display:grid!important;grid-template-columns:repeat(5,minmax(34px,1fr))!important;gap:12px!important;width:100%!important;max-width:360px!important;margin-top:12px!important}
      .daily-quests-card .calendar-detail-meter .weekly-key-slot{width:auto!important;min-width:34px!important;min-height:34px!important;margin:0!important;display:grid!important;place-items:center!important}
      @media(max-width:620px){
        .daily-quest-collapse-toggle{height:32px;min-width:32px;padding:0 8px}
        .daily-quests-card .calendar-detail-meter{grid-template-columns:repeat(5,minmax(30px,1fr))!important;gap:8px!important;max-width:none!important}
        .daily-quests-card .calendar-detail-meter .weekly-key-slot{min-width:30px!important;min-height:32px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureToggle(card) {
    const header = card.querySelector(".quest-card-header");
    if (!header) return null;
    let toggle = header.querySelector(".daily-quest-collapse-toggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "daily-quest-collapse-toggle";
      toggle.setAttribute("aria-label", "Collapse Daily Quests");
      toggle.addEventListener("click", () => {
        const collapsed = !card.classList.contains("sq-quests-collapsed");
        card.dataset.questManualState = collapsed ? "collapsed" : "expanded";
        card.dataset.questManualDay = localDayKey();
        card.classList.toggle("sq-quests-collapsed", collapsed);
        syncToggle(card, toggle);
      });
      header.appendChild(toggle);
    }
    return toggle;
  }

  function syncToggle(card, toggle) {
    const collapsed = card.classList.contains("sq-quests-collapsed");
    toggle.textContent = collapsed ? "⌄" : "⌃";
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    toggle.setAttribute("aria-label", collapsed ? "Open Daily Quests" : "Collapse Daily Quests");
  }

  function patchDailyQuests() {
    const card = document.querySelector(".daily-quests-card");
    if (!card) return;
    const {claimed, total, complete} = questState();
    const score = card.querySelector("#dailyQuestScore");
    if (score) score.textContent = `${Math.min(total, claimed.length)}/${QUEST_TOTAL}`;

    const heading = card.querySelector(".quest-card-header h3");
    const description = card.querySelector(".quest-card-header p:not(.eyebrow)");
    if (heading) heading.textContent = complete ? "Daily quests completed" : "4 small wins";
    if (description && !complete) description.textContent = "Short, meaningful goals keep practice focused without turning XP into the objective.";

    const toggle = ensureToggle(card);
    const today = localDayKey();
    if (card.dataset.questManualDay !== today) {
      delete card.dataset.questManualState;
      card.dataset.questManualDay = today;
    }

    if (complete && card.dataset.questManualState !== "expanded") {
      card.classList.add("sq-quests-collapsed");
    } else if (!complete && card.dataset.questManualState !== "collapsed") {
      card.classList.remove("sq-quests-collapsed");
    }
    if (toggle) syncToggle(card, toggle);
  }

  function patchRewardCopy() {
    document.querySelectorAll(".daily-key-celebration.reward-coordinator strong").forEach(node => {
      node.textContent = `${currentWeekCount()} of ${WEEKLY_KEY_TARGET} keys this week`;
    });
  }

  function patch() {
    ensureStyles();
    ensureDailyQuestNavigation();
    patchRewardCopy();
    patchDailyQuests();
  }

  function schedulePatch() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      patch();
    });
  }

  new MutationObserver(schedulePatch).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  document.addEventListener("salita:daily-quests-rendered", schedulePatch);
  window.addEventListener("pageshow", schedulePatch);
  patch();
})();
