(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestEvenProgressRailInstalled";

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
      const count = Math.max(1, nodes.length);

      nodes.forEach((node, index) => {
        const number = index + 2;
        node.style.left = `${(index + 1) / count * 100}%`;
        node.dataset.evenMilestone = String(number);
        node.classList.remove("progress-complete", "progress-approaching", "progress-future");
        node.classList.add(node.classList.contains("done")
          ? "progress-complete"
          : node.classList.contains("next")
            ? "progress-approaching"
            : "progress-future");

        const dot = node.querySelector(".mastery-dot");
        if (dot) dot.textContent = String(number);
      });

      const progress = visualProgress(totalLearningPoints(), milestones);
      const fill = host.querySelector(".mastery-track-fill");
      const marker = host.querySelector(".mastery-you");
      if (fill) fill.style.width = `${progress}%`;
      if (marker) marker.style.left = `${progress}%`;
      host.style.setProperty("--world-progress", `${progress}%`);
      host.dataset.evenSpacing = "true";
    }

    const baseRenderMasteryRail = renderMasteryRail;
    renderMasteryRail = function renderMasteryRailWithEvenMilestones() {
      const result = baseRenderMasteryRail.apply(this, arguments);
      applyEvenSpacing();
      return result;
    };

    applyEvenSpacing();
    window.addEventListener("resize", applyEvenSpacing, {passive:true});
  }

  install();
})();