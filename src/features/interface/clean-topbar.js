(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestCleanTopbarInstalled";
  const STYLESHEETS = [
    {id:"salita-topbar-world-progress-hotfix",href:"topbar-world-progress-hotfix.css?v=5.5.10.1"},
    {id:"salita-mobile-world-progress-flow",href:"mobile-world-progress-flow.css?v=5.5.10.2"}
  ];

  function ensureStylesheet() {
    STYLESHEETS.forEach(({id,href}) => {
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });
  }

  function retryInstall() {
    window.setTimeout(installCleanTopbar, 60);
  }

  function directChild(parent, selector) {
    return [...(parent?.children || [])].find(child => child.matches?.(selector)) || null;
  }

  function structureMasteryShell() {
    const shell = document.querySelector(".mastery-rail-shell");
    if (!shell) return false;

    const milestones = directChild(shell, ".mastery-milestones") || shell.querySelector(".mastery-milestones");
    const heading = directChild(shell, ".mastery-rail-heading");
    let summary = directChild(shell, ".mastery-summary-compact");
    let nextCopy = directChild(shell, ".mastery-next-copy");

    if (!milestones) return false;

    if (heading) {
      const renderedSummary = heading.firstElementChild;
      const renderedNextCopy = heading.querySelector(".mastery-next-copy");

      if (renderedSummary) {
        if (summary && summary !== renderedSummary) summary.remove();
        summary = renderedSummary;
      }
      if (renderedNextCopy) {
        if (nextCopy && nextCopy !== renderedNextCopy) nextCopy.remove();
        nextCopy = renderedNextCopy;
      }

      if (summary) {
        summary.classList.add("mastery-summary-compact");
        shell.insertBefore(summary, milestones);
      }
      if (nextCopy) {
        shell.insertBefore(nextCopy, milestones.nextSibling);
      }
      heading.remove();
    }

    summary = directChild(shell, ".mastery-summary-compact") || summary;
    nextCopy = directChild(shell, ".mastery-next-copy") || nextCopy;
    if (!summary || !nextCopy) return false;

    [...shell.querySelectorAll(":scope > .mastery-summary-compact")]
      .filter(node => node !== summary)
      .forEach(node => node.remove());
    [...shell.querySelectorAll(":scope > .mastery-next-copy")]
      .filter(node => node !== nextCopy)
      .forEach(node => node.remove());

    summary.classList.add("mastery-summary-compact");
    shell.insertBefore(summary, milestones);
    shell.insertBefore(nextCopy, milestones.nextSibling);
    shell.dataset.compactMastery = "true";
    return true;
  }

  function ensurePointsLabel(summary, points) {
    if (!summary) return;
    let value = summary.querySelector(".mastery-points-compact");
    if (!value) {
      value = document.createElement("span");
      value.className = "mastery-points-compact";
      summary.appendChild(value);
    }
    value.textContent = `${points} MP`;
  }

  function compactMasteryCopy() {
    if (!structureMasteryShell()) return;

    const shell = document.querySelector(".mastery-rail-shell");
    const summary = directChild(shell, ".mastery-summary-compact");
    const title = document.getElementById("masteryRailTitle");
    const nextRegion = document.getElementById("masteryNextRegion");
    const nextText = document.getElementById("masteryNextText");

    const points = typeof totalLearningPoints === "function"
      ? totalLearningPoints()
      : Number((title?.textContent.match(/\d+/) || [0])[0]);

    if (title) title.textContent = "World Progress";
    ensurePointsLabel(summary, points);

    if (!nextRegion || !nextText) return;

    const currentRegion = nextRegion.textContent.trim();
    if (/all current regions unlocked/i.test(currentRegion) || /all regions unlocked/i.test(currentRegion)) {
      nextRegion.textContent = "All regions unlocked";
      nextText.textContent = "Keep building durable recall";
      return;
    }

    const regionName = currentRegion
      .replace(/^Next unlock\s*[·:-]\s*/i, "")
      .replace(/^Next\s*[·:-]\s*/i, "")
      .trim();
    const remaining = (nextText.textContent.match(/\d+/) || [""])[0];

    if (regionName) nextRegion.textContent = regionName;
    if (remaining) nextText.textContent = `${remaining} MP to go`;
  }

  function installCleanTopbar() {
    ensureStylesheet();
    try {
      if (typeof renderMasteryRail !== "function" || !document.querySelector(".mastery-rail-shell")) {
        retryInstall();
        return;
      }
    } catch {
      retryInstall();
      return;
    }

    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;

    const baseRenderMasteryRail = renderMasteryRail;
    renderMasteryRail = function renderMasteryRailWithCompactCopy() {
      const result = baseRenderMasteryRail.apply(this, arguments);
      compactMasteryCopy();
      return result;
    };

    compactMasteryCopy();
  }

  ensureStylesheet();
  installCleanTopbar();
})();
