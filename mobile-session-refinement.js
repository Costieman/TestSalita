(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestMobileSessionRefinementInstalled";
  const MOBILE_QUERY = "(max-width: 1000px)";
  const MORE_VIEWS = new Set(["audioReview", "skills", "boss", "progress", "badges", "settings"]);
  const RAIL_FREE_MOBILE_VIEWS = new Set(["review", "audioReview"]);
  const STAGE_LABELS = ["New", "Seen", "Familiar", "Usable", "Flexible", "Mastered"];
  let syncTimer = 0;

  function retryInstall() {
    window.setTimeout(installMobileSessionRefinement, 70);
  }

  function installMobileSessionRefinement() {
    try {
      if (
        typeof session === "undefined" ||
        typeof currentExercise === "undefined" ||
        typeof switchView !== "function" ||
        typeof renderMasteryRail !== "function" ||
        typeof renderExercise !== "function" ||
        typeof renderFeedback !== "function" ||
        typeof finishSession !== "function" ||
        typeof getItemState !== "function"
      ) {
        retryInstall();
        return;
      }
    } catch {
      retryInstall();
      return;
    }

    if (window[INSTALL_FLAG]) return;

    const media = window.matchMedia(MOBILE_QUERY);
    const learnView = document.getElementById("learnView");
    const lessonTopline = document.querySelector("#learnView .lesson-topline");
    const lessonProgress = document.querySelector("#learnView .lesson-progress-track");
    const feedbackBox = document.getElementById("feedbackBox");
    const mobileNav = document.querySelector(".mobile-nav");
    const masteryRail = document.querySelector(".mastery-rail-shell");
    if (!learnView || !lessonTopline || !lessonProgress || !feedbackBox || !mobileNav) {
      retryInstall();
      return;
    }

    window[INSTALL_FLAG] = true;

    const phraseMastery = document.createElement("section");
    phraseMastery.className = "mobile-phrase-mastery";
    phraseMastery.hidden = true;
    phraseMastery.setAttribute("aria-live", "polite");
    phraseMastery.innerHTML = `
      <div class="mobile-phrase-stage">
        <span>Phrase</span>
        <strong data-mobile-stage>New</strong>
      </div>
      <div class="mobile-phrase-steps" aria-label="Phrase mastery stages">
        ${[1, 2, 3, 4, 5].map(level => `<i data-mobile-mastery-step="${level}">${level}</i>`).join("")}
      </div>
      <div class="mobile-long-term">
        <span>Long-term</span>
        <strong data-mobile-long-term>0%</strong>
      </div>`;
    lessonProgress.insertAdjacentElement("afterend", phraseMastery);

    const originalProgressButton = mobileNav.querySelector('.mobile-nav-item[data-view="progress"]');
    if (originalProgressButton) {
      originalProgressButton.removeAttribute("data-view");
      originalProgressButton.dataset.mobileMore = "true";
      originalProgressButton.setAttribute("aria-label", "Open more sections");
      originalProgressButton.innerHTML = '<span class="mobile-nav-icon">•••</span><span>More</span>';
      originalProgressButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof openMobileMenu === "function") openMobileMenu();
      }, true);
    }

    function activeSession() {
      return Boolean(session && currentExercise && Array.isArray(session.queue) && session.queue.length);
    }

    function currentViewName() {
      return document.body.dataset.currentView || (typeof currentView === "string" ? currentView : "home");
    }

    function updateMoreNavigation(view = currentViewName()) {
      if (!originalProgressButton) return;
      originalProgressButton.classList.toggle("active", MORE_VIEWS.has(view));
    }

    function simplifyMobileRail() {
      const mobile = media.matches;
      document.querySelectorAll("#masteryMilestones .mastery-milestone").forEach((node, index) => {
        const number = index + 2;
        const dot = node.querySelector(".mastery-dot");
        if (!dot) return;
        dot.textContent = mobile ? String(number) : (node.classList.contains("done") ? "✓" : String(number));
        node.dataset.mobileMilestoneNumber = String(number);
      });
    }

    function updatePhraseMastery() {
      if (!media.matches || !activeSession()) {
        phraseMastery.hidden = true;
        return;
      }

      const itemId = currentExercise?.item?.id;
      if (!itemId || currentExercise?.item?.module === "boss") {
        phraseMastery.hidden = true;
        return;
      }

      let itemState;
      try {
        itemState = getItemState(itemId);
      } catch {
        phraseMastery.hidden = true;
        return;
      }

      const level = Math.max(0, Math.min(5, Number(itemState?.mastery || 0)));
      const longTerm = Math.max(0, Math.min(100, Math.round(Number(itemState?.longTermMastery || itemState?.durableMastery || 0))));
      phraseMastery.querySelector("[data-mobile-stage]").textContent = level ? `${level} ${STAGE_LABELS[level]}` : "New";
      phraseMastery.querySelector("[data-mobile-long-term]").textContent = `${longTerm}%`;
      phraseMastery.querySelectorAll("[data-mobile-mastery-step]").forEach(step => {
        const stepLevel = Number(step.dataset.mobileMasteryStep);
        step.classList.toggle("completed", stepLevel < level);
        step.classList.toggle("active", stepLevel === level);
      });
      phraseMastery.hidden = false;
    }

    function syncMobileState() {
      window.clearTimeout(syncTimer);
      const active = activeSession();
      const view = currentViewName();
      const activeMobileLesson = media.matches && active && view === "learn";
      document.body.classList.toggle("mobile-session-active", activeMobileLesson);
      document.body.classList.toggle("mobile-session-idle", media.matches && !active && view === "learn");
      learnView.classList.toggle("mobile-session-active", media.matches && active);
      learnView.classList.toggle("mobile-session-idle", media.matches && !active);

      if (masteryRail) {
        masteryRail.style.display = media.matches && RAIL_FREE_MOBILE_VIEWS.has(view) ? "none" : "";
      }

      const profileControl = document.querySelector(".sq-profile-control");
      if (profileControl) profileControl.style.display = activeMobileLesson ? "none" : "";

      const version = document.querySelector(".version-label");
      if (version) {
        version.textContent = document.body.dataset.course === "cebuano"
          ? "Bisaya Foundation 0.3 · Mobile Refined"
          : "Version 5.4.19 · Mobile Refined";
      }

      updateMoreNavigation(view);
      simplifyMobileRail();
      updatePhraseMastery();
    }

    function scheduleSync(delay = 0) {
      window.clearTimeout(syncTimer);
      syncTimer = window.setTimeout(syncMobileState, delay);
    }

    const baseRenderMasteryRail = renderMasteryRail;
    renderMasteryRail = function renderMasteryRailForMobile() {
      const result = baseRenderMasteryRail.apply(this, arguments);
      scheduleSync(0);
      return result;
    };

    const baseSwitchView = switchView;
    switchView = function switchViewWithMobileState(view) {
      const result = baseSwitchView.apply(this, arguments);
      scheduleSync(0);
      return result;
    };

    const baseRenderExercise = renderExercise;
    renderExercise = function renderExerciseForMobile() {
      const result = baseRenderExercise.apply(this, arguments);
      scheduleSync(0);
      return result;
    };

    const baseRenderFeedback = renderFeedback;
    renderFeedback = function renderFeedbackForMobile() {
      const result = baseRenderFeedback.apply(this, arguments);
      scheduleSync(20);
      if (media.matches) window.setTimeout(() => feedbackBox.scrollIntoView({block:"nearest", behavior:"smooth"}), 80);
      return result;
    };

    const baseFinishSession = finishSession;
    finishSession = function finishSessionForMobile() {
      const result = baseFinishSession.apply(this, arguments);
      scheduleSync(0);
      return result;
    };

    media.addEventListener?.("change", () => scheduleSync(20));
    window.addEventListener("resize", () => scheduleSync(20), {passive:true});
    scheduleSync(0);
  }

  installMobileSessionRefinement();
})();