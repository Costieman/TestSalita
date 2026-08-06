(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestPronounClarityDailyCollapseV1";
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  const normalise = value => String(value || "")
    .normalize("NFKC")
    .replace(/[“”‘’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();

  function clarifyPromptQualifiers() {
    if (typeof ITEMS === "undefined" || !Array.isArray(ITEMS)) return false;

    ITEMS.forEach(item => {
      const term = normalise(item?.term).replace(/[.!]$/g, "");
      if (term === "kumusta ka?") {
        item.meaning = "How are you? (one person)";
        item.natural = "How are you? (one person)";
        item.hint = "Ka means you when speaking to one person.";
      } else if (term === "kumusta kayo?") {
        item.meaning = "How are you? (several people / respectfully)";
        item.natural = "How are you? (several people / respectfully)";
        item.hint = "Kayo means you when speaking to several people, or respectfully to one person.";
      } else if (term === "magandang umaga po") {
        item.meaning = "Good morning (respectfully)";
        item.natural = "Good morning (respectfully)";
        item.hint = "Po makes the greeting respectful. Without po, Magandang umaga simply means Good morning.";
      }

      const tokens = item?.analysis?.tokens;
      if (!Array.isArray(tokens)) return;
      tokens.forEach(token => {
        if (!Array.isArray(token) || token.length < 2) return;
        const source = normalise(token[0]).replace(/[.,!?]$/g, "");
        if (source === "ka") token[1] = "you (singular)";
        if (source === "kayo") token[1] = "you (plural / respectful)";
        if (source === "po") token[1] = "respect marker";
      });
    });

    return true;
  }

  function cardIsComplete(card) {
    if (!card) return false;
    if (card.matches(".completed, .complete, .is-complete, .is-completed, .done, [data-completed='true'], [aria-checked='true']")) return true;
    const text = normalise(card.textContent);
    if (/\b(completed|complete|done)\b/.test(text)) return true;
    const progress = text.match(/\b(\d+)\s*\/\s*(\d+)\b/);
    return Boolean(progress && Number(progress[2]) > 0 && Number(progress[1]) >= Number(progress[2]));
  }

  function findQuestPanel(list) {
    let node = list?.parentElement;
    for (let depth = 0; node && node !== document.body && depth < 6; depth += 1, node = node.parentElement) {
      const text = normalise(node.textContent);
      if (text.includes("daily quest") && node.querySelector("#dailyQuestList")) return node;
    }
    return list?.parentElement || null;
  }

  function markCollapsibleChildren(panel, summary) {
    [...panel.children].forEach(element => {
      if (element !== summary) element.classList.add("sq-daily-quest-collapsible-content");
    });
  }

  function setPanelExpanded(panel, expanded) {
    const summary = panel.querySelector(":scope > .sq-daily-quest-summary");
    markCollapsibleChildren(panel, summary);
    panel.classList.toggle("sq-daily-quests-expanded", expanded);
    panel.classList.toggle("sq-daily-quests-collapsed", !expanded);
    summary?.setAttribute("aria-expanded", String(expanded));
    const icon = summary?.querySelector(".sq-daily-quest-chevron");
    if (icon) icon.textContent = expanded ? "▴" : "▾";
  }

  function collapseCompletedDailyQuests() {
    const list = document.getElementById("dailyQuestList");
    if (!list) return;
    const cards = [...list.querySelectorAll(".daily-quest")];
    if (!cards.length || !cards.every(cardIsComplete)) return;

    const panel = findQuestPanel(list);
    if (!panel) return;

    let summary = panel.querySelector(":scope > .sq-daily-quest-summary");
    if (!summary) {
      summary = document.createElement("button");
      summary.type = "button";
      summary.className = "sq-daily-quest-summary";
      summary.innerHTML = '<span><strong>Daily Quests</strong><span class="sq-daily-quest-status">Completed</span></span><span class="sq-daily-quest-chevron" aria-hidden="true">▾</span>';
      panel.insertBefore(summary, panel.firstChild);
      summary.addEventListener("click", () => {
        const expanded = summary.getAttribute("aria-expanded") === "true";
        setPanelExpanded(panel, !expanded);
      });
    }

    markCollapsibleChildren(panel, summary);
    if (!panel.classList.contains("sq-daily-quests-expanded")) setPanelExpanded(panel, false);
  }

  function ensureStyles() {
    let style = document.getElementById("sq-pronoun-daily-collapse-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "sq-pronoun-daily-collapse-style";
      document.head.appendChild(style);
    }
    style.textContent = `
      .sq-daily-quest-summary{width:100%;min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
      .sq-daily-quest-summary>span:first-child{display:flex;align-items:center;gap:10px;min-width:0}
      .sq-daily-quest-status{font-size:.9em;opacity:.72;white-space:nowrap}
      .sq-daily-quest-chevron{font-size:1.15em;line-height:1}
      .sq-daily-quests-collapsed{padding-top:0!important;padding-bottom:0!important;min-height:48px!important;max-height:64px!important;overflow:hidden!important}
      .sq-daily-quests-collapsed>.sq-daily-quest-collapsible-content{display:none!important}
      .sq-daily-quests-expanded>.sq-daily-quest-collapsible-content{display:revert}
    `;
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      clarifyPromptQualifiers();
      collapseCompletedDailyQuests();
    });
  }

  ensureStyles();
  clarifyPromptQualifiers();
  new MutationObserver(schedule).observe(document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true});
  document.addEventListener("salita:daily-quests-rendered", schedule);
  document.addEventListener("salita:exercise-rendered", schedule);
  document.addEventListener("DOMContentLoaded", schedule, {once:true});
  schedule();
})();
