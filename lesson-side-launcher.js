(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestLessonSideLauncherInstalled";
  const DESKTOP_QUERY = "(min-width: 1001px)";
  let syncTimer = 0;

  function retryInstall() {
    window.setTimeout(installLessonSideLauncher, 70);
  }

  function installLessonSideLauncher() {
    try {
      if (
        typeof session === "undefined" ||
        typeof currentExercise === "undefined" ||
        typeof startSession !== "function" ||
        typeof switchView !== "function" ||
        typeof renderExercise !== "function" ||
        typeof renderFeedback !== "function" ||
        typeof finishSession !== "function"
      ) {
        retryInstall();
        return;
      }
    } catch {
      retryInstall();
      return;
    }

    if (window[INSTALL_FLAG]) return;

    const learnView = document.getElementById("learnView");
    const lessonCard = document.getElementById("lessonCard");
    const lessonContent = lessonCard?.querySelector(".lesson-content");
    const panel = learnView?.querySelector(".session-panel");
    const audioButton = document.getElementById("audioBtn");
    if (!learnView || !lessonCard || !lessonContent || !panel || !audioButton) {
      retryInstall();
      return;
    }

    window[INSTALL_FLAG] = true;

    const launcher = document.createElement("section");
    launcher.className = "lesson-mode-launcher";
    launcher.setAttribute("aria-label", "Choose a practice mode");
    launcher.innerHTML = `
      <p class="eyebrow">Start practising</p>
      <h3>Choose a session</h3>
      <div class="lesson-launcher-tabs" role="tablist" aria-label="Practice mode">
        <button class="lesson-launcher-tab active" type="button" role="tab" aria-selected="true" data-launch-tab="daily">Daily Session</button>
        <button class="lesson-launcher-tab" type="button" role="tab" aria-selected="false" data-launch-tab="quick">Quick Review</button>
      </div>
      <div class="lesson-launcher-panel active" role="tabpanel" data-launch-panel="daily">
        <div class="lesson-launcher-icon" aria-hidden="true">✣</div>
        <strong>Continue your learning path</strong>
        <p>Mix due review, familiar phrases, and a manageable amount of new language.</p>
        <button class="lesson-launcher-start primary-btn" type="button" data-start-mode="daily">Start Daily Session</button>
      </div>
      <div class="lesson-launcher-panel" role="tabpanel" data-launch-panel="quick" hidden>
        <div class="lesson-launcher-icon" aria-hidden="true">⚡</div>
        <strong>Strengthen learned phrases</strong>
        <p>Use active recall without introducing unseen material.</p>
        <label class="lesson-launcher-length">
          <span>Review length</span>
          <select aria-label="Quick Review length">
            <option value="3">3 questions</option>
            <option value="4">4 questions</option>
            <option value="6">6 questions</option>
            <option value="8">8 questions</option>
            <option value="12">12 questions</option>
            <option value="15">15 questions</option>
            <option value="20">20 questions</option>
          </select>
        </label>
        <button class="lesson-launcher-start primary-btn" type="button" data-start-mode="quick">Start Quick Review</button>
      </div>`;
    panel.insertBefore(launcher, panel.firstChild);

    const emptyState = document.createElement("section");
    emptyState.className = "lesson-empty-state";
    emptyState.setAttribute("aria-live", "polite");
    emptyState.innerHTML = `
      <div class="lesson-empty-symbol" aria-hidden="true">S★</div>
      <p class="eyebrow">Practice centre</p>
      <h3>Choose your next session</h3>
      <p>Use the panel to begin a Daily Session or a focused Quick Review.</p>`;
    lessonContent.appendChild(emptyState);

    const quickLength = launcher.querySelector(".lesson-launcher-length select");
    try {
      quickLength.value = String(state.settings?.quickReviewLength || 4);
    } catch {
      quickLength.value = "4";
    }

    function setLauncherTab(mode) {
      launcher.querySelectorAll("[data-launch-tab]").forEach(button => {
        const active = button.dataset.launchTab === mode;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });
      launcher.querySelectorAll("[data-launch-panel]").forEach(content => {
        const active = content.dataset.launchPanel === mode;
        content.classList.toggle("active", active);
        content.hidden = !active;
      });
    }

    launcher.addEventListener("click", event => {
      const tab = event.target.closest("[data-launch-tab]");
      if (tab) {
        setLauncherTab(tab.dataset.launchTab);
        return;
      }

      const start = event.target.closest("[data-start-mode]");
      if (!start) return;
      start.disabled = true;
      const mode = start.dataset.startMode;
      if (mode === "quick") {
        const length = Math.max(1, Number(quickLength.value) || 4);
        try {
          state.settings.quickReviewLength = length;
          saveState?.();
        } catch {}
        startSession("quick", false, {length});
      } else {
        startSession("daily");
      }
      window.setTimeout(() => {
        start.disabled = false;
        syncSidePanel();
      }, 80);
    });

    function activeSession() {
      return Boolean(session && currentExercise && Array.isArray(session.queue) && session.queue.length);
    }

    function phraseForCurrentExercise() {
      const item = currentExercise?.item || {};
      return String(currentExercise?.audio || item.example || item.term || item.root || currentExercise?.answers?.[0] || "").trim();
    }

    function answerHasBeenGiven() {
      const nextButton = document.getElementById("nextBtn");
      const feedback = document.getElementById("feedbackBox");
      return Boolean(
        (nextButton && !nextButton.classList.contains("hidden")) ||
        (feedback && !feedback.classList.contains("hidden")) ||
        sentenceBuilderState?.locked
      );
    }

    function isEnglishToFilipinoProduction() {
      if (!currentExercise?.sentenceBuilder) return false;
      return !/listen and build/i.test(String(currentExercise.type || ""));
    }

    function placeAudioButton() {
      if (!activeSession()) {
        audioButton.classList.add("hidden");
        audioButton.dataset.text = "";
        audioButton.classList.remove("lesson-audio-square");
        return;
      }

      const phrase = phraseForCurrentExercise();
      const answered = answerHasBeenGiven();
      const productionBeforeAnswer = isEnglishToFilipinoProduction() && !answered;
      const explicitlyAvailableBeforeAnswer = Boolean(currentExercise?.audio);
      const shouldShow = Boolean(phrase) && (answered || (!productionBeforeAnswer && explicitlyAvailableBeforeAnswer));

      if (!shouldShow) {
        audioButton.classList.add("hidden");
        audioButton.dataset.text = "";
        audioButton.classList.remove("lesson-audio-square");
        return;
      }

      audioButton.dataset.text = phrase;
      audioButton.classList.remove("hidden");
      audioButton.setAttribute("aria-label", answered
        ? "Hear pronunciation of the answer"
        : "Hear pronunciation of the current phrase");
      audioButton.textContent = answered ? "🔊 Hear the answer" : "🔊 Hear pronunciation";

      if (!window.matchMedia(DESKTOP_QUERY).matches) {
        audioButton.classList.remove("lesson-audio-square");
        return;
      }

      const longTerm = panel.querySelector(".long-term-mastery-card");
      if (longTerm && audioButton.previousElementSibling !== longTerm) {
        longTerm.insertAdjacentElement("afterend", audioButton);
      }
      audioButton.classList.add("lesson-audio-square");
    }

    function syncSidePanel() {
      window.clearTimeout(syncTimer);
      const active = activeSession();
      learnView.classList.toggle("lesson-session-active", active);
      learnView.classList.toggle("lesson-session-idle", !active);
      panel.classList.toggle("session-console-active", active);
      panel.classList.toggle("session-console-idle", !active);
      launcher.hidden = active;
      emptyState.hidden = active;
      placeAudioButton();
    }

    function scheduleSync(delay = 0) {
      window.clearTimeout(syncTimer);
      syncTimer = window.setTimeout(syncSidePanel, delay);
    }

    const baseStartSession = startSession;
    startSession = function startSessionWithContextualConsole() {
      const result = baseStartSession.apply(this, arguments);
      scheduleSync(30);
      return result;
    };

    const baseRenderExercise = renderExercise;
    renderExercise = function renderExerciseWithContextualConsole() {
      const result = baseRenderExercise.apply(this, arguments);
      scheduleSync(0);
      return result;
    };

    const baseRenderFeedback = renderFeedback;
    renderFeedback = function renderFeedbackWithPersistentPronunciation() {
      const result = baseRenderFeedback.apply(this, arguments);
      scheduleSync(0);
      return result;
    };

    const baseFinishSession = finishSession;
    finishSession = function finishSessionWithIdleLauncher() {
      const result = baseFinishSession.apply(this, arguments);
      scheduleSync(0);
      return result;
    };

    const baseSwitchView = switchView;
    switchView = function switchViewWithLessonLauncher(view) {
      const result = baseSwitchView.apply(this, arguments);
      if (view === "learn") scheduleSync(20);
      return result;
    };

    const observer = new MutationObserver(() => scheduleSync(10));
    observer.observe(panel, {childList:true, subtree:true, attributes:true, attributeFilter:["class"]});

    const media = window.matchMedia(DESKTOP_QUERY);
    media.addEventListener?.("change", () => scheduleSync(30));
    window.addEventListener("resize", () => scheduleSync(30), {passive:true});

    syncSidePanel();
  }

  installLessonSideLauncher();
})();