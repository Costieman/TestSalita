(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestEvenProgressRailInstalled";
  const EDGE_INSET = 7;

  function ensureScript(flag, selector, src, datasetKey, message) {
    if (window[flag] || document.querySelector(selector)) return;
    const script = document.createElement("script");
    script.src = src;
    script.dataset[datasetKey] = "true";
    script.onerror = () => console.warn(message);
    document.body.appendChild(script);
  }

  function ensureTranslationGlossCompletion() {
    ensureScript("__salitaQuestTranslationGlossCompletionV1", 'script[data-sq-translation-gloss-completion]', "./translation-gloss-completion-v1.js?v=1.0.2", "sqTranslationGlossCompletion", "Word-by-word translation glosses could not be loaded.");
  }

  function ensureWordBreakdownCleanup() {
    ensureScript("__salitaQuestWordBreakdownCleanupV1", 'script[data-sq-word-breakdown-cleanup]', "./word-breakdown-cleanup-v1.js?v=1.0.1", "sqWordBreakdownCleanup", "Vocabulary word-by-word cleanup could not be loaded.");
  }

  function ensurePronounClarityAndQuestCollapse() {
    ensureScript("__salitaQuestPronounClarityDailyCollapseV1", 'script[data-sq-pronoun-daily-collapse]', "./pronoun-clarity-daily-quest-collapse-v1.js?v=1.0.1", "sqPronounDailyCollapse", "Pronoun clarity and Daily Quest collapse could not be loaded.");
  }

  function ensurePromptDistinctionClarity() {
    ensureScript("__salitaQuestPromptDistinctionClarityV1", 'script[data-sq-prompt-distinction-clarity]', "./prompt-distinction-clarity-v1.js?v=1.0.0", "sqPromptDistinctionClarity", "Prompt distinction clarity could not be loaded.");
  }

  function retry() {
    window.setTimeout(install, 70);
  }

  function install() {
    try {
      if (
        typeof MODULES === "undefined" ||
        typeof renderMasteryRail !== "function" ||
        typeof totalLearningPoints !== "function"
      ) {
        retry();
        return;
      }
    } catch {
      retry();
      return;
    }

    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;

    function visualProgress(points, milestones) {
      if (!milestones.length) return 100;
      const nextIndex = milestones.findIndex(module => points < module.unlockAt);
      if (nextIndex < 0) return 100;
      const previousUnlock = nextIndex === 0 ? 0 : milestones[nextIndex - 1].unlockAt;
      const nextUnlock = milestones[nextIndex].unlockAt;
      const start = nextIndex / milestones.length * 100;
      const end = (nextIndex + 1) / milestones.length * 100;
      const ratio = nextUnlock > previousUnlock
        ? Math.max(0, Math.min(1, (points - previousUnlock) / (nextUnlock - previousUnlock)))
        : 1;
      return start + (end - start) * ratio;
    }

    function applyEvenSpacing() {
      const host = document.getElementById("masteryMilestones");
      if (!host) return;
      const milestones = MODULES.filter((module, index) => index > 0);
      const nodes = [...host.querySelectorAll(".mastery-milestone")];
      const count = nodes.length;
      const points = totalLearningPoints();
      const nextIndex = milestones.findIndex(module => points < module.unlockAt);
      const usableWidth = 100 - EDGE_INSET * 2;

      nodes.forEach((node, index) => {
        const number = index + 2;
        const ratio = count > 1 ? index / (count - 1) : .5;
        const position = EDGE_INSET + ratio * usableWidth;
        node.style.left = `${position}%`;
        node.dataset.evenMilestone = String(number);
        node.classList.remove("progress-complete", "progress-approaching", "progress-future");
        node.classList.add(
          points >= milestones[index]?.unlockAt
            ? "progress-complete"
            : index === nextIndex
              ? "progress-approaching"
              : "progress-future"
        );
        const dot = node.querySelector(".mastery-dot");
        if (dot) dot.textContent = String(number);
      });

      const progress = visualProgress(points, milestones);
      const fill = host.querySelector(".mastery-track-fill");
      const marker = host.querySelector(".mastery-you");
      if (fill) fill.style.width = `${progress}%`;
      if (marker) marker.style.left = `${progress}%`;
      host.style.setProperty("--world-progress", `${progress}%`);
      host.dataset.evenSpacing = "true";
    }

    function makeDailyQuestsActionable() {
      if (typeof DAILY_QUESTS === "undefined") return;
      const list = document.getElementById("dailyQuestList");
      if (!list) return;
      [...list.querySelectorAll(".daily-quest")].forEach((card, index) => {
        const quest = DAILY_QUESTS[index];
        if (!quest) return;
        card.dataset.questAction = quest.id === "session" ? "daily" : "quick";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", `${quest.title}. Open ${quest.id === "session" ? "Daily Session" : "Quick Review"}.`);
      });
    }

    function openQuestTarget(card) {
      if (!card || typeof startSession !== "function") return;
      startSession(card.dataset.questAction === "daily" ? "daily" : "quick");
    }

    document.addEventListener("click", event => {
      const card = event.target.closest("#dailyQuestList .daily-quest[data-quest-action]");
      if (card) openQuestTarget(card);
    });

    document.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("#dailyQuestList .daily-quest[data-quest-action]");
      if (!card) return;
      event.preventDefault();
      openQuestTarget(card);
    });

    function suppressDuplicateKeyDuringFlight() {
      let timer = 0;
      const keepTargetEmpty = () => {
        const award = document.querySelector(".daily-key-award");
        if (!award) {
          window.clearInterval(timer);
          timer = 0;
          return;
        }
        const label = document.querySelector(".daily-key-celebration-banner strong")?.textContent || "";
        const count = Math.max(1, Number(label.match(/^(\d+)/)?.[1] || 1));
        const target = document.querySelector(`.weekly-key-slot:nth-child(${count})`);
        if (target) {
          target.textContent = "";
          target.classList.remove("collected", "key-arrival");
          target.classList.add("pending-key-arrival");
        }
      };

      const observer = new MutationObserver(() => {
        if (!document.querySelector(".daily-key-award") || timer) return;
        keepTargetEmpty();
        timer = window.setInterval(keepTargetEmpty, 50);
      });
      observer.observe(document.body, {childList:true, subtree:true});
    }

    const baseRenderMasteryRail = renderMasteryRail;
    renderMasteryRail = function renderMasteryRailWithEvenMilestones() {
      const result = baseRenderMasteryRail.apply(this, arguments);
      applyEvenSpacing();
      return result;
    };

    if (typeof renderDailyQuests === "function") {
      const baseRenderDailyQuests = renderDailyQuests;
      renderDailyQuests = function renderActionableDailyQuests() {
        const result = baseRenderDailyQuests.apply(this, arguments);
        makeDailyQuestsActionable();
        return result;
      };
    }

    applyEvenSpacing();
    makeDailyQuestsActionable();
    suppressDuplicateKeyDuringFlight();
    window.addEventListener("resize", applyEvenSpacing, {passive:true});
  }

  ensureTranslationGlossCompletion();
  ensureWordBreakdownCleanup();
  ensurePronounClarityAndQuestCollapse();
  ensurePromptDistinctionClarity();
  install();
})();
