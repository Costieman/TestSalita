(() => {
  "use strict";

  const CUMULATIVE_UNLOCK_PERCENT = 75;
  const MAX_ITEM_MASTERY = 5;

  function peakMastery(itemId) {
    const itemState = state.itemState[itemId] || {};
    const current = Number(itemState.mastery || 0);
    const peak = Number(itemState.peakMastery ?? itemState.highestMastery ?? current);
    return Math.max(0, Math.min(MAX_ITEM_MASTERY, Math.max(current, peak)));
  }

  function priorItemsFor(moduleOrIndex) {
    const index = typeof moduleOrIndex === "number"
      ? moduleOrIndex
      : MODULES.findIndex(module => module.id === moduleOrIndex?.id);
    const priorIds = new Set(MODULES.slice(0, Math.max(0, index)).map(module => module.id));
    return ITEMS.filter(item => priorIds.has(item.module));
  }

  function cumulativeUnlockStats(moduleOrIndex) {
    const index = typeof moduleOrIndex === "number"
      ? moduleOrIndex
      : MODULES.findIndex(module => module.id === moduleOrIndex?.id);

    if (index <= 0) {
      return {
        index: 0,
        earned: 0,
        maximum: 0,
        required: 0,
        remaining: 0,
        percent: 100,
        unlocked: true,
        priorModules: []
      };
    }

    const priorModules = MODULES.slice(0, index);
    const items = priorItemsFor(index);
    const maximum = items.length * MAX_ITEM_MASTERY;
    const earned = items.reduce((sum, item) => sum + peakMastery(item.id), 0);
    const required = Math.ceil(maximum * CUMULATIVE_UNLOCK_PERCENT / 100);
    const percent = maximum ? Math.round(earned / maximum * 100) : 100;

    return {
      index,
      earned,
      maximum,
      required,
      remaining: Math.max(0, required - earned),
      percent,
      unlocked: earned >= required,
      priorModules
    };
  }

  function totalPeakMasteryPoints() {
    return ITEMS.reduce((sum, item) => sum + peakMastery(item.id), 0);
  }

  function regionName(module) {
    return MODULE_META[module.id]?.region || module.title;
  }

  MODULES.forEach((module, index) => {
    module.unlockAt = cumulativeUnlockStats(index).required;
  });

  unlockedModules = function unlockedModulesByCumulativeMastery() {
    const open = [MODULES[0]];
    for (let index = 1; index < MODULES.length; index += 1) {
      const stats = cumulativeUnlockStats(index);
      if (!stats.unlocked) break;
      open.push(MODULES[index]);
    }
    return open;
  };

  isModuleUnlocked = function isModuleUnlockedByCumulativeMastery(module) {
    const index = MODULES.findIndex(candidate => candidate.id === module?.id);
    return index === 0 || (index > 0 && cumulativeUnlockStats(index).unlocked && unlockedModules().some(candidate => candidate.id === module.id));
  };

  renderMasteryRail = function renderCumulativeMasteryRail() {
    const host = document.getElementById("masteryMilestones");
    if (!host) return;

    const points = totalPeakMasteryPoints();
    const milestones = MODULES.slice(1);
    const finalRequirement = cumulativeUnlockStats(MODULES.length - 1).required || 1;
    const next = milestones.find(module => !isModuleUnlocked(module));
    const title = document.getElementById("masteryRailTitle");
    const nextRegion = document.getElementById("masteryNextRegion");
    const nextText = document.getElementById("masteryNextText");

    if (title) title.textContent = `${points} Mastery Point${points === 1 ? "" : "s"}`;

    if (next) {
      const stats = cumulativeUnlockStats(next);
      if (nextRegion) nextRegion.textContent = `Next unlock · ${regionName(next)}`;
      if (nextText) {
        nextText.textContent = `${stats.percent}% cumulative mastery across earlier regions · ${stats.remaining} MP needed to reach ${CUMULATIVE_UNLOCK_PERCENT}%.`;
      }
    } else {
      if (nextRegion) nextRegion.textContent = "All current regions unlocked";
      if (nextText) nextText.textContent = "Every region threshold has reached 75% cumulative mastery.";
    }

    const trackProgress = Math.min(100, points / finalRequirement * 100);
    host.innerHTML = `<div class="mastery-track"><span class="mastery-track-fill" style="width:${trackProgress}%"></span><span class="mastery-you" style="left:${trackProgress}%" aria-hidden="true"></span></div>` +
      milestones.map((module, milestoneIndex) => {
        const stats = cumulativeUnlockStats(module);
        const done = isModuleUnlocked(module);
        const isNext = next?.id === module.id;
        const left = Math.min(100, stats.required / finalRequirement * 100);
        const earlierRegions = stats.priorModules.map(regionName).join(" + ");
        return `<button class="mastery-milestone ${done ? "done" : ""} ${isNext ? "next" : ""}" type="button" style="left:${left}%" data-masterytip="${module.id}" role="listitem" title="${regionName(module)} opens at ${CUMULATIVE_UNLOCK_PERCENT}% cumulative mastery across ${earlierRegions}"><span class="mastery-dot">${done ? "✓" : milestoneIndex + 2}</span><span class="mastery-label">${regionName(module)}</span><small>${stats.required} MP · ${CUMULATIVE_UNLOCK_PERCENT}%</small></button>`;
      }).join("");

    host.querySelectorAll("[data-masterytip]").forEach(button => button.addEventListener("click", () => {
      const module = moduleById(button.dataset.masterytip);
      const stats = cumulativeUnlockStats(module);
      const earlierRegions = stats.priorModules.map(regionName).join(" + ");
      toast(`${regionName(module)}: ${stats.percent}% of the required cumulative mastery across ${earlierRegions}. Target: ${CUMULATIVE_UNLOCK_PERCENT}%.`);
    }));
  };

  window.salitaUnlockProgress = moduleId => {
    const module = moduleById(moduleId);
    return module ? cumulativeUnlockStats(module) : null;
  };

  if (typeof updateAll === "function") updateAll();
})();
