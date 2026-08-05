(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestMasteryFeedbackInstalled";
  const MIN_DURABLE_GAP_MS = 3 * 24 * 60 * 60 * 1000;
  const STAGES = [
    {level:1,label:"Seen"},
    {level:2,label:"Familiar"},
    {level:3,label:"Usable"},
    {level:4,label:"Flexible"},
    {level:5,label:"Mastered"}
  ];

  let latestTransition = null;
  let stageTimer = null;

  function retryInstall() {
    window.setTimeout(installMasteryFeedback, 60);
  }

  function installMasteryFeedback() {
    try {
      if (
        typeof state === "undefined" ||
        typeof getItemState !== "function" ||
        typeof recordExposure !== "function" ||
        typeof updateSRS !== "function" ||
        typeof renderExercise !== "function" ||
        typeof renderFeedback !== "function"
      ) {
        retryInstall();
        return;
      }
    } catch {
      retryInstall();
      return;
    }

    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, Number(value) || 0));
    }

    function ensureRetentionState(itemState) {
      if (!itemState) return itemState;
      itemState.longTermMastery = clamp(itemState.longTermMastery ?? itemState.durableMastery ?? 0, 0, 100);
      itemState.longTermRecalls = Math.max(0, Number(itemState.longTermRecalls || 0));
      itemState.lastLongTermGainAt = itemState.lastLongTermGainAt || null;
      return itemState;
    }

    Object.values(state.itemState || {}).forEach(ensureRetentionState);

    const baseGetItemState = getItemState;
    getItemState = function getItemStateWithRetention(id) {
      return ensureRetentionState(baseGetItemState(id));
    };

    function retentionGainForGap(gapMs) {
      const day = 24 * 60 * 60 * 1000;
      if (gapMs < MIN_DURABLE_GAP_MS) return 0;
      if (gapMs >= 30 * day) return 25;
      if (gapMs >= 14 * day) return 20;
      if (gapMs >= 7 * day) return 15;
      return 10;
    }

    function formatGap(gapMs) {
      const hours = Math.max(1, Math.round(gapMs / (60 * 60 * 1000)));
      if (hours < 24) return `${hours} hours`;
      const days = Math.max(1, Math.round(hours / 24));
      return `${days} day${days === 1 ? "" : "s"}`;
    }

    function buildTransition(itemId, before, after, correct, priorLastReviewed, beforeLongTerm, afterLongTerm, gain = 0, loss = 0) {
      return {
        itemId,
        before,
        after,
        correct,
        gapMs: priorLastReviewed ? Math.max(0, Date.now() - priorLastReviewed) : 0,
        beforeLongTerm,
        afterLongTerm,
        gain,
        loss
      };
    }

    const baseRecordExposure = recordExposure;
    recordExposure = function recordExposureWithMasteryFeedback(itemId) {
      const beforeState = ensureRetentionState(getItemState(itemId));
      const before = Number(beforeState.mastery || 0);
      const beforeLongTerm = Number(beforeState.longTermMastery || 0);
      const result = baseRecordExposure(itemId);
      const afterState = ensureRetentionState(getItemState(itemId));
      latestTransition = buildTransition(
        itemId,
        before,
        Number(afterState.mastery || 0),
        true,
        null,
        beforeLongTerm,
        Number(afterState.longTermMastery || 0)
      );
      return result;
    };

    const baseUpdateSRS = updateSRS;
    updateSRS = function updateSRSWithLongTermMastery(itemId, correct) {
      const beforeState = ensureRetentionState(getItemState(itemId));
      const before = Number(beforeState.mastery || 0);
      const beforeLongTerm = Number(beforeState.longTermMastery || 0);
      const priorLastReviewed = Number(beforeState.lastReviewed || 0) || null;
      const gapMs = priorLastReviewed ? Math.max(0, Date.now() - priorLastReviewed) : 0;

      const result = baseUpdateSRS(itemId, correct);
      const afterState = ensureRetentionState(getItemState(itemId));
      let gain = 0;
      let loss = 0;

      if (priorLastReviewed && gapMs >= MIN_DURABLE_GAP_MS) {
        if (correct) {
          gain = retentionGainForGap(gapMs);
          afterState.longTermMastery = clamp(beforeLongTerm + gain, 0, 100);
          afterState.longTermRecalls += 1;
          afterState.lastLongTermGainAt = Date.now();
        } else {
          loss = Math.min(8, beforeLongTerm);
          afterState.longTermMastery = clamp(beforeLongTerm - loss, 0, 100);
        }
      }

      latestTransition = buildTransition(
        itemId,
        before,
        Number(afterState.mastery || 0),
        correct,
        priorLastReviewed,
        beforeLongTerm,
        Number(afterState.longTermMastery || 0),
        gain,
        loss
      );
      latestTransition.gapMs = gapMs;
      return result;
    };

    function stageName(level) {
      return STAGES.find(stage => stage.level === Number(level))?.label || "Not started";
    }

    function longTermStage(score) {
      if (score >= 100) return "True mastery";
      if (score >= 80) return "Strong retention";
      if (score >= 60) return "Durable";
      if (score >= 40) return "Retained";
      if (score >= 20) return "Remembered";
      return "Building";
    }

    function ensureMasteryInterface() {
      const panel = document.querySelector("#learnView .session-panel");
      const list = panel?.querySelector(".mastery-list");
      if (!panel || !list) return null;

      if (!list.classList.contains("mastery-stage-bar")) {
        list.classList.add("mastery-stage-bar");
        list.innerHTML = STAGES.map(stage => `
          <span data-mastery-level="${stage.level}">
            <b>${stage.level}</b>
            <small>${stage.label}</small>
          </span>`).join("");
      }

      let transitionNote = panel.querySelector(".mastery-transition-note");
      if (!transitionNote) {
        transitionNote = document.createElement("div");
        transitionNote.className = "mastery-transition-note";
        list.insertAdjacentElement("afterend", transitionNote);
      }

      let longTerm = panel.querySelector(".long-term-mastery-card");
      if (!longTerm) {
        longTerm = document.createElement("section");
        longTerm.className = "long-term-mastery-card";
        longTerm.setAttribute("aria-label", "Long-term phrase mastery");
        longTerm.innerHTML = `
          <div class="long-term-mastery-head">
            <div><strong>Long-term mastery</strong><small class="long-term-stage">Building</small></div>
            <b class="long-term-score">0%</b>
          </div>
          <div class="long-term-mastery-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <span class="long-term-mastery-fill"></span>
            <i style="left:20%"></i><i style="left:40%"></i><i style="left:60%"></i><i style="left:80%"></i>
          </div>
          <p class="long-term-mastery-note">Built only by correct recall after 3+ days away.</p>`;
        transitionNote.insertAdjacentElement("afterend", longTerm);
      }

      return {panel, list, transitionNote, longTerm};
    }

    function applyStageState(list, level, animationClass = "") {
      list.querySelectorAll("[data-mastery-level]").forEach(node => {
        const nodeLevel = Number(node.dataset.masteryLevel);
        node.classList.remove("completed", "active", "mastery-stage-arrive", "mastery-stage-leave", "mastery-stage-drop");
        if (nodeLevel < level) node.classList.add("completed");
        if (nodeLevel === level) node.classList.add("active");
      });
      if (animationClass && level > 0) {
        const active = list.querySelector(`[data-mastery-level="${level}"]`);
        active?.classList.add(animationClass);
      }
    }

    function updateLongTermCard(card, score, transition = null) {
      const safeScore = clamp(score, 0, 100);
      const fill = card.querySelector(".long-term-mastery-fill");
      const track = card.querySelector(".long-term-mastery-track");
      const scoreLabel = card.querySelector(".long-term-score");
      const stageLabel = card.querySelector(".long-term-stage");
      const note = card.querySelector(".long-term-mastery-note");
      const from = transition ? clamp(transition.beforeLongTerm, 0, 100) : safeScore;

      card.classList.remove("retention-gain", "retention-loss", "true-mastery");
      fill.style.width = `${from}%`;
      void fill.offsetWidth;
      fill.style.width = `${safeScore}%`;
      track.setAttribute("aria-valuenow", String(Math.round(safeScore)));
      scoreLabel.textContent = `${Math.round(safeScore)}%`;
      stageLabel.textContent = longTermStage(safeScore);

      if (safeScore >= 100) card.classList.add("true-mastery");

      if (transition?.gain) {
        card.classList.add("retention-gain");
        note.textContent = `+${transition.gain}% after ${formatGap(transition.gapMs)} away.`;
      } else if (transition?.loss) {
        card.classList.add("retention-loss");
        note.textContent = `Spaced recall missed · ${transition.loss}% adjustment.`;
      } else if (transition?.correct && transition.gapMs > 0 && transition.gapMs < MIN_DURABLE_GAP_MS) {
        note.textContent = "Current-stage practice; lasting progress starts after 3 days away.";
      } else if (safeScore >= 100) {
        note.textContent = "Repeatedly recalled after meaningful time away.";
      } else {
        note.textContent = "Built only by correct recall after 3+ days away.";
      }
    }

    function renderMasteryFeedback(transition = null) {
      const ui = ensureMasteryInterface();
      const itemId = currentExercise?.item?.id;
      if (!ui || !itemId) return;
      const itemState = ensureRetentionState(getItemState(itemId));
      const currentLevel = clamp(itemState.mastery, 0, 5);
      const matchingTransition = transition?.itemId === itemId ? transition : null;

      window.clearTimeout(stageTimer);
      ui.transitionNote.className = "mastery-transition-note";

      if (matchingTransition && matchingTransition.before !== matchingTransition.after) {
        applyStageState(ui.list, matchingTransition.before);
        const oldStage = ui.list.querySelector(`[data-mastery-level="${matchingTransition.before}"]`);
        oldStage?.classList.add("mastery-stage-leave");
        ui.transitionNote.textContent = `${stageName(matchingTransition.before)} → ${stageName(matchingTransition.after)}`;
        ui.transitionNote.classList.add(matchingTransition.after > matchingTransition.before ? "mastery-up" : "mastery-down");
        stageTimer = window.setTimeout(() => {
          applyStageState(
            ui.list,
            matchingTransition.after,
            matchingTransition.after > matchingTransition.before ? "mastery-stage-arrive" : "mastery-stage-drop"
          );
        }, 260);
      } else {
        applyStageState(ui.list, currentLevel);
        if (matchingTransition?.correct) {
          ui.transitionNote.textContent = `${stageName(currentLevel)} reinforced`;
          ui.transitionNote.classList.add("mastery-reinforced");
        } else {
          ui.transitionNote.textContent = currentLevel ? `This phrase is ${stageName(currentLevel)}.` : "This phrase is new.";
        }
      }

      updateLongTermCard(ui.longTerm, itemState.longTermMastery, matchingTransition);
    }

    const baseRenderExercise = renderExercise;
    renderExercise = function renderExerciseWithMasteryFeedback(exercise) {
      latestTransition = null;
      const result = baseRenderExercise(exercise);
      renderMasteryFeedback();
      return result;
    };

    const baseRenderFeedback = renderFeedback;
    renderFeedback = function renderFeedbackWithMasteryProgress(correct, xpGain, customTitle = null) {
      const result = baseRenderFeedback(correct, xpGain, customTitle);
      renderMasteryFeedback(latestTransition);
      return result;
    };

    renderMasteryFeedback();
  }

  installMasteryFeedback();
})();